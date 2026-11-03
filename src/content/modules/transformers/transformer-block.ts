import { defineLesson, md } from "../../kit";
import exercises from "./labs/transformer-block";

export default defineLesson({
  id: "transformer-block",
  title: "트랜스포머 디코더 블록",
  tier: "core",
  concepts: ["attention-transformer"],
  goal: "마스크 없는 self-attention이 순열 등변 연산이라 위치 정보가 필요한 이유와 causal mask가 이를 바꾸는 방식을 설명하고, GPT형 디코더 블록에서 attention, MLP, 잔차 연결, LayerNorm이 맡는 역할을 코드로 확인한다.",
  why: "GPT를 포함한 현재의 LLM은 이 레슨의 디코더 블록을 수십 개 쌓은 구조다([[lesson:llm-architectures]]). 블록의 구성 요소별 역할을 알아야 모델의 파라미터 수와 계산량을 계산할 수 있고([[lesson:transformer-params]]), 미니 GPT 블록을 직접 구현할 수 있다.",
  body: md`
[[diagram:transformer-decoder-block]]

### 인코더와 디코더

원 논문(Vaswani 외, 2017)의 Transformer는 번역을 위한 인코더-디코더 구조다. 인코더는 입력 문장 전체를 한 번에 읽어 토큰마다 표현을 계산하고, 디코더는 인코더의 표현을 참조하며 출력 문장을 한 토큰씩 생성한다. GPT 계열은 디코더만, BERT는 인코더만 쓴다. 이 레슨은 GPT형 디코더 블록을 다룬다.

\`\`\`image
src: /images/week5/transformer.png
alt: Attention Is All You Need 논문의 원본 Transformer 구조도
caption: 왼쪽이 인코더, 오른쪽이 디코더다. 블록 안의 Multi-Head Attention과 Feed Forward가 이 레슨의 attention과 MLP에 해당한다.
credit: Yuening Jia, CC BY-SA 3.0, Wikimedia Commons (원 도식: Vaswani et al., 2017)
width: 700
height: 630
maxWidth: 600
\`\`\`

### 위치 정보가 필요한 이유

마스크 없는 self-attention은 **순열 등변**(permutation-equivariant) 연산이다. 토큰의 순서를 치환 $P$로 바꾸면 출력도 같은 $P$로 바뀔 뿐, 각 토큰의 출력값은 그대로다.

$$\text{Attn}(PX) = P\,\text{Attn}(X)$$

$Q$, $K$, $V$는 토큰마다 같은 가중치로 계산되고, 토큰 쌍 $(i, j)$의 내적값은 순서를 바꿔도 같기 때문이다. 이는 출력 자체가 순서와 관계없이 같은 **순열 불변**(permutation-invariant)과는 다르다. 순열 불변은 출력을 평균이나 합으로 모아 순서를 버렸을 때의 성질이다. 순열 등변이므로 위치 정보가 없으면 "고양이가 생선을 먹었다"와 "먹었다 생선을 고양이가"에서 "고양이가"의 출력이 같고, 각 토큰의 출력만으로는 그 토큰의 위치를 알 수 없다. 그래서 토큰 임베딩에 위치 벡터를 더한다([[lesson:tokenization]]).

\`\`\`python
import numpy as np

def attention(X, Wq, Wk, Wv):               # 마스크 없는 단일 헤드 attention
    S = (X @ Wq) @ (X @ Wk).T / np.sqrt(Wk.shape[1])
    A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)
    return A @ (X @ Wv)

def sinusoidal_pe(n, d):
    angle = np.arange(n)[:, None] / 10000 ** (np.arange(0, d, 2)[None, :] / d)
    pe = np.zeros((n, d))
    pe[:, 0::2], pe[:, 1::2] = np.sin(angle), np.cos(angle)
    return pe

rng = np.random.default_rng(0)
d = 8
emb = {w: rng.normal(size=d) for w in ["고양이가", "생선을", "먹었다"]}
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))
s1 = np.stack([emb["고양이가"], emb["생선을"], emb["먹었다"]])
s2 = np.stack([emb["먹었다"], emb["생선을"], emb["고양이가"]])   # 순서를 뒤집은 문장

# '고양이가'의 출력: s1의 0번 행과 s2의 2번 행
print("위치 정보 없이 같은가?", np.allclose(attention(s1, Wq, Wk, Wv)[0], attention(s2, Wq, Wk, Wv)[2]))   # True
pe = sinusoidal_pe(3, d)
print("위치 벡터를 더하면 같은가?", np.allclose(attention(s1 + pe, Wq, Wk, Wv)[0], attention(s2 + pe, Wq, Wk, Wv)[2]))   # False
\`\`\`

[[diagram:pe-order-test]]

GPT 같은 디코더는 causal mask 때문에 $i$번째 토큰이 자기 앞의 토큰만 참조한다. 순서를 바꾸면 각 토큰이 참조하는 토큰의 집합이 달라지므로 순열 등변성이 깨진다. 실제로 위치 인코딩 없이(NoPE) 학습한 디코더도 위치 정보를 어느 정도 학습한다는 보고가 있다(Haviv 외, 2022). 그래도 위치 정보를 따로 넣는 편이 학습이 안정적이고 긴 문맥에서 유리하므로, 대부분의 모델은 위치 인코딩(현재는 주로 RoPE)을 쓴다.

### Attention과 MLP

attention 층에서는 각 토큰이 다른 토큰들의 값 벡터를 가중합해 정보를 가져온다. 블록 안에서 토큰 사이에 정보가 전달되는 곳은 attention뿐이다. 그 뒤의 **MLP**(2층 완전연결 신경망, 보통 $d \to 4d \to d$)는 같은 가중치로 토큰마다 따로 표현을 변환한다. 블록 파라미터의 약 2/3가 MLP에 있으며, 해석 가능성 연구에서는 사실 관계에 대한 정보가 주로 MLP의 가중치에 저장된다고 보고하기도 한다(Meng 외, 2022).

[[diagram:attention-mlp-roles]]

### 잔차 연결과 LayerNorm

블록에는 attention과 MLP 외에 두 구성 요소가 반복된다.

- **잔차 연결**: 각 층의 출력을 입력에 더한다. $h = x + \text{Attention}(x)$로 쓰면 층은 입력에 더할 변화량만 학습하고, 역전파에서 기울기가 덧셈 경로로 전달되어 블록을 수십 개 쌓아도 기울기가 소실되지 않는다([[lesson:dropout-residual]]).
- **LayerNorm**: 토큰 하나의 $d$개 성분으로 평균과 분산을 계산해 정규화하고, 학습되는 $\gamma$, $\beta$를 적용한다. 토큰마다 따로 정규화하므로 배치 크기나 문장 길이에 영향을 받지 않는다([[lesson:normalization-layers]]).

GPT 계열은 각 층의 **앞에** 정규화를 두는 Pre-LN 방식을 쓴다. 블록 하나는 다음 두 식이다.

\`\`\`math
h = x + \text{Attention}(\text{LN}(x)), \qquad \text{out} = h + \text{MLP}(\text{LN}(h))
\`\`\`

\`\`\`python
import numpy as np

def layer_norm(x, eps=1e-5):
    mu = x.mean(-1, keepdims=True)           # 토큰(행)마다 d개 성분의 평균과 분산
    var = x.var(-1, keepdims=True)
    return (x - mu) / np.sqrt(var + eps)     # 학습되는 γ, β는 생략

def causal_attention(x, Wq, Wk, Wv, Wo):
    S = (x @ Wq) @ (x @ Wk).T / np.sqrt(x.shape[1])
    S = np.where(np.triu(np.ones_like(S), 1) == 1, -1e9, S)   # 뒤쪽 토큰을 가린다
    A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)
    return (A @ (x @ Wv)) @ Wo

def mlp(x, W1, W2):
    return np.maximum(0, x @ W1) @ W2        # d → 4d → d (활성화 함수는 ReLU로 단순화)

rng = np.random.default_rng(0)
n, d = 4, 8
x = rng.normal(size=(n, d))
Wq, Wk, Wv, Wo = (rng.normal(size=(d, d)) * 0.3 for _ in range(4))
W1, W2 = rng.normal(size=(d, 4 * d)) * 0.3, rng.normal(size=(4 * d, d)) * 0.3

h = x + causal_attention(layer_norm(x), Wq, Wk, Wv, Wo)   # ① 정규화 → attention → 잔차 연결
out = h + mlp(layer_norm(h), W1, W2)                       # ② 정규화 → MLP → 잔차 연결
print("입력", x.shape, "→ attention 뒤", h.shape, "→ 블록 출력", out.shape)
print("LayerNorm 뒤 토큰별 평균:", layer_norm(x).mean(-1).round(3) + 0.0)
print("LayerNorm 뒤 토큰별 표준편차:", layer_norm(x).std(-1).round(3))
\`\`\`

입력, attention 뒤, 블록 출력의 모양이 모두 $(4, 8)$로 같으므로 같은 블록을 원하는 수만큼 쌓을 수 있다. LayerNorm을 거친 뒤에는 토큰마다 평균이 0, 표준편차가 1이다. 블록을 $N$개 쌓은 뒤 마지막에 LayerNorm, 선형층($d \to |V|$), softmax를 차례로 적용해 다음 토큰의 확률을 계산한다.
`,
  checks: [
    {
      key: "c1",
      question: "위치 정보 없이 마스크 없는 self-attention에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면 어떻게 되는가?",
      choices: ["두 문장에서 각 단어의 출력 벡터가 같고, 자리만 바뀐다", "항상 오류가 난다", "두 번째 문장의 출력이 모두 0이 된다", "첫 단어의 출력만 같다"],
      answer: 0,
      explanation: "마스크 없는 attention은 순열 등변이다. 입력 순서를 $P$로 바꾸면 출력도 $P$로 바뀔 뿐 각 토큰의 출력값은 같다($\\text{Attn}(PX) = P\\,\\text{Attn}(X)$). 그래서 각 토큰의 출력만으로는 위치를 알 수 없다. 출력 자체가 같은 순열 불변과는 구별한다.",
    },
    {
      key: "c2",
      question: "Transformer 블록의 MLP에 대한 설명으로 옳은 것은?",
      choices: [
        "토큰 사이에 정보를 전달한다",
        "같은 가중치로 토큰마다 따로 표현을 변환하며, 보통 $d \\to 4d \\to d$ 구조로 블록 파라미터의 약 2/3를 차지한다",
        "위치 인코딩을 계산한다",
        "softmax로 가중치를 만든다",
      ],
      answer: 1,
      explanation: "토큰 사이의 정보 전달은 attention이, 토큰마다의 표현 변환은 MLP가 한다. $d = 768$일 때 MLP는 블록 파라미터의 약 67%다.",
    },
    {
      key: "c3",
      question: "GPT 계열이 원래 Transformer에서 사용하는 부분은?",
      choices: ["인코더만", "디코더만(causal self-attention 블록을 쌓는다)", "인코더와 디코더 모두", "임베딩 층만"],
      answer: 1,
      explanation: "GPT는 디코더만, BERT는 인코더만 쓴다.",
    },
    {
      key: "c4",
      question: "위치 정보 없이 causal mask를 쓴 디코더에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면 '고양이가'의 출력은?",
      choices: [
        "마스크가 없을 때처럼 두 문장에서 같다",
        "달라진다. 첫 문장에서는 자기 자신만, 둘째 문장에서는 세 단어를 모두 참조하기 때문이다",
        "두 문장 모두 0이 된다",
        "causal mask는 위치 인코딩이 있어야만 동작한다",
      ],
      answer: 1,
      explanation: "causal mask는 각 토큰이 참조하는 범위를 위치에 따라 다르게 만들어 순열 등변성을 깬다. 그래서 위치 인코딩이 없는(NoPE) 디코더도 위치 정보를 어느 정도 학습한다. 그래도 대부분의 모델은 학습 안정성과 긴 문맥에서의 성능 때문에 위치 인코딩(현재는 주로 RoPE)을 쓴다.",
    },
    {
      key: "c5",
      question: "LayerNorm이 평균과 분산을 계산하는 범위는?",
      choices: ["토큰 하나의 $d$개 성분", "배치 안의 모든 샘플", "문장 안의 모든 토큰", "모델의 모든 파라미터"],
      answer: 0,
      explanation: "LayerNorm은 토큰마다 그 토큰의 $d$개 성분만으로 정규화한다. 배치에 걸쳐 계산하는 BatchNorm과 달리 배치 크기와 문장 길이에 영향을 받지 않는다.",
    },
    {
      key: "c6",
      question: "Transformer 블록의 $h = x + \\text{Attention}(\\text{LN}(x))$에서 $x$를 더하는(잔차 연결) 주된 이유는?",
      choices: [
        "역전파에서 기울기가 덧셈 경로로 전달되어 블록을 깊게 쌓아도 학습되게 하려고",
        "파라미터 수를 줄이려고",
        "뒤쪽 토큰을 가리려고",
        "출력을 확률로 만들려고",
      ],
      answer: 0,
      explanation: "잔차 연결이 있으면 층은 입력에 더할 변화량만 학습하고, 기울기가 shortcut 경로로 전달되어 수십 개의 블록을 쌓아도 기울기가 소실되지 않는다. ResNet의 잔차 연결과 같은 원리다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "위치 정보 없는 self-attention에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면 각 단어의 출력은 같고 문장 전체 출력의 평균도 같다. 두 성질이 각각 순열 등변과 순열 불변 중 무엇인지 쓰고, causal mask를 쓰면 위치 정보 없이도 '고양이가'의 출력이 달라지는 이유를 쓰라.",
      answer: md`
마스크 없는 self-attention에서는 모든 토큰이 모든 토큰을 같은 방식으로 참조하므로, 입력 순서를 바꾸면 각 단어의 출력도 같은 값으로 자리만 바뀐다($\text{Attn}(PX) = P\,\text{Attn}(X)$). 이것이 순열 등변이다. 여기에 평균처럼 순서와 관계없는 집계를 하면 결과가 같아지므로, 문장 평균은 순열 불변이다.

causal mask를 쓰면 토큰마다 참조할 수 있는 범위가 위치에 따라 달라진다. 첫 문장에서 '고양이가'는 맨 앞이라 자기 자신만 참조하고, 둘째 문장에서는 맨 끝이라 세 단어를 모두 참조한다. 그래서 위치 정보 없이도 출력이 달라지며, 마스크가 위치 정보의 일부를 제공한다.
`,
      keyPoints: [
        "단어별 출력이 같은 값으로 자리만 바뀌는 것은 순열 등변이다",
        "평균 같은 집계 결과가 같은 것은 순열 불변이다",
        "causal mask는 위치에 따라 참조할 수 있는 범위를 바꾼다",
        "맨 앞의 토큰은 자기만, 맨 뒤의 토큰은 모든 토큰을 참조한다",
      ],
    },
    {
      key: "d2",
      question: "Transformer 디코더 블록에서 attention과 MLP가 각각 하는 일을 쓰고, 잔차 연결과 LayerNorm이 블록을 깊게 쌓는 데 필요한 이유를 쓰라.",
      answer: md`
attention은 각 토큰이 앞 토큰들의 값 벡터를 가중합해 정보를 가져오는 층으로, 블록 안에서 토큰 사이에 정보를 전달하는 유일한 곳이다. MLP는 같은 가중치로 토큰마다 따로 표현을 변환하며($d \to 4d \to d$), 블록 파라미터의 약 2/3를 차지한다.

잔차 연결은 각 층의 출력을 입력에 더하므로 층은 입력에 더할 변화량만 학습하고, 역전파에서 기울기가 덧셈 경로로 전달되어 블록을 수십 개 쌓아도 기울기가 소실되지 않는다. LayerNorm은 토큰마다 성분의 평균과 분산을 맞춰 층을 지나며 값의 크기가 커지거나 작아지는 것을 막아 학습을 안정시킨다.
`,
      keyPoints: [
        "attention: 토큰 사이에 정보를 전달한다",
        "MLP: 토큰마다 따로 표현을 변환하고 파라미터의 약 2/3를 차지한다",
        "잔차 연결: 기울기가 덧셈 경로로 전달되어 깊게 쌓을 수 있다",
        "LayerNorm: 토큰마다 정규화해 값의 크기를 안정시킨다",
      ],
    },
  ],
  references: [
    { title: "Jay Alammar — The Illustrated GPT-2", url: "https://jalammar.github.io/illustrated-gpt2/", note: "디코더 전용 블록과 masked self-attention을 그림으로 (영문)" },
    { title: "Haviv et al. (2022) — Transformer Language Models without Positional Encodings Still Learn Positional Information", url: "https://arxiv.org/abs/2203.16634", note: "causal mask만으로 위치 정보를 학습하는 디코더 (영문)" },
    { title: "Meng et al. (2022) — Locating and Editing Factual Associations in GPT", url: "https://arxiv.org/abs/2202.05262", note: "사실 관계 정보와 MLP 층의 관계 (영문)" },
  ],
});
