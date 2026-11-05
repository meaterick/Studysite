import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/rank-eigen";

export default defineLesson({
  id: "rank-eigen",
  title: "랭크·노름·고유값·특이값 분해",
  tier: "advanced",
  requires: ["linear-maps-basis"],
  goal: "행렬의 랭크와 벡터의 L1·L2 노름을 계산하고, 특성방정식으로 $2 \\times 2$ 행렬의 고유값·고유벡터를 구하며, 특이값 분해로 저랭크 근사를 만들고 그 오차를 설명한다.",
  why: "L1·L2 노름은 정규화([[lesson:regularization]])와 거리 계산에 쓰인다. 고유값은 경사하강법의 학습률 한계를 정하고([[lesson:gd-convergence]]), 특이값 분해는 주성분 분석([[lesson:kmeans-pca-pipeline]])과 언어 모델 미세조정 기법 LoRA([[lesson:instruction-tuning]])의 바탕이다.",
  body: md`
### 랭크

행렬의 **랭크(rank)**는 열 중 선형독립인 것의 최대 개수이고, 열들의 선형결합으로 만들 수 있는 공간(열공간)의 차원과 같다. 행으로 세어도 같은 값이 나온다. $m \times n$ 행렬의 랭크는 $\min(m, n)$을 넘지 않는다.

[[lesson:linear-maps-basis]]에서 역행렬이 없었던 다음 행렬의 랭크를 구한다.

\`\`\`math
A = \begin{bmatrix}1 & 2\\2 & 4\end{bmatrix}
\`\`\`

둘째 열 $[2, 4]$가 첫째 열 $[1, 2]$의 2배이므로 선형독립인 열은 하나다. 랭크는 1이다. $A$는 평면 전체를 직선 하나로 보내므로 열공간의 차원도 1이다. $n \times n$ 행렬에서는 다음 세 조건이 서로 같다.

- 랭크가 $n$이다(**풀 랭크**, full rank).
- 행렬식이 0이 아니다.
- 역행렬이 있다.

데이터 행렬에서 한 열이 다른 열들의 선형결합이면(예: "총점" 열 = 과목 점수 열들의 합) 랭크가 열 개수보다 작아진다. 이때 선형 회귀의 정규방정식에 쓰는 $X^\top X$는 역행렬이 없어, 손실을 최소로 만드는 가중치가 하나로 정해지지 않는다.

### 노름

**노름(norm)**은 벡터의 크기를 하나의 수로 나타내는 함수다. 머신러닝에서 가장 많이 쓰는 두 가지는 다음과 같다.

\`\`\`math
\lVert a \rVert_2 = \sqrt{a_1^2 + a_2^2 + \cdots + a_n^2}, \qquad \lVert a \rVert_1 = |a_1| + |a_2| + \cdots + |a_n|
\`\`\`

L2 노름은 [[lesson:dot-product]]에서 쓴 벡터의 길이 $\sqrt{a \cdot a}$이고, 원점에서 끝점까지의 직선 거리다. L1 노름은 좌표축 방향으로만 움직일 때의 거리라 맨해튼 거리라고도 한다. $a = [3, 4]$이면 $\lVert a \rVert_2 = 5$, $\lVert a \rVert_1 = 7$이다. 두 벡터의 거리는 차의 노름 $\lVert a - b \rVert$으로 잰다.

노름이 1인 점들의 집합은 L2에서 원, L1에서 꼭짓점이 좌표축 위에 놓인 마름모다. L2 정규화는 파라미터의 L2 노름을, L1 정규화는 L1 노름을 손실에 더해 파라미터가 커지는 것을 제한한다([[lesson:regularization]]). L1 노름이 일정한 집합은 꼭짓점이 축 위에 있어서, L1 정규화로 얻은 해는 일부 성분이 정확히 0이 되는 경우가 많다.

[[diagram:norm-balls]]

행렬에도 노름을 정의한다. 모든 원소의 제곱합의 제곱근을 **프로베니우스 노름** $\lVert A \rVert_F$라고 한다. 행렬을 원소 $mn$개짜리 벡터로 펼쳐 L2 노름을 구한 것과 같고, 두 행렬이 얼마나 다른지 $\lVert A - B \rVert_F$로 잴 때 쓴다.

### 고유값과 고유벡터

정사각행렬 $A$에 대해 영벡터가 아닌 $v$와 수 $\lambda$가

\`\`\`math
Av = \lambda v
\`\`\`

를 만족하면 $v$를 **고유벡터(eigenvector)**, $\lambda$를 **고유값(eigenvalue)**이라고 한다. $A$를 곱해도 $v$는 같은 직선 위에 남고 길이만 $\lambda$배가 된다($\lambda < 0$이면 방향이 반대가 된다).

대각행렬 $\begin{bmatrix}2 & 0\\0 & 3\end{bmatrix}$은 $[1, 0]$을 $[2, 0]$으로, $[0, 1]$을 $[0, 3]$으로 보낸다. 대각원소 2, 3이 고유값이고 표준기저 벡터가 고유벡터다.

대각행렬이 아니면 특성방정식을 푼다. $Av = \lambda v$는 $(A - \lambda I)v = 0$이고, 이 식이 영벡터가 아닌 해를 가지려면 $A - \lambda I$의 역행렬이 없어야 한다. 즉 $\det(A - \lambda I) = 0$이다. 이 식을 **특성방정식**이라고 한다. $A = \begin{bmatrix}2 & 1\\1 & 2\end{bmatrix}$이면

\`\`\`math
\det\begin{bmatrix}2-\lambda & 1\\1 & 2-\lambda\end{bmatrix} = (2-\lambda)^2 - 1 = 0
\`\`\`

이므로 $2 - \lambda = \pm 1$, 즉 $\lambda = 3$ 또는 $\lambda = 1$이다. $\lambda = 3$을 대입하면 $(A - 3I)v = \begin{bmatrix}-1 & 1\\1 & -1\end{bmatrix}v = 0$에서 $v_1 = v_2$이므로 $[1, 1]$이 고유벡터다(검산: $A[1, 1] = [3, 3]$). $\lambda = 1$이면 $\begin{bmatrix}1 & 1\\1 & 1\end{bmatrix}v = 0$에서 $v_1 = -v_2$이므로 $[1, -1]$이 고유벡터다. 고유벡터에 0이 아닌 수를 곱해도 고유벡터이므로, 보통 길이 1로 정규화해서 쓴다.

$2 \times 2$ 행렬에서는 검산식이 두 개 있다. 고유값의 합은 대각원소의 합(**대각합**, trace)과 같고, 고유값의 곱은 행렬식과 같다. 위 예에서 $3 + 1 = 2 + 2$, $3 \times 1 = 2 \cdot 2 - 1 \cdot 1$이다.

[[diagram:eigen-directions]]

\`\`\`image
src: /images/week1/mona-lisa-eigenvector.png
alt: 왼쪽은 격자를 씌운 모나리자 그림이고, 오른쪽은 같은 그림을 가로 방향으로 미는 전단 변환을 적용한 결과다. 가로 방향의 파란 화살표는 그대로이고 세로 방향의 빨간 화살표는 기울어진다
caption: 가로 방향 전단 변환을 적용하면 세로 방향의 빨간 화살표는 방향이 기울어지므로 고유벡터가 아니다. 가로 방향의 파란 화살표는 방향과 길이가 그대로이므로 고유값 1인 고유벡터다.
credit: TreyGreer62, CC0 1.0, Wikimedia Commons
width: 500
height: 348
\`\`\`

**대칭행렬**($A^\top = A$)은 고유값이 모두 실수이고, 서로 다른 고유값의 고유벡터는 서로 직교한다. 그래서 길이 1인 고유벡터를 열로 모은 직교행렬 $Q$와 고유값을 대각에 놓은 $\Lambda$로 $A = Q \Lambda Q^\top$처럼 분해된다. 고유벡터를 기저로 삼으면 $A$는 각 축 방향으로 고유값만큼 늘이는 대각행렬이 된다는 뜻이다. 데이터의 공분산행렬은 대칭행렬이고, 이 분해로 찾은 고유벡터가 주성분 분석의 주성분 방향이다([[lesson:kmeans-pca-pipeline]]).

### 특이값 분해

고유값 분해는 정사각행렬에만 정의된다. **특이값 분해(singular value decomposition, SVD)**는 모든 $m \times n$ 행렬을 다음처럼 분해한다.

\`\`\`math
A = U \Sigma V^\top
\`\`\`

$U$($m \times m$)와 $V$($n \times n$)는 열들이 서로 직교하는 단위벡터인 직교행렬이고, $\Sigma$는 대각에 0 이상인 **특이값** $\sigma_1 \ge \sigma_2 \ge \cdots$이 놓인 $m \times n$ 행렬이다. 직교행렬은 길이와 각도를 바꾸지 않는 회전·반사이므로, 모든 행렬은 "회전·반사 → 축 방향으로 늘이기 → 회전·반사" 세 단계로 나뉜다. 특이값은 $A^\top A$의 고유값의 제곱근이고, 0이 아닌 특이값의 개수가 랭크다.

[[diagram:svd-steps]]

### 저랭크 근사

$U$의 $i$번째 열을 $u_i$, $V$의 $i$번째 열을 $v_i$라 하면 $A = \sum_i \sigma_i u_i v_i^\top$로 쓸 수 있다. 큰 특이값 $k$개의 항만 남긴 $A_k = \sum_{i=1}^{k} \sigma_i u_i v_i^\top$은 랭크가 $k$인 행렬 중 $A$에 가장 가까운 행렬이고(에카르트–영 정리), 오차는 버린 특이값으로 정해진다.

\`\`\`math
\lVert A - A_k \rVert_F = \sqrt{\sigma_{k+1}^2 + \sigma_{k+2}^2 + \cdots}
\`\`\`

뒤쪽 특이값이 작으면 적은 수의 항으로 행렬을 거의 그대로 나타낼 수 있다. 주성분 분석은 데이터 행렬의 큰 특이값 방향만 남겨 차원을 줄이고, LoRA는 가중치의 변화량을 랭크가 작은 두 행렬의 곱으로 제한해 학습할 파라미터 수를 줄인다.

아래 코드는 셋째 열이 앞 두 열의 합인 $50 \times 3$ 데이터를 만들어, 특이값과 가장 큰 특이값 하나만 남긴 근사의 상대 오차를 계산한다.

\`\`\`python
import numpy as np

print(np.linalg.matrix_rank(np.array([[1, 2], [2, 4]])))   # 1: 두 열이 선형종속

A = np.array([[2.0, 1.0], [1.0, 2.0]])
vals, vecs = np.linalg.eigh(A)            # 대칭행렬의 고유값 분해(고유값 오름차순)
print(vals)                               # [1. 3.]
print(np.round(vecs, 3))                  # 각 열이 길이 1인 고유벡터: [1, -1] 방향과 [1, 1] 방향

rng = np.random.default_rng(0)
X = rng.normal(size=(50, 2)) @ np.array([[3.0, 0.0], [0.0, 0.3]])   # 첫째 열의 분산이 훨씬 큰 데이터
X = np.hstack([X, X @ np.array([[1.0], [1.0]])])                      # 셋째 열 = 앞 두 열의 합 → 랭크 2
U, S, Vt = np.linalg.svd(X, full_matrices=False)
print(np.round(S, 2))                     # 특이값: 마지막 값이 0
X1 = S[0] * np.outer(U[:, 0], Vt[0])      # 가장 큰 특이값 하나만 남긴 랭크 1 근사
print(round(np.linalg.norm(X - X1) / np.linalg.norm(X), 3))   # 상대 오차
\`\`\`

특이값이 $[28.11, 2.54, 0]$이므로 셋째 방향에는 정보가 없고(랭크 2), 첫째 항 하나만 남겨도 상대 오차는 약 9%다. 상대 오차는 $\sqrt{2.54^2 / (28.11^2 + 2.54^2)} \approx 0.09$로, 위의 오차 공식과 일치한다.

[[diagram:low-rank-approx]]

:::warn 흔한 실수
- **고유벡터를 행으로 읽는다.** \`np.linalg.eig\`, \`np.linalg.eigh\`가 돌려주는 고유벡터는 행렬의 **열**이다. \`vecs[:, i]\`가 \`vals[i]\`의 고유벡터다.
- **정렬 순서를 가정한다.** \`eigh\`는 고유값을 오름차순으로, \`svd\`는 특이값을 내림차순으로 돌려준다.
- **대칭행렬에 \`eig\`를 쓴다.** \`eig\`는 일반 행렬용이라 결과가 복소수로 나오거나 정렬되지 않는다. 대칭행렬에는 \`eigh\`를 쓴다.
- **행렬식이 작다는 이유로 랭크가 작다고 판단한다.** 행렬식은 크기 조절에 따라 크게 달라진다. 랭크는 특이값을 기준으로 판단하는 \`np.linalg.matrix_rank\`로 구한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "행렬 $\\begin{bmatrix}1 & 2\\\\ 3 & 6\\end{bmatrix}$의 랭크와 역행렬 존재 여부는?",
      choices: ["랭크 2, 역행렬 있음", "랭크 1, 역행렬 없음", "랭크 1, 역행렬 있음", "랭크 0, 역행렬 없음"],
      answer: 1,
      explanation: "둘째 열 $[2, 6]$이 첫째 열 $[1, 3]$의 2배라 선형독립인 열이 하나뿐이다. 풀 랭크가 아니므로 역행렬이 없다(행렬식 $1 \\cdot 6 - 2 \\cdot 3 = 0$).",
    },
    {
      key: "c2",
      question: "$A = \\begin{bmatrix}2 & 1\\\\ 1 & 2\\end{bmatrix}$에서 고유값 3에 대응하는 고유벡터는?",
      choices: ["$[1, -1]$", "$[1, 1]$", "$[1, 0]$", "$[2, 1]$"],
      answer: 1,
      explanation: "$A[1, 1] = [3, 3] = 3[1, 1]$이다. $[1, -1]$은 고유값 1에 대응한다.",
    },
    {
      key: "c3",
      question: "$a = [-3, 4]$의 L1 노름과 L2 노름은?",
      choices: ["L1 $= 1$, L2 $= 5$", "L1 $= 7$, L2 $= 5$", "L1 $= 7$, L2 $= 25$", "L1 $= 5$, L2 $= 7$"],
      answer: 1,
      explanation: "L1은 절댓값의 합 $|-3| + |4| = 7$, L2는 $\\sqrt{9 + 16} = 5$다. 절댓값과 제곱을 쓰므로 부호는 결과에 영향이 없다.",
    },
    {
      key: "c4",
      question: "어떤 행렬의 특이값이 $[10, 3, 0.01]$이다. 이 행렬에 대한 설명으로 가장 알맞은 것은?",
      choices: ["큰 특이값 2개만 남긴 랭크 2 근사가 원래 행렬과 거의 같다", "세 방향의 크기가 모두 같다", "이 행렬의 랭크는 1이다", "특이값이 작을수록 중요한 방향이다"],
      answer: 0,
      explanation: "랭크 2 근사의 오차는 버린 특이값 0.01이다. 특이값이 모두 0이 아니므로 랭크는 3이다.",
    },
    {
      key: "c5",
      question: "$Av = \\lambda v$($v \\ne 0$)가 뜻하는 것은?",
      choices: ["$A$를 곱해도 $v$는 같은 직선 위에 있고 길이만 $\\lambda$배가 된다", "$A$를 곱하면 $v$가 영벡터가 된다", "$v$는 $A$의 첫째 열이다", "$A$를 곱하면 $v$가 90° 회전한다"],
      answer: 0,
      explanation: "고유벡터는 $A$를 곱한 뒤에도 같은 직선 위에 남는 벡터이고, 고유값은 그 방향의 배율이다. $\\lambda < 0$이면 방향이 반대가 된다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
A = np.array([[2.0, 1.0],
              [1.0, 2.0]])
vals = np.linalg.eigvalsh(A)
print(vals, round(float(np.prod(vals)), 6), np.trace(A))
`,
      expected: "[1. 3.] 3.0 4.0",
      explanation: "$A$의 고유값은 1과 3이고, 대칭행렬용 `eigvalsh`는 오름차순으로 돌려준다. 고유값의 곱 3은 행렬식 $2 \\cdot 2 - 1 \\cdot 1$과 같고, 합 4는 대각합 $2 + 2$와 같다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$A = \\begin{bmatrix}1 & 2\\\\ 2 & 4\\end{bmatrix}$의 랭크를 구하고, 랭크가 2보다 작다는 사실이 역행렬과 어떤 관계인지 설명하라.",
      answer: md`
둘째 열 $[2, 4]$가 첫째 열 $[1, 2]$의 2배라 선형독립인 열은 하나이므로 랭크는 1이다. $A$는 평면의 모든 벡터를 $[1, 2]$ 방향의 직선 위로 보내므로, 서로 다른 입력이 같은 출력이 된다(예: $[1, 1]$과 $[3, 0]$이 모두 $[3, 6]$). 출력에서 입력을 하나로 되찾을 수 없으므로 역행렬이 없고, 행렬식도 $1 \cdot 4 - 2 \cdot 2 = 0$이다.
`,
      keyPoints: ["둘째 열이 첫째 열의 2배라 선형독립인 열이 1개 → 랭크 1", "풀 랭크가 아니면 서로 다른 입력이 같은 출력으로 가므로 역행렬이 없다", "행렬식 0과 같은 조건이다"],
    },
    {
      key: "d2",
      question: "$A = \\begin{bmatrix}3 & 1\\\\ 0 & 2\\end{bmatrix}$의 고유값과 각 고유값의 고유벡터를 특성방정식으로 구하고, 대각합과 행렬식으로 검산하라.",
      answer: md`
$\det(A - \lambda I) = (3 - \lambda)(2 - \lambda) - 1 \cdot 0 = 0$이므로 $\lambda = 3$ 또는 $\lambda = 2$다.

- $\lambda = 3$: $(A - 3I)v = \begin{bmatrix}0 & 1\\0 & -1\end{bmatrix}v = 0$에서 $v_2 = 0$이므로 고유벡터는 $[1, 0]$이다.
- $\lambda = 2$: $(A - 2I)v = \begin{bmatrix}1 & 1\\0 & 0\end{bmatrix}v = 0$에서 $v_1 = -v_2$이므로 고유벡터는 $[1, -1]$이다. 검산: $A[1, -1] = [2, -2] = 2[1, -1]$.

고유값의 합 $3 + 2 = 5$는 대각합 $3 + 2$와 같고, 곱 $6$은 행렬식 $3 \cdot 2 - 1 \cdot 0$과 같다.
`,
      keyPoints: ["특성방정식 $(3 - \\lambda)(2 - \\lambda) = 0$에서 $\\lambda = 3, 2$", "$\\lambda = 3$의 고유벡터 $[1, 0]$, $\\lambda = 2$의 고유벡터 $[1, -1]$(0이 아닌 상수배 포함)", "고유값의 합 = 대각합 5, 곱 = 행렬식 6으로 검산"],
    },
    {
      key: "d3",
      question: "특이값 분해에서 큰 특이값 $k$개만 남긴 근사가 왜 좋은 근사인지 설명하고, 이것이 주성분 분석과 어떻게 연결되는지 설명하라.",
      answer: md`
$A = \sum_i \sigma_i u_i v_i^\top$에서 큰 특이값 $k$개의 항만 남긴 $A_k$는 랭크가 $k$인 모든 행렬 중 $A$와의 프로베니우스 노름 거리가 가장 작다(에카르트–영 정리). 오차는 $\sqrt{\sigma_{k+1}^2 + \cdots}$이므로 버린 특이값이 작을수록 근사가 정확하다.

평균을 뺀 데이터 행렬 $X$를 $X = U\Sigma V^\top$로 분해하면 $V$의 열이 공분산행렬 $X^\top X / (n-1)$의 고유벡터이고, 그 방향의 분산은 $\sigma_i^2 / (n-1)$이다. 따라서 큰 특이값 $k$개를 남기는 것은 분산이 큰 주성분 $k$개를 남기는 것과 같다.
`,
      keyPoints: ["큰 특이값 k개를 남긴 근사가 랭크 k인 행렬 중 가장 가깝다(에카르트–영)", "오차는 버린 특이값의 제곱합의 제곱근", "$V$의 열 = 공분산행렬의 고유벡터 = 주성분 방향, 그 방향의 분산은 $\\sigma_i^2 / (n - 1)$"],
    },
  ],
  references: [
    { title: "3Blue1Brown — Eigenvectors and eigenvalues", url: "https://www.3blue1brown.com/lessons/eigenvalues", note: "고유벡터와 고유값의 기하학적 의미 (영문)" },
    { title: "CS229 Linear Algebra Review", url: "https://cs229.stanford.edu/section/cs229-linalg.pdf", note: "랭크·노름·고유값 분해·대칭행렬 정리 (영문)" },
  ],
});
