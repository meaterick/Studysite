import type { AssignmentSpec } from "../types";

// 3주차 과제: 미니 자동미분 엔진을 확장하고, 그 엔진으로 MLP를 학습한 뒤 NumPy 벡터화 구현과 비교한다.
const VALUE_CLASS = `import math, random

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

    def __pow__(self, k):  # k는 상수 지수
        out = Value(self.data ** k, (self,), f"**{k}")
        def _backward():
            self.grad += k * self.data ** (k - 1) * out.grad
        out._backward = _backward
        return out

    def __truediv__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data / o.data, (self, o), "/")
        def _backward():
            pass  # TODO: ∂(a/b)/∂a, ∂(a/b)/∂b 를 유도해 self.grad, o.grad에 누적합니다.
        out._backward = _backward
        return out

    def exp(self):
        e = math.exp(self.data)
        out = Value(e, (self,), "exp")
        def _backward():
            pass  # TODO: d(e^x)/dx 를 이용해 self.grad에 누적합니다.
        out._backward = _backward
        return out

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")
        def _backward():
            self.grad += (1 - t ** 2) * out.grad
        out._backward = _backward
        return out

    def __neg__(self): return self * -1
    def __sub__(self, o): return self + (-o if isinstance(o, Value) else Value(-o))
    def __radd__(self, o): return self + o
    def __rmul__(self, o): return self * o
    def __rtruediv__(self, o): return Value(o) / self
    def __repr__(self): return f"Value(data={self.data:.4f}, grad={self.grad:.4f})"

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

# ── 검증: f(a, b) = exp(a) / b 의 기울기를 수치미분과 비교합니다 ──
def check(fn, a0, b0, h=1e-6):
    a, b = Value(a0), Value(b0)
    out = fn(a, b)
    out.backward()
    raw = lambda x, y: fn(Value(x), Value(y)).data
    num_a = (raw(a0 + h, b0) - raw(a0 - h, b0)) / (2 * h)
    num_b = (raw(a0, b0 + h) - raw(a0, b0 - h)) / (2 * h)
    for name, g, n in (("a", a.grad, num_a), ("b", b.grad, num_b)):
        rel = abs(g - n) / max(1e-12, abs(g) + abs(n))
        print(f"  ∂f/∂{name}: 역전파 {g: .6f}, 수치미분 {n: .6f}, 상대오차 {rel:.1e}", "✓" if rel < 1e-5 else "✗")

print("f = exp(a) / b")
check(lambda a, b: a.exp() / b, 0.5, 2.0)
print("f = (a * b) / (a + b)")
check(lambda a, b: (a * b) / (a + b), 1.5, -0.7)
`;

