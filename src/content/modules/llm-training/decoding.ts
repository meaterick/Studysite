import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/decoding";

export default defineLesson({
  id: "decoding",
  title: "샘플링과 디코딩 전략",
  tier: "core",
  concepts: ["pretraining-decoding"],
  goal: "$\\text{softmax}(z/T)$로 temperature의 효과를 계산하고, greedy 디코딩·빔 서치·top-k·top-p·반복 페널티·스톱 토큰의 차이를 설명하며 직접 구현한다.",
  why: "같은 모델이라도 디코딩 설정에 따라 출력의 정확성과 다양성이 크게 달라진다. LLM API의 temperature, top_p, max_tokens, stop 같은 매개변수가 이 레슨의 디코딩 방법이며, RAG 시스템([[lesson:rag]])처럼 출력을 일정하게 유지해야 하는 응용에서는 이 설정을 알맞게 골라야 한다.",
  body: md`
### temperature

모델이 계산한 다음 토큰의 확률분포 $P(x_t \mid x_{<t})$에서 실제로 출력할 토큰을 고르는 절차를 **디코딩**(decoding)이라 한다. **temperature** $T$는 logit $z$를 $T$로 나눈 뒤 softmax를 적용해 분포의 형태를 바꾼다.

\`\`\`math
P(i) = \dfrac{e^{z_i/T}}{\sum_j e^{z_j/T}}
\`\`\`

$T$가 작으면 logit 사이의 차이가 커져 확률이 가장 높은 후보에 집중되고, $T$가 크면 차이가 줄어 분포가 평평해진다. $T \to 0$이면 확률이 가장 큰 후보 하나만 고르는 greedy 디코딩과 같고, $T \to \infty$이면 균등분포가 된다.

[[diagram:decoding-temperature]]

"나는 __를 먹었다"의 후보 5개(사과, 바나나, 포도, 수박, 딸기)의 logit이 $[3, 2, 1, 0, -1]$이면 다음과 같다. logit은 $T$와 관계없이 같고 확률만 바뀐다.

| $T$ | $z/T$ | 사과 | 바나나 | 포도 | 수박 | 딸기 |
| --- | --- | --- | --- | --- | --- | --- |
| 0.5 | $[6, 4, 2, 0, -2]$ | 86.5% | 11.7% | 1.6% | 0.2% | 0.03% |
| 1.0 | $[3, 2, 1, 0, -1]$ | 63.6% | 23.4% | 8.6% | 3.2% | 1.2% |
| 2.0 | $[1.5, 1, 0.5, 0, -0.5]$ | 42.9% | 26.0% | 15.8% | 9.6% | 5.8% |

$T = 2$이면 순위는 같지만 5위인 딸기도 약 20번에 한 번 선택된다.

### 디코딩 방법

| 방법 | 설명 | 특징 |
| --- | --- | --- |
| Greedy | 스텝마다 확률이 가장 큰 토큰을 고른다 | 결정적이며 같은 구절이 반복되기 쉽다 |
| Temperature | $\text{softmax}(z/T)$에서 샘플링한다 | $T$가 작으면 보수적, 크면 다양하다 |
| Top-k / Top-p | 상위 $k$개 / 누적확률 $p$ 안에서만 샘플링한다 | 확률이 매우 낮은 후보를 제외한다 |
| Beam search | 누적 확률 상위 $B$개 시퀀스를 유지한다 | 번역·요약처럼 정답이 정해진 과제에 쓴다 |

실무에서는 top-p와 temperature를 함께 쓰는 경우가 많다. 확률이 매우 낮은 후보는 top-p로 제외하고, 남은 후보 사이의 다양성은 temperature로 조절한다.

### greedy 디코딩과 빔 서치

**greedy 디코딩**은 스텝마다 확률이 가장 큰 토큰 하나($\arg\max_i P(i)$)를 고른다. 구현이 간단하고 빠르지만 같은 입력에는 항상 같은 출력이 나온다. 또 선택한 토큰이 다음 스텝의 분포를 바꾸는 자기회귀 구조라서, 스텝마다 확률이 가장 큰 토큰을 골라도 시퀀스 전체의 확률이 가장 크지는 않을 수 있고, 같은 구절이 반복되는 출력이 되기 쉽다.

**빔 서치**(beam search)는 스텝마다 누적 확률(또는 누적 로그확률)이 큰 시퀀스 $B$개(빔 너비)를 유지한다. 유지한 $B$개 시퀀스마다 다음 토큰 후보를 붙여 후보 시퀀스를 만들고, 누적 확률이 큰 $B$개만 남기는 과정을 반복한다. 계산량은 greedy의 약 $B$배지만, 첫 스텝에서 확률이 조금 낮았던 경로도 유지하므로 시퀀스 전체의 확률이 더 큰 출력을 찾을 수 있다. 정답에 가까운 출력 하나를 찾는 번역·요약에 유리하지만, 확률이 높은 시퀀스를 우선하므로 대화 생성에서는 단조로운 출력이 되기 쉬워 잘 쓰지 않는다.

아래 예에서 첫 토큰은 "그"(0.5)의 확률이 가장 크지만 "그" 다음 토큰의 확률은 고르게 나뉘어 있고, "한"(0.4) 다음에는 "편"의 확률이 0.9다.

\`\`\`python
step1 = {"그": 0.5, "한": 0.4, "이": 0.1}                 # 첫 토큰의 확률
step2 = {"그": {"는": 0.3, "가": 0.3, "의": 0.4},         # 첫 토큰에 따른 둘째 토큰의 확률
         "한": {"편": 0.9, "번": 0.1},
         "이": {"제": 1.0}}

first = max(step1, key=step1.get)                         # greedy: 스텝마다 가장 큰 것
second = max(step2[first], key=step2[first].get)
print("greedy:", first + second, "확률", round(step1[first] * step2[first][second], 2))

beams = sorted(step1.items(), key=lambda kv: -kv[1])[:2]  # 빔 서치(빔 너비 2)
cands = [(a + b, pa * pb) for a, pa in beams for b, pb in step2[a].items()]
for seq, p in sorted(cands, key=lambda c: -c[1]):
    print(f"  후보 {seq}: {p:.2f}")
best = max(cands, key=lambda c: c[1])
print("빔 서치:", best[0], "확률", round(best[1], 2))
\`\`\`

greedy는 첫 스텝에서 "그"를 고르므로 "한편"(0.36)을 고려하지 않고 확률 0.20인 "그의"를 출력한다. 빔 너비 2인 빔 서치는 "한"도 유지했다가 두 번째 스텝에서 "한편"의 확률이 더 크다는 것을 확인한다.

[[diagram:beam-search-tree]]

### top-k와 top-p 샘플링

**top-k 샘플링**은 스텝마다 확률 상위 $k$개 토큰만 남기고 그 안에서 확률에 비례해 샘플링한다. 확률이 매우 낮은 후보가 선택되는 것을 막지만, $k$가 고정되어 있다. 1위 후보의 확률이 대부분이어서 실제 후보가 2~3개뿐인 문맥에서도 $k = 50$이면 47개의 불필요한 후보가 포함되고, 여러 후보의 확률이 비슷한 문맥에서는 $k = 50$으로도 부족할 수 있다.

**top-p 샘플링**(nucleus sampling)은 후보의 개수 대신 확률의 합으로 후보를 정한다. 확률이 큰 순서로 토큰을 정렬해, 누적확률이 처음으로 $p$ 이상이 되는 지점까지의 토큰만 남긴다. 분포가 한 토큰에 집중되면 후보가 1~2개로 줄고, 분포가 평평하면 후보가 수십 개로 늘어난다. 분포의 형태에 따라 후보 수가 바뀌므로 실제 서비스에서는 top-p를 top-k보다 많이 쓴다.

[[diagram:topk-topp]]

"오늘 점심에 __를 먹었다"의 후보 6개(김밥, 라면, 국밥, 파스타, 초밥, 죽)의 logit이 $[4, 3, 2.5, 1, 0.5, -1]$일 때 두 방법을 비교한다. \`np.argsort(-p)\`는 확률이 큰 순서의 인덱스, \`np.cumsum\`은 그 순서로 확률을 누적한 배열, \`np.searchsorted(cum, top_p)\`는 누적값이 처음으로 \`top_p\` 이상이 되는 위치다.

\`\`\`python
import numpy as np

def softmax(logits, T=1.0):
    z = (logits - logits.max()) / T         # 최댓값을 빼 overflow를 막는다
    p = np.exp(z)
    return p / p.sum()

def top_k_filter(p, k):
    threshold = np.sort(p)[-k]              # k번째로 큰 확률
    q = np.where(p >= threshold, p, 0.0)    # 그보다 작은 후보는 0으로
    return q / q.sum()

def top_p_filter(p, top_p):
    idx = np.argsort(-p)                    # 확률이 큰 순서의 인덱스
    cum = np.cumsum(p[idx])                 # 그 순서로 누적한 확률
    keep = idx[: np.searchsorted(cum, top_p) + 1]
    q = np.zeros_like(p)
    q[keep] = p[keep]
    return q / q.sum()

words = ["김밥", "라면", "국밥", "파스타", "초밥", "죽"]
logits = np.array([4.0, 3.0, 2.5, 1.0, 0.5, -1.0])
base = softmax(logits)
print("원래 확률:", base.round(3))           # [0.596 0.219 0.133 0.03  0.018 0.004]
for k in (2, 3):
    print(f"top_k={k}:", top_k_filter(base, k).round(3))
for tp in (0.5, 0.9):
    print(f"top_p={tp}:", top_p_filter(base, tp).round(3))
\`\`\`

\`top_k=2\`와 \`top_k=3\`은 분포와 관계없이 후보를 각각 2개, 3개 남긴다. top-p는 임계값에 따라 남는 후보의 수가 달라진다. \`top_p=0.5\`는 1위 김밥의 확률(약 0.596)만으로 0.5를 넘어 후보가 1개이고, \`top_p=0.9\`는 상위 3개의 누적확률(약 0.948)이 처음으로 0.9를 넘으므로 \`top_k=3\`과 같은 결과다.

### 반복 페널티와 스톱 토큰

반복은 greedy뿐 아니라 샘플링에서도 나타난다. **반복 페널티**(repetition penalty)는 이미 생성된 토큰의 logit을 softmax 전에 낮춰, 같은 토큰이 다시 선택될 확률을 줄인다. 널리 쓰이는 방식(Keskar et al., 2019)은 이미 나온 토큰의 logit이 양수이면 페널티 $\alpha$로 나누고 음수이면 $\alpha$를 곱한다. 이미 나온 "고양이"의 logit이 2.0이고 $\alpha = 1.3$이면 $2.0/1.3 \approx 1.54$로 낮아진다. 페널티가 너무 크면 조사나 접속사처럼 자연스럽게 반복되어야 하는 토큰까지 줄어 문장이 어색해진다.

생성을 언제 끝낼지도 디코딩에서 정한다. 어휘에 생성의 끝을 나타내는 **스톱 토큰**(stop token, 흔히 \`<eos>\`)을 두고, 모델이 이 토큰을 선택하면 생성을 끝낸다. 스톱 토큰도 다른 토큰처럼 학습 데이터에서 응답이 끝나는 위치를 통해 학습된다. 생성의 속도와 비용(지연시간, 처리량)은 [[lesson:serving-cost]]에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "logit [3, 2, 1, 0, −1]에서 $T \\to 0$이면 샘플링 분포는?",
      choices: ["균등분포", "1등 후보에 확률 1(argmax)", "logit에 비례", "2등 후보에 확률 1"],
      answer: 1,
      explanation: "logit 사이의 차이가 한없이 커져 greedy 디코딩과 같아진다. $T \\to \\infty$이면 균등분포가 된다.",
    },
    {
      key: "c2",
      question: "확률이 [0.90, 0.05, 0.03, 0.02]인 분포에 top-p($p = 0.9$)를 적용하면 남는 후보 수는?",
      choices: ["1개", "2개", "3개", "4개"],
      answer: 0,
      explanation: "1위의 누적확률이 이미 0.9이므로 1개만 남는다(본문 구현은 누적값이 처음으로 $p$ 이상이 되는 지점까지 포함한다). 분포가 평평하면 후보가 많아진다.",
    },
    {
      key: "c3",
      question: "빔 서치가 그리디보다 번역·요약에 유리한 이유는?",
      choices: ["스텝마다 무작위로 고르기 때문에", "여러 후보 시퀀스를 동시에 유지해, 첫 스텝의 확률은 낮아도 전체 확률이 높은 문장을 찾을 수 있기 때문에", "계산량이 더 적기 때문에", "다양한 출력을 만들기 때문에"],
      answer: 1,
      explanation: "본문 예에서 greedy는 첫 스텝의 선택 때문에 \"그의\"(0.20)를 출력하지만, 빔 서치는 \"한\" 경로도 유지해 \"한편\"(0.36)을 찾는다.",
    },
    {
      key: "c4",
      question: "첫 토큰 후보가 {그: 0.5, 한: 0.4}이고, \"그\" 다음 최선의 토큰 확률은 0.4, \"한\" 다음 최선은 0.9다. 빔 너비 2인 빔 서치가 고르는 두 토큰 시퀀스의 확률은?",
      choices: ["0.36", "0.20", "0.50", "0.90"],
      answer: 0,
      explanation: "\"그\" 경로의 최선은 $0.5 \\times 0.4 = 0.20$, \"한\" 경로의 최선은 $0.4 \\times 0.9 = 0.36$이다. greedy는 첫 스텝에서 \"그\"를 골라 0.20인 시퀀스를 출력하지만 빔 서치는 0.36인 시퀀스를 찾는다.",
    },
    {
      key: "c5",
      question: "반복 페널티 $\\alpha = 1.3$을 쓸 때, 이미 나온 토큰의 logit이 $-1.0$이면 조정된 logit은?",
      choices: ["$-1.3$", "$-0.77$", "$1.3$", "$-1.0$"],
      answer: 0,
      explanation: "음수 logit에는 $\\alpha$를 곱해 $-1.0 \\times 1.3 = -1.3$으로 더 작게 만든다. 양수 logit을 $\\alpha$로 나누는 것과 같이 이미 나온 토큰의 확률을 낮춘다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
logits = np.array([3.0, 2.0, 1.0, 0.0, -1.0])
for T in (0.5, 1.0, 2.0):
    p = np.exp(logits / T)
    p /= p.sum()
    print(T, round(float(p[0]), 3))
`,
      expected: "0.5 0.865\n1.0 0.636\n2.0 0.429",
      explanation: "logit은 그대로이고 $T$로 나눈 뒤 softmax를 적용한다. $T$가 작으면 차이가 커져 1위의 확률이 86.5%가 되고, $T = 2$이면 차이가 줄어 42.9%로 분포가 평평해진다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "logit $[3, 2, 1, 0, -1]$에서 $T = 0.5$일 때 1위 후보의 확률이 $T = 1$일 때보다 커지는 이유를 $\\text{softmax}(z/T)$로 쓰고, $T \\to 0$과 $T \\to \\infty$에서 분포가 어떻게 되는지 쓰라.",
      answer: md`
$T = 0.5$로 나누면 logit이 $[6, 4, 2, 0, -2]$가 되어 후보 사이의 차이가 2배가 된다. softmax는 지수함수이므로 차이가 클수록 1위 후보의 확률이 커져, 1위의 확률이 $T = 1$의 63.6%에서 86.5%가 된다. $T \to 0$이면 차이가 한없이 커져 확률이 가장 큰 후보 하나만 선택되는 greedy 디코딩과 같고, $T \to \infty$이면 모든 $z_i/T$가 0에 가까워져 균등분포가 된다.
`,
      keyPoints: [
        "$T$로 나누면 logit 사이의 차이가 $1/T$배가 된다",
        "차이가 클수록 지수함수 때문에 1위의 확률이 커진다",
        "$T \\to 0$이면 greedy(argmax)와 같다",
        "$T \\to \\infty$이면 균등분포가 된다",
      ],
    },
    {
      key: "d2",
      question: "greedy 디코딩, 빔 서치, top-k, top-p 샘플링의 차이를 쓰고, 확률분포가 한 토큰에 집중될 때와 여러 토큰에 고르게 퍼질 때 top-p의 후보 수가 어떻게 바뀌는지 쓰라.",
      answer: md`
greedy 디코딩은 스텝마다 확률이 가장 큰 토큰을 고르는 결정적 방법이라 같은 구절이 반복되기 쉽고, 시퀀스 전체의 확률이 가장 큰 출력을 놓칠 수 있다. 빔 서치는 누적 확률이 큰 시퀀스 $B$개를 유지해, 첫 스텝의 확률은 낮아도 전체 확률이 큰 시퀀스를 찾으므로 번역·요약에 유리하다. top-k는 확률 상위 $k$개 안에서, top-p는 누적확률이 처음으로 $p$ 이상이 되는 지점까지의 토큰 안에서 샘플링해 확률이 매우 낮은 후보를 제외한다.

top-k는 후보 수가 $k$로 고정되지만 top-p는 분포의 형태에 따라 바뀐다. 분포가 한 토큰에 집중되면 그 토큰 하나로 누적확률이 $p$를 넘어 후보가 1~2개로 줄고, 분포가 고르게 퍼지면 $p$에 도달할 때까지 많은 토큰이 필요해 후보가 늘어난다.
`,
      keyPoints: [
        "greedy: 스텝마다 argmax, 결정적이고 반복되기 쉽다",
        "빔 서치: 상위 $B$개 시퀀스를 유지해 전체 확률이 큰 출력을 찾는다",
        "top-k는 후보 수가 고정, top-p는 누적확률로 후보를 정한다",
        "분포가 집중되면 top-p의 후보가 적고, 퍼지면 많다",
      ],
    },
  ],
  references: [
    { title: "Hugging Face — How to generate text", url: "https://huggingface.co/blog/how-to-generate", note: "greedy, 빔 서치, top-k, top-p를 GPT-2로 비교 (영문)" },
    { title: "Holtzman et al. (2019) — The Curious Case of Neural Text Degeneration", url: "https://arxiv.org/abs/1904.09751", note: "top-p(nucleus) 샘플링을 제안한 논문: 그림 1의 반복 예시 (영문)" },
  ],
});
