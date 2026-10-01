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
  "week-4": {
    "ablation-code": [
      ['# "Dropout 제거": dict(dropout=0.0),', '"Dropout 제거": dict(dropout=0.0),'],
      ['# "데이터 증강 제거": dict(augment=False),', '"데이터 증강 제거": dict(augment=False),'],
    ],
    "conv-code": [["return 0  # TODO: 학습 자료의 출력 크기 공식을 직접 써 넣습니다. (정수 나눗셈은 //)", "return (n + 2 * p - k) // s + 1"]],
  },
  "week-5": {
    "mha-code": [
      [
        "scores = np.zeros((n_heads, T, T))          # TODO: Qh와 Kh로 점수를 계산하고, scale=True면 √d_k로 나눕니다. shape: ?",
        "scores = Qh @ Kh.transpose(0, 2, 1) / (np.sqrt(d_k) if scale else 1.0)",
      ],
    ],
    "verify-code": [
      [
        "pass\n    return concat @ Wo",
        "s = np.array([Q[i, c0:c0 + d_k] @ K[j, c0:c0 + d_k] / np.sqrt(d_k) for j in range(i + 1)]); a = np.exp(s - s.max()); a /= a.sum(); concat[i, c0:c0 + d_k] = a @ V[:i + 1, c0:c0 + d_k]\n    return concat @ Wo",
      ],
    ],
    "example-code": [["# TODO: 직접 고른 Query를 하나 이상 추가합니다.", '"먹었다의 Key와 같은 Query": [1, 1, 0, -1],']],
  },
  "week-6": {
    "decoding-code": [["q = p  # TODO: 필터 flt를 적용합니다.", "q = flt(p)"]],
    "scaling-code": [
      ["N = 0.0  # TODO", "N = (C / 120) ** 0.5"],
      ["D = 0.0  # TODO", "D = 20 * N"],
    ],
  },
  "week-7": {
    "golden-code": [
      [
        "# TODO: 나머지 17문항을 추가합니다. (쉬운 질문 10개, 어려운 질문 10개, 자료에 없는 질문 3개 이상)",
        [
          ["perplexity는 무엇을 재는 지표인가?", "week6", "perplexity", "easy"],
          ["LoRA는 어떻게 학습 파라미터를 줄이나?", "week6", "LoRA", "easy"],
          ["합성곱 층은 무엇을 학습하나?", "week4", "합성곱", "easy"],
          ["잔차 연결은 왜 쓰나?", "week4", "잔차 연결", "easy"],
          ["역전파는 무엇을 계산하나?", "week3", "역전파", "easy"],
          ["과적합이란 무엇인가?", "week2", "과적합", "easy"],
          ["Recall@k는 무엇을 재나?", "week7", "Recall@k", "easy"],
          ["Human-in-the-loop은 언제 필요한가?", "week7", "Human-in-the-loop", "easy"],
          ["데이터 드리프트란 무엇인가?", "week8", "드리프트", "easy"],
          ["학습률이 너무 크면 경사하강법은 어떻게 되나?", "week1", "학습률", "hard"],
          ["공정성 지표들을 동시에 만족시키기 어려운 이유는?", "week8", "공정성", "hard"],
          ["Self-Attention이 RNN보다 병렬화에 유리한 이유는?", "week5", "Self-Attention", "hard"],
          ["CNN에서 과적합을 줄이는 방법 두 가지는?", "week4", "과적합", "hard"],
          ["LoRA와 양자화를 함께 쓰면 무엇이 좋아지나?", "week6", "LoRA", "hard"],
          ["깊은 신경망의 역전파에서 기울기가 작아지는 이유는?", "week3", "역전파", "hard"],
          ["다음 오프라인 모임 장소는 어디인가?", null, null, "hard"],
          ["동아리 회비는 얼마인가?", null, null, "hard"],
        ]
          .map(([q, src, ev, lv]) =>
            src ? `dict(q="${q}", source="${src}", evidence="${ev}", answer="${ev}", level="${lv}"),` : `dict(q="${q}", source=None, evidence=None, answer=None, level="${lv}"),`,
          )
          .join("\n    "),
      ],
    ],
    "scenario-code": [
      [
        "# TODO: 질문을 두 개 더 추가합니다.",
        '"과적합을 줄이려면 어떻게 해야 하나요?",\n    "RAG에서 청크 크기는 어떻게 정하나요?",',
      ],
      ["after = RAG(docs, chunk_size=500)   # TODO: 개선한 설정으로 바꿉니다.", "after = RAG(docs, chunk_size=300)"],
    ],
  },
};
