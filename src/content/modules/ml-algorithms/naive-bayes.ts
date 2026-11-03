import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/naive-bayes";

export default defineLesson({
  id: "naive-bayes",
  title: "나이브 베이즈 분류기",
  tier: "supplement",
  goal: "베이즈 정리와 조건부 독립 가정으로 나이브 베이즈의 사후확률을 계산하고, 라플라스 스무딩과 로그 확률이 필요한 이유를 설명하며, 단어 빈도로 텍스트를 분류하는 MultinomialNB를 쓴다.",
  why: "나이브 베이즈는 학습과 예측이 매우 빠르고 데이터가 적어도 동작해, 스팸 필터나 문서 분류의 기준 모델로 자주 쓰인다([[lesson:baselines]]). 사전확률과 증거를 곱해 판단하는 계산은 베이즈 정리([[lesson:bayes]])와 MAP 추정([[lesson:mle-map]])을 그대로 적용한 것이다.",
  body: md`
### 베이즈 정리로 분류하기

**나이브 베이즈**는 특성 $x_1, \ldots, x_n$이 주어졌을 때 클래스 $c$의 사후확률을 베이즈 정리로 계산하고, 사후확률이 가장 큰 클래스로 판정한다([[lesson:bayes]]). 특성이 여러 개이면 $P(x_1, \ldots, x_n \mid c)$를 데이터에서 직접 추정하기 어려우므로, **클래스가 주어지면 특성끼리 서로 독립**이라고 가정한다. 이 가정을 조건부 독립 가정이라 하고, 실제 데이터에서는 대부분 정확히 성립하지 않아 "나이브"라는 이름이 붙었다. 이 가정으로 결합확률이 개별 확률의 곱이 된다.

\`\`\`math
P(c \mid x_1, \ldots, x_n) \;\propto\; P(c) \prod_{i=1}^{n} P(x_i \mid c)
\`\`\`

가정이 틀려도 나이브 베이즈는 분류를 잘 하는 경우가 많다. 판정에는 사후확률의 정확한 값이 아니라 어느 클래스가 더 큰지만 필요하기 때문이다. 대신 출력 확률은 0이나 1 쪽으로 치우치기 쉬우므로, 확률을 그대로 위험도로 쓰려면 보정을 확인한다([[lesson:cost-threshold]]).

:::example 스팸 필터의 사후확률
메일 100통 가운데 스팸이 30통이면 $P(\text{스팸}) = 0.3$, $P(\text{정상}) = 0.7$이다. 과거 데이터에서 $P(\text{무료} \mid \text{스팸}) = 0.6$, $P(\text{무료} \mid \text{정상}) = 0.05$, $P(\text{당첨} \mid \text{스팸}) = 0.4$, $P(\text{당첨} \mid \text{정상}) = 0.02$로 추정했다. "무료"와 "당첨"이 함께 나온 메일에서

- 스팸 쪽: $0.3 \times 0.6 \times 0.4 = 0.072$
- 정상 쪽: $0.7 \times 0.05 \times 0.02 = 0.0007$

이고, 두 값의 합이 1이 되도록 나누면 $P(\text{스팸} \mid \text{무료, 당첨}) = 0.072 / 0.0727 \approx 0.990$이다.
:::

[[diagram:nb-evidence]]

### 확률 0과 라플라스 스무딩

확률을 곱하므로 하나라도 0이면 전체가 0이 된다. 학습 데이터의 정상 메일 70통에 "할인"이 한 번도 없었다면 $P(\text{할인} \mid \text{정상}) = 0$이 되고, 이후 "할인"이 들어간 메일은 다른 단어와 관계없이 정상일 확률이 0이 된다. 학습 데이터에 우연히 없었다는 이유만으로 판정이 정해지는 것이다. **라플라스 스무딩**은 모든 개수에 1을 더해 이를 막는다. 단어가 있는 경우와 없는 경우 두 가지만 세면

\`\`\`math
P(\text{할인} \mid \text{정상}) = \frac{0 + 1}{70 + 2} \approx 0.014
\`\`\`

가 된다. scikit-learn의 \`MultinomialNB(alpha=1.0)\`에서 \`alpha\`가 더하는 값이고, 사전분포를 더한 MAP 추정으로 해석된다([[lesson:mle-map]]).

### 로그 확률로 계산한다

단어가 수백 개인 문서에서 0.01 같은 확률을 400번 곱하면 $10^{-800}$이 되어 컴퓨터의 실수 표현 범위(약 $10^{-308}$)보다 작아져 0이 된다(언더플로). 그래서 실제 구현은 곱 대신 로그의 합 $\log P(c) + \sum_i \log P(x_i \mid c)$를 계산하고, 그 값이 가장 큰 클래스를 고른다. 로그는 증가함수라 순서가 바뀌지 않는다.

### 텍스트 분류: MultinomialNB

문서마다 단어가 나온 횟수를 특성으로 쓰면 \`CountVectorizer\`와 \`MultinomialNB\`로 문서를 분류할 수 있다.

\`\`\`python
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB

texts = ["무료 쿠폰 당첨 확인", "회의 자료 공유 드립니다", "당첨 축하 무료 이벤트",
         "다음 주 회의 일정", "무료 배송 쿠폰", "프로젝트 자료 검토 부탁"]
labels = [1, 0, 1, 0, 1, 0]                            # 1: 스팸, 0: 정상
vec = CountVectorizer()
X = vec.fit_transform(texts)                           # 문서 × 단어 횟수 행렬
nb = MultinomialNB(alpha=1.0).fit(X, labels)

new = ["무료 당첨 회의", "자료 공유 일정"]
print(nb.predict(vec.transform(new)), np.round(nb.predict_proba(vec.transform(new)), 3))
# [1 0] [[0.2   0.8  ]
#  [0.923 0.077]]
\`\`\`

학습에는 클래스별 단어 횟수를 세는 일만 필요하므로, 문서가 많아도 학습이 빠르다.
`,
  checks: [
    {
      key: "c1",
      question: "나이브 베이즈가 \"나이브\"하다고 불리는 이유는?",
      choices: [
        "클래스가 주어졌을 때 특성들이 서로 조건부 독립이라고 가정하기 때문",
        "사전확률을 쓰지 않기 때문",
        "학습 데이터를 모두 저장하기 때문",
        "베이즈 정리를 쓰지 않기 때문",
      ],
      answer: 0,
      explanation: "이 가정 덕분에 $P(x_1, \\ldots, x_n \\mid c) = \\prod_i P(x_i \\mid c)$로 계산이 쉬워진다. 판정에는 순서만 필요해 가정이 틀려도 잘 동작하는 경우가 많다.",
    },
    {
      key: "c2",
      question: "나이브 베이즈에서 라플라스 스무딩(개수에 1을 더하기)을 쓰는 이유는?",
      choices: [
        "학습 데이터에 없던 단어 하나 때문에 확률의 곱 전체가 0이 되는 것을 막으려고",
        "계산을 빠르게 하려고",
        "조건부 독립을 보장하려고",
        "클래스 불균형을 없애려고",
      ],
      answer: 0,
      explanation: "곱 안에 0이 하나라도 있으면 다른 증거와 관계없이 그 클래스의 확률이 0이 된다.",
    },
    {
      key: "c3",
      question: "단어가 수백 개인 문서에서 확률을 그대로 곱하지 않고 로그의 합으로 계산하는 이유는?",
      choices: [
        "작은 확률을 많이 곱하면 실수 표현 범위보다 작아져 0이 되기 때문(언더플로)",
        "로그를 쓰면 정확도가 올라가기 때문",
        "확률의 순서가 바뀌기 때문",
        "라플라스 스무딩을 대신하기 때문",
      ],
      answer: 0,
      explanation: "로그는 증가함수라 순서가 그대로이고, 곱이 합이 되어 아주 작은 값도 계산할 수 있다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
p_spam, p_ham = 0.3 * 0.6 * 0.4, 0.7 * 0.05 * 0.02
print(round(p_spam / (p_spam + p_ham), 4))
`,
      expected: "0.9904",
      explanation: "스팸 쪽 $0.072$, 정상 쪽 $0.0007$을 합이 1이 되도록 나누면 $0.072 / 0.0727 \\approx 0.9904$다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "나이브 베이즈의 조건부 독립 가정이 무엇인지 쓰고, 이 가정이 현실과 다른데도 분류를 잘 하는 이유와, 출력 확률을 그대로 위험도로 쓸 때 주의할 점을 쓰라.",
      answer: md`
조건부 독립 가정은 클래스가 주어지면 특성들이 서로 독립이라는 가정이다. 이 가정으로 $P(x_1, \ldots, x_n \mid c)$를 특성별 확률의 곱 $\prod_i P(x_i \mid c)$로 계산할 수 있다. 실제로는 "무료"와 "쿠폰"처럼 함께 나오는 단어가 많아 가정이 성립하지 않는다.

그래도 분류는 사후확률이 가장 큰 클래스를 고르는 일이라 확률의 정확한 값이 아니라 클래스 사이의 순서만 맞으면 된다. 상관된 단어의 증거가 중복으로 곱해져도 순서는 대개 유지된다. 대신 같은 증거를 여러 번 세므로 출력 확률이 0이나 1 쪽으로 치우치기 쉽다. 확률을 위험도로 쓰려면 신뢰도 표 등으로 보정을 확인하고 필요하면 다시 보정한다.
`,
      keyPoints: [
        "클래스가 주어지면 특성끼리 독립이라는 가정",
        "결합확률이 특성별 확률의 곱이 된다",
        "판정에는 순서만 필요해 가정이 틀려도 잘 동작한다",
        "확률이 극단으로 치우치므로 보정을 확인한다",
      ],
    },
  ],
  references: [
    { title: "scikit-learn — Naive Bayes", url: "https://scikit-learn.org/stable/modules/naive_bayes.html", note: "Gaussian·Multinomial 나이브 베이즈와 alpha (영문)" },
    { title: "Manning, Raghavan, Schütze — Introduction to Information Retrieval, 13장", url: "https://nlp.stanford.edu/IR-book/html/htmledition/naive-bayes-text-classification-1.html", note: "텍스트 분류와 로그 확률 계산 (영문)" },
  ],
});
