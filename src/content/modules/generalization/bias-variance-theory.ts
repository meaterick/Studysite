import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/bias-variance-theory";

export default defineLesson({
  id: "bias-variance-theory",
  title: "편향-분산 분해의 유도와 이중 하강",
  tier: "advanced",
  goal: "제곱 오차의 편향-분산 분해를 유도하고, 상관된 예측의 평균 분산 $\\rho\\sigma^2 + (1-\\rho)\\sigma^2/B$로 랜덤 포레스트를 설명하며, 최소 노름 보간에서 이중 하강이 생기는 원인을 특이값으로 설명할 수 있다.",
  why: "편향-분산 분해가 어떤 가정에서 성립하는지 알면, 분류 정확도처럼 분해가 성립하지 않는 경우와 줄일 수 없는 잡음의 한계를 구분할 수 있다. 앙상블의 분산 공식은 랜덤 포레스트의 설계를 설명하고([[lesson:knn-trees]]), 이중 하강은 파라미터가 데이터보다 많은 신경망과 언어 모델의 일반화를 이해하는 출발점이다([[lesson:scaling-laws]]).",
  body: md`
[[lesson:bias-variance]]에서는 분해식 $\text{오차} = \text{편향}^2 + \text{분산} + \sigma^2$을 시뮬레이션으로 확인했다. 이 레슨은 그 식을 직접 유도하고, 같은 논리로 랜덤 포레스트가 특성을 무작위로 고르는 이유를 설명한 뒤, 복잡도를 더 키우면 검증 오차가 다시 줄어드는 이중 하강 현상을 다룬다.

### 유도

입력 $x$를 고정하고 $y = f(x) + \varepsilon$, $\mathbb{E}[\varepsilon] = 0$, $\operatorname{Var}(\varepsilon) = \sigma^2$라 하자. 모델 $\hat f$는 무작위로 뽑힌 학습 데이터 $D$로 학습되므로 $\hat f(x)$도 확률변수이고, 새로 관측할 $y$의 잡음 $\varepsilon$은 $D$와 독립이다. 기댓값은 $D$와 $\varepsilon$ 모두에 대해 취한다. 표기를 줄이려고 $\hat f = \hat f(x)$, $\bar f = \mathbb{E}_D[\hat f(x)]$로 쓴다.

**잡음 분리.** $y - \hat f = (f - \hat f) + \varepsilon$이므로

$$\mathbb{E}[(y - \hat f)^2] = \mathbb{E}[(f - \hat f)^2] + 2\,\mathbb{E}[(f - \hat f)\,\varepsilon] + \mathbb{E}[\varepsilon^2]$$

$\varepsilon$이 $\hat f$와 독립이고 평균이 0이라 가운데 항은 $2\,\mathbb{E}[f - \hat f]\,\mathbb{E}[\varepsilon] = 0$, 마지막 항은 $\sigma^2$이다.

**편향과 분산 분리.** $f - \hat f = (f - \bar f) + (\bar f - \hat f)$에서 $f - \bar f$는 상수이고 $\mathbb{E}[\bar f - \hat f] = 0$이므로 교차항이 사라진다.

$$\mathbb{E}[(f - \hat f)^2] = \underbrace{(f - \bar f)^2}_{\text{편향}^2} + \underbrace{\mathbb{E}[(\hat f - \bar f)^2]}_{\text{분산}}$$

두 식을 합치면 분해식이 나온다. 유도에서 두 가지를 알 수 있다. 첫째, 이 분해는 **제곱 오차이기 때문에** 성립한다. 교차항이 사라지는 것은 제곱의 전개 덕분이고, 0-1 손실(분류 정확도)에는 이렇게 더해지는 분해가 없다. 둘째, $\sigma^2$은 어떤 모델로도 줄일 수 없는 바닥이다. 검증 오차가 더 내려가지 않으면 모델이 아니라 데이터(특성·레이블의 질)를 점검한다.

### 예측의 평균과 분산: 랜덤 포레스트가 특성을 무작위로 고르는 이유

분산이 $\sigma^2$이고 서로의 상관이 $\rho$인 예측 $B$개를 평균하면 그 분산은

$$\operatorname{Var}\!\left(\frac{1}{B}\sum_{b=1}^{B}\hat f_b\right) = \rho\,\sigma^2 + \frac{1-\rho}{B}\,\sigma^2$$

이다(공분산 행렬의 대각합과 비대각합을 세면 나온다). 트리를 아무리 많이 모아도($B \to \infty$) 분산은 $\rho\sigma^2$ 밑으로 내려가지 않는다. 배깅만 하면 트리들이 같은 강한 특성으로 비슷하게 나뉘어 $\rho$가 크다. 랜덤 포레스트가 분할마다 특성의 일부만 후보로 주는 것은 개별 트리의 편향을 조금 키우는 대신 **$\rho$를 낮춰** 평균의 분산이 내려갈 수 있는 하한을 낮추는 것이다. [[lesson:knn-trees]]에서 말한 "트리 사이의 상관이 낮아진다"의 정확한 의미다.

공식을 시뮬레이션으로 확인한다. 모든 트리가 공유하는 성분과 트리마다 다른 성분을 섞어 분산 1, 서로의 상관 0.5인 예측 50개를 만들고 평균한다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
B, rho, trials = 50, 0.5, 20_000
shared = rng.normal(size=(trials, 1))                 # 모든 트리가 공유하는 성분
own = rng.normal(size=(trials, B))                    # 트리마다 다른 성분
preds = np.sqrt(rho) * shared + np.sqrt(1 - rho) * own   # 분산 1, 서로의 상관 rho인 예측 B개
print("평균 예측의 분산(실험):", round(preds.mean(axis=1).var(), 3))
print("공식 rho + (1 - rho)/B :", rho + (1 - rho) / B)
\`\`\`

상관이 0.5면 트리를 50개 모아도 분산이 0.5 근처에서 멈춘다. 같은 50개라도 상관이 0이었다면 $1/50 = 0.02$까지 내려갔을 것이다.

[[diagram:ensemble-correlation]]

### U자 곡선 너머: 이중 하강

복잡도를 키우면 검증 오차가 U자를 그린다고 했다. 그런데 파라미터 수 $p$를 학습 샘플 수 $n$보다 훨씬 크게 늘리면 다른 결과가 나온다. 최소제곱 회귀를 예로 든다. $p < n$이면 해가 하나로 정해지지만, $p > n$이면 학습 데이터를 정확히 지나는(학습 오차 0인) 해가 무수히 많고, 그중 **노름이 가장 작은 해** $\hat w = X^{+} y$(유사역행렬)를 고른다. 테스트 오차를 $p$에 따라 그리면

1. $p$가 작을 때는 고전적 U자의 왼쪽처럼 움직이다가,
2. $p = n$(보간 문턱) 근처에서 매우 커지고,
3. $p > n$에서 다시 내려가, 경우에 따라 $p < n$의 어떤 모델보다도 낮아진다.

이것을 **이중 하강(double descent)**이라 부른다(Belkin et al., 2019; Nakkiran et al., 2019). 정점의 원인은 분산이다. $p = n$이면 $X$가 정사각에 가까워 가장 작은 특이값이 0 근처로 떨어지고, 유사역행렬이 그 역수를 곱하므로 잡음이 크게 증폭된다. $p$가 $n$보다 충분히 크면 최소 특이값이 다시 커지고, 노름이 가장 작은 해를 고르는 것 자체가 규제와 같은 역할을 한다(암묵적 규제). 실제로 적절한 크기의 Ridge 규제를 넣으면 정점이 사라진다는 것도 알려져 있다. 파라미터가 수억 개인 신경망이 학습 데이터를 모두 맞히면서도 일반화하는 현상을 설명하는 연구의 출발점이며, "파라미터가 데이터보다 많으면 항상 과적합한다"는 판단이 항상 맞지는 않음을 보여 준다.

[[diagram:double-descent]]
`,
  checks: [
    {
      key: "c1",
      question: "편향-분산 분해에서 잡음을 분리할 때 교차항 $2\\,\\mathbb{E}[(f - \\hat f)\\varepsilon]$이 0이 되는 이유는?",
      choices: ["새 관측의 잡음 $\\varepsilon$이 학습 데이터로 만든 $\\hat f$와 독립이고 평균이 0이라서", "$\\hat f$가 항상 $f$와 같아서", "잡음의 분산이 0이라서", "제곱 오차가 대칭이라서"],
      answer: 0,
      explanation: "독립이면 곱의 기댓값이 기댓값의 곱이 되고 $\\mathbb{E}[\\varepsilon] = 0$이라 교차항이 사라진다.",
    },
    {
      key: "c2",
      question: "분산 1, 서로의 상관 0.5인 트리 1000개를 평균한 예측의 분산은 대략?",
      choices: ["0.5", "0.001", "0.25", "1"],
      answer: 0,
      explanation: "$\\rho\\sigma^2 + (1-\\rho)\\sigma^2/B = 0.5 + 0.5/1000 \\approx 0.5$. 트리를 늘려도 $\\rho\\sigma^2$ 밑으로 내려가지 않으므로, 랜덤 포레스트는 특징을 무작위로 골라 $\\rho$를 낮춘다.",
    },
    {
      key: "c3",
      question: "최소 노름 최소제곱에서 파라미터 수 $p$가 샘플 수 $n$과 같을 때 테스트 오차가 치솟는 직접적인 원인은?",
      choices: ["$X$의 최소 특이값이 0 근처로 떨어져 유사역행렬이 잡음을 크게 증폭한다", "파라미터가 너무 적어 편향이 커진다", "학습률이 너무 크다", "훈련 오차가 커진다"],
      answer: 0,
      explanation: "유사역행렬은 특이값의 역수를 곱하므로 작은 특이값이 잡음을 증폭한다(분산 폭발). 한 실험에서 $p = 40 = n$일 때 최소 특이값이 약 0.09로 가장 작았고 테스트 MSE가 약 39로 치솟았다.",
    },
    {
      key: "c4",
      question: "분산이 1이고 서로 **독립**($\\rho = 0$)인 예측 100개를 평균하면 분산은?",
      choices: ["0.01", "0.1", "1", "0"],
      answer: 0,
      explanation: "$\\rho\\sigma^2 + \\frac{1-\\rho}{B}\\sigma^2$에서 $\\rho = 0$이면 $\\sigma^2/B = 1/100 = 0.01$이다. 상관이 있으면 $\\rho\\sigma^2$ 밑으로는 내려가지 않는다.",
    },
    {
      key: "c5",
      question: "편향-분산 분해에서 $\\sigma^2$(줄일 수 없는 잡음)에 대한 설명으로 옳은 것은?",
      choices: ["어떤 모델로도 줄일 수 없는 오차의 바닥으로, 줄이려면 데이터(특성·레이블의 질)를 바꿔야 한다", "모델을 복잡하게 하면 0이 된다", "정규화로 줄일 수 있다", "훈련 데이터를 외우면 사라진다"],
      answer: 0,
      explanation: "같은 $x$에서도 $y$가 흩어지는 정도라 모델과 무관하다. 더 좋은 특징을 측정하거나 레이블 잡음을 줄여야만 내려간다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
X = np.array([[1.0, 1.0]])
y = np.array([2.0])
w = np.linalg.pinv(X) @ y
print(w, X @ w)
`,
      expected: "[1. 1.] [2.]",
      explanation: "식 하나 $w_1 + w_2 = 2$를 만족하는 해는 무수히 많지만(예: $[2, 0]$, $[3, -1]$), 유사역행렬은 그중 노름이 가장 작은 $[1, 1]$(노름 $\\sqrt{2}$)을 고릅니다. 훈련 데이터는 정확히 지나므로 예측은 2입니다. 이 '가장 작은 노름' 선택이 이중 하강의 두 번째 하강을 만드는 암묵적 규제입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "제곱 오차의 기댓값이 편향의 제곱 + 분산 + 잡음으로 나뉘는 과정을 잡음 분리와 편향·분산 분리의 두 단계로 유도하라. 최소 노름 최소제곱에서 파라미터 수가 샘플 수와 같아질 때 테스트 오차가 매우 커지는 이유도 쓰라.",
      answer: md`
1단계: $y - \hat f = (f - \hat f) + \varepsilon$을 제곱해 기댓값을 취하면, 새 관측의 잡음 $\varepsilon$이 학습 데이터로 만든 $\hat f$와 독립이고 평균이 0이라 교차항이 사라져 $\mathbb{E}[(f - \hat f)^2] + \sigma^2$이 된다. 2단계: $\bar f = \mathbb{E}[\hat f]$를 더하고 빼면 $f - \hat f = (f - \bar f) + (\bar f - \hat f)$이고, 앞은 상수, 뒤는 평균이 0이라 교차항이 사라져 $(f - \bar f)^2 + \mathbb{E}[(\hat f - \bar f)^2]$, 즉 편향의 제곱과 분산이 된다. 최소 노름 최소제곱 $\hat w = X^{+}y$에서 $p = n$이면 $X$가 정사각에 가까워 최소 특이값이 0 근처로 떨어지고, 유사역행렬이 특이값의 역수를 곱하므로 잡음이 거대하게 증폭되어 분산이 폭발한다. $p$가 $n$보다 충분히 커지면 최소 특이값이 다시 커지고 최소 노름 선택이 암묵적 규제로 작동해 오차가 다시 내려간다(이중 하강).
`,
      keyPoints: ["잡음 분리: 새 잡음은 $\\hat f$와 독립이고 평균이 0이라 교차항이 0", "편향·분산 분리: $f - \\bar f$는 상수, $\\mathbb{E}[\\bar f - \\hat f] = 0$", "$p = n$에서 최소 특이값이 0 근처로 떨어진다", "유사역행렬이 그 역수를 곱해 잡음이 크게 증폭된다(분산)"],
    },
  ],
  references: [
    { title: "Belkin et al. (2019) — Reconciling modern machine learning practice and the bias-variance trade-off", url: "https://arxiv.org/abs/1812.11118", note: "이중 하강을 처음 체계적으로 제시한 논문 (영문)" },
    { title: "Nakkiran et al. (2019) — Deep Double Descent", url: "https://arxiv.org/abs/1912.02292", note: "신경망에서의 모델 크기·학습 시간에 따른 이중 하강 (영문)" },
    { title: "ISLP 8.2절 — Bagging, Random Forests", url: "https://www.statlearning.com/", note: "상관된 트리의 평균과 특성 무작위 선택 (영문, 무료 PDF)" },
  ],
});
