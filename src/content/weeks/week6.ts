import type { WeekMeta } from "../types";

const week6: WeekMeta = {
  slug: "week-6",
  number: 6,
  phase: "Phase 3 · 현대 AI",
  title: "LLM 원리: 사전학습 · 스케일링 · 정렬 · 디코딩",
  subtitle: "Next-token prediction, Scaling Law, SFT, RLHF, DPO, Temperature, Hallucination",
  selfHours: "개인 8h",
  sessionHours: "세션 2h",
  difficulty: 5,
  keywords: ["Next-token", "Scaling Law", "SFT", "RLHF", "DPO", "환각"],
  objectives: [
    'LLM이 "다음 토큰 확률분포"를 학습한다는 것을 손실함수 수준에서 설명한다.',
    "Kaplan/Chinchilla 스케일링 법칙으로 컴퓨트 예산에 맞는 모델·데이터 규모를 계산한다.",
    "사전학습 → SFT → 선호 학습(RLHF/DPO) 파이프라인의 각 단계 목적을 구분한다.",
    "디코딩 파라미터가 출력에 미치는 영향과 환각의 원인을 설명한다.",
  ],
  learningOrder: [
    "Stanford CS336 (Language Modeling from Scratch) 강의 자료의 개요·데이터·스케일링 파트 (stanford-cs336.github.io)",
    'Karpathy "Intro to Large Language Models" (1h 영상) + "State of GPT"',
    "논문: Kaplan et al. 2020 (2001.08361) 요약·그림, Hoffmann et al. 2022 Chinchilla (2203.15556), Ouyang et al. InstructGPT (2203.02155)",
    "Rafailov et al. DPO (2305.18290) 초록·핵심 아이디어",
  ],
  conceptsMd: `
### 2.1 학습 파이프라인

[[diagram:llm-pipeline]]

사전학습 손실: \`L = −(1/T) Σ log P(xₜ | x<ₜ)\` (교차 엔트로피). Perplexity = \`exp(L)\` — "평균적으로 몇 개 후보 중에서 고민하는가"를 뜻한다.

### 2.2 스케일링 법칙

[[diagram:scaling-law-plot]]

\`\`\`formula
손실 L ≈ E + A/N^α + B/D^β     (N: 파라미터 수, D: 학습 토큰 수)
컴퓨트 C ≈ 6·N·D  (FLOPs)
Chinchilla: 컴퓨트 최적 조건 D ≈ 20·N  → 70B 모델은 약 1.4T 토큰
(실무 경향: 추론비용 때문에 "과잉학습(overtrain)"하여 작은 모델에 더 많은 토큰)
\`\`\`

예: C = 1e23 FLOPs 예산 → N·D = C/6 ≈ 1.67e22, D=20N → 20N² = 1.67e22 → N ≈ 2.9e10 (약 29B), D ≈ 5.8e11 토큰.

### 2.3 정렬(Alignment)

- **RLHF**: (프롬프트, 응답A, 응답B, 선호) 데이터로 보상모델 r(x,y)를 학습 → PPO로 정책 최적화하되, KL 페널티로 기준 모델에서 너무 멀어지지 않게 한다(보상 해킹 방지).
- **DPO**: 보상모델·RL 없이 선호쌍 로그확률 차이를 직접 최적화 → 단순·안정적.
- 한계: 보상 해킹, 아첨(sycophancy), 선호 데이터의 편향.

### 2.4 디코딩

[[diagram:decoding-temperature]]

| 방법 | 설명 | 효과 |
| --- | --- | --- |
| Greedy | 매 스텝 argmax | 결정적, 반복에 빠지기 쉬움 |
| Temperature T | \`softmax(z/T)\` | T↓ 보수적, T↑ 다양·무작위 |
| Top-k / Top-p | 상위 k개 / 누적확률 p 안에서만 샘플 | 낮은 확률 잡음 제거 |
| Beam search | 상위 B개 경로 유지 | 번역·요약 등 정답형 과제 |

### 2.5 환각과 한계

모델은 "그럴듯한 다음 토큰"을 생성하도록 학습되었지 "참"을 생성하도록 학습되지 않았다. 원인: (1) 훈련분포 밖 지식의 공백을 그럴듯하게 메움 (2) 자신감 보정 부족 (3) 컨텍스트 창 한계 (4) 지식 시점 컷오프. 완화: 검색 증강(RAG, W7), 인용 요구, 도구 사용, 불확실성 표현 학습.

:::info In-context learning
가중치 갱신 없이 프롬프트 내 예시만으로 과제를 수행하는 것 — LLM의 가장 특이한 성질 중 하나다.
:::
`,
  practiceMd: `
\`\`\`python
# (1) Temperature / Top-p 이해: 직접 구현
import numpy as np
def sample(logits, T=1.0, top_p=1.0, rng=np.random.default_rng(0)):
    p = np.exp((logits - logits.max()) / T); p /= p.sum()
    idx = np.argsort(-p); cs = np.cumsum(p[idx])
    keep = idx[: np.searchsorted(cs, top_p) + 1]
    q = np.zeros_like(p); q[keep] = p[keep]; q /= q.sum()
    return rng.choice(len(p), p=q)
logits = np.array([3.0, 2.0, 1.0, 0.0, -1.0])
for T in (0.2, 1.0, 2.0):
    print(T, np.bincount([sample(logits, T) for _ in range(2000)], minlength=5) / 2000)

# (2) 실제 소형 LLM 관찰 (Colab)  !pip install transformers
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
tok = AutoTokenizer.from_pretrained("gpt2"); lm = AutoModelForCausalLM.from_pretrained("gpt2")
ids = tok("The capital of France is", return_tensors="pt")
with torch.no_grad(): logits = lm(**ids).logits[0, -1]
top = torch.topk(torch.softmax(logits, -1), 5)
print([(tok.decode(i), round(p.item(), 3)) for p, i in zip(top.values, top.indices)])
for T in (0.3, 1.0, 1.5):
    out = lm.generate(**ids, do_sample=True, temperature=T, top_p=0.95, max_new_tokens=20)
    print(T, tok.decode(out[0]))
\`\`\`

:::warn 윤리 유의
사용 가능한 API/웹 챗 모델에 같은 질문을 temperature 0과 1로 각 5번 물어 출력의 변동을 기록한다. 실제 존재하지 않는 논문/인물에 대해 물어 환각 양상을 수집하되, 결과를 사실로 유포하지 말 것.
:::
`,
  quiz: [
    "다음 토큰 손실이 2.0 nats일 때 perplexity는? (e²≈7.39)",
    "7B 모델의 Chinchilla 최적 토큰 수와 필요한 컴퓨트(6ND)는?",
    "SFT와 RLHF의 데이터 형태 차이는?",
    "T→0, T→∞ 일 때 샘플링 분포는?",
    "RLHF에서 KL 페널티를 제거하면 생길 수 있는 문제는?",
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "LLM은 지식을 \'알고\' 있는가, 확률을 \'계산\'하는가?"' },
    { label: "② 키워드 8개" },
    { label: "③ 그림 — 학습 4단계 파이프라인 + 데이터 형태" },
    { label: "④ 수식 — 사전학습 손실, C≈6ND, D≈20N, softmax(z/T)" },
    { label: '⑤ 설명하기 — "LLM이 왜 거짓말(환각)을 하나?"를 학습 목표 관점에서 설명 (7문장)' },
    { label: "⑥ 막힌 곳 / 보완" },
  ],
  assignmentMd: `
### 필수 「LLM 해부 실험 노트」

1. sample 함수를 확장해 top-k, top-p 각각의 분포 변화를 표/그래프로 제시.
2. gpt2(또는 사용 가능한 오픈 모델)로 동일 프롬프트 3종에 대해 (Greedy / T=0.7 / T=1.5+top-p) 각 5회 생성, 다양성(고유 n-gram 비율)과 품질(주관 1~5)을 표로 정리.
3. 스케일링 계산 문제: (a) 컴퓨트 1e22, 1e24 FLOPs의 Chinchilla 최적 N, D 계산 (b) 실제 공개된 모델(예: Llama 계열) 사례와 비교해 "과잉학습" 여부 논평.
4. 환각 사례 수집: 5개 질문으로 환각을 유도·기록하고 유형 분류(사실 조작 / 출처 조작 / 논리 오류 / 시점 오류), 각각의 완화책을 제안.
5. InstructGPT 논문 Figure 2를 자기 언어로 다시 그리고 3문장으로 요약.

### 심화

- DPO 손실 \`−log σ(β[(log π(y_w)−log πref(y_w)) − (log π(y_l)−log πref(y_l))])\` 를 소형 예제 수치로 계산.
- 학습곡선 그래프에서 로그-로그 직선 피팅으로 α 추정(공개 데이터 사용).

### 채점 (10점)

| 항목 | 점수 |
| --- | --- |
| 계산 정확성 | 3 |
| 실험 설계·기록 | 3 |
| 환각 분류의 통찰 | 2 |
| 논문 이해 | 2 |
`,
  dueNote: "제출: 일요일 23:59",
  furtherReading: [
    'Bommasani et al., "On the Opportunities and Risks of Foundation Models"',
    'Wei et al., "Chain-of-Thought Prompting" (2201.11903)',
    'Schaeffer et al., "Are Emergent Abilities of LLMs a Mirage?" (2304.15004)',
  ],
};

export default week6;
