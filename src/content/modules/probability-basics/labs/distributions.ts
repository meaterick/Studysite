import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "이항분포의 확률과 정규분포의 구간 확률 계산하기",
    prompt: md`

1. \`binom_pmf(n, k, p)\`: 이항분포의 확률 $\binom{n}{k} p^k (1 - p)^{n - k}$. \`math.comb(n, k)\`로 경우의 수를 구합니다.
2. \`standardize(x)\`: 배열의 각 값을 z-점수 $\frac{x - \bar x}{s}$로 바꿉니다. $\bar x$는 평균, $s$는 \`np.std\`로 구한 표준편차입니다.
3. \`within_k_sigma(x, k)\`: z-점수의 절댓값이 $k$보다 작은 값의 비율
4. \`normal_cdf(z)\`: 표준정규분포의 누적분포함수 $\Phi(z) = \frac{1}{2}\left(1 + \operatorname{erf}\left(\frac{z}{\sqrt{2}}\right)\right)$. \`math.erf\`를 씁니다.

정규분포에서 뽑은 표본으로 \`within_k_sigma\`를 계산하면 \`normal_cdf(k) - normal_cdf(-k)\`에 가까워지는지 확인합니다.
`,
    starter: py`
import math
import numpy as np

def binom_pmf(n, k, p):
    """P(X = k), X ~ B(n, p)"""
    # TODO
    return 0.0

def standardize(x):
    """z-점수: (x - 평균) / 표준편차"""
    x = np.asarray(x, dtype=float)
    # TODO
    return x

def within_k_sigma(x, k):
    """|z| < k 인 값의 비율"""
    # TODO: standardize 결과로 True/False 배열을 만들고 평균을 냅니다.
    return 0.0

def normal_cdf(z):
    """Φ(z) = P(Z ≤ z), Z ~ N(0, 1)"""
    # TODO
    return 0.0

print(round(binom_pmf(10, 8, 0.8), 4))                       # 기대: 0.302
print(np.round(standardize([2, 4, 4, 4, 5, 5, 7, 9]), 2))    # 기대: [-1.5 -0.5 -0.5 -0.5  0.   0.   1.   2. ]
sample = np.random.default_rng(0).normal(170, 6, 100_000)
print(round(within_k_sigma(sample, 2), 3), round(normal_cdf(2) - normal_cdf(-2), 3))   # 둘 다 약 0.954
`,
    tests: py`
import math
import numpy as np

@test("이항분포: B(10, 0.8)에서 k = 8 → 0.302, B(4, 0.5)에서 k = 2 → 0.375")
def _():
    assert approx(binom_pmf(10, 8, 0.8), 45 * 0.8 ** 8 * 0.2 ** 2)
    assert approx(binom_pmf(4, 2, 0.5), 0.375)

@test("이항분포의 확률을 모두 더하면 1, 평균은 np")
def _():
    n, p = 12, 0.3
    probs = [binom_pmf(n, k, p) for k in range(n + 1)]
    assert approx(sum(probs), 1.0), f"합: {sum(probs)}"
    assert approx(sum(k * q for k, q in enumerate(probs)), n * p)

@test("standardize: 평균 0, 표준편차 1, 단위를 바꿔도(3x + 10) 같은 값")
def _():
    x = np.array([1.0, 3.0, 4.0, 8.0])
    z = np.asarray(standardize(x))
    assert approx(z.mean(), 0.0, 1e-9) and approx(z.std(), 1.0, 1e-9), f"평균 {z.mean()}, 표준편차 {z.std()}"
    assert approx(standardize(3 * x + 10), z)

@test("within_k_sigma([2, 4, 4, 4, 5, 5, 7, 9], 1) = 5/8")
def _():
    got = within_k_sigma([2, 4, 4, 4, 5, 5, 7, 9], 1)
    assert approx(got, 0.625), f"결과: {got}"

@test("normal_cdf: Φ(0) = 0.5, Φ(1.96) ≈ 0.975, Φ(-1) = 1 - Φ(1)")
def _():
    assert approx(normal_cdf(0), 0.5)
    assert abs(normal_cdf(1.96) - 0.975) < 1e-3
    assert approx(normal_cdf(-1), 1 - normal_cdf(1))

@test("정규분포 표본의 ±1σ, ±2σ 비율이 Φ로 계산한 값과 같다")
def _():
    x = np.random.default_rng(1).normal(50, 10, 200_000)
    for k in (1, 2):
        want = normal_cdf(k) - normal_cdf(-k)
        assert abs(within_k_sigma(x, k) - want) < 0.005, f"k={k}: {within_k_sigma(x, k)} vs {want}"
`,
    hints: [
      "`binom_pmf`는 `math.comb(n, k) * p ** k * (1 - p) ** (n - k)`입니다.",
      "`(x - x.mean()) / x.std()`가 z-점수입니다. `within_k_sigma`는 `float(np.mean(np.abs(standardize(x)) < k))`입니다.",
      "`normal_cdf`는 `(1 + math.erf(z / math.sqrt(2))) / 2`입니다.",
    ],
    solution: py`
import math
import numpy as np

def binom_pmf(n, k, p):
    return math.comb(n, k) * p ** k * (1 - p) ** (n - k)

def standardize(x):
    x = np.asarray(x, dtype=float)
    return (x - x.mean()) / x.std()

def within_k_sigma(x, k):
    return float(np.mean(np.abs(standardize(x)) < k))

def normal_cdf(z):
    return (1 + math.erf(z / math.sqrt(2))) / 2

print(round(binom_pmf(10, 8, 0.8), 4))
print(np.round(standardize([2, 4, 4, 4, 5, 5, 7, 9]), 2))
sample = np.random.default_rng(0).normal(170, 6, 100_000)
print(round(within_k_sigma(sample, 2), 3), round(normal_cdf(2) - normal_cdf(-2), 3))
`,
  },
]);
