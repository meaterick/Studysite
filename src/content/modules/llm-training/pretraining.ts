import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/pretraining";

export default defineLesson({
  id: "pretraining",
  title: "다음 토큰 예측, 사전학습, 문맥 창",
  tier: "core",
  concepts: ["pretraining-decoding"],
  goal: "사전학습의 다음 토큰 예측 손실 $L = -\\frac{1}{T}\\sum_t \\log P(x_t \\mid x_{<t})$과 perplexity $e^L$을 계산하고, 라벨 없이 학습 데이터가 만들어지는 이유와 문맥 창의 의미와 한계를 설명한다.",
  why: "모든 LLM은 다음 토큰 예측으로 사전학습한 뒤 지시 미세조정([[lesson:instruction-tuning]])과 선호도 학습([[lesson:preference-learning]])을 거친다. 사전학습 손실과 perplexity는 언어 모델의 성능을 비교하는 기본 지표이고, 문맥 창의 길이는 한 번에 넣을 수 있는 문서의 양과 비용을 정한다.",
  body: md`
### 다음 토큰 예측

**사전학습**(pretraining)은 웹 페이지, 책, 코드에서 모은 수조 개의 토큰에 대해 **다음 토큰 예측**(next-token prediction)을 학습하는 과정이다. 모델은 문맥 $x_{<t}$ 뒤에 실제로 나온 토큰 $x_t$의 조건부 확률 $P(x_t \mid x_{<t})$가 커지도록 파라미터를 갱신한다. 이 목적함수는 사람이 정답을 붙일 필요가 없다. "오늘 날씨가" 뒤에 원문에서 실제로 이어지는 단어가 정답이므로, 원문만으로 입력과 정답의 쌍이 만들어진다(자기지도학습). 라벨링 비용 없이 인터넷 규모의 텍스트를 학습에 쓸 수 있다는 점이 LLM의 규모가 커질 수 있었던 주요 이유다.

[[diagram:llm-pipeline]]

사전학습 손실은 정답 토큰에 대한 교차 엔트로피의 평균이다([[lesson:loss-functions]]).

\`\`\`math
L = -\dfrac{1}{T}\sum_{t} \log P(x_t \mid x_{<t})
\`\`\`

정답 토큰에 낮은 확률을 주면 $-\log P$가 커져 손실이 커지고, 높은 확률을 주면 손실이 0에 가까워진다. **perplexity** $e^{L}$은 손실을 유효 분기 수(effective branching factor)로 바꾼 값으로, 모델이 스텝마다 평균적으로 몇 개의 후보에 확률을 고르게 나눠 주는 것과 같은지를 나타낸다. 학습 전의 모델이 어휘 5만 개에 같은 확률을 주면 $L = \ln 50000 \approx 10.8$이고 perplexity는 어휘 크기와 같은 5만이다. 잘 학습된 GPT급 모델의 perplexity는 10~20 정도로, 다음 토큰의 확률이 실질적으로 10~20개 후보에 모여 있다는 뜻이다.

### 손으로, 그리고 코드로 계산하기

"오늘 날씨가 매우 맑다"에서 모델이 정답 토큰 "날씨가", "매우", "맑다"에 각각 0.5, 0.25, 0.125의 확률을 줬다고 하자.

$$L = -\frac{1}{3}\left(\ln 0.5 + \ln 0.25 + \ln 0.125\right) = \frac{\ln 2 + \ln 4 + \ln 8}{3} = \frac{6\ln 2}{3} = 2\ln 2 \approx 1.386$$

perplexity는 $e^{L} = e^{2\ln 2} = 4$다. 정답 확률의 역수 2, 4, 8의 기하평균 $\sqrt[3]{2 \times 4 \times 8} = 4$와 같으며, 스텝마다 평균 4개의 후보에 확률을 고르게 나눈 것과 같은 수준이다.

\`\`\`python
import numpy as np

tokens = ["오늘", "날씨가", "매우", "맑다"]
for t in range(1, len(tokens)):                   # 입력과 정답은 한 칸씩 어긋난다
    print(f"입력 {tokens[:t]} → 정답 '{tokens[t]}'")

p_correct = np.array([0.5, 0.25, 0.125])          # 모델이 정답 토큰에 준 확률(예시)
L = -np.log(p_correct).mean()                      # 평균 음의 로그우도 = 교차 엔트로피
print(f"손실 L = {L:.3f} nats, perplexity = e^L = {np.exp(L):.2f}")   # 1.386, 4.00

V = 50000                                          # 학습 전: 어휘 50,000개에 같은 확률
L0 = -np.log(1 / V)
print(f"균등 모델: L = {L0:.2f}, perplexity = {np.exp(L0):,.0f}")
\`\`\`

토큰 4개짜리 문장에서 예측 문제 3개가 만들어졌다. 토큰 $T$개짜리 문서 하나는 예측 문제 $T-1$개가 되고, causal mask([[lesson:multi-head-attention]])가 있으므로 이 문제들을 순전파 한 번으로 동시에 학습한다.

[[diagram:perplexity-worked]]

:::info 로그의 밑: nats와 bits
자연로그($\ln$)로 계산한 손실의 단위를 nats, 밑이 2인 로그로 계산한 손실의 단위를 bits라 한다. $\log_2 x = \ln x / \ln 2$이므로 1 nat은 약 1.44 bits다. 밑을 바꿔도 perplexity는 같다. nats이면 $e^{L}$, bits이면 $2^{L}$로 되돌리기 때문이다.
:::

### 문맥 창

**문맥 창**(context window)은 모델이 한 번에 입력으로 받을 수 있는 최대 토큰 수다. 프롬프트와 생성할 출력을 합친 길이가 문맥 창 안에 들어가야 하며, 창 밖의 토큰은 attention 계산에 쓰이지 않으므로 모델은 그 내용을 참조할 수 없다. 문맥 창은 다음 이유로 제한된다.

- **계산량**: self-attention의 연산량은 문맥 길이의 제곱에 비례한다([[lesson:attention-motivation]]).
- **메모리**: 생성할 때 저장하는 KV 캐시가 문맥 길이에 비례해 커진다([[lesson:kv-cache-rope]]).
- **학습 길이**: 학습할 때 쓴 길이보다 긴 입력에서는 위치 정보가 학습 범위를 벗어나 성능이 떨어진다([[lesson:position-extrapolation]]).

문맥 창보다 긴 문서는 나눠서 넣거나, 질문과 관련된 부분만 검색해 넣는다(RAG, [[lesson:rag]]). 문맥 창이 길더라도 모델이 긴 입력의 모든 부분을 같은 정확도로 활용하지는 못하며, 입력의 중간에 있는 정보를 앞뒤보다 덜 활용한다는 보고도 있다(Liu 외, 2023).
`,
  checks: [
    {
      key: "c1",
      question: "평균 손실이 $L = \\ln 20 \\approx 3.0$ nats인 언어 모델의 perplexity는?",
      choices: ["약 3", "약 20", "약 $e^{20}$", "약 0.05"],
      answer: 1,
      explanation: "perplexity $= e^{L} = e^{\\ln 20} = 20$이다. 스텝마다 평균 20개 후보에 확률을 고르게 나눈 것과 같은 수준이다.",
    },
    {
      key: "c2",
      question: "어휘 크기 50,000에서 모든 토큰에 같은 확률을 주는(학습 전) 모델의 perplexity는?",
      choices: ["1", "약 10.8", "50,000", "0"],
      answer: 2,
      explanation: "손실은 $\\ln 50000 \\approx 10.8$이고 perplexity는 $e^{10.8} \\approx 50000$으로 어휘 크기와 같다.",
    },
    {
      key: "c3",
      question: "사전학습에 사람이 붙인 정답 레이블이 필요 없는 이유는?",
      choices: ["사전학습은 손실함수가 없기 때문에", "원문에서 다음에 실제로 나온 토큰이 정답이기 때문에", "모델이 스스로 정답을 만들어 내기 때문에", "평가를 하지 않기 때문에"],
      answer: 1,
      explanation: "원문을 한 칸 밀면 (문맥, 다음 토큰) 쌍이 만들어진다. 자기지도학습이다.",
    },
    {
      key: "c4",
      question: "모델이 세 정답 토큰에 각각 0.5, 0.25, 0.125의 확률을 줬다면 perplexity는?",
      choices: ["4", "3", "8", "0.29"],
      answer: 0,
      explanation: "$L = (\\ln 2 + \\ln 4 + \\ln 8)/3 = 2\\ln 2$이므로 $e^{L} = 4$다. 정답 확률의 역수(2, 4, 8)의 기하평균과 같다.",
    },
    {
      key: "c5",
      question: "토큰 1,000개짜리 문서 하나에서 만들어지는 다음 토큰 예측 문제의 수와 학습 방식은?",
      choices: ["999개이며, causal mask가 있으므로 순전파 한 번으로 동시에 학습한다", "1개이며, 문서 전체를 보고 마지막 토큰만 예측한다", "1,000개이며, 토큰마다 순전파를 따로 한다", "사람이 정답을 붙인 만큼만 생긴다"],
      answer: 0,
      explanation: "첫 토큰을 제외한 모든 토큰이 앞부분으로 예측할 정답이 되므로 999개다. causal mask가 각 위치에서 앞 토큰만 참조하게 하므로 모든 위치를 한 번에 계산할 수 있다.",
    },
    {
      key: "c6",
      question: "언어 모델의 검증 perplexity가 1.02로 나왔다. 가장 먼저 의심할 것은?",
      choices: ["매우 잘 일반화된 모델이다", "검증 문장이 학습 데이터에 포함되어 모델이 그 문장을 그대로 학습했다(데이터 오염)", "어휘가 너무 크다", "학습률이 너무 작다"],
      answer: 1,
      explanation: "perplexity 1은 다음 토큰에 매번 확률 1을 준다는 뜻이라 실제 언어에서는 거의 불가능하다. 검증·테스트 데이터가 학습 데이터에 포함되었는지(데이터 오염)부터 확인한다.",
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
      explanation: "토큰 6개짜리 원문에서 위치 1~5마다 예제가 하나씩, 모두 5개가 라벨 없이 만들어진다. `pairs[2]`는 위치 3의 예제로, 직전 두 토큰 `['오늘', '학교']`가 문맥이고 '에'가 정답이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "다음 토큰 예측이 사람의 라벨 없이 학습 데이터를 만드는 이유를 쓰고, 평균 손실이 2.0 nats일 때 perplexity와 그 의미를 쓰라($e^2 \\approx 7.39$). 문맥 창이 제한되는 이유도 두 가지 이상 쓰라.",
      answer: md`
다음 토큰 예측에서는 원문에서 문맥 뒤에 실제로 나온 토큰이 정답이다. 원문을 한 칸씩 밀면 (문맥, 다음 토큰) 쌍이 만들어지므로 사람이 라벨을 붙일 필요가 없고, 토큰 $T$개짜리 문서 하나에서 예측 문제 $T-1$개가 만들어진다.

평균 손실이 2.0 nats이면 perplexity는 $e^{2} \approx 7.39$다. 모델이 스텝마다 평균적으로 7~8개의 후보에 확률을 고르게 나눠 주는 것과 같은 수준이라는 뜻이다. 문맥 창은 self-attention의 연산량이 길이의 제곱에 비례하고, 생성할 때 저장하는 KV 캐시가 길이에 비례해 커지며, 학습 길이보다 긴 입력에서는 위치 정보가 학습 범위를 벗어나 성능이 떨어지므로 제한된다.
`,
      keyPoints: [
        "원문에서 다음에 나온 토큰이 정답이므로 라벨이 필요 없다",
        "perplexity $= e^{2} \\approx 7.39$",
        "스텝마다 평균 7~8개 후보에 확률을 나누는 수준이다",
        "문맥 창의 제한: attention 연산량 $O(n^2)$, KV 캐시 메모리, 학습 길이",
      ],
    },
  ],
  references: [
    { title: "Liu et al. (2023) — Lost in the Middle: How Language Models Use Long Contexts", url: "https://arxiv.org/abs/2307.03172", note: "긴 입력의 중간에 있는 정보를 덜 활용하는 현상 (영문)" },
    { title: "Karpathy — Intro to Large Language Models (1시간 영상)", url: "https://www.youtube.com/watch?v=zjkBMFhNj_g", note: "사전학습, 미세조정, 사용까지 LLM 전체의 구성 (영문)" },
    { title: "Stanford CS336 — Language Modeling from Scratch", url: "https://stanford-cs336.github.io/", note: "LLM을 처음부터 만드는 강의: 데이터, 학습, 스케일링 (영문)" },
  ],
});
