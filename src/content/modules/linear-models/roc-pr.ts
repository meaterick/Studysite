import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/roc-pr";

export default defineLesson({
  id: "roc-pr",
  title: "ROC-AUC, PR-AUC, 클래스 불균형",
  tier: "core",
  concepts: ["roc-pr-imbalance"],
  goal: "임계값을 바꿔 가며 ROC 곡선을 그리고 AUC를 순위 확률로 해석하며, PR 곡선과 평균 정밀도(AP)를 계산하고, 양성이 드문 데이터에서 두 지표가 다르게 반응하는 이유를 설명한다. 불균형 데이터를 다루는 방법을 상황에 맞게 고른다.",
  why: "특정 임계값 하나의 정밀도·재현율만으로는 임계값을 다르게 정했을 때의 성능을 알 수 없다([[lesson:classification-metrics]]). ROC 곡선과 PR 곡선은 모든 임계값을 한 번에 요약해 모델을 비교하는 데 쓰이고, 사기 탐지·질병 선별처럼 양성이 드문 문제에서는 어느 곡선을 보느냐에 따라 결론이 달라진다. 비용으로 임계값 하나를 정하는 일은 [[lesson:cost-threshold]]에서 다룬다.",
  body: md`
### ROC 곡선

임계값을 1에서 0까지 낮추며 임계값마다 두 비율을 계산해 점으로 찍으면 **ROC 곡선**이 된다.

\`\`\`math
\text{TPR} = \frac{TP}{TP + FN}\;(\text{재현율}), \qquad \text{FPR} = \frac{FP}{FP + TN}\;(\text{위양성률})
\`\`\`

임계값이 1보다 크면 아무것도 양성으로 판정하지 않으므로 $(0, 0)$에서 시작하고, 0이면 모두 양성으로 판정하므로 $(1, 1)$에서 끝난다. 점수를 무작위로 매기는 모델은 대각선 위에 놓이고, 모든 양성에 모든 음성보다 높은 점수를 주는 모델은 왼쪽 위 $(0, 1)$을 지난다. 곡선 아래 넓이를 **ROC-AUC**(간단히 AUC)라 하며, 무작위 모델은 0.5, 완벽한 모델은 1이다.

[[diagram:threshold-roc]]

### AUC는 순위를 맞힐 확률이다

AUC는 **양성 하나와 음성 하나를 무작위로 뽑았을 때 모델이 양성에 더 높은 점수를 줄 확률**과 같다. 양성 2개(점수 0.9, 0.6)와 음성 3개(0.8, 0.5, 0.2)가 있으면 양성-음성 쌍 6개 가운데 양성의 점수가 높은 쌍은 5개다. 0.6인 양성만 0.8인 음성에게 진다. 따라서 AUC $= 5/6 \approx 0.833$이고, ROC 곡선 아래 넓이를 계산해도 같은 값이 나온다. 그래서 AUC는 임계값과 관계없이 모델이 매긴 **순서**만 평가한다.

[[diagram:roc-five-samples]]

\`\`\`python
from sklearn.metrics import roc_curve, roc_auc_score

y_true = [1, 0, 1, 0, 0]
scores = [0.9, 0.8, 0.6, 0.5, 0.2]
fpr, tpr, thresholds = roc_curve(y_true, scores)      # 점수마다 임계값을 두고 (FPR, TPR) 계산
print(fpr.round(2), tpr.round(2))                     # [0.   0.   0.33 0.33 1.  ] [0.  0.5 0.5 1.  1. ]
print(round(roc_auc_score(y_true, scores), 3))        # 0.833
\`\`\`

\`roc_curve\`와 \`roc_auc_score\`에는 \`predict\`가 내놓은 0·1 판정이 아니라 \`predict_proba\`의 양성 확률 같은 점수를 넘긴다. 판정은 이미 임계값 하나로 잘린 값이라 곡선을 그릴 수 없다.

### PR 곡선과 평균 정밀도

임계값마다 재현율을 가로축, 정밀도를 세로축에 찍으면 **PR 곡선**이 된다. 곡선을 하나의 수로 요약한 **평균 정밀도**(AP, average precision)는 재현율이 늘어난 만큼 그 지점의 정밀도를 곱해 더한 값으로, PR 곡선 아래 넓이에 해당한다.

\`\`\`math
\text{AP} = \sum_n (R_n - R_{n-1})\, P_n
\`\`\`

위의 5개 샘플에서는 임계값 0.9에서 재현율이 0.5로 늘 때 정밀도 1, 0.6에서 재현율이 1로 늘 때 정밀도 $2/3$이므로 AP $= 0.5 \times 1 + 0.5 \times \frac{2}{3} \approx 0.833$이다. 점수를 무작위로 매기는 모델의 정밀도는 어느 임계값에서나 양성 비율과 같으므로, AP의 기준선은 0.5가 아니라 **양성 비율**이다.

### 양성이 드물면 두 지표가 다르게 반응한다

TPR과 FPR은 각각 실제 양성, 실제 음성 안에서 계산한 비율이라 양성 비율이 바뀌어도 그대로다. 정밀도는 판정한 양성 가운데 실제 양성의 비율이라 양성 비율에 따라 달라진다([[lesson:bayes]]). 재현율 0.9, FPR 0.05인 같은 모델을 1만 명에게 쓰면, 양성이 20%일 때는 TP 1,800, FP 400으로 정밀도가 0.818이지만, 양성이 1%일 때는 TP 90, FP 495로 정밀도가 0.154다.

[[diagram:pr-vs-roc]]

다음 코드는 같은 방식으로 점수를 만든 두 데이터에서 양성 비율만 10%와 1%로 바꾼다.

\`\`\`python
import numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score

rng = np.random.default_rng(0)
for n_pos, n_neg in [(1000, 9000), (100, 9900)]:                     # 양성 10%, 1%
    y = np.r_[np.ones(n_pos), np.zeros(n_neg)]
    s = np.r_[rng.normal(1.5, 1, n_pos), rng.normal(0, 1, n_neg)]   # 같은 방식으로 만든 점수
    pred = s >= 1.0
    precision = np.sum(pred & (y == 1)) / np.sum(pred)
    print(f"양성 {n_pos / (n_pos + n_neg):.0%}: ROC-AUC {roc_auc_score(y, s):.3f}, AP {average_precision_score(y, s):.3f}, 임계값 1.0의 정밀도 {precision:.3f}")
# 양성 10%: ROC-AUC 0.850, AP 0.461, 임계값 1.0의 정밀도 0.317
# 양성 1%: ROC-AUC 0.841, AP 0.089, 임계값 1.0의 정밀도 0.038
\`\`\`

ROC-AUC는 0.85 근처로 거의 같지만, 양성이 1%이면 같은 임계값에서 양성 판정의 96%가 틀린다. AP 0.089는 기준선 0.01의 약 9배라 무작위보다는 낫지만, 실제로 처리해야 할 오경보가 많다는 것을 드러낸다. 양성이 드문 문제에서는 ROC-AUC와 함께 PR 곡선과 AP를 본다.

### 불균형 데이터를 다루는 방법

| 방법 | 하는 일 | 주의할 점 |
| --- | --- | --- |
| 층화 분할 | 학습·평가 데이터의 양성 비율을 같게 유지한다([[lesson:data-splits]]) | 평가 데이터에 양성이 너무 적으면 지표가 크게 흔들린다 |
| 지표 선택 | 정확도 대신 재현율·정밀도·AP를 본다 | 기준 모델의 값과 함께 보고한다 |
| 임계값 조정 | 오류 비용에 맞게 임계값을 옮긴다([[lesson:cost-threshold]]) | 임계값은 검증 데이터로 정한다 |
| 클래스 가중치 | \`class_weight="balanced"\`로 소수 클래스의 손실을 크게 한다 | 예측 확률이 실제 비율보다 커진다 |
| 재표본추출 | 소수 클래스를 복제하거나 다수 클래스를 줄인다 | 학습 데이터에만 적용한다. 평가 데이터를 바꾸면 실제 분포의 성능을 잴 수 없다 |

:::warn 흔한 실수
- **0·1 판정으로 ROC 곡선을 그린다.** 점수(확률)를 넘겨야 모든 임계값을 훑을 수 있다.
- **양성이 드문 문제에서 ROC-AUC만 보고한다.** 같은 ROC-AUC에서도 정밀도는 양성 비율에 따라 크게 달라진다. AP와 그 기준선(양성 비율)을 함께 적는다.
- **재표본추출을 분할 전에 한다.** 복제한 샘플이 학습·평가 데이터에 함께 들어가 누수가 생긴다. 분할한 뒤 학습 데이터에만 적용한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "AUC $= 0.83$의 가장 정확한 해석은?",
      choices: [
        "양성 하나와 음성 하나를 무작위로 뽑으면 양성에 더 높은 점수를 줄 확률이 0.83이다",
        "정확도가 83%다",
        "임계값 0.5에서 재현율이 0.83이다",
        "83%의 샘플을 양성으로 판정한다",
      ],
      answer: 0,
      explanation: "AUC는 임계값과 관계없이 모델이 매긴 순서를 평가한다. 본문 예제에서는 6쌍 가운데 5쌍의 순서가 맞아 $5/6 \\approx 0.833$이었다.",
    },
    {
      key: "c2",
      question: "양성 비율이 2%인 데이터에서 점수를 무작위로 매기는 모델의 평균 정밀도(AP)는 대략?",
      choices: ["0.02", "0.5", "1.0", "0"],
      answer: 0,
      explanation: "무작위 모델의 정밀도는 어느 임계값에서나 양성 비율과 같으므로 AP의 기준선은 0.02다. ROC-AUC의 기준선 0.5와 다르다.",
    },
    {
      key: "c3",
      question: "같은 모델을 양성 비율이 20%인 병원과 1%인 병원에서 평가했다. 두 병원에서 거의 같게 나올 값은?",
      choices: ["TPR과 FPR(따라서 ROC 곡선)", "정밀도", "평균 정밀도(AP)", "양성 판정 가운데 실제 양성의 수"],
      answer: 0,
      explanation: "TPR과 FPR은 실제 양성, 실제 음성 안에서 각각 계산하므로 양성 비율의 영향을 받지 않는다. 정밀도와 AP는 양성이 드물수록 낮아진다.",
    },
    {
      key: "c4",
      question: "양성이 3%인 데이터에서 소수 클래스를 복제해 늘리는 재표본추출을 쓰려 한다. 올바른 순서는?",
      choices: [
        "학습·평가 데이터를 먼저 나누고, 학습 데이터에만 복제를 적용한다",
        "전체 데이터를 복제해 늘린 뒤 나눈다",
        "평가 데이터에도 같은 비율로 복제를 적용한다",
        "복제한 데이터로 평가하고 원래 데이터로 학습한다",
      ],
      answer: 0,
      explanation: "분할 전에 복제하면 같은 샘플이 학습·평가 데이터 양쪽에 들어가 누수가 생긴다. 평가 데이터는 실제 분포를 그대로 두어야 운영 환경의 성능을 잰다.",
    },
    {
      key: "c5",
      question: "`roc_auc_score(y_true, clf.predict(X))`로 AUC를 계산했다. 무엇이 문제인가?",
      choices: [
        "임계값 0.5로 이미 잘린 판정을 넘겨, 점수의 순서 정보가 사라진 AUC가 계산된다",
        "문제없다. 판정과 확률은 같은 결과를 준다",
        "AUC는 다중 분류에서만 계산할 수 있다",
        "predict는 항상 확률을 돌려준다",
      ],
      answer: 0,
      explanation: "AUC는 점수의 순서를 평가한다. `predict_proba(X)[:, 1]`처럼 양성 확률을 넘겨야 모든 임계값이 반영된다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
from sklearn.metrics import roc_auc_score
print(roc_auc_score([0, 0, 1, 1], [0.1, 0.4, 0.35, 0.8]))
`,
      expected: "0.75",
      explanation: "양성-음성 쌍은 4개다. 0.8인 양성은 두 음성(0.1, 0.4)을 모두 이기고, 0.35인 양성은 0.1만 이기고 0.4에는 진다. 4쌍 가운데 3쌍의 순서가 맞으므로 AUC는 $3/4 = 0.75$다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "양성 샘플 2개(점수 0.9, 0.6)와 음성 샘플 3개(점수 0.8, 0.5, 0.2)로 AUC를 순위 확률의 정의로 계산하라. 그리고 AUC가 임계값과 관계없는 하나의 수로 나오는 이유를 정밀도·재현율과 비교해 쓰라.",
      answer: md`
양성-음성 쌍은 $2 \times 3 = 6$개다. 0.9인 양성은 세 음성을 모두 이기고, 0.6인 양성은 0.5와 0.2를 이기지만 0.8에게 진다. 순서가 맞는 쌍이 5개이므로 AUC $= 5/6 \approx 0.833$이다.

정밀도와 재현율은 임계값 하나를 정했을 때의 판정으로 계산하므로 임계값을 바꾸면 값도 바뀐다. AUC는 모든 임계값에서의 TPR과 FPR을 이은 곡선 전체의 넓이이고, 이는 모델이 양성에 음성보다 높은 점수를 주는 비율, 곧 점수의 순서만으로 정해진다. 그래서 특정 임계값을 고르지 않아도 하나의 값으로 나온다.
`,
      keyPoints: [
        "쌍 6개 중 순서가 맞는 쌍 5개, AUC는 5/6(약 0.833)",
        "정밀도·재현율은 임계값 하나에서의 판정으로 계산한다",
        "AUC는 모든 임계값의 곡선 아래 넓이다",
        "AUC는 점수의 순서만으로 정해진다",
      ],
    },
    {
      key: "d2",
      question: "재현율 0.9, FPR 0.05인 같은 분류기를 양성 비율이 1%인 병원과 20%인 병원에 썼다. 1만 명 기준으로 각 병원의 정밀도를 계산하고, ROC-AUC는 같은데 정밀도가 크게 다른 이유를 쓰라.",
      answer: md`
양성 1%인 병원에서는 환자 100명 가운데 90명을 양성으로 판정하고(TP), 건강한 9,900명 가운데 5%인 495명을 양성으로 판정하므로(FP) 정밀도는 $90/585 \approx 0.154$다. 양성 20%인 병원에서는 환자 2,000명 가운데 1,800명(TP), 건강한 8,000명 가운데 400명(FP)이므로 정밀도는 $1800/2200 \approx 0.818$이다.

ROC 곡선은 실제 양성 안의 비율(TPR)과 실제 음성 안의 비율(FPR)만 쓰므로 두 병원에서 같다. 정밀도는 양성 판정 가운데 TP의 비율, 곧 TP와 FP의 사람 수 비율이라 양성 비율에 직접 좌우된다. 양성이 드문 곳에서는 음성이 많아 FPR이 작아도 FP의 수가 커진다. 그래서 PR 곡선과 AP로 실제 오경보의 양을 따로 확인한다.
`,
      keyPoints: [
        "1%: TP 90, FP 495, 정밀도 약 0.15",
        "20%: TP 1,800, FP 400, 정밀도 약 0.82",
        "ROC는 TPR·FPR만 써서 양성 비율의 영향을 받지 않는다",
        "정밀도는 양성 비율에 좌우되므로 PR 곡선·AP를 함께 본다",
      ],
    },
  ],
  references: [
    { title: "Google Machine Learning Crash Course — Classification: ROC and AUC", url: "https://developers.google.com/machine-learning/crash-course/classification/roc-and-auc", note: "ROC 곡선과 AUC의 정의 (영문)" },
    { title: "Saito & Rehmsmeier (2015) — The Precision-Recall Plot Is More Informative than the ROC Plot When Evaluating Binary Classifiers on Imbalanced Datasets", url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0118432", note: "불균형 데이터에서 PR 곡선을 보는 이유 (영문)" },
    { title: "scikit-learn — Precision-Recall", url: "https://scikit-learn.org/stable/auto_examples/model_selection/plot_precision_recall.html", note: "PR 곡선과 평균 정밀도 계산 (영문)" },
  ],
});
