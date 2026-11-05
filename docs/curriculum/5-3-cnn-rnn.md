<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 5-3 이미지와 시퀀스를 위한 신경망

[전체 목차](README.md) · 트랙 5 딥러닝 기초 · [모듈 원본](../../src/content/modules/cnn-rnn/index.ts)

합성곱과 풀링, CNN 학습과 이미지 증강, 임베딩과 RNN, LSTM·GRU

## 목표 문제

CIFAR-10은 $32 \times 32$ 컬러 이미지로 10개 클래스를 분류하는 데이터셋이다. 이미지를 한 줄로 펴서 완전연결층에 넣으면 파라미터가 많고, 물체의 위치가 조금만 바뀌어도 전혀 다른 입력이 된다. 합성곱으로 작은 커널을 모든 위치에 재사용해 파라미터를 줄이고, 풀링과 stride로 해상도를 줄이며 수용영역을 넓힌다. BatchNorm, 드롭아웃, 데이터 증강을 적용해 Colab에서 CIFAR-10 CNN을 학습한다. 이어서 길이가 일정하지 않은 문장을 토큰 번호와 임베딩 벡터의 시퀀스로 바꾸고, RNN으로 한 토큰씩 읽으며 은닉 상태를 갱신한다. 시퀀스가 길면 BPTT에서 기울기가 소실되는 이유를 계산하고, LSTM과 GRU가 게이트로 이 문제를 줄이는 방법을 확인한다.

## 학습 목표

