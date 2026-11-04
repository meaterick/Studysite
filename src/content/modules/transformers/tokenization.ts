import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/tokenization";

export default defineLesson({
  id: "tokenization",
  title: "토큰화, 서브워드, 토큰 임베딩, 위치 정보",
  tier: "core",
  concepts: ["tokenization"],
  goal: "BPE가 가장 자주 나오는 쌍을 반복해서 병합해 어휘를 만드는 과정을 직접 계산하고 OOV 완화·한국어 토큰 수·철자 세기 약점과의 관계를 설명하며, 토큰 임베딩에 사인파 위치 인코딩을 더해 Transformer의 입력을 만든다.",
  why: "LLM의 입력과 출력은 모두 토큰 단위이므로 API 비용과 문맥 창의 길이도 토큰 수로 정해진다. 토큰화 방식을 알아야 한국어 사용 비용이 큰 이유와 철자 세기 같은 과제에서 LLM이 틀리는 이유를 설명할 수 있고, 토큰 임베딩과 위치 정보는 Transformer 입력층의 구성 요소다([[lesson:transformer-block]]).",
  body: md`
### 토큰화와 BPE

LLM은 문장을 **토큰**(token) 단위로 나누고 토큰마다 정수 번호를 붙여 처리한다. 문장을 토큰으로 나누는 규칙을 **토크나이저**(tokenizer)라 하며, 현재 대부분의 LLM은 **BPE**(Byte-Pair Encoding)를 쓴다. 단어 단위 토큰화([[lesson:embeddings]])는 사전에 없는 단어(OOV)를 처리하지 못하고, 활용형과 오탈자까지 담으려면 어휘 사전이 지나치게 커진다. BPE는 자주 쓰이는 부분단어(subword)는 토큰 하나로, 드문 조합은 더 작은 조각으로 나눠 이 문제를 줄인다.

BPE는 말뭉치의 모든 단어를 글자 단위로 나눈 상태에서 시작해, 가장 자주 붙어 나오는 조각 쌍을 하나로 합치는 병합을 정해진 횟수만큼 반복한다. 그림은 "low", "lower", "lowest"가 글자 단위에서 시작해 자주 나오는 쌍부터 병합되어 "low"가 토큰 하나가 되는 과정이다.

[[diagram:tokenizer-bpe]]

아래 코드는 작은 말뭉치로 BPE의 병합 규칙을 학습한다. \`Counter\`는 항목별 등장 횟수를 세는 딕셔너리이고, \`most_common(1)\`은 가장 많이 나온 항목 하나를 \`[(항목, 횟수)]\`로 돌려준다.

\`\`\`python
from collections import Counter

def train_bpe(words, n_merges):
    # 단어를 "글자 + 단어 끝 표시(</w>)"로 나눈다. 예: "low" -> ['l', 'o', 'w', '</w>']
    corpus = [list(w) + ["</w>"] for w in words]
    merges = []
    for _ in range(n_merges):
        pairs = Counter()
        for tokens in corpus:
            for i in range(len(tokens) - 1):
                pairs[(tokens[i], tokens[i + 1])] += 1   # 인접한 조각 쌍의 빈도
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]                # 가장 자주 나온 쌍
        merges.append(best)
        merged_corpus = []
        for tokens in corpus:
            merged, i = [], 0
            while i < len(tokens):
                if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == best:
                    merged.append(tokens[i] + tokens[i + 1])   # 두 조각을 하나로 합친다
                    i += 2
                else:
                    merged.append(tokens[i])
                    i += 1
            merged_corpus.append(merged)
        corpus = merged_corpus
    return merges, corpus

words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]
merges, corpus = train_bpe(words, n_merges=8)
for step, (a, b) in enumerate(merges, 1):
    print(f"{step}번째 병합: {a!r} + {b!r} -> {a + b!r}")

seen = set()
for w, tokens in zip(words, corpus):
    if w not in seen:
        print(w, "->", tokens)
        seen.add(w)

vocab = {tok: idx for idx, tok in enumerate(sorted({t for tokens in corpus for t in tokens}))}
print(f"어휘 사전 크기 |V| = {len(vocab)}")   # 토큰 -> 정수 번호
\`\`\`

첫 병합은 \`'w' + 'e'\`다. "newer"와 "newest"에 공통으로 들어 있는 "we"가 이 말뭉치에서 가장 자주 붙어 나오는 쌍이기 때문이다. 두 번 나온 "low"는 6번째와 7번째 병합을 거쳐 \`['low</w>']\` 한 조각이 되지만, "lower"는 \`['lo', 'wer</w>']\`, "lowest"는 \`['lo', 'wes', 't', '</w>']\`로 나뉜다. 단어 끝 표시 \`</w>\`는 단어 끝의 조각과 단어 안의 같은 글자열을 구별하고, 토큰을 다시 이어 붙일 때 단어 경계를 복원하는 데 쓰인다.

### 학습한 규칙으로 새 단어 토큰화하기

BPE의 학습 결과는 **순서가 있는 병합 규칙의 목록**이다. 새 단어는 글자로 나눈 뒤, 학습할 때 생긴 순서대로 규칙을 적용해 토큰화한다.

\`\`\`python
merges = [("w", "e"), ("l", "o"), ("we", "r"), ("wer", "</w>"),
          ("n", "e"), ("lo", "w"), ("low", "</w>"), ("we", "s")]   # 위에서 학습한 규칙(순서대로)

def merge_pair(tokens, pair):
    out, i = [], 0
    while i < len(tokens):
        if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == pair:
            out.append(tokens[i] + tokens[i + 1]); i += 2
        else:
            out.append(tokens[i]); i += 1
    return out

def encode(word):
    tokens = list(word) + ["</w>"]
    for pair in merges:                # 학습한 순서대로 병합을 적용한다
        tokens = merge_pair(tokens, pair)
    return tokens

for w in ["lower", "slow", "slower", "renew", "west"]:
    print(f"{w:6s} -> {encode(w)}")
\`\`\`

학습 말뭉치에 없던 "slow", "slower", "west"도 \`<unk>\` 없이 이미 아는 조각의 조합으로 표현된다. 아는 조각이 거의 없는 "renew"는 글자 단위에 가깝게 나뉜다. 어떤 단어든 최소한 글자 단위로는 나눌 수 있으므로 OOV가 크게 줄어든다.

:::info 바이트 수준 BPE
학습 때 나오지 않은 글자(이모지, 드문 한자 등)도 처리하려고, GPT-2 이후 대부분의 LLM은 글자 대신 **바이트**에서 시작하는 바이트 수준(byte-level) BPE를 쓴다. 모든 텍스트는 UTF-8로 인코딩하면 0~255의 바이트 열이 되므로, 기본 어휘 256개로 어떤 문자열이든 표현할 수 있다. 한글 한 글자 "안"은 UTF-8로 3바이트다. 그 위에 병합 규칙을 쌓으므로 어휘 크기는 "256 + 병합 횟수"(+ 특수 토큰 몇 개)다.
:::

[[diagram:bpe-segmentation]]

### 토큰화가 만드는 현상

BPE의 병합 규칙은 학습 말뭉치의 빈도를 반영하므로, LLM을 쓸 때 다음과 같은 현상이 나타난다.

- **한국어는 영어보다 토큰 수가 많다.** 토크나이저의 학습 데이터가 영어 중심이고, 한국어는 조사와 어미가 붙는 교착어라 같은 내용이 더 많은 토큰으로 나뉜다. 바이트 수준 BPE에서 병합이 덜 된 한글 글자는 한 글자가 여러 토큰이 되기도 한다. API 비용은 토큰 수에 비례하므로 비용이 커지고, 같은 문맥 창에 담을 수 있는 내용은 줄어든다.
- **철자 세기와 자릿수 계산에 약하다.** 모델은 "strawberry"를 글자 열이 아니라 "straw", "berry" 같은 토큰으로 입력받아 토큰 안의 글자 구성을 직접 보지 못한다. 그래서 "strawberry에 r이 몇 개인가?" 같은 질문이나 여러 자리 숫자의 계산에서 틀리기 쉽다.
- **드문 단어는 여러 조각으로 나뉜다.** 실제 토크나이저(예: tiktoken의 cl100k_base, 병합 약 10만 개)도 본문 코드와 같은 알고리즘을 대규모 텍스트에 적용해 만든 것이다.

아래 코드는 실제 토크나이저로 토큰 수를 비교한다. tiktoken은 브라우저 실행 환경에 없으므로 Colab에서 실행한다.

\`\`\`python-colab
# !pip install tiktoken
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
for s in ["Hello world", "안녕하세요 반갑습니다", "strawberry", "12345 + 67890"]:
    ids = enc.encode(s)
    print(s, len(ids), [enc.decode([i]) for i in ids])
\`\`\`

### 토큰 임베딩

토큰 번호는 임베딩 행렬 $E \in \mathbb{R}^{|V| \times d_{model}}$에서 그 번호의 행을 가져와 $d_{model}$차원 벡터로 바꾼다. [[lesson:embeddings]]에서는 $E$를 $d \times |V|$로 두고 열을 가져왔지만, PyTorch의 \`nn.Embedding\`처럼 $|V| \times d$로 두고 행을 가져오는 것과 같은 계산이다. GPT-2 small은 $|V| = 50{,}257$, $d_{model} = 768$이므로 임베딩 행렬에만 파라미터가 약 3,860만 개 있다.

### 위치 정보

Transformer는 문장의 모든 토큰을 self-attention으로 한 번에 처리한다([[lesson:self-attention]]). self-attention은 토큰 벡터 사이의 내적으로 계산하므로, 위치 정보를 넣지 않으면 같은 토큰은 문장의 어느 자리에 있어도 같은 방식으로 처리된다. 이 성질은 [[lesson:transformer-block]]에서 코드로 확인한다. 그래서 위치 $p$의 토큰 $t_p$를 입력할 때 토큰 임베딩에 위치마다 다른 **위치 벡터**를 더한다.

$$x_p = E[t_p] + PE(p)$$

원 논문(Vaswani et al., 2017)의 **사인파 위치 인코딩**은 위치 $p$의 $2i$번째와 $2i+1$번째 성분을 다음과 같이 정한다.

$$PE(p)_{2i} = \sin\!\left(\frac{p}{10000^{2i/d}}\right), \qquad PE(p)_{2i+1} = \cos\!\left(\frac{p}{10000^{2i/d}}\right)$$

성분 번호 $i$가 커질수록 분모가 커져 파동의 주기가 길어진다. 주기가 다른 사인파 여러 개의 값을 함께 쓰므로 위치마다 다른 벡터가 된다. 위치 $p = 1$의 첫 두 성분($i = 0$)은 $\sin 1 \approx 0.841$, $\cos 1 \approx 0.540$이고, $p = 2$는 $\sin 2 \approx 0.909$, $\cos 2 \approx -0.416$이다.

[[diagram:positional-waves]]

\`\`\`python
import numpy as np

def sinusoidal_pe(n, d):
    pos = np.arange(n)[:, None]              # (n, 1): 위치 0, 1, 2, ...
    i = np.arange(0, d, 2)[None, :]          # (1, d/2): 짝수 성분 번호 0, 2, 4, ...
    angle = pos / 10000 ** (i / d)
    pe = np.zeros((n, d))
    pe[:, 0::2], pe[:, 1::2] = np.sin(angle), np.cos(angle)
    return pe

rng = np.random.default_rng(0)
V, d = 10, 8
E = rng.normal(size=(V, d))                  # 토큰 임베딩 행렬 (|V| × d)
ids = np.array([3, 7, 3])                    # 같은 토큰 3이 위치 0과 2에 있다
x = E[ids] + sinusoidal_pe(len(ids), d)      # 토큰 임베딩 + 위치 벡터
print(sinusoidal_pe(3, d)[:, :4].round(3))
print(np.allclose(E[ids][0], E[ids][2]), np.allclose(x[0], x[2]))   # True False
\`\`\`

같은 토큰 3의 임베딩은 위치 0과 2에서 같지만(\`True\`), 위치 벡터를 더한 입력은 서로 다르다(\`False\`). 위치 0의 첫 네 성분이 $[0, 1, 0, 1]$인 것은 $\sin 0 = 0$, $\cos 0 = 1$이기 때문이다. 사인파 인코딩 대신 위치마다 벡터를 학습하는 방식(학습된 위치 임베딩, GPT-2)이나, 두 토큰 사이의 상대 거리를 attention 계산에 반영하는 RoPE(현재 대부분의 LLM)도 쓴다. 학습한 길이보다 긴 입력으로 확장하는 문제는 [[lesson:position-extrapolation]]에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "BPE 학습의 한 단계에서 하는 일은?",
      choices: ["가장 드문 글자를 삭제한다", "말뭉치에서 가장 자주 붙어 나오는 조각 쌍을 하나로 합친다", "단어를 공백 기준으로 자른다", "모든 단어를 소문자로 바꾼다"],
      answer: 1,
      explanation: "이 병합을 정해진 횟수만큼 반복한 기록이 토크나이저의 병합 규칙(merges)이다.",
    },
    {
      key: "c2",
      question: "학습 데이터에 없던 단어 \"slow\"가 `['s', 'low</w>']`로 토큰화된 것이 보여 주는 것은?",
      choices: ["BPE는 새 단어를 처리하지 못한다", "학습된 조각을 재사용해 처음 보는 단어도 처리한다(OOV 완화)", "\"slow\"가 어휘 사전에 있었다", "글자 단위 토큰화와 같다"],
      answer: 1,
      explanation: "자주 나온 조각은 크게, 처음 보는 조합은 작게 나뉜다. 새 단어는 학습한 순서대로 병합 규칙을 적용해 토큰화한다.",
    },
    {
      key: "c3",
      question: "LLM이 \"strawberry에 r이 몇 개인가?\"에 자주 틀리는 이유와 가장 관련 있는 것은?",
      choices: ["모델이 영어를 모르기 때문에", "모델은 글자 대신 여러 글자가 합쳐진 토큰 단위로 입력을 받기 때문에", "r이 특수문자라서", "문장이 너무 길어서"],
      answer: 1,
      explanation: "토큰 안의 글자 구성은 모델에 직접 입력되지 않는다. 여러 자리 숫자의 계산에 약한 이유의 일부도 같다.",
    },
    {
      key: "c4",
      question: "바이트 수준 BPE가 기본 어휘 256개에서 시작해 병합을 50,000번 했다면 어휘 크기는 약 얼마인가?",
      choices: ["50,256개", "50,000개", "256개", "100,000개"],
      answer: 0,
      explanation: "병합 한 번마다 새 토큰이 하나 생기므로 $256 + 50{,}000 = 50{,}256$개다. GPT-2의 어휘 크기 50,257은 여기에 특수 토큰 하나를 더한 값이다.",
    },
    {
      key: "c5",
      question: "BPE 학습에서 각 단어 끝에 `</w>`를 붙이는 이유는?",
      choices: [
        "단어 수를 세기 위해",
        "\"low\"의 끝 w와 \"wide\"의 첫 w처럼 단어 끝 조각과 단어 안 조각을 구별하기 위해",
        "토큰 수를 줄이기 위해",
        "대문자를 표시하기 위해",
      ],
      answer: 1,
      explanation: "경계 표시가 없으면 단어 끝에서만 쓰이는 조각(예: 'est</w>')과 단어 중간의 같은 글자열을 구별할 수 없고, 토큰을 다시 이어 붙일 때 단어 경계도 복원할 수 없다.",
    },
    {
      key: "c6",
      question: "사인파 위치 인코딩에서 위치 $p = 0$인 벡터의 첫 네 성분은?",
      choices: ["$[0, 1, 0, 1]$", "$[0, 0, 0, 0]$", "$[1, 0, 1, 0]$", "$[1, 1, 1, 1]$"],
      answer: 0,
      explanation: "짝수 성분은 $\\sin(0) = 0$, 홀수 성분은 $\\cos(0) = 1$이다. 위치가 바뀌면 성분마다 다른 주기로 값이 바뀌어 위치마다 다른 벡터가 된다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
from collections import Counter
words = ["low", "low", "lower"]
corpus = [list(w) + ["</w>"] for w in words]
pairs = Counter((t[i], t[i + 1]) for t in corpus for i in range(len(t) - 1))
print(pairs.most_common(2))
print(len(pairs))
`,
      expected: "[(('l', 'o'), 3), (('o', 'w'), 3)]\n6",
      explanation: "인접 쌍은 (l,o)와 (o,w)가 세 단어 모두에서 3번, (w,</w>)가 2번, (w,e)·(e,r)·(r,</w>)가 1번씩으로 모두 6종류다. 빈도가 같으면 먼저 나온 쌍이 앞에 온다. BPE는 다음 단계에서 (l,o)를 'lo'로 병합한다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "같은 내용의 한국어 문장이 영어 문장보다 토큰 수가 많은 이유를 BPE의 학습 방식으로 쓰고, 이것이 비용과 문맥 창에 주는 영향을 쓰라.",
      answer: md`
BPE의 병합 규칙은 토크나이저 학습 말뭉치에서 자주 나온 조각 쌍부터 만들어진다. 학습 말뭉치가 영어 중심이면 영어 단어는 단어 전체가 토큰 하나가 되는 경우가 많지만, 한국어 조각은 병합이 덜 되어 더 작은 단위로 나뉜다. 또 한국어는 조사와 어미가 붙는 교착어라 같은 의미를 나타내는 형태가 다양해 같은 조각이 반복되는 빈도가 낮다. 바이트 수준 BPE에서는 병합이 덜 된 한글 한 글자가 여러 토큰이 되기도 한다.

API 비용은 토큰 수에 비례하므로 같은 내용이라도 한국어의 비용이 크고, 문맥 창의 크기도 토큰 수로 정해지므로 한 번에 넣을 수 있는 내용이 줄어든다.
`,
      keyPoints: [
        "병합 규칙은 학습 말뭉치에서 자주 나온 쌍부터 만들어진다",
        "영어 중심 말뭉치에서는 한국어 조각의 병합이 덜 된다",
        "같은 내용에 토큰이 많아 비용이 크다",
        "문맥 창에 담을 수 있는 내용이 줄어든다",
      ],
    },
    {
      key: "d2",
      question: "Transformer의 입력에 위치 벡터를 더하는 이유를 쓰고, 사인파 위치 인코딩이 위치마다 다른 벡터를 만드는 방법을 식으로 쓰라.",
      answer: md`
self-attention은 토큰 벡터 사이의 내적으로 계산하므로, 위치 정보가 없으면 같은 토큰은 문장의 어느 자리에 있어도 같은 방식으로 처리되어 단어의 순서를 구별할 수 없다. 그래서 토큰 임베딩에 위치마다 다른 벡터를 더해 $x_p = E[t_p] + PE(p)$를 입력으로 쓴다.

사인파 위치 인코딩은 $PE(p)_{2i} = \sin(p/10000^{2i/d})$, $PE(p)_{2i+1} = \cos(p/10000^{2i/d})$로 정한다. 성분 번호 $i$마다 주기가 다른 사인파를 쓰므로 여러 성분의 값의 조합이 위치마다 다르다. 주기가 짧은 성분은 가까운 위치를, 주기가 긴 성분은 멀리 떨어진 위치를 구별한다.
`,
      keyPoints: [
        "위치 정보가 없으면 같은 토큰은 자리와 관계없이 같은 방식으로 처리된다",
        "입력은 $x_p = E[t_p] + PE(p)$",
        "$PE(p)_{2i} = \\sin(p/10000^{2i/d})$, $PE(p)_{2i+1} = \\cos(p/10000^{2i/d})$",
        "성분마다 주기가 달라 값의 조합이 위치마다 다르다",
      ],
    },
  ],
  references: [
    { title: "Sennrich et al. (2016) — Neural Machine Translation of Rare Words with Subword Units", url: "https://arxiv.org/abs/1508.07909", note: "BPE를 NLP에 도입한 논문: 알고리즘 1이 본문 코드와 같다 (영문)" },
    { title: "Vaswani et al. (2017) — Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", note: "3.5절: 사인파 위치 인코딩 (영문)" },
    { title: "Karpathy — Let's build the GPT Tokenizer", url: "https://www.youtube.com/watch?v=zduSFxRajkE", note: "바이트 수준 BPE를 처음부터 구현하는 영상 (영문)" },
    { title: "Tiktokenizer", url: "https://tiktokenizer.vercel.app/", note: "문장을 넣으면 GPT 토크나이저의 토큰 경계를 보여 주는 웹 도구 (영문)" },
  ],
});
