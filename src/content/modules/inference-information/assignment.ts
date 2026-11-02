import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "math-gd-bayes",
  kind: "track",
  title: "경사하강법과 베이즈 정리 직접 계산하기",
  summary: md`

NumPy만으로 선형회귀를 경사하강법으로 학습하고, 학습률에 따른 수렴 양상을 비교합니다. 이어서 베이즈 정리 예제의 조건을 바꿔 사후확률이 어떻게 달라지는지 확인합니다. 모든 작업은 이 페이지의 코드 셀과 답안 칸에서 진행하며, 코드는 브라우저에서 실행됩니다.

**핵심** 항목 세 개(경사하강법·학습률 비교·베이즈 정리)는 핵심 과정만으로 풀 수 있도록 구성했고, 채점 기준은 이 세 항목만 봅니다. **보충**(해석해 비교)과 **심화**(조건수·미니배치 등) 항목은 선택이며, 점수 대신 피드백을 받습니다.
`,
  requirements: [
    "`grad`의 TODO 두 줄을 직접 유도한 편미분으로 채우고, 학습 결과 $w \\approx 2$, $b \\approx 1$을 얻는다.",
    "학습률 0.001·0.01·0.1·0.5의 loss 곡선을 로그 축 그래프 하나에 그리고, 수렴 속도와 안정성을 비교해 설명한다.",
    "`posterior`를 완성해 유병률 0.1%·1%·10%·30%의 사후확률을 계산하고 기저율의 영향을 설명한다.",
    "(보충) `np.linalg.lstsq` 해석해와 경사하강법 결과의 차이를 출력하고, 차이의 원인을 설명한다.",
    "시드(42)를 고정해, 실행 환경을 초기화한 뒤 처음부터 실행해도 같은 결과가 나온다.",
  ],
  tasks: [
    {
      id: "gd",
      title: "경사하강법으로 w, b 학습하기",
      tier: "core",
      instructions: md`

데이터 $y = 2x + 1 + \varepsilon$ 100개를 생성하고(노이즈 $\varepsilon$은 「연속 확률분포」 단계에서 보는 정규분포 난수 \`rng.normal(0, 0.5, n)\`입니다), 평균제곱오차 $L(w, b) = \frac{1}{n}\sum_i (w x_i + b - y_i)^2$를 경사하강법으로 최소화합니다.

1. 답안 칸에 $\partial L/\partial w$와 $\partial L/\partial b$를 유도 과정과 함께 적습니다.
2. 코드 셀의 \`grad\` 함수에서 \`TODO\` 두 줄을 유도한 식으로 채우고 실행합니다. 학습이 끝났을 때 $w \approx 2$, $b \approx 1$이 나오면 올바르게 구현한 것입니다.
`,
      cells: [
        { kind: "text", id: "gd-derivation", prompt: "MSE의 $w$, $b$에 대한 편미분을 유도 과정과 함께 적어 주십시오. 코드의 어느 줄이 어느 식에 대응하는지도 밝힙니다.", minChars: 80 },
        { kind: "code", id: "gd-code", label: "데이터 생성과 경사하강법", starter: py`
import numpy as np

rng = np.random.default_rng(42)
n = 100
x = rng.uniform(-3, 3, n)
y = 2 * x + 1 + rng.normal(0, 0.5, n)

def loss(w, b):
    return np.mean((w * x + b - y) ** 2)

def grad(w, b):
    err = w * x + b - y
    dw = 0.0  # TODO: ∂L/∂w
    db = 0.0  # TODO: ∂L/∂b
    return dw, db

def train(lr, steps=200):
    w, b = 0.0, 0.0
    history = []
    for _ in range(steps):
        dw, db = grad(w, b)
        w -= lr * dw
        b -= lr * db
        history.append(loss(w, b))
    return w, b, history

w, b, history = train(lr=0.1)
print(f"w = {w:.4f}, b = {b:.4f}, 최종 loss = {history[-1]:.4f}")
` },
      ],
    },
    {
      id: "lr",
      title: "학습률 네 가지 비교",
      tier: "core",
      instructions: md`

학습률 0.001, 0.01, 0.1, 0.5로 각각 학습해 loss 곡선을 한 그래프에 그립니다. 발산하는 경우에도 그래프가 읽히도록 세로축은 로그 척도로 두었습니다. 어떤 학습률이 가장 빠르게, 또 가장 안정적으로 수렴하는지 관찰 결과를 세 문장 이상으로 적습니다.
`,
      cells: [
        { kind: "code", id: "lr-code", label: "학습률별 loss 곡선", starter: py`
import matplotlib.pyplot as plt

plt.figure(figsize=(6, 4))
print(f"{'학습률':>8}{'w':>12}{'b':>12}{'최종 loss':>14}")
for lr in (0.001, 0.01, 0.1, 0.5):
    w_lr, b_lr, hist = train(lr, steps=200)
    plt.plot(hist, label=f"lr={lr}")
    print(f"{lr:>8}{w_lr:>12.3g}{b_lr:>12.3g}{hist[-1]:>14.3g}")
plt.yscale("log")
plt.xlabel("step")
plt.ylabel("MSE (log scale)")
plt.legend()
plt.title("Learning rate comparison")
plt.show()
` },
        { kind: "text", id: "lr-observation", prompt: "학습률별 수렴 속도와 안정성을 비교하고, 그렇게 된 이유를 설명해 주십시오.", minChars: 120 },
      ],
    },
    {
      id: "bayes",
      title: "베이즈 정리 다시 계산하기",
      tier: "core",
      instructions: md`

「확률과 베이즈 정리」 단계의 예제(유병률 1%, 민감도 99%, 위양성률 5%)를 함수로 만들고, 유병률을 0.1%, 1%, 10%, 30%로 바꿔 양성 판정을 받은 사람이 실제로 병이 있을 확률 $P(\text{병} \mid \text{양성})$을 계산합니다. 유병률에 따라 결과가 크게 달라지는 이유를 적습니다.
`,
      cells: [
        { kind: "code", id: "bayes-code", label: "사후확률 계산", starter: py`
def posterior(prevalence, sensitivity=0.99, false_positive=0.05):
    # TODO: 베이즈 정리로 P(병 | 양성)을 계산해 반환합니다.
    p_positive = 0.0  # TODO: 전체 확률의 법칙으로 P(양성)
    return 0.0        # TODO

for prev in (0.001, 0.01, 0.1, 0.3):
    print(f"유병률 {prev:>5.1%} → P(병 | 양성) = {posterior(prev):.1%}")
` },
        { kind: "text", id: "bayes-answer", prompt: "유병률이 바뀔 때 사후확률이 어떻게 달라지는지, 그 이유와 함께 설명해 주십시오.", minChars: 80 },
      ],
    },
    {
      id: "lstsq",
      title: "보충: 해석해와 비교하기",
      tier: "supplement",
      instructions: md`

선형회귀는 반복 없이 한 번에 푸는 해석해(최소제곱 해)가 있습니다. 설계 행렬 $X = [x, 1]$(각 행이 $[x_i, 1]$)을 만들면 예측은 $X\begin{bmatrix}w\\b\end{bmatrix}$이고, \`np.linalg.lstsq\`가 $\lVert Xw - y \rVert^2$을 최소화하는 해를 바로 구합니다. 경사하강법 결과와의 차이를 출력하고, 차이가 생긴다면 그 원인이 무엇인지(스텝 수, 학습률 등) 적습니다. 보충 과정의 「벡터공간·기저와 행렬 곱셈」 단계를 먼저 보면 설계 행렬이 더 잘 읽힙니다.
`,
      cells: [
        { kind: "code", id: "lstsq-code", label: "최소제곱 해석해", starter: py`
X = np.column_stack([x, np.ones(n)])
(w_star, b_star), *_ = np.linalg.lstsq(X, y, rcond=None)
print(f"해석해:     w = {w_star:.4f}, b = {b_star:.4f}")
print(f"경사하강법: w = {w:.4f}, b = {b:.4f}")
print(f"차이: |Δw| = {abs(w - w_star):.2e}, |Δb| = {abs(b - b_star):.2e}")
` },
        { kind: "text", id: "lstsq-answer", prompt: "두 결과가 얼마나 가까운지, 차이가 있다면 원인이 무엇인지 설명해 주십시오.", minChars: 60 },
      ],
    },
    {
      id: "advanced",
      title: "심화: 조건수·미니배치·학습률 스케줄",
      tier: "advanced",
      instructions: md`

다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않으며, 심화 단계의 내용을 실제 데이터에 적용해 보는 것이 목적입니다.

- **조건수 실험:** 입력을 $x' = 100x + 50$으로 바꾸면 경사하강법이 발산하지 않는 최대 학습률이 얼마로 줄어드는지 예측하고 확인합니다. 헤세 행렬 $H = \frac{2}{n}X^\top X$의 고유값으로 상한 $2/\lambda_{\max}$와 조건수를 계산하고, $x'$을 표준화했을 때와 비교합니다(「경사하강법의 수렴 조건과 조건수」).
- 미니배치 확률적 경사하강법으로 바꾸고, 배치 크기(1, 10, 100)에 따라 loss 곡선의 잡음이 어떻게 달라지는지 비교합니다.
- 스텝이 진행될수록 학습률을 줄이는 학습률 스케줄을 적용해 고정 학습률과 수렴 속도를 비교합니다.
- 가상의 10만 명을 만들어 베이즈 정리 결과를 시뮬레이션으로 검증하거나, 동전 던지기의 MLE와 MAP 추정치가 시행 횟수 $n$이 커질수록 가까워지는지 확인합니다.
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: py`
# 선택한 심화 실험을 이 셀에서 진행합니다. 필요하면 아래 '+ 코드 셀 추가'로 셀을 늘릴 수 있습니다.
` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "derivation", label: "수식 유도의 정확성", points: 3, guide: "편미분 유도가 정확하고, 식과 코드의 대응을 설명했습니다." },
    { id: "reproducible", label: "코드 동작과 재현성", points: 3, guide: "핵심 항목의 모든 셀이 처음부터 순서대로 실행되며, 시드를 고정해 같은 결과가 재현됩니다." },
    { id: "insight", label: "실험 관찰의 통찰", points: 3, guide: "학습률 비교와 유병률 변화에 대해 수치를 근거로 원인을 설명했습니다(배율 $1 - \\eta \\cdot$곡률, TP·FP의 사람 수 등)." },
    { id: "clarity", label: "가독성", points: 1, guide: "답안이 간결하고 그래프·출력과 서술이 잘 연결됩니다." },
  ],
  gradingNotes: md`
- **경사하강법으로 w, b 학습하기**: $\dfrac{\partial L}{\partial w} = \dfrac{2}{n}\sum_i (wx_i+b-y_i)x_i$, $\dfrac{\partial L}{\partial b} = \dfrac{2}{n}\sum_i (wx_i+b-y_i)$이다. 학습률 0.1로 200스텝 학습하면 $w \approx 2.006$, $b \approx 0.994$가 되어 해석해와 소수점 넷째 자리까지 일치한다.
- **학습률 네 가지 비교**: $x \sim U(-3, 3)$이므로 $\mathbb{E}[x^2]=3$이고, 손실의 헤세 행렬 고윳값은 약 6과 2다. 학습률이 $2/6 \approx 0.33$을 넘는 0.5는 발산하고, 0.001은 200스텝 안에 수렴하지 않는다.
- **베이즈 정리 다시 계산하기**: 민감도 99%, 위양성률 5%에서 유병률 0.1%, 1%, 10%, 30%의 사후확률은 각각 약 1.9%, 16.7%, 68.8%, 89.5%다.
- 우수 답안은 발산 경계를 곡률로 설명하고, 유병률이 낮을 때 위양성의 절대 수가 진양성보다 많아지는 구조를 사람 수로 보인다.
`,
  maxScore: 10,
  autoTests: [
    { id: "w1-at-grad", taskId: "gd", title: "grad가 수치미분과 일치한다", hint: "평균의 1/n과 제곱을 미분할 때 나오는 2를 빠뜨리지 않았는지 확인하십시오.", code: py`
for w0, b0 in [(0.0, 0.0), (1.5, -0.5)]:
    dw, db = grad(w0, b0)
    h = 1e-6
    num_dw = (loss(w0 + h, b0) - loss(w0 - h, b0)) / (2 * h)
    num_db = (loss(w0, b0 + h) - loss(w0, b0 - h)) / (2 * h)
    assert abs(dw - num_dw) < 1e-4 and abs(db - num_db) < 1e-4, (
        f"(w, b) = ({w0}, {b0})에서 grad = ({dw:.4f}, {db:.4f}), 수치미분 = ({num_dw:.4f}, {num_db:.4f})")
` },
    { id: "w1-at-train", taskId: "gd", title: "학습 결과가 w ≈ 2, b ≈ 1이고 손실이 줄었다", hint: "`grad`를 고친 뒤 첫 코드 셀을 다시 실행해야 `w`, `b`, `history`가 새로 계산됩니다.", code: py`
assert abs(w - 2) < 0.1 and abs(b - 1) < 0.1, f"w = {w:.3f}, b = {b:.3f}"
assert history[-1] < history[0], "손실이 줄지 않았습니다."
` },
    { id: "w1-at-lstsq", taskId: "lstsq", title: "경사하강법 결과가 해석해와 0.01 이내", code: py`
assert abs(w - w_star) < 0.01 and abs(b - b_star) < 0.01, f"|Δw| = {abs(w - w_star):.2e}, |Δb| = {abs(b - b_star):.2e}"
` },
    { id: "w1-at-bayes", taskId: "bayes", title: "posterior가 베이즈 정리와 일치하고 유병률에 따라 커진다", hint: "전체 확률의 법칙: $P(\\text{양성}) = P(\\text{양성} \\mid \\text{병})P(\\text{병}) + P(\\text{양성} \\mid \\text{건강})P(\\text{건강})$", code: py`
assert abs(posterior(0.01) - 0.0099 / 0.0594) < 1e-4, f"posterior(0.01) = {posterior(0.01)}"
vals = [posterior(p) for p in (0.001, 0.01, 0.1, 0.3)]
assert all(a < b for a, b in zip(vals, vals[1:])), f"유병률 순서대로의 값: {vals}"
assert abs(posterior(0.3, 0.9, 0.1) - 0.27 / (0.27 + 0.07)) < 1e-4, "민감도·위양성률 인자를 반영하지 않았습니다."
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "미니배치 확률적 경사하강법",
      prompt: md`

과제의 선형회귀를 **미니배치 SGD**로 바꿉니다. 에폭마다 데이터를 섞고(\`rng.permutation\`) \`batch_size\`개씩 잘라, 그 배치의 MSE 기울기로 $w, b$를 갱신합니다. 에폭이 끝날 때마다 **전체 데이터**의 MSE를 기록합니다.

배치 크기 1, 10, 100의 결과를 비교해 보십시오. 배치 100(전체)은 과제의 일반 경사하강법과 정확히 같아야 합니다.
`,
      starter: py`
import numpy as np

rng = np.random.default_rng(42)
n = 100
x = rng.uniform(-3, 3, n)
y = 2 * x + 1 + rng.normal(0, 0.5, n)

def minibatch_sgd(x, y, lr=0.05, batch_size=10, epochs=50, seed=0):
    """반환: (w, b, 에폭마다 전체 데이터 MSE를 담은 리스트)"""
    rng = np.random.default_rng(seed)
    w, b = 0.0, 0.0
    losses = []
    for epoch in range(epochs):
        order = rng.permutation(len(x))
        for start in range(0, len(x), batch_size):
            idx = order[start:start + batch_size]
            xb, yb = x[idx], y[idx]
            # TODO: 배치에서 MSE의 기울기 dw, db를 구하고 w, b를 갱신합니다.
        losses.append(float(np.mean((w * x + b - y) ** 2)))
    return w, b, losses

for bs in (1, 10, 100):
    w, b, losses = minibatch_sgd(x, y, batch_size=bs)
    print(f"batch={bs:>3}: w={w:.3f}, b={b:.3f}, 마지막 loss={losses[-1]:.4f}")
`,
      tests: py`
import numpy as np
rng = np.random.default_rng(42)
xx = rng.uniform(-3, 3, 100)
yy = 2 * xx + 1 + rng.normal(0, 0.5, 100)
w_star, b_star = np.linalg.lstsq(np.column_stack([xx, np.ones(100)]), yy, rcond=None)[0]

@test("batch 10: 해석해와 0.05 이내")
def _():
    w, b, losses = minibatch_sgd(xx, yy, lr=0.05, batch_size=10, epochs=50)
    assert abs(w - w_star) < 0.05 and abs(b - b_star) < 0.05, f"w={w:.3f}, b={b:.3f} / 해석해 {w_star:.3f}, {b_star:.3f}"

@test("에폭마다 손실을 기록하고, 손실이 줄었다")
def _():
    w, b, losses = minibatch_sgd(xx, yy, batch_size=10, epochs=20)
    assert len(losses) == 20 and losses[-1] < losses[0], f"손실 기록: {losses[:3]} ..."

@test("배치 100(전체)이면 일반 경사하강법과 같다")
def _():
    w, b, _ = minibatch_sgd(xx, yy, lr=0.1, batch_size=100, epochs=200)
    w2, b2 = 0.0, 0.0
    for _ in range(200):
        err = w2 * xx + b2 - yy
        w2, b2 = w2 - 0.1 * np.mean(2 * err * xx), b2 - 0.1 * np.mean(2 * err)
    assert approx(w, w2) and approx(b, b2), f"({w}, {b}) vs ({w2}, {b2})"

@test("같은 seed면 같은 결과(재현성)")
def _():
    assert minibatch_sgd(xx, yy, seed=3)[:2] == minibatch_sgd(xx, yy, seed=3)[:2]
`,
      hints: ["배치의 오차는 `err = w * xb + b - yb`입니다. 기울기는 전체 데이터 대신 배치에서 평균을 냅니다.", "`dw = np.mean(2 * err * xb)`, `db = np.mean(2 * err)`입니다.", "두 파라미터를 같은 기울기 시점에서 갱신해야 합니다. `w -= lr * dw`와 `b -= lr * db`를 기울기를 모두 구한 뒤에 실행합니다."],
      solution: py`
import numpy as np

rng = np.random.default_rng(42)
n = 100
x = rng.uniform(-3, 3, n)
y = 2 * x + 1 + rng.normal(0, 0.5, n)

def minibatch_sgd(x, y, lr=0.05, batch_size=10, epochs=50, seed=0):
    rng = np.random.default_rng(seed)
    w, b = 0.0, 0.0
    losses = []
    for epoch in range(epochs):
        order = rng.permutation(len(x))
        for start in range(0, len(x), batch_size):
            idx = order[start:start + batch_size]
            xb, yb = x[idx], y[idx]
            err = w * xb + b - yb
            dw, db = np.mean(2 * err * xb), np.mean(2 * err)
            w -= lr * dw
            b -= lr * db
        losses.append(float(np.mean((w * x + b - y) ** 2)))
    return w, b, losses

for bs in (1, 10, 100):
    w, b, losses = minibatch_sgd(x, y, batch_size=bs)
    print(f"batch={bs:>3}: w={w:.3f}, b={b:.3f}, 마지막 loss={losses[-1]:.4f}")
`,
    },
    {
      key: "ch2",
      title: "수치미분으로 기울기 검산하기 (gradient check)",
      prompt: md`

손으로 유도한 기울기가 맞는지 확인하는 표준 방법인 **gradient check**를 일반 함수로 만듭니다. 3주차 역전파 구현을 검증할 때도 그대로 씁니다.

1. \`numerical_grad(f, params, eps)\`: 파라미터 리스트의 각 성분만 $\pm\varepsilon$ 움직여 중앙 차분 $\dfrac{f(\theta + \varepsilon) - f(\theta - \varepsilon)}{2\varepsilon}$을 구합니다. 원래 \`params\`는 바꾸지 않습니다.
2. \`relative_error(a, b)\` $= \dfrac{|a - b|}{\max(10^{-12}, |a| + |b|)}$

일부러 틀린 기울기(2를 빠뜨린 것)를 넣었을 때 상대오차가 크게 나오는지도 확인합니다.
`,
      starter: py`
def numerical_grad(f, params, eps=1e-6):
    """f(params)의 각 성분에 대한 중앙 차분 기울기 리스트. params는 float 리스트"""
    grads = []
    for i in range(len(params)):
        plus, minus = list(params), list(params)
        # TODO: i번째 성분만 ±eps 움직이고 (f(plus) - f(minus)) / (2 * eps)를 grads에 추가합니다.
    return grads

def relative_error(a, b):
    return 0.0  # TODO: |a - b| / max(1e-12, |a| + |b|)

xs, ys = [1.0, 2.0, 3.0], [3.0, 5.0, 7.5]

def loss(params):
    w, b = params
    return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

def analytic_grad(params):
    w, b = params
    n = len(xs)
    dw = sum(2 * (w * x + b - y) * x for x, y in zip(xs, ys)) / n
    db = sum(2 * (w * x + b - y) for x, y in zip(xs, ys)) / n
    return [dw, db]

p = [0.5, -1.0]
num, ana = numerical_grad(loss, p), analytic_grad(p)
print("수치미분:", num)
print("해석적  :", ana)
print("상대오차:", [relative_error(a, b) for a, b in zip(ana, num)])
`,
      tests: py`
@test("f = (a-1)² + 3b² 의 기울기 = [2(a-1), 6b]")
def _():
    g = numerical_grad(lambda p: (p[0] - 1) ** 2 + 3 * p[1] ** 2, [2.0, -1.0])
    assert len(g) == 2 and approx(g, [2.0, -6.0], 1e-5), f"결과: {g}"

@test("원래 params 리스트를 바꾸지 않는다")
def _():
    p = [0.3, 0.7]
    numerical_grad(lambda q: q[0] * q[1], p)
    assert p == [0.3, 0.7], f"params가 {p}로 바뀌었습니다."

@test("relative_error 정의")
def _():
    assert approx(relative_error(1.0, 1.1), 0.1 / 2.1) and relative_error(0.0, 0.0) == 0.0

@test("MSE의 해석적 기울기와 상대오차 1e-6 미만")
def _():
    p = [0.5, -1.0]
    num, ana = numerical_grad(loss, p), analytic_grad(p)
    assert len(num) == 2 and all(relative_error(a, b) < 1e-6 for a, b in zip(ana, num)), f"{num} vs {ana}"

@test("틀린 기울기(2를 빠뜨림)는 큰 상대오차로 잡아낸다")
def _():
    p = [0.5, -1.0]
    wrong = [g / 2 for g in analytic_grad(p)]
    num = numerical_grad(loss, p)
    assert len(num) == 2 and max(relative_error(a, b) for a, b in zip(wrong, num)) > 0.1
`,
      hints: ["`plus[i] += eps`, `minus[i] -= eps`로 i번째 성분만 움직입니다. `list(params)`로 복사했으므로 원본은 그대로입니다.", "`grads.append((f(plus) - f(minus)) / (2 * eps))`", "`relative_error`는 `abs(a - b) / max(1e-12, abs(a) + abs(b))`입니다. 분모의 1e-12는 둘 다 0일 때 0으로 나누는 것을 막습니다."],
      solution: py`
def numerical_grad(f, params, eps=1e-6):
    grads = []
    for i in range(len(params)):
        plus, minus = list(params), list(params)
        plus[i] += eps
        minus[i] -= eps
        grads.append((f(plus) - f(minus)) / (2 * eps))
    return grads

def relative_error(a, b):
    return abs(a - b) / max(1e-12, abs(a) + abs(b))

xs, ys = [1.0, 2.0, 3.0], [3.0, 5.0, 7.5]

def loss(params):
    w, b = params
    return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

def analytic_grad(params):
    w, b = params
    n = len(xs)
    dw = sum(2 * (w * x + b - y) * x for x, y in zip(xs, ys)) / n
    db = sum(2 * (w * x + b - y) for x, y in zip(xs, ys)) / n
    return [dw, db]

p = [0.5, -1.0]
num, ana = numerical_grad(loss, p), analytic_grad(p)
print("수치미분:", num)
print("해석적  :", ana)
print("상대오차:", [relative_error(a, b) for a, b in zip(ana, num)])
`,
    },
  ],
});
