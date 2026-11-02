import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/pooling";

export default defineLesson({
  id: "pooling",
  title: "풀링과 수용영역",
  tier: "core",
  concepts: ["cnn"],
  goal: "Max·Average 풀링의 차이와 strided convolution과의 관계를 설명하고, 점프 $j$를 이용해 여러 층의 수용영역을 계산할 수 있다.",
  why: "",
  body: md`
합성곱이 학습된 커널로 특정 패턴을 검출해 특징 지도를 만드는 연산이라면, 풀링(pooling)은 그렇게 만들어진 특징 지도의 공간 해상도를 줄여 정보를 요약하는 연산이다. 특징 지도의 해상도를 그대로 다음 층에 넘기면 연산량이 커질 뿐 아니라, 물체가 사진 안에서 한두 픽셀 옆으로 옮겨갔을 뿐인데도 결과가 흔들리기 쉽다. 풀링은 작은 영역(대개 $2\times2$)을 하나의 값으로 압축함으로써 이 두 문제를 동시에 완화한다. 방법은 크게 두 가지, 그 영역에서 가장 큰 값만 남기는 Max Pooling과 영역 전체의 평균을 내는 Average Pooling이다.

\`\`\`image
src: /images/week4/max-pooling.png
alt: 4x4 특징 지도에 2x2 필터, stride 2로 Max Pooling을 적용해 2x2 출력으로 줄이는 과정을 보여주는 다이어그램
caption: 4×4 특징 지도를 2×2 영역 단위로 나눠 각 영역의 최댓값만 남기면(2×2 필터, stride 2) 2×2 크기의 출력이 된다. 같은 영역에서 평균을 내면 Average Pooling이 된다.
credit: Aphex34, CC BY-SA 4.0, Wikimedia Commons
width: 570
height: 330
\`\`\`

:::example 예제: $2\times2$ 영역, Max Pooling vs Average Pooling
특징 지도의 한 귀퉁이가 다음과 같은 $2\times2$ 영역이라고 하자: 왼쪽 위 1, 오른쪽 위 3, 왼쪽 아래 2, 오른쪽 아래 4.

- **Max Pooling**: 네 값 중 가장 큰 값 하나만 남긴다 $\to$ max(1, 3, 2, 4) = **4**
- **Average Pooling**: 네 값을 그대로 평균낸다 $\to$ (1 + 3 + 2 + 4) / 4 = **2.5**

같은 입력인데 두 결과가 다르다. Max는 "이 영역 안에 4라는 강한 반응이 존재했다"는 사실 하나만 기억하고 나머지 세 값(1, 2, 3)은 그대로 버린다. Average는 네 값을 전부 반영하지만, 대신 4라는 뾰족한 반응이 다른 값들에 희석되어 2.5로 완만해진다.
:::

이 차이를 직관적으로 풀어보면 이렇다. 합성곱 커널의 출력값은 "이 위치가 내가 찾는 무늬와 얼마나 닮았는가"를 나타내는 반응 강도다. Max Pooling은 그 영역 어딘가에 강한 반응이 하나라도 있었는지, 즉 "그 패턴이 여기 있었는가 없었는가"라는 존재 여부에 민감하다. 고양이 귀의 뾰족한 끝을 찾는 커널이라면, 귀가 그 영역의 정확히 어느 픽셀에 있었는지는 중요하지 않고 "귀가 있었다"는 사실만 다음 층에 넘기면 충분하다. Max Pooling이 물체 위치가 한두 칸 옮겨져도 잘 버티는(불변성, invariance) 이유다. 반면 Average Pooling은 영역 전체의 "전반적인 밝기·강도"에 민감하다. 특정 한 점의 뾰족한 신호보다는 그 구역 전체가 얼마나 고르게 활성화되어 있는지가 중요한 정보일 때, 이를테면 배경의 전체적인 색조나 질감을 다룰 때 유리하다. 그래서 이미지 분류 모델의 중간층에서는 Max Pooling이, 맨 마지막에 "이 채널이 이미지 전체에 걸쳐 얼마나 활성화되었는가"를 하나의 숫자로 요약해 분류기에 넘기는 GAP(Global Average Pooling)에서는 Average Pooling이 주로 쓰인다.

풀링과 비슷한 효과를 내는 또 다른 방법이 stride를 2 이상으로 키운 합성곱(strided convolution)이다. 풀링이 "합성곱으로 특징을 뽑은 다음 별도의 단계에서 크기를 줄이는" 방식이라면, strided convolution은 애초에 커널을 두 칸씩 건너뛰며 슬라이딩시켜 특징 추출과 크기 축소를 한 번에 해치운다. 차이는 정보를 버리는 방식에 있다. Max Pooling은 학습되지 않는 고정된 규칙(무조건 최댓값만 남긴다)으로 정보를 버리는 반면, strided convolution은 "무엇을 남기고 무엇을 버릴지"까지 커널의 가중치가 데이터로부터 학습된다. 그래서 ResNet 이후의 여러 최신 아키텍처는 중간의 Max Pooling 층을 걷어내고 그 자리를 stride 2인 합성곱으로 대체하는 경향을 보인다(Springenberg 등의 "Striving for Simplicity: The All Convolutional Net" 연구가 이 흐름의 근거로 자주 인용된다). 다만 이것이 "풀링은 무조건 열등하다"는 뜻은 아니다. 풀링은 학습되는 파라미터가 전혀 없어 연산이 가볍고 그만큼 과적합의 여지도 적으므로, 계산 자원이 제한적이거나 추가적인 정규화 효과가 필요한 상황에서는 여전히 합리적인 선택이다.

풀링이든 strided convolution이든, 크기를 줄이는 층을 하나씩 통과할 때마다 뒤따르는 층들의 수용영역은 원본 이미지 기준으로 훨씬 빠르게 넓어진다. 이 효과를 정확히 계산하려면 두 가지 수치를 함께 추적해야 한다. 수용영역 크기 $r$과, "이 특징 지도의 한 칸이 원본 이미지에서 몇 픽셀 간격으로 떨어져 있는가"를 나타내는 점프(jump) $j$다. 커널 크기 $k$, stride $s$인 층 하나를 통과할 때마다 이 두 값은 다음과 같이 갱신된다.

\`\`\`math
r_{out} = r_{in} + (k - 1) \cdot j_{in}, \qquad j_{out} = j_{in} \cdot s
\`\`\`

stride 1인 합성곱만 계속 쌓는 가장 단순한 경우를 보면, $j$는 항상 1로 유지되므로 층을 하나 더할 때마다 수용영역은 정확히 $(k-1)$칸씩, 즉 각 변으로 $(k-1)/2$칸씩 넓어진다. $3\times3$ conv($k=3$)라면 층마다 정확히 2칸씩 커지는 셈이다.

| $3\times3$ conv(stride 1) 층 수 | 수용영역 크기 | 계산 |
| --- | --- | --- |
| 1 | $3\times3$ | $r = 1 + 2\times1 = 3$ |
| 2 | $5\times5$ | $r = 3 + 2\times1 = 5$ |
| 3 | $7\times7$ | $r = 5 + 2\times1 = 7$ |
| 4 | $9\times9$ | $r = 7 + 2\times1 = 9$ |
| n | $(2n+1)\times(2n+1)$ | $r = 1 + 2n$ |

여기에 stride 2인 pooling이나 strided convolution이 한 번이라도 끼어들면 이야기가 달라진다. 그 층을 통과하는 순간 점프 $j$가 그대로 2배로 뛰어오르므로($j_{out} = j_{in} \times s$), 그 이후에 쌓이는 모든 층의 수용영역 증가폭도 함께 2배로 커진다. 다운샘플링 층 하나는 단순히 특징 지도 한 장의 크기를 줄이는 데서 그치지 않고, 그 지점에서 점프 값을 배가시켜 그 뒤에 올 모든 층의 수용영역 증가폭까지 함께 확대시킨다. VGG나 ResNet 같은 실제 네트워크가 $3\times3$처럼 작은 커널만 반복해서 쌓았을 뿐인데도 수용영역이 이미지 전체를 뒤덮을 만큼 커지는 것은, 커널 자체가 커서가 아니라 중간중간의 다운샘플링이 점프를 계속 누적시켜주기 때문이다.

:::example 예제: 풀링이 끼어든 세 층의 수용영역
$3 \times 3$ conv(stride 1) → $2 \times 2$ max pool(stride 2) → $3 \times 3$ conv(stride 1)를 차례로 따라가 보자. 시작은 픽셀 하나($r = 1$, $j = 1$)다.

| 층 | $k$ | $s$ | $r_{out} = r_{in} + (k-1)\,j_{in}$ | $j_{out} = j_{in} \cdot s$ |
| --- | --- | --- | --- | --- |
| 입력 | | | 1 | 1 |
| conv $3 \times 3$ | 3 | 1 | $1 + 2 \times 1 = 3$ | 1 |
| pool $2 \times 2$ | 2 | 2 | $3 + 1 \times 1 = 4$ | 2 |
| conv $3 \times 3$ | 3 | 1 | $4 + 2 \times 2 = 8$ | 2 |

마지막 conv는 커널이 똑같이 $3 \times 3$인데도 수용영역을 2가 아니라 **4**만큼 넓혔다. 풀링이 점프를 2로 올려 놓았기 때문이다.
:::

[[diagram:receptive-field-1d]]

방금 손으로 계산했던 Max Pooling과 Average Pooling의 차이를 이번엔 직접 함수로 짜서 확인해보자. 앞 단계에서 만든 \`conv2d\`와 마찬가지로, 입력을 $2\times2$ 영역 단위로 슬라이싱해서 잘라낸 뒤 그 영역에 \`np.max\`(최댓값) 또는 \`np.mean\`(평균)을 적용하면 된다.

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
print("\nMaxPool2x2(y):\n", max_pool2x2(y))
print("\nAvgPool2x2(y):\n", avg_pool2x2(y))
\`\`\`

두 번째 예시에서 강한 반응(9)이 들어 있는 왼쪽 위 $2\times2$ 영역만 놓고 보면, Max Pooling은 그 반응을 그대로 9로 살려서 다음 층에 넘기지만 Average Pooling은 $(1+1+1+9)/4 = 3$으로 완만하게 눌러버린다. "이 영역에 강한 반응이 있었는지"가 중요한 경우와 "이 영역이 전반적으로 얼마나 활성화되어 있는지"가 중요한 경우, 두 풀링이 서로 다른 정보를 남긴다는 것을 코드로도 확인할 수 있다.

[[diagram:pool-max-vs-avg]]


풀링을 반복문 없이 한 번에 계산하는 방법도 알아두자. \`axis\` 인자는 "어느 축을 따라 계산할지"를 정하고, \`reshape\`는 숫자의 개수는 그대로 둔 채 배열의 모양만 바꾼다. 예컨대 \`y.reshape(2, 2, 2, 2)\`는 $4\times4$ 배열을 "세로 블록 2개, 블록 안 세로칸 2개, 가로 블록 2개, 블록 안 가로칸 2개"라는 4차원 구조로 다시 쪼개 보는 것이다. 이 둘을 합치면 반복문 없이 풀링을 계산할 수 있다.

\`\`\`python
import numpy as np

y = np.array([[1., 1., 2., 1.],
              [1., 9., 1., 1.],
              [1., 1., 1., 2.],
              [1., 1., 1., 1.]])

blocks = y.reshape(2, 2, 2, 2)   # (세로블록, 블록 내 세로칸, 가로블록, 블록 내 가로칸)
print("reshape 후 shape:", blocks.shape)  # (2, 2, 2, 2)
print("axis=(1, 3) 최댓값:\n", blocks.max(axis=(1, 3)))  # 블록 내부(1, 3번 축)만 골라 최댓값
\`\`\`

\`axis=(1, 3)\`은 "1번 축과 3번 축, 즉 각 블록 내부의 세로·가로 두 칸만 남기고 그 안에서 최댓값을 구하라"는 뜻이다. 그 결과 앞서 반복문으로 만든 \`max_pool2x2(y)\`와 정확히 같은 $2\times2$ 결과가 한 줄로 나온다. 참고로 이미지를 배열로 다룰 때는 (높이, 너비, 채널) 순서(예: \`(H, W, 3)\`)로 저장하는 경우와, 파이토치처럼 (채널, 높이, 너비) 순서(\`(3, H, W)\`)로 저장하는 경우가 둘 다 흔히 쓰이는데, 두 순서를 서로 바꿔야 할 때는 \`arr.transpose(2, 0, 1)\`처럼 축의 순서 자체를 바꿔주는 \`transpose\`를 사용한다.
`,
  checks: [
    {
      key: "c1",
      question: "$2\\times2$ 영역 $[[5, 1], [2, 0]]$에 Max Pooling과 Average Pooling을 적용한 결과는?",
      choices: ["Max 5, Average 2", "Max 5, Average 8", "Max 2, Average 5", "Max 1, Average 2"],
      answer: 0,
      explanation: "Max는 가장 큰 값 5, Average는 $(5+1+2+0)/4 = 2$.",
    },
    {
      key: "c2",
      question: "$3\\times3$ conv(stride 1) → $2\\times2$ pool(stride 2) → $3\\times3$ conv(stride 1)를 거친 뒤의 수용영역은?",
      choices: ["$7$", "$8$", "$6$", "$9$"],
      answer: 1,
      explanation: "conv: $r = 3$, $j = 1$ → pool: $r = 3 + 1\\cdot1 = 4$, $j = 2$ → conv: $r = 4 + 2\\cdot2 = 8$.",
    },
    {
      key: "c3",
      question: "Max Pooling 대신 stride 2 합성곱을 쓰는 방식의 차이로 옳은 것은?",
      choices: ["stride 2 합성곱은 크기를 줄이지 않는다", "stride 2 합성곱은 무엇을 남기고 버릴지를 학습한다", "Max Pooling이 파라미터가 더 많다", "두 방법은 완전히 같다"],
      answer: 1,
      explanation: "풀링은 고정된 규칙으로 정보를 버리고, strided convolution은 그 선택까지 가중치로 학습한다. 대신 풀링은 파라미터가 없어 가볍다.",
    },
    {
      key: "c4",
      question: "$3 \\times 3$ conv(stride 2) 다음에 $3 \\times 3$ conv(stride 1)를 쌓았을 때의 수용영역은?",
      choices: ["7", "5", "6", "9"],
      answer: 0,
      explanation: "첫 층 뒤 $r = 3$, $j = 2$이고, 둘째 층은 $r = 3 + (3 - 1) \\times 2 = 7$이다. stride 1만 두 번이면 5였을 것이다.",
    },
    {
      key: "c5",
      question: "GAP(Global Average Pooling)가 $7 \\times 7 \\times 512$ 특징 지도에 하는 일은?",
      choices: ["채널마다 $7 \\times 7$개 값의 평균을 내 길이 512인 벡터를 만든다", "각 위치에서 512개 채널의 평균을 내 $7 \\times 7$ 지도를 만든다", "최댓값 하나만 남긴다", "$2 \\times 2$ 영역마다 평균을 낸다"],
      answer: 0,
      explanation: "GAP는 채널마다 공간 전체를 평균 내 \"이 특징이 이미지 전체에 얼마나 나타났는가\"를 숫자 하나로 요약한다. 그래서 출력이 채널 수만큼의 벡터가 된다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
y = np.array([[1., 1., 2., 1.],
              [1., 9., 1., 1.],
              [1., 1., 1., 2.],
              [1., 1., 1., 1.]])
blocks = y.reshape(2, 2, 2, 2)
print(blocks.max(axis=(1, 3)).tolist())
print(blocks.mean(axis=(1, 3)).tolist())
`,
      expected: "[[9.0, 2.0], [1.0, 2.0]]\n[[3.0, 1.25], [1.0, 1.25]]",
      explanation: "왼쪽 위 블록 `[[1, 1], [1, 9]]`의 최댓값은 9, 평균은 3입니다. Max는 강한 반응 하나를 그대로 남기고, Average는 그 반응을 주변 값과 섞어 3으로 희석합니다.",
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
      explanation: "$3 \\times 3$ conv 두 층으로 수용영역이 3, 5가 되고, $2 \\times 2$ 풀링(보폭 2)이 6으로 늘리면서 점프를 2로 만듭니다. 그 뒤의 $3 \\times 3$ conv는 $(3-1) \\times 2 = 4$만큼 넓혀 10이 됩니다. 같은 conv라도 뒤쪽 층일수록 수용영역을 더 크게 넓힙니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$3\\times3$ conv 두 층을 쌓은 수용영역 크기는? 세 층이면? 점프(jump) j와 수용영역 갱신식을 이용해 계산 과정을 적어라.",
      answer: md`
2층: $5\times 5$. 3층: $7\times 7$. jump는 stride 1인 conv를 지날 때마다 그대로 유지되므로($j=1$), $r_{out} = r_{in} + (k-1)\cdot j$ 에 따라 층을 지날 때마다 수용영역이 $(k-1)=2$씩 늘어난다. $1 \to 3 \to 5 \to 7$.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "$2\\times2$ 영역 [[1,3],[2,4]]에 Max Pooling과 Average Pooling을 각각 적용한 결과는? 두 결과가 다른 이유를 '패턴의 존재 여부'와 '전체 강도'라는 관점에서 설명하라.",
      answer: md`
Max Pooling: 4(영역 중 최댓값). Average Pooling: (1+3+2+4)/4=2.5(평균). Max Pooling은 그 영역에 강한 신호(패턴)가 하나라도 있었는지에 민감하고, Average Pooling은 국소 영역 전체의 평균적인 강도에 민감하다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "Max Pooling 대신 stride 2인 합성곱(strided convolution)을 쓰는 최근 아키텍처의 흐름은 정보 손실 관점에서 어떻게 설명할 수 있는가?",
      answer: md`
풀링은 이미 계산된 특징 지도에서 정해진 규칙(최댓값/평균)으로 값을 버리며 크기를 줄이지만, strided convolution은 학습 가능한 커널이 건너뛰며 스캔하므로 어떤 정보를 남길지 자체를 학습할 수 있다. 그래서 정보 손실을 스스로 조절할 여지가 더 크다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Distill — Computing Receptive Fields of CNNs", url: "https://distill.pub/2019/computing-receptive-fields/", note: "본문의 점프 공식을 일반화한 수용영역 계산 (심화)" },
    { title: "d2l.ai — Pooling", url: "https://d2l.ai/chapter_convolutional-neural-networks/pooling.html", note: "풀링과 다중 채널 처리 (한국어판: ko.d2l.ai)" },
  ],
});
