import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/initialization";

export default defineLesson({
  id: "initialization",
  title: "가중치 초기화와 기울기 소실·폭주",
  tier: "core",
  concepts: ["initialization-normalization"],
  goal: "역전파에서 국소 미분이 층마다 곱해져 기울기가 소실되거나 폭주하는 원리와 dead ReLU 문제를 설명하고, 가중치를 같은 값으로 초기화하면 안 되는 이유를 확인하며, $\\mathrm{Var}(z) \\approx \\text{fan\\_in}\\cdot\\mathrm{Var}(w)\\cdot\\mathrm{Var}(x)$에서 Xavier·He 초기화를 유도해 깊은 신경망의 활성화 크기를 비교한다.",
  why: "깊은 신경망이 학습되지 않는 가장 흔한 원인은 기울기가 앞쪽 층에 도달하기 전에 사라지거나 지나치게 커지는 것이다. 초기화는 PyTorch의 층이 기본으로 해 주지만([[lesson:pytorch]]), 층을 직접 만들거나 깊이를 늘릴 때 활성화의 크기가 유지되는지 확인할 수 있어야 한다. 정규화 층([[lesson:normalization-layers]])과 잔차 연결([[lesson:dropout-residual]])도 같은 문제를 다룬다.",
  body: md`
### 기울기 소실과 폭주

역전파는 층마다 국소 미분을 곱해 앞쪽 층으로 기울기를 보낸다([[lesson:backprop]]). 층마다 곱해지는 값의 크기가 1보다 작으면 기울기는 층 수만큼 거듭제곱으로 작아져 앞쪽 층에 거의 0이 도달하고(**기울기 소실**), 1보다 크면 거듭제곱으로 커져 학습이 발산한다(**기울기 폭주**). 시그모이드의 국소 미분은 최대 0.25이고 tanh도 입력의 절댓값이 크면 0에 가까우므로, 이런 활성화를 깊게 쌓으면 기울기가 소실된다. ReLU는 입력이 양수인 구간에서 국소 미분이 1이라 이 구간에서는 기울기의 크기가 유지된다. 다만 입력이 음수이면 국소 미분이 0이므로, 학습 중 모든 입력에서 음수가 되는 뉴런은 기울기를 받지 못해 다시는 갱신되지 않는다. 이런 뉴런을 **dead ReLU**라 한다.

층마다 곱해지는 배율이 1에서 조금만 벗어나도 깊이에 따라 결과가 크게 달라진다.

| 층 수 | 층마다 1.5배 | 층마다 0.8배 |
| --- | --- | --- |
| 3 | $1.5^3 \approx 3.4$배 | $0.8^3 \approx 0.51$배 |
| 10 | $1.5^{10} \approx 57.7$배 | $0.8^{10} \approx 0.107$배 |
| 20 | $1.5^{20} \approx 3325$배 | $0.8^{20} \approx 0.0115$배 |

얕은 신경망에서는 배율이 조금 어긋나도 학습되지만, 층이 깊을수록 작은 어긋남이 거듭제곱으로 커진다. 그래서 깊은 신경망일수록 초기화에 민감하다.

### 같은 값으로 초기화하면 안 된다

같은 층의 뉴런을 모두 같은 가중치로 시작하면, 뉴런들은 순전파에서 같은 출력을 내고 역전파에서 같은 기울기를 받는다. 갱신 후에도 계속 같으므로 뉴런 여러 개가 하나처럼 동작하고, 서로 다른 특성을 학습하지 못한다(대칭성 문제). 가중치를 0으로 초기화하는 것도 같은 문제를 일으킨다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
X, y = rng.normal(size=(8, 3)), rng.normal(size=(8, 1))
W1, W2 = np.full((3, 4), 0.5), np.full((4, 1), 0.5)    # 은닉 뉴런 4개를 같은 값으로 시작
for _ in range(200):
    h = np.tanh(X @ W1)
    d = 2 * (h @ W2 - y) / len(y)                       # 평균제곱오차의 기울기
    gW2 = h.T @ d
    gW1 = X.T @ (d @ W2.T * (1 - h ** 2))
    W1, W2 = W1 - 0.1 * gW1, W2 - 0.1 * gW2
print(np.round(W1, 3))                                  # 200번 갱신 뒤에도 네 열이 같다
# [[-0.534 -0.534 -0.534 -0.534]
#  [ 0.053  0.053  0.053  0.053]
#  [ 1.305  1.305  1.305  1.305]]
\`\`\`

그래서 가중치는 작은 무작위 값으로 시작한다. 남은 질문은 무작위 값의 크기를 얼마로 할지다.

### 분산이 fan_in에 반비례해야 하는 이유

뉴런의 활성화 전 값 $z = w_1 x_1 + \cdots + w_{\text{fan\_in}} x_{\text{fan\_in}}$은 항 fan_in개의 합이다(fan_in은 층의 입력 수). $w_i$와 $x_i$가 서로 독립이고 평균이 0이면 항 하나의 분산은 $\mathrm{Var}(w)\mathrm{Var}(x)$이고, 독립인 항의 합의 분산은 각 분산의 합이므로([[lesson:random-variables]]) 다음이 성립한다.

\`\`\`math
\mathrm{Var}(z) \approx \text{fan\_in} \cdot \mathrm{Var}(w) \cdot \mathrm{Var}(x)
\`\`\`

fan_in = 100, $\mathrm{Var}(w) = \mathrm{Var}(x) = 1$이면 $\mathrm{Var}(z) \approx 100$이라 표준편차가 층 하나에 10배가 된다. 층을 지나도 분산을 유지하려면 $\mathrm{Var}(w) \approx 1/\text{fan\_in}$이어야 한다.

- **Xavier(Glorot) 초기화**: 순전파에서는 fan_in, 역전파에서는 fan_out(층의 출력 수)에 맞춰야 하므로 둘의 평균을 써서 $\mathrm{Var}(w) = 2/(\text{fan\_in} + \text{fan\_out})$로 정한다. tanh·시그모이드에 쓴다.
- **He 초기화**: ReLU는 입력의 절반가량을 0으로 만들어 분산을 절반으로 줄이므로, 이를 보충해 $\mathrm{Var}(w) = 2/\text{fan\_in}$으로 정한다. ReLU 계열에 쓴다.

fan_in = 100인 ReLU 층에 He 초기화를 쓰면 $\mathrm{Var}(w) = 0.02$, 표준편차는 약 0.141이다. 다음 코드는 폭 256인 ReLU 층 10개를 세 가지 표준편차로 초기화해 활성화의 표준편차를 잰다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
x0 = rng.normal(size=(1000, 256))                       # 입력 1000개, 특성 256개(표준편차 1)
for name, std in [("표준정규(std=1)", 1.0), ("너무 작게(std=0.01)", 0.01), ("He: sqrt(2/256)", np.sqrt(2 / 256))]:
    h = x0
    stds = []
    for layer in range(10):                             # ReLU 층 10개
        W = rng.normal(0, std, size=(256, 256))
        h = np.maximum(0, h @ W)
        stds.append(h.std())
    print(f"{name:18s} 1층 {stds[0]:.3g} → 5층 {stds[4]:.3g} → 10층 {stds[9]:.3g}")
# 표준정규(std=1)        1층 9.4 → 5층 1.59e+05 → 10층 3.04e+10
# 너무 작게(std=0.01)    1층 0.0939 → 5층 1.54e-05 → 10층 2.65e-10
# He: sqrt(2/256)    1층 0.826 → 5층 0.992 → 10층 0.985
\`\`\`

표준정규분포 그대로면 층마다 약 $\sqrt{256/2} \approx 11$배씩 커져 10층 뒤 $3 \times 10^{10}$이 되고, 너무 작으면 $10^{-10}$ 아래로 줄어든다. He 초기화만 10층 내내 1 근처를 유지한다. 활성화가 이렇게 커지거나 작아지면 역전파되는 기울기도 같은 비율로 커지거나 작아진다. 층을 지나며 기울기가 변하는 과정의 수식과 잔차 연결·기울기 클리핑의 원리는 [[lesson:gradient-flow]]에서 다룬다.

[[diagram:init-signal-propagation]]
`,
  checks: [
    {
      key: "c1",
      question: "fan_in = 50인 ReLU 층에 He 초기화를 쓰면 가중치의 표준편차는?",
      choices: ["$1/50 = 0.02$", "$\\sqrt{2/50} = 0.2$", "$2/50 = 0.04$", "$\\sqrt{50} \\approx 7.07$"],
      answer: 1,
      explanation: "He 초기화는 $\\mathrm{Var}(W) = 2/\\text{fan\\_in} = 0.04$이므로 표준편차는 $\\sqrt{0.04} = 0.2$.",
    },
    {
      key: "c2",
      question: "층마다 활성화의 표준편차가 0.8배씩 줄어든다면 10층 뒤에는 대략?",
      choices: ["0.8배", "0.1배", "8배", "0.5배"],
      answer: 1,
      explanation: "$0.8^{10} \\approx 0.107$이다. 층마다 같은 비율이 곱해지므로 1보다 작은 비율은 깊이에 따라 지수적으로 작아진다.",
    },
    {
      key: "c3",
      question: "모든 가중치를 같은 값(예: 0.5)으로 초기화한 은닉층의 뉴런들은 학습 후 어떻게 되는가?",
      choices: ["서로 다른 특성을 학습한다", "같은 기울기를 받아 학습이 끝날 때까지 서로 같은 값으로 남는다", "출력이 모두 0이 된다", "학습률에 따라 자동으로 달라진다"],
      answer: 1,
      explanation: "같은 출력과 같은 기울기를 받아 계속 같게 갱신된다. 본문 코드에서 200번 갱신해도 네 열이 같게 남는다. 작은 무작위 값으로 시작해야 한다.",
    },
    {
      key: "c4",
      question: "fan_in = 256, fan_out = 256인 tanh 층에 Xavier 초기화 $\\mathrm{Var}(W) = 2/(\\text{fan\\_in} + \\text{fan\\_out})$를 쓰면 가중치의 표준편차는?",
      choices: ["0.0625", "0.125", "0.0039", "0.088"],
      answer: 0,
      explanation: "$\\mathrm{Var}(W) = 2/512 = 1/256$이므로 표준편차는 $1/16 = 0.0625$다. 0.088은 같은 층의 He 초기화($\\sqrt{2/256}$) 값이다.",
    },
    {
      key: "c5",
      question: "폭 256인 ReLU 층 10개를 표준편차 1인 가중치로 초기화하면 마지막 층 활성화의 크기는 대략 어떻게 되는가?",
      choices: ["층마다 약 11배씩 커져 10층 뒤 약 $10^{10}$배가 된다", "1 근처로 유지된다", "정확히 0이 된다", "층마다 절반으로 줄어든다"],
      answer: 0,
      explanation: "$\\mathrm{Var}(z) \\approx \\text{fan\\_in} \\cdot \\mathrm{Var}(w) \\cdot \\mathrm{Var}(x)$이고 ReLU가 절반을 깎으므로 분산이 층마다 약 128배, 표준편차는 약 11배가 된다. 10층이면 $10^{10}$ 규모다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
print(round(1.5 ** 10, 1), round(0.8 ** 10, 3))
print(round(1.2 ** 15, 1))
`,
      expected: "57.7 0.107\n15.4",
      explanation: "층마다 표준편차가 1.5배씩 커지면 10층 뒤 약 57.7배(폭주), 0.8배씩 줄면 약 0.107배(소실)가 된다. 1.2배씩 15층이면 약 15.4배다. 층 하나의 작은 어긋남이 깊이만큼 거듭제곱된다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "가중치를 모두 같은 값(0 포함)으로 초기화하면 학습이 되지 않는 이유를 대칭성으로 설명하라. 입력이 계속 음수인 ReLU 뉴런이 학습되지 않는 이유도 국소 미분으로 쓰라.",
      answer: md`
같은 층의 뉴런이 모두 같은 가중치로 시작하면 같은 입력에 대해 같은 출력을 내고, 역전파에서 같은 기울기를 받는다. 갱신 후에도 가중치가 계속 같으므로 뉴런 여러 개가 하나처럼 동작하고 서로 다른 특성을 학습하지 못한다. 이 대칭을 깨려고 작은 무작위 값으로 초기화한다.

ReLU의 국소 미분은 입력이 음수일 때 0이다. 어떤 뉴런의 입력이 모든 샘플에서 음수가 되면 그 뉴런으로 들어오는 기울기가 항상 0이라 가중치가 다시는 갱신되지 않는다. 이런 뉴런을 dead ReLU라 한다.
`,
      keyPoints: [
        "같은 가중치 → 같은 출력과 같은 기울기 → 계속 같게 갱신",
        "뉴런 여러 개가 하나처럼 동작해 서로 다른 특성을 배우지 못한다",
        "작은 무작위 값으로 대칭을 깬다",
        "ReLU는 음수 입력에서 국소 미분 0 → 기울기를 받지 못한다",
      ],
    },
    {
      key: "d2",
      question: "뉴런의 활성화 전 값 z가 fan_in개 항의 합이라는 사실로 가중치의 분산을 fan_in에 반비례하게 정해야 하는 이유를 설명하고, He 초기화가 Xavier 초기화보다 분산을 두 배로 잡는 이유를 쓰라. 층마다 표준편차가 1.2배씩 커지면 15층 뒤에 몇 배가 되는지도 계산하라.",
      answer: md`
$w_i$와 $x_i$가 독립이고 평균이 0이면 항 하나의 분산은 $\mathrm{Var}(w)\mathrm{Var}(x)$이고, 독립인 항 fan_in개의 합인 $z$의 분산은 $\text{fan\_in} \cdot \mathrm{Var}(w) \cdot \mathrm{Var}(x)$다. 층을 지나도 분산이 유지되려면 $\mathrm{Var}(w) \approx 1/\text{fan\_in}$이어야 한다.

ReLU는 입력의 절반가량을 0으로 만들어 출력의 분산을 절반으로 줄인다. He 초기화는 이 감소를 보충하려고 $\mathrm{Var}(w) = 2/\text{fan\_in}$으로, Xavier($1/\text{fan\_in}$ 수준)의 두 배로 잡는다. 층마다 1.2배씩 커지면 15층 뒤 $1.2^{15} \approx 15.4$배가 된다. 층 하나의 작은 어긋남이 깊이만큼 거듭제곱되므로 깊은 신경망일수록 초기화에 민감하다.
`,
      keyPoints: [
        "$\\mathrm{Var}(z) \\approx \\text{fan\\_in} \\cdot \\mathrm{Var}(w) \\cdot \\mathrm{Var}(x)$",
        "분산을 유지하려면 $\\mathrm{Var}(w) \\approx 1/\\text{fan\\_in}$",
        "ReLU가 분산을 절반으로 줄이므로 He는 $2/\\text{fan\\_in}$",
        "$1.2^{15} \\approx 15.4$, 깊을수록 거듭제곱으로 커진다",
      ],
    },
  ],
  references: [
    { title: "He et al. (2015) — Delving Deep into Rectifiers", url: "https://arxiv.org/abs/1502.01852", note: "He 초기화를 제안한 논문, 2.2절이 본문의 분산 유도 (영문)" },
    { title: "deeplearning.ai — Initializing neural networks", url: "https://www.deeplearning.ai/ai-notes/initialization/", note: "초기화 크기에 따른 학습 차이를 조작하며 보는 자료 (영문)" },
  ],
});
