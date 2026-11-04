import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/rl-basics";

export default defineLesson({
  id: "rl-basics",
  title: "강화학습 기초",
  tier: "supplement",
  goal: "에이전트, 환경, 상태, 행동, 보상, 정책, 이득과 MDP, 벨만 방정식, 탐색과 활용의 균형을 설명하고, 가치 기반 방법(Q-Learning, DQN)과 정책 기반 방법(정책 경사, Actor-Critic, PPO)을 구분한다.",
  why: "RLHF([[lesson:preference-learning]])는 LLM을 강화학습의 정책으로 보고 보상 모델의 점수를 최대화하도록 학습한다. 추론 모델의 학습과 에이전트의 행동 최적화도 같은 틀을 쓰므로, 이 레슨의 용어와 방법을 알아야 PPO나 GRPO 같은 알고리즘이 무엇을 최적화하는지 이해할 수 있다.",
  body: md`
### 강화학습의 구성 요소

**강화학습**(reinforcement learning, RL)은 에이전트(agent)가 환경(environment)과 상호작용하며 보상(reward)의 합을 최대화하는 행동 방식을 학습하는 문제다. 에이전트는 시점 $t$마다 환경의 상태(state) $s_t$를 관찰하고 행동(action) $a_t$를 선택한다. 환경은 그 행동에 따라 다음 상태 $s_{t+1}$과 보상 $r_t$를 돌려준다. 에이전트가 상태를 보고 행동을 고르는 규칙을 **정책**(policy) $\pi(a \mid s)$라 하고, 미래의 보상을 할인율 $\gamma$로 할인해 더한 값을 **이득**(return)이라 한다.

\`\`\`math
G_t = \sum_{k=0}^{\infty} \gamma^k r_{t+k}
\`\`\`

RLHF에서는 각 요소가 다음과 같이 대응한다. 에이전트는 LLM이고, 상태는 프롬프트와 지금까지 생성한 토큰 시퀀스, 행동은 다음 토큰의 선택, 정책은 LLM이 계산하는 다음 토큰 분포다. 고른 토큰을 시퀀스 뒤에 붙이는 것이 상태 전이이고, 보상은 응답이 끝난 뒤 보상 모델이 응답 전체에 매기는 점수다.

:::example 이득 계산하기
세 스텝 동안 보상이 $r_0 = 0$, $r_1 = 0$, $r_2 = 1$이고 $\gamma = 0.9$이면

$$G_0 = 0 + 0.9 \times 0 + 0.9^2 \times 1 = 0.81$$

이다. 같은 보상 1이라도 늦게 받을수록 현재 시점의 이득에 작게 반영된다. RLHF도 이와 같은 구조다. 토큰을 고르는 동안에는 보상이 0이고, 응답이 끝난 뒤에 보상 모델의 점수 하나가 주어진다.
:::

[[diagram:rl-llm-mapping]]

### MDP와 벨만 방정식

강화학습 문제를 수학적으로 정식화하는 틀이 **MDP**(Markov Decision Process)다. MDP는 상태 집합, 행동 집합, 상태 전이 확률, 보상 함수, 할인율의 다섯 요소 $(S, A, P, R, \gamma)$로 구성된다. 핵심 가정은 다음 상태와 보상이 현재 상태와 현재 행동에만 의존하고, 그 이전의 경로에는 의존하지 않는다는 **마르코프 성질**(Markov property)이다. LLM 생성에서는 상태가 지금까지의 토큰 시퀀스 전체이므로 이 성질이 성립한다.

상태나 상태-행동 쌍에서 앞으로 기대할 수 있는 이득을 나타내는 함수가 **가치 함수**(value function)와 **Q 함수**다. 가치 함수 $V^\pi(s)$는 상태 $s$에서 정책 $\pi$를 따를 때 기대되는 이득이고, Q 함수 $Q^\pi(s, a)$는 상태 $s$에서 행동 $a$를 고른 뒤 정책 $\pi$를 따를 때 기대되는 이득이다. 두 함수는 다음 재귀 관계를 만족하며, 이를 **벨만 방정식**(Bellman equation)이라 한다.

\`\`\`math
Q^\pi(s, a) = \mathbb{E}\left[r + \gamma \, Q^\pi(s', a')\right]
\`\`\`

현재 상태-행동 쌍의 가치는 즉시 받는 보상 $r$에 다음 상태-행동 쌍의 가치를 할인해 더한 값의 기댓값이다. 먼 미래까지 시뮬레이션하지 않고, 한 스텝 뒤의 가치 추정치로 현재의 가치를 계산할 수 있다.

벨만 방정식을 반복 적용하면 가치를 계산할 수 있다. 아래 코드는 일렬로 놓인 칸 5개에서 오른쪽 끝에 도착하면 보상 1을 받는 환경에서, 각 칸의 가치를 오른쪽과 왼쪽 중 더 좋은 행동의 값으로 반복해 갱신한다(가치 반복, value iteration).

\`\`\`python
import numpy as np

# 일렬로 놓인 칸 5개. 오른쪽 끝(4번 칸)에 도착하면 보상 1을 받고 끝난다.
n, gamma = 5, 0.9
V = np.zeros(n)
for sweep in range(10):
    for s in range(n - 1):                         # 끝 칸은 가치 0으로 고정(종료 상태)
        right = 1.0 if s + 1 == n - 1 else gamma * V[s + 1]   # 오른쪽으로 가면: 보상 + 할인된 다음 가치
        left = gamma * V[max(s - 1, 0)]            # 왼쪽으로 가면(0번 칸에서는 제자리)
        V[s] = max(right, left)                    # 벨만 최적 방정식: 더 좋은 행동의 값
print("각 칸의 가치:", V.round(3))
\`\`\`

목표 바로 옆 칸(3번)의 가치는 1이고, 왼쪽으로 한 칸씩 멀어질 때마다 $0.9$, $0.81$, $0.729$로 $\gamma$배가 된다. 각 칸의 가치를 한 칸 옆의 가치만으로 계산했지만 모든 칸의 가치가 정해졌다.

[[diagram:value-iteration]]

### 탐색과 활용

강화학습에서는 지금까지 보상이 가장 높았던 행동을 반복할지(**활용**, exploitation), 아직 충분히 시도하지 않은 행동을 시도해 더 좋은 행동이 있는지 확인할지(**탐색**, exploration)를 정해야 한다. 활용만 하면 더 좋은 행동을 발견하지 못할 수 있고, 탐색만 하면 이미 알고 있는 좋은 행동의 보상을 얻지 못한다.

가장 간단한 방법은 **$\varepsilon$-탐욕**($\varepsilon$-greedy)이다. 확률 $\varepsilon$으로는 행동을 무작위로 고르고(탐색), 나머지 확률로는 지금까지 평균 보상이 가장 높았던 행동을 고른다(활용). 아래 코드는 당첨 확률이 0.3, 0.5, 0.7인 슬롯머신 3대(에이전트는 이 확률을 모른다)에서 $\varepsilon$에 따른 평균 보상을 비교한다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
true_p = np.array([0.3, 0.5, 0.7])                 # 슬롯머신 3대의 실제 당첨 확률(에이전트는 모른다)

def run(eps, steps=2000):
    counts, values, total = np.zeros(3), np.zeros(3), 0
    for _ in range(steps):
        if rng.random() < eps:
            a = rng.integers(3)                    # 탐색: 무작위로 하나를 고른다
        else:
            a = int(np.argmax(values))             # 활용: 평균 보상이 가장 높은 것을 고른다
        r = float(rng.random() < true_p[a])
        counts[a] += 1
        values[a] += (r - values[a]) / counts[a]   # 평균 보상을 점진적으로 갱신
        total += r
    return total / steps, counts

for eps in [0.0, 0.1, 0.5]:
    avg, counts = run(eps)
    print(f"ε = {eps}: 평균 보상 {avg:.3f}, 머신별 선택 횟수 {counts.astype(int)}")
\`\`\`

$\varepsilon = 0$이면 모든 추정값이 0인 상태에서 \`argmax\`가 0번 머신을 고르고, 다른 머신을 한 번도 시도하지 않으므로 0번 머신(0.3)만 계속 고른다. $\varepsilon = 0.5$이면 탐색이 지나치게 많아 가장 좋은 머신을 찾은 뒤에도 약 3분의 1은 다른 머신을 고른다. $\varepsilon = 0.1$이 가장 높은 평균 보상을 얻었다. RLHF에서는 정책에서 응답을 샘플링하는 것이 탐색에 해당하며, temperature가 높을수록 다양한 응답이 생성된다.

[[diagram:epsilon-greedy]]

### 가치 기반 방법과 정책 기반 방법

**Q-Learning**은 Q 함수를 직접 학습하는 대표적인 방법이다. 현재 Q값 추정치를 "즉시 보상 + 다음 상태의 최대 Q값을 할인한 값"이라는 목표값에 가까워지도록 반복해 갱신한다. 상태 공간이 작으면 Q값을 표로 저장할 수 있지만, LLM의 상태처럼 상태 공간이 매우 크면 표로 저장할 수 없다. **DQN**(Deep Q-Network)은 Q 함수를 신경망으로 근사해, 상태를 입력받아 각 행동의 Q값을 출력하도록 학습한다. 신경망은 학습 중에 본 적 없는 상태에서도 비슷한 상태의 Q값으로 일반화한다.

**정책 경사**(policy gradient) 방법은 Q 함수를 거치지 않고 정책 $\pi_\theta(a \mid s)$ 자체를 신경망으로 표현해, 기대 이득을 파라미터 $\theta$로 미분한 기울기 방향으로 직접 갱신한다. **Actor-Critic**은 정책(actor)과 가치 함수(critic)를 함께 학습하고, critic의 가치 추정치를 정책의 기울기 계산에 써서 기울기 추정의 분산을 줄인다. RLHF에서 쓰는 **PPO**(Proximal Policy Optimization)는 Actor-Critic 계열의 알고리즘으로, 한 번의 갱신에서 정책이 기존 정책과 크게 달라지지 않도록 제한한다. 이름의 Proximal(근접)이 이 제한을 뜻한다.

[[diagram:rl-method-map]]

RLHF는 이 틀을 LLM에 적용한 것이다. SFT 이후의 학습을 LLM(정책)이 프롬프트와 생성한 토큰(상태)을 보고 다음 토큰(행동)을 골라 보상 모델의 점수(보상)를 최대화하는 문제로 정의하면, 남는 문제는 보상을 어떻게 정의하고 계산하느냐다. 보상 모델을 학습하는 방법은 [[lesson:preference-learning]]에서, 정책 경사를 유도하고 PPO의 클리핑을 계산하는 방법은 [[lesson:policy-gradient]]에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "RLHF에서 행동(action)에 해당하는 것은?",
      choices: ["사람이 매긴 점수", "다음에 생성할 토큰을 고르는 것", "보상 모델의 파라미터", "프롬프트 데이터셋"],
      answer: 1,
      explanation: "상태는 프롬프트와 지금까지 생성한 토큰 시퀀스, 행동은 다음 토큰의 선택, 보상은 응답 전체에 대한 보상 모델의 점수다.",
    },
    {
      key: "c2",
      question: "목표 바로 앞 칸에서 목표로 이동하면 보상 1을 받고 끝나며, 다른 이동의 보상은 0이다. $\\gamma = 0.9$일 때 목표에서 두 칸 떨어진 칸에서 최선 행동의 Q값은?",
      choices: ["1", "0.9", "0.81", "0.5"],
      answer: 1,
      explanation: "목표 바로 앞 칸에서 최선 행동의 Q값은 1이다. 두 칸 떨어진 칸에서는 즉시 보상 0에 다음 칸의 가치 1을 할인해 더하므로 $0 + 0.9 \\times 1 = 0.9$다.",
    },
    {
      key: "c3",
      question: "PPO는 어느 계열의 알고리즘인가?",
      choices: ["표 기반 Q-Learning", "DQN", "정책 경사 기반의 Actor-Critic", "지도학습"],
      answer: 2,
      explanation: "PPO는 정책(actor)을 직접 학습하고 가치 함수(critic)로 기울기 추정의 분산을 줄이며, 한 번의 갱신에서 정책이 기존 정책과 크게 달라지지 않도록 제한한다.",
    },
    {
      key: "c4",
      question: "보상이 차례로 $r_0 = 1$, $r_1 = 0$, $r_2 = 2$이고 $\\gamma = 0.5$일 때 이득 $G_0$은?",
      choices: ["1.5", "3", "2", "1.25"],
      answer: 0,
      explanation: "$G_0 = 1 + 0.5 \\times 0 + 0.5^2 \\times 2 = 1 + 0 + 0.5 = 1.5$다.",
    },
    {
      key: "c5",
      question: "행동이 3개인 $\\varepsilon$-탐욕 정책($\\varepsilon = 0.1$)에서 현재 최선으로 보이는 행동이 선택될 확률은? (탐색할 때는 3개 중 균등하게 고른다)",
      choices: ["약 0.933", "0.9", "0.1", "약 0.333"],
      answer: 0,
      explanation: "활용으로 0.9, 탐색 중에 우연히 고를 확률 $0.1 \\times 1/3 \\approx 0.033$을 더해 약 0.933이다.",
    },
    {
      key: "c6",
      question: "$\\varepsilon$-탐욕에서 $\\varepsilon = 0$으로 두면 생기기 쉬운 문제는?",
      choices: ["처음 고른 행동만 계속 골라 더 좋은 행동을 발견하지 못한다", "모든 행동을 똑같이 자주 고른다", "보상이 무한히 커진다", "학습이 너무 느리게 수렴한다"],
      answer: 0,
      explanation: "탐색이 없으면 시도하지 않은 행동의 가치를 알 수 없다. 본문 코드에서 $\\varepsilon = 0$이면 0번 머신(0.3)만 2,000번 고른다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
est, n = 0.0, 0
for r in [1, 0, 1, 1]:
    n += 1
    est += (r - est) / n
    print(round(est, 3))
`,
      expected: "1.0\n0.5\n0.667\n0.75",
      explanation: "점진적 평균 갱신은 보상을 모두 저장하지 않아도 지금까지의 평균과 같다. 차례로 1, (1+0)/2, 2/3, 3/4이다. 본문 슬롯머신 코드의 `values[a] += (r - values[a]) / counts[a]`가 이 식이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "강화학습의 에이전트, 상태, 행동, 정책, 보상을 RLHF에 각각 대응시키고, 응답이 끝난 뒤에만 보상이 주어질 때 이득이 어떻게 계산되는지 예를 들어 쓰라.",
      answer: md`
에이전트는 LLM, 상태는 프롬프트와 지금까지 생성한 토큰 시퀀스, 행동은 다음 토큰의 선택, 정책은 LLM이 계산하는 다음 토큰 분포다. 보상은 응답이 끝난 뒤 보상 모델이 응답 전체에 매기는 점수다.

이득은 $G_t = \sum_k \gamma^k r_{t+k}$이고, 토큰을 고르는 동안의 보상은 0이므로 마지막 보상만 할인되어 반영된다. 세 스텝의 보상이 0, 0, 1이고 $\gamma = 0.9$이면 $G_0 = 0.9^2 \times 1 = 0.81$이다. 같은 보상이라도 늦게 받을수록 이득에 작게 반영된다.
`,
      keyPoints: [
        "에이전트는 LLM, 상태는 프롬프트와 생성한 토큰, 행동은 다음 토큰의 선택이다",
        "정책은 다음 토큰 분포이고 보상은 응답이 끝난 뒤 보상 모델의 점수다",
        "이득은 보상을 할인율로 할인해 더한 값이며 늦은 보상일수록 작게 반영된다",
      ],
    },
    {
      key: "d2",
      question: "벨만 방정식이 나타내는 재귀 관계를 설명하고, 가치 기반 방법(Q-Learning, DQN)과 정책 기반 방법(정책 경사, Actor-Critic)이 각각 무엇을 학습하는지 비교하라. PPO가 어느 계열인지도 쓰라.",
      answer: md`
벨만 방정식 $Q^\pi(s, a) = \mathbb{E}[r + \gamma Q^\pi(s', a')]$은 현재 상태-행동 쌍의 가치가 즉시 보상과 다음 상태-행동 쌍의 가치를 할인한 값의 합의 기댓값이라는 재귀 관계다. 먼 미래를 시뮬레이션하지 않고 한 스텝 뒤의 가치 추정치로 현재 가치를 계산할 수 있다.

가치 기반 방법은 Q 함수를 학습하고 Q값이 가장 큰 행동을 고른다. Q-Learning은 Q값을 표로, DQN은 신경망으로 표현한다. 정책 기반 방법은 정책 $\pi_\theta(a \mid s)$를 직접 학습해 기대 이득의 기울기 방향으로 갱신하며, Actor-Critic은 가치 함수(critic)를 함께 학습해 기울기 추정의 분산을 줄인다. PPO는 Actor-Critic 계열이며 한 번의 갱신에서 정책이 크게 바뀌지 않도록 제한한다.
`,
      keyPoints: [
        "현재 가치는 즉시 보상과 할인한 다음 가치의 합의 기댓값이다",
        "가치 기반 방법은 Q 함수를 학습하고 Q가 가장 큰 행동을 고른다",
        "정책 기반 방법은 정책을 직접 학습하고 Actor-Critic은 critic으로 분산을 줄인다",
        "PPO는 Actor-Critic 계열이며 정책의 변화량을 제한한다",
      ],
    },
  ],
  references: [
    { title: "OpenAI Spinning Up — Key Concepts in RL", url: "https://spinningup.openai.com/en/latest/spinningup/rl_intro.html", note: "강화학습의 용어와 수식을 정리한 자료 (영문)" },
    { title: "Hugging Face Deep RL Course — Unit 1", url: "https://huggingface.co/learn/deep-rl-course/unit1/introduction", note: "강화학습의 기본 개념을 실습과 함께 다루는 코스. Unit 2가 Q-Learning이다 (영문)" },
  ],
});
