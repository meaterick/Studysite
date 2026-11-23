import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "표준오차로 필요한 표본 크기와 범위 구하기",
    prompt: md`

표준오차 $\sigma / \sqrt{n}$을 이용하는 두 함수를 작성합니다.

1. \`n_needed(sigma, target)\`: 표준오차가 \`target\` 이하가 되는 가장 작은 표본 크기. $\frac{\sigma}{\sqrt{n}} \le \text{target}$을 $n$에 대해 풀면 $n \ge (\sigma / \text{target})^2$이므로 \`math.ceil\`로 올림합니다.
2. \`mean_range(mu, sigma, n, z=1.96)\`: 표본평균이 약 95%의 확률로 들어가는 범위 $\mu \pm z \cdot \sigma / \sqrt{n}$을 \`(하한, 상한)\`으로 돌려줍니다.

본문의 주사위 30번 예에서 \`mean_range(3.5, 1.708, 30)\`은 약 \`(2.889, 4.111)\`입니다.
`,
    starter: py`
import math

def n_needed(sigma, target):
    """표준오차가 target 이하가 되는 가장 작은 n"""
    return 0   # TODO

def mean_range(mu, sigma, n, z=1.96):
    """표본평균의 약 95% 범위"""
    half = 0.0   # TODO: z * 표준오차
    return mu - half, mu + half

print(n_needed(2, 0.5), mean_range(3.5, 1.708, 30))
`,
    tests: py`
@test("필요한 표본 크기: 16, 100, 293")
def _():
    assert n_needed(2, 0.5) == 16, f"n_needed(2, 0.5) = {n_needed(2, 0.5)}"
    assert n_needed(10, 1) == 100, f"n_needed(10, 1) = {n_needed(10, 1)}"
    assert n_needed(1.71, 0.1) == 293, f"n_needed(1.71, 0.1) = {n_needed(1.71, 0.1)}"

@test("구한 n에서 표준오차가 target 이하이고, n - 1에서는 넘는다")
def _():
    for sigma, target in ((2, 0.3), (1.71, 0.05)):
        n = n_needed(sigma, target)
        assert n > 1 and sigma / n ** 0.5 <= target < sigma / (n - 1) ** 0.5, f"sigma = {sigma}, target = {target}: n = {n}"

@test("주사위 30번 평균의 범위 (2.889, 4.111)")
def _():
    lo, hi = mean_range(3.5, 1.708, 30)
    assert approx(lo, 2.889, tol=1e-3) and approx(hi, 4.111, tol=1e-3), f"결과: {(lo, hi)}"
`,
    hints: [
      "`return math.ceil((sigma / target) ** 2)`입니다. 올림하지 않으면 표준오차가 target을 조금 넘을 수 있습니다.",
      "`half = z * sigma / math.sqrt(n)`입니다.",
    ],
    solution: py`
import math

def n_needed(sigma, target):
    """표준오차가 target 이하가 되는 가장 작은 n"""
    return math.ceil((sigma / target) ** 2)

def mean_range(mu, sigma, n, z=1.96):
    """표본평균의 약 95% 범위"""
    half = z * sigma / math.sqrt(n)
    return mu - half, mu + half

print(n_needed(2, 0.5), mean_range(3.5, 1.708, 30))
`,
  },
  {
    key: "ex1",
    title: "누적 평균과 표본평균의 분포를 시뮬레이션으로 확인하기",
    prompt: md`

반복문 없이 NumPy 연산으로 큰 수의 법칙과 중심극한정리를 확인합니다.

1. \`running_mean(xs)\`: 앞에서부터 $k$개까지의 평균을 $k = 1, \ldots, n$에 대해 담은 배열. \`np.cumsum\`을 씁니다.
2. \`sample_means(population, n, trials, seed)\`: 배열 \`population\`에서 크기 \`n\`인 표본을 **복원추출**로 \`trials\`번 뽑아 각 표본의 평균을 담은 배열
3. \`standard_error(sigma, n)\`: $\sigma / \sqrt{n}$
4. \`within(x, center, half)\`: \`x\`의 값 중 \`center - half\`와 \`center + half\` 사이에 든 비율

한쪽으로 치우친 분포에서도 표본평균의 표준편차가 표준오차 공식과 같고, 약 95%가 평균 $\pm 1.96 \times$ 표준오차 안에 드는지 확인합니다.
`,
    starter: py`
import numpy as np

def running_mean(xs):
    xs = np.asarray(xs, dtype=float)
    # TODO: 누적합을 1, 2, ..., n으로 나눕니다.
    return xs

def sample_means(population, n, trials, seed=0):
    rng = np.random.default_rng(seed)
    # TODO: rng.choice(population, size=(trials, n), replace=True)의 행 평균
    return np.zeros(trials)

def standard_error(sigma, n):
    return 0.0  # TODO

def within(x, center, half):
    return 0.0  # TODO: center - half <= x <= center + half 인 비율

print(running_mean([2, 4, 9]))                               # 기대: [2. 3. 5.]
pop = np.random.default_rng(42).exponential(scale=2.0, size=50_000)   # 오른쪽으로 치우친 분포
m = sample_means(pop, 50, 20_000)
se = standard_error(pop.std(), 50)
print(round(m.mean(), 3), round(pop.mean(), 3))              # 표본평균의 평균 ≈ 모평균
print(round(m.std(), 4), round(se, 4))                       # 표본평균의 표준편차 ≈ 표준오차
print(round(within(m, pop.mean(), 1.96 * se), 3))            # 약 0.95
`,
    tests: py`
import numpy as np

@test("running_mean([2, 4, 9]) = [2, 3, 5]")
def _():
    assert approx(running_mean([2, 4, 9]), [2, 3, 5]), f"결과: {running_mean([2, 4, 9])}"

@test("running_mean의 마지막 값은 전체 평균")
def _():
    xs = np.random.default_rng(0).normal(size=1000)
    assert approx(running_mean(xs)[-1], xs.mean())

@test("standard_error(10, 25) = 2")
def _():
    assert approx(standard_error(10, 25), 2.0)

@test("sample_means: 모양 (trials,), 평균 ≈ 모평균, 표준편차 ≈ σ/√n")
def _():
    pop = np.random.default_rng(1).exponential(scale=2.0, size=50_000)
    m = np.asarray(sample_means(pop, 40, 20_000, seed=2))
    assert m.shape == (20_000,), f"모양: {m.shape}"
    assert abs(m.mean() - pop.mean()) < 0.02, f"평균 {m.mean():.3f} vs {pop.mean():.3f}"
    assert abs(m.std() - pop.std() / np.sqrt(40)) < 0.01, f"표준편차 {m.std():.4f}"

@test("중심극한정리: 표본평균의 약 95%가 평균 ± 1.96·SE 안에 든다")
def _():
    pop = np.random.default_rng(3).exponential(scale=2.0, size=50_000)
    m = sample_means(pop, 100, 20_000, seed=4)
    r = within(m, pop.mean(), 1.96 * standard_error(pop.std(), 100))
    assert abs(r - 0.95) < 0.01, f"비율 {r:.3f}"

@test("within([1, 2, 3, 4], 2.5, 1) = 0.5")
def _():
    assert approx(within(np.array([1, 2, 3, 4]), 2.5, 1), 0.5)
`,
    hints: [
      "`running_mean`은 `np.cumsum(xs) / np.arange(1, len(xs) + 1)`입니다.",
      "`rng.choice(population, size=(trials, n), replace=True).mean(axis=1)`이 표본평균 배열입니다.",
      "`within`은 `float(np.mean((x >= center - half) & (x <= center + half)))`입니다.",
    ],
    solution: py`
import numpy as np

def running_mean(xs):
    xs = np.asarray(xs, dtype=float)
    return np.cumsum(xs) / np.arange(1, len(xs) + 1)

def sample_means(population, n, trials, seed=0):
    rng = np.random.default_rng(seed)
    return rng.choice(population, size=(trials, n), replace=True).mean(axis=1)

def standard_error(sigma, n):
    return sigma / np.sqrt(n)

def within(x, center, half):
    x = np.asarray(x)
    return float(np.mean((x >= center - half) & (x <= center + half)))

print(running_mean([2, 4, 9]))
pop = np.random.default_rng(42).exponential(scale=2.0, size=50_000)
m = sample_means(pop, 50, 20_000)
se = standard_error(pop.std(), 50)
print(round(m.mean(), 3), round(pop.mean(), 3))
print(round(m.std(), 4), round(se, 4))
print(round(within(m, pop.mean(), 1.96 * se), 3))
`,
  },
]);
