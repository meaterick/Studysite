import type { Tier } from "./tiers";

export type { Tier };

// ─── 본문 블록 (src/content/markdown.ts가 만든다) ─────────────────────────────

export type Block =
  | { type: "heading"; level: 2 | 3; text: string; id?: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang?: string; code: string }
  | { type: "formula"; code: string }
  | { type: "math"; tex: string }
  /** text: 본문을 한 줄로 이은 것(검색·분량 계산용). blocks: 본문을 블록으로 다시 해석한 것(표·목록·코드·수식 지원) */
  | { type: "callout"; tone: CalloutTone; title?: string; text: string; blocks: Block[] }
  | { type: "diagram"; id: string }
  | { type: "image"; src: string; alt: string; caption?: string; credit?: string; width: number; height: number; maxWidth?: number };

export type CalloutTone = "info" | "warn" | "example" | "quote" | "tip" | "task";

// ─── 커리큘럼 계층: 트랙 → 모듈 → 레슨 ────────────────────────────────────────

export type TrackId = "intro" | "programming" | "math" | "data" | "ml" | "dl" | "genai" | "capstone" | "extension";

export interface Reference {
  title: string;
  url: string;
  /** 어느 부분을 왜 보면 좋은지 한 줄 */
  note?: string;
}

/** 레슨 끝의 객관식 확인 문제. 레슨의 확인 문제를 모두 맞히면 레슨을 완료할 수 있다. 정답은 서버에서만 비교한다. */
export interface Check {
  /** 레슨 안에서 고유한 키(예: "c1"). 전역 id는 `레슨id/키`다. 한 번 정하면 바꾸지 않는다. */
  key: string;
  question: string;
  choices: string[];
  /** 0부터 시작하는 정답 선택지 번호 */
  answer: number;
  /** 정답을 맞힌 뒤(또는 두 번 틀린 뒤) 보여 주는 해설 */
  explanation: string;
}

/** TODO를 채우는 코딩 실습. 학습자 코드는 브라우저(Pyodide)에서만 실행·채점한다. */
export interface Exercise {
  /** 레슨(또는 과제) 안에서 고유한 키(예: "ex1"). 전역 id는 `레슨id/키`다. */
  key: string;
  title: string;
  /** 문제 설명(마크다운) */
  prompt: string;
  /** `TODO`가 들어 있는 시작 코드 */
  starter: string;
  /** 채점 코드: `@test("항목")` 함수들. 학습자 코드를 실행한 이름공간에서 이어서 실행한다. */
  tests: string;
  /** 단계별 힌트(2개 이상, 앞에서부터 하나씩 공개) */
  hints: string[];
  /** 모범 답안. 모든 항목을 통과했거나 힌트를 모두 본 뒤 한 번 이상 채점했을 때만 공개한다. */
  solution: string;
}

/** 코드 출력 예측 문제(선택). 공백 차이는 무시하고 비교한다. */
export interface Predict {
  key: string;
  /** 생략하면 "출력 결과를 예측해 적으십시오." */
  question?: string;
  code: string;
  expected: string;
  /** 표기만 다른 정답(예: 0.5와 .5) */
  alternatives?: string[];
  explanation: string;
}

/** 서술형 문항(선택). 답을 저장한 뒤에 모범답안과 핵심 요소를 공개하고, 학습자가 스스로 평가한다. */
export interface Descriptive {
  key: string;
  question: string;
  /** 모범답안(마크다운) */
  answer: string;
  /** 자기 점검용 핵심 요소 */
  keyPoints: string[];
}

/** 레슨 원본: 파일 하나가 레슨 하나다(src/content/modules/<모듈>/<레슨>.ts). */
export interface LessonSource {
  /** 전역에서 고유한 id(영문 소문자·숫자·하이픈). URL과 진도 저장 키다. 한 번 정하면 바꾸지 않는다. */
  id: string;
  title: string;
  /** core: 모듈 완료 조건 / supplement·advanced: 선택 */
  tier: Tier;
  /** 이 레슨이 다루는 개념(src/content/curriculum/concepts.ts의 id). 핵심 레슨은 1개 이상 */
  concepts?: string[];
  /** 개념 선수관계 밖에서 먼저 보아야 하는 레슨 id */
  requires?: string[];
  /** 이 레슨을 마치면 할 수 있는 것(측정 가능한 한 문장) */
  goal: string;
  /** 이 개념이 AI 시스템의 어디에 쓰이는지(한두 문장). 레슨 맨 위에 표시한다. */
  why: string;
  /** 본문(마크다운) */
  body: string;
  checks: Check[];
  exercises?: Exercise[];
  predicts?: Predict[];
  descriptive?: Descriptive[];
  references?: Reference[];
}

/** 모듈 끝의 백지 복습 문항: 자료를 보지 않고 적은 뒤 학습 자료와 비교해 스스로 평가한다. */
export interface RecallItem {
  prompt: string;
  hint?: string;
}

