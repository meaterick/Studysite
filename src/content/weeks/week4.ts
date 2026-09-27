import type { WeekMeta } from "../types";
import sections from "../sections/week4";
import week4Assignment from "../assignments/week4";

const week4: WeekMeta = {
  slug: "week-4",
  number: 4,
  phase: "2부 · 딥러닝",
  title: "딥러닝 실전: CNN · 정규화 · 학습 진단",
  subtitle: "합성곱, ResNet, BatchNorm, Dropout, 데이터 증강, 전이학습",
  difficulty: 4,
  keywords: [
    "합성곱",
    "LeNet",
    "AlexNet",
    "VGG",
    "ResNet",
    "BatchNorm",
    "Dropout",
    "전이학습",
    "Object Detection",
    "Semantic Segmentation",
    "ViT",
    "Autoencoder",
    "VAE",
    "GAN",
    "Diffusion Model",
    "학습 진단",
  ],
  objectives: [
    "합성곱의 파라미터 공유·국소성 귀납편향을 설명하고 출력 크기를 계산한다.",
    "ResNet의 잔차연결이 왜 깊은 망 학습을 가능케 하는지 기울기 관점에서 설명한다.",
    "BatchNorm·Dropout이 학습/평가 모드에서 왜 다르게 동작해야 하는지 설명한다.",
    "Karpathy의 '학습 레시피'에 따라 학습 실패를 진단한다.",
    "전이학습으로 적은 데이터에서 성능을 끌어올린다.",
    "LeNet → AlexNet → VGG → ResNet의 계보를 통해 CNN 설계가 어떤 문제의식으로 진화해왔는지 설명한다.",
    "Object Detection · Semantic Segmentation · ViT가 Image Classification과 어떻게 다른 문제를 푸는지 구분하고, ViT의 패치 임베딩 아이디어를 설명한다.",
    "판별적(discriminative) 모델과 생성적(generative) 모델의 차이를 설명하고, Autoencoder·VAE·GAN·Diffusion Model 각각이 '생성'을 가능케 하는 메커니즘을 정확한 용어로 설명한다.",
  ],
  learningOrder: [
    "[CS231n Notes: Convolutional Networks](https://cs231n.github.io/convolutional-networks/), [Neural Networks Part 2](https://cs231n.github.io/neural-networks-2/)·[Part 3](https://cs231n.github.io/neural-networks-3/)",
    "[d2l.ai](https://d2l.ai/) 7~8장(CNN, 현대 CNN): [한국어판](https://ko.d2l.ai/)",
    "He et al. [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385) · 1~3절 정독",
    "Karpathy [A Recipe for Training Neural Networks](https://karpathy.github.io/2019/04/25/recipe/) · 과제 전에 필독",
    "생성모델 개념 지도(큰 그림만): [GAN(2014)](https://arxiv.org/abs/1406.2661) intro, [VAE(2013)](https://arxiv.org/abs/1312.6114) intro, [DDPM(2020)](https://arxiv.org/abs/2006.11239) intro",
    "Dosovitskiy et al. [An Image is Worth 16x16 Words (ViT)](https://arxiv.org/abs/2010.11929) · abstract·intro만",
  ],
  conceptsMd: `
지난 3주차에서 우리는 다층 퍼셉트론(MLP)과 역전파를 손으로 직접 굴려보았다. 그런데 그 MLP를 그대로 사진에 들이대면 문제가 생긴다. $224 \\times 224$ 크기의 컬러 사진 한 장은 픽셀 수만 해도 15만 개에 가깝다. 이걸 첫 은닉층에 몇백 개짜리 완전연결(FC)로 연결하기만 해도 파라미터가 순식간에 수백만 개로 불어나고, 사진을 조금 오른쪽으로 옮기거나 조명을 바꾸면 모델은 완전히 다른 입력으로 착각한다. 사람은 고양이 사진을 어디서 찍었든, 조금 기울어져 있든 한눈에 고양이라고 알아보는데 말이다. 이번 주는 바로 이 문제("이미지라는 특수한 데이터에 맞는 구조를 어떻게 설계할 것인가")를 다룬다. 그 답이 합성곱 신경망(CNN)이고, 여기에 정규화 기법들을 더하고 학습이 잘 안 될 때 원인을 찾는 진단법까지 익히면, CIFAR-10 같은 실제 이미지 분류 문제를 처음부터 끝까지 직접 실행해 볼 수 있게 된다.

:::info 이번 주의 흐름과 실행 환경
1~3단계에서 합성곱·풀링·잔차 연결을 손계산과 코드로 이해하고, 4단계에서 CNN의 계보와 응용을, 5~6단계에서 정규화·전이학습·학습 진단을 다룬다. 7단계는 판별 모델에서 생성 모델(Autoencoder·VAE·GAN·Diffusion)로 넘어가는 개념 지도다. CIFAR-10 학습처럼 GPU가 필요한 코드는 "Colab에서 실행" 코드로, 원리를 확인하는 코드는 브라우저에서 바로 실행되는 NumPy 코드로 제공한다.
:::

## 합성곱: 파라미터를 공유하는 지역 패턴 검출기 {#convolution}

convolution(합성곱) 연산은 크기 $K \\times K$인 학습 가능한 커널(kernel, 필터filter라고도 부른다)을 입력 특징 지도 위에서 정해진 stride(보폭)만큼씩 이동시키며, 각 위치에서 커널과 겹치는 영역의 원소별 곱의 합(내적, dot product)을 계산해 출력 특징 지도의 한 원소를 생성하는 연산이다. 예를 들어 $3 \\times 3$짜리 커널 하나는 학습을 거치면 "세로 방향 가장자리" 같은 특정 국소 패턴에 강하게 반응하도록(그 패턴이 나타난 위치에서 내적값이 커지도록) 가중치가 조정된다. 커널을 입력의 왼쪽 위 모서리부터 시작해 stride만큼씩 오른쪽으로, 한 행이 끝나면 다시 아래로 이동시키면서 이 내적 계산을 반복하면, 그 결과값들이 입력과 같은 격자 배열을 이루며 특징 지도(feature map)를 구성한다. 이때 커널의 가중치는 슬라이딩하는 모든 위치에서 동일하게 재사용된다. 즉 위치와 무관하게 파라미터를 공유한다(parameter sharing). 고양이 귀의 가장자리에 반응하도록 학습된 커널이라면, 그 귀가 이미지의 어느 위치에 있어도 동일한 가중치로 검출할 수 있어야 하기 때문이다.

[[diagram:conv-operation]]

위 다이어그램의 출력 칸을 하나씩 클릭해보면, 커널이 입력 위 정확히 어느 위치에서 슬라이딩해와 그 값을 만들어냈는지 눈으로 확인할 수 있다. 출력의 각 칸은 입력 전체를 보는 것이 아니라 커널 크기만큼의 좁은 영역만 들여다본다는 사실을, 말로 듣는 것보다 직접 클릭하며 확인하는 편이 훨씬 오래 남는다.

이 슬라이딩이 몇 칸을 건너뛸지(stride), 그리고 가장자리를 얼마나 여유 있게 감쌀지(padding)에 따라 출력의 크기가 달라지는데, 그 관계를 정리한 것이 아래 공식이다.

\`\`\`math
N_{out} = \\left\\lfloor \\dfrac{N + 2P - K}{S} \\right\\rfloor + 1
\`\`\`

:::example 예제: 출력 크기 공식 손으로 검산하기
$5 \\times 5$ 입력에 $3 \\times 3$ 커널을 적용한다고 하자.

- padding 없이(P=0), stride 1: $\\lfloor(5+0-3)/1\\rfloor+1 = \\lfloor2/1\\rfloor+1 = 2+1 = \\mathbf{3\\times3}$
- padding 1(P=1), stride 1: $\\lfloor(5+2-3)/1\\rfloor+1 = \\lfloor4/1\\rfloor+1 = 4+1 = \\mathbf{5\\times5}$. 입력과 출력 크기가 그대로 유지된다. 이런 padding을 흔히 "same padding"이라 부른다.
- padding 없이(P=0), stride 2: $\\lfloor(5+0-3)/2\\rfloor+1 = \\lfloor2/2\\rfloor+1 = 1+1 = \\mathbf{2\\times2}$이다. stride가 커지면 커널이 크게 건너뛰므로 출력이 더 촘촘하게 줄어든다.

숫자를 직접 공식에 넣어보면 역할 분담이 뚜렷하게 보인다. padding은 "크기를 유지할지 줄일지"를 조절하고, stride는 "얼마나 빠르게 줄일지"를 조절한다.
:::

공식으로 크기만 맞혀보는 데서 그치지 말고, 합성곱 연산 자체를 파이썬으로 직접 짜서 눈으로 확인해보자. 먼저 2차원 배열·shape·슬라이싱·중첩 for문을 짚고 넘어가자.


지금까지는 \`[1, 2, 3]\`처럼 숫자가 한 줄로 늘어선 1차원 배열을 주로 다뤘다. 그런데 이미지는 세로·가로 두 방향으로 숫자가 격자 모양으로 늘어선 데이터다. NumPy에서는 이런 격자를 2차원 배열로 표현한다.

\`\`\`python
import numpy as np

x = np.array([[1, 2, 3],
              [4, 5, 6]])
print(x)
print("shape:", x.shape)   # (2, 3) -> 세로(행) 2개, 가로(열) 3개
print("x[0]:", x[0])       # 0번째 행 전체: [1 2 3]
print("x[0, 1]:", x[0, 1]) # 0번째 행, 1번째 열의 값: 2
print("x[0:2, 0:2]:\\n", x[0:2, 0:2])  # 행 0~1, 열 0~1로 잘라낸 부분(슬라이싱)
\`\`\`

\`x.shape\`는 배열의 크기를 (행, 열) 튜플로 알려준다. \`x[0:2, 0:2]\`처럼 콤마로 구분된 두 개의 \`시작:끝\` 범위를 넣으면 배열의 일부 사각형 영역만 잘라낼 수 있는데, 이를 슬라이싱(slicing)이라 부른다. 합성곱은 결국 "입력 배열에서 커널 크기만큼의 작은 사각형을 계속 잘라내며 계산을 반복하는" 연산이므로, 이 슬라이싱 문법이 핵심 도구가 된다. 그리고 "행마다, 그 안에서 다시 열마다" 처럼 반복문 안에 반복문을 겹쳐 쓰는 것을 중첩 for문이라 부르는데, 합성곱 출력의 각 칸(행, 열)을 하나씩 채우려면 바로 이 중첩 for문으로 출력의 모든 위치를 순회해야 한다.

이제 위에서 손으로 계산한 출력 크기 공식이 실제로 맞는지, $5\\times5$ 입력에 $3\\times3$ 커널을 직접 합성곱시켜서 확인해보자. 커널은 세로선에 강하게 반응하도록 왼쪽 열은 $+1$, 가운데 열은 $0$, 오른쪽 열은 $-1$로 채운 값을 쓴다.

\`\`\`python
import numpy as np

# 5x5 입력: 가운데로 갈수록 1이 몰려 있는 대각선 무늬
x = np.array([
    [1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1],
    [0, 0, 1, 1, 0],
    [0, 1, 1, 0, 0],
], dtype=float)
print("입력 x의 shape:", x.shape)  # (5, 5)

# 3x3 커널: 왼쪽 열 +1, 가운데 열 0, 오른쪽 열 -1 -> 세로 방향 가장자리 검출기
k = np.array([
    [1, 0, -1],
    [1, 0, -1],
    [1, 0, -1],
], dtype=float)

def conv2d(x, k, stride=1, padding=0):
    if padding > 0:
        x = np.pad(x, padding)  # 가장자리를 0으로 padding만큼 감싼다
    H, W = x.shape
    K = k.shape[0]
    out_h = (H - K) // stride + 1   # 위에서 배운 출력 크기 공식과 동일
    out_w = (W - K) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):          # 출력의 행을 하나씩
        for j in range(out_w):      # 그 행 안에서 열을 하나씩 (중첩 for문)
            window = x[i*stride:i*stride+K, j*stride:j*stride+K]  # 커널 크기만큼 슬라이싱
            out[i, j] = np.sum(window * k)  # 원소별 곱의 합 = 내적
    return out

out1 = conv2d(x, k, stride=1, padding=0)
print("\\npadding=0, stride=1 출력 shape:", out1.shape)  # 공식대로 3x3 이어야 한다
print(out1)

out2 = conv2d(x, k, stride=1, padding=1)
print("\\npadding=1, stride=1 출력 shape:", out2.shape)  # 공식대로 5x5(입력과 동일) 이어야 한다
print(out2)

out3 = conv2d(x, k, stride=2, padding=0)
print("\\npadding=0, stride=2 출력 shape:", out3.shape)  # 공식대로 2x2 이어야 한다
print(out3)
\`\`\`

\`conv2d\` 함수를 한 줄씩 살펴보면 이렇다. \`window = x[i*stride:i*stride+K, j*stride:j*stride+K]\`가 바로 "커널이 지금 이 위치를 보고 있다"는 것을 슬라이싱으로 표현한 줄이다. \`i*stride\`는 커널이 stride만큼씩 건너뛰며 이동한 결과 지금 몇 번째 행에 와 있는지를 계산한 것이고, 거기서부터 커널 크기 \`K\`만큼을 잘라낸다. \`window * k\`는 잘라낸 영역과 커널을 같은 위치끼리 곱하는 원소별 곱셈(elementwise multiplication)이고, \`np.sum(...)\`으로 그 결과를 전부 더하면 이 단계 첫머리에서 정의한 "원소별 곱의 합(내적)"이 정확히 계산된다. 코드를 실행해서 나온 세 출력의 shape이 각각 (3,3), (5,5), (2,2)로, 앞서 예제에서 공식으로 손 계산했던 값과 정확히 일치하는지 직접 확인해보자.

합성곱이라는 구조 자체에는 세 가지 가정이 이미 녹아 있는데, 이걸 귀납편향(inductive bias)이라 부른다. 하나는 지역성(locality)이다. 이미지의 한 픽셀이 의미를 가지려면 대개 바로 주변 픽셀들과의 관계만 보면 충분하다는 가정이다. 반대편 모서리 픽셀까지 한꺼번에 봐야만 알 수 있는 패턴은 드물다. 둘은 평행이동 등변성(translation equivariance)이다. 고양이 귀가 사진 왼쪽에 있든 오른쪽에 있든 "귀"라는 사실은 변하지 않으므로, 같은 커널이 어느 위치에서나 똑같이 작동해야 한다는 가정이다. 셋은 이 둘의 자연스러운 귀결인 파라미터 공유다. 위치마다 서로 다른 가중치를 두는 대신 커널 하나를 사진 전체에서 재사용하기 때문에, FC층과는 비교가 안 될 만큼 파라미터 수가 줄어든다.

지금까지는 합성곱 연산 하나만 확대해서 봤는데, 한 걸음 물러나 전체 그림을 보자. 실제 CNN은 이런 합성곱(+활성화, +풀링) 블록을 여러 번 반복해 쌓은 뒤, 마지막에 완전연결(FC)층을 붙여 최종 분류 결과를 내놓는 구조를 하고 있다.

\`\`\`image
src: /images/week4/cnn.png
alt: 합성곱층과 풀링층을 반복해 쌓고 마지막에 완전연결층을 붙인 CNN 전체 구조도
caption: 입력 이미지가 여러 합성곱·풀링 블록을 거치며 점점 작고 깊은 특징 지도로 압축되고, 마지막 완전연결층에서 최종 클래스 확률로 변환된다.
credit: Irisbox, CC BY 4.0, Wikimedia Commons
width: 700
height: 289
\`\`\`

:::example 예제: FC층과 합성곱층의 파라미터 수, 직접 비교해보기
$224\\times224\\times3$ 크기의 컬러 사진을 입력받아 64개의 특징을 뽑아낸다고 하자.

- **합성곱층**($3\\times3$ 커널, 64채널): 커널 하나는 $3\\times3\\times3$(가로·세로·입력채널)개의 가중치를 가지고, 이런 커널이 64개 있으니 $3\\times3\\times3\\times64 = 1{,}728$개, 채널마다 편향(bias) 64개를 더하면 총 **1,792개**의 파라미터로 끝난다. 그리고 이 커널 세트 하나가 사진 어디를 훑든 그대로 재사용된다.
- **완전연결(FC)층**: 같은 입력($224\\times224\\times3 = 150{,}528$개의 숫자)을 64개의 출력 노드에 완전히 연결하면 $150{,}528\\times64 + 64 = \\mathbf{9{,}633{,}856}$개, 거의 963만 개의 파라미터가 필요하다.

똑같이 "64개의 특징을 뽑는다"는 목표인데 파라미터 수는 약 5,400배 차이가 난다. FC층은 사진의 모든 픽셀 조합마다 각기 다른 가중치를 배워야 하지만, 합성곱층은 "어디서나 통하는 작은 패턴 탐지기" 하나만 배우면 되기 때문이다. 그리고 층이 깊어질수록 이 작은 탐지기들이 서로 겹쳐 쌓이면서, 처음엔 가장자리 정도만 보던 것이 점점 질감, 눈·코·귀 같은 부분, 마지막엔 "고양이 전체"라는 객체 수준의 패턴까지 알아보게 된다. 이걸 두고 수용영역(receptive field)이 층을 거칠수록 확대된다고 표현한다.
:::

[[practice]]

### 실습: 실제 손글씨 숫자에 가장자리 검출 커널 적용하기

\`sklearn.datasets.load_digits()\`는 사람이 쓴 손글씨 숫자 1,797장을 $8\\times8$ 흑백 이미지(픽셀값 0~16)로 담은 실제 데이터셋이다. 크기가 작아 브라우저에서도 빠르게 돌아가므로, 이번 주 브라우저 실습은 이 데이터로 CNN의 원리를 확인하고, 실제 CIFAR-10 학습은 Colab에서 한다. 아래 코드는 숫자 이미지 한 장에 세로 가장자리 커널과 가로 가장자리 커널을 적용해 반응 강도를 문자 그림으로 출력한다(진한 문자일수록 반응이 크다).

\`\`\`python
import numpy as np
from sklearn.datasets import load_digits

digits = load_digits()
img = digits.images[0]                         # (8, 8), 픽셀값 0~16
print("레이블:", digits.target[0], "/ shape:", img.shape)

def conv2d(x, k, stride=1, padding=0):
    if padding: x = np.pad(x, padding)
    H, W = x.shape; K = k.shape[0]
    out = np.zeros(((H - K) // stride + 1, (W - K) // stride + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = np.sum(x[i*stride:i*stride+K, j*stride:j*stride+K] * k)
    return out

def show(a):
    """절댓값이 클수록 진한 문자로 표시하는 작은 텍스트 이미지"""
    chars = " .:-=+*#%@"
    m = np.abs(a).max() or 1
    for row in a:
        print("".join(chars[int(abs(v) / m * 9)] * 2 for v in row))

vertical = np.array([[1, 0, -1]] * 3, dtype=float)    # 세로 가장자리 검출
horizontal = vertical.T                               # 가로 가장자리 검출

print("\\n원본 이미지"); show(img)
print("\\n세로 가장자리 반응 (padding=1, 출력 8x8)"); show(conv2d(img, vertical, padding=1))
print("\\n가로 가장자리 반응"); show(conv2d(img, horizontal, padding=1))

def conv_params(k, c_in, c_out):   return k * k * c_in * c_out + c_out     # 가중치 + 편향
def fc_params(n_in, n_out):        return n_in * n_out + n_out
print("\\n3x3 conv(3→64) 파라미터:", conv_params(3, 3, 64))
print("224x224x3 → 64 FC 파라미터:", fc_params(224 * 224 * 3, 64))
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 숫자 0의 원본에서 왼쪽·오른쪽 세로 획은 세로 커널에, 위·아래 가로 획은 가로 커널에 강하게 반응한다. 파라미터 수는 1,792개 vs 9,633,856개로 본문 예제와 같다. **해볼 것:** \`digits.images[1]\`(숫자 1)로 바꿔보자. 세로 획 하나뿐인 1에서는 어느 커널이 더 강하게 반응하는가? \`stride=2, padding=0\`으로 바꾸면 출력 크기가 공식 $\\lfloor(8-3)/2\\rfloor + 1 = 3$과 맞는가?
:::

## 풀링과 수용영역 {#pooling-receptive-field}

합성곱이 학습된 커널로 특정 패턴을 검출해 특징 지도를 만드는 연산이라면, 풀링(pooling)은 그렇게 만들어진 특징 지도의 공간 해상도를 줄여 정보를 요약하는 연산이다. 특징 지도의 해상도를 그대로 다음 층에 넘기면 연산량이 커질 뿐 아니라, 물체가 사진 안에서 한두 픽셀 옆으로 옮겨갔을 뿐인데도 결과가 흔들리기 쉽다. 풀링은 작은 영역(대개 $2\\times2$)을 하나의 값으로 압축함으로써 이 두 문제를 동시에 완화한다. 방법은 크게 두 가지, 그 영역에서 가장 큰 값만 남기는 Max Pooling과 영역 전체의 평균을 내는 Average Pooling이다.

\`\`\`image
src: /images/week4/max-pooling.png
alt: 4x4 특징 지도에 2x2 필터, stride 2로 Max Pooling을 적용해 2x2 출력으로 줄이는 과정을 보여주는 다이어그램
caption: 4×4 특징 지도를 2×2 영역 단위로 나눠 각 영역의 최댓값만 남기면(2×2 필터, stride 2) 2×2 크기의 출력이 된다. 같은 영역에서 평균을 내면 Average Pooling이 된다.
credit: Aphex34, CC BY-SA 4.0, Wikimedia Commons
width: 570
height: 330
\`\`\`

:::example 예제: $2\\times2$ 영역, Max Pooling vs Average Pooling
특징 지도의 한 귀퉁이가 다음과 같은 $2\\times2$ 영역이라고 하자: 왼쪽 위 1, 오른쪽 위 3, 왼쪽 아래 2, 오른쪽 아래 4.

- **Max Pooling**: 네 값 중 가장 큰 값 하나만 남긴다 $\\to$ max(1, 3, 2, 4) = **4**
- **Average Pooling**: 네 값을 그대로 평균낸다 $\\to$ (1 + 3 + 2 + 4) / 4 = **2.5**

같은 입력인데 두 결과가 다르다. Max는 "이 영역 안에 4라는 강한 반응이 존재했다"는 사실 하나만 기억하고 나머지 세 값(1, 2, 3)은 그대로 버린다. Average는 네 값을 전부 반영하지만, 대신 4라는 뾰족한 반응이 다른 값들에 희석되어 2.5로 완만해진다.
:::

이 차이를 직관적으로 풀어보면 이렇다. 합성곱 커널의 출력값은 "이 위치가 내가 찾는 무늬와 얼마나 닮았는가"를 나타내는 반응 강도다. Max Pooling은 그 영역 어딘가에 강한 반응이 하나라도 있었는지, 즉 "그 패턴이 여기 있었는가 없었는가"라는 존재 여부에 민감하다. 고양이 귀의 뾰족한 끝을 찾는 커널이라면, 귀가 그 영역의 정확히 어느 픽셀에 있었는지는 중요하지 않고 "귀가 있었다"는 사실만 다음 층에 넘기면 충분하다. Max Pooling이 물체 위치가 한두 칸 옮겨져도 잘 버티는(불변성, invariance) 이유다. 반면 Average Pooling은 영역 전체의 "전반적인 밝기·강도"에 민감하다. 특정 한 점의 뾰족한 신호보다는 그 구역 전체가 얼마나 고르게 활성화되어 있는지가 중요한 정보일 때, 이를테면 배경의 전체적인 색조나 질감을 다룰 때 유리하다. 그래서 이미지 분류 모델의 중간층에서는 Max Pooling이, 맨 마지막에 "이 채널이 이미지 전체에 걸쳐 얼마나 활성화되었는가"를 하나의 숫자로 요약해 분류기에 넘기는 GAP(Global Average Pooling)에서는 Average Pooling이 주로 쓰인다.

풀링과 비슷한 효과를 내는 또 다른 방법이 stride를 2 이상으로 키운 합성곱(strided convolution)이다. 풀링이 "합성곱으로 특징을 뽑은 다음 별도의 단계에서 크기를 줄이는" 방식이라면, strided convolution은 애초에 커널을 두 칸씩 건너뛰며 슬라이딩시켜 특징 추출과 크기 축소를 한 번에 해치운다. 차이는 정보를 버리는 방식에 있다. Max Pooling은 학습되지 않는 고정된 규칙(무조건 최댓값만 남긴다)으로 정보를 버리는 반면, strided convolution은 "무엇을 남기고 무엇을 버릴지"까지 커널의 가중치가 데이터로부터 학습된다. 그래서 ResNet 이후의 여러 최신 아키텍처는 중간의 Max Pooling 층을 걷어내고 그 자리를 stride 2인 합성곱으로 대체하는 경향을 보인다(Springenberg 등의 "Striving for Simplicity: The All Convolutional Net" 연구가 이 흐름의 근거로 자주 인용된다). 다만 이것이 "풀링은 무조건 열등하다"는 뜻은 아니다. 풀링은 학습되는 파라미터가 전혀 없어 연산이 가볍고 그만큼 과적합의 여지도 적으므로, 계산 자원이 제한적이거나 추가적인 정규화 효과가 필요한 상황에서는 여전히 합리적인 선택이다.

풀링이든 strided convolution이든, 크기를 줄이는 층을 하나씩 통과할 때마다 뒤따르는 층들의 수용영역은 원본 이미지 기준으로 훨씬 빠르게 넓어진다. 이 효과를 정확히 계산하려면 두 가지 수치를 함께 추적해야 한다. 수용영역 크기 $r$과, "이 특징 지도의 한 칸이 원본 이미지에서 몇 픽셀 간격으로 떨어져 있는가"를 나타내는 점프(jump) $j$다. 커널 크기 $k$, stride $s$인 층 하나를 통과할 때마다 이 두 값은 다음과 같이 갱신된다.

\`\`\`math
r_{out} = r_{in} + (k - 1) \\cdot j_{in}, \\qquad j_{out} = j_{in} \\cdot s
\`\`\`

stride 1인 합성곱만 계속 쌓는 가장 단순한 경우를 보면, $j$는 항상 1로 유지되므로 층을 하나 더할 때마다 수용영역은 정확히 $(k-1)$칸씩, 즉 각 변으로 $(k-1)/2$칸씩 넓어진다. $3\\times3$ conv($k=3$)라면 층마다 정확히 2칸씩 커지는 셈이다.

| $3\\times3$ conv(stride 1) 층 수 | 수용영역 크기 | 계산 |
| --- | --- | --- |
| 1 | $3\\times3$ | $r = 1 + 2\\times1 = 3$ |
| 2 | $5\\times5$ | $r = 3 + 2\\times1 = 5$ |
| 3 | $7\\times7$ | $r = 5 + 2\\times1 = 7$ |
| 4 | $9\\times9$ | $r = 7 + 2\\times1 = 9$ |
| n | $(2n+1)\\times(2n+1)$ | $r = 1 + 2n$ |

여기에 stride 2인 pooling이나 strided convolution이 한 번이라도 끼어들면 이야기가 달라진다. 그 층을 통과하는 순간 점프 $j$가 그대로 2배로 뛰어오르므로($j_{out} = j_{in} \\times s$), 그 이후에 쌓이는 모든 층의 수용영역 증가폭도 함께 2배로 커진다. 다운샘플링 층 하나는 단순히 특징 지도 한 장의 크기를 줄이는 데서 그치지 않고, 그 지점에서 점프 값을 배가시켜 그 뒤에 올 모든 층의 수용영역 증가폭까지 함께 확대시킨다. VGG나 ResNet 같은 실제 네트워크가 $3\\times3$처럼 작은 커널만 반복해서 쌓았을 뿐인데도 수용영역이 이미지 전체를 뒤덮을 만큼 커지는 것은, 커널 자체가 커서가 아니라 중간중간의 다운샘플링이 점프를 계속 누적시켜주기 때문이다.

방금 손으로 계산했던 Max Pooling과 Average Pooling의 차이를 이번엔 직접 함수로 짜서 확인해보자. 앞 단계에서 만든 \`conv2d\`와 마찬가지로, 입력을 $2\\times2$ 영역 단위로 슬라이싱해서 잘라낸 뒤 그 영역에 \`np.max\`(최댓값) 또는 \`np.mean\`(평균)을 적용하면 된다.

\`\`\`python
import numpy as np

# 위 예제와 동일한 2x2 영역: [[1,3],[2,4]]
x = np.array([[1., 3.],
              [2., 4.]])
print("MaxPool 결과:", np.max(x))   # -> 4.0
print("AvgPool 결과:", np.mean(x))  # -> 2.5

def max_pool2x2(a):
    H, W = a.shape
    out = np.zeros((H // 2, W // 2))
    for i in range(0, H, 2):        # 2칸씩 건너뛰며 세로 위치를 고른다
        for j in range(0, W, 2):    # 2칸씩 건너뛰며 가로 위치를 고른다
            window = a[i:i+2, j:j+2]        # 2x2 영역 슬라이싱
            out[i // 2, j // 2] = np.max(window)
    return out

def avg_pool2x2(a):
    H, W = a.shape
    out = np.zeros((H // 2, W // 2))
    for i in range(0, H, 2):
        for j in range(0, W, 2):
            window = a[i:i+2, j:j+2]
            out[i // 2, j // 2] = np.mean(window)
    return out

# 조금 더 큰 4x4 특징 지도에서, 한쪽 구석에만 강한 반응(9)이 튀는 경우를 비교해보자.
y = np.array([[1., 1., 2., 1.],
              [1., 9., 1., 1.],
              [1., 1., 1., 2.],
              [1., 1., 1., 1.]])
print("\\nMaxPool2x2(y):\\n", max_pool2x2(y))
print("\\nAvgPool2x2(y):\\n", avg_pool2x2(y))
\`\`\`

두 번째 예시에서 강한 반응(9)이 들어있는 왼쪽 위 $2\\times2$ 영역만 놓고 보면, Max Pooling은 그 반응을 그대로 9로 살려서 다음 층에 넘기지만 Average Pooling은 $(1+1+1+9)/4 = 3$으로 완만하게 눌러버린다. "이 영역에 강한 반응이 있었는지"가 중요한 경우와 "이 영역이 전반적으로 얼마나 활성화되어 있는지"가 중요한 경우, 두 풀링이 서로 다른 정보를 남긴다는 것을 코드로도 확인할 수 있다.


풀링을 반복문 없이 한 번에 계산하는 방법도 알아두자. \`axis\` 인자는 "어느 축을 따라 계산할지"를 정하고, \`reshape\`는 숫자의 개수는 그대로 둔 채 배열의 모양만 바꾼다. 예컨대 \`y.reshape(2, 2, 2, 2)\`는 $4\\times4$ 배열을 "세로 블록 2개, 블록 안 세로칸 2개, 가로 블록 2개, 블록 안 가로칸 2개"라는 4차원 구조로 다시 쪼개 보는 것이다. 이 둘을 합치면 반복문 없이 풀링을 계산할 수 있다.

\`\`\`python
import numpy as np

y = np.array([[1., 1., 2., 1.],
              [1., 9., 1., 1.],
              [1., 1., 1., 2.],
              [1., 1., 1., 1.]])

blocks = y.reshape(2, 2, 2, 2)   # (세로블록, 블록 내 세로칸, 가로블록, 블록 내 가로칸)
print("reshape 후 shape:", blocks.shape)  # (2, 2, 2, 2)
print("axis=(1, 3) 최댓값:\\n", blocks.max(axis=(1, 3)))  # 블록 내부(1, 3번 축)만 골라 최댓값
\`\`\`

\`axis=(1, 3)\`은 "1번 축과 3번 축, 즉 각 블록 내부의 세로·가로 두 칸만 남기고 그 안에서 최댓값을 구하라"는 뜻이다. 그 결과 앞서 반복문으로 만든 \`max_pool2x2(y)\`와 정확히 같은 $2\\times2$ 결과가 한 줄로 나온다. 참고로 이미지를 배열로 다룰 때는 (높이, 너비, 채널) 순서(예: \`(H, W, 3)\`)로 저장하는 경우와, 파이토치처럼 (채널, 높이, 너비) 순서(\`(3, H, W)\`)로 저장하는 경우가 둘 다 흔히 쓰이는데, 두 순서를 서로 바꿔야 할 때는 \`arr.transpose(2, 0, 1)\`처럼 축의 순서 자체를 바꿔주는 \`transpose\`를 사용한다.

[[practice]]

### 실습: 수용영역 계산기와 "한 칸 이동"에 대한 풀링의 둔감함

\`\`\`python
import numpy as np
from sklearn.datasets import load_digits

# 1) 층 목록을 받아 수용영역 r과 점프 j를 차례로 갱신하는 계산기
def receptive_field(layers):
    r, j = 1, 1
    for name, k, s in layers:
        r, j = r + (k - 1) * j, j * s
        print(f"{name:10s} (k={k}, s={s}) → 수용영역 {r:3d}, 점프 {j}")
    return r

receptive_field([("conv3x3", 3, 1), ("conv3x3", 3, 1), ("pool2x2", 2, 2),
                 ("conv3x3", 3, 1), ("conv3x3", 3, 1), ("pool2x2", 2, 2),
                 ("conv3x3", 3, 1)])

# 2) 숫자 이미지를 오른쪽으로 한 칸 옮기면 특징은 얼마나 바뀌는가?
def conv2d(x, k, padding=1):
    x = np.pad(x, padding); K = k.shape[0]
    return np.array([[np.sum(x[i:i+K, j:j+K] * k) for j in range(x.shape[1] - K + 1)]
                     for i in range(x.shape[0] - K + 1)])
def max_pool(a):
    H, W = a.shape
    return a.reshape(H // 2, 2, W // 2, 2).max(axis=(1, 3))

x = load_digits().images[3]
shifted = np.roll(x, 1, axis=1)                         # 오른쪽으로 한 칸 이동
k = np.array([[1, 0, -1]] * 3, dtype=float)
f, fs = np.maximum(0, conv2d(x, k)), np.maximum(0, conv2d(shifted, k))
print("\\n특징 지도의 평균 차이     :", np.abs(f - fs).mean().round(3))
print("풀링 1번 뒤의 평균 차이   :", np.abs(max_pool(f) - max_pool(fs)).mean().round(3))
print("풀링 2번 뒤의 평균 차이   :", np.abs(max_pool(max_pool(f)) - max_pool(max_pool(fs))).mean().round(3))
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 수용영역이 3 → 5로 커지고, 첫 풀링에서 6(점프 2)이 된 뒤로는 conv 한 층마다 $2 \\times 2 = 4$씩 커져 10 → 14, 두 번째 풀링에서 16(점프 4), 마지막 conv에서는 $2 \\times 4 = 8$이 늘어 24가 된다. 같은 $3\\times3$ conv라도 뒤에 올수록 수용영역을 더 크게 넓힌다. 한 칸 이동 실험에서는 풀링을 한 번 거친 것만으로는 차이가 약간 줄어드는 데 그치지만, 두 번 거치면 이 예에서는 차이가 0이 된다. 다운샘플링을 거듭할수록 작은 위치 변화에 둔감해진다(불변성). **해볼 것:** 마지막 conv를 두 개 더 쌓으면 수용영역이 얼마가 되는가? 먼저 손으로 예측하고 코드로 확인하자.
:::

## ResNet: 잔차 연결 {#resnet}

층을 단순히 깊게 쌓으면 신경망이 항상 더 똑똑해질 것 같지만 실제로는 그렇지 않다. 56층짜리 "민짜" 신경망이 20층짜리보다 오히려 학습 데이터에 대한 오차조차 더 높게 나오는 현상이 관찰됐는데, 이걸 degradation(성능 저하) 문제라 부른다. 흥미로운 점은 이것이 과적합이 아니라는 것이다. 과적합이라면 학습 오차는 낮은데 검증 오차만 높아야 하는데, 여기서는 학습 오차 자체가 더 높다. 즉 층을 늘렸더니 모델이 오히려 학습 자체를 제대로 못 하게 된 것이다. 흔히 기울기 소실이 원인이라고 오해하지만, ResNet 논문(He et al., 2015)은 BatchNorm으로 순전파·역전파 신호가 건강하게 유지되는 상태에서도 이 현상이 나타난다는 점을 들어 **기울기 소실보다는 최적화의 어려움**: 여러 비선형 층을 쌓은 망이 "적어도 얕은 망만큼" 하려면 추가된 층들이 항등함수를 근사해야 하는데, 경사하강법이 이를 쉽게 찾지 못한다는 것)으로 설명한다.

[[diagram:resnet-skip]]

여기서 나온 해법이 잔차 연결(skip connection, residual connection)이다. 잔차 블록은 입력 $x$가 몇 개의 합성곱층으로 이루어진 함수 $F$를 통과한 결과 $F(x)$에, 원래 입력 $x$를 항등 사상(identity mapping)으로 그대로 더한 $y = F(x) + x$를 출력으로 내놓는다. 이 덧셈 경로(identity shortcut)는 학습되는 가중치가 전혀 없는 단순 덧셈이므로, 순전파 신호와 역전파 기울기가 F를 거치지 않고도 그대로 다음 층·이전 층으로 전달되는 경로를 하나 더 만들어준다. 그래서 한 블록이 배우는 것은 "전체 출력"이 아니라 "입력에서 얼마나 달라져야 하는가"라는 잔차(residual) F(x)뿐이다. 극단적으로 이 블록이 항등함수만 표현하면 충분한 경우에는 $F(x)=0$이 되도록 가중치를 학습하면 되므로(가중치를 0 근처로 보내기만 하면 되니 항등함수를 직접 배우는 것보다 훨씬 쉽다), 층을 아무리 깊게 쌓아도 최소한 더 얕은 모델과 동일한 함수는 표현할 수 있다는 것이 이론적으로 보장된다.

이것이 왜 기울기 관점에서도 유리한지는 미분해보면 바로 드러난다. 출력 $y = F(x) + x$를 $x$에 대해 미분하면 다음과 같다.

\`\`\`math
\\dfrac{dy}{dx} = F'(x) + 1
\`\`\`

이 "+1" 항이 핵심이다. $F'(x)$가 아무리 작아지더라도 최소한 1만큼의 기울기는 identity shortcut을 타고 곧장 앞쪽 층까지 전달된다. 블록을 여러 개 쌓으면 전체 기울기는 각 블록의 $(1 + F'_i)$를 곱한 값이 되는데, 잔차 연결이 없을 때의 $\\prod F'_i$와 달리 각 항이 1 근처에 머물 수 있어 층이 깊어져도 기울기가 지수적으로 사라지지 않는다. 이후 거의 모든 현대 아키텍처(5주차에 배울 Transformer 포함)가 이 skip connection을 기본 구성 요소로 채택하고 있다.

말로만 하면 추상적이니, $F'(x)$가 실제로 아주 작은 값이 되는 상황을 하나 만들어 $dy/dx$가 정말로 1 근처에 머무는지 숫자로 확인해보자. 3주차의 수치미분 $\\frac{dy}{dx} \\approx \\frac{y(x+h) - y(x-h)}{2h}$을 그대로 쓴다.

\`\`\`python
# F(x)를 아주 작은 기울기를 갖는 함수로 두어, 층이 깊어져 기울기가 옅어진 상황을 흉내 낸다.
def F(x):
    return 0.001 * x**3

def F_prime(x):          # F를 손으로 미분한 식: d/dx(0.001*x^3) = 0.003*x^2
    return 0.003 * x**2

def y_residual(x):       # 잔차 연결: y = F(x) + x
    return F(x) + x

def numerical_derivative(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)   # x 좌우로 아주 조금씩 움직여 기울기를 근사

for x in [0.0, 1.0, 2.0, 5.0]:
    dydx_numeric = numerical_derivative(y_residual, x)
    dydx_formula = F_prime(x) + 1            # 손으로 미분한 dy/dx = F'(x) + 1
    print(f"x={x}: F'(x)={F_prime(x):.6f}, 수치미분={dydx_numeric:.6f}, "
          f"공식 F'(x)+1={dydx_formula:.6f}")
\`\`\`

$x=5$에서도 \`F_prime(x)\`는 $0.075$ 밖에 안 될 만큼 작지만, \`dydx_numeric\`과 \`dydx_formula\`는 둘 다 $1.075$로 정확히 일치하며 항상 1보다 크다. $F$ 경로의 기울기가 거의 0이어도 identity shortcut이 더해주는 "+1" 덕분에 전체 기울기가 1 근처에 머문다는 것을 실제로 찍힌 숫자로 확인한 셈이다.

[[practice]]

### 실습: 50개 블록을 거친 기울기: 잔차 연결이 있을 때와 없을 때

sigmoid·tanh처럼 포화되는 활성화를 쓰면 층마다의 국소 기울기가 1보다 작은 경우가 많다. 블록마다 국소 기울기가 0.25~1.0 사이에서 무작위로 정해지는 50층 네트워크를 흉내내, 입력까지 도달하는 기울기의 크기를 비교해보자. 잔차 연결이 없으면 기울기는 $\\prod_i F'_i$, 있으면 $\\prod_i (1 + F'_i)$인데, 학습 초기에 잔차 경로 $F$의 기울기가 작다면(여기서는 $\\pm 0.05$) 각 항이 1 근처가 된다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
n_blocks = 50
local = rng.uniform(0.25, 1.0, n_blocks)         # 잔차 없는 층의 국소 기울기 (1보다 작은 경우가 많다)
small = rng.uniform(-0.05, 0.05, n_blocks)       # 잔차 경로 F의 작은 기울기

plain = np.cumprod(local)                         # 잔차 없음: 곱하기만
residual = np.cumprod(1 + small)                  # 잔차 있음: (1 + F'_i)의 곱

for depth in [1, 10, 20, 30, 50]:
    print(f"{depth:2d}층까지: plain {plain[depth - 1]:.2e}   residual {residual[depth - 1]:.3f}")

print("\\nlog(F'_i)의 평균 =", np.log(local).mean().round(3), "→ 층마다 약", np.exp(np.log(local).mean()).round(3), "배씩 곱해지는 셈")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 잔차 연결이 없으면 10층에서 이미 약 $7 \\times 10^{-3}$, 50층에서는 $10^{-11}$ 수준으로 기울기가 사라진다(층마다 평균 약 0.6배씩 곱해지는 셈). 잔차 연결이 있으면 50층을 지나도 0.8~1.4 정도로 1과 같은 자릿수에 머문다. **생각해볼 것:** \`local\`의 범위를 \`0.9~1.1\`로 좁히면 plain의 결과는 어떻게 되는가? "초기화를 아주 정확히 맞추거나(3주차) 잔차 연결을 쓰거나"라는 두 처방이 같은 문제를 푼다는 것을 연결해보자.
:::

## CNN의 계보와 응용: LeNet부터 ViT까지 {#cnn-history-applications}

### CNN 아키텍처의 계보: LeNet → AlexNet → VGG → ResNet

지금까지 살펴본 합성곱과 풀링, 그리고 방금 배운 잔차 연결은 하늘에서 뚝 떨어진 아이디어가 아니라 수십 년에 걸쳐 하나씩 쌓여온 계보의 결과물이다. CNN이 실제로 어떤 순서로 다듬어져 왔는지를 알아두면, 앞으로 새로운 아키텍처를 마주칠 때마다 "이것이 어느 문제를 해결하려는 시도인가"를 훨씬 빠르게 짚어낼 수 있다.

**LeNet(1998)**: Yann LeCun이 손글씨 숫자(우편번호, 수표의 숫자) 인식을 위해 설계한 LeNet-5는 합성곱층과 풀링층을 교대로 쌓고 마지막에 완전연결층을 붙이는, 오늘날까지 이어지는 CNN의 기본 골격을 처음으로 실용적인 수준까지 완성한 모델이다. MNIST 손글씨 숫자 데이터셋에서 당시 최고 수준의 인식률을 보였지만, 다루는 이미지 자체가 $32\\times32$ 크기의 흑백 숫자 정도로 작고 단순한 문제였고, 당시의 컴퓨팅 자원으로는 더 크고 복잡한 이미지에 이 구조를 그대로 확장하기 어려웠다.

**AlexNet(2012)**: 그로부터 14년이 지나서야 LeNet의 골격이 진정한 위력을 드러낸다. Krizhevsky, Sutskever, Hinton이 만든 AlexNet은 ImageNet 대규모 이미지 인식 대회(ILSVRC) 2012년 대회에서 top-5 오류율 $15.3\\%$를 기록하며 2위(오류율 $26.2\\%$)를 압도적인 차이로 따돌리고 우승했다. 이 한 번의 대회 결과가 지금 우리가 배우고 있는 딥러닝 붐 전체의 기폭제가 되었다. AlexNet 자체의 구조는 LeNet과 크게 다르지 않지만, 세 가지 요소를 성공적으로 결합해 "깊고 큰 CNN이 실제로 학습된다"는 것을 처음 증명했다. 첫째는 ReLU 활성화 함수로, 3주차에서 배운 sigmoid·tanh보다 기울기 소실이 훨씬 덜해 더 깊은 망도 학습이 가능해졌다. 둘째는 Dropout으로, 5단계에서 다룰 이 정규화 기법이 당시 기준으로 매우 큰 모델(파라미터 약 6천만 개)의 과적합을 억제하는 데 결정적이었다. 셋째는 GPU 학습으로, 대규모 병렬 연산이 가능한 GPU 두 장에 모델을 나눠 올림으로써 그 이전까지 CPU로는 몇 달이 걸렸을 학습을 현실적인 시간 안에 끝낼 수 있었다. ReLU·Dropout·GPU 학습 셋 다 AlexNet이 처음 발명한 요소는 아니었지만, 이 셋을 한데 묶어 "실전에서 통한다"는 것을 증명해 이후 모든 딥러닝 연구의 표준 도구상자로 대중화시킨 것이 AlexNet의 핵심 기여다.

**VGG(2014)**: AlexNet 이후 "그럼 더 깊게 쌓으면 더 좋아질까"라는 질문에 답하려던 시도 중 하나가 Oxford VGG 그룹의 VGGNet이다. VGG의 설계 철학은 단순하다. 크기가 큰 커널(예: $11\\times11$, $7\\times7$) 하나 대신 $3\\times3$짜리 작은 커널만 여러 개 깊게 쌓는다. 이것이 왜 더 나은 선택인지는 2단계에서 다룬 수용영역 계산과 파라미터 수, 두 관점에서 정확히 설명할 수 있다.

먼저 수용영역 관점. $3\\times3$ conv를 두 번 연속으로 쌓으면(둘 다 stride 1) 2단계의 표에서 확인했듯 수용영역이 $5\\times5$가 된다. $5\\times5$ conv 한 번의 수용영역과 정확히 같다. $3\\times3$ conv 세 번을 쌓으면 수용영역은 $7\\times7$이 되어, 이번엔 $7\\times7$ conv 한 번과 동일한 범위를 커버한다. 즉 작은 커널을 여러 번 쌓아도 큰 커널 하나와 같은 크기의 영역을 볼 수 있다.

그런데 파라미터 수는 이야기가 다르다. 입력·출력 채널이 모두 $C$라고 하면 $7\\times7$ conv 한 층의 파라미터 수는 $7\\times7\\times C\\times C = 49C^2$이다. 반면 $3\\times3$ conv 세 층을 쌓으면 $3\\times(3\\times3\\times C\\times C) = 27C^2$로, 같은 수용영역을 얻으면서도 파라미터는 오히려 훨씬 더 적다.

:::example 예제: $3\\times3$ 세 번 vs $7\\times7$ 한 번, 직접 계산해보기
채널 수 $C=64$라고 하자.

- $7\\times7$ conv 한 층: $49 \\times 64 \\times 64 = 200{,}704$개
- $3\\times3$ conv 세 층: $3 \\times (9 \\times 64 \\times 64) = 3 \\times 36{,}864 = 110{,}592$개

같은 $7\\times7$ 수용영역을 얻는 데 필요한 파라미터가 약 45% 줄어든다. 게다가 세 층을 거치는 동안 ReLU 같은 비선형 활성화 함수를 세 번 통과시킬 수 있는 반면(층마다 하나씩), $7\\times7$ conv 한 층은 활성화 함수를 단 한 번만 거친다. 파라미터는 더 적으면서 비선형 표현력은 더 높아지는 셈이니, "작은 커널을 깊게 쌓는" 쪽이 여러모로 유리하다.
:::

이 원칙에 따라 VGGNet은 $3\\times3$ conv와 $2\\times2$ max pooling만으로 16층(VGG-16) 혹은 19층(VGG-19)까지 쌓아 올렸고, ILSVRC 2014에서 상위권 성적을 거두며 "깊이가 성능에 기여한다"는 것과 "단순하고 규칙적인 설계만으로도 충분히 깊게 쌓을 수 있다"는 것을 동시에 보여주었다.

**그리고 ResNet**: 하지만 VGG가 보여준 것처럼 단순히 층만 계속 늘리면 앞 단계에서 다룬 degradation 문제에 곧 부딪힌다. VGG-19 정도까지는 그럭저럭 학습이 됐지만, 이보다 훨씬 깊은(예: 100층 이상) 네트워크는 잔차 연결 없이는 학습 자체가 무너졌다. ResNet은 바로 이 지점에서 등판해, identity shortcut 하나로 "층을 깊게 쌓을수록 무조건 손해는 아니게" 만들면서 152층까지 쌓은 모델로 ILSVRC 2015 우승을 차지했다. LeNet의 골격 $\\to$ AlexNet의 실증 $\\to$ VGG의 깊이 실험 $\\to$ ResNet의 깊이 문제 해결, 이 네 모델을 시간순으로 놓고 보면 CNN의 역사가 "어떻게 하면 더 깊고 안정적으로 학습시킬 것인가"라는 하나의 질문에 대한 연속적인 답변이었다는 것이 뚜렷하게 보인다.

| 모델 | 연도 | 핵심 기여 |
| --- | --- | --- |
| LeNet | 1998 | conv+pooling+FC의 기본 골격을 실용 수준까지 완성(MNIST) |
| AlexNet | 2012 | ReLU·Dropout·GPU 학습을 결합해 딥러닝 붐 촉발(ImageNet 우승) |
| VGG | 2014 | 작은 $3\\times3$ 커널을 깊게 쌓는 설계 철학 정립 |
| ResNet | 2015 | 잔차 연결로 degradation 문제 해결, 100층 이상도 학습 가능 |

### CNN 응용의 확장: Detection · Segmentation · ViT

지금까지 다룬 CNN은 전부 이미지 분류(image classification) 문제, 즉 "사진 한 장에 클래스 하나를 붙이는" 과제에 맞춰져 있었다. 하지만 실제로 CNN이 쓰이는 컴퓨터 비전 문제는 이보다 훨씬 다양하다. 대표적인 두 가지를 개념 수준에서 짚어보고, 최근 CNN의 자리를 일부 대체하고 있는 새로운 구조 하나를 소개한다.

**객체 탐지(Object Detection)**은 사진 안에 있는 여러 물체 각각에 대해 "어디에 있는가(위치, bounding box)"와 "무엇인가(클래스)"를 동시에 예측하는 과제다. Image Classification이 사진 전체에 클래스 하나만 내놓는 반면, Object Detection은 한 장의 사진 안에 고양이 두 마리와 강아지 한 마리가 있다면 세 개의 bounding box와 각각의 클래스 레이블을 함께 출력해야 한다. "무엇인가"만 답하면 되던 문제에 "어디에"라는 위치 회귀(regression) 문제가 추가로 얹히는 셈이다.

**의미론적 분할(Semantic Segmentation)**은 한 걸음 더 나아가, bounding box라는 네모 상자 대신 이미지의 픽셀 하나하나에 클래스 레이블을 매기는 과제다. "이 픽셀은 도로, 저 픽셀은 사람, 그 옆 픽셀은 하늘"이라는 식으로 전체 이미지를 픽셀 단위로 색칠하는 분류 문제라고 이해하면 된다. Object Detection이 물체 하나를 사각형으로 대략적으로 감싸는 정도라면, Semantic Segmentation은 그 물체의 정확한 윤곽까지 픽셀 단위로 구분해낸다. 다만 Semantic Segmentation은 "같은 클래스"에 속하는 서로 다른 개체(예: 사람 두 명)를 구분하지는 않는다. 그 둘을 구분하는 것은 Instance Segmentation이라는 별도의 과제다.

**Vision Transformer(ViT)**: 5주차에서는 Self-Attention과 Transformer를 자세히 다루게 되는데, 여기서 CNN과 잠깐 연결고리를 만들어 두자. Transformer는 원래 문장을 이루는 단어(토큰) 시퀀스를 입력으로 받아 각 토큰이 서로 얼마나 관련 있는지를 계산하는 자연어처리용 구조로 설계되었다. Vision Transformer는 여기에 "이미지도 결국 작은 조각(패치, patch)들의 나열로 볼 수 있지 않을까"라는 질문을 던진다. 실제로 ViT는 이미지를 예컨대 $16\\times16$ 픽셀짜리 정사각형 패치 여러 개로 균일하게 잘라낸 뒤, 각 패치를 마치 문장의 단어 토큰 하나처럼 취급해 Transformer 인코더에 그대로 입력한다.

\`\`\`image
src: /images/week4/vit-patches.png
alt: 이미지를 여러 개의 정사각형 패치로 분할한 뒤 각 패치를 토큰처럼 임베딩하여 Transformer 인코더에 입력하는 Vision Transformer(ViT) 구조도
caption: 이미지를 고정 크기의 패치들로 잘라 선형 임베딩한 다음 위치 정보를 더해 표준 Transformer 인코더에 그대로 통과시킨다. 합성곱은 전혀 쓰이지 않는다.
credit: Zhang, Lipton, Li & Smola (Dive into Deep Learning), CC BY-SA 4.0, Wikimedia Commons
width: 480
height: 456
\`\`\`

CNN의 합성곱 연산은 애초에 "가까운 픽셀끼리만 본다"는 지역성 귀납편향을 구조 자체에 박아 넣은 것이었다(1단계). ViT는 이 귀납편향을 아예 없애버리고, 패치들 사이의 관계를 5주차에서 배울 Self-Attention이 전부 데이터로부터 학습하도록 맡긴다. 그 대가로 ViT는 CNN보다 훨씬 많은 데이터로 사전학습해야 비슷하거나 더 나은 성능을 낼 수 있지만(귀납편향이 적을수록 그 편향이 주던 지름길을 데이터 양으로 메꿔야 한다는 것을 6주차 스케일링 법칙에서 다시 만나게 될 것이다), 일단 그 벽을 넘고 나면 이미지·텍스트를 가리지 않고 같은 Self-Attention 메커니즘 하나로 다룰 수 있다는 강력한 장점을 얻는다. 지금은 "이미지도 패치로 잘라 Transformer에 넣을 수 있다"는 아이디어만 기억해 두고, 그 Self-Attention이 정확히 어떻게 계산되는지는 다음 주에 손으로 직접 굴려본다.

[[practice]]

### 실습: ViT처럼 이미지를 패치 토큰으로 자르기

ViT의 첫 단계는 이미지를 겹치지 않는 정사각형 패치로 자르고, 각 패치를 한 줄로 펴서 "토큰 벡터"로 만드는 것이다. $8\\times8$ 숫자 이미지를 $4\\times4$ 패치 4개로 잘라보고, $224\\times224$ 이미지를 $16\\times16$ 패치로 자르면 토큰이 몇 개가 되는지도 계산해보자.

\`\`\`python
import numpy as np
from sklearn.datasets import load_digits

img = load_digits().images[0]                     # (8, 8)
P = 4                                             # 패치 한 변의 길이
H, W = img.shape
patches = img.reshape(H // P, P, W // P, P).transpose(0, 2, 1, 3).reshape(-1, P * P)
print("패치 토큰 행렬 shape:", patches.shape)      # (패치 수, 패치 하나의 픽셀 수)
for i, p in enumerate(patches):
    print(f"토큰 {i}: {p.astype(int)}")

# 이 토큰들에 학습 가능한 행렬 E(16 → d)를 곱하면 "패치 임베딩"이 된다
rng = np.random.default_rng(0)
d = 8
E = rng.normal(0, 0.1, (P * P, d))
print("\\n임베딩 후 shape:", (patches @ E).shape)

def n_tokens(img_size, patch):  return (img_size // patch) ** 2
print("224x224, 16x16 패치 → 토큰 수:", n_tokens(224, 16))
print("VGG식 3x3 세 층 vs 7x7 한 층 (C=64):", 3 * (9 * 64 * 64), "vs", 49 * 64 * 64)
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 패치 토큰 행렬은 \`(4, 16)\`, 임베딩 후 \`(4, 8)\`, $224\\times224$ 이미지는 $14 \\times 14 = 196$개의 토큰이 된다. 파라미터 비교는 110,592 vs 200,704로 본문 예제와 같다. **생각해볼 것:** 패치를 자르고 한 줄로 펴는 순간 "패치 안에서 어느 픽셀이 어느 픽셀 옆에 있었는지"라는 정보는 어디에 남아 있는가? ViT가 위치 정보(position embedding)를 따로 더해야 하는 이유와 연결해보자.
:::

## 정규화·일반화 기법과 CIFAR-10 학습 {#regularization}

지금까지 만든 CNN이 학습 데이터를 잘 맞히는 것까지는 어렵지 않다. 정말 어려운 것은 처음 보는 데이터에도 잘 통하게 만드는 것, 즉 일반화(generalization)다. 이번 단계에서 소개하는 다섯 가지 기법은 전부 "모델이 학습 데이터를 통째로 외워버리지 못하게 방해한다"는 공통점을 가지고 있다.

배치 정규화(BatchNorm)은 한 층에 들어오는 활성화 값을 채널(특징)별로 정규화하는 연산이다. 학습 도중 한 층에 들어오는 값들의 분포가 배치마다 요동치면(이걸 internal covariate shift라 부르기도 한다) 뒤쪽 층은 계속 달라지는 입력 분포에 맞춰 적응해야 해서 학습이 불안정해진다. BatchNorm(3주차 「정규화 층」 단계에서 자세히 다뤘다)은 매 배치마다 그 배치 안에서 채널별 평균 $\\mu$와 표준편차 $\\sigma$를 구해 $\\hat x = (x-\\mu)/\\sigma$로 정규화한 다음, $\\gamma$(스케일)와 $\\beta$(이동)라는 학습 가능한 파라미터로 $\\gamma\\hat x+\\beta$ 형태로 다시 스케일과 위치를 조정한다. 정규화만 하고 끝내지 않고 $\\gamma, \\beta$를 학습시키는 이유는, 평균 0·표준편차 1인 분포가 모든 층에 항상 최적은 아니기 때문에 최종적으로 어떤 분포를 사용할지를 역전파를 통해 모델이 직접 결정하게 하기 위함이다.

Dropout은 학습 단계에서 각 뉴런의 출력을 확률 $p$로 무작위로 0으로 만들고(끄고), 꺼지지 않은 나머지 뉴런의 출력은 $1/(1-p)$만큼 키워 보정하는 연산이다(inverted dropout). 이렇게 학습 때 미리 보정해두면 각 뉴런 출력의 기대값이 끄기 전과 같아지므로, 평가 때는 아무 보정 없이 모든 뉴런을 그대로 쓰면 된다. 특정 뉴런이 다음 순전파에서도 계속 켜져 있으리라는 보장이 없으므로, 다른 특정 뉴런의 출력에만 강하게 의존하는 가중치 조합(co-adaptation)은 학습 과정에서 살아남기 어렵고, 그 결과 각 뉴런이 비교적 독립적으로도 유의미한 패턴을 검출하도록 가중치가 여러 뉴런에 걸쳐 중복 학습된다. 매 순전파마다 서로 다른 뉴런 부분집합만 활성화된 부분망(sub-network)이 학습되는 셈이므로, 평가 시 전체 뉴런을 켜고 사용하는 것은 학습 중 만들어진 이 다수의 부분망들의 예측을 근사적으로 평균 낸 것과 같은 효과를 낸다(모델 앙상블 근사).

말로 설명한 두 공식(BatchNorm의 $\\hat x = (x-\\mu)/\\sigma$, $\\gamma\\hat x+\\beta$와 Dropout의 "끄고 $1/(1-p)$로 보정")을 아주 작은 숫자 배열에 직접 적용해서 눈으로 확인해보자. 먼저 BatchNorm이다. 배치 크기 4, 채널 3개짜리 활성화 값이 있다고 하자(행이 배치, 열이 채널).

\`\`\`python
import numpy as np

x = np.array([
    [10.0, 1.0, 100.0],
    [12.0, 3.0, 120.0],
    [ 8.0, -1.0, 90.0],
    [14.0, 5.0, 130.0],
])
print("입력 x의 shape:", x.shape, "-> (배치=4, 채널=3)")

mu = x.mean(axis=0)     # axis=0: 배치 방향(세로)으로 평균 -> 채널별 평균 하나씩
sigma = x.std(axis=0)   # axis=0: 배치 방향으로 표준편차 -> 채널별 표준편차
print("채널별 평균 mu:", mu)
print("채널별 표준편차 sigma:", sigma)

x_hat = (x - mu) / sigma   # 각 채널을 자기 평균·표준편차로 정규화
print("\\n정규화 결과 x_hat:\\n", x_hat)
print("정규화 후 채널별 평균:", x_hat.mean(axis=0).round(6))     # -> 0에 가까워야 한다
print("정규화 후 채널별 표준편차:", x_hat.std(axis=0).round(6))  # -> 1에 가까워야 한다

gamma = np.array([1.0, 2.0, 0.5])   # 채널마다 다른 스케일
beta = np.array([0.0, 1.0, -1.0])   # 채널마다 다른 이동
y = gamma * x_hat + beta
print("\\ngamma*x_hat+beta 결과:\\n", y)
\`\`\`

세 번째 채널(100, 120, 90, 130)은 원래 값 자체가 크고 퍼져 있었지만, \`x_hat\`으로 정규화하고 나면 세 채널 모두 평균 0, 표준편차 1인 같은 눈금 위에 놓인다. 그 뒤에 \`gamma\`, \`beta\`를 곱하고 더해 다시 채널마다 다른 스케일·위치로 되돌리는데, 이 \`gamma\`, \`beta\`가 바로 역전파로 학습되는 값이다. 이제 Dropout도 직접 만들어보자.

\`\`\`python
import numpy as np

np.random.seed(0)   # 항상 같은 난수가 나오도록 씨앗값 고정(재현성)
p = 0.5              # 뉴런을 끌 확률
h = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])  # 어떤 층의 출력(뉴런 6개)

mask = (np.random.rand(*h.shape) > p).astype(float)  # p보다 크면 1(생존), 작으면 0(제거)
print("dropout mask:", mask)

h_dropped = h * mask / (1 - p)   # 꺼진 자리는 0, 살아남은 자리는 1/(1-p)배로 보정
print("dropout 적용 후:", h_dropped)
\`\`\`

\`np.random.rand(*h.shape)\`는 0~1 사이의 난수를 \`h\`와 같은 shape으로 만들어내고, \`> p\` 비교를 거치면 참(1)·거짓(0)으로 이루어진 \`mask\`가 된다. \`h * mask\`로 꺼질 자리를 0으로 만든 다음 \`/ (1-p)\`로 살아남은 값들을 키워서 평균적인 크기를 학습 전과 비슷하게 맞춰주는 것이 inverted dropout의 핵심이다. \`p=0.5\`이므로 대략 절반의 뉴런이 꺼지고, 살아남은 뉴런은 2배로 보정된다.

| 기법 | 원리 | 주의 |
| --- | --- | --- |
| BatchNorm | 배치 통계로 정규화 후 $\\gamma, \\beta$ 학습 → 학습 안정·속도 향상 | train/eval 모드 차이(running mean) |
| Dropout | 학습 시 뉴런 무작위 제거 $\\to$ 앙상블 효과 | eval에서 끄기 |
| Weight Decay | L2 페널티 | AdamW에서는 분리형 사용 |
| 데이터 증강 | 뒤집기·크롭·컬러지터로 데이터 다양화 | 라벨 보존 변환만 |
| Early Stopping | 검증 손실 상승 시 중단 | 검증셋 필요 |

표에서 특히 주의할 항목은 BatchNorm과 Dropout의 "주의" 칸이다. 두 기법 모두 학습(train) 때와 평가(eval) 때 서로 다르게 동작하도록 설계되어 있다. BatchNorm은 학습 중에는 그때그때의 배치 통계를 쓰지만, 평가할 때는 배치 하나(심지어 이미지 한 장)에 대해서도 안정적인 결과를 내야 하므로 학습 내내 누적해온 이동평균(running mean, running variance)을 사용한다. Dropout은 평가 때 뉴런을 끄지 않고 전부 사용한다(inverted dropout은 학습 때 이미 $1/(1-p)$로 보정했으므로 평가 때는 추가 보정이 없다). 파이토치에서는 이 전환이 \`net.train()\`과 \`net.eval()\` 호출 하나로 자동 처리되는데, 이걸 깜빡하면 어떤 일이 벌어지는지는 바로 아래 실습에서 직접 확인해본다.

먼저 데이터를 준비하는 부분이다. 학습용 변환(tf_tr)에는 RandomCrop과 RandomHorizontalFlip이라는 데이터 증강이 들어가 있는 반면, 평가용 변환(tf_te)에는 이런 무작위 변형이 전혀 없다는 점을 눈여겨보자. 증강은 모델이 "같은 물체를 여러 각도·위치에서 봐도 같은 답을 내야 한다"는 걸 배우게 하려는 장치이므로 학습 데이터에만 적용하고, 실력을 재는 평가 데이터는 있는 그대로 정직하게 채점해야 한다. 만약 평가 데이터에도 크롭이나 뒤집기를 적용한다면 매번 답이 흔들려서 모델의 실제 성능을 잴 수 없게 된다.

아래 데이터 준비·모델 정의·학습 루프 세 코드는 실제 CIFAR-10 데이터셋을 인터넷에서 내려받고 \`torch\`·\`torchvision\`으로 실제 CNN을 학습시키는 코드다. 이 사이트의 브라우저 실행 환경에는 \`torch\`·\`torchvision\`이 없어 여기서는 실행되지 않는다. [Google Colab](https://colab.research.google.com/)에서 런타임 유형을 GPU로 바꾼 뒤 붙여넣어 실행하자.

\`\`\`python-colab
import torch, torch.nn as nn, torchvision as tv, torchvision.transforms as T
dev = "cuda" if torch.cuda.is_available() else "cpu"
tf_tr = T.Compose([T.RandomCrop(32, padding=4), T.RandomHorizontalFlip(), T.ToTensor(),
                   T.Normalize((0.49,0.48,0.45),(0.25,0.24,0.26))])
tf_te = T.Compose([T.ToTensor(), T.Normalize((0.49,0.48,0.45),(0.25,0.24,0.26))])
tr = tv.datasets.CIFAR10("data", True,  tf_tr, download=True)
te = tv.datasets.CIFAR10("data", False, tf_te, download=True)
trl = torch.utils.data.DataLoader(tr, 128, shuffle=True, num_workers=2)
tel = torch.utils.data.DataLoader(te, 256)
\`\`\`

다음은 모델 구조다. \`block\` 함수 하나가 $\\text{conv} \\to \\text{BatchNorm} \\to \\text{ReLU} \\to \\text{MaxPool}$ 순서로 쌓여 있는데, 이 순서 자체가 의미를 담고 있다. BatchNorm은 합성곱이 막 뱉어낸, 아직 활성화를 통과하기 전의 "날것" 값들의 분포를 정규화해서 평균 0, 분산 1 근처로 맞춰주는 역할을 한다. 이 정규화를 ReLU보다 먼저 적용하는 이유는, ReLU가 0보다 작은 값을 전부 0으로 뭉개버리는 함수이기 때문이다. 만약 정규화되지 않은 값 분포가 한쪽으로 심하게 치우쳐 있다면(예컨대 대부분 음수라면) ReLU를 통과하는 순간 뉴런 대부분이 죽어버릴 위험이 있다. BatchNorm이 먼저 분포를 가지런히 정리해준 다음 ReLU에 넘겨야, ReLU가 "살아있는 값"과 "죽이는 값"을 균형 있게 골라낼 수 있다. 그리고 맨 마지막 Flatten 이후에 Dropout(0.3)을 넣어, 완전연결층으로 넘어가기 직전에 과적합을 한 번 더 억제한다. (이 코드도 바로 위 셀에서 정의한 \`dev\`를 그대로 쓰는 이어지는 코드이므로 위 셀과 마찬가지로 Colab에서만 실행된다.)

\`\`\`python-colab
def block(i, o): return nn.Sequential(nn.Conv2d(i,o,3,padding=1), nn.BatchNorm2d(o), nn.ReLU(), nn.MaxPool2d(2))
net = nn.Sequential(block(3,32), block(32,64), block(64,128), nn.Flatten(),
                    nn.Dropout(0.3), nn.Linear(128*4*4, 10)).to(dev)
opt = torch.optim.AdamW(net.parameters(), 1e-3, weight_decay=5e-4)
\`\`\`

학습 루프에서 가장 먼저 나오는 \`net.train()\`과, 평가 직전의 \`net.eval()\`을 놓치지 말자. 이 두 줄이 하는 일은 위에서 설명한 BatchNorm·Dropout의 학습/평가 모드 전환 그 자체다. \`train()\` 모드에서는 BatchNorm이 지금 들어온 배치의 평균·분산을 쓰면서 동시에 그 값을 누적 이동평균(running mean/var)에 계속 반영하고, Dropout은 실제로 일부 뉴런을 꺼버린다. \`eval()\` 모드로 바뀌면 BatchNorm은 학습 내내 누적해온 이동평균을 그대로 사용하고, Dropout은 아무것도 끄지 않는다. 이 학습 루프 역시 위 두 셀의 \`trl\`, \`tel\`, \`net\`, \`opt\`를 이어받아 실행되는 Colab 전용 코드다.

\`\`\`python-colab
for ep in range(10):
    net.train()
    for x, y in trl:
        x, y = x.to(dev), y.to(dev)
        loss = nn.functional.cross_entropy(net(x), y)
        opt.zero_grad(); loss.backward(); opt.step()
    net.eval(); ok = n = 0
    with torch.no_grad():
        for x, y in tel:
            ok += (net(x.to(dev)).argmax(1).cpu() == y).sum().item(); n += len(y)
    print(ep, loss.item(), ok / n)
\`\`\`

:::warn eval()을 빼먹으면 생기는 일
\`net.eval()\`을 부르지 않고 그대로 평가하면 두 가지 문제가 동시에 생긴다. 첫째, BatchNorm이 테스트 배치(심지어 이미지 한 장짜리 배치)의 통계로 정규화를 시도하면서 배치 크기가 작을수록 평균·분산 추정이 불안정해지고, 같은 이미지를 넣어도 배치 구성에 따라 다른 예측이 나올 수 있다. 둘째, Dropout이 여전히 뉴런을 무작위로 꺼버리므로 같은 입력을 두 번 넣어도 답이 달라지는, 재현 불가능한 모델이 된다. 정확도가 이상하게 들쭉날쭉하거나 학습 때보다 뚜렷이 낮게 나온다면, 가장 먼저 \`net.eval()\`을 잊지 않았는지 확인하는 습관을 들이자.
:::

[[practice]]

### 실습: Dropout의 기대값 보존과 "라벨을 보존하는" 데이터 증강

\`\`\`python
import numpy as np
from sklearn.datasets import load_digits

rng = np.random.default_rng(0)
h = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
p = 0.5

# 1) inverted dropout을 1만 번 적용해 평균을 내면 원래 값과 같아지는가?
outs = np.array([h * (rng.random(h.shape) > p) / (1 - p) for _ in range(10_000)])
print("원래 값        :", h)
print("dropout 평균   :", outs.mean(axis=0).round(2))
print("한 번의 결과   :", outs[0])

# 2) 증강은 "라벨이 바뀌지 않는" 변환만 써야 한다
digits = load_digits()
def show(a):
    for row in a: print("".join(" .:-=+*#%@"[int(v / 16 * 9)] * 2 for v in row))

six = digits.images[digits.target.tolist().index(6)]
print("\\n원본 (레이블 6)"); show(six)
print("\\n위아래 뒤집기: 이것도 여전히 6인가?"); show(np.flipud(six))
print("\\n한 칸 오른쪽 이동: 레이블이 보존되는 증강"); show(np.roll(six, 1, axis=1))
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 1만 번 평균은 원래 값 \`[1, 2, 3, 4, 5, 6]\`과 거의 같다. 그래서 평가 때 보정이 필요 없다. 숫자 6을 위아래로 뒤집으면 9처럼 보인다. 고양이 사진에서는 좌우 뒤집기가 안전한 증강이지만, 숫자 데이터에서는 뒤집기가 **라벨을 바꿔버리는** 잘못된 증강이 될 수 있다. **생각해볼 것:** CIFAR-10(비행기, 자동차, 새, 고양이 …)에 좌우 뒤집기는 괜찮은데 위아래 뒤집기는 왜 잘 쓰지 않을까? 증강은 반드시 훈련 데이터에만 적용한다는 원칙도 다시 확인하자.
:::

## 전이학습과 학습 진단 레시피 {#transfer-diagnostics}

전이학습(transfer learning)은 대규모 데이터셋에서 미리 학습된 모델의 가중치를 그대로, 혹은 일부만 추가로 조정해서 다른(대개 데이터가 적은) 문제에 재사용하는 방법이다. ImageNet처럼 수백만 장의 이미지로 이미 학습된 CNN은, 앞쪽 층에서 가장자리·질감·색 대비처럼 특정 클래스에 국한되지 않는 저수준 시각 특징을 검출하도록 이미 학습되어 있다. 우리가 가진 데이터(예를 들어 CIFAR-10의 클래스당 수백 장)로 이런 저수준 특징 추출 층들을 무작위 초기화 상태부터 다시 학습시키는 것은 연산 낭비일 뿐 아니라, 데이터 수가 적어 오히려 과적합만 심해질 위험이 크다.

전이학습에는 크게 두 가지 방식이 있다. 특징 추출(feature extraction)은 사전학습된 층들을 통째로 얼려버리고(가중치를 고정하고, requires_grad=False로 두어 역전파 시 그 층들의 기울기를 계산하지 않고) 마지막 분류층만 새로 붙여서 우리 문제에 맞게 학습시키는 방식이다. 파인튜닝(fine-tuning)은 여기서 한 걸음 더 나아가, 마지막 층뿐 아니라 사전학습된 층들의 가중치도 아주 작은 학습률로 함께 조금씩 조정하는 방식이다. 데이터가 아주 적을 땐 특징 추출이 안전하고, 데이터가 어느 정도 있고 우리 문제가 원래 학습 데이터(ImageNet)와 다소 다르다면 파인튜닝으로 더 끌어올릴 여지가 있다.

[[diagram:transfer-learning]]

전이학습도 코드로 직접 확인해보자. \`tv.models.resnet18(weights="IMAGENET1K_V1")\`로 이미 ImageNet 130만 장으로 학습된 가중치를 통째로 불러온 다음, \`for p in m.parameters(): p.requires_grad = False\`로 모든 층의 가중치를 얼린다. \`requires_grad\`를 False로 두면 역전파 때 이 파라미터들에 대한 기울기를 아예 계산하지 않으므로, 사전학습된 특징 추출 층의 가중치는 그대로 고정한 채 마지막 분류층 \`m.fc\`만 새로 교체해서(위에서 설명한 특징 추출 방식) 우리 문제(10개 클래스)에 맞게 학습시킬 수 있다. 다만 실전에서 주의할 점이 하나 있다. ResNet18은 원래 $224\\times224$ 크기의 ImageNet 이미지로 학습되었기 때문에 $32\\times32$짜리 CIFAR-10 이미지를 그대로 넣으면 앞쪽 층에서 이미지가 지나치게 빨리 작아져 정보가 소실된다. 그래서 아래 주석에 적힌 대로 입력을 $128\\times128$ 정도로 리사이즈한 뒤 넣어주는 전처리가 함께 필요하다.

\`tv.models.resnet18\`은 인터넷에서 ImageNet 사전학습 가중치를 내려받으므로 이 코드도 Colab에서 실행하자.

\`\`\`python-colab
# 전이학습
m = tv.models.resnet18(weights="IMAGENET1K_V1")
for p in m.parameters(): p.requires_grad = False
m.fc = nn.Linear(512, 10)   # 이후 32x32를 128x128로 리사이즈하여 fc만 학습
\`\`\`

### 학습 진단 체크리스트 (Karpathy Recipe 요약)

모델이 학습되지 않을 때 원인을 특정하지 않은 채 하이퍼파라미터를 무작위로 바꿔가며 재시도하는 방식은 원인 규명에 비효율적이다. Andrej Karpathy가 정리한 이 체크리스트는 확인 비용이 가장 낮고 실패 원인일 확률이 가장 높은 항목부터 순서대로 점검하도록 구성되어 있다. 순서를 건너뛰고 싶은 유혹이 들겠지만, 실제로 실무에서 발생하는 학습 실패의 대다수는 이 앞 순서 어딘가에서 발견된다.

1. 데이터를 눈으로 본다(라벨 오류, 불균형): 코드에 버그가 없어도 데이터 자체가 잘못됐다면 어떤 모델도 소용없다.
2. 초기 손실이 $\\ln(\\text{클래스 수})$와 맞는지 확인한다(10클래스라면 $\\ln 10 \\approx 2.30$). 학습을 시작하기도 전에, 모델이 각 클래스에 균등한 확률(1/10)을 주고 있는지 검산하는 것이다. 여기서 어긋나면 손실 함수나 초기화 자체에 버그가 있다는 뜻이다.
3. 배치 하나에 일부러 **과적합**시켜본다. 데이터 몇 개짜리 미니배치 하나조차 외우지 못한다면, 이는 데이터가 부족해서가 아니라 파이프라인 어딘가(기울기가 안 흐른다거나, 레이블이 밀렸다거나)에 버그가 있다는 강력한 신호다.
4. train/val 곡선으로 과·소적합을 진단하고 그에 맞춰 모델 용량이나 정규화 강도를 조절한다.
5. 한 번에 하나만 바꾼다(ablation): 여러 요소를 동시에 바꾸면 무엇이 효과를 냈는지 알 수 없게 되므로, 원인과 결과를 명확히 추적하려면 반드시 지켜야 하는 원칙이다.

[[practice]]

### 실습: Karpathy 레시피의 두 가지 검사를 직접 해보기

손글씨 숫자(10클래스)를 분류하는 softmax 회귀(층 하나짜리 신경망)로 레시피 2번(초기 손실 검사)과 3번(배치 하나 과적합)을 직접 해보자.

\`\`\`python
import numpy as np
from sklearn.datasets import load_digits

digits = load_digits()
X, y = digits.data / 16.0, digits.target            # (1797, 64), 0~9
rng = np.random.default_rng(0)

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)             # 수치 안정성을 위해 최댓값을 빼준다
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def cross_entropy(P, y):
    return -np.log(P[np.arange(len(y)), y] + 1e-12).mean()

# 레시피 2: 가중치를 아주 작게 초기화하면 모든 클래스에 약 1/10을 주므로 손실 ≈ ln 10
W, b = rng.normal(0, 0.01, (64, 10)), np.zeros(10)
print(f"초기 손실 = {cross_entropy(softmax(X @ W + b), y):.4f}, ln(10) = {np.log(10):.4f}")

W_big = rng.normal(0, 5.0, (64, 10))                 # 일부러 너무 크게 초기화하면?
print(f"큰 초기화의 초기 손실 = {cross_entropy(softmax(X @ W_big), y):.2f}  ← 레시피 2가 잡아내는 버그 신호")

# 레시피 3: 샘플 10개짜리 배치 하나를 100% 외울 수 있는가?
Xs, ys = X[:10], y[:10]
W, b = rng.normal(0, 0.01, (64, 10)), np.zeros(10)
for step in range(300):
    P = softmax(Xs @ W + b)
    G = P.copy(); G[np.arange(10), ys] -= 1; G /= 10   # softmax+교차엔트로피의 기울기 = P - 원핫
    W -= 1.0 * Xs.T @ G
    b -= 1.0 * G.sum(axis=0)
P = softmax(Xs @ W + b)
print(f"배치 10개 과적합: 정확도 {np.mean(P.argmax(1) == ys):.2f}, 손실 {cross_entropy(P, ys):.4f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 작은 초기화의 초기 손실은 2.30 근처로 $\\ln 10$과 거의 같고, 큰 초기화에서는 훨씬 큰 값이 나온다. 배치 10개는 300스텝 안에 정확도 1.00, 손실 0.01 수준까지 외워진다. **해볼 것:** 기울기 줄에서 \`G[np.arange(10), ys] -= 1\`을 실수로 지워보자. 과적합 검사가 어떻게 실패하는가? "배치 하나도 못 외우면 파이프라인 버그"라는 레시피 3의 의미가 이것이다.
:::

## 생성 모델: Autoencoder·VAE·GAN·Diffusion {#generative-models}

지금까지 이번 주에 다룬 CNN은 전부 판별적(discriminative) 모델이었다. 입력 이미지 $x$가 주어졌을 때 정답 클래스 $y$를 예측하는 조건부 확률 $p(y\\mid x)$를 직접 추정하는 모델이라는 뜻이다(1주차에서 다룬 판별적·생성적 모델의 구분을 떠올려보자). 지금부터 다룰 모델들은 방향이 정반대다. 이들은 정답 레이블을 맞히는 대신 데이터 자체의 분포 $p(x)$를 학습해서, 그 분포를 따르는 새로운 데이터를 직접 만들어내는 것을 목표로 한다. 그래서 생성적(generative) 모델이라 부른다. 고양이 사진 수만 장을 보여주면 "이것은 고양이인가 아닌가"를 답하는 것이 아니라, 그 수만 장이 공유하는 통계적 패턴을 학습해서 세상에 없던 새로운 고양이 사진을 그려내는 것이 목표가 된다.

### Autoencoder

오토인코더(Autoencoder)는 인코더(encoder)와 디코더(decoder) 두 부분으로 이루어진 신경망으로, 입력 $x$를 인코더에 통과시켜 원본보다 훨씬 차원이 낮은 잠재 벡터(latent vector) $z$로 압축한 다음, 디코더가 그 $z$만 보고 원래 입력을 최대한 그대로 복원(reconstruction)하도록 학습한다. 학습 목표는 복원 손실(reconstruction loss), 즉 원본 $x$와 복원된 $\\hat x$의 차이를 최소화하는 것이다. 흔히 픽셀별 평균제곱오차(MSE)를 사용한다.

\`\`\`math
\\mathcal{L}_{recon} = \\lVert x - \\hat x \\rVert^2, \\qquad \\hat x = \\text{decoder}(\\text{encoder}(x))
\`\`\`

레이블이 전혀 없는 데이터만으로 학습할 수 있다는(비지도학습, unsupervised learning) 점이 Autoencoder의 실용적인 장점이다. 다만 일반적인 Autoencoder는 "압축했다가 복원하는 능력"만 배울 뿐, 잠재공간 $z$의 특정 좌표에 어떤 의미가 있는지, 혹은 그 공간에서 임의의 점을 하나 골랐을 때 그럴듯한 새 데이터가 나오는지는 전혀 보장하지 않는다. 잠재공간 여기저기에 학습 데이터들이 불규칙하게 흩어져 있어서, 학습 데이터가 없는 빈 틈에서 샘플링하면 디코더가 무엇을 내놓을지 알 수 없다. 그래서 순수한 Autoencoder는 "압축·복원"에는 유용하지만 "생성"에는 그대로 쓰기 어렵다.

### Variational Autoencoder (VAE)

Variational Autoencoder(VAE, 변분 오토인코더)는 바로 이 문제, 즉 "잠재공간에서 마음대로 샘플링해도 그럴듯한 데이터가 나오게 하려면 어떻게 해야 하는가"를 해결하기 위해 잠재공간을 설계하는 방식 자체를 바꾼다. 일반 Autoencoder의 인코더는 입력 $x$를 잠재공간의 점 하나($z$라는 정확한 좌표값)로 매핑하지만, VAE의 인코더는 $x$를 점 하나가 아니라 확률분포(대개 평균 $\\mu$와 표준편차 $\\sigma$로 정의되는 정규분포)로 매핑한다. 즉 "이 입력은 잠재공간의 이 근방 어딘가에 해당한다"는 확률적인 위치를 학습하는 것이다. 디코더에 넣을 $z$는 이 분포에서 실제로 하나를 샘플링해서 얻는다.

\`\`\`math
z \\sim \\mathcal{N}(\\mu(x), \\sigma(x)^2)
\`\`\`

이 확률분포 모델링이 왜 "생성"을 가능하게 하는가? 학습 과정에서 VAE는 복원 손실뿐 아니라, 각 입력이 만들어내는 분포 $\\mathcal{N}(\\mu, \\sigma^2)$가 표준정규분포 $\\mathcal{N}(0, 1)$에 가깝게 유지되도록 만드는 페널티(KL divergence 항)를 함께 최소화한다. 이 페널티 덕분에 서로 다른 입력들이 만들어내는 분포들이 잠재공간 원점 근처에 서로 겹치도록 촘촘하게 모이고, 그 결과 잠재공간 전체가 특정 학습 데이터 없이도 매끄럽게 이어진 하나의 연속적인 공간이 된다. 그래서 학습이 끝난 뒤에는 인코더 없이 표준정규분포 $\\mathcal{N}(0,1)$에서 $z$를 아무렇게나 하나 샘플링해 디코더에 넣기만 해도 그럴듯한 새로운 데이터를 만들어낼 수 있다. 잠재공간에서 샘플링한 뒤 디코더를 통과시키는 이 절차가 곧 VAE의 생성 과정이다.

### GAN (생성적 적대 신경망)

GAN(Generative Adversarial Network, 생성적 적대 신경망)은 완전히 다른 방식으로 생성을 학습한다. GAN은 두 개의 신경망(생성자(Generator) $G$와 감별자(Discriminator) $D$)를 동시에, 그러나 서로 반대되는 목표로 학습시킨다. $G$는 무작위 노이즈 벡터 $z$를 입력받아 가짜 데이터 $G(z)$를 만들어내고, $D$는 자신에게 들어온 데이터가 진짜 학습 데이터 $x$인지 $G$가 만든 가짜 $G(z)$인지를 구별하는 이진 분류기다. 정확히는 다음과 같은 게임이론적 구조로 정의된다. $D$는 자신의 손실함수, 즉 진짜 데이터에는 1(진짜)에 가까운 확률을, 가짜 데이터에는 0(가짜)에 가까운 확률을 내놓도록 만드는 분류 손실을 최소화하도록 학습된다. $G$는 반대로, 자신이 만든 가짜 데이터를 $D$가 "진짜"라고(1에 가깝게) 판정하게 만들어 $D$의 판별을 실패시키는 방향, 즉 $D$를 속이는 방향으로 자신의 손실을 최소화하도록 학습된다. 두 네트워크는 서로의 손실을 놓고 경쟁하며, 이를 하나의 식으로 합쳐 쓰면 다음과 같은 minimax 목적함수가 된다.

\`\`\`math
\\min_{G} \\max_{D} \\; \\mathbb{E}_{x \\sim p_{data}}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))]
\`\`\`

$D$ 입장에서는 이 식의 값을 최대화하려 한다. 진짜 $x$에는 $D(x)$를 1에 가깝게, 가짜 $G(z)$에는 $D(G(z))$를 0에 가깝게 만들수록 $\\log D(x)$와 $\\log(1-D(G(z)))$ 둘 다 커진다. $G$ 입장에서는 정반대로 이 식을 최소화하려 한다. $D$가 자신이 만든 가짜를 진짜로 착각하게 만들수록(즉 $D(G(z))$를 1에 가깝게 만들수록) $\\log(1-D(G(z)))$ 항이 작아지기 때문이다. $G$는 $x\\sim p_{data}$ 항에는 아예 관여할 수 없으므로 오직 두 번째 항만 신경 쓰면 된다. 이 둘을 번갈아 학습시키다 보면 이론적으로는 $G$가 만들어내는 분포가 실제 데이터 분포 $p_{data}$에 점점 가까워지고, 종국에는 $D$가 진짜와 가짜를 구별할 확률이 $1/2$(순전히 찍는 수준)까지 떨어지는 평형 상태에 도달한다. 학습이 잘 이루어졌다는 것은 결국 $D$가 더 이상 $G$를 이길 수 없을 만큼 $G$의 결과물이 실제 데이터와 통계적으로 구분되지 않게 되었다는 뜻이다.

\`\`\`image
src: /images/week4/gan-architecture.png
alt: 노이즈 벡터를 입력받는 Generator와, 진짜/가짜 데이터를 구별하는 Discriminator가 서로 경쟁하며 학습하는 GAN 구조도
caption: Generator는 노이즈 $z$로부터 가짜 데이터를 만들어 Discriminator를 속이려 하고, Discriminator는 진짜 데이터와 Generator가 만든 가짜 데이터를 구별하려 한다. 두 네트워크는 minimax 목적함수를 사이에 두고 함께 학습된다.
credit: Zhang, Lipton, Li & Smola (Dive into Deep Learning), CC BY-SA 4.0, Wikimedia Commons
width: 480
height: 560
\`\`\`

### Diffusion Model

디퓨전 모델(Diffusion Model)은 최근 이미지 생성 분야를 사실상 평정한 접근으로, GAN과는 또 다른 방식으로 생성 문제를 푼다. 핵심 아이디어는 두 개의 반대 방향 과정으로 이루어진다. 순확산 과정(Forward Diffusion)은 원본 이미지 $x_0$에 아주 작은 가우시안 노이즈를 여러 단계(수백~수천 스텝)에 걸쳐 조금씩 계속 더해가서, 마지막 단계 $x_T$에서는 원본의 흔적이 전혀 남지 않은 완전한 무작위 노이즈가 되게 만드는 과정이다. 이 과정 자체에는 학습되는 파라미터가 없다. 정해진 규칙대로 노이즈를 더해나가는 고정된 절차다.

실제로 학습이 필요한 부분은 역확산 과정(Reverse Diffusion)이다. 노이즈투성이 $x_T$에서 시작해, 각 스텝에서 "지금 이 상태에서 노이즈를 아주 조금만 제거하면 어떤 모습이었을까"를 예측해나가며 조금씩 원본에 가까운 이미지로 되돌리는 과정이다. 여기서 신경망이 실제로 학습하는 대상이 미묘한데, 모델은 "원본 이미지가 무엇인가"를 직접 예측하도록 학습되는 것이 아니라 현재 시점 $x_t$에 섞여 있는 노이즈 성분 $\\epsilon$ 자체를 예측하도록 학습된다(Noise Prediction). 노이즈가 정확히 얼마나, 어떤 패턴으로 섞여 있는지만 알아내면 정해진 공식에 따라 예측한 노이즈를 $x_t$에서 걷어내(스케일 조정과 약간의 새 노이즈 추가를 포함한다) 한 단계 덜 흐린 $x_{t-1}$을 계산할 수 있기 때문에, "원본을 직접 그려라"보다 "지금 섞인 노이즈가 뭔지 맞혀라"가 훨씬 안정적으로 학습되는 더 쉬운 문제로 알려져 있다.

이 Noise Prediction을 수행하는 신경망 구조로 흔히 쓰이는 것이 U-Net이다. U-Net은 입력을 점점 작은 해상도로 압축해나가는 인코더 경로와, 다시 원래 해상도로 확장해나가는 디코더 경로로 이루어져 있고, 인코더의 각 해상도 단계에서 나온 특징 지도를 대응하는 디코더의 같은 해상도 단계로 직접 이어붙이는 스킵 연결(skip connection)을 가지고 있다. 이 스킵 연결은 3단계에서 배운 ResNet의 잔차 연결과 문제의식이 맞닿아 있다. 인코더가 압축하는 과정에서 손실되기 쉬운 세밀한 공간 정보(가장자리, 질감 같은 저수준 디테일)를 디코더 쪽으로 곧장 흘려보내, 깊은 인코더-디코더 구조를 거치고도 이미지의 세부 정보가 뭉개지지 않도록 지켜주는 역할을 한다.

다만 Forward/Reverse Diffusion을 원본 이미지와 같은 해상도의 픽셀 공간에서 그대로 수행하면 계산량이 막대하다. 예컨대 $512\\times512$ 크기 이미지의 모든 픽셀에 대해 수백 번의 노이즈 제거 스텝을 반복해야 하기 때문이다. 잠재 확산(Latent Diffusion)은 이 문제를 우회하는 기법으로, 이미지를 먼저 (VAE와 비슷한 방식의) 인코더로 훨씬 작은 압축된 잠재공간으로 줄인 다음, 그 좁은 잠재공간 안에서만 Forward/Reverse Diffusion을 수행하고, 마지막에 디코더로 다시 원래 해상도의 이미지로 복원한다. 픽셀 공간이 아니라 압축된 잠재공간에서 확산을 진행하는 것만으로 계산량이 크게 줄어들어, 일반 소비자용 GPU에서도 고해상도 이미지 생성이 가능해졌다. 널리 쓰이는 Stable Diffusion이 바로 이 Latent Diffusion 방식을 채택한 모델이다.

### Text-to-Image / Image-to-Image: 조건 없는 생성에서 조건부 생성으로

지금까지 설명한 VAE·GAN·Diffusion Model은 전부 "어떤 그럴듯한 데이터를 만들어내라"는 조건 없는(unconditional) 생성이었다. 실제로 우리가 접하는 이미지 생성 서비스는 대부분 "고양이가 우주복을 입고 있는 그림을 그려줘"처럼 텍스트로 원하는 결과를 지정한다. 이렇게 원하는 조건(condition)을 함께 입력해 그 조건에 맞는 데이터를 생성하도록 만드는 것을 조건부 생성(conditional generation)이라 부른다. Text-to-Image 모델은 앞서 설명한 Diffusion Model의 Reverse Diffusion 과정에 문장을 벡터로 바꾼 텍스트 임베딩을 각 노이즈 제거 단계마다 함께 넣어주어, 모델이 "지금 이 텍스트 조건에 맞는 노이즈를 예측하라"는 조건부 Noise Prediction을 학습하게 만든 것이다. Image-to-Image는 조건이 텍스트 대신(혹은 텍스트와 함께) 원본 이미지 자체가 되는 경우로, 이미 있는 이미지의 스타일을 바꾸거나 일부를 수정하는 데 같은 원리가 쓰인다. 텍스트와 이미지를 함께 다루는 이 조건부 생성의 메커니즘은 7주차 멀티모달 단계에서 텍스트·이미지 임베딩을 어떻게 하나의 공간에 정렬시키는지를 배우면서 조금 더 구체적으로 다시 다루게 된다.

[[practice]]

### 실습: PCA를 "선형 오토인코더"로, 그리고 순확산 과정 흉내내기

PCA는 인코더와 디코더가 모두 선형인 가장 단순한 오토인코더로 볼 수 있다. 64차원 숫자 이미지를 $k$차원으로 압축했다가 복원할 때 복원 오차가 어떻게 변하는지 보자. 이어서 Diffusion의 순확산 공식 $x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\epsilon$으로 이미지에 노이즈를 단계적으로 섞어, 원본과의 상관계수가 어떻게 떨어지는지 확인한다.

\`\`\`python
import numpy as np
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA

digits = load_digits()
X = digits.data / 16.0                                  # (1797, 64)

print(f"{'잠재 차원 k':>10} {'복원 MSE':>9} {'보존된 분산':>10}")
for k in [2, 5, 10, 20, 40]:
    pca = PCA(n_components=k).fit(X)                     # 인코더: 64 → k
    X_rec = pca.inverse_transform(pca.transform(X))      # 디코더: k → 64
    print(f"{k:10d} {np.mean((X - X_rec) ** 2):9.4f} {pca.explained_variance_ratio_.sum():10.3f}")

# 순확산: 원본 x0에 노이즈를 점점 더 섞는다 (학습되는 파라미터 없음)
rng = np.random.default_rng(0)
x0 = digits.images[0] / 16.0 * 2 - 1                     # 픽셀을 [-1, 1] 범위로
betas = np.linspace(1e-4, 0.35, 10)                      # 스텝마다 섞을 노이즈의 양
alpha_bar = np.cumprod(1 - betas)                        # ᾱ_t: 원본 신호가 남아 있는 비율
print(f"\\n{'t':>2} {'ᾱ_t':>6} {'원본과의 상관(300회 평균)':>18}")
for t in range(10):
    corrs = []
    for _ in range(300):                                   # 픽셀이 64개뿐이라 한 번의 샘플은 들쭉날쭉하므로 평균을 낸다
        eps = rng.normal(size=x0.shape)
        xt = np.sqrt(alpha_bar[t]) * x0 + np.sqrt(1 - alpha_bar[t]) * eps
        corrs.append(np.corrcoef(x0.ravel(), xt.ravel())[0, 1])
    print(f"{t:2d} {alpha_bar[t]:6.3f} {np.mean(corrs):18.3f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 잠재 차원이 2 → 40으로 커질수록 복원 오차가 줄고 보존된 분산이 약 0.29 → 0.99로 늘어난다. 차원을 줄일수록 정보를 잃는다는 오토인코더의 트레이드오프다. 순확산에서는 $\\bar\\alpha_t$가 1에서 약 0.13까지 줄면서 원본과의 평균 상관이 1에서 약 0.25로 꾸준히 떨어진다. Reverse Diffusion은 이 과정을 거꾸로, 매 스텝 섞인 노이즈 $\\epsilon$을 예측해 걷어내도록 학습한다. **생각해볼 것:** PCA로 2차원까지 줄인 잠재공간에서 아무 점이나 골라 복원하면 그럴듯한 숫자가 나올까? 일반 오토인코더가 "생성"에 약한 이유와 VAE의 KL 항이 하는 일을 연결해보자.
:::
`,
  sections,
  quiz: [
    { id: "w4-q1", question: "입력 $32\\times32$, 커널 $5\\times5$, padding 2, stride 1의 출력 크기는? stride 2이면?" },
    { id: "w4-q2", question: "$5\\times5$ 입력에 $3\\times3$ 커널을 padding 0으로 적용할 때와 padding 1로 적용할 때 출력 크기 차이를 계산하고, padding이 왜 'same' 크기를 만드는지 설명하라." },
    { id: "w4-q3", question: "$3\\times3$ conv 두 층을 쌓은 수용영역 크기는? 세 층이면? 점프(jump) j와 수용영역 갱신식을 이용해 계산 과정을 적어라." },
    { id: "w4-q4", question: "$2\\times2$ 영역 [[1,3],[2,4]]에 Max Pooling과 Average Pooling을 각각 적용한 결과는? 두 결과가 다른 이유를 '패턴의 존재 여부'와 '전체 강도'라는 관점에서 설명하라." },
    { id: "w4-q5", question: "Max Pooling 대신 stride 2인 합성곱(strided convolution)을 쓰는 최근 아키텍처의 흐름은 정보 손실 관점에서 어떻게 설명할 수 있는가?" },
    { id: "w4-q6", question: '"56층 plain 네트워크가 20층보다 학습 오차도 높다"는 degradation 문제는 왜 단순한 과적합으로 설명할 수 없는가?' },
    { id: "w4-q7", question: '잔차 블록의 역전파에서 "+1" 항의 의미는?' },
    { id: "w4-q8", question: "BatchNorm을 사용하는 모델을 eval()로 바꾸지 않으면 생기는 일은?" },
    { id: "w4-q9", question: "Dropout이 학습 때만 뉴런을 끄고 평가 때는 전부 켜는 이유를 앙상블 관점에서 설명하라." },
    { id: "w4-q10", question: "10클래스 분류 초기 손실이 5.0이라면 무엇을 의심하는가?" },
    { id: "w4-q11", question: "LeNet이 오늘날의 CNN과 이미 공유하고 있는 기본 골격은 무엇이며, LeNet 당시에는 왜 이 구조를 더 크고 복잡한 이미지로 확장하기 어려웠는가?" },
    { id: "w4-q12", question: "AlexNet이 2012년 ImageNet 대회에서 딥러닝 붐을 촉발할 수 있었던 세 가지 요소는 무엇이며, 각각이 어떤 문제를 해결했는가?" },
    { id: "w4-q13", question: "채널 수 $C=64$일 때 $7\\times7$ conv 한 층과 $3\\times3$ conv 세 층의 파라미터 수를 각각 계산하고, 두 경우의 수용영역이 왜 같은지, 그런데도 왜 작은 커널을 깊게 쌓는 쪽이 유리한지 설명하라." },
    { id: "w4-q14", question: "Object Detection은 Image Classification과 비교했을 때 어떤 추가적인 예측을 더 해야 하는가?" },
    { id: "w4-q15", question: "Semantic Segmentation을 '픽셀 단위 분류'로 정의하고, 이것이 Object Detection과 근본적으로 어떻게 다른지 설명하라." },
    { id: "w4-q16", question: "Vision Transformer(ViT)는 이미지를 어떻게 Transformer의 입력 형태로 바꾸는가? 이 과정에서 CNN의 어떤 귀납편향이 사라지는가?" },
    { id: "w4-q17", question: "일반 Autoencoder와 Variational Autoencoder(VAE)는 인코더가 입력을 잠재공간의 무엇으로 매핑하는지에서 갈린다. 그 차이를 설명하고, 이 차이가 왜 VAE에서는 '새 데이터 생성'을 가능하게 하는지 설명하라." },
    { id: "w4-q18", question: "GAN의 minimax 목적함수 $\\min_{G}\\max_{D}\\;\\mathbb{E}_{x\\sim p_{data}}[\\log D(x)] + \\mathbb{E}_{z\\sim p_z}[\\log(1-D(G(z)))]$에서 Discriminator와 Generator는 각각 이 값을 최대화/최소화하기 위해 무엇을 하려고 하는가?" },
    { id: "w4-q19", question: "Diffusion Model의 Forward Diffusion과 Reverse Diffusion을 각각 정의하고, Reverse Diffusion에서 신경망이 실제로 예측하도록 학습되는 대상(Noise Prediction)이 무엇인지 설명하라." },
    { id: "w4-q20", question: "U-Net의 스킵 연결이 4주차에서 배운 ResNet의 잔차 연결과 어떤 문제의식을 공유하는지 설명하고, Latent Diffusion이 픽셀 공간 대신 잠재공간에서 확산을 수행함으로써 무엇을 얻는지 설명하라." },
  ],
  worksheet: [
    { label: '① 오늘의 질문: "왜 이미지엔 FC 대신 합성곱인가?"', hint: "FC층과 합성곱층의 파라미터 수 차이를 예로 들어 설명해 보십시오." },
    { label: "② 키워드 6개", hint: "합성곱, ResNet, BatchNorm, Dropout, 전이학습, 학습 진단 중 골라도 좋고 직접 추가해도 좋습니다." },
    { label: "③ 그림: 합성곱 연산, 잔차 블록, 전이학습 구조 중 2개", hint: "화살표로 텐서가 어떻게 흘러가는지 직접 그려 보십시오." },
    { label: "④ 수식: 출력 크기 공식, 잔차 기울기 (F'+1)", hint: "숫자를 하나 정해 직접 대입해 계산해 보십시오." },
    { label: '⑤ 설명하기: "학습이 안 될 때 나는 어떤 순서로 원인을 찾을 것인가?" (Recipe 기반)', hint: "비유를 하나 이상 사용해 보십시오. (예: 의사의 문진 순서)" },
    { label: "⑥ 막힌 곳 / 보완", hint: "책을 펴서 확인한 뒤, 다른 색으로 보완한 내용을 적어 보십시오." },
  ],
  assignment: week4Assignment,
  assignmentMaxScore: 10,
  dueNote: "제출 기한: 일요일 23:59",
};

export default week4;
