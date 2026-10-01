import type { Tier } from "./tiers";

export type { Tier };

export type Block =
  | { type: "heading"; level: 2 | 3; text: string; id?: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang?: string; code: string }
  | { type: "formula"; code: string }
  | { type: "math"; tex: string }
  | { type: "callout"; tone: CalloutTone; title?: string; text: string }
  | { type: "diagram"; id: string }
  | { type: "image"; src: string; alt: string; caption?: string; credit?: string; width: number; height: number };

export type CalloutTone = "info" | "warn" | "example" | "quote" | "tip" | "task";

/** 단계 끝의 자동 채점 확인 문제(객관식). 정답 번호는 서버에서만 비교한다. */
export interface SectionCheck {
  id: string;
  question: string;
  choices: string[];
  /** 0부터 시작하는 정답 선택지 번호 */
  answer: number;
  /** 정답을 맞힌 뒤(또는 두 번 틀린 뒤) 보여주는 해설 */
  explanation: string;
}

export interface SectionReference {
  title: string;
  url: string;
  /** 어떤 부분을 왜 보면 좋은지 한 줄 설명 */
  note?: string;
}

/** conceptsMd의 `## 제목 {#id}` 하나에 대응하는 단계 부가 정보 */
export interface SectionMeta {
  /** 단계 구분: core(핵심·초심자, 주차 완료 조건) / supplement(보충·중급자) / advanced(심화·전문가) */
  tier: Tier;
  /** 이 단계를 마치면 할 수 있게 되는 것 (한 문장) */
  goal: string;
  /** 자동 채점 객관식 확인 문제 */
  checks: SectionCheck[];
  /** 이 단계에 배정된 서술형 문항(week.quiz) id — 직접 쓰고 모범답안과 비교해 자기평가 */
  quizIds: string[];
  /** 외부 참고 자료 */
  references?: SectionReference[];
}

export interface WeekMeta {
  slug: string;
  number: number;
  phase: string;
  title: string;
  subtitle: string;
  difficulty: number; // 1-5
  keywords: string[];
  objectives: string[];
  learningOrder: string[];
  /**
   * 학습 자료 본문. `## 제목 {#section-id}` 하나가 학습 단계 하나가 되고,
   * 첫 `##` 앞의 글은 주차 도입부로 개요 화면에 표시된다.
   */
  conceptsMd: string;
  /** 단계 id → 단계 목표·확인 문제·서술형 문항 배정·참고 자료 */
  sections: Record<string, SectionMeta>;
  quiz: { id: string; question: string }[];
  worksheet: { label: string; hint?: string }[];
  /** 사이트 안에서 작성·실행·제출하는 과제 명세 */
  assignment: AssignmentSpec;
  /** 과제 만점. 채점 기준(rubric) 배점의 합과 같아야 한다(검증 스크립트가 확인). */
  assignmentMaxScore: number;
  /** 제출 기한 안내 (예: "제출 기한: 일요일 23:59") */
  dueNote: string;
}

/** 과제 작업 공간의 셀. 코드 셀은 브라우저(Pyodide)에서 실행되고, 답안 셀은 마크다운으로 작성한다. */
export type AssignmentCellSpec =
  | {
      kind: "code";
      /** 과제 안에서 고유한 셀 id (초안 저장 키) */
      id: string;
      /** 처음 열었을 때 채워지는 코드 */
      starter: string;
      /** 셀 위에 표시할 짧은 설명 */
      label?: string;
    }
  | {
      kind: "text";
      id: string;
      /** 무엇을 적어야 하는지 안내하는 문장 */
      prompt: string;
      placeholder?: string;
      /** 제출하려면 채워야 하는 최소 글자 수 (선택 과제에서는 강제하지 않는다) */
      minChars?: number;
      /** 처음 열었을 때 채워지는 틀(표 머리글 등) */
      template?: string;
    };

export interface AssignmentTaskSpec {
  id: string;
  title: string;
  /** core(필수, 채점 기준이 다루는 범위) / supplement·advanced(선택 — 제출 필수 조건에서 제외된다) */
  tier: Tier;
  /** 과제 설명(마크다운) */
  instructions: string;
  cells: AssignmentCellSpec[];
}

export interface RubricCriterion {
  id: string;
  label: string;
  points: number;
  /** 운영자에게 보여 줄 채점 기준(학습자에게도 공개) */
  guide: string;
}

