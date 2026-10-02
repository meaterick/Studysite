// 8주 과정의 4부 구성. 커리큘럼과 주차 목록이 같은 이름·색·설명을 쓰도록 한곳에 둔다.

export interface PhaseInfo {
  /** 몇 부인지(1~4) */
  index: number;
  /** "기초" */
  name: string;
  /** 표식 색(CSS 변수) */
  color: string;
  /** 한 줄 설명 */
  focus: string;
}

const FOCUS: Record<string, string> = {
  "1부 · 기초": "벡터·확률·미분과 Python에서 출발해 고전 머신러닝까지",
  "2부 · 딥러닝": "신경망을 직접 만들고 역전파로 학습시킨 뒤 CNN으로 실전 학습",
  "3부 · 현대 AI": "Attention과 Transformer, LLM이 만들어지는 과정",
  "4부 · 활용·책임": "프롬프트·RAG·에이전트 활용, 책임 있는 AI와 캡스톤",
};

/** "2부 · 딥러닝" → { index: 2, name: "딥러닝", ... } */
export function phaseInfo(phase: string): PhaseInfo {
  const [head, ...rest] = phase.split(" · ");
  const index = Number.parseInt(head, 10) || 1;
  return {
    index,
    name: rest.join(" · ") || phase,
    color: `var(--phase-${Math.min(Math.max(index, 1), 4)})`,
    focus: FOCUS[phase] ?? "",
  };
}
