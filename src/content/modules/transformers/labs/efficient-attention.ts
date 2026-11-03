import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "온라인 softmax로 블록 단위 attention 계산하기",
    prompt: md`
본문의 온라인 softmax를 구현합니다.

1. \`stable_softmax(s)\`: 최댓값을 뺀 softmax (1차원)
2. \`online_attention_row(q, K, V, block)\`: query 하나에 대해 \`K\`, \`V\`를 \`block\`개씩 나눠 보면서 최댓값 $m$, 지수 합 $\ell$, 가중합 $a$를 본문의 갱신식으로 누적하고 $a/\ell$을 돌려줍니다. 점수는 $k^\top q/\sqrt{d}$입니다. $n \times n$이든 $n$ 길이든 점수 배열을 **한꺼번에 만들지 않아야** 합니다(블록 크기만큼만).
3. \`online_attention(Q, K, V, block)\`: 모든 query에 대해 2번을 적용한 \`(n_q, d_v)\` 배열
`,
    starter: py`
import numpy as np

def stable_softmax(s):
    return np.exp(s) / np.exp(s).sum()  # TODO: 최댓값을 빼서 넘치지 않게

def online_attention_row(q, K, V, block=4):
    m, l = -np.inf, 0.0
    acc = np.zeros(V.shape[1])
    for start in range(0, len(K), block):
        s = K[start:start + block] @ q / np.sqrt(len(q))
        pass  # TODO: m_new, scale = exp(m - m_new), l과 acc를 갱신
    return acc / l if l else acc

def online_attention(Q, K, V, block=4):
    return np.zeros((len(Q), V.shape[1]))  # TODO

print(stable_softmax(np.array([1000.0, 999.0, 998.0])))
`,
    tests: py`
import numpy as np

def ref_attention(Q, K, V):
    S = Q @ K.T / np.sqrt(Q.shape[1])
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return (E / E.sum(axis=1, keepdims=True)) @ V

@test("큰 점수에서도 nan 없이 softmax")
def _():
    p = stable_softmax(np.array([1000.0, 999.0, 998.0]))
    assert not np.isnan(p).any() and approx(p, [0.66524, 0.24473, 0.09003], 1e-4), f"결과: {p}"

@test("한 행: 블록 크기와 무관하게 표준 attention과 같다")
def _():
    rng = np.random.default_rng(0)
    q, K, V = rng.normal(size=8), rng.normal(size=(37, 8)), rng.normal(size=(37, 5))
    ref = ref_attention(q[None, :], K, V)[0]
    for b in (1, 4, 10, 37, 64):
        assert approx(online_attention_row(q, K, V, block=b), ref), f"block={b}"

@test("전체: (n_q, d_v) 모양이고 표준 attention과 같다")
def _():
    rng = np.random.default_rng(1)
    Q, K, V = rng.normal(size=(20, 16)), rng.normal(size=(50, 16)), rng.normal(size=(50, 7))
    out = online_attention(Q, K, V, block=8)
    assert np.shape(out) == (20, 7) and approx(out, ref_attention(Q, K, V))

@test("점수가 매우 커도(×100) 정확하다")
def _():
    rng = np.random.default_rng(2)
    Q, K, V = rng.normal(size=(5, 4)) * 100, rng.normal(size=(30, 4)), rng.normal(size=(30, 3))
    out = online_attention(Q, K, V, block=7)
    assert not np.isnan(out).any() and approx(out, ref_attention(Q, K, V))
`,
    hints: ["`e = np.exp(s - s.max())` 뒤 `e / e.sum()`입니다.", "블록마다 `m_new = max(m, s.max())`, `scale = np.exp(m - m_new)`, `p = np.exp(s - m_new)`를 구합니다. 처음에는 $m = -\\infty$라 `scale`이 0이 되는데, 이전 누적값도 0이므로 문제없습니다.", "`l = l * scale + p.sum()`, `acc = acc * scale + p @ V[start:start + block]`, `m = m_new`. 전체는 `np.array([online_attention_row(q, K, V, block) for q in Q])`입니다."],
    solution: py`
import numpy as np

def stable_softmax(s):
    e = np.exp(s - s.max())
    return e / e.sum()

def online_attention_row(q, K, V, block=4):
    m, l = -np.inf, 0.0
    acc = np.zeros(V.shape[1])
    for start in range(0, len(K), block):
        s = K[start:start + block] @ q / np.sqrt(len(q))
        m_new = max(m, s.max())
        scale = np.exp(m - m_new)
        p = np.exp(s - m_new)
        l = l * scale + p.sum()
        acc = acc * scale + p @ V[start:start + block]
        m = m_new
    return acc / l

def online_attention(Q, K, V, block=4):
    return np.array([online_attention_row(q, K, V, block) for q in Q])

print(stable_softmax(np.array([1000.0, 999.0, 998.0])))
`,
  },
]);
