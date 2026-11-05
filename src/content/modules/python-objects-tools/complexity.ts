import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/complexity";

export default defineLesson({
  id: "complexity",
  title: "기본 자료구조와 시간복잡도",
  tier: "core",
  concepts: ["data-structures-complexity"],
  goal: "연산의 실행 시간이 입력 크기에 따라 늘어나는 정도를 빅오 표기로 나타내고, 리스트·딕셔너리·집합·덱의 주요 연산 비용을 비교해 알맞은 자료구조를 고른다.",
  why: "데이터가 수백 건일 때는 어떤 방법이든 빠르지만, 수백만 건이 되면 같은 결과를 내는 코드의 실행 시간이 몇 초와 몇 시간으로 갈린다. 어휘 사전 조회([[lesson:tokenization]]), 유사한 문서 찾기([[lesson:retrieval]])처럼 큰 데이터를 반복해서 찾는 작업은 자료구조 선택이 성능을 결정한다.",
  body: md`
### 실행 시간을 입력 크기로 나타내기

코드의 빠르기는 컴퓨터마다 다르므로 초 단위가 아니라 **입력 크기 $n$이 커질 때 연산 횟수가 늘어나는 정도**로 비교한다. 이를 빅오(Big-O) 표기로 나타낸다. 상수 배와 작은 항은 무시하고, $n$이 커질 때 가장 빨리 커지는 항만 남긴다. 연산 횟수가 $3n + 5$인 코드와 $n$인 코드는 모두 $O(n)$이다.

| 표기 | 이름 | $n$이 10배가 되면 | 예 |
| --- | --- | --- | --- |
| $O(1)$ | 상수 시간 | 그대로 | 리스트 인덱스 접근, 딕셔너리 조회 |
| $O(\log n)$ | 로그 시간 | 조금 늘어난다 | 정렬된 리스트에서 이진 탐색 |
| $O(n)$ | 선형 시간 | 10배 | 리스트 전체 훑기, \`x in 리스트\` |
| $O(n \log n)$ | | 10배보다 조금 더 | \`sorted()\` |
| $O(n^2)$ | 이차 시간 | 100배 | 모든 쌍을 비교하는 중첩 반복 |

$n = 1{,}000{,}000$일 때 $O(n)$ 코드가 1초 걸린다면, 같은 일을 하는 $O(n^2)$ 코드는 백만 초(약 11.6일)가 걸린다. 데이터가 작을 때는 차이가 드러나지 않으므로, 코드를 쓸 때 반복문이 몇 겹인지, 반복문 안에서 다시 전체를 훑는 연산을 하는지 확인한다.

### 자료구조별 연산 비용

| 연산 | 리스트 | 딕셔너리·집합 |
| --- | --- | --- |
| 인덱스로 접근 \`xs[i]\` | $O(1)$ | (해당 없음) |
| 포함 여부 \`x in ...\` | $O(n)$: 앞에서부터 하나씩 비교 | $O(1)$(평균): 해시로 바로 찾음 |
| 끝에 추가 \`append\` / 추가 \`d[k] = v\`, \`s.add\` | $O(1)$ | $O(1)$(평균) |
| 맨 앞에 추가·삭제 \`insert(0, x)\`, \`pop(0)\` | $O(n)$: 나머지를 모두 한 칸씩 옮김 | (해당 없음) |
| 값으로 삭제 \`remove(x)\` | $O(n)$ | \`del d[k]\`, \`s.discard(x)\`: $O(1)$(평균) |

딕셔너리와 집합이 포함 여부를 빠르게 검사하는 이유는 **해시(hash)** 덕분이다. 키를 넣을 때 키의 해시 값(\`hash(키)\`, 키에서 계산한 정수)으로 저장 위치를 정하므로, 찾을 때도 해시 값을 계산해 그 위치만 보면 된다. 그래서 키는 해시 값이 바뀌지 않는 불변 객체여야 한다([[lesson:mutability-copy]]).

\`\`\`python
import random
import time

n = 20_000
items_list = list(range(n))
items_set = set(items_list)
rng = random.Random(0)
queries = [rng.randrange(2 * n) for _ in range(1_000)]   # 절반쯤은 없는 값

t0 = time.perf_counter()
hits_list = sum(q in items_list for q in queries)       # 질문마다 O(n)
t1 = time.perf_counter()
hits_set = sum(q in items_set for q in queries)         # 질문마다 O(1)
t2 = time.perf_counter()
print(hits_list == hits_set, f"리스트 {t1 - t0:.4f}초, 집합 {t2 - t1:.6f}초")
\`\`\`

결과는 같지만 집합이 수백~수천 배 빠르다. 정확한 배수는 컴퓨터마다 다르다.

### 스택과 큐

- **스택(stack)**: 마지막에 넣은 것을 먼저 꺼낸다. 리스트의 \`append\`와 \`pop()\`이 모두 $O(1)$이라 리스트로 충분하다. 실행 취소 기록, 계산 그래프를 거꾸로 따라가는 순서([[lesson:backprop]])에 쓴다.
- **큐(queue)**: 먼저 넣은 것을 먼저 꺼낸다. 리스트의 \`pop(0)\`은 $O(n)$이므로 \`collections.deque\`의 \`popleft()\`($O(1)$)를 쓴다. 처리할 작업 목록, 너비 우선 탐색에 쓴다.

\`\`\`python
import time
from collections import deque

stack = []
for step in ["load", "clean", "train"]:
    stack.append(step)
print(stack.pop(), stack.pop())       # train clean: 나중에 넣은 것부터

queue = deque(["job1", "job2", "job3"])
queue.append("job4")
print(queue.popleft(), list(queue))   # job1 ['job2', 'job3', 'job4']

big_list, big_deque = list(range(20_000)), deque(range(20_000))
t0 = time.perf_counter()
for _ in range(2_000):
    big_list.pop(0)                   # 매번 나머지를 한 칸씩 옮긴다
t1 = time.perf_counter()
for _ in range(2_000):
    big_deque.popleft()
t2 = time.perf_counter()
print(f"list.pop(0) {t1 - t0:.4f}초, deque.popleft() {t2 - t1:.5f}초")
\`\`\`

### 이차 시간을 선형 시간으로 바꾸기

중복이 있는지 검사할 때 모든 쌍을 비교하면 $\frac{n(n-1)}{2}$번 비교하므로 $O(n^2)$이다. 지금까지 본 값을 집합에 모아 두고, 새 값이 이미 집합에 있는지 확인하면 값마다 $O(1)$이라 전체가 $O(n)$이다. 메모리를 조금 더 써서 시간을 크게 줄이는 방법이며, 큰 데이터에서 가장 자주 쓰는 개선이다.

\`\`\`python
import time

def has_duplicate_slow(items):       # O(n^2)
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if items[i] == items[j]:
                return True
    return False

def has_duplicate(items):            # O(n)
    seen = set()
    for x in items:
        if x in seen:
            return True
        seen.add(x)
    return False

data = list(range(3_000))
t0 = time.perf_counter(); has_duplicate_slow(data); t1 = time.perf_counter()
has_duplicate(data); t2 = time.perf_counter()
print(f"O(n^2): {t1 - t0:.3f}초, O(n): {t2 - t1:.5f}초")
\`\`\`

같은 방식으로 "두 수의 합이 목표가 되는 쌍 찾기"도 모든 쌍을 보지 않고, 지금까지 본 값을 딕셔너리에 저장해 두고 \`목표 - 현재 값\`이 있는지 확인하면 $O(n)$에 풀린다. 이 레슨의 실습이다.

:::warn 흔한 실수
- **반복문 안에서 \`x in 리스트\`를 쓴다.** 바깥 반복이 $n$번이면 전체가 $O(n^2)$이다. 찾을 대상을 집합으로 바꾼다.
- **리스트를 큐로 쓴다.** \`pop(0)\`과 \`insert(0, x)\`는 $O(n)$이다. \`deque\`를 쓴다.
- **작은 데이터로만 시간을 잰다.** $n$이 작으면 $O(n^2)$ 코드도 빨라 보인다. 실제 크기에서 실행할 때 차이가 드러난다.
- **반복할 때마다 정렬한다.** \`sorted()\`는 $O(n \log n)$이다. 정렬은 한 번만 하고 결과를 다시 쓴다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "연산 횟수가 $5n^2 + 100n + 7$인 코드의 시간복잡도는?",
      choices: ["$O(n)$", "$O(n^2)$", "$O(5n^2)$", "$O(100n)$"],
      answer: 1,
      explanation: "빅오 표기는 $n$이 커질 때 가장 빨리 커지는 항만 남기고 상수 배를 버린다. $n^2$ 항이 결정하므로 $O(n^2)$이다.",
    },
    {
      key: "c2",
      question: "단어 백만 개의 목록에서 \"이 단어가 목록에 있는가\"를 수십만 번 물어야 한다. 목록을 저장할 자료구조로 가장 알맞은 것은?",
      choices: ["리스트", "집합", "튜플", "문자열 하나로 이어 붙이기"],
      answer: 1,
      explanation: "집합의 포함 여부 검사는 평균 $O(1)$이고, 리스트·튜플·문자열은 앞에서부터 비교하므로 $O(n)$이다. 질문 수가 많을수록 차이가 커진다.",
    },
    {
      key: "c3",
      question: "작업을 먼저 들어온 순서대로 처리하는 큐를 만들 때 리스트의 `pop(0)` 대신 `collections.deque`의 `popleft()`를 쓰는 이유는?",
      choices: [
        "`pop(0)`은 나머지 원소를 모두 한 칸씩 옮겨 $O(n)$이지만 `popleft()`는 $O(1)$이다",
        "`pop(0)`은 마지막 원소를 꺼내기 때문이다",
        "deque는 원소를 정렬해 저장하기 때문이다",
        "리스트는 원소를 꺼낼 수 없기 때문이다",
      ],
      answer: 0,
      explanation: "리스트는 원소를 연속된 자리에 저장하므로 맨 앞을 빼면 뒤의 원소를 모두 옮겨야 한다. deque는 양 끝에서 넣고 빼는 연산이 $O(1)$이 되도록 만든 자료구조다.",
    },
    {
      key: "c4",
      question: "`for x in a:` 안에서 `if x in b:`를 검사하는 코드가 있다. `a`와 `b`가 모두 길이 $n$인 리스트일 때 시간복잡도와 개선 방법은?",
      choices: [
        "$O(n)$, 개선할 필요가 없다",
        "$O(n^2)$, `b`를 반복 전에 집합으로 바꾸면 $O(n)$이 된다",
        "$O(\\log n)$, `b`를 정렬하면 된다",
        "$O(n^2)$, `a`를 튜플로 바꾸면 $O(n)$이 된다",
      ],
      answer: 1,
      explanation: "바깥 반복 $n$번마다 리스트 `b`를 훑는 $O(n)$ 검사를 하므로 $O(n^2)$이다. `b_set = set(b)`를 한 번 만들면(O(n)) 검사가 $O(1)$이 되어 전체가 $O(n)$이다.",
    },
    {
      key: "c5",
      question: "딕셔너리의 키로 리스트를 쓸 수 없는 이유와 가장 관련 있는 것은?",
      choices: [
        "리스트는 순서가 있기 때문이다",
        "딕셔너리는 키의 해시 값으로 저장 위치를 정하는데, 리스트는 내용이 바뀔 수 있어 해시 값을 정할 수 없기 때문이다",
        "리스트는 크기가 너무 크기 때문이다",
        "딕셔너리는 숫자 키만 받기 때문이다",
      ],
      answer: 1,
      explanation: "키의 해시 값이 저장 위치를 정한다. 넣은 뒤 키의 내용이 바뀌면 해시 값도 바뀌어 다시 찾을 수 없으므로, 키는 불변 객체(문자열, 숫자, 튜플)만 쓸 수 있다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
from collections import deque
q = deque([1, 2, 3])
q.append(4)
q.appendleft(0)
first = q.popleft()
last = q.pop()
print(first, last, list(q))
`,
      expected: "0 4 [1, 2, 3]",
      explanation: "`appendleft(0)`으로 맨 앞에 0을 넣으면 `[0, 1, 2, 3, 4]`다. `popleft()`는 맨 앞의 0을, `pop()`은 맨 뒤의 4를 꺼낸다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "리스트 `a`와 `b`(각각 길이 $n$)에 공통으로 들어 있는 값을 찾는 두 가지 방법(중첩 반복, 집합 이용)의 시간복잡도를 비교하고, 집합을 쓰는 방법의 대가를 함께 설명하라.",
      answer: md`
중첩 반복(\`for x in a\` 안에서 \`x in b\`)은 \`a\`의 원소마다 \`b\`를 처음부터 훑으므로 $O(n^2)$이다. \`b\`를 집합으로 한 번 바꾸면($O(n)$) 이후의 포함 여부 검사가 평균 $O(1)$이라 전체가 $O(n)$이다. \`set(a) & set(b)\`도 $O(n)$이다. 대가는 집합을 저장할 추가 메모리($O(n)$)가 필요하고 원래 순서와 중복 정보가 사라진다는 것이다. 순서가 필요하면 \`[x for x in a if x in b_set]\`처럼 \`a\`의 순서를 따라 고른다.
`,
      keyPoints: ["중첩 반복은 $O(n^2)$, 집합을 쓰면 $O(n)$", "집합의 포함 여부 검사는 해시로 평균 $O(1)$", "대가: 추가 메모리, 순서·중복 정보 손실"],
    },
  ],
  references: [
    { title: "Python Wiki — TimeComplexity", url: "https://wiki.python.org/moin/TimeComplexity", note: "리스트·deque·dict·set 연산의 시간복잡도 표 (영문)" },
    { title: "Python 표준 라이브러리 — collections.deque (한국어)", url: "https://docs.python.org/ko/3/library/collections.html#collections.deque", note: "양 끝에서 O(1)로 넣고 빼는 큐" },
  ],
});
