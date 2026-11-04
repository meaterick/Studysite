import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/functions-composition";

export default defineLesson({
  id: "functions-composition",
  title: "함수, 정의역·치역, 함수의 합성",
  tier: "core",
  concepts: ["functions-composition"],
  goal: "함수를 입력과 출력의 대응으로 정의하고 정의역·공역·치역을 구분하며, 합성함수 $g \\circ f$를 계산하고 여러 층으로 된 모델을 합성으로 나타낸다.",
  why: "머신러닝 모델은 입력을 출력으로 보내는 함수이고, 신경망은 층을 차례로 합성한 함수다([[lesson:perceptron-mlp]]). 모델을 합성으로 보아야 연쇄법칙으로 기울기를 계산하는 원리([[lesson:chain-rule]])를 따라갈 수 있다.",
  body: md`
### 함수의 정의

**함수(function)** $f$는 집합 $X$의 각 원소 $x$에 집합 $Y$의 원소 **하나**를 대응시키는 규칙이다. $f: X \to Y$로 쓰고, $x$에 대응하는 값을 $f(x)$라고 한다.

- **정의역(domain)** $X$: 입력으로 쓸 수 있는 값 전체
- **공역(codomain)** $Y$: 출력이 속하는 집합으로 정한 것
- **치역(range)**: 실제로 나오는 출력 값 전체. 공역의 부분집합이다

$f(x) = x^2$를 실수 전체에서 정의하면 정의역은 실수 전체 $\mathbb{R}$, 치역은 $[0, \infty)$다. 입력 하나에 출력이 하나여야 하므로 "4에 2와 −2를 대응시키는 규칙"은 함수가 아니다. 반대로 서로 다른 입력이 같은 출력을 가지는 것(\`f(2) = f(-2) = 4\`)은 허용된다.

파이썬 함수 중 같은 입력에 항상 같은 값을 돌려주고 바깥 상태를 바꾸지 않는 것은 수학의 함수와 같다([[lesson:functions-scope]]). 파이썬 함수가 어떤 입력에서 오류를 내는 것은 그 입력이 정의역 밖이라는 뜻이다.

### 자주 쓰는 함수의 정의역과 치역

| 함수 | 식 | 정의역 | 치역 | 쓰이는 곳 |
| --- | --- | --- | --- | --- |
| 제곱근 | $\sqrt{x}$ | $x \ge 0$ | $[0, \infty)$ | 표준편차, 벡터의 길이 |
| 로그 | $\ln x$ | $x > 0$ | $\mathbb{R}$ | 로그 손실, 로그 확률 |
| 역수 | $1/x$ | $x \ne 0$ | $y \ne 0$ | 정규화(나누기) |
| 시그모이드 | $\sigma(z) = \frac{1}{1 + e^{-z}}$ | $\mathbb{R}$ | $(0, 1)$ | 확률 출력 |
| ReLU | $\max(0, z)$ | $\mathbb{R}$ | $[0, \infty)$ | 신경망의 활성화 함수 |

정의역 밖의 값을 넣으면 코드에서 오류가 나거나 특수한 값이 나온다. \`math.log(0)\`과 \`math.sqrt(-1)\`은 \`ValueError\`를 내고, NumPy는 경고와 함께 \`-inf\`나 \`nan\`(숫자가 아님)을 돌려준다. 손실 계산에서 \`nan\`이 나오면 대개 정의역 밖의 값(로그에 0이 들어감 등)이 원인이다.

\`\`\`python
import math
import numpy as np

print(math.sqrt(16), math.log(1))
for bad in (lambda: math.log(0), lambda: math.sqrt(-1)):
    try:
        bad()
    except ValueError as e:
        print("ValueError:", e)
with np.errstate(divide="ignore", invalid="ignore"):   # 경고 출력을 끈다
    print(np.log(np.array([1.0, 0.0, -1.0])))           # [0, -inf, nan]
\`\`\`

### 함수의 그래프

함수 $f$의 그래프는 점 $(x, f(x))$를 모두 모은 것이다. 코드로는 정의역에서 $x$를 촘촘히 골라 $f(x)$를 계산하고 점을 이어 그린다.

\`\`\`python
import matplotlib.pyplot as plt

x = np.linspace(-6, 6, 200)                  # -6부터 6까지 200개의 점
fig, axes = plt.subplots(1, 3, figsize=(9, 2.6))
for ax, (name, y) in zip(axes, [("x^2", x ** 2), ("sigmoid", 1 / (1 + np.exp(-x))), ("ReLU", np.maximum(0, x))]):
    ax.plot(x, y)
    ax.set_title(name)
    ax.axhline(0, color="gray", linewidth=0.5)
plt.tight_layout()
plt.show()
\`\`\`

시그모이드의 그래프는 0과 1 사이에만 있고(치역 $(0, 1)$), ReLU는 음수 입력을 모두 0으로 보낸다.

### 합성함수

두 함수 $f$와 $g$에 대해, $f$의 출력을 $g$의 입력으로 넣은 함수를 **합성함수**라고 하고 $g \circ f$로 쓴다.

\`\`\`math
(g \circ f)(x) = g\big(f(x)\big)
\`\`\`

$f$가 먼저, $g$가 나중에 적용된다. 표기는 오른쪽 함수부터 읽는다. **합성은 순서가 중요하다.** $f(x) = x + 1$, $g(x) = 2x$이면 $(g \circ f)(3) = g(4) = 8$이고 $(f \circ g)(3) = f(6) = 7$이다.

합성함수의 정의역은 "$f(x)$가 $g$의 정의역에 들어가는 $x$"다. $g(u) = \ln u$, $f(x) = x - 1$이면 $(g \circ f)(x) = \ln(x - 1)$은 $x - 1 > 0$, 즉 $x > 1$에서만 정의된다.

\`\`\`python
def compose(g, f):
    """g ∘ f: 먼저 f, 그다음 g"""
    return lambda x: g(f(x))

f = lambda x: x + 1
g = lambda x: 2 * x
print(compose(g, f)(3), compose(f, g)(3))   # 8 7
\`\`\`

### 모델은 함수의 합성이다

입력 $x$에서 출력 $\hat y$를 계산하는 모델은 간단한 함수 여러 개를 차례로 합성한 것이다. 예를 들어 은닉층 하나짜리 신경망은 다음과 같다.

\`\`\`math
\hat y = f_3\big(f_2(f_1(x))\big), \quad f_1(x) = w_1 x + b_1, \quad f_2(z) = \max(0, z), \quad f_3(h) = w_2 h + b_2
\`\`\`

각 층은 입력을 받아 출력을 내는 함수이고, 층을 쌓는다는 것은 함수를 하나 더 합성한다는 뜻이다. 층이 수십 개인 모델도 구조는 같다. 학습할 때는 이 합성함수의 출력에 대한 손실을 각 층의 파라미터로 미분해야 하는데, 합성함수의 미분 규칙이 연쇄법칙이다([[lesson:chain-rule]]).

\`\`\`python
w1, b1, w2, b2 = 2.0, -1.0, 3.0, 0.5
layer1 = lambda x: w1 * x + b1
relu = lambda z: max(0.0, z)
layer2 = lambda h: w2 * h + b2
model = compose(layer2, compose(relu, layer1))   # layer2 ∘ relu ∘ layer1
for x in (0.25, 1.0, 2.0):
    print(x, model(x))       # 0.25 → relu(-0.5) = 0 → 0.5
\`\`\`

### 역함수

$f$가 서로 다른 입력을 항상 서로 다른 출력으로 보낸다면, 출력에서 입력을 되찾는 **역함수** $f^{-1}$가 있다. $f^{-1}(f(x)) = x$다. 지수함수 $e^x$와 로그함수 $\ln x$는 서로의 역함수다([[lesson:elementary-functions]]). 데이터 처리에서는 표준화 $z = (x - \mu)/\sigma$와 그 역함수 $x = \sigma z + \mu$를 쓴다. 표준화한 값으로 학습한 모델의 예측을 원래 단위로 되돌릴 때 역함수를 적용한다.

:::warn 흔한 실수
- **합성의 순서를 거꾸로 읽는다.** $g \circ f$는 $f$를 먼저 적용한다.
- **합성함수의 정의역을 확인하지 않는다.** $\ln(x - 1)$은 $x \le 1$에서 정의되지 않는다.
- **공역과 치역을 같은 것으로 본다.** $x^2$의 공역을 실수 전체로 정해도 치역은 $[0, \infty)$다.
- **손실의 \`nan\`을 무시한다.** 로그나 나눗셈에 정의역 밖의 값이 들어간 신호다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$f(x) = x^2$, $g(x) = x + 3$일 때 $(g \\circ f)(2)$와 $(f \\circ g)(2)$는?",
      choices: ["7과 25", "25와 7", "7과 7", "10과 25"],
      answer: 0,
      explanation: "$(g \\circ f)(2) = g(f(2)) = g(4) = 7$이고, $(f \\circ g)(2) = f(g(2)) = f(5) = 25$다. 합성은 순서에 따라 결과가 다르다.",
    },
    {
      key: "c2",
      question: "$h(x) = \\ln(x - 1)$의 정의역은?",
      choices: ["모든 실수", "$x > 0$", "$x > 1$", "$x \\ge 1$"],
      answer: 2,
      explanation: "로그는 양수에서만 정의되므로 $x - 1 > 0$, 즉 $x > 1$이다. $x = 1$이면 $\\ln 0$이 되어 정의되지 않는다.",
    },
    {
      key: "c3",
      question: "시그모이드 함수 $\\sigma(z) = \\frac{1}{1 + e^{-z}}$의 치역은?",
      choices: ["$\\mathbb{R}$", "$[0, 1]$", "$(0, 1)$", "$[0, \\infty)$"],
      answer: 2,
      explanation: "$e^{-z}$는 항상 양수라 분모는 1보다 크고, 출력은 0보다 크고 1보다 작다. 0과 1에 한없이 가까워지지만 같아지지는 않는다. 그래서 확률로 해석하는 출력에 쓴다.",
    },
    {
      key: "c4",
      question: "다음 중 함수가 **아닌** 대응은?",
      choices: [
        "학생마다 학번 하나를 대응시키는 규칙",
        "실수 $x$에 $x^2$을 대응시키는 규칙",
        "양수 4에 4의 제곱근 2와 −2를 모두 대응시키는 규칙",
        "모든 입력에 0을 대응시키는 규칙",
      ],
      answer: 2,
      explanation: "함수는 입력 하나에 출력 하나를 대응시킨다. 4에 두 값을 대응시키면 함수가 아니다. 모든 입력이 같은 출력을 가지는 상수함수는 함수다.",
    },
    {
      key: "c5",
      question: "$\\hat y = g(f(x))$, $f(x) = 2x - 1$, $g(z) = \\max(0, z)$일 때 $x = 0.25$에서의 $\\hat y$는?",
      choices: ["0", "−0.5", "0.5", "1"],
      answer: 0,
      explanation: "먼저 $f(0.25) = 2 \\times 0.25 - 1 = -0.5$이고, ReLU는 음수를 0으로 보내므로 $g(-0.5) = 0$이다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
def f(x): return x + 1
def g(x): return 2 * x
h1 = lambda x: g(f(x))
h2 = lambda x: f(g(x))
print(h1(3), h2(3), h1(-1))
`,
      expected: "8 7 0",
      explanation: "`h1`은 $g \\circ f$라 $2(3 + 1) = 8$이고, `h2`는 $f \\circ g$라 $2 \\times 3 + 1 = 7$이다. `h1(-1)`은 $2(-1 + 1) = 0$이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "합성함수에서 순서가 중요한 이유를 예로 보이고, 신경망에서 층을 쌓는 것이 함수의 합성이라는 말의 뜻을 설명하라.",
      answer: md`
$g \circ f$는 $f$의 출력을 $g$에 넣으므로 순서를 바꾸면 계산 자체가 달라진다. $f(x) = x + 1$, $g(x) = 2x$이면 $(g \circ f)(3) = 8$이지만 $(f \circ g)(3) = 7$이다. 신경망의 각 층은 입력 벡터를 받아 새 벡터를 내는 함수(선형 변환, 활성화 함수 등)이고, 층을 쌓으면 앞 층의 출력이 다음 층의 입력이 되므로 전체 모델은 $f_L \circ \cdots \circ f_2 \circ f_1$이라는 합성함수가 된다. 그래서 층의 순서를 바꾸면 다른 모델이 되고, 학습에 필요한 미분은 합성함수의 미분 규칙(연쇄법칙)으로 구한다.
`,
      keyPoints: ["$g \\circ f$는 $f$를 먼저 적용하며, 순서를 바꾸면 결과가 달라지는 예", "각 층은 입력을 출력으로 보내는 함수", "모델 전체는 층들의 합성함수이고, 그 미분이 연쇄법칙"],
    },
  ],
  references: [
    { title: "Khan Academy — 함수 (한국어)", url: "https://ko.khanacademy.org/math/algebra/x2f8bb11595b61c86:functions", note: "함수, 정의역과 치역의 기초" },
    { title: "3Blue1Brown — But what is a neural network?", url: "https://www.3blue1brown.com/lessons/neural-networks", note: "층을 차례로 적용하는 함수로서의 신경망 (영문)" },
  ],
});
