import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/comprehensions-iterators";

export default defineLesson({
  id: "comprehensions-iterators",
  title: "컴프리헨션과 반복자",
  tier: "core",
  concepts: ["comprehensions-iterators"],
  goal: "리스트·딕셔너리·집합 컴프리헨션으로 변환과 걸러내기를 한 식에 쓰고, 반복자와 제너레이터가 값을 한 번씩 차례로 만든다는 점을 enumerate·zip·sum과 함께 적용한다.",
  why: "토큰 목록을 번호로 바꾸기, 조건에 맞는 샘플만 고르기, 레이블 이름과 번호의 대응표 만들기는 컴프리헨션 한 줄로 쓴다. 데이터를 한꺼번에 메모리에 올리지 않고 묶음 단위로 차례로 내주는 데이터 로더([[lesson:pytorch]])는 이 레슨의 제너레이터와 같은 방식으로 동작한다.",
  body: md`
### 리스트 컴프리헨션: 새 리스트를 한 줄로 만들기

빈 리스트를 만들고, 반복하면서 조건에 맞는 값을 \`append\`하는 코드는 아주 자주 쓴다. 아래는 80점 이상인 점수만 모으는 코드다. 이 형태를 한 줄로 쓰는 문법이 **리스트 컴프리헨션(list comprehension)**이다.

\`\`\`python
scores = [90, 85, 77, 60, 98]

# 반복문으로 쓰면
passed = []
for s in scores:
    if s >= 80:
        passed.append(s)
print(passed)                              # [90, 85, 98]

# 컴프리헨션으로 쓰면
passed2 = [s for s in scores if s >= 80]
print(passed2)                             # [90, 85, 98]
\`\`\`

\`[식 for 변수 in 반복 가능한 값 if 조건]\`은 원소마다 식을 계산한 결과로 새 리스트를 만든다. 뒤의 \`if 조건\`은 생략할 수 있고, 붙이면 조건을 만족하는 원소만 남긴다. 위의 컴프리헨션은 "\`scores\`의 각 \`s\`에 대해, \`s >= 80\`인 것만, \`s\`를 모은다"로 읽는다.

| 부분 | 위 예에서 | 뜻 |
| --- | --- | --- |
| 식 | \`s\` | 새 리스트에 넣을 값 |
| \`for 변수 in 반복 가능한 값\` | \`for s in scores\` | 원소를 하나씩 꺼낸다 |
| \`if 조건\` | \`if s >= 80\` | 조건이 참인 원소만 남긴다(선택) |

식 자리에 계산을 쓰면 원소를 바꾼 새 리스트를 만든다. 문자열 목록을 한꺼번에 숫자로 바꾸거나 정리할 때 많이 쓴다.

\`\`\`python
print([x ** 2 for x in range(5)])          # [0, 1, 4, 9, 16]
print([p * 2 for p in [3, 5, 7]])          # [6, 10, 14]
raw = [" 3", "5 ", "12"]
print([int(s) for s in raw])               # [3, 5, 12]
names = ["  Kim", "lee  "]
print([n.strip().upper() for n in names])  # ['KIM', 'LEE']
print([len(w) for w in ["ai", "data"]])    # [2, 4]
\`\`\`

조건에 맞는 원소의 **개수**는 걸러 낸 리스트의 길이로 센다.

\`\`\`python
nums = [3, 8, 6, 1, 4]
evens = [n for n in nums if n % 2 == 0]
print(evens, len(evens))                   # [8, 6, 4] 3
\`\`\`

### 걸러 내기와 바꾸기: if의 위치

\`if\`의 위치에 따라 뜻이 다르다. 맨 뒤의 \`if\`는 원소를 **걸러 내고**, 식 자리의 \`A if 조건 else B\`([[lesson:conditionals]]의 조건 표현식)는 모든 원소를 **바꾼다**. 바꾸는 경우에는 원소 개수가 그대로다.

\`\`\`python
scores = [90, 85, 77, 60, 98]
print([s for s in scores if s >= 80])                     # [90, 85, 98]
print(["통과" if s >= 80 else "보충" for s in scores])     # ['통과', '통과', '보충', '보충', '통과']
values = [3, -1, 0, 5]
print([v if v > 0 else 0 for v in values])                # [3, 0, 0, 5]
\`\`\`

| 형태 | 하는 일 | 결과 개수 |
| --- | --- | --- |
| \`[x for x in xs if 조건]\` | 조건이 참인 원소만 남긴다 | 같거나 줄어든다 |
| \`[A if 조건 else B for x in xs]\` | 원소마다 A나 B로 바꾼다 | 그대로다 |

### 중첩 반복 컴프리헨션

\`for\`를 두 번 쓰면 중첩 반복과 같다. **앞의 \`for\`가 바깥 반복**이다. 반복문으로 쓸 때의 순서 그대로 왼쪽부터 쓴다고 기억하면 된다.

\`\`\`python
grid = [[1, 2, 3], [4, 5, 6]]
flat = [x for row in grid for x in row]
print(flat)                                # [1, 2, 3, 4, 5, 6]
column = [row[1] for row in grid]
print(column)                              # [2, 5]
\`\`\`

\`flat\`은 반복문으로 쓰면 다음과 같다. 바깥 \`for row in grid\`가 먼저, 안쪽 \`for x in row\`가 나중이다.

\`\`\`python
flat = []
for row in grid:
    for x in row:
        flat.append(x)
print(flat)                                # [1, 2, 3, 4, 5, 6]
\`\`\`

### enumerate와 zip

- \`enumerate(seq, start=0)\`은 \`(번호, 원소)\` 쌍을 차례로 내준다. \`range(len(seq))\`로 인덱스를 따로 세는 것보다 간결하다. \`start=1\`을 주면 번호가 1부터 시작한다.
- \`zip(a, b, ...)\`은 여러 시퀀스에서 같은 위치의 원소를 묶어 튜플로 내준다([[lesson:functions-scope]]). **가장 짧은 시퀀스가 끝나면 멈춘다.** 길이가 다른 두 리스트를 zip하면 남는 원소는 조용히 버려지므로, 길이가 같아야 하는 데이터라면 먼저 길이를 확인한다.

\`\`\`python
fruits = ["사과", "배", "귤"]
for i, fruit in enumerate(fruits):
    print(i, fruit)
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}번째: {fruit}")
\`\`\`

\`\`\`output
0 사과
1 배
2 귤
1번째: 사과
2번째: 배
3번째: 귤
\`\`\`

\`\`\`python
print(list(enumerate(["a", "b"])))          # [(0, 'a'), (1, 'b')]
print(list(zip([1, 2, 3], "ab")))           # [(1, 'a'), (2, 'b')]
print(dict(zip(["lr", "epochs"], [0.1, 20])))   # {'lr': 0.1, 'epochs': 20}
\`\`\`

두 번째 줄에서 \`3\`은 짝이 없어 버려졌다. \`dict(zip(키들, 값들))\`은 두 리스트로 딕셔너리를 만든다. 두 함수를 함께 쓰면 오답인 샘플의 번호를 찾을 수 있다. \`enumerate(zip(...))\`은 \`(번호, (정답, 예측))\`을 내주므로 \`i, (t, p)\`로 나눠 받는다.

\`\`\`python
y_true = [1, 0, 1, 1]
y_pred = [1, 1, 1, 0]
for i, (t, p) in enumerate(zip(y_true, y_pred)):
    if t != p:
        print(f"{i}번 샘플 오답: 정답 {t}, 예측 {p}")
accuracy = sum(t == p for t, p in zip(y_true, y_pred)) / len(y_true)
print(accuracy)
\`\`\`

\`\`\`output
1번 샘플 오답: 정답 0, 예측 1
3번 샘플 오답: 정답 1, 예측 0
0.5
\`\`\`

정확도 계산의 \`t == p\`는 \`True\`·\`False\`이고, \`True\`는 1로 더해지므로 합이 맞힌 개수다([[lesson:operators]]).

### 딕셔너리·집합 컴프리헨션

중괄호에 \`키: 값\`을 쓰면 딕셔너리, 값만 쓰면 집합을 만든다.

\`\`\`python
names = ["민수", "지현", "도윤"]
print({n: len(n) for n in names})          # {'민수': 2, '지현': 2, '도윤': 2}
prices = {"사과": 1200, "배": 2500}
print({k: v * 2 for k, v in prices.items()})                       # {'사과': 2400, '배': 5000}
print({k: ("비쌈" if v > 2000 else "보통") for k, v in prices.items()})   # {'사과': '보통', '배': '비쌈'}
words = "The model and the data".lower().split()
print(sorted({w for w in words}))           # ['and', 'data', 'model', 'the']
\`\`\`

분류 모델은 레이블을 번호로 다루므로 학습 전에 이름 → 번호, 예측 결과를 읽을 때 번호 → 이름 대응표를 만든다. 아래 두 줄이 그 대응표다. 두 번째 줄은 \`items()\`로 꺼낸 (이름, 번호)를 뒤집어 넣는다.

\`\`\`python
classes = ["cat", "dog", "bird"]
label_to_id = {name: i for i, name in enumerate(classes)}   # 이름 → 번호
id_to_label = {i: name for name, i in label_to_id.items()}  # 번호 → 이름(뒤집기)
print(label_to_id)          # {'cat': 0, 'dog': 1, 'bird': 2}
print(id_to_label[2])       # bird
\`\`\`

### 반복자: 한 번 꺼내면 끝난다

\`for\`문은 내부적으로 \`iter()\`로 **반복자(iterator)**를 얻고, \`next()\`로 원소를 하나씩 꺼내며, 더 꺼낼 원소가 없으면(\`StopIteration\`) 멈춘다. 반복자는 어디까지 꺼냈는지 위치를 기억하고, 처음으로 돌아가는 기능이 없다.

\`\`\`python
it = iter([10, 20, 30])
print(next(it))                # 10
print(next(it))                # 20
print(list(it))                # [30]
print(list(it))                # []
\`\`\`

| 실행 | 꺼낸 값 | 남은 원소 |
| --- | --- | --- |
| \`next(it)\` | 10 | 20, 30 |
| \`next(it)\` | 20 | 30 |
| \`list(it)\` | 남은 것 모두: \`[30]\` | 없음 |
| \`list(it)\` | 꺼낼 것이 없어 \`[]\` | 없음 |

원소가 없는 반복자에서 \`next()\`를 부르면 \`StopIteration\` 예외가 난다. \`for\`문은 이 예외를 받으면 반복을 끝낸다.

리스트는 반복할 때마다 새 반복자를 만들므로 몇 번이고 다시 순회할 수 있다. 하지만 \`zip\`, \`enumerate\`, \`map\`의 결과와 열린 파일은 **그 자체가 반복자**라서 한 번 끝까지 꺼내면 다시 처음부터 꺼낼 수 없다.

\`\`\`python
pairs = zip([1, 2], [3, 4])
print(list(pairs))             # [(1, 3), (2, 4)]
print(list(pairs))             # []
nums = [1, 2]
print(list(nums), list(nums))  # [1, 2] [1, 2]
\`\`\`

같은 데이터를 여러 번 순회해야 하면 \`list()\`로 한 번 리스트를 만들어 두거나, 순회할 때마다 \`zip(...)\`을 새로 호출한다.

### 제너레이터: 필요할 때 하나씩 만든다

컴프리헨션을 대괄호 대신 소괄호로 감싸면 **제너레이터 표현식**이 된다. 리스트를 한꺼번에 만들지 않고, 값이 필요할 때마다 하나씩 계산하는 반복자다. \`sum(x ** 2 for x in xs)\`처럼 다른 함수에 바로 넘길 때는 괄호를 한 번만 쓴다. 원소가 백만 개여도 리스트를 저장할 메모리가 필요 없다.

\`\`\`python
squares = (x ** 2 for x in range(4))
# 아래 줄은 <generator object <genexpr> at 0x...> 형식으로 출력된다
print(squares)
print(list(squares))           # [0, 1, 4, 9]
print(sum(x ** 2 for x in range(1_000_000)))   # 333332833333500000
\`\`\`

제너레이터를 그대로 출력한 줄에는 실행할 때마다 달라지는 메모리 주소(\`0x\` 뒤의 값)가 들어 있다. 제너레이터를 출력하면 값이 보이지 않는 이유는 아직 값을 하나도 만들지 않았기 때문이다.

함수 안에서 \`return\` 대신 \`yield\`를 쓰면 **제너레이터 함수**가 된다. 호출하면 반복자를 돌려주고, \`next()\`를 부를 때마다 다음 \`yield\`까지 실행해 그 값을 내준다. 아래 코드의 출력 순서를 보면, 값을 요청할 때마다 그만큼만 실행된다는 것을 알 수 있다.

\`\`\`python
def count_up(n):
    for i in range(n):
        print("만드는 중:", i)
        yield i

gen = count_up(3)
print("아직 아무것도 만들지 않았다")
print(next(gen))
print(next(gen))
\`\`\`

\`\`\`output
아직 아무것도 만들지 않았다
만드는 중: 0
0
만드는 중: 1
1
\`\`\`

학습 데이터를 일정한 크기의 묶음(배치)으로 차례로 내주는 코드가 이 형태다. \`range(0, len(items), size)\`는 묶음의 시작 위치 0, 4, 8을 만든다.

\`\`\`python
def batches(items, size):
    """items를 size개씩 차례로 내준다(마지막 묶음은 더 작을 수 있다)"""
    for start in range(0, len(items), size):
        yield items[start:start + size]

data = list(range(10))
for batch in batches(data, 4):
    print(batch)
\`\`\`

\`\`\`output
[0, 1, 2, 3]
[4, 5, 6, 7]
[8, 9]
\`\`\`

### 컴프리헨션을 쓰지 않을 때

컴프리헨션은 "값을 모아 새 컬렉션을 만드는" 데만 쓴다. 출력이나 파일 저장처럼 결과를 모으지 않는 일은 반복문으로 쓴다. 조건과 \`for\`가 여러 겹이라 한 줄에 읽히지 않으면 반복문이 더 낫다.

:::warn 흔한 실수
- **걸러 내기와 바꾸기의 \`if\` 위치를 혼동한다.** \`[x for x in xs if x > 0]\`는 원소를 거르고, \`[x if x > 0 else 0 for x in xs]\`는 원소를 바꾼다.
- **zip 결과를 두 번 순회한다.** 두 번째에는 아무것도 나오지 않는다.
- **길이가 다른 리스트를 zip한다.** 남는 원소가 오류 없이 버려진다.
- **출력만 하려고 컴프리헨션을 쓴다.** \`[print(x) for x in xs]\`는 쓸모없는 \`None\` 리스트를 만든다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`[x ** 2 for x in range(5) if x % 2 == 0]`의 결과는?",
      choices: ["`[0, 4, 16]`", "`[0, 1, 4, 9, 16]`", "`[1, 9]`", "`[4, 16]`"],
      answer: 0,
      explanation: "0~4 중 짝수(0, 2, 4)만 남기고 제곱한다. 맨 뒤의 `if`는 원소를 걸러 낸다. `[0, 1, 4, 9, 16]`은 이 `if`를 무시한 결과다.",
    },
    {
      key: "c2",
      question: "`{name: i for i, name in enumerate([\"cat\", \"dog\"])}`의 결과는?",
      choices: ["`{0: 'cat', 1: 'dog'}`", "`{'cat': 0, 'dog': 1}`", "`['cat', 'dog']`", "`{'cat': 1, 'dog': 2}`"],
      answer: 1,
      explanation: "`enumerate`는 (0, \"cat\"), (1, \"dog\")를 내주고, 컴프리헨션은 이름을 키로, 번호를 값으로 넣는다. 번호는 0부터 시작한다. `{0: 'cat', 1: 'dog'}`는 키와 값을 바꿔 읽은 것이다.",
    },
    {
      key: "c3",
      question: "`pairs = zip([1, 2], [3, 4])` 다음 `a = list(pairs)`, `b = list(pairs)`를 실행하면 `b`는?",
      choices: ["`[(1, 3), (2, 4)]`", "`[]`", "`[(1, 2), (3, 4)]`", "`TypeError`"],
      answer: 1,
      explanation: "`zip`의 결과는 반복자라 한 번 끝까지 꺼내면 비게 된다. 두 번 쓰려면 리스트로 저장해 두거나 `zip`을 다시 호출한다. `zip`의 결과를 리스트처럼 여러 번 읽을 수 있다고 생각하면 `[(1, 3), (2, 4)]`를 고르게 된다.",
    },
    {
      key: "c4",
      question: "원소가 천만 개인 범위의 제곱합을 구할 때 `sum(x ** 2 for x in range(10_000_000))`가 `sum([x ** 2 for x in range(10_000_000)])`보다 나은 점은?",
      choices: [
        "중간 결과를 저장하지 않으므로 결과가 더 정확하다",
        "리스트를 만들지 않아 메모리를 거의 쓰지 않는다",
        "반복 횟수가 줄어 항상 더 빨리 끝난다",
        "음수를 자동으로 걸러 준다",
      ],
      answer: 1,
      explanation: "제너레이터 표현식은 값을 하나씩 만들어 `sum`에 넘기므로 천만 개짜리 리스트를 저장할 필요가 없다. 결과는 같고, 반복 횟수도 같으므로 정확도나 속도가 반드시 좋아지는 것은 아니다.",
    },
    {
      key: "c5",
      question: "`list(zip([1, 2, 3], \"ab\"))`의 결과는?",
      choices: ["`[(1, 'a'), (2, 'b'), (3, None)]`", "`[(1, 'a'), (2, 'b')]`", "`ValueError`", "`[(1, 2, 3), ('a', 'b')]`"],
      answer: 1,
      explanation: "`zip`은 가장 짧은 쪽(\"ab\", 두 글자)이 끝나면 멈춘다. 남는 3은 오류 없이 버려진다. 부족한 자리를 `None` 같은 값으로 채우려면 `itertools.zip_longest`를 쓴다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
names = ["a", "b", "c"]
pairs = list(zip(names, range(10, 40, 10)))
idx = {n: i for i, n in enumerate(names)}
it = iter(names)
next(it)
print(pairs[-1], idx["c"], list(it))
`,
      expected: "('c', 30) 2 ['b', 'c']",
      explanation: "`range(10, 40, 10)`은 10, 20, 30이라 마지막 쌍은 ('c', 30)이다. \"c\"의 번호는 2다. 반복자에서 `next`로 \"a\"를 꺼냈으므로 남은 것은 ['b', 'c']다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "`zip` 결과 같은 반복자를 두 번 순회하면 두 번째에 아무 값도 나오지 않는 이유를 설명하고, 같은 데이터를 여러 번 순회해야 할 때의 해결 방법을 써라.",
      answer: md`
반복자는 \`next()\`로 원소를 하나씩 꺼낼 때마다 위치가 앞으로 이동하고, 끝까지 꺼내면 \`StopIteration\` 상태로 남는다. 처음으로 돌아가는 기능이 없으므로 두 번째 순회에서는 꺼낼 원소가 없다. 리스트는 순회할 때마다 새 반복자를 만들기 때문에 이 문제가 없다. 여러 번 순회해야 하면 \`pairs = list(zip(a, b))\`처럼 리스트로 한 번 저장해 두거나, 순회할 때마다 \`zip(a, b)\`를 새로 호출한다.
`,
      keyPoints: ["반복자는 꺼낸 위치를 기억하고 처음으로 돌아가지 않는다", "리스트는 순회할 때마다 새 반복자를 만든다", "`list()`로 저장하거나 반복자를 새로 만든다"],
    },
  ],
  references: [
    { title: "Python 자습서 5.1.3 — 리스트 컴프리헨션 (한국어)", url: "https://docs.python.org/ko/3/tutorial/datastructures.html#list-comprehensions", note: "중첩 컴프리헨션 포함" },
    { title: "Python 자습서 9.8~9.10 — 이터레이터, 제너레이터, 제너레이터 표현식 (한국어)", url: "https://docs.python.org/ko/3/tutorial/classes.html#iterators", note: "iter, next, yield의 동작" },
  ],
});
