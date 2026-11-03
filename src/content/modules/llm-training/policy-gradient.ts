import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/policy-gradient";

export default defineLesson({
  id: "policy-gradient",
  title: "정책 경사와 PPO",
  tier: "advanced",
  goal: "로그 미분 트릭으로 정책 경사를 유도하고, 기준값이 편향 없이 분산을 줄이는 이유를 증명하며, PPO 클리핑 목적함수의 비대칭과 RLHF의 PPO가 쓰는 구성 요소(KL 벌점, 가치 함수)를 설명한다.",
  why: "RLHF의 PPO와 추론 모델 학습에 쓰는 GRPO는 모두 정책 경사에 기준값과 클리핑을 더한 방법이다. 학습 설정의 KL 계수, 클리핑 범위 $\\varepsilon$, 묶음 크기가 무엇을 조절하는지 판단하고, 학습 중 정책이 불안정해질 때 원인을 찾으려면 이 레슨의 유도가 필요하다.",
  body: md`
[[lesson:preference-learning]]은 PPO를 보상을 높이면서 기준 모델에서 크게 벗어나지 않게 하는 강화학습 알고리즘으로 소개했다. 이 레슨은 PPO를 구성하는 요소를 차례로 유도한다. 출발점은 기대 보상의 기울기를 **샘플만으로** 구하는 정책 경사 정리이며, 이것은 점수 함수 추정(REINFORCE)과 같다([[lesson:generative-math]]에서 재매개변수화와 비교한다). 그다음 분산을 줄이는 기준값, 한 번 모은 데이터로 여러 번 갱신해도 정책이 크게 바뀌지 않게 하는 PPO의 클리핑을 유도한다. GRPO 같은 LLM 강화학습 방법도 이 세 요소의 조합이다.

### 로그 미분 트릭: 보상을 미분하지 않고 기울기 구하기

정책 $\pi_\theta(a)$에서 행동을 샘플링해 보상 $R(a)$를 받는다. 보상은 사람의 판정이나 보상 모델의 점수이므로 $a$에 대해 미분할 수 없고, 행동 $a$는 이산적인 토큰이다. 그래도 기대 보상의 기울기는 구할 수 있다. $\nabla\pi = \pi\,\nabla\log\pi$를 쓰면 다음과 같다.

$$\nabla_\theta\,\mathbb{E}_{a\sim\pi_\theta}[R(a)] = \sum_a R(a)\,\nabla_\theta\pi_\theta(a) = \mathbb{E}_{a\sim\pi_\theta}\big[R(a)\,\nabla_\theta\log\pi_\theta(a)\big]$$

정책에서 샘플링한 행동으로 $R\,\nabla\log\pi$를 평균하면 편향 없는 기울기 추정량이 된다. 언어 모델에서 행동은 응답 전체 $y$이고 $\log\pi_\theta(y\mid x) = \sum_t \log\pi_\theta(y_t \mid x, y_{<t})$이므로, 필요한 것은 **모델의 토큰 로그확률과 응답 하나당 보상 값 하나**뿐이다. 보상을 미분하지 않아도 된다는 점 때문에 RLHF가 가능하다. 대신 추정량의 분산이 크다. 보상이 모두 양수이면 샘플링된 행동은 항상 확률이 올라가고, 어느 행동이 더 좋은지는 많은 샘플을 평균해야 드러난다.

### 기준값: 기댓값을 유지하고 분산을 줄인다

보상에서 행동과 무관한 값 $b$를 빼도 기댓값은 변하지 않는다.

$$\mathbb{E}_{a\sim\pi}\big[b\,\nabla\log\pi(a)\big] = b\sum_a \nabla\pi(a) = b\,\nabla\!\sum_a \pi(a) = b\,\nabla 1 = 0$$

따라서 $(R - b)\,\nabla\log\pi$도 편향이 없다. $b$를 평균 보상 근처로 정하면 평균보다 좋은 행동의 확률은 높이고 나쁜 행동의 확률은 낮추는 신호가 되어 분산이 크게 줄어든다. 상태마다 평균 보상이 다르면 $b$ 대신 가치 함수 $V(s)$를 학습해 쓰고, $A = R - V(s)$를 **이점**(advantage)이라 한다. 가치 함수를 학습하는 부분이 [[lesson:rl-basics]]의 Actor-Critic에서 critic이다. DeepSeek의 GRPO는 같은 프롬프트에 응답을 여러 개 생성해 **그 묶음의 평균 보상**을 기준값으로 쓴다. critic 신경망이 필요 없으므로 메모리가 크게 줄어든다. [[lesson:test-time-compute]]에서 같은 문제를 여러 번 풀던 방식을 학습에 쓰는 것이다.

아래 코드는 기준값이 분산을 얼마나 줄이는지 측정한다. 행동 3개의 보상이 10, 11, 12로 모두 양수이고 차이는 작다. 같은 정책에서 기울기 추정치를 2,000번 구해 평균과 분산을 비교한다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
theta = np.zeros(3)                       # 행동 3개의 logit
R = np.array([10.0, 11.0, 12.0])          # 보상이 모두 양수이고 차이는 작다

def grad_samples(baseline, n=2000):
    p = np.exp(theta) / np.exp(theta).sum()
    gs = []
    for _ in range(n):
        a = rng.choice(3, p=p)
        g_logp = -p.copy(); g_logp[a] += 1          # ∇θ log softmax(θ)[a]
        gs.append((R[a] - baseline) * g_logp)        # (R − b) ∇ log π
    return np.array(gs)

for b in [0.0, 11.0]:
    g = grad_samples(b)
    print(f"기준값 b = {b:>4}: 기울기 평균 {g.mean(0).round(2)}, 분산 합 {g.var(0).sum():.2f}")
\`\`\`

두 경우 모두 평균은 0번 행동의 확률을 낮추고 2번 행동의 확률을 높이는 방향으로 비슷하다(편향 없음). 그러나 기준값이 없으면 샘플링된 행동의 확률이 항상 크게 올라가므로 분산 합이 약 80이고, 평균 보상 11을 빼면 약 0.2로 수백 배 줄어든다. 분산이 작으면 같은 정확도의 기울기를 훨씬 적은 샘플로 얻는다.

[[diagram:baseline-variance]]

:::example GRPO의 이점 계산
같은 프롬프트에 응답 4개를 생성했더니 보상이 $[1, 0, 0, 1]$(정답이면 1)이다. 묶음 평균 0.5를 빼면 이점은 $[+0.5, -0.5, -0.5, +0.5]$이고, GRPO는 이를 묶음의 표준편차(0.5)로 나눠 $[+1, -1, -1, +1]$로 쓴다. 정답 응답의 확률은 높이고 오답 응답의 확률은 낮춘다. 네 응답이 모두 정답이면 이점이 모두 0이므로 기울기도 0이다. 모델이 항상 맞히는 문제나 항상 틀리는 문제에서는 학습 신호가 없다.
:::

### PPO: 같은 데이터로 여러 번 갱신할 때의 제한

LLM에서 응답을 생성하는 비용이 크므로, 한 번 모은 데이터로 여러 번 갱신하는 것이 효율적이다. 그런데 데이터는 이전 정책 $\pi_{old}$로 생성한 것이다. 중요도 비율 $\rho = \pi_\theta(a)/\pi_{old}(a)$를 곱한 대리 목적함수 $\mathbb{E}_{\pi_{old}}[\rho A]$는 $\theta = \theta_{old}$에서 정책 경사와 같은 기울기를 주지만, 이것을 계속 최대화하면 이점이 큰 행동 하나에 확률이 집중된다. 데이터는 $\pi_{old}$ 근처의 정보만 담고 있는데 정책이 그 범위를 크게 벗어나는 것이다. PPO(Schulman et al., 2017)는 비율이 $[1-\varepsilon, 1+\varepsilon]$ 밖으로 벗어나면 더 이상 이득이 생기지 않도록 비율을 자른다.

$$L^{CLIP}(\theta) = \mathbb{E}\Big[\min\big(\rho A,\ \text{clip}(\rho, 1-\varepsilon, 1+\varepsilon)\,A\big)\Big]$$

$\min$이 비대칭을 만든다. 좋은 행동($A > 0$)은 확률이 $1+\varepsilon$배가 된 뒤에는 이득이 더 늘지 않고, 나쁜 행동($A < 0$)은 확률을 $1-\varepsilon$배 아래로 낮춘 이득은 반영하지 않지만 **확률이 높아진 손해는 자르지 않고** 그대로 반영한다. 두 값 중 항상 작은(비관적인) 값을 고르는 것이다. 클리핑 구간 밖에서는 기울기가 0이 되어 그 행동의 확률은 더 변하지 않는다.

아래 코드는 $\varepsilon = 0.2$에서 확률비 $\rho$에 따른 목적함수 항의 값을 계산한다.

\`\`\`python
import numpy as np

def clip_term(rho, A, eps=0.2):
    return min(rho * A, np.clip(rho, 1 - eps, 1 + eps) * A)

print("확률비 ρ   A=+1(좋은 행동)   A=−1(나쁜 행동)")
for rho in [0.5, 0.8, 1.0, 1.2, 1.5]:
    print(f"  {rho:<6}  {clip_term(rho, 1):>12.2f}   {clip_term(rho, -1):>14.2f}")
\`\`\`

$A = +1$ 열은 $\rho = 1.2$ 이후 값이 1.2로 고정되므로, 확률을 더 높여도 이득이 없다. $A = -1$ 열은 $\rho = 0.5$에서 $-0.8$로 잘려 확률을 더 낮춘 만큼의 이득은 반영하지 않지만, $\rho = 1.5$에서는 $-1.5$를 그대로 반영해 나쁜 행동의 확률이 높아진 손해는 모두 반영한다.

[[diagram:ppo-clip-objective]]

RLHF의 PPO는 여기에 두 가지를 더한다. 보상에 토큰마다 $-\lambda\log(\pi_\theta/\pi_{ref})$를 더해 기준 모델과의 KL을 벌점으로 주고, 응답의 각 토큰 위치에서 이점을 추정하기 위해 가치 함수(value head)를 함께 학습한다. 그래서 학습 중에 정책, 기준 모델, 보상 모델, 가치 모델 네 개를 메모리에 올려야 한다. DPO는 보상 모델과 가치 모델을, GRPO는 가치 모델을 쓰지 않아 이 부담을 줄인다.
`,
  checks: [
    {
      key: "c1",
      question: "정책 경사 $\\nabla\\mathbb{E}_{a\\sim\\pi}[R] = \\mathbb{E}_{a\\sim\\pi}[R\\,\\nabla\\log\\pi(a)]$가 RLHF에 특히 유용한 이유는?",
      choices: ["보상을 미분하지 않고 모델의 로그확률과 응답당 보상 값만으로 기울기를 추정할 수 있기 때문에", "분산이 0이기 때문에", "보상 모델이 필요 없기 때문에", "정책이 결정적이기 때문에"],
      answer: 0,
      explanation: "보상은 사람의 판정이나 보상 모델의 점수이므로 응답에 대해 미분할 수 없다. 로그 미분 트릭은 미분 대상을 정책의 로그확률로 옮긴다.",
    },
    {
      key: "c2",
      question: "REINFORCE에서 보상에서 기준값 $b$(행동과 무관한 값)를 빼도 기울기 추정의 기댓값이 변하지 않는 이유는?",
      choices: ["$\\mathbb{E}[b\\,\\nabla\\log\\pi] = b\\,\\nabla\\sum_a\\pi(a) = b\\,\\nabla 1 = 0$이기 때문에", "$b$가 항상 0이기 때문에", "분산이 줄기 때문에", "PPO가 보정하기 때문에"],
      answer: 0,
      explanation: "확률의 합은 항상 1이므로 그 기울기는 0이다. 그래서 $b$는 기댓값을 바꾸지 않고, 평균 보상 근처로 정하면 분산만 줄인다.",
    },
    {
      key: "c3",
      question: "PPO($\\varepsilon = 0.2$)에서 이점이 음수($A = -1$)인 행동의 확률비가 $\\rho = 1.5$로 커졌을 때 목적함수 항의 값은?",
      choices: ["$-1.5$ (손해를 자르지 않는다)", "$-1.2$", "$-0.8$", "0"],
      answer: 0,
      explanation: "$\\min(\\rho A, \\text{clip}(\\rho)A) = \\min(-1.5, -1.2) = -1.5$다. 나쁜 행동의 확률이 높아진 손해는 그대로 반영되므로, 기울기가 그 확률을 다시 낮춘다.",
    },
    {
      key: "c4",
      question: "PPO($\\varepsilon = 0.2$)에서 이점이 양수($A = +1$)인 행동의 확률비가 $\\rho = 1.5$일 때 목적함수 항의 값은?",
      choices: ["1.2", "1.5", "0.8", "−1.5"],
      answer: 0,
      explanation: "$\\min(1.5 \\times 1,\\ \\text{clip}(1.5, 0.8, 1.2) \\times 1) = \\min(1.5, 1.2) = 1.2$다. 좋은 행동이라도 확률을 1.2배보다 크게 높인 만큼의 이득은 반영하지 않는다.",
    },
    {
      key: "c5",
      question: "GRPO에서 같은 프롬프트의 응답 4개 보상이 $[1, 0, 0, 1]$일 때, 평균만 뺀 첫 응답의 이점은?",
      choices: ["+0.5", "+1", "0", "−0.5"],
      answer: 0,
      explanation: "묶음 평균 0.5를 기준값으로 빼므로 $1 - 0.5 = +0.5$다(표준편차 0.5로 나누면 +1). critic 없이 묶음 평균이 기준값의 역할을 한다.",
    },
    {
      key: "c6",
      question: "PPO($\\varepsilon = 0.2$)에서 이점이 양수($A > 0$)인 행동의 확률비가 이미 $\\rho = 1.5$가 되었다. 이 샘플이 이번 갱신에서 정책에 주는 기울기는?",
      choices: ["0. 클리핑된 값 $1.2A$가 선택되어 $\\theta$와 무관한 상수가 된다", "확률을 더 올리는 방향으로 평소보다 크게", "확률을 내리는 방향", "$\\rho$에 비례해 1.5배"],
      answer: 0,
      explanation: "$\\min(1.5A, 1.2A) = 1.2A$는 $\\theta$에 의존하지 않으므로 기울기가 0이다. 좋은 행동이라도 확률비가 $1+\\varepsilon$를 넘으면 확률을 더 높이지 않으므로, 같은 데이터로 여러 번 갱신해도 정책이 크게 바뀌지 않는다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
r = np.array([1.0, 1.5, 2.0])
pi = np.ones(3) / 3
G = np.eye(3) - pi                     # a번째 행 = ∇log π(a)
for b in (0.0, 1.5, 10.0):
    mean = (pi * (r - b)) @ G          # 기준값 b를 뺀 REINFORCE 추정의 기댓값
    print(b, [round(float(x), 3) + 0.0 for x in mean])
`,
      expected: "0.0 [-0.167, 0.0, 0.167]\n1.5 [-0.167, 0.0, 0.167]\n10.0 [-0.167, 0.0, 0.167]",
      explanation: "기준값이 0, 평균 보상(1.5), 10 중 어느 것이든 기댓값은 정확한 기울기 $[-1/6, 0, 1/6]$으로 같다. $\\mathbb{E}[b\\,\\nabla\\log\\pi] = b\\,\\nabla\\sum_a\\pi(a) = 0$이기 때문이다. 기준값은 분산만 바꾸며, 평균 보상이면 성분별 분산이 약 0.24로 가장 작고 10이면 15 이상으로 커진다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "로그 미분 트릭으로 정책 경사 $\\nabla\\mathbb{E}[R] = \\mathbb{E}[R\\,\\nabla\\log\\pi]$를 유도하고, 기준값 $b$를 빼도 기울기의 기댓값이 변하지 않는 이유를 보여라. PPO 클리핑 목적함수에서 $\\min$이 만드는 비대칭도 설명하라.",
      answer: md`
$\nabla\pi = \pi\nabla\log\pi$를 쓰면 $\nabla_\theta\mathbb{E}_{a\sim\pi_\theta}[R(a)] = \sum_a R(a)\nabla\pi_\theta(a) = \sum_a \pi_\theta(a)R(a)\nabla\log\pi_\theta(a) = \mathbb{E}[R\,\nabla\log\pi_\theta]$다. 보상을 미분하지 않고 샘플의 로그확률 기울기만으로 기울기를 추정할 수 있다.

기준값은 $\mathbb{E}[b\,\nabla\log\pi] = b\sum_a\nabla\pi(a) = b\,\nabla 1 = 0$이므로 빼도 기댓값이 변하지 않고, 평균 보상 근처로 정하면 분산이 크게 줄어든다.

PPO의 $\min(\rho A, \text{clip}(\rho, 1-\varepsilon, 1+\varepsilon)A)$는 좋은 행동($A>0$)에는 확률비 $1+\varepsilon$까지만 이득을 준다. 나쁜 행동($A<0$)은 확률비를 $1-\varepsilon$ 아래로 낮춘 이득은 반영하지 않지만, 확률비가 커진 손해는 자르지 않고 그대로 반영한다. 항상 작은 쪽의 값을 골라, 같은 데이터로 여러 번 갱신해도 정책이 $\pi_{old}$에서 크게 벗어나지 않게 한다.
`,
      keyPoints: [
        "$\\nabla\\pi = \\pi\\nabla\\log\\pi$로 $\\nabla\\mathbb{E}[R] = \\mathbb{E}[R\\,\\nabla\\log\\pi]$를 얻는다",
        "확률의 합이 1이므로 $\\mathbb{E}[b\\,\\nabla\\log\\pi] = 0$이고 기준값은 기댓값을 바꾸지 않는다",
        "좋은 행동은 확률비 $1+\\varepsilon$까지만 이득을 준다",
        "나쁜 행동의 확률이 높아진 손해는 자르지 않고 그대로 반영한다",
      ],
    },
  ],
  references: [
    { title: "Schulman et al. (2017) — Proximal Policy Optimization Algorithms", url: "https://arxiv.org/abs/1707.06347", note: "PPO와 클리핑 목적함수를 제안한 논문(영문)" },
    { title: "OpenAI Spinning Up — Intro to Policy Optimization", url: "https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html", note: "정책 경사 정리와 기준값의 유도(영문)" },
    { title: "Shao et al. (2024) — DeepSeekMath (GRPO)", url: "https://arxiv.org/abs/2402.03300", note: "묶음 평균을 기준값으로 쓰는 GRPO를 제안한 논문(영문)" },
  ],
});
