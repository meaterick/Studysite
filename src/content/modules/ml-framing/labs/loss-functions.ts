import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "손실함수 세 가지와 규제항이 있는 목적함수",
    prompt: md`

손실과 목적함수를 NumPy로 계산합니다. 모두 샘플 평균을 돌려줍니다.

1. \`mse(y_hat, y)\`: 평균제곱오차
2. \`mae(y_hat, y)\`: 평균 절대 오차
3. \`binary_cross_entropy(p, y, eps=1e-12)\`: 양성 확률 \`p\`와 정답 \`y\`(0 또는 1)의 평균 교차 엔트로피 $-\frac{1}{n}\sum_i [\,y_i \log p_i + (1 - y_i)\log(1 - p_i)\,]$. \`log(0)\`을 피하려고 \`p\`를 \`np.clip(p, eps, 1 - eps)\`로 자른 뒤 계산합니다.
4. \`objective(w, b, x, y, lam)\`: 선형 모델 $\hat y = wx + b$의 평균제곱오차에 규제항 $\lambda w^2$를 더한 값. 편향 $b$는 규제하지 않습니다.
`,
    starter: py`
import numpy as np

def mse(y_hat, y):
    return 0.0  # TODO

def mae(y_hat, y):
    return 0.0  # TODO

def binary_cross_entropy(p, y, eps=1e-12):
    p = np.clip(np.asarray(p, dtype=float), eps, 1 - eps)
    y = np.asarray(y, dtype=float)
    return 0.0  # TODO

def objective(w, b, x, y, lam):
    return 0.0  # TODO: mse(w * x + b, y) + lam * w ** 2

print(mse([2.5, 5.0, 7.5], [2, 4, 7]))              # 기대: 0.5
print(mae([2.5, 5.0, 7.5], [2, 4, 7]))              # 기대: 0.6666...
print(round(binary_cross_entropy([0.9, 0.2], [1, 0]), 4))   # 기대: 0.1643
`,
    tests: py`
import numpy as np

@test("mse와 mae: 오차 [1, -1, 4]")
def _():
    y = np.array([0.0, 0.0, 0.0])
    y_hat = np.array([1.0, -1.0, 4.0])
    assert approx(mse(y_hat, y), 6.0), f"mse: {mse(y_hat, y)}"
    assert approx(mae(y_hat, y), 2.0), f"mae: {mae(y_hat, y)}"

@test("binary_cross_entropy: 정답 쪽 확률로 계산한다")
def _():
    assert approx(binary_cross_entropy([0.9], [1]), -np.log(0.9))
    assert approx(binary_cross_entropy([0.9], [0]), -np.log(0.1))
    assert approx(binary_cross_entropy([0.9, 0.2], [1, 0]), (-np.log(0.9) - np.log(0.8)) / 2)

@test("binary_cross_entropy: p가 0이나 1이어도 inf나 nan이 나오지 않는다")
def _():
    v = binary_cross_entropy([0.0, 1.0], [1, 0])
    assert np.isfinite(v) and v > 20, f"결과: {v}"

@test("objective: 규제항은 w에만 붙는다")
def _():
    x = np.array([1.0, 2.0, 3.0])
    y = np.array([2.0, 4.0, 7.0])
    assert approx(objective(2.0, 0.0, x, y, 0.0), 1 / 3)
    assert approx(objective(2.0, 0.0, x, y, 0.1), 1 / 3 + 0.4)
    assert approx(objective(2.0, 1.0, x, y, 0.1) - mse(2.0 * x + 1.0, y), 0.4)
`,
    hints: [
      "`mse`는 `np.mean((np.asarray(y_hat) - np.asarray(y)) ** 2)`, `mae`는 제곱 대신 `np.abs`입니다.",
      "`-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))`입니다. `p`는 이미 잘라 두었습니다.",
      "`objective`는 위에서 만든 `mse`를 다시 씁니다: `mse(w * x + b, y) + lam * w ** 2`.",
    ],
    solution: py`
import numpy as np

def mse(y_hat, y):
    return float(np.mean((np.asarray(y_hat, dtype=float) - np.asarray(y, dtype=float)) ** 2))

def mae(y_hat, y):
    return float(np.mean(np.abs(np.asarray(y_hat, dtype=float) - np.asarray(y, dtype=float))))

def binary_cross_entropy(p, y, eps=1e-12):
    p = np.clip(np.asarray(p, dtype=float), eps, 1 - eps)
    y = np.asarray(y, dtype=float)
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))

def objective(w, b, x, y, lam):
    return mse(w * x + b, y) + lam * w ** 2

print(mse([2.5, 5.0, 7.5], [2, 4, 7]))
print(mae([2.5, 5.0, 7.5], [2, 4, 7]))
print(round(binary_cross_entropy([0.9, 0.2], [1, 0]), 4))
`,
  },
  {
    key: "ex2",
    title: "경사하강법 학습 루프와 추론",
    prompt: md`

선형 모델 $\hat y = wx + b$를 평균제곱오차로 학습하는 루프를 만듭니다.

1. \`fit_line(x, y, lr, steps)\`: $w = b = 0$에서 시작해 \`steps\`번 반복합니다. 반복마다 **갱신하기 전의** 평균제곱오차를 \`history\`에 추가하고, 기울기 $\frac{2}{n}\sum_i (\hat y_i - y_i)x_i$, $\frac{2}{n}\sum_i (\hat y_i - y_i)$로 $w$와 $b$를 동시에 갱신합니다. \`(w, b, history)\`를 돌려줍니다.
2. \`predict(w, b, x_new)\`: 고정된 $w, b$로 예측만 계산합니다(추론).
`,
    starter: py`
import numpy as np

def fit_line(x, y, lr, steps):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    w, b = 0.0, 0.0
    history = []
    for _ in range(steps):
        pass  # TODO: 예측 → 손실 기록 → 기울기 → 갱신
    return w, b, history

def predict(w, b, x_new):
    return np.zeros(len(x_new))  # TODO

rng = np.random.default_rng(0)
x = rng.uniform(0, 10, 50)
y = 3 * x + 5 + rng.normal(0, 2, 50)
w, b, history = fit_line(x, y, lr=0.02, steps=1000)
print(round(w, 3), round(b, 3), round(history[0], 2), round(history[-1], 2))   # 기대: 3.105 4.515 521.47 3.97
print(predict(w, b, np.array([2.0, 7.5])).round(2))                            # 기대: [10.72 27.8 ]
`,
    tests: py`
import numpy as np

rng = np.random.default_rng(0)
X = rng.uniform(0, 10, 50)
Y = 3 * X + 5 + rng.normal(0, 2, 50)

@test("history는 반복 횟수만큼, 첫 값은 w = b = 0일 때의 손실")
def _():
    w, b, h = fit_line(X, Y, lr=0.02, steps=50)
    assert len(h) == 50, f"history 길이: {len(h)}"
    assert approx(h[0], np.mean(Y ** 2)), f"첫 손실: {h[0]}"

@test("손실이 줄어들고 최소제곱 해에 도달한다")
def _():
    w, b, h = fit_line(X, Y, lr=0.02, steps=2000)
    assert h[-1] < h[0] and all(a >= c - 1e-9 for a, c in zip(h, h[1:])), "손실이 줄지 않는 구간이 있습니다."
    w_ref, b_ref = np.polyfit(X, Y, 1)
    assert approx([w, b], [w_ref, b_ref], tol=1e-3), f"결과: w={w}, b={b} / 기대: {w_ref}, {b_ref}"

@test("w와 b를 동시에 갱신한다")
def _():
    w, b, _ = fit_line([1.0, 2.0], [3.0, 5.0], lr=0.1, steps=1)
    # 갱신 전 w = b = 0: grad_w = 2 * mean((0 - y) * x) = -13, grad_b = 2 * mean(0 - y) = -8
    assert approx([w, b], [1.3, 0.8]), f"결과: w={w}, b={b}"

@test("predict는 파라미터를 바꾸지 않고 예측만 한다")
def _():
    assert approx(predict(2.0, 1.0, np.array([0.0, 1.5, 3.0])), [1.0, 4.0, 7.0])
`,
    hints: [
      "반복 안에서 `y_hat = w * x + b`, `history.append(float(np.mean((y_hat - y) ** 2)))`를 먼저 합니다.",
      "`grad_w = np.mean(2 * (y_hat - y) * x)`, `grad_b = np.mean(2 * (y_hat - y))`를 계산한 뒤 `w, b = w - lr * grad_w, b - lr * grad_b`로 한 줄에 갱신하면 두 값이 갱신 전의 예측으로 계산됩니다.",
      "`predict`는 `w * np.asarray(x_new, dtype=float) + b`입니다.",
    ],
    solution: py`
import numpy as np

def fit_line(x, y, lr, steps):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    w, b = 0.0, 0.0
    history = []
    for _ in range(steps):
        y_hat = w * x + b
        history.append(float(np.mean((y_hat - y) ** 2)))
        grad_w = np.mean(2 * (y_hat - y) * x)
        grad_b = np.mean(2 * (y_hat - y))
        w, b = w - lr * grad_w, b - lr * grad_b
    return w, b, history

def predict(w, b, x_new):
    return w * np.asarray(x_new, dtype=float) + b

rng = np.random.default_rng(0)
x = rng.uniform(0, 10, 50)
y = 3 * x + 5 + rng.normal(0, 2, 50)
w, b, history = fit_line(x, y, lr=0.02, steps=1000)
print(round(w, 3), round(b, 3), round(history[0], 2), round(history[-1], 2))
print(predict(w, b, np.array([2.0, 7.5])).round(2))
`,
  },
]);
