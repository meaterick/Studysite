import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/dataframes";

export default defineLesson({
  id: "dataframes",
  title: "pandas의 Series와 DataFrame",
  tier: "core",
  concepts: ["pandas-structures"],
  goal: "Series와 DataFrame의 구조(인덱스·열·값)를 설명하고, 딕셔너리와 리스트로 DataFrame을 만들며, shape·dtypes·info·describe로 표의 구성을 확인하고 열 단위 계산으로 새 열을 만든다.",
  why: "표 형태의 데이터는 대부분 pandas로 읽고 정리한 뒤 모델에 넣는다([[lesson:data-cleaning]]). scikit-learn은 DataFrame을 입력으로 받고([[lesson:baselines]]), 학습 결과와 실험 기록도 DataFrame으로 모아 비교한다.",
  body: md`
### Series: 이름표가 붙은 1차원 배열

pandas의 **Series**는 값을 담은 1차원 배열과, 각 값의 이름인 **인덱스**(index)로 이루어진다. 값은 NumPy 배열이라 원소별 연산이 그대로 된다([[lesson:numpy-arrays]]).

\`\`\`python
import pandas as pd

height = pd.Series([170, 165, 180], index=["kim", "lee", "park"])
print(height)
print(height["lee"], height.to_numpy(), height.index.tolist())   # 165 [170 165 180] ['kim', 'lee', 'park']
print(height / 100)                                              # 원소별 연산
\`\`\`

두 Series를 계산하면 pandas는 위치가 아니라 **인덱스가 같은 값끼리** 짝짓는다. 한쪽에만 있는 인덱스는 짝이 없어 결측값 \`NaN\`이 된다.

\`\`\`python
a = pd.Series([1, 2, 3], index=["x", "y", "z"])
b = pd.Series([10, 20, 30], index=["y", "z", "w"])
print(a + b)            # w와 x는 NaN, y는 12.0, z는 23.0
\`\`\`

같은 위치끼리 계산하는 NumPy와 다르므로, 인덱스가 다른 두 Series를 계산할 때는 결과에 \`NaN\`이 생기지 않았는지 확인한다.

### DataFrame: 인덱스를 공유하는 열들의 표

**DataFrame**은 같은 행 인덱스를 공유하는 Series 여러 개를 열로 모은 표다. 열 이름을 키로, 값의 리스트를 값으로 하는 딕셔너리로 만들 수 있다. 행 인덱스를 지정하지 않으면 0부터 시작하는 정수가 붙는다.

\`\`\`python
df = pd.DataFrame({
    "name": ["kim", "lee", "park", "choi", "jung"],
    "group": ["A", "B", "A", "B", "A"],
    "height": [170.0, 165.0, 180.0, 158.0, 175.0],
    "weight": [65.0, 55.0, 80.0, 50.0, 70.0],
    "score": [88, 92, 75, 95, 81],
})
print(df)
print(df.shape, df.columns.tolist())   # (5, 5) ['name', 'group', 'height', 'weight', 'score']
print(type(df["score"]).__name__, type(df[["score"]]).__name__)   # Series DataFrame
\`\`\`

\`df["열 이름"]\`은 열 하나를 Series로, \`df[["열1", "열2"]]\`처럼 리스트를 넣으면 고른 열들을 DataFrame으로 돌려준다. 행 하나가 딕셔너리 하나인 리스트(\`[{"name": "kim", ...}, ...]\`)로도 DataFrame을 만들 수 있다. JSON 파일을 읽으면 흔히 이 형태다([[lesson:file-io]]).

### 처음 받은 표를 확인하기

표를 받으면 먼저 크기, 열의 자료형, 결측값, 값의 범위를 확인한다.

\`\`\`python
df.info()                       # 행 수, 열마다 결측이 아닌 값의 수와 자료형, 메모리
print(df.describe())            # 수치형 열의 개수·평균·표준편차·최솟값·사분위수·최댓값
print(df["group"].value_counts())   # 범주마다 행의 개수
\`\`\`

\`info()\`의 Non-Null Count가 행 수보다 작으면 그 열에 결측값이 있다. \`describe()\`는 수치형 열만 요약하고, 표준편차는 $n - 1$로 나눈 표본표준편차다([[lesson:summary-statistics]]). 문자열 열의 자료형은 pandas 2에서 \`object\`로, pandas 3부터는 \`str\`로 표시된다. 이 사이트의 실행 환경은 pandas 2다.

### 열 단위로 계산해 새 열 만들기

열은 Series라서 반복문 없이 열 전체를 한 번에 계산한다. 계산 결과를 새 열 이름에 대입하면 열이 추가된다.

\`\`\`python
df["bmi"] = (df["weight"] / (df["height"] / 100) ** 2).round(1)   # 체질량지수 = 몸무게 / 키(m)²
df["passed"] = df["score"] >= 85                                   # bool 열
print(df[["name", "bmi", "passed"]])
\`\`\`

### NumPy 배열과 오가기

모델에 넣을 특성 행렬이 필요하면 \`to_numpy()\`로 배열을 꺼내고, 배열을 표로 보고 싶으면 열 이름을 붙여 DataFrame으로 만든다.

\`\`\`python
X = df[["height", "weight"]].to_numpy()       # 모양 (5, 2)인 특성 행렬
print(X.shape, X.dtype)                       # (5, 2) float64
summary = pd.DataFrame(X.mean(axis=0).reshape(1, -1), columns=["height", "weight"])
print(summary)
\`\`\`

:::warn 흔한 실수
- **\`df["a"]\`와 \`df[["a"]]\`를 같은 것으로 본다.** 앞은 Series(1차원), 뒤는 열이 하나인 DataFrame(2차원)이다. scikit-learn의 특성 입력에는 2차원이 필요하다.
- **인덱스 정렬을 잊는다.** 인덱스가 다른 Series끼리 계산하면 위치가 아니라 인덱스로 짝지어 \`NaN\`이 생길 수 있다.
- **\`describe()\`의 표준편차와 \`np.std\`가 다르다고 놀란다.** pandas는 $n - 1$, NumPy는 기본으로 $n$으로 나눈다.
- **행마다 반복문을 돈다.** \`for\`나 \`apply\`로 행을 하나씩 처리하면 느리다. 열 단위 연산으로 쓸 수 있는지 먼저 확인한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`pd.Series([1, 2], index=['a', 'b']) + pd.Series([10, 20], index=['b', 'c'])`의 결과는?",
      choices: ["a: NaN, b: 12.0, c: NaN", "a: 11, b: 22", "[11, 22]", "오류가 난다"],
      answer: 0,
      explanation: "Series의 연산은 인덱스가 같은 값끼리 짝짓는다. 두 Series에 모두 있는 b만 2 + 10 = 12이고, 한쪽에만 있는 a와 c는 NaN이 된다. NaN이 있어 자료형은 실수가 된다.",
    },
    {
      key: "c2",
      question: "DataFrame `df`에서 `df[['score']]`가 돌려주는 것은?",
      choices: ["열이 하나인 DataFrame", "Series", "NumPy 배열", "score 열의 첫 값"],
      answer: 0,
      explanation: "리스트로 열을 고르면 DataFrame이 나온다. `df['score']`는 Series다.",
    },
    {
      key: "c3",
      question: "`df.info()`에서 행이 1,000개인데 어떤 열의 Non-Null Count가 940이다. 이 열에 대해 알 수 있는 것은?",
      choices: ["결측값이 60개 있다", "중복값이 60개 있다", "자료형이 잘못되었다", "이상치가 60개 있다"],
      answer: 0,
      explanation: "Non-Null Count는 결측이 아닌 값의 개수다. 1000 − 940 = 60개가 결측이다. 중복값이나 이상치는 info()로 알 수 없다.",
    },
    {
      key: "c4",
      question: "키(cm) 열 `height`와 몸무게(kg) 열 `weight`로 체질량지수 열을 만드는 코드로 알맞은 것은?",
      choices: [
        "`df['bmi'] = df['weight'] / (df['height'] / 100) ** 2`",
        "`for i in df: df['bmi'] = weight / height ** 2`",
        "`df.bmi = df['weight'] * df['height']`",
        "`df['bmi'] = sum(df['weight']) / sum(df['height'])`",
      ],
      answer: 0,
      explanation: "열은 Series라 원소별 연산으로 열 전체를 한 번에 계산한다. 새 열은 `df['새 이름'] = ...`으로 대입해 만든다.",
    },
    {
      key: "c5",
      question: "`df.describe()`의 std 값과 `np.std(df['score'])`가 다르게 나오는 이유는?",
      choices: [
        "pandas는 n − 1로, NumPy는 기본으로 n으로 나누기 때문이다",
        "describe()는 결측값을 0으로 채우기 때문이다",
        "NumPy가 값을 반올림하기 때문이다",
        "describe()는 중앙값을 기준으로 하기 때문이다",
      ],
      answer: 0,
      explanation: "pandas의 표준편차는 표본표준편차(ddof=1)가 기본이다. `np.std(x, ddof=1)`로 맞추면 같은 값이 나온다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import pandas as pd
df = pd.DataFrame({"a": [1, 2, 3], "b": [10.0, 20.0, 30.0]})
df["c"] = df["a"] * df["b"]
print(df.shape, df["c"].tolist(), df["c"].sum())
`,
      expected: "(3, 3) [10.0, 40.0, 90.0] 140.0",
      explanation: "새 열 c가 추가되어 모양이 (3, 3)이 된다. 정수 열 a와 실수 열 b를 곱하면 실수가 되어 `[10.0, 40.0, 90.0]`이고, 합은 140.0이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "Series끼리의 덧셈이 NumPy 배열끼리의 덧셈과 어떻게 다른지 인덱스 정렬로 설명하고, 이 차이 때문에 생길 수 있는 문제와 확인 방법을 쓰라.",
      answer: md`
NumPy 배열은 같은 **위치**의 원소끼리 더하지만, Series는 같은 **인덱스**의 값끼리 짝지어 더한다. 두 Series의 순서가 달라도 인덱스가 같으면 올바르게 짝지어지는 장점이 있다. 그러나 한쪽에만 있는 인덱스는 짝이 없어 결과가 \`NaN\`이 된다.

예를 들어 필터링으로 행 일부를 지운 Series와 원래 Series를 더하면, 지워진 인덱스의 결과가 모두 \`NaN\`이 된다. 이 \`NaN\`은 이후 합계나 평균에서 조용히 빠지거나 모델 입력에서 오류를 만든다. 계산 뒤에 \`isna().sum()\`으로 결측이 새로 생겼는지 확인하고, 위치끼리 계산하려는 경우라면 \`to_numpy()\`로 바꾸거나 \`reset_index(drop=True)\`로 인덱스를 맞춘 뒤 계산한다.
`,
      keyPoints: ["NumPy는 위치, Series는 인덱스로 짝짓는다", "한쪽에만 있는 인덱스는 NaN이 된다", "필터링·재정렬 뒤의 계산에서 의도치 않은 NaN이 생긴다", "isna().sum()으로 확인하고 to_numpy()나 reset_index로 맞춘다"],
    },
  ],
  references: [
    { title: "pandas — 10 minutes to pandas", url: "https://pandas.pydata.org/docs/user_guide/10min.html", note: "Series·DataFrame 만들기와 기본 조작 (영문)" },
    { title: "pandas — Intro to data structures", url: "https://pandas.pydata.org/docs/user_guide/dsintro.html", note: "인덱스 정렬과 자료 구조 설명 (영문)" },
  ],
});
