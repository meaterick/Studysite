import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/linear-maps-basis";

export default defineLesson({
  id: "linear-maps-basis",
  title: "선형변환, 선형독립, 기저, 차원",
  tier: "core",
  concepts: ["linear-maps-basis"],
  goal: "선형변환의 두 성질과 행렬의 열이 기저 벡터의 상이라는 사실을 설명하고, 선형독립·기저·차원으로 좌표를 구하며, 행렬식으로 역행렬이 있는지 판단한다.",
  why: "신경망의 각 층은 선형변환 뒤에 비선형 함수를 적용한 것이고([[lesson:perceptron-mlp]]), 차원 축소(PCA)는 데이터를 표현하기 좋은 새 기저를 찾는 일이다([[lesson:kmeans-pca-pipeline]]). 역행렬이 없는 변환은 정보를 잃는데, 이 판단은 [[lesson:rank-eigen]]의 랭크와 고유값으로 이어진다.",
  body: md`
### 선형변환

함수 $T: \mathbb{R}^n \to \mathbb{R}^m$이 다음 두 성질을 만족하면 **선형변환(linear transformation)**이라고 한다.

\`\`\`math
T(u + v) = T(u) + T(v), \qquad T(c\,u) = c\,T(u)
\`\`\`

즉 선형결합을 보존한다([[lesson:vector-operations]]). $m \times n$ 행렬 $A$로 정한 $T(x) = Ax$는 언제나 선형변환이고, 반대로 $\mathbb{R}^n$에서 $\mathbb{R}^m$으로 가는 선형변환은 모두 어떤 행렬의 곱으로 나타낼 수 있다. 편향을 더하는 $Ax + b$($b \ne 0$)는 $T(0) = b \ne 0$이라 선형변환이 아니다(아핀 변환이라고 한다).

행렬이 어떤 변환인지는 **열**을 보면 알 수 있다. 표준기저 $e_1 = [1, 0]$, $e_2 = [0, 1]$을 곱하면 $Ae_1$은 $A$의 첫째 열, $Ae_2$는 둘째 열이다. 그리고 모든 벡터는 $x = x_1 e_1 + x_2 e_2$이므로 선형성에 의해

\`\`\`math
Ax = x_1 (Ae_1) + x_2 (Ae_2) = x_1 \cdot (\text{1열}) + x_2 \cdot (\text{2열})
\`\`\`

이다. **행렬은 기저 벡터를 어디로 보내는지로 완전히 정해진다.** $A = \begin{bmatrix}2 & 1\\1 & 2\end{bmatrix}$이면 $e_1 \to [2, 1]$, $e_2 \to [1, 2]$이고, $[3, -1]$은 $3[2, 1] - 1[1, 2] = [5, 1]$로 간다. 행렬 $\begin{bmatrix}0 & -1\\1 & 0\end{bmatrix}$은 $e_1 \to [0, 1]$, $e_2 \to [-1, 0]$이므로 평면을 반시계 방향으로 90° 돌리는 변환이다.

\`\`\`python
import numpy as np

A = np.array([[2, 1], [1, 2]])
e1, e2 = np.array([1, 0]), np.array([0, 1])
print(A @ e1, A @ e2)                         # [2 1] [1 2]: 각각 A의 1열, 2열
x = np.array([3, -1])
print(A @ x, 3 * (A @ e1) - 1 * (A @ e2))     # [5 1] [5 1]: 열의 선형결합과 같다
R = np.array([[0, -1], [1, 0]])
print(R @ np.array([2, 1]))                   # [-1  2]: 90° 회전
\`\`\`

### 선형독립

벡터들 중 어느 것도 나머지 벡터들의 선형결합으로 나타낼 수 없으면 **선형독립(linearly independent)**, 그렇지 않으면 **선형종속(linearly dependent)**이라고 한다. $[1, 2]$와 $[2, 4]$는 $[2, 4] = 2[1, 2]$이므로 선형종속이다. 같은 방향의 벡터를 길이만 다르게 두 번 쓴 것이라 새로운 방향을 더하지 않는다. $[1, 0]$과 $[0, 1]$은 어느 쪽도 다른 쪽의 배수가 아니므로 선형독립이다. 같은 정보를 담은 특성이 여러 개 있으면(예: 섭씨와 화씨 온도를 모두 특성으로 넣음) 특성 벡터들이 선형종속이 되어, 선형 모델의 가중치가 하나로 정해지지 않는다.

### 기저, 좌표, 차원

어떤 공간의 **기저(basis)**는 그 공간의 모든 벡터를 선형결합으로 나타낼 수 있는, 선형독립인 벡터들의 집합이다. 기저의 벡터 개수를 그 공간의 **차원(dimension)**이라고 한다. 평면 $\mathbb{R}^2$의 차원은 2이고, 가장 익숙한 기저는 표준기저 $e_1$, $e_2$다. 벡터 $[x, y] = x e_1 + y e_2$에서 계수 $(x, y)$가 흔히 쓰는 좌표다.

기저는 표준기저만 있는 것이 아니다. $b_1 = [1, 1]$, $b_2 = [1, -1]$도 선형독립이므로 $\mathbb{R}^2$의 기저다. 벡터 $[3, 1]$을 이 기저로 나타내려면 $c_1 b_1 + c_2 b_2 = [3, 1]$, 즉 $c_1 + c_2 = 3$, $c_1 - c_2 = 1$을 풀어 $c_1 = 2$, $c_2 = 1$을 얻는다. 같은 벡터가 표준기저로는 좌표 $(3, 1)$이고 기저 $\{b_1, b_2\}$로는 좌표 $(2, 1)$이다. 벡터는 그대로이고 기준으로 삼는 벡터가 달라져 좌표가 달라진 것이다. 데이터를 분산이 큰 방향들로 이루어진 새 기저의 좌표로 바꾸는 것이 주성분 분석(PCA)이다([[lesson:kmeans-pca-pipeline]]).

[[diagram:basis-change]]

\`\`\`python
B = np.array([[1, 1],
              [1, -1]])                       # 열이 b1, b2
print(np.linalg.solve(B, np.array([3, 1])))   # [2. 1.]: B c = v를 푼 좌표
\`\`\`

### 역행렬과 행렬식

정사각행렬 $A$에 대해 $AA^{-1} = A^{-1}A = I$인 행렬 $A^{-1}$을 **역행렬**이라고 한다. $A$가 한 변환을 정확히 되돌리는 변환이다. $2 \times 2$ 행렬 $\begin{bmatrix}a & b\\c & d\end{bmatrix}$의 **행렬식(determinant)**은 $ad - bc$이고, 이 값이 0이 아닐 때만 역행렬이 있다.

\`\`\`math
\begin{bmatrix}a & b\\c & d\end{bmatrix}^{-1} = \frac{1}{ad - bc}\begin{bmatrix}d & -b\\-c & a\end{bmatrix}
\`\`\`

$A = \begin{bmatrix}1 & 2\\0 & 1\end{bmatrix}$은 행렬식이 1이고, 역행렬은 $\begin{bmatrix}1 & -2\\0 & 1\end{bmatrix}$이다. "둘째 성분의 2배를 첫째 성분에 더하는" 변환을 "둘째 성분의 2배를 첫째 성분에서 빼는" 변환으로 되돌린다.

행렬식이 0인 $\begin{bmatrix}1 & 2\\2 & 4\end{bmatrix}$는 두 열이 선형종속이라, 모든 벡터를 직선 하나($[1, 2]$ 방향) 위로 보낸다. 예를 들어 $[1, 1]$과 $[3, 0]$이 모두 $[3, 6]$으로 간다. 서로 다른 입력이 같은 출력이 되므로 출력에서 입력을 되찾을 수 없고, 그래서 역행렬이 없다. 변환의 결과가 놓이는 공간의 차원(이 경우 1)을 행렬의 **랭크(rank)**라고 한다([[lesson:rank-eigen]]).

[[diagram:inverse-singular]]

\`\`\`python
A = np.array([[1, 2], [0, 1]])
print(np.linalg.det(A), np.linalg.inv(A))    # 1.0 [[ 1. -2.] [ 0.  1.]]
S = np.array([[1, 2], [2, 4]])
print(round(np.linalg.det(S), 10), np.linalg.matrix_rank(S))   # 0.0 1
print(S @ np.array([1, 1]), S @ np.array([3, 0]))              # [3 6] [3 6]: 다른 입력, 같은 출력
\`\`\`

:::warn 흔한 실수
- **$Ax + b$를 선형변환으로 부른다.** $b \ne 0$이면 원점이 원점으로 가지 않으므로 선형변환이 아니다.
- **행렬의 행을 기저 벡터의 상으로 읽는다.** $Ae_j$는 $j$번째 **열**이다.
- **행렬식이 0에 가까운 행렬의 역행렬을 그대로 쓴다.** 계산 오차가 크게 불어난다. 연립방정식은 역행렬을 구하지 말고 \`np.linalg.solve\`로 푼다.
- **선형종속인 특성을 그대로 넣는다.** 가중치가 하나로 정해지지 않아 선형 모델이 불안정해진다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "기저 $b_1 = [1, 1]$, $b_2 = [1, -1]$로 벡터 $[5, 1]$을 나타낸 좌표 $(c_1, c_2)$는?",
      choices: ["$(5, 1)$", "$(3, 2)$", "$(2, 3)$", "$(4, 1)$"],
      answer: 1,
      explanation: "$c_1 + c_2 = 5$, $c_1 - c_2 = 1$을 풀면 $c_1 = 3$, $c_2 = 2$. 검산: $3[1,1] + 2[1,-1] = [5, 1]$.",
    },
    {
      key: "c2",
      question: "다음 중 $\\mathbb{R}^2$의 기저가 **될 수 없는** 벡터 쌍은?",
      choices: ["$[1, 0], [0, 1]$", "$[1, 1], [1, -1]$", "$[1, 2], [2, 4]$", "$[2, 0], [1, 3]$"],
      answer: 2,
      explanation: "$[2,4] = 2[1,2]$이므로 두 벡터가 선형종속이다. 같은 직선 위의 벡터만으로는 평면 전체를 표현할 수 없다.",
    },
    {
      key: "c3",
      question: "다음 중 선형변환이 **아닌** 것은?",
      choices: ["$T(x) = 3x$", "$T(x) = Ax$", "$T(x) = Ax + b$ ($b \\ne 0$)", "$T(x) = 0$"],
      answer: 2,
      explanation: "선형변환은 $T(0) = 0$이어야 한다. $Ax + b$는 $T(0) = b \\ne 0$이라 선형변환이 아니다(아핀 변환). 영변환 $T(x) = 0$은 두 성질을 만족한다.",
    },
    {
      key: "c4",
      question: "$A = \\begin{bmatrix}2 & 1\\\\ 1 & 2\\end{bmatrix}$에서 $Ae_2$($e_2 = [0, 1]$)는?",
      choices: ["$[1, 2]$", "$[2, 1]$", "$[0, 1]$", "$[3, 3]$"],
      answer: 0,
      explanation: "$Ae_j$는 $A$의 $j$번째 열이다. 둘째 열은 $[1, 2]$다.",
    },
    {
      key: "c5",
      question: "$\\begin{bmatrix}1 & 2\\\\ 2 & 4\\end{bmatrix}$에 역행렬이 없는 이유로 알맞은 것은?",
      choices: [
        "행렬식이 $1 \\cdot 4 - 2 \\cdot 2 = 0$이고, 두 열이 선형종속이라 서로 다른 입력이 같은 출력으로 가기 때문이다",
        "원소에 같은 수가 두 번 나오기 때문이다",
        "대칭행렬이기 때문이다",
        "모든 원소가 양수이기 때문이다",
      ],
      answer: 0,
      explanation: "행렬식이 0이면 변환이 평면을 직선으로 보내 정보를 잃는다. 예를 들어 $[1, 1]$과 $[3, 0]$이 모두 $[3, 6]$으로 가므로 출력에서 입력을 되찾을 수 없다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
A = np.array([[0, -1], [1, 0]])
print(A @ np.array([1, 0]), A @ np.array([0, 1]))
print(A @ A @ np.array([1, 0]), round(np.linalg.det(A)))
`,
      expected: "[0 1] [-1  0]\n[-1  0] 1",
      explanation: "$Ae_1$, $Ae_2$는 $A$의 첫째·둘째 열이다. 이 행렬은 90° 회전이므로 두 번 적용하면 180° 회전이 되어 $[1, 0]$이 $[-1, 0]$으로 간다. 행렬식은 $0 \\cdot 0 - (-1) \\cdot 1 = 1$이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "기저(basis)를 정의하고, 기저를 정하면 각 벡터의 좌표가 하나로 정해지는 이유를 설명하라. $b_1=[1,1]$, $b_2=[1,-1]$을 기저로 쓸 때 벡터 $[3,1]$의 좌표는?",
      answer: md`
기저는 공간의 모든 벡터를 선형결합으로 나타낼 수 있는 선형독립인 벡터들의 집합이다. 선형독립이므로 한 벡터를 나타내는 계수가 하나로 정해지고, 그 계수가 그 기저에 대한 좌표가 된다. 그래서 기저를 바꾸면 같은 벡터의 좌표가 달라진다. $b_1=[1,1]$, $b_2=[1,-1]$일 때 $[3,1] = c_1 b_1 + c_2 b_2$, 즉 $c_1 + c_2 = 3$, $c_1 - c_2 = 1$을 풀면 $c_1=2$, $c_2=1$이므로 좌표는 $(2,1)$이다. 검산: $2[1,1] + 1[1,-1] = [3,1]$.
`,
      keyPoints: ["기저: 공간 전체를 생성하는 선형독립인 벡터들", "선형독립이라 계수(좌표)가 하나로 정해진다", "연립방정식을 풀어 좌표 (2, 1)을 구한다"],
    },
  ],
  references: [
    { title: "3Blue1Brown — Linear transformations and matrices", url: "https://www.3blue1brown.com/lessons/linear-transformations", note: "행렬의 열 = 기저 벡터가 가는 곳 (영문)" },
    { title: "3Blue1Brown — Linear combinations, span, and basis vectors", url: "https://www.3blue1brown.com/lessons/span", note: "선형결합, 생성, 기저 (영문)" },
  ],
});
