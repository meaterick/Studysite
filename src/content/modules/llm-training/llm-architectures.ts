import { defineLesson, md } from "../../kit";
import exercises from "./labs/llm-architectures";

export default defineLesson({
  id: "llm-architectures",
  title: "LLM 구조: BERT, GPT, T5",
  tier: "supplement",
  goal: "Encoder-only(BERT, MLM), Decoder-only(GPT, 다음 토큰 예측), Encoder-Decoder(T5, text-to-text) 구조의 차이를 attention 마스크로 설명하고, 대형 LLM이 Decoder-only 구조를 주로 쓰는 이유와 창발 능력에 대한 반론을 설명한다.",
  why: "문장 분류와 임베딩에는 Encoder-only 모델을, 대화와 글 생성에는 Decoder-only 모델을 쓰는 것처럼, 과제에 맞는 모델을 고르려면 구조의 차이를 알아야 한다. RAG에서 문서를 벡터로 바꾸는 임베딩 모델([[lesson:retrieval]])은 주로 Encoder-only 구조이고, 이 모듈에서 다루는 LLM은 Decoder-only 구조다.",
  body: md`
Transformer 기반 언어 모델은 인코더(encoder)와 디코더(decoder) 중 무엇을 쓰는지, 그리고 각 토큰이 문맥을 양방향(bidirectional)으로 참조하는지 앞쪽으로만 참조하는지(자기회귀, autoregressive)에 따라 세 구조로 나뉜다.

### Encoder-only: BERT

**BERT**(Bidirectional Encoder Representations from Transformers)는 Encoder-only 구조이며, **MLM**(masked language modeling)으로 학습한다. 입력 토큰의 일부를 \`[MASK]\`로 가리고, 가린 자리의 원래 토큰을 앞뒤 문맥으로 예측한다. "나는 [MASK]를 먹었다"에서 \`[MASK]\`를 예측할 때 BERT는 앞의 "나는"과 뒤의 "를 먹었다"를 함께 참조한다. 문장 전체가 주어진 상태에서 각 토큰이 양쪽 문맥을 모두 참조하므로, 감성 분석, 개체명 인식, 질의응답의 정답 구간 찾기처럼 문장을 이해해 분류하거나 추출하는 과제에 적합하다.

:::example BERT의 학습 데이터 구성
BERT는 입력 토큰의 15%를 예측 대상으로 고른다. 고른 토큰의 80%는 \`[MASK]\`로, 10%는 무작위로 고른 다른 토큰으로 바꾸고, 10%는 그대로 둔다. 실제로 사용할 때는 입력에 \`[MASK]\`가 없으므로, 가리지 않은 토큰이 맞는지도 판단하도록 학습시키기 위한 구성이다. 분류 과제에서는 문장 맨 앞에 붙인 \`[CLS]\` 토큰의 출력 벡터 위에 분류층을 추가해 미세조정한다. BERT는 왼쪽부터 토큰을 하나씩 생성하는 방식으로 학습하지 않았으므로 긴 글을 생성하는 데는 적합하지 않다.
:::

[[diagram:bert-masking]]

### Decoder-only: GPT

**GPT 계열**은 Decoder-only 구조이며 다음 토큰 예측으로 학습한다. causal mask([[lesson:multi-head-attention]])로 뒤쪽 토큰을 가려, 각 위치는 $x_{<t}$만 보고 $x_t$를 예측한다. 학습 목적함수는 [[lesson:pretraining]]의 손실 $L = -\frac{1}{T}\sum_{t} \log P(x_t \mid x_{<t})$이며, 이 모듈의 사전학습, 스케일링 법칙, 정렬은 모두 Decoder-only 구조를 전제로 한다.

### Encoder-Decoder: T5

**T5**(Text-to-Text Transfer Transformer)는 Encoder-Decoder 구조다. 인코더가 입력 문장을 양방향으로 읽어 표현을 만들고, 디코더는 cross-attention으로 그 표현을 참조하면서 출력을 자기회귀적으로 생성한다. 사전학습에서는 입력의 연속된 구간 몇 개를 특수 토큰으로 바꾸고, 디코더가 가린 구간을 생성하게 한다(span corruption).

T5는 모든 과제를 텍스트를 입력받아 텍스트를 출력하는 형식으로 통일한다. 입력 앞에 \`translate English to German:\`, \`summarize:\`처럼 과제를 지정하는 접두어(prefix)를 붙이고, 분류 결과나 점수도 문자열로 출력한다. 과제마다 출력층을 따로 설계하지 않고 하나의 모델과 하나의 손실함수로 여러 과제를 학습할 수 있다.

\`\`\`image
src: /images/week6/t5-text-to-text.png
alt: 가운데 T5 상자를 중심으로 왼쪽에 네 과제의 입력 문자열(번역, 문법 판정, 문장 유사도, 요약)이, 오른쪽에 각각의 출력 문자열(Das ist gut., not acceptable, 3.8, 요약문)이 이어진 그림
caption: T5는 번역, 문법 판정(CoLA), 문장 유사도(STSB), 요약을 모두 텍스트를 입력받아 텍스트를 출력하는 하나의 형식으로 처리한다. 입력 앞의 접두어(translate English to German:, cola sentence:, stsb sentence1: … sentence2: …, summarize:)가 과제를 지정하고, 분류 결과(not acceptable)와 유사도 점수(3.8)도 문자열로 출력한다. 그래서 하나의 모델과 하나의 손실함수로 모든 과제를 학습할 수 있다.
credit: Raffel et al., "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer" (JMLR 2020), Figure 1, arXiv:1910.10683
width: 1200
height: 411
\`\`\`

### 세 구조의 비교

| 구조 | 대표 모델 | 학습 목표 | 문맥 참조 방향 | 대표 용도 |
| --- | --- | --- | --- | --- |
| Encoder-only | BERT | MLM(가린 토큰 예측) | 양방향 | 분류, 개체명 인식, 문장 임베딩 |
| Decoder-only | GPT 계열 | 다음 토큰 예측 | 단방향(자기회귀) | 대화, 글 생성, 코드 생성 |
| Encoder-Decoder | T5, BART | 가린 구간 생성, 과제를 텍스트 변환으로 통일 | 인코더는 양방향, 디코더는 단방향 | 번역, 요약처럼 입력을 출력으로 변환하는 과제 |

세 구조의 차이는 attention 마스크의 모양으로 정리된다. 같은 Transformer 블록이라도 모든 칸을 열어 두면 BERT처럼 양방향이 되고, 대각선 위를 가리면 GPT처럼 단방향이 된다. Encoder-Decoder의 디코더는 인코더가 읽은 입력 전체와, 출력 중 자기 위치까지의 토큰을 참조한다.

[[diagram:attention-patterns]]

### 대형 LLM이 Decoder-only 구조를 쓰는 이유

최근의 대형 LLM은 대부분 Decoder-only 구조다. 주된 이유는 다음과 같다.

1. **과제와 구조의 일치**: 대화와 글쓰기는 앞의 문맥 다음에 올 텍스트를 차례로 생성하는 과제이므로 자기회귀 생성과 구조가 일치한다. MLM은 가린 자리만 예측하므로 문장을 이어서 생성하는 능력을 직접 학습하지 않는다.
2. **학습 신호의 양**: 다음 토큰 예측에서는 모든 위치가 예측 대상이다. MLM은 고른 15%의 위치에서만 손실을 계산하므로 같은 데이터에서 얻는 학습 신호가 적다.
3. **단순한 구조**: 인코더와 디코더를 나누지 않으므로 구현과 대규모 학습, 추론 최적화가 단순하다. 스케일링 법칙 연구([[lesson:scaling-laws]])도 대부분 Decoder-only 구조로 수행되었다.
4. **프롬프트로 과제 지정**: 큰 Decoder-only 모델은 프롬프트만으로 분류, 번역, 요약을 수행할 수 있어, 과제마다 별도의 모델을 미세조정할 필요가 줄었다.

### 창발 능력과 In-Context Learning

**창발 능력**(emergent ability)은 작은 모델에서는 거의 나타나지 않던 능력이 모델 크기가 특정 규모를 넘으면 나타나는 현상이다(Wei et al., 2022). 여러 자리 수의 덧셈이나 다단계 추론 과제에서 작은 모델의 정확도는 무작위 수준에 머물다가, 특정 규모를 넘으면 급격히 높아진다. 손실이 모델 크기에 따라 매끄럽게 줄어드는 스케일링 법칙과 달리, 개별 과제의 성능은 불연속적으로 나타날 수 있다는 것이다.

이에 대해 불연속성의 상당 부분이 평가 지표의 선택에서 생긴다는 반론이 있다(Schaeffer et al., 2023). 토큰 하나의 정답률 $p$가 모델 크기에 따라 꾸준히 올라도, 토큰 $k$개로 된 답을 모두 맞혀야 1점을 주는 지표의 점수는 $p^k$이므로 작은 모델에서 0 근처에 머물다가 급격히 오른다. 같은 출력을 토큰 단위 정확도처럼 연속적인 지표로 평가하면 성능이 매끄럽게 오르는 경우가 많다.

[[diagram:emergence-metric]]

**In-Context Learning**(문맥 내 학습)은 파라미터를 업데이트하지 않고 프롬프트에 넣은 예시만으로 새로운 과제의 형식을 따르는 능력이다. GPT-3(Brown et al., 2020)에서 모델이 클수록 이 능력이 뚜렷해졌으며, [[lesson:prompt-design]]의 Few-shot 예시가 이 능력을 이용한다.
`,
  checks: [
    {
      key: "c1",
      question: "문장 \"나는 [MASK]를 먹었다\"에서 가린 단어를 앞뒤 문맥을 모두 보고 예측하도록 학습하는 모델은?",
      choices: ["GPT", "BERT", "T5의 디코더", "RNN 언어 모델"],
      answer: 1,
      explanation: "BERT의 MLM은 양방향 문맥을 참조한다. GPT는 앞쪽 문맥만 참조한다.",
    },
    {
      key: "c2",
      question: "T5가 번역, 요약, 분류를 하나의 모델로 처리하는 방법은?",
      choices: ["과제마다 다른 출력층을 붙인다", "모든 과제를 텍스트를 입력받아 텍스트를 출력하는 형식으로 통일하고, 접두어로 과제를 지정한다", "과제마다 다른 모델을 학습한다", "분류 과제만 처리한다"],
      answer: 1,
      explanation: "\"summarize: ...\"를 입력하면 요약문을 출력하고, 분류 과제에서는 라벨 이름을 문자열로 출력한다.",
    },
    {
      key: "c3",
      question: "창발 능력에 대한 설명으로 가장 적절한 것은?",
      choices: ["스케일링 법칙의 손실 곡선도 특정 규모에서 급격히 꺾인다", "특정 과제의 성능이 특정 규모를 넘으면 급격히 높아지는 현상이지만, 일부는 정답과 오답만 구분하는 평가 지표에서 생긴다는 반론이 있다", "작은 모델에서만 나타난다", "미세조정을 해야만 나타난다"],
      answer: 1,
      explanation: "손실은 매끄럽게 줄어도, 답 전체를 맞혀야 점수를 주는 지표로 재면 성능이 계단처럼 보일 수 있다(Schaeffer et al., 2023).",
    },
    {
      key: "c4",
      question: "이메일이 스팸인지 분류하는 모델을 적은 데이터로 미세조정하려 한다. 세 구조 중 전통적으로 가장 많이 쓰인 선택은?",
      choices: ["Encoder-only(BERT)", "Decoder-only(GPT)만 가능하다", "Encoder-Decoder(T5)만 가능하다", "세 구조 모두 분류에는 쓸 수 없다"],
      answer: 0,
      explanation: "분류는 주어진 문장 전체를 이해하는 과제이므로 양방향으로 문맥을 참조하는 BERT 계열이 전통적으로 많이 쓰였다. 큰 Decoder-only 모델도 프롬프트로 분류를 수행할 수 있다.",
    },
    {
      key: "c5",
      question: "GPT와 BERT의 차이를 attention 마스크로 설명한 것은?",
      choices: ["GPT는 대각선 위(뒤쪽 토큰)를 가리고, BERT는 모든 토큰이 서로를 참조한다", "BERT는 대각선 위를 가리고, GPT는 모든 토큰을 참조한다", "둘 다 마스크를 쓰지 않는다", "GPT는 짝수 위치만, BERT는 홀수 위치만 참조한다"],
      answer: 0,
      explanation: "GPT는 다음 토큰 예측을 위해 causal mask로 뒤쪽 토큰을 가리고, BERT는 가린 토큰을 앞뒤 문맥으로 예측하기 위해 모든 토큰을 참조한다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "BERT와 GPT의 학습 목적함수와 attention 마스크를 비교하고, 대화 생성 모델에 BERT식 양방향 마스크를 쓰지 않는 이유를 쓰라.",
      answer: md`
BERT는 입력 토큰의 일부를 가리고 원래 토큰을 예측하는 MLM으로 학습하며, 모든 토큰이 서로를 참조하는 양방향 마스크를 쓴다. GPT는 앞의 토큰만 보고 다음 토큰을 예측하도록 학습하며, 대각선 위(뒤쪽 토큰)를 가리는 causal mask를 쓴다.

생성은 왼쪽부터 토큰을 하나씩 만드는 과정이므로, 다음 토큰을 생성하는 시점에는 그 뒤의 토큰이 존재하지 않는다. 학습할 때 뒤쪽 토큰을 참조할 수 있으면 모델은 예측할 토큰을 입력에서 그대로 읽어 손실을 줄이게 되어, 뒤쪽 토큰이 없는 생성 상황에서 필요한 예측 능력을 학습하지 못한다. 또 MLM은 가린 자리만 예측하므로 문장을 이어서 생성하는 능력을 직접 학습하지 않는다.
`,
      keyPoints: [
        "BERT는 MLM과 양방향 마스크, GPT는 다음 토큰 예측과 causal mask를 쓴다",
        "생성하는 시점에는 뒤쪽 토큰이 존재하지 않는다",
        "학습 때 뒤쪽 토큰을 참조하면 예측할 토큰을 입력에서 읽게 되어 생성에 필요한 예측을 학습하지 못한다",
        "MLM은 가린 자리만 예측하므로 이어서 생성하는 능력을 직접 학습하지 않는다",
      ],
    },
    {
      key: "d2",
      question: "창발 능력이 무엇인지 스케일링 법칙의 손실 곡선과 비교해 설명하고, Schaeffer et al.(2023)의 반론을 평가 지표의 관점에서 쓰라.",
      answer: md`
창발 능력은 작은 모델에서 거의 나타나지 않던 과제 성능이 모델 크기가 특정 규모를 넘으면 급격히 높아지는 현상이다. 스케일링 법칙에서 손실은 모델 크기에 따라 매끄럽게 줄어들지만, 개별 과제의 성능은 불연속적으로 나타날 수 있다는 점이 다르다.

Schaeffer et al.은 이 불연속성의 상당 부분이 평가 지표에서 생긴다고 반론했다. 토큰 하나의 정답률 $p$가 꾸준히 올라도, 토큰 $k$개를 모두 맞혀야 1점을 주는 지표의 점수는 $p^k$이므로 작은 모델에서 0 근처에 머물다가 급격히 오른다. 같은 출력을 토큰 단위 정확도처럼 연속적인 지표로 평가하면 성능이 매끄럽게 오르는 경우가 많다.
`,
      keyPoints: [
        "창발 능력은 특정 규모를 넘으면 과제 성능이 급격히 높아지는 현상이다",
        "스케일링 법칙의 손실은 모델 크기에 따라 매끄럽게 줄어든다",
        "답 전체를 맞혀야 점수를 주는 지표는 성능 변화를 불연속적으로 보이게 한다",
        "연속적인 지표로 평가하면 성능이 매끄럽게 오르는 경우가 많다",
      ],
    },
  ],
  references: [
    { title: "Devlin et al. (2018) — BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", url: "https://arxiv.org/abs/1810.04805", note: "MLM과 BERT를 제안한 논문(영문)" },
    { title: "Jay Alammar — The Illustrated BERT, ELMo, and co.", url: "https://jalammar.github.io/illustrated-bert/", note: "BERT의 사전학습과 미세조정을 그림으로 설명한다(영문)" },
    { title: "Raffel et al. (2020) — Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer (T5)", url: "https://arxiv.org/abs/1910.10683", note: "T5와 text-to-text 형식을 제안한 논문. 그림 1이 본문 그림이다(영문)" },
    { title: "Wei et al. (2022) — Emergent Abilities of Large Language Models", url: "https://arxiv.org/abs/2206.07682", note: "창발 능력을 정의하고 사례를 정리한 논문(영문)" },
    { title: "Schaeffer et al. (2023) — Are Emergent Abilities of Large Language Models a Mirage?", url: "https://arxiv.org/abs/2304.15004", note: "창발 능력이 평가 지표의 선택에서 생길 수 있다는 반론(영문)" },
  ],
});
