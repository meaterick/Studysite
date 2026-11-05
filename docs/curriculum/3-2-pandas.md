<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 3-2 pandas 표 데이터

[전체 목차](README.md) · 트랙 3 데이터 처리 기초 · [모듈 원본](../../src/content/modules/pandas/index.ts)

Series와 DataFrame, 조회·필터링·정렬, 그룹 집계와 결합, 자료 유형

## 목표 문제

쉼표가 든 가격, `-`로 적힌 결측값, 문자열로 읽힌 날짜가 섞인 주문 CSV를 읽어 알맞은 자료형으로 바꾼다. 조건에 맞는 주문만 골라 정렬하고, 고객별 주문 수·구매액 같은 특성을 그룹 집계로 만든 뒤, 고객 정보 표와 행 수가 변하지 않도록 결합한다.

## 학습 목표

- Series와 DataFrame의 구조를 설명하고, info·describe로 표를 확인하며 열 단위 계산으로 새 열을 만든다.
- CSV를 읽으며 결측 표기를 지정하고, loc·iloc·조건식으로 행과 열을 고르고 정렬하며, 고른 행에 값을 안전하게 대입한다.
- groupby·agg·transform으로 그룹 통계를 만들고, merge의 결합 방식과 키 중복을 점검하며, melt·pivot으로 표의 형태를 바꾼다.
- 열의 데이터 유형을 판단하고, 숫자·범주·날짜 자료형으로 변환하며 날짜에서 특성을 꺼낸다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [pandas의 Series와 DataFrame](#lesson-dataframes) | 핵심 | 40분 | #42 pandas의 Series와 DataFrame |
| 2 | [데이터 불러오기, 조회, 필터링, 정렬](#lesson-pandas-selection) | 핵심 | 40분 | #43 데이터 불러오기, 조회, 필터링, 정렬 |
| 3 | [그룹별 집계, 테이블 결합, 형태 변환](#lesson-pandas-aggregation) | 핵심 | 40분 | #44 그룹별 집계, 테이블 결합, 형태 변환 |
| 4 | [수치형·범주형·시계열 데이터](#lesson-data-types) | 핵심 | 35분 | #45 수치형·범주형·시계열 데이터 |

## 핵심 레슨

<a id="lesson-dataframes"></a>

### 1. pandas의 Series와 DataFrame

핵심 · 40분 · [본문 원본](../../src/content/modules/pandas/dataframes.ts) · [실습 원본](../../src/content/modules/pandas/labs/dataframes.ts)

**학습 목표:** Series와 DataFrame의 구조(인덱스·열·값)를 설명하고, 딕셔너리와 리스트로 DataFrame을 만들며, shape·dtypes·info·describe로 표의 구성을 확인하고 열 단위 계산으로 새 열을 만든다.

**쓰이는 곳:** 표 형태의 데이터는 대부분 pandas로 읽고 정리한 뒤 모델에 넣는다([3-3 결측치, 중복값, 이상치, 잘못된 자료형](3-3-data-preparation.md#lesson-data-cleaning)). scikit-learn은 DataFrame을 입력으로 받고([4-1 기준 모델과 단순한 예측 기준](4-1-ml-framing.md#lesson-baselines)), 학습 결과와 실험 기록도 DataFrame으로 모아 비교한다.

**본문 절:** Series: 이름표가 붙은 1차원 배열 · DataFrame: 인덱스를 공유하는 열들의 표 · 처음 받은 표를 확인하기 · 열 단위로 계산해 새 열 만들기 · NumPy 배열과 오가기

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 6

**실습**

- `ex1` 레코드 목록으로 DataFrame을 만들고 열 추가하기

**서술형**

- `d1` Series끼리의 덧셈이 NumPy 배열끼리의 덧셈과 어떻게 다른지 인덱스 정렬로 설명하고, 이 차이 때문에 생길 수 있는 문제와 확인 방법을 쓰라.

**참고 자료**

- [pandas — 10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html) — Series·DataFrame 만들기와 기본 조작 (영문)
- [pandas — Intro to data structures](https://pandas.pydata.org/docs/user_guide/dsintro.html) — 인덱스 정렬과 자료 구조 설명 (영문)

<a id="lesson-pandas-selection"></a>

### 2. 데이터 불러오기, 조회, 필터링, 정렬

핵심 · 40분 · [본문 원본](../../src/content/modules/pandas/pandas-selection.ts) · [실습 원본](../../src/content/modules/pandas/labs/pandas-selection.ts)

**학습 목표:** CSV를 읽으며 결측 표기를 지정하고, loc과 iloc으로 행·열을 고르며, 여러 조건으로 행을 필터링하고 정렬한 뒤, 필터링 결과에 값을 안전하게 대입한다.

**쓰이는 곳:** 학습 데이터를 만들 때는 파일을 읽어 필요한 열만 고르고, 조건에 맞는 샘플만 남기고, 시간 순서로 정렬해 나눈다([4-1 학습·검증·테스트 데이터와 데이터 누수](4-1-ml-framing.md#lesson-data-splits)). 모델이 틀린 샘플만 골라 원인을 살피는 오류 분석도 이 레슨의 필터링으로 한다([4-2 혼동행렬, 정확도, 정밀도, 재현율, F1](4-2-linear-models.md#lesson-classification-metrics)).

**본문 절:** CSV 파일 읽기 · 열 고르기, loc과 iloc · 조건으로 행 고르기 · 정렬 · 고른 행에 값을 대입하기

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 5

**실습**

- `ex1` 주문 데이터를 읽어 조건으로 고르고 정렬하기

**서술형**

- `d1` `loc`과 `iloc`의 차이를 쓰고, 필터링이나 정렬을 한 뒤 두 방법의 결과가 달라지는 이유를 예를 들어 설명하라. 조건에 맞는 행의 값을 바꿀 때 어떤 방식으로 써야 하는지도 쓰라.

**참고 자료**

- [pandas — Indexing and selecting data](https://pandas.pydata.org/docs/user_guide/indexing.html) — loc·iloc·불리언 인덱싱과 대입 (영문)
- [pandas — IO tools: CSV](https://pandas.pydata.org/docs/user_guide/io.html#io-read-csv-table) — read_csv의 인자와 결측 표기 (영문)

<a id="lesson-pandas-aggregation"></a>

### 3. 그룹별 집계, 테이블 결합, 형태 변환

핵심 · 40분 · [본문 원본](../../src/content/modules/pandas/pandas-aggregation.ts) · [실습 원본](../../src/content/modules/pandas/labs/pandas-aggregation.ts)

**학습 목표:** groupby로 그룹별 통계를 계산하고 transform으로 그룹 통계를 행에 붙이며, merge로 두 표를 키로 결합할 때 결합 방식과 키 중복의 영향을 판단하고, melt와 pivot으로 넓은 표와 긴 표를 서로 바꾼다.

**쓰이는 곳:** 고객별 구매 횟수 같은 특성은 그룹 집계로 만든다([3-3 특성 생성, 특성 선택, 차원의 저주](3-3-data-preparation.md#lesson-feature-engineering)). 집단별로 모델의 정확도를 비교하는 공정성 점검도 groupby 한 줄이고([X-1 공정성 기준](X-1-responsible-ai.md#lesson-fairness)), 여러 출처의 데이터를 한 학습 표로 모을 때는 merge의 키가 맞는지 확인해야 한다.

**본문 절:** 그룹별 집계 · 그룹 통계를 행마다 붙이기: transform · 두 표를 키로 결합하기: merge · 넓은 표와 긴 표

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 6

**실습**

- `ex1` 고객별 특성 만들기와 안전한 표 결합

**서술형**

- `d1` 주문 표에 고객 정보 표를 `merge`로 붙일 때 행 수가 줄거나 늘어나는 경우를 각각 설명하고, 이런 문제를 막기 위해 결합 전후에 확인할 것을 쓰라.

**참고 자료**

- [pandas — Group by: split-apply-combine](https://pandas.pydata.org/docs/user_guide/groupby.html) — groupby, agg, transform (영문)
- [pandas — Merge, join, concatenate and compare](https://pandas.pydata.org/docs/user_guide/merging.html) — merge의 how와 validate 인자 (영문)

<a id="lesson-data-types"></a>

### 4. 수치형·범주형·시계열 데이터

핵심 · 35분 · [본문 원본](../../src/content/modules/pandas/data-types.ts) · [실습 원본](../../src/content/modules/pandas/labs/data-types.ts)

**학습 목표:** 열마다 수치형(연속·이산), 범주형(명목·순서), 시계열, 텍스트 중 어느 유형인지 판단하고, 문자열로 읽힌 숫자·범주·날짜를 알맞은 pandas 자료형으로 바꾸며, 날짜에서 요일·경과 일수 같은 값을 꺼낸다.

**쓰이는 곳:** 열의 유형에 따라 전처리가 달라진다. 수치형은 크기를 맞추고, 범주형은 숫자로 인코딩하며([3-3 범주형 인코딩, 표준화, 정규화](3-3-data-preparation.md#lesson-encoding-scaling)), 시계열은 시간 순서대로 데이터를 나눠야 한다([4-1 학습·검증·테스트 데이터와 데이터 누수](4-1-ml-framing.md#lesson-data-splits)). 유형을 잘못 판단하면 우편번호의 평균처럼 의미 없는 값을 모델에 넣게 된다.

**본문 절:** 데이터의 유형 · 읽을 때 생기는 자료형 문제 · 숫자로 바꾸기 · 범주형으로 바꾸기 · 날짜와 시각

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 4

**실습**

- `ex1` 문자열로 읽힌 열을 알맞은 자료형으로 바꾸기

**서술형**

- `d1` 고객 데이터에 고객 ID(정수), 우편번호, 가입일, 요금제(basic·pro·free), 월 사용 시간 열이 있다. 각 열의 유형을 판단하고, 모델의 특성으로 쓰기 전에 각각 어떻게 처리할지 쓰라.

**참고 자료**

- [pandas — Categorical data](https://pandas.pydata.org/docs/user_guide/categorical.html) — category 자료형과 순서형 범주 (영문)
- [pandas — Time series / date functionality](https://pandas.pydata.org/docs/user_guide/timeseries.html) — to_datetime과 .dt 접근자 (영문)

## 백지 복습

1. 인덱스가 다른 두 Series를 더하면 어떻게 되는지 쓰고, `df['a']`와 `df[['a']]`의 차이를 쓰라.
2. `loc`과 `iloc`의 차이를 슬라이스의 끝 포함 여부와 함께 쓰고, 조건에 맞는 행의 값을 바꾸는 올바른 코드를 쓰라.
3. `groupby(...).sum()`과 `groupby(...).transform('sum')`이 돌려주는 행 수의 차이를 쓰고, 각각을 언제 쓰는지 예를 들어라.
4. `merge`에서 행 수가 줄거나 늘어나는 경우를 쓰고, 이를 막기 위한 확인 방법 두 가지를 쓰라.
5. 숫자로 적혀 있지만 범주형인 열의 예를 들고, 가격 문자열과 날짜 문자열을 알맞은 자료형으로 바꾸는 코드를 쓰라.
