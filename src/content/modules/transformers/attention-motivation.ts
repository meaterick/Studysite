import { defineLesson, md } from "../../kit";
import exercises from "./labs/attention-motivation";

export default defineLesson({
  id: "attention-motivation",
  title: "어텐션의 필요성: Seq2Seq의 병목",
  tier: "core",
  concepts: ["attention-transformer"],
  goal: "Seq2Seq의 Encoder–Decoder 구조와 Teacher Forcing을 설명하고, 고정 크기 문맥 벡터의 병목이 Attention으로 이어진 이유와 RNN 대비 Self-Attention의 경로 길이·연산량($O(1)$ vs $O(n)$, $O(n^2)$)을 비교할 수 있다.",
  why: "",
  body: md`
RNN(또는 LSTM/GRU)을 이용해 "입력 문장 하나를 통째로 다른 문장으로 바꾸는" 기계번역 같은 태스크를 풀려는 시도가 Seq2Seq(Sequence-to-Sequence)다. Seq2Seq는 서로 다른 역할을 맡은 두 개의 RNN, Encoder와 Decoder로 구성된다. Encoder는 입력 시퀀스 $x_1, \ldots, x_{T_x}$(예: 번역할 원문)를 토큰 순서대로 읽어나가며 은닉 상태를 갱신하고, 마지막 시점의 은닉 상태 $h_{T_x}$ 하나를 "입력 문장 전체의 의미를 압축한 고정 크기 벡터"로 취급해 이를 문맥 벡터(context vector) $c$로 Decoder에 넘긴다. Decoder는 이 $c$를 초기 상태로 받아, 자신의 은닉 상태 $s_t = f(s_{t-1}, y_{t-1}, c)$를 갱신해가며 출력 시퀀스 $y_1, \ldots, y_{T_y}$(예: 번역된 문장)를 한 토큰씩 순차적으로 생성한다.

Decoder를 학습시킬 때 실무에서 거의 항상 쓰는 기법이 Teacher Forcing이다. Decoder가 $t$번째 토큰을 생성한 뒤 $t+1$번째 토큰을 생성할 차례가 되면, 그 입력으로 "방금 모델 자신이 예측한 토큰"이 아니라 "실제 정답 시퀀스의 $t$번째 토큰"을 그대로 넣어준다. 학습 초기의 모델은 예측이 부정확할 수밖에 없는데, 만약 모델 자신의(틀렸을 가능성이 큰) 예측을 다음 입력으로 계속 되먹임하면, 한 스텝에서 발생한 작은 오차가 다음 스텝의 입력을 오염시키고 그 오염된 입력이 또 다음 오차를 낳는 식으로 오류가 눈덩이처럼 불어나 학습 신호 자체가 불안정해진다. 반면 매 스텝의 입력을 정답으로 고정해주면 각 스텝의 예측 오차가 서로 독립적으로 취급되어 학습이 훨씬 안정적이고 빠르게 수렴한다.

:::example Teacher Forcing에서 입력과 정답의 관계
번역 정답이 "나는 고양이를 좋아한다"일 때, 디코더의 입력과 맞혀야 할 정답은 한 칸씩 어긋나 있다. \`<sos>\`(start of sequence)는 "이제 생성을 시작하라"는 신호, \`<eos>\`(end of sequence)는 "여기서 끝"이라는 신호로 쓰는 특수 토큰이다.

| 스텝 | 디코더 입력 | 맞혀야 할 정답 |
| --- | --- | --- |
| 1 | \`<sos>\` | 나는 |
| 2 | 나는 | 고양이를 |
| 3 | 고양이를 | 좋아한다 |
| 4 | 좋아한다 | \`<eos>\` |

스텝 3에서 모델이 "좋아한다" 대신 "싫어한다"라고 잘못 예측했더라도, 스텝 4의 입력으로는 모델의 예측 "싫어한다"가 아니라 정답 "좋아한다"가 들어간다. 즉 입력 열은 모델의 예측과 상관없이 언제나 정답 문장을 한 칸 밀어 놓은 것이다.
:::

다만 Teacher Forcing에는 대가가 있다. 학습할 때는 언제나 정답을 입력으로 받지만, 실제로 번역할 때(추론)는 정답이 없으니 모델 자신의 예측을 다음 입력으로 써야 한다. 학습 때 한 번도 겪지 못한 "자기 실수가 섞인 입력"을 추론 때 처음 만나게 되는 이 불일치를 **노출 편향(exposure bias)**이라 부른다. 생성 도중 한 번 틀리면 그 뒤가 줄줄이 어긋나는 현상의 한 원인이다.

[[diagram:teacher-forcing]]

그러나 이 구조에는 결정적인 한계가 있다. Encoder는 입력 문장이 세 단어든 서른 단어든 관계없이, 그 안의 모든 정보를 언제나 같은 고정 크기의 벡터 $c$ 하나에 욱여넣어야 한다. 문장이 길어질수록 그 안에 담긴 정보량은 늘어나는데 이를 담을 그릇의 크기는 그대로이므로, 문장이 길어질수록 $c$ 안에서 앞부분 토큰들의 정보가 뒤이어 들어오는 정보에 덮이거나 희석되어 유실되는 정도가 심해진다. 이를 Seq2Seq의 병목(bottleneck) 문제라 부른다. 실제로 초기 Seq2Seq 기반 번역 모델은 짧은 문장에서는 준수한 성능을 보이다가도 문장 길이가 일정 수준을 넘어가면 번역 품질이 급격히 떨어지는 현상을 보였다.

**바로 이 병목이 Attention이 등장한 이유다.** Decoder가 문장 전체 정보를 오직 고정 크기 벡터 $c$ 하나에만 의존해야 한다는 제약 자체를 없애면 되지 않을까? 이 발상에서 나온 것이 Attention 메커니즘이다(Bahdanau et al., 2014). Decoder는 매 출력 스텝마다 Encoder가 만들어낸 모든 시점의 은닉 상태 $h_1, \ldots, h_{T_x}$를 다시 통째로 들여다보고, 지금 이 순간 생성할 토큰과 관련이 큰 시점에는 큰 가중치를, 관련이 적은 시점에는 작은 가중치를 주어 가중합한 벡터를 그때그때 새로 만들어 참고한다. 즉 정보를 압축해 한 번에 건네주는 대신, 필요할 때마다 원본 전체를 다시 조회할 수 있게 한 것이다. 이 아이디어가 이후 Encoder-Decoder 구조를 완전히 벗어나 "한 시퀀스 내부의 토큰들이 서로를 직접 조회한다"는 Self-Attention과 Transformer로 발전한다. 다음 단계부터는 그 Self-Attention을 정확한 수식으로 살펴본다.

\`\`\`image
src: /images/week5/bahdanau-alignment.png
alt: 영어 문장 The agreement on the European Economic Area was signed in August 1992와 모델이 만든 프랑스어 번역 사이의 attention 가중치 행렬. 밝은 칸이 대체로 대각선을 따라 놓이고, European Economic Area 부분에서만 역대각선으로 꺾여 있다.
caption: Bahdanau 등이 만든 Attention 번역 모델이 실제로 학습한 가중치 α다. 가로축이 영어 원문, 세로축이 모델이 생성한 프랑스어 번역이고, 칸이 밝을수록 그 단어를 만들 때 해당 원문 단어를 크게 참고했다는 뜻이다. 대체로 대각선을 따라가지만 'European Economic Area'가 'zone économique européenne'으로 어순이 뒤집히는 곳에서는 밝은 칸도 거꾸로 꺾인다. 어느 단어가 어느 단어에 대응하는지 따로 가르쳐 주지 않았는데, 번역만 학습해서 이런 정렬이 저절로 생겼다.
credit: Bahdanau, Cho & Bengio, "Neural Machine Translation by Jointly Learning to Align and Translate" (ICLR 2015), Figure 3(a), arXiv:1409.0473
width: 504
height: 520
\`\`\`

Encoder–Decoder Attention을 식으로 쓰면 다음 세 줄이다. 디코더의 현재 상태 $s_t$와 각 인코더 상태 $h_j$의 관련도 점수 $e_{tj}$를 구하고, softmax로 비율 $\alpha_{tj}$를 만든 뒤, 그 비율로 인코더 상태를 섞어 **이번 스텝만의** 문맥 벡터 $c_t$를 만든다.

\`\`\`math
e_{tj} = \text{score}(s_t, h_j), \qquad \alpha_{tj} = \frac{\exp(e_{tj})}{\sum_{j'} \exp(e_{tj'})}, \qquad c_t = \sum_j \alpha_{tj}\, h_j
\`\`\`

점수 함수로는 작은 신경망(Bahdanau)이나 단순한 내적 $s_t \cdot h_j$(Luong)를 쓴다. 아래는 내적을 쓴 간단한 예제다. 원문 "I love cats"를 번역하다가 디코더가 "고양이를"을 만들 차례라고 하자.

\`\`\`python
import numpy as np

# 인코더가 원문 "I love cats" 세 토큰에 대해 만든 은닉 상태(2차원으로 단순화)
H = np.array([[1.0, 0.0],    # h1: I
              [0.0, 1.0],    # h2: love
              [1.0, 1.0]])   # h3: cats
s = np.array([2.0, 0.5])     # 디코더가 "고양이를"을 만들 차례의 상태

scores = H @ s                          # 각 인코더 상태와 내적: [2.0, 0.5, 2.5]
weights = np.exp(scores) / np.exp(scores).sum()
context = weights @ H                   # 가중합 = 이번 스텝만의 문맥 벡터
print("점수:", scores)
print("가중치:", weights.round(3))
print("문맥 벡터:", context.round(3))
\`\`\`

디코더 상태와 가장 비슷한 방향을 가진 $h_3$("cats")이 57%로 가장 큰 비율을 받았다. 다음 스텝에서 디코더 상태가 바뀌면 점수도 바뀌어, 매 스텝 원문의 다른 부분을 들여다보게 된다. 고정된 $c$ 하나 대신 스텝마다 새 $c_t$를 만드는 것, 이것이 병목을 푸는 방법이다.

[[diagram:seq2seq-bottleneck]]

### 왜 Attention인가: 경로 길이와 병렬화

RNN은 문장을 토큰 순서대로 하나씩 처리하면서, 매 스텝마다 은닉 상태 $h_t = f(Wx_t + Uh_{t-1})$ 하나에 지금까지 읽은 모든 정보를 압축해 넣는다. 문장의 100번째 토큰이 3번째 토큰의 정보를 참고하려면 그 정보가 $h_3 \to h_4 \to \dots \to h_{100}$까지 97번의 순차적인 갱신을 거쳐 전달돼야 하고, 역전파 시 매 갱신마다 야코비안이 곱해지므로 경로가 길어질수록 기울기가 지수적으로 작아지는 현상(기울기 소실)이 발생한다. 즉 RNN에서 두 토큰 사이의 정보 경로 길이는 두 토큰의 위치 차이 $n$에 비례한다($O(n)$).

반면 Self-Attention은 모든 토큰 쌍 사이의 관련도를 $QK^\top$ 행렬곱 한 번으로 동시에 계산한다. 3번째 토큰과 97번째 토큰 사이의 관계도 중간 토큰을 거치지 않고 단 한 번의 내적으로 직접 구해지므로, 두 토큰 사이의 정보 경로 길이는 둘 사이의 거리와 무관하게 항상 1이다($O(1)$). 대신 $n$개 토큰의 모든 쌍을 계산해야 하므로 연산량은 $O(n^2)$으로, 문장이 길어질수록 비용이 제곱으로 불어난다는 대가를 치른다. 긴 문서를 통째로 넣기가 비싼 이유, 그리고 최근 연구들이 "긴 문맥을 싸게 처리하는 방법"에 매달리는 이유가 바로 이 $O(n^2)$이라는 한 항에 담겨 있다.

[[diagram:path-length-parallel]]

| | RNN | Transformer |
| --- | --- | --- |
| 정보 경로 길이 | $O(n)$: 멀리 있는 토큰 정보 손실 | $O(1)$: 모든 토큰이 직접 연결 |
| 병렬화 | 순차 처리(느림) | 시퀀스 전체 병렬(GPU 친화) |
| 연산량 | $O(n)$ | $O(n^2)$: 긴 문맥의 비용 문제 |
`,
  checks: [
    {
      key: "c1",
      question: "Teacher Forcing에서 Decoder의 다음 스텝 입력으로 넣는 것은?",
      choices: ["모델이 방금 예측한 토큰", "실제 정답 시퀀스의 이전 토큰", "Encoder의 마지막 은닉 상태만", "무작위 토큰"],
      answer: 1,
      explanation: "학습 중에는 정답 토큰을 넣어 한 스텝의 오류가 다음 스텝 입력을 오염시키는 것을 막는다.",
    },
    {
      key: "c2",
      question: "Seq2Seq의 \"병목\"에 대한 설명으로 옳은 것은?",
      choices: ["Decoder가 너무 느리다", "입력 길이와 무관하게 고정 크기 벡터 하나에 문장 전체를 압축해야 해서, 문장이 길수록 정보가 유실된다", "어휘 사전이 너무 크다", "Encoder와 Decoder의 파라미터가 공유된다"],
      answer: 1,
      explanation: "한 실험에서 16차원 $h_T$로 첫 토큰을 복원하는 $R^2$가 문장이 길어질수록 0으로 떨어졌다. Attention은 매 스텝 모든 $h_t$를 다시 조회해 이 병목을 없앤다.",
    },
    {
      key: "c3",
      question: "길이 $n$인 문장에서 Self-Attention의 두 토큰 사이 정보 경로 길이와 전체 연산량은?",
      choices: ["$O(n)$, $O(n)$", "$O(1)$, $O(n^2)$", "$O(n^2)$, $O(1)$", "$O(\\log n)$, $O(n)$"],
      answer: 1,
      explanation: "모든 쌍을 한 번에 직접 비교하므로 경로는 1이지만, $n \\times n$ 점수표를 만들어야 하므로 연산량은 $n^2$에 비례한다.",
    },
    {
      key: "c4",
      question: "학습 때는 Teacher Forcing으로 정답을 입력받다가 추론 때는 자기 예측을 입력받아 생기는 문제를 무엇이라 하는가?",
      choices: ["노출 편향(exposure bias)", "기울기 폭발", "과소적합", "레이블 누출"],
      answer: 0,
      explanation: "학습 중에는 자기 실수가 섞인 입력을 본 적이 없어서, 추론 때 한 번 틀리면 그 오류가 다음 입력으로 이어져 누적되기 쉽다. 이를 노출 편향이라 한다.",
    },
    {
      key: "c5",
      question: "Attention을 쓰는 Seq2Seq에서 디코더가 매 출력 스텝마다 새로 만드는 것은?",
      choices: ["인코더 상태들을 그 스텝의 가중치로 섞은 문맥 벡터 $c_t$", "새 인코더 은닉 상태", "새 어휘 사전", "고정된 문맥 벡터 $c$ 하나"],
      answer: 0,
      explanation: "디코더 상태와 각 인코더 상태의 관련도를 softmax로 비율화해 $c_t = \\sum_j \\alpha_{tj} h_j$를 스텝마다 새로 만든다. 고정된 $c$ 하나에 의존하지 않는 것이 핵심이다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "Seq2Seq에서 Encoder와 Decoder는 각각 어떤 역할을 맡는가? 그리고 Teacher Forcing이 학습 안정성에 기여하는 이유는 무엇인가?",
      answer: md`
Encoder는 입력 시퀀스 전체를 하나의 고정 크기 벡터로 압축하고, Decoder는 그 벡터로부터 출력 시퀀스를 생성한다. Teacher Forcing은 학습 시 Decoder의 다음 입력으로 모델이 직접 생성한(틀렸을 수도 있는) 토큰 대신 실제 정답 토큰을 넣어주는 기법으로, 초기 오류가 뒤로 계속 누적되는 것을 막아 학습을 안정시킨다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "Seq2Seq의 '정보 병목(bottleneck)' 문제란 정확히 무엇이며, 이것이 왜 Attention 메커니즘 등장의 직접적인 계기가 되었는가?",
      answer: md`
Seq2Seq는 입력 문장이 아무리 길어도 그 정보를 하나의 고정 크기 벡터에 다 압축해야 하므로, 문장이 길어질수록 정보 손실(병목)이 커진다. Attention은 Decoder가 매 생성 스텝마다 Encoder의 모든 은닉상태를 다시 참조할 수 있게 해서, 하나의 벡터에 모든 정보를 욱여넣을 필요를 없앤다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "RNN에서 LSTM/GRU로, 다시 Seq2Seq+Attention을 거쳐 Self-Attention/Transformer로 이어지는 발전 흐름을, 각 단계가 해결한 핵심 문제를 중심으로 한 문단으로 요약하라.",
      answer: md`
RNN의 장기 의존성 문제는 게이트 구조(LSTM/GRU)로 완화되었고, Seq2Seq의 고정 벡터 병목 문제는 Decoder가 Encoder 전체를 매 스텝 재조회하는 Attention으로 해결되었으며, RNN/Attention이 여전히 가지고 있던 순차 처리의 비효율성은 Self-Attention만으로 모든 토큰 쌍을 한 번에(병렬로) 계산하는 Transformer로 해결되었다.
`,
      keyPoints: [],
    },
    {
      key: "d4",
      question: "병목 실험에서 마지막 은닉 상태 $h_T$로 첫 토큰을 복원하는 $R^2$는 문장이 길어질수록 0으로 떨어졌지만 $h_1$로는 길이와 무관하게 1이었습니다. 이유를 설명하고, 은닉 차원을 16에서 64로 늘려도 병목이 '해결'되지 않는 이유를 적으십시오.",
      answer: md`
$h_T$는 고정된 16차원 벡터 하나에 지금까지 읽은 모든 토큰을 덮어쓰며 요약한 것이라, 길이가 늘수록 앞쪽 토큰의 정보가 뒤 토큰에 밀려 사라집니다. 길이 40이면 $40 \times 4 = 160$개의 숫자를 16차원에 담아야 하니 원리적으로 불가능합니다. $h_1$은 첫 토큰을 읽은 직후의 상태라 그 정보를 그대로 담고 있습니다. 은닉 차원을 64로 늘리면 담을 수 있는 양이 늘어 더 긴 문장까지 버티지만, 문장 길이는 얼마든지 더 길어질 수 있으므로 고정 크기라는 한계는 그대로입니다. attention은 디코더가 필요할 때마다 모든 $h_t$를 직접 다시 보게 해 이 한계를 구조적으로 피합니다.
`,
      keyPoints: ["$h_T$는 고정 크기 벡터 하나에 전체를 덮어쓴 요약", "길수록 앞 토큰 정보가 밀려난다", "$h_1$은 첫 토큰 정보를 그대로 담고 있다", "차원을 늘려도 길이가 더 길어지면 같은 한계", "attention은 모든 $h_t$를 직접 다시 본다"],
    },
  ],
  references: [
    { title: "Jay Alammar — Visualizing A Neural Machine Translation Model", url: "https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/", note: "Seq2Seq와 Attention을 애니메이션으로 (영문)" },
    { title: "Bahdanau et al. (2014) — Neural Machine Translation by Jointly Learning to Align and Translate", url: "https://arxiv.org/abs/1409.0473", note: "Attention을 처음 제안한 논문: 그림 1과 3절" },
  ],
});
