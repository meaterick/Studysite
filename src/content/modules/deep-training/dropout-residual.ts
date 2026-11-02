import { defineLesson, md } from "../../kit";
import exercises from "./labs/dropout-residual";

export default defineLesson({
  id: "dropout-residual",
  title: "드롭아웃과 잔차 연결",
  tier: "core",
  concepts: ["dropout-residual-transfer"],
  goal: "degradation 문제가 과적합이 아닌 최적화 문제인 이유를 설명하고, 잔차 연결 $y = F(x) + x$의 기울기 $F'(x) + 1$이 깊은 망의 학습을 돕는 원리를 숫자로 보일 수 있다.",
  why: "",
  body: md`
층을 단순히 깊게 쌓으면 신경망이 항상 더 똑똑해질 것 같지만 실제로는 그렇지 않다. 56층짜리 평범한(plain) 신경망이 20층짜리보다 오히려 학습 데이터에 대한 오차조차 더 높게 나오는 현상이 관찰됐는데, 이를 degradation(성능 저하) 문제라 부른다. 흥미로운 점은 이것이 과적합이 아니라는 것이다. 과적합이라면 학습 오차는 낮은데 검증 오차만 높아야 하는데, 여기서는 학습 오차 자체가 더 높다. 즉 층을 늘렸더니 모델이 오히려 학습 자체를 제대로 못 하게 된 것이다. 흔히 기울기 소실이 원인이라고 오해하지만, ResNet 논문(He et al., 2015)은 BatchNorm으로 순전파·역전파 신호가 건강하게 유지되는 상태에서도 이 현상이 나타난다는 점을 들어 **기울기 소실보다는 최적화의 어려움**(여러 비선형 층을 쌓은 망이 "적어도 얕은 망만큼" 하려면 추가된 층들이 항등함수를 근사해야 하는데, 경사하강법이 이를 쉽게 찾지 못한다는 것)으로 설명한다.

\`\`\`image
src: /images/week4/resnet-plain-vs-residual.png
alt: ImageNet에서 학습한 일반(plain) 18층·34층 망과 ResNet 18층·34층 망의 오차 곡선. 일반 망은 34층의 오차가 18층보다 높고, ResNet은 34층의 오차가 18층보다 낮다.
caption: 왼쪽: 잔차 연결이 없는 일반 망은 34층이 18층보다 오히려 오차가 높다(가는 선 = 학습 오차, 굵은 선 = 검증 오차). 학습 오차까지 높으므로 과적합이 아니라 최적화의 어려움(degradation)이다. 오른쪽: 같은 구조에 잔차 연결만 더한 ResNet은 34층이 18층보다 낮은 오차를 낸다. 곡선이 계단처럼 뚝 떨어지는 지점은 학습률을 1/10로 줄인 시점이다.
credit: He et al., "Deep Residual Learning for Image Recognition" (CVPR 2016), Figure 4, arXiv:1512.03385
width: 1200
height: 391
\`\`\`

[[diagram:resnet-skip]]

여기서 나온 해법이 잔차 연결(skip connection, residual connection)이다. 잔차 블록은 입력 $x$가 몇 개의 합성곱층으로 이루어진 함수 $F$를 통과한 결과 $F(x)$에, 원래 입력 $x$를 항등 사상(identity mapping)으로 그대로 더한 $y = F(x) + x$를 출력으로 내놓는다. 이 덧셈 경로(identity shortcut)는 학습되는 가중치가 전혀 없는 단순 덧셈이므로, 순전파 신호와 역전파 기울기가 F를 거치지 않고도 그대로 다음 층·이전 층으로 전달되는 경로를 하나 더 만들어준다. 그래서 한 블록이 배우는 것은 "전체 출력"이 아니라 "입력에서 얼마나 달라져야 하는가"라는 잔차(residual) F(x)뿐이다. 극단적으로 이 블록이 항등함수만 표현하면 충분한 경우에는 $F(x)=0$이 되도록 가중치를 학습하면 되므로(가중치를 0 근처로 보내기만 하면 되니 항등함수를 직접 배우는 것보다 훨씬 쉽다), 층을 아무리 깊게 쌓아도 최소한 더 얕은 모델과 동일한 함수는 표현할 수 있다는 것이 이론적으로 보장된다.

이것이 왜 기울기 관점에서도 유리한지는 미분해보면 바로 드러난다. 출력 $y = F(x) + x$를 $x$에 대해 미분하면 다음과 같다.

\`\`\`math
\dfrac{dy}{dx} = F'(x) + 1
\`\`\`

이 "+1" 항이 핵심이다. $F'(x)$가 아무리 작아지더라도 최소한 1만큼의 기울기는 identity shortcut을 타고 곧장 앞쪽 층까지 전달된다. 블록을 여러 개 쌓으면 전체 기울기는 각 블록의 $(1 + F'_i)$를 곱한 값이 되는데, 잔차 연결이 없을 때의 $\prod F'_i$와 달리 각 항이 1 근처에 머물 수 있어 층이 깊어져도 기울기가 지수적으로 사라지지 않는다. 이후 거의 모든 현대 아키텍처(5주차에 배울 Transformer 포함)가 이 skip connection을 기본 구성 요소로 채택하고 있다. 여러 층의 야코비안이 곱해지는 관점에서 본 더 엄밀한 분석은 3주차 심화 「기울기 흐름의 수학」 단계에 있다.

말로만 하면 추상적이니, $F'(x)$가 실제로 아주 작은 값이 되는 상황을 하나 만들어 $dy/dx$가 정말로 1 근처에 머무는지 숫자로 확인해보자. 3주차의 수치미분 $\frac{dy}{dx} \approx \frac{y(x+h) - y(x-h)}{2h}$을 그대로 쓴다.

\`\`\`python
# F(x)를 아주 작은 기울기를 갖는 함수로 두어, 층이 깊어져 기울기가 옅어진 상황을 재현한다.
def F(x):
    return 0.001 * x**3

def F_prime(x):          # F를 손으로 미분한 식: d/dx(0.001*x^3) = 0.003*x^2
    return 0.003 * x**2

def y_residual(x):       # 잔차 연결: y = F(x) + x
    return F(x) + x

def numerical_derivative(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)   # x 좌우로 아주 조금씩 움직여 기울기를 근사

for x in [0.0, 1.0, 2.0, 5.0]:
    dydx_numeric = numerical_derivative(y_residual, x)
    dydx_formula = F_prime(x) + 1            # 손으로 미분한 dy/dx = F'(x) + 1
    print(f"x={x}: F'(x)={F_prime(x):.6f}, 수치미분={dydx_numeric:.6f}, "
          f"공식 F'(x)+1={dydx_formula:.6f}")
\`\`\`

$x=5$에서도 \`F_prime(x)\`는 $0.075$ 밖에 안 될 만큼 작지만, \`dydx_numeric\`과 \`dydx_formula\`는 둘 다 $1.075$로 정확히 일치하며 항상 1보다 크다. $F$ 경로의 기울기가 거의 0이어도 identity shortcut이 더해주는 "+1" 덕분에 전체 기울기가 1 근처에 머문다는 것을 실제로 찍힌 숫자로 확인한 셈이다.

### 블록 50개를 거친 기울기, 그리고 모양이 바뀔 때

블록마다 기울기에 곱해지는 값을 생각하면 차이가 극적이다. 잔차 연결이 없고 각 블록의 국소 미분이 0.5라면 50개를 거친 기울기는 $0.5^{50} \approx 8.9 \times 10^{-16}$으로 사실상 0이다. 잔차 연결이 있으면 각 블록이 $1 + F'$을 곱하므로, $F' = 0.01$처럼 작아도 $1.01^{50} \approx 1.64$로 오히려 살아 있다. 앞쪽 층까지 학습 신호가 도착하는 이유가 이 곱셈에 있다.

[[diagram:residual-gradient-product]]

실제 구현에서 한 가지 걸리는 점이 있다. $y = F(x) + x$의 덧셈은 $F(x)$와 $x$의 shape이 같아야 한다. 그런데 ResNet은 단계가 바뀔 때 해상도를 절반으로 줄이고(stride 2) 채널을 두 배로 늘린다. 이 블록에서는 $x$를 그대로 더할 수 없으므로, 지름길에 **$1 \times 1$ 합성곱(stride 2)**을 넣어 $x$의 채널 수와 해상도를 $F(x)$에 맞춘 뒤 더한다(projection shortcut). $1 \times 1$ 합성곱은 공간 패턴은 보지 않고 각 위치에서 채널만 섞는, 채널 수를 바꾸는 가장 값싼 도구다.

[[diagram:projection-shortcut]]
`,
  checks: [
    {
      key: "c1",
      question: "56층 plain 네트워크가 20층보다 **훈련** 오차도 높다는 사실이 의미하는 것은?",
      choices: ["과적합이다", "데이터가 너무 많다", "일반화 실패가 아니라 최적화(학습) 자체가 어려워졌다", "테스트셋에 누수가 있다"],
      answer: 2,
      explanation: "과적합이라면 훈련 오차는 낮고 검증 오차만 높아야 한다. 훈련 오차까지 높다는 것은 깊은 망이 얕은 망만큼의 해조차 찾지 못한다는 뜻이다.",
    },
    {
      key: "c2",
      question: "잔차 블록이 항등함수를 표현하기 쉬운 이유는?",
      choices: ["항등함수를 따로 학습하는 층이 있어서", "$F(x) = 0$이 되도록 가중치를 0 근처로 보내기만 하면 $y = x$가 되므로", "활성화 함수를 쓰지 않아서", "항상 BatchNorm을 쓰기 때문에"],
      answer: 1,
      explanation: "여러 비선형 층으로 항등함수를 직접 근사하는 것보다, 잔차 $F$를 0으로 만드는 편이 최적화하기 훨씬 쉽다.",
    },
    {
      key: "c3",
      question: "잔차 연결 $y = F(x) + x$에서 $dy/dx$는?",
      choices: ["$F'(x)$", "$F'(x) + 1$", "$F'(x) \\cdot x$", "$1$"],
      answer: 1,
      explanation: "shortcut 경로가 항상 1을 더해주므로 $F'$가 작아도 기울기가 1 근처로 전달된다.",
    },
    {
      key: "c4",
      question: "잔차 연결 없이 블록마다 기울기가 0.5배가 되는 망과, 잔차 연결로 블록마다 $1.01$배가 되는 망에서 50블록을 거친 기울기는 각각 대략?",
      choices: ["$10^{-15}$ 수준 / 약 1.6배", "둘 다 약 1", "약 25 / 약 50", "둘 다 0"],
      answer: 0,
      explanation: "$0.5^{50} \\approx 8.9 \\times 10^{-16}$이고 $1.01^{50} \\approx 1.64$다. 곱셈이 50번 반복되면 1보다 조금만 작아도 사라지고, 1 근처면 유지된다.",
    },
    {
      key: "c5",
      question: "해상도를 절반으로 줄이고 채널을 두 배로 늘리는 잔차 블록에서 지름길(shortcut)에 $1 \\times 1$ 합성곱(stride 2)을 넣는 이유는?",
      choices: ["$x$의 채널 수와 해상도를 $F(x)$와 같게 맞춰야 덧셈을 할 수 있어서", "수용영역을 넓히려고", "비선형성을 추가하려고", "파라미터를 0으로 만들려고"],
      answer: 0,
      explanation: "$F(x) + x$는 원소별 덧셈이라 shape이 같아야 한다. $1 \\times 1$ 합성곱은 채널 수를, stride 2는 해상도를 맞춘다.",
    },
    {
      key: "c6",
      question: "잔차 연결 없는 50층에서 층마다 기울기가 평균 0.6배씩 곱해진다면, 입력 쪽에 도착하는 기울기는 대략 원래의 몇 배인가?",
      choices: ["약 $10^{-11}$배", "약 0.03배", "약 0.6배", "약 30배"],
      answer: 0,
      explanation: "$0.6^{50} = e^{50 \\ln 0.6} \\approx e^{-25.5} \\approx 8 \\times 10^{-12}$입니다. 잔차 연결이 있으면 국소 기울기가 $F' + 1$이라 1 근처에 머물러 50층을 지나도 같은 자릿수가 유지됩니다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "\"56층 plain 네트워크가 20층보다 학습 오차도 높다\"는 degradation 문제는 왜 단순한 과적합으로 설명할 수 없는가?",
      answer: md`
학습 오차 자체가 더 높다는 것은 모델이 훈련 데이터조차 제대로 못 외운다는 뜻인데, 과적합이라면 반대로 훈련 오차는 낮고 검증 오차만 높아야 한다. 즉 일반화 실패가 아니라 최적화(학습) 자체의 실패다. ResNet 논문은 BatchNorm으로 신호가 건강하게 유지되는 상태에서도 이 현상이 나타난다는 점을 들어, 단순한 기울기 소실보다는 깊은 비선형 층들이 항등함수조차 근사하기 어려운 최적화의 어려움으로 설명한다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "잔차 블록의 역전파에서 \"+1\" 항의 의미는?",
      answer: md`
$dy/dx = F'(x) + 1$에서 +1은 shortcut 경로가 $F$와 무관하게 기울기를 그대로 전달한다는 뜻이다. 그래서 $F'$가 작아도 기울기가 1 근처로 앞쪽 층까지 전달되어, 층을 깊게 쌓아도 기울기가 지수적으로 사라지지 않는다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "He et al. (2015) — Deep Residual Learning for Image Recognition", url: "https://arxiv.org/abs/1512.03385", note: "1~3절 정독 권장: Figure 1(degradation)과 4.1절의 '기울기 소실이 원인이 아닐 가능성' 논의" },
    { title: "d2l.ai — Residual Networks (ResNet)", url: "https://d2l.ai/chapter_convolutional-modern/resnet.html", note: "잔차 블록과 ResNet 구현" },
  ],
});
