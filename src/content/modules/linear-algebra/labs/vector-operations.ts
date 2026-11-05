import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "선형결합과 평균 벡터",
    prompt: md`

파이썬 리스트로 된 벡터를 다루는 함수를 완성합니다(NumPy를 쓰지 않습니다).

1. \`add(u, v)\`: 성분별 덧셈. 길이가 다르면 \`ValueError\`를 일으킵니다.
2. \`scale(c, v)\`: 스칼라곱.
3. \`linear_combination(coeffs, vectors)\`: $\sum_i c_i v_i$. 위의 두 함수로 씁니다. 계수와 벡터의 개수가 다르면 \`ValueError\`입니다.
4. \`mean_vector(vectors)\`: 벡터들의 평균. 계수가 모두 $1/n$인 선형결합입니다.
`,
    starter: py`
def add(u, v):
    """성분별 덧셈. 길이가 다르면 ValueError"""
    # TODO: 길이를 검사하고 같은 위치끼리 더한 리스트를 돌려줍니다.
    return u + v

def scale(c, v):
    """c * v"""
    return [c] * len(v)   # TODO: 각 성분에 c를 곱합니다.

def linear_combination(coeffs, vectors):
    """c_1 v_1 + ... + c_k v_k"""
    # TODO: 개수를 검사하고, 영벡터에서 시작해 scale과 add로 차례로 더합니다.
    return []

def mean_vector(vectors):
    """벡터들의 평균"""
    return []   # TODO: linear_combination을 계수 1/n으로 호출합니다.

print(add([2, 1], [1, 3]), scale(3, [2, 1]))
print(linear_combination([1, 2], [[1, 1], [1, 3]]))
print(mean_vector([[0.2, 0.4, 0.0], [0.6, 0.0, 0.2], [0.1, 0.5, 0.4]]))
`,
    tests: py`
@test("add와 scale")
def _():
    assert add([2, 1], [1, 3]) == [3, 4], f"add: {add([2, 1], [1, 3])}"
    assert scale(3, [2, 1]) == [6, 3] and scale(-1, [1, -2]) == [-1, 2]

@test("add: 길이가 다르면 ValueError")
def _():
    try:
        add([1, 2], [1, 2, 3])
        raised = False
    except ValueError:
        raised = True
    assert raised, "길이가 다른 벡터에서 ValueError가 나지 않았습니다."

@test("linear_combination: 1·[1, 1] + 2·[1, 3] = [3, 7]")
def _():
    assert linear_combination([1, 2], [[1, 1], [1, 3]]) == [3, 7]

@test("linear_combination: 갱신식 θ − η g")
def _():
    got = linear_combination([1, -0.1], [[1.0, 2.0], [10.0, -4.0]])
    assert approx(got, [0.0, 2.4]), f"결과: {got}"

@test("mean_vector")
def _():
    got = mean_vector([[0.2, 0.4, 0.0], [0.6, 0.0, 0.2], [0.1, 0.5, 0.4]])
    assert approx(got, [0.3, 0.3, 0.2]), f"결과: {got}"
`,
    hints: [
      "`if len(u) != len(v): raise ValueError(...)` 다음 `[a + b for a, b in zip(u, v)]`입니다.",
      "`linear_combination`은 `result = [0] * len(vectors[0])`에서 시작해 `for c, v in zip(coeffs, vectors): result = add(result, scale(c, v))`로 더합니다.",
      "`mean_vector(vectors)`는 `linear_combination([1 / n] * n, vectors)`입니다.",
    ],
    solution: py`
def add(u, v):
    if len(u) != len(v):
        raise ValueError("길이가 다른 벡터는 더할 수 없다")
    return [a + b for a, b in zip(u, v)]

def scale(c, v):
    return [c * x for x in v]

def linear_combination(coeffs, vectors):
    if len(coeffs) != len(vectors):
        raise ValueError("계수와 벡터의 개수가 다르다")
    result = [0] * len(vectors[0])
    for c, v in zip(coeffs, vectors):
        result = add(result, scale(c, v))
    return result

def mean_vector(vectors):
    n = len(vectors)
    return linear_combination([1 / n] * n, vectors)

print(add([2, 1], [1, 3]), scale(3, [2, 1]))
print(linear_combination([1, 2], [[1, 1], [1, 3]]))
print(mean_vector([[0.2, 0.4, 0.0], [0.6, 0.0, 0.2], [0.1, 0.5, 0.4]]))
`,
  },
]);
