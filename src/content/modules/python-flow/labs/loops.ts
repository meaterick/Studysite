import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "탐색과 조기 종료",
    prompt: md`
:::info 실습 뼈대 안내
함수(def·return)는 [[lesson:functions-scope]]에서 배웁니다. 지금은 함수 뼈대를 유지하고 TODO 안에 이 레슨의 문법을 적용합니다. split·strip·lower 같은 문자열 메서드는 [[lesson:operators]]의 문자열 부분을 참고합니다.
:::


두 함수를 완성합니다.

1. \`first_above(values, threshold)\`: \`values\`에서 \`threshold\`보다 큰 첫 원소의 **인덱스**를 돌려줍니다. 없으면 \`-1\`을 돌려줍니다. 찾으면 더 볼 필요가 없으므로 그 자리에서 \`return\`합니다.
2. \`steps_to_converge(w, lr, tol)\`: 레슨의 학습 루프처럼 \`grad = 2 * (w - 3)\`을 계산하고, \`abs(grad) < tol\`이면 지금까지의 갱신 횟수를 돌려줍니다. 아니면 \`w -= lr * grad\`로 갱신하고 횟수를 1 늘린 뒤 반복합니다.
`,
    starter: py`
def first_above(values, threshold):
    """threshold보다 큰 첫 원소의 인덱스. 없으면 -1"""
    for i in range(len(values)):
        # TODO: values[i]가 threshold보다 크면 i를 돌려줍니다.
        pass
    return -1

def steps_to_converge(w, lr=0.1, tol=1e-3):
    """|grad| < tol이 될 때까지의 갱신 횟수"""
    steps = 0
    while True:
        grad = 2 * (w - 3)
        # TODO: abs(grad) < tol이면 steps를 돌려줍니다.
        # TODO: w를 갱신하고 steps를 1 늘립니다.
        return steps   # TODO를 채운 뒤 이 줄은 지웁니다.

print(first_above([0.2, 0.5, 0.9, 0.95], 0.8))
print(steps_to_converge(0.0))
`,
    tests: py`
@test("first_above: 처음으로 0.8보다 큰 0.9의 인덱스 2")
def _():
    got = first_above([0.2, 0.5, 0.9, 0.95], 0.8)
    assert got == 2, f"결과: {got}"

@test("first_above: 같은 값은 '큰' 것이 아니다, 없으면 -1")
def _():
    assert first_above([0.8, 0.8], 0.8) == -1
    assert first_above([], 0.5) == -1

@test("steps_to_converge(0.0) == 39")
def _():
    got = steps_to_converge(0.0)
    assert got == 39, f"결과: {got}"

@test("학습률이 크면 더 빨리 수렴한다: lr=0.4 → 6")
def _():
    got = steps_to_converge(0.0, lr=0.4)
    assert got == 6, f"결과: {got}"

@test("이미 최적이면 0번")
def _():
    assert steps_to_converge(3.0) == 0
`,
    hints: [
      "`if values[i] > threshold: return i`처럼 찾자마자 돌려주면, 남은 원소는 보지 않습니다.",
      "`while True:`는 조건 없이 반복하므로, 블록 안의 `return`이 유일한 종료 지점이 되어야 합니다. 시작 코드의 마지막 `return steps`는 지웁니다.",
      "순서는 ① grad 계산 ② `if abs(grad) < tol: return steps` ③ `w -= lr * grad` ④ `steps += 1`입니다.",
    ],
    solution: py`
def first_above(values, threshold):
    for i in range(len(values)):
        if values[i] > threshold:
            return i
    return -1

def steps_to_converge(w, lr=0.1, tol=1e-3):
    steps = 0
    while True:
        grad = 2 * (w - 3)
        if abs(grad) < tol:
            return steps
        w -= lr * grad
        steps += 1

print(first_above([0.2, 0.5, 0.9, 0.95], 0.8))
print(steps_to_converge(0.0))
`,
  },
]);
