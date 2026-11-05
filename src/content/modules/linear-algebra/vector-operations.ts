import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/vector-operations";

export default defineLesson({
  id: "vector-operations",
  title: "벡터의 덧셈, 스칼라곱, 선형결합",
  tier: "core",
  concepts: ["vector-operations"],
  goal: "벡터의 덧셈·뺄셈·스칼라곱을 성분별로 계산하고 좌표평면에서 해석하며, 선형결합으로 평균 벡터·보간·방향 이동을 표현한다.",
  why: "경사하강법의 갱신 $\\theta \\leftarrow \\theta - \\eta \\nabla L$은 벡터의 스칼라곱과 뺄셈이고([[lesson:gradient-descent]]), 문장 임베딩은 단어 벡터의 평균(선형결합)으로 만들기도 한다. 어텐션의 출력도 값 벡터들의 가중 합이다([[lesson:self-attention]]).",
  body: md`
### 벡터의 덧셈과 뺄셈

길이가 같은 두 벡터는 **같은 위치의 성분끼리** 더하고 뺀다. $a = [2, 1]$, $b = [1, 3]$이면 $a + b = [3, 4]$, $a - b = [1, -2]$다. 길이가 다른 벡터끼리는 더할 수 없다.

좌표평면에서 벡터를 원점에서 시작하는 화살표로 그리면, $a + b$는 $a$의 끝에서 $b$를 이어 그렸을 때 도착하는 점이다. $a - b$는 $b$의 끝에서 $a$의 끝으로 가는 화살표다. 두 데이터 점의 차 $a - b$는 "$b$에서 $a$로 가려면 각 성분을 얼마나 바꿔야 하는가"를 나타내며, 그 길이가 두 점 사이의 거리다([[lesson:dot-product]]).

### 스칼라곱

벡터에 수(스칼라) $c$를 곱하면 모든 성분에 $c$를 곱한다. $3a = [6, 3]$이다. $c > 0$이면 방향은 그대로 두고 길이를 $c$배로 바꾸고, $c < 0$이면 방향을 반대로 바꾼다. $c = 0$이면 모든 성분이 0인 **영벡터**가 된다.

[[diagram:vector-length-direction]]

\`\`\`python
import numpy as np

a = np.array([2.0, 1.0])
b = np.array([1.0, 3.0])
print(a + b, a - b)        # [3. 4.] [ 1. -2.]
print(3 * a, -1 * a)       # [6. 3.] [-2. -1.]
print(2 * a - b)           # [ 3. -1.]: 스칼라곱과 뺄셈을 함께
\`\`\`

NumPy 배열은 \`+\`, \`-\`, \`*\`가 성분별 계산이다. 파이썬 리스트에서는 \`[2, 1] + [1, 3]\`이 \`[2, 1, 1, 3]\`(이어 붙이기), \`3 * [2, 1]\`이 \`[2, 1, 2, 1, 2, 1]\`(반복)이 되므로 주의한다.

### 선형결합

벡터 $v_1, \ldots, v_k$에 각각 수 $c_1, \ldots, c_k$를 곱해 더한 것을 **선형결합(linear combination)**이라고 한다.

\`\`\`math
c_1 v_1 + c_2 v_2 + \cdots + c_k v_k
\`\`\`

$v_1 = [1, 1]$, $v_2 = [1, 3]$이면 $1 \cdot v_1 + 2 \cdot v_2 = [3, 7]$이다. 거꾸로 $[3, 7]$을 $v_1$과 $v_2$의 선형결합으로 나타내는 계수를 찾으려면 연립방정식 $c_1 + c_2 = 3$, $c_1 + 3c_2 = 7$을 풀면 된다($c_1 = 1$, $c_2 = 2$). 어떤 벡터들의 선형결합으로 만들 수 있는 벡터 전체를 그 벡터들이 **생성(span)**하는 공간이라고 한다. $v_1$, $v_2$처럼 방향이 다른 두 벡터는 평면의 모든 벡터를 만들 수 있다. 이 개념은 [[lesson:linear-maps-basis]]에서 기저와 차원으로 이어진다.

머신러닝에서 자주 쓰는 선형결합은 세 가지다.

| 형태 | 식 | 쓰이는 곳 |
| --- | --- | --- |
| 평균 | $\frac{1}{n}(v_1 + \cdots + v_n)$ | 단어 벡터의 평균으로 문장 벡터 만들기, 클래스의 중심 |
| 가중 합 | $\sum_i w_i v_i$ ($\sum_i w_i = 1$, $w_i \ge 0$) | 어텐션 출력, 앙상블 예측 |
| 보간 | $(1 - t)a + tb$ ($0 \le t \le 1$) | 두 점 사이의 점, 학습률 워밍업 |

보간 $(1 - t)a + tb$는 $t = 0$이면 $a$, $t = 1$이면 $b$이고, $t$가 0에서 1로 늘면 $a$에서 $b$까지의 선분 위를 따라 움직인다.

\`\`\`python
E = np.array([[0.2, 0.4, 0.0],      # 단어 세 개의 임베딩(3차원)
              [0.6, 0.0, 0.2],
              [0.1, 0.5, 0.4]])
print(E.mean(axis=0))               # [0.3 0.3 0.2]: 세 벡터의 평균 = 선형결합(계수 1/3씩)

w = np.array([0.7, 0.2, 0.1])       # 합이 1인 가중치
print(w @ E)                        # 가중 합: 0.7*E[0] + 0.2*E[1] + 0.1*E[2]

for t in (0, 0.25, 0.5, 1):
    print(t, (1 - t) * a + t * b)   # a에서 b까지의 보간
\`\`\`

### 갱신식과 방향 이동

학습에서 파라미터 벡터 $\theta$를 갱신하는 식 $\theta \leftarrow \theta - \eta g$는 "벡터 $g$를 $\eta$배 해서 빼는" 선형결합이다. $g$는 손실이 가장 빠르게 커지는 방향이고([[lesson:gradient]]), $\eta$는 그 방향으로 얼마나 움직일지 정한다.

임베딩 공간에서 벡터의 차가 의미의 차이를 나타내도록 학습되는 경우도 있다. word2vec 같은 단어 임베딩에서 $\text{king} - \text{man} + \text{woman}$이 $\text{queen}$의 벡터와 가까운 현상이 관찰되었다. 아래는 그 계산을 보여 주기 위해 만든 3차원 예이며, 실제 임베딩은 수백 차원이고 이 관계가 항상 정확히 성립하지는 않는다.

\`\`\`python
king = np.array([0.9, 0.8, 0.1])
man = np.array([0.8, 0.1, 0.1])
woman = np.array([0.8, 0.1, 0.9])
queen = np.array([0.85, 0.75, 0.9])
result = king - man + woman
print(result)                                            # [0.9 0.8 0.9]
cos = lambda x, y: x @ y / (np.linalg.norm(x) * np.linalg.norm(y))
print(round(cos(result, queen), 3), round(cos(result, king), 3))   # queen과 더 가깝다
\`\`\`

:::warn 흔한 실수
- **파이썬 리스트로 벡터 계산을 한다.** \`+\`는 이어 붙이기, \`*\`는 반복이다. NumPy 배열로 바꾸거나 성분별로 계산한다.
- **길이가 다른 벡터를 더한다.** 수학에서는 정의되지 않는다. NumPy는 모양에 따라 자동으로 늘려 계산하는 규칙(브로드캐스팅)이 있어 오류 없이 의도하지 않은 결과가 나올 수 있다([[lesson:array-indexing]]).
- **가중 합의 가중치 합을 확인하지 않는다.** 평균처럼 쓰려면 가중치의 합이 1이어야 한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$a = [2, -1, 3]$, $b = [1, 4, 0]$일 때 $a + 2b$는?",
      choices: ["$[4, 7, 3]$", "$[3, 3, 3]$", "$[6, 6, 6]$", "$[4, 3, 3]$"],
      answer: 0,
      explanation: "$2b = [2, 8, 0]$이고, 성분별로 더하면 $[2 + 2, -1 + 8, 3 + 0] = [4, 7, 3]$이다.",
    },
    {
      key: "c2",
      question: "벡터 $v$에 $-2$를 곱하면 $v$와 비교해 방향과 길이는 어떻게 되는가?",
      choices: ["방향은 반대, 길이는 2배", "방향은 같고 길이는 2배", "방향은 반대, 길이는 그대로", "방향은 같고 길이는 1/2"],
      answer: 0,
      explanation: "음수를 곱하면 방향이 반대가 되고, 길이는 곱한 수의 절댓값(2)배가 된다.",
    },
    {
      key: "c3",
      question: "파이썬 리스트로 `[1, 2] + [3, 4]`를 계산한 결과는?",
      choices: ["`[4, 6]`", "`[1, 2, 3, 4]`", "`10`", "`TypeError`"],
      answer: 1,
      explanation: "리스트의 `+`는 두 리스트를 이어 붙인다. 성분별 덧셈은 NumPy 배열 `np.array([1, 2]) + np.array([3, 4])`로 한다.",
    },
    {
      key: "c4",
      question: "$[5, 9]$를 $v_1 = [1, 1]$, $v_2 = [1, 3]$의 선형결합 $c_1 v_1 + c_2 v_2$로 나타낼 때 $(c_1, c_2)$는?",
      choices: ["$(3, 2)$", "$(2, 3)$", "$(5, 9)$", "$(1, 4)$"],
      answer: 0,
      explanation: "$c_1 + c_2 = 5$, $c_1 + 3c_2 = 9$를 빼면 $2c_2 = 4$, $c_2 = 2$이고 $c_1 = 3$이다. 검산: $3[1, 1] + 2[1, 3] = [5, 9]$.",
    },
    {
      key: "c5",
      question: "$a = [0, 0]$, $b = [4, 8]$일 때 보간 $(1 - t)a + tb$에서 $t = 0.25$인 점은?",
      choices: ["$[1, 2]$", "$[3, 6]$", "$[2, 4]$", "$[0.25, 0.25]$"],
      answer: 0,
      explanation: "$0.75 \\cdot [0, 0] + 0.25 \\cdot [4, 8] = [1, 2]$다. $a$에서 $b$까지의 4분의 1 지점이다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
a = np.array([1, 2])
print(a + a, 3 * a, [1, 2] * 2)
print((0.5 * a + 0.5 * np.array([3, 4])).tolist())
`,
      expected: "[2 4] [3 6] [1, 2, 1, 2]\n[2.0, 3.0]",
      explanation: "NumPy 배열의 `+`와 `*`는 성분별 계산이고, 리스트의 `* 2`는 반복이다. 두 벡터의 평균은 $0.5[1, 2] + 0.5[3, 4] = [2, 3]$이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "선형결합의 정의를 쓰고, 머신러닝에서 선형결합이 쓰이는 예를 두 가지 들어 각각의 계수가 무엇인지 설명하라.",
      answer: md`
벡터 $v_1, \ldots, v_k$에 수 $c_1, \ldots, c_k$를 곱해 더한 $c_1 v_1 + \cdots + c_k v_k$가 선형결합이다. 예 ① 문장 벡터를 단어 임베딩의 평균으로 만들 때 계수는 모두 $1/n$이다. 예 ② 경사하강법의 갱신 $\theta - \eta g$는 $\theta$와 기울기 $g$의 선형결합으로 계수는 1과 $-\eta$다. 그 밖에 어텐션의 출력은 값 벡터들의 가중 합으로, 계수는 합이 1인 어텐션 가중치다.
`,
      keyPoints: ["정의: 각 벡터에 수를 곱해 더한 것", "예와 계수 1: 평균(1/n), 경사하강법(1과 $-\\eta$), 어텐션(가중치) 중 둘", "가중 평균이 되려면 계수의 합이 1이어야 한다"],
    },
  ],
  references: [
    { title: "3Blue1Brown — Vectors, what even are they?", url: "https://www.3blue1brown.com/lessons/vectors", note: "벡터의 덧셈과 스칼라곱을 그림으로 (영문)" },
    { title: "3Blue1Brown — Linear combinations, span, and basis vectors", url: "https://www.3blue1brown.com/lessons/span", note: "선형결합과 생성 (영문)" },
  ],
});
