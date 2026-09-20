import type { WeekMeta } from "../types";

const week2: WeekMeta = {
  slug: "week-2",
  number: 2,
  phase: "Phase 1 · 기초",
  title: "머신러닝 기본기",
  subtitle: "회귀·분류, 손실함수, 편향-분산, 교차검증, 평가지표",
  selfHours: "개인 6~7h",
  sessionHours: "세션 2h",
  difficulty: 3,
  keywords: ["회귀", "분류", "손실", "편향-분산", "교차검증", "지표"],
  objectives: [
    "선형회귀·로지스틱 회귀의 손실함수와 기울기를 유도한다.",
    "과적합/과소적합을 학습 곡선으로 진단하고 정규화로 완화한다.",
    "정확도의 함정을 이해하고 Precision/Recall/F1/ROC-AUC를 상황에 맞게 선택한다.",
    "데이터 누수(leakage)를 식별한다.",
  ],
  learningOrder: [
    "CS229 Lecture Notes: Linear Regression, Logistic Regression, Bias-Variance (cs229.stanford.edu)",
    "ISLP 2장(통계 학습), 5장(리샘플링), 6장(정규화)",
    "Google ML Crash Course (분류 지표 부분)",
    "본 문서 → 실습 → 퀴즈 → 백지 → 과제",
  ],
  conceptsMd: `
### 2.1 문제 유형

| 유형 | 출력 | 손실 | 예 |
| --- | --- | --- | --- |
| 회귀 | 연속값 | \`MSE = 1/n Σ(ŷ−y)²\` | 집값 예측 |
| 이진분류 | 확률 \`p=σ(wᵀx+b)\` | \`Cross-Entropy = −[y log p + (1−y) log(1−p)]\` | 스팸 여부 |
| 다중분류 | softmax 확률 | Cross-Entropy | 숫자 인식, LLM의 다음 토큰 |

:::info 중요
시그모이드 \`σ(z)=1/(1+e^−z)\`, 그리고 로지스틱 회귀의 기울기는 놀랍게도 \`∂L/∂w = (p − y)x\` 로 선형회귀와 같은 꼴 — 신경망 역전파(W3)에서 그대로 재등장한다.
:::

### 2.2 편향-분산 트레이드오프

[[diagram:bias-variance-curve]]

\`\`\`formula
기대 오차 분해: E[(y−f̂)²] = Bias² + Variance + 노이즈(줄일 수 없음)

학습오차 ≪ 검증오차   → 과적합 (데이터↑, 정규화↑, 모델↓)
학습오차 ≈ 검증오차 ≈ 높음 → 과소적합 (모델↑, 특징↑)
\`\`\`

### 2.3 정규화

L2(Ridge): \`L + λ‖w‖²\` → 가중치를 작게 (부드러운 함수). L1(Lasso): \`L + λ‖w‖₁\` → 일부 가중치를 정확히 0으로(희소, 특징 선택). 베이지안 관점에서 각각 가우시안·라플라스 사전분포에 대응한다.

### 2.4 데이터 분할과 교차검증

[[diagram:data-split]]

:::warn 누수(leakage) 사례
① 전체 데이터로 표준화 후 분할 ② 미래 정보가 특징에 포함(시계열) ③ 동일 환자의 샘플이 train/test 양쪽에 존재 ④ 타깃에서 파생된 열 사용.
:::

### 2.5 평가지표

[[diagram:confusion-matrix]]

\`\`\`formula
Precision = TP/(TP+FP)   "양성이라 한 것 중 진짜 비율"
Recall    = TP/(TP+FN)   "진짜 양성을 놓치지 않은 비율"
F1 = 2PR/(P+R)
\`\`\`

암 진단 → Recall 중시, 스팸 필터 → Precision 중시. 클래스 불균형(99:1)에서 "전부 음성" 예측은 정확도 99%지만 쓸모없다.
`,
  practiceMd: `
\`\`\`python
import numpy as np, matplotlib.pyplot as plt
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import classification_report

# (1) 과적합 시각화: 다항 차수 vs 오차
rng = np.random.default_rng(0)
x = np.sort(rng.uniform(0, 1, 30))[:, None]
y = np.sin(2*np.pi*x[:,0]) + rng.normal(0, 0.2, 30)
xtr, xva, ytr, yva = train_test_split(x, y, test_size=0.4, random_state=0)
tr_err, va_err = [], []
for d in range(1, 13):
    m = make_pipeline(PolynomialFeatures(d), StandardScaler(), LinearRegression()).fit(xtr, ytr)
    tr_err.append(np.mean((m.predict(xtr)-ytr)**2))
    va_err.append(np.mean((m.predict(xva)-yva)**2))
plt.plot(tr_err, label="train"); plt.plot(va_err, label="val"); plt.yscale("log"); plt.legend(); plt.show()

# (2) 분류 + 교차검증 (누수 방지: 스케일러를 파이프라인 안에!)
X, y = load_breast_cancer(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
clf = make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=1000))
print(cross_val_score(clf, Xtr, ytr, cv=5, scoring="f1").mean())
clf.fit(Xtr, ytr)
print(classification_report(yte, clf.predict(Xte)))
\`\`\`

:::warn 관찰
차수 몇에서 검증 오차가 최소인가? 스케일러를 파이프라인 밖에서 전체 데이터에 fit하면 점수가 어떻게(얼마나) 달라지는가?
:::
`,
  quiz: [
    "양성 비율 1%인 데이터에서 항상 음성이라 답하는 모델의 정확도·Recall은?",
    "학습 오차 0.01, 검증 오차 0.30. 진단과 처방 2가지는?",
    "L1과 L2 정규화의 가중치 분포 차이는?",
    "TP=40, FP=10, FN=20일 때 Precision, Recall, F1은?",
    "테스트셋을 보고 하이퍼파라미터를 고르면 무엇이 문제인가?",
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "좋은 모델이란 무엇인가?"' },
    { label: "② 키워드 6개" },
    { label: "③ 그림 — 편향-분산 곡선을 직접 그리고 과소/과적합 영역 표시" },
    { label: "④ 수식 — 로지스틱 손실과 기울기, 혼동행렬 지표 공식" },
    { label: '⑤ 설명하기 — "정확도 99%인데 왜 쓸모없는 모델일 수 있나?" 사례로 설명 (5문장)' },
    { label: "⑥ 막힌 곳 / 확인 후 보완" },
  ],
  assignmentMd: `
### 필수: 「믿을 수 있는 모델 비교 리포트」

1. sklearn의 breast_cancer(또는 Kaggle Titanic)로 최소 3개 모델(로지스틱, 랜덤포레스트, 그래디언트부스팅)을 5-Fold CV로 비교 (평균±표준편차).
2. Precision/Recall/F1/ROC-AUC 표와 혼동행렬 그림 포함. "이 문제에서 어느 지표가 중요한가"를 근거와 함께 서술.
3. **누수 실험**: 일부러 (a) 전체 데이터 스케일링 (b) 타깃 파생 특징 추가 두 경우를 만들어 점수 부풀림을 정량화하고 원인 설명.
4. 학습 곡선(train size vs score)을 그리고 과적합 여부 판단.

### 심화

- 로지스틱 회귀를 NumPy로 직접 구현해 sklearn과 계수 비교.
- Ridge의 λ에 따른 계수 경로(regularization path) 시각화.

### 채점 (10점)

| 항목 | 점수 |
| --- | --- |
| 실험 설계의 타당성(분할·CV) | 3 |
| 지표 선택 논리 | 2 |
| 누수 실험·분석 | 3 |
| 시각화·서술 | 2 |
`,
  dueNote: "제출: 일요일 23:59",
  furtherReading: [
    "Hastie et al., Elements of Statistical Learning 7장 (모델 평가)",
    'Kaufman et al., "Leakage in Data Mining" (2012)',
    'Andrew Ng, "Machine Learning Yearning" (진단 전략)',
  ],
};

export default week2;
