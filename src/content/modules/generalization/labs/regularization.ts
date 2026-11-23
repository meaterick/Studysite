import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "가중치 하나인 Ridge 해로 규제 세기 비교하기",
    prompt: md`

모델 $\hat y = wx$에 L2 규제를 더한 목적함수 $J(w) = \sum_i (w x_i - y_i)^2 + \lambda w^2$의 해는 $w^{*} = \frac{\sum_i x_i y_i}{\sum_i x_i^2 + \lambda}$입니다.

1. \`ridge_1d(x, y, lam)\`: 위 식으로 $w^{*}$를 돌려줍니다(NumPy 없이).
2. \`objective(w, x, y, lam)\`: 목적함수 $J(w)$의 값

\`ridge_1d\`의 결과가 근처의 다른 $w$보다 \`objective\`를 작게 만드는지 확인하면 식을 검산할 수 있습니다.
`,
    starter: py`
def ridge_1d(x, y, lam):
    return 0.0   # TODO

def objective(w, x, y, lam):
    return 0.0   # TODO: 오차 제곱합 + lam * w ** 2

x, y = [1.0, 2.0, 3.0], [2.0, 4.0, 7.0]
print([round(ridge_1d(x, y, lam), 3) for lam in (0, 1, 10, 100)])
`,
    tests: py`
@test("본문의 표: 2.214, 2.067, 1.292, 0.272")
def _():
    x, y = [1.0, 2.0, 3.0], [2.0, 4.0, 7.0]
    got = [ridge_1d(x, y, lam) for lam in (0, 1, 10, 100)]
    assert approx(got, [31 / 14, 31 / 15, 31 / 24, 31 / 114]), f"결과: {got}"

@test("규제가 강할수록 가중치가 작아진다")
def _():
    x, y = [1.0, -2.0, 4.0], [3.0, -1.0, 9.0]
    ws = [abs(ridge_1d(x, y, lam)) for lam in (0, 0.5, 5, 50)]
    assert all(a > b for a, b in zip(ws, ws[1:])), f"결과: {ws}"

@test("해는 목적함수를 가장 작게 만든다")
def _():
    x, y, lam = [1.0, 2.0, 3.0], [2.0, 4.0, 7.0], 10
    w = ridge_1d(x, y, lam)
    assert objective(w, x, y, lam) > 0, "objective를 계산하십시오."
    for d in (-0.1, 0.1):
        assert objective(w, x, y, lam) < objective(w + d, x, y, lam), "근처의 w보다 목적함수가 작아야 합니다."
`,
    hints: [
      "`sxy = sum(a * b for a, b in zip(x, y))`, `sxx = sum(a * a for a in x)`로 두고 `return sxy / (sxx + lam)`입니다.",
      "`sum((w * a - b) ** 2 for a, b in zip(x, y)) + lam * w ** 2`가 목적함수입니다.",
    ],
    solution: py`
def ridge_1d(x, y, lam):
    sxy = sum(a * b for a, b in zip(x, y))
    sxx = sum(a * a for a in x)
    return sxy / (sxx + lam)

def objective(w, x, y, lam):
    return sum((w * a - b) ** 2 for a, b in zip(x, y)) + lam * w ** 2

x, y = [1.0, 2.0, 3.0], [2.0, 4.0, 7.0]
print([round(ridge_1d(x, y, lam), 3) for lam in (0, 1, 10, 100)])
`,
  },
  {
    key: "ex1",
    title: "Ridge 닫힌 해, L1의 0 만들기, 조기 종료",
    prompt: md`

규제와 조기 종료의 핵심 계산을 NumPy로 구현합니다.

1. \`ridge_fit(X, y, lam)\`: 목적함수 $\lVert y - Xw - b \rVert^2 + \lambda \lVert w \rVert^2$의 해를 돌려줍니다. 편향은 규제하지 않으므로, $X$와 $y$에서 각각 평균을 뺀 $X_c, y_c$로 $w = (X_c^\top X_c + \lambda I)^{-1} X_c^\top y_c$를 \`np.linalg.solve\`로 풀고, $b = \bar y - \bar x^\top w$로 정합니다.
2. \`soft_threshold(w, t)\`: L1 규제가 가중치에 하는 일을 나타내는 함수 $\operatorname{sign}(w)\max(|w| - t, 0)$입니다. 절댓값이 \`t\` 이하인 값은 정확히 0이 됩니다.
3. \`early_stop(val_losses, patience)\`: 반복마다의 검증 손실 리스트를 앞에서부터 보며, 가장 작은 값이 \`patience\`번 연속으로 갱신되지 않으면 그 자리에서 멈춥니다. 멈출 때까지 본 값 가운데 가장 작은 값의 위치를 돌려줍니다.
`,
    starter: py`
import numpy as np

def ridge_fit(X, y, lam):
    X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    # TODO: 평균을 뺀 뒤 (Xc^T Xc + lam I) w = Xc^T yc 를 풀고 b를 계산합니다.
    return np.zeros(X.shape[1]), 0.0

def soft_threshold(w, t):
    w = np.asarray(w, dtype=float)
    return w  # TODO

def early_stop(val_losses, patience):
    best_i, best, wait = 0, float("inf"), 0
    for i, v in enumerate(val_losses):
        pass  # TODO: 더 작으면 best_i, best를 갱신하고 wait = 0, 아니면 wait += 1. wait == patience이면 멈춥니다.
    return best_i

X = np.array([[1.0, 2.0], [2.0, 0.0], [3.0, 1.0], [4.0, 3.0]])
y = np.array([3.0, 2.0, 4.0, 7.0])
print(ridge_fit(X, y, 0.0))                       # 규제 없음: 최소제곱 해와 같다
print(ridge_fit(X, y, 1000.0))                    # 규제가 매우 강하면 w는 0에 가깝고 b는 y의 평균(4.0)에 가깝다
print(soft_threshold([3.0, -0.4, 0.2, -2.0], 0.5))   # 기대: [ 2.5 -0.   0.  -1.5]
print(early_stop([0.9, 0.6, 0.45, 0.42, 0.44, 0.47, 0.5, 0.41], patience=3))   # 기대: 3
`,
    tests: py`
import numpy as np
from sklearn.linear_model import Ridge

@test("lam = 0이면 최소제곱 해와 같다")
def _():
    rng = np.random.default_rng(0)
    X = rng.normal(size=(30, 3))
    y = X @ np.array([1.0, -2.0, 0.5]) + 3 + rng.normal(0, 0.1, 30)
    w, b = ridge_fit(X, y, 0.0)
    ref = np.linalg.lstsq(np.column_stack([X, np.ones(30)]), y, rcond=None)[0]
    assert approx(list(w) + [b], ref), f"결과: {w}, {b}"

@test("scikit-learn Ridge(alpha=lam)과 같다")
def _():
    rng = np.random.default_rng(1)
    X = rng.normal(size=(40, 4))
    y = rng.normal(size=40) + 2
    w, b = ridge_fit(X, y, 5.0)
    ref = Ridge(alpha=5.0).fit(X, y)
    assert approx(w, ref.coef_) and approx(b, ref.intercept_), f"결과: {w}, {b} / 기대: {ref.coef_}, {ref.intercept_}"

@test("규제가 강할수록 가중치의 크기가 줄고, 편향은 규제하지 않는다")
def _():
    rng = np.random.default_rng(2)
    X = rng.normal(size=(50, 3))
    y = X @ np.array([2.0, -1.0, 1.0]) + 10
    norms = [np.linalg.norm(ridge_fit(X, y, lam)[0]) for lam in (0.0, 10.0, 1000.0)]
    assert norms[0] > norms[1] > norms[2], f"가중치 크기: {norms}"
    assert abs(ridge_fit(X, y, 1e6)[1] - y.mean()) < 0.05

@test("soft_threshold: 작은 값은 정확히 0")
def _():
    got = np.asarray(soft_threshold([3.0, -0.4, 0.2, -2.0], 0.5))
    assert approx(got, [2.5, 0.0, 0.0, -1.5]), f"결과: {got}"
    assert np.sum(got == 0) == 2

@test("early_stop: patience번 나아지지 않으면 멈춘다")
def _():
    v = [0.9, 0.6, 0.45, 0.42, 0.44, 0.47, 0.5, 0.41]
    assert early_stop(v, patience=3) == 3, f"결과: {early_stop(v, patience=3)}"
    assert early_stop(v, patience=5) == 7, "patience가 길면 뒤의 0.41까지 본다."
    assert early_stop([1.0, 0.8, 0.7], patience=2) == 2
`,
    hints: [
      "`xm, ym = X.mean(axis=0), y.mean()`, `Xc, yc = X - xm, y - ym` 다음 `w = np.linalg.solve(Xc.T @ Xc + lam * np.eye(X.shape[1]), Xc.T @ yc)`, `b = ym - xm @ w`입니다.",
      "`np.sign(w) * np.maximum(np.abs(w) - t, 0)`입니다.",
      "`if v < best: best_i, best, wait = i, v, 0` 아니면 `wait += 1` 다음 `if wait == patience: break`입니다.",
    ],
    solution: py`
import numpy as np

def ridge_fit(X, y, lam):
    X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    xm, ym = X.mean(axis=0), y.mean()
    Xc, yc = X - xm, y - ym
    w = np.linalg.solve(Xc.T @ Xc + lam * np.eye(X.shape[1]), Xc.T @ yc)
    b = float(ym - xm @ w)
    return w, b

def soft_threshold(w, t):
    w = np.asarray(w, dtype=float)
    return np.sign(w) * np.maximum(np.abs(w) - t, 0)

def early_stop(val_losses, patience):
    best_i, best, wait = 0, float("inf"), 0
    for i, v in enumerate(val_losses):
        if v < best:
            best_i, best, wait = i, v, 0
        else:
            wait += 1
            if wait == patience:
                break
    return best_i

X = np.array([[1.0, 2.0], [2.0, 0.0], [3.0, 1.0], [4.0, 3.0]])
y = np.array([3.0, 2.0, 4.0, 7.0])
print(ridge_fit(X, y, 0.0))
print(ridge_fit(X, y, 1000.0))
print(soft_threshold([3.0, -0.4, 0.2, -2.0], 0.5))
print(early_stop([0.9, 0.6, 0.45, 0.42, 0.44, 0.47, 0.5, 0.41], patience=3))
`,
  },
]);
