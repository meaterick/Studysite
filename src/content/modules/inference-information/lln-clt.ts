import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/lln-clt";

export default defineLesson({
  id: "lln-clt",
  title: "큰 수의 법칙과 중심극한정리",
  tier: "core",
  concepts: ["lln-clt"],
  goal: "표본평균의 기댓값과 분산을 유도해 표준오차를 계산하고, 큰 수의 법칙으로 표본평균이 모평균에 가까워지는 것을, 중심극한정리로 표본평균의 분포가 정규분포에 가까워지는 것을 설명하며 시뮬레이션으로 확인한다.",
  why: "미니배치로 구한 기울기는 데이터마다의 기울기를 평균한 표본평균이라, 배치 크기를 키우면 기울기의 잡음이 $1/\\sqrt{B}$로 줄어든다([[lesson:optimizers]]). 테스트 정확도의 오차 범위와 두 모델 비교도 중심극한정리로 계산한다([[lesson:statistical-inference]]).",
  body: md`
### 표본평균의 기댓값과 분산

평균이 $\mu$, 분산이 $\sigma^2$인 같은 분포에서 서로 독립으로 뽑은 $X_1, \ldots, X_n$의 표본평균 $\bar X = \frac{1}{n}\sum_{i=1}^{n} X_i$도 확률변수다. 어떤 표본을 뽑느냐에 따라 값이 달라지기 때문이다. [[lesson:random-variables]]의 성질을 쓰면 표본평균의 기댓값과 분산을 구할 수 있다.

\`\`\`math
E[\bar X] = \frac{1}{n}\sum_{i=1}^{n} E[X_i] = \mu, \qquad \mathrm{Var}(\bar X) = \frac{1}{n^2}\sum_{i=1}^{n}\mathrm{Var}(X_i) = \frac{\sigma^2}{n}
\`\`\`

첫째 식은 기댓값의 선형성에서, 둘째 식은 상수배의 분산($\frac{1}{n^2}$배)과 독립인 확률변수의 분산의 합에서 나온다. 표본평균은 평균적으로 모평균과 같고(불편추정량), 그 흩어짐은 $n$이 커질수록 줄어든다. 표본평균의 표준편차를 **표준오차**(standard error)라고 한다.

\`\`\`math
\mathrm{SE}(\bar X) = \frac{\sigma}{\sqrt{n}}
\`\`\`

표준오차는 $\sqrt{n}$에 반비례한다. 데이터를 4배로 늘리면 표준오차는 절반이 되고, 10분의 1로 줄이려면 데이터가 100배 필요하다. 주사위($\sigma = \sqrt{35/12} \approx 1.71$)를 30번 던진 평균의 표준오차는 $1.71/\sqrt{30} \approx 0.31$이다.

### 큰 수의 법칙

**큰 수의 법칙**은 표본의 크기 $n$이 커질수록 표본평균 $\bar X$가 모평균 $\mu$에 가까워진다는 정리다. 위의 분산 식 $\sigma^2/n$이 0으로 가는 것이 그 이유다. 사건이 일어난 횟수의 비율(상대도수)도 0과 1로 된 확률변수의 표본평균이므로 확률에 가까워진다([[lesson:probability-rules]]).

[[diagram:lln-running-mean]]

이 법칙 덕분에 계산하기 어려운 기댓값을 표본평균으로 근사할 수 있다. 이것을 **몬테카를로 방법**이라고 한다. 정사각형 $[0, 1]^2$에 무작위로 점을 찍으면, 사분원 $x^2 + y^2 \le 1$ 안에 들어갈 확률은 넓이 $\pi/4$이다. 따라서 안에 들어간 점의 비율에 4를 곱하면 $\pi$의 근삿값이 된다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(1)
for n in (100, 10_000, 1_000_000):
    x, y = rng.random(n), rng.random(n)
    inside = (x ** 2 + y ** 2 <= 1)               # 사분원 안이면 True
    est = 4 * inside.mean()
    se = 4 * inside.std() / np.sqrt(n)            # 표준오차도 데이터로 추정한다
    print(f"n={n:>9,}  π 추정 {est:.4f}  오차 {abs(est - np.pi):.4f}  표준오차 {se:.4f}")
\`\`\`

점을 100배 늘릴 때마다 표준오차가 약 10분의 1로 줄어든다.

### 중심극한정리

**중심극한정리**는 표본평균의 분포 모양에 관한 정리다. 원래 분포가 무엇이든 분산이 유한하면, $n$이 충분히 클 때 표본평균은 근사적으로 정규분포를 따른다.

\`\`\`math
\bar X \approx \mathcal{N}\!\left(\mu,\ \frac{\sigma^2}{n}\right), \qquad Z = \frac{\bar X - \mu}{\sigma / \sqrt{n}} \approx \mathcal{N}(0, 1)
\`\`\`

합 $\sum_i X_i$도 마찬가지로 근사적으로 $\mathcal{N}(n\mu, n\sigma^2)$를 따른다. 아래 그림은 평평한 균등분포를 따르는 값을 1개, 2개, 3개, 12개 더한 합의 분포다. 더하는 값이 많아질수록 같은 평균·분산의 정규분포에 가까워진다. 측정 오차처럼 독립적인 작은 요인이 많이 더해진 값이 정규분포를 따르는 이유도 이것이다([[lesson:distributions]]).

[[diagram:clt-sums]]

중심극한정리를 쓰면 표본평균이 어느 범위에 들지 계산할 수 있다. 주사위를 30번 던진 평균은 약 95%의 확률로 $3.5 \pm 1.96 \times 0.31$, 즉 2.89와 4.11 사이에 든다. 정답률이 $p$인 모델로 $n$문제를 풀어 얻은 정확도 $\hat p$도 0과 1로 된 값의 표본평균이므로, $n$이 크면 $\mathcal{N}(p, p(1 - p)/n)$을 따른다. 이 사실이 신뢰구간과 가설검정의 출발점이다([[lesson:statistical-inference]]).

\`\`\`python
rng = np.random.default_rng(1)
means = rng.integers(1, 7, size=(100_000, 30)).mean(axis=1)    # 주사위 30번의 평균을 10만 번
print(round(means.mean(), 3), round(means.std(), 3))           # 약 3.5, 약 0.312 (= 1.708 / √30)
print(round(np.mean((means > 2.89) & (means < 4.11)), 3))      # 약 0.95
\`\`\`

### 미니배치 기울기와 표본평균

신경망 학습에서는 전체 데이터 대신 무작위로 뽑은 $B$개의 샘플(미니배치)로 손실의 기울기를 계산한다. 미니배치 기울기는 샘플마다의 기울기를 평균한 표본평균이므로, 기댓값은 전체 데이터의 기울기와 같고 표준오차는 $1/\sqrt{B}$에 비례한다. 배치 크기를 4배로 키우면 기울기의 잡음은 절반으로 줄지만 계산량은 4배가 된다. 배치 크기와 학습률을 함께 조절하는 이유다([[lesson:optimizers]], [[lesson:training-schedules]]).

:::warn 흔한 실수
- **중심극한정리가 데이터를 정규분포로 만든다고 생각한다.** 정규분포에 가까워지는 것은 표본평균(또는 합)의 분포다. 개별 데이터의 분포는 그대로다.
- **데이터를 2배로 늘리면 오차가 절반이 된다고 생각한다.** 표준오차는 $1/\sqrt{n}$에 비례하므로 절반으로 줄이려면 4배가 필요하다.
- **조건을 확인하지 않는다.** 샘플이 서로 독립이어야 하고 분산이 유한해야 한다. 같은 사용자의 기록처럼 서로 관련된 샘플이 많으면 표준오차를 실제보다 작게 계산하게 된다.
- **$n$이 작아도 정규 근사를 쓴다.** 원래 분포가 많이 치우쳤으면 정규 근사가 맞으려면 더 큰 $n$이 필요하다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "분산이 $\\sigma^2 = 16$인 분포에서 크기 $n = 64$인 표본을 뽑을 때 표본평균의 표준오차는?",
      choices: ["$0.5$", "$0.25$", "$2$", "$4$"],
      answer: 0,
      explanation: "$\\mathrm{SE} = \\sigma/\\sqrt{n} = 4/8 = 0.5$다. 분산으로는 $\\sigma^2/n = 16/64 = 0.25$다.",
    },
    {
      key: "c2",
      question: "표본평균의 표준오차를 지금의 절반으로 줄이려면 표본 크기를 몇 배로 늘려야 하는가?",
      choices: ["4배", "2배", "$\\sqrt{2}$배", "8배"],
      answer: 0,
      explanation: "표준오차는 $1/\\sqrt{n}$에 비례하므로 $\\sqrt{4} = 2$배 줄이려면 $n$을 4배로 늘려야 한다.",
    },
    {
      key: "c3",
      question: "중심극한정리가 말하는 것으로 옳은 것은?",
      choices: [
        "원래 분포와 관계없이(분산이 유한하면) 표본평균의 분포가 $n$이 클 때 정규분포에 가까워진다",
        "표본이 크면 개별 데이터가 정규분포를 따르게 된다",
        "표본평균은 항상 모평균과 정확히 같다",
        "원래 분포가 정규분포일 때만 성립한다",
      ],
      answer: 0,
      explanation: "정규분포에 가까워지는 것은 표본평균(또는 합)의 분포다. 개별 데이터의 분포는 바뀌지 않는다.",
    },
    {
      key: "c4",
      question: "큰 수의 법칙이 몬테카를로 방법의 근거가 되는 이유는?",
      choices: [
        "표본이 커질수록 표본평균이 기댓값에 가까워지므로, 기댓값을 난수 표본의 평균으로 근사할 수 있다",
        "난수가 정규분포를 따르기 때문이다",
        "표본이 작을수록 정확하기 때문이다",
        "모든 확률이 0.5로 수렴하기 때문이다",
      ],
      answer: 0,
      explanation: "구하려는 값을 어떤 확률변수의 기댓값으로 쓰면, 그 확률변수의 표본평균으로 근사할 수 있다. 오차는 표준오차 $\\sigma/\\sqrt{n}$ 정도다.",
    },
    {
      key: "c5",
      question: "미니배치 크기를 32에서 128로 늘리면 미니배치 기울기의 표준오차는 어떻게 되는가?",
      choices: ["절반이 된다", "4분의 1이 된다", "변하지 않는다", "2배가 된다"],
      answer: 0,
      explanation: "배치 크기가 4배가 되면 표준오차는 $1/\\sqrt{4} = 1/2$배가 된다. 계산량은 4배로 늘어난다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
sigma = 10
for n in (25, 100, 400):
    print(n, sigma / np.sqrt(n))
`,
      expected: "25 2.0\n100 1.0\n400 0.5",
      explanation: "표준오차 $\\sigma/\\sqrt{n}$이다. $n$이 4배가 될 때마다 표준오차는 절반이 된다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "독립인 $X_1, \\ldots, X_n$(평균 $\\mu$, 분산 $\\sigma^2$)의 표본평균 $\\bar X$에 대해 $E[\\bar X] = \\mu$와 $\\mathrm{Var}(\\bar X) = \\sigma^2/n$을 유도하고, 큰 수의 법칙과 중심극한정리가 각각 $\\bar X$에 대해 무엇을 말하는지 구분해 설명하라.",
      answer: md`
기댓값의 선형성으로 $E[\bar X] = \frac{1}{n}\sum_i E[X_i] = \frac{1}{n} \cdot n\mu = \mu$이다. 분산은 상수배 성질 $\mathrm{Var}(aX) = a^2\mathrm{Var}(X)$와 독립인 확률변수의 분산의 합으로 $\mathrm{Var}(\bar X) = \frac{1}{n^2}\sum_i \mathrm{Var}(X_i) = \frac{1}{n^2} \cdot n\sigma^2 = \frac{\sigma^2}{n}$이다.

큰 수의 법칙은 $\bar X$의 **값**에 관한 정리로, $n$이 커질수록 $\bar X$가 $\mu$에 가까워진다는 것이다. 중심극한정리는 $\bar X$의 **분포 모양**에 관한 정리로, $n$이 크면 $\bar X$가 근사적으로 $\mathcal{N}(\mu, \sigma^2/n)$을 따른다는 것이다. 그래서 중심극한정리로 $\bar X$가 $\mu$에서 얼마나 떨어질 수 있는지 확률로 계산할 수 있다.
`,
      keyPoints: ["기댓값의 선형성으로 $E[\\bar X] = \\mu$", "독립·상수배 성질로 $\\mathrm{Var}(\\bar X) = \\sigma^2/n$", "큰 수의 법칙: $\\bar X$가 $\\mu$에 가까워진다", "중심극한정리: $\\bar X$의 분포가 정규분포 $\\mathcal{N}(\\mu, \\sigma^2/n)$에 가까워진다"],
    },
  ],
  references: [
    { title: "3Blue1Brown — But what is the Central Limit Theorem?", url: "https://www.3blue1brown.com/lessons/clt", note: "주사위 합의 분포가 정규분포에 가까워지는 과정 (영문)" },
    { title: "Seeing Theory — Probability Distributions: Central Limit Theorem", url: "https://seeing-theory.brown.edu/probability-distributions/index.html", note: "표본 크기를 바꾸며 표본평균의 분포 보기 (영문)" },
  ],
});
