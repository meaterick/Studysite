import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "음의 로그가능도로 최대가능도추정하고 교차엔트로피 손실 구하기",
    prompt: md`

1. \`bernoulli_nll(p, ys)\`: 0과 1로 된 관찰 \`ys\`에 대한 평균 음의 로그가능도 $-\frac{1}{n}\sum_i [y_i \log p + (1 - y_i)\log(1 - p)]$ (자연로그)
2. \`mle_by_grid(ys, grid)\`: 후보 배열 \`grid\` 중 \`bernoulli_nll\`이 가장 작은 값
3. \`cross_entropy_loss(probs, labels)\`: 샘플마다의 클래스별 예측 확률 \`probs\`(모양 \`(n, k)\`)와 정답 클래스 \`labels\`(길이 $n$)로 $-\frac{1}{n}\sum_i \log q_i(y_i)$를 계산합니다. 반복문 없이 \`probs[np.arange(n), labels]\`로 정답 확률을 꺼냅니다.

이진 분류에서 \`cross_entropy_loss\`가 \`bernoulli_nll\`과 같은 값이 되는지도 확인합니다.
`,
    starter: py`
import numpy as np

def bernoulli_nll(p, ys):
    ys = np.asarray(ys, dtype=float)
    # TODO
    return 0.0

def mle_by_grid(ys, grid):
    # TODO: grid의 각 값에 bernoulli_nll을 계산하고 가장 작은 값의 후보를 고릅니다.
    return 0.0

def cross_entropy_loss(probs, labels):
    probs, labels = np.asarray(probs, dtype=float), np.asarray(labels)
    # TODO
    return 0.0

ys = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1]             # 10번 중 7번 성공
grid = np.linspace(0.01, 0.99, 99)
print(round(mle_by_grid(ys, grid), 2))           # 기대: 0.7
probs = np.array([[0.7, 0.2, 0.1], [0.1, 0.8, 0.1], [0.6, 0.3, 0.1]])
print(round(cross_entropy_loss(probs, [0, 1, 2]), 3))   # 기대: 0.961
`,
    tests: py`
import numpy as np

ys = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1]

@test("bernoulli_nll(0.7, ys) = -(0.7·ln 0.7 + 0.3·ln 0.3)")
def _():
    want = -(0.7 * np.log(0.7) + 0.3 * np.log(0.3))
    assert approx(bernoulli_nll(0.7, ys), want), f"결과: {bernoulli_nll(0.7, ys)}"

@test("격자 탐색의 최대가능도추정값 = 성공 비율 k/n")
def _():
    grid = np.linspace(0.01, 0.99, 99)
    assert approx(mle_by_grid(ys, grid), 0.7), f"결과: {mle_by_grid(ys, grid)}"
    assert approx(mle_by_grid([1, 0, 0, 0], grid), 0.25), f"결과: {mle_by_grid([1, 0, 0, 0], grid)}"

@test("교차엔트로피 손실: 본문 예제 → 약 0.961")
def _():
    probs = np.array([[0.7, 0.2, 0.1], [0.1, 0.8, 0.1], [0.6, 0.3, 0.1]])
    want = -np.mean(np.log([0.7, 0.8, 0.1]))
    assert approx(cross_entropy_loss(probs, [0, 1, 2]), want), f"결과: {cross_entropy_loss(probs, [0, 1, 2])}"

@test("완벽한 예측(정답 확률 1)의 손실은 0")
def _():
    assert approx(cross_entropy_loss(np.eye(3), [0, 1, 2]), 0.0)

@test("이진 분류: 모든 샘플에 확률 p를 주면 교차엔트로피 = 베르누이 NLL")
def _():
    p = 0.6
    probs = np.array([[1 - p, p]] * len(ys))     # [클래스 0 확률, 클래스 1 확률]
    assert approx(cross_entropy_loss(probs, ys), bernoulli_nll(p, ys))
`,
    hints: [
      "`bernoulli_nll`은 `-np.mean(ys * np.log(p) + (1 - ys) * np.log(1 - p))`입니다.",
      "`nlls = [bernoulli_nll(p, ys) for p in grid]` 다음 `float(grid[np.argmin(nlls)])`입니다.",
      "`cross_entropy_loss`는 `-np.mean(np.log(probs[np.arange(len(labels)), labels]))`입니다.",
    ],
    solution: py`
import numpy as np

def bernoulli_nll(p, ys):
    ys = np.asarray(ys, dtype=float)
    return float(-np.mean(ys * np.log(p) + (1 - ys) * np.log(1 - p)))

def mle_by_grid(ys, grid):
    nlls = [bernoulli_nll(p, ys) for p in grid]
    return float(grid[np.argmin(nlls)])

def cross_entropy_loss(probs, labels):
    probs, labels = np.asarray(probs, dtype=float), np.asarray(labels)
    return float(-np.mean(np.log(probs[np.arange(len(labels)), labels])))

ys = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1]
grid = np.linspace(0.01, 0.99, 99)
print(round(mle_by_grid(ys, grid), 2))
probs = np.array([[0.7, 0.2, 0.1], [0.1, 0.8, 0.1], [0.6, 0.3, 0.1]])
print(round(cross_entropy_loss(probs, [0, 1, 2]), 3))
`,
  },
]);
