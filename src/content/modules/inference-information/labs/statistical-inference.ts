import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "가설검정의 네 단계를 차례로 계산하기",
    prompt: md`

동전을 100번 던져 앞면이 58번 나왔습니다. 공정한 동전($H_0$: $p = 0.5$)인지 유의수준 0.05의 양측 z 검정으로 판단합니다. 본문의 네 단계 표를 따라 변수를 채웁니다.

1. \`p_hat\`: 앞면 비율
2. \`se0\`: $H_0$ 아래의 표준오차 $\sqrt{0.5 \times 0.5 / n}$
3. \`z\`: 검정통계량 $(\hat p - 0.5) / \mathrm{SE}_0$
4. \`p_value\`: 양측 p값 $2(1 - \Phi(|z|))$. \`normal_cdf\`는 주어집니다.
5. \`reject\`: p값이 0.05보다 작으면 \`True\`
`,
    starter: py`
import math

def normal_cdf(z):
    return (1 + math.erf(z / math.sqrt(2))) / 2

heads, n = 58, 100
p_hat = None     # TODO
se0 = None       # TODO
z = None         # TODO
p_value = None   # TODO
reject = None    # TODO

print(p_hat, se0, z, p_value, reject)
`,
    tests: py`
@test("비율 0.58과 표준오차 0.05")
def _():
    assert p_hat is not None and approx(p_hat, 0.58), f"p_hat: {p_hat}"
    assert se0 is not None and approx(se0, 0.05), f"se0: {se0}"

@test("검정통계량 1.6과 p값 약 0.11")
def _():
    assert z is not None and approx(z, 1.6), f"z: {z}"
    assert p_value is not None and approx(p_value, 0.1096, tol=1e-3), f"p_value: {p_value}"

@test("유의수준 0.05에서 기각하지 않는다")
def _():
    assert reject is False or reject == False, f"reject: {reject} — p값이 0.05보다 큽니다."
    assert reject is not None
`,
    hints: [
      "`p_hat = heads / n`, `se0 = math.sqrt(0.5 * 0.5 / n)`, `z = (p_hat - 0.5) / se0`입니다.",
      "`p_value = 2 * (1 - normal_cdf(abs(z)))`이고 `reject = p_value < 0.05`입니다. 비교식의 결과는 `True`나 `False`입니다.",
    ],
    solution: py`
import math

def normal_cdf(z):
    return (1 + math.erf(z / math.sqrt(2))) / 2

heads, n = 58, 100
p_hat = heads / n
se0 = math.sqrt(0.5 * 0.5 / n)
z = (p_hat - 0.5) / se0
p_value = 2 * (1 - normal_cdf(abs(z)))
reject = p_value < 0.05

print(p_hat, se0, z, p_value, reject)
`,
  },
  {
    key: "ex1",
    title: "신뢰구간과 z 검정, 순열 검정 구현하기",
    prompt: md`

1. \`mean_ci(x, z=1.96)\`: 표본평균의 신뢰구간 \`(하한, 상한)\` $= \bar x \pm z \cdot \frac{s}{\sqrt{n}}$. $s$는 $n - 1$로 나눈 표본표준편차입니다(\`ddof=1\`).
2. \`proportion_ci(k, n, z=1.96)\`: 비율의 신뢰구간 $\hat p \pm z\sqrt{\hat p(1 - \hat p)/n}$, $\hat p = k/n$
3. \`z_test_proportion(k, n, p0)\`: 귀무가설 $p = p_0$에 대한 양측 z 검정. $z = \frac{\hat p - p_0}{\sqrt{p_0(1 - p_0)/n}}$와 p값 $2(1 - \Phi(|z|))$를 \`(z, p값)\`으로 돌려줍니다. 표준정규분포의 누적분포함수 \`normal_cdf\`는 주어집니다.
4. \`permutation_test(a, b, n_perm=2000, seed=0)\`: 두 배열을 합쳐 섞은 뒤 앞의 \`len(a)\`개와 나머지로 나눠 평균 차이를 \`n_perm\`번 계산하고, 그 절댓값이 관찰한 차이 $|\bar b - \bar a|$ 이상인 비율(양측 p값)을 돌려줍니다.
`,
    starter: py`
import math
import numpy as np

def normal_cdf(z):
    return (1 + math.erf(z / math.sqrt(2))) / 2

def mean_ci(x, z=1.96):
    x = np.asarray(x, dtype=float)
    # TODO: 평균 ± z * 표준오차 (표준편차는 ddof=1)
    return 0.0, 0.0

def proportion_ci(k, n, z=1.96):
    # TODO
    return 0.0, 0.0

def z_test_proportion(k, n, p0):
    """반환: (z, 양측 p값)"""
    # TODO: 표준오차는 귀무가설의 p0으로 계산합니다.
    return 0.0, 1.0

def permutation_test(a, b, n_perm=2000, seed=0):
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    rng = np.random.default_rng(seed)
    observed = abs(b.mean() - a.mean())
    pooled = np.concatenate([a, b])
    count = 0
    for _ in range(n_perm):
        rng.shuffle(pooled)
        # TODO: 앞 len(a)개와 나머지의 평균 차이 절댓값이 observed 이상이면 count를 1 늘립니다.
    return count / n_perm

print([round(v, 3) for v in proportion_ci(340, 400)])        # 기대: [0.815, 0.885]
print([round(v, 4) for v in z_test_proportion(61, 100, 0.5)])   # 기대: [2.2, 0.0278]
`,
    tests: py`
import numpy as np

@test("비율의 신뢰구간: 400개 중 340개 → 약 [0.815, 0.885]")
def _():
    lo, hi = proportion_ci(340, 400)
    assert approx(lo, 0.815007, 1e-4) and approx(hi, 0.884993, 1e-4), f"결과: {(lo, hi)}"

@test("평균의 신뢰구간: 대칭이고 폭이 2·1.96·s/√n")
def _():
    x = np.array([4.0, 6.0, 5.0, 7.0, 3.0, 5.0])
    lo, hi = mean_ci(x)
    se = x.std(ddof=1) / np.sqrt(len(x))
    assert approx((lo + hi) / 2, x.mean()) and approx(hi - lo, 2 * 1.96 * se), f"결과: {(lo, hi)}"

@test("z 검정: 동전 100번 중 61번 → z = 2.2, p ≈ 0.0278")
def _():
    z, p = z_test_proportion(61, 100, 0.5)
    assert approx(z, 2.2) and abs(p - 0.0278) < 1e-3, f"결과: {(z, p)}"

@test("z 검정: 관찰값이 귀무가설과 같으면 z = 0, p = 1")
def _():
    z, p = z_test_proportion(50, 100, 0.5)
    assert approx(z, 0.0) and approx(p, 1.0), f"결과: {(z, p)}"

@test("순열 검정: 차이가 큰 두 집단은 p값이 작다")
def _():
    rng = np.random.default_rng(1)
    a, b = rng.normal(0, 1, 40), rng.normal(1.0, 1, 40)
    assert permutation_test(a, b, 1000, 0) < 0.01

@test("순열 검정: 같은 분포에서 뽑은 두 집단은 p값이 작지 않다")
def _():
    rng = np.random.default_rng(2)
    a, b = rng.normal(0, 1, 40), rng.normal(0, 1, 40)
    assert permutation_test(a, b, 1000, 0) > 0.05
`,
    hints: [
      "`mean_ci`는 `se = x.std(ddof=1) / np.sqrt(len(x))` 다음 `(x.mean() - z * se, x.mean() + z * se)`입니다.",
      "`z_test_proportion`은 `p_hat = k / n`, `se = math.sqrt(p0 * (1 - p0) / n)`, `z = (p_hat - p0) / se`, p값은 `2 * (1 - normal_cdf(abs(z)))`입니다.",
      "섞은 뒤 `diff = abs(pooled[len(a):].mean() - pooled[:len(a)].mean())`를 구해 `observed`와 비교합니다.",
    ],
    solution: py`
import math
import numpy as np

def normal_cdf(z):
    return (1 + math.erf(z / math.sqrt(2))) / 2

def mean_ci(x, z=1.96):
    x = np.asarray(x, dtype=float)
    se = x.std(ddof=1) / np.sqrt(len(x))
    return float(x.mean() - z * se), float(x.mean() + z * se)

def proportion_ci(k, n, z=1.96):
    p_hat = k / n
    se = math.sqrt(p_hat * (1 - p_hat) / n)
    return p_hat - z * se, p_hat + z * se

def z_test_proportion(k, n, p0):
    p_hat = k / n
    se = math.sqrt(p0 * (1 - p0) / n)
    z = (p_hat - p0) / se
    return z, 2 * (1 - normal_cdf(abs(z)))

def permutation_test(a, b, n_perm=2000, seed=0):
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    rng = np.random.default_rng(seed)
    observed = abs(b.mean() - a.mean())
    pooled = np.concatenate([a, b])
    count = 0
    for _ in range(n_perm):
        rng.shuffle(pooled)
        diff = abs(pooled[len(a):].mean() - pooled[:len(a)].mean())
        if diff >= observed:
            count += 1
    return count / n_perm

print([round(v, 3) for v in proportion_ci(340, 400)])
print([round(v, 4) for v in z_test_proportion(61, 100, 0.5)])
`,
  },
]);
