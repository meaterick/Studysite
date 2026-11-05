<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 4-1 문제 설정과 실험 설계

[전체 목차](README.md) · 트랙 4 머신러닝 기초 · [모듈 원본](../../src/content/modules/ml-framing/index.ts)

머신러닝 용어, 학습 패러다임, 문제 유형, 데이터 분할과 누수, 기준 모델, 손실함수

## 목표 문제

온라인 서점이 "다음 달에 구독을 해지할 고객"을 예측하려 한다. 고객 2만 명의 2년치 기록에서 무엇을 특성으로, 무엇을 정답으로 삼을지 정하고, 이 문제가 정답이 있는 이진 분류라는 것을 확인한다. 데이터는 기준 시점 이전으로 학습하고 이후 기간으로 평가하며, 한 고객의 기록이 학습·평가 데이터에 나뉘어 들어가지 않게 한다. 해지한 뒤에야 기록되는 "해지 사유" 열은 누수이므로 뺀다. 그다음 "모두 해지하지 않는다"는 다수 클래스 기준 모델과 "지난달 접속이 없으면 해지"라는 단순한 규칙의 점수를 먼저 잰다. 모델은 교차 엔트로피로 학습하고, 놓친 해지 고객의 비율로 평가해 기준 모델과 비교한다.

## 학습 목표

