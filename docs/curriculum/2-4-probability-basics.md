<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 2-4 확률

[전체 목차](README.md) · 트랙 2 수학 기초 · [모듈 원본](../../src/content/modules/probability-basics/index.ts)

사건과 독립성, 조건부확률과 베이즈 정리, 확률변수, 정규·이항분포

## 목표 문제

유병률 1%, 민감도 99%, 위양성률 5%인 검사에서 양성 판정을 받은 사람이 실제 환자일 확률이 약 16.7%에 불과한 이유를 조건부확률과 베이즈 정리로 계산하고, 1만 명의 사람 수로 다시 확인한다. 정답률 0.8인 모델이 10문제 중 몇 문제를 맞힐지를 이항분포로 계산해, 문제 수가 적은 평가가 얼마나 흔들리는지 표준편차로 나타낸다.

## 학습 목표

- 표본공간과 사건으로 확률을 정의하고, 덧셈 법칙·여사건·곱셈 법칙으로 확률을 계산하며 배반과 독립을 구분한다.
- 조건부확률과 전체확률의 법칙을 적용하고, 베이즈 정리로 사전확률을 사후확률로 갱신하며 기저율의 영향을 설명한다.
- 확률질량함수·확률밀도함수·누적분포함수를 구분하고, 기댓값과 분산을 계산하며 기댓값의 선형성과 분산의 합 성질을 적용한다.
- 베르누이·이항·균등·정규분포의 평균과 분산을 쓰고, 이항분포와 표준정규분포로 확률을 계산한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [확률, 사건, 독립성](#lesson-probability-rules) | 핵심 | 30분 | #29 확률, 사건, 독립성 |
| 2 | [조건부확률과 베이즈 정리](#lesson-bayes) | 핵심 | 35분 | #30 조건부확률과 베이즈 정리 |
| 3 | [확률변수, 기댓값, 분산](#lesson-random-variables) | 핵심 | 30분 | #31 확률변수, 확률분포, 기댓값, 분산 |
| 4 | [정규분포, 이항분포, 표준정규분포](#lesson-distributions) | 핵심 | 40분 | #32 정규분포, 이항분포, 표준정규분포 |

## 핵심 레슨

<a id="lesson-probability-rules"></a>

### 1. 확률, 사건, 독립성

핵심 · 30분 · [본문 원본](../../src/content/modules/probability-basics/probability-rules.ts) · [실습 원본](../../src/content/modules/probability-basics/labs/probability-rules.ts)

**학습 목표:** 표본공간과 사건으로 확률을 정의하고, 여사건·합사건·곱사건의 확률을 덧셈 법칙과 곱셈 법칙으로 계산하며, 배반과 독립을 구분하고 시뮬레이션으로 확률을 근사한다.

**쓰이는 곳:** 분류 모델은 클래스마다 확률을 출력하고([4-2 로지스틱 회귀, 시그모이드, 분류 임계값](4-2-linear-models.md#lesson-logistic-regression)), 언어 모델은 다음 토큰의 확률분포에서 토큰을 고른다([6-2 샘플링과 디코딩 전략](6-2-llm-training.md#lesson-decoding)). 나이브 베이즈 분류기는 특성들이 서로 독립이라고 가정하고 확률을 곱한다([4-4 나이브 베이즈 분류기](4-4-ml-algorithms.md#lesson-naive-bayes)).

**본문 절:** 표본공간과 사건 · 확률의 기본 성질 · 합사건과 덧셈 법칙 · 독립과 곱셈 법칙 · 시뮬레이션으로 확률 근사하기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1

**실습**

- `ex1` 사건의 확률을 세어서 계산하고 독립성 판정하기

**서술형**

- `d1` 배반사건과 독립사건의 정의를 각각 쓰고, 확률이 0보다 큰 두 사건이 배반이면 독립일 수 없는 이유를 설명하라. 주사위에서 독립인 두 사건의 예를 하나 들고 곱셈 법칙으로 확인하라.

**참고 자료**

- [Seeing Theory — Basic Probability](https://seeing-theory.brown.edu/basic-probability/index.html) — 확률의 기본 개념과 상대도수를 인터랙티브로 (영문)
- [Khan Academy — 확률 (한국어)](https://ko.khanacademy.org/math/statistics-probability/probability-library) — 사건, 덧셈 법칙, 독립과 곱셈 법칙

<a id="lesson-bayes"></a>

### 2. 조건부확률과 베이즈 정리

핵심 · 35분 · [본문 원본](../../src/content/modules/probability-basics/bayes.ts) · [실습 원본](../../src/content/modules/probability-basics/labs/bayes.ts)

**학습 목표:** 조건부확률을 정의하고 곱셈 법칙과 전체확률의 법칙으로 확률을 계산하며, 베이즈 정리로 사전확률을 사후확률로 갱신하고 기저율이 결과에 미치는 영향을 사람 수로 설명한다.

**쓰이는 곳:** 스팸 필터에 쓰는 나이브 베이즈 분류기는 베이즈 정리를 그대로 적용한 모델이고([4-4 나이브 베이즈 분류기](4-4-ml-algorithms.md#lesson-naive-bayes)), 분류 모델의 정밀도는 "양성으로 예측했을 때 실제 양성일 조건부확률"이다([4-2 혼동행렬, 정확도, 정밀도, 재현율, F1](4-2-linear-models.md#lesson-classification-metrics)). 사전확률과 데이터를 결합하는 베이즈 관점은 MAP 추정과 규제로 이어진다([2-6 사전분포와 MAP 추정](2-6-inference-information.md#lesson-mle-map)).

**본문 절:** 조건부확률 · 곱셈 법칙과 전체확률의 법칙 · 베이즈 정리 · 관찰이 쌓일 때의 갱신

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 베이즈 정리를 사람 수(자연 빈도)로 계산하기

**서술형**

- `d1` 유병률 2%, 민감도 90%, 위양성률 10%인 검사에서 양성 판정을 받은 사람이 실제 환자일 확률을 베이즈 정리로 구하라.
- `d2` 같은 검사(민감도 99%, 위양성률 5%)인데 유병률 1%와 10%의 $P(\text{환자} \mid \text{양성})$이 약 16.7%와 68.8%로 크게 다른 이유를, 1만 명 기준으로 참양성(TP)과 위양성(FP)의 사람 수로 설명하라.

**참고 자료**

- [3Blue1Brown — Bayes theorem, the geometry of changing beliefs](https://www.3blue1brown.com/lessons/bayes-theorem) — 넓이로 보는 베이즈 정리와 의료 검사 예제 (영문)
- [Seeing Theory — Compound Probability](https://seeing-theory.brown.edu/compound-probability/index.html) — 조건부확률과 베이즈 정리를 인터랙티브로 (영문)

<a id="lesson-random-variables"></a>

### 3. 확률변수, 기댓값, 분산

핵심 · 30분 · [본문 원본](../../src/content/modules/probability-basics/random-variables.ts) · [실습 원본](../../src/content/modules/probability-basics/labs/random-variables.ts)

**학습 목표:** 확률변수와 확률분포(확률질량함수·확률밀도함수·누적분포함수)를 구분하고, 기댓값과 분산을 정의대로 계산하며, 기댓값의 선형성과 독립인 확률변수의 분산의 합 성질을 적용한다.

**쓰이는 곳:** 손실함수는 오차의 기댓값을 데이터로 추정한 값이고([4-1 손실함수, 목적함수, 학습과 추론](4-1-ml-framing.md#lesson-loss-functions)), 가중치 초기화는 층을 지난 출력의 분산이 유지되도록 분산을 계산해 정한다([5-2 가중치 초기화와 기울기 소실·폭주](5-2-deep-training.md#lesson-initialization)). 강화학습의 목표도 받을 보상의 기댓값을 최대화하는 것이다([6-2 강화학습 기초](6-2-llm-training.md#lesson-rl-basics)).

**본문 절:** 확률변수 · 이산확률분포와 확률질량함수 · 연속확률분포와 확률밀도함수 · 기댓값 · 분산과 표준편차 · 기댓값과 분산의 성질

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1

**실습**

- `ex1` 확률질량함수로 기댓값·분산 계산하고 합의 분포 만들기

**서술형**

- `d1` 기댓값의 선형성 $E[X + Y] = E[X] + E[Y]$와 분산의 합 $\mathrm{Var}(X + Y) = \mathrm{Var}(X) + \mathrm{Var}(Y)$가 각각 어떤 조건에서 성립하는지 쓰고, 분산의 합 공식이 성립하지 않는 예를 들어라. 주사위 두 개의 합의 기댓값과 분산도 구하라.

**참고 자료**

- [Seeing Theory — Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) — 확률변수, 기댓값, 분산과 여러 분포 (영문)
- [Dive into Deep Learning — Probability and Statistics](https://d2l.ai/chapter_preliminaries/probability.html) — 확률변수와 기댓값을 코드와 함께 (영문, 한국어판은 ko.d2l.ai)

<a id="lesson-distributions"></a>

### 4. 정규분포, 이항분포, 표준정규분포

핵심 · 40분 · [본문 원본](../../src/content/modules/probability-basics/distributions.ts) · [실습 원본](../../src/content/modules/probability-basics/labs/distributions.ts)

**학습 목표:** 베르누이·이항·균등·정규분포의 확률질량함수나 확률밀도함수와 평균·분산을 쓰고, 이항분포로 성공 횟수의 확률을 계산하며, 정규분포를 표준화해 z-점수와 표준정규분포로 구간의 확률을 구한다.

**쓰이는 곳:** 이진 분류의 정답은 베르누이 분포를, 테스트 문제 중 맞힌 개수는 이항분포를 따른다. 그래서 정확도의 오차 범위를 이항분포로 계산한다([6-3 LLM 평가의 통계](6-3-llm-systems.md#lesson-eval-statistics)). 가중치 초기화와 데이터의 잡음에는 정규분포를 쓰고([5-2 가중치 초기화와 기울기 소실·폭주](5-2-deep-training.md#lesson-initialization)), 특성 표준화는 z-점수 변환이다([3-3 범주형 인코딩, 표준화, 정규화](3-3-data-preparation.md#lesson-encoding-scaling)).

**본문 절:** 베르누이 분포 · 이항분포 · 균등분포 · 정규분포 · 표준정규분포와 z-점수

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3 · 그림 3

**실습**

- `ex1` 이항분포의 확률과 정규분포의 구간 확률 계산하기

**서술형**

- `d1` 정답률이 0.8인 모델을 문제 10개로 평가할 때와 1,000개로 평가할 때, 측정한 정확도(맞힌 비율)의 표준편차를 각각 구하라. 이 결과가 모델 평가에 주는 의미를 설명하라.

**참고 자료**

- [Seeing Theory — Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) — 이항·균등·정규분포의 모양을 파라미터를 바꾸며 보기 (영문)
- [NumPy — Random Generator](https://numpy.org/doc/stable/reference/random/generator.html) — binomial, uniform, normal 등 분포별 난수 생성 함수 (영문)

## 백지 복습

1. 덧셈 법칙과 독립일 때의 곱셈 법칙을 쓰고, 배반사건이 독립이 아닌 이유를 설명하라. 주사위를 4번 던져 6이 적어도 한 번 나올 확률을 계산하라.
2. 조건부확률의 정의와 베이즈 정리를 쓰고, 사전확률·가능도·사후확률이 각각 무엇인지 설명하라.
3. 유병률 1%, 민감도 99%, 위양성률 5%인 검사에서 $P(\text{환자} \mid \text{양성})$을 1만 명의 사람 수로 계산하고, 그 값이 낮은 이유를 설명하라.
4. 기댓값과 분산의 정의를 쓰고, 주사위 한 개와 주사위 두 개의 합의 기댓값·분산을 구하라. 분산의 합 공식이 성립하는 조건도 쓰라.
5. 이항분포의 확률질량함수와 평균·분산을 쓰고, 정규분포의 68-95-99.7 규칙과 z-점수의 정의를 쓰라. $\mathcal{N}(\mu, \sigma^2)$와 NumPy `scale`의 차이도 설명하라.
