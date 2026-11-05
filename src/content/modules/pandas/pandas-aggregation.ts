import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/pandas-aggregation";

export default defineLesson({
  id: "pandas-aggregation",
  title: "그룹별 집계, 테이블 결합, 형태 변환",
  tier: "core",
  concepts: ["pandas-aggregation"],
  goal: "groupby로 그룹별 통계를 계산하고 transform으로 그룹 통계를 행에 붙이며, merge로 두 표를 키로 결합할 때 결합 방식과 키 중복의 영향을 판단하고, melt와 pivot으로 넓은 표와 긴 표를 서로 바꾼다.",
  why: "고객별 구매 횟수 같은 특성은 그룹 집계로 만든다([[lesson:feature-engineering]]). 집단별로 모델의 정확도를 비교하는 공정성 점검도 groupby 한 줄이고([[lesson:fairness]]), 여러 출처의 데이터를 한 학습 표로 모을 때는 merge의 키가 맞는지 확인해야 한다.",
  body: md`
### 그룹별 집계

\`groupby(열)\`은 그 열의 값이 같은 행끼리 묶고, 묶음마다 집계 함수를 적용해 결과를 그룹당 한 행으로 돌려준다.

\`\`\`python
import pandas as pd

orders = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5, 6],
    "customer_id": [10, 11, 10, 12, 11, 10],
    "product": ["pen", "note", "bag", "pen", "bag", "note"],
    "amount": [4500, 6000, 25000, 15000, 50000, 15000],
})
print(orders.groupby("customer_id")["amount"].sum())     # 고객별 구매 금액 합: 10 → 44500, 11 → 56000, 12 → 15000
print(orders.groupby("product").agg(
    n=("order_id", "count"),                             # 새 열 이름=(대상 열, 집계 함수)
    total=("amount", "sum"),
    mean=("amount", "mean"),
))
\`\`\`

\`agg\`에 \`새 열 이름=(대상 열, 함수)\`를 여러 개 주면 집계 결과를 한 번에 만들고 열 이름도 정할 수 있다. 집계 함수로는 \`sum\`, \`mean\`, \`median\`, \`min\`, \`max\`, \`count\`(결측이 아닌 값의 수), \`size\`(행 수), \`nunique\`(서로 다른 값의 수)를 자주 쓴다. 결과의 인덱스는 묶은 열의 값이고, 일반 열로 돌리려면 \`reset_index()\`를 쓴다. 범주 하나의 행 수만 필요하면 \`value_counts()\`가 같은 일을 한다.

모델 평가에서도 그룹 집계를 쓴다. 예측이 맞았는지를 bool 열로 만들고 집단별 평균을 내면 집단별 정확도가 된다.

\`\`\`python
res = pd.DataFrame({"group": ["A", "A", "B", "B", "B"], "y": [1, 0, 1, 1, 0], "pred": [1, 0, 0, 1, 1]})
res["correct"] = res["y"] == res["pred"]
print(res.groupby("group")["correct"].mean())            # A 1.0, B 0.333: 전체 정확도 0.6에 가려진 차이
\`\`\`

### 그룹 통계를 행마다 붙이기: transform

\`groupby(...).transform(함수)\`는 그룹별로 계산한 값을 원래 행 수 그대로, 각 행이 속한 그룹의 값으로 돌려준다. 행마다 "자기 그룹 안에서의 비율"이나 "그룹 평균과의 차이"를 계산할 때 쓴다.

\`\`\`python
customer_total = orders.groupby("customer_id")["amount"].transform("sum")   # 행 수 6개 그대로
orders["share"] = (orders["amount"] / customer_total).round(3)              # 고객의 전체 구매 중 이 주문의 비율
print(orders[["order_id", "customer_id", "amount", "share"]])
\`\`\`

\`groupby(...).sum()\`은 그룹 수만큼의 행을, \`transform("sum")\`은 원래 행 수만큼의 행을 돌려준다는 차이를 기억한다.

### 두 표를 키로 결합하기: merge

\`merge\`는 두 표에서 키 열의 값이 같은 행끼리 이어 붙인다. \`how\`로 짝이 없는 행을 어떻게 할지 정한다.

| \`how\` | 남는 행 |
| --- | --- |
| \`"inner"\` | 두 표에 모두 키가 있는 행만 |
| \`"left"\` | 왼쪽 표의 모든 행. 오른쪽에 짝이 없으면 오른쪽 열이 결측 |
| \`"right"\` | 오른쪽 표의 모든 행 |
| \`"outer"\` | 두 표의 모든 행 |

\`\`\`python
customers = pd.DataFrame({"customer_id": [10, 11, 13], "region": ["Seoul", "Busan", "Daegu"]})
inner = orders.merge(customers, on="customer_id", how="inner")
left = orders.merge(customers, on="customer_id", how="left")
print(len(inner), len(left))                              # 5 6: 고객 12는 고객 표에 없다
print(left[left["region"].isna()]["order_id"].tolist())   # [4]: 짝이 없는 주문
\`\`\`

\`inner\`는 짝이 없는 주문 4를 조용히 버리므로, 결합 전후의 행 수를 비교해 빠진 행이 없는지 확인한다.

결합에서 가장 흔한 문제는 **키 중복**이다. 오른쪽 표에 같은 키가 두 번 있으면 왼쪽 행이 그만큼 복제되어 행 수가 늘어난다. 고객 정보처럼 키마다 한 행이어야 하는 표를 붙일 때는 \`validate="many_to_one"\`으로 이 가정을 검사한다.

\`\`\`python
coupons = pd.DataFrame({"customer_id": [10, 10], "coupon": ["A", "B"]})   # 고객 10이 두 번 있다
print(len(orders), len(orders.merge(coupons, on="customer_id", how="left")))   # 6 9: 고객 10의 주문 3개가 2배
try:
    orders.merge(coupons, on="customer_id", how="left", validate="many_to_one")
except pd.errors.MergeError as e:
    print("결합 오류:", e)
\`\`\`

행이 복제되면 매출 합계가 부풀거나, 같은 샘플이 학습용과 평가용에 함께 들어가는 데이터 누수가 생길 수 있다([[lesson:data-splits]]). 열 구성이 같은 표를 위아래로 이어 붙일 때는 \`pd.concat([df1, df2])\`를 쓴다.

### 넓은 표와 긴 표

같은 데이터를 두 형태로 나타낼 수 있다. **넓은 표**는 관찰 대상 하나가 한 행이고 측정값마다 열이 있다. **긴 표**는 "대상, 변수 이름, 값"이 한 행이다. \`melt\`는 넓은 표를 긴 표로, \`pivot\`은 긴 표를 넓은 표로 바꾼다.

\`\`\`python
wide = pd.DataFrame({"student": ["kim", "lee"], "math": [90, 70], "english": [80, 95]})
long = wide.melt(id_vars="student", var_name="subject", value_name="score")
print(long)                                                          # 4행: (학생, 과목, 점수)
print(long.pivot(index="student", columns="subject", values="score"))   # 다시 넓은 표
print(long.groupby("subject")["score"].mean())                       # 긴 표는 그룹 집계가 쉽다
\`\`\`

그룹 집계와 그래프 도구는 긴 표를 다루기 쉽고, 모델의 특성 행렬은 샘플 하나가 한 행인 넓은 표여야 한다. 같은 칸에 값이 여러 개 들어갈 수 있으면 \`pivot\` 대신 집계 함수를 지정하는 \`pivot_table(..., aggfunc="sum")\`을 쓴다.

:::warn 흔한 실수
- **결합 뒤 행 수를 확인하지 않는다.** \`inner\`는 짝 없는 행을 버리고, 키가 중복되면 행이 복제된다. 결합 전후의 \`len\`을 비교하고 \`validate\`를 쓴다.
- **\`count\`와 \`size\`를 같은 것으로 본다.** \`count\`는 결측이 아닌 값의 수, \`size\`는 결측을 포함한 행 수다.
- **그룹 통계를 원래 행에 붙이려고 merge를 직접 만든다.** \`transform\`이 원래 행 순서 그대로 값을 돌려준다.
- **전체 평균만 보고 그룹 간 차이를 놓친다.** 전체 정확도가 같아도 집단별 정확도는 크게 다를 수 있다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`orders.groupby('customer_id')['amount'].sum()`의 결과에 대한 설명으로 옳은 것은?",
      choices: [
        "고객마다 한 행이고, 인덱스가 customer_id인 Series다",
        "원래 행 수만큼의 Series다",
        "주문마다 고객의 총액을 붙인 DataFrame이다",
        "전체 금액의 합인 숫자 하나다",
      ],
      answer: 0,
      explanation: "groupby 집계는 그룹당 한 행을 돌려주고, 묶은 열의 값이 인덱스가 된다. 원래 행 수를 유지하려면 `transform('sum')`을 쓴다.",
    },
    {
      key: "c2",
      question: "주문 표(6행)를 고객 표와 `how='left'`로 결합했더니 9행이 되었다. 가장 가능성 높은 원인은?",
      choices: [
        "고객 표에 같은 customer_id가 여러 번 있다",
        "주문 표에 결측값이 있다",
        "고객 표에 없는 고객이 있다",
        "left 결합은 항상 행을 늘린다",
      ],
      answer: 0,
      explanation: "오른쪽 표의 키가 중복되면 왼쪽 행이 그 수만큼 복제된다. 짝이 없는 고객은 left 결합에서 결측으로 남을 뿐 행 수를 늘리지 않는다. `validate='many_to_one'`으로 중복을 검사한다.",
    },
    {
      key: "c3",
      question: "고객별 총 구매액에서 각 주문이 차지하는 비율 열을 원래 주문 표에 만드는 코드는?",
      choices: [
        "`orders['amount'] / orders.groupby('customer_id')['amount'].transform('sum')`",
        "`orders['amount'] / orders.groupby('customer_id')['amount'].sum()`",
        "`orders.groupby('customer_id')['amount'].mean()`",
        "`orders['amount'] / orders['amount'].sum()`",
      ],
      answer: 0,
      explanation: "`transform('sum')`은 행마다 그 행이 속한 고객의 합을 원래 행 수 그대로 돌려주므로 나눗셈이 행 단위로 맞는다. 두 번째 식은 인덱스가 고객 번호인 Series와 나누어 인덱스가 맞지 않는다.",
    },
    {
      key: "c4",
      question: "열이 student, math, english인 넓은 표를 (student, subject, score) 형태의 긴 표로 바꾸는 코드는?",
      choices: [
        "`wide.melt(id_vars='student', var_name='subject', value_name='score')`",
        "`wide.pivot(index='student', columns='subject')`",
        "`wide.groupby('student').sum()`",
        "`pd.concat([wide, wide])`",
      ],
      answer: 0,
      explanation: "`melt`는 지정한 열(id_vars)을 남기고 나머지 열 이름을 변수 열로, 값을 값 열로 바꿔 긴 표를 만든다. `pivot`은 그 반대 방향이다.",
    },
    {
      key: "c5",
      question: "집단 A와 B의 정확도가 각각 0.95와 0.70이고 전체 정확도가 0.9이다. 이 결과에서 확인해야 할 점으로 가장 알맞은 것은?",
      choices: [
        "전체 정확도가 높아도 집단 B에서 모델이 훨씬 자주 틀리므로 원인을 따로 살펴야 한다",
        "전체 정확도가 0.9이므로 집단별 차이는 무시해도 된다",
        "집단 B의 데이터를 버리면 된다",
        "정확도는 집단별로 계산할 수 없다",
      ],
      answer: 0,
      explanation: "전체 평균은 표본이 많은 집단의 결과에 크게 좌우된다. groupby로 집단별 지표를 계산해 차이와 원인을 확인한다([[lesson:fairness]]).",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import pandas as pd
a = pd.DataFrame({"k": [1, 2, 3], "x": [10, 20, 30]})
b = pd.DataFrame({"k": [2, 3, 3, 4], "y": ["p", "q", "r", "s"]})
print(len(a.merge(b, on="k")), len(a.merge(b, on="k", how="left")), len(a.merge(b, on="k", how="outer")))
`,
      expected: "3 4 5",
      explanation: "inner는 짝이 있는 키 2(1행), 3(b에 두 번 → 2행)으로 3행이다. left는 여기에 짝 없는 키 1을 더해 4행이고, outer는 b에만 있는 키 4까지 더해 5행이다. 키 3이 b에서 중복되어 a의 한 행이 두 행이 되었다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "주문 표에 고객 정보 표를 `merge`로 붙일 때 행 수가 줄거나 늘어나는 경우를 각각 설명하고, 이런 문제를 막기 위해 결합 전후에 확인할 것을 쓰라.",
      answer: md`
행 수가 줄어드는 경우: \`how="inner"\`로 결합하면 고객 표에 없는 고객의 주문이 버려진다. 고객 정보가 빠진 주문이 분석이나 학습 데이터에서 조용히 사라진다.

행 수가 늘어나는 경우: 고객 표에 같은 고객 번호가 여러 번 있으면(예: 정보가 갱신될 때마다 행을 추가한 표) 그 고객의 주문이 중복 개수만큼 복제된다. 매출 합계가 부풀고, 같은 주문이 학습용과 평가용에 모두 들어갈 수 있다.

확인할 것: 결합 전에 고객 표의 키가 중복되지 않는지(\`customers["customer_id"].duplicated().sum()\`) 확인하고, \`validate="many_to_one"\`으로 결합해 중복이 있으면 오류가 나게 한다. 결합 뒤에는 행 수가 주문 표와 같은지 비교하고, \`how="left"\`로 결합했다면 붙인 열의 결측 수로 짝이 없는 주문이 몇 개인지 확인한다.
`,
      keyPoints: ["inner 결합은 짝 없는 행을 버린다", "키 중복은 행을 복제해 합계를 부풀리고 누수를 만든다", "결합 전 키 중복 확인과 validate 인자", "결합 후 행 수 비교와 결측 확인"],
    },
  ],
  references: [
    { title: "pandas — Group by: split-apply-combine", url: "https://pandas.pydata.org/docs/user_guide/groupby.html", note: "groupby, agg, transform (영문)" },
    { title: "pandas — Merge, join, concatenate and compare", url: "https://pandas.pydata.org/docs/user_guide/merging.html", note: "merge의 how와 validate 인자 (영문)" },
  ],
});
