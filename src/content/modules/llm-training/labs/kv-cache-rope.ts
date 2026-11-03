import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "KV 캐시로 한 토큰씩 생성하기와 RoPE의 상대 거리",
    prompt: md`
1. \`generate_with_cache(X, Wq, Wk, Wv)\`: 토큰이 하나씩 들어온다고 보고, 매 스텝 **새 토큰의 q, k, v만** 계산해 K·V 캐시에 쌓은 뒤 캐시 전체에 attention해 출력을 모읍니다. \`(출력들 (n, d), K·V 계산 횟수)\`를 돌려줍니다. 결과는 문장 전체를 causal mask로 한 번에 계산한 것과 **정확히 같아야** 합니다.
2. \`rope(v, pos, theta=0.3)\`: 성분 쌍 $(v_{2i}, v_{2i+1})$을 각도 $pos \cdot \theta / 10000^{2i/d}$만큼 회전합니다. 회전한 $q$(위치 $m$)와 $k$(위치 $n$)의 내적은 $m - n$에만 의존해야 합니다.
`,
    starter: py`
import numpy as np

def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()

def generate_with_cache(X, Wq, Wk, Wv):
    d = Wq.shape[1]
    K_cache, V_cache, outputs, computed = [], [], [], 0
    for x in X:
        # TODO: q, k, v = x @ Wq, x @ Wk, x @ Wv → 캐시에 k, v 추가(computed += 1) → softmax(Kc @ q / √d) @ Vc
        pass
    return np.array(outputs), computed

def rope(v, pos, theta=0.3):
    out = v.astype(float).copy()
    for i in range(0, len(v), 2):
        pass  # TODO: 각도 ang = pos * theta / 10000 ** (i / len(v)), 2차원 회전
    return out

rng = np.random.default_rng(0)
X = rng.normal(size=(8, 16))
Ws = [rng.normal(size=(16, 16)) / 4 for _ in range(3)]
out, n = generate_with_cache(X, *Ws)
print(np.shape(out), n)
q, k = rng.normal(size=16), rng.normal(size=16)
print([round(float(rope(q, m) @ rope(k, p)), 6) for m, p in [(5, 3), (12, 10), (3, 5)]])
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(5)
X = rng.normal(size=(7, 12))
Wq, Wk, Wv = (rng.normal(size=(12, 12)) / 3.5 for _ in range(3))

def full_causal(X):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = Q @ K.T / np.sqrt(12)
    S = np.where(np.triu(np.ones((len(X), len(X))), 1) == 1, -1e9, S)
    W = np.exp(S - S.max(axis=1, keepdims=True)); W /= W.sum(axis=1, keepdims=True)
    return W @ V

@test("KV 캐시로 한 토큰씩 계산 == causal mask로 한 번에 계산")
def _():
    out, n = generate_with_cache(X, Wq, Wk, Wv)
    assert np.shape(out) == (7, 12) and approx(out, full_causal(X))

@test("K·V 계산 횟수 = 토큰 수 (캐시 없이는 1+2+…+n)")
def _():
    _, n = generate_with_cache(X, Wq, Wk, Wv)
    assert n == 7, f"계산 횟수 {n}"

@test("RoPE는 벡터 크기를 바꾸지 않는다(회전)")
def _():
    v = rng.normal(size=8)
    assert approx(np.linalg.norm(rope(v, 17)), np.linalg.norm(v)) and approx(rope(v, 0), v)

@test("회전한 q·k는 위치 차이(m − n)에만 의존한다")
def _():
    q, k = rng.normal(size=16), rng.normal(size=16)
    a, b, c = rope(q, 5) @ rope(k, 3), rope(q, 102) @ rope(k, 100), rope(q, 3) @ rope(k, 5)
    assert approx(a, b) and not approx(a, c)
`,
    hints: ["스텝마다 `K_cache.append(k)`, `Kc = np.stack(K_cache)`. 캐시에는 지금까지의 토큰만 있으므로 마스크가 필요 없습니다.", "`outputs.append(softmax(Kc @ q / np.sqrt(d)) @ Vc)`", "회전: `c, s = np.cos(ang), np.sin(ang)`, `out[i], out[i + 1] = c * v[i] - s * v[i + 1], s * v[i] + c * v[i + 1]`"],
    solution: py`
import numpy as np

def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()

def generate_with_cache(X, Wq, Wk, Wv):
    d = Wq.shape[1]
    K_cache, V_cache, outputs, computed = [], [], [], 0
    for x in X:
        q, k, v = x @ Wq, x @ Wk, x @ Wv
        K_cache.append(k); V_cache.append(v); computed += 1
        Kc, Vc = np.stack(K_cache), np.stack(V_cache)
        outputs.append(softmax(Kc @ q / np.sqrt(d)) @ Vc)
    return np.array(outputs), computed

def rope(v, pos, theta=0.3):
    out = v.astype(float).copy()
    for i in range(0, len(v), 2):
        ang = pos * theta / (10000 ** (i / len(v)))
        c, s = np.cos(ang), np.sin(ang)
        out[i], out[i + 1] = c * v[i] - s * v[i + 1], s * v[i] + c * v[i + 1]
    return out

rng = np.random.default_rng(0)
X = rng.normal(size=(8, 16))
Ws = [rng.normal(size=(16, 16)) / 4 for _ in range(3)]
out, n = generate_with_cache(X, *Ws)
print(np.shape(out), n)
q, k = rng.normal(size=16), rng.normal(size=16)
print([round(float(rope(q, m) @ rope(k, p)), 6) for m, p in [(5, 3), (12, 10), (3, 5)]])
`,
  },
]);
