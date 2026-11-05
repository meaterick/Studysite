import { defineLesson, md } from "../../kit";
import exercises from "./labs/entropy-kl";

export default defineLesson({
  id: "entropy-kl",
  title: "교차엔트로피의 분해와 KL 발산",
  tier: "advanced",
  requires: ["likelihood-entropy"],
  goal: "교차엔트로피를 엔트로피와 KL 발산으로 분해하고, KL 발산의 성질(0 이상, 비대칭)을 계산으로 확인하며, 교차엔트로피를 최소화하는 학습이 KL 발산을 줄이는 이유와 KL의 방향에 따라 근사 결과가 달라지는 이유를 설명한다.",
  why: "분류와 언어 모델의 학습은 데이터 분포와 모델 분포 사이의 KL 발산을 줄이는 일이다. VAE는 잠재변수 분포에 KL 항을 두고([[lesson:generative-math]]), 언어 모델을 선호 데이터로 조정할 때는 원래 모델에서 너무 멀어지지 않도록 KL 벌점을 준다([[lesson:preference-learning]]).",
  body: md`
[[lesson:likelihood-entropy]]에서 엔트로피 $H(p) = -\sum_x p(x)\log p(x)$와 교차엔트로피 $H(p, q) = -\sum_x p(x)\log q(x)$를 정의했다. 이 레슨은 두 값의 차이인 KL 발산의 성질과 쓰임을 다룬다. 이 레슨의 계산은 밑이 2인 로그(비트)로 한다.

### 교차엔트로피의 분해

실제 분포가 공정한 동전 $p = (0.5, 0.5)$인데 모델이 $q = (0.9, 0.1)$이라고 예측했다면, 교차엔트로피는

\`\`\`math
H(p, q) = -[0.5\log_2 0.9 + 0.5\log_2 0.1] \approx 0.5 \times 0.152 + 0.5 \times 3.322 \approx 1.737\text{비트}
\`\`\`

로, $p$의 엔트로피 $H(p) = 1$비트보다 크다. 교차엔트로피와 엔트로피의 차이를 **KL 발산**(쿨백-라이블러 발산)이라고 한다.

\`\`\`math
D_{\mathrm{KL}}(p \parallel q) = H(p, q) - H(p) = \sum_x p(x)\log\frac{p(x)}{q(x)}
\`\`\`

위 예에서는 $1.737 - 1 = 0.737$비트다. 정보이론에서는 $p$를 따르는 결과를 $q$에 맞춘 부호로 기록할 때, $p$에 맞춘 부호보다 평균적으로 더 쓰게 되는 비트 수로 해석한다.

[[diagram:cross-entropy-decomp]]

### KL 발산의 성질

- **0 이상이다.** $D_{\mathrm{KL}}(p \parallel q) \ge 0$이고, $p = q$일 때만 0이다(깁스 부등식). 그래서 $H(p, q) \ge H(p)$다.
- **대칭이 아니다.** 위 예에서 순서를 바꾸면 $D_{\mathrm{KL}}(q \parallel p) = H(q, p) - H(q) = 1 - 0.469 = 0.531$비트로 값이 다르다. 그래서 KL 발산은 거리(대칭이어야 한다)가 아니라 "발산"이라고 부른다.
- **$p(x) > 0$인데 $q(x) = 0$이면 무한대다.** $p$에서 일어나는 사건에 $q$가 확률 0을 주면 $\log\frac{p(x)}{0}$이 무한대가 된다. 모델의 예측 확률이 정확히 0이 되지 않도록 하는 이유 중 하나다.

### 교차엔트로피 최소화는 KL 최소화다

학습에서 $p$는 데이터의 분포라 고정되어 있고, 모델이 바꿀 수 있는 것은 $q$뿐이다. $H(p, q) = H(p) + D_{\mathrm{KL}}(p \parallel q)$에서 $H(p)$는 $q$와 관계없는 상수이므로, **교차엔트로피를 최소화하는 $q$와 KL 발산을 최소화하는 $q$는 같다.** 분류 모델의 교차엔트로피 손실이 0까지 내려가지 않고 멈추는 것도 이 식으로 설명된다. 같은 입력에 정답이 여럿일 수 있으면 데이터 분포 자체의 엔트로피 $H(p)$가 0보다 크기 때문이다.

### KL의 방향과 근사의 모양

복잡한 분포 $p$를 단순한 분포 $q$로 근사할 때, 어느 방향의 KL을 줄이느냐에 따라 결과가 다르다.

- $D_{\mathrm{KL}}(p \parallel q)$를 줄이면, $p$가 확률을 두는 곳에서 $q$가 작을 때 큰 벌점을 받는다. 그래서 $q$는 $p$의 모든 봉우리를 덮도록 넓게 퍼진다.
- $D_{\mathrm{KL}}(q \parallel p)$를 줄이면, $q$가 확률을 두는 곳에서 $p$가 작을 때 벌점을 받는다. 그래서 $q$는 $p$의 봉우리 하나에 좁게 맞춰진다.

[[diagram:kl-direction]]

최대가능도추정과 교차엔트로피 학습은 첫째 방향($p$가 데이터)이다. VAE의 학습식에는 근사 분포를 기준으로 한 둘째 방향의 KL이 들어가고([[lesson:generative-math]]), 언어 모델을 선호 데이터로 조정할 때는 조정 중인 모델 $\pi$와 원래 모델 $\pi_{\text{ref}}$ 사이의 $D_{\mathrm{KL}}(\pi \parallel \pi_{\text{ref}})$를 벌점으로 둔다([[lesson:preference-learning]]).

### 비트와 냇, 코드로 확인

딥러닝 라이브러리는 자연로그를 쓰므로 손실과 KL의 단위가 냇이다. $1\text{비트} = \ln 2 \approx 0.693\text{냇}$이라 값이 0.693배가 될 뿐 의미는 같다.

\`\`\`python
import numpy as np

def entropy(p):
    p = np.asarray(p, dtype=float)
    p = p[p > 0]                         # 0 · log 0 = 0
    return -np.sum(p * np.log2(p))

def cross_entropy(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    return -np.sum(p * np.log2(q))

fair, biased = [0.5, 0.5], [0.9, 0.1]
print(round(entropy(fair), 3), round(entropy(biased), 3))            # 1.0 0.469
print(round(cross_entropy(fair, biased), 3))                         # 1.737
print("KL(fair‖biased) =", round(cross_entropy(fair, biased) - entropy(fair), 3))
print("KL(biased‖fair) =", round(cross_entropy(biased, fair) - entropy(biased), 3))
print("KL(fair‖biased)를 냇으로:", round((cross_entropy(fair, biased) - entropy(fair)) * np.log(2), 3))
\`\`\`

:::warn 흔한 실수
- **KL 발산을 거리처럼 대칭으로 쓴다.** $D_{\mathrm{KL}}(p \parallel q) \ne D_{\mathrm{KL}}(q \parallel p)$이므로 어느 분포가 기준인지 명시한다.
- **예측 확률이 0인 경우를 처리하지 않는다.** $p(x) > 0$인 곳에서 $q(x) = 0$이면 KL과 교차엔트로피가 무한대가 된다.
- **교차엔트로피 손실이 0이 되어야 한다고 생각한다.** 데이터 분포의 엔트로피 $H(p)$가 0보다 크면 손실의 최솟값은 $H(p)$다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$p = (0.5, 0.5)$, $q = (0.75, 0.25)$일 때 $D_{\\mathrm{KL}}(p \\parallel q)$(비트)에 가장 가까운 값은?",
      choices: ["약 0.208", "0", "약 0.811", "1"],
      answer: 0,
      explanation: "$H(p, q) = -[0.5\\log_2 0.75 + 0.5\\log_2 0.25] \\approx 0.5 \\times 0.415 + 0.5 \\times 2 = 1.208$이고 $H(p) = 1$이므로 KL은 약 0.208비트다.",
    },
    {
      key: "c2",
      question: "KL 발산 $D_{\\mathrm{KL}}(p \\parallel q)$에 대한 설명으로 **틀린** 것은?",
      choices: ["항상 0 이상이다", "$p = q$일 때만 0이다", "$H(p, q) - H(p)$와 같다", "항상 $D_{\\mathrm{KL}}(q \\parallel p)$와 같다"],
      answer: 3,
      explanation: "KL 발산은 대칭이 아니다. 공정한 분포와 (0.9, 0.1) 사이에서 $D_{\\mathrm{KL}}(\\text{fair} \\parallel \\text{biased}) \\approx 0.737$, $D_{\\mathrm{KL}}(\\text{biased} \\parallel \\text{fair}) \\approx 0.531$이다.",
    },
    {
      key: "c3",
      question: "데이터 분포 $p$가 고정되어 있을 때, 모델 분포 $q$에 대해 교차엔트로피 $H(p, q)$를 최소화하는 것과 같은 것은?",
      choices: ["$D_{\\mathrm{KL}}(p \\parallel q)$를 최소화하는 것", "$D_{\\mathrm{KL}}(q \\parallel p)$를 최소화하는 것", "$H(q)$를 최대화하는 것", "$H(p)$를 최소화하는 것"],
      answer: 0,
      explanation: "$H(p, q) = H(p) + D_{\\mathrm{KL}}(p \\parallel q)$이고 $H(p)$는 $q$와 관계없는 상수다. 따라서 두 최소화 문제의 해가 같다.",
    },
    {
      key: "c4",
      question: "봉우리가 둘인 분포 $p$를 정규분포 $q$ 하나로 근사할 때, $D_{\\mathrm{KL}}(p \\parallel q)$를 줄인 결과로 알맞은 것은?",
      choices: [
        "$q$가 두 봉우리를 모두 덮도록 넓게 퍼진다",
        "$q$가 봉우리 하나에 좁게 맞춰진다",
        "$q$가 $p$와 정확히 같아진다",
        "$q$의 분산이 0이 된다",
      ],
      answer: 0,
      explanation: "$p$가 확률을 두는 곳에서 $q$가 작으면 큰 벌점을 받으므로 $q$는 두 봉우리를 모두 덮는다. 반대 방향 $D_{\\mathrm{KL}}(q \\parallel p)$를 줄이면 봉우리 하나에 맞춰진다.",
    },
    {
      key: "c5",
      question: "모델의 예측 분포 $q$가 정답 분포 $p$와 완전히 같아지면 교차엔트로피 $H(p, q)$는?",
      choices: ["$H(p)$와 같아지고 KL 발산은 0이 된다", "0이 된다", "무한대가 된다", "1비트가 된다"],
      answer: 0,
      explanation: "$H(p, q) = H(p) + D_{\\mathrm{KL}}(p \\parallel q)$이고 $q = p$면 KL이 0이다. 정답 분포 자체가 불확실하면 $H(p) > 0$이라 손실이 0까지 내려가지 않는다.",
    },
    {
      key: "c6",
      question: "엔트로피 구현의 `p = p[p > 0]` 줄을 지우고 `entropy([1.0, 0.0])`을 계산하면?",
      choices: ["0.0이 정상적으로 나온다", "`nan`이 나온다. $0 \\cdot \\log 0$이 `0 * -inf = nan`이 되기 때문이다", "1.0이 나온다", "`ZeroDivisionError`가 발생한다"],
      answer: 1,
      explanation: "NumPy에서 `np.log2(0)`은 `-inf`이고 `0 * -inf`는 `nan`이다. 수학에서는 극한으로 $0 \\cdot \\log 0 = 0$으로 정의하므로, 코드에서도 확률이 0인 항을 빼고 더해야 정의와 같아진다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "교차엔트로피 $H(p, q)$와 KL 발산 $D_{\\mathrm{KL}}(p \\parallel q)$의 관계식을 쓰고, 분류 모델을 교차엔트로피로 학습하는 것이 무엇을 줄이는 것인지 설명하라. 손실이 0까지 내려가지 않는 경우도 설명하라.",
      answer: md`
$H(p, q) = H(p) + D_{\mathrm{KL}}(p \parallel q)$이다. 교차엔트로피는 데이터 분포 $p$ 자체의 불확실성 $H(p)$와, 모델 분포 $q$가 $p$와 달라서 생기는 추가분 $D_{\mathrm{KL}}(p \parallel q)$의 합이다.

학습에서 $p$는 데이터로 정해져 있어 $H(p)$는 상수다. 따라서 교차엔트로피를 최소화하는 것은 데이터 분포와 모델 분포 사이의 KL 발산을 최소화하는 것과 같다. KL 발산은 $q = p$일 때 0이 되므로, 그때 손실은 최솟값 $H(p)$가 된다. 같은 입력에 정답이 여럿일 수 있는 데이터(예: 다음 단어가 여러 개 가능한 문장)는 $H(p) > 0$이라, 모델이 데이터 분포를 정확히 맞혀도 손실이 0이 되지 않는다.
`,
      keyPoints: ["$H(p, q) = H(p) + D_{\\mathrm{KL}}(p \\parallel q)$", "$H(p)$는 $q$와 관계없는 상수", "교차엔트로피 최소화 = $D_{\\mathrm{KL}}(p \\parallel q)$ 최소화", "$H(p) > 0$이면 손실의 최솟값은 0이 아니라 $H(p)$"],
    },
  ],
  references: [
    { title: "Chris Olah — Visual Information Theory", url: "https://colah.github.io/posts/2015-09-Visual-Information/", note: "엔트로피·교차엔트로피·KL 발산을 그림으로 설명한 글 (영문)" },
  ],
});
