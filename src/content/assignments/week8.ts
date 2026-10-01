import type { AssignmentSpec } from "../types";

// 8주차 캡스톤: 코드·리포트·모델카드·발표 개요·성찰문을 모두 작업 공간 안에서 작성한다.
// 슬라이드 PDF 같은 추가 자료는 제출할 때 파일로 첨부할 수 있다(선택).
const week8Assignment: AssignmentSpec = {
  title: "캡스톤 프로젝트",
  summary: `
8주 동안 배운 내용을 하나의 프로젝트로 묶습니다. 유형(A 구현형 · B 응용형 · C 분석형 · D 책임형)과 일정은 「핵심 논문 하이라이트와 캡스톤 설계」 단계를 참고합니다. 코드는 이 작업 공간에서 실행하며(NumPy, pandas, scikit-learn, matplotlib 사용 가능), 리포트·모델카드·발표 개요·성찰문도 모두 답안 칸에 작성합니다. 1~8주차 학습 자료는 \`/course/week1.md\` 등의 파일로 읽을 수 있습니다.

제출하기 전에 **실행 환경 초기화** 후 **전체 실행**을 눌러 모든 셀이 처음부터 오류 없이 실행되는지 반드시 확인합니다. 발표 슬라이드를 따로 만들었다면 제출할 때 PDF로 첨부할 수 있습니다.
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
