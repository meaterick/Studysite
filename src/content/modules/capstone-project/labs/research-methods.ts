import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "시드 5개의 평균·표준편차, 정확 순열 검정, 두 비율 z-검정",
    prompt: md`

「AI 연구 방법론」 단계의 통계 도구를 직접 구현합니다. \`a\`, \`b\`는 두 방법을 같은 시드(같은 데이터 분할) 5개로 평가한 정확도입니다.

1. \`mean_std(x)\`: 평균과 **표본** 표준편차(\`ddof=1\`).
2. \`paired_permutation_p(a, b)\`: 짝지은 차이 $d = b - a$의 부호를 바꿀 수 있는 $2^n$가지 경우를 **모두** 따져, $|\overline{d'}| \ge |\bar{d}|$인 비율(양측 정확 p값)을 돌려줍니다.
3. \`two_proportion_z(sa, na, sb, nb)\`: 합동 비율 $\hat{p}$로 $z = \dfrac{\hat{p}_b - \hat{p}_a}{\sqrt{\hat{p}(1-\hat{p})(1/n_a + 1/n_b)}}$와 양측 p값 $2\,(1 - \Phi(|z|))$를 \`(z, p)\`로. $\Phi(z) = \frac{1}{2}\left(1 + \mathrm{erf}(z/\sqrt{2})\right)$입니다.

시드 5개로는 모든 시드에서 이겨도 p값이 0.05 아래로 내려가지 않는 이유를 생각해 보십시오.
`,
    starter: py`
import numpy as np
from math import erf, sqrt
a = np.array([0.937, 0.944, 0.941, 0.946, 0.933])    # 방법 A, 시드 0~4의 정확도
b = np.array([0.942, 0.939, 0.948, 0.940, 0.941])    # 방법 B, 같은 시드(같은 데이터 분할)
import itertools

def mean_std(x):
    return 0.0, 0.0  # TODO

def paired_permutation_p(a, b):
    return 0.0  # TODO: itertools.product([-1, 1], repeat=n)으로 모든 부호 조합

def two_proportion_z(sa, na, sb, nb):
    return 0.0, 1.0  # TODO

print("A", mean_std(a), "B", mean_std(b))
print("순열 검정 p =", paired_permutation_p(a, b))
for n in (500, 5000):
    print(n, two_proportion_z(int(0.10 * n), n, int(0.12 * n), n))
`,
    tests: py`
import numpy as np
from math import erf, sqrt
a = np.array([0.937, 0.944, 0.941, 0.946, 0.933])    # 방법 A, 시드 0~4의 정확도
b = np.array([0.942, 0.939, 0.948, 0.940, 0.941])    # 방법 B, 같은 시드(같은 데이터 분할)

@test("평균과 표본 표준편차(ddof = 1)")
def _():
    m, s = mean_std(a)
    assert approx(m, 0.9402) and approx(s, np.std(a, ddof=1)), (m, s)

@test("정확 순열 검정: a, b는 p = 0.5625")
def _():
    assert approx(paired_permutation_p(a, b), 0.5625), paired_permutation_p(a, b)

@test("시드 5개에서 모두 이겨도 양측 p = 2/32 = 0.0625, 시드 6개면 0.03125")
def _():
    base = np.array([0.90, 0.91, 0.92, 0.93, 0.94, 0.95])
    assert approx(paired_permutation_p(base[:5], base[:5] + 0.01), 0.0625)
    assert approx(paired_permutation_p(base, base + np.array([0.01, 0.02, 0.01, 0.03, 0.02, 0.01])), 0.03125)

@test("같은 2%p 차이: 그룹당 500명이면 p ≈ 0.31, 5,000명이면 p ≈ 0.0014")
def _():
    z1, p1 = two_proportion_z(50, 500, 60, 500)
    z2, p2 = two_proportion_z(500, 5000, 600, 5000)
    assert approx(z1, 1.0107, 1e-3) and approx(p1, 0.3122, 1e-3), (z1, p1)
    assert approx(z2, 3.196, 1e-3) and approx(p2, 0.00139, 1e-4), (z2, p2)
`,
    hints: ["`np.mean(x)`, `np.std(x, ddof=1)`. 시드가 5개뿐이면 n−1로 나누는 표본 표준편차를 보고합니다.", "`d = np.asarray(b) - np.asarray(a)`, `obs = abs(d.mean())`, `null = [abs((np.array(s) * d).mean()) for s in itertools.product([-1, 1], repeat=len(d))]`, p = `np.mean([v >= obs - 1e-12 for v in null])`", "부호 조합 32가지 중 관측값만큼 극단적인 것은 '모두 +'와 '모두 −' 두 가지뿐일 수 있으므로 최소 p값은 2/32입니다. 시드를 늘리지 않으면 이 벽을 넘을 수 없습니다. z-검정의 p는 `2 * (1 - 0.5 * (1 + erf(abs(z) / sqrt(2))))`"],
    solution: py`
import numpy as np
from math import erf, sqrt
a = np.array([0.937, 0.944, 0.941, 0.946, 0.933])    # 방법 A, 시드 0~4의 정확도
b = np.array([0.942, 0.939, 0.948, 0.940, 0.941])    # 방법 B, 같은 시드(같은 데이터 분할)
import itertools

def mean_std(x):
    return float(np.mean(x)), float(np.std(x, ddof=1))

def paired_permutation_p(a, b):
    d = np.asarray(b) - np.asarray(a)
    obs = abs(d.mean())
    null = [abs((np.array(s) * d).mean()) for s in itertools.product([-1, 1], repeat=len(d))]
    return float(np.mean([v >= obs - 1e-12 for v in null]))

def two_proportion_z(sa, na, sb, nb):
    pa, pb = sa / na, sb / nb
    pooled = (sa + sb) / (na + nb)
    z = (pb - pa) / sqrt(pooled * (1 - pooled) * (1 / na + 1 / nb))
    return z, 2 * (1 - 0.5 * (1 + erf(abs(z) / sqrt(2))))

print("A", mean_std(a), "B", mean_std(b))
print("순열 검정 p =", paired_permutation_p(a, b))
for n in (500, 5000):
    print(n, two_proportion_z(int(0.10 * n), n, int(0.12 * n), n))
`,
  },
]);
