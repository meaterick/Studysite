import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "인덱스·슬라이스·마스크로 원소 고르기",
    prompt: md`

\`x = np.arange(12).reshape(3, 4)\`에서 다음을 고릅니다. 먼저 본문의 출력처럼 배열을 종이에 적고 위치를 확인한 뒤 코드를 씁니다.

1. \`corner\`: 마지막 행의 마지막 열 원소
2. \`middle_row\`: 가운데 행 전체
3. \`last_col\`: 마지막 열 전체
4. \`top_left\`: 앞의 두 행과 앞의 두 열로 된 $2 \times 2$ 부분
5. \`evens\`: 짝수인 원소만 모은 1차원 배열(불리언 마스크)
`,
    starter: py`
import numpy as np

x = np.arange(12).reshape(3, 4)
print(x)

corner = None       # TODO
middle_row = None   # TODO
last_col = None     # TODO
top_left = None     # TODO
evens = None        # TODO

print(corner, middle_row, last_col)
print(top_left)
print(evens)
`,
    tests: py`
import numpy as np

@test("원소 하나와 행 하나")
def _():
    assert corner == 11, f"corner: {corner}"
    assert middle_row is not None and np.array_equal(middle_row, [4, 5, 6, 7]), f"middle_row: {middle_row}"

@test("마지막 열 [3, 7, 11]")
def _():
    assert last_col is not None and np.array_equal(last_col, [3, 7, 11]), f"last_col: {last_col}"

@test("왼쪽 위 2×2 부분")
def _():
    assert top_left is not None and np.array_equal(top_left, [[0, 1], [4, 5]]), f"top_left: {top_left}"

@test("짝수만 고르기")
def _():
    assert evens is not None and np.array_equal(evens, [0, 2, 4, 6, 8, 10]), f"evens: {evens}"
`,
    hints: [
      "`x[2, 3]`이나 `x[-1, -1]`이 마지막 원소입니다. 가운데 행은 `x[1]`, 마지막 열은 `x[:, -1]`입니다.",
      "부분 행렬은 축마다 슬라이스를 씁니다: `x[:2, :2]`. 짝수는 `x[x % 2 == 0]`입니다.",
    ],
    solution: py`
import numpy as np

x = np.arange(12).reshape(3, 4)
print(x)

corner = x[-1, -1]
middle_row = x[1]
last_col = x[:, -1]
top_left = x[:2, :2]
evens = x[x % 2 == 0]

print(corner, middle_row, last_col)
print(top_left)
print(evens)
`,
  },
  {
    key: "ex1",
    title: "마스킹·정수 배열 인덱싱·브로드캐스팅으로 데이터 다루기",
    prompt: md`

**반복문 없이** NumPy 연산만으로 구현합니다.

1. \`center_rows(X)\`: 각 행에서 그 행의 평균을 뺀 배열(모양 유지). \`keepdims=True\`로 모양 \`(행 수, 1)\`인 평균을 만들어 뺍니다.
2. \`count_at_least(X, threshold)\`: \`threshold\` 이상인 원소의 개수(정수)
3. \`rows_with_label(X, y, label)\`: 레이블 배열 \`y\`가 \`label\`인 샘플(행)만 고른 행렬
4. \`top_k_indices(x, k)\`: 1차원 배열 \`x\`에서 값이 큰 순서대로 \`k\`개의 인덱스. \`np.argsort\`를 씁니다.
5. \`correct_probs(probs, labels)\`: 모양 \`(n, k)\`인 확률 배열에서 샘플마다 정답 클래스의 확률, 모양 \`(n,)\`
`,
    starter: py`
import numpy as np

def center_rows(X):
    X = np.asarray(X, dtype=float)
    return X  # TODO

def count_at_least(X, threshold):
    return 0  # TODO: 불리언 마스크의 합

def rows_with_label(X, y, label):
    return X  # TODO: y == label 마스크로 행을 고릅니다.

def top_k_indices(x, k):
    return np.array([], dtype=int)  # TODO: argsort 결과를 뒤집어 앞의 k개

def correct_probs(probs, labels):
    return np.zeros(len(labels))  # TODO: probs[np.arange(n), labels]

X = np.array([[90, 80, 70],
              [60, 90, 80],
              [85, 75, 95]])
y = np.array([1, 0, 1])
print(center_rows(X)[0])                         # 기대: [ 10.   0. -10.]
print(count_at_least(X, 85))                     # 기대: 4
print(rows_with_label(X, y, 1))                  # 기대: 0행과 2행
print(top_k_indices(np.array([5, 1, 9, 7]), 2))  # 기대: [2 3]
probs = np.array([[0.7, 0.2, 0.1], [0.1, 0.8, 0.1]])
print(correct_probs(probs, np.array([0, 2])))    # 기대: [0.7 0.1]
`,
    tests: py`
import numpy as np
X = np.array([[90, 80, 70], [60, 90, 80], [85, 75, 95]])
y = np.array([1, 0, 1])

@test("center_rows: 모양 유지, 각 행의 평균이 0, 첫 행 [10, 0, -10]")
def _():
    c = np.asarray(center_rows(X))
    assert c.shape == (3, 3), f"모양: {c.shape}"
    assert approx(c.mean(axis=1), [0, 0, 0]) and approx(c[0], [10, 0, -10]), f"결과: {c}"

@test("count_at_least: 85 이상 4개, 정수로 돌려준다")
def _():
    got = count_at_least(X, 85)
    assert got == 4 and isinstance(got, (int, np.integer)), f"결과: {got!r}"

@test("rows_with_label: 레이블 1인 행 2개, 레이블 0인 행 1개")
def _():
    r1, r0 = np.asarray(rows_with_label(X, y, 1)), np.asarray(rows_with_label(X, y, 0))
    assert r1.shape == (2, 3) and approx(r1, X[[0, 2]]), f"레이블 1: {r1}"
    assert r0.shape == (1, 3) and approx(r0, X[[1]]), f"레이블 0: {r0}"

@test("top_k_indices: 값이 큰 순서")
def _():
    assert list(np.asarray(top_k_indices(np.array([5, 1, 9, 7]), 2))) == [2, 3]
    assert list(np.asarray(top_k_indices(np.array([0.2, 0.9, 0.5]), 3))) == [1, 2, 0]

@test("correct_probs: 모양 (n,), 샘플마다 정답 클래스의 확률")
def _():
    probs = np.array([[0.7, 0.2, 0.1], [0.1, 0.8, 0.1], [0.6, 0.3, 0.1]])
    got = np.asarray(correct_probs(probs, np.array([0, 1, 2])))
    assert got.shape == (3,) and approx(got, [0.7, 0.8, 0.1]), f"결과: {got}"
`,
    hints: [
      "`center_rows`는 `X - X.mean(axis=1, keepdims=True)`입니다. `keepdims` 없이 빼면 모양 `(3,)`이 행 방향으로 적용되어 열 평균처럼 계산됩니다.",
      "`count_at_least`는 `int((X >= threshold).sum())`, `rows_with_label`은 `X[y == label]`입니다.",
      "`np.argsort(x)`는 작은 값부터의 인덱스이므로 `np.argsort(x)[::-1][:k]`로 뒤집어 앞의 `k`개를 고릅니다.",
    ],
    solution: py`
import numpy as np

def center_rows(X):
    X = np.asarray(X, dtype=float)
    return X - X.mean(axis=1, keepdims=True)

def count_at_least(X, threshold):
    return int((np.asarray(X) >= threshold).sum())

def rows_with_label(X, y, label):
    return np.asarray(X)[np.asarray(y) == label]

def top_k_indices(x, k):
    return np.argsort(x)[::-1][:k]

def correct_probs(probs, labels):
    probs = np.asarray(probs)
    return probs[np.arange(len(labels)), labels]

X = np.array([[90, 80, 70],
              [60, 90, 80],
              [85, 75, 95]])
y = np.array([1, 0, 1])
print(center_rows(X)[0])
print(count_at_least(X, 85))
print(rows_with_label(X, y, 1))
print(top_k_indices(np.array([5, 1, 9, 7]), 2))
probs = np.array([[0.7, 0.2, 0.1], [0.1, 0.8, 0.1]])
print(correct_probs(probs, np.array([0, 2])))
`,
  },
]);
