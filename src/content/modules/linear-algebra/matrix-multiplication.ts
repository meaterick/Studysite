import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/matrix-multiplication";

export default defineLesson({
  id: "matrix-multiplication",
  title: "행렬의 형태, 전치, 행렬곱",
  tier: "core",
  concepts: ["matrix-operations"],
  goal: "행렬-벡터 곱을 행마다 내적으로, 행렬곱을 행과 열의 내적으로 계산하고, 모양 규칙·곱의 순서·전치의 곱 규칙을 적용해 신경망 한 층의 계산을 샘플 묶음에 대해 쓴다.",
  why: "신경망의 완전연결 층은 입력 묶음 $X$와 가중치 $W$의 행렬곱 $XW + b$이고([[lesson:perceptron-mlp]]), 트랜스포머의 어텐션 점수도 행렬곱 $QK^\\top$이다([[lesson:self-attention]]). 역전파에서 기울기의 모양을 맞출 때는 전치의 곱 규칙을 쓴다([[lesson:backprop]]).",
  body: md`
### 행렬-벡터 곱: 행마다 내적

행렬 $W$와 벡터 $x$의 곱 $Wx$는 **$W$의 각 행과 $x$의 내적을 차례로 계산해 쌓은 벡터**다([[lesson:dot-product]]).

\`\`\`math
W = \begin{bmatrix}1 & 2\\3 & 4\\0 & -1\end{bmatrix}, \quad x = \begin{bmatrix}1\\1\end{bmatrix}, \quad Wx = \begin{bmatrix}1\cdot 1 + 2\cdot 1\\3\cdot 1 + 4\cdot 1\\0\cdot 1 + (-1)\cdot 1\end{bmatrix} = \begin{bmatrix}3\\7\\-1\end{bmatrix}
\`\`\`

$W$의 **열 개수와 $x$의 길이가 같아야** 곱할 수 있고, 결과의 길이는 $W$의 **행 개수**다. $3 \times 2$ 행렬은 길이 2인 벡터를 길이 3인 벡터로 보낸다. 신경망의 한 층에서 출력 하나하나는 자기 가중치(행렬의 한 행)와 입력 벡터의 내적이고, 그 결과를 모은 벡터가 층의 출력이다.

[[diagram:matvec-rows]]

\`\`\`python
import numpy as np

W = np.array([[1, 2],
              [3, 4],
              [0, -1]])                # 3×2
x = np.array([1, 1])
print(W @ x)                           # [ 3  7 -1]: @는 행렬 곱
print([int(row @ x) for row in W])     # 같은 계산을 행마다 내적으로
\`\`\`

### 행렬곱

$A$가 $m \times n$, $B$가 $n \times p$일 때 곱 $C = AB$는 $m \times p$ 행렬이고, $i$행 $j$열 원소는 **$A$의 $i$번째 행과 $B$의 $j$번째 열의 내적**이다.

\`\`\`math
C_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj}
\`\`\`

모양 규칙은 $(m \times n)(n \times p) = (m \times p)$다. **안쪽의 $n$이 같아야** 곱할 수 있고, 바깥의 $m$과 $p$가 결과의 모양이 된다. 행렬-벡터 곱은 $p = 1$인 경우다. 원소 하나를 계산하는 데 곱셈이 $n$번 필요하므로 전체 곱셈 수는 $m \times n \times p$다. $1024 \times 1024$ 행렬 두 개를 곱하면 약 10억 번의 곱셈과 덧셈이 필요하다. 이 계산을 병렬로 처리하는 장치가 GPU다.

[[diagram:matmul-rowcol]]

손으로 계산해 본다.

\`\`\`math
A = \begin{bmatrix}1 & 2\\0 & 1\end{bmatrix}, \quad B = \begin{bmatrix}1 & 0\\3 & 1\end{bmatrix}, \quad AB = \begin{bmatrix}1\cdot1 + 2\cdot3 & 1\cdot0 + 2\cdot1\\0\cdot1 + 1\cdot3 & 0\cdot0 + 1\cdot1\end{bmatrix} = \begin{bmatrix}7 & 2\\3 & 1\end{bmatrix}
\`\`\`

### 곱하는 순서가 결과를 바꾼다

수의 곱셈은 $3 \times 5 = 5 \times 3$이지만, 행렬곱은 일반적으로 $AB \ne BA$다. 위의 $A$, $B$로 계산하면 $BA = \begin{bmatrix}1 & 2\\3 & 7\end{bmatrix}$로 $AB$와 다르다.

이유는 행렬곱이 함수의 합성이기 때문이다([[lesson:functions-composition]]). $(AB)x = A(Bx)$이므로 $AB$는 "$B$를 먼저 적용하고 그 결과에 $A$를 적용하는" 변환이다. $A$는 둘째 성분의 2배를 첫째 성분에 더하는 변환이고, $B$는 첫째 성분의 3배를 둘째 성분에 더하는 변환이다. 어느 변환을 먼저 적용하느냐에 따라 중간 결과가 달라지므로 최종 결과도 다르다.

[[diagram:matmul-order]]

\`\`\`python
A = np.array([[1, 2], [0, 1]])
B = np.array([[1, 0], [3, 1]])
print(A @ B)              # [[7 2] [3 1]]
print(B @ A)              # [[1 2] [3 7]]: 순서를 바꾸면 다른 행렬

M = np.ones((2, 3))
N = np.ones((3, 4))
print((M @ N).shape)      # (2, 4): 안쪽 3이 같아 곱할 수 있다
try:
    M @ M                 # (2×3)(2×3): 안쪽 3과 2가 달라 곱할 수 없다
except ValueError as e:
    print("ValueError: 안쪽 차원이 맞지 않는다")
\`\`\`

### 전치와 곱

전치는 행과 열을 바꾼다([[lesson:scalars-tensors]]). 행렬곱을 전치하면 **각각을 전치하고 순서를 뒤집는다.**

\`\`\`math
(AB)^\top = B^\top A^\top
\`\`\`

모양으로 확인할 수 있다. $AB$가 $(m \times n)(n \times p) = m \times p$이면 $(AB)^\top$은 $p \times m$이고, $B^\top A^\top$은 $(p \times n)(n \times m) = p \times m$이다. 순서를 뒤집지 않은 $A^\top B^\top$은 $(n \times m)(p \times n)$이라 일반적으로 곱할 수조차 없다. 역전파에서 손실의 기울기를 층을 따라 거꾸로 전달할 때 가중치 행렬의 전치가 나타나고, 곱하는 순서도 순전파와 반대가 된다([[lesson:backprop]]).

두 벡터의 내적도 행렬곱으로 쓸 수 있다. 벡터를 $n \times 1$ 행렬(열벡터)로 보면 $x \cdot y = x^\top y$이고 결과는 $1 \times 1$ 행렬이다.

\`\`\`python
print(np.array_equal((A @ B).T, B.T @ A.T))    # True
x, y = np.array([1, 2]), np.array([3, 4])
print(x @ y, x.reshape(1, 2) @ y.reshape(2, 1))  # 11 [[11]]
\`\`\`

### 샘플 묶음을 한 번에 계산하기

샘플 $N$개를 행으로 쌓은 입력 행렬 $X$($N \times D$)와 가중치 행렬 $W$($D \times H$)를 곱하면 $XW$($N \times H$)의 $i$번째 행이 $i$번째 샘플에 대한 층의 출력이다. 편향 $b$(길이 $H$)는 모든 행에 똑같이 더한다. 샘플마다 반복문으로 계산한 결과와 같지만, 행렬곱 한 번으로 처리하면 훨씬 빠르다([[lesson:vectorization]]).

\`\`\`python
rng = np.random.default_rng(0)
X = rng.normal(size=(4, 3))        # 샘플 4개, 특성 3개
W = rng.normal(size=(3, 2))        # 입력 3개 → 출력 2개
b = np.array([0.5, -0.5])
by_loop = np.array([x_i @ W + b for x_i in X])   # 샘플마다 계산
by_batch = X @ W + b                              # 한 번에 계산(b는 모든 행에 더해진다)
print(np.allclose(by_loop, by_batch), by_batch.shape)   # True (4, 2)
\`\`\`

이 레슨에서는 샘플을 행으로 쌓은 $XW$ 형태를 썼다. 앞의 $Wx$처럼 입력을 열벡터로 두는 형태와는 전치 관계($XW = (W^\top X^\top)^\top$)이며, 교재와 라이브러리마다 쓰는 형태가 다르므로 모양을 보고 판단한다.

### 항등행렬

대각선이 모두 1이고 나머지가 0인 정사각행렬 $I$를 **항등행렬**이라고 한다. 어떤 행렬에 곱해도 그 행렬이 그대로 나온다($AI = IA = A$). 수의 곱셈에서 1과 같은 역할이며, NumPy에서는 \`np.eye(n)\`으로 만든다. 곱해서 $I$가 되는 행렬(역행렬)은 [[lesson:linear-maps-basis]]에서 다룬다.

:::warn 흔한 실수
- **\`*\`를 행렬곱으로 쓴다.** NumPy의 \`A * B\`는 같은 위치의 원소끼리 곱한다. 행렬곱은 \`A @ B\`다.
- **모양을 확인하지 않는다.** 곱하기 전에 안쪽 차원이 같은지, 결과가 원하는 모양인지 \`.shape\`로 확인한다.
- **순서를 바꿔 쓴다.** $AB$와 $BA$는 다르다. $XW$와 $WX$도 다르다.
- **전치의 곱에서 순서를 그대로 둔다.** $(AB)^\top = B^\top A^\top$이다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$2 \\times 3$ 행렬과 $3 \\times 4$ 행렬을 곱한 결과의 모양은?",
      choices: ["$2 \\times 4$", "$3 \\times 3$", "$2 \\times 3$", "곱할 수 없다"],
      answer: 0,
      explanation: "안쪽 차원 3이 같아 곱할 수 있고, 바깥 차원 2와 4가 결과의 모양이 된다: $(2 \\times 3)(3 \\times 4) = (2 \\times 4)$.",
    },
    {
      key: "c2",
      question: "$A = \\begin{bmatrix}1 & 2\\\\ 3 & 4\\end{bmatrix}$, $B = \\begin{bmatrix}5 & 6\\\\ 7 & 8\\end{bmatrix}$일 때 $AB$의 1행 1열 원소는?",
      choices: ["19", "5", "22", "23"],
      answer: 0,
      explanation: "$A$의 1행 $[1, 2]$와 $B$의 1열 $[5, 7]$의 내적이다: $1 \\cdot 5 + 2 \\cdot 7 = 19$. 1행 2열은 $1 \\cdot 6 + 2 \\cdot 8 = 22$다.",
    },
    {
      key: "c3",
      question: "$(AB)x$를 계산할 때 $x$에 먼저 적용되는 변환과, $(AB)^\\top$을 올바르게 쓴 것은?",
      choices: ["$A$가 먼저 / $A^\\top B^\\top$", "$B$가 먼저 / $B^\\top A^\\top$", "$A$가 먼저 / $B^\\top A^\\top$", "$B$가 먼저 / $A^\\top B^\\top$"],
      answer: 1,
      explanation: "$(AB)x = A(Bx)$이므로 오른쪽의 $B$가 먼저 적용된다. 전치하면 순서가 뒤집혀 $(AB)^\\top = B^\\top A^\\top$이다.",
    },
    {
      key: "c4",
      question: "$W = \\begin{bmatrix}1 & 0\\\\ 2 & 1\\end{bmatrix}$, $x = [3, 4]$일 때 $Wx$는?",
      choices: ["$[3, 10]$", "$[11, 4]$", "$[3, 4]$", "$[7, 7]$"],
      answer: 0,
      explanation: "$Wx$는 $W$의 각 행과 $x$의 내적이다. 첫 행 $[1, 0] \\cdot [3, 4] = 3$, 둘째 행 $[2, 1] \\cdot [3, 4] = 10$이다. 열과 내적한 $[11, 4]$는 $W^\\top x$다.",
    },
    {
      key: "c5",
      question: "입력 묶음 $X$의 모양이 $(32, 784)$, 가중치 $W$가 $(784, 128)$, 편향 $b$의 길이가 128일 때 $XW + b$의 모양은?",
      choices: ["$(32, 128)$", "$(784, 128)$", "$(32, 784)$", "$(128, 32)$"],
      answer: 0,
      explanation: "$(32 \\times 784)(784 \\times 128) = 32 \\times 128$이고, 편향은 모든 행에 더해지므로 모양이 바뀌지 않는다. 행마다 샘플 하나의 출력 128개다.",
    },
    {
      key: "c6",
      question: "NumPy에서 `A = np.array([[1, 2], [3, 4]])`, `B = np.array([[5, 6], [7, 8]])`일 때 `(A * B)[0, 1]`과 `(A @ B)[0, 1]`은?",
      choices: ["12와 22", "22와 12", "12와 12", "6과 22"],
      answer: 0,
      explanation: "`*`는 같은 위치끼리 곱하므로 $2 \\times 6 = 12$이고, `@`는 행렬곱이라 1행과 2열의 내적 $1 \\cdot 6 + 2 \\cdot 8 = 22$다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
W = np.array([[1, 2],
              [3, 4],
              [0, -1]])
x = np.array([1, 1])
print(W @ x, (W @ x).shape)
`,
      expected: "[ 3  7 -1] (3,)",
      explanation: "$Wx$의 각 성분은 $W$의 한 행과 $x$의 내적이라 $[1 + 2,\\ 3 + 4,\\ 0 - 1] = [3, 7, -1]$이다. $3 \\times 2$ 행렬에 길이 2인 벡터를 곱하면 결과의 길이는 행 개수 3이다. NumPy는 정수 배열의 자릿수를 맞춰 출력하므로 `[ 3  7 -1]`처럼 공백이 들어간다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "행렬-벡터 곱 $Wx$를 \"행마다 내적\"으로 설명하고, $W$가 $m \\times n$일 때 곱할 수 있는 조건과 결과의 모양, 신경망의 한 층에서 각 행이 뜻하는 것을 써라.",
      answer: md`
$Wx$의 $i$번째 성분은 $W$의 $i$번째 행과 $x$의 내적이다. 그래서 $W$의 열 개수 $n$과 $x$의 길이가 같아야 곱할 수 있고, 결과는 행 개수와 같은 길이 $m$인 벡터다. 즉 $W$는 $n$차원 입력을 $m$차원 출력으로 보내는 변환이다. 신경망의 한 층에서 $W$의 각 행은 출력 하나의 가중치이고, 그 행과 입력의 내적(에 편향을 더한 값)이 그 출력이다.
`,
      keyPoints: ["$i$번째 성분 = $i$번째 행과 $x$의 내적", "열 개수 = $x$의 길이, 결과의 길이 = 행 개수", "각 행은 출력 하나의 가중치"],
    },
    {
      key: "d2",
      question: "$A=\\begin{bmatrix}1 & 2\\\\ 0 & 1\\end{bmatrix}$, $B=\\begin{bmatrix}1 & 0\\\\ 3 & 1\\end{bmatrix}$일 때 $AB$와 $BA$를 직접 계산하고, 두 결과가 다른 이유를 함수의 합성으로 설명하라.",
      answer: md`
$AB = \begin{bmatrix}7 & 2\\3 & 1\end{bmatrix}$, $BA = \begin{bmatrix}1 & 2\\3 & 7\end{bmatrix}$로 서로 다르다. $(AB)x = A(Bx)$이므로 $AB$는 $B$를 먼저 적용한 뒤 $A$를 적용하는 합성 변환이고, $BA$는 그 반대 순서다. $A$는 둘째 성분의 2배를 첫째 성분에 더하고 $B$는 첫째 성분의 3배를 둘째 성분에 더하므로, 먼저 적용한 변환이 바꾼 값이 다음 변환의 입력이 되어 결과가 달라진다. 함수의 합성 $f(g(x))$와 $g(f(x))$가 일반적으로 다른 것과 같다.
`,
      keyPoints: ["$AB$와 $BA$의 계산 결과", "$(AB)x = A(Bx)$: 오른쪽이 먼저 적용된다", "합성의 순서가 바뀌면 결과가 바뀐다"],
    },
  ],
  references: [
    { title: "3Blue1Brown — Matrix multiplication as composition", url: "https://www.3blue1brown.com/lessons/matrix-multiplication", note: "행렬곱 = 변환의 합성, 순서가 중요한 이유 (영문)" },
    { title: "NumPy — matmul", url: "https://numpy.org/doc/stable/reference/generated/numpy.matmul.html", note: "@ 연산자의 규칙 (영문)" },
  ],
});
