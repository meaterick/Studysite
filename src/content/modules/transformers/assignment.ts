import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "mini-gpt-block",
  kind: "module",
  title: "나만의 미니 GPT 블록",
  summary: md`
GPT 블록의 핵심인 멀티헤드 causal self-attention을 NumPy로 직접 구현하고, 세 가지 독립적인 방법으로 정확성을 검증합니다. [[lesson:self-attention]]의 숫자 예제를 코드로 재현하고 Query를 바꿔 비교하며, 마스크와 $\sqrt{d_k}$ 스케일링이 attention 가중치에 어떤 영향을 주는지 히트맵으로 관찰합니다. 마지막으로 "Attention Is All You Need" 논문을 읽고 리포트를 작성합니다.

**핵심** 항목은 모두 핵심 레슨만으로 풀 수 있고 채점 기준도 핵심 항목만 봅니다. **심화** 항목은 선택이며 점수 대신 피드백을 받습니다.
`,
  requirements: [
    "`multi_head_attention`의 점수 계산 TODO를 채우고, 모든 중간 텐서 옆에 shape 주석을 적는다($W^O$ 출력 투영 포함).",
    "검증 (a) 헤드별 계산과 비교, (b) causal 테스트, (c) 반복문 참조 구현과 비교가 모두 `True`가 된다.",
    "본문 숫자 예제(가중치 18.8% · 51.0% · 11.4% · 18.8%, 출력 $[1.24, 1.65]$)를 재현하고, Query를 두 가지 이상 바꿔 표로 비교한다.",
    "마스크·스케일링 네 조합의 히트맵과 $d_k$별 최대 가중치를 근거로 관찰을 세 문장 이상 쓴다.",
    "\"Attention Is All You Need\" 리포트를 출처와 함께 작성한다.",
  ],
  tasks: [
    {
      id: "mha",
      title: "멀티헤드 causal self-attention 구현",
      tier: "core",
      instructions: md`
코드 셀의 \`multi_head_attention\`을 완성합니다. \`TODO\`로 표시한 attention 점수 계산을 채우고, \`# shape: ?\`로 표시한 모든 중간 텐서 옆에 shape을 적습니다(예: \`# shape: (n_heads, T, d_k)\`). $W^O$ 출력 투영까지 포함해야 합니다.

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^\top}{\sqrt{d_k}} + M\right)V$$

여기서 $M$은 미래 위치를 $-\infty$로 막는 causal 마스크입니다.
`,
      cells: [
        { kind: "code", id: "mha-code", label: "multi_head_attention 구현", starter: py`
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def causal_mask(T):
    # True인 자리(자기보다 뒤의 토큰)를 가립니다.
    return np.triu(np.ones((T, T), dtype=bool), k=1)

def multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads, causal=True, scale=True):
    T, d_model = X.shape                        # X: (T, d_model)
    d_k = d_model // n_heads
    Q, K, V = X @ Wq, X @ Wk, X @ Wv            # shape: ?
    Qh = Q.reshape(T, n_heads, d_k).transpose(1, 0, 2)   # shape: ?
    Kh = K.reshape(T, n_heads, d_k).transpose(1, 0, 2)   # shape: ?
    Vh = V.reshape(T, n_heads, d_k).transpose(1, 0, 2)   # shape: ?
    scores = np.zeros((n_heads, T, T))          # TODO: Qh와 Kh로 점수를 계산하고, scale=True면 √d_k로 나눕니다. shape: ?
    if causal:
        scores = np.where(causal_mask(T), -1e9, scores)
    weights = softmax(scores, axis=-1)          # shape: ?
    heads = weights @ Vh                        # shape: ?
    concat = heads.transpose(1, 0, 2).reshape(T, d_model)  # shape: ?
    out = concat @ Wo                           # shape: ?
    return out, weights

rng = np.random.default_rng(0)
T, d_model, n_heads = 6, 16, 4
X = rng.normal(size=(T, d_model))
Wq, Wk, Wv, Wo = (rng.normal(scale=d_model ** -0.5, size=(d_model, d_model)) for _ in range(4))
out, weights = multi_head_attention(X, Wq, Wk, Wv, Wo, n_heads)
print("출력:", out.shape, "가중치:", weights.shape)
print("각 행의 가중치 합(모두 1이어야 함):", np.round(weights.sum(-1)[0], 6))
` },
      ],
    },
    {
      id: "verify",
      title: "정확성 검증 세 가지",
      tier: "core",
      instructions: md`
구현이 맞는지 서로 다른 세 방법으로 확인합니다. 세 검증 모두 \`True\`가 나와야 합니다.

- (a) **헤드별 계산과 비교**: 헤드마다 $W^Q, W^K, W^V$의 해당 열만 잘라 단일 헤드 attention을 따로 계산해 이어 붙인 결과가 구현과 \`np.allclose\`로 일치하는지 확인합니다.
- (b) **causal 테스트**: 마지막 토큰을 바꿔도 앞 토큰들의 출력이 변하지 않아야 합니다.
- (c) **참조 구현과 비교**: 행렬곱 없이 반복문으로 한 원소씩 계산하는 참조 구현을 완성하고, 같은 가중치를 넣었을 때 결과가 일치하는지 확인합니다.
`,
      cells: [
        { kind: "code", id: "verify-code", label: "검증 (a)·(b)·(c)", starter: py`
# (a) 헤드별로 따로 계산해 이어 붙이기
d_k = d_model // n_heads
per_head = []
for h in range(n_heads):
    cols = slice(h * d_k, (h + 1) * d_k)
    q, k, v = X @ Wq[:, cols], X @ Wk[:, cols], X @ Wv[:, cols]
    s = q @ k.T / np.sqrt(d_k)
    s = np.where(causal_mask(T), -1e9, s)
    per_head.append(softmax(s) @ v)
out_a = np.concatenate(per_head, axis=1) @ Wo
print("(a) 헤드별 계산과 일치:", np.allclose(out, out_a))

# (b) 마지막 토큰을 바꿔도 앞 토큰의 출력은 그대로여야 합니다
X2 = X.copy()
X2[-1] = rng.normal(size=d_model)
out2, _ = multi_head_attention(X2, Wq, Wk, Wv, Wo, n_heads)
print("(b) 앞 토큰 출력 불변:", np.allclose(out[:-1], out2[:-1]), "/ 마지막 토큰은 달라짐:", not np.allclose(out[-1], out2[-1]))

# (c) 반복문 참조 구현
def reference_attention(X, Wq, Wk, Wv, Wo, n_heads):
    T, d_model = X.shape
    d_k = d_model // n_heads
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    concat = np.zeros((T, d_model))
    for h in range(n_heads):
        c0 = h * d_k
        for i in range(T):
            # TODO: 토큰 i가 볼 수 있는 j = 0..i 에 대해 점수 Q[i]·K[j] / √d_k 를 구하고,
            #       softmax 가중치로 V[j]를 섞어 concat[i, c0:c0 + d_k]에 채웁니다.
            pass
    return concat @ Wo

out_c = reference_attention(X, Wq, Wk, Wv, Wo, n_heads)
print("(c) 반복문 참조 구현과 일치:", np.allclose(out, out_c))
` },
        { kind: "text", id: "verify-answer", prompt: "세 검증이 각각 무엇을 보장하는지, 셋 중 하나만으로는 부족한 이유와 함께 설명해 주십시오.", minChars: 120 },
      ],
    },
    {
      id: "example",
      title: "숫자 예제 재현과 변형",
      tier: "core",
      instructions: md`
[[lesson:self-attention]]의 예제("고양이가 생선을 맛있게 먹었다", Query $=[1,1,0,1]$, $d_k=4$)를 코드로 재현해 가중치 18.8% · 51.0% · 11.4% · 18.8%와 출력 $[1.24, 1.65]$가 나오는지 확인합니다. 그다음 Query를 두 가지 이상 다른 값(예: "맛있게"의 Key와 같은 $[0,0,1,0]$)으로 바꿔 가중치와 출력이 어떻게 달라지는지 표로 정리하고 이유를 설명합니다.
`,
      cells: [
        { kind: "code", id: "example-code", label: "숫자 예제", starter: py`
tokens = ["고양이가", "생선을", "맛있게", "먹었다"]
K_ex = np.array([[1, 0, 0, 0], [1, 1, 1, 1], [0, 0, 1, 0], [1, 1, 0, -1]], dtype=float)
V_ex = np.array([[2, 0], [0, 3], [1, 1], [4, 0]], dtype=float)

def attend(query):
    q = np.array(query, dtype=float)
    w = softmax(K_ex @ q / np.sqrt(len(q)))
    return w, w @ V_ex

queries = {
    "생선을 (본문 예제)": [1, 1, 0, 1],
    "맛있게의 Key와 같은 Query": [0, 0, 1, 0],
    # TODO: 직접 고른 Query를 하나 이상 추가합니다.
}
for name, q in queries.items():
    w, o = attend(q)
    print(f"{name}: q={q}")
    print("   가중치:", ", ".join(f"{t} {p:.1%}" for t, p in zip(tokens, w)), "| 출력:", np.round(o, 2))
` },
        { kind: "text", id: "example-answer", prompt: "Query별 가중치와 출력을 표로 정리하고, 달라진 이유를 내적의 관점에서 설명해 주십시오.", minChars: 250, template: md`
| Query | 고양이가 | 생선을 | 맛있게 | 먹었다 | 출력 |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

설명:
` },
      ],
    },
    {
      id: "observe",
      title: "마스크와 스케일링 관찰 실험",
      tier: "core",
      instructions: md`
토큰 8개 입력으로 attention 가중치를 (i) 마스크 유무와 (ii) $\sqrt{d_k}$ 스케일링 유무의 네 조합으로 그립니다. 두 번째 셀에서는 $d_k$를 키울 때 스케일링 유무에 따른 최대 가중치 차이가 어떻게 커지는지 확인합니다. 관찰 결과를 세 문장 이상으로 적습니다.
`,
      cells: [
        { kind: "code", id: "observe-heatmap", label: "네 조합의 가중치 히트맵", starter: py`
import matplotlib.pyplot as plt

T8, d8 = 8, 32
X8 = rng.normal(size=(T8, d8))
W8 = [rng.normal(scale=d8 ** -0.5, size=(d8, d8)) for _ in range(4)]
fig, axes = plt.subplots(1, 4, figsize=(14, 3.4))
for ax, (causal, scale) in zip(axes, [(False, True), (True, True), (False, False), (True, False)]):
    _, w = multi_head_attention(X8, *W8, n_heads=1, causal=causal, scale=scale)
    ax.imshow(w[0], cmap="viridis", vmin=0, vmax=1)
    ax.set_title(f"mask={causal}, scale={scale}", fontsize=9)
    ax.set_xlabel("key"); ax.set_ylabel("query")
plt.tight_layout()
plt.show()
` },
        { kind: "code", id: "observe-dk", label: "d_k에 따른 쏠림 비교", starter: py`
print(f"{'d_k':>6}{'스케일링 O 최대 가중치':>22}{'스케일링 X 최대 가중치':>22}")
for d in (4, 16, 64, 256):
    Xd = rng.normal(size=(8, d))
    Wd = [rng.normal(scale=d ** -0.5, size=(d, d)) for _ in range(4)]
    _, w_s = multi_head_attention(Xd, *Wd, n_heads=1, causal=False, scale=True)
    _, w_n = multi_head_attention(Xd, *Wd, n_heads=1, causal=False, scale=False)
    print(f"{d:>6}{w_s.max(-1).mean():>22.3f}{w_n.max(-1).mean():>22.3f}")
` },
        { kind: "text", id: "observe-answer", prompt: "마스크와 스케일링이 가중치 분포에 주는 영향을 세 문장 이상으로 설명해 주십시오. d_k가 커질 때의 변화도 포함합니다.", minChars: 150 },
      ],
    },
    {
      id: "paper",
      title: "논문 리포트",
      tier: "core",
      instructions: md`
"Attention Is All You Need"(Vaswani et al., 2017, [arXiv:1706.03762](https://arxiv.org/abs/1706.03762))의 3장을 중심으로 읽고 다음을 작성합니다.

- (a) 가장 인상 깊었던 설계 선택과 그 이유
- (b) 2017년 이후 바뀐 부분 두 가지 이상(RoPE, Pre-LN, GQA, SwiGLU 등에서 선택)을 조사해 무엇이, 왜 바뀌었는지 정리
`,
      cells: [
        { kind: "text", id: "paper-answer", prompt: "논문 리포트를 작성해 주십시오. 참고한 자료의 출처를 함께 적습니다.", minChars: 500, template: md`
### (a) 인상 깊었던 설계 선택


### (b) 2017년 이후 바뀐 부분


### 참고 자료
-
` },
      ],
    },
    {
      id: "advanced",
      title: "심화: 문자 단위 언어모델·KV 캐시·효율적 attention",
      tier: "advanced",
      instructions: md`
다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않습니다.

- 구현한 블록을 이용해 짧은 문장으로 문자 단위 다음 글자 예측 모델의 순전파를 구성하고, 무작위 가중치에서의 손실이 $\ln(\text{어휘 수})$ 근처인지 확인합니다.
- BPE를 50줄 안팎으로 직접 구현해 한국어와 영어 문장의 토큰 수를 비교합니다.
- KV 캐시를 쓰는 생성 루프를 구현하고, 캐시 유무에 따른 계산량(행렬곱 횟수 또는 실행 시간)을 토큰 수별로 비교합니다.
- 구현한 \`multi_head_attention\`의 softmax 부분을 온라인 softmax(블록 단위)로 바꿔 결과가 같은지 확인하고, 점수 행렬 없이 계산할 때의 최대 메모리를 비교합니다([[lesson:efficient-attention]]).
- 같은 블록을 인과적 선형 attention으로 바꿔 행렬 계산과 RNN식 순환 계산이 같은지 확인하고, softmax 버전과 출력이 얼마나 다른지 비교합니다([[lesson:linear-attention]]).
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: py`
# 선택한 심화 실험을 이 셀에서 진행합니다.
` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "correct", label: "구현 정확성", points: 3, guide: "검증 세 가지(헤드별 계산, causal 테스트, 참조 구현)를 모두 통과했습니다." },
    { id: "shape", label: "shape 추적과 설명", points: 2, guide: "모든 중간 텐서의 shape을 정확히 적고, 각 검증의 의미를 설명했습니다." },
    { id: "example", label: "숫자 예제 재현과 변형", points: 2, guide: "본문 결과를 재현하고, Query 변형에 따른 변화를 내적으로 설명했습니다." },
    { id: "observe", label: "관찰 실험", points: 1, guide: "마스크·스케일링의 효과와 d_k에 따른 쏠림을 수치와 그림으로 설명했습니다." },
    { id: "paper", label: "논문 리포트", points: 2, guide: "설계 선택의 이유와 이후 변화를 출처와 함께 정확히 정리했습니다." },
  ],
  gradingNotes: md`
- **멀티헤드 causal self-attention 구현**: shape 흐름은 $(T, D) \to (h, T, d_k) \to (h, T, T) \to (h, T, d_k) \to (T, D)$다.
- **정확성 검증 세 가지**: 세 검증이 모두 True여야 한다. (b)는 점수 계산이 비어 있어도 통과할 수 있으므로 (a)·(c)와 함께 봐야 한다는 점을 짚으면 우수 답안이다.
- **숫자 예제 재현과 변형**: Query를 $[0,0,1,0]$으로 바꾸면 "생선을"과 "맛있게"의 가중치가 각각 31.1%로 같아진다. 두 Key와 Query의 내적이 같기 때문이다.
- **마스크와 스케일링 관찰 실험**: 스케일링을 빼면 $d_k$가 커질수록 최대 가중치가 1에 가까워지는(원-핫에 가까워지는) 현상이 관찰되어야 한다.
- **논문 리포트**: 출처가 분명하고 RoPE·Pre-LN 등 이후 변화의 이유(길이 일반화, 학습 안정성 등)를 설명하면 충분하다.
`,
  maxScore: 10,
  autoTests: [
    { id: "w5-at-mha", taskId: "mha", title: "multi_head_attention이 독립 구현과 일치하고 가중치가 올바르다", hint: "점수는 `Qh @ Kh.transpose(0, 2, 1)`이고, `scale=True`일 때만 `np.sqrt(d_k)`로 나눕니다.", code: py`
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
` },
    { id: "w5-at-scale", taskId: "mha", title: "scale=False면 √d_k로 나누지 않는다", code: py`
import numpy as np
rng_t = np.random.default_rng(12)
Xt = rng_t.normal(size=(4, 8))
Ws = [rng_t.normal(size=(8, 8)) for _ in range(4)]
_, w_n = multi_head_attention(Xt, *Ws, 1, causal=False, scale=False)
S = (Xt @ Ws[0]) @ (Xt @ Ws[1]).T
A = np.exp(S - S.max(axis=1, keepdims=True)); A /= A.sum(axis=1, keepdims=True)
assert np.allclose(w_n[0], A), "scale=False일 때의 가중치가 softmax(QKᵀ)와 다릅니다."
` },
    { id: "w5-at-reference", taskId: "verify", title: "반복문 참조 구현이 벡터화 구현과 일치한다(새 입력에서도)", code: py`
import numpy as np
rng_t = np.random.default_rng(13)
Xt = rng_t.normal(size=(6, 12))
Ws = [rng_t.normal(scale=12 ** -0.5, size=(12, 12)) for _ in range(4)]
assert np.allclose(reference_attention(Xt, *Ws, 3), multi_head_attention(Xt, *Ws, 3)[0]), "참조 구현과 결과가 다릅니다."
` },
    { id: "w5-at-queries", taskId: "example", title: "본문 예제 재현 + Query를 하나 이상 더 추가했다", code: py`
import numpy as np
w, o = attend([1, 1, 0, 1])
assert np.allclose(w, [0.1878, 0.5105, 0.1139, 0.1878], atol=1e-3) and np.allclose(o, [1.2407, 1.6454], atol=1e-3), f"가중치 {np.round(w, 4)}, 출력 {np.round(o, 3)}"
assert len(queries) >= 3, f"Query가 {len(queries)}개입니다. 직접 고른 Query를 하나 이상 추가하십시오."
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "GPT형 디코더 블록 전체 순전파",
      prompt: md`
지금까지 만든 부품으로 **pre-norm GPT 디코더 블록**을 조립합니다.

$$h = x + \mathrm{MHA}(\mathrm{LN}(x)),\qquad y = h + \mathrm{MLP}(\mathrm{LN}(h)),\quad \mathrm{MLP}(u) = \mathrm{ReLU}(uW_1 + b_1)W_2 + b_2$$

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
      hints: ["`(x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + eps)`", "`h = x + mha(layer_norm(x), P[\"Wq\"], P[\"Wk\"], P[\"Wv\"], P[\"Wo\"], P[\"n_heads\"])` 다음 `h + MLP(layer_norm(h))`", "attention 가중치 4개는 각각 $d \\times d$, MLP는 $d \\times 4d$와 $4d \\times d$이므로 합 $12d^2$입니다."],
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
      key: "ch2",
      title: "바이트 수준 BPE로 한국어 토큰 수 줄이기",
      prompt: md`
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
      hints: ["`pairs = Counter(zip(ids, ids[1:]))`, 비어 있으면 멈추고, `best = pairs.most_common(1)[0][0]`, `ids = merge(ids, best, 256 + k)`, `merges[best] = 256 + k`", "`encode`: `for pair, new_id in merges.items(): ids = merge(ids, pair, new_id)` (딕셔너리는 삽입 순서를 유지합니다)", "`decode`: `for (a, b), new_id in merges.items(): vocab[new_id] = vocab[a] + vocab[b]`. 앞에서 만든 번호가 뒤 규칙의 구성 요소가 될 수 있으므로 학습 순서대로 채웁니다."],
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
});
