<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 2-5 기술통계와 표본

[전체 목차](README.md) · 트랙 2 수학 기초 · [모듈 원본](../../src/content/modules/descriptive-statistics/index.ts)

표본과 표본편향, 요약 통계량, 공분산·상관과 인과

## 목표 문제

한 지역의 소득을 설문으로 조사할 때 소득이 높을수록 응답률이 높으면, 응답자를 아무리 많이 모아도 평균 소득이 높게 추정되는 이유를 표본편향으로 설명한다. 연봉 데이터에 큰 값 하나가 섞이면 평균과 표준편차는 크게 바뀌지만 중앙값과 사분위범위는 거의 바뀌지 않는다는 것을 계산으로 확인하고, 공부 시간과 점수의 상관계수를 구한 뒤 그 상관이 인과관계인지 판단하는 기준을 세운다.

## 학습 목표

- 모집단과 표본, 모수와 통계량을 구분하고, 단순무작위추출과 층화추출로 표본을 뽑으며 표본편향의 종류와 영향을 설명한다.
- 평균·중앙값·분위수·사분위범위·분산·표준편차를 계산하고, 이상치와 치우친 분포에 알맞은 요약 통계량을 고른다.
- 표본분산을 $n - 1$로 나누는 이유와 NumPy·pandas의 기본값 차이를 설명한다.
- 공분산과 상관계수를 계산하고, 상관계수의 한계와 상관관계가 인과관계와 다른 이유를 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [표본과 모집단, 표본추출, 표본편향](#lesson-sampling) | 핵심 | 30분 | #33 표본과 모집단, 표본추출, 표본편향 |
| 2 | [평균, 중앙값, 분위수, 표준편차](#lesson-summary-statistics) | 핵심 | 35분 | #34 평균, 중앙값, 분위수, 표준편차 |
| 3 | [공분산, 상관계수, 상관관계와 인과관계](#lesson-correlation) | 핵심 | 35분 | #35 공분산, 상관계수, 상관관계와 인과관계 |

## 핵심 레슨

<a id="lesson-sampling"></a>

### 1. 표본과 모집단, 표본추출, 표본편향

핵심 · 30분 · [본문 원본](../../src/content/modules/descriptive-statistics/sampling.ts) · [실습 원본](../../src/content/modules/descriptive-statistics/labs/sampling.ts)

**학습 목표:** 모집단과 표본, 모수와 통계량을 구분하고, 단순무작위추출과 층화추출로 표본을 뽑으며, 선택 편향·생존 편향·무응답 편향이 추정을 어떻게 왜곡하는지 설명한다.

**쓰이는 곳:** 학습 데이터는 모델을 쓸 환경에서 뽑은 표본이므로, 표본이 치우치면 모델도 치우친다([X-1 공정성 기준](X-1-responsible-ai.md#lesson-fairness)). 데이터를 학습용과 평가용으로 나눌 때는 층화추출로 클래스 비율을 유지하고([4-1 학습·검증·테스트 데이터와 데이터 누수](4-1-ml-framing.md#lesson-data-splits)), 배포 뒤 입력 분포가 학습 때와 달라지는 문제도 표본과 모집단의 차이에서 생긴다([6-3 드리프트 감지의 통계](6-3-llm-systems.md#lesson-drift-statistics)).

**본문 절:** 모집단과 표본 · 표본추출 방법 · 표본편향 · 학습 데이터는 표본이다

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2 · 그림 1

**실습**

- `ex1` 층화추출 직접 구현하고 단순무작위추출과 비교하기

**서술형**

- `d1` 한 쇼핑몰이 앱 리뷰를 남긴 고객의 만족도로 전체 고객의 만족도를 추정하려 한다. 이 표본에 생길 수 있는 편향 두 가지를 이름과 함께 설명하고, 표본을 늘리는 것만으로 해결되지 않는 이유와 개선 방법을 하나 제시하라.

**참고 자료**

- [OpenIntro Statistics — Sampling principles and strategies](https://www.openintro.org/book/os/) — 1장: 표본추출 방법과 편향 (영문, 무료 교재)
- [scikit-learn — train_test_split](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html) — stratify 인자로 층화 분할하기 (영문)

<a id="lesson-summary-statistics"></a>

### 2. 평균, 중앙값, 분위수, 표준편차

핵심 · 35분 · [본문 원본](../../src/content/modules/descriptive-statistics/summary-statistics.ts) · [실습 원본](../../src/content/modules/descriptive-statistics/labs/summary-statistics.ts)

**학습 목표:** 평균·중앙값·최빈값과 분위수·사분위범위·분산·표준편차를 계산하고, 이상치와 치우친 분포에서 알맞은 대푯값과 퍼짐 지표를 고르며, 표본분산을 $n - 1$로 나누는 이유를 설명한다.

**쓰이는 곳:** 데이터를 처음 받으면 요약 통계량으로 분포와 이상치를 확인한다([3-3 탐색적 데이터 분석과 데이터 품질](3-3-data-preparation.md#lesson-eda)). 특성 표준화에는 평균과 표준편차를, 이상치 판정에는 사분위범위를 쓴다([3-3 결측치, 중복값, 이상치, 잘못된 자료형](3-3-data-preparation.md#lesson-data-cleaning)). 평균제곱오차를 최소화하는 예측값은 평균이고 절대오차를 최소화하는 값은 중앙값이라, 손실함수를 고를 때도 이 차이가 중요하다([4-2 손실함수의 확률적 기원](4-2-linear-models.md#lesson-loss-likelihood)).

**본문 절:** 대푯값: 평균, 중앙값, 최빈값 · 분위수와 사분위범위 · 분산과 표준편차 · 이상치가 통계량에 미치는 영향

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2 · 그림 1

**실습**

- `ex1` 분위수·이상치·표본분산을 정의대로 구현하기

**서술형**

- `d1` 어느 동네의 집값 데이터를 요약할 때 평균·표준편차만 보고하면 어떤 문제가 생길 수 있는지 설명하고, 함께 보고해야 할 통계량을 이유와 함께 제시하라.

**참고 자료**

- [OpenIntro Statistics — Summarizing data](https://www.openintro.org/book/os/) — 2장: 평균·중앙값·분산·상자그림 (영문, 무료 교재)
- [NumPy — quantile](https://numpy.org/doc/stable/reference/generated/numpy.quantile.html) — 분위수 계산 방법(method 인자)의 차이 (영문)

<a id="lesson-correlation"></a>

### 3. 공분산, 상관계수, 상관관계와 인과관계

핵심 · 35분 · [본문 원본](../../src/content/modules/descriptive-statistics/correlation.ts) · [실습 원본](../../src/content/modules/descriptive-statistics/labs/correlation.ts)

**학습 목표:** 공분산과 피어슨 상관계수를 계산하고 상관계수를 중심화한 벡터의 코사인 유사도로 해석하며, 상관계수가 직선 관계만 재고 이상치에 민감하다는 점과 상관관계가 인과관계를 뜻하지 않는 이유를 설명한다.

**쓰이는 곳:** 특성 사이의 상관을 보고 같은 정보를 담은 특성을 찾고([3-3 특성 생성, 특성 선택, 차원의 저주](3-3-data-preparation.md#lesson-feature-engineering)), 공분산행렬로 주성분 분석을 한다([4-4 K-means, PCA, 머신러닝 파이프라인](4-4-ml-algorithms.md#lesson-kmeans-pca-pipeline)). 모델은 데이터의 상관관계를 학습하므로, 모델이 찾은 관계를 원인으로 해석하거나 그 관계로 개입을 결정할 때는 인과관계인지 따로 확인해야 한다.

**본문 절:** 공분산 · 피어슨 상관계수 · 상관계수의 한계 · 상관관계와 인과관계 · 공분산행렬과 상관행렬

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2 · 그림 1

**실습**

- `ex1` 공분산·피어슨 상관계수·스피어먼 순위상관계수 구현하기

**서술형**

- `d1` 어느 회사의 데이터에서 "사내 교육을 많이 받은 직원일수록 성과 평가 점수가 높다"(상관계수 0.6)는 결과가 나왔다. 이것만으로 "교육이 성과를 높인다"고 결론 내릴 수 없는 이유를 두 가지 이상 설명하고, 인과관계를 확인하는 방법을 제시하라.

**참고 자료**

- [OpenIntro Statistics — Correlation and causation](https://www.openintro.org/book/os/) — 1장의 관찰 연구와 실험, 8장의 상관계수 (영문, 무료 교재)
- [Caruana et al. (2015) — Intelligible Models for HealthCare](https://www.microsoft.com/en-us/research/publication/intelligible-models-healthcare-predicting-pneumonia-risk-hospital-30-day-readmission/) — 폐렴 위험 예측 모델이 천식과 낮은 위험을 연결한 사례 (영문 논문, KDD 2015)

## 백지 복습

1. 모집단·표본·모수·통계량을 정의하고, 층화추출이 단순무작위추출보다 나은 경우를 예로 들어 설명하라.
2. 선택 편향·생존 편향·무응답 편향의 예를 하나씩 들고, 표본을 늘려도 편향이 줄지 않는 이유를 설명하라.
3. 평균과 중앙값이 각각 어떤 오차를 최소화하는지 쓰고, 이상치가 있을 때 어떤 대푯값과 퍼짐 지표를 함께 보고해야 하는지 설명하라.
4. 사분위범위와 1.5 IQR 이상치 기준을 쓰고, 표본분산을 $n - 1$로 나누는 이유를 설명하라.
5. 피어슨 상관계수의 식을 쓰고 중심화한 벡터의 코사인 유사도로 해석하라. $r = 0$인데 강한 관계가 있는 예와, 상관이 인과가 아닌 이유 세 가지를 쓰라.
