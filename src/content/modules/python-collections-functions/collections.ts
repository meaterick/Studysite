import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/collections";

export default defineLesson({
  id: "collections",
  title: "리스트, 튜플, 딕셔너리, 집합",
  tier: "core",
  concepts: ["collections"],
  goal: "리스트·튜플·딕셔너리·집합의 순서·중복·변경 가능 여부를 비교하고, 문제에 맞는 자료구조를 골라 원소를 추가·조회·삭제·순회한다.",
  why: "학습 데이터는 샘플의 리스트로, 실험 설정은 딕셔너리로, 어휘(서로 다른 단어 목록)는 집합으로 다룬다. [[lesson:numpy-arrays]]의 배열과 [[lesson:dataframes]]의 표도 이 자료구조로 만든 데이터를 받아서 시작한다.",
  body: md`
### 값 여러 개를 하나의 이름으로

학생 세 명의 점수를 변수 세 개에 따로 담으면 학생이 늘어날 때마다 변수도 늘려야 한다. 값 여러 개를 하나로 묶어 한 이름으로 다루면 학생이 몇 명이든 같은 코드로 계산할 수 있다.

\`\`\`python
score1, score2, score3 = 72, 95, 88
print((score1 + score2 + score3) / 3)   # 85.0
scores = [72, 95, 88]                    # 세 값을 하나의 리스트로 묶는다
print(sum(scores) / len(scores))         # 85.0
\`\`\`

여러 값을 하나로 묶어 다루는 자료형을 **컬렉션(collection)**이라고 한다. 컬렉션에 들어 있는 값 하나하나를 **원소(element)**라고 한다. 파이썬의 기본 컬렉션은 네 가지다.

| 자료구조 | 만드는 법 | 순서 | 중복 | 변경 | 주로 쓰는 곳 |
| --- | --- | --- | --- | --- | --- |
| 리스트 \`list\` | \`[1, 2, 2]\` | 있음 | 허용 | 가능 | 순서가 있는 값의 목록, 계속 추가할 때 |
| 튜플 \`tuple\` | \`(37.5, 127.0)\` | 있음 | 허용 | 불가 | 바뀌면 안 되는 묶음, 함수의 여러 반환값 |
| 딕셔너리 \`dict\` | \`{"lr": 0.1}\` | 넣은 순서 유지 | 키는 불허 | 가능 | 이름(키)으로 값을 찾을 때 |
| 집합 \`set\` | \`{"AI", "ML"}\` | 없음 | 불허 | 가능 | 중복 제거, 포함 여부 검사 |

표의 "순서"는 원소를 넣은 순서가 유지되는지, "중복"은 같은 값을 여러 번 넣을 수 있는지, "변경"은 만든 뒤에 원소를 바꿀 수 있는지를 뜻한다. 네 자료구조 모두 \`len()\`으로 원소 수를 세고, \`in\`으로 포함 여부를 검사하고, \`for\`로 순회한다.

\`\`\`python
fruits = ["사과", "배", "귤"]
print(len(fruits))           # 3
print("배" in fruits)        # True
print("포도" in fruits)      # False
for f in fruits:
    print(f)
\`\`\`

\`\`\`output
3
True
False
사과
배
귤
\`\`\`

### 리스트

**리스트**는 순서가 있는 값의 목록이다. 대괄호 안에 값을 쉼표로 나열해 만들고, \`[]\`는 빈 리스트다. 만든 뒤에도 원소를 추가·변경·삭제할 수 있다. 원소의 위치는 0부터 센다. \`xs[0]\`은 첫 원소, \`xs[-1]\`은 마지막 원소다(위치로 꺼내는 방법은 [[lesson:indexing-slicing]]에서 자세히 다룬다).

\`\`\`python
colors = ["빨강", "초록", "파랑"]
print(colors[0], colors[-1])   # 빨강 파랑
colors[1] = "노랑"              # 1번 위치의 원소를 바꾼다
print(colors)                  # ['빨강', '노랑', '파랑']
empty = []
print(len(empty))              # 0
\`\`\`

리스트는 메서드로 원소를 추가하고 뺀다.

| 메서드·연산 | 하는 일 |
| --- | --- |
| \`xs.append(v)\` | 끝에 하나 추가 |
| \`xs.extend(ys)\` | 끝에 다른 리스트의 원소를 모두 추가 |
| \`xs.insert(i, v)\` | i번 위치에 추가 |
| \`xs.pop()\`, \`xs.pop(i)\` | 끝(또는 i번) 원소를 꺼내 돌려주고 리스트에서 뺀다 |
| \`xs.remove(v)\` | 처음 나오는 v를 지운다(없으면 \`ValueError\`) |
| \`xs.index(v)\`, \`xs.count(v)\` | v의 첫 위치, v의 개수 |
| \`xs.sort()\` | 리스트 자체를 정렬한다. 반환값은 \`None\` |
| \`sorted(xs)\` | 정렬한 **새 리스트**를 돌려준다. 원래 리스트는 그대로 |

메서드를 하나씩 실행할 때마다 리스트가 어떻게 바뀌는지 출력으로 확인한다.

\`\`\`python
losses = [0.92, 0.71]
losses.append(0.55)
print(losses)                       # [0.92, 0.71, 0.55]
losses.extend([0.48, 0.47])
print(losses, len(losses))          # [0.92, 0.71, 0.55, 0.48, 0.47] 5
losses.insert(0, 1.20)
print(losses)                       # [1.2, 0.92, 0.71, 0.55, 0.48, 0.47]
last = losses.pop()
print(last, losses)                 # 0.47 [1.2, 0.92, 0.71, 0.55, 0.48]
\`\`\`

\`append\`는 원소 하나를, \`extend\`는 다른 리스트의 원소를 모두 끝에 붙인다. \`append([0.48, 0.47])\`로 쓰면 리스트 자체가 원소 하나로 들어가 \`[..., [0.48, 0.47]]\`이 되므로 구분해서 쓴다. \`pop()\`은 끝 원소를 **꺼내서 돌려주므로** 꺼낸 값을 변수에 받아 쓸 수 있다.

\`\`\`python
votes = ["A", "B", "A", "C", "A"]
print(votes.count("A"))        # 3
print(votes.index("C"))        # 3
votes.remove("A")              # 처음 나오는 "A" 하나만 지운다
print(votes)                   # ['B', 'A', 'C', 'A']
print([0] * 3, [1, 2] + [3])   # [0, 0, 0] [1, 2, 3]
\`\`\`

없는 값을 \`remove\`하면 \`ValueError: list.remove(x): x not in list\`가 난다. 리스트끼리 \`+\`로 이으면 새 리스트가 되고, \`*\`로 같은 원소를 반복한 리스트를 만들 수 있다.

정렬에는 두 가지 방법이 있다. \`sorted(xs)\`는 정렬한 **새 리스트**를 돌려주고 원래 리스트는 그대로 둔다. \`xs.sort()\`는 리스트 **자체**를 정렬하고 \`None\`을 돌려준다. \`reverse=True\`를 주면 큰 것부터 정렬한다.

\`\`\`python
nums = [3, 1, 2]
print(sorted(nums), nums)     # [1, 2, 3] [3, 1, 2]
result = nums.sort()
print(result, nums)           # None [1, 2, 3]
nums.sort(reverse=True)
print(nums)                   # [3, 2, 1]
\`\`\`

그래서 \`nums = nums.sort()\`로 쓰면 \`nums\`가 \`None\`이 되고, 그 뒤에 \`nums.append(4)\`를 실행하면 \`AttributeError: 'NoneType' object has no attribute 'append'\`가 난다.

### 튜플

**튜플**은 만든 뒤 원소를 바꿀 수 없는 리스트다. 소괄호로 만들며, 괄호 없이 쉼표로만 써도 튜플이 된다. 위도·경도, 이미지의 (높이, 너비)처럼 함께 다니고 바뀌면 안 되는 값의 묶음에 쓴다.

\`\`\`python
shape = (28, 28)            # 이미지의 높이와 너비
point = 37.5, 127.0         # 괄호가 없어도 튜플
print(type(point).__name__, point[0], len(point))   # tuple 37.5 2
single = (5,)               # 원소가 하나인 튜플은 쉼표가 필요하다
print(type(single).__name__, type((5)).__name__)    # tuple int
\`\`\`

\`(5)\`는 괄호로 감싼 정수 5일 뿐이다. 원소가 하나인 튜플은 \`(5,)\`처럼 쉼표를 붙인다. 튜플의 원소를 바꾸려고 하면 오류가 난다.

\`\`\`text
shape = (28, 28)
shape[0] = 32

TypeError: 'tuple' object does not support item assignment
\`\`\`

튜플을 여러 이름에 나눠 대입하는 것을 **언패킹(unpacking)**이라고 한다. [[lesson:variables-types]]에서 본 \`a, b = b, a\`도 오른쪽에 튜플 \`(b, a)\`를 만든 뒤 언패킹한 것이다. 함수가 값을 여러 개 돌려줄 때도 튜플로 돌려준다([[lesson:functions-scope]]).

\`\`\`python
shape = (28, 28)
height, width = shape       # 언패킹: height는 28, width는 28
print(height * width)       # 784
q, r = divmod(17, 5)        # divmod는 (몫, 나머지) 튜플을 돌려준다
print(q, r)                 # 3 2
\`\`\`

### 딕셔너리

**딕셔너리**는 **키(key)**와 **값(value)**의 쌍을 저장하고, 키로 값을 바로 찾는다. 중괄호 안에 \`키: 값\`을 쉼표로 나열해 만든다. 리스트가 0, 1, 2 같은 위치로 원소를 찾는다면, 딕셔너리는 \`"lr"\`, \`"epochs"\` 같은 이름으로 값을 찾는다.

\`\`\`python
config = {"lr": 0.1, "epochs": 10}
print(config["lr"])           # 0.1
print(config["epochs"] * 2)   # 20
print(len(config))            # 2
\`\`\`

| 식 | 하는 일 |
| --- | --- |
| \`d[k]\` | 키 k의 값. 키가 없으면 \`KeyError\` |
| \`d.get(k, 기본값)\` | 키 k의 값. 키가 없으면 기본값(생략하면 \`None\`) |
| \`d[k] = v\` | 추가하거나 값을 바꾼다 |
| \`del d[k]\`, \`d.pop(k)\` | 키 k를 지운다 |
| \`k in d\` | 키가 있는지 검사(값이 아니라 **키**를 검사한다) |
| \`d.keys()\`, \`d.values()\`, \`d.items()\` | 키들, 값들, (키, 값) 쌍들 |

키는 중복될 수 없다. 없는 키에 대입하면 새 쌍이 추가되고, 이미 있는 키에 다시 대입하면 값만 바뀐다. 파이썬 3.7부터 딕셔너리는 키를 넣은 순서를 유지하며, 이미 있는 키의 값을 바꿔도 그 키의 순서는 그대로다. \`list(d)\`는 키의 리스트다.

\`\`\`python
config = {"lr": 0.1, "epochs": 10}
config["batch_size"] = 32           # 없는 키: 추가
config["lr"] = 0.01                 # 있는 키: 값만 바뀐다
print(config)                       # {'lr': 0.01, 'epochs': 10, 'batch_size': 32}
print(list(config))                 # ['lr', 'epochs', 'batch_size']
print("lr" in config, 0.01 in config)   # True False
del config["epochs"]
print(config)                       # {'lr': 0.01, 'batch_size': 32}
\`\`\`

\`0.01 in config\`가 \`False\`인 이유는 \`in\`이 값이 아니라 키를 검사하기 때문이다. 없는 키를 대괄호로 읽으면 \`KeyError\`가 난다. 메시지에는 찾지 못한 키가 적힌다.

\`\`\`text
config = {"lr": 0.1}
print(config["seed"])

KeyError: 'seed'
\`\`\`

없을 수도 있는 키는 \`get\`으로 읽는다. 키가 없으면 오류 대신 기본값을 돌려준다.

\`\`\`python
config = {"lr": 0.1}
print(config.get("lr"))          # 0.1
print(config.get("seed"))        # None
print(config.get("seed", 42))    # 42
\`\`\`

\`items()\`로 (키, 값) 쌍을 차례로 꺼내면 키와 값을 함께 순회할 수 있다.

\`\`\`python
config = {"lr": 0.01, "epochs": 10, "batch_size": 32}
for key, value in config.items():
    print(f"{key:>10}: {value}")
\`\`\`

\`\`\`output
        lr: 0.01
    epochs: 10
batch_size: 32
\`\`\`

딕셔너리의 대표적인 쓰임은 **개수 세기**다. \`counts.get(word, 0) + 1\`은 처음 보는 단어면 0에서, 이미 있으면 기존 횟수에서 1을 늘린다.

\`\`\`python
counts = {}
for word in "a b a c a".split():
    counts[word] = counts.get(word, 0) + 1
print(counts)        # {'a': 3, 'b': 1, 'c': 1}
\`\`\`

| 꺼낸 단어 | \`counts.get(word, 0)\` | 대입 후 \`counts\` |
| --- | --- | --- |
| \`"a"\` | 0 (처음 봄) | \`{'a': 1}\` |
| \`"b"\` | 0 (처음 봄) | \`{'a': 1, 'b': 1}\` |
| \`"a"\` | 1 | \`{'a': 2, 'b': 1}\` |
| \`"c"\` | 0 (처음 봄) | \`{'a': 2, 'b': 1, 'c': 1}\` |
| \`"a"\` | 2 | \`{'a': 3, 'b': 1, 'c': 1}\` |

같은 방법으로 문장의 단어를 센다. \`max(counts, key=counts.get)\`은 딕셔너리의 키 중에서 \`counts.get(키)\`, 즉 횟수가 가장 큰 키를 고른다.

\`\`\`python
text = "the model learns the data and the model improves"
counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1
print(counts)                        # {'the': 3, 'model': 2, 'learns': 1, 'data': 1, 'and': 1, 'improves': 1}
print(max(counts, key=counts.get))   # the
\`\`\`

딕셔너리의 키에는 바뀔 수 없는 값(문자열, 숫자, 원소가 모두 바뀔 수 없는 튜플)만 쓸 수 있다. 리스트를 키로 쓰면 \`TypeError: unhashable type: 'list'\`가 난다. 값에는 리스트·딕셔너리를 포함해 어떤 자료형이든 쓸 수 있다.

### 집합

**집합**은 순서가 없고 중복을 허용하지 않는다. 같은 값을 여러 번 넣어도 하나만 남는다. 중괄호에 값을 나열하거나 \`set()\`에 리스트·문자열을 넣어 만든다. 빈 집합은 \`set()\`으로 만든다. \`{}\`는 빈 집합이 아니라 빈 **딕셔너리**다.

\`\`\`python
tags = {"AI", "ML", "AI"}
print(len(tags))                  # 2
nums = set([3, 1, 3, 2, 1])
print(sorted(nums))               # [1, 2, 3]
print(type({}).__name__, type(set()).__name__)   # dict set
\`\`\`

\`add\`로 원소를 넣고 \`discard\`로 뺀다. 이미 있는 원소를 다시 넣어도 아무 변화가 없다. 원소가 있는지 검사하는 \`in\`이 원소 수와 관계없이 빠르다([[lesson:complexity]]).

\`\`\`python
seen = set()
seen.add("사과")
seen.add("배")
seen.add("사과")                  # 이미 있으므로 변화가 없다
print(len(seen), "배" in seen)    # 2 True
seen.discard("배")
print(sorted(seen))               # ['사과']
\`\`\`

수학의 집합 연산을 그대로 쓸 수 있다.

| 연산 | 뜻 |
| --- | --- |
| \`a \| b\` | 합집합 |
| \`a & b\` | 교집합 |
| \`a - b\` | 차집합(a에만 있는 것) |

\`\`\`python
train_words = set("the model learns the data".split())
test_words = set("the model fails on new data".split())
print(len(train_words))                   # 4
print(sorted(train_words & test_words))   # ['data', 'model', 'the']
print(sorted(test_words - train_words))   # ['fails', 'new', 'on']
print(len(train_words | test_words))      # 7
\`\`\`

\`train_words\`에서 중복된 \`the\`는 하나만 남아 원소가 4개다. 세 번째 줄처럼 평가 데이터에만 나오는 단어를 찾는 계산은 언어 모델이 학습 때 보지 못한 단어를 어떻게 다룰지 정할 때 쓴다([[lesson:tokenization]]). 집합에는 순서가 없으므로 출력 순서도 정해져 있지 않고, 인덱스로 원소를 꺼낼 수도 없다(\`TypeError: 'set' object is not subscriptable\`). 순서를 고정하려면 \`sorted()\`로 리스트를 만든다.

### 문제에 맞는 자료구조 고르기

| 다루는 데이터 | 자료구조 | 이유 |
| --- | --- | --- |
| 에폭별 손실 기록 | 리스트 | 순서가 중요하고 계속 추가한다 |
| 이미지 크기 (높이, 너비) | 튜플 | 함께 다니고 바뀌면 안 된다 |
| 하이퍼파라미터 설정 | 딕셔너리 | 이름으로 값을 찾는다 |
| 레이블 이름 → 번호 | 딕셔너리 | 이름으로 번호를 바로 찾는다 |
| 어휘(서로 다른 단어) | 집합 | 중복을 없애고 포함 여부를 빠르게 검사한다 |

컬렉션은 서로 겹쳐 쓸 수 있다. 데이터 한 건을 딕셔너리로, 여러 건을 그 딕셔너리의 리스트로 두는 형태가 가장 흔하다. JSON 파일의 구조가 이 형태다([[lesson:file-io]]). \`r["name"]\`은 리스트에서 꺼낸 딕셔너리 \`r\`에서 키 \`"name"\`의 값을 읽는다.

\`\`\`python
records = [
    {"name": "민수", "score": 88},
    {"name": "지현", "score": 95},
]
records.append({"name": "도윤", "score": 67})
for r in records:
    print(r["name"], r["score"])
print(records[1]["name"])
\`\`\`

\`\`\`output
민수 88
지현 95
도윤 67
지현
\`\`\`

:::warn 흔한 실수
- **\`{}\`를 빈 집합으로 생각한다.** \`{}\`는 빈 딕셔너리다. 빈 집합은 \`set()\`이다.
- **\`xs = xs.sort()\`로 쓴다.** \`sort()\`는 \`None\`을 돌려주므로 \`xs\`가 \`None\`이 된다. 정렬한 새 리스트가 필요하면 \`sorted(xs)\`를 쓴다.
- **없는 키를 \`d[k]\`로 읽는다.** \`KeyError\`가 난다. 없을 수 있는 키는 \`d.get(k, 기본값)\`으로 읽는다.
- **\`in\`이 딕셔너리의 값을 검사한다고 생각한다.** \`k in d\`는 키만 검사한다. 값은 \`v in d.values()\`로 검사한다.
- **집합에서 \`s[0]\`으로 원소를 꺼낸다.** 집합에는 순서가 없어 \`TypeError\`가 난다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "중복을 자동으로 없애고 \"포함 여부\"를 빠르게 검사하고 싶을 때 가장 알맞은 자료구조는?",
      choices: ["리스트", "튜플", "집합", "문자열"],
      answer: 2,
      explanation: "집합은 같은 값을 하나만 저장하고, `in` 검사가 원소 수와 관계없이 빠르다. 중복 제거와 포함 여부 검사가 주된 용도다.",
    },
    {
      key: "c2",
      question: "`nums = [3, 1, 2]` 다음에 `result = nums.sort()`를 실행하면 `result`와 `nums`는?",
      choices: ["`[1, 2, 3]`과 `[3, 1, 2]`", "`None`과 `[1, 2, 3]`", "`[1, 2, 3]`과 `[1, 2, 3]`", "`None`과 `[3, 1, 2]`"],
      answer: 1,
      explanation: "`sort()`는 리스트 자체를 정렬하고 `None`을 돌려준다. 정렬한 새 리스트를 돌려주는 것은 `sorted(nums)`다.",
    },
    {
      key: "c3",
      question: "`d = {\"a\": 1}`일 때 `d.get(\"b\", 0)`과 `d[\"b\"]`의 결과는?",
      choices: ["`0`과 `0`", "`None`과 `KeyError`", "`0`과 `KeyError`", "`KeyError`와 `KeyError`"],
      answer: 2,
      explanation: "`get`은 키가 없으면 주어진 기본값(0)을 돌려주고, 대괄호 조회는 키가 없으면 `KeyError`를 낸다.",
    },
    {
      key: "c4",
      question: "문장에 나온 단어마다 등장 횟수를 세려고 한다. 결과를 담을 자료구조로 가장 알맞은 것은?",
      choices: ["단어를 담은 리스트", "단어 → 횟수 딕셔너리", "단어를 담은 집합", "(단어, 횟수) 튜플 하나"],
      answer: 1,
      explanation: "단어(키)로 횟수(값)를 바로 찾고 고쳐야 하므로 딕셔너리가 알맞다. `counts[w] = counts.get(w, 0) + 1`로 센다.",
    },
    {
      key: "c5",
      question: "`tags = {\"AI\", \"ML\", \"AI\"}`일 때 `len(tags)`와 `type({})`는?",
      choices: ["`3`과 `set`", "`2`와 `dict`", "`2`와 `set`", "`3`과 `dict`"],
      answer: 1,
      explanation: "집합은 중복을 하나만 남기므로 원소는 2개다. 빈 중괄호 `{}`는 빈 집합이 아니라 빈 딕셔너리다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
d = {"lr": 0.1, "epochs": 10}
d["batch"] = 32
d["lr"] = 0.01
print(len(d), list(d), d.get("seed"))
`,
      expected: "3 ['lr', 'epochs', 'batch'] None",
      explanation: "\"batch\"가 추가되어 키가 3개다. 이미 있는 \"lr\"에 대입하면 순서는 그대로이고 값만 바뀐다. `list(d)`는 키의 리스트이고, 없는 키를 `get`으로 읽으면 `None`이다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "리스트·튜플·집합·딕셔너리의 차이를 순서·중복·변경 가능 여부로 설명하고, 머신러닝 코드에서 각각을 쓰는 예를 하나씩 들어라.",
      answer: md`
리스트는 순서가 있고 중복을 허용하며 바꿀 수 있다(예: 에폭별 손실 기록). 튜플은 순서가 있고 중복을 허용하지만 만든 뒤 바꿀 수 없다(예: 이미지 크기 \`(높이, 너비)\`). 집합은 순서가 없고 중복을 허용하지 않으며, 포함 여부를 빠르게 검사한다(예: 어휘, 학습 때 보지 못한 단어 찾기). 딕셔너리는 키-값 쌍을 저장해 키로 값을 바로 찾는다. 키는 중복될 수 없다(예: 하이퍼파라미터 설정, 레이블 이름 → 번호).
`,
      keyPoints: ["순서·중복·변경 가능 여부를 네 자료구조 모두에 대해 비교한다", "딕셔너리는 키로 값을 찾고, 키는 중복되지 않는다", "자료구조마다 쓰임새의 예를 든다"],
    },
  ],
  references: [
    { title: "Python 자습서 5장 — 자료 구조 (한국어)", url: "https://docs.python.org/ko/3/tutorial/datastructures.html", note: "리스트 메서드, 튜플, 집합, 딕셔너리" },
  ],
});
