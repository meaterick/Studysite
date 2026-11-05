import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/data-types";

export default defineLesson({
  id: "data-types",
  title: "수치형·범주형·시계열 데이터",
  tier: "core",
  concepts: ["data-types"],
  goal: "열마다 수치형(연속·이산), 범주형(명목·순서), 시계열, 텍스트 중 어느 유형인지 판단하고, 문자열로 읽힌 숫자·범주·날짜를 알맞은 pandas 자료형으로 바꾸며, 날짜에서 요일·경과 일수 같은 값을 꺼낸다.",
  why: "열의 유형에 따라 전처리가 달라진다. 수치형은 크기를 맞추고, 범주형은 숫자로 인코딩하며([[lesson:encoding-scaling]]), 시계열은 시간 순서대로 데이터를 나눠야 한다([[lesson:data-splits]]). 유형을 잘못 판단하면 우편번호의 평균처럼 의미 없는 값을 모델에 넣게 된다.",
  body: md`
### 데이터의 유형

같은 숫자처럼 보여도 의미에 따라 다룰 수 있는 계산이 다르다.

| 유형 | 예 | 의미 있는 계산 |
| --- | --- | --- |
| 연속형 수치 | 키, 가격, 온도 | 평균, 차이, 비율 |
| 이산형 수치 | 방문 횟수, 자녀 수 | 평균, 합 (정수 값만 가짐) |
| 명목형 범주 | 요금제, 도시, 우편번호, 사용자 ID | 개수, 최빈값 (순서 없음) |
| 순서형 범주 | 옷 크기 S·M·L, 만족도 1~5 | 순서 비교, 중앙값 (간격은 같지 않을 수 있음) |
| 시계열 | 가입일, 주문 시각 | 순서, 기간, 요일·월 같은 주기 |
| 텍스트 | 리뷰, 상품 설명 | 토큰화 후 분석([[lesson:tokenization]]) |

**숫자로 적혀 있다고 수치형인 것은 아니다.** 우편번호 04524와 48058의 평균은 아무 뜻이 없고, 사용자 ID가 크다고 더 중요한 사용자도 아니다. 이런 열은 명목형 범주로 다룬다. 만족도 1~5는 순서는 있지만 "5는 1보다 5배 만족한다"는 뜻은 아니므로 순서형이다.

### 읽을 때 생기는 자료형 문제

CSV는 모든 값이 글자라서, pandas는 열의 값을 보고 자료형을 추측한다. 추측이 틀리는 경우가 흔하다.

\`\`\`python
import io
import pandas as pd

csv = """user_id,zip,signup,plan,size,price,satisfaction
101,04524,2024-01-15,basic,M,"1,200",4
102,48058,2024-02-03,pro,L,"3,500",5
103,04524,2024-02-20,basic,S,N/A,3
104,61452,2024-03-01,free,M,0,2
"""
print(pd.read_csv(io.StringIO(csv))["zip"].tolist())       # [4524, 48058, 4524, 61452]: 앞의 0이 사라졌다
df = pd.read_csv(io.StringIO(csv), dtype={"zip": str})      # 우편번호는 문자열로 읽는다
print(df.dtypes)
\`\`\`

우편번호를 숫자로 읽으면 앞의 0이 사라지므로 \`dtype={"zip": str}\`로 문자열임을 지정한다. 가격은 천 단위 쉼표 때문에, 날짜는 형식을 알려 주지 않았기 때문에 문자열(pandas 2에서는 \`object\`)로 읽혔다.

### 숫자로 바꾸기

\`pd.to_numeric\`은 문자열을 숫자로 바꾼다. \`errors="coerce"\`를 주면 숫자로 바꿀 수 없는 값을 오류 대신 결측값으로 만든다. 바꾼 뒤에는 새로 생긴 결측값이 원래 결측이었는지, 형식 오류였는지 확인한다.

\`\`\`python
df["price"] = pd.to_numeric(df["price"].str.replace(",", ""), errors="coerce")   # 쉼표를 지우고 숫자로
print(df["price"].tolist(), df["price"].dtype)       # [1200.0, 3500.0, nan, 0.0] float64
\`\`\`

### 범주형으로 바꾸기

값의 종류가 정해진 열은 \`category\` 자료형으로 바꾼다. 같은 문자열을 반복해 저장하는 대신 범주 목록과 정수 코드로 저장하므로 메모리가 줄고, 가능한 범주가 명시된다. 순서형 범주는 순서를 지정한 \`CategoricalDtype\`으로 만들면 크기 비교가 된다.

\`\`\`python
df["plan"] = df["plan"].astype("category")
print(df["plan"].cat.categories.tolist())                     # ['basic', 'free', 'pro']: 범주 목록

size_type = pd.CategoricalDtype(["S", "M", "L"], ordered=True) # S < M < L
df["size"] = df["size"].astype(size_type)
print((df["size"] >= "M").tolist(), df["size"].cat.codes.tolist())   # [True, True, False, True] [1, 2, 0, 1]
\`\`\`

순서형의 정수 코드(S → 0, M → 1, L → 2)는 순서를 담은 인코딩으로 쓸 수 있지만, 명목형 범주에 정수를 붙이면 모델이 없는 순서를 학습할 수 있다. 명목형은 원-핫 인코딩 같은 다른 방법을 쓴다([[lesson:encoding-scaling]]).

### 날짜와 시각

\`pd.to_datetime\`으로 바꾼 열은 \`datetime64\` 자료형이 되고, \`.dt\`로 연·월·요일·시각을 꺼내거나 두 날짜의 차이를 계산할 수 있다. 날짜 문자열의 형식이 정해져 있으면 \`format="%Y-%m-%d"\`처럼 지정하는 것이 빠르고 안전하다.

\`\`\`python
df["signup"] = pd.to_datetime(df["signup"], format="%Y-%m-%d")
print(df["signup"].dt.month.tolist())                          # [1, 2, 2, 3]
print(df["signup"].dt.dayofweek.tolist())                      # [0, 5, 1, 4]: 월요일이 0
print((df["signup"] - df["signup"].min()).dt.days.tolist())    # [0, 19, 36, 46]: 첫 가입일로부터 지난 일수
\`\`\`

날짜 자체는 모델에 그대로 넣기 어렵다. 요일, 월, 경과 일수처럼 의미 있는 값으로 바꿔 특성으로 쓴다([[lesson:feature-engineering]]). 시간 순서가 있는 데이터는 무작위로 섞어 나누면 미래의 정보로 과거를 예측하게 되므로, 과거 구간으로 학습하고 이후 구간으로 평가한다([[lesson:data-splits]]).

:::warn 흔한 실수
- **숫자로 적힌 범주를 수치형으로 쓴다.** 우편번호, ID, 상품 코드의 평균과 크기 비교는 의미가 없다.
- **\`errors="coerce"\`로 생긴 결측값을 확인하지 않는다.** 형식 오류가 결측값으로 바뀌어 조용히 사라질 수 있다. 변환 전후의 결측 수를 비교한다.
- **명목형 범주에 0, 1, 2를 붙여 그대로 모델에 넣는다.** 모델은 숫자의 크기 순서를 의미 있는 것으로 학습한다.
- **시간 순서가 있는 데이터를 무작위로 나눈다.** 미래의 정보가 학습에 섞여 평가 성능이 실제보다 좋게 나온다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "다음 중 명목형 범주로 다뤄야 하는 열은?",
      choices: ["우편번호", "월 소득", "방문 횟수", "온도"],
      answer: 0,
      explanation: "우편번호는 숫자로 적혀 있지만 크기나 평균에 의미가 없는 이름표 역할의 값이라 명목형 범주다. 나머지는 수치형이다.",
    },
    {
      key: "c2",
      question: "만족도(1~5점) 열을 순서형 범주로 보는 이유로 가장 알맞은 것은?",
      choices: [
        "순서는 의미가 있지만 점수 사이의 간격이 같다는 보장이 없기 때문이다",
        "값이 5개뿐이기 때문이다",
        "정수이기 때문이다",
        "평균을 계산할 수 없기 때문이다",
      ],
      answer: 0,
      explanation: "4점이 2점보다 만족도가 높다는 순서는 있지만, 4점이 2점의 두 배만큼 만족한다는 뜻은 아니다. 그래서 중앙값이나 순서 비교가 평균보다 알맞은 경우가 많다.",
    },
    {
      key: "c3",
      question: "`pd.to_numeric(pd.Series(['10', 'x', '3.5']), errors='coerce')`의 결과는?",
      choices: ["`[10.0, NaN, 3.5]`", "오류가 난다", "`[10, 'x', 3.5]`", "`[10.0, 0.0, 3.5]`"],
      answer: 0,
      explanation: "`errors='coerce'`는 숫자로 바꿀 수 없는 값을 결측값으로 만든다. NaN이 있어 결과는 실수 열이다.",
    },
    {
      key: "c4",
      question: "우편번호 열 `zip`을 앞의 0이 사라지지 않게 읽는 방법은?",
      choices: [
        "`pd.read_csv(f, dtype={'zip': str})`",
        "`pd.read_csv(f).astype({'zip': str})`",
        "`pd.read_csv(f, na_values=['0'])`",
        "`pd.to_numeric(df['zip'])`",
      ],
      answer: 0,
      explanation: "읽을 때 문자열로 지정해야 원래 글자가 그대로 남는다. 숫자로 읽은 뒤 문자열로 바꾸면 이미 사라진 0이 돌아오지 않는다.",
    },
    {
      key: "c5",
      question: "주문 시각 데이터로 다음 달 주문량을 예측하는 모델을 평가할 때, 데이터를 나누는 방법으로 알맞은 것은?",
      choices: [
        "과거 구간으로 학습하고 그 이후 구간으로 평가한다",
        "모든 주문을 무작위로 섞어 80:20으로 나눈다",
        "요일별로 나눈다",
        "가장 최근 데이터로 학습하고 오래된 데이터로 평가한다",
      ],
      answer: 0,
      explanation: "실제로 쓸 때는 과거 데이터로 미래를 예측하므로 평가도 같은 순서로 해야 한다. 무작위로 섞으면 미래의 정보가 학습에 섞인다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import pandas as pd
s = pd.Series(["M", "S", "L", "M"]).astype(pd.CategoricalDtype(["S", "M", "L"], ordered=True))
print(s.cat.codes.tolist(), s.max(), (s > "S").sum())
`,
      expected: "[1, 0, 2, 1] L 3",
      explanation: "범주 순서가 S < M < L이므로 정수 코드는 S 0, M 1, L 2다. 순서가 있어 최댓값은 L이고, S보다 큰 값은 M, L, M의 3개다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "고객 데이터에 고객 ID(정수), 우편번호, 가입일, 요금제(basic·pro·free), 월 사용 시간 열이 있다. 각 열의 유형을 판단하고, 모델의 특성으로 쓰기 전에 각각 어떻게 처리할지 쓰라.",
      answer: md`
- **고객 ID**: 숫자지만 명목형이고 값마다 고객이 하나뿐이라 특성으로 쓰지 않는다. 결합과 중복 확인의 키로만 쓴다.
- **우편번호**: 명목형 범주다. 문자열로 읽어 앞의 0을 지키고, 그대로 쓰기보다 지역 단위로 묶거나 범주 인코딩을 한다.
- **가입일**: 시계열이다. \`to_datetime\`으로 바꾼 뒤 가입 후 경과 일수, 가입 월이나 요일 같은 값으로 바꿔 쓴다. 시간 순서가 있으므로 데이터를 나눌 때도 시간 순서를 지킨다.
- **요금제**: 순서가 없는 명목형 범주로 보고 \`category\`로 바꾼 뒤 원-핫 인코딩을 한다. 요금 수준처럼 순서를 쓰고 싶다면 순서형으로 명시한다.
- **월 사용 시간**: 연속형 수치다. 자료형이 숫자인지 확인하고, 이상치와 결측을 점검한 뒤 필요하면 크기를 맞춘다.
`,
      keyPoints: ["고객 ID: 특성이 아니라 키", "우편번호: 문자열로 읽은 명목형 범주", "가입일: 시계열 → 경과 일수·요일 등으로 변환, 시간 순서 분할", "요금제: 명목형 → 범주 인코딩, 사용 시간: 연속형 수치"],
    },
  ],
  references: [
    { title: "pandas — Categorical data", url: "https://pandas.pydata.org/docs/user_guide/categorical.html", note: "category 자료형과 순서형 범주 (영문)" },
    { title: "pandas — Time series / date functionality", url: "https://pandas.pydata.org/docs/user_guide/timeseries.html", note: "to_datetime과 .dt 접근자 (영문)" },
  ],
});
