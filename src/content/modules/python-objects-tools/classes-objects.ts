import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/classes-objects";

export default defineLesson({
  id: "classes-objects",
  title: "클래스와 객체",
  tier: "core",
  concepts: ["classes-objects"],
  goal: "클래스로 상태와 동작을 묶고 `self`의 의미를 설명하며, `raise`·`try`/`except`로 오류를 일으키고 다룰 수 있다.",
  why: "",
  body: md`
핵심 단계의 문법(변수·제어문·함수·자료구조)만으로도 이번 주 실습과 과제는 모두 풀 수 있다. 이 단계는 실전 코드에서 자주 만나는 두 문법, **클래스**와 **예외 처리**를 미리 익힌다. 3주차에 직접 만드는 자동미분 엔진의 \`Value\` 클래스, 2주차부터 쓰는 scikit-learn의 \`model.fit()\`·\`model.predict()\`가 모두 이 문법 위에 있다.

### 클래스와 객체

클래스(class)는 서로 관련된 데이터(속성, attribute)와 그 데이터를 다루는 함수(메서드, method)를 하나의 틀(설계도)로 묶어놓은 것이고, 그 틀로 실제로 찍어낸 결과물 하나하나를 객체(object) 또는 인스턴스(instance)라 부른다. 예를 들어 "붕어빵 틀"이 클래스라면, 그 틀로 구워낸 붕어빵 하나하나가 객체다. 같은 틀에서 나왔지만 속 재료(팥이냐 슈크림이냐, 즉 속성 값)는 저마다 다를 수 있다. 아래 코드는 3주차에 배울 신경망의 가장 작은 단위인 퍼셉트론 하나를 클래스로 표현한 예다.

\`\`\`python
class Perceptron:
    def __init__(self, w, b):   # 객체가 만들어질 때 자동으로 한 번 호출되는 특별한 메서드(생성자)
        self.w = w   # self는 "만들어지고 있는 객체 자기 자신"을 가리킨다
        self.b = b   # self.w, self.b는 이 객체만의 속성(인스턴스 변수)이 된다

    def predict(self, x):
        return self.w * x + self.b

p = Perceptron(w=2, b=1)  # __init__(self, w=2, b=1)이 자동 호출되어 p.w=2, p.b=1로 설정된다
print(p.predict(3))  # 2*3 + 1 = 7
\`\`\`

\`self\`는 항상 메서드의 첫 번째 매개변수로 적어주며, "이 메서드를 호출한 객체 자신"을 가리킨다. \`p.predict(3)\`을 호출하면 파이썬이 자동으로 \`self\` 자리에 \`p\`를 넣어준다고 생각하면 된다. 같은 \`Perceptron\` 클래스로 \`w\`, \`b\` 값이 다른 객체를 몇 개든 더 만들 수 있고, 각 객체는 자신만의 \`w\`, \`b\`를 독립적으로 가진다.

[[diagram:class-objects]]

### 예외 처리

프로그램을 실행하다 보면 0으로 나누기, 존재하지 않는 파일 열기처럼 실행 도중에 오류(예외, exception)가 발생해 프로그램 전체가 멈춰버리는 경우가 있다. \`try\` 블록 안의 코드를 실행하다가 오류가 발생하면, 프로그램이 그대로 멈추는 대신 \`except\` 블록으로 넘어가 미리 정해둔 대응을 수행한다. 이렇게 오류에 미리 대비해두는 것을 예외 처리(exception handling)라 부른다.

\`\`\`python
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:   # 0으로 나누려 할 때 파이썬이 발생시키는 예외의 이름
        print("0으로 나눌 수 없습니다.")
        return None

print(safe_divide(10, 2))  # 5.0: 오류 없이 정상 실행
print(safe_divide(10, 0))  # 경고 출력 후 None: 프로그램이 멈추지 않고 계속 진행된다
\`\`\`

\`ZeroDivisionError\`는 파이썬에 미리 정의된 여러 예외 종류 중 하나일 뿐이다(존재하지 않는 딕셔너리 키에 접근하면 \`KeyError\`, 리스트 범위를 벗어나면 \`IndexError\`가 발생하는 식이다). \`except\` 뒤에 예외 종류를 적어두면 그 종류의 오류만 잡아 처리하고, 다른 종류의 오류는 그대로 프로그램을 멈춘다.

[[diagram:exception-flow]]

### 언제 클래스로 묶는가

함수만으로도 프로그램은 만들 수 있다. 클래스가 빛나는 것은 **값(상태)과 그 값을 다루는 동작이 항상 함께 다닐 때**다. 예를 들어 학습 중의 손실 기록은 "지금까지 몇 개를 봤는가, 평균이 얼마인가"라는 상태와 "새 값을 하나 더한다"는 동작이 짝을 이룬다. 이것을 전역 변수와 함수로 흩어 두면 다른 기록과 섞이기 쉽지만, 클래스로 묶으면 기록기를 몇 개든 독립적으로 만들 수 있다. 반대로 상태 없이 입력을 출력으로 바꾸기만 하는 계산(코사인 유사도 같은)은 함수로 두는 편이 간결하다. 예외는 "이 상황에서는 계산을 계속할 수 없다"는 신호를 호출한 쪽에 알리는 수단이다. 함수 안에서 \`raise ValueError("이유")\`로 예외를 일으키면, 호출한 쪽은 \`try\`/\`except\`로 그 신호를 받아 대응을 정할 수 있다.

### 예제: 손실 기록기와 \`raise\`

위의 두 문법을 한 예제로 묶어 보자. 학습 중 손실의 평균을 계속 갱신하는 기록기다. 값을 모두 저장하지 않고 **개수와 평균만** 들고 있다가, 새 값이 오면 $\text{새 평균} = \text{이전 평균} + \frac{\text{새 값} - \text{이전 평균}}{\text{개수}}$로 고친다. 값이 하나도 없는데 결과를 물으면 계산할 수 없으므로 \`raise\`로 예외를 일으킨다.

\`\`\`python
class RunningMean:
    """값을 저장하지 않고 개수와 평균만으로 평균을 이어서 계산하는 기록기"""
    def __init__(self):
        self.count = 0
        self.mean = 0.0

    def add(self, x):
        self.count += 1
        self.mean += (x - self.mean) / self.count   # 새 평균 = 이전 평균 + (새 값 - 이전 평균) / 개수

    def result(self):
        if self.count == 0:
            raise ValueError("아직 값이 하나도 없습니다")   # 계산할 수 없는 상황을 호출한 쪽에 알린다
        return self.mean

train_loss = RunningMean()
valid_loss = RunningMean()        # 같은 클래스로 독립된 기록기를 하나 더
for x in [2, 4, 9]:
    train_loss.add(x)
print(train_loss.result())        # (2 + 4 + 9) / 3 = 5.0

try:
    valid_loss.result()
except ValueError as e:           # as e: 예외 객체를 e라는 이름으로 받아 메시지를 꺼낸다
    print("처리한 오류:", e)
\`\`\`

\`train_loss\`와 \`valid_loss\`는 같은 클래스에서 나왔지만 서로의 \`count\`와 \`mean\`에 영향을 주지 않는다. \`except ValueError as e:\`의 \`e\`에는 \`raise\`할 때 넣은 메시지가 들어 있다. 적용과 복습의 코딩 실습에서 이 기록기를 평균과 분산을 함께 유지하도록 넓혀 본다.

[[diagram:running-mean-trace]]
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
      question: "`try:` 블록에서 `ZeroDivisionError`가 발생했는데 `except KeyError:`만 있다면 어떻게 되는가?",
      choices: ["예외가 잡히지 않고 프로그램이 멈춘다(호출한 쪽으로 전달된다)", "`except KeyError:` 블록이 실행된다", "오류를 무시하고 다음 줄을 실행한다", "`None`이 자동으로 반환된다"],
      answer: 0,
      explanation: "`except` 뒤에 적은 종류의 예외만 잡는다. 종류가 다르면 예외는 그대로 위로 전달되어, 아무도 잡지 않으면 프로그램이 멈춘다.",
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
      question: "함수 안에서 `raise ValueError(\"빈 리스트\")`를 실행했고, 호출한 쪽이 `try:`와 `except ValueError as e: print(e)`로 감쌌다면?",
      choices: ["`빈 리스트`가 출력되고 프로그램은 계속 실행된다", "프로그램이 즉시 멈춘다", "`ValueError`라는 글자만 출력된다", "아무 일도 일어나지 않는다"],
      answer: 0,
      explanation: "`raise`한 예외는 호출한 쪽으로 전달되고, 종류가 맞는 `except`가 잡는다. `e`에는 예외를 만들 때 넣은 메시지가 들어 있다.",
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
      explanation: "`add`가 `self`(호출한 객체 자신)를 돌려주므로 `a.add().add(5)`는 `a`에 1을 더한 뒤 같은 `a`에 5를 더합니다. `a`와 `b`는 같은 클래스로 만든 별개의 객체라 `self.n`을 따로 가지므로 `b.n`은 1입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "클래스와 객체의 관계를 비유로 설명하고, 메서드의 첫 매개변수 `self`가 무엇을 가리키는지 적어라. 상태와 동작을 클래스로 묶으면 좋은 경우의 예를 하나 들어라.",
      answer: md`
클래스는 붕어빵 틀, 객체는 그 틀로 찍어 낸 붕어빵 하나하나다. 틀(클래스)은 어떤 상태(속성)와 동작(메서드)을 가질지 정의하고, 객체마다 속성 값은 따로 가진다. \`self\`는 메서드를 호출한 바로 그 객체 자신을 가리키며, \`m.add(3)\`은 \`RunningMean.add(m, 3)\`과 같다. 예: 학습 중 손실의 이동 평균처럼 '누적 합과 개수'라는 상태를 유지하며 값이 들어올 때마다 갱신해야 하는 경우, 함수와 전역 변수로 흩어 두는 것보다 클래스 하나로 묶으면 여러 개를 독립적으로 만들고 잘못 건드릴 일이 줄어든다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Python 자습서 — 클래스", url: "https://docs.python.org/ko/3/tutorial/classes.html", note: "9.3 \"클래스와의 첫 만남\"까지만 읽어도 충분" },
    { title: "Python 자습서 — 에러와 예외", url: "https://docs.python.org/ko/3/tutorial/errors.html", note: "try/except/raise와 예외 종류" },
  ],
});
