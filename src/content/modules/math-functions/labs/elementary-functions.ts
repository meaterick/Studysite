import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "평균제곱오차를 이차함수의 계수로 정리하기",
    prompt: md`

모델 $\hat y = wx$의 평균제곱오차는 $L(w) = aw^2 + bw + c$ 꼴의 이차함수이고, 계수는 다음과 같습니다(레슨 본문의 전개).

\`\`\`math
a = \frac{1}{n}\sum_i x_i^2, \quad b = -\frac{2}{n}\sum_i x_i y_i, \quad c = \frac{1}{n}\sum_i y_i^2
\`\`\`

1. \`mse_coefficients(xs, ys)\`: 계수 \`(a, b, c)\`를 돌려줍니다.
2. \`best_w(xs, ys)\`: 꼭짓점 $w^* = -\frac{b}{2a}$를 돌려줍니다. 1번 함수를 이용합니다.

본문의 데이터 $(1, 2), (2, 4), (3, 7)$에서는 \`(14/3, -62/3, 23)\`과 \`31/14\`가 나와야 합니다. NumPy 없이 \`sum\`과 \`zip\`으로 작성합니다.
`,
    starter: py`
def mse_coefficients(xs, ys):
    """L(w) = a w^2 + b w + c의 (a, b, c)"""
    n = len(xs)
    a = 0.0   # TODO: x_i^2의 합 / n
    b = 0.0   # TODO: -2 * (x_i * y_i의 합) / n
    c = 0.0   # TODO: y_i^2의 합 / n
    return a, b, c

def best_w(xs, ys):
    """평균제곱오차가 가장 작은 w"""
    a, b, c = mse_coefficients(xs, ys)
    return 0.0   # TODO: 꼭짓점 -b / (2a)

xs, ys = [1, 2, 3], [2, 4, 7]
print(mse_coefficients(xs, ys))
print(best_w(xs, ys))
`,
    tests: py`
@test("본문 데이터의 계수 (14/3, -62/3, 23)")
def _():
    got = mse_coefficients([1, 2, 3], [2, 4, 7])
    assert approx(list(got), [14 / 3, -62 / 3, 23.0]), f"결과: {got}"

@test("본문 데이터의 꼭짓점 31/14")
def _():
    got = best_w([1, 2, 3], [2, 4, 7])
    assert approx(got, 31 / 14), f"결과: {got}"

@test("다른 데이터: (0, 1), (1, 3), (2, 2), (3, 5)")
def _():
    xs, ys = [0, 1, 2, 3], [1, 3, 2, 5]
    assert approx(list(mse_coefficients(xs, ys)), [3.5, -11.0, 9.75]), f"결과: {mse_coefficients(xs, ys)}"
    assert approx(best_w(xs, ys), 22 / 14), f"결과: {best_w(xs, ys)}"

@test("완벽히 맞는 데이터에서는 꼭짓점의 손실이 0")
def _():
    xs, ys = [1, 2, 4], [3, 6, 12]
    a, b, c = mse_coefficients(xs, ys)
    w = best_w(xs, ys)
    assert approx(w, 3.0) and approx(a * w * w + b * w + c, 0.0, tol=1e-9), f"w = {w}"
`,
    hints: [
      "합은 `sum(x * x for x in xs)`처럼 씁니다. 두 리스트의 같은 위치 원소를 함께 쓰려면 `sum(x * y for x, y in zip(xs, ys))`입니다.",
      "`b`에는 음수 부호와 2를 함께 붙입니다: `b = -2 * sum(...) / n`. 꼭짓점은 `-b / (2 * a)`입니다.",
    ],
    solution: py`
def mse_coefficients(xs, ys):
    """L(w) = a w^2 + b w + c의 (a, b, c)"""
    n = len(xs)
    a = sum(x * x for x in xs) / n
    b = -2 * sum(x * y for x, y in zip(xs, ys)) / n
    c = sum(y * y for y in ys) / n
    return a, b, c

def best_w(xs, ys):
    """평균제곱오차가 가장 작은 w"""
    a, b, c = mse_coefficients(xs, ys)
    return -b / (2 * a)

xs, ys = [1, 2, 3], [2, 4, 7]
print(mse_coefficients(xs, ys))
print(best_w(xs, ys))
`,
  },
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
