import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/kv-cache-rope";

export default defineLesson({
  id: "kv-cache-rope",
  title: "생성 단계의 트랜스포머: KV 캐시와 RoPE",
  tier: "supplement",
  goal: "생성할 때 KV 캐시가 저장하는 값과 스텝마다 새로 계산하는 값을 구분하고 결과가 같은 이유를 설명하며, KV 캐시의 메모리를 계산하고, RoPE가 회전으로 상대 거리만 attention 점수에 반영하는 원리를 설명한다.",
  why: "LLM API의 응답 속도와 GPU 메모리 사용량은 대부분 생성 단계의 계산 방식으로 정해진다. 긴 문맥이나 많은 동시 요청을 처리할 때 메모리가 부족해지는 원인을 KV 캐시의 크기로 계산하고, 모델 설정에 나오는 GQA와 RoPE가 무엇을 바꾸는지 판단할 때 이 레슨의 내용을 쓴다.",
  body: md`
### 학습과 생성의 차이

학습할 때는 문장 전체가 주어지므로, 토큰 $n$개의 Q, K, V를 행렬 연산으로 한 번에 계산하고 causal mask를 적용해 $(n \times n)$ attention을 구한다. 생성(추론, inference)할 때는 다음 토큰이 아직 없으므로 토큰을 하나씩 만든다. 스텝마다 지금까지의 토큰으로 attention을 계산해 다음 토큰을 정하고, 그 토큰을 입력 뒤에 붙여 다음 스텝을 진행한다.

이때 과거 토큰의 Key와 Value는 다시 계산할 필요가 없다. causal mask 때문에 각 층에서 토큰 $i$의 표현은 위치 $i$ 이하의 토큰에만 의존하므로, 그 표현에서 계산한 K, V도 뒤에 토큰이 추가되어도 바뀌지 않는다. 그런데 아무 최적화 없이 구현하면 101번째 토큰을 생성할 때 1~100번째 토큰의 K, V를 처음부터 다시 계산한다. 토큰 $n$개를 생성하는 동안 K, V를 $1 + 2 + \cdots + n = n(n+1)/2$번 계산하는 것이다.

### KV 캐시

**KV 캐시**(KV cache)는 각 스텝에서 계산한 Key와 Value를 층별로 메모리에 저장해 두는 방법이다. 다음 스텝에서는 새 토큰 하나의 Query, Key, Value만 계산하고, 새 Key와 Value를 캐시 뒤에 붙인 다음, 새 Query를 캐시의 모든 Key와 비교해 attention을 계산한다. K, V 계산은 토큰 $n$개에 대해 $n$번으로 줄어든다. 새 Query와 캐시의 모든 Key의 내적은 여전히 지금까지의 토큰 수에 비례하므로, 문맥이 길어질수록 스텝당 attention 계산량은 늘어난다.

[[diagram:kv-cache-steps]]

### 캐시를 쓴 결과의 검증

과거 토큰의 K, V가 뒤의 토큰과 무관하다면, 캐시를 쌓아 가며 한 토큰씩 계산한 결과는 학습할 때처럼 전체를 한 번에 계산한 결과와 같아야 한다. 아래 코드는 두 방식의 결과를 비교한다.

\`\`\`python
import numpy as np

def softmax(x):
    e = np.exp(x - x.max(-1, keepdims=True))
    return e / e.sum(-1, keepdims=True)

rng = np.random.default_rng(0)
n, d = 6, 8
X = rng.normal(size=(n, d))                      # 토큰 6개
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))

# (1) 한 번에: 학습할 때처럼 causal mask로 전체를 계산
S = (X @ Wq) @ (X @ Wk).T / np.sqrt(d)
S = np.where(np.triu(np.ones((n, n)), 1) == 1, -1e9, S)
full = softmax(S) @ (X @ Wv)

# (2) 한 토큰씩: 생성할 때처럼 K, V를 캐시에 쌓아 가며 계산
K_cache, V_cache, outs = [], [], []
for t in range(n):
    x = X[t]                                     # 이번 스텝의 새 토큰 하나
    q, k, v = x @ Wq, x @ Wk, x @ Wv             # 새로 계산하는 것은 이 셋뿐이다
    K_cache.append(k); V_cache.append(v)         # 캐시 뒤에 붙인다
    K, V = np.array(K_cache), np.array(V_cache)  # (t+1, d): 지금까지의 모든 K, V
    outs.append(softmax(q @ K.T / np.sqrt(d)) @ V)   # 캐시에는 과거와 현재 토큰만 있으므로 마스크가 필요 없다
print("두 방식의 결과가 같은가?", np.allclose(full, np.array(outs)))
print("마지막 스텝의 캐시 크기:", K.shape)
\`\`\`

결과는 \`True\`다. 캐시는 근사가 아니라 같은 계산의 중복을 없앤 것이다. 한 토큰씩 계산할 때는 마스크도 필요 없다. 스텝 $t$의 캐시에는 위치 $t$까지의 K, V만 들어 있으므로, 뒤쪽 토큰을 가리는 조건이 저절로 지켜진다.

:::info 프리필(prefill)과 디코드(decode)
생성은 두 단계로 나뉜다. **프리필**에서는 프롬프트 전체를 학습할 때처럼 한 번에 병렬로 처리해 캐시를 채운다. **디코드**에서는 위 코드의 반복문처럼 토큰을 하나씩 만들며 캐시에 덧붙인다. 프리필은 계산량이 많지만 병렬로 처리되고, 디코드는 토큰마다 캐시 전체와 가중치를 메모리에서 읽어야 하므로 메모리 대역폭이 속도를 결정한다. 긴 프롬프트를 넣으면 첫 토큰이 나올 때까지 시간이 걸리고, 그 뒤로는 일정한 속도로 토큰이 생성되는 이유다. 이 두 시간을 지표로 다루는 방법은 [[lesson:serving-cost]]에서 다룬다.
:::

[[diagram:prefill-decode]]

### KV 캐시의 메모리

KV 캐시는 계산량을 줄이는 대신 메모리를 쓴다. 캐시의 원소 수는 다음과 같다.

\`\`\`math
\text{층 수} \times \text{K·V 헤드 수} \times \text{헤드당 차원} \times \text{시퀀스 길이} \times 2 \times \text{배치 크기}
\`\`\`

2는 Key와 Value다. 층 32개, 헤드 32개, 헤드당 차원 128인 모델을 시퀀스 길이 2,048, 배치 크기 1로 실행하면 $32 \times 32 \times 128 \times 2048 \times 2 \approx 5.37 \times 10^8$개이고, fp16(원소당 2바이트)으로 저장하면 약 1.07GB다. 배치 크기가 8이면 8배인 약 8.6GB가 된다. 동시 요청이 늘거나 문맥이 길어질 때 GPU 메모리가 부족해지는 주요 원인이 KV 캐시다.

**GQA**(Grouped-Query Attention)는 이 메모리를 줄이는 구조다. Query 헤드는 32개를 유지하고 K, V 헤드는 8개만 두어 Query 헤드 4개가 K·V 헤드 하나를 함께 쓰게 한다. 캐시 크기는 K·V 헤드 수에 비례하므로 위 예의 1.07GB가 4분의 1인 약 0.27GB로 줄어든다. Llama 3 8B가 이 설정(Query 헤드 32개, K·V 헤드 8개)을 쓴다. K·V 헤드를 하나만 두는 경우를 **MQA**(Multi-Query Attention)라 한다.

[[diagram:gqa-sharing]]

### RoPE: 회전으로 상대 거리를 표현하는 위치 인코딩

[[lesson:tokenization]]의 사인파 위치 인코딩과 학습형 위치 임베딩은 위치마다 정해진 벡터를 토큰 임베딩에 더한다. **RoPE**(Rotary Position Embedding, Su et al., 2021)는 벡터를 더하는 대신 각 토큰의 Query와 Key를 위치에 비례하는 각도로 회전한다. 2차원 벡터를 각도 $\phi$만큼 회전하는 행렬은 다음과 같다.

\`\`\`math
R(\phi) = \begin{pmatrix} \cos\phi & -\sin\phi \\ \sin\phi & \cos\phi \end{pmatrix}
\`\`\`

위치 $m$의 Query는 $R(m\theta)q$로, 위치 $n$의 Key는 $R(n\theta)k$로 회전한 뒤 내적한다. 회전 행렬은 $R(a)^\top R(b) = R(b - a)$를 만족하므로

\`\`\`math
\left(R(m\theta)q\right)^\top \left(R(n\theta)k\right) = q^\top R\left((n - m)\theta\right) k
\`\`\`

이고, 점수는 두 위치의 차이 $n - m$에만 의존한다. 실제 RoPE는 $d$차원 벡터를 두 성분씩 짝지어 쌍마다 서로 다른 $\theta$로 이 회전을 적용한다.

\`\`\`python
import numpy as np

def rotate(v, angle):                            # 2차원 벡터를 angle(라디안)만큼 회전
    c, s = np.cos(angle), np.sin(angle)
    return np.array([c * v[0] - s * v[1], s * v[0] + c * v[1]])

theta = 0.3
q, k = np.array([1.0, 0.5]), np.array([0.8, -0.2])
for m, n in [(3, 1), (10, 8), (52, 50), (5, 1)]:
    score = rotate(q, m * theta) @ rotate(k, n * theta)   # 위치 m의 q, 위치 n의 k
    print(f"m={m:2d}, n={n:2d} (거리 {m - n}): 점수 = {score:.4f}")
\`\`\`

위치 쌍 (3, 1), (10, 8), (52, 50)은 위치가 다르지만 거리가 2로 같으므로 점수가 같고, 거리가 4인 (5, 1)에서는 점수가 달라진다. 두 벡터를 각각 $m\theta$, $n\theta$만큼 회전하면 두 벡터 사이의 각도는 $(m - n)\theta$만큼만 바뀌기 때문이다.

[[diagram:rope-rotation]]

RoPE는 학습할 파라미터가 없고, 각 토큰의 Key를 그 토큰의 위치로 한 번만 회전해 캐시에 저장하면 되므로 KV 캐시와 함께 쓰기 쉽다. Llama, Mistral, Qwen 등 많은 공개 LLM이 RoPE를 쓴다. 다만 학습 길이보다 긴 입력에서는 RoPE를 쓴 모델도 성능이 떨어지며, 그 이유와 보완 방법은 [[lesson:position-extrapolation]]에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "KV 캐시를 쓸 때 매 생성 스텝에 새로 계산하는 것은?",
      choices: ["지금까지의 모든 토큰의 Q, K, V", "새 토큰 하나의 Q, K, V(과거 토큰의 K, V는 캐시에서 읽는다)", "과거 토큰의 Q만", "아무것도 새로 계산하지 않는다"],
      answer: 1,
      explanation: "causal mask 때문에 과거 토큰의 K, V는 새 토큰이 추가되어도 바뀌지 않으므로 저장해 두고 다시 쓴다.",
    },
    {
      key: "c2",
      question: "KV 캐시로 계산한 출력과 전체를 한 번에 계산한 출력의 관계는?",
      choices: ["캐시 쪽이 근삿값이라 조금 다르다", "수치 오차 범위에서 같다", "캐시 쪽이 더 정확하다", "완전히 다른 값이다"],
      answer: 1,
      explanation: "캐시를 쓴 결과와 쓰지 않은 결과를 비교하면 `np.allclose`가 True다. 캐시는 근사가 아니라 같은 계산의 중복을 없앤 것이다.",
    },
    {
      key: "c3",
      question: "층 32개, 헤드 32개, 헤드당 차원 128, 시퀀스 길이 2,048, 배치 크기 1, fp16일 때 KV 캐시의 메모리는 약 얼마인가?",
      choices: ["약 67MB", "약 1.07GB", "약 8.6GB", "약 17GB"],
      answer: 1,
      explanation: "$32 \\times 32 \\times 128 \\times 2048 \\times 2 \\approx 5.37 \\times 10^8$개에 원소당 2바이트를 곱하면 약 1.07GB다. 배치 크기가 8이면 8배가 된다.",
    },
    {
      key: "c4",
      question: "RoPE로 회전한 $q$(위치 $m$)와 $k$(위치 $n$)의 내적이 의존하는 것은?",
      choices: ["$m$과 $n$ 각각의 절댓값", "$m - n$(상대 거리)", "$m + n$", "문장 전체 길이"],
      answer: 1,
      explanation: "$R(a)^\\top R(b) = R(b - a)$이므로 회전 각도의 차이만 남는다. 그래서 위치 쌍 (5, 3), (12, 10), (102, 100)의 점수가 모두 같다.",
    },
    {
      key: "c5",
      question: "Query 헤드 32개는 그대로 두고 K·V 헤드를 8개로 줄인 GQA를 쓰면, KV 캐시 메모리는 원래의 몇 배가 되는가?",
      choices: ["1/4배", "1/32배", "변하지 않는다", "1/8배"],
      answer: 0,
      explanation: "KV 캐시의 크기는 저장하는 K·V 헤드 수에 비례하므로, 32개에서 8개로 줄면 1/4이 된다. Query 헤드 수는 캐시 크기와 관계가 없다.",
    },
    {
      key: "c6",
      question: "생성의 프리필(prefill) 단계에서 일어나는 일은?",
      choices: ["프롬프트 전체를 한 번에 병렬로 처리해 KV 캐시를 채운다", "토큰을 하나씩 만들며 캐시에 덧붙인다", "KV 캐시를 비운다", "모델 가중치를 프롬프트에 맞게 갱신한다"],
      answer: 0,
      explanation: "프리필은 이미 주어진 프롬프트를 학습할 때처럼 병렬로 처리해 캐시를 채우는 단계다. 그 뒤 디코드 단계에서 토큰을 하나씩 생성한다.",
    },
    {
      key: "c7",
      question: "KV 캐시로 한 토큰씩 생성할 때 causal mask를 쓰지 않아도 결과가 학습 때와 같은 이유는?",
      choices: ["생성할 때는 뒤쪽 토큰을 참조해도 되기 때문에", "캐시에는 현재 토큰까지의 K, V만 들어 있어 참조할 수 있는 범위가 이미 과거로 제한되기 때문에", "RoPE가 마스크 역할을 하기 때문에", "softmax가 뒤쪽 토큰에 0을 주도록 학습되었기 때문에"],
      answer: 1,
      explanation: "생성 시점 $t$의 캐시에는 위치 0~$t$의 Key와 Value만 있다. 아직 생성되지 않은 토큰은 존재하지 않으므로, 전체 문장을 한 번에 계산할 때 마스크로 가리던 것과 같은 계산이 된다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
n_layers, n_heads, head_dim, seq, batch = 32, 32, 128, 2048, 1
elems = n_layers * n_heads * head_dim * seq * 2 * batch
print(elems, round(elems * 2 / 1e9, 2))
`,
      expected: "536870912 1.07",
      explanation: "층 수, 헤드 수, 헤드당 차원, 시퀀스 길이, 2(K와 V), 배치 크기를 모두 곱하면 약 5억 3,700만 개다. fp16은 원소당 2바이트이므로 약 1.07GB이며, 배치 크기가 8이면 8배가 된다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "KV 캐시가 없을 때 101번째 토큰을 생성하면서 낭비되는 계산이 무엇인지 쓰고, 캐시를 써도 결과가 같은 이유를 causal mask로 설명하라. 캐시가 차지하는 메모리를 결정하는 요소와 GQA가 메모리를 줄이는 원리도 쓰라.",
      answer: md`
캐시가 없으면 101번째 토큰을 생성할 때 1~100번째 토큰의 Key와 Value를 처음부터 다시 계산한다. causal mask 때문에 각 층에서 토큰 $i$의 표현은 위치 $i$ 이하의 토큰에만 의존하므로, 과거 토큰의 K, V는 뒤에 토큰이 추가되어도 바뀌지 않는다. 따라서 이전 스텝에서 계산한 K, V를 저장해 두고 새 토큰의 Q, K, V만 계산해도 결과가 같다.

캐시의 원소 수는 층 수, K·V 헤드 수, 헤드당 차원, 시퀀스 길이, 2(K와 V), 배치 크기를 모두 곱한 값이고, 여기에 원소당 바이트 수를 곱한 것이 메모리다. GQA는 여러 Query 헤드가 K·V 헤드 하나를 함께 쓰게 해 저장할 K·V 헤드 수를 줄인다. K·V 헤드를 32개에서 8개로 줄이면 캐시 메모리가 1/4이 된다.
`,
      keyPoints: [
        "캐시가 없으면 과거 토큰의 K, V를 스텝마다 다시 계산한다",
        "causal mask 때문에 과거 토큰의 K, V는 뒤의 토큰과 무관해 결과가 같다",
        "메모리는 층 수, K·V 헤드 수, 헤드당 차원, 시퀀스 길이, 배치 크기에 비례한다",
        "GQA는 Query 헤드들이 K·V 헤드를 공유해 캐시를 줄인다",
      ],
    },
    {
      key: "d2",
      question: "RoPE가 Query와 Key를 어떻게 변환하는지 쓰고, 회전한 두 벡터의 내적이 상대 거리에만 의존하는 이유를 회전 행렬의 성질로 설명하라.",
      answer: md`
RoPE는 위치 $m$의 Query를 각도 $m\theta$만큼, 위치 $n$의 Key를 각도 $n\theta$만큼 회전한다. 실제로는 $d$차원 벡터를 두 성분씩 짝지어 쌍마다 서로 다른 $\theta$로 회전한다.

회전 행렬은 $R(a)^\top R(b) = R(b - a)$를 만족하므로 $(R(m\theta)q)^\top (R(n\theta)k) = q^\top R((n - m)\theta)k$다. 따라서 내적은 두 위치의 절댓값이 아니라 차이 $n - m$에만 의존하고, 위치 쌍 (3, 1)과 (52, 50)의 점수가 같다.
`,
      keyPoints: [
        "위치 $m$의 Query는 $m\\theta$, 위치 $n$의 Key는 $n\\theta$만큼 회전한다",
        "회전 행렬의 성질로 내적에는 각도의 차이 $(n - m)\\theta$만 남는다",
        "점수는 절대 위치가 아니라 상대 거리에만 의존한다",
      ],
    },
  ],
  references: [
    { title: "Hugging Face Transformers — Caching (KV cache)", url: "https://huggingface.co/docs/transformers/main/en/cache_explanation", note: "Transformers 라이브러리에서 KV 캐시가 동작하는 방식 (영문)" },
    { title: "EleutherAI — Rotary Embeddings: A Relative Revolution", url: "https://blog.eleuther.ai/rotary-embeddings/", note: "RoPE의 유도와 구현 (영문)" },
    { title: "Su et al. (2021) — RoFormer: Enhanced Transformer with Rotary Position Embedding", url: "https://arxiv.org/abs/2104.09864", note: "RoPE를 제안한 논문 (영문)" },
  ],
});
