import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "순전파와 역전파를 한 단계씩 계산하기",
    prompt: md`

모델 $\hat y = wx$, 오차 $e = \hat y - y$, 손실 $L = e^2$의 계산을 한 줄씩 작성합니다. 본문의 표처럼 순전파로 값을 구한 뒤, 손실 쪽부터 국소 도함수를 하나씩 곱해 역전파합니다.

\`forward_backward(w, x, y)\`는 \`(y_hat, e, L, dL_de, dL_dyhat, dL_dw)\`를 돌려줍니다.

- $\frac{\partial L}{\partial e} = 2e$
- $\frac{\partial L}{\partial \hat y} = \frac{\partial L}{\partial e} \times \frac{\partial e}{\partial \hat y}$이고 $\frac{\partial e}{\partial \hat y} = 1$
- $\frac{\partial L}{\partial w} = \frac{\partial L}{\partial \hat y} \times \frac{\partial \hat y}{\partial w}$이고 $\frac{\partial \hat y}{\partial w} = x$

먼저 \`forward_backward(2, 4, 10)\`의 결과를 손으로 계산해 적어 두면 채점 결과와 비교할 수 있습니다.
`,
    starter: py`
def forward_backward(w, x, y):
    # 순전파
    y_hat = None      # TODO
    e = None          # TODO
    L = None          # TODO
    # 역전파
    dL_de = None      # TODO
    dL_dyhat = None   # TODO
    dL_dw = None      # TODO
    return y_hat, e, L, dL_de, dL_dyhat, dL_dw

print(forward_backward(2, 4, 10))
`,
    tests: py`
@test("(w, x, y) = (2, 4, 10)")
def _():
    got = forward_backward(2, 4, 10)
    assert None not in got, f"결과: {got}"
    assert approx(list(got), [8, -2, 4, -4, -4, -16]), f"결과: {got}"

@test("본문의 예 (1, 2, 6)")
def _():
    got = forward_backward(1, 2, 6)
    assert None not in got, f"결과: {got}"
    assert approx(list(got), [2, -4, 16, -8, -8, -16]), f"결과: {got}"

@test("dL/dw는 수치미분과 같다")
def _():
    for w, x, y in ((0.5, 3.0, 1.0), (-1.0, 2.0, 2.0)):
        L = lambda w_: (w_ * x - y) ** 2
        numeric = (L(w + 1e-5) - L(w - 1e-5)) / 2e-5
        got = forward_backward(w, x, y)[5]
        assert got is not None and approx(got, numeric, tol=1e-4), f"(w, x, y) = {(w, x, y)}: 결과 {got}, 수치미분 {numeric}"
`,
    hints: [
      "순전파는 `y_hat = w * x`, `e = y_hat - y`, `L = e ** 2`입니다.",
      "역전파는 윗줄의 결과에 국소 도함수를 곱합니다: `dL_de = 2 * e`, `dL_dyhat = dL_de * 1`, `dL_dw = dL_dyhat * x`입니다.",
    ],
    solution: py`
def forward_backward(w, x, y):
    # 순전파
    y_hat = w * x
    e = y_hat - y
    L = e ** 2
    # 역전파
    dL_de = 2 * e
    dL_dyhat = dL_de * 1
    dL_dw = dL_dyhat * x
    return y_hat, e, L, dL_de, dL_dyhat, dL_dw

print(forward_backward(2, 4, 10))
`,
  },
  {
    key: "ex1",
    title: "연쇄법칙으로 뉴런 하나의 기울기 구하기",
    prompt: md`

입력 하나를 받는 뉴런 $p = \sigma(wx + b)$와 제곱오차 $L = (p - y)^2$의 기울기를 연쇄법칙으로 구합니다.

1. \`sigmoid_grad(z)\`: 시그모이드의 도함수 $\sigma'(z) = \sigma(z)(1 - \sigma(z))$를 돌려줍니다. \`sigmoid\`는 미리 주어집니다.
2. \`neuron_grads(w, b, x, y)\`: 순전파로 $z = wx + b$, $p = \sigma(z)$, $L = (p - y)^2$을 계산한 뒤, 손실에서 거꾸로 국소 도함수를 곱해 \`(L, dL_dw, dL_db)\`를 돌려줍니다.

$$\frac{\partial L}{\partial w} = \frac{\partial L}{\partial p} \cdot \frac{\partial p}{\partial z} \cdot \frac{\partial z}{\partial w}, \qquad \frac{\partial L}{\partial b} = \frac{\partial L}{\partial p} \cdot \frac{\partial p}{\partial z} \cdot \frac{\partial z}{\partial b}$$
`,
    starter: py`
import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def sigmoid_grad(z):
    """σ'(z) = σ(z)(1 - σ(z))"""
    # TODO
    return 0.0

def neuron_grads(w, b, x, y):
    """L = (σ(wx + b) - y)²과 그 기울기 (L, dL/dw, dL/db)"""
    z = w * x + b
    p = sigmoid(z)
    L = (p - y) ** 2
    # TODO: dL/dp, dp/dz를 구하고, 둘을 곱한 dL/dz에 dz/dw = x, dz/db = 1을 곱합니다.
    dL_dw, dL_db = 0.0, 0.0
    return L, dL_dw, dL_db

print(round(sigmoid_grad(0.0), 4))                              # 기대: 0.25
print([round(v, 4) for v in neuron_grads(0.5, 0.0, 2.0, 1.0)])  # 기대: [0.0723, -0.2115, -0.1058]
`,
    tests: py`
import math

def _num(f, x, h=1e-6):
    return (f(x + h) - f(x - h)) / (2 * h)

@test("σ'(0) = 0.25")
def _():
    assert approx(sigmoid_grad(0.0), 0.25), f"결과: {sigmoid_grad(0.0)}"

@test("σ'(z)가 수치미분과 일치 (z = -3, 1, 4)")
def _():
    for z in (-3.0, 1.0, 4.0):
        assert approx(sigmoid_grad(z), _num(sigmoid, z), 1e-6), f"z={z}: {sigmoid_grad(z)}"

@test("손실 값: w=0.5, b=0, x=2, y=1 → L ≈ 0.0723")
def _():
    L, _dw, _db = neuron_grads(0.5, 0.0, 2.0, 1.0)
    assert approx(L, (sigmoid(1.0) - 1) ** 2), f"L = {L}"

@test("dL/dw, dL/db가 수치미분과 일치")
def _():
    for w, b, x, y in [(0.5, 0.0, 2.0, 1.0), (-1.0, 0.3, 1.5, 0.0), (2.0, -1.0, -0.5, 1.0)]:
        _L, dw, db = neuron_grads(w, b, x, y)
        want_dw = _num(lambda t: (sigmoid(t * x + b) - y) ** 2, w)
        want_db = _num(lambda t: (sigmoid(w * x + t) - y) ** 2, b)
        assert approx(dw, want_dw, 1e-6) and approx(db, want_db, 1e-6), f"{(w, b, x, y)}: {(dw, db)} vs {(want_dw, want_db)}"

@test("dL/dw = dL/db × x")
def _():
    _L, dw, db = neuron_grads(0.7, -0.2, 3.0, 0.0)
    assert approx(dw, db * 3.0), f"dw = {dw}, db = {db}"
`,
    hints: [
      "`s = sigmoid(z)`를 구한 뒤 `return s * (1 - s)`입니다.",
      "`dL_dp = 2 * (p - y)`, `dp_dz = p * (1 - p)`이고, 둘을 곱한 값이 `dL_dz`입니다.",
      "`dL_dw = dL_dz * x`, `dL_db = dL_dz * 1`입니다.",
    ],
    solution: py`
import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def sigmoid_grad(z):
    s = sigmoid(z)
    return s * (1 - s)

def neuron_grads(w, b, x, y):
    z = w * x + b
    p = sigmoid(z)
    L = (p - y) ** 2
    dL_dp = 2 * (p - y)
    dp_dz = p * (1 - p)
    dL_dz = dL_dp * dp_dz
    return L, dL_dz * x, dL_dz * 1

print(round(sigmoid_grad(0.0), 4))
print([round(v, 4) for v in neuron_grads(0.5, 0.0, 2.0, 1.0)])
`,
  },
]);