const week3Assignment: AssignmentSpec = {
  title: "미니 자동미분 엔진으로 MLP 학습하기",
  summary: `
「미니 자동미분 엔진」 단계의 \`Value\` 클래스에 나눗셈과 지수 함수를 추가하고, 이 엔진만으로 MLP를 만들어 make_moons 데이터를 분류합니다. gradient check로 구현을 검증하고, 같은 모델을 NumPy 행렬 연산으로 구현한 버전과 속도·정확도를 비교합니다.
`,
  tasks: [
    {
      id: "extend",
      title: "Value에 나눗셈과 exp 추가하기",
      instructions: `
코드 셀의 \`__truediv__\`와 \`exp\`에서 \`_backward\`의 \`TODO\`를 채웁니다. 순전파는 이미 구현되어 있습니다. 실행하면 셀 아래쪽 검증 코드가 수치미분과 비교해 ✓ 또는 ✗를 표시합니다. 모든 항목에 ✓가 붙어야 합니다.

힌트: $\\frac{\\partial}{\\partial a}\\frac{a}{b} = \\frac{1}{b}$, $\\frac{\\partial}{\\partial b}\\frac{a}{b} = -\\frac{a}{b^2}$, $\\frac{d}{dx}e^x = e^x$. $a/b = a \\cdot b^{-1}$로 바꿔 기존 연산을 재사용하는 방법도 있습니다.
`,
      cells: [
        { kind: "code", id: "extend-code", label: "Value 클래스와 검증", starter: VALUE_CLASS },
        {
          kind: "text",
          id: "extend-derivation",
          prompt: "나눗셈과 exp의 국소 미분을 유도 과정과 함께 적고, 코드의 어느 줄에 대응하는지 설명해 주십시오.",
          minChars: 80,
        },
      ],
    },
    {
      id: "mlp",
      title: "Value로 만든 MLP로 make_moons 분류하기",
      instructions: `
\`Neuron\`, \`Layer\`, \`MLP\` 클래스는 제공합니다. 학습 루프의 \`TODO\` 두 곳(기울기 초기화와 파라미터 갱신)을 채운 뒤 실행합니다. 권장 설정(샘플 100개, 은닉층 8개 2층, tanh, 학습률 0.3, 60에폭, 전체 배치)에서 **훈련 정확도 90% 이상**이면 통과입니다. 실행에는 20~40초 정도 걸립니다.

정확도가 90%에 못 미치면 ① 학습률이 적절한지, ② 매 스텝 \`grad\`를 0으로 초기화했는지, ③ 가중치를 무작위로 초기화했는지, ④ 손실이 실제로 줄고 있는지를 순서대로 확인하고, 무엇을 고쳤는지 답안에 적습니다.
`,
      cells: [
        {
          kind: "code",
          id: "mlp-code",
          label: "MLP 정의와 학습",
          starter: `import numpy as np
from sklearn.datasets import make_moons

random.seed(0)
X, y = make_moons(n_samples=100, noise=0.1, random_state=0)
Y = [1.0 if t == 1 else -1.0 for t in y]  # tanh 출력에 맞춰 레이블을 ±1로 바꿉니다.

class Neuron:
    def __init__(self, n_in, act=True):
        self.w = [Value(random.uniform(-1, 1)) for _ in range(n_in)]
        self.b = Value(0.0)
        self.act = act
    def __call__(self, x):
        z = sum((wi * xi for wi, xi in zip(self.w, x)), self.b)
        return z.tanh() if self.act else z
    def parameters(self):
        return self.w + [self.b]

class Layer:
    def __init__(self, n_in, n_out, act=True):
        self.neurons = [Neuron(n_in, act) for _ in range(n_out)]
    def __call__(self, x):
        out = [n(x) for n in self.neurons]
        return out[0] if len(out) == 1 else out
    def parameters(self):
        return [p for n in self.neurons for p in n.parameters()]

class MLP:
    def __init__(self, n_in, hidden):
        sizes = [n_in] + hidden + [1]
        self.layers = [Layer(sizes[i], sizes[i + 1], act=True) for i in range(len(sizes) - 1)]
    def __call__(self, x):
        for layer in self.layers:
            x = layer(x)
        return x
    def parameters(self):
        return [p for layer in self.layers for p in layer.parameters()]

def total_loss(model):
    preds = [model(list(x)) for x in X]
    loss = sum(((p - t) ** 2 for p, t in zip(preds, Y)), Value(0.0)) / len(Y)
    acc = np.mean([(p.data > 0) == (t > 0) for p, t in zip(preds, Y)])
    return loss, acc

model = MLP(2, [8, 8])
print("파라미터 수:", len(model.parameters()))
lr, epochs = 0.3, 60
losses = []
for epoch in range(epochs):
    loss, acc = total_loss(model)
    # TODO ①: 모든 파라미터의 grad를 0으로 초기화합니다.
    loss.backward()
    # TODO ②: 경사하강법으로 모든 파라미터의 data를 갱신합니다.
    losses.append(loss.data)
    if epoch % 10 == 0 or epoch == epochs - 1:
        print(f"epoch {epoch:3d}: loss = {loss.data:.4f}, 정확도 = {acc:.2f}")
`,
        },
        {
          kind: "code",
          id: "mlp-plot",
          label: "손실 곡선과 결정경계",
          starter: `import matplotlib.pyplot as plt

def predict_np(model, pts):
    # Value 대신 NumPy로 같은 순전파를 계산해 격자 전체를 빠르게 예측합니다.
    h = pts
    for layer in model.layers:
        W = np.array([[w.data for w in n.w] for n in layer.neurons])
        b = np.array([n.b.data for n in layer.neurons])
        h = np.tanh(h @ W.T + b)
    return h[:, 0]

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].plot(losses)
axes[0].set_title("Training loss")
axes[0].set_xlabel("epoch")
xx, yy = np.meshgrid(np.linspace(-1.5, 2.5, 120), np.linspace(-1, 1.5, 120))
zz = predict_np(model, np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)
axes[1].contourf(xx, yy, zz > 0, alpha=0.3, cmap="coolwarm")
axes[1].scatter(X[:, 0], X[:, 1], c=y, cmap="coolwarm", edgecolors="k", s=20)
axes[1].set_title("Decision boundary")
plt.show()
`,
        },
        {
          kind: "text",
          id: "mlp-answer",
          prompt: "최종 정확도와 학습 과정을 요약해 주십시오. 90%에 못 미쳤던 적이 있다면 원인과 해결 과정을 적습니다.",
          minChars: 100,
        },
      ],
    },
    {
      id: "gradcheck",
      title: "MLP 전체에 대한 gradient check",
      instructions: `
학습한 MLP에서 파라미터 5개를 무작위로 골라, 역전파 기울기와 중앙차분 수치미분 $\\frac{L(\\theta + h) - L(\\theta - h)}{2h}$의 상대오차를 표로 출력합니다. 코드 셀의 \`TODO\`를 채웁니다. 상대오차가 $10^{-5}$를 넘는 항목이 있다면 원인을 찾아 고치고 과정을 답안에 적습니다.
`,
      cells: [
        {
          kind: "code",
          id: "gradcheck-code",
          label: "파라미터 5개 gradient check",
          starter: `params = model.parameters()
for p in params:
    p.grad = 0.0
loss, _ = total_loss(model)
loss.backward()

h = 1e-5
rng_check = random.Random(1)
print(f"{'#':>4}{'역전파':>14}{'수치미분':>14}{'상대오차':>12}")
for i in rng_check.sample(range(len(params)), 5):
    p = params[i]
    original = p.data
    num = 0.0  # TODO: p.data를 original ± h로 바꿔 total_loss(model)[0].data를 두 번 계산해 중앙차분을 구합니다.
    p.data = original
    rel = abs(p.grad - num) / max(1e-12, abs(p.grad) + abs(num))
    print(f"{i:>4}{p.grad:>14.8f}{num:>14.8f}{rel:>12.1e}", "✓" if rel < 1e-5 else "✗")
`,
        },
        {
          kind: "text",
          id: "gradcheck-answer",
          prompt: "gradient check 결과를 해석해 주십시오. 실패한 항목이 있었다면 원인과 수정 내용을 적습니다.",
          minChars: 60,
        },
      ],
    },
    {
      id: "graph",
      title: "나만의 계산 그래프 손으로 풀기",
      instructions: `
노드 4~6개로 이루어진 계산 그래프를 직접 설계합니다. 곱셈, 덧셈, 거듭제곱 중 두 종류 이상을 사용해야 합니다. 답안 칸에 순전파 값과 모든 노드의 역전파 기울기를 표로 정리하고, 코드 셀에서 \`Value\`로 같은 계산을 재현해 손으로 구한 값과 일치하는지 확인합니다.
`,
      cells: [
        {
          kind: "text",
          id: "graph-hand",
          prompt: "계산 그래프의 식, 각 노드의 순전파 값, 역전파 기울기를 표로 정리해 주십시오.",
          template: `식: 

| 노드 | 정의 | 순전파 값 | ∂L/∂(노드) |
| --- | --- | --- | --- |
|  |  |  |  |
`,
          minChars: 140,
        },
        {
          kind: "code",
          id: "graph-code",
          label: "Value로 재현",
          starter: `# 예시: L = (a * b + c) ** 2: 자신의 그래프로 바꿔 작성합니다.
a, b, c = Value(2.0), Value(-1.5), Value(0.5)
d = a * b
e = d + c
L = e ** 2
L.backward()
for name, v in (("a", a), ("b", b), ("c", c), ("d", d), ("e", e), ("L", L)):
    print(f"{name}: data = {v.data: .4f}, grad = {v.grad: .4f}")
`,
        },
      ],
    },
    {
      id: "numpy",
      title: "NumPy 벡터화 구현과 비교하기",
      instructions: `
같은 구조(2 → 8 → 8 → 1, tanh)의 MLP를 NumPy 행렬 연산으로 학습해 정확도와 학습 시간을 \`Value\` 구현과 비교합니다. 코드 셀의 \`backward\` 함수는 완성되어 있으니 한 줄씩 읽고 각 줄이 어떤 연쇄법칙에 해당하는지 확인합니다. 그런 다음 \`Value\` 구현이 느린 이유를 세 가지 이상 적습니다.
`,
      cells: [
        {
          kind: "code",
          id: "numpy-code",
          label: "NumPy MLP와 속도 비교",
          starter: `import time

def train_numpy(X, Y, hidden=8, lr=0.3, epochs=60, seed=0):
    rng = np.random.default_rng(seed)
    T = np.array(Y).reshape(-1, 1)
    W1, b1 = rng.uniform(-1, 1, (2, hidden)), np.zeros(hidden)
    W2, b2 = rng.uniform(-1, 1, (hidden, hidden)), np.zeros(hidden)
    W3, b3 = rng.uniform(-1, 1, (hidden, 1)), np.zeros(1)
    for _ in range(epochs):
        h1 = np.tanh(X @ W1 + b1)
        h2 = np.tanh(h1 @ W2 + b2)
        out = np.tanh(h2 @ W3 + b3)
        d3 = 2 * (out - T) / len(X) * (1 - out ** 2)
        d2 = (d3 @ W3.T) * (1 - h2 ** 2)
        d1 = (d2 @ W2.T) * (1 - h1 ** 2)
        W3 -= lr * h2.T @ d3; b3 -= lr * d3.sum(0)
        W2 -= lr * h1.T @ d2; b2 -= lr * d2.sum(0)
        W1 -= lr * X.T @ d1;  b1 -= lr * d1.sum(0)
    return np.mean((out[:, 0] > 0) == (T[:, 0] > 0))

t0 = time.perf_counter()
acc_np = train_numpy(X, Y)
t_np = time.perf_counter() - t0

t0 = time.perf_counter()
_ = total_loss(model)[0].backward()
t_value_step = time.perf_counter() - t0

print(f"NumPy  : 60에폭 {t_np * 1000:.1f} ms, 정확도 {acc_np:.2f}")
print(f"Value  : 1에폭(순전파+역전파) {t_value_step * 1000:.1f} ms → 60에폭 약 {t_value_step * 60:.1f} s")
print(f"속도 차이: 약 {t_value_step * 60 / max(t_np, 1e-9):.0f}배")
`,
        },
        {
          kind: "text",
          id: "numpy-answer",
          prompt: "두 구현의 정확도와 속도를 비교하고, Value 구현이 느린 이유를 세 가지 이상 설명해 주십시오.",
          minChars: 150,
        },
      ],
    },
    {
      id: "advanced",
      title: "심화: 최적화기 비교·깊은 망의 기울기",
      optional: true,
      instructions: `
다음 중 하나 이상을 골라 실험합니다.

- SGD, Momentum, Adam을 NumPy MLP에 직접 구현해 손실 곡선을 한 그래프로 비교합니다. 최적화기마다 학습률을 따로 조정했는지 밝힙니다.
- ReLU와 tanh를 쓴 20층 네트워크에서 층별 기울기 크기를 그려 기울기 소실·폭발을 관찰합니다.
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: `# 선택한 심화 실험을 이 셀에서 진행합니다.\n` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "derivation", label: "국소 미분 유도의 정확성", points: 2, guide: "나눗셈·exp의 국소 미분과 직접 설계한 계산 그래프의 역전파가 정확합니다." },
    { id: "gradcheck", label: "구현 정확성", points: 3, guide: "확장한 Value와 MLP 전체의 gradient check를 통과했습니다." },
    { id: "mlp", label: "MLP 학습과 문제 해결 과정", points: 2, guide: "훈련 정확도 90% 이상을 달성하고, 손실 곡선·결정경계와 문제 해결 과정을 제시했습니다." },
    { id: "compare", label: "NumPy 구현 비교와 해석", points: 2, guide: "속도·정확도를 수치로 비교하고, Value 구현이 느린 이유를 구체적으로 설명했습니다." },
    { id: "quality", label: "코드 품질과 가독성", points: 1, guide: "코드와 답안이 읽기 쉽고, 모든 셀이 처음부터 순서대로 실행됩니다." },
  ],
};

export default week3Assignment;
