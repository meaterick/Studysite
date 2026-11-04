import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "기준 모델 세 가지와 개선 비율",
    prompt: md`

문제 유형별 기준 모델을 NumPy로 만듭니다. 기준 모델의 통계는 학습 데이터로만 계산합니다.

1. \`mean_baseline(y_train, n)\`: 학습 데이터 정답의 평균을 길이 \`n\`인 배열로 돌려줍니다.
2. \`majority_baseline(y_train, n)\`: 학습 데이터에서 가장 많이 나온 클래스를 길이 \`n\`인 배열로 돌려줍니다. 개수가 같으면 더 작은 값을 고릅니다.
3. \`seasonal_naive(series, start, period)\`: 위치 \`start\`부터 끝까지, 각 위치 $t$의 예측으로 \`series[t - period]\`를 쓴 배열을 돌려줍니다. \`period=1\`이면 직전 값 기준 모델입니다.
4. \`skill(err_model, err_base)\`: 기준 모델 대비 줄인 오차의 비율 $1 - E_{\text{모델}} / E_{\text{기준}}$을 돌려줍니다.
`,
    starter: py`
import numpy as np

def mean_baseline(y_train, n):
    return np.zeros(n)  # TODO

def majority_baseline(y_train, n):
    # TODO: np.unique(..., return_counts=True)로 가장 많은 클래스를 찾습니다.
    return np.zeros(n, dtype=int)

def seasonal_naive(series, start, period):
    series = np.asarray(series, dtype=float)
    return series[start:]  # TODO: 위치 t마다 series[t - period]

def skill(err_model, err_base):
    return 0.0  # TODO

print(mean_baseline([2, 4, 9], 2))                     # 기대: [5. 5.]
print(majority_baseline([1, 0, 1, 2, 1], 3))           # 기대: [1 1 1]
print(seasonal_naive([10, 11, 12, 13, 14], 2, 1))      # 기대: [11. 12. 13.]
print(skill(5000, 20000))                              # 기대: 0.75

# 본문의 판매량 예제: 마지막 4주(위치 112~139)를 예측한다.
rng = np.random.default_rng(0)
t = np.arange(140)
sales = 200 + 0.5 * t + 40 * (t % 7 >= 5) + rng.normal(0, 8, 140)
for period in [1, 7]:
    pred = seasonal_naive(sales, 112, period)
    print(period, round(np.mean(np.abs(sales[112:] - pred)), 1))   # 기대: 1 15.9 / 7 11.4
`,
    tests: py`
import numpy as np

@test("mean_baseline: 학습 데이터 평균을 n개")
def _():
    got = np.asarray(mean_baseline([2, 4, 9], 4))
    assert got.shape == (4,) and approx(got, [5, 5, 5, 5]), f"결과: {got}"

@test("majority_baseline: 가장 많은 클래스, 같으면 작은 값")
def _():
    assert np.asarray(majority_baseline([1, 0, 1, 2, 1], 3)).tolist() == [1, 1, 1]
    assert np.asarray(majority_baseline([3, 2, 3, 2], 2)).tolist() == [2, 2]
    assert np.asarray(majority_baseline(["정상", "사기", "정상"], 2)).tolist() == ["정상", "정상"]

@test("seasonal_naive: period=1이면 직전 값")
def _():
    got = np.asarray(seasonal_naive([10, 11, 12, 13, 14], 2, 1))
    assert approx(got, [11, 12, 13]), f"결과: {got}"

@test("seasonal_naive: period=7이면 지난주 같은 요일")
def _():
    s = np.arange(20, dtype=float) * 10
    got = np.asarray(seasonal_naive(s, 14, 7))
    assert approx(got, s[7:13]), f"결과: {got}"

@test("본문 판매량 예제: 어제 값 15.9, 지난주 같은 요일 11.4")
def _():
    rng = np.random.default_rng(0)
    t = np.arange(140)
    sales = 200 + 0.5 * t + 40 * (t % 7 >= 5) + rng.normal(0, 8, 140)
    maes = [round(float(np.mean(np.abs(sales[112:] - np.asarray(seasonal_naive(sales, 112, p))))), 1) for p in (1, 7)]
    assert maes == [15.9, 11.4], f"MAE: {maes}"

@test("skill: 같으면 0, 더 나쁘면 음수")
def _():
    assert approx(skill(5000, 20000), 0.75)
    assert approx(skill(10, 10), 0.0)
    assert skill(12, 10) < 0
`,
    hints: [
      "`mean_baseline`은 `np.full(n, np.mean(y_train))`입니다.",
      "`values, counts = np.unique(y_train, return_counts=True)` 다음 `values[counts.argmax()]`입니다. `np.unique`는 값을 정렬하고 `argmax`는 처음 나온 최댓값을 고르므로 개수가 같으면 작은 값이 선택됩니다.",
      "`seasonal_naive`는 `series[start - period:len(series) - period]`처럼 슬라이스 하나로 쓸 수 있습니다.",
    ],
    solution: py`
import numpy as np

def mean_baseline(y_train, n):
    return np.full(n, np.mean(y_train))

def majority_baseline(y_train, n):
    values, counts = np.unique(np.asarray(y_train), return_counts=True)
    return np.full(n, values[counts.argmax()])

def seasonal_naive(series, start, period):
    series = np.asarray(series, dtype=float)
    return series[start - period:len(series) - period]

def skill(err_model, err_base):
    return 1 - err_model / err_base

print(mean_baseline([2, 4, 9], 2))
print(majority_baseline([1, 0, 1, 2, 1], 3))
print(seasonal_naive([10, 11, 12, 13, 14], 2, 1))
print(skill(5000, 20000))

rng = np.random.default_rng(0)
t = np.arange(140)
sales = 200 + 0.5 * t + 40 * (t % 7 >= 5) + rng.normal(0, 8, 140)
for period in [1, 7]:
    pred = seasonal_naive(sales, 112, period)
    print(period, round(np.mean(np.abs(sales[112:] - pred)), 1))
`,
  },
  {
    key: "ex2",
    title: "구간별 오차 분석",
    prompt: md`

검증 데이터의 예측 결과가 담긴 DataFrame에서 오차가 몰린 구간을 찾습니다.

\`error_by_group(df, group_col, y_col, pred_col)\`이 \`group_col\`의 값마다 샘플 수(\`count\`)와 평균 절대 오차(\`mae\`)를 계산해, **\`mae\`가 큰 순서로** 정렬한 DataFrame을 돌려주게 완성합니다. 인덱스는 구간 값, 열은 \`count\`와 \`mae\`입니다. 원래 DataFrame은 바꾸지 않습니다.
`,
    starter: py`
import pandas as pd

def error_by_group(df, group_col, y_col, pred_col):
    # TODO: 절대 오차 열을 만든 뒤 group_col로 묶어 count와 mean을 계산하고 mae로 정렬합니다.
    return pd.DataFrame(columns=["count", "mae"])

val = pd.DataFrame({
    "날씨": ["맑음", "비", "맑음", "비", "눈", "맑음"],
    "실제": [30, 50, 28, 55, 70, 33],
    "예측": [31, 40, 30, 41, 45, 32],
})
print(error_by_group(val, "날씨", "실제", "예측"))
# 기대: 눈(1개, 25.0) → 비(2개, 12.0) → 맑음(3개, 약 1.33) 순서
`,
    tests: py`
import pandas as pd

V = pd.DataFrame({
    "날씨": ["맑음", "비", "맑음", "비", "눈", "맑음"],
    "실제": [30, 50, 28, 55, 70, 33],
    "예측": [31, 40, 30, 41, 45, 32],
})

@test("구간별 샘플 수와 MAE")
def _():
    r = error_by_group(V, "날씨", "실제", "예측")
    assert list(r.columns) == ["count", "mae"], f"열: {list(r.columns)}"
    assert r.loc["비", "count"] == 2 and approx(r.loc["비", "mae"], 12.0)
    assert r.loc["맑음", "count"] == 3 and approx(r.loc["맑음", "mae"], 4 / 3)

@test("mae가 큰 순서로 정렬")
def _():
    r = error_by_group(V, "날씨", "실제", "예측")
    assert list(r.index) == ["눈", "비", "맑음"], f"순서: {list(r.index)}"

@test("원래 DataFrame은 그대로")
def _():
    before = list(V.columns)
    error_by_group(V, "날씨", "실제", "예측")
    assert list(V.columns) == before, "원래 DataFrame에 열이 추가되었습니다. assign으로 새 DataFrame을 만드십시오."
`,
    hints: [
      "`d = df.assign(abs_err=(df[y_col] - df[pred_col]).abs())`로 새 DataFrame을 만듭니다.",
      "`d.groupby(group_col)[\"abs_err\"].agg(count=\"count\", mae=\"mean\")`처럼 이름을 붙여 집계할 수 있습니다.",
      "마지막에 `.sort_values(\"mae\", ascending=False)`로 정렬합니다.",
    ],
    solution: py`
import pandas as pd

def error_by_group(df, group_col, y_col, pred_col):
    d = df.assign(abs_err=(df[y_col] - df[pred_col]).abs())
    r = d.groupby(group_col)["abs_err"].agg(count="count", mae="mean")
    return r.sort_values("mae", ascending=False)

val = pd.DataFrame({
    "날씨": ["맑음", "비", "맑음", "비", "눈", "맑음"],
    "실제": [30, 50, 28, 55, 70, 33],
    "예측": [31, 40, 30, 41, 45, 32],
})
print(error_by_group(val, "날씨", "실제", "예측"))
`,
  },
]);
