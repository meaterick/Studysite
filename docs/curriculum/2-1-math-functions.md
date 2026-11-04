<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 2-1 함수와 수열

[전체 목차](README.md) · 트랙 2 수학 기초 · [모듈 원본](../../src/content/modules/math-functions/index.ts)

함수와 합성, 일차·이차·지수·로그함수, 시그마 표기와 수열

## 목표 문제

데이터 $(1, 2), (2, 4), (3, 7)$에 모델 $\hat y = wx$를 맞출 때의 평균제곱오차 $L(w) = \frac{1}{n}\sum_{i=1}^{n}(w x_i - y_i)^2$를 하나의 함수로 보고, 그래프를 그려 최솟값의 위치를 꼭짓점 공식으로 구한다. 확률을 다루는 시그모이드와 로그 확률의 합을 넘침·언더플로 없이 계산한다. 이후의 모든 모델과 손실은 이 함수들의 합성으로 쓴다.

## 학습 목표

- 함수의 정의역·치역을 구분하고, 합성함수를 계산하며 여러 층으로 된 모델을 합성으로 나타낸다.
- 일차·이차·지수·로그함수의 성질을 설명하고, 이차함수의 꼭짓점으로 평균제곱오차의 최솟값을 구한다.
- 로그의 성질로 확률의 곱을 로그 확률의 합으로 바꾸고, 지수 계산의 넘침을 피한다.
- $\Sigma$ 표기와 합의 성질을 적용하고, 등차·등비수열의 합을 계산하며 $\Sigma$ 식을 코드로 옮긴다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [함수, 정의역·치역, 함수의 합성](#lesson-functions-composition) | 핵심 | 35분 | #17 함수, 정의역·치역, 함수의 합성 |
| 2 | [일차함수, 이차함수, 지수함수, 로그함수](#lesson-elementary-functions) | 핵심 | 30분 | #18 일차함수, 이차함수, 지수함수, 로그함수 |
| 3 | [시그마 표기와 수열의 기초](#lesson-sigma-sequences) | 핵심 | 35분 | #19 시그마 표기와 수열의 기초 |

## 핵심 레슨

<a id="lesson-functions-composition"></a>

### 1. 함수, 정의역·치역, 함수의 합성

핵심 · 35분 · [본문 원본](../../src/content/modules/math-functions/functions-composition.ts) · [실습 원본](../../src/content/modules/math-functions/labs/functions-composition.ts)

**학습 목표:** 함수를 입력과 출력의 대응으로 정의하고 정의역·공역·치역을 구분하며, 합성함수 $g \circ f$를 계산하고 여러 층으로 된 모델을 합성으로 나타낸다.

**쓰이는 곳:** 머신러닝 모델은 입력을 출력으로 보내는 함수이고, 신경망은 층을 차례로 합성한 함수다([5-1 퍼셉트론, 다층 신경망, 활성화 함수](5-1-neural-networks.md#lesson-perceptron-mlp)). 모델을 합성으로 보아야 연쇄법칙으로 기울기를 계산하는 원리([2-3 연쇄법칙](2-3-calculus-optimization.md#lesson-chain-rule))를 따라갈 수 있다.

**본문 절:** 함수의 정의 · 자주 쓰는 함수의 정의역과 치역 · 함수의 그래프 · 합성함수 · 모델은 함수의 합성이다 · 역함수

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 4

**실습**

- `ex1` 합성함수와 정의역 검사

**서술형**

- `d1` 합성함수에서 순서가 중요한 이유를 예로 보이고, 신경망에서 층을 쌓는 것이 함수의 합성이라는 말의 뜻을 설명하라.

**참고 자료**

- [Khan Academy — 함수 (한국어)](https://ko.khanacademy.org/math/algebra/x2f8bb11595b61c86:functions) — 함수, 정의역과 치역의 기초
- [3Blue1Brown — But what is a neural network?](https://www.3blue1brown.com/lessons/neural-networks) — 층을 차례로 적용하는 함수로서의 신경망 (영문)

<a id="lesson-elementary-functions"></a>

### 2. 일차함수, 이차함수, 지수함수, 로그함수

핵심 · 30분 · [본문 원본](../../src/content/modules/math-functions/elementary-functions.ts) · [실습 원본](../../src/content/modules/math-functions/labs/elementary-functions.ts)

**학습 목표:** 일차·이차·지수·로그함수의 식과 그래프의 성질(기울기, 꼭짓점, 증가 속도, 정의역)을 설명하고, 로그의 성질로 곱을 합으로 바꾸어 계산한다.

**쓰이는 곳:** 선형 모델은 일차함수이고, 평균제곱오차는 파라미터에 대한 이차함수다. 시그모이드·소프트맥스는 지수함수로, 교차엔트로피 손실은 로그함수로 만든다([4-2 로지스틱 회귀, 시그모이드, 분류 임계값](4-2-linear-models.md#lesson-logistic-regression), [2-6 가능도, 최대가능도추정, 엔트로피, 교차엔트로피](2-6-inference-information.md#lesson-likelihood-entropy)). 손실 곡선과 학습률 스케줄도 이 함수들의 그래프로 읽는다.

**본문 절:** 일차함수 · 이차함수 · 지수함수 · 로그함수 · 증가 속도 비교

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2

**실습**

- `ex1` 포물선의 꼭짓점, 로그 가능도, 넘치지 않는 시그모이드

**서술형**

- `d1` 모델 $\hat y = wx$의 평균제곱오차를 파라미터 $w$ 하나의 함수로 보면 이차함수가 되는 이유를 설명하고, 이 사실이 최솟값을 찾는 데 주는 이점을 써라.

**참고 자료**

- [Khan Academy — 지수와 로그 (한국어)](https://ko.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:logs) — 로그의 정의와 성질
- [Python 표준 라이브러리 — math (한국어)](https://docs.python.org/ko/3/library/math.html) — exp, log, log2, log10

<a id="lesson-sigma-sequences"></a>

### 3. 시그마 표기와 수열의 기초

핵심 · 35분 · [본문 원본](../../src/content/modules/math-functions/sigma-sequences.ts) · [실습 원본](../../src/content/modules/math-functions/labs/sigma-sequences.ts)

**학습 목표:** 수열과 시그마($\Sigma$) 표기를 읽고 쓰며, 합의 성질과 등차·등비수열의 합을 계산하고, $\Sigma$ 식을 반복문과 배열 연산으로 옮긴다.

**쓰이는 곳:** 평균, 분산, 손실, 내적, 행렬곱은 모두 $\Sigma$로 쓴다. $\Sigma$ 식을 코드로 옮길 수 있어야 논문의 수식을 구현할 수 있고([3-1 벡터화 연산과 난수 시드](3-1-numpy.md#lesson-vectorization)), 학습률을 일정한 비율로 줄이는 스케줄처럼 등비수열이 나오는 계산도 다룰 수 있다([5-2 가중치 감쇠와 학습률 스케줄](5-2-deep-training.md#lesson-training-schedules)).

**본문 절:** 수열 · 시그마 표기 · 합의 성질 · 통계량과 손실을 $\Sigma$로 쓰기 · 등차수열과 등비수열 · 이중 시그마

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3

**실습**

- `ex1` 시그마 계산과 등비수열의 합

**서술형**

- `d1` $\sum_i a_i b_i$와 $(\sum_i a_i)(\sum_i b_i)$가 일반적으로 다른 이유를 예로 보이고, 평균제곱오차 식을 코드로 옮길 때 인덱스 범위와 계산 순서에서 주의할 점을 설명하라.

**참고 자료**

- [Khan Academy — 시그마 표기법 (한국어)](https://ko.khanacademy.org/math/ap-calculus-ab/ab-integration-new/ab-6-3/v/sigma-notation-sum) — 시그마 표기의 읽기와 계산
- [NumPy — sum](https://numpy.org/doc/stable/reference/generated/numpy.sum.html) — 축(axis)을 지정한 합 (영문)

## 백지 복습

1. $(g \circ f)(x)$의 뜻을 쓰고, 순서를 바꾸면 결과가 달라지는 예와 $\ln(x - 1)$의 정의역을 쓰라.
2. 이차함수 $y = ax^2 + bx + c$의 꼭짓점 공식을 쓰고, 평균제곱오차가 파라미터 하나의 이차함수가 되는 이유를 설명하라.
3. 로그의 성질 두 가지를 쓰고, 확률의 곱 대신 로그 확률의 합을 계산하는 이유를 설명하라.
4. 평균, 분산, 평균제곱오차, 내적을 $\Sigma$ 식으로 쓰고, 각각을 코드 한 줄로 옮겨라.
5. 등비수열의 합 공식을 쓰고, 학습률을 매번 0.9배로 줄일 때 학습률의 총합이 얼마를 넘지 않는지 계산하라.
