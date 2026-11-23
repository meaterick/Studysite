import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "내적·길이·거리를 단계별로 계산하기",
    prompt: md`

두 벡터 $a = [2, -1, 2]$, $b = [1, 4, 1]$에 대해 본문의 계산 순서를 한 줄씩 코드로 옮깁니다. NumPy 배열의 \`*\`, \`.sum()\`, \`np.sqrt\`를 씁니다(\`@\`와 \`np.linalg.norm\`은 쓰지 않습니다).

1. \`products\`: 같은 위치끼리 곱한 배열
2. \`dot\`: \`products\`의 합(내적)
3. \`orthogonal\`: 두 벡터가 직교하면 \`True\`
4. \`length_a\`: $a$의 길이(성분 제곱 → 합 → 제곱근)
5. \`distance\`: 두 점 사이의 거리 $|a - b|$
`,
    starter: py`
import numpy as np

a = np.array([2, -1, 2])
b = np.array([1, 4, 1])

products = None     # TODO: 같은 위치끼리 곱한 배열
dot = None          # TODO: products의 합
orthogonal = None   # TODO: 내적이 0이면 True
length_a = None     # TODO: a의 길이
distance = None     # TODO: a - b의 길이

print(products, dot, orthogonal, length_a, distance)
`,
    tests: py`
import numpy as np

@test("같은 위치끼리 곱하기: [2, -4, 2]")
def _():
    assert products is not None and np.array_equal(products, [2, -4, 2]), f"결과: {products}"

@test("내적 0, 직교")
def _():
    assert dot == 0, f"내적: {dot}"
    assert orthogonal is True or orthogonal == True, f"orthogonal: {orthogonal}"

@test("a의 길이 3")
def _():
    assert length_a is not None and approx(length_a, 3.0), f"결과: {length_a}"

@test("거리 |a - b| = √27")
def _():
    assert distance is not None and approx(distance, 27 ** 0.5), f"결과: {distance}"
`,
    hints: [
      "`products = a * b`이고 `dot = products.sum()`입니다. 직교 여부는 `dot == 0`의 결과를 그대로 저장합니다.",
      "길이는 `np.sqrt((a ** 2).sum())`입니다. 거리는 차 벡터 `d = a - b`의 길이 `np.sqrt((d ** 2).sum())`입니다.",
    ],
    solution: py`
import numpy as np

a = np.array([2, -1, 2])
b = np.array([1, 4, 1])

products = a * b
dot = products.sum()
orthogonal = dot == 0
length_a = np.sqrt((a ** 2).sum())
d = a - b
distance = np.sqrt((d ** 2).sum())

print(products, dot, orthogonal, length_a, distance)
`,
  },
  {
    key: "ex1",
    title: "NumPy 없이 내적과 코사인 유사도",
    prompt: md`

레슨의 내적·노름·코사인 유사도 공식을 순수 파이썬 리스트로 구현합니다. NumPy의 \`@\`나 \`np.linalg.norm\`은 쓰지 않습니다.

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
]);
