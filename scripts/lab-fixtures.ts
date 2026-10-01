/**
 * 과제 자동 테스트 검증용 참조 노트북(scripts/check-labs.ts 전용). 주차 slug → 셀 id → [시작 코드에서 찾을 문자열, 바꿀 문자열].
 * 시작 코드의 TODO를 채운 "모범 답안"이므로 화면에는 쓰지 않는다.
 */
export const ASSIGNMENT_FIXTURES: Record<string, Record<string, [string, string][]>> = {
  "week-1": {
    "gd-code": [
      ["dw = 0.0  # TODO: ∂L/∂w", "dw = np.mean(2 * err * x)"],
      ["db = 0.0  # TODO: ∂L/∂b", "db = np.mean(2 * err)"],
    ],
    "bayes-code": [
      ["p_positive = 0.0  # TODO: 전체 확률의 법칙으로 P(양성)", "p_positive = sensitivity * prevalence + false_positive * (1 - prevalence)"],
      ["return 0.0        # TODO", "return sensitivity * prevalence / p_positive"],
    ],
  },
};
