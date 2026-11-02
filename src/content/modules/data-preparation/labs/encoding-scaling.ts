import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "훈련 통계로만 변환하는 표준화 함수 만들기",
    prompt: md`

scikit-learn의 \`StandardScaler\`가 하는 일을 함수 두 개로 나눠 구현하고, "훈련 데이터로만 fit, 테스트에는 transform만" 원칙을 코드로 확인합니다.

1. \`fit_stats(X)\`: 열별 평균과 표준편차(모집단 기준, \`ddof=0\`)를 \`(mean, std)\` 튜플로 돌려줍니다. scaler의 \`fit\`에 해당합니다.
2. \`standardize(X, mean, std)\`: **넘겨받은 통계로만** $(X - \text{mean}) / \text{std}$를 계산합니다. scaler의 \`transform\`에 해당합니다.
3. \`minmax(x)\`: 1차원 배열을 $\dfrac{x - \min}{\max - \min}$으로 0~1에 맞춥니다.

훈련 \`[[10], [20], [30]]\`의 통계로 변환하면 테스트 40은 약 2.449가 되어야 합니다.
`,
    starter: py`
import numpy as np

def fit_stats(X):
    """열별 (평균, 표준편차)"""
    X = np.asarray(X, dtype=float)
    mean = None  # TODO: 열별 평균 (axis 주의)
    std = None   # TODO: 열별 표준편차
    return mean, std

def standardize(X, mean, std):
    """넘겨받은 통계로만 표준화한다"""
    X = np.asarray(X, dtype=float)
    return X  # TODO

def minmax(x):
    x = np.asarray(x, dtype=float)
    return x  # TODO

train = np.array([[10.0], [20.0], [30.0]])
test = np.array([[40.0]])
mean, std = fit_stats(train)
print("훈련 평균, 표준편차:", mean, std)
print("테스트 40 →", standardize(test, mean, std).ravel())
print("minmax([2, 4, 6, 8]) =", minmax([2, 4, 6, 8]))
`,
    tests: py`
import numpy as np
train = np.array([[10.0], [20.0], [30.0]])

@test("훈련 통계: 평균 20, 표준편차 ≈ 8.165")
def _():
    mean, std = fit_stats(train)
    assert mean is not None and std is not None, "fit_stats가 None을 돌려줍니다."
    assert approx(mean, [20.0]) and approx(std, [8.16497], tol=1e-4), f"평균 {mean}, 표준편차 {std}"

@test("테스트 40은 훈련 통계로 ≈ 2.449")
def _():
    got = np.asarray(standardize([[40.0]], *fit_stats(train))).ravel()
    assert approx(got, [2.44949], tol=1e-4), f"결과: {got}"

@test("여러 열을 열마다 따로 표준화한다")
def _():
    X = np.array([[1, 20], [2, 45], [3, 80], [4, 130], [5, 200]])
    Z = np.asarray(standardize(X, *fit_stats(X)))
    assert approx(Z.mean(axis=0), [0, 0]) and approx(Z.std(axis=0), [1, 1]), f"열 평균 {Z.mean(axis=0)}, 열 표준편차 {Z.std(axis=0)}"

@test("standardize는 받은 통계만 쓴다(X에서 다시 구하지 않는다)")
def _():
    got = np.asarray(standardize([[0.0], [100.0]], np.array([50.0]), np.array([10.0]))).ravel()
    assert approx(got, [-5.0, 5.0]), f"결과: {got}"

@test("테스트까지 섞어 fit하면 값이 달라진다(≈ 1.342)")
def _():
    got = np.asarray(standardize([[40.0]], *fit_stats(np.vstack([train, [[40.0]]])))).ravel()
    assert approx(got, [1.34164], tol=1e-4), f"결과: {got}"

@test("minmax([2, 4, 6, 8]) = [0, 1/3, 2/3, 1]")
def _():
    assert approx(minmax([2, 4, 6, 8]), [0, 1 / 3, 2 / 3, 1])
`,
    hints: ["샘플이 행, 특징이 열이므로 열별 통계는 `X.mean(axis=0)`, `X.std(axis=0)`입니다.", "`standardize`는 `(X - mean) / std`입니다. 여기서 X의 평균을 다시 구하면 안 됩니다. 그것이 바로 누수입니다.", "`minmax`는 `(x - x.min()) / (x.max() - x.min())`입니다."],
    solution: py`
import numpy as np

def fit_stats(X):
    X = np.asarray(X, dtype=float)
    return X.mean(axis=0), X.std(axis=0)

def standardize(X, mean, std):
    X = np.asarray(X, dtype=float)
    return (X - mean) / std

def minmax(x):
    x = np.asarray(x, dtype=float)
    return (x - x.min()) / (x.max() - x.min())

train = np.array([[10.0], [20.0], [30.0]])
test = np.array([[40.0]])
mean, std = fit_stats(train)
print("훈련 평균, 표준편차:", mean, std)
print("테스트 40 →", standardize(test, mean, std).ravel())
print("minmax([2, 4, 6, 8]) =", minmax([2, 4, 6, 8]))
`,
  },
]);
