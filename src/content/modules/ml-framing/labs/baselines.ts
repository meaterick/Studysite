import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "회귀 지표와 평균 베이스라인",
    prompt: md`

\`regression_report(y, y_hat)\`가 MAE·MSE·RMSE·$R^2$를 딕셔너리로 돌려주게 완성합니다. $R^2 = 1 - \dfrac{\sum (y - \hat y)^2}{\sum (y - \bar y)^2}$는 "평균만 말하는 베이스라인보다 오차를 얼마나 줄였는가"입니다. 그래서 평균을 그대로 예측하면 $R^2 = 0$, 그보다 못하면 음수가 됩니다.
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
print("평균 베이스라인:", regression_report([3, 5, 7, 9], [6, 6, 6, 6]))
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

@test("MAE와 MSE: [2, 4, 6] vs [3, 3, 9]")
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
print("평균 베이스라인:", regression_report([3, 5, 7, 9], [6, 6, 6, 6]))
`,
  },
]);
