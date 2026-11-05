import { defineLesson, md } from "../../kit";
import exercises from "./labs/preference-learning";

export default defineLesson({
  id: "preference-learning",
  title: "선호도 학습: RLHF와 DPO",
  tier: "core",
  concepts: ["finetuning-alignment-prompting"],
  goal: "SFT·RLHF·DPO의 데이터와 목적함수의 차이, 보상 모델과 KL 페널티의 역할을 설명하고, DPO 손실을 계산하며 $\\beta$가 클수록 모델이 기준 모델 근처에 머무는 이유를 설명한다.",
  why: "대화형 LLM은 SFT 뒤에 선호도 학습을 거쳐 사람이 선호하는 응답을 생성하도록 조정된다. 보상 해킹, 아첨 같은 LLM의 문제가 이 단계에서 생기므로, 목적함수의 구조를 알아야 이런 문제의 원인을 설명하고 평가할 수 있다([[lesson:hallucination]]).",
  body: md`
### SFT 다음 단계

SFT를 마친 모델은 지시에 답하는 형식으로 응답하지만([[lesson:instruction-tuning]]), 같은 프롬프트에 대한 여러 응답 중 사람이 어느 쪽을 더 선호하는지에 대한 정보는 학습하지 않았다. 이 정보를 학습하는 단계를 **선호도 학습**(preference learning)이라 하며, 대표적인 방법이 RLHF와 DPO다.

| 단계 | 학습 데이터 | 손실(목적) |
| --- | --- | --- |
| SFT | (프롬프트, 모범 응답) | 응답 토큰의 교차 엔트로피 |
| 보상 모델 학습 | (프롬프트, 선호 응답, 비선호 응답) | $-\log\sigma(r(x, y_w) - r(x, y_l))$ |
| PPO | 프롬프트만(응답은 정책이 새로 생성) | 보상 − KL 페널티 |
| DPO | (프롬프트, 선호 응답, 비선호 응답) | DPO 손실(아래) |

:::info 여기서 필요한 강화학습 용어
정책은 주어진 문맥에서 다음 토큰을 고르는 확률 규칙이며, 여기서는 언어 모델이다. 보상은 응답의 선호도를 나타내는 점수다. PPO는 정책을 조금씩 갱신해 보상을 높이는 강화학습 알고리즘이다. KL 발산은 현재 정책과 기준 정책의 확률분포 차이를 재며, 이 차이에 벌점을 주어 기준 모델에서 지나치게 멀어지는 것을 억제한다. 이 레슨은 이 역할을 이해하면 읽을 수 있고, 알고리즘의 자세한 원리는 선택 레슨 [[lesson:rl-basics]]에서 다룬다.
:::

### RLHF: 보상 모델과 PPO

**RLHF**(Reinforcement Learning from Human Feedback)는 사람에게 같은 프롬프트에 대한 두 응답 중 어느 쪽이 나은지 물어 (프롬프트, 선호 응답 $y_w$, 비선호 응답 $y_l$) 데이터를 모으고, 이 데이터로 **보상 모델**(reward model) $r(x, y)$을 학습한다. 보상 모델은 두 응답의 점수 차이에 시그모이드를 적용해 사람이 $y_w$를 고를 확률로 해석한다(Bradley–Terry 모델). 로지스틱 회귀([[lesson:logistic-regression]])와 같은 형태이며, 점수의 절댓값은 의미가 없고 같은 프롬프트의 두 응답 사이의 차이만 의미가 있다.

\`\`\`python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

pairs = [(2.0, 0.5), (1.0, 1.0), (0.2, 1.5)]   # 보상 모델의 점수 (선호 응답 r_w, 비선호 응답 r_l)
for r_w, r_l in pairs:
    p = sigmoid(r_w - r_l)                      # Bradley–Terry: 사람이 y_w를 고를 확률
    print(f"r_w={r_w}, r_l={r_l}: P(y_w 선호) = {p:.3f}, 손실 = {-np.log(p):.3f}")
# r_w=2.0, r_l=0.5: P(y_w 선호) = 0.818, 손실 = 0.201
# r_w=1.0, r_l=1.0: P(y_w 선호) = 0.500, 손실 = 0.693
# r_w=0.2, r_l=1.5: P(y_w 선호) = 0.214, 손실 = 1.541
\`\`\`

두 점수가 같으면 확률 0.5(손실 $\ln 2 \approx 0.693$)이고, 선호 응답의 점수가 높을수록 손실이 줄며, 점수를 반대로 매기면 손실이 커진다.

[[diagram:bradley-terry]]

보상 모델을 학습한 뒤에는 강화학습 알고리즘 **PPO**(Proximal Policy Optimization)로 정책(언어 모델)이 생성한 응답의 보상을 최대화한다([[lesson:rl-basics]]). 보상 모델은 사람의 선호를 근사한 함수이므로, 정책이 기준 모델(reference model, 보통 SFT 모델)에서 크게 벗어나면 보상 모델의 오차 때문에 점수만 높은 이상한 응답을 생성할 수 있다. 이를 **보상 해킹**(reward hacking)이라 한다. 그래서 목적함수에 기준 모델과의 KL divergence에 비례하는 페널티를 더한다([[lesson:entropy-kl]]).

\`\`\`math
J(\theta) = \mathbb{E}\left[r(x,y)\right] - \lambda \cdot D_{KL}\left(\pi_\theta \Vert \pi_{ref}\right)
\`\`\`

$\lambda = 0.1$일 때, 응답 A는 보상 8, 기준 모델과의 KL 1이고 응답 B는 보상 9, KL 20이라면 목적함수 값은 A가 $8 - 0.1 \times 1 = 7.9$, B가 $9 - 0.1 \times 20 = 7.0$이다. 보상만 보면 B가 크지만 목적함수는 A를 선택한다. 보상을 조금 더 얻으려고 기준 모델에서 크게 벗어나는 응답을 선택하지 않게 하는 것이 KL 페널티의 역할이다.

[[diagram:kl-penalty-choice]]

### DPO

**DPO**(Direct Preference Optimization)는 보상 모델의 학습과 강화학습 단계를 없앤다. KL 페널티가 있는 RLHF 목적함수의 최적 정책을 풀면, 보상을 정책의 로그확률 비율 $r(x,y) = \beta \log \frac{\pi(y|x)}{\pi_{ref}(y|x)}$ + (응답과 관계없는 항)으로 나타낼 수 있다. 이것을 Bradley–Terry 모델에 대입하면, 보상 모델 대신 정책의 로그확률 비율을 보상으로 쓰는 손실 하나가 나온다([[lesson:dpo-derivation]]).

\`\`\`math
\mathcal{L}_{DPO} = -\log \sigma\left(\beta \log\dfrac{\pi_\theta(y_w|x)}{\pi_{ref}(y_w|x)} - \beta \log\dfrac{\pi_\theta(y_l|x)}{\pi_{ref}(y_l|x)}\right)
\`\`\`

$\pi_\theta$는 학습하는 모델, $\pi_{ref}$는 SFT를 마친 뒤 고정한 기준 모델이다. 괄호 안의 앞 항은 선호 응답의 로그확률을 기준 모델보다 얼마나 높였는지, 뒤 항은 비선호 응답의 로그확률을 얼마나 높였는지를 나타내며, 둘의 차이에 $\beta$를 곱한 값이 클수록 $\sigma$가 1에 가까워져 손실이 0에 가까워진다. 따라서 손실을 줄이면 선호 응답의 확률은 기준 모델보다 높아지고 비선호 응답의 확률은 낮아진다. 보상 모델과 PPO의 샘플링 없이 분류 문제와 같은 지도학습으로 구현되므로 구조가 단순하고 튜닝이 쉽다. 선호 데이터가 Bradley–Terry 모델을 따르고 데이터가 충분하다는 가정에서 RLHF와 같은 목적함수의 최적해를 찾는다는 뜻이며, 실제 학습 결과가 PPO와 항상 같다는 뜻은 아니다.

\`\`\`image
src: /images/week6/dpo-vs-rlhf.png
alt: 왼쪽 분홍 상자 RLHF: 선호 데이터에서 최대우도로 보상 모델을 학습하고, 보상 모델과 언어 모델 정책이 보상 계산과 응답 샘플링을 주고받으며 강화학습을 반복한다. 오른쪽 하늘색 상자 DPO: 선호 데이터에서 최대우도로 언어 모델을 바로 학습한다.
caption: 왼쪽(RLHF): 선호 데이터로 보상 모델을 먼저 학습하고, 정책이 새로 생성한 응답에 보상 모델이 점수를 매기면 강화학습(PPO)으로 정책을 갱신하는 과정을 반복한다. 오른쪽(DPO): 같은 선호 데이터로 언어 모델을 손실 하나로 바로 학습한다. 보상 모델과 샘플링 과정이 없지만, 손실에 기준 모델의 확률이 들어가므로 기준 모델은 필요하다.
credit: Rafailov et al., "Direct Preference Optimization: Your Language Model is Secretly a Reward Model" (NeurIPS 2023), Figure 1, arXiv:2305.18290
width: 1200
height: 242
\`\`\`

**$\beta$의 역할**: $\beta$는 PPO 목적함수의 KL 페널티 계수 $\lambda$와 같은 자리에 있다. $\beta$가 크면 로그확률 비율의 작은 차이로도 시그모이드의 입력이 커져 손실이 빨리 0에 가까워지고, 손실이 평평한 곳에서는 기울기도 거의 0이다. 그래서 모델이 기준 모델에서 조금만 벗어나도 더 움직이지 않아 기준 모델 근처에 머문다. 학습 초반(로그비율 차이가 0일 때)의 기울기 크기는 $\beta/2$로 $\beta$가 클수록 크므로, $\beta$가 정하는 것은 처음의 갱신 크기가 아니라 기준 모델에서 얼마나 벗어나면 멈추는지다. $\beta$가 작으면 같은 손실에 도달하려면 로그확률 비율을 크게 벌려야 하므로 기준 모델에서 더 멀리 이동한다. 실무에서는 0.1 안팎의 값을 많이 쓴다.

$\beta = 0.1$이고, 선호 응답에서 $\log \pi_\theta(y_w|x) = -2.0$, $\log \pi_{ref}(y_w|x) = -3.0$(기준 모델보다 1.0 높음), 비선호 응답에서 $\log \pi_\theta(y_l|x) = -2.5$, $\log \pi_{ref}(y_l|x) = -2.0$(기준 모델보다 0.5 낮음)이면 괄호 안은 $0.1 \times [1.0 - (-0.5)] = 0.15$, $\sigma(0.15) \approx 0.537$, 손실은 $-\ln 0.537 \approx 0.62$다. 로그확률 비율의 차이가 4.0으로 벌어지면 괄호 안은 0.4, 손실은 약 0.51로 줄어든다.

\`\`\`python
import numpy as np

def dpo_loss(logp_theta_w, logp_ref_w, logp_theta_l, logp_ref_l, beta=0.1):
    diff = beta * (logp_theta_w - logp_ref_w) - beta * (logp_theta_l - logp_ref_l)
    return -np.log(1 / (1 + np.exp(-diff)))     # -log σ(diff)

print(f"loss = {dpo_loss(-2.0, -3.0, -2.5, -2.0, beta=0.1):.4f}")   # 0.6210
for beta in (0.01, 0.1, 0.5, 1.0):               # 같은 로그확률에서 β만 바꾼다
    print(f"beta={beta}: loss={dpo_loss(-2.0, -3.0, -2.5, -2.0, beta=beta):.4f}")
# beta=0.01: 0.6857, beta=0.1: 0.6210, beta=0.5: 0.3869, beta=1.0: 0.2014
\`\`\`

같은 로그확률 차이에서 $\beta$가 클수록 손실이 0에 가깝다. 손실이 0에 가까우면 기울기도 작으므로, 큰 $\beta$에서는 모델이 기준 모델에서 더 벗어나도록 하는 학습 신호가 빨리 사라진다.

[[diagram:dpo-beta-loss]]

### 선호도 학습의 한계

:::warn DPO가 없애지 못한 것과 새로 생기는 문제
① **기준 모델은 여전히 필요하다.** 손실에 $\pi_{ref}$가 들어 있으므로 학습 중에 기준 모델의 로그확률을 계산해야 한다. ② **오프라인 학습이다.** PPO는 학습 중인 정책이 새로 생성한 응답에 보상을 계산하지만, DPO는 미리 모은 선호 쌍만 쓴다. 그래서 선호 데이터에 없는 종류의 응답의 확률이 높아져도 직접 줄이지 못하고, 데이터가 현재 정책의 응답과 달라지면 성능이 떨어질 수 있다. ③ 손실은 두 응답의 **차이**만 키우므로, 학습 중에 선호 응답의 로그확률까지 함께 낮아지는 현상이 보고된다. ④ 잘 튜닝한 PPO가 DPO보다 나은 결과를 낸 비교 연구도 있다. 그래서 실무에서는 DPO와 그 변형(IPO, KTO 등), 선호 데이터를 학습 중에 다시 모으는 온라인 방식, PPO 계열을 함께 쓴다.
:::

사람의 선호 데이터로 출력 분포를 조정하는 방법 자체에도 한계가 있다. 보상 모델의 오차를 이용하는 보상 해킹, 정확성보다 사람이 선호하는 응답의 형태(동의, 확신하는 어조)를 우선하게 되는 **아첨**(sycophancy), 선호 데이터가 특정 평가자 집단의 성향을 반영하는 문제가 남는다. PPO의 정책 경사와 클리핑은 [[lesson:policy-gradient]]에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "RLHF의 보상 모델을 학습하는 데이터의 형태는?",
      choices: ["(지시, 모범 응답) 쌍", "(프롬프트, 선호 응답, 비선호 응답) 비교", "라벨 없는 웹 문서", "(이미지, 캡션) 쌍"],
      answer: 1,
      explanation: "사람은 절대 점수보다 두 응답의 비교를 더 일관되게 판단한다. SFT는 (지시, 응답) 쌍을 쓴다.",
    },
    {
      key: "c2",
      question: "$\\beta = 0.1$, 로그확률 비율 차이가 $1.5$일 때 DPO 손실 $-\\log\\sigma(0.15)$는 약?",
      choices: ["0.15", "0.54", "0.62", "0.69"],
      answer: 2,
      explanation: "$\\sigma(0.15) \\approx 0.537$이고 $-\\log 0.537 \\approx 0.62$다. 본문 예제와 같다.",
    },
    {
      key: "c3",
      question: "DPO에서 $\\beta$를 크게 하면?",
      choices: ["모델이 기준 모델에서 더 멀리 벗어날 수 있다", "작은 로그비율 차이로도 손실이 빨리 0에 가까워져, 모델이 기준 모델 근처에 머문다", "보상 모델이 필요해진다", "손실이 항상 커진다"],
      answer: 1,
      explanation: "$\\beta$는 KL 페널티 계수와 같은 역할이다. 최적 정책 $\\pi^* \\propto \\pi_{ref}\\,e^{r/\\beta}$에서 $\\beta$가 클수록 $\\pi^*$가 $\\pi_{ref}$에 가깝다. 학습 초반의 기울기 크기($\\beta/2$)는 오히려 $\\beta$가 클수록 크지만, 작은 로그비율 차이에서 손실이 포화되어 더 멀리 가지 않는다.",
    },
    {
      key: "c4",
      question: "RLHF 목적함수에서 KL 페널티를 없애면 생기기 쉬운 문제는?",
      choices: ["학습이 전혀 되지 않는다", "정책이 보상 모델의 오차를 이용해 점수만 높이는 보상 해킹", "모델 크기가 커진다", "토크나이저가 바뀐다"],
      answer: 1,
      explanation: "보상 모델은 사람의 선호를 근사한 함수이므로, 기준 모델의 분포에서 멀리 벗어난 이상한 출력에 높은 점수를 줄 수 있다.",
    },
    {
      key: "c5",
      question: "DPO에 대한 설명으로 가장 정확한 것은?",
      choices: ["보상 모델도 기준 모델도 필요 없고, 결과는 PPO 기반 RLHF와 항상 같다", "보상 모델을 따로 학습하지 않지만 기준 모델 $\\pi_{ref}$는 계속 필요하고, 미리 모은 선호 쌍으로만 학습하는 오프라인 방식이다", "강화학습으로 새 응답을 생성하며 보상 모델의 점수를 최대화한다", "선호 데이터 없이 정답 응답만으로 학습한다"],
      answer: 1,
      explanation: "DPO는 정책의 로그확률 비율을 보상으로 써서 보상 모델과 PPO 과정을 없앴다. 이상적인 가정(Bradley–Terry 선호, 충분한 데이터)에서 KL 페널티가 있는 같은 목적함수의 최적해를 찾지만, 오프라인 학습이라 실제 결과는 PPO와 다를 수 있고 선호 응답의 확률까지 함께 낮아지는 현상도 보고된다.",
    },
    {
      key: "c6",
      question: "보상 모델이 두 응답에 같은 점수를 매겼다면, Bradley–Terry 모델에서 사람이 첫 응답을 고를 확률은?",
      choices: ["0.5", "0", "1", "점수의 크기에 따라 다르다"],
      answer: 0,
      explanation: "$\\sigma(r_w - r_l) = \\sigma(0) = 0.5$다. Bradley–Terry 모델은 점수의 차이만 쓰므로 두 점수가 같으면 크기와 관계없이 0.5다.",
    },
    {
      key: "c7",
      question: "$\\lambda = 0.1$일 때 보상 9, KL 20인 응답의 목적함수 값 $r - \\lambda \\cdot KL$은?",
      choices: ["7.0", "8.9", "9.0", "−11"],
      answer: 0,
      explanation: "$9 - 0.1 \\times 20 = 7.0$이다. 보상 8, KL 1인 응답(7.9)보다 낮으므로, 보상이 더 높아도 기준 모델에서 크게 벗어난 응답은 선택되지 않는다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "SFT, RLHF, DPO가 각각 어떤 데이터로 무엇을 학습하는지 쓰고, RLHF 목적함수에서 KL 페널티를 없애면 생기는 문제를 쓰라.",
      answer: md`
SFT는 (지시, 모범 응답) 쌍으로 응답 토큰의 교차 엔트로피를 줄여 지시에 답하는 형식을 학습한다. RLHF는 (프롬프트, 선호 응답, 비선호 응답) 비교 데이터로 보상 모델을 학습한 뒤, 정책이 생성한 응답의 보상에서 KL 페널티를 뺀 값을 PPO로 최대화한다. DPO는 같은 비교 데이터로, 정책의 로그확률 비율을 보상으로 쓰는 손실 하나를 줄여 보상 모델과 강화학습 없이 선호를 학습한다.

KL 페널티를 없애면 정책이 기준 모델에서 크게 벗어나도 벌점이 없다. 보상 모델은 사람의 선호를 근사한 함수이므로 정책이 보상 모델의 오차를 이용해 점수만 높은 이상한 응답을 생성하게 되는데, 이것이 보상 해킹이다.
`,
      keyPoints: [
        "SFT: (지시, 응답) 쌍으로 응답 형식을 학습한다",
        "RLHF: 비교 데이터로 보상 모델을 학습하고 PPO로 보상 − KL을 최대화한다",
        "DPO: 비교 데이터로 로그확률 비율 손실을 바로 줄인다",
        "KL 페널티가 없으면 보상 모델의 오차를 이용하는 보상 해킹이 생긴다",
      ],
    },
    {
      key: "d2",
      question: "DPO 손실의 괄호 안 값이 커질수록 손실이 작아지는 이유를 $\\sigma$와 $-\\log$로 쓰고, $\\beta$를 크게 하면 모델이 기준 모델 근처에 머무는 이유를 손실의 기울기로 쓰라.",
      answer: md`
괄호 안의 값 $z$는 선호 응답의 로그확률 비율에서 비선호 응답의 로그확률 비율을 뺀 값에 $\beta$를 곱한 것이다. $z$가 클수록 $\sigma(z)$는 1에 가까워지고 $-\log\sigma(z)$는 0에 가까워지므로, 선호 응답의 확률을 기준 모델보다 높이고 비선호 응답의 확률을 낮출수록 손실이 작아진다.

$\beta$가 크면 로그확률 비율의 작은 차이로도 $z$가 커져 손실이 빨리 0에 가까워지고, 손실이 평평해진 곳에서는 기울기가 거의 0이다. 그래서 모델은 기준 모델에서 조금만 벗어나도 더 갱신되지 않아 기준 모델 근처에 머문다. $\beta$가 작으면 같은 손실에 도달하려면 비율의 차이를 크게 벌려야 하므로 기준 모델에서 더 멀리 이동한다.
`,
      keyPoints: [
        "$z$가 클수록 $\\sigma(z) \\to 1$, $-\\log\\sigma(z) \\to 0$",
        "선호 응답의 확률을 높이고 비선호 응답의 확률을 낮출수록 손실이 작다",
        "$\\beta$가 크면 작은 비율 차이로 손실이 0에 가까워지고 기울기가 사라진다",
        "그래서 $\\beta$가 클수록 기준 모델 근처에 머문다",
      ],
    },
  ],
  references: [
    { title: "Ouyang et al. (2022) — Training language models to follow instructions with human feedback (InstructGPT)", url: "https://arxiv.org/abs/2203.02155", note: "그림 2에 SFT, 보상 모델, PPO의 세 단계가 있다 (영문)" },
    { title: "Rafailov et al. (2023) — Direct Preference Optimization", url: "https://arxiv.org/abs/2305.18290", note: "4절: β가 기준 정책에서 벗어나는 정도를 조절한다 (영문)" },
    { title: "Hugging Face — Illustrating RLHF", url: "https://huggingface.co/blog/rlhf", note: "RLHF 파이프라인을 그림으로 정리한 블로그 (영문)" },
  ],
});
