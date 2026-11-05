<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 6-3 LLM 시스템과 운영

[전체 목차](README.md) · 트랙 6 생성형 AI와 언어 모델 · [모듈 원본](../../src/content/modules/llm-systems/index.ts)

벡터 검색과 RAG, 검색 품질 지표, 도구 호출과 에이전트, 환각과 평가, 서빙 비용과 모니터링

## 목표 문제

LLM은 학습 데이터에 없는 문서의 내용을 알지 못하고, 사실이 아닌 내용을 그럴듯하게 생성할 수 있다. 이 모듈은 LLM을 실제 응용에 쓰기 위한 시스템을 만든다. 문서를 조각으로 나눠 벡터로 색인하고, 질문과 관련된 조각을 검색해 프롬프트에 넣는 RAG 파이프라인을 구현한다. 검색 품질을 Recall@k와 MRR로 측정하고, 도구를 호출하는 에이전트 루프에 최대 스텝 수, 최소 권한, 사람 승인을 적용한다. 환각의 원인을 분석하고, 골든셋과 LLM 채점관으로 시스템을 평가하며, 지연시간과 메모리로 서빙 비용을 계산하고 드리프트를 감지하는 운영 지표를 설계한다. 과제에서는 이 과정의 학습 자료로 QA 봇을 만들고, 골든셋으로 평가한 리포트를 작성한다.

## 학습 목표

