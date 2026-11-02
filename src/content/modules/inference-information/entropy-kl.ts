import { defineLesson, md } from "../../kit";
import exercises from "./labs/entropy-kl";

export default defineLesson({
  id: "entropy-kl",
  title: "엔트로피, 교차 엔트로피, KL 발산",
  tier: "advanced",
  goal: "엔트로피·교차 엔트로피·KL 발산을 동전 예제로 계산하고, 교차 엔트로피가 분류 손실로 쓰이는 이유와 KL의 비대칭성을 설명할 수 있다.",
  why: "",
  body: md`
지금까지는 확률분포의 "모양"(균등, 정규, 베르누이)을 다뤘다. 이제 그 분포가 "얼마나 불확실한가"를 숫자 하나로 요약하는 도구, 엔트로피(entropy)를 살펴보자. 이는 2주차 이후 계속 마주치게 될 교차 엔트로피 손실함수를 이해하기 위한 사전 준비이기도 하다.

정보이론에서 확률변수 $X$의 엔트로피는 다음과 같이 정의된다.

\`\`\`math
H(X) = -\sum_{x} p(x)\log p(x)
\`\`\`

이 값은 "그 분포가 얼마나 불확실한가", 달리 말하면 "$X$의 값을 관찰하기 전까지 얼마나 많은 정보를 모르고 있었는가"를 나타낸다. 로그의 밑을 2로 잡으면 단위는 비트(bit)가 된다. 동전 던지기로 직접 계산해서 직관을 얻어 보자.

동전이 완전히 공정할 때($p=0.5$): $H = -[0.5\log_2 0.5 + 0.5\log_2 0.5] = -[0.5\times(-1) + 0.5\times(-1)] = 1$ 비트. 반대로 동전이 앞면만 나오도록 완전히 조작되어 있을 때($p=1$, $1-p=0$, 이때 $0\log_2 0 = 0$으로 정의한다): $H = -[1\times\log_2 1 + 0] = 0$ 비트다. 즉 결과를 완전히 예측할 수 있는 상황(엔트로피 0)과, 결과가 완전히 반반이라 가장 예측하기 어려운 상황(엔트로피 1비트, 결과가 두 가지뿐인 베르누이 분포에서 나올 수 있는 최댓값이다) 사이를 엔트로피가 정확히 숫자로 재고 있다는 것을 확인할 수 있다. 중간값도 하나 확인해보자. 동전이 앞면 쪽으로 약간 치우쳐 있을 때($p=0.9$): $H = -[0.9\log_2 0.9 + 0.1\log_2 0.1] \approx -[0.9\times(-0.152) + 0.1\times(-3.322)] \approx 0.469$ 비트로, 0과 1 사이의 값이 나온다. 어느 정도 예측 가능하지만 완전히 확실하지는 않은 중간 상태다.

\`\`\`image
src: /images/week1/binary-entropy-plot.svg
alt: 이항 엔트로피 함수 H(p) 그래프. 가로축은 앞면이 나올 확률 p(0~1), 세로축은 엔트로피(0~1비트)이며 p=0.5에서 최댓값 1비트를 가지는 위로 볼록한 곡선
caption: 이항 엔트로피 함수. p=0(또는 1)일 때 결과가 완전히 확실하므로 엔트로피가 0이고, p=0.5일 때 가장 불확실하므로 엔트로피가 최댓값 1비트에 이른다.
credit: Brona(원안)·Alessio Damato(벡터화)·Krishnavedala(단순화), CC BY-SA 3.0 / GFDL, Wikimedia Commons
width: 300
height: 300
\`\`\`

이제 두 분포를 비교하는 도구인 교차 엔트로피(cross entropy)로 넘어가자. 실제 데이터의 분포가 $p$이고, 우리 모델이 예측한 분포가 $q$일 때, 교차 엔트로피는 다음과 같이 정의된다.

\`\`\`math
H(p, q) = -\sum_x p(x)\log q(x)
\`\`\`

이 값은 "실제 분포 $p$를 따르는 사건들을, 모델이 생각하는 분포 $q$의 잣대로 예측하려 할 때 평균적으로 얼마나 많은 비트가 필요한가"를 뜻한다. $q$가 $p$와 완전히 같아지면 $H(p,q)$는 $H(p)$와 같아지는 최솟값에 도달하고, $q$가 $p$와 다를수록 $H(p,q)$는 $H(p)$보다 커진다(이를 깁스 부등식이라 부른다). 즉 교차 엔트로피는 "두 분포가 얼마나 다른가"를 재는 도구이기도 하다. 2주차 이후 분류 모델의 손실함수로 쓰이는 이유가 바로 이것이다. 모델이 정답 분포 $p$를 얼마나 잘 맞히는 예측 분포 $q$를 내놓는지를, 이 교차 엔트로피를 최소화하는 것으로 학습시킬 수 있기 때문이다.

숫자로 확인해보자. 실제 분포가 공정한 동전 $p=(0.5, 0.5)$인데, 모델이 자신 있게(하지만 틀리게) $q=(0.9, 0.1)$이라고 예측했다고 하자. 교차 엔트로피는 $H(p,q) = -[0.5\log_2 0.9 + 0.5\log_2 0.1] \approx -[0.5\times(-0.152)+0.5\times(-3.322)] \approx 1.737$ 비트로, 앞서 구한 $H(p)=1$ 비트보다 크다는 것을 바로 확인할 수 있다.

이 둘의 차이, 즉 "모델이 잘못된 분포를 썼기 때문에 낭비된 비트 수"를 정확히 정의하는 것이 쿨백-라이블러 발산(KL Divergence)이다.

\`\`\`math
D_{\mathrm{KL}}(p \parallel q) = H(p, q) - H(p)
\`\`\`

위 예제에 대입하면 $D_{\mathrm{KL}}(p\parallel q) \approx 1.737 - 1 = 0.737$ 비트다. KL 발산은 항상 0 이상이며(깁스 부등식), $p$와 $q$가 완전히 같을 때만 정확히 0이 된다. 즉 "두 분포가 서로 얼마나 먼가"를 재는, 언뜻 거리처럼 보이지만 $D_{\mathrm{KL}}(p\parallel q) \ne D_{\mathrm{KL}}(q\parallel p)$이므로 엄밀한 의미의 거리(대칭성을 만족하는)는 아닌 척도다.

[[diagram:cross-entropy-decomp]]

### 비트와 냇(nat), 그리고 코드로 확인

여기서는 밑이 2인 로그를 써서 비트로 계산했지만, PyTorch 같은 딥러닝 라이브러리는 자연로그($\ln$)를 쓰고 단위는 **냇(nat)**이다. $1\text{ 비트} = \ln 2 \approx 0.693\text{ 냇}$이라 값이 0.693배가 될 뿐 의미는 같다. 예를 들어 정답 클래스에 0.9를 준 예측의 손실은 $-\log_2 0.9 \approx 0.152$비트, $-\ln 0.9 \approx 0.105$냇이다. 앞으로 학습 로그에서 보는 손실 값은 거의 모두 냇 단위다. 이 단계의 숫자들과 KL의 비대칭성을 코드로 확인해 보자.

\`\`\`python
import numpy as np

def entropy(p):
    p = np.asarray(p, dtype=float)
    p = p[p > 0]                         # 0·log 0 = 0으로 처리
    return -np.sum(p * np.log2(p))

def cross_entropy(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    return -np.sum(p * np.log2(q))

fair, biased = [0.5, 0.5], [0.9, 0.1]
print(round(entropy(fair), 3), round(entropy(biased), 3))            # 1.0 0.469
print(round(cross_entropy(fair, biased), 3))                         # 1.737
print("KL(fair‖biased) =", round(cross_entropy(fair, biased) - entropy(fair), 3))
print("KL(biased‖fair) =", round(cross_entropy(biased, fair) - entropy(biased), 3))
print("정답 확률 0.9일 때 손실:", round(-np.log(0.9), 3), "nats =", round(-np.log2(0.9), 3), "bits")
\`\`\`

$D_{\mathrm{KL}}(\text{fair}\parallel\text{biased}) \approx 0.737$, $D_{\mathrm{KL}}(\text{biased}\parallel\text{fair}) \approx 0.531$로 순서를 바꾸면 값이 다르다. 앞쪽 분포가 기준이 되어 "그 분포에서 자주 나오는 사건을 뒤쪽 분포가 얼마나 낮게 보는가"에 벌점을 주기 때문이다. 6주차 RLHF의 KL 벌점과 4주차 VAE에서 이 방향의 차이가 다시 중요해진다.

[[diagram:kl-direction]]
`,
  checks: [
    {
      key: "c1",
      question: "결과가 네 가지이고 모두 확률 $1/4$로 같은 분포의 엔트로피(밑 2)는?",
      choices: ["1 비트", "2 비트", "4 비트", "0.25 비트"],
      answer: 1,
      explanation: "$H = -4 \\times \\frac14 \\log_2 \\frac14 = \\log_2 4 = 2$ 비트. 균등한 $k$개 결과의 엔트로피는 $\\log_2 k$로, 가능한 최댓값이다.",
    },
    {
      key: "c2",
      question: "KL 발산 $D_{\\mathrm{KL}}(p\\parallel q)$에 대한 설명으로 **틀린** 것은?",
      choices: ["항상 0 이상이다", "$p = q$일 때만 0이다", "$H(p,q) - H(p)$와 같다", "항상 $D_{\\mathrm{KL}}(q\\parallel p)$와 같다"],
      answer: 3,
      explanation: "KL 발산은 비대칭이다. 한 예로 공정한 분포와 치우친 분포 사이에서 $D_{\\mathrm{KL}}(\\text{fair}\\parallel\\text{biased}) \\approx 0.737$, $D_{\\mathrm{KL}}(\\text{biased}\\parallel\\text{fair}) \\approx 0.531$로 서로 다르다.",
    },
    {
      key: "c3",
      question: "정답이 0번 클래스일 때, 모델이 0번 클래스에 준 확률 $q_0$가 0.9에서 0.5로 떨어지면 교차 엔트로피 손실은?",
      choices: ["줄어든다", "늘어난다 (약 0.15 → 1 비트)", "변하지 않는다", "음수가 된다"],
      answer: 1,
      explanation: "정답이 원-핫 $[1, 0]$이면 손실은 $-\\log_2 q_0$이다. $q_0$가 작아질수록 손실이 커지므로, 이 손실을 줄이는 학습은 정답 클래스의 확률을 높인다.",
    },
    {
      key: "c4",
      question: "정답 클래스에 확률 0.5를 준 예측의 교차 엔트로피 손실은 비트와 냇으로 각각 얼마인가?",
      choices: ["1비트, 약 0.693냇", "0.5비트, 0.5냇", "약 0.693비트, 1냇", "2비트, 약 1.386냇"],
      answer: 0,
      explanation: "$-\\log_2 0.5 = 1$비트, $-\\ln 0.5 = \\ln 2 \\approx 0.693$냇이다. 단위만 다르고 같은 양이다.",
    },
    {
      key: "c5",
      question: "모델의 예측 분포 $q$가 정답 분포 $p$와 완전히 같아지면 교차 엔트로피 $H(p, q)$는?",
      choices: ["$p$의 엔트로피 $H(p)$와 같아지고 KL 발산은 0이 된다", "0이 된다", "무한대가 된다", "1비트가 된다"],
      answer: 0,
      explanation: "$H(p, q) = H(p) + D_{\\mathrm{KL}}(p\\parallel q)$이고 $q = p$면 KL이 0이다. 정답 분포 자체가 불확실하면 $H(p) > 0$이라 손실이 0까지 내려가지는 않는다.",
    },
    {
      key: "c6",
      question: "엔트로피 구현의 `p = p[p > 0]` 줄을 지우고 `entropy([1.0, 0.0])`을 계산하면?",
      choices: ["0.0이 정상적으로 나온다", "`nan`이 나온다. $0 \\cdot \\log 0$이 `0 * -inf = nan`이 되기 때문이다", "1.0이 나온다", "`ZeroDivisionError`가 발생한다"],
      answer: 1,
      explanation: "NumPy에서 `np.log2(0)`은 `-inf`이고 `0 * -inf`는 `nan`입니다. 수학에서는 극한으로 $0 \\cdot \\log 0 = 0$이라 정의하므로, 코드에서도 확률이 0인 항을 빼고 더해야 정의와 같아집니다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "공정한 동전($p=0.5$)과 항상 앞면만 나오는 동전($p=1$)의 엔트로피를 각각 계산하고 비교하라.",
      answer: md`
$p=0.5$(50:50)일 때 엔트로피는 최댓값인 1비트로, 결과를 가장 예측하기 어려운 상태다. $p=1$(한쪽으로 확실)일 때 엔트로피는 0비트로, 불확실성이 전혀 없다는 뜻이다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "교차 엔트로피 $H(p,q)$와 KL 발산 $D_{\\mathrm{KL}}(p\\parallel q)$의 관계식을 쓰고, 그 의미를 설명하라.",
      answer: md`
$\text{KL}(p\|q) = H(p,q) - H(p)$ 관계가 성립한다. 교차 엔트로피 $H(p,q)$는 실제 분포 $p$ 대신 잘못된 분포 $q$를 썼을 때 드는 평균 비트 수이고, 여기서 $p$ 자체의 고유한 불확실성 $H(p)$를 뺀 나머지(KL divergence)가 순수하게 $q$가 $p$와 다르기 때문에 '낭비된' 비트 수다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Chris Olah — Visual Information Theory", url: "https://colah.github.io/posts/2015-09-Visual-Information/", note: "엔트로피·교차 엔트로피·KL을 그림으로 설명한 대표적인 글 (영문)" },
  ],
});
