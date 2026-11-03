import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
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
