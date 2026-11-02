import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "softmax 회귀를 FGSM으로 공격하기",
    prompt: md`

「적대적 예제」 단계의 공격을 구현합니다. 모델은 이미 학습된 softmax 회귀 $p = \mathrm{softmax}(XW + b)$입니다.

1. \`input_grad(X, y, W, b)\`: 샘플별 교차 엔트로피의 입력 기울기 $\nabla_X L = (P - Y)W^\top$ (\`Y\`는 원-핫, 결과는 \`X\`와 같은 모양)
2. \`fgsm(X, y, W, b, eps)\`: $\mathrm{clip}_{[0,1]}(X + \varepsilon\,\mathrm{sign}(\nabla_X L))$
3. \`linear_logit_shift(w, eps)\`: 픽셀마다 최대 \`eps\`만 바꿀 때 로짓 $w^\top x$의 최대 변화 $\varepsilon\lVert w\rVert_1$
`,
    starter: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def input_grad(X, y, W, b):
    return np.zeros_like(X)  # TODO

def fgsm(X, y, W, b, eps):
    return X  # TODO

def linear_logit_shift(w, eps):
    return 0.0  # TODO

X, y = load_digits(return_X_y=True)
X = X / 16.0
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
W, b = np.zeros((64, 10)), np.zeros(10)
for _ in range(500):
    G = (softmax(Xtr @ W + b) - np.eye(10)[ytr]) / len(Xtr)
    W -= Xtr.T @ G
    b -= G.sum(axis=0)
acc = lambda Xs: np.mean((Xs @ W + b).argmax(1) == yte)
print("깨끗한 정확도", round(acc(Xte), 3), " FGSM(0.1)", round(acc(fgsm(Xte, yte, W, b, 0.1)), 3))
`,
    tests: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

X, y = load_digits(return_X_y=True)
X = X / 16.0
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
W, b = np.zeros((64, 10)), np.zeros(10)
for _ in range(500):
    G = (softmax(Xtr @ W + b) - np.eye(10)[ytr]) / len(Xtr)
    W -= Xtr.T @ G
    b -= G.sum(axis=0)
acc = lambda Xs: np.mean((Xs @ W + b).argmax(1) == yte)

@test("입력 기울기가 수치미분과 일치한다")
def _():
    i = 5
    g = input_grad(Xte[i:i + 1], yte[i:i + 1], W, b)[0]
    L = lambda x: -np.log(softmax((x @ W + b)[None, :])[0, yte[i]])
    num = np.array([(L(Xte[i] + 1e-6 * e) - L(Xte[i] - 1e-6 * e)) / 2e-6 for e in np.eye(64)])
    assert approx(g, num, 1e-5)

@test("FGSM은 픽셀을 [0, 1] 안에서 최대 ε만 바꾼다")
def _():
    adv = fgsm(Xte, yte, W, b, 0.1)
    assert adv.min() >= 0 and adv.max() <= 1 and np.abs(adv - Xte).max() <= 0.1 + 1e-12

@test("ε=0.1 FGSM이 정확도를 0.75 아래로 떨어뜨린다(깨끗: 0.96 이상)")
def _():
    assert acc(Xte) > 0.96 and acc(fgsm(Xte, yte, W, b, 0.1)) < 0.75, f"{acc(Xte):.3f}, {acc(fgsm(Xte, yte, W, b, 0.1)):.3f}"

@test("같은 크기의 무작위 부호 노이즈는 거의 영향이 없다")
def _():
    rand = np.clip(Xte + 0.1 * np.random.default_rng(0).choice([-1.0, 1.0], size=Xte.shape), 0, 1)
    assert acc(rand) > acc(fgsm(Xte, yte, W, b, 0.1)) + 0.2

@test("선형 로짓의 최대 변화 = ε‖w‖₁")
def _():
    assert approx(linear_logit_shift(np.array([0.5, -2.0, 1.5]), 0.1), 0.4)
`,
    hints: ["`P = softmax(X @ W + b)`, `Y = np.eye(W.shape[1])[y]`로 두면 기울기는 `(P - Y) @ W.T`입니다(평균이 아니라 샘플별).", "`np.clip(X + eps * np.sign(input_grad(X, y, W, b)), 0, 1)`", "`eps * np.abs(w).sum()`"],
    solution: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def input_grad(X, y, W, b):
    P = softmax(X @ W + b)
    Y = np.eye(W.shape[1])[y]
    return (P - Y) @ W.T

def fgsm(X, y, W, b, eps):
    return np.clip(X + eps * np.sign(input_grad(X, y, W, b)), 0, 1)

def linear_logit_shift(w, eps):
    return float(eps * np.abs(w).sum())

X, y = load_digits(return_X_y=True)
X = X / 16.0
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
W, b = np.zeros((64, 10)), np.zeros(10)
for _ in range(500):
    G = (softmax(Xtr @ W + b) - np.eye(10)[ytr]) / len(Xtr)
    W -= Xtr.T @ G
    b -= G.sum(axis=0)
acc = lambda Xs: np.mean((Xs @ W + b).argmax(1) == yte)
print("깨끗한 정확도", round(acc(Xte), 3), " FGSM(0.1)", round(acc(fgsm(Xte, yte, W, b, 0.1)), 3))
`,
  },
]);
