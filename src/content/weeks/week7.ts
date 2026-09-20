import type { WeekMeta } from "../types";

const week7: WeekMeta = {
  slug: "week-7",
  number: 7,
  phase: "Phase 4 · 활용·책임",
  title: "LLM 활용: 프롬프트 · RAG · 에이전트 · 평가",
  subtitle: "Prompt Engineering, Embedding, Vector Search, RAG, Tool Use, ReAct, LLM-as-judge",
  selfHours: "개인 9h",
  sessionHours: "세션 2h",
  difficulty: 5,
  keywords: ["프롬프트", "임베딩", "RAG", "에이전트", "평가"],
  objectives: [
    '프롬프트를 "명세서"로 설계하고 구조화 출력을 얻는다.',
    "임베딩 기반 검색과 RAG 파이프라인의 각 단계를 구현·진단한다.",
    "도구 호출 에이전트 루프(ReAct)의 구조와 실패 유형을 설명한다.",
    "평가 없이는 개선도 없다 — 골든셋 기반으로 시스템을 측정한다.",
  ],
  learningOrder: [
    '공식 프롬프트 가이드 (Anthropic docs "Prompt engineering overview", OpenAI Prompt Engineering Guide) 정독',
    "논문: Lewis et al. RAG (2005.11401), Yao et al. ReAct (2210.03629)",
    "Chip Huyen, AI Engineering — RAG/에이전트/평가 장, 또는 블로그 (huyenchip.com)",
    'Berkeley CS294/194 "LLM Agents" 강의 자료 개요',
  ],
  conceptsMd: `
### 2.1 프롬프트 설계 원칙

| 원칙 | 나쁜 예 → 좋은 예 |
| --- | --- |
| 역할·맥락 명시 | "요약해줘" → "당신은 대학 동아리 회의록 작성자다. 아래 회의 내용을 결정사항/할 일/담당자로 요약하라." |
| 출력 형식 고정 | "정리해줘" → \`JSON: {decisions:[], todos:[{who,what,due}]} 만 출력\` |
| Few-shot 예시 | 규칙 설명 대신 입력→출력 예 2~3개 |
| 추론 유도(CoT) | "단계별로 풀고 마지막 줄에 'ANSWER: '로 결론" |
| 제약·불확실성 허용 | "자료에 없으면 '모름'이라고 답하라" |
| 구분자로 데이터 분리 | \`<document>…</document>\` 로 지시와 데이터 분리 (프롬프트 인젝션 완화) |

:::info 프롬프트도 코드처럼
버전 관리 → 테스트셋 → 회귀 확인의 과정을 거쳐 개발한다.
:::

### 2.2 임베딩과 벡터 검색

문장 → 고정 길이 벡터. 의미가 비슷하면 방향이 비슷하다(W1의 코사인 유사도). 대규모에서는 근사 최근접(ANN: HNSW, IVF, FAISS)을 사용한다.

### 2.3 RAG 파이프라인

[[diagram:rag-pipeline]]

**디버깅 순서**: 먼저 검색만 평가(정답 문서가 Top-k에 있는가? = Recall@k, MRR) → 그 다음 생성 평가(근거에 충실한가, 답이 맞는가).

### 2.4 에이전트와 도구 사용

[[diagram:agent-loop]]

### 2.5 평가

- **골든셋**: 대표 질문 20~100개 + 정답/근거. 실제 사용자 질문에서 수집, 어려운 사례를 포함한다.
- **자동 채점**: 정확 일치, 포함 여부, 임베딩 유사도, **LLM-as-judge**(루브릭 제공, 위치·길이 편향 주의, 사람 라벨과 상관 검증).
- **온라인**: A/B, 사용자 피드백. **회귀 테스트**: 프롬프트/모델 변경 시 골든셋 재실행.
`,
  practiceMd: `
### 서버 없이 만드는 미니 RAG

\`\`\`python
# !pip install sentence-transformers numpy
import numpy as np
from sentence_transformers import SentenceTransformer
emb = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")   # 한국어 지원

docs = [
  "Aegis 동아리는 매주 토요일 오후 2시에 정기 세션을 진행한다.",
  "스터디 과제는 일요일 23:59까지 Colab 링크로 제출한다.",
  "백지공부 시트는 금요일까지 제출하며 자기 채점 항목이 포함된다.",
  "수료 기준은 70점 이상이며 캡스톤 제출이 필수이다.",
]
def chunk(text, size=200, overlap=40):
    return [text[i:i+size] for i in range(0, max(1, len(text)-overlap), size-overlap)]
chunks = [c for d in docs for c in chunk(d)]
E = emb.encode(chunks, normalize_embeddings=True)          # (n, dim) 단위벡터 → 내적 = 코사인

def retrieve(q, k=2):
    s = E @ emb.encode([q], normalize_embeddings=True)[0]
    return [(chunks[i], float(s[i])) for i in np.argsort(-s)[:k]]

def build_prompt(q):
    ctx = "\\n".join(f"[{i+1}] {c}" for i, (c, _) in enumerate(retrieve(q)))
    return f"""아래 자료만 근거로 답하라. 자료에 없으면 '자료에 없음'이라고 답하고, 근거 번호를 [1]처럼 인용하라.
<자료>
{ctx}
</자료>
질문: {q}"""
print(build_prompt("과제는 언제까지 내야 해?"))   # → 이 프롬프트를 LLM(웹 챗 또는 API)에 입력

# 검색 평가 (골든셋): (질문, 정답 청크의 인덱스)
gold = [("정기 모임 시간이 언제야?", 0), ("합격 기준 점수는?", 3)]
hit = sum(any(chunks[g] == c for c, _ in retrieve(q, 2)) for q, g in gold) / len(gold)
print("Recall@2 =", hit)
\`\`\`

### 에이전트 루프 스켈레톤 (개념 구현)

\`\`\`python
import json
TOOLS = {"calc": lambda expr: str(eval(expr, {"__builtins__": {}})),   # 교육용: 실서비스에서 eval 금지!
         "search": lambda q: retrieve(q, 1)[0][0]}
def agent(goal, llm, max_steps=5):
    hist = [f"목표: {goal}"]
    for _ in range(max_steps):
        reply = llm("\\n".join(hist) + '\\nJSON으로만 답하라: {"tool":이름|null,"args":인자,"final":최종답|null}')
        r = json.loads(reply)
        if r["final"]: return r["final"]
        hist.append(f"호출 {r['tool']}({r['args']}) → {TOOLS[r['tool']](r['args'])}")
    return "중단: 최대 스텝 초과"
\`\`\`

:::warn 토론
위 스켈레톤의 보안 문제 3가지는? (eval, 도구 결과를 통한 프롬프트 인젝션, 권한 과다)
:::
`,
  quiz: [
    'RAG가 환각을 "제거"하지 못하고 "완화"만 하는 이유는?',
    "청크가 너무 클 때와 너무 작을 때의 부작용은?",
    "Recall@k가 높은데 최종 답이 틀리는 경우, 다음에 의심할 곳은?",
    "LLM-as-judge의 대표적 편향 2가지와 완화책은?",
    '검색된 문서에 "이전 지시를 무시하고 …하라"가 있으면 어떤 공격인가? 방어는?',
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "LLM에게 \'내 자료\'를 알려주려면 어떻게 하는가?"' },
    { label: "② 키워드 8개" },
    { label: "③ 그림 — RAG 전체 흐름(색인/질의) + 실패 지점 5곳 표시" },
    { label: "④ 수식/의사코드 — 코사인 유사도 검색, 에이전트 루프" },
    { label: '⑤ 설명하기 — "파인튜닝 vs RAG vs 프롬프트" 언제 무엇을 쓰나? (비교표 + 3문장)' },
    { label: "⑥ 막힌 곳 / 보완" },
  ],
  assignmentMd: `
### 필수 「Aegis 스터디 QA 봇 + 평가 리포트」

1. 스터디 문서(본 커리큘럼·주차 자료 중 5개 이상, 또는 팀이 선택한 문서 세트)를 색인하는 RAG 시스템을 구현.
2. **골든셋 20문항**(쉬움 10 / 다단계·모호·자료에 없는 질문 10)을 직접 작성하고 정답과 근거 청크를 표시.
3. 검색 지표(Recall@k, MRR)와 생성 지표(정확도, 근거 충실도 1~5)를 측정. 청크 크기(200/500/1000자)와 k(1/3/5)를 바꾼 실험 표 제출.
4. "자료에 없음"을 올바르게 답하는 비율(거부 정확도)을 측정하고 프롬프트를 개선해 전/후 비교.
5. 실패 사례 5건을 원인(청킹/검색/생성/질문)으로 분류하고 개선안을 제시. 프롬프트 인젝션 테스트 문서 1건도 시도해 결과 보고.

### 심화

- BM25 + 임베딩 하이브리드 검색과 rerank 비교.
- LLM-as-judge를 구현하고 본인 채점과의 일치율(Cohen's κ 또는 단순 일치율) 계산.

### 채점 (10점)

| 항목 | 점수 |
| --- | --- |
| 골든셋의 질(다양성·난이도) | 3 |
| 실험 설계·지표 | 3 |
| 실패 분석·개선 효과 | 3 |
| 재현성·문서화 | 1 |
`,
  dueNote: "제출: 일요일 23:59",
  furtherReading: [
    'Anthropic, "Building effective agents" (블로그)',
    'Zheng et al., "Judging LLM-as-a-Judge with MT-Bench" (2306.05685)',
    'Greshake et al., "Indirect Prompt Injection" (2302.12173)',
  ],
};

export default week7;
