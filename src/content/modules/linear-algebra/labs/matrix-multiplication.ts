import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "곱의 모양과 원소 하나 계산하기",
    prompt: md`

행렬곱 전체를 구현하기 전에 두 단계를 먼저 연습합니다. 행렬은 행(리스트)들의 리스트입니다.

1. \`matmul_shape(shape_a, shape_b)\`: 두 모양 \`(m, n)\`과 \`(n2, p)\`를 받아, 안쪽 차원이 같으면 곱의 모양 \`(m, p)\`를, 다르면 \`None\`을 돌려줍니다.
2. \`entry(A, B, i, j)\`: 곱 $AB$의 $(i, j)$ 원소 $\sum_k A_{ik} B_{kj}$ 하나만 계산합니다. \`i\`, \`j\`는 0부터 셉니다.
`,
    starter: py`
def matmul_shape(shape_a, shape_b):
    """(m, n) × (n, p) → (m, p). 안쪽 차원이 다르면 None"""
    m, n = shape_a
    n2, p = shape_b
    # TODO: n과 n2가 같은지 확인합니다.
    return None

def entry(A, B, i, j):
    """(AB)[i][j] = Σ_k A[i][k] * B[k][j]"""
    total = 0
    # TODO: k = 0, 1, ...에 대해 A[i][k] * B[k][j]를 더합니다.
    return total

A = [[1, 2], [0, 1]]
B = [[1, 0], [3, 1]]
print(matmul_shape((2, 3), (3, 4)), entry(A, B, 0, 0))
`,
    tests: py`
@test("모양 규칙: 안쪽 차원이 같으면 바깥 차원")
def _():
    assert matmul_shape((2, 3), (3, 4)) == (2, 4), f"결과: {matmul_shape((2, 3), (3, 4))}"
    assert matmul_shape((1, 3), (3, 1)) == (1, 1)
    assert matmul_shape((3, 2), (2, 1)) == (3, 1)

@test("모양 규칙: 안쪽 차원이 다르면 None")
def _():
    assert matmul_shape((2, 3), (2, 3)) is None, f"결과: {matmul_shape((2, 3), (2, 3))}"

@test("본문의 AB: 원소 네 개")
def _():
    A = [[1, 2], [0, 1]]
    B = [[1, 0], [3, 1]]
    got = [[entry(A, B, i, j) for j in range(2)] for i in range(2)]
    assert got == [[7, 2], [3, 1]], f"결과: {got}"

@test("정사각행렬이 아니어도 계산된다")
def _():
    A = [[1, 2, 3]]
    B = [[1], [1], [2]]
    assert entry(A, B, 0, 0) == 9, f"결과: {entry(A, B, 0, 0)}"
`,
    hints: [
      "`if n != n2: return None`으로 먼저 걸러 내고, 같으면 `return (m, p)`입니다.",
      "`for k in range(len(B)):` 안에서 `total += A[i][k] * B[k][j]`를 실행합니다. `len(B)`는 B의 행 수, 즉 안쪽 차원입니다.",
    ],
    solution: py`
def matmul_shape(shape_a, shape_b):
    """(m, n) × (n, p) → (m, p). 안쪽 차원이 다르면 None"""
    m, n = shape_a
    n2, p = shape_b
    if n != n2:
        return None
    return (m, p)

def entry(A, B, i, j):
    """(AB)[i][j] = Σ_k A[i][k] * B[k][j]"""
    total = 0
    for k in range(len(B)):
        total += A[i][k] * B[k][j]
    return total

A = [[1, 2], [0, 1]]
B = [[1, 0], [3, 1]]
print(matmul_shape((2, 3), (3, 4)), entry(A, B, 0, 0))
`,
  },
  {
    key: "ex1",
    title: "행렬곱, 전치, 샘플 묶음에 대한 신경망 한 층",
    prompt: md`
본문의 행렬곱과 전치를 중첩 리스트로 구현하고, 샘플 묶음에 대한 신경망 한 층을 계산합니다. 행렬은 행(리스트)들의 리스트이며, \`@\`와 NumPy는 쓰지 않습니다.

1. \`matmul(A, B)\`: $C_{ij} = \sum_k A_{ik} B_{kj}$. $A$의 열 개수와 $B$의 행 개수가 다르면 \`ValueError\`를 일으킵니다. 정사각행렬이 아니어도 동작해야 합니다.
2. \`transpose(M)\`: $(M^\top)_{ij} = M_{ji}$.
3. \`dense(X, W, b)\`: 샘플을 행으로 쌓은 입력 $X$($N \times D$)에 대한 한 층의 계산 $XW + b$. \`matmul(X, W)\`의 각 행에 편향 $b$(길이 $H$)를 같은 자리끼리 더합니다. 결과의 모양은 $N \times H$입니다.
`,
    starter: py`
def matmul(A, B):
    """리스트로 된 행렬 곱 A @ B (A: n×m, B: m×p)"""
    n, m, p = len(A), len(B), len(B[0])
    # TODO: A의 열 개수(len(A[0]))가 m과 다르면 ValueError를 일으킵니다.
    C = [[0] * p for _ in range(n)]
    # TODO: 세 겹 반복문으로 C[i][j] = Σ_k A[i][k] * B[k][j] 를 채웁니다.
    return C

def transpose(M):
    return M   # TODO

def dense(X, W, b):
    """샘플 묶음 X(N×D)에 대한 한 층의 계산 XW + b (b의 길이 = W의 열 개수)"""
    return []  # TODO: matmul(X, W)의 각 행에 b를 같은 자리끼리 더합니다.

A, B = [[1, 2], [0, 1]], [[1, 0], [3, 1]]
print("AB =", matmul(A, B), " BA =", matmul(B, A))
print(transpose(matmul(A, B)) == matmul(transpose(B), transpose(A)))
X = [[1, 1], [2, 0]]                 # 샘플 2개, 특성 2개
W = [[1, 3, 0], [2, 4, -1]]          # 입력 2개 → 출력 3개
print(dense(X, W, [0.5, -7, 1]))     # 기대: [[3.5, 0, 0], [2.5, -1, 1]]
`,
    tests: py`
@test("AB = [[7, 2], [3, 1]], BA = [[1, 2], [3, 7]]")
def _():
    A, B = [[1, 2], [0, 1]], [[1, 0], [3, 1]]
    assert matmul(A, B) == [[7, 2], [3, 1]], f"AB = {matmul(A, B)}"
    assert matmul(B, A) == [[1, 2], [3, 7]], f"BA = {matmul(B, A)}"

@test("정사각이 아닌 행렬: (2×3) @ (3×1)")
def _():
    got = matmul([[1, 2, 3], [4, 5, 6]], [[1], [0], [-1]])
    assert got == [[-2], [-2]], f"결과: {got}"

@test("안쪽 차원이 다르면 ValueError")
def _():
    try:
        matmul([[1, 2, 3]], [[1, 2, 3]])
        raised = False
    except ValueError:
        raised = True
    assert raised, "(1×3) @ (1×3)에서 ValueError가 나지 않았습니다."

@test("transpose: 2×3 → 3×2, (AB)^T == B^T A^T")
def _():
    assert transpose([[1, 2, 3], [4, 5, 6]]) == [[1, 4], [2, 5], [3, 6]], f"결과: {transpose([[1, 2, 3], [4, 5, 6]])}"
    A = [[1, 2, 3], [4, 5, 6]]
    B = [[1, 0], [2, 1], [0, 3]]
    assert transpose(matmul(A, B)) == matmul(transpose(B), transpose(A))

@test("dense: 샘플 2개의 XW + b, 결과 모양은 (샘플 수 × 출력 수)")
def _():
    got = dense([[1, 1], [2, 0]], [[1, 3, 0], [2, 4, -1]], [0.5, -7, 1])
    assert got is not None and len(got) == 2 and all(len(r) == 3 for r in got), f"결과: {got}"
    assert approx(got[0], [3.5, 0, 0]) and approx(got[1], [2.5, -1, 1]), f"결과: {got}"

@test("dense: 샘플 3개, 입력 3개 → 출력 2개")
def _():
    got = dense([[1, 2, 3], [0, -1, 2], [4, 0, 1]], [[1, 0], [0, 1], [1, 1]], [1, -1])
    assert got is not None and len(got) == 3, f"결과: {got}"
    assert all(approx(r, e) for r, e in zip(got, [[5, 4], [3, 0], [6, 0]])), f"결과: {got}"
`,
    hints: [
      "`if len(A[0]) != m: raise ValueError(\"안쪽 차원이 맞지 않는다\")`를 반복문 전에 둡니다.",
      "`for i in range(n): for j in range(p): for k in range(m): C[i][j] += A[i][k] * B[k][j]`",
      "`transpose`는 `[[M[i][j] for i in range(len(M))] for j in range(len(M[0]))]`, `dense`는 `[[v + bj for v, bj in zip(row, b)] for row in matmul(X, W)]`입니다. 결과의 $i$번째 행이 $i$번째 샘플에 대한 층의 출력입니다.",
    ],
    solution: py`
def matmul(A, B):
    n, m, p = len(A), len(B), len(B[0])
    if len(A[0]) != m:
        raise ValueError("안쪽 차원이 맞지 않는다")
    C = [[0] * p for _ in range(n)]
    for i in range(n):
        for j in range(p):
            for k in range(m):
                C[i][j] += A[i][k] * B[k][j]
    return C

def transpose(M):
    return [[M[i][j] for i in range(len(M))] for j in range(len(M[0]))]

def dense(X, W, b):
    return [[v + bj for v, bj in zip(row, b)] for row in matmul(X, W)]

A, B = [[1, 2], [0, 1]], [[1, 0], [3, 1]]
print("AB =", matmul(A, B), " BA =", matmul(B, A))
print(transpose(matmul(A, B)) == matmul(transpose(B), transpose(A)))
X = [[1, 1], [2, 0]]
W = [[1, 3, 0], [2, 4, -1]]
print(dense(X, W, [0.5, -7, 1]))
`,
  },
]);
