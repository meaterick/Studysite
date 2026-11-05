import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "최소 노름 보간과 이중 하강",
    prompt: md`

본문의 앙상블 분산 공식과 이중 하강 실험을 부품부터 만듭니다.

1. \`ensemble_variance(rho, B, sigma2=1.0)\` $= \rho\sigma^2 + \dfrac{(1-\rho)\sigma^2}{B}$
2. \`min_norm_fit(X, y)\`: 유사역행렬로 구한 최소제곱 해 $X^{+}y$. $p > n$이면 학습 데이터를 정확히 지나는 해 중 노름이 가장 작은 해입니다.
3. \`test_mse(p, seed)\`: 본문 설정(샘플 $n=40$, 특성 $d=100$, $\beta \sim \mathcal{N}(0, 1/d)$, 잡음 표준편차 0.1, 테스트 500개)에서 **앞에서부터 $p$개 특성**만 쓴 \`min_norm_fit\`의 테스트 MSE(참값 $X_t\beta$ 기준)를 돌려줍니다. 난수는 \`np.random.default_rng(seed)\` 하나에서 $\beta$, $X$, $X_t$, 잡음 순서로 뽑습니다.
`,
    starter: py`
import numpy as np

def ensemble_variance(rho, B, sigma2=1.0):
    return 0.0  # TODO

def min_norm_fit(X, y):
    return np.zeros(np.asarray(X).shape[1])  # TODO: np.linalg.pinv

def test_mse(p, seed, n=40, d=100, sigma=0.1):
    rng = np.random.default_rng(seed)
    beta = rng.normal(0, 1, d) / np.sqrt(d)
    X, Xt = rng.normal(size=(n, d)), rng.normal(size=(500, d))
    y = X @ beta + rng.normal(0, sigma, n)
    # TODO: 앞의 p개 특성으로 min_norm_fit 한 뒤, Xt의 앞 p개 특성으로 예측해 Xt @ beta와의 MSE를 돌려줍니다.
    return 0.0

for p in (10, 30, 40, 50, 100):
    print(p, round(float(np.median([test_mse(p, s) for s in range(30)])), 3))
`,
    tests: py`
import numpy as np

@test("평균의 분산 공식")
def _():
    assert approx(ensemble_variance(0.0, 10), 0.1) and approx(ensemble_variance(0.5, 1000), 0.5005)
    assert approx(ensemble_variance(0.3, 10, sigma2=4.0), 4 * 0.37)

@test("p > n이면 학습 데이터를 정확히 지나고, 다른 보간 해보다 노름이 작다")
def _():
    rng = np.random.default_rng(3)
    X, y = rng.normal(size=(5, 12)), rng.normal(size=5)
    w = min_norm_fit(X, y)
    assert approx(X @ w, y, 1e-8), "학습 데이터를 정확히 지나지 않습니다."
    null = np.linalg.svd(X)[2][-1]                     # X @ null ≈ 0인 방향
    assert approx(X @ null, np.zeros(5), 1e-8)
    assert np.linalg.norm(w) < np.linalg.norm(w + 0.5 * null)

@test("p < n이면 일반 최소제곱 해와 같다")
def _():
    rng = np.random.default_rng(4)
    X, y = rng.normal(size=(30, 4)), rng.normal(size=30)
    assert approx(min_norm_fit(X, y), np.linalg.lstsq(X, y, rcond=None)[0], 1e-8)

@test("보간 문턱 p = n에서 테스트 오차가 치솟는다")
def _():
    med = lambda p: np.median([test_mse(p, s) for s in range(30)])
    m20, m40, m60 = med(20), med(40), med(60)
    assert m40 > 5 * m20 and m40 > 5 * m60, f"p=20 {m20:.3f}, p=40 {m40:.3f}, p=60 {m60:.3f}"

@test("가장 과대 파라미터화된 p = 100이 p = 10보다 낫다")
def _():
    med = lambda p: np.median([test_mse(p, s) for s in range(30)])
    m10, m100 = med(10), med(100)
    assert m100 < m10 and m100 < 1.0, f"p=10 {m10:.3f}, p=100 {m100:.3f}"
`,
    hints: ["`ensemble_variance`는 `rho * sigma2 + (1 - rho) * sigma2 / B`입니다.", "`np.linalg.pinv(X) @ y`가 최소 노름 최소제곱 해입니다. $p < n$이면 일반 최소제곱 해와 같습니다.", "`coef = min_norm_fit(X[:, :p], y)` 다음 `np.mean((Xt[:, :p] @ coef - Xt @ beta) ** 2)`입니다."],
    solution: py`
import numpy as np

def ensemble_variance(rho, B, sigma2=1.0):
    return rho * sigma2 + (1 - rho) * sigma2 / B

def min_norm_fit(X, y):
    return np.linalg.pinv(np.asarray(X, dtype=float)) @ np.asarray(y, dtype=float)

def test_mse(p, seed, n=40, d=100, sigma=0.1):
    rng = np.random.default_rng(seed)
    beta = rng.normal(0, 1, d) / np.sqrt(d)
    X, Xt = rng.normal(size=(n, d)), rng.normal(size=(500, d))
    y = X @ beta + rng.normal(0, sigma, n)
    coef = min_norm_fit(X[:, :p], y)
    return float(np.mean((Xt[:, :p] @ coef - Xt @ beta) ** 2))

for p in (10, 30, 40, 50, 100):
    print(p, round(float(np.median([test_mse(p, s) for s in range(30)])), 3))
`,
  },
]);
