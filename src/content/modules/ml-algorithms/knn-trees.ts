import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/knn-trees";

export default defineLesson({
  id: "knn-trees",
  title: "k최근접 이웃, 결정트리, 랜덤 포레스트",
  tier: "core",
  concepts: ["knn-trees-forests"],
  goal: "KNN의 거리 계산과 다수결 예측을 구현하고 K와 스케일링의 영향을 설명하며, 지니 불순도로 결정트리의 분할을 계산하고 깊이로 복잡도를 조절하며, 부트스트랩과 특성 무작위 선택으로 랜덤 포레스트가 분산을 줄이는 원리를 설명한다.",
  why: "KNN과 결정트리는 선형 모델과 다른 방식으로 비선형 경계를 만드는 대표 모델이고, 랜덤 포레스트는 표 데이터에서 하이퍼파라미터를 거의 조정하지 않아도 성능이 좋아 비교의 기준으로 자주 쓰인다. 비슷한 샘플을 거리로 찾는 방식은 검색 증강 생성의 검색 단계([[lesson:retrieval]])에서, 여러 모델을 합치는 방식은 부스팅([[lesson:boosting]])에서 다시 쓰인다.",
  body: md`
### k최근접 이웃

**k최근접 이웃**(KNN)은 학습 단계에서 데이터를 저장만 하고, 예측할 때 새 샘플과 모든 학습 샘플의 거리를 계산해 가장 가까운 $K$개의 정답으로 판정한다. 분류는 다수결, 회귀는 평균을 쓴다. 거리는 보통 유클리드 거리 $d(a, b) = \sqrt{\sum_j (a_j - b_j)^2}$다([[lesson:vector-operations]]).

\`\`\`python
import numpy as np
from sklearn.neighbors import KNeighborsClassifier

X_train = np.array([[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]])
y_train = np.array([0, 0, 0, 1, 1, 1])
x_new = np.array([2, 2])

dists = np.sqrt(((X_train - x_new) ** 2).sum(axis=1))    # 학습 샘플마다 거리
nearest = np.argsort(dists)[:3]                          # 가장 가까운 3개의 위치
print(np.round(dists, 3), y_train[nearest], np.bincount(y_train[nearest]).argmax())
# [1.414 1.    1.    4.243 5.    5.   ] [0 0 0] 0

clf = KNeighborsClassifier(n_neighbors=3).fit(X_train, y_train)
print(clf.predict([x_new]))                              # [0]
\`\`\`

**K는 복잡도를 정한다.** $K = 1$이면 가장 가까운 샘플 하나의 정답을 그대로 따르므로 학습 데이터의 잡음까지 반영해 분산이 크다. 학습 샘플은 자기 자신이 가장 가까운 이웃이라 학습 정확도는 항상 1이다. $K$를 학습 데이터 수만큼 키우면 모든 예측이 다수 클래스가 되어 편향이 크다([[lesson:bias-variance]]). $K$는 교차검증으로 고른다.

[[diagram:knn-k-effect]]

**KNN 앞에는 스케일링이 필요하다.** 거리는 각 특성의 차이를 그대로 제곱해 더하므로 값의 범위가 큰 특성이 거리를 정한다. 나이(세)와 연봉(만 원)으로 이웃을 찾으면, 기준 고객 $A = (30, 3000)$에게 $B = (31, 3500)$보다 $C = (58, 3050)$이 더 가깝게 계산된다($\sqrt{1^2 + 500^2} \approx 500$ 대 $\sqrt{28^2 + 50^2} \approx 57$). 특성마다 범위를 맞추면 $B$가 더 가까워진다. 그래서 KNN은 표준화와 함께 파이프라인에 넣는다([[lesson:encoding-scaling]]).

[[diagram:knn-scaling]]

### 결정트리

**결정트리**는 "특성 $j$가 기준값 $t$ 이하인가"라는 질문으로 데이터를 둘로 나누는 일을 반복하고, 끝에 남은 영역(잎)에서 가장 많은 클래스로 판정한다. 질문은 나눈 뒤의 데이터가 한 클래스에 가까울수록 좋다. 이 정도를 **지니 불순도** $G = 1 - \sum_i p_i^2$로 잰다. $p_i$는 그 노드에서 클래스 $i$의 비율이다. 한 클래스만 있으면 0, 두 클래스가 반반이면 0.5다. 분할마다 부모의 지니에서 자식 지니의 샘플 수 가중 평균을 뺀 **정보이득**이 가장 큰 질문을 고른다. 엔트로피 $-\sum_i p_i \log_2 p_i$를 불순도로 쓰기도 한다([[lesson:entropy-kl]]).

\`\`\`python
import numpy as np

def gini(counts):
    p = np.asarray(counts, dtype=float) / np.sum(counts)
    return 1 - np.sum(p ** 2)

parent, left, right = [5, 3], [3, 1], [2, 2]             # 클래스별 샘플 수: 함 / 안 함
split = 4 / 8 * gini(left) + 4 / 8 * gini(right)         # 자식의 가중 평균
print(round(gini(parent), 4), round(split, 4), round(gini(parent) - split, 4))   # 0.4688 0.4375 0.0312
\`\`\`

[[diagram:gini-split]]

깊이를 제한하지 않은 트리는 모든 잎이 한 클래스만 남을 때까지 나누므로 학습 정확도가 1이 되고, 학습 데이터의 잡음까지 따라가 분산이 크다. \`max_depth\`(최대 깊이)나 \`min_samples_leaf\`(잎의 최소 샘플 수)로 복잡도를 제한한다. 트리는 특성의 크기 비교만 하므로 스케일링이 필요 없다.

### 랜덤 포레스트

**배깅**(bagging)은 학습 데이터에서 같은 수만큼 중복을 허용해 뽑은 **부트스트랩 표본**으로 모델을 여러 개 학습하고, 예측을 평균(회귀)하거나 다수결(분류)로 합친다. 한 샘플이 부트스트랩 표본에 한 번도 뽑히지 않을 확률은 $(1 - 1/n)^n \approx 1/e \approx 0.37$이므로, 모델마다 원래 샘플의 약 63%를 보고 나머지 37%(OOB 샘플)는 그 모델의 검증에 쓸 수 있다.

[[diagram:bootstrap-bagging]]

**랜덤 포레스트**는 결정트리를 배깅하면서, 분할마다 특성의 일부만 무작위로 후보에 넣는다(\`max_features\`). 예측력이 강한 특성 하나를 모든 트리가 같은 위치에서 쓰면 트리들이 비슷해져 평균해도 분산이 덜 줄어든다. 특성을 무작위로 제한하면 트리 사이의 상관이 낮아져 평균의 분산이 더 줄어든다([[lesson:bias-variance-theory]]).

\`\`\`python
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

X, y = load_breast_cancer(return_X_y=True)
cv = StratifiedKFold(5, shuffle=True, random_state=0)
for name, m in [("트리(깊이 제한 없음)", DecisionTreeClassifier(random_state=0)),
                ("트리(max_depth=3)", DecisionTreeClassifier(max_depth=3, random_state=0)),
                ("랜덤 포레스트(트리 100개)", RandomForestClassifier(n_estimators=100, random_state=0))]:
    s = cross_val_score(m, X, y, cv=cv)
    print(f"{name}: 평균 {s.mean():.3f}, fold 점수 {np.round(s, 3)}")
# 트리(깊이 제한 없음): 평균 0.926, fold 점수 [0.886 0.939 0.939 0.921 0.947]
# 트리(max_depth=3): 평균 0.930, fold 점수 [0.895 0.956 0.93  0.912 0.956]
# 랜덤 포레스트(트리 100개): 평균 0.965, fold 점수 [0.939 0.965 0.974 0.965 0.982]
\`\`\`

깊이를 제한하지 않은 트리 하나는 0.926이지만, 같은 트리를 100개 평균한 랜덤 포레스트는 0.965로 모든 fold에서 더 높다. 트리 하나하나는 분산이 크지만, 서로 다른 데이터와 특성으로 자란 트리들의 오차가 평균하면서 일부 상쇄되기 때문이다.

:::warn 흔한 실수
- **KNN에 스케일링 없이 특성을 넣는다.** 값의 범위가 큰 특성 하나가 거리를 정한다.
- **K = 1이나 깊이 제한 없는 트리의 학습 정확도로 모델을 판단한다.** 둘 다 학습 정확도가 1이 되는 구조다. 검증 데이터로 평가한다.
- **랜덤 포레스트의 트리 수를 늘리면 과적합한다고 생각한다.** 트리 수를 늘리면 평균이 안정될 뿐 과적합이 커지지 않는다. 늘릴수록 계산 시간만 늘어난다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "KNN에서 $K = 1$일 때 학습 정확도가 거의 항상 1이 되는 이유는?",
      choices: [
        "학습 샘플의 가장 가까운 이웃이 자기 자신이기 때문",
        "모델이 새 데이터에서도 완벽하기 때문",
        "$K$가 작을수록 편향이 크기 때문",
        "테스트 데이터를 학습에 썼기 때문",
      ],
      answer: 0,
      explanation: "자기 자신과의 거리가 0이므로 자기 정답을 그대로 답한다. 그래서 학습 정확도는 일반화 성능을 알려 주지 않는다.",
    },
    {
      key: "c2",
      question: "방 개수(1~5)와 면적(20~200㎡) 두 특성으로 KNN을 할 때 스케일링을 하지 않으면?",
      choices: [
        "범위가 큰 면적이 거리를 거의 혼자 정해, 방 개수 정보가 거의 쓰이지 않는다",
        "방 개수가 거리를 정한다",
        "KNN은 거리를 쓰지 않으므로 영향이 없다",
        "K가 자동으로 커진다",
      ],
      answer: 0,
      explanation: "유클리드 거리는 각 특성 차이의 제곱합이다. 면적 차이(수십~수백)가 방 개수 차이(1~4)보다 훨씬 커서 거리를 거의 결정하므로 표준화로 범위를 맞춘 뒤 거리를 잰다.",
    },
    {
      key: "c3",
      question: "양성 4개, 음성 4개가 섞인 노드의 지니 불순도는?",
      choices: ["0.5", "0", "0.25", "1"],
      answer: 0,
      explanation: "$1 - (4/8)^2 - (4/8)^2 = 0.5$다. 두 클래스가 반반일 때 이진 분류의 지니 불순도가 가장 크다.",
    },
    {
      key: "c4",
      question: "랜덤 포레스트가 분할마다 특성의 일부만 무작위로 후보로 쓰는 이유는?",
      choices: [
        "트리 사이의 상관을 낮춰, 평균했을 때 분산이 더 줄어들게 하려고",
        "계산 속도를 높이려고만",
        "편향을 줄이려고",
        "트리의 깊이를 제한하려고",
      ],
      answer: 0,
      explanation: "강한 특성 하나를 모든 트리가 똑같이 쓰면 트리들이 비슷해져 평균의 효과가 약해진다. 상관된 예측의 평균은 분산이 덜 줄어든다.",
    },
    {
      key: "c5",
      question: "샘플 1만 개로 부트스트랩 표본(1만 번, 중복 허용)을 만들면 서로 다른 원래 샘플은 대략 몇 %가 들어가는가?",
      choices: ["약 63%", "100%", "50%", "약 37%"],
      answer: 0,
      explanation: "한 샘플이 한 번도 뽑히지 않을 확률은 $(1 - 1/n)^n \\approx 1/e \\approx 0.368$이다. 그래서 약 63%가 들어가고 나머지 약 37%가 OOB 샘플이 된다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
counts = np.array([6, 2])
p = counts / counts.sum()
print(round(1 - np.sum(p ** 2), 4))
`,
      expected: "0.375",
      explanation: "클래스 비율이 $6/8 = 0.75$와 $2/8 = 0.25$이므로 지니 불순도는 $1 - 0.5625 - 0.0625 = 0.375$다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "KNN에서 K = 1일 때와 K = 학습 데이터 수일 때의 예측을 편향과 분산으로 설명하고, K를 고르는 방법과 KNN 앞에 스케일링이 필요한 이유를 쓰라.",
      answer: md`
K = 1이면 가장 가까운 학습 샘플 하나의 정답을 그대로 따르므로 잡음이 섞인 샘플 하나에도 예측이 바뀐다. 학습 데이터가 바뀌면 예측이 크게 달라지므로 분산이 크고, 학습 정확도는 1이지만 새 데이터에서는 떨어진다(과적합). K를 학습 데이터 수만큼 키우면 모든 예측이 전체의 다수 클래스가 되어 입력에 따른 차이를 나타내지 못하므로 편향이 크다(과소적합).

K는 하이퍼파라미터이므로 교차검증으로 검증 점수가 가장 좋은 값을 고른다. KNN은 특성 차이의 제곱합으로 거리를 재므로 범위가 큰 특성이 거리를 정한다. 표준화로 특성의 범위를 맞춰야 모든 특성이 거리에 반영된다.
`,
      keyPoints: [
        "K = 1: 분산이 크다(과적합), 학습 정확도 1",
        "K = 학습 데이터 수: 다수 클래스만 예측, 편향이 크다",
        "K는 교차검증으로 고른다",
        "범위가 큰 특성이 거리를 정하므로 표준화한다",
      ],
    },
    {
      key: "d2",
      question: "깊이를 제한하지 않은 결정트리 하나보다 랜덤 포레스트의 검증 점수가 높은 이유를, 부트스트랩과 특성 무작위 선택이 각각 하는 일로 설명하라.",
      answer: md`
깊이를 제한하지 않은 트리는 학습 데이터의 잡음까지 따라가 분산이 크다. 랜덤 포레스트는 부트스트랩 표본마다 트리를 하나씩 학습해, 트리마다 조금씩 다른 데이터를 보게 한다. 트리들의 예측을 평균하면 각 트리가 잡음 때문에 틀린 부분이 서로 일부 상쇄되어 분산이 줄어든다.

예측을 평균할 때 줄어드는 분산의 양은 트리 사이의 상관이 낮을수록 크다. 특성 무작위 선택은 분할마다 특성의 일부만 후보로 주어, 강한 특성 하나를 모든 트리가 같은 위치에 쓰는 것을 막고 트리 사이의 상관을 낮춘다. 그래서 같은 수의 트리를 평균해도 분산이 더 많이 줄어든다.
`,
      keyPoints: [
        "트리 하나는 분산이 크다",
        "부트스트랩: 트리마다 다른 데이터, 평균하면 분산이 줄어든다",
        "줄어드는 양은 트리 사이 상관이 낮을수록 크다",
        "특성 무작위 선택이 상관을 낮춘다",
      ],
    },
  ],
  references: [
    { title: "ISLP (An Introduction to Statistical Learning with Python) — 8장 Tree-Based Methods", url: "https://www.statlearning.com/", note: "결정트리·배깅·랜덤 포레스트 (영문, 무료 PDF)" },
    { title: "scikit-learn — Nearest Neighbors", url: "https://scikit-learn.org/stable/modules/neighbors.html", note: "KNN 분류·회귀와 거리 (영문)" },
    { title: "scikit-learn — Ensembles: Random forests", url: "https://scikit-learn.org/stable/modules/ensemble.html#random-forests-and-other-randomized-tree-ensembles", note: "max_features와 OOB 점수 (영문)" },
  ],
});
