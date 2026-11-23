import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "시그마 식을 반복문으로 옮기기",
    prompt: md`

$\Sigma$ 식을 반복문으로 옮깁니다. 먼저 작은 $n$에서 항을 손으로 적어 보고 코드를 작성합니다.

1. \`odd_sum(n)\`: $\sum_{i=1}^{n} (2i - 1)$을 돌려줍니다. $n = 3$이면 $1 + 3 + 5 = 9$입니다. $n = 0$이면 더할 항이 없으므로 0입니다.
2. \`dot(a, b)\`: 길이가 같은 두 리스트의 $\sum_{i} a_i b_i$를 돌려줍니다. 같은 위치의 원소끼리 곱해 더합니다.

\`sum()\`을 쓰지 않고 \`total\` 변수에 더하는 반복문으로 작성합니다.
`,
    starter: py`
def odd_sum(n):
    """Σ_{i=1}^{n} (2i - 1)"""
    total = 0
    # TODO: i = 1, 2, ..., n에 대해 2 * i - 1을 total에 더합니다.
    return total

def dot(a, b):
    """Σ a_i * b_i"""
    total = 0
    # TODO: 같은 위치의 원소를 곱해 total에 더합니다.
    return total

print(odd_sum(3), odd_sum(10))
print(dot([1, 2], [3, 4]))
`,
    tests: py`
@test("odd_sum: 1, 9, 100")
def _():
    assert odd_sum(1) == 1 and odd_sum(3) == 9 and odd_sum(10) == 100, f"결과: {odd_sum(1)}, {odd_sum(3)}, {odd_sum(10)}"

@test("odd_sum: 첫 n개 홀수의 합은 n^2")
def _():
    for n in range(0, 21):
        assert odd_sum(n) == n * n, f"n = {n}: 결과 {odd_sum(n)}"

@test("dot: 같은 위치끼리 곱해 더한다")
def _():
    assert dot([1, 2], [3, 4]) == 11, f"결과: {dot([1, 2], [3, 4])}"
    assert dot([1, 0, -1], [2, 5, 2]) == 0
    assert approx(dot([0.5, 1.5], [2.0, 2.0]), 4.0)
`,
    hints: [
      "`for i in range(1, n + 1):` 안에서 `total += 2 * i - 1`을 실행합니다. 끝 값 n을 포함하려면 범위를 `n + 1`까지 씁니다.",
      "`for i in range(len(a)):` 안에서 `total += a[i] * b[i]`를 실행합니다. `for x, y in zip(a, b):`로 짝을 지어도 됩니다.",
    ],
    solution: py`
def odd_sum(n):
    """Σ_{i=1}^{n} (2i - 1)"""
    total = 0
    for i in range(1, n + 1):
        total += 2 * i - 1
    return total

def dot(a, b):
    """Σ a_i * b_i"""
    total = 0
    for i in range(len(a)):
        total += a[i] * b[i]
    return total

print(odd_sum(3), odd_sum(10))
print(dot([1, 2], [3, 4]))
`,
  },
  {
    key: "ex1",
    title: "시그마 계산과 등비수열의 합",
    prompt: md`

세 함수를 완성합니다.

1. \`sigma(f, start, end)\`: $\sum_{i=\text{start}}^{\text{end}} f(i)$를 돌려줍니다. 끝 값 \`end\`를 **포함합니다.** \`start > end\`이면 0입니다.
2. \`geometric_sum(a, r, n)\`: 첫 항 \`a\`, 공비 \`r\`인 등비수열의 첫 \`n\`항의 합을 공식으로 계산합니다. \`r == 1\`이면 \`n * a\`입니다.
3. \`variance(xs)\`: 분산 $\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar x)^2$을 반복문이나 \`sum\`으로 계산합니다(NumPy를 쓰지 않습니다).
`,
    starter: py`
def sigma(f, start, end):
    """f(start) + ... + f(end) (end 포함)"""
    total = 0
    for i in range(start, end):     # TODO: end를 포함하도록 고칩니다.
        total += f(i)
    return total

def geometric_sum(a, r, n):
    """a + ar + ... + ar^(n-1)"""
    return 0.0   # TODO: r == 1이면 n * a, 아니면 a * (1 - r ** n) / (1 - r)

def variance(xs):
    """(1/n) Σ (x_i - 평균)^2"""
    return 0.0   # TODO

print(sigma(lambda i: i ** 2, 1, 4))
print(geometric_sum(0.1, 0.9, 50), geometric_sum(3, 1, 4))
print(variance([2, 4, 9]))
`,
    tests: py`
@test("sigma: Σ_{i=1}^{4} i^2 = 30 (끝 포함)")
def _():
    assert sigma(lambda i: i ** 2, 1, 4) == 30, f"결과: {sigma(lambda i: i ** 2, 1, 4)}"

@test("sigma: 한 항만, 빈 범위")
def _():
    assert sigma(lambda i: i, 5, 5) == 5
    assert sigma(lambda i: i, 3, 2) == 0

@test("geometric_sum: 공식이 반복문의 합과 같다")
def _():
    brute = sum(0.1 * 0.9 ** t for t in range(50))
    assert approx(geometric_sum(0.1, 0.9, 50), brute, tol=1e-12)
    assert approx(geometric_sum(1, 0.5, 20), sum(0.5 ** k for k in range(20)), tol=1e-12)

@test("geometric_sum: r == 1")
def _():
    assert geometric_sum(3, 1, 4) == 12

@test("variance: 모분산")
def _():
    assert approx(variance([2, 4, 9]), 8.666666666666666, tol=1e-12), f"결과: {variance([2, 4, 9])}"
    assert variance([5, 5, 5]) == 0
`,
    hints: [
      "`range(start, end)`는 `end`를 포함하지 않습니다. `range(start, end + 1)`로 바꿉니다.",
      "`if r == 1: return n * a`를 먼저 두면 분모가 0이 되는 경우를 피합니다.",
      "`m = sum(xs) / len(xs)` 다음 `sum((x - m) ** 2 for x in xs) / len(xs)`입니다.",
    ],
    solution: py`
def sigma(f, start, end):
    total = 0
    for i in range(start, end + 1):
        total += f(i)
    return total

def geometric_sum(a, r, n):
    if r == 1:
        return n * a
    return a * (1 - r ** n) / (1 - r)

def variance(xs):
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / len(xs)

print(sigma(lambda i: i ** 2, 1, 4))
print(geometric_sum(0.1, 0.9, 50), geometric_sum(3, 1, 4))
print(variance([2, 4, 9]))
`,
  },
]);
