import { defineLesson, md } from "../../kit";
import exercises from "./labs/conv-as-matmul";

export default defineLesson({
  id: "conv-as-matmul",
  title: "합성곱의 계산: im2col, 역전파, 깊이별 분리",
  tier: "advanced",
  goal: "im2col로 합성곱을 행렬 곱으로 바꾸고 FLOPs를 세며, 합성곱의 입력·커널 기울기가 각각 어떤 합성곱인지 유도하고, depthwise separable 합성곱이 줄이는 파라미터 수를 계산한다.",
  why: "합성곱층의 연산량과 메모리를 계산할 수 있어야 모델이 GPU 메모리에 들어가는지, 추론 시간이 얼마나 걸리는지 추정할 수 있다. 모바일용 경량 모델과 분할·생성 모델의 업샘플링 층(전치 합성곱)도 이 레슨의 계산을 바탕으로 한다.",
  body: md`
[[lesson:convolution]]에서는 이중 반복문으로 합성곱을 구현했지만, 실제 프레임워크는 다른 방법으로 계산한다. 이 레슨은 합성곱을 GPU에서 **행렬 곱 하나**로 계산하는 방법, 합성곱의 역전파가 **또 하나의 합성곱**인 이유, 모바일 기기용 모델이 파라미터와 연산량을 10분의 1 가까이 줄이는 방법(depthwise separable convolution)을 다룬다.

### im2col: 합성곱을 행렬 곱으로

입력에서 커널이 놓이는 모든 $K \times K$ 영역(창)을 한 줄로 편 다음 쌓으면 (창 개수 $\times K^2$) 행렬이 된다. 이것을 **im2col**이라 부른다. 커널도 길이 $K^2$인 벡터로 펴면, 합성곱 출력 전체가 이 행렬과 커널 벡터의 곱 한 번으로 나온다. 입력 채널이 $C_{in}$개, 출력 채널이 $C_{out}$개면 (창 개수 $\times K^2C_{in}$) 행렬과 ($K^2C_{in} \times C_{out}$) 가중치 행렬의 곱이 된다. 같은 픽셀이 여러 창에 복사되어 메모리를 더 쓰는 대신, GPU가 빠르게 계산하는 큰 행렬 곱 하나가 된다([[lesson:pytorch-practice]]). cuDNN 같은 라이브러리는 입력 크기에 따라 im2col, FFT, Winograd 알고리즘 중 빠른 것을 골라 쓴다.

$5 \times 5$ 입력과 $3 \times 3$ 커널로 확인한다. 창이 $3 \times 3 = 9$개이고 창 하나는 9개 원소라 im2col 행렬은 $(9, 9)$다. 이것과 펴 놓은 커널(길이 9)의 곱 한 번이 이중 반복문의 결과와 같다.

\`\`\`python
import numpy as np

x = np.arange(25, dtype=float).reshape(5, 5)        # 5×5 입력
k = np.array([[1, 0, -1], [1, 0, -1], [1, 0, -1]], dtype=float)
K = 3
out_h = out_w = 5 - K + 1                            # 3×3 출력

# im2col: 커널이 놓이는 3×3 창 9개를 한 줄씩 펴서 쌓는다 → (9, 9) 행렬
cols = np.array([x[i:i + K, j:j + K].ravel() for i in range(out_h) for j in range(out_w)])
print("im2col 행렬 shape:", cols.shape)              # (창 9개, 창 하나의 원소 9개)

out_matmul = (cols @ k.ravel()).reshape(out_h, out_w)   # 행렬-벡터 곱 한 번
out_loop = np.array([[np.sum(x[i:i + K, j:j + K] * k) for j in range(out_w)] for i in range(out_h)])
print(out_matmul)
print("반복문 결과와 같은가?", np.allclose(out_matmul, out_loop))
\`\`\`

입력이 0~24의 연속된 숫자라 모든 창에서 "왼쪽 열 − 오른쪽 열"이 $-2 \times 3 = -6$으로 같다. 실제 이미지에서는 im2col 행렬이 원래 입력보다 약 $K^2$배 커지지만, 그 대신 고도로 최적화된 행렬 곱(GEMM) 하나로 계산할 수 있다.

[[diagram:im2col]]

연산량은 출력 위치마다 $K^2C_{in}$번의 곱셈-덧셈을 $C_{out}$개 채널에 대해 하므로, 출력이 $H \times W$일 때 대략 $2 \cdot H W K^2 C_{in} C_{out}$ FLOPs다. 파라미터 수($K^2C_{in}C_{out}$)는 입력 크기와 무관하지만 연산량은 출력 해상도에 비례한다는 점이 FC층과 다르다. 그래서 해상도가 큰 앞쪽 층은 파라미터가 적어도 연산의 대부분을 차지한다.

[[diagram:vgg-params-flops]]

### 합성곱의 역전파도 합성곱이다

출력 $y = x \star k$($\star$는 [[lesson:convolution]]에서 구현한 합성곱, 엄밀히는 교차상관)에 대해 출력 쪽에서 전달된 기울기를 $G = \partial L / \partial y$라 하자. 출력 한 칸 $y_{ij} = \sum_{a,b} x_{i+a,\,j+b}\,k_{ab}$에서 곱셈 노드의 국소 미분은 곱해진 다른 값이므로([[lesson:backprop]]),

- **커널의 기울기**는 $\partial L/\partial k_{ab} = \sum_{i,j} G_{ij}\,x_{i+a,\,j+b}$, 즉 **입력 $x$와 기울기 $G$의 합성곱** $x \star G$다.
- **입력의 기울기**는 각 $x_{pq}$가 계산에 쓰인 모든 출력 칸의 기울기를 더한 것으로, $G$의 가장자리에 0을 $K-1$칸씩 채운 뒤 **180° 뒤집은 커널**로 합성곱한 것과 같다("full" 합성곱).

따라서 역전파도 같은 합성곱 함수로 계산한다. 입력의 기울기를 구하는 이 연산은 입력보다 큰 결과를 만들므로, 분할·생성 모델에서 해상도를 키우는 층으로도 쓰인다. 이 층을 **전치 합성곱**(transposed convolution)이라 한다. "전치"는 합성곱을 행렬로 썼을 때 그 행렬의 전치를 곱하는 연산이라는 뜻이다([[lesson:backprop]]의 $W^\top\delta$와 같은 원리).

[[diagram:conv-backprop-1d]]

### depthwise separable convolution

표준 $3\times3$ 합성곱은 공간 방향의 결합($3\times3$ 이웃)과 채널 방향의 결합(모든 입력 채널)을 한 번에 계산한다. MobileNet(Howard et al., 2017)은 이것을 두 단계로 나눈다. ① **depthwise**: 채널마다 $3\times3$ 필터를 하나씩 따로 적용한다(채널끼리 결합하지 않는다). ② **pointwise**: $1\times1$ 합성곱으로 채널만 결합한다. 파라미터는 $K^2C_{in}C_{out}$에서 $K^2C_{in} + C_{in}C_{out}$으로 줄고, 비율은 대략 $\frac{1}{C_{out}} + \frac{1}{K^2}$이다. $K = 3$이면 8~9배 가까이 줄어든다. 표현력은 조금 줄지만 휴대폰에서 실시간으로 실행되는 모델(MobileNet, EfficientNet)의 기본 구성 요소가 되었다. 공간 방향과 채널 방향의 결합을 나누는 방식은 Transformer에서 attention이 토큰 사이의 정보를, MLP가 채널 사이의 정보를 결합하는 구조와도 같다.

[[diagram:depthwise-separable]]
`,
  checks: [
    {
      key: "c1",
      question: "출력 $H \\times W$, 커널 $K\\times K$, 입력 채널 $C_{in}$, 출력 채널 $C_{out}$인 합성곱층의 대략적인 FLOPs는?",
      choices: ["$2HWK^2C_{in}C_{out}$", "$K^2C_{in}C_{out}$", "$2HWC_{in}C_{out}$", "$HWK^2$"],
      answer: 0,
      explanation: "출력 위치 $HW$마다, 출력 채널마다 $K^2C_{in}$번의 곱셈-덧셈(2 FLOPs)을 한다. 파라미터 수 $K^2C_{in}C_{out}$은 해상도와 무관하지만 연산량은 해상도에 비례한다.",
    },
    {
      key: "c2",
      question: "합성곱 $y = x \\star k$에서 출력 쪽에서 전달된 기울기가 $G$일 때 커널의 기울기 $\\partial L/\\partial k$는?",
      choices: ["입력 $x$와 $G$의 합성곱", "$G$와 커널의 곱", "$x$의 전치", "커널을 180° 뒤집은 것"],
      answer: 0,
      explanation: "$\\partial L/\\partial k_{ab} = \\sum_{i,j} G_{ij}x_{i+a,j+b}$이므로 $x \\star G$다. 입력의 기울기는 가장자리에 0을 채운 $G$를 뒤집은 커널로 합성곱한 것이다.",
    },
    {
      key: "c3",
      question: "$3\\times3$, 256 → 256 채널 층을 depthwise separable로 바꾸면 파라미터는 대략 몇 분의 1이 되는가?",
      choices: ["약 1/9", "약 1/2", "약 1/256", "같다"],
      answer: 0,
      explanation: "비율이 $\\frac{1}{C_{out}} + \\frac{1}{K^2} = \\frac{1}{256} + \\frac{1}{9} \\approx 0.115$이므로 약 8.7분의 1이다.",
    },
    {
      key: "c4",
      question: "$7 \\times 7$ 입력(채널 1)에 $3 \\times 3$ 커널(stride 1, padding 0)을 쓸 때 im2col 행렬의 shape은?",
      choices: ["$(25, 9)$", "$(9, 25)$", "$(49, 9)$", "$(25, 25)$"],
      answer: 0,
      explanation: "출력이 $5 \\times 5$이므로 창이 25개이고, 창 하나를 펴면 $3 \\times 3 = 9$개다. 그래서 (창 수, 창 크기) = $(25, 9)$다.",
    },
    {
      key: "c5",
      question: "해상도를 두 배($H, W \\to 2H, 2W$)로 키우면 같은 합성곱층의 파라미터 수와 FLOPs는?",
      choices: ["파라미터는 그대로, FLOPs는 4배", "둘 다 4배", "파라미터 4배, FLOPs 그대로", "둘 다 2배"],
      answer: 0,
      explanation: "파라미터 $K^2C_{in}C_{out}$은 해상도와 무관하고, FLOPs $2HWK^2C_{in}C_{out}$은 출력 위치 수 $HW$에 비례해 4배가 된다.",
    },
    {
      key: "c6",
      question: "채널 1, $32 \\times 32$ 입력에 $3 \\times 3$ 커널(stride 1, padding 1)을 쓸 때 im2col 행렬의 원소 수는 입력 원소 수의 몇 배인가?",
      choices: ["9배", "3배", "1배", "1,024배"],
      answer: 0,
      explanation: "출력이 $32 \\times 32$이므로 창이 1,024개이고 창 하나가 9개 원소라 im2col 행렬은 $1{,}024 \\times 9$다. 입력 원소 1,024개의 9배, 즉 $K^2$배다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "im2col이 합성곱을 행렬 곱으로 바꾸는 방법을 쓰고, 출력의 기울기 $G$로 입력과 커널의 기울기를 구하는 연산이 각각 무엇인지 쓰라. depthwise separable 합성곱이 파라미터를 얼마나 줄이는지도 쓰라.",
      answer: md`
im2col은 입력에서 커널이 놓이는 모든 창(채널을 포함해 $K^2C_{in}$개 원소)을 한 줄로 펴서 쌓은 행렬을 만들고, 커널들을 펴서 만든 가중치 행렬과 곱해 합성곱 출력 전체를 행렬 곱 한 번으로 계산한다. 같은 픽셀이 여러 창에 복사되어 메모리는 약 $K^2$배 더 들지만, GPU가 빠르게 계산하는 큰 행렬 곱이 된다.

출력의 기울기가 $G$이면 커널의 기울기는 입력 $x$와 $G$의 합성곱이고, 입력의 기울기는 가장자리에 0을 $K-1$칸씩 채운 $G$를 180° 뒤집은 커널로 합성곱한 것(full 합성곱)이다. depthwise separable 합성곱은 채널별 $K\times K$ 필터와 $1\times1$ 합성곱으로 나눠 파라미터를 $K^2C_{in}C_{out}$에서 $K^2C_{in}+C_{in}C_{out}$으로 줄이며, 비율은 약 $1/C_{out}+1/K^2$이므로 $3\times3$이면 8~9배 줄어든다.
`,
      keyPoints: [
        "im2col: 창을 한 줄씩 펴 쌓은 행렬과 가중치 행렬의 곱 한 번",
        "메모리는 약 $K^2$배 더 들지만 큰 행렬 곱으로 계산한다",
        "커널의 기울기는 $x \\star G$, 입력의 기울기는 뒤집은 커널로 한 full 합성곱",
        "depthwise separable의 파라미터 비율은 약 $1/C_{out} + 1/K^2$",
      ],
    },
  ],
  references: [
    { title: "CS231n — Convolutional Networks: Implementation as Matrix Multiplication", url: "https://cs231n.github.io/convolutional-networks/#conv", note: "im2col 설명 (영문)" },
    { title: "Dumoulin & Visin (2016) — A guide to convolution arithmetic for deep learning", url: "https://arxiv.org/abs/1603.07285", note: "출력 크기·전치 합성곱을 그림으로 (영문)" },
    { title: "Howard et al. (2017) — MobileNets", url: "https://arxiv.org/abs/1704.04861", note: "depthwise separable convolution (영문)" },
  ],
});
