import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "softmax(QKᵀ/√d_k)V 직접 계산하기",
    prompt: md`
\`attention(Q, K, V, scale=True)\`가 \`(출력, 가중치)\`를 돌려주게 구현합니다. 가중치는 각 Query 행마다 Key들에 대한 softmax이며, \`scale=True\`면 점수를 $\sqrt{d_k}$로 나눕니다.

본문의 "고양이가 생선을 맛있게 먹었다" 예제(Query $[1,1,0,1]$)에서 가중치 18.8% · 51.0% · 11.4% · 18.8%, 출력 $[1.24, 1.65]$가 나와야 합니다.
`,
    starter: py`
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V, scale=True):
    S = Q @ K.T
    # TODO: scale이면 √d_k(= K의 마지막 차원)로 나누고, 마지막 축으로 softmax → 가중치 @ V
    weights = np.zeros_like(S)
    return weights @ V, weights

K = np.array([[1, 0, 0, 0], [1, 1, 1, 1], [0, 0, 1, 0], [1, 1, 0, -1]], dtype=float)
V = np.array([[2, 0], [0, 3], [1, 1], [4, 0]], dtype=float)
out, w = attention(np.array([[1, 1, 0, 1]], dtype=float), K, V)
print(np.round(w, 3), np.round(out, 2))
`,
    tests: py`
import numpy as np
K = np.array([[1, 0, 0, 0], [1, 1, 1, 1], [0, 0, 1, 0], [1, 1, 0, -1]], dtype=float)
V = np.array([[2, 0], [0, 3], [1, 1], [4, 0]], dtype=float)

@test("본문 예제: 가중치 [0.188, 0.510, 0.114, 0.188], 출력 [1.24, 1.65]")
def _():
    out, w = attention(np.array([[1, 1, 0, 1]], dtype=float), K, V)
    assert approx(w[0], [0.1878, 0.5105, 0.1139, 0.1878], 1e-3), f"가중치: {np.round(w, 4)}"
    assert approx(out[0], [1.2407, 1.6454], 1e-3), f"출력: {np.round(out, 4)}"

@test("Query 여러 개: 출력 shape (n_q, d_v), 행마다 가중치 합 1")
def _():
    rng = np.random.default_rng(0)
    Q, Kr, Vr = rng.normal(size=(5, 8)), rng.normal(size=(7, 8)), rng.normal(size=(7, 3))
    out, w = attention(Q, Kr, Vr)
    assert out.shape == (5, 3) and w.shape == (5, 7) and approx(w.sum(axis=1), np.ones(5))

@test("scale=False면 √d_k로 나누지 않는다")
def _():
    _, w = attention(np.array([[1, 1, 0, 1]], dtype=float), K, V, scale=False)
    e = np.exp(np.array([1, 3, 0, 1]) - 3.0)
    assert approx(w[0], e / e.sum())

@test("스케일링하면 d_k가 커져도 가중치가 한 곳에 덜 몰린다")
def _():
    rng = np.random.default_rng(1)
    Q, Kr, Vr = rng.normal(size=(200, 256)), rng.normal(size=(10, 256)), rng.normal(size=(10, 2))
    _, w_s = attention(Q, Kr, Vr)
    _, w_n = attention(Q, Kr, Vr, scale=False)
    assert w_s.max(axis=1).mean() < 0.6 < w_n.max(axis=1).mean()
`,
    hints: ["`if scale: S = S / np.sqrt(K.shape[-1])`", "`weights = softmax(S, axis=-1)`: 각 행(Query)이 모든 Key에 대한 확률분포가 됩니다.", "출력은 `weights @ V`. 가져오는 것은 Key가 아니라 Value입니다."],
    solution: py`
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V, scale=True):
    S = Q @ K.T
    if scale:
        S = S / np.sqrt(K.shape[-1])
    weights = softmax(S, axis=-1)
    return weights @ V, weights

K = np.array([[1, 0, 0, 0], [1, 1, 1, 1], [0, 0, 1, 0], [1, 1, 0, -1]], dtype=float)
V = np.array([[2, 0], [0, 3], [1, 1], [4, 0]], dtype=float)
out, w = attention(np.array([[1, 1, 0, 1]], dtype=float), K, V)
print(np.round(w, 3), np.round(out, 2))
`,
  },
]);
