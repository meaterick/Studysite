import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/loops";

export default defineLesson({
  id: "loops",
  title: "반복문과 반복 제어",
  tier: "core",
  concepts: ["loops"],
  goal: "for와 while 반복문으로 누적·탐색·조건부 종료를 구현하고, range와 break·continue로 반복 횟수와 종료 시점을 제어한다.",
  why: "모델 학습은 같은 계산을 정해진 횟수만큼, 또는 조건을 만족할 때까지 반복하는 일이다. 데이터를 여러 번 훑는 학습 루프([[lesson:gradient-descent]])와 손실이 더 줄지 않으면 멈추는 조기 종료가 모두 이 레슨의 반복문과 종료 조건으로 작성된다.",
  body: md`
### for 반복문과 range

\`for 변수 in 반복 가능한 값:\`은 값에서 원소를 하나씩 꺼내 변수에 넣고 블록을 실행한다. 리스트, 문자열, \`range\`처럼 원소를 차례로 꺼낼 수 있는 값을 **반복 가능한(iterable)** 값이라고 한다.

\`range\`는 정수의 범위를 만든다.

| 식 | 만드는 수 |
| --- | --- |
| \`range(5)\` | 0, 1, 2, 3, 4 |
| \`range(1, 5)\` | 1, 2, 3, 4 |
| \`range(0, 10, 3)\` | 0, 3, 6, 9 |
| \`range(5, 0, -1)\` | 5, 4, 3, 2, 1 |

끝 값은 **포함하지 않는다.** \`range(1, 5)\`에 5는 없다. 이 규칙은 슬라이싱 \`[1:5]\`에도 똑같이 적용된다([[lesson:indexing-slicing]]). \`range(1, n + 1)\`은 1부터 n까지다.

\`\`\`python
for i in range(1, 6):
    print(i, i ** 2)

for ch in "AI":
    print(ch)

print(list(range(0, 10, 3)))   # range를 리스트로 바꿔 내용을 확인한다
\`\`\`

### 누적: 합계, 개수, 최댓값

반복문의 가장 흔한 형태는 반복 전에 결과를 담을 변수를 만들고, 반복할 때마다 그 값을 고치는 것이다.

\`\`\`python
scores = [72, 95, 88, 61, 79]

total = 0                 # 합계는 0에서 시작한다
count_high = 0            # 개수도 0에서 시작한다
best = scores[0]          # 최댓값은 첫 원소에서 시작한다(0에서 시작하면 음수만 있을 때 틀린다)
for s in scores:
    total += s
    if s >= 80:
        count_high += 1
    if s > best:
        best = s
print(total, total / len(scores), count_high, best)   # 395 79.0 2 95
\`\`\`

최댓값의 시작 값을 0으로 두면 모든 값이 음수일 때 0이라는 틀린 답이 나온다. 첫 원소나 \`float("-inf")\`(어떤 수보다 작은 값)에서 시작한다. 이 계산은 내장 함수 \`sum()\`, \`max()\`, \`len()\`으로도 할 수 있지만, 조건이 섞인 누적은 반복문으로 직접 쓰는 경우가 많다.

### while 반복문

\`while 조건:\`은 조건이 참인 동안 블록을 반복한다. 반복 횟수를 미리 알 수 없고 **종료 조건**만 알 때 쓴다. 블록 안에서 조건에 쓰인 값을 바꾸지 않으면 조건이 계속 참이라 반복이 끝나지 않는다(무한 루프). 브라우저 셀이 멈추면 실행 중지 버튼을 누른다.

\`\`\`python
# 1부터 차례로 더해 합이 처음으로 100을 넘을 때
total, i = 0, 1
while total <= 100:
    total += i
    i += 1            # 이 줄이 없으면 total이 계속 같은 값을 더해 끝나지 않는다
print(total, i - 1)   # 105 14: 1 + 2 + ... + 14 = 105
\`\`\`

### break와 continue

- \`break\`: 반복을 즉시 끝낸다. 찾던 값을 찾았거나 더 계산할 필요가 없을 때 쓴다.
- \`continue\`: 이번 반복의 나머지를 건너뛰고 다음 반복으로 넘어간다. 처리하지 않을 값을 거를 때 쓴다.

\`\`\`python
readings = [3.2, -1.0, 4.8, 99.9, 5.1]   # -1.0은 측정 실패, 99.9 이후는 장비 오류
valid = []
for r in readings:
    if r < 0:
        continue          # 측정 실패는 건너뛴다
    if r > 50:
        break             # 장비 오류가 나오면 이후 값은 쓰지 않는다
    valid.append(r)       # 리스트 끝에 추가한다
print(valid)              # [3.2, 4.8]
\`\`\`

\`for\`나 \`while\`에 \`else\`를 붙이면, 반복이 \`break\` 없이 끝까지 돌았을 때만 \`else\` 블록이 실행된다. "끝까지 찾았지만 없었다"를 처리할 때 쓴다.

### 중첩 반복

반복문 안에 반복문을 넣으면 바깥 반복 한 번마다 안쪽 반복 전체가 실행된다. 바깥이 $n$번, 안쪽이 $m$번이면 블록은 $n \times m$번 실행된다. 데이터가 커지면 실행 시간이 빠르게 늘어나는 이유다([[lesson:complexity]]).

\`\`\`python
for row in range(1, 4):
    line = ""
    for col in range(1, 4):
        line += f"{row * col:4}"
    print(line)
\`\`\`

### 학습 루프의 형태

모델 학습 코드는 대개 다음 형태다. 정해진 최대 횟수만큼 반복하면서 파라미터를 갱신하고, 충분히 수렴하면 일찍 멈춘다. 아래 코드는 손실 $(w - 3)^2$이 가장 작아지는 $w$를 찾는다. 갱신 규칙이 왜 이런 모양인지는 [[lesson:gradient-descent]]에서 다룬다. 여기서는 반복과 종료 조건의 구조만 본다.

\`\`\`python
w, lr = 0.0, 0.1
for epoch in range(1, 101):        # 최대 100번 반복
    grad = 2 * (w - 3)             # 손실이 줄어드는 방향을 알려 주는 값
    w -= lr * grad                 # 파라미터 갱신
    if abs(grad) < 1e-3:           # 충분히 작아지면 멈춘다(조기 종료)
        print(f"{epoch}번째 반복에서 멈춤: w = {w:.4f}")
        break
else:
    print("100번 안에 수렴하지 않았다")
\`\`\`

출력은 \`40번째 반복에서 멈춤: w = 2.9996\`이다. 100번을 다 돌지 않고 40번째에서 끝났다. 학습률 \`lr\`을 바꾸면 멈추는 시점이 달라진다.

:::warn 흔한 실수
- **끝 값을 포함한다고 생각한다.** \`range(1, 10)\`에 10은 없다.
- **while 조건에 쓰인 값을 갱신하지 않는다.** 무한 루프가 된다.
- **최댓값을 0에서 시작한다.** 음수만 있는 데이터에서 틀린다.
- **반복 중에 같은 리스트에서 원소를 지운다.** 원소가 건너뛰어진다. 남길 원소를 새 리스트에 모은다([[lesson:comprehensions-iterators]]).
:::
`,
  checks: [
    {
      key: "c1",
      question: "`print(list(range(1, 5)))`의 출력은?",
      choices: ["`[1, 2, 3, 4]`", "`[1, 2, 3, 4, 5]`", "`[0, 1, 2, 3, 4]`", "`[2, 3, 4, 5]`"],
      answer: 0,
      explanation: "`range(시작, 끝)`은 시작부터 끝 **직전**까지 만든다. 슬라이싱에서 끝 인덱스가 빠지는 것과 같은 규칙이다.",
    },
    {
      key: "c2",
      question: "`i = 1` 다음에 `while i < 20: i *= 3`을 실행하면 반복이 끝난 뒤 `i`의 값은?",
      choices: ["9", "20", "27", "81"],
      answer: 2,
      explanation: "i는 1 → 3 → 9 → 27로 바뀐다. 27이 되면 `i < 20`이 거짓이라 반복이 끝난다. 조건은 블록을 실행하기 전에 검사한다.",
    },
    {
      key: "c3",
      question: "다음 코드의 출력은?\n\n```python\nfor x in [1, 2, 3, 4, 5]:\n    if x == 2:\n        continue\n    if x == 4:\n        break\n    print(x)\n```",
      choices: ["`1 3`(한 줄에 하나씩)", "`1 3 5`(한 줄에 하나씩)", "`1 2 3`(한 줄에 하나씩)", "`1`"],
      answer: 0,
      explanation: "x가 2일 때는 `continue`로 출력을 건너뛰고, 4일 때 `break`로 반복이 끝난다. 그래서 1과 3만 출력된다.",
    },
    {
      key: "c4",
      question: "모든 값이 음수인 리스트에서 최댓값을 구하는 반복문의 시작 값으로 알맞은 것은?",
      choices: ["`best = 0`", "`best = values[0]`", "`best = None` 다음 `best > v`로 비교", "`best = len(values)`"],
      answer: 1,
      explanation: "0에서 시작하면 어떤 음수도 0보다 크지 않아 답이 0이 된다. 첫 원소에서 시작하거나 `float(\"-inf\")`에서 시작해야 한다.",
    },
    {
      key: "c5",
      question: "바깥 반복이 100번, 그 안의 반복이 50번인 중첩 반복문에서 안쪽 블록은 모두 몇 번 실행되는가?",
      choices: ["150", "5,000", "100", "50"],
      answer: 1,
      explanation: "바깥 반복 한 번마다 안쪽 반복 50번이 모두 실행되므로 $100 \\times 50 = 5000$번이다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
total = 0
for i in range(1, 6):
    if i % 2 == 0:
        continue
    total += i
print(total, i)
`,
      expected: "9 5",
      explanation: "짝수(2, 4)는 건너뛰고 1 + 3 + 5 = 9를 더한다. 반복이 끝난 뒤에도 변수 `i`는 마지막 값 5를 가리킨다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "for 반복문과 while 반복문을 각각 어떤 상황에 쓰는지 설명하고, 학습 루프에서 두 방식을 함께 쓰는 예(최대 반복 횟수와 조기 종료)를 들어라.",
      answer: md`
for는 반복할 대상(리스트의 원소, \`range\`의 정수)이나 반복 횟수를 미리 알 때 쓰고, while은 반복 횟수는 모르고 종료 조건만 알 때 쓴다. 학습 루프는 보통 \`for epoch in range(최대 횟수):\`로 반복 횟수의 상한을 정하고, 블록 안에서 손실의 변화가 충분히 작아지면 \`break\`로 일찍 멈춘다. 이렇게 하면 수렴하지 않을 때도 반복이 끝나는 것이 보장되고, 수렴하면 불필요한 계산을 하지 않는다.
`,
      keyPoints: ["for: 대상이나 횟수를 알 때, while: 종료 조건만 알 때", "최대 반복 횟수로 끝나는 것을 보장한다", "조건을 만족하면 `break`로 일찍 멈춘다"],
    },
  ],
  references: [
    { title: "Python 자습서 4.2~4.5 — for 문, range, break와 continue (한국어)", url: "https://docs.python.org/ko/3/tutorial/controlflow.html#for-statements", note: "반복문의 기본 형태와 else 절" },
  ],
});
