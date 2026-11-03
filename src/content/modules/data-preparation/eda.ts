import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/eda";

export default defineLesson({
  id: "eda",
  title: "탐색적 데이터 분석과 데이터 품질",
  tier: "core",
  concepts: ["eda-quality"],
  goal: "정해진 순서(구조·결측·중복·범위·분포·목표 변수·관계)로 데이터를 점검해 품질 문제를 찾아 기록하고, 클래스 불균형과 목표 변수의 정보가 새어 든 특성(누수 후보)을 찾아낸다.",
  why: "모델을 만들기 전에 데이터를 점검하지 않으면, 잘못 기록된 값이나 학습 시점에 알 수 없는 정보가 섞인 특성 때문에 평가 성능이 실제보다 크게 좋게 나온다([[lesson:data-splits]]). 점검에서 찾은 문제와 처리 내용은 데이터 문서로 남긴다([[lesson:model-cards]]).",
  body: md`
### 탐색적 데이터 분석의 순서

**탐색적 데이터 분석**(EDA)은 모델을 만들기 전에 데이터의 구조와 품질, 변수 사이의 관계를 확인하는 작업이다. 그때그때 떠오르는 대로 그래프를 그리면 놓치는 것이 생기므로, 다음 순서로 점검하고 발견한 내용을 기록한다.

1. **구조**: 행·열의 수, 각 열의 뜻과 자료형, 한 행이 무엇을 나타내는지
2. **결측**: 열마다 결측 비율과 결측이 몰린 집단
3. **중복**: 완전히 같은 행, 같은 키(ID)가 여러 번 나오는 행
4. **범위와 표기**: 수치형의 최솟값·최댓값이 말이 되는지, 범주형의 값 목록과 표기
5. **분포**: 수치형 변수의 치우침과 이상치, 범주별 개수([[lesson:visualization]])
6. **목표 변수**: 예측할 값의 분포. 분류라면 클래스 비율
7. **관계**: 특성과 목표 변수의 관계, 특성끼리의 상관. 지나치게 강한 관계는 누수를 의심한다.

아래 예제는 [[lesson:visualization]]의 앱 사용자 데이터에 실제 데이터에서 흔한 문제를 넣은 것이다. 예측할 목표는 해지 여부 \`churned\`다.

\`\`\`python
import numpy as np
import pandas as pd

rng = np.random.default_rng(0)
n = 300
plan = rng.choice(["free", "basic", "pro"], size=n, p=[0.5, 0.3, 0.2])
sessions = rng.poisson(np.where(plan == "pro", 9, np.where(plan == "basic", 6, 3)))
df = pd.DataFrame({
    "user_id": np.arange(1, n + 1),
    "age": rng.normal(35, 10, n).clip(18, 70).round(),
    "plan": plan,
    "sessions": sessions,
    "minutes": rng.lognormal(2.5, 0.6, n).round(1),
    "churned": (rng.random(n) < 1 / (1 + np.exp(-(1.2 - 0.35 * sessions)))).astype(int),
})
df.loc[[5, 17], "age"] = [0, 150]                                   # 잘못 입력된 나이
df.loc[rng.choice(n, 12, replace=False), "minutes"] = np.nan        # 결측
df.loc[[0, 1, 4], "plan"] = ["Free", "free ", "basic"]              # 표기 불일치
df["refund_amount"] = np.where(df["churned"] == 1, rng.integers(1000, 9000, n), 0)   # 해지 뒤에 생기는 값
df = pd.concat([df, df.iloc[[3, 40]]], ignore_index=True)           # 중복 행
\`\`\`

### 구조, 결측, 중복, 범위

\`\`\`python
print(df.shape)                                     # (302, 7)
print(df.isna().mean().round(3)[lambda s: s > 0].to_dict())       # {'minutes': 0.04}
print(df.duplicated().sum(), df.duplicated(subset=["user_id"]).sum())   # 2 2
print(df["plan"].value_counts().to_dict())          # Free, "free "처럼 표기가 다른 값이 섞였다
print(df[["age", "minutes"]].describe().round(1))   # 나이의 최솟값 0, 최댓값 150
\`\`\`

한 행이 사용자 한 명이라면 \`user_id\`는 중복되면 안 된다. 완전히 같은 행은 수집 과정에서 두 번 들어간 것이고, 키만 같고 다른 열이 다르다면 어느 행이 맞는지 먼저 확인해야 한다. 나이 0과 150은 실제로 있을 수 없는 값이라 입력 오류로 보고 결측으로 바꾼 뒤 처리한다. 이런 문제는 [[lesson:data-cleaning]]의 방법으로 고친다.

데이터 품질은 보통 다음 기준으로 점검한다.

| 기준 | 질문 | 이 예제에서 찾은 문제 |
| --- | --- | --- |
| 완전성 | 있어야 할 값이 있는가 | \`minutes\` 결측 4% |
| 유효성 | 값이 가능한 범위·형식 안에 있는가 | 나이 0, 150 |
| 일관성 | 같은 것을 같게 적었는가 | \`Free\`, \`free \` |
| 유일성 | 한 번만 있어야 할 것이 한 번만 있는가 | 같은 사용자 2명이 두 번 |
| 적시성 | 예측 시점에 알 수 있는 값인가 | \`refund_amount\`(아래) |

### 목표 변수와 클래스 불균형

\`\`\`python
print(df["churned"].value_counts(normalize=True).round(3).to_dict())   # {0: 0.626, 1: 0.374}
\`\`\`

이 데이터는 해지한 사용자가 37%다. 클래스가 한쪽으로 크게 치우치면(예: 양성 2%) 모두 음성으로 예측하는 모델도 정확도가 98%가 되므로, 평가 지표를 고르고([[lesson:classification-metrics]]) 데이터를 나눌 때 층화추출을 쓴다([[lesson:sampling]]). 목표 변수의 비율은 기준 모델의 성능을 정할 때도 쓴다([[lesson:baselines]]).

### 특성과 목표 변수의 관계, 누수 후보

\`\`\`python
print(df.groupby("churned")[["sessions", "minutes"]].median())
print(df[["age", "sessions", "minutes", "refund_amount"]].corrwith(df["churned"]).round(3).to_dict())
print(((df["refund_amount"] > 0) == (df["churned"] == 1)).mean())   # 1.0: 환불액만 보면 해지 여부를 100% 맞힌다
\`\`\`

해지한 사용자는 접속 횟수의 중앙값이 3으로, 해지하지 않은 사용자(6)보다 적다. 이런 관계는 모델이 학습할 유용한 정보다. 반면 \`refund_amount\`는 해지 여부와의 상관이 약 0.85이고, 환불액이 있는지만 보면 해지 여부를 모두 맞힌다. 환불은 해지한 **뒤에** 생기는 값이라 해지를 예측해야 하는 시점에는 알 수 없다. 이렇게 예측 시점에 알 수 없는 정보나 목표 변수에서 만들어진 정보가 특성에 섞이는 것을 **누수**(leakage)라고 한다. 누수가 있으면 평가 성능은 매우 높지만 실제로 쓰면 성능이 크게 떨어진다.

목표 변수와의 관계가 **지나치게** 강한 특성을 보면 다음을 확인한다.

- 이 값은 언제, 누가 기록하는가? 예측 시점보다 나중에 생기지 않는가?
- 목표 변수를 계산하는 데 쓰인 값이거나 목표 변수에서 만들어진 값이 아닌가?
- 같은 사람의 다른 기록에서 온 값이 아닌가?

### 점검 결과 기록하기

EDA의 결과는 그래프 몇 장이 아니라, 무엇을 발견했고 어떻게 처리했는지의 기록이다. 데이터의 출처와 수집 기간, 행이 뜻하는 것, 열의 설명, 발견한 품질 문제와 처리 방법, 목표 변수의 분포, 누수 위험이 있어 제외한 열을 표로 정리한다. 이 기록이 데이터 문서(데이터 카드)의 바탕이 되고, 나중에 모델의 한계를 설명하는 근거가 된다([[lesson:model-cards]]).

:::warn 흔한 실수
- **평균만 보고 범위를 확인하지 않는다.** 나이 150 같은 값은 최솟값·최댓값을 봐야 찾을 수 있다.
- **완전히 같은 행만 중복으로 본다.** 키가 같은 행도 확인한다.
- **목표 변수와 관계가 강한 특성을 반긴다.** 지나치게 강하면 먼저 누수를 의심하고, 그 값이 예측 시점에 있는지 확인한다.
- **발견한 내용을 기록하지 않는다.** 처리한 문제와 이유를 남겨야 다른 사람이 결과를 재현하고 해석할 수 있다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "사용자 한 명이 한 행인 표에서 `df.duplicated().sum()`이 0인데 `df.duplicated(subset=['user_id']).sum()`이 5다. 알 수 있는 것은?",
      choices: [
        "같은 사용자 ID가 다른 내용으로 여러 번 기록된 행이 있다",
        "중복 문제가 없다",
        "결측값이 5개 있다",
        "user_id 열의 자료형이 잘못되었다",
      ],
      answer: 0,
      explanation: "행 전체가 같은 중복은 없지만 키가 같은 행이 있다. 어느 행이 맞는지(최신 기록인지, 입력 오류인지) 확인한 뒤 처리해야 한다.",
    },
    {
      key: "c2",
      question: "나이 열의 `describe()`에서 최솟값 0, 최댓값 150이 나왔다. 이것은 어떤 품질 기준의 문제인가?",
      choices: ["유효성", "유일성", "적시성", "완전성"],
      answer: 0,
      explanation: "값이 가능한 범위를 벗어났으므로 유효성 문제다. 입력 오류로 보고 결측으로 바꾼 뒤 처리한다.",
    },
    {
      key: "c3",
      question: "해지 예측 데이터의 `refund_amount`(환불액)만 보면 해지 여부를 100% 맞힐 수 있다. 가장 알맞은 판단은?",
      choices: [
        "환불은 해지한 뒤에 생기는 값이라 예측 시점에 알 수 없으므로 특성에서 제외한다",
        "가장 좋은 특성이므로 반드시 사용한다",
        "상관이 크므로 표준화한 뒤 사용한다",
        "결측값을 채운 뒤 사용한다",
      ],
      answer: 0,
      explanation: "예측 시점에 알 수 없는 정보가 특성에 섞이는 누수다. 평가 성능은 매우 높게 나오지만, 실제로 해지를 예측해야 하는 시점에는 이 값이 없다.",
    },
    {
      key: "c4",
      question: "양성 클래스가 2%인 데이터에서 목표 변수의 분포를 확인해야 하는 이유로 알맞지 **않은** 것은?",
      choices: [
        "양성이 적으면 모델이 항상 더 정확해지기 때문이다",
        "모두 음성으로 예측해도 정확도가 98%라 정확도만으로는 평가할 수 없기 때문이다",
        "데이터를 나눌 때 층화추출이 필요하기 때문이다",
        "기준 모델의 성능을 정할 때 쓰기 때문이다",
      ],
      answer: 0,
      explanation: "클래스가 불균형하면 정확도가 높아 보여도 양성을 거의 찾지 못할 수 있다. 평가 지표, 데이터 분할, 기준 모델을 정할 때 클래스 비율을 쓴다.",
    },
    {
      key: "c5",
      question: "EDA를 정해진 순서로 진행하고 결과를 기록하는 이유로 가장 알맞은 것은?",
      choices: [
        "점검 항목을 빠뜨리지 않고, 발견한 문제와 처리 내용을 다른 사람이 확인하고 재현할 수 있게 하려고",
        "그래프를 더 예쁘게 그리려고",
        "모델의 학습 속도를 높이려고",
        "데이터의 크기를 줄이려고",
      ],
      answer: 0,
      explanation: "떠오르는 대로 탐색하면 결측·중복·범위 같은 기본 점검을 놓치기 쉽다. 기록은 데이터 문서의 바탕이 되고 모델의 한계를 설명하는 근거가 된다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import pandas as pd
df = pd.DataFrame({"id": [1, 2, 2, 3, 3], "v": [10, 20, 20, 30, 31]})
print(df.duplicated().sum(), df.duplicated(subset=["id"]).sum(), df.drop_duplicates().shape[0])
`,
      expected: "1 2 4",
      explanation: "행 전체가 같은 중복은 (2, 20) 한 번뿐이다. id만 보면 2와 3이 각각 한 번씩 더 나와 중복이 2개다. 완전한 중복만 지우면 4행이 남고, id 3의 두 행(30과 31)은 어느 쪽이 맞는지 따로 확인해야 한다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "고객 해지를 예측하는 데이터를 받았다. EDA에서 점검할 항목을 순서대로 쓰고, 그중 누수를 찾기 위해 확인할 것을 구체적으로 설명하라.",
      answer: md`
점검 순서는 다음과 같다. (1) 행과 열의 수, 열의 뜻과 자료형, 한 행이 무엇인지. (2) 열마다 결측 비율과 결측이 몰린 집단. (3) 완전히 같은 행과 고객 ID가 중복된 행. (4) 수치형의 최솟값·최댓값과 범주형의 값 목록·표기. (5) 변수마다 분포와 이상치. (6) 해지 여부의 클래스 비율. (7) 특성과 해지 여부의 관계, 특성끼리의 상관.

누수를 찾으려면 해지 여부와의 관계가 지나치게 강한 특성을 먼저 본다. 그런 특성마다 그 값이 언제, 어떤 과정에서 기록되는지 확인해, 해지를 예측해야 하는 시점보다 나중에 생기는 값(환불액, 해지 사유, 마지막 접속일 이후의 기록 등)인지, 해지 여부를 계산하는 데 쓰인 값인지 판단한다. 해당하면 특성에서 제외하고 그 이유를 기록한다.
`,
      keyPoints: ["구조 → 결측 → 중복 → 범위·표기 → 분포 → 목표 변수 → 관계 순서", "클래스 비율 확인", "목표 변수와 지나치게 강한 관계는 누수 후보", "값이 기록되는 시점이 예측 시점보다 늦은지 확인하고 제외 이유를 기록"],
    },
  ],
  references: [
    { title: "Google — Rules of Machine Learning", url: "https://developers.google.com/machine-learning/guides/rules-of-ml", note: "데이터와 특성 점검, 학습·서빙 차이에 대한 실무 지침 (영문)" },
    { title: "scikit-learn — Common pitfalls and recommended practices", url: "https://scikit-learn.org/stable/common_pitfalls.html", note: "데이터 누수와 전처리를 잘못 적용하는 사례 (영문)" },
  ],
});
