import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "최소제곱 해와 잔차",
    prompt: md`

정규방정식과 같은 해를 \`np.linalg.lstsq\`로 계산합니다.

1. \`fit_least_squares(X, y)\`: 모양 \`(n, d)\`인 \`X\`에 1로 채운 열을 붙여 \`np.linalg.lstsq\`로 풀고, 가중치 \`w\`(길이 \`d\`)와 편향 \`b\`를 \`(w, b)\`로 돌려줍니다.
2. \`residuals(X, y, w, b)\`: 샘플마다 잔차 $y_i - \hat y_i$를 돌려줍니다.
`,
    starter: py`
import numpy as np

def fit_least_squares(X, y):
    X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    # TODO: A = [X, 1] 을 만들고 np.linalg.lstsq(A, y, rcond=None)[0] 에서 w와 b를 나눕니다.
    return np.zeros(X.shape[1]), 0.0

def residuals(X, y, w, b):
    return np.zeros(len(y))  # TODO

rng = np.random.default_rng(0)
n = 200
area = rng.uniform(40, 140, n)
dist = rng.uniform(0.2, 3.0, n)
price = 600 * area - 4000 * dist + 5000 + rng.normal(0, 4000, n)
X = np.column_stack([area, dist])
w, b = fit_least_squares(X, price)
print(np.round(w, 1), round(b, 1))                         # 기대: [  598.6 -3689.2] 4754.3
print(round(float(residuals(X, price, w, b).mean()), 6))   # 기대: 0에 매우 가까운 값
`,
    tests: py`
import numpy as np

@test("본문 집값 데이터: w ≈ [598.6, -3689.2], b ≈ 4754.3")
def _():
    rng = np.random.default_rng(0)
    n = 200
    area = rng.uniform(40, 140, n)
    dist = rng.uniform(0.2, 3.0, n)
    price = 600 * area - 4000 * dist + 5000 + rng.normal(0, 4000, n)
    w, b = fit_least_squares(np.column_stack([area, dist]), price)
    assert np.shape(w) == (2,), f"w의 모양: {np.shape(w)}"
    assert approx(list(w) + [b], [598.6, -3689.2, 4754.3], tol=0.1), f"결과: {w}, {b}"

@test("정답이 정확히 선형이면 그대로 복원한다")
def _():
    X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [2.0, 3.0]])
    y = X @ np.array([2.0, -1.0]) + 0.5
    w, b = fit_least_squares(X, y)
    assert approx(w, [2.0, -1.0]) and approx(b, 0.5), f"결과: {w}, {b}"

@test("편향이 있으면 학습 데이터의 잔차 평균은 0")
def _():
    rng = np.random.default_rng(3)
    X = rng.normal(size=(50, 3))
    y = rng.normal(size=50) + 4
    w, b = fit_least_squares(X, y)
    r = np.asarray(residuals(X, y, w, b))
    assert r.shape == (50,) and abs(r.mean()) < 1e-9, f"잔차 평균: {r.mean()}"

@test("곡선 관계에서는 x²을 특성으로 추가하면 잔차 제곱합이 줄어든다")
def _():
    rng = np.random.default_rng(1)
    x = rng.uniform(0, 10, 300)
    y = 0.5 * x ** 2 - 2 * x + 3 + rng.normal(0, 2, 300)
    X1, X2 = x.reshape(-1, 1), np.column_stack([x, x ** 2])
    sse1 = np.sum(np.asarray(residuals(X1, y, *fit_least_squares(X1, y))) ** 2)
    sse2 = np.sum(np.asarray(residuals(X2, y, *fit_least_squares(X2, y))) ** 2)
    assert sse2 < 0.3 * sse1, f"잔차 제곱합: 직선 {sse1:.1f}, x² 추가 {sse2:.1f}"
`,
    hints: [
      "`A = np.column_stack([X, np.ones(len(X))])`로 1 열을 붙입니다.",
      "`coef = np.linalg.lstsq(A, y, rcond=None)[0]`에서 `coef[:-1]`이 가중치, `coef[-1]`이 편향입니다.",
      "잔차는 `y - (X @ w + b)`입니다.",
    ],
    solution: py`
import numpy as np

def fit_least_squares(X, y):
    X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    A = np.column_stack([X, np.ones(len(X))])
    coef = np.linalg.lstsq(A, y, rcond=None)[0]
    return coef[:-1], float(coef[-1])

def residuals(X, y, w, b):
    return np.asarray(y, dtype=float) - (np.asarray(X, dtype=float) @ w + b)

rng = np.random.default_rng(0)
n = 200
area = rng.uniform(40, 140, n)
dist = rng.uniform(0.2, 3.0, n)
price = 600 * area - 4000 * dist + 5000 + rng.normal(0, 4000, n)
X = np.column_stack([area, dist])
w, b = fit_least_squares(X, price)
print(np.round(w, 1), round(b, 1))
print(round(float(residuals(X, price, w, b).mean()), 6))
`,
  },
  {
    key: "ex2",
    title: "회귀 지표와 평균 기준 모델",
    prompt: md`

\`regression_report(y, y_hat)\`가 MAE·MSE·RMSE·$R^2$를 딕셔너리로 돌려주게 완성합니다. $R^2 = 1 - \dfrac{\sum (y - \hat y)^2}{\sum (y - \bar y)^2}$는 평균을 예측하는 기준 모델 대비 줄인 오차의 비율이므로, 평균을 그대로 예측하면 0, 그보다 못하면 음수입니다.
`,
    starter: py`
import numpy as np

def regression_report(y, y_hat):
    y, y_hat = np.asarray(y, dtype=float), np.asarray(y_hat, dtype=float)
    err = y - y_hat
    mae = 0.0   # TODO
    mse = 0.0   # TODO
    rmse = 0.0  # TODO
    r2 = 0.0    # TODO: 1 - (오차 제곱합) / (평균 대비 제곱합)
    return {"MAE": mae, "MSE": mse, "RMSE": rmse, "R2": r2}

print(regression_report([3, 5, 7, 9], [2.5, 5.5, 6, 10]))
print("평균 기준 모델:", regression_report([3, 5, 7, 9], [6, 6, 6, 6]))
`,
    tests: py`
@test("본문 예제: MAE 0.75, MSE 0.625, RMSE ≈ 0.791, R² = 0.875")
def _():
    r = regression_report([3, 5, 7, 9], [2.5, 5.5, 6, 10])
    assert approx([r["MAE"], r["MSE"], r["RMSE"], r["R2"]], [0.75, 0.625, 0.790569, 0.875], tol=1e-5), f"결과: {r}"

@test("평균을 그대로 예측하면 R² = 0")
def _():
    assert approx(regression_report([3, 5, 7, 9], [6, 6, 6, 6])["R2"], 0.0)

@test("평균보다 못한 예측은 R²가 음수")
def _():
    assert regression_report([1, 2, 3], [3, 2, 1])["R2"] < 0

@test("MAE와 MSE: [2, 4, 6] 대 [3, 3, 9]")
def _():
    r = regression_report([2, 4, 6], [3, 3, 9])
    assert approx(r["MAE"], 5 / 3) and approx(r["MSE"], 11 / 3), f"결과: {r}"
`,
    hints: ["MAE는 `np.mean(np.abs(err))`, MSE는 `np.mean(err ** 2)`, RMSE는 `np.sqrt(mse)`입니다.", "$R^2$는 `1 - np.sum(err ** 2) / np.sum((y - y.mean()) ** 2)`입니다."],
    solution: py`
import numpy as np

def regression_report(y, y_hat):
    y, y_hat = np.asarray(y, dtype=float), np.asarray(y_hat, dtype=float)
    err = y - y_hat
    mae = float(np.mean(np.abs(err)))
    mse = float(np.mean(err ** 2))
    rmse = float(np.sqrt(mse))
    r2 = float(1 - np.sum(err ** 2) / np.sum((y - y.mean()) ** 2))
    return {"MAE": mae, "MSE": mse, "RMSE": rmse, "R2": r2}

print(regression_report([3, 5, 7, 9], [2.5, 5.5, 6, 10]))
print("평균 기준 모델:", regression_report([3, 5, 7, 9], [6, 6, 6, 6]))
`,
  },
]);
