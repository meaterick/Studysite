import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "열의 유형을 판단하고 문자열 숫자 바꾸기",
    prompt: md`

1. \`kinds\`: 열 이름마다 본문 표의 유형 중 하나를 적은 딕셔너리입니다. \`"연속형"\`, \`"이산형"\`, \`"명목형"\`, \`"순서형"\`, \`"시계열"\` 중에서 고릅니다.
   - \`price\`(상품 가격), \`zip\`(우편번호), \`size\`(옷 크기 S·M·L), \`signup\`(가입일), \`visits\`(방문 횟수)
2. \`prices\`: 문자열 Series \`raw_price\`에서 쉼표를 지우고 숫자로 바꾼 Series. 바꿀 수 없는 값은 결측값으로 만듭니다.
3. \`n_missing\`: \`prices\`의 결측값 개수(정수)
`,
    starter: py`
import pandas as pd

kinds = {"price": None, "zip": None, "size": None, "signup": None, "visits": None}   # TODO

raw_price = pd.Series(["1,200", "N/A", "300", "1,050"])
prices = None      # TODO
n_missing = None   # TODO

print(kinds)
print(prices.tolist() if prices is not None else None, n_missing)
`,
    tests: py`
@test("열의 유형")
def _():
    want = {"price": "연속형", "zip": "명목형", "size": "순서형", "signup": "시계열", "visits": "이산형"}
    wrong = [k for k in want if kinds.get(k) != want[k]]
    assert not wrong, f"다시 판단할 열: {wrong}"

@test("쉼표를 지우고 숫자로")
def _():
    assert prices is not None, "prices를 계산하십시오."
    got = prices.tolist()
    assert got[0] == 1200 and got[2] == 300 and got[3] == 1050, f"결과: {got}"
    assert pd.isna(got[1]), "N/A는 결측값이어야 합니다."

@test("결측값 1개")
def _():
    assert n_missing == 1, f"결과: {n_missing}"
`,
    hints: [
      "우편번호는 숫자로 적혀 있어도 크기나 평균에 뜻이 없으니 명목형입니다. 방문 횟수는 정수 값만 가지는 수치입니다.",
      "`pd.to_numeric(raw_price.str.replace(\",\", \"\"), errors=\"coerce\")`로 바꾸고, `int(prices.isna().sum())`으로 셉니다.",
    ],
    solution: py`
import pandas as pd

kinds = {"price": "연속형", "zip": "명목형", "size": "순서형", "signup": "시계열", "visits": "이산형"}

raw_price = pd.Series(["1,200", "N/A", "300", "1,050"])
prices = pd.to_numeric(raw_price.str.replace(",", ""), errors="coerce")
n_missing = int(prices.isna().sum())

print(kinds)
print(prices.tolist() if prices is not None else None, n_missing)
`,
  },
  {
    key: "ex1",
    title: "문자열로 읽힌 열을 알맞은 자료형으로 바꾸기",
    prompt: md`

CSV를 기본 설정으로 읽어 가격·크기·가입일이 문자열인 표 \`raw\`가 주어집니다.

1. \`clean_types(raw)\`: 다음처럼 바꾼 **복사본**을 돌려줍니다.
   - \`price\`: 쉼표를 지우고 숫자로 바꿉니다. 숫자로 바꿀 수 없는 값은 결측값(\`errors="coerce"\`)
   - \`plan\`: \`category\` 자료형
   - \`size\`: 순서가 \`S < M < L\`인 순서형 범주
   - \`signup\`: 날짜(\`format="%Y-%m-%d"\`)
2. \`coerced_count(before, after)\`: 변환 전에는 결측이 아니었는데 변환 뒤 결측이 된 값의 개수. 형식 오류로 사라진 값을 셉니다.
3. \`signup_features(df)\`: \`clean_types\`의 결과에 \`signup_month\`(월), \`signup_dow\`(요일, 월요일 0), \`days_since_first\`(가장 이른 가입일로부터 지난 일수) 열을 더한 복사본
`,
    starter: py`
import io
import pandas as pd

CSV = """user_id,plan,size,price,signup
101,basic,M,"1,200",2024-01-15
102,pro,L,"3,500",2024-02-03
103,basic,S,N/A,2024-02-20
104,free,M,무료,2024-03-01
"""
raw = pd.read_csv(io.StringIO(CSV))

def clean_types(raw):
    df = raw.copy()
    # TODO: price, plan, size, signup의 자료형을 바꿉니다.
    return df

def coerced_count(before, after):
    # TODO: before.notna() & after.isna() 인 값의 개수
    return 0

def signup_features(df):
    out = df.copy()
    # TODO: .dt.month, .dt.dayofweek, (signup - signup.min()).dt.days
    return out

clean = clean_types(raw)
print(clean.dtypes)
print(coerced_count(raw["price"], clean["price"]))     # 기대: 1 ("무료"가 결측이 됨, N/A는 원래 결측)
print(signup_features(clean))
`,
    tests: py`
import io
import pandas as pd

CSV = """user_id,plan,size,price,signup
101,basic,M,"1,200",2024-01-15
102,pro,L,"3,500",2024-02-03
103,basic,S,N/A,2024-02-20
104,free,M,무료,2024-03-01
"""
R = pd.read_csv(io.StringIO(CSV))

@test("price: 숫자 열, [1200, 3500, NaN, NaN]")
def _():
    c = clean_types(R)
    assert pd.api.types.is_numeric_dtype(c["price"]), f"자료형: {c['price'].dtype}"
    assert c["price"].iloc[:2].tolist() == [1200, 3500] and c["price"].iloc[2:].isna().all(), f"결과: {c['price'].tolist()}"

@test("plan은 category, size는 S < M < L 순서형")
def _():
    c = clean_types(R)
    assert isinstance(c["plan"].dtype, pd.CategoricalDtype), f"plan 자료형: {c['plan'].dtype}"
    assert isinstance(c["size"].dtype, pd.CategoricalDtype) and c["size"].cat.ordered, f"size 자료형: {c['size'].dtype}"
    assert list(c["size"].cat.categories) == ["S", "M", "L"] and (c["size"] > "S").tolist() == [True, True, False, True]

@test("signup은 날짜 자료형, 원래 raw는 그대로")
def _():
    c = clean_types(R)
    assert pd.api.types.is_datetime64_any_dtype(c["signup"]), f"자료형: {c['signup'].dtype}"
    assert not pd.api.types.is_datetime64_any_dtype(R["signup"]), "원래 표가 바뀌었습니다."

@test("coerced_count: 형식 오류로 사라진 값 1개")
def _():
    c = clean_types(R)
    assert coerced_count(R["price"], c["price"]) == 1, f"결과: {coerced_count(R['price'], c['price'])}"

@test("signup_features: 월 [1, 2, 2, 3], 요일 [0, 5, 1, 4], 경과 일수 [0, 19, 36, 46]")
def _():
    f = signup_features(clean_types(R))
    assert f["signup_month"].tolist() == [1, 2, 2, 3], f"월: {f['signup_month'].tolist()}"
    assert f["signup_dow"].tolist() == [0, 5, 1, 4], f"요일: {f['signup_dow'].tolist()}"
    assert f["days_since_first"].tolist() == [0, 19, 36, 46], f"경과 일수: {f['days_since_first'].tolist()}"
`,
    hints: [
      "가격은 `pd.to_numeric(df['price'].str.replace(',', ''), errors='coerce')`입니다. 결측값(N/A)은 `str.replace`를 거쳐도 결측으로 남습니다.",
      "순서형은 `df['size'].astype(pd.CategoricalDtype(['S', 'M', 'L'], ordered=True))`, 날짜는 `pd.to_datetime(df['signup'], format='%Y-%m-%d')`입니다.",
      "`coerced_count`는 `int((before.notna() & after.isna()).sum())`입니다.",
    ],
    solution: py`
import io
import pandas as pd

CSV = """user_id,plan,size,price,signup
101,basic,M,"1,200",2024-01-15
102,pro,L,"3,500",2024-02-03
103,basic,S,N/A,2024-02-20
104,free,M,무료,2024-03-01
"""
raw = pd.read_csv(io.StringIO(CSV))

def clean_types(raw):
    df = raw.copy()
    df["price"] = pd.to_numeric(df["price"].str.replace(",", ""), errors="coerce")
    df["plan"] = df["plan"].astype("category")
    df["size"] = df["size"].astype(pd.CategoricalDtype(["S", "M", "L"], ordered=True))
    df["signup"] = pd.to_datetime(df["signup"], format="%Y-%m-%d")
    return df

def coerced_count(before, after):
    return int((before.notna() & after.isna()).sum())

def signup_features(df):
    out = df.copy()
    out["signup_month"] = out["signup"].dt.month
    out["signup_dow"] = out["signup"].dt.dayofweek
    out["days_since_first"] = (out["signup"] - out["signup"].min()).dt.days
    return out

clean = clean_types(raw)
print(clean.dtypes)
print(coerced_count(raw["price"], clean["price"]))
print(signup_features(clean))
`,
  },
]);
