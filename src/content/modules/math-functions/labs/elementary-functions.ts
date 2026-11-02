import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "포물선의 꼭짓점, 로그 가능도, 넘치지 않는 시그모이드",
    prompt: md`

세 함수를 완성합니다.

1. \`quadratic_min(a, b, c)\`: $y = ax^2 + bx + c$의 최솟값 위치와 값 \`(x, y)\`를 돌려줍니다. $a \le 0$이면 최솟값이 없으므로 \`ValueError\`를 일으킵니다.
2. \`log_likelihood(probs)\`: 확률들의 곱의 로그, 즉 $\sum_i \ln p_i$를 돌려줍니다. 곱을 먼저 계산하지 않습니다. 0 이하이거나 1보다 큰 확률이 있으면 \`ValueError\`입니다.
3. \`sigmoid(z)\`: $\frac{1}{1 + e^{-z}}$를 계산하되, $z$가 아주 큰 음수(예: −1000)여도 \`OverflowError\` 없이 계산합니다. $z \ge 0$이면 그대로, $z < 0$이면 분자·분모에 $e^{z}$를 곱한 $\frac{e^{z}}{1 + e^{z}}$로 계산합니다.
`,
    starter: py`
import math

def quadratic_min(a, b, c):
    """y = ax^2 + bx + c의 (최솟값 위치, 최솟값). a <= 0이면 ValueError"""
    # TODO: a <= 0이면 ValueError, 아니면 x = -b / (2a)와 그때의 y를 돌려줍니다.
    return 0.0, 0.0

def log_likelihood(probs):
    """sum(log p). 확률이 (0, 1] 밖이면 ValueError"""
    product = 1.0
    for p in probs:
        product *= p          # TODO: 곱하지 말고 로그를 더합니다. 범위 밖의 확률도 검사합니다.
    return math.log(product)

def sigmoid(z):
    """넘침 없는 시그모이드"""
    return 1 / (1 + math.exp(-z))   # TODO: z < 0이면 e^z / (1 + e^z)로 계산합니다.

print(quadratic_min(14 / 3, -62 / 3, 23))
print(log_likelihood([0.5] * 4))
print(sigmoid(0), sigmoid(2))
`,
    tests: py`
import math

@test("quadratic_min: 평균제곱오차 예제의 꼭짓점 31/14")
def _():
    x, y = quadratic_min(14 / 3, -62 / 3, 23)
    assert approx(x, 31 / 14) and approx(y, 0.11904761904761904, tol=1e-9), f"결과: {(x, y)}"

@test("quadratic_min: a <= 0이면 ValueError")
def _():
    for a in (0, -1):
        try:
            quadratic_min(a, 1, 1)
            raised = False
        except ValueError:
            raised = True
        assert raised, f"a = {a}에서 ValueError가 나지 않았습니다."

@test("log_likelihood: 1100개의 0.5도 계산한다(곱하면 0이 된다)")
def _():
    got = log_likelihood([0.5] * 1100)
    assert approx(got, 1100 * math.log(0.5), tol=1e-9), f"결과: {got}"

@test("log_likelihood: 범위 밖의 확률은 ValueError")
def _():
    for bad in ([0.5, 0.0], [1.2], [-0.1]):
        try:
            log_likelihood(bad)
            raised = False
        except ValueError:
            raised = True
        assert raised, f"{bad}에서 ValueError가 나지 않았습니다."

@test("sigmoid: 큰 음수·양수에서도 계산된다")
def _():
    assert approx(sigmoid(0), 0.5) and approx(sigmoid(2), 1 / (1 + math.exp(-2)))
    assert sigmoid(-1000) == 0.0 and sigmoid(1000) == 1.0
    assert approx(sigmoid(-2), 1 - sigmoid(2))
`,
    hints: [
      "꼭짓점은 `x = -b / (2 * a)`, 최솟값은 그 x를 식에 넣은 `a * x * x + b * x + c`입니다.",
      "`total = 0.0`에서 시작해 `if not 0 < p <= 1: raise ValueError(...)` 다음 `total += math.log(p)`를 반복합니다.",
      "`if z >= 0: return 1 / (1 + math.exp(-z))`이고, 아니면 `e = math.exp(z)`로 `e / (1 + e)`입니다. z가 음수일 때 `math.exp(z)`는 넘치지 않습니다.",
    ],
    solution: py`
import math

def quadratic_min(a, b, c):
    if a <= 0:
        raise ValueError("a > 0일 때만 최솟값이 있다")
    x = -b / (2 * a)
    return x, a * x * x + b * x + c

def log_likelihood(probs):
    total = 0.0
    for p in probs:
        if not 0 < p <= 1:
            raise ValueError(f"확률이 (0, 1] 밖이다: {p}")
        total += math.log(p)
    return total

def sigmoid(z):
    if z >= 0:
        return 1 / (1 + math.exp(-z))
    e = math.exp(z)
    return e / (1 + e)

print(quadratic_min(14 / 3, -62 / 3, 23))
print(log_likelihood([0.5] * 4))
print(sigmoid(0), sigmoid(2))
`,
  },
]);
