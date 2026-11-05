import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
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
