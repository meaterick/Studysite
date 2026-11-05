// 레슨·실습·과제 항목을 세 구분으로 나눈다.
//   - core(핵심): 모듈 완료 조건. 80개 개념은 모두 핵심 레슨에서 다룬다.
//   - supplement(보충): 핵심 개념을 실무 도구와 다른 방법으로 넓히는 선택 레슨.
//   - advanced(심화): 수식 유도·이론적 근거·최신 기법을 다루는 선택 레슨. 심화 활동이 있는 모듈에서 모두 마치면 "심화 달성"으로 기록한다.
// 화면 문구와 색은 이 파일 한 곳에서 정한다(서버·클라이언트 공용, 의존성 없음).

export type Tier = "core" | "supplement" | "advanced";

export const TIER_ORDER: readonly Tier[] = ["core", "supplement", "advanced"];

export interface TierInfo {
  /** 핵심 / 보충 / 심화 */
  label: string;
  /** "핵심 레슨" */
  course: string;
  /** 한 줄 설명 */
  summary: string;
  /** 배지 색(CSS 변수) */
  color: string;
  /** 모듈 완료에 필요한가 */
  required: boolean;
}

export const TIER_INFO: Record<Tier, TierInfo> = {
  core: {
    label: "핵심",
    course: "핵심 레슨",
    summary: "모듈을 완료하려면 마쳐야 하는 레슨입니다. 80개 개념은 모두 핵심 레슨에서 다룹니다.",
    color: "var(--tier-core)",
    required: true,
  },
  supplement: {
    label: "보충",
    course: "보충 레슨",
    summary: "핵심 개념을 실무 도구와 다른 방법으로 넓히는 선택 레슨입니다.",
    color: "var(--tier-supplement)",
    required: false,
  },
  advanced: {
    label: "심화",
    course: "심화 레슨",
    summary: "수식 유도, 이론적 근거, 최신 기법을 다루는 선택 레슨입니다. 심화 활동이 있는 모듈에서 모두 마치면 심화 달성으로 기록합니다.",
    color: "var(--tier-advanced)",
    required: false,
  },
};

/** 레슨 이름표: "핵심 3" */
export function lessonLabel(lesson: { tier: Tier; number: number }): string {
  return `${TIER_INFO[lesson.tier].label} ${lesson.number}`;
}
