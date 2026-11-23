import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "노드 하나씩 역전파 규칙 적용하기",
    prompt: md`

계산 그래프의 노드마다 "출력 쪽 기울기 \`g\`를 받아 입력 쪽 기울기를 돌려주는" 함수를 만듭니다(본문의 노드별 국소 미분 표).

1. \`add_backward(g)\`: 덧셈 $z = a + b$ → \`(g, g)\`
2. \`mul_backward(a, b, g)\`: 곱셈 $z = a b$ → \`(b * g, a * g)\`
3. \`square_backward(a, g)\`: 제곱 $z = a^2$ → \`2 * a * g\`
4. \`relu_backward(a, g)\`: ReLU → \`a > 0\`이면 \`g\`, 아니면 0

마지막 줄은 이 함수들을 이어 붙여 $L = (wx + c)^2$의 기울기를 구합니다. 본문 예제와 같은 \`(42, 28, 14)\`가 나와야 합니다.
`,
    starter: py`
def add_backward(g):
    return 0.0, 0.0     # TODO

def mul_backward(a, b, g):
    return 0.0, 0.0     # TODO

def square_backward(a, g):
    return 0.0          # TODO

def relu_backward(a, g):
    return 0.0          # TODO

w, x, c = 2.0, 3.0, 1.0
u = w * x
v = u + c
dv = square_backward(v, 1.0)
du, dc = add_backward(dv)
dw, dx = mul_backward(w, x, du)
print(dw, dx, dc)
`,
    tests: py`
@test("덧셈·곱셈·제곱 노드")
def _():
    assert add_backward(5.0) == (5.0, 5.0), f"add_backward: {add_backward(5.0)}"
    assert mul_backward(2.0, 3.0, 1.5) == (4.5, 3.0), f"mul_backward: {mul_backward(2.0, 3.0, 1.5)}"
    assert square_backward(7.0, 1.0) == 14.0, f"square_backward: {square_backward(7.0, 1.0)}"

@test("ReLU 노드: 양수만 통과")
def _():
    assert relu_backward(2.0, 3.0) == 3.0 and relu_backward(-1.0, 3.0) == 0, "음수 입력에서는 기울기가 0입니다."

@test("이어 붙인 결과 (42, 28, 14)")
def _():
    assert (dw, dx, dc) == (42.0, 28.0, 14.0), f"결과: {(dw, dx, dc)}"
`,
    hints: [
      "덧셈은 `return g, g`, 곱셈은 `return b * g, a * g`입니다. 곱셈 노드는 **상대** 입력의 값을 곱합니다.",
      "제곱은 `return 2 * a * g`, ReLU는 `return g if a > 0 else 0.0`입니다.",
    ],
    solution: py`
def add_backward(g):
    return g, g

def mul_backward(a, b, g):
    return b * g, a * g

def square_backward(a, g):
    return 2 * a * g

def relu_backward(a, g):
    return g if a > 0 else 0.0

w, x, c = 2.0, 3.0, 1.0
u = w * x
v = u + c
dv = square_backward(v, 1.0)
du, dc = add_backward(dv)
dw, dx = mul_backward(w, x, du)
print(dw, dx, dc)
`,
  },
  {
    key: "ex1",
    title: "덧셈·곱셈 노드로 손 역전파, 그리고 층 하나의 δxᵀ",
    prompt: md`

1. \`backprop(w, x, c)\`: $L = (wx + c)^2$을 $u = wx$, $v = u + c$, $L = v^2$로 쪼개 역전파한 $(\partial L/\partial w, \partial L/\partial x, \partial L/\partial c)$. 덧셈 노드는 기울기를 그대로 나눠 주고, 곱셈 노드는 **상대방의 값**을 곱해 전달합니다.
2. \`layer_grad(W, x)\`: $z = Wx$, $L = \sum z^2$일 때 $\dfrac{\partial L}{\partial W} = \delta x^\top$ ($\delta = 2z$). 결과 shape은 W와 같아야 합니다.

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
    hints: ["$L = v^2$이므로 `dL_dv = 2 * v`입니다.", "덧셈 노드: `dL_du = dL_dv`, `dL_dc = dL_dv`. 곱셈 노드: `dL_dw = dL_du * x`, `dL_dx = dL_du * w`(상대방 값을 곱함).", "`np.outer(delta, x)`는 (4,)와 (3,)으로 (4, 3) 행렬을 만듭니다. $\\delta x^\\top$과 같습니다."],
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
]);
