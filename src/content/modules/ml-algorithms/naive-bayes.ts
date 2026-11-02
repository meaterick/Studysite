import { defineLesson, md } from "../../kit";
import exercises from "./labs/naive-bayes";

export default defineLesson({
  id: "naive-bayes",
  title: "나이브 베이즈 분류기",
  tier: "supplement",
  goal: "KNN의 거리·다수결 예측과 $K$에 따른 편향-분산을, 나이브 베이즈의 조건부 독립 가정과 계산 과정을 설명할 수 있다.",
  why: "",
  body: md`
### K-최근접 이웃(KNN): 거리로 투표하는 분류기


K-최근접 이웃(K-Nearest Neighbors)은 핵심 과정의 회귀·로지스틱 회귀, 결정트리와 달리 파라미터 $w,b$를 학습시키는 과정 자체가 없다. 새로운 샘플이 들어오면 훈련 데이터 전체와의 거리를 계산해 가장 가까운 $K$개의 이웃을 찾고, 그 이웃들의 클래스 중 다수결로 새 샘플의 클래스를 정한다. 거리는 보통 유클리드 거리 $d(a,b)=\sqrt{\sum_i(a_i-b_i)^2}$를 쓴다.

:::example K=3으로 손수 분류해보기
훈련 데이터가 클래스 0인 세 점 $A(1,1),B(2,1),C(1,2)$와 클래스 1인 세 점 $D(5,5),E(6,5),F(5,6)$으로 이루어져 있다고 하자. 새 샘플 $X=(2,2)$의 클래스를 $K=3$으로 예측해보자.

| 이웃 | 좌표 | $X$까지의 거리 | 클래스 |
| --- | --- | --- | --- |
| B | $(2,1)$ | $\sqrt{0^2+1^2}=1.000$ | 0 |
| C | $(1,2)$ | $\sqrt{1^2+0^2}=1.000$ | 0 |
| A | $(1,1)$ | $\sqrt{1^2+1^2}\approx1.414$ | 0 |
| D | $(5,5)$ | $\sqrt{3^2+3^2}\approx4.243$ | 1 |
| E | $(6,5)$ | $\sqrt{4^2+3^2}=5.000$ | 1 |
| F | $(5,6)$ | $\sqrt{3^2+4^2}=5.000$ | 1 |

거리가 가장 짧은 3개는 $B,C,A$로 모두 클래스 0이므로 $X$는 클래스 0으로 분류된다. $K$값 자체가 하이퍼파라미터라는 점도 중요하다. $K$가 작으면(예: $K=1$) 이웃 하나의 잡음에도 예측이 크게 흔들려 분산이 큰 모델이 되고, $K$를 지나치게 크게 잡으면(예: 전체 데이터 개수만큼) 모든 예측이 전체 데이터의 다수 클래스로 뭉개져버려 편향이 큰 모델이 된다. 핵심 과정의 「편향-분산 트레이드오프와 정규화」 단계에서 본 트레이드오프가 KNN이라는 구체적인 알고리즘 위에서 나타나는 모습이다.
:::

[[diagram:knn-vote]]

방금 손으로 짚어본 거리 계산과 다수결을, 이번에는 (1) numpy로 직접 구현한 버전과 (2) sklearn이 제공하는 완성된 KNN 분류기 두 가지로 재현해보자. 두 결과가 똑같이 나오는지 확인하는 것이 목적이다.

\`\`\`python
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
import warnings
warnings.filterwarnings("ignore", category=RuntimeWarning)   # 브라우저 실행 환경(Pyodide)의 무해한 내부 경고 숨기기

# 위 표와 완전히 같은 데이터
X_train = np.array([[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]])
y_train = np.array([0, 0, 0, 1, 1, 1])
x_new = np.array([2, 2])

# 방법 1: 거리를 직접 계산한다
dists = np.sqrt(((X_train - x_new) ** 2).sum(axis=1))  # axis=1: 각 행(샘플)의 좌표(열) 방향으로 합산 → 샘플마다 거리 하나씩
for i in range(len(X_train)):
    print(f"점 ({X_train[i, 0]}, {X_train[i, 1]}): 거리={dists[i]:.3f}, 클래스={y_train[i]}")

k = 3
nearest_idx = np.argsort(dists)[:k]           # 거리를 기준으로 정렬했을 때의 인덱스, 앞 k개만
nearest_classes = y_train[nearest_idx]        # 그 인덱스 위치의 클래스만 골라내는 "팬시 인덱싱"
pred_by_hand = np.bincount(nearest_classes).argmax()  # 가장 많이 등장한 값(다수결)
print(f"\nK={k} 최근접 이웃의 클래스: {[int(c) for c in nearest_classes]} → 다수결 예측 = {pred_by_hand}")

# 방법 2: sklearn의 KNeighborsClassifier로 같은 예측을 재현
clf = KNeighborsClassifier(n_neighbors=k).fit(X_train, y_train)
print("sklearn 예측:", clf.predict([x_new])[0])
\`\`\`

\`np.argsort(dists)\`는 값을 직접 정렬하는 대신 "정렬했을 때의 원래 인덱스 순서"를 돌려준다. 그래서 \`y_train[nearest_idx]\`처럼 이 인덱스 배열을 다른 배열에 그대로 넣으면, 정렬 순서대로 원하는 원소들만 쏙쏙 뽑아낼 수 있다. 이런 인덱싱 방식을 팬시 인덱싱(fancy indexing)이라 부른다. 마지막 두 줄에서 "손으로" 만든 예측과 sklearn의 \`clf.fit(X_train, y_train).predict(...)\` 예측이 똑같이 나온다면, sklearn 내부에서도 결국 우리가 손으로 한 것과 같은 계산(거리를 재고, 그다음 다수결로 정하는 것)이 일어난다는 뜻이다.

[[diagram:knn-k-effect]]

### KNN 앞에는 반드시 스케일링

KNN은 거리로만 판단하므로 특징의 단위가 다르면 큰 값의 특징이 거리를 독차지한다. 나이(세)와 연봉(만 원)으로 이웃을 찾는다고 하자. 기준 고객 $A = (30, 3000)$에게 $B = (31, 3500)$과 $C = (58, 3050)$ 중 누가 더 비슷할까? 그대로 계산하면 $d(A, B) = \sqrt{1^2 + 500^2} \approx 500$, $d(A, C) = \sqrt{28^2 + 50^2} \approx 57$이라 나이가 28살이나 차이 나는 $C$가 가장 가까운 이웃이 된다. 연봉 500만 원 차이가 나이 28살 차이를 압도한 것이다. 나이 범위 40, 연봉 범위 6000으로 Min-Max 정규화하면 $d(A, B) \approx 0.087$, $d(A, C) \approx 0.700$으로 상식대로 $B$가 가까워진다. 그래서 KNN(과 거리를 쓰는 K-Means·SVM)은 항상 스케일링과 함께 파이프라인에 넣는다.

[[diagram:knn-scaling]]

### 나이브 베이즈(Naive Bayes): 베이즈 정리로 분류하기


1주차에서 배운 베이즈 정리 $P(A|B)=\dfrac{P(B|A)P(A)}{P(B)}$를 분류 문제에 그대로 적용한 것이 나이브 베이즈다. 어떤 샘플이 특징 $x_1,x_2,\dots,x_n$을 가질 때 클래스 $c$일 확률은 베이즈 정리로 $P(c|x_1,\dots,x_n)\propto P(c)\,P(x_1,\dots,x_n|c)$로 쓸 수 있는데, 특징이 여러 개면 $P(x_1,\dots,x_n|c)$를 직접 계산하기가 매우 어렵다. 그래서 나이브 베이즈는 "클래스가 주어졌을 때 특징들이 서로 조건부 독립이다"라는, 현실에서는 대체로 정확히 성립하지 않는 과감한(naive) 가정을 세운다. 이 가정 덕분에 결합확률이 개별 확률의 곱으로 쪼개진다.

\`\`\`math
P(c \mid x_1,\dots,x_n) \;\propto\; P(c)\prod_{i=1}^n P(x_i \mid c)
\`\`\`

가정이 틀렸는데도(특징들이 실제로는 서로 얼마간 상관되어 있어도) 나이브 베이즈는 실전에서 의외로 잘 작동하는 경우가 많다. 최종 목적이 확률값 자체의 정확도가 아니라 "어느 클래스의 확률이 더 큰가"라는 순위 비교이기 때문이다.

:::example 스팸 필터에 나이브 베이즈 적용하기
메일 100통이 든 메일함을 생각하자(핵심 과정 「분류 평가지표」 단계의 스팸 필터와 같은 메일함이다). 사전 확률은 $P(\text{스팸})=0.3$, $P(\text{정상})=0.7$이다(메일 100통 중 스팸 30통). 어떤 메일에 "무료"와 "당첨"이라는 두 단어가 함께 등장했고, 과거 데이터로부터 각 단어가 클래스별로 등장할 확률을 다음과 같이 추정했다고 하자: $P(\text{무료}|\text{스팸})=0.6$, $P(\text{무료}|\text{정상})=0.05$, $P(\text{당첨}|\text{스팸})=0.4$, $P(\text{당첨}|\text{정상})=0.02$.

특징이 조건부 독립이라 가정하면,

- $P(\text{스팸})\times P(\text{무료}|\text{스팸})\times P(\text{당첨}|\text{스팸}) = 0.3\times0.6\times0.4 = 0.072$
- $P(\text{정상})\times P(\text{무료}|\text{정상})\times P(\text{당첨}|\text{정상}) = 0.7\times0.05\times0.02 = 0.0007$

두 값을 더해 1이 되도록 정규화하면 $P(\text{스팸}\mid\text{무료, 당첨}) = \dfrac{0.072}{0.072+0.0007} \approx 99.0\%$다. "무료"와 "당첨"이라는 두 단어만으로도 스팸일 확률이 99%까지 치솟는다는 것을 확인할 수 있다.
:::

[[diagram:nb-evidence]]

이 계산 전체를 코드 몇 줄로 그대로 옮겨보자. 새로운 문법은 없고, 지금까지 배운 변수·연산자만으로 충분하다. 오히려 "복잡한 수식도 결국 코드로는 이렇게 짧게 끝난다"는 것을 확인하는 것이 이 셀의 목적이다.

\`\`\`python
# 위 스팸 필터 예시를 코드로 검산
p_spam, p_normal = 0.3, 0.7
p_free_given_spam, p_free_given_normal = 0.6, 0.05
p_win_given_spam, p_win_given_normal = 0.4, 0.02

# 조건부 독립 가정: P(스팸)×P(무료|스팸)×P(당첨|스팸)
score_spam = p_spam * p_free_given_spam * p_win_given_spam
score_normal = p_normal * p_free_given_normal * p_win_given_normal
p_spam_given_words = score_spam / (score_spam + score_normal)  # 두 점수를 더해 1이 되도록 정규화

print(f"스팸 쪽 점수 = {score_spam:.4f}")
print(f"정상 쪽 점수 = {score_normal:.6f}")
print(f"P(스팸 | 무료, 당첨) = {p_spam_given_words:.4f} ({p_spam_given_words * 100:.1f}%)")
\`\`\`

\`p_spam, p_normal = 0.3, 0.7\`처럼 쉼표로 나열한 값을 쉼표로 나열한 변수에 한 줄로 나눠 담는 것을 다중 할당(multiple assignment)이라 부른다. 왼쪽 개수와 오른쪽 개수가 정확히 같아야 하며, 왼쪽부터 순서대로 하나씩 짝지어 대입된다. 관련 있는 변수 여러 개를 선언할 때 한 줄로 줄여 쓰는 흔한 방법이다.

### 확률 0의 함정과 라플라스 스무딩

나이브 베이즈는 확률을 **곱하므로** 하나라도 0이면 전체가 0이 된다. 훈련 데이터의 정상 메일 70통에 "할인"이라는 단어가 한 번도 없었다면 $P(\text{할인}\mid\text{정상}) = 0$이 되고, 이후 "할인"이 들어간 메일은 다른 단어가 아무리 정상 메일 같아도 정상일 확률이 0이 된다. 훈련 데이터에 우연히 없었을 뿐인데 판결이 확정되는 것이다. 이를 막는 표준 방법이 **라플라스 스무딩**이다. 모든 개수에 1을 더해 "본 적 없는 일도 작은 확률은 있다"고 둔다. 단어가 있다/없다 두 경우만 보는 경우라면

\`\`\`math
P(\text{할인} \mid \text{정상}) = \frac{0 + 1}{70 + 2} \approx 0.014
\`\`\`

로 0이 아닌 작은 값이 된다. sklearn의 \`MultinomialNB(alpha=1.0)\`의 \`alpha\`가 이 더하는 값이다.
`,
  checks: [
    {
      key: "c1",
      question: "KNN이 다른 모델과 가장 다른 점은?",
      choices: ["확률을 전혀 쓰지 않는다", "파라미터 $w, b$를 학습하는 과정 없이 예측 때 훈련 데이터와의 거리를 계산한다", "회귀에는 쓸 수 없다", "특징 스케일링이 필요 없다"],
      answer: 1,
      explanation: "KNN은 훈련 데이터를 저장해두고 예측할 때마다 거리를 잰다. 거리 기반이라 오히려 스케일링이 매우 중요하다.",
    },
    {
      key: "c2",
      question: "KNN에서 $K = 1$일 때 훈련 정확도가 거의 항상 1.0이 되는 이유는?",
      choices: ["모델이 완벽해서", "훈련 샘플의 가장 가까운 이웃이 자기 자신이라서", "$K$가 작을수록 편향이 커서", "테스트 데이터를 봤기 때문에"],
      answer: 1,
      explanation: "자기 자신과의 거리가 0이므로 자기 레이블을 그대로 답한다. 그래서 훈련 정확도는 일반화 성능을 전혀 말해주지 않는다.",
    },
    {
      key: "c3",
      question: "나이브 베이즈가 \"나이브(naive)\"한 이유는?",
      choices: ["사전확률을 무시해서", "클래스가 주어졌을 때 특징들이 서로 조건부 독립이라고 가정해서", "데이터를 전부 외워서", "베이즈 정리를 쓰지 않아서"],
      answer: 1,
      explanation: "이 가정 덕분에 $P(x_1,\\dots,x_n|c) = \\prod_i P(x_i|c)$로 쪼개져 계산이 쉬워진다. 순위 비교만 맞으면 되므로 가정이 틀려도 잘 작동하는 경우가 많다.",
    },
    {
      key: "c4",
      question: "나이(20~60)와 연봉(2000~8000만 원)을 그대로 KNN에 넣으면 생기는 문제는?",
      choices: ["연봉의 값이 커서 거리를 거의 연봉 차이만으로 정하게 된다", "나이가 거리를 독차지한다", "KNN은 단위의 영향을 받지 않는다", "학습 시간이 0이 된다"],
      answer: 0,
      explanation: "유클리드 거리는 각 축의 차이를 그대로 제곱해 더하므로 숫자가 큰 특징이 지배한다. 스케일링으로 축을 맞춘 뒤 거리를 재야 한다.",
    },
    {
      key: "c5",
      question: "나이브 베이즈에서 라플라스 스무딩(개수에 1을 더하기)을 쓰는 이유는?",
      choices: ["훈련 데이터에 없던 단어 하나 때문에 확률 곱 전체가 0이 되는 것을 막으려고", "계산을 빠르게 하려고", "특징들의 조건부 독립을 보장하려고", "클래스 불균형을 없애려고"],
      answer: 0,
      explanation: "곱 안에 0이 하나라도 있으면 다른 증거와 상관없이 그 클래스의 확률이 0이 된다. 1을 더해 본 적 없는 경우에도 작은 확률을 남긴다.",
    },
    {
      key: "c6",
      question: "방 개수(1~5)와 면적(20~200㎡) 두 특징으로 KNN을 할 때 스케일링을 하지 않으면?",
      choices: ["KNN은 거리 기반이 아니라서 아무 영향이 없다", "값의 범위가 큰 면적이 거리를 사실상 혼자 결정해, 방 개수 정보가 거의 무시된다", "방 개수가 거리를 지배한다", "K가 자동으로 커져 과소적합된다"],
      answer: 1,
      explanation: "유클리드 거리는 각 특징 차이의 제곱합이므로 범위가 큰 특징의 차이(수십~수백)가 작은 특징의 차이(1~4)를 압도합니다. 표준화나 Min-Max 정규화로 범위를 맞춘 뒤 거리를 재야 두 특징이 공정하게 반영됩니다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "KNN에서 K=1일 때와 K=전체 샘플 수일 때, 각각 편향과 분산이 어떻게 되는가?",
      answer: md`
K=1은 가장 가까운 점 하나에만 의존해 노이즈에 민감해지므로 분산이 커지고(과적합), K를 데이터 전체 크기만큼 키우면 모든 예측이 전체 평균/다수결로 수렴해 세밀한 패턴을 놓치므로 편향이 커진다(과소적합).
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "나이브 베이즈의 '나이브(naive)'는 정확히 어떤 가정을 가리키는가? 그 가정이 현실과 다른데도 실전에서 잘 작동하는 이유는?",
      answer: md`
나이브 베이즈는 모든 특징이 클래스가 주어졌을 때 서로 조건부 독립이라고 가정한다(실제로는 대부분 성립하지 않아 'naive'다). 그럼에도 각 클래스에 대한 상대적 점수의 순위만 맞으면 분류가 되기 때문에, 가정이 어긋나도 실전에서는 상당히 잘 작동하는 경우가 많다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "scikit-learn — Nearest Neighbors", url: "https://scikit-learn.org/stable/modules/neighbors.html", note: "KNN 분류·회귀와 거리 척도" },
    { title: "scikit-learn — Naive Bayes", url: "https://scikit-learn.org/stable/modules/naive_bayes.html", note: "Gaussian·Multinomial 나이브 베이즈 비교" },
  ],
});