export interface AssignmentSpec {
  title: string;
  /** 과제 개요(마크다운 한두 문단) */
  summary: string;
  tasks: AssignmentTaskSpec[];
  rubric: RubricCriterion[];
  /** 코드 셀에서 /course/weekN.md 경로로 이 사이트의 학습 자료 본문을 읽을 수 있게 한다(7주차 RAG 과제) */
  provideCourseDocs?: boolean;
}

// ─── 코딩 실습·퀴즈·과제 자동 테스트 (src/content/labs) ───────────────────────
// 학습 자료의 완성 예제와 달리, 학습자가 TODO를 직접 채우고 브라우저(Pyodide)에서 자동 채점받는다.
// 사용자 코드는 서버에서 실행하지 않는다. 퀴즈의 정답 비교만 서버 액션이 한다.

/** 채점 코드에서 쓰는 도우미: `@test("이름")`으로 검사 항목을 정의하고, `approx(a, b)`·`output`(내 코드의 표준 출력)을 쓸 수 있다. */
export interface CodingExercise {
  /** 전역에서 고유한 id (진도·코드 저장 키). 한 번 정하면 바꾸지 않는다. */
  id: string;
  /** 연결된 단계 id(conceptsMd의 {#id}). 과제 심화 문제는 생략한다. */
  sectionId?: string;
  title: string;
  /** 핵심(초심자) · 보충(중급자) · 심화(전문가). 과제 심화 문제는 advanced */
  tier: Tier;
  /** 문제 설명(마크다운) */
  prompt: string;
  /** `TODO`가 들어 있는 시작 코드 */
  starter: string;
  /** 채점 코드. 학습자 코드를 실행한 이름공간에서 이어서 실행한다. */
  tests: string;
  /** 단계별 힌트. 앞에서부터 하나씩 공개한다. */
  hints: string[];
  /** 모범 답안 코드. 통과했거나 힌트를 모두 본 뒤에 볼 수 있다. */
  solution: string;
}

export type LabQuizItem =
  | {
      kind: "choice";
      id: string;
      tier: Tier;
      sectionId: string;
      question: string;
      choices: string[];
      /** 0부터 시작하는 정답 번호 (서버에서만 비교) */
      answer: number;
      explanation: string;
    }
  | {
      kind: "predict";
      id: string;
      tier: Tier;
      sectionId: string;
      /** 생략하면 "출력 결과를 예측해 적으십시오." */
      question?: string;
      /** 출력을 예측할 Python 코드 */
      code: string;
      /** 정확한 출력(공백 차이는 무시하고 비교) */
      expected: string;
      /** 표기만 다른 정답(예: 0.5와 .5) */
      alternatives?: string[];
      explanation: string;
    }
  | {
      kind: "descriptive";
      id: string;
      tier: Tier;
      sectionId: string;
      question: string;
      modelAnswer: string;
      /** 자기 점검용 핵심 요소 */
      keyPoints: string[];
    };

/** 과제 작업 공간의 코드를 대상으로 브라우저에서 실행하는 자동 테스트 */
export interface AssignmentAutoTest {
  id: string;
  /** 대상 과제 항목(AssignmentTaskSpec.id) */
  taskId: string;
  title: string;
  /** 과제 이름공간(학습자가 실행한 셀의 변수)에서 실행하는 코드. assert가 실패하면 미통과 */
  code: string;
  /** 미통과일 때 보여 줄 도움말 */
  hint?: string;
}

export interface WeekLab {
  exercises: CodingExercise[];
  quiz: LabQuizItem[];
  assignment: {
    /** 무엇을 만들어 내야 하는지 한눈에 보는 요구사항 */
    requirements: string[];
    autoTests: AssignmentAutoTest[];
    /** 자동 채점되는 심화 문제(제출과 별개, 선택) */
    challenges: CodingExercise[];
  };
}

export interface WeekSection {
  id: string;
  tier: Tier;
  /** 같은 구분(핵심·보충·심화) 안에서 1부터 시작하는 번호 */
  number: number;
  /** 주차 전체에서 1부터 시작하는 순서(본문 순서 = 핵심 → 보충 → 심화) */
  order: number;
  title: string;
  /** 학습 본문 블록 */
  learn: Block[];
  meta: SectionMeta;
  /** 본문 분량과 코드 셀 수로 계산한 예상 학습 시간(분) */
  minutes: number;
}
