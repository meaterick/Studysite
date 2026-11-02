import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "인과적 선형 어텐션: 행렬 계산과 RNN 계산",
    prompt: md`

「선형 어텐션」 단계의 두 계산을 구현합니다. 특징 사상은 $\phi(x) = \mathrm{elu}(x) + 1$(양수면 $x+1$, 아니면 $e^x$)입니다.

1. \`phi(x)\`
2. \`causal_linear_quadratic(Q, K, V)\`: $A = \phi(Q)\phi(K)^\top$의 아래 삼각 부분(대각 포함)만 남겨 $AV$를 각 행의 합으로 나눈 \`(n, d_v)\`
3. \`causal_linear_recurrent(Q, K, V)\`: 상태 $S \in \mathbb{R}^{d_k \times d_v}$, $z \in \mathbb{R}^{d_k}$를 0에서 시작해 토큰마다 $S \mathrel{+}= \phi(k_t)v_t^\top$, $z \mathrel{+}= \phi(k_t)$로 갱신하고 $o_t = \phi(q_t)^\top S / \phi(q_t)^\top z$
4. \`state_size(d_k, d_v)\`: 생성 중 저장하는 상태 원소 수 $d_kd_v + d_k$
`,
    starter: py`
import numpy as np

def phi(x):
    return x  # TODO

def causal_linear_quadratic(Q, K, V):
    return np.zeros((len(Q), V.shape[1]))  # TODO

def causal_linear_recurrent(Q, K, V):
    S = np.zeros((K.shape[1], V.shape[1]))
    z = np.zeros(K.shape[1])
    out = []
    for t in range(len(Q)):
        pass  # TODO
    return np.array(out)

def state_size(d_k, d_v):
    return 0  # TODO

rng = np.random.default_rng(0)
Q, K, V = rng.normal(size=(6, 4)), rng.normal(size=(6, 4)), rng.normal(size=(6, 3))
print(np.allclose(causal_linear_quadratic(Q, K, V), causal_linear_recurrent(Q, K, V)))
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(0)

@test("φ(x) = elu(x) + 1: 항상 양수")
def _():
    x = np.array([-3.0, -0.5, 0.0, 0.5, 2.0])
    assert approx(phi(x), [np.exp(-3), np.exp(-0.5), 1.0, 1.5, 3.0]) and (phi(x) > 0).all()

@test("행렬 계산 == RNN 계산")
def _():
    Q, K, V = rng.normal(size=(9, 5)), rng.normal(size=(9, 5)), rng.normal(size=(9, 3))
    a, b = causal_linear_quadratic(Q, K, V), causal_linear_recurrent(Q, K, V)
    assert np.shape(a) == (9, 3) and approx(a, b)

@test("인과적이다: 뒤 토큰을 바꿔도 앞 출력은 그대로")
def _():
    Q, K, V = rng.normal(size=(7, 4)), rng.normal(size=(7, 4)), rng.normal(size=(7, 2))
    V2 = V.copy(); V2[5:] += 10
    K2 = K.copy(); K2[5:] -= 3
    a, b = causal_linear_recurrent(Q, K, V), causal_linear_recurrent(Q, K2, V2)
    assert approx(a[:5], b[:5]) and not approx(a[5:], b[5:])

@test("첫 토큰의 출력은 v_1 그대로")
def _():
    Q, K, V = rng.normal(size=(4, 3)), rng.normal(size=(4, 3)), rng.normal(size=(4, 2))
    assert approx(causal_linear_quadratic(Q, K, V)[0], V[0])

@test("상태 크기는 문맥 길이와 무관: d=128 → 16,512")
def _():
    assert state_size(128, 128) == 16_512
`,
    hints: ["`np.where(x > 0, x + 1, np.exp(x))`입니다(음수 쪽 `np.exp`의 경고가 싫다면 `np.exp(np.minimum(x, 0))`).", "`A = np.tril(phi(Q) @ phi(K).T)` 다음 `(A @ V) / A.sum(axis=1, keepdims=True)`입니다.", "반복문 안에서 `S += np.outer(phi(K[t]), V[t])`, `z += phi(K[t])`, `q = phi(Q[t])`, `out.append(q @ S / (q @ z))`입니다."],
    solution: py`
import numpy as np

def phi(x):
    x = np.asarray(x, dtype=float)
    return np.where(x > 0, x + 1, np.exp(np.minimum(x, 0)))

def causal_linear_quadratic(Q, K, V):
    A = np.tril(phi(Q) @ phi(K).T)
    return (A @ V) / A.sum(axis=1, keepdims=True)

def causal_linear_recurrent(Q, K, V):
    S = np.zeros((K.shape[1], V.shape[1]))
    z = np.zeros(K.shape[1])
    out = []
    for t in range(len(Q)):
        S += np.outer(phi(K[t]), V[t])
        z += phi(K[t])
        q = phi(Q[t])
        out.append(q @ S / (q @ z))
    return np.array(out)

def state_size(d_k, d_v):
    return d_k * d_v + d_k

rng = np.random.default_rng(0)
Q, K, V = rng.normal(size=(6, 4)), rng.normal(size=(6, 4)), rng.normal(size=(6, 3))
print(np.allclose(causal_linear_quadratic(Q, K, V), causal_linear_recurrent(Q, K, V)))
`,
  },
]);
