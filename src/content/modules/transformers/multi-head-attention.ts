import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/multi-head-attention";

export default defineLesson({
  id: "multi-head-attention",
  title: "멀티헤드 어텐션과 인과 마스크",
  tier: "core",
  concepts: ["attention-transformer"],
  goal: "멀티헤드 attention의 헤드 나누기, 헤드별 attention, 이어 붙이기, $W^O$ 투영 과정을 모양과 함께 계산하고, causal mask가 필요한 이유와 올바르게 적용되었는지 검사하는 방법을 설명한다.",
  why: "GPT를 포함한 모든 Transformer는 멀티헤드 causal attention을 쓴다. 텐서를 헤드별로 나누고 합치는 조작과 마스크를 정확히 구현해야 미니 GPT 블록을 만들 수 있으며, 마스크가 잘못되면 오류 없이 학습 결과만 틀리므로 검사 방법도 함께 알아야 한다.",
  body: md`
### 헤드를 여러 개 쓰는 이유

self-attention의 가중치는 Query와 Key의 내적 하나로 정해지므로([[lesson:self-attention]]), 헤드 하나는 토큰 사이의 관련도를 한 가지 기준으로만 계산한다. 문장에서는 주어와 동사의 호응, 대명사가 가리키는 대상, 인접한 토큰과의 관계처럼 여러 종류의 관계가 동시에 필요하다. 헤드가 하나이면 이런 관계들이 softmax 분포 하나 안에서 평균되어 각 관계에 필요한 가중치를 따로 표현하기 어렵다.

**멀티헤드 attention**(multi-head attention)은 임베딩 차원 $d$를 $h$개의 부분공간(헤드)으로 나누고($d_k = d/h$), 헤드마다 다른 가중치 행렬 $W_q^{(i)}$, $W_k^{(i)}$, $W_v^{(i)}$로 attention을 따로 계산한다. 헤드마다 다른 가중치 분포를 가질 수 있으므로, 학습을 거치면 헤드마다 서로 다른 종류의 관계에 큰 가중치를 주게 된다. 전체 차원을 $h$개로 나눠 계산하므로 연산량은 헤드 하나가 차원 $d$ 전체를 쓸 때와 비슷하다. 마지막으로 $h$개 헤드의 출력을 이어 붙이고(concat) 출력 투영 행렬 $W^O$를 곱해 $d$차원으로 합친다.

\`\`\`math
\text{MultiHead}(Q,K,V) = \text{Concat}(head_1,\dots,head_h)W^O
\`\`\`

[[diagram:multihead-patterns]]

\`\`\`image
src: /images/week5/multi-head-attention.png
alt: Multi-Head Attention 구조도. 여러 attention 헤드의 출력을 이어 붙인 뒤 Wo로 투영하는 과정을 텐서 모양과 함께 표시
caption: 여러 attention 헤드가 각각 attention을 계산한 뒤 출력을 이어 붙이고(Concat), 투영 행렬 Wᴼ를 곱해 출력 하나로 합친다. 괄호 안의 표기는 각 단계의 텐서 모양이다.
credit: Cosmia Nebula, CC BY-SA 4.0, Wikimedia Commons
width: 1335
height: 731
\`\`\`

$d = 512$, $h = 8$이고 토큰이 $n$개이면 각 단계의 모양은 다음과 같다.

| 단계 | 모양 |
| --- | --- |
| 입력 $X$ | $(n, 512)$ |
| $Q = XW_q$ ($K$, $V$도 같다) | $(n, 512)$ |
| 헤드로 나누기: $512 = 8 \times 64$ | $(8, n, 64)$ |
| 헤드별 점수 $QK^\top$ | $(8, n, n)$ |
| 헤드별 출력(가중치 $\times V$) | $(8, n, 64)$ |
| 이어 붙이기(concat) | $(n, 512)$ |
| $W^O$ 곱하기($512 \times 512$) | $(n, 512)$ |

헤드 수를 바꿔도 $W_q$, $W_k$, $W_v$, $W^O$는 모두 $512 \times 512$이므로 파라미터 수($4d^2$)는 변하지 않는다. 바뀌는 것은 $512$차원을 몇 개로 나눠 쓰는지뿐이다.

### Causal mask

**causal mask**는 각 토큰이 자기보다 뒤에 있는 토큰을 참조하지 못하도록, 점수 행렬 $QK^\top$의 대각선 위 원소를 $-\infty$로 바꾼다. GPT는 다음 토큰 예측으로 학습하는데([[lesson:pretraining]]), $i$번째 위치에서 $i+1$번째 이후의 토큰을 참조할 수 있으면 예측할 정답이 입력에 들어 있는 라벨 누수가 생긴다. 그러면 모델은 다음 토큰을 예측하는 대신 입력에 있는 정답을 그대로 출력하도록 학습되고, 뒤쪽 토큰이 없는 생성 단계에서는 성능이 크게 떨어진다. $-\infty$인 칸은 softmax 뒤에 정확히 0이 되므로, 각 토큰은 자기 자신과 앞 토큰들만 참조한다. 그래서 학습한 모델을 그대로 왼쪽에서 오른쪽으로 한 토큰씩 생성하는 데 쓸 수 있다.

[[diagram:causal-mask]]

그림의 오른쪽 행렬을 행 단위로 읽는다. 첫 행("고양이가")은 참조할 수 있는 토큰이 자기 자신뿐이라 가중치 1을 자기에게 준다. 둘째 행("생선을")은 앞의 두 토큰에 40%와 60%를 준다. 마지막 행만 네 토큰을 모두 참조한다. 학습할 때는 네 행이 한 번에 계산되므로, 문장 하나로 앞의 토큰 1개, 2개, 3개, 4개를 보고 다음 토큰을 예측하는 네 문제를 동시에 학습한다.

### NumPy로 구현하기

헤드를 나눌 때 \`M.reshape(n, h, dk)\`는 $(n, d)$ 배열을 $(n, h, dk)$로 나누고($d = h \times dk$), \`transpose(1, 0, 2)\`는 0번 축과 1번 축을 바꿔 $(h, n, dk)$로 만든다. 헤드 축을 맨 앞으로 옮기면 헤드마다 행렬 곱을 한 번에 계산할 수 있다.

\`\`\`python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True)                     # 최댓값을 빼도 결과는 같고 overflow를 막는다
    e = np.exp(x)
    return e / e.sum(axis, keepdims=True)

def multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads, causal=True):
    n, d = X.shape
    dk = d // n_heads                                      # 헤드 하나의 차원
    Q, K, V = X @ Wq, X @ Wk, X @ Wv                       # 각각 (n, d)

    def split_heads(M):
        return M.reshape(n, n_heads, dk).transpose(1, 0, 2)   # (n, d) → (n, h, dk) → (h, n, dk)

    Qh, Kh, Vh = split_heads(Q), split_heads(K), split_heads(V)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(dk)      # (h, n, dk) @ (h, dk, n) = (h, n, n)
    if causal:
        mask = np.triu(np.ones((n, n)), 1) == 1            # 대각선 위(뒤쪽 토큰)만 True
        scores = np.where(mask, -1e9, scores)              # 모든 헤드에 같은 마스크를 적용한다
    weights = softmax(scores, axis=-1)                     # 행(Query)마다 softmax
    heads_out = weights @ Vh                               # (h, n, n) @ (h, n, dk) = (h, n, dk)
    concat = heads_out.transpose(1, 0, 2).reshape(n, d)    # (h, n, dk) → (n, h, dk) → (n, d)
    return concat @ Wo, weights                            # Wo: (d, d) 출력 투영

rng = np.random.default_rng(1)
n, d, h = 5, 8, 2                                          # 토큰 5개, 차원 8, 헤드 2개(헤드당 차원 4)
X = rng.normal(size=(n, d))
Wq, Wk, Wv, Wo = (rng.normal(size=(d, d)) for _ in range(4))
out, W = multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads=h)
print("출력 모양:", out.shape)                              # (5, 8): 입력과 같은 모양
print("가중치 모양:", W.shape)                              # (2, 5, 5) = (헤드 수, 토큰 수, 토큰 수)
print(W.round(2))
\`\`\`

출력의 모양이 입력 \`X\`와 같은 \`(5, 8)\`이므로 같은 블록을 여러 층 쌓을 수 있다([[lesson:transformer-block]]). \`W.shape\`이 \`(2, 5, 5)\`인 것은 헤드 2개가 각각 $5 \times 5$ 가중치 행렬을 갖는다는 뜻이다. 두 헤드 모두 대각선 위가 0인 하삼각 행렬이지만(같은 마스크), 대각선 아래의 값은 헤드마다 다르다. 헤드마다 다른 \`Wq\`, \`Wk\`, \`Wv\`를 쓰므로 같은 입력에서 서로 다른 가중치가 계산된다.

실제 구현에서는 PyTorch의 \`F.scaled_dot_product_attention\`을 쓴다. 아래 코드는 Colab에서 실행한다.

\`\`\`python-colab
import torch, torch.nn as nn, torch.nn.functional as F

class CausalSelfAttention(nn.Module):
    def __init__(self, d, h):
        super().__init__(); self.h = h; self.qkv = nn.Linear(d, 3 * d); self.o = nn.Linear(d, d)
    def forward(self, x):
        B, T, D = x.shape
        q, k, v = self.qkv(x).chunk(3, -1)                                              # Q, K, V를 한 번에 계산해 나눈다
        q, k, v = (t.view(B, T, self.h, D // self.h).transpose(1, 2) for t in (q, k, v))  # (B, h, T, dh)
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True)                     # 헤드별 causal attention
        return self.o(y.transpose(1, 2).reshape(B, T, D))                               # 이어 붙이고 W^O
print(CausalSelfAttention(64, 4)(torch.randn(2, 10, 64)).shape)   # torch.Size([2, 10, 64])
\`\`\`

입력 \`x\`의 모양은 (배치 크기 $B$, 길이 $T$, 차원 $D$)이다. 선형층 \`self.qkv\` 하나로 $Q$, $K$, $V$를 한 번에 계산하고 \`chunk(3, -1)\`로 나누는 것은 행렬 곱 세 번을 한 번으로 줄이는 구현 방법이며, NumPy 코드의 \`X @ Wq\`, \`X @ Wk\`, \`X @ Wv\`와 같은 계산이다. \`.view(B, T, h, D // h).transpose(1, 2)\`는 배치 축이 하나 더 있는 것만 빼면 \`split_heads\`와 같다. \`is_causal=True\`가 NumPy 코드의 \`-1e9\` 마스크를 대신하고, \`self.o\`가 $W^O$다.

### 마스크가 제대로 적용되었는지 검사하기

causal mask는 한 줄만 틀려도(예: \`np.triu(..., 1)\`을 \`np.triu(..., 0)\`으로 써서 자기 자신까지 가리거나, 마스크를 빠뜨리거나) 오류 없이 잘못된 모델을 만든다. 정의를 그대로 확인하는 검사가 가장 확실하다. **마지막 토큰을 다른 값으로 바꿔도 앞 토큰들의 출력은 바뀌지 않아야 한다.**

\`\`\`python
import numpy as np

def softmax(x):
    x = x - x.max(-1, keepdims=True)
    e = np.exp(x)
    return e / e.sum(-1, keepdims=True)

def attention(X, Wq, Wk, Wv, causal):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = Q @ K.T / np.sqrt(K.shape[-1])
    if causal:
        S = np.where(np.triu(np.ones_like(S), 1) == 1, -1e9, S)
    return softmax(S) @ V

rng = np.random.default_rng(0)
n, d = 5, 8
X = rng.normal(size=(n, d))
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))
X2 = X.copy()
X2[-1] = rng.normal(size=d)            # 마지막 토큰만 다른 값으로 바꾼다

for causal in [True, False]:
    a, b = attention(X, Wq, Wk, Wv, causal), attention(X2, Wq, Wk, Wv, causal)
    print(f"causal={causal}: 앞 토큰 출력이 그대로인가? {np.allclose(a[:-1], b[:-1])}")
\`\`\`

마스크를 쓰면 \`True\`, 빼면 \`False\`다. 마스크가 없으면 앞 토큰들도 바뀐 마지막 토큰을 참조하므로 출력이 달라진다. attention을 직접 구현했다면 이런 검사를 함께 두는 것이 좋다.
`,
  checks: [
    {
      key: "c1",
      question: "$d = 512$, 헤드 수 $h = 8$이면 헤드 하나의 차원 $d_k$는?",
      choices: ["$512$", "$64$", "$8$", "$4096$"],
      answer: 1,
      explanation: "$d_k = d/h = 64$다. 전체 차원을 나눠 쓰므로 연산량은 헤드 하나가 전체 차원을 쓸 때와 비슷하다.",
    },
    {
      key: "c2",
      question: "causal mask에서 $-\\infty$(실제로는 매우 작은 수)로 바꾸는 칸은?",
      choices: ["대각선", "대각선 아래(과거 토큰)", "대각선 위(미래 토큰)", "첫 번째 열"],
      answer: 2,
      explanation: "$i$번째 토큰이 $j > i$인 뒤쪽 토큰을 참조하지 못하게 대각선 위를 가린다. softmax 뒤에 그 칸은 0이 된다.",
    },
    {
      key: "c3",
      question: "구현한 causal attention이 올바른지 확인하는 테스트로 가장 적절한 것은?",
      choices: ["출력의 평균이 0인지 본다", "마지막 토큰을 바꿔도 앞 토큰들의 출력이 바뀌지 않는지 본다", "실행 시간을 잰다", "가중치의 합이 $n$인지 본다"],
      answer: 1,
      explanation: "뒤쪽 토큰의 정보가 앞 토큰의 출력에 들어가지 않는다는 성질을 직접 확인한다. 마스크를 빼면 첫 토큰의 출력까지 바뀐다.",
    },
    {
      key: "c4",
      question: "$d = 512$를 유지한 채 헤드 수를 8개에서 16개로 늘리면 Multi-Head Attention의 파라미터 수($W_q, W_k, W_v, W^O$)는?",
      choices: ["변하지 않는다", "2배가 된다", "절반이 된다", "4배가 된다"],
      answer: 0,
      explanation: "네 행렬은 헤드 수와 관계없이 모두 $d \\times d$이므로 합계 $4d^2$다. 헤드 수는 $d$를 몇 개($d_k = d/h$)로 나눠 쓰는지만 바꾼다.",
    },
    {
      key: "c5",
      question: "causal mask를 쓴 attention에서 첫 번째 토큰의 attention 가중치는?",
      choices: ["자기 자신에게 1(100%), 나머지는 0", "모든 토큰에 고르게 나뉜다", "모두 0이다", "마지막 토큰에 1이다"],
      answer: 0,
      explanation: "첫 토큰은 앞에 토큰이 없어 참조할 수 있는 것이 자기 자신뿐이다. 나머지 칸은 $-\\infty$에서 0이 되므로 softmax 결과는 자기 자신에게 1이다.",
    },
    {
      key: "c6",
      question: "causal mask를 `np.triu(np.ones((n, n)), 1)` 대신 `np.triu(np.ones((n, n)), 0)`으로 만들어 `-1e9`를 채우면 첫 번째 토큰의 가중치 행은?",
      choices: ["자기 자신에만 1이 된다", "행 전체가 -1e9라 softmax가 균등분포가 되어, 뒤쪽 토큰까지 1/n씩 참조한다", "모든 가중치가 0이 된다", "오류가 난다"],
      answer: 1,
      explanation: "k=0이면 대각선(자기 자신)까지 가려진다. 첫 행은 모든 칸이 같은 -1e9이므로 softmax 결과가 균등분포가 되어, 가려야 할 뒤쪽 토큰도 같은 가중치로 참조한다. 오류 없이 결과만 틀리므로 마지막 토큰을 바꿔도 앞 토큰의 출력이 그대로인지 확인하는 검사가 필요하다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
print(np.triu(np.ones((3, 3)), 1).astype(int).tolist())
print(np.tril(np.ones((3, 3))).astype(int).sum(axis=1).tolist())
`,
      expected: "[[0, 1, 1], [0, 0, 1], [0, 0, 0]]\n[1, 2, 3]",
      explanation: "`np.triu(..., 1)`은 대각선 바로 위부터, 즉 각 토큰보다 뒤에 있는 자리(가릴 자리)를 1로 표시한다. 반대로 `np.tril`은 참조할 수 있는 자리이고, 토큰 $i$는 자기를 포함해 $i+1$개를 참조한다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "causal mask가 없으면 다음 토큰 예측 학습에서 어떤 문제가 생기는지 쓰고, 마스크가 올바르게 적용되었는지 검사하는 방법을 쓰라.",
      answer: md`
다음 토큰 예측에서 $i$번째 위치의 정답은 $i+1$번째 토큰이다. 마스크가 없으면 $i$번째 위치가 $i+1$번째 이후의 토큰을 참조할 수 있어, 예측할 정답이 입력에 들어 있는 라벨 누수가 생긴다. 모델은 다음 토큰을 예측하는 대신 입력의 정답을 그대로 출력하도록 학습되어 학습 손실은 매우 낮아지지만, 뒤쪽 토큰이 없는 생성 단계에서는 성능이 크게 떨어진다.

검사는 마스크의 정의를 그대로 확인한다. 입력에서 마지막 토큰만 다른 값으로 바꾼 뒤 앞 토큰들의 출력이 바뀌지 않는지 비교하고, 바뀌면 마스크가 없거나 잘못 적용된 것이다.
`,
      keyPoints: [
        "마스크가 없으면 정답인 뒤쪽 토큰을 참조하는 라벨 누수가 생긴다",
        "학습 손실은 낮아지지만 생성 단계에서 성능이 크게 떨어진다",
        "마스크는 대각선 위 점수를 $-\\infty$로 바꿔 가중치를 0으로 만든다",
        "마지막 토큰만 바꿔도 앞 토큰 출력이 그대로인지 검사한다",
      ],
    },
    {
      key: "d2",
      question: "총 차원이 같을 때 헤드 여러 개가 헤드 하나보다 유리한 이유를 softmax 분포의 관점에서 쓰고, $d = 512$, $h = 8$일 때 헤드 나누기에서 $W^O$ 투영까지의 텐서 모양을 쓰라.",
      answer: md`
헤드 하나는 Query와 Key의 내적이라는 한 가지 기준으로 가중치를 계산하므로, 서로 다른 종류의 관계(주어와 동사의 호응, 대명사의 지시 대상, 인접 토큰)가 softmax 분포 하나 안에서 평균된다. 헤드를 여러 개 쓰면 헤드마다 다른 $W_q$, $W_k$, $W_v$로 다른 부분공간에서 가중치를 계산하므로, 헤드마다 서로 다른 관계에 큰 가중치를 줄 수 있다. 총 차원을 나눠 쓰므로 연산량과 파라미터 수는 거의 같다.

$Q$, $K$, $V$는 $(n, 512)$이고, 헤드로 나누면 $(8, n, 64)$, 헤드별 점수는 $(8, n, n)$, 헤드별 출력은 $(8, n, 64)$다. 출력을 이어 붙이면 $(n, 512)$가 되고, $W^O$($512 \times 512$)를 곱한 결과도 $(n, 512)$다.
`,
      keyPoints: [
        "헤드 하나는 여러 관계가 softmax 분포 하나 안에서 평균된다",
        "헤드마다 다른 부분공간에서 다른 관계에 큰 가중치를 줄 수 있다",
        "연산량과 파라미터 수($4d^2$)는 거의 같다",
        "$(n, 512) \\to (8, n, 64) \\to (8, n, n) \\to (8, n, 64) \\to (n, 512)$",
      ],
    },
  ],
  references: [
    { title: "The Annotated Transformer (Harvard NLP)", url: "https://nlp.seas.harvard.edu/annotated-transformer/", note: "논문을 PyTorch 코드로 옮긴 자료: MultiHeadedAttention과 subsequent_mask 부분 (영문)" },
    { title: "Karpathy — Let's build GPT: from scratch, in code, spelled out", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY", note: "causal self-attention을 처음부터 구현하는 약 2시간 분량의 영상 (영문)" },
    { title: "Karpathy — nanoGPT", url: "https://github.com/karpathy/nanoGPT", note: "작은 GPT를 학습하는 최소 구현 코드 (영문)" },
  ],
});
