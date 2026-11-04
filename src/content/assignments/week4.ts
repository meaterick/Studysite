import type { AssignmentSpec } from "../types";

// 4주차 과제: 정규화·일반화 기법의 효과를 통제된 ablation 실험으로 확인하고, 합성곱 층을 직접 구현한다.
// 원래 CIFAR-10 + GPU로 하던 실험을, 브라우저에서 몇 초 만에 도는 NumPy 신경망(MLP)과 손글씨 숫자(8×8) 데이터로 옮겼다.
// BatchNorm·Dropout·데이터 증강·weight decay·초기화·학습률 같은 비교 대상은 그대로다. MLP에는 CNN의 귀납편향이 없으므로
// 합성곱의 성질(출력 크기, 파라미터 공유, 평행이동 등변성)은 별도의 필수 과제(conv)에서 확인한다.
const ENGINE = `import numpy as np, time
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

digits = load_digits()
X_all = digits.images / 16.0                 # (1797, 8, 8), 0~1
y_all = digits.target
X_rest, X_test, y_rest, y_test = train_test_split(X_all, y_all, test_size=0.25, stratify=y_all, random_state=0)
# 일반화 기법의 효과가 드러나도록 훈련 데이터를 500장으로 줄입니다.
X_train, X_val, y_train, y_val = train_test_split(X_rest, y_rest, train_size=500, stratify=y_rest, random_state=0)
print("train", X_train.shape, "val", X_val.shape, "test", X_test.shape)

BASE = dict(hidden=(128, 64), batchnorm=True, dropout=0.2, augment=True,
            lr=0.05, momentum=0.9, weight_decay=1e-4, init="he", epochs=60, batch=32, seed=0)

def augment_batch(xb, rng):
    """이미지마다 상하좌우로 최대 1픽셀 무작위 이동(빈칸은 0)."""
    padded = np.pad(xb, ((0, 0), (1, 1), (1, 1)))
    out = np.empty_like(xb)
    for i in range(len(xb)):
        dy, dx = rng.integers(0, 3, 2)
        out[i] = padded[i, dy:dy + 8, dx:dx + 8]
    return out

def init_params(cfg, rng):
    sizes = [64, *cfg["hidden"], 10]
    P = {}
    for i in range(len(sizes) - 1):
        last = i == len(sizes) - 2
        # 출력층은 작게 초기화해 첫 예측이 균등분포에 가깝게 합니다(초기 손실 ≈ ln 10).
        std = 0.01 if (last or cfg["init"] != "he") else np.sqrt(2 / sizes[i])
        P[f"W{i}"] = rng.normal(0, std, (sizes[i], sizes[i + 1]))
        P[f"b{i}"] = np.zeros(sizes[i + 1])
        if i < len(sizes) - 2:
            P[f"g{i}"] = np.ones(sizes[i + 1])
            P[f"be{i}"] = np.zeros(sizes[i + 1])
    return P

def forward(P, X, cfg, train, stats, rng):
    """train=True면 배치 통계로 BatchNorm, Dropout 적용 / False면 이동 평균 통계, Dropout 끔 (PyTorch의 eval 모드)."""
    h = X.reshape(len(X), -1)
    n_hidden = len(cfg["hidden"])
    cache = []
    for i in range(n_hidden):
        c = {"h_in": h}
        z = h @ P[f"W{i}"] + P[f"b{i}"]
        if cfg["batchnorm"]:
            if train:
                mu, var = z.mean(0), z.var(0)
                stats[f"mu{i}"] = 0.9 * stats.get(f"mu{i}", mu) + 0.1 * mu
                stats[f"var{i}"] = 0.9 * stats.get(f"var{i}", var) + 0.1 * var
            else:
                mu, var = stats.get(f"mu{i}", z.mean(0)), stats.get(f"var{i}", z.var(0))
            c["inv_std"] = 1 / np.sqrt(var + 1e-5)
            c["z_hat"] = (z - mu) * c["inv_std"]
            z = P[f"g{i}"] * c["z_hat"] + P[f"be{i}"]
        c["z"] = z
        h = np.maximum(0, z)
        if train and cfg["dropout"] > 0:
            c["mask"] = (rng.random(h.shape) > cfg["dropout"]) / (1 - cfg["dropout"])
            h = h * c["mask"]
        cache.append(c)
    logits = h @ P[f"W{n_hidden}"] + P[f"b{n_hidden}"]
    return logits, cache, h

def softmax_ce(logits, y):
    z = logits - logits.max(1, keepdims=True)
    p = np.exp(z)
    p /= p.sum(1, keepdims=True)
    loss = -np.mean(np.log(p[np.arange(len(y)), y] + 1e-12))
    return loss, p

def backward(P, cache, h_last, p, y, cfg):
    n_hidden, B = len(cfg["hidden"]), len(y)
    G = {}
    d = p.copy()
    d[np.arange(B), y] -= 1
    d /= B
    G[f"W{n_hidden}"] = h_last.T @ d
    G[f"b{n_hidden}"] = d.sum(0)
    dh = d @ P[f"W{n_hidden}"].T
    for i in reversed(range(n_hidden)):
        c = cache[i]
        if "mask" in c:
            dh = dh * c["mask"]
        dz = dh * (c["z"] > 0)
        if cfg["batchnorm"]:
            G[f"g{i}"] = (dz * c["z_hat"]).sum(0)
            G[f"be{i}"] = dz.sum(0)
            dzh = dz * P[f"g{i}"]
            dz = c["inv_std"] / B * (B * dzh - dzh.sum(0) - c["z_hat"] * (dzh * c["z_hat"]).sum(0))
        G[f"W{i}"] = c["h_in"].T @ dz
        G[f"b{i}"] = dz.sum(0)
        dh = dz @ P[f"W{i}"].T
    for k in G:
        if k.startswith("W"):
            G[k] += cfg["weight_decay"] * P[k]
    return G

def evaluate(P, stats, cfg, X, y):
    logits, _, _ = forward(P, X, cfg, train=False, stats=stats, rng=None)
    loss, p = softmax_ce(logits, y)
    return loss, np.mean(p.argmax(1) == y), p.argmax(1)

def train(**overrides):
    cfg = {**BASE, **overrides}
    rng = np.random.default_rng(cfg["seed"])
    P, stats = init_params(cfg, rng), {}
    vel = {k: np.zeros_like(v) for k, v in P.items()}
    hist = {k: [] for k in ("train_loss", "train_acc", "val_loss", "val_acc")}
    t0 = time.perf_counter()
    for epoch in range(cfg["epochs"]):
        order = rng.permutation(len(X_train))
        for s in range(0, len(order), cfg["batch"]):
            idx = order[s:s + cfg["batch"]]
            xb, yb = X_train[idx], y_train[idx]
            if cfg["augment"]:
                xb = augment_batch(xb, rng)          # 증강은 훈련 배치에만 적용합니다.
            logits, cache, h_last = forward(P, xb, cfg, train=True, stats=stats, rng=rng)
            _, p = softmax_ce(logits, yb)
            G = backward(P, cache, h_last, p, yb, cfg)
            for k in G:                              # BatchNorm을 끄면 g·be는 기울기가 없으므로 갱신하지 않습니다.
                vel[k] = cfg["momentum"] * vel[k] - cfg["lr"] * G[k]
                P[k] += vel[k]
        for split, (Xs, ys) in (("train", (X_train, y_train)), ("val", (X_val, y_val))):
            loss, acc, _ = evaluate(P, stats, cfg, Xs, ys)
            hist[f"{split}_loss"].append(loss)
            hist[f"{split}_acc"].append(acc)
    return dict(cfg=cfg, P=P, stats=stats, hist=hist, seconds=time.perf_counter() - t0)

print("엔진 준비 완료. train(**변경할_설정)으로 실험합니다.")
`;

