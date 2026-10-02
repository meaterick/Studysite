// 학습 단계·실습·퀴즈·과제 항목을 세 갈래로 나눈다.
//   - core(핵심 · 초심자): 이번 주를 끝내는 데 꼭 필요한 개념. 핵심 단계만 마치면 주차가 완료되고 백지공부·과제가 열린다.
//   - supplement(보충 · 중급자): 핵심을 실무로 넓히는 내용. 선택이며 진도와 별도로 "보충" 기록만 남는다.
//   - advanced(심화 · 전문가): 유도·최신 기법·연구 수준의 내용. 선택이며 "심화 달성" 기록으로 따로 보여 준다.
// 화면 문구와 색은 이 파일 한 곳에서 정한다(서버·클라이언트 공용, 의존성 없음).

export type Tier = "core" | "supplement" | "advanced";

export const TIER_ORDER: readonly Tier[] = ["core", "supplement", "advanced"];

export interface TierInfo {
  /** 단계 구분: 핵심 / 보충 / 심화 */
  label: string;
  /** 대상 학습자: 초심자 / 중급자 / 전문가 */
  audience: string;
  /** 과정 이름(예: "핵심 과정") */
  course: string;
  /** 한 줄 설명 */
  summary: string;
  /** 배지 색(CSS 변수) */
  color: string;
  /** 주차 완료에 필요한가 */
  required: boolean;
}

export const TIER_INFO: Record<Tier, TierInfo> = {
  core: {
    label: "핵심",
    audience: "초심자",
    course: "핵심 과정",
    summary: "이번 주를 끝내는 데 꼭 필요한 개념입니다. 핵심 단계만 마치면 주차가 완료되고 백지공부·과제가 열립니다.",
    color: "var(--tier-core)",
    required: true,
  },
  supplement: {
    label: "보충",
    audience: "중급자",
    course: "보충 과정",
    summary: "핵심 개념을 실무 도구와 다른 방법으로 넓힙니다. 선택이며, 핵심 과정을 마친 뒤 보는 것을 권장합니다.",
    color: "var(--tier-supplement)",
    required: false,
  },
  advanced: {
    label: "심화",
    audience: "전문가",
    course: "심화 과정",
    summary: "수식 유도, 최신 기법, 연구 수준의 내용을 다룹니다. 선택이며, 마친 내용은 심화 달성 기록으로 따로 남습니다.",
    color: "var(--tier-advanced)",
    required: false,
  },
};

/** "핵심 · 초심자" */
export function tierBadgeText(tier: Tier): string {
  return `${TIER_INFO[tier].label} · ${TIER_INFO[tier].audience}`;
}

/** 단계 이름표: "핵심 3" */
export function sectionLabel(section: { tier: Tier; number: number }): string {
  return `${TIER_INFO[section.tier].label} ${section.number}`;
}

const PREFIX_TIER: Record<string, Tier> = { 핵심: "core", 보충: "supplement", 심화: "advanced" };

/** 학습 목표 문장 앞의 "[핵심]"·"[보충]"·"[심화]" 표시를 떼어 구분과 본문으로 나눈다. 표시가 없으면 tier는 undefined. */
export function splitTierPrefix(text: string): { tier?: Tier; text: string } {
  const m = text.match(/^\[(핵심|보충|심화)\]\s*/);
  return m ? { tier: PREFIX_TIER[m[1]], text: text.slice(m[0].length) } : { text };
}
