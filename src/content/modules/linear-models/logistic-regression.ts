import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/logistic-regression";

export default defineLesson({
  id: "logistic-regression",
  title: "로지스틱 회귀, 시그모이드, 분류 임계값",
  tier: "core",
  concepts: ["logistic-regression"],
  goal: "시그모이드로 점수를 확률로 바꾸고 가중치를 로그 오즈로 해석하며, 분류 임계값과 결정 경계의 관계를 설명하고, 이진 교차 엔트로피의 기울기 $(p - y)x$를 유도해 경사하강법으로 학습한다. 다중 분류로 확장한 소프트맥스 회귀의 확률과 기울기도 계산한다.",
  why: "로지스틱 회귀는 확률을 출력하는 가장 기본적인 분류 모델이라 분류 문제의 기준 모델로 자주 쓰인다. 신경망 분류기의 마지막 층과 언어 모델이 다음 토큰의 확률을 계산하는 출력층이 소프트맥스 회귀와 같은 형태이고([[lesson:pretraining]]), 기울기 $(p - y)x$는 역전파에서 그대로 다시 나온다([[lesson:backprop]]).",
  body: md`
### 점수를 확률로 바꾸는 시그모이드

로지스틱 회귀는 선형회귀와 같은 점수 $z = w^\top x + b$를 계산한 뒤, **시그모이드** 함수로 0과 1 사이의 값으로 바꿔 양성일 확률로 쓴다([[lesson:functions-composition]]).

\`\`\`math
p = \sigma(z) = \frac{1}{1 + e^{-z}}
\`\`\`

$z$가 클수록 $p$는 1에, 작을수록 0에 가까워지고, $z = 0$이면 $p = 0.5$다. $w = (0.5, -0.2)$, $b = 0.1$인 모델에 $x = (2, 1)$을 넣으면 $z = 1 - 0.2 + 0.1 = 0.9$, $p = \sigma(0.9) \approx 0.711$이다.

[[diagram:sigmoid-curve]]

**가중치는 로그 오즈로 해석한다.** 시그모이드를 거꾸로 풀면 $\log \frac{p}{1 - p} = w^\top x + b$다. $\frac{p}{1-p}$를 **오즈**(odds)라 하므로, $w_j$는 "다른 특성이 그대로일 때 $x_j$가 1 늘면 로그 오즈가 $w_j$만큼 늘어난다"는 뜻이다. 오즈로 말하면 $e^{w_j}$배가 된다. $w_j = 0.7$이면 $e^{0.7} \approx 2.01$이므로 $x_j$가 1 늘 때마다 양성의 오즈가 약 2배가 된다.

### 분류 임계값과 결정 경계

확률을 0 또는 1의 판정으로 바꾸려면 **분류 임계값** $t$를 정해 $p \geq t$이면 양성으로 판정한다. $t = 0.5$이면 $p \geq 0.5$와 $z \geq 0$이 같은 조건이므로, 판정이 바뀌는 경계는 $w^\top x + b = 0$인 직선(특성이 많으면 초평면)이다. 이 경계를 **결정 경계**라 한다. 임계값을 바꾸면 경계는 $w^\top x + b = \log \frac{t}{1 - t}$로 평행 이동한다. 임계값을 낮추면 양성 판정이 늘어 실제 양성을 덜 놓치는 대신 잘못된 양성 판정도 늘어난다. 이 교환 관계는 [[lesson:classification-metrics]]에서, 비용으로 임계값을 정하는 방법은 [[lesson:cost-threshold]]에서 다룬다.

### 교차 엔트로피와 기울기 $(p - y)x$

로지스틱 회귀는 이진 교차 엔트로피 $L = -[\,y \log p + (1 - y)\log(1 - p)\,]$를 최소화한다([[lesson:loss-functions]]). 연쇄법칙으로 미분하면([[lesson:chain-rule]]), 시그모이드의 도함수 $\frac{dp}{dz} = p(1 - p)$가 약분되어 간단한 결과가 나온다.

\`\`\`math
\frac{\partial L}{\partial z} = \left(-\frac{y}{p} + \frac{1 - y}{1 - p}\right) p(1 - p) = p - y, \qquad \frac{\partial L}{\partial w} = (p - y)\,x, \qquad \frac{\partial L}{\partial b} = p - y
\`\`\`

기울기는 "예측 확률과 정답의 차이"에 입력을 곱한 꼴로, 선형회귀의 $(\hat y - y)x$와 모양이 같다. 앞의 예에서 정답이 $y = 1$이면 $p - y \approx -0.289$이므로, 학습률 $0.5$로 한 번 갱신하면 $w \approx (0.789, -0.055)$, $b \approx 0.245$가 되고 $p$는 $0.854$로, 손실 $-\log p$는 $0.341$에서 $0.158$로 바뀐다. 정답 쪽 확률이 모자라면 그 샘플의 점수를 키우는 방향으로 가중치가 움직인다.

[[diagram:logistic-step]]

로지스틱 회귀는 정규방정식 같은 닫힌 형태의 해가 없어 경사하강법 같은 반복 계산으로 학습한다. scikit-learn의 \`LogisticRegression\`은 기본으로 L2 규제(\`C=1.0\`)를 넣어 학습하고([[lesson:regularization]]), \`predict_proba\`는 확률을, \`predict\`는 임계값 0.5로 판정한 결과를 돌려준다.

\`\`\`python
import numpy as np
from sklearn.linear_model import LogisticRegression

rng = np.random.default_rng(0)
X = rng.normal(size=(300, 2))
y = (1.5 * X[:, 0] - 1.0 * X[:, 1] + rng.normal(0, 0.8, 300) > 0).astype(int)
clf = LogisticRegression().fit(X, y)
w, b = clf.coef_[0], clf.intercept_[0]
print(np.round(w, 3), round(b, 3))                    # [ 2.973 -1.932] -0.173

x_new = np.array([[0.5, -0.2]])
z = float((x_new @ w + b)[0])
print(round(z, 3), round(1 / (1 + np.exp(-z)), 3))    # 1.7 0.846: 직접 계산한 점수와 확률
print(np.round(clf.predict_proba(x_new), 3))          # [[0.154 0.846]]: [음성 확률, 양성 확률]
\`\`\`

### 다중 분류: 소프트맥스 회귀

클래스가 $K$개이면 클래스마다 점수 $z_k = w_k^\top x + b_k$를 계산하고 **소프트맥스**로 합이 1인 확률로 바꾼다([[lesson:task-types]]). 손실은 정답 클래스 $y$의 확률에 대한 $-\log p_y$다.

\`\`\`math
p_k = \frac{e^{z_k}}{\sum_{j=1}^{K} e^{z_j}}, \qquad L = -\log p_y, \qquad \frac{\partial L}{\partial z_k} = p_k - \mathbb{1}[k = y]
\`\`\`

정답을 원-핫 벡터 $\mathbf{y}$로 쓰면 기울기는 $\mathbf{p} - \mathbf{y}$이고, 가중치의 기울기는 이진 분류와 같은 꼴인 $(\mathbf{p} - \mathbf{y})\,x^\top$이다. 클래스가 2개인 소프트맥스 회귀는 로지스틱 회귀와 같다.

\`\`\`python
import numpy as np

z = np.array([2.0, 1.0, 0.0])                         # 클래스 세 개의 점수
p = np.exp(z - z.max()) / np.exp(z - z.max()).sum()    # 최댓값을 빼도 결과는 같고 넘침을 막는다
print(np.round(p, 3), round(float(-np.log(p[0])), 3))  # [0.665 0.245 0.09 ] 0.408: 정답이 0번일 때 손실
print(np.round(p - np.array([1, 0, 0]), 3))            # [-0.335  0.245  0.09 ]: 점수에 대한 기울기
\`\`\`

기울기의 부호대로라면 정답 클래스의 점수는 올라가고 나머지 클래스의 점수는 내려간다. 언어 모델은 어휘 수만큼의 클래스(토큰)에 대해 이 계산을 한다.

:::warn 흔한 실수
- **로지스틱 회귀의 출력을 그대로 판정으로 쓴다.** 출력은 확률이고, 판정은 임계값을 정해야 나온다. 0.5는 기본값일 뿐이다.
- **기울기의 부호를 반대로 구현한다.** $(y - p)x$로 쓰고 \`w -= lr * grad\`로 갱신하면 손실이 커진다. 수치미분으로 기울기를 검산한다([[lesson:derivatives]]).
- **다중 분류에서 클래스마다 시그모이드를 따로 쓴다.** 한 샘플이 한 클래스에만 속하면 소프트맥스를 쓰고, 여러 클래스에 동시에 속할 수 있는 다중 레이블 분류에서만 클래스마다 시그모이드를 쓴다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "로지스틱 회귀에서 점수 $z = w^\\top x + b = 0$인 샘플의 예측 확률과, 임계값 0.5에서의 의미는?",
      choices: [
        "$p = 0.5$이고, 이런 점들이 모여 결정 경계 $w^\\top x + b = 0$을 이룬다",
        "$p = 0$이고 항상 음성으로 판정된다",
        "$p = 1$이고 항상 양성으로 판정된다",
        "$p = 0.731$이다",
      ],
      answer: 0,
      explanation: "$\\sigma(0) = 1/(1 + e^0) = 0.5$다. 임계값이 0.5이면 $z \\geq 0$인 쪽이 양성이므로 $z = 0$인 점들이 경계가 된다.",
    },
    {
      key: "c2",
      question: "특성 $x_j$의 가중치가 $w_j = 0.7$이다. 옳은 해석은?",
      choices: [
        "다른 특성이 그대로일 때 $x_j$가 1 늘면 양성의 오즈가 약 $e^{0.7} \\approx 2$배가 된다",
        "$x_j$가 1 늘면 양성 확률이 0.7 늘어난다",
        "$x_j$가 1 늘면 양성 확률이 70%가 된다",
        "가중치가 양수이므로 그 샘플은 항상 양성이다",
      ],
      answer: 0,
      explanation: "로지스틱 회귀는 로그 오즈 $\\log\\frac{p}{1-p}$가 선형이다. 확률 자체의 변화량은 현재 확률에 따라 달라진다.",
    },
    {
      key: "c3",
      question: "로지스틱 회귀에서 샘플 하나의 손실을 $w$로 미분한 결과는?",
      choices: ["$(p - y)x$", "$(y - p)^2 x$", "$p(1 - p)$", "$\\sigma(x)$"],
      answer: 0,
      explanation: "$\\partial L/\\partial z = p - y$이고 $\\partial z/\\partial w = x$이므로 연쇄법칙으로 $(p - y)x$다.",
    },
    {
      key: "c4",
      question: "분류 임계값을 0.5에서 0.2로 낮추면 일어나는 일로 옳은 것은?",
      choices: [
        "양성 판정이 늘어 실제 양성을 덜 놓치지만, 잘못된 양성 판정도 늘어난다",
        "모델의 가중치가 다시 학습된다",
        "양성 판정이 줄어든다",
        "예측 확률 자체가 바뀐다",
      ],
      answer: 0,
      explanation: "임계값은 학습이 끝난 뒤 확률을 판정으로 바꾸는 기준이다. 확률과 가중치는 그대로이고 판정만 바뀐다.",
    },
    {
      key: "c5",
      question: "세 클래스의 점수가 $z = (2, 1, 0)$이고 정답이 0번 클래스일 때, 소프트맥스 회귀의 점수에 대한 기울기 $\\mathbf{p} - \\mathbf{y}$로 옳은 것은? (확률은 $\\mathbf{p} \\approx (0.665, 0.245, 0.090)$)",
      choices: ["$(-0.335, 0.245, 0.090)$", "$(0.665, 0.245, 0.090)$", "$(0.335, -0.245, -0.090)$", "$(-1, 0, 0)$"],
      answer: 0,
      explanation: "정답 원-핫 벡터 $(1, 0, 0)$을 빼면 된다. 경사하강법은 기울기의 반대로 움직이므로 정답 클래스의 점수는 오르고 나머지는 내려간다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
z = np.array([0.0, 2.0, -2.0])
print(np.round(1 / (1 + np.exp(-z)), 3))
`,
      expected: "[0.5   0.881 0.119]",
      explanation: "$\\sigma(0) = 0.5$, $\\sigma(2) = 1/(1 + e^{-2}) \\approx 0.881$이고, 시그모이드는 $\\sigma(-z) = 1 - \\sigma(z)$이므로 $\\sigma(-2) \\approx 0.119$다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "로지스틱 회귀의 손실 $L = -[\\,y\\log p + (1-y)\\log(1-p)\\,]$를 점수 $z$로 미분하면 $p - y$가 되는 과정을 쓰고, 정답이 1인 샘플에 $p = 0.7$을 예측했을 때 경사하강법이 가중치를 어느 방향으로 바꾸는지 설명하라.",
      answer: md`
연쇄법칙으로 $\frac{\partial L}{\partial z} = \frac{\partial L}{\partial p} \cdot \frac{dp}{dz}$다. $\frac{\partial L}{\partial p} = -\frac{y}{p} + \frac{1 - y}{1 - p}$이고 시그모이드의 도함수는 $\frac{dp}{dz} = p(1 - p)$이므로, 곱하면 $-y(1 - p) + (1 - y)p = p - y$다. $z = w^\top x + b$이므로 $\frac{\partial L}{\partial w} = (p - y)x$다.

정답이 1이고 $p = 0.7$이면 $p - y = -0.3$이다. 경사하강법은 $w \leftarrow w - \eta(p - y)x = w + 0.3\eta\, x$로 갱신하므로 가중치가 $x$ 방향으로 움직인다. 그러면 이 샘플의 점수 $w^\top x$가 커지고 양성 확률이 올라가 손실이 줄어든다.
`,
      keyPoints: [
        "연쇄법칙: $\\partial L/\\partial p$와 $dp/dz = p(1-p)$의 곱",
        "정리하면 $p - y$, 따라서 $\\partial L/\\partial w = (p - y)x$",
        "$p - y = -0.3$이면 $w$가 $x$ 방향으로 움직인다",
        "점수와 양성 확률이 올라가 손실이 줄어든다",
      ],
    },
  ],
  references: [
    { title: "CS229 Lecture Notes — Classification and logistic regression", url: "https://cs229.stanford.edu/main_notes.pdf", note: "로지스틱 회귀와 기울기 유도, 소프트맥스 회귀 (영문)" },
    { title: "scikit-learn — Logistic regression", url: "https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression", note: "규제 옵션 C, 다중 분류 (영문)" },
    { title: "Dive into Deep Learning — 4.1 Softmax Regression", url: "https://d2l.ai/chapter_linear-classification/softmax-regression.html", note: "소프트맥스와 교차 엔트로피의 기울기 (영문)" },
  ],
});
