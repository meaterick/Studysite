import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/random-variables";

export default defineLesson({
  id: "random-variables",
  title: "확률변수, 기댓값, 분산",
  tier: "core",
  concepts: ["random-variables"],
  goal: "확률변수와 확률분포(확률질량함수·확률밀도함수·누적분포함수)를 구분하고, 기댓값과 분산을 정의대로 계산하며, 기댓값의 선형성과 독립인 확률변수의 분산의 합 성질을 적용한다.",
  why: "손실함수는 오차의 기댓값을 데이터로 추정한 값이고([[lesson:loss-functions]]), 가중치 초기화는 층을 지난 출력의 분산이 유지되도록 분산을 계산해 정한다([[lesson:initialization]]). 강화학습의 목표도 받을 보상의 기댓값을 최대화하는 것이다([[lesson:rl-basics]]).",
  body: md`
### 확률변수

실험의 각 결과에 수를 하나씩 대응시킨 것을 **확률변수**라 하고, 보통 대문자 $X$, $Y$로 쓴다. 주사위를 던져 나온 눈 $X$는 1부터 6까지의 값을 가진다. 동전을 세 번 던져 나온 앞면의 개수 $Y$는 결과 "앞뒤앞"에 2, "뒤뒤뒤"에 0을 대응시킨 확률변수다.

확률변수가 각 값을 가질 확률을 나열한 것을 **확률분포**라고 한다. 확률변수는 가질 수 있는 값에 따라 두 가지로 나뉜다.

- **이산확률변수**: 주사위 눈, 앞면의 개수, 클릭 수처럼 값을 하나씩 셀 수 있다.
- **연속확률변수**: 키, 온도, 대기 시간처럼 구간 안의 모든 실수 값을 가질 수 있다.

### 이산확률분포와 확률질량함수

이산확률변수의 분포는 각 값의 확률 $p(x) = P(X = x)$로 나타내고, 이 함수를 **확률질량함수**(PMF)라고 한다. 모든 $p(x) \ge 0$이고 합이 1이다. 동전 세 번에서 앞면의 개수 $Y$의 분포는 다음과 같다. 결과 8가지 중 앞면이 1개인 결과가 3가지(앞뒤뒤, 뒤앞뒤, 뒤뒤앞)이므로 $P(Y = 1) = 3/8$이다.

| $y$ | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| $P(Y = y)$ | $1/8$ | $3/8$ | $3/8$ | $1/8$ |

분류 모델이 출력하는 클래스별 확률(예: 고양이 0.7, 개 0.2, 새 0.1)도 확률질량함수다. 각 값이 0 이상이고 합이 1이어야 하며, 소프트맥스 함수가 이 조건을 맞춰 준다([[lesson:logistic-regression]]).

### 연속확률분포와 확률밀도함수

연속확률변수는 특정한 한 값을 가질 확률이 0이다. 키가 정확히 170.000…cm일 확률은 0이다. 그래서 연속확률변수의 분포는 **확률밀도함수**(PDF) $f(x)$로 나타내고, 확률은 구간에서 곡선 아래의 넓이로 계산한다.

\`\`\`math
P(a \le X \le b) = \int_a^b f(x)\,dx, \qquad f(x) \ge 0, \qquad \int_{-\infty}^{\infty} f(x)\,dx = 1
\`\`\`

적분 기호 $\int_a^b f(x)\,dx$는 $a$부터 $b$까지 곡선 $f$ 아래의 넓이를 뜻한다. 0과 1 사이의 값이 같은 가능성으로 나오는 균등분포는 $[0, 1]$에서 $f(x) = 1$이므로, $P(0.2 \le X \le 0.5)$는 가로 0.3, 세로 1인 직사각형의 넓이 $0.3$이다. 밀도는 확률이 아니므로 1보다 클 수 있다. $[0, 0.5]$의 균등분포는 넓이가 1이 되도록 $f(x) = 2$다.

이산과 연속 모두에 쓰는 표현으로 **누적분포함수**(CDF) $F(x) = P(X \le x)$가 있다. $F$는 0에서 1까지 증가하고, $P(a < X \le b) = F(b) - F(a)$다. 위의 $Y$는 $F(1) = 1/8 + 3/8 = 1/2$이다.

### 기댓값

**기댓값**은 확률변수의 값에 그 값의 확률을 곱해 모두 더한 것으로, 확률로 가중한 평균이다. 기호로 $E[X]$ 또는 $\mu$로 쓴다.

\`\`\`math
E[X] = \sum_x x\,p(x) \quad (\text{이산}), \qquad E[X] = \int x\,f(x)\,dx \quad (\text{연속})
\`\`\`

공정한 주사위는 $E[X] = (1 + 2 + \cdots + 6)/6 = 3.5$이고, 동전 세 번의 앞면 개수는 $E[Y] = 0 \cdot \frac{1}{8} + 1 \cdot \frac{3}{8} + 2 \cdot \frac{3}{8} + 3 \cdot \frac{1}{8} = 1.5$다. 기댓값은 확률변수가 실제로 가질 수 없는 값(3.5)일 수도 있다. 같은 실험을 많이 반복했을 때 나온 값들의 평균이 가까워지는 값이다([[lesson:lln-clt]]).

확률변수의 함수 $g(X)$의 기댓값은 $E[g(X)] = \sum_x g(x)\,p(x)$로 구한다. 참가비 1,000원을 내고 주사위를 던져 6이 나오면 3,000원을 받는 게임에서, 받는 돈의 기댓값은 $3000 \times \frac{1}{6} = 500$원이므로 한 번 할 때마다 평균 500원을 잃는다. 머신러닝의 손실도 같은 구조다. 예측 오차의 제곱 $(\hat y - y)^2$의 기댓값이 모델의 성능이고, 평균제곱오차는 이 기댓값을 데이터의 평균으로 추정한 값이다.

### 분산과 표준편차

**분산**은 값이 기댓값에서 얼마나 흩어져 있는지를 편차 제곱의 기댓값으로 잰 것이다.

\`\`\`math
\mathrm{Var}(X) = E\big[(X - \mu)^2\big] = E[X^2] - \mu^2
\`\`\`

두 번째 식은 계산에 편리하다. 주사위는 $E[X^2] = (1 + 4 + 9 + 16 + 25 + 36)/6 = 91/6$이므로 $\mathrm{Var}(X) = 91/6 - 3.5^2 = 35/12 \approx 2.92$다. 분산의 단위는 원래 단위의 제곱이므로, 원래 단위로 흩어짐을 나타낼 때는 제곱근인 **표준편차** $\sigma = \sqrt{\mathrm{Var}(X)}$를 쓴다. 주사위의 표준편차는 $\sqrt{35/12} \approx 1.71$이다.

### 기댓값과 분산의 성질

상수 $a$, $b$에 대해 다음이 성립한다.

\`\`\`math
E[aX + b] = a\,E[X] + b, \qquad \mathrm{Var}(aX + b) = a^2\,\mathrm{Var}(X)
\`\`\`

값을 모두 $b$만큼 옮기면 평균은 $b$만큼 옮겨지지만 흩어진 정도는 그대로이고, $a$배로 늘리면 편차가 $a$배가 되어 분산은 $a^2$배가 된다. 두 확률변수의 합에 대해서는 다음이 성립한다.

- $E[X + Y] = E[X] + E[Y]$는 **언제나** 성립한다(**기댓값의 선형성**).
- $\mathrm{Var}(X + Y) = \mathrm{Var}(X) + \mathrm{Var}(Y)$는 $X$와 $Y$가 **독립일 때** 성립한다.

주사위 두 개의 합은 $E = 3.5 + 3.5 = 7$, $\mathrm{Var} = 35/12 + 35/12 = 35/6$이다. 독립이 아니면 분산의 합 공식이 틀린다. 극단적으로 $Y = -X$이면 $X + Y = 0$이라 분산이 0이다.

이 성질로 신경망의 가중치 초기화를 설명할 수 있다. 입력 $n$개가 있는 뉴런의 출력 $z = \sum_{i=1}^{n} w_i x_i$에서 $w_i$와 $x_i$가 모두 서로 독립이고 평균이 0이면 $\mathrm{Var}(w_i x_i) = \mathrm{Var}(w)\,\mathrm{Var}(x)$이므로

\`\`\`math
\mathrm{Var}(z) = n\,\mathrm{Var}(w)\,\mathrm{Var}(x)
\`\`\`

이다. 층을 지나도 분산이 커지거나 작아지지 않게 하려면 $\mathrm{Var}(w) = 1/n$으로 가중치를 뽑아야 한다. 이것이 Xavier·He 초기화의 출발점이다([[lesson:initialization]]).

\`\`\`python
import numpy as np

values = np.arange(1, 7)
p = np.full(6, 1 / 6)
mean = np.sum(values * p)
var = np.sum((values - mean) ** 2 * p)
print(mean, round(var, 4))                       # 3.5 2.9167 (= 35/12)

rng = np.random.default_rng(0)
x = rng.integers(1, 7, size=200_000)
y = rng.integers(1, 7, size=200_000)             # x와 독립인 주사위
print(round((x + y).mean(), 3), round((x + y).var(), 3))      # 약 7, 약 5.833 (= 35/6)
print(round((2 * x + 3).mean(), 3), round((2 * x + 3).var(), 3))   # 약 10, 약 11.667 (= 4 × 35/12)
\`\`\`

:::warn 흔한 실수
- **$E[X^2]$을 $(E[X])^2$으로 계산한다.** 두 값의 차이가 바로 분산이다. 주사위는 $91/6 \ne 3.5^2$이다.
- **$\mathrm{Var}(aX) = a\,\mathrm{Var}(X)$로 계산한다.** 분산은 $a^2$배가 된다. 표준편차가 $|a|$배가 된다.
- **독립이 아닌데 분산을 더한다.** $\mathrm{Var}(X + Y) = \mathrm{Var}(X) + \mathrm{Var}(Y)$는 독립(정확히는 상관이 없음)일 때만 성립한다.
- **확률밀도를 확률로 읽는다.** $f(x)$는 1보다 클 수 있고, 확률은 구간의 넓이다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "공정한 주사위 한 개의 기댓값 $E[X]$는?",
      choices: ["$3$", "$3.5$", "$4$", "$21$"],
      answer: 1,
      explanation: "$E[X] = (1 + 2 + 3 + 4 + 5 + 6)/6 = 21/6 = 3.5$다. 기댓값은 확률변수가 실제로 가질 수 없는 값일 수도 있다.",
    },
    {
      key: "c2",
      question: "$P(X = 0) = 0.2$, $P(X = 1) = 0.5$, $P(X = 2) = c$인 확률질량함수에서 $c$와 $E[X]$는?",
      choices: ["$c = 0.3$, $E[X] = 1.1$", "$c = 0.3$, $E[X] = 1$", "$c = 0.5$, $E[X] = 1.5$", "$c = 0.3$, $E[X] = 0.8$"],
      answer: 0,
      explanation: "확률의 합이 1이어야 하므로 $c = 1 - 0.2 - 0.5 = 0.3$이다. $E[X] = 0 \\times 0.2 + 1 \\times 0.5 + 2 \\times 0.3 = 1.1$이다.",
    },
    {
      key: "c3",
      question: "$\\mathrm{Var}(X) = 4$일 때 $\\mathrm{Var}(3X + 5)$는?",
      choices: ["$36$", "$12$", "$17$", "$41$"],
      answer: 0,
      explanation: "$\\mathrm{Var}(aX + b) = a^2\\mathrm{Var}(X) = 9 \\times 4 = 36$이다. 상수 5를 더해도 흩어진 정도는 변하지 않는다.",
    },
    {
      key: "c4",
      question: "독립인 두 확률변수 $X$, $Y$의 분산이 각각 2와 3일 때 $\\mathrm{Var}(X - Y)$는?",
      choices: ["$5$", "$-1$", "$1$", "$6$"],
      answer: 0,
      explanation: "$\\mathrm{Var}(X - Y) = \\mathrm{Var}(X) + (-1)^2\\mathrm{Var}(Y) = 2 + 3 = 5$다. 빼도 분산은 더해진다.",
    },
    {
      key: "c5",
      question: "키 $X$가 연속확률변수일 때 $P(X = 170)$은?",
      choices: [
        "0이다. 연속확률변수의 확률은 구간의 넓이로 구한다",
        "확률밀도 $f(170)$과 같다",
        "항상 0.5다",
        "키의 평균이 170이면 1이다",
      ],
      answer: 0,
      explanation: "한 점에서 곡선 아래의 넓이는 0이다. $f(170)$은 확률밀도로, 확률이 아니며 1보다 클 수도 있다. 확률은 $P(169.5 \\le X \\le 170.5)$처럼 구간으로 묻는다.",
    },
    {
      key: "c6",
      question: "입력이 $n = 100$개인 뉴런의 출력 $z = \\sum_i w_i x_i$에서 $w_i$, $x_i$가 모두 독립이고 평균이 0, $\\mathrm{Var}(x_i) = 1$이다. $\\mathrm{Var}(z) = 1$이 되려면 $\\mathrm{Var}(w_i)$는?",
      choices: ["$0.01$", "$0.1$", "$1$", "$100$"],
      answer: 0,
      explanation: "$\\mathrm{Var}(z) = n\\,\\mathrm{Var}(w)\\,\\mathrm{Var}(x) = 100\\,\\mathrm{Var}(w)$이므로 $\\mathrm{Var}(w) = 1/100$이다. 표준편차로는 $0.1$이다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
values = np.array([0, 1, 2, 3])
p = np.array([1, 3, 3, 1]) / 8
mean = np.sum(values * p)
print(mean, np.sum(values ** 2 * p) - mean ** 2)
`,
      expected: "1.5 0.75",
      explanation: "동전 세 번의 앞면 개수다. $E[Y] = (0 + 3 + 6 + 3)/8 = 1.5$이고, $E[Y^2] = (0 + 3 + 12 + 9)/8 = 3$이므로 $\\mathrm{Var}(Y) = 3 - 1.5^2 = 0.75$다. 동전 하나의 분산 $0.25$를 세 번 더한 값과 같다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "기댓값의 선형성 $E[X + Y] = E[X] + E[Y]$와 분산의 합 $\\mathrm{Var}(X + Y) = \\mathrm{Var}(X) + \\mathrm{Var}(Y)$가 각각 어떤 조건에서 성립하는지 쓰고, 분산의 합 공식이 성립하지 않는 예를 들어라. 주사위 두 개의 합의 기댓값과 분산도 구하라.",
      answer: md`
기댓값의 선형성은 $X$와 $Y$의 관계와 관계없이 언제나 성립한다. 분산의 합 공식은 $X$와 $Y$가 독립(정확히는 공분산이 0)일 때만 성립한다.

성립하지 않는 예: $Y = -X$이면 $X + Y = 0$이라 $\mathrm{Var}(X + Y) = 0$이지만, $\mathrm{Var}(X) + \mathrm{Var}(Y) = 2\,\mathrm{Var}(X) > 0$이다. $Y = X$이면 $\mathrm{Var}(2X) = 4\,\mathrm{Var}(X)$로 두 분산의 합 $2\,\mathrm{Var}(X)$보다 크다.

주사위 두 개는 독립이므로 합의 기댓값은 $3.5 + 3.5 = 7$, 분산은 $\frac{35}{12} + \frac{35}{12} = \frac{35}{6} \approx 5.83$이다.
`,
      keyPoints: ["기댓값의 선형성은 언제나 성립한다", "분산의 합은 독립(공분산 0)일 때만 성립한다", "반례: $Y = -X$이면 합의 분산이 0", "주사위 두 개의 합: 기댓값 7, 분산 35/6"],
    },
  ],
  references: [
    { title: "Seeing Theory — Probability Distributions", url: "https://seeing-theory.brown.edu/probability-distributions/index.html", note: "확률변수, 기댓값, 분산과 여러 분포 (영문)" },
    { title: "Dive into Deep Learning — Probability and Statistics", url: "https://d2l.ai/chapter_preliminaries/probability.html", note: "확률변수와 기댓값을 코드와 함께 (영문, 한국어판은 ko.d2l.ai)" },
  ],
});
