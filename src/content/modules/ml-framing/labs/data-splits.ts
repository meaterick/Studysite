import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "세 부분 분할, 그룹 분할, 학습 데이터 통계로 표준화",
    prompt: md`

scikit-learn 없이 NumPy로 분할 함수를 만듭니다.

1. \`split_indices(n, val_frac, test_frac, seed=0)\`: \`np.random.default_rng(seed).permutation(n)\`으로 섞은 인덱스에서 앞의 \`round(n * test_frac)\`개를 테스트, 그다음 \`round(n * val_frac)\`개를 검증, 나머지를 학습 인덱스로 삼아 \`(train, val, test)\`를 돌려줍니다.
2. \`group_split(groups, test_frac, seed=0)\`: 샘플마다 속한 그룹이 \`groups\`에 있을 때, 서로 다른 그룹들을 \`np.unique\`로 구해 \`np.random.default_rng(seed).permutation\`으로 섞고 앞의 \`round(그룹 수 * test_frac)\`개 그룹을 테스트 그룹으로 정합니다. 테스트 그룹에 속한 샘플과 나머지 샘플의 인덱스를 \`(train, test)\`로 돌려줍니다.
3. \`standardize(X_train, X_other)\`: **학습 데이터의** 열별 평균·표준편차로 두 배열을 표준화해 \`(X_train_scaled, X_other_scaled)\`를 돌려줍니다.
`,
    starter: py`
import numpy as np

def split_indices(n, val_frac, test_frac, seed=0):
    perm = np.random.default_rng(seed).permutation(n)
    # TODO: 앞에서부터 테스트, 검증, 나머지(학습) 순서로 자릅니다.
    return perm, np.array([], dtype=int), np.array([], dtype=int)

def group_split(groups, test_frac, seed=0):
    groups = np.asarray(groups)
    # TODO: 그룹 단위로 테스트 그룹을 고른 뒤 샘플 인덱스로 바꿉니다.
    return np.arange(len(groups)), np.array([], dtype=int)

def standardize(X_train, X_other):
    # TODO: X_train의 열별 평균·표준편차로 두 배열을 변환합니다.
    return X_train, X_other

train, val, test = split_indices(1000, 0.15, 0.15)
print(len(train), len(val), len(test))          # 기대: 700 150 150

groups = np.repeat(np.arange(20), 3)            # 그룹 20개, 그룹마다 샘플 3개
tr, te = group_split(groups, 0.2)
print(len(tr), len(te), set(groups[tr]) & set(groups[te]))   # 기대: 48 12 set()
`,
    tests: py`
import numpy as np

@test("split_indices: 크기가 700, 150, 150이다")
def _():
    train, val, test = split_indices(1000, 0.15, 0.15)
    assert (len(train), len(val), len(test)) == (700, 150, 150), f"크기: {len(train)}, {len(val)}, {len(test)}"

@test("split_indices: 세 부분이 겹치지 않고 전체를 덮는다")
def _():
    train, val, test = split_indices(103, 0.2, 0.1, seed=3)
    parts = [set(np.asarray(p).tolist()) for p in (train, val, test)]
    assert not (parts[0] & parts[1]) and not (parts[0] & parts[2]) and not (parts[1] & parts[2]), "겹치는 인덱스가 있습니다."
    assert sorted(parts[0] | parts[1] | parts[2]) == list(range(103))

@test("split_indices: 같은 seed는 같은 분할, 다른 seed는 다른 분할")
def _():
    a = split_indices(50, 0.2, 0.2, seed=1)
    b = split_indices(50, 0.2, 0.2, seed=1)
    c = split_indices(50, 0.2, 0.2, seed=2)
    assert all(np.array_equal(x, y) for x, y in zip(a, b))
    assert not np.array_equal(a[2], c[2])

@test("group_split: 같은 그룹이 양쪽에 들어가지 않는다")
def _():
    groups = np.repeat(np.arange(20), 3)
    tr, te = group_split(groups, 0.2)
    assert len(te) == 12 and len(tr) == 48, f"크기: {len(tr)}, {len(te)}"
    assert not (set(groups[np.asarray(tr)]) & set(groups[np.asarray(te)])), "양쪽에 모두 있는 그룹이 있습니다."
    assert sorted(np.concatenate([tr, te]).tolist()) == list(range(60))

@test("group_split: 그룹 크기가 달라도 그룹 단위로 나눈다")
def _():
    groups = np.array(["a"] * 5 + ["b"] * 1 + ["c"] * 3 + ["d"] * 2 + ["e"] * 4)
    tr, te = group_split(groups, 0.4, seed=0)
    test_groups = set(groups[np.asarray(te)].tolist())
    assert len(test_groups) == 2, f"테스트 그룹: {test_groups}"
    assert not (test_groups & set(groups[np.asarray(tr)].tolist()))

@test("standardize: 학습 데이터 통계로 두 배열을 변환한다")
def _():
    Xtr = np.array([[1.0, 10.0], [3.0, 30.0], [5.0, 50.0]])
    Xo = np.array([[7.0, 70.0]])
    a, b = standardize(Xtr, Xo)
    assert approx(np.asarray(a).mean(axis=0), [0, 0]) and approx(np.asarray(a).std(axis=0), [1, 1])
    assert approx(b, [[2.44949, 2.44949]], tol=1e-4), f"변환 결과: {b}"

@test("standardize: 평가 데이터의 값이 학습 데이터 변환에 영향을 주지 않는다")
def _():
    Xtr = np.array([[1.0], [2.0], [3.0]])
    a1, _ = standardize(Xtr, np.array([[100.0]]))
    a2, _ = standardize(Xtr, np.array([[-5.0]]))
    assert approx(a1, a2)
`,
    hints: [
      "`n_test = round(n * test_frac)`, `n_val = round(n * val_frac)`를 구한 뒤 `test = perm[:n_test]`, `val = perm[n_test:n_test + n_val]`, `train = perm[n_test + n_val:]`입니다.",
      "`uniq = np.random.default_rng(seed).permutation(np.unique(groups))`에서 앞의 `round(len(uniq) * test_frac)`개가 테스트 그룹입니다. `mask = np.isin(groups, test_groups)`로 샘플을 고르고 `np.where(~mask)[0]`, `np.where(mask)[0]`을 돌려줍니다.",
      "`mu, sd = X_train.mean(axis=0), X_train.std(axis=0)` 다음 `(X_train - mu) / sd`, `(X_other - mu) / sd`입니다.",
    ],
    solution: py`
import numpy as np

def split_indices(n, val_frac, test_frac, seed=0):
    perm = np.random.default_rng(seed).permutation(n)
    n_test = round(n * test_frac)
    n_val = round(n * val_frac)
    test = perm[:n_test]
    val = perm[n_test:n_test + n_val]
    train = perm[n_test + n_val:]
    return train, val, test

def group_split(groups, test_frac, seed=0):
    groups = np.asarray(groups)
    uniq = np.random.default_rng(seed).permutation(np.unique(groups))
    test_groups = uniq[:round(len(uniq) * test_frac)]
    mask = np.isin(groups, test_groups)
    return np.where(~mask)[0], np.where(mask)[0]

def standardize(X_train, X_other):
    mu, sd = X_train.mean(axis=0), X_train.std(axis=0)
    return (X_train - mu) / sd, (X_other - mu) / sd

train, val, test = split_indices(1000, 0.15, 0.15)
print(len(train), len(val), len(test))

groups = np.repeat(np.arange(20), 3)
tr, te = group_split(groups, 0.2)
print(len(tr), len(te), set(groups[tr]) & set(groups[te]))
`,
  },
]);
