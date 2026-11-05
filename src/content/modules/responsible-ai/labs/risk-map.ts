import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "FGSM으로 숫자 분류기의 오분류 유도와 같은 크기의 무작위 잡음 비교",
    prompt: md`
본문의 FGSM을 숫자 이미지 분류기에 적용합니다. 숫자 3과 8을 구별하는 로지스틱 회귀 \`clf\`(가중치 \`w\`)가 주어져 있습니다.

1. \`input_grad(X, y)\`: 교차 엔트로피 손실을 **입력** $x$로 미분한 값. 로지스틱 회귀에서는 $\nabla_x J = (p - y)\,w$이고, \`p = clf.predict_proba(X)[:, 1]\`입니다. 결과 모양은 \`X\`와 같습니다.
2. \`fgsm(X, y, eps)\`: $x' = \mathrm{clip}(x + \varepsilon \cdot \mathrm{sign}(\nabla_x J), 0, 1)$
3. \`random_noise(X, eps, seed)\`: 픽셀마다 $\pm\varepsilon$를 무작위로 더하고 0~1로 자릅니다(크기는 FGSM과 같고 방향만 무작위).

픽셀당 최대 0.1만 바꿔도 정확도가 크게 떨어지는데, 같은 크기의 무작위 잡음으로는 거의 그대로인 이유를 분석하십시오.
`,
    starter: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.linear_model import LogisticRegression

digits = load_digits()
mask = np.isin(digits.target, [3, 8])
X, y = digits.data[mask] / 16.0, (digits.target[mask] == 8).astype(int)   # 픽셀 0~1, 숫자 8이면 1
clf = LogisticRegression(max_iter=2000).fit(X, y)
w = clf.coef_[0]

def input_grad(X, y):
    return np.zeros_like(X)  # TODO: (p - y)[:, None] * w[None, :]

def fgsm(X, y, eps):
    return X  # TODO

def random_noise(X, eps, seed=0):
    rng = np.random.default_rng(seed)
    return X  # TODO: rng.choice([-1, 1], size=X.shape)로 방향을 정합니다.

for eps in [0.0, 0.05, 0.1, 0.2]:
    print(f"ε = {eps:.2f}: FGSM 정확도 {clf.score(fgsm(X, y, eps), y):.3f}, 무작위 잡음 정확도 {clf.score(random_noise(X, eps), y):.3f}")
`,
    tests: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.linear_model import LogisticRegression

digits = load_digits()
mask = np.isin(digits.target, [3, 8])
X, y = digits.data[mask] / 16.0, (digits.target[mask] == 8).astype(int)   # 픽셀 0~1, 숫자 8이면 1
clf = LogisticRegression(max_iter=2000).fit(X, y)
w = clf.coef_[0]

@test("입력 기울기가 수치미분과 일치한다")
def _():
    i, h = 5, 1e-5
    x0, y0 = X[i:i + 1].copy(), y[i:i + 1]
    loss = lambda x: -np.log(clf.predict_proba(x)[0, y0[0]])
    num = np.array([(loss(x0 + h * e) - loss(x0 - h * e)) / (2 * h) for e in np.eye(64)[:, None, :]])
    g = input_grad(x0, y0)
    assert g.shape == (1, 64) and np.allclose(g[0], num, atol=1e-5), f"최대 차이 {np.abs(g[0] - num).max():.2e}"

@test("FGSM: ε = 0이면 정확도 1.0, 0.1이면 0.85 아래(본문 약 0.78), 0.2면 0.35 아래(약 0.22)")
def _():
    accs = [clf.score(fgsm(X, y, e), y) for e in (0.0, 0.1, 0.2)]
    assert accs[0] == 1.0 and accs[1] < 0.85 and accs[2] < 0.35, f"정확도 {np.round(accs, 3)}"

@test("변화량은 픽셀당 ε 이하이고 0~1 범위를 지킨다")
def _():
    Xa = fgsm(X, y, 0.1)
    assert np.abs(Xa - X).max() <= 0.1 + 1e-12 and Xa.min() >= 0 and Xa.max() <= 1

@test("같은 크기의 무작위 잡음으로는 정확도가 0.95 이상 유지된다")
def _():
    Xn = random_noise(X, 0.1)
    assert np.abs(Xn - X).max() > 0.05, "잡음이 더해지지 않았습니다."
    assert clf.score(Xn, y) >= 0.95, f"정확도 {clf.score(Xn, y):.3f}"
`,
    hints: ["`p = clf.predict_proba(X)[:, 1]`, `return (p - y)[:, None] * w[None, :]`. 손실을 $w$가 아니라 $x$로 미분했으므로 기울기에 $w$가 곱해집니다.", "`np.clip(X + eps * np.sign(input_grad(X, y)), 0, 1)`", "무작위 잡음은 `np.clip(X + eps * rng.choice([-1, 1], size=X.shape), 0, 1)`. 무작위 방향의 변화는 서로 상쇄되지만, FGSM은 64개 픽셀 모두를 손실이 커지는 방향으로 밀어 logit이 $\\varepsilon\\,\\lVert w \\rVert_1$만큼 움직입니다."],
    solution: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.linear_model import LogisticRegression

