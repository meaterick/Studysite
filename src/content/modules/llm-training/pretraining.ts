import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/pretraining";

export default defineLesson({
  id: "pretraining",
  title: "다음 토큰 예측, 사전학습, 문맥 창",
  tier: "core",
  concepts: ["pretraining-decoding"],
  goal: "사전학습의 다음 토큰 예측 손실 $L = -\\frac{1}{T}\\sum_t \\log P(x_t \\mid x_{<t})$과 perplexity $e^L$의 의미를 설명하고, 라벨 없이 학습 데이터가 만들어지는 이유를 말할 수 있다.",
  why: "",
  body: md`
사전학습(pretraining)이 하는 일을 한 문장으로 말하면 "다음 토큰 예측(next-token prediction)이라는 자기지도학습 목적함수를 수조 개의 토큰에 대해 반복 최적화하는 것"이다. 모델은 웹 페이지·책·코드에서 추출한 수조 개 토큰에 대해, 주어진 문맥 $x_{<t}$ 뒤에 실제로 이어지는 토큰 $x_t$의 조건부 확률 $P(x_t \mid x_{<t})$을 최대화하도록 파라미터를 갱신하며, 이 과정에서 문맥과 다음 토큰 사이의 통계적 상관관계가 모델 파라미터에 인코딩된다. 이 목적함수의 결정적인 장점은 사람이 정답을 따로 매겨줄 필요가 없다는 점이다. 원문 자체가 이미 정답이기 때문이다. "오늘 날씨가"라는 문장 뒤에 실제로 이어지는 단어가 곧 정답 레이블이니, 라벨링 비용 없이 인터넷 규모의 데이터를 그대로 학습에 쏟아부을 수 있다. 바로 이 "공짜 라벨"이라는 성질이 LLM이 이렇게까지 커질 수 있었던 이유이기도 하다.

[[diagram:llm-pipeline]]

사전학습 손실은 교차 엔트로피 형태로, 정리하면 다음과 같다.

\`\`\`math
L = -\dfrac{1}{T}\sum_{t} \log P(x_t \mid x_{<t})
\`\`\`

이 식이 말하는 바는 단순하다. 실제로 나온 정답 토큰에 모델이 낮은 확률을 줬다면 $-\log P$가 크게 튀어 손실값이 커지고, 높은 확률을 줬다면 손실값이 0에 가까워진다. 이것을 시퀀스 전체 $T$개 토큰에 대해 평균 낸 값이 바로 손실이다. Perplexity $= e^{L}$은 이 손실값을 "모델이 매 스텝마다 평균적으로 몇 개의 후보 사이에서 균등하게 헷갈리고 있는가"에 해당하는 유효 분기 수(effective branching factor)로 환산한 지표다. 학습을 전혀 하지 않은 모델은 어휘 5만 개 중 아무거나 균등하게 찍는 것과 비슷해서 $L \approx \log(50000) \approx 10.8$, perplexity는 5만에 가깝다. 유효 분기 수가 어휘 전체와 같다는, 즉 다음 토큰에 대한 사전 정보가 전혀 없다는 뜻이다. 반면 학습이 잘 끝난 GPT급 모델은 perplexity가 10~20 수준까지 떨어지는데, 이는 다음 단어를 고를 때 실질적으로 10~20개 후보 사이로 확률질량이 좁혀져 있다는 의미다.

### 손으로, 그리고 코드로 계산하기

:::example 세 토큰짜리 손실과 perplexity
"오늘 날씨가 정말 맑다"에서 모델이 정답 토큰 "날씨가", "정말", "맑다"에 각각 0.5, 0.25, 0.125의 확률을 줬다고 하자.

$$L = -\frac{1}{3}\left(\ln 0.5 + \ln 0.25 + \ln 0.125\right) = \frac{\ln 2 + \ln 4 + \ln 8}{3} = \frac{6\ln 2}{3} = 2\ln 2 \approx 1.386$$

perplexity는 $e^{L} = e^{2\ln 2} = 4$다. 정답 확률의 역수 2, 4, 8의 기하평균 $\sqrt[3]{2 \times 4 \times 8} = 4$와 같다. "매 스텝 평균 4개 후보 사이에서 헷갈리는 정도"라는 뜻이다.
:::

아래 코드는 문장 하나에서 (입력, 정답) 쌍이 저절로 만들어지는 모습과 위 계산을 함께 보여 준다.

\`\`\`python
import numpy as np

tokens = ["오늘", "날씨가", "정말", "맑다"]
# 입력과 정답은 한 칸씩 어긋난다: 앞부분을 보고 바로 다음 토큰을 맞힌다
for t in range(1, len(tokens)):
    print(f"입력 {tokens[:t]} → 정답 '{tokens[t]}'")

# 모델이 실제 정답 토큰에 준 확률 (예시)
p_correct = np.array([0.5, 0.25, 0.125])
L = -np.log(p_correct).mean()          # 평균 음의 로그우도 = 교차 엔트로피
print(f"\n손실 L = {L:.3f} nats, perplexity = e^L = {np.exp(L):.2f}")

# 학습 전: 어휘 50,000개에 같은 확률을 주는 모델
V = 50000
L0 = -np.log(1 / V)
print(f"균등 모델: L = {L0:.2f}, perplexity = {np.exp(L0):,.0f}")
\`\`\`

토큰 4개짜리 문장에서 예측 문제 3개가 나왔다. 토큰 $T$개짜리 문서 하나는 예측 문제 $T-1$개가 되고, 5주차의 causal mask 덕분에 이 문제들을 한 번의 순전파로 동시에 학습한다. 수조 토큰의 텍스트가 곧 수조 개의 학습 문제인 셈이다.

[[diagram:perplexity-worked]]

:::info 로그의 밑: nats와 bits
자연로그($\ln$)로 잰 손실의 단위를 nats, 밑이 2인 로그로 잰 손실을 bits라 한다. $\log_2 x = \ln x / \ln 2$이므로 1 nat $\approx$ 1.44 bits다. 밑을 바꿔도 perplexity는 같다. nats면 $e^{L}$, bits면 $2^{L}$로 되돌리기 때문이다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "평균 손실이 $L = \\ln 20 \\approx 3.0$ nats인 언어모델의 perplexity는?",
      choices: ["약 3", "약 20", "약 $e^{20}$", "약 0.05"],
      answer: 1,
      explanation: "perplexity $= e^{L} = e^{\\ln 20} = 20$. 매 스텝 평균 20개 후보 사이에서 헷갈리는 수준이다.",
    },
    {
      key: "c2",
      question: "어휘 크기 50,000에서 모든 토큰에 같은 확률을 주는(학습 전) 모델의 perplexity는?",
      choices: ["1", "약 10.8", "50,000", "0"],
      answer: 2,
      explanation: "손실은 $\\ln 50000 \\approx 10.8$이고 perplexity는 $e^{10.8} \\approx 50000$, 즉 어휘 크기와 같다.",
    },
    {
      key: "c3",
      question: "사전학습에 사람이 붙인 정답 레이블이 필요 없는 이유는?",
      choices: ["사전학습은 손실함수가 없기 때문에", "원문에서 다음에 실제로 나온 토큰이 곧 정답이기 때문에", "모델이 스스로 정답을 지어내기 때문에", "평가를 하지 않기 때문에"],
      answer: 1,
      explanation: "원문을 한 칸 밀면 (문맥, 다음 토큰) 쌍이 자동으로 생긴다. 자기지도학습이다.",
    },
    {
      key: "c4",
      question: "모델이 세 정답 토큰에 각각 0.5, 0.25, 0.125의 확률을 줬다면 perplexity는?",
      choices: ["4", "3", "8", "0.29"],
      answer: 0,
      explanation: "$L = (\\ln 2 + \\ln 4 + \\ln 8)/3 = 2\\ln 2$이므로 $e^{L} = 4$다. 정답 확률 역수(2, 4, 8)의 기하평균과 같다.",
    },
    {
      key: "c5",
      question: "토큰 1,000개짜리 문서 하나에서 만들어지는 다음 토큰 예측 문제의 수와 학습 방식은?",
      choices: ["999개이며, causal mask 덕분에 한 번의 순전파로 동시에 학습한다", "1개이며, 문서 전체를 보고 마지막 토큰만 맞힌다", "1,000개이며, 토큰마다 순전파를 따로 한다", "사람이 정답을 붙인 만큼만 생긴다"],
      answer: 0,
      explanation: "첫 토큰을 제외한 모든 토큰이 \"앞부분을 보고 맞힐 정답\"이 되어 999개다. causal mask가 각 위치가 앞만 보게 막아 주므로 모든 위치를 한꺼번에 계산할 수 있다.",
    },
    {
      key: "c6",
      question: "언어모델의 **검증** perplexity가 1.02로 나왔다. 가장 먼저 의심할 것은?",
      choices: ["매우 잘 일반화된 모델이다", "검증 문장이 학습 데이터에 섞여 있어 모델이 외운 것이다(데이터 오염)", "어휘가 너무 크다", "학습률이 너무 작다"],
      answer: 1,
      explanation: "perplexity 1은 다음 토큰을 매번 100% 확신으로 맞힌다는 뜻이라 실제 언어에서는 거의 불가능합니다. 검증·테스트 데이터가 학습 데이터에 섞였는지(오염)부터 확인해야 합니다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
text = "나는 오늘 학교 에 갔다 .".split()
pairs = [(text[max(0, t - 2):t], text[t]) for t in range(1, len(text))]
print(len(pairs), pairs[2])
`,
      expected: "5 (['오늘', '학교'], '에')",
      explanation: "토큰 6개짜리 원문에서 위치 1~5마다 예제가 하나씩, 모두 5개가 라벨 없이 만들어집니다. `pairs[2]`는 위치 3의 예제로, 직전 두 토큰 `['오늘', '학교']`가 문맥이고 '에'가 정답입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "다음 토큰 손실이 2.0 nats일 때 perplexity는? ($e^2 \\approx 7.39$)",
      answer: md`
perplexity $= e^{L} = e^{2} \approx 7.39$. 매 스텝 평균 7~8개 후보 사이에서 헷갈리는 수준이다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Karpathy — Intro to Large Language Models (1시간 영상)", url: "https://www.youtube.com/watch?v=zjkBMFhNj_g", note: "사전학습→파인튜닝→사용까지 LLM 전체 그림 (영문, 자막)" },
    { title: "Stanford CS336 — Language Modeling from Scratch", url: "https://stanford-cs336.github.io/", note: "LLM을 처음부터 만드는 강의: 데이터·학습·스케일링 파트" },
  ],
});
