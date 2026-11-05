import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/regularization";

export default defineLesson({
  id: "regularization",
  title: "L1·L2 규제, 조기 종료, 학습 곡선",
  tier: "core",
  concepts: ["regularization"],
  goal: "L2·L1 규제가 가중치를 줄이는 방식과 L1이 희소한 해를 만드는 이유를 설명하고, 규제 세기를 바꿔 가며 검증 오차로 고르며, 검증 손실로 학습을 멈추는 조기 종료를 구현하고, 학습 곡선으로 데이터를 더 모을지 모델을 바꿀지 판단한다.",
  why: "분산이 큰 모델을 고치는 가장 흔한 방법이 규제다([[lesson:bias-variance]]). 신경망 학습의 가중치 감쇠와 조기 종료([[lesson:training-schedules]]), 드롭아웃([[lesson:dropout-residual]])도 같은 목적으로 쓴다. 학습 곡선은 데이터를 더 모을지, 모델을 바꿀지라는 비용이 큰 결정을 내리는 근거가 된다.",
  body: md`
### 목적함수에 규제항을 더한다

**규제**는 목적함수에 가중치의 크기에 대한 항을 더해, 학습 데이터에 맞추는 것과 가중치를 작게 유지하는 것 사이에서 균형을 잡게 하는 방법이다([[lesson:loss-functions]]).

\`\`\`math
\text{L2(Ridge)}: \; J(w) = L(w) + \lambda \lVert w \rVert_2^2 = L(w) + \lambda \sum_j w_j^2 \qquad \text{L1(Lasso)}: \; J(w) = L(w) + \lambda \lVert w \rVert_1 = L(w) + \lambda \sum_j |w_j|
\`\`\`

$\lambda$가 클수록 가중치가 작아져 모델이 단순해진다. 편향 $b$는 예측의 전체 수준을 정할 뿐이므로 규제하지 않는다. 규제항은 가중치의 크기를 그대로 더하므로 특성의 단위에 따라 규제가 다르게 걸린다. 그래서 규제를 쓰기 전에 특성을 표준화한다([[lesson:encoding-scaling]]). scikit-learn의 \`Ridge\`·\`Lasso\`는 \`alpha\`가 $\lambda$이고, \`LogisticRegression\`의 \`C\`는 $1/\lambda$에 해당해 **작을수록** 규제가 강하다.

### L2와 L1의 차이: 희소성

규제항의 기울기를 보면 두 방법의 차이가 드러난다. L2 항 $\lambda w_j^2$의 기울기 $2\lambda w_j$는 가중치에 비례하므로, 큰 가중치는 많이, 작은 가중치는 조금 줄인다. 가중치가 0에 가까워질수록 줄이는 양도 0에 가까워지므로 정확히 0이 되는 경우는 드물다. L1 항 $\lambda |w_j|$의 기울기는 가중치의 크기와 관계없이 $\pm\lambda$로 일정하다. 손실을 줄이는 효과가 $\lambda$보다 작은 가중치는 정확히 0이 되므로, L1은 일부 특성을 모델에서 빼는 **희소한** 해를 만든다.

특성 10개 가운데 3개만 정답과 관계있는 데이터(샘플 100개)로 학습하면, 규제 없는 선형회귀와 \`Ridge(alpha=10)\`은 관계없는 특성 7개에도 $-0.11$에서 $0.12$ 사이의 작은 가중치를 남기지만, \`Lasso(alpha=0.3)\`는 그 7개의 가중치를 모두 정확히 0으로 만든다. 그래서 L1은 특성 선택에도 쓴다([[lesson:feature-engineering]]).

[[diagram:l1-l2-geometry]]

### 규제 세기 고르기

$\lambda$는 하이퍼파라미터이므로 검증 데이터로 고른다([[lesson:data-splits]]). 다음 코드는 편향·분산 레슨의 데이터에 12차 다항 특성을 만들고 \`Ridge\`의 \`alpha\`를 바꿔 가며 두 오차를 잰다.

\`\`\`python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import Ridge

rng = np.random.default_rng(0)
x = np.sort(rng.uniform(0, 1, 30))[:, None]
y = np.sin(2 * np.pi * x[:, 0]) + rng.normal(0, 0.2, 30)
xtr, xva, ytr, yva = train_test_split(x, y, test_size=0.4, random_state=0)

for a in [1e-8, 1e-4, 1e-2, 1, 10]:
    model = make_pipeline(PolynomialFeatures(12), StandardScaler(), Ridge(alpha=a)).fit(xtr, ytr)
    tr = np.mean((model.predict(xtr) - ytr) ** 2)
    va = np.mean((model.predict(xva) - yva) ** 2)
    print(f"alpha {a:g}: 학습 오차 {tr:.4f}, 검증 오차 {va:.4f}")
# alpha 1e-08: 학습 오차 0.0142, 검증 오차 0.0780
# alpha 0.0001: 학습 오차 0.0185, 검증 오차 0.0477
# alpha 0.01: 학습 오차 0.0201, 검증 오차 0.0417
# alpha 1: 학습 오차 0.1474, 검증 오차 0.0693
# alpha 10: 학습 오차 0.2160, 검증 오차 0.0671
\`\`\`

\`alpha\`를 키울수록 학습 데이터에 맞추는 자유가 줄어 학습 오차는 커진다. 검증 오차는 \`alpha\`가 아주 작을 때는 분산 때문에, 아주 클 때는 편향 때문에 크고 0.01에서 가장 작다. 차수를 낮추는 것과 같은 효과를, 12차 항을 그대로 둔 채 계수의 크기로 연속적으로 조절한 것이다.

### 조기 종료

경사하강법으로 학습할 때는 반복 횟수도 복잡도를 정한다. 반복할수록 학습 손실은 계속 줄지만, 검증 손실은 어느 지점부터 다시 커진다. **조기 종료**(early stopping)는 반복마다 검증 손실을 재고, 가장 작았던 시점의 파라미터를 결과로 쓰는 방법이다. 실제로는 검증 손실이 정해진 횟수(**patience**) 동안 나아지지 않으면 학습을 멈춘다.

\`\`\`python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures

rng = np.random.default_rng(0)
x = np.sort(rng.uniform(0, 1, 30))[:, None]
y = np.sin(2 * np.pi * x[:, 0]) + rng.normal(0, 0.2, 30)
xtr, xva, ytr, yva = train_test_split(x, y, test_size=0.4, random_state=0)
prep = make_pipeline(PolynomialFeatures(12, include_bias=False), StandardScaler()).fit(xtr)
A, B = prep.transform(xtr), prep.transform(xva)        # 12차 특성(규제 없음)

w, b = np.zeros(A.shape[1]), 0.0
best_val, best_epoch = np.inf, 0
for epoch in range(1, 20001):
    r = A @ w + b - ytr
    w, b = w - 0.1 * A.T @ r / len(ytr), b - 0.1 * r.mean()   # 평균제곱오차의 경사하강법
    val = np.mean((B @ w + b - yva) ** 2)
    if val < best_val:
        best_val, best_epoch = val, epoch
    if epoch in (1, 1000, 3000, 10000, 20000):
        print(epoch, round(float(np.mean((A @ w + b - ytr) ** 2)), 4), round(float(val), 4))
print("검증 손실이 가장 작은 반복:", best_epoch, round(float(best_val), 4))
# 1 0.3945 0.1792
# 1000 0.0686 0.0451
# 3000 0.0248 0.0321
# 10000 0.0189 0.0551
# 20000 0.0188 0.0551
# 검증 손실이 가장 작은 반복: 2081 0.0278
\`\`\`

학습 손실은 끝까지 줄지만 검증 손실은 2,081번째 반복에서 0.0278로 가장 작고 이후 0.0551까지 커진다. 그 시점의 파라미터를 쓰면 규제항 없이도 검증 오차가 작은 모델을 얻는다. 조기 종료에 쓴 검증 데이터는 고르는 데 쓰였으므로, 최종 성능은 테스트 데이터로 다시 잰다.

### 학습 곡선: 데이터를 늘리면 나아지는가

**학습 곡선**은 학습 데이터의 양을 늘려 가며 학습 오차와 검증 오차를 함께 그린 그래프다. 데이터를 더 모으는 데는 비용이 들므로, 그 비용을 들일지 먼저 학습 곡선으로 판단한다. 다음 표는 같은 사인 곡선 데이터에서 학습 데이터 수를 바꿔 가며 잰 평균제곱오차다(잡음의 분산은 0.04).

| 학습 데이터 수 | 차수 1: 학습 / 검증 | 차수 9: 학습 / 검증 |
| --- | --- | --- |
| 15 | 0.226 / 0.296 | 0.009 / 28.585 |
| 30 | 0.245 / 0.240 | 0.018 / 0.048 |
| 100 | 0.196 / 0.248 | 0.032 / 0.043 |
| 1,000 | 0.234 / 0.236 | 0.046 / 0.041 |

[[diagram:learning-curves]]

차수 9(분산이 큰 모델)는 데이터가 적을 때 학습 오차와 검증 오차의 차이가 크고, 데이터가 늘수록 차이가 줄어 잡음 수준(0.04)에 다가간다. 이런 모델은 데이터를 더 모으면 나아진다. 차수 1(편향이 큰 모델)은 두 오차가 0.24 근처에서 일찍 만나 더 내려가지 않는다. 데이터를 아무리 늘려도 그 아래로 내려가지 않으므로 더 복잡한 모델이나 더 나은 특성이 필요하다. scikit-learn의 \`learning_curve\`가 이 계산을 교차검증으로 해 준다.

:::warn 흔한 실수
- **표준화하지 않고 규제한다.** 단위가 큰 특성의 가중치는 작게 나와 규제를 거의 받지 않고, 단위가 작은 특성만 강하게 규제된다.
- **\`LogisticRegression\`의 \`C\`를 키우면 규제가 강해진다고 생각한다.** \`C\`는 $1/\lambda$이므로 키우면 규제가 약해진다.
- **조기 종료에 쓴 검증 손실을 최종 성능으로 보고한다.** 멈출 시점을 고르는 데 썼으므로 실제보다 낮게 나온다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "L1 규제(Lasso)가 일부 가중치를 정확히 0으로 만드는 이유는?",
      choices: [
        "규제항의 기울기가 가중치 크기와 관계없이 $\\pm\\lambda$로 일정해, 손실을 줄이는 효과가 그보다 작은 가중치는 0이 되기 때문",
        "규제항의 기울기가 가중치 크기에 비례하기 때문",
        "가중치를 제곱해서 더하기 때문",
        "학습률이 크기 때문",
      ],
      answer: 0,
      explanation: "L2의 기울기 $2\\lambda w$는 0에 가까울수록 약해져 정확히 0에 닿기 어렵지만, L1은 일정한 크기로 0 쪽으로 줄여 희소한 해를 만든다.",
    },
    {
      key: "c2",
      question: "L2 규제에서 $\\lambda$를 아주 크게 하면 모델은 어떻게 되는가?",
      choices: [
        "가중치가 모두 0에 가까워져 과소적합(편향이 큼)에 가까워진다",
        "과적합이 심해진다",
        "학습 오차가 0이 된다",
        "아무 영향이 없다",
      ],
      answer: 0,
      explanation: "규제항이 목적함수를 지배해 가중치를 작게 만드는 것이 우선이 되므로, 모델이 거의 상수 예측처럼 단순해진다.",
    },
    {
      key: "c3",
      question: "12차 다항 특성에 Ridge를 적용하고 `alpha`를 `1e-8`에서 `10`까지 키울 때 **학습** 오차는 대체로 어떻게 되는가?",
      choices: ["커진다", "계속 줄어든다", "U자 모양을 그린다", "변하지 않는다"],
      answer: 0,
      explanation: "규제가 강할수록 학습 데이터에 맞추는 자유가 줄어 학습 오차가 커진다. U자 모양을 그리는 것은 검증 오차다.",
    },
    {
      key: "c4",
      question: "학습 데이터를 늘려도 학습 오차와 검증 오차가 둘 다 0.24 근처에서 만나 더 내려가지 않는다. 가장 알맞은 처방은?",
      choices: ["더 복잡한 모델이나 더 나은 특성을 쓴다", "데이터를 10배 더 모은다", "규제를 더 강하게 한다", "검증 데이터를 줄인다"],
      answer: 0,
      explanation: "두 곡선이 높은 곳에서 만나는 것은 편향이 큰 신호다. 데이터를 늘려도 이 높이는 내려가지 않고, 규제를 강하게 하면 더 단순해진다.",
    },
    {
      key: "c5",
      question: "조기 종료를 쓸 때 최종 모델로 남길 파라미터는?",
      choices: [
        "검증 손실이 가장 작았던 반복의 파라미터",
        "마지막 반복의 파라미터",
        "학습 손실이 가장 작았던 반복의 파라미터",
        "첫 반복의 파라미터",
      ],
      answer: 0,
      explanation: "학습 손실은 반복할수록 계속 줄어들므로 기준이 될 수 없다. 검증 손실이 가장 작은 시점이 새 데이터에서 가장 잘 예측하는 시점의 추정이다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
val = [0.90, 0.60, 0.45, 0.42, 0.44, 0.47, 0.50]
best = min(range(len(val)), key=lambda i: val[i])
print(best, val[best])
`,
      expected: "3 0.42",
      explanation: "반복마다 잰 검증 손실 가운데 가장 작은 값은 위치 3의 0.42다. 조기 종료는 이 시점의 파라미터를 남기고, 이후 검증 손실이 커지는 구간은 과적합이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "L1 규제와 L2 규제가 가중치에 주는 영향의 차이를 규제항의 기울기로 설명하고, 관계없는 특성이 많이 섞인 데이터에서 어느 쪽을 쓰는 것이 유리한지 쓰라.",
      answer: md`
L2 항 $\lambda w_j^2$의 기울기는 $2\lambda w_j$로 가중치에 비례한다. 큰 가중치는 많이, 작은 가중치는 조금 줄이므로 모든 가중치가 고르게 작아지지만, 0에 가까워질수록 줄이는 양도 작아져 정확히 0이 되는 경우는 드물다. L1 항 $\lambda|w_j|$의 기울기는 가중치 크기와 관계없이 $\pm\lambda$다. 손실을 줄이는 효과가 $\lambda$보다 작은 가중치는 정확히 0이 되어 그 특성이 모델에서 빠진다.

관계없는 특성이 많이 섞여 있으면 L1이 유리하다. 관계없는 특성의 가중치를 0으로 만들어 특성 선택과 같은 효과를 내고, 남은 특성으로 모델을 해석하기도 쉽다. 반대로 서로 상관이 강한 특성이 여럿이면 L1은 그중 하나만 남기고 나머지를 0으로 만들 수 있으므로, 가중치를 고르게 나누는 L2가 더 안정적이다.
`,
      keyPoints: [
        "L2 기울기 $2\\lambda w$: 가중치에 비례해 고르게 줄이고 0은 드물다",
        "L1 기울기 $\\pm\\lambda$: 일정하게 줄여 작은 가중치를 정확히 0으로",
        "관계없는 특성이 많으면 L1(희소성, 특성 선택)",
        "상관이 강한 특성이 여럿이면 L2가 안정적",
      ],
    },
    {
      key: "d2",
      question: "Ridge의 `alpha`를 바꾼 실험에서 검증 오차가 U자 모양을 그린 이유를 편향과 분산으로 설명하고, 다항식 차수를 낮추는 것과 규제를 강하게 하는 것의 같은 점과 다른 점을 하나씩 쓰라.",
      answer: md`
\`alpha\`가 아주 작으면 12차 다항식이 학습 데이터의 잡음까지 따라가 분산이 커지고 검증 오차가 크다. \`alpha\`를 키우면 가중치가 작아져 함수가 매끄러워지고 분산이 줄어 검증 오차가 내려가지만, 너무 크면 사인 곡선조차 나타내지 못해 편향이 커지고 오차가 다시 올라간다.

두 방법 모두 모델이 나타낼 수 있는 함수의 복잡도를 줄여 분산을 낮춘다는 점이 같다. 다른 점은, 차수를 낮추면 고차 항 자체를 없애 표현할 수 있는 함수의 종류를 바꾸지만, 규제는 12차 항을 그대로 두고 계수의 크기를 연속적으로 줄여 복잡도를 조절한다는 것이다.
`,
      keyPoints: [
        "alpha가 작으면 분산이 크다(잡음까지 맞춤)",
        "alpha가 크면 편향이 크다(과소적합)",
        "같은 점: 둘 다 복잡도를 줄여 분산을 낮춘다",
        "다른 점: 차수 감소는 항을 없애고, 규제는 계수를 연속적으로 줄인다",
      ],
    },
  ],
  references: [
    { title: "ISLP (An Introduction to Statistical Learning with Python) — 6.2 Shrinkage Methods", url: "https://www.statlearning.com/", note: "Ridge·Lasso와 계수 경로 (영문, 무료 PDF)" },
    { title: "scikit-learn — Plotting learning curves", url: "https://scikit-learn.org/stable/modules/learning_curve.html", note: "검증 곡선과 학습 곡선 (영문)" },
    { title: "Goodfellow, Bengio, Courville — Deep Learning, 7.8 Early Stopping", url: "https://www.deeplearningbook.org/contents/regularization.html", note: "조기 종료와 L2 규제의 관계 (영문)" },
  ],
});
