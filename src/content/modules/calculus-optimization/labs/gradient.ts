import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "편미분을 손으로 구해 기울기 함수 만들기",
    prompt: md`

$g(x, y) = x^2 y + y^3 - 2x$의 편미분을 손으로 구해 함수로 씁니다. 한 변수로 미분할 때 다른 변수는 상수로 봅니다.

1. \`dg_dx(x, y)\`: $\frac{\partial g}{\partial x}$
2. \`dg_dy(x, y)\`: $\frac{\partial g}{\partial y}$

\`grad_g(x, y)\`는 두 편미분을 리스트로 모으며 미리 주어집니다. 점 $(1, 2)$에서 기울기는 \`[2, 13]\`이어야 합니다.
`,
    starter: py`
def g(x, y):
    return x ** 2 * y + y ** 3 - 2 * x

def dg_dx(x, y):
    """y를 상수로 보고 x로 미분"""
    return 0.0   # TODO

def dg_dy(x, y):
    """x를 상수로 보고 y로 미분"""
    return 0.0   # TODO

def grad_g(x, y):
    return [dg_dx(x, y), dg_dy(x, y)]

print(grad_g(1, 2))
`,
    tests: py`
@test("점 (1, 2)의 기울기 [2, 13]")
def _():
    got = grad_g(1, 2)
    assert approx(got, [2.0, 13.0]), f"결과: {got}"

@test("원점의 기울기 [-2, 0]")
def _():
    assert approx(grad_g(0, 0), [-2.0, 0.0]), f"결과: {grad_g(0, 0)}"

@test("중심차분과 같다")
def _():
    h = 1e-5
    for x, y in ((0.5, -1.0), (2.0, 0.3), (-1.2, 1.5)):
        nx = (g(x + h, y) - g(x - h, y)) / (2 * h)
        ny = (g(x, y + h) - g(x, y - h)) / (2 * h)
        assert approx(grad_g(x, y), [nx, ny], tol=1e-4), f"({x}, {y}): 결과 {grad_g(x, y)}, 중심차분 {[nx, ny]}"
`,
    hints: [
      "$x$로 미분할 때 $x^2 y$는 $y$가 상수라 $2xy$, $y^3$은 0, $-2x$는 $-2$입니다.",
      "$y$로 미분할 때 $x^2 y$는 $x^2$, $y^3$은 $3y^2$, $-2x$는 0입니다. `return x ** 2 + 3 * y ** 2`입니다.",
    ],
    solution: py`
def g(x, y):
    return x ** 2 * y + y ** 3 - 2 * x

def dg_dx(x, y):
    """y를 상수로 보고 x로 미분"""
    return 2 * x * y - 2

def dg_dy(x, y):
    """x를 상수로 보고 y로 미분"""
    return x ** 2 + 3 * y ** 2

def grad_g(x, y):
    return [dg_dx(x, y), dg_dy(x, y)]

print(grad_g(1, 2))
`,
  },
  {
    key: "ex1",
    title: "수치 기울기와 평균제곱오차의 기울기",
    prompt: md`

1. \`numerical_gradient(f, p, h=1e-5)\`: NumPy 배열 \`p\`의 원소를 하나씩 $\pm h$만큼 움직여 중심차분으로 기울기를 구합니다. \`p\`가 벡터든 행렬이든 **결과는 \`p\`와 모양이 같아야** 합니다. \`p.flat[i]\`로 모양과 관계없이 \`i\`번째 원소에 접근할 수 있습니다.
2. \`mse_gradient(w, b, x, y)\`: 모델 $\hat y = wx + b$의 평균제곱오차 $\frac{1}{n}\sum_i (\hat y_i - y_i)^2$에 대한 기울기 \`(dw, db)\`를 본문의 식으로 계산합니다. \`x\`, \`y\`는 길이 $n$인 NumPy 배열입니다.

$$\frac{\partial L}{\partial w} = \frac{2}{n}\sum_{i}(\hat y_i - y_i)\,x_i, \qquad \frac{\partial L}{\partial b} = \frac{2}{n}\sum_{i}(\hat y_i - y_i)$$

두 결과가 같은지 비교해 식을 검산합니다.
`,
    starter: py`
import numpy as np

def numerical_gradient(f, p, h=1e-5):
    """f(p)의 기울기를 중심차분으로 구한다. 결과의 모양은 p와 같다."""
    p = np.asarray(p, dtype=float)
    grad = np.zeros_like(p)
    for i in range(p.size):
        step = np.zeros_like(p)
        # TODO: step의 i번째 원소를 h로 두고, grad의 i번째 원소에 중심차분 값을 넣습니다.
        pass
    return grad

def mse_gradient(w, b, x, y):
    """평균제곱오차의 기울기 (dL/dw, dL/db)"""
    y_hat = w * x + b
    # TODO: 본문의 식으로 dw, db를 계산합니다.
    dw, db = 0.0, 0.0
    return dw, db

x = np.array([1.0, 2.0, 3.0])
y = np.array([2.0, 4.0, 7.0])
print([round(float(v), 2) for v in mse_gradient(0.0, 0.0, x, y)])      # 기대: [-20.67, -8.67]
loss = lambda q: np.mean((q[0] * x + q[1] - y) ** 2)
print(np.round(numerical_gradient(loss, np.array([0.0, 0.0])), 2))      # 기대: [-20.67  -8.67]
`,
    tests: py`
import numpy as np

@test("f(x, y) = x² + 3xy + 2y²의 (1, 2)에서 기울기 = [8, 11]")
def _():
    f = lambda p: p[0] ** 2 + 3 * p[0] * p[1] + 2 * p[1] ** 2
    got = numerical_gradient(f, np.array([1.0, 2.0]))
    assert approx(got, [8, 11], 1e-6), f"결과: {got}"

@test("행렬 파라미터: f(W) = ΣW²의 기울기 = 2W, 모양 유지")
def _():
    W = np.arange(6, dtype=float).reshape(2, 3)
    got = numerical_gradient(lambda M: np.sum(M ** 2), W)
    assert np.shape(got) == (2, 3), f"모양: {np.shape(got)}"
    assert approx(got, 2 * W, 1e-5), f"결과: {got}"

@test("데이터 한 개: x=2, y=6, w=1, b=0 → (-16, -8)")
def _():
    dw, db = mse_gradient(1.0, 0.0, np.array([2.0]), np.array([6.0]))
    assert approx(dw, -16) and approx(db, -8), f"결과: {(dw, db)}"

@test("데이터 세 개: 식으로 구한 기울기 = 수치 기울기")
def _():
    x = np.array([1.0, 2.0, 3.0])
    y = np.array([2.0, 4.0, 7.0])
    loss = lambda q: np.mean((q[0] * x + q[1] - y) ** 2)
    for w, b in [(0.0, 0.0), (2.5, -0.5), (-1.0, 3.0)]:
        got = mse_gradient(w, b, x, y)
        want = numerical_gradient(loss, np.array([w, b]))
        assert approx(got, want, 1e-5), f"w={w}, b={b}: {got} vs {want}"

@test("최소제곱 해(w=2.5, b=-2/3)에서 기울기 = 0")
def _():
    x = np.array([1.0, 2.0, 3.0])
    y = np.array([2.0, 4.0, 7.0])
    assert approx(mse_gradient(2.5, -2 / 3, x, y), (0, 0), 1e-9)
`,
    hints: [
      "반복문 안에서 `step.flat[i] = h` 다음 `grad.flat[i] = (f(p + step) - f(p - step)) / (2 * h)`입니다.",
      "오차 배열 `err = y_hat - y`를 만들면 `dw = 2 * np.mean(err * x)`, `db = 2 * np.mean(err)`입니다.",
      "`np.mean`은 합을 $n$으로 나눈 값이므로 식의 $\\frac{2}{n}\\sum$을 `2 * np.mean(...)`으로 쓸 수 있습니다.",
    ],
    solution: py`
import numpy as np

def numerical_gradient(f, p, h=1e-5):
    p = np.asarray(p, dtype=float)
    grad = np.zeros_like(p)
    for i in range(p.size):
        step = np.zeros_like(p)
        step.flat[i] = h
        grad.flat[i] = (f(p + step) - f(p - step)) / (2 * h)
    return grad

def mse_gradient(w, b, x, y):
    y_hat = w * x + b
    err = y_hat - y
    dw = 2 * np.mean(err * x)
    db = 2 * np.mean(err)
    return dw, db

x = np.array([1.0, 2.0, 3.0])
y = np.array([2.0, 4.0, 7.0])
print([round(float(v), 2) for v in mse_gradient(0.0, 0.0, x, y)])
loss = lambda q: np.mean((q[0] * x + q[1] - y) ** 2)
print(np.round(numerical_gradient(loss, np.array([0.0, 0.0])), 2))
`,
  },
]);
