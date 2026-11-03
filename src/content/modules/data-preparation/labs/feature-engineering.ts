import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "파생 특성 만들기와 중복 특성 걸러 내기",
    prompt: md`

1. \`add_features(df)\`: 집 거래 표(\`price\`, \`area\`, \`built\`, \`sold\`)에 다음 열을 더한 **복사본**을 돌려줍니다. 가격을 예측하는 데 쓸 특성이므로 \`price\`로 계산한 특성은 만들지 않습니다.
   - \`age\`: 판매 연도 − 건축 연도
   - \`sold_month\`: 판매 월
   - \`is_weekend\`: 토·일요일에 팔렸으면 1, 아니면 0
   - \`log_area\`: $\log(\text{면적})$ (\`np.log\`)
2. \`drop_redundant(X, threshold=0.95)\`: 분산이 0인 열을 빼고, 남은 열을 왼쪽부터 보면서 **이미 남기기로 한 열**과 상관계수의 절댓값이 \`threshold\`보다 큰 열을 뺍니다. 남긴 열 이름의 리스트를 원래 순서대로 돌려줍니다.
3. \`distance_contrast(d, n=500, seed=0)\`: $[0, 1]^d$에 점 \`n\`개와 기준점 하나를 \`np.random.default_rng(seed)\`로 찍고, 기준점까지 거리의 (최댓값 − 최솟값) / 최솟값을 돌려줍니다.
`,
    starter: py`
import numpy as np
import pandas as pd

houses = pd.DataFrame({
    "price": [52000, 31000, 78000, 45000],
    "area": [84, 59, 114, 76],
    "built": [2005, 1998, 2015, 2010],
    "sold": pd.to_datetime(["2024-03-02", "2024-03-09", "2024-04-15", "2024-05-01"]),
})

def add_features(df):
    out = df.copy()
    # TODO: age, sold_month, is_weekend, log_area
    return out

def drop_redundant(X, threshold=0.95):
    # TODO: 분산 0인 열 제외 → 왼쪽부터 남긴 열과의 |상관계수|가 threshold보다 크면 제외
    return list(X.columns)

def distance_contrast(d, n=500, seed=0):
    rng = np.random.default_rng(seed)
    # TODO: 점 n개 P (n, d)와 기준점 q (d,)를 만들고 거리의 (최댓값 - 최솟값) / 최솟값
    return 0.0

print(add_features(houses))
rng = np.random.default_rng(1)
X = pd.DataFrame({"a": rng.normal(size=50), "c": 3.0})
X["a2"] = 2 * X["a"] + 0.001 * rng.normal(size=50)
X["b"] = rng.normal(size=50)
print(drop_redundant(X))                           # 기대: ['a', 'b']
print([round(distance_contrast(d), 2) for d in (2, 100)])
`,
    tests: py`
import numpy as np
import pandas as pd

H = pd.DataFrame({
    "price": [52000, 31000, 78000, 45000],
    "area": [84, 59, 114, 76],
    "built": [2005, 1998, 2015, 2010],
    "sold": pd.to_datetime(["2024-03-02", "2024-03-09", "2024-04-15", "2024-05-01"]),
})

@test("add_features: age, sold_month, is_weekend, log_area")
def _():
    f = add_features(H)
    assert f["age"].tolist() == [19, 26, 9, 14], f"age: {f.get('age')}"
    assert f["sold_month"].tolist() == [3, 3, 4, 5], f"sold_month: {f.get('sold_month')}"
    assert f["is_weekend"].tolist() == [1, 1, 0, 0], f"is_weekend: {f.get('is_weekend')}"
    assert approx(f["log_area"].tolist(), np.log([84, 59, 114, 76]).tolist())

@test("add_features: 가격으로 만든 열이 없고, 원래 표는 그대로")
def _():
    f = add_features(H)
    assert set(f.columns) - set(H.columns) == {"age", "sold_month", "is_weekend", "log_area"}, f"새 열: {set(f.columns) - set(H.columns)}"
    assert list(H.columns) == ["price", "area", "built", "sold"], "원래 표가 바뀌었습니다."

@test("drop_redundant: 상수 열과 거의 같은 열을 뺀다")
def _():
    rng = np.random.default_rng(1)
    X = pd.DataFrame({"a": rng.normal(size=50), "c": 3.0})
    X["a2"] = 2 * X["a"] + 0.001 * rng.normal(size=50)
    X["b"] = rng.normal(size=50)
    assert drop_redundant(X) == ["a", "b"], f"결과: {drop_redundant(X)}"

@test("drop_redundant: 음의 상관도 절댓값으로 본다, 순서 유지")
def _():
    rng = np.random.default_rng(2)
    X = pd.DataFrame({"u": rng.normal(size=40), "v": rng.normal(size=40)})
    X["neg_u"] = -X["u"]
    X["w"] = rng.normal(size=40)
    assert drop_redundant(X) == ["u", "v", "w"], f"결과: {drop_redundant(X)}"

@test("distance_contrast: 차원이 높을수록 작아진다")
def _():
    vals = [distance_contrast(d) for d in (2, 10, 100, 1000)]
    assert all(a > b for a, b in zip(vals, vals[1:])), f"결과: {vals}"
    assert vals[-1] < 0.2 and vals[0] > 5, f"결과: {vals}"
`,
    hints: [
      "`out['age'] = out['sold'].dt.year - out['built']`, `out['is_weekend'] = (out['sold'].dt.dayofweek >= 5).astype(int)`처럼 `.dt` 접근자를 씁니다.",
      "`kept = []` 다음 열마다 `if X[col].var() == 0: continue`, `if any(abs(X[col].corr(X[k])) > threshold for k in kept): continue`, 아니면 `kept.append(col)`입니다.",
      "`P = rng.random((n, d))`, `q = rng.random(d)`, `dist = np.sqrt(((P - q) ** 2).sum(axis=1))`입니다.",
    ],
    solution: py`
import numpy as np
import pandas as pd

houses = pd.DataFrame({
    "price": [52000, 31000, 78000, 45000],
    "area": [84, 59, 114, 76],
    "built": [2005, 1998, 2015, 2010],
    "sold": pd.to_datetime(["2024-03-02", "2024-03-09", "2024-04-15", "2024-05-01"]),
})

def add_features(df):
    out = df.copy()
    out["age"] = out["sold"].dt.year - out["built"]
    out["sold_month"] = out["sold"].dt.month
    out["is_weekend"] = (out["sold"].dt.dayofweek >= 5).astype(int)
    out["log_area"] = np.log(out["area"])
    return out

def drop_redundant(X, threshold=0.95):
    kept = []
    for col in X.columns:
        if X[col].var() == 0:
            continue
        if any(abs(X[col].corr(X[k])) > threshold for k in kept):
            continue
        kept.append(col)
    return kept

def distance_contrast(d, n=500, seed=0):
    rng = np.random.default_rng(seed)
    P = rng.random((n, d))
    q = rng.random(d)
    dist = np.sqrt(((P - q) ** 2).sum(axis=1))
    return float((dist.max() - dist.min()) / dist.min())

print(add_features(houses))
rng = np.random.default_rng(1)
X = pd.DataFrame({"a": rng.normal(size=50), "c": 3.0})
X["a2"] = 2 * X["a"] + 0.001 * rng.normal(size=50)
X["b"] = rng.normal(size=50)
print(drop_redundant(X))
print([round(distance_contrast(d), 2) for d in (2, 100)])
`,
  },
]);
