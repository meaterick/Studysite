import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/cnn-architectures";

export default defineLesson({
  id: "cnn-architectures",
  title: "CNN 구조의 발전과 응용",
  tier: "supplement",
  goal: "LeNet, AlexNet, VGG, ResNet이 각각 어떤 문제를 해결했는지 설명하고, 객체 탐지·분할·Vision Transformer가 분류와 어떻게 다른 문제를 푸는지 구분한다.",
  why: "새로운 이미지 모델도 대부분 이 레슨의 구조를 바탕으로 한다. 각 모델이 해결한 문제를 알면 전이학습([[lesson:transfer-learning]])에 쓸 사전학습 모델을 고를 수 있고, 탐지·분할 모델([[lesson:detection-segmentation]])과 Transformer 기반 이미지 모델의 구조를 이해할 수 있다.",
  body: md`
### LeNet에서 ResNet까지

**LeNet-5**(1998)는 Yann LeCun이 손글씨 숫자 인식을 위해 설계한 모델로, 합성곱층과 풀링층을 번갈아 쌓고 마지막에 완전연결층을 붙이는 CNN의 기본 구조를 실용적인 수준으로 처음 구현했다. 입력은 $32 \times 32$ 흑백 이미지였고, 당시의 계산 자원과 데이터로는 이 구조를 크고 복잡한 컬러 이미지로 확장하기 어려웠다.

**AlexNet**(2012)은 ImageNet 대규모 이미지 인식 대회(ILSVRC) 2012에서 top-5 오류율 15.3%로 우승했다. 2위의 오류율은 26.2%였다. 구조는 LeNet과 비슷하지만 다음 세 가지를 결합해 크고 깊은 CNN을 학습할 수 있음을 보였다.

- **ReLU**: 양수 구간에서 미분이 1이라 시그모이드나 tanh보다 기울기 소실이 적다([[lesson:initialization]]).
- **드롭아웃**: 파라미터 약 6천만 개인 모델의 과적합을 줄였다([[lesson:dropout-residual]]).
- **GPU 학습**: 모델을 GPU 두 장에 나눠 학습해, CPU로는 몇 달 걸릴 학습을 며칠 만에 끝냈다.

세 가지 모두 AlexNet이 처음 제안한 것은 아니지만, 이 결합이 이후 딥러닝 연구의 표준 설정이 되었다. top-5 오류율은 모델이 고른 상위 5개 후보에 정답이 없는 비율이다. ImageNet은 1,000개 클래스 중 개 품종만 100개가 넘을 만큼 비슷한 클래스가 많아, 첫 번째 답만 보는 top-1 오류율과 함께 보고한다.

**VGG**(2014)는 큰 커널(예: $11 \times 11$, $7 \times 7$) 대신 $3 \times 3$ 커널만 여러 층 쌓는다. $3 \times 3$ 합성곱(stride 1) 두 층의 수용영역은 $5 \times 5$, 세 층의 수용영역은 $7 \times 7$로([[lesson:pooling]]), $7 \times 7$ 합성곱 한 층과 같다. 입력과 출력 채널이 모두 $C$이면 파라미터 수는 다음과 같다.

| 구성 | 수용영역 | 가중치 수 | $C = 64$일 때 |
| --- | --- | --- | --- |
| $7 \times 7$ 합성곱 한 층 | $7 \times 7$ | $49C^2$ | 200,704 |
| $3 \times 3$ 합성곱 세 층 | $7 \times 7$ | $3 \times 9C^2 = 27C^2$ | 110,592 |

같은 수용영역에 가중치는 약 45% 적고, 층마다 ReLU를 거치므로 비선형 함수를 세 번 적용한다. VGG는 $3 \times 3$ 합성곱과 $2 \times 2$ Max Pooling만으로 16층(VGG-16), 19층(VGG-19)까지 쌓아 깊이가 성능을 높인다는 것을 보였다.

[[diagram:vgg-stack]]

**ResNet**(2015)은 잔차 연결로 층을 더 깊게 쌓을 때 학습 오차가 오히려 높아지는 성능 저하 문제를 해결하고([[lesson:dropout-residual]]), 152층 모델로 ILSVRC 2015에서 우승했다. ResNet은 몇 블록마다 stride 2로 해상도를 절반으로 줄이고 채널 수를 두 배로 늘린다. 이 블록에서는 $F(x)$와 $x$의 모양이 달라 바로 더할 수 없으므로, shortcut 경로에 $1 \times 1$ 합성곱(stride 2)을 두어 $x$의 채널 수와 해상도를 $F(x)$와 같게 바꾼 뒤 더한다(projection shortcut). $1 \times 1$ 합성곱은 공간 방향의 이웃 값을 쓰지 않고 위치마다 입력 채널들의 선형 결합을 계산하므로, 적은 파라미터로 채널 수를 바꾼다. 채널을 64개에서 128개로 바꾸는 $1 \times 1$ 합성곱의 가중치는 $64 \times 128 = 8{,}192$개다.

[[diagram:projection-shortcut]]

| 모델 | 연도 | 해결한 문제 |
| --- | --- | --- |
| LeNet | 1998 | 합성곱·풀링·완전연결층의 기본 구조를 손글씨 인식에 적용 |
| AlexNet | 2012 | ReLU·드롭아웃·GPU 학습을 결합해 큰 CNN을 학습(ImageNet 우승) |
| VGG | 2014 | $3 \times 3$ 커널을 깊게 쌓아 같은 수용영역을 적은 파라미터로 구현 |
| ResNet | 2015 | 잔차 연결로 성능 저하 문제를 해결해 100층 이상을 학습 |

[[diagram:cnn-depth-timeline]]

### 분류 이외의 과제: 탐지와 분할

지금까지의 CNN은 이미지 한 장에 클래스 하나를 붙이는 **이미지 분류**(image classification) 모델이다. 컴퓨터 비전에는 다음과 같은 과제도 있다.

- **객체 탐지**(object detection): 이미지 안의 물체마다 위치를 나타내는 상자(bounding box)와 클래스를 함께 예측한다. 고양이 두 마리와 강아지 한 마리가 있으면 상자 세 개와 각각의 클래스를 출력한다. 클래스 분류에 상자 좌표를 예측하는 회귀 문제가 더해진다.
- **의미론적 분할**(semantic segmentation): 픽셀마다 클래스를 예측한다. 상자보다 물체의 윤곽을 정확히 나타내지만, 같은 클래스의 서로 다른 개체(예: 사람 두 명)는 구분하지 않는다.
- **인스턴스 분할**(instance segmentation): 픽셀마다 클래스를 예측하면서 같은 클래스의 개체도 서로 구분한다.

탐지와 분할의 결과를 계산하고 평가하는 IoU, NMS, AP, Dice는 [[lesson:detection-segmentation]]에서 다룬다.

[[diagram:cv-tasks]]

### Vision Transformer

**Vision Transformer**(ViT)는 원래 텍스트의 토큰 시퀀스를 처리하던 Transformer([[lesson:self-attention]])를 이미지에 적용한다. 이미지를 $16 \times 16$ 픽셀 같은 정사각형 **패치**로 나누고, 각 패치를 텍스트의 토큰 하나처럼 벡터로 바꿔 Transformer 인코더에 입력한다. $224 \times 224$ 이미지를 $16 \times 16$ 패치로 나누면 가로세로 각각 $224 / 16 = 14$개이므로 토큰은 $14 \times 14 = 196$개이고, 패치 하나는 $16 \times 16 \times 3 = 768$개의 숫자를 일렬로 편 벡터다. 패치를 작게 나눌수록 토큰 수가 패치 크기의 제곱에 반비례해 늘어나고, self-attention의 계산량은 토큰 수의 제곱에 비례해 커진다.

[[diagram:vit-patch-count]]

\`\`\`image
src: /images/week4/vit-patches.png
alt: 이미지를 여러 개의 정사각형 패치로 나눈 뒤 각 패치를 토큰처럼 임베딩해 Transformer 인코더에 입력하는 Vision Transformer(ViT) 구조도
caption: 이미지를 고정 크기의 패치로 나눠 선형 변환으로 임베딩하고, 위치 정보를 더해 Transformer 인코더에 입력한다. 합성곱을 쓰지 않는다.
credit: Zhang, Lipton, Li & Smola (Dive into Deep Learning), CC BY-SA 4.0, Wikimedia Commons
width: 480
height: 456
\`\`\`

CNN의 합성곱은 가까운 픽셀끼리의 관계만 계산한다는 지역성 가정을 구조에 포함한다([[lesson:convolution]]). ViT는 패치 내부를 빼면 이런 가정이 거의 없고, 패치들 사이의 관계를 self-attention이 데이터로 학습한다. 그래서 ViT는 CNN보다 훨씬 많은 데이터로 사전학습해야 비슷하거나 더 높은 성능을 낸다. 구조에 가정이 적을수록 그만큼 데이터가 더 필요하다는 관계는 스케일링 법칙([[lesson:scaling-laws]])에서 다시 다룬다. 대신 이미지와 텍스트를 같은 self-attention 구조로 처리할 수 있다는 장점이 있다.
`,
  checks: [
    {
      key: "c1",
      question: "AlexNet이 크고 깊은 CNN을 학습할 수 있었던 요인으로 본문이 든 세 가지는?",
      choices: ["잔차 연결·BatchNorm·Adam", "ReLU·드롭아웃·GPU 학습", "self-attention·패치 임베딩·사전학습", "$1\\times1$ 합성곱·GAP·데이터 증강"],
      answer: 1,
      explanation: "세 가지 모두 AlexNet이 처음 제안한 것은 아니지만, 이를 결합해 크고 깊은 CNN을 학습할 수 있음을 보였다.",
    },
    {
      key: "c2",
      question: "$224\\times224$ 이미지를 $16\\times16$ 패치로 나누면 ViT에 들어가는 패치 토큰은 몇 개인가?",
      choices: ["14", "196", "256", "3136"],
      answer: 1,
      explanation: "$224/16 = 14$이므로 $14 \\times 14 = 196$개다(분류용 토큰을 더하면 197개).",
    },
    {
      key: "c3",
      question: "같은 클래스인 사람 두 명을 서로 다른 개체로 구분해 픽셀 단위로 표시하는 과제는?",
      choices: ["이미지 분류", "객체 탐지", "의미론적 분할", "인스턴스 분할"],
      answer: 3,
      explanation: "의미론적 분할은 픽셀의 클래스만 예측하므로 두 사람을 구분하지 않는다. 개체까지 구분하는 것이 인스턴스 분할이다.",
    },
    {
      key: "c4",
      question: "$32 \\times 32$ 컬러 이미지를 $4 \\times 4$ 패치로 나누면 ViT 토큰은 몇 개이고, 패치 하나(RGB)는 몇 개의 숫자인가?",
      choices: ["토큰 64개, 패치당 48개", "토큰 8개, 패치당 16개", "토큰 64개, 패치당 16개", "토큰 1024개, 패치당 3개"],
      answer: 0,
      explanation: "가로세로 $32/4 = 8$개씩이므로 $8 \\times 8 = 64$개이고, 패치 하나는 $4 \\times 4 \\times 3 = 48$개의 숫자다.",
    },
    {
      key: "c5",
      question: "ImageNet의 top-5 오류율 15.3%가 뜻하는 것은?",
      choices: [
        "모델이 고른 상위 5개 후보에 정답이 없는 경우가 15.3%다",
        "정답을 5번째로 맞히는 비율이 15.3%다",
        "첫 번째 답이 틀린 비율이 15.3%다",
        "5개 클래스에서만 15.3% 틀린다",
      ],
      answer: 0,
      explanation: "top-5 오류는 상위 5개 안에 정답이 없을 때만 오류로 센다. 첫 번째 답만 보는 top-1 오류율보다 항상 같거나 낮다.",
    },
    {
      key: "c6",
      question: "ResNet에서 채널을 64개에서 128개로 늘리고 해상도를 절반으로 줄이는 블록의 shortcut에 $1 \\times 1$ 합성곱(stride 2)을 두는 이유는?",
      choices: [
        "$x$의 채널 수와 해상도를 $F(x)$와 같게 바꿔야 덧셈을 할 수 있어서",
        "수용영역을 넓히려고",
        "비선형성을 더하려고",
        "파라미터를 0으로 만들려고",
      ],
      answer: 0,
      explanation: "$F(x) + x$는 원소별 덧셈이라 모양이 같아야 한다. $1 \\times 1$ 합성곱이 채널 수를, stride 2가 해상도를 맞춘다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
print((224 // 16) ** 2, (224 // 32) ** 2)
print(3 * (9 * 64 * 64), 49 * 64 * 64)
`,
      expected: "196 49\n110592 200704",
      explanation: "$224 \\times 224$ 이미지를 $16 \\times 16$ 패치로 나누면 $14 \\times 14 = 196$개, $32 \\times 32$ 패치로 나누면 $7 \\times 7 = 49$개 토큰이다. $3 \\times 3$ 합성곱 세 층은 $7 \\times 7$ 합성곱 한 층과 수용영역이 같지만 가중치는 약 55%만 쓴다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "AlexNet이 ImageNet 대회에서 크고 깊은 CNN을 학습할 수 있었던 세 가지 요소를 쓰고, 각 요소가 해결한 문제를 쓰라.",
      answer: md`
첫째, ReLU는 양수 구간에서 미분이 1이라 시그모이드나 tanh보다 기울기 소실이 적어 깊은 층까지 기울기가 전달된다. 둘째, 드롭아웃은 학습 중 뉴런의 출력을 무작위로 0으로 만들어 파라미터가 약 6천만 개인 큰 모델의 과적합을 줄였다. 셋째, GPU 학습은 병렬 연산으로 대규모 데이터의 학습 시간을 CPU로 몇 달 걸릴 수준에서 며칠로 줄였다.
`,
      keyPoints: [
        "ReLU: 기울기 소실을 줄여 깊은 층까지 기울기가 전달된다",
        "드롭아웃: 큰 모델의 과적합을 줄인다",
        "GPU 학습: 병렬 연산으로 학습 시간을 줄인다",
      ],
    },
    {
      key: "d2",
      question: "채널 수 $C = 64$일 때 $7\\times7$ 합성곱 한 층과 $3\\times3$ 합성곱 세 층의 가중치 수를 계산하고, 두 구성의 수용영역이 같은 이유와 작은 커널을 깊게 쌓는 쪽이 유리한 이유를 쓰라.",
      answer: md`
$7 \times 7$ 합성곱 한 층의 가중치는 $7 \times 7 \times 64 \times 64 = 200{,}704$개, $3 \times 3$ 합성곱 세 층은 $3 \times (3 \times 3 \times 64 \times 64) = 110{,}592$개로 약 45% 적다. stride 1인 $3 \times 3$ 합성곱은 층마다 수용영역을 2씩 넓히므로 세 층이면 $1 + 2 \times 3 = 7$, 즉 $7 \times 7$로 한 층짜리 $7 \times 7$ 합성곱과 같다. 같은 수용영역을 더 적은 파라미터로 얻고, 층 사이에 ReLU를 세 번 거치므로 표현할 수 있는 함수도 더 다양하다.
`,
      keyPoints: [
        "$7 \\times 7$ 한 층 200,704개, $3 \\times 3$ 세 층 110,592개",
        "$3 \\times 3$ 합성곱 세 층의 수용영역은 $7 \\times 7$이다",
        "같은 수용영역을 더 적은 파라미터로 얻는다",
        "ReLU를 세 번 거쳐 비선형성이 더 많다",
      ],
    },
    {
      key: "d3",
      question: "객체 탐지, 의미론적 분할, 인스턴스 분할이 이미지 분류와 무엇이 다른지 쓰고, ViT가 이미지를 Transformer의 입력으로 바꾸는 방법과 그 과정에서 CNN의 어떤 가정이 사라지는지 쓰라.",
      answer: md`
이미지 분류는 이미지 한 장에 클래스 하나를 예측한다. 객체 탐지는 물체마다 상자(위치)와 클래스를 함께 예측하고, 의미론적 분할은 픽셀마다 클래스를 예측하지만 같은 클래스의 개체를 구분하지 않으며, 인스턴스 분할은 같은 클래스의 개체도 구분한다.

ViT는 이미지를 고정 크기의 패치로 나누고, 각 패치를 하나의 토큰처럼 벡터로 바꿔 Transformer 인코더에 입력한다. 이 과정에서 CNN이 구조에 포함하던 지역성과 평행이동 등변성 가정이 패치 내부를 빼면 거의 사라지고, 패치 사이의 관계는 self-attention이 데이터로 학습한다. 그래서 ViT는 CNN보다 많은 사전학습 데이터가 필요하다.
`,
      keyPoints: [
        "탐지: 물체마다 상자와 클래스를 예측한다",
        "의미론적 분할은 픽셀마다 클래스, 인스턴스 분할은 개체까지 구분한다",
        "ViT는 패치를 토큰으로 바꿔 Transformer에 입력한다",
        "지역성 가정이 사라져 더 많은 데이터가 필요하다",
      ],
    },
  ],
  references: [
    { title: "d2l.ai — Modern Convolutional Neural Networks", url: "https://d2l.ai/chapter_convolutional-modern/index.html", note: "AlexNet·VGG·NiN·GoogLeNet·ResNet을 코드와 함께 (영문)" },
    { title: "Dosovitskiy et al. (2020) — An Image is Worth 16x16 Words (ViT)", url: "https://arxiv.org/abs/2010.11929", note: "ViT 원 논문: 초록과 Figure 1에 패치 임베딩의 구조가 있다 (영문)" },
  ],
});
