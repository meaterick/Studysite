import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "로지스틱 회귀의 손실과 기울기 (p − y)x",
    prompt: md`

로지스틱 회귀를 부품으로 나눠 구현합니다. 학습 루프는 이미 작성되어 있습니다.

- \`sigmoid(z)\` $= \dfrac{1}{1 + e^{-z}}$
- \`bce_loss(p, y)\` $= -\dfrac{1}{n}\sum [y \log p + (1-y)\log(1-p)]$ ($\log 0$을 피하려고 \`p\`를 \`[1e-12, 1 - 1e-12]\`로 자릅니다)
- \`gradients(X, y, w, b)\`: 본문에서 유도한 기울기 $\dfrac{1}{n} X^\top (p - y)$와 $\dfrac{1}{n}\sum (p - y)$

모든 예측이 0.5일 때 손실이 $\ln 2 \approx 0.693$이 되는지도 확인합니다.
`,
    starter: py`
import numpy as np

def sigmoid(z):
    return 0.0  # TODO

def bce_loss(p, y):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return 0.0  # TODO: 이진 교차 엔트로피의 평균

def gradients(X, y, w, b):
    p = sigmoid(X @ w + b)
    grad_w = np.zeros_like(w)  # TODO: X.T @ (p - y) / n
    grad_b = 0.0               # TODO
    return grad_w, grad_b

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = (X[:, 0] + 0.5 * X[:, 1] + rng.normal(0, 0.5, 200) > 0).astype(int)

w, b = np.zeros(2), 0.0
for step in range(2000):
    gw, gb = gradients(X, y, w, b)
    w, b = w - 0.5 * gw, b - 0.5 * gb
p = sigmoid(X @ w + b)
print("w, b =", np.round(w, 3), round(float(b), 3))
print("손실 =", bce_loss(p, y), " 학습 데이터 정확도 =", np.mean((p >= 0.5) == y))
`,
    tests: py`
import numpy as np

@test("sigmoid(0) = 0.5, sigmoid(0.9) ≈ 0.711")
def _():
    assert approx(sigmoid(0.0), 0.5) and approx(sigmoid(0.9), 0.71095, tol=1e-4), f"sigmoid(0.9) = {sigmoid(0.9)}"

@test("모든 예측이 0.5면 손실 = ln 2")
def _():
    assert approx(bce_loss(np.full(4, 0.5), np.array([0, 1, 0, 1])), np.log(2))

@test("정답에 0.01을 주면 손실이 크다(≈ 4.605)")
def _():
    assert approx(bce_loss(np.array([0.01]), np.array([1])), 4.60517, tol=1e-4)

@test("기울기가 수치미분과 일치한다")
def _():
    rng = np.random.default_rng(1)
    Xt, yt = rng.normal(size=(30, 3)), rng.integers(0, 2, 30)
    w0, b0 = rng.normal(size=3), 0.3
    gw, gb = gradients(Xt, yt, w0, b0)
    L = lambda w, b: bce_loss(sigmoid(Xt @ w + b), yt)
    h = 1e-6
    num_w = [(L(w0 + h * e, b0) - L(w0 - h * e, b0)) / (2 * h) for e in np.eye(3)]
    num_b = (L(w0, b0 + h) - L(w0, b0 - h)) / (2 * h)
    assert approx(gw, num_w, 1e-5) and approx(gb, num_b, 1e-5), f"해석적 {gw}, {gb} / 수치 {np.round(num_w, 6)}, {num_b:.6f}"

@test("학습 후 학습 데이터 정확도 0.85 이상")
def _():
    rng = np.random.default_rng(0)
    Xt = rng.normal(size=(200, 2))
    yt = (Xt[:, 0] + 0.5 * Xt[:, 1] + rng.normal(0, 0.5, 200) > 0).astype(int)
    w, b = np.zeros(2), 0.0
    for _ in range(500):
        gw, gb = gradients(Xt, yt, w, b)
        w, b = w - 0.5 * gw, b - 0.5 * gb
    acc = np.mean((sigmoid(Xt @ w + b) >= 0.5) == yt)
    assert acc >= 0.85, f"정확도 {acc:.3f}"
`,
    hints: [
      "`sigmoid`는 `1 / (1 + np.exp(-z))`입니다. 배열에도 그대로 동작합니다.",
      "손실은 `-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))`입니다.",
      "`grad_w = X.T @ (p - y) / len(y)`, `grad_b = np.mean(p - y)`입니다. 선형회귀의 기울기와 모양이 같습니다.",
    ],
    solution: py`
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def bce_loss(p, y):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))

def gradients(X, y, w, b):
    p = sigmoid(X @ w + b)
    grad_w = X.T @ (p - y) / len(y)
    grad_b = np.mean(p - y)
    return grad_w, grad_b

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = (X[:, 0] + 0.5 * X[:, 1] + rng.normal(0, 0.5, 200) > 0).astype(int)

w, b = np.zeros(2), 0.0
for step in range(2000):
    gw, gb = gradients(X, y, w, b)
    w, b = w - 0.5 * gw, b - 0.5 * gb
p = sigmoid(X @ w + b)
print("w, b =", np.round(w, 3), round(float(b), 3))
print("손실 =", bce_loss(p, y), " 학습 데이터 정확도 =", np.mean((p >= 0.5) == y))
`,
  },
  {
    key: "ex2",
    title: "소프트맥스 회귀로 세 클래스 분류하기",
    prompt: md`

클래스가 $K$개인 소프트맥스 회귀를 구현합니다. 가중치 \`W\`의 모양은 \`(특성 수, K)\`, 편향 \`b\`는 길이 \`K\`, 정답 \`y\`는 \`0\`부터 \`K - 1\`까지의 정수 배열입니다.

1. \`softmax(Z)\`: 모양 \`(n, K)\`인 점수를 행마다 합이 1인 확률로 바꿉니다. 행마다 최댓값을 먼저 뺍니다.
2. \`softmax_gradients(X, y, W, b)\`: 확률 $P$와 원-핫 정답 $Y$로 $\dfrac{1}{n} X^\top (P - Y)$와 $P - Y$의 열 평균을 돌려줍니다.
`,
    starter: py`
import numpy as np

def softmax(Z):
    Z = np.asarray(Z, dtype=float)
    return Z  # TODO

def softmax_gradients(X, y, W, b):
    n = len(y)
    P = softmax(X @ W + b)
    Y = np.zeros_like(P)  # TODO: np.eye(W.shape[1])[y]로 원-핫 정답을 만듭니다.
    grad_W = np.zeros_like(W)  # TODO
    grad_b = np.zeros_like(b)  # TODO
    return grad_W, grad_b

rng = np.random.default_rng(0)
centers = np.array([[0, 2], [2, -1], [-2, -1]])
y = rng.integers(0, 3, 300)
X = centers[y] + rng.normal(0, 0.8, (300, 2))

W, b = np.zeros((2, 3)), np.zeros(3)
for _ in range(500):
    gW, gb = softmax_gradients(X, y, W, b)
    W, b = W - 0.5 * gW, b - 0.5 * gb
P = softmax(X @ W + b)
print("학습 데이터 정확도:", np.mean(P.argmax(axis=1) == y))   # 기대: 0.98 이상
`,
    tests: py`
import numpy as np

@test("softmax: 행마다 합이 1이고 큰 점수에서도 nan이 없다")
def _():
    P = np.asarray(softmax(np.array([[2.0, 1.0, 0.0], [1000.0, 1000.0, 999.0]])))
    assert approx(P.sum(axis=1), [1, 1]) and not np.isnan(P).any(), f"결과: {P}"
    assert approx(P[0], [0.66524, 0.24473, 0.09003], tol=1e-4)

@test("기울기가 수치미분과 일치한다")
def _():
    rng = np.random.default_rng(2)
    Xt, yt = rng.normal(size=(20, 3)), rng.integers(0, 4, 20)
    W0, b0 = rng.normal(size=(3, 4)), rng.normal(size=4)
    def loss(W, b):
        P = softmax(Xt @ W + b)
        return -np.mean(np.log(P[np.arange(len(yt)), yt]))
    gW, gb = softmax_gradients(Xt, yt, W0, b0)
    h = 1e-6
    num_W = np.zeros_like(W0)
    for i in range(3):
        for k in range(4):
            E = np.zeros_like(W0); E[i, k] = h
            num_W[i, k] = (loss(W0 + E, b0) - loss(W0 - E, b0)) / (2 * h)
    num_b = np.array([(loss(W0, b0 + h * e) - loss(W0, b0 - h * e)) / (2 * h) for e in np.eye(4)])
    assert approx(gW, num_W, 1e-5) and approx(gb, num_b, 1e-5), "해석적 기울기가 수치미분과 다릅니다."

@test("학습 후 세 클래스의 학습 데이터 정확도 0.95 이상")
def _():
    rng = np.random.default_rng(0)
    centers = np.array([[0, 2], [2, -1], [-2, -1]])
    yt = rng.integers(0, 3, 300)
    Xt = centers[yt] + rng.normal(0, 0.8, (300, 2))
    W, b = np.zeros((2, 3)), np.zeros(3)
    for _ in range(500):
        gW, gb = softmax_gradients(Xt, yt, W, b)
        W, b = W - 0.5 * gW, b - 0.5 * gb
    acc = np.mean(np.asarray(softmax(Xt @ W + b)).argmax(axis=1) == yt)
    assert acc >= 0.95, f"정확도 {acc:.3f}"
`,
    hints: [
      "`E = np.exp(Z - Z.max(axis=1, keepdims=True))` 다음 `E / E.sum(axis=1, keepdims=True)`입니다.",
      "`Y = np.eye(W.shape[1])[y]`는 정답 번호마다 단위행렬의 행을 골라 원-핫 행렬을 만듭니다.",
      "`grad_W = X.T @ (P - Y) / n`, `grad_b = (P - Y).mean(axis=0)`입니다. 이진 로지스틱 회귀와 같은 꼴입니다.",
    ],
    solution: py`
import numpy as np

def softmax(Z):
    Z = np.asarray(Z, dtype=float)
    E = np.exp(Z - Z.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)

def softmax_gradients(X, y, W, b):
    n = len(y)
    P = softmax(X @ W + b)
    Y = np.eye(W.shape[1])[y]
    grad_W = X.T @ (P - Y) / n
    grad_b = (P - Y).mean(axis=0)
    return grad_W, grad_b

rng = np.random.default_rng(0)
centers = np.array([[0, 2], [2, -1], [-2, -1]])
y = rng.integers(0, 3, 300)
X = centers[y] + rng.normal(0, 0.8, (300, 2))

W, b = np.zeros((2, 3)), np.zeros(3)
for _ in range(500):
    gW, gb = softmax_gradients(X, y, W, b)
    W, b = W - 0.5 * gW, b - 0.5 * gb
P = softmax(X @ W + b)
print("학습 데이터 정확도:", np.mean(P.argmax(axis=1) == y))
`,
  },
]);
