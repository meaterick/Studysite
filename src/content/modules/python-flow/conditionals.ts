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
### 비교 연산

비교 연산의 결과는 \`True\` 또는 \`False\`다.

| 연산자 | 뜻 | 예 | 결과 |
| --- | --- | --- | --- |
| \`==\`, \`!=\` | 같다, 다르다 | \`3 == 3.0\` | \`True\` |
| \`<\`, \`<=\` | 작다, 작거나 같다 | \`2 <= 2\` | \`True\` |
| \`>\`, \`>=\` | 크다, 크거나 같다 | \`"b" > "a"\` | \`True\` |

\`=\`는 대입이고 \`==\`는 비교다. 비교는 이어서 쓸 수 있다. \`0 <= x < 10\`은 \`0 <= x and x < 10\`과 같다. 문자열은 사전 순서(문자 코드 순서)로 비교한다.

float 값은 \`==\`로 비교하지 않는다. [[lesson:variables-types]]에서 본 것처럼 \`0.1 + 0.2\`는 0.3과 아주 조금 다르다. 두 실수가 충분히 가까운지는 \`math.isclose(a, b)\`로 판단한다.

\`\`\`python
import math

x = 7
print(x > 5, x == 7.0, x != 7)        # True True False
print(0 <= x < 10)                    # True
print(0.1 + 0.2 == 0.3, math.isclose(0.1 + 0.2, 0.3))   # False True
\`\`\`

### 논리 연산과 단락 평가

| A | B | \`A and B\` | \`A or B\` | \`not A\` |
| --- | --- | --- | --- | --- |
| True | True | True | True | False |
| True | False | False | True | False |
| False | True | False | True | True |
| False | False | False | False | True |

\`and\`는 왼쪽이 거짓이면 오른쪽을 계산하지 않고, \`or\`는 왼쪽이 참이면 오른쪽을 계산하지 않는다. 이를 **단락 평가(short-circuit evaluation)**라고 한다. \`n != 0 and total / n > 3\`은 \`n\`이 0이면 나눗셈을 실행하지 않으므로 \`ZeroDivisionError\`가 나지 않는다. 조건의 순서가 결과를 바꿀 수 있다는 뜻이다.

\`and\`와 \`or\`는 \`True\`·\`False\`가 아니라 **마지막으로 계산한 값**을 돌려준다. \`0 or 10\`은 \`10\`, \`0 and 10\`은 \`0\`이다. \`name = user_input or "익명"\`처럼 기본값을 정할 때 이 성질을 쓴다.

### 진릿값

조건 자리에는 불리언이 아닌 값도 올 수 있다. 다음 값은 거짓으로 취급하고, 나머지는 모두 참으로 취급한다.

- \`False\`, \`None\`
- 수 \`0\`, \`0.0\`
- 빈 문자열 \`""\`, 빈 리스트 \`[]\`, 빈 딕셔너리 \`{}\`, 빈 집합 \`set()\`

그래서 \`if scores:\`는 "리스트가 비어 있지 않으면"이라는 뜻이다. 반대로 문자열 \`"0"\`과 \`"False"\`는 비어 있지 않으므로 참이다.

### if, elif, else

\`if\` 조건을 위에서부터 차례로 검사해 **처음으로 참인 블록 하나만** 실행하고 나머지는 건너뛴다. 어느 조건도 참이 아니면 \`else\` 블록을 실행한다. 콜론(\`:\`) 다음 줄부터 같은 칸만큼 들여 쓴 줄들이 그 조건에 속하는 블록이다. 들여쓰기는 보통 공백 네 칸이다.

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

\`elif\`는 앞의 조건이 모두 거짓일 때만 검사하므로 \`score >= 80\`만 써도 "80 이상 90 미만"이라는 뜻이 된다. 이 때문에 **조건의 순서가 중요하다.** 위 코드에서 \`score >= 70\`을 맨 앞에 두면 95점도 \`"C"\`가 된다.

블록 안에서 아무것도 하지 않으려면 \`pass\`를 쓴다. 조건 안에 다시 조건을 넣을 수도 있지만, 두 단계 이상 들여쓰면 읽기 어려우므로 \`and\`로 합치거나 순서를 정리한다.

### 조건 표현식

값 하나를 조건에 따라 고를 때는 한 줄로 쓴다. 분류 모델이 출력한 확률을 임계값과 비교해 클래스를 정하는 단계가 이 형태다.

\`\`\`python
prob = 0.73
label = "양성" if prob >= 0.5 else "음성"
print(label)            # 양성

values = [0.2, -1.0, 3.5, 0.0]
for v in values:
    status = "음수 제외" if v < 0 else ("0" if v == 0 else "사용")
    print(v, status)
\`\`\`

조건 표현식을 여러 겹 겹치면 읽기 어려워진다. 두 갈래를 넘으면 if/elif/else 문으로 쓴다.

:::warn 흔한 실수
- **\`x == 1 or 2\`로 "x가 1 또는 2"를 검사한다.** 이 식은 \`(x == 1) or 2\`로 계산된다. \`x\`가 1이 아니면 \`2\`를 돌려주는데 2는 참이므로 조건이 **항상 참**이다. \`x == 1 or x == 2\` 또는 \`x in (1, 2)\`로 쓴다.
- **조건 순서를 잘못 둔다.** 넓은 조건(\`score >= 60\`)을 좁은 조건(\`score >= 90\`)보다 앞에 두면 뒤 조건은 실행되지 않는다.
- **float를 \`==\`로 비교한다.** \`math.isclose()\`를 쓴다.
- **조건 안에 \`=\`를 쓴다.** \`if x = 3:\`은 \`SyntaxError\`다.
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
