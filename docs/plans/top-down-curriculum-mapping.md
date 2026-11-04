# 부록: 기존 104단계 재배치표

[재구성 플랜](top-down-curriculum.md) · [현재 커리큘럼 목차](../curriculum/README.md) · [문서 홈](../README.md)

> 상태: **구현 완료.** 예전 8주 구성의 104단계가 새 구조의 어디로 갔는지 정리한 기록이다. 단계 이름의 링크는 그 단계를 이어받은 레슨의 문서로 연결된다. 예전 주소의 연결은 `src/content/curriculum/legacy.ts`가 맡는다.

- **핵심 레슨(ID 유지):** 새 핵심 레슨의 주 원본이다. 단계 ID를 그대로 써서 URL과 진도 키가 보존된다. 분할하면 원 ID는 확인 문제가 가장 많이 옮겨 가는 레슨에 남고, 나머지 레슨은 새 ID를 받아 원 단계 완료자에게 인정된다.
- **보충·심화 유지:** 선수 개념이 끝나는 모듈의 선택 레슨이 된다. 일부 내용은 핵심 레슨으로 발췌·승격한다.
- **확장 모듈:** 80개 목록 밖의 선택 모듈(X-1 책임 있는 AI, X-2 비전과 생성 모델)로 간다.
- **흡수:** 다른 핵심 레슨에 합치고 ID를 은퇴시킨다.

## 집계

| 주차 | 단계 | 핵심 레슨(ID 유지) | 보충·심화 유지 | 확장 모듈 | 흡수 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1주차 | 15 | 11 | 4 | 0 | 0 |
| 2주차 | 15 | 10 | 5 | 0 | 0 |
| 3주차 | 13 | 7 | 5 | 0 | 1 |
| 4주차 | 11 | 5 | 2 | 4 | 0 |
| 5주차 | 13 | 7 | 6 | 0 | 0 |
| 6주차 | 12 | 5 | 7 | 0 | 0 |
| 7주차 | 13 | 7 | 5 | 1 | 0 |
| 8주차 | 12 | 4 | 2 | 6 | 0 |
| 합계 | 104 | 56 | 36 | 11 | 1 |

## 1주차 · AI 지형도와 수학·코드 기초

