// 주차 난이도(1~5)를 별점 대신 설명할 수 있는 말로 보여 준다. 대부분 3~5라 별점만으로는 차이가 잘 드러나지 않는다.

export interface DifficultyInfo {
  label: string;
  desc: string;
  /** 배지 색(CSS 변수) */
  color: string;
}

export function difficultyInfo(level: number): DifficultyInfo {
  if (level <= 2) return { label: "입문", desc: "처음 배우는 사람도 설명을 따라 무리 없이 진행할 수 있습니다.", color: "var(--status-good)" };
  if (level === 3)
    return { label: "보통", desc: "고등학교 수학과 Python 기초 문법이면 설명을 따라 이해할 수 있습니다.", color: "var(--series-blue)" };
  if (level === 4)
    return { label: "어려움", desc: "수식 유도와 코드 구현을 직접 따라가야 하며, 복습이 필요할 수 있습니다.", color: "var(--series-orange)" };
  return { label: "매우 어려움", desc: "개념이 추상적이고 스스로 조사·실험해야 하는 부분이 많습니다.", color: "var(--status-critical)" };
}
