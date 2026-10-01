import type { WeekLab } from "../types";
import { py } from "./util";

// 2주차: 이상치 판정, 훈련 통계로만 스케일링, 로지스틱 회귀 기울기, KNN·나이브 베이즈, 지니 분할, K-Means, K-Fold, 평가지표
const week2: WeekLab = {
  exercises: [
    {
      id: "w2-lab-outliers",
      sectionId: "data-cleaning",
      title: "IQR과 Z-score: 같은 데이터, 다른 결론",
      level: 2,
      prompt: `
「데이터 수집·정제와 결측값·이상치」 예제를 함수로 만듭니다. 사분위수는 본문처럼 **정렬한 데이터를 반으로 나눠 각 절반의 중앙값**으로 구합니다.

1. \`quartiles(data)\`: $(Q_1, Q_3)$
2. \`iqr_outliers(data)\`: $Q_1 - 1.5\\,\\text{IQR}$보다 작거나 $Q_3 + 1.5\\,\\text{IQR}$보다 큰 값의 리스트
3. \`zscore_outliers(data, threshold=3)\`: $|z| > \\text{threshold}$인 값의 리스트 (표준편차는 \`np.std\`, 모집단 기준)

\`[12, 13, 13, 14, 14, 15, 16, 95]\`에서 두 방법의 결론이 왜 다른지 출력으로 확인해 보십시오.
`,
      starter: py`
import numpy as np

def quartiles(data):
    d = np.sort(np.asarray(data, dtype=float))
    n = len(d)
    # TODO: 앞쪽 절반 d[:n // 2]의 중앙값이 Q1, 뒤쪽 절반 d[n // 2:]의 중앙값이 Q3
    return 0.0, 0.0

def iqr_outliers(data):
    q1, q3 = quartiles(data)
    iqr = q3 - q1
    # TODO: 울타리(fence) 바깥의 값만 골라 리스트로 돌려줍니다.
    return []

def zscore_outliers(data, threshold=3):
    d = np.asarray(data, dtype=float)
    # TODO: z = (값 - 평균) / 표준편차, |z| > threshold인 값의 리스트
    return []

data = [12, 13, 13, 14, 14, 15, 16, 95]
print("Q1, Q3 =", quartiles(data))
print("IQR 이상치:", iqr_outliers(data))
print("Z-score 이상치(|z|>3):", zscore_outliers(data))
`,
      tests: py`
data = [12, 13, 13, 14, 14, 15, 16, 95]

@test("Q1 = 13, Q3 = 15.5")
def _():
    q1, q3 = quartiles(data)
    assert approx(q1, 13) and approx(q3, 15.5), f"결과: {(q1, q3)}"

@test("IQR 방법은 95를 이상치로 판정한다")
def _():
    got = [float(v) for v in iqr_outliers(data)]
    assert got == [95.0], f"결과: {got}"

@test("Z-score(|z|>3)는 95를 놓친다(z ≈ 2.64)")
def _():
    assert list(zscore_outliers(data)) == [], f"결과: {list(zscore_outliers(data))}"

@test("기준을 2로 낮추면 Z-score도 95를 잡는다")
def _():
    got = [float(v) for v in zscore_outliers(data, threshold=2)]
    assert got == [95.0], f"결과: {got}"

@test("아래쪽 이상치도 잡는다")
def _():
    got = [float(v) for v in iqr_outliers([-40, 10, 11, 12, 12, 13, 14, 15])]
    assert got == [-40.0], f"결과: {got}"
`,
      hints: [
        "`np.median(d[:n // 2])`와 `np.median(d[n // 2:])`가 각각 Q1과 Q3입니다.",
        "울타리는 `low = q1 - 1.5 * iqr`, `high = q3 + 1.5 * iqr`입니다. `[v for v in data if v < low or v > high]`",
        "Z-score는 `(d - d.mean()) / d.std()`로 한 번에 계산하고, `d[np.abs(z) > threshold].tolist()`처럼 불리언 인덱싱으로 고릅니다.",
      ],
      solution: py`
import numpy as np

def quartiles(data):
    d = np.sort(np.asarray(data, dtype=float))
    n = len(d)
    return float(np.median(d[: n // 2])), float(np.median(d[n // 2 :]))

def iqr_outliers(data):
    q1, q3 = quartiles(data)
    iqr = q3 - q1
    low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return [v for v in data if v < low or v > high]

def zscore_outliers(data, threshold=3):
    d = np.asarray(data, dtype=float)
    z = (d - d.mean()) / d.std()
    return d[np.abs(z) > threshold].tolist()

data = [12, 13, 13, 14, 14, 15, 16, 95]
print("Q1, Q3 =", quartiles(data))
print("IQR 이상치:", iqr_outliers(data))
print("Z-score 이상치(|z|>3):", zscore_outliers(data))
`,
    },
    {
      id: "w2-lab-scaler",
      sectionId: "features",
      title: "훈련 통계로만 변환하는 표준화기 만들기",
      level: 2,
      prompt: `
scikit-learn의 \`StandardScaler\`가 하는 일을 직접 구현해 "훈련 데이터로만 fit, 테스트에는 transform만" 원칙을 코드로 확인합니다.

1. \`Standardizer\` 클래스: \`fit(X)\`은 열별 평균·표준편차(모집단 기준, \`ddof=0\`)를 \`self.mean_\`, \`self.std_\`에 저장하고 **자기 자신을 돌려줍니다**(체이닝). \`transform(X)\`은 저장한 통계로 변환합니다.
2. \`minmax(x)\`: 1차원 배열을 $\\dfrac{x - \\min}{\\max - \\min}$으로 0~1에 맞춥니다.

훈련 \`[[10], [20], [30]]\`로 fit하면 테스트 40은 약 2.449가 되어야 합니다.
`,
      starter: py`
import numpy as np

class Standardizer:
    def fit(self, X):
        X = np.asarray(X, dtype=float)
        self.mean_ = None  # TODO: 열별 평균 (axis 주의)
        self.std_ = None   # TODO: 열별 표준편차
        return self

    def transform(self, X):
        X = np.asarray(X, dtype=float)
        # TODO: fit에서 저장한 통계로만 변환합니다.
        return X

    def fit_transform(self, X):
        return self.fit(X).transform(X)

def minmax(x):
    x = np.asarray(x, dtype=float)
    return x  # TODO

train = np.array([[10.0], [20.0], [30.0]])
test = np.array([[40.0]])
s = Standardizer().fit(train)
print("훈련 평균, 표준편차:", s.mean_, s.std_)
print("테스트 40 →", s.transform(test).ravel())
print("minmax([2, 4, 6, 8]) =", minmax([2, 4, 6, 8]))
`,
      tests: py`
import numpy as np
train = np.array([[10.0], [20.0], [30.0]])

@test("훈련 통계: 평균 20, 표준편차 ≈ 8.165")
def _():
    s = Standardizer().fit(train)
    assert s is not None and hasattr(s, "transform"), "fit이 자기 자신(self)을 돌려주지 않습니다."
    assert approx(s.mean_, [20.0]) and approx(s.std_, [8.16497], tol=1e-4), f"평균 {s.mean_}, 표준편차 {s.std_}"

@test("테스트 40은 훈련 통계로 ≈ 2.449")
def _():
    got = Standardizer().fit(train).transform([[40.0]]).ravel()
    assert approx(got, [2.44949], tol=1e-4), f"결과: {got}"

@test("여러 열을 열마다 따로 표준화한다")
def _():
    X = np.array([[1, 20], [2, 45], [3, 80], [4, 130], [5, 200]])
    Z = Standardizer().fit_transform(X)
    assert approx(Z.mean(axis=0), [0, 0]) and approx(Z.std(axis=0), [1, 1]), f"열 평균 {Z.mean(axis=0)}, 열 표준편차 {Z.std(axis=0)}"

@test("테스트까지 섞어 fit하면 값이 달라진다(≈ 1.342)")
def _():
    got = Standardizer().fit(np.vstack([train, [[40.0]]])).transform([[40.0]]).ravel()
    assert approx(got, [1.34164], tol=1e-4), f"결과: {got}"

@test("minmax([2, 4, 6, 8]) = [0, 1/3, 2/3, 1]")
def _():
    assert approx(minmax([2, 4, 6, 8]), [0, 1 / 3, 2 / 3, 1])
`,
      hints: [
        "샘플이 행, 특징이 열이므로 열별 통계는 `X.mean(axis=0)`, `X.std(axis=0)`입니다.",
        "`transform`은 `(X - self.mean_) / self.std_`입니다. 여기서 X의 평균을 다시 구하면 안 됩니다. 그게 바로 누수입니다.",
        "`minmax`는 `(x - x.min()) / (x.max() - x.min())`입니다.",
      ],
      solution: py`
import numpy as np

class Standardizer:
    def fit(self, X):
        X = np.asarray(X, dtype=float)
        self.mean_ = X.mean(axis=0)
        self.std_ = X.std(axis=0)
        return self

    def transform(self, X):
        X = np.asarray(X, dtype=float)
        return (X - self.mean_) / self.std_

    def fit_transform(self, X):
        return self.fit(X).transform(X)

def minmax(x):
    x = np.asarray(x, dtype=float)
    return (x - x.min()) / (x.max() - x.min())

train = np.array([[10.0], [20.0], [30.0]])
test = np.array([[40.0]])
s = Standardizer().fit(train)
print("훈련 평균, 표준편차:", s.mean_, s.std_)
print("테스트 40 →", s.transform(test).ravel())
print("minmax([2, 4, 6, 8]) =", minmax([2, 4, 6, 8]))
`,
    },
    {
      id: "w2-lab-logistic",
      sectionId: "regression-logistic",
      title: "로지스틱 회귀의 손실과 기울기 (p − y)x",
      level: 2,
      prompt: `
「문제 유형과 손실함수」 실습의 로지스틱 회귀를 부품으로 나눠 구현합니다. 학습 루프는 이미 작성되어 있습니다.

- \`sigmoid(z)\` $= \\dfrac{1}{1 + e^{-z}}$
- \`bce_loss(p, y)\` $= -\\dfrac{1}{n}\\sum [y \\log p + (1-y)\\log(1-p)]$ ($\\log 0$을 피하려고 \`p\`를 \`[1e-12, 1 - 1e-12]\`로 자릅니다)
- \`gradients(X, y, w, b)\`: 유도한 기울기 $\\dfrac{1}{n} X^\\top (p - y)$와 $\\dfrac{1}{n}\\sum (p - y)$

모든 예측이 0.5일 때 손실이 $\\ln 2 \\approx 0.693$이 되는지도 확인합니다.
`,
      starter: py`
import numpy as np

def sigmoid(z):
    return 0.0  # TODO

def bce_loss(p, y):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return 0.0  # TODO: 이진 교차 엔트로피의 평균

def gradients(X, y, w, b):
    p = sigmoid(X @ w + b)
    grad_w = np.zeros_like(w)  # TODO: X.T @ (p - y) / n
    grad_b = 0.0               # TODO
    return grad_w, grad_b

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = (X[:, 0] + 0.5 * X[:, 1] + rng.normal(0, 0.5, 200) > 0).astype(int)

w, b = np.zeros(2), 0.0
for step in range(2000):
    gw, gb = gradients(X, y, w, b)
    w, b = w - 0.5 * gw, b - 0.5 * gb
p = sigmoid(X @ w + b)
print("w, b =", np.round(w, 3), round(float(b), 3))
print("손실 =", bce_loss(p, y), " 훈련 정확도 =", np.mean((p >= 0.5) == y))
`,
      tests: py`
import numpy as np

@test("sigmoid(0) = 0.5, sigmoid(0.9) ≈ 0.711")
def _():
    assert approx(sigmoid(0.0), 0.5) and approx(sigmoid(0.9), 0.71095, tol=1e-4), f"sigmoid(0.9) = {sigmoid(0.9)}"

@test("모든 예측이 0.5면 손실 = ln 2")
def _():
    assert approx(bce_loss(np.full(4, 0.5), np.array([0, 1, 0, 1])), np.log(2))

@test("정답에 0.01을 주면 손실이 크다(≈ 4.605)")
def _():
    assert approx(bce_loss(np.array([0.01]), np.array([1])), 4.60517, tol=1e-4)

@test("기울기가 수치미분과 일치한다")
def _():
    rng = np.random.default_rng(1)
    Xt, yt = rng.normal(size=(30, 3)), rng.integers(0, 2, 30)
    w0, b0 = rng.normal(size=3), 0.3
    gw, gb = gradients(Xt, yt, w0, b0)
    L = lambda w, b: bce_loss(sigmoid(Xt @ w + b), yt)
    h = 1e-6
    num_w = [(L(w0 + h * e, b0) - L(w0 - h * e, b0)) / (2 * h) for e in np.eye(3)]
    num_b = (L(w0, b0 + h) - L(w0, b0 - h)) / (2 * h)
    assert approx(gw, num_w, 1e-5) and approx(gb, num_b, 1e-5), f"해석적 {gw}, {gb} / 수치 {np.round(num_w, 6)}, {num_b:.6f}"

@test("학습 후 훈련 정확도 0.85 이상")
def _():
    rng = np.random.default_rng(0)
    Xt = rng.normal(size=(200, 2))
    yt = (Xt[:, 0] + 0.5 * Xt[:, 1] + rng.normal(0, 0.5, 200) > 0).astype(int)
    w, b = np.zeros(2), 0.0
    for _ in range(500):
        gw, gb = gradients(Xt, yt, w, b)
        w, b = w - 0.5 * gw, b - 0.5 * gb
    acc = np.mean((sigmoid(Xt @ w + b) >= 0.5) == yt)
    assert acc >= 0.85, f"정확도 {acc:.3f}"
`,
      hints: [
        "`sigmoid`는 `1 / (1 + np.exp(-z))`입니다. 배열에도 그대로 동작합니다.",
        "손실은 `-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))`입니다.",
        "`grad_w = X.T @ (p - y) / len(y)`, `grad_b = np.mean(p - y)`. 선형회귀의 기울기와 모양이 같다는 점이 2주차의 핵심입니다.",
      ],
      solution: py`
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def bce_loss(p, y):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))

def gradients(X, y, w, b):
    p = sigmoid(X @ w + b)
    grad_w = X.T @ (p - y) / len(y)
    grad_b = np.mean(p - y)
    return grad_w, grad_b

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = (X[:, 0] + 0.5 * X[:, 1] + rng.normal(0, 0.5, 200) > 0).astype(int)

w, b = np.zeros(2), 0.0
for step in range(2000):
    gw, gb = gradients(X, y, w, b)
    w, b = w - 0.5 * gw, b - 0.5 * gb
p = sigmoid(X @ w + b)
print("w, b =", np.round(w, 3), round(float(b), 3))
print("손실 =", bce_loss(p, y), " 훈련 정확도 =", np.mean((p >= 0.5) == y))
`,
    },
    {
      id: "w2-lab-knn",
      sectionId: "knn-naive-bayes",
      title: "KNN 다수결과 나이브 베이즈를 직접 계산하기",
      level: 2,
      prompt: `
「알고리즘 지도 ①」의 두 예제를 라이브러리 없이 구현합니다.

1. \`knn_predict(X_train, y_train, x, k)\`: 유클리드 거리가 가장 가까운 $k$개의 다수결 클래스를 돌려줍니다(\`np.argsort\`, \`np.bincount\` 활용).
2. \`naive_bayes(priors, likelihoods)\`: 클래스마다 사전확률과 단어별 조건부확률을 모두 곱한 값을 구한 뒤 합이 1이 되도록 정규화한 사후확률 딕셔너리를 돌려줍니다. 특징이 서로 조건부 독립이라는 "나이브" 가정이 곱셈 한 줄에 들어 있습니다.
`,
      starter: py`
import numpy as np

def knn_predict(X_train, y_train, x, k=3):
    X_train, x = np.asarray(X_train, dtype=float), np.asarray(x, dtype=float)
    dists = np.zeros(len(X_train))   # TODO: x와 모든 훈련 샘플 사이의 유클리드 거리
    nearest = []                     # TODO: 거리가 가까운 k개의 인덱스
    votes = np.asarray(y_train)[nearest]
    return 0                         # TODO: 다수결 (np.bincount(...).argmax())

def naive_bayes(priors, likelihoods):
    """priors: {클래스: P(클래스)}, likelihoods: {클래스: [P(단어1|클래스), P(단어2|클래스), ...]}"""
    scores = {}
    for c in priors:
        scores[c] = 0.0  # TODO: 사전확률 × 조건부확률들의 곱
    total = sum(scores.values())
    return scores  # TODO: 합이 1이 되도록 나눈 딕셔너리

X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]
print("KNN(k=3) 예측:", knn_predict(X_train, y_train, [2, 2], k=3))
print(naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]}))
`,
      tests: py`
import numpy as np
X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]

@test("본문 예제: (2, 2)는 k=3에서 클래스 0")
def _():
    assert int(knn_predict(X_train, y_train, [2, 2], k=3)) == 0

@test("(5.5, 5.2)는 클래스 1, k=1이면 가장 가까운 한 점의 클래스")
def _():
    assert int(knn_predict(X_train, y_train, [5.5, 5.2], k=3)) == 1
    assert int(knn_predict([[0, 0], [10, 10]], [3, 7], [9, 9], k=1)) == 7

@test("k를 키우면 먼 이웃까지 투표에 참여한다")
def _():
    Xt = [[0, 0], [0, 1], [4, 4], [4, 5], [5, 4]]
    yt = [0, 0, 1, 1, 1]
    assert int(knn_predict(Xt, yt, [1, 1], k=1)) == 0 and int(knn_predict(Xt, yt, [1, 1], k=5)) == 1

@test("스팸 예제: P(스팸 | 무료, 당첨) ≈ 0.9904")
def _():
    post = naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]})
    assert approx(post["스팸"], 0.072 / 0.0727, tol=1e-4), f"결과: {post}"
    assert approx(sum(post.values()), 1.0)

@test("클래스가 셋이어도 동작한다")
def _():
    post = naive_bayes({"a": 0.5, "b": 0.25, "c": 0.25}, {"a": [0.1], "b": [0.4], "c": [0.4]})
    assert approx([post["a"], post["b"], post["c"]], [0.2, 0.4, 0.4]), f"결과: {post}"
`,
      hints: [
        "거리는 `np.sqrt(((X_train - x) ** 2).sum(axis=1))`로 한 번에 구합니다(브로드캐스팅).",
        "`nearest = np.argsort(dists)[:k]`, 다수결은 `np.bincount(votes).argmax()`입니다.",
        "곱은 `prior * np.prod(likelihoods[c])`로 구하고, 마지막에 `{c: s / total for c, s in scores.items()}`로 정규화합니다.",
      ],
      solution: py`
import numpy as np

def knn_predict(X_train, y_train, x, k=3):
    X_train, x = np.asarray(X_train, dtype=float), np.asarray(x, dtype=float)
    dists = np.sqrt(((X_train - x) ** 2).sum(axis=1))
    nearest = np.argsort(dists)[:k]
    votes = np.asarray(y_train)[nearest]
    return int(np.bincount(votes).argmax())

def naive_bayes(priors, likelihoods):
    scores = {}
    for c in priors:
        scores[c] = priors[c] * float(np.prod(likelihoods[c]))
    total = sum(scores.values())
    return {c: s / total for c, s in scores.items()}

X_train = [[1, 1], [2, 1], [1, 2], [5, 5], [6, 5], [5, 6]]
y_train = [0, 0, 0, 1, 1, 1]
print("KNN(k=3) 예측:", knn_predict(X_train, y_train, [2, 2], k=3))
print(naive_bayes({"스팸": 0.3, "정상": 0.7}, {"스팸": [0.6, 0.4], "정상": [0.05, 0.02]}))
`,
    },
    {
      id: "w2-lab-gini",
      sectionId: "trees-ensembles",
      title: "지니 불순도로 가장 좋은 분할 찾기",
      level: 2,
      prompt: `
결정트리가 한 노드에서 하는 일을 직접 구현합니다.

1. \`gini(counts)\` $= 1 - \\sum_i p_i^2$ (클래스별 개수 리스트를 받음)
2. \`split_gain(parent, children)\`: 부모 지니에서 자식 지니의 **샘플 수 가중평균**을 뺀 정보이득
3. \`best_threshold(x, y)\`: 특징 하나 \`x\`에서 $x \\le t$ / $x > t$로 나눌 때 가중 지니가 가장 작은 $t$를 찾습니다. 후보는 정렬한 서로 다른 값들의 **중간점**입니다.
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
      hints: [
        "비율은 `p = counts / counts.sum()`, 지니는 `1 - np.sum(p ** 2)`입니다.",
        "`weighted = sum(sum(c) / n * gini(c) for c in children)`",
        "`k = y.max() + 1`일 때 `np.bincount(left, minlength=k)`가 왼쪽의 클래스별 개수입니다. 가중 지니는 `len(left)/len(y) * gini(...) + len(right)/len(y) * gini(...)`입니다.",
      ],
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
    {
      id: "w2-lab-kmeans",
      sectionId: "svm-unsupervised",
      title: "K-Means 할당·갱신 반복 직접 구현",
      level: 3,
      prompt: `
「알고리즘 지도 ③」에서 손으로 따라간 K-Means를 구현합니다. 한 번의 반복은 **할당**(가장 가까운 중심에 배정)과 **갱신**(군집 평균으로 중심 이동) 두 단계입니다.

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
      hints: [
        "`d = np.linalg.norm(points[:, None, :] - centroids[None, :, :], axis=2)`는 (점 수, 중심 수) 거리 행렬입니다. `d.argmin(axis=1)`이 배정입니다.",
        "`np.array([points[labels == j].mean(axis=0) for j in range(k)])`",
        "반복문 안에서 `if np.allclose(new, centroids): break`를 갱신 전에 검사합니다. 멈춘 뒤의 labels가 최종 배정과 일치하는지도 생각해 보십시오.",
      ],
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
    {
      id: "w2-lab-kfold",
      sectionId: "validation-leakage",
      title: "K-Fold 분할과 누수 없는 fold별 표준화",
      level: 3,
      prompt: `
교차검증의 뼈대를 직접 만듭니다.

1. \`kfold_indices(n, k)\`: 섞지 않고 앞에서부터 $k$개의 연속된 fold로 나눈 \`(train_idx, val_idx)\` 리스트. fold 크기 차이는 최대 1이며, 앞쪽 fold가 하나씩 더 큽니다(\`np.array_split\`과 같은 규칙).
2. \`scale_fold(X_train, X_val)\`: **훈련 fold의 통계로만** 두 부분을 표준화해 \`(X_train_scaled, X_val_scaled)\`를 돌려줍니다.

전체 데이터로 먼저 표준화하는 것과 무엇이 다른지 테스트 항목으로 확인합니다.
`,
      starter: py`
import numpy as np

def kfold_indices(n, k):
    idx = np.arange(n)
    folds = []  # TODO: idx를 k개의 연속 구간으로 나눕니다(np.array_split 사용 가능).
    splits = []
    for i, val in enumerate(folds):
        train = None  # TODO: val을 뺀 나머지 fold를 이어 붙입니다.
        splits.append((train, val))
    return splits

def scale_fold(X_train, X_val):
    # TODO: X_train의 열별 평균·표준편차로 두 배열을 변환합니다.
    return X_train, X_val

for train, val in kfold_indices(10, 3):
    print("train", train, "/ val", val)
`,
      tests: py`
import numpy as np

@test("10개를 3-fold로: 검증 fold 크기 4, 3, 3")
def _():
    splits = kfold_indices(10, 3)
    assert [len(v) for _, v in splits] == [4, 3, 3], f"크기: {[len(v) for _, v in splits]}"
    assert np.asarray(splits[0][1]).tolist() == [0, 1, 2, 3]

@test("검증 fold들이 겹치지 않고 전체를 덮는다")
def _():
    vals = np.concatenate([np.asarray(v) for _, v in kfold_indices(23, 5)])
    assert sorted(vals.tolist()) == list(range(23))

@test("각 분할에서 train과 val이 겹치지 않고 합치면 전체")
def _():
    for train, val in kfold_indices(12, 4):
        t, v = set(np.asarray(train).tolist()), set(np.asarray(val).tolist())
        assert not (t & v) and len(t | v) == 12

@test("훈련 fold 통계로만 표준화: 훈련은 평균 0, 검증은 그대로 두지 않는다")
def _():
    Xtr = np.array([[1.0, 10.0], [3.0, 30.0], [5.0, 50.0]])
    Xva = np.array([[7.0, 70.0]])
    a, b = scale_fold(Xtr, Xva)
    assert approx(np.asarray(a).mean(axis=0), [0, 0]) and approx(np.asarray(a).std(axis=0), [1, 1])
    assert approx(b, [[2.44949, 2.44949]], tol=1e-4), f"검증 변환 결과: {b}"

@test("검증 데이터의 값이 훈련 변환에 영향을 주지 않는다")
def _():
    Xtr = np.array([[1.0], [2.0], [3.0]])
    a1, _ = scale_fold(Xtr, np.array([[100.0]]))
    a2, _ = scale_fold(Xtr, np.array([[-5.0]]))
    assert approx(a1, a2)
`,
      hints: [
        "`folds = np.array_split(idx, k)`는 앞쪽 fold부터 하나씩 더 크게 나눕니다.",
        "`train = np.concatenate([f for j, f in enumerate(folds) if j != i])`",
        "`mu, sd = X_train.mean(axis=0), X_train.std(axis=0)`를 구한 뒤 `(X_train - mu) / sd`, `(X_val - mu) / sd`를 돌려줍니다.",
      ],
      solution: py`
import numpy as np

def kfold_indices(n, k):
    idx = np.arange(n)
    folds = np.array_split(idx, k)
    splits = []
    for i, val in enumerate(folds):
        train = np.concatenate([f for j, f in enumerate(folds) if j != i])
        splits.append((train, val))
    return splits

def scale_fold(X_train, X_val):
    mu, sd = X_train.mean(axis=0), X_train.std(axis=0)
    return (X_train - mu) / sd, (X_val - mu) / sd

for train, val in kfold_indices(10, 3):
    print("train", train, "/ val", val)
`,
    },
    {
      id: "w2-lab-metrics",
      sectionId: "classification-metrics",
      title: "혼동행렬·F1·AUC를 손으로 구현하기",
      level: 2,
      prompt: `
「분류 평가지표」의 스팸 필터 예제와 ROC 예제를 함수로 만듭니다.

1. \`confusion(y_true, y_pred)\`: \`(tp, fp, fn, tn)\`
2. \`prf1(y_true, y_pred)\`: \`(precision, recall, f1)\`. 분모가 0이면 그 지표는 0으로 둡니다.
3. \`auc_by_pairs(y_true, scores)\`: (양성, 음성) 쌍 중 양성의 점수가 더 높은 쌍의 비율. 점수가 같으면 0.5로 셉니다. AUC의 확률적 해석 "무작위로 고른 양성이 무작위로 고른 음성보다 높은 점수를 받을 확률"을 그대로 구현한 것입니다.
`,
      starter: py`
def confusion(y_true, y_pred):
    tp = fp = fn = tn = 0
    for t, p in zip(y_true, y_pred):
        pass  # TODO: 네 칸 중 하나를 1 늘립니다.
    return tp, fp, fn, tn

def prf1(y_true, y_pred):
    tp, fp, fn, tn = confusion(y_true, y_pred)
    precision = 0.0  # TODO (분모가 0이면 0)
    recall = 0.0     # TODO
    f1 = 0.0         # TODO: 조화평균
    return precision, recall, f1

def auc_by_pairs(y_true, scores):
    pos = [s for s, t in zip(scores, y_true) if t == 1]
    neg = [s for s, t in zip(scores, y_true) if t == 0]
    wins = 0.0
    # TODO: 모든 (양성, 음성) 쌍을 비교합니다. 양성이 크면 1, 같으면 0.5
    return wins / (len(pos) * len(neg))

# 스팸 필터: TP 20, FP 5, FN 10, TN 65
y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65
print(confusion(y_true, y_pred), prf1(y_true, y_pred))
print("AUC =", auc_by_pairs([1, 0, 1, 0, 0], [0.9, 0.8, 0.6, 0.5, 0.2]))
`,
      tests: py`
y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65

@test("스팸 필터 혼동행렬 = (20, 5, 10, 65)")
def _():
    assert tuple(confusion(y_true, y_pred)) == (20, 5, 10, 65), f"결과: {confusion(y_true, y_pred)}"

@test("Precision 0.8, Recall ≈ 0.667, F1 ≈ 0.727")
def _():
    p, r, f = prf1(y_true, y_pred)
    assert approx(p, 0.8) and approx(r, 2 / 3) and approx(f, 0.72727, tol=1e-4), f"결과: {(p, r, f)}"

@test("양성을 하나도 예측하지 않으면 Precision = 0 (오류 없이)")
def _():
    p, r, f = prf1([1, 0, 1], [0, 0, 0])
    assert (p, r, f) == (0.0, 0.0, 0.0), f"결과: {(p, r, f)}"

@test("본문 ROC 예제의 AUC = 5/6")
def _():
    assert approx(auc_by_pairs([1, 0, 1, 0, 0], [0.9, 0.8, 0.6, 0.5, 0.2]), 5 / 6)

@test("점수가 같은 쌍은 0.5로 센다, 완벽한 순서면 1")
def _():
    assert approx(auc_by_pairs([1, 0], [0.5, 0.5]), 0.5)
    assert approx(auc_by_pairs([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]), 1.0)
`,
      hints: [
        "`if t == 1 and p == 1: tp += 1`처럼 네 경우를 나눕니다.",
        "`precision = tp / (tp + fp) if tp + fp else 0.0`, F1은 `2 * precision * recall / (precision + recall)`(분모가 0이면 0)입니다.",
        "이중 반복문 `for a in pos: for b in neg:`에서 `a > b`면 1, `a == b`면 0.5를 더합니다.",
      ],
      solution: py`
def confusion(y_true, y_pred):
    tp = fp = fn = tn = 0
    for t, p in zip(y_true, y_pred):
        if t == 1 and p == 1:
            tp += 1
        elif t == 0 and p == 1:
            fp += 1
        elif t == 1 and p == 0:
            fn += 1
        else:
            tn += 1
    return tp, fp, fn, tn

def prf1(y_true, y_pred):
    tp, fp, fn, tn = confusion(y_true, y_pred)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1

def auc_by_pairs(y_true, scores):
    pos = [s for s, t in zip(scores, y_true) if t == 1]
    neg = [s for s, t in zip(scores, y_true) if t == 0]
    wins = 0.0
    for a in pos:
        for b in neg:
            wins += 1.0 if a > b else 0.5 if a == b else 0.0
    return wins / (len(pos) * len(neg))

y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65
print(confusion(y_true, y_pred), prf1(y_true, y_pred))
print("AUC =", auc_by_pairs([1, 0, 1, 0, 0], [0.9, 0.8, 0.6, 0.5, 0.2]))
`,
    },
    {
      id: "w2-lab-regmetrics",
      sectionId: "regression-metrics-baseline",
      title: "회귀 지표와 평균 베이스라인",
      level: 1,
      prompt: `
\`regression_report(y, y_hat)\`가 MAE·MSE·RMSE·$R^2$를 딕셔너리로 돌려주게 완성합니다. $R^2 = 1 - \\dfrac{\\sum (y - \\hat y)^2}{\\sum (y - \\bar y)^2}$는 "평균만 말하는 베이스라인보다 오차를 얼마나 줄였는가"입니다. 그래서 평균을 그대로 예측하면 $R^2 = 0$, 그보다 못하면 음수가 됩니다.
`,
      starter: py`
import numpy as np

def regression_report(y, y_hat):
    y, y_hat = np.asarray(y, dtype=float), np.asarray(y_hat, dtype=float)
    err = y - y_hat
    mae = 0.0   # TODO
    mse = 0.0   # TODO
    rmse = 0.0  # TODO
    r2 = 0.0    # TODO: 1 - (오차 제곱합) / (평균 대비 제곱합)
    return {"MAE": mae, "MSE": mse, "RMSE": rmse, "R2": r2}

print(regression_report([3, 5, 7, 9], [2.5, 5.5, 6, 10]))
print("평균 베이스라인:", regression_report([3, 5, 7, 9], [6, 6, 6, 6]))
`,
      tests: py`
@test("본문 예제: MAE 0.75, MSE 0.625, RMSE ≈ 0.791, R² = 0.875")
def _():
    r = regression_report([3, 5, 7, 9], [2.5, 5.5, 6, 10])
    assert approx([r["MAE"], r["MSE"], r["RMSE"], r["R2"]], [0.75, 0.625, 0.790569, 0.875], tol=1e-5), f"결과: {r}"

@test("평균을 그대로 예측하면 R² = 0")
def _():
    assert approx(regression_report([3, 5, 7, 9], [6, 6, 6, 6])["R2"], 0.0)

@test("평균보다 못한 예측은 R²가 음수")
def _():
    assert regression_report([1, 2, 3], [3, 2, 1])["R2"] < 0

@test("MAE와 MSE: [2, 4, 6] vs [3, 3, 9]")
def _():
    r = regression_report([2, 4, 6], [3, 3, 9])
    assert approx(r["MAE"], 5 / 3) and approx(r["MSE"], 11 / 3), f"결과: {r}"
`,
      hints: [
        "MAE는 `np.mean(np.abs(err))`, MSE는 `np.mean(err ** 2)`, RMSE는 `np.sqrt(mse)`입니다.",
        "$R^2$는 `1 - np.sum(err ** 2) / np.sum((y - y.mean()) ** 2)`입니다.",
      ],
      solution: py`
import numpy as np

def regression_report(y, y_hat):
    y, y_hat = np.asarray(y, dtype=float), np.asarray(y_hat, dtype=float)
    err = y - y_hat
    mae = float(np.mean(np.abs(err)))
    mse = float(np.mean(err ** 2))
    rmse = float(np.sqrt(mse))
    r2 = float(1 - np.sum(err ** 2) / np.sum((y - y.mean()) ** 2))
    return {"MAE": mae, "MSE": mse, "RMSE": rmse, "R2": r2}

print(regression_report([3, 5, 7, 9], [2.5, 5.5, 6, 10]))
print("평균 베이스라인:", regression_report([3, 5, 7, 9], [6, 6, 6, 6]))
`,
    },
  ],

  quiz: [
    {
      kind: "choice",
      id: "w2-drill-logistic-sign",
      sectionId: "regression-logistic",
      question: "로지스틱 회귀 학습 루프에서 `grad_w = X.T @ (p - y) / len(y)`를 실수로 `X.T @ (y - p) / len(y)`로 쓰고 `w -= lr * grad_w`로 갱신하면?",
      choices: [
        "결과는 같다. 부호는 학습률이 알아서 보정한다",
        "손실을 키우는 방향으로 움직여(경사 상승) 손실이 커지고 정확도가 떨어진다",
        "학습 속도만 두 배로 느려진다",
        "편향 b만 잘못 학습되고 w는 정상이다",
      ],
      answer: 1,
      explanation:
        "$(y - p)x$는 손실의 기울기에 −1을 곱한 값입니다. 여기에 `w -= lr * grad`를 적용하면 결국 기울기 방향으로 더하는 셈이라 손실이 커집니다. 기울기를 직접 구현할 때 수치미분으로 검산해야 하는 이유입니다.",
    },
    {
      kind: "choice",
      id: "w2-drill-knn-scale",
      sectionId: "knn-naive-bayes",
      question: "방 개수(1~5)와 면적(20~200㎡) 두 특징으로 KNN을 할 때 스케일링을 하지 않으면?",
      choices: [
        "KNN은 거리 기반이 아니라서 아무 영향이 없다",
        "값의 범위가 큰 면적이 거리를 사실상 혼자 결정해, 방 개수 정보가 거의 무시된다",
        "방 개수가 거리를 지배한다",
        "K가 자동으로 커져 과소적합된다",
      ],
      answer: 1,
      explanation:
        "유클리드 거리는 각 특징 차이의 제곱합이므로 범위가 큰 특징의 차이(수십~수백)가 작은 특징의 차이(1~4)를 압도합니다. 표준화나 Min-Max 정규화로 범위를 맞춘 뒤 거리를 재야 두 특징이 공정하게 반영됩니다.",
    },
    {
      kind: "choice",
      id: "w2-drill-ridge",
      sectionId: "bias-variance",
      question: "12차 다항 특징에 Ridge를 적용하고 `alpha`를 `1e-8`에서 `10`까지 키울 때 **훈련** 오차는 대체로 어떻게 되는가?",
      choices: ["계속 줄어든다", "커진다. 규제가 강할수록 훈련 데이터에 맞추는 자유가 줄어든다", "U자 모양을 그린다", "변하지 않는다"],
      answer: 1,
      explanation:
        "규제 항이 커질수록 가중치를 작게 유지하는 쪽을 택하므로 훈련 데이터에 덜 맞춥니다. 그래서 훈련 오차는 커지고, 검증 오차는 적당한 alpha에서 가장 작아지는 U자 모양을 그립니다.",
    },
    {
      kind: "choice",
      id: "w2-drill-leaky-select",
      sectionId: "validation-leakage",
      question: "`X_sel = SelectKBest(k=20).fit_transform(X, y)` 다음에 `cross_val_score(model, X_sel, y, cv=5)`를 실행했다. 무엇이 문제인가?",
      choices: [
        "문제없다. 특징 선택은 레이블을 쓰지 않는다",
        "특징을 고를 때 검증 fold의 레이블까지 봤기 때문에 교차검증 점수가 부풀려진다",
        "fold 수가 너무 적다",
        "SelectKBest는 분류에 쓸 수 없다",
      ],
      answer: 1,
      explanation:
        "SelectKBest는 각 특징과 레이블 y의 관계로 특징을 고르므로, 전체 데이터로 먼저 고르면 검증 fold의 정답 정보가 학습 단계에 새어 들어갑니다. 특징 선택까지 파이프라인에 넣어 fold마다 훈련 부분으로만 고르게 해야 합니다.",
    },
    {
      kind: "predict",
      id: "w2-drill-iqr",
      sectionId: "data-cleaning",
      code: py`
import numpy as np
data = np.array([12, 13, 13, 14, 14, 15, 16, 95])
q1, q3 = np.median(data[:4]), np.median(data[4:])
print(q1, q3, q3 + 1.5 * (q3 - q1))
`,
      expected: "13.0 15.5 19.25",
      explanation: "앞쪽 절반 `[12, 13, 13, 14]`의 중앙값은 13, 뒤쪽 절반 `[14, 15, 16, 95]`의 중앙값은 15.5입니다. IQR = 2.5이므로 위쪽 울타리는 15.5 + 3.75 = 19.25입니다.",
    },
    {
      kind: "predict",
      id: "w2-drill-dummies",
      sectionId: "features",
      code: py`
import pandas as pd
df = pd.DataFrame({"도시": ["서울", "부산", "서울"]})
dummies = pd.get_dummies(df["도시"], dtype=int)
print(list(dummies.columns))
print(dummies.values.tolist())
`,
      expected: "['부산', '서울']\n[[0, 1], [1, 0], [0, 1]]",
      explanation:
        "원-핫 인코딩은 범주마다 0/1 열을 하나씩 만들며, 열은 범주 이름의 정렬 순서(부산, 서울)로 놓입니다. 각 행은 자기 도시 열만 1입니다. 순서가 없는 명목형 변수에 정수 하나(서울=0, 부산=1)를 주면 생기는 가짜 크기 관계가 사라집니다.",
    },
    {
      kind: "predict",
      id: "w2-drill-boosting",
      sectionId: "trees-ensembles",
      code: py`
y = [10, 20, 30]
F = [20.0, 20.0, 20.0]
for m in range(2):
    F = [f + 0.1 * (t - f) for f, t in zip(F, y)]
print([round(f, 2) for f in F])
`,
      expected: "[18.1, 20.0, 21.9]",
      explanation:
        "잔차를 정확히 맞히는 약한 학습기를 학습률 0.1로 더한다고 가정한 부스팅입니다. 1회 뒤 `[19, 20, 21]`, 2회 뒤에는 잔차 `[-9, 0, 9]`의 0.1배를 더해 `[18.1, 20.0, 21.9]`가 됩니다. 오차가 매번 0.9배씩 줄어듭니다.",
    },
    {
      kind: "predict",
      id: "w2-drill-threshold",
      sectionId: "classification-metrics",
      code: py`
y_true = [1, 1, 0, 0, 0]
scores = [0.9, 0.6, 0.8, 0.5, 0.2]
for t in (0.85, 0.55):
    pred = [int(s >= t) for s in scores]
    tp = sum(p == 1 and y == 1 for p, y in zip(pred, y_true))
    fp = sum(p == 1 and y == 0 for p, y in zip(pred, y_true))
    print(t, tp, fp)
`,
      expected: "0.85 1 0\n0.55 2 1",
      explanation:
        "임계값 0.85에서는 0.9 하나만 양성으로 예측해 TP 1, FP 0입니다. 0.55로 낮추면 0.9, 0.8, 0.6이 양성으로 예측되어 TP 2(0.9, 0.6), FP 1(0.8)이 됩니다. 임계값을 낮출수록 Recall은 오르고 FP도 늘어납니다.",
    },
    {
      kind: "descriptive",
      id: "w2-drill-leak-explain",
      sectionId: "validation-leakage",
      question:
        "「데이터 분할·교차검증·데이터 누수」 실습에서 동전 던지기로 만든 레이블인데도 '누수 있는 교차검증'이 약 0.85를 낸 과정을 단계별로 설명하고, 파이프라인이 이를 어떻게 막는지 적으십시오.",
      modelAnswer:
        "의미 없는 특징이 5,000개나 되면 순전히 우연으로 레이블과 상관이 높아 보이는 특징이 생깁니다. 잘못된 방법은 전체 100개 샘플(검증 fold 포함)의 레이블을 보고 그런 특징 20개를 먼저 골랐기 때문에, 고른 특징이 검증 fold의 레이블과도 우연히 맞도록 이미 맞춰져 있습니다. 그래서 교차검증이 '처음 보는 데이터'를 평가하지 못하고 0.85 같은 가짜 점수가 나옵니다. 특징 선택을 파이프라인에 넣으면 fold마다 훈련 부분의 레이블만 보고 특징을 고르므로, 검증 fold에서는 우연한 상관이 재현되지 않아 정확도가 0.5 근처로 돌아옵니다.",
      keyPoints: ["특징이 많으면 우연히 레이블과 상관 있는 특징이 생긴다", "전체 데이터(검증 fold 포함)의 레이블로 특징을 골랐다", "검증 fold가 더 이상 처음 보는 데이터가 아니다", "파이프라인은 fold마다 훈련 부분으로만 선택한다"],
    },
    {
      kind: "descriptive",
      id: "w2-drill-ridge-u",
      sectionId: "bias-variance",
      question: "Ridge의 `alpha`를 바꾼 실험에서 검증 오차가 U자 모양을 그린 이유를 편향과 분산으로 설명하고, '다항식 차수를 낮추는 것'과 '규제를 강하게 하는 것'의 같은 점과 다른 점을 한 가지씩 적으십시오.",
      modelAnswer:
        "alpha가 아주 작으면 12차 다항식이 훈련 데이터의 잡음까지 따라가 분산이 커지고 검증 오차가 큽니다. alpha를 키우면 가중치가 작아져 함수가 매끄러워지고 분산이 줄어 검증 오차가 내려가지만, 너무 크면 사인 곡선조차 표현하지 못해 편향이 커지고 다시 오차가 올라갑니다. 두 방법 모두 모델이 표현할 수 있는 함수의 복잡도를 줄여 분산을 낮춘다는 점은 같습니다. 다른 점은, 차수를 낮추면 고차 항 자체를 없애 표현 가능한 함수족을 바꾸지만, 규제는 12차 항을 그대로 두고 계수의 크기에 벌점을 줘 연속적으로 복잡도를 조절한다는 것입니다.",
      keyPoints: ["alpha가 작으면 분산이 크다(잡음까지 맞춤)", "alpha가 크면 편향이 크다(과소적합)", "둘 다 복잡도를 줄여 분산을 낮춘다", "차수 감소는 항을 없애고, 규제는 계수 크기를 연속적으로 줄인다"],
    },
    {
      kind: "descriptive",
      id: "w2-drill-threshold-cancer",
      sectionId: "classification-metrics",
      question:
        "유방암 데이터로 **악성 종양 검진**을 한다면 임계값을 어느 방향으로 움직여야 합니까? 이 데이터에서 클래스 0이 악성이라는 점과, 코드의 `score = clf.predict_proba(Xte)[:, 1]`이 무엇의 확률인지에 주의해 설명하십시오.",
      modelAnswer:
        "`predict_proba(...)[:, 1]`은 클래스 1, 즉 **양성 종양**일 확률입니다. 악성을 놓치는 것(악성인데 양성 종양으로 판정)이 치명적이므로, 양성 종양이라고 판정하는 기준을 까다롭게 해야 합니다. 즉 `score >= t`일 때만 양성 종양으로 보고 나머지는 악성 의심으로 보낸다면 임계값 t를 **올려야** 합니다. 그러면 악성에 대한 Recall이 올라가는 대신, 실제로는 양성 종양인 사람을 정밀 검사로 더 많이 보내게 됩니다(오진 비용 증가). 반대로 악성 확률(1 − score)을 기준으로 삼는다면 그 임계값은 낮추는 것이 같은 결정입니다.",
      keyPoints: ["[:, 1]은 클래스 1(양성 종양)의 확률이다", "악성을 놓치지 않는 것(악성 Recall)이 우선이다", "양성 종양 판정 임계값을 올린다", "대신 불필요한 정밀 검사(오진)가 늘어난다"],
    },
  ],

  assignment: {
    requirements: [
      "로지스틱 회귀를 `StandardScaler`와 함께 `make_pipeline`으로 묶어 TODO를 채운다. 스케일링을 파이프라인 밖에서 하지 않는다.",
      "세 모델(다수결·로지스틱·랜덤 포레스트)을 **같은** `StratifiedKFold` 분할로 평가해 F1·ROC-AUC의 평균 ± 표준편차와 fold별 짝지은 차이를 보고한다.",
      "클래스 비율과 혼동행렬·Precision·Recall을 근거로 이 문제에서 가장 중요한 지표를 고른다.",
      "누수 (a) 분할 전 스케일링, (b) 타깃 파생 특징을 실제로 만들어 교차검증 점수가 부풀려지는 크기를 비교·설명한다.",
      "결정트리 깊이(1·3·5·제한 없음)별 테스트 정확도의 평균·표준편차를 편향과 분산으로 해석한다.",
    ],
    autoTests: [
      {
        id: "w2-at-pipeline",
        taskId: "compare",
        title: "로지스틱 회귀가 StandardScaler를 포함한 Pipeline이다",
        code: py`
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
m = models["Logistic Regression"]
assert isinstance(m, Pipeline), f"Pipeline이 아니라 {type(m).__name__}입니다."
assert any(isinstance(s, StandardScaler) for _, s in m.steps), f"단계: {[type(s).__name__ for _, s in m.steps]}"
assert isinstance(m.steps[-1][1], LogisticRegression), "마지막 단계가 LogisticRegression이 아닙니다."
`,
        hint: "`make_pipeline(StandardScaler(), LogisticRegression(max_iter=...))`처럼 묶습니다.",
      },
      {
        id: "w2-at-scores",
        taskId: "compare",
        title: "세 모델 모두 5-fold 점수가 있고 로지스틱 F1이 0.9를 넘는다",
        code: py`
assert set(scores) == {"Dummy (다수결)", "Logistic Regression", "Random Forest"}, f"모델 이름: {list(scores)}"
for name, s in scores.items():
    assert len(s["F1"]) == 5 and len(s["ROC-AUC"]) == 5, f"{name}의 fold 수가 5가 아닙니다."
f1 = scores["Logistic Regression"]["F1"].mean()
assert f1 > 0.9, f"로지스틱 F1 평균 = {f1:.3f}"
`,
      },
      {
        id: "w2-at-metric",
        taskId: "metric",
        title: "테스트셋에서 악성 Recall이 0.8 이상",
        code: py`
from sklearn.metrics import recall_score
r = recall_score(y_test, pred)
assert r >= 0.8, f"Recall = {r:.3f}. 로지스틱 회귀 파이프라인으로 학습했는지 확인하십시오."
`,
      },
      {
        id: "w2-at-leak",
        taskId: "leak",
        title: "두 누수를 실제로 만들었고 타깃 파생 특징이 점수를 크게 부풀린다",
        code: py`
import numpy as np
assert X_scaled_all.shape == Xw.shape and np.allclose(X_scaled_all.mean(axis=0), 0, atol=1e-6), "X_scaled_all이 전체 데이터로 표준화되지 않았습니다."
assert X_leaky.shape[1] == Xw.shape[1] + 1, f"X_leaky의 열 수가 {X_leaky.shape[1]}입니다(원래 {Xw.shape[1]} + 1이어야 함)."
assert leak_b - clean > 0.05, f"타깃 파생 특징의 부풀림이 {leak_b - clean:+.4f}뿐입니다."
`,
      },
    ],
    challenges: [
      {
        id: "w2-ch-logreg-l2",
        title: "L2 규제 로지스틱 회귀를 NumPy로 구현해 sklearn과 맞추기",
        level: 3,
        prompt: `
목적함수 $\\dfrac{1}{n}\\sum \\text{BCE} + \\dfrac{\\lambda}{2}\\lVert w \\rVert^2$(편향은 규제하지 않음)를 경사하강법으로 최소화하는 \`fit_logreg(X, y, l2, lr, steps)\`를 구현합니다.

scikit-learn의 \`LogisticRegression(C=...)\`은 $C\\sum \\text{BCE} + \\tfrac{1}{2}\\lVert w \\rVert^2$을 최소화하므로, 양변을 $Cn$으로 나누면 $C = \\dfrac{1}{n\\lambda}$일 때 두 목적함수의 최솟값이 같습니다. 이 대응을 이용해 계수가 소수 둘째 자리까지 일치하는지 확인합니다.
`,
        starter: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

def fit_logreg(X, y, l2=0.01, lr=0.5, steps=3000):
    n, d = X.shape
    w, b = np.zeros(d), 0.0
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        grad_w = np.zeros(d)  # TODO: 평균 BCE의 기울기 + L2 항의 기울기
        grad_b = 0.0          # TODO: 편향은 규제하지 않습니다.
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = (X @ np.array([2.0, -1.0]) + 0.3 + rng.normal(0, 1, 200) > 0).astype(int)

l2 = 0.01
w, b = fit_logreg(X, y, l2)
sk = LogisticRegression(C=1 / (len(y) * l2)).fit(X, y)
print("직접 구현:", np.round(w, 3), round(float(b), 3))
print("sklearn  :", np.round(sk.coef_[0], 3), round(float(sk.intercept_[0]), 3))
`,
        tests: py`
import numpy as np
from sklearn.linear_model import LogisticRegression
rng = np.random.default_rng(0)
Xt = rng.normal(size=(200, 2))
yt = (Xt @ np.array([2.0, -1.0]) + 0.3 + rng.normal(0, 1, 200) > 0).astype(int)

@test("λ = 0.01: sklearn(C = 1/(nλ))과 계수가 0.01 이내로 일치")
def _():
    w, b = fit_logreg(Xt, yt, l2=0.01)
    sk = LogisticRegression(C=1 / (200 * 0.01)).fit(Xt, yt)
    assert approx(w, sk.coef_[0], 1e-2) and abs(b - sk.intercept_[0]) < 1e-2, f"{w}, {b} vs {sk.coef_[0]}, {sk.intercept_[0]}"

@test("규제를 키우면 가중치 크기가 줄어든다")
def _():
    w_small, _ = fit_logreg(Xt, yt, l2=0.001)
    w_big, _ = fit_logreg(Xt, yt, l2=0.5)
    assert np.linalg.norm(w_big) < np.linalg.norm(w_small), f"|w|: {np.linalg.norm(w_small):.3f} → {np.linalg.norm(w_big):.3f}"

@test("편향은 규제하지 않는다(강한 규제에서도 편향이 0으로 끌려가지 않음)")
def _():
    Xs = rng.normal(size=(300, 1)) * 0.01
    ys = (rng.random(300) < 0.8).astype(int)
    _, b = fit_logreg(Xs, ys, l2=1.0, steps=4000)
    assert abs(b - np.log(ys.mean() / (1 - ys.mean()))) < 0.05, f"편향 {b:.3f}, 기대 {np.log(ys.mean() / (1 - ys.mean())):.3f}"
`,
        hints: [
          "평균 BCE의 기울기는 `X.T @ (p - y) / n`, `np.mean(p - y)`입니다.",
          "$\\frac{\\lambda}{2}\\lVert w \\rVert^2$의 기울기는 $\\lambda w$입니다. `grad_w`에만 더합니다.",
          "편향에 규제를 걸면 강한 규제에서 편향이 0 쪽으로 끌려가 데이터의 기본 비율을 표현하지 못합니다.",
        ],
        solution: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

def fit_logreg(X, y, l2=0.01, lr=0.5, steps=3000):
    n, d = X.shape
    w, b = np.zeros(d), 0.0
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        grad_w = X.T @ (p - y) / n + l2 * w
        grad_b = np.mean(p - y)
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b

rng = np.random.default_rng(0)
X = rng.normal(size=(200, 2))
y = (X @ np.array([2.0, -1.0]) + 0.3 + rng.normal(0, 1, 200) > 0).astype(int)

l2 = 0.01
w, b = fit_logreg(X, y, l2)
sk = LogisticRegression(C=1 / (len(y) * l2)).fit(X, y)
print("직접 구현:", np.round(w, 3), round(float(b), 3))
print("sklearn  :", np.round(sk.coef_[0], 3), round(float(sk.intercept_[0]), 3))
`,
      },
      {
        id: "w2-ch-bias-variance",
        title: "부트스트랩으로 편향²과 분산을 숫자로 분해하기",
        level: 3,
        prompt: `
같은 참함수 $f(x) = \\sin 2\\pi x$에서 훈련 데이터를 여러 번 새로 뽑아 다항식 모델을 학습하면, 고정한 점들에서의 예측이 데이터에 따라 흔들립니다.

1. \`decompose(preds, truth)\`: \`preds\`의 shape은 (데이터셋 수, 평가 점 수)입니다. 평가 점마다 $\\text{bias}^2 = (\\bar{\\hat y} - f)^2$, $\\text{variance} = \\overline{(\\hat y - \\bar{\\hat y})^2}$를 구한 뒤 점들에 대해 평균낸 \`(bias2, variance)\`를 돌려줍니다.
2. \`simulate(degree, n_sets, seed)\`: \`n_sets\`개의 훈련 데이터(각 30점, 잡음 표준편차 0.3)에 \`np.polyfit\`으로 \`degree\`차 다항식을 맞추고, 평가 점 \`X_EVAL\`에서의 예측 배열을 돌려줍니다.

차수 1(과소적합)과 9(과적합)의 편향$^2$·분산을 비교해 보십시오.
`,
        starter: py`
import numpy as np

X_EVAL = np.linspace(0.1, 0.9, 30)
f = lambda x: np.sin(2 * np.pi * x)

def decompose(preds, truth):
    preds = np.asarray(preds, dtype=float)
    mean_pred = preds.mean(axis=0)          # 평가 점마다의 평균 예측
    bias2 = 0.0     # TODO
    variance = 0.0  # TODO
    return bias2, variance

def simulate(degree, n_sets=200, seed=0):
    rng = np.random.default_rng(seed)
    preds = []
    for _ in range(n_sets):
        x = rng.uniform(0, 1, 30)
        y = f(x) + rng.normal(0, 0.3, 30)
        # TODO: np.polyfit(x, y, degree)로 계수를 구하고 np.polyval로 X_EVAL에서 예측해 preds에 추가합니다.
    return np.array(preds)

print("모델 B 예시:", decompose([[6], [14], [8], [15], [7]], [10]))
for d in (1, 3, 9):
    b2, var = decompose(simulate(d), f(X_EVAL))
    print(f"차수 {d}: 편향² = {b2:.4f}, 분산 = {var:.4f}")
`,
        tests: py`
import numpy as np

@test("본문 모델 B: 편향² 0, 분산 14.0")
def _():
    b2, var = decompose([[6], [14], [8], [15], [7]], [10])
    assert approx(b2, 0.0) and approx(var, 14.0), f"결과: {(b2, var)}"

@test("본문 모델 C: 편향² ≈ 8.41")
def _():
    b2, var = decompose([[7.1], [7.3], [6.9], [7.2], [7.0]], [10])
    assert approx(b2, 8.41, tol=1e-3) and var < 0.05, f"결과: {(b2, var)}"

@test("simulate가 (데이터셋 수, 평가 점 수) 배열을 돌려준다")
def _():
    p = simulate(3, n_sets=5)
    assert np.shape(p) == (5, len(X_EVAL)), f"shape: {np.shape(p)}"

@test("차수 1은 편향²이 크고, 차수 9는 분산이 크다")
def _():
    b1, v1 = decompose(simulate(1), f(X_EVAL))
    b9, v9 = decompose(simulate(9), f(X_EVAL))
    assert b1 > 10 * b9, f"편향²: 차수1 {b1:.4f}, 차수9 {b9:.4f}"
    assert v9 > 3 * v1, f"분산: 차수1 {v1:.4f}, 차수9 {v9:.4f}"
`,
        hints: [
          "편향$^2$은 `np.mean((mean_pred - truth) ** 2)`입니다.",
          "분산은 `np.mean((preds - mean_pred) ** 2)`처럼 데이터셋 축과 평가 점 축 모두에 대해 평균냅니다.",
          "`coef = np.polyfit(x, y, degree)` 다음 `preds.append(np.polyval(coef, X_EVAL))`입니다.",
        ],
        solution: py`
import numpy as np

X_EVAL = np.linspace(0.1, 0.9, 30)
f = lambda x: np.sin(2 * np.pi * x)

def decompose(preds, truth):
    preds = np.asarray(preds, dtype=float)
    mean_pred = preds.mean(axis=0)
    bias2 = float(np.mean((mean_pred - np.asarray(truth, dtype=float)) ** 2))
    variance = float(np.mean((preds - mean_pred) ** 2))
    return bias2, variance

def simulate(degree, n_sets=200, seed=0):
    rng = np.random.default_rng(seed)
    preds = []
    for _ in range(n_sets):
        x = rng.uniform(0, 1, 30)
        y = f(x) + rng.normal(0, 0.3, 30)
        coef = np.polyfit(x, y, degree)
        preds.append(np.polyval(coef, X_EVAL))
    return np.array(preds)

print("모델 B 예시:", decompose([[6], [14], [8], [15], [7]], [10]))
for d in (1, 3, 9):
    b2, var = decompose(simulate(d), f(X_EVAL))
    print(f"차수 {d}: 편향² = {b2:.4f}, 분산 = {var:.4f}")
`,
      },
    ],
  },
};

export default week2;
