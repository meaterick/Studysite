<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# X-1 책임 있는 AI

[전체 목차](README.md) · 트랙 X 확장 · [모듈 원본](../../src/content/modules/responsible-ai/index.ts)

AI 위험, 공정성 기준, 프라이버시 공학, 편향 완화, 적대적 예제

## 목표 문제

캡스톤의 위험 점검표는 영역마다 확인할 질문만 정리한다. 이 모듈은 그 영역의 원리와 측정 방법을 다룬다. 평균 손실을 최소화한 모델이 소수 집단에서 더 많이 틀리는 이유를 실험으로 확인하고, 인구통계 동등성, 균등화된 오즈, 보정을 계산해 기저율이 다른 집단에서 기준끼리 충돌하는 것을 보인다. 재가중, 공정성 벌점, 집단별 임계값으로 격차를 줄이고 그 대가를 측정하며, 이름을 지운 데이터가 다시 특정되는 원리와 k-익명성, 차등 프라이버시의 보장을 비교한다. 심화 레슨에서는 공정성 불가능성 정리와 라플라스 메커니즘을 증명하고, DP-SGD와 적대적 예제(FGSM)를 구현한다. 확장 모듈이므로 완료 조건은 없으며, 캡스톤 과제의 보충·심화 항목이 이 모듈의 레슨을 바탕으로 한다.

## 학습 목표

