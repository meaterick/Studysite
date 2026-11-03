import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/kmeans-pca-pipeline";

export default defineLesson({
  id: "kmeans-pca-pipeline",
  title: "K-means, PCA, 머신러닝 파이프라인",
  tier: "core",
  concepts: ["kmeans-pca-pipelines"],
  goal: "K-means의 할당·갱신 반복을 계산하고 K와 스케일링의 영향을 설명하며, PCA로 분산이 큰 방향을 찾아 누적 설명 비율로 주성분 수를 고르고, 숫자 열과 범주 열을 ColumnTransformer로 전처리해 모델과 하나의 파이프라인으로 묶는다.",
  why: "정답이 없는 데이터에서 비슷한 고객을 묶거나 특성이 많은 데이터를 줄여서 볼 때 K-means와 PCA를 가장 먼저 쓴다. 문장 임베딩 같은 고차원 벡터를 군집으로 나누거나 2차원으로 줄여 살펴볼 때도 같은 방법을 쓴다([[lesson:retrieval]]). 실제 표 데이터는 숫자 열과 범주 열이 섞여 있으므로, 전처리를 모델과 하나의 파이프라인으로 묶어야 교차검증과 운영에서 같은 처리가 보장된다([[lesson:cross-validation]]).",
  body: md`
### K-means: 비슷한 샘플끼리 묶기

**K-means**는 정답 없이 데이터를 $K$개의 군집으로 나누는 비지도학습 방법이다([[lesson:learning-paradigms]]). 군집마다 중심점을 두고, 다음 두 단계를 군집 배정이 바뀌지 않을 때까지 반복한다.

1. **할당**: 각 샘플을 가장 가까운 중심의 군집에 배정한다.
2. **갱신**: 군집마다 배정된 샘플의 평균으로 중심을 옮긴다.

두 단계 모두 군집 안의 거리 제곱합(**inertia**)을 줄이므로 반복은 반드시 멈춘다. 다만 처음 중심을 어디에 두느냐에 따라 다른 결과에서 멈출 수 있어, 여러 번 다른 초기값으로 돌려 inertia가 가장 작은 결과를 쓴다(\`n_init\`).

[[diagram:kmeans-iterations]]

\`\`\`python
import numpy as np
from sklearn.cluster import KMeans

pts = np.array([[1, 1], [1, 2], [4, 4], [5, 4], [1, 0], [4, 5]])
km_1step = KMeans(n_clusters=2, init=np.array([[1, 1], [5, 4]]), n_init=1, max_iter=1).fit(pts)
print(np.round(km_1step.cluster_centers_, 2).tolist(), km_1step.labels_)   # [[1.0, 1.0], [4.33, 4.33]] [0 0 1 1 0 1]

for k in [1, 2, 3]:
    print(k, round(KMeans(n_clusters=k, n_init=10, random_state=0).fit(pts).inertia_, 3))
# 1 36.667
# 2 3.333
# 3 1.833
\`\`\`

처음 중심을 $(1, 1)$과 $(5, 4)$에 두면 한 번의 할당·갱신으로 중심이 $(1, 1)$과 $(4.33, 4.33)$이 되고 배정은 더 바뀌지 않는다. 군집 번호 자체는 의미가 없고 어떤 샘플끼리 묶였는지만 의미가 있다. $K$를 늘리면 inertia는 항상 줄어들므로, 줄어드는 폭이 크게 작아지는 지점(엘보)이나 군집이 업무에 쓸모 있는지로 $K$를 정한다. K-means는 거리를 쓰므로 KNN과 마찬가지로 먼저 표준화한다([[lesson:knn-trees]]).

### PCA: 분산이 큰 방향으로 줄이기

**주성분 분석**(PCA)은 데이터가 가장 넓게 퍼진 방향(첫째 주성분)과, 그와 수직인 방향 가운데 다음으로 넓게 퍼진 방향을 차례로 찾아 그 방향으로 데이터를 투영한다. 이 방향들은 공분산 행렬의 고유벡터이고, 고유값이 그 방향의 분산이다([[lesson:rank-eigen]]). 전체 분산 가운데 각 주성분이 차지하는 비율을 **설명 비율**이라 한다.

[[diagram:pca-projection]]

PCA는 분산이 큰 방향을 찾으므로, 단위 때문에 값이 큰 특성이 있으면 그 특성 하나가 첫째 주성분이 된다. 그래서 **먼저 표준화**하고, 주성분 수는 누적 설명 비율로 정한다(흔히 90~95%).

\`\`\`python
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

X, _ = load_breast_cancer(return_X_y=True)             # 샘플 569개, 특성 30개
ratio = PCA().fit(StandardScaler().fit_transform(X)).explained_variance_ratio_
cum = np.cumsum(ratio)
print(np.round(ratio[:3], 3), np.round(cum[:10], 3))
print("95%를 설명하는 주성분 수:", int(np.argmax(cum >= 0.95)) + 1)
print("표준화 없이 첫째 주성분의 비율:", round(PCA().fit(X).explained_variance_ratio_[0], 3))
# [0.443 0.19  0.094] [0.443 0.632 0.726 0.792 0.847 0.888 0.91  0.926 0.94  0.952]
# 95%를 설명하는 주성분 수: 10
# 표준화 없이 첫째 주성분의 비율: 0.982
\`\`\`

표준화하면 주성분 10개가 분산의 95%를 설명하므로 30차원을 10차원으로 줄여도 정보 대부분이 남는다. 표준화하지 않으면 값이 큰 면적 관련 특성 때문에 첫째 주성분 하나가 98%를 설명하는 것처럼 보인다.

### 파이프라인: 열 종류마다 다른 전처리를 하나로

실제 표 데이터에는 숫자 열과 범주 열이 섞여 있고, 열마다 결측도 다르다. **ColumnTransformer**는 "어느 열에 어떤 변환을 할지"를 목록으로 받아 하나의 변환기로 묶는다. 이것을 모델과 함께 \`make_pipeline\`에 넣으면 \`fit\` 한 번으로 학습 데이터의 중앙값·평균·범주 목록을 계산하고, 예측할 때 같은 규칙을 적용한다([[lesson:data-splits]]).

\`\`\`python
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

df = pd.DataFrame({"나이": [25, 47, 33, 52, 41], "소득": [210, np.nan, 260, 400, np.nan],
                   "도시": ["서울", "부산", "서울", "대구", "부산"]})
pre = ColumnTransformer([
    ("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), ["나이", "소득"]),
    ("cat", OneHotEncoder(handle_unknown="ignore"), ["도시"]),
])
print(np.round(pre.fit_transform(df), 2)[:2])           # 처음 두 행: 숫자 2열 + 도시 원-핫 3열
print(list(pre.get_feature_names_out()))
print(np.round(pre.transform(pd.DataFrame({"나이": [40], "소득": [np.nan], "도시": ["광주"]})), 2))
# [[-1.51 -1.06  0.    0.    1.  ]
#  [ 0.77 -0.28  0.    1.    0.  ]]
# ['num__나이', 'num__소득', 'cat__도시_대구', 'cat__도시_부산', 'cat__도시_서울']
# [[ 0.04 -0.28  0.    0.    0.  ]]
\`\`\`

[[diagram:column-transformer]]

학습 데이터에 없던 도시 "광주"가 들어오면 기본 설정은 오류를 내지만, \`handle_unknown="ignore"\`는 도시 열을 모두 0으로 두고 예측을 계속한다. 결측인 소득은 학습 데이터의 중앙값으로 채워진다. 이 전처리 뒤에 \`PCA(n_components=10)\`와 모델을 이어 붙이면, 표준화·차원 축소·학습이 하나의 추정기가 되어 교차검증과 하이퍼파라미터 탐색에 그대로 넣을 수 있다.

:::warn 흔한 실수
- **표준화하지 않고 K-means나 PCA를 쓴다.** 값의 범위가 큰 특성 하나가 군집과 주성분을 정한다.
- **K-means의 군집 번호를 정답처럼 해석한다.** 번호는 실행마다 바뀔 수 있고, 묶인 샘플의 구성만 의미가 있다.
- **전처리를 파이프라인 밖에서 전체 데이터로 fit한다.** 열 종류별 전처리도 ColumnTransformer로 묶어 파이프라인 안에 넣는다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "K-means의 한 번의 반복을 바르게 나타낸 것은?",
      choices: [
        "각 샘플을 가장 가까운 중심에 배정한 뒤, 배정된 샘플의 평균으로 중심을 옮긴다",
        "정답 레이블로 중심을 정한다",
        "가장 먼 샘플끼리 묶는다",
        "주성분 방향으로 투영한다",
      ],
      answer: 0,
      explanation: "할당과 갱신을 배정이 바뀌지 않을 때까지 반복한다. 정답을 쓰지 않으므로 비지도학습이다.",
    },
    {
      key: "c2",
      question: "K를 1, 2, 3으로 늘렸더니 inertia가 36.7, 3.3, 1.8이었다. 옳은 해석은?",
      choices: [
        "inertia는 K를 늘리면 항상 줄어들므로, 줄어드는 폭이 크게 작아지는 K = 2가 엘보다",
        "inertia가 가장 작은 K = 3이 항상 가장 좋다",
        "K를 늘리면 inertia가 커져야 정상이다",
        "inertia는 정답과의 정확도다",
      ],
      answer: 0,
      explanation: "K를 샘플 수만큼 늘리면 inertia는 0이 된다. 그래서 값 자체보다 줄어드는 폭의 변화를 보고, 군집이 쓸모 있는지와 함께 판단한다.",
    },
    {
      key: "c3",
      question: "PCA의 누적 설명 비율이 첫째부터 넷째 주성분까지 $[0.44, 0.63, 0.73, 0.79]$일 때, 분산의 70% 이상을 설명하는 최소 주성분 수는?",
      choices: ["3개", "1개", "2개", "4개"],
      answer: 0,
      explanation: "누적 비율이 처음으로 0.7을 넘는 것은 셋째(0.73)다.",
    },
    {
      key: "c4",
      question: "PCA 전에 특성을 표준화하는 가장 중요한 이유는?",
      choices: [
        "단위 때문에 값이 큰 특성이 분산을 차지해 주성분이 그 특성 하나로 정해지는 것을 막으려고",
        "계산 속도를 높이려고",
        "주성분의 수를 늘리려고",
        "정답 레이블을 만들려고",
      ],
      answer: 0,
      explanation: "PCA는 분산이 큰 방향을 찾는다. 면적(수천)과 비율(0~1)을 섞으면 면적의 분산이 압도해, 데이터의 구조가 아니라 단위가 주성분을 정한다.",
    },
    {
      key: "c5",
      question: "학습 데이터에 없던 도시 \"광주\"가 예측 시점에 들어왔다. `OneHotEncoder(handle_unknown=\"ignore\")`의 동작은?",
      choices: [
        "도시 원-핫 열을 모두 0으로 두고 예측을 계속한다",
        "오류를 내고 멈춘다",
        "가장 흔한 도시로 바꿔 넣는다",
        "그 행을 삭제한다",
      ],
      answer: 0,
      explanation: "기본값(`\"error\"`)은 처음 보는 범주에서 오류를 낸다. `\"ignore\"`는 해당 원-핫 열을 모두 0으로 두어 예측을 멈추지 않는다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
pts = np.array([[0, 0], [1, 0], [9, 9], [10, 9]])
centers = np.array([[0, 0], [10, 10]])
d = ((pts[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2)
labels = d.argmin(axis=1)
print(labels, [pts[labels == k].mean(axis=0).tolist() for k in range(2)])
`,
      expected: "[0 0 1 1] [[0.5, 0.0], [9.5, 9.0]]",
      explanation: "할당 단계에서 앞의 두 점은 $(0, 0)$에, 뒤의 두 점은 $(10, 10)$에 더 가깝다. 갱신 단계에서 각 군집의 평균 $(0.5, 0)$과 $(9.5, 9)$가 새 중심이 된다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "숫자 열과 범주 열이 섞인 데이터의 전처리를 ColumnTransformer로 묶어 파이프라인 안에 넣어야 하는 이유를 쓰고, `handle_unknown=\"ignore\"`가 필요한 상황과 K-means·PCA 앞에 표준화를 넣어야 하는 이유를 쓰라.",
      answer: md`
결측 대체의 중앙값, 표준화의 평균·표준편차, 원-핫 인코딩의 범주 목록은 모두 데이터에서 계산하는 값이므로 학습 데이터로만 계산해야 누수가 없다. 열 종류마다 처리가 다르면 손으로 따로 하다가 한 곳에서라도 전체 데이터로 fit하기 쉽다. ColumnTransformer로 열별 변환을 하나로 묶어 모델과 함께 파이프라인에 넣으면, fit 한 번으로 학습 데이터에서 모든 규칙을 계산하고 교차검증의 fold마다 같은 순서가 지켜지며, 운영에서도 같은 처리가 적용된다.

\`handle_unknown="ignore"\`는 학습 때 없던 범주(새 도시)가 예측 시점에 들어와도 오류 없이 그 원-핫 열을 모두 0으로 두기 위해 필요하다. K-means와 PCA는 각각 거리와 분산을 쓰므로, 값의 범위가 큰 특성 하나가 군집과 주성분을 정하지 않도록 먼저 표준화한다.
`,
      keyPoints: [
        "전처리 규칙도 학습 데이터로만 계산해야 누수가 없다",
        "파이프라인으로 묶으면 fold마다·운영에서 같은 처리가 보장된다",
        "handle_unknown은 처음 보는 범주에서 오류를 막는다",
        "K-means·PCA는 거리·분산을 쓰므로 표준화가 필요하다",
      ],
    },
  ],
  references: [
    { title: "scikit-learn — Clustering: K-means", url: "https://scikit-learn.org/stable/modules/clustering.html#k-means", note: "할당·갱신, inertia, n_init (영문)" },
    { title: "Setosa — Principal Component Analysis explained visually", url: "https://setosa.io/ev/principal-component-analysis/", note: "PCA를 그래프로 보는 자료 (영문)" },
    { title: "scikit-learn — Column Transformer with Mixed Types", url: "https://scikit-learn.org/stable/auto_examples/compose/plot_column_transformer_mixed_types.html", note: "숫자·범주 열을 함께 처리하는 예제 (영문)" },
  ],
});
