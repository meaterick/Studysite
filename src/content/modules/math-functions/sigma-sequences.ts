import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/sigma-sequences";

export default defineLesson({
  id: "sigma-sequences",
  title: "시그마 표기와 수열의 기초",
  tier: "core",
  concepts: ["sigma-sequences"],
  goal: "수열과 시그마($\\Sigma$) 표기를 읽고 쓰며, 합의 성질과 등차·등비수열의 합을 계산하고, $\\Sigma$ 식을 반복문과 배열 연산으로 옮긴다.",
  why: "평균, 분산, 손실, 내적, 행렬곱은 모두 $\\Sigma$로 쓴다. $\\Sigma$ 식을 코드로 옮길 수 있어야 논문의 수식을 구현할 수 있고([[lesson:vectorization]]), 학습률을 일정한 비율로 줄이는 스케줄처럼 등비수열이 나오는 계산도 다룰 수 있다([[lesson:training-schedules]]).",
  body: md`
### 수열

**수열(sequence)**은 수를 순서대로 늘어놓은 것이다. $i$번째 항을 $a_i$로 쓰고, 항을 만드는 규칙을 일반항이라고 한다. 일반항이 $a_i = 2i - 1$이면 수열은 $1, 3, 5, 7, \ldots$이다. 데이터 $n$개의 값 $x_1, x_2, \ldots, x_n$도 수열이다.

수학에서는 보통 첫 항을 $i = 1$로 쓰지만 파이썬의 인덱스는 0부터 시작한다. 수식의 $x_1, \ldots, x_n$은 코드에서 \`x[0]\`부터 \`x[n - 1]\`까지다.

### 시그마 표기

여러 항의 합을 그리스 문자 $\Sigma$(시그마)로 줄여 쓴다.

\`\`\`math
\sum_{i=1}^{n} a_i = a_1 + a_2 + \cdots + a_n
\`\`\`

$i$를 **인덱스**라고 하고, 아래의 $i = 1$부터 위의 $n$까지 1씩 늘리며 $a_i$를 모두 더한다는 뜻이다. 손으로 계산하면 $\sum_{i=1}^{4} i^2 = 1 + 4 + 9 + 16 = 30$이다. 코드로는 반복문, \`sum()\`, NumPy의 \`np.sum()\` 세 가지로 쓸 수 있다. 끝 값을 포함하므로 \`range(1, n + 1)\`이다.

\`\`\`python
import numpy as np

n = 4
total = 0
for i in range(1, n + 1):         # i = 1, 2, 3, 4
    total += i ** 2
print(total)                                   # 30
print(sum(i ** 2 for i in range(1, n + 1)))    # 30
print(np.sum(np.arange(1, n + 1) ** 2))        # 30: 배열에 한 번에 계산
\`\`\`

$\Sigma$ 식은 세 단계로 읽는다.

1. 인덱스가 어디서 시작해 어디서 끝나는지 확인한다. $\sum_{i=1}^{4}$이면 $i = 1, 2, 3, 4$다.
2. 인덱스마다 $\Sigma$ 오른쪽의 항을 계산한다. 항이 $i^2$이면 $1, 4, 9, 16$이다.
3. 계산한 항을 모두 더한다.

반복문이 합을 만드는 과정을 한 줄씩 출력하면 다음과 같다.

\`\`\`python
total = 0
for i in range(1, 5):
    total += i ** 2
    print(i, i ** 2, total)
\`\`\`

\`\`\`output
1 1 1
2 4 5
3 9 14
4 16 30
\`\`\`

| $i$ | 항 $i^2$ | 더한 뒤의 \`total\` |
| --- | --- | --- |
| 1 | 1 | 1 |
| 2 | 4 | 5 |
| 3 | 9 | 14 |
| 4 | 16 | 30 |

:::task 직접 해 보기
\`range(1, 5)\`를 \`range(1, 11)\`로 바꾸기 전에, 제곱의 합 공식 $\sum_{i=1}^{n} i^2 = \frac{n(n + 1)(2n + 1)}{6}$으로 $n = 10$일 때의 값을 먼저 계산한다. 그다음 실행해 마지막 줄의 \`total\`과 비교한다.
:::

### 합의 성질

| 성질 | 식 |
| --- | --- |
| 상수배 | $\sum_{i} c\, a_i = c \sum_{i} a_i$ |
| 덧셈 분배 | $\sum_{i} (a_i + b_i) = \sum_{i} a_i + \sum_{i} b_i$ |
| 상수의 합 | $\sum_{i=1}^{n} c = nc$ |

:::example 예제: 성질로 $\sum_{i=1}^{3} (2i + 5)$ 계산하기
1. 덧셈 분배: $\sum_{i=1}^{3} (2i + 5) = \sum_{i=1}^{3} 2i + \sum_{i=1}^{3} 5$
2. 상수배: $\sum_{i=1}^{3} 2i = 2\sum_{i=1}^{3} i = 2 \times (1 + 2 + 3) = 12$
3. 상수의 합: $\sum_{i=1}^{3} 5 = 3 \times 5 = 15$
4. 두 결과를 더한다: $12 + 15 = 27$

항을 직접 쓰면 $7 + 9 + 11 = 27$로 같다.
:::

\`\`\`python
print(sum(2 * i + 5 for i in range(1, 4)), 2 * sum(range(1, 4)) + 3 * 5)   # 27 27
\`\`\`

곱은 이렇게 나눌 수 없다. 일반적으로 $\sum_i a_i b_i \ne \left(\sum_i a_i\right)\left(\sum_i b_i\right)$이다. $a = (1, 2)$, $b = (3, 4)$이면 왼쪽은 $1 \cdot 3 + 2 \cdot 4 = 11$, 오른쪽은 $3 \times 7 = 21$이다. 왼쪽의 같은 위치끼리 곱해 더하는 계산이 내적이다([[lesson:dot-product]]).

### 통계량과 손실을 $\Sigma$로 쓰기

| 이름 | 식 | 코드 |
| --- | --- | --- |
| 평균 | $\bar x = \frac{1}{n}\sum_{i=1}^{n} x_i$ | \`x.mean()\` |
| 분산 | $\frac{1}{n}\sum_{i=1}^{n} (x_i - \bar x)^2$ | \`((x - x.mean()) ** 2).mean()\` |
| 평균제곱오차 | $\frac{1}{n}\sum_{i=1}^{n} (\hat y_i - y_i)^2$ | \`((y_hat - y) ** 2).mean()\` |
| 내적 | $\sum_{i=1}^{n} a_i b_i$ | \`(a * b).sum()\` |

$\Sigma$ 안의 식은 "같은 인덱스의 원소끼리" 계산한다. NumPy 배열은 같은 위치의 원소끼리 계산하는 연산을 기본으로 하므로 $\Sigma$ 식을 거의 그대로 옮길 수 있다.

\`\`\`python
x = np.array([2.0, 4.0, 9.0])
n = len(x)
mean = sum(x[i] for i in range(n)) / n                    # (1/n) Σ x_i
var = sum((x[i] - mean) ** 2 for i in range(n)) / n       # (1/n) Σ (x_i - mean)^2
print(mean, var, x.mean(), x.var())                       # 같은 값

a, b = np.array([1, 2]), np.array([3, 4])
print((a * b).sum(), a.sum() * b.sum())                   # 11 21: 곱의 합 ≠ 합의 곱
\`\`\`

분산을 표로 나누어 계산하면 $\Sigma$ 안의 식을 원소마다 계산한 뒤 더한다는 것이 보인다. 평균은 $\bar x = \frac{2 + 4 + 9}{3} = 5$다.

| $i$ | $x_i$ | $x_i - \bar x$ | $(x_i - \bar x)^2$ |
| --- | --- | --- | --- |
| 1 | 2 | −3 | 9 |
| 2 | 4 | −1 | 1 |
| 3 | 9 | 4 | 16 |
| 합 | 15 | 0 | 26 |

분산은 $\frac{26}{3} \approx 8.667$이고, 코드의 \`8.666666666666666\`과 같다. 평균과의 차이(편차)를 그대로 더하면 항상 0이 된다. 양수와 음수가 서로 지워지므로, 분산은 편차를 제곱해서 더한다.

### 등차수열과 등비수열

- **등차수열**: 이웃한 항의 차가 일정한 수열이다. 첫 항부터 $n$항까지의 합은 $\frac{n(a_1 + a_n)}{2}$이다. $1 + 2 + \cdots + 100 = \frac{100 \times 101}{2} = 5050$이다.
- **등비수열**: 이웃한 항의 비가 일정한 수열이다. 첫 항이 $a$, 공비가 $r \ne 1$이면 $n$항까지의 합은 $\frac{a(1 - r^n)}{1 - r}$이다. $|r| < 1$이면 항이 한없이 계속될 때의 합이 $\frac{a}{1 - r}$로 정해진다. $1 + \frac{1}{2} + \frac{1}{4} + \cdots = 2$다.

학습률을 매번 일정한 비율 $\gamma$로 줄이는 스케줄 $\eta_t = \eta_0 \gamma^t$는 등비수열이다. $\eta_0 = 0.1$, $\gamma = 0.9$이면 50번 동안 쓰는 학습률의 합은 $\frac{0.1(1 - 0.9^{50})}{1 - 0.9} \approx 0.995$이고, 아무리 오래 학습해도 합이 $\frac{0.1}{0.1} = 1$을 넘지 않는다. 파라미터가 움직일 수 있는 총량이 제한된다는 뜻이다.

\`\`\`python
lr0, gamma, steps = 0.1, 0.9, 50
by_loop = sum(lr0 * gamma ** t for t in range(steps))
by_formula = lr0 * (1 - gamma ** steps) / (1 - gamma)
print(round(by_loop, 6), round(by_formula, 6), lr0 / (1 - gamma))
print(sum(range(1, 101)), 100 * 101 // 2)     # 5050 5050
\`\`\`

항이 끝없이 계속되는 등비수열의 합이 하나의 값으로 정해진다는 것은, 더하는 항의 개수를 늘릴수록 부분합(처음 몇 항까지의 합)이 그 값에 한없이 가까워진다는 뜻이다. $1 + \frac{1}{2} + \frac{1}{4} + \cdots$의 부분합은 다음과 같다.

\`\`\`python
for n in (1, 2, 3, 4, 10, 20):
    print(n, sum(0.5 ** k for k in range(n)))
\`\`\`

\`\`\`output
1 1.0
2 1.5
3 1.75
4 1.875
10 1.998046875
20 1.9999980926513672
\`\`\`

2와의 차이는 $1, 0.5, 0.25, 0.125, \ldots$로 매번 절반이 되지만 0이 되지는 않는다. 공식 $\frac{a(1 - r^n)}{1 - r}$에 $a = 1$, $r = 0.5$, $n = 4$를 넣어도 $\frac{1 - 0.0625}{0.5} = 1.875$다.

### 이중 시그마

인덱스가 두 개인 값 $a_{ij}$(행렬의 $i$행 $j$열 원소 등)는 시그마를 두 번 써서 더한다. $\sum_{i=1}^{m}\sum_{j=1}^{n} a_{ij}$는 모든 원소의 합이고, 유한한 합은 더하는 순서를 바꿔도 같다. 행렬곱의 원소 $c_{ij} = \sum_k a_{ik} b_{kj}$처럼 $\Sigma$ 안에 다른 인덱스가 남아 있는 식도 많다([[lesson:matrix-multiplication]]).

2행 3열의 값으로 확인하면 다음과 같다.

| | $j = 1$ | $j = 2$ | $j = 3$ | 행의 합 |
| --- | --- | --- | --- | --- |
| $i = 1$ | 1 | 2 | 3 | 6 |
| $i = 2$ | 4 | 5 | 6 | 15 |
| 열의 합 | 5 | 7 | 9 | 21 |

행의 합을 먼저 구해 더해도($6 + 15$), 열의 합을 먼저 구해 더해도($5 + 7 + 9$) 전체 합은 21이다. 코드에서는 안쪽 반복이 안쪽 $\Sigma$다.

\`\`\`python
a = [[1, 2, 3],
     [4, 5, 6]]
m, n = 2, 3
# 안쪽 합의 인덱스가 j: 행마다 더한 뒤 행의 합을 더한다
by_rows = sum(sum(a[i][j] for j in range(n)) for i in range(m))
# 안쪽 합의 인덱스가 i: 열마다 더한 뒤 열의 합을 더한다
by_cols = sum(sum(a[i][j] for i in range(m)) for j in range(n))
print(by_rows, by_cols)   # 21 21
\`\`\`

:::warn 흔한 실수
- **끝 인덱스를 빠뜨린다.** $\sum_{i=1}^{n}$은 $n$을 포함하므로 \`range(1, n + 1)\`이다.
- **곱의 합을 합의 곱으로 바꾼다.** $\sum a_i b_i \ne (\sum a_i)(\sum b_i)$다.
- **평균의 $\frac{1}{n}$을 빠뜨린다.** 합과 평균은 크기가 $n$배 다르다. 손실의 크기가 데이터 수에 따라 바뀌면 학습률의 의미도 바뀐다.
- **등비수열 합 공식을 $r = 1$에 쓴다.** 분모가 0이다. $r = 1$이면 합은 $na$다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$\\sum_{i=1}^{4} i^2$의 값은?",
      choices: ["10", "16", "30", "100"],
      answer: 2,
      explanation: "$1 + 4 + 9 + 16 = 30$이다.",
    },
    {
      key: "c2",
      question: "$\\sum_{i=1}^{n} 3$의 값은?",
      choices: ["3", "$3n$", "$n + 3$", "$3^n$"],
      answer: 1,
      explanation: "상수 3을 $n$번 더하므로 $3n$이다. 더하는 것이지 곱하는 것이 아니므로 $3^n$이 아니고, $n + 3$도 아니다.",
    },
    {
      key: "c3",
      question: "$a = (1, 2)$, $b = (3, 4)$일 때 $\\sum_i a_i b_i$와 $(\\sum_i a_i)(\\sum_i b_i)$는?",
      choices: ["11과 21", "21과 11", "11과 11", "10과 21"],
      answer: 0,
      explanation: "$1 \\cdot 3 + 2 \\cdot 4 = 11$이고 $(1 + 2)(3 + 4) = 21$이다. 곱의 합과 합의 곱은 일반적으로 다르다.",
    },
    {
      key: "c4",
      question: "$1 + \\frac{1}{2} + \\frac{1}{4} + \\frac{1}{8} + \\cdots$ (한없이 계속)의 합은?",
      choices: ["1", "2", "무한대", "1.875"],
      answer: 1,
      explanation: "첫 항 1, 공비 $\\frac{1}{2}$인 등비수열이다. $|r| < 1$이므로 합은 $\\frac{1}{1 - 1/2} = 2$다. 항이 한없이 많아도 합이 한없이 커지지는 않으며, 1.875는 넷째 항까지의 부분합이다.",
    },
    {
      key: "c5",
      question: "평균제곱오차 $\\frac{1}{n}\\sum_{i=1}^{n}(\\hat y_i - y_i)^2$를 파이썬 리스트 `y_hat`, `y`로 옮긴 코드로 알맞은 것은?",
      choices: [
        "`sum((y_hat[i] - y[i]) ** 2 for i in range(1, len(y))) / len(y)`",
        "`sum((y_hat[i] - y[i]) ** 2 for i in range(len(y))) / len(y)`",
        "`(sum(y_hat) - sum(y)) ** 2 / len(y)`",
        "`sum(y_hat[i] - y[i] for i in range(len(y))) ** 2`",
      ],
      answer: 1,
      explanation: "수식의 $i = 1, \\ldots, n$은 코드의 인덱스 $0, \\ldots, n - 1$이다. 첫 번째는 0번을 빠뜨리고, 세 번째와 네 번째는 제곱과 합의 순서를 바꿔 다른 값을 계산한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
print(sum(range(1, 101)), sum(2 * i - 1 for i in range(1, 6)), sum(0.5 ** k for k in range(20)) > 1.99)
`,
      expected: "5050 25 True",
      explanation: "1부터 100까지의 합은 5050이다. $2i - 1$을 $i = 1, \\ldots, 5$에서 더하면 $1 + 3 + 5 + 7 + 9 = 25 = 5^2$다. 공비 0.5인 등비수열 20항의 합은 $2(1 - 0.5^{20}) \\approx 1.999998$이다.",
    },
    {
      key: "p2",
      question: "홀수를 차례로 더하며 중간 합을 출력한다. 출력을 예측하십시오.",
      code: py`
total = 0
for i in range(1, 4):
    total += 2 * i - 1
    print(i, total)
`,
      expected: "1 1\n2 4\n3 9",
      explanation: "$\\sum_{i=1}^{k} (2i - 1)$을 $k = 1, 2, 3$까지 차례로 출력한다. 항은 $1, 3, 5$이고, 더한 뒤의 값은 $1$, $1 + 3 = 4$, $4 + 5 = 9$다. 첫 $k$개 홀수의 합은 $k^2$이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "$\\sum_i a_i b_i$와 $(\\sum_i a_i)(\\sum_i b_i)$가 일반적으로 다른 이유를 예로 보이고, 평균제곱오차 식을 코드로 옮길 때 인덱스 범위와 계산 순서에서 주의할 점을 설명하라.",
      answer: md`
$\sum_i a_i b_i$는 같은 인덱스끼리만 곱해 더하지만, $(\sum_i a_i)(\sum_i b_i)$를 전개하면 $a_1 b_2$처럼 인덱스가 다른 곱까지 모두 더한다. $a = (1, 2)$, $b = (3, 4)$이면 11과 21로 다르다. 평균제곱오차 $\frac{1}{n}\sum_{i=1}^{n}(\hat y_i - y_i)^2$를 옮길 때는 ① 수식의 $i = 1, \ldots, n$이 코드에서는 \`range(n)\`(0부터 $n-1$)이라는 점, ② 각 항에서 먼저 차를 구해 제곱한 뒤 더한다는 점(차의 합을 제곱하면 다른 값), ③ 마지막에 $n$으로 나눈다는 점을 지킨다. NumPy로는 \`((y_hat - y) ** 2).mean()\`이다.
`,
      keyPoints: ["합의 곱을 전개하면 인덱스가 다른 곱까지 더해진다(예: 11 대 21)", "수식의 1~n은 코드의 0~n−1", "차 → 제곱 → 합 → n으로 나누기의 순서"],
    },
  ],
  references: [
    { title: "Khan Academy — 시그마 표기법 (한국어)", url: "https://ko.khanacademy.org/math/ap-calculus-ab/ab-integration-new/ab-6-3/v/sigma-notation-sum", note: "시그마 표기의 읽기와 계산" },
    { title: "NumPy — sum", url: "https://numpy.org/doc/stable/reference/generated/numpy.sum.html", note: "축(axis)을 지정한 합 (영문)" },
  ],
});