- 문서를 청킹하고 벡터로 색인해 RAG 파이프라인을 구현하며, Dense 검색과 Sparse 검색의 결과를 RRF로 합친다.
- Recall@k와 MRR로 검색 품질을 측정하고, RAG의 오답을 검색 실패와 생성 실패로 구분해 진단한다.
- ReAct 루프로 도구를 호출하는 에이전트를 구현하고, 최대 스텝 수, 오류의 관찰 기록, 최소 권한, 사람 승인을 적용한다.
- 환각의 원인을 학습 과정과 평가 방식으로 설명하고, 완화책의 효과와 한계를 설명한다.
- 골든셋과 LLM 채점관으로 시스템을 평가하고, Cohen's κ, 회귀 테스트, 안전성 테스트셋으로 평가 결과를 점검한다.
- 지연시간, 처리량, 추론 메모리를 계산하고, 배포 전략과 드리프트 지표로 운영 모니터링을 설계한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [임베딩과 벡터 검색](#lesson-retrieval) | 핵심 | 40분 | #79 벡터 검색, RAG, 도구 호출, 에이전트 |
| 2 | [RAG 파이프라인](#lesson-rag) | 핵심 | 45분 | #79 벡터 검색, RAG, 도구 호출, 에이전트 |
| 3 | [검색 품질 지표: Recall@k와 MRR](#lesson-retrieval-metrics) | 핵심 | 35분 | #79 벡터 검색, RAG, 도구 호출, 에이전트 |
| 4 | [도구 호출과 에이전트 루프](#lesson-agents) | 핵심 | 35분 | #79 벡터 검색, RAG, 도구 호출, 에이전트 |
| 5 | [에이전트 설계와 안전](#lesson-agent-design) | 핵심 | 40분 | #79 벡터 검색, RAG, 도구 호출, 에이전트 |
| 6 | [환각과 한계](#lesson-hallucination) | 핵심 | 40분 | #80 환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링 |
| 7 | [LLM 평가와 안전성 평가](#lesson-llm-evaluation) | 핵심 | 40분 | #80 환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링 |
| 8 | [모델 서빙과 추론 비용](#lesson-serving-cost) | 핵심 | 40분 | #80 환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링 |
| 9 | [운영 모니터링](#lesson-monitoring) | 핵심 | 45분 | #80 환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링 |
| 10 | [근사 최근접 이웃 인덱스와 재순위화](#lesson-ann-indexes) | 보충 | 45분 | — |
| 11 | [도구 호출 구현: 스키마, 인자 검증, 안전한 도구](#lesson-tool-use) | 보충 | 45분 | — |
| 12 | [LLM 운영의 특성](#lesson-llmops) | 보충 | 45분 | — |
| 13 | [트랜스포머의 크기 계산](#lesson-transformer-params) | 보충 | 30분 | — |
| 14 | [대조 학습의 수학: InfoNCE, 온도, 배치 크기](#lesson-contrastive-learning) | 심화 | 35분 | — |
| 15 | [LLM 평가의 통계](#lesson-eval-statistics) | 심화 | 35분 | — |
| 16 | [프롬프트 인젝션의 설계 수준 방어](#lesson-injection-defense) | 심화 | 40분 | — |
| 17 | [투기적 디코딩](#lesson-speculative-decoding) | 심화 | 35분 | — |
| 18 | [드리프트 감지의 통계](#lesson-drift-statistics) | 심화 | 40분 | — |

## 핵심 레슨

<a id="lesson-retrieval"></a>

### 1. 임베딩과 벡터 검색

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-systems/retrieval.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/retrieval.ts)

**학습 목표:** 임베딩 기반 Dense 검색과 BM25 Sparse 검색의 매칭 기준과 강약점을 비교하고, 전수 비교가 대규모에서 쓰기 어려운 이유와 ANN·벡터 DB의 역할, RRF가 점수 대신 순위로 두 검색기의 결과를 합치는 원리를 설명한다.

**쓰이는 곳:** LLM은 학습 데이터에 없는 문서(사내 문서, 최신 자료)의 내용을 알지 못하므로, 질문과 관련된 문서를 찾아 프롬프트에 넣는 검색이 RAG([6-3 RAG 파이프라인](#lesson-rag))의 첫 단계다. 검색 방식에 따라 찾을 수 있는 문서가 달라지므로, 질의의 특성에 맞는 검색 방식을 골라야 한다.

**본문 절:** 임베딩과 코사인 유사도 · 전수 비교와 ANN · Sparse 검색: BM25 · 하이브리드 검색과 RRF · 재순위화

**구성:** 확인 문제 7 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` BM25를 직접 구현하고 RRF로 Dense와 합치기

**서술형**

- `d1` BM25(Sparse 검색)와 임베딩 기반 Dense 검색의 매칭 기준 차이를 쓰고, 각각이 유리한 질의를 하나씩 예로 들어라. 두 결과를 RRF로 합칠 때 점수 대신 순위를 쓰는 이유도 쓰라.
- `d2` 정확한 최근접 이웃 탐색이 대규모 벡터 집합에서 쓰기 어려운 이유를 연산량($n$, $d$)으로 설명하고, ANN이 이 문제를 어떻게 줄이며 무엇을 대가로 치르는지 쓰라.

**참고 자료**

- [Reimers & Gurevych (2019) — Sentence-BERT](https://arxiv.org/abs/1908.10084) — 문장 하나를 벡터 하나로 바꿔 코사인 유사도로 비교하는 문장 임베딩 모델 (영문)
- [Cormack et al. (2009) — Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) — RRF를 제안한 논문 (영문)
- [Robertson & Zaragoza (2009) — The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf) — BM25 공식의 유도와 변형 (영문)

<a id="lesson-rag"></a>

### 2. RAG 파이프라인

핵심 · 45분 · [본문 원본](../../src/content/modules/llm-systems/rag.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/rag.ts)

**학습 목표:** 색인(청킹, 벡터화)과 질의(검색, 프롬프트 조립, 생성) 단계로 RAG를 구현하고, 청크 크기와 overlap의 트레이드오프를 설명하며, 검색 실패와 생성 실패를 구분해 진단한다.

**쓰이는 곳:** 사내 문서 검색, 고객 지원, 학습 자료 질의응답처럼 특정 문서에 근거해 답해야 하는 LLM 응용은 대부분 RAG로 만든다. 모델을 다시 학습하지 않고 문서만 바꿔 최신 정보를 반영할 수 있으며, 이 모듈의 과제인 스터디 QA 봇도 이 레슨의 파이프라인으로 만든다.

**본문 절:** RAG의 구조 · 검색 실패와 생성 실패 · 청킹 · 색인과 검색 · 검색 결과로 프롬프트 조립하기

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 3 · Colab 코드 1 · 그림 4 · 이미지 1

**실습**

- `ex1` 청킹, 검색, 근거 인용 프롬프트 조립

**서술형**

- `d1` RAG가 환각을 없애지 못하고 줄이기만 하는 이유를 검색 실패와 생성 실패로 나눠 설명하고, 답이 틀렸을 때 두 실패를 구분해 진단하는 순서를 쓰라.
- `d2` 청크가 너무 클 때와 너무 작을 때의 문제를 쓰고, 청크를 겹치게 자르는 이유와 overlap을 늘릴 때의 비용을 쓰라.

**참고 자료**

- [Lewis et al. (2020) — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) — RAG를 제안한 논문 (영문)
- [Liu et al. (2023) — Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) — 긴 입력의 가운데에 놓인 정보를 잘 활용하지 못하는 현상을 측정한 논문 (영문)

<a id="lesson-retrieval-metrics"></a>

### 3. 검색 품질 지표: Recall@k와 MRR

핵심 · 35분 · [본문 원본](../../src/content/modules/llm-systems/retrieval-metrics.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/retrieval-metrics.ts)

**학습 목표:** Recall@k와 MRR을 정의대로 계산하고, 두 지표가 각각 무엇(상위 k개에 포함되었는지, 순위가 얼마나 높은지)을 재는지와 검색이 맞았는데도 답이 틀릴 때 점검할 곳을 설명한다.

**쓰이는 곳:** RAG의 답이 틀렸을 때 검색의 문제인지 생성의 문제인지 구분하려면 검색 품질을 수치로 측정해야 한다. 청크 크기나 임베딩 모델을 바꿀 때 어느 설정이 나은지도 이 지표로 비교하며, 이 모듈의 과제에서 작성하는 평가 리포트에도 이 지표를 보고한다.

**본문 절:** Recall@k · MRR · 두 지표를 함께 보는 이유 · 코드로 계산하기

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 정답 순위로 Recall@k와 MRR 계산하기

**서술형**

- `d1` Recall@k와 MRR이 각각 무엇을 재는지 쓰고, 두 시스템의 Recall@5가 똑같이 0.8인데 MRR이 다를 수 있는 예를 들어라. 실무에서 두 지표를 함께 보고하는 이유도 쓰라.
- `d2` 질문 4개의 정답 순위가 [1, 1, 3, 없음]일 때 MRR과 Recall@3을 계산하라. Recall@k가 높은데도 최종 답이 틀린다면 무엇을 점검해야 하는지도 쓰라.

**참고 자료**

- [Weaviate — Evaluation Metrics for Search and Recommendation Systems](https://weaviate.io/blog/retrieval-evaluation-metrics) — Recall, MRR, nDCG를 예제로 비교한 글 (영문)
- [Es et al. (2023) — RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) — 검색과 생성을 나눠 평가하는 RAG 평가 지표 (영문)

<a id="lesson-agents"></a>

### 4. 도구 호출과 에이전트 루프

핵심 · 35분 · [본문 원본](../../src/content/modules/llm-systems/agents.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/agents.ts)

**학습 목표:** ReAct의 관찰→추론→행동 루프를 코드로 구현하고, 종료 판단 실패, 도구 오선택, 출력 형식 오류 같은 실패 유형과 max_steps, 오류를 관찰로 되돌려 주기, Reflection의 역할을 설명한다.

**쓰이는 곳:** LLM이 검색, 계산, 코드 실행, 외부 API 호출 같은 도구를 쓰는 응용은 모두 이 레슨의 루프 구조로 동작한다. 루프가 끝나지 않거나 잘못된 도구를 호출하는 문제는 실제 서비스에서 비용과 장애로 이어지므로, 루프를 구현할 때 종료 조건과 오류 처리를 함께 설계해야 한다.

**본문 절:** ReAct 루프 · 에이전트 루프의 구조 · 실패를 관찰로 되돌려 주기

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 2

**실습**

- `ex1` 실수를 관찰로 되돌려 주는 에이전트 루프

**서술형**

- `d1` 에이전트 루프에 max_steps 같은 상한을 두지 않으면 생기는 문제를 쓰고, 모델의 형식 오류나 없는 도구 호출을 프로그램 오류로 멈추지 않고 관찰로 기록하는 이유를 쓰라.
- `d2` ReAct 루프의 관찰, 추론, 행동이 각각 무엇인지 쓰고, Reflection이 이 루프에 더하는 것을 쓰라.

**참고 자료**

- [Yao et al. (2022) — ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) — ReAct를 제안한 논문. 그림 1에 추론·행동·관찰의 흐름이 있다 (영문)
- [Shinn et al. (2023) — Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) — 결과를 텍스트로 평가해 다음 시도에 반영하는 방법 (영문)
- [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) — 워크플로와 에이전트의 차이와 설계 원칙 (영문)

<a id="lesson-agent-design"></a>

### 5. 에이전트 설계와 안전

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-systems/agent-design.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/agent-design.ts)

**학습 목표:** 단기 기억(이력 자르기)과 장기 기억(검색해 불러오기), 플래너·실행자로 나눈 다중 에이전트, MCP의 역할을 설명하고, 간접 프롬프트 인젝션에 데이터와 지시의 분리, 최소 권한, 사람 승인을 겹쳐 적용한다.

**쓰이는 곳:** 에이전트가 메일 발송, 파일 수정, 결제 같은 실제 행동을 할 수 있으면 모델의 오류나 외부 문서에 숨은 지시가 곧바로 피해로 이어진다. 에이전트를 서비스에 넣으려면 무엇을 기억시키고 어떤 도구와 권한을 줄지, 어떤 행동에 사람의 승인을 받을지를 코드로 설계해야 한다.

**본문 절:** 단기 기억과 장기 기억 · 다중 에이전트와 MCP · 최소 권한과 사람 승인 · 간접 프롬프트 인젝션의 다층 방어

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 4

**실습**

- `ex1` 단기 기억 자르기와 장기 기억 검색으로 컨텍스트 조립하기

**서술형**

- `d1` 에이전트의 단기 기억과 장기 기억이 각각 어디에 있고 언제 사라지거나 유지되는지 쓰고, 장기 기억에서 지금 질문과 관련 없는 기억을 넣지 않는 이유를 쓰라.
- `d2` 도구를 쓰는 에이전트가 웹 문서에 숨은 지시에 따라 메일을 보내려 한다. 방어를 여러 단계로 겹쳐 두어야 하는 이유를 쓰고, 데이터 표시, 최소 권한, 사람 승인이 각각 어느 지점을 막는지 쓰라.

**참고 자료**

- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/introduction) — MCP의 클라이언트·서버 구조와 예제 (영문)
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) — 프롬프트 인젝션, 과도한 권한(Excessive Agency) 등 LLM 응용의 대표적인 보안 위험 (영문)
- [Greshake et al. (2023) — Not what you've signed up for: Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) — 간접 프롬프트 인젝션을 체계적으로 분석한 논문 (영문)

<a id="lesson-hallucination"></a>

### 6. 환각과 한계

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-systems/hallucination.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/hallucination.ts)

**학습 목표:** 환각이 사전학습의 목적함수, 드물게 나온 사실, 사후학습과 평가 방식, 디코딩, 문맥 창과 지식 시점 컷오프 등 여러 요인에서 생긴다는 점을 설명하고, 완화책이 환각을 줄일 뿐 없애지 못하는 이유를 설명한다.

**쓰이는 곳:** LLM을 쓰는 응용은 모델이 그럴듯한 거짓을 생성할 수 있다는 전제에서 설계해야 한다. 환각의 원인을 알아야 RAG, 인용 검증, 도구 사용, 답변 보류 중 어떤 완화책이 그 환각에 맞는지 고를 수 있고, 사람이 확인해야 하는 용도를 정할 수 있다.

**본문 절:** 완화책과 한계

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 4

**실습**

- `ex1` 말투의 확신과 실제 정답률: ECE 계산

**서술형**

- `d1` 환각이 생기는 원인을 사전학습의 목적함수, 사후학습과 평가 방식, 지식 시점 컷오프로 나눠 설명하고, 완화책이 환각을 줄일 뿐 없애지 못하는 이유를 쓰라.
- `d2` 사실 문장만으로 학습한 bigram 모델이 "파리 는 일본 의 수도 이다"를 생성한 이유를 설명하고, 학습 문장을 그대로 저장해 재생하는 모델을 쓰면 환각은 사라지지만 무엇을 잃는지 쓰라.

**참고 자료**

- [Kalai et al. (2025) — Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664) — 환각의 통계적 원인과 추측에 유리한 평가 방식을 분석한 논문 (영문)
- [Huang et al. (2023) — A Survey on Hallucination in Large Language Models](https://arxiv.org/abs/2311.05232) — 환각의 유형과 완화책을 정리한 조사 논문 (영문)

<a id="lesson-llm-evaluation"></a>

### 7. LLM 평가와 안전성 평가

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-systems/llm-evaluation.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/llm-evaluation.ts)

**학습 목표:** 대표성 있는 골든셋을 설계하고 채점 방식(정확 일치, 포함, 의미 유사도, LLM-as-judge)을 고르며, LLM 채점관의 편향을 점검하고 Cohen's κ로 사람 채점과의 일치도를 확인한다. 회귀 테스트로 변경의 부작용을 찾고, 탈옥·인젝션 테스트셋으로 안전성을 평가한다.

**쓰이는 곳:** 프롬프트, 청크 크기, 모델을 바꿀 때마다 결과가 나아졌는지는 같은 기준으로 측정해야 알 수 있다. 평가 절차가 없으면 몇 개의 질문으로 확인한 인상에 따라 설정을 고르게 되고, 기존에 맞히던 질문을 새로 틀리는 회귀나 안전 정책이 우회되는 문제를 배포 전에 찾지 못한다.

**본문 절:** 골든셋: 무엇으로 시험할 것인가 · 채점 방식: 어떻게 채점할 것인가 · 회귀 테스트: 바꿀 때마다 다시 확인한다 · 안전성 평가

**구성:** 확인 문제 7 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 회귀 문항 찾기, 순서 바꿔 채점하기, Cohen's κ

**서술형**

- `d1` LLM-as-judge를 회귀 테스트에 쓰려고 한다. 대표적인 편향 두 가지와 완화책을 쓰고, 채점관을 신뢰할 수 있는지 확인하는 절차와 그때 일치율 대신 Cohen's κ를 보는 이유를 쓰라.
- `d2` 회귀 테스트가 평균 정확도의 비교만으로는 부족한 이유를 예를 들어 설명하고, 안전성 평가에서 공격 성공률과 과잉 거절률을 함께 측정해야 하는 이유를 쓰라.

**참고 자료**

- [Zheng et al. (2023) — Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) — LLM 채점관의 위치·길이·자기 선호 편향과 완화책을 측정한 논문 (영문)
- [Hamel Husain — Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) — 실무에서 평가 체계를 만드는 방법 (영문)
- [Mazeika et al. (2024) — HarmBench: A Standardized Evaluation Framework for Automated Red Teaming and Robust Refusal](https://arxiv.org/abs/2402.04249) — 탈옥 공격의 성공률을 표준화해 측정하는 평가 체계 (영문)

<a id="lesson-serving-cost"></a>

### 8. 모델 서빙과 추론 비용

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-systems/serving-cost.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/serving-cost.ts)

**학습 목표:** LLM 서빙의 지연시간(TTFT, 토큰당 시간)과 처리량을 구분해 계산하고, 배치 크기가 둘에 미치는 영향과 추론 메모리를 계산하며, 양자화와 지식 증류가 비용을 줄이는 원리와 대가를 설명한다.

**쓰이는 곳:** LLM 응용의 운영 비용은 대부분 추론에서 생기고, 사용자가 체감하는 품질도 응답 속도에 영향을 받는다. 모델과 GPU를 고르고 배치 크기나 양자화 같은 설정을 정하려면 지연시간, 처리량, 메모리를 계산할 수 있어야 하며, 이 값들은 [6-3 운영 모니터링](#lesson-monitoring)에서 운영 지표로 추적한다.

**본문 절:** 지연시간과 처리량 · 배치와 메모리 대역폭 · 모델 크기와 추론 메모리 · 양자화 · 지식 증류 · 추론 비용을 줄이는 방법

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 3

**실습**

- `ex1` 응답 시간 계산과 블록 단위 양자화

**서술형**

- `d1` LLM 서빙에서 지연시간과 처리량을 구분하고, 여러 요청을 배치로 묶을 때 둘이 각각 어떻게 변하는지를 디코드 단계의 메모리 대역폭으로 설명하라.
- `d2` 양자화와 지식 증류가 각각 추론 비용의 무엇을 줄이는지 쓰고, 두 방법의 원리와 대가를 비교하라.

**참고 자료**

- [Kwon et al. (2023) — Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) — KV 캐시를 블록 단위로 관리해 처리량을 높인 vLLM의 논문 (영문)
- [Dettmers et al. (2022) — LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale](https://arxiv.org/abs/2208.07339) — 대형 모델을 INT8로 양자화할 때 생기는 문제와 해결 방법 (영문)
- [Hinton et al. (2015) — Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531) — 지식 증류를 제안한 논문 (영문)
- [Sanh et al. (2019) — DistilBERT, a distilled version of BERT](https://arxiv.org/abs/1910.01108) — 증류로 BERT를 줄인 결과 (영문)

<a id="lesson-monitoring"></a>

### 9. 운영 모니터링

핵심 · 45분 · [본문 원본](../../src/content/modules/llm-systems/monitoring.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/monitoring.ts)

**학습 목표:** 모델 서빙(REST, FastAPI), Docker, 점진적 배포, 실험 추적, 세 파이프라인, CI/CD를 설명하고, 데이터 드리프트와 개념 드리프트를 구분하며, PSI가 감지할 수 있는 것(입력 분포의 변화)과 감지할 수 없는 것(개념 드리프트, 실제 성능 저하)을 설명한다.

**쓰이는 곳:** 배포한 모델은 입력 데이터와 환경이 바뀌면 오류 없이 성능만 떨어질 수 있다. 서비스로 운영하려면 모델을 API로 제공하고, 새 버전을 안전하게 배포하며, 입력 분포와 성능을 계속 측정해 재학습이 필요한 시점을 판단해야 한다. LLM 응용도 같은 운영 절차 위에서 LLM 고유의 지표를 추가로 추적한다.

**본문 절:** MLOps · 모델 서빙과 Docker · 배포 전략과 버전 관리 · 파이프라인과 CI/CD · 드리프트 · PSI · A/B 테스트와 트래픽 처리 · LLM 응용의 운영 지표

**구성:** 확인 문제 7 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · Colab 코드 1 · 그림 5

**실습**

- `ex1` PSI로 드리프트 경보를 만들고 카나리 배포 판정하기

**서술형**

- `d1` 데이터 드리프트와 개념 드리프트를 정의하고, 입력 분포만 측정하는 PSI로 각각을 감지할 수 있는지 쓰라. 배포 후에도 성능을 직접 추적하고, 경보가 울렸을 때 원인부터 확인해야 하는 이유도 쓰라.
- `d2` 카나리 배포, 블루-그린 배포, 섀도 배포의 방식과 장점을 비교하고, 새 모델을 전체 트래픽에 한 번에 배포하는 것보다 나은 점을 쓰라.

**참고 자료**

- [Google Cloud — MLOps: Continuous delivery and automation pipelines in machine learning](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning) — MLOps의 성숙도 단계와 파이프라인 구조 (영문)
- [Made With ML — MLOps 코스](https://madewithml.com/) — 실험 추적, 테스트, 서빙을 실습으로 다루는 코스 (영문)
- [FastAPI 공식 튜토리얼](https://fastapi.tiangolo.com/tutorial/) — FastAPI로 API 서버를 만드는 방법 (영문)

## 보충 레슨

<a id="lesson-ann-indexes"></a>

### 10. 근사 최근접 이웃 인덱스와 재순위화

보충 · 45분 · [본문 원본](../../src/content/modules/llm-systems/ann-indexes.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/ann-indexes.ts)

**학습 목표:** IVF의 칸 수와 $n_\text{probe}$, HNSW의 $M$·efSearch, PQ 압축이 속도·재현율·메모리를 어떻게 맞바꾸는지 설명하고, 사후·사전 메타데이터 필터의 차이와 bi-encoder·cross-encoder 2단계 검색을 Recall@k′·nDCG로 나눠 평가할 수 있다.

**쓰이는 곳:** 벡터가 수백만 개를 넘는 검색 시스템에서는 인덱스의 종류와 설정이 응답 속도, 재현율, 메모리 비용을 함께 정한다. 날짜나 권한 같은 조건으로 거르는 순서와 재순위화를 어떻게 구성하는지에 따라 RAG가 프롬프트에 넣는 근거의 품질이 달라진다.

**본문 절:** 전수 비교의 계산량과 메모리 · IVF: 칸으로 나누고 가까운 칸만 탐색한다 · HNSW: 여러 층의 그래프 탐색 · 메모리를 줄이는 PQ · 인덱스와 데이터베이스 · 메타데이터 필터: 거르는 순서가 결과를 바꾼다 · 재순위화: 빠른 1차 검색과 정확한 2차 정렬

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 5 · 이미지 1

**실습**

- `ex1` IVF 인덱스로 검색하고 nprobe에 따른 재현율·비용 재기

**서술형**

- `d1` IVF 인덱스에서 $n_\text{probe}$를 늘리면 재현율과 비용이 각각 어떻게 변하는지 쓰라. 필터를 통과하는 문서가 2%일 때 상위 100개를 뽑은 뒤 거르는 사후 필터의 문제를 숫자로 설명하고, 대안을 쓰라.
- `d2` 1차 검색과 재순위화로 나눈 2단계 검색을 설계하라. bi-encoder와 cross-encoder의 차이와 비용, 각 단계를 평가하는 지표, 1차 후보 수를 너무 작게 정하면 생기는 문제를 쓰라.

**참고 자료**

- [FAISS — Guidelines to choose an index](https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index) — 규모와 메모리에 따른 인덱스 선택, IVF 칸 수의 근거 (영문)
- [Malkov & Yashunin (2016) — HNSW](https://arxiv.org/abs/1603.09320) — HNSW를 제안한 논문 (영문)
- [Pinecone — Hierarchical Navigable Small Worlds (HNSW)](https://www.pinecone.io/learn/series/faiss/hnsw/) — HNSW의 층 구조를 그림으로 설명한 글 (영문)
- [Nogueira & Cho (2019) — Passage Re-ranking with BERT](https://arxiv.org/abs/1901.04085) — BERT cross-encoder로 재순위화 성능을 크게 높인 논문 (영문)

<a id="lesson-tool-use"></a>

### 11. 도구 호출 구현: 스키마, 인자 검증, 안전한 도구

보충 · 45분 · [본문 원본](../../src/content/modules/llm-systems/tool-use.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/tool-use.ts)

**학습 목표:** 도구를 이름, 설명, JSON 스키마로 정의하고, 모델이 만든 인자를 실행 전에 검증해 오류를 관찰로 돌려주며, 제약 디코딩이 보장하는 것과 보이지 않게 하는 것을 확률 재정규화로 설명하고, eval 없이 위험 등급에 맞게 도구를 안전하게 구현한다.

**쓰이는 곳:** LLM API의 도구 호출과 구조화 출력은 에이전트와 자동화 파이프라인의 기본 구성 요소다. 모델이 만든 인자를 그대로 실행하면 잘못된 호출이나 보안 사고로 이어지므로, 도구를 정의하고 검증하며 안전하게 구현하는 방법을 알아야 한다.

**본문 절:** 도구 정의: 이름 · 설명 · 입력 스키마 · 인자는 믿을 수 없는 입력이다 · 제약 디코딩: 형식을 구조로 보장하기 · 도구를 안전하게 구현하기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 2 · 코드 셀 2 · 그림 3

**실습**

- `ex1` 도구 인자를 JSON 스키마로 검증하고, 제약 디코딩으로 확률 재정규화하기
- `ex2` eval 없는 계산기, 도구 허용 목록, 사람 승인

**서술형**

- `d1` 제약 디코딩이 보장하는 것과 보장하지 못하는 것을 쓰고, 열거형 스키마에 "모름" 같은 선택지를 넣어야 하는 이유를 확률 재정규화로 설명하라.

**참고 자료**

- [Anthropic — Tool use with Claude](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — 도구 정의와 tool_use, tool_result 블록의 흐름 (영문)
- [OpenAI — Function calling](https://platform.openai.com/docs/guides/function-calling) — OpenAI API의 도구 호출과 구조화 출력 (영문)
- [Tam et al. (2024) — Let Me Speak Freely? Format Restrictions and LLM Performance](https://arxiv.org/abs/2408.02442) — 엄격한 형식 강제가 추론 성능에 미치는 영향을 측정한 논문 (영문)
- [JSON Schema — Understanding JSON Schema](https://json-schema.org/understanding-json-schema) — type, required, enum, minimum 등 스키마 키워드 설명 (영문)

<a id="lesson-llmops"></a>

### 12. LLM 운영의 특성

보충 · 45분 · [본문 원본](../../src/content/modules/llm-systems/llmops.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/llmops.ts)

**학습 목표:** LLM API와 로컬 LLM의 트레이드오프, 서빙 도구(Transformers·vLLM·Ollama)의 위치, 프롬프트 관리·토큰 비용·상시 평가·관측 가능성·가드레일·rate limiting을 설명하고 간단히 구현할 수 있다.

**쓰이는 곳:** LLM 응용은 API 비용, 데이터 유출 위험, 프롬프트 변경에 따른 품질 변화처럼 일반 모델의 운영에는 없던 문제를 함께 관리해야 한다. 외부 API와 자체 호스팅 중 무엇을 쓸지, 비용과 요청량을 어떻게 제한할지, 입력과 출력을 어떻게 검사할지를 정할 때 이 레슨의 내용을 쓴다.

**본문 절:** LLM API와 자체 호스팅 · 서빙 도구: Hugging Face Transformers, vLLM, Ollama · 프롬프트 관리 · 토큰 사용량과 비용 추적 · 운영 중의 평가 · 관측 가능성 · 가드레일 · 요청량 제한

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 5

**실습**

- `ex1` RAG 토큰 비용, 토큰 버킷 속도 제한, 개인정보 가드레일

**서술형**

- `d1` LLM API 방식과 자체 호스팅 방식을 비용, 데이터 보호, 지연시간, 통제 범위로 비교하고, 어떤 조건에서 각 방식을 고르는지 쓰라.
- `d2` LLM API의 토큰 기반 비용 계산 방식을 쓰고 RAG가 비용에 미치는 영향을 설명하라. 가드레일이 하는 일과 가드레일만으로는 부족한 이유도 쓰라.

**참고 자료**

- [vLLM 문서](https://docs.vllm.ai/) — PagedAttention 기반 LLM 서빙 엔진의 문서 (영문)
- [Ollama](https://ollama.com/) — 개인 컴퓨터에서 공개 LLM을 실행하는 도구 (영문)
- [Chip Huyen — Building A Generative AI Platform](https://huyenchip.com/2024/07/25/genai-platform.html) — 가드레일, 캐시, 라우터, 관측 가능성 등 LLM 서비스의 구성 요소를 정리한 글 (영문)

<a id="lesson-transformer-params"></a>

### 13. 트랜스포머의 크기 계산

보충 · 30분 · [본문 원본](../../src/content/modules/llm-systems/transformer-params.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/transformer-params.ts)

**학습 목표:** 디코더 블록의 파라미터가 약 $12d^2$인 이유를 구성 요소별로 계산하고, 토큰당 연산량 $2N$·학습 연산량 $6ND$, 추론 가중치·학습 상태·KV 캐시의 메모리를 계산한다.

**쓰이는 곳:** 모델 카드의 파라미터 수와 학습 토큰 수만으로 학습 비용, 추론에 필요한 GPU 메모리, 긴 문맥에서의 KV 캐시 크기를 어림할 수 있어야 모델과 하드웨어를 고를 수 있다. 스케일링 법칙의 $C \approx 6ND$와 서빙 비용의 메모리 계산도 이 레슨의 계산에서 나온다.

**본문 절:** 블록 하나의 파라미터: 약 $12d^2$ · 연산량: 토큰당 약 $2N$, 학습은 약 $6N$ · 메모리: 가중치·학습 상태·KV 캐시

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` GPT형 모델의 파라미터·연산량·메모리 계산기

**서술형**

- `d1` 은닉 차원 $d$인 디코더 블록 하나의 파라미터가 약 $12d^2$인 이유를 구성 요소별로 설명하라. 파라미터 $N$인 모델이 토큰당 약 $2N$ FLOPs(학습은 약 $6N$)를 쓰는 이유와, 혼합 정밀도 Adam 학습에 파라미터당 약 16바이트가 드는 이유도 쓰라.

**참고 자료**

- [Kaplan et al. (2020) — Scaling Laws for Neural Language Models, 2.1절](https://arxiv.org/abs/2001.08361) — 파라미터 수와 FLOPs 계산의 표준 근사 (영문)
- [EleutherAI — Transformer Math 101](https://blog.eleuther.ai/transformer-math/) — 학습 메모리와 연산량 계산 정리 (영문)

## 심화 레슨

<a id="lesson-contrastive-learning"></a>

### 14. 대조 학습의 수학: InfoNCE, 온도, 배치 크기

심화 · 35분 · [본문 원본](../../src/content/modules/llm-systems/contrastive-learning.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/contrastive-learning.ts)

**학습 목표:** InfoNCE를 $N$지선다 cross-entropy로 쓰고, 초기 손실 $\ln N$, 로짓 기울기 $P - I$와 벡터에 대한 기울기의 방향, 온도가 어려운 오답에 대한 기울기의 집중도를 조절하는 원리, 배치 크기와 상호정보량 하한 $\ln N - \mathcal{L}$의 관계를 유도한다.

**쓰이는 곳:** 검색에 쓰는 텍스트 임베딩 모델과 CLIP 같은 이미지-텍스트 모델은 대조 학습으로 학습한다. 배치 크기, 온도, 어려운 오답을 어떻게 정하는지에 따라 임베딩의 품질이 달라지므로, 이 설정을 판단하려면 InfoNCE 손실과 그 기울기를 알아야 한다.

**본문 절:** 대조 손실은 $N$지선다 분류다 · 기울기: 정답의 유사도는 높이고, 오답의 유사도는 확률만큼 낮춘다 · 온도: 어려운 오답에 얼마나 집중할 것인가 · 배치 크기와 정보량의 상한 · 같은 손실로 학습하는 검색 임베딩

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 작은 CLIP의 대칭 대조 손실과 기울기

**서술형**

- `d1` InfoNCE 손실이 학습 전에 $\ln N$에서 출발하는 이유와, 그 기울기가 어려운 오답(hard negative)에 집중하는 이유를 설명하라. 온도 $\tau$를 낮추면 무엇이 달라지는가?

**참고 자료**

- [Oord et al. (2018) — Representation Learning with Contrastive Predictive Coding](https://arxiv.org/abs/1807.03748) — InfoNCE 손실과 상호정보량 하한을 제시한 논문 (영문)
- [Karpukhin et al. (2020) — Dense Passage Retrieval](https://arxiv.org/abs/2004.04906) — in-batch negatives와 BM25의 어려운 오답으로 검색 임베딩을 학습한 논문 (영문)
- [Wang & Liu (2021) — Understanding the Behaviour of Contrastive Loss](https://arxiv.org/abs/2012.09740) — 온도가 어려운 오답에 대한 벌점을 조절한다는 분석 (영문)
- [Poole et al. (2019) — On Variational Bounds of Mutual Information](https://arxiv.org/abs/1905.06922) — InfoNCE 하한이 $\ln N$을 넘지 못하는 이유와 다른 추정량의 비교 (영문)

<a id="lesson-eval-statistics"></a>

### 15. LLM 평가의 통계

심화 · 35분 · [본문 원본](../../src/content/modules/llm-systems/eval-statistics.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/eval-statistics.ts)

**학습 목표:** 윌슨 구간으로 작은 골든셋 정확도의 불확실성과 필요한 문항 수를 구하고, McNemar 검정과 짝지은 부트스트랩으로 같은 문항에서 두 시스템을 비교하며, 선택 편향을 피하는 골든셋 분할과 Rogan–Gladen 채점관 보정을 적용할 수 있다.

**쓰이는 곳:** LLM 평가는 문항이 수십 개뿐인 경우가 많아, 점수의 작은 차이가 실제 개선인지 우연인지 구별하기 어렵다. 프롬프트나 설정을 바꾼 결과를 보고하거나 LLM 채점관의 점수로 정확도를 추정할 때, 이 레슨의 구간 추정과 짝지은 비교로 결론의 신뢰도를 판단한다.

**본문 절:** 정확도 하나의 불확실성: 윌슨 구간 · 두 시스템 비교: 같은 문항이면 짝지어 본다 · 여러 설정 중 최고를 고를 때 · 채점관을 보정하기 · 코드로 한 번에

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 윌슨 구간, 필요한 문항 수, 짝지은 부트스트랩, 채점관 보정

**서술형**

- `d1` 골든셋 20문항에서 v1 15개, v2 17개를 맞혔고 엇갈린 문항은 v2만 맞힌 4개, v1만 맞힌 2개다. McNemar 검정의 원리와 결론을 설명하고, 작은 개선을 확인하려면 무엇이 필요한지 쓰라.

**참고 자료**

- [Miller (2024) — Adding Error Bars to Evals](https://arxiv.org/abs/2411.00640) — LLM 평가에 표준오차, 짝지은 비교, 반복 샘플링을 적용하는 방법 (영문)
- [Wikipedia — Binomial proportion confidence interval](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval) — 정규 근사(Wald)와 윌슨 구간의 비교 (영문)
- [Wikipedia — McNemar's test](https://en.wikipedia.org/wiki/McNemar%27s_test) — 짝지은 이진 결과의 검정과 정확 이항 버전 (영문)

<a id="lesson-injection-defense"></a>

### 16. 프롬프트 인젝션의 설계 수준 방어

심화 · 40분 · [본문 원본](../../src/content/modules/llm-systems/injection-defense.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/injection-defense.ts)

**학습 목표:** 프롬프트 수준의 방어가 보장이 될 수 없는 이유를 SQL 인젝션과 비교해 설명하고, 치명적 3요소로 위협을 모델링하며, 계획 후 실행, 이중 LLM, 정보 흐름 통제(출처 꼬리표의 전파와 도구 호출 직전의 정책 검사)로 모델이 숨은 지시를 따르더라도 유출이 일어나지 않는 에이전트를 설계한다.

**쓰이는 곳:** 메일, 문서, 웹페이지를 읽고 도구를 호출하는 에이전트는 외부 콘텐츠에 숨은 지시로 개인 데이터를 유출할 수 있다. 확률을 낮추는 방어만으로는 보장할 수 없으므로, 이런 에이전트를 서비스에 넣으려면 모델의 출력과 관계없이 유출을 막는 구조를 설계해야 한다.

**본문 절:** 왜 프롬프트로는 완전히 막을 수 없는가 · 위협 모델: 치명적 3요소 · 모델이 숨은 지시를 따라도 피해가 없게 하는 설계 패턴 · 출처 꼬리표의 전파

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 4

**실습**

- `ex1` 출처 꼬리표 전파와 정책 검사로 유출을 결정적으로 막기

**서술형**

- `d1` 프롬프트 수준의 방어(구분자, '문서 속 지시를 무시하라', 탐지 분류기)가 보장이 될 수 없는 이유를 SQL 인젝션과 비교해 설명하고, 정보 흐름 통제가 모델이 숨은 지시를 따르더라도 유출을 막을 수 있는 이유를 쓰라.
- `d2` 메일함을 읽고, 연락처를 조회하고, 메일을 보낼 수 있는 비서 에이전트를 설계하려 한다. 치명적 3요소로 위험을 설명하고, 이 에이전트를 안전하게 만드는 설계를 두 가지 이상 제안하되 각 설계가 무엇을 보장하고 무엇을 포기하는지 쓰라.

**참고 자료**

- [Simon Willison (2025) — The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) — 개인 데이터, 신뢰하지 않는 콘텐츠, 외부 경로의 조합을 정리한 글 (영문)
- [Debenedetti et al. (2025) — Defeating Prompt Injections by Design (CaMeL)](https://arxiv.org/abs/2503.18813) — 출처 꼬리표와 정책 검사로 인젝션을 설계 수준에서 막는 방법 (영문)
- [Beurer-Kellner et al. (2025) — Design Patterns for Securing LLM Agents against Prompt Injections](https://arxiv.org/abs/2506.08837) — 계획 후 실행, 이중 LLM 등 여섯 가지 패턴과 그 대가 (영문)
- [Debenedetti et al. (2024) — AgentDojo](https://arxiv.org/abs/2406.13352) — 도구를 쓰는 에이전트의 인젝션 공격과 방어를 측정하는 벤치마크 (영문)

<a id="lesson-speculative-decoding"></a>

### 17. 투기적 디코딩

심화 · 35분 · [본문 원본](../../src/content/modules/llm-systems/speculative-decoding.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/speculative-decoding.ts)

**학습 목표:** 투기적 샘플링의 수락-거절 규칙이 목표 분포를 정확히 보존함을 증명하고, 수락률 $\alpha = \sum\min(p, q)$와 초안 길이·초안 비용에 따른 기대 속도 향상을 계산하며, 이득이 줄어드는 조건을 설명할 수 있다.

**쓰이는 곳:** LLM의 생성 속도는 응답 지연시간과 서빙 비용을 정한다. 투기적 디코딩은 출력 분포를 바꾸지 않고 생성 속도를 높이는 방법으로 여러 서빙 엔진이 지원하므로, 어떤 조건에서 이득이 있고 초안 모델을 어떻게 고를지 판단하려면 수락 규칙과 기대 속도를 계산할 수 있어야 한다.

**본문 절:** 수락-거절 규칙과 그 증명 · 초안 $k$개와 기대 속도 · 시뮬레이션으로 확인하기

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 투기적 디코딩의 출력 분포와 최적 초안 길이

**서술형**

- `d1` 투기적 디코딩의 수락-거절 규칙(수락 확률 $\min(1, p/q)$, 거절 시 $(p-q)_+$에서 다시 뽑기)이 출력 분포를 정확히 $p$로 만드는 이유를 보이고, 수락률 $\alpha$와 초안 길이 $k$에 따른 큰 모델 호출당 기대 토큰 수를 쓰라.
- `d2` 70B 모델로 코드 자동완성 서비스를 운영하는 팀이 지연시간을 줄이려고 1B 모델을 초안으로 쓰는 투기적 디코딩을 검토합니다. "초안 모델이 작으니 품질이 떨어질 것"이라는 우려에 답하고, 이득을 결정하는 요인과 이득이 줄어드는 조건, 도입 전에 측정할 것을 제안하라.

**참고 자료**

- [Leviathan et al. (2023) — Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — 투기적 디코딩을 제안한 논문 (영문)
- [Chen et al. (2023) — Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) — 수락-거절 규칙의 증명 (영문)
- [Cai et al. (2024) — Medusa](https://arxiv.org/abs/2401.10774) — 여러 토큰을 예측하는 출력층을 추가한 변형 (영문)

<a id="lesson-drift-statistics"></a>

### 18. 드리프트 감지의 통계

심화 · 40분 · [본문 원본](../../src/content/modules/llm-systems/drift-statistics.ts) · [실습 원본](../../src/content/modules/llm-systems/labs/drift-statistics.ts)

**학습 목표:** PSI가 양방향 KL 발산의 합임을 증명하고, 드리프트가 없을 때의 기댓값 $(B-1)(1/n + 1/m)$으로 작은 표본의 거짓 경보를 설명하며, 다중 검사의 경보 확률을 보정하고, BBSE로 라벨 없이 라벨 드리프트를 추정할 수 있다.

**쓰이는 곳:** 드리프트 경보가 자주 틀리면 운영자가 경보를 무시하게 되고, 경보가 없으면 성능 저하를 늦게 발견한다. 운영 표본의 크기와 검사하는 특성의 수에 맞게 경보 기준을 정하고, 정답 라벨이 늦게 들어오는 서비스에서 성능 저하를 추정하려면 이 레슨의 통계가 필요하다.

**본문 절:** PSI는 양방향 KL 발산의 합이다 · 바뀐 것이 없어도 PSI는 0이 아니다 · 검사가 많으면 경보도 많다 · 라벨 드리프트를 라벨 없이 추정하기 · 코드로 확인하기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 4

**실습**

- `ex1` PSI = 양방향 KL, 드리프트 없을 때의 PSI, 다중 검사, BBSE

**서술형**

- `d1` 드리프트가 전혀 없는데도 PSI가 0.1을 넘을 수 있는 이유를 설명하고, 운영 데이터의 라벨 없이 양성 비율의 변화를 추정하는 방법(BBSE)을 이진 분류의 식으로 쓰라.
- `d2` 특성 30개를 쓰는 신용평가 모델의 드리프트 경보를 설계하라. 운영 표본은 한 시간에 200건씩 들어온다. PSI 기준 0.1을 그대로 쓸 때의 문제, 다중 검사 문제, 라벨이 몇 달 뒤에야 들어오는 상황에서 성능 저하를 추정하는 방법을 포함하라.

**참고 자료**

- [Lipton, Wang & Smola (2018) — Detecting and Correcting for Label Shift with Black Box Predictors](https://arxiv.org/abs/1802.03916) — BBSE를 제안한 논문 (영문)
- [Rabanser, Günnemann & Lipton (2019) — Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift](https://arxiv.org/abs/1810.11953) — 차원 축소, 두 표본 검정, 다중 검사 보정을 비교한 드리프트 감지 연구 (영문)
- [Benjamini & Hochberg (1995) — Controlling the False Discovery Rate](https://www.jstor.org/stable/2346101) — 다중 검사에서 거짓 발견 비율을 통제하는 방법 (영문)

## 백지 복습

1. RAG를 색인 단계와 질의 단계로 나눠 쓰고, 답이 틀렸을 때 검색 실패와 생성 실패를 구분하는 순서를 쓰라.
2. Dense 검색과 Sparse 검색(BM25)의 매칭 기준 차이를 쓰고, RRF가 점수 대신 순위로 결과를 합치는 이유를 쓰라. 질문 4개의 정답 순위가 $[1, 2, 4, \text{없음}]$일 때 MRR도 계산하라.
3. ReAct 루프의 관찰, 추론, 행동을 쓰고, max_steps, 최소 권한, 사람 승인이 각각 막는 문제를 쓰라.
4. LLM이 사실이 아닌 내용을 생성하는 이유를 사전학습의 목적함수와 평가 방식으로 쓰고, LLM 채점관을 검증할 때 일치율 대신 Cohen's κ를 보는 이유를 쓰라.
5. TTFT 0.5초, 초당 40토큰일 때 400토큰 응답을 받는 시간을 계산하고, 배치를 키울 때 처리량과 지연시간이 어떻게 변하는지 쓰라. 데이터 드리프트와 개념 드리프트의 차이도 쓰라.

## 과제: 스터디 QA 봇과 평가 리포트

저장 키 `rag-qa-bot` · 자기 점검 · [과제 원본](../../src/content/modules/llm-systems/assignment.ts)

이 과정의 학습 자료(모듈마다 문서 하나)를 문서 집합으로 삼아 RAG 방식의 QA 봇을 만들고 체계적으로 평가합니다. 브라우저에서는 임베딩 모델과 LLM을 내려받을 수 없으므로 두 구성 요소를 다른 방법으로 대신합니다. 검색은 신경망 임베딩 대신 **TF-IDF(문자 n-gram) 벡터**로, 답변은 LLM 생성 대신 검색된 조각에서 질문과 가장 비슷한 문장을 그대로 골라 오는 **추출형**으로 합니다. 즉 청킹 → 색인 → 검색 → 근거 선택 → 거절 판단까지는 실제 RAG와 같고, 마지막의 LLM 생성 단계만 빠져 있습니다. 그래서 이 과제의 평가는 주로 **검색 품질**과 **근거 선택·거절**을 재는 것이며, 생성 단계에서 생기는 실패(근거 무시, 오독)는 실패 분석에서 "LLM이었다면"을 가정해 논의합니다.

직접 만든 골든셋 20문항으로 검색·답변·거절 성능을 재고, 실패 원인을 분석해 개선합니다. 하이브리드 검색은 보충 항목에서, 신경망 임베딩 검색은 Colab에서 비교해 볼 수 있습니다.

**핵심** 항목 여섯 개는 이 모듈의 핵심 레슨으로 풀 수 있고, 채점 기준도 이 여섯 항목만 봅니다. **보충**(하이브리드 검색)과 **심화**(평가의 통계·채점관 보정·인젝션 방어 설계) 항목은 선택이며 점수 대신 피드백을 받습니다.

### 요구사항

- 첫 셀(RAG 파이프라인)을 실행해 모듈별 학습 자료 문서가 색인되는 것을 확인하고, 예시 질문 3개의 답·출처·최고 유사도를 읽는다(자료에 없는 질문이 실제로 거절되는지도 본다).
- 골든셋 20문항(쉬운 질문 10개, 어려운 질문 10개, 자료에 없는 질문 3개 이상)을 만들고, 근거 표현이 실제 문서에 들어 있는지 확인한다.
- 청크 크기(200/500/1000자)와 k(1/3/5)의 모든 조합에서 Recall@k · MRR · 정확도를 표로 비교하고, 가장 좋은 설정의 답변 5개 이상에 근거 충실도 점수를 매긴다.
- 유사도 문턱값별 올바른 거절률과 잘못된 거절률을 비교해 문턱값을 고르고 근거를 적는다.
- 실패 사례 5건의 원인을 분류해 개선안을 제시하고, 숨은 지시를 넣은 문서로 인젝션 테스트를 한 뒤 방어책을 적는다.
- 사용자 시나리오 질문 3개로 봇을 써 보고, 설정 하나를 고쳐 개선 전후를 비교한다.
- (보충) 단어 단위 TF-IDF를 더한 RRF 하이브리드 검색을 글자 검색과 비교하고, 좋아지거나 나빠진 이유를 설명한 뒤 개선 하나(가중 RRF·조사 떼기·$k$)를 시도한다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| RAG 파이프라인 구성 | 핵심 | 코드 `rag-code` |
| 골든셋 20문항 만들기 | 핵심 | 코드 `golden-code` |
| 검색·답변 평가와 설정 비교 | 핵심 | 코드 `evaluate-code`, 답안 `evaluate-answer`(최소 300자) |
| 거절 정확도 | 핵심 | 코드 `refusal-code`, 답안 `refusal-answer`(최소 120자) |
| 실패 분석과 프롬프트 인젝션 테스트 | 핵심 | 코드 `failure-code`, 답안 `failure-answer`(최소 400자) |
| 사용자 시나리오 테스트와 개선 | 핵심 | 코드 `scenario-code`, 답안 `scenario-answer`(최소 200자) |
| 보충: 하이브리드 검색(RRF)은 항상 이기는가 | 보충 | 코드 `hybrid-code`, 답안 `hybrid-answer`(최소 150자) |
| 심화: 평가의 통계 · 채점관 보정 · 인젝션 방어 설계 | 심화 | 코드 `advanced-code`, 답안 `advanced-answer` |

### 채점 기준

| 기준 | 배점 | 확인 내용 |
| --- | ---: | --- |
| 골든셋의 질 | 2 | 난이도와 유형이 다양하고, 근거 문서와 핵심 표현을 정확히 표시했습니다. |
| 실험 설계와 지표 | 3 | Recall@k·MRR·정확도·거절 정확도를 설정별로 비교하고 결과를 해석했습니다. |
| 실패 분석과 개선 효과 | 2 | 실패 원인을 근거 있게 분류하고, 인젝션 위험과 방어책을 제시했습니다. |
| 사용자 시나리오와 개선 반영 | 2 | 실제 사용자 관점의 질문으로 문제를 찾고, 개선 전후를 비교했습니다. |
| 재현성과 문서화 | 1 | 모든 셀이 처음부터 순서대로 실행되고, 결과 표와 설명이 정리되어 있습니다. |

### 자동 테스트

- `rag`: RAG 파이프라인: 모듈별 문서 색인, 유사도순 검색, 근거 출처, 문턱값 거절
- `golden`: 골든셋: 20문항 이상, 쉬움·어려움 각 10개 이상, 자료에 없는 질문 3개 이상, 근거 표현이 문서에 있음
- `evaluate`: 평가: 세 청크 크기를 색인했고, Recall@k는 k에 따라 줄지 않으며 MRR ≤ Recall@k
- `scenario`: 시나리오: 질문 3개 이상, 개선 후(after) 설정이 개선 전(before)과 다름
- `hybrid`: 보충 · 하이브리드: 두 검색기의 순위로 RRF 점수를 더해 상위 조각을 고른다

### 선택 심화 문제

- `ch1` 골든셋으로 단어·글자·하이브리드 검색기 비교하기
- `ch2` 20문항의 0.10 차이는 믿을 만한가: McNemar 검정과 배포 게이트