digits = load_digits()
mask = np.isin(digits.target, [3, 8])
X, y = digits.data[mask] / 16.0, (digits.target[mask] == 8).astype(int)   # 픽셀 0~1, 숫자 8이면 1
clf = LogisticRegression(max_iter=2000).fit(X, y)
w = clf.coef_[0]

def input_grad(X, y):
    p = clf.predict_proba(X)[:, 1]
    return (p - y)[:, None] * w[None, :]

def fgsm(X, y, eps):
    return np.clip(X + eps * np.sign(input_grad(X, y)), 0, 1)

def random_noise(X, eps, seed=0):
    rng = np.random.default_rng(seed)
    return np.clip(X + eps * rng.choice([-1, 1], size=X.shape), 0, 1)

for eps in [0.0, 0.05, 0.1, 0.2]:
    print(f"ε = {eps:.2f}: FGSM 정확도 {clf.score(fgsm(X, y, eps), y):.3f}, 무작위 잡음 정확도 {clf.score(random_noise(X, eps), y):.3f}")
`,
  },
  {
    key: "ex2",
    title: "집단별 정확도로 평균이 숨긴 격차를 찾고, 재가중으로 줄이기",
    prompt: md`
본문의 실험처럼 다수 집단 A(90%)와, 특성과 정답의 관계가 조금 다른 소수 집단 B(10%)로 모델을 학습합니다.

1. \`accuracy_by_group(y_true, y_pred, groups)\`: 집단 이름 → 정확도 딕셔너리.
2. \`group_weights(groups)\`: 집단마다 가중치 합이 같아지도록 표본 가중치를 줍니다. 표본 $i$의 가중치는 $\dfrac{n}{K \cdot n_{g(i)}}$($n$은 전체 표본 수, $K$는 집단 수, $n_{g}$는 집단 크기)이고, 평균은 1입니다.

\`LogisticRegression().fit(X, y, sample_weight=...)\`로 다시 학습했을 때 두 집단의 정확도가 어떻게 바뀌는지, 무엇을 잃는지 확인하십시오.
`,
    starter: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

rng = np.random.default_rng(0)
def make_group(n, shift):
    Xg = rng.normal(size=(n, 2))
    yg = (Xg[:, 0] + shift * Xg[:, 1] > 0).astype(int)
    return Xg, yg
Xa, ya = make_group(1800, 0.0)     # 다수 집단 A (90%)
Xb, yb = make_group(200, 1.5)      # 소수 집단 B (10%): 특성과 정답의 관계가 조금 다르다
X, y = np.vstack([Xa, Xb]), np.concatenate([ya, yb])
g = np.array(["A"] * 1800 + ["B"] * 200)

def accuracy_by_group(y_true, y_pred, groups):
    return {}  # TODO: {집단: 정확도}

def group_weights(groups):
    return np.ones(len(groups))  # TODO: n / (K * n_g)

plain = LogisticRegression().fit(X, y)
weighted = LogisticRegression().fit(X, y, sample_weight=group_weights(g))
for name, model in [("가중치 없음", plain), ("집단 재가중", weighted)]:
    pred = model.predict(X)
    print(f"{name}: 전체 {np.mean(pred == y):.3f}", accuracy_by_group(y, pred, g))
