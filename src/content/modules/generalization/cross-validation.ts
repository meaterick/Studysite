import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/cross-validation";

export default defineLesson({
  id: "cross-validation",
  title: "교차검증, 시계열 검증, 하이퍼파라미터 탐색",
  tier: "core",
  concepts: ["cross-validation-tuning"],
  goal: "K-Fold 교차검증으로 모든 샘플을 한 번씩 검증에 쓰고, 층화·그룹·시계열 분할을 데이터 구조에 맞게 고르며, 전처리를 포함한 파이프라인을 교차검증하고, GridSearchCV·RandomizedSearchCV로 하이퍼파라미터를 고른 뒤 best_score_가 낙관적인 이유를 설명한다.",
  why: "검증 데이터를 한 번만 떼어 두면 데이터가 적을 때 점수가 그 분할에 크게 좌우된다([[lesson:baselines]]). 교차검증은 같은 데이터로 더 안정된 추정을 얻는 방법이고, 하이퍼파라미터 탐색과 모델 비교의 기본 절차다. 두 모델의 점수 차이를 통계적으로 판단하는 방법은 [[lesson:model-evaluation-stats]]에서 다룬다.",
  body: md`
### K-Fold 교차검증

**K-Fold 교차검증**은 학습 데이터를 겹치지 않는 조각(**fold**) $K$개로 나누고, 매번 한 조각을 검증에, 나머지 $K - 1$개를 학습에 쓰는 일을 $K$번 반복한다. 모든 샘플이 정확히 한 번씩 검증에 쓰이고, 점수 $K$개의 평균을 성능 추정으로 쓴다. 한 번의 분할에서 나온 점수 하나보다 분할에 덜 좌우된다.

\`\`\`python
import numpy as np
from sklearn.model_selection import KFold

X = np.arange(10)                                      # 샘플 10개의 번호
for i, (tr, va) in enumerate(KFold(n_splits=5).split(X), start=1):
    print(f"fold {i}: 학습 {tr} / 검증 {va}")
# fold 1: 학습 [2 3 4 5 6 7 8 9] / 검증 [0 1]
# ...
# fold 5: 학습 [0 1 2 3 4 5 6 7] / 검증 [8 9]
\`\`\`

데이터의 순서에 패턴이 있을 수 있으므로 보통 \`shuffle=True\`로 섞어서 나누고, 분류에서는 fold마다 클래스 비율을 유지하는 \`StratifiedKFold\`를 쓴다. $K$를 키우면 한 번의 학습에 쓰는 데이터가 늘어(5-Fold는 80%, 10-Fold는 90%) 전체 데이터로 학습한 모델의 성능에 더 가까워지지만, 학습을 $K$번 해야 하므로 계산 비용이 커진다. 보통 5나 10을 쓴다.

### 파이프라인을 교차검증한다

전처리를 모델과 함께 파이프라인에 넣고 \`cross_val_score\`에 넘기면, fold마다 학습 부분으로만 전처리 규칙을 계산하므로 누수가 생기지 않는다([[lesson:data-splits]]). 테스트 데이터는 처음에 떼어 두고 교차검증에는 쓰지 않는다.

\`\`\`python
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
scores = cross_val_score(model, X_tr, y_tr, cv=StratifiedKFold(5, shuffle=True, random_state=0))
print(np.round(scores, 3), round(scores.mean(), 3), round(scores.std(), 3))
# [0.989 0.967 0.978 0.967 0.989] 0.978 0.01
\`\`\`

결과를 "정확도 0.978 ± 0.010"처럼 쓸 때 ±는 fold 점수 다섯 개가 흩어진 정도일 뿐 신뢰구간이 아니다. 5-Fold에서 두 fold의 학습 데이터는 75%가 겹쳐 fold 점수끼리 독립이 아니기 때문이다. 두 모델을 비교할 때는 같은 fold에서 짝지은 점수 차이를 본다([[lesson:model-evaluation-stats]]).

[[diagram:cv-splitters]]

### 그룹과 시간이 있는 데이터

데이터 분할에서 본 그룹 분할과 시간 분할([[lesson:data-splits]])을 교차검증으로 확장한 도구가 있다.

- **GroupKFold**: 환자·사용자처럼 같은 그룹의 샘플이 학습과 검증에 동시에 들어가지 않게 fold를 나눈다. \`cross_val_score(model, X, y, cv=GroupKFold(5), groups=groups)\`처럼 그룹 번호를 함께 넘긴다.
- **TimeSeriesSplit**: 항상 과거 구간으로 학습하고 바로 뒤 구간으로 검증한다. fold가 진행될수록 학습 구간이 앞에서부터 늘어나고, 검증 구간은 항상 학습 구간보다 뒤에 있다.

같은 환자의 샘플이 여러 개인 데이터에서 일반 K-Fold로 평가하면, 모델이 그 환자의 다른 샘플을 기억해 맞히므로 처음 보는 환자에 대한 성능보다 훨씬 높은 점수가 나온다. 실습에서 이 차이를 직접 잰다.

### 하이퍼파라미터 탐색

**GridSearchCV**는 후보 조합마다 교차검증을 해서 평균 점수가 가장 높은 조합을 고르고, 그 조합으로 학습 데이터 전체에 다시 학습한다. 파이프라인 안쪽 단계의 파라미터는 \`단계이름__파라미터\`(밑줄 두 개)로 가리키고, \`make_pipeline\`은 클래스 이름을 소문자로 바꾼 것을 단계 이름으로 붙인다.

\`\`\`python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
grid = {"logisticregression__C": [0.01, 0.1, 1, 10, 100]}   # 단계이름__파라미터
search = GridSearchCV(model, grid, cv=StratifiedKFold(5, shuffle=True, random_state=0))
search.fit(X_tr, y_tr)
print(search.best_params_, round(search.best_score_, 3))   # {'logisticregression__C': 1} 0.978
print(round(search.score(X_te, y_te), 3))                  # 0.982: 떼어 둔 테스트 데이터로 한 번 평가
\`\`\`

후보가 \`C\` 5개라면 학습은 $5 \times 5 = 25$번(마지막 재학습 1번 별도)이다. 하이퍼파라미터 종류가 늘면 조합 수가 곱으로 늘어나므로, 후보가 많으면 정해진 횟수만큼 조합을 무작위로 뽑는 **RandomizedSearchCV**를 쓴다. 성능에 큰 영향을 주는 하이퍼파라미터는 한두 개인 경우가 많아, 같은 횟수라면 무작위 탐색이 그 값들을 더 다양하게 시험한다.

[[diagram:grid-vs-random]]

\`best_score_\`는 여러 후보의 교차검증 점수 가운데 최댓값이다. 고르는 데 쓴 점수는 실제 성능보다 높게 나오므로([[lesson:data-splits]]) 이 값도 낙관적이다. 고른 모델의 성능은 떼어 둔 테스트 데이터로 한 번 재거나, 데이터가 적으면 탐색 전체를 바깥 교차검증 안에 넣는 중첩 교차검증으로 잰다([[lesson:model-evaluation-stats]]).

:::warn 흔한 실수
- **교차검증 바깥에서 전처리를 fit한다.** 전처리는 파이프라인에 넣어 fold마다 학습 부분으로만 fit한다.
- **같은 환자·사용자의 샘플이 여러 개인데 일반 K-Fold를 쓴다.** GroupKFold로 그룹 단위로 나눈다.
- **\`best_score_\`를 최종 성능으로 보고한다.** 고르는 데 쓴 점수다. 테스트 데이터나 중첩 교차검증으로 다시 잰다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "샘플 100개로 5-Fold 교차검증을 할 때, 각 샘플이 검증에 쓰이는 횟수와 한 번의 학습에 쓰이는 샘플 수는?",
      choices: ["검증에 정확히 1번, 학습에는 80개", "검증에 5번, 학습에는 100개", "검증에 1번, 학습에는 20개", "검증에 0번, 학습에는 80개"],
      answer: 0,
      explanation: "100개를 20개씩 다섯 조각으로 나눠, 매번 한 조각을 검증에 쓰고 나머지 80개로 학습한다. 다섯 번 반복하면 모든 샘플이 한 번씩 검증에 쓰인다.",
    },
    {
      key: "c2",
      question: "5-Fold 교차검증 결과 \"정확도 0.978 ± 0.010\"에서 ±0.010에 대한 설명으로 옳은 것은?",
      choices: [
        "fold 점수 다섯 개의 흩어짐이고, fold끼리 학습 데이터가 겹쳐 독립이 아니므로 신뢰구간으로 해석하면 안 된다",
        "참 정확도가 95% 확률로 0.968~0.988에 있다는 신뢰구간이다",
        "테스트 데이터에서의 오차 범위다",
        "표준편차가 작을수록 모델이 더 정확하다는 뜻이다",
      ],
      answer: 0,
      explanation: "5-Fold에서 두 fold의 학습 데이터는 75%가 겹친다. 이 상관 때문에 fold 점수의 표준편차로 평균의 불확실성을 바로 계산할 수 없다.",
    },
    {
      key: "c3",
      question: "환자 80명에게서 각각 사진 5장을 얻었다. 처음 보는 환자에 대한 성능을 재려면 어떤 교차검증이 알맞은가?",
      choices: ["GroupKFold(환자 번호를 그룹으로)", "샘플을 섞는 KFold", "TimeSeriesSplit", "교차검증 없이 학습 데이터 정확도"],
      answer: 0,
      explanation: "같은 환자의 다른 사진이 학습에 있으면 모델이 그 환자를 기억해 맞힌다. 그룹 단위로 나눠야 처음 보는 환자에 대한 성능이 된다.",
    },
    {
      key: "c4",
      question: "`make_pipeline(StandardScaler(), LogisticRegression())`의 `C`를 GridSearchCV로 탐색할 때 파라미터 이름은?",
      choices: ["`logisticregression__C`", "`C`", "`LogisticRegression.C`", "`pipeline_C`"],
      answer: 0,
      explanation: "안쪽 단계의 파라미터는 `단계이름__파라미터`(밑줄 두 개)로 가리킨다. 단계 이름은 `list(model.named_steps)`로 확인할 수 있다.",
    },
    {
      key: "c5",
      question: "`max_depth` 후보 5개와 `n_estimators` 후보 3개의 모든 조합을 5-Fold로 탐색하는 GridSearchCV의 학습 횟수(최종 재학습 제외)와 `best_score_`의 성질은?",
      choices: [
        "75번이고, best_score_는 후보 중 최댓값이라 실제 성능보다 낙관적이다",
        "15번이고, best_score_는 테스트 점수와 같다",
        "75번이고, best_score_는 실제 성능보다 항상 낮다",
        "8번이고, best_score_는 후보 점수의 평균이다",
      ],
      answer: 0,
      explanation: "조합 $5 \\times 3 = 15$개마다 fold 5개를 학습하므로 75번이다. 잡음이 있는 점수 15개 가운데 최댓값을 골랐으므로 실제보다 높게 나온다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
for tr, te in TimeSeriesSplit(n_splits=2).split(np.arange(6)):
    print(tr.tolist(), te.tolist())
`,
      expected: "[0, 1] [2, 3]\n[0, 1, 2, 3] [4, 5]",
      explanation: "TimeSeriesSplit은 항상 과거로 학습하고 바로 뒤 구간으로 검증한다. 6개를 2번 나누면 검증 구간 크기는 $6 // 3 = 2$이고, 학습 구간은 앞에서부터 늘어난다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "K-Fold 교차검증에서 K를 5에서 10으로 늘릴 때의 장점과 단점을 쓰고, GridSearchCV의 best_score_를 최종 성능으로 보고하면 안 되는 이유와 대신 할 일을 쓰라.",
      answer: md`
K를 10으로 늘리면 한 번의 학습에 쓰는 데이터가 전체의 80%에서 90%로 늘어, 전체 데이터로 학습한 모델의 성능을 더 가깝게 추정한다. 데이터가 적을 때 특히 유리하다. 대신 학습을 10번 해야 하므로 계산 비용이 두 배가 되고, 검증 fold가 작아져 fold 점수 하나하나는 더 흔들린다.

best_score_는 여러 후보의 교차검증 점수 가운데 최댓값이다. 점수에는 잡음이 있으므로 최댓값을 고르면 그 후보가 우연히 잘 맞은 몫까지 들어가 실제 성능보다 높게 나온다. 그래서 탐색에 쓰지 않은 테스트 데이터로 고른 모델을 한 번 평가해 보고하거나, 데이터가 적으면 탐색 전체를 바깥 교차검증 안에 넣는 중첩 교차검증으로 성능을 잰다.
`,
      keyPoints: [
        "K를 늘리면 학습 데이터 비율이 늘어 추정의 편향이 줄어든다",
        "대신 계산 비용이 늘고 fold 점수 하나하나는 더 흔들린다",
        "best_score_는 후보 중 최댓값이라 낙관적이다",
        "테스트 데이터나 중첩 교차검증으로 다시 잰다",
      ],
    },
  ],
  references: [
    { title: "scikit-learn — Cross-validation: evaluating estimator performance", url: "https://scikit-learn.org/stable/modules/cross_validation.html", note: "K-Fold·Stratified·Group·TimeSeriesSplit (영문)" },
    { title: "scikit-learn — Tuning the hyper-parameters of an estimator", url: "https://scikit-learn.org/stable/modules/grid_search.html", note: "GridSearchCV·RandomizedSearchCV와 파이프라인 파라미터 이름 (영문)" },
    { title: "Bergstra & Bengio (2012) — Random Search for Hyper-Parameter Optimization", url: "https://www.jmlr.org/papers/v13/bergstra12a.html", note: "무작위 탐색이 격자 탐색보다 효율적인 이유 (영문)" },
  ],
});
