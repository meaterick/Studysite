import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/classes-objects";

export default defineLesson({
  id: "classes-objects",
  title: "클래스와 객체",
  tier: "core",
  concepts: ["classes-objects"],
  goal: "클래스로 상태(속성)와 동작(메서드)을 묶고 `self`와 `__init__`의 역할을 설명하며, fit·predict 형태의 모델 클래스를 작성한다.",
  why: "scikit-learn의 모델은 `model.fit(X, y)`로 학습하고 `model.predict(X)`로 예측하는 클래스이고, PyTorch의 신경망도 클래스로 정의한다([[lesson:pytorch]]). [[lesson:micrograd]]에서 직접 만드는 자동미분 엔진의 `Value`도 값과 기울기를 함께 담은 클래스다.",
  body: md`
### 클래스와 인스턴스

**클래스(class)**는 새로운 자료형을 정의한다. 그 자료형의 값이 어떤 데이터를 가지는지(**속성**, attribute)와 어떤 동작을 하는지(**메서드**, method)를 함께 정한다. 클래스로 만든 값 하나하나를 **인스턴스(instance)**라고 한다. \`list\`도 클래스이고, \`[1, 2]\`는 \`list\`의 인스턴스이며, \`append\`는 \`list\`의 메서드다. 같은 클래스의 인스턴스는 같은 메서드를 쓰지만 속성 값은 각자 가진다.

아래는 입력에 가중치를 곱하고 편향을 더하는 계산을 클래스로 정의한 예다. 신경망을 이루는 가장 작은 계산 단위가 이 형태다([[lesson:perceptron-mlp]]).

\`\`\`python
class Perceptron:
    def __init__(self, w, b):    # 인스턴스를 만들 때 자동으로 호출되는 초기화 메서드
        self.w = w               # self.w, self.b는 이 인스턴스만의 속성이다
        self.b = b

    def predict(self, x):
        return self.w * x + self.b

p = Perceptron(w=2, b=1)         # __init__(p, w=2, b=1)이 실행된다
q = Perceptron(w=-1, b=0.5)
print(p.predict(3), q.predict(3))   # 7 -2.5
print(p.w, q.w)                     # 2 -1: 속성은 인스턴스마다 따로 있다
\`\`\`

\`p.predict(3)\`을 호출하면 파이썬은 \`Perceptron.predict(p, 3)\`을 실행한다. 메서드의 첫 매개변수 \`self\`에는 **메서드를 호출한 인스턴스**가 들어간다. 그래서 \`self.w\`는 \`p\`로 호출하면 \`p.w\`, \`q\`로 호출하면 \`q.w\`다. \`self\`는 관례적인 이름이고, 메서드를 정의할 때는 항상 첫 매개변수로 적는다.

[[diagram:class-objects]]

### 클래스가 필요한 경우

입력을 출력으로 바꾸기만 하는 계산(평균, 코사인 유사도)은 함수로 두는 편이 간결하다. 클래스가 필요한 경우는 **상태와 그 상태를 바꾸는 동작이 항상 함께 다닐 때**다. 학습 중의 손실 기록은 "지금까지 몇 개를 봤고 평균이 얼마인가"라는 상태와 "새 값을 하나 반영한다"는 동작이 짝을 이룬다. 이것을 전역 변수와 함수로 나눠 두면 학습 손실과 검증 손실의 기록이 섞이기 쉽다. 클래스로 묶으면 독립된 기록기를 필요한 만큼 만들 수 있다.

아래 기록기는 값을 모두 저장하지 않고 **개수와 평균만** 유지한다. 새 값 $x$가 들어오면 $\bar x_{\text{새}} = \bar x_{\text{이전}} + \frac{x - \bar x_{\text{이전}}}{n}$으로 평균을 고친다. 값이 하나도 없을 때 결과를 물으면 계산할 수 없으므로 예외를 일으킨다([[lesson:errors-debugging]]).

\`\`\`python
class RunningMean:
    """값을 저장하지 않고 개수와 평균만으로 평균을 이어서 계산하는 기록기"""
    def __init__(self):
        self.count = 0
        self.mean = 0.0

    def add(self, x):
        self.count += 1
        self.mean += (x - self.mean) / self.count

    def result(self):
        if self.count == 0:
            raise ValueError("아직 값이 하나도 없다")
        return self.mean

train_loss = RunningMean()
valid_loss = RunningMean()        # 같은 클래스로 독립된 기록기를 하나 더
for x in [2, 4, 9]:
    train_loss.add(x)
print(train_loss.result())        # (2 + 4 + 9) / 3 = 5.0
print(valid_loss.count)           # 0: 다른 인스턴스의 상태는 그대로다
\`\`\`

[[diagram:running-mean-trace]]

### fit과 predict: 모델 클래스의 형태

scikit-learn의 모든 모델은 같은 형태의 클래스다([[lesson:linear-regression]]). 하이퍼파라미터는 \`__init__\`에서 받고, \`fit(X, y)\`는 데이터에서 파라미터를 계산해 속성에 저장한 뒤 \`self\`를 돌려주며, \`predict(X)\`는 저장한 파라미터로 예측한다. 학습으로 정해지는 속성 이름은 끝에 밑줄을 붙이는 관례가 있다(\`coef_\`, \`mean_\`). 같은 형태를 따르면 모델을 바꿔도 학습·평가 코드를 고칠 필요가 없다.

아래는 모든 입력에 대해 학습 데이터 정답의 평균을 예측하는 가장 단순한 모델이다. 복잡한 모델의 성능을 판단할 때 비교 기준으로 쓴다([[lesson:baselines]]).

\`\`\`python
class MeanRegressor:
    """모든 입력에 학습 데이터 정답의 평균을 예측하는 기준 모델"""
    def __init__(self, round_to=None):
        self.round_to = round_to      # 하이퍼파라미터: 예측값을 반올림할 자릿수

    def fit(self, X, y):
        self.mean_ = sum(y) / len(y)  # 학습으로 정해지는 파라미터
        return self                   # model.fit(...).predict(...)처럼 이어서 쓸 수 있다

    def predict(self, X):
        value = self.mean_ if self.round_to is None else round(self.mean_, self.round_to)
        return [value for _ in X]

    def __repr__(self):               # print(model)에 보일 문자열
        return f"MeanRegressor(round_to={self.round_to})"

model = MeanRegressor(round_to=1)
print(model, model.fit([[1], [2], [3]], [10, 20, 33]).predict([[4], [5]]))   # [21.0, 21.0]
\`\`\`

\`__init__\`, \`__repr__\`처럼 앞뒤에 밑줄 두 개가 붙은 메서드는 파이썬이 정해진 상황에서 자동으로 호출하는 특수 메서드다. \`__repr__\`은 \`print()\`나 화면 출력에서 인스턴스를 어떻게 보여 줄지 정한다.

:::warn 흔한 실수
- **메서드 정의에서 \`self\`를 빠뜨린다.** \`def predict(x):\`로 쓰면 \`p.predict(3)\`이 인자 두 개(\`p\`, \`3\`)를 넘겨 \`TypeError\`가 난다.
- **속성을 \`self.\` 없이 대입한다.** \`__init__\` 안에서 \`w = w\`라고 쓰면 지역 변수일 뿐 인스턴스에 저장되지 않는다.
- **클래스 본문에 가변 객체를 두고 공유한다.** \`class A: items = []\`의 \`items\`는 모든 인스턴스가 함께 쓰는 클래스 속성이다. 인스턴스마다 따로 두려면 \`__init__\`에서 \`self.items = []\`로 만든다.
- **fit하지 않은 모델로 predict한다.** \`mean_\` 같은 학습 속성이 없어 \`AttributeError\`가 난다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`class Perceptron:` 안에 정의한 `def predict(self, x):`를 `p.predict(3)`으로 호출할 때 `self`가 가리키는 것은?",
      choices: ["메서드를 호출한 객체 `p` 자신", "클래스 이름 `Perceptron`이라는 문자열", "첫 번째 인자 `3`", "모든 객체가 함께 쓰는 전역 변수"],
      answer: 0,
      explanation: "파이썬은 `p.predict(3)`을 `Perceptron.predict(p, 3)`처럼 실행한다. 그래서 `self`는 호출한 객체이고, `self.w`는 그 객체만의 속성이다.",
    },
    {
      key: "c2",
      question: "`p1 = Perceptron(w=2, b=1)`, `p2 = Perceptron(w=5, b=0)`일 때 `print(p1.predict(1), p2.predict(1))`의 출력은? (`predict`는 `self.w * x + self.b`)",
      choices: ["`3 5`", "`3 3`", "`5 5`", "`7 5`"],
      answer: 0,
      explanation: "같은 클래스로 만든 객체라도 속성은 각자 따로 가진다. $2 \\cdot 1 + 1 = 3$, $5 \\cdot 1 + 0 = 5$.",
    },
    {
      key: "c3",
      question: "`__init__` 안에서 `self.w = w` 대신 `w = w`라고 쓰면 어떻게 되는가?",
      choices: [
        "똑같이 인스턴스의 속성 `w`가 만들어진다",
        "`w`는 `__init__` 안의 지역 변수일 뿐이라, 나중에 `self.w`를 읽으면 `AttributeError`가 난다",
        "`SyntaxError`가 난다",
        "모든 인스턴스가 같은 `w`를 함께 쓴다",
      ],
      answer: 1,
      explanation: "인스턴스에 값을 저장하려면 `self.이름 = 값`으로 대입해야 한다. `w = w`는 지역 변수에 대입할 뿐이고 함수가 끝나면 사라진다.",
    },
    {
      key: "c4",
      question: "위 `RunningMean`에 `add(2)`, `add(4)`, `add(9)`를 차례로 호출한 뒤 `result()`의 값은?",
      choices: ["5.0", "15", "9", "3"],
      answer: 0,
      explanation: "세 값의 평균 $(2 + 4 + 9)/3 = 5$다. 갱신식은 값을 저장하지 않고도 매 단계 정확한 평균(2 → 3 → 5)을 유지한다.",
    },
    {
      key: "c5",
      question: "scikit-learn 형태의 모델 클래스에서 `fit`과 `predict`의 역할로 알맞은 것은?",
      choices: [
        "`fit`은 데이터에서 파라미터를 계산해 속성에 저장하고, `predict`는 저장한 파라미터로 새 입력의 출력을 계산한다",
        "`fit`은 예측값을 출력하고, `predict`는 데이터를 불러온다",
        "`fit`은 하이퍼파라미터를 정하고, `predict`는 파라미터를 학습한다",
        "두 메서드는 이름만 다르고 같은 일을 한다",
      ],
      answer: 0,
      explanation: "하이퍼파라미터는 `__init__`에서 받고, `fit`이 학습한 값(예: `mean_`, `coef_`)을 인스턴스 속성에 저장하며, `predict`는 그 값을 써서 예측한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
class Counter:
    def __init__(self):
        self.n = 0

    def add(self, k=1):
        self.n += k
        return self

a = Counter()
b = Counter()
a.add().add(5)
b.add()
print(a.n, b.n)
`,
      expected: "6 1",
      explanation: "`add`가 `self`(호출한 인스턴스)를 돌려주므로 `a.add().add(5)`는 `a`에 1을 더한 뒤 같은 `a`에 5를 더한다. `a`와 `b`는 같은 클래스의 별개 인스턴스라 `self.n`을 따로 가지므로 `b.n`은 1이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "클래스와 인스턴스의 관계를 설명하고, 메서드의 첫 매개변수 `self`가 무엇을 가리키는지 적어라. 상태와 동작을 클래스로 묶으면 좋은 경우의 예를 하나 들어라.",
      answer: md`
클래스는 새 자료형을 정의하며, 그 자료형의 값이 가질 속성과 메서드를 정한다. 인스턴스는 그 클래스로 만든 값 하나하나이고, 같은 메서드를 쓰지만 속성 값은 인스턴스마다 따로 가진다. \`self\`는 메서드를 호출한 인스턴스를 가리키며, \`m.add(3)\`은 \`RunningMean.add(m, 3)\`과 같다. 예: 학습 중 손실의 평균처럼 '개수와 평균'이라는 상태를 유지하며 값이 들어올 때마다 갱신해야 하는 경우, 함수와 전역 변수로 흩어 두는 것보다 클래스로 묶으면 학습 손실과 검증 손실의 기록기를 독립적으로 만들 수 있고 다른 코드가 상태를 잘못 바꿀 위험이 줄어든다.
`,
      keyPoints: ["클래스는 속성과 메서드를 정의하고, 인스턴스는 각자의 속성 값을 가진다", "`self`는 메서드를 호출한 인스턴스다", "상태와 그 상태를 바꾸는 동작이 함께 다니는 경우의 예"],
    },
  ],
  references: [
    { title: "Python 자습서 9장 — 클래스 (한국어)", url: "https://docs.python.org/ko/3/tutorial/classes.html", note: "9.3 클래스와의 첫 만남, 인스턴스 변수와 클래스 변수" },
    { title: "scikit-learn — Developing scikit-learn estimators", url: "https://scikit-learn.org/stable/developers/develop.html", note: "fit/predict 규약과 학습 속성의 밑줄 이름 관례 (영문)" },
  ],
});
