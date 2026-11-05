import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/classification-metrics";

export default defineLesson({
  id: "classification-metrics",
  title: "혼동행렬, 정확도, 정밀도, 재현율, F1",
  tier: "core",
  concepts: ["classification-metrics"],
  goal: "혼동행렬에서 정확도·정밀도·재현율·F1·특이도를 계산하고, 오류 비용에 따라 우선할 지표를 고르며, 분류 임계값을 바꿀 때 정밀도와 재현율이 어떻게 달라지는지 설명하고, 다중 분류의 macro·weighted 평균을 해석한다.",
  why: "분류 모델의 성능을 정확도 하나로 보고하면 불균형한 데이터에서 아무것도 찾지 못하는 모델도 좋아 보인다([[lesson:baselines]]). 어떤 오류가 더 비싼지에 따라 봐야 할 지표가 다르고, 같은 모델도 임계값에 따라 지표가 바뀐다. 이 레슨의 지표는 ROC·PR 곡선([[lesson:roc-pr]])과 언어 모델의 분류형 평가([[lesson:llm-evaluation]])에서도 그대로 쓴다.",
  body: md`
### 혼동행렬

이진 분류에서 관심 있는 클래스(사기 거래, 스팸, 질병)를 **양성**, 나머지를 **음성**이라 한다. **혼동행렬**은 예측과 정답의 조합 네 가지를 센 표다.

[[diagram:confusion-matrix]]

scikit-learn의 \`confusion_matrix(y_true, y_pred)\`는 클래스 번호 순서로 행(실제)과 열(예측)을 놓으므로 \`[[TN, FP], [FN, TP]]\` 순서로 나온다.

### 지표 다섯 가지

\`\`\`math
\text{정확도} = \frac{TP + TN}{\text{전체}} \qquad \text{정밀도} = \frac{TP}{TP + FP} \qquad \text{재현율} = \frac{TP}{TP + FN} \qquad F_1 = \frac{2 \cdot \text{정밀도} \cdot \text{재현율}}{\text{정밀도} + \text{재현율}} \qquad \text{특이도} = \frac{TN}{TN + FP}
\`\`\`

**정밀도**(precision)는 양성으로 판정한 것 가운데 실제 양성의 비율이고, **재현율**(recall, 민감도)은 실제 양성 가운데 찾아낸 비율이다. **F1**은 둘의 조화평균이라 한쪽이 낮으면 함께 낮아진다. **특이도**(specificity)는 실제 음성 가운데 음성으로 맞힌 비율이다.

메일 100통 가운데 실제 스팸이 30통이고, 필터가 스팸으로 판정한 25통 중 20통이 실제 스팸이라면 TP 20, FP 5, FN 10, TN 65다. 정확도 85%, 정밀도 $20/25 = 80\%$, 재현율 $20/30 \approx 66.7\%$, F1 $\approx 72.7\%$, 특이도 $65/70 \approx 92.9\%$다. 정확도 85%만 보면 놓친 스팸 10통이 드러나지 않는다.

[[diagram:spam-waffle]]

**어느 지표를 우선할지는 오류의 비용으로 정한다.** 암 검진처럼 양성을 놓치는 비용(FN)이 크면 재현율을, 스팸 필터처럼 정상 메일을 잘못 거르는 비용(FP)이 크면 정밀도를 우선한다. 둘 다 중요하면 F1을 본다. 정확도는 클래스가 불균형하면 다수 클래스 기준 모델과 차이가 작아지므로, 기준 모델의 정확도와 함께 보고한다.

### 임계값에 따라 지표가 바뀐다

정밀도와 재현율은 분류 임계값 하나를 정했을 때의 값이다([[lesson:logistic-regression]]). 다음 코드는 양성이 약 10%인 데이터에서 로지스틱 회귀를 학습하고, 임계값 0.5에서 혼동행렬을 센 뒤 임계값을 바꿔 가며 정밀도와 재현율을 계산한다.

\`\`\`python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, precision_score, recall_score

X, y = make_classification(n_samples=2000, n_features=8, n_informative=4, weights=[0.9], class_sep=1.5, random_state=1)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, stratify=y, random_state=0)
clf = LogisticRegression(max_iter=1000).fit(X_tr, y_tr)
p = clf.predict_proba(X_te)[:, 1]                     # 양성 확률

tn, fp, fn, tp = confusion_matrix(y_te, (p >= 0.5).astype(int)).ravel()
print(tp, fp, fn, tn)                                 # 39 5 24 532
print(round((tp + tn) / len(y_te), 3), round(1 - y_te.mean(), 3))   # 0.952 0.895: 정확도, 다수 클래스 기준 모델
for t in [0.1, 0.3, 0.5, 0.7]:
    pred = (p >= t).astype(int)
    print(t, round(precision_score(y_te, pred), 3), round(recall_score(y_te, pred), 3))
# 0.1 0.467 0.905
# 0.3 0.787 0.762
# 0.5 0.886 0.619
# 0.7 0.893 0.397
\`\`\`

임계값 0.5에서 정확도 0.952는 높아 보이지만 기준 모델(0.895)과의 차이는 5.7%p이고, 실제 양성 63개 가운데 24개를 놓친다(재현율 0.619). 임계값을 0.1로 낮추면 재현율이 0.905로 오르는 대신 양성 판정의 절반 이상이 틀린다(정밀도 0.467). 임계값을 올리면 그 반대다. 모델은 같고 판정 기준만 바뀌었으므로, 지표를 보고할 때는 어떤 임계값에서의 값인지 함께 적는다. 모든 임계값에서의 변화를 한 번에 보는 방법이 ROC·PR 곡선이다([[lesson:roc-pr]]).

### 다중 분류: macro 평균과 weighted 평균

클래스가 여러 개이면 클래스마다 그 클래스를 양성으로 보고 정밀도·재현율을 계산한다. \`classification_report\`는 클래스별 값과 실제 샘플 수(**support**), 두 가지 평균을 보여 준다. **macro 평균**은 클래스별 값을 단순 평균하고, **weighted 평균**은 support로 가중 평균한다.

| 클래스 | support | 재현율 |
| --- | --- | --- |
| A | 80 | 0.9 |
| B | 15 | 0.6 |
| C | 5 | 0.2 |

macro 재현율은 $(0.9 + 0.6 + 0.2)/3 \approx 0.567$, weighted 재현율은 $(0.9 \times 80 + 0.6 \times 15 + 0.2 \times 5)/100 = 0.82$다. weighted 평균은 다수 클래스의 값에 가까워지므로, 소수 클래스 C가 다섯 개 중 네 개를 놓치는 문제가 가려진다. 소수 클래스가 중요하면 macro 평균과 클래스별 값을 함께 본다.

:::warn 흔한 실수
- **불균형한 데이터에서 정확도만 보고한다.** 다수 클래스 기준 모델의 정확도와 재현율·정밀도를 함께 적는다.
- **정밀도와 재현율의 분모를 바꿔 쓴다.** 정밀도는 예측한 양성(열), 재현율은 실제 양성(행)이 분모다.
- **임계값을 밝히지 않고 정밀도·재현율을 보고한다.** 같은 모델도 임계값에 따라 값이 크게 달라진다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$TP = 40$, $FP = 10$, $FN = 20$일 때 정밀도와 재현율은?",
      choices: ["정밀도 0.8, 재현율 0.667", "정밀도 0.667, 재현율 0.8", "정밀도 0.8, 재현율 0.8", "정밀도 0.4, 재현율 0.2"],
      answer: 0,
      explanation: "정밀도 $= 40/50 = 0.8$, 재현율 $= 40/60 \\approx 0.667$이다.",
    },
    {
      key: "c2",
      question: "암을 놓치는 것(FN)의 비용이 가장 큰 검진 모델에서 우선할 지표와 임계값을 움직일 방향은?",
      choices: [
        "재현율을 우선하고, 임계값을 낮춘다",
        "정밀도를 우선하고, 임계값을 올린다",
        "특이도를 우선하고, 임계값을 올린다",
        "정확도를 우선하고, 임계값은 0.5로 둔다",
      ],
      answer: 0,
      explanation: "재현율은 실제 양성 가운데 찾아낸 비율이다. 임계값을 낮추면 양성 판정이 늘어 재현율이 오르고, 대신 잘못된 양성 판정(FP)이 늘어난다.",
    },
    {
      key: "c3",
      question: "같은 모델의 분류 임계값을 0.5에서 0.7로 올리면 대체로 어떻게 되는가?",
      choices: [
        "양성 판정이 줄어 정밀도는 오르고 재현율은 내려간다",
        "정밀도와 재현율이 모두 오른다",
        "재현율은 오르고 정밀도는 내려간다",
        "모델을 다시 학습해야 지표가 바뀐다",
      ],
      answer: 0,
      explanation: "확실한 경우만 양성으로 판정하므로 판정의 정확성(정밀도)은 대체로 오르고, 놓치는 양성이 늘어 재현율은 내려간다.",
    },
    {
      key: "c4",
      question: "클래스 A(support 90, 재현율 1.0)와 B(support 10, 재현율 0.0)의 macro 평균 재현율과 weighted 평균 재현율은?",
      choices: ["macro 0.5, weighted 0.9", "macro 0.9, weighted 0.5", "둘 다 0.5", "둘 다 0.9"],
      answer: 0,
      explanation: "macro는 $(1.0 + 0.0)/2 = 0.5$, weighted는 $(1.0 \\times 90 + 0.0 \\times 10)/100 = 0.9$다. weighted 평균에서는 다수 클래스가 소수 클래스의 실패를 가린다.",
    },
    {
      key: "c5",
      question: "$TN = 90$, $FP = 10$일 때 특이도와 위양성률(FPR, 실제 음성 가운데 양성으로 판정된 비율)은?",
      choices: ["특이도 0.9, FPR 0.1", "특이도 0.1, FPR 0.9", "특이도 0.9, FPR 0.9", "특이도 0.5, FPR 0.5"],
      answer: 0,
      explanation: "특이도는 $\\frac{TN}{TN + FP} = 0.9$이고, FPR은 $\\frac{FP}{FP + TN} = 0.1$로 항상 $1 - \\text{특이도}$다. FPR은 ROC 곡선의 가로축이다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
y_true = [1, 1, 0, 0, 0]
scores = [0.9, 0.6, 0.8, 0.5, 0.2]
for t in (0.85, 0.55):
    pred = [int(s >= t) for s in scores]
    tp = sum(p == 1 and y == 1 for p, y in zip(pred, y_true))
    fp = sum(p == 1 and y == 0 for p, y in zip(pred, y_true))
    print(t, tp, fp)
`,
      expected: "0.85 1 0\n0.55 2 1",
      explanation: "임계값 0.85에서는 0.9 하나만 양성으로 판정해 TP 1, FP 0이다. 0.55로 낮추면 0.9, 0.8, 0.6이 양성으로 판정되어 TP 2(0.9, 0.6), FP 1(0.8)이 된다. 임계값을 낮추면 재현율이 오르고 FP도 늘어난다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "양성이 1%인 데이터에서 항상 음성으로 판정하는 모델의 정확도와 재현율을 쓰고, 이 예를 근거로 불균형한 분류 문제에서 성능을 보고할 때 함께 적어야 할 것을 쓰라.",
      answer: md`
항상 음성으로 판정하면 실제 음성 99%를 모두 맞히므로 정확도는 99%이지만, 실제 양성을 하나도 찾지 못하므로 재현율은 0%다. 정확도가 높아도 양성을 찾는 목적에는 쓸 수 없는 모델이다.

그래서 불균형한 분류 문제에서는 정확도와 함께 다수 클래스 기준 모델의 정확도, 양성 클래스의 정밀도와 재현율(또는 F1), 이 값을 계산한 임계값을 함께 보고한다. 다중 분류라면 클래스별 값과 macro 평균도 적는다.
`,
      keyPoints: [
        "정확도 99%, 재현율 0%",
        "정확도는 다수 클래스 기준 모델과 비교해야 한다",
        "정밀도·재현율(F1)과 사용한 임계값을 함께 보고한다",
        "다중 분류는 클래스별 값과 macro 평균",
      ],
    },
    {
      key: "d2",
      question: "스팸 필터와 암 검진 모델에서 각각 어떤 오류가 더 비싼지 쓰고, 그에 따라 우선할 지표와 임계값을 움직일 방향을 쓰라. F1이 산술평균이 아니라 조화평균인 이유도 쓰라.",
      answer: md`
스팸 필터에서는 정상 메일을 스팸으로 거르는 오류(FP)가 더 비싸다. 중요한 메일을 놓칠 수 있기 때문이다. 그래서 정밀도를 우선하고, 확실한 경우만 스팸으로 판정하도록 임계값을 올린다. 암 검진에서는 암을 놓치는 오류(FN)가 더 비싸므로 재현율을 우선하고, 임계값을 낮춰 의심되는 경우를 더 많이 정밀 검사로 보낸다.

F1은 정밀도와 재현율의 조화평균이라 둘 중 낮은 값에 가깝게 나온다. 정밀도 1.0, 재현율 0.1인 모델의 산술평균은 0.55이지만 F1은 약 0.18이다. 한쪽 지표만 높은 모델이 좋은 점수를 받지 않도록 조화평균을 쓴다.
`,
      keyPoints: [
        "스팸 필터: FP가 비싸다 → 정밀도 우선, 임계값을 올린다",
        "암 검진: FN이 비싸다 → 재현율 우선, 임계값을 낮춘다",
        "조화평균은 낮은 쪽 값에 가깝다",
        "예: 정밀도 1.0, 재현율 0.1이면 F1 약 0.18",
      ],
    },
  ],
  references: [
    { title: "Google Machine Learning Crash Course — Classification: Accuracy, recall, precision", url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall", note: "지표의 정의와 임계값의 관계 (영문)" },
    { title: "scikit-learn — Classification metrics", url: "https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics", note: "confusion_matrix, classification_report, macro·weighted 평균 (영문)" },
  ],
});