| 단계 | 구분 | 새 위치 | 분류 | 처리 |
| --- | --- | --- | --- | --- |
| [1.1 AI의 지형도와 "함수를 찾는 게임"](../curriculum/0-1-course-overview.md#lesson-ai-landscape) | 핵심 | 0-1 | 핵심 레슨(ID 유지) | 그대로 |
| [1.2 AI 핵심 용어와 4대 학습 패러다임](../curriculum/4-1-ml-framing.md#lesson-ml-terms) | 핵심 | 4-1 #51·#52 | 핵심 레슨(ID 유지) | 분할. #53·#56 도입부로 일부 발췌 |
| [1.3 Python 기초 문법](../curriculum/1-1-python-flow.md#lesson-variables-types) | 핵심 | 1-1 #1–4, 1-2 #5·#6·#8·#9, 1-3 #11 | 핵심 레슨(ID 유지) | 레슨 9개로 분할 |
| [1.4 NumPy 첫걸음: 배열·축·브로드캐스팅](../curriculum/3-1-numpy.md#lesson-numpy-arrays) | 핵심 | 3-1 #39·#40 | 핵심 레슨(ID 유지) | 분할 |
| [1.5 벡터: 내적과 코사인 유사도](../curriculum/2-2-linear-algebra.md#lesson-dot-product) | 핵심 | 2-2 #22 | 핵심 레슨(ID 유지) | 분할. #20·#21 도입과 #23 행렬-벡터 곱으로 발췌 |
| [1.6 확률과 베이즈 정리](../curriculum/2-4-probability-basics.md#lesson-bayes) | 핵심 | 2-4 #29·#30·#31 | 핵심 레슨(ID 유지) | 분할 |
| [1.7 미분과 경사하강법](../curriculum/2-3-calculus-optimization.md#lesson-gradient-descent) | 핵심 | 2-3 #25–28 | 핵심 레슨(ID 유지) | 레슨 4개로 분할 |
| [1.8 Python 한 걸음 더: 클래스와 예외 처리](../curriculum/1-4-python-objects-tools.md#lesson-classes-objects) | 보충 | 1-3 #11(예외), 1-4 #13(클래스) | 핵심 레슨(ID 유지) | 보충 → 핵심. 분할. 퍼셉트론 클래스 예제는 5-1 #67 도입으로 |
| [1.9 개발 환경: 가상환경·Jupyter·Colab·Git](../curriculum/1-3-python-files-errors.md#lesson-modules-environments) | 보충 | 1-3 #12, 1-4 #15·#16 | 핵심 레슨(ID 유지) | 보충 → 핵심. 분할 |
| [1.10 벡터공간·기저와 행렬 곱셈](../curriculum/2-2-linear-algebra.md#lesson-linear-maps-basis) | 보충 | 2-2 #21·#23·#24 | 핵심 레슨(ID 유지) | 보충 → 핵심. 분할 |
| [1.11 연속 확률분포: 균등분포와 정규분포](../curriculum/2-4-probability-basics.md#lesson-distributions) | 보충 | 2-4 #32 | 핵심 레슨(ID 유지) | 보충 → 핵심. 중심극한정리는 2-6 #36으로 발췌 |
| [1.12 계수·노름·고유값·SVD](../curriculum/2-2-linear-algebra.md#lesson-rank-eigen) | 심화 | 2-2 심화 | 보충·심화 유지 | 유지 |
| [1.13 이산확률분포와 가능도: MLE와 MAP](../curriculum/2-6-inference-information.md#lesson-mle-map) | 심화 | 2-6 심화 | 보충·심화 유지 | 유지. 이항분포는 #32, MLE 입문은 #38로 발췌 |
| [1.14 엔트로피·교차 엔트로피·KL 발산](../curriculum/2-6-inference-information.md#lesson-entropy-kl) | 심화 | 2-6 심화 | 보충·심화 유지 | 유지. 엔트로피·교차엔트로피 입문은 #38로 발췌 |
| [1.15 경사하강법의 수렴 조건과 조건수](../curriculum/2-3-calculus-optimization.md#lesson-gd-convergence) | 심화 | 2-3 심화 | 보충·심화 유지 | 유지 |

## 2주차 · 머신러닝 기본기

| 단계 | 구분 | 새 위치 | 분류 | 처리 |
| --- | --- | --- | --- | --- |
| [2.1 데이터 수집·정제와 결측값·이상치](../curriculum/3-3-data-preparation.md#lesson-data-cleaning) | 핵심 | 3-3 #46 | 핵심 레슨(ID 유지) | 사분위수 설명은 2-5 #34, pandas 예제는 3-2 #42 도입으로 발췌 |
| [2.2 특징 공학·인코딩·스케일링과 EDA](../curriculum/3-3-data-preparation.md#lesson-encoding-scaling) | 핵심 | 3-3 #48·#49·#50 | 핵심 레슨(ID 유지) | 분할. 명목형·순서형은 3-2 #45, 데이터 증강은 5-3 #73으로 |
| [2.3 문제 유형과 손실함수: 선형·다항·로지스틱 회귀](../curriculum/4-2-linear-models.md#lesson-linear-regression) | 핵심 | 4-2 #57·#58 | 핵심 레슨(ID 유지) | 분할. 문제 유형·손실 선택 도입은 4-1 #53·#56으로 |
| [2.4 결정트리·랜덤 포레스트·부스팅](../curriculum/4-4-ml-algorithms.md#lesson-knn-trees) | 핵심 | 4-4 #64·#65 | 핵심 레슨(ID 유지) | 분할 |
| [2.5 편향-분산 트레이드오프와 정규화](../curriculum/4-3-generalization.md#lesson-bias-variance) | 핵심 | 4-3 #61·#62 | 핵심 레슨(ID 유지) | 분할 |
| [2.6 데이터 분할·교차검증·데이터 누수](../curriculum/4-1-ml-framing.md#lesson-data-splits) | 핵심 | 4-1 #54 | 핵심 레슨(ID 유지) | 분할. K-Fold는 4-3 #63으로 |
| [2.7 분류 평가지표: 정확도·Precision·Recall·ROC-AUC](../curriculum/4-2-linear-models.md#lesson-classification-metrics) | 핵심 | 4-2 #59·#60 | 핵심 레슨(ID 유지) | 분할. 임계값은 #58로 |
| [2.8 회귀 평가지표·베이스라인·오차 분석](../curriculum/4-1-ml-framing.md#lesson-baselines) | 핵심 | 4-1 #55 | 핵심 레슨(ID 유지) | 분할. 회귀 지표는 4-2 #57로 |
| [2.9 KNN과 나이브 베이즈](../curriculum/4-4-ml-algorithms.md#lesson-naive-bayes) | 보충 | 4-4 보충(나이브 베이즈) | 보충·심화 유지 | 유지. KNN은 #64로 발췌·승격 |
| [2.10 SVM·K-Means·PCA](../curriculum/4-4-ml-algorithms.md#lesson-kmeans-pca-pipeline) | 보충 | 4-4 #66(K-Means·PCA) | 핵심 레슨(ID 유지) | 보충 → 핵심. SVM은 4-4 보충 레슨으로 분리 |
| [2.11 실전 파이프라인: ColumnTransformer·하이퍼파라미터 탐색·그룹 분할](../curriculum/4-3-generalization.md#lesson-cross-validation) | 보충 | 4-3 #63 | 핵심 레슨(ID 유지) | 보충 → 핵심. ColumnTransformer는 4-4 #66으로 |
| [2.12 불균형 데이터와 임계값 결정: PR 곡선·비용·확률 보정](../curriculum/4-2-linear-models.md#lesson-cost-threshold) | 보충 | 4-2 보충(비용 임계값·보정) | 보충·심화 유지 | 유지. PR 곡선·불균형은 #60으로 발췌·승격 |
| [2.13 손실함수의 확률적 기원: 최대가능도로 본 MSE·교차 엔트로피와 정규화](../curriculum/4-2-linear-models.md#lesson-loss-likelihood) | 심화 | 4-2 심화 | 보충·심화 유지 | 유지. 평균 대 중앙값 예는 2-5 #34로 발췌 |
| [2.14 편향-분산 분해의 유도와 이중 하강](../curriculum/4-3-generalization.md#lesson-bias-variance-theory) | 심화 | 4-3 심화 | 보충·심화 유지 | 유지 |
| [2.15 평가의 통계학: 선택 편향·중첩 교차검증·짝지은 비교](../curriculum/4-3-generalization.md#lesson-model-evaluation-stats) | 심화 | 4-3 심화 | 보충·심화 유지 | 유지. 선수 개념 #37 |

## 3주차 · 신경망과 역전파

| 단계 | 구분 | 새 위치 | 분류 | 처리 |
| --- | --- | --- | --- | --- |
| [3.1 뉴런과 MLP, 활성화 함수](../curriculum/5-1-neural-networks.md#lesson-perceptron-mlp) | 핵심 | 5-1 #67 | 핵심 레슨(ID 유지) | 그대로 |
| [3.2 역전파 = 연쇄법칙의 효율적 적용](../curriculum/5-1-neural-networks.md#lesson-backprop) | 핵심 | 5-1 #68(계산 그래프) | 핵심 레슨(ID 유지) | 그대로 |
| [3.3 자동미분 엔진을 읽기 위한 파이썬 문법](../curriculum/1-2-python-collections-functions.md#lesson-functions-scope) | 핵심 | 1-2 #5(set)·#8(클로저·재귀), 1-4 #13(연산자 오버로딩) | 흡수 | 흡수, ID 은퇴. 확인 문제 상태는 옮겨 간 레슨으로 이전 |
| [3.4 미니 자동미분 엔진(micrograd) 직접 구현하기](../curriculum/5-1-neural-networks.md#lesson-micrograd) | 핵심 | 5-1 #68(자동미분 엔진) | 핵심 레슨(ID 유지) | 시작에 #8·#13 준비 점검 |
| [3.5 최적화기: SGD·Momentum·Adam](../curriculum/5-1-neural-networks.md#lesson-optimizers) | 핵심 | 5-1 #69 | 핵심 레슨(ID 유지) | 그대로 |
| [3.6 실전 이슈: 기울기 소실·폭발과 가중치 초기화](../curriculum/5-2-deep-training.md#lesson-initialization) | 핵심 | 5-2 #70(초기화·기울기 소실) | 핵심 레슨(ID 유지) | 그대로 |
| [3.7 PyTorch가 대신해주는 것들](../curriculum/5-2-deep-training.md#lesson-pytorch) | 핵심 | 5-2 #72 | 핵심 레슨(ID 유지) | 버그 목록은 1-3 #11로 발췌 |
| [3.8 정규화 층: BatchNorm과 LayerNorm](../curriculum/5-2-deep-training.md#lesson-normalization-layers) | 보충 | 5-2 #70(정규화 층) | 핵심 레슨(ID 유지) | 보충 → 핵심 |
| [3.9 GPU·혼합 정밀도와 PyTorch 실전](../curriculum/5-2-deep-training.md#lesson-pytorch-practice) | 보충 | 5-2 보충 | 보충·심화 유지 | 유지. GPU 부분은 #72로 발췌·승격 |
| [3.10 딥러닝 학습 기법: 드롭아웃·가중치 감쇠·학습률 스케줄·조기 종료](../curriculum/5-2-deep-training.md#lesson-training-schedules) | 보충 | 5-2 보충 | 보충·심화 유지 | 유지. 드롭아웃은 #71, 조기 종료는 #62로 발췌·승격 |
| [3.11 자동미분의 두 모드: 순방향·역방향과 메모리](../curriculum/5-1-neural-networks.md#lesson-autodiff-theory) | 심화 | 5-1 심화 | 보충·심화 유지 | 유지 |
| [3.12 Adam의 이론: 편향 보정·AdamW·워밍업](../curriculum/5-1-neural-networks.md#lesson-adam-theory) | 심화 | 5-1 심화 | 보충·심화 유지 | 유지 |
| [3.13 기울기 흐름의 수학: 야코비안의 곱·잔차 연결·기울기 클리핑](../curriculum/5-2-deep-training.md#lesson-gradient-flow) | 심화 | 5-2 심화 | 보충·심화 유지 | 유지 |

## 4주차 · 딥러닝 실전: CNN · 정규화 · 학습 진단

| 단계 | 구분 | 새 위치 | 분류 | 처리 |
| --- | --- | --- | --- | --- |
| [4.1 합성곱: 파라미터를 공유하는 지역 패턴 검출기](../curriculum/5-3-cnn-rnn.md#lesson-convolution) | 핵심 | 5-3 #73(합성곱) | 핵심 레슨(ID 유지) | 그대로 |
| [4.2 풀링과 수용영역](../curriculum/5-3-cnn-rnn.md#lesson-pooling) | 핵심 | 5-3 #73(풀링·수용영역) | 핵심 레슨(ID 유지) | 그대로 |
| [4.3 ResNet: 잔차 연결](../curriculum/5-2-deep-training.md#lesson-dropout-residual) | 핵심 | 5-2 #71(잔차 연결) | 핵심 레슨(ID 유지) | 드롭아웃과 한 레슨 |
| [4.4 정규화·일반화 기법과 CIFAR-10 학습](../curriculum/5-3-cnn-rnn.md#lesson-cnn-training) | 핵심 | 5-3 #73(CNN 학습·이미지 증강) | 핵심 레슨(ID 유지) | 그대로 |
| [4.5 전이학습과 학습 진단 레시피](../curriculum/5-2-deep-training.md#lesson-transfer-learning) | 핵심 | 5-2 #71(전이학습·학습 진단) | 핵심 레슨(ID 유지) | 그대로 |
| [4.6 CNN의 계보와 응용: LeNet부터 ViT까지](../curriculum/5-3-cnn-rnn.md#lesson-cnn-architectures) | 보충 | 5-3 보충 | 보충·심화 유지 | 유지 |
| [4.7 생성 모델: Autoencoder·VAE·GAN·Diffusion](../curriculum/X-2-vision-generative.md#lesson-generative-models) | 보충 | X-2 | 확장 모듈 | 확장 |
| [4.8 탐지·분할의 핵심 계산: IoU·NMS·AP·Dice](../curriculum/X-2-vision-generative.md#lesson-detection-segmentation) | 보충 | X-2 | 확장 모듈 | 확장 |
| [4.9 합성곱의 계산: im2col·역전파·depthwise 분리](../curriculum/5-3-cnn-rnn.md#lesson-conv-as-matmul) | 심화 | 5-3 심화 | 보충·심화 유지 | 유지 |
| [4.10 생성 모델의 수학: ELBO·재매개변수화·확산의 노이즈 예측](../curriculum/X-2-vision-generative.md#lesson-generative-math) | 심화 | X-2 심화 | 확장 모듈 | 확장 |
| [4.11 적대적 예제: 선형성 가설과 FGSM](../curriculum/X-1-responsible-ai.md#lesson-adversarial-examples) | 심화 | X-1 심화 | 확장 모듈 | 확장 |

## 5주차 · Transformer와 Attention

| 단계 | 구분 | 새 위치 | 분류 | 처리 |
| --- | --- | --- | --- | --- |
| [5.1 시퀀스 데이터와 단어 임베딩](../curriculum/5-3-cnn-rnn.md#lesson-embeddings) | 핵심 | 5-3 #74(시퀀스·임베딩) | 핵심 레슨(ID 유지) | 토큰화 도입은 6-1 #75로 |
| [5.2 RNN과 BPTT: 순서대로 읽기와 기울기 소실](../curriculum/5-3-cnn-rnn.md#lesson-rnn) | 핵심 | 5-3 #74(RNN·BPTT) | 핵심 레슨(ID 유지) | 그대로 |
| [5.3 Seq2Seq의 병목과 Attention의 등장](../curriculum/6-1-transformers.md#lesson-attention-motivation) | 핵심 | 6-1 #76(왜 Attention인가) | 핵심 레슨(ID 유지) | 그대로 |
| [5.4 Self-Attention: Q·K·V와 스케일링](../curriculum/6-1-transformers.md#lesson-self-attention) | 핵심 | 6-1 #76(Q·K·V) | 핵심 레슨(ID 유지) | 그대로 |
| [5.5 멀티헤드 Attention과 Causal Mask](../curriculum/6-1-transformers.md#lesson-multi-head-attention) | 핵심 | 6-1 #76(멀티헤드·마스크) | 핵심 레슨(ID 유지) | 그대로 |
| [5.6 위치 인코딩과 Transformer 디코더 블록](../curriculum/6-1-transformers.md#lesson-transformer-block) | 핵심 | 6-1 #76(디코더 블록) | 핵심 레슨(ID 유지) | 위치 인코딩 도입은 #75로 |
| [5.7 토크나이저: BPE](../curriculum/6-1-transformers.md#lesson-tokenization) | 핵심 | 6-1 #75 | 핵심 레슨(ID 유지) | 그대로 |
| [5.8 LSTM과 GRU: 게이트로 기억을 통제하다](../curriculum/5-3-cnn-rnn.md#lesson-lstm-gru) | 보충 | 5-3 보충 | 보충·심화 유지 | 유지 |
| [5.9 생성할 때의 Transformer: KV 캐시와 RoPE](../curriculum/6-2-llm-training.md#lesson-kv-cache-rope) | 보충 | 6-2 보충 | 보충·심화 유지 | 유지 |
| [5.10 Transformer의 크기 계산: 파라미터·연산량·메모리](../curriculum/6-3-llm-systems.md#lesson-transformer-params) | 보충 | 6-3 보충 | 보충·심화 유지 | 유지. 연산량·메모리 계산은 #80으로 발췌 |
| [5.11 긴 문맥의 비용: 온라인 softmax와 FlashAttention](../curriculum/6-1-transformers.md#lesson-efficient-attention) | 심화 | 6-1 심화 | 보충·심화 유지 | 유지 |
| [5.12 선형 어텐션: Attention을 RNN으로 바꾸기](../curriculum/6-1-transformers.md#lesson-linear-attention) | 심화 | 6-1 심화 | 보충·심화 유지 | 유지 |
| [5.13 위치 인코딩의 수학과 길이 외삽](../curriculum/6-1-transformers.md#lesson-position-extrapolation) | 심화 | 6-1 심화 | 보충·심화 유지 | 유지 |

## 6주차 · LLM 원리: 사전학습 · 스케일링 · 정렬 · 디코딩

| 단계 | 구분 | 새 위치 | 분류 | 처리 |
| --- | --- | --- | --- | --- |
| [6.1 사전학습: 다음 토큰 예측과 Perplexity](../curriculum/6-2-llm-training.md#lesson-pretraining) | 핵심 | 6-2 #77(사전학습·문맥 창) | 핵심 레슨(ID 유지) | 문맥 창 보강 |
| [6.2 LLM 아키텍처: BERT · GPT · T5](../curriculum/6-2-llm-training.md#lesson-llm-architectures) | 핵심 | 6-2 보충 | 보충·심화 유지 | 핵심 → 보충(80개 목록 밖) |
| [6.3 스케일링 법칙](../curriculum/6-2-llm-training.md#lesson-scaling-laws) | 핵심 | 6-2 보충 | 보충·심화 유지 | 핵심 → 보충(80개 목록 밖) |
| [6.4 SFT와 효율적 파인튜닝: LoRA · 양자화 · 증류](../curriculum/6-2-llm-training.md#lesson-instruction-tuning) | 핵심 | 6-2 #78(지시 미세조정·LoRA) | 핵심 레슨(ID 유지) | 양자화·증류는 6-3 #80으로 |
| [6.5 RLHF와 DPO](../curriculum/6-2-llm-training.md#lesson-preference-learning) | 핵심 | 6-2 #78(선호도 학습) | 핵심 레슨(ID 유지) | 그대로 |
| [6.6 디코딩 전략과 서빙](../curriculum/6-2-llm-training.md#lesson-decoding) | 핵심 | 6-2 #77(샘플링·디코딩) | 핵심 레슨(ID 유지) | 지연시간·처리량은 6-3 #80으로 |
| [6.7 환각과 한계](../curriculum/6-3-llm-systems.md#lesson-hallucination) | 핵심 | 6-3 #80(환각) | 핵심 레슨(ID 유지) | 문맥 창·지식 컷오프 설명은 6-2 #77로도 발췌 |
| [6.8 강화학습 기초](../curriculum/6-2-llm-training.md#lesson-rl-basics) | 보충 | 6-2 보충 | 보충·심화 유지 | 유지 |
| [6.9 추론 시간 계산: 자기일관성 · best-of-n · 검증기](../curriculum/6-2-llm-training.md#lesson-test-time-compute) | 보충 | 6-2 보충 | 보충·심화 유지 | 유지 |
| [6.10 DPO의 유도: KL 규제 보상 최대화에서 손실까지](../curriculum/6-2-llm-training.md#lesson-dpo-derivation) | 심화 | 6-2 심화 | 보충·심화 유지 | 유지 |
| [6.11 정책 경사와 PPO: REINFORCE · 기준선 · 클리핑](../curriculum/6-2-llm-training.md#lesson-policy-gradient) | 심화 | 6-2 심화 | 보충·심화 유지 | 유지 |
| [6.12 투기적 디코딩: 분포를 보존하는 초안-검증](../curriculum/6-3-llm-systems.md#lesson-speculative-decoding) | 심화 | 6-3 심화 | 보충·심화 유지 | 유지 |

## 7주차 · LLM 활용: 프롬프트 · RAG · 에이전트 · 평가

| 단계 | 구분 | 새 위치 | 분류 | 처리 |
| --- | --- | --- | --- | --- |
| [7.1 프롬프트 설계 원칙](../curriculum/6-2-llm-training.md#lesson-prompt-design) | 핵심 | 6-2 #78(프롬프트 설계) | 핵심 레슨(ID 유지) | 그대로 |
| [7.2 임베딩과 벡터 검색: Dense · Sparse · Hybrid](../curriculum/6-3-llm-systems.md#lesson-retrieval) | 핵심 | 6-3 #79(벡터 검색) | 핵심 레슨(ID 유지) | 그대로 |
| [7.3 RAG 파이프라인](../curriculum/6-3-llm-systems.md#lesson-rag) | 핵심 | 6-3 #79(RAG) | 핵심 레슨(ID 유지) | 그대로 |
| [7.4 검색 품질 지표: Recall@k와 MRR](../curriculum/6-3-llm-systems.md#lesson-retrieval-metrics) | 핵심 | 6-3 #79(검색 품질) | 핵심 레슨(ID 유지) | 그대로 |
| [7.5 에이전트 루프: ReAct와 도구 호출](../curriculum/6-3-llm-systems.md#lesson-agents) | 핵심 | 6-3 #79(도구 호출·에이전트 루프) | 핵심 레슨(ID 유지) | 그대로 |
| [7.6 에이전트 설계와 안전: 메모리 · 멀티에이전트 · MCP · 사람 승인](../curriculum/6-3-llm-systems.md#lesson-agent-design) | 핵심 | 6-3 #79(에이전트 설계·안전) | 핵심 레슨(ID 유지) | 그대로 |
| [7.7 평가: 골든셋 · LLM-as-judge · 회귀 테스트](../curriculum/6-3-llm-systems.md#lesson-llm-evaluation) | 핵심 | 6-3 #80(평가·안전성 평가) | 핵심 레슨(ID 유지) | 탈옥·인젝션 테스트셋 보강 |
| [7.8 실전 벡터 검색: ANN 인덱스 · 필터 · 재순위화](../curriculum/6-3-llm-systems.md#lesson-ann-indexes) | 보충 | 6-3 보충 | 보충·심화 유지 | 유지 |
| [7.9 도구 호출 실전: 스키마 · 인자 검증 · 안전한 도구](../curriculum/6-3-llm-systems.md#lesson-tool-use) | 보충 | 6-3 보충 | 보충·심화 유지 | 유지 |
| [7.10 멀티모달 AI: CLIP · zero-shot · VLM](../curriculum/X-2-vision-generative.md#lesson-multimodal) | 보충 | X-2 | 확장 모듈 | 확장 |
| [7.11 대조 학습의 수학: InfoNCE · 온도 · 배치 크기](../curriculum/6-3-llm-systems.md#lesson-contrastive-learning) | 심화 | 6-3 심화 | 보충·심화 유지 | 유지 |
| [7.12 LLM 평가의 통계: 신뢰구간 · 짝지은 비교 · 채점관 보정](../curriculum/6-3-llm-systems.md#lesson-eval-statistics) | 심화 | 6-3 심화 | 보충·심화 유지 | 유지 |
| [7.13 프롬프트 인젝션을 설계로 막기: 신뢰 경계 · 정보 흐름 통제](../curriculum/6-3-llm-systems.md#lesson-injection-defense) | 심화 | 6-3 심화 | 보충·심화 유지 | 유지. 안전성 테스트 일부는 #80으로 |

## 8주차 · AI와 캡스톤 프로젝트

| 단계 | 구분 | 새 위치 | 분류 | 처리 |
| --- | --- | --- | --- | --- |
| [8.1 AI 위험 지도: 편향 · 적대적 공격 · 프라이버시](../curriculum/X-1-responsible-ai.md#lesson-risk-map) | 핵심 | X-1 | 확장 모듈 | 핵심 → 확장(80개 목록 밖). 점검표 요약은 7-1, 레드팀 항목은 6-3 #80으로 |
| [8.2 공정성은 하나가 아니다](../curriculum/X-1-responsible-ai.md#lesson-fairness) | 핵심 | X-1 | 확장 모듈 | 핵심 → 확장(80개 목록 밖). groupby 예제는 3-2 #44로 발췌 |
| [8.3 거버넌스: NIST AI RMF · EU AI Act · 모델카드](../curriculum/7-1-capstone-project.md#lesson-model-cards) | 핵심 | 7-1(모델카드와 위험 점검) | 핵심 레슨(ID 유지) | 그대로 |
| [8.4 MLOps: 모델을 서비스로 만들기](../curriculum/6-3-llm-systems.md#lesson-monitoring) | 핵심 | 6-3 #80(운영 모니터링) | 핵심 레슨(ID 유지) | 그대로 |
| [8.5 AI 연구 방법론: 결과를 믿을 수 있게 만드는 절차](../curriculum/7-1-capstone-project.md#lesson-research-methods) | 핵심 | 7-1(결과를 믿을 수 있게 만드는 절차) | 핵심 레슨(ID 유지) | 재현성 기초는 1-4 #16으로 발췌 |
| [8.6 핵심 논문 하이라이트와 캡스톤 설계](../curriculum/7-1-capstone-project.md#lesson-capstone-design) | 핵심 | 7-1(핵심 논문과 캡스톤 설계) | 핵심 레슨(ID 유지) | 그대로 |
| [8.7 LLMOps: LLM 운영에서 달라지는 점](../curriculum/6-3-llm-systems.md#lesson-llmops) | 보충 | 6-3 보충 | 보충·심화 유지 | 유지 |
| [8.8 프라이버시 공학: 재식별 · k-익명성 · 차등 프라이버시](../curriculum/X-1-responsible-ai.md#lesson-privacy) | 보충 | X-1 | 확장 모듈 | 확장 |
| [8.9 편향 완화: 대리 변수 · 재가중 · 학습 중 벌점 · 후처리 임계값](../curriculum/X-1-responsible-ai.md#lesson-bias-mitigation) | 보충 | X-1 | 확장 모듈 | 확장 |
| [8.10 공정성 불가능성 정리: 항등식 · 보정과 균형 · 무작위 후처리](../curriculum/X-1-responsible-ai.md#lesson-fairness-impossibility) | 심화 | X-1 심화 | 확장 모듈 | 확장 |
| [8.11 프라이버시의 수학: 차등 프라이버시의 보장 · 멤버십 추론 · DP-SGD](../curriculum/X-1-responsible-ai.md#lesson-privacy-math) | 심화 | X-1 심화 | 확장 모듈 | 확장 |
| [8.12 드리프트 감지의 통계: PSI의 의미 · 거짓 경보 · 라벨 드리프트 추정](../curriculum/6-3-llm-systems.md#lesson-drift-statistics) | 심화 | 6-3 심화 | 보충·심화 유지 | 유지 |

## 주차 과제와 백지공부

| 기존 | 새 위치 | 저장 키 |
| --- | --- | --- |
| 1주차 과제 | 2-6 트랙 2 프로젝트(부트스트랩 신뢰구간 항목 추가) | `week-1` 유지(제출·채점·초안 이동 없음) |
| 2주차 과제 | 4-4 트랙 4 프로젝트 | `week-2` 유지(제출·채점·초안 이동 없음) |
| 3주차 과제 | 5-1 모듈 과제 | `week-3` 유지(제출·채점·초안 이동 없음) |
| 4주차 과제 | 5-3 트랙 5 프로젝트 | `week-4` 유지(제출·채점·초안 이동 없음) |
| 5주차 과제 | 6-1 모듈 과제 | `week-5` 유지(제출·채점·초안 이동 없음) |
| 6주차 과제 | 6-2 모듈 과제 | `week-6` 유지(제출·채점·초안 이동 없음) |
| 7주차 과제 | 6-3 트랙 6 프로젝트 | `week-7` 유지(제출·채점·초안 이동 없음) |
| 8주차 과제 | 7-1 캡스톤 | `week-8` 유지(제출·채점·초안 이동 없음) |

주차별 백지공부 기록은 옛 주차 키 그대로 보관하고 읽기 전용으로 보여 준다. 백지공부 문항 40개는 주제에 맞는 모듈의 새 백지공부로 재배정한다. 예를 들어 1주차 ①은 0-1, ②·⑤는 2-2, ③은 2-4, ④는 2-3으로 간다.
