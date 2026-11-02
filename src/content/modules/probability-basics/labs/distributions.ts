import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "표준화와 중심극한정리를 숫자로 확인하기",
    prompt: md`

「연속 확률분포: 균등분포와 정규분포」의 68-95-99.7 규칙과 중심극한정리를 함수로 만들어 확인합니다. 반복문 없이 NumPy 연산만 씁니다.

1. \`standardize(x)\`: $z = \dfrac{x - \mu}{\sigma}$로 바꿔 평균 0, 표준편차 1이 되게 합니다(z 점수). 2주차부터 특징 표준화에 그대로 씁니다.
2. \`within_k_sigma(x, k)\`: 평균에서 $k$ 표준편차 **안**($|z| < k$)에 든 값의 비율
3. \`uniform_sums(m, size, seed)\`: $U(0,1)$ 난수 $m$개의 합을 \`size\`번 만든 배열. 합의 평균은 $m/2$, 분산은 $m/12$입니다.

$m = 12$이면 $\pm 1\sigma$ 안 비율이 정규분포의 약 0.68에 가깝지만, $m = 1$(균등분포 그대로)이면 약 0.58로 다릅니다. 몇 개를 더해야 종 모양이 되는지 출력으로 확인해 보십시오.
`,
    starter: py`
import numpy as np

def standardize(x):
    """평균 0, 표준편차 1이 되도록 바꾼 배열(z 점수)"""
    x = np.asarray(x, dtype=float)
    return x  # TODO: (x - 평균) / 표준편차

def within_k_sigma(x, k):
    """평균에서 k 표준편차 안에 든 값의 비율"""
    return 0.0  # TODO: standardize 결과의 절댓값이 k보다 작은 비율 (불리언 배열의 평균)

def uniform_sums(m, size, seed=0):
    """U(0,1) 난수 m개의 합을 size번 만든 배열, shape (size,)"""
    rng = np.random.default_rng(seed)
    return np.zeros(size)  # TODO: rng.random((size, m))을 행마다 더합니다.

print(np.round(standardize([2, 4, 4, 4, 5, 5, 7, 9]), 2))
for m in (1, 2, 12):
    sums = uniform_sums(m, 100_000)
    ratios = [round(float(within_k_sigma(sums, k)), 3) for k in (1, 2, 3)]
    print(f"m={m:2d}: 평균 {sums.mean():.3f}, 표준편차 {sums.std():.3f}, ±1·2·3σ 안 비율 {ratios}")
`,
    tests: py`
import numpy as np

@test("standardize([2, 4, 4, 4, 5, 5, 7, 9]): 평균 5, 표준편차 2로 바꾼 z 점수")
def _():
    z = standardize([2, 4, 4, 4, 5, 5, 7, 9])
    assert approx(z, [-1.5, -0.5, -0.5, -0.5, 0, 0, 1, 2]), f"결과: {z}"

@test("표준화 결과는 평균 0, 표준편차 1")
def _():
    z = np.asarray(standardize(np.random.default_rng(1).normal(170, 6, 1000)))
    assert approx(z.mean(), 0.0, 1e-9) and approx(z.std(), 1.0, 1e-9), f"평균 {z.mean()}, 표준편차 {z.std()}"

@test("단위를 바꿔도(3x + 10) z 점수는 같다")
def _():
    x = np.array([1.0, 3.0, 4.0, 8.0])
    assert approx(standardize(3 * x + 10), standardize(x))

@test("within_k_sigma([2, 4, 4, 4, 5, 5, 7, 9], 1) == 5/8")
def _():
    assert approx(within_k_sigma([2, 4, 4, 4, 5, 5, 7, 9], 1), 0.625), f"결과: {within_k_sigma([2, 4, 4, 4, 5, 5, 7, 9], 1)}"

@test("균등분포 12개의 합: shape (size,), 평균 ≈ 6, 표준편차 ≈ 1")
def _():
    s = np.asarray(uniform_sums(12, 100_000))
    assert s.shape == (100_000,), f"shape: {s.shape}"
    assert abs(s.mean() - 6) < 0.02 and abs(s.std() - 1) < 0.02, f"평균 {s.mean():.3f}, 표준편차 {s.std():.3f}"

@test("중심극한정리: 12개의 합은 ±1σ ≈ 0.68, ±2σ ≈ 0.95")
def _():
    s = uniform_sums(12, 100_000)
    r1, r2 = within_k_sigma(s, 1), within_k_sigma(s, 2)
    assert abs(r1 - 0.68) < 0.01 and abs(r2 - 0.955) < 0.01, f"±1σ {r1:.3f}, ±2σ {r2:.3f}"

@test("하나만이면(균등분포) ±1σ 안 비율 ≈ 2/√12 ≈ 0.577")
def _():
    r1 = within_k_sigma(uniform_sums(1, 100_000), 1)
    assert abs(r1 - 2 / 12 ** 0.5) < 0.01, f"±1σ {r1:.3f}"
`,
    hints: ["`(x - x.mean()) / x.std()`가 z 점수입니다. `np.std`의 기본값은 모표준편차(n으로 나눔)입니다.", "`np.abs(standardize(x)) < k`는 True/False 배열이고, 그 평균(`.mean()`)이 True의 비율입니다.", "`rng.random((size, m))`은 (size, m) 모양의 균등 난수입니다. 행마다 더하려면 `.sum(axis=1)`입니다."],
    solution: py`
import numpy as np

def standardize(x):
    x = np.asarray(x, dtype=float)
    return (x - x.mean()) / x.std()

def within_k_sigma(x, k):
    return float(np.mean(np.abs(standardize(x)) < k))

def uniform_sums(m, size, seed=0):
    rng = np.random.default_rng(seed)
    return rng.random((size, m)).sum(axis=1)

print(np.round(standardize([2, 4, 4, 4, 5, 5, 7, 9]), 2))
for m in (1, 2, 12):
    sums = uniform_sums(m, 100_000)
    ratios = [round(float(within_k_sigma(sums, k)), 3) for k in (1, 2, 3)]
    print(f"m={m:2d}: 평균 {sums.mean():.3f}, 표준편차 {sums.std():.3f}, ±1·2·3σ 안 비율 {ratios}")
`,
  },
]);
