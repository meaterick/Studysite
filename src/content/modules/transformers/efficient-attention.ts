import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/efficient-attention";

export default defineLesson({
  id: "efficient-attention",
  title: "긴 문맥의 비용: 온라인 softmax와 FlashAttention",
  tier: "advanced",
  goal: "최댓값을 빼는 안전한 softmax와 온라인 softmax 갱신식을 유도·구현하고, FlashAttention이 GPU 메모리 계층에서 HBM 왕복을 줄여 빨라지는 이유와 한계를 설명할 수 있다.",
  why: "",
  body: md`
Self-Attention은 $n$개 토큰 사이의 점수 행렬 $n \times n$을 만든다. 문맥이 두 배가 되면 이 행렬은 네 배가 된다. 13만 토큰 문맥이면 헤드 하나의 점수 행렬만 fp16으로 32GiB다. 그런데 오늘날의 LLM은 수십만 토큰 문맥을 실제로 처리한다. 비결의 중심에 있는 것이 FlashAttention(Dao et al., 2022)이고, 그 핵심은 의외로 **softmax를 나눠서 계산하는 산수 하나**다. 이 단계는 그 산수를 유도하고, GPU에서 왜 "연산을 줄이는 것"보다 "메모리 왕복을 줄이는 것"이 더 중요한지 설명한다.

[[diagram:attention-memory-scaling]]

### 안전한 softmax와 온라인 softmax

softmax $\frac{e^{s_i}}{\sum_j e^{s_j}}$를 그대로 계산하면 점수가 1000만 되어도 $e^{1000}$이 넘쳐 nan이 된다. 그래서 실제 구현은 최댓값 $m = \max_j s_j$를 빼서 $\frac{e^{s_i - m}}{\sum_j e^{s_j - m}}$로 계산한다(값은 같고 지수는 항상 1 이하). 문제는 $m$을 알려면 점수를 **전부** 봐야 한다는 것이다.

**온라인 softmax**는 점수를 블록 단위로 보면서 최댓값을 갱신해 나간다. 지금까지의 최댓값 $m$, 지수 합 $\ell = \sum e^{s_j - m}$, 가중합 $a = \sum e^{s_j - m} v_j$를 들고 있다가, 새 블록에서 더 큰 최댓값 $m'$이 나오면 이전 값들에 $e^{m - m'}$을 곱해 새 기준으로 다시 맞춘다.

$$m' = \max(m, \max_{j \in \text{블록}} s_j), \quad \ell' = \ell\,e^{m - m'} + \sum_{j \in \text{블록}} e^{s_j - m'}, \quad a' = a\,e^{m - m'} + \sum_{j \in \text{블록}} e^{s_j - m'}\,v_j$$

마지막에 $a/\ell$이 정확한 attention 출력이다. 근사가 전혀 없다. 점수 행렬 전체를 메모리에 만들 필요 없이 블록 하나 크기의 작업 공간만 있으면 된다.

:::example 숫자로 한 번 갱신해 보기
점수가 $[1, 2]$인 첫 블록을 보고 나면 $m = 2$, $\ell = e^{1-2} + e^{2-2} \approx 0.368 + 1 = 1.368$이다. 이제 점수가 $[4]$인 블록이 들어온다. 최댓값이 $m' = 4$로 바뀌었으니 이전 $\ell$에 $e^{m - m'} = e^{-2} \approx 0.135$를 곱해 새 기준으로 맞추고 새 항을 더한다.

$$\ell' = 1.368 \times e^{-2} + e^{4-4} \approx 0.185 + 1 = 1.185$$

처음부터 세 점수를 다 보고 계산한 $e^{1-4} + e^{2-4} + e^{4-4} \approx 0.050 + 0.135 + 1 = 1.185$와 같다. 기준(최댓값)을 나중에 바꿔도 $e^{m - m'}$ 한 번 곱하면 과거 합계를 그대로 재활용할 수 있다는 것이 핵심이다.
:::

[[diagram:online-softmax-steps]]

이제 코드로, 점수 12개를 4개씩 세 블록으로 나눠 보면서 온라인 결과가 정확한 값과 같은지 확인해 보자.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
n, d = 12, 4
s = rng.normal(size=n) * 5                 # Query 하나의 점수 12개
V = rng.normal(size=(n, d))

# 기준: 점수를 전부 본 뒤 한 번에 계산
w = np.exp(s - s.max()); w /= w.sum()
exact = w @ V

# 온라인: 4개씩 블록으로 보며 (m, ℓ, a)만 들고 다닌다
m, l, a = -np.inf, 0.0, np.zeros(d)
for start in range(0, n, 4):
    sb, Vb = s[start:start + 4], V[start:start + 4]
    m_new = max(m, sb.max())
    scale = np.exp(m - m_new)              # 기준이 바뀐 만큼 이전 누적값을 보정
    p = np.exp(sb - m_new)
    l = l * scale + p.sum()
    a = a * scale + p @ Vb
    m = m_new
    print(f"블록 {start // 4 + 1}: 지금까지 최댓값 m = {m:.3f}")

print("온라인 결과 == 정확한 값?", np.allclose(a / l, exact))
\`\`\`

세 번째 블록에서는 최댓값이 바뀌지 않아 보정 계수가 $e^0 = 1$이다. 점수 12개 전체를 한 번도 동시에 들고 있지 않았는데도 결과가 정확히 같다(\`True\`).

### 왜 이것이 빨라지는가: 메모리 계층

GPU에는 크고 느린 메모리(HBM, 수십 GB)와 작고 빠른 메모리(SRAM, 연산 장치 옆의 수십~수백 KB)가 있다. 표준 attention은 $QK^\top$을 계산해 HBM에 쓰고, 다시 읽어 softmax를 하고, 다시 쓰고, 다시 읽어 $V$와 곱한다. $n \times n$ 행렬이 HBM을 여러 번 왕복한다. 현대 GPU는 연산 속도에 비해 메모리 대역폭이 훨씬 부족해서, attention은 계산이 아니라 이 왕복에 시간이 묶이는 **메모리 병목(memory-bound)** 연산이다. FlashAttention은 $Q, K, V$를 SRAM에 들어가는 타일로 잘라, 온라인 softmax로 점수를 SRAM 안에서만 만들고 버린다. FLOPs는 같거나(역전파에서 점수를 다시 계산하므로) 오히려 늘지만, HBM 왕복이 크게 줄어 몇 배 빨라지고 메모리는 $O(n^2)$에서 $O(n)$이 된다. 3주차 심화 「자동미분의 두 모드」의 체크포인팅처럼 "다시 계산하는 편이 저장했다 읽는 것보다 싸다"는 같은 철학이다.

\`\`\`image
src: /images/week5/flashattention-overview.png
alt: FlashAttention 논문의 개요 그림. 왼쪽은 GPU 메모리 계층 피라미드(SRAM 19TB/s·20MB, HBM 1.5TB/s·40GB, CPU DRAM 12.8GB/s·1TB 이상), 가운데는 K·V 블록을 바깥 반복, Q 블록을 안쪽 반복으로 SRAM에 복사해 계산하고 결과만 HBM에 쓰는 타일링 구조, 오른쪽은 GPT-2 attention 계산 시간 막대(PyTorch 약 17ms, FlashAttention 약 2ms).
caption: 왼쪽: GPU의 메모리 계층. 연산 장치 옆의 SRAM은 HBM보다 10배 이상 빠르지만 크기는 수천 분의 1이다. 가운데: FlashAttention은 K, V를 블록 단위로 SRAM에 올리고(바깥 반복, 빨강) 그 안에서 Q 블록을 차례로 처리하며(안쪽 반복, 파랑) 점수를 SRAM 안에서만 계산한다. 점선 상자인 N × N 행렬은 HBM에 한 번도 만들어지지 않는다. 오른쪽: GPT-2의 attention 계산에서 행렬 곱·마스크·softmax·드롭아웃을 커널 하나로 합쳐 PyTorch 구현보다 약 7.6배 빨라졌다.
credit: Dao, Fu, Ermon, Rudra & Ré (2022), FlashAttention, Figure 1 (arXiv:2205.14135)
width: 1584
height: 620
\`\`\`

$O(n^2)$ 연산 자체는 그대로라는 점도 기억하자. 문맥을 수백만 토큰으로 늘리려면 연산량 자체를 줄이는 다른 아이디어(희소 attention, 다음 단계의 선형 어텐션)가 필요하다.
`,
  checks: [
    {
      key: "c1",
      question: "softmax를 계산할 때 점수에서 최댓값을 빼는 이유는?",
      choices: ["값은 같으면서 $\\exp$가 넘치지 않게(지수가 0 이하가 되게) 하려고", "확률의 합을 1로 만들려고", "기울기를 크게 하려고", "온도를 낮추려고"],
      answer: 0,
      explanation: "$e^{s_i - m}/\\sum_j e^{s_j - m}$은 분자·분모에 같은 $e^{-m}$을 곱한 것이라 값이 같고, 지수가 모두 0 이하라 오버플로가 없다.",
    },
    {
      key: "c2",
      question: "온라인 softmax에서 새 블록의 최댓값 $m'$이 이전 최댓값 $m$보다 클 때 이전 누적값 $\\ell$, $a$에 곱하는 값은?",
      choices: ["$e^{m - m'}$", "$e^{m' - m}$", "$m/m'$", "1"],
      answer: 0,
      explanation: "이전 값들은 $e^{s_j - m}$ 기준이었으므로 새 기준 $e^{s_j - m'}$으로 바꾸려면 $e^{m - m'}$을 곱한다. 이 보정 덕분에 결과가 정확하다.",
    },
    {
      key: "c3",
      question: "FlashAttention이 표준 attention보다 빠른 주된 이유는?",
      choices: ["점수 행렬을 HBM에 쓰고 읽는 왕복을 없애 메모리 병목을 줄이기 때문", "FLOPs를 $O(n)$으로 줄이기 때문", "근사 계산을 하기 때문", "softmax를 생략하기 때문"],
      answer: 0,
      explanation: "attention은 메모리 대역폭에 묶이는 연산이다. 타일을 SRAM에서만 처리해 $n\\times n$ 행렬을 HBM에 만들지 않는다. FLOPs와 결과는 그대로다.",
    },
    {
      key: "c4",
      question: "문맥 길이가 4배가 되면 표준 attention이 만드는 점수 행렬($n \\times n$)의 메모리는 몇 배가 되는가?",
      choices: ["16배", "4배", "2배", "변하지 않는다"],
      answer: 0,
      explanation: "$n \\times n$ 행렬이라 $n$이 4배면 $4^2 = 16$배다. FlashAttention은 이 행렬을 메모리에 만들지 않아 메모리를 $O(n)$으로 줄인다.",
    },
    {
      key: "c5",
      question: "온라인 softmax로 계산한 attention 출력과 점수를 전부 보고 계산한 출력의 관계는?",
      choices: ["(부동소수점 오차를 빼면) 정확히 같다", "근삿값이라 조금 다르다", "블록 크기가 클수록만 같아진다", "최댓값 토큰만 같다"],
      answer: 0,
      explanation: "최댓값이 바뀔 때마다 $e^{m - m'}$로 과거 누적값을 정확히 보정하므로 근사가 전혀 없다. FlashAttention이 \"정확한(exact) attention\"이라 불리는 이유다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import math
blocks = [[1.0, 2.0], [5.0, 0.0]]
m, l = -math.inf, 0.0
for b in blocks:
    m_new = max(m, max(b))
    l = l * math.exp(m - m_new) + sum(math.exp(s - m_new) for s in b)
    m = m_new
exact = sum(math.exp(s - 5.0) for s in [1.0, 2.0, 5.0, 0.0])
print(m, round(l, 6), round(exact, 6))
`,
      expected: "5.0 1.074841 1.074841",
      explanation: "첫 블록 뒤 $m = 2$, $\\ell = e^{-1} + 1$입니다. 둘째 블록에서 $m' = 5$가 되어 이전 $\\ell$에 $e^{2-5}$를 곱해 새 기준으로 맞추고 $e^0 + e^{-5}$를 더합니다. 결과가 네 점수를 한꺼번에 본 $\\sum e^{s - 5}$와 정확히 같습니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "softmax를 계산할 때 최댓값을 빼는 이유는? 온라인 softmax가 점수를 블록 단위로 보면서도 정확한 결과를 내는 갱신식을 쓰고, FlashAttention이 FLOPs를 줄이지 않고도 빨라지는 이유를 GPU 메모리 계층으로 설명하라.",
      answer: md`
$e^{s_i}$는 점수가 크면 넘쳐 nan이 되므로, 분자·분모에 같은 $e^{-m}$($m$은 최댓값)을 곱해 값은 그대로 두고 지수를 0 이하로 만든다. 온라인 softmax는 지금까지의 최댓값 $m$, 지수 합 $\ell$, 가중합 $a$를 들고 있다가 새 블록에서 $m'=\max(m,\max s)$로 갱신하고 $\ell'=\ell e^{m-m'}+\sum e^{s_j-m'}$, $a'=ae^{m-m'}+\sum e^{s_j-m'}v_j$로 이전 누적값을 새 기준에 맞춘다. 마지막 $a/\ell$은 근사 없이 정확한 출력이다. GPU는 작고 빠른 SRAM과 크고 느린 HBM을 가지며 연산 속도에 비해 메모리 대역폭이 부족해 attention은 메모리 병목 연산이다. FlashAttention은 타일을 SRAM에서만 처리해 $n\times n$ 점수 행렬을 HBM에 쓰고 읽는 왕복을 없애므로, FLOPs가 같거나 늘어도 훨씬 빠르고 메모리가 $O(n)$이 된다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Dao et al. (2022) — FlashAttention", url: "https://arxiv.org/abs/2205.14135", note: "IO를 고려한 정확한 attention (영문)" },
    { title: "Milakov & Gimelshein (2018) — Online normalizer calculation for softmax", url: "https://arxiv.org/abs/1805.02867", note: "온라인 softmax (영문)" },
  ],
});
