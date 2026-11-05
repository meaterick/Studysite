import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "원본을 바꾸지 않는 함수",
    prompt: md`

시작 코드의 두 함수는 모두 호출한 쪽의 객체를 바꾸는 문제가 있습니다. 결과는 그대로 두고 원본을 보호하도록 고칩니다.

1. \`min_max_scale(values)\`: 값을 \`(v - 최솟값) / (최댓값 - 최솟값)\`으로 바꾼 **새 리스트**를 돌려줍니다. 입력 리스트는 바꾸지 않습니다. 값이 모두 같으면(최댓값 = 최솟값) 모든 원소를 \`0.0\`으로 둡니다.
2. \`add_tag(tag, tags)\`: \`tags\`가 주어지면 그 리스트 끝에 \`tag\`를 추가해 돌려주고, 주어지지 않으면 \`[tag]\`인 새 리스트를 돌려줍니다. 기본값으로 빈 리스트를 쓰지 않습니다.
`,
    starter: py`
def min_max_scale(values):
    """[0, 1]로 바꾼 새 리스트. 입력은 바꾸지 않는다."""
    lo, hi = min(values), max(values)
    for i in range(len(values)):
        values[i] = (values[i] - lo) / (hi - lo)   # TODO: 원본을 고치지 말고 새 리스트를 만듭니다. 값이 모두 같을 때도 처리합니다.
    return values

def add_tag(tag, tags=[]):    # TODO: 기본값을 None으로 바꾸고, None이면 함수 안에서 새 리스트를 만듭니다.
    tags.append(tag)
    return tags

raw = [10, 20, 40]
print(min_max_scale(raw), raw)
print(add_tag("a"), add_tag("b"))
`,
    tests: py`
@test("min_max_scale: 결과가 맞다")
def _():
    got = min_max_scale([10, 20, 40])
    assert approx(got, [0.0, 1 / 3, 1.0]), f"결과: {got}"

@test("min_max_scale: 입력 리스트는 그대로다")
def _():
    raw = [10, 20, 40]
    result = min_max_scale(raw)
    assert raw == [10, 20, 40], f"입력이 바뀌었습니다: {raw}"
    assert result is not raw, "입력 리스트를 그대로 돌려주고 있습니다."

@test("min_max_scale: 값이 모두 같으면 0.0으로 채운다")
def _():
    assert min_max_scale([5, 5, 5]) == [0.0, 0.0, 0.0]

@test("add_tag: 호출마다 새 리스트(호출 사이에 값이 남지 않는다)")
def _():
    first = add_tag("a")
    second = add_tag("b")
    assert first == ["a"] and second == ["b"], f"결과: {first}, {second}"

@test("add_tag: 리스트를 주면 그 리스트에 추가한다")
def _():
    tags = ["x"]
    assert add_tag("y", tags) == ["x", "y"] and tags == ["x", "y"]
`,
    hints: [
      "`scaled = []`를 만들고 반복문에서 `scaled.append((v - lo) / (hi - lo))`로 채운 뒤 `scaled`를 돌려줍니다.",
      "`if hi == lo: return [0.0] * len(values)`를 먼저 두면 0으로 나누는 오류를 피합니다.",
      "`def add_tag(tag, tags=None):` 다음 `if tags is None: tags = []`로 호출할 때마다 새 리스트를 만듭니다.",
    ],
    solution: py`
def min_max_scale(values):
    lo, hi = min(values), max(values)
    if hi == lo:
        return [0.0] * len(values)
    scaled = []
    for v in values:
        scaled.append((v - lo) / (hi - lo))
    return scaled

def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags

raw = [10, 20, 40]
print(min_max_scale(raw), raw)
print(add_tag("a"), add_tag("b"))
`,
  },
]);
