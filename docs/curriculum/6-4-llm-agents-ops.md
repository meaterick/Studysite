<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 6-4 에이전트와 운영

[전체 목차](README.md) · 트랙 6 생성형 AI와 언어 모델 · [모듈 원본](../../src/content/modules/llm-agents-ops/index.ts)

도구 호출과 에이전트 루프, 에이전트 설계와 안전, 서빙 비용, 운영 모니터링

## 목표 문제

LLM이 답을 쓰는 데서 그치지 않고 도구를 호출해 작업을 수행하면, 잘못된 호출 하나가 메일 발송이나 데이터 삭제 같은 실제 결과로 이어진다. 서비스로 운영하면 응답 시간과 GPU 메모리가 비용을 정하고, 입력이 바뀌면 성능이 조용히 떨어진다. 이 모듈은 도구를 호출하는 에이전트를 만들고 안전하게 운영하는 방법을 다룬다. ReAct 루프로 에이전트를 구현해 최대 스텝 수, 최소 권한, 사람 승인을 적용하고, 메모리와 다중 에이전트, 간접 프롬프트 인젝션에 대한 다층 방어를 설계한다. 지연시간과 메모리로 서빙 비용을 계산하고, 배포 전략과 드리프트를 감지하는 운영 지표를 설계한다. 앞 모듈의 검색([6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval))과 평가([6-3 LLM 평가와 안전성 평가](6-3-llm-systems.md#lesson-llm-evaluation))를 바탕으로 한다.

## 학습 목표

- ReAct 루프로 도구를 호출하는 에이전트를 구현하고, 최대 스텝 수, 오류의 관찰 기록, 최소 권한, 사람 승인을 적용한다.
- 단기·장기 메모리와 다중 에이전트의 역할을 설명하고, 간접 프롬프트 인젝션에 데이터와 지시의 분리, 최소 권한, 사람 승인을 겹쳐 적용한다.
- 지연시간, 처리량, 추론 메모리를 계산하고, 배포 전략과 드리프트 지표로 운영 모니터링을 설계한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [도구 호출과 에이전트 루프](#lesson-agents) | 핵심 | 35분 | #77 벡터 검색, RAG, 도구 호출, 에이전트 |
| 2 | [에이전트 설계와 안전](#lesson-agent-design) | 핵심 | 40분 | #77 벡터 검색, RAG, 도구 호출, 에이전트 |
| 3 | [모델 서빙과 추론 비용](#lesson-serving-cost) | 핵심 | 40분 | #78 환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링 |
| 4 | [운영 모니터링](#lesson-monitoring) | 핵심 | 45분 | #78 환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링 |
| 5 | [도구 호출 구현: 스키마, 인자 검증, 안전한 도구](#lesson-tool-use) | 보충 | 45분 | — |
| 6 | [LLM 운영의 특성](#lesson-llmops) | 보충 | 45분 | — |
| 7 | [트랜스포머의 크기 계산](#lesson-transformer-params) | 보충 | 30분 | — |
| 8 | [프롬프트 인젝션의 설계 수준 방어](#lesson-injection-defense) | 심화 | 40분 | — |
| 9 | [투기적 디코딩](#lesson-speculative-decoding) | 심화 | 35분 | — |
| 10 | [드리프트 감지의 통계](#lesson-drift-statistics) | 심화 | 40분 | — |

## 핵심 레슨

<a id="lesson-agents"></a>

### 1. 도구 호출과 에이전트 루프

핵심 · 35분 · [본문 원본](../../src/content/modules/llm-agents-ops/agents.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/agents.ts)

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

### 2. 에이전트 설계와 안전

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-agents-ops/agent-design.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/agent-design.ts)

**학습 목표:** 단기 메모리(최근 이력 유지)와 장기 메모리(저장 정보 검색), 플래너·실행자로 나눈 다중 에이전트, MCP의 역할을 설명하고, 간접 프롬프트 인젝션에 데이터와 지시의 분리, 최소 권한, 사람 승인을 겹쳐 적용한다.

**쓰이는 곳:** 에이전트가 메일 발송, 파일 수정, 결제 같은 실제 행동을 할 수 있으면 모델의 오류나 외부 문서에 숨은 지시가 곧바로 피해로 이어진다. 에이전트를 서비스에 넣으려면 어떤 정보를 저장하고 어떤 도구와 권한을 줄지, 어떤 행동에 사람의 승인을 받을지를 코드로 설계해야 한다.

**본문 절:** 단기 메모리와 장기 메모리 · 다중 에이전트와 MCP · 최소 권한과 사람 승인 · 간접 프롬프트 인젝션의 다층 방어

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 4

**실습**

- `ex1` 단기 기억 자르기와 장기 기억 검색으로 컨텍스트 조립하기

**서술형**

- `d1` 에이전트의 단기 메모리와 장기 메모리가 각각 어디에 있고 언제 사라지거나 유지되는지 쓰고, 장기 메모리에서 지금 질문과 관련 없는 기억을 넣지 않는 이유를 쓰라.
- `d2` 도구를 쓰는 에이전트가 웹 문서에 숨은 지시에 따라 메일을 보내려 한다. 방어를 여러 단계로 겹쳐 두어야 하는 이유를 쓰고, 데이터 표시, 최소 권한, 사람 승인이 각각 어느 지점을 막는지 쓰라.

**참고 자료**

- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/introduction) — MCP의 클라이언트·서버 구조와 예제 (영문)
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) — 프롬프트 인젝션, 과도한 권한(Excessive Agency) 등 LLM 응용의 대표적인 보안 위험 (영문)
- [Greshake et al. (2023) — Not what you've signed up for: Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) — 간접 프롬프트 인젝션을 체계적으로 분석한 논문 (영문)

<a id="lesson-serving-cost"></a>

### 3. 모델 서빙과 추론 비용

핵심 · 40분 · [본문 원본](../../src/content/modules/llm-agents-ops/serving-cost.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/serving-cost.ts)

**학습 목표:** LLM 서빙의 지연시간(TTFT, 토큰당 시간)과 처리량을 구분해 계산하고, 배치 크기가 둘에 미치는 영향과 추론 메모리를 계산하며, 양자화와 지식 증류가 비용을 줄이는 원리와 대가를 설명한다.

**쓰이는 곳:** LLM 응용의 운영 비용은 대부분 추론에서 생기고, 사용자가 체감하는 품질도 응답 속도에 영향을 받는다. 모델과 GPU를 고르고 배치 크기나 양자화 같은 설정을 정하려면 지연시간, 처리량, 메모리를 계산할 수 있어야 하며, 이 값들은 [6-4 운영 모니터링](#lesson-monitoring)에서 운영 지표로 추적한다.

**본문 절:** 지연시간과 처리량 · 배치와 메모리 대역폭 · 모델 크기와 추론 메모리 · 양자화 · 지식 증류 · 추론 비용을 줄이는 방법

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 3

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

### 4. 운영 모니터링

핵심 · 45분 · [본문 원본](../../src/content/modules/llm-agents-ops/monitoring.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/monitoring.ts)

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

<a id="lesson-tool-use"></a>

### 5. 도구 호출 구현: 스키마, 인자 검증, 안전한 도구

보충 · 45분 · [본문 원본](../../src/content/modules/llm-agents-ops/tool-use.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/tool-use.ts)

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

### 6. LLM 운영의 특성

보충 · 45분 · [본문 원본](../../src/content/modules/llm-agents-ops/llmops.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/llmops.ts)

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

### 7. 트랜스포머의 크기 계산

보충 · 30분 · [본문 원본](../../src/content/modules/llm-agents-ops/transformer-params.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/transformer-params.ts)

**학습 목표:** 디코더 블록의 파라미터가 약 $12d^2$인 이유를 구성 요소별로 계산하고, 토큰당 연산량 $2N$·학습 연산량 $6ND$, 추론 가중치·학습 상태·KV 캐시의 메모리를 계산한다.

**쓰이는 곳:** 모델카드의 파라미터 수와 학습 토큰 수만으로 학습 비용, 추론에 필요한 GPU 메모리, 긴 문맥에서의 KV 캐시 크기를 어림할 수 있어야 모델과 하드웨어를 고를 수 있다. 스케일링 법칙의 $C \approx 6ND$와 서빙 비용의 메모리 계산도 이 레슨의 계산에서 나온다.

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

<a id="lesson-injection-defense"></a>

### 8. 프롬프트 인젝션의 설계 수준 방어

심화 · 40분 · [본문 원본](../../src/content/modules/llm-agents-ops/injection-defense.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/injection-defense.ts)

**학습 목표:** 프롬프트 수준의 방어가 보장이 될 수 없는 이유를 SQL 인젝션과 비교해 설명하고, 치명적 3요소로 위협을 모델링하며, 계획 후 실행, 이중 LLM, 정보 흐름 통제(출처 표지의 전파와 도구 호출 직전의 정책 검사)로 모델이 숨은 지시를 따르더라도 유출이 일어나지 않는 에이전트를 설계한다.

**쓰이는 곳:** 메일, 문서, 웹페이지를 읽고 도구를 호출하는 에이전트는 외부 콘텐츠에 숨은 지시로 개인 데이터를 유출할 수 있다. 확률을 낮추는 방어만으로는 보장할 수 없으므로, 이런 에이전트를 서비스에 넣으려면 모델의 출력과 관계없이 유출을 막는 구조를 설계해야 한다.

**본문 절:** 왜 프롬프트로는 완전히 막을 수 없는가 · 위협 모델: 치명적 3요소 · 모델이 숨은 지시를 따라도 피해가 없게 하는 설계 패턴 · 출처 표지의 전파

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 4

**실습**

- `ex1` 출처 표지 전파와 정책 검사로 유출을 결정적으로 막기

**서술형**

- `d1` 프롬프트 수준의 방어(구분자, '문서 속 지시를 무시하라', 탐지 분류기)가 보장이 될 수 없는 이유를 SQL 인젝션과 비교해 설명하고, 정보 흐름 통제가 모델이 숨은 지시를 따르더라도 유출을 막을 수 있는 이유를 쓰라.
- `d2` 메일함을 읽고, 연락처를 조회하고, 메일을 보낼 수 있는 비서 에이전트를 설계하려 한다. 치명적 3요소로 위험을 설명하고, 이 에이전트를 안전하게 만드는 설계를 두 가지 이상 제안하되 각 설계가 무엇을 보장하고 무엇을 포기하는지 쓰라.

**참고 자료**

- [Simon Willison (2025) — The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) — 개인 데이터, 신뢰하지 않는 콘텐츠, 외부 경로의 조합을 정리한 글 (영문)
- [Debenedetti et al. (2025) — Defeating Prompt Injections by Design (CaMeL)](https://arxiv.org/abs/2503.18813) — 출처 표지와 정책 검사로 인젝션을 설계 수준에서 막는 방법 (영문)
- [Beurer-Kellner et al. (2025) — Design Patterns for Securing LLM Agents against Prompt Injections](https://arxiv.org/abs/2506.08837) — 계획 후 실행, 이중 LLM 등 여섯 가지 패턴과 그 대가 (영문)
- [Debenedetti et al. (2024) — AgentDojo](https://arxiv.org/abs/2406.13352) — 도구를 쓰는 에이전트의 인젝션 공격과 방어를 측정하는 벤치마크 (영문)

<a id="lesson-speculative-decoding"></a>

### 9. 투기적 디코딩

심화 · 35분 · [본문 원본](../../src/content/modules/llm-agents-ops/speculative-decoding.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/speculative-decoding.ts)

**학습 목표:** 투기적 샘플링의 수락-거절 규칙이 목표 분포를 정확히 보존함을 증명하고, 수락률 $\alpha = \sum\min(p, q)$와 초안 길이·초안 비용에 따른 기대 속도 향상을 계산하며, 이득이 줄어드는 조건을 설명할 수 있다.

**쓰이는 곳:** LLM의 생성 속도는 응답 지연시간과 서빙 비용을 정한다. 투기적 디코딩은 출력 분포를 바꾸지 않고 생성 속도를 높이는 방법으로 여러 서빙 엔진이 지원하므로, 어떤 조건에서 이득이 있고 초안 모델을 어떻게 고를지 판단하려면 수락 규칙과 기대 속도를 계산할 수 있어야 한다.

**본문 절:** 수락-거절 규칙과 그 증명 · 초안 $k$개와 기대 속도 · 시뮬레이션으로 확인하기

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 투기적 디코딩의 출력 분포와 최적 초안 길이

**서술형**

- `d1` 투기적 디코딩의 수락-거절 규칙(수락 확률 $\min(1, p/q)$, 거절 시 $(p-q)_+$에서 다시 뽑기)이 출력 분포를 정확히 $p$로 만드는 이유를 보이고, 수락률 $\alpha$와 초안 길이 $k$에 따른 큰 모델 호출당 기대 토큰 수를 쓰라.
- `d2` 70B 모델로 코드 자동완성 서비스를 운영하는 팀이 지연시간을 줄이려고 1B 모델을 초안으로 쓰는 투기적 디코딩을 검토한다. "초안 모델이 작으니 품질이 떨어질 것"이라는 우려에 답하고, 이득을 결정하는 요인과 이득이 줄어드는 조건, 도입 전에 측정할 것을 제안하라.

**참고 자료**

- [Leviathan et al. (2023) — Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — 투기적 디코딩을 제안한 논문 (영문)
- [Chen et al. (2023) — Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) — 수락-거절 규칙의 증명 (영문)
- [Cai et al. (2024) — Medusa](https://arxiv.org/abs/2401.10774) — 여러 토큰을 예측하는 출력층을 추가한 변형 (영문)

<a id="lesson-drift-statistics"></a>

### 10. 드리프트 감지의 통계

심화 · 40분 · [본문 원본](../../src/content/modules/llm-agents-ops/drift-statistics.ts) · [실습 원본](../../src/content/modules/llm-agents-ops/labs/drift-statistics.ts)

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

1. ReAct 루프의 관찰, 추론, 행동을 쓰고, max_steps, 최소 권한, 사람 승인이 각각 막는 문제를 쓰라.
2. 에이전트의 단기 메모리와 장기 메모리가 각각 무엇을 담고 어떻게 불러오는지 쓰고, 검색한 문서에 숨은 지시가 도구 호출로 이어지는 간접 프롬프트 인젝션을 데이터와 지시의 분리로 막는 방법을 쓰라.
3. TTFT 0.5초, 초당 40토큰일 때 400토큰 응답을 받는 시간을 계산하고, 배치를 키울 때 처리량과 지연시간이 어떻게 변하는지 쓰라. 데이터 드리프트와 개념 드리프트의 차이도 쓰라.
