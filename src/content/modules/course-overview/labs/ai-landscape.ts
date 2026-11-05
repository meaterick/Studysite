import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "평균제곱오차와 격자 탐색",
    prompt: md`
:::info 실습 뼈대 안내
함수(def·return)와 컴프리헨션은 [[lesson:functions-scope]]·[[lesson:comprehensions-iterators]], 반복문과 zip은 [[lesson:loops]]에서 차례로 배웁니다. 지금은 제공된 뼈대를 유지하고 표시된 TODO만 채웁니다. 실행이 어려우면 완성 예제의 입력과 출력부터 확인하고 Python 기초 뒤 다시 풀어도 됩니다.
:::


레슨의 손실 비교 예제를 코드로 구현합니다. 데이터는 대략 $y = 2x$를 따릅니다.

1. \`mse(theta, xs, ys)\`: 예측 $\hat y = \theta x$와 정답 $y$의 평균제곱오차를 돌려줍니다.
2. \`grid_search(xs, ys, candidates)\`: 후보 $\theta$ 중 손실이 가장 작은 값을 돌려줍니다. \`min(..., key=...)\` 없이 반복문으로 최솟값을 갱신해 봅니다.
`,
    starter: py`
xs = [1, 2, 3, 4]
ys = [2.1, 3.9, 6.2, 7.8]

def mse(theta, xs, ys):
    """예측 theta * x 와 정답 y 의 평균제곱오차"""
    # TODO: (theta * x - y) ** 2 를 모든 점에 대해 더한 뒤 점의 개수로 나눕니다.
    return 0.0

def grid_search(xs, ys, candidates):
    """candidates 중 mse가 가장 작은 theta를 돌려준다"""
    best_theta, best_loss = None, float("inf")
    for theta in candidates:
        # TODO: 손실을 계산하고, 지금까지의 최솟값보다 작으면 best_theta와 best_loss를 갱신합니다.
        pass
    return best_theta

print("theta=2 손실:", mse(2, xs, ys))
candidates = [t / 100 for t in range(0, 401)]   # 0.00 ~ 4.00
print("가장 좋은 theta:", grid_search(xs, ys, candidates))
`,
    tests: py`
@test("theta=2일 때 손실이 0.025")
def _():
    got = mse(2, [1, 2, 3, 4], [2.1, 3.9, 6.2, 7.8])
    assert approx(got, 0.025), f"mse(2) = {got}"

@test("theta=0이면 손실은 y²의 평균")
def _():
    assert approx(mse(0, [1, 2], [3, 4]), 12.5)

@test("0.01 간격 탐색의 최적값 ≈ 1.99")
def _():
    best = grid_search([1, 2, 3, 4], [2.1, 3.9, 6.2, 7.8], [t / 100 for t in range(0, 401)])
    assert best is not None, "grid_search가 None을 돌려줍니다."
    assert approx(best, 1.99), f"찾은 값: {best}"

@test("이상치(12.0)를 넣으면 최적 theta가 커진다")
def _():
    best = grid_search([1, 2, 3, 4], [2.1, 3.9, 6.2, 12.0], [t / 100 for t in range(0, 401)])
    assert best is not None and approx(best, 2.55), f"찾은 값: {best}"
`,
    hints: ["`zip(xs, ys)`로 x와 y를 짝지어 꺼낼 수 있습니다. `sum((theta * x - y) ** 2 for x, y in zip(xs, ys))`가 오차 제곱의 합입니다.", "평균이므로 합을 `len(xs)`로 나눕니다.", "`grid_search` 안에서 `loss = mse(theta, xs, ys)`를 구하고, `if loss < best_loss:`이면 `best_theta, best_loss = theta, loss`로 갱신합니다."],
    solution: py`
xs = [1, 2, 3, 4]
ys = [2.1, 3.9, 6.2, 7.8]

def mse(theta, xs, ys):
    return sum((theta * x - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

def grid_search(xs, ys, candidates):
    best_theta, best_loss = None, float("inf")
    for theta in candidates:
        loss = mse(theta, xs, ys)
        if loss < best_loss:
            best_theta, best_loss = theta, loss
    return best_theta

print("theta=2 손실:", mse(2, xs, ys))
candidates = [t / 100 for t in range(0, 401)]
print("가장 좋은 theta:", grid_search(xs, ys, candidates))
`,
  },
]);
