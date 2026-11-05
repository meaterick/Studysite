<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->
# X-2 비전과 생성 모델

[전체 목차](README.md) · 트랙 X 확장 · [모듈 원본](../../src/content/modules/vision-generative/index.ts)

생성 모델, 탐지·분할 평가, 멀티모달 모델

## 목표 문제

분류 모델은 입력이 주어졌을 때 정답을 고르지만, 이미지를 만들거나 위치를 찾거나 이미지와 문장을 함께 다루려면 다른 종류의 모델과 평가 지표가 필요하다. 이 모듈은 오토인코더, VAE, GAN, 확산 모델이 새 데이터를 만드는 원리를 비교하고, 확산 모델의 순방향 과정과 노이즈 예측을 구현한다. 객체 탐지와 분할의 결과를 IoU, NMS, AP, Dice로 계산하고, CLIP의 대조 학습으로 이미지와 문장을 같은 공간에 정렬해 zero-shot 분류를 하며, VLM이 이미지를 LLM에 넣는 구조를 다룬다. 심화 레슨에서는 ELBO와 재매개변수화 트릭, 확산 모델의 손실을 유도한다. 확장 모듈이므로 완료 조건은 없다.

## 학습 목표

- 오토인코더, VAE, GAN, 확산 모델이 새 데이터를 만드는 원리와 품질, 다양성, 생성 속도, 학습 안정성의 차이를 설명한다.
- 확산 모델의 순방향 과정을 닫힌 형태로 구현하고, 노이즈 예측으로 원본을 되찾는 계산을 한다.
- 상자와 마스크의 IoU와 Dice를 계산하고, NMS로 중복 상자를 정리하며, 점수순 탐지 결과로 AP를 구한다.
- CLIP의 대조 학습을 유사도 행렬로 설명하고, 문장 템플릿과 프롬프트 앙상블로 zero-shot 분류를 구현한다.
- 옌센 부등식으로 ELBO를 유도하고, 재매개변수화 트릭이 필요한 이유와 확산 모델의 노이즈 예측 손실을 설명한다.

## 레슨

| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |
| ---: | --- | --- | ---: | --- |
| 1 | [생성 모델: 오토인코더, VAE, GAN, 확산 모델](#lesson-generative-models) | 보충 | 55분 | — |
| 2 | [탐지·분할의 평가: IoU, NMS, AP, Dice](#lesson-detection-segmentation) | 보충 | 30분 | — |
| 3 | [멀티모달 모델: CLIP과 VLM](#lesson-multimodal) | 보충 | 50분 | — |
| 4 | [생성 모델의 수학: ELBO, 재매개변수화, 확산](#lesson-generative-math) | 심화 | 30분 | — |

## 보충 레슨

<a id="lesson-generative-models"></a>

### 1. 생성 모델: 오토인코더, VAE, GAN, 확산 모델

보충 · 55분 · [본문 원본](../../src/content/modules/vision-generative/generative-models.ts) · [실습 원본](../../src/content/modules/vision-generative/labs/generative-models.ts)

**학습 목표:** 판별 모델과 생성 모델의 차이를 설명하고, Autoencoder·VAE·GAN·Diffusion이 각각 "생성"을 가능하게 하는 메커니즘을 정확한 용어로 설명할 수 있다.

**쓰이는 곳:** 이미지 생성 서비스, 데이터 증강, 이상 탐지, 이미지 복원은 데이터의 분포를 학습한 생성 모델로 만든다. 오토인코더, VAE, GAN, 확산 모델이 각각 어떤 원리로 새 데이터를 만드는지 알아야 품질, 다양성, 생성 속도, 학습 안정성을 기준으로 용도에 맞는 모델을 고를 수 있다.

**본문 절:** Autoencoder · Variational Autoencoder (VAE) · GAN (생성적 적대 신경망) · Diffusion Model · Text-to-Image / Image-to-Image: 조건 없는 생성에서 조건부 생성으로

**구성:** 확인 문제 6 · 서술형 5 · 실습 1 · 그림 2 · 이미지 3

**실습**

- `ex1` 순확산 과정과 잡음 예측으로 원본 되찾기

**서술형**

- `d1` 일반 Autoencoder와 Variational Autoencoder(VAE)는 인코더가 입력을 잠재공간의 무엇으로 매핑하는지에서 갈린다. 그 차이를 설명하고, 이 차이가 왜 VAE에서는 새 데이터 생성을 가능하게 하는지 설명하라.
- `d2` GAN의 minimax 목적함수 $\min_{G}\max_{D}\;\mathbb{E}_{x\sim p_{data}}[\log D(x)] + \mathbb{E}_{z\sim p_z}[\log(1-D(G(z)))]$에서 Discriminator와 Generator는 각각 이 값을 최대화·최소화하기 위해 무엇을 하는가?
- `d3` Diffusion Model의 Forward Diffusion과 Reverse Diffusion을 각각 정의하고, Reverse Diffusion에서 신경망이 실제로 예측하도록 학습되는 대상(Noise Prediction)이 무엇인지 설명하라.
- `d4` U-Net의 스킵 연결이 [5-2 드롭아웃과 잔차 연결](5-2-deep-training.md#lesson-dropout-residual)의 잔차 연결과 어떤 점에서 같은 역할을 하는지 설명하고, Latent Diffusion이 픽셀 공간 대신 잠재공간에서 확산을 수행해 무엇을 얻는지 설명하라.
- `d5` PCA(선형 오토인코더)로 2차원까지 줄인 잠재공간에서 아무 점이나 골라 복원하면 그럴듯한 숫자가 잘 나오지 않는 이유와, VAE의 KL 항이 이 문제를 어떻게 완화하는지 설명하라.

**참고 자료**

- [Lilian Weng — What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/) — Forward·Reverse 과정과 노이즈 예측 목적함수의 해설 (영문)
- [Goodfellow et al. (2014) — Generative Adversarial Networks](https://arxiv.org/abs/1406.2661) — GAN 원 논문. 1~3절에 minimax 구조가 정리되어 있다 (영문)

<a id="lesson-detection-segmentation"></a>

### 2. 탐지·분할의 평가: IoU, NMS, AP, Dice

보충 · 30분 · [본문 원본](../../src/content/modules/vision-generative/detection-segmentation.ts) · [실습 원본](../../src/content/modules/vision-generative/labs/detection-segmentation.ts)

**학습 목표:** 상자와 마스크의 IoU·Dice를 계산하고, NMS로 중복 상자를 정리하며, 점수순 탐지 결과로 Precision·Recall과 AP를 구할 수 있다.

**쓰이는 곳:** 탐지와 분할 모델의 논문과 벤치마크는 결과를 IoU, AP, mAP, Dice로 보고한다. 이 지표가 무엇을 재는지 알아야 결과표를 해석하고 모델을 비교할 수 있으며, 탐지 모델을 직접 쓸 때는 NMS 임계값을 데이터에 맞게 정해야 한다.

**본문 절:** IoU: 두 상자가 얼마나 겹치는가 · NMS: 같은 물체를 가리키는 상자 정리 · AP와 mAP: 탐지기 전체의 성적 · 분할의 평가: 픽셀 IoU와 Dice

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 1 · 실습 1 · 그림 4

**실습**

- `ex1` IoU·NMS·Dice·AP 구현

**서술형**

- `d1` 상자 $(0,0,4,4)$와 $(2,2,6,6)$의 IoU를 계산하라. 탐지 결과에 NMS가 필요한 이유와 임계값이 너무 낮거나 높을 때의 문제, 분할 평가에서 픽셀 정확도 대신 Dice나 IoU를 쓰는 이유를 설명하라.

**참고 자료**

- [COCO — Detection Evaluation](https://cocodataset.org/#detection-eval) — mAP@[.5:.95] 등 표준 탐지 지표의 정의 (영문)
- [Dive into Deep Learning — 14.3 Anchor Boxes, 14.9 Semantic Segmentation](https://d2l.ai/) — IoU, NMS, 분할을 코드로 구현한 무료 교재 (영문)

<a id="lesson-multimodal"></a>

### 3. 멀티모달 모델: CLIP과 VLM

보충 · 50분 · [본문 원본](../../src/content/modules/vision-generative/multimodal.ts) · [실습 원본](../../src/content/modules/vision-generative/labs/multimodal.ts)

**학습 목표:** Joint Embedding이 필요한 이유와 CLIP의 대조 학습($N \times N$ 유사도 행렬의 대각선은 올리고 나머지는 내림)을 설명하고, 문장 템플릿과 프롬프트 앙상블로 zero-shot 분류를 하며, VLM이 비전 인코더를 LLM에 잇는 구조와 Image Captioning·VQA·Multimodal LLM을 구분할 수 있다.

**쓰이는 곳:** 이미지 검색, 이미지 질의응답, 스크린샷을 읽는 LLM 도우미는 이미지와 텍스트를 같은 공간에서 비교하거나 함께 입력받는 멀티모달 모델로 만든다. CLIP의 대조 학습과 VLM의 구조를 알아야 zero-shot 분류의 문장을 설계하고, 이미지 입력이 늘리는 토큰 비용과 보안 위험을 판단할 수 있다.

**본문 절:** zero-shot 분류: 클래스 이름을 문장으로 바꿔 검색하기 · 이미지를 보고 말하는 모델: VLM과 Multimodal LLM

**구성:** 확인 문제 6 · 출력 예측 1 · 서술형 4 · 실습 1 · 코드 셀 1 · 그림 2 · 이미지 1

**실습**

- `ex1` 공동 임베딩으로 zero-shot 분류하고 프롬프트 앙상블 효과 재기

**서술형**

- `d1` CLIP의 대조 학습(Contrastive Learning) 목표를 배치 안 이미지 $N$장·캡션 $N$개가 만드는 $N \times N$ 유사도 행렬 관점에서 설명하라.
- `d2` Joint Embedding은 왜 필요한가? Vision Encoder와 Text Encoder를 각각 독립적으로만 학습시키면 어떤 문제가 생기는가?
- `d3` Image Captioning과 VQA(Visual Question Answering)의 차이를 쓰라.
- `d4` Multimodal LLM이 CLIP과 어떻게 다른지 판별 능력과 생성 능력의 관점에서 설명하고, 이미지를 LLM에 넣는 대표적인 구조를 쓰라.

**참고 자료**

- [Radford et al. (2021) — Learning Transferable Visual Models From Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020) — 그림 1에 대조 학습과 zero-shot 분류가 정리되어 있다 (영문)
- [OpenAI — CLIP: Connecting text and images](https://openai.com/index/clip/) — CLIP 소개 글 (영문)

## 심화 레슨

<a id="lesson-generative-math"></a>

### 4. 생성 모델의 수학: ELBO, 재매개변수화, 확산

심화 · 30분 · [본문 원본](../../src/content/modules/vision-generative/generative-math.ts) · [실습 원본](../../src/content/modules/vision-generative/labs/generative-math.ts)

**학습 목표:** 옌센 부등식으로 ELBO를 유도하고 가우시안 KL의 닫힌 형태를 쓰며, 재매개변수화 트릭의 필요성과 확산 모델의 순방향 닫힌 형태·노이즈 예측 손실을 설명할 수 있다.

**쓰이는 곳:** VAE와 확산 모델의 손실 함수는 직접 계산할 수 없는 로그가능도의 하한에서 나온다. 손실의 각 항이 어디서 나오는지 알아야 KL 항의 가중치나 노이즈 일정 같은 설정을 바꿀 때 결과를 예측하고, 생성 모델 논문의 수식을 읽을 수 있다.

**본문 절:** ELBO: 로그가능도의 하한 · 재매개변수화 트릭 · 확산 모델의 학습 목표

**구성:** 확인 문제 5 · 출력 예측 1 · 서술형 1 · 실습 1 · 그림 4

**실습**

- `ex1` 가우시안 KL·재매개변수화·확산의 닫힌 형태

**서술형**

- `d1` 옌센 부등식으로 VAE의 ELBO를 유도하고 두 항의 의미를 설명하라. 재매개변수화 트릭이 필요한 이유와, 확산 모델의 학습 손실이 '노이즈 예측 MSE'로 단순해지는 데 쓰이는 순방향 과정의 닫힌 형태를 쓰라.

**참고 자료**

- [Kingma & Welling (2013) — Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) — ELBO와 재매개변수화 트릭 (영문)
- [Ho et al. (2020) — Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) — 노이즈 예측 손실의 유도 (영문)
- [Lilian Weng — What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/) — 확산 모델 수식을 단계별로 정리한 해설 (영문)

## 백지 복습

1. 오토인코더와 VAE가 입력을 잠재공간의 무엇으로 매핑하는지 쓰고, VAE에서 새 데이터를 생성할 수 있는 이유를 KL 항으로 설명하라.
2. GAN의 생성자와 판별자가 각각 무엇을 학습하는지 쓰고, 확산 모델의 순방향·역방향 과정과 신경망이 예측하는 대상을 쓰라.
3. 상자 $(0, 0, 4, 4)$와 $(2, 2, 6, 6)$의 IoU를 계산하고, NMS의 절차와 분할에서 픽셀 정확도 대신 Dice를 쓰는 이유를 쓰라.
4. CLIP의 대조 학습을 $N \times N$ 유사도 행렬로 설명하고, zero-shot 분류에서 프롬프트 앙상블이 정확도를 높이는 이유를 쓰라.
