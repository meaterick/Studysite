import { defineLesson, md } from "../../kit";
import exercises from "./labs/data-splits";

export default defineLesson({
  id: "data-splits",
  title: "학습·검증·테스트 데이터와 데이터 누수",
  tier: "core",
  concepts: ["data-splits-leakage"],
  goal: "훈련·검증·테스트셋의 역할과 K-Fold 교차검증을 설명하고, 전처리를 파이프라인에 넣어 데이터 누수를 막을 수 있다.",
  why: "",
  body: md`
모델을 학습시킨 바로 그 데이터로 그 모델의 성능을 평가하면 안 된다. 학습에 사용된 데이터에 대한 오차(훈련 오차, training error)는 모델이 그 데이터의 노이즈까지 일부 암기했을 가능성이 있어, 처음 보는 데이터에 대한 오차(일반화 오차, generalization error)를 체계적으로 과소평가한다. 그래서 데이터를 미리 세 부분으로 분리해둔다. 훈련셋(train set)은 파라미터 $\theta$를 직접 최적화하는 데 쓰인다. 검증셋(validation set)은 하이퍼파라미터(정규화 강도 $\lambda$, 다항식 차수 등 경사하강법으로 직접 최적화되지 않는 값)를 선택하기 위해 반복적으로 사용된다. 테스트셋(test set)은 모든 모델·하이퍼파라미터 선택이 끝난 뒤, 최종 성능을 단 한 번 추정하는 데만 사용한다. 검증셋 점수를 보고 하이퍼파라미터를 계속 바꾸는 것은 문제가 없지만, 테스트셋 점수를 보고 그 이후의 어떤 결정이라도 바꾸면 테스트셋의 정보가 모델 선택 과정에 유입되어(정보 누수), 그 시점부터 테스트셋은 더 이상 편향되지 않은(unbiased) 일반화 성능 추정치를 제공하지 못한다.

데이터가 충분하지 않을 때는 검증셋을 한 번만 고정해서 떼어놓는 것 자체가 데이터 낭비이자 성능 추정치의 분산을 키우는 요인이 된다. 이럴 때 쓰는 것이 K-Fold 교차검증이다. 전체 훈련 데이터를 K개의 겹치지 않는 조각(fold)으로 나눈 뒤, 매번 한 조각을 검증용으로 남기고 나머지 K−1개 조각으로 학습하는 과정을 K번 반복하여 K개의 성능 점수를 얻고 그 평균과 표준편차를 계산한다. 모든 샘플이 한 번씩 검증에 쓰이므로, 분할을 한 번만 했을 때처럼 그 특정 분할에서 우연히 나온 값 하나에 좌우되지 않는다는 것이 핵심 이점이다.

샘플 10개를 5-Fold로 나누면 실제로 어떻게 되는지 번호로 보자. 매 fold에서 두 개가 검증으로 빠지고 나머지 여덟 개(80%)로 학습하며, 다섯 번 동안 모든 샘플이 **정확히 한 번씩** 검증에 쓰인다.

\`\`\`python
import numpy as np
from sklearn.model_selection import KFold

X = np.arange(10)                       # 샘플 10개(번호만)
for i, (tr, va) in enumerate(KFold(n_splits=5).split(X), start=1):
    print(f"fold {i}: 훈련 {tr} / 검증 {va}")
\`\`\`

실제로는 데이터 순서에 패턴이 있을 수 있으므로(예: 앞쪽은 모두 음성) \`KFold(5, shuffle=True, random_state=0)\`처럼 섞어서 나누고, 분류 문제라면 fold마다 클래스 비율을 유지하는 \`StratifiedKFold\`를 쓴다.

:::info fold 점수의 흩어짐
교차검증 결과를 "F1 = 0.97 ± 0.01"처럼 적을 때 ±0.01은 fold 점수 K개가 얼마나 흩어져 있는지를 나타낼 뿐, 평균의 신뢰구간이 아니다. fold끼리 훈련 데이터가 겹쳐 서로 독립이 아니기 때문이다. 그래서 두 모델을 비교할 때는 "평균 ± 표준편차"를 눈으로 겹쳐 보기보다 **같은 fold에서 짝지은 점수 차이**를 본다. 자세한 이유와 올바른 검정은 심화 과정의 「평가의 통계학」 단계에서 다룬다.
:::

[[diagram:data-split]]

:::warn 누수(leakage) 사례
① 전체 데이터로 표준화 후 분할 ② 미래 정보가 특징에 포함(시계열) ③ 동일 환자의 샘플이 train/test 양쪽에 존재 ④ 타깃에서 파생된 열 사용.
:::

이 네 가지 사례에 공통된 문제는 사실 하나다. 모델을 평가할 때만 사용해야 할 정보(테스트셋 또는 예측 시점 이후의 정보)가 학습 과정에 미리 유입된 것이다. 예를 들어 ①번처럼 전체 데이터(훈련+테스트)를 합쳐서 평균·표준편차를 계산한 뒤 표준화를 하면, 테스트셋의 통계 정보가 훈련 과정에 은연중에 새어 들어간다. 이렇게 얻은 성능 점수는 실제 운영 환경에서는 결코 재현되지 않는, 가짜로 부풀려진 점수다. 그래서 바로 아래 코드에서 스케일러(StandardScaler)를 반드시 파이프라인 안에, 교차검증 루프 안쪽에 넣어야 한다. 그래야 매 fold마다 훈련 부분만 보고 통계를 계산하게 된다.

[[diagram:leakage-scaler]]

이제 실제 이진분류 데이터(유방암 진단 데이터셋)로 넘어가자. 여기서 확인해야 할 핵심은 모델의 정확도가 아니라 "검증 방식 자체가 올바른가"다. 위에서 다룬 데이터 누수를 실제로 피해가는 코드가 어떻게 생겼는지 눈여겨보자. StandardScaler를 make_pipeline 안에 넣어서, 교차검증의 매 fold마다 훈련 부분에서만 평균·표준편차를 계산하도록 강제한다. 만약 스케일러를 파이프라인 밖에 두고 Xtr 전체에 미리 fit하면, 각 fold의 검증 부분 정보가 스케일링 과정에 은연중에 섞여 들어간다.

아래 셀의 데이터 분할(\`random_state=0\`, \`stratify=y\`)과 모델은 다음 단계에서도 똑같이 다시 만들어 쓴다. 모든 셀은 이렇게 필요한 것을 스스로 만들기 때문에 원하는 순서로, 몇 번이든 독립적으로 실행할 수 있다.

\`\`\`python
# 분류 + 교차검증 (누수 방지: 스케일러를 파이프라인 안에!)
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

X, y = load_breast_cancer(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
clf = make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=1000))
cv_f1 = cross_val_score(clf, Xtr, ytr, cv=5, scoring="f1")
print(f"5-Fold 교차검증 F1 평균 = {cv_f1.mean():.4f} (fold별 점수: {np.round(cv_f1, 3)})")

clf.fit(Xtr, ytr)
print(classification_report(yte, clf.predict(Xte)))
\`\`\`

stratify=y로 나눈 이유도 짚고 넘어가자. 단순히 무작위로 나누면 훈련셋과 테스트셋의 양성·음성 비율이 우연히 서로 달라질 수 있는데, stratify는 원래 데이터의 클래스 비율을 훈련셋과 테스트셋 양쪽에 그대로 유지시켜준다. \`cross_val_score\`는 5번의 fold 각각에서 계산된 F1 점수 5개를 배열로 돌려주므로, 그 평균(\`cv_f1.mean()\`)이 한 번의 분할로 얻은 점수보다 훨씬 믿을 만한 추정치라는 것을 기억해두자.
`,
  checks: [
    {
      key: "c1",
      question: "검증셋과 테스트셋의 역할을 올바르게 짝지은 것은?",
      choices: ["검증: 파라미터 학습 / 테스트: 하이퍼파라미터 선택", "검증: 하이퍼파라미터 선택 / 테스트: 모든 결정이 끝난 뒤 최종 성능 1회 추정", "둘 다 하이퍼파라미터 선택", "테스트셋 점수를 보고 모델을 고르는 것이 가장 정확하다"],
      answer: 1,
      explanation: "테스트 점수를 보고 결정을 바꾸는 순간 테스트셋 정보가 모델 선택에 새어 들어가 더 이상 편향 없는 추정치가 아니게 된다.",
    },
    {
      key: "c2",
      question: "다음 중 데이터 누수에 해당하지 **않는** 것은?",
      choices: ["분할 전에 전체 데이터로 표준화", "같은 환자의 샘플이 훈련·테스트에 모두 존재", "예측 시점 이후의 정보를 특징으로 사용", "스케일러를 파이프라인에 넣어 교차검증"],
      answer: 3,
      explanation: "파이프라인 안의 스케일러는 매 fold의 훈련 부분만 보고 fit하므로 누수를 막는 올바른 방법이다.",
    },
    {
      key: "c3",
      question: "완전히 무작위인 데이터에서 교차검증 정확도가 85%가 나왔다. 가장 먼저 의심할 것은?",
      choices: ["모델이 매우 뛰어나다", "데이터 누수(검증 fold의 정보가 전처리·특징 선택에 섞였다)", "학습률이 너무 작다", "K-Fold의 K가 너무 크다"],
      answer: 1,
      explanation: "정보가 없는 데이터에서 우연 수준(50%)보다 크게 높다면, 평가 과정 어딘가에서 정답 정보가 새어 들어간 것이다.",
    },
    {
      key: "c4",
      question: "5-Fold 교차검증 결과 \"F1 = 0.970 ± 0.012\"에서 ±0.012에 대한 설명으로 옳은 것은?",
      choices: ["참 F1이 95% 확률로 0.958~0.982 사이에 있다는 신뢰구간이다", "fold 점수 5개의 흩어짐을 요약한 값으로, fold끼리 훈련 데이터가 겹쳐 서로 독립이 아니므로 신뢰구간으로 해석하면 안 된다", "테스트셋에서의 오차 범위다", "표준편차가 작을수록 모델이 더 정확하다는 뜻이다"],
      answer: 1,
      explanation: "5-Fold에서 두 fold의 훈련 데이터는 75%가 겹친다. 이런 상관 때문에 K-Fold 평균의 분산을 편향 없이 추정하는 일반적인 방법이 없다(Bengio & Grandvalet, 2004). 또 np.std(ddof=0)와 pandas .std()(ddof=1)는 같은 점수에서도 값이 다르므로 무엇을 계산했는지 밝힌다.",
    },
    {
      key: "c5",
      question: "샘플 100개로 5-Fold 교차검증을 할 때, 각 샘플은 검증에 몇 번 쓰이고 한 번의 학습에는 몇 개가 쓰이는가?",
      choices: ["검증에 정확히 1번, 학습에는 80개", "검증에 5번, 학습에는 100개", "검증에 1번, 학습에는 20개", "검증에 0번, 학습에는 80개"],
      answer: 0,
      explanation: "100개를 20개씩 다섯 조각으로 나눠, 매번 한 조각(20개)을 검증으로 빼고 나머지 80개로 학습한다. 다섯 번 돌면 모든 샘플이 한 번씩 검증된다.",
    },
    {
      key: "c6",
      question: "양성이 5%뿐인 분류 데이터에서 교차검증을 할 때 `StratifiedKFold`를 쓰는 이유는?",
      choices: ["fold마다 양성 비율(5%)이 유지되어, 양성이 거의 없는 fold가 생기지 않게 하려고", "학습 속도를 높이려고", "데이터 누수를 완전히 막으려고", "양성 샘플을 복제해 늘리려고"],
      answer: 0,
      explanation: "무작위로 나누면 어떤 fold에는 양성이 거의 없어 점수가 크게 흔들린다. 층화(stratify)는 원래 비율을 fold마다 유지한다. 누수 방지는 별개의 문제다.",
    },
    {
      key: "c7",
      question: "`X_sel = SelectKBest(k=20).fit_transform(X, y)` 다음에 `cross_val_score(model, X_sel, y, cv=5)`를 실행했다. 무엇이 문제인가?",
      choices: ["문제없다. 특징 선택은 레이블을 쓰지 않는다", "특징을 고를 때 검증 fold의 레이블까지 봤기 때문에 교차검증 점수가 부풀려진다", "fold 수가 너무 적다", "SelectKBest는 분류에 쓸 수 없다"],
      answer: 1,
      explanation: "SelectKBest는 각 특징과 레이블 y의 관계로 특징을 고르므로, 전체 데이터로 먼저 고르면 검증 fold의 정답 정보가 학습 단계에 새어 들어갑니다. 특징 선택까지 파이프라인에 넣어 fold마다 훈련 부분으로만 고르게 해야 합니다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "테스트셋을 보고 하이퍼파라미터를 고르면 무엇이 문제인가?",
      answer: md`
테스트셋 정보가 모델 선택에 새어 들어가 일반화 성능이 낙관적으로 추정된다(선택 편향·누수).
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "K-Fold 교차검증에서 K를 5에서 10으로 늘리면 어떤 장점과 어떤 단점이 생기는가?",
      answer: md`
K를 늘리면 각 fold의 훈련 데이터가 늘어(전체의 80%→90%) 성능을 비관적으로 추정하는 편향이 줄지만(데이터가 적을 때 유리), fold 수만큼 모델을 반복 학습해야 하므로 계산 비용이 커진다. 또 검증 fold가 작아져 fold 점수 하나하나는 더 흔들리고, 훈련 데이터가 더 많이 겹쳐 fold끼리의 상관도 커지므로 평균 추정의 분산이 반드시 줄지는 않는다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "샘플 100개, 의미 없는 특징 5,000개, 동전 던지기로 만든 레이블로 실험했더니, 전체 데이터에서 레이블과 상관이 높은 특징 20개를 먼저 고른 뒤 교차검증한 정확도가 약 0.85로 나왔습니다. 실제 성능은 0.5인데 이런 숫자가 나오는 과정을 단계별로 설명하고, 파이프라인이 이를 어떻게 막는지 적으십시오.",
      answer: md`
의미 없는 특징이 5,000개나 되면 순전히 우연으로 레이블과 상관이 높아 보이는 특징이 생깁니다. 잘못된 방법은 전체 100개 샘플(검증 fold 포함)의 레이블을 보고 그런 특징 20개를 먼저 골랐기 때문에, 고른 특징이 검증 fold의 레이블과도 우연히 맞도록 이미 맞춰져 있습니다. 그래서 교차검증이 '처음 보는 데이터'를 평가하지 못하고 0.85 같은 가짜 점수가 나옵니다. 특징 선택을 파이프라인에 넣으면 fold마다 훈련 부분의 레이블만 보고 특징을 고르므로, 검증 fold에서는 우연한 상관이 재현되지 않아 정확도가 0.5 근처로 돌아옵니다.
`,
      keyPoints: ["특징이 많으면 우연히 레이블과 상관 있는 특징이 생긴다", "전체 데이터(검증 fold 포함)의 레이블로 특징을 골랐다", "검증 fold가 더 이상 처음 보는 데이터가 아니다", "파이프라인은 fold마다 훈련 부분으로만 선택한다"],
    },
  ],
  references: [
    { title: "scikit-learn — Common pitfalls: Data leakage", url: "https://scikit-learn.org/stable/common_pitfalls.html", note: "누수와 파이프라인 사용법을 공식 문서가 직접 설명" },
    { title: "scikit-learn — Cross-validation", url: "https://scikit-learn.org/stable/modules/cross_validation.html", note: "K-Fold·Stratified·Group K-Fold" },
  ],
});
