<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# 2-6 추론통계와 정보량

[전체 목차](README.md) · 트랙 2 수학 기초 · [모듈 원본](../../src/content/modules/inference-information/index.ts)

큰 수의 법칙과 중심극한정리, 신뢰구간과 가설검정, 가능도와 엔트로피

## 목표 문제

테스트 데이터 400개에서 정확도 0.85를 얻은 모델에 95% 신뢰구간을 붙이고, 정확도 0.86인 다른 모델과 이 데이터로 구분할 수 있는지 판단한다. 동전 10번 중 앞면 7번이라는 데이터에서 앞면 확률을 최대가능도추정으로 구하고, 분류 모델의 교차엔트로피 손실이 정답의 음의 로그가능도와 같다는 것을 계산으로 확인한다.

## 학습 목표

- 표본평균의 기댓값·분산을 유도해 표준오차를 계산하고, 큰 수의 법칙과 중심극한정리가 각각 무엇을 말하는지 구분한다.
- 평균과 비율의 신뢰구간을 계산해 바르게 해석하고, z 검정과 순열 검정으로 p값을 구하며 두 가지 오류와 다중 비교의 문제를 설명한다.
- 확률과 가능도를 구분하고, 로그가능도를 미분해 최대가능도추정값을 구한다.
- 엔트로피와 교차엔트로피를 계산하고, 교차엔트로피 손실을 최소화하는 것이 최대가능도추정인 이유를 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [큰 수의 법칙과 중심극한정리](#lesson-lln-clt) | 핵심 | 35분 | #36 큰 수의 법칙과 중심극한정리 |
| 2 | [추정, 신뢰구간, 가설검정, p값](#lesson-statistical-inference) | 핵심 | 35분 | #37 추정, 신뢰구간, 가설검정, p값 |
| 3 | [가능도, 최대가능도추정, 엔트로피, 교차엔트로피](#lesson-likelihood-entropy) | 핵심 | 40분 | #38 가능도(우도), 최대가능도추정, 엔트로피, 교차엔트로피 |
| 4 | [사전분포와 MAP 추정](#lesson-mle-map) | 심화 | 30분 | — |
| 5 | [교차엔트로피의 분해와 KL 발산](#lesson-entropy-kl) | 심화 | 30분 | — |

## 핵심 레슨

<a id="lesson-lln-clt"></a>

### 1. 큰 수의 법칙과 중심극한정리

핵심 · 35분 · [본문 원본](../../src/content/modules/inference-information/lln-clt.ts) · [실습 원본](../../src/content/modules/inference-information/labs/lln-clt.ts)

**학습 목표:** 표본평균의 기댓값과 분산을 유도해 표준오차를 계산하고, 큰 수의 법칙으로 표본평균이 모평균에 가까워지는 것을, 중심극한정리로 표본평균의 분포가 정규분포에 가까워지는 것을 설명하며 시뮬레이션으로 확인한다.

**쓰이는 곳:** 미니배치로 구한 기울기는 데이터마다의 기울기를 평균한 표본평균이라, 배치 크기를 키우면 기울기의 잡음이 $1/\sqrt{B}$로 줄어든다([5-1 배치, 에포크, 학습률, SGD, Adam](5-1-neural-networks.md#lesson-optimizers)). 테스트 정확도의 오차 범위와 두 모델 비교도 중심극한정리로 계산한다([2-6 추정, 신뢰구간, 가설검정, p값](#lesson-statistical-inference)).

**본문 절:** 표본평균의 기댓값과 분산 · 큰 수의 법칙 · 중심극한정리 · 미니배치 기울기와 표본평균

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 2 · 그림 2

**실습**

- `ex1` 누적 평균과 표본평균의 분포를 시뮬레이션으로 확인하기

**서술형**

- `d1` 독립인 $X_1, \ldots, X_n$(평균 $\mu$, 분산 $\sigma^2$)의 표본평균 $\bar X$에 대해 $E[\bar X] = \mu$와 $\mathrm{Var}(\bar X) = \sigma^2/n$을 유도하고, 큰 수의 법칙과 중심극한정리가 각각 $\bar X$에 대해 무엇을 말하는지 구분해 설명하라.

**참고 자료**

- [3Blue1Brown — But what is the Central Limit Theorem?](https://www.3blue1brown.com/lessons/clt) — 주사위 합의 분포가 정규분포에 가까워지는 과정 (영문)
- [Seeing Theory — Probability Distributions: Central Limit Theorem](https://seeing-theory.brown.edu/probability-distributions/index.html) — 표본 크기를 바꾸며 표본평균의 분포 보기 (영문)

<a id="lesson-statistical-inference"></a>

### 2. 추정, 신뢰구간, 가설검정, p값

핵심 · 35분 · [본문 원본](../../src/content/modules/inference-information/statistical-inference.ts) · [실습 원본](../../src/content/modules/inference-information/labs/statistical-inference.ts)

**학습 목표:** 표준오차로 평균과 비율의 95% 신뢰구간을 계산해 바르게 해석하고, 귀무가설·검정통계량·p값·유의수준으로 가설검정을 하며, 제1종·제2종 오류와 다중 비교의 문제를 설명한다.

**쓰이는 곳:** 테스트 정확도에 오차 범위를 붙이고 두 모델의 차이가 우연인지 판단할 때([4-3 모델 평가의 통계: 선택 편향과 짝지은 비교](4-3-generalization.md#lesson-model-evaluation-stats), [6-3 LLM 평가의 통계](6-3-llm-systems.md#lesson-eval-statistics)), 서비스의 A/B 테스트와 배포 뒤 입력 분포의 변화를 감지할 때([6-3 드리프트 감지의 통계](6-3-llm-systems.md#lesson-drift-statistics)) 이 레슨의 방법을 쓴다.

**본문 절:** 점추정과 표준오차 · 신뢰구간 · 가설검정 · 순열 검정 · 두 가지 오류와 검정력 · p값을 해석할 때 주의할 점

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 신뢰구간과 z 검정, 순열 검정 구현하기

**서술형**

- `d1` 새 추천 모델(B)의 클릭률이 기존 모델(A)보다 0.3%p 높게 나왔고 p값은 0.001이었다(각 100만 명). 이 결과만으로 B를 배포해야 한다고 결론 내리기 전에 확인해야 할 점을 p값의 의미, 효과의 크기, 실험 설계 관점에서 설명하라.

**참고 자료**

- [OpenIntro Statistics — Foundations for inference](https://www.openintro.org/book/os/) — 5장: 표준오차, 신뢰구간, 가설검정 (영문, 무료 교재)
- [Seeing Theory — Frequentist Inference](https://seeing-theory.brown.edu/frequentist-inference/index.html) — 신뢰구간과 가설검정을 인터랙티브로 (영문)

<a id="lesson-likelihood-entropy"></a>

### 3. 가능도, 최대가능도추정, 엔트로피, 교차엔트로피

핵심 · 40분 · [본문 원본](../../src/content/modules/inference-information/likelihood-entropy.ts) · [실습 원본](../../src/content/modules/inference-information/labs/likelihood-entropy.ts)

**학습 목표:** 확률과 가능도를 구분하고 로그가능도를 미분해 베르누이 분포의 최대가능도추정값을 구하며, 엔트로피와 교차엔트로피를 계산해 분류 손실이 정답의 음의 로그가능도와 같은 이유를 설명한다.

**쓰이는 곳:** 분류 모델과 언어 모델은 교차엔트로피를 손실로 학습하는데, 이것은 정답의 음의 로그가능도를 최소화하는 최대가능도추정이다([4-2 손실함수의 확률적 기원](4-2-linear-models.md#lesson-loss-likelihood), [6-2 다음 토큰 예측, 사전학습, 문맥 창](6-2-llm-training.md#lesson-pretraining)). 언어 모델의 성능 지표인 퍼플렉서티도 교차엔트로피로 정의한다([6-3 LLM 평가와 안전성 평가](6-3-llm-systems.md#lesson-llm-evaluation)).

**본문 절:** 확률과 가능도 · 최대가능도추정 · 로그가능도와 음의 로그가능도 · 엔트로피 · 교차엔트로피와 분류 손실

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 3 · 그림 2 · 이미지 1

**실습**

- `ex1` 음의 로그가능도로 최대가능도추정하고 교차엔트로피 손실 구하기

**서술형**

- `d1` 동전을 $n$번 던져 앞면이 $k$번 나왔을 때 앞면 확률의 최대가능도추정값이 $k/n$임을 로그가능도로 유도하고, 이 결과와 분류 모델의 교차엔트로피 손실의 관계를 설명하라.

**참고 자료**

- [Chris Olah — Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/) — 엔트로피와 교차엔트로피를 그림으로 설명한 글 (영문)
- [CS229 Probability Theory Review](https://cs229.stanford.edu/section/cs229-prob.pdf) — 확률분포와 최대가능도추정의 정리 (영문)

## 심화 레슨

<a id="lesson-mle-map"></a>

### 4. 사전분포와 MAP 추정

심화 · 30분 · [본문 원본](../../src/content/modules/inference-information/mle-map.ts) · [실습 원본](../../src/content/modules/inference-information/labs/mle-map.ts)

**학습 목표:** 베타 사전분포와 베르누이 가능도로 사후분포를 구해 MAP 추정값과 사후평균을 계산하고, 데이터 양에 따라 MLE와 MAP의 차이가 줄어드는 이유와 사전분포가 규제 역할을 하는 이유를 설명한다.

**쓰이는 곳:** 데이터가 적을 때 최대가능도추정은 극단적인 값을 내기 쉽다. 나이브 베이즈의 라플라스 스무딩([4-4 나이브 베이즈 분류기](4-4-ml-algorithms.md#lesson-naive-bayes))과 가중치에 벌점을 주는 규제([4-3 L1·L2 규제, 조기 종료, 학습 곡선](4-3-generalization.md#lesson-regularization), [4-2 손실함수의 확률적 기원](4-2-linear-models.md#lesson-loss-likelihood))는 모두 사전분포를 더한 MAP 추정으로 설명된다.

**본문 절:** 데이터가 적을 때 최대가능도추정의 문제 · 사전분포와 사후분포 · MAP 추정과 사후평균 · 데이터가 많아지면 · MAP와 규제

**구성:** 확인 문제 5 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 1

**실습**

- `ex1` MLE·MAP의 닫힌 형태의 해와 분산 추정의 편향

**서술형**

- `d1` MAP 추정이 MLE와 어떻게 다른지 사후분포의 식으로 설명하고, 베타 사전분포를 "미리 본 횟수"로 해석할 수 있는 이유를 쓰라. 데이터가 많아질 때 두 추정값의 관계도 설명하라.

**참고 자료**

- [Seeing Theory — Bayesian Inference](https://seeing-theory.brown.edu/bayesian-inference/index.html) — 사전분포가 데이터에 따라 사후분포로 바뀌는 과정 (영문)
- [CS229 Probability Theory Review](https://cs229.stanford.edu/section/cs229-prob.pdf) — 확률분포와 추정의 정리 (영문)

<a id="lesson-entropy-kl"></a>

### 5. 교차엔트로피의 분해와 KL 발산

심화 · 30분 · [본문 원본](../../src/content/modules/inference-information/entropy-kl.ts) · [실습 원본](../../src/content/modules/inference-information/labs/entropy-kl.ts)

**학습 목표:** 교차엔트로피를 엔트로피와 KL 발산으로 분해하고, KL 발산의 성질(0 이상, 비대칭)을 계산으로 확인하며, 교차엔트로피를 최소화하는 학습이 KL 발산을 줄이는 이유와 KL의 방향에 따라 근사 결과가 달라지는 이유를 설명한다.

**쓰이는 곳:** 분류와 언어 모델의 학습은 데이터 분포와 모델 분포 사이의 KL 발산을 줄이는 일이다. VAE는 잠재변수 분포에 KL 항을 두고([X-2 생성 모델의 수학: ELBO, 재매개변수화, 확산](X-2-vision-generative.md#lesson-generative-math)), 언어 모델을 선호 데이터로 조정할 때는 원래 모델에서 너무 멀어지지 않도록 KL 벌점을 준다([6-2 선호도 학습: RLHF와 DPO](6-2-llm-training.md#lesson-preference-learning)).

**본문 절:** 교차엔트로피의 분해 · KL 발산의 성질 · 교차엔트로피 최소화는 KL 최소화다 · KL의 방향과 근사의 모양 · 비트와 냇, 코드로 확인

**구성:** 확인 문제 6 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 2

**실습**

- `ex1` 엔트로피·교차 엔트로피·KL 발산 구현

**서술형**

- `d1` 교차엔트로피 $H(p, q)$와 KL 발산 $D_{\mathrm{KL}}(p \parallel q)$의 관계식을 쓰고, 분류 모델을 교차엔트로피로 학습하는 것이 무엇을 줄이는 것인지 설명하라. 손실이 0까지 내려가지 않는 경우도 설명하라.

**참고 자료**

- [Chris Olah — Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/) — 엔트로피·교차엔트로피·KL 발산을 그림으로 설명한 글 (영문)

## 백지 복습

1. 표본평균의 분산이 $\sigma^2/n$인 이유를 쓰고, 표준오차를 절반으로 줄이려면 표본을 몇 배로 늘려야 하는지 설명하라. 큰 수의 법칙과 중심극한정리의 차이도 쓰라.
2. 비율의 95% 신뢰구간 식을 쓰고, 400개 중 340개를 맞힌 모델의 신뢰구간을 계산하라. "95%"가 무엇을 뜻하는지 정확히 쓰라.
3. 가설검정의 네 단계를 쓰고, 동전 100번 중 앞면 61번일 때 z와 p값을 구하라. p값에 대해 흔히 하는 잘못된 해석 두 가지를 쓰라.
4. 확률과 가능도의 차이를 쓰고, $n$번 중 $k$번 성공한 데이터의 최대가능도추정값이 $k/n$임을 로그가능도로 유도하라.
5. 엔트로피와 교차엔트로피의 정의를 쓰고, 분류 모델의 교차엔트로피 손실이 $-\log q(\text{정답})$이 되는 이유와 이것이 최대가능도추정과 같은 이유를 설명하라.

## 과제: 경사하강법과 베이즈 정리 직접 계산하기

저장 키 `math-gd-bayes` · 자기 점검 · [과제 원본](../../src/content/modules/inference-information/assignment.ts)

NumPy만으로 선형회귀를 경사하강법으로 학습하고, 학습률에 따른 수렴 양상을 비교합니다. 이어서 베이즈 정리 예제의 조건을 바꿔 사후확률이 어떻게 달라지는지 확인합니다. 모든 작업은 이 페이지의 코드 셀과 답안 칸에서 진행하며, 코드는 브라우저에서 실행됩니다.

**핵심** 항목 세 개(경사하강법·학습률 비교·베이즈 정리)는 트랙 2의 핵심 레슨만으로 풀 수 있도록 구성했고, 자기 점검 기준은 이 세 항목을 확인합니다. **보충**(해석해 비교)과 **심화**(조건수·미니배치 등) 항목은 선택이며, 과제 점수는 매기지 않습니다.

### 요구사항

- `grad`의 TODO 두 줄을 직접 유도한 편미분으로 채우고, 학습 결과 $w \approx 2$, $b \approx 1$을 얻는다.
- 학습률 0.001·0.01·0.1·0.5의 loss 곡선을 로그 축 그래프 하나에 그리고, 수렴 속도와 안정성을 비교해 설명한다.
- `posterior`를 완성해 유병률 0.1%·1%·10%·30%의 사후확률을 계산하고 기저율의 영향을 설명한다.
- (보충) `np.linalg.lstsq` 해석해와 경사하강법 결과의 차이를 출력하고, 차이의 원인을 설명한다.
- 시드(42)를 고정해, 실행 환경을 초기화한 뒤 처음부터 실행해도 같은 결과가 나온다.

### 항목

| 항목 | 구분 | 셀 |
| --- | --- | --- |
| 경사하강법으로 w, b 학습하기 | 핵심 | 답안 `gd-derivation`(최소 80자), 코드 `gd-code` |
| 학습률 네 가지 비교 | 핵심 | 코드 `lr-code`, 답안 `lr-observation`(최소 120자) |
| 베이즈 정리 다시 계산하기 | 핵심 | 코드 `bayes-code`, 답안 `bayes-answer`(최소 80자) |
| 보충: 해석해와 비교하기 | 보충 | 코드 `lstsq-code`, 답안 `lstsq-answer`(최소 60자) |
| 심화: 조건수·미니배치·학습률 스케줄 | 심화 | 코드 `advanced-code`, 답안 `advanced-answer` |

### 자기 점검 기준

| 기준 | 확인 내용 |
| --- | --- |
| 수식 유도의 정확성 | 편미분 유도가 정확하고, 식과 코드의 대응을 설명했습니다. |
| 코드 동작과 재현성 | 핵심 항목의 모든 셀이 처음부터 순서대로 실행되며, 시드를 고정해 같은 결과가 재현됩니다. |
| 실험 관찰의 통찰 | 학습률 비교와 유병률 변화에 대해 수치를 근거로 원인을 설명했습니다(배율 $1 - \eta \cdot$곡률, TP·FP의 사람 수 등). |
| 가독성 | 답안이 간결하고 그래프·출력과 서술이 잘 연결됩니다. |

### 자동 테스트

- `gd`: grad가 수치미분과 일치한다
- `gd`: 학습 결과가 w ≈ 2, b ≈ 1이고 손실이 줄었다
- `lstsq`: 경사하강법 결과가 해석해와 0.01 이내
- `bayes`: posterior가 베이즈 정리와 일치하고 유병률에 따라 커진다

### 선택 심화 문제

- `ch1` 미니배치 확률적 경사하강법
- `ch2` 수치미분으로 기울기 검산하기 (gradient check)
