import { defineLesson, md } from "../../kit";
import exercises from "./labs/linear-attention";

export default defineLesson({
  id: "linear-attention",
  title: "선형 어텐션",
  tier: "advanced",
  goal: "attention을 커널 가중평균으로 쓰고 결합법칙으로 선형 attention을 유도하며, 인과적 선형 attention이 고정 크기 상태를 가진 RNN과 같음을 구현으로 확인하고 그 대가를 설명한다.",
  why: "Mamba 같은 상태공간 모델과 게이트 선형 attention처럼 문맥 길이에 대해 선형인 모델은 긴 문맥의 비용을 줄이려는 연구의 주요 방향이다. 이 모델들이 softmax attention과 무엇을 바꾸고 무엇을 잃는지 알아야 긴 문맥 모델을 비교하고 선택할 수 있다.",
  body: md`
FlashAttention([[lesson:efficient-attention]])은 $O(n^2)$ 연산을 빠르게 계산할 뿐 연산량을 줄이지는 않는다. 연산량을 문맥 길이에 비례하도록 줄이는 방법 중 하나가 **선형 attention**(linear attention)이다. 이 레슨은 attention을 커널 가중평균으로 쓰고, 행렬 곱의 결합법칙으로 계산 순서를 바꾸면 attention이 고정 크기 상태를 가진 RNN([[lesson:rnn]])과 같아진다는 것을 보인다(Katharopoulos et al., 2020). Mamba 같은 상태공간 모델(SSM)을 포함한 최근의 Transformer 대안 연구들이 이 관계를 바탕으로 한다.

### 유사도 커널의 가중평균으로 쓴 attention

softmax attention의 출력 $i$번째 행은

$$o_i = \frac{\sum_j \kappa(q_i, k_j)\,v_j}{\sum_j \kappa(q_i, k_j)}, \qquad \kappa(q, k) = \exp\!\left(\frac{q^\top k}{\sqrt{d}}\right)$$

로, 유사도 커널 $\kappa$로 가중한 $v$들의 평균이다(통계학의 나다라야-왓슨 커널 회귀와 같은 형태). 커널을 어떤 특성 사상(feature map) $\phi$로 $\kappa(q, k) = \phi(q)^\top\phi(k)$처럼 분해할 수 있다면

$$o_i = \frac{\phi(q_i)^\top \sum_j \phi(k_j)\,v_j^\top}{\phi(q_i)^\top \sum_j \phi(k_j)}$$

로 합을 **먼저** 계산할 수 있다. $S = \sum_j \phi(k_j)v_j^\top$($d \times d$ 행렬)와 $z = \sum_j \phi(k_j)$($d$ 벡터)는 모든 query가 공유하므로 한 번만 만들면 된다. 연산량이 $O(n^2 d)$에서 $O(n d^2)$로 바뀐다. 행렬 곱의 결합법칙 $(\phi(Q)\phi(K)^\top)V = \phi(Q)(\phi(K)^\top V)$를 쓴 것이다. $\exp$ 커널은 이렇게 유한 차원으로 분해되지 않으므로, 선형 attention은 $\phi(x) = \mathrm{elu}(x) + 1$처럼 양수를 출력하는 간단한 사상을 쓰고, 그 결과는 softmax attention과 **같지 않은 근사**가 된다.

[[diagram:linear-attention-assoc]]

### 인과적 선형 attention과 RNN

GPT처럼 causal mask를 쓰면 $i$번째 토큰은 $j \le i$인 토큰만 참조하므로, 위의 합을 앞에서부터 누적해 계산할 수 있다.

$$S_t = S_{t-1} + \phi(k_t)\,v_t^\top, \qquad z_t = z_{t-1} + \phi(k_t), \qquad o_t = \frac{\phi(q_t)^\top S_t}{\phi(q_t)^\top z_t}$$

이것은 **고정 크기 상태 $(S_t, z_t)$를 가진 RNN**이다. 학습할 때는 행렬 형태로 병렬 계산하고, 생성할 때는 RNN처럼 토큰마다 상태만 갱신한다. KV 캐시([[lesson:kv-cache-rope]])가 문맥 길이에 비례해 커지는 것과 달리, 상태의 크기는 $d \times d$로 문맥 길이와 관계없다.

[[diagram:linear-attention-rnn]]

두 형태가 같은 값을 내는지 코드로 확인한다. (1)은 학습할 때처럼 $n \times n$ 가중치를 만들고 대각선 위를 0으로 만드는 방식이고, (2)는 생성할 때처럼 상태 $S$, $z$만 갱신하는 방식이다.

\`\`\`python
import numpy as np

def phi(x):                                # elu(x) + 1: 항상 양수
    return np.where(x > 0, x + 1, np.exp(x))

rng = np.random.default_rng(0)
n, d = 6, 4
Q, K, V = (rng.normal(size=(n, d)) for _ in range(3))
fQ, fK = phi(Q), phi(K)

# (1) 병렬(행렬) 형태: n×n 가중치를 만든 뒤 causal mask
A = np.tril(fQ @ fK.T)                     # 대각선 위(미래)는 0
parallel = (A @ V) / A.sum(1, keepdims=True)

# (2) RNN 형태: 고정 크기 상태 S(d×d), z(d)만 갱신
S, z, outs = np.zeros((d, d)), np.zeros(d), []
for t in range(n):
    S += np.outer(fK[t], V[t])             # S_t = S_{t-1} + φ(k_t) v_tᵀ
    z += fK[t]                             # z_t = z_{t-1} + φ(k_t)
    outs.append(fQ[t] @ S / (fQ[t] @ z))
print("두 형태의 결과가 같은가?", np.allclose(parallel, np.array(outs)))
print("상태 크기:", S.shape, "+", z.shape, "(문맥 길이와 무관)")
\`\`\`

결과가 같다(\`True\`). (2)의 반복문은 토큰이 몇 개든 $4 \times 4$ 행렬 하나와 길이 4인 벡터 하나만 저장한다.

:::example 연산량 비교
문맥 $n = 100{,}000$, 차원 $d = 128$이라면 softmax attention은 약 $n^2 d \approx 1.3 \times 10^{12}$, 선형 어텐션은 약 $n d^2 \approx 1.6 \times 10^{9}$번의 곱셈이 든다. 비율은 $n/d \approx 780$배다. 문맥이 $d$보다 길수록 차이가 커지고, 문맥이 짧아 $n < d$이면 선형 attention의 연산량이 오히려 크다.
:::

대신 과거 전체를 고정 크기 상태에 담아야 하므로, Seq2Seq의 **정보 병목**([[lesson:attention-motivation]])과 같은 문제가 생긴다. softmax attention은 과거의 모든 K, V를 저장해 어떤 토큰이든 정확히 다시 참조할 수 있지만, 선형 attention은 그렇지 못해 특정 토큰을 정확히 복사하거나 검색하는 과제에 약하다. 최근의 상태공간 모델(Mamba)과 게이트 선형 attention은 상태에 LSTM의 forget gate와 같은 게이트를 더해 이 한계를 줄인다([[lesson:lstm-gru]]).
`,
  checks: [
    {
      key: "c1",
      question: "커널을 $\\phi(q)^\\top\\phi(k)$로 분해할 수 있을 때 선형 attention이 연산량을 줄이는 방법은?",
      choices: ["$(\\phi(Q)\\phi(K)^\\top)V$ 대신 $\\phi(Q)(\\phi(K)^\\top V)$로 결합 순서를 바꾼다", "softmax를 근사 없이 계산한다", "토큰 수를 줄인다", "헤드 수를 늘린다"],
      answer: 0,
      explanation: "$\\phi(K)^\\top V$는 $d\\times d$로 모든 query가 공유한다. 연산량이 $O(n^2d)$에서 $O(nd^2)$가 된다.",
    },
    {
      key: "c2",
      question: "인과적 선형 attention으로 생성할 때 토큰마다 저장하고 갱신하는 것은?",
      choices: ["$S_t = S_{t-1} + \\phi(k_t)v_t^\\top$와 $z_t$라는 고정 크기 상태", "지금까지의 모든 K, V(KV 캐시)", "$n\\times n$ 점수 행렬", "아무것도 없다"],
      answer: 0,
      explanation: "고정 크기 상태를 누적하는 RNN이므로, KV 캐시처럼 문맥 길이에 비례해 커지지 않는다.",
    },
    {
      key: "c3",
      question: "선형 attention이 softmax attention보다 약한 과제로 가장 알맞은 것은?",
      choices: ["먼 과거의 특정 토큰을 정확히 복사하거나 검색하는 과제", "짧은 문장 분류", "단어 임베딩 학습", "두 자리 덧셈"],
      answer: 0,
      explanation: "과거 전체를 $d\\times d$ 상태에 담으므로 Seq2Seq와 같은 정보 병목이 생긴다. softmax attention은 모든 K, V를 저장하므로 어떤 토큰이든 정확히 다시 참조할 수 있다.",
    },
    {
      key: "c4",
      question: "문맥 $n = 100{,}000$, 차원 $d = 100$일 때 softmax attention의 $O(n^2 d)$와 선형 attention의 $O(nd^2)$ 연산량의 비는?",
      choices: ["약 1,000배", "약 100배", "약 10배", "같다"],
      answer: 0,
      explanation: "$n^2 d / (n d^2) = n/d = 100{,}000 / 100 = 1{,}000$이다. 문맥이 차원보다 훨씬 길 때 선형 attention이 유리하다.",
    },
    {
      key: "c5",
      question: "인과적 선형 attention으로 토큰을 생성할 때, 문맥이 길어지면 저장해야 하는 메모리는?",
      choices: ["일정하다($d \\times d$ 상태)", "문맥 길이에 비례해 커진다", "문맥 길이의 제곱으로 커진다", "토큰마다 0으로 초기화된다"],
      answer: 0,
      explanation: "상태 $S_t$($d \\times d$)와 $z_t$($d$)만 갱신하므로 문맥 길이와 무관하다. 문맥 길이에 비례해 커지는 KV 캐시와 대조적이다.",
    },
    {
      key: "c6",
      question: "문맥 길이 $n$이 매우 클 때, 인과적 선형 attention 모델과 softmax attention 모델의 생성 단계(토큰 하나 생성)에 대한 설명으로 옳은 것은?",
      choices: ["선형 attention은 고정 크기 상태만 갱신해 토큰당 비용이 $n$과 관계없고, softmax attention은 KV 캐시 전체와 내적해야 해서 $n$에 비례한다", "둘 다 토큰당 비용이 $n^2$에 비례한다", "softmax attention의 상태 크기가 고정이다", "선형 attention의 KV 캐시가 더 크다"],
      answer: 0,
      explanation: "선형 attention은 $S_t = S_{t-1} + \\phi(k_t)v_t^\\top$를 갱신하는 RNN이므로 토큰당 $O(d^2)$다. softmax attention은 새 Query를 캐시된 Key $n$개와 비교해야 하므로 $O(nd)$이고 캐시도 $n$에 비례한다. 대신 선형 attention은 과거를 고정 크기 상태에 담으므로 정확한 검색에 약하다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "attention을 커널 가중평균으로 쓰고, 커널을 $\\phi(q)^\\top\\phi(k)$로 분해할 때 결합법칙으로 연산량이 $O(n^2d)$에서 $O(nd^2)$로 바뀌는 이유를 쓰라. 인과적 선형 attention이 RNN과 같아지는 이유와 그 대가(정보 병목)도 쓰라.",
      answer: md`
attention 출력은 $o_i=\sum_j\kappa(q_i,k_j)v_j/\sum_j\kappa(q_i,k_j)$로 유사도 커널 $\kappa=\exp(q^\top k/\sqrt d)$로 가중한 평균이다. 커널을 $\phi(q)^\top\phi(k)$로 분해하면 $o_i=\phi(q_i)^\top S/\phi(q_i)^\top z$, $S=\sum_j\phi(k_j)v_j^\top$, $z=\sum_j\phi(k_j)$로 쓸 수 있고, 결합법칙 $(\phi(Q)\phi(K)^\top)V=\phi(Q)(\phi(K)^\top V)$로 $d\times d$ 행렬을 먼저 만들면 연산량이 $O(n^2d)$에서 $O(nd^2)$로 바뀐다(softmax 커널과는 다른 근사). causal mask를 쓰면 $S_t=S_{t-1}+\phi(k_t)v_t^\top$, $z_t=z_{t-1}+\phi(k_t)$로 누적하므로 고정 크기 상태를 가진 RNN과 정확히 같다. 대가로 과거 전체를 고정 크기 상태에 담아야 하므로 Seq2Seq와 같은 정보 병목이 생겨, 먼 과거의 특정 토큰을 정확히 참조하는 과제에 약하다.
`,
      keyPoints: [
        "attention은 유사도 커널로 가중한 Value의 평균이다",
        "결합법칙으로 $\\phi(K)^\\top V$($d \\times d$)를 먼저 계산하면 $O(nd^2)$다",
        "causal이면 $S_t = S_{t-1} + \\phi(k_t)v_t^\\top$로 누적하는 RNN이다",
        "과거를 고정 크기 상태에 담아 정확한 검색에 약하다(정보 병목)",
      ],
    },
  ],
  references: [
    { title: "Katharopoulos et al. (2020) — Transformers are RNNs", url: "https://arxiv.org/abs/2006.16236", note: "선형 어텐션과 RNN의 등가성 (영문)" },
    { title: "Gu & Dao (2023) — Mamba", url: "https://arxiv.org/abs/2312.00752", note: "입력에 따라 상태 갱신을 조절하는 상태공간 모델 (영문)" },
  ],
});
