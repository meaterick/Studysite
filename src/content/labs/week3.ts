import type { WeekLab } from "../types";
import { py } from "./util";

// 3주차 코딩 실습
//   핵심: 뉴런·MLP 순전파, 손 역전파, 자동미분용 파이썬 문법, micrograd backward, 최적화기, 초기화, 2층 신경망 역전파
//   보충: BatchNorm·LayerNorm, 역드롭아웃·학습률 스케줄·조기 종료
//   심화: 이원수 순방향 모드와 JVP·VJP, AdamW, 기울기 흐름·클리핑
const VALUE_BASE = py`
import math

class Value:
    def __init__(self, data, _children=(), _op=""):
        self.data, self.grad = data, 0.0
        self._prev, self._backward = set(_children), lambda: None
        self._op = _op

    def __add__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data + o.data, (self, o), "+")
        def _backward():
            self.grad += out.grad
            o.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data * o.data, (self, o), "*")
        def _backward():
            self.grad += o.data * out.grad
            o.grad += self.data * out.grad
        out._backward = _backward
        return out

    def __radd__(self, o): return self + o
    def __rmul__(self, o): return self * o
    def __neg__(self): return self * -1
    def __sub__(self, o): return self + (-o if isinstance(o, Value) else Value(-o))
`;

const week3: WeekLab = {
  exercises: [
    {
      id: "w3-lab-mlp-forward",
      sectionId: "neurons-mlp",
      title: "뉴런·층 계산과 \"비선형이 없으면 한 층\" 증명",
      tier: "core",
      prompt: `
1. \`neuron(x, w, b)\`: ReLU 뉴런 $\\max(0, w \\cdot x + b)$
2. \`layer(x, W, b)\`: 선형 층 $Wx + b$ (W의 shape은 (출력, 입력))
3. \`collapse(W1, b1, W2, b2)\`: 비선형 없이 쌓은 두 층 $W_2(W_1 x + b_1) + b_2$와 **같은 결과**를 내는 한 층의 $(W, b)$

「뉴런과 MLP, 활성화 함수」 단계의 결론("비선형 함수가 없으면 여러 층을 쌓아도 한 층과 같다")을 식으로 확인하는 문제입니다. 사이에 ReLU를 끼우면 더 이상 한 층으로 합쳐지지 않는 것도 확인합니다.
`,
      starter: py`
import numpy as np

def neuron(x, w, b):
    return 0.0  # TODO: ReLU(w·x + b)

def layer(x, W, b):
    return x  # TODO: Wx + b

def collapse(W1, b1, W2, b2):
    W = None  # TODO
    b = None  # TODO
    return W, b

print("뉴런 출력:", neuron(np.array([2.0, 1.0]), np.array([0.5, -1.0]), -0.5))
rng = np.random.default_rng(0)
x = rng.normal(size=3)
W1, b1, W2, b2 = rng.normal(size=(4, 3)), rng.normal(size=4), rng.normal(size=(1, 4)), rng.normal(size=1)
W, b = collapse(W1, b1, W2, b2)
print("두 층:", layer(layer(x, W1, b1), W2, b2), " 합친 한 층:", None if W is None else layer(x, W, b))
`,
      tests: py`
import numpy as np
rng = np.random.default_rng(1)

@test("ReLU 뉴런: w=(0.5, -1), b=-0.5, x=(2, 1) → 0")
def _():
    assert approx(neuron(np.array([2.0, 1.0]), np.array([0.5, -1.0]), -0.5), 0.0)

@test("양수 입력은 그대로 통과: w=(1, 1), b=0.5, x=(1, 2) → 3.5")
def _():
    assert approx(neuron(np.array([1.0, 2.0]), np.array([1.0, 1.0]), 0.5), 3.5)

@test("layer의 출력 shape = (출력 차원,)")
def _():
    out = layer(rng.normal(size=3), rng.normal(size=(4, 3)), rng.normal(size=4))
    assert np.shape(out) == (4,), f"shape: {np.shape(out)}"

@test("collapse한 한 층이 두 선형 층과 같은 값을 낸다")
def _():
    W1, b1, W2, b2 = rng.normal(size=(5, 3)), rng.normal(size=5), rng.normal(size=(2, 5)), rng.normal(size=2)
    W, b = collapse(W1, b1, W2, b2)
    assert W is not None and np.shape(W) == (2, 3), f"W shape: {np.shape(W)}"
    for _ in range(3):
        x = rng.normal(size=3)
        assert approx(W2 @ (W1 @ x + b1) + b2, W @ x + b)

@test("사이에 ReLU를 넣으면 한 층으로 합쳐지지 않는다")
def _():
    W1, b1, W2, b2 = rng.normal(size=(6, 3)), rng.normal(size=6), rng.normal(size=(1, 6)), rng.normal(size=1)
    W, b = collapse(W1, b1, W2, b2)
    xs = rng.normal(size=(20, 3))
    diffs = [abs((W2 @ np.maximum(0, W1 @ x + b1) + b2)[0] - (W @ x + b)[0]) for x in xs]
    assert max(diffs) > 1e-3
`,
      hints: [
        "`neuron`은 `max(0.0, float(np.dot(w, x) + b))`입니다.",
        "`layer`는 `W @ x + b`입니다. (출력, 입력) 행렬에 입력 벡터를 곱하면 출력 벡터가 됩니다.",
        "$W_2(W_1 x + b_1) + b_2 = (W_2 W_1)x + (W_2 b_1 + b_2)$이므로 `W = W2 @ W1`, `b = W2 @ b1 + b2`입니다.",
      ],
      solution: py`
import numpy as np

def neuron(x, w, b):
    return max(0.0, float(np.dot(w, x) + b))

def layer(x, W, b):
    return W @ x + b

def collapse(W1, b1, W2, b2):
    W = W2 @ W1
    b = W2 @ b1 + b2
    return W, b

print("뉴런 출력:", neuron(np.array([2.0, 1.0]), np.array([0.5, -1.0]), -0.5))
rng = np.random.default_rng(0)
x = rng.normal(size=3)
W1, b1, W2, b2 = rng.normal(size=(4, 3)), rng.normal(size=4), rng.normal(size=(1, 4)), rng.normal(size=1)
W, b = collapse(W1, b1, W2, b2)
print("두 층:", layer(layer(x, W1, b1), W2, b2), " 합친 한 층:", None if W is None else layer(x, W, b))
`,
    },
    {
      id: "w3-lab-backprop",
      sectionId: "backprop",
      title: "덧셈·곱셈 노드로 손 역전파, 그리고 층 하나의 δxᵀ",
      tier: "core",
      prompt: `
1. \`backprop(w, x, c)\`: $L = (wx + c)^2$을 $u = wx$, $v = u + c$, $L = v^2$로 쪼개 역전파한 $(\\partial L/\\partial w, \\partial L/\\partial x, \\partial L/\\partial c)$. 덧셈 노드는 기울기를 그대로 나눠 주고, 곱셈 노드는 **상대방의 값**을 곱해 전달합니다.
2. \`layer_grad(W, x)\`: $z = Wx$, $L = \\sum z^2$일 때 $\\dfrac{\\partial L}{\\partial W} = \\delta x^\\top$ ($\\delta = 2z$). 결과 shape은 W와 같아야 합니다.

본문 예제 $w=2, x=3, c=1$의 답은 $(42, 28, 14)$입니다.
`,
      starter: py`
import numpy as np

def backprop(w, x, c):
    u = w * x
    v = u + c
    dL_dv = 0.0          # TODO: 제곱 노드
    dL_du = dL_dc = 0.0  # TODO: 덧셈 노드
    dL_dw = dL_dx = 0.0  # TODO: 곱셈 노드
    return dL_dw, dL_dx, dL_dc

def layer_grad(W, x):
    z = W @ x
    delta = 2 * z
    return np.zeros_like(W)  # TODO: δ xᵀ (np.outer)

print(backprop(2.0, 3.0, 1.0))
`,
      tests: py`
import numpy as np

@test("본문 예제: (w, x, c) = (2, 3, 1) → (42, 28, 14)")
def _():
    assert approx(backprop(2.0, 3.0, 1.0), (42.0, 28.0, 14.0)), f"결과: {backprop(2.0, 3.0, 1.0)}"

@test("(w, x, c) = (-1, 4, 2) → (-16, 4, -4)")
def _():
    assert approx(backprop(-1.0, 4.0, 2.0), (-16.0, 4.0, -4.0)), f"결과: {backprop(-1.0, 4.0, 2.0)}"

@test("수치미분과 일치한다")
def _():
    f = lambda w, x, c: (w * x + c) ** 2
    args = (0.7, -1.3, 0.4)
    h = 1e-6
    num = []
    for i in range(3):
        p, m = list(args), list(args)
        p[i] += h; m[i] -= h
        num.append((f(*p) - f(*m)) / (2 * h))
    assert approx(backprop(*args), num, 1e-5), f"{backprop(*args)} vs {num}"

@test("층 기울기 δxᵀ: shape이 W와 같고 수치미분과 일치")
def _():
    rng = np.random.default_rng(0)
    W, x = rng.normal(size=(4, 3)), rng.normal(size=3)
    G = layer_grad(W, x)
    assert np.shape(G) == W.shape, f"shape: {np.shape(G)}"
    num = np.zeros_like(W)
    for i in range(4):
        for j in range(3):
            Wp, Wm = W.copy(), W.copy()
            Wp[i, j] += 1e-6; Wm[i, j] -= 1e-6
            num[i, j] = (np.sum((Wp @ x) ** 2) - np.sum((Wm @ x) ** 2)) / 2e-6
    assert approx(G, num, 1e-5)
`,
      hints: [
        "$L = v^2$이므로 `dL_dv = 2 * v`입니다.",
        "덧셈 노드: `dL_du = dL_dv`, `dL_dc = dL_dv`. 곱셈 노드: `dL_dw = dL_du * x`, `dL_dx = dL_du * w`(상대방 값을 곱함).",
        "`np.outer(delta, x)`는 (4,)와 (3,)으로 (4, 3) 행렬을 만듭니다. $\\delta x^\\top$과 같습니다.",
      ],
      solution: py`
import numpy as np

def backprop(w, x, c):
    u = w * x
    v = u + c
    dL_dv = 2 * v
    dL_du = dL_dc = dL_dv
    dL_dw, dL_dx = dL_du * x, dL_du * w
    return dL_dw, dL_dx, dL_dc

def layer_grad(W, x):
    z = W @ x
    delta = 2 * z
    return np.outer(delta, x)

print(backprop(2.0, 3.0, 1.0))
`,
    },
    {
      id: "w3-lab-money",
      sectionId: "python-for-autograd",
      title: "연산자 오버로딩·클로저·재귀로 계산 기록 남기기",
      tier: "core",
      prompt: `
「자동미분 엔진을 읽기 위한 파이썬 문법」 단계의 문법으로 \`Money\` 클래스를 완성합니다. 다음 단계 \`Value\`와 구조가 같습니다.

1. \`__add__\`, \`__sub__\`: 두 \`Money\`의 합·차. 결과는 \`parents\`에 두 피연산자를, \`op\`에 \`"+"\`·\`"-"\`를 기록합니다.
2. \`make_tax(rate)\`: \`rate\`를 기억했다가 \`Money\`에 곱해 주는 함수를 돌려줍니다(클로저). 곱셈 \`__mul__\`은 이미 있습니다.
3. \`ancestors(m)\`: \`m\`을 만드는 데 쓰인 모든 \`Money\`(m 자신 제외)를 **집합**으로 돌려줍니다. 재귀로 부모를 따라 올라가되, 같은 객체를 두 번 세지 않습니다.
`,
      starter: py`
class Money:
    def __init__(self, amount, parents=(), op=""):
        self.amount = amount
        self.parents = set(parents)
        self.op = op

    def __add__(self, other):
        return None  # TODO

    def __sub__(self, other):
        return None  # TODO

    def __mul__(self, k):
        return Money(self.amount * k, (self,), f"*{k}")

    def __repr__(self):
        return f"Money({self.amount})"

def make_tax(rate):
    # TODO: m을 받아 m * rate를 돌려주는 안쪽 함수를 만들어 반환합니다.
    return None

def ancestors(m, seen=None):
    seen = set() if seen is None else seen
    # TODO: m의 부모마다, 아직 seen에 없으면 추가하고 그 부모의 조상도 재귀로 모읍니다.
    return seen

a, b = Money(1000), Money(500)
vat = make_tax(1.1)
print(vat(a + b) if vat else "make_tax 미완성")
`,
      tests: py`
@test("a + b = Money(1500), parents와 op 기록")
def _():
    a, b = Money(1000), Money(500)
    c = a + b
    assert isinstance(c, Money) and c.amount == 1500, f"결과: {c}"
    assert c.parents == {a, b} and c.op == "+"

@test("a - b = Money(500), op = '-'")
def _():
    a, b = Money(1000), Money(500)
    c = a - b
    assert isinstance(c, Money) and c.amount == 500 and c.op == "-" and c.parents == {a, b}

@test("make_tax(1.1)(a + b) ≈ 1650 이고 rate마다 따로 기억한다")
def _():
    a, b = Money(1000), Money(500)
    vat, half = make_tax(1.1), make_tax(0.5)
    assert approx(vat(a + b).amount, 1650) and approx(half(a).amount, 500)

@test("조상 모으기: (a + b) * 2 의 조상은 3개")
def _():
    a, b = Money(1000), Money(500)
    s = a + b
    assert ancestors(s * 2) == {s, a, b}, f"결과: {ancestors(s * 2)}"

@test("같은 객체를 여러 번 써도 한 번만 센다")
def _():
    a = Money(10)
    d = (a + a) + a
    assert len(ancestors(d)) == 2, f"결과: {ancestors(d)}"
`,
      hints: [
        "`return Money(self.amount + other.amount, (self, other), \"+\")`처럼 결과를 만들 때 부모와 연산 이름을 함께 넘깁니다.",
        "`def tax(m): return m * rate`를 `make_tax` 안에 정의하고 `return tax`합니다. 안쪽 함수가 바깥의 `rate`를 기억합니다.",
        "`for p in m.parents: if p not in seen: seen.add(p); ancestors(p, seen)`. seen을 같은 집합으로 넘겨야 중복이 사라집니다.",
      ],
      solution: py`
class Money:
    def __init__(self, amount, parents=(), op=""):
        self.amount = amount
        self.parents = set(parents)
        self.op = op

    def __add__(self, other):
        return Money(self.amount + other.amount, (self, other), "+")

    def __sub__(self, other):
        return Money(self.amount - other.amount, (self, other), "-")

    def __mul__(self, k):
        return Money(self.amount * k, (self,), f"*{k}")

    def __repr__(self):
        return f"Money({self.amount})"

def make_tax(rate):
    def tax(m):
        return m * rate
    return tax

def ancestors(m, seen=None):
    seen = set() if seen is None else seen
    for p in m.parents:
        if p not in seen:
            seen.add(p)
            ancestors(p, seen)
    return seen

a, b = Money(1000), Money(500)
vat = make_tax(1.1)
print(vat(a + b) if vat else "make_tax 미완성")
`,
    },
    {
      id: "w3-lab-micrograd",
      sectionId: "micrograd",
      title: "micrograd의 backward()와 국소 미분 채우기",
      tier: "core",
      prompt: `
덧셈·곱셈만 있는 \`Value\`에 세 가지를 직접 구현합니다.

1. \`__pow__(k)\`의 \`_backward\`: $\\dfrac{d}{dx}x^k = kx^{k-1}$
2. \`relu()\`의 \`_backward\`: 순전파 출력이 양수일 때만 기울기 통과
3. \`backward()\`: 후위순회로 **위상정렬** 리스트를 만든 뒤, 출력의 grad를 1로 두고 **역순으로** 각 노드의 \`_backward()\`를 호출합니다.

모든 \`_backward\`는 \`=\`가 아니라 \`+=\`로 누적해야 같은 변수를 여러 번 쓰는 식($y = x \\cdot x + x$)에서도 맞습니다.
`,
      starter: VALUE_BASE + py`

    def __pow__(self, k):
        out = Value(self.data ** k, (self,), f"**{k}")
        def _backward():
            pass  # TODO: d(x^k)/dx = k * x^(k-1)
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0.0, self.data), (self,), "relu")
        def _backward():
            pass  # TODO: 양수일 때만 out.grad를 그대로 전달
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()
        # TODO: build(v)를 재귀로 정의해 부모(_prev)를 먼저 방문한 뒤 v를 topo에 추가합니다.
        self.grad = 1.0
        # TODO: topo를 거꾸로 돌며 v._backward()를 호출합니다.

a, b = Value(2.0), Value(-3.0)
L = (a * b + 10).relu()
L.backward()
print(a.grad, b.grad)   # 기대: -3.0 2.0
`,
      tests: py`
import math

@test("relu(a·b + 10): a.grad = -3, b.grad = 2")
def _():
    a, b = Value(2.0), Value(-3.0)
    (a * b + 10).relu().backward()
    assert approx([a.grad, b.grad], [-3.0, 2.0]), f"결과: {(a.grad, b.grad)}"

@test("음수 입력의 relu는 기울기를 막는다")
def _():
    a = Value(-2.0)
    (a * 3).relu().backward()
    assert a.grad == 0.0, f"a.grad = {a.grad}"

@test("y = x·x + x, x = 3 → dy/dx = 7 (누적)")
def _():
    x = Value(3.0)
    (x * x + x).backward()
    assert approx(x.grad, 7.0), f"x.grad = {x.grad}"

@test("거듭제곱: d(x³)/dx at x=2 = 12, 깊은 식 (x² + 1)²")
def _():
    x = Value(2.0)
    (x ** 3).backward()
    assert approx(x.grad, 12.0), f"x.grad = {x.grad}"
    y = Value(1.5)
    ((y ** 2 + 1) ** 2).backward()
    assert approx(y.grad, 4 * 1.5 * (1.5 ** 2 + 1)), f"y.grad = {y.grad}"

@test("여러 갈래 그래프에서 수치미분과 일치")
def _():
    def f(a, b, c):
        return ((a * b + c) ** 2 + (a * c).relu() * b).data if isinstance(a, Value) else (a * b + c) ** 2 + max(0, a * c) * b
    vals = (0.7, -1.2, 0.9)
    vs = [Value(v) for v in vals]
    out = (vs[0] * vs[1] + vs[2]) ** 2 + (vs[0] * vs[2]).relu() * vs[1]
    out.backward()
    h = 1e-6
    for i in range(3):
        p, m = list(vals), list(vals)
        p[i] += h; m[i] -= h
        num = (f(*p) - f(*m)) / (2 * h)
        assert abs(vs[i].grad - num) < 1e-5, f"변수 {i}: 역전파 {vs[i].grad:.6f}, 수치미분 {num:.6f}"
`,
      hints: [
        "거듭제곱: `self.grad += k * self.data ** (k - 1) * out.grad`. ReLU: `self.grad += (out.data > 0) * out.grad`",
        "위상정렬: `def build(v):` 안에서 `if v not in seen: seen.add(v); for c in v._prev: build(c); topo.append(v)` 순서로 씁니다. 그리고 `build(self)`를 호출합니다.",
        "`for v in reversed(topo): v._backward()`. 출력에서 입력 방향으로 가야 각 노드의 grad가 모든 사용처로부터 다 모인 뒤에 부모로 전달됩니다.",
      ],
      solution: VALUE_BASE + py`

    def __pow__(self, k):
        out = Value(self.data ** k, (self,), f"**{k}")
        def _backward():
            self.grad += k * self.data ** (k - 1) * out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0.0, self.data), (self,), "relu")
        def _backward():
            self.grad += (out.data > 0) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for c in v._prev:
                    build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()

a, b = Value(2.0), Value(-3.0)
L = (a * b + 10).relu()
L.backward()
print(a.grad, b.grad)
`,
    },
    {
      id: "w3-lab-optimizers",
      sectionId: "optimizers",
      title: "Momentum과 Adam 한 스텝 구현하기",
      tier: "core",
      prompt: `
최적화기를 "상태를 받아 새 상태를 돌려주는 함수"로 구현합니다.

- \`momentum_step(w, v, g, lr, beta=0.9)\`: $v \\leftarrow \\beta v + g$, $w \\leftarrow w - \\eta v$ → \`(w, v)\`
- \`adam_step(w, m, s, g, t, lr, b1=0.9, b2=0.999, eps=1e-8)\`: $m \\leftarrow \\beta_1 m + (1-\\beta_1) g$, $s \\leftarrow \\beta_2 s + (1-\\beta_2) g^2$, 편향 보정 $\\hat m = m/(1-\\beta_1^t)$, $\\hat s = s/(1-\\beta_2^t)$, $w \\leftarrow w - \\eta \\hat m / (\\sqrt{\\hat s} + \\epsilon)$ → \`(w, m, s)\`

Adam의 첫 스텝은 기울기 크기와 상관없이 약 $\\eta$만큼 움직여야 합니다.
`,
      starter: py`
import numpy as np

def momentum_step(w, v, g, lr, beta=0.9):
    # TODO
    return w, v

def adam_step(w, m, s, g, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    # TODO: t는 1부터 시작하는 스텝 번호입니다.
    return w, m, s

def grad(w):
    return np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])

w, v = np.array([5.0, 5.0]), np.zeros(2)
for _ in range(100):
    w, v = momentum_step(w, v, grad(w), 0.01)
print("Momentum 100스텝:", np.round(w, 3))
`,
      tests: py`
import numpy as np

def grad(w):
    return np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])

@test("Momentum 첫 두 스텝(1차원)")
def _():
    w, v = momentum_step(np.array([0.0]), np.zeros(1), np.array([1.0]), 0.1)
    w, v = momentum_step(w, v, np.array([1.0]), 0.1)
    assert approx(v, [1.9]) and approx(w, [-0.29]), f"w = {w}, v = {v}"

@test("협곡 함수: Momentum(lr 0.01) 100스텝 뒤 w₁ ≈ 1.02")
def _():
    w, v = np.array([5.0, 5.0]), np.zeros(2)
    for _ in range(100):
        w, v = momentum_step(w, v, grad(w), 0.01)
    assert abs(w[0] - 1) < 0.05 and abs(w[1] + 2) < 0.05, f"w = {w}"

@test("Adam 첫 스텝 이동량 ≈ lr (기울기 5든 0.01이든)")
def _():
    for g in (5.0, 0.01):
        w, m, s = adam_step(np.array([0.0]), np.zeros(1), np.zeros(1), np.array([g]), 1, 0.1)
        assert approx(abs(w[0]), 0.1, 1e-4), f"g={g}: 이동량 {abs(w[0])}"

@test("Adam 상태 갱신: m, s가 지수이동평균")
def _():
    w, m, s = adam_step(np.zeros(2), np.zeros(2), np.zeros(2), np.array([2.0, -4.0]), 1, 0.1)
    assert approx(m, [0.2, -0.4]) and approx(s, [0.004, 0.016]), f"m = {m}, s = {s}"

@test("Adam(lr 0.1)로 협곡 함수를 300스텝 최적화하면 최솟값 근처에 간다")
def _():
    w, m, s = np.array([5.0, 5.0]), np.zeros(2), np.zeros(2)
    for t in range(1, 301):
        w, m, s = adam_step(w, m, s, grad(w), t, 0.1)
    assert abs(w[0] - 1) < 0.1 and abs(w[1] + 2) < 0.1, f"w = {w}"
`,
      hints: [
        "Momentum: `v = beta * v + g`를 먼저 구하고 `w = w - lr * v`를 돌려줍니다.",
        "Adam: `m = b1 * m + (1 - b1) * g`, `s = b2 * s + (1 - b2) * g ** 2`를 먼저 갱신합니다.",
        "`m_hat = m / (1 - b1 ** t)`, `s_hat = s / (1 - b2 ** t)`, `w = w - lr * m_hat / (np.sqrt(s_hat) + eps)`. 첫 스텝에서 $\\hat m = g$, $\\sqrt{\\hat s} = |g|$라 이동량이 lr이 됩니다.",
      ],
      solution: py`
import numpy as np

def momentum_step(w, v, g, lr, beta=0.9):
    v = beta * v + g
    return w - lr * v, v

def adam_step(w, m, s, g, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    m = b1 * m + (1 - b1) * g
    s = b2 * s + (1 - b2) * g ** 2
    m_hat, s_hat = m / (1 - b1 ** t), s / (1 - b2 ** t)
    return w - lr * m_hat / (np.sqrt(s_hat) + eps), m, s

def grad(w):
    return np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])

w, v = np.array([5.0, 5.0]), np.zeros(2)
for _ in range(100):
    w, v = momentum_step(w, v, grad(w), 0.01)
print("Momentum 100스텝:", np.round(w, 3))
`,
    },
    {
      id: "w3-lab-init",
      sectionId: "init-stability",
      title: "He·Xavier 초기화와 층별 활성화 분산 추적",
      tier: "core",
      prompt: `
$\\mathrm{Var}(z) \\approx \\text{fan\\_in} \\cdot \\mathrm{Var}(w) \\cdot \\mathrm{Var}(x)$에서 나온 초기화 규칙을 구현하고 실험합니다.

1. \`he_std(fan_in)\` $= \\sqrt{2/\\text{fan\\_in}}$ (ReLU용), \`xavier_std(fan_in, fan_out)\` $= \\sqrt{2/(\\text{fan\\_in} + \\text{fan\\_out})}$
2. \`activation_stds(std, n_layers, width, seed)\`: 표준정규 입력(샘플 1000개, 특징 width개)을 \`n_layers\`개의 "선형(가중치 표준편차 std) → ReLU" 층에 통과시키며, **입력과 각 층 출력**의 표준편차를 리스트로 돌려줍니다(길이 n_layers + 1).

He 초기화면 층을 지나도 표준편차가 거의 일정하고, 1.5배로 키우면 층마다 약 1.5배씩 불어나야 합니다.
`,
      starter: py`
import numpy as np

def he_std(fan_in):
    return 0.0  # TODO

def xavier_std(fan_in, fan_out):
    return 0.0  # TODO

def activation_stds(std, n_layers=10, width=256, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal((1000, width))
    stds = [x.std()]
    for _ in range(n_layers):
        pass  # TODO: W = rng.standard_normal((width, width)) * std, x = ReLU(x @ W), 표준편차 기록
    return stds

he = he_std(256)
for name, s in [("He", he), ("1.5배", he * 1.5), ("0.8배", he * 0.8)]:
    print(name, [round(float(v), 3) for v in activation_stds(s)])
`,
      tests: py`
import numpy as np

@test("he_std(50) = 0.2, xavier_std(100, 100) = 0.1")
def _():
    assert approx(he_std(50), 0.2) and approx(xavier_std(100, 100), 0.1)

@test("길이 = 층 수 + 1, 첫 값은 입력의 표준편차(≈1)")
def _():
    s = activation_stds(he_std(64), n_layers=5, width=64)
    assert len(s) == 6 and abs(s[0] - 1) < 0.05, f"결과: {s}"

@test("He 초기화: 10층을 지나도 표준편차가 0.5~1.5 사이에 머문다")
def _():
    s = activation_stds(he_std(256))
    assert all(0.5 < v < 1.5 for v in s[1:]), f"결과: {[round(float(v), 3) for v in s]}"

@test("1.5배 초기화: 10층 뒤 He보다 30배 이상 크다(≈ 1.5¹⁰ = 57.7배)")
def _():
    he = activation_stds(he_std(256))[-1]
    big = activation_stds(he_std(256) * 1.5)[-1]
    assert big / he > 30, f"비율 {big / he:.1f}"

@test("0.8배 초기화: 10층 뒤 He의 0.2배 미만(≈ 0.8¹⁰ = 0.107배)")
def _():
    he = activation_stds(he_std(256))[-1]
    small = activation_stds(he_std(256) * 0.8)[-1]
    assert small / he < 0.2, f"비율 {small / he:.3f}"
`,
      hints: [
        "`np.sqrt(2 / fan_in)`, `np.sqrt(2 / (fan_in + fan_out))`",
        "반복문 안에서 `W = rng.standard_normal((width, width)) * std` → `x = np.maximum(0, x @ W)` → `stds.append(x.std())`",
        "He에서 표준편차가 1이 아니라 약 0.8 근처인 이유는 ReLU가 음수 절반을 0으로 만들기 때문입니다. 핵심은 층을 지나도 일정하다는 점입니다.",
      ],
      solution: py`
import numpy as np

def he_std(fan_in):
    return np.sqrt(2 / fan_in)

def xavier_std(fan_in, fan_out):
    return np.sqrt(2 / (fan_in + fan_out))

def activation_stds(std, n_layers=10, width=256, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal((1000, width))
    stds = [x.std()]
    for _ in range(n_layers):
        W = rng.standard_normal((width, width)) * std
        x = np.maximum(0, x @ W)
        stds.append(x.std())
    return stds

he = he_std(256)
for name, s in [("He", he), ("1.5배", he * 1.5), ("0.8배", he * 0.8)]:
    print(name, [round(float(v), 3) for v in activation_stds(s)])
`,
    },
    {
      id: "w3-lab-twolayer",
      sectionId: "pytorch-core",
      title: "autograd 없이 2층 신경망의 backward 작성하기",
      tier: "core",
      prompt: `
「PyTorch가 대신해주는 것들」 단계에서 본 2층 신경망에서 \`backward\`를 직접 작성합니다. 순전파는 $z_1 = XW_1 + b_1$, $h = \\mathrm{ReLU}(z_1)$, $z_2 = hW_2 + b_2$, $p = \\sigma(z_2)$, 손실은 평균 이진 교차 엔트로피입니다.

시그모이드 + 교차 엔트로피의 기울기 $\\partial L/\\partial z_2 = (p - Y)/n$에서 출발해, 층마다 "$\\partial L/\\partial W = (\\text{입력})^\\top \\delta$", "아래 층으로는 $\\delta W^\\top$", "ReLU에서 음수 자리는 차단"을 적용합니다. 채점은 gradient check와 make_moons 학습 정확도로 합니다.
`,
      starter: py`
import numpy as np
from sklearn.datasets import make_moons

def forward(X, W1, b1, W2, b2):
    z1 = X @ W1 + b1
    h = np.maximum(0, z1)
    p = 1 / (1 + np.exp(-(h @ W2 + b2)))
    return z1, h, p

def loss_fn(p, Y):
    return -np.mean(Y * np.log(p + 1e-12) + (1 - Y) * np.log(1 - p + 1e-12))

def backward(X, Y, z1, h, p, W2):
    dz2 = (p - Y) / len(X)
    dW2 = np.zeros_like(W2)          # TODO
    db2 = np.zeros(W2.shape[1])      # TODO
    dz1 = np.zeros_like(z1)          # TODO: W2ᵀ로 내려보내고 ReLU 마스크 적용
    dW1 = np.zeros((X.shape[1], z1.shape[1]))  # TODO
    db1 = np.zeros(z1.shape[1])      # TODO
    return dW1, db1, dW2, db2

X, y = make_moons(n_samples=400, noise=0.15, random_state=0)
Y = y.reshape(-1, 1).astype(float)
rng = np.random.default_rng(0)
W1, b1 = rng.normal(0, 1.0, (2, 16)), np.zeros(16)
W2, b2 = rng.normal(0, 0.25, (16, 1)), np.zeros(1)
for epoch in range(1001):
    z1, h, p = forward(X, W1, b1, W2, b2)
    dW1, db1, dW2, db2 = backward(X, Y, z1, h, p, W2)
    W1 -= 0.5 * dW1; b1 -= 0.5 * db1; W2 -= 0.5 * dW2; b2 -= 0.5 * db2
    if epoch % 250 == 0:
        print(f"epoch {epoch:4d}: loss = {loss_fn(p, Y):.4f}, 정확도 = {np.mean((p >= 0.5) == Y):.3f}")
`,
      tests: py`
import numpy as np
from sklearn.datasets import make_moons

rng = np.random.default_rng(3)
Xg = rng.normal(size=(20, 2))
Yg = (rng.random((20, 1)) > 0.5).astype(float)
P = [rng.normal(0, 1, (2, 5)), rng.normal(0, 0.1, 5), rng.normal(0, 1, (5, 1)), rng.normal(0, 0.1, 1)]

def num_grad(i, idx):
    h = 1e-6
    Pp = [q.copy() for q in P]; Pm = [q.copy() for q in P]
    Pp[i][idx] += h; Pm[i][idx] -= h
    return (loss_fn(forward(Xg, *Pp)[2], Yg) - loss_fn(forward(Xg, *Pm)[2], Yg)) / (2 * h)

@test("반환한 기울기 shape이 파라미터와 같다")
def _():
    z1, h, p = forward(Xg, *P)
    grads = backward(Xg, Yg, z1, h, p, P[2])
    assert [np.shape(g) for g in grads] == [np.shape(q) for q in P], f"shape: {[np.shape(g) for g in grads]}"

@test("gradient check: W2, b2")
def _():
    z1, h, p = forward(Xg, *P)
    g = backward(Xg, Yg, z1, h, p, P[2])
    assert approx(g[2][3, 0], num_grad(2, (3, 0)), 1e-5) and approx(g[3][0], num_grad(3, (0,)), 1e-5)

@test("gradient check: W1, b1 (ReLU 마스크 포함)")
def _():
    z1, h, p = forward(Xg, *P)
    g = backward(Xg, Yg, z1, h, p, P[2])
    for idx in [(0, 0), (1, 2), (0, 4)]:
        assert approx(g[0][idx], num_grad(0, idx), 1e-5), f"W1{idx}: {g[0][idx]:.6f} vs {num_grad(0, idx):.6f}"
    assert approx(g[1][1], num_grad(1, (1,)), 1e-5)

@test("make_moons 학습 정확도 0.95 이상")
def _():
    X, y = make_moons(n_samples=400, noise=0.15, random_state=0)
    Y = y.reshape(-1, 1).astype(float)
    r = np.random.default_rng(0)
    W1, b1, W2, b2 = r.normal(0, 1.0, (2, 16)), np.zeros(16), r.normal(0, 0.25, (16, 1)), np.zeros(1)
    for _ in range(1000):
        z1, h, p = forward(X, W1, b1, W2, b2)
        dW1, db1, dW2, db2 = backward(X, Y, z1, h, p, W2)
        W1 -= 0.5 * dW1; b1 -= 0.5 * db1; W2 -= 0.5 * dW2; b2 -= 0.5 * db2
    acc = np.mean((forward(X, W1, b1, W2, b2)[2] >= 0.5) == Y)
    assert acc >= 0.95, f"정확도 {acc:.3f}"
`,
      hints: [
        "출력층: `dW2 = h.T @ dz2`, `db2 = dz2.sum(axis=0)`",
        "은닉층으로 내려보내기: `dz1 = (dz2 @ W2.T) * (z1 > 0)`. ReLU가 0을 낸 자리는 기울기도 0입니다.",
        "입력층: `dW1 = X.T @ dz1`, `db1 = dz1.sum(axis=0)`. 패턴은 언제나 \"(그 층의 입력).T @ (그 층 출력의 기울기)\"입니다.",
      ],
      solution: py`
import numpy as np
from sklearn.datasets import make_moons

def forward(X, W1, b1, W2, b2):
    z1 = X @ W1 + b1
    h = np.maximum(0, z1)
    p = 1 / (1 + np.exp(-(h @ W2 + b2)))
    return z1, h, p

def loss_fn(p, Y):
    return -np.mean(Y * np.log(p + 1e-12) + (1 - Y) * np.log(1 - p + 1e-12))

def backward(X, Y, z1, h, p, W2):
    dz2 = (p - Y) / len(X)
    dW2, db2 = h.T @ dz2, dz2.sum(axis=0)
    dz1 = (dz2 @ W2.T) * (z1 > 0)
    dW1, db1 = X.T @ dz1, dz1.sum(axis=0)
    return dW1, db1, dW2, db2

X, y = make_moons(n_samples=400, noise=0.15, random_state=0)
Y = y.reshape(-1, 1).astype(float)
rng = np.random.default_rng(0)
W1, b1 = rng.normal(0, 1.0, (2, 16)), np.zeros(16)
W2, b2 = rng.normal(0, 0.25, (16, 1)), np.zeros(1)
for epoch in range(1001):
    z1, h, p = forward(X, W1, b1, W2, b2)
    dW1, db1, dW2, db2 = backward(X, Y, z1, h, p, W2)
    W1 -= 0.5 * dW1; b1 -= 0.5 * db1; W2 -= 0.5 * dW2; b2 -= 0.5 * db2
    if epoch % 250 == 0:
        print(f"epoch {epoch:4d}: loss = {loss_fn(p, Y):.4f}, 정확도 = {np.mean((p >= 0.5) == Y):.3f}")
`,
    },
    {
      id: "w3-lab-norm",
      sectionId: "normalization",
      title: "BatchNorm과 LayerNorm: 평균·분산을 구하는 축의 차이",
      tier: "supplement",
      prompt: `
두 정규화 층을 \`gamma\`, \`beta\`까지 포함해 구현합니다(\`eps=1e-5\`).

- \`batch_norm(z, gamma, beta)\`: 배치 축(axis=0)으로 특징마다 평균·분산을 구해 정규화
- \`layer_norm(z, gamma, beta)\`: **마지막 축**으로 샘플(토큰)마다 평균·분산을 구해 정규화. (B, T, d) 모양의 Transformer 텐서에도 그대로 동작해야 합니다.

정규화한 뒤 \`gamma * 정규화값 + beta\`를 돌려줍니다.
`,
      starter: py`
import numpy as np

def batch_norm(z, gamma=1.0, beta=0.0, eps=1e-5):
    z = np.asarray(z, dtype=float)
    # TODO: axis=0 평균·분산
    return z

def layer_norm(z, gamma=1.0, beta=0.0, eps=1e-5):
    z = np.asarray(z, dtype=float)
    # TODO: 마지막 축 평균·분산 (keepdims=True)
    return z

z = np.array([[2.0, 4.0], [6.0, 8.0]])
print("BN:\n", np.round(batch_norm(z), 3))
print("LN:\n", np.round(layer_norm(z), 3))
`,
      tests: py`
import numpy as np
z = np.array([[2.0, 4.0], [6.0, 8.0]])

@test("BN: 특징(열)마다 평균 0 → [[-1, -1], [1, 1]]")
def _():
    assert approx(batch_norm(z), [[-1, -1], [1, 1]], 1e-4), f"결과: {batch_norm(z)}"

@test("LN: 샘플(행)마다 평균 0 → [[-1, 1], [-1, 1]]")
def _():
    assert approx(layer_norm(z), [[-1, 1], [-1, 1]], 1e-4), f"결과: {layer_norm(z)}"

@test("배치가 1개면 BN은 0이 되지만 LN은 의미 있는 값")
def _():
    one = np.array([[3.0, 7.0, 1.0]])
    assert approx(batch_norm(one), [[0, 0, 0]]) and np.abs(layer_norm(one)).max() > 0.5

@test("gamma·beta로 원래 값을 되돌릴 수 있다")
def _():
    x = np.array([[1.0, 5.0, 9.0], [2.0, 2.0, 8.0]])
    mu, sd = x.mean(axis=1, keepdims=True), np.sqrt(x.var(axis=1, keepdims=True) + 1e-5)
    assert approx(layer_norm(x, gamma=sd, beta=mu), x, 1e-6)

@test("(B, T, d) 텐서: 토큰마다 평균 0, 표준편차 1")
def _():
    h = np.random.default_rng(0).normal(5, 3, size=(2, 3, 4))
    out = layer_norm(h)
    assert np.shape(out) == (2, 3, 4) and approx(out.mean(axis=-1), np.zeros((2, 3))) and approx(out.std(axis=-1), np.ones((2, 3)), 1e-3)
`,
      hints: [
        "BN: `mu, var = z.mean(axis=0), z.var(axis=0)`, LN: `z.mean(axis=-1, keepdims=True)`, `z.var(axis=-1, keepdims=True)`",
        "정규화는 `(z - mu) / np.sqrt(var + eps)`입니다.",
        "마지막에 `gamma * z_hat + beta`를 돌려줍니다. LN에서 keepdims를 빼면 (B, T) 모양 평균을 (B, T, d)에서 뺄 때 브로드캐스팅이 어긋납니다.",
      ],
      solution: py`
import numpy as np

def batch_norm(z, gamma=1.0, beta=0.0, eps=1e-5):
    z = np.asarray(z, dtype=float)
    mu, var = z.mean(axis=0), z.var(axis=0)
    return gamma * (z - mu) / np.sqrt(var + eps) + beta

def layer_norm(z, gamma=1.0, beta=0.0, eps=1e-5):
    z = np.asarray(z, dtype=float)
    mu, var = z.mean(axis=-1, keepdims=True), z.var(axis=-1, keepdims=True)
    return gamma * (z - mu) / np.sqrt(var + eps) + beta

z = np.array([[2.0, 4.0], [6.0, 8.0]])
print("BN:\n", np.round(batch_norm(z), 3))
print("LN:\n", np.round(layer_norm(z), 3))
`,
    },
    {
      id: "w3-lab-regularize",
      sectionId: "dl-regularization",
      title: "역드롭아웃·학습률 스케줄·조기 종료 구현",
      tier: "supplement",
      prompt: `
「딥러닝 학습 기법」 단계의 세 도구를 함수로 만듭니다.

1. \`dropout(h, p, rng, training)\`: \`training=True\`면 각 원소를 확률 \`p\`로 0으로 만들고 살아남은 값은 $\\frac{1}{1-p}$배(역드롭아웃) 합니다. \`training=False\`면 \`h\`를 그대로 돌려줍니다. 마스크는 \`rng.random(h.shape) >= p\`로 만듭니다.
2. \`lr_at(step, total, warmup, lr_max, lr_min)\`: \`step < warmup\`이면 $\\eta_{\\max}\\cdot\\frac{\\text{step}+1}{\\text{warmup}}$, 그 뒤에는 코사인 감쇠 $\\eta_{\\min} + \\frac{1}{2}(\\eta_{\\max} - \\eta_{\\min})(1 + \\cos(\\pi\\cdot\\frac{\\text{step} - \\text{warmup}}{\\text{total} - \\text{warmup}}))$
3. \`early_stop_epoch(val_losses, patience)\`: 검증 손실을 앞에서부터 보다가 최솟값이 \`patience\`번 연속으로 갱신되지 않으면 멈춘다고 할 때, **최종 모델로 고를 에폭 번호**(그때까지의 최솟값 위치, 0부터)를 돌려줍니다.
`,
      starter: py`
import numpy as np

def dropout(h, p, rng, training=True):
    # TODO: training이면 마스크를 곱하고 1/(1-p)배, 아니면 그대로
    return h

def lr_at(step, total=1000, warmup=100, lr_max=1e-3, lr_min=1e-5):
    # TODO: 선형 워밍업 뒤 코사인 감쇠
    return lr_max

def early_stop_epoch(val_losses, patience=3):
    best, best_epoch, waited = float("inf"), 0, 0
    for epoch, loss in enumerate(val_losses):
        pass  # TODO: 최솟값을 갱신하면 기록하고 waited=0, 아니면 waited += 1, patience에 닿으면 멈춤
    return best_epoch

rng = np.random.default_rng(0)
h = np.ones((4, 5))
print(dropout(h, 0.5, rng))
print({s: round(lr_at(s), 6) for s in (0, 99, 100, 550, 999)})
print(early_stop_epoch([0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5], patience=3))
`,
      tests: py`
import numpy as np

@test("학습 중: 꺼진 칸은 0, 살아남은 칸은 1/(1-p)배")
def _():
    rng = np.random.default_rng(1)
    out = dropout(np.ones((200, 50)), 0.2, rng, training=True)
    vals = set(np.round(np.unique(out), 6).tolist())
    assert vals <= {0.0, 1.25}, f"값의 종류: {sorted(vals)[:5]}"
    assert abs((out == 0).mean() - 0.2) < 0.02, f"꺼진 비율 {(out == 0).mean():.3f}"

@test("역드롭아웃은 평균을 유지한다")
def _():
    h = np.random.default_rng(2).random((5000, 40))
    out = dropout(h, 0.5, np.random.default_rng(3), training=True)
    assert abs(out.mean() - h.mean()) < 0.01, f"{h.mean():.4f} → {out.mean():.4f}"

@test("평가 때는 그대로 통과")
def _():
    h = np.arange(6.0).reshape(2, 3)
    assert np.array_equal(dropout(h, 0.5, np.random.default_rng(0), training=False), h)

@test("워밍업 구간: 0스텝 1e-5, 99스텝 1e-3")
def _():
    assert approx(lr_at(0), 1e-5) and approx(lr_at(99), 1e-3) and approx(lr_at(49), 5e-4)

@test("코사인 구간: 시작 1e-3, 중간 (max+min)/2, 끝 근처 1e-5")
def _():
    assert approx(lr_at(100), 1e-3) and approx(lr_at(550), 0.5 * (1e-3 + 1e-5)) and abs(lr_at(1000) - 1e-5) < 1e-9

@test("조기 종료: patience 3이면 2에폭을 고르고, 뒤의 0.5는 보지 못한다")
def _():
    losses = [0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5]
    assert early_stop_epoch(losses, patience=3) == 2, f"결과: {early_stop_epoch(losses, 3)}"
    assert early_stop_epoch(losses, patience=5) == 6, f"patience 5: {early_stop_epoch(losses, 5)}"
    assert early_stop_epoch([1.0, 0.9, 0.8], patience=2) == 2
`,
      hints: [
        "`mask = rng.random(h.shape) >= p`를 만든 뒤 `h * mask / (1 - p)`를 돌려줍니다.",
        "`progress = (step - warmup) / (total - warmup)`, `lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * progress))`",
        "반복문 안에서 `if loss < best: best, best_epoch, waited = loss, epoch, 0` / `else: waited += 1` 다음 `if waited >= patience: break`입니다.",
      ],
      solution: py`
import numpy as np

def dropout(h, p, rng, training=True):
    if not training:
        return h
    mask = rng.random(h.shape) >= p
    return h * mask / (1 - p)

def lr_at(step, total=1000, warmup=100, lr_max=1e-3, lr_min=1e-5):
    if step < warmup:
        return lr_max * (step + 1) / warmup
    progress = (step - warmup) / (total - warmup)
    return lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * progress))

def early_stop_epoch(val_losses, patience=3):
    best, best_epoch, waited = float("inf"), 0, 0
    for epoch, loss in enumerate(val_losses):
        if loss < best:
            best, best_epoch, waited = loss, epoch, 0
        else:
            waited += 1
            if waited >= patience:
                break
    return best_epoch

rng = np.random.default_rng(0)
h = np.ones((4, 5))
print(dropout(h, 0.5, rng))
print({s: round(lr_at(s), 6) for s in (0, 99, 100, 550, 999)})
print(early_stop_epoch([0.9, 0.7, 0.6, 0.62, 0.61, 0.65, 0.5], patience=3))
`,
    },
    {
      id: "w3-lab-dual",
      sectionId: "autodiff-theory",
      title: "이원수 순방향 모드와 JVP·VJP",
      tier: "advanced",
      prompt: `
「자동미분의 두 모드」 단계의 두 도구를 구현합니다.

1. \`Dual\` 클래스: 값 \`val\`과 미분 \`dot\`을 함께 저장하며 \`+\`, \`*\`(숫자와의 연산 포함)를 지원합니다. 곱은 $(a + b\\varepsilon)(c + d\\varepsilon) = ac + (ad + bc)\\varepsilon$입니다. \`dsin\`, \`dexp\`는 연쇄법칙으로 \`dot\`에 $\\cos$, $\\exp$를 곱합니다.
2. \`derivative(f, x)\`: \`f(Dual(x, 1.0)).dot\`
3. 행렬 사슬 $y = W_3 W_2 W_1 x$(선형, 출력 벡터)에 대해 \`jvp(Ws, v)\` $= W_3 W_2 W_1 v$와 \`vjp(Ws, u)\` $= u^\\top W_3 W_2 W_1$(결과는 입력 차원의 1차원 배열)을 **행렬을 미리 곱하지 않고** 벡터를 한 층씩 통과시켜 계산합니다.
`,
      starter: py`
import math
import numpy as np

class Dual:
    def __init__(self, val, dot=0.0):
        self.val, self.dot = val, dot
    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(0.0, 0.0)  # TODO
    __radd__ = __add__
    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(0.0, 0.0)  # TODO
    __rmul__ = __mul__

def dsin(d): return Dual(0.0, 0.0)  # TODO
def dexp(d): return Dual(0.0, 0.0)  # TODO

def derivative(f, x):
    return 0.0  # TODO

def jvp(Ws, v):
    return v  # TODO: W1부터 차례로 곱한다

def vjp(Ws, u):
    return u  # TODO: 마지막 층부터 거꾸로 W.T를 곱한다

print(derivative(lambda x: x * dsin(x) + dexp(x), 1.0))
`,
      tests: py`
import math
import numpy as np

@test("다항식의 미분: f(x) = 3x² + 2x + 1, f'(2) = 14")
def _():
    assert approx(derivative(lambda x: 3 * x * x + 2 * x + 1, 2.0), 14.0)

@test("x·sin x + eˣ의 미분이 해석적 값과 1e-12 이내")
def _():
    got = derivative(lambda x: x * dsin(x) + dexp(x), 1.0)
    exact = math.sin(1) + math.cos(1) + math.exp(1)
    assert abs(got - exact) < 1e-12, f"{got} vs {exact}"

@test("값(val)도 함께 정확히 계산한다")
def _():
    d = (lambda x: x * dsin(x) + dexp(x))(Dual(1.0, 1.0))
    assert approx(d.val, math.sin(1) + math.e)

@test("JVP·VJP가 미리 곱한 야코비안과 같다")
def _():
    rng = np.random.default_rng(0)
    Ws = [rng.normal(size=(5, 4)), rng.normal(size=(3, 5)), rng.normal(size=(2, 3))]
    J = Ws[2] @ Ws[1] @ Ws[0]
    v, u = rng.normal(size=4), rng.normal(size=2)
    assert approx(jvp(Ws, v), J @ v) and approx(vjp(Ws, u), u @ J)

@test("출력이 1개면 VJP 한 번 = JVP를 입력 차원만큼 반복한 결과")
def _():
    rng = np.random.default_rng(1)
    Ws = [rng.normal(size=(6, 8)), rng.normal(size=(1, 6))]
    by_jvp = np.array([jvp(Ws, e)[0] for e in np.eye(8)])
    assert approx(vjp(Ws, np.array([1.0])), by_jvp)
`,
      hints: [
        "덧셈은 `Dual(self.val + o.val, self.dot + o.dot)`, 곱셈은 `Dual(self.val * o.val, self.dot * o.val + self.val * o.dot)`입니다.",
        "`dsin(d)`는 `Dual(math.sin(d.val), math.cos(d.val) * d.dot)`. `derivative`는 씨앗 `dot=1.0`을 넣고 결과의 `.dot`을 읽습니다.",
        "`jvp`는 `for W in Ws: v = W @ v`, `vjp`는 `for W in reversed(Ws): u = W.T @ u`입니다.",
      ],
      solution: py`
import math
import numpy as np

class Dual:
    def __init__(self, val, dot=0.0):
        self.val, self.dot = val, dot
    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val + o.val, self.dot + o.dot)
    __radd__ = __add__
    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val * o.val, self.dot * o.val + self.val * o.dot)
    __rmul__ = __mul__

def dsin(d): return Dual(math.sin(d.val), math.cos(d.val) * d.dot)
def dexp(d): return Dual(math.exp(d.val), math.exp(d.val) * d.dot)

def derivative(f, x):
    return f(Dual(x, 1.0)).dot

def jvp(Ws, v):
    for W in Ws:
        v = W @ v
    return v

def vjp(Ws, u):
    for W in reversed(Ws):
        u = W.T @ u
    return u

print(derivative(lambda x: x * dsin(x) + dexp(x), 1.0))
`,
    },
    {
      id: "w3-lab-adamw",
      sectionId: "adam-theory",
      title: "편향 보정 Adam과 분리된 가중치 감쇠(AdamW)",
      tier: "advanced",
      prompt: `
「Adam의 이론」 단계의 결론을 최적화기로 구현해 확인합니다.

1. \`adam_step(w, g, state, lr, lam, decoupled, b1=0.9, b2=0.999, eps=1e-8)\`: \`state\`는 \`{"t": 0, "m": 0, "v": 0}\` 딕셔너리(배열도 가능)입니다. \`t\`를 1 늘리고,
   - \`decoupled=False\`(Adam + L2)면 기울기를 \`g + lam * w\`로 바꿔 $m, v$를 갱신하고 편향 보정한 $\\hat m/(\\sqrt{\\hat v}+\\epsilon)$로 갱신합니다.
   - \`decoupled=True\`(AdamW)면 $m, v$에는 \`g\`만 쓰고, 갱신 뒤에 \`w -= lr * lam * w\`를 따로 적용합니다.

   새 \`w\`를 돌려줍니다(\`state\`는 제자리에서 갱신).
2. \`bias_corrected_m(gs, b1)\`: 기울기 리스트 \`gs\`를 차례로 넣었을 때의 보정 전 $m_t$와 보정 후 $\\hat m_t$의 마지막 값 \`(m, m_hat)\`
`,
      starter: py`
import numpy as np

def adam_step(w, g, state, lr=1e-3, lam=0.0, decoupled=False, b1=0.9, b2=0.999, eps=1e-8):
    state["t"] += 1
    t = state["t"]
    # TODO: decoupled 여부에 따라 기울기를 정하고 m, v를 갱신한 뒤 편향 보정해 w를 갱신합니다.
    return w

def bias_corrected_m(gs, b1=0.9):
    m = 0.0
    # TODO
    return m, m

def run(lam, decoupled, steps=1000):
    w, state = 1.0, {"t": 0, "m": 0.0, "v": 0.0}
    for _ in range(steps):
        w = adam_step(w, 0.0, state, lr=1e-3, lam=lam, decoupled=decoupled)   # 데이터 기울기 0
    return w

for lam in (1e-4, 1e-2, 1.0):
    print(lam, round(run(lam, False), 4), round(run(lam, True), 4))
print(bias_corrected_m([2.0, 2.0, 2.0]))
`,
      tests: py`
import numpy as np

def run(lam, decoupled, steps=1000):
    w, state = 1.0, {"t": 0, "m": 0.0, "v": 0.0}
    for _ in range(steps):
        w = adam_step(w, 0.0, state, lr=1e-3, lam=lam, decoupled=decoupled)
    return w

@test("첫 스텝은 기울기 크기와 무관하게 약 lr만큼 움직인다")
def _():
    for g in (5.0, 0.01):
        w = adam_step(0.0, g, {"t": 0, "m": 0.0, "v": 0.0}, lr=0.1)
        assert approx(w, -0.1, 1e-6), f"g={g}: w={w}"

@test("Adam + L2: 데이터 기울기 0인 파라미터가 λ와 무관하게 똑같이 줄어든다")
def _():
    vals = [run(lam, False) for lam in (1e-4, 1e-2, 1.0)]
    assert max(vals) - min(vals) < 1e-3 and vals[0] < 0.5, f"결과: {vals}"

@test("AdamW: (1 - ηλ)^1000 ≈ e^(-λ)")
def _():
    for lam in (1e-4, 1e-2, 1.0):
        assert approx(run(lam, True), (1 - 1e-3 * lam) ** 1000, 1e-6), f"λ={lam}: {run(lam, True)}"

@test("배열 파라미터에도 동작한다")
def _():
    w = np.array([1.0, -2.0])
    st = {"t": 0, "m": np.zeros(2), "v": np.zeros(2)}
    w2 = adam_step(w, np.array([0.5, -3.0]), st, lr=0.01)
    assert approx(w2, [0.99, -1.99], 1e-6) and st["t"] == 1

@test("편향 보정: 기울기가 계속 2면 m̂ = 2, m = 2(1 - 0.9^t)")
def _():
    m, m_hat = bias_corrected_m([2.0, 2.0, 2.0])
    assert approx(m, 2 * (1 - 0.9 ** 3)) and approx(m_hat, 2.0), f"{(m, m_hat)}"
`,
      hints: [
        "`grad = g if decoupled else g + lam * w`로 정한 뒤 `state[\"m\"] = b1 * state[\"m\"] + (1 - b1) * grad`, `v`도 같은 꼴(제곱)입니다.",
        "`m_hat = state[\"m\"] / (1 - b1 ** t)`, `v_hat = state[\"v\"] / (1 - b2 ** t)`, `w = w - lr * m_hat / (np.sqrt(v_hat) + eps)`.",
        "`decoupled`이면 마지막에 `w = w - lr * lam * w`를 한 번 더 합니다. 편향 보정 함수는 반복문 뒤 `t = len(gs)`로 `m / (1 - b1 ** t)`입니다.",
      ],
      solution: py`
import numpy as np

def adam_step(w, g, state, lr=1e-3, lam=0.0, decoupled=False, b1=0.9, b2=0.999, eps=1e-8):
    state["t"] += 1
    t = state["t"]
    grad = g if decoupled else g + lam * w
    state["m"] = b1 * state["m"] + (1 - b1) * grad
    state["v"] = b2 * state["v"] + (1 - b2) * grad ** 2
    m_hat = state["m"] / (1 - b1 ** t)
    v_hat = state["v"] / (1 - b2 ** t)
    w = w - lr * m_hat / (np.sqrt(v_hat) + eps)
    if decoupled:
        w = w - lr * lam * w
    return w

def bias_corrected_m(gs, b1=0.9):
    m = 0.0
    for g in gs:
        m = b1 * m + (1 - b1) * g
    return m, m / (1 - b1 ** len(gs))

def run(lam, decoupled, steps=1000):
    w, state = 1.0, {"t": 0, "m": 0.0, "v": 0.0}
    for _ in range(steps):
        w = adam_step(w, 0.0, state, lr=1e-3, lam=lam, decoupled=decoupled)
    return w

for lam in (1e-4, 1e-2, 1.0):
    print(lam, round(run(lam, False), 4), round(run(lam, True), 4))
print(bias_corrected_m([2.0, 2.0, 2.0]))
`,
    },
    {
      id: "w3-lab-gradflow",
      sectionId: "gradient-flow",
      title: "깊은 망의 기울기 노름과 잔차 연결·클리핑",
      tier: "advanced",
      prompt: `
「기울기 흐름의 수학」 단계의 실험을 구현합니다.

1. \`clip_by_norm(grads, c)\`: 배열 리스트의 전체 노름 $\\sqrt{\\sum \\lVert g_i\\rVert^2}$가 \`c\`를 넘으면 모두에 $c/\\lVert g\\rVert$를 곱한 새 리스트를, 아니면 그대로를 돌려줍니다. \`(새 리스트, 원래 노름)\` 튜플입니다.
2. \`input_grad_norm(scale, residual, depth, width=64, seed=0)\`: \`rng.normal(0, scale / sqrt(width), (width, width))\` 가중치를 \`depth\`개 만들고, 무작위 입력으로 순전파(\`residual\`이면 $h \\leftarrow h + \\tanh(Wh)$, 아니면 $h \\leftarrow \\tanh(Wh)$)한 뒤, 출력 쪽 기울기 \`np.ones(width) / sqrt(width)\`를 입력 쪽까지 역전파해 그 노름을 돌려줍니다. 난수는 가중치 \`depth\`개, 입력 순서로 뽑습니다.
`,
      starter: py`
import numpy as np

def clip_by_norm(grads, c):
    total = 0.0  # TODO: 전체 노름
    return grads, total

def input_grad_norm(scale, residual, depth, width=64, seed=0):
    rng = np.random.default_rng(seed)
    Ws = [rng.normal(0, scale / np.sqrt(width), (width, width)) for _ in range(depth)]
    h = rng.normal(size=width)
    pre = []
    for W in Ws:
        z = W @ h
        pre.append(z)
        h = h + np.tanh(z) if residual else np.tanh(z)
    g = np.ones(width) / np.sqrt(width)
    # TODO: 거꾸로 순회하며 g ← Wᵀ((1 - tanh² z) * g), residual이면 g를 더한다
    return float(np.linalg.norm(g))

for res in (False, True):
    print(res, [f"{input_grad_norm(0.5, res, d):.2e}" for d in (10, 30, 50)])
`,
      tests: py`
import numpy as np

@test("클리핑: 노름 130 → 5, 방향 유지")
def _():
    out, total = clip_by_norm([np.array([30.0, -40.0]), np.array([120.0])], 5.0)
    new = np.sqrt(sum(np.sum(g ** 2) for g in out))
    assert approx(total, 130.0) and approx(new, 5.0), f"{total} → {new}"
    assert approx(out[0] / np.linalg.norm(out[0]), [0.6, -0.8])

@test("임계값보다 작으면 그대로")
def _():
    g = [np.array([0.3, 0.4])]
    out, total = clip_by_norm(g, 5.0)
    assert approx(total, 0.5) and approx(out[0], g[0])

@test("기울기가 수치미분과 일치한다(얕은 망)")
def _():
    rng = np.random.default_rng(0)
    width, depth = 4, 3
    Ws = [rng.normal(0, 1 / np.sqrt(width), (width, width)) for _ in range(depth)]
    h0 = rng.normal(size=width)
    def out(h):
        for W in Ws:
            h = h + np.tanh(W @ h)
        return np.ones(width) @ h / np.sqrt(width)
    num = np.array([(out(h0 + 1e-6 * e) - out(h0 - 1e-6 * e)) / 2e-6 for e in np.eye(width)])
    assert approx(input_grad_norm(1.0, True, depth, width=width, seed=0), np.linalg.norm(num), 1e-5)

@test("작은 초기화의 일반 망은 50층에서 기울기가 사라진다")
def _():
    assert input_grad_norm(0.5, False, 50) < 1e-12

@test("같은 초기화에 잔차 연결을 더하면 50층에서도 0.1 이상")
def _():
    assert input_grad_norm(0.5, True, 50) > 0.1
`,
      hints: [
        "`total = np.sqrt(sum(np.sum(g ** 2) for g in grads))`, `factor = min(1.0, c / (total + 1e-12))`입니다.",
        "`for W, z in zip(reversed(Ws), reversed(pre)):` 안에서 `back = W.T @ ((1 - np.tanh(z) ** 2) * g)`를 구합니다.",
        "`g = g + back if residual else back`. 잔차 연결이면 원래 기울기가 그대로 지나가는 경로가 생깁니다.",
      ],
      solution: py`
import numpy as np

def clip_by_norm(grads, c):
    total = float(np.sqrt(sum(np.sum(g ** 2) for g in grads)))
    factor = min(1.0, c / (total + 1e-12))
    return [g * factor for g in grads], total

def input_grad_norm(scale, residual, depth, width=64, seed=0):
    rng = np.random.default_rng(seed)
    Ws = [rng.normal(0, scale / np.sqrt(width), (width, width)) for _ in range(depth)]
    h = rng.normal(size=width)
    pre = []
    for W in Ws:
        z = W @ h
        pre.append(z)
        h = h + np.tanh(z) if residual else np.tanh(z)
    g = np.ones(width) / np.sqrt(width)
    for W, z in zip(reversed(Ws), reversed(pre)):
        back = W.T @ ((1 - np.tanh(z) ** 2) * g)
        g = g + back if residual else back
    return float(np.linalg.norm(g))

for res in (False, True):
    print(res, [f"{input_grad_norm(0.5, res, d):.2e}" for d in (10, 30, 50)])
`,
    },
  ],

  quiz: [
    {
      kind: "choice",
      id: "w3-drill-shapes",
      tier: "core",
      sectionId: "neurons-mlp",
      question: "입력 배치 `X`의 shape이 `(32, 3)`, `W1`이 `(3, 4)`일 때 `X @ W1 + b1`이 동작하려면 `b1`의 shape과 결과 shape은?",
      choices: ["`b1`: (4,), 결과: (32, 4)", "`b1`: (32,), 결과: (32, 4)", "`b1`: (3,), 결과: (32, 3)", "`b1`: (4, 32), 결과: (4, 32)"],
      answer: 0,
      explanation:
        "`(32, 3) @ (3, 4)`는 `(32, 4)`이고, 길이 4인 편향이 브로드캐스팅으로 32개 샘플 모두에 더해집니다. 배치를 행으로 두는 코드(`X @ W`)에서는 W가 (입력, 출력), 본문 수식처럼 열벡터로 쓰는 $Wx$에서는 (출력, 입력)입니다.",
    },
    {
      kind: "choice",
      id: "w3-drill-missing-backward",
      tier: "core",
      sectionId: "micrograd",
      question: "`Value.__mul__`에서 `out._backward = _backward` 줄을 빠뜨린 채 `L = (a * b + c).relu()`에 `L.backward()`를 실행하면?",
      choices: [
        "오류가 나서 실행이 멈춘다",
        "`c.grad`는 정상이지만 `a.grad`, `b.grad`는 0으로 남는다. 곱셈 노드의 기본 `_backward`가 아무것도 하지 않기 때문이다",
        "모든 grad가 0이 된다",
        "결과는 정상이다. `backward()`가 알아서 곱셈 규칙을 적용한다",
      ],
      answer: 1,
      explanation:
        "`Value`는 생성될 때 `_backward = lambda: None`으로 시작합니다. 곱셈 결과 노드에 클로저를 매달지 않으면, 역전파가 그 노드에 도착해도 부모(a, b)에게 기울기를 나눠 주지 않습니다. 덧셈 노드를 거친 `c`까지는 정상입니다. 오류 없이 조용히 틀리므로 gradient check가 필요합니다.",
    },
    {
      kind: "choice",
      id: "w3-drill-adam-nocorrect",
      tier: "core",
      sectionId: "optimizers",
      question: "Adam($\\beta_1 = 0.9$, $\\beta_2 = 0.999$)에서 편향 보정 없이 $m_1/\\sqrt{s_1}$로 첫 스텝을 밟으면 이동량은 학습률 $\\eta$의 약 몇 배인가?",
      choices: ["정확히 1배", "약 3.16배 ($0.1 / \\sqrt{0.001}$)", "약 0.1배", "0배 (움직이지 않음)"],
      answer: 1,
      explanation:
        "첫 스텝에서 $m_1 = 0.1g$, $s_1 = 0.001g^2$이므로 $m_1/\\sqrt{s_1} = 0.1/\\sqrt{0.001} \\approx 3.16$입니다. 두 이동평균이 0에서 출발하며 생긴 치우침의 크기가 서로 달라 첫 스텝이 지나치게 커집니다. 편향 보정은 $1 - \\beta^t$로 나눠 두 값을 각각 $g$와 $g^2$으로 되돌려, 이동량을 정확히 $\\eta$로 만듭니다.",
    },
    {
      kind: "choice",
      id: "w3-drill-zero-grad-order",
      tier: "core",
      sectionId: "pytorch-core",
      question: "PyTorch 학습 루프를 `loss.backward()` → `optimizer.zero_grad()` → `optimizer.step()` 순서로 쓰면?",
      choices: [
        "정상이다. 순서는 상관없다",
        "방금 계산한 기울기를 지운 뒤 갱신하므로 (weight decay 같은 별도 항을 빼면) 파라미터가 기울기로는 전혀 갱신되지 않는다",
        "기울기가 두 배로 누적된다",
        "다음 스텝에서 오류가 난다",
      ],
      answer: 1,
      explanation:
        "`zero_grad()`는 `.grad`를 0(또는 None)으로 만듭니다. 역전파 직후에 지우면 `step()`이 읽을 기울기가 없습니다. 올바른 순서는 `zero_grad()` → `backward()` → `step()`이고, 그래야 이전 스텝의 기울기가 `+=`로 누적되지도 않습니다.",
    },
    {
      kind: "predict",
      id: "w3-drill-closure",
      tier: "core",
      sectionId: "python-for-autograd",
      code: py`
def make_counter():
    count = 0
    def inc():
        nonlocal count
        count += 1
        return count
    return inc

a, b = make_counter(), make_counter()
print(a(), a(), b(), a())
`,
      expected: "1 2 1 3",
      explanation:
        "`make_counter()`를 부를 때마다 새 `count`를 기억하는 클로저가 만들어집니다. `a`와 `b`는 서로 다른 `count`를 가지므로 `a`는 1, 2, 3으로, `b`는 1부터 셉니다. `Value`의 `_backward`도 이렇게 만들어질 때의 `self`, `o`, `out`을 기억합니다.",
    },
    {
      kind: "predict",
      id: "w3-drill-chain",
      tier: "core",
      sectionId: "backprop",
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
      explanation:
        "순전파 $u = 6$, $v = 7$, $L = 49$. 역전파는 제곱 노드에서 $2v = 14$, 덧셈 노드는 그대로 14, 곱셈 노드는 상대방 값을 곱해 $\\partial L/\\partial w = 14 \\times 3 = 42$, $\\partial L/\\partial x = 14 \\times 2 = 28$입니다.",
    },
    {
      kind: "predict",
      id: "w3-drill-explode",
      tier: "core",
      sectionId: "init-stability",
      code: py`
print(round(1.5 ** 10, 1), round(0.8 ** 10, 3))
print(round(1.2 ** 15, 1))
`,
      expected: "57.7 0.107\n15.4",
      explanation:
        "층마다 표준편차가 1.5배씩 커지면 10층 뒤 약 57.7배(폭발), 0.8배씩 줄면 약 0.107배(소실)가 됩니다. 1.2배씩 15층이면 약 15.4배입니다. 층 하나의 작은 어긋남이 깊이만큼 거듭제곱되어 커진다는 것이 초기화가 중요한 이유입니다.",
    },
    {
      kind: "descriptive",
      id: "w3-drill-xx-plus-x",
      tier: "core",
      sectionId: "micrograd",
      question:
        "`x = Value(3.0); y = x * x + x; y.backward()`에서 `x.grad`가 7이 되는 과정을, 계산 그래프의 노드와 `_backward` 호출 순서로 설명하십시오. `+=` 대신 `=`를 쓰면 몇이 되는지도 적습니다.",
      modelAnswer:
        "그래프는 $m = x \\cdot x$(곱셈), $y = m + x$(덧셈) 두 노드입니다. 위상정렬 역순으로 먼저 $y$의 grad를 1로 두고 덧셈 노드의 `_backward`가 $m$과 $x$에 각각 1을 더합니다(x.grad = 1). 다음으로 곱셈 노드의 `_backward`가 실행되는데, 두 피연산자가 모두 $x$라서 `self.grad += o.data * out.grad`(3)와 `o.grad += self.data * out.grad`(3)가 같은 $x$에 두 번 더해져 1 + 3 + 3 = 7이 됩니다. `=`를 쓰면 마지막 대입만 남아 덧셈 경로의 1이 지워지고 3이 됩니다. 같은 변수가 여러 경로로 쓰일 때 기울기는 모든 경로의 합이라는 연쇄법칙을 `+=`가 구현합니다.",
      keyPoints: ["그래프: m = x·x, y = m + x", "덧셈 노드가 x에 1을 전달", "곱셈 노드가 x에 3을 두 번 전달", "합 7 (경로별 기울기의 합)", "=를 쓰면 마지막 값 3만 남는다"],
    },
    {
      kind: "descriptive",
      id: "w3-drill-sgd-vs-adam",
      tier: "core",
      sectionId: "optimizers",
      question:
        "좁고 긴 협곡 모양 손실로 실험했더니 학습률을 잘 고른 SGD(0.04)가 Adam보다 정확했던 이유와, 그럼에도 실무에서 Adam을 기본값으로 쓰는 이유를 함께 설명하십시오.",
      modelAnswer:
        "협곡 손실은 단순한 2차 함수라, 두 방향의 배율 $(1 - 2\\eta)$, $(1 - 20\\eta)$가 모두 1보다 작으면서 가장 빨리 줄어드는 학습률(0.04 근처)을 고르면 SGD가 정확히 최솟값으로 수렴합니다. Adam은 방향마다 기울기 크기로 나눠 비슷한 보폭(약 $\\eta$)으로 움직이므로 최솟값 근처에서도 보폭이 줄지 않아 진동하거나(0.3), 100스텝 안에 도착하지 못합니다(0.1). 그래도 Adam을 기본값으로 쓰는 이유는 기울기 스케일이 층·파라미터마다 크게 다른 실제 신경망에서 학습률 하나로도 안정적으로 학습되어 튜닝 부담이 적기 때문입니다. 성능을 끝까지 짜내야 할 때는 SGD+Momentum을 튜닝하기도 합니다.",
      keyPoints: ["2차 함수에서는 잘 고른 학습률의 SGD가 정확히 수렴", "Adam은 보폭이 기울기 크기와 무관해 최솟값 근처에서 진동", "Adam은 기울기 스케일에 둔감해 튜닝이 쉽다", "Adam이 항상 가장 빠르거나 정확한 것은 아니다"],
    },
    {
      kind: "descriptive",
      id: "w3-drill-relu-mask",
      tier: "core",
      sectionId: "pytorch-core",
      question:
        "2층 신경망의 `backward`에서 `dz1 = (dz2 @ W2.T) * (z1 > 0)`의 `* (z1 > 0)`을 지우면 gradient check와 학습이 어떻게 됩니까? 이유를 ReLU의 국소 미분으로 설명하십시오.",
      modelAnswer:
        "ReLU의 국소 미분은 입력이 양수면 1, 음수면 0입니다. 마스크를 지우면 순전파에서 0을 출력한(손실에 전혀 영향을 주지 않은) 뉴런에도 기울기가 흘러가, $W_1$, $b_1$의 기울기가 실제 기울기와 달라집니다. 그래서 수치미분과 비교하는 gradient check에서 W1·b1 항목의 상대오차가 크게 나와 버그가 드러납니다. W2·b2는 마스크와 무관해 여전히 통과합니다. 틀린 기울기로 학습하면 손실이 덜 줄거나 불안정해집니다.",
      keyPoints: ["ReLU의 국소 미분은 양수 1, 음수 0", "0을 낸 뉴런에도 기울기가 흘러가 틀린 값이 된다", "W1·b1의 gradient check가 실패한다", "W2·b2는 영향을 받지 않는다"],
    },
    {
      kind: "predict",
      id: "w3-drill-fp16",
      tier: "supplement",
      sectionId: "pytorch-practice",
      code: py`
import numpy as np
g = np.array([3e-4, 5e-6, 2e-8, 1e-9], dtype=np.float32)
print((g.astype(np.float16) == 0).tolist())
print(((g * 1024).astype(np.float16) == 0).tolist())
`,
      expected: "[False, False, True, True]\n[False, False, False, False]",
      explanation:
        "FP16이 표현하는 가장 작은 양수는 약 $6 \\times 10^{-8}$이라 `2e-8`, `1e-9`는 0으로 사라집니다(underflow). 1024배 키운 뒤 변환하면 각각 약 $2 \\times 10^{-5}$, $10^{-6}$이 되어 살아남습니다. 이것이 혼합 정밀도 학습의 loss scaling입니다.",
    },
    {
      kind: "choice",
      id: "w3-drill-dropout-eval",
      tier: "supplement",
      sectionId: "dl-regularization",
      question: "드롭아웃을 넣은 모델을 검증할 때 `model.eval()`을 빼먹고 `model.train()` 상태로 평가하면?",
      choices: [
        "평가 때도 뉴런이 무작위로 꺼져 같은 입력에 대한 예측이 매번 달라지고 성능이 낮게 측정된다",
        "아무 차이도 없다",
        "드롭아웃 확률이 자동으로 0이 된다",
        "학습률이 바뀐다",
      ],
      answer: 0,
      explanation:
        "드롭아웃은 학습 모드에서만 동작하도록 만든 층입니다. 평가 모드로 바꾸지 않으면 매번 다른 부분망으로 예측해 결과가 흔들리고 앙상블 효과도 얻지 못합니다. BatchNorm도 같은 이유로 `model.eval()`이 필요합니다.",
    },
    {
      kind: "predict",
      id: "w3-drill-warmup",
      tier: "supplement",
      sectionId: "dl-regularization",
      code: py`
import math
lr_max, warmup, total = 1e-3, 10, 110
def lr(step):
    if step < warmup:
        return lr_max * (step + 1) / warmup
    return 0.5 * lr_max * (1 + math.cos(math.pi * (step - warmup) / (total - warmup)))
print(round(lr(4) * 1e4, 2), round(lr(10) * 1e4, 2), round(lr(60) * 1e4, 2), round(lr(110) * 1e4, 2))
`,
      expected: "5.0 10.0 5.0 0.0",
      explanation:
        "4스텝은 워밍업 중이라 $10^{-3}\\times 5/10 = 5\\times10^{-4}$, 10스텝은 코사인의 시작이라 $10^{-3}$, 60스텝은 코사인 구간의 정확히 중간이라 절반인 $5\\times10^{-4}$, 110스텝은 끝이라 0입니다(출력은 $10^4$배 한 값).",
    },
    {
      kind: "predict",
      id: "w3-drill-dual",
      tier: "advanced",
      sectionId: "autodiff-theory",
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
      explanation:
        "$x = 3 + \\varepsilon$를 세제곱하면 $27 + 27\\varepsilon$입니다($\\varepsilon^2 = 0$). 값 $3^3 = 27$과 미분 $3x^2 = 27$이 함께 나옵니다. 곱 하나마다 곱의 미분법을 적용하는 것이 순방향 모드 자동미분의 전부입니다.",
    },
    {
      kind: "choice",
      id: "w3-drill-adamw",
      tier: "advanced",
      sectionId: "adam-theory",
      question: "AdamW에서 학습률 $\\eta = 10^{-3}$, 가중치 감쇠 $\\lambda = 0.1$일 때, 기울기 항과 별도로 매 스텝 가중치에 곱해지는 값과 그 성질은?",
      choices: [
        "$0.9999$배이며, 모든 파라미터에 기울기 크기와 무관하게 같은 비율로 걸린다",
        "$0.9$배이며, 기울기가 큰 파라미터에만 걸린다",
        "$\\sqrt{\\hat v}$에 따라 파라미터마다 다르다",
        "감쇠는 적용되지 않는다",
      ],
      answer: 0,
      explanation:
        "AdamW는 $w \\leftarrow w - \\eta\\lambda w$를 갱신에서 따로 적용하므로 $1 - 10^{-3}\\times 0.1 = 0.9999$배가 모든 파라미터에 똑같이 걸립니다. Adam + L2에서는 감쇠 항이 $\\sqrt{\\hat v}$로 나눠져 파라미터마다 강도가 달라집니다.",
    },
    {
      kind: "descriptive",
      id: "w3-drill-residual",
      tier: "advanced",
      sectionId: "gradient-flow",
      question:
        "50층짜리 tanh 망을 작은 초기화로 학습시켰더니 앞쪽 층의 가중치가 전혀 바뀌지 않았습니다. 원인을 야코비안의 곱으로 진단하고, 잔차 연결이 이를 어떻게 바꾸는지 식으로 보이십시오. 잔차 연결만으로 충분하지 않을 수 있는 이유와 보완책도 적으십시오.",
      modelAnswer:
        "입력 쪽 기울기는 $J_1^\\top\\cdots J_{50}^\\top g$이고 각 $J_l = \\mathrm{diag}(1-\\tanh^2 z_l)W_l$이 벡터를 평균적으로 줄이면(작은 초기화, tanh 미분이 1 이하) 그 비율이 50번 곱해져 기울기가 지수적으로 사라집니다(예: 50층에서 약 $10^{-16}$). 앞쪽 층의 가중치 기울기는 이 사라진 신호에 비례하므로 갱신되지 않습니다. 잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$은 야코비안을 $I + \\partial F/\\partial h$로 바꾸어 역전파가 $g_{l-1} = g_l + (\\partial F/\\partial h)^\\top g_l$이 되므로, 원래 기울기가 그대로 전달되는 경로가 층마다 생깁니다. 다만 '1 + 작은 값'을 수백 번 곱하면 기울기와 활성화가 서서히 커질 수 있으므로(예: 50층에서 약 7.8), 잔차 가지를 0 근처로 초기화하거나 $1/\\sqrt{L}$로 줄이고, LayerNorm 같은 정규화 층과 기울기 클리핑을 함께 씁니다.",
      keyPoints: ["기울기 = 야코비안 전치의 곱, 비율이 지수적으로 누적", "tanh 미분이 1 이하이고 작은 초기화가 줄이는 쪽으로 작용", "잔차 연결의 야코비안 $I + \\partial F/\\partial h$: 기울기의 직접 경로", "보완: 잔차 가지 축소·정규화 층·클리핑"],
    },
  ],

  assignment: {
    requirements: [
      "`Value`의 `__truediv__`와 `exp`의 `_backward`를 완성해, 두 검증 식 모두 상대오차 $10^{-5}$ 미만(✓)을 받는다.",
      "`Neuron`·`Layer`·`MLP`로 make_moons(100개)를 학습해 훈련 정확도 90% 이상을 달성하고 손실 곡선과 결정경계를 그린다.",
      "학습한 MLP의 파라미터 5개에 대해 역전파 기울기와 중앙차분의 상대오차 표를 만든다.",
      "노드 4~6개짜리 계산 그래프를 직접 설계해 손 계산 표와 `Value` 결과를 비교한다.",
      "(보충) 같은 구조의 NumPy 구현과 정확도·속도를 비교하고, `Value` 구현이 느린 이유를 세 가지 이상 설명한다.",
    ],
    autoTests: [
      {
        id: "w3-at-div",
        taskId: "extend",
        title: "나눗셈의 _backward: ∂(a/b)/∂a = 1/b, ∂(a/b)/∂b = −a/b²",
        code: py`
a, b = Value(1.5), Value(-0.7)
(a / b).backward()
assert abs(a.grad - 1 / -0.7) < 1e-9, f"a.grad = {a.grad}, 기대 {1 / -0.7}"
assert abs(b.grad - (-1.5 / 0.49)) < 1e-9, f"b.grad = {b.grad}, 기대 {-1.5 / 0.49}"
`,
      },
      {
        id: "w3-at-exp",
        taskId: "extend",
        title: "exp의 _backward가 e^x를 누적한다",
        code: py`
import math
x = Value(0.5)
(x.exp() + x.exp()).backward()
assert abs(x.grad - 2 * math.exp(0.5)) < 1e-9, f"x.grad = {x.grad}, 기대 {2 * math.exp(0.5)}"
`,
        hint: "`self.grad += e * out.grad`처럼 `+=`로 누적해야 같은 변수를 두 번 쓴 식에서도 맞습니다.",
      },
      {
        id: "w3-at-mlp",
        taskId: "mlp",
        title: "학습한 MLP의 훈련 정확도 90% 이상, 손실 감소",
        code: py`
_, acc = total_loss(model)
assert acc >= 0.9, f"현재 정확도 {acc:.2f}"
assert len(losses) > 1 and losses[-1] < losses[0], "손실이 줄지 않았습니다."
`,
        hint: "매 스텝 모든 파라미터의 grad를 0으로 되돌렸는지, 갱신을 `p.data -= lr * p.grad`로 했는지 확인하십시오.",
      },
      {
        id: "w3-at-model-grad",
        taskId: "gradcheck",
        title: "MLP 전체 역전파가 수치미분과 일치한다",
        code: py`
params = model.parameters()
for p in params:
    p.grad = 0.0
loss, _ = total_loss(model)
loss.backward()
h = 1e-5
for i in (0, len(params) // 2, len(params) - 1):
    p = params[i]
    orig = p.data
    p.data = orig + h; lp = total_loss(model)[0].data
    p.data = orig - h; lm = total_loss(model)[0].data
    p.data = orig
    num = (lp - lm) / (2 * h)
    rel = abs(p.grad - num) / max(1e-12, abs(p.grad) + abs(num))
    assert rel < 1e-5, f"파라미터 {i}: 역전파 {p.grad:.8f}, 수치미분 {num:.8f}, 상대오차 {rel:.1e}"
`,
      },
    ],
    challenges: [
      {
        id: "w3-ch-softmax-ce",
        title: "Value에 log를 추가해 소프트맥스 교차 엔트로피 만들기",
        tier: "advanced",
        prompt: `
다중 분류 손실을 \`Value\`의 기본 연산만으로 조립합니다. \`exp\`와 \`__truediv__\`는 완성되어 있습니다.

1. \`log()\`의 \`_backward\`: $\\dfrac{d}{dx}\\ln x = \\dfrac{1}{x}$
2. \`softmax_ce(logits, target)\`: \`Value\` 리스트 \`logits\`와 정답 번호를 받아 $-\\ln \\dfrac{e^{z_t}}{\\sum_j e^{z_j}}$를 \`Value\`로 돌려줍니다.

역전파한 \`logits[j].grad\`가 $\\mathrm{softmax}(z)_j - [j = t]$와 같아야 합니다. 2주차 로지스틱 회귀의 $p - y$가 클래스 여러 개로 일반화된 모습입니다.
`,
        starter: VALUE_BASE + py`

    def __truediv__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data / o.data, (self, o), "/")
        def _backward():
            self.grad += out.grad / o.data
            o.grad += -self.data / o.data ** 2 * out.grad
        out._backward = _backward
        return out

    def exp(self):
        e = math.exp(self.data)
        out = Value(e, (self,), "exp")
        def _backward():
            self.grad += e * out.grad
        out._backward = _backward
        return out

    def log(self):
        out = Value(math.log(self.data), (self,), "log")
        def _backward():
            pass  # TODO: d(ln x)/dx = 1/x
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for c in v._prev:
                    build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()

def softmax_ce(logits, target):
    # TODO: exps = [z.exp() for z in logits], 확률 = exps[target] / 합, 손실 = -log(확률)
    return Value(0.0)

logits = [Value(2.0), Value(1.0), Value(0.1)]
loss = softmax_ce(logits, 0)
loss.backward()
print("loss =", round(loss.data, 4), " grads =", [round(z.grad, 4) for z in logits])
`,
        tests: py`
import math

def softmax(zs):
    m = max(zs)
    e = [math.exp(z - m) for z in zs]
    return [v / sum(e) for v in e]

@test("log의 기울기: d(ln x)/dx at x=4 = 0.25")
def _():
    x = Value(4.0)
    x.log().backward()
    assert approx(x.grad, 0.25), f"x.grad = {x.grad}"

@test("손실 값 = -ln softmax(z)[t]")
def _():
    zs = [2.0, 1.0, 0.1]
    loss = softmax_ce([Value(z) for z in zs], 0)
    assert approx(loss.data, -math.log(softmax(zs)[0])), f"결과: {loss.data}"

@test("logits의 기울기 = softmax - 원핫")
def _():
    zs = [0.5, -1.2, 2.0, 0.0]
    vs = [Value(z) for z in zs]
    softmax_ce(vs, 2).backward()
    expect = [p - (1 if j == 2 else 0) for j, p in enumerate(softmax(zs))]
    assert approx([v.grad for v in vs], expect), f"{[round(v.grad, 4) for v in vs]} vs {[round(e, 4) for e in expect]}"

@test("모든 logit이 같으면 손실 = ln(클래스 수)")
def _():
    assert approx(softmax_ce([Value(0.3)] * 1 + [Value(0.3), Value(0.3)], 1).data, math.log(3))
`,
        hints: [
          "`log`의 `_backward`는 `self.grad += out.grad / self.data`입니다.",
          "`exps = [z.exp() for z in logits]`, 합은 `sum(exps[1:], exps[0])`처럼 Value끼리 더합니다(`__radd__`가 있어 `sum(exps)`도 됩니다).",
          "`return -(exps[target] / total).log()`. 기울기가 softmax − 원핫이 되는 것은 연쇄법칙이 자동으로 계산해 줍니다.",
        ],
        solution: VALUE_BASE + py`

    def __truediv__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data / o.data, (self, o), "/")
        def _backward():
            self.grad += out.grad / o.data
            o.grad += -self.data / o.data ** 2 * out.grad
        out._backward = _backward
        return out

    def exp(self):
        e = math.exp(self.data)
        out = Value(e, (self,), "exp")
        def _backward():
            self.grad += e * out.grad
        out._backward = _backward
        return out

    def log(self):
        out = Value(math.log(self.data), (self,), "log")
        def _backward():
            self.grad += out.grad / self.data
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for c in v._prev:
                    build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()

def softmax_ce(logits, target):
    exps = [z.exp() for z in logits]
    total = sum(exps[1:], exps[0])
    return -(exps[target] / total).log()

logits = [Value(2.0), Value(1.0), Value(0.1)]
loss = softmax_ce(logits, 0)
loss.backward()
print("loss =", round(loss.data, 4), " grads =", [round(z.grad, 4) for z in logits])
`,
      },
      {
        id: "w3-ch-deep-grads",
        title: "깊은 망의 층별 기울기 크기 측정과 기울기 클리핑",
        tier: "advanced",
        prompt: `
깊이 20인 MLP에서 기울기가 층을 거슬러 올라가며 어떻게 변하는지 직접 측정합니다.

1. \`layer_grad_norms(depth, width, act, std, seed)\`: 입력(샘플 64개, 특징 width개)을 \`depth\`개의 "선형(표준편차 std, 편향 없음) → 활성화(\`"tanh"\` 또는 \`"relu"\`)" 층에 통과시킨 뒤, 손실 $L = \\text{mean}(\\text{출력})$에서 역전파하며 **각 층 입력에 대한 기울기 $\\partial L/\\partial h_l$의 노름**을 첫 층부터 순서대로 리스트로 돌려줍니다(길이 depth).
2. \`clip_by_norm(g, max_norm)\`: 노름이 \`max_norm\`을 넘으면 방향은 그대로 두고 크기만 \`max_norm\`으로 줄입니다.

tanh에 작은 초기화를 쓰면 앞쪽 층의 기울기가 사라지고, ReLU + He 초기화면 비교적 일정하게 유지되는지 확인합니다.
`,
        starter: py`
import numpy as np

def layer_grad_norms(depth=20, width=64, act="tanh", std=0.1, seed=0):
    rng = np.random.default_rng(seed)
    Ws = [rng.normal(0, std, (width, width)) for _ in range(depth)]
    h = rng.normal(size=(64, width))
    inputs, pre = [], []
    for W in Ws:                         # 순전파: 각 층의 입력 h와 활성화 전 값 z를 기록
        inputs.append(h)
        z = h @ W
        pre.append(z)
        h = np.tanh(z) if act == "tanh" else np.maximum(0, z)
    g = np.ones_like(h) / h.size         # ∂L/∂(출력), L = mean(출력)
    norms = []
    for W, z in zip(reversed(Ws), reversed(pre)):
        # TODO: 활성화의 국소 미분을 곱해 ∂L/∂z를 구하고, W.T를 곱해 ∂L/∂(이 층의 입력)으로 내려보냅니다.
        norms.append(np.linalg.norm(g))
    return norms[::-1]                   # 첫 층부터의 순서로

def clip_by_norm(g, max_norm):
    return g  # TODO

for name, act, std in [("tanh, 작은 초기화", "tanh", 0.1), ("relu, He 초기화", "relu", np.sqrt(2 / 64))]:
    n = layer_grad_norms(act=act, std=std)
    print(f"{name}: 첫 층 {n[0]:.2e}, 마지막 층 {n[-1]:.2e}")
`,
        tests: py`
import numpy as np

@test("길이 = depth, 마지막 층 기울기는 출력 쪽 기울기를 W와 활성화로 한 번 내려보낸 값")
def _():
    n = layer_grad_norms(depth=5, act="relu", std=0.2)
    assert len(n) == 5, f"길이 {len(n)}"
    rng = np.random.default_rng(0)
    Ws = [rng.normal(0, 0.2, (64, 64)) for _ in range(5)]
    h = rng.normal(size=(64, 64))
    for W in Ws[:-1]:
        h = np.maximum(0, h @ W)
    z = h @ Ws[-1]
    g = (np.ones_like(z) / z.size) * (z > 0) @ Ws[-1].T
    assert approx(n[-1], np.linalg.norm(g)), f"{n[-1]} vs {np.linalg.norm(g)}"

@test("tanh + 작은 초기화: 첫 층 기울기가 마지막 층의 1/100 미만(소실)")
def _():
    n = layer_grad_norms(act="tanh", std=0.1)
    assert n[0] / n[-1] < 1e-2, f"비율 {n[0] / n[-1]:.2e}"

@test("relu + He 초기화: 첫 층/마지막 층 비율이 0.05~20 사이")
def _():
    n = layer_grad_norms(act="relu", std=np.sqrt(2 / 64))
    assert 0.05 < n[0] / n[-1] < 20, f"비율 {n[0] / n[-1]:.3f}"

@test("clip_by_norm: 크기만 줄이고 방향은 유지, 작으면 그대로")
def _():
    g = np.array([30.0, 40.0])
    c = clip_by_norm(g, 5.0)
    assert approx(np.linalg.norm(c), 5.0) and approx(c / np.linalg.norm(c), g / 50.0)
    assert approx(clip_by_norm(np.array([0.3, 0.4]), 5.0), [0.3, 0.4])
`,
        hints: [
          "tanh의 국소 미분은 $1 - \\tanh^2(z)$, ReLU는 `(z > 0)`입니다. `g = g * 국소미분`이 $\\partial L / \\partial z$입니다.",
          "`h = z_prev_act @ W`이므로 입력에 대한 기울기는 $\\partial L / \\partial z$에 `W.T`를 곱한 값입니다. `g = g @ W.T`",
          "`norm = np.linalg.norm(g)`, `return g * min(1.0, max_norm / norm)`. 0으로 나누지 않도록 norm이 0이면 그대로 돌려줍니다.",
        ],
        solution: py`
import numpy as np

def layer_grad_norms(depth=20, width=64, act="tanh", std=0.1, seed=0):
    rng = np.random.default_rng(seed)
    Ws = [rng.normal(0, std, (width, width)) for _ in range(depth)]
    h = rng.normal(size=(64, width))
    inputs, pre = [], []
    for W in Ws:
        inputs.append(h)
        z = h @ W
        pre.append(z)
        h = np.tanh(z) if act == "tanh" else np.maximum(0, z)
    g = np.ones_like(h) / h.size
    norms = []
    for W, z in zip(reversed(Ws), reversed(pre)):
        local = 1 - np.tanh(z) ** 2 if act == "tanh" else (z > 0)
        g = (g * local) @ W.T
        norms.append(np.linalg.norm(g))
    return norms[::-1]

def clip_by_norm(g, max_norm):
    norm = np.linalg.norm(g)
    return g if norm == 0 else g * min(1.0, max_norm / norm)

for name, act, std in [("tanh, 작은 초기화", "tanh", 0.1), ("relu, He 초기화", "relu", np.sqrt(2 / 64))]:
    n = layer_grad_norms(act=act, std=std)
    print(f"{name}: 첫 층 {n[0]:.2e}, 마지막 층 {n[-1]:.2e}")
`,
      },
    ],
  },
};

export default week3;