- AI 위험의 일곱 영역을 사례와 연결하고, 서브그룹 불균형이 평균 손실 최소화를 거쳐 집단별 성능 격차로 나타나는 과정을 설명한다.
- 인구통계 동등성, 균등화된 오즈, 보정을 계산하고, 기저율이 다를 때 어떤 기준끼리 충돌하는지 보인다.
- 재가중, 공정성 벌점, 집단별 임계값을 적용해 격차와 정확도의 변화를 측정하고, 대리 변수와 법적 제약을 고려해 방법을 고른다.
- 준식별자로 재식별 위험을 재고, k-익명성과 차등 프라이버시가 보장하는 것과 그 대가를 비교한다.
- Chouldechova 항등식과 보정·균형의 충돌, 라플라스 메커니즘의 보장과 멤버십 추론 이득의 상한을 증명한다.
- FGSM과 적대적 학습을 구현하고, 선형성 가설로 고차원 입력의 취약성을 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [AI 위험의 유형: 편향, 적대적 공격, 프라이버시](#lesson-risk-map) | 보충 | 60분 | — |
| 2 | [공정성 기준](#lesson-fairness) | 보충 | 55분 | — |
| 3 | [프라이버시 공학: 재식별, k-익명성, 차등 프라이버시](#lesson-privacy) | 보충 | 35분 | — |
| 4 | [편향 완화: 전처리, 학습 중 벌점, 후처리](#lesson-bias-mitigation) | 보충 | 50분 | — |
| 5 | [공정성 불가능성 정리](#lesson-fairness-impossibility) | 심화 | 35분 | — |
| 6 | [차등 프라이버시의 수학과 DP-SGD](#lesson-privacy-math) | 심화 | 35분 | — |
| 7 | [적대적 예제와 FGSM](#lesson-adversarial-examples) | 심화 | 30분 | — |

## 보충 레슨

<a id="lesson-risk-map"></a>

### 1. AI 위험의 유형: 편향, 적대적 공격, 프라이버시

보충 · 60분 · [본문 원본](../../src/content/modules/responsible-ai/risk-map.ts) · [실습 원본](../../src/content/modules/responsible-ai/labs/risk-map.ts)

**학습 목표:** AI 위험의 일곱 영역과 사례를 연결하고, 서브그룹 불균형이 집단별 성능 격차로 이어지는 원리, 적대적 공격(FGSM)·자동화 편향·학습 데이터 암기가 왜 위험한지 설명할 수 있다.

**쓰이는 곳:** 모델카드와 위험 점검표([7-1 모델카드와 위험 점검](7-1-capstone-project.md#lesson-model-cards))의 점검 항목은 실제로 보고된 사고에서 나왔다. 위험의 영역별 대표 사례와 원인을 알아야 자신의 프로젝트에서 어떤 위험을 어떤 방법으로 점검할지 판단할 수 있다.

**본문 절:** AI 위험의 일곱 영역 · 적대적 공격 · 서브그룹 불균형과 집단별 성능 격차 · 자동화 편향 · 학습 데이터 암기

**구성:** 확인 문제 7 · 서술형 4 · 실습 2 · 코드 셀 2 · 그림 3 · 이미지 1

**실습**

- `ex1` FGSM으로 숫자 분류기의 오분류 유도와 같은 크기의 무작위 잡음 비교
- `ex2` 집단별 정확도로 평균이 숨긴 격차를 찾고, 재가중으로 줄이기

**서술형**

- `d1` "최종 결정은 사람이 한다"는 절차가 있어도 사람의 검토가 형식적이 되는 자동화 편향(automation bias)의 예를 들고, 이를 줄이는 설계를 쓰라.
- `d2` 학습 데이터 암기(memorization)가 왜 프라이버시 문제인지 쓰고, 완화책을 두 가지 이상 쓰라.
- `d3` Gender Shades 연구에서 얼굴 성별 분류의 오류율이 어두운 피부 여성에서 높게 나온 원인을 학습 목표(평균 손실)와 데이터 구성으로 설명하라.
- `d4` 아마존 채용 AI 사례에서 편향이 생긴 구조적 원인은 무엇이었으며, 이를 막기 위한 완화책으로는 어떤 것이 있는지 쓰라.

**참고 자료**

- [Buolamwini & Gebru (2018) — Gender Shades](https://proceedings.mlr.press/v81/buolamwini18a.html) — 상용 얼굴 분석 시스템의 교차 집단별 오류율 비교 (영문)
- [Goodfellow et al. (2014) — Explaining and Harnessing Adversarial Examples](https://arxiv.org/abs/1412.6572) — FGSM과 판다·긴팔원숭이 예시의 원 논문 (영문)
- [Carlini et al. (2021) — Extracting Training Data from Large Language Models](https://arxiv.org/abs/2012.07805) — 학습 데이터 암기와 추출이 실제로 가능함을 보인 연구 (영문)

<a id="lesson-fairness"></a>

### 2. 공정성 기준

보충 · 55분 · [본문 원본](../../src/content/modules/responsible-ai/fairness.ts) · [실습 원본](../../src/content/modules/responsible-ai/labs/fairness.ts)

**학습 목표:** 인구통계 동등성·균등화된 오즈·보정을 수식과 채용 예시로 구분하고, 기저율이 다를 때 어떤 기준끼리 충돌하는지(보정·PPV ↔ 오류율, 선택률 ↔ 오류율)를 TP·FP 계산과 임계값 실험으로 보이며, 정답 레이블 자체의 편향이라는 한계를 말할 수 있다.

**쓰이는 곳:** 채용, 대출, 의료처럼 사람에 대한 결정에 쓰는 모델은 집단별로 성능과 판정을 점검해야 한다. 공정성 기준마다 비교하는 값이 다르고 기저율이 다르면 기준끼리 충돌하므로, 어떤 기준을 택했는지와 그 대가를 밝혀야 점검 결과를 해석할 수 있다.

**본문 절:** 세 가지 공정성 기준 · 기저율이 다를 때의 충돌 · 코드로 지표 계산하기 · 지표가 보지 못하는 것

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 4 · 실습 1 · 코드 셀 2 · 그림 4

**실습**

- `ex1` 선택률·TPR·FPR·PPV로 세 공정성 기준 점검하기

**서술형**

- `d1` 인구통계 동등성과 균등화된 오즈가 함께 성립하지 않는 조건은 무엇이며, 왜 이것이 수학적으로 피할 수 없는지 설명하라.
- `d2` 인구통계 동등성, 균등화된 오즈, 보정을 채용 AI에 대입해 각각 한 문장으로 구분하라. 판정 결과(선택률), 모델의 오류 패턴(TPR·FPR), 점수의 의미(확률 해석) 중 각 기준이 비교하는 것은 무엇인가?
- `d3` 두 집단의 기저율이 다를 때, 인구통계 동등성을 만족하도록 임계값을 조정하면 왜 균등화된 오즈(특히 FPR)가 깨지는지 본문의 숫자 예제(TP·FP)로 계산하며 설명하라.
- `d4` 보정된 점수 모델을 기저율이 다른 두 집단에 쓸 때, 대출 심사와 암 선별 검사에서 각각 어떤 임계값 정책(같은 임계값, 선택률 맞춤, TPR 맞춤)을 택할지 쓰고, 각 정책에서 누가 피해를 입는지를 근거로 설명하라.

**참고 자료**

- [Google PAIR — Attacking discrimination with smarter machine learning](https://research.google.com/bigpicture/attacking-discrimination-in-ml/) — 임계값을 직접 움직이며 공정성 기준 사이의 충돌을 확인하는 대화형 자료 (영문)
- [Barocas, Hardt & Narayanan — Fairness and Machine Learning](https://fairmlbook.org/) — 무료 교과서. 3장 Classification이 이 레슨의 세 기준을 다룬다 (영문)
- [Kleinberg et al. (2016) — Inherent Trade-Offs in the Fair Determination of Risk Scores](https://arxiv.org/abs/1609.05807) — 보정과 오류율 균형의 불가능성 정리 (영문)

<a id="lesson-privacy"></a>

### 3. 프라이버시 공학: 재식별, k-익명성, 차등 프라이버시

보충 · 35분 · [본문 원본](../../src/content/modules/responsible-ai/privacy.ts) · [실습 원본](../../src/content/modules/responsible-ai/labs/privacy.ts)

**학습 목표:** 준식별자로 재식별 위험을 재고 k-익명성의 한계를 설명하며, 무작위 응답으로 민감한 비율을 추정하고, 차등 프라이버시의 정의와 라플라스 메커니즘의 오차·예산을 설명할 수 있다.

**쓰이는 곳:** 학습 데이터나 통계를 공개하는 서비스는 이름을 지운 뒤에도 개인이 다시 특정되지 않는지 확인해야 한다. 재식별이 일어나는 원리와 k-익명성, 차등 프라이버시가 보장하는 것의 차이를 알아야 데이터를 공개하거나 학습에 쓸 때 어떤 보호 방법을 적용할지 정할 수 있다.

**본문 절:** 이름을 지워도 사람은 특정된다 · k-익명성: 같은 조합을 적어도 k명이 공유하게 · 무작위 응답: 개인은 부정할 수 있고, 집단은 추정할 수 있게 · 차등 프라이버시: 한 사람이 빠져도 결과가 거의 같게 · 코드로 확인하기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 4

**실습**

- `ex1` k-익명성 재기, 무작위 응답으로 비율 추정하기, 라플라스 잡음 더하기

**서술형**

- `d1` 이름을 지운 데이터가 여전히 개인을 특정할 수 있는 이유를 준식별자로 설명하고, k-익명성과 차등 프라이버시가 각각 무엇을 보장하며 어떤 한계가 있는지 비교하라.

**참고 자료**

- [Sweeney (2000) — Simple Demographics Often Identify People Uniquely](https://dataprivacylab.org/projects/identifiability/paper1.pdf) — 우편번호·성별·생년월일로 미국인 약 87%가 특정된다는 추정 (영문)
- [Dwork & Roth (2014) — The Algorithmic Foundations of Differential Privacy](https://www.cis.upenn.edu/~aaroth/privacybook.html) — 차등 프라이버시의 정의, 라플라스 메커니즘, 합성을 다루는 표준 교재. 1~3장 (영문)
- [OpenDP 문서](https://docs.opendp.org/) — 차등 프라이버시 라이브러리로 통계를 내는 방법을 다룬 문서 (영문)

<a id="lesson-bias-mitigation"></a>

### 4. 편향 완화: 전처리, 학습 중 벌점, 후처리

보충 · 50분 · [본문 원본](../../src/content/modules/responsible-ai/bias-mitigation.ts) · [실습 원본](../../src/content/modules/responsible-ai/labs/bias-mitigation.ts)

**학습 목표:** 대리 변수 때문에 보호 속성을 빼는 것만으로는 편향이 사라지지 않음을 보이고, 재가중(전처리)·공정성 벌점(학습 중)·집단별 임계값(후처리)을 적용해 격차와 정확도의 트레이드오프, 법적 제약, 편향된 라벨로 잰 정확도의 의미를 설명할 수 있다.

**쓰이는 곳:** 집단별 성능 격차를 발견한 뒤에는 격차를 줄일 방법을 골라야 한다. 완화 방법마다 개입하는 시점, 필요한 정보, 법적 제약, 정확도의 대가가 다르므로, 각 방법을 적용했을 때 무엇이 바뀌는지 수치로 확인해야 상황에 맞는 방법을 고를 수 있다.

**본문 절:** 보호 속성을 빼는 것만으로는 부족하다 · 전처리: 데이터를 고친다 · 학습 중: 손실에 공정성 벌점을 더한다 · 후처리: 집단별 임계값 · "정확도가 떨어졌다"는 것의 의미

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 2 · 실습 2 · 코드 셀 3 · 그림 3

**실습**

- `ex1` 재가중으로 집단과 정답의 연관 끊기, 대리 변수 찾기
- `ex2` 보정된 점수에서 세 가지 임계값 정책 비교하기

**서술형**

- `d1` 보호 속성을 입력에서 빼는 것만으로 편향이 사라지지 않는 이유를 대리 변수로 설명하고, 전처리·학습 중·후처리 완화 방법을 하나씩 들어 각각의 대가를 쓰라.
- `d2` 과거 채용 기록으로 학습한 모델의 성별 선택률 격차를 줄여야 한다. 전처리·학습 중·후처리 방법을 하나씩 들어 비교하고, "정확도가 떨어졌다"는 반론에 어떻게 답할지 쓰라.

**참고 자료**

- [Kamiran & Calders (2012) — Data preprocessing techniques for classification without discrimination](https://link.springer.com/article/10.1007/s10115-011-0463-8) — 재가중, 재표집 같은 전처리 완화의 원 논문 (영문)
- [Hardt, Price & Srebro (2016) — Equality of Opportunity in Supervised Learning](https://arxiv.org/abs/1610.02413) — 후처리 임계값으로 균등화된 오즈와 기회의 균등을 맞추는 방법 (영문)
- [Fairlearn 사용자 가이드](https://fairlearn.org/main/user_guide/index.html) — 공정성 측정과 완화 기법(제약 학습, 임계값 최적화)을 구현한 라이브러리 (영문)

## 심화 레슨

<a id="lesson-fairness-impossibility"></a>

### 5. 공정성 불가능성 정리

심화 · 35분 · [본문 원본](../../src/content/modules/responsible-ai/fairness-impossibility.ts) · [실습 원본](../../src/content/modules/responsible-ai/labs/fairness-impossibility.ts)

**학습 목표:** Chouldechova 항등식으로 PPV·FNR을 맞추면 기저율이 다른 집단의 FPR이 달라짐을, 보정 아래의 등식 $p(1-x) = (1-p)z$로 보정과 균형이 완벽한 예측에서만 함께 성립함을 증명하고, 무작위 혼합으로 균등화된 오즈를 맞추는 확률과 그 정확도 비용을 계산할 수 있다.

**쓰이는 곳:** 공정성 기준의 충돌이 특정 예제의 우연인지 항상 일어나는 일인지에 따라, 모델을 개선해 해결할 문제인지 기준을 선택해야 하는 문제인지가 달라진다. 충돌을 증명하고 균등화된 오즈를 맞추는 비용을 계산할 수 있어야 어떤 기준을 택할지와 그 대가를 근거와 함께 설명할 수 있다.

**본문 절:** 항등식 하나로 보는 판정 수준의 충돌 (Chouldechova, 2017) · 점수 수준의 충돌: 보정과 균형 (Kleinberg et al., 2016) · 그래도 균등화된 오즈를 맞춰야 한다면: 무작위 혼합 (Hardt et al., 2016) · 코드로 확인하기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` Chouldechova 항등식, 보정이 강제하는 균형, 균등화된 오즈를 맞추는 무작위 혼합

**서술형**

- `d1` Chouldechova 항등식 $\text{FPR} = \frac{p}{1-p}\cdot\frac{1-\text{PPV}}{\text{PPV}}\cdot(1-\text{FNR})$을 유도하고, 기저율이 다른 두 집단에서 PPV와 FNR을 같게 맞추면 무엇이 반드시 달라지는지 설명하라.

**참고 자료**

- [Chouldechova (2017) — Fair prediction with disparate impact](https://arxiv.org/abs/1703.00056) — PPV, FPR, FNR 사이의 항등식과 재범 예측 사례 (영문)
- [Kleinberg, Mullainathan & Raghavan (2016) — Inherent Trade-Offs in the Fair Determination of Risk Scores](https://arxiv.org/abs/1609.05807) — 보정과 양성·음성 균형이 함께 성립하는 조건의 증명 (영문)
- [Hardt, Price & Srebro (2016) — Equality of Opportunity in Supervised Learning](https://arxiv.org/abs/1610.02413) — ROC 위의 무작위 혼합으로 균등화된 오즈를 맞추는 후처리 (영문)

<a id="lesson-privacy-math"></a>

### 6. 차등 프라이버시의 수학과 DP-SGD

심화 · 35분 · [본문 원본](../../src/content/modules/responsible-ai/privacy-math.ts) · [실습 원본](../../src/content/modules/responsible-ai/labs/privacy-math.ts)

**학습 목표:** 삼각부등식으로 라플라스 메커니즘의 $\varepsilon$ 보장을 증명하고, 후처리 불변성과 합성을 설명하며, 가설 검정 관점에서 멤버십 추론 이득의 상한 $(e^\varepsilon - 1)/(e^\varepsilon + 1)$을 유도하고, DP-SGD의 표본별 자르기·잡음이 보장과 비용(큰 배치, 소수 집단)에 미치는 영향을 설명할 수 있다.

**쓰이는 곳:** 차등 프라이버시로 학습했다는 주장은 $\varepsilon$ 값을 함께 보고 그 의미를 해석할 수 있어야 검토할 수 있다. 라플라스 메커니즘의 증명, $\varepsilon$이 멤버십 추론 공격에 주는 상한, DP-SGD의 절차와 대가를 알아야 프라이버시와 정확도 사이에서 학습 설정을 정할 수 있다.

**본문 절:** 라플라스 메커니즘의 증명 · $\varepsilon$은 공격자에게 무엇을 뜻하는가: 가설 검정으로 보기 · 과적합이 곧 유출이다 · DP-SGD: 자르고, 잡음을 더하고, 기록한다 · 코드로 확인하기

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 코드 셀 1 · 그림 3

**실습**

- `ex1` 멤버십 추론 공격의 이득, ε이 허용하는 상한, DP-SGD의 표본별 자르기

**서술형**

- `d1` $\varepsilon$-차등 프라이버시가 멤버십 추론 공격의 이득(TPR − FPR)을 얼마로 제한하는지 유도하고, $\varepsilon = 1$과 $\varepsilon = 8$에서 그 의미를 비교하라. DP-SGD는 어떤 두 장치로 이 보장을 얻는가?

**참고 자료**

- [Abadi et al. (2016) — Deep Learning with Differential Privacy](https://arxiv.org/abs/1607.00133) — DP-SGD와 모멘트 회계 (영문)
- [Shokri et al. (2017) — Membership Inference Attacks against Machine Learning Models](https://arxiv.org/abs/1610.05820) — 멤버십 추론 공격의 원 논문 (영문)
- [Yeom et al. (2018) — Privacy Risk in Machine Learning: Analyzing the Connection to Overfitting](https://arxiv.org/abs/1709.01604) — 과적합과 멤버십 추론, 차등 프라이버시 상한의 관계 (영문)
- [Bagdasaryan et al. (2019) — Differential Privacy Has Disparate Impact on Model Accuracy](https://arxiv.org/abs/1905.12101) — DP 학습이 소수 집단의 정확도를 더 떨어뜨리는 현상 (영문)

<a id="lesson-adversarial-examples"></a>

### 7. 적대적 예제와 FGSM

심화 · 30분 · [본문 원본](../../src/content/modules/responsible-ai/adversarial-examples.ts) · [실습 원본](../../src/content/modules/responsible-ai/labs/adversarial-examples.ts)

**학습 목표:** 선형성 가설로 고차원에서 적대적 예제가 생기는 이유를 $\varepsilon\lVert w\rVert_1$로 설명하고, FGSM을 구현해 무작위 노이즈와 비교하며, PGD·적대적 학습의 역할을 설명할 수 있다.

**쓰이는 곳:** 테스트 정확도가 높은 모델도 손실을 키우는 방향으로 조작한 입력에는 쉽게 틀릴 수 있다. 자율주행, 의료, 보안처럼 입력을 조작하려는 사람이 있는 환경에 모델을 배포하려면, 이 취약성이 생기는 이유와 공격을 기준으로 강건성을 평가하는 방법을 알아야 한다.

**본문 절:** 선형성 가설 · FGSM: 기울기 부호 한 번 · 왜 중요한가

**구성:** 확인 문제 5 · 서술형 2 · 실습 1 · 코드 셀 1 · 그림 1 · 이미지 1

**실습**

- `ex1` softmax 회귀를 FGSM으로 공격하기

**서술형**

- `d1` 선형성 가설로 적대적 예제가 고차원에서 생기는 이유를 설명하라. FGSM의 식을 쓰고, 같은 크기의 무작위 노이즈보다 FGSM 노이즈가 훨씬 해로운 이유와 대표적인 방어법을 쓰라.
- `d2` 어떤 팀이 "우리 이미지 분류기는 테스트 정확도 98%이고, 가우시안 노이즈를 섞어도 95%를 유지하니 강건하다"고 주장한다. 적대적 예제의 관점에서 이 주장의 허점을 설명하고, 강건성을 제대로 평가하고 높이는 방법을 제안하라.

**참고 자료**

- [Goodfellow, Shlens & Szegedy (2015) — Explaining and Harnessing Adversarial Examples](https://arxiv.org/abs/1412.6572) — 선형성 가설과 FGSM (영문)
- [Madry et al. (2018) — Towards Deep Learning Models Resistant to Adversarial Attacks](https://arxiv.org/abs/1706.06083) — PGD와 적대적 학습 (영문)

## 백지 복습

1. 평균 손실을 최소화한 모델이 소수 집단에서 더 많이 틀리는 이유를 쓰고, FGSM이 같은 크기의 무작위 잡음보다 예측을 훨씬 크게 바꾸는 이유를 쓰라.
2. 인구통계 동등성, 균등화된 오즈, 보정을 정의하고, 기저율이 50%와 20%인 두 집단에서 TPR 80%, FPR 20%를 맞추면 선택률과 PPV가 각각 얼마인지 계산하라.
3. 보호 속성을 입력에서 빼는 것만으로 편향이 사라지지 않는 이유를 쓰고, 재가중, 공정성 벌점, 집단별 임계값의 대가를 하나씩 쓰라.
4. 이름을 지운 데이터가 다시 특정되는 이유를 준식별자로 쓰고, k-익명성과 $\varepsilon$-차등 프라이버시가 각각 무엇을 보장하는지 쓰라.
