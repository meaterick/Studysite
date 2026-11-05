import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/backprop";

export default defineLesson({
  id: "backprop",
  title: "순전파, 역전파, 계산 그래프",
  tier: "core",
  concepts: ["backprop-autodiff"],
  goal: "계산 식을 계산 그래프로 나누고, 덧셈·곱셈·ReLU 등 노드의 국소 미분과 연쇄법칙으로 역전파를 손으로 수행하며, 한 층의 기울기 $\\partial L/\\partial W = \\delta x^\\top$, $\\partial L/\\partial x = W^\\top \\delta$를 행렬 모양으로 확인하고 수치미분으로 검산한다.",
  why: "신경망은 파라미터가 수백만에서 수천억 개라, 기울기를 효율적으로 계산하지 못하면 경사하강법을 쓸 수 없다. 역전파는 순전파와 비슷한 비용으로 모든 파라미터의 기울기를 구하는 방법이고, PyTorch의 자동미분([[lesson:pytorch]])과 다음 레슨에서 만드는 자동미분 엔진([[lesson:micrograd]])이 이 원리로 동작한다.",
  body: md`
### 계산 그래프와 순전파

**계산 그래프**는 식을 덧셈·곱셈·ReLU 같은 작은 연산(노드)으로 나누고, 한 노드의 출력이 어느 노드의 입력으로 쓰이는지를 화살표로 이은 방향 그래프다. 신경망의 계산은 입력에서 손실 $L$까지 이어지는 계산 그래프이고, 입력 쪽 노드부터 차례로 값을 계산하는 것이 **순전파**다.

[[diagram:computational-graph]]

### 역전파

**역전파**는 손실 $L$에서 시작해 순전파의 반대 순서로 노드를 방문하며 $\partial L / \partial(\text{노드 값})$을 계산한다. 노드 $y = f(x)$에서는 출력 쪽에서 이미 계산된 기울기 $\partial L / \partial y$에 그 노드의 **국소 미분** $\partial y / \partial x$를 곱해 입력 쪽으로 보낸다. 연쇄법칙 그대로다([[lesson:chain-rule]]).

\`\`\`math
\frac{\partial L}{\partial x} = \frac{\partial L}{\partial y} \cdot \frac{\partial y}{\partial x}
\`\`\`

한 값이 여러 노드의 입력으로 쓰이면, 각 경로에서 돌아온 기울기를 **더한다**. 각 노드는 자기 입력과 출력 사이의 국소 미분만 알면 되므로, 새 연산을 추가할 때도 그 연산의 순전파와 국소 미분 한 쌍만 정의하면 된다.

역전파의 장점은 효율이다. 수치미분으로 기울기를 구하면 파라미터마다 값을 조금 바꿔 순전파를 다시 해야 하므로 파라미터가 $p$개면 순전파를 $p$번 이상 해야 한다([[lesson:derivatives]]). 역전파는 순전파 한 번으로 저장한 중간값을 다시 쓰면서 그래프를 거꾸로 한 번 지나므로, 순전파의 몇 배 정도의 비용으로 모든 파라미터의 기울기를 한꺼번에 얻는다.

### 노드별 국소 미분

아래 표의 $g$는 출력 쪽에서 내려온 기울기 $\partial L / \partial z$다.

| 노드 | 순전파 | 입력으로 보내는 기울기 |
| --- | --- | --- |
| 덧셈 | $z = a + b$ | $a$와 $b$에 각각 $g$ |
| 곱셈 | $z = a \cdot b$ | $a$에 $b \cdot g$, $b$에 $a \cdot g$ |
| 제곱 | $z = a^2$ | $2a \cdot g$ |
| ReLU | $z = \max(0, a)$ | $a > 0$이면 $g$, 아니면 0 |
| 지수 | $z = e^a$ | $z \cdot g$ |
| 로그 | $z = \ln a$ | $g / a$ |
| 시그모이드 | $z = \sigma(a)$ | $z(1 - z) \cdot g$ |
| tanh | $z = \tanh a$ | $(1 - z^2) \cdot g$ |

곱셈 노드는 상대 입력의 값을 곱해 보낸다. $b = 0$이면 $a$를 바꿔도 $z$가 변하지 않으므로 $a$의 기울기도 0이다. 시그모이드와 tanh의 국소 미분은 출력 $z$만으로 계산되므로 순전파 때 출력을 저장해 두면 다시 계산하지 않아도 된다. 시그모이드의 국소 미분은 $z = 0.5$일 때 최대 0.25이므로, 시그모이드를 여러 층 쌓으면 기울기가 층마다 4분의 1 이하로 줄어든다([[lesson:initialization]]).

[[diagram:backprop-gates]]

:::example 예제: $L = (wx + c)^2$의 역전파
$w = 2$, $x = 3$, $c = 1$이라 하자. 그래프를 $u = wx$(곱셈), $v = u + c$(덧셈), $L = v^2$(제곱)로 나누면 순전파는 $u = 6$, $v = 7$, $L = 49$다. 역전파는 $\partial L / \partial L = 1$에서 시작한다.

- 제곱 노드: $\partial L / \partial v = 2v = 14$
- 덧셈 노드: $\partial L / \partial u = 14$, $\partial L / \partial c = 14$
- 곱셈 노드: $\partial L / \partial w = 14 \times x = 42$, $\partial L / \partial x = 14 \times w = 28$

수치미분으로 검산하면 $w$를 0.001 늘렸을 때 $L = 7.003^2 \approx 49.042$이므로 $\Delta L / \Delta w \approx 42$다. 기울기를 직접 구현했을 때 이렇게 수치미분과 비교하는 것을 **기울기 검사**(gradient check)라 한다. 두 값의 상대오차 $|g_{\text{역전파}} - g_{\text{수치}}| / (|g_{\text{역전파}}| + |g_{\text{수치}}|)$가 $10^{-5}$보다 작으면 구현이 맞다고 본다.
:::

### 한 층의 역전파

선형 층 $z = Wx + b$에서 출력 쪽 기울기를 $\delta = \partial L / \partial z$라 하면 다음이 성립한다.

\`\`\`math
\frac{\partial L}{\partial W} = \delta\, x^\top, \qquad \frac{\partial L}{\partial b} = \delta, \qquad \frac{\partial L}{\partial x} = W^\top \delta
\`\`\`

$\partial L / \partial x$는 앞 층으로 보내는 기울기다. 공식이 맞는지는 모양으로 확인한다. $W$가 $4 \times 3$이면 $x$는 길이 3, $z$와 $\delta$는 길이 4이므로, $W$와 같은 모양($4 \times 3$)의 기울기는 $\delta$(4)와 $x^\top$(3)의 외적이어야 하고, $x$와 같은 모양(3)의 기울기는 $W^\top$($3 \times 4$)과 $\delta$(4)의 곱이어야 한다. 기울기의 모양은 항상 그 값의 모양과 같다.

[[diagram:backprop-shapes]]

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
W, b, x = rng.normal(size=(4, 3)), rng.normal(size=4), rng.normal(size=3)
loss = lambda W: np.sum((W @ x + b) ** 2)              # L = Σ z², δ = 2z

delta = 2 * (W @ x + b)
dW, db, dx = np.outer(delta, x), delta, W.T @ delta    # 역전파 공식
h = 1e-6
num = np.zeros_like(W)
for i in range(4):
    for j in range(3):
        E = np.zeros_like(W); E[i, j] = h
        num[i, j] = (loss(W + E) - loss(W - E)) / (2 * h)   # 중심차분
print(dW.shape, db.shape, dx.shape, float(np.max(np.abs(dW - num))) < 1e-6)   # (4, 3) (4,) (3,) True
\`\`\`

샘플 여러 개를 행으로 쌓은 배치 $X$(모양 $(n, d_{\text{입력}})$)로 $Z = XW^\top + b$를 계산하면, $\delta$도 모양 $(n, d_{\text{출력}})$이 되고 $\partial L / \partial W = \delta^\top X$, $\partial L / \partial b$는 $\delta$의 열 합, $\partial L / \partial X = \delta W$다. 샘플마다의 외적을 모두 더한 것과 같다.
`,
  checks: [
    {
      key: "c1",
      question: "곱셈 노드 $z = a \\cdot b$에서 $a = 3$, $b = -2$이고 출력 쪽 기울기가 $\\partial L/\\partial z = 5$일 때 $\\partial L/\\partial a$는?",
      choices: ["$-10$", "$5$", "$15$", "$-2$"],
      answer: 0,
      explanation: "곱셈 노드는 상대 입력의 값을 곱해 보낸다: $5 \\times b = 5 \\times (-2) = -10$.",
    },
    {
      key: "c2",
      question: "덧셈 노드 $z = a + b$에서 기울기 $g$를 받으면 $a$, $b$로 보내는 기울기는?",
      choices: ["각각 $g$", "각각 $g/2$", "$a$에만 $g$", "$g \\cdot a$, $g \\cdot b$"],
      answer: 0,
      explanation: "$\\partial z / \\partial a = \\partial z / \\partial b = 1$이므로 기울기가 그대로 양쪽으로 간다.",
    },
    {
      key: "c3",
      question: "파라미터가 $p$개인 모델에서 수치미분 대신 역전파를 쓰는 가장 큰 이유는?",
      choices: [
        "순전파 한 번과 비슷한 비용으로 모든 파라미터의 기울기를 한꺼번에 구하기 때문",
        "새로운 미분 규칙을 쓰기 때문",
        "수치미분보다 덜 정확하기 때문",
        "GPU에서만 동작하기 때문",
      ],
      answer: 0,
      explanation: "수치미분은 파라미터마다 순전파를 다시 해야 하므로 $p$번 이상의 순전파가 필요하다. 역전파는 중간값을 재사용해 그래프를 거꾸로 한 번 지난다.",
    },
    {
      key: "c4",
      question: "한 값 $a$가 두 노드의 입력으로 쓰여, 두 경로에서 기울기 3과 −1이 돌아왔다. $\\partial L / \\partial a$는?",
      choices: ["2", "3", "−3", "−1"],
      answer: 0,
      explanation: "여러 경로로 손실에 영향을 주는 값의 기울기는 경로별 기울기의 합이다.",
    },
    {
      key: "c5",
      question: "$W$가 $4 \\times 3$인 층 $z = Wx + b$에서 $\\partial L / \\partial x = W^\\top \\delta$의 모양은?",
      choices: ["길이 3", "길이 4", "$4 \\times 3$", "$3 \\times 4$"],
      answer: 0,
      explanation: "기울기의 모양은 그 값의 모양과 같다. $x$가 길이 3이므로 $W^\\top$($3 \\times 4$)과 $\\delta$(길이 4)의 곱도 길이 3이다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
w, x, c = 2.0, 3.0, 1.0
u = w * x
v = u + c
L = v ** 2
dv = 2 * v
du = dv
dw, dx = du * x, du * w
print(L, dw, dx, dv)
`,
      expected: "49.0 42.0 28.0 14.0",
      explanation: "순전파는 $u = 6$, $v = 7$, $L = 49$다. 역전파는 제곱 노드에서 $2v = 14$, 덧셈 노드는 그대로 14, 곱셈 노드는 상대 값을 곱해 $\\partial L/\\partial w = 42$, $\\partial L/\\partial x = 28$이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$L = (wx + c)^2$에서 $w = -1$, $x = 4$, $c = 2$일 때 계산 그래프를 노드로 나눠 순전파 값과 $\\partial L/\\partial w$, $\\partial L/\\partial x$, $\\partial L/\\partial c$를 계산하라. 곱셈 노드에서 상대 입력의 값을 곱하는 이유도 쓰라.",
      answer: md`
$u = wx = -4$, $v = u + c = -2$, $L = v^2 = 4$다. 역전파는 제곱 노드에서 $\partial L / \partial v = 2v = -4$이고, 덧셈 노드는 기울기를 그대로 보내므로 $\partial L / \partial u = \partial L / \partial c = -4$다. 곱셈 노드에서 $\partial L / \partial w = -4 \times x = -16$, $\partial L / \partial x = -4 \times w = 4$다.

곱셈 노드 $u = wx$에서 $w$가 조금 바뀌면 $u$는 $x$배만큼 바뀐다. 국소 미분 $\partial u / \partial w = x$이므로 연쇄법칙에 따라 출력 쪽 기울기에 상대 입력 $x$를 곱한다.
`,
      keyPoints: [
        "순전파: $u = -4$, $v = -2$, $L = 4$",
        "$\\partial L/\\partial v = 2v = -4$, 덧셈 노드는 그대로 보내 $\\partial L/\\partial c = -4$",
        "$\\partial L/\\partial w = -16$, $\\partial L/\\partial x = 4$",
        "곱셈 노드의 국소 미분은 상대 입력의 값",
      ],
    },
    {
      key: "d2",
      question: "선형 층 $z = Wx + b$의 역전파 공식 세 가지를 쓰고, 모양만으로 공식이 맞는지 확인하는 방법을 $W$가 $4 \\times 3$인 경우로 설명하라.",
      answer: md`
출력 쪽 기울기를 $\delta = \partial L / \partial z$라 하면 $\partial L / \partial W = \delta x^\top$, $\partial L / \partial b = \delta$, $\partial L / \partial x = W^\top \delta$다.

기울기의 모양은 그 값의 모양과 같아야 한다. $W$가 $4 \times 3$이면 $x$는 길이 3, $z$와 $\delta$는 길이 4다. $W$의 기울기는 $4 \times 3$이어야 하므로 길이 4인 $\delta$와 길이 3인 $x$의 외적 $\delta x^\top$이다. $b$의 기울기는 길이 4이므로 $\delta$ 그대로다. $x$의 기울기는 길이 3이어야 하므로, $3 \times 4$인 $W^\top$에 길이 4인 $\delta$를 곱한 $W^\top \delta$다.
`,
      keyPoints: [
        "$\\partial L/\\partial W = \\delta x^\\top$, $\\partial L/\\partial b = \\delta$, $\\partial L/\\partial x = W^\\top \\delta$",
        "기울기의 모양은 그 값의 모양과 같다",
        "$W$($4 \\times 3$)의 기울기는 $\\delta$(4)와 $x$(3)의 외적",
        "$x$(3)의 기울기는 $W^\\top$($3 \\times 4$)과 $\\delta$(4)의 곱",
      ],
    },
  ],
  references: [
    { title: "CS231n — Backpropagation, Intuitions", url: "https://cs231n.github.io/optimization-2/", note: "노드별 기울기 전달과 계산 예 (영문)" },
    { title: "3Blue1Brown — Backpropagation calculus", url: "https://www.3blue1brown.com/lessons/backpropagation-calculus", note: "연쇄법칙이 층을 따라 이어지는 과정 (영문)" },
  ],
});
