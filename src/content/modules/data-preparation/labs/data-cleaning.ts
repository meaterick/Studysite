import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "학습용 데이터로 정제 기준을 정하고 평가용 데이터에 적용하기",
    prompt: md`

고객 표에는 \`city\`(도시), \`age\`(나이), \`income\`(소득) 열이 있습니다. 정제 기준을 학습용 데이터에서 계산하는 함수와, 그 기준을 어떤 데이터에든 적용하는 함수를 나눠 만듭니다.

1. \`fit_cleaner(train)\`: 학습용 데이터에서 다음 값을 계산해 딕셔너리로 돌려줍니다.
   - \`"age_median"\`, \`"income_median"\`: 두 열의 중앙값(결측 제외)
   - \`"income_low"\`, \`"income_high"\`: 소득의 IQR 울타리 $Q_1 - 1.5\,\mathrm{IQR}$, $Q_3 + 1.5\,\mathrm{IQR}$ (\`quantile\`의 기본 방법)
2. \`apply_cleaner(df, params)\`: \`df\`의 복사본에 다음을 적용해 돌려줍니다.
   - \`city\`: 앞뒤 공백을 지우고 \`"Seoul"\`을 \`"서울"\`로, \`"Busan"\`을 \`"부산"\`으로 바꿉니다.
   - \`income_missing\`: 원래 소득이 결측이면 1, 아니면 0인 정수 열
   - \`age\`, \`income\`의 결측을 학습용 중앙값으로 채웁니다.
   - \`income\`을 울타리 범위로 자릅니다(\`clip\`).
`,
    starter: py`
import numpy as np
import pandas as pd

train = pd.DataFrame({
    "city": ["서울", "Seoul ", "부산", "Busan", "대구", "서울"],
    "age": [25, 31, np.nan, 47, 38, 29],
    "income": [210, 340, 290, np.nan, 5000, 260],
})
test = pd.DataFrame({"city": [" Busan", "서울"], "age": [np.nan, 52], "income": [np.nan, 9000]})

def fit_cleaner(train):
    # TODO: 중앙값 두 개와 소득의 IQR 울타리
    return {"age_median": 0.0, "income_median": 0.0, "income_low": 0.0, "income_high": 0.0}

def apply_cleaner(df, params):
    out = df.copy()
    # TODO: city 표기 통일, income_missing 열, 결측 채우기, income 자르기
    return out

params = fit_cleaner(train)
print(params)
print(apply_cleaner(test, params))      # 평가용 데이터에 학습용 기준을 적용한다
`,
    tests: py`
import numpy as np
import pandas as pd

TRAIN = pd.DataFrame({
    "city": ["서울", "Seoul ", "부산", "Busan", "대구", "서울"],
    "age": [25, 31, np.nan, 47, 38, 29],
    "income": [210, 340, 290, np.nan, 5000, 260],
})
TEST = pd.DataFrame({"city": [" Busan", "서울"], "age": [np.nan, 52], "income": [np.nan, 9000]})

@test("fit_cleaner: 학습용 중앙값과 IQR 울타리")
def _():
    p = fit_cleaner(TRAIN)
    assert approx(p["age_median"], 31) and approx(p["income_median"], 290), f"중앙값: {p}"
    q1, q3 = TRAIN["income"].quantile([0.25, 0.75])
    assert approx(p["income_low"], q1 - 1.5 * (q3 - q1)) and approx(p["income_high"], q3 + 1.5 * (q3 - q1)), f"울타리: {p}"

@test("apply_cleaner: 도시 표기 통일")
def _():
    out = apply_cleaner(TRAIN, fit_cleaner(TRAIN))
    assert out["city"].tolist() == ["서울", "서울", "부산", "부산", "대구", "서울"], f"결과: {out['city'].tolist()}"

@test("apply_cleaner: 결측 표시 열과 결측 채우기")
def _():
    out = apply_cleaner(TEST, fit_cleaner(TRAIN))
    assert out["income_missing"].tolist() == [1, 0], f"결측 표시: {out.get('income_missing')}"
    assert out["age"].tolist()[0] == 31 and out[["age", "income"]].isna().sum().sum() == 0

@test("apply_cleaner: 소득을 학습용 울타리로 자른다")
def _():
    p = fit_cleaner(TRAIN)
    out = apply_cleaner(TEST, p)
    assert approx(out["income"].tolist()[1], p["income_high"]), f"결과: {out['income'].tolist()}"
    assert out["income"].max() <= p["income_high"] + 1e-9

@test("평가용 데이터의 값이 기준에 섞이지 않고, 원래 표는 그대로")
def _():
    p1 = fit_cleaner(TRAIN)
    apply_cleaner(TEST, p1)
    assert TEST["income"].isna().sum() == 1 and TEST["city"].tolist()[0] == " Busan", "원래 평가용 표가 바뀌었습니다."
    assert p1 == fit_cleaner(TRAIN)
`,
    hints: [
      "`q1, q3 = train['income'].quantile([0.25, 0.75])`로 사분위수를 구하고 `iqr = q3 - q1`로 울타리를 계산합니다. 반환값은 `float(...)`로 바꿔 둡니다.",
      "도시는 `out['city'].str.strip().replace({'Seoul': '서울', 'Busan': '부산'})`입니다. 결측 표시 열은 결측을 채우기 **전에** `out['income'].isna().astype(int)`로 만듭니다.",
      "`out['income'] = out['income'].fillna(params['income_median']).clip(params['income_low'], params['income_high'])`처럼 채운 뒤 자릅니다.",
    ],
    solution: py`
import numpy as np
import pandas as pd

train = pd.DataFrame({
    "city": ["서울", "Seoul ", "부산", "Busan", "대구", "서울"],
    "age": [25, 31, np.nan, 47, 38, 29],
    "income": [210, 340, 290, np.nan, 5000, 260],
})
test = pd.DataFrame({"city": [" Busan", "서울"], "age": [np.nan, 52], "income": [np.nan, 9000]})

def fit_cleaner(train):
    q1, q3 = train["income"].quantile([0.25, 0.75])
    iqr = q3 - q1
    return {
        "age_median": float(train["age"].median()),
        "income_median": float(train["income"].median()),
        "income_low": float(q1 - 1.5 * iqr),
        "income_high": float(q3 + 1.5 * iqr),
    }

def apply_cleaner(df, params):
    out = df.copy()
    out["city"] = out["city"].str.strip().replace({"Seoul": "서울", "Busan": "부산"})
    out["income_missing"] = out["income"].isna().astype(int)
    out["age"] = out["age"].fillna(params["age_median"])
    out["income"] = out["income"].fillna(params["income_median"]).clip(params["income_low"], params["income_high"])
    return out

params = fit_cleaner(train)
print(params)
print(apply_cleaner(test, params))
`,
  },
]);
