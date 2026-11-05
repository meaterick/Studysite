import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "중첩 리스트의 모양, 전치, 펼치기",
    prompt: md`

NumPy 없이 세 함수를 완성합니다.

1. \`shape_of(x)\`: 중첩 리스트의 모양을 튜플로 돌려줍니다. 수 하나면 \`()\`, \`[1, 2, 3]\`이면 \`(3,)\`, \`[[1, 2, 3], [4, 5, 6]]\`이면 \`(2, 3)\`입니다. 같은 층의 리스트 길이가 서로 다르면(직사각형이 아니면) \`ValueError\`를 일으킵니다.
2. \`transpose(M)\`: 리스트로 된 $m \times n$ 행렬의 전치($n \times m$)를 돌려줍니다.
3. \`flatten_shape(shape)\`: 배치 축(첫 축)은 그대로 두고 나머지 축을 하나로 펼친 모양을 돌려줍니다. \`(64, 32, 32, 3)\`은 \`(64, 3072)\`입니다.
`,
    starter: py`
def shape_of(x):
    """중첩 리스트의 모양. 직사각형이 아니면 ValueError"""
    if not isinstance(x, list):
        return ()
    inner = [shape_of(item) for item in x]       # 원소마다 모양을 구한다
    # TODO: inner의 모양이 모두 같지 않으면 ValueError를 일으킵니다.
    # TODO: (len(x),) 뒤에 원소의 모양을 이어 붙여 돌려줍니다. 빈 리스트는 (0,)입니다.
    return (len(x),)

def transpose(M):
    """m×n 리스트 행렬 → n×m"""
    return M   # TODO: (M^T)[j][i] = M[i][j]

def flatten_shape(shape):
    """(배치, 나머지 축들...) → (배치, 나머지 축의 곱)"""
    return shape   # TODO

print(shape_of(3.5), shape_of([1, 2, 3]), shape_of([[1, 2, 3], [4, 5, 6]]))
print(transpose([[1, 2, 3], [4, 5, 6]]))
print(flatten_shape((64, 32, 32, 3)))
`,
    tests: py`
@test("shape_of: 스칼라, 벡터, 행렬, 3차원")
def _():
    assert shape_of(3.5) == ()
    assert shape_of([1, 2, 3]) == (3,)
    assert shape_of([[1, 2, 3], [4, 5, 6]]) == (2, 3)
    assert shape_of([[[0] * 4] * 3] * 2) == (2, 3, 4), f"결과: {shape_of([[[0] * 4] * 3] * 2)}"

@test("shape_of: 직사각형이 아니면 ValueError")
def _():
    try:
        shape_of([[1, 2], [3]])
        raised = False
    except ValueError:
        raised = True
    assert raised, "길이가 다른 행에서 ValueError가 나지 않았습니다."

@test("transpose: 2×3 → 3×2")
def _():
    got = transpose([[1, 2, 3], [4, 5, 6]])
    assert got == [[1, 4], [2, 5], [3, 6]], f"결과: {got}"

@test("transpose를 두 번 하면 원래 행렬")
def _():
    M = [[1, 2], [3, 4], [5, 6]]
    assert transpose(transpose(M)) == M

@test("flatten_shape")
def _():
    assert flatten_shape((64, 32, 32, 3)) == (64, 3072)
    assert flatten_shape((10, 28, 28)) == (10, 784)
    assert flatten_shape((5, 7)) == (5, 7)
`,
    hints: [
      "모든 원소의 모양이 같은지는 `len(set(inner)) > 1`로 검사할 수 있습니다(튜플은 집합에 넣을 수 있습니다).",
      "원소의 모양은 `inner[0]`이고, 빈 리스트면 `inner`가 비어 있으므로 `(len(x),) + (inner[0] if inner else ())`처럼 씁니다.",
      "`transpose`는 `[[M[i][j] for i in range(len(M))] for j in range(len(M[0]))]`이고, `flatten_shape`는 첫 축 뒤의 수를 반복문으로 곱합니다.",
    ],
    solution: py`
def shape_of(x):
    if not isinstance(x, list):
        return ()
    inner = [shape_of(item) for item in x]
    if len(set(inner)) > 1:
        raise ValueError(f"원소의 모양이 서로 다르다: {sorted(set(inner))}")
    return (len(x),) + (inner[0] if inner else ())

def transpose(M):
    return [[M[i][j] for i in range(len(M))] for j in range(len(M[0]))]

def flatten_shape(shape):
    rest = 1
    for n in shape[1:]:
        rest *= n
    return (shape[0], rest)

print(shape_of(3.5), shape_of([1, 2, 3]), shape_of([[1, 2, 3], [4, 5, 6]]))
print(transpose([[1, 2, 3], [4, 5, 6]]))
print(flatten_shape((64, 32, 32, 3)))
`,
  },
]);
