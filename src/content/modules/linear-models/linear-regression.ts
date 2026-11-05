import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/linear-regression";

export default defineLesson({
  id: "linear-regression",
  title: "선형회귀, 잔차, 평균제곱오차",
  tier: "core",
  concepts: ["linear-regression"],
  goal: "다중 선형회귀의 가중치를 해석하고 최소제곱 해를 계산하며, 잔차 그래프로 모델을 진단해 다항 특성을 추가하고, MAE·MSE·RMSE·$R^2$로 평가해 기준 모델과 비교한다.",
  why: "선형회귀는 가장 단순한 지도학습 모델이면서, 가중치를 직접 읽을 수 있어 결과를 설명하기 쉽다. 학습 방법(손실 최소화)과 진단 방법(잔차)은 로지스틱 회귀([[lesson:logistic-regression]])와 신경망([[lesson:perceptron-mlp]])에도 그대로 이어지고, 신경망의 각 층도 선형 변환에 비선형 함수를 붙인 것이다.",
  body: md`
### 선형회귀 모델

**선형회귀**는 특성마다 가중치를 곱해 더하고 편향을 더해 연속값을 예측한다([[lesson:ml-terms]]).

\`\`\`math
\hat y = w_1 x_1 + w_2 x_2 + \cdots + w_d x_d + b = w^\top x + b
\`\`\`

가중치 $w_j$는 "다른 특성이 그대로일 때 $x_j$가 1 늘면 예측이 $w_j$만큼 바뀐다"는 뜻이다. 집값(만 원)을 면적(m²)과 역까지 거리(km)로 예측하는 모델에서 $w_{\text{면적}} = 600$이면, 역까지 거리가 같은 두 집 가운데 면적이 1m² 넓은 쪽을 600만 원 높게 예측한다. 가중치의 크기는 특성의 단위에 따라 달라지므로, 특성끼리 중요도를 비교하려면 표준화한 뒤 비교한다([[lesson:encoding-scaling]]). 특성끼리 상관이 강하면 같은 정보를 어느 특성이 나눠 가질지 정해지지 않아 가중치가 불안정해진다([[lesson:regularization]]).

### 최소제곱 해

선형회귀는 평균제곱오차를 최소화하는 $w$와 $b$를 찾는다([[lesson:loss-functions]]). 특성 행렬 $X$에 1로 채운 열을 붙여 편향을 가중치 하나로 합치면, 해는 **정규방정식**으로 한 번에 계산된다.

\`\`\`math
w^{*} = (X^\top X)^{-1} X^\top y
\`\`\`

실제 계산에서는 역행렬을 직접 구하지 않고 \`np.linalg.lstsq\`나 scikit-learn의 \`LinearRegression\`을 쓴다. 두 방법은 같은 해를 수치적으로 안정되게 구한다. 특성이 수십만 개이거나 데이터가 메모리에 다 들어가지 않으면 경사하강법으로 같은 해에 다가간다([[lesson:gradient-descent]]).

\`\`\`python
import numpy as np
from sklearn.linear_model import LinearRegression

rng = np.random.default_rng(0)
n = 200
area = rng.uniform(40, 140, n)                         # 면적(m²)
dist = rng.uniform(0.2, 3.0, n)                        # 역까지 거리(km)
price = 600 * area - 4000 * dist + 5000 + rng.normal(0, 4000, n)
X = np.column_stack([area, dist])

A = np.column_stack([X, np.ones(n)])                   # 편향을 위한 1 열
coef, *_ = np.linalg.lstsq(A, price, rcond=None)
print(np.round(coef, 1))                               # [  598.6 -3689.2  4754.3]: w_면적, w_거리, b

model = LinearRegression().fit(X, price)
print(np.round(model.coef_, 1), round(model.intercept_, 1))   # [  598.6 -3689.2] 4754.3
\`\`\`

데이터를 만든 값(600, −4000, 5000)과 조금 다른 것은 잡음 때문이다. 해석하면 "거리가 같을 때 면적 1m²당 약 599만 원, 면적이 같을 때 역에서 1km 멀어질 때마다 약 3,689만 원 낮게 예측한다"이다.

### 잔차로 진단한다

샘플마다 정답과 예측의 차이 $e_i = y_i - \hat y_i$를 **잔차**라고 한다. 예측값을 가로축, 잔차를 세로축에 그린 **잔차 그래프**에서 잔차가 0을 중심으로 고르게 퍼져 있으면 선형 모델이 관계를 잘 나타낸 것이다. 일정한 모양이 보이면 모델이 나타내지 못한 구조가 남아 있다.

[[diagram:residual-patterns]]

다음 데이터는 실제 관계가 곡선이다. 직선으로 학습한 뒤 예측값을 낮은·중간·높은 세 구간으로 나눠 평균 잔차를 보면, 양 끝은 양수이고 가운데는 음수인 곡선 모양이 나온다. $x^2$을 특성으로 추가하면 세 구간 모두 0 근처가 된다.

\`\`\`python
import numpy as np
from sklearn.linear_model import LinearRegression

rng = np.random.default_rng(1)
x = rng.uniform(0, 10, 300)
y = 0.5 * x ** 2 - 2 * x + 3 + rng.normal(0, 2, 300)   # 실제 관계는 곡선

def binned_residuals(X, y):
    pred = LinearRegression().fit(X, y).predict(X)
    bins = np.digitize(pred, np.quantile(pred, [1 / 3, 2 / 3]))   # 예측값 기준 세 구간
    return [round(float((y - pred)[bins == k].mean()), 2) for k in range(3)]

print(binned_residuals(x.reshape(-1, 1), y))           # [1.89, -3.55, 1.66]: 곡선 모양
print(binned_residuals(np.column_stack([x, x ** 2]), y))   # [-0.05, 0.13, -0.08]
\`\`\`

$\hat y = w_1 x + w_2 x^2 + b$는 $x$에 대해서는 곡선이지만 파라미터 $w_1, w_2, b$에 대해서는 여전히 선형이므로, $x^2$을 새 특성으로 보면 같은 최소제곱법으로 학습된다. 이것을 **다항회귀**라 하고, scikit-learn에서는 \`PolynomialFeatures\`로 특성을 만든다. 차수를 너무 높이면 학습 데이터의 잡음까지 따라가는 과적합이 생기므로, 차수는 검증 데이터로 고르는 하이퍼파라미터다([[lesson:bias-variance]]).

### 회귀 지표

잔차를 수 하나로 요약하는 지표는 다음과 같다. $\bar y$는 정답의 평균이다.

\`\`\`math
\text{MAE} = \frac{1}{n}\sum_i |y_i - \hat y_i| \qquad \text{MSE} = \frac{1}{n}\sum_i (y_i - \hat y_i)^2 \qquad \text{RMSE} = \sqrt{\text{MSE}} \qquad R^2 = 1 - \frac{\sum_i (y_i - \hat y_i)^2}{\sum_i (y_i - \bar y)^2}
\`\`\`

정답 $y = [3, 5, 7, 9]$, 예측 $\hat y = [2.5, 5.5, 6, 10]$이면 오차가 $0.5, -0.5, 1, -1$이므로 MAE $= 0.75$, MSE $= 0.625$, RMSE $\approx 0.791$이다. RMSE는 MSE에 제곱근을 씌워 정답과 같은 단위로 되돌린 값이다. $R^2$의 분모는 항상 평균 $\bar y = 6$을 예측하는 기준 모델의 오차 제곱합 $9 + 1 + 1 + 9 = 20$이고, 분자는 모델의 오차 제곱합 $2.5$이므로 $R^2 = 1 - 2.5/20 = 0.875$다. $R^2$는 기준 모델 대비 줄인 오차의 비율이다([[lesson:baselines]]).

[[diagram:r2-squares]]

평균만 예측하면 $R^2 = 0$이고, 그보다 못하면 **음수**다. 학습 데이터에서는 편향이 있는 선형회귀의 $R^2$가 0보다 작아지지 않지만, 검증·테스트 데이터에서는 음수가 흔히 나온다.

| 지표 | 성질 | 쓰는 경우 |
| --- | --- | --- |
| MAE | 정답과 같은 단위, 이상치의 영향이 작다 | 오차의 평균 크기를 그대로 보고할 때 |
| RMSE | 정답과 같은 단위, 큰 오차를 크게 반영한다 | 가끔 크게 틀리는 것이 특히 문제일 때 |
| $R^2$ | 기준 모델(평균) 대비 줄인 오차의 비율 | 단위가 다른 문제끼리 비교하거나 설명력을 말할 때 |

MAE와 RMSE를 함께 보면 오차의 분포를 짐작할 수 있다. RMSE가 MAE보다 훨씬 크면 소수의 큰 오차가 섞여 있다.

:::warn 흔한 실수
- **단위가 다른 특성의 가중치 크기를 그대로 비교한다.** 표준화한 뒤 비교한다.
- **잔차 그래프를 보지 않고 지표만 본다.** $R^2$가 높아도 잔차에 곡선 모양이 남아 있으면 모델이 놓친 관계가 있다.
- **$R^2$는 0에서 1 사이라고 생각한다.** 평가 데이터에서는 기준 모델보다 못하면 음수가 된다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "집값(만 원) 모델에서 $w_{\\text{면적}} = 600$, $w_{\\text{거리}} = -3700$이다. 옳은 해석은?",
      choices: [
        "거리가 같을 때 면적이 1m² 넓으면 600만 원 높게 예측한다",
        "면적이 거리보다 6배 덜 중요하다",
        "면적이 1m² 넓으면 실제 가격이 반드시 600만 원 오른다",
        "거리가 1km 늘면 예측이 3,700만 원 높아진다",
      ],
      answer: 0,
      explanation: "가중치는 다른 특성이 그대로일 때의 예측 변화다. 단위가 다르므로 가중치 크기로 중요도를 비교할 수 없고, 거리 가중치가 음수이므로 거리가 늘면 예측이 낮아진다.",
    },
    {
      key: "c2",
      question: "잔차 그래프에서 예측값이 작거나 클 때는 잔차가 양수, 중간일 때는 음수인 곡선 모양이 보인다. 가장 알맞은 다음 작업은?",
      choices: [
        "모델이 나타내지 못한 비선형 관계가 있으므로 $x^2$ 같은 특성을 추가한다",
        "문제가 없으므로 그대로 쓴다",
        "학습률을 낮춘다",
        "잔차가 큰 샘플을 모두 지운다",
      ],
      answer: 0,
      explanation: "곡선 모양의 잔차는 직선이 데이터의 곡선 관계를 따라가지 못한다는 뜻이다. 다항 특성을 추가하면 같은 최소제곱법으로 곡선을 나타낼 수 있다.",
    },
    {
      key: "c3",
      question: "다항회귀 $\\hat y = w_0 + w_1 x + w_2 x^2$를 선형회귀와 같은 방법으로 학습할 수 있는 이유는?",
      choices: ["파라미터 $w$에 대해 선형이기 때문", "$x$에 대해 선형이기 때문", "차수가 2 이하이기 때문", "정답이 항상 양수이기 때문"],
      answer: 0,
      explanation: "$x^2$을 새 특성으로 보면 예측은 파라미터의 선형 결합이다. 그래서 최소제곱 해와 경사하강법을 그대로 쓴다.",
    },
    {
      key: "c4",
      question: "테스트 데이터에서 회귀 모델의 $R^2$가 $-0.3$으로 나왔다. 옳은 해석은?",
      choices: [
        "학습 데이터 평균을 항상 예측하는 기준 모델보다 오차가 크다",
        "계산 오류다. $R^2$는 항상 0 이상이다",
        "모델이 변동의 30%를 설명한다",
        "모델이 과소적합이 아니라는 뜻이다",
      ],
      answer: 0,
      explanation: "$R^2 = 1 - (\\text{모델 오차}) / (\\text{기준 모델 오차})$이므로 모델 오차가 기준 모델보다 크면 음수다.",
    },
    {
      key: "c5",
      question: "어떤 회귀 모델의 MAE는 2인데 RMSE는 10이다. 가장 타당한 해석은?",
      choices: [
        "대부분은 작게 틀리지만 소수의 큰 오차가 섞여 있다",
        "모든 샘플을 고르게 10씩 틀린다",
        "두 지표는 항상 같으므로 계산이 틀렸다",
        "모델이 정답을 모두 맞혔다",
      ],
      answer: 0,
      explanation: "RMSE는 오차를 제곱해 평균하므로 큰 오차에 민감하다. 오차가 고르면 두 값이 비슷하고, RMSE가 훨씬 크면 큰 오차가 몇 개 있다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
y = np.array([2.0, 4.0, 6.0])
for y_hat in [np.array([4.0, 4.0, 4.0]), np.array([2.0, 4.0, 7.0])]:
    print(round(1 - np.sum((y - y_hat) ** 2) / np.sum((y - y.mean()) ** 2), 3))
`,
      expected: "0.0\n0.875",
      explanation: "첫 예측은 평균 4를 그대로 예측하는 기준 모델이라 $R^2 = 0$이다. 둘째는 오차 제곱합이 $0 + 0 + 1 = 1$이고 기준 모델의 오차 제곱합이 $4 + 0 + 4 = 8$이므로 $1 - 1/8 = 0.875$다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$R^2$를 평균제곱오차와 기준 모델로 설명하고, 테스트 데이터에서 $R^2$가 음수로 나오는 경우가 무엇을 뜻하는지 쓰라. 정답 $y = [3, 5, 7, 9]$, 예측 $[2.5, 5.5, 6, 10]$의 $R^2$도 계산하라.",
      answer: md`
$R^2 = 1 - \text{MSE}_{\text{모델}} / \text{MSE}_{\text{기준}}$이다. 기준 모델은 항상 정답의 평균을 예측하는 모델이고, $R^2$는 모델이 이 기준 모델의 오차를 얼마나 줄였는지를 나타낸다. 평균만 예측하면 0, 오차가 없으면 1이다. 테스트 데이터에서 음수가 나오면 모델의 오차가 평균만 예측하는 것보다 크다는 뜻으로, 과적합이나 학습·평가 데이터의 분포 차이, 코드 오류를 의심한다.

예에서 평균은 6이고 기준 모델의 오차 제곱합은 $9 + 1 + 1 + 9 = 20$, 모델의 오차 제곱합은 $0.25 + 0.25 + 1 + 1 = 2.5$이므로 $R^2 = 1 - 2.5/20 = 0.875$다.
`,
      keyPoints: [
        "$R^2 = 1 - \\text{MSE}_{\\text{모델}}/\\text{MSE}_{\\text{기준}}$",
        "기준 모델은 정답의 평균을 예측한다",
        "음수는 기준 모델보다 오차가 크다는 뜻",
        "예제 계산: $1 - 2.5/20 = 0.875$",
      ],
    },
    {
      key: "d2",
      question: "잔차 그래프에서 볼 수 있는 모양 세 가지(고르게 퍼짐, 곡선, 깔때기)가 각각 무엇을 뜻하는지 쓰고, 곡선과 깔때기 모양일 때 할 수 있는 조치를 하나씩 쓰라.",
      answer: md`
잔차가 0을 중심으로 고르게 퍼져 있으면 선형 모델이 관계를 잘 나타낸 것이다. 곡선 모양이면 모델이 나타내지 못한 비선형 관계가 남아 있으므로, $x^2$ 같은 다항 특성이나 구간을 나타내는 특성을 추가한다. 깔때기 모양은 예측값이 클수록 오차가 커지는 경우로, 집값처럼 값이 클수록 변동도 큰 데이터에서 나타난다. 정답에 로그를 씌워 학습하거나 상대 오차로 평가한다.
`,
      keyPoints: [
        "고르게 퍼짐: 문제가 보이지 않음",
        "곡선: 빠진 비선형 관계, 다항 특성 추가",
        "깔때기: 예측이 클수록 오차가 큼",
        "깔때기 조치: 로그 변환 또는 상대 오차",
      ],
    },
  ],
  references: [
    { title: "ISLP (An Introduction to Statistical Learning with Python) — 3장 Linear Regression", url: "https://www.statlearning.com/", note: "가중치 해석, 잔차 그래프, 다항회귀 (영문, 무료 PDF)" },
    { title: "scikit-learn — Linear Models: Ordinary Least Squares", url: "https://scikit-learn.org/stable/modules/linear_model.html#ordinary-least-squares", note: "LinearRegression과 최소제곱 (영문)" },
    { title: "scikit-learn — Regression metrics", url: "https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics", note: "MAE·MSE·R²의 정의 (영문)" },
  ],
});
