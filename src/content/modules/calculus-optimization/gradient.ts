import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/gradient";

export default defineLesson({
  id: "gradient",
  title: "편미분과 기울기",
  tier: "core",
  concepts: ["partial-derivatives-gradient"],
  goal: "다변수 함수의 편미분을 계산해 기울기 벡터를 만들고, 기울기가 함수가 가장 빠르게 증가하는 방향이며 등고선에 수직이라는 사실을 방향도함수로 설명하며, 파라미터와 같은 모양의 기울기를 수치미분으로 검산한다.",
  why: "모델의 파라미터는 수십 개에서 수천억 개이고, 학습은 손실을 모든 파라미터로 편미분한 기울기를 구해 그 반대 방향으로 파라미터를 옮기는 일이다([[lesson:gradient-descent]]). 딥러닝 프레임워크가 파라미터마다 저장하는 기울기도 파라미터와 모양이 같은 배열이다([[lesson:pytorch]]).",
  body: md`
### 편미분

변수가 여러 개인 함수에서 한 변수만 움직이고 나머지 변수는 상수로 고정한 채 미분한 것을 **편미분**이라고 하고, $\frac{\partial f}{\partial x}$처럼 $\partial$ 기호로 쓴다. $f(x, y) = x^2 + 3xy + 2y^2$이면

\`\`\`math
\frac{\partial f}{\partial x} = 2x + 3y, \qquad \frac{\partial f}{\partial y} = 3x + 4y
\`\`\`

이다. $\frac{\partial f}{\partial x}$를 구할 때는 $y$를 상수로 보므로 $3xy$의 미분은 $3y$이고 $2y^2$의 미분은 0이다. 점 $(1, 2)$에서는 $\frac{\partial f}{\partial x} = 8$, $\frac{\partial f}{\partial y} = 11$이다. $y = 2$로 고정하고 $x$만 $0.01$ 늘리면 $f$가 약 $0.08$ 늘어난다는 뜻이다.

### 기울기 벡터

모든 편미분을 모은 벡터를 **기울기**(gradient)라고 하고 $\nabla f$로 쓴다.

\`\`\`math
\nabla f(x, y) = \left[\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y}\right]
\`\`\`

위의 $f$는 점 $(1, 2)$에서 $\nabla f = [8, 11]$이다. 변수가 $n$개면 기울기는 길이 $n$인 벡터다. 파라미터가 행렬 $W$이면 손실의 기울기 $\frac{\partial L}{\partial W}$도 $W$와 모양이 같은 행렬이고, $(i, j)$ 원소는 $\frac{\partial L}{\partial W_{ij}}$다([[lesson:scalars-tensors]]).

### 기울기는 가장 빠르게 증가하는 방향이다

점 $p$에서 길이 1인 방향 $u$로 아주 조금($t$만큼) 움직이면 함수값은 약 $t\,(\nabla f(p) \cdot u)$만큼 바뀐다.

\`\`\`math
f(p + t\,u) \approx f(p) + t\,\nabla f(p) \cdot u
\`\`\`

$\nabla f \cdot u$를 $u$ 방향의 **방향도함수**라고 한다. 내적은 $\nabla f \cdot u = \lVert \nabla f \rVert \cos\theta$이므로([[lesson:dot-product]]), $u$와 $\nabla f$ 사이의 각 $\theta$에 따라 값이 정해진다.

- $u$가 $\nabla f$와 같은 방향($\theta = 0°$)이면 방향도함수가 가장 크고, 그 값은 $\lVert \nabla f \rVert$다. **기울기는 함수가 가장 빠르게 증가하는 방향이다.**
- $u$가 반대 방향($\theta = 180°$)이면 방향도함수가 가장 작다. **$-\nabla f$는 함수가 가장 빠르게 감소하는 방향**이고, 경사하강법이 $-\nabla L$ 방향으로 움직이는 이유다.
- $u$가 $\nabla f$에 수직($\theta = 90°$)이면 방향도함수가 0이다. 함수값이 같은 점을 이은 곡선을 **등고선**이라고 하는데, 등고선을 따라 움직이면 함수값이 변하지 않으므로 기울기는 등고선에 수직이다.

[[diagram:gradient-contours]]

### 손실함수의 기울기

데이터 한 개 $(x, y)$에 대한 모델 $\hat y = wx + b$의 제곱오차 $L(w, b) = (wx + b - y)^2$을 전개하면

\`\`\`math
L = w^2x^2 + b^2 + y^2 + 2wxb - 2wxy - 2by
\`\`\`

이고, $w$와 $b$로 각각 편미분하면 다음과 같다.

\`\`\`math
\frac{\partial L}{\partial w} = 2wx^2 + 2xb - 2xy = 2(wx + b - y)\,x, \qquad \frac{\partial L}{\partial b} = 2b + 2wx - 2y = 2(wx + b - y)
\`\`\`

$x = 2$, $y = 6$, $w = 1$, $b = 0$이면 예측 오차는 $wx + b - y = -4$이고 기울기는 $\nabla L = [-16, -8]$이다. 두 성분이 모두 음수이므로 $w$와 $b$를 모두 늘려야 손실이 줄어든다. 식을 전개하지 않고 이 결과를 바로 얻는 방법이 [[lesson:chain-rule]]이다.

데이터가 $n$개일 때 평균제곱오차 $\frac{1}{n}\sum_{i=1}^{n}(wx_i + b - y_i)^2$의 기울기는, 합의 미분이 미분의 합이므로 데이터마다 구한 기울기의 평균이다.

\`\`\`math
\frac{\partial L}{\partial w} = \frac{2}{n}\sum_{i=1}^{n}(\hat y_i - y_i)\,x_i, \qquad \frac{\partial L}{\partial b} = \frac{2}{n}\sum_{i=1}^{n}(\hat y_i - y_i)
\`\`\`

### 수치 기울기

변수를 하나씩 $\pm h$만큼 움직여 중심차분을 구하면 기울기 전체를 근사할 수 있다([[lesson:derivatives]]). 아래 함수는 파라미터 배열의 모양과 관계없이 원소마다 중심차분을 계산하므로, 결과도 파라미터와 모양이 같다.

\`\`\`python
import numpy as np

def numerical_gradient(f, p, h=1e-5):
    grad = np.zeros_like(p)
    for i in range(p.size):                      # 원소를 하나씩 움직인다
        step = np.zeros_like(p)
        step.flat[i] = h
        grad.flat[i] = (f(p + step) - f(p - step)) / (2 * h)
    return grad

f = lambda p: p[0] ** 2 + 3 * p[0] * p[1] + 2 * p[1] ** 2
print(np.round(numerical_gradient(f, np.array([1.0, 2.0])), 4))       # [ 8. 11.]: [2x + 3y, 3x + 4y]

x, y = 2.0, 6.0
loss = lambda q: (q[0] * x + q[1] - y) ** 2                            # q = [w, b]
print(np.round(numerical_gradient(loss, np.array([1.0, 0.0])), 4))    # [-16.  -8.]
\`\`\`

변수가 $n$개면 함수를 $2n$번 계산해야 하므로, 파라미터가 많은 모델의 학습에는 수치 기울기를 쓰지 않는다. 학습에서는 역전파로 기울기 전체를 한 번의 역방향 계산으로 구하고([[lesson:backprop]]), 수치 기울기는 그 결과를 검산하는 데 쓴다.

:::warn 흔한 실수
- **편미분할 때 다른 변수를 상수로 보지 않는다.** $\frac{\partial}{\partial x}(3xy) = 3y$이고, $\frac{\partial}{\partial x}(2y^2) = 0$이다.
- **기울기를 손실이 줄어드는 방향으로 생각한다.** $\nabla L$은 손실이 가장 빠르게 증가하는 방향이다. 손실을 줄이려면 $-\nabla L$ 방향으로 움직인다.
- **$-\nabla f$가 항상 최솟값을 가리킨다고 생각한다.** $-\nabla f$는 지금 위치에서 가장 빠르게 감소하는 방향일 뿐이다. 등고선이 길쭉한 타원이면 최솟값과 다른 방향을 가리킨다.
- **기울기의 모양을 파라미터와 다르게 만든다.** $W$의 모양이 $(3, 4)$이면 $\frac{\partial L}{\partial W}$의 모양도 $(3, 4)$다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$f(x, y) = x^2 y + 3y$에서 $\\frac{\\partial f}{\\partial x}$는?",
      choices: ["$2xy$", "$x^2 + 3$", "$2x$", "$2xy + 3$"],
      answer: 0,
      explanation: "$y$를 상수로 보면 $x^2 y$의 미분은 $2xy$이고, $x$가 없는 항 $3y$의 미분은 0이다. $x^2 + 3$은 $\\frac{\\partial f}{\\partial y}$다.",
    },
    {
      key: "c2",
      question: "$f(x, y) = x^2 y + 3y$의 점 $(1, 2)$에서의 기울기 $\\nabla f$는?",
      choices: ["$[4, 4]$", "$[2, 4]$", "$[4, 3]$", "$[4, 7]$"],
      answer: 0,
      explanation: "$\\nabla f = [2xy,\\ x^2 + 3]$이므로 $(1, 2)$에서 $[2 \\cdot 1 \\cdot 2,\\ 1 + 3] = [4, 4]$이다.",
    },
    {
      key: "c3",
      question: "점 $p$에서 함수 $f$가 가장 빠르게 감소하는 방향은?",
      choices: ["$-\\nabla f(p)$", "$\\nabla f(p)$", "$\\nabla f(p)$에 수직인 방향", "항상 원점을 향하는 방향"],
      answer: 0,
      explanation: "방향도함수 $\\nabla f \\cdot u = \\lVert \\nabla f \\rVert \\cos\\theta$는 $u$가 $\\nabla f$와 반대일 때($\\theta = 180°$) 가장 작다.",
    },
    {
      key: "c4",
      question: "가중치 행렬 $W$의 모양이 $(3, 4)$일 때 $\\frac{\\partial L}{\\partial W}$의 모양은?",
      choices: ["$(3, 4)$", "$(4, 3)$", "$(12,)$", "스칼라"],
      answer: 0,
      explanation: "기울기의 각 원소는 $W$의 원소 하나에 대한 편미분 $\\frac{\\partial L}{\\partial W_{ij}}$이므로 $W$와 모양이 같다.",
    },
    {
      key: "c5",
      question: "$L(w, b) = (wx + b - y)^2$에서 $x = 1$, $y = 3$, $w = 1$, $b = 0$일 때 $\\nabla L = [\\frac{\\partial L}{\\partial w}, \\frac{\\partial L}{\\partial b}]$는?",
      choices: ["$[-4, -4]$", "$[-2, -2]$", "$[4, 4]$", "$[-4, -2]$"],
      answer: 0,
      explanation: "오차 $wx + b - y = -2$이므로 $\\frac{\\partial L}{\\partial w} = 2 \\cdot (-2) \\cdot 1 = -4$, $\\frac{\\partial L}{\\partial b} = 2 \\cdot (-2) = -4$이다.",
    },
    {
      key: "c6",
      question: "기울기와 등고선의 관계로 옳은 것은?",
      choices: [
        "기울기는 등고선에 수직이다. 등고선을 따라 움직이면 함수값이 변하지 않기 때문이다",
        "기울기는 등고선과 나란하다",
        "등고선 간격이 넓을수록 기울기가 크다",
        "$-\\nabla f$는 언제나 최솟값을 정확히 가리킨다",
      ],
      answer: 0,
      explanation: "등고선 방향으로는 방향도함수가 0이고, 방향도함수가 0인 방향은 기울기에 수직이다. 등고선 간격이 좁을수록 함수가 빠르게 변하므로 기울기가 크다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
grad = np.array([3.0, 4.0])
for u in [np.array([0.6, 0.8]), np.array([0.8, -0.6]), np.array([-0.6, -0.8])]:
    print(round(float(grad @ u), 2))
`,
      expected: "5.0\n0.0\n-5.0",
      explanation: "세 벡터는 모두 길이가 1이다. $[0.6, 0.8]$은 기울기와 같은 방향이라 방향도함수가 $\\lVert \\nabla f \\rVert = 5$로 가장 크고, $[0.8, -0.6]$은 기울기에 수직이라 0, $[-0.6, -0.8]$은 반대 방향이라 $-5$로 가장 작다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "기울기 벡터가 함수가 가장 빠르게 증가하는 방향인 이유를 방향도함수 $\\nabla f \\cdot u$와 내적의 성질로 설명하고, 경사하강법이 $-\\nabla L$ 방향으로 움직이는 이유를 써라.",
      answer: md`
길이 1인 방향 $u$로 조금 움직일 때 함수값의 변화율은 방향도함수 $\nabla f \cdot u$이고, 내적의 성질에 의해 $\nabla f \cdot u = \lVert \nabla f \rVert \cos\theta$이다($\theta$는 $u$와 $\nabla f$ 사이의 각). $\cos\theta$는 $\theta = 0°$일 때 최댓값 1이므로, $u$가 $\nabla f$와 같은 방향일 때 함수가 가장 빠르게 증가하고 그 증가율은 $\lVert \nabla f \rVert$다.

반대로 $\theta = 180°$일 때 $\cos\theta = -1$로 가장 작으므로 $-\nabla f$ 방향이 가장 빠르게 감소하는 방향이다. 경사하강법은 손실을 줄이는 것이 목적이므로, 현재 위치에서 손실이 가장 빠르게 줄어드는 $-\nabla L$ 방향으로 파라미터를 옮긴다.
`,
      keyPoints: ["방향도함수 $\\nabla f \\cdot u = \\lVert \\nabla f \\rVert \\cos\\theta$", "$\\theta = 0°$일 때 최대: 기울기 방향이 가장 빠른 증가 방향", "$-\\nabla L$이 가장 빠른 감소 방향이라 경사하강법이 그 방향으로 움직인다"],
    },
  ],
  references: [
    { title: "Khan Academy — Derivatives of multivariable functions", url: "https://www.khanacademy.org/math/multivariable-calculus/multivariable-derivatives", note: "편미분, 기울기, 방향도함수 단원 (영문)" },
    { title: "Dive into Deep Learning — Calculus", url: "https://d2l.ai/chapter_preliminaries/calculus.html", note: "편미분과 기울기 (영문, 한국어판은 ko.d2l.ai)" },
  ],
});
