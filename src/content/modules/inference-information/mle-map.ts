import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/mle-map";

export default defineLesson({
  id: "mle-map",
  title: "사전분포와 MAP 추정",
  tier: "advanced",
  requires: ["likelihood-entropy", "bayes"],
  goal: "베타 사전분포와 베르누이 가능도로 사후분포를 구해 MAP 추정값과 사후평균을 계산하고, 데이터 양에 따라 MLE와 MAP의 차이가 줄어드는 이유와 사전분포가 정규화 역할을 하는 이유를 설명한다.",
  why: "데이터가 적을 때 최대가능도추정은 극단적인 값을 내기 쉽다. 나이브 베이즈의 라플라스 스무딩([[lesson:naive-bayes]])과 가중치에 벌점을 주는 정규화([[lesson:loss-likelihood]])는 모두 사전분포를 더한 MAP 추정으로 설명된다.",
  body: md`
### 데이터가 적을 때 최대가능도추정의 문제

[[lesson:likelihood-entropy]]에서 $n$번 중 $k$번 성공하면 최대가능도추정값이 $\hat p = k/n$임을 보았다. 동전을 3번 던져 3번 모두 앞면이면 $\hat p = 1$이고, 이 추정은 "뒷면은 절대 나오지 않는다"는 뜻이다. 처음 본 단어의 확률을 0으로 추정하는 언어 모델이나, 리뷰 1개가 5점인 식당을 리뷰 1,000개의 평균이 4.8점인 식당보다 높게 평가하는 순위도 같은 문제다. 데이터가 적으면 추정값이 우연에 크게 흔들린다.

### 사전분포와 사후분포

데이터를 보기 전에 파라미터에 대해 아는 것을 확률분포로 나타낸 것을 **사전분포**라고 한다. 파라미터 $p$에 베이즈 정리를 적용하면([[lesson:bayes]]), 데이터를 본 뒤의 **사후분포**는 가능도와 사전분포의 곱에 비례한다.

\`\`\`math
P(p \mid \text{데이터}) \propto L(p)\,P(p)
\`\`\`

0과 1 사이의 확률 $p$에 대한 사전분포로는 **베타분포** $\mathrm{Beta}(a, b)$를 많이 쓴다. 밀도는 $p^{a - 1}(1 - p)^{b - 1}$에 비례하고 평균은 $\frac{a}{a + b}$다. $\mathrm{Beta}(1, 1)$은 $[0, 1]$의 균등분포이고, $\mathrm{Beta}(2, 2)$는 0.5 근처를 조금 더 선호하는 완만한 분포다.

$n$번 중 $k$번 성공한 데이터의 가능도 $p^k(1 - p)^{n - k}$에 $\mathrm{Beta}(a, b)$ 사전분포를 곱하면

\`\`\`math
p^{k}(1 - p)^{n - k} \cdot p^{a - 1}(1 - p)^{b - 1} = p^{k + a - 1}(1 - p)^{n - k + b - 1}
\`\`\`

이므로 사후분포는 $\mathrm{Beta}(k + a,\ n - k + b)$다. 사전분포와 사후분포가 같은 종류의 분포가 되는 이런 사전분포를 **켤레 사전분포**라고 한다. 사전분포의 $a - 1$과 $b - 1$이 성공과 실패 횟수에 그대로 더해지므로, 베타 사전분포는 "데이터를 보기 전에 성공 $a - 1$번, 실패 $b - 1$번을 본 것"과 같다.

### MAP 추정과 사후평균

사후분포를 가장 크게 만드는 값을 **MAP 추정값**(maximum a posteriori)이라고 한다. 로그를 취해 미분하면

\`\`\`math
\frac{d}{dp}\Big[(k + a - 1)\log p + (n - k + b - 1)\log(1 - p)\Big] = 0 \ \Rightarrow\ \hat p_{\text{MAP}} = \frac{k + a - 1}{n + a + b - 2}
\`\`\`

이다. 10번 중 7번 앞면에 $\mathrm{Beta}(2, 2)$를 쓰면 $\hat p_{\text{MAP}} = 8/12 \approx 0.667$로, MLE 0.7보다 0.5 쪽으로 조금 가깝다. 3번 중 3번이면 $\hat p_{\text{MAP}} = 4/5 = 0.8$이라 "뒷면이 절대 나오지 않는다"는 결론을 피한다. $\mathrm{Beta}(1, 1)$(균등 사전분포)이면 MAP는 MLE와 같다.

사후분포의 최댓값 대신 평균 $\frac{k + a}{n + a + b}$를 추정값으로 쓰기도 한다. $\mathrm{Beta}(1, 1)$의 사후평균 $\frac{k + 1}{n + 2}$는 성공과 실패를 한 번씩 더한 것으로, **라플라스 스무딩**이라고 한다. 나이브 베이즈에서 학습 데이터에 없던 단어의 확률이 0이 되지 않게 할 때 이 방법을 쓴다([[lesson:naive-bayes]]).

### 데이터가 많아지면

사전분포가 더하는 횟수는 고정되어 있고 데이터의 횟수는 늘어나므로, 데이터가 많을수록 사전분포의 영향이 줄어든다. 같은 70% 비율이라도 10번 중 7번이면 $\mathrm{Beta}(2, 2)$의 MAP가 0.667이지만, 1,000번 중 700번이면 $701/1002 \approx 0.6996$으로 MLE와 거의 같다.

[[diagram:mle-vs-map]]

\`\`\`python
for k, n in [(3, 3), (7, 10), (70, 100), (700, 1000)]:
    mle = k / n
    map_ = (k + 1) / (n + 2)              # Beta(2, 2)의 MAP
    post_mean = (k + 2) / (n + 4)         # Beta(2, 2)의 사후평균
    print(f"{k:4d}/{n:<4d}  MLE {mle:.3f}  MAP {map_:.3f}  사후평균 {post_mean:.3f}")
\`\`\`

### MAP와 정규화

로그를 취하면 MAP는 "로그가능도 + 로그 사전분포"를 최대화하고, 부호를 바꾸면 다음을 최소화한다.

\`\`\`math
-\log P(\theta \mid \text{데이터}) = \underbrace{-\log L(\theta)}_{\text{음의 로그가능도(손실)}} \ \underbrace{-\ \log P(\theta)}_{\text{사전분포에서 온 벌점}} + \text{상수}
\`\`\`

모델의 가중치 $w$에 평균 0인 정규분포 사전분포를 두면 $-\log P(w) = \frac{1}{2\sigma^2}\lVert w \rVert^2 + \text{상수}$이므로, MAP는 손실에 L2 벌점을 더한 것과 같다. 라플라스 분포를 사전분포로 두면 L1 벌점이 된다. 정규화를 "가중치가 0 근처일 것"이라는 사전분포를 넣은 MAP 추정으로 해석할 수 있다는 뜻이다([[lesson:loss-likelihood]], [[lesson:regularization]]).

:::warn 흔한 실수
- **사전분포가 결과를 정해 버린다고 생각한다.** 사전분포의 영향은 데이터가 많아질수록 줄어든다. 데이터가 적을 때 극단적인 추정을 줄이는 것이 주된 역할이다.
- **MAP 공식에 $a$, $b$를 그대로 더한다.** MAP는 $\frac{k + a - 1}{n + a + b - 2}$이고, $\frac{k + a}{n + a + b}$는 사후평균이다.
- **너무 강한 사전분포를 쓴다.** $\mathrm{Beta}(100, 100)$은 0.5를 200번 본 것과 같아, 데이터가 어지간히 많지 않으면 결과가 0.5 근처에서 움직이지 않는다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "동전을 20번 던져 앞면이 14번 나왔다. 사전분포 $\\mathrm{Beta}(2, 2)$를 쓴 MAP 추정값은?",
      choices: ["$15/22 \\approx 0.682$", "$14/20 = 0.7$", "$16/24 \\approx 0.667$", "$0.5$"],
      answer: 0,
      explanation: "$\\frac{k + a - 1}{n + a + b - 2} = \\frac{14 + 1}{20 + 2} = \\frac{15}{22}$이다. MLE 0.7보다 0.5 쪽으로 조금 가깝다.",
    },
    {
      key: "c2",
      question: "동전을 3번 던져 3번 모두 앞면이 나왔다. MLE와 $\\mathrm{Beta}(2, 2)$ MAP 추정값은?",
      choices: ["MLE 1.0, MAP 0.8", "MLE 1.0, MAP 1.0", "MLE 0.75, MAP 0.8", "MLE 0.8, MAP 0.6"],
      answer: 0,
      explanation: "MLE는 $3/3 = 1.0$이다. MAP는 $\\frac{3 + 1}{3 + 2} = 0.8$로, 앞면과 뒷면을 한 번씩 더 본 것과 같아 데이터가 적을 때의 극단적인 추정을 줄인다.",
    },
    {
      key: "c3",
      question: "10번 중 7번 성공한 데이터에 사전분포 $\\mathrm{Beta}(2, 2)$를 쓰면 사후분포는?",
      choices: ["$\\mathrm{Beta}(9, 5)$", "$\\mathrm{Beta}(7, 3)$", "$\\mathrm{Beta}(2, 2)$", "$\\mathrm{Beta}(9, 3)$"],
      answer: 0,
      explanation: "사후분포는 $\\mathrm{Beta}(k + a, n - k + b) = \\mathrm{Beta}(7 + 2, 3 + 2) = \\mathrm{Beta}(9, 5)$다.",
    },
    {
      key: "c4",
      question: "같은 성공 비율을 유지하며 데이터 수를 늘리면 MLE와 MAP의 관계는 어떻게 되는가?",
      choices: ["차이가 줄어 MAP가 MLE에 가까워진다", "차이가 커진다", "MAP가 사전분포의 평균으로 수렴한다", "변하지 않는다"],
      answer: 0,
      explanation: "사전분포가 더하는 횟수는 고정이고 데이터 횟수는 늘어나므로 사전분포의 영향이 줄어든다. 1,000번 중 700번이면 MAP는 약 0.6996이다.",
    },
    {
      key: "c5",
      question: "가중치에 평균 0인 정규분포 사전분포를 두고 MAP 추정을 하는 것과 같은 것은?",
      choices: ["손실에 L2 벌점을 더해 최소화하는 것", "손실에 L1 벌점을 더해 최소화하는 것", "학습률을 0으로 두는 것", "정규화 없이 최대가능도추정을 하는 것"],
      answer: 0,
      explanation: "$-\\log P(w) = \\frac{1}{2\\sigma^2}\\lVert w \\rVert^2 + \\text{상수}$이므로 음의 로그 사후분포는 음의 로그가능도에 L2 벌점을 더한 것이다. 라플라스 사전분포는 L1 벌점이 된다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "MAP 추정이 MLE와 어떻게 다른지 사후분포의 식으로 설명하고, 베타 사전분포를 \"미리 본 횟수\"로 해석할 수 있는 이유를 쓰라. 데이터가 많아질 때 두 추정값의 관계도 설명하라.",
      answer: md`
MLE는 가능도 $L(p)$만 최대화하고, MAP는 가능도에 사전분포를 곱한 사후분포 $L(p)P(p)$를 최대화한다. $n$번 중 $k$번 성공한 베르누이 가능도 $p^k(1 - p)^{n - k}$에 $\mathrm{Beta}(a, b)$ 사전분포 $p^{a - 1}(1 - p)^{b - 1}$을 곱하면 $p^{k + a - 1}(1 - p)^{n - k + b - 1}$이 되어, 성공 $a - 1$번과 실패 $b - 1$번을 데이터에 더한 것과 같은 식이 된다. 그래서 MAP는 $\frac{k + a - 1}{n + a + b - 2}$다.

사전분포가 더하는 횟수는 고정되어 있으므로 $n$이 커질수록 그 영향이 줄어, MAP가 MLE $k/n$에 가까워진다. 데이터가 적을 때는 MAP가 사전분포 쪽으로 추정값을 당겨 극단적인 값을 피한다.
`,
      keyPoints: ["MLE는 가능도를, MAP는 가능도와 사전분포의 곱(사후분포)을 최대화한다", "베타 사전분포의 $a - 1$, $b - 1$이 성공·실패 횟수에 더해진다", "MAP $= \\frac{k + a - 1}{n + a + b - 2}$", "데이터가 많아지면 사전분포의 영향이 줄어 MAP가 MLE에 가까워진다"],
    },
  ],
  references: [
    { title: "Seeing Theory — Bayesian Inference", url: "https://seeing-theory.brown.edu/bayesian-inference/index.html", note: "사전분포가 데이터에 따라 사후분포로 바뀌는 과정 (영문)" },
    { title: "CS229 Probability Theory Review", url: "https://cs229.stanford.edu/section/cs229-prob.pdf", note: "확률분포와 추정의 정리 (영문)" },
  ],
});
