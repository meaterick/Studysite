import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/cross-validation";

export default defineLesson({
  id: "cross-validation",
  title: "교차검증, 시계열 검증, 하이퍼파라미터 탐색",
  tier: "core",
  concepts: ["cross-validation-tuning"],
  goal: "숫자·범주·결측이 섞인 데이터를 ColumnTransformer 파이프라인으로 누수 없이 전처리하고, GridSearchCV로 하이퍼파라미터를 고르며, 그룹·시계열 데이터에 맞는 분할을 고를 수 있다.",
  why: "",
  body: md`
핵심 과정에서는 숫자 열만 있는 깔끔한 데이터(유방암 진단)로 "전처리는 파이프라인 안에"라는 원칙을 익혔다. 실제 표 데이터는 다르다. 나이·소득 같은 숫자 열과 도시·가입 경로 같은 범주 열이 섞여 있고, 열마다 결측 비율도 다르며, 같은 환자·같은 사용자의 기록이 여러 줄로 반복된다. 이 단계는 그런 데이터를 **한 번의 \`fit\`으로 누수 없이** 처리하는 실무 표준 도구 세 가지를 다룬다. ① 열 종류마다 다른 전처리를 묶는 \`ColumnTransformer\`, ② 하이퍼파라미터를 검증 점수로 고르는 \`GridSearchCV\`, ③ 같은 그룹·미래 정보가 섞이지 않게 나누는 \`GroupKFold\`·\`TimeSeriesSplit\`이다.

### 열 종류별 전처리를 하나로: ColumnTransformer

숫자 열은 "결측을 중앙값으로 채운 뒤 표준화", 범주 열은 "원-핫 인코딩"처럼 열마다 처리가 다르다. 이것을 손으로 따로 하면 훈련·검증 분할마다 똑같은 순서를 반복해야 하고, 어느 한 곳에서 전체 데이터로 \`fit\`하는 순간 누수가 생긴다. \`ColumnTransformer\`는 "어느 열에 어떤 변환을 할지"를 목록으로 받아 하나의 변환기로 묶고, 이것을 모델과 함께 \`make_pipeline\`에 넣으면 전처리 전체가 모델의 일부가 된다.

\`\`\`python
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

df = pd.DataFrame({
    "나이": [25, 47, 33, 52, 41],
    "소득": [210, np.nan, 260, 400, np.nan],
    "도시": ["서울", "부산", "서울", "대구", "부산"],
})
numeric = make_pipeline(SimpleImputer(strategy="median"), StandardScaler())   # 숫자 열: 중앙값 대체 → 표준화
pre = ColumnTransformer([
    ("num", numeric, ["나이", "소득"]),
    ("cat", OneHotEncoder(handle_unknown="ignore"), ["도시"]),                # 범주 열: 원-핫
])
print(pre.fit_transform(df).round(2))
print("만들어진 열:", list(pre.get_feature_names_out()))

model = make_pipeline(pre, LogisticRegression())   # 전처리 + 모델 = 하나의 추정기
\`\`\`

출력은 숫자 열 2개와 도시 원-핫 열 3개를 합친 5열 표다. \`handle_unknown="ignore"\`는 실무에서 반드시 챙겨야 할 옵션이다. 훈련 데이터에 없던 도시(예: "광주")가 예측 시점에 들어오면 기본 설정은 오류를 내고 서비스가 멈춘다. \`"ignore"\`로 두면 그 행의 도시 열을 모두 0으로 두고 예측을 계속한다.

[[diagram:column-transformer]]

### 하이퍼파라미터를 검증 점수로 고르기: GridSearchCV

로지스틱 회귀의 규제 강도 \`C\`, 트리의 \`max_depth\`처럼 경사하강법이 직접 정하지 않는 값은 검증 점수로 골라야 한다(「데이터 분할·교차검증·데이터 누수」 단계). \`GridSearchCV\`는 후보 조합마다 교차검증을 돌려 평균 점수가 가장 높은 조합을 고르고, 그 조합으로 훈련 데이터 전체에 다시 학습한다. 파이프라인 안쪽 단계의 파라미터는 **\`단계이름__파라미터\`**(밑줄 두 개)로 가리킨다. \`make_pipeline\`은 단계 이름을 클래스 이름의 소문자로 자동으로 붙이므로 로지스틱 회귀의 \`C\`는 \`logisticregression__C\`가 된다.

\`\`\`python
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

model = make_pipeline(StandardScaler(), LogisticRegression())
print("단계 이름:", list(model.named_steps))                      # ['standardscaler', 'logisticregression']
grid = {"logisticregression__C": [0.01, 0.1, 1, 10]}               # 단계이름__파라미터
search = GridSearchCV(model, grid, cv=StratifiedKFold(5, shuffle=True, random_state=0), scoring="roc_auc")
# search.fit(X, y) 뒤에 search.best_params_, search.best_score_, search.best_estimator_를 쓴다
\`\`\`

탐색 비용도 계산해 두자. 후보가 \`C\` 4개, \`penalty\` 2개, \`class_weight\` 2개면 조합이 $4 \times 2 \times 2 = 16$개이고, 5-Fold면 학습이 $16 \times 5 = 80$번(마지막 재학습 1번 별도) 일어난다. 하이퍼파라미터 종류가 늘면 조합이 곱으로 폭발하므로, 후보가 많을 때는 정해진 횟수만큼 무작위로 조합을 뽑는 \`RandomizedSearchCV\`를 쓴다. 중요한 하이퍼파라미터가 한두 개뿐인 경우가 많아서, 같은 예산이면 격자보다 무작위 탐색이 그 축의 값을 더 다양하게 시험해 보는 경우가 많다.

[[diagram:grid-vs-random]]

여기서 꼭 기억할 점이 하나 있다. \`best_score_\`는 여러 후보 중 **가장 운이 좋았던** 점수를 고른 값이라 실제 성능보다 낙관적이다. 후보가 많을수록 더 그렇다. 고른 모델의 성능을 정직하게 보고하려면 따로 떼어 둔 테스트셋으로 한 번 평가하거나, 심화 과정의 「평가의 통계학」 단계에서 다루는 중첩 교차검증을 쓴다.

### 같은 사람, 미래의 정보: GroupKFold와 TimeSeriesSplit

「데이터 분할·교차검증·데이터 누수」 단계의 누수 사례 중 "동일 환자의 샘플이 train/test 양쪽에 존재"와 "미래 정보가 특징에 포함"은 분할 방식만 바꿔도 막을 수 있다.

- **GroupKFold**: 한 환자(사용자, 문서, 기기)의 샘플이 여러 개라면 그룹 단위로 fold를 나눠, 같은 그룹이 훈련과 검증에 동시에 들어가지 않게 한다. 그렇지 않으면 모델이 "이 환자의 다른 사진"을 외워서 맞히고, 처음 보는 환자에게는 그 점수가 나오지 않는다.
- **TimeSeriesSplit**: 시간 순서가 있는 데이터에서 항상 **과거로 학습하고 미래로 검증**한다. 무작위로 섞으면 내일 값을 보고 어제를 맞히는 셈이 된다.

\`\`\`python
import numpy as np
from sklearn.model_selection import TimeSeriesSplit

for train_idx, val_idx in TimeSeriesSplit(n_splits=3).split(np.arange(12)):
    print("훈련", train_idx, "→ 검증", val_idx)
\`\`\`

훈련 구간이 [0~2] → [0~5] → [0~8]로 늘어나고, 검증 구간은 항상 훈련 구간보다 뒤에 있다. 실제 운영에서 모델이 처하는 상황(지금까지의 데이터로 학습해 앞으로를 예측)과 같은 조건이다.

[[diagram:cv-splitters]]
`,
  checks: [
    {
      key: "c1",
      question: "`make_pipeline(StandardScaler(), LogisticRegression())`의 규제 강도 `C`를 `GridSearchCV`에서 탐색할 때 파라미터 이름은?",
      choices: ["`logisticregression__C`", "`C`", "`LogisticRegression.C`", "`pipeline_C`"],
      answer: 0,
      explanation: "파이프라인 안쪽 단계의 파라미터는 `단계이름__파라미터`(밑줄 두 개)로 가리킨다. `make_pipeline`은 단계 이름을 클래스 이름의 소문자로 붙이므로 `logisticregression__C`다.",
    },
    {
      key: "c2",
      question: "훈련 데이터에 없던 도시 \"광주\"가 예측 시점에 들어왔다. `OneHotEncoder(handle_unknown=\"ignore\")`의 동작은?",
      choices: ["도시 원-핫 열을 모두 0으로 두고 예측을 계속한다", "오류를 내고 멈춘다", "가장 흔한 도시로 바꿔 넣는다", "그 행을 삭제한다"],
      answer: 0,
      explanation: "기본값(`\"error\"`)은 처음 보는 범주에서 오류를 낸다. `\"ignore\"`는 해당 원-핫 열을 모두 0으로 두어 서비스가 멈추지 않게 한다.",
    },
    {
      key: "c3",
      question: "환자 80명에게서 각각 5장의 사진을 얻었다. 환자 단위로 일반화 성능을 재려면 어떤 분할이 알맞은가?",
      choices: ["GroupKFold(환자 ID를 그룹으로)", "샘플을 섞는 KFold", "TimeSeriesSplit", "분할 없이 훈련 정확도"],
      answer: 0,
      explanation: "같은 환자의 다른 사진이 훈련에 있으면 모델이 그 환자를 외워 맞힌다. 한 실험에서 1-NN이 KFold로는 1.000, GroupKFold로는 약 0.64로 갈렸다. 그룹 단위로 나눠야 처음 보는 환자에 대한 성능이 된다.",
    },
    {
      key: "c4",
      question: "`GridSearchCV`의 `best_score_`에 대한 설명으로 옳은 것은?",
      choices: ["후보 중 가장 높은 교차검증 점수라 실제 성능보다 낙관적이다", "테스트셋 점수와 같다", "항상 실제 성능보다 낮다", "후보 전체의 평균 점수다"],
      answer: 0,
      explanation: "잡음이 있는 점수 여러 개 중 최댓값을 골랐으므로 체계적으로 부풀려진다. 정직한 추정은 따로 떼어 둔 테스트셋이나 중첩 교차검증으로 얻는다.",
    },
    {
      key: "c5",
      question: "후보가 `max_depth` 5개와 `n_estimators` 3개의 모든 조합이고 5-Fold인 `GridSearchCV`는 (최종 재학습을 빼고) 모델을 몇 번 학습하는가?",
      choices: ["75번", "15번", "8번", "25번"],
      answer: 0,
      explanation: "조합이 $5 \\times 3 = 15$개이고 조합마다 fold 5개를 돌리므로 $15 \\times 5 = 75$번이다.",
    },
    {
      key: "c6",
      question: "하이퍼파라미터 종류가 많아 조합이 수천 개일 때 흔히 쓰는 대안은?",
      choices: ["정해진 횟수만큼 조합을 무작위로 뽑는 `RandomizedSearchCV`", "테스트셋으로 직접 고르기", "모든 조합을 한 fold로만 평가하기", "하이퍼파라미터를 학습 중에 경사하강법으로 정하기"],
      answer: 0,
      explanation: "격자 탐색은 조합이 곱으로 늘어난다. 무작위 탐색은 예산을 정해 두고 다양한 값을 시험한다. 테스트셋으로 고르면 누수다.",
    },
    {
      key: "c7",
      question: "`make_pipeline(SimpleImputer(), RandomForestClassifier())`의 트리 깊이를 `GridSearchCV`로 탐색하려면 파라미터 그리드의 키를 무엇으로 써야 하는가?",
      choices: ["`randomforestclassifier__max_depth`", "`max_depth`", "`RandomForestClassifier__max_depth`", "`pipeline.max_depth`"],
      answer: 0,
      explanation: "`make_pipeline`은 각 단계에 클래스 이름을 소문자로 바꾼 이름을 붙이고, 안쪽 단계의 파라미터는 `단계이름__파라미터`(밑줄 두 개)로 가리킵니다. 단계 이름은 `list(model.named_steps)`로 확인할 수 있습니다.",
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
      explanation: "TimeSeriesSplit은 항상 과거로 학습하고 바로 뒤의 미래로 검증합니다. 6개를 2번 나누면 검증 구간 크기는 6 // 3 = 2이고, 훈련 구간은 앞에서부터 점점 늘어납니다. 검증 구간이 훈련 구간보다 앞에 오는 일은 없습니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "숫자 열과 범주 열이 섞인 데이터에서 전처리를 `ColumnTransformer`로 묶어 파이프라인 안에 넣어야 하는 이유는 무엇인가? `OneHotEncoder(handle_unknown=\"ignore\")`가 필요한 상황과, 같은 환자의 샘플이 여러 개일 때 `GroupKFold`를 써야 하는 이유도 함께 설명하라.",
      answer: md`
전처리 규칙(중앙값, 평균·표준편차, 범주 목록)도 데이터에서 배우는 값이라, 교차검증의 각 fold에서 훈련 부분만 보고 배워야 누수가 없다. 열 종류마다 처리가 다르면 손으로 따로 하기 쉬운데, 그러다 한 곳에서라도 전체 데이터로 fit하면 검증 정보가 섞인다. ColumnTransformer로 열별 변환을 하나의 변환기로 묶어 모델과 함께 파이프라인에 넣으면 fit 한 번에 fold마다 올바르게 학습된다. handle_unknown="ignore"는 훈련 때 없던 범주(새 도시)가 예측 시점에 들어와도 오류 없이 해당 원-핫 열을 모두 0으로 두기 위해 필요하다. 같은 환자의 샘플이 여러 개면 일반 KFold는 같은 환자를 훈련과 검증에 나눠 넣어 모델이 그 환자를 외워 맞히게 되므로(예: 1-NN 1.000 → GroupKFold 약 0.64), 환자 단위로 일반화 성능을 재려면 GroupKFold로 그룹째 나눠야 한다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "scikit-learn — Column Transformer with Mixed Types", url: "https://scikit-learn.org/stable/auto_examples/compose/plot_column_transformer_mixed_types.html", note: "숫자·범주 열을 함께 처리하는 공식 예제" },
    { title: "scikit-learn — Cross-validation iterators for grouped data", url: "https://scikit-learn.org/stable/modules/cross_validation.html#group-k-fold", note: "GroupKFold·TimeSeriesSplit이 필요한 상황" },
  ],
});
