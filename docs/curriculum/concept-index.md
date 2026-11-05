<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 개념 색인

[전체 목차](README.md) · [문서 홈](../README.md)

개념 80개와 그 개념을 다루는 레슨이다. 선수 개념은 기본 경로에서 항상 먼저 나온다(`npm run validate:content`가 확인한다).

| 번호 | 개념 | 트랙 | 레슨 | 선수 개념 |
| ---: | --- | --- | --- | --- |
| 1 | 변수와 값, 자료형, 형 변환 | 프로그래밍 기초 | [1-1 변수, 값, 자료형, 형 변환](1-1-python-flow.md#lesson-variables-types) | — |
| 2 | 숫자·문자열·불리언과 기본 연산 | 프로그래밍 기초 | [1-1 숫자·문자열·불리언과 기본 연산](1-1-python-flow.md#lesson-operators) | #1 |
| 3 | 비교 연산, 논리 연산, 조건문 | 프로그래밍 기초 | [1-1 비교 연산, 논리 연산, 조건문](1-1-python-flow.md#lesson-conditionals) | #2 |
| 4 | 반복문과 반복 제어 | 프로그래밍 기초 | [1-1 반복문과 반복 제어](1-1-python-flow.md#lesson-loops) | #3 |
| 5 | 리스트, 튜플, 딕셔너리, 집합 | 프로그래밍 기초 | [1-2 리스트, 튜플, 딕셔너리, 집합](1-2-python-collections-functions.md#lesson-collections) | #4 |
| 6 | 인덱싱과 슬라이싱 | 프로그래밍 기초 | [1-2 인덱싱과 슬라이싱](1-2-python-collections-functions.md#lesson-indexing-slicing) | #5 |
| 7 | 가변·불변 객체, 참조와 복사 | 프로그래밍 기초 | [1-2 가변·불변 객체와 참조·복사](1-2-python-collections-functions.md#lesson-mutability-copy) | #5, #8 |
| 8 | 함수, 매개변수, 반환값, 변수의 범위 | 프로그래밍 기초 | [1-2 함수, 매개변수, 반환값, 변수의 범위](1-2-python-collections-functions.md#lesson-functions-scope) | #4 |
| 9 | 리스트 컴프리헨션과 반복자 | 프로그래밍 기초 | [1-2 컴프리헨션과 반복자](1-2-python-collections-functions.md#lesson-comprehensions-iterators) | #5, #8 |
| 10 | 파일 입출력: 텍스트, CSV, JSON | 프로그래밍 기초 | [1-3 파일 입출력: 텍스트, CSV, JSON](1-3-python-files-errors.md#lesson-file-io) | #5, #8 |
| 11 | 오류 메시지 읽기, 예외 처리, 디버깅 | 프로그래밍 기초 | [1-3 오류 메시지 읽기, 예외 처리, 디버깅](1-3-python-files-errors.md#lesson-errors-debugging) | #8 |
| 12 | 모듈, 패키지, 가상환경, 의존성 | 프로그래밍 기초 | [1-3 모듈, 패키지, 가상환경, 의존성](1-3-python-files-errors.md#lesson-modules-environments) | #8 |
| 13 | 클래스와 객체의 기초 | 프로그래밍 기초 | [1-4 클래스와 객체](1-4-python-objects-tools.md#lesson-classes-objects) | #8, #5 |
| 14 | 기본 자료구조와 시간복잡도 | 프로그래밍 기초 | [1-4 기본 자료구조와 시간복잡도](1-4-python-objects-tools.md#lesson-complexity) | #5, #8 |
| 15 | Git 기초와 코드 버전 관리 | 프로그래밍 기초 | [1-4 Git과 버전 관리](1-4-python-objects-tools.md#lesson-git-basics) | #12 |
| 16 | Jupyter Notebook과 재현 가능한 실행 | 프로그래밍 기초 | [1-4 Jupyter Notebook과 재현 가능한 실행](1-4-python-objects-tools.md#lesson-notebooks-reproducibility) | #12 |
| 17 | 함수, 정의역·치역, 함수의 합성 | 수학 기초 | [2-1 함수, 정의역·치역, 함수의 합성](2-1-math-functions.md#lesson-functions-composition) | #8 |
| 18 | 일차함수, 이차함수, 지수함수, 로그함수 | 수학 기초 | [2-1 일차함수, 이차함수, 지수함수, 로그함수](2-1-math-functions.md#lesson-elementary-functions) | #17 |
| 19 | 시그마 표기와 수열의 기초 | 수학 기초 | [2-1 시그마 표기와 수열의 기초](2-1-math-functions.md#lesson-sigma-sequences) | #4, #18 |
| 20 | 스칼라, 벡터, 행렬, 텐서 | 수학 기초 | [2-2 스칼라, 벡터, 행렬, 텐서](2-2-linear-algebra.md#lesson-scalars-tensors) | #5 |
| 21 | 벡터의 덧셈, 스칼라곱, 선형결합 | 수학 기초 | [2-2 벡터의 덧셈, 스칼라곱, 선형결합](2-2-linear-algebra.md#lesson-vector-operations) | #20 |
| 22 | 내적, 벡터의 길이, 거리, 코사인 유사도 | 수학 기초 | [2-2 내적, 길이, 거리, 코사인 유사도](2-2-linear-algebra.md#lesson-dot-product) | #21, #18 |
| 23 | 행렬의 형태, 전치, 행렬곱 | 수학 기초 | [2-2 행렬의 형태, 전치, 행렬곱](2-2-linear-algebra.md#lesson-matrix-multiplication) | #22 |
| 24 | 선형변환, 선형독립, 기저, 차원 | 수학 기초 | [2-2 선형변환, 선형독립, 기저, 차원](2-2-linear-algebra.md#lesson-linear-maps-basis) | #23 |
| 25 | 미분과 도함수, 변화율 | 수학 기초 | [2-3 미분과 도함수](2-3-calculus-optimization.md#lesson-derivatives) | #18 |
| 26 | 편미분과 기울기 | 수학 기초 | [2-3 편미분과 기울기](2-3-calculus-optimization.md#lesson-gradient) | #25, #20 |
| 27 | 연쇄법칙과 합성함수의 미분 | 수학 기초 | [2-3 연쇄법칙](2-3-calculus-optimization.md#lesson-chain-rule) | #25, #17 |
| 28 | 최솟값·최댓값, 경사하강법 | 수학 기초 | [2-3 최솟값과 경사하강법](2-3-calculus-optimization.md#lesson-gradient-descent) | #26, #27 |
| 29 | 확률, 사건, 독립성 | 수학 기초 | [2-4 확률, 사건, 독립성](2-4-probability-basics.md#lesson-probability-rules) | #2 |
| 30 | 조건부확률과 베이즈 정리 | 수학 기초 | [2-4 조건부확률과 베이즈 정리](2-4-probability-basics.md#lesson-bayes) | #29 |
| 31 | 확률변수, 확률분포, 기댓값, 분산 | 수학 기초 | [2-4 확률변수, 기댓값, 분산](2-4-probability-basics.md#lesson-random-variables) | #29, #19 |
| 32 | 정규분포, 이항분포, 표준정규분포 | 수학 기초 | [2-4 정규분포, 이항분포, 표준정규분포](2-4-probability-basics.md#lesson-distributions) | #31, #18 |
| 33 | 표본과 모집단, 표본추출, 표본편향 | 수학 기초 | [2-5 표본과 모집단, 표본추출, 표본편향](2-5-descriptive-statistics.md#lesson-sampling) | #29 |
| 34 | 평균, 중앙값, 분위수, 표준편차 | 수학 기초 | [2-5 평균, 중앙값, 분위수, 표준편차](2-5-descriptive-statistics.md#lesson-summary-statistics) | #31, #19 |
| 35 | 공분산, 상관계수, 상관관계와 인과관계 | 수학 기초 | [2-5 공분산, 상관계수, 상관관계와 인과관계](2-5-descriptive-statistics.md#lesson-correlation) | #34, #22 |
| 36 | 큰 수의 법칙과 중심극한정리 | 수학 기초 | [2-6 큰 수의 법칙과 중심극한정리](2-6-inference-information.md#lesson-lln-clt) | #32, #34 |
| 37 | 추정, 신뢰구간, 가설검정, p값 | 수학 기초 | [2-6 추정, 신뢰구간, 가설검정, p값](2-6-inference-information.md#lesson-statistical-inference) | #36, #33 |
| 38 | 우도, 최대우도추정, 엔트로피, 교차엔트로피 | 수학 기초 | [2-6 가능도, 최대가능도추정, 엔트로피, 교차엔트로피](2-6-inference-information.md#lesson-likelihood-entropy) | #32, #18 |
| 39 | NumPy 배열, 축, 형태, 자료형 | 데이터 처리 기초 | [3-1 NumPy 배열, 축, 형태, 자료형](3-1-numpy.md#lesson-numpy-arrays) | #20, #5 |
| 40 | 배열 인덱싱, 불리언 마스킹, 브로드캐스팅 | 데이터 처리 기초 | [3-1 인덱싱, 불리언 마스킹, 브로드캐스팅](3-1-numpy.md#lesson-array-indexing) | #39, #6 |
| 41 | 벡터화 연산과 난수 시드 | 데이터 처리 기초 | [3-1 벡터화 연산과 난수 시드](3-1-numpy.md#lesson-vectorization) | #40, #14 |
| 42 | pandas의 Series와 DataFrame | 데이터 처리 기초 | [3-2 pandas의 Series와 DataFrame](3-2-pandas.md#lesson-dataframes) | #39 |
| 43 | 데이터 불러오기, 조회, 필터링, 정렬 | 데이터 처리 기초 | [3-2 데이터 불러오기, 조회, 필터링, 정렬](3-2-pandas.md#lesson-pandas-selection) | #42, #10 |
| 44 | 그룹별 집계, 테이블 결합, 형태 변환 | 데이터 처리 기초 | [3-2 그룹별 집계, 테이블 결합, 형태 변환](3-2-pandas.md#lesson-pandas-aggregation) | #43 |
| 45 | 수치형·범주형·시계열 데이터 | 데이터 처리 기초 | [3-2 수치형·범주형·시계열 데이터](3-2-pandas.md#lesson-data-types) | #42 |
| 46 | 결측치, 중복값, 이상치, 잘못된 자료형 | 데이터 처리 기초 | [3-3 결측치, 중복값, 이상치, 잘못된 자료형](3-3-data-preparation.md#lesson-data-cleaning) | #43, #34 |
| 47 | 히스토그램, 산점도, 상자그림, 상관행렬 | 데이터 처리 기초 | [3-3 히스토그램, 산점도, 상자그림, 상관행렬](3-3-data-preparation.md#lesson-visualization) | #43, #35 |
| 48 | 탐색적 데이터 분석과 데이터 품질 | 데이터 처리 기초 | [3-3 탐색적 데이터 분석과 데이터 품질](3-3-data-preparation.md#lesson-eda) | #47, #46 |
| 49 | 범주형 인코딩, 표준화, 정규화 | 데이터 처리 기초 | [3-3 범주형 인코딩, 표준화, 정규화](3-3-data-preparation.md#lesson-encoding-scaling) | #45, #34 |
| 50 | 특성 생성, 특성 선택, 차원의 저주 | 데이터 처리 기초 | [3-3 특성 생성, 특성 선택, 차원의 저주](3-3-data-preparation.md#lesson-feature-engineering) | #49, #22 |
| 51 | 특성, 정답, 예측, 모델, 파라미터 | 머신러닝 기초 | [4-1 특성, 정답, 예측, 모델, 파라미터](4-1-ml-framing.md#lesson-ml-terms) | #17 |
| 52 | 지도학습, 비지도학습, 자기지도학습, 강화학습 | 머신러닝 기초 | [4-1 지도학습, 비지도학습, 자기지도학습, 강화학습](4-1-ml-framing.md#lesson-learning-paradigms) | #51 |
| 53 | 회귀, 분류, 군집화, 이상 탐지 | 머신러닝 기초 | [4-1 회귀, 분류, 군집화, 이상 탐지](4-1-ml-framing.md#lesson-task-types) | #51 |
| 54 | 학습·검증·테스트 데이터와 데이터 누수 | 머신러닝 기초 | [4-1 학습·검증·테스트 데이터와 데이터 누수](4-1-ml-framing.md#lesson-data-splits) | #51, #49 |
| 55 | 기준 모델과 단순한 예측 기준 | 머신러닝 기초 | [4-1 기준 모델과 단순한 예측 기준](4-1-ml-framing.md#lesson-baselines) | #53, #34 |
| 56 | 손실함수, 목적함수, 학습과 추론 | 머신러닝 기초 | [4-1 손실함수, 목적함수, 학습과 추론](4-1-ml-framing.md#lesson-loss-functions) | #51, #28 |
| 57 | 선형회귀, 잔차, 평균제곱오차 | 머신러닝 기초 | [4-2 선형회귀, 잔차, 평균제곱오차](4-2-linear-models.md#lesson-linear-regression) | #56, #23 |
| 58 | 로지스틱 회귀, 시그모이드, 분류 임계값 | 머신러닝 기초 | [4-2 로지스틱 회귀, 시그모이드, 분류 임계값](4-2-linear-models.md#lesson-logistic-regression) | #57, #38 |
| 59 | 혼동행렬, 정확도, 정밀도, 재현율, F1 | 머신러닝 기초 | [4-2 혼동행렬, 정확도, 정밀도, 재현율, F1](4-2-linear-models.md#lesson-classification-metrics) | #58 |
| 60 | ROC-AUC, PR-AUC, 클래스 불균형 | 머신러닝 기초 | [4-2 ROC-AUC, PR-AUC, 클래스 불균형](4-2-linear-models.md#lesson-roc-pr) | #59 |
| 61 | 일반화, 과적합, 과소적합, 편향·분산 | 머신러닝 기초 | [4-3 일반화, 과적합, 과소적합, 편향과 분산](4-3-generalization.md#lesson-bias-variance) | #54, #57 |
| 62 | L1·L2 규제, 조기 종료, 학습 곡선 | 머신러닝 기초 | [4-3 L1·L2 규제, 조기 종료, 학습 곡선](4-3-generalization.md#lesson-regularization) | #61 |
| 63 | 교차검증, 시계열 검증, 하이퍼파라미터 탐색 | 머신러닝 기초 | [4-3 교차검증, 시계열 검증, 하이퍼파라미터 탐색](4-3-generalization.md#lesson-cross-validation) | #61, #54 |
| 64 | k최근접 이웃, 결정트리, 랜덤 포레스트 | 머신러닝 기초 | [4-4 k최근접 이웃, 결정트리, 랜덤 포레스트](4-4-ml-algorithms.md#lesson-knn-trees) | #22, #61 |
| 65 | 그래디언트 부스팅, 특성 중요도 | 머신러닝 기초 | [4-4 그래디언트 부스팅, 특성 중요도](4-4-ml-algorithms.md#lesson-boosting) | #64 |
| 66 | K-means, PCA, 머신러닝 파이프라인 | 머신러닝 기초 | [4-4 K-means, PCA, 머신러닝 파이프라인](4-4-ml-algorithms.md#lesson-kmeans-pca-pipeline) | #35, #24, #63 |
| 67 | 퍼셉트론, 다층 신경망, 활성화 함수 | 딥러닝 기초 | [5-1 퍼셉트론, 다층 신경망, 활성화 함수](5-1-neural-networks.md#lesson-perceptron-mlp) | #58, #23 |
| 68 | 순전파, 역전파, 계산 그래프, 자동미분 | 딥러닝 기초 | [5-1 순전파, 역전파, 계산 그래프](5-1-neural-networks.md#lesson-backprop) · [5-1 자동미분 엔진 구현](5-1-neural-networks.md#lesson-micrograd) | #67, #27, #13 |
| 69 | 배치, 에포크, 학습률, SGD, Adam | 딥러닝 기초 | [5-1 배치, 에포크, 학습률, SGD, Adam](5-1-neural-networks.md#lesson-optimizers) | #68 |
| 70 | 가중치 초기화, 기울기 소실·폭주, 정규화 층 | 딥러닝 기초 | [5-2 가중치 초기화와 기울기 소실·폭주](5-2-deep-training.md#lesson-initialization) · [5-2 정규화 층: BatchNorm과 LayerNorm](5-2-deep-training.md#lesson-normalization-layers) | #69, #31 |
| 71 | 드롭아웃, 잔차 연결, 전이학습 | 딥러닝 기초 | [5-2 드롭아웃과 잔차 연결](5-2-deep-training.md#lesson-dropout-residual) · [5-2 전이학습과 학습 진단](5-2-deep-training.md#lesson-transfer-learning) | #70, #62 |
| 72 | PyTorch 텐서, 데이터 로더, 학습 루프, GPU | 딥러닝 기초 | [5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch) | #69, #13, #39 |
| 73 | 합성곱, CNN, 이미지 증강 | 딥러닝 기초 | [5-3 합성곱](5-3-cnn-rnn.md#lesson-convolution) · [5-3 풀링과 수용영역](5-3-cnn-rnn.md#lesson-pooling) · [5-3 CNN 학습과 이미지 증강](5-3-cnn-rnn.md#lesson-cnn-training) | #72, #40 |
| 74 | 시퀀스 데이터, 임베딩, RNN의 기본 구조 | 딥러닝 기초 | [5-3 시퀀스 데이터와 임베딩](5-3-cnn-rnn.md#lesson-embeddings) · [5-3 RNN의 구조와 시간 역전파](5-3-cnn-rnn.md#lesson-rnn) | #68, #22 |
| 75 | 토큰화, 서브워드, 토큰 임베딩, 위치 정보 | 생성형 AI와 언어 모델 | [6-1 토큰화, 서브워드, 토큰 임베딩, 위치 정보](6-1-transformers.md#lesson-tokenization) | #74, #5 |
| 76 | 쿼리·키·값, 셀프 어텐션, 트랜스포머 | 생성형 AI와 언어 모델 | [6-1 어텐션의 필요성: Seq2Seq의 병목](6-1-transformers.md#lesson-attention-motivation) · [6-1 셀프 어텐션: 쿼리·키·값](6-1-transformers.md#lesson-self-attention) · [6-1 멀티헤드 어텐션과 인과 마스크](6-1-transformers.md#lesson-multi-head-attention) · [6-1 트랜스포머 디코더 블록](6-1-transformers.md#lesson-transformer-block) | #75, #23, #70 |
| 77 | 다음 토큰 예측, 사전학습, 문맥 창, 샘플링 | 생성형 AI와 언어 모델 | [6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining) · [6-2 샘플링과 디코딩 전략](6-2-llm-training.md#lesson-decoding) | #76, #38, #32 |
| 78 | 지시 미세조정, LoRA, 선호도 학습, 프롬프트 설계 | 생성형 AI와 언어 모델 | [6-2 지시 미세조정과 LoRA](6-2-llm-training.md#lesson-instruction-tuning) · [6-2 선호도 학습: RLHF와 DPO](6-2-llm-training.md#lesson-preference-learning) · [6-2 프롬프트 설계](6-2-llm-training.md#lesson-prompt-design) | #77 |
| 79 | 벡터 검색, RAG, 도구 호출, 에이전트 | 생성형 AI와 언어 모델 | [6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval) · [6-3 RAG 파이프라인](6-3-llm-systems.md#lesson-rag) · [6-3 검색 품질 지표: Recall@k와 MRR](6-3-llm-systems.md#lesson-retrieval-metrics) · [6-3 도구 호출과 에이전트 루프](6-3-llm-systems.md#lesson-agents) · [6-3 에이전트 설계와 안전](6-3-llm-systems.md#lesson-agent-design) | #77, #22, #10, #14 |
| 80 | 환각·안전성 평가, 모델 서빙, 추론 비용, 운영 모니터링 | 생성형 AI와 언어 모델 | [6-3 환각과 한계](6-3-llm-systems.md#lesson-hallucination) · [6-3 LLM 평가와 안전성 평가](6-3-llm-systems.md#lesson-llm-evaluation) · [6-3 모델 서빙과 추론 비용](6-3-llm-systems.md#lesson-serving-cost) · [6-3 운영 모니터링](6-3-llm-systems.md#lesson-monitoring) | #79, #59, #37 |
