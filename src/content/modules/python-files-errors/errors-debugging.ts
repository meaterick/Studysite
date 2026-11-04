import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/errors-debugging";

export default defineLesson({
  id: "errors-debugging",
  title: "오류 메시지 읽기, 예외 처리, 디버깅",
  tier: "core",
  concepts: ["errors-debugging"],
  goal: "트레이스백에서 오류의 종류·위치·원인을 읽고, try/except로 예상한 예외만 처리하며, 최소 재현과 assert·print로 버그의 원인을 좁힌다.",
  why: "데이터 처리와 모델 학습 코드는 잘못된 입력, 모양이 맞지 않는 배열, 0으로 나누기 같은 이유로 자주 멈춘다. 오류 메시지를 정확히 읽고 원인을 좁히는 절차는 [[lesson:data-cleaning]]에서 잘못된 값을 처리할 때와 [[lesson:numpy-arrays]]에서 배열의 shape 오류를 고칠 때 그대로 쓰인다.",
  body: md`
### 트레이스백 읽기

실행 중에 오류가 나면 파이썬은 **예외(exception)**를 일으키고, 처리되지 않은 예외는 **트레이스백(traceback)**을 출력하며 프로그램을 멈춘다. 트레이스백은 아래에서부터 읽는다.

1. **마지막 줄**: 예외의 종류와 메시지. 무엇이 잘못되었는지를 알려 준다.
2. **그 위의 줄들**: 예외가 일어나기까지 호출된 함수의 순서. 아래로 갈수록 오류에 가까운 곳이고, 각 항목에 파일 이름·줄 번호·함수 이름이 있다.
3. **내 코드의 마지막 항목**: 라이브러리 내부가 아니라 내가 쓴 코드 중 가장 아래 항목이 대개 고칠 곳이다.

아래 셀은 일부러 오류를 일으킨 뒤 \`traceback.print_exc()\`로 트레이스백을 출력한다(셀이 멈추지 않도록 \`try\`로 감쌌다).

\`\`\`python
import traceback

def average(values):
    return sum(values) / len(values)

def report(groups):
    for name, values in groups.items():
        print(name, average(values))

try:
    report({"A반": [80, 90], "B반": []})
except ZeroDivisionError:
    traceback.print_exc()
\`\`\`

출력의 마지막 줄은 \`ZeroDivisionError: division by zero\`다. 그 위는 \`report\`가 \`average\`를 불렀고, \`average\`의 \`return sum(values) / len(values)\` 줄에서 오류가 났다는 뜻이다. 원인은 B반의 점수 리스트가 비어 있어 \`len(values)\`가 0인 것이다. 오류가 난 줄(\`average\`)과 원인이 생긴 곳(빈 리스트를 넘긴 데이터)이 다를 수 있다는 점에 주의한다.

### 자주 만나는 예외

| 예외 | 흔한 원인 | 예 |
| --- | --- | --- |
| \`SyntaxError\`, \`IndentationError\` | 문법·들여쓰기 오류. 실행 전에 발견된다 | 콜론 누락, 블록 들여쓰기 불일치 |
| \`NameError\` | 정의하지 않은 이름 | 오타 \`scroes\`, 정의하기 전에 사용 |
| \`TypeError\` | 자료형이 맞지 않는 연산 | \`"점수: " + 90\`, 인자 개수 틀림 |
| \`ValueError\` | 자료형은 맞지만 값이 잘못됨 | \`int("abc")\`, \`int("3.5")\` |
| \`IndexError\` | 범위를 벗어난 인덱스 | 원소 4개인 리스트의 \`xs[4]\` |
| \`KeyError\` | 딕셔너리에 없는 키 | \`config["seed"]\` |
| \`AttributeError\` | 객체에 없는 속성·메서드 | \`None.append(1)\`, \`xs = xs.sort()\` 뒤 \`xs.append\` |
| \`ZeroDivisionError\` | 0으로 나눔 | 빈 리스트의 평균 |
| \`FileNotFoundError\` | 없는 파일을 읽음 | 경로 오타, 작업 폴더 착각 |
| \`ModuleNotFoundError\` | 설치되지 않은 패키지 | 가상환경을 켜지 않음([[lesson:modules-environments]]) |

### 예외 처리: try와 except

예상할 수 있는 실패는 \`try\`로 감싸고 \`except\`에서 처리한다. \`except\`에는 **처리할 예외의 종류를 정확히** 적는다. \`else\`는 예외가 없을 때만, \`finally\`는 예외와 관계없이 항상 실행된다.

\`\`\`python
raw = ["88", "95", "결석", "70", ""]
scores, skipped = [], []
for text in raw:
    try:
        value = int(text)
    except ValueError:              # 정수로 바꿀 수 없는 값만 처리한다
        skipped.append(text)
    else:                           # 예외가 없을 때만 실행된다
        scores.append(value)
print(scores, skipped)              # [88, 95, 70] ['결석', '']
\`\`\`

\`except:\`처럼 종류를 쓰지 않거나 \`except Exception:\`으로 모든 예외를 잡으면, 예상하지 못한 버그(오타로 생긴 \`NameError\` 등)까지 아무 출력 없이 무시하므로 원인을 찾기 어려워진다. 처리할 수 없는 예외는 잡지 말고 그대로 두어 트레이스백을 보는 편이 낫다. 모든 예외를 잡아야 한다면 \`except Exception as e:\`로 받아 메시지를 기록한다.

### 예외 일으키기

함수가 받은 값이 잘못되었을 때 이상한 결과를 돌려주는 것보다 즉시 예외를 일으키는 편이 낫다. \`raise ValueError("메시지")\`로 일으키고, 메시지에는 무엇이 잘못되었는지와 실제 값을 넣는다.

\`\`\`python
def safe_mean(values):
    if not values:
        raise ValueError("빈 리스트의 평균은 정의되지 않는다")
    return sum(values) / len(values)

try:
    safe_mean([])
except ValueError as e:
    print("오류:", e)
\`\`\`

### assert로 가정 확인하기

\`assert 조건, "메시지"\`는 조건이 거짓이면 \`AssertionError\`를 일으킨다. "여기서는 반드시 이래야 한다"는 내부 가정을 코드에 적어 두는 데 쓴다. 예를 들어 데이터를 나눈 뒤 개수가 맞는지, 특성과 레이블의 길이가 같은지 확인한다. 사용자 입력이나 파일 내용처럼 **틀릴 수 있는 외부 값**의 검사에는 \`assert\` 대신 \`if\`와 \`raise\`를 쓴다. \`assert\`는 실행 옵션(\`python -O\`)으로 꺼질 수 있기 때문이다.

\`\`\`python
features = [[1.0, 2.0], [0.5, 1.5], [2.0, 0.1]]
labels = [0, 1, 1]
assert len(features) == len(labels), f"샘플 수 불일치: {len(features)} vs {len(labels)}"
print("확인 완료")
\`\`\`

### 디버깅 절차

오류가 나거나 결과가 예상과 다르면 다음 순서로 원인을 좁힌다.

1. **오류 메시지와 줄 번호를 읽는다.** 예외 종류만으로도 원인의 범위가 크게 줄어든다.
2. **최소 재현을 만든다.** 문제가 생기는 입력을 가장 작게 줄인다(데이터 만 줄 → 문제가 생기는 한 줄).
3. **가정을 하나씩 확인한다.** 중간 값의 \`type()\`, \`len()\`, \`repr()\`을 출력해 예상과 비교한다. \`repr()\`은 문자열의 공백과 \`"\n"\`까지 보여 준다.
4. **범위를 반으로 나눈다.** 코드 중간에 확인 출력을 넣어 문제가 앞쪽에서 생기는지 뒤쪽에서 생기는지 가른다.
5. **고친 뒤 같은 입력으로 다시 확인한다.** 같은 버그가 다시 생기지 않도록 그 입력을 시험 코드로 남긴다.

\`\`\`python
def count_long_words(text, min_len):
    count = 0
    for word in text.split(" "):
        if len(word) > min_len:       # 버그: "min_len 글자 이상"이어야 하는데 초과로 셈
            count += 1
    return count

print(count_long_words("data  science model", 5))     # 기대: 2(science와 model은 5글자 이상), 실제: 1
for word in "data  science model".split(" "):
    print(repr(word), len(word))      # 가정 확인: 빈 문자열이 끼어 있고 model은 5글자다
\`\`\`

확인 출력을 보면 두 가지 문제가 드러난다. 공백이 두 칸인 곳에서 \`split(" ")\`이 빈 문자열 \`''\`을 만들고, \`model\`(5글자)은 \`> 5\`를 만족하지 않는다. \`split()\`(인자 없이)은 연속된 공백을 하나로 취급하고, 조건은 \`>= min_len\`으로 고쳐야 한다.

:::warn 흔한 실수
- **트레이스백의 맨 위만 읽는다.** 예외 종류와 메시지는 맨 아래에 있다.
- **모든 예외를 잡아 조용히 넘긴다.** \`except: pass\`는 버그를 숨긴다. 처리할 예외만 정확히 적는다.
- **오류를 피하려고 값을 임의로 바꾼다.** 빈 리스트의 평균을 0으로 돌려주면 이후 계산이 틀린 값을 그대로 쓴다. 예외를 일으키거나 결측값(\`None\`)으로 표시한다.
- **사용자 입력 검사에 assert를 쓴다.** 꺼질 수 있다. \`if\`와 \`raise\`를 쓴다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "트레이스백에서 예외의 종류와 메시지가 나오는 곳은?",
      choices: ["맨 첫 줄", "맨 마지막 줄", "가운데 줄", "트레이스백에는 나오지 않는다"],
      answer: 1,
      explanation: "트레이스백은 호출 순서대로 쌓여 출력되고, 마지막 줄에 예외 종류와 메시지가 나온다. 그 바로 위가 예외가 일어난 위치다.",
    },
    {
      key: "c2",
      question: "`int(\"abc\")`가 일으키는 예외와, 이를 처리하는 `except` 절로 알맞은 것은?",
      choices: ["`TypeError`, `except TypeError:`", "`ValueError`, `except ValueError:`", "`NameError`, `except NameError:`", "`KeyError`, `except KeyError:`"],
      answer: 1,
      explanation: "`int()`에 문자열을 넘긴 것은 자료형이 맞지만, 그 값이 정수 모양이 아니므로 `ValueError`다. 처리할 예외의 종류를 정확히 적는다.",
    },
    {
      key: "c3",
      question: "`try`/`except`/`else`에서 `else` 블록이 실행되는 경우는?",
      choices: ["예외가 발생했을 때", "`try` 블록에서 예외가 발생하지 않았을 때", "항상", "`except` 블록이 실행된 뒤"],
      answer: 1,
      explanation: "`else`는 `try` 블록이 예외 없이 끝났을 때만 실행된다. 예외와 관계없이 항상 실행되는 것은 `finally`다.",
    },
    {
      key: "c4",
      question: "`try: ... except: pass`처럼 종류를 쓰지 않고 모든 예외를 잡아 넘기면 생기는 문제는?",
      choices: [
        "실행이 느려진다",
        "오타로 생긴 `NameError` 같은 예상하지 못한 버그까지 숨겨 원인을 찾기 어렵다",
        "`SyntaxError`가 난다",
        "예외가 두 번 출력된다",
      ],
      answer: 1,
      explanation: "종류를 쓰지 않은 `except`는 모든 예외를 잡으므로, 처리하려던 실패뿐 아니라 코드의 버그까지 조용히 지나간다. 처리할 예외만 정확히 적는다.",
    },
    {
      key: "c5",
      question: "다음 중 `assert`를 쓰기에 가장 알맞은 곳은?",
      choices: [
        "사용자가 입력한 나이가 음수인지 검사할 때",
        "데이터를 나눈 직후 학습용과 평가용의 개수 합이 전체와 같은지 확인할 때",
        "파일이 존재하는지 검사할 때",
        "네트워크 요청이 실패했는지 검사할 때",
      ],
      answer: 1,
      explanation: "`assert`는 코드가 올바르면 항상 참이어야 하는 내부 가정을 확인하는 데 쓴다. 사용자 입력·파일·네트워크처럼 정상적으로도 틀릴 수 있는 값은 `if`와 `raise`로 검사한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
def parse(text):
    try:
        value = float(text)
    except ValueError:
        return "invalid"
    else:
        return value * 2
    finally:
        print("checked", repr(text))

print(parse("1.5"))
print(parse("x"))
`,
      expected: "checked '1.5'\n3.0\nchecked 'x'\ninvalid",
      explanation: "`finally`는 `return`하기 직전에도 실행되므로 각 호출에서 \"checked\"가 먼저 출력된다. \"1.5\"는 예외 없이 `else`에서 3.0을, \"x\"는 `ValueError`를 잡아 \"invalid\"를 돌려준다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "CSV에서 읽은 점수 중 일부가 비어 있거나 \"결석\"처럼 숫자가 아니다. 이 값들을 처리하는 방법으로 ① 해당 줄을 건너뛰고 개수를 기록하기, ② 0으로 바꾸기를 비교하고, 어느 쪽이 나은지 근거와 함께 설명하라.",
      answer: md`
\`try\`/\`except ValueError\`로 변환에 실패한 값을 건너뛰고 몇 개를 건너뛰었는지(어떤 값이었는지) 기록하면, 평균 같은 통계가 실제 점수만으로 계산되고 데이터 품질 문제도 드러난다. 0으로 바꾸면 오류는 나지 않지만 결석이나 누락이 실제 0점처럼 계산되어 평균이 낮아지고, 0점을 받은 학생과 구분할 수 없게 된다. 따라서 ①이 낫다. 결측을 분석에 포함해야 한다면 0이 아니라 \`None\` 같은 결측 표시로 남기고, 처리 방법은 [[lesson:data-cleaning]]의 기준에 따라 따로 정한다.
`,
      keyPoints: ["변환 실패는 `except ValueError`로 처리하고 건너뛴 수를 기록한다", "0으로 바꾸면 통계가 왜곡되고 실제 0점과 구분되지 않는다", "결측은 0이 아닌 결측 표시로 남긴다"],
    },
  ],
  references: [
    { title: "Python 자습서 8장 — 에러와 예외 (한국어)", url: "https://docs.python.org/ko/3/tutorial/errors.html", note: "try/except/else/finally, raise" },
    { title: "Python 표준 라이브러리 — 내장 예외 (한국어)", url: "https://docs.python.org/ko/3/library/exceptions.html", note: "예외의 종류와 계층" },
  ],
});
