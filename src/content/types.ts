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
  | { type: "practice" }
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
   * 첫 `##` 앞의 글은 주차 도입부로 개요 화면에 표시된다. 단계 안의
   * `[[practice]]` 줄 뒤는 "실습" 단계로 분리되어 렌더링된다.
   */
  conceptsMd: string;
  /** 단계 id → 단계 목표·확인 문제·서술형 문항 배정·참고 자료 */
  sections: Record<string, SectionMeta>;
  quiz: { id: string; question: string }[];
  worksheet: { label: string; hint?: string }[];
  /** raw markdown for the "과제" section (required / advanced / rubric) */
  assignmentMd: string;
  /** 과제 만점 — 운영자 채점 화면의 점수 상한 */
  assignmentMaxScore: number;
  dueNote: string;
}

export interface WeekSection {
  id: string;
  /** 1부터 시작하는 단계 번호 */
  number: number;
  title: string;
  /** 설명 단계 블록 */
  learn: Block[];
  /** `[[practice]]` 뒤의 실습 단계 블록 */
  practice: Block[];
  meta: SectionMeta;
  /** 본문 분량과 코드 셀 수로 계산한 예상 학습 시간(분) */
  minutes: number;
}
