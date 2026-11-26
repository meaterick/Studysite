<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 개념 색인

[전체 목차](README.md) · [문서 홈](../README.md)

개념 78개와 그 개념을 다루는 레슨이다. 선수 개념은 기본 경로에서 항상 먼저 나온다(`npm run validate:content`가 확인한다).

| 번호 | 개념 | 트랙 | 레슨 | 선수 개념 |
| ---: | --- | --- | --- | --- |
| 1 | 변수와 값, 자료형, 형 변환 | Python | [1-1 변수, 값, 자료형, 형 변환](1-1-python-flow.md#lesson-variables-types) | — |
| 2 | 숫자·문자열·불리언과 기본 연산 | Python | [1-1 숫자·문자열·불리언과 기본 연산](1-1-python-flow.md#lesson-operators) | #1 |
| 3 | 비교 연산, 논리 연산, 조건문 | Python | [1-1 비교 연산, 논리 연산, 조건문](1-1-python-flow.md#lesson-conditionals) | #2 |
| 4 | 반복문과 반복 제어 | Python | [1-1 반복문과 반복 제어](1-1-python-flow.md#lesson-loops) | #3 |
| 5 | 리스트, 튜플, 딕셔너리, 집합 | Python | [1-2 리스트, 튜플, 딕셔너리, 집합](1-2-python-collections-functions.md#lesson-collections) | #4 |
| 6 | 인덱싱과 슬라이싱 | Python | [1-2 인덱싱과 슬라이싱](1-2-python-collections-functions.md#lesson-indexing-slicing) | #5 |
| 7 | 함수, 매개변수, 반환값, 변수의 범위 | Python | [1-2 함수, 매개변수, 반환값, 변수의 범위](1-2-python-collections-functions.md#lesson-functions-scope) | #4 |
| 8 | 가변·불변 객체, 참조와 복사 | Python | [1-2 가변·불변 객체와 참조·복사](1-2-python-collections-functions.md#lesson-mutability-copy) | #5, #7 |
| 9 | 리스트 컴프리헨션과 반복자 | Python | [1-2 컴프리헨션과 반복자](1-2-python-collections-functions.md#lesson-comprehensions-iterators) | #5, #7 |
| 10 | 파일 입출력: 텍스트, CSV, JSON | Python | [1-3 파일 입출력: 텍스트, CSV, JSON](1-3-python-files-errors.md#lesson-file-io) | #5, #7 |
| 11 | 오류 메시지 읽기, 예외 처리, 디버깅 | Python | [1-3 오류 메시지 읽기, 예외 처리, 디버깅](1-3-python-files-errors.md#lesson-errors-debugging) | #7 |
| 12 | 모듈, 패키지, 가상환경, 의존성 | Python | [1-3 모듈, 패키지, 가상환경, 의존성](1-3-python-files-errors.md#lesson-modules-environments) | #7 |
| 13 | 클래스와 객체의 기초 | Python | [1-4 클래스와 객체](1-4-python-objects-tools.md#lesson-classes-objects) | #7, #5 |
| 14 | 기본 자료구조와 시간복잡도 | Python | [1-4 기본 자료구조와 시간복잡도](1-4-python-objects-tools.md#lesson-complexity) | #5, #7 |
| 15 | 함수, 정의역·치역, 함수의 합성 | 수학 기초 | [2-1 함수, 정의역·치역, 함수의 합성](2-1-math-functions.md#lesson-functions-composition) | #7 |
| 16 | 일차함수, 이차함수, 지수함수, 로그함수 | 수학 기초 | [2-1 일차함수, 이차함수, 지수함수, 로그함수](2-1-math-functions.md#lesson-elementary-functions) | #15 |
| 17 | 시그마 표기와 수열의 기초 | 수학 기초 | [2-1 시그마 표기와 수열의 기초](2-1-math-functions.md#lesson-sigma-sequences) | #4, #16 |
| 18 | 스칼라, 벡터, 행렬, 텐서 | 수학 기초 | [2-2 스칼라, 벡터, 행렬, 텐서](2-2-linear-algebra.md#lesson-scalars-tensors) | #5 |
| 19 | 벡터의 덧셈, 스칼라곱, 선형결합 | 수학 기초 | [2-2 벡터의 덧셈, 스칼라곱, 선형결합](2-2-linear-algebra.md#lesson-vector-operations) | #18 |
| 20 | 내적, 벡터의 길이, 거리, 코사인 유사도 | 수학 기초 | [2-2 내적, 길이, 거리, 코사인 유사도](2-2-linear-algebra.md#lesson-dot-product) | #19, #16 |
| 21 | 행렬의 형태, 전치, 행렬곱 | 수학 기초 | [2-2 행렬의 형태, 전치, 행렬곱](2-2-linear-algebra.md#lesson-matrix-multiplication) | #20 |
| 22 | 선형변환, 선형독립, 기저, 차원 | 수학 기초 | [2-2 선형변환, 선형독립, 기저, 차원](2-2-linear-algebra.md#lesson-linear-maps-basis) | #21 |
| 23 | 미분과 도함수, 변화율 | 수학 기초 | [2-3 미분과 도함수](2-3-calculus-optimization.md#lesson-derivatives) | #16 |
| 24 | 편미분과 기울기 | 수학 기초 | [2-3 편미분과 기울기](2-3-calculus-optimization.md#lesson-gradient) | #23, #18 |
| 25 | 연쇄법칙과 합성함수의 미분 | 수학 기초 | [2-3 연쇄법칙](2-3-calculus-optimization.md#lesson-chain-rule) | #23, #15 |
| 26 | 최솟값·최댓값, 경사하강법 | 수학 기초 | [2-3 최솟값과 경사하강법](2-3-calculus-optimization.md#lesson-gradient-descent) | #24, #25 |
| 27 | 확률, 사건, 독립성 | 수학 기초 | [2-4 확률, 사건, 독립성](2-4-probability-basics.md#lesson-probability-rules) | #2 |
| 28 | 조건부확률과 베이즈 정리 | 수학 기초 | [2-4 조건부확률과 베이즈 정리](2-4-probability-basics.md#lesson-bayes) | #27 |
| 29 | 확률변수, 확률분포, 기댓값, 분산 | 수학 기초 | [2-4 확률변수, 기댓값, 분산](2-4-probability-basics.md#lesson-random-variables) | #27, #17 |
| 30 | 정규분포, 이항분포, 표준정규분포 | 수학 기초 | [2-4 정규분포, 이항분포, 표준정규분포](2-4-probability-basics.md#lesson-distributions) | #29, #16 |
| 31 | 표본과 모집단, 표본추출, 표본편향 | 수학 기초 | [2-5 표본과 모집단, 표본추출, 표본편향](2-5-descriptive-statistics.md#lesson-sampling) | #27 |
| 32 | 평균, 중앙값, 분위수, 표준편차 | 수학 기초 | [2-5 평균, 중앙값, 분위수, 표준편차](2-5-descriptive-statistics.md#lesson-summary-statistics) | #29, #17 |
| 33 | 공분산, 상관계수, 상관관계와 인과관계 | 수학 기초 | [2-5 공분산, 상관계수, 상관관계와 인과관계](2-5-descriptive-statistics.md#lesson-correlation) | #32, #20 |
| 34 | 큰 수의 법칙과 중심극한정리 | 수학 기초 | [2-6 큰 수의 법칙과 중심극한정리](2-6-inference-information.md#lesson-lln-clt) | #30, #32, #31 |
| 35 | 추정, 신뢰구간, 가설검정, p값 | 수학 기초 | [2-6 추정, 신뢰구간, 가설검정, p값](2-6-inference-information.md#lesson-statistical-inference) | #34, #31 |
| 36 | 가능도(우도), 최대가능도추정, 엔트로피, 교차엔트로피 | 수학 기초 | [2-6 가능도, 최대가능도추정, 엔트로피, 교차엔트로피](2-6-inference-information.md#lesson-likelihood-entropy) | #30, #16 |
| 37 | NumPy 배열, 축, 형태, 자료형 | 데이터 처리 기초 | [3-1 NumPy 배열, 축, 형태, 자료형](3-1-numpy.md#lesson-numpy-arrays) | #18, #5 |
| 38 | 배열 인덱싱, 불리언 마스킹, 브로드캐스팅 | 데이터 처리 기초 | [3-1 인덱싱, 불리언 마스킹, 브로드캐스팅](3-1-numpy.md#lesson-array-indexing) | #37, #6 |
| 39 | 벡터화 연산과 난수 시드 | 데이터 처리 기초 | [3-1 벡터화 연산과 난수 시드](3-1-numpy.md#lesson-vectorization) | #38, #14 |
| 40 | pandas의 Series와 DataFrame | 데이터 처리 기초 | [3-2 pandas의 Series와 DataFrame](3-2-pandas.md#lesson-dataframes) | #37 |
| 41 | 데이터 불러오기, 조회, 필터링, 정렬 | 데이터 처리 기초 | [3-2 데이터 불러오기, 조회, 필터링, 정렬](3-2-pandas.md#lesson-pandas-selection) | #40, #10 |
| 42 | 그룹별 집계, 테이블 결합, 형태 변환 | 데이터 처리 기초 | [3-2 그룹별 집계, 테이블 결합, 형태 변환](3-2-pandas.md#lesson-pandas-aggregation) | #41 |
| 43 | 수치형·범주형·시계열 데이터 | 데이터 처리 기초 | [3-2 수치형·범주형·시계열 데이터](3-2-pandas.md#lesson-data-types) | #40 |
| 44 | 결측치, 중복값, 이상치, 잘못된 자료형 | 데이터 처리 기초 | [3-3 결측치, 중복값, 이상치, 잘못된 자료형](3-3-data-preparation.md#lesson-data-cleaning) | #41, #32 |
| 45 | 히스토그램, 산점도, 상자그림, 상관행렬 | 데이터 처리 기초 | [3-3 히스토그램, 산점도, 상자그림, 상관행렬](3-3-data-preparation.md#lesson-visualization) | #41, #33 |
| 46 | 탐색적 데이터 분석과 데이터 품질 | 데이터 처리 기초 | [3-3 탐색적 데이터 분석과 데이터 품질](3-3-data-preparation.md#lesson-eda) | #45, #44 |
| 47 | 범주형 인코딩, 표준화, 정규화 | 데이터 처리 기초 | [3-3 범주형 인코딩, 표준화, 정규화](3-3-data-preparation.md#lesson-encoding-scaling) | #43, #32 |
| 48 | 특성 생성, 특성 선택, 차원의 저주 | 데이터 처리 기초 | [3-3 특성 생성, 특성 선택, 차원의 저주](3-3-data-preparation.md#lesson-feature-engineering) | #47, #20 |
| 49 | 특성, 정답, 예측, 모델, 파라미터 | 머신러닝 기초 | [4-1 특성, 정답, 예측, 모델, 파라미터](4-1-ml-framing.md#lesson-ml-terms) | #15 |
| 50 | 지도학습, 비지도학습, 자기지도학습, 강화학습 | 머신러닝 기초 | [4-1 지도학습, 비지도학습, 자기지도학습, 강화학습](4-1-ml-framing.md#lesson-learning-paradigms) | #49 |
| 51 | 회귀, 분류, 군집화, 이상 탐지 | 머신러닝 기초 | [4-1 회귀, 분류, 군집화, 이상 탐지](4-1-ml-framing.md#lesson-task-types) | #49 |
| 52 | 학습·검증·테스트 데이터와 데이터 누수 | 머신러닝 기초 | [4-1 학습·검증·테스트 데이터와 데이터 누수](4-1-ml-framing.md#lesson-data-splits) | #49, #47 |
| 53 | 기준 모델과 단순한 예측 기준 | 머신러닝 기초 | [4-1 기준 모델과 단순한 예측 기준](4-1-ml-framing.md#lesson-baselines) | #51, #32 |
| 54 | 손실함수, 목적함수, 학습과 추론 | 머신러닝 기초 | [4-1 손실함수, 목적함수, 학습과 추론](4-1-ml-framing.md#lesson-loss-functions) | #49, #26 |
| 55 | 선형회귀, 잔차, MSE·MAE·RMSE·R² | 머신러닝 기초 | [4-2 선형회귀, 잔차, 평균제곱오차](4-2-linear-models.md#lesson-linear-regression) | #54, #21 |
| 56 | 로지스틱·소프트맥스 회귀, 시그모이드, 분류 임계값 | 머신러닝 기초 | [4-2 로지스틱 회귀, 시그모이드, 분류 임계값](4-2-linear-models.md#lesson-logistic-regression) | #55, #36 |
| 57 | 혼동행렬, 정확도, 정밀도, 재현율, F1 | 머신러닝 기초 | [4-2 혼동행렬, 정확도, 정밀도, 재현율, F1](4-2-linear-models.md#lesson-classification-metrics) | #56 |
| 58 | ROC-AUC, PR-AUC, 클래스 불균형 | 머신러닝 기초 | [4-2 ROC-AUC, PR-AUC, 클래스 불균형](4-2-linear-models.md#lesson-roc-pr) | #57 |
| 59 | 일반화, 과적합, 과소적합, 편향·분산 | 머신러닝 기초 | [4-3 일반화, 과적합, 과소적합, 편향과 분산](4-3-generalization.md#lesson-bias-variance) | #52, #55 |
| 60 | L1·L2 규제, 조기 종료, 학습 곡선 | 머신러닝 기초 | [4-3 L1·L2 규제, 조기 종료, 학습 곡선](4-3-generalization.md#lesson-regularization) | #59 |
| 61 | 교차검증, 시계열 검증, 하이퍼파라미터 탐색 | 머신러닝 기초 | [4-3 교차검증, 시계열 검증, 하이퍼파라미터 탐색](4-3-generalization.md#lesson-cross-validation) | #59, #52 |
| 62 | k최근접 이웃, 결정트리, 랜덤 포레스트 | 머신러닝 기초 | [4-4 k최근접 이웃, 결정트리, 랜덤 포레스트](4-4-ml-algorithms.md#lesson-knn-trees) | #20, #59 |
| 63 | 그래디언트 부스팅, 특성 중요도 | 머신러닝 기초 | [4-4 그래디언트 부스팅, 특성 중요도](4-4-ml-algorithms.md#lesson-boosting) | #62, #54 |
| 64 | K-means, PCA, 머신러닝 파이프라인 | 머신러닝 기초 | [4-4 K-means, PCA, 머신러닝 파이프라인](4-4-ml-algorithms.md#lesson-kmeans-pca-pipeline) | #33, #22, #61 |
| 65 | 퍼셉트론, 다층 신경망, 활성화 함수 | 딥러닝 기초 | [5-1 퍼셉트론, 다층 신경망, 활성화 함수](5-1-neural-networks.md#lesson-perceptron-mlp) | #56, #21 |
| 66 | 순전파, 역전파, 계산 그래프, 자동미분 | 딥러닝 기초 | [5-1 순전파, 역전파, 계산 그래프](5-1-neural-networks.md#lesson-backprop) · [5-1 자동미분 엔진 구현](5-1-neural-networks.md#lesson-micrograd) | #65, #25, #13 |
| 67 | 배치, 에포크, 학습률, SGD, Adam | 딥러닝 기초 | [5-1 배치, 에포크, 학습률, SGD, Adam](5-1-neural-networks.md#lesson-optimizers) | #66 |
| 68 | 가중치 초기화, 기울기 소실·폭주, 정규화 층 | 딥러닝 기초 | [5-2 가중치 초기화와 기울기 소실·폭주](5-2-deep-training.md#lesson-initialization) · [5-2 정규화 층: BatchNorm과 LayerNorm](5-2-deep-training.md#lesson-normalization-layers) | #67, #29 |
| 69 | 드롭아웃, 잔차 연결, 전이학습 | 딥러닝 기초 | [5-2 드롭아웃과 잔차 연결](5-2-deep-training.md#lesson-dropout-residual) · [5-2 전이학습과 학습 진단](5-2-deep-training.md#lesson-transfer-learning) | #68, #60 |
| 70 | PyTorch 텐서, 데이터 로더, 학습 루프, GPU | 딥러닝 기초 | [5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch) | #67, #13, #37 |
| 71 | 합성곱, CNN, 이미지 증강 | 딥러닝 기초 | [5-3 합성곱](5-3-cnn-rnn.md#lesson-convolution) · [5-3 풀링과 수용영역](5-3-cnn-rnn.md#lesson-pooling) · [5-3 CNN 학습과 이미지 증강](5-3-cnn-rnn.md#lesson-cnn-training) | #70, #38 |
| 72 | 시퀀스 데이터, 임베딩, RNN의 기본 구조 | 딥러닝 기초 | [5-3 시퀀스 데이터와 임베딩](5-3-cnn-rnn.md#lesson-embeddings) · [5-3 RNN의 구조와 시간 역전파](5-3-cnn-rnn.md#lesson-rnn) | #66, #20 |
| 73 | 토큰화, 서브워드, 토큰 임베딩, 위치 정보 | 생성형 AI와 언어 모델 | [6-1 토큰화, 서브워드, 토큰 임베딩, 위치 정보](6-1-transformers.md#lesson-tokenization) | #72, #5 |
| 74 | 쿼리·키·값, 셀프 어텐션, 트랜스포머 | 생성형 AI와 언어 모델 | [6-1 어텐션의 필요성: Seq2Seq의 병목](6-1-transformers.md#lesson-attention-motivation) · [6-1 셀프 어텐션: 쿼리·키·값](6-1-transformers.md#lesson-self-attention) · [6-1 멀티헤드 어텐션과 인과 마스크](6-1-transformers.md#lesson-multi-head-attention) · [6-1 트랜스포머 디코더 블록](6-1-transformers.md#lesson-transformer-block) | #73, #21, #68 |
| 75 | 다음 토큰 예측, 사전학습, 문맥 창, 샘플링 | 생성형 AI와 언어 모델 | [6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining) · [6-2 샘플링과 디코딩 전략](6-2-llm-training.md#lesson-decoding) | #74, #36, #30 |
| 76 | 지시 미세조정, LoRA, 선호도 학습, 프롬프트 설계 | 생성형 AI와 언어 모델 | [6-2 지시 미세조정과 LoRA](6-2-llm-training.md#lesson-instruction-tuning) · [6-2 선호도 학습: RLHF와 DPO](6-2-llm-training.md#lesson-preference-learning) · [6-2 프롬프트 설계](6-2-llm-training.md#lesson-prompt-design) | #75 |
| 77 | 벡터 검색, RAG, 도구 호출, 에이전트 | 생성형 AI와 언어 모델 | [6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval) · [6-3 RAG 파이프라인](6-3-llm-systems.md#lesson-rag) · [6-3 검색 품질 지표: Recall@k와 MRR](6-3-llm-systems.md#lesson-retrieval-metrics) · [6-4 도구 호출과 에이전트 루프](6-4-llm-agents-ops.md#lesson-agents) · [6-4 에이전트 설계와 안전](6-4-llm-agents-ops.md#lesson-agent-design) | #75, #20, #10, #14 |
| 78 | 환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링 | 생성형 AI와 언어 모델 | [6-3 환각과 한계](6-3-llm-systems.md#lesson-hallucination) · [6-3 LLM 평가와 안전성 평가](6-3-llm-systems.md#lesson-llm-evaluation) · [6-4 모델 서빙과 추론 비용](6-4-llm-agents-ops.md#lesson-serving-cost) · [6-4 운영 모니터링](6-4-llm-agents-ops.md#lesson-monitoring) | #77, #57, #35 |
