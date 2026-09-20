import type { WeekMeta } from "../types";

const week5: WeekMeta = {
  slug: "week-5",
  number: 5,
  phase: "Phase 3 · 현대 AI",
  title: "Transformer와 Attention",
  subtitle: "임베딩, Self-Attention, QKV, 멀티헤드, 위치 인코딩, 토크나이저(BPE)",
  selfHours: "개인 9h",
  sessionHours: "세션 2h",
  difficulty: 5,
  keywords: ["임베딩", "Self-Attention", "QKV", "멀티헤드", "위치 인코딩", "BPE"],
  objectives: [
    "Scaled Dot-Product Attention을 수식·코드·그림으로 설명하고 shape을 추적한다.",
    "RNN의 한계와 Transformer가 이를 해결한 방식을 비교한다.",
    "Causal mask 기반 GPT형 디코더 블록의 전체 구조를 백지에 그린다.",
    "BPE 토크나이저가 LLM 동작(비용·한계)에 미치는 영향을 설명한다.",
  ],
  learningOrder: [
    'Jay Alammar, "The Illustrated Transformer" (jalammar.github.io/illustrated-transformer)',
    '논문 Vaswani et al., "Attention Is All You Need" (arXiv 1706.03762) — 3장 정독',
    'Karpathy "Let\'s build GPT: from scratch, in code, spelled out" (약 2h, 따라 코딩) 및 "Let\'s build the GPT Tokenizer"',
    "Stanford CS224n Lecture: Self-Attention & Transformers",
  ],
  conceptsMd: `
### 2.1 왜 Attention인가

| | RNN | Transformer |
| --- | --- | --- |
| 정보 경로 길이 | O(n) — 멀리 있는 토큰 정보 손실 | O(1) — 모든 토큰이 직접 연결 |
| 병렬화 | 순차 처리(느림) | 시퀀스 전체 병렬(GPU 친화) |
| 연산량 | O(n) | O(n²) — 긴 문맥의 비용 문제 |

### 2.2 Self-Attention 계산

[[diagram:attention-qkv]]

\`\`\`formula
입력 X (n×d)  ──▶  Q = X Wq,  K = X Wk,  V = X Wv      (각 n×dk)
Attention(Q,K,V) = softmax( Q Kᵀ / √dk ) V
\`\`\`

비유: Q="내가 찾는 것", K="내가 가진 색인", V="내가 내줄 내용" (검색 시스템과 동일한 구조).

- √dk로 나누는 이유: dk가 크면 내적의 분산이 dk로 커져 softmax가 포화(기울기 소실). q,k 성분이 분산 1이면 q·k의 분산 = dk → 스케일링으로 분산 1을 유지한다.
- 멀티헤드: h개의 서로 다른 부분공간에서 병렬로 attention을 수행 → 문법, 참조, 위치 관계 등 다양한 패턴을 동시에 포착. 출력은 concat 후 Wo를 곱한다.
- **Causal mask**: 미래 토큰을 보지 못하도록 점수 행렬의 상삼각을 −∞로 만든다 → 다음 토큰 예측(자기회귀) 학습이 가능해진다.

### 2.3 Transformer 디코더 블록 (GPT형)

[[diagram:transformer-decoder-block]]

위치 정보: attention은 순서를 모르는 집합 연산이라 위치 인코딩이 필요하다(사인파, 학습형, RoPE 등 상대 위치 방식이 현재 주류). MLP 블록은 파라미터의 약 2/3를 차지하며 "지식 저장소"로 해석되기도 한다.

### 2.4 토크나이저 (BPE)

[[diagram:tokenizer-bpe]]

결과적 현상: 한국어는 영어보다 토큰이 많아 같은 문장의 비용이 더 크다 / 철자 세기·숫자 연산이 약한 이유의 일부 / 희귀 단어는 여러 조각으로 쪼개진다.
`,
  practiceMd: `
\`\`\`python
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F

# (1) NumPy로 단일 헤드 self-attention
def softmax(x, axis=-1):
    x = x - x.max(axis, keepdims=True); e = np.exp(x); return e / e.sum(axis, keepdims=True)

def self_attention(X, Wq, Wk, Wv, causal=True):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv                  # (n, dk)
    S = Q @ K.T / np.sqrt(K.shape[-1])                 # (n, n)
    if causal: S = np.where(np.triu(np.ones_like(S), 1) == 1, -1e9, S)
    A = softmax(S)                                     # 각 행의 합 = 1
    return A @ V, A

rng = np.random.default_rng(0)
n, d, dk = 5, 8, 4
X = rng.normal(size=(n, d))
out, A = self_attention(X, *(rng.normal(size=(d, dk)) for _ in range(3)))
print(out.shape, A.round(2))          # A는 하삼각행렬이어야 함

# (2) PyTorch 멀티헤드 causal attention 모듈
class CausalSelfAttention(nn.Module):
    def __init__(self, d, h):
        super().__init__(); self.h = h; self.qkv = nn.Linear(d, 3*d); self.o = nn.Linear(d, d)
    def forward(self, x):
        B, T, D = x.shape
        q, k, v = self.qkv(x).chunk(3, -1)
        q, k, v = (t.view(B, T, self.h, D//self.h).transpose(1, 2) for t in (q, k, v))  # B,h,T,dh
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True)
        return self.o(y.transpose(1, 2).reshape(B, T, D))
print(CausalSelfAttention(64, 4)(torch.randn(2, 10, 64)).shape)   # (2, 10, 64)

# (3) 토크나이저 관찰
# !pip install tiktoken
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
for s in ["Hello world", "안녕하세요 반갑습니다", "strawberry", "12345 + 67890"]:
    ids = enc.encode(s); print(s, len(ids), [enc.decode([i]) for i in ids])
\`\`\`

:::example 심화 실습
Karpathy nanoGPT 스타일: tiny Shakespeare 또는 한국어 텍스트로 문자 단위 GPT(약 10M 파라미터)를 학습하고 샘플을 생성해 본다. 실행은 Colab GPU에서 5~10분.
:::
`,
  quiz: [
    "n=1000, d_model=512 일 때 attention 점수 행렬의 크기와 문맥이 2배가 되면 비용은?",
    "Causal mask가 없으면 학습 시 어떤 부정행위가 발생하는가?",
    "√dk 스케일링을 생략하면 어떤 문제가 생기는가?",
    "멀티헤드가 단일 헤드(같은 총 차원)보다 유리한 이유는?",
    "한국어 문장이 영어보다 토큰이 많은 이유와 비용 영향은?",
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "ChatGPT는 문장 안에서 어떻게 관련 있는 단어를 찾아내는가?"' },
    { label: "② 키워드 8개" },
    { label: "③ 그림 — 디코더 블록 전체 + 5×5 attention 행렬(마스크 표시)" },
    { label: "④ 수식 — softmax(QKᵀ/√dk)V, 각 행렬의 shape" },
    { label: "⑤ 설명하기 — 도서관 사서 비유로 Q, K, V를 설명 (7문장)" },
    { label: "⑥ 막힌 곳 / 보완" },
  ],
  assignmentMd: `
### 필수 「나만의 미니 GPT 블록」

1. NumPy로 **멀티헤드** causal self-attention을 구현(Wo 포함). 모든 중간 텐서의 shape을 주석으로 표기.
2. PyTorch 구현(\`F.scaled_dot_product_attention\` 없이 직접 softmax)과 위 코드의 출력이 일치(allclose)함을 검증.
3. Attention 가중치 히트맵을 그리고, 마스크 유무·√dk 유무에 따른 차이를 관찰·서술.
4. 완성된 블록 2층으로 문자 단위 언어모델을 학습해 loss 곡선과 생성 샘플 5개 제출. 학습 전후 샘플 비교.
5. 논문 정독 리포트(1쪽): "Attention Is All You Need"에서 (a) 가장 놀라운 설계 선택 (b) 2017년 이후 바뀐 부분(RoPE, Pre-LN, GQA 등) 조사.

### 심화

- BPE를 직접 구현(50줄)하고 tiktoken 결과와 비교.
- KV cache 아이디어를 설명하고 생성 속도 개선을 측정.

### 채점 (10점)

| 항목 | 점수 |
| --- | --- |
| 구현 정확성(allclose, mask) | 4 |
| shape 추적·설명 | 2 |
| 실험 관찰 | 2 |
| 논문 리포트 | 2 |
`,
  dueNote: "제출: 일요일 23:59",
  furtherReading: [
    'Elhage et al., "A Mathematical Framework for Transformer Circuits" (Anthropic)',
    "Su et al., RoFormer(RoPE) 2104.09864",
    "Radford et al., GPT-2 논문",
  ],
};

export default week5;
