<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 3-3 정제·탐색·특성

[전체 목차](README.md) · 트랙 3 데이터 처리 기초 · [모듈 원본](../../src/content/modules/data-preparation/index.ts)

결측치·이상치 처리, 시각화, 탐색적 데이터 분석, 인코딩과 스케일링, 특성 공학

## 목표 문제

중고차 매물 데이터에서 "Hyundai"와 "현대 "처럼 다르게 적힌 브랜드, 다시 등록된 매물, 연식 2099 같은 잘못된 값, 판매가 끝난 뒤에야 기록되는 가격 열을 찾아낸다. 결측을 채우는 기준과 범주 목록은 학습 데이터에서만 계산해 테스트 데이터에 적용하고, 범주형 열은 원-핫 인코딩으로, 연식과 주행거리는 나이·연간 주행거리 같은 특성으로 바꾼다. 무엇을 발견하고 어떻게 처리했는지는 데이터 카드로 남긴다.

## 학습 목표

- 결측·중복·표기 불일치·잘못된 값·이상치를 찾아 원인에 맞게 처리하고, 결측을 채우는 기준을 학습 데이터에서만 계산한다.
- 질문에 맞는 그래프를 고르고 matplotlib으로 그리며, 그래프가 잘못 읽히는 설정을 피한다.
- 정해진 순서로 데이터를 점검해 품질 문제와 클래스 불균형, 누수 후보를 찾고 결과를 기록한다.
- 범주형 인코딩과 스케일링을 상황에 맞게 고르고, fit과 transform을 나눠 적용한다.
- 파생 특성을 만들고 중복 특성을 골라내며, 차원의 저주가 거리 기반 방법에 주는 영향을 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [결측치, 중복값, 이상치, 잘못된 자료형](#lesson-data-cleaning) | 핵심 | 45분 | #46 결측치, 중복값, 이상치, 잘못된 자료형 |
| 2 | [히스토그램, 산점도, 상자그림, 상관행렬](#lesson-visualization) | 핵심 | 40분 | #47 히스토그램, 산점도, 상자그림, 상관행렬 |
| 3 | [탐색적 데이터 분석과 데이터 품질](#lesson-eda) | 핵심 | 35분 | #48 탐색적 데이터 분석과 데이터 품질 |
| 4 | [범주형 인코딩, 표준화, 정규화](#lesson-encoding-scaling) | 핵심 | 45분 | #49 범주형 인코딩, 표준화, 정규화 |
| 5 | [특성 생성, 특성 선택, 차원의 저주](#lesson-feature-engineering) | 핵심 | 35분 | #50 특성 생성, 특성 선택, 차원의 저주 |

## 핵심 레슨

<a id="lesson-data-cleaning"></a>

### 1. 결측치, 중복값, 이상치, 잘못된 자료형

핵심 · 45분 · [본문 원본](../../src/content/modules/data-preparation/data-cleaning.ts) · [실습 원본](../../src/content/modules/data-preparation/labs/data-cleaning.ts)

**학습 목표:** 결측값·중복·표기 불일치·잘못된 자료형·이상치를 찾아내고, 결측의 원인에 따라 처리 방법을 고르며, IQR과 Z-score의 판정이 엇갈리는 이유를 설명하고, 결측을 채우는 통계를 학습용 데이터에서만 계산한다.

**쓰이는 곳:** 모델은 입력 데이터의 오류를 그대로 학습한다. 결측값을 채우거나 이상치 기준을 정하는 통계를 평가용 데이터까지 포함해 계산하면 평가 결과가 실제보다 좋게 나오는 데이터 누수가 생기고([4-1 학습·검증·테스트 데이터와 데이터 누수](4-1-ml-framing.md#lesson-data-splits)), 정제에서 무엇을 바꿨는지는 데이터 문서에 기록해야 다른 사람이 결과를 해석할 수 있다([7-1 모델카드와 위험 점검](7-1-capstone-project.md#lesson-model-cards)).

**본문 절:** 수집, 정제, 전처리 · 결측값과 결측의 원인 · 중복과 표기 불일치 · 이상치 찾기: IQR과 Z-score · 이상치를 찾은 뒤 · 통계는 학습용 데이터에서만 계산한다

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 3 · 그림 2

**실습**

- `ex1` 학습용 데이터로 정제 기준을 정하고 평가용 데이터에 적용하기

**서술형**

- `d1` 결측값을 '행 삭제'와 '중앙값 대체' 중 하나로 처리하려고 한다. 각 방법이 위험해지는 상황을 결측의 원인과 연결해 설명하고, 두 방법 모두에 함께 쓸 수 있는 보완책을 쓰라.
- `d2` 데이터 `[12, 13, 13, 14, 14, 15, 16, 95]`에서 IQR 방법과 Z-score 방법(|z| > 3)으로 95를 판정한 결과가 다른 이유를 설명하라.

**참고 자료**

- [pandas — Working with missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html) — isna·dropna·fillna (영문)
- [Google Machine Learning Crash Course — Working with numerical data](https://developers.google.com/machine-learning/crash-course/numerical-data) — 이상치와 수치 데이터 다루기 (영문)

<a id="lesson-visualization"></a>

### 2. 히스토그램, 산점도, 상자그림, 상관행렬

핵심 · 40분 · [본문 원본](../../src/content/modules/data-preparation/visualization.ts) · [실습 원본](../../src/content/modules/data-preparation/labs/visualization.ts)

**학습 목표:** 알고 싶은 질문에 맞는 그래프(히스토그램·산점도·상자그림·막대그래프·상관행렬)를 고르고 matplotlib으로 그리며, 구간 수·축 범위·점의 겹침 같은 설정 때문에 그래프가 잘못 읽히는 경우를 찾아낸다.

**쓰이는 곳:** 데이터를 처음 받으면 그래프로 분포와 관계를 확인하고([3-3 탐색적 데이터 분석과 데이터 품질](#lesson-eda)), 모델을 학습한 뒤에는 학습 곡선과 오차 그래프로 과적합 같은 문제를 진단한다([4-3 일반화, 과적합, 과소적합, 편향과 분산](4-3-generalization.md#lesson-bias-variance)). 같은 숫자라도 그래프를 잘못 그리면 결론이 달라지므로, 결과를 보고할 때도 그래프를 바르게 그려야 한다.

**본문 절:** 질문에 맞는 그래프 · 히스토그램: 분포의 모양 · 산점도: 두 변수의 관계 · 상자그림: 범주마다 분포 비교 · 상관행렬 히트맵: 여러 변수의 상관을 한 번에 · 그래프가 잘못 읽히는 경우

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 5

**실습**

- `ex1` 확인용 그래프를 만드는 함수 작성하기

**서술형**

- `d1` 데이터를 처음 받았을 때 '변수 하나의 분포', '두 수치형 변수의 관계', '범주에 따른 차이'를 확인하기 위해 각각 어떤 그래프를 그릴지 쓰고, 각 그래프에서 무엇을 확인할지와 잘못 읽히지 않게 하기 위한 설정을 하나씩 쓰라.

**참고 자료**

- [Matplotlib — Quick start guide](https://matplotlib.org/stable/users/explain/quick_start.html) — Figure와 Axes, 기본 그래프 그리기 (영문)
- [Fundamentals of Data Visualization (Claus O. Wilke)](https://clauswilke.com/dataviz/) — 질문에 맞는 그래프 고르기와 흔한 오류 (영문, 무료 공개)

<a id="lesson-eda"></a>

### 3. 탐색적 데이터 분석과 데이터 품질

핵심 · 35분 · [본문 원본](../../src/content/modules/data-preparation/eda.ts) · [실습 원본](../../src/content/modules/data-preparation/labs/eda.ts)

**학습 목표:** 정해진 순서(구조·결측·중복·범위·분포·목표 변수·관계)로 데이터를 점검해 품질 문제를 찾아 기록하고, 클래스 불균형과 목표 변수의 정보가 새어 든 특성(누수 후보)을 찾아낸다.

**쓰이는 곳:** 모델을 만들기 전에 데이터를 점검하지 않으면, 잘못 기록된 값이나 학습 시점에 알 수 없는 정보가 섞인 특성 때문에 평가 성능이 실제보다 크게 좋게 나온다([4-1 학습·검증·테스트 데이터와 데이터 누수](4-1-ml-framing.md#lesson-data-splits)). 점검에서 찾은 문제와 처리 내용은 데이터 문서로 남긴다([7-1 모델카드와 위험 점검](7-1-capstone-project.md#lesson-model-cards)).

**본문 절:** 탐색적 데이터 분석의 순서 · 구조, 결측, 중복, 범위 · 목표 변수와 클래스 불균형 · 특성과 목표 변수의 관계, 누수 후보 · 점검 결과 기록하기

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 4

**실습**

- `ex1` 품질 점검표와 누수 후보를 자동으로 만들기

**서술형**

- `d1` 고객 해지를 예측하는 데이터를 받았다. EDA에서 점검할 항목을 순서대로 쓰고, 그중 누수를 찾기 위해 확인할 것을 구체적으로 설명하라.

**참고 자료**

- [Google — Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) — 데이터와 특성 점검, 학습·서빙 차이에 대한 실무 지침 (영문)
- [scikit-learn — Common pitfalls and recommended practices](https://scikit-learn.org/stable/common_pitfalls.html) — 데이터 누수와 전처리를 잘못 적용하는 사례 (영문)

<a id="lesson-encoding-scaling"></a>

### 4. 범주형 인코딩, 표준화, 정규화

핵심 · 45분 · [본문 원본](../../src/content/modules/data-preparation/encoding-scaling.ts) · [실습 원본](../../src/content/modules/data-preparation/labs/encoding-scaling.ts)

**학습 목표:** 명목형·순서형 범주에 맞는 인코딩(원-핫·순서 정수)을 고르고, Min-Max 정규화와 표준화를 계산해 이상치와 분포에 따라 방법을 고르며, 변환 규칙을 학습용 데이터에서만 계산(fit)하고 모든 데이터에 같게 적용(transform)한다.

**쓰이는 곳:** 선형 모델, 신경망, KNN처럼 특성의 크기나 거리를 쓰는 모델은 인코딩 방식과 특성의 크기에 결과가 크게 달라진다([4-4 k최근접 이웃, 결정트리, 랜덤 포레스트](4-4-ml-algorithms.md#lesson-knn-trees)). 특성의 크기 차이는 경사하강법의 수렴 속도도 바꾸고([2-3 경사하강법의 수렴 조건과 조건수](2-3-calculus-optimization.md#lesson-gd-convergence)), 변환 규칙을 평가용 데이터까지 포함해 계산하면 데이터 누수가 생긴다([4-1 학습·검증·테스트 데이터와 데이터 누수](4-1-ml-framing.md#lesson-data-splits)).

**본문 절:** 범주형 인코딩 · 스케일링: Min-Max 정규화와 표준화 · 스케일링이 필요한 모델과 필요 없는 모델 · 학습용 데이터로 fit, 모든 데이터에 transform

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 3 · 그림 3

**실습**

- `ex1` 학습용 데이터 통계로만 변환하는 표준화 함수 만들기

**서술형**

- `d1` 도시 열과 학력(고졸·대졸·대학원졸) 열에 각각 어떤 인코딩을 쓸지 정하고, 그 이유를 범주 사이의 거리와 순서로 설명하라.
- `d2` 특성의 크기가 크게 다른 데이터를 스케일링 없이 경사하강법으로 학습하면 왜 수렴이 느려지는지 손실의 등고선과 학습률로 설명하라.

**참고 자료**

- [scikit-learn — Preprocessing data](https://scikit-learn.org/stable/modules/preprocessing.html) — StandardScaler·MinMaxScaler·OneHotEncoder 사용법 (영문)
- [Google Machine Learning Crash Course — Categorical data](https://developers.google.com/machine-learning/crash-course/categorical-data) — 원-핫 인코딩과 범주가 많은 열 다루기 (영문)

<a id="lesson-feature-engineering"></a>

### 5. 특성 생성, 특성 선택, 차원의 저주

핵심 · 35분 · [본문 원본](../../src/content/modules/data-preparation/feature-engineering.ts) · [실습 원본](../../src/content/modules/data-preparation/labs/feature-engineering.ts)

**학습 목표:** 비율·차이·날짜·구간·거듭제곱 같은 파생 특성을 만들어 선형 모델이 표현하지 못하는 관계를 표현하고, 값이 변하지 않거나 서로 거의 같은 특성을 골라내며, 특성이 많아질수록 거리 기반 방법이 약해지는 차원의 저주를 시뮬레이션으로 확인한다.

**쓰이는 곳:** 표 데이터에서는 모델을 바꾸는 것보다 문제에 맞는 특성을 만드는 것이 성능을 더 크게 바꾸는 경우가 많다([4-1 기준 모델과 단순한 예측 기준](4-1-ml-framing.md#lesson-baselines)). 특성이 너무 많으면 과적합과 계산 비용이 커지므로 특성을 고르거나 차원을 줄인다([4-3 L1·L2 규제, 조기 종료, 학습 곡선](4-3-generalization.md#lesson-regularization), [4-4 K-means, PCA, 머신러닝 파이프라인](4-4-ml-algorithms.md#lesson-kmeans-pca-pipeline)). 딥러닝은 이런 특성을 데이터에서 직접 학습하는 방법이다([5-1 퍼셉트론, 다층 신경망, 활성화 함수](5-1-neural-networks.md#lesson-perceptron-mlp)).

**본문 절:** 파생 특성 만들기 · 선형 모델에 곡선 관계를 표현하기 · 특성 선택 · 차원의 저주

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 4

**실습**

- `ex1` 파생 특성 만들기와 중복 특성 걸러 내기

**서술형**

- `d1` 선형 회귀 모델에 $x^2$ 같은 파생 특성을 더하면 모델이 곡선 관계를 표현할 수 있는 이유를 설명하고, 파생 특성을 많이 만들 때 생기는 위험 두 가지와 대책을 쓰라.

**참고 자료**

- [scikit-learn — Feature selection](https://scikit-learn.org/stable/modules/feature_selection.html) — 분산 기준, 모델 기반 특성 선택 (영문)
- [Google Machine Learning Crash Course — Feature crosses](https://developers.google.com/machine-learning/crash-course/categorical-data/feature-crosses) — 두 특성을 조합한 특성 (영문)

## 백지 복습

1. 결측의 원인 세 가지를 쓰고, 원인에 따라 행 삭제가 위험해지는 경우를 설명하라. 결측 표시 열을 남기는 이유도 쓰라.
2. 데이터 `[12, 13, 13, 14, 14, 15, 16, 95]`에서 IQR 방법과 Z-score 방법의 판정이 다른 이유를 가림 효과로 설명하라.
3. 변수 하나의 분포, 두 수치형 변수의 관계, 범주에 따른 차이를 볼 때 각각 어떤 그래프를 쓰는지와, 그래프가 잘못 읽히는 경우 두 가지를 쓰라.
4. EDA의 점검 순서를 쓰고, 목표 변수와 상관이 매우 큰 특성을 발견했을 때 누수인지 판단하는 질문을 쓰라.
5. 원-핫 인코딩과 순서 정수 인코딩을 각각 언제 쓰는지, 스케일러를 학습 데이터로만 fit해야 하는 이유, 차원의 저주가 무엇인지 쓰라.

## 과제: 중고차 매물 데이터 점검과 데이터 카드

저장 키 `data-card-eda` · 만점 10점 · [과제 원본](../../src/content/modules/data-preparation/assignment.ts)

중고차 매물 125건이 담긴 CSV를 pandas로 읽어, 자료형을 바로잡고 품질 문제(표기 불일치·중복·잘못된 값·결측)를 점검해 고친 뒤, 학습 데이터에서만 계산한 기준으로 모델 입력 표를 만듭니다. 마지막으로 무엇을 발견하고 어떻게 처리했는지 데이터 카드로 정리합니다. 목표 변수는 매물 가격(`price`, 만 원)입니다. 트랙 3의 NumPy·pandas·정제·탐색·특성 공학을 한 작업 공간에서 함께 씁니다. 모든 코드는 브라우저에서 실행됩니다.

**핵심** 단계 네 개(읽기와 자료형·품질 점검·모델 입력 만들기·데이터 카드)만 채점합니다. **보충**(그래프로 확인하기)과 **심화**(학습·테스트 분포 비교) 단계는 선택이며 피드백만 받습니다. 제출하기 전에 "실행 환경 초기화" 후 "전체 실행"으로 처음부터 같은 결과가 나오는지 확인합니다.

### 요구사항

- `load_listings`와 `clean_types`로 "N/A"를 결측으로 읽고, 브랜드 표기를 네 가지로 통일하며, 주행거리를 숫자로, 등록일을 날짜로 바꾼다.
- `quality_report`로 결측·완전 중복·키 중복·범위 밖 값을 세고, `fix_quality`로 고쳐 119행·매물 번호가 유일한 표를 만든다.
- 시드 42로 나눈 학습 데이터에서만 대체값과 범주 목록을 계산해 학습·테스트 데이터의 모델 입력 표(결측 없음)를 만들고, 누수 열을 찾아 제외한다.
- 데이터 카드에 출처·행의 뜻·목표 변수·열 설명·품질 문제와 처리·제외한 열과 이유·한계를 정리한다.
- 실행 환경을 초기화한 뒤 처음부터 실행해도 같은 결과가 나온다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| 데이터 읽기와 자료형 바로잡기 | 핵심 | 코드 `load-data`, 코드 `load-code`, 답안 `load-answer`(최소 100자) |
| 품질 점검과 수정 | 핵심 | 코드 `quality-code`, 답안 `quality-answer`(최소 200자) |
| 학습 데이터 기준으로 모델 입력 만들기 | 핵심 | 코드 `features-code`, 답안 `features-answer`(최소 150자) |
| 데이터 카드 | 핵심 | 답안 `card-answer`(최소 400자) |
| 보충: 그래프로 확인하기 | 보충 | 코드 `viz-code`, 답안 `viz-answer` |
| 심화: 학습·테스트 분포 비교 | 심화 | 코드 `advanced-code`, 답안 `advanced-answer` |

### 채점 기준

| 기준 | 배점 | 확인 내용 |
| --- | ---: | --- |
| 정제와 자료형 변환의 정확성 | 3 | 결측 표기·브랜드 표기·주행거리·등록일을 바르게 처리하고, 중복과 잘못된 값을 본문의 순서대로 고쳐 119행을 얻었습니다. |
| 품질 점검과 누수 판단 | 3 | 품질 문제를 기준별로 정리하고, 누수 후보마다 예측 시점에 알 수 있는지 근거를 들어 판단했으며, 대체값을 학습 데이터로만 계산했습니다. |
| 데이터 카드의 완성도 | 3 | 틀의 항목을 출력 수치와 함께 빠짐없이 채웠고, 다른 사람이 데이터를 쓸 때 주의할 점(한계)을 구체적으로 적었습니다. |
| 재현성과 가독성 | 1 | 핵심 단계의 모든 셀이 처음부터 순서대로 실행되고, 답안이 간결하며 출력과 잘 연결됩니다. |

### 자동 테스트

- `load`: 결측 표기·브랜드·주행거리·등록일이 바르게 바뀌었다
- `quality`: 품질 점검 수치와 고친 표가 맞다
- `features`: 학습 데이터 기준으로 결측 없는 입력 표를 만들었다
- `features`: 누수 후보를 상관이 큰 순서로 찾고 누수 열을 입력에서 뺐다

### 선택 심화 문제

- `ch1` 그룹별 중앙값으로 결측 채우기
