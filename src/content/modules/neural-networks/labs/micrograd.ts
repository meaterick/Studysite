import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "micrograd의 backward()와 국소 미분 채우기",
    prompt: md`

덧셈·곱셈만 있는 \`Value\`에 세 가지를 직접 구현합니다.

1. \`__pow__(k)\`의 \`_backward\`: $\dfrac{d}{dx}x^k = kx^{k-1}$
2. \`relu()\`의 \`_backward\`: 순전파 출력이 양수일 때만 기울기 통과
3. \`backward()\`: 후위순회로 **위상정렬** 리스트를 만든 뒤, 출력의 grad를 1로 두고 **역순으로** 각 노드의 \`_backward()\`를 호출합니다.

모든 \`_backward\`는 \`=\`가 아니라 \`+=\`로 누적해야 같은 변수를 여러 번 쓰는 식($y = x \cdot x + x$)에서도 맞습니다.
`,
    starter: py`
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
    hints: ["거듭제곱: `self.grad += k * self.data ** (k - 1) * out.grad`. ReLU: `self.grad += (out.data > 0) * out.grad`", "위상정렬: `def build(v):` 안에서 `if v not in seen: seen.add(v); for c in v._prev: build(c); topo.append(v)` 순서로 씁니다. 그리고 `build(self)`를 호출합니다.", "`for v in reversed(topo): v._backward()`. 출력에서 입력 방향으로 가야 각 노드의 grad가 모든 사용처로부터 다 모인 뒤에 부모로 전달됩니다."],
    solution: py`
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
]);
