<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 5-2 깊은 신경망 학습 기법

[전체 목차](README.md) · 트랙 5 딥러닝 기초 · [모듈 원본](../../src/content/modules/deep-training/index.ts)

가중치 초기화와 정규화 층, 드롭아웃과 잔차 연결, 전이학습과 학습 진단, PyTorch 학습 루프

## 목표 문제

폭 256인 ReLU 층 20개로 만든 신경망을 학습하면 손실이 처음부터 줄지 않는다. 가중치를 표준정규분포로 초기화하면 활성화가 층마다 약 11배씩 커지고, 너무 작게 초기화하면 0에 가까워진다. 분산 계산으로 He 초기화를 유도해 활성화의 크기를 유지하고, BatchNorm과 LayerNorm이 평균과 분산을 계산하는 축을 비교한다. 드롭아웃으로 과적합을 줄이고, 잔차 연결 $y = F(x) + x$로 층이 깊어도 기울기가 앞쪽 층까지 전달되게 한다. 사전학습한 모델에서 출발하는 전이학습과, 학습이 실패할 때 초기 손실 $\ln C$와 배치 하나 과적합으로 원인을 좁히는 진단 순서를 익힌다. 마지막으로 직접 구현한 자동미분과 경사하강법을 PyTorch의 텐서, autograd, 옵티마이저, DataLoader로 옮겨 GPU에서 학습한다.

## 학습 목표