- 합성곱의 출력 크기와 파라미터 수를 계산하고, 지역성과 파라미터 공유가 완전연결층보다 파라미터를 줄이는 이유를 설명한다.
- 풀링과 stride 2 합성곱의 차이를 설명하고, 점프를 이용해 여러 층의 수용영역을 계산한다.
- BatchNorm2d, 드롭아웃, 라벨을 보존하는 데이터 증강을 적용해 CIFAR-10 CNN을 학습하고 평가한다.
- 텍스트를 토큰 번호와 임베딩 벡터로 바꾸고, One-hot 표현의 한계와 Word2Vec의 학습 방식을 설명한다.
- RNN의 재귀식과 BPTT를 계산하고, 야코비안의 곱으로 기울기 소실과 폭주를 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [합성곱](#lesson-convolution) | 핵심 | 45분 | #73 합성곱, CNN, 이미지 증강 |
| 2 | [풀링과 수용영역](#lesson-pooling) | 핵심 | 40분 | #73 합성곱, CNN, 이미지 증강 |
| 3 | [CNN 학습과 이미지 증강](#lesson-cnn-training) | 핵심 | 35분 | #73 합성곱, CNN, 이미지 증강 |
| 4 | [시퀀스 데이터와 임베딩](#lesson-embeddings) | 핵심 | 40분 | #74 시퀀스 데이터, 임베딩, RNN의 기본 구조 |
| 5 | [RNN의 구조와 시간 역전파](#lesson-rnn) | 핵심 | 40분 | #74 시퀀스 데이터, 임베딩, RNN의 기본 구조 |
| 6 | [CNN 구조의 발전과 응용](#lesson-cnn-architectures) | 보충 | 45분 | — |
| 7 | [LSTM과 GRU](#lesson-lstm-gru) | 보충 | 40분 | — |
| 8 | [합성곱의 계산: im2col, 역전파, 깊이별 분리](#lesson-conv-as-matmul) | 심화 | 35분 | — |

## 핵심 레슨

<a id="lesson-convolution"></a>

### 1. 합성곱

핵심 · 45분 · [본문 원본](../../src/content/modules/cnn-rnn/convolution.ts) · [실습 원본](../../src/content/modules/cnn-rnn/labs/convolution.ts)

**학습 목표:** 합성곱의 계산 과정과 출력 크기 공식 $\lfloor (N + 2P - K)/S \rfloor + 1$을 적용하고, 채널이 여러 개인 합성곱층의 파라미터 수와 지역성·파라미터 공유가 완전연결층보다 파라미터를 줄이는 정도를 계산한다.

**쓰이는 곳:** 이미지 분류, 물체 검출, 분할 모델의 기본 연산이 합성곱이다([5-3 CNN 구조의 발전과 응용](#lesson-cnn-architectures)). 합성곱층의 출력 크기와 파라미터 수를 계산할 수 있어야 모델을 설계할 때 층의 모양을 맞추고 메모리와 계산량을 추정할 수 있다.

**본문 절:** 합성곱 연산 · 출력 크기 · NumPy로 구현하기 · 채널이 여러 개일 때 · 합성곱의 가정과 파라미터 수

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 4 · 이미지 1

**실습**

- `ex1` 합성곱 직접 구현과 파라미터 수 계산

**서술형**

- `d1` 입력 $32 \times 32$, 커널 $5 \times 5$, padding 2일 때 stride 1과 stride 2의 출력 크기를 계산하고, stride 1에서 $P = (K-1)/2$이면 출력 크기가 입력과 같아지는 이유를 쓰라.
- `d2` 이미지에 완전연결층 대신 합성곱층을 쓰는 이유를 지역성, 평행이동 등변성, 파라미터 공유로 쓰고, $224 \times 224 \times 3$ 입력에서 출력 64개를 만드는 두 층의 파라미터 수를 비교하라.

**참고 자료**

- [CS231n — Convolutional Neural Networks](https://cs231n.github.io/convolutional-networks/) — 합성곱, padding, stride, 파라미터 수를 그림과 예제로 (영문)
- [CNN Explainer (Georgia Tech)](https://poloclub.github.io/cnn-explainer/) — 실제 CNN의 층별 출력을 브라우저에서 확인하는 시각화 (영문)

<a id="lesson-pooling"></a>

### 2. 풀링과 수용영역

핵심 · 40분 · [본문 원본](../../src/content/modules/cnn-rnn/pooling.ts) · [실습 원본](../../src/content/modules/cnn-rnn/labs/pooling.ts)

**학습 목표:** Max Pooling과 Average Pooling의 차이와 stride 2 합성곱과의 관계를 설명하고, 점프 $j$를 이용해 여러 층의 수용영역을 계산한다.

**쓰이는 곳:** CNN은 풀링이나 stride 2 합성곱으로 해상도를 줄이며 층을 쌓는다. 수용영역을 계산할 수 있어야 마지막 층의 한 칸이 이미지의 어느 범위로 계산되는지 알 수 있고, 분류·검출·분할 모델([5-3 CNN 구조의 발전과 응용](#lesson-cnn-architectures))의 층 구성을 이해할 수 있다.

**본문 절:** 풀링 · stride 2 합성곱 · 수용영역

**구성:** 확인 문제 5 · 출력 예측 2 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 2 · 이미지 1

**실습**

- `ex1` 반복문 없는 풀링과 수용영역 계산기

**서술형**

- `d1` $3 \times 3$ 합성곱(stride 1)을 두 층, 세 층 쌓았을 때의 수용영역을 점프 $j$와 갱신식으로 계산하고, 첫 합성곱 뒤에 $2 \times 2$ 풀링(stride 2)을 넣으면 다음 $3 \times 3$ 합성곱의 수용영역이 어떻게 바뀌는지 쓰라.
- `d2` $2 \times 2$ 영역 $[[1, 3], [2, 4]]$에 Max Pooling과 Average Pooling을 적용한 결과를 쓰고, 두 방식이 남기는 정보의 차이를 쓰라. Max Pooling 대신 stride 2 합성곱을 쓸 때의 차이도 쓰라.

**참고 자료**

- [Distill — Computing Receptive Fields of CNNs](https://distill.pub/2019/computing-receptive-fields/) — 본문의 점프 공식을 일반화한 수용영역 계산 (영문)
- [Springenberg et al. (2015) — Striving for Simplicity: The All Convolutional Net](https://arxiv.org/abs/1412.6806) — 풀링을 stride 2 합성곱으로 바꾼 구조 (영문)
- [d2l.ai — Pooling](https://d2l.ai/chapter_convolutional-neural-networks/pooling.html) — 풀링과 다중 채널 처리 (영문)

<a id="lesson-cnn-training"></a>

### 3. CNN 학습과 이미지 증강

핵심 · 35분 · [본문 원본](../../src/content/modules/cnn-rnn/cnn-training.ts) · [실습 원본](../../src/content/modules/cnn-rnn/labs/cnn-training.ts)

**학습 목표:** 합성곱층 뒤의 BatchNorm2d와 드롭아웃, 가중치 감쇠를 CNN에 적용하고, 라벨을 보존하는 데이터 증강을 데이터의 성질에 맞게 고르며, Colab에서 CIFAR-10 CNN을 학습하고 평가한다.

**쓰이는 곳:** 이미지 분류 모델은 파라미터가 많아 학습 데이터에 쉽게 과적합된다. 데이터 증강과 규제를 알맞게 설정해야 처음 보는 이미지에서도 성능이 유지되며, 이 설정은 전이학습([5-2 전이학습과 학습 진단](5-2-deep-training.md#lesson-transfer-learning))을 포함한 이미지 모델의 학습 코드에 공통으로 들어간다.

**본문 절:** CNN에 쓰는 정규화와 규제 · 데이터 증강 · CIFAR-10 CNN 학습하기

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 1 · Colab 코드 3 · 그림 1

**실습**

- `ex1` BatchNorm2d와 라벨을 보존하는 이동 증강 구현하기

**서술형**

- `d1` BatchNorm과 드롭아웃을 쓰는 CNN을 평가할 때 `net.eval()`을 호출하지 않으면 생기는 문제를 두 층의 동작으로 쓰라.
- `d2` 손글씨 숫자에 위아래 뒤집기 증강이 잘못된 이유, CIFAR-10에서 좌우 뒤집기는 쓰지만 위아래 뒤집기는 잘 쓰지 않는 이유, 증강을 학습 데이터에만 적용하는 이유를 쓰라.

**참고 자료**

- [PyTorch — Training a Classifier (CIFAR-10)](https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html) — 본문 CIFAR-10 코드와 같은 흐름의 공식 튜토리얼 (영문)
- [Shorten & Khoshgoftaar (2019) — A survey on Image Data Augmentation for Deep Learning](https://journalofbigdata.springeropen.com/articles/10.1186/s40537-019-0197-0) — 이미지 증강 기법의 정리 (영문)

<a id="lesson-embeddings"></a>

### 4. 시퀀스 데이터와 임베딩

핵심 · 40분 · [본문 원본](../../src/content/modules/cnn-rnn/embeddings.ts) · [실습 원본](../../src/content/modules/cnn-rnn/labs/embeddings.ts)

**학습 목표:** 텍스트를 숫자로 바꾸는 절차(전처리, 토큰화, 어휘 사전)를 설명하고, One-hot 표현의 두 한계를 단어 임베딩과 Word2Vec이 어떻게 해결하는지 설명한다.

**쓰이는 곳:** 신경망은 숫자만 입력으로 받으므로 텍스트는 먼저 토큰 번호와 벡터로 바뀌어야 한다. RNN([5-3 RNN의 구조와 시간 역전파](#lesson-rnn))과 Transformer([6-1 셀프 어텐션: 쿼리·키·값](6-1-transformers.md#lesson-self-attention))의 첫 층이 임베딩 층이고, 검색 증강 생성(RAG)의 문서 검색도 임베딩 벡터의 유사도로 동작한다([6-3 임베딩과 벡터 검색](6-3-llm-systems.md#lesson-retrieval)).

**본문 절:** 순서가 있는 데이터 · 텍스트를 숫자로 바꾸는 절차 · One-hot 표현의 한계 · 단어 임베딩 · Word2Vec

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3 · 이미지 1

**실습**

- `ex1` 함께 나온 횟수로 단어 임베딩 만들기

**서술형**

- `d1` One-hot 인코딩의 두 가지 한계를 쓰고, 단어 임베딩이 각각을 어떻게 해결하는지 쓰라. 임베딩 행렬 $E$와 One-hot 벡터 $e_i$의 곱 $Ee_i$가 무엇인지도 쓰라.
- `d2` Word2Vec의 Skip-gram이 무엇으로 무엇을 예측하도록 학습하는지 쓰고, 학습이 끝나면 의미가 비슷한 단어의 벡터가 서로 가까워지는 이유를 분포 가설로 쓰라.

**참고 자료**

- [Jay Alammar — The Illustrated Word2vec](https://jalammar.github.io/illustrated-word2vec/) — 임베딩·Skip-gram·negative sampling을 그림으로 (영문)
- [Mikolov et al. (2013) — Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781) — Word2Vec 원 논문: 1~3절에 모델 구조가 있다 (영문)

<a id="lesson-rnn"></a>

### 5. RNN의 구조와 시간 역전파

핵심 · 40분 · [본문 원본](../../src/content/modules/cnn-rnn/rnn.ts) · [실습 원본](../../src/content/modules/cnn-rnn/labs/rnn.ts)

**학습 목표:** RNN의 재귀식 $h_t = f(Wx_t + Uh_{t-1} + b)$과 파라미터 공유를 설명하고, BPTT에서 야코비안이 $T-k$번 곱해져 기울기가 소실되거나 폭주하는 이유를 계산으로 보인다.

**쓰이는 곳:** RNN은 시퀀스를 한 토큰씩 읽으며 은닉 상태를 갱신하는 구조로, Transformer가 등장하기 전까지 번역과 음성 인식의 기본 모델이었다. RNN이 긴 시퀀스에서 학습되기 어려운 이유를 알아야 LSTM·GRU([5-3 LSTM과 GRU](#lesson-lstm-gru))와 attention([6-1 어텐션의 필요성: Seq2Seq의 병목](6-1-transformers.md#lesson-attention-motivation))이 해결한 문제를 이해할 수 있다.

**본문 절:** 은닉 상태와 재귀식 · BPTT와 기울기 소실·폭주 · 곱해지는 횟수에 따른 기울기의 크기

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 2 · 이미지 1

**실습**

- `ex1` RNN 순전파와 시점 거리에 따라 줄어드는 기울기

**서술형**

- `d1` RNN의 재귀식 $h_t = f(Wx_t + Uh_{t-1} + b)$에서 파라미터 공유가 무엇인지 쓰고, 파라미터 공유로 길이가 다른 시퀀스를 같은 모델로 처리할 수 있는 이유를 쓰라. 입력 차원 $d_x$, 은닉 차원 $d_h$일 때의 파라미터 수도 쓰라.
- `d2` BPTT에서 시점 $T$의 손실을 시점 $k$까지 전달하려면 야코비안을 몇 번 곱해야 하는지 쓰고, 이것이 기울기 소실과 폭주를 일으키는 이유와 장기 의존성 문제와의 관계를 쓰라.

**참고 자료**

- [Karpathy — The Unreasonable Effectiveness of Recurrent Neural Networks](https://karpathy.github.io/2015/05/21/rnn-effectiveness/) — 문자 단위 RNN이 무엇을 배우는지 예제로 보는 고전 블로그 (영문)
- [Pascanu et al. (2013) — On the difficulty of training RNNs](https://arxiv.org/abs/1211.5063) — 기울기 소실·폭주의 분석과 기울기 클리핑 제안 (영문)

## 보충 레슨

<a id="lesson-cnn-architectures"></a>

### 6. CNN 구조의 발전과 응용

보충 · 45분 · [본문 원본](../../src/content/modules/cnn-rnn/cnn-architectures.ts) · [실습 원본](../../src/content/modules/cnn-rnn/labs/cnn-architectures.ts)

**학습 목표:** LeNet, AlexNet, VGG, ResNet이 각각 어떤 문제를 해결했는지 설명하고, 객체 탐지·분할·Vision Transformer가 분류와 어떻게 다른 문제를 푸는지 구분한다.

**쓰이는 곳:** 새로운 이미지 모델도 대부분 이 레슨의 구조를 바탕으로 한다. 각 모델이 해결한 문제를 알면 전이학습([5-2 전이학습과 학습 진단](5-2-deep-training.md#lesson-transfer-learning))에 쓸 사전학습 모델을 고를 수 있고, 탐지·분할 모델([X-2 탐지·분할의 평가: IoU, NMS, AP, Dice](X-2-vision-generative.md#lesson-detection-segmentation))과 Transformer 기반 이미지 모델의 구조를 이해할 수 있다.

**본문 절:** LeNet에서 ResNet까지 · 분류 이외의 과제: 탐지와 분할 · Vision Transformer

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 3 · 실습 1 · 그림 5 · 이미지 1

**실습**

- `ex1` ViT처럼 이미지를 패치 토큰으로 나누기

**서술형**

- `d1` AlexNet이 ImageNet 대회에서 크고 깊은 CNN을 학습할 수 있었던 세 가지 요소를 쓰고, 각 요소가 해결한 문제를 쓰라.
- `d2` 채널 수 $C = 64$일 때 $7\times7$ 합성곱 한 층과 $3\times3$ 합성곱 세 층의 가중치 수를 계산하고, 두 구성의 수용영역이 같은 이유와 작은 커널을 깊게 쌓는 쪽이 유리한 이유를 쓰라.
- `d3` 객체 탐지, 의미론적 분할, 인스턴스 분할이 이미지 분류와 무엇이 다른지 쓰고, ViT가 이미지를 Transformer의 입력으로 바꾸는 방법과 그 과정에서 CNN의 어떤 가정이 사라지는지 쓰라.

**참고 자료**

- [d2l.ai — Modern Convolutional Neural Networks](https://d2l.ai/chapter_convolutional-modern/index.html) — AlexNet·VGG·NiN·GoogLeNet·ResNet을 코드와 함께 (영문)
- [Dosovitskiy et al. (2020) — An Image is Worth 16x16 Words (ViT)](https://arxiv.org/abs/2010.11929) — ViT 원 논문: 초록과 Figure 1에 패치 임베딩의 구조가 있다 (영문)

<a id="lesson-lstm-gru"></a>

### 7. LSTM과 GRU

보충 · 40분 · [본문 원본](../../src/content/modules/cnn-rnn/lstm-gru.ts) · [실습 원본](../../src/content/modules/cnn-rnn/labs/lstm-gru.ts)

**학습 목표:** LSTM의 forget·input·output 게이트와 셀 상태, GRU의 update·reset 게이트를 설명하고, 셀 상태의 갱신식 $c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t$가 기울기 소실을 줄이는 이유를 계산으로 보인다.

**쓰이는 곳:** LSTM과 GRU는 Transformer 이전에 번역, 음성 인식, 시계열 예측의 표준 모델이었고, 지금도 계산 자원이 제한된 시계열 모델에 쓰인다. 게이트로 정보의 유지와 갱신을 조절하는 방식은 이후 모델의 구조를 이해하는 데에도 필요하다.

**본문 절:** LSTM의 게이트와 셀 상태 · 셀 상태가 기울기 소실을 줄이는 이유 · GRU

**구성:** 확인 문제 5 · 서술형 3 · 실습 1 · 코드 셀 1 · 그림 3 · 이미지 1

**실습**

- `ex1` LSTM 셀 한 스텝 구현하기

**서술형**

- `d1` LSTM의 forget gate, input gate, output gate가 각각 정하는 것을 쓰고, 셀 상태의 갱신식 $c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t$가 RNN의 $h_t = f(Wx_t + Uh_{t-1} + b)$보다 기울기 소실이 적은 이유를 쓰라.
- `d2` forget gate의 편향이 0이면 LSTM에서 첫 시점의 영향이 기본 RNN보다도 빨리 사라지고, 편향을 2 이상으로 크게 하면 40스텝 뒤에도 유지되는 이유를 셀 상태의 갱신식으로 쓰라.
- `d3` GRU가 LSTM의 게이트와 상태를 어떻게 줄였는지 쓰고, 이 차이로 생기는 장단점을 쓰라.

**참고 자료**

- [Chris Olah — Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) — LSTM의 게이트를 그림으로 설명한 글 (영문)
- [d2l.ai — Long Short-Term Memory (LSTM)](https://d2l.ai/chapter_recurrent-modern/lstm.html) — LSTM의 수식과 구현 (영문)
- [Jozefowicz et al. (2015) — An Empirical Exploration of Recurrent Network Architectures](https://proceedings.mlr.press/v37/jozefowicz15.pdf) — forget gate 편향을 1로 초기화하는 설정의 근거 (영문)

## 심화 레슨

<a id="lesson-conv-as-matmul"></a>

### 8. 합성곱의 계산: im2col, 역전파, 깊이별 분리

심화 · 35분 · [본문 원본](../../src/content/modules/cnn-rnn/conv-as-matmul.ts) · [실습 원본](../../src/content/modules/cnn-rnn/labs/conv-as-matmul.ts)

**학습 목표:** im2col로 합성곱을 행렬 곱으로 바꾸고 FLOPs를 세며, 합성곱의 입력·커널 기울기가 각각 어떤 합성곱인지 유도하고, depthwise separable 합성곱이 줄이는 파라미터 수를 계산한다.

**쓰이는 곳:** 합성곱층의 연산량과 메모리를 계산할 수 있어야 모델이 GPU 메모리에 들어가는지, 추론 시간이 얼마나 걸리는지 추정할 수 있다. 모바일용 경량 모델과 분할·생성 모델의 업샘플링 층(전치 합성곱)도 이 레슨의 계산을 바탕으로 한다.

**본문 절:** im2col: 합성곱을 행렬 곱으로 · 합성곱의 역전파도 합성곱이다 · depthwise separable convolution

**구성:** 확인 문제 6 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 4

**실습**

- `ex1` im2col 합성곱과 합성곱의 역전파

**서술형**

- `d1` im2col이 합성곱을 행렬 곱으로 바꾸는 방법을 쓰고, 출력의 기울기 $G$로 입력과 커널의 기울기를 구하는 연산이 각각 무엇인지 쓰라. depthwise separable 합성곱이 파라미터를 얼마나 줄이는지도 쓰라.

**참고 자료**

- [CS231n — Convolutional Networks: Implementation as Matrix Multiplication](https://cs231n.github.io/convolutional-networks/#conv) — im2col 설명 (영문)
- [Dumoulin & Visin (2016) — A guide to convolution arithmetic for deep learning](https://arxiv.org/abs/1603.07285) — 출력 크기·전치 합성곱을 그림으로 (영문)
- [Howard et al. (2017) — MobileNets](https://arxiv.org/abs/1704.04861) — depthwise separable convolution (영문)

## 백지 복습

1. 이미지에 완전연결층 대신 합성곱층을 쓰는 이유를 지역성과 파라미터 공유로 쓰고, $224 \times 224 \times 3$ 입력에서 출력 64개를 만드는 두 층의 파라미터 수를 쓰라.
2. 합성곱의 출력 크기 공식을 쓰고, 입력 $32 \times 32$, 커널 $5 \times 5$, padding 2일 때 stride 1과 stride 2의 출력 크기를 계산하라.
3. 수용영역의 갱신식을 $r$과 점프 $j$로 쓰고, $3 \times 3$ 합성곱, $2 \times 2$ 풀링(stride 2), $3 \times 3$ 합성곱을 차례로 지난 수용영역을 계산하라.
4. One-hot 표현의 두 한계를 쓰고, 임베딩 행렬 $E$와 One-hot 벡터의 곱 $Ee_i$가 무엇인지, Skip-gram이 무엇으로 무엇을 예측하는지 쓰라.
5. RNN의 재귀식과 파라미터 수를 쓰고, BPTT에서 시점 $T$의 손실을 시점 $k$까지 전달할 때 기울기가 소실되는 이유를 쓰라.

## 과제: 합성곱 구현과 정규화·규제 기법의 Ablation 실험 노트

저장 키 `cnn-ablation` · 자기 점검 · [과제 원본](../../src/content/modules/cnn-rnn/assignment.ts)

두 부분으로 이루어집니다. ① BatchNorm, Dropout, 데이터 증강, weight decay 같은 기법이 실제로 얼마나 도움이 되는지, 기준 모델에서 **한 번에 하나씩만** 바꾸는 ablation 실험으로 확인합니다. ② 합성곱 층을 NumPy로 직접 구현해 출력 크기 공식, 파라미터 공유, 평행이동 등변성을 확인합니다.

GPU 없이 브라우저에서 몇 초 만에 학습되도록 손글씨 숫자($8 \times 8$ 픽셀) 데이터를 쓰고, ablation 실험의 모델은 속도를 위해 합성곱 대신 NumPy로 구현한 **완전연결 신경망(MLP)**을 씁니다. 그래서 ①의 결과는 정규화·규제 기법이 이 MLP에서 어떻게 작용하는지를 보여 주며, CIFAR-10 같은 컬러 사진과 CNN에서는 효과의 크기가 다를 수 있습니다(예: CNN의 BatchNorm은 채널마다 배치·높이·너비 전체로 통계를 냅니다). CNN 학습과 전이학습은 [5-3 CNN 학습과 이미지 증강](#lesson-cnn-training)과 [5-2 전이학습과 학습 진단](5-2-deep-training.md#lesson-transfer-learning)의 Colab 코드로 다룹니다.

모든 **핵심** 항목은 핵심 레슨만으로 풀 수 있고 자기 점검 기준도 핵심 항목을 확인합니다. **심화** 항목은 선택이며 과제 점수는 매기지 않습니다.

### 요구사항

- 실험 엔진 셀은 수정하지 않고, 설정은 `train(...)`의 인자로만 바꾼다.
- 학습 전 초기 손실이 $\ln 10 \approx 2.303$ 근처인지 먼저 확인하고, 기준 모델의 train/val 곡선을 그린다.
- 후보 중 ablation 두 가지를 골라 실행 **전에** 가설을 적고, 결과 표와 비교해 맞고 틀린 이유를 설명한다.
- 틀린 테스트 이미지에서 공통 패턴을 두 가지 이상 찾아 개선 아이디어를 낸다.
- `out_size`의 TODO를 출력 크기 공식으로 채워 다섯 설정이 모두 '일치'가 되게 하고, 파라미터 수·특성 맵·평행이동 등변성을 해석한다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| 실험 엔진 읽고 준비하기 | 핵심 | 코드 `engine-code` |
| 기준 모델 학습과 초기 손실 확인 | 핵심 | 코드 `baseline-code` |
| Ablation 두 가지 | 핵심 | 답안 `ablation-hypothesis`(최소 90자), 코드 `ablation-code`, 답안 `ablation-answer`(최소 320자) |
| 오류 분석 | 핵심 | 코드 `errors-code`, 답안 `errors-answer`(최소 100자) |
| 재현성 체크리스트 | 핵심 | 답안 `checklist-answer`(최소 100자) |
| 합성곱 층 직접 구현하기 | 핵심 | 코드 `conv-code`, 답안 `conv-answer`(최소 250자) |
| 심화: 반복 실험·추가 ablation·적대적 강건성 | 심화 | 코드 `advanced-code`, 답안 `advanced-answer` |

### 자기 점검 기준

| 기준 | 확인 내용 |
| --- | --- |
| 실험 통제 | 기준 모델을 두고 한 번에 하나만 바꾸며, 시드를 고정했습니다. |
| 가설과 해석의 깊이 | 실행 전에 가설을 세우고, 결과를 레슨에서 배운 개념으로 설명했습니다. |
| 오류 분석 | 틀린 사례에서 구체적인 공통 패턴을 찾고 개선 방향을 제시했습니다. |
| 합성곱 구현과 귀납편향 해석 | 출력 크기 공식을 구현해 검증하고, 파라미터 수 차이와 등변성 결과를 파라미터 공유·지역성·stride로 정확히 설명했습니다. |
| 체크리스트와 재현성 | 초기 손실 점검, 증강 적용 범위, 평가 모드를 코드 근거와 함께 확인했습니다. |
| 가독성 | 표와 그래프가 정리되어 있고 서술이 간결합니다. |

### 자동 테스트

- `baseline`: 초기 손실이 ln 10 근처(±0.1)
- `baseline`: 기준 모델 val 정확도 0.85 이상
- `ablation`: ablation 두 가지를 각각 설정 하나만 바꿔 실행했다
- `conv`: out_size가 출력 크기 공식과 일치한다(본문에 없는 설정 포함)

### 선택 심화 문제

- `ch1` 다채널 합성곱을 반복문 두 개로 벡터화하기
- `ch2` Max Pooling의 역전파: 승자에게만 기울기를
