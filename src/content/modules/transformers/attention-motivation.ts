import { defineLesson, md } from "../../kit";
import exercises from "./labs/attention-motivation";

export default defineLesson({
  id: "attention-motivation",
  title: "어텐션의 필요성: Seq2Seq의 병목",
  tier: "core",
  concepts: ["attention-transformer"],
  goal: "Seq2Seq의 인코더-디코더 구조와 Teacher Forcing을 설명하고, 고정 크기 문맥 벡터의 병목이 attention으로 이어진 이유와 RNN 대비 self-attention의 경로 길이·연산량($O(1)$ 대 $O(n)$, $O(n^2)$)을 비교한다.",
  why: "Transformer와 LLM의 핵심 연산인 attention은 Seq2Seq 번역 모델의 병목을 해결하려고 제안되었다. attention이 해결한 문제와 그 대가($O(n^2)$ 연산량)를 알아야, 긴 문맥 처리가 비싼 이유와 효율적인 attention 연구([[lesson:efficient-attention]])의 목적을 이해할 수 있다.",
  body: md`
### Seq2Seq: 인코더와 디코더

**Seq2Seq**(Sequence-to-Sequence)는 기계번역처럼 입력 시퀀스를 다른 시퀀스로 바꾸는 모델로, RNN(또는 LSTM·GRU) 두 개로 이루어진다([[lesson:rnn]]). **인코더**(encoder)는 입력 시퀀스 $x_1, \ldots, x_{T_x}$를 차례로 읽으며 은닉 상태를 갱신하고, 마지막 은닉 상태 $h_{T_x}$를 입력 문장 전체를 요약한 고정 크기의 **문맥 벡터**(context vector) $c$로 디코더에 넘긴다. **디코더**(decoder)는 $c$에서 시작해 은닉 상태 $s_t = f(s_{t-1}, y_{t-1}, c)$를 갱신하며 출력 시퀀스 $y_1, \ldots, y_{T_y}$를 한 토큰씩 생성한다.

### Teacher Forcing과 노출 편향

디코더를 학습할 때는 보통 **Teacher Forcing**을 쓴다. $t+1$번째 토큰을 예측할 때, 입력으로 모델이 방금 예측한 토큰 대신 정답 시퀀스의 $t$번째 토큰을 넣는다. 학습 초기의 예측은 부정확하므로 모델의 예측을 다음 입력으로 쓰면 한 스텝의 오차가 다음 스텝의 입력을 바꾸고, 그 오차가 다시 다음 스텝으로 이어져 학습이 불안정해진다. 입력을 정답으로 고정하면 스텝마다의 예측을 독립적으로 학습할 수 있어 학습이 안정적이고 빠르다.

정답이 "나는 고양이를 좋아한다"이면 디코더의 입력과 정답은 한 칸씩 어긋난다. \`<sos>\`(start of sequence)는 생성 시작, \`<eos>\`(end of sequence)는 생성 끝을 나타내는 특수 토큰이다.

| 스텝 | 디코더 입력 | 예측할 정답 |
| --- | --- | --- |
| 1 | \`<sos>\` | 나는 |
| 2 | 나는 | 고양이를 |
| 3 | 고양이를 | 좋아한다 |
| 4 | 좋아한다 | \`<eos>\` |

스텝 3에서 모델이 "싫어한다"로 잘못 예측해도 스텝 4의 입력은 정답 "좋아한다"다. 입력 열은 모델의 예측과 관계없이 정답 문장을 한 칸 민 것이다.

Teacher Forcing에는 대가가 있다. 추론할 때는 정답이 없으므로 모델의 예측을 다음 입력으로 써야 하는데, 모델은 학습 중에 자기 예측의 오류가 섞인 입력을 본 적이 없다. 학습과 추론에서 입력의 분포가 다른 이 문제를 **노출 편향**(exposure bias)이라 하며, 생성 중에 한 번 틀리면 뒤의 출력도 연달아 틀리는 원인 중 하나다.

[[diagram:teacher-forcing]]

### 고정 크기 문맥 벡터의 병목

인코더는 입력 문장의 길이와 관계없이 모든 정보를 같은 크기의 벡터 $c$ 하나에 담아야 한다. 문장이 길수록 담아야 할 정보는 많아지지만 $c$의 크기는 그대로이므로, 앞부분 토큰의 정보는 뒤에 들어오는 토큰의 정보와 섞여 점점 약해진다. 이를 Seq2Seq의 **병목**(bottleneck) 문제라 한다. 실제로 초기 Seq2Seq 번역 모델은 짧은 문장에서는 성능이 좋다가도, 문장이 일정 길이를 넘으면 번역 품질이 크게 떨어졌다.

### Attention: 스텝마다 새로 만드는 문맥 벡터

**Attention**(Bahdanau 외, 2014)은 디코더가 고정된 $c$ 하나에만 의존하지 않도록, 출력 스텝마다 인코더의 모든 은닉 상태 $h_1, \ldots, h_{T_x}$를 다시 참조한다. 지금 생성할 토큰과 관련이 큰 시점에 큰 가중치를 주어 가중합한 벡터를 스텝마다 새로 만든다. 디코더의 현재 상태 $s_t$와 각 인코더 상태 $h_j$의 관련도 점수 $e_{tj}$를 구하고, softmax로 가중치 $\alpha_{tj}$를 만든 뒤, 그 가중치로 인코더 상태를 더해 이번 스텝의 문맥 벡터 $c_t$를 만든다.

\`\`\`math
e_{tj} = \text{score}(s_t, h_j), \qquad \alpha_{tj} = \frac{\exp(e_{tj})}{\sum_{j'} \exp(e_{tj'})}, \qquad c_t = \sum_j \alpha_{tj}\, h_j
\`\`\`

점수 함수로는 작은 신경망(Bahdanau)이나 내적 $s_t \cdot h_j$(Luong)를 쓴다.

\`\`\`image
src: /images/week5/bahdanau-alignment.png
alt: 영어 문장 The agreement on the European Economic Area was signed in August 1992와 모델이 만든 프랑스어 번역 사이의 attention 가중치 행렬. 밝은 칸이 대체로 대각선을 따라 놓이고, European Economic Area 부분에서만 역대각선 방향으로 놓인다.
caption: Bahdanau 등의 attention 번역 모델이 학습한 가중치 α다. 가로축이 영어 원문, 세로축이 모델이 생성한 프랑스어 번역이고, 칸이 밝을수록 그 단어를 생성할 때 해당 원문 단어의 가중치가 컸다는 뜻이다. 대체로 대각선을 따르지만 'European Economic Area'가 'zone économique européenne'으로 어순이 바뀌는 부분에서는 밝은 칸도 역대각선 방향이 된다. 단어 사이의 대응을 따로 알려 주지 않고 번역만 학습했는데도 이런 정렬이 학습되었다.
credit: Bahdanau, Cho & Bengio, "Neural Machine Translation by Jointly Learning to Align and Translate" (ICLR 2015), Figure 3(a), arXiv:1409.0473
width: 504
height: 520
\`\`\`

아래는 내적을 점수로 쓴 예다. 원문 "I love cats"를 번역하다가 디코더가 "고양이를"을 생성할 차례라고 하자.

\`\`\`python
import numpy as np

H = np.array([[1.0, 0.0],    # h1: I        (인코더 은닉 상태, 2차원으로 단순화)
              [0.0, 1.0],    # h2: love
              [1.0, 1.0]])   # h3: cats
s = np.array([2.0, 0.5])     # 디코더가 "고양이를"을 생성할 차례의 상태

scores = H @ s                                   # 각 인코더 상태와의 내적: [2.0, 0.5, 2.5]
weights = np.exp(scores) / np.exp(scores).sum()  # softmax
context = weights @ H                            # 이번 스텝의 문맥 벡터
print("가중치:", weights.round(3))                # [0.348 0.078 0.574]
print("문맥 벡터:", context.round(3))             # [0.922 0.652]
\`\`\`

디코더 상태와 내적이 가장 큰 $h_3$("cats")이 가중치 57%를 받았다. 다음 스텝에서 디코더 상태가 바뀌면 점수와 가중치도 바뀌어 원문의 다른 부분에 큰 가중치가 놓인다. 고정된 $c$ 하나 대신 스텝마다 새 $c_t$를 만들어 병목을 해결한다. 이 방식이 인코더-디코더 구조를 벗어나 한 시퀀스 안의 토큰들이 서로를 참조하는 self-attention으로 발전한다([[lesson:self-attention]]).

[[diagram:seq2seq-bottleneck]]

### 경로 길이와 병렬화

RNN은 토큰을 하나씩 처리하며 은닉 상태 하나에 지금까지의 정보를 담는다. 100번째 토큰이 3번째 토큰의 정보를 쓰려면 그 정보가 $h_3 \to h_4 \to \dots \to h_{100}$의 97번의 갱신을 거쳐야 하고, 역전파에서는 갱신마다 야코비안이 곱해져 거리가 멀수록 기울기가 지수적으로 작아진다. 두 토큰 사이의 정보 경로 길이가 두 토큰의 거리 $n$에 비례한다($O(n)$).

self-attention은 모든 토큰 쌍의 관련도를 행렬 곱 $QK^\top$ 한 번으로 동시에 계산한다. 3번째 토큰과 97번째 토큰의 관계도 중간 토큰을 거치지 않고 내적 한 번으로 계산되므로, 정보 경로 길이는 거리와 관계없이 1이다($O(1)$). 대신 $n$개 토큰의 모든 쌍을 계산하므로 연산량은 $O(n^2)$이고, 문맥이 길어지면 비용이 길이의 제곱으로 커진다. 긴 문서를 한 번에 처리하는 비용이 큰 이유가 이 $O(n^2)$이다.

[[diagram:path-length-parallel]]

| | RNN | Transformer |
| --- | --- | --- |
| 정보 경로 길이 | $O(n)$: 먼 토큰의 정보가 약해진다 | $O(1)$: 모든 토큰 쌍을 직접 계산한다 |
| 병렬화 | 순차 처리 | 시퀀스 전체를 병렬 처리(GPU에 적합) |
| 연산량 | $O(n)$ | $O(n^2)$: 긴 문맥의 비용이 크다 |
`,
  checks: [
    {
      key: "c1",
      question: "Teacher Forcing에서 Decoder의 다음 스텝 입력으로 넣는 것은?",
      choices: ["모델이 방금 예측한 토큰", "실제 정답 시퀀스의 이전 토큰", "Encoder의 마지막 은닉 상태만", "무작위 토큰"],
      answer: 1,
      explanation: "학습 중에는 정답 토큰을 넣어, 한 스텝의 예측 오류가 다음 스텝의 입력에 영향을 주지 않게 한다.",
    },
    {
      key: "c2",
      question: "Seq2Seq의 \"병목\"에 대한 설명으로 옳은 것은?",
      choices: ["디코더가 너무 느리다", "입력 길이와 관계없이 고정 크기 벡터 하나에 문장 전체를 담아야 해서, 문장이 길수록 정보가 손실된다", "어휘 사전이 너무 크다", "인코더와 디코더가 파라미터를 공유한다"],
      answer: 1,
      explanation: "문맥 벡터의 크기는 고정되어 있으므로 문장이 길수록 앞부분 토큰의 정보가 약해진다. attention은 출력 스텝마다 인코더의 모든 은닉 상태를 다시 참조해 이 병목을 없앤다.",
    },
    {
      key: "c3",
      question: "길이 $n$인 문장에서 Self-Attention의 두 토큰 사이 정보 경로 길이와 전체 연산량은?",
      choices: ["$O(n)$, $O(n)$", "$O(1)$, $O(n^2)$", "$O(n^2)$, $O(1)$", "$O(\\log n)$, $O(n)$"],
      answer: 1,
      explanation: "모든 쌍을 한 번에 직접 계산하므로 경로 길이는 1이지만, $n \\times n$ 점수 행렬을 계산하므로 연산량은 $n^2$에 비례한다.",
    },
    {
      key: "c4",
      question: "학습 때는 Teacher Forcing으로 정답을 입력받다가 추론 때는 자기 예측을 입력받아 생기는 문제를 무엇이라 하는가?",
      choices: ["노출 편향(exposure bias)", "기울기 폭주", "과소적합", "라벨 누수"],
      answer: 0,
      explanation: "학습 중에는 자기 예측의 오류가 섞인 입력을 본 적이 없으므로, 추론할 때 한 번 틀리면 그 오류가 다음 입력으로 이어져 누적되기 쉽다.",
    },
    {
      key: "c5",
      question: "Attention을 쓰는 Seq2Seq에서 디코더가 매 출력 스텝마다 새로 만드는 것은?",
      choices: ["인코더 상태들을 그 스텝의 가중치로 가중합한 문맥 벡터 $c_t$", "새 인코더 은닉 상태", "새 어휘 사전", "고정된 문맥 벡터 $c$ 하나"],
      answer: 0,
      explanation: "디코더 상태와 각 인코더 상태의 관련도에 softmax를 적용해 가중치를 만들고, $c_t = \\sum_j \\alpha_{tj} h_j$를 스텝마다 새로 계산한다. 고정된 $c$ 하나에 의존하지 않는다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "Seq2Seq에서 인코더와 디코더가 각각 하는 일을 쓰고, Teacher Forcing이 학습을 안정시키는 이유와 그 대가인 노출 편향을 쓰라.",
      answer: md`
인코더는 입력 시퀀스를 차례로 읽으며 은닉 상태를 갱신하고, 마지막 은닉 상태를 입력 문장 전체를 요약한 고정 크기의 문맥 벡터로 디코더에 넘긴다. 디코더는 문맥 벡터에서 시작해 출력 시퀀스를 한 토큰씩 생성한다.

Teacher Forcing은 학습할 때 디코더의 다음 입력으로 모델의 예측 대신 정답 토큰을 넣는다. 모델의 예측을 입력으로 쓰면 한 스텝의 오류가 다음 스텝의 입력을 바꾸어 오류가 누적되지만, 정답을 넣으면 스텝마다의 예측을 독립적으로 학습할 수 있어 학습이 안정적이다. 대신 추론할 때는 정답이 없어 모델의 예측을 입력으로 써야 하는데, 모델은 학습 중에 자기 예측의 오류가 섞인 입력을 본 적이 없다. 이 차이가 노출 편향이다.
`,
      keyPoints: [
        "인코더: 입력을 읽어 고정 크기 문맥 벡터로 요약한다",
        "디코더: 문맥 벡터에서 출력을 한 토큰씩 생성한다",
        "Teacher Forcing: 정답을 입력으로 넣어 오류의 누적을 막는다",
        "노출 편향: 추론 때 처음으로 자기 예측의 오류가 섞인 입력을 받는다",
      ],
    },
    {
      key: "d2",
      question: "Seq2Seq의 병목 문제를 쓰고, attention이 이를 해결하는 방법을 식으로 쓰라. RNN과 self-attention의 정보 경로 길이와 연산량도 비교하라.",
      answer: md`
Seq2Seq의 인코더는 입력 문장의 길이와 관계없이 모든 정보를 고정 크기의 문맥 벡터 하나에 담아야 하므로, 문장이 길수록 앞부분 토큰의 정보가 약해져 번역 품질이 떨어진다. attention은 출력 스텝마다 디코더 상태 $s_t$와 인코더의 모든 은닉 상태 $h_j$의 점수 $e_{tj}$를 계산하고, softmax로 가중치 $\alpha_{tj}$를 만든 뒤 $c_t = \sum_j \alpha_{tj} h_j$로 그 스텝의 문맥 벡터를 새로 만든다. 고정된 벡터 하나에 의존하지 않으므로 병목이 없어진다.

RNN에서는 두 토큰 사이의 정보가 그 사이의 모든 갱신을 거쳐야 하므로 경로 길이가 거리에 비례하고($O(n)$), 순차적으로만 계산할 수 있다. self-attention은 모든 토큰 쌍을 행렬 곱 한 번으로 직접 계산하므로 경로 길이가 1이고 병렬 계산이 쉽지만, 연산량이 $O(n^2)$이라 문맥이 길수록 비용이 크다.
`,
      keyPoints: [
        "병목: 고정 크기 벡터 하나에 문장 전체를 담아야 한다",
        "attention: 스텝마다 $c_t = \\sum_j \\alpha_{tj} h_j$를 새로 만든다",
        "RNN은 경로 길이 $O(n)$이고 순차적으로 계산한다",
        "self-attention은 경로 길이 $O(1)$, 연산량 $O(n^2)$",
      ],
    },
  ],
  references: [
    { title: "Jay Alammar — Visualizing A Neural Machine Translation Model", url: "https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/", note: "Seq2Seq와 Attention을 애니메이션으로 (영문)" },
    { title: "Bahdanau et al. (2014) — Neural Machine Translation by Jointly Learning to Align and Translate", url: "https://arxiv.org/abs/1409.0473", note: "attention을 처음 제안한 논문: 그림 1과 3절 (영문)" },
  ],
});
