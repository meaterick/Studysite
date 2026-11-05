import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
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
