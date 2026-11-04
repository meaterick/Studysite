import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/privacy-math";

export default defineLesson({
  id: "privacy-math",
  title: "차등 프라이버시의 수학과 DP-SGD",
  tier: "advanced",
  goal: "삼각부등식으로 라플라스 메커니즘의 $\\varepsilon$ 보장을 증명하고, 후처리 불변성과 합성을 설명하며, 가설 검정 관점에서 멤버십 추론 이득의 상한 $(e^\\varepsilon - 1)/(e^\\varepsilon + 1)$을 유도하고, DP-SGD의 표본별 자르기·잡음이 보장과 비용(큰 배치, 소수 집단)에 미치는 영향을 설명할 수 있다.",
  why: "차등 프라이버시로 학습했다는 주장은 $\\varepsilon$ 값을 함께 보고 그 의미를 해석할 수 있어야 검토할 수 있다. 라플라스 메커니즘의 증명, $\\varepsilon$이 멤버십 추론 공격에 주는 상한, DP-SGD의 절차와 대가를 알아야 프라이버시와 정확도 사이에서 학습 설정을 정할 수 있다.",
  body: md`
[[lesson:privacy]]에서 차등 프라이버시의 정의와 라플라스 메커니즘을 소개했다. 이 레슨은 세 가지를 증명하거나 계산한다. 라플라스 메커니즘이 왜 정확히 $\varepsilon$을 보장하는지, $\varepsilon$이라는 숫자가 공격자에게 실제로 무엇을 뜻하는지(멤버십 추론 공격의 성공률 상한), 그리고 신경망 학습 자체를 차등 프라이버시로 만드는 DP-SGD가 어떤 장치로 그 보장을 얻고 무엇을 대가로 치르는지다.

### 라플라스 메커니즘의 증명

함수 $f$의 **민감도** $\Delta$를 한 사람만 다른 두 데이터셋에서 $|f(D) - f(D')|$가 가질 수 있는 최댓값이라 하자(개수 질의면 $\Delta = 1$). $M(D) = f(D) + \text{Laplace}(\Delta/\varepsilon)$의 출력 밀도는 $\frac{\varepsilon}{2\Delta}\exp\left(-\frac{\varepsilon\,|o - f(D)|}{\Delta}\right)$이므로, 어떤 출력 $o$에서든 두 밀도의 비는 삼각부등식으로 묶인다.

\`\`\`math
\dfrac{p_{M(D)}(o)}{p_{M(D')}(o)} = \exp\!\left(\dfrac{\varepsilon\,\big(|o - f(D')| - |o - f(D)|\big)}{\Delta}\right) \le \exp\!\left(\dfrac{\varepsilon\,|f(D) - f(D')|}{\Delta}\right) \le e^{\varepsilon}
\`\`\`

밀도의 비가 모든 점에서 $e^\varepsilon$ 이하이므로 어떤 결과 집합 $S$에 대해서도 확률의 비가 $e^\varepsilon$ 이하다. 두 가지 성질이 따라 나온다. ① **후처리 불변성:** 차등 프라이버시를 지키는 결과를 어떻게 가공하든(반올림, 그래프, 그것으로 학습한 모델) 보장은 약해지지 않는다. ② **합성:** $\varepsilon_1$, $\varepsilon_2$짜리 분석을 함께 공개하면 최대 $\varepsilon_1 + \varepsilon_2$다. 반복이 많을 때는 $\sqrt{k}$에 비례하는 더 촘촘한 합성 정리(작은 $\delta$를 허용하는 $(\varepsilon, \delta)$-차등 프라이버시)를 쓴다.

[[diagram:laplace-ratio]]

### $\varepsilon$은 공격자에게 무엇을 뜻하는가: 가설 검정으로 보기

**멤버십 추론(membership inference)**은 "이 사람의 기록이 학습 데이터에 들어 있었는가"를 맞히는 공격이다(Shokri et al., 2017). 공격자는 일종의 가설 검정을 한다. 들어 있었는데 "들어 있다"고 맞히는 비율을 TPR, 들어 있지 않았는데 "들어 있다"고 틀리는 비율을 FPR이라 하면, 공격의 **이득**은 $\text{TPR} - \text{FPR}$이다(무작위로 찍으면 0). 학습이 $(\varepsilon, \delta)$-차등 프라이버시라면 어떤 공격이든 다음 두 부등식을 지켜야 한다(Kairouz et al., 2015).

\`\`\`math
\text{TPR} \le e^{\varepsilon}\,\text{FPR} + \delta, \qquad 1 - \text{FPR} \le e^{\varepsilon}\,(1 - \text{TPR}) + \delta
\`\`\`

두 부등식이 등호로 만나는 점에서 이득이 가장 커지고, $\delta = 0$이면 그 최댓값은 다음과 같다.

\`\`\`math
\max\,(\text{TPR} - \text{FPR}) = \dfrac{e^{\varepsilon} - 1}{e^{\varepsilon} + 1}
\`\`\`

$\varepsilon = 0.1$이면 0.05로 공격이 무작위 추측과 거의 구별되지 않지만, $\varepsilon = 1$이면 0.46, $\varepsilon = 8$이면 0.999로 사실상 아무것도 보장하지 않는다. 실제 DP 학습 연구와 서비스가 $\varepsilon$ = 1~8 정도를 보고하는 경우가 흔하다는 점을 생각하면, "차등 프라이버시로 학습했다"는 말만으로는 충분하지 않고 **$\varepsilon$과 $\delta$의 값**을 함께 봐야 한다. 다만 이것은 최악의 경우에 대한 상한이고, 실제 공격이 이만큼 성공한다는 뜻은 아니다.

[[diagram:mia-advantage]]

### 과적합이 곧 유출이다

실제 멤버십 추론 공격의 가장 단순한 형태는 "모델이 이 기록에 유난히 확신하면 학습에 쓰였다"고 추측하는 것이다(Yeom et al., 2018). 학습 데이터에서의 확신도와 처음 보는 데이터에서의 확신도의 차이, 즉 **과적합의 크기**가 곧 유출의 크기다. 그래서 규제(정규화)나 조기 종료처럼 일반화를 돕는 장치는 프라이버시도 돕는다. 다만 그것은 보장이 아니라 경향이고, 보장이 필요하면 학습 절차 자체를 차등 프라이버시로 만들어야 한다.

### DP-SGD: 자르고, 잡음을 더하고, 기록한다

**DP-SGD**(Abadi et al., 2016)는 경사하강의 한 걸음에 두 장치를 넣는다. ① **표본별 기울기 자르기:** 미니배치의 표본마다 기울기를 따로 구해 길이가 $C$를 넘으면 $C$로 줄인다. 이제 한 사람이 기울기 합을 바꿀 수 있는 크기(민감도)가 $C$ 이하로 묶인다. 평소의 학습에는 이런 상한이 없다. ② **잡음:** 잘라 낸 기울기의 합에 평균 0, 표준편차 $\sigma C$의 가우스 잡음을 더한 뒤 배치 크기 $B$로 나눈다. ③ **회계:** 매 걸음이 작은 $(\varepsilon, \delta)$를 쓰므로, 표본을 무작위로 뽑아 쓰는 데서 오는 증폭 효과까지 계산해 전체 학습의 $\varepsilon$을 추적한다.

대가는 잡음이다. 잡음 벡터의 길이는 대략 $\sigma C \sqrt{d}$이고 이것을 $B$로 나누므로, 학습 신호(평균 기울기)에 비한 잡음의 크기는 배치가 작을수록, 파라미터가 많을수록 커진다. DP 학습에 큰 배치와 많은 데이터가 필요한 이유다. 또 자르기와 잡음은 드물고 특이한 표본의 영향을 먼저 지우므로, 데이터가 적은 소수 집단의 정확도가 더 크게 떨어질 수 있다(Bagdasaryan et al., 2019). 프라이버시를 위한 장치가 공정성 문제를 새로 만들 수 있다는 것이다.

[[diagram:dp-sgd-step]]

### 코드로 확인하기

$\varepsilon$에 따른 멤버십 추론 이득의 상한, 라플라스 메커니즘의 밀도 비, DP-SGD 한 걸음의 자르기를 차례로 계산한다.

\`\`\`python
import numpy as np

for eps in [0.1, 1.0, np.log(3), 3.0, 8.0]:
    adv = (np.exp(eps) - 1) / (np.exp(eps) + 1)
    print(f"ε = {eps:4.2f}: 멤버십 추론 이득 상한 {adv:.3f}")

# 라플라스 메커니즘: 한 사람만 다른 두 데이터셋(개수 12 vs 13)의 출력 밀도 비가 e^ε 이하인가
eps = 1.0
o = np.linspace(0, 25, 501)
dens = lambda c: eps / 2 * np.exp(-eps * np.abs(o - c))
ratio = dens(12) / dens(13)
print(f"밀도 비의 최댓값 {ratio.max():.4f}, e^ε = {np.exp(eps):.4f}")

# DP-SGD 한 걸음: 표본별 기울기를 C로 자르고 잡음을 더한다
rng = np.random.default_rng(0)
G = rng.normal(size=(4, 3)) * np.array([[1], [1], [1], [20]])   # 넷째 표본은 유난히 큰 기울기
C, sigma = 1.0, 1.0
norms = np.linalg.norm(G, axis=1, keepdims=True)
clipped = G * np.minimum(1, C / norms)
noisy_mean = (clipped.sum(0) + rng.normal(0, sigma * C, 3)) / len(G)
print("자르기 전 길이:", norms.ravel().round(2))
print("자른 뒤 길이  :", np.linalg.norm(clipped, axis=1).round(2))
print("잡음 섞인 평균 기울기:", noisy_mean.round(3))
\`\`\`

$\varepsilon = \ln 3 \approx 1.10$에서 상한이 정확히 0.5다. [[lesson:privacy]]의 무작위 응답이 바로 이 경우라, "예/아니오" 답 하나로 공격자가 얻을 수 있는 이득이 최대 0.5다. 라플라스 메커니즘의 밀도 비는 어디서 재든 최대 $e^1 \approx 2.718$을 넘지 않는다. DP-SGD에서는 길이 28짜리 넷째 표본의 기울기가 1로 잘려, 이 한 사람이 평균 기울기를 좌우하지 못한다. 이것이 민감도를 $C$로 제한한다는 말의 뜻이다.
`,
  checks: [
    {
      key: "c1",
      question: "$\\varepsilon = 1$인 차등 프라이버시 학습에서 멤버십 추론 공격 이득(TPR − FPR)의 최댓값은?",
      choices: ["약 $0.05$", "약 $0.46$", "약 $0.999$", "항상 $0$"],
      answer: 1,
      explanation: "$(e^1 - 1)/(e^1 + 1) \\approx 0.462$. $\\varepsilon = 0.1$이면 0.05, $\\varepsilon = 8$이면 0.999로 사실상 보장이 없다.",
    },
    {
      key: "c2",
      question: "차등 프라이버시를 지키는 통계로 그래프를 그리고 모델을 학습해 공개했다. 공개물 전체의 보장은?",
      choices: ["보장이 사라진다", "후처리 불변성 때문에 원래의 $\\varepsilon$이 그대로 유지된다", "보장이 두 배로 강해진다", "그래프는 보장되지만 모델은 아니다"],
      answer: 1,
      explanation: "원 데이터에 다시 접근하지 않는 한, 차등 프라이버시 결과를 어떻게 가공해도 보장은 약해지지 않는다. 원 데이터로 새 분석을 더 하면 합성으로 예산이 늘어난다.",
    },
    {
      key: "c3",
      question: "DP-SGD에서 표본별 기울기를 길이 $C$로 자르는 이유는?",
      choices: ["학습을 빠르게 하려고", "한 사람이 기울기 합을 바꿀 수 있는 크기(민감도)를 $C$ 이하로 묶어, 그에 맞춘 잡음으로 보장을 얻기 위해", "기울기 소실을 막으려고", "배치 크기를 줄이려고"],
      answer: 1,
      explanation: "민감도가 묶여야 표준편차 $\\sigma C$의 잡음으로 보장을 계산할 수 있다. 예를 들어 자르기 전 최대 길이 5.92가 $C = 1$로 자르면 1.00으로 묶인다.",
    },
    {
      key: "c4",
      question: "$\\varepsilon = \\ln 3$인 차등 프라이버시에서 멤버십 추론 이득(TPR − FPR)의 상한은?",
      choices: ["0.5", "0.25", "약 0.46", "3"],
      answer: 0,
      explanation: "$(e^\\varepsilon - 1)/(e^\\varepsilon + 1) = (3 - 1)/(3 + 1) = 0.5$다. 무작위 응답(동전 두 번)이 바로 $\\varepsilon = \\ln 3$인 경우다.",
    },
    {
      key: "c5",
      question: "DP-SGD에서 한 표본의 기울기 길이가 28이고 자르기 기준이 $C = 1$이면 그 표본의 기울기는 어떻게 되는가?",
      choices: ["방향은 그대로 두고 길이를 1로 줄인다", "그 표본을 학습에서 뺀다", "28로 그대로 쓴다", "방향을 무작위로 바꾼다"],
      answer: 0,
      explanation: "기울기에 $\\min(1, C/\\|g\\|) = 1/28$을 곱해 길이만 1로 줄인다. 한 사람이 합계에 줄 수 있는 영향(민감도)을 $C$로 묶어야 그에 맞춘 잡음으로 보장을 얻을 수 있다.",
    },
    {
      key: "c6",
      question: "DP-SGD에서 배치 크기를 10명에서 1,000명으로 늘리고 $\\sigma$, $C$는 그대로 두었다. 한 걸음의 기울기에서 잡음이 신호에 비해 어떻게 변하는가?",
      choices: ["그대로다", "약 100배 작아진다: 잡음의 크기 $\\sigma C\\sqrt{d}$를 배치 크기로 나누기 때문이다", "약 10배 커진다", "잡음이 사라진다"],
      answer: 1,
      explanation: "잡음은 잘라 낸 기울기의 **합**에 한 번 더해지고 배치 크기로 나눠지므로 평균 기울기에 대한 잡음의 크기가 $1/B$로 줄어든다. 예를 들어 배치 10명에서 잡음/신호 약 11.4, 1,000명에서 약 0.11이다. DP 학습에 큰 배치와 많은 데이터가 필요한 이유다(대신 배치가 커지면 한 번에 쓰는 프라이버시 예산 계산도 달라진다).",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
from math import exp
for eps in (0.5, 2.0):
    print(eps, round((exp(eps) - 1) / (exp(eps) + 1), 3))
`,
      expected: "0.5 0.245\n2.0 0.762",
      explanation: "$\\varepsilon$-차등 프라이버시는 어떤 멤버십 추론 공격의 이득도 $(e^\\varepsilon - 1)/(e^\\varepsilon + 1)$ 이하로 제한한다. $\\varepsilon = 0.5$면 0.245로 강한 보호지만, $\\varepsilon = 2$면 0.762까지 허용한다. 이 값은 $\\tanh(\\varepsilon/2)$와 같아서 $\\varepsilon$이 커질수록 빠르게 1에 가까워진다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$\\varepsilon$-차등 프라이버시가 멤버십 추론 공격의 이득(TPR − FPR)을 얼마로 제한하는지 유도하고, $\\varepsilon = 1$과 $\\varepsilon = 8$에서 그 의미를 비교하라. DP-SGD는 어떤 두 장치로 이 보장을 얻는가?",
      answer: md`
학습이 $(\varepsilon, \delta)$-차등 프라이버시면 '구성원인가'를 가리는 어떤 검정도 $\text{TPR} \le e^\varepsilon\text{FPR} + \delta$와 $1 - \text{FPR} \le e^\varepsilon(1 - \text{TPR}) + \delta$를 지킨다. 두 부등식이 등호로 만나는 점에서 이득이 가장 크고, $\delta = 0$이면 $\text{FPR} = 1/(e^\varepsilon + 1)$, $\text{TPR} = e^\varepsilon/(e^\varepsilon + 1)$이라 최대 이득은 $(e^\varepsilon - 1)/(e^\varepsilon + 1)$이다. $\varepsilon = 1$이면 약 0.46으로 상당한 공격 여지가 남고, $\varepsilon = 8$이면 0.999로 사실상 아무것도 보장하지 않는다(최악의 경우의 상한이라 실제 공격이 그만큼 성공한다는 뜻은 아니다). DP-SGD는 표본별 기울기를 길이 $C$로 잘라 한 사람의 영향(민감도)을 묶고, 기울기 합에 표준편차 $\sigma C$의 가우스 잡음을 더한 뒤, 여러 걸음의 손실을 회계로 합산해 전체 $\varepsilon$을 얻는다. 잡음 대 신호 비가 $\sigma\sqrt{d}/B$에 비례하므로 큰 배치와 많은 데이터가 필요하고, 소수 집단의 정확도가 더 떨어질 수 있다.
`,
      keyPoints: ["두 부등식 $\\text{TPR} \\le e^\\varepsilon \\text{FPR} + \\delta$와 $1 - \\text{FPR} \\le e^\\varepsilon(1 - \\text{TPR}) + \\delta$가 공격의 (FPR, TPR)을 제한한다", "$\\delta = 0$일 때 최대 이득은 $(e^\\varepsilon - 1)/(e^\\varepsilon + 1)$이다", "$\\varepsilon = 1$이면 약 0.46, $\\varepsilon = 8$이면 0.999로 거의 보장하지 않는다", "DP-SGD는 표본별 기울기 자르기와 가우스 잡음, 프라이버시 회계로 보장을 얻는다", "대가는 큰 배치와 많은 데이터의 필요, 소수 집단의 정확도 하락이다"],
    },
  ],
  references: [
    { title: "Abadi et al. (2016) — Deep Learning with Differential Privacy", url: "https://arxiv.org/abs/1607.00133", note: "DP-SGD와 모멘트 회계 (영문)" },
    { title: "Shokri et al. (2017) — Membership Inference Attacks against Machine Learning Models", url: "https://arxiv.org/abs/1610.05820", note: "멤버십 추론 공격의 원 논문 (영문)" },
    { title: "Yeom et al. (2018) — Privacy Risk in Machine Learning: Analyzing the Connection to Overfitting", url: "https://arxiv.org/abs/1709.01604", note: "과적합과 멤버십 추론, 차등 프라이버시 상한의 관계 (영문)" },
    { title: "Bagdasaryan et al. (2019) — Differential Privacy Has Disparate Impact on Model Accuracy", url: "https://arxiv.org/abs/1905.12101", note: "DP 학습이 소수 집단의 정확도를 더 떨어뜨리는 현상 (영문)" },
  ],
});
