import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/self-attention";

export default defineLesson({
  id: "self-attention",
  title: "셀프 어텐션: 쿼리·키·값",
  tier: "core",
  concepts: ["attention-transformer"],
  goal: "$\\text{softmax}(QK^\\top/\\sqrt{d_k})V$의 각 부분($QK^\\top$, softmax, $\\sqrt{d_k}$, Value의 가중합)이 필요한 이유를 설명하고, 작은 예제를 손과 코드로 계산한다.",
  why: "self-attention은 Transformer와 LLM의 핵심 연산이다. 이 식을 계산할 수 있어야 multi-head attention([[lesson:multi-head-attention]])과 디코더 블록([[lesson:transformer-block]])을 구현할 수 있고, 문맥이 길수록 비용이 커지는 이유와 KV 캐시([[lesson:kv-cache-rope]])가 저장하는 값을 이해할 수 있다.",
  body: md`
[[diagram:attention-qkv]]

그림에서 토큰을 선택하면 그 토큰이 Query가 되고, 화살표의 굵기가 그 Query가 각 토큰에 주는 가중치를 나타낸다.

### Query, Key, Value

**self-attention**은 입력 시퀀스의 각 토큰 벡터 $x_i$에 학습 가능한 세 행렬 $W_q$, $W_k$, $W_v$를 곱해 **Query** $q_i = x_iW_q$, **Key** $k_i = x_iW_k$, **Value** $v_i = x_iW_v$를 만든다. $i$번째 토큰의 Query $q_i$와 모든 토큰의 Key $k_j$의 내적 $q_i \cdot k_j$를 관련도 점수로 쓰고, 점수를 $\sqrt{d_k}$로 나눈 뒤 softmax로 합이 1인 가중치 $a_{ij}$로 바꾼다. $i$번째 토큰의 출력은 이 가중치로 모든 토큰의 Value를 가중합한 $\text{output}_i = \sum_j a_{ij} v_j$다. Key는 각 토큰이 얼마나 참조될지를 정하는 데만 쓰이고, 출력에 더해지는 정보는 Value다. Key와 Value를 서로 다른 행렬로 계산하므로, 참조할 정도를 정하는 기준과 전달할 정보를 따로 학습할 수 있다.

입력 $X$($n \times d$)에 세 행렬을 곱해 $Q = XW_q$, $K = XW_k$, $V = XW_v$(각각 $n \times d_k$)를 만들면, 전체 계산은 다음 식이다.

\`\`\`math
\text{Attention}(Q,K,V) = \text{softmax}\left(\dfrac{QK^\top}{\sqrt{d_k}}\right)V
\`\`\`

식의 각 부분이 필요한 이유는 다음과 같다.

**$QK^\top$**: 두 벡터의 내적은 두 벡터의 방향이 얼마나 비슷한지를 나타낸다([[lesson:dot-product]]). $Q$($n \times d_k$)와 $K^\top$($d_k \times n$)의 곱은 $n \times n$ 행렬이고, $(i, j)$ 원소는 $i$번째 토큰의 Query와 $j$번째 토큰의 Key의 점수다. 행렬 곱 한 번으로 모든 토큰 쌍의 점수를 계산한다.

**softmax**: 점수는 부호와 크기가 제각각인 실수라, 그대로 Value에 곱하면 각 토큰에서 정보를 얼마씩 가져오는지 비율로 해석할 수 없다. softmax는 각 행의 점수를 0 이상이고 합이 1인 값으로 바꾼다. 지수함수를 거치므로 점수의 차이가 커지고, 가장 관련이 큰 토큰에 큰 가중치가 놓인다.

**$\sqrt{d_k}$로 나누기**: $q$와 $k$의 성분이 서로 독립이고 평균 0, 분산 1이면, 내적 $q \cdot k$는 독립인 항 $d_k$개의 합이므로 분산이 $d_k$다([[lesson:random-variables]]). $d_k$가 크면 점수의 절댓값이 커져 softmax의 출력이 가장 큰 점수 하나에 거의 1, 나머지에 거의 0인 원-핫 벡터에 가까워진다. 이 상태에서는 softmax의 기울기가 거의 0이라 학습이 진행되지 않는다. $\sqrt{d_k}$로 나누면 점수의 분산이 1 근처로 돌아와 softmax가 여러 토큰에 가중치를 나눠 준다.

:::example 계산 예: "고양이가 생선을 맛있게 먹었다"
"생선을"이 Query인 경우를 계산한다. $d_k = 4$이고, 학습된 Key 벡터가 고양이가 $[1, 0, 0, 0]$, 생선을 $[1, 1, 1, 1]$, 맛있게 $[0, 0, 1, 0]$, 먹었다 $[1, 1, 0, -1]$이며, "생선을"의 Query가 $[1, 1, 0, 1]$이라 하자.

Query와 각 Key의 내적은 고양이가 1, 생선을 3, 맛있게 0, 먹었다 1이다. $\sqrt{d_k} = 2$로 나누면 $[0.5, 1.5, 0, 0.5]$이고, 지수를 취하면 $e^{0.5} \approx 1.65$, $e^{1.5} \approx 4.48$, $e^0 = 1$, $e^{0.5} \approx 1.65$이며 합은 약 8.78이다. 합으로 나눈 가중치는 고양이가 18.8%, 생선을 51.0%, 맛있게 11.4%, 먹었다 18.8%다.

Value를 2차원으로 단순화해 고양이가 $[2, 0]$, 생선을 $[0, 3]$, 맛있게 $[1, 1]$, 먹었다 $[4, 0]$이라 하면, 출력은 $0.188 \times [2, 0] + 0.510 \times [0, 3] + 0.114 \times [1, 1] + 0.188 \times [4, 0] \approx [1.24, 1.65]$다. 이 벡터가 문장 전체의 Value를 가중합해 얻은 "생선을"의 새 표현이다. 그림에서 "생선을"을 선택했을 때의 비율(19%, 51%, 11%, 19%)이 이 결과다.
:::

[[diagram:attention-steps]]

### 코드로 확인하기

손 계산을 NumPy로 옮긴다. \`K @ q\`는 Key 네 개와 Query의 내적을 한 번에 계산하는 행렬-벡터 곱이다.

\`\`\`python
import numpy as np

K = np.array([[1, 0, 0, 0],     # 고양이가
              [1, 1, 1, 1],     # 생선을
              [0, 0, 1, 0],     # 맛있게
              [1, 1, 0, -1]])   # 먹었다
V = np.array([[2, 0], [0, 3], [1, 1], [4, 0]])
q = np.array([1, 1, 0, 1])      # "생선을"의 Query

scores = K @ q                  # 내적 4개: [1, 3, 0, 1]
scaled = scores / np.sqrt(4)    # √d_k = 2로 나눈다
weights = np.exp(scaled) / np.exp(scaled).sum()
print("점수:", scores, "→ 스케일:", scaled)
print("가중치:", weights.round(3), "합 =", round(weights.sum(), 6))
print("출력:", (weights @ V).round(2))   # [1.24 1.65]
\`\`\`

### 모든 Query를 한꺼번에 계산하기

실제로는 모든 토큰이 동시에 Query가 된다. 토큰 $n$개, Query·Key 차원 $d_k$, Value 차원 $d_v$이면 각 단계의 모양은 다음과 같다.

| 단계 | 계산 | 모양 | 의미 |
| --- | --- | --- | --- |
| ① | $Q$, $K$ | $(n, d_k)$ | 토큰마다 Query·Key 벡터 하나씩 |
| ② | $QK^\top$ | $(n, n)$ | 모든 토큰 쌍의 점수 |
| ③ | $\div \sqrt{d_k}$, 행별 softmax | $(n, n)$ | 각 행의 합이 1인 가중치 |
| ④ | $\times V$ | $(n, d_v)$ | 토큰마다 새 표현 하나씩 |

③의 softmax는 **행마다** 따로 적용한다. 한 행은 Query 하나가 모든 토큰에 주는 가중치이므로 그 행 안에서 합이 1이 된다.

[[diagram:attention-matrix-shapes]]

:::tip softmax는 모든 점수에 같은 수를 더해도 결과가 같다
점수 $[1, 3, 0, 1]$에 모두 10을 더한 $[11, 13, 10, 11]$을 softmax에 넣어도 결과가 같다. $e^{s_i + c} = e^{s_i}e^c$에서 $e^c$가 분자와 분모에 똑같이 곱해져 약분되기 때문이다. softmax의 결과는 점수의 **차이**에만 의존한다. [[lesson:multi-head-attention]]의 코드가 최댓값을 빼고 계산하는 것도 이 성질을 이용한 것이다. 반대로 점수에 같은 수를 **곱하면** 차이도 그만큼 커져 결과가 한 토큰에 집중된다. $\sqrt{d_k}$로 나누는 것은 이 배율을 조절하는 일이다.
:::

### $\sqrt{d_k}$의 효과

무작위 $q$, $k$ 1만 쌍의 내적 분산을 계산하고, 같은 점수를 크게 키웠을 때 softmax가 어떻게 바뀌는지 비교한다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
for dk in [4, 64, 512]:
    q = rng.normal(size=(10000, dk))
    k = rng.normal(size=(10000, dk))
    dots = (q * k).sum(axis=1)                 # 무작위 q·k 1만 쌍
    print(f"d_k={dk:3d}: 내적 분산 {dots.var():7.1f},  √d_k로 나눈 뒤 분산 {(dots / np.sqrt(dk)).var():.2f}")

def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()

s = rng.normal(size=8)                         # 분산 1인 점수 8개
print("스케일 맞춘 점수 → softmax:", softmax(s).round(2))
print("√512배로 커진 점수 → softmax:", softmax(s * np.sqrt(512)).round(2))
\`\`\`

내적의 분산은 $d_k$와 거의 같고(4.0, 65.3, 509.7), $\sqrt{d_k}$로 나누면 1 근처가 된다. 아래 두 줄은 같은 점수의 softmax다. 스케일이 맞으면 여러 토큰에 가중치가 나뉘지만, $\sqrt{512} \approx 22.6$배로 커진 점수에서는 두 칸만 0이 아니고 나머지는 모두 0이다. 이렇게 원-핫에 가까운 softmax는 기울기가 거의 0이어서 학습이 진행되지 않는다.

[[diagram:sqrt-dk-softmax]]
`,
  checks: [
    {
      key: "c1",
      question: "토큰 $n$개, $d_k = 64$일 때 $QK^\\top$의 모양은?",
      choices: ["$(n, 64)$", "$(64, 64)$", "$(n, n)$", "$(n, 1)$"],
      answer: 2,
      explanation: "$(n, d_k) \\times (d_k, n) = (n, n)$이다. 모든 토큰 쌍의 점수이므로 문맥이 2배가 되면 원소 수는 4배가 된다.",
    },
    {
      key: "c2",
      question: "$q = [1, 1, 0, 1]$, $k = [1, 1, 0, -1]$일 때 $\\sqrt{d_k}$로 나눈 점수는?",
      choices: ["$1$", "$0.5$", "$0.25$", "$2$"],
      answer: 1,
      explanation: "$q \\cdot k = 1 + 1 + 0 - 1 = 1$이고 $\\sqrt{4} = 2$로 나누면 $0.5$다. 본문 예제의 \"먹었다\" 칸이다.",
    },
    {
      key: "c3",
      question: "$\\sqrt{d_k}$로 나누지 않으면 생기는 문제는?",
      choices: [
        "점수가 모두 0이 된다",
        "내적의 분산이 $d_k$에 비례해 커져 softmax가 한 토큰에 거의 모든 가중치를 주고 기울기가 거의 0이 된다",
        "출력의 모양이 바뀐다",
        "causal mask가 작동하지 않는다",
      ],
      answer: 1,
      explanation: "내적의 분산이 $d_k$이므로 $d_k = 512$이면 점수의 표준편차가 약 22.6이 된다. 본문 코드처럼 softmax의 출력이 원-핫에 가까워지고, 이때 기울기가 거의 0이다.",
    },
    {
      key: "c4",
      question: "토큰 10개, $d_k = 64$, $d_v = 32$일 때 $\\text{softmax}(QK^\\top/\\sqrt{d_k})V$의 모양은?",
      choices: ["$(10, 32)$", "$(10, 10)$", "$(10, 64)$", "$(64, 32)$"],
      answer: 0,
      explanation: "$QK^\\top$은 $(10, 10)$이고, 여기에 $V$ $(10, 32)$를 곱하면 $(10, 32)$다. 토큰마다 $d_v$차원의 새 표현이 하나씩 나온다.",
    },
    {
      key: "c5",
      question: "어떤 Query의 점수 $[1, 3, 0, 1]$에 모두 10을 더해 $[11, 13, 10, 11]$로 만들면 softmax 가중치는 어떻게 되는가?",
      choices: ["변하지 않는다", "모두 10배가 된다", "가장 큰 값에 더 집중된다", "모두 같아진다"],
      answer: 0,
      explanation: "softmax의 결과는 점수의 차이에만 의존한다. 공통으로 곱해지는 $e^{10}$이 분자와 분모에서 약분되기 때문이다. 반대로 점수에 같은 수를 곱하면 차이가 커져 가중치가 한 토큰에 집중된다.",
    },
    {
      key: "c6",
      question: "Query 5개(`Q`: (5, 8))와 Key 7개(`K`: (7, 8))로 `S = Q @ K.T`를 만들었다. attention 가중치를 만들 때 softmax는 어느 축으로 적용해야 하는가?",
      choices: ["axis=0: Key마다 Query들에 대한 분포", "axis=-1: Query(행)마다 Key 7개에 대한 분포", "전체 35칸에 한 번", "축과 관계없다"],
      answer: 1,
      explanation: "`S`는 (5, 7)이고 행 하나가 Query 하나다. Query마다 Key 7개에 주는 가중치의 합이 1이어야 하므로 행마다(마지막 축) softmax를 적용한다. 그래야 `weights @ V`가 Query마다의 가중합이 된다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
q = np.array([1, 1, 0, 1])
K = np.array([[1, 0, 0, 0], [1, 1, 1, 1], [0, 0, 1, 0], [1, 1, 0, -1]])
print((K @ q).tolist(), (K @ q / np.sqrt(4)).tolist())
`,
      expected: "[1, 3, 0, 1] [0.5, 1.5, 0.0, 0.5]",
      explanation: "Query와 각 Key의 내적은 고양이가 1, 생선을 3, 맛있게 0, 먹었다 1이다. $\\sqrt{d_k} = 2$로 나누면 `[0.5, 1.5, 0.0, 0.5]`가 되고, 여기에 softmax를 적용하면 본문의 18.8%, 51.0%, 11.4%, 18.8%가 나온다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$\\text{softmax}(QK^\\top/\\sqrt{d_k})V$에서 $QK^\\top$, softmax, $V$의 가중합이 각각 하는 일을 쓰고, 출력이 Key가 아니라 Value의 가중합인 이유를 쓰라.",
      answer: md`
$QK^\top$은 모든 토큰 쌍에 대해 Query와 Key의 내적을 계산해 $n \times n$ 점수 행렬을 만든다. 내적이 클수록 두 벡터의 방향이 비슷하므로, $(i, j)$ 원소는 $i$번째 토큰이 $j$번째 토큰을 얼마나 참조할지를 나타낸다. softmax는 각 행의 점수를 0 이상이고 합이 1인 가중치로 바꿔, 각 토큰에서 정보를 가져올 비율로 해석할 수 있게 한다. 마지막으로 이 가중치로 Value를 가중합해 토큰마다 문맥이 반영된 새 표현을 만든다.

Key는 각 토큰이 얼마나 참조될지를 정하는 점수 계산에만 쓰이고, 다음 층에 전달할 정보는 Value가 담는다. Key와 Value를 다른 행렬로 계산하므로 참조할 정도를 정하는 기준과 전달할 정보를 따로 학습할 수 있다.
`,
      keyPoints: [
        "$QK^\\top$: 모든 토큰 쌍의 관련도 점수를 계산한다",
        "softmax: 행마다 합이 1인 가중치로 바꾼다",
        "출력은 가중치로 Value를 가중합한 새 표현이다",
        "Key는 점수 계산에만, Value는 전달할 정보에 쓰인다",
      ],
    },
    {
      key: "d2",
      question: "$\\sqrt{d_k}$로 나누지 않으면 생기는 문제를 내적의 분산과 softmax의 기울기로 쓰고, 토큰 수 $n = 1000$일 때 헤드 하나의 점수 행렬 크기와 문맥이 2배가 될 때 계산량의 변화를 쓰라.",
      answer: md`
$q$와 $k$의 성분이 독립이고 분산이 1이면 내적은 독립인 항 $d_k$개의 합이라 분산이 $d_k$다. 나누지 않으면 $d_k$가 클수록 점수의 절댓값이 커지고, softmax의 출력이 가장 큰 점수 하나에 거의 1이 몰린 원-핫에 가까워진다. 이 영역에서는 softmax의 기울기가 거의 0이라 학습이 진행되지 않는다. $\sqrt{d_k}$로 나누면 점수의 분산이 1 근처가 되어 이 문제가 없어진다.

$n = 1000$이면 헤드 하나의 점수 행렬은 $1000 \times 1000$으로 원소가 100만 개다. 점수 행렬의 계산량은 $O(n^2)$이므로 문맥이 2배가 되면 약 4배가 된다.
`,
      keyPoints: [
        "내적의 분산은 $d_k$에 비례한다",
        "점수가 크면 softmax가 원-핫에 가까워지고 기울기가 거의 0이 된다",
        "$\\sqrt{d_k}$로 나누면 분산이 1 근처가 된다",
        "$n = 1000$이면 점수 행렬 원소 100만 개, 문맥이 2배면 계산량 약 4배",
      ],
    },
  ],
  references: [
    { title: "Jay Alammar — The Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/", note: "Q, K, V의 계산을 벡터 단위로 그린 자료 (영문)" },
    { title: "3Blue1Brown — Attention in transformers, visually explained", url: "https://www.3blue1brown.com/lessons/attention", note: "attention의 계산을 그림으로 설명하는 영상 (영문)" },
    { title: "Vaswani et al. (2017) — Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", note: "3.2절 Scaled Dot-Product Attention, 각주 4에 √dk로 나누는 이유 (영문)" },
  ],
});