/** 모듈 원본(src/content/modules/<모듈>/index.ts) */
export interface ModuleSource {
  /** 전역에서 고유한 slug. URL·백지 복습 저장 키다. 한 번 정하면 바꾸지 않는다. */
  slug: string;
  track: TrackId;
  /** 트랙 안의 순서(1부터). 표시 번호 "2-3"은 트랙 번호와 이 값으로 만든다. */
  order: number;
  title: string;
  /** 한 줄 소개 */
  summary: string;
  /** 목표 문제(마크다운). 모듈 첫 화면에서 이 모듈의 레슨이 무엇을 위해 필요한지 보여 준다. */
  anchor: string;
  /** 모듈을 마치면 할 수 있는 것 */
  objectives: string[];
  /** 핵심 → 보충 → 심화 순서 */
  lessons: LessonSource[];
  recall: RecallItem[];
  assignment?: AssignmentSource;
  /** 함께 보면 좋은 외부 자료 */
  references?: Reference[];
}

// ─── 과제 ───────────────────────────────────────────────────────────────

/** 과제 작업 공간의 셀. 코드 셀은 브라우저(Pyodide)에서 실행되고, 답안 셀은 마크다운으로 작성한다. */
export type AssignmentCellSpec =
  | {
      kind: "code";
      /** 과제 안에서 고유한 셀 id(초안 저장 키) */
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
      /** 제출하려면 채워야 하는 최소 글자 수(선택 과제에서는 강제하지 않는다) */
      minChars?: number;
      /** 처음 열었을 때 채워지는 틀(표 머리글 등) */
      template?: string;
    };

export interface AssignmentTaskSpec {
  id: string;
  title: string;
  /** core: 필수(채점 기준이 다루는 범위) / supplement·advanced: 선택(제출 필수 조건에서 제외) */
  tier: Tier;
  /** 과제 설명(마크다운) */
  instructions: string;
  cells: AssignmentCellSpec[];
}

export interface RubricCriterion {
  id: string;
  label: string;
  points: number;
  /** 채점 기준(학습자에게도 공개) */
  guide: string;
}

/** 과제 작업 공간의 코드를 대상으로 브라우저에서 실행하는 자동 테스트(채점과 무관한 자기 점검) */
export interface AssignmentAutoTest {
  id: string;
  /** 대상 과제 항목(AssignmentTaskSpec.id) */
  taskId: string;
  title: string;
  /** 과제 이름공간에서 실행하는 코드. assert가 실패하면 미통과 */
  code: string;
  /** 미통과일 때 보여 줄 도움말 */
  hint?: string;
}

export interface AssignmentSource {
  /** 제출·초안 저장 키(전역 고유). 한 번 정하면 바꾸지 않는다. */
  key: string;
  /** module: 모듈 과제 / track: 트랙 프로젝트 / capstone: 캡스톤 */
  kind: "module" | "track" | "capstone";
  title: string;
  /** 과제 개요(마크다운 한두 문단) */
  summary: string;
  /** 무엇을 만들어 내야 하는지 한눈에 보는 요구사항 */
  requirements: string[];
  tasks: AssignmentTaskSpec[];
  rubric: RubricCriterion[];
  /** 만점. rubric 배점의 합과 같아야 한다(검증 스크립트가 확인). */
  maxScore: number;
  autoTests: AssignmentAutoTest[];
  /** 자동 채점되는 선택 심화 문제 */
  challenges: Exercise[];
  /** 코드 셀에서 /course/<모듈 slug>.md 경로로 이 사이트의 학습 자료를 읽을 수 있게 한다(RAG 과제) */
  provideCourseDocs?: boolean;
  /** 채점 참고(운영자 채점 화면에만 보인다): 기대하는 수치, 우수 답안의 조건, 감점 기준 */
  gradingNotes?: string;
}

// ─── 화면에서 쓰는 계산된 구조 (src/content/course.ts가 만든다) ─────────────────

export interface Track {
  id: TrackId;
  /** 0~7, 확장은 -1 */
  number: number;
  /** 화면 표기: "1", "X" */
  code: string;
  title: string;
  /** 한 줄 소개 */
  summary: string;
  /** 이 트랙이 AI 시스템의 어디에 쓰이는지 */
  why: string;
  /** 표식 색(CSS 변수) */
  color: string;
}

export interface Lesson extends LessonSource {
  /** 소속 모듈 slug */
  module: string;
  /** 같은 구분(핵심·보충·심화) 안에서 1부터 시작하는 번호 */
  number: number;
  /** 모듈 안에서 1부터 시작하는 순서(핵심 → 보충 → 심화) */
  order: number;
  /** 파싱한 본문 블록 */
  learn: Block[];
  /** 본문 분량과 문항 수로 계산한 예상 학습 시간(분) */
  minutes: number;
}

export interface Module extends Omit<ModuleSource, "lessons"> {
  /** 표시 번호: "2-3", 확장은 "X-1" */
  code: string;
  trackInfo: Track;
  lessons: Lesson[];
}
