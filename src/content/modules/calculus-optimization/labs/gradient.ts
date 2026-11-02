import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
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
