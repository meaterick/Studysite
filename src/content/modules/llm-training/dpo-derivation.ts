import { defineLesson, md } from "../../kit";
import exercises from "./labs/dpo-derivation";

export default defineLesson({
  id: "dpo-derivation",
  title: "DPO의 유도",
  tier: "advanced",
  goal: "KL 규제 보상 최대화의 최적 정책 $\\pi^* \\propto \\pi_{ref}e^{r/\\beta}$를 유도하고, 보상의 재매개변수화와 Bradley–Terry 모델에서 분배함수가 소거되어 DPO 손실이 나오는 과정을 설명하며, 그 가정이 깨질 때의 약점을 말할 수 있다.",
  why: "DPO는 보상 모델과 강화학습 없이 선호 데이터만으로 RLHF와 같은 목적함수를 최적화한다. 유도 과정을 알면 $\\beta$가 학습에 미치는 영향, DPO에서 선호 응답의 확률까지 떨어지는 현상, IPO·KTO·SimPO 같은 후속 방법이 바꾼 가정을 판단할 수 있다.",
  body: md`
[[lesson:preference-learning]]은 DPO 손실의 형태와 사용법을 다뤘다. 이 레슨은 그 손실을 RLHF의 목적함수에서 유도한다. 유도 과정을 따라가면 DPO가 RLHF와 **같은 목적함수의 최적해**를 구한다는 말의 의미와, DPO의 어떤 가정이 성립하지 않을 때 성능이 떨어지는지를 확인할 수 있다. IPO, KTO, SimPO 같은 후속 선호 학습 방법도 이 유도의 일부 가정을 바꾼 변형이다.

### 1단계: KL 규제 목적함수의 최적 정책

프롬프트 $x$ 하나를 고정하고(이하 $x$ 생략), RLHF가 최대화하는 목적함수를 쓰자. 보상의 기댓값에서 기준 모델과의 KL을 $\beta$만큼 뺀 것이다.

$$J(\pi) = \sum_y \pi(y)\,r(y) - \beta \sum_y \pi(y) \log\frac{\pi(y)}{\pi_{ref}(y)}$$

다음 분포를 정의한다. $Z = \sum_y \pi_{ref}(y)\,e^{r(y)/\beta}$는 합이 1이 되게 하는 정규화 상수다.

$$\pi^*(y) = \frac{1}{Z}\,\pi_{ref}(y)\,e^{r(y)/\beta}$$

로그를 취하면 $\log\frac{\pi(y)}{\pi_{ref}(y)} = \log\frac{\pi(y)}{\pi^*(y)} + \frac{r(y)}{\beta} - \log Z$다. 이것을 $J$에 대입하면 보상 항이 정확히 상쇄된다.

$$J(\pi) = \sum_y \pi\,r - \beta\sum_y \pi \log\frac{\pi}{\pi^*} - \sum_y \pi\,r + \beta\log Z = \beta\log Z - \beta\,D_{KL}(\pi \,\Vert\, \pi^*)$$

KL은 항상 0 이상이고 두 분포가 같을 때만 0이므로, $J$를 최대로 만드는 정책은 $\pi^*$ 하나뿐이고 그때의 최댓값은 $\beta\log Z$다. 목적함수를 "상수 − KL"의 형태로 쓰면 최적해가 바로 정해진다. VAE의 ELBO와 로그가능도의 관계([[lesson:generative-math]])도 같은 형태다.

이 닫힌 해에서 $\beta$의 역할을 확인할 수 있다. $\beta \to 0$이면 $e^{r/\beta}$에서 보상이 가장 큰 응답의 항이 나머지보다 훨씬 커져 정책이 그 응답에 확률을 모으고, 보상 모델의 오차까지 그대로 최대화하는 보상 해킹이 일어난다. $\beta \to \infty$이면 $e^{r/\beta} \to 1$이므로 $\pi^* = \pi_{ref}$가 된다.

:::example 응답이 두 개뿐인 경우
응답이 두 개뿐이고 $\pi_{ref} = (0.5, 0.5)$, 보상 $r = (1, 0)$, $\beta = 1$이라 하자. $\pi^* \propto (0.5\,e^{1}, 0.5\,e^{0}) = (1.359, 0.5)$이고, 합 $Z = 1.859$로 나누면 $\pi^* \approx (0.731, 0.269)$다. 보상이 높은 응답의 확률이 커지지만, 다른 응답의 확률도 0이 되지 않는다. $\beta = 0.1$이면 $e^{10}$ 때문에 거의 $(1, 0)$이 되고, $\beta = 10$이면 $e^{0.1} \approx 1.1$이므로 거의 $(0.5, 0.5)$다.
:::

아래 코드는 응답이 3개인 경우에 $\pi^*$의 목적함수 값이 $\beta \log Z$와 같은지, 무작위로 만든 정책 1만 개 중 그보다 목적함수 값이 큰 정책이 있는지 확인한다.

\`\`\`python
import numpy as np

pi_ref = np.array([0.5, 0.3, 0.2])      # 기준 모델이 응답 3개에 주는 확률
r = np.array([1.0, 2.0, 0.0])           # 보상
beta = 1.0

def J(pi):                              # 보상 기댓값 − β·KL(π || π_ref)
    return (pi * r).sum() - beta * (pi * np.log(pi / pi_ref)).sum()

Z = (pi_ref * np.exp(r / beta)).sum()
pi_star = pi_ref * np.exp(r / beta) / Z
print("π* =", pi_star.round(3), " J(π*) =", round(J(pi_star), 4), " β·log Z =", round(beta * np.log(Z), 4))

rng = np.random.default_rng(0)
others = [J(p) for p in rng.dirichlet(np.ones(3), size=10000)]   # 무작위 정책 1만 개
print("무작위 정책 1만 개 중 J(π*)를 넘은 것:", sum(o > J(pi_star) for o in others), "개")

for b in [0.1, 1.0, 10.0]:
    p = pi_ref * np.exp(r / b); p /= p.sum()
    print(f"β = {b:>4}: π* = {p.round(3)}")
\`\`\`

$J(\pi^*)$와 $\beta\log Z$가 같고, 무작위 정책 중 이보다 큰 값은 없다. 마지막 세 줄은 $\beta$가 0.1이면 $\pi^*$가 보상이 가장 큰 응답에 확률을 모으고, 10이면 기준 모델에 가까워지는 것을 보여 준다.

[[diagram:kl-optimal-policy]]

### 2단계: 보상을 정책으로 다시 쓰기

$\pi^*$의 정의를 보상에 대해 풀면 다음과 같다.

$$r(y) = \beta\log\frac{\pi^*(y)}{\pi_{ref}(y)} + \beta\log Z$$

보상이 최적 정책과 기준 모델의 로그확률 비율과, 응답과 무관한 상수의 합으로 표현되었다. $Z$는 가능한 모든 응답 $y$에 대한 합이므로 언어 모델에서는 계산할 수 없다. 그러나 이 상수는 **같은 프롬프트의 모든 응답에서 같다**.

### 3단계: Bradley–Terry에서 $Z$가 사라진다

Bradley–Terry 모델에서 선호 확률은 보상의 **차이**로 정해진다. $P(y_w \succ y_l) = \sigma(r(y_w) - r(y_l))$에 2단계의 식을 대입하면 $\beta\log Z$가 빼기에서 소거된다.

$$P(y_w \succ y_l) = \sigma\!\left(\beta\log\frac{\pi^*(y_w)}{\pi_{ref}(y_w)} - \beta\log\frac{\pi^*(y_l)}{\pi_{ref}(y_l)}\right)$$

알 수 없는 $\pi^*$ 자리에 학습할 정책 $\pi_\theta$를 넣고 선호 데이터의 음의 로그우도를 최소화하면 DPO 손실이 된다. DPO는 보상을 정책의 로그확률 비율로 표현한 Bradley–Terry 모델을 최대우도로 학습하는 것이다. 논문의 부제 "Your Language Model is Secretly a Reward Model"이 이 뜻이다. 선호 데이터가 Bradley–Terry 모델을 따르고 충분히 많으며 정책이 모든 분포를 표현할 수 있다면, 최대우도의 해는 참 보상으로 만든 $\pi^*$다.

### DPO 손실의 기울기

암묵적 보상을 $\hat r_\theta(y) = \beta\log\frac{\pi_\theta(y)}{\pi_{ref}(y)}$라 쓰면 DPO 손실의 기울기는 다음과 같다.

$$\nabla_\theta\mathcal{L}_{DPO} = -\beta\,\sigma\big(\hat r_\theta(y_l) - \hat r_\theta(y_w)\big)\big[\nabla_\theta\log\pi_\theta(y_w) - \nabla_\theta\log\pi_\theta(y_l)\big]$$

대괄호는 선호 응답의 확률을 높이고 비선호 응답의 확률을 낮추는 방향이고, 앞의 $\sigma(\cdot)$는 가중치다. 암묵적 보상이 이미 올바른 순서인 쌍은 가중치가 0에 가깝고, **순서가 반대인 쌍일수록 가중치가 크다**. 로지스틱 회귀의 기울기([[lesson:logistic-regression]])와 같은 형태다.

[[diagram:dpo-z-cancel]]

### 가정이 성립하지 않을 때

유도에 쓴 가정은 DPO의 약점과 대응한다.

- **관측한 쌍만 제약한다.** 손실은 $y_w$와 $y_l$의 로그확률 비율의 **차이**만 보므로, 두 응답의 확률이 함께 낮아져도(확률이 데이터에 없는 다른 응답으로 옮겨 가도) 차이가 커지면 손실이 줄어든다. 실제로 DPO 학습 중 선호 응답의 로그확률까지 낮아지는 현상이 자주 보고된다.
- **결정적 선호에 과적합한다.** 같은 쌍에서 항상 한쪽이 선호되면 최대우도는 두 보상의 차이를 무한히 키우려 하고, 이때 KL 규제의 효과가 사라진다. IPO는 이 문제를 보완한 변형이다(Azar et al., 2023).
- **오프라인 학습이다.** 학습 데이터는 다른 정책이 생성한 응답이므로, 학습 중인 정책이 실제로 생성할 응답에서의 성질은 직접 학습하지 않는다. 그래서 학습 중인 정책으로 새 응답을 생성해 선호를 다시 매기는 반복형(online/iterative) DPO가 쓰인다.
`,
  checks: [
    {
      key: "c1",
      question: "목적함수 $\\mathbb{E}_\\pi[r] - \\beta D_{KL}(\\pi \\Vert \\pi_{ref})$를 최대화하는 정책은?",
      choices: ["$\\pi^*(y) \\propto \\pi_{ref}(y)\\,e^{r(y)/\\beta}$", "보상이 가장 큰 응답 하나에 확률 1", "$\\pi_{ref}$ 그대로", "$\\pi^*(y) \\propto r(y)$"],
      answer: 0,
      explanation: "목적함수를 $\\beta\\log Z - \\beta D_{KL}(\\pi \\Vert \\pi^*)$로 다시 쓸 수 있으므로 KL이 0이 되는 $\\pi^*$가 유일한 최적해다. 보상이 가장 큰 응답에 확률 1을 주는 것은 $\\beta \\to 0$인 극한이다.",
    },
    {
      key: "c2",
      question: "DPO 유도에서 계산할 수 없는 분배함수 $Z(x)$가 손실에서 사라지는 이유는?",
      choices: ["선호 확률이 같은 프롬프트의 두 응답 보상의 차이로 정해지므로 $\\beta\\log Z(x)$가 빼기에서 소거된다", "$Z$가 항상 1이기 때문에", "$\\beta$를 0으로 두기 때문에", "보상 모델이 $Z$를 대신 계산하기 때문에"],
      answer: 0,
      explanation: "Bradley–Terry는 $\\sigma(r(y_w) - r(y_l))$이고, 두 보상 모두 같은 $\\beta\\log Z(x)$를 포함하므로 차이에서 상쇄된다.",
    },
    {
      key: "c3",
      question: "DPO 학습 중 선호 응답 $y_w$의 로그확률까지 떨어질 수 있는 이유로 가장 알맞은 것은?",
      choices: ["손실이 두 응답의 로그확률 비율의 차이만 제약하므로, 두 확률이 함께 낮아져도 차이가 커지면 손실이 줄어든다", "학습률이 음수이기 때문에", "기준 모델이 함께 학습되기 때문에", "Bradley–Terry 모델이 틀렸기 때문에"],
      answer: 0,
      explanation: "손실은 관측한 쌍의 차이만 보므로 확률이 데이터에 없는 다른 응답으로 옮겨 갈 수 있다. 오프라인 학습이므로 그 응답들은 학습 데이터에 나타나지 않는다.",
    },
    {
      key: "c4",
      question: "$\\pi_{ref} = (0.5, 0.5)$, 보상 $r = (1, 0)$, $\\beta = 1$일 때 최적 정책 $\\pi^*$에서 첫 응답의 확률은?",
      choices: ["약 0.731", "0.5", "1", "약 0.269"],
      answer: 0,
      explanation: "$\\pi^* \\propto \\pi_{ref}\\,e^{r/\\beta} = (0.5e, 0.5)$이므로 첫 응답은 $e/(e+1) \\approx 0.731$이다.",
    },
    {
      key: "c5",
      question: "최적 정책 $\\pi^* \\propto \\pi_{ref}\\,e^{r/\\beta}$에서 $\\beta \\to \\infty$이면?",
      choices: ["$\\pi^*$가 기준 모델 $\\pi_{ref}$와 같아진다", "보상이 가장 큰 응답에 확률 1이 몰린다", "모든 응답이 균등한 확률을 갖는다", "$\\pi^*$가 정의되지 않는다"],
      answer: 0,
      explanation: "$e^{r/\\beta} \\to e^0 = 1$이므로 $\\pi^* \\to \\pi_{ref}$다. KL 규제가 매우 강해 기준 모델에서 벗어나지 않는다. 반대로 $\\beta \\to 0$이면 보상이 가장 큰 응답에 확률이 모인다.",
    },
    {
      key: "c6",
      question: "KL 규제 최적 정책 $\\pi^*(y) \\propto \\pi_{ref}(y)\\,e^{r(y)/\\beta}$에서 $\\beta \\to 0$이면 정책은 어떻게 되고, 그것이 왜 위험한가?",
      choices: ["보상이 가장 큰 응답 하나에 확률이 모인다. 보상 모델의 오차까지 최대화해 보상 해킹이 일어난다", "기준 모델과 같아진다. 아무것도 학습하지 못한다", "균등분포가 된다. 응답이 무작위가 된다", "변하지 않는다. $\\beta$는 학습 속도만 바꾼다"],
      answer: 0,
      explanation: "$\\beta$가 작으면 $e^{r/\\beta}$에서 보상이 가장 큰 응답의 항이 나머지보다 훨씬 커져 정책이 그 응답에 확률을 모은다. 보상 모델은 사람 선호의 근사이므로, 보상 모델이 잘못 높게 평가한 응답에 확률이 모일 수 있다. 반대로 $\\beta \\to \\infty$이면 $\\pi^* \\to \\pi_{ref}$다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "KL 규제 목적함수 $\\mathbb{E}_\\pi[r] - \\beta D_{KL}(\\pi \\Vert \\pi_{ref})$를 $\\beta\\log Z - \\beta D_{KL}(\\pi \\Vert \\pi^*)$로 다시 써서 최적 정책을 구하고, 보상을 정책으로 다시 쓴 식을 Bradley–Terry 모델에 넣을 때 분배함수 $Z$가 사라지는 이유를 설명하라.",
      answer: md`
$\pi^*(y) = \pi_{ref}(y)e^{r(y)/\beta}/Z$, $Z = \sum_y \pi_{ref}(y)e^{r(y)/\beta}$로 정의하면 $\log\frac{\pi}{\pi_{ref}} = \log\frac{\pi}{\pi^*} + \frac{r}{\beta} - \log Z$이다. 이를 목적함수에 대입하면 보상 항이 상쇄되어 $J(\pi) = \beta\log Z - \beta D_{KL}(\pi \Vert \pi^*)$가 된다. KL은 0 이상이고 $\pi = \pi^*$일 때만 0이므로 $\pi^*$가 유일한 최적해이고 최댓값은 $\beta\log Z$다. 정의를 보상에 대해 풀면 $r(y) = \beta\log\frac{\pi^*(y)}{\pi_{ref}(y)} + \beta\log Z(x)$이다. Bradley–Terry 모델 $P(y_w \succ y_l) = \sigma(r(y_w) - r(y_l))$은 같은 프롬프트의 두 보상의 차이만 보므로, 두 보상에 똑같이 들어 있는 $\beta\log Z(x)$가 빼기에서 소거된다. $\pi^*$ 자리에 $\pi_\theta$를 넣고 선호 데이터의 음의 로그우도를 최소화한 것이 DPO 손실이다.
`,
      keyPoints: [
        "$\\pi^* = \\pi_{ref}e^{r/\\beta}/Z$로 정의하면 목적함수가 $\\beta\\log Z - \\beta D_{KL}(\\pi \\Vert \\pi^*)$가 된다",
        "KL은 0 이상이고 같을 때만 0이므로 $\\pi^*$가 유일한 최적해다",
        "보상을 $\\beta\\log(\\pi^*/\\pi_{ref}) + \\beta\\log Z$로 다시 쓴다",
        "Bradley–Terry는 보상의 차이만 보므로 같은 프롬프트의 $\\beta\\log Z$가 소거된다",
      ],
    },
  ],
  references: [
    { title: "Rafailov et al. (2023) — Direct Preference Optimization: Your Language Model is Secretly a Reward Model", url: "https://arxiv.org/abs/2305.18290", note: "DPO를 제안한 논문. 4절과 부록 A에 유도가 있다 (영문)" },
    { title: "Azar et al. (2023) — A General Theoretical Paradigm to Understand Learning from Human Preferences", url: "https://arxiv.org/abs/2310.12036", note: "결정적 선호에서 DPO가 과적합하는 이유와 IPO를 제시한 논문 (영문)" },
  ],
});
