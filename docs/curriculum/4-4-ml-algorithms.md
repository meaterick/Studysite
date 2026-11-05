<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 4-4 대표 알고리즘과 파이프라인

[전체 목차](README.md) · 트랙 4 머신러닝 기초 · [모듈 원본](../../src/content/modules/ml-algorithms/index.ts)

k최근접 이웃과 트리 앙상블, 그래디언트 부스팅과 특성 중요도, K-means·PCA와 전처리 파이프라인

## 목표 문제

유방암 진단 데이터로 깊이를 제한하지 않은 결정트리, 깊이 3인 트리, 랜덤 포레스트를 같은 교차검증으로 비교해 평균의 효과를 숫자로 확인하고, 잔차를 학습한 트리를 차례로 더하는 그래디언트 부스팅을 직접 구현해 트리 수가 늘 때 검증 오차가 어떻게 바뀌는지 본다. 정답과 무관한 특성을 넣어 불순도 기반 중요도와 순열 중요도가 다르게 나오는 것을 확인한다. 같은 데이터의 특성 30개를 표준화한 뒤 PCA로 주성분 10개로 줄이고, 숫자·범주 열이 섞인 표 데이터는 ColumnTransformer로 전처리를 모델과 하나의 파이프라인에 넣는다.

## 학습 목표

