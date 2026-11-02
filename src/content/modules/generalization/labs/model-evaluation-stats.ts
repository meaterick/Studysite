import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "짝지은 비교: 단순 t, 보정 t, McNemar",
    prompt: md`

「평가의 통계학」 단계의 검정 통계량을 직접 구현합니다. 차이 \`d\`는 같은 분할에서 얻은 두 모델의 점수 차이 $J$개입니다.

1. \`naive_t(d)\` $= \dfrac{\bar d}{\sqrt{s^2 / J}}$ ($s^2$은 \`ddof=1\` 표본분산)
2. \`corrected_t(d, n_train, n_test)\` $= \dfrac{\bar d}{\sqrt{(1/J + n_{test}/n_{train})\, s^2}}$ (나도-벤지오 보정)
3. \`two_sided_p(t, df)\`: 자유도 \`df\`인 t 분포의 양측 p값 (\`scipy.stats.t.sf\` 사용)
4. \`mcnemar(b, c)\` $= \dfrac{(|b - c| - 1)^2}{b + c}$ ($b$: A만 맞힌 수, $c$: B만 맞힌 수)
`,
    starter: py`
import numpy as np
from scipy import stats

def naive_t(d):
    return 0.0  # TODO

def corrected_t(d, n_train, n_test):
    return 0.0  # TODO

def two_sided_p(t, df):
    return 1.0  # TODO: 2 * stats.t.sf(|t|, df)

def mcnemar(b, c):
    return 0.0  # TODO

d = np.array([0.02, 0.01, 0.03, -0.01, 0.02, 0.015, 0.0, 0.025, 0.01, 0.02])
t1, t2 = naive_t(d), corrected_t(d, n_train=455, n_test=114)
print(f"단순 t = {t1:.2f} (p = {two_sided_p(t1, len(d) - 1):.4f})")
print(f"보정 t = {t2:.2f} (p = {two_sided_p(t2, len(d) - 1):.4f})")
print("McNemar χ² =", mcnemar(15, 5))
`,
    tests: py`
import numpy as np
d = np.array([0.02, 0.01, 0.03, -0.01, 0.02, 0.015, 0.0, 0.025, 0.01, 0.02])

@test("단순 t = 평균 / √(s²/J)")
def _():
    assert approx(naive_t(d), d.mean() / np.sqrt(d.var(ddof=1) / len(d))), f"결과: {naive_t(d)}"

@test("보정 t는 단순 t보다 작다 (5-fold: n_test/n_train = 0.25)")
def _():
    t2 = corrected_t(d, 455, 114)
    ref = d.mean() / np.sqrt((1 / 10 + 114 / 455) * d.var(ddof=1))
    assert approx(t2, ref) and t2 < naive_t(d), f"보정 t = {t2}"

@test("반복을 두 배로 늘리면 단순 t는 √2배 커지지만 보정 t는 거의 그대로")
def _():
    dd = np.concatenate([d, d])
    ratio_naive = naive_t(dd) / naive_t(d)
    ratio_corr = corrected_t(dd, 455, 114) / corrected_t(d, 455, 114)
    assert ratio_naive > 1.4 and ratio_corr < 1.2, f"단순 {ratio_naive:.3f}배, 보정 {ratio_corr:.3f}배"

@test("양측 p값: t=2.262, df=9 → 약 0.05")
def _():
    assert abs(two_sided_p(2.262, 9) - 0.05) < 1e-3 and approx(two_sided_p(0.0, 5), 1.0)
    assert approx(two_sided_p(-2.262, 9), two_sided_p(2.262, 9))

@test("McNemar: b=15, c=5 → 4.05, 같으면 작다")
def _():
    assert approx(mcnemar(15, 5), 4.05) and mcnemar(10, 10) < 0.1
`,
    hints: ["`naive_t`는 `d.mean() / np.sqrt(d.var(ddof=1) / len(d))`입니다.", "보정식은 분산 앞의 계수만 `1 / J`에서 `1 / J + n_test / n_train`으로 바뀝니다.", "`2 * stats.t.sf(abs(t), df)`가 양측 p값입니다. McNemar는 `(abs(b - c) - 1) ** 2 / (b + c)`입니다."],
    solution: py`
import numpy as np
from scipy import stats

def naive_t(d):
    d = np.asarray(d, dtype=float)
    return d.mean() / np.sqrt(d.var(ddof=1) / len(d))

def corrected_t(d, n_train, n_test):
    d = np.asarray(d, dtype=float)
    return d.mean() / np.sqrt((1 / len(d) + n_test / n_train) * d.var(ddof=1))

def two_sided_p(t, df):
    return float(2 * stats.t.sf(abs(t), df))

def mcnemar(b, c):
    return (abs(b - c) - 1) ** 2 / (b + c)

d = np.array([0.02, 0.01, 0.03, -0.01, 0.02, 0.015, 0.0, 0.025, 0.01, 0.02])
t1, t2 = naive_t(d), corrected_t(d, n_train=455, n_test=114)
print(f"단순 t = {t1:.2f} (p = {two_sided_p(t1, len(d) - 1):.4f})")
print(f"보정 t = {t2:.2f} (p = {two_sided_p(t2, len(d) - 1):.4f})")
print("McNemar χ² =", mcnemar(15, 5))
`,
  },
]);
