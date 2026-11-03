import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "K-Fold 분할과 fold마다 학습 부분으로 표준화하기",
    prompt: md`

교차검증의 기본 구조를 직접 만듭니다.

1. \`kfold_indices(n, k)\`: 섞지 않고 앞에서부터 연속된 fold \`k\`개로 나눈 \`(train_idx, val_idx)\` 리스트를 돌려줍니다. fold 크기 차이는 최대 1이고, 앞쪽 fold가 하나씩 더 큽니다(\`np.array_split\`과 같은 규칙).
2. \`cv_scores(X, y, k, fit_predict)\`: fold마다 **학습 부분의 열별 평균·표준편차로** 학습 부분과 검증 부분을 표준화한 뒤 \`fit_predict(X_train, y_train, X_val)\`로 검증 부분의 예측을 받아, fold별 정확도 리스트를 돌려줍니다.
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

def cv_scores(X, y, k, fit_predict):
    X, y = np.asarray(X, dtype=float), np.asarray(y)
    scores = []
    for train, val in kfold_indices(len(y), k):
        pass  # TODO: 학습 부분 통계로 표준화 → fit_predict → 정확도 추가
    return scores

def nearest_mean(X_train, y_train, X_val):
    """클래스별 평균에 가장 가까운 클래스를 예측하는 간단한 분류기"""
    classes = np.unique(y_train)
    means = np.array([X_train[y_train == c].mean(axis=0) for c in classes])
    d = ((X_val[:, None, :] - means[None, :, :]) ** 2).sum(axis=2)
    return classes[d.argmin(axis=1)]

for train, val in kfold_indices(10, 3):
    print("학습", train, "/ 검증", val)
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

@test("각 분할에서 학습과 검증이 겹치지 않고 합치면 전체")
def _():
    for train, val in kfold_indices(12, 4):
        t, v = set(np.asarray(train).tolist()), set(np.asarray(val).tolist())
        assert not (t & v) and len(t | v) == 12

@test("cv_scores: fold 수만큼 정확도를 돌려준다")
def _():
    rng = np.random.default_rng(0)
    y = np.repeat([0, 1], 50)
    X = rng.normal(size=(100, 2)) + y[:, None] * 3
    perm = rng.permutation(100)
    s = cv_scores(X[perm], y[perm], 5, nearest_mean)
    assert len(s) == 5 and min(s) >= 0.85 and np.mean(s) > 0.9, f"점수: {s}"

@test("cv_scores: 검증 부분은 학습 부분의 통계로 표준화된다")
def _():
    seen = []
    def spy(X_train, y_train, X_val):
        seen.append((X_train.mean(axis=0), X_train.std(axis=0), X_val.copy()))
        return np.zeros(len(X_val), dtype=int)
    X = np.array([[1.0], [2.0], [3.0], [4.0], [100.0], [6.0]])
    cv_scores(X, np.zeros(6, dtype=int), 3, spy)
    m, sd, v = seen[0]
    assert approx(m, [0.0]) and approx(sd, [1.0]), "학습 부분이 표준화되지 않았습니다."
    rest = np.array([3.0, 4.0, 100.0, 6.0])
    assert approx(v.ravel(), (np.array([1.0, 2.0]) - rest.mean()) / rest.std()), "검증 부분을 학습 부분의 통계로 변환하십시오."
`,
    hints: [
      "`folds = np.array_split(idx, k)`는 앞쪽 fold부터 하나씩 더 크게 나눕니다. 학습 인덱스는 `np.concatenate([f for j, f in enumerate(folds) if j != i])`입니다.",
      "fold마다 `mu, sd = X[train].mean(axis=0), X[train].std(axis=0)`를 구하고 `(X[train] - mu) / sd`, `(X[val] - mu) / sd`로 변환합니다.",
      "`pred = fit_predict(Xtr, y[train], Xva)` 다음 `scores.append(float(np.mean(pred == y[val])))`입니다.",
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

def cv_scores(X, y, k, fit_predict):
    X, y = np.asarray(X, dtype=float), np.asarray(y)
    scores = []
    for train, val in kfold_indices(len(y), k):
        mu, sd = X[train].mean(axis=0), X[train].std(axis=0)
        Xtr, Xva = (X[train] - mu) / sd, (X[val] - mu) / sd
        pred = fit_predict(Xtr, y[train], Xva)
        scores.append(float(np.mean(pred == y[val])))
    return scores

def nearest_mean(X_train, y_train, X_val):
    """클래스별 평균에 가장 가까운 클래스를 예측하는 간단한 분류기"""
    classes = np.unique(y_train)
    means = np.array([X_train[y_train == c].mean(axis=0) for c in classes])
    d = ((X_val[:, None, :] - means[None, :, :]) ** 2).sum(axis=2)
    return classes[d.argmin(axis=1)]

for train, val in kfold_indices(10, 3):
    print("학습", train, "/ 검증", val)
`,
  },
  {
    key: "ex2",
    title: "그룹 누수 측정과 하이퍼파라미터 탐색",
    prompt: md`

scikit-learn으로 교차검증 도구를 씁니다.

1. \`group_gap(model, X, y, groups)\`: \`KFold(5, shuffle=True, random_state=0)\`와 \`GroupKFold(5)\`로 잰 평균 정확도를 \`(kfold, group)\`으로 돌려줍니다.
2. \`tune(X, y)\`: \`make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))\`의 \`C\`를 후보 \`[0.01, 0.1, 1, 10, 100]\`에서 \`StratifiedKFold(5, shuffle=True, random_state=0)\`로 탐색하고, **학습을 마친** \`GridSearchCV\`를 돌려줍니다.
`,
    starter: py`
import numpy as np
from sklearn.model_selection import KFold, GroupKFold, StratifiedKFold, GridSearchCV, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def group_gap(model, X, y, groups):
    kfold = 0.0  # TODO: KFold(5, shuffle=True, random_state=0) 교차검증 정확도 평균
    group = 0.0  # TODO: GroupKFold(5) 교차검증 정확도 평균 (groups를 넘깁니다)
    return kfold, group

def tune(X, y):
    # TODO: 파이프라인을 만들고 logisticregression__C를 GridSearchCV로 탐색해 fit까지 한 객체를 돌려줍니다.
    return None
`,
    tests: py`
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

@test("같은 환자가 섞이면 KFold 점수가 실제보다 높다(1-NN)")
def _():
    rng = np.random.default_rng(1)
    centers = rng.normal(size=(80, 10))
    label = (centers[:, 0] + rng.normal(0, 1, 80) > 0).astype(int)
    X = np.repeat(centers, 5, axis=0) + rng.normal(0, 0.1, (400, 10))
    y, g = np.repeat(label, 5), np.repeat(np.arange(80), 5)
    kf, gk = group_gap(KNeighborsClassifier(1), X, y, g)
    assert kf > 0.95 and gk < 0.75, f"KFold {kf:.3f}, GroupKFold {gk:.3f}"

@test("tune: C = 1을 고르고 학습된 탐색 객체를 돌려준다")
def _():
    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
    s = tune(X_tr, y_tr)
    assert s is not None and hasattr(s, "best_params_"), "fit한 GridSearchCV를 돌려주십시오."
    assert s.best_params_ == {"logisticregression__C": 1}, f"선택: {s.best_params_}"
    assert abs(s.best_score_ - 0.978) < 0.002, f"best_score_ = {s.best_score_:.4f}"
    assert abs(s.score(X_te, y_te) - 0.982) < 0.002
`,
    hints: [
      "`cross_val_score(model, X, y, cv=KFold(5, shuffle=True, random_state=0)).mean()`입니다.",
      "GroupKFold는 `cross_val_score(model, X, y, cv=GroupKFold(5), groups=groups)`처럼 groups를 키워드 인자로 넘깁니다.",
      "`GridSearchCV(model, {\"logisticregression__C\": [0.01, 0.1, 1, 10, 100]}, cv=StratifiedKFold(5, shuffle=True, random_state=0)).fit(X, y)`입니다.",
    ],
    solution: py`
import numpy as np
from sklearn.model_selection import KFold, GroupKFold, StratifiedKFold, GridSearchCV, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def group_gap(model, X, y, groups):
    kfold = cross_val_score(model, X, y, cv=KFold(5, shuffle=True, random_state=0)).mean()
    group = cross_val_score(model, X, y, cv=GroupKFold(5), groups=groups).mean()
    return kfold, group

def tune(X, y):
    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    grid = {"logisticregression__C": [0.01, 0.1, 1, 10, 100]}
    cv = StratifiedKFold(5, shuffle=True, random_state=0)
    return GridSearchCV(model, grid, cv=cv).fit(X, y)
`,
  },
]);
