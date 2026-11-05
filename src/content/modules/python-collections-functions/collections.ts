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
### 네 가지 컬렉션

여러 값을 하나로 묶어 다루는 자료형을 컬렉션(collection)이라고 한다. 파이썬의 기본 컬렉션은 네 가지다.

| 자료구조 | 만드는 법 | 순서 | 중복 | 변경 | 주로 쓰는 곳 |
| --- | --- | --- | --- | --- | --- |
| 리스트 \`list\` | \`[1, 2, 2]\` | 있음 | 허용 | 가능 | 순서가 있는 값의 목록, 계속 추가할 때 |
| 튜플 \`tuple\` | \`(37.5, 127.0)\` | 있음 | 허용 | 불가 | 바뀌면 안 되는 묶음, 함수의 여러 반환값 |
| 딕셔너리 \`dict\` | \`{"lr": 0.1}\` | 넣은 순서 유지 | 키는 불허 | 가능 | 이름(키)으로 값을 찾을 때 |
| 집합 \`set\` | \`{"AI", "ML"}\` | 없음 | 불허 | 가능 | 중복 제거, 포함 여부 검사 |

네 자료구조 모두 \`len()\`으로 원소 수를 세고, \`in\`으로 포함 여부를 검사하고, \`for\`로 순회한다.

### 리스트

리스트는 순서가 있는 값의 목록이다. 만든 뒤에도 원소를 추가·변경·삭제할 수 있다.

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

\`\`\`python
losses = [0.92, 0.71]
losses.append(0.55)
losses.extend([0.48, 0.47])
print(losses, len(losses))          # [0.92, 0.71, 0.55, 0.48, 0.47] 5
print(losses.pop(), losses)         # 0.47 [0.92, 0.71, 0.55, 0.48]

nums = [3, 1, 2]
print(sorted(nums), nums)           # [1, 2, 3] [3, 1, 2]: 원래 리스트는 그대로
nums.sort(reverse=True)             # 리스트 자체를 큰 것부터 정렬
print(nums)                         # [3, 2, 1]
\`\`\`

### 튜플

튜플은 만든 뒤 원소를 바꿀 수 없는 리스트다. 위도·경도, 이미지의 (높이, 너비)처럼 함께 다니고 바뀌면 안 되는 값의 묶음에 쓴다. 괄호 없이 쉼표로만 써도 튜플이 되며, 여러 이름에 나눠 대입할 수 있다. 이를 **언패킹(unpacking)**이라고 한다. 함수가 값을 여러 개 돌려줄 때도 튜플로 돌려준다([[lesson:functions-scope]]).

\`\`\`python
shape = (28, 28)            # 이미지의 높이와 너비
height, width = shape       # 언패킹
print(height * width)       # 784

point = 37.5, 127.0         # 괄호가 없어도 튜플
print(type(point), point[0])
single = (5,)               # 원소가 하나인 튜플은 쉼표가 필요하다. (5)는 그냥 정수 5다
\`\`\`

### 딕셔너리

딕셔너리는 **키(key)**와 **값(value)**의 쌍을 저장하고, 키로 값을 바로 찾는다. 키는 중복될 수 없고, 같은 키에 다시 대입하면 값이 바뀐다. 파이썬 3.7부터 딕셔너리는 키를 넣은 순서를 유지한다.

| 식 | 하는 일 |
| --- | --- |
| \`d[k]\` | 키 k의 값. 키가 없으면 \`KeyError\` |
| \`d.get(k, 기본값)\` | 키 k의 값. 키가 없으면 기본값(생략하면 \`None\`) |
| \`d[k] = v\` | 추가하거나 값을 바꾼다 |
| \`del d[k]\`, \`d.pop(k)\` | 키 k를 지운다 |
| \`k in d\` | 키가 있는지 검사(값이 아니라 **키**를 검사한다) |
| \`d.keys()\`, \`d.values()\`, \`d.items()\` | 키들, 값들, (키, 값) 쌍들 |

\`\`\`python
config = {"lr": 0.1, "epochs": 10}
config["batch_size"] = 32           # 추가
config["lr"] = 0.01                 # 같은 키에 대입하면 값이 바뀐다
print(config.get("seed", 42))       # 없는 키: 기본값 42
for key, value in config.items():
    print(f"{key:>10}: {value}")
\`\`\`

딕셔너리의 대표적인 쓰임은 **개수 세기**다. \`counts.get(word, 0) + 1\`은 처음 보는 단어면 0에서, 이미 있으면 기존 횟수에서 1을 늘린다.

\`\`\`python
text = "the model learns the data and the model improves"
counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1
print(counts)
print(max(counts, key=counts.get))   # 가장 많이 나온 단어: the
\`\`\`

딕셔너리의 키에는 바뀔 수 없는 값(문자열, 숫자, 튜플)만 쓸 수 있다. 리스트를 키로 쓰면 \`TypeError: unhashable type: 'list'\`가 난다. 값에는 어떤 자료형이든 쓸 수 있다.

### 집합

집합은 순서가 없고 중복을 허용하지 않는다. 같은 값을 여러 번 넣어도 하나만 남는다. 원소가 있는지 검사하는 \`in\`이 원소 수와 관계없이 빠르다([[lesson:complexity]]). 수학의 집합 연산을 그대로 쓸 수 있다.

| 연산 | 뜻 |
| --- | --- |
| \`a \| b\` | 합집합 |
| \`a & b\` | 교집합 |
| \`a - b\` | 차집합(a에만 있는 것) |

\`\`\`python
train_words = set("the model learns the data".split())
test_words = set("the model fails on new data".split())
print(len(train_words))                # 4: 중복된 the는 하나만 남는다
print(sorted(train_words & test_words))   # 둘 다 있는 단어
print(sorted(test_words - train_words))   # 평가 데이터에만 있는 단어: 학습 때 못 본 단어
\`\`\`

마지막 줄처럼 평가 데이터에만 나오는 단어를 찾는 계산은 언어 모델이 학습 때 보지 못한 단어를 어떻게 다룰지 정할 때 쓴다([[lesson:tokenization]]). 집합에는 순서가 없으므로 인덱스로 원소를 꺼낼 수 없다. 출력 순서를 고정하려면 \`sorted()\`로 리스트를 만든다.

### 문제에 맞는 자료구조 고르기

| 다루는 데이터 | 자료구조 | 이유 |
| --- | --- | --- |
| 에폭별 손실 기록 | 리스트 | 순서가 중요하고 계속 추가한다 |
| 이미지 크기 (높이, 너비) | 튜플 | 함께 다니고 바뀌면 안 된다 |
| 하이퍼파라미터 설정 | 딕셔너리 | 이름으로 값을 찾는다 |
| 레이블 이름 → 번호 | 딕셔너리 | 이름으로 번호를 바로 찾는다 |
| 어휘(서로 다른 단어) | 집합 | 중복을 없애고 포함 여부를 빠르게 검사한다 |

컬렉션은 서로 겹쳐 쓸 수 있다. 데이터 한 건을 딕셔너리로, 여러 건을 그 딕셔너리의 리스트로 두는 형태가 가장 흔하다. JSON 파일의 구조가 이 형태다([[lesson:file-io]]).

\`\`\`python
records = [
    {"name": "민수", "score": 88},
    {"name": "지현", "score": 95},
]
records.append({"name": "도윤", "score": 67})
for r in records:
    print(r["name"], r["score"])
\`\`\`

:::warn 흔한 실수
- **\`{}\`를 빈 집합으로 생각한다.** \`{}\`는 빈 딕셔너리다. 빈 집합은 \`set()\`이다.
- **\`xs = xs.sort()\`로 쓴다.** \`sort()\`는 \`None\`을 돌려주므로 \`xs\`가 \`None\`이 된다. 정렬한 새 리스트가 필요하면 \`sorted(xs)\`를 쓴다.
- **없는 키를 \`d[k]\`로 읽는다.** \`KeyError\`가 난다. 없을 수 있는 키는 \`d.get(k, 기본값)\`으로 읽는다.
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
