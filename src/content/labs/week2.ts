import type { WeekLab } from "../types";
import { py } from "./util";

// 2주차 코딩 실습
//   핵심: 이상치 판정, 훈련 통계로만 표준화, 로지스틱 회귀 기울기, 지니 분할, K-Fold, 분류·회귀 지표
//   보충: KNN·나이브 베이즈, K-Means, 혼합형 파이프라인·그룹 누수, 비용 기반 임계값·신뢰도 표
//   심화: Ridge = MAP·로지스틱 헤세 행렬, 최소 노름 보간과 이중 하강, 보정된 t 검정
const week2: WeekLab = {
  exercises: [
    {
      id: "w2-lab-outliers",
      sectionId: "data-cleaning",
      title: "IQR과 Z-score: 같은 데이터, 다른 결론",
      tier: "core",
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
      title: "훈련 통계로만 변환하는 표준화 함수 만들기",
      tier: "core",
      prompt: `
scikit-learn의 \`StandardScaler\`가 하는 일을 함수 두 개로 나눠 구현하고, "훈련 데이터로만 fit, 테스트에는 transform만" 원칙을 코드로 확인합니다.

1. \`fit_stats(X)\`: 열별 평균과 표준편차(모집단 기준, \`ddof=0\`)를 \`(mean, std)\` 튜플로 돌려줍니다. scaler의 \`fit\`에 해당합니다.
2. \`standardize(X, mean, std)\`: **넘겨받은 통계로만** $(X - \\text{mean}) / \\text{std}$를 계산합니다. scaler의 \`transform\`에 해당합니다.
3. \`minmax(x)\`: 1차원 배열을 $\\dfrac{x - \\min}{\\max - \\min}$으로 0~1에 맞춥니다.

훈련 \`[[10], [20], [30]]\`의 통계로 변환하면 테스트 40은 약 2.449가 되어야 합니다.
`,
      starter: py`
import numpy as np

def fit_stats(X):
    """열별 (평균, 표준편차)"""
    X = np.asarray(X, dtype=float)
    mean = None  # TODO: 열별 평균 (axis 주의)
    std = None   # TODO: 열별 표준편차
    return mean, std

def standardize(X, mean, std):
    """넘겨받은 통계로만 표준화한다"""
    X = np.asarray(X, dtype=float)
    return X  # TODO

def minmax(x):
    x = np.asarray(x, dtype=float)
    return x  # TODO

train = np.array([[10.0], [20.0], [30.0]])
test = np.array([[40.0]])
mean, std = fit_stats(train)
print("훈련 평균, 표준편차:", mean, std)
print("테스트 40 →", standardize(test, mean, std).ravel())
print("minmax([2, 4, 6, 8]) =", minmax([2, 4, 6, 8]))
`,
      tests: py`
import numpy as np
train = np.array([[10.0], [20.0], [30.0]])

@test("훈련 통계: 평균 20, 표준편차 ≈ 8.165")
def _():
    mean, std = fit_stats(train)
    assert mean is not None and std is not None, "fit_stats가 None을 돌려줍니다."
    assert approx(mean, [20.0]) and approx(std, [8.16497], tol=1e-4), f"평균 {mean}, 표준편차 {std}"

@test("테스트 40은 훈련 통계로 ≈ 2.449")
def _():
    got = np.asarray(standardize([[40.0]], *fit_stats(train))).ravel()
    assert approx(got, [2.44949], tol=1e-4), f"결과: {got}"

@test("여러 열을 열마다 따로 표준화한다")
def _():
    X = np.array([[1, 20], [2, 45], [3, 80], [4, 130], [5, 200]])
    Z = np.asarray(standardize(X, *fit_stats(X)))
    assert approx(Z.mean(axis=0), [0, 0]) and approx(Z.std(axis=0), [1, 1]), f"열 평균 {Z.mean(axis=0)}, 열 표준편차 {Z.std(axis=0)}"

@test("standardize는 받은 통계만 쓴다(X에서 다시 구하지 않는다)")
def _():
    got = np.asarray(standardize([[0.0], [100.0]], np.array([50.0]), np.array([10.0]))).ravel()
    assert approx(got, [-5.0, 5.0]), f"결과: {got}"

@test("테스트까지 섞어 fit하면 값이 달라진다(≈ 1.342)")
def _():
    got = np.asarray(standardize([[40.0]], *fit_stats(np.vstack([train, [[40.0]]])))).ravel()
    assert approx(got, [1.34164], tol=1e-4), f"결과: {got}"

@test("minmax([2, 4, 6, 8]) = [0, 1/3, 2/3, 1]")
def _():
    assert approx(minmax([2, 4, 6, 8]), [0, 1 / 3, 2 / 3, 1])
`,
      hints: [
        "샘플이 행, 특징이 열이므로 열별 통계는 `X.mean(axis=0)`, `X.std(axis=0)`입니다.",
        "`standardize`는 `(X - mean) / std`입니다. 여기서 X의 평균을 다시 구하면 안 됩니다. 그것이 바로 누수입니다.",
        "`minmax`는 `(x - x.min()) / (x.max() - x.min())`입니다.",
      ],
      solution: py`
import numpy as np

def fit_stats(X):
    X = np.asarray(X, dtype=float)
    return X.mean(axis=0), X.std(axis=0)

def standardize(X, mean, std):
    X = np.asarray(X, dtype=float)
    return (X - mean) / std

def minmax(x):
    x = np.asarray(x, dtype=float)
    return (x - x.min()) / (x.max() - x.min())

train = np.array([[10.0], [20.0], [30.0]])
test = np.array([[40.0]])
mean, std = fit_stats(train)
print("훈련 평균, 표준편차:", mean, std)
print("테스트 40 →", standardize(test, mean, std).ravel())
print("minmax([2, 4, 6, 8]) =", minmax([2, 4, 6, 8]))
`,
    },
    {
      id: "w2-lab-logistic",
      sectionId: "regression-logistic",
      title: "로지스틱 회귀의 손실과 기울기 (p − y)x",
      tier: "core",
      prompt: `
「문제 유형과 손실함수」 단계의 로지스틱 회귀를 부품으로 나눠 구현합니다. 학습 루프는 이미 작성되어 있습니다.

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
      id: "w2-lab-gini",
      sectionId: "trees-ensembles",
      title: "지니 불순도로 가장 좋은 분할 찾기",
      tier: "core",
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
      id: "w2-lab-kfold",
      sectionId: "validation-leakage",
      title: "K-Fold 분할과 누수 없는 fold별 표준화",
      tier: "core",
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
      tier: "core",
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
      tier: "core",
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
    {
      id: "w2-lab-knn",
      sectionId: "knn-naive-bayes",
      title: "KNN 다수결과 나이브 베이즈를 직접 계산하기",
      tier: "supplement",
      prompt: `
「KNN과 나이브 베이즈」 단계의 두 예제를 라이브러리 없이 구현합니다.

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
      id: "w2-lab-kmeans",
      sectionId: "svm-unsupervised",
      title: "K-Means 할당·갱신 반복 직접 구현",
      tier: "supplement",
      prompt: `
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
      id: "w2-lab-pipeline",
      sectionId: "pipeline-tuning",
      title: "혼합형 데이터 파이프라인과 그룹 누수 측정",
      tier: "supplement",
      prompt: `
「실전 파이프라인」 단계의 세 도구를 함수로 만듭니다.

1. \`build_model(num_cols, cat_cols)\`: 숫자 열은 \`SimpleImputer(strategy="median")\` → \`StandardScaler\`, 범주 열은 \`OneHotEncoder(handle_unknown="ignore")\`로 처리하는 \`ColumnTransformer\`를 만들고, 뒤에 \`LogisticRegression(max_iter=1000)\`을 붙인 파이프라인을 돌려줍니다.
2. \`tune(model, X, y)\`: \`logisticregression__C\` 후보 \`[0.01, 0.1, 1, 10]\`을 \`StratifiedKFold(5, shuffle=True, random_state=0)\`, \`scoring="roc_auc"\`로 탐색해 **학습을 마친** \`GridSearchCV\`를 돌려줍니다.
3. \`group_gap(model, X, y, groups)\`: \`KFold(5, shuffle=True, random_state=0)\`와 \`GroupKFold(5)\`의 평균 정확도를 \`(kfold, group)\` 튜플로 돌려줍니다.
`,
      starter: py`
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, StratifiedKFold, KFold, GroupKFold, cross_val_score

def build_model(num_cols, cat_cols):
    # TODO: ColumnTransformer(숫자: 중앙값 대체 → 표준화, 범주: 원-핫) + LogisticRegression 파이프라인
    return LogisticRegression(max_iter=1000)

def tune(model, X, y):
    # TODO: GridSearchCV로 logisticregression__C를 탐색하고 fit까지 한 객체를 돌려줍니다.
    return None

def group_gap(model, X, y, groups):
    kfold = 0.0  # TODO: KFold(5, shuffle=True, random_state=0) 교차검증 정확도 평균
    group = 0.0  # TODO: GroupKFold(5) 교차검증 정확도 평균 (groups 인자 전달)
    return kfold, group

df = pd.DataFrame({"나이": [25, 47, 33, 52, 41, 38], "소득": [210, np.nan, 260, 400, np.nan, 300],
                   "도시": ["서울", "부산", "서울", "대구", "부산", "서울"]})
model = build_model(["나이", "소득"], ["도시"])
print(model)
`,
      tests: py`
import numpy as np
import pandas as pd
from sklearn.neighbors import KNeighborsClassifier

def customers():
    rng = np.random.default_rng(0)
    n = 300
    age = rng.integers(20, 70, n).astype(float)
    income = rng.normal(300, 80, n)
    city = rng.choice(["서울", "부산", "대구"], n, p=[0.5, 0.3, 0.2])
    logit = 0.04 * (age - 45) + 0.01 * (income - 300) + np.where(city == "서울", 0.8, np.where(city == "부산", -0.4, 0.0))
    y = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)
    income[rng.random(n) < 0.15] = np.nan
    return pd.DataFrame({"나이": age, "소득": income, "도시": city}), y

@test("결측과 범주가 섞인 표를 학습하고 예측한다")
def _():
    X, y = customers()
    m = build_model(["나이", "소득"], ["도시"]).fit(X, y)
    p = m.predict_proba(X)[:, 1]
    assert p.shape == (300,) and not np.isnan(p).any()

@test("처음 보는 도시와 결측 소득에도 오류 없이 예측한다")
def _():
    X, y = customers()
    m = build_model(["나이", "소득"], ["도시"]).fit(X, y)
    p = m.predict_proba(pd.DataFrame({"나이": [40.0], "소득": [np.nan], "도시": ["광주"]}))
    assert p.shape == (1, 2)

@test("전처리 결과는 숫자 2열 + 도시 원-핫 3열")
def _():
    X, y = customers()
    m = build_model(["나이", "소득"], ["도시"]).fit(X, y)
    Z = m[:-1].transform(X)
    assert Z.shape == (300, 5), f"shape: {Z.shape}"

@test("tune이 C=0.1을 고르고 학습된 검색 객체를 돌려준다")
def _():
    X, y = customers()
    s = tune(build_model(["나이", "소득"], ["도시"]), X, y)
    assert s is not None and hasattr(s, "best_params_"), "fit한 GridSearchCV를 돌려주십시오."
    assert s.best_params_ == {"logisticregression__C": 0.1}, f"선택: {s.best_params_}"
    assert abs(s.best_score_ - 0.743) < 0.005, f"best_score_ = {s.best_score_:.4f}"

@test("같은 환자가 섞이면 KFold가 부풀려진다(1-NN)")
def _():
    rng = np.random.default_rng(1)
    centers = rng.normal(size=(80, 10))
    label = (centers[:, 0] + rng.normal(0, 1, 80) > 0).astype(int)
    X = np.repeat(centers, 5, axis=0) + rng.normal(0, 0.1, (400, 10))
    y, g = np.repeat(label, 5), np.repeat(np.arange(80), 5)
    kf, gk = group_gap(KNeighborsClassifier(1), X, y, g)
    assert kf > 0.95 and gk < 0.75, f"KFold {kf:.3f}, GroupKFold {gk:.3f}"
`,
      hints: [
        "`ColumnTransformer([(\"num\", make_pipeline(SimpleImputer(strategy=\"median\"), StandardScaler()), num_cols), (\"cat\", OneHotEncoder(handle_unknown=\"ignore\"), cat_cols)])`",
        "`GridSearchCV(model, {\"logisticregression__C\": [0.01, 0.1, 1, 10]}, cv=StratifiedKFold(5, shuffle=True, random_state=0), scoring=\"roc_auc\").fit(X, y)`",
        "`cross_val_score(model, X, y, cv=GroupKFold(5), groups=groups).mean()`처럼 groups를 키워드 인자로 넘깁니다.",
      ],
      solution: py`
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, StratifiedKFold, KFold, GroupKFold, cross_val_score

def build_model(num_cols, cat_cols):
    pre = ColumnTransformer([
        ("num", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
    ])
    return make_pipeline(pre, LogisticRegression(max_iter=1000))

def tune(model, X, y):
    grid = {"logisticregression__C": [0.01, 0.1, 1, 10]}
    cv = StratifiedKFold(5, shuffle=True, random_state=0)
    return GridSearchCV(model, grid, cv=cv, scoring="roc_auc").fit(X, y)

def group_gap(model, X, y, groups):
    kfold = cross_val_score(model, X, y, cv=KFold(5, shuffle=True, random_state=0)).mean()
    group = cross_val_score(model, X, y, cv=GroupKFold(5), groups=groups).mean()
    return kfold, group

df = pd.DataFrame({"나이": [25, 47, 33, 52, 41, 38], "소득": [210, np.nan, 260, 400, np.nan, 300],
                   "도시": ["서울", "부산", "서울", "대구", "부산", "서울"]})
model = build_model(["나이", "소득"], ["도시"])
print(model)
`,
    },
    {
      id: "w2-lab-cost",
      sectionId: "imbalance-threshold",
      title: "비용 기반 임계값과 신뢰도 표",
      tier: "supplement",
      prompt: `
「불균형 데이터와 임계값 결정」 단계의 계산을 함수로 만듭니다.

1. \`optimal_threshold(c_fp, c_fn)\` $= \\dfrac{C_{FP}}{C_{FP} + C_{FN}}$
2. \`expected_cost(y, p, t, c_fp, c_fn)\`: \`p >= t\`이면 양성으로 예측할 때의 **샘플당 평균 비용** $(C_{FP}\\cdot FP + C_{FN}\\cdot FN)/n$
3. \`brier(y, p)\` $= \\dfrac{1}{n}\\sum (p_i - y_i)^2$
4. \`reliability_table(y, p, edges)\`: 구간 $[e_k, e_{k+1})$마다 \`(개수, 평균 예측 확률, 실제 양성 비율)\` 튜플의 리스트. 마지막 구간만 오른쪽 끝(1.0)을 포함합니다. 비어 있는 구간은 \`(0, None, None)\`입니다.
`,
      starter: py`
import numpy as np

def optimal_threshold(c_fp, c_fn):
    return 0.5  # TODO

def expected_cost(y, p, t, c_fp, c_fn):
    y, p = np.asarray(y), np.asarray(p)
    return 0.0  # TODO: FP·FN 개수를 세어 비용을 샘플 수로 나눕니다.

def brier(y, p):
    return 0.0  # TODO

def reliability_table(y, p, edges):
    y, p = np.asarray(y), np.asarray(p, dtype=float)
    rows = []
    for k in range(len(edges) - 1):
        lo, hi = edges[k], edges[k + 1]
        # TODO: 구간에 든 샘플을 고르고(마지막 구간은 hi 포함) (개수, 평균 예측, 실제 양성 비율)을 추가합니다.
    return rows

y = [0, 0, 1, 1, 0]
p = [0.1, 0.4, 0.35, 0.8, 0.05]
print("t* =", optimal_threshold(1, 10))
print("비용(t=0.5) =", expected_cost(y, p, 0.5, 1, 10), " 비용(t=t*) =", expected_cost(y, p, optimal_threshold(1, 10), 1, 10))
print("Brier =", brier(y, p))
print(reliability_table(y, p, [0, 0.3, 1.0]))
`,
      tests: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

y = [0, 0, 1, 1, 0]
p = [0.1, 0.4, 0.35, 0.8, 0.05]

@test("t*(1, 10) = 1/11, t*(1, 1) = 0.5")
def _():
    assert approx(optimal_threshold(1, 10), 1 / 11) and approx(optimal_threshold(1, 1), 0.5)

@test("작은 예제의 평균 비용: t=0.5 → 2.0, t=1/11 → 0.4")
def _():
    assert approx(expected_cost(y, p, 0.5, 1, 10), 2.0), f"t=0.5: {expected_cost(y, p, 0.5, 1, 10)}"
    assert approx(expected_cost(y, p, 1 / 11, 1, 10), 0.4), f"t=1/11: {expected_cost(y, p, 1 / 11, 1, 10)}"

@test("Brier 점수 = 0.127")
def _():
    assert approx(brier(y, p), 0.127), f"결과: {brier(y, p)}"

@test("신뢰도 표: 구간 경계와 빈 구간 처리")
def _():
    rows = reliability_table(y, p, [0, 0.3, 0.5, 0.9, 1.0])
    assert rows[0][0] == 2 and approx(rows[0][1], 0.075) and approx(rows[0][2], 0.0), f"첫 구간: {rows[0]}"
    assert rows[1][0] == 2 and approx(rows[1][2], 0.5), f"둘째 구간: {rows[1]}"
    assert rows[3] == (0, None, None), f"빈 구간: {rows[3]}"
    assert reliability_table([1], [1.0], [0, 0.5, 1.0])[1][0] == 1, "마지막 구간은 1.0을 포함해야 합니다."

@test("보정된 모델에서 t*가 0.5보다 비용이 작고, 신뢰도 표가 대각선에 가깝다")
def _():
    rng = np.random.default_rng(0)
    X = rng.normal(size=(6000, 5))
    yy = (rng.random(6000) < 1 / (1 + np.exp(-(-3.6 + X @ np.array([1.2, -1.0, 0.8, 0, 0]))))).astype(int)
    pp = LogisticRegression().fit(X[:3000], yy[:3000]).predict_proba(X[3000:])[:, 1]
    yt = yy[3000:]
    assert expected_cost(yt, pp, optimal_threshold(1, 10), 1, 10) < expected_cost(yt, pp, 0.5, 1, 10)
    for count, mean_p, frac in reliability_table(yt, pp, [0, 0.05, 0.1, 0.2, 0.4, 1.0]):
        if count >= 100:
            assert abs(mean_p - frac) < 0.05, f"구간 평균 예측 {mean_p:.3f} vs 실제 {frac:.3f}"
`,
      hints: [
        "`pred = p >= t`, `fp = np.sum(pred & (y == 0))`, `fn = np.sum(~pred & (y == 1))`입니다.",
        "`brier`는 `np.mean((np.asarray(p) - np.asarray(y)) ** 2)`입니다.",
        "구간 마스크는 `(p >= lo) & (p < hi)`이고, 마지막 구간(`k == len(edges) - 2`)만 `p <= hi`로 바꿉니다. 개수가 0이면 `(0, None, None)`을 넣습니다.",
      ],
      solution: py`
import numpy as np

def optimal_threshold(c_fp, c_fn):
    return c_fp / (c_fp + c_fn)

def expected_cost(y, p, t, c_fp, c_fn):
    y, p = np.asarray(y), np.asarray(p)
    pred = p >= t
    fp = np.sum(pred & (y == 0))
    fn = np.sum(~pred & (y == 1))
    return (c_fp * fp + c_fn * fn) / len(y)

def brier(y, p):
    return float(np.mean((np.asarray(p, dtype=float) - np.asarray(y)) ** 2))

def reliability_table(y, p, edges):
    y, p = np.asarray(y), np.asarray(p, dtype=float)
    rows = []
    for k in range(len(edges) - 1):
        lo, hi = edges[k], edges[k + 1]
        last = k == len(edges) - 2
        mask = (p >= lo) & ((p <= hi) if last else (p < hi))
        n = int(mask.sum())
        rows.append((n, float(p[mask].mean()), float(y[mask].mean())) if n else (0, None, None))
    return rows

y = [0, 0, 1, 1, 0]
p = [0.1, 0.4, 0.35, 0.8, 0.05]
print("t* =", optimal_threshold(1, 10))
print("비용(t=0.5) =", expected_cost(y, p, 0.5, 1, 10), " 비용(t=t*) =", expected_cost(y, p, optimal_threshold(1, 10), 1, 10))
print("Brier =", brier(y, p))
print(reliability_table(y, p, [0, 0.3, 1.0]))
`,
    },
    {
      id: "w2-lab-ridge-map",
      sectionId: "loss-likelihood",
      title: "Ridge = MAP, 로지스틱 손실의 헤세 행렬",
      tier: "advanced",
      prompt: `
「손실함수의 확률적 기원」 단계의 결론을 코드로 검증합니다.

1. \`gaussian_nll(w, X, y, sigma2)\`: 잡음 분산 $\\sigma^2$을 가정한 **샘플당** 음의 로그가능도 $\\frac{1}{2}\\log(2\\pi\\sigma^2) + \\frac{1}{2\\sigma^2}\\cdot\\frac{1}{n}\\lVert y - Xw\\rVert^2$
2. \`ridge_closed_form(X, y, lam)\` $= (X^\\top X + \\lambda I)^{-1}X^\\top y$ (\`np.linalg.solve\` 사용, 절편 없음)
3. \`map_lambda(sigma2, tau2)\`: 가우시안 사전 $\\mathcal{N}(0, \\tau^2)$의 MAP와 같아지는 Ridge의 $\\lambda = \\sigma^2/\\tau^2$
4. \`logistic_hessian(X, w)\`: 평균 로지스틱 손실의 헤세 행렬 $\\frac{1}{n}X^\\top S X$, $S = \\operatorname{diag}(p_i(1-p_i))$
`,
      starter: py`
import numpy as np

def gaussian_nll(w, X, y, sigma2):
    return 0.0  # TODO

def ridge_closed_form(X, y, lam):
    return np.zeros(X.shape[1])  # TODO

def map_lambda(sigma2, tau2):
    return 0.0  # TODO

def logistic_hessian(X, w):
    X = np.asarray(X, dtype=float)
    p = 1 / (1 + np.exp(-(X @ w)))
    return np.zeros((X.shape[1], X.shape[1]))  # TODO: X.T @ diag(p(1-p)) @ X / n

rng = np.random.default_rng(1)
x1 = rng.normal(size=50)
X = np.column_stack([x1, x1 + rng.normal(0, 0.01, 50)])
y = 3 * x1 + rng.normal(0, 0.5, 50)
for lam in (0.1, 1.0, 10.0):
    print(lam, np.round(ridge_closed_form(X, y, lam), 3), "cond", round(float(np.linalg.cond(X.T @ X + lam * np.eye(2))), 1))
print("λ =", map_lambda(0.25, 0.05))
`,
      tests: py`
import numpy as np
from sklearn.linear_model import Ridge
rng = np.random.default_rng(1)
x1 = rng.normal(size=50)
X = np.column_stack([x1, x1 + rng.normal(0, 0.01, 50)])
y = 3 * x1 + rng.normal(0, 0.5, 50)

@test("닫힌 해가 sklearn Ridge(fit_intercept=False)와 같다")
def _():
    for lam in (0.1, 1.0, 10.0):
        got = ridge_closed_form(X, y, lam)
        ref = Ridge(alpha=lam, fit_intercept=False).fit(X, y).coef_
        assert approx(got, ref, 1e-6), f"λ={lam}: {got} vs {ref}"

@test("λ를 키우면 가중치 노름이 줄어든다")
def _():
    norms = [np.linalg.norm(ridge_closed_form(X, y, lam)) for lam in (0.1, 1.0, 10.0, 100.0)]
    assert all(a > b for a, b in zip(norms, norms[1:])), f"노름: {np.round(norms, 3)}"

@test("NLL의 최솟값은 최소제곱 해에 있다(기울기 ≈ 0, 주변보다 작다)")
def _():
    Xg = rng.normal(size=(40, 2))
    yg = Xg @ np.array([1.5, -2.0]) + rng.normal(0, 0.3, 40)
    w_ls = np.linalg.lstsq(Xg, yg, rcond=None)[0]
    base = gaussian_nll(w_ls, Xg, yg, 0.09)
    for d in (np.array([1e-3, 0]), np.array([0, -1e-3]), np.array([2e-3, 2e-3])):
        assert gaussian_nll(w_ls + d, Xg, yg, 0.09) > base
    assert approx(gaussian_nll(np.zeros(2), np.zeros((1, 2)), np.zeros(1), 1.0), 0.5 * np.log(2 * np.pi))

@test("map_lambda = σ²/τ²")
def _():
    assert approx(map_lambda(0.25, 0.05), 5.0) and approx(map_lambda(1.0, 4.0), 0.25)

@test("로지스틱 헤세 행렬: 수치미분과 일치하고 양의 준정부호")
def _():
    Xh = rng.normal(size=(30, 3))
    yh = rng.integers(0, 2, 30)
    w0 = rng.normal(size=3) * 0.5
    grad = lambda w: Xh.T @ (1 / (1 + np.exp(-(Xh @ w))) - yh) / len(yh)
    h = 1e-6
    num = np.column_stack([(grad(w0 + h * e) - grad(w0 - h * e)) / (2 * h) for e in np.eye(3)])
    H = logistic_hessian(Xh, w0)
    assert approx(H, num, 1e-5), "수치미분으로 구한 헤세 행렬과 다릅니다."
    assert np.linalg.eigvalsh(H).min() >= -1e-12
`,
      hints: [
        "`gaussian_nll`은 `0.5 * np.log(2 * np.pi * sigma2) + np.mean((y - X @ w) ** 2) / (2 * sigma2)`입니다.",
        "`np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)`",
        "`S = p * (1 - p)`를 벡터로 두면 `X.T @ (S[:, None] * X) / len(X)`가 $X^\\top S X / n$입니다.",
      ],
      solution: py`
import numpy as np

def gaussian_nll(w, X, y, sigma2):
    X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=float)
    return 0.5 * np.log(2 * np.pi * sigma2) + np.mean((y - X @ w) ** 2) / (2 * sigma2)

def ridge_closed_form(X, y, lam):
    return np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)

def map_lambda(sigma2, tau2):
    return sigma2 / tau2

def logistic_hessian(X, w):
    X = np.asarray(X, dtype=float)
    p = 1 / (1 + np.exp(-(X @ w)))
    S = p * (1 - p)
    return X.T @ (S[:, None] * X) / len(X)

rng = np.random.default_rng(1)
x1 = rng.normal(size=50)
X = np.column_stack([x1, x1 + rng.normal(0, 0.01, 50)])
y = 3 * x1 + rng.normal(0, 0.5, 50)
for lam in (0.1, 1.0, 10.0):
    print(lam, np.round(ridge_closed_form(X, y, lam), 3), "cond", round(float(np.linalg.cond(X.T @ X + lam * np.eye(2))), 1))
print("λ =", map_lambda(0.25, 0.05))
`,
    },
    {
      id: "w2-lab-double-descent",
      sectionId: "bias-variance-theory",
      title: "최소 노름 보간과 이중 하강",
      tier: "advanced",
      prompt: `
「편향-분산 분해의 유도와 이중 하강」 단계의 실험을 부품부터 만듭니다.

1. \`ensemble_variance(rho, B, sigma2=1.0)\` $= \\rho\\sigma^2 + \\dfrac{(1-\\rho)\\sigma^2}{B}$
2. \`min_norm_fit(X, y)\`: 유사역행렬로 구한 최소제곱 해 $X^{+}y$. $p > n$이면 훈련 데이터를 정확히 지나는 해 중 노름이 가장 작은 해입니다.
3. \`test_mse(p, seed)\`: 본문 설정(샘플 $n=40$, 특징 $d=100$, $\\beta \\sim \\mathcal{N}(0, 1/d)$, 잡음 표준편차 0.1, 테스트 500개)에서 **앞에서부터 $p$개 특징**만 쓴 \`min_norm_fit\`의 테스트 MSE(참값 $X_t\\beta$ 기준)를 돌려줍니다. 난수는 \`np.random.default_rng(seed)\` 하나에서 $\\beta$, $X$, $X_t$, 잡음 순서로 뽑습니다.
`,
      starter: py`
import numpy as np

def ensemble_variance(rho, B, sigma2=1.0):
    return 0.0  # TODO

def min_norm_fit(X, y):
    return np.zeros(np.asarray(X).shape[1])  # TODO: np.linalg.pinv

def test_mse(p, seed, n=40, d=100, sigma=0.1):
    rng = np.random.default_rng(seed)
    beta = rng.normal(0, 1, d) / np.sqrt(d)
    X, Xt = rng.normal(size=(n, d)), rng.normal(size=(500, d))
    y = X @ beta + rng.normal(0, sigma, n)
    # TODO: 앞의 p개 특징으로 min_norm_fit 한 뒤, Xt의 앞 p개 특징으로 예측해 Xt @ beta와의 MSE를 돌려줍니다.
    return 0.0

for p in (10, 30, 40, 50, 100):
    print(p, round(float(np.median([test_mse(p, s) for s in range(30)])), 3))
`,
      tests: py`
import numpy as np

@test("평균의 분산 공식")
def _():
    assert approx(ensemble_variance(0.0, 10), 0.1) and approx(ensemble_variance(0.5, 1000), 0.5005)
    assert approx(ensemble_variance(0.3, 10, sigma2=4.0), 4 * 0.37)

@test("p > n이면 훈련 데이터를 정확히 지나고, 다른 보간 해보다 노름이 작다")
def _():
    rng = np.random.default_rng(3)
    X, y = rng.normal(size=(5, 12)), rng.normal(size=5)
    w = min_norm_fit(X, y)
    assert approx(X @ w, y, 1e-8), "훈련 데이터를 정확히 지나지 않습니다."
    null = np.linalg.svd(X)[2][-1]                     # X @ null ≈ 0인 방향
    assert approx(X @ null, np.zeros(5), 1e-8)
    assert np.linalg.norm(w) < np.linalg.norm(w + 0.5 * null)

@test("p < n이면 일반 최소제곱 해와 같다")
def _():
    rng = np.random.default_rng(4)
    X, y = rng.normal(size=(30, 4)), rng.normal(size=30)
    assert approx(min_norm_fit(X, y), np.linalg.lstsq(X, y, rcond=None)[0], 1e-8)

@test("보간 문턱 p = n에서 테스트 오차가 치솟는다")
def _():
    med = lambda p: np.median([test_mse(p, s) for s in range(30)])
    m20, m40, m60 = med(20), med(40), med(60)
    assert m40 > 5 * m20 and m40 > 5 * m60, f"p=20 {m20:.3f}, p=40 {m40:.3f}, p=60 {m60:.3f}"

@test("가장 과대 파라미터화된 p = 100이 p = 10보다 낫다")
def _():
    med = lambda p: np.median([test_mse(p, s) for s in range(30)])
    m10, m100 = med(10), med(100)
    assert m100 < m10 and m100 < 1.0, f"p=10 {m10:.3f}, p=100 {m100:.3f}"
`,
      hints: [
        "`ensemble_variance`는 `rho * sigma2 + (1 - rho) * sigma2 / B`입니다.",
        "`np.linalg.pinv(X) @ y`가 최소 노름 최소제곱 해입니다. $p < n$이면 일반 최소제곱 해와 같습니다.",
        "`coef = min_norm_fit(X[:, :p], y)` 다음 `np.mean((Xt[:, :p] @ coef - Xt @ beta) ** 2)`입니다.",
      ],
      solution: py`
import numpy as np

def ensemble_variance(rho, B, sigma2=1.0):
    return rho * sigma2 + (1 - rho) * sigma2 / B

def min_norm_fit(X, y):
    return np.linalg.pinv(np.asarray(X, dtype=float)) @ np.asarray(y, dtype=float)

def test_mse(p, seed, n=40, d=100, sigma=0.1):
    rng = np.random.default_rng(seed)
    beta = rng.normal(0, 1, d) / np.sqrt(d)
    X, Xt = rng.normal(size=(n, d)), rng.normal(size=(500, d))
    y = X @ beta + rng.normal(0, sigma, n)
    coef = min_norm_fit(X[:, :p], y)
    return float(np.mean((Xt[:, :p] @ coef - Xt @ beta) ** 2))

for p in (10, 30, 40, 50, 100):
    print(p, round(float(np.median([test_mse(p, s) for s in range(30)])), 3))
`,
    },
    {
      id: "w2-lab-corrected-t",
      sectionId: "model-evaluation-stats",
      title: "짝지은 비교: 단순 t, 보정 t, McNemar",
      tier: "advanced",
      prompt: `
「평가의 통계학」 단계의 검정 통계량을 직접 구현합니다. 차이 \`d\`는 같은 분할에서 얻은 두 모델의 점수 차이 $J$개입니다.

1. \`naive_t(d)\` $= \\dfrac{\\bar d}{\\sqrt{s^2 / J}}$ ($s^2$은 \`ddof=1\` 표본분산)
2. \`corrected_t(d, n_train, n_test)\` $= \\dfrac{\\bar d}{\\sqrt{(1/J + n_{test}/n_{train})\\, s^2}}$ (나도-벤지오 보정)
3. \`two_sided_p(t, df)\`: 자유도 \`df\`인 t 분포의 양측 p값 (\`scipy.stats.t.sf\` 사용)
4. \`mcnemar(b, c)\` $= \\dfrac{(|b - c| - 1)^2}{b + c}$ ($b$: A만 맞힌 수, $c$: B만 맞힌 수)
`,
      starter: py`
import numpy as np
from scipy import stats

def naive_t(d):
    return 0.0  # TODO

def corrected_t(d, n_train, n_test):
    return 0.0  # TODO

def two_sided_p(t, df):
    return 1.0  # TODO: 2 * stats.t.sf(|t|, df)

def mcnemar(b, c):
    return 0.0  # TODO

d = np.array([0.02, 0.01, 0.03, -0.01, 0.02, 0.015, 0.0, 0.025, 0.01, 0.02])
t1, t2 = naive_t(d), corrected_t(d, n_train=455, n_test=114)
print(f"단순 t = {t1:.2f} (p = {two_sided_p(t1, len(d) - 1):.4f})")
print(f"보정 t = {t2:.2f} (p = {two_sided_p(t2, len(d) - 1):.4f})")
print("McNemar χ² =", mcnemar(15, 5))
`,
      tests: py`
import numpy as np
d = np.array([0.02, 0.01, 0.03, -0.01, 0.02, 0.015, 0.0, 0.025, 0.01, 0.02])

@test("단순 t = 평균 / √(s²/J)")
def _():
    assert approx(naive_t(d), d.mean() / np.sqrt(d.var(ddof=1) / len(d))), f"결과: {naive_t(d)}"

@test("보정 t는 단순 t보다 작다 (5-fold: n_test/n_train = 0.25)")
def _():
    t2 = corrected_t(d, 455, 114)
    ref = d.mean() / np.sqrt((1 / 10 + 114 / 455) * d.var(ddof=1))
    assert approx(t2, ref) and t2 < naive_t(d), f"보정 t = {t2}"

@test("반복을 두 배로 늘리면 단순 t는 √2배 커지지만 보정 t는 거의 그대로")
def _():
    dd = np.concatenate([d, d])
    ratio_naive = naive_t(dd) / naive_t(d)
    ratio_corr = corrected_t(dd, 455, 114) / corrected_t(d, 455, 114)
    assert ratio_naive > 1.4 and ratio_corr < 1.2, f"단순 {ratio_naive:.3f}배, 보정 {ratio_corr:.3f}배"

@test("양측 p값: t=2.262, df=9 → 약 0.05")
def _():
    assert abs(two_sided_p(2.262, 9) - 0.05) < 1e-3 and approx(two_sided_p(0.0, 5), 1.0)
    assert approx(two_sided_p(-2.262, 9), two_sided_p(2.262, 9))

@test("McNemar: b=15, c=5 → 4.05, 같으면 작다")
def _():
    assert approx(mcnemar(15, 5), 4.05) and mcnemar(10, 10) < 0.1
`,
      hints: [
        "`naive_t`는 `d.mean() / np.sqrt(d.var(ddof=1) / len(d))`입니다.",
        "보정식은 분산 앞의 계수만 `1 / J`에서 `1 / J + n_test / n_train`으로 바뀝니다.",
        "`2 * stats.t.sf(abs(t), df)`가 양측 p값입니다. McNemar는 `(abs(b - c) - 1) ** 2 / (b + c)`입니다.",
      ],
      solution: py`
import numpy as np
from scipy import stats

def naive_t(d):
    d = np.asarray(d, dtype=float)
    return d.mean() / np.sqrt(d.var(ddof=1) / len(d))

def corrected_t(d, n_train, n_test):
    d = np.asarray(d, dtype=float)
    return d.mean() / np.sqrt((1 / len(d) + n_test / n_train) * d.var(ddof=1))

def two_sided_p(t, df):
    return float(2 * stats.t.sf(abs(t), df))

def mcnemar(b, c):
    return (abs(b - c) - 1) ** 2 / (b + c)

d = np.array([0.02, 0.01, 0.03, -0.01, 0.02, 0.015, 0.0, 0.025, 0.01, 0.02])
t1, t2 = naive_t(d), corrected_t(d, n_train=455, n_test=114)
print(f"단순 t = {t1:.2f} (p = {two_sided_p(t1, len(d) - 1):.4f})")
print(f"보정 t = {t2:.2f} (p = {two_sided_p(t2, len(d) - 1):.4f})")
print("McNemar χ² =", mcnemar(15, 5))
`,
    },
  ],

  quiz: [
    {
      kind: "choice",
      id: "w2-drill-logistic-sign",
      tier: "core",
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
      id: "w2-drill-ridge",
      tier: "core",
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
      tier: "core",
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
      tier: "core",
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
      tier: "core",
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
      tier: "core",
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
      tier: "core",
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
      tier: "core",
      sectionId: "validation-leakage",
      question:
        "샘플 100개, 의미 없는 특징 5,000개, 동전 던지기로 만든 레이블로 실험했더니, 전체 데이터에서 레이블과 상관이 높은 특징 20개를 먼저 고른 뒤 교차검증한 정확도가 약 0.85로 나왔습니다. 진짜 성능은 0.5인데 이런 숫자가 나오는 과정을 단계별로 설명하고, 파이프라인이 이를 어떻게 막는지 적으십시오.",
      modelAnswer:
        "의미 없는 특징이 5,000개나 되면 순전히 우연으로 레이블과 상관이 높아 보이는 특징이 생깁니다. 잘못된 방법은 전체 100개 샘플(검증 fold 포함)의 레이블을 보고 그런 특징 20개를 먼저 골랐기 때문에, 고른 특징이 검증 fold의 레이블과도 우연히 맞도록 이미 맞춰져 있습니다. 그래서 교차검증이 '처음 보는 데이터'를 평가하지 못하고 0.85 같은 가짜 점수가 나옵니다. 특징 선택을 파이프라인에 넣으면 fold마다 훈련 부분의 레이블만 보고 특징을 고르므로, 검증 fold에서는 우연한 상관이 재현되지 않아 정확도가 0.5 근처로 돌아옵니다.",
      keyPoints: ["특징이 많으면 우연히 레이블과 상관 있는 특징이 생긴다", "전체 데이터(검증 fold 포함)의 레이블로 특징을 골랐다", "검증 fold가 더 이상 처음 보는 데이터가 아니다", "파이프라인은 fold마다 훈련 부분으로만 선택한다"],
    },
    {
      kind: "descriptive",
      id: "w2-drill-ridge-u",
      tier: "core",
      sectionId: "bias-variance",
      question: "Ridge의 `alpha`를 바꾼 실험에서 검증 오차가 U자 모양을 그린 이유를 편향과 분산으로 설명하고, '다항식 차수를 낮추는 것'과 '규제를 강하게 하는 것'의 같은 점과 다른 점을 한 가지씩 적으십시오.",
      modelAnswer:
        "alpha가 아주 작으면 12차 다항식이 훈련 데이터의 잡음까지 따라가 분산이 커지고 검증 오차가 큽니다. alpha를 키우면 가중치가 작아져 함수가 매끄러워지고 분산이 줄어 검증 오차가 내려가지만, 너무 크면 사인 곡선조차 표현하지 못해 편향이 커지고 다시 오차가 올라갑니다. 두 방법 모두 모델이 표현할 수 있는 함수의 복잡도를 줄여 분산을 낮춘다는 점은 같습니다. 다른 점은, 차수를 낮추면 고차 항 자체를 없애 표현 가능한 함수족을 바꾸지만, 규제는 12차 항을 그대로 두고 계수의 크기에 벌점을 줘 연속적으로 복잡도를 조절한다는 것입니다.",
      keyPoints: ["alpha가 작으면 분산이 크다(잡음까지 맞춤)", "alpha가 크면 편향이 크다(과소적합)", "둘 다 복잡도를 줄여 분산을 낮춘다", "차수 감소는 항을 없애고, 규제는 계수 크기를 연속적으로 줄인다"],
    },
    {
      kind: "descriptive",
      id: "w2-drill-threshold-cancer",
      tier: "core",
      sectionId: "classification-metrics",
      question:
        "유방암 데이터로 **악성 종양 검진**을 한다면 임계값을 어느 방향으로 움직여야 합니까? 이 데이터에서 클래스 0이 악성이라는 점과, 코드의 `score = clf.predict_proba(Xte)[:, 1]`이 무엇의 확률인지에 주의해 설명하십시오.",
      modelAnswer:
        "`predict_proba(...)[:, 1]`은 클래스 1, 즉 **양성 종양**일 확률입니다. 악성을 놓치는 것(악성인데 양성 종양으로 판정)이 치명적이므로, 양성 종양이라고 판정하는 기준을 까다롭게 해야 합니다. 즉 `score >= t`일 때만 양성 종양으로 보고 나머지는 악성 의심으로 보낸다면 임계값 t를 **올려야** 합니다. 그러면 악성에 대한 Recall이 올라가는 대신, 실제로는 양성 종양인 사람을 정밀 검사로 더 많이 보내게 됩니다(오진 비용 증가). 반대로 악성 확률(1 − score)을 기준으로 삼는다면 그 임계값은 낮추는 것이 같은 결정입니다.",
      keyPoints: ["[:, 1]은 클래스 1(양성 종양)의 확률이다", "악성을 놓치지 않는 것(악성 Recall)이 우선이다", "양성 종양 판정 임계값을 올린다", "대신 불필요한 정밀 검사(오진)가 늘어난다"],
    },
    {
      kind: "choice",
      id: "w2-drill-knn-scale",
      tier: "supplement",
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
      id: "w2-drill-pipe-name",
      tier: "supplement",
      sectionId: "pipeline-tuning",
      question: "`make_pipeline(SimpleImputer(), RandomForestClassifier())`의 트리 깊이를 `GridSearchCV`로 탐색하려면 파라미터 그리드의 키를 무엇으로 써야 하는가?",
      choices: ["`randomforestclassifier__max_depth`", "`max_depth`", "`RandomForestClassifier__max_depth`", "`pipeline.max_depth`"],
      answer: 0,
      explanation:
        "`make_pipeline`은 각 단계에 클래스 이름을 소문자로 바꾼 이름을 붙이고, 안쪽 단계의 파라미터는 `단계이름__파라미터`(밑줄 두 개)로 가리킵니다. 단계 이름은 `list(model.named_steps)`로 확인할 수 있습니다.",
    },
    {
      kind: "predict",
      id: "w2-drill-tscv",
      tier: "supplement",
      sectionId: "pipeline-tuning",
      code: py`
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
for tr, te in TimeSeriesSplit(n_splits=2).split(np.arange(6)):
    print(tr.tolist(), te.tolist())
`,
      expected: "[0, 1] [2, 3]\n[0, 1, 2, 3] [4, 5]",
      explanation:
        "TimeSeriesSplit은 항상 과거로 학습하고 바로 뒤의 미래로 검증합니다. 6개를 2번 나누면 검증 구간 크기는 6 // 3 = 2이고, 훈련 구간은 앞에서부터 점점 늘어납니다. 검증 구간이 훈련 구간보다 앞에 오는 일은 없습니다.",
    },
    {
      kind: "choice",
      id: "w2-drill-tstar",
      tier: "supplement",
      sectionId: "imbalance-threshold",
      question: "사기 거래를 놓치는 비용이 정상 거래를 막는 비용의 9배다. 모델 확률이 잘 보정되어 있다면 '사기' 판정 임계값은?",
      choices: ["0.1", "0.5", "0.9", "0.11"],
      answer: 0,
      explanation:
        "$t^* = C_{FP}/(C_{FP}+C_{FN}) = 1/(1+9) = 0.1$입니다. 확률이 10%만 넘어도 막는 쪽의 기대 비용 $(1-p)\\cdot 1$이 통과시키는 쪽의 기대 비용 $p \\cdot 9$보다 작아집니다.",
    },
    {
      kind: "descriptive",
      id: "w2-drill-precision-prev",
      tier: "supplement",
      sectionId: "imbalance-threshold",
      question:
        "Recall 0.9, FPR 0.05인 같은 분류기를 양성 비율 1%인 병원과 20%인 병원에 배포했다. 1만 명 기준으로 각 병원의 Precision을 계산하고, ROC-AUC는 같은데 Precision이 크게 다른 이유를 설명하십시오.",
      modelAnswer:
        "양성 1%: 환자 100명 중 90명이 양성 판정(TP), 건강한 9,900명 중 5%인 495명이 양성 판정(FP)이라 Precision = 90/585, 약 0.154입니다. 양성 20%: 환자 2,000명 중 1,800명(TP), 건강한 8,000명 중 400명(FP)이라 Precision = 1,800/2,200, 약 0.818입니다. ROC 곡선은 TPR(=Recall)과 FPR만 쓰므로 두 병원에서 같지만, Precision은 TP와 FP의 **사람 수** 비율이라 양성 비율(기저율)에 직접 좌우됩니다. 1주차 베이즈 실습과 같은 계산이며, 양성이 드문 곳에서는 PR 곡선·Average Precision으로 실제 오경보 부담을 따로 확인해야 합니다.",
      keyPoints: ["1%: TP 90, FP 495, Precision 약 0.15", "20%: TP 1,800, FP 400, Precision 약 0.82", "ROC는 TPR·FPR만 써서 기저율에 둔감하다", "Precision은 기저율에 좌우되므로 PR 곡선을 함께 본다"],
    },
    {
      kind: "predict",
      id: "w2-drill-minnorm",
      tier: "advanced",
      sectionId: "bias-variance-theory",
      code: py`
import numpy as np
X = np.array([[1.0, 1.0]])
y = np.array([2.0])
w = np.linalg.pinv(X) @ y
print(w, X @ w)
`,
      expected: "[1. 1.] [2.]",
      explanation:
        "식 하나 $w_1 + w_2 = 2$를 만족하는 해는 무수히 많지만(예: $[2, 0]$, $[3, -1]$), 유사역행렬은 그중 노름이 가장 작은 $[1, 1]$(노름 $\\sqrt{2}$)을 고릅니다. 훈련 데이터는 정확히 지나므로 예측은 2입니다. 이 '가장 작은 노름' 선택이 이중 하강의 두 번째 하강을 만드는 암묵적 규제입니다.",
    },
    {
      kind: "choice",
      id: "w2-drill-ridge-eig",
      tier: "advanced",
      sectionId: "loss-likelihood",
      question: "$X^\\top X$의 고유값이 $100$과 $0.01$이다. Ridge의 닫힌 해에서 $X^\\top X + \\lambda I$($\\lambda = 1$)의 조건수는?",
      choices: ["100", "10000", "1", "0.01"],
      answer: 0,
      explanation:
        "$\\lambda I$를 더하면 모든 고유값이 $\\lambda$만큼 커져 $101$과 $1.01$이 되므로 조건수는 $101/1.01 = 100$입니다. 원래 조건수 $10^4$이 100분의 1로 줄어 역행렬 계산과 계수가 안정해집니다. 가우시안 사전분포가 다중공선성을 다스리는 수치적 의미입니다.",
    },
    {
      kind: "descriptive",
      id: "w2-drill-winner",
      tier: "advanced",
      sectionId: "model-evaluation-stats",
      question:
        "어느 팀이 샘플 300개로 하이퍼파라미터 조합 50개를 5-Fold 교차검증으로 비교한 뒤 \"최고 조합의 정확도 0.91이 베이스라인 모델(0.89)보다 높다\"고 보고했습니다. 이 주장의 문제를 두 가지 이상 지적하고, 같은 데이터로 더 정직한 결론을 얻는 절차를 제시하십시오.",
      modelAnswer:
        "첫째, 0.91은 조합 50개의 잡음 섞인 점수 중 최댓값이라 선택 편향으로 부풀려져 있습니다(승자의 저주). 후보가 많고 샘플이 300개로 적어 부풀림이 0.02보다 클 수 있습니다. 둘째, 베이스라인은 튜닝하지 않았거나 다른 분할로 평가했을 수 있어 비교가 공정하지 않습니다. 셋째, 0.02 차이가 fold 흩어짐에 비해 의미 있는지 확인하지 않았고, fold 표준편차는 신뢰구간이 아닙니다. 절차: 튜닝을 포함한 전체 과정을 중첩 교차검증으로 평가하거나, 처음에 테스트셋을 떼어 두고 튜닝 후 한 번만 평가합니다. 두 방법을 같은 반복 분할(예: 5-fold를 10회 반복)로 평가해 짝지은 차이를 구하고, 나도-벤지오 보정 t 검정으로 우연 가능성을 확인하며, 차이의 크기가 실무적으로 의미 있는지도 함께 판단합니다.",
      keyPoints: ["최고 점수는 선택 편향으로 낙관적이다", "베이스라인과 같은 분할·같은 절차로 비교해야 한다", "중첩 교차검증 또는 분리된 테스트셋", "짝지은 차이 + 보정된 t 검정, 효과 크기 판단"],
    },
  ],

  assignment: {
    requirements: [
      "로지스틱 회귀를 `StandardScaler`와 함께 `make_pipeline`으로 묶어 TODO를 채운다. 스케일링을 파이프라인 밖에서 하지 않는다.",
      "세 모델(다수결·로지스틱·랜덤 포레스트)을 **같은** `StratifiedKFold` 분할로 평가해 F1·ROC-AUC의 평균 ± 표준편차와 fold별 짝지은 차이를 보고한다.",
      "클래스 비율과 혼동행렬·Precision·Recall을 근거로 이 문제에서 가장 중요한 지표를 고른다.",
      "누수 (a) 분할 전 스케일링, (b) 타깃 파생 특징을 실제로 만들어 교차검증 점수가 부풀려지는 크기를 비교·설명한다.",
      "결정트리 깊이(1·3·5·제한 없음)별 테스트 정확도의 평균·표준편차를 편향과 분산으로 해석한다.",
      "(보충) 비용 비율 10:1로 정한 임계값 $t^* = 1/11$과 0.5의 FN·FP·평균 비용을 비교한다.",
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
      {
        id: "w2-at-threshold",
        taskId: "threshold",
        title: "비용 기반 임계값 t* = 1/11이 0.5보다 평균 비용이 작다",
        code: py`
assert abs(t_star - 1 / 11) < 1e-9, f"t_star = {t_star}"
assert costs[t_star] <= costs[0.5], f"비용: t*={costs[t_star]:.4f}, 0.5={costs[0.5]:.4f}"
`,
        hint: "$t^* = C_{FP}/(C_{FP}+C_{FN})$입니다.",
      },
    ],
    challenges: [
      {
        id: "w2-ch-logreg-l2",
        title: "L2 규제 로지스틱 회귀를 NumPy로 구현해 sklearn과 맞추기",
        tier: "advanced",
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
        tier: "advanced",
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
