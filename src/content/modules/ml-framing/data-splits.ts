import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/data-splits";

export default defineLesson({
  id: "data-splits",
  title: "학습·검증·테스트 데이터와 데이터 누수",
  tier: "core",
  concepts: ["data-splits-leakage"],
  goal: "학습·검증·테스트 데이터의 역할을 구분해 데이터를 세 부분으로 나누고, 데이터 구조에 맞는 분할(층화·그룹·시간)을 고르며, 데이터 누수의 유형을 찾아 전처리를 학습 데이터로만 계산하는 파이프라인으로 막는다.",
  why: "모델을 고르고 성능을 보고하는 결정은 모두 평가 점수에 근거한다. 분할이 데이터 구조와 맞지 않거나 누수가 있으면 평가 점수가 운영 환경의 성능보다 높게 나오고, 그 점수로 내린 결정도 틀린다. 교차검증([[lesson:cross-validation]])과 언어 모델 평가([[lesson:llm-evaluation]])도 이 레슨의 원칙을 그대로 쓴다.",
  body: md`
### 평가용 데이터를 검증 데이터와 테스트 데이터로 나눈다

트랙 3까지는 데이터를 학습용과 평가용 두 부분으로 나눴다([[lesson:encoding-scaling]]). 모델 하나를 학습시켜 한 번 평가할 때는 이것으로 충분하다. 실제로는 학습률·규제 강도·트리 깊이 같은 하이퍼파라미터를 여러 값으로 바꿔 보고, 여러 모델을 비교해 하나를 고른다. 고르는 데 쓴 데이터의 점수는 고른 모델의 성능을 실제보다 높게 보여 준다(다음 절에서 확인한다). 그래서 평가용 데이터를 다시 둘로 나눠 데이터를 세 부분으로 쓴다.

| 데이터 | 쓰는 곳 | 사용 횟수 |
| --- | --- | --- |
| 학습 데이터 | 파라미터를 정한다(\`fit\`) | 학습할 때마다 |
| 검증 데이터 | 하이퍼파라미터와 모델을 비교해 고른다 | 여러 번 |
| 테스트 데이터 | 모든 선택이 끝난 뒤 최종 성능을 잰다 | 마지막에 한 번 |

[[diagram:data-split]]

\`train_test_split\`을 두 번 쓰면 세 부분으로 나뉜다. 먼저 30%를 떼어 내고, 떼어 낸 부분을 다시 반으로 나눈다.

\`\`\`python
import numpy as np
from sklearn.model_selection import train_test_split

rng = np.random.default_rng(0)
X = rng.normal(size=(1000, 5))
y = (X[:, 0] + rng.normal(scale=0.5, size=1000) > 0).astype(int)

X_train, X_rest, y_train, y_rest = train_test_split(X, y, test_size=0.3, random_state=0)
X_val, X_test, y_val, y_test = train_test_split(X_rest, y_rest, test_size=0.5, random_state=0)
print(len(X_train), len(X_val), len(X_test))     # 700 150 150
\`\`\`

비율은 데이터 양에 따라 정한다. 샘플이 수십만 개라면 검증·테스트 데이터가 각각 1%여도 수천 개라 점수가 안정적이다. 샘플이 적어 검증 데이터를 따로 떼기 어려우면 교차검증을 쓴다([[lesson:cross-validation]]).

### 고르는 데 쓴 점수는 실제보다 높다

검증 점수로 여러 후보 가운데 가장 좋은 것을 고르면, 고른 후보의 검증 점수에는 실제 성능과 함께 그 검증 데이터에 우연히 잘 맞은 몫이 들어 있다. 다음 코드는 정답이 특성과 아무 관계가 없는 데이터에서 "$j$번째 특성이 0보다 크면 1로 예측한다"는 후보 200개를 검증 데이터로 비교한다. 정답이 특성과 무관하므로 어떤 후보든 새 데이터에서의 정확도는 0.5 근처다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
n_val, n_test, d = 150, 150, 200
X_val, X_test = rng.normal(size=(n_val, d)), rng.normal(size=(n_test, d))
y_val, y_test = rng.integers(0, 2, n_val), rng.integers(0, 2, n_test)   # 특성과 무관한 정답

val_acc = ((X_val > 0) == y_val[:, None]).mean(axis=0)    # 후보 200개의 검증 정확도
best = val_acc.argmax()
test_acc = ((X_test[:, best] > 0) == y_test).mean()
print(f"검증 정확도 최고 {val_acc.max():.3f}, 같은 후보의 테스트 정확도 {test_acc:.3f}")
# 검증 정확도 최고 0.627, 같은 후보의 테스트 정확도 0.440
\`\`\`

가장 좋은 후보의 검증 정확도는 0.627이지만, 같은 후보의 테스트 정확도는 0.440으로 우연 수준이다. 비교하는 후보가 많을수록 우연히 높게 나오는 후보가 생기므로 이 차이가 커진다. 테스트 데이터는 고르는 데 쓰지 않았으므로 이런 차이가 없다. 테스트 점수를 보고 다시 고르면 테스트 점수도 실제보다 높아지므로, 테스트 데이터는 마지막에 한 번만 쓴다.

### 데이터 구조에 맞게 나눈다

무작위 분할은 샘플끼리 서로 독립이고, 앞으로 들어올 데이터도 지금과 같은 분포를 따른다고 가정한다. 이 가정이 맞지 않으면 나누는 방법을 바꾼다.

**층화 분할**은 분류 문제에서 클래스 비율을 학습 데이터와 평가 데이터에 똑같이 유지한다. 양성이 10%인 샘플 100개에서 20개를 떼어 내면, 무작위 분할에서는 \`random_state\`에 따라 평가 데이터의 양성이 2~4개로 달라지지만 \`train_test_split(..., stratify=y)\`는 항상 2개를 넣는다. 양성이 드문 데이터에서는 이 차이가 점수를 크게 바꾼다.

**그룹 분할**은 같은 개체에서 나온 샘플을 한쪽에만 둔다. 한 환자의 영상 여러 장처럼 샘플이 개체별로 묶여 있으면, 무작위 분할은 같은 환자의 영상을 학습 데이터와 테스트 데이터에 나눠 넣는다. 모델은 그 환자 고유의 특징으로 테스트 영상을 맞힐 수 있지만, 처음 보는 환자에게는 그 특징을 쓸 수 없다.

\`\`\`python
import numpy as np
from sklearn.model_selection import train_test_split, GroupShuffleSplit

groups = np.repeat(np.arange(100), 5)              # 환자 100명, 한 명당 기록 5건
idx = np.arange(len(groups))
tr, te = train_test_split(idx, test_size=0.2, random_state=0)
print("무작위 분할: 양쪽에 모두 있는 환자", len(set(groups[tr]) & set(groups[te])), "명")   # 70 명

gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=0)
tr, te = next(gss.split(idx, groups=groups))
print("그룹 분할: 양쪽에 모두 있는 환자", len(set(groups[tr]) & set(groups[te])), "명")     # 0 명
\`\`\`

**시간 분할**은 기준 시점 이전으로 학습하고 이후로 평가한다. 다음 달 수요처럼 미래를 예측하는 문제를 무작위로 나누면, 미래의 샘플로 학습해 과거를 맞히는 경우가 생긴다. 운영에서는 미래의 데이터를 쓸 수 없으므로, 예를 들어 1년치 데이터라면 \`df[df["date"] < "2024-10-01"]\`로 학습하고 그 이후로 평가한다.

### 데이터 누수

**데이터 누수**는 예측 시점에 쓸 수 없는 정보나 평가 데이터의 정보가 학습 과정에 들어가는 것이다. 누수가 있으면 평가 점수는 높게 나오지만, 운영에서는 그 정보가 없으므로 같은 성능이 나오지 않는다.

| 유형 | 예 | 막는 방법 |
| --- | --- | --- |
| 전처리 누수 | 분할하기 전에 전체 데이터로 표준화·결측 대체·특성 선택을 한다 | 먼저 나누고, 학습 데이터로만 \`fit\`한다 |
| 미래 정보 | 다음 달 매출을 예측하면서 다음 달에 기록되는 반품 건수를 특성으로 쓴다 | 예측 시점에 알 수 있는 정보만 쓰고, 시간 분할로 평가한다 |
| 같은 개체 | 한 환자의 영상이 학습 데이터와 테스트 데이터에 나뉘어 들어간다 | 그룹 분할 |
| 정답에서 만든 특성 | 대출 연체를 예측하면서 연체 뒤에 생기는 "추심 시작일" 열을 쓴다 | 열마다 언제, 어떻게 기록되는지 확인한다 |
| 테스트 데이터 재사용 | 테스트 점수를 보고 하이퍼파라미터를 다시 고른다 | 테스트 데이터는 마지막에 한 번만 쓴다 |

트랙 3의 중고차 과제에서 판매가 끝난 뒤에야 기록되는 가격 열을 특성에서 뺀 것이 미래 정보 누수를 막은 예다([[lesson:eda]]).

전처리 누수는 코드의 순서만으로 생긴다. 다음 코드는 정답이 무작위인 데이터(샘플 200개, 특성 5,000개)에서 정답과 관계가 강해 보이는 특성 20개를 고른 뒤 로지스틱 회귀로 학습한다([[lesson:feature-engineering]]). 첫 번째 방법은 나누기 전에 **전체 데이터**로 특성을 고르고, 두 번째 방법은 학습 데이터로만 고른다.

\`\`\`python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 5000))
y = rng.integers(0, 2, 200)                        # 특성과 무관한 정답
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.5, random_state=0)

# 잘못된 순서: 테스트 데이터의 정답까지 보고 특성을 고른다
sel = SelectKBest(f_classif, k=20).fit(X, y)
model = LogisticRegression(max_iter=1000).fit(sel.transform(X_tr), y_tr)
print("전체 데이터로 선택:", model.score(sel.transform(X_te), y_te))      # 0.82

# 올바른 순서: 특성 선택도 학습 데이터로만 fit한다
pipe = make_pipeline(SelectKBest(f_classif, k=20), LogisticRegression(max_iter=1000))
pipe.fit(X_tr, y_tr)
print("학습 데이터로 선택:", pipe.score(X_te, y_te))                     # 0.48
\`\`\`

특성이 5,000개이면 정답과 우연히 상관이 높아 보이는 특성이 생긴다. 전체 데이터로 고르면 테스트 데이터의 정답과 우연히 맞는 특성까지 골라, 정보가 없는 데이터에서 정확도 0.82가 나온다. 학습 데이터로만 고르면 그 우연한 상관이 테스트 데이터에서 나타나지 않아 우연 수준인 0.48이 나온다.

[[diagram:leakage-scaler]]

### 파이프라인으로 순서를 고정한다

표준화·결측 대체·인코딩·특성 선택처럼 데이터에서 값을 계산하는 전처리는 모두 학습 데이터로만 \`fit\`하고, 검증·테스트 데이터에는 \`transform\`만 한다([[lesson:encoding-scaling]]). \`make_pipeline\`으로 전처리와 모델을 묶으면 \`pipe.fit\`이 학습 데이터로만 전처리 규칙을 계산하고, \`pipe.predict\`와 \`pipe.score\`는 저장된 규칙으로 새 데이터를 변환한다. 분할을 여러 번 반복하는 교차검증에서도 매번 같은 순서가 지켜진다([[lesson:cross-validation]]).

:::warn 흔한 실수
- **테스트 점수로 하이퍼파라미터나 모델을 고른다.** 고르는 일은 검증 데이터로 하고, 테스트 데이터는 마지막에 한 번만 쓴다.
- **분할하기 전에 전체 데이터로 전처리한다.** 먼저 나누고, 전처리는 파이프라인에 넣어 학습 데이터로만 \`fit\`한다.
- **같은 개체의 샘플을 무작위로 나눈다.** 환자·사용자 단위로 나누는 그룹 분할을 쓴다.
- **시간 순서가 있는 데이터를 섞어서 나눈다.** 기준 시점 이전으로 학습하고 이후로 평가한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "검증 데이터와 테스트 데이터의 역할을 바르게 짝지은 것은?",
      choices: [
        "검증: 하이퍼파라미터와 모델 선택 / 테스트: 모든 선택이 끝난 뒤 최종 성능을 한 번 잰다",
        "검증: 파라미터 학습 / 테스트: 하이퍼파라미터 선택",
        "둘 다 하이퍼파라미터 선택에 쓴다",
        "테스트 점수가 가장 높은 모델을 고르는 것이 가장 정확하다",
      ],
      answer: 0,
      explanation: "테스트 점수를 보고 결정을 바꾸면 테스트 데이터도 고르는 데 쓰인 셈이 되어, 최종 점수가 실제 성능보다 높게 나온다.",
    },
    {
      key: "c2",
      question: "정답과 무관한 후보 200개를 검증 데이터로 비교했더니 가장 좋은 후보의 검증 정확도가 0.627이었다. 같은 후보의 테스트 정확도로 가장 그럴듯한 값은?",
      choices: ["0.5 근처", "0.627 근처", "0.627보다 높다", "1.0"],
      answer: 0,
      explanation: "후보가 정답을 맞힐 정보가 없으므로 실제 성능은 0.5다. 0.627은 200개 가운데 검증 데이터에 우연히 잘 맞은 후보를 고른 결과다.",
    },
    {
      key: "c3",
      question: "다음 중 데이터 누수가 **아닌** 것은?",
      choices: [
        "스케일러와 모델을 파이프라인으로 묶어 학습 데이터로 fit한다",
        "분할하기 전에 전체 데이터로 표준화한다",
        "같은 환자의 영상이 학습 데이터와 테스트 데이터에 모두 있다",
        "예측 시점 이후에 기록되는 정보를 특성으로 쓴다",
      ],
      answer: 0,
      explanation: "파이프라인은 학습 데이터로만 스케일러의 평균·표준편차를 계산하므로 누수를 막는 방법이다.",
    },
    {
      key: "c4",
      question: "환자 300명의 흉부 영상 3,000장으로 새 환자의 폐렴을 진단하는 모델을 만든다. 알맞은 분할은?",
      choices: [
        "환자 단위로 나눠, 한 환자의 영상이 한쪽에만 들어가게 한다",
        "영상 단위로 무작위로 나눈다",
        "영상 파일 이름 순서로 앞의 80%를 학습에 쓴다",
        "모든 영상을 학습에 쓰고 학습 정확도를 보고한다",
      ],
      answer: 0,
      explanation: "운영에서는 처음 보는 환자를 진단한다. 같은 환자의 영상이 양쪽에 있으면 환자 고유의 특징으로 맞힐 수 있어 점수가 실제보다 높다.",
    },
    {
      key: "c5",
      question: "다음 주 매장별 판매량을 예측하는 모델을 2년치 일별 데이터로 평가할 때 알맞은 분할은?",
      choices: [
        "마지막 몇 달을 평가 데이터로 두고 그 이전으로 학습한다",
        "날짜를 섞어 무작위로 나눈다",
        "요일마다 무작위로 하나씩 골라 평가 데이터로 둔다",
        "판매량이 큰 날만 평가 데이터로 둔다",
      ],
      answer: 0,
      explanation: "운영에서는 과거 데이터로 미래를 예측한다. 무작위로 섞으면 미래의 샘플로 학습해 과거를 맞히는 경우가 생겨 실제보다 좋은 점수가 나온다.",
    },
    {
      key: "c6",
      question: "`X_sel = SelectKBest(k=20).fit_transform(X, y)`로 특성을 고른 다음 `X_sel`을 학습·테스트 데이터로 나눠 평가했다. 무엇이 문제인가?",
      choices: [
        "테스트 데이터의 정답까지 보고 특성을 골랐으므로 테스트 점수가 실제보다 높게 나온다",
        "문제없다. 특성 선택은 정답을 쓰지 않는다",
        "특성 20개는 너무 적다",
        "SelectKBest는 분류 문제에 쓸 수 없다",
      ],
      answer: 0,
      explanation: "SelectKBest는 특성마다 정답과의 관계를 계산해 고른다. 나누기 전에 실행하면 테스트 데이터의 정답이 선택에 쓰인다. 특성 선택을 파이프라인에 넣어 학습 데이터로만 fit해야 한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
from sklearn.model_selection import train_test_split
y = np.array([0] * 90 + [1] * 10)
y_tr, y_te = train_test_split(y, test_size=0.2, stratify=y, random_state=0)
print(len(y_tr), int(y_tr.sum()), len(y_te), int(y_te.sum()))
`,
      expected: "80 8 20 2",
      explanation: "100개 가운데 20%인 20개가 평가 데이터가 된다. 층화 분할은 양성 비율 10%를 양쪽에 유지하므로 학습 데이터 80개에 양성 8개, 평가 데이터 20개에 양성 2개가 들어간다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "하이퍼파라미터를 검증 데이터로 고른 뒤에도 테스트 데이터를 따로 두는 이유를, 여러 후보 가운데 가장 좋은 것을 고르는 과정과 연결해 설명하라. 테스트 점수를 보고 모델을 다시 고르면 무엇이 달라지는지도 쓰라.",
      answer: md`
검증 점수로 여러 후보 가운데 가장 좋은 것을 고르면, 고른 후보의 검증 점수에는 실제 성능과 함께 그 검증 데이터에 우연히 잘 맞은 몫이 들어 있다. 후보가 많을수록 우연히 높게 나오는 후보가 생기므로 검증 점수는 고른 모델의 성능을 실제보다 높게 보여 준다. 테스트 데이터는 고르는 데 쓰지 않았으므로, 그 점수는 고른 모델이 새 데이터에서 내는 성능을 편향 없이 추정한다.

테스트 점수를 보고 모델이나 하이퍼파라미터를 다시 고르면 테스트 데이터도 고르는 데 쓰인 셈이 된다. 그러면 테스트 점수도 검증 점수처럼 실제보다 높게 나오고, 새 데이터에서의 성능을 추정할 데이터가 남지 않는다.
`,
      keyPoints: [
        "여러 후보 중 최고를 고르면 그 데이터에 우연히 맞은 몫만큼 점수가 높다",
        "후보가 많을수록 차이가 커진다",
        "테스트 데이터는 고르는 데 쓰지 않아 편향 없는 추정을 준다",
        "테스트 점수로 다시 고르면 테스트 점수도 실제보다 높아진다",
      ],
    },
    {
      key: "d2",
      question: "환자 2,000명의 3년치 진료 기록 3만 건으로, 퇴원한 환자가 30일 안에 다시 입원할지 예측하는 모델을 만든다. 학습·검증·테스트 데이터를 나누는 방법을 정하고, 각 결정의 이유를 쓰라. 결측 대체와 표준화를 어느 데이터로 계산하는지도 쓰라.",
      answer: md`
운영에서는 앞으로 퇴원하는 환자, 그중에는 처음 보는 환자도 예측해야 하므로 평가도 같은 조건으로 한다. 먼저 시간으로 나눠, 예를 들어 처음 2년을 학습, 다음 6개월을 검증, 마지막 6개월을 테스트 데이터로 둔다. 무작위로 섞으면 미래 기록으로 학습해 과거를 맞히게 된다.

같은 환자의 기록이 여러 건이므로 환자 단위로도 나눈다. 학습 기간에 나온 환자를 평가 기간에서 빼거나, 환자를 먼저 그룹으로 나눈 뒤 기간을 적용해 한 환자의 기록이 양쪽에 들어가지 않게 한다. 그래야 환자 고유의 특징으로 맞히는 경우를 막는다.

결측 대체값과 표준화의 평균·표준편차는 학습 데이터로만 계산하고, 파이프라인으로 묶어 검증·테스트 데이터에는 transform만 한다. 하이퍼파라미터는 검증 데이터로 고르고, 테스트 데이터는 마지막에 한 번만 쓴다. 또한 퇴원 시점 이후에 기록되는 정보(다음 진료 일정 등)는 특성에서 뺀다.
`,
      keyPoints: [
        "시간 순서로 나눈다(과거로 학습, 이후 기간으로 평가)",
        "환자 단위로 나눠 같은 환자가 양쪽에 들어가지 않게 한다",
        "전처리 통계는 학습 데이터로만 계산하고 파이프라인으로 묶는다",
        "테스트 데이터는 마지막에 한 번, 예측 시점 이후 정보는 특성에서 제외",
      ],
    },
  ],
  references: [
    { title: "scikit-learn — Common pitfalls and recommended practices", url: "https://scikit-learn.org/stable/common_pitfalls.html", note: "전처리 누수와 파이프라인 사용법 (영문)" },
    { title: "scikit-learn — Cross-validation: evaluating estimator performance", url: "https://scikit-learn.org/stable/modules/cross_validation.html", note: "검증 데이터의 역할, 그룹·시계열 분할 (영문)" },
    { title: "Kapoor & Narayanan — Leakage and the reproducibility crisis in ML-based science", url: "https://reproducible.cs.princeton.edu/", note: "논문에서 발견된 누수 유형 정리 (영문)" },
  ],
});
