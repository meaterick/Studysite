import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "ml-model-comparison",
  kind: "track",
  title: "믿을 수 있는 모델 비교 리포트",
  summary: md`

scikit-learn의 유방암 진단 데이터(\`load_breast_cancer\`)로 세 모델을 공정하게 비교하고, 지표 선택의 근거를 세우고, 데이터 누수가 점수를 얼마나 높이는지 직접 확인합니다. 마지막으로 결정트리의 깊이를 바꿔 가며 편향과 분산을 숫자로 관찰합니다. 모든 실험은 \`random_state=0\`으로 고정합니다.

**핵심** 항목 네 개는 트랙 4의 핵심 레슨만으로 풀 수 있고, 자기 점검 기준은 이 네 항목을 확인합니다. **보충**(비용 기반 임계값)과 **심화**(중첩 교차검증·학습 곡선 등) 항목은 선택이며 과제 점수는 매기지 않습니다.
`,
  requirements: [
    "로지스틱 회귀를 `StandardScaler`와 함께 `make_pipeline`으로 묶어 TODO를 채운다. 스케일링을 파이프라인 밖에서 하지 않는다.",
    "세 모델(다수결·로지스틱·랜덤 포레스트)을 **같은** `StratifiedKFold` 분할로 평가해 F1·ROC-AUC의 평균 ± 표준편차와 fold별 짝지은 차이를 보고한다.",
    "클래스 비율과 혼동행렬·정밀도·재현율을 근거로 이 문제에서 가장 중요한 지표를 고른다.",
    "누수 (a) 분할 전 스케일링, (b) 타깃 파생 특성을 실제로 만들어 교차검증 점수가 높아지는 크기를 비교·설명한다.",
    "결정트리 깊이(1·3·5·제한 없음)별 테스트 정확도의 평균·표준편차를 편향과 분산으로 해석한다.",
    "(보충) 비용 비율 10:1로 정한 임계값 $t^* = 1/11$과 0.5의 FN·FP·평균 비용을 비교한다.",
  ],
  tasks: [
    {
      id: "compare",
      title: "세 모델을 같은 교차검증으로 비교하기",
      tier: "core",
      instructions: md`

다수결 기준 모델(\`DummyClassifier\`), 로지스틱 회귀, 랜덤 포레스트를 **같은** 5-Fold 층화 교차검증으로 비교해 F1과 ROC-AUC를 평균 $\pm$ 표준편차로 출력합니다. 스케일링 같은 전처리는 반드시 \`Pipeline\` 안에 넣습니다. 코드 셀의 \`TODO\`를 채워 로지스틱 회귀 파이프라인을 완성합니다.

$\pm$ 값은 fold 5개 점수가 얼마나 흩어져 있는지를 요약한 값이지 신뢰구간이 아닙니다(fold끼리 학습 데이터가 겹쳐 서로 독립이 아닙니다). 그래서 코드는 같은 분할에서 얻은 두 모델의 **fold별 점수 차이**도 함께 출력합니다. 우열은 "평균 차이가 표준편차보다 큰가"를 눈으로 비교하기보다, 이 짝지은 차이가 fold마다 한결같은 방향인지를 근거로 판단합니다.
`,
      cells: [
        { kind: "code", id: "compare-code", label: "데이터 준비와 교차검증 비교", starter: py`
import numpy as np
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
    print(f"\n{metric} fold별 차이 (로지스틱 − 랜덤 포레스트): {np.round(diff, 3)}")
    print(f"  차이 평균 {diff.mean():+.3f}, 차이의 표준편차 {diff.std():.3f}, 로지스틱이 앞선 fold {int((diff > 0).sum())}/5")
` },
        { kind: "text", id: "compare-answer", prompt: "결과를 표로 정리하고, 기준 모델 대비 두 모델의 성능과, 두 모델 사이의 우열을 fold별 짝지은 차이를 근거로 판단해 주십시오. 이 근거로 말할 수 있는 것과 없는 것도 구분합니다.", minChars: 260, template: md`
| 모델 | F1 (평균 ± 표준편차) | ROC-AUC (평균 ± 표준편차) |
| --- | --- | --- |
| Dummy |  |  |
| Logistic Regression |  |  |
| Random Forest |  |  |

해석:
` },
      ],
    },
    {
      id: "metric",
      title: "지표 선택의 근거 세우기",
      tier: "core",
      instructions: md`

클래스 비율(악성:양성)을 확인하고, 로지스틱 회귀를 학습 데이터 전체로 학습해 테스트 데이터의 혼동행렬과 정밀도·재현율을 출력합니다. 이 문제에서 어떤 지표를 가장 중요하게 봐야 하는지, 악성 종양을 놓치는 비용과 오진의 비용을 비교해 설명합니다.
`,
      cells: [
        { kind: "code", id: "metric-code", label: "혼동행렬과 정밀도·재현율", starter: py`
from sklearn.metrics import confusion_matrix, precision_score, recall_score, classification_report

print("클래스 비율 (0=양성 종양, 1=악성 종양):", np.bincount(y))
clf = models["Logistic Regression"].fit(X_train, y_train)
pred = clf.predict(X_test)
print("혼동행렬 [행: 실제, 열: 예측]\n", confusion_matrix(y_test, pred))
print(f"정밀도 = {precision_score(y_test, pred, zero_division=0):.3f}")
print(f"재현율 = {recall_score(y_test, pred, zero_division=0):.3f}")
print(classification_report(y_test, pred, target_names=["양성 종양", "악성 종양"], zero_division=0))
` },
        { kind: "text", id: "metric-answer", prompt: "이 문제에서 가장 중요한 지표와 그 근거를 적어 주십시오.", minChars: 120 },
      ],
    },
    {
      id: "leak",
      title: "데이터 누수 실험",
      tier: "core",
      instructions: md`

두 가지 누수를 일부러 만들어 교차검증 점수가 얼마나 높아지는지 측정합니다.

- (a) 분할 **전에** 전체 데이터로 스케일러를 학습한 경우
- (b) 타깃에서 만든 특성(\`y\`에 작은 잡음을 더한 열)을 추가한 경우

두 경우에 점수가 높아지는 정도를 비교하고, 차이가 왜 그만큼 나는지 [[lesson:data-splits]]의 개념으로 설명합니다.
`,
      cells: [
        { kind: "code", id: "leak-code", label: "누수 전후 교차검증 점수", starter: py`
def cv_auc(model, features, target):
    s = cross_validate(model, features, target, cv=cv, scoring="roc_auc")
    return s["test_score"].mean()

# 30개 특성을 모두 쓰면 ROC-AUC가 0.99를 넘어 누수 효과가 잘 보이지 않습니다(천장 효과).
# 그래서 예측력이 약한 특성 5개(질감, 프랙털 차원 등)만 골라 실험합니다.
WEAK = [1, 9, 11, 14, 19]
Xw = X_train[:, WEAK]

def pipeline():
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000))

clean = cv_auc(pipeline(), Xw, y_train)

# (a) 분할 전에 전체 데이터로 스케일링한 뒤 교차검증
X_scaled_all = Xw  # TODO: StandardScaler().fit_transform(Xw)
leak_a = cv_auc(LogisticRegression(max_iter=5000), X_scaled_all, y_train)

# (b) 타깃에서 만든 특성 추가
rng = np.random.default_rng(SEED)
leaky_col = y_train + rng.normal(0, 0.5, len(y_train))
X_leaky = Xw  # TODO: np.column_stack([Xw, leaky_col])
leak_b = cv_auc(pipeline(), X_leaky, y_train)

print(f"정상 파이프라인          ROC-AUC = {clean:.4f}")
print(f"(a) 분할 전 스케일링     ROC-AUC = {leak_a:.4f}  (차이 {leak_a - clean:+.4f})")
print(f"(b) 타깃 파생 특성 추가  ROC-AUC = {leak_b:.4f}  (차이 {leak_b - clean:+.4f})")
` },
        { kind: "text", id: "leak-answer", prompt: "두 누수의 영향 크기를 비교하고, 원인을 설명해 주십시오. 실제 프로젝트에서 이런 누수를 어떻게 막을지도 적습니다.", minChars: 150 },
      ],
    },
    {
      id: "biasvar",
      title: "편향과 분산을 숫자로 확인하기",
      tier: "core",
      instructions: md`

결정트리를 서로 다른 \`random_state\` 분할 10개로 학습해 테스트 정확도 10개를 얻고, \`max_depth\`를 1, 3, 5, 제한 없음으로 바꿔 가며 평균과 표준편차를 비교합니다. 깊이가 커질 때 평균과 흔들림이 어떻게 변하는지 편향·분산의 용어로 해석합니다. 이 표준편차에는 "학습 데이터가 바뀌어 모델이 달라지는 흔들림(분산)"과 "테스트 데이터 표본이 바뀌어 점수가 달라지는 흔들림"이 함께 들어 있다는 점도 해석에 반영합니다.
`,
      cells: [
        { kind: "code", id: "biasvar-code", label: "깊이별 정확도 평균과 표준편차", starter: py`
from sklearn.tree import DecisionTreeClassifier

print(f"{'max_depth':>10}{'학습 평균':>12}{'테스트 평균':>12}{'테스트 표준편차':>14}")
for depth in (1, 3, 5, None):
    train_acc, test_acc = [], []
    for seed in range(10):
        Xa, Xb, ya, yb = train_test_split(X, y, test_size=0.3, stratify=y, random_state=seed)
        tree = DecisionTreeClassifier(max_depth=depth, random_state=seed).fit(Xa, ya)
        train_acc.append(tree.score(Xa, ya))
        test_acc.append(tree.score(Xb, yb))
    print(f"{str(depth):>10}{np.mean(train_acc):>12.3f}{np.mean(test_acc):>12.3f}{np.std(test_acc):>14.3f}")
` },
        { kind: "text", id: "biasvar-answer", prompt: "깊이에 따른 변화를 편향과 분산의 관점에서 해석해 주십시오.", minChars: 120 },
      ],
    },
    {
      id: "threshold",
      title: "보충: 비용으로 임계값 정하기",
      tier: "supplement",
      instructions: md`

악성 종양을 놓치는 비용(FN)이 양성 종양을 악성으로 판정해 정밀 검사를 하는 비용(FP)의 10배라고 가정합니다. [[lesson:cost-threshold]]의 공식 $t^* = C_{FP}/(C_{FP}+C_{FN})$으로 임계값을 정하고, 임계값 0.5와 비교해 테스트 데이터의 FN·FP 개수와 샘플당 평균 비용을 출력합니다. ROC-AUC와 평균 정밀도(AP)도 함께 확인합니다. 이 방법이 정당하려면 무엇이 필요한지(확률 보정)와, 샘플이 적은 테스트 데이터 하나로 임계값을 고르면 생기는 문제도 적습니다.
`,
      cells: [
        { kind: "code", id: "threshold-code", label: "비용 기반 임계값", starter: py`
from sklearn.metrics import roc_auc_score, average_precision_score

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
` },
        { kind: "text", id: "threshold-answer", prompt: "두 임계값의 결과를 비교하고, 이 결정이 정당하려면 무엇이 필요한지 적어 주십시오.", minChars: 100 },
      ],
    },
    {
      id: "advanced",
      title: "심화: 중첩 교차검증·보정된 비교·학습 곡선",
      tier: "advanced",
      instructions: md`

다음 중 하나 이상을 골라 실험합니다. 점수에는 들어가지 않으며, 심화 레슨의 도구를 과제 데이터에 적용해 보는 것이 목적입니다.

- 로지스틱 회귀의 \`C\`를 \`GridSearchCV\`로 고른 \`best_score_\`와, 같은 탐색을 바깥 5-fold로 감싼 중첩 교차검증 점수를 비교합니다([[lesson:model-evaluation-stats]]).
- 로지스틱 회귀와 랜덤 포레스트를 \`RepeatedStratifiedKFold\`(5-fold를 5회 반복)로 짝지어 평가하고, 단순 t와 Nadeau-Bengio 보정 t를 비교합니다.
- \`learning_curve\`로 학습 곡선을 그려 과적합 여부를 판단합니다.
- KNN, 나이브 베이즈, SVM 중 두 개 이상을 같은 교차검증으로 추가 비교하고, fold별 짝지은 차이를 근거로 우열을 판단합니다.
- 로지스틱 회귀를 NumPy로 직접 구현해 sklearn과 계수를 비교합니다.
- Ridge의 $\lambda$에 따른 계수 경로를 그립니다.
`,
      cells: [
        { kind: "code", id: "advanced-code", label: "심화 실험", starter: py`
# 선택한 심화 실험을 이 셀에서 진행합니다.
` },
        { kind: "text", id: "advanced-answer", prompt: "무엇을 실험했고 어떤 결과를 얻었는지 정리해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "design", label: "실험 설계의 타당성", points: 3, guide: "같은 분할·교차검증·파이프라인을 쓰고 시드를 고정했습니다." },
    { id: "metric", label: "지표 선택 논리와 기준 모델 대비 해석", points: 3, guide: "클래스 비율과 오류 비용을 근거로 지표를 고르고, 기준 모델과 비교해 해석했습니다." },
    { id: "leak", label: "누수 실험과 원인 설명", points: 3, guide: "두 누수의 영향을 정량화하고, 크기 차이의 원인을 정확히 설명했습니다." },
    { id: "biasvar", label: "편향·분산 실험과 해석", points: 2, guide: "깊이별 평균·표준편차를 근거로 편향과 분산의 변화를 해석했습니다." },
    { id: "clarity", label: "가독성", points: 1, guide: "표와 서술이 간결하고 출력과 잘 연결됩니다." },
  ],
  gradingNotes: md`
- **세 모델을 같은 교차검증으로 비교하기**: 교차검증 F1은 Dummy 0.00, 로지스틱 회귀 약 0.97, 랜덤 포레스트 약 0.93이고, ROC-AUC는 두 모델 모두 0.99 안팎이다. 같은 분할의 fold별 차이를 보면 F1은 로지스틱 회귀가 다섯 fold 모두에서 앞서므로(차이 평균 약 +0.04) 이 데이터에서는 로지스틱 회귀가 낫다고 판단할 근거가 있다. ROC-AUC는 차이 평균이 약 +0.002이고 fold마다 방향이 섞이므로 우열을 단정하지 않는 것이 맞는 해석이다. ± 값을 신뢰구간이나 유의성 검정 결과처럼 쓰지 않았는지 확인한다(fold끼리 독립이 아니다).
- **지표 선택의 근거 세우기**: 악성 종양을 놓치는 비용(FN)이 크므로 재현율을 우선하고, 정밀도는 추가 검사 비용으로 설명하면 된다.
- **데이터 누수 실험**: 약한 특성 5개 기준으로 정상 파이프라인의 ROC-AUC는 약 0.77이다. 분할 전 스케일링은 차이가 거의 없고(평균과 분산만 새어 나간다), 타깃에서 만든 특성은 약 0.94로 점수를 크게 높인다. 누수의 크기가 새어 나간 정보와 타깃의 관련 정도에 달려 있다는 점을 짚으면 우수 답안이다.
- **편향과 분산을 숫자로 확인하기**: 깊이가 커질수록 학습 정확도는 1.0에 가까워지고 테스트 정확도의 표준편차는 커지는 경향(분산 증가)이 나타나야 한다.
`,
  maxScore: 12,
  autoTests: [
    { id: "w2-at-pipeline", taskId: "compare", title: "로지스틱 회귀가 StandardScaler를 포함한 Pipeline이다", hint: "`make_pipeline(StandardScaler(), LogisticRegression(max_iter=...))`처럼 묶습니다.", code: py`
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
m = models["Logistic Regression"]
assert isinstance(m, Pipeline), f"Pipeline이 아니라 {type(m).__name__}입니다."
assert any(isinstance(s, StandardScaler) for _, s in m.steps), f"단계: {[type(s).__name__ for _, s in m.steps]}"
assert isinstance(m.steps[-1][1], LogisticRegression), "마지막 단계가 LogisticRegression이 아닙니다."
` },
    { id: "w2-at-scores", taskId: "compare", title: "세 모델 모두 5-fold 점수가 있고 로지스틱 F1이 0.9를 넘는다", code: py`
assert set(scores) == {"Dummy (다수결)", "Logistic Regression", "Random Forest"}, f"모델 이름: {list(scores)}"
for name, s in scores.items():
    assert len(s["F1"]) == 5 and len(s["ROC-AUC"]) == 5, f"{name}의 fold 수가 5가 아닙니다."
f1 = scores["Logistic Regression"]["F1"].mean()
assert f1 > 0.9, f"로지스틱 F1 평균 = {f1:.3f}"
` },
    { id: "w2-at-metric", taskId: "metric", title: "테스트 데이터에서 악성 재현율이 0.8 이상", code: py`
from sklearn.metrics import recall_score
r = recall_score(y_test, pred)
assert r >= 0.8, f"재현율 = {r:.3f}. 로지스틱 회귀 파이프라인으로 학습했는지 확인하십시오."
` },
    { id: "w2-at-leak", taskId: "leak", title: "두 누수를 실제로 만들었고 타깃 파생 특성이 점수를 크게 높인다", code: py`
import numpy as np
assert X_scaled_all.shape == Xw.shape and np.allclose(X_scaled_all.mean(axis=0), 0, atol=1e-6), "X_scaled_all이 전체 데이터로 표준화되지 않았습니다."
assert X_leaky.shape[1] == Xw.shape[1] + 1, f"X_leaky의 열 수가 {X_leaky.shape[1]}입니다(원래 {Xw.shape[1]} + 1이어야 함)."
assert leak_b - clean > 0.05, f"타깃 파생 특성으로 높아진 점수가 {leak_b - clean:+.4f}뿐입니다."
` },
    { id: "w2-at-threshold", taskId: "threshold", title: "비용 기반 임계값 t* = 1/11이 0.5보다 평균 비용이 작다", hint: "$t^* = C_{FP}/(C_{FP}+C_{FN})$입니다.", code: py`
assert abs(t_star - 1 / 11) < 1e-9, f"t_star = {t_star}"
assert costs[t_star] <= costs[0.5], f"비용: t*={costs[t_star]:.4f}, 0.5={costs[0.5]:.4f}"
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "L2 규제 로지스틱 회귀를 NumPy로 구현해 sklearn과 맞추기",
      prompt: md`

목적함수 $\dfrac{1}{n}\sum \text{BCE} + \dfrac{\lambda}{2}\lVert w \rVert^2$(편향은 규제하지 않음)를 경사하강법으로 최소화하는 \`fit_logreg(X, y, l2, lr, steps)\`를 구현합니다.

scikit-learn의 \`LogisticRegression(C=...)\`은 $C\sum \text{BCE} + \tfrac{1}{2}\lVert w \rVert^2$을 최소화하므로, 양변을 $Cn$으로 나누면 $C = \dfrac{1}{n\lambda}$일 때 두 목적함수의 최솟값이 같습니다. 이 대응을 이용해 계수가 소수 둘째 자리까지 일치하는지 확인합니다.
`,
      starter: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

def fit_logreg(X, y, l2=0.01, lr=0.5, steps=3000):
    n, d = X.shape
    w, b = np.zeros(d), 0.0
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        grad_w = np.zeros(d)  # TODO: 평균 BCE의 기울기 + L2 항의 기울기
        grad_b = 0.0          # TODO: 편향은 규제하지 않습니다.
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = (X @ np.array([2.0, -1.0]) + 0.3 + rng.normal(0, 1, 200) > 0).astype(int)

l2 = 0.01
w, b = fit_logreg(X, y, l2)
sk = LogisticRegression(C=1 / (len(y) * l2)).fit(X, y)
print("직접 구현:", np.round(w, 3), round(float(b), 3))
print("sklearn  :", np.round(sk.coef_[0], 3), round(float(sk.intercept_[0]), 3))
`,
      tests: py`
import numpy as np
from sklearn.linear_model import LogisticRegression
rng = np.random.default_rng(0)
Xt = rng.normal(size=(200, 2))
yt = (Xt @ np.array([2.0, -1.0]) + 0.3 + rng.normal(0, 1, 200) > 0).astype(int)

@test("λ = 0.01: sklearn(C = 1/(nλ))과 계수가 0.01 이내로 일치")
def _():
    w, b = fit_logreg(Xt, yt, l2=0.01)
    sk = LogisticRegression(C=1 / (200 * 0.01)).fit(Xt, yt)
    assert approx(w, sk.coef_[0], 1e-2) and abs(b - sk.intercept_[0]) < 1e-2, f"{w}, {b} vs {sk.coef_[0]}, {sk.intercept_[0]}"

@test("규제를 키우면 가중치 크기가 줄어든다")
def _():
    w_small, _ = fit_logreg(Xt, yt, l2=0.001)
    w_big, _ = fit_logreg(Xt, yt, l2=0.5)
    assert np.linalg.norm(w_big) < np.linalg.norm(w_small), f"|w|: {np.linalg.norm(w_small):.3f} → {np.linalg.norm(w_big):.3f}"

@test("편향은 규제하지 않는다(강한 규제에서도 편향이 0으로 끌려가지 않음)")
def _():
    Xs = rng.normal(size=(300, 1)) * 0.01
    ys = (rng.random(300) < 0.8).astype(int)
    _, b = fit_logreg(Xs, ys, l2=1.0, steps=4000)
    assert abs(b - np.log(ys.mean() / (1 - ys.mean()))) < 0.05, f"편향 {b:.3f}, 기대 {np.log(ys.mean() / (1 - ys.mean())):.3f}"
`,
      hints: ["평균 BCE의 기울기는 `X.T @ (p - y) / n`, `np.mean(p - y)`입니다.", "$\\frac{\\lambda}{2}\\lVert w \\rVert^2$의 기울기는 $\\lambda w$입니다. `grad_w`에만 더합니다.", "편향에 규제를 걸면 강한 규제에서 편향이 0 쪽으로 끌려가 데이터의 기본 비율을 표현하지 못합니다."],
      solution: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

def fit_logreg(X, y, l2=0.01, lr=0.5, steps=3000):
    n, d = X.shape
    w, b = np.zeros(d), 0.0
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        grad_w = X.T @ (p - y) / n + l2 * w
        grad_b = np.mean(p - y)
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = (X @ np.array([2.0, -1.0]) + 0.3 + rng.normal(0, 1, 200) > 0).astype(int)

l2 = 0.01
w, b = fit_logreg(X, y, l2)
sk = LogisticRegression(C=1 / (len(y) * l2)).fit(X, y)
print("직접 구현:", np.round(w, 3), round(float(b), 3))
print("sklearn  :", np.round(sk.coef_[0], 3), round(float(sk.intercept_[0]), 3))
`,
    },
    {
      key: "ch2",
      title: "중첩 교차검증을 직접 구현해 scikit-learn과 맞추기",
      prompt: md`

\`GridSearchCV\`의 \`best_score_\`는 고르는 데 쓴 점수라 실제보다 높게 나옵니다. 튜닝까지 포함한 절차의 성능은 중첩 교차검증으로 잽니다. 이것을 반복문으로 구현합니다.

\`nested_cv(X, y, Cs, seed=0)\`: 바깥 \`StratifiedKFold(5, shuffle=True, random_state=seed)\`의 fold마다

1. 바깥 학습 부분에서 안쪽 \`StratifiedKFold(3, shuffle=True, random_state=seed)\`로 후보 \`C\`마다 \`make_model(C)\`의 평균 정확도를 계산하고, 가장 높은 \`C\`를 고릅니다(같으면 앞의 후보).
2. 고른 \`C\`로 바깥 학습 부분 전체에 다시 학습하고, 바깥 검증 부분의 정확도를 잽니다.

fold별 정확도 배열과 fold마다 고른 \`C\`의 리스트를 \`(scores, chosen)\`으로 돌려줍니다. 결과는 \`cross_val_score(GridSearchCV(...), X, y, cv=바깥)\`과 같아야 합니다.
`,
      starter: py`
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import StratifiedKFold, GridSearchCV, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def make_model(C):
    return make_pipeline(StandardScaler(), LogisticRegression(C=C, max_iter=1000))

def nested_cv(X, y, Cs, seed=0):
    outer = StratifiedKFold(5, shuffle=True, random_state=seed)
    inner = StratifiedKFold(3, shuffle=True, random_state=seed)
    scores, chosen = [], []
    for tr, te in outer.split(X, y):
        pass  # TODO: 안쪽 교차검증으로 C를 고르고, 바깥 학습 부분에 다시 학습해 바깥 검증 부분을 평가합니다.
    return np.array(scores), chosen

X, y = load_breast_cancer(return_X_y=True)
X = X[:, :10]                                         # 계산을 줄이려고 특성 10개만 씁니다.
Cs = [0.001, 0.01, 0.1, 1, 10]
scores, chosen = nested_cv(X, y, Cs)
print(np.round(scores, 4), chosen)
`,
      tests: py`
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import StratifiedKFold, GridSearchCV, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

Xb, yb = load_breast_cancer(return_X_y=True)
Xb = Xb[:, :10]
CS = [0.001, 0.01, 0.1, 1, 10]

@test("fold 다섯 개의 점수와 고른 C를 돌려준다")
def _():
    scores, chosen = nested_cv(Xb, yb, CS)
    assert len(scores) == 5 and len(chosen) == 5, f"길이: {len(scores)}, {len(chosen)}"
    assert all(c in CS for c in chosen), f"고른 C: {chosen}"

@test("scikit-learn의 cross_val_score(GridSearchCV(...))와 fold 점수가 같다")
def _():
    scores, _ = nested_cv(Xb, yb, CS)
    search = GridSearchCV(make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
                          {"logisticregression__C": CS}, cv=StratifiedKFold(3, shuffle=True, random_state=0))
    ref = cross_val_score(search, Xb, yb, cv=StratifiedKFold(5, shuffle=True, random_state=0))
    assert approx(scores, ref), f"직접 구현 {np.round(scores, 4)} / scikit-learn {np.round(ref, 4)}"
`,
      hints: [
        "바깥 fold 안에서 `s = cross_val_score(make_model(C), X[tr], y[tr], cv=inner).mean()`을 후보마다 계산하고, `s > best`일 때만 갱신하면 같은 점수에서 앞의 후보가 남습니다.",
        "고른 `C`로 `make_model(best_C).fit(X[tr], y[tr]).score(X[te], y[te])`를 `scores`에 추가합니다.",
        "바깥 검증 부분 `te`는 `C`를 고르는 데 쓰지 않았으므로, 이 점수의 평균은 튜닝 절차 전체의 성능 추정입니다.",
      ],
      solution: py`
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import StratifiedKFold, GridSearchCV, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def make_model(C):
    return make_pipeline(StandardScaler(), LogisticRegression(C=C, max_iter=1000))

def nested_cv(X, y, Cs, seed=0):
    outer = StratifiedKFold(5, shuffle=True, random_state=seed)
    inner = StratifiedKFold(3, shuffle=True, random_state=seed)
    scores, chosen = [], []
    for tr, te in outer.split(X, y):
        best_C, best = None, -np.inf
        for C in Cs:
            s = cross_val_score(make_model(C), X[tr], y[tr], cv=inner).mean()
            if s > best:
                best_C, best = C, s
        chosen.append(best_C)
        scores.append(make_model(best_C).fit(X[tr], y[tr]).score(X[te], y[te]))
    return np.array(scores), chosen

X, y = load_breast_cancer(return_X_y=True)
X = X[:, :10]
Cs = [0.001, 0.01, 0.1, 1, 10]
scores, chosen = nested_cv(X, y, Cs)
print(np.round(scores, 4), chosen)
`,
    },
  ],
});
