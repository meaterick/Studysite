import type { WeekMeta } from "../types";
import sections from "../sections/week5";

const week5: WeekMeta = {
  slug: "week-5",
  number: 5,
  phase: "Phase 3 · 현대 AI",
  title: "Transformer와 Attention",
  subtitle: "시퀀스/NLP 기초, RNN·LSTM·GRU, Seq2Seq, 임베딩, Self-Attention, QKV, 멀티헤드, 위치 인코딩, 토크나이저(BPE)",
  difficulty: 5,
  keywords: [
    "One-hot Encoding",
    "Word2Vec",
    "RNN",
    "BPTT",
    "LSTM",
    "GRU",
    "Seq2Seq",
    "Teacher Forcing",
    "임베딩",
    "Self-Attention",
    "QKV",
    "멀티헤드",
    "위치 인코딩",
    "BPE",
    "Causal Mask",
  ],
  objectives: [
    "One-hot 인코딩의 한계와 Word Embedding·Word2Vec이 이를 해결하는 원리를 설명한다.",
    "RNN의 재귀 구조($h_t = f(Wx_t+Uh_{t-1}+b)$)와 BPTT에서 기울기 소실이 발생하는 이유를 수식으로 설명한다.",
    "LSTM의 forget/input/output 게이트와 GRU의 게이트 구조 차이를 비교하고, 게이트가 장기 의존성 문제를 완화하는 원리를 설명한다.",
    "Seq2Seq의 Encoder-Decoder 구조와 Teacher Forcing을 설명하고, 고정 크기 문맥 벡터의 병목 문제가 왜 Attention의 등장으로 이어졌는지 논증한다.",
    "Scaled Dot-Product Attention을 수식·코드·그림으로 설명하고 shape을 추적한다.",
    "RNN·Seq2Seq의 한계와 Transformer가 이를 해결한 방식을 비교한다.",
    "$QK^\\top$, softmax, $\\sqrt{d_k}$ 스케일링이 각각 왜 필요한지 밑바닥부터(고등학생도 이해할 수준으로) 설명한다.",
    "Causal mask 기반 GPT형 디코더 블록의 전체 구조를 백지에 그린다.",
    "BPE 토크나이저가 LLM 동작(비용·한계)에 미치는 영향을 설명한다.",
  ],
  learningOrder: [
    "Chris Olah [Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) — RNN·LSTM·GRU 직관 (섹션 2~3 전후)",
    "영상: 3Blue1Brown [Attention in transformers, visually explained](https://www.3blue1brown.com/lessons/attention) (약 25분) — 섹션 5 전에 직관을 예열",
    "Jay Alammar [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)",
    "Vaswani et al. [Attention Is All You Need](https://arxiv.org/abs/1706.03762) — 3장 정독 (과제 5번)",
    "Karpathy [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) (약 2시간, 따라 코딩) 및 [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE)",
    "[Stanford CS224n](https://web.stanford.edu/class/cs224n/) 강의: RNN·LSTM·Seq2Seq & Attention, Self-Attention & Transformers",
  ],
  conceptsMd: `
이번 주는 8주 스터디 전체를 통틀어 별 다섯 개, 가장 가파른 고비다. 그런데 겁먹을 필요는 없다 — Self-Attention이라는 연산 자체는 사실 한 문장으로 정의할 수 있다. "각 토큰의 Query 벡터와 문장 내 모든 토큰의 Key 벡터 사이의 내적을 스케일링한 뒤 softmax를 취해 가중치를 얻고, 이 가중치로 모든 토큰의 Value 벡터를 가중합해 해당 토큰의 새로운 표현을 만드는 연산이다." 이번 주 내내 할 일은 이 정의를 수식으로, 코드로, 그림으로, 그리고 손으로 계산한 숫자로 네 번 반복해서 뜯어보는 것뿐이다. 네 번째쯤 되면 처음에 낯설던 $QK^\\top$이라는 기호가 손에 붙어 있을 것이다.

다만 그 정의로 곧장 뛰어들기 전에, 먼저 그 정의가 왜 필요해졌는지를 순서대로 짚고 넘어가자 — NLP가 다루는 시퀀스 데이터의 특성과 텍스트를 숫자로 바꾸는 절차(One-hot, Word Embedding)부터, 시퀀스를 순서대로 처리하는 RNN과 그 한계, 이를 게이트로 보완한 LSTM·GRU, 그리고 Encoder-Decoder 구조인 Seq2Seq가 부딪힌 정보 병목까지다. 이 역사적 맥락을 알고 나면 Self-Attention의 $QK^\\top$이 그냥 뜬금없이 등장한 수식이 아니라, "RNN이 못 푼 문제를 풀기 위한 구체적인 답"이라는 것이 훨씬 선명하게 보인다.

:::info 이번 주의 흐름
섹션 1~4는 Self-Attention이 **왜** 필요해졌는지의 역사다 — 텍스트를 벡터로 바꾸는 임베딩, 순서대로 읽는 RNN과 기울기 소실, 게이트로 이를 완화한 LSTM·GRU, 그리고 고정 크기 문맥 벡터의 병목과 Attention의 등장. 섹션 5~7에서 Self-Attention·멀티헤드·causal mask·위치 인코딩으로 GPT형 디코더 블록을 완성하고, 섹션 8~9에서 토크나이저(BPE)와 생성 시의 KV 캐시·RoPE를 다룬다. 모든 실습은 NumPy로 브라우저에서 바로 실행되며, PyTorch 코드만 Colab에서 실행한다.
:::

## 시퀀스 데이터와 단어 임베딩 {#sequence-embedding}

자연어처리(NLP, Natural Language Processing)가 다루는 데이터는 이미지나 정형 테이블 데이터와 근본적으로 다른 성질을 하나 갖는다 — 순서(order)가 의미를 결정한다는 것이다. "개가 사람을 물었다"와 "사람이 개를 물었다"는 정확히 같은 단어 세 개로 이루어져 있지만 순서가 다르다는 이유만으로 정반대의 사실을 서술한다. 게다가 문장의 길이는 문장마다 다르다 — 어떤 문장은 세 단어, 어떤 문장은 서른 단어다. 즉 NLP 모델은 순서가 있고 길이가 가변적인 시퀀스(sequence)를 입력으로 받아 처리할 수 있어야 한다. 지금까지 다룬 완전연결층이나 CNN은 입력 크기가 고정되어 있다는 전제를 깔고 있었으므로, 이번 주에는 그 전제를 깨는 새로운 구조들을 다룬다.

신경망은 숫자만 받아들이므로, 문장을 신경망에 넣으려면 먼저 문자열을 숫자로 바꾸는 절차를 거쳐야 한다. 이 절차는 보통 세 단계로 나뉜다. ① Text Preprocessing(전처리): 대소문자 통일, 특수문자·구두점 제거, 불필요한 공백 정리 등 텍스트를 다루기 좋은 형태로 정제하는 단계. ② Tokenization(토큰화): 정제된 텍스트를 의미를 가진 최소 단위(토큰)로 잘라내는 단계 — 오늘날 GPT 계열이 쓰는 BPE(섹션 8에서 다시 다룬다)가 자리잡기 전에는 공백이나 형태소 분석기를 기준으로 자르는 단어 단위(word-level) 토큰화가 표준이었다. ③ Vocabulary(어휘 사전) 구축: 말뭉치(corpus) 전체에 등장하는 서로 다른 토큰을 전부 모아 "토큰 $\\to$ 정수 인덱스" 대응표를 만드는 단계. 이렇게 만들어진 어휘 사전의 크기를 흔히 $|V|$로 쓴다.

이제 각 토큰을 실제 숫자 벡터로 표현할 차례다. 가장 단순한 방법은 One-hot Encoding이다. 어휘 사전 크기가 $|V|$일 때, $i$번째 토큰은 길이 $|V|$짜리 벡터에서 $i$번째 성분만 1이고 나머지는 전부 0인 벡터 $e_i \\in \\mathbb{R}^{|V|}$로 표현한다. 예컨대 어휘가 {고양이, 강아지, 자동차} 세 개뿐이라면 "고양이"는 $[1,0,0]$, "강아지"는 $[0,1,0]$이다. 이 방식은 구현이 간단하다는 것 말고는 두 가지 뚜렷한 한계를 갖는다. 첫째, 벡터의 차원이 어휘 크기 $|V|$와 정확히 같다 — 실제 언어모델의 어휘 사전은 보통 수만~수십만 개의 토큰을 담고 있으므로, 토큰 하나를 표현하는 데만 수만 차원짜리 벡터가 필요해진다(차원의 저주). 둘째, 서로 다른 임의의 두 One-hot 벡터를 내적하면 항상 0이 나온다($e_i \\cdot e_j = 0,\\ i \\neq j$) — 즉 "고양이"와 "강아지"의 내적도, "고양이"와 "자동차"의 내적도 똑같이 0이라서, 이 표현 방식 자체에는 "고양이가 자동차보다 강아지와 더 비슷하다"는 의미적 유사도를 담을 방법이 전혀 없다. 모든 단어가 서로 정확히 등거리에, 정확히 직교한 채로 놓여 있는 셈이다.

### Word Embedding과 Word2Vec — 저차원 밀집 벡터로 의미 담기

One-hot 인코딩의 두 한계, 즉 지나치게 큰 차원과 유사도 표현 불가능을 동시에 해결하는 방법이 Word Embedding이다. 아이디어는 각 토큰을 $|V|$차원의 희소(sparse)한 One-hot 벡터 대신, 그보다 훨씬 작은 $d$차원(보통 수백 차원, $d \\ll |V|$)의 밀집(dense) 실수 벡터로 표현하되, 이 벡터를 무작위로 정하는 것이 아니라 데이터로부터 학습한다는 것이다. 이 매핑은 학습 가능한 행렬 $E \\in \\mathbb{R}^{d \\times |V|}$ 하나로 표현할 수 있고, $i$번째 토큰의 임베딩 벡터는 $v_i = E e_i$, 즉 $E$의 $i$번째 열을 그대로 꺼내오는 것과 같다. 학습이 잘 되면 의미가 비슷한 단어일수록 이 $d$차원 공간에서 서로 가까운 위치(작은 유클리드 거리, 또는 1주차에서 다룬 큰 코사인 유사도)에 놓이도록, 그리고 $\\text{왕} - \\text{남자} + \\text{여자} \\approx \\text{여왕}$처럼 벡터 연산이 의미 관계를 어느 정도 반영하도록 벡터들이 배치된다.

이 임베딩을 학습하는 대표적인 방법이 Word2Vec이다. Word2Vec은 "비슷한 문맥에서 등장하는 단어는 비슷한 의미를 가진다"는 분포 가설(distributional hypothesis)에 기반해, 사람이 붙인 정답 레이블 없이 텍스트 자체만으로 임베딩을 학습하는 자기지도학습(self-supervised learning) 방식이다. 그중 Skip-gram 방식은 문장 중앙의 한 단어(중심 단어, center word)를 보고 그 주변 몇 칸 이내에 등장하는 단어(문맥 단어, context word)를 예측하도록 학습한다 — 예컨대 "나는 [고양이를] 정말 좋아한다"에서 중심 단어 "고양이를"이 주어지면, 윈도우 크기 2 기준으로 "나는", "정말"이 문맥 단어로 예측 대상이 된다. 구체적으로는 중심 단어 임베딩 $v_c$와 각 어휘 단어의 별도 임베딩 $u_w$ 사이의 내적을 softmax에 통과시켜 $P(w \\mid c) = \\dfrac{\\exp(u_w \\cdot v_c)}{\\sum_{w' \\in V} \\exp(u_{w'} \\cdot v_c)}$로 문맥 단어일 확률을 구하고, 실제 관측된 문맥 단어의 확률이 커지는 방향으로 $v_c$와 $u_w$를 경사하강법으로 갱신한다. 이 과정을 말뭉치 전체에 대해 반복하면 "함께 자주 등장하는 단어일수록 내적이 커야 한다"는 압력이 누적되고, 그 결과 의미가 비슷한 단어들의 벡터가 서로 가까운 방향을 향하게 된다. (반대로 문맥 단어들로부터 중심 단어를 예측하는 CBOW 방식도 있는데, 예측 방향만 반대일 뿐 같은 분포 가설에 기반한다.) 이렇게 학습된 임베딩은 이후 딥러닝 기반 NLP 모델(RNN, Transformer 포함)의 입력층으로 쓰이는 표준 재료가 되었다 — Transformer의 임베딩 층도 원리상 이 아이디어의 연장선에 있으며, 다만 오늘날에는 Word2Vec처럼 별도로 미리 학습해두기보다 모델 전체와 함께 한 번에 학습하는 경우가 많다.

[[practice]]

### 실습 — One-hot의 한계와 "문맥으로 배우는" 임베딩

Word2Vec을 제대로 학습하려면 큰 말뭉치와 시간이 필요하다. 대신 같은 분포 가설을 선형대수로 구현하는 고전적 방법 — 단어끼리 **같은 문장에 함께 나온 횟수**를 세고, 그 행렬을 SVD로 저차원으로 압축하기 — 로 임베딩을 만들어보자. Word2Vec(Skip-gram)이 사실상 이런 동시 등장 통계를 압축하는 것과 깊이 연결되어 있다는 사실도 알려져 있다(Levy & Goldberg, 2014).

\`\`\`python
import numpy as np

# 조사를 뺀 아주 작은 말뭉치: 동물 문장과 탈것 문장
corpus = [
    "고양이 생선 먹는다", "강아지 고기 먹는다", "고양이 우유 마신다", "강아지 물 마신다",
    "고양이 소파 잔다", "강아지 마당 잔다", "고양이 강아지 동물", "강아지 귀엽다", "고양이 귀엽다",
    "자동차 도로 달린다", "버스 도로 달린다", "자동차 기름 넣는다", "버스 기름 넣는다",
    "자동차 버스 탈것", "버스 정류장 선다", "자동차 주차장 선다",
    "고양이 자동차 위 잔다",   # 두 무리를 잇는 문장 하나
]
sents = [s.split() for s in corpus]
vocab = sorted({w for s in sents for w in s})
idx = {w: i for i, w in enumerate(vocab)}
V = len(vocab)

# 1) One-hot: 서로 다른 단어의 내적은 언제나 0 — 유사도를 담을 수 없다
onehot = np.eye(V)
print("|V| =", V)
print("one-hot  고양이·강아지 =", onehot[idx["고양이"]] @ onehot[idx["강아지"]],
      "/ 고양이·자동차 =", onehot[idx["고양이"]] @ onehot[idx["자동차"]])

# 2) 같은 문장(윈도우) 안에서 함께 나온 횟수를 센다 — "문맥이 비슷하면 의미도 비슷하다"
C = np.zeros((V, V))
for s in sents:
    for i, w in enumerate(s):
        for j, c in enumerate(s):
            if i != j:
                C[idx[w], idx[c]] += 1

# 3) SVD로 |V|차원 → d=2차원 밀집 벡터로 압축 (Word2Vec과 목적은 같고, 방법만 선형대수)
U, S, Vt = np.linalg.svd(C)
d = 3
E = U[:, :d] * S[:d]
def cos(a, b):
    va, vb = E[idx[a]], E[idx[b]]
    return va @ vb / (np.linalg.norm(va) * np.linalg.norm(vb))

print(f"\\n임베딩 차원: {V} → {d}")
for a, b in [("고양이", "강아지"), ("자동차", "버스"), ("고양이", "자동차"), ("강아지", "버스")]:
    print(f"cos({a}, {b}) = {cos(a, b):+.2f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** One-hot에서는 고양이·강아지, 고양이·자동차의 내적이 모두 0이다. 3차원 임베딩에서는 고양이·강아지의 코사인 유사도가 약 0.93, 자동차·버스가 약 0.92로 높고, 동물과 탈것 사이는 훨씬 낮다(고양이·자동차는 두 무리를 잇는 문장 하나 때문에 0.32 정도). 사람이 "비슷하다"고 알려준 적이 없는데, 함께 나오는 단어(먹는다, 도로, 기름 …)가 비슷하다는 사실만으로 유사도가 생겼다. **해볼 것:** \`"고양이 자동차 위 잔다"\` 문장을 지우면 고양이·자동차의 코사인이 어떻게 바뀌는가? 강아지와 버스 문장을 몇 개 더 추가해 보자.
:::

## RNN과 BPTT: 순서대로 읽기와 기울기 소실 {#rnn-bptt}

시퀀스를 다루는 가장 자연스러운 방법은, 토큰을 한 번에 하나씩 순서대로 읽으면서 "지금까지 읽은 내용"을 어떤 벡터 하나에 계속 누적해나가는 것이다. 이 아이디어를 구현한 구조가 RNN(Recurrent Neural Network, 순환 신경망)이다. RNN은 매 시점 $t$마다 그 시점의 입력 $x_t$와 바로 이전 시점의 은닉 상태(hidden state) $h_{t-1}$을 함께 받아, 새로운 은닉 상태 $h_t$를 만들어낸다.

\`\`\`math
h_t = f(Wx_t + Uh_{t-1} + b)
\`\`\`

여기서 $f$는 보통 $\\tanh$나 시그모이드 같은 비선형 활성함수이고, $W$는 입력 $x_t$에 곱해지는 가중치 행렬, $U$는 이전 은닉 상태 $h_{t-1}$에 곱해지는 가중치 행렬이다. 핵심은 모든 시점 $t$에서 같은 $W$, $U$, $b$를 그대로 재사용(파라미터 공유)한다는 것이다 — 그래서 "순환(recurrent)"이라는 이름이 붙는다. 초기 은닉 상태 $h_0$는 보통 0벡터로 시작하고, 문장 끝까지 이 재귀적 갱신을 반복한 뒤 마지막 은닉 상태 $h_T$(또는 매 시점의 $h_t$ 전체)를 다음 단계(분류층, 디코더 등)의 입력으로 사용한다.

이 구조는 가변 길이 시퀀스를 고정된 크기의 파라미터($W$, $U$, $b$)만으로 처리할 수 있다는 점에서 One-hot이나 고정 크기 입력의 한계를 넘어서지만, 결정적인 약점이 하나 있다. $h_t$ 하나에 지금까지 읽은 모든 정보를 압축해 넣어야 하므로, 시퀀스가 길어질수록 먼 과거 시점의 정보가 매 스텝 새로운 정보와 뒤섞이며 점점 희석된다 — 이를 장기 의존성(long-term dependency) 문제라 부른다. 예컨대 "그 카페에서 처음 만난 [고양이]는 … (백 단어 생략) … 그 아이는 지금도 그 자리에 앉아 있다"처럼 문장 앞부분의 "고양이"라는 정보가 백 번의 갱신을 거쳐 뒤쪽 "그 아이"를 해석하는 데까지 살아남아야 하는데, RNN의 은닉 상태는 매 스텝 새 정보로 계속 덮어써지기 때문에 이런 장거리 의존관계를 안정적으로 유지하기가 구조적으로 어렵다. 이 문제가 왜 생기는지는 아래 BPTT에서 수식으로 직접 확인한다.

\`\`\`image
src: /images/week5/rnn-unrolled.png
alt: RNN을 시간축으로 펼친(unrolled) 다이어그램 — 왼쪽이 압축 표기, 오른쪽이 각 시점 t별로 펼친 표기
caption: 왼쪽의 순환 구조를 시간축을 따라 오른쪽처럼 펼치면, 같은 가중치(그림의 U, W, V)가 매 시점마다 반복 적용되며 은닉 상태가 앞 시점에서 뒷 시점으로 전달되는 모습이 드러난다.
credit: fdeloche, CC BY-SA 4.0, Wikimedia Commons
width: 1200
height: 400
\`\`\`

### BPTT와 기울기 소실·폭발 — 시간축으로 펼쳐 역전파하기

RNN을 학습시키려면 이 재귀 구조에도 역전파를 적용해야 하는데, 이를 특별히 BPTT(Backpropagation Through Time)라 부른다. 아이디어 자체는 3주차에서 다룬 일반적인 역전파와 다르지 않다 — 위 그림의 오른쪽처럼 순환 구조를 시간축을 따라 $T$개의 시점으로 완전히 펼쳐서(unroll), 마치 $T$개의 층을 가진 아주 깊은 순전파 신경망인 것처럼 취급한 뒤, 손실 $L$에서 출발해 각 시점의 파라미터까지 연쇄법칙으로 기울기를 거꾸로 흘려보낸다. 다만 모든 시점이 같은 $W$, $U$를 공유하므로, 최종 기울기는 각 시점에서 계산된 기울기를 전부 더한 것이 된다.

문제는 이 펼친 구조를 따라 기울기가 흘러가는 경로의 길이다. $t$번째 은닉 상태에 대한 기울기가 $t-1$번째까지 전달되려면 $\\dfrac{\\partial h_t}{\\partial h_{t-1}}$이라는 야코비안(대략 $U$에 활성함수의 미분이 곱해진 형태)을 거쳐야 하고, 손실이 발생한 마지막 시점 $T$에서 훨씬 앞선 시점 $k$까지 기울기를 전달하려면 이 야코비안을 $T-k$번 연속으로 곱해야 한다.

\`\`\`math
\\dfrac{\\partial L}{\\partial h_k} = \\dfrac{\\partial L}{\\partial h_T}\\prod_{t=k+1}^{T}\\dfrac{\\partial h_t}{\\partial h_{t-1}}
\`\`\`

3주차에서 이미 확인했듯이, 여러 항을 연달아 곱하면 각 항이 1보다 살짝 작기만 해도 곱이 거듭될수록 전체 값은 지수적으로 0에 가까워진다(기울기 소실). RNN에서는 바로 이 곱셈이 시퀀스 길이만큼, 즉 $T-k$번이나 반복된다는 점이 특히 치명적이다 — 문장이 백 토큰이면 야코비안을 백 번 곱하는 셈이므로, 각 항의 크기가 조금만 1보다 작아도 결과는 사실상 0이 되어 먼 과거 시점 $h_k$는 손실에 사실상 아무 영향도 주지 못하는 것처럼 취급된다(이것이 앞서 말한 장기 의존성 문제의 정체다). 반대로 각 항이 1보다 살짝 크기만 해도 곱은 지수적으로 발산한다(기울기 폭발) — 실무에서는 기울기 폭발 쪽은 기울기 클리핑(gradient clipping, 기울기의 크기가 일정 임계값을 넘으면 그 임계값으로 잘라내는 기법)으로 비교적 쉽게 억누르지만, 기울기 소실은 "이미 0에 가까워진 신호를 다시 키울 방법이 없다"는 점에서 훨씬 근본적인 문제로 남는다.

[[practice]]

### 실습 — 파라미터 공유와 기울기 소실·폭발을 숫자로 보기

은닉 차원 16짜리 RNN을 만들고, 시점 $T$의 기울기가 $k$까지 거슬러 갈 때 곱해지는 야코비안 곱 $\\prod \\partial h_t / \\partial h_{t-1}$의 크기(스펙트럼 노름: 기울기가 최대 몇 배로 커지거나 줄어드는가)를 거리별로 재본다. $U$는 모든 특잇값이 같은 값(배율)이 되도록 만들었다.

\`\`\`python
import numpy as np
rng = np.random.default_rng(0)
d_in, d_h = 4, 16

def orthogonal(n, scale):
    Q, _ = np.linalg.qr(rng.normal(size=(n, n)))
    return scale * Q                      # 모든 특잇값이 scale인 행렬

W = rng.normal(0, 0.5, (d_h, d_in))
b = np.zeros(d_h)

def run_rnn(xs, U):
    """h_t = tanh(W x_t + U h_{t-1} + b) — 모든 시점에서 같은 W, U, b를 재사용한다"""
    h = np.zeros(d_h); hs = []
    for x in xs:
        h = np.tanh(W @ x + U @ h + b)
        hs.append(h)
    return hs

# 1) 파라미터 공유: 길이가 3이든 50이든 같은 W, U, b로 처리된다
U = orthogonal(d_h, 0.9)
for T in [3, 50]:
    hs = run_rnn(rng.normal(size=(T, d_in)), U)
    print(f"길이 {T:2d} → 은닉 상태 {len(hs)}개, 각 shape {hs[-1].shape}, 파라미터 수 {W.size + U.size + b.size}")

# 2) BPTT: ∂h_T/∂h_k = Π_{t=k+1..T} diag(1 - h_t²) U  의 크기를 거리 T-k에 따라 재본다
def jacobian_norm(U, T=60):
    hs = run_rnn(rng.normal(size=(T, d_in)), U)
    J = np.eye(d_h); norms = []
    for t in range(T - 1, 0, -1):              # 뒤에서부터 야코비안을 하나씩 곱해 나간다
        J = J @ (np.diag(1 - hs[t] ** 2) @ U)
        norms.append(np.linalg.norm(J, 2))     # 거리 T-t 만큼 떨어진 시점으로 전달되는 기울기의 최대 배율
    return norms

print("\\n거리(T-k)   U 배율 0.9     U 배율 1.0     U 배율 2.5")
n09, n10, n25 = jacobian_norm(orthogonal(d_h, 0.9)), jacobian_norm(orthogonal(d_h, 1.0)), jacobian_norm(orthogonal(d_h, 2.5))
for dist in [1, 5, 10, 20, 40]:
    print(f"{dist:8d}   {n09[dist-1]:12.2e}   {n10[dist-1]:12.2e}   {n25[dist-1]:12.2e}")

# 3) 기울기 클리핑: 크기가 임계값을 넘으면 방향은 그대로 두고 크기만 줄인다
g = rng.normal(size=d_h) * 1e3
clip = 5.0
g_clipped = g * min(1.0, clip / np.linalg.norm(g))
print(f"\\n클리핑 전 |g| = {np.linalg.norm(g):.1f}, 후 |g| = {np.linalg.norm(g_clipped):.1f}, "
      f"방향 코사인 = {g @ g_clipped / (np.linalg.norm(g) * np.linalg.norm(g_clipped)):.3f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 길이 3이든 50이든 파라미터 수는 336개로 같다 — 이것이 파라미터 공유다. 배율 0.9에서는 거리 40에서 약 $10^{-8}$ 수준으로 기울기가 사라지고, 배율 2.5에서는 거리가 멀수록 오히려 $10^{3}$ 수준까지 커진다(폭발). 눈여겨볼 곳은 **배율 1.0**이다. $U$ 자체는 크기를 바꾸지 않는데도 기울기가 사라지는데, 매 스텝 곱해지는 $\\tanh$의 미분 $1-h_t^2$가 1 이하이기 때문이다. 클리핑은 기울기의 크기만 5로 줄이고 방향(코사인 1.000)은 그대로 둔다. **생각해볼 것:** 폭발은 클리핑으로 막을 수 있는데, 소실은 왜 같은 방법으로 되살릴 수 없을까?
:::

## LSTM과 GRU: 게이트로 기억을 통제하다 {#lstm-gru}

LSTM(Long Short-Term Memory)은 RNN의 장기 의존성 문제를 완화하기 위해 고안된 구조로, 핵심 아이디어는 은닉 상태와 별개로 셀 상태(cell state) $c_t$라는 "장기 기억용 컨베이어 벨트"를 하나 더 두고, 이 벨트에 무엇을 지우고 무엇을 새로 쓸지를 게이트(gate)라는 별도의 작은 신경망들이 결정하게 하는 것이다. 각 게이트는 시그모이드 $\\sigma$를 거쳐 0~1 사이의 값을 내놓는 벡터로, 이 값이 "얼마나 통과시킬지"를 성분별로 정하는 스위치 역할을 한다. LSTM은 세 개의 게이트를 쓴다.

\`\`\`math
f_t = \\sigma(W_f x_t + U_f h_{t-1} + b_f)
\`\`\`
\`\`\`math
i_t = \\sigma(W_i x_t + U_i h_{t-1} + b_i)
\`\`\`
\`\`\`math
\\tilde{c}_t = \\tanh(W_c x_t + U_c h_{t-1} + b_c)
\`\`\`
\`\`\`math
c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t
\`\`\`
\`\`\`math
o_t = \\sigma(W_o x_t + U_o h_{t-1} + b_o), \\qquad h_t = o_t \\odot \\tanh(c_t)
\`\`\`

Forget gate $f_t$는 "이전 셀 상태 $c_{t-1}$ 중 얼마를 계속 기억할지"를 정한다 — $f_t$의 어떤 성분이 0에 가까우면 그 성분에 해당하는 과거 기억은 지워지고, 1에 가까우면 그대로 유지된다. Input gate $i_t$는 "지금 입력에서 만들어진 새 후보 정보 $\\tilde{c}_t$ 중 얼마를 새로 써넣을지"를 정한다. 이 둘을 합쳐 새 셀 상태 $c_t$는 "옛 기억을 얼마나 지우고(forget), 새 정보를 얼마나 더할지(input)"를 성분별로 독립적으로 조절한 결과가 된다. 마지막으로 Output gate $o_t$는 "지금 갱신된 셀 상태 $c_t$ 중 얼마를 이번 시점의 은닉 상태(다음 층이나 다음 시점에 보여줄 출력) $h_t$로 내보낼지"를 정한다. 즉 셀 상태 $c_t$는 내부적으로 계속 유지·갱신되는 장기 기억이고, 은닉 상태 $h_t$는 그중 지금 당장 밖으로 내보일 부분만 걸러낸 결과라는 역할 분담이다.

이 구조가 장기 의존성에 유리한 이유는 $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$라는 갱신식 자체에 있다. RNN의 $h_t = f(Wh_{t-1} + \\cdots)$처럼 매 스텝 행렬을 곱하고 비선형함수를 통과시키는 대신, LSTM의 셀 상태는 이전 값에 (성분별) 곱셈과 덧셈만을 거친다. forget gate $f_t$가 1에 가까운 값을 유지하도록 학습되면 $c_{t-1}$의 정보는 거의 그대로 $c_t$에 전달되고, 역전파 시 이 경로를 타고 흐르는 기울기도 매 스텝 작은 값을 반복해서 곱하는 대신 거의 손실 없이 먼 과거까지 전달될 수 있다 — BPTT에서 문제가 됐던 "지수적으로 작아지는 곱셈의 반복"을, 곱셈이 아닌 덧셈 위주의 경로 하나를 별도로 마련해 우회하는 셈이다.

\`\`\`image
src: /images/week5/lstm-cell.png
alt: LSTM 셀 내부 구조도 — forget/input/output 게이트와 셀 상태, 은닉 상태의 흐름
caption: 가로로 관통하는 윗줄이 셀 상태 c_t의 컨베이어 벨트다. 시그모이드(σ) 게이트들이 이 벨트에 무엇을 지우고(forget) 더할지(input), 그리고 무엇을 밖으로 내보낼지(output)를 결정한다.
credit: fdeloche, CC BY-SA 4.0, Wikimedia Commons (C. Olah, "Understanding LSTM Networks"의 도식에서 착안)
width: 1200
height: 533
\`\`\`

GRU(Gated Recurrent Unit)는 LSTM보다 게이트 수를 줄인 간소화 버전이다. 셀 상태와 은닉 상태를 하나로 합치고, forget/input 두 게이트를 업데이트 게이트(update gate) $z_t$ 하나로 통합해 "옛 상태를 얼마나 유지할지"와 "새 후보를 얼마나 받아들일지"를 $1-z_t$와 $z_t$라는 하나의 대응 관계로 묶는다. 여기에 리셋 게이트(reset gate) $r_t$가 추가로 "이전 은닉 상태를 새 후보 계산에 얼마나 반영할지"를 조절한다.

\`\`\`math
z_t = \\sigma(W_z x_t + U_z h_{t-1}), \\qquad r_t = \\sigma(W_r x_t + U_r h_{t-1})
\`\`\`
\`\`\`math
\\tilde{h}_t = \\tanh(W_h x_t + U_h(r_t \\odot h_{t-1})), \\qquad h_t = (1-z_t)\\odot h_{t-1} + z_t \\odot \\tilde{h}_t
\`\`\`

LSTM과 비교하면 GRU는 게이트가 3개에서 2개로, 상태가 2개($c_t$, $h_t$)에서 1개($h_t$)로 줄어 학습할 파라미터 수가 더 적다 — 그만큼 학습이 빠르고 데이터가 적을 때 과적합에 덜 취약하다는 실용적 이점이 있는 반면, 셀 상태를 별도로 유지하는 LSTM 쪽이 아주 긴 시퀀스에서는 표현력 면에서 약간 더 유리하다고 보고되기도 한다. 실무에서는 두 구조의 성능 차이가 태스크에 따라 엇갈리는 경우가 많아, 파라미터 수와 학습 속도를 고려해 GRU를 기본값으로 먼저 시도해보는 경우가 흔하다.

[[practice]]

### 실습 — forget gate가 1에 가까우면 기억이 살아남는다

같은 입력 40스텝을 RNN과 LSTM에 넣고, **첫 시점의 상태를 아주 조금(eps) 바꿨을 때 40스텝 뒤의 상태가 얼마나 따라 바뀌는지**를 잰다. 이 비율이 곧 먼 과거까지 전달되는 기울기의 크기다. LSTM은 forget gate의 편향(forget bias)을 바꿔가며 비교한다.

\`\`\`python
import numpy as np
rng = np.random.default_rng(0)
d_in, d_h, T = 4, 16, 40
sigmoid = lambda z: 1 / (1 + np.exp(-z))

def init(scale=0.3):
    return rng.normal(0, scale, (d_h, d_in)), rng.normal(0, scale, (d_h, d_h))

# RNN 파라미터와 LSTM 게이트 4세트(forget, input, 후보, output)
W, U = init()
Wf, Uf = init(); Wi, Ui = init(); Wc, Uc = init(); Wo, Uo = init()
xs = rng.normal(size=(T, d_in))

def rnn(h0):
    h = h0
    for x in xs:
        h = np.tanh(W @ x + U @ h)
    return h

def lstm(c0, forget_bias):
    h, c = np.zeros(d_h), c0
    fs = []
    for x in xs:
        f = sigmoid(Wf @ x + Uf @ h + forget_bias)   # forget gate: 옛 기억을 얼마나 남길까
        i = sigmoid(Wi @ x + Ui @ h)                 # input gate: 새 후보를 얼마나 쓸까
        c_tilde = np.tanh(Wc @ x + Uc @ h)           # 새 후보 정보
        c = f * c + i * c_tilde                      # 곱셈 한 번 + 덧셈 — 행렬곱·tanh를 거치지 않는다
        o = sigmoid(Wo @ x + Uo @ h)                 # output gate: 무엇을 밖으로 내보낼까
        h = o * np.tanh(c)
        fs.append(f.mean())
    return c, np.mean(fs)

# 첫 시점의 기억을 아주 조금(eps) 바꿨을 때, 40스텝 뒤의 상태가 얼마나 따라 바뀌는가?
# = 기울기가 40스텝을 거슬러 올라가며 살아남는 정도 (유한 차분으로 잰 ∂상태_T / ∂상태_0)
eps = 1e-6
e0 = np.zeros(d_h); e0[0] = eps
print(f"RNN  : |Δh_T| / eps = {np.linalg.norm(rnn(e0) - rnn(np.zeros(d_h))) / eps:.2e}")
for fb in [0.0, 1.0, 2.0, 3.0, 4.0]:
    c1, fmean = lstm(e0, fb)
    c0, _ = lstm(np.zeros(d_h), fb)
    print(f"LSTM (forget bias {fb:.0f}, 평균 f = {fmean:.2f}): |Δc_T| / eps = {np.linalg.norm(c1 - c0) / eps:.2e}")

# 파라미터 수: 게이트 하나 = (d_h × d_in) + (d_h × d_h) + d_h
per_gate = d_h * d_in + d_h * d_h + d_h
print(f"\\n파라미터 수 (d_in={d_in}, d_h={d_h})  RNN {per_gate}, GRU {3 * per_gate}, LSTM {4 * per_gate}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** RNN은 약 $10^{-4}$로 첫 시점의 영향이 거의 사라진다. LSTM도 forget bias가 0이면(평균 $f \\approx 0.5$) $10^{-8}$ 수준으로 RNN보다 오히려 나쁘지만, bias를 2 이상으로 올려 $f$가 0.87~0.98이 되면 영향이 $10^{-1}$~$10^{1}$ 수준으로 살아남는다. 게이트 구조 **자체**가 아니라 "$f_t \\approx 1$로 유지되는 덧셈 경로"가 장기 기억의 핵심이라는 뜻이다 — 그래서 실제 구현들은 forget bias를 1 이상으로 초기화하는 관행이 있다(Jozefowicz et al., 2015). 파라미터 수는 RNN : GRU : LSTM = 1 : 3 : 4 로, 게이트(후보 포함) 하나마다 RNN 한 개 분량이 든다. **해볼 것:** \`T\`를 100으로 늘려 forget bias 2와 4의 차이가 어떻게 벌어지는지 보자.
:::

## Seq2Seq의 병목과 Attention의 등장 {#seq2seq-attention}

RNN(또는 LSTM/GRU)을 이용해 "입력 문장 하나를 통째로 다른 문장으로 바꾸는" 기계번역 같은 태스크를 풀려는 시도가 Seq2Seq(Sequence-to-Sequence)다. Seq2Seq는 서로 다른 역할을 맡은 두 개의 RNN, Encoder와 Decoder로 구성된다. Encoder는 입력 시퀀스 $x_1, \\ldots, x_{T_x}$(예: 번역할 원문)를 토큰 순서대로 읽어나가며 은닉 상태를 갱신하고, 마지막 시점의 은닉 상태 $h_{T_x}$ 하나를 "입력 문장 전체의 의미를 압축한 고정 크기 벡터"로 취급해 이를 문맥 벡터(context vector) $c$로 Decoder에 넘긴다. Decoder는 이 $c$를 초기 상태로 받아, 자신의 은닉 상태 $s_t = f(s_{t-1}, y_{t-1}, c)$를 갱신해가며 출력 시퀀스 $y_1, \\ldots, y_{T_y}$(예: 번역된 문장)를 한 토큰씩 순차적으로 생성한다.

Decoder를 학습시킬 때 실무에서 거의 항상 쓰는 기법이 Teacher Forcing이다. Decoder가 $t$번째 토큰을 생성한 뒤 $t+1$번째 토큰을 생성할 차례가 되면, 그 입력으로 "방금 모델 자신이 예측한 토큰"이 아니라 "실제 정답 시퀀스의 $t$번째 토큰"을 그대로 넣어준다. 학습 초기의 모델은 예측이 부정확할 수밖에 없는데, 만약 모델 자신의(틀렸을 가능성이 큰) 예측을 다음 입력으로 계속 되먹임하면, 한 스텝에서 발생한 작은 오차가 다음 스텝의 입력을 오염시키고 그 오염된 입력이 또 다음 오차를 낳는 식으로 오류가 눈덩이처럼 불어나 학습 신호 자체가 불안정해진다. 반면 매 스텝의 입력을 정답으로 고정해주면 각 스텝의 예측 오차가 서로 독립적으로 취급되어 학습이 훨씬 안정적이고 빠르게 수렴한다.

그러나 이 구조에는 결정적인 한계가 있다. Encoder는 입력 문장이 세 단어든 서른 단어든 관계없이, 그 안의 모든 정보를 언제나 같은 고정 크기의 벡터 $c$ 하나에 욱여넣어야 한다. 문장이 길어질수록 그 안에 담긴 정보량은 늘어나는데 이를 담을 그릇의 크기는 그대로이므로, 문장이 길어질수록 $c$ 안에서 앞부분 토큰들의 정보가 뒤이어 들어오는 정보에 덮이거나 희석되어 유실되는 정도가 심해진다 — 이를 Seq2Seq의 병목(bottleneck) 문제라 부른다. 실제로 초기 Seq2Seq 기반 번역 모델은 짧은 문장에서는 준수한 성능을 보이다가도 문장 길이가 일정 수준을 넘어가면 번역 품질이 급격히 떨어지는 현상을 보였다.

**바로 이 병목이 Attention이 등장한 이유다.** Decoder가 문장 전체 정보를 오직 고정 크기 벡터 $c$ 하나에만 의존해야 한다는 제약 자체를 없애면 되지 않을까 — 이 발상에서 나온 것이 Attention 메커니즘이다(Bahdanau et al., 2014). Decoder는 매 출력 스텝마다 Encoder가 만들어낸 모든 시점의 은닉 상태 $h_1, \\ldots, h_{T_x}$를 다시 통째로 들여다보고, 지금 이 순간 생성할 토큰과 관련이 큰 시점에는 큰 가중치를, 관련이 적은 시점에는 작은 가중치를 주어 가중합한 벡터를 그때그때 새로 만들어 참고한다. 즉 정보를 압축해 한 번에 건네주는 대신, 필요할 때마다 원본 전체를 다시 조회할 수 있게 한 것이다. 이 아이디어가 이후 Encoder-Decoder 구조를 완전히 벗어나 "한 시퀀스 내부의 토큰들이 서로를 직접 조회한다"는 Self-Attention과 Transformer로 발전한다 — 다음 섹션부터는 그 Self-Attention을 정확한 수식으로 살펴본다.

### 왜 Attention인가 — 경로 길이와 병렬화

RNN은 문장을 토큰 순서대로 하나씩 처리하면서, 매 스텝마다 은닉 상태 $h_t = f(Wx_t + Uh_{t-1})$ 하나에 지금까지 읽은 모든 정보를 압축해 넣는다. 문장의 100번째 토큰이 3번째 토큰의 정보를 참고하려면 그 정보가 $h_3 \\to h_4 \\to \\dots \\to h_{100}$까지 97번의 순차적인 갱신을 거쳐 전달돼야 하고, 역전파 시 매 갱신마다 야코비안이 곱해지므로 경로가 길어질수록 기울기가 지수적으로 작아지는 현상(기울기 소실)이 발생한다. 즉 RNN에서 두 토큰 사이의 정보 경로 길이는 두 토큰의 위치 차이 $n$에 비례한다($O(n)$).

반면 Self-Attention은 모든 토큰 쌍 사이의 관련도를 $QK^\\top$ 행렬곱 한 번으로 동시에 계산한다. 3번째 토큰과 97번째 토큰 사이의 관계도 중간 토큰을 거치지 않고 단 한 번의 내적으로 직접 구해지므로, 두 토큰 사이의 정보 경로 길이는 둘 사이의 거리와 무관하게 항상 1이다($O(1)$). 대신 $n$개 토큰의 모든 쌍을 계산해야 하므로 연산량은 $O(n^2)$으로, 문장이 길어질수록 비용이 제곱으로 불어난다는 대가를 치른다. 긴 문서를 통째로 넣기가 비싼 이유, 그리고 최근 연구들이 "긴 문맥을 싸게 처리하는 방법"에 매달리는 이유가 바로 이 $O(n^2)$이라는 한 항에 담겨 있다.

| | RNN | Transformer |
| --- | --- | --- |
| 정보 경로 길이 | $O(n)$ — 멀리 있는 토큰 정보 손실 | $O(1)$ — 모든 토큰이 직접 연결 |
| 병렬화 | 순차 처리(느림) | 시퀀스 전체 병렬(GPU 친화) |
| 연산량 | $O(n)$ | $O(n^2)$ — 긴 문맥의 비용 문제 |

[[practice]]

### 실습 — 고정 크기 벡터의 병목과, 필요할 때마다 다시 보는 Attention

16차원 은닉 상태를 가진 RNN 인코더로 길이 $T$인 문장(토큰 하나 = 4차원 벡터)을 2,000개 읽힌 뒤, **마지막 은닉 상태 $h_T$ 하나만 보고 첫 번째 토큰을 선형회귀로 복원**할 수 있는지 $R^2$로 잰다. 비교를 위해 첫 시점의 은닉 상태 $h_1$을 직접 볼 수 있을 때(= Attention처럼 인코더의 모든 시점을 다시 조회할 수 있을 때)의 복원 정도도 함께 잰다. 인코더는 학습하지 않은 무작위 RNN이지만, "그릇의 크기는 고정인데 담을 양은 늘어난다"는 구조적 문제를 보기에는 충분하다.

\`\`\`python
import numpy as np
rng = np.random.default_rng(0)
d_in, d_h, N = 4, 16, 2000
Q, _ = np.linalg.qr(rng.normal(size=(d_h, d_h)))
W, U = rng.normal(0, 0.1, (d_h, d_in)), 1.0 * Q

def encode(X):
    """X: (N, T, d_in) 문장 N개 → 시점별 은닉 상태 (N, T, d_h)"""
    h = np.zeros((X.shape[0], d_h)); hs = []
    for t in range(X.shape[1]):
        h = np.tanh(h @ U.T + X[:, t] @ W.T)
        hs.append(h)
    return np.stack(hs, axis=1)

def r2_linear(H, Y):
    """H로 Y를 선형회귀했을 때의 R² (1이면 완벽 복원, 0이면 전혀 복원 못 함)"""
    Hb = np.hstack([H, np.ones((len(H), 1))])
    coef, *_ = np.linalg.lstsq(Hb, Y, rcond=None)
    return 1 - ((Y - Hb @ coef) ** 2).sum() / ((Y - Y.mean(0)) ** 2).sum()

# 1) 병목: 마지막 은닉 상태 h_T 하나만 보고 "첫 토큰"을 복원할 수 있는가?
print(f"{'문장 길이 T':>10} {'h_T로 첫 토큰 복원 R²':>22} {'h_1로 복원 R² (attention처럼 직접 조회)':>30}")
for T in [2, 5, 10, 20, 40]:
    X = rng.normal(size=(N, T, d_in))
    H = encode(X)
    print(f"{T:10d} {r2_linear(H[:, -1], X[:, 0]):22.3f} {r2_linear(H[:, 0], X[:, 0]):30.3f}")

# 2) Attention: 디코더의 현재 상태 s(Query)로 인코더의 모든 h_t(Key=Value)를 다시 훑는다
X = rng.normal(size=(1, 6, d_in))
H = encode(X)[0]                                   # (6, d_h) — 원문 토큰 6개의 은닉 상태
for step, s in enumerate([H[1] + 0.1 * rng.normal(size=d_h), H[4] + 0.1 * rng.normal(size=d_h)]):
    scores = H @ s                                 # 각 시점과의 관련도(내적)
    a = np.exp(scores - scores.max()); a /= a.sum()
    context = a @ H                                # 스텝마다 새로 만드는 문맥 벡터
    print(f"\\n디코더 스텝 {step + 1}: attention 가중치 = {np.round(a, 2)} → 문맥 벡터 shape {context.shape}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** $h_T$로 첫 토큰을 복원하는 $R^2$는 $T=2$일 때 0.99에서 $T=10$에서 약 0.18, $T=40$에서는 거의 0으로 떨어진다 — 16차원 벡터 하나에 $40 \\times 4 = 160$개의 숫자를 담을 수는 없다. 반면 $h_1$을 직접 보면 길이와 무관하게 $R^2 \\approx 1$이다. 두 번째 부분에서는 디코더 스텝마다 attention 가중치가 다른 시점(2번째, 5번째 토큰)에 몰리고, 문맥 벡터는 스텝마다 새로 만들어진다. **생각해볼 것:** 은닉 차원을 16에서 64로 늘리면 표의 숫자가 어떻게 바뀔까? 그래도 병목이 "해결"되지 않는 이유는 무엇인가?
:::

## Self-Attention: Q·K·V와 스케일링 {#self-attention}

[[diagram:attention-qkv]]

위 그림에서 토큰을 하나씩 클릭해보라. 클릭한 토큰이 Query가 되고, 나머지 화살표의 굵기가 실시간으로 바뀌는 것을 볼 수 있다. 이 상호작용이 사실 Self-Attention의 전부다. 이제 그 안에서 벌어지는 계산을 수식 단계별로 하나씩 풀어보자.

Self-Attention은 입력 시퀀스의 각 토큰 임베딩 $x_i$에 서로 다른 세 개의 학습 가능한 가중치 행렬 $W_q, W_k, W_v$를 각각 곱해 세 종류의 벡터, Query $q_i = x_iW_q$, Key $k_i = x_iW_k$, Value $v_i = x_iW_v$를 만드는 것에서 시작한다. $i$번째 토큰의 Query 벡터 $q_i$를 문장 내 모든 토큰의 Key 벡터 $k_j$와 각각 내적해 관련도 점수 $q_i \\cdot k_j$를 구하고, 이 점수들을 $\\sqrt{d_k}$로 스케일링한 뒤 softmax에 통과시켜 합이 1이 되는 가중치 $a_{ij}$로 바꾼다. 최종적으로 $i$번째 토큰의 새로운 표현은 이 가중치로 모든 토큰의 Value 벡터를 가중합한 것, 즉 $\\text{output}_i = \\sum_j a_{ij} v_j$이다. 정리하면 Key는 "i번째 토큰이 j번째 토큰을 얼마나 참조할지"를 정하는 데만 쓰이는 벡터이고, Value는 그 가중치에 따라 실제로 가중합되어 출력에 반영되는 정보이다. Key와 Value를 서로 다른 가중치 행렬($W_k$, $W_v$)로 분리해두면, "얼마나 참조할지 결정하는 기준"과 "실제로 전달되는 내용"을 독립적으로 학습할 수 있다는 이점이 생긴다.

도서관 비유로 정리해두면 기억하기 쉽다. **Query**는 내가 지금 찾는 주제가 적힌 질문지, **Key**는 서가의 책마다 붙은 책등의 색인표, **Value**는 책 속의 실제 내용이다. 사서는 내 질문지(Query)를 모든 책의 색인표(Key)와 대조해 관련도를 매기고(내적), 그 관련도를 비율로 바꾼 뒤(softmax), 비율만큼 여러 책의 내용(Value)을 발췌해 한 장의 요약으로 엮어준다(가중합). 색인표는 어떤 책을 펼칠지 고르는 데만 쓰이고, 내가 실제로 가져가는 것은 책의 내용이다 — 그래서 출력은 Key가 아니라 Value의 가중합이다. Self-Attention에서는 문장의 모든 토큰이 동시에 질문지·색인표·내용을 하나씩 갖고, 각자 사서 노릇을 한다.

입력 $X$($n \\times d$)에 세 행렬을 곱해 $Q = XW_q$, $K = XW_k$, $V = XW_v$(각각 $n \\times d_k$)를 만들면, 위 과정 전체가 다음 한 줄의 수식이 된다.

\`\`\`math
\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\dfrac{QK^\\top}{\\sqrt{d_k}}\\right)V
\`\`\`

이제 이 수식을 기호 하나하나 왜 거기 있는지, 정말 밑바닥부터 따져보자.

**왜 $QK^\\top$인가.** 벡터 두 개를 내적하면 "두 벡터가 얼마나 같은 방향을 향하는가"를 숫자 하나로 요약할 수 있다는 사실을 1주차 코사인 유사도에서 이미 확인했다. 즉 내적은 Query 벡터와 Key 벡터가 임베딩 공간에서 얼마나 같은 방향을 향하는지, 다시 말해 두 토큰이 표현하는 특징이 얼마나 겹치는지를 재는 도구다. 문장의 모든 토큰이 각자 하나의 Query 벡터와 하나의 Key 벡터를 갖고 있으므로, $n$개 토큰이 있다면 $Q(n \\times d_k)$와 $K^\\top(d_k \\times n)$를 곱한 결과는 $n \\times n$짜리 행렬이 된다. 이 행렬의 $(i,j)$ 칸에 적힌 숫자는 "$i$번째 토큰이 $j$번째 토큰을 얼마나 눈여겨보는가"에 대한 점수다. 즉 $QK^\\top$ 딱 한 번의 행렬곱으로, 모든 토큰 쌍 사이의 관련성 점수표가 통째로 완성된다.

**왜 softmax인가.** $QK^\\top$이 뱉어내는 점수는 그냥 아무 실수(음수도 될 수 있고 크기도 제각각인 숫자)일 뿐이다. 이걸 그대로 Value에 곱해서 더해버리면 각 항의 부호와 크기가 제각각이라 "몇 퍼센트를 어느 토큰에서 가져왔다"는 비율로 해석할 수 없다. 우리가 원하는 건 각 행(하나의 Query 입장에서 본 모든 토큰에 대한 점수)의 숫자들을 전부 0 이상으로 만들고, 합이 정확히 1이 되게 만드는 변환이다. softmax가 정확히 이 일을 한다 — 큰 점수는 지수함수(exp)를 거치며 상대적으로 훨씬 크게 부풀려지고(그래서 가장 관련 있는 토큰에 관심이 쏠리는 효과가 생긴다), 그다음 전체 합으로 나눠서 비율(확률처럼 보이는 값)로 바꿔준다. 그 결과가 곧 "몇 퍼센트는 이 토큰에서, 몇 퍼센트는 저 토큰에서 가져올지"를 정하는 attention 가중치다.

**왜 $\\sqrt{d_k}$로 나누는가.** 처음 보면 가장 뜬금없게 느껴지는 부분이지만, 사실은 순전히 숫자가 지나치게 커지는 것을 막기 위한 안전장치다. $q$와 $k$의 각 성분이 평균 0, 분산 1 정도로 적당히 작게 유지된다고 하자. 이 둘을 $d_k$개의 성분끼리 곱해서 다 더한 것이 내적 $q \\cdot k$인데, 서로 독립인 $d_k$개의 항을 더하면 분산은 대략 $d_k$배로 불어난다(독립인 확률변수를 더하면 분산도 더해진다 — 1주차 확률 참고). 즉 $d_k$가 클수록(임베딩 차원이 클수록) 내적 값 자체가 아주 크거나 아주 작은 극단값으로 튈 위험이 커진다. 그런데 softmax에 유난히 큰 값 하나와 나머지 작은 값들을 넣으면, exp가 그 큰 값만 극단적으로 부풀려서 결과가 "1등 토큰에 확률 거의 100%, 나머지는 거의 0%"인 원-핫에 가까운 모양이 되어버린다. 이렇게 되면 역전파로 계산되는 기울기가 거의 0에 수렴해버려서(softmax가 완만한 구간이 아니라 뾰족한 절벽 근처에 있으면 그 지점의 기울기는 0에 가깝다) 학습이 사실상 멈춰버린다. $\\sqrt{d_k}$로 나누면 내적 값의 분산이 다시 1 근처로 돌아오기 때문에, softmax가 지나치게 뾰족해지지 않고 여러 토큰에 골고루 관심을 분배할 여지가 남는다. 결국 $\\sqrt{d_k}$ 스케일링은 "학습이 잘 굴러가도록 점수의 스케일을 적당히 눌러주는" 지극히 실용적인 안전핀이다.

이 세 가지가 합쳐지면 다음과 같은 아주 작은 숫자 예제로 손에 잡히게 확인할 수 있다.

:::example 숫자로 직접 따라가는 Self-Attention — "고양이가 생선을 맛있게 먹었다"
위 그림과 같은 4개 토큰 문장에서 "생선을"이 Query가 된 경우를 생각해보자. 설명을 위해 $d_k=4$인 아주 작은 임베딩 공간을 가정하고, 이미 학습이 끝난 뒤라고 치고 각 토큰의 Key 벡터가 다음과 같이 나왔다고 하자. 고양이가=[1,0,0,0], 생선을=[1,1,1,1], 맛있게=[0,0,1,0], 먹었다=[1,1,0,-1]. "생선을"의 Query 벡터는 [1,1,0,1]이라고 하자.

먼저 Query와 각 Key를 내적한다(같은 자리 성분끼리 곱해서 전부 더하기). 고양이가: $1 \\times 1 + 1 \\times 0 + 0 \\times 0 + 1 \\times 0$ = **1**. 생선을(자기 자신): $1 \\times 1 + 1 \\times 1 + 0 \\times 1 + 1 \\times 1$ = **3**. 맛있게: $1 \\times 0 + 1 \\times 0 + 0 \\times 1 + 1 \\times 0$ = **0**. 먹었다: $1 \\times 1 + 1 \\times 1 + 0 \\times 0 + 1 \\times (-1)$ = **1**. 이렇게 나온 점수 [1, 3, 0, 1]이 $QK^\\top$ 행렬의 한 행이다.

여기에 $\\sqrt{d_k} = \\sqrt{4} = 2$로 나누면 [0.5, 1.5, 0, 0.5]가 된다. 이제 이 네 숫자에 softmax를 적용한다. 각각 지수를 취하면 $e^{0.5} \\approx 1.65$, $e^{1.5} \\approx 4.48$, $e^0 = 1$, $e^{0.5} \\approx 1.65$이고, 이들의 합은 약 8.78이다. 각 값을 이 합으로 나누면 최종 attention 가중치는 고양이가 $\\approx$ **18.8%**, 생선을 $\\approx$ **51.0%**, 맛있게 $\\approx$ **11.4%**, 먹었다 $\\approx$ **18.8%**가 된다. 즉 "생선을"이라는 Query는 자기 자신의 Value를 절반 가까이 가져오면서, 나머지는 "고양이가"와 "먹었다"에 골고루, "맛있게"에는 상대적으로 적게 관심을 나눠준다.

마지막으로 이 비율대로 Value를 섞어보자. Value를 2차원으로 단순화해서 고양이가=[2,0], 생선을=[0,3], 맛있게=[1,1], 먹었다=[4,0]이라 하면, 출력 $= 0.188 \\times [2,0] + 0.510 \\times [0,3] + 0.114 \\times [1,1] + 0.188 \\times [4,0] \\approx$ **[1.24, 1.65]**. 이 벡터 하나가 바로 "생선을"이라는 토큰이 문장 전체를 한 번 둘러보고 새로 얻은, 문맥이 반영된 표현이다. 위 그림에서 "생선을"을 클릭했을 때 나오는 퍼센트(19%, 51%, 11%, 19%)가 바로 이 계산 결과다.
:::

[[practice]]

### 실습 — 손계산 예제를 코드로 재현하고, $\\sqrt{d_k}$가 없으면 어떻게 되는지 보기

\`\`\`python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis, keepdims=True)

# 1) 본문의 숫자 예제를 그대로 재현: "생선을"이 Query일 때
tokens = ["고양이가", "생선을", "맛있게", "먹었다"]
K = np.array([[1, 0, 0, 0], [1, 1, 1, 1], [0, 0, 1, 0], [1, 1, 0, -1]], dtype=float)
V = np.array([[2, 0], [0, 3], [1, 1], [4, 0]], dtype=float)
q = np.array([1, 1, 0, 1], dtype=float)

scores = K @ q                          # 내적 점수 [1, 3, 0, 1]
a = softmax(scores / np.sqrt(len(q)))   # √dk = 2로 나눈 뒤 softmax
out = a @ V
print("점수   :", scores)
print("가중치 :", {t: f"{w:.1%}" for t, w in zip(tokens, a)})
print("출력   :", out.round(2))

# 2) √dk로 나누지 않으면? dk가 커질수록 내적의 분산이 dk배로 커지고 softmax가 한 곳에 몰린다
rng = np.random.default_rng(0)
print(f"\\n{'dk':>5} {'내적의 분산':>10} {'최대 가중치(나누기 X)':>18} {'최대 가중치(√dk로 나눔)':>20}")
for dk in [4, 64, 512]:
    Q = rng.normal(size=(2000, dk)); Ks = rng.normal(size=(10, dk))
    S = Q @ Ks.T                                   # 쿼리 2000개 × 키 10개의 점수
    raw = softmax(S).max(axis=1).mean()
    scaled = softmax(S / np.sqrt(dk)).max(axis=1).mean()
    print(f"{dk:5d} {S.var():10.1f} {raw:18.3f} {scaled:20.3f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 점수 \`[1, 3, 0, 1]\`, 가중치 18.8% · 51.0% · 11.4% · 18.8%, 출력 \`[1.24, 1.65]\`로 본문의 손계산과 같다. 두 번째 표에서 내적의 분산은 $d_k$와 거의 같게(4 → 64 → 512) 커지고, 나누지 않으면 최대 가중치가 0.46 → 0.87 → 0.96으로 한 키에 쏠린다(원-핫에 가까워져 기울기가 사라지는 상태). $\\sqrt{d_k}$로 나누면 $d_k$와 무관하게 0.3 안팎으로 유지된다. **해볼 것:** Query를 "맛있게"의 Key와 같은 \`[0, 0, 1, 0]\`으로 바꿔보자. 가중치가 어디로 옮겨가고 출력은 어떻게 바뀌는가? 이것이 과제 3번의 출발점이다.
:::

## 멀티헤드 Attention과 Causal Mask {#multi-head-causal}

이제 하나의 (Wq, Wk, Wv) 세트, 즉 head 하나만으로는 부족하다는 문제가 남는다. Query-Key 내적은 고정된 하나의 선형 변환 기준으로만 토큰 간 관련성을 측정하는데, 실제 언어에는 동시에 포착해야 할 관계가 여러 종류다 — 주어-동사 호응 같은 문법적 관계, 대명사가 무엇을 지시하는지 같은 의미적 관계, 인접 토큰인지 먼 토큰인지 같은 위치 관계 등. Multi-Head Attention은 전체 임베딩 차원 $d$를 $h$개의 서로 다른 부분공간(head)으로 나누고($d_k = d/h$), 각 head가 독립적인 가중치 행렬 $W_q^{(i)}, W_k^{(i)}, W_v^{(i)}$로 자신만의 $d_k$차원 부분공간에서 별도의 attention 가중치와 출력을 계산하게 한다. 각 head는 학습 과정에서 서로 다른 종류의 토큰 간 관계에 반응하도록 파라미터가 최적화되며, 전체 차원을 $h$등분한 부분공간에서 병렬로 계산하기 때문에 전체 연산량은 단일 head가 전체 차원 $d$를 그대로 쓸 때와 비슷한 수준으로 유지된다. 마지막으로 $h$개 head의 출력 벡터를 이어붙인(concat) 뒤 출력 투영 행렬 $W^O$를 곱해 하나의 $d$차원 벡터로 합친다. 이 과정을 수식으로 적으면 다음과 같다.

비유하자면 **여러 명의 전문가**가 같은 문장을 동시에 읽는 것과 같다. 한 명은 주어와 동사의 호응만, 한 명은 대명사가 가리키는 대상만, 또 한 명은 바로 옆 단어와의 관계만 살핀다. 각자 메모를 남기면(head별 출력) 마지막에 편집자($W^O$)가 메모를 이어붙여 하나의 보고서로 정리한다. 한 명(단일 head)이 모든 관계를 챙기려면 하나의 softmax 분포 안에서 서로 다른 관계들이 평균내어져 흐려지지만, 여러 head는 각자 다른 곳에 주목하는 분포를 따로 가질 수 있다.

\`\`\`math
\\text{MultiHead}(Q,K,V) = \\text{Concat}(head_1,\\dots,head_h)W^O
\`\`\`

아래 그림은 이 concat과 $W^O$ 투영이 실제 텐서 shape에서 어떻게 일어나는지를 정리한 것이다. $h$개의 Attention Head가 각자 $(\\ell_{seq}, d_{head})$ 모양의 출력을 내놓으면, 이를 head 축으로 이어붙여 $(\\ell_{seq}, d_{head} \\cdot h)$ 모양으로 만든 뒤 $W^O \\in \\mathbb{R}^{(d_{head} \\cdot h) \\times d_{emb}}$를 곱해 최종적으로 $(\\ell_{seq}, d_{emb})$ 모양의 출력 하나로 되돌린다.

\`\`\`image
src: /images/week5/multi-head-attention.png
alt: Multi-Head Attention 구조도 — 여러 Attention Head의 출력을 concat한 뒤 Wo로 투영하는 과정을 텐서 shape과 함께 표시
caption: 여러 Attention Head가 각각 독립적으로 attention을 계산한 뒤 그 출력을 이어붙이고(Concat), 투영 행렬 Wᴼ를 곱해 하나의 출력으로 합친다. 괄호 안 표기는 각 단계의 텐서 shape이다.
credit: Cosmia Nebula, CC BY-SA 4.0, Wikimedia Commons
width: 1335
height: 731
\`\`\`

### Causal mask — 미래를 가리는 장치

Causal mask는 미래 토큰을 보지 못하도록 점수 행렬 $QK^\\top$의 상삼각 원소(자기 자신보다 뒤에 있는 토큰에 대한 점수)를 $-\\infty$로 치환하는 장치다. GPT는 "다음 토큰 예측"으로 학습하는데, $i$번째 위치에서 $i+1$번째 이후의 정답 토큰 정보를 attention을 통해 미리 참조할 수 있다면 학습 시점에 레이블 누출(label leakage)이 발생해, 모델이 실제로 다음 토큰을 예측하는 능력이 아니라 정답을 그대로 복사하는 지름길만 학습하게 된다. $-\\infty$를 넣은 칸은 softmax를 거치고 나면 정확히 0이 되므로, 미래 토큰에 대한 attention 가중치는 항상 0으로 강제된다. 결과적으로 각 토큰은 자기 자신과 그 이전에 나온 토큰들만 볼 수 있고, 이 제약 덕분에 학습이 끝난 모델을 그대로 "왼쪽에서 오른쪽으로 한 토큰씩 생성하는" 용도로도 쓸 수 있게 된다.

개념은 이미 다 나왔으니, 이제 코드로 직접 확인할 차례다. 아래 코드는 순수 NumPy만 사용하므로 설치나 GPU 없이 이 페이지에서 바로 ▶ 실행 버튼을 눌러 돌려볼 수 있다. 다만 처음부터 멀티헤드까지 한꺼번에 구현하면 복잡하니, 먼저 head 하나짜리(단일 헤드) self-attention부터 손으로 짜보자. 라이브러리 뒤에 숨지 않고 $QK^\\top$부터 softmax까지 직접 구현해보면, 위에서 숫자로 따라간 예제가 코드 안에서 정확히 어떤 줄에 해당하는지 눈으로 확인할 수 있다.

:::info 이 코드에서 처음 나오는 NumPy 문법
- **\`@\` 연산자**: 배열 두 개를 \`@\`로 이으면 행렬곱(matrix multiplication)이다. \`(5, 8)\` 모양과 \`(8, 4)\` 모양을 \`@\`로 곱하면 \`(5, 4)\` 모양이 나온다 — 가운데의 8끼리 서로 만나 사라지고, 바깥의 5와 4만 남는다고 기억하면 쉽다. \`*\`(별표)는 같은 자리 성분끼리만 곱하는 원소별(element-wise) 곱셈이라 전혀 다른 연산이니 헷갈리지 말 것.
- **\`.T\`**: 행과 열을 맞바꾸는 전치(transpose)다. \`(n, dk)\` 모양의 \`.T\`는 \`(dk, n)\` 모양이 된다.
- **\`np.triu(M, 1)\`**: 정사각행렬 \`M\`에서 대각선보다 한 칸(\`k=1\`) 더 위쪽에 있는 자리만 1로, 나머지는 0으로 채운 상삼각(upper-triangular) 행렬을 돌려준다. 대각선 자기 자신은 제외하고 그보다 진짜 미래에 있는 토큰 자리만 골라내는 것이다. 아래 코드는 이 1인 자리에 \`np.where\`로 -1e9(사실상 $-\\infty$)를 채워 넣어 미래 토큰을 가린다.
- **\`axis\`와 \`keepdims\`**: \`x.max(axis, keepdims=True)\`처럼 축(axis)을 지정하면 그 축을 따라서만 최댓값을 구하고, \`keepdims=True\`는 그 축을 지우지 않고 크기 1로 남겨 원래 배열과 그대로 뺄셈(broadcasting)할 수 있게 해준다.
- **softmax 전에 왜 최댓값을 빼는가**: \`np.exp\`는 입력이 조금만 커져도 곧바로 감당하기 힘든 큰 수(오버플로)가 된다. 그런데 모든 값에서 같은 상수 $c$를 빼도 softmax의 결과값 자체는 수학적으로 완전히 똑같다 — 분자·분모에 공통으로 곱해지는 $e^{-c}$가 약분되어 사라지기 때문이다. 그래서 각 행의 최댓값을 미리 빼두면 \`exp\`에 들어가는 가장 큰 값이 항상 0이 되어, 오버플로 없이 정확히 같은 값을 안전하게 계산할 수 있다 — 실전 라이브러리들이 예외 없이 쓰는 표준 기법이다.
:::

\`\`\`python
# NumPy로 단일 헤드 self-attention (causal mask 포함)
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True)   # 오버플로 방지: 최댓값을 빼도 결과는 수학적으로 동일하다
    e = np.exp(x)
    return e / e.sum(axis, keepdims=True)

def self_attention(X, Wq, Wk, Wv, causal=True):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv                    # 각각 (n, dk) — @는 행렬곱
    S = Q @ K.T / np.sqrt(K.shape[-1])                  # (n,dk)@(dk,n) = (n, n) 점수 행렬
    if causal:
        S = np.where(np.triu(np.ones_like(S), 1) == 1, -1e9, S)  # 미래 토큰 자리를 -∞로 치환
    A = softmax(S)                                      # 각 행(하나의 Query 기준)의 합 = 1
    return A @ V, A                                     # (n,n)@(n,dk) = (n, dk)

rng = np.random.default_rng(0)
n, d, dk = 5, 8, 4          # n=토큰 수, d=입력 임베딩 차원, dk=Q·K·V가 사는 차원
X = rng.normal(size=(n, d))
Wq, Wk, Wv = (rng.normal(size=(d, dk)) for _ in range(3))
out, A = self_attention(X, Wq, Wk, Wv)
print(out.shape, A.round(2))          # A는 하삼각행렬(대각선 위가 전부 0)이어야 함
\`\`\`

shape을 하나씩 짚어보자. n=5는 토큰 개수, d=8은 입력 임베딩 차원, dk=4는 Query·Key·Value가 살고 있는(대개 더 작게 압축된) 차원이다. X는 (n, d)=(5, 8), 여기에 (d, dk)=(8, 4)짜리 Wq를 곱하면 Q는 (n, dk)=(5, 4)가 된다. K, V도 같은 shape이다. Q(5,4)와 $K^\\top$(4,5)를 곱하면 가운데 dk=4가 서로 상쇄되면서 (5,5)짜리 정방행렬 S가 남는데, 이 S가 바로 "5개 토큰이 서로에게 매기는 점수표"다. \`np.triu(..., 1)\`은 대각선 바로 위부터 시작하는 상삼각 부분(즉 "나보다 미래에 있는 토큰"에 해당하는 칸)만 골라내는 함수이고, 그 자리에 -1e9라는 사실상 -∞에 가까운 값을 넣어버린다. softmax를 통과하면 이 값들은 정확히 0에 가까운 값이 되므로, 마지막에 출력된 A를 인쇄해보면 대각선 위쪽이 전부 0인 하삼각행렬 모양이 나온다 — "나는 나 자신과 나 이전의 토큰들만 볼 수 있다"는 규칙이 숫자로 그대로 드러나는 순간이다. 마지막으로 A(5,5)와 V(5,4)를 곱하면 다시 (5,4) 모양의 출력이 나오는데, 이건 "각 토큰이 자신이 볼 수 있는 토큰들의 Value를 attention 비율만큼 섞어서 만든 새로운 표현"이다.

방금 만든 head 하나짜리 \`self_attention\`을 여러 개 병렬로 돌리고 그 결과를 이어붙이기만 하면 바로 Multi-Head Attention이 된다 — 앞서 개념으로만 봤던 것을 이제 실제로 실행되는 코드로 확장해보자.

:::info 3차원 배열과 축(axis) 다루기 — 처음 나오는 문법
지금까지는 모든 배열이 2차원(행, 열)이었지만, 헤드가 여러 개면 "헤드 축"이 하나 더 필요해 배열이 3차원이 된다. \`M.reshape(n, h, dk)\`는 \`(n, d)\` 모양의 2차원 배열을 원소 개수(\`n×d\`)는 그대로 두고 \`(n, h, dk)\`라는 3차원 모양으로 다시 자른다(단 \`d = h × dk\`여야 한다). \`M.transpose(1, 0, 2)\`는 축의 순서를 바꾸는 명령인데, 괄호 안 숫자는 "몇 번째였던 축을 이 자리로 가져올지"를 뜻한다 — \`(1, 0, 2)\`는 0번 축(길이 n)과 1번 축(길이 h)의 자리를 맞바꾸고 2번 축(길이 dk)은 그대로 두라는 뜻이므로, \`(n, h, dk)\`가 $\\to$ \`(h, n, dk)\`로 바뀐다. 3차원 배열의 shape을 읽을 때는 항상 왼쪽부터 순서대로, 즉 가장 바깥 축부터 하나씩 "이건 무엇의 개수인가"를 짚어가며 읽으면 헷갈리지 않는다.
:::

\`\`\`python
# NumPy로 멀티헤드 causal self-attention — 위의 self_attention을 헤드 여러 개로 확장
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis, keepdims=True)

def multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads, causal=True):
    n, d = X.shape
    dk = d // n_heads                                     # 헤드 하나가 담당하는 차원
    Q, K, V = X @ Wq, X @ Wk, X @ Wv                       # 각각 (n, d)

    def split_heads(M):
        # (n, d) -> (n, h, dk) -> (h, n, dk): 헤드 축을 맨 앞으로 옮겨 헤드별로 다루기 쉽게 만든다
        return M.reshape(n, n_heads, dk).transpose(1, 0, 2)

    Qh, Kh, Vh = split_heads(Q), split_heads(K), split_heads(V)    # 각각 (h, n, dk)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(dk)               # (h,n,dk)@(h,dk,n) = (h, n, n)
    if causal:
        mask = np.triu(np.ones((n, n)), 1) == 1
        scores = np.where(mask, -1e9, scores)             # 마스크는 모든 헤드에 동일하게 적용된다
    weights = softmax(scores, axis=-1)                     # 마지막 축(참조 대상 토큰) 기준 softmax
    heads_out = weights @ Vh                               # (h,n,n)@(h,n,dk) = (h, n, dk)
    concat = heads_out.transpose(1, 0, 2).reshape(n, d)    # (h,n,dk)->(n,h,dk)->(n, d): 헤드를 다시 이어붙임
    return concat @ Wo, weights                            # Wo: (d, d) 출력 투영

rng = np.random.default_rng(1)
n, d, h = 5, 8, 2                       # 토큰 5개, 임베딩 차원 8, 헤드 2개 -> 헤드당 차원 dk = 8/2 = 4
X = rng.normal(size=(n, d))
Wq, Wk, Wv, Wo = (rng.normal(size=(d, d)) for _ in range(4))
out, W = multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads=h)
print("출력 shape:", out.shape)         # (5, 8) — 입력과 같은 모양으로 되돌아온다
print("가중치 shape:", W.shape)         # (2, 5, 5) = (헤드 수, 토큰 수, 토큰 수)
print(W.round(2))
\`\`\`

출력 shape이 \`(5, 8)\`로 입력 \`X\`와 똑같은 모양으로 되돌아온다는 점이 핵심이다 — Attention 블록 하나를 몇 겹으로 쌓아도(다음 섹션의 디코더 블록처럼) 입출력 모양이 그대로 유지되기 때문에 동일한 블록을 반복해서 쌓을 수 있는 것이다. \`W.shape\`이 \`(2, 5, 5)\`라는 것은 "헤드 2개 각각이 $5 \\times 5$짜리 자기만의 attention 지도를 따로 갖는다"는 뜻이고, \`W\`를 인쇄해보면 두 헤드 모두 대각선 위쪽이 0인 하삼각행렬이면서도(causal mask가 두 헤드에 똑같이 적용됐다는 뜻) 정작 대각선 아래쪽 숫자들은 헤드마다 서로 다르게 나온다 — 같은 입력을 보고도 두 헤드가 서로 다른 관계에 주목하도록 각자 다른 \`Wq\`, \`Wk\`, \`Wv\`로 학습될 수 있다는 사실이 숫자로 확인되는 순간이다.

이제 같은 아이디어를 실전 라이브러리에서 어떻게 쓰는지도 봐두자. \`torch\`는 브라우저 실행 환경에 없으므로 아래 PyTorch 코드는 Colab에 붙여넣어 실행한다.

\`\`\`python-colab
# PyTorch 멀티헤드 causal attention 모듈 — Colab에서 실행 (브라우저에서는 실행되지 않음)
import torch, torch.nn as nn, torch.nn.functional as F

class CausalSelfAttention(nn.Module):
    def __init__(self, d, h):
        super().__init__(); self.h = h; self.qkv = nn.Linear(d, 3*d); self.o = nn.Linear(d, d)
    def forward(self, x):
        B, T, D = x.shape
        q, k, v = self.qkv(x).chunk(3, -1)
        q, k, v = (t.view(B, T, self.h, D//self.h).transpose(1, 2) for t in (q, k, v))  # B,h,T,dh
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True)
        return self.o(y.transpose(1, 2).reshape(B, T, D))
print(CausalSelfAttention(64, 4)(torch.randn(2, 10, 64)).shape)   # (2, 10, 64)
\`\`\`

이번엔 batch까지 있는 진짜 실전 shape이다. x는 (B, T, D) = (배치 크기, 문장 길이, 임베딩 차원)이다. \`self.qkv\`라는 Linear 하나로 Q, K, V를 한꺼번에 만든 뒤 \`chunk(3, -1)\`로 셋으로 쪼개는 것은, 세 번 따로 행렬곱을 하는 대신 한 번의 큰 행렬곱으로 처리해 속도를 아끼는 흔한 구현 요령일 뿐, 수학적으로는 앞의 NumPy 코드의 \`X @ Wq\`, \`X @ Wk\`, \`X @ Wv\`와 완전히 같은 일이다. 그다음 \`.view(B, T, h, D//h).transpose(1, 2)\`가 하는 일이 이번 코드에서 가장 헷갈리는 부분인데, 풀어서 보면 이렇다 — (B, T, D) 모양의 텐서를 D차원을 \`h개의 머리 × 머리당 차원(dh = D/h)\`으로 다시 자른 뒤, 머리 축(h)을 앞으로 끌어와 (B, h, T, dh) 모양으로 바꾼다 — 배치 축 B가 하나 더 있다는 점만 빼면 앞의 멀티헤드 NumPy 코드에서 \`split_heads\`가 하던 조작과 정확히 같다. 이렇게 만들면 \`F.scaled_dot_product_attention\`이 h개의 머리 각각에 대해 (T, dh) 크기의 attention을 독립적으로, 그러나 한꺼번에 병렬로 계산해준다 — 이것이 바로 위에서 설명한 "여러 명의 전문가가 동시에 문장을 읽는다"는 비유가 실제 텐서 연산으로 구현된 모습이다. \`is_causal=True\`는 NumPy 코드에서 우리가 직접 만들었던 -1e9 마스킹을 내부적으로 대신 처리해주는 옵션이다. 마지막으로 \`transpose(1, 2).reshape(B, T, D)\`는 h개로 나눴던 머리들을 다시 하나로 이어붙여(concat) 원래 모양으로 되돌리는 과정이고, 그 뒤에 곱해지는 \`self.o\`가 바로 본문에서 말한 $W^O$다.

:::example 심화 실습 (선택)
Karpathy nanoGPT 스타일: tiny Shakespeare 또는 한국어 텍스트로 문자 단위 GPT(약 10M 파라미터)를 학습하고 샘플을 생성해 본다. 실행은 Colab GPU에서 5~10분.
:::

[[practice]]

### 실습 — 구현이 맞는지 스스로 검사하는 세 가지 테스트

구현을 "돌아간다"에서 끝내지 말고, **맞다는 증거**를 코드로 남기는 습관을 들이자. 아래 세 검사는 과제의 "구현 정확성" 채점 항목과 같다.

\`\`\`python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis, keepdims=True)

def attention(Q, K, V, causal=True):
    S = Q @ K.T / np.sqrt(K.shape[-1])
    if causal:
        S = np.where(np.triu(np.ones_like(S), 1) == 1, -1e9, S)
    return softmax(S) @ V

def multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads, causal=True):
    n, d = X.shape
    dk = d // n_heads
    split = lambda M: M.reshape(n, n_heads, dk).transpose(1, 0, 2)     # (n, d) → (h, n, dk)
    Qh, Kh, Vh = split(X @ Wq), split(X @ Wk), split(X @ Wv)
    S = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(dk)                        # (h, n, n)
    if causal:
        S = np.where(np.triu(np.ones((n, n)), 1) == 1, -1e9, S)
    heads = softmax(S) @ Vh                                             # (h, n, dk)
    return heads.transpose(1, 0, 2).reshape(n, d) @ Wo                  # (n, d)

rng = np.random.default_rng(0)
n, d, h = 6, 8, 2
X = rng.normal(size=(n, d))
Wq, Wk, Wv, Wo = (rng.normal(size=(d, d)) for _ in range(4))

# 검사 1) 벡터화한 멀티헤드 == 헤드를 하나씩 따로 계산해 이어붙인 결과
dk = d // h
per_head = [attention(X @ Wq[:, i*dk:(i+1)*dk], X @ Wk[:, i*dk:(i+1)*dk], X @ Wv[:, i*dk:(i+1)*dk]) for i in range(h)]
loop_version = np.concatenate(per_head, axis=1) @ Wo
fast_version = multi_head_attention(X, Wq, Wk, Wv, Wo, h)
print("검사 1 — 벡터화 == 헤드별 반복:", np.allclose(fast_version, loop_version))

# 검사 2) causal: 마지막 토큰(미래)을 바꿔도 앞 토큰들의 출력은 그대로여야 한다
X2 = X.copy(); X2[-1] = rng.normal(size=d)
out1, out2 = multi_head_attention(X, Wq, Wk, Wv, Wo, h), multi_head_attention(X2, Wq, Wk, Wv, Wo, h)
print("검사 2 — 앞 5개 토큰 출력 불변:", np.allclose(out1[:-1], out2[:-1]),
      "/ 마지막 토큰 출력은 변함:", not np.allclose(out1[-1], out2[-1]))

# 검사 3) 마스크를 끄면? 미래 토큰이 과거 출력에 새어 들어온다 (학습 때의 부정행위)
o1 = multi_head_attention(X, Wq, Wk, Wv, Wo, h, causal=False)
o2 = multi_head_attention(X2, Wq, Wk, Wv, Wo, h, causal=False)
print("검사 3 — 마스크 없이 첫 토큰 출력 변화량:", np.abs(o1[0] - o2[0]).max().round(3))
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 검사 1과 2는 \`True\`, 마지막 토큰 출력은 바뀐다(\`True\`). 검사 3에서는 마스크를 끄자 미래 토큰을 바꿨을 뿐인데 **첫 번째 토큰의 출력**이 크게(10 이상) 변한다 — 학습 때 이런 일이 생기면 모델은 다음 토큰을 "예측"하는 대신 보고 베낀다. **해볼 것:** \`np.triu(..., 1)\`을 \`np.triu(..., 0)\`으로 바꾸면 대각선(자기 자신)까지 가려진다. 첫 번째 토큰의 행은 어떻게 되는가? 검사 2가 이런 실수를 잡아내는지 확인해 보자.
:::

## 위치 인코딩과 Transformer 디코더 블록 {#transformer-block}

[[diagram:transformer-decoder-block]]

지금까지 우리는 GPT처럼 디코더만 쓰는 구조를 중심으로 봤는데, 2017년 원 논문의 Transformer는 사실 번역을 염두에 두고 인코더와 디코더를 모두 갖춘 구조로 제안되었다. 아래는 그 원본 아키텍처 그림이다 — 왼쪽 블록(인코더)이 입력 문장 전체를 한꺼번에 읽어 표현으로 압축하고, 오른쪽 블록(디코더)이 그 표현을 참고하면서 출력을 한 토큰씩 생성한다. 오늘날 GPT 계열은 이 중 디코더 절반만 떼어내 사용하고, 반대로 BERT 같은 모델은 인코더 절반만 사용한다.

\`\`\`image
src: /images/week5/transformer.png
alt: Attention Is All You Need 논문의 원본 Transformer 아키텍처 그림
caption: 왼쪽이 인코더 스택, 오른쪽이 디코더 스택이다. 각 블록 안의 "Multi-Head Attention"과 "Feed Forward"가 이 섹션에서 다루는 Attention·MLP 역할 분담과 정확히 대응한다.
credit: Yuening Jia, CC BY-SA 3.0, Wikimedia Commons (원 도식: Vaswani et al., 2017)
width: 700
height: 630
\`\`\`

Attention 하나만으로는 아직 부족한 것이 하나 남아 있다. Self-Attention 계산 자체는 순서에 무관한(순열 불변, permutation-invariant) 연산이다. 토큰들의 입력 순서를 임의로 치환(permutation)해도 Q, K, V는 각 토큰 임베딩으로부터 독립적으로 계산되므로 $(i,j)$ 쌍마다 나오는 내적값의 집합 자체는 치환 전후로 동일하며, 그 결과 산출되는 출력 벡터들의 집합도 순서만 바뀔 뿐 값 자체는 동일하다 — 즉 attention 연산 자체에는 "몇 번째 토큰인가"라는 위치 정보가 전혀 들어 있지 않다. 그래서 attention만 놓고 보면 "고양이가 생선을 먹었다"와 "먹었다 생선을 고양이가"를 구별하지 못한다. 이 문제를 해결하는 것이 위치 인코딩(positional encoding)이다. 각 토큰의 임베딩에 위치 인덱스마다 고유하게 정해지는 위치 벡터를 더해줌으로써, 모델이 토큰의 내용 정보뿐 아니라 그 토큰이 문장에서 몇 번째 자리에 있는지도 함께 알 수 있게 만든다.

원 논문은 사인·코사인 파동으로 번호표를 만들었는데, 위치 $pos$의 $2i$번째·$2i+1$번째 성분을 각각 $\\sin(pos/10000^{2i/d})$, $\\cos(pos/10000^{2i/d})$로 정한다. 즉 서로 다른 주파수의 사인·코사인 파동을 여러 개 겹쳐서 각 위치마다 고유한 값의 조합(벡터 패턴)이 나오게 만든 방식이다. 이후에는 번호표 자체를 학습 가능한 파라미터로 두는 방식이나, 절대 위치 대신 두 토큰 사이의 상대적 거리만 반영하는 RoPE(회전 위치 인코딩) 같은 상대 위치 방식이 등장해 현재 주류로 자리 잡았다. Attention 층이 "이 문장 안에서 어떤 토큰들이 서로 관련 있는가"를 계산하는 역할이라면, 그다음에 오는 MLP(2층짜리 완전연결 신경망으로, 보통 $d$차원을 $4d$로 넓혔다가 다시 $d$로 좁힌다)는 각 토큰의 표현을 독립적으로 받아 "이 정보를 갖고 무엇을 더 알 수 있는가"를 처리하는 역할을 맡는다. 실제로 전체 파라미터의 상당 부분(약 2/3)이 이 MLP에 몰려 있어서, 최근 해석가능성 연구에서는 이 부분을 모델이 사실 관계 같은 지식을 저장해두는 "저장소"에 가깝다고 해석하기도 한다. 정리하면 한 블록 안에서 Attention은 "누구를 참고할지 찾는" 역할을, MLP는 "찾은 정보로 무엇을 계산할지" 역할을 나누어 맡고 있는 셈이다.

[[practice]]

### 실습 — 위치 인코딩이 없으면 순서를 구별하지 못한다

\`\`\`python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis, keepdims=True)

def self_attention(X, Wq, Wk, Wv):          # 마스크 없는 (인코더형) self-attention
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    return softmax(Q @ K.T / np.sqrt(K.shape[-1])) @ V

rng = np.random.default_rng(0)
d = 8
emb = {w: rng.normal(size=d) for w in ["고양이가", "생선을", "먹었다"]}
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))

s1 = ["고양이가", "생선을", "먹었다"]
s2 = ["먹었다", "생선을", "고양이가"]
X1 = np.stack([emb[w] for w in s1]); X2 = np.stack([emb[w] for w in s2])

# 1) 위치 정보가 없으면: 순서를 뒤집어도 "각 단어의 출력"은 똑같다 (순서만 바뀜)
o1, o2 = self_attention(X1, Wq, Wk, Wv), self_attention(X2, Wq, Wk, Wv)
print("위치 인코딩 없음 — '고양이가'의 출력이 두 문장에서 같은가?", np.allclose(o1[0], o2[2]))

# 2) 사인·코사인 위치 인코딩 (Vaswani et al., 2017)
def sinusoidal_pe(n, d):
    pos = np.arange(n)[:, None]
    i = np.arange(0, d, 2)[None, :]
    angle = pos / (10000 ** (i / d))
    pe = np.zeros((n, d))
    pe[:, 0::2], pe[:, 1::2] = np.sin(angle), np.cos(angle)
    return pe

PE = sinusoidal_pe(3, d)
o1, o2 = self_attention(X1 + PE, Wq, Wk, Wv), self_attention(X2 + PE, Wq, Wk, Wv)
print("위치 인코딩 추가 — '고양이가'의 출력이 두 문장에서 같은가?", np.allclose(o1[0], o2[2]))
print("위치 0~2의 PE 앞 4성분:\\n", PE[:, :4].round(3))

# 3) 블록 하나의 파라미터는 어디에 몰려 있나? (편향·LayerNorm 제외)
d_model = 768                                  # GPT-2 small
attn = 4 * d_model * d_model                   # Wq, Wk, Wv, Wo
mlp = 2 * d_model * (4 * d_model)              # d → 4d → d
print(f"\\nd_model={d_model}: Attention {attn:,}개, MLP {mlp:,}개 → MLP 비중 {mlp / (attn + mlp):.0%}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 위치 인코딩이 없으면 "고양이가 생선을 먹었다"와 "먹었다 생선을 고양이가"에서 '고양이가'의 출력이 **완전히 같다**(\`True\`) — attention은 단어의 자리만 바꿔 같은 계산을 한다. 사인·코사인 위치 인코딩을 더하면 \`False\`가 된다. 위치 0의 PE는 \`[0, 1, 0, 1]\`로 시작하고 위치가 커질수록 앞쪽 성분(빠른 파동)부터 빠르게 변한다. GPT-2 small 크기에서 MLP가 블록 파라미터의 약 67%(2/3)를 차지한다. **생각해볼 것:** 문장 전체의 출력을 평균낸 벡터(문장 표현)는 위치 인코딩 없이 두 문장에서 같을까, 다를까? 코드로 확인해 보자.
:::

## 토크나이저: BPE {#bpe}

[[diagram:tokenizer-bpe]]

LLM은 사실 글자를 곧바로 읽지 않는다. 문장을 먼저 "토큰"이라는 조각들로 잘게 썬 다음에야 숫자로 바꿔서 처리한다. 이 자르는 규칙을 정하는 것이 토크나이저이고, 오늘날 대부분의 LLM이 쓰는 방식이 BPE(Byte-Pair Encoding)다. 섹션 1에서 언급했듯이 BPE 이전에는 공백이나 형태소 분석기로 자르는 단어 단위(word-level) 토큰화가 표준이었다. 그러나 이 방식은 사전에 없는 새 단어(OOV, Out-Of-Vocabulary)를 만나면 처리할 방법이 없고, 다양한 활용형·오탈자까지 어휘 사전에 전부 담으려면 어휘 크기가 감당하기 어려울 만큼 커진다는 문제가 있었다. BPE는 문자 단위와 단어 단위 사이의 절충안으로, 자주 쓰이는 부분단어(subword)는 통째로 하나의 토큰으로 묶고 희귀한 조합은 더 잘게 쪼갬으로써 이 문제를 완화한다. 아이디어는 뜻밖에 단순하다 — 방대한 텍스트를 놓고, 가장 자주 붙어서 나타나는 문자(또는 조각) 쌍을 찾아 하나로 합치는 과정을 정해둔 횟수만큼 반복한다. 위 그림에서 "low", "lower", "lowest"라는 세 단어가 문자 단위로 쪼개진 상태에서 시작해, 가장 흔한 쌍부터 순서대로 병합되어 결국 "low"라는 조각(subword)이 하나의 토큰으로 굳어지는 과정을 볼 수 있다. 이렇게 자주 나오는 조각은 통째로 하나의 토큰이 되고, 희귀한 단어는 여러 개의 작은 조각으로 쪼개진 채 남는다.

BPE의 병합 규칙이 학습 데이터의 통계를 그대로 반영하다 보니, 실제로 LLM을 쓸 때 체감되는 특이한 현상 세 가지가 여기서 함께 따라 나온다 — ① 한국어는 영어보다 토큰이 많아 같은 문장이라도 비용이 더 크다, ② 철자 세기·숫자 연산이 약한 이유의 일부가 여기 있다, ③ 희귀 단어는 여러 조각으로 쪼개진다. 이 세 가지 현상은 모두 "학습 데이터에 영어가 압도적으로 많았고, 그래서 어휘 병합 규칙도 영어 위주로 만들어졌다"는 하나의 원인에서 갈라져 나온다. 영어는 자주 쓰는 단어가 통째로 하나의 토큰이 되는 경우가 많은 반면, 한국어는 조사와 어미가 계속 붙는 교착어 특성 때문에 같은 뜻이라도 상대적으로 더 많은 토큰으로 쪼개지는 경우가 흔하다 — 그래서 같은 내용을 담은 문장이라도 한국어 쪽의 토큰 수가 더 많아지고, API 비용은 토큰 수에 비례해 매겨지므로 실제로 비용도 더 커진다. 철자를 한 글자씩 세거나("strawberry에 r이 몇 개인가?") 여러 자리 숫자를 정확히 계산하는 데 LLM이 약한 것도 같은 이유의 연장선이다 — 모델은 애초에 "s-t-r-a-w-b-e-r-r-y"라는 개별 글자들을 하나씩 본 적이 없고, "straw"와 "berry" 같은 뭉텅이 토큰만 보았기 때문에, 글자 하나하나를 세는 일이 원리적으로 서툴 수밖에 없다.

BPE가 하는 일을 말로만 듣기보다, 앞서 말한 병합 알고리즘을 그대로 코드로 옮겨서 직접 돌려보는 편이 훨씬 확실하다. 실제 LLM이 쓰는 tiktoken 같은 라이브러리는 브라우저 실행 환경에 없으므로, 위 그림과 똑같이 "low", "lower", "lowest", "newer", "newest"라는 아주 작은 장난감 말뭉치로 병합 규칙을 처음부터 직접 학습시켜보자 — 오히려 이렇게 작은 예제라야 병합이 한 단계씩 진행되는 과정을 눈으로 낱낱이 따라갈 수 있다.

:::info 이 코드에서 처음 나오는 문법 — Counter와 딕셔너리 컴프리헨션
- **\`Counter\`**: \`from collections import Counter\`로 불러오는, "무엇이 몇 번 나왔는지"를 세는 데 특화된 딕셔너리의 사촌이다. \`pairs[(a, b)] += 1\`처럼 값을 더해나가면 각 쌍이 등장한 횟수가 자동으로 누적되고, \`pairs.most_common(1)\`은 가장 많이 등장한 항목 하나를 \`[(쌍, 등장 횟수)]\` 형태로 돌려준다.
- **딕셔너리 컴프리헨션**: \`{tok: idx for idx, tok in enumerate(all_tokens)}\`처럼 \`{키: 값 for ...}\` 형태로 한 줄 만에 딕셔너리를 만드는 문법이다. \`enumerate(리스트)\`는 리스트의 각 원소를 \`(인덱스, 원소)\` 쌍으로 하나씩 꺼내주므로, 이 한 줄로 섹션 1에서 말한 "토큰 $\\to$ 정수 인덱스" 어휘 사전을 그대로 만들 수 있다.
:::

\`\`\`python
# 아주 작은 말뭉치로 BPE 병합 규칙을 직접 학습해보기
from collections import Counter

def train_bpe(words, n_merges):
    # 각 단어를 "글자 하나씩 + 단어 끝 표시(</w>)" 리스트로 쪼갠 상태에서 시작한다.
    # 예: "low" -> ['l', 'o', 'w', '</w>']. </w>가 없으면 "low"의 마지막 'w'와
    # "wide"의 첫 'w'를 병합 알고리즘이 구별하지 못하므로, 단어 경계를 표시해두는 것이다.
    corpus = [list(w) + ["</w>"] for w in words]
    merges = []
    for _ in range(n_merges):
        pairs = Counter()
        for tokens in corpus:
            for i in range(len(tokens) - 1):
                pairs[(tokens[i], tokens[i + 1])] += 1   # 바로 옆에 붙어 나온 조각 쌍의 빈도 세기
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]                # 가장 자주 등장한 쌍 하나
        merges.append(best)
        merged_corpus = []
        for tokens in corpus:
            merged, i = [], 0
            while i < len(tokens):
                if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == best:
                    merged.append(tokens[i] + tokens[i + 1])   # 두 조각을 하나로 합치기
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

print()
seen = set()
for w, tokens in zip(words, corpus):
    if w not in seen:
        print(w, "->", tokens)
        seen.add(w)

# 최종적으로 남은 조각들을 모아 "토큰 -> 정수 인덱스" 어휘 사전(vocab)을 만든다 (섹션 1 참고)
all_tokens = sorted({tok for tokens in corpus for tok in tokens})
vocab = {tok: idx for idx, tok in enumerate(all_tokens)}
print(f"\\n어휘 사전 크기 |V| = {len(vocab)}")
print(vocab)
\`\`\`

실행해보면 1번째 병합이 \`'w'+'e'\`인 것부터 눈에 띈다 — "newer"와 "newest"에 공통으로 들어있는 "we"가 이 작은 말뭉치 안에서 가장 자주 붙어 나오는 쌍이기 때문이다(빈도가 가장 큰 쌍부터 합친다는 규칙을 그대로 따른 결과다). 두 번 반복된 "low"는 6번째 병합에서 \`'low'\`, 7번째 병합에서 \`'low</w>'\`라는 조각 하나로 완전히 뭉쳐지지만("low" 출력 결과가 \`['low</w>']\` 한 조각인 것을 확인해보라), "lower"는 \`['lo', 'wer</w>']\`로, "lowest"는 \`['lo', 'wes', 't', '</w>']\`로 서로 다르게 쪼개진다 — 자주 나오는 만큼 우선적으로 뭉쳐지는 조각과, 병합 순서상 뒤로 밀려 상대적으로 잘게 남는 조각이 갈린다는 것을 직접 눈으로 확인할 수 있다.

실제 tiktoken 같은 라이브러리는 이 코드와 완전히 같은 병합 알고리즘을 단지 (1) 몇 개가 아니라 수백 GB의 실제 텍스트에 대해, (2) 몇 번이 아니라 수만~십만 번(cl100k_base 기준 약 10만 개) 반복해서 학습해둔 것뿐이다. 학습에 쓰인 텍스트가 압도적으로 영어 위주였기 때문에, 위에서 "결과적 현상"으로 정리했던 한국어 토큰 수 증가나 숫자·철자 처리의 어려움도 결국 지금 우리가 손으로 확인한 것과 같은 원리(자주 등장한 조합일수록 먼저, 더 크게 뭉쳐진다)에서 비롯된다. 실제 라이브러리로 이 현상을 눈으로 직접 재현해보고 싶다면 아래 코드를 Colab에 붙여넣어 실행해보라.

\`\`\`python-colab
# tiktoken으로 실제 토큰화 결과 관찰 — Colab에서 실행 (브라우저에서는 실행되지 않음)
# !pip install tiktoken
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
for s in ["Hello world", "안녕하세요 반갑습니다", "strawberry", "12345 + 67890"]:
    ids = enc.encode(s)
    print(s, len(ids), [enc.decode([i]) for i in ids])
\`\`\`

[[practice]]

### 실습 — 학습된 병합 규칙으로 새 단어를 토큰화하기

이렇게 학습된 병합 규칙(\`merges\`)은 훈련 데이터에 없던 새 단어에도 그대로 적용할 수 있다. 아래 코드는 위의 학습 과정을 함수로 정리한 뒤, 병합 규칙을 **학습된 순서대로** 새 단어에 적용한다(encode). 마지막 부분은 GPT 계열이 쓰는 byte-level BPE의 출발점인 UTF-8 바이트 수를 비교한다.

\`\`\`python
from collections import Counter

def merge_pair(tokens, pair):
    merged, i = [], 0
    while i < len(tokens):
        if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == pair:
            merged.append(tokens[i] + tokens[i + 1]); i += 2
        else:
            merged.append(tokens[i]); i += 1
    return merged

def train_bpe(words, n_merges):
    corpus = [list(w) + ["</w>"] for w in words]
    merges = []
    for _ in range(n_merges):
        pairs = Counter((t[i], t[i + 1]) for t in corpus for i in range(len(t) - 1))
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]
        merges.append(best)
        corpus = [merge_pair(t, best) for t in corpus]
    return merges

def bpe_encode(word, merges):
    tokens = list(word) + ["</w>"]
    for pair in merges:                      # 학습 때 병합된 순서 그대로 적용한다
        tokens = merge_pair(tokens, pair)
    return tokens

words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]
merges = train_bpe(words, n_merges=8)

# 1) 학습 때 본 적 없는 단어도 아는 조각으로 쪼개진다 (OOV 완화)
for w in ["slow", "lowering", "newest", "banana"]:
    print(f"{w:9s} -> {bpe_encode(w, merges)}")

# 2) GPT 계열의 byte-level BPE는 UTF-8 "바이트"에서 출발한다
#    영어 알파벳은 1글자 = 1바이트, 한글은 1글자 = 3바이트
for s in ["hello", "안녕하세요", "strawberry"]:
    print(f"{s!r}: 글자 {len(s)}개, UTF-8 바이트 {len(s.encode('utf-8'))}개")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** "slow"는 학습 데이터에 한 번도 등장하지 않았는데도 \`['s', 'low</w>']\`로, 학습 때 만들어진 "low" 조각을 재사용해 잘린다 — BPE가 "본 적 없는 단어라도 처리를 못 하는 일은 없다(OOV 완화)"고 말하는 원리다. "lowering"은 \`['lo', 'wer', 'i', 'n', 'g', '</w>']\`처럼 앞부분만 학습된 조각을 쓰고, 전혀 다른 "banana"는 글자 단위로 흩어진다. 한글 5글자는 UTF-8로 15바이트라, 바이트에서 출발하는 토크나이저에서는 병합이 충분히 학습되지 않은 한국어가 더 많은 토큰으로 쪼개지기 쉽다. **해볼 것:** \`words\`에 \`"lowering"\`을 여러 번 넣고 \`n_merges\`를 15로 늘려 다시 학습하면 "lowering"의 토큰 수가 어떻게 줄어드는가?
:::

## 생성할 때의 Transformer: KV 캐시와 RoPE {#kv-cache-rope}

지금까지 다룬 Self-Attention 계산은 전부 학습(training) 시점의 이야기다. 학습할 때는 정답 문장 전체가 이미 손에 쥐어져 있으므로, n개 토큰짜리 문장을 통째로 행렬에 밀어넣고 Q, K, V를 한 번에 계산해 $(n \\times n)$ attention을 단 한 방에 뽑아낸다. 그런데 실제로 ChatGPT 같은 모델이 답을 "타이핑하듯" 한 토큰씩 뱉어낼 때(추론, inference)는 사정이 전혀 다르다 — 다음에 올 토큰이 아직 존재하지 않으므로, 그 토큰을 만들어내려면 지금까지 나온 토큰들만 가지고 매 스텝마다 Self-Attention을 다시 계산해야 한다.

문제는 여기서 생긴다. 아무 최적화도 하지 않는다면, 101번째 토큰을 생성할 때 모델은 1번째부터 100번째 토큰까지의 Key와 Value를 처음부터 다시 계산한 뒤에야 101번째 토큰의 attention을 구할 수 있다. 그런데 곰곰이 따져보면 이건 순전히 낭비다 — causal mask 때문에 각 토큰의 K, V는 오직 자기 자신의 표현과 $W_k$, $W_v$로만 정해질 뿐 뒤에 어떤 토큰이 새로 등장하는지는 전혀 참고하지 않는다(causal mask 때문에 앞 토큰들의 계산은 뒤 토큰의 영향을 받지 않는다). 즉 1번째~100번째 토큰의 Key, Value는 101번째 토큰이 뒤에 하나 더 붙는다고 해서 눈곱만큼도 바뀌지 않는데도, 최적화 없이 구현하면 매 스텝마다 이걸 처음부터 다시 계산하는 셈이다. 결과적으로 시퀀스 길이에 비례하는 계산량이 매 생성 스텝마다 반복되는 구조적인 낭비가 발생한다.

KV 캐시(KV cache)는 정확히 이 낭비를 없애는 장치다. 아이디어는 단순하다 — 각 스텝에서 계산한 Key와 Value를 버리지 않고 레이어별로 메모리에 저장(cache)해 둔다. 다음 스텝에서는 새로 들어온 토큰 하나에 대해서만 Query·Key·Value를 새로 계산하고, 이 새 Key와 Value를 캐시 뒤에 이어붙인 다음, 새 토큰의 Query 하나만 "캐시에 쌓여 있는 모든 K, V"와 대조하면 그걸로 끝이다. 계산량으로 보면 매 스텝마다 지금까지의 토큰 수만큼($O(n)$)의 K, V를 다시 만드는 대신, 새 토큰 한 개 분량($O(1)$)만 계산하면 되므로, 문장이 길어질수록 이 절약분은 점점 크게 벌어진다.

회의에 비유하면 이해가 쉽다. 이미 지나간 발언들(과거 토큰)의 요지는 회의록(K, V 캐시)에 적혀 있다. 새 안건(새 토큰의 Query)이 올라올 때마다 지금까지의 회의 전체를 처음부터 다시 녹음해 받아 적을 필요는 없다. 회의록을 펼쳐 새 안건과 관련된 부분을 찾아 읽고(새 Query와 캐시된 K의 내적), 이번 발언의 요지 한 줄만 회의록 끝에 덧붙이면(새 K, V 추가) 된다. 매 스텝 새로 계산하는 것은 새 토큰의 Q, K, V뿐이고, 과거의 K, V는 저장된 것을 그대로 읽는다.

KV 캐시가 절약해주는 계산량도 코드로 눈에 담아보자. 실제 모델을 돌릴 필요 없이, 매 생성 스텝마다 "캐시 없이 처음부터 다시 계산해야 하는 K, V 원소 개수"와 "캐시가 있을 때 새로 계산하면 되는 원소 개수"만 세어봐도 격차가 스텝이 지날수록 벌어지는 것을 바로 확인할 수 있다.

\`\`\`python
# KV 캐시 유무에 따른 재계산 비용 비교
n_layers, n_heads, head_dim = 32, 32, 128

for t in range(1, 11):  # t번째 토큰을 생성하는 스텝
    no_cache = t * n_layers * n_heads * head_dim * 2       # 1~t번 토큰의 K,V를 매번 전부 재계산
    with_cache = 1 * n_layers * n_heads * head_dim * 2     # 새 토큰 1개 분량만 계산, 나머지는 캐시 재사용
    print(f"step {t:2d}: no-cache={no_cache:>10,}개  with-cache={with_cache:>7,}개  절약={no_cache - with_cache:>10,}개")
\`\`\`

10번째 스텝만 봐도 캐시가 없을 때는 첫 스텝의 10배에 달하는 K, V를 다시 계산하고 있지만, 캐시가 있으면 매 스텝 계산량이 토큰 하나 분량으로 항상 고정된다. 문장이 수백~수천 토큰까지 길어지는 실제 대화라면 이 차이는 결코 무시할 수 없는 크기로 벌어진다.

:::example KV 캐시는 메모리를 얼마나 먹는가
대략적인 감을 잡기 위해, 레이어 32개, 헤드 32개, 헤드당 차원 128인 모델을 시퀀스 길이 2048, 배치 크기 1로 돌린다고 하자. 캐시해야 할 것은 레이어마다, 헤드마다, 토큰 하나마다 Key와 Value 벡터(각각 128차원) 두 개다. 전체 원소 개수는 \`레이어 수 × 헤드 수 × 헤드당 차원 × 시퀀스 길이 × 2(K와 V) × 배치 크기\` $= 32 \\times 32 \\times 128 \\times 2048 \\times 2 \\times 1 \\approx$ **5억 3천만 개**다. 여기에 흔히 쓰는 fp16(원소 하나당 2바이트)을 곱하면 약 **1.07GB**가 나온다. 배치 크기를 8로 늘리면(즉 동시에 8명이 대화 중이면) 이 숫자는 그대로 8배로 불어나 8GB를 넘는다 — 실제 서비스에서 "동시 사용자가 늘어날수록 GPU 메모리가 모자라진다"는 현상의 정체 상당 부분이 바로 이 KV 캐시다. 연산량(FLOPs)을 아끼는 대신 메모리를 그만큼 소비하는, 전형적인 시간-공간 트레이드오프인 셈이다.
:::

### RoPE — 회전으로 상대 거리를 담는 위치 인코딩

위치 인코딩 쪽에서도 이런 실용적 요구와 맞물려 자리 잡은 방식이 있는데, 섹션 7에서 잠깐 언급했던 RoPE(Rotary Position Embedding, 회전 위치 인코딩)다. 원 논문의 사인·코사인 위치 인코딩이나 학습형 위치 임베딩은 "너는 5번째 자리다"라는 절대 번호표를 임베딩에 더해주는 방식이었다. RoPE의 방식은 다르다 — 벡터를 더하는 대신, 각 토큰의 Query와 Key 벡터를 그 토큰의 위치 인덱스에 비례하는 각도만큼 회전 행렬로 회전시킨다. 위치 $m$의 Query를 각도 $m\\theta$만큼, 위치 $n$의 Key를 각도 $n\\theta$만큼 회전시킨 뒤 내적을 구하면, 회전의 성질(내적이 두 벡터 사이의 상대 각도에만 의존한다는 성질)에 의해 그 결과는 $m\\theta$, $n\\theta$ 각각의 절댓값이 아니라 두 각도의 차이 $(m-n)\\theta$, 즉 두 토큰 사이의 상대적 거리에만 의존하는 값으로 정리된다. 그 결과 모델은 "이 토큰이 정확히 몇 번째인지"는 attention 점수 계산에 직접 담고 있지 않지만 "이 토큰이 저 토큰보다 몇 칸 뒤에 있는지"는 정확히 반영하게 되고, 이 상대 거리 정보는 학습 때 보지 못한 더 긴 문장에도 비교적 안정적으로 일반화된다는 장점 덕분에 오늘날 대부분의 최신 LLM이 RoPE를 채택하고 있다.

시계로 비유해 보자. 두 사람이 각자 시계 사진을 한 장씩 보여주면, 우리는 사진 속 바늘 각도의 **차이**만으로 두 시각이 몇 시간 떨어져 있는지 알 수 있다. 두 사람이 똑같이 3시간씩 늦게 찍었더라도(두 바늘을 같은 각도만큼 더 돌려도) 그 차이는 변하지 않는다. RoPE에서 각 토큰의 Query와 Key는 위치만큼 돌아간 시계 바늘이고, attention 점수(내적)는 두 바늘 사이의 각도, 즉 두 토큰의 **상대 거리**에만 반응한다.

[[practice]]

### 실습 — KV 캐시가 "같은 답을 더 싸게" 내는지, RoPE가 상대 거리만 보는지 검증하기

\`\`\`python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis, keepdims=True)

rng = np.random.default_rng(0)
n, d = 8, 16
X = rng.normal(size=(n, d))                     # 이미 만들어진 토큰 8개의 임베딩
Wq, Wk, Wv = (rng.normal(size=(d, d)) / np.sqrt(d) for _ in range(3))

# 1) 학습 방식: 문장 전체를 한 번에, causal mask로 계산
Q, K, V = X @ Wq, X @ Wk, X @ Wv
S = np.where(np.triu(np.ones((n, n)), 1) == 1, -1e9, Q @ K.T / np.sqrt(d))
full = softmax(S) @ V

# 2) 생성 방식 + KV 캐시: 토큰이 하나씩 들어올 때마다 새 토큰의 q, k, v만 계산한다
K_cache, V_cache, outputs = [], [], []
kv_computed = 0
for t in range(n):
    x = X[t]
    q, k, v = x @ Wq, x @ Wk, x @ Wv            # 새 토큰 하나 분량만 계산
    K_cache.append(k); V_cache.append(v); kv_computed += 1
    Kc, Vc = np.stack(K_cache), np.stack(V_cache)   # 지금까지의 "회의록"
    a = softmax(Kc @ q / np.sqrt(d))                  # 마스크가 필요 없다: 캐시에는 과거만 있다
    outputs.append(a @ Vc)
print("KV 캐시로 한 토큰씩 계산 == 한 번에 계산:", np.allclose(np.stack(outputs), full))
print("K,V 계산 횟수 — 캐시 사용:", kv_computed, "/ 캐시 없이 매 스텝 재계산:", sum(range(1, n + 1)))

# 3) RoPE: (x, y) 쌍을 위치 × θ 만큼 회전시킨다
def rope(v, pos, theta=0.3):
    out = v.copy()
    for i in range(0, len(v), 2):
        ang = pos * theta / (10000 ** (i / len(v)))   # 성분 쌍마다 회전 속도가 다르다
        c, s = np.cos(ang), np.sin(ang)
        out[i], out[i + 1] = c * v[i] - s * v[i + 1], s * v[i] + c * v[i + 1]
    return out

q, k = rng.normal(size=d), rng.normal(size=d)
print("\\n위치 (m, n)      m-n   회전 후 q·k")
for m, p in [(5, 3), (12, 10), (102, 100), (3, 5), (10, 5)]:
    print(f"({m:3d}, {p:3d})  {m - p:5d}   {rope(q, m) @ rope(k, p):+.6f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 토큰을 하나씩 넣으며 KV 캐시로 계산한 출력이 문장 전체를 causal mask로 한 번에 계산한 출력과 \`allclose\`로 **완전히 같다** — 캐시는 근사가 아니라 같은 계산의 재배치다. 8토큰을 생성하는 동안 K, V 계산은 캐시 없이 36번, 캐시로 8번이다. RoPE 표에서 위치 쌍 (5, 3), (12, 10), (102, 100)은 거리가 모두 2라서 점수가 소수점 여섯째 자리까지 같고, 거리가 다른 (3, 5)나 (10, 5)는 값이 다르다. **해볼 것:** RoPE 대신 절대 위치 벡터를 \`q + pe[m]\`, \`k + pe[n]\`처럼 더하는 방식으로 바꿔 같은 표를 만들어보자. 거리가 같아도 점수가 달라지는가?
:::
`,
  sections,
  quiz: [
    { id: "w5-q1", question: "n=1000, d_model=512 일 때 attention 점수 행렬의 크기와 문맥이 2배가 되면 비용은?" },
    { id: "w5-q2", question: "Causal mask가 없으면 학습 시 어떤 부정행위가 발생하는가?" },
    { id: "w5-q3", question: "$\\sqrt{d_k}$ 스케일링을 생략하면 어떤 문제가 생기는가? (분산과 softmax 포화의 관점에서 설명하라)" },
    { id: "w5-q4", question: "멀티헤드가 단일 헤드(같은 총 차원)보다 유리한 이유는? 여러 전문가 비유를 사용해 설명하라." },
    { id: "w5-q5", question: "한국어 문장이 영어보다 토큰이 많은 이유와 비용 영향은?" },
    { id: "w5-q6", question: '위치 인코딩이 없다면 Self-Attention은 왜 "고양이가 생선을 먹었다"와 "먹었다 생선을 고양이가"를 구별하지 못하는가?' },
    { id: "w5-q7", question: "도서관 비유에서 Q, K, V는 각각 무엇에 대응하는가? 그리고 왜 최종적으로 가져오는 것은 Key가 아니라 Value인가?" },
    { id: "w5-q8", question: "Transformer 블록 안에서 Attention과 MLP은 각각 어떤 역할을 나누어 맡는다고 볼 수 있는가?" },
    { id: "w5-q9", question: "추론(생성) 중 KV 캐시가 없다면 101번째 토큰을 생성할 때 정확히 어떤 계산이 낭비되는가? 그리고 왜 그 계산 결과가 이전 스텝과 똑같이 나오는가?" },
    { id: "w5-q10", question: "KV 캐시가 저장하는 것은 무엇이고, 매 스텝 새로 계산해야 하는 것은 무엇인가? 회의록 비유로 설명하라." },
    { id: "w5-q11", question: "RoPE가 절대 위치 대신 상대 위치(거리)를 인코딩한다는 것을 시계 바늘 비유로 설명하라." },
    { id: "w5-q12", question: "One-hot 인코딩의 두 가지 한계는 무엇이며, Word Embedding은 각각을 어떻게 해결하는가?" },
    { id: "w5-q13", question: "Word2Vec의 Skip-gram 방식은 무엇을 보고 무엇을 예측하도록 학습하는가? 그리고 이 학습이 끝나면 왜 의미가 비슷한 단어들의 벡터가 서로 가까워지는가?" },
    { id: "w5-q14", question: "RNN의 재귀 수식 $h_t = f(Wx_t+Uh_{t-1}+b)$에서 '파라미터 공유'란 무엇을 의미하며, 이것이 왜 가변 길이 시퀀스 처리를 가능하게 하는가?" },
    { id: "w5-q15", question: "RNN의 장기 의존성(long-term dependency) 문제란 무엇인가? 백 토큰 떨어진 두 단어 사이의 관계를 예로 들어 설명하라." },
    { id: "w5-q16", question: "BPTT(Backpropagation Through Time)에서 시점 T의 손실을 시점 k까지 전파하려면 야코비안을 몇 번 곱해야 하는가? 그리고 이것이 왜 기울기 소실/폭발을 특히 심하게 만드는가?" },
    { id: "w5-q17", question: "LSTM의 forget gate, input gate, output gate는 각각 무엇을 결정하는가?" },
    { id: "w5-q18", question: "LSTM의 셀 상태 업데이트 식 $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t$이 RNN의 $h_t=f(Wh_{t-1}+\\cdots)$보다 기울기 소실에 덜 취약한 이유를 구조적으로 설명하라." },
    { id: "w5-q19", question: "GRU는 LSTM보다 게이트와 상태를 몇 개로, 어떻게 줄였는가? 이 차이가 실무에서 어떤 트레이드오프를 만드는가?" },
    { id: "w5-q20", question: "Seq2Seq에서 Encoder와 Decoder는 각각 어떤 역할을 맡는가? 그리고 Teacher Forcing이 학습 안정성에 기여하는 이유는 무엇인가?" },
    { id: "w5-q21", question: "Seq2Seq의 '정보 병목(bottleneck)' 문제란 정확히 무엇이며, 이것이 왜 Attention 메커니즘 등장의 직접적인 계기가 되었는가?" },
    { id: "w5-q22", question: "RNN에서 LSTM/GRU로, 다시 Seq2Seq+Attention을 거쳐 Self-Attention/Transformer로 이어지는 발전 흐름을, 각 단계가 해결한 핵심 문제를 중심으로 한 문단으로 요약하라." },
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "ChatGPT는 문장 안에서 어떻게 관련 있는 단어를 찾아내는가?"', hint: "오늘 배운 내용을 스스로의 언어로 한 문장 질문으로 바꿔 적어보세요." },
    { label: "② 키워드 8개", hint: "본문에 나온 용어 중 남에게 설명할 수 있는 것 8개를 쉼표로 구분해 적어보세요." },
    { label: "③ 그림 — 디코더 블록 전체 + 5×5 attention 행렬(마스크 표시)", hint: "마스크로 가려진(항상 0인) 칸이 어디인지 표시해보세요." },
    { label: "④ 수식 — softmax(QKᵀ/√dk)V, 각 행렬의 shape", hint: "n(토큰 수), dk를 이용해 Q, K, V, QKᵀ, 출력의 shape을 각각 적어보세요." },
    { label: "⑤ 설명하기 — 도서관 사서 비유로 Q, K, V를 설명 (7문장)", hint: "Query=찾는 주제, Key=책등 색인표, Value=책 내용이라는 대응을 문장 안에 자연스럽게 녹여보세요." },
    { label: "⑥ 막힌 곳 / 보완", hint: "책이나 강의를 다시 펼쳐 확인한 뒤, 다른 색 펜으로 보완한 내용을 적어보세요." },
  ],
  assignmentMd: `
### 필수 「나만의 미니 GPT 블록」 (브라우저 실습 코드 + Colab)

1. **멀티헤드 causal self-attention 구현 (NumPy)**: 「멀티헤드 Attention과 Causal Mask」 섹션의 코드를 참고해 $W^O$까지 포함한 함수를 직접 작성하라. 모든 중간 텐서(Q, K, V, head 분할 후, 점수, 가중치, concat, 출력) 옆에 shape을 주석으로 적는다.
2. **정확성 검증 3종**: (a) head를 하나씩 따로 계산해 이어붙인 결과와 \`np.allclose\`로 일치, (b) 마지막 토큰을 바꿔도 앞 토큰들의 출력이 변하지 않음(causal 테스트), (c) Colab에서 PyTorch로 같은 계산을 직접 작성(\`F.scaled_dot_product_attention\` 없이 softmax를 직접)하고, 같은 가중치를 넣었을 때 NumPy 결과와 \`allclose\`임을 보여라.
3. **숫자 예제 재현과 변형**: 「Self-Attention」 섹션의 숫자 예제(Query $=[1,1,0,1]$, $d_k=4$)를 코드로 재현한 뒤, Query를 최소 2가지 다른 값(예: "맛있게"의 Key와 같은 $[0,0,1,0]$)으로 바꿔 가중치와 출력이 어떻게 달라지는지 표로 정리하고 이유를 설명하라.
4. **관찰 실험**: 토큰 6개 이상의 입력으로 attention 가중치 행렬을 (i) 마스크 유무, (ii) $\\sqrt{d_k}$ 스케일링 유무의 네 조합으로 출력하거나 히트맵으로 그리고, 차이를 3문장 이상으로 서술하라. $d_k$를 키울 때 (ii)의 차이가 어떻게 커지는지도 보여라.
5. **논문 리포트 (1쪽)**: "Attention Is All You Need"(특히 3장)를 읽고 (a) 가장 놀라웠던 설계 선택과 그 이유, (b) 2017년 이후 바뀐 부분 두 가지 이상(RoPE, Pre-LN, GQA, SwiGLU 등 중 선택)을 조사해 "무엇이, 왜" 바뀌었는지 정리하라.

**제출물:** 노트북(.ipynb) 또는 Colab 공유 링크 + 리포트(PDF/Markdown). 과제 페이지에서 파일을 올리거나 링크를 붙여 넣는다.

### 심화 (선택)

- 완성한 블록을 2층으로 쌓아 문자 단위 언어모델을 학습하고(Karpathy "Let's build GPT" 참고), loss 곡선과 학습 전후 생성 샘플 5개를 비교하라.
- BPE를 직접 구현(50줄 내외)해 한국어·영어 문장의 토큰 수를 tiktoken 결과와 비교하라.
- KV 캐시가 있는 생성 루프를 구현해 토큰 수에 따른 생성 시간을 캐시 유무로 측정하라.

### 채점 기준 (10점)

| 항목 | 점수 |
| --- | --- |
| 구현 정확성 (검증 3종: head 분할 allclose, causal 테스트, PyTorch 일치) | 3 |
| shape 추적과 설명 | 2 |
| 숫자 예제 재현·변형 비교 | 2 |
| 관찰 실험 (마스크·스케일링) | 1 |
| 논문 리포트 | 2 |
`,
  assignmentMaxScore: 10,
  dueNote: "제출: 일요일 23:59 · 노트북(.ipynb/Colab 링크) + 논문 리포트",
};

export default week5;
