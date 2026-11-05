import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "마진, 소프트 마진 목적함수, RBF 커널 계산하기",
    prompt: md`

SVM의 세 가지 계산을 NumPy로 구현합니다. 정답 \`y\`는 $+1$과 $-1$입니다.

1. \`margin_width(w)\`: 마진의 폭 $2 / \lVert w \rVert$
2. \`soft_margin_objective(w, b, X, y, C)\`: $\frac{1}{2}\lVert w \rVert^2 + C \sum_i \max(0,\; 1 - y_i (w^\top x_i + b))$. 마진 밖에서 바르게 분류된 샘플은 둘째 항에 0을 더합니다.
3. \`rbf_kernel(A, B, gamma)\`: 행렬 \`A\`의 행 $a_i$와 \`B\`의 행 $b_j$마다 $\exp(-\gamma \lVert a_i - b_j \rVert^2)$을 계산한 모양 \`(len(A), len(B))\`의 행렬
`,
    starter: py`
import numpy as np

def margin_width(w):
    return 0.0  # TODO

def soft_margin_objective(w, b, X, y, C):
    w, X, y = np.asarray(w, dtype=float), np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    hinge = np.zeros(len(y))  # TODO: max(0, 1 - y * (X @ w + b))
    return 0.0  # TODO

def rbf_kernel(A, B, gamma):
    A, B = np.asarray(A, dtype=float), np.asarray(B, dtype=float)
    return np.zeros((len(A), len(B)))  # TODO: 모든 쌍의 거리 제곱을 브로드캐스팅으로

print(round(margin_width([0.5, -0.5]), 3))                                        # 기대: 2.828
print(soft_margin_objective([0.5, -0.5], 0.0, [[3, 1], [1, 3], [2, 2]], [1, -1, 1], 1.0))   # 기대: 1.25
print(np.round(rbf_kernel([[0, 0], [1, 0]], [[0, 0], [0, 2]], 0.5), 3))
`,
    tests: py`
import numpy as np
from sklearn.metrics.pairwise import rbf_kernel as sk_rbf

@test("margin_width: w = (0.5, -0.5)이면 약 2.828")
def _():
    assert approx(margin_width([0.5, -0.5]), 2 * np.sqrt(2)) and approx(margin_width([3.0, 4.0]), 0.4)

@test("soft_margin_objective: 마진 밖의 바른 샘플은 벌점 0")
def _():
    X = [[3, 1], [1, 3]]
    assert approx(soft_margin_objective([0.5, -0.5], 0.0, X, [1, -1], 1.0), 0.25)

@test("soft_margin_objective: 경계 위의 샘플은 벌점 1, C배로 더한다")
def _():
    X = [[3, 1], [1, 3], [2, 2]]
    assert approx(soft_margin_objective([0.5, -0.5], 0.0, X, [1, -1, 1], 1.0), 1.25)
    assert approx(soft_margin_objective([0.5, -0.5], 0.0, X, [1, -1, 1], 10.0), 10.25)

@test("rbf_kernel: scikit-learn과 같고, 자기 자신과는 1")
def _():
    rng = np.random.default_rng(0)
    A, B = rng.normal(size=(4, 3)), rng.normal(size=(5, 3))
    K = np.asarray(rbf_kernel(A, B, 0.7))
    assert K.shape == (4, 5) and approx(K, sk_rbf(A, B, gamma=0.7)), "scikit-learn의 rbf_kernel과 다릅니다."
    assert approx(np.diag(np.asarray(rbf_kernel(A, A, 0.7))), np.ones(4))
`,
    hints: [
      "`margin_width`는 `2 / np.linalg.norm(w)`입니다.",
      "`hinge = np.maximum(0, 1 - y * (X @ w + b))` 다음 `0.5 * w @ w + C * hinge.sum()`입니다.",
      "`d2 = ((A[:, None, :] - B[None, :, :]) ** 2).sum(axis=2)`가 모든 쌍의 거리 제곱이고, `np.exp(-gamma * d2)`입니다.",
    ],
    solution: py`
import numpy as np

def margin_width(w):
    return float(2 / np.linalg.norm(w))

def soft_margin_objective(w, b, X, y, C):
    w, X, y = np.asarray(w, dtype=float), np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    hinge = np.maximum(0, 1 - y * (X @ w + b))
    return float(0.5 * w @ w + C * hinge.sum())

def rbf_kernel(A, B, gamma):
    A, B = np.asarray(A, dtype=float), np.asarray(B, dtype=float)
    d2 = ((A[:, None, :] - B[None, :, :]) ** 2).sum(axis=2)
    return np.exp(-gamma * d2)

print(round(margin_width([0.5, -0.5]), 3))
print(soft_margin_objective([0.5, -0.5], 0.0, [[3, 1], [1, 3], [2, 2]], [1, -1, 1], 1.0))
print(np.round(rbf_kernel([[0, 0], [1, 0]], [[0, 0], [0, 2]], 0.5), 3))
`,
  },
]);
