import { defineLesson, md } from "../../kit";
import exercises from "./labs/embeddings";

export default defineLesson({
  id: "embeddings",
  title: "시퀀스 데이터와 임베딩",
  tier: "core",
  concepts: ["sequences-rnn"],
  goal: "텍스트를 숫자로 바꾸는 절차(전처리, 토큰화, 어휘 사전)를 설명하고, One-hot 표현의 두 한계를 단어 임베딩과 Word2Vec이 어떻게 해결하는지 설명한다.",
  why: "신경망은 숫자만 입력으로 받으므로 텍스트는 먼저 토큰 번호와 벡터로 바뀌어야 한다. RNN([[lesson:rnn]])과 Transformer([[lesson:self-attention]])의 첫 층이 임베딩 층이고, 검색 증강 생성(RAG)의 문서 검색도 임베딩 벡터의 유사도로 동작한다([[lesson:retrieval]]).",
  body: md`
### 순서가 있는 데이터

텍스트는 단어의 순서가 의미를 정한다. "개가 사람을 물었다"와 "사람이 개를 물었다"는 같은 단어 세 개로 이루어져 있지만 서로 다른 사실을 나타낸다. 또 문장마다 길이가 다르다. 따라서 텍스트를 다루는 모델은 순서가 있고 길이가 일정하지 않은 **시퀀스**(sequence)를 입력으로 받을 수 있어야 한다. 완전연결층과 CNN은 입력의 크기가 고정되어 있다고 가정하므로, 시퀀스에는 RNN([[lesson:rnn]])이나 Transformer 같은 구조를 쓴다.

### 텍스트를 숫자로 바꾸는 절차

신경망에 문장을 넣으려면 문자열을 숫자로 바꿔야 한다. 이 절차는 보통 세 단계로 나뉜다.

1. **전처리**(text preprocessing): 대소문자 통일, 특수문자 제거, 공백 정리처럼 텍스트를 다루기 쉬운 형태로 정리한다.
2. **토큰화**(tokenization): 텍스트를 모델이 처리하는 단위(토큰)로 나눈다. 공백이나 형태소 분석기를 기준으로 단어 단위로 나누는 방식이 오랫동안 쓰였고, 현재의 LLM은 BPE 같은 부분단어 토큰화를 쓴다([[lesson:tokenization]]).
3. **어휘 사전**(vocabulary) 구축: 말뭉치(corpus)에 나오는 서로 다른 토큰에 정수 번호를 붙인 대응표를 만든다. 어휘 사전의 크기를 $|V|$로 쓴다.

:::info 사전에 없는 단어와 길이가 다른 문장
- **\`<unk>\` 토큰**: 단어 단위 어휘 사전에는 학습 말뭉치에 나온 단어만 있다. 처음 보는 단어(예: "햄스터")는 보통 \`<unk>\`(unknown)라는 특수 토큰 하나로 바꾸므로, 원래 어떤 단어였는지에 대한 정보가 사라진다. 이를 OOV(Out-Of-Vocabulary) 문제라 하고, 부분단어 토큰화가 이 문제를 줄인다.
- **\`<pad>\` 토큰**: 여러 문장을 배치로 처리하려면 문장의 길이가 같아야 한다. 짧은 문장 뒤에 \`<pad>\` 토큰을 채워 가장 긴 문장과 길이를 맞추고, 모델이 이 위치를 계산에서 제외하도록 마스크로 표시한다.
:::

### One-hot 표현의 한계

토큰을 벡터로 나타내는 가장 단순한 방법은 **One-hot 인코딩**이다. 어휘 사전의 크기가 $|V|$이면 $i$번 토큰을 $i$번째 성분만 1이고 나머지가 0인 벡터 $e_i \in \mathbb{R}^{|V|}$로 나타낸다. 어휘가 {고양이, 강아지, 자동차}이면 "고양이"는 $[1, 0, 0]$, "강아지"는 $[0, 1, 0]$이다. 이 방식에는 두 가지 한계가 있다.

- **차원이 어휘 크기와 같다.** 실제 어휘 사전에는 수만~수십만 개의 토큰이 있으므로, 토큰 하나를 수만 차원 벡터로 나타내야 하고 그 성분은 하나만 빼고 모두 0이다.
- **단어 사이의 유사도를 나타내지 못한다.** 서로 다른 두 One-hot 벡터의 내적은 항상 0이다($e_i \cdot e_j = 0$, $i \neq j$). "고양이"와 "강아지"의 내적도, "고양이"와 "자동차"의 내적도 0이므로, 고양이가 자동차보다 강아지와 의미가 가깝다는 정보를 담을 수 없다. 모든 단어 벡터가 서로 직교하고 거리도 같다.

### 단어 임베딩

**단어 임베딩**(word embedding)은 각 토큰을 $|V|$차원 One-hot 벡터 대신 $d$차원($d \ll |V|$, 보통 수백 차원)의 실수 벡터로 나타내고, 이 벡터를 데이터로 학습한다. 이 대응은 학습 가능한 행렬 $E \in \mathbb{R}^{d \times |V|}$로 나타낼 수 있고, $i$번 토큰의 임베딩은 $v_i = E e_i$, 즉 $E$의 $i$번째 열이다. 학습이 잘 되면 의미가 비슷한 단어의 벡터일수록 코사인 유사도가 크고([[lesson:dot-product]]), $\text{왕} - \text{남자} + \text{여자} \approx \text{여왕}$처럼 벡터의 차이가 단어 사이의 관계를 어느 정도 나타낸다.

[[diagram:onehot-vs-embedding]]

토큰화, 어휘 사전, 임베딩 조회를 코드로 확인한다. 사전에 없는 "햄스터"는 0번 \`<unk>\`로 바뀌고, One-hot 벡터를 곱한 $Ee_i$는 $E$의 $i$번째 열과 같다.

\`\`\`python
import numpy as np

sentences = ["나는 고양이 를 좋아한다", "나는 강아지 를 좋아한다", "나는 자동차 를 샀다"]
tokens = [s.split() for s in sentences]           # ① 토큰화: 공백 기준

vocab = {"<unk>": 0}                               # ② 어휘 사전: 0번은 사전에 없는 토큰
for sent in tokens:
    for tok in sent:
        if tok not in vocab:
            vocab[tok] = len(vocab)
print("어휘 사전:", vocab)

def encode(sentence):
    return [vocab.get(tok, 0) for tok in sentence.split()]   # 사전에 없는 단어는 0

print("인코딩:", encode("나는 고양이 를 좋아한다"), encode("나는 햄스터 를 좋아한다"))   # [1, 2, 3, 4] [1, 0, 3, 4]

V, d = len(vocab), 3                               # ③ 임베딩 행렬과 One-hot
rng = np.random.default_rng(0)
E = rng.normal(size=(d, V))                        # (d × |V|), 실제로는 학습으로 정한다
i = vocab["고양이"]
e_i = np.zeros(V)
e_i[i] = 1
print(np.allclose(E @ e_i, E[:, i]))               # True: 행렬곱 결과가 i번째 열과 같다
\`\`\`

마지막 줄의 결과는 수만 차원 One-hot 벡터를 만들어 곱할 필요 없이, 정수 번호 $i$로 $E$의 열 하나를 가져오면(lookup) 된다는 뜻이다. PyTorch의 \`nn.Embedding\`이 이렇게 동작한다.

[[diagram:text-to-ids]]

어휘가 $|V| = 50{,}000$, 임베딩 차원이 $d = 300$이면 One-hot 표현은 토큰 하나가 50,000차원 벡터이고 그중 49,999개가 0이다. 임베딩을 쓰면 토큰 하나가 300차원 벡터가 되는 대신, 임베딩 행렬 $E$에 학습할 값이 $300 \times 50{,}000 = 1{,}500$만 개 생긴다.

### Word2Vec

**Word2Vec**은 비슷한 문맥에 나오는 단어는 의미도 비슷하다는 **분포 가설**(distributional hypothesis)에 따라, 사람이 붙인 라벨 없이 텍스트만으로 임베딩을 학습하는 자기지도학습(self-supervised learning) 방법이다. 그중 **Skip-gram**은 문장의 한 단어(중심 단어)로 그 주변의 단어(문맥 단어)를 예측하도록 학습한다. 윈도우 크기가 1이면 "나는 오늘 고양이를 보았다"에서 중심 단어 "고양이를"의 문맥 단어는 "오늘"과 "보았다"다. 중심 단어의 임베딩 $v_c$와 각 단어의 출력용 임베딩 $u_w$의 내적으로 문맥 단어일 확률을 계산하고,

$$P(w \mid c) = \frac{\exp(u_w \cdot v_c)}{\sum_{w' \in V} \exp(u_{w'} \cdot v_c)}$$

실제로 관측된 문맥 단어의 확률이 커지도록 $v_c$와 $u_w$를 경사하강법으로 갱신한다. 함께 자주 나오는 단어 쌍일수록 내적이 커지도록 학습되므로, 비슷한 문맥에 나오는 단어들의 벡터가 비슷한 방향을 갖게 된다. 반대로 문맥 단어들로 중심 단어를 예측하는 방식을 **CBOW**라 한다.

같은 문장에서 윈도우 크기 1로 (중심 단어, 문맥 단어) 쌍을 만들면 다음과 같다.

| 중심 단어 | 문맥 단어 |
| --- | --- |
| 나는 | 오늘 |
| 오늘 | 나는, 고양이를 |
| 고양이를 | 오늘, 보았다 |
| 보았다 | 고양이를 |

모두 6쌍이다. 사람이 라벨을 붙이지 않아도 문장만으로 입력과 정답의 쌍이 만들어지므로 자기지도학습이라 한다. 말뭉치가 수십억 단어이면 이런 쌍도 수십억 개가 만들어진다.

[[diagram:skipgram-window]]

Word2Vec으로 학습한 벡터에는 실제로 단어 사이의 관계가 나타난다.

\`\`\`image
src: /images/week5/word2vec-country-capital.png
alt: 나라 이름(China, Russia, Japan, Turkey, Poland, Germany, France, Italy, Greece, Spain, Portugal)이 왼쪽에, 각 나라의 수도가 오른쪽에 놓이고, 나라에서 수도로 향하는 점선 화살표들이 거의 평행하게 그려진 2차원 산점도
caption: Skip-gram으로 학습한 1000차원 단어 벡터에서 나라와 수도만 골라 PCA로 2차원에 투영했다. 학습 중에 수도가 무엇인지 알려 주지 않았는데도 나라에서 수도로 향하는 화살표들의 방향과 길이가 거의 같다. 나라와 수도의 관계가 벡터 공간에서 일정한 방향으로 나타난 것이다. 그래서 Madrid − Spain + France에 가장 가까운 벡터는 Paris다.
credit: Mikolov et al., "Distributed Representations of Words and Phrases and their Compositionality" (NeurIPS 2013), Figure 2, arXiv:1310.4546
width: 600
height: 420
\`\`\`

학습된 임베딩은 RNN과 Transformer를 포함한 신경망 기반 NLP 모델의 입력층으로 쓰였다. 현재의 Transformer는 Word2Vec처럼 임베딩을 따로 미리 학습하기보다, 임베딩 층을 모델의 다른 층과 함께 학습하는 경우가 많다.
`,
  checks: [
    {
      key: "c1",
      question: "어휘 크기가 $|V| = 50{,}000$일 때 One-hot 표현에서 서로 다른 두 단어 벡터의 내적은?",
      choices: ["항상 0", "항상 1", "두 단어의 의미가 비슷할수록 크다", "$50{}000$"],
      answer: 0,
      explanation: "One-hot 벡터는 서로 다른 자리에만 1이 있으므로 내적이 항상 0이다. 그래서 두 단어가 비슷하다는 정보를 담을 수 없다.",
    },
    {
      key: "c2",
      question: "임베딩 행렬 $E \\in \\mathbb{R}^{d \\times |V|}$에 One-hot 벡터 $e_i$를 곱한 $Ee_i$는?",
      choices: ["$E$의 $i$번째 행", "$E$의 $i$번째 열", "$E$의 모든 열의 평균", "길이 $|V|$인 벡터"],
      answer: 1,
      explanation: "$e_i$는 $i$번째 성분만 1이므로 $Ee_i$는 $E$의 $i$번째 열과 같다. 실제 구현은 곱셈 대신 인덱싱(lookup)으로 처리한다.",
    },
    {
      key: "c3",
      question: "Word2Vec Skip-gram이 학습하는 과제는?",
      choices: ["문맥 단어들로 중심 단어를 예측한다", "중심 단어로 주변 문맥 단어를 예측한다", "문장의 감정을 분류한다", "다음 문장을 생성한다"],
      answer: 1,
      explanation: "Skip-gram은 중심 단어로 문맥 단어를 예측하고, CBOW는 그 반대 방향으로 예측한다. 둘 다 라벨 없이 텍스트만으로 학습하는 자기지도학습이다.",
    },
    {
      key: "c4",
      question: "어휘 크기 $|V| = 10{,}000$, 임베딩 차원 $d = 300$인 임베딩 행렬 $E$의 학습 파라미터 수는?",
      choices: ["300만 개", "1만 개", "300개", "1억 개"],
      answer: 0,
      explanation: "$E \\in \\mathbb{R}^{d \\times |V|}$이므로 $300 \\times 10{,}000 = 3{,}000{,}000$개다. 단어마다 숫자 300개를 학습한다.",
    },
    {
      key: "c5",
      question: "단어 단위 토크나이저가 어휘 사전에 없는 단어를 만났을 때 보통 하는 일과 그 결과는?",
      choices: ["`<unk>` 토큰으로 바꾸며, 원래 어떤 단어였는지에 대한 정보가 사라진다", "새 번호를 붙여 사전에 추가한다", "가장 비슷한 단어로 자동 교정한다", "문장 전체를 버린다"],
      answer: 0,
      explanation: "학습된 모델의 어휘 사전은 고정되어 있어 새 번호를 붙일 수 없다. 그래서 `<unk>` 하나로 바꾸며, 이 정보 손실(OOV 문제)을 줄이려고 BPE 같은 부분단어 토큰화를 쓴다.",
    },
    {
      key: "c6",
      question: "\"나는 오늘 고양이를 보았다\"에서 윈도우 크기 1로 Skip-gram의 (중심 단어, 문맥 단어) 쌍을 만들면 모두 몇 쌍인가?",
      choices: ["6쌍", "4쌍", "8쌍", "3쌍"],
      answer: 0,
      explanation: "양 끝의 두 단어는 이웃이 하나씩이라 2쌍, 가운데 두 단어는 이웃이 둘씩이라 4쌍이므로 $2 + 4 = 6$쌍이다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "One-hot 인코딩의 두 가지 한계를 쓰고, 단어 임베딩이 각각을 어떻게 해결하는지 쓰라. 임베딩 행렬 $E$와 One-hot 벡터 $e_i$의 곱 $Ee_i$가 무엇인지도 쓰라.",
      answer: md`
One-hot 인코딩은 벡터의 차원이 어휘 크기 $|V|$와 같아 수만 차원이 되고, 서로 다른 두 단어 벡터의 내적이 항상 0이어서 단어 사이의 유사도를 나타내지 못한다. 단어 임베딩은 $d \ll |V|$인 $d$차원 실수 벡터로 토큰을 나타내 차원을 줄이고, 이 벡터를 데이터로 학습해 의미가 비슷한 단어의 벡터가 서로 가깝도록(코사인 유사도가 크도록) 만든다.

$Ee_i$는 $E$의 $i$번째 열, 즉 $i$번 토큰의 임베딩 벡터다. 그래서 실제 구현은 One-hot 벡터를 곱하지 않고 정수 번호로 $E$의 열을 가져온다(lookup).
`,
      keyPoints: [
        "One-hot은 차원이 어휘 크기 $|V|$와 같다",
        "서로 다른 One-hot 벡터의 내적은 항상 0이라 유사도를 나타내지 못한다",
        "임베딩은 $d \\ll |V|$인 실수 벡터를 학습해 비슷한 단어를 가깝게 놓는다",
        "$Ee_i$는 $E$의 $i$번째 열이다(lookup)",
      ],
    },
    {
      key: "d2",
      question: "Word2Vec의 Skip-gram이 무엇으로 무엇을 예측하도록 학습하는지 쓰고, 학습이 끝나면 의미가 비슷한 단어의 벡터가 서로 가까워지는 이유를 분포 가설로 쓰라.",
      answer: md`
Skip-gram은 중심 단어로 윈도우 안의 문맥 단어를 예측하도록 학습한다. 문맥 단어일 확률은 중심 단어의 임베딩 $v_c$와 단어의 출력용 임베딩 $u_w$의 내적에 softmax를 적용해 계산하고, 관측된 문맥 단어의 확률이 커지도록 두 임베딩을 갱신한다.

함께 자주 나오는 단어 쌍일수록 내적이 커지도록 학습되므로, 비슷한 문맥에 나오는 두 단어는 같은 문맥 단어들과의 내적이 모두 커지는 방향으로 갱신되어 벡터의 방향이 비슷해진다. 비슷한 문맥에 나오는 단어는 의미도 비슷하다는 분포 가설에 따라, 의미가 비슷한 단어의 벡터가 서로 가까워진다.
`,
      keyPoints: [
        "중심 단어로 주변 문맥 단어를 예측한다",
        "문맥 단어일 확률은 내적에 softmax를 적용해 계산한다",
        "함께 나오는 단어 쌍의 내적이 커지도록 학습된다",
        "비슷한 문맥의 단어는 벡터의 방향이 비슷해진다(분포 가설)",
      ],
    },
  ],
  references: [
    { title: "Jay Alammar — The Illustrated Word2vec", url: "https://jalammar.github.io/illustrated-word2vec/", note: "임베딩·Skip-gram·negative sampling을 그림으로 (영문)" },
    { title: "Mikolov et al. (2013) — Efficient Estimation of Word Representations in Vector Space", url: "https://arxiv.org/abs/1301.3781", note: "Word2Vec 원 논문: 1~3절에 모델 구조가 있다 (영문)" },
  ],
});
