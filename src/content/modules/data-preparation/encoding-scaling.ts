import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/encoding-scaling";

export default defineLesson({
  id: "encoding-scaling",
  title: "범주형 인코딩, 표준화, 정규화",
  tier: "core",
  concepts: ["encoding-scaling"],
  goal: "명목형·순서형 범주에 맞는 인코딩(원-핫·순서 정수)을 고르고, Min-Max 정규화와 표준화를 계산해 이상치와 분포에 따라 방법을 고르며, 변환 규칙을 학습용 데이터에서만 계산(fit)하고 모든 데이터에 같게 적용(transform)한다.",
  why: "선형 모델, 신경망, KNN처럼 특성의 크기나 거리를 쓰는 모델은 인코딩 방식과 특성의 크기에 결과가 크게 달라진다([[lesson:knn-trees]]). 특성의 크기 차이는 경사하강법의 수렴 속도도 바꾸고([[lesson:gd-convergence]]), 변환 규칙을 평가용 데이터까지 포함해 계산하면 데이터 누수가 생긴다([[lesson:data-splits]]).",
  body: md`
### 범주형 인코딩

대부분의 모델은 숫자만 입력으로 받으므로 범주형 열을 숫자로 바꿔야 한다. 범주의 종류에 따라 방법이 다르다([[lesson:data-types]]).

| 방법 | 동작 | 맞는 경우 | 주의할 점 |
| --- | --- | --- | --- |
| 원-핫 인코딩 | 범주마다 0과 1로 된 열을 하나씩 만든다 | 순서가 없는 명목형(도시, 요금제, 요일) | 범주가 많으면(우편번호 등) 열이 매우 많아진다 |
| 순서 정수 인코딩 | 순서대로 0, 1, 2, …를 붙인다 | 순서가 있는 순서형(옷 크기, 학력, 만족도) | 명목형에 쓰면 없는 크기 관계가 생긴다 |

도시가 서울·부산·대구 세 종류면 원-핫 인코딩은 열 세 개를 만들고, 각 행은 자기 도시의 열에만 1을 넣는다. 어느 두 도시 사이의 거리도 모두 같아져 순서가 없다는 성질이 유지된다. 반대로 서울 0, 부산 1, 대구 2처럼 정수를 붙이면 모델은 "대구는 부산보다 서울에서 두 배 멀다"는, 실제로는 없는 관계를 학습할 수 있다.

[[diagram:encoding-geometry]]

\`\`\`python
import numpy as np
import pandas as pd

df = pd.DataFrame({"city": ["서울", "부산", "대구", "서울"], "edu": ["대졸", "고졸", "대학원졸", "대졸"]})
print(pd.get_dummies(df["city"], dtype=int))                    # 명목형: 도시마다 0/1 열
print(df["edu"].map({"고졸": 0, "대졸": 1, "대학원졸": 2}).tolist())   # 순서형: [1, 0, 2, 1]
\`\`\`

학습 데이터에 없던 범주가 나중에 들어올 수도 있다. scikit-learn의 \`OneHotEncoder(handle_unknown="ignore")\`는 학습 때 본 범주로만 열을 만들고, 처음 보는 범주는 모든 열을 0으로 둔다.

\`\`\`python
from sklearn.preprocessing import OneHotEncoder

enc = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
enc.fit(df[["city"]])                                            # 학습 데이터의 범주를 기억한다
print(enc.categories_[0].tolist())                               # ['대구', '부산', '서울']
print(enc.transform(pd.DataFrame({"city": ["부산", "광주"]})).tolist())   # 광주는 처음 보는 범주라 모두 0
\`\`\`

범주가 수천 개인 열은 원-핫 인코딩으로 열이 너무 많아진다. 이때는 드물게 나오는 범주를 "기타"로 묶거나, 범주마다 학습용 데이터에서 계산한 통계(빈도 등)로 바꾼다. 범주마다 목표 변수의 평균을 쓰는 방법은 그 평균에 자기 자신의 정답이 들어가 누수가 생기기 쉬우므로, 교차검증의 다른 부분으로 계산하는 식의 처리가 필요하다([[lesson:cross-validation]]).

### 스케일링: Min-Max 정규화와 표준화

특성마다 값의 범위가 크게 다르면(방 개수 1~5, 면적 20~200) 크기를 맞춘다. 대표적인 방법은 두 가지다.

\`\`\`math
\text{Min-Max 정규화: } x' = \frac{x - \min(x)}{\max(x) - \min(x)} \qquad \text{표준화: } x' = \frac{x - \bar x}{s}
\`\`\`

Min-Max 정규화는 값을 $[0, 1]$ 구간으로 옮기고, 표준화는 평균을 0, 표준편차를 1로 맞춘다(z-점수, [[lesson:distributions]]). 표준화에서 $s$는 scikit-learn에서는 $n$으로 나눈 표준편차다.

:::example $x = [2, 4, 6, 8]$을 두 방법으로
**Min-Max:** 최솟값 2, 최댓값 8이므로 $x' = (x - 2)/6$이고, 결과는 $[0, 0.333, 0.667, 1]$이다.

**표준화:** 평균 5, 표준편차 $\sqrt{(9 + 1 + 1 + 9)/4} = \sqrt{5} \approx 2.236$이므로 결과는 $[-1.342, -0.447, 0.447, 1.342]$다.

여기에 이상치 100이 더해지면 Min-Max의 분모가 98이 되어 원래 네 값이 0~0.06 사이에 모인다. 표준화한 네 값도 −0.58~−0.42에 모이지만 Min-Max보다는 간격이 넓다.
:::

[[diagram:scaling-compare]]

이상치가 많으면 중앙값을 빼고 사분위범위로 나누는 방법(\`RobustScaler\`)이 이상치의 영향을 덜 받는다. 소득처럼 0보다 크고 오른쪽으로 꼬리가 긴 변수는 로그 변환 $\log(1 + x)$을 먼저 하면 분포가 대칭에 가까워진다([[lesson:visualization]]).

### 스케일링이 필요한 모델과 필요 없는 모델

- **필요한 모델**: 거리를 쓰는 모델(KNN, k-평균), 경사하강법으로 학습하는 모델(선형·로지스틱 회귀, 신경망), 파라미터 크기에 벌점을 주는 정규화를 쓰는 모델([[lesson:regularization]]). 큰 범위의 특성이 거리와 벌점을 좌우하고, 손실의 등고선이 길쭉해져 경사하강법이 느려진다.
- **거의 필요 없는 모델**: 결정 트리와 그 앙상블. 트리는 특성마다 기준값으로 나누기만 하므로 값의 크기를 바꿔도 같은 나누기가 나온다([[lesson:knn-trees]]).

[[diagram:scaling-contours]]

### 학습용 데이터로 fit, 모든 데이터에 transform

scikit-learn의 전처리 도구는 두 단계로 쓴다. \`fit\`은 데이터에서 변환 규칙(평균·표준편차, 최솟값·최댓값, 범주 목록)을 계산해 저장하고, \`transform\`은 저장한 규칙으로 데이터를 바꾼다. 규칙은 **학습용 데이터로만** 계산하고, 같은 규칙을 평가용 데이터와 이후의 새 데이터에 적용한다. 평가용 데이터까지 포함해 fit하면 평가용 데이터의 정보가 학습에 섞이고, 평가용 데이터를 따로 fit하면 학습 때와 다른 기준으로 바뀐다.

\`\`\`python
from sklearn.preprocessing import StandardScaler

X_train = np.array([[1, 20], [2, 45], [3, 80], [4, 130]], dtype=float)   # 방 개수, 면적
X_test = np.array([[5, 200]], dtype=float)
scaler = StandardScaler().fit(X_train)            # 학습용 데이터로만 통계를 계산
print(np.round(scaler.mean_, 2), np.round(scaler.scale_, 2))   # [ 2.5  68.75] [ 1.12 41.29]
print(np.round(scaler.transform(X_test), 3))      # [[2.236 3.179]]: 평가용 데이터는 transform만
\`\`\`

평가용 샘플은 학습용 데이터의 범위를 벗어나 표준화한 값이 2를 넘는다. 이것은 정상이다. 새 데이터는 학습 데이터의 범위를 벗어날 수 있고, 모델은 학습 때와 같은 기준으로 바꾼 값을 받아야 한다. 여러 전처리를 열마다 다르게 적용하고 모델까지 한 번에 묶는 방법(\`ColumnTransformer\`, \`Pipeline\`)은 [[lesson:cross-validation]]에서 다룬다.

:::warn 흔한 실수
- **명목형 범주에 정수를 붙여 그대로 쓴다.** 모델이 없는 순서와 크기를 학습한다.
- **전체 데이터로 스케일러를 fit한 뒤 데이터를 나눈다.** 평가용 데이터의 통계가 학습에 섞인다.
- **평가용 데이터에 따로 fit한다.** 학습 때와 다른 기준으로 변환되어 모델의 입력이 달라진다.
- **트리 모델에 스케일링을 해야 한다고 생각한다.** 해도 결과가 거의 같다. 시간을 다른 점검에 쓴다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "도시(서울·부산·대구) 열에 알맞은 인코딩은?",
      choices: ["원-핫 인코딩: 도시마다 0/1 열 하나씩", "순서 정수 인코딩: 서울 0, 부산 1, 대구 2", "Min-Max 정규화", "인코딩 없이 문자열 그대로"],
      answer: 0,
      explanation: "순서가 없는 명목형에 정수를 붙이면 \"대구(2)가 부산(1)의 두 배\" 같은 없는 크기 관계가 생긴다.",
    },
    {
      key: "c2",
      question: "$x = [2, 4, 6, 8]$을 Min-Max 정규화하면 6은?",
      choices: ["$0.667$", "$0.5$", "$0.75$", "$6$"],
      answer: 0,
      explanation: "$(6 - 2)/(8 - 2) = 4/6 \\approx 0.667$이다.",
    },
    {
      key: "c3",
      question: "스케일러를 올바르게 쓰는 순서는?",
      choices: [
        "학습용 데이터로 fit → 학습용·평가용 모두에 transform",
        "전체 데이터로 fit → 학습용·평가용으로 나누기",
        "평가용 데이터로 fit → 학습용 데이터에 transform",
        "학습용·평가용을 각각 따로 fit",
      ],
      answer: 0,
      explanation: "평가용 데이터의 통계가 학습에 섞이면 누수가 되고, 따로 fit하면 학습 때와 다른 기준으로 변환된다.",
    },
    {
      key: "c4",
      question: "범주가 4개(봄·여름·가을·겨울)인 명목형 열을 원-핫 인코딩하면 열이 몇 개 생기는가?",
      choices: ["4개", "1개", "2개", "16개"],
      answer: 0,
      explanation: "범주마다 0/1 열이 하나씩 생기고, 각 행은 자기 계절의 열만 1이다.",
    },
    {
      key: "c5",
      question: "다음 중 특성 스케일링을 해도 결과가 거의 달라지지 않는 모델은?",
      choices: ["결정 트리", "KNN", "경사하강법으로 학습하는 로지스틱 회귀", "k-평균 군집"],
      answer: 0,
      explanation: "결정 트리는 특성마다 기준값으로 나누기만 하므로 값의 크기를 바꿔도 같은 나누기가 나온다. 나머지는 거리나 경사하강법을 써서 크기에 민감하다.",
    },
    {
      key: "c6",
      question: "학습 때 없던 범주 \"광주\"가 평가용 데이터에 나왔다. `OneHotEncoder(handle_unknown='ignore')`의 결과는?",
      choices: [
        "학습 때 만든 열을 모두 0으로 둔다",
        "\"광주\" 열을 새로 만든다",
        "오류가 난다",
        "가장 흔한 범주로 바꾼다",
      ],
      answer: 0,
      explanation: "인코더는 fit할 때 본 범주로만 열을 만든다. `handle_unknown='ignore'`이면 처음 보는 범주를 모든 열이 0인 행으로 바꾼다. 이 설정이 없으면 오류가 난다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import pandas as pd
df = pd.DataFrame({"city": ["서울", "부산", "서울"]})
dummies = pd.get_dummies(df["city"], dtype=int)
print(list(dummies.columns))
print(dummies.values.tolist())
`,
      expected: "['부산', '서울']\n[[0, 1], [1, 0], [0, 1]]",
      explanation: "원-핫 인코딩은 범주마다 0/1 열을 하나씩 만들고, 열은 범주 이름의 정렬 순서(부산, 서울)로 놓인다. 각 행은 자기 도시의 열만 1이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "도시 열과 학력(고졸·대졸·대학원졸) 열에 각각 어떤 인코딩을 쓸지 정하고, 그 이유를 범주 사이의 거리와 순서로 설명하라.",
      answer: md`
도시는 값 사이에 순서가 없는 명목형이므로 원-핫 인코딩을 쓴다. 도시마다 열을 하나씩 만들면 어느 두 도시 사이의 거리도 같아, 정수를 붙일 때 생기는 가짜 순서와 크기 관계가 생기지 않는다.

학력은 고졸 < 대졸 < 대학원졸의 순서가 있는 순서형이므로 순서대로 0, 1, 2를 붙이는 순서 정수 인코딩을 쓸 수 있다. 숫자의 크기 순서가 실제 순서와 같아 모델이 그 순서를 쓸 수 있다. 다만 단계 사이의 간격이 같다는 가정이 들어가므로, 간격이 다르다고 보면 원-핫 인코딩을 쓸 수도 있다.
`,
      keyPoints: ["도시: 명목형 → 원-핫 인코딩", "정수를 붙이면 없는 순서·크기가 생긴다", "학력: 순서형 → 순서 정수 인코딩", "순서 정수는 간격이 같다는 가정이 들어간다"],
    },
    {
      key: "d2",
      question: "특성의 크기가 크게 다른 데이터를 스케일링 없이 경사하강법으로 학습하면 왜 수렴이 느려지는지 손실의 등고선과 학습률로 설명하라.",
      answer: md`
크기가 큰 특성의 가중치는 조금만 바뀌어도 예측이 크게 바뀌므로 그 방향으로 손실의 곡률이 크고, 크기가 작은 특성의 방향은 곡률이 작다. 그래서 손실의 등고선이 한쪽으로 길쭉한 타원이 된다. 발산하지 않으려면 곡률이 큰 방향에 맞춰 학습률을 작게 잡아야 하는데, 그 학습률로는 곡률이 작은 방향으로 매우 느리게 움직인다. 경사하강법은 등고선에 수직인 방향으로 움직이므로 길쭉한 타원 위에서는 지그재그로 오가며 느리게 수렴한다. 표준화하면 곡률이 비슷해져 등고선이 원에 가까워지고, 큰 학습률로 빠르게 수렴한다([[lesson:gd-convergence]]).
`,
      keyPoints: ["크기가 다르면 방향마다 곡률이 달라 등고선이 길쭉한 타원이 된다", "학습률은 곡률이 큰 방향이 정해 작아진다", "곡률이 작은 방향으로는 느리게, 지그재그로 움직인다", "표준화하면 등고선이 원에 가까워져 빨리 수렴한다"],
    },
  ],
  references: [
    { title: "scikit-learn — Preprocessing data", url: "https://scikit-learn.org/stable/modules/preprocessing.html", note: "StandardScaler·MinMaxScaler·OneHotEncoder 사용법 (영문)" },
    { title: "Google Machine Learning Crash Course — Categorical data", url: "https://developers.google.com/machine-learning/crash-course/categorical-data", note: "원-핫 인코딩과 범주가 많은 열 다루기 (영문)" },
  ],
});
