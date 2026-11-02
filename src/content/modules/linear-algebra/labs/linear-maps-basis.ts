import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "기저 좌표와 행렬 곱 직접 계산하기",
    prompt: md`

「벡터공간·기저와 행렬 곱셈」 단계의 좌표 바꾸기와 행렬 곱셈을 \`np.linalg.solve\`와 \`@\` 없이 구현합니다.

1. \`coords(b1, b2, v)\`: $c_1 b_1 + c_2 b_2 = v$를 만족하는 $(c_1, c_2)$를 크라메르 공식으로 구합니다. 기저 행렬 $[b_1\ b_2]$의 행렬식이 0이면(두 벡터가 선형종속이면) 좌표를 정할 수 없으므로 \`ValueError\`를 발생시킵니다.

$$c_1 = \frac{v_x b_{2y} - b_{2x} v_y}{\det},\quad c_2 = \frac{b_{1x} v_y - v_x b_{1y}}{\det},\quad \det = b_{1x} b_{2y} - b_{2x} b_{1y}$$

2. \`matmul(A, B)\`: 중첩 리스트로 된 행렬의 곱. $C_{ij} = \sum_k A_{ik} B_{kj}$. 정사각행렬이 아니어도 동작해야 합니다.
`,
    starter: py`
def coords(b1, b2, v):
    """c1 * b1 + c2 * b2 = v 를 만족하는 (c1, c2). b1, b2가 기저가 아니면 ValueError"""
    det = b1[0] * b2[1] - b2[0] * b1[1]
    # TODO: det가 0이면 ValueError를 발생시킵니다.
    c1 = 0.0  # TODO: 크라메르 공식
    c2 = 0.0  # TODO
    return c1, c2

def matmul(A, B):
    """리스트로 된 행렬 곱 A @ B (A: n×m, B: m×p)"""
    n, m, p = len(A), len(B), len(B[0])
    C = [[0] * p for _ in range(n)]
    # TODO: 세 겹 반복문으로 C[i][j] = Σ_k A[i][k] * B[k][j] 를 채웁니다.
    return C

print(coords([1, 1], [1, -1], [5, 1]))      # 기대: (3.0, 2.0)
A, B = [[1, 2], [0, 1]], [[1, 0], [3, 1]]
print("AB =", matmul(A, B), " BA =", matmul(B, A))
`,
    tests: py`
@test("기저 [1,1], [1,-1]에서 [5, 1]의 좌표 = (3, 2)")
def _():
    c1, c2 = coords([1, 1], [1, -1], [5, 1])
    assert approx(c1, 3) and approx(c2, 2), f"결과: {(c1, c2)}"

@test("표준 기저에서는 좌표 = 원래 성분")
def _():
    assert approx(coords([1, 0], [0, 1], [7, -2]), (7, -2))

@test("좌표로 다시 합치면 원래 벡터가 된다")
def _():
    b1, b2, v = [2, 1], [-1, 3], [4, 9]
    c1, c2 = coords(b1, b2, v)
    assert approx([c1 * b1[0] + c2 * b2[0], c1 * b1[1] + c2 * b2[1]], v)

@test("선형종속([1,2], [2,4])이면 ValueError")
def _():
    try:
        coords([1, 2], [2, 4], [3, 6])
    except ValueError:
        return
    raise AssertionError("ValueError가 발생하지 않았습니다.")

@test("AB = [[7, 2], [3, 1]], BA = [[1, 2], [3, 7]]")
def _():
    A, B = [[1, 2], [0, 1]], [[1, 0], [3, 1]]
    assert matmul(A, B) == [[7, 2], [3, 1]], f"AB = {matmul(A, B)}"
    assert matmul(B, A) == [[1, 2], [3, 7]], f"BA = {matmul(B, A)}"

@test("정사각이 아닌 행렬: (2×3) @ (3×1)")
def _():
    got = matmul([[1, 2, 3], [4, 5, 6]], [[1], [0], [-1]])
    assert got == [[-2], [-2]], f"결과: {got}"
`,
    hints: ["`if det == 0: raise ValueError(\"기저가 아닙니다\")`처럼 예외를 발생시킵니다.", "공식을 그대로 옮기면 `c1 = (v[0] * b2[1] - b2[0] * v[1]) / det`입니다. `c2`도 같은 방식입니다.", "`for i in range(n): for j in range(p): for k in range(m): C[i][j] += A[i][k] * B[k][j]`"],
    solution: py`
def coords(b1, b2, v):
    det = b1[0] * b2[1] - b2[0] * b1[1]
    if det == 0:
        raise ValueError("두 벡터가 선형종속이라 기저가 아닙니다.")
    c1 = (v[0] * b2[1] - b2[0] * v[1]) / det
    c2 = (b1[0] * v[1] - v[0] * b1[1]) / det
    return c1, c2

def matmul(A, B):
    n, m, p = len(A), len(B), len(B[0])
    C = [[0] * p for _ in range(n)]
    for i in range(n):
        for j in range(p):
            for k in range(m):
                C[i][j] += A[i][k] * B[k][j]
    return C

print(coords([1, 1], [1, -1], [5, 1]))
A, B = [[1, 2], [0, 1]], [[1, 0], [3, 1]]
print("AB =", matmul(A, B), " BA =", matmul(B, A))
`,
  },
]);
