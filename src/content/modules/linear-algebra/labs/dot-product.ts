import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "NumPy 없이 내적과 코사인 유사도",
    prompt: md`

「벡터: 내적과 코사인 유사도」의 공식을 순수 파이썬 리스트로 구현합니다. NumPy의 \`@\`나 \`np.linalg.norm\`은 쓰지 않습니다.

- \`dot(a, b)\` $= \sum_i a_i b_i$, \`norm(a)\` $= \sqrt{a \cdot a}$, \`cosine(a, b)\` $= \dfrac{a \cdot b}{\lVert a \rVert \lVert b \rVert}$
- \`most_similar(query, words)\`: \`{단어: 벡터}\` 중 \`query\`와 코사인 유사도가 가장 큰 단어를 돌려줍니다.
`,
    starter: py`
def dot(a, b):
    # TODO: 같은 자리끼리 곱해서 모두 더합니다. (zip 활용)
    return 0

def norm(a):
    # TODO: 자기 자신과의 내적의 제곱근 (** 0.5)
    return 0

def cosine(a, b):
    # TODO: dot(a, b) / (|a| * |b|)
    return 0

def most_similar(query, words):
    """words: {단어: 벡터}. query와 코사인 유사도가 가장 큰 단어"""
    # TODO
    return None

a, b, c = [1, 2], [2, 1], [-2, 1]
print("a·b =", dot(a, b), " a·c =", dot(a, c))
print("cos(a,b) =", cosine(a, b), " cos(a,c) =", cosine(a, c))
words = {"queen": [0.85, 0.75, 0.9], "apple": [0.1, 0.05, 0.5]}
print("king과 가장 비슷한 단어:", most_similar([0.9, 0.8, 0.1], words))
`,
    tests: py`
@test("dot([1, 2], [2, 1]) == 4, 직교하면 0")
def _():
    assert dot([1, 2], [2, 1]) == 4 and dot([1, 2], [-2, 1]) == 0

@test("norm([3, 4]) == 5")
def _():
    assert approx(norm([3, 4]), 5.0), f"norm([3, 4]) = {norm([3, 4])}"

@test("cosine([1, 2], [2, 1]) == 0.8")
def _():
    assert approx(cosine([1, 2], [2, 1]), 0.8), f"결과: {cosine([1, 2], [2, 1])}"

@test("크기를 10배 해도 코사인 유사도는 그대로")
def _():
    assert approx(cosine([1, 2], [20, 10]), 0.8)

@test("정반대 방향이면 -1")
def _():
    assert approx(cosine([1, 2, 3], [-2, -4, -6]), -1.0)

@test("most_similar가 방향이 가장 비슷한 단어를 고른다")
def _():
    words = {"queen": [0.85, 0.75, 0.9], "apple": [0.1, 0.05, 0.5], "car": [-0.5, 0.2, 0.0]}
    assert most_similar([0.9, 0.8, 0.1], words) == "queen"
    assert most_similar([0.0, 0.0, 1.0], words) == "apple"
`,
    hints: ["`sum(x * y for x, y in zip(a, b))`가 내적입니다.", "`norm(a)`는 `dot(a, a) ** 0.5`로 쓸 수 있습니다. `cosine`은 앞의 두 함수를 조합합니다.", "`max(words, key=lambda w: cosine(query, words[w]))`는 코사인 유사도가 가장 큰 키(단어)를 돌려줍니다."],
    solution: py`
def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(a):
    return dot(a, a) ** 0.5

def cosine(a, b):
    return dot(a, b) / (norm(a) * norm(b))

def most_similar(query, words):
    return max(words, key=lambda w: cosine(query, words[w]))

a, b, c = [1, 2], [2, 1], [-2, 1]
print("a·b =", dot(a, b), " a·c =", dot(a, c))
print("cos(a,b) =", cosine(a, b), " cos(a,c) =", cosine(a, c))
words = {"queen": [0.85, 0.75, 0.9], "apple": [0.1, 0.05, 0.5]}
print("king과 가장 비슷한 단어:", most_similar([0.9, 0.8, 0.1], words))
`,
  },
  {
    key: "ex2",
    title: "행렬-벡터 곱으로 신경망 한 층 계산하기",
    prompt: md`

「벡터: 내적과 코사인 유사도」의 "행렬-벡터 곱"을 순수 파이썬 리스트로 구현합니다. 행렬 $W$는 행(리스트)들의 리스트입니다.

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
]);
