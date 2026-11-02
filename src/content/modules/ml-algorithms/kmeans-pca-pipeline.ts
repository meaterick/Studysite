import { defineLesson, md } from "../../kit";
import exercises from "./labs/kmeans-pca-pipeline";

export default defineLesson({
  id: "kmeans-pca-pipeline",
  title: "K-means, PCA, 머신러닝 파이프라인",
  tier: "core",
  concepts: ["kmeans-pca-pipelines"],
  goal: "SVM의 마진·서포트벡터를 계산하고, K-Means의 할당-갱신 반복과 PCA가 분산이 큰 방향(공분산의 고유벡터)을 찾는 원리를 설명할 수 있다.",
  why: "",
  body: md`
### 서포트벡터머신(SVM): 마진을 최대화하는 경계선


서포트벡터머신(Support Vector Machine)은 두 클래스를 가르는 직선(또는 초평면) $w^Tx+b=0$을 긋되, 그중에서도 양쪽 클래스로부터 가장 멀리 떨어진 경계선을 찾는다는 독특한 기준을 쓴다. 경계선과 가장 가까운 데이터 포인트까지의 거리를 마진(margin)이라 하고, 이 마진의 폭은 $\dfrac{2}{\lVert w\rVert}$로 계산된다. SVM은 이 마진을 최대화하는(즉 $\lVert w\rVert$를 최소화하는) $w,b$를 찾는 최적화 문제를 푼다. 이때 경계선에 가장 가까이 붙어서 마진의 폭을 실질적으로 결정짓는 데이터 포인트들을 서포트벡터(support vector)라 부른다. 나머지 포인트들은 경계선에서 멀리 떨어져 있어 그 위치를 조금 옮기거나 심지어 제거해도 경계선 자체는 바뀌지 않는다.

:::example 두 점만으로 마진 계산하기
클래스 $+1$인 점 $A=(3,1)$과 클래스 $-1$인 점 $B=(1,3)$이 있고, 이 둘이 정확히 경계선에서 같은 거리에 있는 서포트벡터라 하자. 경계선의 방향을 $w=(1,-1)$로 두면 $w\cdot A=3-1=2$, $w\cdot B=1-3=-2$다. 서포트벡터에서는 관례상 $|w^Tx+b|=1$이 되도록 $w$를 스케일하므로, $w$를 절반으로 줄인 $w'=(0.5,-0.5)$를 쓰면 $w'\cdot A=1$, $w'\cdot B=-1$이 정확히 맞아떨어진다. 이때 마진의 폭은 $\dfrac{2}{\lVert w'\rVert}=\dfrac{2}{\sqrt{0.5^2+0.5^2}}=\dfrac{2}{0.7071}\approx2.83$이다. $A$와 $B$ 두 점이 이 마진의 양쪽 경계를 결정짓는 서포트벡터이고, SVM의 학습은 이 폭을 가능한 한 크게 만드는 $w,b$를 찾는 과정이다.
:::

\`\lVert w \rVert\`(벡터의 크기, norm)는 1주차에서 다룬 \`np.linalg.norm\`으로 바로 계산할 수 있다. 벡터의 내적(dot product) 역시 1주차에서 \`@\` 연산자로 다뤘던 것을 그대로 재사용한다.

\`\`\`python
import numpy as np

A = np.array([3, 1])          # 클래스 +1
B = np.array([1, 3])          # 클래스 -1
w = np.array([0.5, -0.5])     # 위 예제에서 스케일까지 맞춘 w'

print("w·A =", w @ A)         # @ : 벡터 내적 연산자 (1주차 참고)
print("w·B =", w @ B)

margin = 2 / np.linalg.norm(w)
print(f"마진 폭 = 2 / ||w|| = {margin:.3f}")
\`\`\`

\`w @ A\`와 \`w @ B\`가 정확히 $1$과 $-1$로 나오고, 마진 폭이 손으로 계산한 $2.83$과 일치하는지 확인하자.

\`\`\`image
src: /images/week2/svm-margin.svg
alt: 두 클래스(파랑·빨강 점)를 가르는 검은색 결정 경계선과 그 양옆의 파란색·빨간색 점선 마진, 그리고 마진 선 위에 걸쳐 굵게 표시된 서포트벡터 두 점을 보여주는 SVM 다이어그램
caption: SVM은 두 클래스 사이의 마진(점선 사이 거리)이 가장 넓어지는 경계선을 찾는다. 마진 선 위에 정확히 걸쳐 있는(굵은 테두리) 점들이 서포트벡터다.
credit: 자체 제작 (Studysite), 본문의 마진·서포트벡터 정의를 도식화
width: 480
height: 360
\`\`\`

데이터가 직선으로 깔끔하게 갈라지지 않는 경우, SVM은 커널 트릭(kernel trick)이라는 방법으로 원래 특징 공간을 더 높은 차원으로 매핑해 그 공간에서는 직선으로 갈라지도록 만든다(대표적으로 RBF 커널). 이 부분은 이번 주 범위를 넘어서므로 "선형으로 안 갈라지는 데이터도 SVM으로 다룰 방법이 있다"는 정도만 기억해두자.

[[diagram:kernel-lift]]

### 비지도학습 알고리즘: K-Means와 PCA


1주차에서 지도학습(정답 $y$가 있는 데이터로 학습)과 비지도학습(정답 없이 데이터 $X$ 자체의 구조를 찾는 학습)을 구분했다. 지금까지 다룬 회귀·로지스틱 회귀·KNN·나이브베이즈·결정트리·랜덤포레스트·부스팅·SVM은 전부 정답 레이블이 있어야 학습이 가능한 지도학습 알고리즘이다. K-Means와 PCA는 레이블 $y$ 없이 오직 $X$만 보고 각각 "비슷한 데이터끼리 묶기"와 "데이터를 잘 설명하는 저차원 표현 찾기"를 수행하므로 비지도학습으로 분류된다.

**K-Means**는 데이터를 $K$개의 군집(cluster)으로 나누는 알고리즘이다. 각 군집은 중심점(centroid)으로 대표되며, 다음 두 단계를 값이 더 이상 바뀌지 않을 때까지 반복한다. ① 할당(Assignment): 각 데이터 포인트를 가장 가까운 centroid의 군집으로 배정한다. ② 갱신(Update): 각 군집에 새로 배정된 포인트들의 평균 좌표로 centroid를 다시 계산한다.

[[diagram:kmeans-iterations]]

:::example 6개 점으로 손으로 따라가 보는 K-Means (K=2)
점 $P_1(1,1),P_2(1,2),P_3(4,4),P_4(5,4),P_5(1,0),P_6(4,5)$가 있다. 초기 centroid를 $C_1=P_1=(1,1)$, $C_2=P_4=(5,4)$로 두고 1회차를 실행해 보자.

| 점 | $C_1$까지 거리 | $C_2$까지 거리 | 배정 |
| --- | --- | --- | --- |
| $P_1(1,1)$ | 0 | 5.000 | $C_1$ |
| $P_2(1,2)$ | 1.000 | 4.472 | $C_1$ |
| $P_3(4,4)$ | 4.243 | 1.000 | $C_2$ |
| $P_4(5,4)$ | 5.000 | 0 | $C_2$ |
| $P_5(1,0)$ | 1.000 | 5.657 | $C_1$ |
| $P_6(4,5)$ | 5.000 | 1.414 | $C_2$ |

**갱신**: 군집1 $\{P_1,P_2,P_5\}$의 평균은 $\left(\dfrac{1+1+1}{3},\dfrac{1+2+0}{3}\right)=(1,1)$이고, 군집2 $\{P_3,P_4,P_6\}$의 평균은 $\left(\dfrac{4+5+4}{3},\dfrac{4+4+5}{3}\right)\approx(4.33,4.33)$이다. 새로운 centroid로 다시 할당을 계산해봐도 각 점이 속하는 군집은 전혀 바뀌지 않는다. 즉 이 예제는 단 1회 반복만으로 수렴했다.

실제 데이터에서는 보통 여러 번 반복해야 하고, 초기 centroid를 어디에 두는지에 따라 최종 결과가 달라질 수 있어(지역 최솟값에 빠지는 문제) 서로 다른 초기값으로 여러 번 돌려 그중 가장 좋은 결과를 택하는 방식(k-means++ 초기화 등)이 실무에서 흔히 쓰인다. $K$ 자체도 미리 정해야 하는 하이퍼파라미터이며, 군집 내 거리 합이 완만해지는 지점을 찾는 엘보우(elbow) 방법 등으로 정하는 경우가 많다.
:::

sklearn의 \`KMeans\`로 방금 손으로 돌려본 1회차 갱신을 그대로 재현해보자. \`init\` 인자에 우리가 정한 초기 centroid를 직접 넣고 \`max_iter=1\`로 "단 1번만 갱신"하도록 제한하면 손 계산과 정확히 같은 상황을 만들 수 있다.

\`\`\`python
import numpy as np
from sklearn.cluster import KMeans

pts = np.array([[1, 1], [1, 2], [4, 4], [5, 4], [1, 0], [4, 5]])  # 위 예제의 P1~P6과 동일한 순서

# 손으로 계산한 것과 똑같이 초기 centroid를 P1, P4로 주고 딱 1번만 갱신
km_1step = KMeans(n_clusters=2, init=np.array([[1, 1], [5, 4]]), n_init=1, max_iter=1).fit(pts)
print("1회 갱신 후 centroid:\n", np.round(km_1step.cluster_centers_, 2))
print("1회 갱신 후 배정:", km_1step.labels_)

# 실무에서는 초기 centroid를 미리 알 수 없으므로, 무작위로 여러 번(n_init=10) 시도해 가장 좋은 결과를 택한다
km = KMeans(n_clusters=2, n_init=10, random_state=0).fit(pts)
print("\n무작위 초기화(n_init=10) 최종 centroid:\n", np.round(km.cluster_centers_, 2))
print("무작위 초기화 최종 배정:", km.labels_)
\`\`\`

첫 번째 결과의 centroid $(1,1)$과 $(4.33,4.33)$이 손으로 계산한 값과 정확히 같은지 확인하자. 두 번째 결과는 군집 번호(0과 1 어느 쪽이 어느 군집인지)가 첫 번째와 뒤바뀌어 나올 수도 있는데, K-Means에서 군집 "번호" 자체는 의미가 없고(어차피 레이블 없이 비슷한 것끼리 묶기만 하므로) 어떤 점들이 같은 군집으로 묶였는지만 중요하다는 점도 함께 기억해두자.

**PCA(주성분분석)**는 1주차에서 배운 고유벡터·고윳값, 그리고 SVD($X=U\Sigma V^T$)를 데이터의 차원을 줄이는 데 직접 활용하는 방법이다. 아이디어는 단순하다. 데이터가 가장 넓게 퍼져 있는(분산이 가장 큰) 방향을 찾아 그 방향으로 데이터를 투영하면, 원래 차원보다 적은 수의 축만으로도 데이터의 정보를 최대한 보존할 수 있다는 것이다. 이 "분산이 가장 큰 방향"은 정확히 데이터의 공분산 행렬 $\Sigma_{cov}$의 고유벡터 중 가장 큰 고윳값에 대응하는 벡터이며(즉 $\Sigma_{cov}v=\lambda v$를 만족하는 $v$), 동시에 중심화된 데이터 행렬 $X$를 SVD로 분해했을 때 가장 큰 특이값에 대응하는 오른쪽 특이벡터($V$의 첫 번째 열)와도 같다.

[[diagram:pca-projection]]

:::example 완벽한 직선 데이터로 확인하는 PCA
점 $(0,0),(1,1),(2,2),(3,3),(-1,-1)$은 모두 정확히 $y=x$ 위에 있다. 평균은 $(1,1)$이므로 중심화하면 $(-1,-1),(0,0),(1,1),(2,2),(-2,-2)$가 된다. 표본 크기 $n=5$로 나눈 공분산 행렬은 $S_{xx}=S_{yy}=S_{xy}=\dfrac{1+0+1+4+4}{5}=2$이므로 $\Sigma_{cov}=\begin{pmatrix}2&2\\2&2\end{pmatrix}$다. 이 행렬의 고윳값은 $\lambda=4$와 $\lambda=0$이고(대각합 $4$, 행렬식 $0$이므로), 각각에 대응하는 고유벡터는 $v_1=\left(\tfrac{1}{\sqrt2},\tfrac{1}{\sqrt2}\right)$와 $v_2=\left(\tfrac{1}{\sqrt2},-\tfrac{1}{\sqrt2}\right)$다.

데이터가 정확히 $y=x$라는 직선 위에 있으니 당연히 모든 변동은 그 직선 방향($v_1$, $(1,1)$ 방향)으로만 존재하고, 그와 수직인 방향($v_2$, $(1,-1)$ 방향)으로는 변동이 전혀 없다. 계산된 고윳값 $4$와 $0$이 정확히 이 사실과 일치한다. 첫 번째 주성분 $v_1$ 하나에만 데이터를 투영해도(2차원을 1차원으로 줄여도) 정보 손실이 전혀 없다는 뜻이다. 실제 데이터는 이렇게 완벽한 직선 위에 있는 경우가 드물지만, 두 고윳값의 크기 차이가 클수록(하나는 크고 나머지는 작을수록) 적은 수의 주성분으로도 데이터의 분산 대부분을 설명할 수 있다는 원리는 그대로 적용된다.
:::

sklearn의 \`PCA\`도 같은 데이터로 검산해보자. sklearn은 공분산 행렬을 표본 크기가 아니라 표본 크기에서 1을 뺀 값(n−1)으로 나누는 관례(불편추정량)를 쓰기 때문에 고윳값 자체의 크기는 손 계산과 조금 다르게 나올 수 있지만, "각 주성분이 전체 분산 중 몇 %를 차지하는가"라는 비율은 나누는 값과 무관하게 항상 똑같이 나온다. 그래서 아래 코드는 고윳값 대신 이 비율(\`explained_variance_ratio_\`)을 확인한다.

\`\`\`python
import numpy as np
from sklearn.decomposition import PCA

pts = np.array([[0, 0], [1, 1], [2, 2], [3, 3], [-1, -1]])  # 위 예시와 동일, 정확히 y=x 위의 점들

pca = PCA(n_components=2).fit(pts)
print("주성분 방향(고유벡터, 부호는 반대로 나올 수도 있음):\n", np.round(pca.components_, 3))
print("분산 설명 비율 (PC1, PC2):", np.round(pca.explained_variance_ratio_, 4))
\`\`\`

첫 번째 주성분의 방향이 $(1,1)$을 정규화한 $(\pm0.707, \pm0.707)$과 같은 방향이고, 분산 설명 비율이 (1.0, 0.0)으로 나오는지(즉 PC1 혼자 분산의 100%를 설명하는지) 확인하자. 고유벡터의 부호(+인지 −인지)는 계산 라이브러리마다 다르게 나올 수 있는데, 방향 자체(그 직선 위에 있다는 사실)만 같으면 결과가 같은 것으로 봐도 된다. 바로 위 예제에서 구한 $v_1=(1,1)$ 방향과 부호만 반대인 $-v_1=(-1,-1)$이 사실은 같은 직선을 가리키는 것과 같은 이치다.

### 실전 PCA: 먼저 표준화하고, 누적 설명 비율로 개수를 고른다

실제 데이터에 PCA를 쓸 때 두 가지를 기억하자. 첫째, **먼저 표준화한다.** PCA는 분산이 큰 방향을 찾으므로, 단위 때문에 숫자가 큰 특징(넓이 수백~수천)이 있으면 그 특징 하나가 첫 주성분을 독차지한다. 둘째, 주성분 개수는 **누적 설명 비율**로 고른다. 흔히 분산의 90~95%를 설명하는 최소 개수를 쓴다. 특징 30개인 유방암 데이터로 확인해 보자.

\`\`\`python
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

X, _ = load_breast_cancer(return_X_y=True)            # 569개 샘플, 특징 30개
Xs = StandardScaler().fit_transform(X)                 # 단위가 다른 특징을 먼저 표준화
ratio = PCA().fit(Xs).explained_variance_ratio_
cum = np.cumsum(ratio)                                 # 누적 설명 비율
print("PC1~PC5 비율:", np.round(ratio[:5], 3))
print("누적:", np.round(cum[:10], 3))
print("분산의 95%를 설명하는 데 필요한 주성분 수:", int(np.argmax(cum >= 0.95)) + 1)

raw = PCA().fit(X).explained_variance_ratio_           # 표준화하지 않으면?
print("표준화 없이 PC1 비율:", round(raw[0], 3))          # 값이 큰 특징(면적) 하나가 독차지
\`\`\`

표준화하지 않으면 PC1이 분산의 98%를 설명하는 것처럼 보이지만, 그것은 값이 큰 몇 개 특징의 단위 때문이다. 표준화하면 PC1이 44%, 처음 열 개가 95%를 설명한다. 30차원을 10차원으로 줄여도 정보 대부분이 남는다는 뜻이다.

[[diagram:pca-cumulative]]
`,
  checks: [
    {
      key: "c1",
      question: "SVM에서 $w = (0.5, -0.5)$일 때 마진 폭 $2/\\lVert w\\rVert$는?",
      choices: ["$\\sqrt{2} \\approx 1.41$", "$2\\sqrt{2} \\approx 2.83$", "4", "0.5"],
      answer: 1,
      explanation: "$\\lVert w\\rVert = \\sqrt{0.25 + 0.25} = \\sqrt{0.5} \\approx 0.707$이므로 $2/0.707 \\approx 2.83$.",
    },
    {
      key: "c2",
      question: "K-Means의 한 반복을 올바르게 나타낸 것은?",
      choices: ["레이블 $y$로 중심을 정한다", "각 점을 가장 가까운 중심에 배정 → 배정된 점들의 평균으로 중심을 갱신", "가장 먼 점끼리 묶는다", "주성분 방향으로 투영한다"],
      answer: 1,
      explanation: "할당과 갱신을 배정이 바뀌지 않을 때까지 반복한다. 레이블을 쓰지 않으므로 비지도학습이다.",
    },
    {
      key: "c3",
      question: "모든 점이 정확히 직선 $y = x$ 위에 있는 2차원 데이터에 PCA를 하면 PC1과 PC2의 분산 설명 비율은?",
      choices: ["0.5, 0.5", "1.0, 0.0", "0.0, 1.0", "0.7, 0.3"],
      answer: 1,
      explanation: "모든 변동이 $(1,1)$ 방향에만 있으므로 PC1 하나가 분산의 100%를 설명한다(공분산 행렬의 고유값 4와 0).",
    },
    {
      key: "c4",
      question: "PCA의 누적 설명 비율이 PC1~PC4에서 $[0.44, 0.63, 0.73, 0.79]$일 때, 분산의 70% 이상을 설명하는 최소 주성분 수는?",
      choices: ["3개", "1개", "2개", "4개"],
      answer: 0,
      explanation: "누적 비율이 처음으로 0.7을 넘는 것은 PC3(0.73)이다. 그래서 세 개의 주성분이면 분산의 73%를 보존한다.",
    },
    {
      key: "c5",
      question: "PCA 전에 특징을 표준화하는 가장 중요한 이유는?",
      choices: ["단위 때문에 값이 큰 특징이 분산을 독차지해 주성분을 왜곡하지 않게 하려고", "계산 속도를 높이려고", "주성분의 개수를 늘리려고", "레이블을 만들려고"],
      answer: 0,
      explanation: "PCA는 분산이 큰 방향을 찾는다. 넓이(수천)와 비율(0~1)을 섞으면 넓이의 분산이 압도해, 의미가 아니라 단위가 주성분을 정한다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "SVM에서 '마진(margin)'과 '서포트벡터(support vector)'를 각각 정의하고, 마진을 최대화하는 것이 왜 일반화 성능에 도움이 되는지 설명하라.",
      answer: md`
서포트벡터는 결정 경계에 가장 가까이 붙어 마진을 결정짓는 데이터 포인트들이다. SVM은 이 마진(경계와 가장 가까운 점 사이의 거리)을 최대화하도록 경계를 긋는데, 마진이 넓을수록 새로운 데이터에 대해서도 여유 있게 올바르게 분류할 가능성이 높아져 일반화 성능이 좋아진다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "K-Means와 PCA가 왜 '비지도학습'으로 분류되는지, 1주차의 지도/비지도학습 구분을 근거로 설명하라.",
      answer: md`
K-Means와 PCA는 둘 다 정답 라벨 $y$ 없이 입력 $X$만 사용해 데이터 안의 구조(군집, 분산이 큰 방향)를 찾아내므로 비지도학습으로 분류된다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "scikit-learn — Support Vector Machines", url: "https://scikit-learn.org/stable/modules/svm.html", note: "마진·커널·C 파라미터" },
    { title: "Setosa — Principal Component Analysis explained visually", url: "https://setosa.io/ev/principal-component-analysis/", note: "PCA를 인터랙티브 그래프로 이해하기" },
  ],
});
