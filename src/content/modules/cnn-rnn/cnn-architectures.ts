import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/cnn-architectures";

export default defineLesson({
  id: "cnn-architectures",
  title: "CNN 구조의 발전과 응용",
  tier: "supplement",
  goal: "LeNet → AlexNet → VGG → ResNet이 각각 무엇을 해결했는지 설명하고, Detection·Segmentation·ViT가 분류와 어떻게 다른 문제를 푸는지 구분할 수 있다.",
  why: "",
  body: md`
### CNN 아키텍처의 계보: LeNet → AlexNet → VGG → ResNet

지금까지 살펴본 합성곱과 풀링, 그리고 방금 배운 잔차 연결은 하늘에서 뚝 떨어진 아이디어가 아니라 수십 년에 걸쳐 하나씩 쌓여온 계보의 결과물이다. CNN이 실제로 어떤 순서로 다듬어져 왔는지를 알아두면, 앞으로 새로운 아키텍처를 마주칠 때마다 "이것이 어느 문제를 해결하려는 시도인가"를 훨씬 빠르게 짚어낼 수 있다.

**LeNet(1998)**: Yann LeCun이 손글씨 숫자(우편번호, 수표의 숫자) 인식을 위해 설계한 LeNet-5는 합성곱층과 풀링층을 교대로 쌓고 마지막에 완전연결층을 붙이는, 오늘날까지 이어지는 CNN의 기본 골격을 처음으로 실용적인 수준까지 완성한 모델이다. MNIST 손글씨 숫자 데이터셋에서 당시 최고 수준의 인식률을 보였지만, 다루는 이미지 자체가 $32\times32$ 크기의 흑백 숫자 정도로 작고 단순한 문제였고, 당시의 컴퓨팅 자원으로는 더 크고 복잡한 이미지에 이 구조를 그대로 확장하기 어려웠다.

**AlexNet(2012)**: 그로부터 14년이 지나서야 LeNet의 골격이 진정한 위력을 드러낸다. Krizhevsky, Sutskever, Hinton이 만든 AlexNet은 ImageNet 대규모 이미지 인식 대회(ILSVRC) 2012년 대회에서 top-5 오류율 $15.3\%$를 기록하며 2위(오류율 $26.2\%$)를 압도적인 차이로 따돌리고 우승했다. 이 한 번의 대회 결과가 지금 우리가 배우고 있는 딥러닝 붐 전체의 기폭제가 되었다. AlexNet 자체의 구조는 LeNet과 크게 다르지 않지만, 세 가지 요소를 성공적으로 결합해 "깊고 큰 CNN이 실제로 학습된다"는 것을 처음 증명했다. 첫째는 ReLU 활성화 함수로, 3주차에서 배운 sigmoid·tanh보다 기울기 소실이 훨씬 덜해 더 깊은 망도 학습이 가능해졌다. 둘째는 Dropout으로, 핵심 과정의 「정규화·일반화 기법」 단계에서 다룬 이 정규화 기법이 당시 기준으로 매우 큰 모델(파라미터 약 6천만 개)의 과적합을 억제하는 데 결정적이었다. 셋째는 GPU 학습으로, 대규모 병렬 연산이 가능한 GPU 두 장에 모델을 나눠 올림으로써 그 이전까지 CPU로는 몇 달이 걸렸을 학습을 현실적인 시간 안에 끝낼 수 있었다. ReLU·Dropout·GPU 학습 셋 다 AlexNet이 처음 발명한 요소는 아니었지만, 이 셋을 한데 묶어 "실전에서 통한다"는 것을 증명해 이후 모든 딥러닝 연구의 표준 도구상자로 대중화시킨 것이 AlexNet의 핵심 기여다.

(top-5 오류율은 모델이 내놓은 상위 5개 후보 안에 정답이 **없는** 비율이다. ImageNet은 1,000개 클래스 중에 개 품종만 100개가 넘을 만큼 비슷한 클래스가 많아서, 첫 번째 답만 보는 top-1 오류율과 함께 top-5를 보고한다.)

**VGG(2014)**: AlexNet 이후 "그럼 더 깊게 쌓으면 더 좋아질까"라는 질문에 답하려던 시도 중 하나가 Oxford VGG 그룹의 VGGNet이다. VGG의 설계 철학은 단순하다. 크기가 큰 커널(예: $11\times11$, $7\times7$) 하나 대신 $3\times3$짜리 작은 커널만 여러 개 깊게 쌓는다. 이것이 왜 더 나은 선택인지는 「풀링과 수용영역」 단계에서 다룬 수용영역 계산과 파라미터 수, 두 관점에서 정확히 설명할 수 있다.

먼저 수용영역 관점. $3\times3$ conv를 두 번 연속으로 쌓으면(둘 다 stride 1) 「풀링과 수용영역」 단계의 표에서 확인했듯 수용영역이 $5\times5$가 된다. $5\times5$ conv 한 번의 수용영역과 정확히 같다. $3\times3$ conv 세 번을 쌓으면 수용영역은 $7\times7$이 되어, 이번엔 $7\times7$ conv 한 번과 동일한 범위를 커버한다. 즉 작은 커널을 여러 번 쌓아도 큰 커널 하나와 같은 크기의 영역을 볼 수 있다.

그런데 파라미터 수는 이야기가 다르다. 입력·출력 채널이 모두 $C$라고 하면 $7\times7$ conv 한 층의 파라미터 수는 $7\times7\times C\times C = 49C^2$이다. 반면 $3\times3$ conv 세 층을 쌓으면 $3\times(3\times3\times C\times C) = 27C^2$로, 같은 수용영역을 얻으면서도 파라미터는 오히려 훨씬 더 적다.

:::example 예제: $3\times3$ 세 번 vs $7\times7$ 한 번, 직접 계산해보기
채널 수 $C=64$라고 하자.

- $7\times7$ conv 한 층: $49 \times 64 \times 64 = 200{,}704$개
- $3\times3$ conv 세 층: $3 \times (9 \times 64 \times 64) = 3 \times 36{,}864 = 110{,}592$개

같은 $7\times7$ 수용영역을 얻는 데 필요한 파라미터가 약 45% 줄어든다. 게다가 세 층을 거치는 동안 ReLU 같은 비선형 활성화 함수를 세 번 통과시킬 수 있는 반면(층마다 하나씩), $7\times7$ conv 한 층은 활성화 함수를 단 한 번만 거친다. 파라미터는 더 적으면서 비선형 표현력은 더 높아지는 셈이니, "작은 커널을 깊게 쌓는" 쪽이 여러모로 유리하다.
:::

[[diagram:vgg-stack]]

이 원칙에 따라 VGGNet은 $3\times3$ conv와 $2\times2$ max pooling만으로 16층(VGG-16) 혹은 19층(VGG-19)까지 쌓아 올렸고, ILSVRC 2014에서 상위권 성적을 거두며 "깊이가 성능에 기여한다"는 것과 "단순하고 규칙적인 설계만으로도 충분히 깊게 쌓을 수 있다"는 것을 동시에 보여주었다.

**그리고 ResNet**: 하지만 VGG가 보여준 것처럼 단순히 층만 계속 늘리면 「ResNet: 잔차 연결」 단계에서 다룬 degradation 문제에 곧 부딪힌다. VGG-19 정도까지는 그럭저럭 학습이 됐지만, 이보다 훨씬 깊은(예: 100층 이상) 네트워크는 잔차 연결 없이는 학습 자체가 무너졌다. ResNet은 바로 이 지점에서 등장해, identity shortcut 하나로 "층을 깊게 쌓을수록 무조건 손해는 아니게" 만들면서 152층까지 쌓은 모델로 ILSVRC 2015 우승을 차지했다. LeNet의 골격 $\to$ AlexNet의 실증 $\to$ VGG의 깊이 실험 $\to$ ResNet의 깊이 문제 해결, 이 네 모델을 시간순으로 놓고 보면 CNN의 역사가 "어떻게 하면 더 깊고 안정적으로 학습시킬 것인가"라는 하나의 질문에 대한 연속적인 답변이었다는 것이 뚜렷하게 보인다.

| 모델 | 연도 | 핵심 기여 |
| --- | --- | --- |
| LeNet | 1998 | conv+pooling+FC의 기본 골격을 실용 수준까지 완성(MNIST) |
| AlexNet | 2012 | ReLU·Dropout·GPU 학습을 결합해 딥러닝 붐 촉발(ImageNet 우승) |
| VGG | 2014 | 작은 $3\times3$ 커널을 깊게 쌓는 설계 철학 정립 |
| ResNet | 2015 | 잔차 연결로 degradation 문제 해결, 100층 이상도 학습 가능 |

[[diagram:cnn-depth-timeline]]

### CNN 응용의 확장: Detection · Segmentation · ViT

지금까지 다룬 CNN은 전부 이미지 분류(image classification) 문제, 즉 "사진 한 장에 클래스 하나를 붙이는" 과제에 맞춰져 있었다. 하지만 실제로 CNN이 쓰이는 컴퓨터 비전 문제는 이보다 훨씬 다양하다. 대표적인 두 가지를 개념 수준에서 짚어보고, 최근 CNN의 자리를 일부 대체하고 있는 새로운 구조 하나를 소개한다.

**객체 탐지(Object Detection)**는 사진 안에 있는 여러 물체 각각에 대해 "어디에 있는가(위치, bounding box)"와 "무엇인가(클래스)"를 동시에 예측하는 과제다. Image Classification이 사진 전체에 클래스 하나만 내놓는 반면, Object Detection은 한 장의 사진 안에 고양이 두 마리와 강아지 한 마리가 있다면 세 개의 bounding box와 각각의 클래스 레이블을 함께 출력해야 한다. "무엇인가"만 답하면 되던 문제에 "어디에"라는 위치 회귀(regression) 문제가 추가로 얹히는 셈이다.

**의미론적 분할(Semantic Segmentation)**은 한 걸음 더 나아가, bounding box라는 네모 상자 대신 이미지의 픽셀 하나하나에 클래스 레이블을 매기는 과제다. "이 픽셀은 도로, 저 픽셀은 사람, 그 옆 픽셀은 하늘"이라는 식으로 전체 이미지를 픽셀 단위로 색칠하는 분류 문제라고 이해하면 된다. Object Detection이 물체 하나를 사각형으로 대략적으로 감싸는 정도라면, Semantic Segmentation은 그 물체의 정확한 윤곽까지 픽셀 단위로 구분해낸다. 다만 Semantic Segmentation은 "같은 클래스"에 속하는 서로 다른 개체(예: 사람 두 명)를 구분하지는 않는다. 그 둘을 구분하는 것은 Instance Segmentation이라는 별도의 과제다. 탐지와 분할의 결과를 실제로 계산하고 평가하는 IoU·NMS·AP·Dice는 이 과정의 「탐지·분할의 핵심 계산」 단계에서 다룬다.

[[diagram:cv-tasks]]

**Vision Transformer(ViT)**: 5주차에서는 Self-Attention과 Transformer를 자세히 다루게 되는데, 여기서 CNN과 잠깐 연결고리를 만들어 두자. Transformer는 원래 문장을 이루는 단어(토큰) 시퀀스를 입력으로 받아 각 토큰이 서로 얼마나 관련 있는지를 계산하는 자연어처리용 구조로 설계되었다. Vision Transformer는 여기에 "이미지도 결국 작은 조각(패치, patch)들의 나열로 볼 수 있지 않을까"라는 질문을 던진다. 실제로 ViT는 이미지를 예컨대 $16\times16$ 픽셀짜리 정사각형 패치 여러 개로 균일하게 잘라낸 뒤, 각 패치를 마치 문장의 단어 토큰 하나처럼 취급해 Transformer 인코더에 그대로 입력한다.

토큰 수는 간단히 셀 수 있다. $224 \times 224$ 이미지를 $16 \times 16$ 패치로 자르면 가로세로 각각 $224 / 16 = 14$개라 $14 \times 14 = 196$개의 토큰이 되고, 각 패치는 $16 \times 16 \times 3 = 768$개의 숫자를 한 줄로 편 벡터가 된다. 패치를 작게 자를수록 세밀하게 보지만 토큰 수가 제곱으로 늘어, 5주차에서 볼 Self-Attention의 계산량(토큰 수의 제곱)이 빠르게 커진다.

[[diagram:vit-patch-count]]

\`\`\`image
src: /images/week4/vit-patches.png
alt: 이미지를 여러 개의 정사각형 패치로 분할한 뒤 각 패치를 토큰처럼 임베딩하여 Transformer 인코더에 입력하는 Vision Transformer(ViT) 구조도
caption: 이미지를 고정 크기의 패치들로 잘라 선형 임베딩한 다음 위치 정보를 더해 표준 Transformer 인코더에 그대로 통과시킨다. 합성곱은 전혀 쓰이지 않는다.
credit: Zhang, Lipton, Li & Smola (Dive into Deep Learning), CC BY-SA 4.0, Wikimedia Commons
width: 480
height: 456
\`\`\`

CNN의 합성곱 연산은 애초에 "가까운 픽셀끼리만 본다"는 지역성 귀납편향을 구조 자체에 박아 넣은 것이었다(「합성곱」 단계). ViT는 이미지를 패치로 자르는 첫 단계를 빼면 이 귀납편향을 대부분 덜어내고, 패치들 사이의 관계를 5주차에서 배울 Self-Attention이 데이터로부터 학습하도록 맡긴다. 그 대가로 ViT는 CNN보다 훨씬 많은 데이터로 사전학습해야 비슷하거나 더 나은 성능을 낼 수 있지만(귀납편향이 적을수록 그 편향이 주던 지름길을 데이터 양으로 메워야 한다는 것을 6주차 스케일링 법칙에서 다시 만나게 될 것이다), 일단 그 벽을 넘고 나면 이미지·텍스트를 가리지 않고 같은 Self-Attention 메커니즘 하나로 다룰 수 있다는 강력한 장점을 얻는다. 지금은 "이미지도 패치로 잘라 Transformer에 넣을 수 있다"는 아이디어만 기억해 두고, 그 Self-Attention이 정확히 어떻게 계산되는지는 다음 주에 손으로 직접 굴려본다.
`,
  checks: [
    {
      key: "c1",
      question: "AlexNet의 성공 요인으로 본문이 꼽은 세 가지는?",
      choices: ["잔차 연결·BatchNorm·Adam", "ReLU·Dropout·GPU 학습", "Self-Attention·패치 임베딩·사전학습", "$1\\times1$ conv·GAP·데이터 증강"],
      answer: 1,
      explanation: "셋 다 AlexNet이 처음 발명한 것은 아니지만, 한데 묶어 \"깊고 큰 CNN이 실제로 학습된다\"는 것을 증명했다.",
    },
    {
      key: "c2",
      question: "$224\\times224$ 이미지를 $16\\times16$ 패치로 자르면 ViT에 들어가는 패치 토큰은 몇 개인가?",
      choices: ["14", "196", "256", "3136"],
      answer: 1,
      explanation: "$224/16 = 14$이므로 $14 \\times 14 = 196$개(분류용 토큰을 더하면 197개).",
    },
    {
      key: "c3",
      question: "같은 클래스인 사람 두 명을 서로 다른 개체로 구분해 픽셀 단위로 칠하는 과제는?",
      choices: ["Image Classification", "Object Detection", "Semantic Segmentation", "Instance Segmentation"],
      answer: 3,
      explanation: "Semantic Segmentation은 클래스만 칠하므로 두 사람을 구분하지 않는다. 개체까지 구분하는 것이 Instance Segmentation이다.",
    },
    {
      key: "c4",
      question: "$32 \\times 32$ 이미지를 $4 \\times 4$ 패치로 자르면 ViT 토큰은 몇 개이고, 패치 하나(RGB)는 몇 개의 숫자인가?",
      choices: ["토큰 64개, 패치당 48개", "토큰 8개, 패치당 16개", "토큰 64개, 패치당 16개", "토큰 1024개, 패치당 3개"],
      answer: 0,
      explanation: "가로세로 $32/4 = 8$개씩이라 $8 \\times 8 = 64$개이고, 패치 하나는 $4 \\times 4 \\times 3 = 48$개의 숫자다.",
    },
    {
      key: "c5",
      question: "ImageNet의 top-5 오류율 15.3%가 뜻하는 것은?",
      choices: ["모델이 고른 상위 5개 후보에 정답이 없는 경우가 15.3%다", "정답을 5번째로 맞히는 비율이 15.3%다", "첫 번째 답이 틀린 비율이 15.3%다", "5개 클래스에서만 15.3% 틀린다"],
      answer: 0,
      explanation: "top-5 오류는 상위 5개 안에 정답이 없을 때만 오류로 센다. 첫 번째 답만 보는 top-1 오류율보다 항상 낮다.",
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
      explanation: "$224 \\times 224$ 이미지를 $16 \\times 16$ 패치로 자르면 $14 \\times 14 = 196$개, $32 \\times 32$ 패치면 $7 \\times 7 = 49$개 토큰입니다. $3 \\times 3$ conv 세 층은 $7 \\times 7$ conv 한 층과 수용영역이 같지만 파라미터는 약 55%만 씁니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "LeNet이 오늘날의 CNN과 이미 공유하고 있는 기본 골격은 무엇이며, LeNet 당시에는 왜 이 구조를 더 크고 복잡한 이미지로 확장하기 어려웠는가?",
      answer: md`
LeNet은 합성곱층+풀링층을 반복해 쌓은 뒤 완전연결층으로 마무리하는 구조로, 오늘날 CNN의 기본 골격을 이미 갖추고 있었다. 다만 당시에는 계산 자원(GPU 부재)과 대규모 데이터셋의 부재로 더 크고 복잡한 이미지에는 확장하기 어려웠다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "AlexNet이 2012년 ImageNet 대회에서 딥러닝 붐을 촉발할 수 있었던 세 가지 요소는 무엇이며, 각각이 어떤 문제를 해결했는가?",
      answer: md`
AlexNet은 ReLU(기울기 소실 완화로 깊은 학습 가능), Dropout(과적합 억제), GPU 학습(현실적인 시간 내 대규모 학습 가능)이라는 세 요소를 결합해 2012년 ImageNet 대회에서 압도적으로 우승했다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "채널 수 $C=64$일 때 $7\\times7$ conv 한 층과 $3\\times3$ conv 세 층의 파라미터 수를 각각 계산하고, 두 경우의 수용영역이 왜 같은지, 그런데도 왜 작은 커널을 깊게 쌓는 쪽이 유리한지 설명하라.",
      answer: md`
$C=64$일 때 $7\times7$ conv 1층의 파라미터 수는 $7\times7\times64\times64=200{,}704$개, $3\times3$ conv 3층은 $3\times(3\times3\times64\times64)=110{,}592$개로 약 45% 적다. 두 경우 모두 최종 수용영역은 $7\times7$로 동일하지만, 3층짜리는 그 사이에 비선형 활성화 함수를 세 번 거치므로 표현력은 오히려 더 크다.
`,
      keyPoints: [],
    },
    {
      key: "d4",
      question: "Object Detection은 Image Classification과 비교했을 때 어떤 추가적인 예측을 더 해야 하는가?",
      answer: md`
Object Detection은 이미지 분류(어떤 클래스인지)에 더해 그 객체가 이미지의 어디에 있는지를 나타내는 바운딩 박스(위치)까지 함께 예측한다.
`,
      keyPoints: [],
    },
    {
      key: "d5",
      question: "Semantic Segmentation을 '픽셀 단위 분류'로 정의하고, 이것이 Object Detection과 근본적으로 어떻게 다른지 설명하라.",
      answer: md`
Semantic Segmentation은 이미지의 모든 픽셀 하나하나에 클래스 레이블을 붙이는 태스크다. Object Detection이 객체 단위의 박스로 위치를 표시하는 것과 달리, 픽셀 단위로 훨씬 세밀한 경계를 얻지만 같은 클래스의 서로 다른 개체를 구분하지는 않는다(이를 구분하는 것은 Instance Segmentation).
`,
      keyPoints: [],
    },
    {
      key: "d6",
      question: "Vision Transformer(ViT)는 이미지를 어떻게 Transformer의 입력 형태로 바꾸는가? 이 과정에서 CNN의 어떤 귀납편향이 사라지는가?",
      answer: md`
ViT는 이미지를 고정 크기의 작은 패치들로 잘라, 각 패치를 하나의 토큰처럼 선형 임베딩해 Transformer 인코더에 입력한다. 이 과정에서 CNN이 커널 구조로 원래 가지고 있던 '가까운 픽셀끼리 관련 있다'는 지역성(locality)과 평행이동 등변성 귀납편향이 패치 내부를 빼면 대부분 사라지고, 패치 사이의 관계를 Self-Attention이 데이터로부터 학습해야 한다. 그래서 대규모 사전학습 데이터가 필요하다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "d2l.ai — Modern Convolutional Neural Networks", url: "https://d2l.ai/chapter_convolutional-modern/index.html", note: "AlexNet·VGG·NiN·GoogLeNet·ResNet 계보를 코드와 함께" },
    { title: "Dosovitskiy et al. (2020) — An Image is Worth 16x16 Words (ViT)", url: "https://arxiv.org/abs/2010.11929", note: "abstract와 Figure 1만 읽어도 패치 임베딩 아이디어가 보인다" },
  ],
});
