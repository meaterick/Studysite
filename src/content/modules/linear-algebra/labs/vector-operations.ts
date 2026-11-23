import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "NumPy로 선형결합과 보간 계산하기",
    prompt: md`

NumPy 배열로 선형결합을 계산합니다.

1. \`combo(c1, v1, c2, v2)\`: $c_1 v_1 + c_2 v_2$를 돌려줍니다.
2. \`lerp(a, b, t)\`: 보간 $(1 - t)a + tb$를 돌려줍니다.
3. \`c1\`, \`c2\`: $c_1 [1, 1] + c_2 [1, 3] = [4, 10]$을 만족하는 계수입니다. 성분별로 연립방정식을 세워 **손으로** 푼 값을 적습니다.
`,
    starter: py`
import numpy as np

def combo(c1, v1, c2, v2):
    """c1 * v1 + c2 * v2"""
    return None   # TODO

def lerp(a, b, t):
    """(1 - t) * a + t * b"""
    return None   # TODO

c1, c2 = None, None   # TODO: 손으로 푼 계수

v1, v2 = np.array([1, 1]), np.array([1, 3])
print(combo(2, np.array([1, 0]), 3, np.array([0, 1])))
print(lerp(np.array([2.0, 1.0]), np.array([1.0, 3.0]), 0.5))
`,
    tests: py`
import numpy as np

@test("combo: 2·[1, 0] + 3·[0, 1] = [2, 3]")
def _():
    got = combo(2, np.array([1, 0]), 3, np.array([0, 1]))
    assert got is not None and np.allclose(got, [2, 3]), f"결과: {got}"

@test("lerp: t = 0이면 a, t = 1이면 b, t = 0.5이면 가운데")
def _():
    a, b = np.array([2.0, 1.0]), np.array([1.0, 3.0])
    for t, want in ((0, a), (1, b), (0.5, [1.5, 2.0])):
        got = lerp(a, b, t)
        assert got is not None and np.allclose(got, want), f"t = {t}: 결과 {got}"

@test("[4, 10]을 만드는 계수")
def _():
    assert c1 is not None and c2 is not None, "c1, c2를 적으십시오."
    got = c1 * np.array([1, 1]) + c2 * np.array([1, 3])
    assert np.allclose(got, [4, 10]), f"c1 = {c1}, c2 = {c2}이면 {got}입니다."
`,
    hints: [
      "NumPy 배열은 `c1 * v1 + c2 * v2`처럼 수식 그대로 계산됩니다. `lerp`도 `(1 - t) * a + t * b`입니다.",
      "성분별로 쓰면 $c_1 + c_2 = 4$, $c_1 + 3c_2 = 10$입니다. 둘째 식에서 첫째 식을 빼면 $2c_2 = 6$입니다.",
    ],
    solution: py`
import numpy as np

def combo(c1, v1, c2, v2):
    """c1 * v1 + c2 * v2"""
    return c1 * v1 + c2 * v2

def lerp(a, b, t):
    """(1 - t) * a + t * b"""
    return (1 - t) * a + t * b

c1, c2 = 1, 3

v1, v2 = np.array([1, 1]), np.array([1, 3])
print(combo(2, np.array([1, 0]), 3, np.array([0, 1])))
print(lerp(np.array([2.0, 1.0]), np.array([1.0, 3.0]), 0.5))
`,
  },
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
