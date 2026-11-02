import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/mutability-copy";

export default defineLesson({
  id: "mutability-copy",
  title: "가변·불변 객체와 참조·복사",
  tier: "core",
  concepts: ["mutability-copy"],
  goal: "가변·불변 자료형을 구분하고, 대입과 함수 인자 전달이 같은 객체를 공유한다는 점과 얕은 복사·깊은 복사의 차이를 코드로 확인한다.",
  why: "전처리 함수에 데이터를 넘겼더니 원본이 바뀌거나, 실험 설정을 복사했다고 생각했는데 두 설정이 함께 바뀌는 오류는 찾기 어렵다. [[lesson:pandas-selection]]에서 원본과 복사본을 구분하는 문제, [[lesson:pytorch]]에서 텐서가 메모리를 공유하는 문제도 같은 원리다.",
  body: md`
### 두 이름이 같은 객체를 가리킬 때

[[lesson:variables-types]]에서 본 것처럼 대입문은 이름이 객체를 가리키게 한다. \`b = a\`는 객체를 복사하지 않는다. 이름 \`b\`가 \`a\`와 **같은 객체**를 가리키게 할 뿐이다. 그래서 리스트처럼 내용을 바꿀 수 있는 객체를 \`b\`로 고치면 \`a\`로 보아도 바뀌어 있다.

[[diagram:python-name-tags]]

두 이름이 같은 객체를 가리키는지는 \`is\`로, 내용이 같은지는 \`==\`로 검사한다. \`id()\`는 객체마다 다른 식별 번호를 돌려준다.

\`\`\`python
a = [1, 2, 3]
b = a              # 같은 객체
c = [1, 2, 3]      # 내용은 같지만 다른 객체
b.append(4)
print(a)                    # [1, 2, 3, 4]
print(a == c, a is c)       # False False: append 뒤에는 내용도 다르다
print(a is b, id(a) == id(b))   # True True
\`\`\`

### 가변 객체와 불변 객체

| 구분 | 자료형 | 성질 |
| --- | --- | --- |
| 불변(immutable) | \`int\`, \`float\`, \`str\`, \`bool\`, \`tuple\`, \`None\` | 만든 뒤 내용을 바꿀 수 없다 |
| 가변(mutable) | \`list\`, \`dict\`, \`set\` | 같은 객체의 내용을 바꿀 수 있다 |

불변 객체를 "바꾸는" 것처럼 보이는 연산은 사실 새 객체를 만든다. \`x += 1\`은 새 정수 객체를 만들어 \`x\`가 가리키게 하고, \`s.upper()\`는 새 문자열을 돌려준다. 그래서 불변 객체는 여러 이름이 공유해도 문제가 생기지 않는다. 반면 \`append\`, \`d[k] = v\`, \`sort()\`처럼 가변 객체를 **그 자리에서** 고치는 연산은 그 객체를 가리키는 모든 이름에 영향을 준다.

\`\`\`python
x = 5
y = x
y += 1             # 새 객체 6을 만들고 y만 6을 가리킨다
print(x, y)        # 5 6

s = "data"
t = s.upper()      # 새 문자열을 돌려준다
print(s, t)        # data DATA
\`\`\`

### 얕은 복사와 깊은 복사

독립된 복사본이 필요하면 명시적으로 복사한다. 리스트는 \`a.copy()\`, \`list(a)\`, \`a[:]\`, 딕셔너리는 \`d.copy()\`, 집합은 \`s.copy()\`로 복사한다. 이 방법들은 **얕은 복사(shallow copy)**다. 바깥 컬렉션은 새로 만들지만, 그 안에 들어 있는 객체는 그대로 공유한다. 안쪽에 리스트나 딕셔너리가 있으면 그 안쪽 객체까지 새로 만드는 **깊은 복사(deep copy)** \`copy.deepcopy()\`가 필요하다.

\`\`\`python
import copy

config = {"lr": 0.1, "layers": [64, 32]}
shallow = config.copy()
deep = copy.deepcopy(config)

shallow["lr"] = 0.01              # 바깥 딕셔너리는 따로라서 config는 그대로
shallow["layers"].append(16)      # 안쪽 리스트는 공유하므로 config에도 보인다
print(config)                     # {'lr': 0.1, 'layers': [64, 32, 16]}
deep["layers"].append(8)          # 깊은 복사는 안쪽 리스트도 따로다
print(config["layers"], deep["layers"])   # [64, 32, 16] [64, 32, 8]: deep은 16을 추가하기 전에 따로 만들었다
\`\`\`

실험마다 설정을 조금씩 바꿔 여러 번 실행할 때 기본 설정을 얕은 복사로 만들면, 한 실험에서 안쪽 리스트를 고친 내용이 다음 실험에 섞인다. 중첩된 설정은 깊은 복사로 만든다.

### 함수에 넘긴 객체는 공유된다

함수를 호출할 때 인자는 복사되지 않고, 매개변수가 **같은 객체**를 가리킨다. 함수 안에서 가변 객체를 그 자리에서 고치면 호출한 쪽의 객체가 바뀐다.

\`\`\`python
def clip_negative(values):
    for i in range(len(values)):
        if values[i] < 0:
            values[i] = 0         # 호출한 쪽의 리스트를 직접 고친다
    return values

raw = [3, -1, 2]
cleaned = clip_negative(raw)
print(raw, cleaned is raw)        # [3, 0, 2] True: 원본이 바뀌었다
\`\`\`

전처리 함수가 원본을 바꾸면 같은 원본으로 다른 전처리를 시도할 수 없게 된다. 특별한 이유가 없으면 함수는 입력을 고치지 않고 **새 객체를 만들어 돌려준다.** 입력을 일부러 고치는 함수라면 \`sort()\`처럼 \`None\`을 돌려주고, 그 사실을 설명 문서(docstring)에 적는다.

### 기본값으로 가변 객체를 쓰면 안 된다

함수의 기본값은 함수를 **정의할 때 한 번만** 만들어진다. 기본값을 빈 리스트로 두면 호출할 때마다 같은 리스트가 재사용된다. 기본값은 \`None\`으로 두고 함수 안에서 새 리스트를 만든다.

\`\`\`python
def add_bad(item, items=[]):
    items.append(item)
    return items

print(add_bad("a"), add_bad("b"))   # ['a', 'b'] ['a', 'b']: 같은 리스트를 공유한다

def add_good(item, items=None):
    if items is None:
        items = []                  # 호출할 때마다 새 리스트
    items.append(item)
    return items

print(add_good("a"), add_good("b")) # ['a'] ['b']
\`\`\`

\`None\`인지 검사할 때는 \`== None\` 대신 \`is None\`을 쓴다. \`None\`은 프로그램 전체에 하나뿐인 객체라 같은 객체인지 검사하는 것이 정확하다.

:::warn 흔한 실수
- **\`b = a\`를 복사로 생각한다.** 같은 객체를 가리킬 뿐이다. \`a.copy()\`로 복사한다.
- **중첩 구조를 얕은 복사한다.** 안쪽 리스트·딕셔너리를 공유한다. \`copy.deepcopy()\`를 쓴다.
- **함수 안에서 인자로 받은 리스트를 고친다.** 호출한 쪽의 원본이 바뀐다.
- **기본값으로 \`[]\`나 \`{}\`를 쓴다.** 호출 사이에 값이 남는다. \`None\`을 쓴다.
- **튜플이면 안의 리스트도 바뀌지 않는다고 생각한다.** \`t = ([1], 2)\`에서 \`t[0].append(3)\`은 동작한다. 튜플이 막는 것은 원소 자체를 다른 객체로 바꾸는 것뿐이다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`a = [1, 2]; b = a; b.append(3)`을 실행한 뒤 `print(a)`의 결과는?",
      choices: ["`[1, 2]`", "`[1, 2, 3]`", "`[3]`", "오류가 난다"],
      answer: 1,
      explanation: "`b = a`는 복사본을 만들지 않고 이름 b가 같은 리스트 객체를 가리키게 한다. b로 추가한 3이 a로도 보인다. 복사본이 필요하면 `a.copy()`를 쓴다.",
    },
    {
      key: "c2",
      question: "`point = (37.5, 127.0)` 다음 줄에서 `point[0] = 36.0`을 실행하면?",
      choices: [
        "`point`가 `(36.0, 127.0)`이 된다",
        "`TypeError`가 난다. 튜플은 만든 뒤 원소를 바꿀 수 없다",
        "새 튜플이 만들어지고 원래 튜플은 그대로 남는다",
        "`point`가 리스트로 바뀐 뒤 값이 바뀐다",
      ],
      answer: 1,
      explanation: "튜플은 불변 자료형이라 원소 대입을 지원하지 않는다. 값을 바꾸려면 `point = (36.0, point[1])`처럼 새 튜플을 만들어 다시 대입한다.",
    },
    {
      key: "c3",
      question: "`x = 5; y = x; y += 1` 다음 `print(x)`의 결과는?",
      choices: ["`5`", "`6`", "`None`", "오류가 난다"],
      answer: 0,
      explanation: "정수는 불변이다. `y += 1`은 새 객체 6을 만들어 y만 그것을 가리키게 하므로 x는 여전히 5를 가리킨다.",
    },
    {
      key: "c4",
      question: "`cfg = {\"layers\": [64, 32]}; c = cfg.copy(); c[\"layers\"].append(16)` 다음 `cfg[\"layers\"]`는?",
      choices: ["`[64, 32]`", "`[64, 32, 16]`", "`[16]`", "`KeyError`"],
      answer: 1,
      explanation: "`copy()`는 얕은 복사라 바깥 딕셔너리만 새로 만들고 안쪽 리스트는 공유한다. 안쪽까지 따로 만들려면 `copy.deepcopy(cfg)`를 쓴다.",
    },
    {
      key: "c5",
      question: "`def add(x, acc=[]): acc.append(x); return acc`일 때 `add(1)`을 실행한 다음 `print(add(2))`의 결과는?",
      choices: ["`[2]`", "`[1, 2]`", "`[1]`", "`None`"],
      answer: 1,
      explanation: "기본값 리스트는 함수를 정의할 때 한 번만 만들어져 호출마다 재사용된다. 첫 호출에서 넣은 1이 남아 있다. 기본값은 `None`으로 두고 함수 안에서 새 리스트를 만든다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
a = [1, 2, 3]
b = a
c = a.copy()
b.append(4)
c.append(5)
print(a, len(c), a is b)
`,
      expected: "[1, 2, 3, 4] 4 True",
      explanation: "`b`는 `a`와 같은 리스트를 가리키므로 `b.append(4)`가 `a`에도 보인다. `c`는 복사본이라 `c`에만 5가 추가되어 길이가 4다. `a is b`는 두 이름이 같은 객체를 가리키므로 True다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "함수가 인자로 받은 리스트를 그 자리에서 고칠 때 생기는 문제를 예로 들고, 이를 피하는 방법 두 가지를 설명하라.",
      answer: md`
인자는 복사되지 않고 같은 객체를 가리키므로, 함수 안에서 \`values[i] = 0\`처럼 고치면 호출한 쪽의 원본이 바뀐다. 예를 들어 음수를 0으로 바꾸는 전처리 함수를 원본 데이터에 적용하면, 같은 원본으로 다른 전처리(예: 음수 행 삭제)를 비교할 수 없게 된다. 피하는 방법은 ① 함수 안에서 새 리스트를 만들어 돌려주는 것(입력은 읽기만 한다), ② 함수를 호출하는 쪽에서 \`values.copy()\`(중첩 구조면 \`copy.deepcopy\`)로 복사본을 넘기는 것이다. 일부러 원본을 고치는 함수라면 \`None\`을 돌려주고 문서에 그 사실을 적는다.
`,
      keyPoints: ["인자는 같은 객체를 공유하므로 함수 안의 변경이 원본에 남는다", "함수가 새 객체를 만들어 돌려준다", "호출하는 쪽에서 복사본(중첩이면 깊은 복사)을 넘긴다"],
    },
  ],
  references: [
    { title: "Python 표준 라이브러리 — copy: 얕은 복사와 깊은 복사 연산 (한국어)", url: "https://docs.python.org/ko/3/library/copy.html", note: "copy()와 deepcopy()의 차이" },
    { title: "Python 자습서 4.8.1 — 기본 인자 값 (한국어)", url: "https://docs.python.org/ko/3/tutorial/controlflow.html#default-argument-values", note: "기본값이 한 번만 평가된다는 주의 사항" },
  ],
});
