import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "선형 모델의 예측을 반복문으로 계산하기",
    prompt: md`

선형 모델 $\hat y = w_1 x_1 + \cdots + w_d x_d + b$의 예측을 행렬곱 없이 계산합니다.

1. \`by_hand\`: $x = [2, 1, 3]$, $w = [1.5, -2, 0.5]$, $b = 1$일 때의 예측을 **손으로** 계산해 숫자로 적습니다.
2. \`predict(x, w, b)\`: 같은 위치의 특성과 가중치를 곱해 더하고 편향을 더한 값을 반복문으로 계산합니다.
3. \`n_params(d)\`: 특성이 \`d\`개인 선형 모델의 파라미터 수
`,
    starter: py`
by_hand = None   # TODO: 손으로 계산한 예측

def predict(x, w, b):
    total = 0.0
    # TODO: 같은 위치의 x와 w를 곱해 total에 더하고, 마지막에 b를 더합니다.
    return total

def n_params(d):
    return 0     # TODO

print(by_hand, predict([2, 1, 3], [1.5, -2, 0.5], 1), n_params(3))
`,
    tests: py`
@test("손으로 계산한 예측 3.5")
def _():
    assert by_hand is not None and approx(by_hand, 3.5), f"by_hand: {by_hand}"

@test("predict는 Σ w_i x_i + b")
def _():
    assert approx(predict([2, 1, 3], [1.5, -2, 0.5], 1), 3.5), f"결과: {predict([2, 1, 3], [1.5, -2, 0.5], 1)}"
    assert approx(predict([84, 3, 0.8], [500, 1000, -2000], 5000), 48400), "본문의 첫째 집 예측과 다릅니다."

@test("파라미터 수 = 특성 수 + 1")
def _():
    assert n_params(3) == 4 and n_params(10) == 11, f"n_params(3) = {n_params(3)}"
`,
    hints: [
      "$1.5 \\times 2 + (-2) \\times 1 + 0.5 \\times 3 + 1$을 계산합니다.",
      "`for xi, wi in zip(x, w): total += xi * wi` 다음 `return total + b`입니다. 파라미터는 가중치 `d`개와 편향 1개입니다.",
    ],
    solution: py`
by_hand = 3.5

def predict(x, w, b):
    total = 0.0
    for xi, wi in zip(x, w):
        total += xi * wi
    return total + b

def n_params(d):
    return d + 1

print(by_hand, predict([2, 1, 3], [1.5, -2, 0.5], 1), n_params(3))
`,
  },
  {
    key: "ex1",
    title: "표를 X와 y로 나누고 선형 모델로 예측하기",
    prompt: md`

1. \`to_xy(df, target)\`: DataFrame에서 정답 열 \`target\`을 뺀 나머지를 특성 행렬 \`X\`(NumPy 배열, 모양 \`(n, d)\`)로, 정답 열을 \`y\`(모양 \`(n,)\`)로 돌려줍니다. 원래 표는 바꾸지 않습니다.
2. \`predict_linear(X, w, b)\`: 선형 모델의 예측 $\hat y = Xw + b$
3. \`n_parameters(d, n_outputs=1)\`: 특성 $d$개를 받아 출력 \`n_outputs\`개를 내는 선형 모델의 파라미터 수. 출력마다 가중치 $d$개와 편향 1개가 있습니다.
`,
    starter: py`
import numpy as np
import pandas as pd

houses = pd.DataFrame({
    "area": [84, 59, 114, 76],
    "rooms": [3, 2, 4, 3],
    "station_km": [0.8, 1.5, 0.4, 2.1],
    "price": [52000, 31000, 78000, 41000],
})

def to_xy(df, target):
    # TODO: target 열을 뺀 특성 행렬과 target 열의 정답 벡터
    return np.zeros((0, 0)), np.zeros(0)

def predict_linear(X, w, b):
    # TODO
    return np.zeros(len(X))

def n_parameters(d, n_outputs=1):
    # TODO
    return 0

X, y = to_xy(houses, "price")
print(X.shape, y.shape)                                           # 기대: (4, 3) (4,)
print(predict_linear(X, np.array([500.0, 1000.0, -2000.0]), 5000.0))   # 기대: [48400. 33500. 65200. 41800.]
print(n_parameters(3), n_parameters(784, 10))                     # 기대: 4 7850
`,
    tests: py`
import numpy as np
import pandas as pd
H = pd.DataFrame({"area": [84, 59, 114, 76], "rooms": [3, 2, 4, 3], "station_km": [0.8, 1.5, 0.4, 2.1], "price": [52000, 31000, 78000, 41000]})

@test("to_xy: 모양 (4, 3)과 (4,), 정답 열은 X에 없다")
def _():
    X, y = to_xy(H, "price")
    assert np.shape(X) == (4, 3) and np.shape(y) == (4,), f"모양: {np.shape(X)}, {np.shape(y)}"
    assert list(np.asarray(y)) == [52000, 31000, 78000, 41000]
    assert not np.any(np.asarray(X) == 52000), "정답 값이 X에 들어 있습니다."

@test("to_xy: 원래 표는 그대로")
def _():
    to_xy(H, "price")
    assert list(H.columns) == ["area", "rooms", "station_km", "price"]

@test("predict_linear: Xw + b")
def _():
    X = np.array([[1.0, 2.0], [3.0, 4.0]])
    assert approx(predict_linear(X, np.array([0.5, -1.0]), 2.0), [0.5, -0.5])

@test("n_parameters: 출력마다 (d + 1)개")
def _():
    assert n_parameters(3) == 4 and n_parameters(784, 10) == 7850 and n_parameters(0) == 1
`,
    hints: [
      "`df.drop(columns=[target]).to_numpy()`가 특성 행렬, `df[target].to_numpy()`가 정답 벡터입니다.",
      "`predict_linear`는 `X @ w + b`입니다.",
      "`n_parameters`는 `(d + 1) * n_outputs`입니다.",
    ],
    solution: py`
import numpy as np
import pandas as pd

houses = pd.DataFrame({
    "area": [84, 59, 114, 76],
    "rooms": [3, 2, 4, 3],
    "station_km": [0.8, 1.5, 0.4, 2.1],
    "price": [52000, 31000, 78000, 41000],
})

def to_xy(df, target):
    return df.drop(columns=[target]).to_numpy(), df[target].to_numpy()

def predict_linear(X, w, b):
    return np.asarray(X) @ w + b

def n_parameters(d, n_outputs=1):
    return (d + 1) * n_outputs

X, y = to_xy(houses, "price")
print(X.shape, y.shape)
print(predict_linear(X, np.array([500.0, 1000.0, -2000.0]), 5000.0))
print(n_parameters(3), n_parameters(784, 10))
`,
  },
]);
