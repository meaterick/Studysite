import { defineLesson, md } from "../../kit";
import exercises from "./labs/conv-as-matmul";

export default defineLesson({
  id: "conv-as-matmul",
  title: "합성곱의 계산: im2col, 역전파, 깊이별 분리",
  tier: "advanced",
  goal: "im2col로 합성곱을 행렬 곱으로 바꾸고 FLOPs를 세며, 합성곱의 입력·커널 기울기가 각각 어떤 합성곱인지 유도하고, depthwise separable 합성곱의 절약을 계산할 수 있다.",
  why: "",
  body: md`
핵심 과정에서는 이중 반복문으로 합성곱을 구현했다. 실제 프레임워크는 이렇게 계산하지 않는다. 이 단계는 합성곱이 GPU에서 어떻게 **행렬 곱 하나**로 바뀌는지, 합성곱의 역전파가 왜 **또 하나의 합성곱**인지, 그리고 모바일 기기용 모델이 연산량을 어떻게 10분의 1 가까이 줄이는지(depthwise separable convolution)를 다룬다.

### im2col: 합성곱을 행렬 곱으로

입력에서 커널이 지나가는 모든 $K \times K$ 창을 꺼내 한 줄로 편 다음, 그 줄들을 쌓으면 (창 개수 $\times K^2$) 행렬이 된다. 이것을 **im2col**이라 부른다. 커널도 길이 $K^2$인 벡터로 펴면, 합성곱 출력 전체가 이 행렬과 커널 벡터의 곱 한 번으로 나온다. 입력 채널이 $C_{in}$개, 출력 채널이 $C_{out}$개면 (창 개수 $\times K^2C_{in}$) 행렬과 ($K^2C_{in} \times C_{out}$) 가중치 행렬의 곱이 된다. 같은 픽셀이 여러 창에 중복 복사되어 메모리를 더 쓰는 대신, 3주차 「GPU·혼합 정밀도」에서 본 것처럼 GPU가 가장 잘하는 거대한 행렬 곱 하나로 바뀐다. cuDNN 같은 라이브러리는 입력 크기에 따라 im2col, FFT, Winograd 알고리즘 중 빠른 것을 골라 쓴다.

$5 \times 5$ 입력과 $3 \times 3$ 커널로 확인해 보자. 창이 $3 \times 3 = 9$개이고 창 하나는 9개 원소라 im2col 행렬은 $(9, 9)$다. 이것과 펴 놓은 커널(길이 9)의 곱 한 번이 이중 반복문의 결과와 같다.

\`\`\`python
import numpy as np

x = np.arange(25, dtype=float).reshape(5, 5)        # 5×5 입력
k = np.array([[1, 0, -1], [1, 0, -1], [1, 0, -1]], dtype=float)
K = 3
out_h = out_w = 5 - K + 1                            # 3×3 출력

# im2col: 커널이 지나가는 3×3 창 9개를 한 줄씩 펴서 쌓는다 → (9, 9) 행렬
cols = np.array([x[i:i + K, j:j + K].ravel() for i in range(out_h) for j in range(out_w)])
print("im2col 행렬 shape:", cols.shape)              # (창 9개, 창 하나의 원소 9개)

out_matmul = (cols @ k.ravel()).reshape(out_h, out_w)   # 행렬-벡터 곱 한 번
out_loop = np.array([[np.sum(x[i:i + K, j:j + K] * k) for j in range(out_w)] for i in range(out_h)])
print(out_matmul)
print("반복문 결과와 같은가?", np.allclose(out_matmul, out_loop))
\`\`\`

입력이 0~24의 연속된 숫자라 모든 창에서 "왼쪽 열 − 오른쪽 열"이 $-2 \times 3 = -6$으로 같다. 실제 이미지라면 im2col 행렬이 원래 입력보다 약 $K^2$배 커지는 메모리 비용을 감수하고, 그 대신 고도로 최적화된 행렬 곱(GEMM) 하나로 계산한다.

[[diagram:im2col]]

연산량은 출력 위치마다 $K^2C_{in}$번의 곱셈-덧셈을 $C_{out}$개 채널에 대해 하므로, 출력이 $H \times W$일 때 대략 $2 \cdot H W K^2 C_{in} C_{out}$ FLOPs다. 파라미터 수($K^2C_{in}C_{out}$)는 입력 크기와 무관하지만 연산량은 출력 해상도에 비례한다는 점이 FC층과 다르다. 해상도가 큰 앞쪽 층이 파라미터는 적어도 연산의 대부분을 차지하는 이유다.

[[diagram:vgg-params-flops]]

### 합성곱의 역전파도 합성곱이다

출력 $y = x \star k$($\star$는 핵심 과정에서 구현한 합성곱, 엄밀히는 교차상관)에 대해 위에서 내려온 기울기를 $G = \partial L / \partial y$라 하자. 출력 한 칸 $y_{ij} = \sum_{a,b} x_{i+a,\,j+b}\,k_{ab}$에서 각 변수의 국소 미분은 상대방 값이므로(3주차 곱셈 노드),

- **커널의 기울기**는 $\partial L/\partial k_{ab} = \sum_{i,j} G_{ij}\,x_{i+a,\,j+b}$, 즉 **입력 $x$와 기울기 $G$의 합성곱** $x \star G$다.
- **입력의 기울기**는 각 $x_{pq}$가 기여한 모든 출력 칸에서 기울기를 모은 것으로, $G$를 $K-1$칸씩 0으로 감싼 뒤 **180° 뒤집은 커널**로 합성곱한 것과 같다("full" 합성곱).

즉 역전파도 같은 합성곱 연산 루틴으로 계산된다. 입력의 기울기를 구하는 이 연산은 출력보다 큰 결과를 만들므로, 분할·생성 모델에서 해상도를 키우는 층으로 따로 쓰이기도 한다. 그것이 **전치 합성곱(transposed convolution)**이다. 이름의 "전치"는 im2col로 쓴 합성곱 행렬의 전치 행렬을 곱하는 연산이라는 뜻이다(3주차 「역전파」의 $W^\top\delta$와 같은 원리).

[[diagram:conv-backprop-1d]]

### depthwise separable convolution

표준 $3\times3$ 합성곱은 공간 패턴($3\times3$ 이웃)과 채널 결합(모든 입력 채널 섞기)을 한 번에 한다. MobileNet(Howard et al., 2017)은 이것을 두 단계로 나눈다. ① **depthwise**: 채널마다 따로 $3\times3$ 필터 하나씩(채널끼리 섞지 않음), ② **pointwise**: $1\times1$ 합성곱으로 채널만 섞기. 파라미터는 $K^2C_{in}C_{out}$에서 $K^2C_{in} + C_{in}C_{out}$으로 줄고, 비율은 대략 $\frac{1}{C_{out}} + \frac{1}{K^2}$이다. $K = 3$이면 8~9배 가까이 줄어든다. 표현력이 조금 줄지만 휴대폰에서 실시간으로 돌아가는 모델(MobileNet, EfficientNet)의 기본 부품이 되었고, 이 "공간과 채널을 분리한다"는 발상은 Transformer의 어텐션(토큰 섞기)과 MLP(채널 섞기) 분업에도 그대로 이어진다.

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
      question: "합성곱 $y = x \\star k$에서 위에서 내려온 기울기가 $G$일 때 커널의 기울기 $\\partial L/\\partial k$는?",
      choices: ["입력 $x$와 $G$의 합성곱", "$G$와 커널의 곱", "$x$의 전치", "커널을 180° 뒤집은 것"],
      answer: 0,
      explanation: "$\\partial L/\\partial k_{ab} = \\sum_{i,j} G_{ij}x_{i+a,j+b}$로 $x \\star G$다. 입력의 기울기는 $G$를 0으로 감싸 뒤집은 커널로 합성곱한 것이다.",
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
      explanation: "출력이 $5 \\times 5$라 창이 25개이고, 창 하나를 펴면 $3 \\times 3 = 9$개다. 그래서 (창 수, 창 크기) = $(25, 9)$이다.",
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
      question: "입력 해상도를 가로·세로 두 배로 키우면 같은 합성곱층의 파라미터 수와 FLOPs는 각각 어떻게 되는가?",
      choices: ["파라미터는 그대로, FLOPs는 4배", "둘 다 4배", "파라미터 4배, FLOPs 그대로", "둘 다 2배"],
      answer: 0,
      explanation: "파라미터 $K^2C_{in}C_{out}$은 해상도와 무관합니다. FLOPs $2HWK^2C_{in}C_{out}$은 출력 위치 수 $HW$에 비례하므로 4배가 됩니다. 고해상도 앞쪽 층이 파라미터는 적어도 연산의 대부분을 차지하는 이유입니다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "im2col이 합성곱을 행렬 곱으로 바꾸는 원리를 설명하라. 합성곱 출력의 기울기 $G$로부터 입력과 커널의 기울기를 구하는 연산이 각각 무엇인지, depthwise separable 합성곱이 파라미터를 얼마나 줄이는지 함께 설명하라.",
      answer: md`
im2col은 입력에서 커널이 지나가는 모든 $K\times K$(채널 포함 $K^2C_{in}$) 창을 한 줄로 펴서 쌓은 행렬을 만들고, 커널들을 펴서 만든 가중치 행렬과 곱해 합성곱 출력 전체를 행렬 곱 한 번으로 얻는다. 같은 픽셀이 여러 창에 복사되어 메모리는 더 들지만 GPU가 잘하는 큰 행렬 곱이 된다. 출력 기울기가 $G$이면 커널의 기울기는 입력 $x$와 $G$의 합성곱이고, 입력의 기울기는 $G$를 $K-1$칸씩 0으로 감싼 뒤 180도 뒤집은 커널로 합성곱한 것(full 합성곱)이다. depthwise separable 합성곱은 채널별 $K\times K$ 필터와 $1\times1$ 채널 섞기로 나눠 파라미터를 $K^2C_{in}C_{out}$에서 $K^2C_{in}+C_{in}C_{out}$으로 줄이며, 비율은 약 $1/C_{out}+1/K^2$로 $3\times3$이면 8~9배 절약된다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "CS231n — Convolutional Networks: Implementation as Matrix Multiplication", url: "https://cs231n.github.io/convolutional-networks/#conv", note: "im2col 설명 (영문)" },
    { title: "Dumoulin & Visin (2016) — A guide to convolution arithmetic for deep learning", url: "https://arxiv.org/abs/1603.07285", note: "출력 크기·전치 합성곱을 그림으로 (영문)" },
    { title: "Howard et al. (2017) — MobileNets", url: "https://arxiv.org/abs/1704.04861", note: "depthwise separable convolution (영문)" },
  ],
});
