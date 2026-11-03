import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/baselines";

export default defineLesson({
  id: "baselines",
  title: "기준 모델과 단순한 예측 기준",
  tier: "core",
  concepts: ["baselines"],
  goal: "회귀·분류·시계열 문제에서 기준 모델(평균·중앙값·다수 클래스·직전 값)을 만들어 점수를 계산하고, 모델의 점수를 기준 모델과 비교해 해석하며, 분할에 따른 점수의 흔들림과 구간별 오차 분석으로 다음 작업을 정한다.",
  why: "정확도 98%, 평균 오차 7천만 원 같은 숫자는 비교할 대상이 없으면 좋은지 나쁜지 알 수 없다. 기준 모델은 그 비교 대상이고, 모델을 만들기 전에 기준 모델의 점수부터 재 두면 코드 오류와 데이터 누수도 일찍 드러난다. 분류 지표([[lesson:classification-metrics]])와 결정계수 $R^2$([[lesson:linear-regression]])도 기준 모델과의 비교로 해석한다.",
  body: md`
### 기준 모델

**기준 모델**(baseline)은 입력을 쓰지 않거나 아주 단순한 규칙으로 예측하는 모델이다. 만들려는 모델은 적어도 기준 모델보다 나아야 하고, 기준 모델보다 얼마나 나은지가 그 모델의 가치다. 문제 유형마다 흔히 쓰는 기준 모델이 있다([[lesson:task-types]]).

| 문제 | 기준 모델 | 예측 방법 |
| --- | --- | --- |
| 회귀 | 평균·중앙값 | 학습 데이터 정답의 평균(또는 중앙값)을 모든 샘플에 똑같이 예측한다 |
| 분류 | 다수 클래스 | 학습 데이터에서 가장 많은 클래스를 모든 샘플에 예측한다 |
| 시계열 | 직전 값 | 바로 앞 시점의 값을 다음 값으로 예측한다. 주기가 있으면 한 주기 전의 값을 쓴다 |
| 공통 | 단순한 규칙·단순한 모델 | 현업에서 이미 쓰는 규칙, 특성 한두 개로 만든 선형 모델 |

기준 모델이 쓰는 평균·다수 클래스도 데이터에서 계산한 값이므로 학습 데이터로만 계산한다([[lesson:data-splits]]).

### 회귀: 평균을 예측하는 기준 모델

회귀의 오차는 여기서 **평균 절대 오차**(MAE) $\frac{1}{n}\sum_i |y_i - \hat y_i|$로 잰다. 예측이 정답에서 평균적으로 얼마나 떨어져 있는지를 정답과 같은 단위로 나타낸다. 다음 코드는 면적으로 집값(만 원)을 예측하는 선형회귀를, 학습 데이터 평균을 예측하는 기준 모델(\`DummyRegressor\`)과 비교한다.

\`\`\`python
import numpy as np
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

rng = np.random.default_rng(0)
area = rng.uniform(40, 140, 300)                       # 면적(m²)
price = 600 * area + rng.normal(0, 8000, 300)          # 가격(만 원)
X = area.reshape(-1, 1)
X_tr, X_te, y_tr, y_te = train_test_split(X, price, test_size=0.3, random_state=0)

base = DummyRegressor(strategy="mean").fit(X_tr, y_tr)   # 학습 데이터 평균을 예측
model = LinearRegression().fit(X_tr, y_tr)
mae_base = mean_absolute_error(y_te, base.predict(X_te))
mae_model = mean_absolute_error(y_te, model.predict(X_te))
print(round(mae_base), round(mae_model), round(1 - mae_model / mae_base, 3))   # 17429 6874 0.606
\`\`\`

모델의 MAE 6,874만 원만으로는 좋은지 판단하기 어렵지만, 기준 모델의 17,429만 원과 비교하면 오차를 60.6% 줄였다. 이 **기준 모델 대비 줄인 오차의 비율** $1 - E_{\text{모델}} / E_{\text{기준}}$은 0이면 기준 모델과 같고, 음수면 기준 모델보다 못하다. 오차를 평균제곱오차로, 기준 모델을 평균 예측으로 잡은 값이 결정계수 $R^2$다([[lesson:linear-regression]]).

평균 대신 중앙값을 예측하는 기준 모델도 있다. MAE를 가장 작게 하는 상수는 중앙값이므로([[lesson:summary-statistics]]), 이상치가 있는 데이터에서 MAE로 평가한다면 중앙값 기준 모델이 더 강하다.

### 분류: 다수 클래스를 예측하는 기준 모델

클래스가 불균형하면 다수 클래스만 예측해도 정확도가 높다. 사기 거래가 2%인 거래 1,000건의 평가 데이터에서 \`DummyClassifier(strategy="most_frequent")\`로 모든 거래를 정상으로 예측하면 정확도가 0.981이다. 이 데이터에서 정확도 97.5%인 모델은 기준 모델보다 못하고, 사기 거래를 하나도 찾지 못해도 정확도 98.1%가 나온다. 그래서 불균형한 분류에서는 실제 사기 거래 가운데 찾아낸 비율(재현율) 같은 지표를 함께 본다([[lesson:classification-metrics]]).

### 시계열: 직전 값을 예측하는 기준 모델

시간에 따라 변하는 값은 바로 앞의 값이 강한 기준 모델이다. 주기가 있으면 한 주기 전의 같은 시점 값이 더 강하다. 증가하는 추세와 주말 증가가 있는 일별 판매량 140일에서 마지막 4주를 세 가지 기준 모델로 예측하면 MAE가 다음과 같다(실습의 \`seasonal_naive\`로 같은 계산을 한다).

| 기준 모델 | 예측 | MAE |
| --- | --- | --- |
| 학습 기간 평균 | 처음 112일의 평균 | 35.8 |
| 어제 값 | $\hat y_t = y_{t-1}$ | 15.9 |
| 지난주 같은 요일 | $\hat y_t = y_{t-7}$ | 11.4 |

평균은 추세를 따라가지 못하고, 어제 값은 주말이 시작되고 끝나는 날에 크게 틀린다. 지난주 같은 요일 값은 추세와 주기를 모두 반영한다. 판매량 예측 모델은 이 가운데 가장 강한 기준 모델보다 나아야 의미가 있다.

### 기준 모델과의 비교로 오류를 찾는다

기준 모델의 점수를 먼저 재 두면 결과가 이상할 때 바로 알 수 있다.

- **모델이 기준 모델보다 못하다**: 특성과 정답의 행이 어긋났거나, 전처리가 학습·평가 데이터에 다르게 적용되었거나, 특성에 정답을 예측할 정보가 없을 가능성이 크다.
- **모델이 기준 모델보다 지나치게 좋다**: 어려운 문제에서 오차가 거의 0이면 누수부터 의심한다([[lesson:data-splits]]).

### 점수는 분할에 따라 흔들린다

테스트 데이터가 다르면 같은 모델도 점수가 달라진다. 다음 코드는 유방암 진단 데이터를 \`random_state\`만 바꿔 열 번 나누고, 같은 모델의 테스트 정확도를 잰다.

\`\`\`python
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X, y = load_breast_cancer(return_X_y=True)
scores = []
for seed in range(10):
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=seed)
    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_tr, y_tr)
    scores.append(model.score(X_te, y_te))
print(np.round(scores, 3))
print(f"최소 {min(scores):.3f}, 최대 {max(scores):.3f}")
# [0.982 0.991 0.982 0.974 0.974 0.982 0.991 0.965 0.974 1.   ]
# 최소 0.965, 최대 1.000
\`\`\`

테스트 데이터가 114개이면 샘플 하나가 정확도 0.9%p이고, 분할만 바꿔도 점수가 0.965에서 1.000까지 움직인다. 그래서 한 번의 분할에서 나온 0.5%p 차이로는 어느 모델이 낫다고 할 수 없다. 두 모델을 **같은 분할 여러 개**에서 평가해 차이가 같은 방향으로 나오는지 확인한다([[lesson:cross-validation]], [[lesson:model-evaluation-stats]]).

### 오차 분석

정확도·MAE 같은 집계 지표는 얼마나 틀렸는지는 알려 주지만 어디서, 왜 틀렸는지는 알려 주지 않는다. **오차 분석**은 검증 데이터에서 틀린 샘플을 직접 살펴보고, 공통점이 있는 샘플끼리 묶어 구간별로 지표를 비교하는 일이다. 진행 순서는 다음과 같다.

1. 검증 데이터에서 오차가 큰 샘플부터 살펴본다.
2. 공통점(지역, 기간, 입력 길이, 데이터 출처 등)으로 샘플을 구간으로 나눈다.
3. 구간마다 샘플 수와 지표를 계산해, 오차가 몰린 구간을 찾는다.
4. 원인에 맞는 다음 작업을 정한다. 특성 추가, 해당 구간의 데이터 수집, 레이블 오류 수정 등이다.

다음 데이터에서 신축 주택은 같은 면적이라도 가격이 30% 높은데, 모델은 면적만 쓴다.

\`\`\`python
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

rng = np.random.default_rng(1)
n = 400
df = pd.DataFrame({"area": rng.uniform(40, 140, n), "is_new": rng.random(n) < 0.2})
df["price"] = 600 * df["area"] * np.where(df["is_new"], 1.3, 1.0) + rng.normal(0, 3000, n)
train, val = train_test_split(df, test_size=0.3, random_state=0)

model = LinearRegression().fit(train[["area"]], train["price"])        # 면적만 사용
val = val.assign(abs_err=(val["price"] - model.predict(val[["area"]])).abs())
print(round(val["abs_err"].mean()))                                    # 5324
print(val.groupby("is_new")["abs_err"].agg(["count", "mean"]).round(0))
# is_new=False: 99개, 평균 절대 오차 3982 / is_new=True: 21개, 11650

model2 = LinearRegression().fit(train[["area", "is_new"]], train["price"])
print(round((val["price"] - model2.predict(val[["area", "is_new"]])).abs().mean()))   # 2842
\`\`\`

구간으로 나누면 샘플의 18%인 신축 주택의 오차가 나머지의 약 3배이고, 신축 여부를 특성으로 넣자 MAE가 5,324에서 2,842로 줄었다. 오차 분석은 검증 데이터로 한다. 테스트 데이터의 오답을 보고 모델을 고치면 테스트 점수가 실제보다 높아진다.

:::warn 흔한 실수
- **기준 모델 없이 점수를 보고한다.** 정확도 98%도 다수 클래스 기준 모델이 98.1%라면 의미가 없다. 기준 모델의 점수를 같은 표에 함께 적는다.
- **기준 모델의 통계를 전체 데이터로 계산한다.** 평균·다수 클래스도 학습 데이터로만 계산한다.
- **시계열에서 평균을 기준 모델로 쓴다.** 추세와 주기가 있으면 직전 값이나 한 주기 전 값이 더 강한 기준 모델이다.
- **한 번의 분할에서 나온 작은 점수 차이로 모델을 고른다.** 같은 분할 여러 개에서 차이가 일관되게 나오는지 확인한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "사기 거래가 2%인 데이터에서 어떤 모델의 테스트 정확도가 97.5%다. 가장 적절한 해석은?",
      choices: [
        "모든 거래를 정상으로 예측하는 기준 모델(약 98%)보다 못하다",
        "정확도가 95%를 넘으므로 좋은 모델이다",
        "사기 거래의 97.5%를 찾았다",
        "정확도는 불균형 데이터에서도 충분한 지표다",
      ],
      answer: 0,
      explanation: "다수 클래스만 예측해도 정확도가 약 98%다. 이 모델은 기준 모델보다 못하며, 사기 거래를 얼마나 찾았는지는 정확도로 알 수 없다.",
    },
    {
      key: "c2",
      question: "주말마다 판매량이 늘어나는 일별 데이터에서 다음 날 판매량을 예측할 때 가장 강한 기준 모델로 예상되는 것은?",
      choices: ["지난주 같은 요일의 값", "학습 기간 전체의 평균", "가장 많이 나온 판매량", "0"],
      answer: 0,
      explanation: "7일 주기가 있으므로 한 주기 전 같은 요일의 값이 주말 증가를 반영한다. 평균은 추세와 주기를 모두 반영하지 못한다.",
    },
    {
      key: "c3",
      question: "테스트 데이터 114개로 모델 A의 정확도가 0.974, 모델 B가 0.982였다. 가장 적절한 결론은?",
      choices: [
        "샘플 한 개 차이이므로, 같은 분할 여러 개에서 차이가 일관되게 나오는지 확인해야 한다",
        "B가 A보다 확실히 낫다",
        "A가 B보다 확실히 낫다",
        "두 모델 모두 기준 모델보다 못하다",
      ],
      answer: 0,
      explanation: "114개에서 정확도 0.009 차이는 샘플 한 개다. 같은 모델도 분할만 바꾸면 0.965~1.000 사이로 움직이므로 한 번의 분할로는 우열을 정할 수 없다.",
    },
    {
      key: "c4",
      question: "주택 가격 예측 모델을 만들었더니 테스트 MAE가 평균 기준 모델보다 크게 나왔다. 가장 먼저 확인할 것은?",
      choices: [
        "특성과 정답의 행이 어긋났는지, 전처리가 학습·평가 데이터에 같게 적용되었는지",
        "모델의 층 수를 늘린다",
        "테스트 데이터를 바꿔 점수가 좋아질 때까지 다시 나눈다",
        "기준 모델의 점수를 보고서에서 뺀다",
      ],
      answer: 0,
      explanation: "기준 모델보다 못한 결과는 코드 오류의 신호인 경우가 많다. 테스트 데이터를 다시 나눠 좋은 점수를 고르는 것은 테스트 데이터를 고르는 데 쓰는 일이다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
y_train = np.array([1, 2, 3, 4, 100])
y_test = np.array([2, 3, 4])
for c in [y_train.mean(), np.median(y_train)]:
    print(c, round(np.mean(np.abs(y_test - c)), 3))
`,
      expected: "22.0 19.0\n3.0 0.667",
      explanation: "이상치 100 때문에 학습 데이터 평균은 22.0이고, 평균 기준 모델의 MAE는 $(20 + 19 + 18)/3 = 19$다. 중앙값은 3.0이고 MAE는 $(1 + 0 + 1)/3 \\approx 0.667$이다. MAE로 평가할 때 이상치가 있으면 중앙값 기준 모델이 더 강하다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "어떤 팀이 \"정확도 98%인 모델을 만들었다\"고 보고했다. 이 숫자만으로 모델이 좋은지 판단할 수 없는 이유를 기준 모델과 연결해 설명하라. 회귀·분류·시계열 문제마다 함께 보고해야 할 기준 모델도 하나씩 쓰라.",
      answer: md`
점수는 비교할 대상이 있어야 해석할 수 있다. 사기 거래가 2%인 데이터라면 모든 샘플을 다수 클래스(정상)로 예측하는 기준 모델도 정확도가 98%이므로, 98%는 아무것도 학습하지 않은 것과 같은 결과일 수 있다. 그래서 같은 테스트 데이터에서 기준 모델의 점수를 함께 보고하고, 기준 모델 대비 얼마나 나은지로 모델을 평가한다.

회귀는 학습 데이터 정답의 평균(또는 중앙값)을 예측하는 기준 모델, 분류는 학습 데이터의 다수 클래스를 예측하는 기준 모델, 시계열은 직전 값이나 한 주기 전 값을 예측하는 기준 모델을 함께 보고한다. 기준 모델의 통계도 학습 데이터로만 계산한다.
`,
      keyPoints: [
        "불균형 데이터에서는 다수 클래스 예측만으로 정확도가 높다",
        "같은 테스트 데이터에서 기준 모델 점수와 비교한다",
        "회귀: 평균·중앙값, 분류: 다수 클래스, 시계열: 직전 값·한 주기 전 값",
        "기준 모델의 통계도 학습 데이터로 계산한다",
      ],
    },
    {
      key: "d2",
      question: "배달 소요 시간 예측 모델의 검증 MAE가 9분이다. 오차 분석을 어떤 순서로 진행할지 쓰고, 분석 결과 비 오는 날의 오차가 다른 날의 세 배로 나왔을 때 할 수 있는 다음 작업을 두 가지 쓰라. 오차 분석에 테스트 데이터를 쓰지 않는 이유도 쓰라.",
      answer: md`
검증 데이터에서 오차가 큰 주문부터 살펴보고, 공통점(날씨, 시간대, 지역, 거리 등)으로 주문을 구간으로 나눈다. 구간마다 주문 수와 MAE를 계산해 오차가 몰린 구간을 찾는다.

비 오는 날의 오차가 세 배라면, 강수 여부나 강수량을 특성으로 추가하거나, 비 오는 날의 주문이 적다면 해당 데이터를 더 모은다. 비 오는 날의 실제 소요 시간 기록이 잘못되었는지도 확인한다.

오차 분석의 결과로 모델을 고치므로, 테스트 데이터로 분석하면 테스트 데이터가 모델을 고르고 고치는 데 쓰인다. 그러면 테스트 점수가 새 데이터에서의 성능보다 높게 나오므로 오차 분석은 검증 데이터로 한다.
`,
      keyPoints: [
        "오차가 큰 샘플부터 살펴보고 공통점으로 구간을 나눈다",
        "구간별 샘플 수와 지표를 비교한다",
        "특성 추가·데이터 수집·레이블 확인 같은 원인별 작업",
        "테스트 데이터로 분석하면 테스트 점수가 실제보다 높아진다",
      ],
    },
  ],
  references: [
    { title: "scikit-learn — Dummy estimators", url: "https://scikit-learn.org/stable/modules/model_evaluation.html#dummy-estimators", note: "DummyClassifier·DummyRegressor의 전략 (영문)" },
    { title: "Google — Rules of Machine Learning", url: "https://developers.google.com/machine-learning/guides/rules-of-ml", note: "단순한 기준부터 시작하기, 오차 분석에 관한 실무 규칙 (영문)" },
    { title: "Hyndman & Athanasopoulos — Forecasting: Principles and Practice, Some simple forecasting methods", url: "https://otexts.com/fpp3/simple-methods.html", note: "평균·직전 값·계절 직전 값 기준 모델 (영문)" },
  ],
});
