import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/feature-engineering";

export default defineLesson({
  id: "feature-engineering",
  title: "특성 생성, 특성 선택, 차원의 저주",
  tier: "core",
  concepts: ["feature-engineering"],
  goal: "비율·차이·날짜·구간·거듭제곱 같은 파생 특성을 만들어 선형 모델이 표현하지 못하는 관계를 표현하고, 값이 변하지 않거나 서로 거의 같은 특성을 골라내며, 특성이 많아질수록 거리 기반 방법이 약해지는 차원의 저주를 시뮬레이션으로 확인한다.",
  why: "표 데이터에서는 모델을 바꾸는 것보다 문제에 맞는 특성을 만드는 것이 성능을 더 크게 바꾸는 경우가 많다([[lesson:baselines]]). 특성이 너무 많으면 과적합과 계산 비용이 커지므로 특성을 고르거나 차원을 줄인다([[lesson:regularization]], [[lesson:kmeans-pca-pipeline]]). 딥러닝은 이런 특성을 데이터에서 직접 학습하는 방법이다([[lesson:perceptron-mlp]]).",
  body: md`
### 파생 특성 만들기

원래 열을 조합하거나 바꿔 새 특성을 만드는 것을 **특성 생성**이라고 한다. 자주 쓰는 방법은 다음과 같다.

| 방법 | 예 | 이유 |
| --- | --- | --- |
| 비율·차이 | 면적당 가격, 판매 연도와 건축 연도의 차이 | 크기의 영향을 덜어 내거나 관계를 직접 나타낸다 |
| 날짜에서 꺼내기 | 요일, 주말 여부, 월, 경과 일수 | 주기와 기간을 숫자로 나타낸다([[lesson:data-types]]) |
| 그룹 집계 | 고객별 구매 횟수, 평균 구매액 | 여러 행의 정보를 한 행에 모은다([[lesson:pandas-aggregation]]) |
| 구간화 | 면적을 소형·중형·대형으로 | 크기에 따라 효과가 계단처럼 바뀌는 관계를 나타낸다 |
| 변환 | 로그, 거듭제곱, 두 특성의 곱 | 곡선 관계나 두 특성이 함께 작용하는 효과를 나타낸다 |

\`\`\`python
import numpy as np
import pandas as pd

houses = pd.DataFrame({
    "price": [52000, 31000, 78000, 45000, 60000],              # 가격(만 원)
    "area": [84, 59, 114, 76, 84],                             # 면적(m²)
    "built": [2005, 1998, 2015, 2010, 1990],                   # 건축 연도
    "sold": pd.to_datetime(["2024-03-02", "2024-03-09", "2024-04-15", "2024-05-01", "2024-05-18"]),
})
houses["price_per_m2"] = (houses["price"] / houses["area"]).round(1)   # 비율
houses["age"] = houses["sold"].dt.year - houses["built"]               # 차이: 판매 시점의 건물 나이
houses["sold_weekend"] = (houses["sold"].dt.dayofweek >= 5).astype(int)
houses["area_band"] = pd.cut(houses["area"], bins=[0, 60, 85, 200], labels=["small", "mid", "large"])
print(houses.drop(columns=["sold"]))
\`\`\`

파생 특성을 만들 때도 **예측 시점에 알 수 있는 값**만 써야 한다([[lesson:eda]]). 목표 변수인 가격으로 만든 \`price_per_m2\`는 가격을 예측하는 모델의 특성으로 쓰면 누수다. 이 예는 다른 목표(예: 판매 기간)를 예측할 때의 특성으로만 쓸 수 있다.

### 선형 모델에 곡선 관계를 표현하기

선형 모델 $\hat y = w_1 x_1 + \cdots + w_d x_d + b$는 특성의 **선형결합**만 표현한다([[lesson:linear-regression]]). $y$가 $x^2$에 따라 바뀌면 $x$만 넣은 선형 모델은 관계를 거의 잡지 못하지만, $x^2$을 특성으로 더하면 같은 선형 모델로 곡선 관계를 표현할 수 있다. 모델은 그대로이고 입력만 바뀐 것이다.

\`\`\`python
from sklearn.linear_model import LinearRegression

rng = np.random.default_rng(0)
x = rng.uniform(-3, 3, 200)
y = x ** 2 + rng.normal(0, 0.5, 200)

m1 = LinearRegression().fit(x.reshape(-1, 1), y)                  # 특성: x
X2 = np.column_stack([x, x ** 2])
m2 = LinearRegression().fit(X2, y)                                # 특성: x, x²
print(round(m1.score(x.reshape(-1, 1), y), 3), round(m2.score(X2, y), 3))   # 결정계수 R²: 0.008 → 0.969
print(np.round(m2.coef_, 2))                                      # [-0.02  0.99]: x²의 계수가 약 1
\`\`\`

\`score\`가 돌려주는 결정계수 $R^2$는 1에 가까울수록 모델이 $y$의 변동을 잘 설명한다는 뜻이다([[lesson:linear-regression]]). 두 특성의 곱 $x_1 x_2$를 더하면 "두 특성이 함께 클 때만 효과가 커지는" 관계도 같은 방법으로 표현한다. 다만 특성을 많이 만들수록 학습 데이터에만 맞는 과적합의 위험이 커지므로, 추가한 특성의 효과는 검증 데이터로 확인한다([[lesson:cross-validation]]).

### 특성 선택

쓸모없거나 중복된 특성은 계산 비용을 늘리고, 모델을 불안정하게 하며, 결과 해석을 어렵게 한다. 먼저 간단한 기준으로 걸러 낸다.

- **값이 변하지 않는 특성**: 모든 행이 같은 값이면(분산 0) 아무 정보가 없다.
- **서로 거의 같은 특성**: 상관계수의 절댓값이 1에 가까운 두 특성은 같은 정보를 담고 있다. 선형 모델에서는 계수가 하나로 정해지지 않아 불안정해지므로([[lesson:linear-maps-basis]]) 하나만 남긴다.

\`\`\`python
X = pd.DataFrame({"a": rng.normal(size=100), "const": 1.0})
X["a_copy"] = X["a"] * 2 + 0.01 * rng.normal(size=100)         # a와 거의 같은 정보
X["b"] = rng.normal(size=100)
print(X.var().round(3).to_dict())                               # const의 분산이 0
print(X.drop(columns="const").corr().abs().round(3))            # a와 a_copy의 상관이 1.0
\`\`\`

그 밖에 L1 정규화로 계수가 0이 된 특성을 빼거나([[lesson:regularization]]), 트리 모델의 특성 중요도를 참고하는 방법이 있다. 어떤 방법이든 **특성 선택도 학습 데이터로만** 한다. 전체 데이터에서 목표 변수와 상관이 큰 특성을 고르면 테스트 데이터의 정보로 특성을 고른 셈이라 평가가 낙관적으로 나온다.

### 차원의 저주

특성이 많을수록 좋은 것은 아니다. 특성(차원)이 늘어나면 데이터가 공간을 채우는 밀도가 급격히 낮아진다. 한 축을 10칸으로 나눌 때 칸 하나에 점이 평균 10개 들어가려면 1차원에서는 100개면 되지만, 10차원에서는 칸이 $10^{10}$개라 $10^{11}$개가 필요하다. 그리고 차원이 높으면 점들 사이의 거리가 서로 비슷해진다. 무작위로 찍은 점 500개에서 기준점까지의 가장 먼 거리와 가장 가까운 거리의 차이를, 가장 가까운 거리에 대한 비로 재면 다음과 같다.

\`\`\`python
for d in (2, 10, 100, 1000):
    P = rng.random((500, d))                                    # [0, 1]^d의 점 500개
    q = rng.random(d)                                           # 기준점
    dist = np.sqrt(((P - q) ** 2).sum(axis=1))
    print(d, round((dist.max() - dist.min()) / dist.min(), 3))   # 차원이 커질수록 0에 가까워진다
\`\`\`

2차원에서는 가장 먼 점이 가장 가까운 점보다 수십 배 멀지만, 1000차원에서는 모든 점이 거의 같은 거리에 있다. "가까운 이웃"이 다른 점들보다 특별히 가깝지 않으면 KNN이나 거리 기반 군집처럼 거리에 기대는 방법의 성능이 떨어진다([[lesson:knn-trees]]). 이것을 **차원의 저주**라고 한다. 그래서 관련 없는 특성을 빼거나, 주성분 분석처럼 정보를 많이 담은 소수의 방향으로 차원을 줄이고([[lesson:kmeans-pca-pipeline]]), 데이터를 더 모은다.

:::warn 흔한 실수
- **목표 변수로 만든 값을 특성으로 쓴다.** 가격을 예측하면서 가격으로 계산한 특성을 넣으면 누수다.
- **특성을 많이 만들수록 좋다고 생각한다.** 특성이 늘면 과적합과 차원의 저주가 커진다. 검증 데이터로 효과를 확인한다.
- **전체 데이터로 특성을 고른다.** 특성 선택도 학습 데이터에서만 한다.
- **거의 같은 특성을 함께 넣는다.** 선형 모델의 계수가 불안정해지고 해석이 어려워진다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "집값을 예측하는 모델의 특성으로 쓰면 안 되는 것은?",
      choices: ["가격을 면적으로 나눈 평당 가격", "건물 나이", "면적", "판매 요일"],
      answer: 0,
      explanation: "평당 가격은 목표 변수인 가격으로 계산한 값이라, 예측 시점에는 알 수 없고 정답의 정보를 그대로 담는 누수다.",
    },
    {
      key: "c2",
      question: "$y$가 $x^2$에 비례하는 데이터에서 선형 회귀의 성능을 크게 높이는 방법은?",
      choices: ["$x^2$을 새 특성으로 추가한다", "$x$를 표준화한다", "데이터를 섞는다", "학습률을 높인다"],
      answer: 0,
      explanation: "선형 모델은 특성의 선형결합만 표현한다. $x^2$을 특성으로 주면 같은 선형 모델로 곡선 관계를 표현할 수 있다. 표준화는 선형 회귀가 표현하는 관계를 바꾸지 않는다.",
    },
    {
      key: "c3",
      question: "모든 행의 값이 같은 열과, 다른 열과 상관계수가 0.999인 열을 빼는 이유로 알맞은 것은?",
      choices: [
        "각각 정보가 없거나 이미 있는 정보와 같아, 계산만 늘리고 모델을 불안정하게 하기 때문이다",
        "결측값이 생기기 때문이다",
        "모델이 학습을 할 수 없기 때문이다",
        "스케일링을 할 수 없기 때문이다",
      ],
      answer: 0,
      explanation: "분산이 0인 열은 정보가 없고, 거의 같은 두 열은 같은 정보를 담는다. 거의 같은 두 열이 함께 있으면 선형 모델의 계수가 하나로 정해지지 않아 불안정하다.",
    },
    {
      key: "c4",
      question: "차원의 저주에 대한 설명으로 옳은 것은?",
      choices: [
        "차원이 높아지면 점들 사이의 거리가 서로 비슷해져 가까운 이웃이 특별히 가깝지 않게 된다",
        "차원이 높을수록 KNN의 성능이 항상 좋아진다",
        "차원이 높아지면 거리를 계산할 수 없다",
        "특성이 많을수록 필요한 데이터가 줄어든다",
      ],
      answer: 0,
      explanation: "본문 시뮬레이션에서 1000차원이면 가장 먼 점과 가장 가까운 점의 거리 차이가 가장 가까운 거리의 약 12%뿐이다. 공간을 채우는 데 필요한 데이터도 차원에 따라 지수적으로 늘어난다.",
    },
    {
      key: "c5",
      question: "목표 변수와의 상관계수로 특성을 고를 때 지켜야 할 것은?",
      choices: [
        "상관계수를 학습 데이터에서만 계산한다",
        "학습과 테스트 데이터를 합쳐 계산한다",
        "테스트 데이터에서만 계산한다",
        "상관계수가 가장 낮은 특성을 고른다",
      ],
      answer: 0,
      explanation: "특성 선택도 데이터에서 배우는 과정이다. 테스트 데이터를 포함해 고르면 테스트 정보로 모델을 정한 셈이라 평가가 실제보다 좋게 나온다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import pandas as pd
s = pd.Series([45, 59, 84, 114])
print(pd.cut(s, bins=[0, 60, 85, 200], labels=["small", "mid", "large"]).tolist())
`,
      expected: "['small', 'small', 'mid', 'large']",
      explanation: "`pd.cut`의 구간은 기본으로 오른쪽 끝을 포함한다: (0, 60], (60, 85], (85, 200]. 45와 59는 첫 구간, 84는 둘째 구간, 114는 셋째 구간에 들어간다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "선형 회귀 모델에 $x^2$ 같은 파생 특성을 더하면 모델이 곡선 관계를 표현할 수 있는 이유를 설명하고, 파생 특성을 많이 만들 때 생기는 위험 두 가지와 대책을 쓰라.",
      answer: md`
선형 회귀는 입력 특성의 선형결합 $w_1 x_1 + \cdots + w_d x_d + b$를 학습한다. $x^2$을 새 특성으로 주면 예측식이 $w_1 x + w_2 x^2 + b$가 되어, 파라미터에 대해서는 여전히 선형이지만 $x$에 대해서는 곡선이 된다. 모델을 바꾸지 않고 입력을 바꿔 표현할 수 있는 관계를 넓힌 것이다.

위험은 두 가지다. 첫째, 특성이 많아지면 학습 데이터의 잡음까지 맞추는 과적합이 생기기 쉽다. 추가한 특성의 효과를 검증 데이터나 교차검증으로 확인하고, 정규화로 계수의 크기를 제한한다. 둘째, 특성이 늘면 차원의 저주로 데이터가 공간에 희박해지고 거리 기반 방법이 약해진다. 효과가 없는 특성은 빼고, 필요하면 차원 축소를 한다. 파생 특성을 만들 때는 목표 변수로 계산한 값이 섞이지 않았는지도 확인한다.
`,
      keyPoints: ["예측식이 파라미터에 선형, x에 대해서는 곡선이 된다", "위험 1: 과적합 → 검증 데이터·정규화", "위험 2: 차원의 저주 → 특성 선택·차원 축소", "목표 변수로 만든 특성(누수)을 피한다"],
    },
  ],
  references: [
    { title: "scikit-learn — Feature selection", url: "https://scikit-learn.org/stable/modules/feature_selection.html", note: "분산 기준, 모델 기반 특성 선택 (영문)" },
    { title: "Google Machine Learning Crash Course — Feature crosses", url: "https://developers.google.com/machine-learning/crash-course/categorical-data/feature-crosses", note: "두 특성을 조합한 특성 (영문)" },
  ],
});
