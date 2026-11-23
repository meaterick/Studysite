import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "반복문을 np.where와 집계로 바꾸기",
    prompt: md`

반복문으로 작성한 두 함수 \`discount_loop\`, \`count_loop\`가 주어집니다. 같은 결과를 반복문 없이 계산하는 함수를 작성합니다.

1. \`discount_vec(prices)\`: 10,000 이상인 가격만 0.9를 곱한 배열. 본문 예제의 네 단계처럼 마스크를 만든 뒤 \`np.where\`를 씁니다.
2. \`count_vec(prices, threshold)\`: \`threshold\` 이상인 가격의 개수. 마스크의 \`sum()\`을 씁니다.
`,
    starter: py`
import numpy as np

def discount_loop(prices):
    return np.array([p * 0.9 if p >= 10000 else p for p in prices], dtype=float)

def count_loop(prices, threshold):
    count = 0
    for p in prices:
        if p >= threshold:
            count += 1
    return count

def discount_vec(prices):
    prices = np.asarray(prices)
    return prices   # TODO: np.where(조건, 할인한 값, 원래 값)

def count_vec(prices, threshold):
    prices = np.asarray(prices)
    return 0        # TODO: 마스크의 합

prices = np.array([12000, 8000, 15000, 3000])
print(discount_vec(prices), count_vec(prices, 10000))
`,
    tests: py`
import numpy as np

@test("본문의 예: [10800, 8000, 13500, 3000]")
def _():
    got = discount_vec(np.array([12000, 8000, 15000, 3000]))
    assert np.allclose(got, [10800, 8000, 13500, 3000]), f"결과: {got}"

@test("반복문과 같은 결과")
def _():
    rng = np.random.default_rng(0)
    for _ in range(3):
        prices = rng.integers(1000, 20000, size=50)
        assert np.allclose(discount_vec(prices), discount_loop(prices)), "discount_loop와 결과가 다릅니다."
        assert count_vec(prices, 10000) == count_loop(prices, 10000), f"개수: {count_vec(prices, 10000)} / {count_loop(prices, 10000)}"

@test("개수: 2개, 0개")
def _():
    prices = np.array([12000, 8000, 15000, 3000])
    assert count_vec(prices, 10000) == 2, f"결과: {count_vec(prices, 10000)}"
    assert count_vec(prices, 20000) == 0
`,
    hints: [
      "`np.where(prices >= 10000, prices * 0.9, prices)`는 원소마다 조건이 참이면 둘째 값을, 거짓이면 셋째 값을 고릅니다.",
      "`(prices >= threshold).sum()`은 `True`를 1, `False`를 0으로 더하므로 조건을 만족하는 개수입니다.",
    ],
    solution: py`
import numpy as np

def discount_loop(prices):
    return np.array([p * 0.9 if p >= 10000 else p for p in prices], dtype=float)

def count_loop(prices, threshold):
    count = 0
    for p in prices:
        if p >= threshold:
            count += 1
    return count

def discount_vec(prices):
    prices = np.asarray(prices)
    return np.where(prices >= 10000, prices * 0.9, prices)

def count_vec(prices, threshold):
    prices = np.asarray(prices)
    return (prices >= threshold).sum()

prices = np.array([12000, 8000, 15000, 3000])
print(discount_vec(prices), count_vec(prices, 10000))
`,
  },
  {
    key: "ex1",
    title: "최근접 이웃 찾기를 벡터화하고 재현 가능한 분할 만들기",
    prompt: md`

1. \`pairwise_sq_dists(A, B)\`: 모양 \`(n, d)\`와 \`(m, d)\`인 두 점 집합 사이의 모든 거리 제곱, 모양 \`(n, m)\`. **반복문 없이** 브로드캐스팅으로 계산합니다.
2. \`nearest(A, B)\`: \`A\`의 점마다 가장 가까운 \`B\`의 점의 인덱스, 모양 \`(n,)\`
3. \`split_indices(n, test_ratio, seed)\`: \`0\`부터 \`n - 1\`까지의 인덱스를 \`np.random.default_rng(seed)\`의 \`permutation\`으로 섞은 뒤, 앞의 \`round(n * test_ratio)\`개를 평가용, 나머지를 학습용으로 나눠 \`(train_idx, test_idx)\`로 돌려줍니다. 같은 시드면 항상 같은 분할이 나와야 합니다.
`,
    starter: py`
import numpy as np

def pairwise_sq_dists(A, B):
    A, B = np.asarray(A, dtype=float), np.asarray(B, dtype=float)
    # TODO: A[:, None, :] - B[None, :, :]의 제곱을 마지막 축으로 합칩니다.
    return np.zeros((len(A), len(B)))

def nearest(A, B):
    # TODO: pairwise_sq_dists의 결과에서 행마다 가장 작은 값의 위치
    return np.zeros(len(A), dtype=int)

def split_indices(n, test_ratio=0.2, seed=0):
    rng = np.random.default_rng(seed)
    # TODO: rng.permutation(n)으로 섞고 앞부분을 평가용으로 나눕니다.
    return np.arange(n), np.array([], dtype=int)

A = np.array([[0.0, 0.0], [5.0, 5.0]])
B = np.array([[1.0, 0.0], [4.0, 4.0], [0.0, 3.0]])
print(pairwise_sq_dists(A, B))      # 기대: [[ 1. 32.  9.] [41.  2. 29.]]
print(nearest(A, B))                # 기대: [0 1]
train, test = split_indices(10, 0.3, seed=1)
print(len(train), len(test))        # 기대: 7 3
`,
    tests: py`
import numpy as np

@test("거리 제곱: 본문 예제와 반복문 결과가 같다")
def _():
    rng = np.random.default_rng(0)
    A, B = rng.normal(size=(6, 3)), rng.normal(size=(4, 3))
    want = np.array([[np.sum((a - b) ** 2) for b in B] for a in A])
    got = np.asarray(pairwise_sq_dists(A, B))
    assert got.shape == (6, 4) and approx(got, want), f"모양: {got.shape}"

@test("작은 예제: [[1, 32, 9], [41, 2, 29]]")
def _():
    A = np.array([[0.0, 0.0], [5.0, 5.0]])
    B = np.array([[1.0, 0.0], [4.0, 4.0], [0.0, 3.0]])
    assert approx(pairwise_sq_dists(A, B), [[1, 32, 9], [41, 2, 29]])

@test("nearest: 점마다 가장 가까운 점의 인덱스")
def _():
    A = np.array([[0.0, 0.0], [5.0, 5.0], [0.0, 2.9]])
    B = np.array([[1.0, 0.0], [4.0, 4.0], [0.0, 3.0]])
    assert list(np.asarray(nearest(A, B))) == [0, 1, 2]

@test("split_indices: 크기, 겹침 없음, 모든 인덱스 포함")
def _():
    train, test = split_indices(50, 0.2, seed=3)
    train, test = np.asarray(train), np.asarray(test)
    assert len(test) == 10 and len(train) == 40, f"{len(train)}, {len(test)}"
    assert len(set(train.tolist()) & set(test.tolist())) == 0
    assert sorted(train.tolist() + test.tolist()) == list(range(50))

@test("split_indices: 같은 시드면 같은 분할, 다른 시드면 다른 분할")
def _():
    a1, b1 = split_indices(50, 0.2, seed=3)
    a2, b2 = split_indices(50, 0.2, seed=3)
    a3, b3 = split_indices(50, 0.2, seed=4)
    assert np.array_equal(a1, a2) and np.array_equal(b1, b2)
    assert not np.array_equal(b1, b3)
`,
    hints: [
      "`((A[:, None, :] - B[None, :, :]) ** 2).sum(axis=2)`가 모양 `(n, m)`인 거리 제곱입니다.",
      "`nearest`는 `pairwise_sq_dists(A, B).argmin(axis=1)`입니다.",
      "`order = rng.permutation(n)`, `k = round(n * test_ratio)` 다음 `return order[k:], order[:k]`입니다.",
    ],
    solution: py`
import numpy as np

def pairwise_sq_dists(A, B):
    A, B = np.asarray(A, dtype=float), np.asarray(B, dtype=float)
    return ((A[:, None, :] - B[None, :, :]) ** 2).sum(axis=2)

def nearest(A, B):
    return pairwise_sq_dists(A, B).argmin(axis=1)

def split_indices(n, test_ratio=0.2, seed=0):
    rng = np.random.default_rng(seed)
    order = rng.permutation(n)
    k = round(n * test_ratio)
    return order[k:], order[:k]

A = np.array([[0.0, 0.0], [5.0, 5.0]])
B = np.array([[1.0, 0.0], [4.0, 4.0], [0.0, 3.0]])
print(pairwise_sq_dists(A, B))
print(nearest(A, B))
train, test = split_indices(10, 0.3, seed=1)
print(len(train), len(test))
`,
  },
]);
