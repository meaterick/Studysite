import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "autograd-mlp",
  kind: "module",
  title: "미니 자동미분 엔진으로 MLP 학습하기",
  summary: md`

「미니 자동미분 엔진」 단계의 \`Value\` 클래스에 나눗셈과 지수 함수를 추가하고, 이 엔진만으로 MLP를 만들어 make_moons 데이터를 분류합니다. gradient check로 구현을 검증하고, 같은 모델을 NumPy 행렬 연산으로 구현한 버전과 속도·정확도를 비교합니다.

**핵심** 항목 네 개(Value 확장·MLP 학습·gradient check·계산 그래프)는 핵심 과정만으로 풀 수 있고, 채점 기준은 이 네 항목만 봅니다. **보충**(NumPy 벡터화 비교)과 **심화** 항목은 선택이며 점수 대신 피드백을 받습니다.
`,
  requirements: [
    "`Value`의 `__truediv__`와 `exp`의 `_backward`를 완성해, 두 검증 식 모두 상대오차 $10^{-5}$ 미만(✓)을 받는다.",
    "`Neuron`·`Layer`·`MLP`로 make_moons(100개)를 학습해 훈련 정확도 90% 이상을 달성하고 손실 곡선과 결정경계를 그린다.",
    "학습한 MLP의 파라미터 5개에 대해 역전파 기울기와 중앙차분의 상대오차 표를 만든다.",
    "노드 4~6개짜리 계산 그래프를 직접 설계해 손 계산 표와 `Value` 결과를 비교한다.",
    "(보충) 같은 구조의 NumPy 구현과 정확도·속도를 비교하고, `Value` 구현이 느린 이유를 세 가지 이상 설명한다.",
  ],
  tasks: [
    {
      id: "extend",
      title: "Value에 나눗셈과 exp 추가하기",
      tier: "core",
      instructions: md`

코드 셀의 \`__truediv__\`와 \`exp\`에서 \`_backward\`의 \`TODO\`를 채웁니다. 순전파는 이미 구현되어 있습니다. 실행하면 셀 아래쪽 검증 코드가 수치미분과 비교해 ✓ 또는 ✗를 표시합니다. 모든 항목에 ✓가 붙어야 합니다.

힌트: $\frac{\partial}{\partial a}\frac{a}{b} = \frac{1}{b}$, $\frac{\partial}{\partial b}\frac{a}{b} = -\frac{a}{b^2}$, $\frac{d}{dx}e^x = e^x$. $a/b = a \cdot b^{-1}$로 바꿔 기존 연산을 재사용하는 방법도 있습니다.
`,
      cells: [
        { kind: "code", id: "extend-code", label: "Value 클래스와 검증", starter: py`
import math, random

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
` },
        { kind: "text", id: "extend-derivation", prompt: "나눗셈과 exp의 국소 미분을 유도 과정과 함께 적고, 코드의 어느 줄에 대응하는지 설명해 주십시오.", minChars: 80 },
      ],
    },
    {
      id: "mlp",
      title: "Value로 만든 MLP로 make_moons 분류하기",
      tier: "core",
      instructions: md`

\`Neuron\`, \`Layer\`, \`MLP\` 클래스는 제공합니다. 학습 루프의 \`TODO\` 두 곳(기울기 초기화와 파라미터 갱신)을 채운 뒤 실행합니다. 권장 설정(샘플 100개, 은닉층 8개 2층, tanh, 학습률 0.3, 60에폭, 전체 배치)에서 **훈련 정확도 90% 이상**이면 통과입니다. 실행에는 20~40초 정도 걸립니다.

정확도가 90%에 못 미치면 ① 학습률이 적절한지, ② 매 스텝 \`grad\`를 0으로 초기화했는지, ③ 가중치를 무작위로 초기화했는지, ④ 손실이 실제로 줄고 있는지를 순서대로 확인하고, 무엇을 고쳤는지 답안에 적습니다.
`,
      cells: [
        { kind: "code", id: "mlp-code", label: "MLP 정의와 학습", starter: py`
import numpy as np
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
` },
        { kind: "code", id: "mlp-plot", label: "손실 곡선과 결정경계", starter: py`
import matplotlib.pyplot as plt

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
` },
        { kind: "text", id: "mlp-answer", prompt: "최종 정확도와 학습 과정을 요약해 주십시오. 90%에 못 미쳤던 적이 있다면 원인과 해결 과정을 적습니다.", minChars: 100 },
      ],
    },
    {
      id: "gradcheck",
      title: "MLP 전체에 대한 gradient check",
      tier: "core",
      instructions: md`

학습한 MLP에서 파라미터 5개를 무작위로 골라, 역전파 기울기와 중앙차분 수치미분 $\frac{L(\theta + h) - L(\theta - h)}{2h}$의 상대오차를 표로 출력합니다. 코드 셀의 \`TODO\`를 채웁니다. 상대오차가 $10^{-5}$를 넘는 항목이 있다면 원인을 찾아 고치고 과정을 답안에 적습니다.
`,
      cells: [
        { kind: "code", id: "gradcheck-code", label: "파라미터 5개 gradient check", starter: py`
params = model.parameters()
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
` },
        { kind: "text", id: "gradcheck-answer", prompt: "gradient check 결과를 해석해 주십시오. 실패한 항목이 있었다면 원인과 수정 내용을 적습니다.", minChars: 60 },
      ],
    },
    {
      id: "graph",
      title: "나만의 계산 그래프 손으로 풀기",
      tier: "core",
      instructions: md`

노드 4~6개로 이루어진 계산 그래프를 직접 설계합니다. 곱셈, 덧셈, 거듭제곱 중 두 종류 이상을 사용해야 합니다. 답안 칸에 순전파 값과 모든 노드의 역전파 기울기를 표로 정리하고, 코드 셀에서 \`Value\`로 같은 계산을 재현해 손으로 구한 값과 일치하는지 확인합니다.
`,
      cells: [
        { kind: "text", id: "graph-hand", prompt: "계산 그래프의 식, 각 노드의 순전파 값, 역전파 기울기를 표로 정리해 주십시오.", minChars: 140, template: md`
식: 

| 노드 | 정의 | 순전파 값 | ∂L/∂(노드) |
| --- | --- | --- | --- |
|  |  |  |  |
` },
        { kind: "code", id: "graph-code", label: "Value로 재현", starter: py`
# 예시: L = (a * b + c) ** 2: 자신의 그래프로 바꿔 작성합니다.
a, b, c = Value(2.0), Value(-1.5), Value(0.5)
d = a * b
e = d + c
L = e ** 2
L.backward()
for name, v in (("a", a), ("b", b), ("c", c), ("d", d), ("e", e), ("L", L)):
    print(f"{name}: data = {v.data: .4f}, grad = {v.grad: .4f}")
` },
      ],
    },
    {
      id: "numpy",
      title: "보충: NumPy 벡터화 구현과 비교하기",
      tier: "supplement",
      instructions: md`

같은 구조(2 → 8 → 8 → 1, tanh)의 MLP를 NumPy 행렬 연산으로 학습해 정확도와 학습 시간을 \`Value\` 구현과 비교합니다. 코드 셀의 \`backward\` 함수는 완성되어 있으니 한 줄씩 읽고 각 줄이 어떤 연쇄법칙에 해당하는지 확인합니다. 그런 다음 \`Value\` 구현이 느린 이유를 세 가지 이상 적습니다.
`,
      cells: [
        { kind: "code", id: "numpy-code", label: "NumPy MLP와 속도 비교", starter: py`
import time

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
` },
        { kind: "text", id: "numpy-answer", prompt: "두 구현의 정확도와 속도를 비교하고, Value 구현이 느린 이유를 세 가지 이상 설명해 주십시오.", minChars: 150 },
      ],
    },
    {
      id: "advanced",
      title: "심화: 최적화기·기울기 흐름·자동미분 실험",
      tier: "advanced",
      instructions: md`

다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않으며, 심화 단계의 내용을 과제의 MLP에 적용해 보는 것이 목적입니다.

- SGD, Momentum, Adam, AdamW를 NumPy MLP에 직접 구현해 손실 곡선을 비교합니다. 최적화기마다 학습률을 따로 조정했는지, Adam + L2와 AdamW에서 같은 $\lambda$가 가중치 노름에 주는 효과가 어떻게 다른지 밝힙니다(「Adam의 이론」).
- ReLU와 tanh를 쓴 20층 네트워크에서 층별 기울기 크기를 기록하고, 잔차 연결과 노름 기준 기울기 클리핑을 더했을 때 어떻게 달라지는지 비교합니다(「기울기 흐름의 수학」).
- \`Value\`에 이원수(dual number) 기반 순방향 모드를 붙여, 같은 MLP의 한 파라미터에 대한 미분을 역방향 모드 결과와 비교합니다(「자동미분의 두 모드」).
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: py`
# 선택한 심화 실험을 이 셀에서 진행합니다.
` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "derivation", label: "국소 미분 유도의 정확성", points: 3, guide: "나눗셈·exp의 국소 미분과 직접 설계한 계산 그래프의 역전파가 정확합니다." },
    { id: "gradcheck", label: "구현 정확성", points: 3, guide: "확장한 Value와 MLP 전체의 gradient check를 통과했습니다." },
    { id: "mlp", label: "MLP 학습과 문제 해결 과정", points: 3, guide: "훈련 정확도 90% 이상을 달성하고, 손실 곡선·결정경계와 문제 해결 과정을 제시했습니다." },
    { id: "quality", label: "코드 품질과 가독성", points: 1, guide: "코드와 답안이 읽기 쉽고, 모든 셀이 처음부터 순서대로 실행됩니다." },
  ],
  gradingNotes: md`
- **Value에 나눗셈과 exp 추가하기**: 나눗셈은 $\partial(a/b)/\partial a = 1/b$, $\partial(a/b)/\partial b = -a/b^2$이고, exp는 출력값 $e^x$를 그대로 곱한다. $a \cdot b^{-1}$로 기존 연산을 재사용한 구현도 정답이다. 나눗셈의 역전파가 없으면 손실을 샘플 수로 나누는 단계에서 기울기가 끊겨 MLP 학습이 진행되지 않는다. 이 원인을 스스로 찾아 기록했다면 "MLP 학습과 문제 해결 과정" 항목에서 높게 평가한다.
- **Value로 만든 MLP로 make_moons 분류하기**: 학습률 0.3, 60에폭이면 훈련 정확도 약 0.95에 도달한다.
- **MLP 전체에 대한 gradient check**: 상대오차가 $10^{-9}$ 수준이어야 한다.
- **보충: NumPy 벡터화 구현과 비교하기**: NumPy 구현이 수백에서 수천 배 빠르다. 느린 이유로 Python 객체 생성, 노드마다의 클로저 호출, 스칼라 단위 연산(벡터화 부재), 위상 정렬 비용을 들면 충분하다.
`,
  maxScore: 10,
  autoTests: [
    { id: "w3-at-div", taskId: "extend", title: "나눗셈의 _backward: ∂(a/b)/∂a = 1/b, ∂(a/b)/∂b = −a/b²", code: py`
a, b = Value(1.5), Value(-0.7)
(a / b).backward()
assert abs(a.grad - 1 / -0.7) < 1e-9, f"a.grad = {a.grad}, 기대 {1 / -0.7}"
assert abs(b.grad - (-1.5 / 0.49)) < 1e-9, f"b.grad = {b.grad}, 기대 {-1.5 / 0.49}"
` },
    { id: "w3-at-exp", taskId: "extend", title: "exp의 _backward가 e^x를 누적한다", hint: "`self.grad += e * out.grad`처럼 `+=`로 누적해야 같은 변수를 두 번 쓴 식에서도 맞습니다.", code: py`
import math
x = Value(0.5)
(x.exp() + x.exp()).backward()
assert abs(x.grad - 2 * math.exp(0.5)) < 1e-9, f"x.grad = {x.grad}, 기대 {2 * math.exp(0.5)}"
` },
    { id: "w3-at-mlp", taskId: "mlp", title: "학습한 MLP의 훈련 정확도 90% 이상, 손실 감소", hint: "매 스텝 모든 파라미터의 grad를 0으로 되돌렸는지, 갱신을 `p.data -= lr * p.grad`로 했는지 확인하십시오.", code: py`
_, acc = total_loss(model)
assert acc >= 0.9, f"현재 정확도 {acc:.2f}"
assert len(losses) > 1 and losses[-1] < losses[0], "손실이 줄지 않았습니다."
` },
    { id: "w3-at-model-grad", taskId: "gradcheck", title: "MLP 전체 역전파가 수치미분과 일치한다", code: py`
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
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "Value에 log를 추가해 소프트맥스 교차 엔트로피 만들기",
      prompt: md`

다중 분류 손실을 \`Value\`의 기본 연산만으로 조립합니다. \`exp\`와 \`__truediv__\`는 완성되어 있습니다.

1. \`log()\`의 \`_backward\`: $\dfrac{d}{dx}\ln x = \dfrac{1}{x}$
2. \`softmax_ce(logits, target)\`: \`Value\` 리스트 \`logits\`와 정답 번호를 받아 $-\ln \dfrac{e^{z_t}}{\sum_j e^{z_j}}$를 \`Value\`로 돌려줍니다.

역전파한 \`logits[j].grad\`가 $\mathrm{softmax}(z)_j - [j = t]$와 같아야 합니다. 2주차 로지스틱 회귀의 $p - y$가 클래스 여러 개로 일반화된 모습입니다.
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
      hints: ["`log`의 `_backward`는 `self.grad += out.grad / self.data`입니다.", "`exps = [z.exp() for z in logits]`, 합은 `sum(exps[1:], exps[0])`처럼 Value끼리 더합니다(`__radd__`가 있어 `sum(exps)`도 됩니다).", "`return -(exps[target] / total).log()`. 기울기가 softmax − 원핫이 되는 것은 연쇄법칙이 자동으로 계산해 줍니다."],
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
      key: "ch2",
      title: "깊은 망의 층별 기울기 크기 측정과 기울기 클리핑",
      prompt: md`

깊이 20인 MLP에서 기울기가 층을 거슬러 올라가며 어떻게 변하는지 직접 측정합니다.

1. \`layer_grad_norms(depth, width, act, std, seed)\`: 입력(샘플 64개, 특징 width개)을 \`depth\`개의 "선형(표준편차 std, 편향 없음) → 활성화(\`"tanh"\` 또는 \`"relu"\`)" 층에 통과시킨 뒤, 손실 $L = \text{mean}(\text{출력})$에서 역전파하며 **각 층 입력에 대한 기울기 $\partial L/\partial h_l$의 노름**을 첫 층부터 순서대로 리스트로 돌려줍니다(길이 depth).
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
      hints: ["tanh의 국소 미분은 $1 - \\tanh^2(z)$, ReLU는 `(z > 0)`입니다. `g = g * 국소미분`이 $\\partial L / \\partial z$입니다.", "`h = z_prev_act @ W`이므로 입력에 대한 기울기는 $\\partial L / \\partial z$에 `W.T`를 곱한 값입니다. `g = g @ W.T`", "`norm = np.linalg.norm(g)`, `return g * min(1.0, max_norm / norm)`. 0으로 나누지 않도록 norm이 0이면 그대로 돌려줍니다."],
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
});
