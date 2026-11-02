import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/convolution";

export default defineLesson({
  id: "convolution",
  title: "합성곱",
  tier: "core",
  concepts: ["cnn"],
  goal: "합성곱의 계산 과정과 출력 크기 공식 $\\lfloor (N + 2P - K)/S \\rfloor + 1$을 적용하고, 지역성·파라미터 공유가 FC층 대비 파라미터를 얼마나 줄이는지 계산할 수 있다.",
  why: "",
  body: md`
convolution(합성곱) 연산은 크기 $K \times K$인 학습 가능한 커널(kernel, 필터(filter)라고도 부른다)을 입력 특징 지도 위에서 정해진 stride(보폭)만큼씩 이동시키며, 각 위치에서 커널과 겹치는 영역의 원소별 곱의 합(내적, dot product)을 계산해 출력 특징 지도의 한 원소를 생성하는 연산이다. 예를 들어 $3 \times 3$짜리 커널 하나는 학습을 거치면 "세로 방향 가장자리" 같은 특정 국소 패턴에 강하게 반응하도록(그 패턴이 나타난 위치에서 내적값이 커지도록) 가중치가 조정된다. 커널을 입력의 왼쪽 위 모서리부터 시작해 stride만큼씩 오른쪽으로, 한 행이 끝나면 다시 아래로 이동시키면서 이 내적 계산을 반복하면, 그 결과들이 입력과 같은 격자 배열을 이루며 특징 지도(feature map)를 구성한다. 이때 커널의 가중치는 슬라이딩하는 모든 위치에서 동일하게 재사용된다. 즉 위치와 무관하게 파라미터를 공유한다(parameter sharing). 고양이 귀의 가장자리에 반응하도록 학습된 커널이라면, 그 귀가 이미지의 어느 위치에 있어도 동일한 가중치로 검출할 수 있어야 하기 때문이다.

[[diagram:conv-operation]]

위 다이어그램의 출력 칸을 하나씩 클릭해보면, 커널이 입력 위 정확히 어느 위치에서 슬라이딩해와 그 값을 만들어냈는지 눈으로 확인할 수 있다. 출력의 각 칸은 입력 전체를 보는 것이 아니라 커널 크기만큼의 좁은 영역만 들여다본다는 사실을, 말로 듣는 것보다 직접 클릭하며 확인하는 편이 훨씬 오래 남는다.

이 슬라이딩이 몇 칸을 건너뛸지(stride), 그리고 가장자리를 얼마나 여유 있게 감쌀지(padding)에 따라 출력의 크기가 달라지는데, 그 관계를 정리한 것이 아래 공식이다.

\`\`\`math
N_{out} = \left\lfloor \dfrac{N + 2P - K}{S} \right\rfloor + 1
\`\`\`

:::example 예제: 출력 크기 공식 손으로 검산하기
$5 \times 5$ 입력에 $3 \times 3$ 커널을 적용한다고 하자.

- padding 없이(P=0), stride 1: $\lfloor(5+0-3)/1\rfloor+1 = \lfloor2/1\rfloor+1 = 2+1 = \mathbf{3\times3}$
- padding 1(P=1), stride 1: $\lfloor(5+2-3)/1\rfloor+1 = \lfloor4/1\rfloor+1 = 4+1 = \mathbf{5\times5}$. 입력과 출력 크기가 그대로 유지된다. 이런 padding을 흔히 "same padding"이라 부른다.
- padding 없이(P=0), stride 2: $\lfloor(5+0-3)/2\rfloor+1 = \lfloor2/2\rfloor+1 = 1+1 = \mathbf{2\times2}$이다. stride가 커지면 커널이 크게 건너뛰므로 출력이 더 작아진다.

숫자를 직접 공식에 넣어보면 역할 분담이 뚜렷하게 보인다. padding은 "크기를 유지할지 줄일지"를 조절하고, stride는 "얼마나 빠르게 줄일지"를 조절한다.
:::

[[diagram:conv-padding-stride]]

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
print("x[0:2, 0:2]:\n", x[0:2, 0:2])  # 행 0~1, 열 0~1로 잘라낸 부분(슬라이싱)
\`\`\`

\`x.shape\`는 배열의 크기를 (행, 열) 튜플로 알려준다. \`x[0:2, 0:2]\`처럼 콤마로 구분된 두 개의 \`시작:끝\` 범위를 넣으면 배열의 일부 사각형 영역만 잘라낼 수 있는데, 이를 슬라이싱(slicing)이라 부른다. 합성곱은 결국 "입력 배열에서 커널 크기만큼의 작은 사각형을 계속 잘라내며 계산을 반복하는" 연산이므로, 이 슬라이싱 문법이 핵심 도구가 된다. 그리고 "행마다, 그 안에서 다시 열마다" 처럼 반복문 안에 반복문을 겹쳐 쓰는 것을 중첩 for문이라 부르는데, 합성곱 출력의 각 칸(행, 열)을 하나씩 채우려면 바로 이 중첩 for문으로 출력의 모든 위치를 순회해야 한다.

이제 위에서 손으로 계산한 출력 크기 공식이 실제로 맞는지, $5\times5$ 입력에 $3\times3$ 커널을 직접 합성곱시켜서 확인해보자. 커널은 세로선에 강하게 반응하도록 왼쪽 열은 $+1$, 가운데 열은 $0$, 오른쪽 열은 $-1$로 채운 값을 쓴다.

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
print("\npadding=0, stride=1 출력 shape:", out1.shape)  # 공식대로 3x3 이어야 한다
print(out1)

out2 = conv2d(x, k, stride=1, padding=1)
print("\npadding=1, stride=1 출력 shape:", out2.shape)  # 공식대로 5x5(입력과 동일) 이어야 한다
print(out2)

out3 = conv2d(x, k, stride=2, padding=0)
print("\npadding=0, stride=2 출력 shape:", out3.shape)  # 공식대로 2x2 이어야 한다
print(out3)
\`\`\`

\`conv2d\` 함수를 한 줄씩 살펴보면 이렇다. \`window = x[i*stride:i*stride+K, j*stride:j*stride+K]\`가 바로 "커널이 지금 이 위치를 보고 있다"는 것을 슬라이싱으로 표현한 줄이다. \`i*stride\`는 커널이 stride만큼씩 건너뛰며 이동한 결과 지금 몇 번째 행에 와 있는지를 계산한 것이고, 거기서부터 커널 크기 \`K\`만큼을 잘라낸다. \`window * k\`는 잘라낸 영역과 커널을 같은 위치끼리 곱하는 원소별 곱셈(elementwise multiplication)이고, \`np.sum(...)\`으로 그 결과를 전부 더하면 이 단계 첫머리에서 정의한 "원소별 곱의 합(내적)"이 정확히 계산된다. 코드를 실행해서 나온 세 출력의 shape이 각각 (3,3), (5,5), (2,2)로, 앞서 예제에서 공식으로 손 계산했던 값과 정확히 일치하는지 직접 확인해보자.

출력의 왼쪽 위 한 칸만 손으로 계산해 보자. 커널이 입력의 왼쪽 위 $3 \times 3$ 창 $\begin{bmatrix}1&1&1\\0&1&1\\0&0&1\end{bmatrix}$에 놓이면, 커널의 왼쪽 열(+1)과 곱해지는 값의 합은 $1 + 0 + 0 = 1$, 오른쪽 열(−1)과 곱해지는 값의 합은 $1 + 1 + 1 = 3$이라 결과는 $1 - 3 = -2$다. "왼쪽보다 오른쪽이 밝다"는 세로 경계가 음수로 잡힌 것이다. 출력 \`out1\`의 첫 값이 정말 −2인지 확인해 보자.

### 채널이 여러 개일 때

지금까지는 흑백(채널 1개) 이미지였다. 컬러 사진은 R·G·B 세 장의 격자가 겹친 $H \times W \times 3$ 배열이다. 이때 커널 하나도 **입력 채널 수만큼의 깊이**를 가진 $3 \times 3 \times 3$ 덩어리가 되고, 세 채널에서 각각 곱한 값을 모두 더해 **출력 한 칸**을 만든다. 즉 커널 하나는 채널이 몇 개든 출력 채널 **하나**를 만든다. 출력 채널을 64개 원하면 커널을 64개 쓰면 된다.

[[diagram:conv-channels]]

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
x = rng.integers(0, 3, size=(3, 4, 4)).astype(float)   # 입력: 채널 3(R·G·B), 4×4
kernels = rng.integers(-1, 2, size=(2, 3, 3, 3)).astype(float)   # 커널 2개, 각 커널은 3채널 × 3×3
bias = np.array([0.0, 1.0])

out = np.zeros((2, 2, 2))                     # 출력: 채널 2(커널 수), 2×2
for o in range(2):                            # 출력 채널(커널)마다
    for i in range(2):
        for j in range(2):
            window = x[:, i:i + 3, j:j + 3]   # 3채널을 한꺼번에 잘라낸 3×3×3 창
            out[o, i, j] = np.sum(window * kernels[o]) + bias[o]   # 세 채널의 곱을 모두 더한 값 하나
print("입력", x.shape, "→ 커널", kernels.shape, "→ 출력", out.shape)
print("파라미터 수:", kernels.size + bias.size)   # 2 × (3×3×3) + 2 = 56
print(out)
\`\`\`

입력 $(3, 4, 4)$에 커널 2개를 쓰면 출력은 $(2, 2, 2)$, 파라미터는 커널 $2 \times 27$개와 편향 2개를 합쳐 56개다. 일반적으로 합성곱층의 파라미터는 $(K \times K \times C_{in} + 1) \times C_{out}$이고, 이 식이 아래 예제의 1,792개가 나오는 계산이다.

합성곱이라는 구조 자체에는 세 가지 가정이 이미 녹아 있는데, 이를 귀납편향(inductive bias)이라 부른다. 첫째는 지역성(locality)이다. 이미지의 한 픽셀이 의미를 가지려면 대개 바로 주변 픽셀들과의 관계만 보면 충분하다는 가정이다. 반대편 모서리 픽셀까지 한꺼번에 봐야만 알 수 있는 패턴은 드물다. 둘째는 평행이동 등변성(translation equivariance)이다. 고양이 귀가 사진 왼쪽에 있든 오른쪽에 있든 "귀"라는 사실은 변하지 않으므로, 같은 커널이 어느 위치에서나 똑같이 작동해야 한다는 가정이다. 셋째는 이 둘의 자연스러운 귀결인 파라미터 공유다. 위치마다 서로 다른 가중치를 두는 대신 커널 하나를 사진 전체에서 재사용하기 때문에, FC층과는 비교가 안 될 만큼 파라미터 수가 줄어든다.

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
$224\times224\times3$ 크기의 컬러 사진을 입력받아 64개의 특징을 뽑아낸다고 하자.

- **합성곱층**($3\times3$ 커널, 64채널): 커널 하나는 $3\times3\times3$(가로·세로·입력채널)개의 가중치를 가지고, 이런 커널이 64개 있으니 $3\times3\times3\times64 = 1{,}728$개, 채널마다 편향(bias) 64개를 더하면 총 **1,792개**의 파라미터로 끝난다. 그리고 이 커널 세트 하나가 사진 어디를 훑든 그대로 재사용된다.
- **완전연결(FC)층**: 같은 입력($224\times224\times3 = 150{,}528$개의 숫자)을 64개의 출력 노드에 완전히 연결하면 $150{,}528\times64 + 64 = \mathbf{9{,}633{,}856}$개, 거의 963만 개의 파라미터가 필요하다.

똑같이 "64개의 특징을 뽑는다"는 목표인데 파라미터 수는 약 5,400배 차이가 난다. FC층은 사진의 모든 픽셀 조합마다 각기 다른 가중치를 배워야 하지만, 합성곱층은 "어디서나 통하는 작은 패턴 탐지기" 하나만 배우면 되기 때문이다. 그리고 층이 깊어질수록 이 작은 탐지기들이 서로 겹쳐 쌓이면서, 처음에는 가장자리 정도만 보던 것이 점점 질감, 눈·코·귀 같은 부분, 마지막엔 "고양이 전체"라는 객체 수준의 패턴까지 알아보게 된다. 이를 두고 수용영역(receptive field)이 층을 거칠수록 확대된다고 표현한다.
:::

[[diagram:fc-vs-conv]]

실제 프레임워크가 이중 반복문 대신 합성곱을 행렬 곱 하나로 계산하는 방법(im2col), 합성곱의 역전파가 왜 또 하나의 합성곱인지는 심화 과정의 「합성곱의 계산」 단계에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "입력 $28\\times28$, 커널 $5\\times5$, padding 0, stride 1인 합성곱의 출력 크기는?",
      choices: ["$28\\times28$", "$24\\times24$", "$23\\times23$", "$12\\times12$"],
      answer: 1,
      explanation: "$\\lfloor(28 + 0 - 5)/1\\rfloor + 1 = 24$.",
    },
    {
      key: "c2",
      question: "입력 채널 3, $3\\times3$ 커널 16개(출력 채널 16)인 합성곱층의 파라미터 수(편향 포함)는?",
      choices: ["$144$", "$448$", "$432$", "$9$"],
      answer: 1,
      explanation: "$3\\times3\\times3\\times16 = 432$개의 가중치 + 편향 16개 $= 448$개. 입력 이미지 크기와 무관하다는 점이 핵심이다.",
    },
    {
      key: "c3",
      question: "합성곱의 \"파라미터 공유\"가 의미하는 것은?",
      choices: ["모든 층이 같은 커널을 쓴다", "같은 커널 가중치를 이미지의 모든 위치에서 재사용한다", "모든 채널이 같은 값을 가진다", "학습 중 가중치가 바뀌지 않는다"],
      answer: 1,
      explanation: "어디서나 같은 패턴 검출기를 쓰므로 위치가 바뀌어도 같은 패턴을 찾을 수 있고(평행이동 등변성), 파라미터 수가 크게 줄어든다.",
    },
    {
      key: "c4",
      question: "입력이 $32 \\times 32 \\times 3$이고 $5 \\times 5$ 커널을 10개 쓰는 합성곱층(padding 0, stride 1)의 출력 shape은?",
      choices: ["$28 \\times 28 \\times 10$", "$28 \\times 28 \\times 3$", "$32 \\times 32 \\times 10$", "$28 \\times 28 \\times 30$"],
      answer: 0,
      explanation: "공간 크기는 $32 - 5 + 1 = 28$이고, 커널 하나가 (입력 채널 3개를 모두 합쳐) 출력 채널 하나를 만들므로 출력 채널은 커널 수인 10이다.",
    },
    {
      key: "c5",
      question: "입력 채널 3, 출력 채널 64인 $3 \\times 3$ 합성곱에서 커널 **하나**의 가중치 개수는?",
      choices: ["27개", "9개", "576개", "1,728개"],
      answer: 0,
      explanation: "커널 하나는 입력 채널 수만큼의 깊이를 가져 $3 \\times 3 \\times 3 = 27$개다. 이런 커널이 64개라 전체 가중치는 1,728개(편향 포함 1,792개)다.",
    },
    {
      key: "c6",
      question: "RGB 입력(3채널)에 $5\\times5$ 커널 32개를 쓰는 합성곱층의 파라미터 수(편향 포함)는?",
      choices: ["2,432", "2,400", "832", "800"],
      answer: 0,
      explanation: "커널 하나는 $5 \\times 5 \\times 3 = 75$개의 가중치를 가지고, 32개이므로 2,400개, 출력 채널마다 편향 1개씩 32개를 더해 2,432개입니다. 입력 이미지의 가로·세로 크기와는 무관합니다(파라미터 공유).",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
def out_size(n, k, s=1, p=0):
    return (n + 2 * p - k) // s + 1

print(out_size(5, 3), out_size(5, 3, p=1), out_size(5, 3, s=2), out_size(28, 5))
`,
      expected: "3 5 2 24",
      explanation: "$\\lfloor (5-3)/1 \\rfloor + 1 = 3$, 패딩 1이면 $\\lfloor (5+2-3)/1 \\rfloor + 1 = 5$(same padding), 보폭 2면 $\\lfloor 2/2 \\rfloor + 1 = 2$, $28 \\times 28$에 $5 \\times 5$면 24입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "입력 $32\\times32$, 커널 $5\\times5$, padding 2, stride 1의 출력 크기는? stride 2이면?",
      answer: md`
$\lfloor(32+4-5)/1\rfloor+1 = 32$ (입력과 같은 크기). stride 2이면 $\lfloor 31/2 \rfloor+1 = 16$.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "$5\\times5$ 입력에 $3\\times3$ 커널을 padding 0으로 적용할 때와 padding 1로 적용할 때 출력 크기 차이를 계산하고, padding이 왜 'same' 크기를 만드는지 설명하라.",
      answer: md`
padding 0: $\lfloor (5+0-3)/1 \rfloor+1=3 \to 3\times 3$. padding 1: $\lfloor (5+2-3)/1 \rfloor+1=5 \to 5\times 5$(입력과 동일). padding이 커널 절반만큼 가장자리를 채워주므로 $K=3$, $P=1$이면 출력이 입력과 같은 크기로 유지되는 'same padding'이 된다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "CS231n — Convolutional Neural Networks", url: "https://cs231n.github.io/convolutional-networks/", note: "합성곱·padding·stride·파라미터 수를 그림과 예제로 (영문)" },
    { title: "CNN Explainer (Georgia Tech)", url: "https://poloclub.github.io/cnn-explainer/", note: "실제 CNN의 각 층 출력을 브라우저에서 클릭하며 보는 인터랙티브 시각화" },
  ],
});
