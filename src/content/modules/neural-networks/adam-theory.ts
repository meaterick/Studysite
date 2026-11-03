import { defineLesson, md } from "../../kit";
import exercises from "./labs/adam-theory";

export default defineLesson({
  id: "adam-theory",
  title: "Adam의 이론: 편향 보정, AdamW, 워밍업",
  tier: "advanced",
  goal: "Adam 편향 보정을 $\\mathbb{E}[m_t] = (1-\\beta_1^t)\\mathbb{E}[g]$로 유도하고, Adam에서 L2 규제와 가중치 감쇠가 달라지는 이유와 AdamW, 학습률 워밍업이 필요한 이유를 설명한다.",
  why: "언어 모델을 포함한 Transformer 학습은 대부분 AdamW와 학습률 워밍업을 함께 쓴다([[lesson:training-schedules]], [[lesson:pretraining]]). 편향 보정과 가중치 감쇠가 어떻게 동작하는지 알아야 학습 설정의 하이퍼파라미터($\\beta$, $\\epsilon$, 가중치 감쇠, 워밍업 길이)를 근거를 두고 고를 수 있다.",
  body: md`
[[lesson:optimizers]]에서 Adam의 갱신식을 계산했다. 이 레슨은 세 가지 질문을 다룬다. ① 편향 보정은 왜 $1 - \beta^t$로 나누는가, ② Adam에 L2 규제를 그대로 넣으면 왜 의도대로 동작하지 않고 AdamW가 필요한가, ③ Transformer 학습에서 학습률 워밍업이 왜 필요한가.

### 편향 보정의 유도

$m_0 = 0$에서 시작해 $m_t = \beta_1 m_{t-1} + (1-\beta_1)g_t$를 풀어 쓰면

$$m_t = (1-\beta_1)\sum_{i=1}^{t}\beta_1^{\,t-i}\,g_i$$

이다. 기울기의 기댓값이 일정하게 $\mathbb{E}[g]$라고 하면, 등비수열의 합 $\sum_{i=1}^{t}\beta_1^{t-i} = \frac{1-\beta_1^t}{1-\beta_1}$에 의해 $\mathbb{E}[m_t] = (1 - \beta_1^t)\,\mathbb{E}[g]$다. 즉 $m_t$는 초반에 실제보다 $(1-\beta_1^t)$배만큼 작고, 이것을 나눠 주는 $\hat m_t = m_t/(1-\beta_1^t)$가 불편 추정이 된다. $\beta_1 = 0.9$면 $t = 1$에서 0.1배, $t = 10$에서 약 0.65배, $t = 50$이면 거의 1이라 보정이 필요 없다. $v_t$도 같고, $\beta_2 = 0.999$는 $1 - \beta_2^t$가 1에 가까워지는 데 수천 스텝이 걸리므로 보정이 훨씬 오래 중요하다.

| 스텝 $t$ | $1 - 0.9^t$ ($m$의 보정 분모) | $1 - 0.999^t$ ($v$의 보정 분모) |
| --- | --- | --- |
| 1 | 0.1 | 0.001 |
| 10 | 0.651 | 0.010 |
| 100 | 1.000 | 0.095 |
| 1,000 | 1.000 | 0.632 |
| 5,000 | 1.000 | 0.993 |

보정이 없다면 $t = 100$에서 $v$는 실제의 약 10%로 작게 추정되어 $\sqrt{v}$가 약 3분의 1이 되고, 갱신량이 약 3배로 커진다. 학습 초반 수천 스텝 동안 갱신량이 실제보다 큰 채로 학습된다.

[[diagram:adam-bias-correction]]

### L2 규제와 가중치 감쇠의 차이: AdamW

SGD에서는 손실에 $\frac{\lambda}{2}\lVert w\rVert^2$을 더하는 것(L2)과 매 스텝 $w \leftarrow (1-\eta\lambda)w$로 줄이는 것(가중치 감쇠)이 같았다. Adam에서는 다르다. L2 항의 기울기 $\lambda w$가 다른 기울기와 섞여 $\sqrt{\hat v}$로 **나눠지기** 때문이다. 기울기가 큰 파라미터일수록 $\sqrt{\hat v}$가 커서 감쇠가 약해지고, 거의 쓰이지 않는 파라미터는 반대로 의도보다 크게 움직인다. 극단적인 예로, 데이터에서 오는 기울기가 0인 파라미터라면 기울기가 $\lambda w$뿐이므로 $\hat m/\sqrt{\hat v} \approx \operatorname{sign}(w)$가 되어 $\lambda$가 $10^{-4}$이든 1이든 **매 스텝 약 $\eta$씩** 줄어든다. $\lambda$로는 감쇠의 세기를 조절할 수 없다.

Loshchilov & Hutter(2019)의 **AdamW**는 감쇠를 기울기에서 분리해 갱신 단계에서 따로 적용한다.

$$w \leftarrow w - \eta\left(\frac{\hat m_t}{\sqrt{\hat v_t} + \epsilon} + \lambda w\right)$$

이제 감쇠는 모든 파라미터에 같은 비율 $(1 - \eta\lambda)$로 걸리고, 학습률과 감쇠 강도를 따로 조절할 수 있다. 현재 Transformer 계열 학습의 표준 최적화기는 Adam이 아니라 AdamW이고, PyTorch에서도 \`torch.optim.AdamW\`를 쓴다.

[[diagram:adamw-decay]]

### 워밍업이 필요한 이유

학습 초반에는 $\hat v_t$가 몇 개의 기울기 제곱만으로 추정되어 매우 불안정하다. 우연히 작게 추정된 파라미터는 유효 학습률 $\eta/\sqrt{\hat v}$가 지나치게 커지고, 초반의 큰 갱신이 파라미터를 손실이 큰 영역으로 옮길 수 있다. Liu et al.(2020, RAdam)은 적응 학습률의 분산이 학습 초반에 매우 크다는 것을 보이고, 이것이 경험적으로 워밍업이 필요했던 이유라고 설명했다. 그래서 처음 수백~수천 스텝은 학습률을 0 근처에서 서서히 올려, $\hat v$의 추정이 안정될 때까지 갱신량을 작게 유지한다. Transformer는 층이 깊고 LayerNorm의 위치([[lesson:normalization-layers]])에 따라 초반 기울기가 특히 불안정해 워밍업 없이는 발산하기 쉽다.

[[diagram:warmup-variance]]

또한 Adam이 항상 수렴하는 것은 아니다. Reddi et al.(2018)은 간단한 볼록 문제에서도 Adam이 최적해로 수렴하지 않는 반례를 만들고, $\hat v$의 최댓값을 유지하는 AMSGrad를 제안했다. 실무에서 Adam(W)이 잘 동작하는 것과 이론적인 수렴 보장은 별개다.
`,
  checks: [
    {
      key: "c1",
      question: "$\\beta_1 = 0.9$, 기울기가 항상 $g$일 때 $t = 2$의 $m_2$는? ($m_0 = 0$)",
      choices: ["$0.19g$", "$0.1g$", "$0.81g$", "$g$"],
      answer: 0,
      explanation: "$m_1 = 0.1g$, $m_2 = 0.9 \\times 0.1g + 0.1g = 0.19g = (1 - 0.9^2)g$. 그래서 $1 - \\beta_1^t$로 나누면 정확히 $g$가 된다.",
    },
    {
      key: "c2",
      question: "Adam에 L2 항 $\\lambda w$를 기울기로 더할 때 생기는 문제로 옳은 것은?",
      choices: ["감쇠 항도 $\\sqrt{\\hat v}$로 나눠져 파라미터마다 감쇠 강도가 달라지고 $\\lambda$의 의미가 흐려진다", "Adam이 SGD와 똑같아진다", "학습률이 자동으로 0이 된다", "편향 보정이 불가능해진다"],
      answer: 0,
      explanation: "기울기가 큰 파라미터는 감쇠가 약해지고, 데이터 기울기가 0인 파라미터는 $\\lambda$와 무관하게 약 $\\eta$씩 줄어든다(예: $\\lambda$를 1만 배 바꿔도 이동량이 같다). AdamW는 감쇠를 갱신에서 따로 적용한다.",
    },
    {
      key: "c3",
      question: "Transformer 학습에서 처음 수천 스텝 동안 학습률을 0 근처에서 서서히 올리는(워밍업) 주된 이유는?",
      choices: ["초반 $\\hat v$ 추정이 불안정해 일부 파라미터의 유효 학습률이 지나치게 커질 수 있어서", "GPU 예열이 필요해서", "데이터를 섞는 데 시간이 걸려서", "손실이 처음에 0이라서"],
      answer: 0,
      explanation: "몇 개의 기울기로 추정한 $\\hat v$는 분산이 커서 $\\eta/\\sqrt{\\hat v}$가 매우 커질 수 있다(RAdam의 분석). 워밍업은 그동안 갱신량을 작게 유지한다.",
    },
    {
      key: "c4",
      question: "$\\beta_2 = 0.999$에서 편향 보정 없이 Adam을 쓰면 $t = 100$에서 $v_t$는 실제의 약 몇 배로 작게 잡히는가?",
      choices: ["약 0.095배", "약 0.65배", "거의 1배", "약 0.001배"],
      answer: 0,
      explanation: "$\\mathbb{E}[v_t] = (1 - \\beta_2^t)\\mathbb{E}[g^2]$이고 $1 - 0.999^{100} \\approx 0.095$다. $\\sqrt{v}$가 약 0.31배라 갱신량이 약 3배로 커진다.",
    },
    {
      key: "c5",
      question: "AdamW에서 가중치 감쇠가 적용되는 방식으로 옳은 것은?",
      choices: ["기울기와 분리해 갱신 단계에서 모든 파라미터에 같은 비율 $(1 - \\eta\\lambda)$로 건다", "기울기에 $\\lambda w$를 더한 뒤 $\\sqrt{\\hat v}$로 나눈다", "학습률을 매 스텝 $\\lambda$배 줄인다", "편향 보정 분모에 $\\lambda$를 더한다"],
      answer: 0,
      explanation: "Adam에 L2를 기울기로 넣으면 $\\sqrt{\\hat v}$로 나눠져 감쇠 강도가 파라미터마다 달라진다. AdamW는 감쇠를 기울기에서 떼어 내 같은 비율로 적용한다.",
    },
    {
      key: "c6",
      question: "AdamW에서 학습률 $\\eta = 10^{-3}$, 가중치 감쇠 $\\lambda = 0.1$일 때, 기울기 항과 별도로 매 스텝 가중치에 곱해지는 값과 그 성질은?",
      choices: ["$0.9999$배이며, 모든 파라미터에 기울기 크기와 무관하게 같은 비율로 걸린다", "$0.9$배이며, 기울기가 큰 파라미터에만 걸린다", "$\\sqrt{\\hat v}$에 따라 파라미터마다 다르다", "감쇠는 적용되지 않는다"],
      answer: 0,
      explanation: "AdamW는 $w \\leftarrow w - \\eta\\lambda w$를 갱신에서 따로 적용하므로 $1 - 10^{-3}\\times 0.1 = 0.9999$배가 모든 파라미터에 똑같이 걸립니다. Adam + L2에서는 감쇠 항이 $\\sqrt{\\hat v}$로 나눠져 파라미터마다 강도가 달라집니다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "Adam의 편향 보정에서 $m_t$를 $1-\\beta_1^t$로 나누는 이유를 $\\mathbb{E}[m_t]$를 계산해 유도하라. Adam에 L2 규제를 그대로 더하면 의도대로 동작하지 않는 이유와, AdamW가 이를 고치는 방법도 쓰라.",
      answer: md`
$m_0=0$에서 $m_t = (1-\beta_1)\sum_{i=1}^{t}\beta_1^{t-i}g_i$이고, 기울기 기댓값이 일정하다면 등비수열의 합으로 $\mathbb{E}[m_t] = (1-\beta_1^t)\mathbb{E}[g]$다. 초반의 $m_t$가 실제보다 $(1-\beta_1^t)$배 작으므로 이 값으로 나눠 불편 추정 $\hat m_t$를 얻는다. Adam에 L2 항을 그대로 더하면 그 기울기 $\lambda w$도 다른 기울기와 함께 $\sqrt{\hat v}$로 나눠져, 기울기가 큰 파라미터는 감쇠가 약해지고 데이터 기울기가 0인 파라미터는 $\lambda$와 무관하게 매 스텝 약 $\eta$씩 줄어드는 등 $\lambda$가 의도한 감쇠 강도를 뜻하지 않게 된다. AdamW는 감쇠를 기울기에서 분리해 $w \leftarrow w - \eta(\hat m/(\sqrt{\hat v}+\epsilon) + \lambda w)$처럼 갱신 단계에서 모든 파라미터에 같은 비율로 적용한다.
`,
      keyPoints: ["$\\mathbb{E}[m_t] = (1-\\beta_1^t)\\mathbb{E}[g]$이므로 $1-\\beta_1^t$로 나눈다", "L2 항의 기울기도 $\\sqrt{\\hat v}$로 나눠져 파라미터마다 감쇠가 달라진다", "데이터 기울기가 0인 파라미터는 $\\lambda$와 무관하게 약 $\\eta$씩 줄어든다", "AdamW는 감쇠를 갱신 단계에서 분리해 같은 비율로 적용한다"],
    },
  ],
  references: [
    { title: "Kingma & Ba (2015) — Adam: A Method for Stochastic Optimization", url: "https://arxiv.org/abs/1412.6980", note: "편향 보정 유도가 2~3절에 있다 (영문)" },
    { title: "Loshchilov & Hutter (2019) — Decoupled Weight Decay Regularization", url: "https://arxiv.org/abs/1711.05101", note: "AdamW (영문, 연구 논문)" },
    { title: "Liu et al. (2020) — On the Variance of the Adaptive Learning Rate and Beyond", url: "https://arxiv.org/abs/1908.03265", note: "워밍업이 필요한 이유와 RAdam (영문)" },
  ],
});
