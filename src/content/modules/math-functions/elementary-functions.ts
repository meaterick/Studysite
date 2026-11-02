import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/elementary-functions";

export default defineLesson({
  id: "elementary-functions",
  title: "일차함수, 이차함수, 지수함수, 로그함수",
  tier: "core",
  concepts: ["elementary-functions"],
  goal: "일차·이차·지수·로그함수의 식과 그래프의 성질(기울기, 꼭짓점, 증가 속도, 정의역)을 설명하고, 로그의 성질로 곱을 합으로 바꾸어 계산한다.",
  why: "선형 모델은 일차함수이고, 평균제곱오차는 파라미터에 대한 이차함수다. 시그모이드·소프트맥스는 지수함수로, 교차엔트로피 손실은 로그함수로 만든다([[lesson:logistic-regression]], [[lesson:likelihood-entropy]]). 손실 곡선과 학습률 스케줄도 이 함수들의 그래프로 읽는다.",
  body: md`
### 일차함수

$y = ax + b$ 꼴의 함수다. $a$는 **기울기**로, $x$가 1 늘 때 $y$가 늘어나는 양이다. $b$는 **절편**으로, $x = 0$일 때의 $y$다. 그래프는 직선이다. 섭씨를 화씨로 바꾸는 $F = 1.8C + 32$에서 기울기 1.8은 "섭씨 1도가 화씨 1.8도"라는 뜻이다. 선형회귀는 데이터에 가장 잘 맞는 $a$와 $b$를 찾는 문제다([[lesson:linear-regression]]).

### 이차함수

$y = ax^2 + bx + c$ ($a \ne 0$) 꼴의 함수다. 완전제곱식으로 바꾸면 $y = a(x - p)^2 + q$가 되고, 그래프는 점 $(p, q)$를 꼭짓점으로 하는 포물선이다. $p = -\frac{b}{2a}$이다.

- $a > 0$이면 위로 열린 포물선이고, $x = p$에서 **최솟값** $q$를 가진다.
- $a < 0$이면 아래로 열린 포물선이고, $x = p$에서 최댓값 $q$를 가진다.

이 성질은 머신러닝에서 바로 쓰인다. 데이터 $(1, 2), (2, 4), (3, 7)$에 모델 $\hat y = wx$를 맞출 때, 평균제곱오차를 $w$의 함수로 쓰면 다음과 같다.

\`\`\`math
L(w) = \frac{1}{3}\big[(w - 2)^2 + (2w - 4)^2 + (3w - 7)^2\big] = \frac{14}{3}w^2 - \frac{62}{3}w + 23
\`\`\`

$w^2$의 계수가 양수인 이차함수이므로 최솟값이 하나 있고, 꼭짓점 $w^* = -\frac{b}{2a} = \frac{62/3}{2 \cdot 14/3} = \frac{31}{14} \approx 2.214$에서 손실이 가장 작다. [[lesson:ai-landscape]]에서 격자 탐색으로 찾은 값과 같다.

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

xs, ys = np.array([1, 2, 3]), np.array([2, 4, 7])
w = np.linspace(0, 4, 200)
L = np.array([np.mean((wi * xs - ys) ** 2) for wi in w])
w_star = np.sum(xs * ys) / np.sum(xs ** 2)       # 꼭짓점: 31/14
print(f"w* = {w_star:.4f}, L(w*) = {np.mean((w_star * xs - ys) ** 2):.4f}")

plt.figure(figsize=(5, 3))
plt.plot(w, L)
plt.scatter([w_star], [np.mean((w_star * xs - ys) ** 2)], color="red", zorder=3)
plt.xlabel("w"); plt.ylabel("L(w)")
plt.show()
\`\`\`

### 지수함수

$y = a^x$ ($a > 0$, $a \ne 1$) 꼴의 함수다. 머신러닝에서는 밑이 $e \approx 2.718$인 $e^x$(\`exp\`)를 주로 쓴다. 성질은 다음과 같다.

- 모든 $x$에서 $e^x > 0$이다.
- $e^{x + y} = e^x e^y$, $e^0 = 1$, $e^{-x} = 1 / e^x$
- $x$가 커지면 매우 빠르게 커진다. $e^{10} \approx 2.2 \times 10^4$, $e^{100} \approx 2.7 \times 10^{43}$이다.

시그모이드 $\sigma(z) = \frac{1}{1 + e^{-z}}$의 출력이 0과 1 사이에 있는 것은 $e^{-z}$가 항상 양수이기 때문이다. 빠르게 커지는 성질 때문에 계산에서 넘침(overflow)이 생긴다. 파이썬의 \`math.exp(1000)\`은 \`OverflowError\`를 내고, NumPy의 \`np.exp(1000)\`은 \`inf\`가 된다. 큰 음수 $z$에서 시그모이드를 $1 / (1 + e^{-z})$로 계산하면 $e^{1000}$을 계산하게 되므로, 부호에 따라 식을 바꿔 쓴다(이 레슨의 실습).

### 로그함수

$y = \log_a x$는 "$a$를 몇 번 거듭제곱하면 $x$가 되는가"이며, 지수함수 $a^y = x$의 역함수다. 밑이 $e$인 자연로그를 $\ln x$(\`np.log\`)로 쓴다. 정의역은 $x > 0$이다.

| 성질 | 식 | 쓰이는 곳 |
| --- | --- | --- |
| 곱 → 합 | $\log(xy) = \log x + \log y$ | 여러 확률의 곱을 로그 확률의 합으로 |
| 거듭제곱 → 곱 | $\log(x^k) = k \log x$ | 지수 계산을 곱셈으로 |
| 역함수 | $\ln(e^x) = x$, $e^{\ln x} = x$ | 로그 공간에서 계산하고 되돌리기 |
| 밑 바꾸기 | $\log_a x = \frac{\ln x}{\ln a}$ | 비트(밑 2)와 내트(밑 $e$) 변환 |

확률은 1보다 작으므로 로그 확률은 음수다. 여러 사건이 모두 일어날 확률은 확률의 곱인데, 0.5를 1,100번 곱하면 컴퓨터가 표현할 수 있는 가장 작은 양수보다 작아져 0이 된다(언더플로). 로그를 취해 합으로 계산하면 이 문제가 생기지 않는다. 언어 모델이 문장의 확률을 로그 확률의 합으로 다루는 이유다([[lesson:pretraining]]).

\`\`\`python
import math

probs = [0.5] * 1100
product = 1.0
for p in probs:
    product *= p
print(product)                                  # 0.0: 언더플로
print(sum(math.log(p) for p in probs))          # -762.46...: 로그 확률의 합은 문제없다
print(math.log(math.e ** 2), math.log10(1000), math.log2(8))   # 2.0 3.0 3.0
\`\`\`

### 증가 속도 비교

$x$가 커질 때 $\ln x$는 아주 느리게, $x^2$은 빠르게, $e^x$는 그보다 훨씬 빠르게 커진다. $x = 100$에서 $\ln x \approx 4.6$, $x^2 = 10^4$, $e^x \approx 2.7 \times 10^{43}$이다. 손실 그래프를 로그 축으로 그리는 이유는 손실이 처음에는 크게, 나중에는 아주 조금씩 줄어 일반 축에서는 뒷부분의 변화가 보이지 않기 때문이다.

:::warn 흔한 실수
- **이차함수의 꼭짓점을 $x = b/2a$로 쓴다.** 부호가 있다: $x = -b/(2a)$.
- **로그에 0이나 음수를 넣는다.** 확률이 정확히 0인 경우를 막기 위해 \`np.log(p + 1e-12)\`처럼 아주 작은 값을 더하거나 \`np.clip\`으로 범위를 제한한다.
- **\`exp\`의 넘침을 확인하지 않는다.** 큰 값이 들어갈 수 있는 곳에서는 식을 바꾸거나 최댓값을 빼서 계산한다.
- **$\log(x + y)$를 $\log x + \log y$로 쓴다.** 로그는 곱을 합으로 바꾸는 것이지 합을 나누는 것이 아니다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "$y = 3x - 2$의 기울기와 $x = 1$에서의 값은?",
      choices: ["기울기 3, 값 1", "기울기 −2, 값 1", "기울기 3, 값 5", "기울기 1, 값 3"],
      answer: 0,
      explanation: "$y = ax + b$에서 기울기는 $a = 3$이다. $x = 1$이면 $3 \\times 1 - 2 = 1$이다.",
    },
    {
      key: "c2",
      question: "$y = 2(x - 1)^2 + 5$의 최솟값과 그때의 $x$는?",
      choices: ["$x = 1$에서 5", "$x = -1$에서 5", "$x = 1$에서 2", "최솟값이 없다"],
      answer: 0,
      explanation: "$a = 2 > 0$이라 위로 열린 포물선이고, 꼭짓점 $(1, 5)$에서 최솟값 5를 가진다.",
    },
    {
      key: "c3",
      question: "$\\ln(ab)$와 같은 것은?",
      choices: ["$\\ln a \\cdot \\ln b$", "$\\ln a + \\ln b$", "$\\ln(a + b)$", "$a \\ln b$"],
      answer: 1,
      explanation: "로그는 곱을 합으로 바꾼다. 여러 확률의 곱을 로그 확률의 합으로 계산하는 근거다.",
    },
    {
      key: "c4",
      question: "확률 수천 개의 곱을 직접 계산하지 않고 로그 확률의 합으로 계산하는 가장 큰 이유는?",
      choices: [
        "로그를 쓰면 결과가 더 정확한 확률이 되기 때문이다",
        "아주 작은 수끼리 계속 곱하면 표현할 수 있는 범위보다 작아져 0이 되기(언더플로) 때문이다",
        "로그는 음수를 양수로 바꾸기 때문이다",
        "곱셈은 컴퓨터가 계산할 수 없기 때문이다",
      ],
      answer: 1,
      explanation: "0.5를 1,100번 곱하면 0.0이 된다. $\\log$의 합은 같은 정보를 큰 범위의 수로 담아 언더플로가 생기지 않는다.",
    },
    {
      key: "c5",
      question: "$\\log_2 8$과 $\\log_{10} 1000$의 값은?",
      choices: ["3과 3", "4와 3", "3과 100", "8과 1000"],
      answer: 0,
      explanation: "$2^3 = 8$, $10^3 = 1000$이므로 둘 다 3이다.",
    },
    {
      key: "c6",
      question: "평균제곱오차 $L(w) = \\frac{14}{3}w^2 - \\frac{62}{3}w + 23$이 최소가 되는 $w$는?",
      choices: ["$\\frac{31}{14}$", "$\\frac{62}{3}$", "$\\frac{14}{31}$", "23"],
      answer: 0,
      explanation: "꼭짓점 $w^* = -\\frac{b}{2a} = \\frac{62/3}{28/3} = \\frac{62}{28} = \\frac{31}{14} \\approx 2.214$다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import math
print(round(math.log(math.e ** 2), 6), math.log10(1000), math.log2(1 / 8))
print(math.exp(0), round(math.exp(1), 3))
`,
      expected: "2.0 3.0 -3.0\n1.0 2.718",
      explanation: "$\\ln(e^2) = 2$, $\\log_{10} 1000 = 3$, $\\log_2(1/8) = -3$이다. $e^0 = 1$이고 $e \\approx 2.718$이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "모델 $\\hat y = wx$의 평균제곱오차를 파라미터 $w$ 하나의 함수로 보면 이차함수가 되는 이유를 설명하고, 이 사실이 최솟값을 찾는 데 주는 이점을 써라.",
      answer: md`
각 데이터의 오차 $(w x_i - y_i)^2$를 전개하면 $x_i^2 w^2 - 2x_i y_i w + y_i^2$로 $w$에 대한 이차식이고, 평균은 이 이차식들의 평균이므로 $L(w) = A w^2 + B w + C$ 꼴이 된다. 이때 $A = \frac{1}{n}\sum_i x_i^2 > 0$(모든 $x_i$가 0이 아니면)이므로 위로 열린 포물선이다. 따라서 최솟값이 정확히 하나 있고, 꼭짓점 $w^* = -B/(2A) = \sum_i x_i y_i / \sum_i x_i^2$로 바로 구할 수 있다. 경사하강법을 쓰더라도 손실이 볼록한 모양이라 시작점과 관계없이 같은 최솟값으로 간다.
`,
      keyPoints: ["오차 제곱을 전개하면 $w$의 이차식이 된다", "$w^2$의 계수가 양수라 위로 열린 포물선이다", "최솟값이 하나이고 꼭짓점 공식으로 구할 수 있다"],
    },
  ],
  references: [
    { title: "Khan Academy — 지수와 로그 (한국어)", url: "https://ko.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:logs", note: "로그의 정의와 성질" },
    { title: "Python 표준 라이브러리 — math (한국어)", url: "https://docs.python.org/ko/3/library/math.html", note: "exp, log, log2, log10" },
  ],
});
