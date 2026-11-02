import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/kv-cache-rope";

export default defineLesson({
  id: "kv-cache-rope",
  title: "생성 단계의 트랜스포머: KV 캐시와 RoPE",
  tier: "supplement",
  goal: "생성 시 KV 캐시가 무엇을 저장하고 무엇을 새로 계산하는지, 왜 결과가 같은지 설명하고, 메모리 비용을 계산하며, RoPE가 회전으로 상대 거리만 반영하는 원리를 말할 수 있다.",
  why: "",
  body: md`
지금까지 다룬 Self-Attention 계산은 전부 학습(training) 시점의 이야기다. 학습할 때는 정답 문장 전체가 이미 손에 쥐어져 있으므로, n개 토큰짜리 문장을 통째로 행렬에 밀어 넣고 Q, K, V를 한 번에 계산해 $(n \times n)$ attention을 한꺼번에 구한다. 그런데 실제로 ChatGPT 같은 모델이 답을 "타이핑하듯" 한 토큰씩 생성할 때(추론, inference)는 사정이 전혀 다르다. 다음에 올 토큰이 아직 존재하지 않으므로, 그 토큰을 만들어내려면 지금까지 나온 토큰들만 가지고 매 스텝마다 Self-Attention을 다시 계산해야 한다.

문제는 여기서 생긴다. 아무 최적화도 하지 않는다면, 101번째 토큰을 생성할 때 모델은 1번째부터 100번째 토큰까지의 Key와 Value를 처음부터 다시 계산한 뒤에야 101번째 토큰의 attention을 구할 수 있다. 그런데 곰곰이 따져보면 이것은 순전히 낭비다. causal mask 때문에 각 토큰의 K, V는 오직 자기 자신의 표현과 $W_k$, $W_v$로만 정해질 뿐 뒤에 어떤 토큰이 새로 등장하는지는 전혀 참고하지 않는다. 즉 1번째~100번째 토큰의 Key, Value는 101번째 토큰이 뒤에 하나 더 붙는다고 해서 눈곱만큼도 바뀌지 않는데도, 최적화 없이 구현하면 매 스텝마다 이것을 처음부터 다시 계산하는 셈이다. 결과적으로 시퀀스 길이에 비례하는 계산량이 매 생성 스텝마다 반복되는 구조적인 낭비가 발생한다.

KV 캐시(KV cache)는 정확히 이 낭비를 없애는 장치다. 아이디어는 단순하다. 각 스텝에서 계산한 Key와 Value를 버리지 않고 레이어별로 메모리에 저장(cache)해 둔다. 다음 스텝에서는 새로 들어온 토큰 하나에 대해서만 Query·Key·Value를 새로 계산하고, 이 새 Key와 Value를 캐시 뒤에 이어 붙인 다음, 새 토큰의 Query 하나만 "캐시에 쌓여 있는 모든 K, V"와 대조하면 그것으로 끝이다. 계산량으로 보면 매 스텝마다 지금까지의 토큰 수만큼($O(n)$)의 K, V를 다시 만드는 대신, 새 토큰 한 개 분량($O(1)$)만 계산하면 되므로, 문장이 길어질수록 이 절약분은 점점 크게 벌어진다.

[[diagram:kv-cache-steps]]

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

### 캐시를 써도 결과가 정말 같은가

"과거 토큰의 K, V는 뒤에 무엇이 오든 변하지 않는다"는 말이 맞다면, 한 토큰씩 캐시를 쌓아 가며 계산한 결과는 학습 때처럼 전체를 한 번에 계산한 결과와 같아야 한다. 직접 확인해 보자.

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
    q, k, v = x @ Wq, x @ Wk, x @ Wv             # 새로 계산하는 것은 이 셋뿐
    K_cache.append(k); V_cache.append(v)         # 캐시 뒤에 이어 붙이기
    K, V = np.array(K_cache), np.array(V_cache)  # (t+1, d): 지금까지의 모든 K, V
    outs.append(softmax(q @ K.T / np.sqrt(d)) @ V)   # 마스크가 필요 없다: 캐시엔 과거만 있다
print("두 방식의 결과가 같은가?", np.allclose(full, np.array(outs)))
print("마지막 스텝의 캐시 크기:", K.shape)
\`\`\`

\`True\`가 나온다. 한 토큰씩 계산할 때는 마스크도 필요 없다. 캐시에는 언제나 과거와 현재 토큰만 들어 있어서 "미래를 가린다"는 일이 저절로 지켜지기 때문이다.

:::info 프리필(prefill)과 디코드(decode)
실제 생성은 두 단계로 나뉜다. 먼저 **프리필**에서 사용자가 보낸 프롬프트 전체를 학습 때처럼 한 번에 병렬로 처리해 캐시를 채운다. 그다음 **디코드**에서 위 코드의 반복문처럼 토큰을 하나씩 만들며 캐시에 덧붙인다. 프리필은 계산이 많지만 병렬이라 빠르고, 디코드는 토큰마다 캐시 전체를 메모리에서 읽어야 해서 메모리 속도에 묶인다. 긴 프롬프트를 넣으면 첫 글자가 나오기까지 잠깐 기다리고, 그 뒤로는 일정한 속도로 글자가 나오는 이유다.
:::

[[diagram:prefill-decode]]

:::example KV 캐시는 메모리를 얼마나 차지하는가
대략적인 규모를 가늠하기 위해, 레이어 32개, 헤드 32개, 헤드당 차원 128인 모델을 시퀀스 길이 2048, 배치 크기 1로 돌린다고 하자. 캐시해야 할 것은 레이어마다, 헤드마다, 토큰 하나마다 Key와 Value 벡터(각각 128차원) 두 개다. 전체 원소 개수는 \`레이어 수 × 헤드 수 × 헤드당 차원 × 시퀀스 길이 × 2(K와 V) × 배치 크기\` $= 32 \times 32 \times 128 \times 2048 \times 2 \times 1 \approx$ **5억 3천만 개**다. 여기에 흔히 쓰는 fp16(원소 하나당 2바이트)을 곱하면 약 **1.07GB**가 나온다. 배치 크기를 8로 늘리면(즉 동시에 8명이 대화 중이면) 이 숫자는 그대로 8배로 불어나 8GB를 넘는다. 실제 서비스에서 "동시 사용자가 늘어날수록 GPU 메모리가 모자란다"는 현상은 상당 부분 바로 이 KV 캐시 때문이다. 연산량(FLOPs)을 아끼는 대신 메모리를 그만큼 소비하는, 전형적인 시간-공간 트레이드오프인 셈이다.

이 메모리를 줄이려고 나온 구조가 **GQA(Grouped-Query Attention)**다. Query 헤드는 32개 그대로 두되 K, V 헤드는 8개만 두고 Query 헤드 4개가 K·V 헤드 하나를 같이 쓰게 하면, 캐시는 K·V 헤드 수에 비례하므로 위 예의 1.07GB가 4분의 1인 약 0.27GB로 줄어든다. K·V 헤드를 하나만 두는 극단적인 경우를 MQA(Multi-Query Attention)라 한다.
:::

[[diagram:gqa-sharing]]

### RoPE: 회전으로 상대 거리를 담는 위치 인코딩

위치 인코딩 쪽에서도 이런 실용적 요구와 맞물려 자리 잡은 방식이 있는데, 핵심 과정 「위치 인코딩과 Transformer 디코더 블록」 단계에서 잠깐 언급했던 RoPE(Rotary Position Embedding, 회전 위치 인코딩)다. 원 논문의 사인·코사인 위치 인코딩이나 학습형 위치 임베딩은 "너는 5번째 자리다"라는 절대 번호표를 임베딩에 더해주는 방식이었다. RoPE의 방식은 다르다. 벡터를 더하는 대신, 각 토큰의 Query와 Key 벡터를 그 토큰의 위치 인덱스에 비례하는 각도만큼 회전 행렬로 회전시킨다. 위치 $m$의 Query를 각도 $m\theta$만큼, 위치 $n$의 Key를 각도 $n\theta$만큼 회전시킨 뒤 내적을 구하면, 회전의 성질(내적이 두 벡터 사이의 상대 각도에만 의존한다는 성질)에 의해 그 결과는 $m\theta$, $n\theta$ 각각의 절댓값이 아니라 두 각도의 차이 $(m-n)\theta$, 즉 두 토큰 사이의 상대적 거리에만 의존하는 값으로 정리된다. 그 결과 모델은 "이 토큰이 정확히 몇 번째인지"는 attention 점수 계산에 직접 담고 있지 않지만 "이 토큰이 저 토큰보다 몇 칸 뒤에 있는지"는 정확히 반영하게 되고, 이 상대 거리 정보는 학습 때 보지 못한 더 긴 문장에도 비교적 안정적으로 일반화된다는 장점 덕분에 오늘날 대부분의 최신 LLM이 RoPE를 채택하고 있다.

RoPE의 회전이 왜 상대 거리만 남기는지, 학습 길이보다 긴 문맥에서 무엇이 깨지고 어떻게 고치는지는 심화 과정의 「위치 인코딩의 수학과 길이 외삽」 단계에서 다룬다.

시계로 비유해 보자. 두 사람이 각자 시계 사진을 한 장씩 보여주면, 우리는 사진 속 바늘 각도의 **차이**만으로 두 시각이 몇 시간 떨어져 있는지 알 수 있다. 두 사람이 똑같이 3시간씩 늦게 찍었더라도(두 바늘을 같은 각도만큼 더 돌려도) 그 차이는 변하지 않는다. RoPE에서 각 토큰의 Query와 Key는 위치만큼 돌아간 시계 바늘이고, attention 점수(내적)는 두 바늘 사이의 각도, 즉 두 토큰의 **상대 거리**에만 반응한다.

### 2차원에서 직접 돌려 보기

RoPE의 원리는 2차원 벡터 하나로 충분히 확인할 수 있다. 2차원 벡터를 각도 $\phi$만큼 돌리는 회전 행렬은

\`\`\`math
R(\phi) = \begin{pmatrix} \cos\phi & -\sin\phi \\ \sin\phi & \cos\phi \end{pmatrix}
\`\`\`

이다. 위치 $m$의 Query는 $R(m\theta)q$, 위치 $n$의 Key는 $R(n\theta)k$로 돌린 뒤 내적한다. 실제 RoPE는 $d$차원 벡터를 두 성분씩 짝지어 쌍마다 서로 다른 $\theta$로 이 회전을 적용할 뿐이다.

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

위치가 (3, 1), (10, 8), (52, 50)으로 전혀 다르지만 거리가 2로 같으면 점수가 정확히 같다. 거리가 4로 바뀌어야 점수가 달라진다. 내적은 두 벡터 사이의 각도에만 의존하고, 두 벡터를 각각 $m\theta$, $n\theta$만큼 돌리면 그 사이 각도는 원래 각도에서 $(m - n)\theta$만큼만 바뀌기 때문이다.

[[diagram:rope-rotation]]
`,
  checks: [
    {
      key: "c1",
      question: "KV 캐시를 쓸 때 매 생성 스텝에 새로 계산하는 것은?",
      choices: ["지금까지 모든 토큰의 Q, K, V", "새 토큰 하나의 Q, K, V (과거 K, V는 캐시에서 읽음)", "과거 토큰의 Q만", "아무것도 새로 계산하지 않는다"],
      answer: 1,
      explanation: "causal mask 때문에 과거 토큰의 K, V는 새 토큰이 와도 변하지 않으므로 저장해 두고 재사용한다.",
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
      question: "레이어 32, head 32, head 차원 128, 시퀀스 2048, 배치 1, fp16일 때 KV 캐시 메모리는 약?",
      choices: ["약 67MB", "약 1.07GB", "약 8.6GB", "약 17GB"],
      answer: 1,
      explanation: "$32 \\times 32 \\times 128 \\times 2048 \\times 2 \\approx 5.37 \\times 10^8$개에 원소당 2바이트를 곱하면 약 1.07GB. 배치 8이면 8배가 된다.",
    },
    {
      key: "c4",
      question: "RoPE로 회전한 $q$(위치 $m$)와 $k$(위치 $n$)의 내적이 의존하는 것은?",
      choices: ["$m$과 $n$ 각각의 절댓값", "$m - n$(상대 거리)", "$m + n$", "문장 전체 길이"],
      answer: 1,
      explanation: "회전 각도의 차이 $(m-n)\\theta$만 남는다. 그래서 위치 쌍 (5,3), (12,10), (102,100)의 점수가 모두 같다.",
    },
    {
      key: "c5",
      question: "Query 헤드 32개는 그대로 두고 K·V 헤드를 8개로 줄인 GQA를 쓰면, KV 캐시 메모리는 원래의 몇 배가 되는가?",
      choices: ["1/4배", "1/32배", "변하지 않는다", "1/8배"],
      answer: 0,
      explanation: "KV 캐시는 저장하는 K·V 헤드 수에 비례한다. 32개에서 8개로 줄면 1/4이 된다. Query 헤드 수는 캐시 크기와 무관하다.",
    },
    {
      key: "c6",
      question: "생성의 프리필(prefill) 단계에서 일어나는 일은?",
      choices: ["프롬프트 전체를 한 번에 병렬 처리해 KV 캐시를 채운다", "토큰을 하나씩 만들며 캐시에 덧붙인다", "KV 캐시를 비운다", "모델 가중치를 프롬프트에 맞게 갱신한다"],
      answer: 0,
      explanation: "프리필은 이미 주어진 프롬프트를 학습 때처럼 병렬로 처리해 캐시를 채우는 단계다. 그 뒤 디코드 단계에서 토큰을 하나씩 생성한다.",
    },
    {
      key: "c7",
      question: "KV 캐시로 한 토큰씩 생성할 때 causal mask를 쓰지 않아도 결과가 학습 때와 같은 이유는?",
      choices: ["생성할 때는 미래 토큰을 봐도 괜찮기 때문에", "캐시에는 현재 토큰까지의 K·V만 들어 있어, 볼 수 있는 범위가 이미 과거로 제한되기 때문에", "RoPE가 마스크 역할을 하기 때문에", "softmax가 미래 토큰에 0을 주도록 학습되었기 때문에"],
      answer: 1,
      explanation: "생성 시점 $t$의 캐시에는 위치 0~$t$의 Key·Value만 있습니다. 아직 만들어지지 않은 미래 토큰은 존재하지 않으므로, 전체 문장을 한 번에 계산할 때 마스크로 가리던 것과 똑같은 계산이 됩니다.",
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
      explanation: "레이어 수 · 헤드 수 · 헤드 차원 · 시퀀스 길이 · 2(K와 V) · 배치를 모두 곱하면 약 5억 3,700만 개입니다. fp16은 원소당 2바이트라 약 1.07GB이며, 배치 8이면 8배로 늘어납니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "추론(생성) 중 KV 캐시가 없다면 101번째 토큰을 생성할 때 정확히 어떤 계산이 낭비되는가? 그리고 왜 그 계산 결과가 이전 스텝과 똑같이 나오는가?",
      answer: md`
101번째 토큰을 만들 때 causal mask 때문에 1~100번째 토큰의 Key/Value는 새 토큰이 추가되어도 전혀 바뀌지 않는데, 캐시가 없으면 매번 1~100번째 토큰의 K,V를 처음부터 다시 계산한다. 그 결과는 이전 스텝과 100% 동일하므로 순수한 낭비다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "KV 캐시가 저장하는 것은 무엇이고, 매 스텝 새로 계산해야 하는 것은 무엇인가? 회의록 비유로 설명하라.",
      answer: md`
KV 캐시는 이미 지나간 토큰들의 Key와 Value(=회의록)를 저장해두고, 매 스텝에는 새로 추가된 토큰 하나의 Query(=새 안건)만 새로 계산해서 저장된 K,V와 대조한다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "RoPE가 절대 위치 대신 상대 위치(거리)를 인코딩한다는 것을 시계 바늘 비유로 설명하라.",
      answer: md`
시계에서 두 바늘의 '차이(각도)'만 보면 정확히 몇 시인지는 몰라도 두 시각 사이의 간격은 알 수 있는 것처럼, RoPE는 각 토큰의 절대 위치 대신 두 토큰 사이의 상대적 회전각(거리)만 attention 계산에 반영되도록 Q, K를 위치에 비례해 회전시킨다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Hugging Face Transformers — Caching (KV cache)", url: "https://huggingface.co/docs/transformers/main/en/cache_explanation", note: "실제 라이브러리에서 KV 캐시가 동작하는 방식 (영문)" },
    { title: "EleutherAI — Rotary Embeddings: A Relative Revolution", url: "https://blog.eleuther.ai/rotary-embeddings/", note: "RoPE의 직관과 수식 (영문)" },
    { title: "Su et al. (2021) — RoFormer: Enhanced Transformer with Rotary Position Embedding", url: "https://arxiv.org/abs/2104.09864", note: "RoPE 원 논문 (심화)" },
  ],
});
