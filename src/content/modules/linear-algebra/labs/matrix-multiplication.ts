import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "행렬-벡터 곱으로 신경망 한 층 계산하기",
    prompt: md`

레슨의 행렬-벡터 곱을 순수 파이썬 리스트로 구현합니다. 행렬 $W$는 행(리스트)들의 리스트입니다.

1. \`matvec(W, x)\`: $Wx$의 $i$번째 성분은 $W$의 $i$번째 행과 $x$의 내적입니다. **행의 길이와 $x$의 길이가 다르면 곱할 수 없으므로 \`None\`**을 돌려줍니다.
2. \`dense(W, x, b)\`: 신경망 한 층의 계산 $Wx + b$. 출력 뉴런마다 "자기 가중치 행과 입력의 내적 + 자기 편향"을 계산하는 것과 같습니다.

$W$가 $3 \times 2$이면 길이 2인 입력을 길이 3인 출력으로 옮긴다는 점, 즉 **결과의 길이는 $W$의 행 개수**라는 점을 출력으로 확인해 보십시오.
`,
    starter: py`
def matvec(W, x):
    """W(행 리스트)와 x의 곱 Wx. 행의 길이와 x의 길이가 다르면 None"""
    result = []
    for row in W:
        # TODO 1: row의 길이가 x의 길이와 다르면 None을 돌려줍니다.
        # TODO 2: row와 x의 내적을 result에 추가합니다.
        pass
    return result

def dense(W, x, b):
    """신경망 한 층의 계산 Wx + b (b의 길이 = W의 행 개수)"""
    # TODO: matvec(W, x)의 각 성분에 b의 같은 자리 값을 더한 리스트를 돌려줍니다.
    return []

W = [[1, 2],
     [3, 4],
     [0, -1]]                              # 3×2 행렬
print(matvec(W, [1, 1]))                   # 기대: [3, 7, -1]
print(matvec(W, [1, 1, 1]))                # 기대: None (열 2개 ≠ 길이 3)
print(dense(W, [1, 1], [0.5, -7, 1]))      # 기대: [3.5, 0, 0]
`,
    tests: py`
W = [[1, 2], [3, 4], [0, -1]]

@test("W(3×2) @ [1, 1] == [3, 7, -1]")
def _():
    assert matvec(W, [1, 1]) == [3, 7, -1], f"결과: {matvec(W, [1, 1])}"

@test("[[1, 2], [3, 4]] @ [2, -1] == [0, 2]")
def _():
    assert matvec([[1, 2], [3, 4]], [2, -1]) == [0, 2], f"결과: {matvec([[1, 2], [3, 4]], [2, -1])}"

@test("단위행렬을 곱하면 x가 그대로 나온다")
def _():
    assert matvec([[1, 0], [0, 1]], [5, -3]) == [5, -3]

@test("결과의 길이는 W의 행 개수: (1×3) @ 길이 3 → 길이 1")
def _():
    assert matvec([[1, 2, 3]], [1, 0, -1]) == [-2], f"결과: {matvec([[1, 2, 3]], [1, 0, -1])}"

@test("크기가 맞지 않으면 None")
def _():
    assert matvec(W, [1, 1, 1]) is None, f"결과: {matvec(W, [1, 1, 1])}"

@test("dense: Wx + b == [3.5, 0, 0]")
def _():
    got = dense(W, [1, 1], [0.5, -7, 1])
    assert got is not None and len(got) == 3 and approx(got, [3.5, 0, 0]), f"결과: {got}"
`,
    hints: ["`if len(row) != len(x): return None`을 반복문 안 맨 앞에 둡니다.", "내적은 `sum(w * v for w, v in zip(row, x))`입니다. 이 값을 `result.append(...)`로 쌓습니다.", "`dense`는 `[y + bi for y, bi in zip(matvec(W, x), b)]` 한 줄로 쓸 수 있습니다."],
    solution: py`
def matvec(W, x):
    result = []
    for row in W:
        if len(row) != len(x):
            return None
        result.append(sum(w * v for w, v in zip(row, x)))
    return result

def dense(W, x, b):
    return [y + bi for y, bi in zip(matvec(W, x), b)]

W = [[1, 2],
     [3, 4],
     [0, -1]]
print(matvec(W, [1, 1]))
print(matvec(W, [1, 1, 1]))
print(dense(W, [1, 1], [0.5, -7, 1]))
`,
  },
  {
    key: "ex2",
    title: "행렬곱과 전치의 곱 규칙",
    prompt: md`

중첩 리스트로 된 행렬의 곱과 전치를 구현하고, $(AB)^\top = B^\top A^\top$을 확인합니다. \`@\`와 NumPy는 쓰지 않습니다.

1. \`matmul(A, B)\`: $C_{ij} = \sum_k A_{ik} B_{kj}$. $A$의 열 개수와 $B$의 행 개수가 다르면 \`ValueError\`를 일으킵니다. 정사각행렬이 아니어도 동작해야 합니다.
2. \`transpose(M)\`: $(M^\top)_{ij} = M_{ji}$.
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

A, B = [[1, 2], [0, 1]], [[1, 0], [3, 1]]
print("AB =", matmul(A, B), " BA =", matmul(B, A))
print(transpose(matmul(A, B)) == matmul(transpose(B), transpose(A)))
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

@test("transpose: 2×3 → 3×2")
def _():
    assert transpose([[1, 2, 3], [4, 5, 6]]) == [[1, 4], [2, 5], [3, 6]]

@test("(AB)^T == B^T A^T (2×3, 3×2)")
def _():
    A = [[1, 2, 3], [4, 5, 6]]
    B = [[1, 0], [2, 1], [0, 3]]
    assert transpose(matmul(A, B)) == matmul(transpose(B), transpose(A))
`,
    hints: [
      "`if len(A[0]) != m: raise ValueError(\"안쪽 차원이 맞지 않는다\")`를 반복문 전에 둡니다.",
      "`for i in range(n): for j in range(p): for k in range(m): C[i][j] += A[i][k] * B[k][j]`",
      "`transpose`는 `[[M[i][j] for i in range(len(M))] for j in range(len(M[0]))]`입니다.",
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

A, B = [[1, 2], [0, 1]], [[1, 0], [3, 1]]
print("AB =", matmul(A, B), " BA =", matmul(B, A))
print(transpose(matmul(A, B)) == matmul(transpose(B), transpose(A)))
`,
  },
]);
