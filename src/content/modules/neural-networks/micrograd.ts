import { defineLesson, md } from "../../kit";
import exercises from "./labs/micrograd";

export default defineLesson({
  id: "micrograd",
  title: "자동미분 엔진 구현",
  tier: "core",
  concepts: ["backprop-autodiff"],
  goal: "연산자 메서드·클로저·재귀로 만든 Value 클래스가 계산 그래프를 기록하고 위상정렬의 역순으로 `_backward`를 실행하는 과정을 설명하고, 기울기를 `+=`로 누적하는 이유를 계산하며, 이 엔진으로 경사하강법 학습 루프를 구현한다.",
  why: "PyTorch의 자동미분은 연산마다 계산 그래프를 기록하고 `loss.backward()`에서 역순으로 국소 미분을 실행한다. 같은 구조의 엔진을 직접 만들면 `backward()`, `zero_grad()`, 기울기 누적 같은 학습 코드의 동작을 정확히 설명할 수 있고([[lesson:pytorch]]), 트랙 과제에서 이 엔진으로 MLP를 학습한다.",
  body: md`
### 이 레슨에서 쓰는 파이썬 문법

엔진은 트랙 1의 클래스([[lesson:classes-objects]])와 함수([[lesson:functions-scope]])에 세 가지 문법을 더해 쓴다.

- **연산자 메서드**: \`a + b\`를 실행하면 파이썬은 \`a.__add__(b)\`를 호출한다. 클래스에 \`__add__\`, \`__mul__\`을 정의하면 그 클래스의 객체끼리 \`+\`, \`*\`를 쓸 수 있다.
- **클로저**: 함수 안에서 정의한 함수는 바깥 함수의 변수를 참조할 수 있고, 바깥 함수가 끝난 뒤에도 그 참조가 유지된다.
- **재귀**: 함수가 자기 자신을 다시 호출한다. 더 이상 호출하지 않고 끝나는 조건이 있어야 한다.

\`\`\`python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __add__(self, other):                  # p1 + p2 를 실행하면 p1.__add__(p2) 가 호출된다
        return Point(self.x + other.x, self.y + other.y)
    def __repr__(self):
        return f"Point({self.x}, {self.y})"
print(Point(1, 2) + Point(3, 4))               # Point(4, 6)

def make_adder(n):
    def add(x):                                # 바깥 변수 n을 참조하는 안쪽 함수(클로저)
        return x + n
    return add                                 # 함수를 실행하지 않고 돌려준다
add5 = make_adder(5)
print(add5(10))                                # 15: make_adder가 끝난 뒤에도 n = 5를 쓴다

def depth(tree):                               # 중첩 리스트의 깊이를 재귀로 계산
    if not tree:                               # 끝나는 조건
        return 0
    return 1 + max(depth(child) for child in tree)
print(depth([[], [[]], [[[]]]]))               # 3
\`\`\`

[[diagram:closure-recursion]]

### Value 클래스

**Value** 객체는 숫자 하나(\`data\`), 손실에 대한 기울기(\`grad\`), 이 값을 만든 입력 노드(\`_prev\`), 그리고 기울기가 도착했을 때 입력 노드로 기울기를 보내는 함수(\`_backward\`)를 가진다. \`__add__\`와 \`__mul__\`은 결과 노드를 만들면서 \`_backward\`를 바로 실행하지 않고 클로저로 저장해 둔다. 순전파 시점에는 결과 노드의 기울기 \`out.grad\`를 아직 모르기 때문이다. \`out.grad\`는 손실을 계산하고 역전파가 이 노드에 도달해야 정해지므로, 계산 방법만 저장해 두었다가 그때 실행한다. PyTorch도 연산마다 기울기 함수(\`grad_fn\`)를 저장해 두었다가 \`loss.backward()\`에서 차례로 실행한다.

\`\`\`python
class Value:
    def __init__(self, data, _children=()):
        self.data, self.grad = data, 0.0           # grad: 손실에 대한 이 값의 기울기
        self._prev = set(_children)                # 이 값을 만든 입력 노드
        self._backward = lambda: None              # 입력 노드로 기울기를 보내는 함수

    def __add__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data + o.data, (self, o))
        def _backward():                           # 덧셈: 기울기를 그대로 보낸다
            self.grad += out.grad
            o.grad += out.grad
        out._backward = _backward                  # 실행하지 않고 저장만 한다
        return out

    def __mul__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data * o.data, (self, o))
        def _backward():                           # 곱셈: 상대 입력의 값을 곱해 보낸다
            self.grad += o.data * out.grad
            o.grad += self.data * out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0, self.data), (self,))
        def _backward():                           # 출력이 양수일 때만 기울기를 보낸다
            self.grad += (out.data > 0) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()
        def build(v):                              # 입력 노드를 먼저 넣고 자신을 넣는다(위상정렬)
            if v not in seen:
                seen.add(v)
                for c in v._prev:
                    build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0                            # dL/dL = 1
        for v in reversed(topo):                   # 손실에서 입력 쪽으로
            v._backward()

a, b = Value(2.0), Value(-3.0)
L = (a * b + 10).relu()
L.backward()
print(L.data, a.grad, b.grad)                      # 4.0 -3.0 2.0
\`\`\`

순전파는 $ab = -6$, $ab + 10 = 4$, $\mathrm{relu}(4) = 4$다. 역전파는 \`L.grad = 1\`에서 시작해, ReLU 노드는 출력이 양수이므로 1을 그대로 보내고, 덧셈 노드는 $ab$와 10에 1을 보내며, 곱셈 노드는 \`a.grad\`에 $b \times 1 = -3$, \`b.grad\`에 $a \times 1 = 2$를 더한다.

**위상정렬이 필요한 이유**: 한 노드의 \`_backward\`를 실행하려면 그 노드의 \`grad\`가 확정되어 있어야 하고, 그러려면 그 노드를 입력으로 쓰는 모든 노드의 \`_backward\`가 먼저 끝나 있어야 한다. \`build\`는 입력 노드를 모두 넣은 뒤에 자신을 넣으므로, \`topo\`에서 모든 노드는 자신의 입력 노드보다 뒤에 있다. 이 순서를 뒤집어 실행하면 각 노드에 도달했을 때 그 노드를 쓰는 노드의 기울기가 모두 더해져 있다.

[[diagram:micrograd-topo]]

**기울기를 \`+=\`로 누적하는 이유**: 한 값이 여러 노드의 입력으로 쓰이면 기울기는 경로별 기울기의 합이다([[lesson:backprop]]). $y = x \cdot x + x$에서 $x = 3$이면 $\partial y / \partial x = 2x + 1 = 7$이다. 덧셈 노드가 1을, 곱셈 노드가 두 피연산자 몫으로 3을 두 번 더해 7이 된다. \`=\`로 덮어쓰면 마지막에 실행된 경로의 값만 남는다.

[[diagram:grad-accumulate]]

micrograd와 PyTorch는 손실에서 입력 쪽으로 기울기를 계산하는 **역방향 모드** 자동미분이다. 입력 쪽에서 계산하는 순방향 모드와의 차이와 메모리 사용량은 [[lesson:autodiff-theory]]에서 다룬다.

### 엔진으로 학습 루프 만들기

다음 셀은 위 Value에 뺄셈을 더한 축약판으로, 데이터 $y = 2x + 1$에서 $w$와 $b$를 경사하강법으로 찾는다. 미분 공식을 직접 쓰지 않아도, 손실을 Value 연산으로 계산하고 \`loss.backward()\`를 부르면 \`w.grad\`와 \`b.grad\`가 채워진다. [[lesson:loss-functions]]에서 기울기를 손으로 쓴 학습 루프와 비교한다.

\`\`\`python
class Value:
    def __init__(self, data, _children=()):
        self.data, self.grad = data, 0.0
        self._prev, self._backward = set(_children), lambda: None
    def __add__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data + o.data, (self, o))
        def _backward():
            self.grad += out.grad; o.grad += out.grad
        out._backward = _backward
        return out
    def __mul__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data * o.data, (self, o))
        def _backward():
            self.grad += o.data * out.grad; o.grad += self.data * out.grad
        out._backward = _backward
        return out
    def __sub__(self, o):
        return self + (o * -1 if isinstance(o, Value) else Value(-o))
    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for c in v._prev: build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo): v._backward()

data = [(0.0, 1.0), (1.0, 3.0), (2.0, 5.0), (3.0, 7.0)]    # y = 2x + 1
w, b = Value(0.0), Value(0.0)
for step in range(200):
    loss = Value(0.0)
    for x, y in data:
        err = w * x + b - y
        loss = loss + err * err
    loss = loss * (1 / len(data))           # 평균제곱오차
    w.grad, b.grad = 0.0, 0.0               # 기울기가 += 로 누적되므로 매 반복 0으로 되돌린다
    loss.backward()
    w.data -= 0.05 * w.grad                 # 경사하강법 갱신
    b.data -= 0.05 * b.grad
    if step in (0, 1, 199):
        print(f"step {step:3d}: loss={loss.data:.4f}, w={w.data:.3f}, b={b.data:.3f}")
\`\`\`

손실이 21에서 시작해 200번 반복 뒤에는 $w = 2$, $b = 1$에 도달한다. 반복마다 \`w.grad, b.grad = 0.0, 0.0\`을 하지 않으면 이전 반복의 기울기가 쌓여 갱신량이 계속 커지므로 학습이 수렴하지 않는다. PyTorch의 \`optimizer.zero_grad()\`가 이 줄에 해당한다.
`,
  checks: [
    {
      key: "c1",
      question: "Value의 `_backward`를 연산 시점에 바로 실행하지 않고 클로저로 저장해두는 이유는?",
      choices: ["메모리를 아끼려고", "순전파 시점에는 아직 `out.grad`(상류 기울기)를 모르기 때문에", "파이썬 문법상 어쩔 수 없어서", "속도를 높이려고"],
      answer: 1,
      explanation: "상류 기울기는 손실이 계산된 뒤 역전파가 그 노드에 도착해야 정해진다. 그래서 \"나중에 이렇게 계산하라\"는 방법만 저장해둔다(지연 계산).",
    },
    {
      key: "c2",
      question: "$y = x \\cdot x + x$에서 $x = 3$일 때, `_backward`가 `+=` 대신 `=`로 기울기를 덮어쓰면 생기는 문제는?",
      choices: ["아무 문제 없다", "$x$가 여러 경로로 쓰였는데 마지막 경로의 기울기만 남아 7이 아닌 틀린 값이 나온다", "프로그램이 멈춘다", "기울기가 항상 0이 된다"],
      answer: 1,
      explanation: "한 변수가 여러 경로에 쓰이면 각 경로의 기울기를 더해야 한다(다변수 연쇄법칙). 덮어쓰면 일부 경로의 기여가 사라진다.",
    },
    {
      key: "c3",
      question: "$\\tanh$ 노드의 국소 미분은? ($t = \\tanh z$)",
      choices: ["$t$", "$1 - t^2$", "$1 + t^2$", "$\\cosh z$"],
      answer: 1,
      explanation: "$\\frac{d}{dz}\\tanh z = 1 - \\tanh^2 z$. 이 식으로 채운 역전파는 수치미분과 $10^{-11}$ 수준까지 일치한다.",
    },
    {
      key: "c4",
      question: "Value로 만든 학습 루프에서 매 스텝 `w.grad = 0.0`으로 되돌리지 않으면 어떻게 되는가?",
      choices: ["기울기가 `+=`로 이전 스텝 값 위에 쌓여 갈수록 커지고 학습이 불안정해진다", "기울기가 항상 0이 된다", "아무 차이가 없다", "순전파가 계산되지 않는다"],
      answer: 0,
      explanation: "`_backward`는 기울기를 누적한다(여러 경로를 합치기 위해). 스텝이 바뀌면 지난 기울기는 버려야 하므로 0으로 초기화한다. PyTorch의 `zero_grad()`와 같은 역할이다.",
    },
    {
      key: "c5",
      question: "`loss.backward()`를 호출한 직후 채워지는 것은?",
      choices: ["그래프에 있는 모든 Value의 `.grad`(손실에 대한 기울기)", "모든 Value의 `.data`", "갱신된 파라미터 값", "새 계산 그래프"],
      answer: 0,
      explanation: "`backward()`는 기울기만 계산한다. 파라미터를 바꾸는 것은 그 뒤의 갱신 코드(`w.data -= lr * w.grad`)이고, PyTorch에서는 `optimizer.step()`이 맡는다.",
    },
    {
      key: "c6",
      question: "`Value.__mul__`에서 `out._backward = _backward` 줄을 빠뜨린 채 `L = (a * b + c).relu()`에 `L.backward()`를 실행하면?",
      choices: ["오류가 나서 실행이 멈춘다", "`c.grad`는 정상이지만 `a.grad`, `b.grad`는 0으로 남는다", "모든 grad가 0이 된다", "결과는 정상이다. `backward()`가 알아서 곱셈 규칙을 적용한다"],
      answer: 1,
      explanation: "`Value`는 생성될 때 `_backward = lambda: None`으로 시작한다. 곱셈 결과 노드에 클로저를 저장하지 않으면, 역전파가 그 노드에 도달해도 입력 노드(a, b)로 기울기를 보내지 않는다. 덧셈 노드를 거친 `c`까지는 정상이다. 오류 없이 틀린 값이 나오므로 기울기 검사가 필요하다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "micrograd의 Value 클래스에서 backward()가 _backward()를 실행하기 전에 위상정렬(topo)을 먼저 하는 이유는 무엇인가?",
      answer: md`
어떤 노드의 grad를 확정하려면 그 노드의 출력을 사용한 모든 하위 노드들의 backward가 먼저 끝나 있어야 하기 때문이다. 위상정렬 없이 임의 순서로 실행하면 아직 일부 경로의 기울기가 도착하기 전에 grad를 완성된 값처럼 써버리는 오류가 생긴다.
`,
      keyPoints: [
        "한 노드의 grad는 그 노드를 쓰는 모든 노드의 _backward가 끝나야 확정된다",
        "build는 입력 노드를 먼저 넣고 자신을 넣는다(위상정렬)",
        "그 역순으로 실행하면 각 노드에 도달했을 때 기울기가 모두 더해져 있다",
        "순서가 틀리면 일부 경로의 기울기가 빠진 값을 쓴다",
      ],
    },
    {
      key: "d2",
      question: "`x = Value(3.0); y = x * x + x; y.backward()`에서 `x.grad`가 7이 되는 과정을, 계산 그래프의 노드와 `_backward` 호출 순서로 설명하라. `+=` 대신 `=`를 쓰면 몇이 되는지도 쓰라.",
      answer: md`
그래프는 $m = x \cdot x$(곱셈), $y = m + x$(덧셈) 두 노드다. 위상정렬 역순으로 먼저 $y$의 grad를 1로 두고 덧셈 노드의 \`_backward\`가 $m$과 $x$에 각각 1을 더한다(x.grad = 1). 다음으로 곱셈 노드의 \`_backward\`가 실행되는데, 두 피연산자가 모두 $x$라서 \`self.grad += o.data * out.grad\`(3)와 \`o.grad += self.data * out.grad\`(3)가 같은 $x$에 두 번 더해져 1 + 3 + 3 = 7이 된다. \`=\`를 쓰면 마지막 대입만 남아 덧셈 경로의 1이 지워지고 3이 된다. 같은 변수가 여러 경로로 쓰일 때 기울기는 모든 경로의 합이라는 연쇄법칙을 \`+=\`가 구현한다.
`,
      keyPoints: ["그래프: $m = x \\cdot x$, $y = m + x$", "덧셈 노드가 x에 1을 보낸다", "곱셈 노드가 x에 3을 두 번 보낸다", "합 7(경로별 기울기의 합), =를 쓰면 3만 남는다"],
    },
  ],
  references: [
    { title: "Andrej Karpathy — micrograd (GitHub)", url: "https://github.com/karpathy/micrograd", note: "본문 Value 클래스의 원본 저장소 (영문)" },
    { title: "Karpathy — Neural Networks: Zero to Hero, 1강", url: "https://karpathy.ai/zero-to-hero.html", note: "micrograd를 처음부터 만드는 강의 영상 (영문)" },
  ],
});
