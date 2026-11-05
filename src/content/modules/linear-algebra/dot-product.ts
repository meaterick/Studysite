import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/dot-product";

export default defineLesson({
  id: "dot-product",
  title: "내적, 길이, 거리, 코사인 유사도",
  tier: "core",
  concepts: ["dot-product-similarity"],
  goal: "내적·노름·거리·코사인 유사도를 손으로 계산하고, 코사인 유사도가 벡터의 크기와 관계없이 방향의 비슷함만 재는 이유를 설명한다.",
  why: "검색 시스템은 질문과 문서를 벡터로 바꾼 뒤 코사인 유사도가 큰 문서를 고르고([[lesson:retrieval]]), 어텐션은 쿼리와 키의 내적으로 어떤 토큰을 참고할지 정한다([[lesson:self-attention]]). 신경망 한 층의 계산도 가중치 벡터와 입력 벡터의 내적을 여러 번 한 것이다([[lesson:matrix-multiplication]]).",
  body: md`
### 내적

AI 시스템은 단어, 문장, 이미지를 수백 개의 수로 된 벡터로 나타낸다. 두 벡터가 얼마나 비슷한지 재는 가장 기본적인 연산이 **내적(dot product)**이다. 길이가 같은 두 벡터의 같은 위치 성분끼리 곱해 모두 더한다.

\`\`\`math
a \cdot b = \sum_{i=1}^{n} a_i b_i = a_1 b_1 + a_2 b_2 + \cdots + a_n b_n
\`\`\`

$a = [1, 2]$, $b = [2, 1]$이면 $a \cdot b = 1 \cdot 2 + 2 \cdot 1 = 4$다. 내적은 기하학적으로 다음과 같다. $\theta$는 두 벡터 사이의 각이고 $|a|$는 벡터의 길이다.

\`\`\`math
a \cdot b = |a|\,|b| \cos\theta
\`\`\`

그래서 내적의 부호는 두 벡터의 방향 관계를 알려 준다. 사잇각이 90°보다 작으면 양수, 90°이면 0, 90°보다 크면 음수다. 내적이 0인 두 벡터를 **직교한다(orthogonal)**고 한다. $[1, 2]$와 $[2, -1]$은 $1 \cdot 2 + 2 \cdot (-1) = 0$이므로 직교한다.

[[diagram:dot-product-angle]]

### 길이(노름)와 거리

벡터의 **길이** 또는 **L2 노름**은 피타고라스 정리와 같다. 자기 자신과의 내적의 제곱근이다.

\`\`\`math
|a| = \sqrt{a \cdot a} = \sqrt{a_1^2 + \cdots + a_n^2}
\`\`\`

$[3, 4]$의 길이는 $\sqrt{9 + 16} = 5$다. 성분의 절댓값을 더한 $\sum_i |a_i|$는 **L1 노름**이라고 하며, 규제([[lesson:regularization]])에서 쓴다. 길이가 1인 벡터를 **단위벡터**라고 한다. 벡터를 자기 길이로 나누면 방향은 그대로인 단위벡터가 된다($[3, 4] / 5 = [0.6, 0.8]$). 이것을 **정규화(normalization)**라고 한다.

두 점 $a$, $b$ 사이의 **유클리드 거리**는 차 벡터의 길이 $|a - b|$다. $a = [1, 2]$, $b = [4, 6]$이면 $a - b = [-3, -4]$이고 거리는 5다. 전개하면 $|a - b|^2 = |a|^2 + |b|^2 - 2\,a \cdot b$가 되어, 거리와 내적이 서로 연결되어 있음을 알 수 있다. 가까운 이웃을 찾는 알고리즘은 이 거리를 쓴다([[lesson:knn-trees]]).

[[diagram:vector-length-direction]]

### 코사인 유사도

내적은 방향뿐 아니라 길이에도 비례한다. 벡터 하나를 10배로 늘리면 내적도 10배가 된다. 길이의 영향을 없애고 **방향이 얼마나 비슷한지만** 재려면 내적을 두 길이로 나눈다. 이것이 **코사인 유사도**다.

\`\`\`math
\cos\theta = \frac{a \cdot b}{|a|\,|b|}
\`\`\`

값의 범위는 −1(정반대 방향)부터 1(같은 방향)까지이고, 0이면 직교한다.

:::example 예제: 코사인 유사도를 손으로 계산하기
$a = [1, 2]$, $b = [2, 1]$이면 내적은 4이고 두 길이는 모두 $\sqrt{5}$다. 따라서 $\cos\theta = \frac{4}{\sqrt{5}\sqrt{5}} = 0.8$이고, 각도로는 약 $36.9°$다. $b$를 $[20, 10]$으로 10배 늘리면 내적은 40이 되지만 $|b|$도 10배가 되어 코사인 유사도는 여전히 0.8이다.
:::

검색 시스템이 코사인 유사도를 쓰는 이유가 이 성질이다. 문서를 단어 빈도 벡터로 나타내면 긴 문서일수록 벡터가 길어져 내적이 커진다. 코사인 유사도는 길이로 나누므로 문서의 길이가 아니라 단어 구성의 비율로 비교한다.

\`\`\`python
import numpy as np

def cos_sim(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))   # a @ b는 내적, np.linalg.norm은 L2 노름

king  = np.array([0.9, 0.8, 0.1])     # 계산을 보여 주기 위해 만든 3차원 예
queen = np.array([0.85, 0.75, 0.9])
apple = np.array([0.1, 0.05, 0.5])
print("king·queen:", round(cos_sim(king, queen), 3))   # 0.832
print("king·apple:", round(cos_sim(king, apple), 3))   # 0.291
print("10배로 늘려도:", round(cos_sim(king, 10 * queen), 3))
\`\`\`

실제 단어 임베딩은 수백 차원이지만 계산은 같다. 의미가 비슷한 단어의 벡터가 비슷한 방향을 향하도록 학습된다([[lesson:embeddings]]).

### 정규화한 벡터의 내적

두 벡터를 미리 단위벡터로 정규화해 두면 길이가 모두 1이라 내적이 곧 코사인 유사도다. 문서 수백만 개의 벡터를 정규화해 저장해 두면, 검색할 때마다 길이를 다시 계산하지 않고 내적만으로 유사도를 비교할 수 있다. 벡터 검색 시스템이 저장 전에 벡터를 정규화하는 이유다([[lesson:ann-indexes]]).

\`\`\`python
u = king / np.linalg.norm(king)
q = queen / np.linalg.norm(queen)
print(round(np.linalg.norm(u), 3), round(u @ q, 3))   # 1.0, 코사인 유사도와 같은 0.832
\`\`\`

:::warn 흔한 실수
- **내적이 크면 비슷하다고 판단한다.** 길이가 긴 벡터는 내적이 크게 나온다. 방향만 비교하려면 코사인 유사도를 쓴다.
- **L1 노름과 L2 노름을 혼동한다.** $[6, 8]$의 L2 노름은 10, L1 노름은 14다.
- **영벡터의 코사인 유사도를 계산한다.** 길이가 0이라 0으로 나누게 된다. 영벡터인지 먼저 확인한다.
- **거리와 유사도의 방향을 혼동한다.** 거리는 작을수록, 코사인 유사도는 클수록 비슷하다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$a = [2, 0]$, $b = [3, 4]$일 때 $a \\cdot b$와 $\\cos(a, b)$는?",
      choices: ["$6$, $0.6$", "$6$, $0.8$", "$8$, $0.6$", "$14$, $1$"],
      answer: 0,
      explanation: "$a\\cdot b = 2\\times3 + 0\\times4 = 6$, $|a|=2$, $|b|=5$이므로 $\\cos = 6/(2\\times5) = 0.6$.",
    },
    {
      key: "c2",
      question: "두 벡터의 코사인 유사도가 $-1$이라는 것은 무슨 뜻인가?",
      choices: ["두 벡터가 직교한다", "두 벡터의 길이가 같다", "두 벡터가 정반대 방향을 향한다", "두 벡터 중 하나가 영벡터다"],
      answer: 2,
      explanation: "$\\cos\\theta = -1$은 사잇각이 180°, 즉 완전히 반대 방향이라는 뜻이다. 직교(90°)는 0이다.",
    },
    {
      key: "c3",
      question: "벡터 $b$를 10배로 늘리면 $a\\cdot b$와 $\\cos(a, b)$는 각각 어떻게 되는가?",
      choices: ["둘 다 10배가 된다", "내적은 10배, 코사인 유사도는 그대로", "내적은 그대로, 코사인 유사도는 10배", "둘 다 그대로"],
      answer: 1,
      explanation: "코사인 유사도는 내적을 두 벡터의 길이로 나누므로 크기의 영향이 사라진다. 그래서 문서 길이가 달라도 주제의 유사도를 공정하게 비교할 수 있다.",
    },
    {
      key: "c4",
      question: "$a = [1, 2]$와 $b = [4, 6]$ 사이의 유클리드 거리는?",
      choices: ["5", "7", "25", "$\\sqrt{7}$"],
      answer: 0,
      explanation: "$a - b = [-3, -4]$이고 거리는 그 길이 $\\sqrt{9 + 16} = 5$다. 성분 차의 절댓값을 더한 7은 L1 거리다.",
    },
    {
      key: "c5",
      question: "벡터 $[6, 8]$의 길이 $|a|$는?",
      choices: ["10", "14", "48", "100"],
      answer: 0,
      explanation: "$\\sqrt{6^2 + 8^2} = \\sqrt{100} = 10$이다. 성분을 그냥 더한 14는 L1 노름이고, 제곱근을 씌우기 전의 100은 길이의 제곱이다.",
    },
    {
      key: "c6",
      question: "$a = [1, 2]$, $b = [2, -1]$의 내적과, 두 벡터의 관계로 옳은 것은?",
      choices: ["내적 0, 서로 직교한다", "내적 4, 같은 방향이다", "내적 −4, 반대 방향이다", "내적 0, 같은 벡터다"],
      answer: 0,
      explanation: "$1 \\cdot 2 + 2 \\cdot (-1) = 0$이다. 내적이 0이면 $\\cos\\theta = 0$, 즉 두 벡터는 90도를 이루어 서로 직교한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
a = np.array([3.0, 4.0])
b = np.array([6.0, 8.0])
c = np.array([4.0, -3.0])
print(a @ b, np.linalg.norm(a), a @ c)
print(round(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)), 3), (a / np.linalg.norm(a)).tolist())
`,
      expected: "50.0 5.0 0.0\n1.0 [0.6, 0.8]",
      explanation: "$a \\cdot b = 18 + 32 = 50$, $|a| = 5$다. $a \\cdot c = 12 - 12 = 0$이므로 $a$와 $c$는 직교한다. $b = 2a$라서 방향이 같아 코사인 유사도는 1이고, $a$를 정규화하면 $[0.6, 0.8]$이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$a=[1,2]$, $b=[2,1]$의 내적과 코사인 유사도는?",
      answer: md`
내적 = $1 \cdot 2 + 2 \cdot 1 = 4$. 두 벡터의 길이는 모두 $\sqrt{1 + 4} = \sqrt{5}$이므로 코사인 유사도 $= \frac{4}{\sqrt5 \cdot \sqrt5} = 0.8$이다(사잇각 약 $36.9°$).
`,
      keyPoints: ["내적: 같은 위치 성분의 곱의 합 = 4", "길이: 각각 $\\sqrt{5}$", "코사인 유사도 = 내적 / (길이의 곱) = 0.8"],
    },
    {
      key: "d2",
      question: "검색 시스템이 문서 유사도에 내적 대신 코사인 유사도를 쓰는 이유를 \"긴 문서와 짧은 문서\" 관점에서 설명하라. $b$를 10배 하면 내적과 코사인 유사도가 각각 어떻게 되는지를 근거로 든다.",
      answer: md`
내적은 두 벡터의 크기에 비례해 커지므로, 단어 수가 많아 벡터가 긴 문서는 내용이 덜 관련되어도 내적 점수가 커진다. 예를 들어 $b$를 10배 하면 $a \cdot b$는 4에서 40으로 커지지만 코사인 유사도는 0.8 그대로다. 코사인 유사도는 크기로 나눠 방향(단어 구성 비율)만 비교하므로 문서 길이에 따른 편향 없이 내용의 비슷함을 잰다.
`,
      keyPoints: ["내적은 벡터 크기(문서 길이)에 비례해 커진다", "b를 10배 해도 코사인 유사도는 0.8로 같다", "코사인 유사도는 크기로 나눠 방향만 비교한다", "긴 문서가 길이만으로 유리해지는 문제를 막는다"],
    },
  ],
  references: [
    { title: "3Blue1Brown — Dot products and duality", url: "https://www.3blue1brown.com/lessons/dot-products", note: "내적의 기하학적 의미(투영) (영문)" },
    { title: "Mathematics for Machine Learning (무료 PDF)", url: "https://mml-book.github.io/", note: "3장 해석기하: 내적·노름·각도의 정의 (영문)" },
  ],
});
