import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/numpy-arrays";

export default defineLesson({
  id: "numpy-arrays",
  title: "NumPy 배열, 축, 형태, 자료형",
  tier: "core",
  concepts: ["numpy-arrays"],
  goal: "NumPy 배열을 만들고 자료형(dtype)을 확인·변환하며, 원소별 연산과 축(axis)을 지정한 집계의 결과와 그 모양을 실행 전에 예측한다.",
  why: "머신러닝 라이브러리는 데이터와 파라미터를 모두 NumPy 배열이나 같은 규칙을 따르는 텐서로 다룬다([[lesson:pytorch]]). pandas의 열도 내부적으로 NumPy 배열이고([[lesson:dataframes]]), 배열의 자료형은 메모리 사용량과 계산 정밀도를 정한다.",
  body: md`
### 리스트 대신 배열을 쓰는 이유

파이썬 리스트는 원소마다 자료형이 달라도 되고, 원소 하나하나가 따로 저장된 파이썬 객체다. NumPy 배열(\`ndarray\`)은 **모든 원소의 자료형이 같고**, 원소들이 메모리에 연속으로 저장된다. 그래서 배열 전체에 하나의 연산을 적용할 때 반복문 없이 C로 구현된 코드가 한꺼번에 처리하고, 같은 계산이 리스트보다 수십 배 이상 빠르다([[lesson:vectorization]]). 배열의 모양(shape)과 차원 수(ndim)는 [[lesson:scalars-tensors]]에서 다루었다.

### 배열 만들기

\`\`\`python
import numpy as np

print(np.array([[1, 2, 3], [4, 5, 6]]))   # 중첩 리스트 → 2차원 배열
print(np.zeros((2, 3)))                    # 0으로 채운 (2, 3) 배열
print(np.ones(3), np.full(3, 7))           # 1로, 7로 채운 길이 3 배열
print(np.arange(0, 10, 3))                 # [0 3 6 9]: range처럼 끝값은 포함하지 않는다
print(np.linspace(0, 1, 5))                # [0.   0.25 0.5  0.75 1.  ]: 끝값을 포함해 5개로 균등 분할
print(np.eye(2))                           # 2×2 단위행렬
\`\`\`

\`np.arange\`는 간격을, \`np.linspace\`는 개수를 정한다. 실수 간격으로 \`arange\`를 쓰면 반올림 오차 때문에 끝값 근처의 원소 개수가 예상과 다를 수 있으므로, 개수가 중요할 때는 \`linspace\`를 쓴다.

### 자료형

배열의 모든 원소는 같은 자료형(\`dtype\`)을 가진다. 정수는 보통 \`int64\`, 실수는 \`float64\`, 참·거짓은 \`bool\`이다. 정수와 실수를 섞어 만들면 모두 실수로 바뀐다.

\`\`\`python
a = np.array([1, 2, 3])
b = np.array([1, 2.5, 3])
print(a.dtype, b.dtype)              # int64 float64: 실수가 하나라도 있으면 실수 배열
print(a / 2, a // 2)                 # [0.5 1.  1.5] [0 1 1]: /는 실수 나눗셈, //는 정수 나눗셈

a[0] = 9.7                           # 정수 배열에 실수를 넣으면
print(a)                             # [9 2 3]: 소수점 이하가 버려진다
print(a.astype(np.float32), a.astype(np.float32).dtype)   # 자료형 변환

x = np.zeros(1_000_000)
print(x.nbytes, x.astype(np.float32).nbytes)   # 8000000 4000000: float32는 메모리가 절반
\`\`\`

\`float64\`는 원소 하나에 8바이트, \`float32\`는 4바이트를 쓴다. 딥러닝에서는 메모리와 속도를 위해 보통 \`float32\`를 쓰고, 더 작은 형식(16비트 등)도 쓴다([[lesson:pytorch-practice]]). 문자열이 하나라도 섞이면 \`np.array([1, "a"])\`처럼 모든 원소가 문자열 배열이 되어 계산이 되지 않으므로, 데이터를 읽은 뒤에는 \`dtype\`부터 확인한다.

### 원소별 연산

배열끼리의 산술 연산과 비교 연산은 **같은 자리의 원소끼리** 계산한다. 리스트의 \`+\`가 두 리스트를 이어 붙이는 것과 다르다.

\`\`\`python
a = np.array([1, 2, 3])
b = np.array([10, 20, 30])
print(a + b, a * b, a ** 2)          # [11 22 33] [10 40 90] [1 4 9]
print(a * 2 + 1)                     # [3 5 7]: 수 하나와의 연산은 모든 원소에 적용된다
print(a > 1)                         # [False  True  True]: 비교 결과는 bool 배열
print(np.sqrt(a), np.exp(0 * a))     # 수학 함수도 원소마다 적용된다
print([1, 2, 3] + [10, 20, 30])      # 리스트의 +는 이어 붙이기
\`\`\`

[[diagram:numpy-elementwise]]

\`np.sqrt\`, \`np.exp\`, \`np.log\`처럼 배열의 원소마다 같은 함수를 적용하는 함수를 **유니버설 함수**(ufunc)라고 한다. 같은 자리끼리 곱해 모두 더하는 내적은 \`a @ b\`로 따로 쓴다([[lesson:dot-product]]).

### 축을 따라 집계하기

\`sum\`, \`mean\`, \`max\`, \`argmax\` 같은 집계 함수에 \`axis\`를 지정하면 그 축을 따라 값을 합쳐 축 하나를 없앤다. 행이 학생, 열이 과목인 $(2, 3)$ 점수표에서 \`axis=0\`은 학생 축을 합쳐 과목마다 값 하나를, \`axis=1\`은 과목 축을 합쳐 학생마다 값 하나를 만든다.

\`\`\`python
scores = np.array([[90, 85, 100],     # 학생 0
                   [70, 95, 80]])     # 학생 1   (행: 학생, 열: 과목)
print(scores.sum())                   # 520: 전체 합
print(scores.sum(axis=0))             # [160 180 180]: 과목별 합, shape (3,)
print(scores.mean(axis=1))            # [91.66666667 81.66666667]: 학생별 평균, shape (2,)
print(scores.argmax(axis=1))          # [2 1]: 학생마다 점수가 가장 높은 과목의 번호
print(scores.max(axis=0, keepdims=True).shape)   # (1, 3): 합친 축을 길이 1로 남긴다
\`\`\`

[[diagram:numpy-axis]]

모양이 $(2, 3)$인 배열에 \`axis=0\`을 쓰면 결과는 $(3,)$, \`axis=1\`을 쓰면 $(2,)$다. "지정한 축이 결과의 모양에서 빠진다"고 기억하면 결과의 모양을 미리 알 수 있다. 3차원 이상에서도 같다. 이미지 묶음 $(N, H, W, 3)$에서 \`axis=(1, 2)\`로 평균을 내면 이미지마다 색별 평균인 $(N, 3)$이 된다. \`keepdims=True\`는 합친 축을 길이 1로 남겨, 결과를 원래 배열과 다시 계산할 때 쓴다([[lesson:array-indexing]]).

### 1차원 배열과 2차원 배열을 구분하기

모양 $(3,)$, $(1, 3)$, $(3, 1)$은 원소가 모두 3개지만 서로 다른 배열이다. $(3,)$은 축이 하나인 벡터이고, $(1, 3)$은 행이 하나인 행렬, $(3, 1)$은 열이 하나인 행렬이다. 함수에 따라 요구하는 모양이 다르므로(예: scikit-learn은 특성 행렬로 2차원 배열을 요구한다) \`reshape(-1, 1)\`이나 \`reshape(1, -1)\`로 맞춘다.

\`\`\`python
v = np.array([1, 2, 3])
print(v.shape, v.reshape(1, -1).shape, v.reshape(-1, 1).shape)   # (3,) (1, 3) (3, 1)
\`\`\`

:::warn 흔한 실수
- **리스트와 배열의 연산을 혼동한다.** 리스트의 \`+\`는 이어 붙이기, \`*\`는 반복이다. 배열은 원소별로 계산한다.
- **정수 배열에 실수를 넣는다.** 소수점 이하가 경고 없이 버려진다. 실수 계산을 할 배열은 처음부터 \`float\`로 만든다.
- **\`axis\`의 방향을 거꾸로 쓴다.** 결과에서 사라질 축을 지정한다. 과목별 평균이 필요하면 학생 축(\`axis=0\`)을 지정한다.
- **$(n,)$과 $(n, 1)$을 같은 것으로 본다.** 다음 레슨의 브로드캐스팅에서 둘은 전혀 다른 결과를 만든다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`x = np.array([[1, 2, 3], [4, 5, 6]])`일 때 `x.sum(axis=0)`의 결과는?",
      choices: ["`[6, 15]`", "`[5, 7, 9]`", "`21`", "`[[5, 7, 9]]`"],
      answer: 1,
      explanation: "`axis=0`은 첫 번째 축(행)을 합쳐 없앤다. 같은 열끼리 더해 길이 3인 `[1 + 4, 2 + 5, 3 + 6]`이 된다.",
    },
    {
      key: "c2",
      question: "`np.array([1, 2.5, 3]).dtype`은?",
      choices: ["`float64`", "`int64`", "`object`", "원소마다 다르다"],
      answer: 0,
      explanation: "배열의 원소는 모두 같은 자료형이어야 하므로, 실수가 하나라도 있으면 정수도 실수로 바뀌어 `float64` 배열이 된다.",
    },
    {
      key: "c3",
      question: "`a = np.array([1, 2, 3])`일 때 `a * a`의 결과는?",
      choices: ["`[1, 4, 9]`", "`14`", "`[2, 4, 6]`", "`[1, 2, 3, 1, 2, 3]`"],
      answer: 0,
      explanation: "배열끼리의 `*`는 같은 자리끼리 곱하는 원소별 연산이다. 곱해서 모두 더하는 내적은 `a @ a = 14`로 쓴다. 리스트의 `*`(반복)와도 다르다.",
    },
    {
      key: "c4",
      question: "모양이 `(32, 28, 28, 3)`인 이미지 묶음 `x`에 대해 `x.mean(axis=(1, 2))`의 모양은?",
      choices: ["`(32, 3)`", "`(28, 28)`", "`(32, 28, 28)`", "`(3,)`"],
      answer: 0,
      explanation: "지정한 축 1과 2(세로·가로)가 결과에서 빠지므로 `(32, 3)`이 된다. 이미지마다 색별 평균 밝기다.",
    },
    {
      key: "c5",
      question: "`a = np.array([1, 2, 3])`에서 `a[0] = 9.7`을 실행한 뒤 `a`는?",
      choices: ["`[9 2 3]`", "`[9.7 2. 3.]`", "오류가 난다", "`[10 2 3]`"],
      answer: 0,
      explanation: "`a`는 `int64` 배열이라 실수를 넣으면 소수점 이하가 버려진다. 반올림이 아니라 버림이고, 경고도 나오지 않는다.",
    },
    {
      key: "c6",
      question: "`scores`의 모양이 `(학생 수, 과목 수)`일 때, 학생마다 점수가 가장 높은 과목의 번호를 구하는 코드는?",
      choices: ["`scores.argmax(axis=1)`", "`scores.argmax(axis=0)`", "`scores.max(axis=1)`", "`scores.argmax()`"],
      answer: 0,
      explanation: "과목 축(axis=1)을 따라 가장 큰 값의 위치를 찾는다. `max`는 값 자체를, 축 없는 `argmax()`는 배열을 펼쳤을 때의 위치 하나를 돌려준다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
x = np.array([[1, 2, 3],
              [4, 5, 6]])
print(x.shape, x.sum(axis=0))
print(x.mean(axis=1), x.dtype, x.mean(axis=1).dtype)
`,
      expected: "(2, 3) [5 7 9]\n[2. 5.] int64 float64",
      explanation: "`axis=0`은 같은 열끼리 더해 `[1 + 4, 2 + 5, 3 + 6]`이다. `axis=1`은 같은 행끼리 평균을 내 `[2, 5]`이고, 평균은 실수라 결과의 자료형이 `float64`가 되어 `2.`처럼 출력된다. 원래 배열은 정수 배열이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "모양이 `(100, 4)`인 배열 `X`(샘플 100개, 특성 4개)에서 `X.mean(axis=0)`과 `X.mean(axis=1)`이 각각 무엇을 계산하는지, 결과의 모양과 함께 설명하라. 특성마다 평균을 빼려면 어느 쪽을 써야 하는지도 쓰라.",
      answer: md`
\`X.mean(axis=0)\`은 샘플 축(0번 축)을 합쳐 없애므로 특성마다 100개 샘플의 평균을 구하고, 결과의 모양은 $(4,)$다. \`X.mean(axis=1)\`은 특성 축(1번 축)을 합쳐 없애므로 샘플마다 4개 특성의 평균을 구하고, 결과의 모양은 $(100,)$다.

특성마다 평균을 빼려면 \`X - X.mean(axis=0)\`을 쓴다. 모양 $(100, 4)$와 $(4,)$는 오른쪽 끝 축의 길이가 같아, 같은 특성 평균이 100개 행 모두에서 빠진다. 샘플마다의 평균(axis=1)은 특성의 단위가 서로 다를 때 의미가 없는 값이다.
`,
      keyPoints: ["axis=0: 특성별 평균, 모양 (4,)", "axis=1: 샘플별 평균, 모양 (100,)", "지정한 축이 결과에서 빠진다", "특성별 중심화는 X - X.mean(axis=0)"],
    },
  ],
  references: [
    { title: "NumPy — the absolute basics for beginners", url: "https://numpy.org/doc/stable/user/absolute_beginners.html", note: "배열 생성, 자료형, 축 연산 공식 입문서 (영문)" },
    { title: "NumPy — Data types", url: "https://numpy.org/doc/stable/user/basics.types.html", note: "dtype의 종류와 변환 (영문)" },
  ],
});
