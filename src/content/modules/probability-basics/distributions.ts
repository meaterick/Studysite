import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/distributions";

export default defineLesson({
  id: "distributions",
  title: "정규분포, 이항분포, 표준정규분포",
  tier: "core",
  concepts: ["distributions"],
  goal: "베르누이·이항·균등·정규분포의 확률질량함수나 확률밀도함수와 평균·분산을 쓰고, 이항분포로 성공 횟수의 확률을 계산하며, 정규분포를 표준화해 z-점수와 표준정규분포로 구간의 확률을 구한다.",
  why: "이진 분류의 정답은 베르누이 분포를, 테스트 문제 중 맞힌 개수는 이항분포를 따른다. 그래서 정확도의 오차 범위를 이항분포로 계산한다([[lesson:eval-statistics]]). 가중치 초기화와 데이터의 잡음에는 정규분포를 쓰고([[lesson:initialization]]), 특성 표준화는 z-점수 변환이다([[lesson:encoding-scaling]]).",
  body: md`
### 베르누이 분포

결과가 두 가지(성공과 실패)뿐인 시행을 **베르누이 시행**이라 하고, 성공을 1, 실패를 0으로 나타낸 확률변수 $X$가 $P(X = 1) = p$, $P(X = 0) = 1 - p$이면 $X$가 **베르누이 분포**를 따른다고 한다. 메일이 스팸인지, 광고를 클릭했는지, 모델이 한 문제를 맞혔는지가 모두 베르누이 시행이다.

$X^2 = X$이므로 $E[X] = E[X^2] = p$이고, 분산은 $\mathrm{Var}(X) = p - p^2 = p(1 - p)$다([[lesson:random-variables]]). 분산은 $p = 0.5$일 때 가장 크고, $p$가 0이나 1에 가까워 결과가 거의 정해져 있을수록 작다.

### 이항분포

성공 확률이 $p$인 베르누이 시행을 $n$번 독립으로 했을 때 성공 횟수 $X$는 **이항분포** $B(n, p)$를 따른다.

\`\`\`math
P(X = k) = \binom{n}{k} p^k (1 - p)^{n - k}, \qquad \binom{n}{k} = \frac{n!}{k!\,(n - k)!}
\`\`\`

$p^k (1 - p)^{n - k}$는 성공 $k$번과 실패 $n - k$번이 특정한 순서로 나올 확률이고, $\binom{n}{k}$는 $n$번 중 성공할 $k$번의 위치를 고르는 경우의 수다. 동전 3번에서 앞면이 2번일 확률은 $\binom{3}{2}(0.5)^2(0.5)^1 = 3/8$로, [[lesson:random-variables]]에서 센 값과 같다.

이항분포를 따르는 $X$는 서로 독립인 베르누이 확률변수 $n$개의 합이므로, 기댓값의 선형성과 분산의 합 성질에서 평균과 분산이 바로 나온다.

\`\`\`math
E[X] = np, \qquad \mathrm{Var}(X) = np(1 - p)
\`\`\`

정답률이 0.8인 모델로 10문제를 풀면 맞힌 개수의 평균은 8개, 표준편차는 $\sqrt{10 \times 0.8 \times 0.2} \approx 1.26$개다. 정확히 8문제를 맞힐 확률은 $\binom{10}{8}(0.8)^8(0.2)^2 \approx 0.302$이고, 7문제 이하를 맞힐 확률도 약 0.322다. 같은 모델이라도 문제 10개로 잰 정확도는 70%로도, 90%로도 나올 수 있다는 뜻이다. 문제 수를 늘릴수록 정확도의 표준편차 $\sqrt{p(1 - p)/n}$이 줄어든다([[lesson:eval-statistics]]).

[[diagram:binomial-bars]]

\`\`\`python
from math import comb
import numpy as np

def binom_pmf(n, k, p):
    return comb(n, k) * p ** k * (1 - p) ** (n - k)

print(round(binom_pmf(10, 8, 0.8), 3), round(sum(binom_pmf(10, k, 0.8) for k in range(8)), 3))   # 0.302 0.322

rng = np.random.default_rng(0)
correct = rng.binomial(n=10, p=0.8, size=100_000)       # 10문제 시험을 10만 번 반복
print(round(np.mean(correct == 8), 3), round(correct.mean(), 3), round(correct.std(), 3))   # 약 0.302, 8, 1.26
\`\`\`

### 균등분포

구간 $[a, b]$ 안의 모든 값이 같은 가능성으로 나오는 연속확률변수는 **균등분포** $U(a, b)$를 따른다. 확률밀도는 구간 안에서 $f(x) = \frac{1}{b - a}$로 일정하고(전체 넓이 1), 평균과 분산은 다음과 같다.

\`\`\`math
E[X] = \frac{a + b}{2}, \qquad \mathrm{Var}(X) = \frac{(b - a)^2}{12}
\`\`\`

NumPy의 \`rng.random()\`은 $U(0, 1)$, \`rng.uniform(a, b)\`는 $U(a, b)$에서 값을 뽑는다. 가중치를 균등분포로 초기화하거나 하이퍼파라미터를 구간에서 무작위로 고를 때 쓴다. 주사위처럼 값이 띄엄띄엄한 경우는 이산 균등분포라고 한다.

### 정규분포

**정규분포**(가우스 분포)는 평균 $\mu$를 중심으로 좌우 대칭인 종 모양의 분포이고, $X \sim \mathcal{N}(\mu, \sigma^2)$로 쓴다. 확률밀도함수는 다음과 같다.

\`\`\`math
f(x) = \frac{1}{\sigma\sqrt{2\pi}}\, e^{-\frac{(x - \mu)^2}{2\sigma^2}}
\`\`\`

$\mu$는 분포의 중심 위치를, 표준편차 $\sigma$는 퍼진 정도를 정한다. $\sigma$가 작으면 값이 평균 근처에 모여 좁고 높은 곡선이 되고, $\sigma$가 크면 넓고 낮은 곡선이 된다. 어떤 정규분포든 값의 약 68%가 $\mu \pm \sigma$ 안에, 약 95%가 $\mu \pm 2\sigma$ 안에, 약 99.7%가 $\mu \pm 3\sigma$ 안에 든다(68-95-99.7 규칙).

[[diagram:normal-rule]]

정규분포는 측정 오차, 센서 잡음, 키처럼 독립적인 작은 요인이 많이 더해진 값에서 자주 나타난다. 이유는 중심극한정리가 설명한다([[lesson:lln-clt]]). 머신러닝에서는 가중치를 정규분포로 초기화하고, 회귀 모델의 오차를 정규분포로 가정하면 평균제곱오차 손실이 나온다([[lesson:loss-likelihood]]).

NumPy의 \`rng.normal(loc, scale, size)\`에서 \`loc\`은 평균 $\mu$, \`scale\`은 **표준편차** $\sigma$다. 표기 $\mathcal{N}(\mu, \sigma^2)$의 두 번째 값은 분산이므로 헷갈리지 않아야 한다.

\`\`\`python
rng = np.random.default_rng(0)
noise_small = rng.normal(loc=0, scale=0.2, size=5000)   # σ = 0.2
noise_large = rng.normal(loc=0, scale=1.5, size=5000)   # σ = 1.5
print(round(noise_small.std(), 3), round(noise_large.std(), 3))     # 지정한 σ에 가까운 표본 표준편차
print(np.sum(np.abs(noise_small) > 1), np.sum(np.abs(noise_large) > 1))   # |값| > 1인 표본 개수
\`\`\`

$\sigma = 0.2$이면 평균에서 1 이상 벗어나려면 $5\sigma$ 밖으로 나가야 하므로 그런 값이 사실상 없다. $\sigma = 1.5$이면 $0.67\sigma$만 벗어나도 되므로 절반 가까이가 해당한다.

[[diagram:sigma-spread]]

### 표준정규분포와 z-점수

평균이 0이고 표준편차가 1인 정규분포 $\mathcal{N}(0, 1)$을 **표준정규분포**라고 한다. $X \sim \mathcal{N}(\mu, \sigma^2)$에서 평균을 빼고 표준편차로 나눈 값

\`\`\`math
Z = \frac{X - \mu}{\sigma}
\`\`\`

은 표준정규분포를 따른다. [[lesson:random-variables]]의 성질로 $E[Z] = (\mu - \mu)/\sigma = 0$, $\mathrm{Var}(Z) = \sigma^2/\sigma^2 = 1$이다. $z$ 값을 **z-점수**라 하고, 평균에서 표준편차 몇 개만큼 떨어져 있는지를 나타낸다. 단위가 다른 값(키와 몸무게, 나이와 연봉)도 z-점수로 바꾸면 같은 기준으로 비교할 수 있다. 특성을 표준화할 때 이 변환을 쓴다([[lesson:encoding-scaling]]).

표준정규분포의 누적분포함수 $\Phi(z) = P(Z \le z)$를 알면 어떤 정규분포의 구간 확률도 구할 수 있다. 평균 170cm, 표준편차 6cm인 키에서 182cm는 $z = (182 - 170)/6 = 2$이므로 $P(X \ge 182) = 1 - \Phi(2) \approx 0.023$이다. 68-95-99.7 규칙의 95%는 근삿값이고, $\pm 2\sigma$ 안의 정확한 비율은 약 95.4%, 정확히 95%가 되는 경계는 $\pm 1.96\sigma$다. $\Phi$는 오차함수 \`math.erf\`로 계산한다.

\`\`\`python
import math

def normal_cdf(z):
    return (1 + math.erf(z / math.sqrt(2))) / 2      # Φ(z) = P(Z ≤ z)

print(round(normal_cdf(1) - normal_cdf(-1), 4), round(normal_cdf(2) - normal_cdf(-2), 4))   # 0.6827 0.9545
z = (182 - 170) / 6
print(z, round(1 - normal_cdf(z), 4))                 # 2.0 0.0228
\`\`\`

:::warn 흔한 실수
- **$\mathcal{N}(\mu, \sigma^2)$의 두 번째 값을 표준편차로 읽는다.** 표기의 두 번째 값은 분산이고, NumPy의 \`scale\`은 표준편차다. $\mathcal{N}(0, 4)$에서 뽑으려면 \`scale=2\`다.
- **조건을 확인하지 않고 이항분포를 쓴다.** 시행이 서로 독립이고 성공 확률이 매번 같아야 한다.
- **모든 데이터를 정규분포로 가정한다.** 소득, 대기 시간, 조회수처럼 한쪽으로 길게 치우치거나 0 이상인 값은 정규분포와 모양이 다르다. 히스토그램으로 먼저 확인한다([[lesson:eda]]).
- **정규분포가 아닌 데이터에 68-95-99.7 규칙을 적용한다.** 이 규칙은 정규분포에서만 성립한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "정규분포 $\\mathcal{N}(\\mu, \\sigma^2)$에서 $\\sigma$만 두 배로 키우면?",
      choices: ["곡선의 중심이 오른쪽으로 이동한다", "곡선이 더 넓고 낮아진다", "곡선이 더 좁고 높아진다", "균등분포로 바뀐다"],
      answer: 1,
      explanation: "$\\mu$는 중심의 위치를, $\\sigma$는 퍼진 정도를 정한다. 전체 넓이는 1로 유지되므로 넓어지면 높이가 낮아진다.",
    },
    {
      key: "c2",
      question: "평균 170cm, 표준편차 6cm인 정규분포를 따르는 키에서 158cm~182cm 사이에 드는 비율은 약 몇 %인가?",
      choices: ["약 68%", "약 95%", "약 99.7%", "약 50%"],
      answer: 1,
      explanation: "158~182cm는 $\\mu \\pm 2\\sigma$(170 ± 12)이므로 68-95-99.7 규칙에 따라 약 95%다.",
    },
    {
      key: "c3",
      question: "평균 170cm, 표준편차 6cm인 분포에서 키 176cm의 z-점수는?",
      choices: ["$1$", "$6$", "$0.5$", "$-1$"],
      answer: 0,
      explanation: "$z = (176 - 170)/6 = 1$이다. 평균보다 표준편차 한 개만큼 크다는 뜻이다.",
    },
    {
      key: "c4",
      question: "공정한 동전을 4번 던질 때 앞면이 정확히 2번 나올 확률은?",
      choices: ["$6/16$", "$1/2$", "$1/4$", "$2/16$"],
      answer: 0,
      explanation: "$\\binom{4}{2}(0.5)^2(0.5)^2 = 6 \\times \\frac{1}{16} = \\frac{6}{16}$이다. 4번 중 앞면이 나올 2번의 위치를 고르는 방법이 6가지다.",
    },
    {
      key: "c5",
      question: "$X \\sim B(100, 0.3)$의 평균과 분산은?",
      choices: ["평균 30, 분산 21", "평균 30, 분산 30", "평균 0.3, 분산 0.21", "평균 70, 분산 21"],
      answer: 0,
      explanation: "$E[X] = np = 30$, $\\mathrm{Var}(X) = np(1 - p) = 100 \\times 0.3 \\times 0.7 = 21$이다.",
    },
    {
      key: "c6",
      question: "`rng.normal(0, 2, size=100_000)`으로 뽑은 표본의 분산에 가장 가까운 값은?",
      choices: ["$4$", "$2$", "$\\sqrt{2}$", "$1$"],
      answer: 0,
      explanation: "NumPy의 두 번째 인자 `scale`은 표준편차 $\\sigma = 2$이므로 분산은 $\\sigma^2 = 4$다. 이 분포는 $\\mathcal{N}(0, 4)$로 쓴다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
from math import comb
n, p = 4, 0.5
print([comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n + 1)])
`,
      expected: "[0.0625, 0.25, 0.375, 0.25, 0.0625]",
      explanation: "$B(4, 0.5)$의 확률질량함수다. 경우의 수 $\\binom{4}{k}$가 1, 4, 6, 4, 1이고 각 순서의 확률이 $0.5^4 = 1/16$이므로 $1/16, 4/16, 6/16, 4/16, 1/16$이다. 합은 1이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "정답률이 0.8인 모델을 문제 10개로 평가할 때와 1,000개로 평가할 때, 측정한 정확도(맞힌 비율)의 표준편차를 각각 구하라. 이 결과가 모델 평가에 주는 의미를 설명하라.",
      answer: md`
맞힌 개수 $X \sim B(n, p)$의 표준편차는 $\sqrt{np(1 - p)}$이고, 정확도 $X/n$의 표준편차는 $\frac{1}{n}\sqrt{np(1 - p)} = \sqrt{p(1 - p)/n}$이다.

- $n = 10$: $\sqrt{0.8 \times 0.2 / 10} \approx 0.126$, 즉 약 12.6%p
- $n = 1000$: $\sqrt{0.8 \times 0.2 / 1000} \approx 0.0126$, 즉 약 1.3%p

문제 10개로 잰 정확도는 같은 모델이라도 70%나 90%로 나올 수 있어, 두 모델의 정확도 차이가 몇 %p 정도라면 우연인지 구분할 수 없다. 평가 데이터가 많을수록 표준편차가 $1/\sqrt{n}$에 비례해 줄어 측정이 정밀해진다.
`,
      keyPoints: ["맞힌 개수는 이항분포 $B(n, p)$를 따른다", "정확도의 표준편차 $\\sqrt{p(1 - p)/n}$", "$n = 10$이면 약 0.126, $n = 1000$이면 약 0.0126", "평가 데이터가 적으면 작은 정확도 차이를 판단할 수 없다"],
    },
  ],
  references: [
    { title: "Seeing Theory — Probability Distributions", url: "https://seeing-theory.brown.edu/probability-distributions/index.html", note: "이항·균등·정규분포의 모양을 파라미터를 바꾸며 보기 (영문)" },
    { title: "NumPy — Random Generator", url: "https://numpy.org/doc/stable/reference/random/generator.html", note: "binomial, uniform, normal 등 분포별 난수 생성 함수 (영문)" },
  ],
});