- 데이터 표에서 특성·정답·샘플을 구분해 X와 y를 만들고, 모델·파라미터·하이퍼파라미터, 학습과 추론을 구분한다.
- 학습 신호를 기준으로 지도·비지도·자기지도·강화학습을 구분하고, 언어 모델을 만드는 단계마다 어느 패러다임인지 설명한다.
- 문제를 회귀·분류(이진·다중·다중 레이블)·군집화·이상 탐지 가운데 하나로 정하고, 모델 출력을 문제에 맞는 판정으로 바꾼다.
- 데이터를 학습·검증·테스트 데이터로 나누고, 층화·그룹·시간 분할을 상황에 맞게 고르며, 데이터 누수를 찾아 파이프라인으로 막는다.
- 기준 모델의 점수와 비교해 모델을 평가하고, 분할에 따른 점수의 흔들림과 구간별 오차 분석으로 다음 작업을 정한다.
- 손실함수와 목적함수를 정의하고, 예측→손실→기울기→갱신의 학습 루프를 구현하며, 학습 손실과 평가 지표가 다른 이유를 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [특성, 정답, 예측, 모델, 파라미터](#lesson-ml-terms) | 핵심 | 30분 | #51 특성, 정답, 예측, 모델, 파라미터 |
| 2 | [지도학습, 비지도학습, 자기지도학습, 강화학습](#lesson-learning-paradigms) | 핵심 | 30분 | #52 지도학습, 비지도학습, 자기지도학습, 강화학습 |
| 3 | [회귀, 분류, 군집화, 이상 탐지](#lesson-task-types) | 핵심 | 35분 | #53 회귀, 분류, 군집화, 이상 탐지 |
| 4 | [학습·검증·테스트 데이터와 데이터 누수](#lesson-data-splits) | 핵심 | 45분 | #54 학습·검증·테스트 데이터와 데이터 누수 |
| 5 | [기준 모델과 단순한 예측 기준](#lesson-baselines) | 핵심 | 45분 | #55 기준 모델과 단순한 예측 기준 |
| 6 | [손실함수, 목적함수, 학습과 추론](#lesson-loss-functions) | 핵심 | 45분 | #56 손실함수, 목적함수, 학습과 추론 |

## 핵심 레슨

<a id="lesson-ml-terms"></a>

### 1. 특성, 정답, 예측, 모델, 파라미터

핵심 · 30분 · [본문 원본](../../src/content/modules/ml-framing/ml-terms.ts) · [실습 원본](../../src/content/modules/ml-framing/labs/ml-terms.ts)

**학습 목표:** 데이터 표에서 특성과 정답(레이블)을 구분해 특성 행렬 X와 정답 벡터 y로 나누고, 모델·파라미터·하이퍼파라미터와 학습·추론을 구분하며, 선형 모델의 예측과 파라미터 수를 계산한다.

**쓰이는 곳:** 머신러닝의 모든 레슨과 라이브러리 문서는 이 용어로 쓰여 있다. scikit-learn은 X와 y로 "학습(fit)"하고 "예측(predict)"하며([4-1 기준 모델과 단순한 예측 기준](#lesson-baselines)), 언어 모델의 크기를 말하는 "파라미터 70억 개"도 같은 뜻의 파라미터다([6-3 트랜스포머의 크기 계산](6-3-llm-systems.md#lesson-transformer-params)).

**본문 절:** 특성과 정답 · 모델, 파라미터, 하이퍼파라미터 · 학습과 추론 · 목표는 새 데이터에서의 성능이다

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2

**실습**

- `ex1` 표를 X와 y로 나누고 선형 모델로 예측하기

**서술형**

- `d1` 모델·파라미터·하이퍼파라미터를 각각 정의하고, 선형 회귀 $\hat y = wx + b$를 경사하강법으로 학습하는 경우를 예로 들어 무엇이 각각에 해당하는지 구분하라. 학습과 추론의 차이도 함께 쓰라.

**참고 자료**

- [Google Machine Learning Crash Course — Supervised learning](https://developers.google.com/machine-learning/intro-to-ml/supervised) — 특성·레이블·모델·학습·추론 용어 (영문)
- [scikit-learn — Getting started](https://scikit-learn.org/stable/getting_started.html) — X·y와 fit·predict의 기본 사용법 (영문)

<a id="lesson-learning-paradigms"></a>

### 2. 지도학습, 비지도학습, 자기지도학습, 강화학습

핵심 · 30분 · [본문 원본](../../src/content/modules/ml-framing/learning-paradigms.ts) · [실습 원본](../../src/content/modules/ml-framing/labs/learning-paradigms.ts)

**학습 목표:** 학습 신호가 무엇인지를 기준으로 지도학습·비지도학습·자기지도학습·강화학습을 구분하고, 데이터에서 자기지도학습의 입력과 정답을 만들며, 언어 모델을 만드는 각 단계가 어느 패러다임인지 설명한다.

**쓰이는 곳:** 언어 모델은 대량의 텍스트로 다음 토큰을 맞히는 자기지도학습으로 사전학습하고([6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining)), 사람이 쓴 답변으로 지도학습한 뒤([6-2 지시 미세조정과 LoRA](6-2-llm-training.md#lesson-instruction-tuning)), 사람의 선호를 보상으로 쓰는 강화학습이나 그 변형으로 다듬는다([6-2 선호도 학습: RLHF와 DPO](6-2-llm-training.md#lesson-preference-learning)). 어떤 데이터와 신호가 있는지에 따라 쓸 수 있는 방법이 정해진다.

**본문 절:** 학습 신호로 구분한다 · 지도학습 · 비지도학습 · 자기지도학습 · 강화학습 · 언어 모델을 만드는 단계와 패러다임

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 1

**실습**

- `ex1` 텍스트에서 자기지도학습 샘플 만들기

**서술형**

- `d1` 지도학습·비지도학습·자기지도학습·강화학습을 학습 신호로 구분하고, 자기지도학습이 대규모 언어 모델의 사전학습에 쓰이는 이유를 정답을 붙이는 비용과 연결해 설명하라.

**참고 자료**

- [Google Machine Learning Crash Course — Intro to ML: types of ML systems](https://developers.google.com/machine-learning/intro-to-ml/what-is-ml) — 지도·비지도·강화학습과 생성형 AI (영문)
- [OpenAI Spinning Up — Key concepts in RL](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) — 에이전트·환경·보상·정책의 정의 (영문)

<a id="lesson-task-types"></a>

### 3. 회귀, 분류, 군집화, 이상 탐지

핵심 · 35분 · [본문 원본](../../src/content/modules/ml-framing/task-types.ts) · [실습 원본](../../src/content/modules/ml-framing/labs/task-types.ts)

**학습 목표:** 답의 모양을 기준으로 회귀·분류(이진·다중·다중 레이블)·군집화·이상 탐지·생성을 구분하고, 문제마다 모델 출력의 형태와 판정 방법을 정하며, 판별 모델과 생성 모델이 추정하는 대상을 구분한다.

**쓰이는 곳:** 문제의 유형이 정해져야 손실함수([4-1 손실함수, 목적함수, 학습과 추론](#lesson-loss-functions)), 평가 지표([4-2 혼동행렬, 정확도, 정밀도, 재현율, F1](4-2-linear-models.md#lesson-classification-metrics)), 기준 모델([4-1 기준 모델과 단순한 예측 기준](#lesson-baselines))을 고를 수 있다. 같은 데이터라도 "가격이 얼마인가"와 "1억을 넘는가"는 다른 유형의 문제다.

**본문 절:** 답의 모양으로 구분한다 · 분류의 세 가지 형태 · 군집화와 이상 탐지 · 판별 모델과 생성 모델

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2 · 그림 2

**실습**

- `ex1` 문제 유형에 맞게 모델 출력을 판정으로 바꾸기

**서술형**

- `d1` 온라인 쇼핑몰의 데이터로 풀 수 있는 문제를 회귀·분류·군집화·이상 탐지에서 하나씩 정의하고, 각 문제에서 모델의 출력이 어떤 모양이어야 하는지 쓰라.

**참고 자료**

- [scikit-learn — Choosing the right estimator](https://scikit-learn.org/stable/machine_learning_map.html) — 문제 유형과 데이터 크기에 따른 방법 선택 지도 (영문)
- [scikit-learn — Multiclass and multioutput algorithms](https://scikit-learn.org/stable/modules/multiclass.html) — 다중 분류와 다중 레이블 분류의 차이 (영문)

<a id="lesson-data-splits"></a>

### 4. 학습·검증·테스트 데이터와 데이터 누수

핵심 · 45분 · [본문 원본](../../src/content/modules/ml-framing/data-splits.ts) · [실습 원본](../../src/content/modules/ml-framing/labs/data-splits.ts)

**학습 목표:** 학습·검증·테스트 데이터의 역할을 구분해 데이터를 세 부분으로 나누고, 데이터 구조에 맞는 분할(층화·그룹·시간)을 고르며, 데이터 누수의 유형을 찾아 전처리를 학습 데이터로만 계산하는 파이프라인으로 막는다.

**쓰이는 곳:** 모델을 고르고 성능을 보고하는 결정은 모두 평가 점수에 근거한다. 분할이 데이터 구조와 맞지 않거나 누수가 있으면 평가 점수가 운영 환경의 성능보다 높게 나오고, 그 점수로 내린 결정도 틀린다. 교차검증([4-3 교차검증, 시계열 검증, 하이퍼파라미터 탐색](4-3-generalization.md#lesson-cross-validation))과 언어 모델 평가([6-3 LLM 평가와 안전성 평가](6-3-llm-systems.md#lesson-llm-evaluation))도 이 레슨의 원칙을 그대로 쓴다.

**본문 절:** 평가용 데이터를 검증 데이터와 테스트 데이터로 나눈다 · 고르는 데 쓴 점수는 실제보다 높다 · 데이터 구조에 맞게 나눈다 · 데이터 누수 · 파이프라인으로 순서를 고정한다

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 4 · 그림 2

**실습**

- `ex1` 세 부분 분할, 그룹 분할, 학습 데이터 통계로 표준화

**서술형**

- `d1` 하이퍼파라미터를 검증 데이터로 고른 뒤에도 테스트 데이터를 따로 두는 이유를, 여러 후보 가운데 가장 좋은 것을 고르는 과정과 연결해 설명하라. 테스트 점수를 보고 모델을 다시 고르면 무엇이 달라지는지도 쓰라.
- `d2` 환자 2,000명의 3년치 진료 기록 3만 건으로, 퇴원한 환자가 30일 안에 다시 입원할지 예측하는 모델을 만든다. 학습·검증·테스트 데이터를 나누는 방법을 정하고, 각 결정의 이유를 쓰라. 결측 대체와 표준화를 어느 데이터로 계산하는지도 쓰라.

**참고 자료**

- [scikit-learn — Common pitfalls and recommended practices](https://scikit-learn.org/stable/common_pitfalls.html) — 전처리 누수와 파이프라인 사용법 (영문)
- [scikit-learn — Cross-validation: evaluating estimator performance](https://scikit-learn.org/stable/modules/cross_validation.html) — 검증 데이터의 역할, 그룹·시계열 분할 (영문)
- [Kapoor & Narayanan — Leakage and the reproducibility crisis in ML-based science](https://reproducible.cs.princeton.edu/) — 논문에서 발견된 누수 유형 정리 (영문)

<a id="lesson-baselines"></a>

### 5. 기준 모델과 단순한 예측 기준

핵심 · 45분 · [본문 원본](../../src/content/modules/ml-framing/baselines.ts) · [실습 원본](../../src/content/modules/ml-framing/labs/baselines.ts)

**학습 목표:** 회귀·분류·시계열 문제에서 기준 모델(평균·중앙값·다수 클래스·직전 값)을 만들어 점수를 계산하고, 모델의 점수를 기준 모델과 비교해 해석하며, 분할에 따른 점수의 흔들림과 구간별 오차 분석으로 다음 작업을 정한다.

**쓰이는 곳:** 정확도 98%, 평균 오차 7천만 원 같은 숫자는 비교할 대상이 없으면 좋은지 나쁜지 알 수 없다. 기준 모델은 그 비교 대상이고, 모델을 만들기 전에 기준 모델의 점수부터 재 두면 코드 오류와 데이터 누수도 일찍 드러난다. 분류 지표([4-2 혼동행렬, 정확도, 정밀도, 재현율, F1](4-2-linear-models.md#lesson-classification-metrics))와 결정계수 $R^2$([4-2 선형회귀, 잔차, 평균제곱오차](4-2-linear-models.md#lesson-linear-regression))도 기준 모델과의 비교로 해석한다.

**본문 절:** 기준 모델 · 회귀: 평균을 예측하는 기준 모델 · 분류: 다수 클래스를 예측하는 기준 모델 · 시계열: 직전 값을 예측하는 기준 모델 · 기준 모델과의 비교로 오류를 찾는다 · 점수는 분할에 따라 흔들린다 · 오차 분석

**구성:** 확인 문제 4 · 출력 예측 1 · 서술형 2 · 실습 2 · 코드 셀 3

**실습**

- `ex1` 기준 모델 세 가지와 개선 비율
- `ex2` 구간별 오차 분석

**서술형**

- `d1` 어떤 팀이 "정확도 98%인 모델을 만들었다"고 보고했다. 이 숫자만으로 모델이 좋은지 판단할 수 없는 이유를 기준 모델과 연결해 설명하라. 회귀·분류·시계열 문제마다 함께 보고해야 할 기준 모델도 하나씩 쓰라.
- `d2` 배달 소요 시간 예측 모델의 검증 MAE가 9분이다. 오차 분석을 어떤 순서로 진행할지 쓰고, 분석 결과 비 오는 날의 오차가 다른 날의 세 배로 나왔을 때 할 수 있는 다음 작업을 두 가지 쓰라. 오차 분석에 테스트 데이터를 쓰지 않는 이유도 쓰라.

**참고 자료**

- [scikit-learn — Dummy estimators](https://scikit-learn.org/stable/modules/model_evaluation.html#dummy-estimators) — DummyClassifier·DummyRegressor의 전략 (영문)
- [Google — Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) — 단순한 기준부터 시작하기, 오차 분석에 관한 실무 규칙 (영문)
- [Hyndman & Athanasopoulos — Forecasting: Principles and Practice, Some simple forecasting methods](https://otexts.com/fpp3/simple-methods.html) — 평균·직전 값·계절 직전 값 기준 모델 (영문)

<a id="lesson-loss-functions"></a>

### 6. 손실함수, 목적함수, 학습과 추론

핵심 · 45분 · [본문 원본](../../src/content/modules/ml-framing/loss-functions.ts) · [실습 원본](../../src/content/modules/ml-framing/labs/loss-functions.ts)

**학습 목표:** 제곱 오차·절대 오차·교차 엔트로피를 계산하고 각 손실이 큰 오차를 어떻게 다루는지 설명하며, 평균 손실에 규제항을 더한 목적함수를 정의하고, 예측→손실→기울기→갱신으로 이루어진 학습 루프를 구현해 추론과 구분한다. 학습에 쓰는 손실과 보고에 쓰는 평가 지표가 다른 이유도 설명한다.

**쓰이는 곳:** 선형회귀부터 언어 모델까지 학습은 모두 "목적함수를 최소화하는 파라미터를 찾는 일"로 쓰인다. 모델마다 바뀌는 것은 함수의 형태와 손실함수이므로, 손실함수를 읽을 줄 알면 새 모델의 학습 방법도 같은 틀로 이해할 수 있다([4-2 선형회귀, 잔차, 평균제곱오차](4-2-linear-models.md#lesson-linear-regression), [4-2 로지스틱 회귀, 시그모이드, 분류 임계값](4-2-linear-models.md#lesson-logistic-regression), [6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining)).

**본문 절:** 손실함수: 샘플 하나의 오차를 수 하나로 · 목적함수: 학습이 최소화하는 식 · 학습 루프 · 추론 · 학습에 쓰는 손실과 평가 지표

**구성:** 확인 문제 4 · 출력 예측 1 · 서술형 2 · 실습 2 · 코드 셀 2 · 그림 2

**실습**

- `ex1` 손실함수 세 가지와 규제항이 있는 목적함수
- `ex2` 경사하강법 학습 루프와 추론

**서술형**

- `d1` 손실함수·목적함수·학습·추론을 각각 정의하라. 그리고 선형회귀와 언어 모델의 사전학습이 "같은 틀"로 학습된다는 말이 무슨 뜻인지, 두 경우에 무엇이 같고 무엇이 다른지로 설명하라.
- `d2` 사기 거래 탐지 모델을 교차 엔트로피로 학습하고 재현율로 보고하기로 했다. 학습 손실과 평가 지표를 다르게 쓰는 이유를 미분 가능성과 문제의 목적으로 설명하라.

**참고 자료**

- [Google Machine Learning Crash Course — Linear regression: Loss](https://developers.google.com/machine-learning/crash-course/linear-regression/loss) — 제곱 오차·절대 오차와 이상치 (영문)
- [Dive into Deep Learning — 3.1 Linear Regression](https://d2l.ai/chapter_linear-regression/linear-regression.html) — 손실함수, 경사하강법, 학습과 예측 (영문)
- [scikit-learn — Metrics and scoring](https://scikit-learn.org/stable/modules/model_evaluation.html) — 학습 손실과 다른 평가 지표 목록 (영문)

## 백지 복습

1. 특성·정답·모델·파라미터·하이퍼파라미터·손실함수·목적함수를 집값 예측을 예로 들어 정의하고, 학습 루프의 네 단계와 추론에서는 일어나지 않는 일을 쓰라.
2. 지도·비지도·자기지도·강화학습을 학습 신호로 구분하고, 언어 모델의 사전학습·지시 따르기 학습·선호 학습이 각각 어느 패러다임인지 쓰라.
3. 회귀·이진 분류·다중 분류·다중 레이블 분류·군집화·이상 탐지의 출력을 각각 쓰고, 다중 분류와 다중 레이블 분류에서 판정을 만드는 방법의 차이를 쓰라.
4. 학습·검증·테스트 데이터의 역할을 쓰고, 층화·그룹·시간 분할이 필요한 상황을 하나씩 쓰라. 데이터 누수의 유형 세 가지와 각각을 막는 방법도 쓰라.
5. 회귀·분류·시계열 문제의 기준 모델을 하나씩 쓰고, 한 번의 분할에서 나온 작은 점수 차이로 모델을 고르면 안 되는 이유를 쓰라. 분류 모델을 교차 엔트로피로 학습하면서 정확도나 재현율로 평가하는 이유도 쓰라.
