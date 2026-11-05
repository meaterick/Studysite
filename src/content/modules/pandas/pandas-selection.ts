import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/pandas-selection";

export default defineLesson({
  id: "pandas-selection",
  title: "데이터 불러오기, 조회, 필터링, 정렬",
  tier: "core",
  concepts: ["pandas-selection"],
  goal: "CSV를 읽으며 결측 표기를 지정하고, loc과 iloc으로 행·열을 고르며, 여러 조건으로 행을 필터링하고 정렬한 뒤, 필터링 결과에 값을 안전하게 대입한다.",
  why: "학습 데이터를 만들 때는 파일을 읽어 필요한 열만 고르고, 조건에 맞는 샘플만 남기고, 시간 순서로 정렬해 나눈다([[lesson:data-splits]]). 모델이 틀린 샘플만 골라 원인을 살피는 오류 분석도 이 레슨의 필터링으로 한다([[lesson:classification-metrics]]).",
  body: md`
### CSV 파일 읽기

\`pd.read_csv\`는 CSV 파일을 DataFrame으로 읽는다([[lesson:file-io]]). 파일 경로 대신 \`io.StringIO\`로 문자열을 넘기면 파일 없이 연습할 수 있다. 데이터마다 결측값을 적는 방법이 달라서(빈칸, \`-\`, \`N/A\` 등) \`na_values\`로 결측 표기를 알려 준다.

\`\`\`python
import io
import pandas as pd

csv = """order_id,city,product,price,qty,status
1001,Seoul,pen,1500,3,paid
1002,Busan,note,3000,,paid
1003,Seoul,bag,25000,1,cancel
1004,Incheon,pen,1500,10,paid
1005,Busan,bag,25000,2,paid
1006,Seoul,note,3000,5,-
"""
df = pd.read_csv(io.StringIO(csv), na_values=["-"])
print(df)
print(df.isna().sum())          # 열마다 결측값의 개수: qty 1, status 1
\`\`\`

빈칸은 기본으로 결측값 \`NaN\`이 되고, \`-\`는 \`na_values\`로 지정해서 결측값이 되었다. \`qty\` 열은 정수만 있었지만 \`NaN\`이 섞여 실수(\`float64\`)가 되었다. NumPy의 정수 배열은 \`NaN\`을 담을 수 없기 때문이다. 그 밖에 자주 쓰는 인자는 구분자 \`sep\`(예: 탭은 \`"\t"\`), 읽을 열 \`usecols\`, 읽을 행 수 \`nrows\`, 문자 인코딩 \`encoding\`이다.

### 열 고르기, loc과 iloc

열은 \`df["열"]\`이나 \`df[["열1", "열2"]]\`로 고른다([[lesson:dataframes]]). 행과 열을 함께 고를 때는 두 가지 방법이 있다.

- \`df.loc[행 이름, 열 이름]\`: **인덱스의 이름**으로 고른다. 슬라이스 \`1:3\`은 **끝을 포함**한다.
- \`df.iloc[행 위치, 열 위치]\`: 0부터 세는 **위치**로 고른다. 슬라이스 \`1:3\`은 리스트처럼 끝을 포함하지 않는다.

\`\`\`python
print(df.loc[2, "product"], df.iloc[0, 1])     # bag Seoul
print(df.loc[1:3, ["city", "price"]])          # 이름 1, 2, 3인 행(끝 포함)
print(df.iloc[1:3, 1:3])                       # 위치 1, 2인 행과 열(끝 미포함)

by_id = df.set_index("order_id")               # 주문 번호를 인덱스로
print(by_id.loc[1004, "city"])                 # Incheon: 이름으로 찾는다
\`\`\`

처음 읽은 표는 인덱스가 0, 1, 2, …라서 \`loc\`과 \`iloc\`의 결과가 같아 보이지만, 정렬이나 필터링을 하면 인덱스 이름과 위치가 달라진다. 이름으로 찾을지 위치로 찾을지 정해서 쓴다.

### 조건으로 행 고르기

bool Series를 \`df[...]\`에 넣으면 \`True\`인 행만 남는다. NumPy의 불리언 마스킹과 같고, 여러 조건은 \`&\`, \`|\`, \`~\`로 묶어 조건마다 괄호를 씌운다([[lesson:array-indexing]]).

\`\`\`python
print(df[df["city"] == "Seoul"])                              # 서울 주문만
print(df[(df["price"] >= 3000) & (df["status"] == "paid")])   # 3000원 이상이면서 결제된 주문
print(df[df["city"].isin(["Busan", "Incheon"])]["order_id"].tolist())   # [1002, 1004, 1005]
print(df[df["qty"].between(2, 5)]["order_id"].tolist())                 # [1001, 1005, 1006]: 2 이상 5 이하
\`\`\`

\`isin\`은 여러 값 중 하나인지, \`between\`은 범위 안인지를 확인한다. 문자열 열은 \`df["city"].str.startswith("S")\`처럼 \`.str\`로 문자열 메서드를 쓸 수 있다. 결측값은 어떤 비교에서도 \`False\`라서, \`qty\`가 결측인 1002번 주문은 \`between\` 결과에 들어가지 않았다.

### 정렬

\`sort_values\`는 열의 값으로 행을 정렬한다. 여러 열을 주면 앞의 열부터 차례로 기준이 되고, \`ascending\`으로 열마다 방향을 정한다.

\`\`\`python
print(df.sort_values("qty", ascending=False)[["order_id", "qty"]])     # 수량이 많은 순, 결측은 맨 뒤
print(df.sort_values(["city", "price"], ascending=[True, False])[["order_id", "city", "price"]])
print(df.nlargest(2, "qty")[["order_id", "qty"]])                       # 수량 상위 2개
\`\`\`

정렬 기준 값이 같은 행끼리의 순서는 기본 정렬 방법에서 보장되지 않는다. 원래 순서를 유지해야 하면 \`kind="stable"\`을 쓴다. 정렬하거나 필터링한 뒤의 인덱스는 원래 이름을 그대로 가지므로, 0부터 다시 번호를 매기려면 \`reset_index(drop=True)\`를 쓴다.

### 고른 행에 값을 대입하기

조건에 맞는 행의 값을 바꿀 때는 \`df.loc[조건, 열] = 값\`처럼 **한 번의 \`loc\`**으로 행과 열을 함께 지정한다.

\`\`\`python
df.loc[df["status"].isna(), "status"] = "unknown"     # 결측인 상태를 "unknown"으로
print(df["status"].tolist())

seoul = df[df["city"] == "Seoul"].copy()              # 따로 다룰 부분 표는 copy()로 만든다
seoul["qty"] = seoul["qty"].fillna(0)
\`\`\`

\`df[df["city"] == "Seoul"]["qty"] = 0\`처럼 고르기를 두 번 이어서 대입하면, 중간 결과가 복사본이라 원래 \`df\`가 바뀌지 않는다. pandas 2에서는 이때 \`SettingWithCopyWarning\` 경고가 나오고, pandas 3에서는 이렇게 이어 쓴 대입이 원래 표를 바꾸지 않는 것으로 동작이 정해졌다. 어느 쪽이든 원래 표를 바꾸려면 한 번의 \`loc\`을 쓰고, 부분 표를 따로 고칠 때는 \`copy()\`로 만든다.

:::warn 흔한 실수
- **\`loc\`의 슬라이스가 끝을 포함한다는 것을 잊는다.** \`df.loc[1:3]\`은 이름이 1, 2, 3인 행이고 \`df.iloc[1:3]\`은 위치 1, 2인 행이다.
- **조건을 \`and\`, \`or\`로 묶거나 괄호를 빠뜨린다.** \`(df["a"] > 1) & (df["b"] < 5)\`처럼 쓴다.
- **고르기를 이어 쓴 대입으로 값을 바꾼다.** \`df.loc[조건, 열] = 값\` 한 번으로 바꾼다.
- **필터링한 표의 인덱스가 0부터라고 가정한다.** 원래 인덱스 이름이 남아 있으므로 \`iloc\`을 쓰거나 \`reset_index(drop=True)\`를 한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "인덱스가 0, 1, 2, 3, 4인 DataFrame에서 `df.loc[1:3]`과 `df.iloc[1:3]`이 고르는 행의 수는?",
      choices: ["3개와 2개", "2개와 2개", "3개와 3개", "2개와 3개"],
      answer: 0,
      explanation: "`loc`은 이름으로 고르고 슬라이스의 끝(3)을 포함하므로 1, 2, 3의 세 행이다. `iloc`은 위치로 고르고 끝을 포함하지 않으므로 위치 1, 2의 두 행이다.",
    },
    {
      key: "c2",
      question: "CSV에서 정수만 있는 열에 빈칸이 하나 있으면 `read_csv`로 읽은 그 열의 자료형은?",
      choices: ["`float64`", "`int64`", "`object`", "`bool`"],
      answer: 0,
      explanation: "빈칸은 결측값 NaN이 되고, NumPy의 정수 배열은 NaN을 담을 수 없어 열 전체가 실수가 된다.",
    },
    {
      key: "c3",
      question: "`city`가 Seoul 또는 Busan이고 `price`가 10000 미만인 행을 고르는 코드는?",
      choices: [
        "`df[df['city'].isin(['Seoul', 'Busan']) & (df['price'] < 10000)]`",
        "`df[df['city'] == 'Seoul' or 'Busan' and df['price'] < 10000]`",
        "`df[(df['city'] == ['Seoul', 'Busan']) | (df['price'] < 10000)]`",
        "`df.loc['Seoul', 'Busan', df['price'] < 10000]`",
      ],
      answer: 0,
      explanation: "여러 값 중 하나인지는 `isin`으로, 두 조건은 `&`로 묶는다. 비교식은 괄호로 감싼다.",
    },
    {
      key: "c4",
      question: "`status`가 결측인 행의 `status`를 \"unknown\"으로 바꾸는 올바른 코드는?",
      choices: [
        "`df.loc[df['status'].isna(), 'status'] = 'unknown'`",
        "`df[df['status'].isna()]['status'] = 'unknown'`",
        "`df['status'].isna() = 'unknown'`",
        "`df.iloc[df['status'].isna(), 'status'] = 'unknown'`",
      ],
      answer: 0,
      explanation: "한 번의 `loc`으로 행 조건과 열을 함께 지정해야 원래 표가 바뀐다. 두 번째 코드는 복사본에 대입해 원래 표가 바뀌지 않는다. `iloc`에는 열 이름을 쓸 수 없다.",
    },
    {
      key: "c5",
      question: "`df.sort_values(['city', 'price'], ascending=[True, False])`의 정렬 결과로 옳은 것은?",
      choices: [
        "도시 이름의 오름차순으로 정렬하고, 같은 도시 안에서는 가격의 내림차순으로 정렬한다",
        "가격의 내림차순으로 정렬하고, 같은 가격 안에서는 도시 이름의 오름차순으로 정렬한다",
        "도시와 가격을 각각 따로 정렬한다",
        "오류가 난다",
      ],
      answer: 0,
      explanation: "앞에 적은 열이 먼저 기준이 되고, 같은 값끼리는 다음 열로 정렬한다. `ascending`은 열마다 방향을 정한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import pandas as pd
df = pd.DataFrame({"x": [5, 3, 8, 1]}, index=[10, 20, 30, 40])
s = df.sort_values("x")
print(s.index.tolist(), s.loc[20, "x"], s.iloc[0, 0])
`,
      expected: "[40, 20, 10, 30] 3 1",
      explanation: "정렬해도 행은 원래 인덱스 이름을 그대로 가진다. `loc[20]`은 이름이 20인 행(값 3)이고, `iloc[0]`은 정렬된 뒤 첫 위치의 행(이름 40, 값 1)이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "`loc`과 `iloc`의 차이를 쓰고, 필터링이나 정렬을 한 뒤 두 방법의 결과가 달라지는 이유를 예를 들어 설명하라. 조건에 맞는 행의 값을 바꿀 때 어떤 방식으로 써야 하는지도 쓰라.",
      answer: md`
\`loc\`은 인덱스의 **이름**으로, \`iloc\`은 0부터 세는 **위치**로 행과 열을 고른다. \`loc\`의 슬라이스는 끝을 포함하고 \`iloc\`의 슬라이스는 포함하지 않는다.

처음 읽은 표는 인덱스가 0, 1, 2, …라 이름과 위치가 같지만, 필터링이나 정렬을 하면 행은 원래 이름을 유지한 채 위치만 바뀐다. 예를 들어 인덱스 0~5인 표에서 서울 주문만 고르면 인덱스가 [0, 2, 5]인 표가 되고, \`loc[2]\`는 원래 2번 행이지만 \`iloc[2]\`는 세 번째 행인 원래 5번 행이다.

조건에 맞는 행의 값을 바꿀 때는 \`df.loc[조건, 열] = 값\`처럼 한 번의 \`loc\`으로 행과 열을 함께 지정한다. \`df[조건][열] = 값\`처럼 이어 쓰면 중간 결과가 복사본이라 원래 표가 바뀌지 않는다.
`,
      keyPoints: ["loc: 이름, 끝 포함 / iloc: 위치, 끝 미포함", "필터링·정렬 뒤에는 인덱스 이름과 위치가 달라진다", "구체적인 예로 차이를 보였다", "값 바꾸기는 df.loc[조건, 열] = 값 한 번으로"],
    },
  ],
  references: [
    { title: "pandas — Indexing and selecting data", url: "https://pandas.pydata.org/docs/user_guide/indexing.html", note: "loc·iloc·불리언 인덱싱과 대입 (영문)" },
    { title: "pandas — IO tools: CSV", url: "https://pandas.pydata.org/docs/user_guide/io.html#io-read-csv-table", note: "read_csv의 인자와 결측 표기 (영문)" },
  ],
});
