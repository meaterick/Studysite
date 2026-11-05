import { defineLesson, md } from "../../kit";
import exercises from "./labs/svm";

export default defineLesson({
  id: "svm",
  title: "서포트 벡터 머신",
  tier: "supplement",
  requires: ["linear-maps-basis", "gradient-descent", "regularization"],
  goal: "SVM이 마진을 최대화하는 경계를 찾는 원리와 서포트 벡터를 설명하고 마진 폭을 계산하며, 소프트 마진의 C와 커널(RBF)이 경계의 모양과 복잡도를 어떻게 바꾸는지 설명한다.",
  why: "SVM은 샘플 수가 많지 않고 특성이 많은 데이터에서 성능이 좋아 텍스트 분류 등에 오래 쓰였다. 마진을 넓히는 것이 규제와 같은 역할을 한다는 관점은 로지스틱 회귀의 규제([[lesson:regularization]])와 연결되고, 커널은 입력을 다른 공간으로 옮겨 선형 모델을 쓰는 방법으로 신경망의 특성 학습([[lesson:perceptron-mlp]])과 비교된다.",
  body: md`
### 마진을 최대화하는 경계

두 클래스를 가르는 직선(특성이 많으면 초평면) $w^\top x + b = 0$은 여러 개일 수 있다. **서포트 벡터 머신**(SVM)은 그중 양쪽 클래스에서 가장 가까운 샘플까지의 거리가 가장 먼 경계를 고른다. 경계와 가장 가까운 샘플 사이의 폭을 **마진**이라 하고, 가장 가까운 샘플들에서 $|w^\top x + b| = 1$이 되도록 $w$의 크기를 정하면 마진의 폭은 $2 / \lVert w \rVert$다. 마진을 최대화하는 것은 $\lVert w \rVert$를 최소화하는 것과 같다. 경계에 가장 가까이 있어 경계의 위치를 정하는 샘플을 **서포트 벡터**라 한다. 나머지 샘플은 조금 옮기거나 지워도 경계가 바뀌지 않는다.

클래스 $+1$인 점 $A = (3, 1)$과 클래스 $-1$인 점 $B = (1, 3)$이 서포트 벡터이고 $w = (0.5, -0.5)$, $b = 0$이면 $w^\top A = 1$, $w^\top B = -1$이고 마진 폭은 $2 / \lVert w \rVert = 2 / 0.707 \approx 2.83$이다.

\`\`\`python
import numpy as np

A, B = np.array([3, 1]), np.array([1, 3])
w = np.array([0.5, -0.5])
print(w @ A, w @ B, round(2 / np.linalg.norm(w), 3))   # 1.0 -1.0 2.828
\`\`\`

### 소프트 마진과 C

실제 데이터는 두 클래스가 겹쳐 모든 샘플을 마진 밖에 두는 경계가 없는 경우가 많다. **소프트 마진**은 일부 샘플이 마진 안에 들어오거나 반대편에 놓이는 것을 허용하고, 그 정도에 벌점을 준다. 벌점의 크기를 정하는 하이퍼파라미터가 \`C\`다. \`C\`가 작으면 벌점이 작아 마진을 넓게 잡고(규제가 강함), 크면 학습 데이터의 오류를 줄이려고 마진을 좁게 잡는다(규제가 약함). \`LogisticRegression\`의 \`C\`와 마찬가지로 클수록 규제가 약하다.

### 커널: 직선으로 나뉘지 않는 데이터

데이터가 직선으로 나뉘지 않으면, 입력을 더 높은 차원으로 옮겨 그 공간에서 직선(초평면)으로 나눈다. SVM의 학습과 예측은 샘플 사이의 내적만 쓰므로, 높은 차원의 좌표를 직접 계산하지 않고 그 공간의 내적을 계산하는 함수(**커널**)로 대신할 수 있다. 가장 많이 쓰는 **RBF 커널** $k(a, b) = \exp(-\gamma \lVert a - b \rVert^2)$은 가까운 샘플일수록 큰 값을 준다. \`gamma\`가 클수록 한 샘플의 영향이 미치는 범위가 좁아져 경계가 복잡해진다.

[[diagram:kernel-lift]]

\`\`\`python
from sklearn.datasets import make_moons
from sklearn.svm import SVC
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = make_moons(n_samples=300, noise=0.2, random_state=0)   # 초승달 두 개 모양
cv = StratifiedKFold(5, shuffle=True, random_state=0)
for name, m in [("선형 커널", SVC(kernel="linear", C=1.0)), ("RBF 커널, C=1", SVC(kernel="rbf", C=1.0)),
                ("RBF 커널, C=1000", SVC(kernel="rbf", C=1000.0))]:
    model = make_pipeline(StandardScaler(), m)
    s = cross_val_score(model, X, y, cv=cv)
    print(f"{name}: 교차검증 정확도 {s.mean():.3f}, 서포트 벡터 {model.fit(X, y)[-1].n_support_.sum()}개")
# 선형 커널: 교차검증 정확도 0.840, 서포트 벡터 101개
# RBF 커널, C=1: 교차검증 정확도 0.970, 서포트 벡터 72개
# RBF 커널, C=1000: 교차검증 정확도 0.977, 서포트 벡터 25개
\`\`\`

초승달 모양의 데이터는 선형 커널로는 0.840이지만 RBF 커널로는 0.970이다. \`C\`를 1000으로 키우면 마진이 좁아져 서포트 벡터가 25개로 줄어든다. \`C\`와 \`gamma\`는 함께 복잡도를 정하므로 교차검증으로 함께 고른다([[lesson:cross-validation]]). SVM도 거리와 내적을 쓰므로 먼저 표준화한다.
`,
  checks: [
    {
      key: "c1",
      question: "SVM에서 $w = (0.5, -0.5)$일 때 마진 폭 $2 / \\lVert w \\rVert$는?",
      choices: ["$2\\sqrt{2} \\approx 2.83$", "$\\sqrt{2} \\approx 1.41$", "4", "0.5"],
      answer: 0,
      explanation: "$\\lVert w \\rVert = \\sqrt{0.25 + 0.25} \\approx 0.707$이므로 $2 / 0.707 \\approx 2.83$이다.",
    },
    {
      key: "c2",
      question: "SVM의 서포트 벡터에 대한 설명으로 옳은 것은?",
      choices: [
        "경계에 가장 가까이 있어 경계의 위치를 정하는 샘플이다",
        "모든 학습 샘플을 가리킨다",
        "경계에서 가장 멀리 있는 샘플이다",
        "예측할 때만 새로 만드는 샘플이다",
      ],
      answer: 0,
      explanation: "서포트 벡터가 아닌 샘플은 조금 옮기거나 지워도 경계가 바뀌지 않는다.",
    },
    {
      key: "c3",
      question: "SVM의 `C`를 크게 하면 일어나는 일은?",
      choices: [
        "학습 데이터의 오류에 주는 벌점이 커져 마진이 좁아지고, 규제가 약해진다",
        "마진이 넓어지고 규제가 강해진다",
        "커널이 선형으로 바뀐다",
        "서포트 벡터가 늘어난다",
      ],
      answer: 0,
      explanation: "`C`는 마진 안에 들어오거나 잘못 분류된 샘플에 주는 벌점의 크기다. 크게 하면 학습 데이터에 더 맞추므로 과적합의 위험이 커진다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "SVM의 마진과 서포트 벡터를 정의하고, 마진을 넓게 잡는 것이 새 데이터에서의 성능에 도움이 되는 이유를 쓰라. 커널이 직선으로 나뉘지 않는 데이터를 다루는 방법도 쓰라.",
      answer: md`
마진은 경계와 가장 가까운 샘플 사이의 폭이고, 서포트 벡터는 경계에 가장 가까이 있어 경계의 위치를 정하는 샘플이다. SVM은 마진의 폭 $2 / \lVert w \rVert$를 최대화하는 경계를 고른다. 마진을 넓게 잡으면 학습 샘플이 조금 다르게 뽑혀도 경계가 크게 바뀌지 않고, 경계 근처의 새 샘플도 여유를 두고 분류되므로 분산이 작아진다. $\lVert w \rVert$를 작게 만드는 것이라 L2 규제와 같은 역할을 한다.

직선으로 나뉘지 않는 데이터는 입력을 더 높은 차원으로 옮겨 그 공간에서 초평면으로 나눈다. SVM은 샘플 사이의 내적만 쓰므로, 높은 차원의 좌표를 계산하지 않고 그 공간의 내적을 바로 계산하는 커널 함수(RBF 등)로 대신한다.
`,
      keyPoints: [
        "마진: 경계와 가장 가까운 샘플 사이의 폭, 서포트 벡터: 경계를 정하는 샘플",
        "마진을 넓히면 경계가 덜 흔들려 분산이 작다(L2 규제와 같은 역할)",
        "직선으로 나뉘지 않으면 높은 차원으로 옮겨 나눈다",
        "커널은 높은 차원의 내적을 직접 계산한다",
      ],
    },
  ],
  references: [
    { title: "scikit-learn — Support Vector Machines", url: "https://scikit-learn.org/stable/modules/svm.html", note: "마진, 커널, C와 gamma (영문)" },
    { title: "ISLP (An Introduction to Statistical Learning with Python) — 9장 Support Vector Machines", url: "https://www.statlearning.com/", note: "최대 마진 분류기와 커널 (영문, 무료 PDF)" },
  ],
});
