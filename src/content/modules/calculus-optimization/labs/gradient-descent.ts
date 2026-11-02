import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "경사하강법 함수와 학습률 진단",
    prompt: md`

본문의 갱신식 $\theta \leftarrow \theta - \eta\,\nabla L(\theta)$를 어떤 손실에도 쓸 수 있는 함수로 만들고, 배율 $1 - 2\eta$로 학습률을 진단합니다.

1. \`gradient_descent(grad, theta0, lr, steps)\`: 기울기 함수 \`grad\`를 받아 \`steps\`번 갱신하고, **갱신할 때마다 그 뒤의 파라미터**를 담은 리스트를 돌려줍니다. \`theta0\`가 실수 하나여도, NumPy 배열이어도 같은 코드로 동작해야 합니다.
2. \`diagnose(lr)\`: $L(w) = (w - 3)^2$에서 오차 $w - 3$이 매번 $(1 - 2\eta)$배가 된다는 사실로 \`"수렴"\`, \`"진동하며 수렴"\`, \`"발산"\` 중 하나를 돌려줍니다. 배율의 절댓값이 1 이상이면 오차가 0으로 줄지 않으므로 \`"발산"\`으로 분류합니다.
`,
    starter: py`
import numpy as np

def gradient_descent(grad, theta0, lr, steps):
    """theta ← theta - lr * grad(theta)를 steps번 반복하고, 매번 갱신한 뒤의 theta를 담은 리스트를 돌려준다"""
    theta, history = theta0, []
    for _ in range(steps):
        # TODO: 갱신식을 적용하고 history에 theta를 추가합니다.
        pass
    return history

def diagnose(lr):
    """L(w) = (w - 3)²에서 학습률 lr의 수렴 양상: "수렴" / "진동하며 수렴" / "발산" """
    factor = 1 - 2 * lr
    # TODO: factor의 부호와 크기로 판단합니다.
    return ""

grad = lambda w: 2 * (w - 3)
print([round(w, 4) for w in gradient_descent(grad, 0.0, 0.1, 5)])   # 기대: [0.6, 1.08, 1.464, 1.7712, 2.017]
for lr in (0.01, 0.1, 0.5, 0.9, 1.1):
    print(f"lr={lr}: {diagnose(lr)}")
`,
    tests: py`
import numpy as np

grad = lambda w: 2 * (w - 3)

@test("첫 갱신: w0 = 0, lr = 0.1 → 0.6")
def _():
    h = gradient_descent(grad, 0.0, 0.1, 1)
    assert len(h) == 1 and approx(h[0], 0.6), f"history: {h}"

@test("30번 갱신하면 3에 가까워진다")
def _():
    h = gradient_descent(grad, 0.0, 0.1, 30)
    assert len(h) == 30 and abs(h[-1] - 3) < 0.01, f"마지막 w: {h[-1] if h else None}"

@test("오차가 매번 (1 - 2·lr)배가 된다 (lr = 0.2)")
def _():
    errs = [w - 3 for w in gradient_descent(grad, 0.0, 0.2, 3)]
    assert approx(errs, [-1.8, -1.08, -0.648]), f"오차: {errs}"

@test("NumPy 배열 파라미터: 선형 회귀 (w, b)가 최소제곱 해에 수렴")
def _():
    x = np.array([1.0, 2.0, 3.0])
    y = np.array([2.0, 4.0, 7.0])
    def mse_grad(t):
        err = t[0] * x + t[1] - y
        return np.array([2 * np.mean(err * x), 2 * np.mean(err)])
    h = gradient_descent(mse_grad, np.array([0.0, 0.0]), 0.05, 2000)
    assert len(h) == 2000, f"history 길이: {len(h)}"
    assert approx(h[-1], [2.5, -2 / 3], 1e-4), f"마지막 (w, b): {h[-1]}"

@test("진단: 0.1 수렴, 0.9 진동하며 수렴, 1.1 발산")
def _():
    got = [diagnose(lr) for lr in (0.1, 0.9, 1.1)]
    assert got == ["수렴", "진동하며 수렴", "발산"], f"결과: {got}"

@test("경계값: 0.5는 한 번에 도착(수렴), 1.0은 제자리에서 진동(발산)")
def _():
    assert diagnose(0.5) == "수렴" and diagnose(1.0) == "발산", f"{diagnose(0.5)}, {diagnose(1.0)}"
`,
    hints: [
      "반복문 안에서 `theta = theta - lr * grad(theta)`로 갱신한 뒤 `history.append(theta)`를 합니다. `theta -= ...`는 배열을 제자리에서 바꾸므로, 이미 history에 넣은 값까지 바뀝니다.",
      "배율이 0 이상 1 미만이면 같은 부호를 유지하며 줄고, -1과 0 사이이면 부호가 번갈아 바뀌며 줄어듭니다.",
      "`if abs(factor) >= 1: return \"발산\"`을 먼저 검사하고, 그다음 `factor < 0`이면 진동하며 수렴, 아니면 수렴입니다.",
    ],
    solution: py`
import numpy as np

def gradient_descent(grad, theta0, lr, steps):
    theta, history = theta0, []
    for _ in range(steps):
        theta = theta - lr * grad(theta)
        history.append(theta)
    return history

def diagnose(lr):
    factor = 1 - 2 * lr
    if abs(factor) >= 1:
        return "발산"
    if factor < 0:
        return "진동하며 수렴"
    return "수렴"

grad = lambda w: 2 * (w - 3)
print([round(w, 4) for w in gradient_descent(grad, 0.0, 0.1, 5)])
for lr in (0.01, 0.1, 0.5, 0.9, 1.1):
    print(f"lr={lr}: {diagnose(lr)}")
`,
  },
]);
