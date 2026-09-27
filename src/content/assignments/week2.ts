import type { AssignmentSpec } from "../types";

// 2주차 과제: 믿을 수 있는 모델 비교 리포트. scikit-learn은 브라우저(Pyodide)에서 그대로 동작한다.
const week2Assignment: AssignmentSpec = {
  title: "믿을 수 있는 모델 비교 리포트",
  summary: `
scikit-learn의 유방암 진단 데이터(\`load_breast_cancer\`)로 세 모델을 공정하게 비교하고, 지표 선택의 근거를 세우고, 데이터 누수가 점수를 얼마나 부풀리는지 직접 확인합니다. 마지막으로 결정트리의 깊이를 바꿔 가며 편향과 분산을 숫자로 관찰합니다. 모든 실험은 \`random_state=0\`으로 고정합니다.
`,
  tasks: [
    {
      id: "compare",
      title: "세 모델을 같은 교차검증으로 비교하기",
      instructions: `
다수결 베이스라인(\`DummyClassifier\`), 로지스틱 회귀, 랜덤 포레스트를 **같은** 5-Fold 층화 교차검증으로 비교해 F1과 ROC-AUC를 평균 $\\pm$ 표준편차로 출력합니다. 스케일링 같은 전처리는 반드시 \`Pipeline\` 안에 넣습니다. 코드 셀의 \`TODO\`를 채워 로지스틱 회귀 파이프라인을 완성합니다.
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
for name, model in models.items():
    s = cross_validate(model, X_train, y_train, cv=cv, scoring=["f1", "roc_auc"])
    f1, auc = s["test_f1"], s["test_roc_auc"]
    print(f"{name:<22}{f1.mean():>10.3f} ± {f1.std():.3f}{auc.mean():>10.3f} ± {auc.std():.3f}")
`,
        },
        {
          kind: "text",
          id: "compare-answer",
          prompt: "결과를 표로 정리하고, 베이스라인 대비 두 모델의 차이가 표준편차보다 큰지 판단해 주십시오.",
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
      title: "편향과 분산을 숫자로 확인하기",
      instructions: `
결정트리를 서로 다른 \`random_state\` 분할 10개로 학습해 테스트 정확도 10개를 얻고, \`max_depth\`를 1, 3, 5, 제한 없음으로 바꿔 가며 평균과 표준편차를 비교합니다. 깊이가 커질 때 평균과 흔들림이 어떻게 변하는지 편향·분산의 용어로 해석합니다.
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
      id: "advanced",
      title: "심화: 학습 곡선·추가 모델·규제 경로",
      optional: true,
      instructions: `
다음 중 하나 이상을 골라 실험합니다.

- \`learning_curve\`로 학습 곡선을 그려 과적합 여부를 판단합니다.
- KNN, 나이브 베이즈, SVM 중 두 개 이상을 같은 교차검증으로 추가 비교하고, 평균 차이가 표준편차보다 큰지를 기준으로 우열을 판단합니다.
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
