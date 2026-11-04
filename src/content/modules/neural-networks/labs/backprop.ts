import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
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