`,
    tests: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

rng = np.random.default_rng(0)
def make_group(n, shift):
    Xg = rng.normal(size=(n, 2))
    yg = (Xg[:, 0] + shift * Xg[:, 1] > 0).astype(int)
    return Xg, yg
Xa, ya = make_group(1800, 0.0)     # 다수 집단 A (90%)
Xb, yb = make_group(200, 1.5)      # 소수 집단 B (10%): 특성과 정답의 관계가 조금 다르다
X, y = np.vstack([Xa, Xb]), np.concatenate([ya, yb])
g = np.array(["A"] * 1800 + ["B"] * 200)

@test("집단별 정확도")
def _():
    r = accuracy_by_group(np.array([1, 0, 1, 1]), np.array([1, 0, 0, 0]), np.array(["A", "A", "B", "B"]))
    assert set(r) == {"A", "B"} and approx(r["A"], 1.0) and approx(r["B"], 0.0), r

@test("가중치: 집단별 합이 같고 평균은 1")
def _():
    wts = np.asarray(group_weights(np.array(["A", "A", "A", "B"])))
    assert approx(wts, [2 / 3, 2 / 3, 2 / 3, 2.0]), wts
    full = np.asarray(group_weights(g))
    assert approx(full[g == "A"].sum(), full[g == "B"].sum()) and approx(full.mean(), 1.0)

@test("가중치 없이 학습하면 전체 0.95 이상인데 B 집단은 0.8 미만")
def _():
    pred = LogisticRegression().fit(X, y).predict(X)
    r = accuracy_by_group(y, pred, g)
    assert np.mean(pred == y) > 0.95 and r["B"] < 0.8, r

@test("재가중하면 B는 0.8 이상, 격차는 0.05 이하로 줄지만 A와 전체는 떨어진다")
def _():
    pred = LogisticRegression().fit(X, y, sample_weight=group_weights(g)).predict(X)
    r = accuracy_by_group(y, pred, g)
    assert r["B"] >= 0.8 and abs(r["A"] - r["B"]) <= 0.05 and r["A"] < 0.95 and np.mean(pred == y) < 0.95, r
`,
    hints: ["`{k: float(np.mean(y_pred[groups == k] == y_true[groups == k])) for k in np.unique(groups)}`. 입력이 리스트일 수도 있으니 먼저 `np.asarray`로 바꿉니다.", "`names, counts = np.unique(groups, return_counts=True)`로 집단 크기를 세고, `size = dict(zip(names, counts))`일 때 `np.array([len(groups) / (len(names) * size[k]) for k in groups])`", "재가중은 소수 집단의 손실에 더 큰 몫을 줘서 결정 경계를 B 쪽으로 옮깁니다. 하나의 선형 경계로는 두 관계를 다 맞출 수 없어 A의 정확도와 전체 평균이 떨어지는 트레이드오프가 생깁니다."],
    solution: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

rng = np.random.default_rng(0)
def make_group(n, shift):
    Xg = rng.normal(size=(n, 2))
    yg = (Xg[:, 0] + shift * Xg[:, 1] > 0).astype(int)
    return Xg, yg
Xa, ya = make_group(1800, 0.0)     # 다수 집단 A (90%)
Xb, yb = make_group(200, 1.5)      # 소수 집단 B (10%): 특성과 정답의 관계가 조금 다르다
X, y = np.vstack([Xa, Xb]), np.concatenate([ya, yb])
g = np.array(["A"] * 1800 + ["B"] * 200)

def accuracy_by_group(y_true, y_pred, groups):
    y_true, y_pred, groups = np.asarray(y_true), np.asarray(y_pred), np.asarray(groups)
    return {str(k): float(np.mean(y_pred[groups == k] == y_true[groups == k])) for k in np.unique(groups)}

def group_weights(groups):
    groups = np.asarray(groups)
    names, counts = np.unique(groups, return_counts=True)
    size = dict(zip(names, counts))
    return np.array([len(groups) / (len(names) * size[k]) for k in groups])

plain = LogisticRegression().fit(X, y)
weighted = LogisticRegression().fit(X, y, sample_weight=group_weights(g))
for name, model in [("가중치 없음", plain), ("집단 재가중", weighted)]:
    pred = model.predict(X)
    print(f"{name}: 전체 {np.mean(pred == y):.3f}", accuracy_by_group(y, pred, g))
`,
  },
]);
