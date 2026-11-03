import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "학습 진단: 초기 손실 확인과 배치 하나에 과적합하기",
    prompt: md`
학습이 기대대로 되지 않을 때 가장 먼저 하는 두 가지 점검을 구현합니다.

1. \`softmax(Z)\`(행마다, 최댓값을 빼서 안정화)와 \`cross_entropy(P, y)\`(정답 클래스 확률의 $-\log$ 평균)
2. \`overfit_batch(X, y, n_classes, steps, lr)\`: 선형 분류기 $XW + b$를 작은 초기화로 시작해 소프트맥스 교차 엔트로피로 학습하고 \`(정확도, 손실)\`을 돌려줍니다. 기울기는 $\partial L/\partial Z = (P - \text{원핫})/n$입니다.

클래스 10개를 균등하게 예측하면 손실은 $\ln 10 \approx 2.303$이고, 샘플 10개로 이루어진 배치에서는 정확도 1.0에 도달해야 합니다.
`,
    starter: py`
import numpy as np
from sklearn.datasets import load_digits

def softmax(Z):
    return Z  # TODO: 행마다 최댓값을 빼고 exp → 정규화

def cross_entropy(P, y):
    return 0.0  # TODO: -log P[i, y_i]의 평균 (1e-12를 더해 log 0 방지)

def overfit_batch(X, y, n_classes=10, steps=300, lr=1.0, seed=0):
    rng = np.random.default_rng(seed)
    W, b = rng.normal(0, 0.01, (X.shape[1], n_classes)), np.zeros(n_classes)
    for _ in range(steps):
        P = softmax(X @ W + b)
        G = P.copy()
        # TODO: 정답 자리에서 1을 빼고 샘플 수로 나눈 뒤 W, b를 갱신합니다.
    P = softmax(X @ W + b)
    return float(np.mean(P.argmax(axis=1) == y)), cross_entropy(P, y)

digits = load_digits()
X, y = digits.data / 16.0, digits.target
W0 = np.random.default_rng(0).normal(0, 0.01, (64, 10))
print("초기 손실:", cross_entropy(softmax(X @ W0), y), " ln10 =", np.log(10))
print("배치 10개 과적합:", overfit_batch(X[:10], y[:10]))
`,
    tests: py`
import numpy as np
from sklearn.datasets import load_digits
digits = load_digits()
X, y = digits.data / 16.0, digits.target

@test("softmax: 행 합 1, 큰 값에도 overflow 없음")
def _():
    P = softmax(np.array([[1.0, 2.0, 3.0], [1000.0, 1000.0, 1000.0]]))
    assert approx(P.sum(axis=1), [1, 1]) and approx(P[1], [1 / 3] * 3) and not np.isnan(P).any()

@test("균등 예측의 교차 엔트로피 = ln(클래스 수)")
def _():
    assert approx(cross_entropy(np.full((5, 10), 0.1), np.arange(5)), np.log(10))

@test("작은 초기화의 초기 손실 ≈ ln 10 (±0.05)")
def _():
    W0 = np.random.default_rng(0).normal(0, 0.01, (64, 10))
    assert abs(cross_entropy(softmax(X @ W0), y) - np.log(10)) < 0.05

@test("샘플 10개 배치에서 정확도 1.0, 손실 0.1 미만")
def _():
    acc, loss = overfit_batch(X[:10], y[:10])
    assert acc == 1.0 and loss < 0.1, f"정확도 {acc}, 손실 {loss:.4f}"
`,
    hints: ["`Z = Z - Z.max(axis=1, keepdims=True)`, `E = np.exp(Z)`, `E / E.sum(axis=1, keepdims=True)`", "`-np.mean(np.log(P[np.arange(len(y)), y] + 1e-12))`", "`G[np.arange(len(y)), y] -= 1`, `G /= len(y)`, `W -= lr * X.T @ G`, `b -= lr * G.sum(axis=0)`"],
    solution: py`
import numpy as np
from sklearn.datasets import load_digits

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

def cross_entropy(P, y):
    return float(-np.mean(np.log(P[np.arange(len(y)), y] + 1e-12)))

def overfit_batch(X, y, n_classes=10, steps=300, lr=1.0, seed=0):
    rng = np.random.default_rng(seed)
    W, b = rng.normal(0, 0.01, (X.shape[1], n_classes)), np.zeros(n_classes)
    for _ in range(steps):
        P = softmax(X @ W + b)
        G = P.copy()
        G[np.arange(len(y)), y] -= 1
        G /= len(y)
        W -= lr * X.T @ G
        b -= lr * G.sum(axis=0)
    P = softmax(X @ W + b)
    return float(np.mean(P.argmax(axis=1) == y)), cross_entropy(P, y)

digits = load_digits()
X, y = digits.data / 16.0, digits.target
W0 = np.random.default_rng(0).normal(0, 0.01, (64, 10))
print("초기 손실:", cross_entropy(softmax(X @ W0), y), " ln10 =", np.log(10))
print("배치 10개 과적합:", overfit_batch(X[:10], y[:10]))
`,
  },
]);
