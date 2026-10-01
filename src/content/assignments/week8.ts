import type { AssignmentSpec } from "../types";

// 8주차 캡스톤: 코드·리포트·모델카드·발표 개요·성찰문을 모두 작업 공간 안에서 작성한다.
// 슬라이드 PDF 같은 추가 자료는 제출할 때 파일로 첨부할 수 있다(선택).
// 핵심: plan·code·report·modelcard·presentation·reflection(채점 대상) / 보충: audit / 심화: advanced
const week8Assignment: AssignmentSpec = {
  title: "캡스톤 프로젝트",
  summary: `
8주 동안 배운 내용을 하나의 프로젝트로 묶습니다. 유형(A 구현형 · B 응용형 · C 분석형 · D 책임형)과 일정은 「핵심 논문 하이라이트와 캡스톤 설계」 단계를 참고합니다. 코드는 이 작업 공간에서 실행하며(NumPy, pandas, scikit-learn, matplotlib 사용 가능), 리포트·모델카드·발표 개요·성찰문도 모두 답안 칸에 작성합니다. 1~8주차 학습 자료는 \`/course/week1.md\` 등의 파일로 읽을 수 있습니다.

제출하기 전에 **실행 환경 초기화** 후 **전체 실행**을 눌러 모든 셀이 처음부터 오류 없이 실행되는지 반드시 확인합니다. 발표 슬라이드를 따로 만들었다면 제출할 때 PDF로 첨부할 수 있습니다.

**핵심** 항목 여섯 개는 핵심 과정만으로 완성할 수 있고 채점 기준도 이 항목들만 봅니다. **보충**(서브그룹 감사와 편향 완화)과 **심화**(불확실성·프라이버시·드리프트 점검) 항목은 선택이며 점수 대신 피드백을 받습니다. 캡스톤의 질을 한 단계 끌어올리고 싶다면 하나라도 시도해 보십시오.
`,
  provideCourseDocs: true,
  tasks: [
    {
      id: "plan",
      tier: "core",
      title: "문제 정의와 설계",
      instructions: `
프로젝트 유형, 풀려는 문제, 검증할 가설, 성공 기준(어떤 지표가 얼마 이상이면 성공인지), 사용할 데이터와 비교 기준(baseline)을 적습니다. 데이터는 scikit-learn 내장 데이터셋, 학습 자료 문서, 또는 코드 셀에 직접 붙여 넣은 작은 표(CSV 문자열) 등 이 작업 공간에서 읽을 수 있는 것을 사용합니다.
`,
      cells: [
        {
          kind: "text",
          id: "plan-answer",
          prompt: "프로젝트 설계를 작성해 주십시오.",
          template: `- 유형: 
- 문제: 
- 가설: 
- 성공 기준: 
- 데이터: 
- 비교 기준(baseline): `,
          minChars: 250,
        },
      ],
    },
    {
      id: "code",
      tier: "core",
      title: "구현과 실험",
      instructions: `
프로젝트 코드를 작성합니다. 필요한 만큼 **+ 코드 셀 추가**로 셀을 늘리고, 셀 사이에 **+ 메모 추가**로 설명을 남깁니다. 다음을 지킵니다.

- 첫 셀에서 시드를 고정하고, 그 값을 출력합니다.
- baseline과 제안 방법을 같은 조건에서 비교합니다. 가능하면 여러 시드의 평균과 표준편차를 보고합니다.
- 결과 표와 그래프는 셀 출력으로 남깁니다.
`,
      cells: [
        {
          kind: "code",
          id: "code-setup",
          label: "설정과 데이터 준비",
          starter: `import numpy as np
import random

SEED = 0
random.seed(SEED)
np.random.seed(SEED)
rng = np.random.default_rng(SEED)
print("SEED =", SEED)

# 데이터 준비 코드를 작성합니다.
`,
        },
        {
          kind: "code",
          id: "code-experiment",
          label: "실험",
          starter: `# baseline과 제안 방법을 같은 조건에서 비교합니다.
`,
        },
      ],
    },
    {
      id: "report",
      tier: "core",
      title: "리포트",
      instructions: `
A4 3~5쪽 분량의 리포트를 작성합니다. 결과에는 baseline과의 비교를 포함하고, **한계와 실패 사례** 항목에는 실제 출력이나 그래프를 근거로 구체적인 사례를 적습니다. "시간이 부족해 하지 못했다" 수준의 문장은 실패 사례로 보지 않습니다.
`,
      cells: [
        {
          kind: "text",
          id: "report-answer",
          prompt: "리포트를 작성해 주십시오.",
          template: `## 1. 문제 정의


## 2. 방법


## 3. 실험 설정


## 4. 결과


## 5. 한계와 실패 사례


## 6. 책임 있는 AI 고려 사항


## 7. 참고문헌
`,
          minChars: 1500,
        },
      ],
    },
    {
      id: "modelcard",
      tier: "core",
      title: "모델카드",
      instructions: `
만든 모델이나 시스템에 대한 모델카드(또는 시스템카드)를 한 쪽 분량으로 작성합니다. 여섯 항목을 빠짐없이 채웁니다. 집단별 성능은 데이터에 집단 구분이 없다면 입력 유형별(예: 클래스별, 질문 난이도별) 성능으로 대신합니다.
`,
      cells: [
        {
          kind: "text",
          id: "modelcard-answer",
          prompt: "모델카드를 작성해 주십시오.",
          template: `### 의도된 용도


### 의도하지 않은 용도


### 데이터 출처


### 집단별(또는 유형별) 성능


### 한계


### 윤리적 고려 사항
`,
          minChars: 600,
        },
      ],
    },
    {
      id: "presentation",
      tier: "core",
      title: "발표 개요",
      instructions: `
10분 발표(문제 3분 · 방법 3분 · 결과 3분 · 한계와 교훈 1분)와 질의응답 5분을 준비합니다. 슬라이드별 핵심 메시지를 개요로 적고, 예상 질문 세 가지(왜 이 방법을 택했는가, 왜 이 지표를 썼는가, 실패하면 누가 피해를 보는가 등)에 대한 답을 준비합니다. 별도 슬라이드 파일은 선택 사항입니다.
`,
      cells: [
        {
          kind: "text",
          id: "presentation-answer",
          prompt: "발표 개요와 예상 질문·답변을 작성해 주십시오.",
          template: `### 슬라이드 개요
1. 
2. 
3. 

### 예상 질문과 답변
- Q: 
  A: `,
          minChars: 400,
        },
      ],
    },
    {
      id: "reflection",
      tier: "core",
      title: "성찰문",
      instructions: `
8주 전과 지금의 이해가 어떻게 달라졌는지 적고, 백지에서 다시 그린 "AI 전체 지도"(주요 개념과 그 관계)를 목록이나 표로 정리합니다. 앞으로의 학습 계획도 함께 적습니다. 아래 로드맵을 참고할 수 있습니다.

| 관심 분야 | 다음 단계 |
| --- | --- |
| 이론·연구 | [CS229](https://cs229.stanford.edu/), [CS224n](https://web.stanford.edu/class/cs224n/), [CS336](https://stanford-cs336.github.io/) 과제, 주 1편 논문 스터디 |
| 강화학습 | [Berkeley CS285](https://rail.eecs.berkeley.edu/deeprlcourse/), [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit0/introduction) |
| LLM 엔지니어링 | 파인튜닝(LoRA·[PEFT](https://huggingface.co/docs/peft/index)), 서빙([vLLM](https://docs.vllm.ai/)), 평가, 에이전트 프레임워크 |
| 비전·멀티모달 | [CS231n](https://cs231n.github.io/) 과제, CLIP·확산 모델 |
| 정책·윤리 | [Stanford HAI](https://hai.stanford.edu/), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) |
`,
      cells: [
        {
          kind: "text",
          id: "reflection-answer",
          prompt: "성찰문과 AI 전체 지도, 앞으로의 학습 계획을 작성해 주십시오.",
          template: `### 8주 전과 지금


### AI 전체 지도


### 앞으로의 학습 계획
`,
          minChars: 500,
        },
      ],
    },
    {
      id: "audit",
      tier: "supplement",
      title: "보충: 서브그룹 감사와 편향 완화 실험",
      instructions: `
캡스톤 모델(또는 시스템)의 성능을 집단별로 나눠 봅니다. 데이터에 집단 구분이 없다면 입력 유형별(클래스, 질문 난이도, 문서 출처 등)로 나눕니다. 집단마다 표본 수와 함께 정확도(분류라면 선택률·TPR·FPR도)를 표로 보고하고, 가장 큰 격차를 하나 고릅니다.

이어서 「편향 완화」 단계의 방법 하나(재가중, 학습 중 벌점, 집단별 임계값, 부족한 유형의 데이터 보강 등)를 적용해 **격차와 전체 성능이 함께** 어떻게 변하는지 비교합니다. 표본이 적은 집단의 수치는 얼마나 흔들릴 수 있는지(7주차 심화의 윌슨 구간 등)도 함께 적으면 좋습니다. 점수에는 들어가지 않습니다.
`,
      cells: [
        { kind: "code", id: "audit-code", label: "집단별 성능과 완화 실험", starter: `# 집단(또는 유형)별 표본 수와 지표를 표로 출력하고, 완화 전후를 비교합니다.\n` },
        { kind: "text", id: "audit-answer", prompt: "집단별 성능 표, 고른 격차와 그 원인에 대한 가설, 적용한 완화 방법과 전후 비교, 그 대가를 정리해 주십시오." },
      ],
    },
    {
      id: "advanced",
      tier: "advanced",
      title: "심화: 결과의 불확실성 · 프라이버시 · 드리프트 점검",
      instructions: `
다음 중 하나 이상을 골라 캡스톤에 적용합니다. 점수에는 들어가지 않습니다.

- **결과의 불확실성:** 핵심 지표에 부트스트랩이나 윌슨 신뢰구간을 붙이고, baseline과 제안 방법을 같은 시드·같은 문항으로 짝지어 비교합니다(순열 검정, McNemar, 짝지은 부트스트랩 중 하나). 여러 설정 중 최고를 골랐다면 개발용과 보고용 데이터를 나눠 선택 편향을 확인합니다. 과제의 심화 문제 「부트스트랩 신뢰구간으로 캡스톤 결과의 불확실성 보고하기」를 그대로 활용할 수 있습니다.
- **프라이버시:** 학습 데이터와 학습에 쓰지 않은 데이터에서 모델의 확신도를 비교해 멤버십 추론 공격의 이득(TPR − FPR)을 재고, 규제 강도나 모델 크기를 바꿔 그 이득과 성능이 어떻게 변하는지 봅니다(「프라이버시의 수학」).
- **드리프트:** 캡스톤 데이터를 시간·출처 등으로 나눠 "학습"과 "운영"으로 삼고 특징별 PSI를 잽니다. 운영 표본 크기에서 드리프트가 없을 때의 PSI와 비교하고, 라벨 비율이 달라졌다면 BBSE로 라벨 없이 추정해 실제 값과 비교합니다(「드리프트 감지의 통계」).
- **공정성의 한계:** 집단별 기저율과 PPV·FNR·FPR을 재어 Chouldechova 항등식이 맞는지 확인하고, 어떤 공정성 기준을 택할지와 그 비용을 정리합니다(「공정성 불가능성 정리」).
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: `# 선택한 심화 점검을 이 셀에서 진행합니다.\n` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 점검했고 어떤 결과를 얻었는지, 그 결과가 캡스톤의 결론을 어떻게 바꾸거나 뒷받침하는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "problem", label: "문제 정의와 설계", points: 1.5, guide: "가설과 성공 기준이 명확하고, 데이터와 baseline이 문제에 맞습니다." },
    { id: "depth", label: "기술적 깊이", points: 2.5, guide: "핵심 부분을 직접 구현하거나 분석했으며, 사용한 도구의 동작을 이해하고 있습니다." },
    { id: "rigor", label: "실험과 평가의 엄밀성", points: 2.5, guide: "baseline 대비 비교, 여러 지표, 여러 시드의 평균·표준편차 등으로 결론을 뒷받침했습니다." },
    { id: "responsible", label: "책임 있는 AI와 한계", points: 1.5, guide: "구체적인 위험과 실패 사례를 근거와 함께 분석하고, 모델카드를 빠짐없이 작성했습니다." },
    { id: "reproducible", label: "재현성과 문서화", points: 1, guide: "초기화 후 전체 실행으로 모든 셀이 오류 없이 재현되고, 설명이 충분합니다." },
    { id: "communication", label: "발표와 소통", points: 1, guide: "발표 개요가 시간 배분에 맞고 핵심이 분명하며, 예상 질문에 대한 답이 준비되어 있습니다." },
  ],
};

export default week8Assignment;
