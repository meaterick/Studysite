import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "원-핫 인코딩과 순서 인코딩을 손으로 확인하기",
    prompt: md`

표 \`df\`의 \`city\`는 명목형, \`size\`는 순서형(\`S < M < L\`)입니다.

1. \`onehot\`: \`city\`를 원-핫 인코딩한 DataFrame. \`pd.get_dummies(..., dtype=int)\`를 씁니다.
2. \`size_codes\`: \`size\`를 \`S → 0\`, \`M → 1\`, \`L → 2\`로 바꾼 정수 리스트
3. \`ones_per_row\`: \`onehot\`의 행마다 1의 개수 리스트(원-핫이면 모두 1)

먼저 \`onehot\`의 열 순서와 각 행의 값을 손으로 적어 본 뒤 실행합니다.
`,
    starter: py`
import pandas as pd

df = pd.DataFrame({"city": ["부산", "서울", "부산", "대구"], "size": ["M", "S", "L", "M"]})

onehot = None         # TODO
size_codes = None     # TODO
ones_per_row = None   # TODO

print(onehot)
print(size_codes, ones_per_row)
`,
    tests: py`
@test("원-핫 열: 대구, 부산, 서울")
def _():
    assert onehot is not None and list(onehot.columns) == ["대구", "부산", "서울"], f"열: {None if onehot is None else list(onehot.columns)}"
    assert onehot.values.tolist() == [[0, 1, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0]], f"값: {onehot.values.tolist()}"

@test("순서 인코딩 [1, 0, 2, 1]")
def _():
    assert size_codes == [1, 0, 2, 1], f"결과: {size_codes}"

@test("행마다 1이 하나")
def _():
    assert ones_per_row == [1, 1, 1, 1], f"결과: {ones_per_row}"
`,
    hints: [
      "`pd.get_dummies(df[\"city\"], dtype=int)`의 열은 범주 이름의 정렬 순서로 만들어집니다.",
      "`df[\"size\"].map({\"S\": 0, \"M\": 1, \"L\": 2}).tolist()`이고, 행마다 1의 개수는 `onehot.sum(axis=1).tolist()`입니다.",
    ],
    solution: py`
import pandas as pd

df = pd.DataFrame({"city": ["부산", "서울", "부산", "대구"], "size": ["M", "S", "L", "M"]})

onehot = pd.get_dummies(df["city"], dtype=int)
size_codes = df["size"].map({"S": 0, "M": 1, "L": 2}).tolist()
ones_per_row = onehot.sum(axis=1).tolist()

print(onehot)
print(size_codes, ones_per_row)
`,
  },
  {
    key: "ex1",
    title: "학습용 데이터 통계로만 변환하는 표준화 함수 만들기",
    prompt: md`

scikit-learn의 \`StandardScaler\`가 하는 일을 함수 두 개로 나눠 구현하고, "학습용 데이터로만 fit, 평가용 데이터에는 transform만" 원칙을 코드로 확인합니다.

1. \`fit_stats(X)\`: 열별 평균과 표준편차(모집단 기준, \`ddof=0\`)를 \`(mean, std)\` 튜플로 돌려줍니다. scaler의 \`fit\`에 해당합니다.
2. \`standardize(X, mean, std)\`: **넘겨받은 통계로만** $(X - \text{mean}) / \text{std}$를 계산합니다. scaler의 \`transform\`에 해당합니다.
3. \`minmax(x)\`: 1차원 배열을 $\dfrac{x - \min}{\max - \min}$으로 0~1에 맞춥니다.

학습용 데이터 \`[[10], [20], [30]]\`의 통계로 변환하면 평가용 데이터의 40은 약 2.449가 되어야 합니다.
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
print("학습용 데이터 평균, 표준편차:", mean, std)
print("평가용 40 →", standardize(test, mean, std).ravel())
print("minmax([2, 4, 6, 8]) =", minmax([2, 4, 6, 8]))
`,
    tests: py`
import numpy as np
train = np.array([[10.0], [20.0], [30.0]])

@test("학습용 데이터 통계: 평균 20, 표준편차 ≈ 8.165")
def _():
    mean, std = fit_stats(train)
    assert mean is not None and std is not None, "fit_stats가 None을 돌려줍니다."
    assert approx(mean, [20.0]) and approx(std, [8.16497], tol=1e-4), f"평균 {mean}, 표준편차 {std}"

@test("평가용 40은 학습용 데이터 통계로 ≈ 2.449")
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

@test("평가용 데이터까지 섞어 fit하면 값이 달라진다(≈ 1.342)")
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
print("학습용 데이터 평균, 표준편차:", mean, std)
print("평가용 40 →", standardize(test, mean, std).ravel())
print("minmax([2, 4, 6, 8]) =", minmax([2, 4, 6, 8]))
`,
  },
]);
