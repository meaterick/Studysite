import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "K-Fold 분할과 누수 없는 fold별 표준화",
    prompt: md`

교차검증의 뼈대를 직접 만듭니다.

1. \`kfold_indices(n, k)\`: 섞지 않고 앞에서부터 $k$개의 연속된 fold로 나눈 \`(train_idx, val_idx)\` 리스트. fold 크기 차이는 최대 1이며, 앞쪽 fold가 하나씩 더 큽니다(\`np.array_split\`과 같은 규칙).
2. \`scale_fold(X_train, X_val)\`: **훈련 fold의 통계로만** 두 부분을 표준화해 \`(X_train_scaled, X_val_scaled)\`를 돌려줍니다.

전체 데이터로 먼저 표준화하는 것과 무엇이 다른지 테스트 항목으로 확인합니다.
`,
    starter: py`
import numpy as np

def kfold_indices(n, k):
    idx = np.arange(n)
    folds = []  # TODO: idx를 k개의 연속 구간으로 나눕니다(np.array_split 사용 가능).
    splits = []
    for i, val in enumerate(folds):
        train = None  # TODO: val을 뺀 나머지 fold를 이어 붙입니다.
        splits.append((train, val))
    return splits

def scale_fold(X_train, X_val):
    # TODO: X_train의 열별 평균·표준편차로 두 배열을 변환합니다.
    return X_train, X_val

for train, val in kfold_indices(10, 3):
    print("train", train, "/ val", val)
`,
    tests: py`
import numpy as np

@test("10개를 3-fold로: 검증 fold 크기 4, 3, 3")
def _():
    splits = kfold_indices(10, 3)
    assert [len(v) for _, v in splits] == [4, 3, 3], f"크기: {[len(v) for _, v in splits]}"
    assert np.asarray(splits[0][1]).tolist() == [0, 1, 2, 3]

@test("검증 fold들이 겹치지 않고 전체를 덮는다")
def _():
    vals = np.concatenate([np.asarray(v) for _, v in kfold_indices(23, 5)])
    assert sorted(vals.tolist()) == list(range(23))

@test("각 분할에서 train과 val이 겹치지 않고 합치면 전체")
def _():
    for train, val in kfold_indices(12, 4):
        t, v = set(np.asarray(train).tolist()), set(np.asarray(val).tolist())
        assert not (t & v) and len(t | v) == 12

@test("훈련 fold 통계로만 표준화: 훈련은 평균 0, 검증은 그대로 두지 않는다")
def _():
    Xtr = np.array([[1.0, 10.0], [3.0, 30.0], [5.0, 50.0]])
    Xva = np.array([[7.0, 70.0]])
    a, b = scale_fold(Xtr, Xva)
    assert approx(np.asarray(a).mean(axis=0), [0, 0]) and approx(np.asarray(a).std(axis=0), [1, 1])
    assert approx(b, [[2.44949, 2.44949]], tol=1e-4), f"검증 변환 결과: {b}"

@test("검증 데이터의 값이 훈련 변환에 영향을 주지 않는다")
def _():
    Xtr = np.array([[1.0], [2.0], [3.0]])
    a1, _ = scale_fold(Xtr, np.array([[100.0]]))
    a2, _ = scale_fold(Xtr, np.array([[-5.0]]))
    assert approx(a1, a2)
`,
    hints: ["`folds = np.array_split(idx, k)`는 앞쪽 fold부터 하나씩 더 크게 나눕니다.", "`train = np.concatenate([f for j, f in enumerate(folds) if j != i])`", "`mu, sd = X_train.mean(axis=0), X_train.std(axis=0)`를 구한 뒤 `(X_train - mu) / sd`, `(X_val - mu) / sd`를 돌려줍니다."],
    solution: py`
import numpy as np

def kfold_indices(n, k):
    idx = np.arange(n)
    folds = np.array_split(idx, k)
    splits = []
    for i, val in enumerate(folds):
        train = np.concatenate([f for j, f in enumerate(folds) if j != i])
        splits.append((train, val))
    return splits

def scale_fold(X_train, X_val):
    mu, sd = X_train.mean(axis=0), X_train.std(axis=0)
    return (X_train - mu) / sd, (X_val - mu) / sd

for train, val in kfold_indices(10, 3):
    print("train", train, "/ val", val)
`,
  },
]);
