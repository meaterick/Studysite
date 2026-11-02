import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "경사하강법 함수와 학습률 진단기",
    prompt: md`

「미분과 경사하강법」의 갱신식 $w \leftarrow w - \eta \, \dfrac{dL}{dw}$을 어떤 손실에도 쓸 수 있는 함수로 만들고, 배율 $(1 - 2\eta)$로 학습률을 진단합니다.

1. \`gradient_descent(grad, w0, lr, steps)\`: 기울기 함수 \`grad\`를 받아 \`steps\`번 갱신하고, **매 스텝 갱신 뒤의 $w$**를 담은 리스트를 돌려줍니다.
2. \`diagnose(lr)\`: $L(w) = (w-3)^2$에서 오차 $w - 3$이 매 스텝 $(1 - 2\eta)$배가 된다는 사실을 이용해 \`"수렴"\`, \`"진동하며 수렴"\`, \`"발산"\` 중 하나를 돌려줍니다. 배율의 절댓값이 1 이상이면 0으로 줄지 않으므로 \`"발산"\`으로 분류합니다.
`,
    starter: py`
def gradient_descent(grad, w0, lr, steps):
    """w ← w - lr * grad(w)를 steps번 반복하고, 매 스텝 뒤의 w를 담은 리스트를 돌려준다"""
    w, history = w0, []
    for _ in range(steps):
        # TODO: 갱신식을 적용하고 history에 w를 추가합니다.
        pass
    return history

def diagnose(lr):
    """L(w) = (w-3)² 에서 학습률 lr의 수렴 양상: "수렴" / "진동하며 수렴" / "발산" """
    factor = 1 - 2 * lr
    # TODO: factor의 부호와 크기로 판단합니다.
    return ""

grad = lambda w: 2 * (w - 3)
print([round(w, 4) for w in gradient_descent(grad, 0.0, 0.1, 5)])
for lr in (0.01, 0.1, 0.5, 0.9, 1.1):
    print(f"lr={lr}: {diagnose(lr)}")
`,
    tests: py`
grad = lambda w: 2 * (w - 3)

@test("첫 스텝: w0=0, lr=0.1 → 0.6")
def _():
    h = gradient_descent(grad, 0.0, 0.1, 1)
    assert len(h) == 1 and approx(h[0], 0.6), f"history: {h}"

@test("30스텝 뒤 3에 가까워진다")
def _():
    h = gradient_descent(grad, 0.0, 0.1, 30)
    assert len(h) == 30 and abs(h[-1] - 3) < 0.01, f"마지막 w: {h[-1] if h else None}"

@test("오차가 매 스텝 (1 - 2·lr)배가 된다 (lr=0.2)")
def _():
    errs = [w - 3 for w in gradient_descent(grad, 0.0, 0.2, 3)]
    assert approx(errs, [-1.8, -1.08, -0.648]), f"오차: {errs}"

@test("다른 손실의 기울기도 받는다: L = w² + 4w + 1")
def _():
    h = gradient_descent(lambda w: 2 * w + 4, 1.0, 0.1, 1)
    assert approx(h[0], 0.4), f"history: {h}"

@test("진단: 0.1 수렴, 0.9 진동하며 수렴, 1.1 발산")
def _():
    got = [diagnose(lr) for lr in (0.1, 0.9, 1.1)]
    assert got == ["수렴", "진동하며 수렴", "발산"], f"결과: {got}"

@test("경계값: 0.5는 한 번에 도착(수렴), 1.0은 제자리 진동(발산)")
def _():
    assert diagnose(0.5) == "수렴" and diagnose(1.0) == "발산", f"{diagnose(0.5)}, {diagnose(1.0)}"
`,
    hints: ["반복문 안에서 `w = w - lr * grad(w)`로 갱신한 뒤 `history.append(w)`를 합니다.", "배율이 0 이상 1 미만이면 같은 부호로 줄어들고, -1과 0 사이면 부호가 번갈아 바뀌며 줄어듭니다.", "`if abs(factor) >= 1: return \"발산\"`을 먼저 검사하고, 그다음 `factor < 0`이면 진동하며 수렴, 아니면 수렴입니다."],
    solution: py`
def gradient_descent(grad, w0, lr, steps):
    w, history = w0, []
    for _ in range(steps):
        w = w - lr * grad(w)
        history.append(w)
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
