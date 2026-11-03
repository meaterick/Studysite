import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "그래디언트 부스팅과 순열 중요도 직접 구현하기",
    prompt: md`

부스팅의 학습 과정과 순열 중요도를 직접 만들고 scikit-learn과 비교합니다.

1. \`fit_boosting(X, y, n_estimators, learning_rate, max_depth=2)\`: 학습 데이터 평균 \`init\`에서 시작해, 반복마다 현재 잔차 $y - F$를 \`DecisionTreeRegressor(max_depth=max_depth, random_state=0)\`로 학습하고 \`learning_rate\`를 곱한 예측을 $F$에 더합니다. \`(init, trees)\`를 돌려줍니다.
2. \`predict_boosting(X, init, trees, learning_rate)\`: \`init\`에 모든 트리의 예측에 \`learning_rate\`를 곱한 값을 더합니다.
3. \`permutation_drop(model, X, y, j, seed=0)\`: \`model.score(X, y)\`에서, \`X\`의 \`j\`번째 열만 \`np.random.default_rng(seed).permutation\`으로 섞었을 때의 점수를 뺀 값을 돌려줍니다. 원래 \`X\`는 바꾸지 않습니다.
`,
    starter: py`
import numpy as np
from sklearn.tree import DecisionTreeRegressor

def fit_boosting(X, y, n_estimators, learning_rate, max_depth=2):
    X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    init = float(y.mean())
    F = np.full(len(y), init)
    trees = []
    for _ in range(n_estimators):
        pass  # TODO: 잔차 y - F 를 트리로 학습하고, F를 갱신하고, 트리를 저장합니다.
    return init, trees

def predict_boosting(X, init, trees, learning_rate):
    X = np.asarray(X, dtype=float)
    return np.full(len(X), init)  # TODO: 트리 예측의 합에 learning_rate를 곱해 더합니다.

def permutation_drop(model, X, y, j, seed=0):
    X = np.asarray(X, dtype=float)
    base = model.score(X, y)
    # TODO: X를 복사해 j번째 열만 섞은 뒤 점수를 계산합니다.
    return 0.0

rng = np.random.default_rng(0)
x = rng.uniform(0, 1, (200, 1))
y = np.sin(2 * np.pi * x[:, 0]) + rng.normal(0, 0.2, 200)
init, trees = fit_boosting(x, y, 50, 0.1)
pred = predict_boosting(x, init, trees, 0.1)
print(len(trees), round(float(np.mean((y - pred) ** 2)), 4))      # 기대: 50 0.0313
`,
    tests: py`
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split

rng = np.random.default_rng(0)
X1 = rng.uniform(0, 1, (200, 1))
Y1 = np.sin(2 * np.pi * X1[:, 0]) + rng.normal(0, 0.2, 200)

@test("트리를 더할수록 학습 오차가 줄어든다")
def _():
    errs = []
    for n in (5, 20, 50):
        init, trees = fit_boosting(X1, Y1, n, 0.1)
        assert len(trees) == n, f"트리 수: {len(trees)}"
        errs.append(np.mean((Y1 - predict_boosting(X1, init, trees, 0.1)) ** 2))
    assert errs[0] > errs[1] > errs[2], f"학습 오차: {errs}"

@test("scikit-learn GradientBoostingRegressor와 같은 예측")
def _():
    rng2 = np.random.default_rng(1)
    X = rng2.normal(size=(300, 3))
    y = 2 * X[:, 0] + X[:, 1] ** 2 + rng2.normal(0, 0.3, 300)
    init, trees = fit_boosting(X, y, 80, 0.1, 3)
    ref = GradientBoostingRegressor(n_estimators=80, learning_rate=0.1, max_depth=3, random_state=0).fit(X, y)
    assert approx(predict_boosting(X, init, trees, 0.1), ref.predict(X), tol=1e-6), "예측이 scikit-learn과 다릅니다."

@test("permutation_drop: 관계있는 특성은 크게, 무관한 특성은 거의 0")
def _():
    rng3 = np.random.default_rng(0)
    n = 1000
    x_inf = rng3.integers(0, 2, n)
    y = np.where(rng3.random(n) < 0.8, x_inf, 1 - x_inf)
    X = np.column_stack([x_inf, rng3.normal(size=n)])
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=0)
    rf = RandomForestClassifier(n_estimators=50, random_state=0).fit(X_tr, y_tr)
    before = X_te.copy()
    d0, d1 = permutation_drop(rf, X_te, y_te, 0), permutation_drop(rf, X_te, y_te, 1)
    assert np.array_equal(X_te, before), "원래 X가 바뀌었습니다. 복사본을 섞으십시오."
    assert d0 > 0.08 and abs(d1) < 0.08, f"점수 감소: x_inf {d0:.3f}, x_noise {d1:.3f}"
`,
    hints: [
      "반복 안에서 `tree = DecisionTreeRegressor(max_depth=max_depth, random_state=0).fit(X, y - F)` 다음 `F += learning_rate * tree.predict(X)`, `trees.append(tree)`입니다.",
      "`init + learning_rate * sum((t.predict(X) for t in trees), np.zeros(len(X)))`입니다. `sum`의 시작값을 0 배열로 주면 트리가 없을 때도 배열이 나옵니다.",
      "`Xp = X.copy()` 다음 `Xp[:, j] = np.random.default_rng(seed).permutation(Xp[:, j])`, `return base - model.score(Xp, y)`입니다.",
    ],
    solution: py`
import numpy as np
from sklearn.tree import DecisionTreeRegressor

def fit_boosting(X, y, n_estimators, learning_rate, max_depth=2):
    X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    init = float(y.mean())
    F = np.full(len(y), init)
    trees = []
    for _ in range(n_estimators):
        tree = DecisionTreeRegressor(max_depth=max_depth, random_state=0).fit(X, y - F)
        F += learning_rate * tree.predict(X)
        trees.append(tree)
    return init, trees

def predict_boosting(X, init, trees, learning_rate):
    X = np.asarray(X, dtype=float)
    return init + learning_rate * sum((t.predict(X) for t in trees), np.zeros(len(X)))

def permutation_drop(model, X, y, j, seed=0):
    X = np.asarray(X, dtype=float)
    base = model.score(X, y)
    Xp = X.copy()
    Xp[:, j] = np.random.default_rng(seed).permutation(Xp[:, j])
    return base - model.score(Xp, y)

rng = np.random.default_rng(0)
x = rng.uniform(0, 1, (200, 1))
y = np.sin(2 * np.pi * x[:, 0]) + rng.normal(0, 0.2, 200)
init, trees = fit_boosting(x, y, 50, 0.1)
pred = predict_boosting(x, init, trees, 0.1)
print(len(trees), round(float(np.mean((y - pred) ** 2)), 4))
`,
  },
]);
