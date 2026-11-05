<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 3-1 NumPy 배열

[전체 목차](README.md) · 트랙 3 데이터 처리 기초 · [모듈 원본](../../src/content/modules/numpy/index.ts)

배열의 축·형태·자료형, 인덱싱과 브로드캐스팅, 벡터화와 난수 시드

## 목표 문제

학생 수백 명의 과목별 점수가 담긴 배열에서 과목별 평균과 학생별 순위를 반복문 없이 계산하고, 기준을 넘는 학생만 골라낸다. 점 수천 개 사이의 모든 거리를 배열 연산 한 번으로 구해 가장 가까운 점을 찾고, 같은 시드로 학습용·평가용 데이터를 항상 같게 나눈다.

## 학습 목표

- NumPy 배열을 만들고 자료형을 확인·변환하며, 원소별 연산과 축을 지정한 집계의 결과와 모양을 예측한다.
- 인덱싱·슬라이싱·불리언 마스킹·정수 배열로 원소를 고르고, 뷰와 복사본을 구분한다.
- 브로드캐스팅 규칙으로 모양이 다른 배열의 연산 결과를 예측하고, (n, 1)과 (n,)을 섞는 버그를 찾는다.
- 반복문을 배열 연산으로 바꾸고, 난수 생성기와 시드로 무작위 과정을 재현한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [NumPy 배열, 축, 형태, 자료형](#lesson-numpy-arrays) | 핵심 | 45분 | #39 NumPy 배열, 축, 형태, 자료형 |
| 2 | [인덱싱, 불리언 마스킹, 브로드캐스팅](#lesson-array-indexing) | 핵심 | 45분 | #40 배열 인덱싱, 불리언 마스킹, 브로드캐스팅 |
| 3 | [벡터화 연산과 난수 시드](#lesson-vectorization) | 핵심 | 35분 | #41 벡터화 연산과 난수 시드 |

## 핵심 레슨

<a id="lesson-numpy-arrays"></a>

### 1. NumPy 배열, 축, 형태, 자료형

핵심 · 45분 · [본문 원본](../../src/content/modules/numpy/numpy-arrays.ts) · [실습 원본](../../src/content/modules/numpy/labs/numpy-arrays.ts)

**학습 목표:** NumPy 배열을 만들고 자료형(dtype)을 확인·변환하며, 원소별 연산과 축(axis)을 지정한 집계의 결과와 그 모양을 실행 전에 예측한다.

**쓰이는 곳:** 머신러닝 라이브러리는 데이터와 파라미터를 모두 NumPy 배열이나 같은 규칙을 따르는 텐서로 다룬다([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch)). pandas의 열도 내부적으로 NumPy 배열이고([3-2 pandas의 Series와 DataFrame](3-2-pandas.md#lesson-dataframes)), 배열의 자료형은 메모리 사용량과 계산 정밀도를 정한다.

**본문 절:** 리스트 대신 배열을 쓰는 이유 · 배열 만들기 · 자료형 · 원소별 연산 · 축을 따라 집계하기 · 1차원 배열과 2차원 배열을 구분하기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 5 · 그림 2

**실습**

- `ex1` 점수표를 축별로 요약하기

**서술형**

- `d1` 모양이 `(100, 4)`인 배열 `X`(샘플 100개, 특성 4개)에서 `X.mean(axis=0)`과 `X.mean(axis=1)`이 각각 무엇을 계산하는지, 결과의 모양과 함께 설명하라. 특성마다 평균을 빼려면 어느 쪽을 써야 하는지도 쓰라.

**참고 자료**

- [NumPy — the absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) — 배열 생성, 자료형, 축 연산 공식 입문서 (영문)
- [NumPy — Data types](https://numpy.org/doc/stable/user/basics.types.html) — dtype의 종류와 변환 (영문)

<a id="lesson-array-indexing"></a>

### 2. 인덱싱, 불리언 마스킹, 브로드캐스팅

핵심 · 45분 · [본문 원본](../../src/content/modules/numpy/array-indexing.ts) · [실습 원본](../../src/content/modules/numpy/labs/array-indexing.ts)

**학습 목표:** 2차원 배열에서 행·열·부분 배열을 인덱싱하고 뷰와 복사본을 구분하며, 불리언 마스크와 정수 배열로 원소를 고르고, 브로드캐스팅 규칙으로 모양이 다른 배열의 연산 결과를 예측한다.

**쓰이는 곳:** 조건에 맞는 샘플만 고르는 필터링, 정답 클래스의 확률을 꺼내는 교차엔트로피 계산([2-6 가능도, 최대가능도추정, 엔트로피, 교차엔트로피](2-6-inference-information.md#lesson-likelihood-entropy)), 특성마다 평균을 빼는 표준화([3-3 범주형 인코딩, 표준화, 정규화](3-3-data-preparation.md#lesson-encoding-scaling))는 모두 이 레슨의 인덱싱과 브로드캐스팅으로 쓴다. 모양을 잘못 맞춘 브로드캐스팅은 오류 없이 틀린 손실을 만드는 흔한 버그다([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch)).

**본문 절:** 2차원 배열의 인덱싱과 슬라이싱 · 뷰와 복사본 · 불리언 마스킹 · 정수 배열로 고르기 · 브로드캐스팅

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 6 · 그림 1

**실습**

- `ex1` 마스킹·정수 배열 인덱싱·브로드캐스팅으로 데이터 다루기

**서술형**

- `d1` 브로드캐스팅의 규칙을 쓰고, 모양 `(n, 1)`인 예측과 모양 `(n,)`인 정답으로 평균제곱오차를 계산할 때 생기는 문제와 해결 방법을 설명하라.

**참고 자료**

- [NumPy — Indexing on ndarrays](https://numpy.org/doc/stable/user/basics.indexing.html) — 슬라이싱, 불리언 마스킹, 정수 배열 인덱싱과 뷰·복사본 (영문)
- [NumPy — Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html) — 브로드캐스팅 규칙과 그림 (영문)

<a id="lesson-vectorization"></a>

### 3. 벡터화 연산과 난수 시드

핵심 · 35분 · [본문 원본](../../src/content/modules/numpy/vectorization.ts) · [실습 원본](../../src/content/modules/numpy/labs/vectorization.ts)

**학습 목표:** 파이썬 반복문으로 쓴 계산을 배열 연산으로 바꾸고(벡터화) 두 방법의 속도를 비교하며, 브로드캐스팅으로 모든 쌍의 거리를 계산하고, 난수 생성기와 시드로 실험을 재현한다.

**쓰이는 곳:** 신경망 한 층의 계산, 미니배치 전체의 손실, 검색 시스템의 유사도 계산은 모두 샘플마다 반복하지 않고 배열 연산 한 번으로 처리한다([2-2 행렬의 형태, 전치, 행렬곱](2-2-linear-algebra.md#lesson-matrix-multiplication), [6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval)). 데이터 분할·가중치 초기화·미니배치 순서에 쓰는 난수를 시드로 고정해야 실험 결과를 다시 만들고 비교할 수 있다([1-4 Jupyter Notebook과 재현 가능한 실행](1-4-python-objects-tools.md#lesson-notebooks-reproducibility)).

**본문 절:** 반복문과 벡터화 · 반복문을 배열 연산으로 바꾸는 방법 · 난수 생성기와 시드

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3

**실습**

- `ex1` 최근접 이웃 찾기를 벡터화하고 재현 가능한 분할 만들기

**서술형**

- `d1` 머신러닝 실험에서 난수 시드를 고정하는 이유와, 시드를 고정해도 시드 하나의 결과로 두 모델을 비교하면 안 되는 이유를 설명하라. `np.random.seed`보다 `np.random.default_rng`로 만든 생성기를 넘겨 쓰는 방식이 나은 이유도 쓰라.

**참고 자료**

- [NumPy — Random sampling](https://numpy.org/doc/stable/reference/random/index.html) — default_rng와 Generator 사용법, 예전 방식과의 차이 (영문)
- [NumPy — Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html) — 모든 쌍 계산에 쓰는 브로드캐스팅 (영문)

## 백지 복습

1. 모양이 `(n, d)`인 배열에 `sum(axis=0)`과 `sum(axis=1)`을 적용한 결과의 모양과 뜻을 쓰라. `keepdims=True`는 언제 쓰는지도 쓰라.
2. 정수 배열에 실수를 넣을 때와 문자열이 섞인 리스트로 배열을 만들 때 각각 어떤 일이 생기는지 쓰라.
3. 슬라이싱과 불리언 마스킹의 결과가 각각 뷰인지 복사본인지 쓰고, 두 조건을 함께 거는 마스크 식을 쓰라.
4. 브로드캐스팅 규칙 세 가지를 쓰고, `(n, 1)`과 `(n,)`을 빼면 어떤 모양이 되어 왜 위험한지 설명하라.
5. 점 n개와 m개 사이의 모든 거리 제곱을 브로드캐스팅으로 구하는 식을 쓰고, 시드를 고정한 생성기를 반복문 밖에서 한 번만 만들어야 하는 이유를 설명하라.
