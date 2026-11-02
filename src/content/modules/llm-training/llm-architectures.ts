import { defineLesson, md } from "../../kit";
import exercises from "./labs/llm-architectures";

export default defineLesson({
  id: "llm-architectures",
  title: "LLM 구조: BERT, GPT, T5",
  tier: "supplement",
  goal: "BERT(Encoder-only, MLM)·GPT(Decoder-only, 다음 토큰 예측)·T5(Encoder-Decoder, text-to-text)의 차이와 대형 LLM이 Decoder-only로 수렴한 이유를 설명하고, 창발 능력과 그에 대한 반론을 말할 수 있다.",
  why: "",
  body: md`
지금까지 설명한 다음 토큰 예측은 Transformer를 "어떻게 쌓느냐"에 따라 서로 다른 세 갈래의 아키텍처로 갈라진다. 갈래를 가르는 기준은 인코더(encoder)와 디코더(decoder) 중 무엇을 쓰는가, 그리고 문맥을 양방향(bidirectional)으로 보는가 단방향(autoregressive)으로 보는가다.

**BERT**(Bidirectional Encoder Representations from Transformers)는 Encoder-only 구조다. 학습 목적함수도 다음 토큰 예측이 아니라 마스킹된 언어모델링(Masked Language Modeling, MLM)이다. 입력 문장의 토큰 중 일부를 \`[MASK]\`로 가리고, 그 가려진 토큰이 원래 무엇이었는지를 앞뒤 문맥을 모두 보고 맞히도록 학습시킨다. 앞뒤를 동시에 참조할 수 있다는 것이 핵심이다. 문장 "나는 [MASK]를 먹었다"에서 \`[MASK]\`를 맞히려면 앞의 "나는"뿐 아니라 뒤의 "를 먹었다"까지 함께 봐야 하고, BERT의 인코더는 실제로 그렇게 양방향 문맥을 동시에 참조하도록 설계되어 있다. 이 양방향성 덕분에 BERT는 문장을 생성하는 과제보다 문장을 이해해 분류·추출하는 과제(감성 분석, 개체명 인식, 질의응답에서 정답 구간 찾기)에 강하다.

**GPT 계열**은 5주차에서 직접 만든 바로 그 구조다. Decoder-only, 자기회귀적(autoregressive) 학습. 문맥 $x_{<t}$까지만 보고 다음 토큰 $x_t$를 예측하도록 학습하며, 뒤에 올 토큰은 절대 미리 들여다볼 수 없도록 마스킹된 self-attention을 쓴다(5주차에서 다룬 causal mask가 바로 이 장치다). 앞서 정의한 손실 $L = -\dfrac{1}{T}\sum_{t} \log P(x_t \mid x_{<t})$이 바로 이 구조의 학습 목적함수이며, 이번 주에 다루는 사전학습·스케일링·정렬 파이프라인은 모두 이 Decoder-only 구조를 전제로 한 것이다.

**T5**(Text-to-Text Transfer Transformer)는 Encoder-Decoder 구조를 쓴다. 인코더가 입력 문장을 양방향으로 읽어 표현을 만들고, 디코더가 그 표현을 참조하면서 자기회귀적으로 출력을 생성한다. T5의 설계 철학은 이름 그대로 "모든 NLP 태스크를 텍스트-투-텍스트(text-to-text)로 통일한다"는 것이다. 번역이든 요약이든 분류든, 입력 앞에 \`"translate English to Korean: ..."\`, \`"summarize: ..."\`처럼 태스크를 지시하는 접두어(prefix)를 붙이기만 하면 출력은 항상 텍스트 문자열 하나로 나온다. 태스크마다 다른 출력 형식(분류면 클래스 라벨, 회귀면 스칼라 값)을 설계할 필요 없이 하나의 모델·하나의 학습 루프로 다양한 태스크를 다룰 수 있다는 것이 이 통일의 실익이다.

\`\`\`image
src: /images/week6/t5-text-to-text.png
alt: 가운데 T5 상자를 중심으로 왼쪽에 네 과제의 입력 문자열(번역, 문법 판정, 문장 유사도, 요약)이, 오른쪽에 각각의 출력 문자열(Das ist gut., not acceptable, 3.8, 요약문)이 이어진 그림
caption: T5는 번역, 문법 판정(CoLA), 문장 유사도(STSB), 요약을 모두 '텍스트를 넣으면 텍스트가 나오는' 하나의 형식으로 푼다. 입력 앞의 접두어(translate English to German:, cola sentence:, stsb sentence1: … sentence2: …, summarize:)가 어떤 과제인지 알려 주고, 분류 결과(not acceptable)나 유사도 점수(3.8)까지 문자열로 출력한다. 그래서 하나의 모델, 하나의 손실함수로 모든 과제를 학습할 수 있다.
credit: Raffel et al., "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer" (JMLR 2020), Figure 1, arXiv:1910.10683
width: 1200
height: 411
\`\`\`

| 구조 | 대표 모델 | 학습 목표 | 문맥 참조 방향 | 대표 용도 |
| --- | --- | --- | --- | --- |
| Encoder-only | BERT | Masked LM (가려진 토큰 맞히기) | 양방향 | 분류, 개체명 인식, 문장 임베딩 |
| Decoder-only | GPT 계열 | Next-token prediction (다음 토큰 맞히기) | 단방향(자기회귀) | 대화, 자유 생성, 코드 생성 |
| Encoder-Decoder | T5, BART | Text-to-text (모든 태스크를 텍스트 변환으로 통일) | 인코더는 양방향, 디코더는 단방향 | 번역, 요약 등 입력을 출력으로 변환하는 과제 |

[[diagram:attention-patterns]]

세 구조의 차이는 결국 **누가 누구를 볼 수 있는가**, 즉 attention 마스크의 모양 차이다. 같은 Transformer 블록이라도 마스크를 모두 열어 두면 BERT처럼 양방향이 되고, 대각선 위를 가리면 GPT처럼 단방향이 된다.

:::example BERT는 무엇을 어떻게 맞히는가
BERT는 입력 토큰의 약 15%를 골라 맞힐 대상으로 정한다. 고른 토큰 중 80%는 \`[MASK]\`로 바꾸고, 10%는 무작위 다른 토큰으로 바꾸고, 10%는 그대로 둔다. 실제로 쓸 때는 입력에 \`[MASK]\`가 없으니, 학습 때도 "가려지지 않은 토큰이 맞는지"까지 판단하게 만들려는 장치다. 분류 과제에 쓸 때는 문장 맨 앞에 붙인 \`[CLS]\` 토큰의 출력 벡터 위에 작은 분류층을 얹어 미세조정한다. 반대로 BERT는 왼쪽에서 오른쪽으로 한 토큰씩 생성하는 법을 배운 적이 없어 긴 글을 쓰는 데는 맞지 않는다.
:::

[[diagram:bert-masking]]

그렇다면 최근 공개되는 대형 모델 대부분이 왜 하필 Decoder-only로 수렴했을까. 두 가지 이유가 있다. 첫째, 대화형 어시스턴트가 풀어야 하는 과제 자체가 본질적으로 "지금까지의 대화 다음에 무엇이 와야 하는가"를 순차적으로 생성하는 문제라서 자기회귀적 생성과 구조적으로 잘 맞는다. 반면 BERT의 양방향 MLM은 애초에 "생성"이 아니라 "이해"에 최적화된 목적함수다. 둘째, 다음 단계에서 다룰 스케일링 법칙 실험이 대부분 Decoder-only 구조로 수행되었고, 구조가 상대적으로 단순해(인코더-디코더 간 cross-attention 같은 추가 장치가 없어) 같은 파라미터 수에서 학습과 추론 최적화가 더 쉬웠다는 실무적인 이유도 있다.

:::info 창발 능력(Emergent Capability)과 In-Context Learning
모델 크기가 어느 임계값을 넘는 순간 그 이하 크기에서는 거의 발휘되지 않던 능력이 갑자기 나타나는 현상을 창발 능력(emergent capability)이라 부른다. 예를 들어 3자리 수 덧셈이나 다단계 추론 같은 과제는 작은 모델에서는 정확도가 무작위 수준에 머물다가, 파라미터 수가 특정 규모를 넘어서면 정확도가 급격히 뛰어오르는 양상을 보인다. 이는 다음 단계의 스케일링 법칙이 매끄러운 손실 곡선을 그리는 것과는 별개로, 개별 다운스트림 능력은 비선형적으로 나타날 수 있다는 뜻이다. 다만 이 "갑작스러움"의 상당 부분은 정답/오답만 세는 불연속적인 평가 지표 때문에 생긴 착시라는 반론도 있다(Schaeffer et al., 2023). 같은 능력을 부분 점수처럼 연속적인 지표로 재면 성능이 매끄럽게 오르는 경우가 많다.

이런 창발 능력 중 LLM에서 가장 널리 활용되는 것이 문맥 내 학습(In-Context Learning)이다. 파라미터를 단 하나도 업데이트하지 않고, 프롬프트 안에 넣어준 예시 몇 개만으로 새로운 과제 형식을 즉석에서 따라 하는 능력이다. 7주차에서 다룰 Few-shot Prompting이 바로 이 능력을 실전에서 활용하는 기법이며, 이 능력 자체는 모델을 다시 학습시키지 않고도 사전학습 단계에서 이미 파라미터에 내재된 성질이 프롬프트라는 입력을 통해 드러나는 것이다.
:::

[[diagram:emergence-metric]]
`,
  checks: [
    {
      key: "c1",
      question: "문장 \"나는 [MASK]를 먹었다\"에서 가려진 단어를 앞뒤 문맥을 모두 보고 맞히도록 학습하는 모델은?",
      choices: ["GPT", "BERT", "T5의 디코더", "RNN 언어모델"],
      answer: 1,
      explanation: "BERT의 Masked LM은 양방향 문맥을 본다. GPT는 앞쪽 문맥만 본다.",
    },
    {
      key: "c2",
      question: "T5가 번역·요약·분류를 하나의 모델로 처리하는 방법은?",
      choices: ["태스크마다 다른 출력층을 붙인다", "모든 태스크를 \"텍스트를 넣으면 텍스트가 나온다\"는 형식으로 통일하고 접두어로 태스크를 지시한다", "태스크마다 다른 모델을 학습한다", "분류 과제만 처리한다"],
      answer: 1,
      explanation: "예: \"summarize: ...\" → 요약문, 분류도 라벨을 텍스트로 출력한다.",
    },
    {
      key: "c3",
      question: "창발 능력에 대한 설명으로 가장 적절한 것은?",
      choices: ["스케일링 법칙의 손실 곡선도 갑자기 꺾인다", "특정 과제 성능이 규모의 임계점에서 급격히 뛰는 현상이지만, 일부는 정답/오답만 세는 평가 지표 때문에 생긴 착시라는 반론이 있다", "작은 모델에서만 나타난다", "파인튜닝을 해야만 나타난다"],
      answer: 1,
      explanation: "손실은 매끄럽게 줄어도 이산적인 지표로 재면 계단처럼 보일 수 있다(Schaeffer et al., 2023).",
    },
    {
      key: "c4",
      question: "이메일이 스팸인지 아닌지 분류하는 모델을 적은 데이터로 미세조정하려 한다. 세 구조 중 전통적으로 가장 자연스러운 선택은?",
      choices: ["Encoder-only(BERT)", "Decoder-only(GPT)만 가능", "Encoder-Decoder(T5)만 가능", "세 구조 모두 분류에는 쓸 수 없다"],
      answer: 0,
      explanation: "분류는 문장 전체를 이해하는 과제라 양방향으로 문맥을 보는 BERT 계열이 전통적으로 잘 맞는다. 다만 큰 Decoder-only 모델도 프롬프트로 분류를 할 수 있다.",
    },
    {
      key: "c5",
      question: "GPT와 BERT의 차이를 attention 마스크로 설명하면?",
      choices: ["GPT는 대각선 위(미래)를 가리고, BERT는 모든 토큰이 서로를 볼 수 있다", "BERT는 대각선 위를 가리고, GPT는 모든 토큰을 본다", "둘 다 마스크를 쓰지 않는다", "GPT는 짝수 위치만, BERT는 홀수 위치만 본다"],
      answer: 0,
      explanation: "GPT는 다음 토큰 예측을 위해 causal mask로 미래를 가리고, BERT는 가려진 단어를 앞뒤 문맥으로 맞히기 위해 양방향으로 모두 본다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "BERT와 GPT는 둘 다 Transformer 기반이지만 학습 목적함수가 다르다. 각각의 학습 목적함수 이름과, 그로 인해 문맥을 양방향/단방향 중 어느 쪽으로 참조하게 되는지 설명하라.",
      answer: md`
BERT는 문장의 앞뒤 문맥을 모두 보는 양방향(Encoder-only) 구조로, 일부 단어를 가리고 맞히는 Masked Language Modeling으로 학습된다. GPT는 지금까지 나온 토큰만 보고 다음 토큰을 예측하는 단방향(Decoder-only, 자기회귀적) 구조로 학습된다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "T5가 내세우는 '텍스트-투-텍스트' 설계 철학이 실무적으로 어떤 이점을 주는지 설명하라.",
      answer: md`
T5는 분류·번역·요약 등 모든 NLP 태스크를 '텍스트를 입력받아 텍스트를 출력한다'는 하나의 통일된 형식(text-to-text)으로 다뤄, 태스크마다 다른 모델 구조를 설계할 필요 없이 하나의 Encoder-Decoder 구조로 여러 태스크를 처리할 수 있게 한다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "최근 공개되는 대형 LLM 대부분이 BERT형(Encoder-only)이 아니라 GPT형(Decoder-only) 구조로 수렴한 이유 두 가지를 본문 내용에 근거해 설명하라.",
      answer: md`
생성 태스크(다음 텍스트를 이어 쓰는 것)에는 이미 앞쪽 문맥만 보고 다음을 예측하는 Decoder-only 구조가 자연스럽게 맞고, 최근 대규모 스케일링 실험들이 대부분 Decoder-only 구조로 수행되어 이 구조에 대한 최적화 노하우가 가장 많이 쌓여 있기 때문이다.
`,
      keyPoints: [],
    },
    {
      key: "d4",
      question: "창발 능력(emergent capability)이란 무엇이며, 스케일링 법칙이 보여주는 매끄러운 손실 곡선과 어떤 점에서 다른 양상을 보이는가?",
      answer: md`
창발 능력은 모델 크기가 일정 임계값을 넘기 전까지는 거의 나타나지 않다가, 임계값을 넘는 순간 갑자기 눈에 띄게 나타나는 능력을 말한다. 스케일링 법칙이 손실(loss)이 모델 크기에 따라 매끄럽게(연속적으로) 줄어드는 것을 설명하는 것과 달리, 창발 능력은 특정 다운스트림 태스크의 성능이 불연속적으로 뛰어오르는 현상이라는 점에서 다르다. 다만 이 불연속성의 상당 부분은 정답/오답만 세는 평가 지표에서 비롯된 착시라는 반론도 있다(연속적인 지표로 재면 매끄럽게 오르는 경우가 많다).
`,
      keyPoints: [],
    },
    {
      key: "d5",
      question: "\"이 리뷰가 긍정인가?\" 같은 분류에는 BERT식 양방향 마스크가 유리하지만, 대화 생성에는 쓸 수 없는 이유를 attention 마스크와 학습 목적함수로 설명하십시오.",
      answer: md`
분류는 문장 전체가 이미 주어진 상태에서 판단하므로, 각 토큰이 앞뒤 문맥을 모두 보는 양방향 마스크가 정보를 가장 많이 씁니다("재미없지 않았다"처럼 뒤를 봐야 뜻이 정해지는 경우). 생성은 왼쪽부터 한 토큰씩 만들어 가는 과정이라, 다음 토큰을 만들 시점에는 오른쪽 토큰이 아직 존재하지 않습니다. 학습할 때 미래를 보게 하면(양방향) 정답을 베끼는 법만 배우고 실제 생성 상황과 맞지 않습니다. 그래서 생성 모델은 자기와 과거만 보는 causal 마스크와 다음 토큰 예측(CLM)으로 학습하며, MLM은 가린 자리만 맞히는 목적이라 문장을 이어서 만드는 능력을 직접 학습하지 않습니다.
`,
      keyPoints: ["분류는 전체 문장이 주어져 양방향 문맥이 유리", "생성 시점에는 오른쪽 토큰이 존재하지 않는다", "학습 때 미래를 보면 베끼기만 배운다", "생성은 causal 마스크 + 다음 토큰 예측으로 학습"],
    },
  ],
  references: [
    { title: "Jay Alammar — The Illustrated BERT, ELMo, and co.", url: "https://jalammar.github.io/illustrated-bert/", note: "BERT의 사전학습(MLM)과 활용을 그림으로 (영문)" },
    { title: "Raffel et al. (2019) — Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer (T5)", url: "https://arxiv.org/abs/1910.10683", note: "그림 1의 text-to-text 예시만 봐도 충분하다" },
    { title: "Schaeffer et al. (2023) — Are Emergent Abilities of Large Language Models a Mirage?", url: "https://arxiv.org/abs/2304.15004", note: "창발 능력이 평가 지표의 선택에서 생길 수 있다는 반론 (심화)" },
  ],
});