- 역전파에서 국소 미분의 곱으로 기울기가 소실·폭주하는 원리를 설명하고, 분산 계산으로 Xavier·He 초기화를 유도한다.
- BatchNorm과 LayerNorm이 평균과 분산을 계산하는 축을 계산으로 구분하고, 학습 모드와 평가 모드의 차이를 설명한다.
- 역드롭아웃의 보정과 잔차 연결의 기울기 $F'(x) + 1$을 계산하고, 성능 저하 문제가 최적화의 문제인 이유를 설명한다.
- 데이터의 양과 유사도에 따라 특성 추출과 미세조정을 고르고, 초기 손실과 배치 하나 과적합으로 학습 실패의 원인을 진단한다.
- PyTorch의 텐서·autograd·nn.Module·옵티마이저·DataLoader로 GPU 학습 루프와 검증 루프를 작성한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [가중치 초기화와 기울기 소실·폭주](#lesson-initialization) | 핵심 | 35분 | #70 가중치 초기화, 기울기 소실·폭주, 정규화 층 |
| 2 | [정규화 층: BatchNorm과 LayerNorm](#lesson-normalization-layers) | 핵심 | 30분 | #70 가중치 초기화, 기울기 소실·폭주, 정규화 층 |
| 3 | [드롭아웃과 잔차 연결](#lesson-dropout-residual) | 핵심 | 40분 | #71 드롭아웃, 잔차 연결, 전이학습 |
| 4 | [전이학습과 학습 진단](#lesson-transfer-learning) | 핵심 | 30분 | #71 드롭아웃, 잔차 연결, 전이학습 |
| 5 | [PyTorch 텐서, 데이터 로더, 학습 루프, GPU](#lesson-pytorch) | 핵심 | 35분 | #72 PyTorch 텐서, 데이터 로더, 학습 루프, GPU |
| 6 | [GPU, 혼합 정밀도와 PyTorch 실습](#lesson-pytorch-practice) | 보충 | 35분 | — |
| 7 | [가중치 감쇠와 학습률 스케줄](#lesson-training-schedules) | 보충 | 30분 | — |
| 8 | [기울기 전달의 수학과 기울기 클리핑](#lesson-gradient-flow) | 심화 | 35분 | — |

## 핵심 레슨

<a id="lesson-initialization"></a>

### 1. 가중치 초기화와 기울기 소실·폭주

핵심 · 35분 · [본문 원본](../../src/content/modules/deep-training/initialization.ts) · [실습 원본](../../src/content/modules/deep-training/labs/initialization.ts)

**학습 목표:** 역전파에서 국소 미분이 층마다 곱해져 기울기가 소실되거나 폭주하는 원리와 dead ReLU 문제를 설명하고, 가중치를 같은 값으로 초기화하면 안 되는 이유를 확인하며, $\mathrm{Var}(z) \approx \text{fan\_in}\cdot\mathrm{Var}(w)\cdot\mathrm{Var}(x)$에서 Xavier·He 초기화를 유도해 깊은 신경망의 활성화 크기를 비교한다.

**쓰이는 곳:** 깊은 신경망이 학습되지 않는 가장 흔한 원인은 기울기가 앞쪽 층에 도달하기 전에 사라지거나 지나치게 커지는 것이다. 초기화는 PyTorch의 층이 기본으로 해 주지만([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](#lesson-pytorch)), 층을 직접 만들거나 깊이를 늘릴 때 활성화의 크기가 유지되는지 확인할 수 있어야 한다. 정규화 층([5-2 정규화 층: BatchNorm과 LayerNorm](#lesson-normalization-layers))과 잔차 연결([5-2 드롭아웃과 잔차 연결](#lesson-dropout-residual))도 같은 문제를 다룬다.

**본문 절:** 기울기 소실과 폭주 · 같은 값으로 초기화하면 안 된다 · 분산이 fan_in에 반비례해야 하는 이유

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 1

**실습**

- `ex1` He·Xavier 초기화와 층별 활성화 분산 추적

**서술형**

- `d1` 가중치를 모두 같은 값(0 포함)으로 초기화하면 학습이 되지 않는 이유를 대칭성으로 설명하라. 입력이 계속 음수인 ReLU 뉴런이 학습되지 않는 이유도 국소 미분으로 쓰라.
- `d2` 뉴런의 활성화 전 값 z가 fan_in개 항의 합이라는 사실로 가중치의 분산을 fan_in에 반비례하게 정해야 하는 이유를 설명하고, He 초기화가 Xavier 초기화보다 분산을 두 배로 잡는 이유를 쓰라. 층마다 표준편차가 1.2배씩 커지면 15층 뒤에 몇 배가 되는지도 계산하라.

**참고 자료**

- [He et al. (2015) — Delving Deep into Rectifiers](https://arxiv.org/abs/1502.01852) — He 초기화를 제안한 논문, 2.2절이 본문의 분산 유도 (영문)
- [deeplearning.ai — Initializing neural networks](https://www.deeplearning.ai/ai-notes/initialization/) — 초기화 크기에 따른 학습 차이를 조작하며 보는 자료 (영문)

<a id="lesson-normalization-layers"></a>

### 2. 정규화 층: BatchNorm과 LayerNorm

핵심 · 30분 · [본문 원본](../../src/content/modules/deep-training/normalization-layers.ts) · [실습 원본](../../src/content/modules/deep-training/labs/normalization-layers.ts)

**학습 목표:** BatchNorm과 LayerNorm이 평균과 분산을 계산하는 축의 차이를 작은 예제로 계산하고, Transformer가 LayerNorm을 쓰는 이유를 설명한다.

**쓰이는 곳:** BatchNorm과 LayerNorm은 대부분의 깊은 신경망에 들어가는 층이다. CNN은 주로 BatchNorm을, Transformer는 LayerNorm을 쓰며, 두 층은 평균과 분산을 계산하는 축만 다르다. 이 차이를 알아야 배치 크기를 바꿨을 때 성능이 달라지는 이유, 추론 전에 `model.eval()`을 호출해야 하는 이유, Transformer 블록의 구조를 설명할 수 있다.

**본문 절:** 정규화 층이 하는 일 · BatchNorm: 배치 축을 따라 정규화한다 · LayerNorm: 특성 축을 따라 정규화한다 · 작은 예제로 비교하기 · Transformer가 LayerNorm을 쓰는 이유

**구성:** 확인 문제 6 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 1 · 이미지 2

**실습**

- `ex1` BatchNorm과 LayerNorm: 평균과 분산을 구하는 축의 차이

**서술형**

- `d1` BatchNorm과 LayerNorm이 평균과 분산을 계산하는 축을 각각 쓰고, Transformer가 BatchNorm 대신 LayerNorm을 쓰는 이유를 배치 크기와 시퀀스 길이의 관점에서 쓰라.

**참고 자료**

- [Ioffe & Szegedy (2015) — Batch Normalization](https://arxiv.org/abs/1502.03167) — BatchNorm 원 논문 (영문)
- [Ba, Kiros & Hinton (2016) — Layer Normalization](https://arxiv.org/abs/1607.06450) — LayerNorm 원 논문: 배치 통계를 쓰지 않는 정규화 (영문)
- [Santurkar et al. (2018) — How Does Batch Normalization Help Optimization?](https://arxiv.org/abs/1805.11604) — BatchNorm의 효과에 대한 다른 설명 (영문)

<a id="lesson-dropout-residual"></a>

### 3. 드롭아웃과 잔차 연결

핵심 · 40분 · [본문 원본](../../src/content/modules/deep-training/dropout-residual.ts) · [실습 원본](../../src/content/modules/deep-training/labs/dropout-residual.ts)

**학습 목표:** 드롭아웃이 과적합을 줄이는 원리와 역드롭아웃의 보정을 설명하고, 성능 저하 문제가 과적합이 아닌 최적화의 문제인 이유와 잔차 연결의 기울기 $F'(x) + 1$이 깊은 망의 학습을 돕는 원리를 계산으로 보인다.

**쓰이는 곳:** 드롭아웃은 신경망에서 가장 널리 쓰는 규제 방법이다([4-3 L1·L2 규제, 조기 종료, 학습 곡선](4-3-generalization.md#lesson-regularization)). 잔차 연결은 수십~수백 층의 망을 학습할 수 있게 한 구조로, Transformer([6-1 트랜스포머 디코더 블록](6-1-transformers.md#lesson-transformer-block))를 포함한 대부분의 깊은 신경망에 들어간다. 드롭아웃은 학습과 평가에서 동작이 다르므로 평가 모드 전환을 빠뜨리면 성능이 낮게 측정되고, 잔차 연결이 없으면 층을 늘려도 학습 오차가 줄지 않는다.

**본문 절:** 드롭아웃 · 깊게 쌓은 망의 성능 저하 · 잔차 연결

**구성:** 확인 문제 7 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3 · 이미지 1

**실습**

- `ex1` 역드롭아웃과 잔차 블록 구현하기

**서술형**

- `d1` 드롭아웃이 과적합을 줄이는 이유를 쓰고, 학습 중에 남은 값을 $1/(1-p)$배 하는 이유와 평가할 때 드롭아웃을 끄는 이유를 쓰라.
- `d2` plain 망에서 층을 늘렸을 때 학습 오차가 오히려 높아지는 현상이 과적합이 아닌 이유를 쓰고, 잔차 연결 $y = F(x) + x$가 이 문제를 줄이는 이유를 항등함수와 기울기의 관점에서 쓰라.

**참고 자료**

- [Srivastava et al. (2014) — Dropout: A Simple Way to Prevent Neural Networks from Overfitting](https://jmlr.org/papers/v15/srivastava14a.html) — 드롭아웃 원 논문 (영문)
- [He et al. (2015) — Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385) — 성능 저하 문제(Figure 1)와 잔차 학습, 4.1절의 기울기 소실 논의 (영문)
- [d2l.ai — Residual Networks (ResNet)](https://d2l.ai/chapter_convolutional-modern/resnet.html) — 잔차 블록과 ResNet 구현 (영문)

<a id="lesson-transfer-learning"></a>

### 4. 전이학습과 학습 진단

핵심 · 30분 · [본문 원본](../../src/content/modules/deep-training/transfer-learning.ts) · [실습 원본](../../src/content/modules/deep-training/labs/transfer-learning.ts)

**학습 목표:** 특성 추출과 미세조정을 구분해 전이학습을 적용하고, 초기 손실 $\ln C$ 확인, 배치 하나에 과적합하기, 한 번에 하나만 바꾸기의 순서로 학습 실패의 원인을 진단한다.

**쓰이는 곳:** 실무에서 이미지·텍스트 모델은 대부분 사전학습한 모델에서 출발하며, LLM의 미세조정([6-2 지시 미세조정과 LoRA](6-2-llm-training.md#lesson-instruction-tuning))도 같은 원리를 쓴다. 학습이 되지 않을 때 확인 순서를 정해 두면 하이퍼파라미터를 무작위로 바꾸며 다시 학습하는 데 드는 시간을 줄일 수 있다.

**본문 절:** 전이학습 · 학습 진단 순서

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · Colab 코드 2 · 그림 2

**실습**

- `ex1` 학습 진단: 초기 손실 확인과 배치 하나에 과적합하기

**서술형**

- `d1` 전이학습의 특성 추출과 미세조정을 구분하고, 데이터의 양과 사전학습 데이터와의 유사도에 따라 방식을 고르는 기준을 쓰라. 미세조정에서 학습률을 작게 잡는 이유도 쓰라.
- `d2` 실습의 배치 과적합 함수에서 기울기를 만드는 줄 `G[np.arange(len(y)), y] -= 1`을 실수로 지우면 어떤 일이 생기는지 쓰고, 배치 하나에 과적합되는지 확인하는 방법이 이런 오류를 빨리 찾는 이유를 쓰라.

**참고 자료**

- [Andrej Karpathy — A Recipe for Training Neural Networks](https://karpathy.github.io/2019/04/25/recipe/) — 본문 진단 순서의 원문 (영문)
- [PyTorch — Transfer Learning for Computer Vision](https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html) — 특성 추출과 미세조정 공식 튜토리얼 (영문)
- [Yosinski et al. (2014) — How transferable are features in deep neural networks?](https://arxiv.org/abs/1411.1792) — 층의 위치에 따른 특성의 일반성과 전이 성능 (영문)

<a id="lesson-pytorch"></a>

### 5. PyTorch 텐서, 데이터 로더, 학습 루프, GPU

핵심 · 35분 · [본문 원본](../../src/content/modules/deep-training/pytorch.ts) · [실습 원본](../../src/content/modules/deep-training/labs/pytorch.ts)

**학습 목표:** Tensor, autograd, nn.Module, 옵티마이저, DataLoader가 직접 구현한 자동미분과 경사하강법의 어느 부분을 대신하는지 대응시키고, GPU를 쓰는 학습 루프와 검증 루프를 작성하며, autograd가 계산하는 2층 신경망의 기울기를 NumPy로 직접 구한다.

**쓰이는 곳:** 이후의 CNN, RNN, Transformer, LLM 실습은 모두 PyTorch로 작성한다. 학습 루프의 각 줄이 무엇을 계산하는지 알아야 손실이 줄지 않거나 검증 점수가 실행할 때마다 달라질 때 원인을 찾을 수 있다.

**본문 절:** 직접 구현한 것과 PyTorch의 대응 · 텐서와 autograd · nn.Module과 옵티마이저 · Dataset과 DataLoader · 학습 루프와 GPU · 자주 생기는 오류 다섯 가지

**구성:** 확인 문제 7 · 서술형 2 · 실습 1 · Colab 코드 5 · 그림 2 · 이미지 1

**실습**

- `ex1` autograd 없이 2층 신경망의 backward 작성하기

**서술형**

- `d1` PyTorch에서 `loss.backward()`를 호출하면 파라미터의 `.grad`에 어떤 값이 채워지는지 쓰고, `nn.Module`에서 `backward`를 작성하지 않아도 되는 이유와 `optimizer.zero_grad()`를 빠뜨리면 생기는 문제를 직접 구현한 자동미분 엔진과 비교해 쓰라.
- `d2` 실습의 2층 신경망 `backward`에서 `dz1 = (dz2 @ W2.T) * (z1 > 0)`의 `* (z1 > 0)`을 지우면 기울기 검사와 학습이 어떻게 되는지 ReLU의 국소 미분으로 쓰라.

**참고 자료**

- [PyTorch Tutorials — Learn the Basics](https://pytorch.org/tutorials/beginner/basics/intro.html) — Tensor, Dataset, 모델, autograd, 최적화 순서의 공식 튜토리얼 (영문)
- [Dive into Deep Learning (한국어) — 다층 퍼셉트론](https://ko.d2l.ai/chapter_deep-learning-basics/mlp.html) — MLP를 처음부터 구현한 뒤 프레임워크로 옮기는 과정 (한국어)

## 보충 레슨

<a id="lesson-pytorch-practice"></a>

### 6. GPU, 혼합 정밀도와 PyTorch 실습

보충 · 35분 · [본문 원본](../../src/content/modules/deep-training/pytorch-practice.ts)

**학습 목표:** GPU가 행렬 연산을 빠르게 처리하는 이유와 혼합 정밀도 학습의 underflow·loss scaling을 설명하고, 같은 모델을 NumPy와 PyTorch로 학습해 결과와 코드 구조를 비교한다.

**쓰이는 곳:** 모델과 데이터가 커지면 학습 시간과 GPU 메모리가 먼저 한계에 도달한다. 혼합 정밀도는 대형 모델 학습의 기본 설정이고, Hugging Face의 사전학습 모델([6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining))을 불러와 미세조정할 때도 이 레슨의 학습 루프를 그대로 쓴다.

**본문 절:** CPU와 GPU · 혼합 정밀도 · PyTorch로 make_moons 분류하기 · 같은 선형회귀를 NumPy와 PyTorch로 학습하기 · Hugging Face

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 코드 셀 2 · Colab 코드 3 · 그림 4

**서술형**

- `d1` 같은 행렬 곱이 CPU보다 GPU에서 훨씬 빠르게 계산되는 이유를 행렬 곱의 구조와 두 장치의 코어 구성으로 쓰라.
- `d2` 혼합 정밀도 학습이 메모리와 속도 면에서 유리한 이유를 쓰고, FP16을 그대로 쓸 때 생기는 문제와 loss scaling이 이를 해결하는 방법을 쓰라.

**참고 자료**

- [PyTorch — Automatic Mixed Precision recipe](https://pytorch.org/tutorials/recipes/recipes/amp_recipe.html) — autocast와 GradScaler 사용법 (영문)
- [Micikevicius et al. (2018) — Mixed Precision Training](https://arxiv.org/abs/1710.03740) — FP16 학습과 loss scaling을 제안한 논문 (영문)
- [Google Colab](https://colab.research.google.com/) — 무료 GPU로 본문의 PyTorch 코드를 실행한다. 런타임 유형을 GPU로 바꾸고 `torch.cuda.is_available()`로 확인한다.

<a id="lesson-training-schedules"></a>

### 7. 가중치 감쇠와 학습률 스케줄

보충 · 30분 · [본문 원본](../../src/content/modules/deep-training/training-schedules.ts) · [실습 원본](../../src/content/modules/deep-training/labs/training-schedules.ts)

**학습 목표:** 가중치 감쇠를 갱신식으로 설명하고, 조기 종료와 선형 워밍업·코사인 감쇠 학습률 스케줄을 구현하며, 신경망의 과적합이 검증 손실에서 먼저 드러나는 이유를 설명한다.

**쓰이는 곳:** 신경망은 파라미터가 수백만 개인데 라벨이 있는 데이터는 수천 개인 경우가 흔해 선형 모델보다 과적합이 쉽게 일어난다. 가중치 감쇠, 조기 종료, 학습률 스케줄은 대부분의 학습 코드에 들어가는 설정이며, PyTorch의 옵티마이저 인자 `weight_decay`와 학습률 스케줄러([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](#lesson-pytorch))가 이 내용을 구현한다.

**본문 절:** 가중치 감쇠: L2 규제를 갱신식으로 보기 · 조기 종료 · 학습률 스케줄: 선형 워밍업과 코사인 감쇠

**구성:** 확인 문제 4 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 학습률 스케줄과 조기 종료 구현하기

**서술형**

- `d1` 가중치 감쇠의 갱신식을 쓰고 가중치 감쇠가 과적합을 줄이는 이유를 쓰라. 검증 정확도는 그대로인데 검증 손실만 오르는 현상이 뜻하는 것과, 조기 종료가 최종 모델을 고르는 방법도 쓰라.

**참고 자료**

- [Loshchilov & Hutter (2019) — Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101) — L2 벌점과 가중치 감쇠의 차이, AdamW (영문)
- [Goodfellow, Bengio & Courville — Deep Learning, 7.8 Early Stopping](https://www.deeplearningbook.org/contents/regularization.html) — 조기 종료와 L2 규제의 관계 (영문)
- [Dive into Deep Learning — 12.11 Learning Rate Scheduling](https://d2l.ai/chapter_optimization/lr-scheduler.html) — 워밍업과 코사인 스케줄을 코드와 함께 (영문)

## 심화 레슨

<a id="lesson-gradient-flow"></a>

### 8. 기울기 전달의 수학과 기울기 클리핑

심화 · 35분 · [본문 원본](../../src/content/modules/deep-training/gradient-flow.ts) · [실습 원본](../../src/content/modules/deep-training/labs/gradient-flow.ts)

**학습 목표:** 역전파되는 기울기를 야코비안 전치의 곱으로 쓰고 기울기 소실과 폭주를 그 곱의 크기로 설명하며, 잔차 연결이 기울기의 직접 경로를 만드는 이유와 노름 기준 기울기 클리핑을 구현한다.

**쓰이는 곳:** 수백 층의 망과 긴 시퀀스를 다루는 RNN, Transformer는 기울기의 크기가 층과 시간 단계를 지나며 어떻게 바뀌는지에 따라 학습 가능 여부가 갈린다. 대형 언어 모델 학습에서는 기울기 클리핑을 거의 항상 쓰며, 잔차 가지를 작게 초기화하는 설정도 이 분석에서 나왔다.

**본문 절:** 기울기는 야코비안 전치의 곱으로 전달된다 · 잔차 연결의 야코비안 · 기울기 클리핑

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 2 · 이미지 1

**실습**

- `ex1` 깊이에 따른 기울기 노름, 잔차 연결, 노름 기준 클리핑

**서술형**

- `d1` 깊은 망에서 기울기가 소실되거나 폭주하는 이유를 야코비안 전치의 곱으로 쓰라. 잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$이 기울기 소실을 막는 이유와, 노름 기준 기울기 클리핑이 방향을 바꾸지 않는 이유도 쓰라.
- `d2` 50층 tanh 망을 작은 초기화로 학습했더니 앞쪽 층의 가중치가 거의 바뀌지 않았다. 원인을 야코비안의 곱으로 진단하고, 잔차 연결이 이를 어떻게 바꾸는지 식으로 쓰라. 잔차 연결만으로 충분하지 않을 수 있는 이유와 보완 방법도 쓰라.

**참고 자료**

- [Pascanu, Mikolov & Bengio (2013) — On the difficulty of training recurrent neural networks](https://arxiv.org/abs/1211.5063) — 기울기 소실·폭주의 분석과 노름 기준 클리핑 (영문)
- [He et al. (2016) — Identity Mappings in Deep Residual Networks](https://arxiv.org/abs/1603.05027) — 잔차 연결이 기울기를 직접 전달하는 이유 (영문)

## 백지 복습

1. $\mathrm{Var}(z) \approx \text{fan\_in}\cdot\mathrm{Var}(w)\cdot\mathrm{Var}(x)$를 유도하고, He 초기화의 분산이 $2/\text{fan\_in}$인 이유를 쓰라. 층마다 0.8배가 되는 신호가 10층 뒤 몇 배가 되는지도 쓰라.
2. $z = \begin{pmatrix}2 & 4\\ 6 & 8\end{pmatrix}$(행은 샘플)에 BatchNorm과 LayerNorm을 적용할 때 각각의 평균과 분산을 쓰고, Transformer가 LayerNorm을 쓰는 이유를 쓰라.
3. 역드롭아웃에서 학습 중에 남은 값을 $1/(1-p)$배 하는 이유와, 평가할 때 `model.eval()`을 호출하지 않으면 생기는 일을 쓰라.
4. 잔차 연결 $y = F(x) + x$의 $dy/dx$를 쓰고, 블록 50개를 지난 기울기를 잔차 연결이 있을 때와 없을 때 비교해 쓰라.
5. PyTorch 학습 루프의 여섯 단계를 순서대로 쓰고, 각 단계가 직접 구현한 자동미분 엔진의 어느 부분에 해당하는지 쓰라. 10클래스 분류의 정상적인 초기 손실 값도 쓰라.
