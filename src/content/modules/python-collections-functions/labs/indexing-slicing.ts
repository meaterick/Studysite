import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "데이터 분할과 구간 자르기",
    prompt: md`

세 함수를 완성합니다.

1. \`split_by_ratio(items, ratio)\`: 앞쪽 \`int(len(items) * ratio)\`개는 학습용, 나머지는 평가용으로 나눈 \`(학습용, 평가용)\`을 돌려줍니다.
2. \`windows(seq, k)\`: 길이 \`k\`인 연속 구간을 모두 담은 리스트를 돌려줍니다. \`seq\`가 \`k\`보다 짧으면 빈 리스트입니다.
3. \`last_n(seq, n)\`: 마지막 \`n\`개를 돌려줍니다. \`n\`이 0이면 빈 리스트여야 합니다. 시작 코드의 \`seq[-n:]\`은 \`n\`이 0일 때 전체를 돌려줍니다.
`,
    starter: py`
def split_by_ratio(items, ratio):
    """(앞쪽 ratio 비율, 나머지)"""
    k = int(len(items) * ratio)
    return items, []          # TODO: 위치 k에서 나눈 두 부분을 돌려줍니다.

def windows(seq, k):
    """길이 k인 연속 구간의 리스트"""
    result = []
    # TODO: 시작 위치 i를 0부터 len(seq) - k까지 바꾸며 seq[i:i + k]를 result에 추가합니다.
    return result

def last_n(seq, n):
    """마지막 n개(n이 0이면 빈 리스트)"""
    return seq[-n:]           # TODO: n이 0일 때도 맞도록 고칩니다.

print(split_by_ratio(list(range(10)), 0.8))
print(windows([1, 2, 3, 4], 2))
print(last_n([1, 2, 3], 2), last_n([1, 2, 3], 0))
`,
    tests: py`
@test("split_by_ratio: 10건을 0.8로 → 8건과 2건")
def _():
    train, test = split_by_ratio(list(range(10)), 0.8)
    assert train == list(range(8)) and test == [8, 9], f"결과: {train}, {test}"

@test("split_by_ratio: 비율이 나누어떨어지지 않아도 빠지는 원소가 없다")
def _():
    items = list(range(7))
    train, test = split_by_ratio(items, 0.75)
    assert len(train) == 5 and train + test == items, f"결과: {train}, {test}"

@test("windows: 길이 2의 구간 3개")
def _():
    got = windows([1, 2, 3, 4], 2)
    assert got == [[1, 2], [2, 3], [3, 4]], f"결과: {got}"

@test("windows: 시퀀스가 k보다 짧으면 빈 리스트, 같으면 구간 하나")
def _():
    assert windows([1, 2], 3) == []
    assert windows([1, 2, 3], 3) == [[1, 2, 3]]

@test("last_n: n이 0이면 빈 리스트")
def _():
    assert last_n([1, 2, 3], 2) == [2, 3]
    assert last_n([1, 2, 3], 0) == [], f"last_n([1, 2, 3], 0) = {last_n([1, 2, 3], 0)}"
`,
    hints: [
      "`items[:k], items[k:]`는 겹치거나 빠지는 원소 없이 전체를 나눕니다.",
      "시작 위치는 `range(len(seq) - k + 1)`입니다. `seq`가 `k`보다 짧으면 이 범위가 비어 반복하지 않습니다.",
      "`seq[len(seq) - n:]`는 n이 0일 때 `seq[len(seq):]`, 즉 빈 리스트입니다.",
    ],
    solution: py`
def split_by_ratio(items, ratio):
    k = int(len(items) * ratio)
    return items[:k], items[k:]

def windows(seq, k):
    result = []
    for i in range(len(seq) - k + 1):
        result.append(seq[i:i + k])
    return result

def last_n(seq, n):
    return seq[len(seq) - n:]

print(split_by_ratio(list(range(10)), 0.8))
print(windows([1, 2, 3, 4], 2))
print(last_n([1, 2, 3], 2), last_n([1, 2, 3], 0))
`,
  },
]);
