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
### 리스트 컴프리헨션

\`[식 for 변수 in 반복 가능한 값]\`은 원소마다 식을 계산한 결과로 새 리스트를 만든다. 뒤에 \`if 조건\`을 붙이면 조건을 만족하는 원소만 남긴다. 빈 리스트를 만들고 반복문에서 \`append\`하는 코드와 결과가 같다.

\`\`\`python
scores = [90, 85, 77, 60, 98]

# 반복문으로 쓰면
passed = []
for s in scores:
    if s >= 80:
        passed.append(s)

# 컴프리헨션으로 쓰면
passed2 = [s for s in scores if s >= 80]
print(passed, passed2)                    # [90, 85, 98] [90, 85, 98]

squares = [x ** 2 for x in range(5)]      # [0, 1, 4, 9, 16]
labels = ["통과" if s >= 80 else "보충" for s in scores]   # 모든 원소에 조건 표현식 적용
print(squares, labels)
\`\`\`

\`if\`의 위치에 따라 뜻이 다르다. 맨 뒤의 \`if\`는 원소를 **걸러 내고**, 식 자리의 \`A if 조건 else B\`는 원소를 **바꾼다**(개수는 그대로다).

\`for\`를 두 번 쓰면 중첩 반복과 같다. 앞의 \`for\`가 바깥 반복이다.

\`\`\`python
grid = [[1, 2, 3], [4, 5, 6]]
flat = [x for row in grid for x in row]   # [1, 2, 3, 4, 5, 6]
column = [row[1] for row in grid]          # [2, 5]: 1번 열
print(flat, column)
\`\`\`

### 딕셔너리·집합 컴프리헨션

중괄호에 \`키: 값\`을 쓰면 딕셔너리, 값만 쓰면 집합을 만든다.

\`\`\`python
classes = ["cat", "dog", "bird"]
label_to_id = {name: i for i, name in enumerate(classes)}   # 이름 → 번호
id_to_label = {i: name for name, i in label_to_id.items()}  # 번호 → 이름(뒤집기)
print(label_to_id, id_to_label[2])

words = "The model and the data".lower().split()
vocab = {w for w in words}                  # 중복 없는 단어 집합
print(sorted(vocab))
\`\`\`

분류 모델은 레이블을 번호로 다루므로 학습 전에 이름 → 번호, 예측 결과를 읽을 때 번호 → 이름 대응표를 만든다. 위의 두 줄이 그 대응표다.

### enumerate와 zip

- \`enumerate(seq, start=0)\`은 \`(번호, 원소)\` 쌍을 차례로 내준다. \`range(len(seq))\`로 인덱스를 따로 세는 것보다 간결하다.
- \`zip(a, b, ...)\`은 여러 시퀀스에서 같은 위치의 원소를 묶어 튜플로 내준다. **가장 짧은 시퀀스가 끝나면 멈춘다.** 길이가 다른 두 리스트를 zip하면 남는 원소는 조용히 버려지므로, 길이가 같아야 하는 데이터라면 먼저 길이를 확인한다.

\`\`\`python
y_true = [1, 0, 1, 1]
y_pred = [1, 1, 1, 0]
for i, (t, p) in enumerate(zip(y_true, y_pred)):
    if t != p:
        print(f"{i}번 샘플 오답: 정답 {t}, 예측 {p}")
accuracy = sum(t == p for t, p in zip(y_true, y_pred)) / len(y_true)
print(accuracy)                            # 0.5

print(list(zip([1, 2, 3], "ab")))          # [(1, 'a'), (2, 'b')]: 3은 버려진다
print(dict(zip(["lr", "epochs"], [0.1, 20])))
\`\`\`

### 반복자: 한 번 꺼내면 끝난다

\`for\`문은 내부적으로 \`iter()\`로 **반복자(iterator)**를 얻고, \`next()\`로 원소를 하나씩 꺼내며, 더 꺼낼 원소가 없으면(\`StopIteration\`) 멈춘다. 리스트는 반복할 때마다 새 반복자를 만들므로 몇 번이고 다시 순회할 수 있다. 하지만 \`zip\`, \`enumerate\`, \`map\`의 결과와 열린 파일은 **그 자체가 반복자**라서 한 번 끝까지 꺼내면 다시 처음부터 꺼낼 수 없다.

\`\`\`python
it = iter([10, 20, 30])
print(next(it), next(it))      # 10 20
print(list(it))                # [30]: 남은 것만
print(list(it))                # []: 이미 다 꺼냈다

pairs = zip([1, 2], [3, 4])
print(list(pairs))             # [(1, 3), (2, 4)]
print(list(pairs))             # []: zip 결과는 한 번만 순회된다
\`\`\`

같은 데이터를 여러 번 순회해야 하면 \`list()\`로 한 번 리스트를 만들어 두거나, 순회할 때마다 \`zip(...)\`을 새로 호출한다.

### 제너레이터: 필요할 때 하나씩 만든다

컴프리헨션을 대괄호 대신 소괄호로 감싸면 **제너레이터 표현식**이 된다. 리스트를 한꺼번에 만들지 않고, 값이 필요할 때마다 하나씩 계산하는 반복자다. \`sum(x ** 2 for x in xs)\`처럼 다른 함수에 바로 넘길 때는 괄호를 한 번만 쓴다. 원소가 백만 개여도 리스트를 저장할 메모리가 필요 없다.

함수 안에서 \`return\` 대신 \`yield\`를 쓰면 **제너레이터 함수**가 된다. 호출하면 반복자를 돌려주고, \`next()\`를 부를 때마다 다음 \`yield\`까지 실행해 그 값을 내준다. 학습 데이터를 일정한 크기의 묶음(배치)으로 차례로 내주는 코드가 이 형태다.

\`\`\`python
def batches(items, size):
    """items를 size개씩 차례로 내준다(마지막 묶음은 더 작을 수 있다)"""
    for start in range(0, len(items), size):
        yield items[start:start + size]

data = list(range(10))
for batch in batches(data, 4):
    print(batch)               # [0, 1, 2, 3] → [4, 5, 6, 7] → [8, 9]

print(sum(x ** 2 for x in range(1_000_000)))   # 리스트를 만들지 않고 합을 구한다
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
      explanation: "0~4 중 짝수(0, 2, 4)만 남기고 제곱한다. 맨 뒤의 `if`는 원소를 걸러 낸다.",
    },
    {
      key: "c2",
      question: "`{name: i for i, name in enumerate([\"cat\", \"dog\"])}`의 결과는?",
      choices: ["`{0: 'cat', 1: 'dog'}`", "`{'cat': 0, 'dog': 1}`", "`['cat', 'dog']`", "`{'cat': 1, 'dog': 2}`"],
      answer: 1,
      explanation: "`enumerate`는 (0, \"cat\"), (1, \"dog\")를 내주고, 컴프리헨션은 이름을 키로, 번호를 값으로 넣는다. 번호는 0부터 시작한다.",
    },
    {
      key: "c3",
      question: "`pairs = zip([1, 2], [3, 4])` 다음 `a = list(pairs)`, `b = list(pairs)`를 실행하면 `b`는?",
      choices: ["`[(1, 3), (2, 4)]`", "`[]`", "`[(1, 2), (3, 4)]`", "`TypeError`"],
      answer: 1,
      explanation: "`zip`의 결과는 반복자라 한 번 끝까지 꺼내면 비게 된다. 두 번 쓰려면 리스트로 저장해 두거나 `zip`을 다시 호출한다.",
    },
    {
      key: "c4",
      question: "원소가 천만 개인 범위의 제곱합을 구할 때 `sum(x ** 2 for x in range(10_000_000))`가 `sum([x ** 2 for x in range(10_000_000)])`보다 나은 점은?",
      choices: [
        "결과가 더 정확하다",
        "제곱한 값의 리스트를 한꺼번에 만들지 않아 메모리를 거의 쓰지 않는다",
        "더 짧은 시간 안에 반드시 끝난다",
        "음수를 자동으로 걸러 준다",
      ],
      answer: 1,
      explanation: "제너레이터 표현식은 값을 하나씩 만들어 `sum`에 넘기므로 천만 개짜리 리스트를 저장할 필요가 없다. 결과는 같다.",
    },
    {
      key: "c5",
      question: "`list(zip([1, 2, 3], \"ab\"))`의 결과는?",
      choices: ["`[(1, 'a'), (2, 'b'), (3, None)]`", "`[(1, 'a'), (2, 'b')]`", "`ValueError`", "`[(1, 2, 3), ('a', 'b')]`"],
      answer: 1,
      explanation: "`zip`은 가장 짧은 쪽(\"ab\", 두 글자)이 끝나면 멈춘다. 남는 3은 오류 없이 버려진다.",
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
