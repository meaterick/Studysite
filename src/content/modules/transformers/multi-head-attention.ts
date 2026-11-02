import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/multi-head-attention";

export default defineLesson({
  id: "multi-head-attention",
  title: "멀티헤드 어텐션과 인과 마스크",
  tier: "core",
  concepts: ["attention-transformer"],
  goal: "멀티헤드 attention의 split–attention–concat–$W^O$ 과정을 shape과 함께 추적하고, causal mask가 필요한 이유와 올바르게 적용됐는지 검사하는 방법을 설명할 수 있다.",
  why: "",
  body: md`
이제 하나의 (Wq, Wk, Wv) 세트, 즉 head 하나만으로는 부족하다는 문제가 남는다. Query-Key 내적은 고정된 하나의 선형 변환 기준으로만 토큰 간 관련성을 측정하는데, 실제 언어에는 동시에 포착해야 할 관계가 여러 종류다. 주어-동사 호응 같은 문법적 관계, 대명사가 무엇을 지시하는지 같은 의미적 관계, 인접 토큰인지 먼 토큰인지 같은 위치 관계 등. Multi-Head Attention은 전체 임베딩 차원 $d$를 $h$개의 서로 다른 부분공간(head)으로 나누고($d_k = d/h$), 각 head가 독립적인 가중치 행렬 $W_q^{(i)}, W_k^{(i)}, W_v^{(i)}$로 자신만의 $d_k$차원 부분공간에서 별도의 attention 가중치와 출력을 계산하게 한다. 각 head는 학습 과정에서 서로 다른 종류의 토큰 간 관계에 반응하도록 파라미터가 최적화되며, 전체 차원을 $h$등분한 부분공간에서 병렬로 계산하기 때문에 전체 연산량은 단일 head가 전체 차원 $d$를 그대로 쓸 때와 비슷한 수준으로 유지된다. 마지막으로 $h$개 head의 출력 벡터를 이어 붙인(concat) 뒤 출력 투영 행렬 $W^O$를 곱해 하나의 $d$차원 벡터로 합친다. 이 과정을 수식으로 적으면 다음과 같다.

비유하자면 **여러 명의 전문가**가 같은 문장을 동시에 읽는 것과 같다. 한 명은 주어와 동사의 호응만, 한 명은 대명사가 가리키는 대상만, 또 한 명은 바로 옆 단어와의 관계만 살핀다. 각자 메모를 남기면(head별 출력) 마지막에 편집자($W^O$)가 메모를 이어 붙여 하나의 보고서로 정리한다. 한 명(단일 head)이 모든 관계를 챙기려면 하나의 softmax 분포 안에서 서로 다른 관계들이 평균 내어져 흐려지지만, 여러 head는 각자 다른 곳에 주목하는 분포를 따로 가질 수 있다.

\`\`\`math
\text{MultiHead}(Q,K,V) = \text{Concat}(head_1,\dots,head_h)W^O
\`\`\`

[[diagram:multihead-patterns]]

아래 그림은 이 concat과 $W^O$ 투영이 실제 텐서 shape에서 어떻게 일어나는지를 정리한 것이다. $h$개의 Attention Head가 각자 $(\ell_{seq}, d_{head})$ 모양의 출력을 내놓으면, 이를 head 축으로 이어 붙여 $(\ell_{seq}, d_{head} \cdot h)$ 모양으로 만든 뒤 $W^O \in \mathbb{R}^{(d_{head} \cdot h) \times d_{emb}}$를 곱해 최종적으로 $(\ell_{seq}, d_{emb})$ 모양의 출력 하나로 되돌린다.

\`\`\`image
src: /images/week5/multi-head-attention.png
alt: Multi-Head Attention 구조도: 여러 Attention Head의 출력을 concat한 뒤 Wo로 투영하는 과정을 텐서 shape과 함께 표시
caption: 여러 Attention Head가 각각 독립적으로 attention을 계산한 뒤 그 출력을 이어 붙이고(Concat), 투영 행렬 Wᴼ를 곱해 하나의 출력으로 합친다. 괄호 안 표기는 각 단계의 텐서 shape이다.
credit: Cosmia Nebula, CC BY-SA 4.0, Wikimedia Commons
width: 1335
height: 731
\`\`\`

:::example $d = 512$, $h = 8$일 때 shape 따라가기
토큰 $n$개를 넣으면 각 단계의 shape은 다음과 같다.

| 단계 | shape |
| --- | --- |
| 입력 $X$ | $(n, 512)$ |
| $Q = XW_q$ ($K$, $V$도 같음) | $(n, 512)$ |
| 헤드로 나누기: $512 = 8 \times 64$ | $(8, n, 64)$ |
| 헤드별 점수 $QK^\top$ | $(8, n, n)$ |
| 헤드별 출력 (가중치 $\times V$) | $(8, n, 64)$ |
| 이어 붙이기(concat) | $(n, 512)$ |
| $W^O$ 곱하기 $(512 \times 512)$ | $(n, 512)$ |

헤드 수를 바꿔도 $W_q, W_k, W_v, W^O$는 모두 $512 \times 512$ 그대로라 파라미터 수($4d^2$)는 변하지 않는다. 바뀌는 것은 $512$차원을 몇 조각으로 나눠 쓰느냐뿐이다.
:::

### Causal mask: 미래를 가리는 장치

Causal mask는 미래 토큰을 보지 못하도록 점수 행렬 $QK^\top$의 상삼각 원소(자기 자신보다 뒤에 있는 토큰에 대한 점수)를 $-\infty$로 치환하는 장치다. GPT는 "다음 토큰 예측"으로 학습하는데, $i$번째 위치에서 $i+1$번째 이후의 정답 토큰 정보를 attention을 통해 미리 참조할 수 있다면 학습 시점에 레이블 누출(label leakage)이 발생해, 모델이 실제로 다음 토큰을 예측하는 능력이 아니라 정답을 그대로 복사하는 지름길만 학습하게 된다. $-\infty$를 넣은 칸은 softmax를 거치고 나면 정확히 0이 되므로, 미래 토큰에 대한 attention 가중치는 항상 0으로 강제된다. 결과적으로 각 토큰은 자기 자신과 그 이전에 나온 토큰들만 볼 수 있고, 이 제약 덕분에 학습이 끝난 모델을 그대로 "왼쪽에서 오른쪽으로 한 토큰씩 생성하는" 용도로도 쓸 수 있게 된다.

[[diagram:causal-mask]]

그림의 오른쪽 행렬을 행 단위로 읽어 보자. 첫 행("고양이가")은 볼 수 있는 토큰이 자기 자신뿐이라 100%를 자기에게 준다. 둘째 행("생선을")은 앞의 두 토큰 사이에서 40% : 60%로 나눈다. 마지막 행만 네 토큰 모두를 본다. 학습 때는 이 네 행이 한 번에 계산되므로, 문장 하나로 "1개를 보고 다음 맞히기", "2개를 보고 다음 맞히기", … 네 가지 예측 문제를 동시에 학습하는 셈이다.

개념은 이미 다 나왔으니, 이제 코드로 직접 확인할 차례다. 아래 코드는 순수 NumPy만 사용하므로 설치나 GPU 없이 이 페이지에서 바로 ▶ 실행 버튼을 눌러 실행해 볼 수 있다. 다만 처음부터 멀티헤드까지 한꺼번에 구현하면 복잡하니, 먼저 head 하나짜리(단일 헤드) self-attention부터 손으로 작성해 보자. 라이브러리 뒤에 숨지 않고 $QK^\top$부터 softmax까지 직접 구현해보면, 위에서 숫자로 따라간 예제가 코드 안에서 정확히 어떤 줄에 해당하는지 눈으로 확인할 수 있다.

:::info 이 코드에서 처음 나오는 NumPy 문법
- **\`@\` 연산자**: 배열 두 개를 \`@\`로 이으면 행렬곱(matrix multiplication)이다. \`(5, 8)\` 모양과 \`(8, 4)\` 모양을 \`@\`로 곱하면 \`(5, 4)\` 모양이 나온다. 가운데의 8끼리 서로 만나 사라지고, 바깥의 5와 4만 남는다고 기억하면 쉽다. \`*\`(별표)는 같은 자리 성분끼리만 곱하는 원소별(element-wise) 곱셈이라 전혀 다른 연산이니 헷갈리지 말 것.
- **\`.T\`**: 행과 열을 맞바꾸는 전치(transpose)다. \`(n, dk)\` 모양의 \`.T\`는 \`(dk, n)\` 모양이 된다.
- **\`np.triu(M, 1)\`**: 정사각행렬 \`M\`에서 대각선보다 한 칸(\`k=1\`) 더 위쪽에 있는 자리만 1로, 나머지는 0으로 채운 상삼각(upper-triangular) 행렬을 돌려준다. 대각선 자기 자신은 제외하고 그보다 뒤(미래)에 있는 토큰 자리만 골라내는 것이다. 아래 코드는 이 1인 자리에 \`np.where\`로 -1e9(사실상 $-\infty$)를 채워 넣어 미래 토큰을 가린다.
- **\`axis\`와 \`keepdims\`**: \`x.max(axis, keepdims=True)\`처럼 축(axis)을 지정하면 그 축을 따라서만 최댓값을 구하고, \`keepdims=True\`는 그 축을 지우지 않고 크기 1로 남겨 원래 배열과 그대로 뺄셈(broadcasting)할 수 있게 해준다.
- **softmax 전에 왜 최댓값을 빼는가**: \`np.exp\`는 입력이 조금만 커져도 곧바로 감당하기 힘든 큰 수(오버플로)가 된다. 그런데 모든 값에서 같은 상수 $c$를 빼도 softmax의 결과 자체는 수학적으로 완전히 똑같다. 분자·분모에 공통으로 곱해지는 $e^{-c}$가 약분되어 사라지기 때문이다. 그래서 각 행의 최댓값을 미리 빼두면 \`exp\`에 들어가는 가장 큰 값이 항상 0이 되어, 오버플로 없이 정확히 같은 값을 안전하게 계산할 수 있다. 실전 라이브러리들이 예외 없이 쓰는 표준 기법이다.
:::

\`\`\`python
# NumPy로 단일 헤드 self-attention (causal mask 포함)
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True)   # 오버플로 방지: 최댓값을 빼도 결과는 수학적으로 동일하다
    e = np.exp(x)
    return e / e.sum(axis, keepdims=True)

def self_attention(X, Wq, Wk, Wv, causal=True):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv                    # 각각 (n, dk): @는 행렬곱
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

shape을 하나씩 짚어보자. n=5는 토큰 개수, d=8은 입력 임베딩 차원, dk=4는 Query·Key·Value가 살고 있는(대개 더 작게 압축된) 차원이다. X는 (n, d)=(5, 8), 여기에 (d, dk)=(8, 4)짜리 Wq를 곱하면 Q는 (n, dk)=(5, 4)가 된다. K, V도 같은 shape이다. Q(5,4)와 $K^\top$(4,5)를 곱하면 가운데 dk=4가 서로 상쇄되면서 (5,5)짜리 정방행렬 S가 남는데, 이 S가 바로 "5개 토큰이 서로에게 매기는 점수표"다. \`np.triu(..., 1)\`은 대각선 바로 위부터 시작하는 상삼각 부분(즉 "나보다 미래에 있는 토큰"에 해당하는 칸)만 골라내는 함수이고, 그 자리에 -1e9라는 사실상 -∞에 가까운 값을 넣는다. softmax를 통과하면 이 값들은 정확히 0에 가까운 값이 되므로, 마지막에 출력된 A를 인쇄해보면 대각선 위쪽이 전부 0인 하삼각행렬 모양이 나온다. "나는 나 자신과 나 이전의 토큰들만 볼 수 있다"는 규칙이 숫자로 그대로 드러나는 순간이다. 마지막으로 A(5,5)와 V(5,4)를 곱하면 다시 (5,4) 모양의 출력이 나오는데, 이것은 "각 토큰이 자신이 볼 수 있는 토큰들의 Value를 attention 비율만큼 섞어서 만든 새로운 표현"이다.

방금 만든 head 하나짜리 \`self_attention\`을 여러 개 병렬로 돌리고 그 결과를 이어 붙이기만 하면 바로 Multi-Head Attention이 된다. 앞서 개념으로만 봤던 것을 이제 실제로 실행되는 코드로 확장해보자.

:::info 3차원 배열과 축(axis) 다루기: 처음 나오는 문법
지금까지는 모든 배열이 2차원(행, 열)이었지만, 헤드가 여러 개면 "헤드 축"이 하나 더 필요해 배열이 3차원이 된다. \`M.reshape(n, h, dk)\`는 \`(n, d)\` 모양의 2차원 배열을 원소 개수(\`n×d\`)는 그대로 두고 \`(n, h, dk)\`라는 3차원 모양으로 다시 자른다(단 \`d = h × dk\`여야 한다). \`M.transpose(1, 0, 2)\`는 축의 순서를 바꾸는 명령인데, 괄호 안 숫자는 "몇 번째였던 축을 이 자리로 가져올지"를 뜻한다. \`(1, 0, 2)\`는 0번 축(길이 n)과 1번 축(길이 h)의 자리를 맞바꾸고 2번 축(길이 dk)은 그대로 두라는 뜻이므로, \`(n, h, dk)\`가 $\to$ \`(h, n, dk)\`로 바뀐다. 3차원 배열의 shape을 읽을 때는 항상 왼쪽부터 순서대로, 즉 가장 바깥 축부터 하나씩 "이것은 무엇의 개수인가"를 짚어가며 읽으면 헷갈리지 않는다.
:::

\`\`\`python
# NumPy로 멀티헤드 causal self-attention: 위의 self_attention을 헤드 여러 개로 확장
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
    concat = heads_out.transpose(1, 0, 2).reshape(n, d)    # (h,n,dk)->(n,h,dk)->(n, d): 헤드를 다시 이어 붙임
    return concat @ Wo, weights                            # Wo: (d, d) 출력 투영

rng = np.random.default_rng(1)
n, d, h = 5, 8, 2                       # 토큰 5개, 임베딩 차원 8, 헤드 2개 -> 헤드당 차원 dk = 8/2 = 4
X = rng.normal(size=(n, d))
Wq, Wk, Wv, Wo = (rng.normal(size=(d, d)) for _ in range(4))
out, W = multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads=h)
print("출력 shape:", out.shape)         # (5, 8): 입력과 같은 모양으로 되돌아온다
print("가중치 shape:", W.shape)         # (2, 5, 5) = (헤드 수, 토큰 수, 토큰 수)
print(W.round(2))
\`\`\`

출력 shape이 \`(5, 8)\`로 입력 \`X\`와 똑같은 모양으로 되돌아온다는 점이 핵심이다. Attention 블록 하나를 몇 겹으로 쌓아도(「위치 인코딩과 Transformer 디코더 블록」 단계의 디코더 블록처럼) 입출력 모양이 그대로 유지되기 때문에 동일한 블록을 반복해서 쌓을 수 있는 것이다. \`W.shape\`이 \`(2, 5, 5)\`라는 것은 "헤드 2개 각각이 $5 \times 5$짜리 자기만의 attention 지도를 따로 갖는다"는 뜻이고, \`W\`를 인쇄해보면 두 헤드 모두 대각선 위쪽이 0인 하삼각행렬이면서도(causal mask가 두 헤드에 똑같이 적용됐다는 뜻) 정작 대각선 아래쪽 숫자들은 헤드마다 서로 다르게 나온다. 같은 입력을 보고도 두 헤드가 서로 다른 관계에 주목하도록 각자 다른 \`Wq\`, \`Wk\`, \`Wv\`로 학습될 수 있다는 사실이 숫자로 확인되는 순간이다.

이제 같은 아이디어를 실전 라이브러리에서 어떻게 쓰는지도 봐두자. \`torch\`는 브라우저 실행 환경에 없으므로 아래 PyTorch 코드는 Colab에 붙여넣어 실행한다.

\`\`\`python-colab
# PyTorch 멀티헤드 causal attention 모듈: Colab에서 실행 (브라우저에서는 실행되지 않음)
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

이번엔 batch까지 있는 실전 shape이다. x는 (B, T, D) = (배치 크기, 문장 길이, 임베딩 차원)이다. \`self.qkv\`라는 Linear 하나로 Q, K, V를 한꺼번에 만든 뒤 \`chunk(3, -1)\`로 셋으로 쪼개는 것은, 세 번 따로 행렬곱을 하는 대신 한 번의 큰 행렬곱으로 처리해 속도를 아끼는 흔한 구현 요령일 뿐, 수학적으로는 앞의 NumPy 코드의 \`X @ Wq\`, \`X @ Wk\`, \`X @ Wv\`와 완전히 같은 일이다. 그다음 \`.view(B, T, h, D//h).transpose(1, 2)\`가 하는 일이 이번 코드에서 가장 헷갈리는 부분인데, 풀어서 보면 이렇다. (B, T, D) 모양의 텐서를 D차원을 \`h개의 머리 × 머리당 차원(dh = D/h)\`으로 다시 자른 뒤, 머리 축(h)을 앞으로 끌어와 (B, h, T, dh) 모양으로 바꾼다. 배치 축 B가 하나 더 있다는 점만 빼면 앞의 멀티헤드 NumPy 코드에서 \`split_heads\`가 하던 조작과 정확히 같다. 이렇게 만들면 \`F.scaled_dot_product_attention\`이 h개의 머리 각각에 대해 (T, dh) 크기의 attention을 독립적으로, 그러나 한꺼번에 병렬로 계산해준다. 이것이 바로 위에서 설명한 "여러 명의 전문가가 동시에 문장을 읽는다"는 비유가 실제 텐서 연산으로 구현된 모습이다. \`is_causal=True\`는 NumPy 코드에서 우리가 직접 만들었던 -1e9 마스킹을 내부적으로 대신 처리해주는 옵션이다. 마지막으로 \`transpose(1, 2).reshape(B, T, D)\`는 h개로 나눴던 머리들을 다시 하나로 이어 붙여(concat) 원래 모양으로 되돌리는 과정이고, 그 뒤에 곱해지는 \`self.o\`가 바로 본문에서 말한 $W^O$다.

### 마스크가 제대로 걸렸는지 검사하기

causal mask는 한 줄만 틀려도(예: \`np.triu(..., 1)\`을 \`np.triu(..., 0)\`으로 써서 자기 자신까지 가리거나, 마스크를 빼먹거나) 에러 없이 조용히 잘못된 모델을 만든다. 가장 확실한 검사는 정의 그대로 확인하는 것이다. **마지막 토큰을 다른 값으로 바꿔도 앞 토큰들의 출력은 변하지 않아야 한다.**

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
X2[-1] = rng.normal(size=d)            # 마지막(미래) 토큰만 다른 단어로 바꾼다

for causal in [True, False]:
    a, b = attention(X, Wq, Wk, Wv, causal), attention(X2, Wq, Wk, Wv, causal)
    same = np.allclose(a[:-1], b[:-1])  # 앞의 4개 토큰 출력이 그대로인가?
    print(f"causal={causal}: 앞 토큰 출력이 변하지 않았나? {same}")
\`\`\`

마스크를 쓰면 \`True\`, 빼면 \`False\`가 나온다. 마스크가 없으면 앞 토큰들도 바뀐 마지막 토큰을 참조하므로 출력이 달라진다. 직접 attention을 구현했다면 이런 테스트를 하나 두는 습관이 좋다.

:::example 심화 실습 (선택)
Karpathy nanoGPT 스타일: tiny Shakespeare 또는 한국어 텍스트로 문자 단위 GPT(약 10M 파라미터)를 학습하고 샘플을 생성해 본다. 실행은 Colab GPU에서 5~10분.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$d = 512$, head 수 $h = 8$이면 head 하나의 차원 $d_k$는?",
      choices: ["$512$", "$64$", "$8$", "$4096$"],
      answer: 1,
      explanation: "$d_k = d/h = 64$. 전체 차원을 나눠 쓰므로 연산량은 단일 head와 비슷하다.",
    },
    {
      key: "c2",
      question: "causal mask에서 $-\\infty$(실제로는 매우 작은 수)로 바꾸는 칸은?",
      choices: ["대각선", "대각선 아래(과거 토큰)", "대각선 위(미래 토큰)", "첫 번째 열"],
      answer: 2,
      explanation: "$i$번째 토큰이 $j > i$인 미래 토큰을 보지 못하게 상삼각 부분을 가린다. softmax 후 그 칸은 0이 된다.",
    },
    {
      key: "c3",
      question: "구현한 causal attention이 올바른지 확인하는 테스트로 가장 적절한 것은?",
      choices: ["출력의 평균이 0인지 본다", "마지막(미래) 토큰을 바꿔도 앞 토큰들의 출력이 변하지 않는지 본다", "실행 시간을 잰다", "가중치 합이 $n$인지 본다"],
      answer: 1,
      explanation: "미래 정보가 과거로 새지 않는다는 성질을 직접 확인하는 검사다. 마스크를 끄면 첫 토큰 출력까지 크게 바뀌었다.",
    },
    {
      key: "c4",
      question: "$d = 512$를 유지한 채 헤드 수를 8개에서 16개로 늘리면 Multi-Head Attention의 파라미터 수($W_q, W_k, W_v, W^O$)는?",
      choices: ["변하지 않는다", "2배가 된다", "절반이 된다", "4배가 된다"],
      answer: 0,
      explanation: "네 행렬은 헤드 수와 관계없이 모두 $d \\times d$라 합계 $4d^2$다. 헤드 수는 $d$를 몇 조각($d_k = d/h$)으로 나눠 쓰는지만 바꾼다.",
    },
    {
      key: "c5",
      question: "causal mask를 쓴 attention에서 **첫 번째** 토큰의 attention 가중치는?",
      choices: ["자기 자신에게 1(100%), 나머지는 0", "모든 토큰에 고르게 나뉜다", "모두 0이다", "마지막 토큰에 1이다"],
      answer: 0,
      explanation: "첫 토큰은 앞에 아무것도 없어 볼 수 있는 것이 자기 자신뿐이다. 나머지 칸은 $-\\infty$ → 0이 되므로 softmax 결과는 자기 자신에게 1이다.",
    },
    {
      key: "c6",
      question: "causal mask를 `np.triu(np.ones((n, n)), 1)` 대신 `np.triu(np.ones((n, n)), 0)`으로 만들어 `-1e9`를 채우면 **첫 번째 토큰**의 가중치 행은?",
      choices: ["자기 자신에만 1이 된다", "행 전체가 -1e9라 softmax가 균등해져, 미래 토큰까지 1/n씩 섞인다", "모든 가중치가 0이 된다", "오류가 난다"],
      answer: 1,
      explanation: "k=0이면 대각선(자기 자신)까지 가려집니다. 첫 행은 모든 칸이 같은 -1e9라 softmax 결과가 균등분포가 되어, 막아야 할 미래 토큰을 똑같이 참고합니다. 오류 없이 조용히 틀리므로 \"마지막 토큰을 바꿔도 앞 토큰 출력이 그대로인가\" 같은 테스트가 필요합니다.",
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
      explanation: "`np.triu(..., 1)`은 대각선 바로 위부터, 즉 각 토큰보다 뒤에 있는 자리를 1로 표시합니다(가릴 자리). 반대로 `np.tril`은 볼 수 있는 자리이고, 토큰 $i$는 자기를 포함해 $i+1$개를 봅니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "Causal mask가 없으면 학습 시 어떤 부정행위가 발생하는가?",
      answer: md`
미래 토큰을 미리 보고 정답을 베끼게 되어 학습이 자명해지고, 미래를 볼 수 없는 생성 시에는 성능이 무너진다(정보 누수).
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "멀티헤드가 단일 헤드(같은 총 차원)보다 유리한 이유는? 여러 전문가 비유를 사용해 설명하라.",
      answer: md`
서로 다른 표현 부분공간에서 다양한 관계(구문·참조·위치)를 병렬로 포착하고, softmax 하나로 한 가지 방식의 평균만 내는 한계를 완화한다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "The Annotated Transformer (Harvard NLP)", url: "https://nlp.seas.harvard.edu/annotated-transformer/", note: "논문을 한 줄씩 PyTorch 코드로 옮긴 자료: MultiHeadedAttention·subsequent_mask 부분" },
    { title: "Karpathy — Let's build GPT: from scratch, in code, spelled out", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY", note: "약 2시간. causal self-attention을 직접 짜는 과정 (과제 선택 항목에 직결)" },
  ],
});
