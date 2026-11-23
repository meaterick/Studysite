import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "품질 점검 항목을 하나씩 세기",
    prompt: md`

사용자 표 \`df\`에 대해 본문의 점검 순서대로 값을 구합니다.

1. \`n_rows\`: 행 수
2. \`missing\`: 열마다 결측 개수 딕셔너리(결측이 없는 열도 0으로 포함)
3. \`full_dup\`: 행 전체가 같은 중복의 수
4. \`key_dup\`: \`user_id\` 기준 중복의 수
5. \`bad_age\`: 나이가 0 이하이거나 120 초과인 값의 개수(결측은 세지 않음)
`,
    starter: py`
import numpy as np
import pandas as pd

df = pd.DataFrame({
    "user_id": [1, 2, 3, 3, 4, 5],
    "age": [25, 0, 41, 41, np.nan, 150],
    "plan": ["free", "pro", "free", "free", "basic", None],
})

n_rows = None     # TODO
missing = None    # TODO
full_dup = None   # TODO
key_dup = None    # TODO
bad_age = None    # TODO

print(n_rows, missing, full_dup, key_dup, bad_age)
`,
    tests: py`
@test("행 수와 결측")
def _():
    assert n_rows == 6, f"n_rows: {n_rows}"
    assert missing == {"user_id": 0, "age": 1, "plan": 1}, f"missing: {missing}"

@test("중복: 행 전체 1개, user_id 1개")
def _():
    assert full_dup == 1 and key_dup == 1, f"full_dup: {full_dup}, key_dup: {key_dup}"

@test("범위를 벗어난 나이 2개")
def _():
    assert bad_age == 2, f"bad_age: {bad_age} — 0과 150입니다. 결측은 비교에서 False입니다."
`,
    hints: [
      "`len(df)`, `df.isna().sum().to_dict()`, `df.duplicated().sum()`, `df[\"user_id\"].duplicated().sum()`을 씁니다.",
      "`((df[\"age\"] <= 0) | (df[\"age\"] > 120)).sum()`입니다. 결측은 어떤 비교에서도 `False`라 세어지지 않습니다.",
    ],
    solution: py`
import numpy as np
import pandas as pd

df = pd.DataFrame({
    "user_id": [1, 2, 3, 3, 4, 5],
    "age": [25, 0, 41, 41, np.nan, 150],
    "plan": ["free", "pro", "free", "free", "basic", None],
})

n_rows = len(df)
missing = df.isna().sum().to_dict()
full_dup = df.duplicated().sum()
key_dup = df["user_id"].duplicated().sum()
bad_age = ((df["age"] <= 0) | (df["age"] > 120)).sum()

print(n_rows, missing, full_dup, key_dup, bad_age)
`,
  },
  {
    key: "ex1",
    title: "품질 점검표와 누수 후보를 자동으로 만들기",
    prompt: md`

데이터를 받을 때마다 같은 점검을 반복하지 않도록 함수로 만듭니다.

1. \`quality_report(df, key, ranges)\`: 다음 항목을 담은 딕셔너리를 돌려줍니다.
   - \`"rows"\`: 행 수
   - \`"missing"\`: 결측이 하나 이상 있는 열만, \`{열 이름: 결측 개수}\`
   - \`"full_duplicates"\`: 행 전체가 같은 중복의 수
   - \`"key_duplicates"\`: \`key\` 열 기준 중복의 수
   - \`"out_of_range"\`: \`ranges\`(\`{열 이름: (최솟값, 최댓값)}\`)의 열마다 범위를 벗어난 값의 개수. 결측은 세지 않습니다.
2. \`leakage_candidates(df, target, threshold=0.8)\`: 목표 변수 \`target\`을 제외한 수치형 열 중 목표 변수와의 상관계수의 절댓값이 \`threshold\`보다 큰 열 이름의 리스트(상관이 큰 순서)
`,
    starter: py`
import numpy as np
import pandas as pd

df = pd.DataFrame({
    "user_id": [1, 2, 3, 3, 4, 5, 6, 6],
    "age": [25, 0, 41, 41, 33, 150, np.nan, 29],
    "sessions": [3, 8, 6, 6, 9, 1, 4, 5],
    "refund": [5000, 0, 7000, 7000, 0, 6000, 0, 0],
    "churned": [1, 0, 1, 1, 0, 1, 0, 0],
})

def quality_report(df, key, ranges):
    # TODO: 행 수, 결측, 전체 중복, 키 중복, 범위 밖 개수
    return {"rows": 0, "missing": {}, "full_duplicates": 0, "key_duplicates": 0, "out_of_range": {}}

def leakage_candidates(df, target, threshold=0.8):
    # TODO: 수치형 열의 target과의 상관계수를 구해 절댓값이 threshold보다 큰 열을 고릅니다.
    return []

print(quality_report(df, "user_id", {"age": (1, 120), "sessions": (0, 100)}))
print(leakage_candidates(df, "churned"))      # 기대: ['refund']
`,
    tests: py`
import numpy as np
import pandas as pd

D = pd.DataFrame({
    "user_id": [1, 2, 3, 3, 4, 5, 6, 6],
    "age": [25, 0, 41, 41, 33, 150, np.nan, 29],
    "sessions": [3, 8, 6, 6, 9, 1, 4, 5],
    "refund": [5000, 0, 7000, 7000, 0, 6000, 0, 0],
    "churned": [1, 0, 1, 1, 0, 1, 0, 0],
})
R = quality_report(D, "user_id", {"age": (1, 120), "sessions": (0, 100)})

@test("rows = 8, missing = {'age': 1}")
def _():
    assert R["rows"] == 8 and R["missing"] == {"age": 1}, f"결과: {R}"

@test("전체 중복 1개, 키 중복 2개")
def _():
    assert R["full_duplicates"] == 1 and R["key_duplicates"] == 2, f"결과: {R}"

@test("범위 밖: age 2개(0, 150), sessions 0개, 결측은 세지 않는다")
def _():
    assert R["out_of_range"] == {"age": 2, "sessions": 0}, f"결과: {R['out_of_range']}"

@test("누수 후보: refund만 (sessions의 상관은 약 −0.51)")
def _():
    got = leakage_candidates(D, "churned")
    assert got == ["refund"], f"결과: {got}"

@test("기준을 낮추면 상관이 큰 순서로 여러 개")
def _():
    got = leakage_candidates(D, "churned", threshold=0.5)
    assert got == ["refund", "sessions"], f"결과: {got}"

@test("문자열 열이 있어도 수치형 열만 본다")
def _():
    E = D.assign(plan=["a", "b", "a", "a", "c", "b", "a", "c"])
    assert leakage_candidates(E, "churned") == ["refund"]
`,
    hints: [
      "결측은 `s = df.isna().sum()` 다음 `{k: int(v) for k, v in s.items() if v > 0}`, 중복은 `int(df.duplicated().sum())`와 `int(df.duplicated(subset=[key]).sum())`입니다.",
      "범위 밖 개수는 `col = df[name].dropna()` 다음 `int(((col < lo) | (col > hi)).sum())`입니다.",
      "`corr = df.select_dtypes('number').drop(columns=[target]).corrwith(df[target]).abs()` 다음 기준보다 큰 것만 남겨 `sort_values(ascending=False).index.tolist()`입니다.",
    ],
    solution: py`
import numpy as np
import pandas as pd

df = pd.DataFrame({
    "user_id": [1, 2, 3, 3, 4, 5, 6, 6],
    "age": [25, 0, 41, 41, 33, 150, np.nan, 29],
    "sessions": [3, 8, 6, 6, 9, 1, 4, 5],
    "refund": [5000, 0, 7000, 7000, 0, 6000, 0, 0],
    "churned": [1, 0, 1, 1, 0, 1, 0, 0],
})

def quality_report(df, key, ranges):
    missing = df.isna().sum()
    out_of_range = {}
    for name, (lo, hi) in ranges.items():
        col = df[name].dropna()
        out_of_range[name] = int(((col < lo) | (col > hi)).sum())
    return {
        "rows": len(df),
        "missing": {k: int(v) for k, v in missing.items() if v > 0},
        "full_duplicates": int(df.duplicated().sum()),
        "key_duplicates": int(df.duplicated(subset=[key]).sum()),
        "out_of_range": out_of_range,
    }

def leakage_candidates(df, target, threshold=0.8):
    numeric = df.select_dtypes("number").drop(columns=[target])
    corr = numeric.corrwith(df[target]).abs()
    return corr[corr > threshold].sort_values(ascending=False).index.tolist()

print(quality_report(df, "user_id", {"age": (1, 120), "sessions": (0, 100)}))
print(leakage_candidates(df, "churned"))
`,
  },
]);
