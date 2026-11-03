import { defineLesson, md } from "../../kit";
import exercises from "./labs/loss-likelihood";

export default defineLesson({
  id: "loss-likelihood",
  title: "손실함수의 확률적 기원",
  tier: "advanced",
  goal: "가우시안·베르누이 가능도에서 MSE와 교차 엔트로피를 유도하고, L2·L1 정규화를 가우시안·라플라스 사전분포의 MAP로 설명하며, 로지스틱 손실의 볼록성과 선형분리 데이터에서의 발산을 분석할 수 있다.",
  why: "손실함수와 규제를 확률 모델의 가정으로 이해하면, 이상치가 많은 데이터나 새로운 형태의 출력처럼 정해진 규칙이 없는 상황에서도 손실을 직접 정할 수 있다. 언어 모델의 학습 목표인 다음 토큰의 음의 로그가능도와 그 평가에 쓰는 퍼플렉시티도 같은 원리에서 나온다([[lesson:pretraining]]).",
  body: md`
회귀는 평균제곱오차를, 분류는 교차 엔트로피를 손실로 쓰고([[lesson:loss-functions]]), 과적합을 줄이려면 L1·L2 규제를 더한다([[lesson:regularization]]). 이 레슨은 세 가지가 모두 최대가능도(MLE)와 최대사후확률(MAP)이라는 **하나의 원리**에서 나온다는 것을 보인다([[lesson:mle-map]]). 이 관점을 쓰면 손실함수를 외워서 고르지 않고, 데이터가 어떤 분포에서 나왔다고 가정하는지로부터 손실을 **유도**할 수 있다. 언어 모델이 다음 토큰의 교차 엔트로피를 최소화하는 이유도 같다([[lesson:pretraining]]).

### MSE = 가우시안 잡음의 음의 로그가능도

선형회귀의 데이터 생성 과정을 $y_i = w^\top x_i + \varepsilon_i$, $\varepsilon_i \sim \mathcal{N}(0, \sigma^2)$(서로 독립)로 가정하자. 그러면 $y_i$ 하나의 확률밀도는 $\frac{1}{\sqrt{2\pi\sigma^2}}\exp\!\left(-\frac{(y_i - w^\top x_i)^2}{2\sigma^2}\right)$이고, 독립이므로 전체 가능도는 곱, 로그가능도는 합이 된다. 음의 로그가능도(NLL)를 쓰면

$$-\log L(w) = \frac{n}{2}\log(2\pi\sigma^2) + \frac{1}{2\sigma^2}\sum_{i=1}^{n}(y_i - w^\top x_i)^2$$

첫 항은 $w$와 무관하고 둘째 항은 오차 제곱합의 양수배다. 따라서 **NLL을 최소화하는 $w$와 MSE를 최소화하는 $w$는 같다.** MSE를 쓰는 것은 잡음이 정규분포를 따른다고 가정하는 것과 같다. 이 가정이 틀린 데이터, 예를 들어 이상치가 섞여 꼬리가 두꺼운 잡음이라면 라플라스 분포 $p(\varepsilon) \propto e^{-|\varepsilon|/b}$를 가정하는 편이 맞고, 같은 계산을 하면 손실은 MAE가 된다. 제곱 오차가 이상치의 영향을 크게 받는 성질([[lesson:loss-functions]])은 잡음 분포의 꼬리가 얼마나 두꺼운가로 설명된다. 또한 $\sigma^2$에 대해 미분해 0으로 놓으면 $\hat\sigma^2 = \frac{1}{n}\sum (y_i - \hat w^\top x_i)^2$, 즉 잡음 분산의 MLE는 잔차의 MSE다.

가장 단순한 모델, 상수 하나 $c$로 모든 $y$를 예측하는 경우를 보면 두 손실의 차이가 분명하다. MSE를 최소화하는 $c$는 **평균**이고, MAE를 최소화하는 $c$는 **중앙값**이다. 튀는 값이 하나 섞인 $y = [1, 2, 3, 10]$으로 확인한다.

\`\`\`python
import numpy as np

y = np.array([1, 2, 3, 10])            # 10은 튀는 값
cs = np.linspace(0, 10, 1001)          # 상수 예측 후보 c (0.01 간격)
mse = np.array([np.mean((y - c) ** 2) for c in cs])
mae = np.array([np.mean(np.abs(y - c)) for c in cs])
print("MSE를 최소화하는 c:", cs[mse.argmin()], "/ 평균:", y.mean())
best = cs[np.isclose(mae, mae.min())]  # MAE가 최소인 c가 여러 개일 수 있다
print("MAE를 최소화하는 c: 구간", best.min(), "~", best.max(), "/ 중앙값:", np.median(y))
\`\`\`

MSE의 답(평균 4)은 10 하나 때문에 크게 옮겨 가지만, MAE의 답은 2~3 구간(중앙값 2.5를 포함)에 남는다. 가우시안 분포는 큰 잡음에 매우 작은 확률을 주므로 최대가능도가 큰 잔차를 줄이는 쪽으로 답을 옮기고, 라플라스 분포는 큰 잡음에 더 큰 확률을 주므로 답이 덜 옮겨 간다. 이상치가 많은 데이터에 MAE나 Huber 손실을 쓰는 이유다.

[[diagram:mean-median-loss]]

### 교차 엔트로피 = 베르누이·범주 분포의 음의 로그가능도

이진분류에서 $y_i \in \{0, 1\}$이 $p_i = \sigma(w^\top x_i)$를 성공 확률로 하는 베르누이 분포를 따른다고 가정하면 $P(y_i \mid x_i) = p_i^{y_i}(1-p_i)^{1-y_i}$이고, 음의 로그가능도는

$$-\log L(w) = -\sum_i \left[\, y_i \log p_i + (1-y_i)\log(1-p_i) \,\right]$$

로 이진 교차 엔트로피의 합 그 자체다. 클래스가 $K$개면 범주 분포 $P(y = k \mid x) = \text{softmax}(z)_k$를 가정하고, NLL은 $-\log p_{\text{정답}}$이 된다. 이름은 정보이론([[lesson:entropy-kl]])에서 왔지만 내용은 최대가능도다. 그래서 교차 엔트로피 최소화는 "모델 분포와 데이터 분포의 KL 발산 최소화"와도 같다.

### 정규화 = 사전분포를 넣은 MAP

MAP는 가능도에 파라미터의 사전분포 $p(w)$를 곱한 사후확률을 최대화한다. 음의 로그를 취하면 $-\log p(w \mid D) = -\log L(w) - \log p(w) + \text{상수}$이므로, **사전분포의 음의 로그가 곧 벌점 항**이다.

- $w_j \sim \mathcal{N}(0, \tau^2)$(가우시안 사전)이면 $-\log p(w) = \frac{1}{2\tau^2}\lVert w \rVert_2^2 + \text{상수}$ → L2(Ridge). 위의 가우시안 NLL과 합치면 Ridge의 $\lambda = \sigma^2/\tau^2$다. 잡음이 클수록, 사전분포가 좁을수록($\tau$가 작을수록) 규제가 세진다.
- $w_j \sim \text{Laplace}(0, b)$이면 $-\log p(w) = \frac{1}{b}\lVert w \rVert_1 + \text{상수}$ → L1(Lasso). 라플라스 분포는 0에서 뾰족하므로 많은 가중치가 정확히 0인 해가 나오고, 그 결과가 희소성이다.

[[diagram:noise-prior-loss]]

Ridge는 닫힌 해가 있다. 목적함수 $\lVert y - Xw \rVert^2 + \lambda\lVert w \rVert^2$를 미분해 0으로 놓으면

$$w^{*}_{\text{ridge}} = (X^\top X + \lambda I)^{-1} X^\top y$$

이다. $\lambda I$를 더하는 것은 수치적으로도 의미가 크다. 특징 두 개가 거의 같으면(다중공선성) $X^\top X$의 고유값 하나가 0에 가까워 역행렬이 불안정하고 계수가 크게 흔들린다. $\lambda I$는 모든 고유값을 $\lambda$만큼 올려 조건수 $\kappa = \frac{\lambda_{\max} + \lambda}{\lambda_{\min} + \lambda}$를 줄인다. [[lesson:gd-convergence]]의 조건수가 여기서는 해가 얼마나 안정한지를 정한다.

[[diagram:ridge-collinear]]

### 로지스틱 손실의 볼록성과 선형분리 데이터

로지스틱 회귀에는 닫힌 해가 없지만, 손실이 **볼록(convex)**이라 경사하강법이 찾은 최솟값이 곧 전역 최솟값이다. 평균 손실의 헤세 행렬은

$$H = \frac{1}{n} X^\top S X, \qquad S = \operatorname{diag}\big(p_i(1-p_i)\big)$$

이고, 임의의 벡터 $v$에 대해 $v^\top H v = \frac{1}{n}\sum_i p_i(1-p_i)(x_i^\top v)^2 \ge 0$이므로 양의 준정부호다. 뉴턴 방법을 적용하면 매 스텝이 가중 최소제곱 문제가 되는데, 이것이 통계 패키지들이 로지스틱 회귀를 푸는 IRLS(반복 재가중 최소제곱)다.

그런데 데이터가 **선형분리 가능**하면 MLE가 존재하지 않는다. 모든 점을 올바르게 가르는 $w$를 찾은 뒤 크기를 $c$배로 키우면 확률이 0과 1에 더 가까워져 손실이 계속 줄어들기 때문이다. 경사하강법은 $\lVert w \rVert$를 끝없이(대략 $\log t$에 비례해) 키우고, 예측 확률은 0과 1에 점점 가까워진다(과신). 여기에 L2 규제를 넣으면 최솟값이 유한한 곳에 생긴다. 다음 결과도 알려져 있다. 규제 없는 경사하강법의 $w$는 크기가 발산하는 동안 **방향**은 최대 마진 SVM의 방향으로 수렴한다(Soudry et al., 2018). SVM([[lesson:svm]])과 로지스틱 회귀가 이렇게 이어지며, 과대 파라미터화된 신경망이 규제 없이도 일반화하는 이유를 설명하는 "암묵적 규제(implicit regularization)" 연구의 출발점이 된 결과다.

[[diagram:separable-logistic]]
`,
  checks: [
    {
      key: "c1",
      question: "잡음을 정규분포가 아니라 라플라스 분포 $p(\\varepsilon) \\propto e^{-|\\varepsilon|/b}$로 가정하고 최대가능도를 구하면 최소화하는 손실은?",
      choices: ["평균절대오차(MAE)", "평균제곱오차(MSE)", "교차 엔트로피", "힌지 손실"],
      answer: 0,
      explanation: "음의 로그가능도가 $\\frac{1}{b}\\sum|y_i - \\hat y_i| + $상수이므로 MAE다. 꼬리가 두꺼운 잡음(이상치)을 가정하면 큰 오차에 덜 민감한 손실이 나온다.",
    },
    {
      key: "c2",
      question: "Ridge 회귀를 가중치의 가우시안 사전분포 $\\mathcal{N}(0, \\tau^2)$와 잡음 분산 $\\sigma^2$의 MAP로 보면 규제 강도 $\\lambda$는?",
      choices: ["$\\sigma^2/\\tau^2$", "$\\tau^2/\\sigma^2$", "$\\sigma^2\\tau^2$", "$1/\\tau$"],
      answer: 0,
      explanation: "NLL의 $\\frac{1}{2\\sigma^2}\\lVert y - Xw\\rVert^2$와 음의 로그 사전 $\\frac{1}{2\\tau^2}\\lVert w\\rVert^2$를 $2\\sigma^2$배 하면 $\\lVert y - Xw\\rVert^2 + \\frac{\\sigma^2}{\\tau^2}\\lVert w\\rVert^2$다. 잡음이 크거나 사전분포가 좁을수록 규제가 세다.",
    },
    {
      key: "c3",
      question: "선형분리 가능한 데이터에서 규제 없는 로지스틱 회귀를 경사하강법으로 오래 학습하면?",
      choices: ["가중치 크기가 끝없이(대략 로그로) 커지고 손실은 0으로 다가간다", "유한한 최적값에 수렴한다", "가중치가 0으로 줄어든다", "손실이 ln 2에 머문다"],
      answer: 0,
      explanation: "모든 점을 가르는 $w$의 크기를 키울수록 손실이 계속 줄어 MLE가 존재하지 않는다. 경사하강법을 돌리면 스텝이 10배 늘 때마다 $w$가 약 2.3씩 커지고 손실은 10분의 1이 된다. L2 규제를 넣으면 유한한 해가 생긴다.",
    },
    {
      key: "c4",
      question: "모든 샘플을 상수 $c$ 하나로 예측할 때, MAE를 최소화하는 $c$는?",
      choices: ["중앙값", "평균", "최댓값", "최빈값"],
      answer: 0,
      explanation: "MAE의 기울기는 $c$보다 작은 샘플 수와 큰 샘플 수의 차이에 비례해, 양쪽 수가 같아지는 중앙값에서 0이 된다. MSE는 평균에서 최소다.",
    },
    {
      key: "c5",
      question: "로지스틱 회귀의 손실이 볼록(convex)이라는 사실이 주는 실용적 의미는?",
      choices: ["경사하강법이 찾은 최솟값이 전역 최솟값이다", "닫힌 해가 항상 존재한다", "규제가 필요 없다", "선형분리 데이터에서도 유한한 해가 존재한다"],
      answer: 0,
      explanation: "볼록 함수에는 지역 최솟값이 전역 최솟값뿐이다. 다만 닫힌 해는 없고, 선형분리 데이터에서는 최솟값이 무한히 먼 곳에 있어 규제가 필요하다.",
    },
    {
      key: "c6",
      question: "$X^\\top X$의 고유값이 $100$과 $0.01$이다. Ridge의 닫힌 해에서 $X^\\top X + \\lambda I$($\\lambda = 1$)의 조건수는?",
      choices: ["100", "10000", "1", "0.01"],
      answer: 0,
      explanation: "$\\lambda I$를 더하면 모든 고유값이 $\\lambda$만큼 커져 $101$과 $1.01$이 되므로 조건수는 $101/1.01 = 100$이다. 원래 조건수 $10^4$이 100분의 1로 줄어 역행렬 계산과 계수가 안정해진다. 가우시안 사전분포가 다중공선성 문제를 줄이는 수치적 이유다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "잡음이 정규분포라고 가정하면 최대가능도 추정이 MSE 최소화와 같아지는 이유를 유도하라. L2 정규화가 어떤 사전분포의 MAP와 같은지, 그때 $\\lambda$가 무엇으로 정해지는지도 설명하라.",
      answer: md`
$y_i = w^\top x_i + \varepsilon_i$, $\varepsilon_i \sim \mathcal{N}(0, \sigma^2)$ 독립이면 음의 로그가능도는 $\frac{n}{2}\log(2\pi\sigma^2) + \frac{1}{2\sigma^2}\sum_i (y_i - w^\top x_i)^2$이다. 첫 항은 $w$와 무관하고 둘째 항은 오차 제곱합의 양수배이므로, 가능도를 최대화하는 $w$와 MSE를 최소화하는 $w$가 같다. L2 정규화는 가중치에 가우시안 사전분포 $w_j \sim \mathcal{N}(0, \tau^2)$를 둔 MAP와 같다. 음의 로그 사전이 $\frac{1}{2\tau^2}\lVert w \rVert^2$이므로 전체 목적함수를 $2\sigma^2$배 하면 $\lVert y - Xw \rVert^2 + \frac{\sigma^2}{\tau^2}\lVert w \rVert^2$가 되어 $\lambda = \sigma^2/\tau^2$다. 잡음이 클수록, 사전분포가 좁을수록 규제가 세진다(라플라스 사전분포이면 L1).
`,
      keyPoints: ["가우시안 잡음의 음의 로그가능도 = 상수 + 오차 제곱합의 양수배", "따라서 MLE와 MSE 최소화의 해가 같다", "L2 = 가우시안 사전분포의 MAP", "$\\lambda = \\sigma^2/\\tau^2$"],
    },
  ],
  references: [
    { title: "Bishop — Pattern Recognition and Machine Learning, 3.1·4.3절", url: "https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/", note: "최대가능도·MAP로 본 선형회귀와 로지스틱 회귀 (영문, 무료 PDF)" },
    { title: "Soudry et al. (2018) — The Implicit Bias of Gradient Descent on Separable Data", url: "https://arxiv.org/abs/1710.10345", note: "규제 없는 로지스틱 회귀가 최대 마진 방향으로 수렴함을 증명 (영문, 연구 논문)" },
  ],
});
