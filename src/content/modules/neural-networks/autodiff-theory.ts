import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/autodiff-theory";

export default defineLesson({
  id: "autodiff-theory",
  title: "자동미분의 두 모드와 메모리",
  tier: "advanced",
  goal: "야코비안-벡터 곱(JVP)과 벡터-야코비안 곱(VJP)으로 순방향·역방향 자동미분의 비용을 비교하고, 이원수로 순방향 모드를 구현하며, 그레이디언트 체크포인팅의 메모리·계산 거래를 설명할 수 있다.",
  why: "",
  body: md`
핵심 과정에서 만든 micrograd와 PyTorch의 autograd는 **역방향 모드(reverse mode)** 자동미분이다. 자동미분에는 반대 방향의 **순방향 모드(forward mode)**도 있고, 어느 쪽이 유리한지는 입력과 출력의 개수가 정한다. 이 단계는 두 모드를 야코비안(Jacobian)의 언어로 정리하고, 역방향 모드가 왜 딥러닝의 표준이 되었는지, 그 대가인 메모리 문제를 어떻게 다루는지 살펴본다.

### 야코비안, JVP, VJP

함수 $f: \mathbb{R}^n \to \mathbb{R}^m$의 야코비안 $J$는 $J_{ij} = \partial f_i / \partial x_j$인 $m \times n$ 행렬이다. 층을 여러 개 합성한 $f = f_L \circ \cdots \circ f_1$의 야코비안은 연쇄법칙에 의해 각 층 야코비안의 곱 $J = J_L \cdots J_1$이다. 이 곱을 통째로 만들 필요는 없고, 벡터와 곱한 결과만 있으면 된다.

- **순방향 모드**는 입력 쪽 방향 벡터 $v$에서 출발해 $J v = J_L(\cdots(J_1 v))$를 오른쪽부터 계산한다(야코비안-벡터 곱, JVP). 순전파와 같은 방향으로 한 번 지나가면 "입력을 $v$ 방향으로 살짝 움직였을 때 모든 출력이 얼마나 변하는가"를 얻는다. 기울기 전체를 얻으려면 입력 차원마다 한 번씩, 즉 **$n$번** 지나가야 한다.
- **역방향 모드**는 출력 쪽 벡터 $u$에서 출발해 $u^\top J = ((u^\top J_L)\cdots)J_1$을 왼쪽부터 계산한다(벡터-야코비안 곱, VJP). 출력 차원마다 한 번, 즉 **$m$번** 지나가면 된다.

신경망의 손실은 스칼라($m = 1$)이고 파라미터는 수백만 개($n$이 거대)다. 역방향 모드는 한 번으로 모든 기울기를 얻고, 순방향 모드는 파라미터 수만큼 반복해야 한다. 역방향 한 번의 비용은 순전파의 작은 상수배(보통 2~3배)라는 것이 알려져 있다("값싼 기울기 원리"). 반대로 입력이 하나이고 출력이 많은 문제(예: 시간 하나에 대한 여러 물리량의 민감도)라면 순방향 모드가 유리하다.

[[diagram:forward-reverse-mode]]

순방향 모드는 **이원수(dual number)**로 아주 우아하게 구현된다. $\varepsilon^2 = 0$인 기호 $\varepsilon$을 도입해 $a + b\varepsilon$ 꼴의 수를 계산하면, 테일러 전개의 2차 이상 항이 모두 사라져 $f(a + \varepsilon) = f(a) + f'(a)\,\varepsilon$이 된다. 값과 미분을 한 쌍으로 함께 계산하며 연산마다 곱의 미분법·연쇄법칙을 적용할 뿐이고, 수치미분과 달리 근사 오차가 없다.

덧셈과 곱셈만 정의한 이원수 클래스로 $f(x) = x^3 + 3x$의 미분을 구해 보자. 곱셈 규칙 $(a + b\varepsilon)(c + d\varepsilon) = ac + (ad + bc)\varepsilon$이 곧 곱의 미분법이다.

\`\`\`python
class Dual:
    """a + b·ε (ε² = 0). a는 값, b는 미분값을 들고 다닌다."""
    def __init__(self, a, b=0.0):
        self.a, self.b = a, b
    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.a + o.a, self.b + o.b)
    __radd__ = __add__
    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.a * o.a, self.a * o.b + self.b * o.a)   # (a+bε)(c+dε) = ac + (ad+bc)ε
    __rmul__ = __mul__

def f(x):
    return x * x * x + 3 * x       # f(x) = x³ + 3x, f'(x) = 3x² + 3

x = Dual(2.0, 1.0)                 # x = 2에서, 방향 1로 미분
y = f(x)
print("f(2) =", y.a, " f'(2) =", y.b)   # 14, 15
\`\`\`

$f(2) = 14$와 함께 $f'(2) = 3 \cdot 4 + 3 = 15$가 **한 번의 계산으로, 정확히** 나온다. micrograd처럼 그래프를 저장하지도, 거꾸로 거슬러 가지도 않는다. 대신 입력이 $n$개면 방향마다 한 번씩 $n$번 계산해야 한다.

[[diagram:dual-number-trace]]

### 메모리라는 대가와 그레이디언트 체크포인팅

역방향 모드는 거꾸로 거슬러 올라가며 각 층의 국소 미분을 계산하므로, 순전파 때 계산한 중간 활성화를 **모두 저장**해 두어야 한다(micrograd의 각 \`Value\`가 \`data\`를 들고 있는 이유). 층이 $L$개면 메모리가 $L$에 비례하고, 큰 모델 학습에서 GPU 메모리를 가장 많이 차지하는 것이 파라미터가 아니라 이 활성화인 경우가 많다.

**그레이디언트 체크포인팅(gradient checkpointing)**은 계산으로 메모리를 산다. 활성화를 $k$층마다 하나씩만 저장하고, 역전파 중 어떤 구간이 필요해지면 가장 가까운 체크포인트에서 그 구간만 순전파를 다시 계산한다. 메모리는 "체크포인트 $L/k$개 + 다시 계산하는 구간 $k$개"이므로 $k = \sqrt{L}$로 잡으면 $O(\sqrt{L})$로 줄고, 대가는 순전파를 대략 한 번 더 하는 것이다(Chen et al., 2016). 거대 언어 모델 학습에서 표준으로 쓰는 기법이다.

[[diagram:checkpoint-memory]]
`,
  checks: [
    {
      key: "c1",
      question: "파라미터 100만 개, 출력(손실) 1개인 신경망의 기울기 전체를 구할 때 각 모드가 지나가야 하는 횟수는?",
      choices: ["순방향 100만 번, 역방향 1번", "순방향 1번, 역방향 100만 번", "둘 다 1번", "둘 다 100만 번"],
      answer: 0,
      explanation: "순방향 모드(JVP)는 입력 방향마다 한 번, 역방향 모드(VJP)는 출력마다 한 번 지나간다. 손실이 스칼라라서 역방향이 압도적으로 유리하다.",
    },
    {
      key: "c2",
      question: "이원수 $a + b\\varepsilon$($\\varepsilon^2 = 0$)으로 $f(x) = x^2$을 $x = 3$에서 계산하면 $(3 + \\varepsilon)^2$의 $\\varepsilon$ 계수는?",
      choices: ["6", "9", "3", "1"],
      answer: 0,
      explanation: "$(3+\\varepsilon)^2 = 9 + 6\\varepsilon + \\varepsilon^2 = 9 + 6\\varepsilon$. $\\varepsilon$ 계수가 $f'(3) = 6$이다. 근사가 아닌 정확한 미분이다.",
    },
    {
      key: "c3",
      question: "층 400개인 망에서 그레이디언트 체크포인팅을 20층 간격으로 하면 얻는 것과 잃는 것은?",
      choices: ["저장할 활성화가 약 400개에서 40개 수준으로 줄고, 순전파를 대략 한 번 더 계산한다", "메모리와 계산이 모두 준다", "기울기가 근삿값이 된다", "메모리는 같고 계산만 준다"],
      answer: 0,
      explanation: "체크포인트 $L/k$개와 다시 계산하는 구간 $k$개만 메모리에 두므로 $k = \\sqrt{L}$에서 $O(\\sqrt{L})$이다. 대가는 구간마다 순전파를 다시 하는 계산이고, 기울기는 정확히 같다.",
    },
    {
      key: "c4",
      question: "이원수로 $f(x) = 2x^2$을 $x = 1$에서 계산할 때, $x = 1 + \\varepsilon$을 넣은 결과는?",
      choices: ["$2 + 4\\varepsilon$", "$2 + 2\\varepsilon$", "$4 + 2\\varepsilon$", "$2 + \\varepsilon$"],
      answer: 0,
      explanation: "$2(1 + \\varepsilon)^2 = 2(1 + 2\\varepsilon + \\varepsilon^2) = 2 + 4\\varepsilon$($\\varepsilon^2 = 0$). 값 2와 미분 $f'(1) = 4$를 함께 얻는다.",
    },
    {
      key: "c5",
      question: "입력 1개, 출력 1,000개인 함수의 모든 출력에 대한 미분을 구할 때 유리한 자동미분 모드는?",
      choices: ["순방향 모드(1번이면 된다)", "역방향 모드(1번이면 된다)", "둘 다 1,000번 필요하다", "수치미분만 가능하다"],
      answer: 0,
      explanation: "순방향은 입력 차원만큼, 역방향은 출력 차원만큼 지나간다. 입력이 1개면 순방향 한 번으로 출력 1,000개의 미분을 모두 얻는다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
class Dual:
    def __init__(self, val, dot):
        self.val, self.dot = val, dot
    def __mul__(self, o):
        return Dual(self.val * o.val, self.dot * o.val + self.val * o.dot)
x = Dual(3.0, 1.0)
y = x * x * x
print(y.val, y.dot)
`,
      expected: "27.0 27.0",
      explanation: "$x = 3 + \\varepsilon$를 세제곱하면 $27 + 27\\varepsilon$입니다($\\varepsilon^2 = 0$). 값 $3^3 = 27$과 미분 $3x^2 = 27$이 함께 나옵니다. 곱 하나마다 곱의 미분법을 적용하는 것이 순방향 모드 자동미분의 전부입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "함수 $f: \\mathbb{R}^n \\to \\mathbb{R}^m$의 기울기(야코비안)를 구할 때 순방향 모드와 역방향 모드는 각각 몇 번 지나가야 하는가? 신경망 학습에 역방향 모드가 쓰이는 이유와 그 대가(메모리), 그레이디언트 체크포인팅의 원리를 설명하라.",
      answer: md`
순방향 모드는 입력 쪽 방향 벡터 $v$에서 출발해 야코비안-벡터 곱 $Jv$를 계산하므로 기울기 전체를 얻으려면 입력 차원 수 $n$번, 역방향 모드는 출력 쪽 벡터에서 출발해 벡터-야코비안 곱 $u^\top J$를 계산하므로 출력 수 $m$번 지나가야 한다. 신경망은 파라미터가 수백만 개이고 손실은 스칼라 하나이므로, 역방향 모드 한 번(순전파의 작은 상수배 비용)으로 모든 기울기를 얻는다. 대가는 역방향으로 거슬러 가며 국소 미분을 계산하려면 순전파의 중간 활성화를 모두 저장해야 해서 메모리가 층 수에 비례한다는 것이다. 그레이디언트 체크포인팅은 $k$층마다 하나씩만 저장하고 필요할 때 그 구간의 순전파를 다시 계산해, $k=\sqrt{L}$이면 메모리를 $O(\sqrt{L})$로 줄이는 대신 순전파를 대략 한 번 더 한다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Baydin et al. (2018) — Automatic Differentiation in Machine Learning: a Survey", url: "https://jmlr.org/papers/v18/17-468.html", note: "순방향·역방향 모드의 표준 정리 (영문)" },
    { title: "Chen et al. (2016) — Training Deep Nets with Sublinear Memory Cost", url: "https://arxiv.org/abs/1604.06174", note: "그레이디언트 체크포인팅 (영문, 연구 논문)" },
  ],
});
