import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/transformer-params";

export default defineLesson({
  id: "transformer-params",
  title: "트랜스포머의 크기 계산",
  tier: "supplement",
  goal: "디코더 블록의 파라미터가 약 $12d^2$인 이유를 구성 요소별로 계산하고, 토큰당 연산량 $2N$·학습 연산량 $6ND$, 추론 가중치·학습 상태·KV 캐시의 메모리를 계산한다.",
  why: "모델 카드의 파라미터 수와 학습 토큰 수만으로 학습 비용, 추론에 필요한 GPU 메모리, 긴 문맥에서의 KV 캐시 크기를 어림할 수 있어야 모델과 하드웨어를 고를 수 있다. 스케일링 법칙의 $C \\approx 6ND$와 서빙 비용의 메모리 계산도 이 레슨의 계산에서 나온다.",
  body: md`
"GPT-2 small은 1억 2천4백만 파라미터", "70B 모델을 서빙하려면 GPU 몇 장" 같은 수치가 어디서 나오는지 직접 계산할 수 있어야 한다. 이 레슨은 [[lesson:transformer-block]]의 디코더 블록을 **수치로** 분석한다. 파라미터가 어느 구성 요소에 많은지, 토큰 하나를 처리하는 데 연산이 얼마나 드는지, 학습과 추론에 메모리가 얼마나 필요한지를 계산한다. [[lesson:scaling-laws]]의 컴퓨트 계산과 [[lesson:serving-cost]]의 메모리 계산이 모두 이 계산에 기초한다.

### 블록 하나의 파라미터: 약 $12d^2$

은닉 차원이 $d$인 디코더 블록의 파라미터를 구성 요소별로 세면 다음과 같다.

- **Self-Attention:** $Q, K, V$ 투영 $3 \times (d \times d)$와 출력 투영 $W^O$ $(d \times d)$ → $4d^2$ (편향 제외). 헤드를 몇 개로 나누든 총합은 같다. 헤드는 $d$를 쪼개 쓸 뿐이다.
- **MLP:** $d \to 4d \to d$ → $4d^2 + 4d^2 = 8d^2$.
- **LayerNorm:** $\gamma, \beta$ 각 $d$개씩, 블록당 두 개 → $4d$ (무시해도 될 만큼 작다).

합하면 블록 하나에 약 $12d^2$이고, 그중 **3분의 2가 MLP**에 있다. 층이 $L$개면 본체는 약 $12Ld^2$. 여기에 어휘 크기 $|V|$에 대한 토큰 임베딩 $|V| \times d$가 더해진다. 출력층(다음 토큰 확률)은 보통 임베딩 행렬을 그대로 재사용한다(weight tying). GPT-2 small($d = 768$, $L = 12$, $|V| = 50{,}257$)에 대입하면 본체 약 8,500만, 임베딩 약 3,900만으로 합계 약 1억 2,400만이다. 작은 모델에서는 임베딩이 3분의 1이나 되지만, $d$와 $L$이 커지면 $12Ld^2$가 압도적이 된다.

[[diagram:param-breakdown]]

아래 코드는 편향과 LayerNorm까지 포함해 파라미터를 센다. GPT-2 small은 학습형 위치 임베딩(최대 1,024위치)도 있으므로 그것까지 더한다.

\`\`\`python
def count_params(d, L, V, ctx):
    attn = 4 * d * d + 4 * d                 # Wq, Wk, Wv, Wo와 편향
    mlp = (d * 4 * d + 4 * d) + (4 * d * d + d)   # d→4d, 4d→d와 편향
    ln = 2 * 2 * d                           # LayerNorm 2개의 γ, β
    block = attn + mlp + ln
    emb = V * d + ctx * d                    # 토큰 임베딩 + 학습형 위치 임베딩
    return block, L * block, emb, L * block + emb + 2 * d   # 마지막 LayerNorm 포함

block, body, emb, total = count_params(d=768, L=12, V=50257, ctx=1024)
print(f"블록 하나 {block:,} (12d² = {12 * 768 ** 2:,})")
print(f"본체 {body:,} + 임베딩 {emb:,} = 합계 {total:,}")

N = 7e9
print(f"7B 추론 가중치(fp16): {N * 2 / 1e9:.0f} GB")
print(f"7B 학습 상태(16바이트/파라미터): {N * 16 / 1e9:.0f} GB")
print(f"7B를 1조 토큰 학습: {6 * N * 1e12:.1e} FLOPs")
\`\`\`

블록 하나가 $12d^2$보다 약 1만 개 많은 것은 편향과 LayerNorm 몫이다. 합계 124,439,808개는 실제로 공개된 GPT-2 small의 파라미터 수와 정확히 일치한다. 아래 세 줄은 다음 두 절에서 설명할 연산량과 메모리 계산을 미리 해 본 것이다.

### 연산량: 토큰당 약 $2N$, 학습은 약 $6N$

행렬 곱 $y = Wx$($W$가 $m \times n$)는 곱셈-덧셈 $mn$번, 즉 $2mn$ FLOPs다. 모델의 모든 가중치가 토큰 하나당 한 번씩 곱해지므로 순전파는 토큰당 약 $2N$ FLOPs($N$ = 임베딩을 제외한 파라미터 수)다. 역전파는 입력 기울기와 가중치 기울기를 각각 구하므로 순전파의 약 2배가 들어, 학습은 토큰당 약 $6N$ FLOPs다. 데이터 $D$토큰으로 학습하는 총 연산량 $C \approx 6ND$가 스케일링 법칙([[lesson:scaling-laws]])의 출발점이다. 여기에 attention 점수 계산이 더해지는데($n$개 토큰에 대해 $O(n^2 d)$), 문맥이 $d$보다 훨씬 길어지기 전에는 가중치 곱셈이 연산량의 대부분을 차지한다.

### 메모리: 가중치·학습 상태·KV 캐시

- **추론 가중치:** fp16이나 bf16이면 파라미터당 2바이트다. 7B 모델은 약 14GB이고, 4비트로 양자화하면 약 3.5GB다([[lesson:serving-cost]]).
- **학습 상태:** 혼합 정밀도와 Adam을 쓰면 파라미터당 약 16바이트(fp16 가중치 2 + fp16 기울기 2 + fp32 원본 가중치 4 + Adam의 $m, v$ 8)다. 7B 모델이면 활성화를 빼고도 약 112GB이므로 GPU 여러 장에 나눠야 한다.
- **KV 캐시:** 토큰마다, 층마다 $K, V$ 두 벡터($d$차원)를 저장하므로 $2 \times L \times d \times n \times$ 바이트 수다. [[lesson:kv-cache-rope]]의 예처럼 긴 문맥에서는 가중치만큼 커질 수 있다. 그래서 GQA(여러 Query 헤드가 K·V 헤드를 공유) 같은 구조를 쓴다.

:::example 7B 모델 하나로 정리
파라미터 $N = 7 \times 10^9$인 모델이라면 다음과 같다.

| 항목 | 계산 | 결과 |
| --- | --- | --- |
| 토큰 하나 생성(순전파) | $2N$ | 약 $1.4 \times 10^{13}$ FLOPs |
| 1조 토큰 학습 | $6ND$ | 약 $4.2 \times 10^{22}$ FLOPs |
| 추론 가중치 (fp16) | $2N$ 바이트 | 약 14GB |
| 학습 상태 (혼합 정밀도 + Adam) | $16N$ 바이트 | 약 112GB |

추론은 GPU 한 장(24GB 이상)으로 할 수 있지만, 같은 모델을 학습하려면 활성화 메모리를 빼고도 80GB GPU 두 장 이상이 필요하다. 추론할 수 있는 GPU에서 미세조정은 할 수 없는 경우가 많은 이유이며, LoRA([[lesson:instruction-tuning]])와 양자화가 이 차이를 줄인다.
:::

[[diagram:training-memory]]
`,
  checks: [
    {
      key: "c1",
      question: "은닉 차원 $d$인 디코더 블록 하나에서 MLP($d \\to 4d \\to d$)의 가중치 수는? (편향 제외)",
      choices: ["$8d^2$", "$4d^2$", "$12d^2$", "$16d^2$"],
      answer: 0,
      explanation: "$d \\times 4d$와 $4d \\times d$ 두 행렬이라 $8d^2$다. attention은 $Q, K, V, W^O$ 네 개로 $4d^2$이므로 블록 파라미터의 3분의 2가 MLP에 있다.",
    },
    {
      key: "c2",
      question: "파라미터 70억 개 모델을 1조 토큰으로 학습하는 데 드는 연산량은 대략?",
      choices: ["$4.2\\times10^{22}$ FLOPs", "$7\\times10^{21}$ FLOPs", "$1.4\\times10^{22}$ FLOPs", "$7\\times10^{12}$ FLOPs"],
      answer: 0,
      explanation: "학습은 토큰당 약 $6N$ FLOPs이므로 $6 \\times 7\\times10^9 \\times 10^{12} = 4.2\\times10^{22}$이다.",
    },
    {
      key: "c3",
      question: "7B 모델을 fp16으로 추론할 때 가중치만의 메모리는 대략?",
      choices: ["14GB", "7GB", "28GB", "112GB"],
      answer: 0,
      explanation: "파라미터당 2바이트이므로 약 14GB다. 학습(혼합 정밀도 Adam)이면 파라미터당 약 16바이트로 약 112GB가 된다.",
    },
    {
      key: "c4",
      question: "$d = 4096$, 층 $L = 32$인 디코더 본체의 파라미터는 $12Ld^2$로 대략?",
      choices: ["약 64억", "약 6억", "약 640억", "약 1.6억"],
      answer: 0,
      explanation: "$12 \\times 32 \\times 4096^2 \\approx 6.4 \\times 10^9$이다. 여기에 임베딩이 더해져 흔히 말하는 7B 모델 규모가 된다.",
    },
    {
      key: "c5",
      question: "파라미터 70억 개 모델이 토큰 하나를 생성(순전파)하는 데 드는 연산량은 대략?",
      choices: ["$1.4 \\times 10^{13}$ FLOPs", "$7 \\times 10^{9}$ FLOPs", "$4.2 \\times 10^{10}$ FLOPs", "$1.4 \\times 10^{22}$ FLOPs"],
      answer: 0,
      explanation: "순전파는 토큰당 약 $2N$ FLOPs이므로 $2 \\times 7 \\times 10^9 = 1.4 \\times 10^{13}$이다. 학습은 역전파까지 더해 토큰당 약 $6N$이다.",
    },
    {
      key: "c6",
      question: "은닉 차원을 두 배($d \\to 2d$)로 키우고 층 수는 그대로 두면 블록들의 파라미터 수와 토큰당 순전파 FLOPs는 대략?",
      choices: ["둘 다 4배", "둘 다 2배", "파라미터 4배, FLOPs 2배", "파라미터 2배, FLOPs 4배"],
      answer: 0,
      explanation: "블록 파라미터는 약 $12Ld^2$라 $d$를 두 배로 하면 4배이고, 토큰당 순전파 FLOPs는 약 $2N$이라 함께 4배입니다. 폭을 넓히는 것이 층을 늘리는 것보다 파라미터를 훨씬 빠르게 늘립니다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
L, d, n_ctx = 32, 4096, 8192
kv = 2 * L * d * n_ctx * 2          # K·V × 층 × 차원 × 문맥 × fp16 바이트
print(kv // 2**30, "GiB")
print(round(7e9 * 2 / 2**30, 1), "GiB")
`,
      expected: "4 GiB\n13.0 GiB",
      explanation: "KV 캐시는 $2\\times32\\times4096\\times8192\\times2 = 4\\,\\text{GiB}$로, 문맥 8천 토큰 하나에 7B 모델 가중치(fp16 약 13GiB)의 3분의 1에 가까운 메모리가 든다. 배치 크기를 8로 늘리면 32GiB가 되어 가중치보다 커진다. 그래서 GQA, KV 캐시 양자화 같은 기법을 쓴다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "은닉 차원 $d$인 디코더 블록 하나의 파라미터가 약 $12d^2$인 이유를 구성 요소별로 설명하라. 파라미터 $N$인 모델이 토큰당 약 $2N$ FLOPs(학습은 약 $6N$)를 쓰는 이유와, 혼합 정밀도 Adam 학습에 파라미터당 약 16바이트가 드는 이유도 쓰라.",
      answer: md`
Self-Attention은 $Q,K,V$ 투영 $3d^2$와 출력 투영 $W^O$ $d^2$로 $4d^2$, MLP는 $d\to4d\to d$ 두 행렬로 $8d^2$, LayerNorm은 $4d$로 무시할 만큼 작아 합계 약 $12d^2$이다(헤드 수와 무관). 행렬 곱 $Wx$는 가중치 하나당 곱셈-덧셈 한 번, 즉 2 FLOPs이고 토큰 하나가 모든 가중치와 한 번씩 곱해지므로 순전파는 토큰당 약 $2N$이다. 역전파는 입력 기울기와 가중치 기울기를 각각 계산해 순전파의 약 2배라 학습은 토큰당 약 $6N$이다. 혼합 정밀도 Adam 학습은 fp16 가중치 2바이트, fp16 기울기 2바이트, fp32 원본 가중치 4바이트, Adam의 1차와 2차 모멘트 각 4바이트를 저장하므로 파라미터당 약 16바이트가 든다(활성화 제외).
`,
      keyPoints: [
        "attention의 투영 4개가 $4d^2$, MLP의 두 행렬이 $8d^2$로 합계 약 $12d^2$다",
        "가중치 하나당 곱셈-덧셈 한 번(2 FLOPs)이므로 순전파는 토큰당 약 $2N$이다",
        "역전파는 순전파의 약 2배이므로 학습은 토큰당 약 $6N$이다",
        "가중치 2, 기울기 2, fp32 원본 4, Adam 모멘트 8바이트로 파라미터당 약 16바이트다",
      ],
    },
  ],
  references: [
    { title: "Kaplan et al. (2020) — Scaling Laws for Neural Language Models, 2.1절", url: "https://arxiv.org/abs/2001.08361", note: "파라미터 수와 FLOPs 계산의 표준 근사(영문)" },
    { title: "EleutherAI — Transformer Math 101", url: "https://blog.eleuther.ai/transformer-math/", note: "학습 메모리와 연산량 계산 정리(영문)" },
  ],
});
