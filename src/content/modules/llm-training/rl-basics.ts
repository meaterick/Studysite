import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/rl-basics";

export default defineLesson({
  id: "rl-basics",
  title: "강화학습 기초",
  tier: "supplement",
  goal: "Agent·Environment·State·Action·Reward·Policy·Return과 MDP, 벨만 방정식, 탐색–활용 트레이드오프를 설명하고, 가치 기반(Q-Learning·DQN)과 정책 기반(Policy Gradient·Actor-Critic·PPO) 방법을 구분할 수 있다.",
  why: "",
  body: md`
RLHF는 이름에 이미 "강화학습(Reinforcement Learning, RL)"이 들어 있지만, 핵심 과정의 「RLHF와 DPO」 단계에서는 "PPO라는 강화학습 알고리즘을 쓴다" 정도로만 짚고 넘어갔다. RLHF를 제대로 이해하려면 먼저 일반적인 강화학습 문제가 무엇을 정의하고 무엇을 풀려고 하는지부터 정리해둘 필요가 있다.

강화학습은 에이전트(Agent)가 환경(Environment)과 상호작용하며 보상(Reward)을 최대화하는 행동 방식을 학습하는 문제를 다룬다. 이 상호작용은 다음과 같은 요소로 정식화된다. 에이전트는 매 시점 환경의 상태(State) $s_t$를 관찰하고, 그 상태에서 행동(Action) $a_t$를 선택한다. 환경은 그 행동에 반응해 새로운 상태 $s_{t+1}$과 보상(Reward) $r_t$를 반환한다. 에이전트가 상태를 보고 행동을 선택하는 규칙을 정책(Policy) $\pi(a \mid s)$이라 부르고, 한 에피소드 동안 받은 보상들을 (흔히 할인율 $\gamma$로 미래 보상을 깎아) 합산한 값을 이득(Return) $G_t = \sum_{k=0}^{\infty} \gamma^k r_{t+k}$이라 부른다. RLHF 맥락에서는 이 각 요소가 다음과 같이 대응한다. Agent는 LLM 자신, Environment는 지금까지의 대화(문맥), State는 현재까지 생성된 토큰 시퀀스, Action은 다음에 생성할 토큰 하나를 고르는 것, Reward는 응답 전체에 대해 사람(또는 보상모델)이 매기는 선호 점수다.

:::example 이득(Return) 계산하기
세 스텝 동안 보상이 $r_0 = 0$, $r_1 = 0$, $r_2 = 1$이고 $\gamma = 0.9$라면

$$G_0 = 0 + 0.9 \times 0 + 0.9^2 \times 1 = 0.81$$

이다. 같은 보상 1이라도 늦게 받을수록 지금 시점에서는 덜 가치 있게 친다. RLHF는 이 예와 비슷하다. 토큰을 하나씩 고르는 동안에는 보상이 0이고, 응답이 끝난 뒤에야 보상모델 점수 하나가 주어진다.
:::

\`\`\`image
src: /images/week6/rl-agent-environment-loop.svg
alt: 강화학습의 Agent-Environment 상호작용 루프 다이어그램: Agent가 Action을 Environment에 보내면 Environment는 State와 Reward를 Agent에 돌려주는 순환 구조
caption: 강화학습의 기본 상호작용 루프. Agent는 현재 State를 관찰해 Action을 선택하고, Environment는 그 Action에 대해 새로운 State와 Reward를 반환한다. 이 순환이 한 스텝씩 반복되며 Agent는 누적 Reward(Return)를 늘리는 방향으로 Policy를 학습한다.
credit: Megajuice, CC0, Wikimedia Commons
width: 300
height: 290
\`\`\`

[[diagram:rl-llm-mapping]]

이런 상호작용을 수학적으로 정식화하는 틀이 MDP(Markov Decision Process)다. MDP는 상태 집합, 행동 집합, 상태 전이 확률, 보상 함수, 할인율의 다섯 요소 $(S, A, P, R, \gamma)$로 구성되며, 핵심 가정은 "다음 상태와 보상은 오직 현재 상태와 현재 행동에만 의존하고, 그 이전에 어떤 경로를 거쳐 왔는지에는 의존하지 않는다"는 마르코프 성질(Markov property)이다. 강화학습 알고리즘 대부분은 이 MDP라는 틀 안에서 최적 정책을 찾는 문제로 정의된다.

특정 상태(혹은 상태-행동 쌍)에서 앞으로 기대할 수 있는 누적 보상, 즉 "장기적 가치"를 추정하는 함수가 가치함수(Value Function)와 Q함수(Q Function)다. 가치함수 $V^\pi(s)$는 정책 $\pi$를 따를 때 상태 $s$에서 시작해 앞으로 받을 것으로 기대되는 이득이고, Q함수 $Q^\pi(s, a)$는 상태 $s$에서 특정 행동 $a$를 선택한 뒤 그 이후로는 정책 $\pi$를 따랐을 때 기대되는 이득이다. 이 두 가치함수는 재귀적으로 정의될 수 있는데, 이 재귀 관계를 벨만 방정식(Bellman Equation)이라 부른다.

\`\`\`math
Q^\pi(s, a) = \mathbb{E}\left[r + \gamma \, Q^\pi(s', a')\right]
\`\`\`

이 식이 말하는 바는 "지금 이 상태-행동 쌍의 가치는, 당장 받는 보상 $r$에 그다음 상태-행동 쌍의 가치를 할인해 더한 것과 같다"는 것이다. 즉 먼 미래까지 일일이 시뮬레이션하지 않고도, 한 스텝 앞의 가치 추정치로부터 지금의 가치를 재귀적으로 계산할 수 있다는 뜻이다.

벨만 방정식을 그대로 반복 적용하면 가치가 계산된다. 아래는 일렬로 놓인 칸 5개에서 오른쪽 끝에 도착하면 보상 1을 받는 아주 작은 환경이다. 각 칸에서 "오른쪽/왼쪽 중 더 좋은 행동의 값"으로 가치를 갱신하는 것을 몇 번 반복한다(가치 반복, value iteration).

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

목표 바로 옆 칸(3번)의 가치는 1, 그 왼쪽은 $0.9$, 그다음은 $0.81$, $0.729$로 한 칸 멀어질 때마다 $\gamma$배가 된다. 먼 미래를 시뮬레이션하지 않고도 "한 칸 앞의 값"만으로 모든 칸의 가치가 채워졌다.

[[diagram:value-iteration]]

강화학습에는 또 하나의 근본적인 딜레마가 있다. 지금까지 겪어본 행동 중 가장 보상이 높았던 행동을 계속 반복할 것인가(exploitation, 활용), 아니면 아직 시도해보지 않은 행동을 탐색해 혹시 더 좋은 보상이 있는지 확인할 것인가(exploration, 탐색)? 이 둘 사이의 균형을 맞추는 문제를 탐색-활용 트레이드오프(Exploration vs Exploitation)라 부른다. 알려진 좋은 행동만 반복하면 그보다 더 나은 행동을 영영 발견하지 못할 수 있고, 탐색에만 치중하면 이미 알고 있는 좋은 보상을 놓치게 된다.

가장 간단한 해법은 **$\varepsilon$-탐욕($\varepsilon$-greedy)**이다. 확률 $\varepsilon$으로는 아무 행동이나 시도하고(탐색), 나머지 확률로는 지금까지 평균 보상이 가장 높았던 행동을 고른다(활용). 당첨 확률이 0.3, 0.5, 0.7인 슬롯머신 3대(에이전트는 모른다)로 실험해 보자.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
true_p = np.array([0.3, 0.5, 0.7])                 # 슬롯머신 3대의 실제 당첨 확률 (에이전트는 모른다)

def run(eps, steps=2000):
    counts, values, total = np.zeros(3), np.zeros(3), 0
    for _ in range(steps):
        if rng.random() < eps:
            a = rng.integers(3)                    # 탐색: 아무거나 하나 시도
        else:
            a = int(np.argmax(values))             # 활용: 지금까지 가장 좋았던 것
        r = float(rng.random() < true_p[a])
        counts[a] += 1
        values[a] += (r - values[a]) / counts[a]   # 평균 보상을 점진적으로 갱신
        total += r
    return total / steps, counts

for eps in [0.0, 0.1, 0.5]:
    avg, counts = run(eps)
    print(f"ε = {eps}: 평균 보상 {avg:.3f}, 머신별 선택 횟수 {counts.astype(int)}")
\`\`\`

$\varepsilon = 0$이면 처음 당첨된 0번 머신(0.3)에 갇혀 더 좋은 머신을 끝내 발견하지 못한다. $\varepsilon = 0.5$는 너무 자주 탐색해 좋은 머신을 알고도 절반은 다른 것을 누른다. $\varepsilon = 0.1$이 둘 사이의 균형을 잡아 가장 높은 평균 보상을 얻었다. LLM에서는 temperature를 높여 다양한 응답을 뽑는 것이 탐색 역할을 한다.

[[diagram:epsilon-greedy]]

Q함수를 직접 학습하는 대표적인 방법이 Q-Learning이다. 벨만 방정식을 이용해 현재 Q값 추정치를 "한 스텝 뒤 보상 + 할인된 다음 상태의 최대 Q값"이라는 목표값에 가까워지도록 반복적으로 갱신한다. 상태 공간이 작을 때는 Q값을 표(table)로 저장해두고 갱신할 수 있지만, LLM의 상태처럼 상태 공간이 사실상 무한히 큰 경우에는 표로 저장하는 것이 불가능하다. DQN(Deep Q-Network)은 이 Q함수 자체를 신경망으로 근사해, 상태를 입력으로 받아 각 행동의 Q값을 출력하도록 학습시킨 방법이다. 신경망이라는 함수 근사기 덕분에 한 번도 정확히 겪어보지 않은 상태에 대해서도 비슷한 상태로부터 일반화된 Q값을 추정할 수 있게 된다.

Q함수를 거치지 않고 정책 $\pi(a \mid s)$ 자체를 신경망으로 직접 표현하고 학습하는 방법군을 정책 경사(Policy Gradient) 방법이라 부른다. 기대 이득을 정책 파라미터에 대해 미분한 기울기 방향으로 정책 파라미터를 직접 업데이트한다. 액터-크리틱(Actor-Critic)은 정책(actor, "무슨 행동을 할지 결정")과 가치함수(critic, "그 행동이 얼마나 좋았는지 평가")를 함께 학습시켜, critic이 계산한 가치 추정치를 actor의 기울기 갱신에 활용함으로써 정책 경사 학습의 분산을 줄이고 안정성을 높인 구조다. 「RLHF와 DPO」 단계에서 만난 PPO(Proximal Policy Optimization)가 바로 이 Actor-Critic 계열에 속하는 알고리즘이며, "정책을 업데이트하되 기존 정책에서 너무 멀리 벗어나지 않도록 제약을 건다"는 것이 PPO라는 이름의 Proximal(근접)이 뜻하는 바다.

[[diagram:rl-method-map]]

이제 이 일반 이론을 LLM 정렬에 적용한 것이 RLHF다. Agent(LLM)가 State(대화 문맥)를 보고 Action(다음 토큰)을 선택해 Return(누적 보상)을 최대화하도록 Policy(언어모델 자체)를 학습시키는 문제로 SFT 이후 단계를 재구성하면, 남는 것은 "이 Reward를 어떻게 정의하고 어떻게 계산할 것인가"뿐이다. 「RLHF와 DPO」 단계의 RLHF가 바로 이 질문에 대한 답이다. 정책 경사를 실제로 유도하고 PPO의 클리핑을 숫자로 확인하는 것은 심화 과정의 「정책 경사와 PPO」 단계에서 한다.
`,
  checks: [
    {
      key: "c1",
      question: "RLHF에서 \"Action\"에 해당하는 것은?",
      choices: ["사람이 매긴 점수", "다음에 생성할 토큰을 고르는 것", "보상모델의 파라미터", "프롬프트 데이터셋"],
      answer: 1,
      explanation: "State는 지금까지의 토큰 시퀀스, Action은 다음 토큰 선택, Reward는 응답에 대한 선호 점수다.",
    },
    {
      key: "c2",
      question: "$\\gamma = 0.9$이고 한 스텝 뒤 목표 지점에서 보상 1을 받는다면, 목표 두 칸 전 상태에서 최선 행동의 Q값은? (중간 보상 0)",
      choices: ["1", "0.9", "0.81", "0.5"],
      answer: 1,
      explanation: "한 칸 전: 1, 두 칸 전: $0 + 0.9 \\times 1 = 0.9$. 목표 바로 앞 두 칸의 값이 이렇게 정해진다.",
    },
    {
      key: "c3",
      question: "PPO는 어느 계열의 알고리즘인가?",
      choices: ["표 기반 Q-Learning", "DQN", "정책 경사 기반의 Actor-Critic", "지도학습"],
      answer: 2,
      explanation: "정책(actor)을 직접 학습하고 가치함수(critic)로 분산을 줄이며, 기존 정책에서 너무 멀리 벗어나지 않게 제약한다.",
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
      choices: ["처음에 괜찮았던 행동에 갇혀 더 좋은 행동을 영영 발견하지 못한다", "모든 행동을 똑같이 자주 고른다", "보상이 무한히 커진다", "학습이 너무 느리게 수렴한다"],
      answer: 0,
      explanation: "탐색이 전혀 없으면 시도해 보지 않은 행동의 가치를 알 수 없다. 처음 보상을 준 행동만 계속 고르게 되어 더 나은 선택지를 놓친다.",
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
      explanation: "점진적 평균 갱신은 보상을 모두 저장하지 않고도 지금까지의 평균과 정확히 같습니다: 1, (1+0)/2, 2/3, 3/4. 슬롯머신 실습의 `est[a] += (r - est[a]) / cnt[a]`가 이 식입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "강화학습의 Agent, Environment, State, Action, Reward를 RLHF 맥락(LLM 정렬)에 각각 대응시켜 설명하라.",
      answer: md`
Agent=LLM, Environment=대화 상황, State=지금까지의 대화 맥락, Action=다음에 생성할 토큰(또는 응답), Reward=그 응답에 대한 사람의 선호도 점수에 각각 대응시킬 수 있다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "MDP가 강화학습 문제를 정식화하는 틀이라고 할 때, 그 핵심 가정인 마르코프 성질(Markov property)이 무엇인지 설명하라.",
      answer: md`
마르코프 성질은 다음 상태가 현재 상태에만 의존하고 그 이전의 전체 이력에는 의존하지 않는다는 성질이다. MDP는 강화학습 문제를 (State, Action, Reward, 전이확률)로 정식화할 때 이 마르코프 성질을 가정한다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "벨만 방정식 $Q^\\pi(s, a) = \\mathbb{E}[r + \\gamma Q^\\pi(s', a')]$이 말해주는 재귀적 구조를 자기 언어로 설명하라.",
      answer: md`
벨만 방정식은 어떤 상태(또는 상태-행동)의 가치가 '지금 당장의 보상 + 다음 상태의 가치'로 재귀적으로 정의된다는 것을 나타낸다. 즉 가치함수 자신을 이용해 자기 자신을 정의하는 재귀 구조다.
`,
      keyPoints: [],
    },
    {
      key: "d4",
      question: "Q-Learning/DQN 계열과 Policy Gradient/Actor-Critic 계열은 각각 무엇을 직접 학습하는가? PPO는 이 중 어느 계열에 속하는가?",
      answer: md`
Q-Learning과 DQN은 각 상태-행동 쌍의 가치(Q함수)를 학습해서 가장 가치가 높은 행동을 선택하는 방식이고, Policy Gradient와 Actor-Critic은 가치를 거치지 않고 정책 자체를 직접 학습하는 방식이다. PPO는 Actor-Critic 계열(Policy Gradient 기반)에 속한다.
`,
      keyPoints: [],
    },
    {
      key: "d5",
      question: "탐색-활용 트레이드오프(exploration vs exploitation)란 무엇이며, 왜 둘 중 하나에만 치우치면 안 되는가?",
      answer: md`
탐색(Exploration)은 아직 시도해보지 않은 새로운 행동을 해봄으로써 더 좋은 전략을 발견할 가능성을 열어두는 것이고, 활용(Exploitation)은 지금까지 알아낸 가장 좋은 행동을 반복해 확실한 보상을 챙기는 것이다. 둘 사이의 균형을 잘 잡아야 학습이 효율적으로 진행된다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "OpenAI Spinning Up — Key Concepts in RL", url: "https://spinningup.openai.com/en/latest/spinningup/rl_intro.html", note: "강화학습 용어와 수식을 가장 간결하게 정리한 자료 (영문)" },
    { title: "Hugging Face Deep RL Course — Unit 1", url: "https://huggingface.co/learn/deep-rl-course/unit1/introduction", note: "강화학습 기본 개념을 실습과 함께 배우는 무료 코스 (Unit 2가 Q-Learning)" },
  ],
});