- KNN의 거리 계산과 다수결 예측을 구현하고, K와 스케일링이 결과에 주는 영향을 설명한다.
- 지니 불순도로 결정트리의 분할을 계산하고, 랜덤 포레스트가 부트스트랩과 특성 무작위 선택으로 분산을 줄이는 원리를 설명한다.
- 그래디언트 부스팅이 잔차를 순서대로 줄이는 과정을 구현하고, 학습률·트리 수로 복잡도를 조절하며 배깅과 비교한다.
- 불순도 기반 중요도와 순열 중요도를 계산하고, 두 값이 다르게 나오는 이유와 중요도 해석의 한계를 설명한다.
- K-means와 PCA를 표준화한 데이터에 적용하고, ColumnTransformer로 전처리와 모델을 하나의 파이프라인으로 묶는다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [k최근접 이웃, 결정트리, 랜덤 포레스트](#lesson-knn-trees) | 핵심 | 45분 | #64 k최근접 이웃, 결정트리, 랜덤 포레스트 |
| 2 | [그래디언트 부스팅, 특성 중요도](#lesson-boosting) | 핵심 | 35분 | #65 그래디언트 부스팅, 특성 중요도 |
| 3 | [K-means, PCA, 머신러닝 파이프라인](#lesson-kmeans-pca-pipeline) | 핵심 | 45분 | #66 K-means, PCA, 머신러닝 파이프라인 |
| 4 | [나이브 베이즈 분류기](#lesson-naive-bayes) | 보충 | 25분 | — |
| 5 | [서포트 벡터 머신](#lesson-svm) | 보충 | 25분 | — |

## 핵심 레슨

<a id="lesson-knn-trees"></a>

### 1. k최근접 이웃, 결정트리, 랜덤 포레스트

핵심 · 45분 · [본문 원본](../../src/content/modules/ml-algorithms/knn-trees.ts) · [실습 원본](../../src/content/modules/ml-algorithms/labs/knn-trees.ts)

**학습 목표:** KNN의 거리 계산과 다수결 예측을 구현하고 K와 스케일링의 영향을 설명하며, 지니 불순도로 결정트리의 분할을 계산하고 깊이로 복잡도를 조절하며, 부트스트랩과 특성 무작위 선택으로 랜덤 포레스트가 분산을 줄이는 원리를 설명한다.

**쓰이는 곳:** KNN과 결정트리는 선형 모델과 다른 방식으로 비선형 경계를 만드는 대표 모델이고, 랜덤 포레스트는 표 데이터에서 하이퍼파라미터를 거의 조정하지 않아도 성능이 좋아 비교의 기준으로 자주 쓰인다. 비슷한 샘플을 거리로 찾는 방식은 검색 증강 생성의 검색 단계([6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval))에서, 여러 모델을 합치는 방식은 부스팅([4-4 그래디언트 부스팅, 특성 중요도](#lesson-boosting))에서 다시 쓰인다.

**본문 절:** k최근접 이웃 · 결정트리 · 랜덤 포레스트

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 3 · 그림 4

**실습**

- `ex1` KNN 다수결과 결정트리의 분할 직접 구현하기

**서술형**

- `d1` KNN에서 K = 1일 때와 K = 학습 데이터 수일 때의 예측을 편향과 분산으로 설명하고, K를 고르는 방법과 KNN 앞에 스케일링이 필요한 이유를 쓰라.
- `d2` 깊이를 제한하지 않은 결정트리 하나보다 랜덤 포레스트의 검증 점수가 높은 이유를, 부트스트랩과 특성 무작위 선택이 각각 하는 일로 설명하라.

**참고 자료**

- [ISLP (An Introduction to Statistical Learning with Python) — 8장 Tree-Based Methods](https://www.statlearning.com/) — 결정트리·배깅·랜덤 포레스트 (영문, 무료 PDF)
- [scikit-learn — Nearest Neighbors](https://scikit-learn.org/stable/modules/neighbors.html) — KNN 분류·회귀와 거리 (영문)
- [scikit-learn — Ensembles: Random forests](https://scikit-learn.org/stable/modules/ensemble.html#random-forests-and-other-randomized-tree-ensembles) — max_features와 OOB 점수 (영문)

<a id="lesson-boosting"></a>

### 2. 그래디언트 부스팅, 특성 중요도

핵심 · 35분 · [본문 원본](../../src/content/modules/ml-algorithms/boosting.ts) · [실습 원본](../../src/content/modules/ml-algorithms/labs/boosting.ts)

**학습 목표:** 그래디언트 부스팅이 잔차를 학습한 트리를 순서대로 더해 오차를 줄이는 과정을 계산하고, 학습률·트리 수·깊이로 복잡도를 조절하며, 배깅과 비교한다. 불순도 기반 중요도와 순열 중요도를 계산해 두 값이 다르게 나오는 이유와 중요도 해석의 한계를 설명한다.

**쓰이는 곳:** 표 형태의 데이터에서는 그래디언트 부스팅(XGBoost, LightGBM 등)이 가장 자주 쓰이는 모델 가운데 하나다. 모델을 만든 뒤에는 어떤 특성이 예측에 쓰였는지 설명해야 하는데, 중요도를 잘못 읽으면 정답과 무관한 특성을 중요하다고 보고하거나 상관을 인과로 해석하게 된다. 모델의 근거를 문서로 남기는 방법은 [7-1 모델카드와 위험 점검](7-1-capstone-project.md#lesson-model-cards)에서 다룬다.

**본문 절:** 잔차를 학습한 트리를 차례로 더한다 · 학습률, 트리 수, 깊이 · 특성 중요도

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 1

**실습**

- `ex1` 그래디언트 부스팅과 순열 중요도 직접 구현하기

**서술형**

- `d1` 배깅과 부스팅을 학습 순서, 개별 트리의 성질, 주로 줄이는 오차 성분, 트리 수를 늘릴 때의 결과로 비교하라.
- `d2` 어떤 팀이 랜덤 포레스트의 feature_importances_ 상위 특성을 근거로 "이 특성이 고객 이탈의 원인"이라고 보고했다. 이 해석의 문제를 세 가지 쓰고, 중요도를 더 믿을 수 있게 확인하는 방법을 쓰라.

**참고 자료**

- [scikit-learn — Gradient boosting](https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting) — GradientBoosting·HistGradientBoosting과 조기 종료 (영문)
- [scikit-learn — Permutation Importance vs Random Forest Feature Importance (MDI)](https://scikit-learn.org/stable/auto_examples/inspection/plot_permutation_importance.html) — 무작위 특성이 높은 MDI를 받는 예 (영문)
- [Friedman (2001) — Greedy Function Approximation: A Gradient Boosting Machine](https://projecteuclid.org/journals/annals-of-statistics/volume-29/issue-5/Greedy-function-approximation-A-gradient-boosting-machine/10.1214/aos/1013203451.full) — 그래디언트 부스팅의 원 논문 (영문, 연구 논문)

<a id="lesson-kmeans-pca-pipeline"></a>

### 3. K-means, PCA, 머신러닝 파이프라인

핵심 · 45분 · [본문 원본](../../src/content/modules/ml-algorithms/kmeans-pca-pipeline.ts) · [실습 원본](../../src/content/modules/ml-algorithms/labs/kmeans-pca-pipeline.ts)

**학습 목표:** K-means의 할당·갱신 반복을 계산하고 K와 스케일링의 영향을 설명하며, PCA로 분산이 큰 방향을 찾아 누적 설명 비율로 주성분 수를 고르고, 숫자 열과 범주 열을 ColumnTransformer로 전처리해 모델과 하나의 파이프라인으로 묶는다.

**쓰이는 곳:** 정답이 없는 데이터에서 비슷한 고객을 묶거나 특성이 많은 데이터를 줄여서 볼 때 K-means와 PCA를 가장 먼저 쓴다. 문장 임베딩 같은 고차원 벡터를 군집으로 나누거나 2차원으로 줄여 살펴볼 때도 같은 방법을 쓴다([6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval)). 실제 표 데이터는 숫자 열과 범주 열이 섞여 있으므로, 전처리를 모델과 하나의 파이프라인으로 묶어야 교차검증과 운영에서 같은 처리가 보장된다([4-3 교차검증, 시계열 검증, 하이퍼파라미터 탐색](4-3-generalization.md#lesson-cross-validation)).

**본문 절:** K-means: 비슷한 샘플끼리 묶기 · PCA: 분산이 큰 방향으로 줄이기 · 파이프라인: 열 종류마다 다른 전처리를 하나로

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 2 · 코드 셀 3 · 그림 4

**실습**

- `ex1` K-means 할당·갱신 반복 직접 구현
- `ex2` 숫자·범주 열이 섞인 데이터의 파이프라인

**서술형**

- `d1` 숫자 열과 범주 열이 섞인 데이터의 전처리를 ColumnTransformer로 묶어 파이프라인 안에 넣어야 하는 이유를 쓰고, `handle_unknown="ignore"`가 필요한 상황과 K-means·PCA 앞에 표준화를 넣어야 하는 이유를 쓰라.

**참고 자료**

- [scikit-learn — Clustering: K-means](https://scikit-learn.org/stable/modules/clustering.html#k-means) — 할당·갱신, inertia, n_init (영문)
- [Setosa — Principal Component Analysis explained visually](https://setosa.io/ev/principal-component-analysis/) — PCA를 그래프로 보는 자료 (영문)
- [scikit-learn — Column Transformer with Mixed Types](https://scikit-learn.org/stable/auto_examples/compose/plot_column_transformer_mixed_types.html) — 숫자·범주 열을 함께 처리하는 예제 (영문)

## 보충 레슨

<a id="lesson-naive-bayes"></a>

### 4. 나이브 베이즈 분류기

보충 · 25분 · [본문 원본](../../src/content/modules/ml-algorithms/naive-bayes.ts) · [실습 원본](../../src/content/modules/ml-algorithms/labs/naive-bayes.ts)

**학습 목표:** 베이즈 정리와 조건부 독립 가정으로 나이브 베이즈의 사후확률을 계산하고, 라플라스 스무딩과 로그 확률이 필요한 이유를 설명하며, 단어 빈도로 텍스트를 분류하는 MultinomialNB를 쓴다.

**쓰이는 곳:** 나이브 베이즈는 학습과 예측이 매우 빠르고 데이터가 적어도 동작해, 스팸 필터나 문서 분류의 기준 모델로 자주 쓰인다([4-1 기준 모델과 단순한 예측 기준](4-1-ml-framing.md#lesson-baselines)). 사전확률과 증거를 곱해 판단하는 계산은 베이즈 정리([2-4 조건부확률과 베이즈 정리](2-4-probability-basics.md#lesson-bayes))와 MAP 추정([2-6 사전분포와 MAP 추정](2-6-inference-information.md#lesson-mle-map))을 그대로 적용한 것이다.

**본문 절:** 베이즈 정리로 분류하기 · 확률 0과 라플라스 스무딩 · 로그 확률로 계산한다 · 텍스트 분류: MultinomialNB

**구성:** 확인 문제 3 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 1

**실습**

- `ex1` 나이브 베이즈의 사후확률, 스무딩, 로그 계산

**서술형**

- `d1` 나이브 베이즈의 조건부 독립 가정이 무엇인지 쓰고, 이 가정이 현실과 다른데도 분류를 잘 하는 이유와, 출력 확률을 그대로 위험도로 쓸 때 주의할 점을 쓰라.

**참고 자료**

- [scikit-learn — Naive Bayes](https://scikit-learn.org/stable/modules/naive_bayes.html) — Gaussian·Multinomial 나이브 베이즈와 alpha (영문)
- [Manning, Raghavan, Schütze — Introduction to Information Retrieval, 13장](https://nlp.stanford.edu/IR-book/html/htmledition/naive-bayes-text-classification-1.html) — 텍스트 분류와 로그 확률 계산 (영문)

<a id="lesson-svm"></a>

### 5. 서포트 벡터 머신

보충 · 25분 · [본문 원본](../../src/content/modules/ml-algorithms/svm.ts) · [실습 원본](../../src/content/modules/ml-algorithms/labs/svm.ts)

**학습 목표:** SVM이 마진을 최대화하는 경계를 찾는 원리와 서포트 벡터를 설명하고 마진 폭을 계산하며, 소프트 마진의 C와 커널(RBF)이 경계의 모양과 복잡도를 어떻게 바꾸는지 설명한다.

**쓰이는 곳:** SVM은 샘플 수가 많지 않고 특성이 많은 데이터에서 성능이 좋아 텍스트 분류 등에 오래 쓰였다. 마진을 넓히는 것이 규제와 같은 역할을 한다는 관점은 로지스틱 회귀의 규제([4-3 L1·L2 규제, 조기 종료, 학습 곡선](4-3-generalization.md#lesson-regularization))와 연결되고, 커널은 입력을 다른 공간으로 옮겨 선형 모델을 쓰는 방법으로 신경망의 특성 학습([5-1 퍼셉트론, 다층 신경망, 활성화 함수](5-1-neural-networks.md#lesson-perceptron-mlp))과 비교된다.

**본문 절:** 마진을 최대화하는 경계 · 소프트 마진과 C · 커널: 직선으로 나뉘지 않는 데이터

**구성:** 확인 문제 3 · 서술형 1 · 실습 1 · 코드 셀 2 · 그림 1

**실습**

- `ex1` 마진, 소프트 마진 목적함수, RBF 커널 계산하기

**서술형**

- `d1` SVM의 마진과 서포트 벡터를 정의하고, 마진을 넓게 잡는 것이 새 데이터에서의 성능에 도움이 되는 이유를 쓰라. 커널이 직선으로 나뉘지 않는 데이터를 다루는 방법도 쓰라.

**참고 자료**

- [scikit-learn — Support Vector Machines](https://scikit-learn.org/stable/modules/svm.html) — 마진, 커널, C와 gamma (영문)
- [ISLP (An Introduction to Statistical Learning with Python) — 9장 Support Vector Machines](https://www.statlearning.com/) — 최대 마진 분류기와 커널 (영문, 무료 PDF)

## 백지 복습

1. KNN에서 K와 스케일링이 예측에 주는 영향을 쓰고, 결정트리가 지니 불순도와 정보이득으로 분할을 고르는 방법을 쓰라.
2. 랜덤 포레스트가 결정트리 하나보다 분산이 작은 이유를 부트스트랩과 특성 무작위 선택으로 쓰고, 그래디언트 부스팅과 학습 순서·주로 줄이는 오차 성분·트리 수의 영향을 비교하라.
3. 불순도 기반 중요도와 순열 중요도의 계산 방법을 쓰고, 정답과 무관한 특성의 불순도 기반 중요도가 높게 나올 수 있는 이유와 중요도를 원인으로 해석하면 안 되는 이유를 쓰라.
4. K-means의 두 단계와 K를 정하는 방법, PCA가 찾는 방향과 주성분 수를 정하는 방법을 쓰고, 두 방법 앞에 표준화가 필요한 이유를 쓰라.
5. 숫자 열과 범주 열이 섞인 데이터의 전처리를 ColumnTransformer로 묶어 파이프라인에 넣어야 하는 이유와 handle_unknown="ignore"가 필요한 경우를 쓰라.

## 과제: 믿을 수 있는 모델 비교 리포트

저장 키 `ml-model-comparison` · 만점 12점 · [과제 원본](../../src/content/modules/ml-algorithms/assignment.ts)

scikit-learn의 유방암 진단 데이터(`load_breast_cancer`)로 세 모델을 공정하게 비교하고, 지표 선택의 근거를 세우고, 데이터 누수가 점수를 얼마나 높이는지 직접 확인합니다. 마지막으로 결정트리의 깊이를 바꿔 가며 편향과 분산을 숫자로 관찰합니다. 모든 실험은 `random_state=0`으로 고정합니다.

**핵심** 항목 네 개는 트랙 4의 핵심 레슨만으로 풀 수 있고, 채점 기준은 이 네 항목만 봅니다. **보충**(비용 기반 임계값)과 **심화**(중첩 교차검증·학습 곡선 등) 항목은 선택이며 점수 대신 피드백을 받습니다.

### 요구사항

- 로지스틱 회귀를 `StandardScaler`와 함께 `make_pipeline`으로 묶어 TODO를 채운다. 스케일링을 파이프라인 밖에서 하지 않는다.
- 세 모델(다수결·로지스틱·랜덤 포레스트)을 **같은** `StratifiedKFold` 분할로 평가해 F1·ROC-AUC의 평균 ± 표준편차와 fold별 짝지은 차이를 보고한다.
- 클래스 비율과 혼동행렬·정밀도·재현율을 근거로 이 문제에서 가장 중요한 지표를 고른다.
- 누수 (a) 분할 전 스케일링, (b) 타깃 파생 특성을 실제로 만들어 교차검증 점수가 높아지는 크기를 비교·설명한다.
- 결정트리 깊이(1·3·5·제한 없음)별 테스트 정확도의 평균·표준편차를 편향과 분산으로 해석한다.
- (보충) 비용 비율 10:1로 정한 임계값 $t^* = 1/11$과 0.5의 FN·FP·평균 비용을 비교한다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| 세 모델을 같은 교차검증으로 비교하기 | 핵심 | 코드 `compare-code`, 답안 `compare-answer`(최소 260자) |
| 지표 선택의 근거 세우기 | 핵심 | 코드 `metric-code`, 답안 `metric-answer`(최소 120자) |
| 데이터 누수 실험 | 핵심 | 코드 `leak-code`, 답안 `leak-answer`(최소 150자) |
| 편향과 분산을 숫자로 확인하기 | 핵심 | 코드 `biasvar-code`, 답안 `biasvar-answer`(최소 120자) |
| 보충: 비용으로 임계값 정하기 | 보충 | 코드 `threshold-code`, 답안 `threshold-answer`(최소 100자) |
| 심화: 중첩 교차검증·보정된 비교·학습 곡선 | 심화 | 코드 `advanced-code`, 답안 `advanced-answer` |

### 채점 기준

| 기준 | 배점 | 확인 내용 |
| --- | ---: | --- |
| 실험 설계의 타당성 | 3 | 같은 분할·교차검증·파이프라인을 쓰고 시드를 고정했습니다. |
| 지표 선택 논리와 기준 모델 대비 해석 | 3 | 클래스 비율과 오류 비용을 근거로 지표를 고르고, 기준 모델과 비교해 해석했습니다. |
| 누수 실험과 원인 설명 | 3 | 두 누수의 영향을 정량화하고, 크기 차이의 원인을 정확히 설명했습니다. |
| 편향·분산 실험과 해석 | 2 | 깊이별 평균·표준편차를 근거로 편향과 분산의 변화를 해석했습니다. |
| 가독성 | 1 | 표와 서술이 간결하고 출력과 잘 연결됩니다. |

### 자동 테스트

- `compare`: 로지스틱 회귀가 StandardScaler를 포함한 Pipeline이다
- `compare`: 세 모델 모두 5-fold 점수가 있고 로지스틱 F1이 0.9를 넘는다
- `metric`: 테스트 데이터에서 악성 재현율이 0.8 이상
- `leak`: 두 누수를 실제로 만들었고 타깃 파생 특성이 점수를 크게 높인다
- `threshold`: 비용 기반 임계값 t* = 1/11이 0.5보다 평균 비용이 작다

### 선택 심화 문제

- `ch1` L2 규제 로지스틱 회귀를 NumPy로 구현해 sklearn과 맞추기
- `ch2` 중첩 교차검증을 직접 구현해 scikit-learn과 맞추기
