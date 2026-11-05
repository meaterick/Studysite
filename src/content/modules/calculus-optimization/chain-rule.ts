import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/chain-rule";

export default defineLesson({
  id: "chain-rule",
  title: "연쇄법칙",
  tier: "core",
  concepts: ["chain-rule"],
  goal: "합성함수의 도함수를 연쇄법칙으로 구하고, 여러 단계로 된 계산에서 국소 도함수를 뒤에서부터 곱해 손실의 기울기를 구하며, 한 변수가 여러 경로로 결과에 영향을 줄 때 경로별 기여를 더한다.",
  why: "신경망은 층을 여러 번 합성한 함수이고, 손실을 각 층의 파라미터로 미분하는 역전파는 연쇄법칙을 층마다 반복해 적용하는 알고리즘이다([[lesson:backprop]]). 시그모이드의 도함수와 로지스틱 회귀의 기울기도 연쇄법칙으로 구한다([[lesson:logistic-regression]]).",
  body: md`
### 합성함수의 미분

$y = f(g(x))$처럼 함수를 합성한 경우([[lesson:functions-composition]]), 안쪽 함수의 값을 $u = g(x)$로 두면 도함수는 두 도함수의 곱이다.

\`\`\`math
\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx} = f'(g(x))\, g'(x)
\`\`\`

이것을 **연쇄법칙**(chain rule)이라고 한다. 바깥 함수의 도함수를 안쪽 함수의 값 $u = g(x)$에서 계산하고, 안쪽 함수의 도함수를 곱한다. 두 변화율이 곱해지는 이유는 다음과 같다. $x$가 $\Delta x$만큼 바뀌면 $u$는 약 $g'(x)\,\Delta x$만큼 바뀌고, $y$는 $u$의 변화량의 약 $f'(u)$배만큼 바뀐다. 따라서 $y$의 변화량은 약 $f'(u)\,g'(x)\,\Delta x$다.

- $y = (3x + 1)^2$: $u = 3x + 1$, $y = u^2$이므로 $\frac{dy}{dx} = 2u \cdot 3 = 6(3x + 1)$이다. 전개한 $9x^2 + 6x + 1$을 미분한 $18x + 6$과 같다.
- $y = e^{-x^2}$: $u = -x^2$이므로 $\frac{dy}{dx} = e^{u} \cdot (-2x) = -2x\,e^{-x^2}$이다.
- $y = \ln(1 + e^x)$: $u = 1 + e^x$이므로 $\frac{dy}{dx} = \frac{1}{u} \cdot e^x = \frac{e^x}{1 + e^x}$이다. 이 값은 아래에서 다룰 시그모이드 함수 $\sigma(x)$와 같다.

### 손실을 파라미터로 미분하기

데이터 한 개 $(x, y)$에 대한 모델 $\hat y = wx$의 제곱오차 $L(w) = (wx - y)^2$에서 $u = wx - y$로 두면

\`\`\`math
\frac{dL}{dw} = \frac{dL}{du} \cdot \frac{du}{dw} = 2(wx - y) \cdot x
\`\`\`

이다. $(x, y) = (2, 6)$, $w = 1$이면 $2 \times (2 - 6) \times 2 = -16$으로, [[lesson:gradient]]에서 식을 전개해 얻은 값과 같다. 기울기는 예측 오차 $wx - y$와 입력 $x$의 곱에 비례한다. 오차가 0이면 기울기가 0이라 $w$를 고치지 않고, 입력 $x$가 0인 데이터는 $w$가 예측에 영향을 주지 않으므로 $w$의 기울기에 기여하지 않는다.

### 여러 단계로 나누어 계산하기

계산을 단계로 나누면 연쇄법칙을 기계적으로 적용할 수 있다. $\hat y = wx$, $e = \hat y - y$, $L = e^2$이면

\`\`\`math
\frac{\partial L}{\partial w} = \frac{\partial L}{\partial e} \cdot \frac{\partial e}{\partial \hat y} \cdot \frac{\partial \hat y}{\partial w} = 2e \cdot 1 \cdot x
\`\`\`

이다. 각 단계의 도함수 $\frac{\partial L}{\partial e} = 2e$, $\frac{\partial e}{\partial \hat y} = 1$, $\frac{\partial \hat y}{\partial w} = x$를 **국소 도함수**라고 한다. 먼저 입력에서 손실까지 값을 차례로 계산하고(순전파), 손실에서 거꾸로 국소 도함수를 하나씩 곱해 나가면(역전파) 중간값마다의 기울기 $\frac{\partial L}{\partial e}$, $\frac{\partial L}{\partial \hat y}$, $\frac{\partial L}{\partial w}$를 차례로 얻는다. 층이 수십 개인 신경망도 이 순서로 기울기를 계산한다.

[[diagram:chain-rule-chain]]

### 시그모이드의 도함수

시그모이드 $\sigma(z) = \frac{1}{1 + e^{-z}}$는 실수를 0과 1 사이의 값으로 바꾸는 함수로, 로지스틱 회귀와 신경망에서 확률을 출력할 때 쓴다. $u = 1 + e^{-z}$로 두면 $\sigma = u^{-1}$이고 $\frac{du}{dz} = -e^{-z}$이므로

\`\`\`math
\sigma'(z) = -u^{-2} \cdot \frac{du}{dz} = \frac{e^{-z}}{(1 + e^{-z})^2}
\`\`\`

이다. $1 - \sigma(z) = \frac{e^{-z}}{1 + e^{-z}}$이므로 이 식은 다음과 같이 정리된다.

\`\`\`math
\sigma'(z) = \frac{1}{1 + e^{-z}} \cdot \frac{e^{-z}}{1 + e^{-z}} = \sigma(z)\,(1 - \sigma(z))
\`\`\`

순전파에서 계산한 $\sigma(z)$만으로 도함수를 구할 수 있다. 도함수의 최댓값은 $z = 0$에서 $0.5 \times 0.5 = 0.25$이고, $|z|$가 커지면 0에 가까워진다. 시그모이드 층을 여러 개 쌓으면 역전파에서 최대 0.25인 값이 층마다 곱해지므로, 입력에 가까운 층의 기울기가 매우 작아진다([[lesson:gradient-flow]]).

\`\`\`python
import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def numeric(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)

f = lambda x: (3 * x + 1) ** 2
print(6 * (3 * 2 + 1), round(numeric(f, 2), 4))         # 42 42.0: 연쇄법칙 6(3x + 1)과 수치미분

for z in [0, 2, 5]:
    s = sigmoid(z)
    print(z, round(s * (1 - s), 4), round(numeric(sigmoid, z), 4))   # σ(z)(1 − σ(z))와 수치미분
\`\`\`

### 여러 경로로 영향을 줄 때

변수 하나가 여러 중간값을 거쳐 결과에 영향을 주면, 경로마다 연쇄법칙으로 구한 값을 **더한다**. $u = w^2$, $v = 3w$, $f = uv$이면 $w$는 $u$와 $v$ 두 경로로 $f$에 영향을 준다.

\`\`\`math
\frac{df}{dw} = \frac{\partial f}{\partial u} \cdot \frac{du}{dw} + \frac{\partial f}{\partial v} \cdot \frac{dv}{dw} = v \cdot 2w + u \cdot 3 = 6w^2 + 3w^2 = 9w^2
\`\`\`

$f = 3w^3$을 직접 미분한 $9w^2$와 같다. 곱의 미분 규칙 $(gh)' = g'h + gh'$도 두 경로의 기여를 더한 식이다. 신경망에서 한 값이 다음 층의 여러 뉴런으로 전달되면, 역전파는 각 뉴런에서 돌아온 기울기를 더해 그 값의 기울기를 구한다([[lesson:micrograd]]).

:::warn 흔한 실수
- **안쪽 함수의 도함수를 곱하지 않는다.** $\frac{d}{dx}(3x + 1)^2 = 2(3x + 1)$이라고 쓰면 안쪽의 도함수 3을 빠뜨린 것이다.
- **바깥 함수의 도함수를 안쪽 값이 아닌 곳에서 계산한다.** $\frac{d}{dx}e^{-x^2}$에서 $e^u$는 $u = -x^2$에서 계산한다.
- **여러 경로 중 하나만 계산한다.** 한 변수가 여러 곳에 쓰이면 모든 경로의 기여를 더해야 한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$\\frac{d}{dx}(2x + 5)^3$은?",
      choices: ["$6(2x + 5)^2$", "$3(2x + 5)^2$", "$6(2x + 5)$", "$(2x + 5)^2$"],
      answer: 0,
      explanation: "$u = 2x + 5$로 두면 $3u^2 \\cdot 2 = 6(2x + 5)^2$이다. 안쪽 함수의 도함수 2를 곱해야 한다.",
    },
    {
      key: "c2",
      question: "$\\frac{d}{dx}e^{3x}$는?",
      choices: ["$3e^{3x}$", "$e^{3x}$", "$3x\\,e^{3x - 1}$", "$e^3$"],
      answer: 0,
      explanation: "$u = 3x$로 두면 $e^u \\cdot 3 = 3e^{3x}$이다. $e^u$의 도함수는 $e^u$이고, 거듭제곱 규칙은 지수가 변수인 경우에 쓰지 않는다.",
    },
    {
      key: "c3",
      question: "$L(w) = (wx - y)^2$에서 $x = 3$, $y = 1$, $w = 1$일 때 $\\frac{dL}{dw}$는?",
      choices: ["$12$", "$4$", "$6$", "$36$"],
      answer: 0,
      explanation: "$2(wx - y) \\cdot x = 2 \\times (3 - 1) \\times 3 = 12$이다. 입력 $x$를 곱하지 않으면 4가 된다.",
    },
    {
      key: "c4",
      question: "$\\sigma(z) = 0.8$일 때 $\\sigma'(z)$는?",
      choices: ["$0.16$", "$0.8$", "$0.2$", "$0.64$"],
      answer: 0,
      explanation: "$\\sigma'(z) = \\sigma(z)(1 - \\sigma(z)) = 0.8 \\times 0.2 = 0.16$이다.",
    },
    {
      key: "c5",
      question: "$\\hat y = wx$, $e = \\hat y - y$, $L = e^2$에서 $x = 2$, $y = 6$, $w = 1$일 때 $\\frac{\\partial L}{\\partial \\hat y}$는?",
      choices: ["$-8$", "$-16$", "$-4$", "$16$"],
      answer: 0,
      explanation: "$e = 2 - 6 = -4$이고 $\\frac{\\partial L}{\\partial \\hat y} = \\frac{\\partial L}{\\partial e} \\cdot \\frac{\\partial e}{\\partial \\hat y} = 2e \\cdot 1 = -8$이다. 여기에 $\\frac{\\partial \\hat y}{\\partial w} = x = 2$를 곱하면 $\\frac{\\partial L}{\\partial w} = -16$이다.",
    },
    {
      key: "c6",
      question: "$u = 2w$, $v = w^2$, $f = u + v$일 때 $w = 1$에서 $\\frac{df}{dw}$는?",
      choices: ["$4$", "$2$", "$3$", "$1$"],
      answer: 0,
      explanation: "두 경로의 기여를 더한다. $\\frac{\\partial f}{\\partial u}\\frac{du}{dw} + \\frac{\\partial f}{\\partial v}\\frac{dv}{dw} = 1 \\cdot 2 + 1 \\cdot 2w = 4$이다. $f = 2w + w^2$을 직접 미분해도 $2 + 2w = 4$다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import math
s = lambda z: 1 / (1 + math.exp(-z))
grad = 1.0
for layer in range(3):
    z = 0.0
    grad *= s(z) * (1 - s(z))
print(grad)
`,
      expected: "0.015625",
      explanation: "시그모이드의 도함수는 $z = 0$에서 $0.5 \\times 0.5 = 0.25$다. 세 단계를 지나며 연쇄법칙으로 0.25가 세 번 곱해지므로 $0.25^3 = 0.015625$다. 층이 깊어질수록 기울기가 기하급수적으로 작아진다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "뉴런 하나의 제곱오차 $L = (\\sigma(wx + b) - y)^2$을 $z = wx + b$, $p = \\sigma(z)$, $L = (p - y)^2$의 세 단계로 나누고, 연쇄법칙으로 $\\frac{\\partial L}{\\partial w}$와 $\\frac{\\partial L}{\\partial b}$를 구하라.",
      answer: md`
국소 도함수는 $\frac{\partial L}{\partial p} = 2(p - y)$, $\frac{\partial p}{\partial z} = \sigma(z)(1 - \sigma(z)) = p(1 - p)$, $\frac{\partial z}{\partial w} = x$, $\frac{\partial z}{\partial b} = 1$이다. 손실에서 거꾸로 곱하면

$$\frac{\partial L}{\partial w} = 2(p - y)\,p(1 - p)\,x, \qquad \frac{\partial L}{\partial b} = 2(p - y)\,p(1 - p)$$

이다. 두 기울기는 $\frac{\partial L}{\partial z} = 2(p - y)\,p(1 - p)$까지 같고, 마지막에 곱하는 $\frac{\partial z}{\partial w} = x$와 $\frac{\partial z}{\partial b} = 1$만 다르다.
`,
      keyPoints: ["국소 도함수 $2(p - y)$, $p(1 - p)$, $x$(또는 1)", "$\\frac{\\partial L}{\\partial w} = 2(p - y)\\,p(1 - p)\\,x$", "$\\frac{\\partial L}{\\partial b} = 2(p - y)\\,p(1 - p)$"],
    },
  ],
  references: [
    { title: "3Blue1Brown — Visualizing the chain rule and product rule", url: "https://www.3blue1brown.com/lessons/chain-rule-and-product-rule", note: "연쇄법칙과 곱의 미분 규칙 (영문)" },
    { title: "CS231n — Backpropagation, Intuitions", url: "https://cs231n.github.io/optimization-2/", note: "연쇄법칙으로 계산 그래프의 기울기를 구하는 방법 (영문)" },
  ],
});
