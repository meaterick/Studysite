import type { AssignmentSpec } from "../types";

// 5주차 과제: 멀티헤드 causal self-attention을 NumPy로 구현하고 세 가지 방법으로 검증한다.
// 원래 PyTorch와 비교하던 3번째 검증은, 반복문으로 한 원소씩 계산하는 참조 구현과의 비교로 바꿨다.
const week5Assignment: AssignmentSpec = {
  title: "나만의 미니 GPT 블록",
  summary: `
GPT 블록의 핵심인 멀티헤드 causal self-attention을 NumPy로 직접 구현하고, 세 가지 독립적인 방법으로 정확성을 검증합니다. 「Self-Attention」 단계의 숫자 예제를 코드로 재현해 변형해 보고, 마스크와 $\\sqrt{d_k}$ 스케일링이 attention 가중치에 어떤 영향을 주는지 히트맵으로 관찰합니다. 마지막으로 "Attention Is All You Need" 논문을 읽고 리포트를 작성합니다.
`,
  tasks: [
    {
      id: "mha",
      tier: "core",
      title: "멀티헤드 causal self-attention 구현",
      instructions: `
코드 셀의 \`multi_head_attention\`을 완성합니다. \`TODO\`로 표시한 attention 점수 계산을 채우고, \`# shape: ?\`로 표시한 모든 중간 텐서 옆에 shape을 적습니다(예: \`# shape: (n_heads, T, d_k)\`). $W^O$ 출력 투영까지 포함해야 합니다.

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}} + M\\right)V$$

여기서 $M$은 미래 위치를 $-\\infty$로 막는 causal 마스크입니다.
`,
      cells: [
        {
          kind: "code",
          id: "mha-code",
          label: "multi_head_attention 구현",
          starter: `import numpy as np

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
`,
        },
      ],
    },
    {
      id: "verify",
      tier: "core",
      title: "정확성 검증 세 가지",
      instructions: `
구현이 맞는지 서로 다른 세 방법으로 확인합니다. 세 검증 모두 \`True\`가 나와야 합니다.

- (a) **헤드별 계산과 비교**: 헤드마다 $W^Q, W^K, W^V$의 해당 열만 잘라 단일 헤드 attention을 따로 계산해 이어 붙인 결과가 구현과 \`np.allclose\`로 일치하는지 확인합니다.
- (b) **causal 테스트**: 마지막 토큰을 바꿔도 앞 토큰들의 출력이 변하지 않아야 합니다.
- (c) **참조 구현과 비교**: 행렬곱 없이 반복문으로 한 원소씩 계산하는 참조 구현을 완성하고, 같은 가중치를 넣었을 때 결과가 일치하는지 확인합니다.
`,
      cells: [
        {
          kind: "code",
          id: "verify-code",
          label: "검증 (a)·(b)·(c)",
          starter: `# (a) 헤드별로 따로 계산해 이어 붙이기
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
`,
        },
        {
          kind: "text",
          id: "verify-answer",
          prompt: "세 검증이 각각 무엇을 보장하는지, 셋 중 하나만으로는 부족한 이유와 함께 설명해 주십시오.",
          minChars: 120,
        },
      ],
    },
    {
      id: "example",
      tier: "core",
      title: "숫자 예제 재현과 변형",
      instructions: `
「Self-Attention」 단계의 예제("고양이가 생선을 맛있게 먹었다", Query $=[1,1,0,1]$, $d_k=4$)를 코드로 재현해 가중치 18.8% · 51.0% · 11.4% · 18.8%와 출력 $[1.24, 1.65]$가 나오는지 확인합니다. 그다음 Query를 두 가지 이상 다른 값(예: "맛있게"의 Key와 같은 $[0,0,1,0]$)으로 바꿔 가중치와 출력이 어떻게 달라지는지 표로 정리하고 이유를 설명합니다.
`,
      cells: [
        {
          kind: "code",
          id: "example-code",
          label: "숫자 예제",
          starter: `tokens = ["고양이가", "생선을", "맛있게", "먹었다"]
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
`,
        },
        {
          kind: "text",
          id: "example-answer",
          prompt: "Query별 가중치와 출력을 표로 정리하고, 달라진 이유를 내적의 관점에서 설명해 주십시오.",
          template: `| Query | 고양이가 | 생선을 | 맛있게 | 먹었다 | 출력 |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

설명: `,
          minChars: 250,
        },
      ],
    },
    {
      id: "observe",
      tier: "core",
      title: "마스크와 스케일링 관찰 실험",
      instructions: `
토큰 8개 입력으로 attention 가중치를 (i) 마스크 유무와 (ii) $\\sqrt{d_k}$ 스케일링 유무의 네 조합으로 그립니다. 두 번째 셀에서는 $d_k$를 키울 때 스케일링 유무에 따른 최대 가중치 차이가 어떻게 커지는지 확인합니다. 관찰 결과를 세 문장 이상으로 적습니다.
`,
      cells: [
        {
          kind: "code",
          id: "observe-heatmap",
          label: "네 조합의 가중치 히트맵",
          starter: `import matplotlib.pyplot as plt

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
`,
        },
        {
          kind: "code",
          id: "observe-dk",
          label: "d_k에 따른 쏠림 비교",
          starter: `print(f"{'d_k':>6}{'스케일링 O 최대 가중치':>22}{'스케일링 X 최대 가중치':>22}")
for d in (4, 16, 64, 256):
    Xd = rng.normal(size=(8, d))
    Wd = [rng.normal(scale=d ** -0.5, size=(d, d)) for _ in range(4)]
    _, w_s = multi_head_attention(Xd, *Wd, n_heads=1, causal=False, scale=True)
    _, w_n = multi_head_attention(Xd, *Wd, n_heads=1, causal=False, scale=False)
    print(f"{d:>6}{w_s.max(-1).mean():>22.3f}{w_n.max(-1).mean():>22.3f}")
`,
        },
        {
          kind: "text",
          id: "observe-answer",
          prompt: "마스크와 스케일링이 가중치 분포에 주는 영향을 세 문장 이상으로 설명해 주십시오. d_k가 커질 때의 변화도 포함합니다.",
          minChars: 150,
        },
      ],
    },
    {
      id: "paper",
      tier: "core",
      title: "논문 리포트",
      instructions: `
"Attention Is All You Need"(Vaswani et al., 2017, [arXiv:1706.03762](https://arxiv.org/abs/1706.03762))의 3장을 중심으로 읽고 다음을 작성합니다.

- (a) 가장 인상 깊었던 설계 선택과 그 이유
- (b) 2017년 이후 바뀐 부분 두 가지 이상(RoPE, Pre-LN, GQA, SwiGLU 등에서 선택)을 조사해 무엇이, 왜 바뀌었는지 정리
`,
      cells: [
        {
          kind: "text",
          id: "paper-answer",
          prompt: "논문 리포트를 작성해 주십시오. 참고한 자료의 출처를 함께 적습니다.",
          template: `### (a) 인상 깊었던 설계 선택


### (b) 2017년 이후 바뀐 부분


### 참고 자료
- `,
          minChars: 500,
        },
      ],
    },
    {
      id: "advanced",
      tier: "advanced",
      title: "심화: 문자 단위 언어모델·BPE·KV 캐시",
      instructions: `
다음 중 하나 이상을 골라 실험합니다.

- 구현한 블록을 이용해 짧은 문장으로 문자 단위 다음 글자 예측 모델의 순전파를 구성하고, 무작위 가중치에서의 손실이 $\\ln(\\text{어휘 수})$ 근처인지 확인합니다.
- BPE를 50줄 안팎으로 직접 구현해 한국어와 영어 문장의 토큰 수를 비교합니다.
- KV 캐시를 쓰는 생성 루프를 구현하고, 캐시 유무에 따른 계산량(행렬곱 횟수 또는 실행 시간)을 토큰 수별로 비교합니다.
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: `# 선택한 심화 실험을 이 셀에서 진행합니다.\n` },
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
};

export default week5Assignment;