const week4Assignment: AssignmentSpec = {
  title: "합성곱 구현과 정규화 Ablation 실험 노트",
  summary: `
두 부분으로 이루어집니다. ① BatchNorm, Dropout, 데이터 증강, weight decay 같은 기법이 실제로 얼마나 도움이 되는지, 기준선에서 **한 번에 하나씩만** 바꾸는 ablation 실험으로 확인합니다. ② 합성곱 층을 NumPy로 직접 구현해 출력 크기 공식, 파라미터 공유, 평행이동 등변성을 확인합니다.

GPU 없이 브라우저에서 몇 초 만에 학습되도록 손글씨 숫자($8 \\times 8$ 픽셀) 데이터를 쓰고, ablation 실험의 모델은 속도를 위해 합성곱 대신 NumPy로 구현한 **완전연결 신경망(MLP)**을 씁니다. 그래서 ①의 결과는 "정규화 기법이 이 MLP에서 어떻게 작용하는가"이며, CIFAR-10 같은 컬러 사진과 CNN에서는 효과의 크기가 다를 수 있습니다(예: CNN의 BatchNorm은 채널마다 배치·높이·너비 전체로 통계를 냅니다). CNN 학습과 전이학습은 학습 자료의 Colab 코드로 다룹니다.

모든 **핵심** 항목은 핵심 과정만으로 풀 수 있고 채점 기준도 핵심 항목만 봅니다. **심화** 항목은 선택이며 점수 대신 피드백을 받습니다.
`,
  tasks: [
    {
      id: "engine",
      tier: "core",
      title: "실험 엔진 읽고 준비하기",
      instructions: `
첫 코드 셀은 데이터 분할과 신경망(64 → 128 → 64 → 10, ReLU), 학습 루프를 정의합니다. 먼저 실행한 뒤 코드를 읽으며 다음을 확인합니다. 이 셀은 수정하지 않는 것이 원칙이며, 설정은 \`train(dropout=0.0)\`처럼 인자로만 바꿉니다.

- \`forward\`의 \`train\` 인자가 BatchNorm과 Dropout의 동작을 어떻게 바꾸는지
- 데이터 증강이 어디에서 적용되는지
- weight decay가 기울기에 어떻게 더해지는지
`,
      cells: [{ kind: "code", id: "engine-code", label: "데이터와 실험 엔진", starter: ENGINE }],
    },
    {
      id: "baseline",
      tier: "core",
      title: "기준선 학습과 초기 손실 확인",
      instructions: `
학습 전에 Karpathy 레시피의 초기 손실 점검을 먼저 합니다. 클래스가 10개이므로 무작위로 초기화한 모델의 손실은 $\\ln 10 \\approx 2.303$ 근처여야 합니다. 그다음 기준선을 학습해 train/val 손실과 정확도 곡선을 그립니다.
`,
      cells: [
        {
          kind: "code",
          id: "baseline-code",
          label: "초기 손실 점검과 기준선 학습",
          starter: `import matplotlib.pyplot as plt

P0, stats0 = init_params(BASE, np.random.default_rng(0)), {}
loss0, _, _ = evaluate(P0, stats0, BASE, X_val, y_val)
print(f"초기 손실 {loss0:.3f} (기댓값 ln 10 = {np.log(10):.3f})")

base = train()
h = base["hist"]
print(f"기준선: val 정확도 {h['val_acc'][-1]:.3f}, train-val 차이 {h['train_acc'][-1] - h['val_acc'][-1]:.3f}, {base['seconds']:.1f}초")

fig, axes = plt.subplots(1, 2, figsize=(10, 3.5))
axes[0].plot(h["train_loss"], label="train"); axes[0].plot(h["val_loss"], label="val")
axes[0].set_title("Loss"); axes[0].set_xlabel("epoch"); axes[0].legend()
axes[1].plot(h["train_acc"], label="train"); axes[1].plot(h["val_acc"], label="val")
axes[1].set_title("Accuracy"); axes[1].set_xlabel("epoch"); axes[1].legend()
plt.show()
`,
        },
      ],
    },
    {
      id: "ablation",
      tier: "core",
      title: "Ablation 두 가지",
      instructions: `
아래 후보 중 **두 가지**를 골라, 실행하기 **전에** 결과를 예측하는 가설을 한 줄씩 적습니다. 그다음 코드 셀의 \`ABLATIONS\`에서 고른 항목의 주석을 해제하고 실행합니다. 각 실험은 기준선에서 설정 하나만 바꿉니다.

| 후보 | 설정 |
| --- | --- |
| BatchNorm 제거 | \`batchnorm=False\` |
| Dropout 제거 | \`dropout=0.0\` |
| 데이터 증강 제거 | \`augment=False\` |
| 학습률 10배 / 0.1배 | \`lr=0.5\` / \`lr=0.005\` |
| weight decay 제거 | \`weight_decay=0.0\` |
| 작은 초기화 | \`init="small"\` (표준편차 0.01) |
`,
      cells: [
        {
          kind: "text",
          id: "ablation-hypothesis",
          prompt: "실행 전에 세운 가설을 적어 주십시오. 무엇을 바꾸면 val 정확도와 train-val 차이가 어떻게 달라질지 예측합니다.",
          template: `- 실험 1 (변경: ): 
- 실험 2 (변경: ): `,
          minChars: 90,
        },
        {
          kind: "code",
          id: "ablation-code",
          label: "Ablation 실행과 결과 표",
          starter: `ABLATIONS = {
    # 두 가지를 골라 주석을 해제합니다.
    # "BatchNorm 제거": dict(batchnorm=False),
    # "Dropout 제거": dict(dropout=0.0),
    # "데이터 증강 제거": dict(augment=False),
    # "학습률 10배": dict(lr=0.5),
    # "학습률 0.1배": dict(lr=0.005),
    # "weight decay 제거": dict(weight_decay=0.0),
    # "작은 초기화": dict(init="small"),
}

results = {"기준선": base}
for name, change in ABLATIONS.items():
    results[name] = train(**change)

print(f"{'변경 항목':<14}{'val 정확도':>10}{'train-val 차이':>16}{'학습 시간(초)':>14}")
for name, r in results.items():
    h = r["hist"]
    print(f"{name:<14}{h['val_acc'][-1]:>10.3f}{h['train_acc'][-1] - h['val_acc'][-1]:>16.3f}{r['seconds']:>14.1f}")
`,
        },
        {
          kind: "text",
          id: "ablation-answer",
          prompt: "결과를 표로 정리하고, 각 실험의 결과가 가설과 맞았는지, 틀렸다면 왜인지 단계에서 배운 개념으로 설명해 주십시오.",
          template: `| 변경 항목 | val 정확도 | train-val 차이 | 학습 시간 |
| --- | --- | --- | --- |
| 기준선 |  |  |  |
|  |  |  |  |
|  |  |  |  |

해석: `,
          minChars: 320,
        },
      ],
    },
    {
      id: "errors",
      tier: "core",
      title: "오류 분석",
      instructions: `
기준선 모델이 테스트셋에서 틀린 이미지를 최대 16장까지 (정답, 예측)과 함께 시각화합니다. 공통 패턴을 두 가지 이상 찾아 적습니다(예: 획이 끊긴 숫자, 비슷한 모양의 숫자 쌍).
`,
      cells: [
        {
          kind: "code",
          id: "errors-code",
          label: "틀린 테스트 이미지 시각화",
          starter: `test_loss, test_acc, pred = evaluate(base["P"], base["stats"], base["cfg"], X_test, y_test)
wrong = np.where(pred != y_test)[0]
print(f"테스트 정확도 {test_acc:.3f}, 틀린 이미지 {len(wrong)}장")

fig, axes = plt.subplots(2, 8, figsize=(12, 3.4))
for ax, i in zip(axes.ravel(), wrong[:16]):
    ax.imshow(X_test[i], cmap="gray_r")
    ax.set_title(f"true {y_test[i]} / pred {pred[i]}", fontsize=8)
for ax in axes.ravel():
    ax.axis("off")
plt.tight_layout()
plt.show()
`,
        },
        {
          kind: "text",
          id: "errors-answer",
          prompt: "틀린 이미지에서 찾은 공통 패턴을 두 가지 이상 적고, 개선 아이디어를 제안해 주십시오.",
          minChars: 100,
        },
      ],
    },
    {
      id: "checklist",
      tier: "core",
      title: "재현성 체크리스트",
      instructions: `
실험 엔진 코드에서 아래 두 가지를 직접 찾아, 해당 코드 줄 번호와 함께 답합니다. 코드 셀 왼쪽의 줄 번호를 참고합니다.

1. 데이터 증강이 훈련 데이터에만 적용되고, 검증·테스트 평가에는 적용되지 않는가?
2. 평가할 때 PyTorch의 \`model.eval()\`에 해당하는 처리(Dropout 끄기, BatchNorm 이동 평균 사용)를 하는가?

마지막으로, 같은 셀을 다시 실행했을 때 결과가 똑같이 나오는지 확인하고 그 이유를 적습니다.
`,
      cells: [
        {
          kind: "text",
          id: "checklist-answer",
          prompt: "두 항목에 대한 확인 결과와 근거가 되는 코드 줄 번호, 재실행 결과를 적어 주십시오.",
          minChars: 100,
        },
      ],
    },
    {
      id: "conv",
      tier: "core",
      title: "합성곱 층 직접 구현하기",
      instructions: `
이번 주의 주인공인 합성곱을 NumPy로 직접 구현해, 학습 자료의 네 가지 주장을 숫자로 확인합니다. 위의 ablation 실험은 속도 때문에 완전연결 신경망(MLP)을 썼으므로, CNN만의 성질은 이 과제에서 따로 다룹니다.

1. **출력 크기:** \`out_size\`의 \`TODO\`에 출력 크기 공식 $N_{out} = \\lfloor (N + 2P - K)/S \\rfloor + 1$을 써 넣고, 공식을 쓰지 않고 위치를 직접 세어 슬라이딩하는 \`conv2d\`의 결과와 다섯 설정 모두 일치하는지 확인합니다.
2. **파라미터 공유·지역성:** $3 \\times 3$ 필터 8개짜리 합성곱과, 같은 크기의 출력을 내는 완전연결층의 파라미터 수를 비교합니다.
3. **특징 지도:** 손으로 만든 두 필터(세로·가로 경계)가 숫자 이미지의 어디에 반응하는지 봅니다.
4. **평행이동 등변성:** 입력을 한 칸 옮겼을 때 stride 1 합성곱의 출력도 한 칸 옮겨지는지(가장자리 열 제외), stride 2에서는 어떻게 되는지 확인합니다.
`,
      cells: [
        {
          kind: "code",
          id: "conv-code",
          label: "합성곱 구현과 네 가지 확인",
          starter: `import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_digits

img = load_digits().images[0] / 16.0     # 8×8 숫자 0 (값 0~1)

def out_size(n, k, s, p):
    """입력 한 변 n, 커널 k, 보폭 s, 패딩 p일 때 출력 한 변의 길이"""
    return 0  # TODO: 학습 자료의 출력 크기 공식을 직접 써 넣습니다. (정수 나눗셈은 //)

def conv2d(x, w, b, stride=1, pad=0):
    """x: (H, W) 흑백 이미지, w: (필터 수, kH, kW), b: (필터 수,) → (필터 수, H_out, W_out)
    출력 크기 공식을 쓰지 않고, 커널이 들어갈 수 있는 위치를 직접 세어 가며 슬라이딩합니다."""
    x = np.pad(x, pad)
    n_f, kH, kW = w.shape
    rows = range(0, x.shape[0] - kH + 1, stride)
    cols = range(0, x.shape[1] - kW + 1, stride)
    out = np.zeros((n_f, len(rows), len(cols)))
    for f in range(n_f):
        for i, r in enumerate(rows):
            for j, c in enumerate(cols):
                # 모든 위치에서 같은 필터 w[f]를 씁니다(파라미터 공유). 보는 범위는 kH×kW뿐입니다(지역성).
                out[f, i, j] = np.sum(x[r:r + kH, c:c + kW] * w[f]) + b[f]
    return out

# 1) 출력 크기: 공식과 실제 슬라이딩 결과가 같은가?
for n, k, s, p in [(8, 3, 1, 0), (8, 3, 1, 1), (8, 3, 2, 1), (8, 5, 1, 0), (8, 2, 2, 0)]:
    real = conv2d(np.zeros((n, n)), np.ones((1, k, k)), np.zeros(1), stride=s, pad=p).shape[1]
    mark = "일치" if out_size(n, k, s, p) == real else "불일치"
    print(f"n={n} k={k} s={s} p={p}: 공식 {out_size(n, k, s, p)}, 실제 {real} → {mark}")

# 2) 파라미터 수: 3×3 필터 8개(합성곱) vs 같은 크기(8×8×8)의 출력을 내는 완전연결층
n_filters = 8
conv_params = n_filters * (3 * 3 * 1) + n_filters
fc_params = (8 * 8) * (n_filters * 8 * 8) + n_filters * 8 * 8
print(f"\\n파라미터 수: 합성곱 {conv_params:,}개 vs 완전연결 {fc_params:,}개 (약 {fc_params / conv_params:,.0f}배)")

# 3) 손으로 만든 필터 두 개로 특징 지도 보기
sobel = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=float)
filters = np.stack([sobel, sobel.T])            # 0번: 세로 경계, 1번: 가로 경계에 반응
maps = conv2d(img, filters, np.zeros(2), pad=1)
fig, axes = plt.subplots(1, 3, figsize=(8, 2.8))
for ax, a, title in zip(axes, [img, maps[0], maps[1]], ["input", "filter 0 (vertical edges)", "filter 1 (horizontal edges)"]):
    ax.imshow(a, cmap="gray_r" if title == "input" else "RdBu")
    ax.set_title(title, fontsize=9)
    ax.axis("off")
plt.show()

# 4) 평행이동 등변성: 입력을 오른쪽으로 한 칸 옮기면 특징 지도도 한 칸 옮겨지는가?
def shift_right(a):
    out = np.zeros_like(a)
    out[..., 1:] = a[..., :-1]
    return out

fmap = conv2d(img, filters, np.zeros(2), pad=1)                 # base 등 앞 과제의 변수 이름은 덮어쓰지 않습니다.
fmap_moved = conv2d(shift_right(img), filters, np.zeros(2), pad=1)
print("\\nstride 1 | conv(옮긴 입력)과 옮긴(conv 출력)의 최대 차이:", np.abs(fmap_moved - shift_right(fmap))[..., 1:-1].max().round(3))

fmap2 = conv2d(img, filters, np.zeros(2), stride=2, pad=1)
fmap2_moved = conv2d(shift_right(img), filters, np.zeros(2), stride=2, pad=1)
print("stride 2 | 옮기기 전 출력과의 차이:", np.abs(fmap2_moved - fmap2).max().round(3),
      "/ 출력을 한 칸 옮긴 것과의 차이:", np.abs(fmap2_moved - shift_right(fmap2))[..., 1:-1].max().round(3))
`,
        },
        {
          kind: "text",
          id: "conv-answer",
          prompt: "네 가지 확인 결과를 정리해 주십시오. (1) n=8, k=3, s=2, p=1의 출력 크기를 공식으로 계산하는 과정, (2) 파라미터 수 차이가 생기는 이유를 파라미터 공유와 지역성으로, (3) 두 필터가 반응한 위치, (4) stride 1과 stride 2의 등변성 결과와 그 이유를 적습니다. 마지막으로, ablation 실험의 MLP는 64개 픽셀을 서로 무관한 입력으로 보므로 이런 귀납편향이 없다는 점이 ablation 결과(특히 데이터 증강의 효과)를 해석할 때 어떤 의미인지 한두 문장으로 적습니다.",
          minChars: 250,
        },
      ],
    },
    {
      id: "advanced",
      tier: "advanced",
      title: "심화: 반복 실험·추가 ablation·적대적 강건성",
      instructions: `
다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않습니다.

- ablation을 네 가지 이상으로 늘리고, 시드 세 개로 반복해 평균과 표준편차로 보고합니다.
- 훈련 데이터를 100장, 250장, 500장, 1000장으로 바꿔 가며 정규화 기법의 효과가 데이터 양에 따라 어떻게 달라지는지 확인합니다.
- \`forward\`를 수정해 BatchNorm을 ReLU 뒤에 두는 순서로 바꾸고 결과를 비교합니다.
- 기준선 모델과 정규화를 모두 켠 모델에 FGSM 공격($\\varepsilon = 0.05, 0.1$)을 걸어, 깨끗한 정확도와 적대적 정확도가 어떻게 다른지 비교합니다(「적대적 예제」). 입력 기울기는 \`backward\`를 한 층 더 내려 계산합니다.
- 과제의 \`conv2d\`를 im2col 행렬 곱으로 다시 구현해 결과가 같은지, 속도가 얼마나 다른지 비교합니다(「합성곱의 계산」).
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: `# 선택한 심화 실험을 이 셀에서 진행합니다.\n` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "control", label: "실험 통제", points: 3, guide: "기준선을 두고 한 번에 하나만 바꾸며, 시드를 고정했습니다." },
    { id: "hypothesis", label: "가설과 해석의 깊이", points: 3, guide: "실행 전에 가설을 세우고, 결과를 단계에서 배운 개념으로 설명했습니다." },
    { id: "errors", label: "오류 분석", points: 2, guide: "틀린 사례에서 구체적인 공통 패턴을 찾고 개선 방향을 제시했습니다." },
    { id: "conv", label: "합성곱 구현과 귀납편향 해석", points: 2, guide: "출력 크기 공식을 구현해 검증하고, 파라미터 수 차이와 등변성 결과를 파라미터 공유·지역성·stride로 정확히 설명했습니다." },
    { id: "checklist", label: "체크리스트와 재현성", points: 1, guide: "초기 손실 점검, 증강 적용 범위, 평가 모드를 코드 근거와 함께 확인했습니다." },
    { id: "clarity", label: "가독성", points: 1, guide: "표와 그래프가 정리되어 있고 서술이 간결합니다." },
  ],
};

export default week4Assignment;
