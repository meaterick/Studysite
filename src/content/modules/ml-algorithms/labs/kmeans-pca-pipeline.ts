import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "K-Means 할당·갱신 반복 직접 구현",
    prompt: md`

「SVM·K-Means·PCA」 단계에서 손으로 따라간 K-Means를 구현합니다. 한 번의 반복은 **할당**(가장 가까운 중심에 배정)과 **갱신**(군집 평균으로 중심 이동) 두 단계입니다.

1. \`assign(points, centroids)\`: 각 점에서 가장 가까운 중심의 번호 배열
2. \`update(points, labels, k)\`: 군집마다 속한 점의 평균
3. \`kmeans(points, init, n_iter)\`: 할당·갱신을 반복하고, 중심이 더 이상 바뀌지 않으면 일찍 멈춥니다. \`(centroids, labels)\`를 돌려줍니다.

본문 예제(초기 중심 $P_1, P_4$)에서 1회 갱신 후 중심이 $(1, 1)$, $(4.33, 4.33)$이 되어야 합니다.
`,
    starter: py`
import numpy as np

def assign(points, centroids):
    # TODO: (점 수, 중심 수) 거리 행렬을 만들고 행마다 argmin
    return np.zeros(len(points), dtype=int)

def update(points, labels, k):
    # TODO: 군집 j에 속한 점들(points[labels == j])의 평균
    return np.zeros((k, points.shape[1]))

def kmeans(points, init, n_iter=10):
    centroids = np.asarray(init, dtype=float)
    labels = assign(points, centroids)
    for _ in range(n_iter):
        labels = assign(points, centroids)
        new = update(points, labels, len(centroids))
        # TODO: 중심이 바뀌지 않았으면(np.allclose) 멈추고, 아니면 centroids를 갱신합니다.
        centroids = new
    return centroids, labels

pts = np.array([[1, 1], [1, 2], [4, 4], [5, 4], [1, 0], [4, 5]], dtype=float)
labels = assign(pts, np.array([[1, 1], [5, 4]], dtype=float))
print("1회차 배정:", labels)
print("1회 갱신 후 중심:\n", np.round(update(pts, labels, 2), 2))
print("수렴 결과:", kmeans(pts, [[1, 1], [5, 4]]))
`,
    tests: py`
import numpy as np
pts = np.array([[1, 1], [1, 2], [4, 4], [5, 4], [1, 0], [4, 5]], dtype=float)

@test("1회차 배정 = [0, 0, 1, 1, 0, 1]")
def _():
    got = np.asarray(assign(pts, np.array([[1, 1], [5, 4]], dtype=float))).tolist()
    assert got == [0, 0, 1, 1, 0, 1], f"결과: {got}"

@test("1회 갱신 후 중심 = (1, 1), (4.33, 4.33)")
def _():
    c = update(pts, np.array([0, 0, 1, 1, 0, 1]), 2)
    assert approx(c, [[1, 1], [13 / 3, 13 / 3]]), f"결과: {np.round(c, 3)}"

@test("거리는 유클리드 거리로 비교한다")
def _():
    got = np.asarray(assign(np.array([[0.0, 3.0]]), np.array([[0.0, 0.0], [2.5, 2.5]]))).tolist()
    assert got == [1], f"결과: {got}"

@test("kmeans가 같은 군집 구조로 수렴한다")
def _():
    c, labels = kmeans(pts, [[1, 1], [5, 4]])
    assert np.asarray(labels).tolist() == [0, 0, 1, 1, 0, 1]
    assert approx(c, [[1, 1], [13 / 3, 13 / 3]])

@test("나쁜 초기값에서 시작해도 두 무리를 찾는다")
def _():
    c, labels = kmeans(pts, [[1, 0], [1, 2]], n_iter=20)
    groups = sorted(sorted(np.where(np.asarray(labels) == j)[0].tolist()) for j in range(2))
    assert groups == [[0, 1, 4], [2, 3, 5]], f"군집: {groups}"
`,
    hints: ["`d = np.linalg.norm(points[:, None, :] - centroids[None, :, :], axis=2)`는 (점 수, 중심 수) 거리 행렬입니다. `d.argmin(axis=1)`이 배정입니다.", "`np.array([points[labels == j].mean(axis=0) for j in range(k)])`", "반복문 안에서 `if np.allclose(new, centroids): break`를 갱신 전에 검사합니다. 멈춘 뒤의 labels가 최종 배정과 일치하는지도 생각해 보십시오."],
    solution: py`
import numpy as np

def assign(points, centroids):
    d = np.linalg.norm(points[:, None, :] - centroids[None, :, :], axis=2)
    return d.argmin(axis=1)

def update(points, labels, k):
    return np.array([points[labels == j].mean(axis=0) for j in range(k)])

def kmeans(points, init, n_iter=10):
    centroids = np.asarray(init, dtype=float)
    labels = assign(points, centroids)
    for _ in range(n_iter):
        labels = assign(points, centroids)
        new = update(points, labels, len(centroids))
        if np.allclose(new, centroids):
            break
        centroids = new
    labels = assign(points, centroids)
    return centroids, labels

pts = np.array([[1, 1], [1, 2], [4, 4], [5, 4], [1, 0], [4, 5]], dtype=float)
labels = assign(pts, np.array([[1, 1], [5, 4]], dtype=float))
print("1회차 배정:", labels)
print("1회 갱신 후 중심:\n", np.round(update(pts, labels, 2), 2))
print("수렴 결과:", kmeans(pts, [[1, 1], [5, 4]]))
`,
  },
]);
