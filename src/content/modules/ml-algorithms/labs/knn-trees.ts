import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "지니 불순도로 가장 좋은 분할 찾기",
    prompt: md`

결정트리가 한 노드에서 하는 일을 직접 구현합니다.

1. \`gini(counts)\` $= 1 - \sum_i p_i^2$ (클래스별 개수 리스트를 받음)
2. \`split_gain(parent, children)\`: 부모 지니에서 자식 지니의 **샘플 수 가중평균**을 뺀 정보이득
3. \`best_threshold(x, y)\`: 특징 하나 \`x\`에서 $x \le t$ / $x > t$로 나눌 때 가중 지니가 가장 작은 $t$를 찾습니다. 후보는 정렬한 서로 다른 값들의 **중간점**입니다.
`,
    starter: py`
import numpy as np

def gini(counts):
    counts = np.asarray(counts, dtype=float)
    return 0.0  # TODO: 1 - Σ p²

def split_gain(parent, children):
    """parent: [클래스별 개수], children: [[왼쪽 개수들], [오른쪽 개수들], ...]"""
    n = sum(parent)
    weighted = 0.0  # TODO: Σ (자식 샘플 수 / n) × gini(자식)
    return gini(parent) - weighted

def best_threshold(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y)
    values = np.unique(x)
    candidates = (values[:-1] + values[1:]) / 2      # 중간점 후보
    best_t, best_score = None, float("inf")
    for t in candidates:
        left, right = y[x <= t], y[x > t]
        # TODO: 두 쪽의 클래스별 개수(np.bincount, minlength 사용)로 가중 지니를 구하고 가장 작은 t를 기록합니다.
    return best_t

print("gini([5, 3]) =", gini([5, 3]))
print("정보이득 =", split_gain([5, 3], [[3, 1], [2, 2]]))
print("최적 분할점 =", best_threshold([1, 2, 3, 10, 11, 12], [0, 0, 0, 1, 1, 1]))
`,
    tests: py`
@test("gini([5, 3]) ≈ 0.469, 반반이면 0.5, 순수하면 0")
def _():
    assert approx(gini([5, 3]), 0.46875) and approx(gini([4, 4]), 0.5) and approx(gini([6, 0]), 0.0)

@test("본문 예제의 정보이득 ≈ 0.031")
def _():
    assert approx(split_gain([5, 3], [[3, 1], [2, 2]]), 0.03125), f"결과: {split_gain([5, 3], [[3, 1], [2, 2]])}"

@test("완벽한 분할의 정보이득 = 부모 지니")
def _():
    assert approx(split_gain([4, 4], [[4, 0], [0, 4]]), 0.5)

@test("두 무리 사이의 중간점을 고른다")
def _():
    t = best_threshold([1, 2, 3, 10, 11, 12], [0, 0, 0, 1, 1, 1])
    assert t is not None and approx(t, 6.5), f"결과: {t}"

@test("섞인 데이터에서도 가중 지니가 가장 작은 곳")
def _():
    t = best_threshold([1, 2, 3, 4, 5, 6, 7, 8], [0, 0, 1, 0, 1, 1, 1, 1])
    assert t is not None and approx(t, 4.5), f"결과: {t}"
`,
    hints: ["비율은 `p = counts / counts.sum()`, 지니는 `1 - np.sum(p ** 2)`입니다.", "`weighted = sum(sum(c) / n * gini(c) for c in children)`", "`k = y.max() + 1`일 때 `np.bincount(left, minlength=k)`가 왼쪽의 클래스별 개수입니다. 가중 지니는 `len(left)/len(y) * gini(...) + len(right)/len(y) * gini(...)`입니다."],
    solution: py`
import numpy as np

def gini(counts):
    counts = np.asarray(counts, dtype=float)
    p = counts / counts.sum()
    return 1 - np.sum(p ** 2)

def split_gain(parent, children):
    n = sum(parent)
    weighted = sum(sum(c) / n * gini(c) for c in children)
    return gini(parent) - weighted

def best_threshold(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y)
    values = np.unique(x)
    candidates = (values[:-1] + values[1:]) / 2
    k = y.max() + 1
    best_t, best_score = None, float("inf")
    for t in candidates:
        left, right = y[x <= t], y[x > t]
        score = (len(left) * gini(np.bincount(left, minlength=k)) + len(right) * gini(np.bincount(right, minlength=k))) / len(y)
        if score < best_score:
            best_t, best_score = float(t), score
    return best_t

print("gini([5, 3]) =", gini([5, 3]))
print("정보이득 =", split_gain([5, 3], [[3, 1], [2, 2]]))
print("최적 분할점 =", best_threshold([1, 2, 3, 10, 11, 12], [0, 0, 0, 1, 1, 1]))
`,
  },
]);
