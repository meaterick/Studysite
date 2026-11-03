import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "Ridge = MAP, 로지스틱 손실의 헤세 행렬",
    prompt: md`

본문의 결론을 코드로 확인합니다.

1. \`gaussian_nll(w, X, y, sigma2)\`: 잡음 분산 $\sigma^2$을 가정한 **샘플당** 음의 로그가능도 $\frac{1}{2}\log(2\pi\sigma^2) + \frac{1}{2\sigma^2}\cdot\frac{1}{n}\lVert y - Xw\rVert^2$
2. \`ridge_closed_form(X, y, lam)\` $= (X^\top X + \lambda I)^{-1}X^\top y$ (\`np.linalg.solve\` 사용, 절편 없음)
3. \`map_lambda(sigma2, tau2)\`: 가우시안 사전 $\mathcal{N}(0, \tau^2)$의 MAP와 같아지는 Ridge의 $\lambda = \sigma^2/\tau^2$
4. \`logistic_hessian(X, w)\`: 평균 로지스틱 손실의 헤세 행렬 $\frac{1}{n}X^\top S X$, $S = \operatorname{diag}(p_i(1-p_i))$
`,
    starter: py`
import numpy as np

def gaussian_nll(w, X, y, sigma2):
    return 0.0  # TODO

def ridge_closed_form(X, y, lam):
    return np.zeros(X.shape[1])  # TODO

def map_lambda(sigma2, tau2):
    return 0.0  # TODO

def logistic_hessian(X, w):
    X = np.asarray(X, dtype=float)
    p = 1 / (1 + np.exp(-(X @ w)))
    return np.zeros((X.shape[1], X.shape[1]))  # TODO: X.T @ diag(p(1-p)) @ X / n

rng = np.random.default_rng(1)
x1 = rng.normal(size=50)
X = np.column_stack([x1, x1 + rng.normal(0, 0.01, 50)])
y = 3 * x1 + rng.normal(0, 0.5, 50)
for lam in (0.1, 1.0, 10.0):
    print(lam, np.round(ridge_closed_form(X, y, lam), 3), "cond", round(float(np.linalg.cond(X.T @ X + lam * np.eye(2))), 1))
print("λ =", map_lambda(0.25, 0.05))
`,
    tests: py`
import numpy as np
from sklearn.linear_model import Ridge
rng = np.random.default_rng(1)
x1 = rng.normal(size=50)
X = np.column_stack([x1, x1 + rng.normal(0, 0.01, 50)])
y = 3 * x1 + rng.normal(0, 0.5, 50)

@test("닫힌 해가 sklearn Ridge(fit_intercept=False)와 같다")
def _():
    for lam in (0.1, 1.0, 10.0):
        got = ridge_closed_form(X, y, lam)
        ref = Ridge(alpha=lam, fit_intercept=False).fit(X, y).coef_
        assert approx(got, ref, 1e-6), f"λ={lam}: {got} vs {ref}"

@test("λ를 키우면 가중치 노름이 줄어든다")
def _():
    norms = [np.linalg.norm(ridge_closed_form(X, y, lam)) for lam in (0.1, 1.0, 10.0, 100.0)]
    assert all(a > b for a, b in zip(norms, norms[1:])), f"노름: {np.round(norms, 3)}"

@test("NLL의 최솟값은 최소제곱 해에 있다(기울기 ≈ 0, 주변보다 작다)")
def _():
    Xg = rng.normal(size=(40, 2))
    yg = Xg @ np.array([1.5, -2.0]) + rng.normal(0, 0.3, 40)
    w_ls = np.linalg.lstsq(Xg, yg, rcond=None)[0]
    base = gaussian_nll(w_ls, Xg, yg, 0.09)
    for d in (np.array([1e-3, 0]), np.array([0, -1e-3]), np.array([2e-3, 2e-3])):
        assert gaussian_nll(w_ls + d, Xg, yg, 0.09) > base
    assert approx(gaussian_nll(np.zeros(2), np.zeros((1, 2)), np.zeros(1), 1.0), 0.5 * np.log(2 * np.pi))

@test("map_lambda = σ²/τ²")
def _():
    assert approx(map_lambda(0.25, 0.05), 5.0) and approx(map_lambda(1.0, 4.0), 0.25)

@test("로지스틱 헤세 행렬: 수치미분과 일치하고 양의 준정부호")
def _():
    Xh = rng.normal(size=(30, 3))
    yh = rng.integers(0, 2, 30)
    w0 = rng.normal(size=3) * 0.5
    grad = lambda w: Xh.T @ (1 / (1 + np.exp(-(Xh @ w))) - yh) / len(yh)
    h = 1e-6
    num = np.column_stack([(grad(w0 + h * e) - grad(w0 - h * e)) / (2 * h) for e in np.eye(3)])
    H = logistic_hessian(Xh, w0)
    assert approx(H, num, 1e-5), "수치미분으로 구한 헤세 행렬과 다릅니다."
    assert np.linalg.eigvalsh(H).min() >= -1e-12
`,
    hints: ["`gaussian_nll`은 `0.5 * np.log(2 * np.pi * sigma2) + np.mean((y - X @ w) ** 2) / (2 * sigma2)`입니다.", "`np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)`", "`S = p * (1 - p)`를 벡터로 두면 `X.T @ (S[:, None] * X) / len(X)`가 $X^\\top S X / n$입니다."],
    solution: py`
import numpy as np

def gaussian_nll(w, X, y, sigma2):
    X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    return 0.5 * np.log(2 * np.pi * sigma2) + np.mean((y - X @ w) ** 2) / (2 * sigma2)

def ridge_closed_form(X, y, lam):
    return np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)

def map_lambda(sigma2, tau2):
    return sigma2 / tau2

def logistic_hessian(X, w):
    X = np.asarray(X, dtype=float)
    p = 1 / (1 + np.exp(-(X @ w)))
    S = p * (1 - p)
    return X.T @ (S[:, None] * X) / len(X)

rng = np.random.default_rng(1)
x1 = rng.normal(size=50)
X = np.column_stack([x1, x1 + rng.normal(0, 0.01, 50)])
y = 3 * x1 + rng.normal(0, 0.5, 50)
for lam in (0.1, 1.0, 10.0):
    print(lam, np.round(ridge_closed_form(X, y, lam), 3), "cond", round(float(np.linalg.cond(X.T @ X + lam * np.eye(2))), 1))
print("λ =", map_lambda(0.25, 0.05))
`,
  },
]);
