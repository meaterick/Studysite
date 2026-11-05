import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "KNN 다수결과 결정트리의 분할 직접 구현하기",
    prompt: md`

KNN의 예측과 결정트리가 한 노드에서 하는 계산을 NumPy로 구현합니다.

1. \`knn_predict(X_train, y_train, x, k=3)\`: 유클리드 거리가 가장 가까운 \`k\`개의 다수결 클래스를 돌려줍니다(\`np.argsort\`, \`np.bincount\` 활용).
2. \`gini(counts)\` $= 1 - \sum_i p_i^2$: 클래스별 개수 리스트를 받습니다.
3. \`split_gain(parent, children)\`: 부모 지니에서 자식 지니의 **샘플 수 가중 평균**을 뺀 정보이득입니다.
4. \`best_threshold(x, y)\`: 특성 하나 \`x\`에서 $x \le t$와 $x > t$로 나눌 때 가중 지니가 가장 작은 $t$를 찾습니다. 후보는 정렬한 서로 다른 값들의 **중간점**입니다.
`,
    starter: py`
import numpy as np

def knn_predict(X_train, y_train, x, k=3):
    X_train, x = np.asarray(X_train, dtype=float), np.asarray(x, dtype=float)
    dists = np.zeros(len(X_train))   # TODO: x와 모든 학습 샘플 사이의 유클리드 거리
    nearest = []                     # TODO: 거리가 가까운 k개의 위치
    votes = np.asarray(y_train)[nearest]
    return 0                         # TODO: 다수결 (np.bincount(...).argmax())

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

X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]
print("KNN(k=3) 예측:", knn_predict(X_train, y_train, [2, 2], k=3))     # 기대: 0
print("gini([5, 3]) =", gini([5, 3]))                                  # 기대: 0.46875
print("정보이득 =", split_gain([5, 3], [[3, 1], [2, 2]]))               # 기대: 0.03125
print("최적 분할점 =", best_threshold([1, 2, 3, 10, 11, 12], [0, 0, 0, 1, 1, 1]))   # 기대: 6.5
`,
    tests: py`
import numpy as np
X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]

@test("KNN: 본문 예제 (2, 2)는 k=3에서 클래스 0, (5.5, 5.2)는 클래스 1")
def _():
    assert int(knn_predict(X_train, y_train, [2, 2], k=3)) == 0
    assert int(knn_predict(X_train, y_train, [5.5, 5.2], k=3)) == 1

@test("KNN: k를 키우면 먼 이웃까지 투표에 참여한다")
def _():
    Xt = [[0, 0], [0, 1], [4, 4], [4, 5], [5, 4]]
    yt = [0, 0, 1, 1, 1]
    assert int(knn_predict(Xt, yt, [1, 1], k=1)) == 0 and int(knn_predict(Xt, yt, [1, 1], k=5)) == 1

@test("gini([5, 3]) ≈ 0.469, 반반이면 0.5, 순수하면 0")
def _():
    assert approx(gini([5, 3]), 0.46875) and approx(gini([4, 4]), 0.5) and approx(gini([6, 0]), 0.0)

@test("정보이득: 본문 예제 ≈ 0.031, 완벽한 분할은 부모 지니와 같다")
def _():
    assert approx(split_gain([5, 3], [[3, 1], [2, 2]]), 0.03125), f"결과: {split_gain([5, 3], [[3, 1], [2, 2]])}"
    assert approx(split_gain([4, 4], [[4, 0], [0, 4]]), 0.5)

@test("best_threshold: 두 무리 사이의 중간점, 섞인 데이터에서도 가중 지니가 가장 작은 곳")
def _():
    t1 = best_threshold([1, 2, 3, 10, 11, 12], [0, 0, 0, 1, 1, 1])
    t2 = best_threshold([1, 2, 3, 4, 5, 6, 7, 8], [0, 0, 1, 0, 1, 1, 1, 1])
    assert t1 is not None and approx(t1, 6.5), f"결과: {t1}"
    assert t2 is not None and approx(t2, 4.5), f"결과: {t2}"
`,
    hints: [
      "거리는 `np.sqrt(((X_train - x) ** 2).sum(axis=1))`로 한 번에 구하고, `nearest = np.argsort(dists)[:k]`, 다수결은 `np.bincount(votes).argmax()`입니다.",
      "지니는 `p = counts / counts.sum()` 다음 `1 - np.sum(p ** 2)`, 가중 평균은 `sum(sum(c) / n * gini(c) for c in children)`입니다.",
      "`k = y.max() + 1`일 때 `np.bincount(left, minlength=k)`가 왼쪽의 클래스별 개수입니다. 가중 지니는 `(len(left) * gini(...) + len(right) * gini(...)) / len(y)`입니다.",
    ],
    solution: py`
import numpy as np

def knn_predict(X_train, y_train, x, k=3):
    X_train, x = np.asarray(X_train, dtype=float), np.asarray(x, dtype=float)
    dists = np.sqrt(((X_train - x) ** 2).sum(axis=1))
    nearest = np.argsort(dists)[:k]
    votes = np.asarray(y_train)[nearest]
    return int(np.bincount(votes).argmax())

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

X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]
print("KNN(k=3) 예측:", knn_predict(X_train, y_train, [2, 2], k=3))
print("gini([5, 3]) =", gini([5, 3]))
print("정보이득 =", split_gain([5, 3], [[3, 1], [2, 2]]))
print("최적 분할점 =", best_threshold([1, 2, 3, 10, 11, 12], [0, 0, 0, 1, 1, 1]))
`,
  },
]);
