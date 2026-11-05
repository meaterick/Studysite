<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 4-2 선형 모델과 평가 지표

[전체 목차](README.md) · 트랙 4 머신러닝 기초 · [모듈 원본](../../src/content/modules/linear-models/index.ts)

선형회귀와 잔차, 로지스틱 회귀와 임계값, 분류 지표, ROC·PR 곡선과 불균형

## 목표 문제

면적과 역까지 거리로 집값을 예측하는 선형회귀를 최소제곱으로 학습하고, 가중치를 "거리가 같을 때 면적 1m²당 가격"으로 읽는다. 잔차 그래프에서 곡선 모양이 보이면 다항 특성을 추가하고, MAE·RMSE·$R^2$로 평균 기준 모델과 비교한다. 스팸 분류는 로지스틱 회귀로 스팸일 확률을 내고, 혼동행렬에서 정밀도와 재현율을 계산한다. 임계값을 바꿔 가며 두 지표가 반대로 움직이는 것을 확인하고, 스팸이 드문 메일함에서는 ROC-AUC와 함께 PR 곡선과 평균 정밀도로 모델을 비교한다.

## 학습 목표

- 다중 선형회귀의 가중치를 해석하고 최소제곱 해를 계산하며, 잔차 그래프로 모델을 진단해 다항 특성을 추가한다.
- MAE·MSE·RMSE·$R^2$를 계산해 평균 기준 모델과 비교하고, 평가 데이터에서 $R^2$가 음수가 되는 경우를 해석한다.
- 로지스틱 회귀의 확률·로그 오즈·결정 경계를 설명하고, 기울기 $(p - y)x$로 학습하며, 소프트맥스 회귀로 다중 분류를 한다.
- 혼동행렬에서 정확도·정밀도·재현율·F1·특이도를 계산하고, 오류 비용에 따라 우선할 지표와 임계값을 움직일 방향을 정한다.
- ROC 곡선·AUC와 PR 곡선·평균 정밀도를 계산·해석하고, 양성이 드문 데이터에서 두 지표의 차이와 불균형 데이터를 다루는 방법을 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [선형회귀, 잔차, 평균제곱오차](#lesson-linear-regression) | 핵심 | 45분 | #57 선형회귀, 잔차, MSE·MAE·RMSE·R² |
| 2 | [로지스틱 회귀, 시그모이드, 분류 임계값](#lesson-logistic-regression) | 핵심 | 40분 | #58 로지스틱·소프트맥스 회귀, 시그모이드, 분류 임계값 |
| 3 | [혼동행렬, 정확도, 정밀도, 재현율, F1](#lesson-classification-metrics) | 핵심 | 35분 | #59 혼동행렬, 정확도, 정밀도, 재현율, F1 |
| 4 | [ROC-AUC, PR-AUC, 클래스 불균형](#lesson-roc-pr) | 핵심 | 40분 | #60 ROC-AUC, PR-AUC, 클래스 불균형 |
| 5 | [비용 기반 임계값과 확률 보정](#lesson-cost-threshold) | 보충 | 25분 | — |
| 6 | [손실함수의 확률적 기원](#lesson-loss-likelihood) | 심화 | 35분 | — |

## 핵심 레슨

<a id="lesson-linear-regression"></a>

### 1. 선형회귀, 잔차, 평균제곱오차

핵심 · 45분 · [본문 원본](../../src/content/modules/linear-models/linear-regression.ts) · [실습 원본](../../src/content/modules/linear-models/labs/linear-regression.ts)

**학습 목표:** 다중 선형회귀의 가중치를 해석하고 최소제곱 해를 계산하며, 잔차 그래프로 모델을 진단해 다항 특성을 추가하고, MAE·MSE·RMSE·$R^2$로 평가해 기준 모델과 비교한다.

**쓰이는 곳:** 선형회귀는 가장 단순한 지도학습 모델이면서, 가중치를 직접 읽을 수 있어 결과를 설명하기 쉽다. 학습 방법(손실 최소화)과 진단 방법(잔차)은 로지스틱 회귀([4-2 로지스틱 회귀, 시그모이드, 분류 임계값](#lesson-logistic-regression))와 신경망([5-1 퍼셉트론, 다층 신경망, 활성화 함수](5-1-neural-networks.md#lesson-perceptron-mlp))에도 그대로 이어지고, 신경망의 각 층도 선형 변환에 비선형 함수를 붙인 것이다.

**본문 절:** 선형회귀 모델 · 최소제곱 해 · 잔차로 진단한다 · 회귀 지표

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 2 · 코드 셀 2 · 그림 2

**실습**

- `ex1` 최소제곱 해와 잔차
- `ex2` 회귀 지표와 평균 기준 모델

**서술형**

- `d1` $R^2$를 평균제곱오차와 기준 모델로 설명하고, 테스트 데이터에서 $R^2$가 음수로 나오는 경우가 무엇을 뜻하는지 쓰라. 정답 $y = [3, 5, 7, 9]$, 예측 $[2.5, 5.5, 6, 10]$의 $R^2$도 계산하라.
- `d2` 잔차 그래프에서 볼 수 있는 모양 세 가지(고르게 퍼짐, 곡선, 깔때기)가 각각 무엇을 뜻하는지 쓰고, 곡선과 깔때기 모양일 때 할 수 있는 조치를 하나씩 쓰라.

**참고 자료**

- [ISLP (An Introduction to Statistical Learning with Python) — 3장 Linear Regression](https://www.statlearning.com/) — 가중치 해석, 잔차 그래프, 다항회귀 (영문, 무료 PDF)
- [scikit-learn — Linear Models: Ordinary Least Squares](https://scikit-learn.org/stable/modules/linear_model.html#ordinary-least-squares) — LinearRegression과 최소제곱 (영문)
- [scikit-learn — Regression metrics](https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics) — MAE·MSE·R²의 정의 (영문)

<a id="lesson-logistic-regression"></a>

### 2. 로지스틱 회귀, 시그모이드, 분류 임계값

핵심 · 40분 · [본문 원본](../../src/content/modules/linear-models/logistic-regression.ts) · [실습 원본](../../src/content/modules/linear-models/labs/logistic-regression.ts)

**학습 목표:** 시그모이드로 점수를 확률로 바꾸고 가중치를 로그 오즈로 해석하며, 분류 임계값과 결정 경계의 관계를 설명하고, 이진 교차 엔트로피의 기울기 $(p - y)x$를 유도해 경사하강법으로 학습한다. 다중 분류로 확장한 소프트맥스 회귀의 확률과 기울기도 계산한다.

**쓰이는 곳:** 로지스틱 회귀는 확률을 출력하는 가장 기본적인 분류 모델이라 분류 문제의 기준 모델로 자주 쓰인다. 신경망 분류기의 마지막 층과 언어 모델이 다음 토큰의 확률을 계산하는 출력층이 소프트맥스 회귀와 같은 형태이고([6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining)), 기울기 $(p - y)x$는 역전파에서 그대로 다시 나온다([5-1 순전파, 역전파, 계산 그래프](5-1-neural-networks.md#lesson-backprop)).

**본문 절:** 점수를 확률로 바꾸는 시그모이드 · 분류 임계값과 결정 경계 · 교차 엔트로피와 기울기 $(p - y)x$ · 다중 분류: 소프트맥스 회귀

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 2 · 코드 셀 2 · 그림 2

**실습**

- `ex1` 로지스틱 회귀의 손실과 기울기 (p − y)x
- `ex2` 소프트맥스 회귀로 세 클래스 분류하기

**서술형**

- `d1` 로지스틱 회귀의 손실 $L = -[\,y\log p + (1-y)\log(1-p)\,]$를 점수 $z$로 미분하면 $p - y$가 되는 과정을 쓰고, 정답이 1인 샘플에 $p = 0.7$을 예측했을 때 경사하강법이 가중치를 어느 방향으로 바꾸는지 설명하라.

**참고 자료**

- [CS229 Lecture Notes — Classification and logistic regression](https://cs229.stanford.edu/main_notes.pdf) — 로지스틱 회귀와 기울기 유도, 소프트맥스 회귀 (영문)
- [scikit-learn — Logistic regression](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression) — 규제 옵션 C, 다중 분류 (영문)
- [Dive into Deep Learning — 4.1 Softmax Regression](https://d2l.ai/chapter_linear-classification/softmax-regression.html) — 소프트맥스와 교차 엔트로피의 기울기 (영문)

<a id="lesson-classification-metrics"></a>

### 3. 혼동행렬, 정확도, 정밀도, 재현율, F1

핵심 · 35분 · [본문 원본](../../src/content/modules/linear-models/classification-metrics.ts) · [실습 원본](../../src/content/modules/linear-models/labs/classification-metrics.ts)

**학습 목표:** 혼동행렬에서 정확도·정밀도·재현율·F1·특이도를 계산하고, 오류 비용에 따라 우선할 지표를 고르며, 분류 임계값을 바꿀 때 정밀도와 재현율이 어떻게 달라지는지 설명하고, 다중 분류의 macro·weighted 평균을 해석한다.

**쓰이는 곳:** 분류 모델의 성능을 정확도 하나로 보고하면 불균형한 데이터에서 아무것도 찾지 못하는 모델도 좋아 보인다([4-1 기준 모델과 단순한 예측 기준](4-1-ml-framing.md#lesson-baselines)). 어떤 오류가 더 비싼지에 따라 봐야 할 지표가 다르고, 같은 모델도 임계값에 따라 지표가 바뀐다. 이 레슨의 지표는 ROC·PR 곡선([4-2 ROC-AUC, PR-AUC, 클래스 불균형](#lesson-roc-pr))과 언어 모델의 분류형 평가([6-3 LLM 평가와 안전성 평가](6-3-llm-systems.md#lesson-llm-evaluation))에서도 그대로 쓴다.

**본문 절:** 혼동행렬 · 지표 다섯 가지 · 임계값에 따라 지표가 바뀐다 · 다중 분류: macro 평균과 weighted 평균

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 혼동행렬과 임계값별 정밀도·재현율

**서술형**

- `d1` 양성이 1%인 데이터에서 항상 음성으로 판정하는 모델의 정확도와 재현율을 쓰고, 이 예를 근거로 불균형한 분류 문제에서 성능을 보고할 때 함께 적어야 할 것을 쓰라.
- `d2` 스팸 필터와 암 검진 모델에서 각각 어떤 오류가 더 비싼지 쓰고, 그에 따라 우선할 지표와 임계값을 움직일 방향을 쓰라. F1이 산술평균이 아니라 조화평균인 이유도 쓰라.

**참고 자료**

- [Google Machine Learning Crash Course — Classification: Accuracy, recall, precision](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) — 지표의 정의와 임계값의 관계 (영문)
- [scikit-learn — Classification metrics](https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics) — confusion_matrix, classification_report, macro·weighted 평균 (영문)

<a id="lesson-roc-pr"></a>

### 4. ROC-AUC, PR-AUC, 클래스 불균형

핵심 · 40분 · [본문 원본](../../src/content/modules/linear-models/roc-pr.ts) · [실습 원본](../../src/content/modules/linear-models/labs/roc-pr.ts)

**학습 목표:** 임계값을 바꿔 가며 ROC 곡선을 그리고 AUC를 순위 확률로 해석하며, PR 곡선과 평균 정밀도(AP)를 계산하고, 양성이 드문 데이터에서 두 지표가 다르게 반응하는 이유를 설명한다. 불균형 데이터를 다루는 방법을 상황에 맞게 고른다.

**쓰이는 곳:** 특정 임계값 하나의 정밀도·재현율만으로는 임계값을 다르게 정했을 때의 성능을 알 수 없다([4-2 혼동행렬, 정확도, 정밀도, 재현율, F1](#lesson-classification-metrics)). ROC 곡선과 PR 곡선은 모든 임계값을 한 번에 요약해 모델을 비교하는 데 쓰이고, 사기 탐지·질병 선별처럼 양성이 드문 문제에서는 어느 곡선을 보느냐에 따라 결론이 달라진다. 비용으로 임계값 하나를 정하는 일은 [4-2 비용 기반 임계값과 확률 보정](#lesson-cost-threshold)에서 다룬다.

**본문 절:** ROC 곡선 · AUC는 순위를 맞힐 확률이다 · PR 곡선과 평균 정밀도 · 양성이 드물면 두 지표가 다르게 반응한다 · 불균형 데이터를 다루는 방법

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 3

**실습**

- `ex1` ROC 곡선, AUC, 평균 정밀도를 직접 계산하기

**서술형**

- `d1` 양성 샘플 2개(점수 0.9, 0.6)와 음성 샘플 3개(점수 0.8, 0.5, 0.2)로 AUC를 순위 확률의 정의로 계산하라. 그리고 AUC가 임계값과 관계없는 하나의 수로 나오는 이유를 정밀도·재현율과 비교해 쓰라.
- `d2` 재현율 0.9, FPR 0.05인 같은 분류기를 양성 비율이 1%인 병원과 20%인 병원에 썼다. 1만 명 기준으로 각 병원의 정밀도를 계산하고, ROC-AUC는 같은데 정밀도가 크게 다른 이유를 쓰라.

**참고 자료**

- [Google Machine Learning Crash Course — Classification: ROC and AUC](https://developers.google.com/machine-learning/crash-course/classification/roc-and-auc) — ROC 곡선과 AUC의 정의 (영문)
- [Saito & Rehmsmeier (2015) — The Precision-Recall Plot Is More Informative than the ROC Plot When Evaluating Binary Classifiers on Imbalanced Datasets](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0118432) — 불균형 데이터에서 PR 곡선을 보는 이유 (영문)
- [scikit-learn — Precision-Recall](https://scikit-learn.org/stable/auto_examples/model_selection/plot_precision_recall.html) — PR 곡선과 평균 정밀도 계산 (영문)

## 보충 레슨

<a id="lesson-cost-threshold"></a>

### 5. 비용 기반 임계값과 확률 보정

보충 · 25분 · [본문 원본](../../src/content/modules/linear-models/cost-threshold.ts) · [실습 원본](../../src/content/modules/linear-models/labs/cost-threshold.ts)

**학습 목표:** 두 오류의 비용으로 임계값 $t^* = C_{FP}/(C_{FP}+C_{FN})$을 유도·계산하고, 클래스 가중치가 예측 확률에 주는 영향을 설명하며, 신뢰도 표와 브라이어 점수로 확률 보정을 점검한다.

**쓰이는 곳:** 사기 거래를 놓치는 비용과 정상 거래를 막는 비용이 다르면 임계값 0.5는 비용을 최소로 만들지 않는다. 비용으로 임계값을 정하려면 모델의 확률이 실제 빈도와 맞아야 하므로, 확률을 위험도 설명이나 의사결정에 쓰는 모든 경우에 보정을 함께 확인한다.

**본문 절:** 비용으로 임계값을 정하기 · class_weight와 확률 보정

**구성:** 확인 문제 5 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 비용 기반 임계값과 신뢰도 표

**서술형**

- `d1` 놓치는 비용 $C_{FN}$과 오경보 비용 $C_{FP}$로 최적 임계값 $t^*$를 유도하고, 이 공식이 성립하려면 무엇이 필요한지 쓰라. `class_weight="balanced"`로 학습한 모델에 이 공식을 그대로 쓰면 안 되는 이유도 쓰라.

**참고 자료**

- [scikit-learn — Probability calibration](https://scikit-learn.org/stable/modules/calibration.html) — 신뢰도 곡선·Platt 스케일링·등위 회귀
- [Saito & Rehmsmeier (2015) — The Precision-Recall Plot Is More Informative than the ROC Plot](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0118432) — 불균형 데이터에서 PR 곡선을 보는 이유 (영문)

## 심화 레슨

<a id="lesson-loss-likelihood"></a>

### 6. 손실함수의 확률적 기원

심화 · 35분 · [본문 원본](../../src/content/modules/linear-models/loss-likelihood.ts) · [실습 원본](../../src/content/modules/linear-models/labs/loss-likelihood.ts)

**학습 목표:** 가우시안·베르누이 가능도에서 MSE와 교차 엔트로피를 유도하고, L2·L1 정규화를 가우시안·라플라스 사전분포의 MAP로 설명하며, 로지스틱 손실의 볼록성과 선형분리 데이터에서의 발산을 분석할 수 있다.

**쓰이는 곳:** 손실함수와 규제를 확률 모델의 가정으로 이해하면, 이상치가 많은 데이터나 새로운 형태의 출력처럼 정해진 규칙이 없는 상황에서도 손실을 직접 정할 수 있다. 언어 모델의 학습 목표인 다음 토큰의 음의 로그가능도와 그 평가에 쓰는 퍼플렉시티도 같은 원리에서 나온다([6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining)).

**본문 절:** MSE = 가우시안 잡음의 음의 로그가능도 · 교차 엔트로피 = 베르누이·범주 분포의 음의 로그가능도 · 정규화 = 사전분포를 넣은 MAP · 로지스틱 손실의 볼록성과 선형분리 데이터

**구성:** 확인 문제 6 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 4

**실습**

- `ex1` Ridge = MAP, 로지스틱 손실의 헤세 행렬

**서술형**

- `d1` 잡음이 정규분포라고 가정하면 최대가능도 추정이 MSE 최소화와 같아지는 이유를 유도하라. L2 정규화가 어떤 사전분포의 MAP와 같은지, 그때 $\lambda$가 무엇으로 정해지는지도 설명하라.

**참고 자료**

- [Bishop — Pattern Recognition and Machine Learning, 3.1·4.3절](https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/) — 최대가능도·MAP로 본 선형회귀와 로지스틱 회귀 (영문, 무료 PDF)
- [Soudry et al. (2018) — The Implicit Bias of Gradient Descent on Separable Data](https://arxiv.org/abs/1710.10345) — 규제 없는 로지스틱 회귀가 최대 마진 방향으로 수렴함을 증명 (영문, 연구 논문)

## 백지 복습

1. 선형회귀의 가중치를 해석하는 방법과 최소제곱 해의 식을 쓰고, 잔차 그래프의 곡선·깔때기 모양이 각각 무엇을 뜻하는지 쓰라. $R^2$를 기준 모델로 설명하라.
2. 로지스틱 회귀가 확률을 내는 방식과 결정 경계를 쓰고, 이진 교차 엔트로피의 기울기 $(p - y)x$를 유도하라. 소프트맥스 회귀에서는 기울기가 어떻게 되는지도 쓰라.
3. 정확도·정밀도·재현율·F1의 정의를 쓰고, 양성이 1%인 데이터에서 정확도만 보면 안 되는 이유와 임계값을 낮출 때 정밀도·재현율이 어떻게 바뀌는지 쓰라.
4. AUC를 순위 확률로 설명하고, 양성이 드문 데이터에서 ROC-AUC와 평균 정밀도가 다르게 반응하는 이유를 TPR·FPR·정밀도의 분모로 설명하라.
