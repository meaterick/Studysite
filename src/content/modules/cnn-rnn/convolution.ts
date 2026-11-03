import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/convolution";

export default defineLesson({
  id: "convolution",
  title: "합성곱",
  tier: "core",
  concepts: ["cnn"],
  goal: "합성곱의 계산 과정과 출력 크기 공식 $\\lfloor (N + 2P - K)/S \\rfloor + 1$을 적용하고, 채널이 여러 개인 합성곱층의 파라미터 수와 지역성·파라미터 공유가 완전연결층보다 파라미터를 줄이는 정도를 계산한다.",
  why: "이미지 분류, 물체 검출, 분할 모델의 기본 연산이 합성곱이다([[lesson:cnn-architectures]]). 합성곱층의 출력 크기와 파라미터 수를 계산할 수 있어야 모델을 설계할 때 층의 모양을 맞추고 메모리와 계산량을 추정할 수 있다.",
  body: md`
### 합성곱 연산

**합성곱**(convolution)은 크기 $K \times K$인 학습 가능한 **커널**(kernel, 필터라고도 한다)을 입력 위에서 정해진 간격만큼 이동시키며, 각 위치에서 커널과 겹치는 영역의 원소별 곱을 모두 더해 출력의 한 칸을 계산하는 연산이다. 커널을 입력의 왼쪽 위에서 시작해 오른쪽으로 옮기고, 한 행이 끝나면 아래로 옮기며 계산을 반복하므로 출력도 격자 모양의 배열이 된다. 이 출력을 **특성 맵**(feature map)이라 한다.

커널의 가중치는 모든 위치에서 같은 값을 쓴다(**파라미터 공유**, parameter sharing). 학습을 거치면 $3 \times 3$ 커널 하나는 세로 방향의 경계처럼 특정한 국소 패턴이 있는 위치에서 큰 값을 출력하도록 가중치가 정해지고, 같은 패턴이 이미지의 어느 위치에 있어도 같은 가중치로 검출된다.

[[diagram:conv-operation]]

그림에서 출력 칸을 선택하면 그 값을 계산한 입력 영역이 표시된다. 출력의 각 칸은 입력 전체가 아니라 커널 크기만큼의 영역만으로 계산된다.

### 출력 크기

커널이 한 번에 이동하는 칸 수를 **stride**($S$), 입력의 가장자리에 0을 채우는 폭을 **padding**($P$)이라 한다. 입력 크기가 $N$, 커널 크기가 $K$일 때 출력 크기는 다음과 같다.

\`\`\`math
N_{out} = \left\lfloor \dfrac{N + 2P - K}{S} \right\rfloor + 1
\`\`\`

$5 \times 5$ 입력에 $3 \times 3$ 커널을 적용하면 다음과 같다.

| padding | stride | 계산 | 출력 |
| --- | --- | --- | --- |
| 0 | 1 | $\lfloor (5 + 0 - 3)/1 \rfloor + 1 = 3$ | $3 \times 3$ |
| 1 | 1 | $\lfloor (5 + 2 - 3)/1 \rfloor + 1 = 5$ | $5 \times 5$ (입력과 같음) |
| 0 | 2 | $\lfloor (5 + 0 - 3)/2 \rfloor + 1 = 2$ | $2 \times 2$ |

stride가 1일 때 $P = (K - 1)/2$로 padding하면 출력 크기가 입력과 같아진다. 이를 **same padding**이라 한다. padding은 출력 크기를 유지할지 줄일지를, stride는 출력 크기를 얼마나 빠르게 줄일지를 정한다.

[[diagram:conv-padding-stride]]

### NumPy로 구현하기

$5 \times 5$ 입력에 $3 \times 3$ 커널을 합성곱해 출력 크기 공식을 확인한다. 커널은 왼쪽 열이 $+1$, 가운데 열이 $0$, 오른쪽 열이 $-1$이어서 왼쪽 값의 합에서 오른쪽 값의 합을 뺀다(세로 방향 경계 검출). 2차원 배열의 슬라이싱은 [[lesson:array-indexing]]에서 다뤘다.

\`\`\`python
import numpy as np

x = np.array([
    [1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1],
    [0, 0, 1, 1, 0],
    [0, 1, 1, 0, 0],
], dtype=float)
k = np.array([
    [1, 0, -1],
    [1, 0, -1],
    [1, 0, -1],
], dtype=float)                                     # 세로 방향 경계를 검출하는 커널

def conv2d(x, k, stride=1, padding=0):
    if padding > 0:
        x = np.pad(x, padding)                      # 가장자리를 0으로 padding만큼 채운다
    H, W = x.shape
    K = k.shape[0]
    out_h = (H - K) // stride + 1                   # 출력 크기 공식
    out_w = (W - K) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            window = x[i*stride:i*stride+K, j*stride:j*stride+K]   # 커널이 놓인 입력 영역
            out[i, j] = np.sum(window * k)          # 원소별 곱의 합
    return out

out1 = conv2d(x, k)
print(out1.shape, conv2d(x, k, padding=1).shape, conv2d(x, k, stride=2).shape)   # (3, 3) (5, 5) (2, 2)
print(out1)
# [[-2.  0.  2.]
#  [-3. -2.  2.]
#  [-3. -1.  2.]]
\`\`\`

\`window = x[i*stride:i*stride+K, j*stride:j*stride+K]\`는 출력의 $(i, j)$ 칸에 대응하는 입력 영역을 잘라낸다. \`i*stride\`는 그 영역의 시작 행이다. \`window * k\`는 같은 위치의 원소끼리 곱하고, \`np.sum\`으로 모두 더하면 출력 한 칸의 값이 된다. 세 출력의 모양 (3, 3), (5, 5), (2, 2)는 공식의 결과와 같다.

출력의 왼쪽 위 칸을 손으로 계산한다. 커널이 입력의 왼쪽 위 $3 \times 3$ 영역 $\begin{bmatrix}1&1&1\\0&1&1\\0&0&1\end{bmatrix}$에 놓이면, 커널의 왼쪽 열($+1$)과 곱해지는 값의 합은 $1 + 0 + 0 = 1$, 오른쪽 열($-1$)과 곱해지는 값의 합은 $1 + 1 + 1 = 3$이므로 결과는 $1 - 3 = -2$다. 오른쪽 값이 왼쪽 값보다 큰 세로 경계가 음수로 나타나고, 이는 \`out1[0, 0]\`의 값과 같다.

### 채널이 여러 개일 때

컬러 이미지는 R, G, B 세 채널로 이루어진 $H \times W \times 3$ 배열이다. 이때 커널 하나도 입력 채널 수만큼의 깊이를 가진 $3 \times 3 \times 3$ 배열이 되고, 세 채널에서 곱한 값을 모두 더해 출력의 한 칸을 계산한다. 커널 하나는 입력 채널이 몇 개든 출력 채널 하나를 만들므로, 출력 채널을 64개 만들려면 커널 64개를 쓴다.

[[diagram:conv-channels]]

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
x = rng.integers(0, 3, size=(3, 4, 4)).astype(float)             # 입력: 채널 3, 4×4
kernels = rng.integers(-1, 2, size=(2, 3, 3, 3)).astype(float)   # 커널 2개, 각각 3채널 × 3×3
bias = np.array([0.0, 1.0])

out = np.zeros((2, 2, 2))                     # 출력: 채널 2(커널 수), 2×2
for o in range(2):                            # 출력 채널(커널)마다
    for i in range(2):
        for j in range(2):
            window = x[:, i:i + 3, j:j + 3]   # 세 채널의 3×3 영역을 함께 잘라낸다
            out[o, i, j] = np.sum(window * kernels[o]) + bias[o]   # 세 채널의 곱을 모두 더한 값 하나
print("입력", x.shape, "→ 커널", kernels.shape, "→ 출력", out.shape)
print("파라미터 수:", kernels.size + bias.size)   # 2 × (3×3×3) + 2 = 56
\`\`\`

입력 $(3, 4, 4)$에 커널 2개를 쓰면 출력은 $(2, 2, 2)$이고, 파라미터는 가중치 $2 \times 27 = 54$개와 편향 2개를 합쳐 56개다. 합성곱층의 파라미터 수는 일반적으로 $(K \times K \times C_{in} + 1) \times C_{out}$이다.

### 합성곱의 가정과 파라미터 수

합성곱층의 구조에는 이미지에 대한 두 가지 가정이 들어 있다. 학습 전에 모델 구조로 정해 두는 이런 가정을 **귀납 편향**(inductive bias)이라 한다.

- **지역성**(locality): 한 픽셀의 의미는 대부분 가까운 픽셀들과의 관계로 정해진다. 그래서 출력의 각 칸을 커널 크기의 작은 영역만으로 계산한다.
- **평행이동 등변성**(translation equivariance): 입력의 패턴이 이동하면 출력의 반응도 같은 만큼 이동한다. 같은 커널을 모든 위치에 쓰기 때문이다.

커널 하나를 모든 위치에서 재사용하므로 합성곱층은 완전연결층보다 파라미터가 훨씬 적다. $224 \times 224 \times 3$ 이미지에서 출력 64개를 계산하는 두 층을 비교한다.

| 층 | 계산 | 파라미터 수 |
| --- | --- | --- |
| 합성곱층($3 \times 3$ 커널 64개) | $(3 \times 3 \times 3 + 1) \times 64$ | 1,792 |
| 완전연결층(출력 64개) | $(224 \times 224 \times 3) \times 64 + 64$ | 9,633,856 |

파라미터 수는 약 5,400배 차이가 난다. 완전연결층은 출력마다 입력의 모든 픽셀에 서로 다른 가중치를 학습하지만, 합성곱층은 모든 위치에 쓰는 작은 커널만 학습한다.

[[diagram:fc-vs-conv]]

실제 CNN은 합성곱, 활성화 함수, 풀링으로 이루어진 블록을 여러 번 쌓은 뒤 마지막에 완전연결층을 붙여 클래스 확률을 계산한다. 층이 깊어질수록 출력의 한 칸이 입력에서 계산에 쓰는 영역(수용영역)이 넓어지므로, 앞쪽 층은 경계와 질감처럼 좁은 영역의 패턴을, 뒤쪽 층은 물체의 부분과 전체처럼 넓은 영역의 패턴을 계산한다. 풀링과 수용영역은 [[lesson:pooling]]에서 다룬다.

\`\`\`image
src: /images/week4/cnn.png
alt: 합성곱층과 풀링층을 반복해 쌓고 마지막에 완전연결층을 붙인 CNN 전체 구조도
caption: 입력 이미지가 합성곱·풀링 블록을 거치며 공간 크기는 작아지고 채널 수는 많아지며, 마지막 완전연결층에서 클래스 확률로 변환된다.
credit: Irisbox, CC BY 4.0, Wikimedia Commons
width: 700
height: 289
\`\`\`

프레임워크가 반복문 대신 행렬 곱 하나로 합성곱을 계산하는 방법(im2col)과 합성곱의 역전파는 [[lesson:conv-as-matmul]]에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "입력 $28\\times28$, 커널 $5\\times5$, padding 0, stride 1인 합성곱의 출력 크기는?",
      choices: ["$28\\times28$", "$24\\times24$", "$23\\times23$", "$12\\times12$"],
      answer: 1,
      explanation: "$\\lfloor(28 + 0 - 5)/1\\rfloor + 1 = 24$이다.",
    },
    {
      key: "c2",
      question: "입력 채널 3, $3\\times3$ 커널 16개(출력 채널 16)인 합성곱층의 파라미터 수(편향 포함)는?",
      choices: ["$144$", "$448$", "$432$", "$9$"],
      answer: 1,
      explanation: "가중치 $3\\times3\\times3\\times16 = 432$개와 편향 16개를 더해 448개다. 입력 이미지의 가로·세로 크기와는 관계없다.",
    },
    {
      key: "c3",
      question: "합성곱의 파라미터 공유가 의미하는 것은?",
      choices: [
        "모든 층이 같은 커널을 쓴다",
        "같은 커널 가중치를 이미지의 모든 위치에서 재사용한다",
        "모든 채널이 같은 값을 가진다",
        "학습 중 가중치가 바뀌지 않는다",
      ],
      answer: 1,
      explanation: "모든 위치에 같은 커널을 쓰므로 패턴의 위치가 바뀌어도 같은 패턴을 검출하고(평행이동 등변성), 파라미터 수가 크게 줄어든다.",
    },
    {
      key: "c4",
      question: "입력이 $32 \\times 32 \\times 3$이고 $5 \\times 5$ 커널 10개를 쓰는 합성곱층(padding 0, stride 1)의 출력 모양은?",
      choices: ["$28 \\times 28 \\times 10$", "$28 \\times 28 \\times 3$", "$32 \\times 32 \\times 10$", "$28 \\times 28 \\times 30$"],
      answer: 0,
      explanation: "공간 크기는 $32 - 5 + 1 = 28$이고, 커널 하나가 입력 채널 3개를 모두 더해 출력 채널 하나를 만들므로 출력 채널 수는 커널 수인 10이다.",
    },
    {
      key: "c5",
      question: "입력 채널 3, 출력 채널 64인 $3 \\times 3$ 합성곱에서 커널 하나의 가중치 개수는?",
      choices: ["27개", "9개", "576개", "1,728개"],
      answer: 0,
      explanation: "커널 하나는 입력 채널 수만큼의 깊이를 가져 $3 \\times 3 \\times 3 = 27$개다. 이런 커널이 64개이므로 전체 가중치는 1,728개(편향 포함 1,792개)다.",
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
      explanation: "$\\lfloor (5-3)/1 \\rfloor + 1 = 3$, padding 1이면 $\\lfloor (5+2-3)/1 \\rfloor + 1 = 5$(same padding), stride 2이면 $\\lfloor 2/2 \\rfloor + 1 = 2$, $28 \\times 28$에 $5 \\times 5$ 커널이면 24다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "입력 $32 \\times 32$, 커널 $5 \\times 5$, padding 2일 때 stride 1과 stride 2의 출력 크기를 계산하고, stride 1에서 $P = (K-1)/2$이면 출력 크기가 입력과 같아지는 이유를 쓰라.",
      answer: md`
stride 1이면 $\lfloor (32 + 4 - 5)/1 \rfloor + 1 = 32$로 입력과 크기가 같고, stride 2이면 $\lfloor 31/2 \rfloor + 1 = 16$이다.

stride가 1이면 출력 크기는 $N + 2P - K + 1$이다. $P = (K-1)/2$를 대입하면 $N + (K - 1) - K + 1 = N$이 된다. 커널의 중심을 입력의 가장자리 칸에 놓으면 커널이 입력 밖으로 $(K-1)/2$칸 나가는데, 그만큼 0을 채우면 입력의 모든 칸에 커널의 중심을 놓을 수 있기 때문이다.
`,
      keyPoints: [
        "stride 1: $\\lfloor (32 + 4 - 5)/1 \\rfloor + 1 = 32$",
        "stride 2: $\\lfloor 31/2 \\rfloor + 1 = 16$",
        "stride 1의 출력 크기는 $N + 2P - K + 1$이다",
        "$P = (K-1)/2$이면 모든 칸에 커널의 중심을 놓을 수 있어 크기가 유지된다",
      ],
    },
    {
      key: "d2",
      question: "이미지에 완전연결층 대신 합성곱층을 쓰는 이유를 지역성, 평행이동 등변성, 파라미터 공유로 쓰고, $224 \\times 224 \\times 3$ 입력에서 출력 64개를 만드는 두 층의 파라미터 수를 비교하라.",
      answer: md`
이미지의 한 픽셀이 갖는 의미는 대부분 가까운 픽셀들과의 관계로 정해지므로(지역성), 합성곱층은 출력의 각 칸을 커널 크기의 작은 영역만으로 계산한다. 같은 패턴은 이미지의 어느 위치에 있어도 같은 패턴이므로, 같은 커널을 모든 위치에 쓴다(파라미터 공유). 그 결과 입력의 패턴이 이동하면 출력의 반응도 같은 만큼 이동한다(평행이동 등변성).

$3 \times 3$ 커널 64개인 합성곱층의 파라미터는 $(3 \times 3 \times 3 + 1) \times 64 = 1{,}792$개다. 같은 입력을 출력 64개에 완전히 연결하면 $150{,}528 \times 64 + 64 = 9{,}633{,}856$개가 필요하므로 약 5,400배 많다. 파라미터가 적으면 같은 데이터로 학습할 때 과적합 위험이 작고 계산도 적다.
`,
      keyPoints: [
        "지역성: 출력의 각 칸을 작은 영역만으로 계산한다",
        "파라미터 공유: 같은 커널을 모든 위치에 쓴다",
        "평행이동 등변성: 패턴이 이동하면 출력도 같은 만큼 이동한다",
        "합성곱 1,792개 대 완전연결 9,633,856개(약 5,400배)",
      ],
    },
  ],
  references: [
    { title: "CS231n — Convolutional Neural Networks", url: "https://cs231n.github.io/convolutional-networks/", note: "합성곱, padding, stride, 파라미터 수를 그림과 예제로 (영문)" },
    { title: "CNN Explainer (Georgia Tech)", url: "https://poloclub.github.io/cnn-explainer/", note: "실제 CNN의 층별 출력을 브라우저에서 확인하는 시각화 (영문)" },
  ],
});
