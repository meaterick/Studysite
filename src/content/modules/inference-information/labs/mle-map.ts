import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "MLE·MAP의 닫힌 형태의 해와 분산 추정의 편향",
    prompt: md`

[[lesson:likelihood-entropy]]에서 격자 탐색으로 찾은 최대가능도추정값과 본문의 MAP 추정값을 **닫힌 형태의 해**로 구하고, 최대가능도추정이 언제 치우치는지 확인합니다.

1. \`bernoulli_mle(xs)\`: 0/1 관측의 MLE $\hat p = k/n$
2. \`beta_map(k, n, a, b)\`: 사전분포 $\text{Beta}(a, b)$의 로그 $(a-1)\log p + (b-1)\log(1-p)$를 로그가능도에 더해 미분하면
$$\hat p_{\text{MAP}} = \frac{k + a - 1}{n + a + b - 2}$$
   입니다. $a = b = 1$(균등 사전)이면 MLE와 같고, $\text{Beta}(2,2)$는 "앞면·뒷면을 한 번씩 더 본 것"처럼 작동합니다.
3. \`gaussian_mle(xs)\`: 정규분포의 MLE는 $\hat\mu = \bar x$, $\hat\sigma^2 = \frac{1}{n}\sum_i (x_i - \bar x)^2$입니다(\`n\`으로 나눔).
4. \`mean_mle_var(n, trials, seed)\`: $\mathcal{N}(0, 1)$에서 크기 $n$인 표본을 \`trials\`번 뽑아 \`gaussian_mle\`의 분산 추정치를 평균 냅니다. 참값 1이 아니라 $\frac{n-1}{n}$에 가깝게 나옵니다. $\hat\mu$를 같은 데이터로 추정해 $\bar x$가 데이터 쪽으로 붙기 때문이며, 그래서 표본분산은 $n - 1$로 나눕니다(베셀 보정).
`,
    starter: py`
import numpy as np

def bernoulli_mle(xs):
    return 0.0  # TODO: 1의 비율

def beta_map(k, n, a=2, b=2):
    return 0.0  # TODO: (k + a - 1) / (n + a + b - 2)

def gaussian_mle(xs):
    """반환: (평균, n으로 나눈 분산)"""
    return 0.0, 0.0  # TODO

def mean_mle_var(n, trials=5000, seed=0):
    rng = np.random.default_rng(seed)
    total = 0.0
    for _ in range(trials):
        sample = rng.normal(0, 1, n)
        # TODO: gaussian_mle(sample)의 분산을 total에 더합니다.
    return total / trials

print("MLE:", bernoulli_mle([1, 1, 0, 1, 0, 1, 1, 1, 0, 1]))
print("MAP Beta(2,2):", beta_map(7, 10), " 3번 중 3번:", bernoulli_mle([1, 1, 1]), "→", beta_map(3, 3))
print("정규 MLE:", gaussian_mle([2, 4, 4, 4, 5, 5, 7, 9]))
for n in (2, 5, 20):
    print(f"n={n:2d}: 분산 MLE의 평균 {mean_mle_var(n):.3f}  (n-1)/n = {(n - 1) / n:.3f}")
`,
    tests: py`
@test("베르누이 MLE: 10번 중 7번 → 0.7")
def _():
    assert approx(bernoulli_mle([1, 1, 0, 1, 0, 1, 1, 1, 0, 1]), 0.7)

@test("Beta(2,2) MAP: 7/10 → 8/12, 3/3 → 0.8")
def _():
    assert approx(beta_map(7, 10, 2, 2), 8 / 12) and approx(beta_map(3, 3, 2, 2), 0.8), f"{beta_map(7, 10, 2, 2)}, {beta_map(3, 3, 2, 2)}"

@test("균등 사전 Beta(1,1)이면 MAP = MLE")
def _():
    assert approx(beta_map(7, 10, 1, 1), 0.7) and approx(beta_map(3, 3, 1, 1), 1.0)

@test("데이터가 많아지면 사전의 영향이 줄어든다")
def _():
    assert abs(beta_map(700, 1000) - 0.7) < 1e-3 < abs(beta_map(7, 10) - 0.7)

@test("정규분포 MLE: [2, 4, 4, 4, 5, 5, 7, 9] → (5, 4)")
def _():
    mu, var = gaussian_mle([2, 4, 4, 4, 5, 5, 7, 9])
    assert approx(mu, 5.0) and approx(var, 4.0), f"결과: {(mu, var)}"

@test("분산 MLE는 (n-1)/n만큼 작게 치우친다 (n=5 → ≈ 0.8)")
def _():
    got = mean_mle_var(5, trials=5000, seed=0)
    assert abs(got - 0.8) < 0.03, f"평균: {got:.3f}"
    assert abs(mean_mle_var(2, trials=5000, seed=1) - 0.5) < 0.03
`,
    hints: ["`bernoulli_mle`는 `sum(xs) / len(xs)`입니다.", "`gaussian_mle`는 평균 `mu = sum(xs) / len(xs)`를 먼저 구하고 `sum((x - mu) ** 2 for x in xs) / len(xs)`를 계산합니다. NumPy를 쓰면 `np.mean`, `np.var`(기본이 n으로 나눔)입니다.", "`mean_mle_var`의 반복문 안은 `total += gaussian_mle(sample)[1]`입니다."],
    solution: py`
import numpy as np

def bernoulli_mle(xs):
    return sum(xs) / len(xs)

def beta_map(k, n, a=2, b=2):
    return (k + a - 1) / (n + a + b - 2)

def gaussian_mle(xs):
    mu = sum(xs) / len(xs)
    return mu, sum((x - mu) ** 2 for x in xs) / len(xs)

def mean_mle_var(n, trials=5000, seed=0):
    rng = np.random.default_rng(seed)
    total = 0.0
    for _ in range(trials):
        sample = rng.normal(0, 1, n)
        total += gaussian_mle(sample)[1]
    return total / trials

print("MLE:", bernoulli_mle([1, 1, 0, 1, 0, 1, 1, 1, 0, 1]))
print("MAP Beta(2,2):", beta_map(7, 10), " 3번 중 3번:", bernoulli_mle([1, 1, 1]), "→", beta_map(3, 3))
print("정규 MLE:", gaussian_mle([2, 4, 4, 4, 5, 5, 7, 9]))
for n in (2, 5, 20):
    print(f"n={n:2d}: 분산 MLE의 평균 {mean_mle_var(n):.3f}  (n-1)/n = {(n - 1) / n:.3f}")
`,
  },
]);
