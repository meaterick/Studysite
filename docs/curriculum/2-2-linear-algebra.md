<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 2-2 벡터와 행렬

[전체 목차](README.md) · 트랙 2 수학 기초 · [모듈 원본](../../src/content/modules/linear-algebra/index.ts)

스칼라·벡터·행렬·텐서, 벡터 연산, 내적과 유사도, 행렬곱, 선형변환과 기저

## 목표 문제

영화 다섯 편에 대한 세 사람의 평점을 벡터로 나타내고, 코사인 유사도로 취향이 가장 비슷한 두 사람을 찾는다. 특성 4개짜리 샘플 100개를 $100 \times 4$ 행렬 $X$로 쌓고, 출력 3개인 층 $XW + b$($W$: $4 \times 3$)의 출력 모양과 값을 행렬곱 한 번으로 계산한다. 행렬의 열을 보고 그 행렬이 평면을 어떻게 바꾸는지 읽고, 행렬식이 0인 행렬이 왜 입력을 되찾을 수 없게 만드는지 설명한다.

## 학습 목표

- 스칼라·벡터·행렬·텐서를 차원 수와 모양으로 구분하고, 표·이미지·문장 데이터를 알맞은 모양의 배열로 나타낸다.
- 벡터의 덧셈·스칼라곱·선형결합을 성분별로 계산하고, 내적·길이·거리·코사인 유사도를 구해 두 벡터의 비슷함을 비교한다.
- 행렬-벡터 곱과 행렬곱을 내적으로 계산하고, 모양 규칙과 전치 규칙을 적용해 신경망 한 층의 계산을 샘플 묶음에 대해 쓴다.
- 행렬의 열을 기저 벡터의 상으로 읽고, 선형독립·기저·좌표를 구하며, 행렬식으로 역행렬이 있는지 판단한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [스칼라, 벡터, 행렬, 텐서](#lesson-scalars-tensors) | 핵심 | 35분 | #20 스칼라, 벡터, 행렬, 텐서 |
| 2 | [벡터의 덧셈, 스칼라곱, 선형결합](#lesson-vector-operations) | 핵심 | 35분 | #21 벡터의 덧셈, 스칼라곱, 선형결합 |
| 3 | [내적, 길이, 거리, 코사인 유사도](#lesson-dot-product) | 핵심 | 40분 | #22 내적, 벡터의 길이, 거리, 코사인 유사도 |
| 4 | [행렬의 형태, 전치, 행렬곱](#lesson-matrix-multiplication) | 핵심 | 45분 | #23 행렬의 형태, 전치, 행렬곱 |
| 5 | [선형변환, 선형독립, 기저, 차원](#lesson-linear-maps-basis) | 핵심 | 40분 | #24 선형변환, 선형독립, 기저, 차원 |
| 6 | [랭크·노름·고유값·특이값 분해](#lesson-rank-eigen) | 심화 | 45분 | — |

## 핵심 레슨

<a id="lesson-scalars-tensors"></a>

### 1. 스칼라, 벡터, 행렬, 텐서

핵심 · 35분 · [본문 원본](../../src/content/modules/linear-algebra/scalars-tensors.ts) · [실습 원본](../../src/content/modules/linear-algebra/labs/scalars-tensors.ts)

**학습 목표:** 스칼라·벡터·행렬·텐서를 차원 수와 모양(shape)으로 구분하고, 표·이미지·문장 데이터를 알맞은 모양의 배열로 나타내며 원소와 축을 읽는다.

**쓰이는 곳:** 모델은 모든 데이터를 숫자 배열로 받는다. 표 데이터는 행렬, 컬러 이미지 묶음은 4차원 텐서, 문장 묶음은 (문장 수, 토큰 수, 임베딩 차원) 텐서다. 배열의 모양을 정확히 읽어야 [2-2 행렬의 형태, 전치, 행렬곱](#lesson-matrix-multiplication)의 모양 규칙과 [3-1 NumPy 배열, 축, 형태, 자료형](3-1-numpy.md#lesson-numpy-arrays)의 배열 연산, 신경망 층의 입력·출력 크기를 맞출 수 있다.

**본문 절:** 수를 담는 네 가지 형태 · 모양과 축 · 데이터를 배열로 나타내기 · 모양 바꾸기와 전치

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3

**실습**

- `ex1` 중첩 리스트의 모양, 전치, 펼치기

**서술형**

- `d1` $32 \times 32$ 컬러 이미지 64장을 하나의 텐서로 나타낼 때의 모양을 쓰고, 각 축이 무엇을 뜻하는지 설명하라. 이 이미지들을 완전연결 층에 넣으려면 어떤 모양으로 바꿔야 하는지도 써라.

**참고 자료**

- [Mathematics for Machine Learning (무료 PDF)](https://mml-book.github.io/) — 2장 선형대수: 벡터와 행렬의 정의 (영문)
- [NumPy — Array shape and dimensions](https://numpy.org/doc/stable/user/absolute_beginners.html#how-do-you-know-the-shape-and-size-of-an-array) — ndim, shape, size, reshape (영문)

<a id="lesson-vector-operations"></a>

### 2. 벡터의 덧셈, 스칼라곱, 선형결합

핵심 · 35분 · [본문 원본](../../src/content/modules/linear-algebra/vector-operations.ts) · [실습 원본](../../src/content/modules/linear-algebra/labs/vector-operations.ts)

**학습 목표:** 벡터의 덧셈·뺄셈·스칼라곱을 성분별로 계산하고 좌표평면에서 해석하며, 선형결합으로 평균 벡터·보간·방향 이동을 표현한다.

**쓰이는 곳:** 경사하강법의 갱신 $\theta \leftarrow \theta - \eta \nabla L$은 벡터의 스칼라곱과 뺄셈이고([2-3 최솟값과 경사하강법](2-3-calculus-optimization.md#lesson-gradient-descent)), 문장 임베딩은 단어 벡터의 평균(선형결합)으로 만들기도 한다. 어텐션의 출력도 값 벡터들의 가중 합이다([6-1 셀프 어텐션: 쿼리·키·값](6-1-transformers.md#lesson-self-attention)).

**본문 절:** 벡터의 덧셈과 뺄셈 · 스칼라곱 · 선형결합 · 갱신식과 방향 이동

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3 · 그림 1

**실습**

- `ex1` 선형결합과 평균 벡터

**서술형**

- `d1` 선형결합의 정의를 쓰고, 머신러닝에서 선형결합이 쓰이는 예를 두 가지 들어 각각의 계수가 무엇인지 설명하라.

**참고 자료**

- [3Blue1Brown — Vectors, what even are they?](https://www.3blue1brown.com/lessons/vectors) — 벡터의 덧셈과 스칼라곱을 그림으로 (영문)
- [3Blue1Brown — Linear combinations, span, and basis vectors](https://www.3blue1brown.com/lessons/span) — 선형결합과 생성 (영문)

<a id="lesson-dot-product"></a>

### 3. 내적, 길이, 거리, 코사인 유사도

핵심 · 40분 · [본문 원본](../../src/content/modules/linear-algebra/dot-product.ts) · [실습 원본](../../src/content/modules/linear-algebra/labs/dot-product.ts)

**학습 목표:** 내적·노름·거리·코사인 유사도를 손으로 계산하고, 코사인 유사도가 벡터의 크기와 관계없이 방향의 비슷함만 재는 이유를 설명한다.

**쓰이는 곳:** 검색 시스템은 질문과 문서를 벡터로 바꾼 뒤 코사인 유사도가 큰 문서를 고르고([6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval)), 어텐션은 쿼리와 키의 내적으로 어떤 토큰을 참고할지 정한다([6-1 셀프 어텐션: 쿼리·키·값](6-1-transformers.md#lesson-self-attention)). 신경망 한 층의 계산도 가중치 벡터와 입력 벡터의 내적을 여러 번 한 것이다([2-2 행렬의 형태, 전치, 행렬곱](#lesson-matrix-multiplication)).

**본문 절:** 내적 · 길이(노름)와 거리 · 코사인 유사도 · 정규화한 벡터의 내적

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 2

**실습**

- `ex1` NumPy 없이 내적과 코사인 유사도

**서술형**

- `d1` $a=[1,2]$, $b=[2,1]$의 내적과 코사인 유사도는?
- `d2` 검색 시스템이 문서 유사도에 내적 대신 코사인 유사도를 쓰는 이유를 "긴 문서와 짧은 문서" 관점에서 설명하라. $b$를 10배 하면 내적과 코사인 유사도가 각각 어떻게 되는지를 근거로 든다.

**참고 자료**

- [3Blue1Brown — Dot products and duality](https://www.3blue1brown.com/lessons/dot-products) — 내적의 기하학적 의미(투영) (영문)
- [Mathematics for Machine Learning (무료 PDF)](https://mml-book.github.io/) — 3장 해석기하: 내적·노름·각도의 정의 (영문)

<a id="lesson-matrix-multiplication"></a>

### 4. 행렬의 형태, 전치, 행렬곱

핵심 · 45분 · [본문 원본](../../src/content/modules/linear-algebra/matrix-multiplication.ts) · [실습 원본](../../src/content/modules/linear-algebra/labs/matrix-multiplication.ts)

**학습 목표:** 행렬-벡터 곱을 행마다 내적으로, 행렬곱을 행과 열의 내적으로 계산하고, 모양 규칙·곱의 순서·전치의 곱 규칙을 적용해 신경망 한 층의 계산을 샘플 묶음에 대해 쓴다.

**쓰이는 곳:** 신경망의 완전연결 층은 입력 묶음 $X$와 가중치 $W$의 행렬곱 $XW + b$이고([5-1 퍼셉트론, 다층 신경망, 활성화 함수](5-1-neural-networks.md#lesson-perceptron-mlp)), 트랜스포머의 어텐션 점수도 행렬곱 $QK^\top$이다([6-1 셀프 어텐션: 쿼리·키·값](6-1-transformers.md#lesson-self-attention)). 역전파에서 기울기의 모양을 맞출 때는 전치의 곱 규칙을 쓴다([5-1 순전파, 역전파, 계산 그래프](5-1-neural-networks.md#lesson-backprop)).

**본문 절:** 행렬-벡터 곱: 행마다 내적 · 행렬곱 · 곱하는 순서가 결과를 바꾼다 · 전치와 곱 · 샘플 묶음을 한 번에 계산하기 · 항등행렬

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 4 · 그림 3

**실습**

- `ex1` 행렬곱, 전치, 샘플 묶음에 대한 신경망 한 층

**서술형**

- `d1` 행렬-벡터 곱 $Wx$를 "행마다 내적"으로 설명하고, $W$가 $m \times n$일 때 곱할 수 있는 조건과 결과의 모양, 신경망의 한 층에서 각 행이 뜻하는 것을 써라.
- `d2` $A=\begin{bmatrix}1 & 2\\ 0 & 1\end{bmatrix}$, $B=\begin{bmatrix}1 & 0\\ 3 & 1\end{bmatrix}$일 때 $AB$와 $BA$를 직접 계산하고, 두 결과가 다른 이유를 함수의 합성으로 설명하라.

**참고 자료**

- [3Blue1Brown — Matrix multiplication as composition](https://www.3blue1brown.com/lessons/matrix-multiplication) — 행렬곱 = 변환의 합성, 순서가 중요한 이유 (영문)
- [NumPy — matmul](https://numpy.org/doc/stable/reference/generated/numpy.matmul.html) — @ 연산자의 규칙 (영문)

<a id="lesson-linear-maps-basis"></a>

### 5. 선형변환, 선형독립, 기저, 차원

핵심 · 40분 · [본문 원본](../../src/content/modules/linear-algebra/linear-maps-basis.ts) · [실습 원본](../../src/content/modules/linear-algebra/labs/linear-maps-basis.ts)

**학습 목표:** 선형변환의 두 성질과 행렬의 열이 기저 벡터의 상이라는 사실을 설명하고, 선형독립·기저·차원으로 좌표를 구하며, 행렬식으로 역행렬이 있는지 판단한다.

**쓰이는 곳:** 신경망의 각 층은 선형변환 뒤에 비선형 함수를 적용한 것이고([5-1 퍼셉트론, 다층 신경망, 활성화 함수](5-1-neural-networks.md#lesson-perceptron-mlp)), 차원 축소(PCA)는 데이터를 표현하기 좋은 새 기저를 찾는 일이다([4-4 K-means, PCA, 머신러닝 파이프라인](4-4-ml-algorithms.md#lesson-kmeans-pca-pipeline)). 역행렬이 없는 변환은 정보를 잃는데, 이 판단은 [2-2 랭크·노름·고유값·특이값 분해](#lesson-rank-eigen)의 랭크와 고유값으로 이어진다.

**본문 절:** 선형변환 · 선형독립 · 기저, 좌표, 차원 · 역행렬과 행렬식

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3 · 그림 2

**실습**

- `ex1` 기저 좌표와 2×2 역행렬 직접 계산하기

**서술형**

- `d1` 기저(basis)를 정의하고, 기저를 정하면 각 벡터의 좌표가 하나로 정해지는 이유를 설명하라. $b_1=[1,1]$, $b_2=[1,-1]$을 기저로 쓸 때 벡터 $[3,1]$의 좌표는?

**참고 자료**

- [3Blue1Brown — Linear transformations and matrices](https://www.3blue1brown.com/lessons/linear-transformations) — 행렬의 열 = 기저 벡터가 가는 곳 (영문)
- [3Blue1Brown — Linear combinations, span, and basis vectors](https://www.3blue1brown.com/lessons/span) — 선형결합, 생성, 기저 (영문)

## 심화 레슨

<a id="lesson-rank-eigen"></a>

### 6. 랭크·노름·고유값·특이값 분해

심화 · 45분 · [본문 원본](../../src/content/modules/linear-algebra/rank-eigen.ts) · [실습 원본](../../src/content/modules/linear-algebra/labs/rank-eigen.ts)

**학습 목표:** 행렬의 랭크와 벡터의 L1·L2 노름을 계산하고, 특성방정식으로 $2 \times 2$ 행렬의 고유값·고유벡터를 구하며, 특이값 분해로 저랭크 근사를 만들고 그 오차를 설명한다.

**쓰이는 곳:** L1·L2 노름은 정규화([4-3 L1·L2 규제, 조기 종료, 학습 곡선](4-3-generalization.md#lesson-regularization))와 거리 계산에 쓰인다. 고유값은 경사하강법의 학습률 한계를 정하고([2-3 경사하강법의 수렴 조건과 조건수](2-3-calculus-optimization.md#lesson-gd-convergence)), 특이값 분해는 주성분 분석([4-4 K-means, PCA, 머신러닝 파이프라인](4-4-ml-algorithms.md#lesson-kmeans-pca-pipeline))과 언어 모델 미세조정 기법 LoRA([6-2 지시 미세조정과 LoRA](6-2-llm-training.md#lesson-instruction-tuning))의 바탕이다.

**본문 절:** 랭크 · 노름 · 고유값과 고유벡터 · 특이값 분해 · 저랭크 근사

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 3 · 실습 1 · 코드 셀 1 · 그림 4 · 이미지 1

**실습**

- `ex1` 거듭제곱법과 저랭크 근사(에카르트-영 정리)

**서술형**

- `d1` $A = \begin{bmatrix}1 & 2\\ 2 & 4\end{bmatrix}$의 랭크를 구하고, 랭크가 2보다 작다는 사실이 역행렬과 어떤 관계인지 설명하라.
- `d2` $A = \begin{bmatrix}3 & 1\\ 0 & 2\end{bmatrix}$의 고유값과 각 고유값의 고유벡터를 특성방정식으로 구하고, 대각합과 행렬식으로 검산하라.
- `d3` 특이값 분해에서 큰 특이값 $k$개만 남긴 근사가 왜 좋은 근사인지 설명하고, 이것이 주성분 분석과 어떻게 연결되는지 설명하라.

**참고 자료**

- [3Blue1Brown — Eigenvectors and eigenvalues](https://www.3blue1brown.com/lessons/eigenvalues) — 고유벡터와 고유값의 기하학적 의미 (영문)
- [CS229 Linear Algebra Review](https://cs229.stanford.edu/section/cs229-linalg.pdf) — 랭크·노름·고유값 분해·대칭행렬 정리 (영문)

## 백지 복습

1. 모양이 $(16, 28, 28, 3)$인 컬러 이미지 묶음 텐서에서 각 축이 무엇을 뜻하는지 쓰고, 원소 개수와 이미지 한 장을 벡터로 펼쳤을 때의 길이를 계산하라.
2. 내적과 코사인 유사도의 정의를 쓰고, $a = [1, 2]$, $b = [2, 1]$의 코사인 유사도를 계산하라. $b$를 10배로 늘려도 코사인 유사도가 변하지 않는 이유를 설명하라.
3. $(m \times n)$ 행렬과 $(n \times p)$ 행렬의 곱의 모양과 $(i, j)$ 원소의 식을 쓰고, $AB \ne BA$인 예와 $(AB)^\top$을 전치로 나타낸 식을 쓰라.
4. 샘플 묶음 $X$($n \times d$)에 출력 $k$개인 층 $XW + b$를 적용할 때 $W$와 $b$의 모양과 결과의 모양을 쓰라.
5. 선형변환의 두 성질을 쓰고, $Ae_1$이 $A$의 무엇인지 설명하라. 행렬식이 0인 $2 \times 2$ 행렬의 예를 들고 역행렬이 없는 이유를 설명하라.
