import type { AssignmentSpec } from "../types";

// 2주차 과제: 믿을 수 있는 모델 비교 리포트. scikit-learn은 브라우저(Pyodide)에서 그대로 동작한다.
// 핵심: compare·metric·leak·biasvar(채점 대상) / 보충: threshold / 심화: advanced
const week2Assignment: AssignmentSpec = {
  title: "믿을 수 있는 모델 비교 리포트",
  summary: `
scikit-learn의 유방암 진단 데이터(\`load_breast_cancer\`)로 세 모델을 공정하게 비교하고, 지표 선택의 근거를 세우고, 데이터 누수가 점수를 얼마나 부풀리는지 직접 확인합니다. 마지막으로 결정트리의 깊이를 바꿔 가며 편향과 분산을 숫자로 관찰합니다. 모든 실험은 \`random_state=0\`으로 고정합니다.

**핵심** 항목 네 개는 핵심 과정만으로 풀 수 있고, 채점 기준은 이 네 항목만 봅니다. **보충**(비용 기반 임계값)과 **심화**(중첩 교차검증·학습 곡선 등) 항목은 선택이며 점수 대신 피드백을 받습니다.
`,
  tasks: [
    {
      id: "compare",
      tier: "core",
      title: "세 모델을 같은 교차검증으로 비교하기",
      instructions: `
다수결 베이스라인(\`DummyClassifier\`), 로지스틱 회귀, 랜덤 포레스트를 **같은** 5-Fold 층화 교차검증으로 비교해 F1과 ROC-AUC를 평균 $\\pm$ 표준편차로 출력합니다. 스케일링 같은 전처리는 반드시 \`Pipeline\` 안에 넣습니다. 코드 셀의 \`TODO\`를 채워 로지스틱 회귀 파이프라인을 완성합니다.

$\\pm$ 값은 fold 5개 점수가 얼마나 흩어져 있는지를 요약한 값이지 신뢰구간이 아닙니다(fold끼리 훈련 데이터가 겹쳐 서로 독립이 아닙니다). 그래서 코드는 같은 분할에서 얻은 두 모델의 **fold별 점수 차이**도 함께 출력합니다. 우열은 "평균 차이가 표준편차보다 큰가"를 눈으로 비교하기보다, 이 짝지은 차이가 fold마다 한결같은 방향인지를 근거로 판단합니다.
`,
      cells: [
        {
          kind: "code",
          id: "compare-code",
          label: "데이터 준비와 교차검증 비교",
          starter: `import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

SEED = 0
X, y = load_breast_cancer(return_X_y=True)
# 이 데이터에서 y=0은 악성, y=1은 양성입니다. 악성을 '찾아야 할 대상(양성 클래스)'으로 두기 위해 뒤집습니다.
y = 1 - y
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, stratify=y, random_state=SEED)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

models = {
    "Dummy (다수결)": DummyClassifier(strategy="most_frequent"),
    "Logistic Regression": DummyClassifier(strategy="most_frequent"),  # TODO: StandardScaler + LogisticRegression 파이프라인
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=SEED),
}

print(f"{'모델':<22}{'F1':>18}{'ROC-AUC':>18}")
scores = {}
for name, model in models.items():
    s = cross_validate(model, X_train, y_train, cv=cv, scoring=["f1", "roc_auc"])
    f1, auc = s["test_f1"], s["test_roc_auc"]
    scores[name] = {"F1": f1, "ROC-AUC": auc}
    print(f"{name:<22}{f1.mean():>10.3f} ± {f1.std():.3f}{auc.mean():>10.3f} ± {auc.std():.3f}")
print("(± 값은 fold 5개 점수의 표준편차(np.std, ddof=0)입니다. 신뢰구간이 아닙니다.)")

# 세 모델 모두 같은 cv(같은 분할)로 평가했으므로 fold별 점수를 짝지어 비교할 수 있습니다.
for metric in ("F1", "ROC-AUC"):
    diff = scores["Logistic Regression"][metric] - scores["Random Forest"][metric]
    print(f"\\n{metric} fold별 차이 (로지스틱 − 랜덤 포레스트): {np.round(diff, 3)}")
    print(f"  차이 평균 {diff.mean():+.3f}, 차이의 표준편차 {diff.std():.3f}, 로지스틱이 앞선 fold {int((diff > 0).sum())}/5")
`,
        },
        {
          kind: "text",
          id: "compare-answer",
          prompt: "결과를 표로 정리하고, 베이스라인 대비 두 모델의 성능과, 두 모델 사이의 우열을 fold별 짝지은 차이를 근거로 판단해 주십시오. 이 근거로 말할 수 있는 것과 없는 것도 구분합니다.",
          template: `| 모델 | F1 (평균 ± 표준편차) | ROC-AUC (평균 ± 표준편차) |
| --- | --- | --- |
| Dummy |  |  |
| Logistic Regression |  |  |
| Random Forest |  |  |

해석: `,
          minChars: 260,
        },
      ],
    },
    {
      id: "metric",
      tier: "core",
      title: "지표 선택의 근거 세우기",
      instructions: `
클래스 비율(악성:양성)을 확인하고, 로지스틱 회귀를 훈련 데이터 전체로 학습해 테스트셋의 혼동행렬과 Precision·Recall을 출력합니다. 이 문제에서 어떤 지표를 가장 중요하게 봐야 하는지, 악성 종양을 놓치는 비용과 오진의 비용을 비교해 설명합니다.
`,
      cells: [
        {
          kind: "code",
          id: "metric-code",
          label: "혼동행렬과 Precision·Recall",
          starter: `from sklearn.metrics import confusion_matrix, precision_score, recall_score, classification_report

print("클래스 비율 (0=양성 종양, 1=악성 종양):", np.bincount(y))
clf = models["Logistic Regression"].fit(X_train, y_train)
pred = clf.predict(X_test)
print("혼동행렬 [행: 실제, 열: 예측]\\n", confusion_matrix(y_test, pred))
print(f"Precision = {precision_score(y_test, pred, zero_division=0):.3f}")
print(f"Recall    = {recall_score(y_test, pred, zero_division=0):.3f}")
print(classification_report(y_test, pred, target_names=["양성 종양", "악성 종양"], zero_division=0))
`,
        },
        {
          kind: "text",
          id: "metric-answer",
          prompt: "이 문제에서 가장 중요한 지표와 그 근거를 적어 주십시오.",
          minChars: 120,
        },
      ],
    },
    {
      id: "leak",
      tier: "core",
      title: "데이터 누수 실험",
      instructions: `
두 가지 누수를 일부러 만들어 교차검증 점수가 얼마나 부풀려지는지 측정합니다.

- (a) 분할 **전에** 전체 데이터로 스케일러를 학습한 경우
- (b) 타깃에서 파생된 특징(\`y\`에 작은 잡음을 더한 열)을 추가한 경우

두 경우의 부풀림 정도를 비교하고, 차이가 왜 그만큼 나는지 「데이터 분할·교차검증·누수」 단계의 개념으로 설명합니다.
`,
      cells: [
        {
          kind: "code",
          id: "leak-code",
          label: "누수 전후 교차검증 점수",
          starter: `def cv_auc(model, features, target):
    s = cross_validate(model, features, target, cv=cv, scoring="roc_auc")
    return s["test_score"].mean()

# 30개 특징을 모두 쓰면 ROC-AUC가 0.99를 넘어 누수 효과가 잘 보이지 않습니다(천장 효과).
# 그래서 예측력이 약한 특징 5개(질감, 프랙털 차원 등)만 골라 실험합니다.
WEAK = [1, 9, 11, 14, 19]
Xw = X_train[:, WEAK]

def pipeline():
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000))

clean = cv_auc(pipeline(), Xw, y_train)

# (a) 분할 전에 전체 데이터로 스케일링한 뒤 교차검증
X_scaled_all = Xw  # TODO: StandardScaler().fit_transform(Xw)
leak_a = cv_auc(LogisticRegression(max_iter=5000), X_scaled_all, y_train)

# (b) 타깃에서 파생된 특징 추가
rng = np.random.default_rng(SEED)
leaky_col = y_train + rng.normal(0, 0.5, len(y_train))
X_leaky = Xw  # TODO: np.column_stack([Xw, leaky_col])
leak_b = cv_auc(pipeline(), X_leaky, y_train)

print(f"정상 파이프라인          ROC-AUC = {clean:.4f}")
print(f"(a) 분할 전 스케일링     ROC-AUC = {leak_a:.4f}  (차이 {leak_a - clean:+.4f})")
print(f"(b) 타깃 파생 특징 추가  ROC-AUC = {leak_b:.4f}  (차이 {leak_b - clean:+.4f})")
`,
        },
        {
          kind: "text",
          id: "leak-answer",
          prompt: "두 누수의 영향 크기를 비교하고, 원인을 설명해 주십시오. 실제 프로젝트에서 이런 누수를 어떻게 막을지도 적습니다.",
          minChars: 150,
        },
      ],
    },
    {
      id: "biasvar",
      tier: "core",
      title: "편향과 분산을 숫자로 확인하기",
      instructions: `
결정트리를 서로 다른 \`random_state\` 분할 10개로 학습해 테스트 정확도 10개를 얻고, \`max_depth\`를 1, 3, 5, 제한 없음으로 바꿔 가며 평균과 표준편차를 비교합니다. 깊이가 커질 때 평균과 흔들림이 어떻게 변하는지 편향·분산의 용어로 해석합니다. 이 표준편차에는 "훈련 데이터가 바뀌어 모델이 달라지는 흔들림(분산)"과 "테스트셋 표본이 바뀌어 점수가 달라지는 흔들림"이 함께 들어 있다는 점도 해석에 반영합니다.
`,
      cells: [
        {
          kind: "code",
          id: "biasvar-code",
          label: "깊이별 정확도 평균과 표준편차",
          starter: `from sklearn.tree import DecisionTreeClassifier

print(f"{'max_depth':>10}{'train 평균':>12}{'test 평균':>12}{'test 표준편차':>14}")
for depth in (1, 3, 5, None):
    train_acc, test_acc = [], []
    for seed in range(10):
        Xa, Xb, ya, yb = train_test_split(X, y, test_size=0.3, stratify=y, random_state=seed)
        tree = DecisionTreeClassifier(max_depth=depth, random_state=seed).fit(Xa, ya)
        train_acc.append(tree.score(Xa, ya))
        test_acc.append(tree.score(Xb, yb))
    print(f"{str(depth):>10}{np.mean(train_acc):>12.3f}{np.mean(test_acc):>12.3f}{np.std(test_acc):>14.3f}")
`,
        },
        {
          kind: "text",
          id: "biasvar-answer",
          prompt: "깊이에 따른 변화를 편향과 분산의 관점에서 해석해 주십시오.",
          minChars: 120,
        },
      ],
    },
    {
      id: "threshold",
      tier: "supplement",
      title: "보충: 비용으로 임계값 정하기",
      instructions: `
악성 종양을 놓치는 비용(FN)이 양성 종양을 악성으로 판정해 정밀 검사를 하는 비용(FP)의 10배라고 가정합니다. 「불균형 데이터와 임계값 결정」 단계의 공식 $t^* = C_{FP}/(C_{FP}+C_{FN})$으로 임계값을 정하고, 임계값 0.5와 비교해 테스트셋의 FN·FP 개수와 샘플당 평균 비용을 출력합니다. ROC-AUC와 Average Precision도 함께 확인합니다. 이 방법이 정당하려면 무엇이 필요한지(확률 보정)와, 데이터가 적은 테스트셋 하나로 임계값을 고르면 생기는 문제도 적습니다.
`,
      cells: [
        {
          kind: "code",
          id: "threshold-code",
          label: "비용 기반 임계값",
          starter: `from sklearn.metrics import roc_auc_score, average_precision_score

proba = clf.predict_proba(X_test)[:, 1]          # 악성일 확률 (위 셀에서 학습한 로지스틱 회귀 파이프라인)
print(f"악성 비율 {y_test.mean():.3f}, ROC-AUC {roc_auc_score(y_test, proba):.3f}, AP {average_precision_score(y_test, proba):.3f}")

C_FP, C_FN = 1, 10
t_star = 0.5  # TODO: 비용으로 정한 임계값 C_FP / (C_FP + C_FN)

costs = {}
for t in (0.5, t_star):
    pred_t = (proba >= t).astype(int)
    fp = int(((pred_t == 1) & (y_test == 0)).sum())
    fn = int(((pred_t == 0) & (y_test == 1)).sum())
    costs[t] = (C_FP * fp + C_FN * fn) / len(y_test)
    print(f"임계값 {t:.3f}: FN {fn}, FP {fp}, 샘플당 평균 비용 {costs[t]:.4f}")
`,
        },
        {
          kind: "text",
          id: "threshold-answer",
          prompt: "두 임계값의 결과를 비교하고, 이 결정이 정당하려면 무엇이 필요한지 적어 주십시오.",
          minChars: 100,
        },
      ],
    },
    {
      id: "advanced",
      tier: "advanced",
      title: "심화: 중첩 교차검증·보정된 비교·학습 곡선",
      instructions: `
다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않으며, 심화 단계의 도구를 실제 과제 데이터에 적용해 보는 것이 목적입니다.

- 로지스틱 회귀의 \`C\`를 \`GridSearchCV\`로 고른 \`best_score_\`와, 같은 탐색을 바깥 5-fold로 감싼 중첩 교차검증 점수를 비교합니다(「평가의 통계학」).
- 로지스틱 회귀와 랜덤 포레스트를 \`RepeatedStratifiedKFold\`(5-fold를 5회 반복)로 짝지어 평가하고, 단순 t와 나도-벤지오 보정 t를 비교합니다.
- \`learning_curve\`로 학습 곡선을 그려 과적합 여부를 판단합니다.
- KNN, 나이브 베이즈, SVM 중 두 개 이상을 같은 교차검증으로 추가 비교하고, fold별 짝지은 차이를 근거로 우열을 판단합니다.
- 로지스틱 회귀를 NumPy로 직접 구현해 sklearn과 계수를 비교합니다.
- Ridge의 $\\lambda$에 따른 계수 경로를 그립니다.
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: `# 선택한 심화 실험을 이 셀에서 진행합니다.\n` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "design", label: "실험 설계의 타당성", points: 3, guide: "같은 분할·교차검증·파이프라인을 쓰고 시드를 고정했습니다." },
    { id: "metric", label: "지표 선택 논리와 베이스라인 대비 해석", points: 3, guide: "클래스 비율과 오류 비용을 근거로 지표를 고르고, 베이스라인과 비교해 해석했습니다." },
    { id: "leak", label: "누수 실험과 원인 설명", points: 3, guide: "두 누수의 영향을 정량화하고, 크기 차이의 원인을 정확히 설명했습니다." },
    { id: "biasvar", label: "편향·분산 실험과 해석", points: 2, guide: "깊이별 평균·표준편차를 근거로 편향과 분산의 변화를 해석했습니다." },
    { id: "clarity", label: "가독성", points: 1, guide: "표와 서술이 간결하고 출력과 잘 연결됩니다." },
  ],
};

export default week2Assignment;
