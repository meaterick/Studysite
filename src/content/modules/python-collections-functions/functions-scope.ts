import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/functions-scope";

export default defineLesson({
  id: "functions-scope",
  title: "함수, 매개변수, 반환값, 변수의 범위",
  tier: "core",
  concepts: ["functions-scope"],
  goal: "매개변수·기본값·키워드 인자·반환값을 갖춘 함수를 정의하고, 지역·전역 범위 규칙과 함수를 값으로 넘기는 방법을 적용한다.",
  why: "전처리, 손실 계산, 평가 지표는 모두 입력을 받아 값을 돌려주는 함수로 작성한다. 같은 계산을 함수로 묶어야 실험마다 같은 방식으로 다시 쓸 수 있다. 수학의 함수와 합성([[lesson:functions-composition]]), 연산을 이어 붙여 기울기를 구하는 역전파([[lesson:backprop]])도 이 구조를 그대로 쓴다.",
  body: md`
### 함수 정의와 호출

함수는 이름을 붙인 코드 블록이다. \`def\` 다음에 함수 이름과 괄호 안의 **매개변수(parameter)**를 쓰고, 계산 결과를 \`return\`으로 돌려준다. 함수를 부를 때 괄호 안에 넣는 값을 **인자(argument)**라고 한다. 첫 줄의 따옴표 세 개로 감싼 문자열은 함수가 하는 일을 설명하는 **docstring**이다.

\`\`\`python
def mean(values):
    """숫자 리스트의 평균"""
    return sum(values) / len(values)

result = mean([2, 4, 9])     # 인자 [2, 4, 9]가 매개변수 values에 전달된다
print(result)                # 5.0
\`\`\`

\`return\`을 만나면 함수는 그 즉시 끝난다. 반복문 안에서 \`return\`하면 반복도 함께 끝난다. \`return\`이 없거나 \`return\` 뒤에 값이 없으면 함수는 \`None\`을 돌려준다. \`print\`는 화면에 출력할 뿐 값을 돌려주지 않는다. 함수의 결과를 다른 계산에 쓰려면 반드시 \`return\`해야 한다.

### 매개변수: 위치, 키워드, 기본값

인자는 순서대로 전달하거나(위치 인자), 매개변수 이름을 붙여 전달한다(키워드 인자). 매개변수에 기본값을 주면 호출할 때 생략할 수 있다. 기본값이 있는 매개변수는 기본값이 없는 매개변수 뒤에 둔다.

\`\`\`python
def train(epochs, lr=0.01, verbose=False):
    if verbose:
        print(f"{epochs}번 반복, 학습률 {lr}")
    return epochs * lr

print(train(10))                       # 0.1: lr과 verbose는 기본값
print(train(10, 0.1))                  # 1.0: 위치 인자로 lr 지정
print(train(epochs=5, verbose=True))   # 키워드 인자: 이름으로 지정해 순서를 바꿔도 된다
\`\`\`

설정값이 여러 개인 함수는 키워드 인자로 부르는 편이 읽기 쉽다. \`train(10, 0.1, True)\`보다 \`train(10, lr=0.1, verbose=True)\`가 각 값의 의미를 드러낸다. 기본값으로 리스트나 딕셔너리 같은 가변 객체를 쓰면 안 되는 이유는 [[lesson:mutability-copy]]에서 다룬다.

### 여러 값을 돌려주기

\`return a, b\`는 튜플 \`(a, b)\`를 돌려준다. 받는 쪽에서 언패킹해 나눠 받는다.

\`\`\`python
def stats(values):
    """(평균, 최솟값, 최댓값)"""
    return sum(values) / len(values), min(values), max(values)

avg, lo, hi = stats([3, 8, 1, 6])
print(avg, lo, hi)          # 4.5 1 8
\`\`\`

### 변수의 범위

함수 안에서 대입한 이름은 그 함수 안에서만 쓰이는 **지역 변수(local variable)**다. 함수가 끝나면 사라지고, 함수 밖의 같은 이름과는 별개다. 함수 밖, 파일의 가장 바깥에서 대입한 이름은 **전역 변수(global variable)**다.

파이썬이 이름을 찾는 순서는 다음과 같다. 함수 안(지역) → 바깥 함수(함수 안에 함수를 정의한 경우) → 파일 전체(전역) → 내장 이름(\`print\`, \`len\` 등). 함수 안에서 전역 변수를 **읽는** 것은 가능하다. 하지만 함수 안에서 같은 이름에 **대입**하면 그 이름은 함수 전체에서 지역 변수가 된다.

\`\`\`python
rate = 0.1              # 전역 변수

def scaled(x):
    return x * rate     # 전역 변수를 읽는다

def reset():
    rate = 0.0          # 지역 변수를 새로 만든다. 전역 rate는 그대로다
    return rate

print(scaled(10), reset(), rate)   # 1.0 0.0 0.1
\`\`\`

\`global\` 선언으로 함수 안에서 전역 변수를 바꿀 수도 있지만 쓰지 않는 것이 좋다. 함수의 결과가 인자가 아닌 바깥 상태에 따라 달라지면, 같은 인자로 불러도 결과가 다를 수 있어 실험을 재현하기 어렵다. 함수가 필요한 값은 **매개변수로 받고**, 결과는 **반환값으로 돌려준다.**

### 함수도 값이다

파이썬에서 함수는 정수나 리스트처럼 하나의 객체다. 이름에 대입하거나, 리스트에 넣거나, 다른 함수의 인자로 넘길 수 있다. \`sorted\`와 \`max\`의 \`key\` 매개변수는 원소마다 적용할 함수를 받아 그 결과로 비교한다.

\`\`\`python
words = ["transformer", "ai", "model"]
print(sorted(words, key=len))          # 길이순: ['ai', 'model', 'transformer']

def squared_error(y, p):
    return (y - p) ** 2

def absolute_error(y, p):
    return abs(y - p)

for loss_fn in (squared_error, absolute_error):     # 함수를 차례로 꺼내 쓴다
    print(loss_fn.__name__, loss_fn(3.0, 5.0))

print(sorted(words, key=lambda w: w[-1]))           # 마지막 글자 순
\`\`\`

\`lambda 매개변수: 식\`은 이름 없이 한 줄짜리 함수를 만든다. \`key\`처럼 짧은 함수를 한 번만 쓸 때 쓴다. 두 줄 이상의 계산은 \`def\`로 정의한다.

### 함수를 잘 나누는 기준

- **하나의 일만 한다.** \`load_and_clean_and_train\`보다 \`load\`, \`clean\`, \`train\`으로 나누면 각각을 따로 시험할 수 있다.
- **이름이 하는 일을 드러낸다.** 동사로 시작하는 \`compute_accuracy\`가 \`acc\`보다 낫다.
- **입력을 바꾸지 않는다.** 결과는 새 객체로 돌려준다([[lesson:mutability-copy]]).
- **docstring에 입력과 출력을 적는다.** 매개변수와 반환값에 타입 힌트(\`def mean(values: list[float]) -> float:\`)를 붙이면 더 명확하다.

:::warn 흔한 실수
- **\`print\`와 \`return\`을 혼동한다.** \`print\`만 하는 함수의 결과를 변수에 대입하면 \`None\`이다.
- **기본값 없는 매개변수를 기본값 있는 매개변수 뒤에 둔다.** \`def f(a=1, b):\`는 \`SyntaxError\`다.
- **함수 안에서 전역 변수에 더한다.** \`count += 1\`을 함수 안에 쓰면 \`count\`가 지역 변수가 되어 \`UnboundLocalError\`가 난다. 값을 인자로 받아 반환한다.
- **함수 이름 뒤 괄호를 빠뜨린다.** \`mean\`은 함수 객체이고 \`mean(xs)\`가 호출이다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`def show(x): print(x * 2)`일 때 `y = show(3)` 다음 `y`의 값은?",
      choices: ["`6`", "`None`", "`\"6\"`", "`3`"],
      answer: 1,
      explanation: "`show`는 6을 화면에 출력하지만 `return`이 없어 `None`을 돌려준다. 결과를 다른 곳에 쓰려면 `return x * 2`로 써야 한다.",
    },
    {
      key: "c2",
      question: "`def f(a, b=2): return a * b`일 때 `f(3)`과 `f(3, b=4)`의 결과는?",
      choices: ["`6`과 `12`", "`5`와 `7`", "`3`과 `4`", "`6`과 `6`"],
      answer: 0,
      explanation: "`f(3)`은 b의 기본값 2를 써서 $3 \\times 2 = 6$이다. `f(3, b=4)`는 b를 4로 지정해 12다.",
    },
    {
      key: "c3",
      question: "다음 코드의 출력은?\n\n```python\nx = 10\ndef g():\n    x = 5\n    return x\ng()\nprint(x)\n```",
      choices: ["`5`", "`10`", "`None`", "`UnboundLocalError`"],
      answer: 1,
      explanation: "함수 안의 `x = 5`는 지역 변수를 새로 만든다. 전역 변수 `x`는 바뀌지 않으므로 10이 출력된다.",
    },
    {
      key: "c4",
      question: "`sorted([\"bb\", \"a\", \"ccc\"], key=len)`의 결과는?",
      choices: ["`['a', 'bb', 'ccc']`", "`['ccc', 'bb', 'a']`", "`[1, 2, 3]`", "`['bb', 'a', 'ccc']`"],
      answer: 0,
      explanation: "`key=len`은 원소마다 `len`을 적용한 값(1, 2, 3)으로 비교해 정렬한다. 돌려주는 것은 길이가 아니라 원래 원소들이다.",
    },
    {
      key: "c5",
      question: "실험을 여러 번 같은 결과로 재현하려고 한다. 함수가 학습률을 얻는 방법으로 가장 알맞은 것은?",
      choices: [
        "전역 변수 `lr`을 함수 안에서 읽고 바꾼다",
        "학습률을 매개변수로 받고 결과를 반환값으로 돌려준다",
        "함수 안에서 `global lr`을 선언한다",
        "학습률을 함수 안에서 무작위로 정한다",
      ],
      answer: 1,
      explanation: "매개변수로 받은 값만으로 결과가 정해지면 같은 인자로 부를 때 항상 같은 결과가 나온다. 전역 상태에 의존하면 다른 코드가 그 값을 바꿨을 때 결과가 달라진다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
count = 0
def bump(n=1):
    return count + n
def area(w, h=1):
    return w * h
print(bump(), bump(5), count)
print(area(3), area(3, 4), area(h=2, w=5))
`,
      expected: "1 5 0\n3 12 10",
      explanation: "`bump`는 전역 `count`(0)를 읽기만 하므로 `count`는 계속 0이다. `area(3)`은 h의 기본값 1을 쓰고, 키워드 인자는 순서와 관계없이 이름으로 전달된다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "함수 안에서 전역 변수를 직접 바꾸는 대신 매개변수와 반환값을 쓰는 것이 좋은 이유를, 같은 실험을 설정만 바꿔 여러 번 실행하는 상황을 예로 들어 설명하라.",
      answer: md`
함수가 전역 변수를 바꾸면 결과가 인자뿐 아니라 그 전에 어떤 코드가 실행되었는지에 따라 달라진다. 학습률 0.1로 실험한 뒤 0.01로 실험할 때, 앞 실험이 전역 설정을 바꿔 놓았다면 두 번째 실험이 의도와 다른 값으로 실행될 수 있고 순서를 바꾸면 결과도 달라진다. 설정을 매개변수로 받고 결과를 반환값으로 돌려주면 같은 인자로 부를 때 항상 같은 결과가 나오고, 함수 하나만 따로 시험할 수 있으며, 설정별 결과를 비교하기도 쉽다.
`,
      keyPoints: ["전역 상태에 의존하면 실행 순서에 따라 결과가 달라진다", "매개변수로 받으면 같은 인자에 같은 결과가 나온다(재현성)", "함수를 따로 시험하고 설정별 결과를 비교하기 쉽다"],
    },
  ],
  references: [
    { title: "Python 자습서 4.7~4.9 — 함수 정의, 인자, 람다 (한국어)", url: "https://docs.python.org/ko/3/tutorial/controlflow.html#defining-functions", note: "기본값, 키워드 인자, lambda" },
    { title: "Python 자습서 9.2 — 스코프와 이름 공간 (한국어)", url: "https://docs.python.org/ko/3/tutorial/classes.html#python-scopes-and-namespaces", note: "이름을 찾는 순서" },
  ],
});
