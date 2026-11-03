import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "K-means 할당·갱신 반복 직접 구현",
    prompt: md`

본문에서 따라간 K-means를 구현합니다. 한 번의 반복은 **할당**(가장 가까운 중심에 배정)과 **갱신**(군집 평균으로 중심 이동) 두 단계입니다.

1. \`assign(points, centroids)\`: 각 점에서 가장 가까운 중심의 번호 배열
2. \`update(points, labels, k)\`: 군집마다 속한 점의 평균
3. \`kmeans(points, init, n_iter)\`: 할당·갱신을 반복하고, 중심이 더 이상 바뀌지 않으면 일찍 멈춥니다. \`(centroids, labels)\`를 돌려줍니다.

본문 예제(처음 중심 $(1, 1)$, $(5, 4)$)에서 1회 갱신 후 중심이 $(1, 1)$, $(4.33, 4.33)$이 되어야 합니다.
`,
    starter: py`
import numpy as np

def assign(points, centroids):
    # TODO: (점 수, 중심 수) 거리 행렬을 만들고 행마다 argmin
    return np.zeros(len(points), dtype=int)

def update(points, labels, k):
    # TODO: 군집 j에 속한 점들(points[labels == j])의 평균
    return np.zeros((k, points.shape[1]))

def kmeans(points, init, n_iter=10):
    centroids = np.asarray(init, dtype=float)
    labels = assign(points, centroids)
    for _ in range(n_iter):
        labels = assign(points, centroids)
        new = update(points, labels, len(centroids))
        # TODO: 중심이 바뀌지 않았으면(np.allclose) 멈추고, 아니면 centroids를 갱신합니다.
        centroids = new
    return centroids, labels

pts = np.array([[1, 1], [1, 2], [4, 4], [5, 4], [1, 0], [4, 5]], dtype=float)
labels = assign(pts, np.array([[1, 1], [5, 4]], dtype=float))
print("1회차 배정:", labels)
print("1회 갱신 후 중심:\n", np.round(update(pts, labels, 2), 2))
print("수렴 결과:", kmeans(pts, [[1, 1], [5, 4]]))
`,
    tests: py`
import numpy as np
pts = np.array([[1, 1], [1, 2], [4, 4], [5, 4], [1, 0], [4, 5]], dtype=float)

@test("1회차 배정 = [0, 0, 1, 1, 0, 1]")
def _():
    got = np.asarray(assign(pts, np.array([[1, 1], [5, 4]], dtype=float))).tolist()
    assert got == [0, 0, 1, 1, 0, 1], f"결과: {got}"

@test("1회 갱신 후 중심 = (1, 1), (4.33, 4.33)")
def _():
    c = update(pts, np.array([0, 0, 1, 1, 0, 1]), 2)
    assert approx(c, [[1, 1], [13 / 3, 13 / 3]]), f"결과: {np.round(c, 3)}"

@test("거리는 유클리드 거리로 비교한다")
def _():
    got = np.asarray(assign(np.array([[0.0, 3.0]]), np.array([[0.0, 0.0], [2.5, 2.5]]))).tolist()
    assert got == [1], f"결과: {got}"

@test("kmeans가 같은 군집 구조로 수렴한다")
def _():
    c, labels = kmeans(pts, [[1, 1], [5, 4]])
    assert np.asarray(labels).tolist() == [0, 0, 1, 1, 0, 1]
    assert approx(c, [[1, 1], [13 / 3, 13 / 3]])

@test("나쁜 초기값에서 시작해도 두 무리를 찾는다")
def _():
    c, labels = kmeans(pts, [[1, 0], [1, 2]], n_iter=20)
    groups = sorted(sorted(np.where(np.asarray(labels) == j)[0].tolist()) for j in range(2))
    assert groups == [[0, 1, 4], [2, 3, 5]], f"군집: {groups}"
`,
    hints: ["`d = np.linalg.norm(points[:, None, :] - centroids[None, :, :], axis=2)`는 (점 수, 중심 수) 거리 행렬입니다. `d.argmin(axis=1)`이 배정입니다.", "`np.array([points[labels == j].mean(axis=0) for j in range(k)])`", "반복문 안에서 `if np.allclose(new, centroids): break`를 갱신 전에 검사합니다. 멈춘 뒤의 labels가 최종 배정과 일치하는지도 생각해 보십시오."],
    solution: py`
import numpy as np

def assign(points, centroids):
    d = np.linalg.norm(points[:, None, :] - centroids[None, :, :], axis=2)
    return d.argmin(axis=1)

def update(points, labels, k):
    return np.array([points[labels == j].mean(axis=0) for j in range(k)])

def kmeans(points, init, n_iter=10):
    centroids = np.asarray(init, dtype=float)
    labels = assign(points, centroids)
    for _ in range(n_iter):
        labels = assign(points, centroids)
        new = update(points, labels, len(centroids))
        if np.allclose(new, centroids):
            break
        centroids = new
    labels = assign(points, centroids)
    return centroids, labels

pts = np.array([[1, 1], [1, 2], [4, 4], [5, 4], [1, 0], [4, 5]], dtype=float)
labels = assign(pts, np.array([[1, 1], [5, 4]], dtype=float))
print("1회차 배정:", labels)
print("1회 갱신 후 중심:\n", np.round(update(pts, labels, 2), 2))
print("수렴 결과:", kmeans(pts, [[1, 1], [5, 4]]))
`,
  },
  {
    key: "ex2",
    title: "숫자·범주 열이 섞인 데이터의 파이프라인",
    prompt: md`

\`build_model(num_cols, cat_cols)\`가 다음 파이프라인을 돌려주게 완성합니다.

- 숫자 열: \`SimpleImputer(strategy="median")\` → \`StandardScaler()\`
- 범주 열: \`OneHotEncoder(handle_unknown="ignore")\`
- 두 처리를 \`ColumnTransformer\`로 묶고, 뒤에 \`LogisticRegression(max_iter=1000)\`을 붙입니다.

결측이 있는 소득, 학습 데이터에 없던 도시가 들어와도 오류 없이 예측해야 합니다.
`,
    starter: py`
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

def build_model(num_cols, cat_cols):
    # TODO: ColumnTransformer(숫자: 중앙값 대체 → 표준화, 범주: 원-핫) + LogisticRegression 파이프라인
    return make_pipeline(LogisticRegression(max_iter=1000))

df = pd.DataFrame({"나이": [25, 47, 33, 52, 41, 38], "소득": [210, np.nan, 260, 400, np.nan, 300],
                   "도시": ["서울", "부산", "서울", "대구", "부산", "서울"]})
y = np.array([0, 1, 0, 1, 1, 0])
model = build_model(["나이", "소득"], ["도시"]).fit(df, y)
print(model.predict_proba(pd.DataFrame({"나이": [40], "소득": [np.nan], "도시": ["광주"]})).round(3))
`,
    tests: py`
import numpy as np
import pandas as pd

def customers():
    rng = np.random.default_rng(0)
    n = 300
    age = rng.integers(20, 70, n).astype(float)
    income = rng.normal(300, 80, n)
    city = rng.choice(["서울", "부산", "대구"], n, p=[0.5, 0.3, 0.2])
    logit = 0.04 * (age - 45) + 0.01 * (income - 300) + np.where(city == "서울", 0.8, np.where(city == "부산", -0.4, 0.0))
    y = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)
    income[rng.random(n) < 0.15] = np.nan
    return pd.DataFrame({"나이": age, "소득": income, "도시": city}), y

@test("결측과 범주가 섞인 표를 학습하고 예측한다")
def _():
    X, y = customers()
    m = build_model(["나이", "소득"], ["도시"]).fit(X, y)
    p = m.predict_proba(X)[:, 1]
    assert p.shape == (300,) and not np.isnan(p).any()

@test("처음 보는 도시와 결측 소득에도 오류 없이 예측한다")
def _():
    X, y = customers()
    m = build_model(["나이", "소득"], ["도시"]).fit(X, y)
    p = m.predict_proba(pd.DataFrame({"나이": [40.0], "소득": [np.nan], "도시": ["광주"]}))
    assert p.shape == (1, 2)

@test("전처리 결과는 숫자 2열 + 도시 원-핫 3열")
def _():
    X, y = customers()
    m = build_model(["나이", "소득"], ["도시"]).fit(X, y)
    Z = m[:-1].transform(X)
    assert Z.shape == (300, 5), f"모양: {Z.shape}"
    assert approx(np.asarray(Z)[:, 0].mean(), 0.0, tol=1e-6), "숫자 열이 표준화되지 않았습니다."
`,
    hints: [
      "`num = make_pipeline(SimpleImputer(strategy=\"median\"), StandardScaler())`로 숫자 열 처리를 먼저 만듭니다.",
      "`ColumnTransformer([(\"num\", num, num_cols), (\"cat\", OneHotEncoder(handle_unknown=\"ignore\"), cat_cols)])`입니다.",
      "마지막에 `make_pipeline(pre, LogisticRegression(max_iter=1000))`을 돌려줍니다. `m[:-1]`은 모델을 뺀 전처리 부분입니다.",
    ],
    solution: py`
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

def build_model(num_cols, cat_cols):
    num = make_pipeline(SimpleImputer(strategy="median"), StandardScaler())
    pre = ColumnTransformer([
        ("num", num, num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
    ])
    return make_pipeline(pre, LogisticRegression(max_iter=1000))

df = pd.DataFrame({"나이": [25, 47, 33, 52, 41, 38], "소득": [210, np.nan, 260, 400, np.nan, 300],
                   "도시": ["서울", "부산", "서울", "대구", "부산", "서울"]})
y = np.array([0, 1, 0, 1, 1, 0])
model = build_model(["나이", "소득"], ["도시"]).fit(df, y)
print(model.predict_proba(pd.DataFrame({"나이": [40], "소득": [np.nan], "도시": ["광주"]})).round(3))
`,
  },
]);
