<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 4-3 일반화와 검증

[전체 목차](README.md) · 트랙 4 머신러닝 기초 · [모듈 원본](../../src/content/modules/generalization/index.ts)

편향과 분산, 규제·조기 종료·학습 곡선, 교차검증과 하이퍼파라미터 탐색

## 목표 문제

샘플 30개로 사인 곡선을 학습한 12차 다항식이 학습 오차는 0.009인데 검증 오차는 45를 넘는다. 학습 오차와 검증 오차를 비교해 과적합으로 진단하고, 학습 데이터를 바꿔 반복 학습한 시뮬레이션으로 오차의 대부분이 분산이라는 것을 확인한다. Ridge 규제의 세기와 경사하강법의 반복 횟수를 검증 오차로 고르고, 학습 곡선으로 데이터를 더 모으면 나아지는지 판단한다. 마지막으로 전처리를 넣은 파이프라인을 K-Fold로 교차검증하며 하이퍼파라미터를 탐색하고, 고른 모델은 떼어 둔 테스트 데이터로 한 번 평가한다.

## 학습 목표

- 학습 오차와 검증 오차로 과적합과 과소적합을 진단하고, 반복 학습한 예측에서 편향의 제곱과 분산을 계산한다.
- L1·L2 규제가 가중치를 줄이는 방식의 차이를 설명하고, 규제 세기와 조기 종료 시점을 검증 오차로 고른다.
- 학습 곡선으로 데이터를 더 모을지 모델을 바꿀지 판단한다.
- K-Fold·층화·그룹·시계열 교차검증을 데이터 구조에 맞게 고르고, 파이프라인을 교차검증한다.
- GridSearchCV·RandomizedSearchCV로 하이퍼파라미터를 고르고, best_score_가 낙관적인 이유와 최종 성능을 재는 방법을 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [일반화, 과적합, 과소적합, 편향과 분산](#lesson-bias-variance) | 핵심 | 40분 | #61 일반화, 과적합, 과소적합, 편향·분산 |
| 2 | [L1·L2 규제, 조기 종료, 학습 곡선](#lesson-regularization) | 핵심 | 40분 | #62 L1·L2 규제, 조기 종료, 학습 곡선 |
| 3 | [교차검증, 시계열 검증, 하이퍼파라미터 탐색](#lesson-cross-validation) | 핵심 | 45분 | #63 교차검증, 시계열 검증, 하이퍼파라미터 탐색 |
| 4 | [편향-분산 분해의 유도와 이중 하강](#lesson-bias-variance-theory) | 심화 | 30분 | — |
| 5 | [모델 평가의 통계: 선택 편향과 짝지은 비교](#lesson-model-evaluation-stats) | 심화 | 35분 | — |

## 핵심 레슨

<a id="lesson-bias-variance"></a>

### 1. 일반화, 과적합, 과소적합, 편향과 분산

핵심 · 40분 · [본문 원본](../../src/content/modules/generalization/bias-variance.ts) · [실습 원본](../../src/content/modules/generalization/labs/bias-variance.ts)

**학습 목표:** 학습 오차와 검증 오차로 과적합과 과소적합을 진단하고, 같은 모델을 여러 학습 데이터로 반복 학습한 예측에서 편향의 제곱과 분산을 계산하며, 모델 복잡도에 따라 두 성분이 어떻게 바뀌는지 설명한다.

**쓰이는 곳:** 오차가 크다는 증상이 같아도 원인이 편향인지 분산인지에 따라 처방이 반대다. 규제([4-3 L1·L2 규제, 조기 종료, 학습 곡선](#lesson-regularization)), 교차검증([4-3 교차검증, 시계열 검증, 하이퍼파라미터 탐색](#lesson-cross-validation)), 랜덤 포레스트와 부스팅([4-4 k최근접 이웃, 결정트리, 랜덤 포레스트](4-4-ml-algorithms.md#lesson-knn-trees), [4-4 그래디언트 부스팅, 특성 중요도](4-4-ml-algorithms.md#lesson-boosting))은 모두 이 진단에서 출발하고, 신경망의 드롭아웃과 데이터 증강([5-2 드롭아웃과 잔차 연결](5-2-deep-training.md#lesson-dropout-residual))도 분산을 줄이는 방법이다.

**본문 절:** 일반화와 두 가지 실패 · 복잡도에 따른 학습 오차와 검증 오차 · 편향과 분산 · 처방은 원인에 따라 다르다

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 3

**실습**

- `ex1` 편향²과 분산을 시뮬레이션으로 계산하기

**서술형**

- `d1` 학습 오차 0.01, 검증 오차 0.30인 모델을 편향과 분산으로 진단하고, 처방 두 가지를 이유와 함께 쓰라. 학습 오차와 검증 오차가 둘 다 0.30이었다면 진단과 처방이 어떻게 달라지는지도 쓰라.
- `d2` 모델의 복잡도(다항식 차수 등)를 높이면 분산이 커지는 이유를, 학습 데이터가 바뀔 때 예측이 어떻게 달라지는가로 설명하라.

**참고 자료**

- [MLU-Explain — The Bias Variance Tradeoff](https://mlu-explain.github.io/bias-variance/) — 복잡도를 바꾸며 편향과 분산을 보는 시각 자료 (영문)
- [ISLP (An Introduction to Statistical Learning with Python) — 2.2 Assessing Model Accuracy](https://www.statlearning.com/) — 학습·검증 오차와 편향-분산 분해 (영문, 무료 PDF)

<a id="lesson-regularization"></a>

### 2. L1·L2 규제, 조기 종료, 학습 곡선

핵심 · 40분 · [본문 원본](../../src/content/modules/generalization/regularization.ts) · [실습 원본](../../src/content/modules/generalization/labs/regularization.ts)

**학습 목표:** L2·L1 규제가 가중치를 줄이는 방식과 L1이 희소한 해를 만드는 이유를 설명하고, 규제 세기를 바꿔 가며 검증 오차로 고르며, 검증 손실로 학습을 멈추는 조기 종료를 구현하고, 학습 곡선으로 데이터를 더 모을지 모델을 바꿀지 판단한다.

**쓰이는 곳:** 분산이 큰 모델을 고치는 가장 흔한 방법이 규제다([4-3 일반화, 과적합, 과소적합, 편향과 분산](#lesson-bias-variance)). 신경망 학습의 가중치 감쇠와 조기 종료([5-2 가중치 감쇠와 학습률 스케줄](5-2-deep-training.md#lesson-training-schedules)), 드롭아웃([5-2 드롭아웃과 잔차 연결](5-2-deep-training.md#lesson-dropout-residual))도 같은 목적으로 쓴다. 학습 곡선은 데이터를 더 모을지, 모델을 바꿀지라는 비용이 큰 결정을 내리는 근거가 된다.

**본문 절:** 목적함수에 규제항을 더한다 · L2와 L1의 차이: 희소성 · 규제 세기 고르기 · 조기 종료 · 학습 곡선: 데이터를 늘리면 나아지는가

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 2

**실습**

- `ex1` Ridge 닫힌 해, L1의 0 만들기, 조기 종료

**서술형**

- `d1` L1 규제와 L2 규제가 가중치에 주는 영향의 차이를 규제항의 기울기로 설명하고, 관계없는 특성이 많이 섞인 데이터에서 어느 쪽을 쓰는 것이 유리한지 쓰라.
- `d2` Ridge의 `alpha`를 바꾼 실험에서 검증 오차가 U자 모양을 그린 이유를 편향과 분산으로 설명하고, 다항식 차수를 낮추는 것과 규제를 강하게 하는 것의 같은 점과 다른 점을 하나씩 쓰라.

**참고 자료**

- [ISLP (An Introduction to Statistical Learning with Python) — 6.2 Shrinkage Methods](https://www.statlearning.com/) — Ridge·Lasso와 계수 경로 (영문, 무료 PDF)
- [scikit-learn — Plotting learning curves](https://scikit-learn.org/stable/modules/learning_curve.html) — 검증 곡선과 학습 곡선 (영문)
- [Goodfellow, Bengio, Courville — Deep Learning, 7.8 Early Stopping](https://www.deeplearningbook.org/contents/regularization.html) — 조기 종료와 L2 규제의 관계 (영문)

<a id="lesson-cross-validation"></a>

### 3. 교차검증, 시계열 검증, 하이퍼파라미터 탐색

핵심 · 45분 · [본문 원본](../../src/content/modules/generalization/cross-validation.ts) · [실습 원본](../../src/content/modules/generalization/labs/cross-validation.ts)

**학습 목표:** K-Fold 교차검증으로 모든 샘플을 한 번씩 검증에 쓰고, 층화·그룹·시계열 분할을 데이터 구조에 맞게 고르며, 전처리를 포함한 파이프라인을 교차검증하고, GridSearchCV·RandomizedSearchCV로 하이퍼파라미터를 고른 뒤 best_score_가 낙관적인 이유를 설명한다.

**쓰이는 곳:** 검증 데이터를 한 번만 떼어 두면 데이터가 적을 때 점수가 그 분할에 크게 좌우된다([4-1 기준 모델과 단순한 예측 기준](4-1-ml-framing.md#lesson-baselines)). 교차검증은 같은 데이터로 더 안정된 추정을 얻는 방법이고, 하이퍼파라미터 탐색과 모델 비교의 기본 절차다. 두 모델의 점수 차이를 통계적으로 판단하는 방법은 [4-3 모델 평가의 통계: 선택 편향과 짝지은 비교](#lesson-model-evaluation-stats)에서 다룬다.

**본문 절:** K-Fold 교차검증 · 파이프라인을 교차검증한다 · 그룹과 시간이 있는 데이터 · 하이퍼파라미터 탐색

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 2 · 코드 셀 3 · 그림 2

**실습**

- `ex1` K-Fold 분할과 fold마다 학습 부분으로 표준화하기
- `ex2` 그룹 누수 측정과 하이퍼파라미터 탐색

**서술형**

- `d1` K-Fold 교차검증에서 K를 5에서 10으로 늘릴 때의 장점과 단점을 쓰고, GridSearchCV의 best_score_를 최종 성능으로 보고하면 안 되는 이유와 대신 할 일을 쓰라.

**참고 자료**

- [scikit-learn — Cross-validation: evaluating estimator performance](https://scikit-learn.org/stable/modules/cross_validation.html) — K-Fold·Stratified·Group·TimeSeriesSplit (영문)
- [scikit-learn — Tuning the hyper-parameters of an estimator](https://scikit-learn.org/stable/modules/grid_search.html) — GridSearchCV·RandomizedSearchCV와 파이프라인 파라미터 이름 (영문)
- [Bergstra & Bengio (2012) — Random Search for Hyper-Parameter Optimization](https://www.jmlr.org/papers/v13/bergstra12a.html) — 무작위 탐색이 격자 탐색보다 효율적인 이유 (영문)

## 심화 레슨

<a id="lesson-bias-variance-theory"></a>

### 4. 편향-분산 분해의 유도와 이중 하강

심화 · 30분 · [본문 원본](../../src/content/modules/generalization/bias-variance-theory.ts) · [실습 원본](../../src/content/modules/generalization/labs/bias-variance-theory.ts)

**학습 목표:** 제곱 오차의 편향-분산 분해를 유도하고, 상관된 예측의 평균 분산 $\rho\sigma^2 + (1-\rho)\sigma^2/B$로 랜덤 포레스트를 설명하며, 최소 노름 보간에서 이중 하강이 생기는 원인을 특이값으로 설명할 수 있다.

**쓰이는 곳:** 편향-분산 분해가 어떤 가정에서 성립하는지 알면, 분류 정확도처럼 분해가 성립하지 않는 경우와 줄일 수 없는 잡음의 한계를 구분할 수 있다. 앙상블의 분산 공식은 랜덤 포레스트의 설계를 설명하고([4-4 k최근접 이웃, 결정트리, 랜덤 포레스트](4-4-ml-algorithms.md#lesson-knn-trees)), 이중 하강은 파라미터가 데이터보다 많은 신경망과 언어 모델의 일반화를 이해하는 출발점이다([6-2 스케일링 법칙](6-2-llm-training.md#lesson-scaling-laws)).

**본문 절:** 유도 · 예측의 평균과 분산: 랜덤 포레스트가 특성을 무작위로 고르는 이유 · U자 곡선 너머: 이중 하강

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 최소 노름 보간과 이중 하강

**서술형**

- `d1` 제곱 오차의 기댓값이 편향의 제곱 + 분산 + 잡음으로 나뉘는 과정을 잡음 분리와 편향·분산 분리의 두 단계로 유도하라. 최소 노름 최소제곱에서 파라미터 수가 샘플 수와 같아질 때 테스트 오차가 매우 커지는 이유도 쓰라.

**참고 자료**

- [Belkin et al. (2019) — Reconciling modern machine learning practice and the bias-variance trade-off](https://arxiv.org/abs/1812.11118) — 이중 하강을 처음 체계적으로 제시한 논문 (영문)
- [Nakkiran et al. (2019) — Deep Double Descent](https://arxiv.org/abs/1912.02292) — 신경망에서의 모델 크기·학습 시간에 따른 이중 하강 (영문)
- [ISLP 8.2절 — Bagging, Random Forests](https://www.statlearning.com/) — 상관된 트리의 평균과 특성 무작위 선택 (영문, 무료 PDF)

<a id="lesson-model-evaluation-stats"></a>

### 5. 모델 평가의 통계: 선택 편향과 짝지은 비교

심화 · 35분 · [본문 원본](../../src/content/modules/generalization/model-evaluation-stats.ts) · [실습 원본](../../src/content/modules/generalization/labs/model-evaluation-stats.ts)

**학습 목표:** fold 표준편차의 의미와 한계를 설명하고, 튜닝 점수의 선택 편향을 중첩 교차검증으로 바로잡으며, 반복 교차검증의 짝지은 차이에 보정된 t 검정을 적용할 수 있다.

**쓰이는 곳:** 교차검증 점수로 하이퍼파라미터를 고르고 두 모델을 비교할 때, 점수의 잡음과 고르는 과정의 편향을 고려하지 않으면 우연한 차이를 개선으로 보고하게 된다. 논문과 벤치마크의 비교 결과를 읽을 때와 언어 모델 평가 결과의 차이를 해석할 때([6-3 LLM 평가의 통계](6-3-llm-systems.md#lesson-eval-statistics))도 같은 원칙을 쓴다.

**본문 절:** fold 표준편차는 신뢰구간이 아니다 · 선택 편향과 중첩 교차검증 · 두 모델의 우열: 짝지은 비교와 보정된 t 검정

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 그림 5

**실습**

- `ex1` 짝지은 비교: 단순 t, 보정 t, McNemar

**서술형**

- `d1` `GridSearchCV`의 `best_score_`가 실제 성능보다 낙관적인 이유는? 중첩 교차검증이 무엇을 평가하는지, 반복 교차검증의 짝지은 차이에 단순 t 검정을 쓰면 왜 안 되는지 설명하라.
- `d2` 어느 팀이 샘플 300개로 하이퍼파라미터 조합 50개를 5-Fold 교차검증으로 비교한 뒤 "최고 조합의 정확도 0.91이 기준 모델(0.89)보다 높다"고 보고했다. 이 주장의 문제를 두 가지 이상 쓰고, 같은 데이터로 더 믿을 수 있는 결론을 얻는 절차를 쓰라.

**참고 자료**

- [Nadeau & Bengio (2003) — Inference for the Generalization Error](https://link.springer.com/article/10.1023/A:1024068626366) — 반복 교차검증의 보정된 t 검정 (영문, 연구 논문)
- [Cawley & Talbot (2010) — On Over-fitting in Model Selection](https://jmlr.org/papers/v11/cawley10a.html) — 모델 선택 과정의 과적합과 중첩 교차검증 (영문)
- [scikit-learn — Nested versus non-nested cross-validation](https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html) — 선택 편향을 그림으로 보여 주는 공식 예제

## 백지 복습

1. 편향과 분산을 학습 데이터를 바꿔 반복 학습한 예측으로 정의하고, 복잡도를 높일 때 학습 오차와 검증 오차가 어떻게 바뀌는지 과소적합·과적합과 연결해 쓰라.
2. L1 규제와 L2 규제가 가중치를 줄이는 방식의 차이를 규제항의 기울기로 쓰고, 조기 종료가 무엇을 기준으로 어느 시점의 파라미터를 남기는지 쓰라.
3. 학습 곡선에서 분산이 큰 모델과 편향이 큰 모델이 어떻게 다르게 보이는지 쓰고, 각각 데이터를 더 모으는 것이 도움이 되는지 쓰라.
4. K-Fold 교차검증의 절차와 fold 점수의 표준편차를 신뢰구간으로 보면 안 되는 이유를 쓰고, GroupKFold와 TimeSeriesSplit이 필요한 경우를 하나씩 쓰라.
5. GridSearchCV가 하는 일과 best_score_가 실제 성능보다 낙관적인 이유를 쓰고, 고른 모델의 성능을 보고하는 방법 두 가지를 쓰라.
