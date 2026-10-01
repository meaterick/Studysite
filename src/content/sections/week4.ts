import type { SectionMeta } from "../types";

// Week 4 단계별 목표·확인 문제(객관식)·서술형 배정·외부 자료.
// 키는 conceptsMd의 `## 제목 {#id}`와 같아야 한다 (npm run validate:content가 검사).
// 확인 문제의 answer는 0부터 시작하는 선택지 번호다.

const sections: Record<string, SectionMeta> = {
  "convolution": {
    "tier": "core",
    "goal": "합성곱의 계산 과정과 출력 크기 공식 $\\lfloor (N + 2P - K)/S \\rfloor + 1$을 적용하고, 지역성·파라미터 공유가 FC층 대비 파라미터를 얼마나 줄이는지 계산할 수 있다.",
    "checks": [
      {
        "id": "w4-convolution-c1",
        "question": "입력 $28\\times28$, 커널 $5\\times5$, padding 0, stride 1인 합성곱의 출력 크기는?",
        "choices": [
          "$28\\times28$",
          "$24\\times24$",
          "$23\\times23$",
          "$12\\times12$"
        ],
        "answer": 1,
        "explanation": "$\\lfloor(28 + 0 - 5)/1\\rfloor + 1 = 24$."
      },
      {
        "id": "w4-convolution-c2",
        "question": "입력 채널 3, $3\\times3$ 커널 16개(출력 채널 16)인 합성곱층의 파라미터 수(편향 포함)는?",
        "choices": [
          "$144$",
          "$448$",
          "$432$",
          "$9$"
        ],
        "answer": 1,
        "explanation": "$3\\times3\\times3\\times16 = 432$개의 가중치 + 편향 16개 $= 448$개. 입력 이미지 크기와 무관하다는 점이 핵심이다."
      },
      {
        "id": "w4-convolution-c3",
        "question": "합성곱의 \"파라미터 공유\"가 의미하는 것은?",
        "choices": [
          "모든 층이 같은 커널을 쓴다",
          "같은 커널 가중치를 이미지의 모든 위치에서 재사용한다",
          "모든 채널이 같은 값을 가진다",
          "학습 중 가중치가 바뀌지 않는다"
        ],
        "answer": 1,
        "explanation": "어디서나 같은 패턴 검출기를 쓰므로 위치가 바뀌어도 같은 패턴을 찾을 수 있고(평행이동 등변성), 파라미터 수가 크게 줄어든다."
      }
    ],
    "quizIds": [
      "w4-q1",
      "w4-q2"
    ],
    "references": [
      {
        "title": "CS231n — Convolutional Neural Networks",
        "url": "https://cs231n.github.io/convolutional-networks/",
        "note": "합성곱·padding·stride·파라미터 수를 그림과 예제로 (영문)"
      },
      {
        "title": "CNN Explainer (Georgia Tech)",
        "url": "https://poloclub.github.io/cnn-explainer/",
        "note": "실제 CNN의 각 층 출력을 브라우저에서 클릭하며 보는 인터랙티브 시각화"
      }
    ]
  },
  "pooling-receptive-field": {
    "tier": "core",
    "goal": "Max·Average 풀링의 차이와 strided convolution과의 관계를 설명하고, 점프 $j$를 이용해 여러 층의 수용영역을 계산할 수 있다.",
    "checks": [
      {
        "id": "w4-pooling-receptive-field-c1",
        "question": "$2\\times2$ 영역 $[[5, 1], [2, 0]]$에 Max Pooling과 Average Pooling을 적용한 결과는?",
        "choices": [
          "Max 5, Average 2",
          "Max 5, Average 8",
          "Max 2, Average 5",
          "Max 1, Average 2"
        ],
        "answer": 0,
        "explanation": "Max는 가장 큰 값 5, Average는 $(5+1+2+0)/4 = 2$."
      },
      {
        "id": "w4-pooling-receptive-field-c2",
        "question": "$3\\times3$ conv(stride 1) → $2\\times2$ pool(stride 2) → $3\\times3$ conv(stride 1)를 거친 뒤의 수용영역은?",
        "choices": [
          "$7$",
          "$8$",
          "$6$",
          "$9$"
        ],
        "answer": 1,
        "explanation": "conv: $r = 3$, $j = 1$ → pool: $r = 3 + 1\\cdot1 = 4$, $j = 2$ → conv: $r = 4 + 2\\cdot2 = 8$."
      },
      {
        "id": "w4-pooling-receptive-field-c3",
        "question": "Max Pooling 대신 stride 2 합성곱을 쓰는 방식의 차이로 옳은 것은?",
        "choices": [
          "stride 2 합성곱은 크기를 줄이지 않는다",
          "stride 2 합성곱은 무엇을 남기고 버릴지를 학습한다",
          "Max Pooling이 파라미터가 더 많다",
          "두 방법은 완전히 같다"
        ],
        "answer": 1,
        "explanation": "풀링은 고정된 규칙으로 정보를 버리고, strided convolution은 그 선택까지 가중치로 학습한다. 대신 풀링은 파라미터가 없어 가볍다."
      }
    ],
    "quizIds": [
      "w4-q3",
      "w4-q4",
      "w4-q5"
    ],
    "references": [
      {
        "title": "Distill — Computing Receptive Fields of CNNs",
        "url": "https://distill.pub/2019/computing-receptive-fields/",
        "note": "본문의 점프 공식을 일반화한 수용영역 계산 (심화)"
      },
      {
        "title": "d2l.ai — Pooling",
        "url": "https://d2l.ai/chapter_convolutional-neural-networks/pooling.html",
        "note": "풀링과 다중 채널 처리 (한국어판: ko.d2l.ai)"
      }
    ]
  },
  "resnet": {
    "tier": "core",
    "goal": "degradation 문제가 과적합이 아닌 최적화 문제인 이유를 설명하고, 잔차 연결 $y = F(x) + x$의 기울기 $F'(x) + 1$이 깊은 망의 학습을 돕는 원리를 숫자로 보일 수 있다.",
    "checks": [
      {
        "id": "w4-resnet-c1",
        "question": "56층 plain 네트워크가 20층보다 **훈련** 오차도 높다는 사실이 의미하는 것은?",
        "choices": [
          "과적합이다",
          "데이터가 너무 많다",
          "일반화 실패가 아니라 최적화(학습) 자체가 어려워졌다",
          "테스트셋에 누수가 있다"
        ],
        "answer": 2,
        "explanation": "과적합이라면 훈련 오차는 낮고 검증 오차만 높아야 한다. 훈련 오차까지 높다는 것은 깊은 망이 얕은 망만큼의 해조차 찾지 못한다는 뜻이다."
      },
      {
        "id": "w4-resnet-c2",
        "question": "잔차 블록이 항등함수를 표현하기 쉬운 이유는?",
        "choices": [
          "항등함수를 따로 학습하는 층이 있어서",
          "$F(x) = 0$이 되도록 가중치를 0 근처로 보내기만 하면 $y = x$가 되므로",
          "활성화 함수를 쓰지 않아서",
          "항상 BatchNorm을 쓰기 때문에"
        ],
        "answer": 1,
        "explanation": "여러 비선형 층으로 항등함수를 직접 근사하는 것보다, 잔차 $F$를 0으로 만드는 편이 최적화하기 훨씬 쉽다."
      },
      {
        "id": "w4-resnet-c3",
        "question": "잔차 연결 $y = F(x) + x$에서 $dy/dx$는?",
        "choices": [
          "$F'(x)$",
          "$F'(x) + 1$",
          "$F'(x) \\cdot x$",
          "$1$"
        ],
        "answer": 1,
        "explanation": "shortcut 경로가 항상 1을 더해주므로 $F'$가 작아도 기울기가 1 근처로 전달된다."
      }
    ],
    "quizIds": [
      "w4-q6",
      "w4-q7"
    ],
    "references": [
      {
        "title": "He et al. (2015) — Deep Residual Learning for Image Recognition",
        "url": "https://arxiv.org/abs/1512.03385",
        "note": "1~3절 정독 권장: Figure 1(degradation)과 4.1절의 '기울기 소실이 원인이 아닐 가능성' 논의"
      },
      {
        "title": "d2l.ai — Residual Networks (ResNet)",
        "url": "https://d2l.ai/chapter_convolutional-modern/resnet.html",
        "note": "잔차 블록과 ResNet 구현"
      }
    ]
  },
  "cnn-history-applications": {
    "tier": "core",
    "goal": "LeNet → AlexNet → VGG → ResNet이 각각 무엇을 해결했는지 설명하고, Detection·Segmentation·ViT가 분류와 어떻게 다른 문제를 푸는지 구분할 수 있다.",
    "checks": [
      {
        "id": "w4-cnn-history-applications-c1",
        "question": "AlexNet의 성공 요인으로 본문이 꼽은 세 가지는?",
        "choices": [
          "잔차 연결·BatchNorm·Adam",
          "ReLU·Dropout·GPU 학습",
          "Self-Attention·패치 임베딩·사전학습",
          "$1\\times1$ conv·GAP·데이터 증강"
        ],
        "answer": 1,
        "explanation": "셋 다 AlexNet이 처음 발명한 것은 아니지만, 한데 묶어 \"깊고 큰 CNN이 실제로 학습된다\"는 것을 증명했다."
      },
      {
        "id": "w4-cnn-history-applications-c2",
        "question": "$224\\times224$ 이미지를 $16\\times16$ 패치로 자르면 ViT에 들어가는 패치 토큰은 몇 개인가?",
        "choices": [
          "14",
          "196",
          "256",
          "3136"
        ],
        "answer": 1,
        "explanation": "$224/16 = 14$이므로 $14 \\times 14 = 196$개(분류용 토큰을 더하면 197개)."
      },
      {
        "id": "w4-cnn-history-applications-c3",
        "question": "같은 클래스인 사람 두 명을 서로 다른 개체로 구분해 픽셀 단위로 칠하는 과제는?",
        "choices": [
          "Image Classification",
          "Object Detection",
          "Semantic Segmentation",
          "Instance Segmentation"
        ],
        "answer": 3,
        "explanation": "Semantic Segmentation은 클래스만 칠하므로 두 사람을 구분하지 않는다. 개체까지 구분하는 것이 Instance Segmentation이다."
      }
    ],
    "quizIds": [
      "w4-q11",
      "w4-q12",
      "w4-q13",
      "w4-q14",
      "w4-q15",
      "w4-q16"
    ],
    "references": [
      {
        "title": "d2l.ai — Modern Convolutional Neural Networks",
        "url": "https://d2l.ai/chapter_convolutional-modern/index.html",
        "note": "AlexNet·VGG·NiN·GoogLeNet·ResNet 계보를 코드와 함께"
      },
      {
        "title": "Dosovitskiy et al. (2020) — An Image is Worth 16x16 Words (ViT)",
        "url": "https://arxiv.org/abs/2010.11929",
        "note": "abstract와 Figure 1만 읽어도 패치 임베딩 아이디어가 보인다"
      }
    ]
  },
  "regularization": {
    "tier": "core",
    "goal": "BatchNorm·Dropout·Weight Decay·데이터 증강·Early Stopping의 원리와 train/eval 모드 차이를 설명하고, Colab에서 CIFAR-10 CNN을 학습시킬 수 있다.",
    "checks": [
      {
        "id": "w4-regularization-c1",
        "question": "inverted dropout($p = 0.5$)에 대한 설명으로 옳은 것은?",
        "choices": [
          "평가 때 출력에 0.5를 곱한다",
          "학습 때 살아남은 뉴런을 2배로 키워, 평가 때는 보정 없이 모든 뉴런을 쓴다",
          "평가 때도 뉴런의 절반을 끈다",
          "학습 때 모든 뉴런을 켠다"
        ],
        "answer": 1,
        "explanation": "학습 때 $1/(1-p)$로 미리 보정해 기대값을 맞춰두므로, 평가 때는 아무것도 하지 않아도 된다."
      },
      {
        "id": "w4-regularization-c2",
        "question": "숫자 손글씨 데이터에 \"위아래 뒤집기\" 증강을 쓰면 안 되는 이유는?",
        "choices": [
          "계산이 너무 느려서",
          "6이 9처럼 보이는 등 라벨을 바꿔버릴 수 있어서",
          "이미지 크기가 바뀌어서",
          "평가 데이터에도 적용해야 해서"
        ],
        "answer": 1,
        "explanation": "증강은 라벨이 보존되는 변환만 써야 한다. 무엇이 라벨 보존인지는 데이터의 성질에 따라 다르다."
      },
      {
        "id": "w4-regularization-c3",
        "question": "BatchNorm 모델을 `eval()`로 바꾸지 않고 한 장씩 평가하면 생기는 문제는?",
        "choices": [
          "평가가 더 정확해진다",
          "배치 통계가 불안정해 같은 이미지라도 배치 구성에 따라 예측이 흔들린다",
          "파라미터가 초기화된다",
          "아무 차이 없다"
        ],
        "answer": 1,
        "explanation": "평가 때는 학습 중 모아둔 이동평균(running mean/var)을 써야 한다."
      }
    ],
    "quizIds": [
      "w4-q8",
      "w4-q9"
    ],
    "references": [
      {
        "title": "Srivastava et al. (2014) — Dropout",
        "url": "https://jmlr.org/papers/v15/srivastava14a.html",
        "note": "Dropout 원 논문: 부분망 앙상블 해석"
      },
      {
        "title": "PyTorch — Training a Classifier (CIFAR-10)",
        "url": "https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html",
        "note": "본문 CIFAR-10 코드와 같은 흐름의 공식 튜토리얼"
      }
    ]
  },
  "transfer-diagnostics": {
    "tier": "core",
    "goal": "특징 추출과 파인튜닝을 구분해 전이학습을 적용하고, Karpathy 레시피(초기 손실 $\\ln C$, 배치 하나 과적합, 한 번에 하나만 바꾸기)로 학습 실패를 진단할 수 있다.",
    "checks": [
      {
        "id": "w4-transfer-diagnostics-c1",
        "question": "100클래스 분류 모델의 초기 손실(교차 엔트로피)은 대략 얼마여야 정상인가?",
        "choices": [
          "$\\ln 100 \\approx 4.6$",
          "$0$",
          "$100$",
          "$\\ln 2 \\approx 0.69$"
        ],
        "answer": 0,
        "explanation": "모든 클래스에 $1/100$을 주는 상태의 손실은 $-\\ln(1/100) = \\ln 100 \\approx 4.6$이다."
      },
      {
        "id": "w4-transfer-diagnostics-c2",
        "question": "샘플 10개짜리 배치 하나조차 외우지 못한다면 가장 먼저 의심할 것은?",
        "choices": [
          "데이터가 부족하다",
          "파이프라인 버그(기울기가 안 흐름, 레이블이 어긋남 등)",
          "모델이 너무 크다",
          "테스트셋이 너무 작다"
        ],
        "answer": 1,
        "explanation": "충분한 용량의 모델이라면 작은 배치 하나는 반드시 외울 수 있어야 한다. 못 외우면 버그 신호다."
      },
      {
        "id": "w4-transfer-diagnostics-c3",
        "question": "데이터가 매우 적을 때 가장 안전한 전이학습 방식은?",
        "choices": [
          "모든 층을 무작위 초기화해 처음부터 학습",
          "사전학습 층을 얼리고 마지막 분류층만 학습(특징 추출)",
          "큰 학습률로 전체 파인튜닝",
          "사전학습 가중치를 버리고 층 수를 늘림"
        ],
        "answer": 1,
        "explanation": "적은 데이터로 모든 층을 조정하면 과적합되기 쉽다. 데이터가 늘수록 작은 학습률의 파인튜닝을 고려한다."
      }
    ],
    "quizIds": [
      "w4-q10"
    ],
    "references": [
      {
        "title": "Andrej Karpathy — A Recipe for Training Neural Networks",
        "url": "https://karpathy.github.io/2019/04/25/recipe/",
        "note": "본문 체크리스트의 원문: 과제 전에 꼭 읽기"
      },
      {
        "title": "PyTorch — Transfer Learning for Computer Vision",
        "url": "https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html",
        "note": "특징 추출 vs 파인튜닝 공식 튜토리얼"
      }
    ]
  },
  "generative-models": {
    "tier": "core",
    "goal": "판별 모델과 생성 모델의 차이를 설명하고, Autoencoder·VAE·GAN·Diffusion이 각각 \"생성\"을 가능하게 하는 메커니즘을 정확한 용어로 설명할 수 있다.",
    "checks": [
      {
        "id": "w4-generative-models-c1",
        "question": "VAE가 일반 Autoencoder와 달리 \"생성\"에 쓸 수 있는 핵심 이유는?",
        "choices": [
          "디코더가 더 크다",
          "입력을 점이 아닌 분포로 매핑하고 KL 항으로 잠재공간을 표준정규분포 근처에 촘촘히 모아, 아무 점에서나 샘플링해도 되게 해서",
          "레이블을 사용해서",
          "복원 손실을 쓰지 않아서"
        ],
        "answer": 1,
        "explanation": "일반 AE의 잠재공간은 빈 틈이 많아 임의의 점을 디코딩하면 무엇이 나올지 알 수 없다."
      },
      {
        "id": "w4-generative-models-c2",
        "question": "GAN의 minimax 목적함수에서 Generator가 하려는 일은?",
        "choices": [
          "$D(x)$를 0으로 만든다",
          "$D(G(z))$를 1에 가깝게 만들어 Discriminator를 속인다",
          "$D(G(z))$를 0으로 만든다",
          "진짜 데이터를 복원한다"
        ],
        "answer": 1,
        "explanation": "Generator는 가짜를 진짜로 착각하게 만들려 한다. 진짜 데이터 항 $\\log D(x)$에는 관여할 수 없다."
      },
      {
        "id": "w4-generative-models-c3",
        "question": "Diffusion Model의 신경망이 Reverse 과정에서 주로 예측하도록 학습되는 대상은?",
        "choices": [
          "원본 이미지의 레이블",
          "현재 $x_t$에 섞인 노이즈 $\\epsilon$",
          "다음 스텝의 학습률",
          "Discriminator의 출력"
        ],
        "answer": 1,
        "explanation": "노이즈를 예측하는 편이 원본을 직접 그리는 것보다 안정적으로 학습된다. Forward 과정에는 학습되는 파라미터가 없다."
      }
    ],
    "quizIds": [
      "w4-q17",
      "w4-q18",
      "w4-q19",
      "w4-q20"
    ],
    "references": [
      {
        "title": "Lilian Weng — What are Diffusion Models?",
        "url": "https://lilianweng.github.io/posts/2021-07-11-diffusion-models/",
        "note": "Forward/Reverse 과정과 노이즈 예측 목적함수의 표준 해설 (영문, 심화)"
      },
      {
        "title": "Goodfellow et al. (2014) — Generative Adversarial Networks",
        "url": "https://arxiv.org/abs/1406.2661",
        "note": "GAN 원 논문: 1~3절만 읽어도 minimax 구조가 보인다"
      }
    ]
  },
};

export default sections;
