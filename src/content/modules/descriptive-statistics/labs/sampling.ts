import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "층화추출 직접 구현하고 단순무작위추출과 비교하기",
    prompt: md`

클래스 레이블 배열 \`labels\`에서 평가용 데이터의 인덱스를 뽑습니다.

1. \`random_indices(n_total, n, seed)\`: \`0\`부터 \`n_total - 1\`까지에서 \`n\`개를 **비복원** 단순무작위추출한 인덱스 배열
2. \`stratified_indices(labels, frac, seed)\`: 클래스마다 그 클래스 개수의 \`frac\` 비율(\`round\`로 반올림)만큼 비복원추출한 인덱스를 모두 합친 배열
3. \`positive_ratio(labels, idx)\`: 뽑은 인덱스에서 레이블이 1인 비율

두 방법을 여러 번 반복해 양성 비율이 얼마나 흔들리는지 비교합니다.
`,
    starter: py`
import numpy as np

def random_indices(n_total, n, seed=0):
    """0..n_total-1에서 n개를 비복원추출한 인덱스"""
    rng = np.random.default_rng(seed)
    # TODO: rng.choice(..., replace=False)
    return np.array([], dtype=int)

def stratified_indices(labels, frac, seed=0):
    """클래스마다 round(개수 * frac)개씩 비복원추출한 인덱스를 합친 배열"""
    labels = np.asarray(labels)
    rng = np.random.default_rng(seed)
    parts = []
    for c in np.unique(labels):
        members = np.flatnonzero(labels == c)        # 클래스 c인 인덱스
        # TODO: members에서 round(len(members) * frac)개를 비복원추출해 parts에 추가합니다.
    return np.concatenate(parts) if parts else np.array([], dtype=int)

def positive_ratio(labels, idx):
    """뽑은 인덱스 중 레이블이 1인 비율"""
    # TODO
    return 0.0

labels = np.array([1] * 30 + [0] * 570)               # 양성 5%
r1 = [positive_ratio(labels, random_indices(600, 60, s)) for s in range(200)]
r2 = [positive_ratio(labels, stratified_indices(labels, 0.1, s)) for s in range(200)]
print("단순무작위: 양성 비율 범위", round(min(r1), 3), "~", round(max(r1), 3))
print("층화추출:   양성 비율 범위", round(min(r2), 3), "~", round(max(r2), 3))   # 기대: 0.05 ~ 0.05
`,
    tests: py`
import numpy as np

labels = np.array([1] * 30 + [0] * 570)

@test("random_indices: 개수 n, 중복 없음, 범위 안")
def _():
    idx = np.asarray(random_indices(600, 60, 3))
    assert len(idx) == 60 and len(set(idx.tolist())) == 60, f"길이 {len(idx)}, 고유 {len(set(idx.tolist()))}"
    assert idx.min() >= 0 and idx.max() < 600

@test("stratified_indices: 클래스마다 10%씩 → 양성 3개, 음성 57개")
def _():
    idx = np.asarray(stratified_indices(labels, 0.1, 0))
    assert len(idx) == 60 and len(set(idx.tolist())) == 60, f"길이 {len(idx)}"
    assert labels[idx].sum() == 3, f"양성 수: {labels[idx].sum()}"

@test("층화추출은 seed가 달라도 양성 비율이 항상 0.05")
def _():
    ratios = {round(positive_ratio(labels, stratified_indices(labels, 0.1, s)), 6) for s in range(20)}
    assert ratios == {0.05}, f"비율: {ratios}"

@test("클래스가 셋이어도 각 클래스의 비율을 유지한다")
def _():
    y = np.array([0] * 50 + [1] * 30 + [2] * 20)
    idx = np.asarray(stratified_indices(y, 0.5, 1))
    assert [int((y[idx] == c).sum()) for c in (0, 1, 2)] == [25, 15, 10]

@test("positive_ratio: 인덱스 [0, 1, 40, 50] → 0.5")
def _():
    assert approx(positive_ratio(labels, np.array([0, 1, 40, 50])), 0.5)
`,
    hints: [
      "`random_indices`는 `rng.choice(n_total, size=n, replace=False)`입니다.",
      "`k = round(len(members) * frac)`를 구한 뒤 `parts.append(rng.choice(members, size=k, replace=False))`입니다.",
      "`positive_ratio`는 `float(np.mean(np.asarray(labels)[idx] == 1))`입니다.",
    ],
    solution: py`
import numpy as np

def random_indices(n_total, n, seed=0):
    rng = np.random.default_rng(seed)
    return rng.choice(n_total, size=n, replace=False)

def stratified_indices(labels, frac, seed=0):
    labels = np.asarray(labels)
    rng = np.random.default_rng(seed)
    parts = []
    for c in np.unique(labels):
        members = np.flatnonzero(labels == c)
        k = round(len(members) * frac)
        parts.append(rng.choice(members, size=k, replace=False))
    return np.concatenate(parts) if parts else np.array([], dtype=int)

def positive_ratio(labels, idx):
    return float(np.mean(np.asarray(labels)[idx] == 1))

labels = np.array([1] * 30 + [0] * 570)
r1 = [positive_ratio(labels, random_indices(600, 60, s)) for s in range(200)]
r2 = [positive_ratio(labels, stratified_indices(labels, 0.1, s)) for s in range(200)]
print("단순무작위: 양성 비율 범위", round(min(r1), 3), "~", round(max(r1), 3))
print("층화추출:   양성 비율 범위", round(min(r2), 3), "~", round(max(r2), 3))
`,
  },
]);
