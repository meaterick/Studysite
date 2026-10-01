import type { WeekLab } from "../types";
import { py } from "./util";

// 1주차: 손실·격자 탐색, 파이썬 기초, NumPy 축, 내적·코사인, 기저 좌표, 베이즈(자연 빈도), 엔트로피, 경사하강법
const week1: WeekLab = {
  exercises: [
    {
      id: "w1-lab-loss",
      sectionId: "ai-landscape",
      title: "함수를 찾는 게임: MSE와 격자 탐색",
      tier: "core",
      prompt: `
「AI의 지형도와 "함수를 찾는 게임"」 실습 2를 직접 구현합니다. 데이터는 대략 $y = 2x$를 따릅니다.

1. \`mse(theta, xs, ys)\`: 예측 $\\hat y = \\theta x$와 정답 $y$의 평균제곱오차를 돌려줍니다.
2. \`grid_search(xs, ys, candidates)\`: 후보 $\\theta$ 중 손실이 가장 작은 값을 돌려줍니다. \`min(..., key=...)\` 없이 반복문으로 최솟값을 갱신해 봅니다.
`,
      starter: py`
xs = [1, 2, 3, 4]
ys = [2.1, 3.9, 6.2, 7.8]

def mse(theta, xs, ys):
    """예측 theta * x 와 정답 y 의 평균제곱오차"""
    # TODO: (theta * x - y) ** 2 를 모든 점에 대해 더한 뒤 점의 개수로 나눕니다.
    return 0.0

def grid_search(xs, ys, candidates):
    """candidates 중 mse가 가장 작은 theta를 돌려준다"""
    best_theta, best_loss = None, float("inf")
    for theta in candidates:
        # TODO: 손실을 계산하고, 지금까지의 최솟값보다 작으면 best_theta와 best_loss를 갱신합니다.
        pass
    return best_theta

print("theta=2 손실:", mse(2, xs, ys))
candidates = [t / 100 for t in range(0, 401)]   # 0.00 ~ 4.00
print("가장 좋은 theta:", grid_search(xs, ys, candidates))
`,
      tests: py`
@test("theta=2일 때 손실이 0.025")
def _():
    got = mse(2, [1, 2, 3, 4], [2.1, 3.9, 6.2, 7.8])
    assert approx(got, 0.025), f"mse(2) = {got}"

@test("theta=0이면 손실은 y²의 평균")
def _():
    assert approx(mse(0, [1, 2], [3, 4]), 12.5)

@test("0.01 간격 탐색의 최적값 ≈ 1.99")
def _():
    best = grid_search([1, 2, 3, 4], [2.1, 3.9, 6.2, 7.8], [t / 100 for t in range(0, 401)])
    assert best is not None, "grid_search가 None을 돌려줍니다."
    assert approx(best, 1.99), f"찾은 값: {best}"

@test("이상치(12.0)를 넣으면 최적 theta가 커진다")
def _():
    best = grid_search([1, 2, 3, 4], [2.1, 3.9, 6.2, 12.0], [t / 100 for t in range(0, 401)])
    assert best is not None and approx(best, 2.55), f"찾은 값: {best}"
`,
      hints: [
        "`zip(xs, ys)`로 x와 y를 짝지어 꺼낼 수 있습니다. `sum((theta * x - y) ** 2 for x, y in zip(xs, ys))`가 오차 제곱의 합입니다.",
        "평균이므로 합을 `len(xs)`로 나눕니다.",
        "`grid_search` 안에서 `loss = mse(theta, xs, ys)`를 구하고, `if loss < best_loss:`이면 `best_theta, best_loss = theta, loss`로 갱신합니다.",
      ],
      solution: py`
xs = [1, 2, 3, 4]
ys = [2.1, 3.9, 6.2, 7.8]

def mse(theta, xs, ys):
    return sum((theta * x - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

def grid_search(xs, ys, candidates):
    best_theta, best_loss = None, float("inf")
    for theta in candidates:
        loss = mse(theta, xs, ys)
        if loss < best_loss:
            best_theta, best_loss = theta, loss
    return best_theta

print("theta=2 손실:", mse(2, xs, ys))
candidates = [t / 100 for t in range(0, 401)]
print("가장 좋은 theta:", grid_search(xs, ys, candidates))
`,
    },
    {
      id: "w1-lab-summarize",
      sectionId: "python-basics",
      title: "성적 요약 함수: 빈 리스트까지 안전하게",
      tier: "core",
      prompt: `
「Python 기초 문법」 실습 1의 \`summarize\`를 완성하고 "한 걸음 더"까지 해결합니다.

1. \`summarize(scores)\`: \`(평균, 최고점, 70점 이상 인원)\` 튜플을 돌려줍니다. **빈 리스트면 \`None\`**을 돌려줍니다(\`if\` 또는 \`try\`/\`except ZeroDivisionError\`).
2. \`label_students(students)\`: \`{이름: 점수}\`를 받아 \`{이름: "통과" 또는 "보충"}\`을 돌려줍니다. 70점 이상이 통과이며, 딕셔너리 컴프리헨션으로 한 줄에 써 봅니다.

시작 코드를 그대로 실행하면 \`summarize([])\`에서 오류가 납니다. 오류 메시지와 줄 번호를 먼저 읽어 보십시오.
`,
      starter: py`
def summarize(scores):
    """점수 리스트 -> (평균, 최고점, 70점 이상 인원). 빈 리스트면 None"""
    # TODO: 빈 리스트일 때 None을 돌려주도록 처리합니다.
    avg = sum(scores) / len(scores)
    best = max(scores)
    passed = 0  # TODO: 리스트 컴프리헨션으로 70점 이상인 점수의 개수를 셉니다.
    return avg, best, passed

def label_students(students):
    """{이름: 점수} -> {이름: "통과" 또는 "보충"} (70점 이상이면 통과)"""
    # TODO: {이름: (조건부 표현식) for 이름, 점수 in students.items()}
    return {}

print(summarize([90, 85, 77, 60]))
print(summarize([]))
print(label_students({"민수": 88, "지현": 95, "도윤": 67}))
`,
      tests: py`
@test("summarize([90, 85, 77, 60]) == (78.0, 90, 3)")
def _():
    got = summarize([90, 85, 77, 60])
    assert got == (78.0, 90, 3), f"결과: {got}"

@test("빈 리스트면 None")
def _():
    assert summarize([]) is None

@test("한 명뿐일 때: summarize([69]) == (69.0, 69, 0)")
def _():
    assert summarize([69]) == (69.0, 69, 0), f"결과: {summarize([69])}"

@test("label_students가 70점(포함) 기준으로 나눈다")
def _():
    got = label_students({"민수": 88, "지현": 95, "도윤": 67, "서연": 70})
    assert got == {"민수": "통과", "지현": "통과", "도윤": "보충", "서연": "통과"}, f"결과: {got}"
`,
      hints: [
        "함수 맨 앞에 `if not scores: return None`을 두면 빈 리스트를 먼저 걸러 낼 수 있습니다.",
        "`len([s for s in scores if s >= 70])`로 70점 이상인 개수를 셉니다.",
        "조건부 표현식은 `\"통과\" if score >= 70 else \"보충\"` 형태입니다. 이것을 딕셔너리 컴프리헨션의 값 자리에 넣습니다.",
      ],
      solution: py`
def summarize(scores):
    if not scores:
        return None
    avg = sum(scores) / len(scores)
    best = max(scores)
    passed = len([s for s in scores if s >= 70])
    return avg, best, passed

def label_students(students):
    return {name: ("통과" if score >= 70 else "보충") for name, score in students.items()}

print(summarize([90, 85, 77, 60]))
print(summarize([]))
print(label_students({"민수": 88, "지현": 95, "도윤": 67}))
`,
    },
    {
      id: "w1-lab-axis",
      sectionId: "dev-tools",
      title: "NumPy 축(axis)과 브로드캐스팅",
      tier: "supplement",
      prompt: `
학생 4명, 과목 3개짜리 점수표로 축과 브로드캐스팅을 연습합니다. **반복문 없이** NumPy 연산만 씁니다.

1. \`subject_means(scores)\`: 과목별 평균, shape \`(과목 수,)\`
2. \`center_by_student(scores)\`: 학생(행)마다 자기 평균을 빼서 각 행의 평균이 0이 되게 합니다. 「개발 환경과 NumPy 첫걸음」 실습의 "해볼 것"처럼 \`keepdims=True\`가 필요합니다.
3. \`count_high(scores, threshold)\`: \`threshold\` 이상인 칸의 개수(불리언 배열 활용)
`,
      starter: py`
import numpy as np

scores = np.array([[90, 80, 70],
                   [60, 90, 80],
                   [85, 75, 95],
                   [70, 60, 90]])   # (학생 4명, 과목 3개)

def subject_means(scores):
    """과목별 평균, shape (과목 수,)"""
    return None  # TODO: mean의 axis를 골라 씁니다.

def center_by_student(scores):
    """각 학생(행)의 평균을 빼서 행 평균이 0이 되게 한다. shape은 그대로"""
    return None  # TODO: keepdims=True로 (학생 수, 1) 모양의 평균을 만들어 뺍니다.

def count_high(scores, threshold=80):
    """threshold 이상인 칸의 개수"""
    return None  # TODO: 불리언 배열 scores >= threshold 를 활용합니다.

print(subject_means(scores))
print(center_by_student(scores))
print(count_high(scores))
`,
      tests: py`
import numpy as np
S = np.array([[90, 80, 70], [60, 90, 80], [85, 75, 95], [70, 60, 90]])

@test("과목별 평균 = [76.25, 76.25, 83.75]")
def _():
    m = subject_means(S)
    assert m is not None and np.shape(m) == (3,), f"shape: {np.shape(m)}"
    assert approx(m, [76.25, 76.25, 83.75]), f"결과: {m}"

@test("학생별 중심화: shape 유지, 각 행 평균 0")
def _():
    c = center_by_student(S)
    assert c is not None and np.shape(c) == (4, 3), f"shape: {np.shape(c)}"
    assert approx(np.asarray(c).mean(axis=1), [0, 0, 0, 0])

@test("열 평균이 아니라 행 평균을 뺐다")
def _():
    c = np.asarray(center_by_student(S))
    assert approx(c[0], [10, 0, -10]), f"첫 학생 결과: {c[0]}"

@test("80점 이상 7칸, 90점 이상 4칸")
def _():
    assert count_high(S) == 7, f"count_high(S) = {count_high(S)}"
    assert count_high(S, 90) == 4, f"count_high(S, 90) = {count_high(S, 90)}"

@test("다른 크기(3×4)에도 그대로 동작")
def _():
    R = np.arange(12).reshape(3, 4)
    assert np.shape(subject_means(R)) == (4,) and approx(subject_means(R), R.mean(axis=0))
    assert approx(np.asarray(center_by_student(R)).mean(axis=1), [0, 0, 0])
`,
      hints: [
        "axis=0은 행 방향으로 훑어 같은 열끼리 묶고, axis=1은 열 방향으로 훑어 같은 행끼리 묶습니다. 과목은 열입니다.",
        "`scores.mean(axis=1)`의 shape은 (4,)라서 (4, 3)에서 빼면 뒤쪽 축(3 ≠ 4)이 맞지 않습니다. `scores.mean(axis=1, keepdims=True)`는 (4, 1)이 되어 열 방향으로 복제됩니다.",
        "`scores >= threshold`는 True/False 배열입니다. True는 1로 계산되므로 `.sum()`을 붙이면 개수가 됩니다.",
      ],
      solution: py`
import numpy as np

scores = np.array([[90, 80, 70],
                   [60, 90, 80],
                   [85, 75, 95],
                   [70, 60, 90]])

def subject_means(scores):
    return scores.mean(axis=0)

def center_by_student(scores):
    return scores - scores.mean(axis=1, keepdims=True)

def count_high(scores, threshold=80):
    return int((scores >= threshold).sum())

print(subject_means(scores))
print(center_by_student(scores))
print(count_high(scores))
`,
    },
    {
      id: "w1-lab-cosine",
      sectionId: "vectors",
      title: "NumPy 없이 내적과 코사인 유사도",
      tier: "core",
      prompt: `
「벡터: 내적과 코사인 유사도」의 공식을 순수 파이썬 리스트로 구현합니다. NumPy의 \`@\`나 \`np.linalg.norm\`은 쓰지 않습니다.

- \`dot(a, b)\` $= \\sum_i a_i b_i$, \`norm(a)\` $= \\sqrt{a \\cdot a}$, \`cosine(a, b)\` $= \\dfrac{a \\cdot b}{\\lVert a \\rVert \\lVert b \\rVert}$
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
      hints: [
        "`sum(x * y for x, y in zip(a, b))`가 내적입니다.",
        "`norm(a)`는 `dot(a, a) ** 0.5`로 쓸 수 있습니다. `cosine`은 앞의 두 함수를 조합합니다.",
        "`max(words, key=lambda w: cosine(query, words[w]))`는 코사인 유사도가 가장 큰 키(단어)를 돌려줍니다.",
      ],
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
      id: "w1-lab-coords",
      sectionId: "basis-matrix",
      title: "기저 좌표와 행렬 곱 직접 계산하기",
      tier: "supplement",
      prompt: `
「벡터공간·기저와 행렬 곱셈」 실습을 \`np.linalg.solve\`와 \`@\` 없이 구현합니다.

1. \`coords(b1, b2, v)\`: $c_1 b_1 + c_2 b_2 = v$를 만족하는 $(c_1, c_2)$를 크라메르 공식으로 구합니다. 기저 행렬 $[b_1\\ b_2]$의 행렬식이 0이면(두 벡터가 선형종속이면) 좌표를 정할 수 없으므로 \`ValueError\`를 발생시킵니다.

$$c_1 = \\frac{v_x b_{2y} - b_{2x} v_y}{\\det},\\quad c_2 = \\frac{b_{1x} v_y - v_x b_{1y}}{\\det},\\quad \\det = b_{1x} b_{2y} - b_{2x} b_{1y}$$

2. \`matmul(A, B)\`: 중첩 리스트로 된 행렬의 곱. $C_{ij} = \\sum_k A_{ik} B_{kj}$. 정사각행렬이 아니어도 동작해야 합니다.
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
      hints: [
        "`if det == 0: raise ValueError(\"기저가 아닙니다\")`처럼 예외를 발생시킵니다.",
        "공식을 그대로 옮기면 `c1 = (v[0] * b2[1] - b2[0] * v[1]) / det`입니다. `c2`도 같은 방식입니다.",
        "`for i in range(n): for j in range(p): for k in range(m): C[i][j] += A[i][k] * B[k][j]`",
      ],
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
    {
      id: "w1-lab-bayes",
      sectionId: "probability",
      title: "베이즈 정리를 사람 수(자연 빈도)로 계산하기",
      tier: "core",
      prompt: `
확률 공식 대신 "1만 명이 검사를 받는다면 몇 명이 어디에 들어가는가"로 베이즈 정리를 계산합니다(자연 빈도). 확률로 생각할 때보다 기저율의 효과가 훨씬 잘 보입니다.

1. \`frequency_table(N, prevalence, sensitivity, false_pos)\`: 실제 환자 수, 건강한 사람 수, 환자 중 양성(TP), 건강한 사람 중 양성(FP)을 셉니다.
2. \`posterior_from_table(table)\`: 양성 판정을 받은 사람 중 실제 환자의 비율 $P(\\text{병} \\mid \\text{양성})$
`,
      starter: py`
def frequency_table(N, prevalence, sensitivity, false_pos):
    sick = N * prevalence          # 실제 환자 수
    healthy = 0  # TODO: 건강한 사람 수
    tp = 0       # TODO: 환자 중 양성으로 나오는 사람 수 (민감도)
    fp = 0       # TODO: 건강한 사람 중 양성으로 나오는 사람 수 (위양성률)
    return {"sick": sick, "healthy": healthy, "tp": tp, "fp": fp, "positive": tp + fp}

def posterior_from_table(table):
    # TODO: 양성 판정을 받은 사람 중 실제 환자의 비율
    return 0.0

for prev in (0.01, 0.10):
    t = frequency_table(10_000, prev, 0.99, 0.05)
    print(f"유병률 {prev:.0%}: 양성 {t['positive']:.0f}명 중 환자 {t['tp']:.0f}명 → P(병|양성) = {posterior_from_table(t):.1%}")
`,
      tests: py`
@test("1만 명, 유병률 1% → 환자 100명, TP 99명, FP 495명")
def _():
    t = frequency_table(10_000, 0.01, 0.99, 0.05)
    assert approx(t["sick"], 100) and approx(t["healthy"], 9900), f"표: {t}"
    assert approx(t["tp"], 99) and approx(t["fp"], 495), f"표: {t}"

@test("P(병|양성) = 99/594 ≈ 0.1667")
def _():
    got = posterior_from_table(frequency_table(10_000, 0.01, 0.99, 0.05))
    assert approx(got, 99 / 594), f"결과: {got}"

@test("유병률 10%면 0.6875")
def _():
    got = posterior_from_table(frequency_table(10_000, 0.10, 0.99, 0.05))
    assert approx(got, 0.6875), f"결과: {got}"

@test("사람 수 N이 바뀌어도 사후확률은 같다")
def _():
    a = posterior_from_table(frequency_table(1_000, 0.02, 0.9, 0.1))
    b = posterior_from_table(frequency_table(1_000_000, 0.02, 0.9, 0.1))
    assert approx(a, b) and approx(a, 0.018 / (0.018 + 0.098)), f"{a} vs {b}"
`,
      hints: [
        "건강한 사람 수는 `N - sick`입니다.",
        "TP는 `sick * sensitivity`, FP는 `healthy * false_pos`입니다.",
        "사후확률은 `table[\"tp\"] / table[\"positive\"]`입니다. 분모에 FP가 들어간다는 것이 기저율 효과의 핵심입니다.",
      ],
      solution: py`
def frequency_table(N, prevalence, sensitivity, false_pos):
    sick = N * prevalence
    healthy = N - sick
    tp = sick * sensitivity
    fp = healthy * false_pos
    return {"sick": sick, "healthy": healthy, "tp": tp, "fp": fp, "positive": tp + fp}

def posterior_from_table(table):
    return table["tp"] / table["positive"]

for prev in (0.01, 0.10):
    t = frequency_table(10_000, prev, 0.99, 0.05)
    print(f"유병률 {prev:.0%}: 양성 {t['positive']:.0f}명 중 환자 {t['tp']:.0f}명 → P(병|양성) = {posterior_from_table(t):.1%}")
`,
    },
    {
      id: "w1-lab-entropy",
      sectionId: "entropy",
      title: "엔트로피·교차 엔트로피·KL 발산 구현",
      tier: "supplement",
      prompt: `
「엔트로피·교차 엔트로피·KL 발산」의 세 정의를 밑이 2인 로그(비트)로 구현합니다.

- $H(p) = -\\sum_i p_i \\log_2 p_i$ (단, $0 \\cdot \\log 0 = 0$)
- $H(p, q) = -\\sum_i p_i \\log_2 q_i$ ($p_i = 0$인 항은 기여하지 않음)
- $D_{\\mathrm{KL}}(p \\parallel q) = H(p, q) - H(p)$

확률이 0인 항 때문에 \`nan\`이 나오지 않도록 하는 것이 이 문제의 핵심입니다.
`,
      starter: py`
import numpy as np

def entropy(p):
    p = np.asarray(p, dtype=float)
    # TODO: 0인 항은 빼고(0·log0 = 0) -Σ p·log2(p) 를 계산합니다.
    return 0.0

def cross_entropy(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    # TODO: p > 0인 자리만 골라 -Σ p·log2(q) 를 계산합니다.
    return 0.0

def kl(p, q):
    # TODO: 교차 엔트로피 - 엔트로피
    return 0.0

fair, biased = [0.5, 0.5], [0.9, 0.1]
print("H(fair) =", entropy(fair), " H(biased) =", entropy(biased))
print("H(fair, biased) =", cross_entropy(fair, biased))
print("KL(fair‖biased) =", kl(fair, biased), " KL(biased‖fair) =", kl(biased, fair))
`,
      tests: py`
@test("H(공정한 동전) = 1비트, H([0.9, 0.1]) ≈ 0.469")
def _():
    assert approx(entropy([0.5, 0.5]), 1.0), f"H(fair) = {entropy([0.5, 0.5])}"
    assert approx(entropy([0.9, 0.1]), 0.4690, tol=1e-3), f"H(biased) = {entropy([0.9, 0.1])}"

@test("균등한 4가지 결과 → 2비트")
def _():
    assert approx(entropy([0.25] * 4), 2.0)

@test("확률 0인 결과가 있어도 nan이 아니다")
def _():
    assert approx(entropy([1.0, 0.0]), 0.0) and approx(entropy([0.5, 0.5, 0.0]), 1.0)

@test("H(fair, biased) ≈ 1.737, KL(fair‖biased) ≈ 0.737")
def _():
    assert approx(cross_entropy([0.5, 0.5], [0.9, 0.1]), 1.737, tol=1e-3)
    assert approx(kl([0.5, 0.5], [0.9, 0.1]), 0.737, tol=1e-3)

@test("KL은 비대칭: KL(biased‖fair) ≈ 0.531")
def _():
    assert approx(kl([0.9, 0.1], [0.5, 0.5]), 0.531, tol=1e-3), f"결과: {kl([0.9, 0.1], [0.5, 0.5])}"

@test("p가 0인 자리는 q가 0이어도 손실에 기여하지 않는다")
def _():
    assert approx(cross_entropy([1, 0], [1.0, 0.0]), 0.0)
`,
      hints: [
        "`p = p[p > 0]`처럼 불리언 인덱싱으로 0인 항을 걸러 낸 뒤 `-np.sum(p * np.log2(p))`를 계산합니다.",
        "교차 엔트로피는 `mask = p > 0`을 만들어 `-np.sum(p[mask] * np.log2(q[mask]))`로 씁니다. p와 q를 같은 자리에서 함께 골라야 합니다.",
        "`kl(p, q)`는 `cross_entropy(p, q) - entropy(p)` 한 줄입니다.",
      ],
      solution: py`
import numpy as np

def entropy(p):
    p = np.asarray(p, dtype=float)
    p = p[p > 0]
    return -np.sum(p * np.log2(p))

def cross_entropy(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    mask = p > 0
    return -np.sum(p[mask] * np.log2(q[mask]))

def kl(p, q):
    return cross_entropy(p, q) - entropy(p)

fair, biased = [0.5, 0.5], [0.9, 0.1]
print("H(fair) =", entropy(fair), " H(biased) =", entropy(biased))
print("H(fair, biased) =", cross_entropy(fair, biased))
print("KL(fair‖biased) =", kl(fair, biased), " KL(biased‖fair) =", kl(biased, fair))
`,
    },
    {
      id: "w1-lab-gd",
      sectionId: "gradient-descent",
      title: "경사하강법 함수와 학습률 진단기",
      tier: "supplement",
      prompt: `
「미분과 경사하강법」의 갱신식 $w \\leftarrow w - \\eta \\, \\dfrac{dL}{dw}$을 어떤 손실에도 쓸 수 있는 함수로 만들고, 배율 $(1 - 2\\eta)$로 학습률을 진단합니다.

1. \`gradient_descent(grad, w0, lr, steps)\`: 기울기 함수 \`grad\`를 받아 \`steps\`번 갱신하고, **매 스텝 갱신 뒤의 $w$**를 담은 리스트를 돌려줍니다.
2. \`diagnose(lr)\`: $L(w) = (w-3)^2$에서 오차 $w - 3$이 매 스텝 $(1 - 2\\eta)$배가 된다는 사실을 이용해 \`"수렴"\`, \`"진동하며 수렴"\`, \`"발산"\` 중 하나를 돌려줍니다. 배율의 절댓값이 1 이상이면 0으로 줄지 않으므로 \`"발산"\`으로 분류합니다.
`,
      starter: py`
def gradient_descent(grad, w0, lr, steps):
    """w ← w - lr * grad(w)를 steps번 반복하고, 매 스텝 뒤의 w를 담은 리스트를 돌려준다"""
    w, history = w0, []
    for _ in range(steps):
        # TODO: 갱신식을 적용하고 history에 w를 추가합니다.
        pass
    return history

def diagnose(lr):
    """L(w) = (w-3)² 에서 학습률 lr의 수렴 양상: "수렴" / "진동하며 수렴" / "발산" """
    factor = 1 - 2 * lr
    # TODO: factor의 부호와 크기로 판단합니다.
    return ""

grad = lambda w: 2 * (w - 3)
print([round(w, 4) for w in gradient_descent(grad, 0.0, 0.1, 5)])
for lr in (0.01, 0.1, 0.5, 0.9, 1.1):
    print(f"lr={lr}: {diagnose(lr)}")
`,
      tests: py`
grad = lambda w: 2 * (w - 3)

@test("첫 스텝: w0=0, lr=0.1 → 0.6")
def _():
    h = gradient_descent(grad, 0.0, 0.1, 1)
    assert len(h) == 1 and approx(h[0], 0.6), f"history: {h}"

@test("30스텝 뒤 3에 가까워진다")
def _():
    h = gradient_descent(grad, 0.0, 0.1, 30)
    assert len(h) == 30 and abs(h[-1] - 3) < 0.01, f"마지막 w: {h[-1] if h else None}"

@test("오차가 매 스텝 (1 - 2·lr)배가 된다 (lr=0.2)")
def _():
    errs = [w - 3 for w in gradient_descent(grad, 0.0, 0.2, 3)]
    assert approx(errs, [-1.8, -1.08, -0.648]), f"오차: {errs}"

@test("다른 손실의 기울기도 받는다: L = w² + 4w + 1")
def _():
    h = gradient_descent(lambda w: 2 * w + 4, 1.0, 0.1, 1)
    assert approx(h[0], 0.4), f"history: {h}"

@test("진단: 0.1 수렴, 0.9 진동하며 수렴, 1.1 발산")
def _():
    got = [diagnose(lr) for lr in (0.1, 0.9, 1.1)]
    assert got == ["수렴", "진동하며 수렴", "발산"], f"결과: {got}"

@test("경계값: 0.5는 한 번에 도착(수렴), 1.0은 제자리 진동(발산)")
def _():
    assert diagnose(0.5) == "수렴" and diagnose(1.0) == "발산", f"{diagnose(0.5)}, {diagnose(1.0)}"
`,
      hints: [
        "반복문 안에서 `w = w - lr * grad(w)`로 갱신한 뒤 `history.append(w)`를 합니다.",
        "배율이 0 이상 1 미만이면 같은 부호로 줄어들고, -1과 0 사이면 부호가 번갈아 바뀌며 줄어듭니다.",
        "`if abs(factor) >= 1: return \"발산\"`을 먼저 검사하고, 그다음 `factor < 0`이면 진동하며 수렴, 아니면 수렴입니다.",
      ],
      solution: py`
def gradient_descent(grad, w0, lr, steps):
    w, history = w0, []
    for _ in range(steps):
        w = w - lr * grad(w)
        history.append(w)
    return history

def diagnose(lr):
    factor = 1 - 2 * lr
    if abs(factor) >= 1:
        return "발산"
    if factor < 0:
        return "진동하며 수렴"
    return "수렴"

grad = lambda w: 2 * (w - 3)
print([round(w, 4) for w in gradient_descent(grad, 0.0, 0.1, 5)])
for lr in (0.01, 0.1, 0.5, 0.9, 1.1):
    print(f"lr={lr}: {diagnose(lr)}")
`,
    },
  ],

  quiz: [
    {
      kind: "choice",
      id: "w1-drill-tuple",
      tier: "core",
      sectionId: "python-basics",
      question: "`point = (37.5, 127.0)` 다음 줄에서 `point[0] = 36.0`을 실행하면?",
      choices: [
        "`point`가 `(36.0, 127.0)`이 된다",
        "`TypeError`가 발생한다. 튜플은 만든 뒤 원소를 바꿀 수 없다",
        "새 튜플이 만들어지고 원래 튜플은 그대로 남는다",
        "`point`가 리스트로 바뀐 뒤 값이 바뀐다",
      ],
      answer: 1,
      explanation:
        "튜플은 불변(immutable) 자료형이라 원소 대입을 지원하지 않습니다. 위도·경도처럼 바뀌면 안 되는 묶음을 실수로 고치지 못하게 할 때 튜플을 씁니다. 값을 바꾸려면 `point = (36.0, point[1])`처럼 새 튜플을 만들어야 합니다.",
    },
    {
      kind: "choice",
      id: "w1-drill-keepdims",
      tier: "core",
      sectionId: "dev-tools",
      question: "shape이 `(4, 3)`인 `scores`에 대해 `scores - scores.mean(axis=1, keepdims=True)`의 결과는?",
      choices: ["shape `(4, 3)`: 각 행에서 그 행의 평균을 뺀 배열", "shape `(4,)`인 배열", "브로드캐스팅 오류", "shape `(3, 4)`: 전치된 배열"],
      answer: 0,
      explanation:
        "`keepdims=True`이면 평균의 shape이 `(4,)`가 아니라 `(4, 1)`로 남습니다. 뒤쪽 축부터 비교하면 3과 1이므로 1인 축이 3으로 복제되어 `(4, 3)`끼리의 뺄셈이 됩니다. `keepdims` 없이 `(4,)`를 빼면 3 ≠ 4라 오류가 납니다.",
    },
    {
      kind: "choice",
      id: "w1-drill-lr075",
      tier: "core",
      sectionId: "gradient-descent",
      question: "$L(w) = (w-3)^2$를 학습률 $\\eta = 0.75$로 경사하강법할 때, 오차 $w - 3$은 매 스텝 어떻게 변하는가?",
      choices: ["0.5배씩 줄며 부호가 유지된다", "−0.5배가 된다: 부호가 번갈아 바뀌며 줄어든다", "1.5배씩 커지며 발산한다", "첫 스텝에 정확히 0이 된다"],
      answer: 1,
      explanation:
        "배율은 $1 - 2\\eta = 1 - 1.5 = -0.5$입니다. 절댓값이 1보다 작으니 수렴하지만, 음수이므로 최솟값을 매번 건너뛰며 좌우로 진동합니다. $\\eta = 0.5$이면 배율이 0이라 한 번에 도착하고, $\\eta > 1$이면 절댓값이 1을 넘어 발산합니다.",
    },
    {
      kind: "choice",
      id: "w1-drill-entropy-mask",
      tier: "core",
      sectionId: "entropy",
      question: "엔트로피 구현의 `p = p[p > 0]` 줄을 지우고 `entropy([1.0, 0.0])`을 계산하면?",
      choices: ["0.0이 정상적으로 나온다", "`nan`이 나온다. $0 \\cdot \\log 0$이 `0 * -inf = nan`이 되기 때문이다", "1.0이 나온다", "`ZeroDivisionError`가 발생한다"],
      answer: 1,
      explanation:
        "NumPy에서 `np.log2(0)`은 `-inf`이고 `0 * -inf`는 `nan`입니다. 수학에서는 극한으로 $0 \\cdot \\log 0 = 0$이라 정의하므로, 코드에서도 확률이 0인 항을 빼고 더해야 정의와 같아집니다.",
    },
    {
      kind: "predict",
      id: "w1-drill-slicing",
      tier: "core",
      sectionId: "python-basics",
      code: py`
scores = [90, 85, 77, 60]
print(scores[-2:], scores[::2])
passed = [s for s in scores if s >= 80]
print(len(passed), sum(passed) / len(passed))
`,
      expected: "[77, 60] [90, 77]\n2 87.5",
      explanation:
        "`scores[-2:]`는 뒤에서 두 번째부터 끝까지, `scores[::2]`는 처음부터 두 칸씩 건너뛴 원소입니다. 80점 이상은 90과 85 두 개이고 평균은 87.5입니다.",
    },
    {
      kind: "predict",
      id: "w1-drill-alias",
      tier: "core",
      sectionId: "python-basics",
      code: py`
a = [1, 2, 3]
b = a
c = a.copy()
b.append(4)
c.append(5)
print(a, len(c), a is b)
`,
      expected: "[1, 2, 3, 4] 4 True",
      explanation:
        "`b = a`는 같은 리스트에 이름표를 하나 더 붙인 것이라 `b.append(4)`가 `a`에도 보입니다. `c`는 복사본이라 `c`에만 5가 붙어 길이가 4입니다. `a is b`는 두 이름이 같은 객체를 가리키므로 `True`입니다.",
    },
    {
      kind: "predict",
      id: "w1-drill-axis",
      tier: "core",
      sectionId: "dev-tools",
      code: py`
import numpy as np
x = np.array([[1, 2, 3],
              [4, 5, 6]])
print(x.shape, x.sum(axis=0))
print(x.mean(axis=1))
`,
      expected: "(2, 3) [5 7 9]\n[2. 5.]",
      explanation:
        "axis=0은 행 방향으로 훑어 같은 열끼리 더하므로 `[1+4, 2+5, 3+6]`입니다. axis=1은 같은 행끼리 평균을 내 `[2, 5]`이고, 평균은 실수라 `2.`처럼 소수점이 붙어 출력됩니다.",
    },
    {
      kind: "predict",
      id: "w1-drill-gdsteps",
      tier: "core",
      sectionId: "gradient-descent",
      code: py`
w, lr = 0.0, 0.1
for step in range(3):
    grad = 2 * (w - 3)
    w -= lr * grad
    print(step + 1, round(w, 3))
`,
      expected: "1 0.6\n2 1.08\n3 1.464",
      explanation:
        "오차 $w - 3$이 매 스텝 $1 - 2 \\times 0.1 = 0.8$배가 됩니다. 오차가 $-3 \\to -2.4 \\to -1.92 \\to -1.536$이므로 $w$는 0.6, 1.08, 1.464입니다.",
    },
    {
      kind: "descriptive",
      id: "w1-drill-cosine-why",
      tier: "core",
      sectionId: "vectors",
      question:
        "검색 시스템이 문서 유사도에 내적 대신 코사인 유사도를 쓰는 이유를 \"긴 문서와 짧은 문서\" 관점에서 설명하십시오. 실습에서 $b$를 10배 했을 때의 결과를 근거로 듭니다.",
      modelAnswer:
        "내적은 두 벡터의 크기에 비례해 커지므로, 단어 수가 많아 벡터가 긴 문서는 내용이 덜 관련되어도 내적 점수가 커집니다. 실습에서 $b$를 10배 하면 $a \\cdot b$는 4에서 40으로 커졌지만 코사인 유사도는 0.8로 그대로였습니다. 코사인은 크기로 나눠 방향(단어 구성 비율)만 비교하므로 문서 길이에 따른 편향 없이 내용의 비슷함을 잴 수 있습니다.",
      keyPoints: ["내적은 벡터 크기(문서 길이)에 비례해 커진다", "b를 10배 해도 코사인은 0.8로 같았다는 실습 근거", "코사인은 크기로 나눠 방향만 비교한다", "긴 문서가 부당하게 유리해지는 문제를 막는다"],
    },
    {
      kind: "descriptive",
      id: "w1-drill-baserate",
      tier: "core",
      sectionId: "probability",
      question:
        "자연 빈도 실습에서 같은 검사(민감도 99%, 위양성률 5%)인데 유병률 1%와 10%의 $P(\\text{병} \\mid \\text{양성})$이 약 16.7%와 68.8%로 크게 다른 이유를, 1만 명 기준 TP와 FP의 **사람 수**로 설명하십시오.",
      modelAnswer:
        "유병률 1%면 환자 100명 중 99명(TP)이 양성이지만, 건강한 9,900명 중 5%인 495명(FP)도 양성이라 양성 594명 중 환자는 99명(16.7%)뿐입니다. 유병률 10%면 환자 1,000명 중 990명(TP)이 양성이고 건강한 9,000명 중 450명(FP)이 양성이라 1,440명 중 990명(68.8%)이 환자입니다. 검사 성능은 같아도 기저율이 낮으면 건강한 사람이 압도적으로 많아 FP의 절대 수가 TP를 압도합니다.",
      keyPoints: ["1%: TP 99명, FP 495명", "10%: TP 990명, FP 450명", "사후확률 = TP / (TP + FP)", "기저율이 낮으면 FP의 절대 수가 TP보다 많아진다"],
    },
    {
      kind: "descriptive",
      id: "w1-drill-diagnose-limit",
      tier: "core",
      sectionId: "gradient-descent",
      question:
        "`diagnose(lr)`가 학습률만 보고 수렴 여부를 판정할 수 있는 이유는 무엇입니까? 또 이 방법을 신경망 손실에 그대로 쓸 수 없는 이유를 변수가 두 개인 실습(협곡 모양 손실)과 연결해 설명하십시오.",
      modelAnswer:
        "$L = (w-3)^2$은 기울기가 오차에 비례하는 2차 함수라, 어느 위치에서든 오차가 정확히 $(1-2\\eta)$배가 됩니다. 그래서 배율만 보면 수렴·진동·발산을 판정할 수 있습니다. 그러나 실제 손실은 곡률(2차 미분)이 위치와 방향마다 다릅니다. 변수가 두 개인 실습에서도 가파른 방향의 배율은 $(1-20\\eta)$, 완만한 방향은 $(1-2\\eta)$로 달라 같은 학습률이 한 방향에서는 발산하고 다른 방향에서는 느리게 수렴했습니다. 신경망에서는 이런 방향이 수백만 개이고 학습 중에 곡률도 바뀌므로 하나의 배율로 판단할 수 없습니다.",
      keyPoints: ["2차 함수라 오차가 항상 같은 배율로 줄어든다", "곡률은 위치·방향마다 다르다", "협곡 실습의 배율 $(1-20\\eta)$와 $(1-2\\eta)$", "가장 가파른 방향이 학습률 상한을 정한다"],
    },
  ],

  assignment: {
    requirements: [
      "`grad`의 TODO 두 줄을 직접 유도한 편미분으로 채우고, 학습 결과 $w \\approx 2$, $b \\approx 1$을 얻는다.",
      "학습률 0.001·0.01·0.1·0.5의 loss 곡선을 로그 축 그래프 하나에 그리고, 수렴 속도와 안정성을 비교해 설명한다.",
      "`np.linalg.lstsq` 해석해와 경사하강법 결과의 차이를 출력하고, 차이의 원인을 설명한다.",
      "`posterior`를 완성해 유병률 0.1%·1%·10%·30%의 사후확률을 계산하고 기저율의 영향을 설명한다.",
      "시드(42)를 고정해, 실행 환경을 초기화한 뒤 처음부터 실행해도 같은 결과가 나온다.",
    ],
    autoTests: [
      {
        id: "w1-at-grad",
        taskId: "gd",
        title: "grad가 수치미분과 일치한다",
        code: py`
for w0, b0 in [(0.0, 0.0), (1.5, -0.5)]:
    dw, db = grad(w0, b0)
    h = 1e-6
    num_dw = (loss(w0 + h, b0) - loss(w0 - h, b0)) / (2 * h)
    num_db = (loss(w0, b0 + h) - loss(w0, b0 - h)) / (2 * h)
    assert abs(dw - num_dw) < 1e-4 and abs(db - num_db) < 1e-4, (
        f"(w, b) = ({w0}, {b0})에서 grad = ({dw:.4f}, {db:.4f}), 수치미분 = ({num_dw:.4f}, {num_db:.4f})")
`,
        hint: "평균의 1/n과 제곱을 미분할 때 나오는 2를 빠뜨리지 않았는지 확인하십시오.",
      },
      {
        id: "w1-at-train",
        taskId: "gd",
        title: "학습 결과가 w ≈ 2, b ≈ 1이고 손실이 줄었다",
        code: py`
assert abs(w - 2) < 0.1 and abs(b - 1) < 0.1, f"w = {w:.3f}, b = {b:.3f}"
assert history[-1] < history[0], "손실이 줄지 않았습니다."
`,
        hint: "`grad`를 고친 뒤 첫 코드 셀을 다시 실행해야 `w`, `b`, `history`가 새로 계산됩니다.",
      },
      {
        id: "w1-at-lstsq",
        taskId: "lstsq",
        title: "경사하강법 결과가 해석해와 0.01 이내",
        code: py`
assert abs(w - w_star) < 0.01 and abs(b - b_star) < 0.01, f"|Δw| = {abs(w - w_star):.2e}, |Δb| = {abs(b - b_star):.2e}"
`,
      },
      {
        id: "w1-at-bayes",
        taskId: "bayes",
        title: "posterior가 베이즈 정리와 일치하고 유병률에 따라 커진다",
        code: py`
assert abs(posterior(0.01) - 0.0099 / 0.0594) < 1e-4, f"posterior(0.01) = {posterior(0.01)}"
vals = [posterior(p) for p in (0.001, 0.01, 0.1, 0.3)]
assert all(a < b for a, b in zip(vals, vals[1:])), f"유병률 순서대로의 값: {vals}"
assert abs(posterior(0.3, 0.9, 0.1) - 0.27 / (0.27 + 0.07)) < 1e-4, "민감도·위양성률 인자를 반영하지 않았습니다."
`,
        hint: "전체 확률의 법칙: $P(\\text{양성}) = P(\\text{양성} \\mid \\text{병})P(\\text{병}) + P(\\text{양성} \\mid \\text{건강})P(\\text{건강})$",
      },
    ],
    challenges: [
      {
        id: "w1-ch-minibatch",
        title: "미니배치 확률적 경사하강법",
        tier: "advanced",
        prompt: `
과제의 선형회귀를 **미니배치 SGD**로 바꿉니다. 에폭마다 데이터를 섞고(\`rng.permutation\`) \`batch_size\`개씩 잘라, 그 배치의 MSE 기울기로 $w, b$를 갱신합니다. 에폭이 끝날 때마다 **전체 데이터**의 MSE를 기록합니다.

배치 크기 1, 10, 100의 결과를 비교해 보십시오. 배치 100(전체)은 과제의 일반 경사하강법과 정확히 같아야 합니다.
`,
        starter: py`
import numpy as np

rng = np.random.default_rng(42)
n = 100
x = rng.uniform(-3, 3, n)
y = 2 * x + 1 + rng.normal(0, 0.5, n)

def minibatch_sgd(x, y, lr=0.05, batch_size=10, epochs=50, seed=0):
    """반환: (w, b, 에폭마다 전체 데이터 MSE를 담은 리스트)"""
    rng = np.random.default_rng(seed)
    w, b = 0.0, 0.0
    losses = []
    for epoch in range(epochs):
        order = rng.permutation(len(x))
        for start in range(0, len(x), batch_size):
            idx = order[start:start + batch_size]
            xb, yb = x[idx], y[idx]
            # TODO: 배치에서 MSE의 기울기 dw, db를 구하고 w, b를 갱신합니다.
        losses.append(float(np.mean((w * x + b - y) ** 2)))
    return w, b, losses

for bs in (1, 10, 100):
    w, b, losses = minibatch_sgd(x, y, batch_size=bs)
    print(f"batch={bs:>3}: w={w:.3f}, b={b:.3f}, 마지막 loss={losses[-1]:.4f}")
`,
        tests: py`
import numpy as np
rng = np.random.default_rng(42)
xx = rng.uniform(-3, 3, 100)
yy = 2 * xx + 1 + rng.normal(0, 0.5, 100)
w_star, b_star = np.linalg.lstsq(np.column_stack([xx, np.ones(100)]), yy, rcond=None)[0]

@test("batch 10: 해석해와 0.05 이내")
def _():
    w, b, losses = minibatch_sgd(xx, yy, lr=0.05, batch_size=10, epochs=50)
    assert abs(w - w_star) < 0.05 and abs(b - b_star) < 0.05, f"w={w:.3f}, b={b:.3f} / 해석해 {w_star:.3f}, {b_star:.3f}"

@test("에폭마다 손실을 기록하고, 손실이 줄었다")
def _():
    w, b, losses = minibatch_sgd(xx, yy, batch_size=10, epochs=20)
    assert len(losses) == 20 and losses[-1] < losses[0], f"손실 기록: {losses[:3]} ..."

@test("배치 100(전체)이면 일반 경사하강법과 같다")
def _():
    w, b, _ = minibatch_sgd(xx, yy, lr=0.1, batch_size=100, epochs=200)
    w2, b2 = 0.0, 0.0
    for _ in range(200):
        err = w2 * xx + b2 - yy
        w2, b2 = w2 - 0.1 * np.mean(2 * err * xx), b2 - 0.1 * np.mean(2 * err)
    assert approx(w, w2) and approx(b, b2), f"({w}, {b}) vs ({w2}, {b2})"

@test("같은 seed면 같은 결과(재현성)")
def _():
    assert minibatch_sgd(xx, yy, seed=3)[:2] == minibatch_sgd(xx, yy, seed=3)[:2]
`,
        hints: [
          "배치의 오차는 `err = w * xb + b - yb`입니다. 기울기는 전체 데이터 대신 배치에서 평균을 냅니다.",
          "`dw = np.mean(2 * err * xb)`, `db = np.mean(2 * err)`입니다.",
          "두 파라미터를 같은 기울기 시점에서 갱신해야 합니다. `w -= lr * dw`와 `b -= lr * db`를 기울기를 모두 구한 뒤에 실행합니다.",
        ],
        solution: py`
import numpy as np

rng = np.random.default_rng(42)
n = 100
x = rng.uniform(-3, 3, n)
y = 2 * x + 1 + rng.normal(0, 0.5, n)

def minibatch_sgd(x, y, lr=0.05, batch_size=10, epochs=50, seed=0):
    rng = np.random.default_rng(seed)
    w, b = 0.0, 0.0
    losses = []
    for epoch in range(epochs):
        order = rng.permutation(len(x))
        for start in range(0, len(x), batch_size):
            idx = order[start:start + batch_size]
            xb, yb = x[idx], y[idx]
            err = w * xb + b - yb
            dw, db = np.mean(2 * err * xb), np.mean(2 * err)
            w -= lr * dw
            b -= lr * db
        losses.append(float(np.mean((w * x + b - y) ** 2)))
    return w, b, losses

for bs in (1, 10, 100):
    w, b, losses = minibatch_sgd(x, y, batch_size=bs)
    print(f"batch={bs:>3}: w={w:.3f}, b={b:.3f}, 마지막 loss={losses[-1]:.4f}")
`,
      },
      {
        id: "w1-ch-gradcheck",
        title: "수치미분으로 기울기 검산하기 (gradient check)",
        tier: "advanced",
        prompt: `
손으로 유도한 기울기가 맞는지 확인하는 표준 방법인 **gradient check**를 일반 함수로 만듭니다. 3주차 역전파 구현을 검증할 때도 그대로 씁니다.

1. \`numerical_grad(f, params, eps)\`: 파라미터 리스트의 각 성분만 $\\pm\\varepsilon$ 움직여 중앙 차분 $\\dfrac{f(\\theta + \\varepsilon) - f(\\theta - \\varepsilon)}{2\\varepsilon}$을 구합니다. 원래 \`params\`는 바꾸지 않습니다.
2. \`relative_error(a, b)\` $= \\dfrac{|a - b|}{\\max(10^{-12}, |a| + |b|)}$

일부러 틀린 기울기(2를 빠뜨린 것)를 넣었을 때 상대오차가 크게 나오는지도 확인합니다.
`,
        starter: py`
def numerical_grad(f, params, eps=1e-6):
    """f(params)의 각 성분에 대한 중앙 차분 기울기 리스트. params는 float 리스트"""
    grads = []
    for i in range(len(params)):
        plus, minus = list(params), list(params)
        # TODO: i번째 성분만 ±eps 움직이고 (f(plus) - f(minus)) / (2 * eps)를 grads에 추가합니다.
    return grads

def relative_error(a, b):
    return 0.0  # TODO: |a - b| / max(1e-12, |a| + |b|)

xs, ys = [1.0, 2.0, 3.0], [3.0, 5.0, 7.5]

def loss(params):
    w, b = params
    return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

def analytic_grad(params):
    w, b = params
    n = len(xs)
    dw = sum(2 * (w * x + b - y) * x for x, y in zip(xs, ys)) / n
    db = sum(2 * (w * x + b - y) for x, y in zip(xs, ys)) / n
    return [dw, db]

p = [0.5, -1.0]
num, ana = numerical_grad(loss, p), analytic_grad(p)
print("수치미분:", num)
print("해석적  :", ana)
print("상대오차:", [relative_error(a, b) for a, b in zip(ana, num)])
`,
        tests: py`
@test("f = (a-1)² + 3b² 의 기울기 = [2(a-1), 6b]")
def _():
    g = numerical_grad(lambda p: (p[0] - 1) ** 2 + 3 * p[1] ** 2, [2.0, -1.0])
    assert len(g) == 2 and approx(g, [2.0, -6.0], 1e-5), f"결과: {g}"

@test("원래 params 리스트를 바꾸지 않는다")
def _():
    p = [0.3, 0.7]
    numerical_grad(lambda q: q[0] * q[1], p)
    assert p == [0.3, 0.7], f"params가 {p}로 바뀌었습니다."

@test("relative_error 정의")
def _():
    assert approx(relative_error(1.0, 1.1), 0.1 / 2.1) and relative_error(0.0, 0.0) == 0.0

@test("MSE의 해석적 기울기와 상대오차 1e-6 미만")
def _():
    p = [0.5, -1.0]
    num, ana = numerical_grad(loss, p), analytic_grad(p)
    assert len(num) == 2 and all(relative_error(a, b) < 1e-6 for a, b in zip(ana, num)), f"{num} vs {ana}"

@test("틀린 기울기(2를 빠뜨림)는 큰 상대오차로 잡아낸다")
def _():
    p = [0.5, -1.0]
    wrong = [g / 2 for g in analytic_grad(p)]
    num = numerical_grad(loss, p)
    assert len(num) == 2 and max(relative_error(a, b) for a, b in zip(wrong, num)) > 0.1
`,
        hints: [
          "`plus[i] += eps`, `minus[i] -= eps`로 i번째 성분만 움직입니다. `list(params)`로 복사했으므로 원본은 그대로입니다.",
          "`grads.append((f(plus) - f(minus)) / (2 * eps))`",
          "`relative_error`는 `abs(a - b) / max(1e-12, abs(a) + abs(b))`입니다. 분모의 1e-12는 둘 다 0일 때 0으로 나누는 것을 막습니다.",
        ],
        solution: py`
def numerical_grad(f, params, eps=1e-6):
    grads = []
    for i in range(len(params)):
        plus, minus = list(params), list(params)
        plus[i] += eps
        minus[i] -= eps
        grads.append((f(plus) - f(minus)) / (2 * eps))
    return grads

def relative_error(a, b):
    return abs(a - b) / max(1e-12, abs(a) + abs(b))

xs, ys = [1.0, 2.0, 3.0], [3.0, 5.0, 7.5]

def loss(params):
    w, b = params
    return sum((w * x + b - y) ** 2 for x, y in zip(xs, ys)) / len(xs)

def analytic_grad(params):
    w, b = params
    n = len(xs)
    dw = sum(2 * (w * x + b - y) * x for x, y in zip(xs, ys)) / n
    db = sum(2 * (w * x + b - y) for x, y in zip(xs, ys)) / n
    return [dw, db]

p = [0.5, -1.0]
num, ana = numerical_grad(loss, p), analytic_grad(p)
print("수치미분:", num)
print("해석적  :", ana)
print("상대오차:", [relative_error(a, b) for a, b in zip(ana, num)])
`,
      },
    ],
  },
};

export default week1;
