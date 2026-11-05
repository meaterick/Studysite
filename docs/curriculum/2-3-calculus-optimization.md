<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 2-3 미분과 최적화

[전체 목차](README.md) · 트랙 2 수학 기초 · [모듈 원본](../../src/content/modules/calculus-optimization/index.ts)

도함수, 편미분과 기울기, 연쇄법칙, 경사하강법

## 목표 문제

데이터 $(1, 2), (2, 4), (3, 7)$에 모델 $\hat y = wx + b$를 맞출 때, 평균제곱오차를 $w$와 $b$로 편미분해 기울기를 구하고, 그 반대 방향으로 두 파라미터를 반복해서 옮겨 최소제곱 해 $w = 2.5$, $b \approx -0.667$에 도달한다. 손으로 유도한 기울기는 수치미분으로 검산하고, 학습률을 바꿔 가며 수렴·진동·발산이 일어나는 조건을 오차의 배율로 설명한다.

## 학습 목표

- 평균변화율의 극한으로 도함수를 정의하고, 미분 규칙으로 도함수를 구하며, 도함수의 부호로 증가·감소와 최솟값을 판단한다.
- 편미분으로 기울기 벡터를 만들고, 기울기가 가장 빠르게 증가하는 방향이며 등고선에 수직인 이유를 방향도함수로 설명한다.
- 연쇄법칙으로 합성함수와 여러 단계로 된 계산의 기울기를 구하고, 중심차분으로 결과를 검산한다.
- 경사하강법으로 1변수·다변수 손실을 최소화하고, 학습률에 따른 수렴·진동·발산과 기울기가 0인 점의 종류를 구분한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [미분과 도함수](#lesson-derivatives) | 핵심 | 35분 | #25 미분과 도함수, 변화율 |
| 2 | [편미분과 기울기](#lesson-gradient) | 핵심 | 30분 | #26 편미분과 기울기 |
| 3 | [연쇄법칙](#lesson-chain-rule) | 핵심 | 30분 | #27 연쇄법칙과 합성함수의 미분 |
| 4 | [최솟값과 경사하강법](#lesson-gradient-descent) | 핵심 | 45분 | #28 최솟값·최댓값, 경사하강법 |
| 5 | [경사하강법의 수렴 조건과 조건수](#lesson-gd-convergence) | 심화 | 40분 | — |

## 핵심 레슨

<a id="lesson-derivatives"></a>

### 1. 미분과 도함수

핵심 · 35분 · [본문 원본](../../src/content/modules/calculus-optimization/derivatives.ts) · [실습 원본](../../src/content/modules/calculus-optimization/labs/derivatives.ts)

**학습 목표:** 평균변화율의 극한으로 도함수를 정의하고, 거듭제곱·상수배·합·곱·지수·로그의 미분 규칙으로 도함수를 구하며, 도함수의 부호로 증가·감소와 최솟값을 판단하고 중심차분으로 결과를 검산한다.

**쓰이는 곳:** 모델을 학습시키는 일은 손실이 줄어드는 방향으로 파라미터를 조금씩 바꾸는 일이고, 그 방향과 크기를 알려 주는 값이 도함수다([2-3 최솟값과 경사하강법](#lesson-gradient-descent)). 딥러닝 프레임워크의 자동미분도 이 레슨의 미분 규칙을 조합해 계산한다([5-1 순전파, 역전파, 계산 그래프](5-1-neural-networks.md#lesson-backprop)).

**본문 절:** 평균변화율과 순간변화율 · 미분 규칙 · 도함수의 부호와 최솟값 · 수치미분

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2 · 그림 1

**실습**

- `ex1` 다항식의 도함수와 중심차분 검산

**서술형**

- `d1` 도함수의 정의를 쓰고, 정의만으로 $f(x) = x^2$의 도함수가 $2x$임을 보여라. 어떤 점에서 $\frac{dL}{dw} = -6$이라는 것이 무엇을 뜻하는지도 설명하라.

**참고 자료**

- [3Blue1Brown — The paradox of the derivative](https://www.3blue1brown.com/lessons/derivatives) — 순간변화율과 도함수의 정의 (영문)
- [Dive into Deep Learning — Calculus](https://d2l.ai/chapter_preliminaries/calculus.html) — 도함수·편미분·기울기를 코드와 함께 (영문, 한국어판은 ko.d2l.ai)

<a id="lesson-gradient"></a>

### 2. 편미분과 기울기

핵심 · 30분 · [본문 원본](../../src/content/modules/calculus-optimization/gradient.ts) · [실습 원본](../../src/content/modules/calculus-optimization/labs/gradient.ts)

**학습 목표:** 다변수 함수의 편미분을 계산해 기울기 벡터를 만들고, 기울기가 함수가 가장 빠르게 증가하는 방향이며 등고선에 수직이라는 사실을 방향도함수로 설명하며, 파라미터와 같은 모양의 기울기를 수치미분으로 검산한다.

**쓰이는 곳:** 모델의 파라미터는 수십 개에서 수천억 개이고, 학습은 손실을 모든 파라미터로 편미분한 기울기를 구해 그 반대 방향으로 파라미터를 옮기는 일이다([2-3 최솟값과 경사하강법](#lesson-gradient-descent)). 딥러닝 프레임워크가 파라미터마다 저장하는 기울기도 파라미터와 모양이 같은 배열이다([5-2 PyTorch 텐서, 데이터 로더, 학습 루프, GPU](5-2-deep-training.md#lesson-pytorch)).

**본문 절:** 편미분 · 기울기 벡터 · 기울기는 가장 빠르게 증가하는 방향이다 · 손실함수의 기울기 · 수치 기울기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 1

**실습**

- `ex1` 수치 기울기와 평균제곱오차의 기울기

**서술형**

- `d1` 기울기 벡터가 함수가 가장 빠르게 증가하는 방향인 이유를 방향도함수 $\nabla f \cdot u$와 내적의 성질로 설명하고, 경사하강법이 $-\nabla L$ 방향으로 움직이는 이유를 써라.

**참고 자료**

- [Khan Academy — Derivatives of multivariable functions](https://www.khanacademy.org/math/multivariable-calculus/multivariable-derivatives) — 편미분, 기울기, 방향도함수 단원 (영문)
- [Dive into Deep Learning — Calculus](https://d2l.ai/chapter_preliminaries/calculus.html) — 편미분과 기울기 (영문, 한국어판은 ko.d2l.ai)

<a id="lesson-chain-rule"></a>

### 3. 연쇄법칙

핵심 · 30분 · [본문 원본](../../src/content/modules/calculus-optimization/chain-rule.ts) · [실습 원본](../../src/content/modules/calculus-optimization/labs/chain-rule.ts)

**학습 목표:** 합성함수의 도함수를 연쇄법칙으로 구하고, 여러 단계로 된 계산에서 국소 도함수를 뒤에서부터 곱해 손실의 기울기를 구하며, 한 변수가 여러 경로로 결과에 영향을 줄 때 경로별 기여를 더한다.

**쓰이는 곳:** 신경망은 층을 여러 번 합성한 함수이고, 손실을 각 층의 파라미터로 미분하는 역전파는 연쇄법칙을 층마다 반복해 적용하는 알고리즘이다([5-1 순전파, 역전파, 계산 그래프](5-1-neural-networks.md#lesson-backprop)). 시그모이드의 도함수와 로지스틱 회귀의 기울기도 연쇄법칙으로 구한다([4-2 로지스틱 회귀, 시그모이드, 분류 임계값](4-2-linear-models.md#lesson-logistic-regression)).

**본문 절:** 합성함수의 미분 · 손실을 파라미터로 미분하기 · 여러 단계로 나누어 계산하기 · 시그모이드의 도함수 · 여러 경로로 영향을 줄 때

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 1

**실습**

- `ex1` 연쇄법칙으로 뉴런 하나의 기울기 구하기

**서술형**

- `d1` 뉴런 하나의 제곱오차 $L = (\sigma(wx + b) - y)^2$을 $z = wx + b$, $p = \sigma(z)$, $L = (p - y)^2$의 세 단계로 나누고, 연쇄법칙으로 $\frac{\partial L}{\partial w}$와 $\frac{\partial L}{\partial b}$를 구하라.

**참고 자료**

- [3Blue1Brown — Visualizing the chain rule and product rule](https://www.3blue1brown.com/lessons/chain-rule-and-product-rule) — 연쇄법칙과 곱의 미분 규칙 (영문)
- [CS231n — Backpropagation, Intuitions](https://cs231n.github.io/optimization-2/) — 연쇄법칙으로 계산 그래프의 기울기를 구하는 방법 (영문)

<a id="lesson-gradient-descent"></a>

### 4. 최솟값과 경사하강법

핵심 · 45분 · [본문 원본](../../src/content/modules/calculus-optimization/gradient-descent.ts) · [실습 원본](../../src/content/modules/calculus-optimization/labs/gradient-descent.ts)

**학습 목표:** 경사하강법의 갱신식으로 1변수와 다변수 손실의 최솟값을 반복 계산으로 구하고, 학습률에 따른 수렴·진동·발산을 오차의 배율 $1 - 2\eta$로 설명하며, 기울기가 0인 지점이 최솟값이 아닐 수 있는 경우를 구분한다.

**쓰이는 곳:** 선형 회귀부터 대규모 언어 모델까지, 파라미터를 데이터에 맞추는 학습 알고리즘은 거의 모두 경사하강법과 그 변형이다([5-1 배치, 에포크, 학습률, SGD, Adam](5-1-neural-networks.md#lesson-optimizers)). 학습률을 고르고 학습 곡선을 해석하는 판단도 이 레슨의 분석에서 출발한다([5-2 가중치 감쇠와 학습률 스케줄](5-2-deep-training.md#lesson-training-schedules)).

**본문 절:** 최솟값을 찾는 두 가지 방법 · 경사하강법 · 학습률과 수렴 · 파라미터가 여러 개일 때: 선형 회귀 · 기울기가 0인 곳

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 2 · 실습 1 · 코드 셀 2 · 그림 3 · 이미지 1

**실습**

- `ex1` 경사하강법 함수와 학습률 진단

**서술형**

- `d1` $L(w) = w^2 + 4w + 1$의 도함수를 구하고, $w = 1$, $\eta = 0.1$에서 경사하강법으로 한 번 갱신한 $w$를 구하라. 이 손실의 최솟값 위치와 비교해 갱신 방향이 옳은지 설명하라.
- `d2` $L(w) = (w - 3)^2$에서 학습률이 너무 크면 어떤 일이 생기는지, 오차의 배율 $1 - 2\eta$로 설명하라. $\eta = 1.1$일 때의 배율도 계산하라.

**참고 자료**

- [3Blue1Brown — Gradient descent, how neural networks learn](https://www.3blue1brown.com/lessons/gradient-descent) — 신경망 학습 관점에서 본 경사하강법 (영문)
- [Dive into Deep Learning — Gradient Descent](https://d2l.ai/chapter_optimization/gd.html) — 학습률과 수렴을 코드와 그래프로 (영문, 한국어판은 ko.d2l.ai)

## 심화 레슨

<a id="lesson-gd-convergence"></a>

### 5. 경사하강법의 수렴 조건과 조건수

심화 · 40분 · [본문 원본](../../src/content/modules/calculus-optimization/gd-convergence.ts) · [실습 원본](../../src/content/modules/calculus-optimization/labs/gd-convergence.ts)

**학습 목표:** 곡률로부터 학습률의 안정 조건 $0 < \eta < 2/a$를 유도하고, 조건수 $\kappa$가 경사하강법의 수렴 속도를 정하는 이유와 뉴턴 방법의 장단점을 설명할 수 있다.

**쓰이는 곳:** 학습률의 상한이 어디서 정해지는지, 특성을 표준화하면 왜 학습이 빨라지는지([3-3 범주형 인코딩, 표준화, 정규화](3-3-data-preparation.md#lesson-encoding-scaling)), 모멘텀과 Adam이 어떤 문제를 줄이는지([5-1 배치, 에포크, 학습률, SGD, Adam](5-1-neural-networks.md#lesson-optimizers))를 곡률과 조건수로 설명한다.

**본문 절:** 이차 함수 하나에서: 안정 조건 $0 < \eta < 2/a$ · 방향마다 곡률이 다를 때: 조건수 · 곡률까지 쓰면: 뉴턴 방법

**구성:** 확인 문제 5 · 서술형 3 · 실습 1 · 코드 셀 2 · 그림 1

**실습**

- `ex1` 조건수로 학습률과 수렴 스텝 수 예측하기

**서술형**

- `d1` 방향마다 곡률이 다른 손실에서 경사하강법이 느려지는 이유를 학습률의 상한 $2/a_{\max}$과 가장 완만한 방향의 배율로 설명하고, 조건수 $\kappa$와 특성 표준화의 관계를 써라.
- `d2` [2-3 최솟값과 경사하강법](#lesson-gradient-descent) 실습의 `diagnose(lr)`는 학습률만 보고 $L = (w - 3)^2$의 수렴 여부를 판정한다. 이것이 가능한 이유를 쓰고, 같은 방법을 신경망 손실에 그대로 쓸 수 없는 이유를 본문의 $L = (w_1 - 1)^2 + 10(w_2 + 2)^2$과 연결해 설명하라.
- `d3` 특성이 나이(0~100)와 연봉(0~1억 원) 두 개인 선형 회귀를 경사하강법으로 학습했더니, 발산하지 않는 학습률로는 나이의 가중치가 거의 움직이지 않았다. 평균제곱오차의 헤세 행렬과 조건수로 원인을 설명하고, 해결책 두 가지를 각각의 원리와 함께 제시하라.

**참고 자료**

- [Distill — Why Momentum Really Works](https://distill.pub/2017/momentum/) — 방향마다 곡률이 다른 손실에서 모멘텀이 수렴을 빠르게 하는 원리 (영문, 인터랙티브)
- [Boyd & Vandenberghe — Convex Optimization](https://web.stanford.edu/~boyd/cvxbook/) — 9.3절 경사하강법의 수렴 분석, 9.5절 뉴턴 방법 (영문)

## 백지 복습

1. 도함수의 정의를 쓰고, 정의만으로 $(x^2)' = 2x$임을 보여라. $\frac{dL}{dw} = -6$이 무엇을 뜻하는지 설명하라.
2. $f(x, y) = x^2 + 3xy$의 편미분과 점 $(1, 2)$에서의 기울기를 구하고, $f$가 가장 빠르게 감소하는 방향을 쓰라.
3. 연쇄법칙을 식으로 쓰고, $L = (wx - y)^2$의 $\frac{dL}{dw}$와 $\sigma'(z) = \sigma(z)(1 - \sigma(z))$를 유도하라.
4. 경사하강법의 갱신식을 쓰고, $L(w) = (w - 3)^2$에서 오차가 매번 $(1 - 2\eta)$배가 되는 이유와 $\eta = 0.1, 0.75, 1.1$일 때 각각 어떻게 되는지 설명하라.
5. 기울기가 0인 점이 최솟값이 아닐 수 있는 두 경우를 쓰고, 중심차분으로 손으로 구한 기울기를 검산하는 방법과 $h$를 지나치게 작게 하면 안 되는 이유를 설명하라.
