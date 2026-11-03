import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "RNN 순전파와 시점 거리에 따라 줄어드는 기울기",
    prompt: md`
RNN의 순전파와 BPTT의 야코비안 곱을 구현합니다.

1. \`rnn_forward(xs, W, U, b)\`: $h_t = \tanh(Wx_t + Uh_{t-1} + b)$를 $h_0 = 0$에서 시작해 계산하고 모든 $h_t$의 리스트를 돌려줍니다. 길이와 상관없이 같은 $W, U, b$를 씁니다(파라미터 공유).
2. \`grad_norms(hs, U)\`: BPTT에서 $\partial h_T/\partial h_k = \prod_{t=k+1}^{T} \mathrm{diag}(1 - h_t^2)\,U$입니다. 뒤에서부터 야코비안을 하나씩 곱해 가며 거리 1, 2, …, T−1의 **스펙트럼 노름**(\`np.linalg.norm(J, 2)\`)을 리스트로 돌려줍니다.
`,
    starter: py`
import numpy as np

def rnn_forward(xs, W, U, b):
    h = np.zeros(U.shape[0])
    hs = []
    for x in xs:
        pass  # TODO: h를 갱신하고 hs에 추가합니다.
    return hs

def grad_norms(hs, U):
    J = np.eye(U.shape[0])
    norms = []
    for t in range(len(hs) - 1, 0, -1):
        pass  # TODO: J = J @ (diag(1 - hs[t]²) @ U), 노름을 기록
    return norms

rng = np.random.default_rng(0)
d_in, d_h = 4, 16
W, b = rng.normal(0, 0.5, (d_h, d_in)), np.zeros(d_h)
Q, _ = np.linalg.qr(rng.normal(size=(d_h, d_h)))
hs = rnn_forward(rng.normal(size=(60, d_in)), W, 0.9 * Q, b)
n = grad_norms(hs, 0.9 * Q)
print(len(hs), [f"{n[d - 1]:.1e}" for d in (1, 10, 40)] if len(n) >= 40 else n)
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(1)
W, b = rng.normal(0, 0.5, (8, 3)), rng.normal(0, 0.1, 8)
U = rng.normal(0, 0.3, (8, 8))

@test("은닉 상태 수 = 입력 길이, 각 shape (d_h,)")
def _():
    hs = rnn_forward(rng.normal(size=(5, 3)), W, U, b)
    assert len(hs) == 5 and np.shape(hs[-1]) == (8,)

@test("재귀식 h_t = tanh(Wx_t + Uh_(t-1) + b)")
def _():
    xs = rng.normal(size=(3, 3))
    hs = rnn_forward(xs, W, U, b)
    h1 = np.tanh(W @ xs[0] + b)
    h2 = np.tanh(W @ xs[1] + U @ h1 + b)
    assert approx(hs[0], h1) and approx(hs[1], h2)

@test("grad_norms: 길이 T-1, 거리 1 = ‖diag(1-h_T²)U‖₂")
def _():
    hs = rnn_forward(rng.normal(size=(6, 3)), W, U, b)
    n = grad_norms(hs, U)
    assert len(n) == 5 and approx(n[0], np.linalg.norm(np.diag(1 - hs[-1] ** 2) @ U, 2))

@test("배율 0.9 직교 행렬: 거리 40에서 기울기가 1e-4 미만으로 소실")
def _():
    r = np.random.default_rng(0)
    W0 = r.normal(0, 0.5, (16, 4))
    Q, _ = np.linalg.qr(r.normal(size=(16, 16)))
    hs = rnn_forward(r.normal(size=(60, 4)), W0, 0.9 * Q, np.zeros(16))
    n = grad_norms(hs, 0.9 * Q)
    assert n[39] < 1e-4 and n[0] > n[9] > n[39], f"거리 1, 10, 40: {n[0]:.2e}, {n[9]:.2e}, {n[39]:.2e}"
`,
    hints: ["`h = np.tanh(W @ x + U @ h + b)` 다음 `hs.append(h)`", "야코비안 한 칸은 `np.diag(1 - hs[t] ** 2) @ U`입니다. tanh의 미분 $1 - h^2$이 1 이하라 곱할수록 작아집니다.", "`J = J @ (np.diag(1 - hs[t] ** 2) @ U)`, `norms.append(np.linalg.norm(J, 2))`"],
    solution: py`
import numpy as np

def rnn_forward(xs, W, U, b):
    h = np.zeros(U.shape[0])
    hs = []
    for x in xs:
        h = np.tanh(W @ x + U @ h + b)
        hs.append(h)
    return hs

def grad_norms(hs, U):
    J = np.eye(U.shape[0])
    norms = []
    for t in range(len(hs) - 1, 0, -1):
        J = J @ (np.diag(1 - hs[t] ** 2) @ U)
        norms.append(np.linalg.norm(J, 2))
    return norms

rng = np.random.default_rng(0)
d_in, d_h = 4, 16
W, b = rng.normal(0, 0.5, (d_h, d_in)), np.zeros(d_h)
Q, _ = np.linalg.qr(rng.normal(size=(d_h, d_h)))
hs = rnn_forward(rng.normal(size=(60, d_in)), W, 0.9 * Q, b)
n = grad_norms(hs, 0.9 * Q)
print(len(hs), [f"{n[d - 1]:.1e}" for d in (1, 10, 40)] if len(n) >= 40 else n)
`,
  },
]);
