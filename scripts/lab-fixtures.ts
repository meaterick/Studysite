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
  "week-2": {
    "compare-code": [
      [
        `"Logistic Regression": DummyClassifier(strategy="most_frequent"),  # TODO: StandardScaler + LogisticRegression 파이프라인`,
        `"Logistic Regression": make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)),`,
      ],
    ],
    "leak-code": [
      ["X_scaled_all = Xw  # TODO: StandardScaler().fit_transform(Xw)", "X_scaled_all = StandardScaler().fit_transform(Xw)"],
      ["X_leaky = Xw  # TODO: np.column_stack([Xw, leaky_col])", "X_leaky = np.column_stack([Xw, leaky_col])"],
    ],
  },
  "week-3": {
    "extend-code": [
      [
        "pass  # TODO: ∂(a/b)/∂a, ∂(a/b)/∂b 를 유도해 self.grad, o.grad에 누적합니다.",
        "self.grad += out.grad / o.data; o.grad += -self.data / o.data ** 2 * out.grad",
      ],
      ["pass  # TODO: d(e^x)/dx 를 이용해 self.grad에 누적합니다.", "self.grad += e * out.grad"],
    ],
    "mlp-code": [
      ["# TODO ①: 모든 파라미터의 grad를 0으로 초기화합니다.", "for p in model.parameters(): p.grad = 0.0"],
      ["# TODO ②: 경사하강법으로 모든 파라미터의 data를 갱신합니다.", "for p in model.parameters(): p.data -= lr * p.grad"],
    ],
    "gradcheck-code": [
      [
        "num = 0.0  # TODO: p.data를 original ± h로 바꿔 total_loss(model)[0].data를 두 번 계산해 중앙차분을 구합니다.",
        "p.data = original + h; lp = total_loss(model)[0].data; p.data = original - h; lm = total_loss(model)[0].data; num = (lp - lm) / (2 * h)",
      ],
    ],
  },
};
