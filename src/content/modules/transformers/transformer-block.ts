import { defineLesson, md } from "../../kit";
import exercises from "./labs/transformer-block";

export default defineLesson({
  id: "transformer-block",
  title: "트랜스포머 디코더 블록",
  tier: "core",
  concepts: ["attention-transformer"],
  goal: "마스크 없는 Self-Attention이 순열 등변(불변이 아니다) 연산이라 위치 인코딩이 필요한 이유와 causal mask가 이를 어떻게 바꾸는지 설명하고, 사인·코사인 위치 인코딩과 GPT형 디코더 블록(Attention + MLP, 잔차·정규화)의 역할 분담을 말할 수 있다.",
  why: "",
  body: md`
[[diagram:transformer-decoder-block]]

지금까지 우리는 GPT처럼 디코더만 쓰는 구조를 중심으로 봤는데, 2017년 원 논문의 Transformer는 사실 번역을 염두에 두고 인코더와 디코더를 모두 갖춘 구조로 제안되었다. 아래는 그 원본 아키텍처 그림이다. 왼쪽 블록(인코더)이 입력 문장 전체를 한꺼번에 읽어 표현으로 압축하고, 오른쪽 블록(디코더)이 그 표현을 참고하면서 출력을 한 토큰씩 생성한다. 오늘날 GPT 계열은 이 중 디코더 절반만 떼어내 사용하고, 반대로 BERT 같은 모델은 인코더 절반만 사용한다.

\`\`\`image
src: /images/week5/transformer.png
alt: Attention Is All You Need 논문의 원본 Transformer 아키텍처 그림
caption: 왼쪽이 인코더 스택, 오른쪽이 디코더 스택이다. 각 블록 안의 "Multi-Head Attention"과 "Feed Forward"가 이 단계에서 다루는 Attention·MLP 역할 분담과 정확히 대응한다.
credit: Yuening Jia, CC BY-SA 3.0, Wikimedia Commons (원 도식: Vaswani et al., 2017)
width: 700
height: 630
maxWidth: 600
\`\`\`

Attention 하나만으로는 아직 부족한 것이 하나 남아 있다. 마스크 없는 Self-Attention은 **순열 등변(permutation-equivariant)** 연산이다. 토큰들의 입력 순서를 어떤 치환(permutation) $P$로 섞으면, 출력도 똑같은 $P$로 섞일 뿐 각 토큰의 출력값은 그대로다. 식으로 쓰면 $\text{Attn}(PX) = P\,\text{Attn}(X)$이다. Q, K, V가 각 토큰 임베딩에서 독립적으로 계산되고, $(i,j)$ 쌍마다 나오는 내적값의 집합도 치환 전후로 같기 때문이다. 흔히 "순서에 무관하다(순열 불변, permutation-invariant)"고 뭉뚱그려 말하지만 정확한 표현은 아니다. 불변이라면 순서를 바꿔도 출력 자체가 같아야 하는데, 여기서는 출력의 **순서가 입력을 따라 바뀐다**. 불변이 되는 것은 출력 전체를 평균·합으로 모아 순서를 버렸을 때뿐이다. 어느 쪽이든 결론은 같다. 각 토큰의 출력만 보고는 그 토큰이 몇 번째 자리에 있었는지 알 수 없으므로, 마스크 없는 attention만으로는 "고양이가 생선을 먹었다"와 "먹었다 생선을 고양이가"에서 각 단어의 표현이 똑같이 나온다.

GPT 같은 디코더는 사정이 조금 다르다. causal mask 때문에 $i$번째 토큰은 자기 앞의 토큰들만 볼 수 있어서, 순서를 바꾸면 각 토큰이 볼 수 있는 토큰 집합 자체가 달라진다. 그래서 causal mask를 쓰면 순열 등변성이 깨지고, 실제로 위치 인코딩 없이(NoPE) 학습한 디코더 언어모델도 위치 정보를 어느 정도 스스로 알아낸다는 보고가 있다(Haviv et al., 2022). 그래도 명시적인 위치 정보를 넣는 편이 학습이 안정적이고 긴 문맥에서도 유리해서, 대부분의 모델은 위치 정보를 따로 넣어 준다. 그 방법이 위치 인코딩(positional encoding)이다. 각 토큰의 임베딩에 위치 인덱스마다 고유하게 정해지는 위치 벡터를 더해줌으로써, 모델이 토큰의 내용 정보뿐 아니라 그 토큰이 문장에서 몇 번째 자리에 있는지도 함께 알 수 있게 만든다.

원 논문은 사인·코사인 파동으로 번호표를 만들었는데, 위치 $pos$의 $2i$번째·$2i+1$번째 성분을 각각 $\sin(pos/10000^{2i/d})$, $\cos(pos/10000^{2i/d})$로 정한다. 즉 서로 다른 주파수의 사인·코사인 파동을 여러 개 겹쳐서 각 위치마다 고유한 값의 조합(벡터 패턴)이 나오게 만든 방식이다. 이후에는 번호표 자체를 학습 가능한 파라미터로 두는 방식이나, 절대 위치 대신 두 토큰 사이의 상대적 거리만 반영하는 RoPE(회전 위치 인코딩) 같은 상대 위치 방식이 등장해 현재 주류로 자리 잡았다.

[[diagram:positional-waves]]

식을 직접 계산해 보면 감이 온다. 위치 $pos = 1$의 첫 두 성분($i = 0$)은 $\sin(1) \approx 0.841$, $\cos(1) \approx 0.540$이고, $pos = 2$는 $\sin(2) \approx 0.909$, $\cos(2) \approx -0.416$이다. 성분 번호 $i$가 커질수록 분모 $10000^{2i/d}$가 커져 파동이 느려진다. 아래 코드는 위치 인코딩을 만들고, 앞에서 말한 "위치 정보가 없으면 순서를 바꿔도 단어의 출력이 같다"는 사실과 "위치 인코딩을 더하면 달라진다"는 사실을 직접 확인한다.

\`\`\`python
import numpy as np

def attention(X, Wq, Wk, Wv):               # 마스크 없는 단일 헤드 attention
    S = (X @ Wq) @ (X @ Wk).T / np.sqrt(Wk.shape[1])
    A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)
    return A @ (X @ Wv)

def sinusoidal_pe(n, d):
    pos = np.arange(n)[:, None]              # (n, 1): 위치 0, 1, 2, ...
    i = np.arange(0, d, 2)[None, :]          # (1, d/2): 짝수 성분 번호 0, 2, 4, ...
    angle = pos / 10000 ** (i / d)
    pe = np.zeros((n, d))
    pe[:, 0::2], pe[:, 1::2] = np.sin(angle), np.cos(angle)
    return pe

rng = np.random.default_rng(0)
d = 8
emb = {w: rng.normal(size=d) for w in ["고양이가", "생선을", "먹었다"]}
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))
s1 = np.stack([emb["고양이가"], emb["생선을"], emb["먹었다"]])
s2 = np.stack([emb["먹었다"], emb["생선을"], emb["고양이가"]])   # 순서를 뒤집은 문장

# 위치 정보 없이: '고양이가'의 출력(s1의 0번 행, s2의 2번 행)이 같은가?
print("PE 없이 같은가?", np.allclose(attention(s1, Wq, Wk, Wv)[0], attention(s2, Wq, Wk, Wv)[2]))

pe = sinusoidal_pe(3, d)
print("PE 더하면 같은가?", np.allclose(attention(s1 + pe, Wq, Wk, Wv)[0], attention(s2 + pe, Wq, Wk, Wv)[2]))
print("위치 0, 1, 2의 PE 앞 4성분:\n", pe[:, :4].round(3))
\`\`\`

위치 인코딩이 없으면 두 문장에서 "고양이가"의 출력이 정확히 같고(\`True\`), 위치 벡터를 더하면 같은 단어라도 자리가 달라 출력이 달라진다(\`False\`). 마지막 출력의 첫 행이 $[0, 1, 0, 1]$인 것은 $\sin 0 = 0$, $\cos 0 = 1$이기 때문이다.

[[diagram:pe-order-test]]

### Attention과 MLP의 역할 분담

Attention 층이 "이 문장 안에서 어떤 토큰들이 서로 관련 있는가"를 계산하는 역할이라면, 그다음에 오는 MLP(2층짜리 완전연결 신경망으로, 보통 $d$차원을 $4d$로 넓혔다가 다시 $d$로 좁힌다)는 각 토큰의 표현을 독립적으로 받아 "이 정보를 갖고 무엇을 더 알 수 있는가"를 처리하는 역할을 맡는다. 실제로 전체 파라미터의 상당 부분(약 2/3)이 이 MLP에 몰려 있어서, 최근 해석 가능성 연구에서는 이 부분을 모델이 사실 관계 같은 지식을 저장해두는 "저장소"에 가깝다고 해석하기도 한다. 정리하면 한 블록 안에서 Attention은 "누구를 참고할지 찾는" 역할을, MLP는 "찾은 정보로 무엇을 계산할지" 역할을 나누어 맡고 있는 셈이다.

[[diagram:attention-mlp-roles]]

### 잔차 연결과 LayerNorm: 블록을 깊이 쌓기 위한 장치

맨 위 그림의 블록에는 Attention과 MLP 말고도 두 가지 부품이 반복해서 나온다.

- **잔차 연결(residual connection)**: 각 부품의 출력을 입력에 **더한다.** $h = x + \text{Attention}(x)$처럼 쓰면, 부품은 입력을 통째로 새로 만드는 대신 "입력에 더할 수정분"만 배우면 된다. 4주차 ResNet에서 본 것처럼 역전파 때 더하기 경로로 기울기가 그대로 흘러, 블록을 수십 개 쌓아도 기울기가 사라지지 않는다.
- **LayerNorm(층 정규화)**: 토큰 **하나**의 $d$개 성분에 대해 평균을 빼고 표준편차로 나눠 평균 0, 분산 1로 맞춘다(그 뒤 학습되는 $\gamma$, $\beta$로 다시 스케일·이동). 4주차의 배치 정규화가 "배치 안의 여러 샘플"에 걸쳐 평균을 내는 것과 달리, 토큰마다 혼자 정규화하므로 배치 크기나 문장 길이에 영향을 받지 않는다. 층을 거치며 값의 크기가 들쭉날쭉해지는 것을 막아 학습을 안정시킨다.

[[diagram:ln-vs-bn]]

GPT 계열은 부품 **앞에** 정규화를 두는 Pre-LN 방식을 쓴다. 블록 하나를 식 두 줄로 쓰면 다음과 같다.

\`\`\`math
h = x + \text{Attention}(\text{LN}(x)), \qquad \text{out} = h + \text{MLP}(\text{LN}(h))
\`\`\`

이 두 줄을 그대로 코드로 옮겨 보자.

\`\`\`python
import numpy as np

def layer_norm(x, eps=1e-5):
    # 토큰(행)마다 d개 성분의 평균을 0, 분산을 1로 맞춘다 (학습되는 γ, β는 생략)
    mu = x.mean(-1, keepdims=True)
    var = x.var(-1, keepdims=True)
    return (x - mu) / np.sqrt(var + eps)

def causal_attention(x, Wq, Wk, Wv, Wo):
    S = (x @ Wq) @ (x @ Wk).T / np.sqrt(x.shape[1])
    S = np.where(np.triu(np.ones_like(S), 1) == 1, -1e9, S)
    A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)
    return (A @ (x @ Wv)) @ Wo

def mlp(x, W1, W2):
    return np.maximum(0, x @ W1) @ W2        # d → 4d → d (활성함수는 ReLU로 단순화)

rng = np.random.default_rng(0)
n, d = 4, 8
x = rng.normal(size=(n, d))
Wq, Wk, Wv, Wo = (rng.normal(size=(d, d)) * 0.3 for _ in range(4))
W1, W2 = rng.normal(size=(d, 4 * d)) * 0.3, rng.normal(size=(4 * d, d)) * 0.3

h = x + causal_attention(layer_norm(x), Wq, Wk, Wv, Wo)   # ① 정규화 → attention → 잔차 더하기
out = h + mlp(layer_norm(h), W1, W2)                       # ② 정규화 → MLP → 잔차 더하기
print("입력", x.shape, "→ attention 뒤", h.shape, "→ 블록 출력", out.shape)
print("LayerNorm 뒤 토큰별 평균:", layer_norm(x).mean(-1).round(3) + 0.0)
print("LayerNorm 뒤 토큰별 표준편차:", layer_norm(x).std(-1).round(3))
\`\`\`

입력, attention 뒤, 블록 출력의 shape이 모두 $(4, 8)$로 같다. 그래서 똑같은 블록을 원하는 만큼 겹쳐 쌓을 수 있다. 아래 두 줄은 LayerNorm을 거친 뒤 토큰마다 평균 0, 표준편차 1이 됐음을 보여 준다.
`,
  checks: [
    {
      key: "c1",
      question: "위치 인코딩 없이 마스크 없는 Self-Attention에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면?",
      choices: ["두 문장에서 각 단어의 출력 벡터가 똑같다(자리만 바뀜)", "항상 오류가 난다", "두 번째 문장의 출력이 모두 0이 된다", "첫 단어의 출력만 같다"],
      answer: 0,
      explanation: "마스크 없는 attention은 순열 등변이다: 입력 순서를 $P$로 섞으면 출력도 $P$로 섞일 뿐 각 토큰의 출력값은 같다($\\text{Attn}(PX) = P\\,\\text{Attn}(X)$). 그래서 순서 정보를 스스로 만들지 못한다. 예를 들어 위치 정보 없이는 '고양이가 쥐를 쫓는다'와 '쥐를 고양이가 쫓는다'에서 '고양이가'의 출력이 같다. 출력이 통째로 같은 순열 불변과는 구별한다.",
    },
    {
      key: "c2",
      question: "Transformer 블록의 MLP에 대한 설명으로 옳은 것은?",
      choices: ["토큰끼리 정보를 주고받는다", "각 토큰을 독립적으로 처리하며, 보통 $d \\to 4d \\to d$ 구조로 블록 파라미터의 약 2/3를 차지한다", "위치 인코딩을 계산한다", "softmax로 가중치를 만든다"],
      answer: 1,
      explanation: "토큰 사이 정보 교환은 Attention이, 각 토큰의 표현 가공은 MLP가 맡는다. $d = 768$에서 MLP 비중은 약 67%였다.",
    },
    {
      key: "c3",
      question: "GPT 계열이 원래 Transformer에서 사용하는 부분은?",
      choices: ["인코더만", "디코더만(causal self-attention 블록을 쌓음)", "인코더와 디코더 모두", "임베딩 층만"],
      answer: 1,
      explanation: "GPT는 디코더 절반, BERT는 인코더 절반을 쓴다.",
    },
    {
      key: "c4",
      question: "위치 인코딩 없이 **causal mask**를 쓴 디코더에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면 '고양이가'의 출력은?",
      choices: ["마스크가 없을 때처럼 두 문장에서 똑같다", "달라진다. 첫 문장에서는 자기 자신만, 둘째 문장에서는 세 단어를 모두 보기 때문이다", "두 문장 모두 0이 된다", "causal mask는 위치 인코딩이 있어야만 동작한다"],
      answer: 1,
      explanation: "causal mask는 각 토큰이 볼 수 있는 범위를 위치에 따라 다르게 만들어 순열 등변성을 깬다. 그래서 위치 인코딩이 없는(NoPE) 디코더도 위치 정보를 어느 정도 알아낼 수 있다. 그래도 대부분의 모델은 안정성과 긴 문맥 성능 때문에 위치 인코딩(요즘은 주로 RoPE)을 쓴다.",
    },
    {
      key: "c5",
      question: "LayerNorm이 평균과 분산을 계산하는 범위는?",
      choices: ["토큰 하나의 $d$개 성분", "배치 안의 모든 샘플", "문장 안의 모든 토큰", "모델의 모든 파라미터"],
      answer: 0,
      explanation: "LayerNorm은 토큰마다 자기 $d$개 성분만으로 정규화한다. 배치에 걸쳐 평균을 내는 배치 정규화와 달리 배치 크기·문장 길이에 영향을 받지 않는다.",
    },
    {
      key: "c6",
      question: "Transformer 블록의 $h = x + \\text{Attention}(\\text{LN}(x))$에서 $x$를 더하는(잔차 연결) 주된 이유는?",
      choices: ["역전파 때 기울기가 더하기 경로로 그대로 흘러 깊게 쌓아도 학습되게 하려고", "파라미터 수를 줄이려고", "미래 토큰을 가리려고", "출력을 확률로 만들려고"],
      answer: 0,
      explanation: "잔차 연결은 부품이 \"수정분\"만 배우게 하고, 기울기가 지름길로 흐르게 해 수십 층을 쌓아도 기울기 소실을 막는다. 4주차 ResNet과 같은 원리다.",
    },
    {
      key: "c7",
      question: "사인 위치 인코딩에서 위치 $pos = 0$의 첫 두 성분 $(\\sin(0), \\cos(0))$은?",
      choices: ["$(0, 1)$", "$(1, 0)$", "$(0, 0)$", "$(1, 1)$"],
      answer: 0,
      explanation: "$\\sin 0 = 0$, $\\cos 0 = 1$이다. 실제로 위치 0의 위치 인코딩은 짝수 성분이 모두 0, 홀수 성분이 모두 1인 $[0, 1, 0, 1, \\dots]$이다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "위치 인코딩이 없다면 Self-Attention은 왜 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 구별하지 못하는가?",
      answer: md`
마스크 없는 Self-Attention은 순열 등변 연산이다. 토큰 순서를 섞으면 출력도 똑같이 섞일 뿐 각 토큰의 출력값은 그대로이므로($\text{Attn}(PX) = P\,\text{Attn}(X)$), 두 문장에서 '고양이가'의 표현이 똑같이 나와 어순 차이를 구별할 수 없다. (출력 자체가 같아지는 '순열 불변'은 출력을 평균 내는 등 순서를 버렸을 때의 성질이다.) 그래서 위치 정보를 별도로 더해 줘야 한다. 단, causal mask를 쓰는 디코더는 토큰마다 볼 수 있는 범위가 달라 이 대칭이 깨지므로 위치 인코딩 없이도 위치를 어느 정도 알아낼 수 있지만, 실제로는 대부분 위치 인코딩을 쓴다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "Transformer 블록 안에서 Attention과 MLP는 각각 어떤 역할을 나누어 맡는다고 볼 수 있는가?",
      answer: md`
Attention은 '문장 안에서 어떤 토큰들이 서로 관련 있는지 찾는' 역할을, MLP는 그렇게 찾은 정보를 바탕으로 '무엇을 계산/추론할지' 처리하는 역할을 맡는다(MLP는 파라미터 비중이 커 지식 저장소로 해석되기도 한다).
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "위치 인코딩 없는 self-attention에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면, 각 단어의 출력은 같고 **문장 전체 출력의 평균**도 같습니다. 각각 순열 등변·순열 불변 중 무엇인지 구분해 설명하고, causal mask를 쓰면 왜 위치 인코딩 없이도 '고양이가'의 출력이 달라지는지 적으십시오.",
      answer: md`
마스크 없는 self-attention은 모든 토큰이 모든 토큰을 같은 방식으로 보므로, 입력 순서를 바꾸면 각 단어의 출력도 같은 값으로 자리만 바뀝니다. 이것이 순열 등변입니다. 여기에 평균처럼 순서와 무관한 집계를 하면 결과가 아예 같아지므로 문장 평균은 순열 불변입니다. causal mask를 쓰면 토큰마다 볼 수 있는 범위가 자리에 따라 달라집니다. 첫 문장에서 '고양이가'는 맨 앞이라 자기 자신만 보지만, 둘째 문장에서는 맨 끝이라 세 단어를 모두 봅니다. 그래서 위치 인코딩 없이도 출력이 달라지며, 마스크 자체가 위치 정보를 일부 주입하는 셈입니다.
`,
      keyPoints: ["단어별 출력이 자리만 바뀜 = 순열 등변", "평균 같은 집계는 순열 불변", "causal mask는 자리에 따라 볼 수 있는 범위를 바꾼다", "맨 앞이면 자기만, 맨 뒤면 전부를 본다"],
    },
  ],
  references: [
    { title: "Amirhossein Kazemnejad — Transformer Architecture: The Positional Encoding", url: "https://kazemnejad.com/blog/transformer_architecture_positional_encoding/", note: "사인·코사인 위치 인코딩의 직관과 성질 (영문)" },
    { title: "Jay Alammar — The Illustrated GPT-2", url: "https://jalammar.github.io/illustrated-gpt2/", note: "디코더 전용 블록과 masked self-attention을 그림으로" },
  ],
});
