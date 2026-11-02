import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "중복 검사와 두 수의 합을 선형 시간에",
    prompt: md`

두 함수를 $O(n)$으로 완성합니다. 채점은 결과가 맞는지와 함께, 원소끼리 \`==\`로 비교한 횟수를 세어 모든 쌍을 비교하지 않는지 확인합니다.

1. \`has_duplicate(items)\`: 같은 값이 두 번 이상 있으면 \`True\`를 돌려줍니다. 지금까지 본 값을 집합에 모아 확인합니다.
2. \`two_sum(nums, target)\`: 합이 \`target\`인 두 원소의 인덱스 \`(i, j)\`(\`i < j\`)를 돌려줍니다. 그런 쌍이 여러 개면 \`j\`가 가장 작은 쌍을, 없으면 \`None\`을 돌려줍니다. 지금까지 본 값 → 인덱스를 딕셔너리에 저장해 두고, \`target - 현재 값\`이 이미 있는지 확인합니다.
`,
    starter: py`
def has_duplicate(items):
    """같은 값이 두 번 이상 있는가(O(n))"""
    for i in range(len(items)):              # TODO: 모든 쌍을 비교하는 O(n^2) 방법을 집합을 쓰는 O(n) 방법으로 바꿉니다.
        for j in range(i + 1, len(items)):
            if items[i] == items[j]:
                return True
    return False

def two_sum(nums, target):
    """합이 target인 (i, j), i < j. 없으면 None(O(n))"""
    seen = {}                                # 값 → 그 값이 나온 인덱스
    for j, x in enumerate(nums):
        pass   # TODO: target - x가 seen에 있으면 (seen[target - x], j)를 돌려주고, 아니면 seen[x] = j로 기록합니다.
    return None

print(has_duplicate([3, 1, 4, 1, 5]), has_duplicate([1, 2, 3]))
print(two_sum([2, 7, 11, 15], 9), two_sum([1, 2, 3], 100))
`,
    tests: py`
class Tracked:
    """==로 비교한 횟수를 센다"""
    eq_calls = 0
    def __init__(self, v):
        self.v = v
    def __eq__(self, other):
        Tracked.eq_calls += 1
        return isinstance(other, Tracked) and self.v == other.v
    def __hash__(self):
        return hash(self.v)

@test("has_duplicate: 결과가 맞다")
def _():
    assert has_duplicate([3, 1, 4, 1, 5]) is True
    assert has_duplicate([1, 2, 3]) is False
    assert has_duplicate([]) is False

@test("has_duplicate: 모든 쌍을 비교하지 않는다(500개에서 == 비교 100번 이하)")
def _():
    Tracked.eq_calls = 0
    items = [Tracked(i) for i in range(500)]
    assert has_duplicate(items) is False
    assert Tracked.eq_calls <= 100, f"== 비교 {Tracked.eq_calls}번: 모든 쌍을 비교하는 O(n^2) 방법입니다."

@test("two_sum: 합이 target인 인덱스 쌍")
def _():
    assert two_sum([2, 7, 11, 15], 9) == (0, 1), f"결과: {two_sum([2, 7, 11, 15], 9)}"
    assert two_sum([3, 2, 4], 6) == (1, 2), f"결과: {two_sum([3, 2, 4], 6)}"

@test("two_sum: 같은 값 두 개, 없는 경우")
def _():
    assert two_sum([3, 3], 6) == (0, 1)
    assert two_sum([1, 2, 3], 100) is None

@test("two_sum: 큰 입력도 빠르게(10만 개)")
def _():
    nums = list(range(100_000))
    assert two_sum(nums, 199_997) == (99_998, 99_999)
`,
    hints: [
      "`seen = set()`을 만들고, `for x in items:` 안에서 `if x in seen: return True` 다음 `seen.add(x)`를 씁니다.",
      "`two_sum`에서 현재 값 `x`와 짝이 되는 값은 `target - x`입니다. 그 값이 `seen`에 있으면 그때의 인덱스와 `j`가 답입니다.",
      "짝을 먼저 확인한 뒤에 `seen[x] = j`로 기록해야 같은 원소를 두 번 쓰지 않습니다(`[3, 3]`과 6을 확인해 보십시오).",
    ],
    solution: py`
def has_duplicate(items):
    seen = set()
    for x in items:
        if x in seen:
            return True
        seen.add(x)
    return False

def two_sum(nums, target):
    seen = {}
    for j, x in enumerate(nums):
        if target - x in seen:
            return seen[target - x], j
        seen[x] = j
    return None

print(has_duplicate([3, 1, 4, 1, 5]), has_duplicate([1, 2, 3]))
print(two_sum([2, 7, 11, 15], 9), two_sum([1, 2, 3], 100))
`,
  },
]);
