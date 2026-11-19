import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/conditionals";

export default defineLesson({
  id: "conditionals",
  title: "비교 연산, 논리 연산, 조건문",
  tier: "core",
  concepts: ["conditionals"],
  goal: "비교·논리 연산의 결과를 계산하고, if/elif/else의 실행 순서와 진릿값 규칙을 적용해 조건 분기 코드를 작성한다.",
  why: "데이터 정제에서 잘못된 값을 거르는 규칙, 분류 모델이 출력한 확률을 임계값과 비교해 클래스를 정하는 단계([[lesson:logistic-regression]]), 손실이 더 줄지 않으면 학습을 멈추는 조건이 모두 조건문으로 작성된다.",
  body: md`
:::info 뒤에서 배울 문법
이 레슨의 \`import\` 문은 [[lesson:modules-environments]], 대괄호로 만드는 리스트 \`[]\`와 소괄호로 만드는 튜플 \`()\`은 [[lesson:collections]]에서 배운다. 아직 배우지 않은 문법이 나오는 셀은 완성된 예제를 실행해 결과만 확인하고, 지금은 이 레슨의 비교와 조건 판단에 집중한다.
:::

### 비교 연산

비교 연산은 두 값을 비교해 **\`True\`(참)** 또는 **\`False\`(거짓)**를 돌려준다.

| 연산자 | 뜻 | 예 | 결과 |
| --- | --- | --- | --- |
| \`==\`, \`!=\` | 같다, 다르다 | \`3 == 3.0\` | \`True\` |
| \`<\`, \`<=\` | 작다, 작거나 같다 | \`2 <= 2\` | \`True\` |
| \`>\`, \`>=\` | 크다, 크거나 같다 | \`"b" > "a"\` | \`True\` |

\`\`\`python
age = 15
print(age > 13)               # True
print(age < 13)               # False
print(age == 15, age != 15)   # True False
print(age >= 15, age <= 14)   # True False
\`\`\`

\`=\`는 대입이고 \`==\`는 비교다. \`age = 15\`는 이름 \`age\`가 15를 가리키게 하는 명령이고, \`age == 15\`는 "\`age\`가 15와 같은가?"를 묻는 식이다.

정수 3과 실수 3.0은 같은 수이므로 \`3 == 3.0\`은 \`True\`다. 그러나 문자열 \`"3"\`과 정수 \`3\`은 자료형이 달라 같지 않다. 파일에서 읽은 숫자 문자열을 숫자와 비교하기 전에 형 변환이 필요한 이유다([[lesson:variables-types]]).

\`\`\`python
print(3 == 3.0)        # True
print("3" == 3)        # False
print(int("3") == 3)   # True
\`\`\`

비교는 이어서 쓸 수 있다. \`0 <= x < 10\`은 \`0 <= x and x < 10\`과 같고, "x가 0 이상 10 미만인가"를 뜻한다.

\`\`\`python
x = 7
print(0 <= x < 10)     # True
x = 12
print(0 <= x < 10)     # False
\`\`\`

문자열은 사전 순서(문자 코드 순서)로 비교한다. 첫 글자부터 차례로 비교해 처음으로 다른 글자에서 크기가 정해진다. 그래서 숫자 문자열 \`"10"\`은 \`"9"\`보다 **작다**. 첫 글자 \`"1"\`이 \`"9"\`보다 앞이기 때문이다. 숫자로 비교하려면 먼저 숫자로 바꾼다. 영문 대문자는 소문자보다 앞 순서다.

\`\`\`python
print("apple" < "banana")    # True
print("10" < "9")            # True
print(int("10") < int("9"))  # False
print("Z" < "a")             # True
\`\`\`

float 값은 \`==\`로 비교하지 않는다. [[lesson:variables-types]]에서 본 것처럼 \`0.1 + 0.2\`는 0.3과 아주 조금 다르다. 두 실수가 충분히 가까운지는 \`math.isclose(a, b)\`로 판단한다. 두 값의 차이가 아주 작은지 직접 비교해도 된다.

\`\`\`python
import math

print(0.1 + 0.2 == 0.3)                       # False
print(math.isclose(0.1 + 0.2, 0.3))           # True
print(abs((0.1 + 0.2) - 0.3) < 1e-9)          # True
\`\`\`

### if 문: 조건이 참일 때만 실행하기

**조건문**은 조건이 참인지 거짓인지에 따라 실행할 코드를 고른다. 가장 기본 형태는 \`if 조건:\`이다.

\`\`\`python
temperature = 31
if temperature >= 30:
    print("폭염 주의")         # 폭염 주의
    print("물을 자주 마신다")   # 물을 자주 마신다
print("검사 끝")               # 검사 끝
\`\`\`

- \`if\` 뒤의 조건 \`temperature >= 30\`을 계산한다. 결과가 \`True\`이면 아래 블록을 실행하고, \`False\`이면 블록을 건너뛴다.
- 콜론(\`:\`) 다음 줄부터 **같은 칸만큼 들여 쓴 줄들**이 그 조건에 속하는 **블록**이다. 들여쓰기는 보통 공백 네 칸이다.
- 들여쓰기가 끝난 \`print("검사 끝")\`은 블록 밖이라 조건과 관계없이 항상 실행된다.

온도를 25로 바꾸면 조건이 \`False\`가 되어 블록 안의 두 줄은 실행되지 않는다.

\`\`\`python
temperature = 25
if temperature >= 30:
    print("폭염 주의")
    print("물을 자주 마신다")
print("검사 끝")               # 검사 끝
\`\`\`

블록을 들여 쓰지 않으면 \`IndentationError\`가 난다. 메시지는 "\`if\` 문 다음에 들여 쓴 블록이 와야 한다"는 뜻이다.

\`\`\`text
if temperature >= 30:
print("폭염 주의")

IndentationError: expected an indented block after 'if' statement on line 2
\`\`\`

조건 자리에 \`=\`를 쓰면 \`SyntaxError\`가 난다. 파이썬이 \`==\`를 쓰려던 것이 아닌지 메시지로 알려 준다.

\`\`\`text
if x = 3:

SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?
\`\`\`

### else와 elif

조건이 거짓일 때 실행할 코드는 \`else:\` 블록에 쓴다. \`if\` 블록과 \`else\` 블록 중 **정확히 하나만** 실행된다.

\`\`\`python
score = 55
if score >= 60:
    print("합격")
else:
    print("불합격")    # 불합격
\`\`\`

갈래가 셋 이상이면 \`elif\`(else if의 줄임)를 쓴다. 파이썬은 조건을 위에서부터 차례로 검사해 **처음으로 참인 블록 하나만** 실행하고 나머지는 건너뛴다. 어느 조건도 참이 아니면 \`else\` 블록을 실행한다.

\`\`\`python
score = 85
if score >= 90:
    grade = "A"
elif score >= 80:       # 앞 조건이 거짓일 때만 검사한다: 80 <= score < 90
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)            # B
\`\`\`

\`score = 85\`일 때의 실행 과정은 ① \`85 >= 90\`은 거짓이라 건너뛴다 ② \`85 >= 80\`은 참이라 \`grade = "B"\`를 실행한다 ③ 남은 \`elif\`와 \`else\`는 검사하지 않는다. 다른 점수로 같은 코드를 따라가면 다음과 같다.

| \`score\` | \`>= 90\` | \`>= 80\` | \`>= 70\` | 실행한 블록 | \`grade\` |
| --- | --- | --- | --- | --- | --- |
| 95 | 참 | 검사 안 함 | 검사 안 함 | 첫 번째 \`if\` | \`"A"\` |
| 85 | 거짓 | 참 | 검사 안 함 | 첫 번째 \`elif\` | \`"B"\` |
| 72 | 거짓 | 거짓 | 참 | 두 번째 \`elif\` | \`"C"\` |
| 40 | 거짓 | 거짓 | 거짓 | \`else\` | \`"F"\` |

\`elif\`는 앞의 조건이 모두 거짓일 때만 검사하므로 \`score >= 80\`만 써도 "80 이상 90 미만"이라는 뜻이 된다. 이 때문에 **조건의 순서가 중요하다.** 넓은 조건을 앞에 두면 뒤의 좁은 조건은 실행될 기회가 없다. 아래 코드는 \`score >= 70\`을 맨 앞에 두어 95점도 \`"C"\`가 된다.

\`\`\`python
score = 95
if score >= 70:
    grade = "C"
elif score >= 80:
    grade = "B"
elif score >= 90:
    grade = "A"
else:
    grade = "F"
print(grade)            # C
\`\`\`

블록 안에서 아무것도 하지 않으려면 \`pass\`를 쓴다. 조건 안에 다시 조건을 넣을 수도 있지만, 두 단계 이상 들여쓰면 읽기 어려우므로 다음 절의 \`and\`로 합치거나 순서를 정리한다.

\`\`\`python
age, has_ticket = 15, True
if age >= 13:
    if has_ticket:
        print("입장 가능")      # 입장 가능
if age >= 13 and has_ticket:
    print("입장 가능")          # 입장 가능
\`\`\`

### 논리 연산: and, or, not

여러 조건을 합칠 때는 논리 연산을 쓴다.

- \`A and B\`: A와 B가 **모두** 참일 때만 참
- \`A or B\`: A와 B 중 **하나라도** 참이면 참
- \`not A\`: 참과 거짓을 뒤집는다

| A | B | \`A and B\` | \`A or B\` | \`not A\` |
| --- | --- | --- | --- | --- |
| True | True | True | True | False |
| True | False | False | True | False |
| False | True | False | True | True |
| False | False | False | False | True |

\`\`\`python
age, height = 12, 135
print(age >= 13 and height >= 120)   # False
print(age >= 13 or height >= 120)    # True
print(not age >= 13)                 # True
\`\`\`

비교 연산은 논리 연산보다 먼저 계산되고, 논리 연산끼리는 \`not\` → \`and\` → \`or\` 순서로 계산된다. \`4 > 1 and not 3 > 5\`는 다음 순서로 계산한다.

| 단계 | 계산 | 남은 식 |
| --- | --- | --- |
| 1 | 비교 \`4 > 1\` → True, \`3 > 5\` → False | \`True and not False\` |
| 2 | \`not False\` → True | \`True and True\` |
| 3 | \`True and True\` → True | \`True\` |

\`and\`가 \`or\`보다 먼저라서 \`True or False and False\`는 \`True or (False and False)\`로 계산되어 \`True\`다. 헷갈리면 괄호로 순서를 적는다.

\`\`\`python
print(4 > 1 and not 3 > 5)             # True
print(True or False and False)         # True
print((True or False) and False)       # False
\`\`\`

### 단락 평가와 and·or의 결과값

\`and\`는 왼쪽이 거짓이면 오른쪽을 계산하지 않는다. 왼쪽이 거짓이면 오른쪽과 관계없이 결과가 거짓이기 때문이다. 마찬가지로 \`or\`는 왼쪽이 참이면 오른쪽을 계산하지 않는다. 이를 **단락 평가(short-circuit evaluation)**라고 한다.

\`n != 0 and total / n > 3\`은 \`n\`이 0이면 나눗셈을 실행하지 않으므로 \`ZeroDivisionError\`가 나지 않는다.

\`\`\`python
total, n = 12, 0
print(n != 0 and total / n > 3)     # False
n = 3
print(n != 0 and total / n > 3)     # True
\`\`\`

두 조건의 순서를 바꾸면 \`n\`이 0일 때 나눗셈을 먼저 실행해 오류가 난다. 조건의 순서가 결과를 바꿀 수 있다는 뜻이다.

\`\`\`text
total, n = 12, 0
print(total / n > 3 and n != 0)

ZeroDivisionError: division by zero
\`\`\`

\`and\`와 \`or\`는 \`True\`·\`False\`가 아니라 **마지막으로 계산한 값**을 돌려준다.

| 식 | 계산 과정 | 결과 |
| --- | --- | --- |
| \`0 or 10\` | 왼쪽 0이 거짓이라 오른쪽을 계산한다 | \`10\` |
| \`5 or 10\` | 왼쪽 5가 참이라 오른쪽을 계산하지 않는다 | \`5\` |
| \`0 and 10\` | 왼쪽 0이 거짓이라 오른쪽을 계산하지 않는다 | \`0\` |
| \`5 and 10\` | 왼쪽 5가 참이라 오른쪽을 계산한다 | \`10\` |

\`\`\`python
print(0 or 10, 5 or 10)     # 10 5
print(0 and 10, 5 and 10)   # 0 10
\`\`\`

\`name = user_input or "익명"\`처럼 기본값을 정할 때 이 성질을 쓴다. 입력이 빈 문자열이면 거짓이므로 \`"익명"\`이 대입된다.

\`\`\`python
user_input = ""
name = user_input or "익명"
print(name)                 # 익명
user_input = "민준"
name = user_input or "익명"
print(name)                 # 민준
\`\`\`

### 진릿값: 조건 자리에 오는 값

조건 자리에는 불리언이 아닌 값도 올 수 있다. 파이썬은 그 값을 \`bool()\`로 바꾼 결과로 판단한다. 다음 값은 거짓으로 취급한다.

- \`False\`, \`None\`
- 수 \`0\`, \`0.0\`, \`0j\`
- 빈 문자열 \`""\`, 빈 리스트 \`[]\`, 빈 딕셔너리 \`{}\`, 빈 집합 \`set()\`, 빈 튜플 \`()\`, 빈 범위 \`range(0)\`

나머지는 모두 참이다. 기본적으로 객체는 참이지만, 객체의 \`__bool__()\`이 False를 반환하거나 \`__bool__()\`이 없는 객체의 \`__len__()\`이 0을 반환하면 거짓이다. 이 특별 메서드는 [[lesson:classes-objects]]에서 더 다룬다.

\`\`\`python
print(bool(0), bool(0.0), bool(""), bool([]), bool(None))   # False False False False False
print(bool(-1), bool("0"), bool(" "), bool([0]))            # True True True True
\`\`\`

두 번째 줄의 값은 모두 참이다. \`-1\`은 0이 아닌 수이고, \`"0"\`과 \`" "\`는 글자가 하나 들어 있는 문자열이며, \`[0]\`은 원소가 하나 있는 리스트다. 그래서 \`if scores:\`는 "리스트 \`scores\`가 비어 있지 않으면"이라는 뜻이다.

\`\`\`python
scores = []
if scores:
    print("점수가 있다")
else:
    print("점수가 없다")    # 점수가 없다
\`\`\`

### "x가 1 또는 2"를 검사하는 법

\`x == 1 or 2\`로 "x가 1 또는 2인가"를 검사하면 틀린다. 비교가 \`or\`보다 먼저 계산되므로 이 식은 \`(x == 1) or 2\`다. \`x\`가 1이 아니면 왼쪽이 \`False\`라 \`or\`는 오른쪽 값 \`2\`를 돌려주는데, 0이 아닌 수는 참으로 취급되므로 조건이 **항상 참**이 된다.

\`\`\`python
x = 5
print(x == 1 or 2)           # 2
print(bool(x == 1 or 2))     # True
print(x == 1 or x == 2)      # False
print(x in (1, 2))           # False
\`\`\`

비교를 두 번 쓰거나(\`x == 1 or x == 2\`), \`in\`으로 "괄호 안의 값 중 하나와 같은가"를 검사한다(\`x in (1, 2)\`).

### 조건 표현식

값 하나를 조건에 따라 고를 때는 \`값1 if 조건 else 값2\`를 한 줄로 쓴다. 조건이 참이면 값1, 거짓이면 값2가 된다. 분류 모델이 출력한 확률을 임계값과 비교해 클래스를 정하는 단계가 이 형태다.

\`\`\`python
prob = 0.73
label = "양성" if prob >= 0.5 else "음성"
print(label)            # 양성
prob = 0.21
label = "양성" if prob >= 0.5 else "음성"
print(label)            # 음성
\`\`\`

조건 표현식을 겹칠 수도 있지만 읽기 어려워진다. 두 갈래를 넘으면 if/elif/else 문으로 쓴다.

\`\`\`python
v = 0.0
status = "음수 제외" if v < 0 else ("0" if v == 0 else "사용")
print(status)           # 0
\`\`\`

:::warn 흔한 실수
- **\`x == 1 or 2\`로 "x가 1 또는 2"를 검사한다.** 이 식은 \`(x == 1) or 2\`로 계산되어 **항상 참**이다. \`x == 1 or x == 2\` 또는 \`x in (1, 2)\`로 쓴다.
- **조건 순서를 잘못 둔다.** 넓은 조건(\`score >= 60\`)을 좁은 조건(\`score >= 90\`)보다 앞에 두면 뒤 조건은 실행되지 않는다.
- **float를 \`==\`로 비교한다.** \`math.isclose()\`를 쓴다.
- **조건 안에 \`=\`를 쓴다.** \`if x = 3:\`은 \`SyntaxError\`다.
- **숫자 문자열을 그대로 비교한다.** \`"10" < "9"\`는 \`True\`다. 숫자로 바꾼 뒤 비교한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`print(3 < 5 and not 2 > 1)`의 출력은?",
      choices: ["`True`", "`False`", "`None`", "`SyntaxError`"],
      answer: 1,
      explanation: "`3 < 5`는 True, `2 > 1`은 True라서 `not 2 > 1`은 False다. True and False는 False다. 비교 연산이 `not`보다 먼저 계산된다.",
    },
    {
      key: "c2",
      question: "다음 코드에 `score = 95`를 넣으면 무엇이 출력되는가?\n\n```python\nif score >= 60:\n    print(\"D\")\nelif score >= 90:\n    print(\"A\")\nelse:\n    print(\"F\")\n```",
      choices: ["`A`", "`D`", "`D`와 `A`", "`F`"],
      answer: 1,
      explanation: "if/elif는 위에서부터 처음 참인 블록 하나만 실행한다. 95는 첫 조건 `score >= 60`에서 이미 참이라 `D`가 출력되고 나머지는 검사하지 않는다. 좁은 조건을 먼저 써야 한다.",
    },
    {
      key: "c3",
      question: "`x = 5`일 때 `if x == 1 or 2:` 블록은 실행되는가?",
      choices: [
        "실행되지 않는다. x는 1도 2도 아니다",
        "실행된다. `(x == 1) or 2`의 값이 참인 2이기 때문이다",
        "`SyntaxError`가 난다",
        "실행되지 않는다. `or`는 정수와 쓸 수 없다",
      ],
      answer: 1,
      explanation: "`x == 1 or 2`는 `(x == 1) or 2`다. 왼쪽이 False라 `or`는 오른쪽 값 2를 돌려주고, 2는 참으로 취급된다. `x in (1, 2)`로 써야 한다.",
    },
    {
      key: "c4",
      question: "다음 중 조건 자리에서 **참**으로 취급되는 값은?",
      choices: ["`[]`", "`0.0`", "`\"0\"`", "`None`"],
      answer: 2,
      explanation: "빈 컬렉션, 0, `None`은 거짓이다. 문자열 \"0\"은 글자가 하나 있는 비어 있지 않은 문자열이라 참이다.",
    },
    {
      key: "c5",
      question: "`n`이 0일 수 있을 때 오류 없이 \"평균이 3보다 크다\"를 검사하는 조건은?",
      choices: [
        "`total / n > 3 and n != 0`",
        "`n != 0 and total / n > 3`",
        "`total / n > 3 or n == 0`",
        "`not n and total / n > 3`",
      ],
      answer: 1,
      explanation: "`and`는 왼쪽이 거짓이면 오른쪽을 계산하지 않는다. `n != 0`을 먼저 두면 n이 0일 때 나눗셈을 실행하지 않는다. 첫 번째 선택지는 나눗셈을 먼저 실행해 `ZeroDivisionError`가 난다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
x = 0
y = x or 10
z = x and 10
print(y, z, bool("0"), 1 < 2 < 3 > 2)
`,
      expected: "10 0 True True",
      explanation: "`x or 10`은 x가 거짓(0)이라 10을, `x and 10`은 x가 거짓이라 x 자신(0)을 돌려준다. \"0\"은 비어 있지 않은 문자열이라 참이다. `1 < 2 < 3 > 2`는 `1 < 2 and 2 < 3 and 3 > 2`라서 True다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "조건 `x == 1 or 2`가 x의 값과 관계없이 참이 되는 이유를 단락 평가와 진릿값으로 설명하고, 의도대로 고친 조건을 써라.",
      answer: md`
비교가 \`or\`보다 먼저 계산되므로 식은 \`(x == 1) or 2\`다. x가 1이면 왼쪽이 True라 그대로 참이다. x가 1이 아니면 왼쪽이 False라 \`or\`는 오른쪽 값 2를 돌려주는데, 0이 아닌 정수는 참으로 취급되므로 조건이 참이 된다. 의도는 "x가 1 또는 2"이므로 \`x == 1 or x == 2\` 또는 \`x in (1, 2)\`로 쓴다.
`,
      keyPoints: ["식은 `(x == 1) or 2`로 계산된다", "`or`는 왼쪽이 거짓이면 오른쪽 값(2)을 돌려주고, 2는 참으로 취급된다", "`x == 1 or x == 2` 또는 `x in (1, 2)`로 고친다"],
    },
  ],
  references: [
    { title: "Python 자습서 4.1 — if 문 (한국어)", url: "https://docs.python.org/ko/3/tutorial/controlflow.html#if-statements", note: "if/elif/else의 기본 형태" },
    { title: "Python 표준 라이브러리 — 진릿값 검사 (한국어)", url: "https://docs.python.org/ko/3/library/stdtypes.html#truth-value-testing", note: "거짓으로 취급하는 값의 전체 목록" },
  ],
});
