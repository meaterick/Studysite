import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "사인·코사인 위치 인코딩으로 순서 구별하기",
    prompt: md`
1. \`sinusoidal_pe(n, d)\`: 위치 $pos$, 짝수 차원 $2i$에 대해 $\sin(pos / 10000^{2i/d})$, 다음 홀수 차원에 $\cos(\cdot)$를 넣은 (n, d) 행렬
2. \`self_attention(X, Wq, Wk, Wv)\`: 마스크 없는 단일 헤드 attention(스케일링 포함)

위치 정보 없이 단어 순서를 뒤집으면 각 단어의 출력이 **자리만 바뀐 채 똑같고**(순열 등변), 위치 인코딩을 더하면 달라지는지 확인합니다.
`,
    starter: py`
import numpy as np

def sinusoidal_pe(n, d):
    pe = np.zeros((n, d))
    # TODO: pos = np.arange(n)[:, None], i = np.arange(0, d, 2)[None, :], angle = pos / 10000 ** (i / d)
    return pe

def self_attention(X, Wq, Wk, Wv):
    return X  # TODO

rng = np.random.default_rng(0)
d = 8
emb = {w: rng.normal(size=d) for w in ["고양이가", "생선을", "먹었다"]}
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))
X1 = np.stack([emb[w] for w in ["고양이가", "생선을", "먹었다"]])
X2 = X1[::-1]
o1, o2 = self_attention(X1, Wq, Wk, Wv), self_attention(X2, Wq, Wk, Wv)
print("위치 정보 없음:", np.allclose(o1[0], o2[2]))
print(np.round(sinusoidal_pe(3, d)[:, :4], 3))
`,
    tests: py`
import numpy as np

@test("PE shape, 위치 0 = [0, 1, 0, 1, ...]")
def _():
    pe = sinusoidal_pe(5, 8)
    assert np.shape(pe) == (5, 8) and approx(pe[0], [0, 1, 0, 1, 0, 1, 0, 1])

@test("PE 값: 위치 1의 앞 두 성분 = sin 1, cos 1")
def _():
    pe = sinusoidal_pe(3, 8)
    assert approx(pe[1, :2], [np.sin(1), np.cos(1)]) and approx(pe[2, 2], np.sin(2 / 10000 ** (2 / 8)))

@test("위치 정보 없는 self-attention은 순열 등변")
def _():
    rng = np.random.default_rng(1)
    X = rng.normal(size=(4, 6))
    Ws = [rng.normal(size=(6, 6)) for _ in range(3)]
    perm = [2, 0, 3, 1]
    assert approx(self_attention(X, *Ws)[perm], self_attention(X[perm], *Ws))

@test("위치 인코딩을 더하면 같은 단어라도 자리에 따라 출력이 달라진다")
def _():
    rng = np.random.default_rng(2)
    X = rng.normal(size=(3, 8))
    Ws = [rng.normal(size=(8, 8)) for _ in range(3)]
    pe = sinusoidal_pe(3, 8)
    o1 = self_attention(X + pe, *Ws)
    o2 = self_attention(X[::-1] + pe, *Ws)
    assert not np.allclose(o1[0], o2[2])
`,
    hints: ["`angle = pos / (10000 ** (i / d))`는 (n, d/2) 행렬입니다. `pe[:, 0::2] = np.sin(angle)`, `pe[:, 1::2] = np.cos(angle)`", "`Q, K, V = X @ Wq, X @ Wk, X @ Wv`, `S = Q @ K.T / np.sqrt(K.shape[-1])`", "행마다 softmax한 뒤 `@ V`. 행 순서를 바꿔도 같은 계산이 자리만 바뀌어 일어나므로 순열 등변입니다."],
    solution: py`
import numpy as np

def sinusoidal_pe(n, d):
    pe = np.zeros((n, d))
    pos = np.arange(n)[:, None]
    i = np.arange(0, d, 2)[None, :]
    angle = pos / (10000 ** (i / d))
    pe[:, 0::2], pe[:, 1::2] = np.sin(angle), np.cos(angle)
    return pe

def self_attention(X, Wq, Wk, Wv):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = Q @ K.T / np.sqrt(K.shape[-1])
    S = S - S.max(axis=1, keepdims=True)
    W = np.exp(S) / np.exp(S).sum(axis=1, keepdims=True)
    return W @ V

rng = np.random.default_rng(0)
d = 8
emb = {w: rng.normal(size=d) for w in ["고양이가", "생선을", "먹었다"]}
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))
X1 = np.stack([emb[w] for w in ["고양이가", "생선을", "먹었다"]])
X2 = X1[::-1]
o1, o2 = self_attention(X1, Wq, Wk, Wv), self_attention(X2, Wq, Wk, Wv)
print("위치 정보 없음:", np.allclose(o1[0], o2[2]))
print(np.round(sinusoidal_pe(3, d)[:, :4], 3))
`,
  },
]);
