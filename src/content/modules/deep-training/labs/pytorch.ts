import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "autograd 없이 2층 신경망의 backward 작성하기",
    prompt: md`

「PyTorch가 대신해주는 것들」 단계에서 본 2층 신경망에서 \`backward\`를 직접 작성합니다. 순전파는 $z_1 = XW_1 + b_1$, $h = \mathrm{ReLU}(z_1)$, $z_2 = hW_2 + b_2$, $p = \sigma(z_2)$, 손실은 평균 이진 교차 엔트로피입니다.

시그모이드 + 교차 엔트로피의 기울기 $\partial L/\partial z_2 = (p - Y)/n$에서 출발해, 층마다 "$\partial L/\partial W = (\text{입력})^\top \delta$", "아래 층으로는 $\delta W^\top$", "ReLU에서 음수 자리는 차단"을 적용합니다. 채점은 gradient check와 make_moons 학습 정확도로 합니다.
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
    hints: ["출력층: `dW2 = h.T @ dz2`, `db2 = dz2.sum(axis=0)`", "은닉층으로 내려보내기: `dz1 = (dz2 @ W2.T) * (z1 > 0)`. ReLU가 0을 낸 자리는 기울기도 0입니다.", "입력층: `dW1 = X.T @ dz1`, `db1 = dz1.sum(axis=0)`. 패턴은 언제나 \"(그 층의 입력).T @ (그 층 출력의 기울기)\"입니다."],
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
]);
