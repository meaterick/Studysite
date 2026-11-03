import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "cnn-ablation",
  kind: "track",
  title: "합성곱 구현과 정규화·규제 기법의 Ablation 실험 노트",
  summary: md`
두 부분으로 이루어집니다. ① BatchNorm, Dropout, 데이터 증강, weight decay 같은 기법이 실제로 얼마나 도움이 되는지, 기준 모델에서 **한 번에 하나씩만** 바꾸는 ablation 실험으로 확인합니다. ② 합성곱 층을 NumPy로 직접 구현해 출력 크기 공식, 파라미터 공유, 평행이동 등변성을 확인합니다.

GPU 없이 브라우저에서 몇 초 만에 학습되도록 손글씨 숫자($8 \times 8$ 픽셀) 데이터를 쓰고, ablation 실험의 모델은 속도를 위해 합성곱 대신 NumPy로 구현한 **완전연결 신경망(MLP)**을 씁니다. 그래서 ①의 결과는 정규화·규제 기법이 이 MLP에서 어떻게 작용하는지를 보여 주며, CIFAR-10 같은 컬러 사진과 CNN에서는 효과의 크기가 다를 수 있습니다(예: CNN의 BatchNorm은 채널마다 배치·높이·너비 전체로 통계를 냅니다). CNN 학습과 전이학습은 [[lesson:cnn-training]]과 [[lesson:transfer-learning]]의 Colab 코드로 다룹니다.

모든 **핵심** 항목은 핵심 레슨만으로 풀 수 있고 채점 기준도 핵심 항목만 봅니다. **심화** 항목은 선택이며 점수 대신 피드백을 받습니다.
`,
  requirements: [
    "실험 엔진 셀은 수정하지 않고, 설정은 `train(...)`의 인자로만 바꾼다.",
    "학습 전 초기 손실이 $\\ln 10 \\approx 2.303$ 근처인지 먼저 확인하고, 기준 모델의 train/val 곡선을 그린다.",
    "후보 중 ablation 두 가지를 골라 실행 **전에** 가설을 적고, 결과 표와 비교해 맞고 틀린 이유를 설명한다.",
    "틀린 테스트 이미지에서 공통 패턴을 두 가지 이상 찾아 개선 아이디어를 낸다.",
    "`out_size`의 TODO를 출력 크기 공식으로 채워 다섯 설정이 모두 '일치'가 되게 하고, 파라미터 수·특성 맵·평행이동 등변성을 해석한다.",
  ],
  tasks: [
    {
      id: "engine",
      title: "실험 엔진 읽고 준비하기",
      tier: "core",
      instructions: md`
첫 코드 셀은 데이터 분할과 신경망(64 → 128 → 64 → 10, ReLU), 학습 루프를 정의합니다. 먼저 실행한 뒤 코드를 읽으며 다음을 확인합니다. 이 셀은 수정하지 않는 것이 원칙이며, 설정은 \`train(dropout=0.0)\`처럼 인자로만 바꿉니다.

- \`forward\`의 \`train\` 인자가 BatchNorm과 Dropout의 동작을 어떻게 바꾸는지
- 데이터 증강이 어디에서 적용되는지
- weight decay가 기울기에 어떻게 더해지는지
`,
      cells: [
        { kind: "code", id: "engine-code", label: "데이터와 실험 엔진", starter: py`
import numpy as np, time
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

digits = load_digits()
X_all = digits.images / 16.0                 # (1797, 8, 8), 0~1
y_all = digits.target
X_rest, X_test, y_rest, y_test = train_test_split(X_all, y_all, test_size=0.25, stratify=y_all, random_state=0)
# 일반화 기법의 효과가 드러나도록 학습 데이터를 500장으로 줄입니다.
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
                xb = augment_batch(xb, rng)          # 증강은 학습 배치에만 적용합니다.
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
` },
      ],
    },
    {
      id: "baseline",
      title: "기준 모델 학습과 초기 손실 확인",
      tier: "core",
      instructions: md`
학습 전에 초기 손실을 먼저 확인합니다([[lesson:transfer-learning]]의 학습 진단 순서). 클래스가 10개이므로 무작위로 초기화한 모델의 손실은 $\ln 10 \approx 2.303$ 근처여야 합니다. 그다음 기준 모델을 학습해 train/val 손실과 정확도 곡선을 그립니다.
`,
      cells: [
        { kind: "code", id: "baseline-code", label: "초기 손실 점검과 기준 모델 학습", starter: py`
import matplotlib.pyplot as plt

P0, stats0 = init_params(BASE, np.random.default_rng(0)), {}
loss0, _, _ = evaluate(P0, stats0, BASE, X_val, y_val)
print(f"초기 손실 {loss0:.3f} (기댓값 ln 10 = {np.log(10):.3f})")

base = train()
h = base["hist"]
print(f"기준 모델: val 정확도 {h['val_acc'][-1]:.3f}, train-val 차이 {h['train_acc'][-1] - h['val_acc'][-1]:.3f}, {base['seconds']:.1f}초")

fig, axes = plt.subplots(1, 2, figsize=(10, 3.5))
axes[0].plot(h["train_loss"], label="train"); axes[0].plot(h["val_loss"], label="val")
axes[0].set_title("Loss"); axes[0].set_xlabel("epoch"); axes[0].legend()
axes[1].plot(h["train_acc"], label="train"); axes[1].plot(h["val_acc"], label="val")
axes[1].set_title("Accuracy"); axes[1].set_xlabel("epoch"); axes[1].legend()
plt.show()
` },
      ],
    },
    {
      id: "ablation",
      title: "Ablation 두 가지",
      tier: "core",
      instructions: md`
아래 후보 중 **두 가지**를 골라, 실행하기 **전에** 결과를 예측하는 가설을 한 줄씩 적습니다. 그다음 코드 셀의 \`ABLATIONS\`에서 고른 항목의 주석을 해제하고 실행합니다. 각 실험은 기준 모델에서 설정 하나만 바꿉니다.

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
        { kind: "text", id: "ablation-hypothesis", prompt: "실행 전에 세운 가설을 적어 주십시오. 무엇을 바꾸면 val 정확도와 train-val 차이가 어떻게 달라질지 예측합니다.", minChars: 90, template: md`
- 실험 1 (변경: ): 
- 실험 2 (변경: ):
` },
        { kind: "code", id: "ablation-code", label: "Ablation 실행과 결과 표", starter: py`
ABLATIONS = {
    # 두 가지를 골라 주석을 해제합니다.
    # "BatchNorm 제거": dict(batchnorm=False),
    # "Dropout 제거": dict(dropout=0.0),
    # "데이터 증강 제거": dict(augment=False),
    # "학습률 10배": dict(lr=0.5),
    # "학습률 0.1배": dict(lr=0.005),
    # "weight decay 제거": dict(weight_decay=0.0),
    # "작은 초기화": dict(init="small"),
}

results = {"기준 모델": base}
for name, change in ABLATIONS.items():
    results[name] = train(**change)

print(f"{'변경 항목':<14}{'val 정확도':>10}{'train-val 차이':>16}{'학습 시간(초)':>14}")
for name, r in results.items():
    h = r["hist"]
    print(f"{name:<14}{h['val_acc'][-1]:>10.3f}{h['train_acc'][-1] - h['val_acc'][-1]:>16.3f}{r['seconds']:>14.1f}")
` },
        { kind: "text", id: "ablation-answer", prompt: "결과를 표로 정리하고, 각 실험의 결과가 가설과 맞았는지, 틀렸다면 왜인지 레슨에서 배운 개념으로 설명해 주십시오.", minChars: 320, template: md`
| 변경 항목 | val 정확도 | train-val 차이 | 학습 시간 |
| --- | --- | --- | --- |
| 기준 모델 |  |  |  |
|  |  |  |  |
|  |  |  |  |

해석:
` },
      ],
    },
    {
      id: "errors",
      title: "오류 분석",
      tier: "core",
      instructions: md`
기준 모델이 테스트 데이터에서 틀린 이미지를 최대 16장까지 (정답, 예측)과 함께 시각화합니다. 공통 패턴을 두 가지 이상 찾아 적습니다(예: 획이 끊긴 숫자, 비슷한 모양의 숫자 쌍).
`,
      cells: [
        { kind: "code", id: "errors-code", label: "틀린 테스트 이미지 시각화", starter: py`
test_loss, test_acc, pred = evaluate(base["P"], base["stats"], base["cfg"], X_test, y_test)
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
` },
        { kind: "text", id: "errors-answer", prompt: "틀린 이미지에서 찾은 공통 패턴을 두 가지 이상 적고, 개선 아이디어를 제안해 주십시오.", minChars: 100 },
      ],
    },
    {
      id: "checklist",
      title: "재현성 체크리스트",
      tier: "core",
      instructions: md`
실험 엔진 코드에서 아래 두 가지를 직접 찾아, 해당 코드 줄 번호와 함께 답합니다. 코드 셀 왼쪽의 줄 번호를 참고합니다.

1. 데이터 증강이 학습 데이터에만 적용되고, 검증·테스트 평가에는 적용되지 않는가?
2. 평가할 때 PyTorch의 \`model.eval()\`에 해당하는 처리(Dropout 끄기, BatchNorm 이동 평균 사용)를 하는가?

마지막으로, 같은 셀을 다시 실행했을 때 결과가 똑같이 나오는지 확인하고 그 이유를 적습니다.
`,
      cells: [
        { kind: "text", id: "checklist-answer", prompt: "두 항목에 대한 확인 결과와 근거가 되는 코드 줄 번호, 재실행 결과를 적어 주십시오.", minChars: 100 },
      ],
    },
    {
      id: "conv",
      title: "합성곱 층 직접 구현하기",
      tier: "core",
      instructions: md`
합성곱을 NumPy로 직접 구현해, [[lesson:convolution]]의 네 가지 성질을 숫자로 확인합니다. 위의 ablation 실험은 속도 때문에 완전연결 신경망(MLP)을 썼으므로, CNN만의 성질은 이 과제에서 따로 다룹니다.

1. **출력 크기:** \`out_size\`의 \`TODO\`에 출력 크기 공식 $N_{out} = \lfloor (N + 2P - K)/S \rfloor + 1$을 써 넣고, 공식을 쓰지 않고 위치를 직접 세어 슬라이딩하는 \`conv2d\`의 결과와 다섯 설정 모두 일치하는지 확인합니다.
2. **파라미터 공유·지역성:** $3 \times 3$ 필터 8개짜리 합성곱과, 같은 크기의 출력을 내는 완전연결층의 파라미터 수를 비교합니다.
3. **특성 맵:** 손으로 만든 두 필터(세로·가로 경계)가 숫자 이미지의 어디에 반응하는지 봅니다.
4. **평행이동 등변성:** 입력을 한 칸 옮겼을 때 stride 1 합성곱의 출력도 한 칸 옮겨지는지(가장자리 열 제외), stride 2에서는 어떻게 되는지 확인합니다.
`,
      cells: [
        { kind: "code", id: "conv-code", label: "합성곱 구현과 네 가지 확인", starter: py`
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_digits

img = load_digits().images[0] / 16.0     # 8×8 숫자 0 (값 0~1)

def out_size(n, k, s, p):
    """입력 한 변 n, 커널 k, stride s, padding p일 때 출력 한 변의 길이"""
    return 0  # TODO: 본문의 출력 크기 공식을 직접 써 넣습니다. (정수 나눗셈은 //)

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
print(f"\n파라미터 수: 합성곱 {conv_params:,}개 vs 완전연결 {fc_params:,}개 (약 {fc_params / conv_params:,.0f}배)")

# 3) 손으로 만든 필터 두 개로 특성 맵 보기
sobel = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=float)
filters = np.stack([sobel, sobel.T])            # 0번: 세로 경계, 1번: 가로 경계에 반응
maps = conv2d(img, filters, np.zeros(2), pad=1)
fig, axes = plt.subplots(1, 3, figsize=(8, 2.8))
for ax, a, title in zip(axes, [img, maps[0], maps[1]], ["input", "filter 0 (vertical edges)", "filter 1 (horizontal edges)"]):
    ax.imshow(a, cmap="gray_r" if title == "input" else "RdBu")
    ax.set_title(title, fontsize=9)
    ax.axis("off")
plt.show()

# 4) 평행이동 등변성: 입력을 오른쪽으로 한 칸 옮기면 특성 맵도 한 칸 옮겨지는가?
def shift_right(a):
    out = np.zeros_like(a)
    out[..., 1:] = a[..., :-1]
    return out

fmap = conv2d(img, filters, np.zeros(2), pad=1)                 # base 등 앞 과제의 변수 이름은 덮어쓰지 않습니다.
fmap_moved = conv2d(shift_right(img), filters, np.zeros(2), pad=1)
print("\nstride 1 | conv(옮긴 입력)과 옮긴(conv 출력)의 최대 차이:", np.abs(fmap_moved - shift_right(fmap))[..., 1:-1].max().round(3))

fmap2 = conv2d(img, filters, np.zeros(2), stride=2, pad=1)
fmap2_moved = conv2d(shift_right(img), filters, np.zeros(2), stride=2, pad=1)
print("stride 2 | 옮기기 전 출력과의 차이:", np.abs(fmap2_moved - fmap2).max().round(3),
      "/ 출력을 한 칸 옮긴 것과의 차이:", np.abs(fmap2_moved - shift_right(fmap2))[..., 1:-1].max().round(3))
` },
        { kind: "text", id: "conv-answer", prompt: "네 가지 확인 결과를 정리해 주십시오. (1) n=8, k=3, s=2, p=1의 출력 크기를 공식으로 계산하는 과정, (2) 파라미터 수 차이가 생기는 이유를 파라미터 공유와 지역성으로, (3) 두 필터가 반응한 위치, (4) stride 1과 stride 2의 등변성 결과와 그 이유를 적습니다. 마지막으로, ablation 실험의 MLP는 64개 픽셀을 서로 무관한 입력으로 보므로 이런 귀납편향이 없다는 점이 ablation 결과(특히 데이터 증강의 효과)를 해석할 때 어떤 의미인지 한두 문장으로 적습니다.", minChars: 250 },
      ],
    },
    {
      id: "advanced",
      title: "심화: 반복 실험·추가 ablation·적대적 강건성",
      tier: "advanced",
      instructions: md`
다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않습니다.

- ablation을 네 가지 이상으로 늘리고, 시드 세 개로 반복해 평균과 표준편차로 보고합니다.
- 학습 데이터를 100장, 250장, 500장, 1000장으로 바꿔 가며 정규화·규제 기법의 효과가 데이터 양에 따라 어떻게 달라지는지 확인합니다.
- \`forward\`를 수정해 BatchNorm을 ReLU 뒤에 두는 순서로 바꾸고 결과를 비교합니다.
- 기준 모델과, 정규화·규제를 모두 끈 모델에 FGSM 공격($\varepsilon = 0.05, 0.1$)을 걸어, 깨끗한 정확도와 적대적 정확도가 어떻게 다른지 비교합니다([[lesson:adversarial-examples]]). 입력 기울기는 \`backward\`를 한 층 더 내려 계산합니다.
- 과제의 \`conv2d\`를 im2col 행렬 곱으로 다시 구현해 결과가 같은지, 속도가 얼마나 다른지 비교합니다([[lesson:conv-as-matmul]]).
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: py`
# 선택한 심화 실험을 이 셀에서 진행합니다.
` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "control", label: "실험 통제", points: 3, guide: "기준 모델을 두고 한 번에 하나만 바꾸며, 시드를 고정했습니다." },
    { id: "hypothesis", label: "가설과 해석의 깊이", points: 3, guide: "실행 전에 가설을 세우고, 결과를 레슨에서 배운 개념으로 설명했습니다." },
    { id: "errors", label: "오류 분석", points: 2, guide: "틀린 사례에서 구체적인 공통 패턴을 찾고 개선 방향을 제시했습니다." },
    { id: "conv", label: "합성곱 구현과 귀납편향 해석", points: 2, guide: "출력 크기 공식을 구현해 검증하고, 파라미터 수 차이와 등변성 결과를 파라미터 공유·지역성·stride로 정확히 설명했습니다." },
    { id: "checklist", label: "체크리스트와 재현성", points: 1, guide: "초기 손실 점검, 증강 적용 범위, 평가 모드를 코드 근거와 함께 확인했습니다." },
    { id: "clarity", label: "가독성", points: 1, guide: "표와 그래프가 정리되어 있고 서술이 간결합니다." },
  ],
  gradingNotes: md`
- **기준 모델 학습과 초기 손실 확인**: 기준 모델(드롭아웃 0.2, 증강, BatchNorm, weight decay $10^{-4}$, 60에폭)의 검증 정확도는 약 0.96이다.
- **Ablation 두 가지**: 학습률 10배는 발산하고(정확도 약 0.2), BatchNorm 제거는 약 3%p 하락이 전형적이다. $8 \times 8$ 이미지에서는 1픽셀 이동이 이미지 폭의 12.5%에 해당해 증강을 빼는 편이 정확도가 더 높게 나올 수 있다. 이를 가설과 다른 결과로 그대로 보고하고 이유(데이터 해상도에 비해 증강 강도가 크다)를 설명하면 우수 답안이다.
- **재현성 체크리스트**: 증강이 학습 루프 안에서만 호출되는 줄과, evaluate가 \`train=False\`로 forward를 호출하는 줄을 지목해야 한다. 같은 셀을 다시 실행하면 시드 고정으로 결과가 똑같이 나와야 한다.
- **합성곱 층 직접 구현하기**: 출력 크기는 \`(n + 2 * p - k) // s + 1\`이고 다섯 설정 모두 일치해야 한다(n=8, k=3, s=2, p=1이면 \`(8 + 2 - 3) // 2 + 1 = 4\`). 파라미터 수는 합성곱 80개, 완전연결 33,280개(약 416배)다. 같은 $3 \times 3$ 필터를 모든 위치에 재사용하고(파라미터 공유) 주변 9칸만 보기(지역성) 때문이다. stride 1에서는 입력을 한 칸 옮기면 출력도 정확히 한 칸 옮겨지고(최대 차이 0), stride 2에서는 한 칸 이동이 출력 격자에서 반 칸이 되어 등변성이 깨진다는 점을 짚으면 우수 답안이다. MLP에는 이런 귀납 편향이 없어 1픽셀 이동도 전혀 다른 입력으로 처리한다는 점을 증강 결과 해석과 연결하면 좋다.
`,
  maxScore: 12,
  autoTests: [
    { id: "w4-at-initloss", taskId: "baseline", title: "초기 손실이 ln 10 근처(±0.1)", code: py`
import numpy as np
assert abs(loss0 - np.log(10)) < 0.1, f"loss0 = {loss0:.3f}"
` },
    { id: "w4-at-baseline", taskId: "baseline", title: "기준 모델 val 정확도 0.85 이상", hint: "엔진 셀을 수정하지 않았는지, 기준 모델 셀을 끝까지 실행했는지 확인하십시오.", code: py`
acc = base["hist"]["val_acc"][-1]
assert acc >= 0.85, f"기준 모델 val 정확도 {acc:.3f}"
` },
    { id: "w4-at-ablation", taskId: "ablation", title: "ablation 두 가지를 각각 설정 하나만 바꿔 실행했다", code: py`
assert len(ABLATIONS) == 2, f"고른 ablation이 {len(ABLATIONS)}개입니다(2개여야 함)."
assert all(len(change) == 1 for change in ABLATIONS.values()), "한 번에 설정 하나만 바꿔야 합니다."
assert all(name in results for name in ABLATIONS), "ABLATIONS의 실험 결과가 results에 없습니다. 셀을 다시 실행하십시오."
` },
    { id: "w4-at-outsize", taskId: "conv", title: "out_size가 출력 크기 공식과 일치한다(본문에 없는 설정 포함)", code: py`
for n, k, s, p, expect in [(8, 3, 2, 1, 4), (32, 5, 1, 2, 32), (32, 5, 2, 2, 16), (7, 3, 2, 0, 3), (28, 5, 1, 0, 24)]:
    got = out_size(n, k, s, p)
    assert got == expect, f"out_size({n}, {k}, {s}, {p}) = {got}, 기대 {expect}"
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "다채널 합성곱을 반복문 두 개로 벡터화하기",
      prompt: md`
실제 CNN의 합성곱은 입력이 여러 채널입니다. \`conv2d_multi(x, w, b, stride, pad)\`를 구현합니다.

- \`x\`: (C_in, H, W), \`w\`: (C_out, C_in, K, K), \`b\`: (C_out,) → 출력 (C_out, H_out, W_out)
- 출력의 한 칸은 **모든 입력 채널**에 걸친 $K \times K$ 창과 필터의 원소별 곱의 합 + 편향입니다.

출력 위치(i, j)에 대한 반복문 두 개만 쓰고, 채널과 필터 축은 \`np.tensordot\`(또는 \`np.einsum\`)으로 한 번에 계산합니다. 채점은 네 겹 반복문 참조 구현과 비교합니다.
`,
      starter: py`
import numpy as np

def conv2d_multi(x, w, b, stride=1, pad=0):
    x = np.pad(x, ((0, 0), (pad, pad), (pad, pad)))
    C_out, C_in, K, _ = w.shape
    H_out = (x.shape[1] - K) // stride + 1
    W_out = (x.shape[2] - K) // stride + 1
    out = np.zeros((C_out, H_out, W_out))
    for i in range(H_out):
        for j in range(W_out):
            window = x[:, i * stride:i * stride + K, j * stride:j * stride + K]   # (C_in, K, K)
            # TODO: 모든 필터에 대해 window와의 원소별 곱의 합을 한 번에 구해 out[:, i, j]에 넣고 b를 더합니다.
    return out

rng = np.random.default_rng(0)
x = rng.normal(size=(3, 8, 8))
w = rng.normal(size=(4, 3, 3, 3))
print(conv2d_multi(x, w, np.zeros(4), pad=1).shape)
`,
      tests: py`
import numpy as np
rng = np.random.default_rng(1)

def reference(x, w, b, stride=1, pad=0):
    x = np.pad(x, ((0, 0), (pad, pad), (pad, pad)))
    C_out, C_in, K, _ = w.shape
    H_out, W_out = (x.shape[1] - K) // stride + 1, (x.shape[2] - K) // stride + 1
    out = np.zeros((C_out, H_out, W_out))
    for f in range(C_out):
        for i in range(H_out):
            for j in range(W_out):
                out[f, i, j] = np.sum(x[:, i * stride:i * stride + K, j * stride:j * stride + K] * w[f]) + b[f]
    return out

@test("출력 shape (C_out, H_out, W_out)")
def _():
    out = conv2d_multi(rng.normal(size=(3, 8, 8)), rng.normal(size=(5, 3, 3, 3)), np.zeros(5), stride=2, pad=1)
    assert out.shape == (5, 4, 4), f"shape: {out.shape}"

@test("참조 구현과 일치 (stride 1, pad 1)")
def _():
    x, w, b = rng.normal(size=(3, 6, 6)), rng.normal(size=(4, 3, 3, 3)), rng.normal(size=4)
    assert approx(conv2d_multi(x, w, b, pad=1), reference(x, w, b, pad=1))

@test("참조 구현과 일치 (5×5 커널, stride 2)")
def _():
    x, w, b = rng.normal(size=(2, 9, 9)), rng.normal(size=(3, 2, 5, 5)), rng.normal(size=3)
    assert approx(conv2d_multi(x, w, b, stride=2), reference(x, w, b, stride=2))

@test("입력 채널이 1개면 흑백 합성곱과 같다")
def _():
    x, k = rng.normal(size=(1, 5, 5)), rng.normal(size=(1, 1, 3, 3))
    single = np.array([[np.sum(x[0, i:i+3, j:j+3] * k[0, 0]) for j in range(3)] for i in range(3)])
    assert approx(conv2d_multi(x, k, np.zeros(1))[0], single)
`,
      hints: ["`w`는 (C_out, C_in, K, K), `window`는 (C_in, K, K)입니다. 뒤쪽 세 축끼리 곱해 더하면 (C_out,)이 남습니다.", "`np.tensordot(w, window, axes=([1, 2, 3], [0, 1, 2]))` 또는 `np.einsum(\"fckl,ckl->f\", w, window)`", "`out[:, i, j] = ... + b`"],
      solution: py`
import numpy as np

def conv2d_multi(x, w, b, stride=1, pad=0):
    x = np.pad(x, ((0, 0), (pad, pad), (pad, pad)))
    C_out, C_in, K, _ = w.shape
    H_out = (x.shape[1] - K) // stride + 1
    W_out = (x.shape[2] - K) // stride + 1
    out = np.zeros((C_out, H_out, W_out))
    for i in range(H_out):
        for j in range(W_out):
            window = x[:, i * stride:i * stride + K, j * stride:j * stride + K]
            out[:, i, j] = np.tensordot(w, window, axes=([1, 2, 3], [0, 1, 2])) + b
    return out

rng = np.random.default_rng(0)
x = rng.normal(size=(3, 8, 8))
w = rng.normal(size=(4, 3, 3, 3))
print(conv2d_multi(x, w, np.zeros(4), pad=1).shape)
`,
    },
    {
      key: "ch2",
      title: "Max Pooling의 역전파: 승자에게만 기울기를",
      prompt: md`
Max Pooling은 파라미터가 없지만 역전파는 해야 합니다. $2 \times 2$(stride 2) 풀링의 순전파·역전파를 구현합니다.

1. \`maxpool_forward(a)\`: 풀링 결과와, 역전파에 쓸 **각 블록 최댓값의 위치**(마스크)를 돌려줍니다.
2. \`maxpool_backward(dout, mask)\`: 상류 기울기 \`dout\`(풀링 출력 크기)을 블록 안에서 최댓값이었던 자리에만 전달하고 나머지는 0으로 둡니다(ReLU처럼 승자독식).

블록 안에 최댓값이 여러 개면 첫 번째 위치(행 우선) 하나에만 전달합니다. 채점은 수치미분과 비교합니다.
`,
      starter: py`
import numpy as np

def maxpool_forward(a):
    H, W = a.shape
    blocks = a.reshape(H // 2, 2, W // 2, 2).transpose(0, 2, 1, 3).reshape(H // 2, W // 2, 4)
    out = blocks.max(axis=2)
    mask = np.zeros_like(a)
    # TODO: 블록마다 argmax 위치(0~3)를 원래 좌표 (2*bi + r, 2*bj + c)로 바꿔 mask에 1을 표시합니다.
    return out, mask

def maxpool_backward(dout, mask):
    # TODO: dout을 각 블록 크기(2×2)로 늘린 뒤 mask를 곱합니다.
    return np.zeros_like(mask)

a = np.array([[1., 3., 2., 1.], [4., 2., 0., 5.], [1., 1., 7., 2.], [0., 2., 3., 3.]])
out, mask = maxpool_forward(a)
print(out)
print(maxpool_backward(np.ones_like(out), mask))
`,
      tests: py`
import numpy as np
a = np.array([[1., 3., 2., 1.], [4., 2., 0., 5.], [1., 1., 7., 2.], [0., 2., 3., 3.]])

@test("순전파 결과 = [[4, 5], [2, 7]]")
def _():
    out, _ = maxpool_forward(a)
    assert approx(out, [[4, 5], [2, 7]])

@test("마스크는 블록마다 최댓값 자리 하나")
def _():
    _, mask = maxpool_forward(a)
    assert mask.sum() == 4 and mask[1, 0] == 1 and mask[1, 3] == 1 and mask[2, 2] == 1 and mask[3, 1] == 1, f"mask:\n{mask}"

@test("동점이면 첫 번째 위치 하나에만")
def _():
    _, mask = maxpool_forward(np.ones((2, 2)))
    assert mask.tolist() == [[1, 0], [0, 0]], f"mask: {mask.tolist()}"

@test("역전파가 수치미분과 일치")
def _():
    rng = np.random.default_rng(0)
    x = rng.normal(size=(4, 6))
    dout = rng.normal(size=(2, 3))
    out, mask = maxpool_forward(x)
    dx = maxpool_backward(dout, mask)
    num = np.zeros_like(x)
    for i in range(4):
        for j in range(6):
            xp, xm = x.copy(), x.copy()
            xp[i, j] += 1e-6; xm[i, j] -= 1e-6
            num[i, j] = (np.sum(maxpool_forward(xp)[0] * dout) - np.sum(maxpool_forward(xm)[0] * dout)) / 2e-6
    assert approx(dx, num, 1e-5)
`,
      hints: ["`idx = blocks.argmax(axis=2)`는 (H/2, W/2) 배열이고, 값 0~3은 블록 안 (행, 열) = `divmod(idx, 2)`입니다.", "`r, c = np.divmod(idx, 2)`, `bi, bj = np.indices(idx.shape)`를 만든 뒤 `mask[2 * bi + r, 2 * bj + c] = 1`", "`np.repeat(np.repeat(dout, 2, axis=0), 2, axis=1) * mask`. `np.kron(dout, np.ones((2, 2)))`도 같습니다."],
      solution: py`
import numpy as np

def maxpool_forward(a):
    H, W = a.shape
    blocks = a.reshape(H // 2, 2, W // 2, 2).transpose(0, 2, 1, 3).reshape(H // 2, W // 2, 4)
    out = blocks.max(axis=2)
    mask = np.zeros_like(a)
    idx = blocks.argmax(axis=2)
    r, c = np.divmod(idx, 2)
    bi, bj = np.indices(idx.shape)
    mask[2 * bi + r, 2 * bj + c] = 1
    return out, mask

def maxpool_backward(dout, mask):
    return np.repeat(np.repeat(dout, 2, axis=0), 2, axis=1) * mask

a = np.array([[1., 3., 2., 1.], [4., 2., 0., 5.], [1., 1., 7., 2.], [0., 2., 3., 3.]])
out, mask = maxpool_forward(a)
print(out)
print(maxpool_backward(np.ones_like(out), mask))
`,
    },
  ],
});
