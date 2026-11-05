<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 5-1 신경망과 학습 원리

[전체 목차](README.md) · 트랙 5 딥러닝 기초 · [모듈 원본](../../src/content/modules/neural-networks/index.ts)

퍼셉트론과 다층 신경망, 역전파와 계산 그래프, 자동미분 엔진, 최적화기

## 목표 문제

초승달 두 개 모양으로 섞인 2차원 데이터(make_moons)는 직선 하나로 나뉘지 않는다. ReLU 은닉층을 넣은 다층 신경망이 이런 데이터를 나눌 수 있는 이유를 XOR로 확인하고, 계산 그래프와 연쇄법칙으로 역전파를 손으로 계산한다. 그다음 덧셈·곱셈·ReLU의 국소 미분만 정의한 자동미분 엔진(Value 클래스)을 직접 만들고, 이 엔진 위에 뉴런·층·MLP를 쌓아 미니배치 경사하강법으로 make_moons를 분류한다. 학습률과 최적화기(SGD, Momentum, Adam)를 바꾸며 손실이 줄어드는 속도를 비교한다.

## 학습 목표

- 퍼셉트론과 뉴런의 계산을 하고, 활성화 함수가 없으면 여러 층이 한 층과 같아지는 이유와 은닉층이 XOR을 푸는 원리를 설명한다.
- 계산 그래프에서 노드별 국소 미분과 연쇄법칙으로 역전파를 수행하고, 한 층의 기울기 공식을 행렬 모양과 수치미분으로 확인한다.
- 연산자 메서드·클로저·재귀로 자동미분 엔진을 구현하고, 위상정렬과 기울기 누적이 필요한 이유를 설명한다.
- 미니배치·반복·에포크를 구분하고, SGD·Momentum·Adam의 갱신식을 계산해 문제에 맞는 최적화기와 학습률을 고른다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [퍼셉트론, 다층 신경망, 활성화 함수](#lesson-perceptron-mlp) | 핵심 | 40분 | #67 퍼셉트론, 다층 신경망, 활성화 함수 |
| 2 | [순전파, 역전파, 계산 그래프](#lesson-backprop) | 핵심 | 35분 | #68 순전파, 역전파, 계산 그래프, 자동미분 |
| 3 | [자동미분 엔진 구현](#lesson-micrograd) | 핵심 | 40분 | #68 순전파, 역전파, 계산 그래프, 자동미분 |
| 4 | [배치, 에포크, 학습률, SGD, Adam](#lesson-optimizers) | 핵심 | 35분 | #69 배치, 에포크, 학습률, SGD, Adam |
| 5 | [자동미분의 두 모드와 메모리](#lesson-autodiff-theory) | 심화 | 30분 | — |
| 6 | [Adam의 이론: 편향 보정, AdamW, 워밍업](#lesson-adam-theory) | 심화 | 30분 | — |

## 핵심 레슨

<a id="lesson-perceptron-mlp"></a>

### 1. 퍼셉트론, 다층 신경망, 활성화 함수

핵심 · 40분 · [본문 원본](../../src/content/modules/neural-networks/perceptron-mlp.ts) · [실습 원본](../../src/content/modules/neural-networks/labs/perceptron-mlp.ts)

**학습 목표:** 퍼셉트론과 뉴런 하나의 계산을 하고, 다층 신경망(MLP)의 순전파를 행렬 모양과 파라미터 수까지 추적하며, 활성화 함수가 없으면 여러 층이 한 층과 같아지는 이유와 XOR을 푸는 은닉층의 역할을 설명한다. 시그모이드·tanh·ReLU·GELU의 차이도 설명한다.

**쓰이는 곳:** 신경망은 선형 모델을 여러 층 쌓고 층 사이에 비선형 함수를 넣어, 특성을 사람이 만들지 않아도 데이터에서 필요한 변환을 학습한다. CNN([5-3 합성곱](5-3-cnn-rnn.md#lesson-convolution))과 Transformer([6-1 트랜스포머 디코더 블록](6-1-transformers.md#lesson-transformer-block))도 이 층 구조 위에 만들어지고, Transformer 블록 안의 MLP와 GELU가 이 레슨의 내용 그대로다.

**본문 절:** 퍼셉트론과 뉴런 · 다층 신경망과 행렬 모양 · 활성화 함수가 없으면 한 층과 같다 · 활성화 함수의 종류

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 5

**실습**

- `ex1` 뉴런·층 계산과 "비선형이 없으면 한 층" 증명

**서술형**

- `d1` 활성화 함수가 없는 3층 MLP가 나타낼 수 있는 함수가 1층 선형 모델과 같은 이유를 식으로 보이고, XOR을 예로 들어 비선형 은닉층이 하는 일을 설명하라.
- `d2` 시그모이드·ReLU·GELU를 입력이 큰 양수, 0 근처, 큰 음수일 때의 출력과 기울기로 비교하고, 깊은 신경망의 은닉층에 시그모이드를 쓰지 않는 이유를 쓰라.

**참고 자료**

- [3Blue1Brown — But what is a neural network?](https://www.3blue1brown.com/lessons/neural-networks) — 뉴런·가중치·편향·층을 그림으로 설명 (영문)
- [CS231n — Neural Networks Part 1: Setting up the Architecture](https://cs231n.github.io/neural-networks-1/) — 활성화 함수 비교와 층 구성 (영문)
- [Hendrycks & Gimpel (2016) — Gaussian Error Linear Units (GELUs)](https://arxiv.org/abs/1606.08415) — GELU의 정의 (영문, 연구 논문)

<a id="lesson-backprop"></a>

### 2. 순전파, 역전파, 계산 그래프

핵심 · 35분 · [본문 원본](../../src/content/modules/neural-networks/backprop.ts) · [실습 원본](../../src/content/modules/neural-networks/labs/backprop.ts)

**학습 목표:** 계산 식을 계산 그래프로 나누고, 덧셈·곱셈·ReLU 등 노드의 국소 미분과 연쇄법칙으로 역전파를 손으로 수행하며, 한 층의 기울기 $\partial L/\partial W = \delta x^\top$, $\partial L/\partial x = W^\top \delta$를 행렬 모양으로 확인하고 수치미분으로 검산한다.

**쓰이는 곳:** 신경망은 파라미터가 수백만에서 수천억 개라, 기울기를 효율적으로 계산하지 못하면 경사하강법을 쓸 수 없다. 역전파는 순전파와 비슷한 비용으로 모든 파라미터의 기울기를 구하는 방법이고, PyTorch의 자동미분([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch))과 다음 레슨에서 만드는 자동미분 엔진([5-1 자동미분 엔진 구현](#lesson-micrograd))이 이 원리로 동작한다.

**본문 절:** 계산 그래프와 순전파 · 역전파 · 노드별 국소 미분 · 한 층의 역전파

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 덧셈·곱셈 노드로 손 역전파, 그리고 층 하나의 δxᵀ

**서술형**

- `d1` $L = (wx + c)^2$에서 $w = -1$, $x = 4$, $c = 2$일 때 계산 그래프를 노드로 나눠 순전파 값과 $\partial L/\partial w$, $\partial L/\partial x$, $\partial L/\partial c$를 계산하라. 곱셈 노드에서 상대 입력의 값을 곱하는 이유도 쓰라.
- `d2` 선형 층 $z = Wx + b$의 역전파 공식 세 가지를 쓰고, 모양만으로 공식이 맞는지 확인하는 방법을 $W$가 $4 \times 3$인 경우로 설명하라.

**참고 자료**

- [CS231n — Backpropagation, Intuitions](https://cs231n.github.io/optimization-2/) — 노드별 기울기 흐름과 계산 예 (영문)
- [3Blue1Brown — Backpropagation calculus](https://www.3blue1brown.com/lessons/backpropagation-calculus) — 연쇄법칙이 층을 따라 이어지는 과정 (영문)

<a id="lesson-micrograd"></a>

### 3. 자동미분 엔진 구현

핵심 · 40분 · [본문 원본](../../src/content/modules/neural-networks/micrograd.ts) · [실습 원본](../../src/content/modules/neural-networks/labs/micrograd.ts)

**학습 목표:** 연산자 메서드·클로저·재귀로 만든 Value 클래스가 계산 그래프를 기록하고 위상정렬의 역순으로 `_backward`를 실행하는 과정을 설명하고, 기울기를 `+=`로 누적하는 이유를 계산하며, 이 엔진으로 경사하강법 학습 루프를 구현한다.

**쓰이는 곳:** PyTorch의 자동미분은 연산마다 계산 그래프를 기록하고 `loss.backward()`에서 역순으로 국소 미분을 실행한다. 같은 구조의 엔진을 직접 만들면 `backward()`, `zero_grad()`, 기울기 누적 같은 학습 코드의 동작을 정확히 설명할 수 있고([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch)), 트랙 과제에서 이 엔진으로 MLP를 학습한다.

**본문 절:** 이 레슨에서 쓰는 파이썬 문법 · Value 클래스 · 엔진으로 학습 루프 만들기

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 3 · 그림 3

**실습**

- `ex1` micrograd의 backward()와 국소 미분 채우기

**서술형**

- `d1` micrograd의 Value 클래스에서 backward()가 _backward()를 실행하기 전에 위상정렬(topo)을 먼저 하는 이유는 무엇인가?
- `d2` `x = Value(3.0); y = x * x + x; y.backward()`에서 `x.grad`가 7이 되는 과정을, 계산 그래프의 노드와 `_backward` 호출 순서로 설명하라. `+=` 대신 `=`를 쓰면 몇이 되는지도 쓰라.

**참고 자료**

- [Andrej Karpathy — micrograd (GitHub)](https://github.com/karpathy/micrograd) — 본문 Value 클래스의 원본 저장소 (영문)
- [Karpathy — Neural Networks: Zero to Hero, 1강](https://karpathy.ai/zero-to-hero.html) — micrograd를 처음부터 만드는 강의 영상 (영문)

<a id="lesson-optimizers"></a>

### 4. 배치, 에포크, 학습률, SGD, Adam

핵심 · 35분 · [본문 원본](../../src/content/modules/neural-networks/optimizers.ts) · [실습 원본](../../src/content/modules/neural-networks/labs/optimizers.ts)

**학습 목표:** 미니배치·반복·에포크를 구분하고 배치 크기와 학습률이 학습에 주는 영향을 설명하며, SGD·Momentum·Adam의 갱신식을 쓰고 Momentum의 누적과 Adam의 첫 갱신을 손으로 계산하고, 문제에 맞는 최적화기를 고른다.

**쓰이는 곳:** 신경망 학습 코드는 데이터를 미니배치로 나눠 에포크 단위로 반복하고, 최적화기가 기울기로 파라미터를 갱신하는 구조다([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch)). 학습률과 최적화기는 학습이 수렴하는지, 얼마나 빨리 수렴하는지를 가장 크게 좌우하는 하이퍼파라미터이고, 언어 모델 학습에 쓰는 AdamW와 학습률 스케줄([5-2 가중치 감쇠와 학습률 스케줄](5-2-deep-training.md#lesson-training-schedules))도 이 레슨의 갱신식에서 출발한다.

**본문 절:** 미니배치, 반복, 에포크 · SGD와 학습률 · Momentum · Adam · 최적화기 고르기

**구성:** 확인 문제 6 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` Momentum과 Adam 한 스텝 구현하기

**서술형**

- `d1` Adam의 두 이동평균 m과 v가 각각 하는 일과 편향 보정이 필요한 이유를 쓰고, 기울기의 크기가 파라미터마다 크게 다를 때 Adam이 SGD보다 학습률을 고르기 쉬운 이유를 설명하라.
- `d2` 등고선이 한 방향으로 길쭉한 2차 손실로 실험했더니 학습률을 잘 고른 SGD(0.04)가 Adam보다 정확했다. 그 이유와, 그런데도 신경망 학습에서 Adam을 기본으로 쓰는 경우가 많은 이유를 쓰라.

**참고 자료**

- [Distill — Why Momentum Really Works](https://distill.pub/2017/momentum/) — Momentum의 동작을 조작하며 보는 자료 (영문)
- [Kingma & Ba (2014) — Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980) — Adam 원 논문, Algorithm 1이 본문의 갱신식 (영문)

## 심화 레슨

<a id="lesson-autodiff-theory"></a>

### 5. 자동미분의 두 모드와 메모리

심화 · 30분 · [본문 원본](../../src/content/modules/neural-networks/autodiff-theory.ts) · [실습 원본](../../src/content/modules/neural-networks/labs/autodiff-theory.ts)

**학습 목표:** 야코비안-벡터 곱(JVP)과 벡터-야코비안 곱(VJP)으로 순방향·역방향 자동미분의 비용을 비교하고, 이원수로 순방향 모드를 구현하며, 그레이디언트 체크포인팅의 메모리·계산 거래를 설명할 수 있다.

**쓰이는 곳:** PyTorch·JAX 같은 프레임워크는 두 모드를 모두 제공하고, 큰 모델을 학습할 때 GPU 메모리를 가장 많이 쓰는 것은 역전파를 위해 저장하는 중간 활성화다. 두 모드의 비용과 메모리 구조를 알면 거대 언어 모델 학습에서 쓰는 그레이디언트 체크포인팅([5-2 GPU, 혼합 정밀도와 PyTorch 실습](5-2-deep-training.md#lesson-pytorch-practice))과 헤세 행렬·벡터 곱 같은 고급 기법을 이해할 수 있다.

**본문 절:** 야코비안, JVP, VJP · 메모리와 그레이디언트 체크포인팅

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 이원수 순방향 모드와 JVP·VJP

**서술형**

- `d1` 함수 $f: \mathbb{R}^n \to \mathbb{R}^m$의 기울기(야코비안)를 구할 때 순방향 모드와 역방향 모드는 각각 몇 번 지나가야 하는가? 신경망 학습에 역방향 모드가 쓰이는 이유와 그 대가(메모리), 그레이디언트 체크포인팅의 원리를 설명하라.

**참고 자료**

- [Baydin et al. (2018) — Automatic Differentiation in Machine Learning: a Survey](https://jmlr.org/papers/v18/17-468.html) — 순방향·역방향 모드의 표준 정리 (영문)
- [Chen et al. (2016) — Training Deep Nets with Sublinear Memory Cost](https://arxiv.org/abs/1604.06174) — 그레이디언트 체크포인팅 (영문, 연구 논문)

<a id="lesson-adam-theory"></a>

### 6. Adam의 이론: 편향 보정, AdamW, 워밍업

심화 · 30분 · [본문 원본](../../src/content/modules/neural-networks/adam-theory.ts) · [실습 원본](../../src/content/modules/neural-networks/labs/adam-theory.ts)

**학습 목표:** Adam 편향 보정을 $\mathbb{E}[m_t] = (1-\beta_1^t)\mathbb{E}[g]$로 유도하고, Adam에서 L2 규제와 가중치 감쇠가 달라지는 이유와 AdamW, 학습률 워밍업이 필요한 이유를 설명한다.

**쓰이는 곳:** 언어 모델을 포함한 Transformer 학습은 대부분 AdamW와 학습률 워밍업을 함께 쓴다([5-2 가중치 감쇠와 학습률 스케줄](5-2-deep-training.md#lesson-training-schedules), [6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining)). 편향 보정과 가중치 감쇠가 어떻게 동작하는지 알아야 학습 설정의 하이퍼파라미터($\beta$, $\epsilon$, 가중치 감쇠, 워밍업 길이)를 근거를 두고 고를 수 있다.

**본문 절:** 편향 보정의 유도 · L2 규제와 가중치 감쇠의 차이: AdamW · 워밍업이 필요한 이유

**구성:** 확인 문제 6 · 서술형 1 · 실습 1 · 그림 3

**실습**

- `ex1` 편향 보정 Adam과 분리된 가중치 감쇠(AdamW)

**서술형**

- `d1` Adam의 편향 보정에서 $m_t$를 $1-\beta_1^t$로 나누는 이유를 $\mathbb{E}[m_t]$를 계산해 유도하라. Adam에 L2 규제를 그대로 더하면 의도대로 동작하지 않는 이유와, AdamW가 이를 고치는 방법도 쓰라.

**참고 자료**

- [Kingma & Ba (2015) — Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980) — 편향 보정 유도가 2~3절에 있다 (영문)
- [Loshchilov & Hutter (2019) — Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101) — AdamW (영문, 연구 논문)
- [Liu et al. (2020) — On the Variance of the Adaptive Learning Rate and Beyond](https://arxiv.org/abs/1908.03265) — 워밍업이 필요한 이유와 RAdam (영문)

## 백지 복습

1. 활성화 함수 없이 선형 층을 여러 개 쌓으면 한 층과 같아지는 이유를 식으로 쓰고, ReLU 은닉층이 XOR을 푸는 원리를 쓰라.
2. 계산 그래프에서 덧셈·곱셈·ReLU 노드가 입력으로 보내는 기울기를 쓰고, $L = (wx + c)^2$의 역전파를 노드 순서대로 쓰라. 역전파가 수치미분보다 효율적인 이유도 쓰라.
3. 한 층 $z = Wx + b$에서 $\delta = \partial L/\partial z$일 때 $\partial L/\partial W$, $\partial L/\partial b$, $\partial L/\partial x$를 쓰고, 각 기울기의 모양이 $W$, $b$, $x$와 같은 이유를 쓰라.
4. 자동미분 엔진의 backward()가 위상정렬의 역순으로 _backward를 실행하는 이유와, 기울기를 += 로 누적하고 반복마다 0으로 되돌리는 이유를 쓰라.
5. SGD·Momentum·Adam이 파라미터를 갱신하는 방식의 차이를 쓰고, Adam의 편향 보정이 필요한 이유를 쓰라.

## 과제: 미니 자동미분 엔진으로 MLP 학습하기

저장 키 `autograd-mlp` · 자기 점검 · [과제 원본](../../src/content/modules/neural-networks/assignment.ts)

[5-1 자동미분 엔진 구현](#lesson-micrograd)의 `Value` 클래스에 나눗셈과 지수 함수를 추가하고, 이 엔진만으로 MLP를 만들어 make_moons 데이터를 분류합니다. gradient check로 구현을 검증하고, 같은 모델을 NumPy 행렬 연산으로 구현한 버전과 속도·정확도를 비교합니다.

**핵심** 항목 네 개(Value 확장·MLP 학습·gradient check·계산 그래프)는 핵심 레슨만으로 풀 수 있고, 채점 기준은 이 네 항목만 봅니다. **보충**(NumPy 벡터화 비교)과 **심화** 항목은 선택이며 점수 대신 피드백을 받습니다.

### 요구사항

- `Value`의 `__truediv__`와 `exp`의 `_backward`를 완성해, 두 검증 식 모두 상대오차 $10^{-5}$ 미만(✓)을 받는다.
- `Neuron`·`Layer`·`MLP`로 make_moons(100개)를 학습해 학습 데이터 정확도 90% 이상을 달성하고 손실 곡선과 결정경계를 그린다.
- 학습한 MLP의 파라미터 5개에 대해 역전파 기울기와 중심차분의 상대오차 표를 만든다.
- 노드 4~6개짜리 계산 그래프를 직접 설계해 손 계산 표와 `Value` 결과를 비교한다.
- (보충) 같은 구조의 NumPy 구현과 정확도·속도를 비교하고, `Value` 구현이 느린 이유를 세 가지 이상 설명한다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| Value에 나눗셈과 exp 추가하기 | 핵심 | 코드 `extend-code`, 답안 `extend-derivation`(최소 80자) |
| Value로 만든 MLP로 make_moons 분류하기 | 핵심 | 코드 `mlp-code`, 코드 `mlp-plot`, 답안 `mlp-answer`(최소 100자) |
| MLP 전체에 대한 gradient check | 핵심 | 코드 `gradcheck-code`, 답안 `gradcheck-answer`(최소 60자) |
| 나만의 계산 그래프 손으로 풀기 | 핵심 | 답안 `graph-hand`(최소 140자), 코드 `graph-code` |
| 보충: NumPy 벡터화 구현과 비교하기 | 보충 | 코드 `numpy-code`, 답안 `numpy-answer`(최소 150자) |
| 심화: 최적화기·기울기 흐름·자동미분 실험 | 심화 | 코드 `advanced-code`, 답안 `advanced-answer` |

### 채점 기준

| 기준 | 배점 | 확인 내용 |
| --- | ---: | --- |
| 국소 미분 유도의 정확성 | 3 | 나눗셈·exp의 국소 미분과 직접 설계한 계산 그래프의 역전파가 정확합니다. |
| 구현 정확성 | 3 | 확장한 Value와 MLP 전체의 gradient check를 통과했습니다. |
| MLP 학습과 문제 해결 과정 | 3 | 학습 데이터 정확도 90% 이상을 달성하고, 손실 곡선·결정경계와 문제 해결 과정을 제시했습니다. |
| 코드 품질과 가독성 | 1 | 코드와 답안이 읽기 쉽고, 모든 셀이 처음부터 순서대로 실행됩니다. |

### 자동 테스트

- `extend`: 나눗셈의 _backward: ∂(a/b)/∂a = 1/b, ∂(a/b)/∂b = −a/b²
- `extend`: exp의 _backward가 e^x를 누적한다
- `mlp`: 학습한 MLP의 학습 데이터 정확도 90% 이상, 손실 감소
- `gradcheck`: MLP 전체 역전파가 수치미분과 일치한다

### 선택 심화 문제

- `ch1` Value에 log를 추가해 소프트맥스 교차 엔트로피 만들기
- `ch2` 깊은 망의 층별 기울기 크기 측정과 기울기 클리핑
