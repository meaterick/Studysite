import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "혼합형 데이터 파이프라인과 그룹 누수 측정",
    prompt: md`

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
    hints: ["`ColumnTransformer([(\"num\", make_pipeline(SimpleImputer(strategy=\"median\"), StandardScaler()), num_cols), (\"cat\", OneHotEncoder(handle_unknown=\"ignore\"), cat_cols)])`", "`GridSearchCV(model, {\"logisticregression__C\": [0.01, 0.1, 1, 10]}, cv=StratifiedKFold(5, shuffle=True, random_state=0), scoring=\"roc_auc\").fit(X, y)`", "`cross_val_score(model, X, y, cv=GroupKFold(5), groups=groups).mean()`처럼 groups를 키워드 인자로 넘깁니다."],
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
]);
