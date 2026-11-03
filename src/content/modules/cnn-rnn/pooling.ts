import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/pooling";

export default defineLesson({
  id: "pooling",
  title: "풀링과 수용영역",
  tier: "core",
  concepts: ["cnn"],
  goal: "Max Pooling과 Average Pooling의 차이와 stride 2 합성곱과의 관계를 설명하고, 점프 $j$를 이용해 여러 층의 수용영역을 계산한다.",
  why: "CNN은 풀링이나 stride 2 합성곱으로 해상도를 줄이며 층을 쌓는다. 수용영역을 계산할 수 있어야 마지막 층의 한 칸이 이미지의 어느 범위로 계산되는지 알 수 있고, 분류·검출·분할 모델([[lesson:cnn-architectures]])의 층 구성을 이해할 수 있다.",
  body: md`
### 풀링

**풀링**(pooling)은 특성 맵의 작은 영역(대개 $2 \times 2$)을 값 하나로 요약해 공간 해상도를 줄이는 연산이다. 해상도를 줄이면 다음 층의 계산량이 줄고, 물체의 위치가 한두 픽셀 바뀌어도 출력이 덜 바뀐다. 영역의 최댓값을 남기는 **Max Pooling**과 평균을 남기는 **Average Pooling**이 있으며, 풀링에는 학습되는 파라미터가 없다.

\`\`\`image
src: /images/week4/max-pooling.png
alt: 4x4 특성 맵에 2x2 필터, stride 2로 Max Pooling을 적용해 2x2 출력으로 줄이는 과정을 나타낸 그림
caption: 4×4 특성 맵을 2×2 영역으로 나눠 각 영역의 최댓값을 남기면(2×2 필터, stride 2) 2×2 출력이 된다. 같은 영역의 평균을 남기면 Average Pooling이다.
credit: Aphex34, CC BY-SA 4.0, Wikimedia Commons
width: 570
height: 330
\`\`\`

$2 \times 2$ 영역 $\begin{bmatrix}1&3\\2&4\end{bmatrix}$에 적용하면 Max Pooling은 $\max(1, 3, 2, 4) = 4$, Average Pooling은 $(1 + 3 + 2 + 4)/4 = 2.5$다. Max Pooling은 영역에서 가장 큰 값 하나만 남기고 나머지 값은 버린다. Average Pooling은 네 값을 모두 반영하지만, 큰 값 하나는 다른 값과 평균되어 작아진다.

합성곱의 출력은 그 위치의 입력이 커널의 패턴과 얼마나 일치하는지를 나타낸다. Max Pooling의 출력은 영역 안에 그 패턴이 강하게 나타난 위치가 하나라도 있는지에 따라 정해지고, 그 위치가 영역 안의 어디인지는 출력에 영향을 주지 않는다. 그래서 작은 위치 변화에 출력이 잘 바뀌지 않는다(국소적인 평행이동 불변성). Average Pooling의 출력은 영역 전체가 평균적으로 얼마나 반응했는지에 따라 정해진다. 분류 모델의 중간층에는 주로 Max Pooling을 쓰고, 마지막에 채널마다 특성 맵 전체를 평균해 숫자 하나로 만드는 **GAP**(Global Average Pooling)에는 Average Pooling을 쓴다.

\`\`\`python
import numpy as np

def max_pool2x2(a):
    H, W = a.shape
    out = np.zeros((H // 2, W // 2))
    for i in range(0, H, 2):                                  # 2칸씩 이동
        for j in range(0, W, 2):
            out[i // 2, j // 2] = np.max(a[i:i+2, j:j+2])     # 2×2 영역의 최댓값
    return out

def avg_pool2x2(a):
    H, W = a.shape
    out = np.zeros((H // 2, W // 2))
    for i in range(0, H, 2):
        for j in range(0, W, 2):
            out[i // 2, j // 2] = np.mean(a[i:i+2, j:j+2])    # 2×2 영역의 평균
    return out

y = np.array([[1., 1., 2., 1.],
              [1., 9., 1., 1.],
              [1., 1., 1., 2.],
              [1., 1., 1., 1.]])                              # 왼쪽 위 영역에만 큰 값 9가 있다
print(max_pool2x2(y).tolist())                                # [[9.0, 2.0], [1.0, 2.0]]
print(avg_pool2x2(y).tolist())                                # [[3.0, 1.25], [1.0, 1.25]]
print(y.reshape(2, 2, 2, 2).max(axis=(1, 3)).tolist())        # 반복문 없이 계산한 Max Pooling
\`\`\`

큰 값 9가 있는 왼쪽 위 영역에서 Max Pooling은 9를 그대로 남기고, Average Pooling은 $(1 + 1 + 1 + 9)/4 = 3$을 남긴다. 마지막 줄의 \`reshape(2, 2, 2, 2)\`는 $4 \times 4$ 배열을 (세로 블록, 블록 안의 행, 가로 블록, 블록 안의 열)의 4차원 배열로 나누고, \`max(axis=(1, 3))\`은 블록 안의 행과 열 방향으로 최댓값을 구한다. 반복문 없이 같은 결과가 나온다.

[[diagram:pool-max-vs-avg]]

### stride 2 합성곱

stride가 2 이상인 합성곱(strided convolution)도 해상도를 줄인다. 풀링은 합성곱으로 특성을 계산한 뒤 고정된 규칙(최댓값이나 평균)으로 크기를 줄이고, stride 2 합성곱은 커널을 두 칸씩 이동해 특성 계산과 크기 축소를 한 번에 한다. stride 2 합성곱은 어떤 정보를 남길지를 커널의 가중치로 학습한다는 점이 다르다. ResNet 이후의 여러 구조는 중간의 Max Pooling 대신 stride 2 합성곱을 쓴다(Springenberg 외, 2015). 풀링은 파라미터가 없어 계산이 적으므로 계산 자원이 제한적일 때는 여전히 많이 쓴다.

### 수용영역

**수용영역**(receptive field)은 특성 맵의 한 칸을 계산하는 데 쓰이는 입력 이미지의 영역이다. 여러 층의 수용영역을 계산하려면 수용영역의 크기 $r$과 함께, 특성 맵에서 이웃한 두 칸이 입력 이미지에서 몇 픽셀 떨어져 있는지를 나타내는 **점프**(jump) $j$를 계산한다. 커널 크기 $k$, stride $s$인 층을 지날 때 두 값은 다음과 같이 바뀐다.

\`\`\`math
r_{out} = r_{in} + (k - 1) \cdot j_{in}, \qquad j_{out} = j_{in} \cdot s
\`\`\`

입력에서는 $r = 1$, $j = 1$이다. stride 1인 $3 \times 3$ 합성곱만 쌓으면 $j$가 1로 유지되므로 층마다 수용영역이 2씩 넓어진다.

| $3 \times 3$ 합성곱(stride 1) 층 수 | 수용영역 | 계산 |
| --- | --- | --- |
| 1 | $3 \times 3$ | $1 + 2 \times 1 = 3$ |
| 2 | $5 \times 5$ | $3 + 2 \times 1 = 5$ |
| 3 | $7 \times 7$ | $5 + 2 \times 1 = 7$ |
| $n$ | $(2n+1) \times (2n+1)$ | $1 + 2n$ |

stride 2인 풀링이나 합성곱을 지나면 $j$가 2배가 되므로, 그 뒤의 층은 같은 크기의 커널로도 수용영역을 2배 더 넓힌다. $3 \times 3$ 합성곱(stride 1), $2 \times 2$ Max Pooling(stride 2), $3 \times 3$ 합성곱(stride 1)을 차례로 지난 수용영역은 다음과 같다.

| 층 | $k$ | $s$ | $r_{out} = r_{in} + (k-1)\,j_{in}$ | $j_{out} = j_{in} \cdot s$ |
| --- | --- | --- | --- | --- |
| 입력 | | | 1 | 1 |
| 합성곱 $3 \times 3$ | 3 | 1 | $1 + 2 \times 1 = 3$ | 1 |
| 풀링 $2 \times 2$ | 2 | 2 | $3 + 1 \times 1 = 4$ | 2 |
| 합성곱 $3 \times 3$ | 3 | 1 | $4 + 2 \times 2 = 8$ | 2 |

마지막 합성곱은 커널이 같은 $3 \times 3$인데도 수용영역을 2가 아니라 4만큼 넓힌다. VGG나 ResNet은 $3 \times 3$ 커널만 쌓아도 마지막 층의 수용영역이 이미지 전체를 포함하는데, 중간의 다운샘플링 층마다 점프가 2배씩 커지기 때문이다.

[[diagram:receptive-field-1d]]
`,
  checks: [
    {
      key: "c1",
      question: "$2\\times2$ 영역 $[[5, 1], [2, 0]]$에 Max Pooling과 Average Pooling을 적용한 결과는?",
      choices: ["Max 5, Average 2", "Max 5, Average 8", "Max 2, Average 5", "Max 1, Average 2"],
      answer: 0,
      explanation: "Max는 가장 큰 값 5, Average는 $(5+1+2+0)/4 = 2$다.",
    },
    {
      key: "c2",
      question: "$3\\times3$ 합성곱(stride 1), $2\\times2$ 풀링(stride 2), $3\\times3$ 합성곱(stride 1)을 차례로 지난 뒤의 수용영역은?",
      choices: ["$7$", "$8$", "$6$", "$9$"],
      answer: 1,
      explanation: "합성곱 뒤 $r = 3$, $j = 1$, 풀링 뒤 $r = 3 + 1 \\cdot 1 = 4$, $j = 2$, 마지막 합성곱 뒤 $r = 4 + 2 \\cdot 2 = 8$이다.",
    },
    {
      key: "c3",
      question: "Max Pooling 대신 stride 2 합성곱을 쓰는 방식의 차이로 옳은 것은?",
      choices: [
        "stride 2 합성곱은 크기를 줄이지 않는다",
        "stride 2 합성곱은 어떤 정보를 남길지를 가중치로 학습한다",
        "Max Pooling의 파라미터가 더 많다",
        "두 방법은 완전히 같다",
      ],
      answer: 1,
      explanation: "풀링은 고정된 규칙으로 값을 버리고, stride 2 합성곱은 남길 정보를 가중치로 학습한다. 대신 풀링은 파라미터가 없어 계산이 적다.",
    },
    {
      key: "c4",
      question: "$3 \\times 3$ 합성곱(stride 2) 다음에 $3 \\times 3$ 합성곱(stride 1)을 쌓았을 때의 수용영역은?",
      choices: ["7", "5", "6", "9"],
      answer: 0,
      explanation: "첫 층 뒤 $r = 3$, $j = 2$이고, 둘째 층 뒤 $r = 3 + (3 - 1) \\times 2 = 7$이다. 두 층 모두 stride 1이면 5다.",
    },
    {
      key: "c5",
      question: "GAP(Global Average Pooling)가 $7 \\times 7 \\times 512$ 특성 맵에 하는 일은?",
      choices: [
        "채널마다 $7 \\times 7$개 값의 평균을 내 길이 512인 벡터를 만든다",
        "각 위치에서 512개 채널의 평균을 내 $7 \\times 7$ 배열을 만든다",
        "최댓값 하나만 남긴다",
        "$2 \\times 2$ 영역마다 평균을 낸다",
      ],
      answer: 0,
      explanation: "GAP는 채널마다 공간 전체의 평균을 구해, 그 채널의 패턴이 이미지 전체에서 평균적으로 얼마나 나타났는지를 숫자 하나로 요약한다. 그래서 출력은 채널 수만큼의 벡터다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
y = np.array([[4., 0., 1., 3.],
              [2., 2., 5., 1.],
              [0., 6., 1., 1.],
              [2., 0., 3., 3.]])
blocks = y.reshape(2, 2, 2, 2)
print(blocks.max(axis=(1, 3)).tolist())
print(blocks.mean(axis=(1, 3)).tolist())
`,
      expected: "[[4.0, 5.0], [6.0, 3.0]]\n[[2.0, 2.5], [2.0, 2.0]]",
      explanation: "네 블록은 `[[4, 0], [2, 2]]`, `[[1, 3], [5, 1]]`, `[[0, 6], [2, 0]]`, `[[1, 1], [3, 3]]`이다. 왼쪽 아래 블록의 최댓값은 6이고 평균은 2다. Max Pooling은 큰 값 하나를 그대로 남기고, Average Pooling은 블록의 네 값을 모두 반영한다.",
    },
    {
      key: "p2",
      code: py`
r, j = 1, 1
for k, s in [(3, 1), (3, 1), (2, 2), (3, 1)]:
    r, j = r + (k - 1) * j, j * s
    print(r, j)
`,
      expected: "3 1\n5 1\n6 2\n10 2",
      explanation: "$3 \\times 3$ 합성곱 두 층으로 수용영역이 3, 5가 되고, $2 \\times 2$ 풀링(stride 2)이 6으로 넓히면서 점프를 2로 만든다. 그 뒤의 $3 \\times 3$ 합성곱은 $(3-1) \\times 2 = 4$만큼 넓혀 10이 된다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$3 \\times 3$ 합성곱(stride 1)을 두 층, 세 층 쌓았을 때의 수용영역을 점프 $j$와 갱신식으로 계산하고, 첫 합성곱 뒤에 $2 \\times 2$ 풀링(stride 2)을 넣으면 다음 $3 \\times 3$ 합성곱의 수용영역이 어떻게 바뀌는지 쓰라.",
      answer: md`
입력에서 $r = 1$, $j = 1$이다. stride 1인 합성곱은 $j$를 바꾸지 않으므로 $r_{out} = r_{in} + (3 - 1) \times 1$에 따라 층마다 2씩 늘어, 두 층이면 5, 세 층이면 7이다.

첫 합성곱($r = 3$) 뒤에 $2 \times 2$ 풀링(stride 2)을 넣으면 풀링 뒤 $r = 3 + 1 \times 1 = 4$, $j = 2$가 되고, 다음 $3 \times 3$ 합성곱 뒤에는 $r = 4 + 2 \times 2 = 8$이 된다. 풀링이 점프를 2배로 만들어, 그 뒤 층에서 수용영역이 늘어나는 양도 2배가 된다.
`,
      keyPoints: [
        "갱신식 $r_{out} = r_{in} + (k-1) j_{in}$, $j_{out} = j_{in} s$",
        "stride 1인 $3 \\times 3$ 합성곱: 1 → 3 → 5 → 7",
        "풀링(stride 2)을 넣으면 3 → 4 → 8",
        "점프가 2배가 되면 뒤 층에서 수용영역이 늘어나는 양도 2배다",
      ],
    },
    {
      key: "d2",
      question: "$2 \\times 2$ 영역 $[[1, 3], [2, 4]]$에 Max Pooling과 Average Pooling을 적용한 결과를 쓰고, 두 방식이 남기는 정보의 차이를 쓰라. Max Pooling 대신 stride 2 합성곱을 쓸 때의 차이도 쓰라.",
      answer: md`
Max Pooling은 최댓값 4를, Average Pooling은 평균 $(1 + 3 + 2 + 4)/4 = 2.5$를 출력한다. Max Pooling은 영역 안에 커널의 패턴이 강하게 나타난 위치가 하나라도 있는지를 남기고, 그 위치가 영역 안의 어디인지는 버린다. Average Pooling은 영역 전체의 평균적인 반응을 남기므로, 큰 값 하나는 다른 값과 평균되어 작아진다.

풀링은 파라미터 없이 고정된 규칙으로 값을 버리지만, stride 2 합성곱은 크기를 줄이면서 어떤 정보를 남길지를 커널의 가중치로 학습한다. 대신 파라미터와 계산이 늘어난다.
`,
      keyPoints: [
        "Max Pooling 4, Average Pooling 2.5",
        "Max Pooling은 강한 반응이 있는지를 남기고 그 위치는 버린다",
        "Average Pooling은 영역 전체의 평균 반응을 남긴다",
        "stride 2 합성곱은 남길 정보를 가중치로 학습한다",
      ],
    },
  ],
  references: [
    { title: "Distill — Computing Receptive Fields of CNNs", url: "https://distill.pub/2019/computing-receptive-fields/", note: "본문의 점프 공식을 일반화한 수용영역 계산 (영문)" },
    { title: "Springenberg et al. (2015) — Striving for Simplicity: The All Convolutional Net", url: "https://arxiv.org/abs/1412.6806", note: "풀링을 stride 2 합성곱으로 바꾼 구조 (영문)" },
    { title: "d2l.ai — Pooling", url: "https://d2l.ai/chapter_convolutional-neural-networks/pooling.html", note: "풀링과 다중 채널 처리 (영문)" },
  ],
});
