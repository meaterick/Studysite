import type { WeekLab } from "../types";
import { py } from "./util";

// 5주차 코딩 실습
//   핵심: 공기행렬 임베딩, RNN, attention 가중치, scaled dot-product, 헤드 나누기·causal mask, 위치 인코딩, BPE
//   보충: LSTM 한 스텝, KV 캐시·RoPE, 파라미터·연산량·메모리 계산기
//   심화: 온라인 softmax, 인과적 선형 어텐션, RoPE 파장과 위치 보간
const CORPUS = py`
corpus = [
    "고양이 생선 먹는다", "강아지 고기 먹는다", "고양이 우유 마신다", "강아지 물 마신다",
    "고양이 소파 잔다", "강아지 마당 잔다", "고양이 강아지 동물", "강아지 귀엽다", "고양이 귀엽다",
    "자동차 도로 달린다", "버스 도로 달린다", "자동차 기름 넣는다", "버스 기름 넣는다",
    "자동차 버스 탈것", "버스 정류장 선다", "자동차 주차장 선다",
    "고양이 자동차 위 잔다",
]
sents = [s.split() for s in corpus]
`;

const week5: WeekLab = {
  exercises: [
    {
      id: "w5-lab-cooc",
      sectionId: "sequence-embedding",
      title: "함께 나온 횟수로 단어 임베딩 만들기",
      tier: "core",
      prompt: `
"문맥이 비슷하면 의미도 비슷하다"는 분포 가설을 코드로 확인합니다.

1. \`build_vocab(sents)\`: 모든 문장의 단어를 **정렬한** 리스트와 \`{단어: 번호}\` 딕셔너리
2. \`cooccurrence(sents, idx)\`: 같은 문장 안의 서로 다른 위치에 함께 나온 횟수를 센 $|V| \\times |V|$ 행렬
3. \`embed(C, d)\`: SVD $C = U S V^\\top$에서 \`U[:, :d] * S[:d]\`로 $d$차원 밀집 벡터를 만듭니다.

사람이 "비슷하다"고 알려 준 적이 없는데도 고양이·강아지, 자동차·버스가 가까워지는지 봅니다.
`,
      starter: CORPUS + py`
import numpy as np

def build_vocab(sents):
    vocab = []   # TODO: 정렬된 고유 단어 리스트
    idx = {}     # TODO: {단어: 번호}
    return vocab, idx

def cooccurrence(sents, idx):
    C = np.zeros((len(idx), len(idx)))
    # TODO: 문장마다 서로 다른 위치 i != j의 단어 쌍 (w_i, w_j)를 셉니다.
    return C

def embed(C, d):
    return np.zeros((C.shape[0], d))  # TODO

vocab, idx = build_vocab(sents)
E = embed(cooccurrence(sents, idx), 3)
def cos(a, b):
    va, vb = E[idx[a]], E[idx[b]]
    return va @ vb / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-12)
for a, b in [("고양이", "강아지"), ("자동차", "버스"), ("고양이", "자동차")]:
    print(a, b, round(float(cos(a, b)), 2))
`,
      tests: py`
import numpy as np

@test("어휘 사전: 정렬된 고유 단어, 번호가 위치와 일치")
def _():
    vocab, idx = build_vocab([["b", "a"], ["a", "c"]])
    assert vocab == ["a", "b", "c"] and idx == {"a": 0, "b": 1, "c": 2}, f"{vocab}, {idx}"

@test("공기행렬: 대칭, 자기 자신은 0, 개수 정확")
def _():
    s = [["a", "b", "c"], ["a", "b"]]
    vocab, idx = build_vocab(s)
    C = cooccurrence(s, idx)
    assert approx(C, C.T) and approx(np.diag(C), [0, 0, 0])
    assert C[idx["a"], idx["b"]] == 2 and C[idx["a"], idx["c"]] == 1, f"C:\n{C}"

@test("embed: shape (|V|, d), U·S의 앞 d열")
def _():
    C = np.array([[0, 2, 1], [2, 0, 1], [1, 1, 0]], dtype=float)
    E = embed(C, 2)
    U, S, _ = np.linalg.svd(C)
    assert np.shape(E) == (3, 2) and approx(np.abs(E), np.abs(U[:, :2] * S[:2]))

@test("고양이·강아지가 고양이·자동차보다 가깝다")
def _():
    vocab, idx = build_vocab(sents)
    E = embed(cooccurrence(sents, idx), 3)
    c = lambda a, b: E[idx[a]] @ E[idx[b]] / (np.linalg.norm(E[idx[a]]) * np.linalg.norm(E[idx[b]]))
    assert c("고양이", "강아지") > 0.8 and c("자동차", "버스") > 0.8 and c("고양이", "자동차") < c("고양이", "강아지") - 0.3
`,
      hints: [
        "`vocab = sorted({w for s in sents for w in s})`, `idx = {w: i for i, w in enumerate(vocab)}`",
        "이중 반복문 `for i, w in enumerate(s): for j, c in enumerate(s): if i != j: C[idx[w], idx[c]] += 1`",
        "`U, S, Vt = np.linalg.svd(C)` 다음 `U[:, :d] * S[:d]`(브로드캐스팅으로 열마다 특잇값을 곱함)",
      ],
      solution: CORPUS + py`
import numpy as np

def build_vocab(sents):
    vocab = sorted({w for s in sents for w in s})
    idx = {w: i for i, w in enumerate(vocab)}
    return vocab, idx

def cooccurrence(sents, idx):
    C = np.zeros((len(idx), len(idx)))
    for s in sents:
        for i, w in enumerate(s):
            for j, c in enumerate(s):
                if i != j:
                    C[idx[w], idx[c]] += 1
    return C

def embed(C, d):
    U, S, Vt = np.linalg.svd(C)
    return U[:, :d] * S[:d]

vocab, idx = build_vocab(sents)
E = embed(cooccurrence(sents, idx), 3)
def cos(a, b):
    va, vb = E[idx[a]], E[idx[b]]
    return va @ vb / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-12)
for a, b in [("고양이", "강아지"), ("자동차", "버스"), ("고양이", "자동차")]:
    print(a, b, round(float(cos(a, b)), 2))
`,
    },
    {
      id: "w5-lab-rnn",
      sectionId: "rnn-bptt",
      title: "RNN 순전파와 시간을 거슬러 줄어드는 기울기",
      tier: "core",
      prompt: `
1. \`rnn_forward(xs, W, U, b)\`: $h_t = \\tanh(Wx_t + Uh_{t-1} + b)$를 $h_0 = 0$에서 시작해 계산하고 모든 $h_t$의 리스트를 돌려줍니다. 길이와 상관없이 같은 $W, U, b$를 씁니다(파라미터 공유).
2. \`grad_norms(hs, U)\`: BPTT에서 $\\partial h_T/\\partial h_k = \\prod_{t=k+1}^{T} \\mathrm{diag}(1 - h_t^2)\\,U$입니다. 뒤에서부터 야코비안을 하나씩 곱해 가며 거리 1, 2, …, T−1의 **스펙트럼 노름**(\`np.linalg.norm(J, 2)\`)을 리스트로 돌려줍니다.
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
      hints: [
        "`h = np.tanh(W @ x + U @ h + b)` 다음 `hs.append(h)`",
        "야코비안 한 칸은 `np.diag(1 - hs[t] ** 2) @ U`입니다. tanh의 미분 $1 - h^2$이 1 이하라 곱할수록 작아집니다.",
        "`J = J @ (np.diag(1 - hs[t] ** 2) @ U)`, `norms.append(np.linalg.norm(J, 2))`",
      ],
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
    {
      id: "w5-lab-attention",
      sectionId: "seq2seq-attention",
      title: "디코더가 필요할 때마다 다시 보는 attention",
      tier: "core",
      prompt: `
Seq2Seq의 병목을 푼 attention의 핵심 세 줄을 구현합니다.

- \`attention_weights(H, s)\`: 인코더 은닉 상태 \`H\`(T, d) 각각과 디코더 상태 \`s\`(d,)의 내적을 점수로 삼아 softmax한 가중치(합 1)
- \`context(H, s)\`: 가중치로 \`H\`의 행을 섞은 문맥 벡터(d,)

softmax는 최댓값을 빼서 계산합니다. 디코더 상태가 어떤 인코더 상태와 비슷하면 그 시점에 가중치가 몰려야 합니다.
`,
      starter: py`
import numpy as np

def attention_weights(H, s):
    scores = H @ s
    return np.ones(len(H)) / len(H)  # TODO: softmax(scores)

def context(H, s):
    return np.zeros(H.shape[1])  # TODO: 가중합

rng = np.random.default_rng(0)
H = rng.normal(size=(6, 16))
s = H[4] + 0.1 * rng.normal(size=16)
print(np.round(attention_weights(H, s), 2))
`,
      tests: py`
import numpy as np
rng = np.random.default_rng(3)
H = rng.normal(size=(6, 16))

@test("가중치 합 = 1, 모두 양수")
def _():
    w = attention_weights(H, rng.normal(size=16))
    assert approx(np.sum(w), 1.0) and np.all(w > 0)

@test("H[2]와 비슷한 디코더 상태 → 2번 시점에 가중치가 몰린다")
def _():
    w = attention_weights(H, H[2] + 0.05 * rng.normal(size=16))
    assert int(np.argmax(w)) == 2 and w[2] > 0.9, f"가중치: {np.round(w, 3)}"

@test("큰 점수에도 overflow 없음")
def _():
    w = attention_weights(np.array([[1000.0], [999.0]]), np.array([1.0]))
    assert approx(w, [1 / (1 + np.exp(-1)), 1 - 1 / (1 + np.exp(-1))])

@test("문맥 벡터 = 가중치로 섞은 H")
def _():
    s = rng.normal(size=16)
    assert approx(context(H, s), attention_weights(H, s) @ H)
`,
      hints: [
        "`e = np.exp(scores - scores.max())`, `e / e.sum()`",
        "`attention_weights(H, s) @ H`는 (T,) @ (T, d) = (d,)입니다.",
      ],
      solution: py`
import numpy as np

def attention_weights(H, s):
    scores = H @ s
    e = np.exp(scores - scores.max())
    return e / e.sum()

def context(H, s):
    return attention_weights(H, s) @ H

rng = np.random.default_rng(0)
H = rng.normal(size=(6, 16))
s = H[4] + 0.1 * rng.normal(size=16)
print(np.round(attention_weights(H, s), 2))
`,
    },
    {
      id: "w5-lab-sdpa",
      sectionId: "self-attention",
      title: "softmax(QKᵀ/√d_k)V 직접 계산하기",
      tier: "core",
      prompt: `
\`attention(Q, K, V, scale=True)\`가 \`(출력, 가중치)\`를 돌려주게 구현합니다. 가중치는 각 Query 행마다 Key들에 대한 softmax이며, \`scale=True\`면 점수를 $\\sqrt{d_k}$로 나눕니다.

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
      hints: [
        "`if scale: S = S / np.sqrt(K.shape[-1])`",
        "`weights = softmax(S, axis=-1)`: 각 행(Query)이 모든 Key에 대한 확률분포가 됩니다.",
        "출력은 `weights @ V`. 가져오는 것은 Key가 아니라 Value입니다.",
      ],
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
    {
      id: "w5-lab-heads",
      sectionId: "multi-head-causal",
      title: "헤드 나누기·합치기와 causal mask",
      tier: "core",
      prompt: `
멀티헤드 attention에서 가장 실수가 잦은 텐서 조작 세 가지를 따로 구현합니다.

1. \`split_heads(M, h)\`: (T, d) → (h, T, d/h). 헤드 $i$는 원래 열 \`[i*dk : (i+1)*dk]\`를 담당합니다.
2. \`merge_heads(Mh)\`: (h, T, dk) → (T, h·dk). \`split_heads\`의 역연산입니다.
3. \`causal_mask(T)\`: 자기보다 **뒤**(미래) 토큰 자리만 \`True\`인 (T, T) 불리언 행렬

\`reshape\`만으로 (h, T, dk)를 만들면 토큰과 헤드가 뒤섞입니다. 왜 \`transpose\`가 필요한지 테스트로 확인합니다.
`,
      starter: py`
import numpy as np

def split_heads(M, h):
    T, d = M.shape
    return M  # TODO: (T, h, dk)로 reshape한 뒤 (h, T, dk)로 축 순서를 바꿉니다.

def merge_heads(Mh):
    h, T, dk = Mh.shape
    return Mh  # TODO

def causal_mask(T):
    return np.zeros((T, T), dtype=bool)  # TODO: np.triu(..., k=1)

M = np.arange(12).reshape(3, 4)
print(split_heads(M, 2))
print(causal_mask(3).astype(int))
`,
      tests: py`
import numpy as np
M = np.arange(24).reshape(4, 6)

@test("split_heads: shape (h, T, dk), 헤드 i = 열 블록 i")
def _():
    S = split_heads(M, 3)
    assert np.shape(S) == (3, 4, 2), f"shape: {np.shape(S)}"
    assert approx(S[1], M[:, 2:4]) and approx(S[2], M[:, 4:6])

@test("merge_heads(split_heads(M)) == M")
def _():
    assert approx(merge_heads(split_heads(M, 2)), M) and approx(merge_heads(split_heads(M, 3)), M)

@test("causal_mask: 대각선 위만 True")
def _():
    assert causal_mask(3).tolist() == [[False, True, True], [False, False, True], [False, False, False]]

@test("마스크를 적용한 softmax: 첫 토큰은 자기 자신에만, 미래 가중치 0")
def _():
    S = np.random.default_rng(0).normal(size=(4, 4))
    S = np.where(causal_mask(4), -1e9, S)
    W = np.exp(S - S.max(axis=1, keepdims=True)); W /= W.sum(axis=1, keepdims=True)
    assert approx(W[0], [1, 0, 0, 0]) and approx(np.triu(W, 1), np.zeros((4, 4)))
`,
      hints: [
        "`M.reshape(T, h, d // h).transpose(1, 0, 2)`. reshape만 하면 (h, T, dk) 모양이어도 행이 토큰이 아니게 됩니다.",
        "합치기는 반대 순서: `Mh.transpose(1, 0, 2).reshape(T, h * dk)`",
        "`np.triu(np.ones((T, T), dtype=bool), k=1)`",
      ],
      solution: py`
import numpy as np

def split_heads(M, h):
    T, d = M.shape
    return M.reshape(T, h, d // h).transpose(1, 0, 2)

def merge_heads(Mh):
    h, T, dk = Mh.shape
    return Mh.transpose(1, 0, 2).reshape(T, h * dk)

def causal_mask(T):
    return np.triu(np.ones((T, T), dtype=bool), k=1)

M = np.arange(12).reshape(3, 4)
print(split_heads(M, 2))
print(causal_mask(3).astype(int))
`,
    },
    {
      id: "w5-lab-posenc",
      sectionId: "transformer-block",
      title: "사인·코사인 위치 인코딩으로 순서 구별하기",
      tier: "core",
      prompt: `
1. \`sinusoidal_pe(n, d)\`: 위치 $pos$, 짝수 차원 $2i$에 대해 $\\sin(pos / 10000^{2i/d})$, 다음 홀수 차원에 $\\cos(\\cdot)$를 넣은 (n, d) 행렬
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
      hints: [
        "`angle = pos / (10000 ** (i / d))`는 (n, d/2) 행렬입니다. `pe[:, 0::2] = np.sin(angle)`, `pe[:, 1::2] = np.cos(angle)`",
        "`Q, K, V = X @ Wq, X @ Wk, X @ Wv`, `S = Q @ K.T / np.sqrt(K.shape[-1])`",
        "행마다 softmax한 뒤 `@ V`. 행 순서를 바꿔도 같은 계산이 자리만 바뀌어 일어나므로 순열 등변입니다.",
      ],
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
    {
      id: "w5-lab-bpe",
      sectionId: "bpe",
      title: "BPE 병합 규칙 학습과 새 단어 토큰화",
      tier: "core",
      prompt: `
「토크나이저: BPE」의 알고리즘을 처음부터 구현합니다.

1. \`merge_pair(tokens, pair)\`: 토큰 리스트에서 연속한 \`pair\`를 왼쪽부터 겹치지 않게 하나로 합칩니다.
2. \`train_bpe(words, n_merges)\`: 각 단어를 "글자 + \`</w>\`"로 쪼갠 상태에서, 매번 **가장 자주 나온 인접 쌍**(\`Counter.most_common(1)\`)을 병합 규칙으로 추가하고 말뭉치 전체에 적용합니다. 병합 규칙 리스트를 돌려줍니다.
3. \`bpe_encode(word, merges)\`: 새 단어에 학습된 규칙을 **학습한 순서대로** 적용합니다.

학습에 없던 "slow"가 \`['s', 'low</w>']\`로 잘려야 합니다(OOV 완화).
`,
      starter: py`
from collections import Counter

def merge_pair(tokens, pair):
    merged, i = [], 0
    while i < len(tokens):
        # TODO: tokens[i], tokens[i+1]이 pair면 합쳐서 추가하고 두 칸 전진, 아니면 한 칸
        merged.append(tokens[i])
        i += 1
    return merged

def train_bpe(words, n_merges):
    corpus = [list(w) + ["</w>"] for w in words]
    merges = []
    for _ in range(n_merges):
        pass  # TODO: 인접 쌍 빈도 → 최빈 쌍 → merges에 추가 → corpus의 모든 단어에 merge_pair
    return merges

def bpe_encode(word, merges):
    tokens = list(word) + ["</w>"]
    # TODO
    return tokens

words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]
merges = train_bpe(words, 8)
print(merges)
for w in ["slow", "lowering", "banana"]:
    print(w, bpe_encode(w, merges))
`,
      tests: py`
words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]

@test("merge_pair: 왼쪽부터 겹치지 않게 합친다")
def _():
    assert merge_pair(["a", "a", "a"], ("a", "a")) == ["aa", "a"]
    assert merge_pair(["l", "o", "w", "l", "o"], ("l", "o")) == ["lo", "w", "lo"]

@test("첫 병합 세 개 = (w,e), (l,o), (we,r)")
def _():
    m = train_bpe(words, 8)
    assert len(m) == 8 and m[:3] == [("w", "e"), ("l", "o"), ("we", "r")], f"결과: {m}"

@test("학습에 없던 slow → ['s', 'low</w>']")
def _():
    assert bpe_encode("slow", train_bpe(words, 8)) == ["s", "low</w>"]

@test("lowering은 앞부분만, banana는 글자 단위로")
def _():
    m = train_bpe(words, 8)
    assert bpe_encode("lowering", m) == ["lo", "wer", "i", "n", "g", "</w>"], f"lowering: {bpe_encode('lowering', m)}"
    assert bpe_encode("banana", m) == list("banana") + ["</w>"]

@test("병합할 쌍이 없으면 일찍 멈춘다")
def _():
    assert len(train_bpe(["a"], 5)) == 1
`,
      hints: [
        "`if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == pair:` 이면 `merged.append(tokens[i] + tokens[i + 1]); i += 2`",
        "`pairs = Counter((t[i], t[i + 1]) for t in corpus for i in range(len(t) - 1))`, 비어 있으면 `break`, 아니면 `best = pairs.most_common(1)[0][0]`",
        "`bpe_encode`는 `for pair in merges: tokens = merge_pair(tokens, pair)`. 순서가 바뀌면 다른 토큰이 나옵니다.",
      ],
      solution: py`
from collections import Counter

def merge_pair(tokens, pair):
    merged, i = [], 0
    while i < len(tokens):
        if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == pair:
            merged.append(tokens[i] + tokens[i + 1])
            i += 2
        else:
            merged.append(tokens[i])
            i += 1
    return merged

def train_bpe(words, n_merges):
    corpus = [list(w) + ["</w>"] for w in words]
    merges = []
    for _ in range(n_merges):
        pairs = Counter((t[i], t[i + 1]) for t in corpus for i in range(len(t) - 1))
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]
        merges.append(best)
        corpus = [merge_pair(t, best) for t in corpus]
    return merges

def bpe_encode(word, merges):
    tokens = list(word) + ["</w>"]
    for pair in merges:
        tokens = merge_pair(tokens, pair)
    return tokens

words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]
merges = train_bpe(words, 8)
print(merges)
for w in ["slow", "lowering", "banana"]:
    print(w, bpe_encode(w, merges))
`,
    },
    {
      id: "w5-lab-lstm",
      sectionId: "lstm-gru",
      title: "LSTM 셀 한 스텝 구현하기",
      tier: "supplement",
      prompt: `
\`lstm_step(x, h, c, P)\`를 구현합니다. \`P\`는 게이트마다 \`(W, U, b)\`를 담은 딕셔너리이고 키는 \`"f"\`(forget), \`"i"\`(input), \`"g"\`(후보), \`"o"\`(output)입니다.

$$f = \\sigma(W_f x + U_f h + b_f),\\ i = \\sigma(\\cdots),\\ \\tilde c = \\tanh(W_g x + U_g h + b_g),\\ o = \\sigma(\\cdots)$$
$$c' = f \\odot c + i \\odot \\tilde c,\\qquad h' = o \\odot \\tanh(c')$$

\`(h', c')\`를 돌려줍니다. forget gate가 1, input gate가 0이면 셀 상태가 **그대로** 보존되는지 확인합니다. 이 덧셈 경로가 장기 기억의 핵심입니다.
`,
      starter: py`
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def lstm_step(x, h, c, P):
    gate = lambda k: P[k][0] @ x + P[k][1] @ h + P[k][2]
    f = i = o = np.zeros_like(c)   # TODO: sigmoid 게이트 세 개
    g = np.zeros_like(c)           # TODO: tanh 후보
    c_new = c                      # TODO
    h_new = h                      # TODO
    return h_new, c_new

def init(d_in, d_h, rng, bias=0.0):
    return (rng.normal(0, 0.3, (d_h, d_in)), rng.normal(0, 0.3, (d_h, d_h)), np.full(d_h, bias))

rng = np.random.default_rng(0)
P = {k: init(4, 8, rng) for k in "figo"}
h, c = np.zeros(8), np.zeros(8)
for x in rng.normal(size=(5, 4)):
    h, c = lstm_step(x, h, c, P)
print(np.round(h, 3))
`,
      tests: py`
import numpy as np
rng = np.random.default_rng(2)
P = {k: (rng.normal(0, 0.3, (6, 3)), rng.normal(0, 0.3, (6, 6)), rng.normal(0, 0.1, 6)) for k in "figo"}
sig = lambda z: 1 / (1 + np.exp(-z))

@test("식과 일치하는 한 스텝")
def _():
    x, h, c = rng.normal(size=3), rng.normal(size=6), rng.normal(size=6)
    pre = {k: P[k][0] @ x + P[k][1] @ h + P[k][2] for k in "figo"}
    c2 = sig(pre["f"]) * c + sig(pre["i"]) * np.tanh(pre["g"])
    h2 = sig(pre["o"]) * np.tanh(c2)
    hn, cn = lstm_step(x, h, c, P)
    assert approx(cn, c2) and approx(hn, h2)

@test("f = 1, i = 0이면 셀 상태가 그대로 보존된다")
def _():
    Z = lambda: (np.zeros((6, 3)), np.zeros((6, 6)))
    P2 = {"f": (*Z(), np.full(6, 50.0)), "i": (*Z(), np.full(6, -50.0)), "g": (*Z(), np.zeros(6)), "o": (*Z(), np.zeros(6))}
    c = rng.normal(size=6)
    h, c_out = np.zeros(6), c.copy()
    for _ in range(20):
        h, c_out = lstm_step(rng.normal(size=3), h, c_out, P2)
    assert approx(c_out, c, 1e-6)

@test("출력 h의 각 성분은 (-1, 1) 범위")
def _():
    h, c = np.zeros(6), np.zeros(6)
    for x in rng.normal(size=(10, 3)) * 5:
        h, c = lstm_step(x, h, c, P)
    assert np.all(np.abs(h) < 1)
`,
      hints: [
        "`f, i, o = sigmoid(gate(\"f\")), sigmoid(gate(\"i\")), sigmoid(gate(\"o\"))`, `g = np.tanh(gate(\"g\"))`",
        "`c_new = f * c + i * g`(원소별 곱), `h_new = o * np.tanh(c_new)`",
        "c 경로에는 행렬곱이 없고 f를 곱한 뒤 더하기만 합니다. f가 1에 가까우면 기울기도 거의 그대로 흘러갑니다.",
      ],
      solution: py`
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def lstm_step(x, h, c, P):
    gate = lambda k: P[k][0] @ x + P[k][1] @ h + P[k][2]
    f, i, o = sigmoid(gate("f")), sigmoid(gate("i")), sigmoid(gate("o"))
    g = np.tanh(gate("g"))
    c_new = f * c + i * g
    h_new = o * np.tanh(c_new)
    return h_new, c_new

def init(d_in, d_h, rng, bias=0.0):
    return (rng.normal(0, 0.3, (d_h, d_in)), rng.normal(0, 0.3, (d_h, d_h)), np.full(d_h, bias))

rng = np.random.default_rng(0)
P = {k: init(4, 8, rng) for k in "figo"}
h, c = np.zeros(8), np.zeros(8)
for x in rng.normal(size=(5, 4)):
    h, c = lstm_step(x, h, c, P)
print(np.round(h, 3))
`,
    },
    {
      id: "w5-lab-kvcache",
      sectionId: "kv-cache-rope",
      title: "KV 캐시로 한 토큰씩 생성하기와 RoPE의 상대 거리",
      tier: "supplement",
      prompt: `
1. \`generate_with_cache(X, Wq, Wk, Wv)\`: 토큰이 하나씩 들어온다고 보고, 매 스텝 **새 토큰의 q, k, v만** 계산해 K·V 캐시에 쌓은 뒤 캐시 전체에 attention해 출력을 모읍니다. \`(출력들 (n, d), K·V 계산 횟수)\`를 돌려줍니다. 결과는 문장 전체를 causal mask로 한 번에 계산한 것과 **정확히 같아야** 합니다.
2. \`rope(v, pos, theta=0.3)\`: 성분 쌍 $(v_{2i}, v_{2i+1})$을 각도 $pos \\cdot \\theta / 10000^{2i/d}$만큼 회전합니다. 회전한 $q$(위치 $m$)와 $k$(위치 $n$)의 내적은 $m - n$에만 의존해야 합니다.
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
      hints: [
        "스텝마다 `K_cache.append(k)`, `Kc = np.stack(K_cache)`. 캐시에는 지금까지의 토큰만 있으므로 마스크가 필요 없습니다.",
        "`outputs.append(softmax(Kc @ q / np.sqrt(d)) @ Vc)`",
        "회전: `c, s = np.cos(ang), np.sin(ang)`, `out[i], out[i + 1] = c * v[i] - s * v[i + 1], s * v[i] + c * v[i + 1]`",
      ],
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
    {
      id: "w5-lab-params",
      sectionId: "transformer-params",
      title: "GPT형 모델의 파라미터·연산량·메모리 계산기",
      tier: "supplement",
      prompt: `
「Transformer의 크기 계산」 단계의 셈을 함수로 만듭니다. 모든 층에 편향이 있고, MLP는 $d \\to 4d \\to d$, LayerNorm은 블록당 두 개($\\gamma, \\beta$), 마지막 LayerNorm 하나, 출력층은 토큰 임베딩과 공유(weight tying)합니다.

1. \`block_params(d)\`: 블록 하나의 파라미터 수 (attention: $Q,K,V$ 투영 + $W^O$, 편향 포함 / MLP 편향 포함 / LayerNorm 두 개)
2. \`gpt_params(vocab, n_ctx, d, n_layers)\`: 토큰 임베딩 + 학습형 위치 임베딩 + 블록들 + 마지막 LayerNorm
3. \`train_flops(n_params, n_tokens)\` $\\approx 6ND$
4. \`kv_cache_bytes(n_layers, d, n_ctx, batch=1, bytes_per=2)\` $= 2 \\times L \\times d \\times n_{ctx} \\times \\text{batch} \\times \\text{bytes}$

GPT-2 small(\`50257, 1024, 768, 12\`)은 124,439,808개가 나와야 합니다.
`,
      starter: py`
def block_params(d):
    attn = 0  # TODO: d×3d + 3d + d×d + d
    mlp = 0   # TODO: d×4d + 4d + 4d×d + d
    ln = 0    # TODO: LayerNorm 두 개
    return attn + mlp + ln

def gpt_params(vocab, n_ctx, d, n_layers):
    return 0  # TODO

def train_flops(n_params, n_tokens):
    return 0  # TODO

def kv_cache_bytes(n_layers, d, n_ctx, batch=1, bytes_per=2):
    return 0  # TODO

print(f"{gpt_params(50257, 1024, 768, 12):,}")
`,
      tests: py`
@test("블록 하나: d=768 → 7,087,872개 (≈ 12d²)")
def _():
    assert block_params(768) == 7_087_872, f"결과: {block_params(768):,}"

@test("GPT-2 small = 124,439,808개")
def _():
    assert gpt_params(50257, 1024, 768, 12) == 124_439_808, f"결과: {gpt_params(50257, 1024, 768, 12):,}"

@test("큰 d에서는 블록 파라미터가 12d²에 수렴한다")
def _():
    d = 8192
    assert abs(block_params(d) / (12 * d * d) - 1) < 1e-3

@test("7B 모델, 1조 토큰 학습 ≈ 4.2e22 FLOPs")
def _():
    assert abs(train_flops(7e9, 1e12) - 4.2e22) < 1e19

@test("KV 캐시: 32층, d=4096, 문맥 4096, fp16 → 2 GiB")
def _():
    assert kv_cache_bytes(32, 4096, 4096) == 2 * 2**30, f"결과: {kv_cache_bytes(32, 4096, 4096):,}"
    assert kv_cache_bytes(32, 4096, 4096, batch=8) == 16 * 2**30
`,
      hints: [
        "attention은 `d * 3 * d + 3 * d + d * d + d`, MLP는 `d * 4 * d + 4 * d + 4 * d * d + d`, LayerNorm 두 개는 `2 * (2 * d)`입니다.",
        "`gpt_params`는 `vocab * d + n_ctx * d + n_layers * block_params(d) + 2 * d`입니다(마지막 LayerNorm의 두 파라미터 벡터).",
        "`train_flops`는 `6 * n_params * n_tokens`, KV 캐시는 `2 * n_layers * d * n_ctx * batch * bytes_per`입니다.",
      ],
      solution: py`
def block_params(d):
    attn = d * 3 * d + 3 * d + d * d + d
    mlp = d * 4 * d + 4 * d + 4 * d * d + d
    ln = 2 * (2 * d)
    return attn + mlp + ln

def gpt_params(vocab, n_ctx, d, n_layers):
    return vocab * d + n_ctx * d + n_layers * block_params(d) + 2 * d

def train_flops(n_params, n_tokens):
    return 6 * n_params * n_tokens

def kv_cache_bytes(n_layers, d, n_ctx, batch=1, bytes_per=2):
    return 2 * n_layers * d * n_ctx * batch * bytes_per

print(f"{gpt_params(50257, 1024, 768, 12):,}")
`,
    },
    {
      id: "w5-lab-online-softmax",
      sectionId: "efficient-attention",
      title: "온라인 softmax로 블록 단위 attention 계산하기",
      tier: "advanced",
      prompt: `
「긴 문맥의 비용」 단계의 온라인 softmax를 구현합니다.

1. \`stable_softmax(s)\`: 최댓값을 뺀 softmax (1차원)
2. \`online_attention_row(q, K, V, block)\`: query 하나에 대해 \`K\`, \`V\`를 \`block\`개씩 나눠 보면서 최댓값 $m$, 지수 합 $\\ell$, 가중합 $a$를 본문의 갱신식으로 누적하고 $a/\\ell$을 돌려줍니다. 점수는 $k^\\top q/\\sqrt{d}$입니다. $n \\times n$이든 $n$ 길이든 점수 배열을 **한꺼번에 만들지 않아야** 합니다(블록 크기만큼만).
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
      hints: [
        "`e = np.exp(s - s.max())` 뒤 `e / e.sum()`입니다.",
        "블록마다 `m_new = max(m, s.max())`, `scale = np.exp(m - m_new)`, `p = np.exp(s - m_new)`를 구합니다. 처음에는 $m = -\\infty$라 `scale`이 0이 되는데, 이전 누적값도 0이므로 문제없습니다.",
        "`l = l * scale + p.sum()`, `acc = acc * scale + p @ V[start:start + block]`, `m = m_new`. 전체는 `np.array([online_attention_row(q, K, V, block) for q in Q])`입니다.",
      ],
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
    {
      id: "w5-lab-linear-attn",
      sectionId: "linear-attention",
      title: "인과적 선형 어텐션: 행렬 계산과 RNN 계산",
      tier: "advanced",
      prompt: `
「선형 어텐션」 단계의 두 계산을 구현합니다. 특징 사상은 $\\phi(x) = \\mathrm{elu}(x) + 1$(양수면 $x+1$, 아니면 $e^x$)입니다.

1. \`phi(x)\`
2. \`causal_linear_quadratic(Q, K, V)\`: $A = \\phi(Q)\\phi(K)^\\top$의 아래 삼각 부분(대각 포함)만 남겨 $AV$를 각 행의 합으로 나눈 \`(n, d_v)\`
3. \`causal_linear_recurrent(Q, K, V)\`: 상태 $S \\in \\mathbb{R}^{d_k \\times d_v}$, $z \\in \\mathbb{R}^{d_k}$를 0에서 시작해 토큰마다 $S \\mathrel{+}= \\phi(k_t)v_t^\\top$, $z \\mathrel{+}= \\phi(k_t)$로 갱신하고 $o_t = \\phi(q_t)^\\top S / \\phi(q_t)^\\top z$
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
      hints: [
        "`np.where(x > 0, x + 1, np.exp(x))`입니다(음수 쪽 `np.exp`의 경고가 싫다면 `np.exp(np.minimum(x, 0))`).",
        "`A = np.tril(phi(Q) @ phi(K).T)` 다음 `(A @ V) / A.sum(axis=1, keepdims=True)`입니다.",
        "반복문 안에서 `S += np.outer(phi(K[t]), V[t])`, `z += phi(K[t])`, `q = phi(Q[t])`, `out.append(q @ S / (q @ z))`입니다.",
      ],
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
    {
      id: "w5-lab-rope-pi",
      sectionId: "position-extrapolation",
      title: "RoPE의 파장·상대 위치와 위치 보간",
      tier: "advanced",
      prompt: `
「위치 인코딩의 수학과 길이 외삽」 단계의 계산을 구현합니다. 성분 쌍 $i = 0, \\dots, d/2 - 1$의 회전 속도는 $\\theta_i = \\text{base}^{-2i/d}$입니다.

1. \`rope_freqs(d, base=10000)\`: 길이 $d/2$인 $\\theta$ 배열
2. \`rope(v, pos, freqs)\`: 벡터 \`v\`(길이 $d$)의 성분 쌍 \`(v[2i], v[2i+1])\`을 각도 \`pos * freqs[i]\`만큼 회전한 새 벡터
3. \`n_unrotated(d, L, base=10000)\`: 파장 $2\\pi/\\theta_i$가 학습 길이 \`L\`보다 긴(학습 중 한 바퀴도 못 돈) 성분 쌍의 개수
4. \`interpolate(pos, L_train, L_new)\`: 위치 보간 $\\text{pos}\\cdot\\frac{L_{\\text{train}} - 1}{L_{\\text{new}} - 1}$
`,
      starter: py`
import numpy as np

def rope_freqs(d, base=10000.0):
    return np.ones(d // 2)  # TODO

def rope(v, pos, freqs):
    return np.array(v, dtype=float)  # TODO

def n_unrotated(d, L, base=10000.0):
    return 0  # TODO

def interpolate(pos, L_train, L_new):
    return pos  # TODO

f = rope_freqs(64)
print(n_unrotated(64, 2048), interpolate(8191, 2048, 8192))
`,
      tests: py`
import numpy as np

@test("θ_0 = 1, θ_i = base^(-2i/d)")
def _():
    f = rope_freqs(8)
    assert approx(f, [1.0, 10000 ** -0.25, 10000 ** -0.5, 10000 ** -0.75])

@test("회전은 벡터 길이를 바꾸지 않는다")
def _():
    v = np.random.default_rng(0).normal(size=16)
    assert approx(np.linalg.norm(rope(v, 37, rope_freqs(16))), np.linalg.norm(v))

@test("내적은 상대 거리에만 의존한다")
def _():
    rng = np.random.default_rng(1)
    q, k, f = rng.normal(size=16), rng.normal(size=16), rope_freqs(16)
    a = rope(q, 5, f) @ rope(k, 3, f)
    b = rope(q, 105, f) @ rope(k, 103, f)
    c = rope(q, 3, f) @ rope(k, 5, f)
    assert approx(a, b) and not approx(a, c)

@test("d=64, 학습 길이 2048에서 한 바퀴도 못 도는 성분 11개")
def _():
    assert n_unrotated(64, 2048) == 11, f"결과: {n_unrotated(64, 2048)}"
    assert n_unrotated(64, 100_000) == 0

@test("위치 보간: 8191 → 2047, 0 → 0")
def _():
    assert approx(interpolate(8191, 2048, 8192), 2047.0) and approx(interpolate(0, 2048, 8192), 0.0)
`,
      hints: [
        "`base ** (-np.arange(0, d, 2) / d)`가 $\\theta$ 배열입니다.",
        "`out = v.copy()` 뒤 성분 쌍마다 `c, s = np.cos(pos * freqs[i]), np.sin(pos * freqs[i])`, `out[2i], out[2i+1] = c*v[2i] - s*v[2i+1], s*v[2i] + c*v[2i+1]`입니다.",
        "`n_unrotated`는 `int(np.sum(2 * np.pi / rope_freqs(d, base) > L))`입니다.",
      ],
      solution: py`
import numpy as np

def rope_freqs(d, base=10000.0):
    return base ** (-np.arange(0, d, 2) / d)

def rope(v, pos, freqs):
    v = np.asarray(v, dtype=float)
    out = v.copy()
    for i, th in enumerate(freqs):
        c, s = np.cos(pos * th), np.sin(pos * th)
        out[2 * i], out[2 * i + 1] = c * v[2 * i] - s * v[2 * i + 1], s * v[2 * i] + c * v[2 * i + 1]
    return out

def n_unrotated(d, L, base=10000.0):
    return int(np.sum(2 * np.pi / rope_freqs(d, base) > L))

def interpolate(pos, L_train, L_new):
    return pos * (L_train - 1) / (L_new - 1)

f = rope_freqs(64)
print(n_unrotated(64, 2048), interpolate(8191, 2048, 8192))
`,
    },
  ],

  quiz: [
    {
      kind: "choice",
      id: "w5-drill-softmax-axis",
      tier: "core",
      sectionId: "self-attention",
      question: "Query 5개(`Q`: (5, 8))와 Key 7개(`K`: (7, 8))로 `S = Q @ K.T`를 만들었다. attention 가중치를 만들 때 softmax는 어느 축으로 해야 하는가?",
      choices: ["axis=0: Key마다 Query들에 대한 분포", "axis=-1: Query(행)마다 Key 7개에 대한 분포", "전체 35칸에 한 번", "축과 상관없다"],
      answer: 1,
      explanation: "`S`는 (5, 7)이고 행 하나가 Query 하나입니다. 각 Query가 어떤 Key를 얼마나 참고할지의 확률분포가 필요하므로 행마다(마지막 축) softmax해 행 합이 1이 되게 합니다. 그래야 `weights @ V`가 Query마다의 가중합이 됩니다.",
    },
    {
      kind: "choice",
      id: "w5-drill-triu0",
      tier: "core",
      sectionId: "multi-head-causal",
      question: "causal mask를 `np.triu(np.ones((n, n)), 1)` 대신 `np.triu(np.ones((n, n)), 0)`으로 만들어 `-1e9`를 채우면 **첫 번째 토큰**의 가중치 행은?",
      choices: [
        "자기 자신에만 1이 된다",
        "행 전체가 -1e9라 softmax가 균등해져, 미래 토큰까지 1/n씩 섞인다",
        "모든 가중치가 0이 된다",
        "오류가 난다",
      ],
      answer: 1,
      explanation: "k=0이면 대각선(자기 자신)까지 가려집니다. 첫 행은 모든 칸이 같은 -1e9라 softmax 결과가 균등분포가 되어, 막아야 할 미래 토큰을 똑같이 참고합니다. 오류 없이 조용히 틀리므로 \"마지막 토큰을 바꿔도 앞 토큰 출력이 그대로인가\" 같은 테스트가 필요합니다.",
    },
    {
      kind: "choice",
      id: "w5-drill-endofword",
      tier: "core",
      sectionId: "bpe",
      question: "BPE 학습에서 각 단어 끝에 `</w>`를 붙이는 이유는?",
      choices: [
        "단어 수를 세기 위해",
        "\"low\"의 끝 w와 \"wide\"의 첫 w처럼 단어 끝 조각과 단어 안 조각을 구별하기 위해",
        "토큰 수를 줄이기 위해",
        "대문자를 표시하기 위해",
      ],
      answer: 1,
      explanation: "경계 표시가 없으면 단어 끝에서만 의미 있는 조각(예: 'est</w>')과 단어 중간의 같은 글자열을 구별할 수 없고, 토큰을 다시 이어 붙일 때 단어 경계도 복원할 수 없습니다.",
    },
    {
      kind: "predict",
      id: "w5-drill-scores",
      tier: "core",
      sectionId: "self-attention",
      code: py`
import numpy as np
q = np.array([1, 1, 0, 1])
K = np.array([[1, 0, 0, 0], [1, 1, 1, 1], [0, 0, 1, 0], [1, 1, 0, -1]])
print((K @ q).tolist(), (K @ q / np.sqrt(4)).tolist())
`,
      expected: "[1, 3, 0, 1] [0.5, 1.5, 0.0, 0.5]",
      explanation: "Query와 각 Key의 내적은 고양이가 1, 생선을 3, 맛있게 0, 먹었다 1입니다. $\\sqrt{d_k} = 2$로 나누면 `[0.5, 1.5, 0.0, 0.5]`가 되고, 여기에 softmax를 하면 본문의 18.8% · 51.0% · 11.4% · 18.8%가 나옵니다.",
    },
    {
      kind: "predict",
      id: "w5-drill-triu",
      tier: "core",
      sectionId: "multi-head-causal",
      code: py`
import numpy as np
print(np.triu(np.ones((3, 3)), 1).astype(int).tolist())
print(np.tril(np.ones((3, 3))).astype(int).sum(axis=1).tolist())
`,
      expected: "[[0, 1, 1], [0, 0, 1], [0, 0, 0]]\n[1, 2, 3]",
      explanation: "`np.triu(..., 1)`은 대각선 바로 위부터, 즉 각 토큰보다 뒤에 있는 자리를 1로 표시합니다(가릴 자리). 반대로 `np.tril`은 볼 수 있는 자리이고, 토큰 $i$는 자기를 포함해 $i+1$개를 봅니다.",
    },
    {
      kind: "predict",
      id: "w5-drill-bpe-pairs",
      tier: "core",
      sectionId: "bpe",
      code: py`
from collections import Counter
words = ["low", "low", "lower"]
corpus = [list(w) + ["</w>"] for w in words]
pairs = Counter((t[i], t[i + 1]) for t in corpus for i in range(len(t) - 1))
print(pairs.most_common(2))
print(len(pairs))
`,
      expected: "[(('l', 'o'), 3), (('o', 'w'), 3)]\n6",
      explanation: "인접 쌍은 (l,o)와 (o,w)가 세 단어 모두에서 3번, (w,</w>)가 2번, (w,e)·(e,r)·(r,</w>)가 1번씩으로 모두 6종류입니다. 빈도가 같으면 먼저 등장한 쌍이 앞에 옵니다. BPE는 다음 단계에서 (l,o)를 'lo'로 병합합니다.",
    },
    {
      kind: "descriptive",
      id: "w5-drill-bottleneck",
      tier: "core",
      sectionId: "seq2seq-attention",
      question: "병목 실험에서 마지막 은닉 상태 $h_T$로 첫 토큰을 복원하는 $R^2$는 문장이 길어질수록 0으로 떨어졌지만 $h_1$로는 길이와 무관하게 1이었습니다. 이유를 설명하고, 은닉 차원을 16에서 64로 늘려도 병목이 '해결'되지 않는 이유를 적으십시오.",
      modelAnswer:
        "$h_T$는 고정된 16차원 벡터 하나에 지금까지 읽은 모든 토큰을 덮어쓰며 요약한 것이라, 길이가 늘수록 앞쪽 토큰의 정보가 뒤 토큰에 밀려 사라집니다. 길이 40이면 $40 \\times 4 = 160$개의 숫자를 16차원에 담아야 하니 원리적으로 불가능합니다. $h_1$은 첫 토큰을 읽은 직후의 상태라 그 정보를 그대로 담고 있습니다. 은닉 차원을 64로 늘리면 담을 수 있는 양이 늘어 더 긴 문장까지 버티지만, 문장 길이는 얼마든지 더 길어질 수 있으므로 고정 크기라는 한계는 그대로입니다. attention은 디코더가 필요할 때마다 모든 $h_t$를 직접 다시 보게 해 이 한계를 구조적으로 피합니다.",
      keyPoints: ["$h_T$는 고정 크기 벡터 하나에 전체를 덮어쓴 요약", "길수록 앞 토큰 정보가 밀려난다", "$h_1$은 첫 토큰 정보를 그대로 담고 있다", "차원을 늘려도 길이가 더 길어지면 같은 한계", "attention은 모든 $h_t$를 직접 다시 본다"],
    },
    {
      kind: "descriptive",
      id: "w5-drill-perm",
      tier: "core",
      sectionId: "transformer-block",
      question: "위치 인코딩 없는 self-attention에 \"고양이가 생선을 먹었다\"와 \"먹었다 생선을 고양이가\"를 넣으면, 각 단어의 출력은 같고 **문장 전체 출력의 평균**도 같습니다. 각각 순열 등변·순열 불변 중 무엇인지 구분해 설명하고, causal mask를 쓰면 왜 위치 인코딩 없이도 '고양이가'의 출력이 달라지는지 적으십시오.",
      modelAnswer:
        "마스크 없는 self-attention은 모든 토큰이 모든 토큰을 같은 방식으로 보므로, 입력 순서를 바꾸면 각 단어의 출력도 같은 값으로 자리만 바뀝니다. 이것이 순열 등변입니다. 여기에 평균처럼 순서와 무관한 집계를 하면 결과가 아예 같아지므로 문장 평균은 순열 불변입니다. causal mask를 쓰면 토큰마다 볼 수 있는 범위가 자리에 따라 달라집니다. 첫 문장에서 '고양이가'는 맨 앞이라 자기 자신만 보지만, 둘째 문장에서는 맨 끝이라 세 단어를 모두 봅니다. 그래서 위치 인코딩 없이도 출력이 달라지며, 마스크 자체가 위치 정보를 일부 주입하는 셈입니다.",
      keyPoints: ["단어별 출력이 자리만 바뀜 = 순열 등변", "평균 같은 집계는 순열 불변", "causal mask는 자리에 따라 볼 수 있는 범위를 바꾼다", "맨 앞이면 자기만, 맨 뒤면 전부를 본다"],
    },
    {
      kind: "choice",
      id: "w5-drill-cache-mask",
      tier: "supplement",
      sectionId: "kv-cache-rope",
      question: "KV 캐시로 한 토큰씩 생성할 때 causal mask를 쓰지 않아도 결과가 학습 때와 같은 이유는?",
      choices: [
        "생성할 때는 미래 토큰을 봐도 괜찮기 때문에",
        "캐시에는 현재 토큰까지의 K·V만 들어 있어, 볼 수 있는 범위가 이미 과거로 제한되기 때문에",
        "RoPE가 마스크 역할을 하기 때문에",
        "softmax가 미래 토큰에 0을 주도록 학습되었기 때문에",
      ],
      answer: 1,
      explanation: "생성 시점 $t$의 캐시에는 위치 0~$t$의 Key·Value만 있습니다. 아직 만들어지지 않은 미래 토큰은 존재하지 않으므로, 전체 문장을 한 번에 계산할 때 마스크로 가리던 것과 똑같은 계산이 됩니다.",
    },
    {
      kind: "predict",
      id: "w5-drill-kv-memory",
      tier: "supplement",
      sectionId: "kv-cache-rope",
      code: py`
n_layers, n_heads, head_dim, seq, batch = 32, 32, 128, 2048, 1
elems = n_layers * n_heads * head_dim * seq * 2 * batch
print(elems, round(elems * 2 / 1e9, 2))
`,
      expected: "536870912 1.07",
      explanation: "레이어 수 · 헤드 수 · 헤드 차원 · 시퀀스 길이 · 2(K와 V) · 배치를 모두 곱하면 약 5억 3,700만 개입니다. fp16은 원소당 2바이트라 약 1.07GB이며, 배치 8이면 8배로 늘어납니다.",
    },
    {
      kind: "descriptive",
      id: "w5-drill-forget-bias",
      tier: "supplement",
      sectionId: "lstm-gru",
      question: "LSTM을 실험해 보면 forget bias가 0일 때 RNN보다 오히려 첫 시점의 영향이 더 빨리 사라지는데, bias를 2 이상으로 올리면 40스텝 뒤에도 살아남습니다. 셀 상태 식 $c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde c_t$로 이유를 설명하십시오.",
      modelAnswer:
        "첫 시점의 기억이 $T$스텝 뒤까지 전달되는 정도는 대략 forget gate 값들의 곱 $\\prod f_t$에 비례합니다(셀 경로에는 행렬곱이나 tanh가 없고 원소별 곱셈과 덧셈만 있기 때문). bias가 0이면 $f_t \\approx \\sigma(0) = 0.5$ 근처라 40스텝 뒤에는 $0.5^{40} \\approx 10^{-12}$ 수준으로 사라져 RNN보다도 나빠집니다. bias를 2~4로 올리면 $f_t$가 0.87~0.98이 되어 곱이 천천히 줄고 기억이 살아남습니다. 즉 장기 기억의 핵심은 게이트가 있다는 사실 자체가 아니라 $f_t \\approx 1$로 유지되는 덧셈 경로이고, 그래서 실무에서 forget bias를 1 이상으로 초기화합니다.",
      keyPoints: ["기억의 전달은 forget gate 값들의 곱에 비례", "셀 경로는 원소별 곱셈과 덧셈뿐(행렬곱·tanh 없음)", "bias 0이면 $f \\approx 0.5$라 빠르게 사라진다", "bias를 올려 $f \\approx 1$이면 기억이 유지된다"],
    },
    {
      kind: "choice",
      id: "w5-drill-params-ratio",
      tier: "supplement",
      sectionId: "transformer-params",
      question: "은닉 차원을 두 배($d \\to 2d$)로 키우고 층 수는 그대로 두면 블록들의 파라미터 수와 토큰당 순전파 FLOPs는 대략?",
      choices: ["둘 다 4배", "둘 다 2배", "파라미터 4배, FLOPs 2배", "파라미터 2배, FLOPs 4배"],
      answer: 0,
      explanation:
        "블록 파라미터는 약 $12Ld^2$라 $d$를 두 배로 하면 4배이고, 토큰당 순전파 FLOPs는 약 $2N$이라 함께 4배입니다. 폭을 넓히는 것이 층을 늘리는 것보다 파라미터를 훨씬 빠르게 늘립니다.",
    },
    {
      kind: "predict",
      id: "w5-drill-kv-bytes",
      tier: "supplement",
      sectionId: "transformer-params",
      code: py`
L, d, n_ctx = 32, 4096, 8192
kv = 2 * L * d * n_ctx * 2          # K·V × 층 × 차원 × 문맥 × fp16 바이트
print(kv // 2**30, "GiB")
print(round(7e9 * 2 / 2**30, 1), "GiB")
`,
      expected: "4 GiB\n13.0 GiB",
      explanation:
        "KV 캐시는 $2\\times32\\times4096\\times8192\\times2 = 4\\,\\text{GiB}$로, 문맥 8천 토큰 하나에 7B 모델 가중치(fp16 약 13GiB)의 3분의 1에 가까운 메모리가 듭니다. 배치를 8로 늘리면 32GiB가 되어 가중치보다 커집니다. 그래서 GQA·KV 캐시 양자화 같은 기법이 쓰입니다.",
    },
    {
      kind: "predict",
      id: "w5-drill-online",
      tier: "advanced",
      sectionId: "efficient-attention",
      code: py`
import math
blocks = [[1.0, 2.0], [5.0, 0.0]]
m, l = -math.inf, 0.0
for b in blocks:
    m_new = max(m, max(b))
    l = l * math.exp(m - m_new) + sum(math.exp(s - m_new) for s in b)
    m = m_new
exact = sum(math.exp(s - 5.0) for s in [1.0, 2.0, 5.0, 0.0])
print(m, round(l, 6), round(exact, 6))
`,
      expected: "5.0 1.074841 1.074841",
      explanation:
        "첫 블록 뒤 $m = 2$, $\\ell = e^{-1} + 1$입니다. 둘째 블록에서 $m' = 5$가 되어 이전 $\\ell$에 $e^{2-5}$를 곱해 새 기준으로 맞추고 $e^0 + e^{-5}$를 더합니다. 결과가 네 점수를 한꺼번에 본 $\\sum e^{s - 5}$와 정확히 같습니다.",
    },
    {
      kind: "choice",
      id: "w5-drill-linear",
      tier: "advanced",
      sectionId: "linear-attention",
      question: "문맥 길이 $n$이 매우 클 때, 인과적 선형 어텐션 모델과 softmax attention 모델의 생성 단계(토큰 하나 생성)에 대한 설명으로 옳은 것은?",
      choices: [
        "선형 어텐션은 고정 크기 상태만 갱신해 토큰당 비용이 $n$과 무관하고, softmax는 KV 캐시 전체와 내적해야 해서 $n$에 비례한다",
        "둘 다 토큰당 비용이 $n^2$에 비례한다",
        "softmax attention이 상태 크기가 고정이다",
        "선형 어텐션은 KV 캐시가 더 크다",
      ],
      answer: 0,
      explanation:
        "선형 어텐션은 $S_t = S_{t-1} + \\phi(k_t)v_t^\\top$를 갱신하는 RNN이라 토큰당 $O(d^2)$입니다. softmax attention은 새 query를 캐시된 $n$개의 Key와 비교해야 해서 $O(nd)$이고 캐시도 $n$에 비례합니다. 대신 선형 어텐션은 과거를 압축해 정확한 검색에 약합니다.",
    },
    {
      kind: "descriptive",
      id: "w5-drill-pi",
      tier: "advanced",
      sectionId: "position-extrapolation",
      question:
        "4K 토큰으로 사전학습한 RoPE 모델을 32K 문맥에서 쓰려고 합니다. 아무 조치 없이 쓰면 무엇이 문제인지 성분별 파장으로 설명하고, 위치 보간과 NTK-aware(또는 YaRN) 방식을 비교해 어떤 선택을 할지 근거와 함께 제안하십시오.",
      modelAnswer:
        "RoPE의 느린 성분은 파장이 4K보다 길어 사전학습 중 한 바퀴도 돌지 못했고, 그 성분이 본 각도는 $[0, 4096\\theta_i)$뿐입니다. 32K 문맥에서는 그 범위를 크게 벗어난 처음 보는 각도가 나와, 학습한 적 없는 $q\\cdot k$ 패턴 때문에 attention이 무너집니다. 위치 보간은 모든 위치를 $4096/32768 = 1/8$로 줄여 각도를 학습 범위 안에 두므로 짧은 추가 학습만으로 적응하지만, 이웃 위치의 각도 차이도 1/8로 줄어 가까운 토큰의 순서 구별(빠른 성분의 해상도)이 흐려집니다. NTK-aware·YaRN은 주파수마다 다르게 늘려, 범위를 벗어나는 느린 성분은 크게 보간하고 빠른 성분은 거의 그대로 둡니다. 따라서 짧은 거리의 성능을 지키면서 긴 문맥으로 확장하려면 YaRN 같은 주파수별 방식을 쓰고, 목표 길이의 데이터로 소량 추가 학습한 뒤 짧은 문맥 벤치마크와 긴 문맥 검색 과제(예: 바늘 찾기)로 함께 검증하겠습니다.",
      keyPoints: ["느린 성분은 학습 길이 안에서 한 바퀴도 못 돌아 처음 보는 각도가 생긴다", "위치 보간: 각도를 범위 안으로, 대가는 해상도 감소", "NTK-aware·YaRN: 주파수별로 다르게 늘림", "추가 학습과 짧은·긴 문맥 양쪽 평가"],
    },
  ],

  assignment: {
    requirements: [
      "`multi_head_attention`의 점수 계산 TODO를 채우고, 모든 중간 텐서 옆에 shape 주석을 적는다($W^O$ 출력 투영 포함).",
      "검증 (a) 헤드별 계산과 비교, (b) causal 테스트, (c) 반복문 참조 구현과 비교가 모두 `True`가 된다.",
      "본문 숫자 예제(가중치 18.8% · 51.0% · 11.4% · 18.8%, 출력 $[1.24, 1.65]$)를 재현하고, Query를 두 가지 이상 바꿔 표로 비교한다.",
      "마스크·스케일링 네 조합의 히트맵과 $d_k$별 최대 가중치를 근거로 관찰을 세 문장 이상 쓴다.",
      "\"Attention Is All You Need\" 리포트를 출처와 함께 작성한다.",
    ],
    autoTests: [
      {
        id: "w5-at-mha",
        taskId: "mha",
        title: "multi_head_attention이 독립 구현과 일치하고 가중치가 올바르다",
        code: py`
import numpy as np
rng_t = np.random.default_rng(11)
Tt, dm, nh = 5, 8, 2
Xt = rng_t.normal(size=(Tt, dm))
Ws = [rng_t.normal(scale=dm ** -0.5, size=(dm, dm)) for _ in range(4)]
out_t, w_t = multi_head_attention(Xt, *Ws, nh)
dk = dm // nh
expect = []
for hd in range(nh):
    c = slice(hd * dk, (hd + 1) * dk)
    S = (Xt @ Ws[0][:, c]) @ (Xt @ Ws[1][:, c]).T / np.sqrt(dk)
    S = np.where(np.triu(np.ones((Tt, Tt)), 1) == 1, -1e9, S)
    A = np.exp(S - S.max(axis=1, keepdims=True)); A /= A.sum(axis=1, keepdims=True)
    expect.append(A @ (Xt @ Ws[2][:, c]))
assert np.shape(w_t) == (nh, Tt, Tt), f"가중치 shape {np.shape(w_t)}"
assert np.allclose(w_t.sum(-1), 1) and np.allclose(np.triu(w_t[0], 1), 0), "가중치 행 합이 1이 아니거나 미래 토큰에 가중치가 있습니다."
assert np.allclose(out_t, np.concatenate(expect, axis=1) @ Ws[3]), "출력이 독립 구현과 다릅니다."
`,
        hint: "점수는 `Qh @ Kh.transpose(0, 2, 1)`이고, `scale=True`일 때만 `np.sqrt(d_k)`로 나눕니다.",
      },
      {
        id: "w5-at-scale",
        taskId: "mha",
        title: "scale=False면 √d_k로 나누지 않는다",
        code: py`
import numpy as np
rng_t = np.random.default_rng(12)
Xt = rng_t.normal(size=(4, 8))
Ws = [rng_t.normal(size=(8, 8)) for _ in range(4)]
_, w_n = multi_head_attention(Xt, *Ws, 1, causal=False, scale=False)
S = (Xt @ Ws[0]) @ (Xt @ Ws[1]).T
A = np.exp(S - S.max(axis=1, keepdims=True)); A /= A.sum(axis=1, keepdims=True)
assert np.allclose(w_n[0], A), "scale=False일 때의 가중치가 softmax(QKᵀ)와 다릅니다."
`,
      },
      {
        id: "w5-at-reference",
        taskId: "verify",
        title: "반복문 참조 구현이 벡터화 구현과 일치한다(새 입력에서도)",
        code: py`
import numpy as np
rng_t = np.random.default_rng(13)
Xt = rng_t.normal(size=(6, 12))
Ws = [rng_t.normal(scale=12 ** -0.5, size=(12, 12)) for _ in range(4)]
assert np.allclose(reference_attention(Xt, *Ws, 3), multi_head_attention(Xt, *Ws, 3)[0]), "참조 구현과 결과가 다릅니다."
`,
      },
      {
        id: "w5-at-queries",
        taskId: "example",
        title: "본문 예제 재현 + Query를 하나 이상 더 추가했다",
        code: py`
import numpy as np
w, o = attend([1, 1, 0, 1])
assert np.allclose(w, [0.1878, 0.5105, 0.1139, 0.1878], atol=1e-3) and np.allclose(o, [1.2407, 1.6454], atol=1e-3), f"가중치 {np.round(w, 4)}, 출력 {np.round(o, 3)}"
assert len(queries) >= 3, f"Query가 {len(queries)}개입니다. 직접 고른 Query를 하나 이상 추가하십시오."
`,
      },
    ],
    challenges: [
      {
        id: "w5-ch-decoder-block",
        title: "GPT형 디코더 블록 전체 순전파",
        tier: "advanced",
        prompt: `
지금까지 만든 부품으로 **pre-norm GPT 디코더 블록**을 조립합니다.

$$h = x + \\mathrm{MHA}(\\mathrm{LN}(x)),\\qquad y = h + \\mathrm{MLP}(\\mathrm{LN}(h)),\\quad \\mathrm{MLP}(u) = \\mathrm{ReLU}(uW_1 + b_1)W_2 + b_2$$

- \`layer_norm(x)\`: 토큰마다(마지막 축) 정규화(\`eps=1e-5\`, gamma·beta 생략)
- \`mha(x, Wq, Wk, Wv, Wo, h)\`: causal 멀티헤드 attention
- \`decoder_block(x, P)\`: \`P\`는 \`Wq, Wk, Wv, Wo, W1, b1, W2, b2, n_heads\` 키를 가진 딕셔너리
- \`n_params(d)\`: $d_{model} = d$, MLP 은닉 $4d$일 때 블록의 가중치 수(편향·LayerNorm 제외)

출력 shape이 입력과 같고, 마지막 토큰을 바꿔도 앞 토큰 출력이 그대로여야 합니다.
`,
        starter: py`
import numpy as np

def layer_norm(x, eps=1e-5):
    return x  # TODO

def mha(x, Wq, Wk, Wv, Wo, h):
    T, d = x.shape
    dk = d // h
    split = lambda M: M.reshape(T, h, dk).transpose(1, 0, 2)
    Qh, Kh, Vh = split(x @ Wq), split(x @ Wk), split(x @ Wv)
    S = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(dk)
    S = np.where(np.triu(np.ones((T, T)), 1) == 1, -1e9, S)
    A = np.exp(S - S.max(-1, keepdims=True)); A /= A.sum(-1, keepdims=True)
    return (A @ Vh).transpose(1, 0, 2).reshape(T, d) @ Wo

def decoder_block(x, P):
    return x  # TODO: 잔차 연결 두 번 (pre-norm)

def n_params(d):
    return 0  # TODO: attention 4d² + MLP 2·d·4d

rng = np.random.default_rng(0)
d, T = 16, 6
P = {k: rng.normal(scale=d ** -0.5, size=(d, d)) for k in ("Wq", "Wk", "Wv", "Wo")}
P.update(W1=rng.normal(scale=d ** -0.5, size=(d, 4 * d)), b1=np.zeros(4 * d), W2=rng.normal(scale=(4 * d) ** -0.5, size=(4 * d, d)), b2=np.zeros(d), n_heads=4)
x = rng.normal(size=(T, d))
print(decoder_block(x, P).shape, n_params(768))
`,
        tests: py`
import numpy as np
rng = np.random.default_rng(7)
d, T = 16, 6
P = {k: rng.normal(scale=d ** -0.5, size=(d, d)) for k in ("Wq", "Wk", "Wv", "Wo")}
P.update(W1=rng.normal(scale=d ** -0.5, size=(d, 4 * d)), b1=rng.normal(size=4 * d) * 0.1, W2=rng.normal(scale=(4 * d) ** -0.5, size=(4 * d, d)), b2=rng.normal(size=d) * 0.1, n_heads=4)
x = rng.normal(size=(T, d))

@test("layer_norm: 토큰마다 평균 0, 표준편차 1")
def _():
    z = layer_norm(rng.normal(3, 2, size=(4, 10)))
    assert approx(z.mean(-1), np.zeros(4)) and approx(z.std(-1), np.ones(4), 1e-3)

@test("블록 출력 = pre-norm 잔차 두 번")
def _():
    def ln(a):
        return (a - a.mean(-1, keepdims=True)) / np.sqrt(a.var(-1, keepdims=True) + 1e-5)
    h = x + mha(ln(x), P["Wq"], P["Wk"], P["Wv"], P["Wo"], 4)
    y = h + np.maximum(0, ln(h) @ P["W1"] + P["b1"]) @ P["W2"] + P["b2"]
    assert approx(decoder_block(x, P), y)

@test("causal: 마지막 토큰을 바꿔도 앞 토큰 출력은 그대로")
def _():
    x2 = x.copy(); x2[-1] = rng.normal(size=d)
    a, b = decoder_block(x, P), decoder_block(x2, P)
    assert a.shape == (T, d) and approx(a[:-1], b[:-1]) and not approx(a[-1], b[-1])

@test("GPT-2 small(d=768) 블록 가중치 ≈ 708만 개, MLP가 2/3")
def _():
    assert n_params(768) == 4 * 768 ** 2 + 8 * 768 ** 2, f"결과: {n_params(768)}"
`,
        hints: [
          "`(x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + eps)`",
          "`h = x + mha(layer_norm(x), P[\"Wq\"], P[\"Wk\"], P[\"Wv\"], P[\"Wo\"], P[\"n_heads\"])` 다음 `h + MLP(layer_norm(h))`",
          "attention 가중치 4개는 각각 $d \\times d$, MLP는 $d \\times 4d$와 $4d \\times d$이므로 합 $12d^2$입니다.",
        ],
        solution: py`
import numpy as np

def layer_norm(x, eps=1e-5):
    return (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + eps)

def mha(x, Wq, Wk, Wv, Wo, h):
    T, d = x.shape
    dk = d // h
    split = lambda M: M.reshape(T, h, dk).transpose(1, 0, 2)
    Qh, Kh, Vh = split(x @ Wq), split(x @ Wk), split(x @ Wv)
    S = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(dk)
    S = np.where(np.triu(np.ones((T, T)), 1) == 1, -1e9, S)
    A = np.exp(S - S.max(-1, keepdims=True)); A /= A.sum(-1, keepdims=True)
    return (A @ Vh).transpose(1, 0, 2).reshape(T, d) @ Wo

def decoder_block(x, P):
    h = x + mha(layer_norm(x), P["Wq"], P["Wk"], P["Wv"], P["Wo"], P["n_heads"])
    return h + np.maximum(0, layer_norm(h) @ P["W1"] + P["b1"]) @ P["W2"] + P["b2"]

def n_params(d):
    return 4 * d * d + 2 * d * 4 * d

rng = np.random.default_rng(0)
d, T = 16, 6
P = {k: rng.normal(scale=d ** -0.5, size=(d, d)) for k in ("Wq", "Wk", "Wv", "Wo")}
P.update(W1=rng.normal(scale=d ** -0.5, size=(d, 4 * d)), b1=np.zeros(4 * d), W2=rng.normal(scale=(4 * d) ** -0.5, size=(4 * d, d)), b2=np.zeros(d), n_heads=4)
x = rng.normal(size=(T, d))
print(decoder_block(x, P).shape, n_params(768))
`,
      },
      {
        id: "w5-ch-byte-bpe",
        title: "바이트 수준 BPE로 한국어 토큰 수 줄이기",
        tier: "advanced",
        prompt: `
GPT 계열 토크나이저는 글자가 아니라 **UTF-8 바이트**에서 출발합니다. 한글 한 글자는 3바이트라 병합이 없으면 토큰이 많아집니다.

1. \`train_byte_bpe(text, n_merges)\`: 텍스트를 UTF-8 바이트 정수 리스트로 바꾼 뒤, 가장 잦은 인접 쌍을 새 토큰 번호(256, 257, …)로 병합하는 규칙을 학습합니다. \`{(a, b): 새 번호}\` 딕셔너리(학습 순서 유지)를 돌려줍니다.
2. \`encode(text, merges)\`: 학습 순서대로 규칙을 적용한 토큰 번호 리스트
3. \`decode(tokens, merges)\`: 새 번호를 원래 두 토큰으로 되풀어 바이트로 만든 뒤 UTF-8로 복원합니다. **손실 없이** 원문이 돌아와야 합니다.
`,
        starter: py`
from collections import Counter

def merge(ids, pair, new_id):
    out, i = [], 0
    while i < len(ids):
        if i < len(ids) - 1 and (ids[i], ids[i + 1]) == pair:
            out.append(new_id); i += 2
        else:
            out.append(ids[i]); i += 1
    return out

def train_byte_bpe(text, n_merges):
    ids = list(text.encode("utf-8"))
    merges = {}
    for k in range(n_merges):
        pass  # TODO: 최빈 쌍을 256 + k 번으로 병합하고 merges에 기록합니다.
    return merges

def encode(text, merges):
    ids = list(text.encode("utf-8"))
    # TODO: merges.items()를 학습 순서대로 적용
    return ids

def decode(tokens, merges):
    vocab = {i: bytes([i]) for i in range(256)}
    # TODO: 각 새 번호의 바이트열 = 두 구성 토큰의 바이트열을 이어 붙인 것
    return b"".join(vocab[t] for t in tokens).decode("utf-8", errors="replace")

text = "학습 자료를 읽고 학습 목표를 확인한 뒤 학습을 시작합니다. 학습은 반복이 중요합니다."
merges = train_byte_bpe(text, 30)
ids = encode(text, merges)
print(f"글자 {len(text)}개, 바이트 {len(text.encode('utf-8'))}개 → 토큰 {len(ids)}개")
print(decode(ids, merges) == text)
`,
        tests: py`
text = "학습 자료를 읽고 학습 목표를 확인한 뒤 학습을 시작합니다. 학습은 반복이 중요합니다."

@test("병합 규칙 수와 새 번호(256부터 연속)")
def _():
    m = train_byte_bpe(text, 10)
    assert len(m) == 10 and sorted(m.values()) == list(range(256, 266)), f"번호: {sorted(m.values())}"

@test("병합 0개면 토큰 = UTF-8 바이트 (한글 1글자 = 3바이트)")
def _():
    assert encode("학습", {}) == list("학습".encode("utf-8")) and len(encode("학습", {})) == 6

@test("병합을 많이 할수록 토큰 수가 줄어든다")
def _():
    n = [len(encode(text, train_byte_bpe(text, k))) for k in (0, 10, 40)]
    assert n[0] > n[1] > n[2], f"토큰 수: {n}"

@test("decode(encode(x)) == x (학습에 없던 문장 포함)")
def _():
    m = train_byte_bpe(text, 40)
    for s in (text, "새로운 문장도 학습합니다!", "hello 학습 123"):
        assert decode(encode(s, m), m) == s, f"복원 실패: {decode(encode(s, m), m)}"
`,
        hints: [
          "`pairs = Counter(zip(ids, ids[1:]))`, 비어 있으면 멈추고, `best = pairs.most_common(1)[0][0]`, `ids = merge(ids, best, 256 + k)`, `merges[best] = 256 + k`",
          "`encode`: `for pair, new_id in merges.items(): ids = merge(ids, pair, new_id)` (딕셔너리는 삽입 순서를 유지합니다)",
          "`decode`: `for (a, b), new_id in merges.items(): vocab[new_id] = vocab[a] + vocab[b]`. 앞에서 만든 번호가 뒤 규칙의 구성 요소가 될 수 있으므로 학습 순서대로 채웁니다.",
        ],
        solution: py`
from collections import Counter

def merge(ids, pair, new_id):
    out, i = [], 0
    while i < len(ids):
        if i < len(ids) - 1 and (ids[i], ids[i + 1]) == pair:
            out.append(new_id); i += 2
        else:
            out.append(ids[i]); i += 1
    return out

def train_byte_bpe(text, n_merges):
    ids = list(text.encode("utf-8"))
    merges = {}
    for k in range(n_merges):
        pairs = Counter(zip(ids, ids[1:]))
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]
        ids = merge(ids, best, 256 + k)
        merges[best] = 256 + k
    return merges

def encode(text, merges):
    ids = list(text.encode("utf-8"))
    for pair, new_id in merges.items():
        ids = merge(ids, pair, new_id)
    return ids

def decode(tokens, merges):
    vocab = {i: bytes([i]) for i in range(256)}
    for (a, b), new_id in merges.items():
        vocab[new_id] = vocab[a] + vocab[b]
    return b"".join(vocab[t] for t in tokens).decode("utf-8", errors="replace")

text = "학습 자료를 읽고 학습 목표를 확인한 뒤 학습을 시작합니다. 학습은 반복이 중요합니다."
merges = train_byte_bpe(text, 30)
ids = encode(text, merges)
print(f"글자 {len(text)}개, 바이트 {len(text.encode('utf-8'))}개 → 토큰 {len(ids)}개")
print(decode(ids, merges) == text)
`,
      },
    ],
  },
};

export default week5;
