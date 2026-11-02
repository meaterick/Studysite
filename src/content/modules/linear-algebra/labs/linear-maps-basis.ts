import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "기저 좌표와 2×2 역행렬 직접 계산하기",
    prompt: md`

본문의 좌표 구하기와 역행렬 공식을 \`np.linalg.solve\`, \`np.linalg.inv\` 없이 구현합니다.

1. \`coords(b1, b2, v)\`: $c_1 b_1 + c_2 b_2 = v$를 만족하는 $(c_1, c_2)$를 크라메르 공식으로 구합니다. 기저 행렬 $[b_1\ b_2]$의 행렬식이 0이면(두 벡터가 선형종속이면) 좌표를 정할 수 없으므로 \`ValueError\`를 발생시킵니다.

$$c_1 = \frac{v_x b_{2y} - b_{2x} v_y}{\det},\quad c_2 = \frac{b_{1x} v_y - v_x b_{1y}}{\det},\quad \det = b_{1x} b_{2y} - b_{2x} b_{1y}$$

2. \`inverse2(A)\`: 중첩 리스트로 된 $2 \times 2$ 행렬 $\begin{bmatrix}a & b\\c & d\end{bmatrix}$의 역행렬 $\frac{1}{ad - bc}\begin{bmatrix}d & -b\\-c & a\end{bmatrix}$을 중첩 리스트로 돌려줍니다. 행렬식이 0이면 \`ValueError\`를 발생시킵니다.
`,
    starter: py`
def coords(b1, b2, v):
    """c1 * b1 + c2 * b2 = v 를 만족하는 (c1, c2). b1, b2가 기저가 아니면 ValueError"""
    det = b1[0] * b2[1] - b2[0] * b1[1]
    # TODO: det가 0이면 ValueError를 발생시킵니다.
    c1 = 0.0  # TODO: 크라메르 공식
    c2 = 0.0  # TODO
    return c1, c2

def inverse2(A):
    """2×2 행렬 A의 역행렬. 행렬식이 0이면 ValueError"""
    (a, b), (c, d) = A
    det = a * d - b * c
    # TODO: det가 0이면 ValueError, 아니면 [[d, -b], [-c, a]]의 각 원소를 det로 나눈 행렬을 돌려줍니다.
    return [[0.0, 0.0], [0.0, 0.0]]

print(coords([1, 1], [1, -1], [5, 1]))      # 기대: (3.0, 2.0)
print(inverse2([[1, 2], [0, 1]]))           # 기대: [[1.0, -2.0], [0.0, 1.0]]
`,
    tests: py`
@test("기저 [1,1], [1,-1]에서 [5, 1]의 좌표 = (3, 2)")
def _():
    c1, c2 = coords([1, 1], [1, -1], [5, 1])
    assert approx(c1, 3) and approx(c2, 2), f"결과: {(c1, c2)}"

@test("표준기저에서는 좌표 = 원래 성분")
def _():
    assert approx(coords([1, 0], [0, 1], [7, -2]), (7, -2))

@test("좌표로 다시 합치면 원래 벡터가 된다")
def _():
    b1, b2, v = [2, 1], [-1, 3], [4, 9]
    c1, c2 = coords(b1, b2, v)
    assert approx([c1 * b1[0] + c2 * b2[0], c1 * b1[1] + c2 * b2[1]], v)

@test("선형종속([1,2], [2,4])이면 coords가 ValueError")
def _():
    try:
        coords([1, 2], [2, 4], [3, 6])
    except ValueError:
        return
    raise AssertionError("ValueError가 발생하지 않았습니다.")

@test("[[1, 2], [0, 1]]의 역행렬 = [[1, -2], [0, 1]]")
def _():
    got = inverse2([[1, 2], [0, 1]])
    assert approx(got, [[1, -2], [0, 1]]), f"결과: {got}"

@test("A와 역행렬을 곱하면 단위행렬")
def _():
    A = [[2, 1], [1, 3]]
    B = inverse2(A)
    prod = [[sum(A[i][k] * B[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    assert approx(prod, [[1, 0], [0, 1]]), f"A × inverse2(A) = {prod}"

@test("행렬식이 0인 [[1, 2], [2, 4]]이면 inverse2가 ValueError")
def _():
    try:
        inverse2([[1, 2], [2, 4]])
    except ValueError:
        return
    raise AssertionError("ValueError가 발생하지 않았습니다.")
`,
    hints: [
      "`if det == 0: raise ValueError(\"기저가 아닙니다\")`처럼 예외를 발생시킵니다.",
      "공식을 그대로 옮기면 `c1 = (v[0] * b2[1] - b2[0] * v[1]) / det`입니다. `c2`도 같은 방식입니다.",
      "역행렬은 `[[d / det, -b / det], [-c / det, a / det]]`입니다.",
    ],
    solution: py`
def coords(b1, b2, v):
    det = b1[0] * b2[1] - b2[0] * b1[1]
    if det == 0:
        raise ValueError("두 벡터가 선형종속이라 기저가 아닙니다.")
    c1 = (v[0] * b2[1] - b2[0] * v[1]) / det
    c2 = (b1[0] * v[1] - v[0] * b1[1]) / det
    return c1, c2

def inverse2(A):
    (a, b), (c, d) = A
    det = a * d - b * c
    if det == 0:
        raise ValueError("행렬식이 0이라 역행렬이 없습니다.")
    return [[d / det, -b / det], [-c / det, a / det]]

print(coords([1, 1], [1, -1], [5, 1]))
print(inverse2([[1, 2], [0, 1]]))
`,
  },
]);
