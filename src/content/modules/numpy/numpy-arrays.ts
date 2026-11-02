import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/numpy-arrays";

export default defineLesson({
  id: "numpy-arrays",
  title: "NumPy 배열, 축, 형태, 자료형",
  tier: "core",
  concepts: ["numpy-arrays"],
  goal: "NumPy 배열을 만들고 원소별 연산·shape·axis·브로드캐스팅의 결과를 실행 전에 예측할 수 있다.",
  why: "",
  body: md`
앞 단계에서 리스트와 반복문으로 계산하는 법을 익혔다. 그런데 숫자 수천·수백만 개를 다루는 AI 코드는 거의 언제나 **NumPy 배열**로 계산한다. 반복문 없이 배열 전체에 한 번에 연산을 적용할 수 있어 코드가 짧아지고, 내부가 C로 구현되어 훨씬 빠르기 때문이다.

### NumPy·Pandas·Matplotlib, 언제 무엇을 쓰나

NumPy는 벡터·행렬 같은 배열 연산을 빠르게 처리하는 도구로, 다음 단계(벡터)부터 이번 주 내내 \`np.array\`, \`np.random\`으로 계속 쓰게 될 라이브러리다. Pandas는 표(행과 열로 이루어진 데이터, 스프레드시트를 떠올리면 된다)를 다루는 도구로, CSV 파일을 읽거나 조건에 맞는 행만 골라내거나 그룹별 통계를 낼 때 쓴다. Matplotlib은 그래프를 그리는 도구다. 다만 이 사이트의 실행 코드 셀은 화면이 없는 환경(Pyodide/Web Worker)에서 돌아가기 때문에 \`plt.show()\`를 호출해도 그래프가 보이지 않는다. 그래서 이 자료의 실습들은 그래프 대신 \`print()\`로 숫자를 직접 찍어 눈으로 확인하는 방식을 쓴다. 실제로 그래프를 그려보고 싶다면 같은 코드를 Google Colab에 붙여넣으면 된다. 세 도구의 관계를 요약하면 "NumPy로 숫자를 계산하고, Pandas로 표를 정리하고, Matplotlib으로 (Colab 등 화면이 있는 환경에서) 눈에 보이게 그린다"는 것이다.

### 배열 만들기와 원소별 계산

NumPy 배열은 리스트를 \`np.array(...)\`로 감싸 만든다. 배열끼리의 \`+\`, \`*\`는 **같은 자리끼리**(원소별, element-wise) 계산한다. 리스트에서 \`[1, 2] + [3, 4]\`가 이어 붙이기(\`[1, 2, 3, 4]\`)였던 것과 다르다는 점에 주의하자.

\`\`\`python
import numpy as np  # numpy 패키지를 np라는 짧은 별명(alias)으로 불러온다: 관례적으로 항상 이렇게 쓴다

a = np.array([1, 2, 3])
b = np.array([10, 20, 30])
print(a + b)            # [11 22 33]: 같은 자리끼리 더한다
print(a * b)            # [10 40 90]: 같은 자리끼리 곱한다 (내적이 아니다)
print(a * 2)            # [2 4 6]: 모든 원소에 2를 곱한다
print(a.sum(), a.mean(), a.max())   # 6 2.0 3
print(np.arange(5))     # [0 1 2 3 4]: range처럼 0부터 4까지
print(np.zeros(3), np.ones((2, 3)).shape)   # [0. 0. 0.] (2, 3)
\`\`\`

리스트였다면 반복문을 돌려야 했을 "같은 자리끼리 곱하기"가 \`a * b\` 한 줄이 된다. 다음 단계의 내적(\`a @ b\`, 같은 자리끼리 곱해 모두 더하기)도 이 원소별 곱 위에 서 있다.

[[diagram:numpy-elementwise]]

### 축(axis)과 브로드캐스팅

이제 2차원 배열(행과 열이 있는 표)로 넘어가 NumPy의 두 핵심 개념인 축(axis)과 브로드캐스팅(broadcasting)을 확인하자. 뒤에 나오는 모든 실습 코드가 이 두 개념 위에서 동작한다.

\`\`\`python
import numpy as np

scores = np.array([[90, 85, 100],   # 1반 점수
                    [70, 95, 80]])  # 2반 점수
print(scores.shape)          # (2, 3): 2행 3열짜리 배열이라는 뜻

print(scores.sum())          # 전체 원소를 다 더한 합
print(scores.sum(axis=0))    # axis=0: 첫 번째 축(행) 방향으로 훑어 같은 열끼리 합 → [160, 180, 180]
print(scores.sum(axis=1))    # axis=1: 두 번째 축(열) 방향으로 훑어 같은 행끼리 합 → [275, 245]

print(scores + 10)           # 배열의 모든 원소에 10을 더함: 브로드캐스팅
\`\`\`

\`shape\`은 배열이 "몇 행 몇 열인가"를 알려준다. \`axis\`(축)는 "어느 방향으로 계산할지"를 지정하는 인자로, \`axis=0\`은 위아래 방향(행을 오가며 같은 열끼리) 계산하고 \`axis=1\`은 좌우 방향(열을 오가며 같은 행끼리) 계산한다는 점만 기억해두자. 헷갈릴 때는 "axis=n은 n번째 축이 계산 후에는 사라진다(합쳐진다)"고 생각하면 도움이 된다. \`scores + 10\`처럼 배열과 스칼라(숫자 하나)를 함께 연산하면, NumPy가 자동으로 그 숫자를 배열의 모든 원소에 맞춰 확장해서 계산해주는데 이를 브로드캐스팅이라 부른다. 지금은 "크기가 작은 쪽이 큰 쪽 모양에 맞춰 자동으로 복제되어 계산된다"는 감각만 잡아두면 충분하다.

[[diagram:numpy-axis]]

### 브로드캐스팅 규칙 한 줄과 \`keepdims\`

모양이 다른 두 배열을 계산할 때 NumPy는 **오른쪽 끝 차원부터** 짝지어 비교한다. 두 차원이 같거나 한쪽이 1이면 맞춰지고(1인 쪽이 복제된다), 둘 다 1이 아닌데 다르면 오류다. 그래서 $(2, 3)$ 배열에서 과목별 평균($(3,)$)을 빼는 것은 되지만, 반별 평균($(2,)$)을 그냥 빼면 오른쪽 끝의 3과 2가 달라 오류가 난다. 이때 \`keepdims=True\`로 합친 축을 길이 1로 남겨 $(2, 1)$을 만들면 각 행에서 자기 평균을 뺄 수 있다.

\`\`\`python
import numpy as np

scores = np.array([[90, 80, 100],
                   [70, 90, 80]])          # shape (2, 3)

col_mean = scores.mean(axis=0)             # shape (3,): 과목별 평균
print(scores - col_mean)                   # (2, 3) - (3,) → 각 행에서 같은 (3,)를 뺀다

row_mean = scores.mean(axis=1)             # shape (2,): 반별 평균
try:
    scores - row_mean                      # (2, 3) - (2,) → 오른쪽 끝 3과 2가 달라 오류
except ValueError as e:
    print("오류:", e)

row_mean = scores.mean(axis=1, keepdims=True)   # shape (2, 1): 축을 남겨 둔다
print(row_mean.shape)
print(scores - row_mean)                   # (2, 3) - (2, 1) → 각 행에서 자기 평균을 뺀다
\`\`\`

과목별 평균은 $[80, 85, 90]$, 반별 평균은 $[90, 80]$이다. 결과를 손으로 한 칸씩 확인해 보자. shape 오류는 초보자가 NumPy에서 가장 자주 만나는 오류이고, 거의 언제나 "어느 축으로 계산했는지"와 "결과의 shape"을 종이에 적어 보면 풀린다.
`,
  checks: [
    {
      key: "c1",
      question: "`x = np.array([[1, 2, 3], [4, 5, 6]])`일 때 `x.sum(axis=0)`의 결과는?",
      choices: ["`[6, 15]`", "`[5, 7, 9]`", "`21`", "`[[5, 7, 9]]`"],
      answer: 1,
      explanation: "`axis=0`은 첫 번째 축(행)이 합쳐져 사라진다. 같은 열끼리 더해 길이 3짜리 결과 `[1+4, 2+5, 3+6]`이 된다.",
    },
    {
      key: "c2",
      question: "shape이 `(4, 3)`인 배열에서 shape `(3,)`인 배열을 빼면 어떻게 되는가?",
      choices: ["오류가 난다", "각 **행**에서 같은 `(3,)` 배열이 빼진다(브로드캐스팅)", "첫 번째 행에서만 빼진다", "결과 shape이 `(3, 4)`가 된다"],
      answer: 1,
      explanation: "브로드캐스팅은 뒤쪽 축부터 크기를 비교한다. 3과 3이 맞으므로 `(3,)`이 4개 행 모두에 복제되어 적용된다. 반대로 `(4,)`를 빼려 하면 3≠4라 오류가 난다.",
    },
    {
      key: "c3",
      question: "`a = np.array([1, 2, 3])`일 때 `a * a`의 결과는?",
      choices: ["`[1, 4, 9]`", "`14`", "`[2, 4, 6]`", "`[1, 2, 3, 1, 2, 3]`"],
      answer: 0,
      explanation: "NumPy 배열끼리의 `*`는 같은 자리끼리 곱하는 원소별 연산이다. 같은 자리끼리 곱해 **모두 더한** 내적은 `a @ a = 14`로 따로 쓴다. 리스트의 `*`(반복)와도 다르다.",
    },
    {
      key: "c4",
      question: "shape이 `(2, 3)`인 배열과 shape이 `(2, 1)`인 배열을 더한 결과의 shape은?",
      choices: ["`(2, 3)`", "`(2, 1)`", "`(2, 4)`", "오류가 난다"],
      answer: 0,
      explanation: "오른쪽 끝부터 비교하면 3과 1(1이므로 복제), 2와 2(같음)라 맞춰진다. $(2, 1)$ 배열이 열 방향으로 복제되어 $(2, 3)$이 된다.",
    },
    {
      key: "c5",
      question: "shape `(2, 3)` 배열 `x`의 각 **행**에서 그 행의 평균을 빼는 올바른 코드는?",
      choices: ["`x - x.mean(axis=1, keepdims=True)`", "`x - x.mean(axis=1)`", "`x - x.mean(axis=0, keepdims=True)`", "`x - x.mean()`"],
      answer: 0,
      explanation: "`x.mean(axis=1)`은 shape `(2,)`라 `(2, 3)`과 오른쪽 끝(3과 2)이 맞지 않는다. `keepdims=True`로 `(2, 1)`을 만들어야 행마다 빠진다. `axis=0`은 열 평균이다.",
    },
    {
      key: "c6",
      question: "shape이 `(4, 3)`인 `scores`에 대해 `scores - scores.mean(axis=1, keepdims=True)`의 결과는?",
      choices: ["shape `(4, 3)`: 각 행에서 그 행의 평균을 뺀 배열", "shape `(4,)`인 배열", "브로드캐스팅 오류", "shape `(3, 4)`: 전치된 배열"],
      answer: 0,
      explanation: "`keepdims=True`이면 평균의 shape이 `(4,)`가 아니라 `(4, 1)`로 남습니다. 뒤쪽 축부터 비교하면 3과 1이므로 1인 축이 3으로 복제되어 `(4, 3)`끼리의 뺄셈이 됩니다. `keepdims` 없이 `(4,)`를 빼면 3 ≠ 4라 오류가 납니다.",
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
print(x.mean(axis=1))
`,
      expected: "(2, 3) [5 7 9]\n[2. 5.]",
      explanation: "axis=0은 행 방향으로 훑어 같은 열끼리 더하므로 `[1+4, 2+5, 3+6]`입니다. axis=1은 같은 행끼리 평균을 내 `[2, 5]`이고, 평균은 실수라 `2.`처럼 소수점이 붙어 출력됩니다.",
    },
  ],
  references: [
    { title: "NumPy: the absolute basics for beginners", url: "https://numpy.org/doc/stable/user/absolute_beginners.html", note: "배열 생성·shape·인덱싱·축 연산 공식 입문서" },
    { title: "NumPy Broadcasting", url: "https://numpy.org/doc/stable/user/basics.broadcasting.html", note: "브로드캐스팅 규칙을 그림으로 설명: shape 오류의 원인을 확인할 때" },
  ],
});
