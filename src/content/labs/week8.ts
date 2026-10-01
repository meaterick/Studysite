import type { WeekLab } from "../types";
import { py } from "./util";

// 8주차: FGSM, 서브그룹 재가중, 공정성 지표, 보정 점수와 임계값 정책, 모델카드·위험 등급, PSI·카나리, 토큰 비용·속도 제한·가드레일, 순열 검정·z-검정, 재현 가능한 실험 뼈대
const DIGITS = py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.linear_model import LogisticRegression

digits = load_digits()
mask = np.isin(digits.target, [3, 8])
X, y = digits.data[mask] / 16.0, (digits.target[mask] == 8).astype(int)   # 픽셀 0~1, 숫자 8이면 1
clf = LogisticRegression(max_iter=2000).fit(X, y)
w = clf.coef_[0]
`;

const SUBGROUPS = py`
import numpy as np
from sklearn.linear_model import LogisticRegression

rng = np.random.default_rng(0)
def make_group(n, shift):
    Xg = rng.normal(size=(n, 2))
    yg = (Xg[:, 0] + shift * Xg[:, 1] > 0).astype(int)
    return Xg, yg
Xa, ya = make_group(1800, 0.0)     # 다수 집단 A (90%)
Xb, yb = make_group(200, 1.5)      # 소수 집단 B (10%): 특징과 정답의 관계가 조금 다르다
X, y = np.vstack([Xa, Xb]), np.concatenate([ya, yb])
g = np.array(["A"] * 1800 + ["B"] * 200)
`;

const HIRING = py`
# 본문 숫자 예제: A 집단 TP=40, FP=10 / B 집단 TP=16, FP=16 (균등화된 오즈는 맞고 선택률은 다르다)
yA_true = [1] * 50 + [0] * 50
yA_pred = [1] * 40 + [0] * 10 + [1] * 10 + [0] * 40
yB_true = [1] * 20 + [0] * 80
yB_pred = [1] * 16 + [0] * 4 + [1] * 16 + [0] * 64
yB_pred_dp = [1] * 18 + [0] * 2 + [1] * 32 + [0] * 48    # 선택률을 50%로 맞춘 뒤: TP=18, FP=32
`;

const CALIBRATED = py`
import numpy as np
rng = np.random.default_rng(0)

# 보정된 점수 모델: 점수 s를 받은 사람은 정확히 확률 s로 실제 우수(Y=1)
def make_group(n, a, b):
    s = rng.beta(a, b, n)
    y = (rng.random(n) < s).astype(int)
    return s, y
sA, yA = make_group(20000, 5, 5)    # 기저율 약 50%
sB, yB = make_group(20000, 2, 8)    # 기저율 약 20%
`;

const MODEL_CARD = py`
REQUIRED = ["model_name", "intended_use", "out_of_scope_use", "training_data",
            "performance_by_group", "limitations", "ethical_considerations"]
draft = {
    "model_name": "동아리 QA 봇 v0.3",
    "intended_use": "동아리 규정·일정에 대한 질문에 근거와 함께 답한다",
    "out_of_scope_use": [],                       # 비어 있음!
    "training_data": {"source": "동아리 공지 42건(2024~2025)", "pii_removed": True},
    "performance_by_group": {"전체": {"accuracy": 0.86}},
    "limitations": ["공지에 없는 질문에 추측으로 답할 수 있음"],
}
TIERS = {
    "금지": ["사회적 점수", "취약성 악용 조작"],
    "고위험": ["채용", "신용평가", "입학·시험 평가", "의료기기"],
    "제한적 위험(투명성 의무)": ["챗봇", "딥페이크"],
}
`;

const PSI_DATA = py`
import numpy as np
rng = np.random.default_rng(0)
train = rng.normal(35, 8, 10000)                 # 학습 당시 사용자 나이 분포
prods = {
    "같은 분포": rng.normal(35, 8, 3000),
    "평균 +2세": rng.normal(37, 8, 3000),
    "평균 +3세": rng.normal(38, 8, 3000),
    "평균 +6세": rng.normal(41, 8, 3000),
}
`;

const LLMOPS = py`
import re
PRICE_IN, PRICE_OUT = 3.0 / 1e6, 15.0 / 1e6      # 달러/토큰(예시 값): 출력이 입력보다 비싸다
`;

const SEED_SCORES = py`
import numpy as np
from math import erf, sqrt
a = np.array([0.937, 0.944, 0.941, 0.946, 0.933])    # 방법 A, 시드 0~4의 정확도
b = np.array([0.942, 0.939, 0.948, 0.940, 0.941])    # 방법 B, 같은 시드(같은 데이터 분할)
`;

const BOOT_DATA = py`
import numpy as np
v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])    # 7주차 회귀 테스트의 문항별 정답 여부
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])
`;

const ADV_DATA = py`
import numpy as np
from sklearn.datasets import load_digits

d = load_digits()
m = np.isin(d.target, [3, 8])
X, y = d.data[m] / 16.0, (d.target[m] == 8).astype(float)
idx = np.random.default_rng(0).permutation(len(X))
Xtr, ytr, Xte, yte = X[idx[:250]], y[idx[:250]], X[idx[250:]], y[idx[250:]]
sig = lambda z: 1 / (1 + np.exp(-z))
acc = lambda w, b, X, y: float(np.mean((sig(X @ w + b) >= 0.5) == y))
`;

const week8: WeekLab = {
  exercises: [
    {
      id: "w8-lab-fgsm",
      sectionId: "risk-map",
      title: "FGSM으로 숫자 분류기 속이기와 같은 크기의 무작위 잡음 비교",
      tier: "supplement",
      prompt: `
「AI 위험 지도」 실습의 FGSM을 직접 구현합니다. 숫자 3과 8을 구별하는 로지스틱 회귀 \`clf\`(가중치 \`w\`)가 주어져 있습니다.

1. \`input_grad(X, y)\`: 교차 엔트로피 손실을 **입력** $x$로 미분한 값. 로지스틱 회귀에서는 $\\nabla_x J = (p - y)\\,w$이고, \`p = clf.predict_proba(X)[:, 1]\`입니다. 결과 모양은 \`X\`와 같습니다.
2. \`fgsm(X, y, eps)\`: $x' = \\mathrm{clip}(x + \\varepsilon \\cdot \\mathrm{sign}(\\nabla_x J), 0, 1)$
3. \`random_noise(X, eps, seed)\`: 픽셀마다 $\\pm\\varepsilon$를 무작위로 더하고 0~1로 자릅니다(크기는 FGSM과 같고 방향만 무작위).

픽셀당 최대 0.1만 바꿔도 정확도가 크게 떨어지는데, 같은 크기의 무작위 잡음으로는 거의 그대로인 이유를 생각해 보십시오.
`,
      starter: DIGITS + py`

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
      tests: DIGITS + py`

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
      hints: [
        "`p = clf.predict_proba(X)[:, 1]`, `return (p - y)[:, None] * w[None, :]`. 손실을 $w$가 아니라 $x$로 미분했으므로 기울기에 $w$가 곱해집니다.",
        "`np.clip(X + eps * np.sign(input_grad(X, y)), 0, 1)`",
        "무작위 잡음은 `np.clip(X + eps * rng.choice([-1, 1], size=X.shape), 0, 1)`. 무작위 방향의 변화는 서로 상쇄되지만, FGSM은 64개 픽셀 모두를 손실이 커지는 방향으로 밀어 logit이 $\\varepsilon\\,\\lVert w \\rVert_1$만큼 움직입니다.",
      ],
      solution: DIGITS + py`

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
      id: "w8-lab-subgroup",
      sectionId: "risk-map",
      title: "집단별 정확도로 평균이 숨긴 격차를 찾고, 재가중으로 줄이기",
      tier: "core",
      prompt: `
「AI 위험 지도」 실습처럼 다수 집단 A(90%)와 특징–정답 관계가 조금 다른 소수 집단 B(10%)로 모델을 학습합니다.

1. \`accuracy_by_group(y_true, y_pred, groups)\`: 집단 이름 → 정확도 딕셔너리.
2. \`group_weights(groups)\`: 집단마다 가중치 합이 같아지도록 표본 가중치를 줍니다. 표본 $i$의 가중치는 $\\dfrac{n}{K \\cdot n_{g(i)}}$($n$은 전체 표본 수, $K$는 집단 수, $n_{g}$는 집단 크기)이고, 평균은 1입니다.

\`LogisticRegression().fit(X, y, sample_weight=...)\`로 다시 학습했을 때 두 집단의 정확도가 어떻게 바뀌는지, 무엇을 잃는지 확인하십시오.
`,
      starter: SUBGROUPS + py`

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
      tests: SUBGROUPS + py`

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
      hints: [
        "`{k: float(np.mean(y_pred[groups == k] == y_true[groups == k])) for k in np.unique(groups)}`. 입력이 리스트일 수도 있으니 먼저 `np.asarray`로 바꿉니다.",
        "`names, counts = np.unique(groups, return_counts=True)`로 집단 크기를 세고, `size = dict(zip(names, counts))`일 때 `np.array([len(groups) / (len(names) * size[k]) for k in groups])`",
        "재가중은 소수 집단의 손실에 더 큰 몫을 줘서 결정 경계를 B 쪽으로 옮깁니다. 하나의 선형 경계로는 두 관계를 다 맞출 수 없어 A의 정확도와 전체 평균이 떨어지는 트레이드오프가 생깁니다.",
      ],
      solution: SUBGROUPS + py`

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
    {
      id: "w8-lab-fairness",
      sectionId: "fairness",
      title: "선택률·TPR·FPR·PPV로 세 공정성 기준 점검하기",
      tier: "supplement",
      prompt: `
「공정성은 하나가 아니다」의 채용 AI 숫자 예제를 함수로 확인합니다.

1. \`group_rates(y_true, y_pred)\`: \`{"selection", "tpr", "fpr", "ppv"}\`. 선택률은 $P(\\hat{Y}=1)$, TPR은 $P(\\hat{Y}=1 \\mid Y=1)$, FPR은 $P(\\hat{Y}=1 \\mid Y=0)$, PPV는 $P(Y=1 \\mid \\hat{Y}=1)$입니다.
2. \`fairness_gaps(ra, rb)\`: 두 집단 지표 딕셔너리에서 \`{"dp", "tpr", "fpr", "ppv"}\` 격차(절댓값). \`dp\`는 선택률 격차입니다.
3. \`selection_from(tpr, fpr, base_rate)\`: $\\text{선택률} = \\text{TPR} \\times \\text{기저율} + \\text{FPR} \\times (1 - \\text{기저율})$. TPR·FPR이 같아도 기저율이 다르면 선택률이 달라지는 이유입니다.
`,
      starter: HIRING + py`

def group_rates(y_true, y_pred):
    return {"selection": 0.0, "tpr": 0.0, "fpr": 0.0, "ppv": 0.0}  # TODO

def fairness_gaps(ra, rb):
    return {"dp": 0.0, "tpr": 0.0, "fpr": 0.0, "ppv": 0.0}  # TODO

def selection_from(tpr, fpr, base_rate):
    return 0.0  # TODO

ra, rb, rb_dp = group_rates(yA_true, yA_pred), group_rates(yB_true, yB_pred), group_rates(yB_true, yB_pred_dp)
print("조정 전 격차:", fairness_gaps(ra, rb))
print("선택률을 맞춘 뒤 격차:", fairness_gaps(ra, rb_dp))
`,
      tests: HIRING + py`

@test("A 집단: 선택률 0.5, TPR 0.8, FPR 0.2, PPV 0.8")
def _():
    r = group_rates(yA_true, yA_pred)
    assert approx([r["selection"], r["tpr"], r["fpr"], r["ppv"]], [0.5, 0.8, 0.2, 0.8]), r

@test("조정 전: 균등화된 오즈는 성립(TPR·FPR 격차 0)하지만 선택률 격차 0.18, PPV 격차 0.3")
def _():
    gaps = fairness_gaps(group_rates(yA_true, yA_pred), group_rates(yB_true, yB_pred))
    assert approx([gaps["dp"], gaps["tpr"], gaps["fpr"], gaps["ppv"]], [0.18, 0.0, 0.0, 0.3]), gaps

@test("선택률을 맞추면 dp 격차 0, 대신 FPR 격차가 0.2로 벌어진다")
def _():
    gaps = fairness_gaps(group_rates(yA_true, yA_pred), group_rates(yB_true, yB_pred_dp))
    assert approx(gaps["dp"], 0.0) and approx(gaps["fpr"], 0.2) and approx(gaps["tpr"], 0.1), gaps

@test("selection_from: 같은 TPR·FPR이라도 기저율 0.5 → 0.5, 0.2 → 0.32")
def _():
    assert approx(selection_from(0.8, 0.2, 0.5), 0.5) and approx(selection_from(0.8, 0.2, 0.2), 0.32)
    assert approx(selection_from(0.3, 0.3, 0.9), 0.3), "TPR = FPR(무작위로 찍는 수준)이면 기저율과 무관해야 합니다."
`,
      hints: [
        "`t, p = np.asarray(y_true), np.asarray(y_pred)`일 때 선택률은 `p.mean()`, TPR은 `p[t == 1].mean()`, FPR은 `p[t == 0].mean()`, PPV는 `t[p == 1].mean()`",
        "`{k: abs(ra[src] - rb[src]) for k, src in [(\"dp\", \"selection\"), (\"tpr\", \"tpr\"), (\"fpr\", \"fpr\"), (\"ppv\", \"ppv\")]}`",
        "`tpr * base_rate + fpr * (1 - base_rate)`. TPR과 FPR이 같다는 조건(균등화된 오즈) 아래에서 선택률 차이는 정확히 `(tpr - fpr) × 기저율 차이`입니다.",
      ],
      solution: HIRING + py`
import numpy as np

def group_rates(y_true, y_pred):
    t, p = np.asarray(y_true), np.asarray(y_pred)
    return {
        "selection": float(p.mean()),
        "tpr": float(p[t == 1].mean()),
        "fpr": float(p[t == 0].mean()),
        "ppv": float(t[p == 1].mean()),
    }

def fairness_gaps(ra, rb):
    return {k: abs(ra[src] - rb[src]) for k, src in [("dp", "selection"), ("tpr", "tpr"), ("fpr", "fpr"), ("ppv", "ppv")]}

def selection_from(tpr, fpr, base_rate):
    return tpr * base_rate + fpr * (1 - base_rate)

ra, rb, rb_dp = group_rates(yA_true, yA_pred), group_rates(yB_true, yB_pred), group_rates(yB_true, yB_pred_dp)
print("조정 전 격차:", fairness_gaps(ra, rb))
print("선택률을 맞춘 뒤 격차:", fairness_gaps(ra, rb_dp))
`,
    },
    {
      id: "w8-lab-threshold",
      sectionId: "fairness",
      title: "보정된 점수에서 세 가지 임계값 정책 비교하기",
      tier: "advanced",
      prompt: `
「공정성은 하나가 아니다」 실습처럼, 점수 $s$를 받은 사람이 정확히 확률 $s$로 우수 인재인 **보정된** 모델을 기저율이 다른 두 집단(약 50% vs 20%)에 적용합니다.

1. \`rates(s, y, t)\`: 임계값 \`t\` 이상을 합격 추천했을 때의 \`{"sel", "tpr", "fpr", "ppv"}\`.
2. \`threshold_for_rate(s, rate)\`: 점수가 임계값 이상인 비율이 \`rate\`가 되는 임계값(분위수).
3. \`threshold_for_tpr(s, y, tpr)\`: 실제 양성(\`y == 1\`) 중 \`tpr\` 비율이 임계값 이상이 되는 임계값.

세 정책(① 같은 임계값 0.5, ② B의 선택률을 A와 같게, ③ B의 TPR을 A와 같게) 중 어느 것도 네 지표를 모두 같게 만들지 못하는 것을 확인합니다.
`,
      starter: CALIBRATED + py`

def rates(s, y, t):
    return {"sel": 0.0, "tpr": 0.0, "fpr": 0.0, "ppv": 0.0}  # TODO

def threshold_for_rate(s, rate):
    return 0.5  # TODO: np.quantile(s, 1 - rate)

def threshold_for_tpr(s, y, tpr):
    return 0.5  # TODO

ra = rates(sA, yA, 0.5)
policies = {
    "같은 임계값 0.5": 0.5,
    "선택률 맞춤": threshold_for_rate(sB, ra["sel"]),
    "TPR 맞춤": threshold_for_tpr(sB, yB, ra["tpr"]),
}
for name, tB in policies.items():
    rb = rates(sB, yB, tB)
    print(f"{name:12s} B 임계값 {tB:.3f} | " + "  ".join(f"{k} {ra[k]:.2f}/{rb[k]:.2f}" for k in ra))
`,
      tests: CALIBRATED + py`

@test("같은 임계값: 점수의 의미(PPV)는 비슷하지만 선택률은 극단적으로 다르다")
def _():
    ra, rb = rates(sA, yA, 0.5), rates(sB, yB, 0.5)
    assert abs(ra["ppv"] - rb["ppv"]) < 0.06 and ra["sel"] > 0.45 and rb["sel"] < 0.05, (ra, rb)
    assert approx(ra["tpr"], 0.613, 0.01) and approx(ra["fpr"], 0.380, 0.01), ra

@test("선택률 맞춤: B 선택률이 A와 같아지고 B의 PPV는 0.35 아래로")
def _():
    ra = rates(sA, yA, 0.5)
    rb = rates(sB, yB, threshold_for_rate(sB, ra["sel"]))
    assert abs(rb["sel"] - ra["sel"]) < 0.005 and rb["ppv"] < 0.35, (ra["sel"], rb)

@test("TPR 맞춤: TPR은 같아지지만 FPR·PPV는 여전히 다르다")
def _():
    ra = rates(sA, yA, 0.5)
    rb = rates(sB, yB, threshold_for_tpr(sB, yB, ra["tpr"]))
    assert abs(rb["tpr"] - ra["tpr"]) < 0.005, (ra["tpr"], rb["tpr"])
    assert abs(rb["fpr"] - ra["fpr"]) > 0.05 and abs(rb["ppv"] - ra["ppv"]) > 0.2, (ra, rb)

@test("어느 정책도 네 지표를 모두 같게 만들지 못한다")
def _():
    ra = rates(sA, yA, 0.5)
    for tB in (0.5, threshold_for_rate(sB, ra["sel"]), threshold_for_tpr(sB, yB, ra["tpr"])):
        rb = rates(sB, yB, tB)
        assert max(abs(ra[k] - rb[k]) for k in ra) > 0.05, (tB, rb)
`,
      hints: [
        "`pred = s >= t`일 때 `sel = pred.mean()`, `tpr = pred[y == 1].mean()`, `fpr = pred[y == 0].mean()`, `ppv = y[pred].mean()`",
        "점수 상위 `rate` 비율을 고르려면 아래에서 `1 - rate` 분위수가 임계값입니다: `np.quantile(s, 1 - rate)`. TPR 맞춤은 같은 계산을 실제 양성의 점수 `s[y == 1]`에만 합니다.",
        "보정된 모델에 같은 임계값을 쓰면 '같은 점수 = 같은 의미'(PPV가 비슷)가 유지되지만, 기저율이 낮은 B는 점수 자체가 낮아 거의 선택되지 않습니다. 선택률이나 TPR을 맞추려고 B의 임계값을 낮추면 B의 합격 추천에 비우수자가 많이 섞여 PPV가 떨어집니다.",
      ],
      solution: CALIBRATED + py`

def rates(s, y, t):
    pred = s >= t
    return {"sel": float(pred.mean()), "tpr": float(pred[y == 1].mean()),
            "fpr": float(pred[y == 0].mean()), "ppv": float(y[pred].mean())}

def threshold_for_rate(s, rate):
    return float(np.quantile(s, 1 - rate))

def threshold_for_tpr(s, y, tpr):
    return float(np.quantile(s[y == 1], 1 - tpr))

ra = rates(sA, yA, 0.5)
policies = {
    "같은 임계값 0.5": 0.5,
    "선택률 맞춤": threshold_for_rate(sB, ra["sel"]),
    "TPR 맞춤": threshold_for_tpr(sB, yB, ra["tpr"]),
}
for name, tB in policies.items():
    rb = rates(sB, yB, tB)
    print(f"{name:12s} B 임계값 {tB:.3f} | " + "  ".join(f"{k} {ra[k]:.2f}/{rb[k]:.2f}" for k in ra))
`,
    },
    {
      id: "w8-lab-modelcard",
      sectionId: "governance",
      title: "모델카드 점검기와 위험 등급 분류(엄격한 등급 우선)",
      tier: "core",
      prompt: `
「거버넌스」 실습의 모델카드 점검기와 EU AI Act식 위험 등급 연습을 직접 만듭니다(법적 판단이 아닌 개념 연습입니다).

1. \`check_model_card(card)\`: 문제 목록(문자열 리스트)을 돌려줍니다. \`REQUIRED\`의 항목이 없거나 비어 있으면 그 항목 이름을 담은 문제, \`performance_by_group\`의 집단이 2개 미만이면 "집단" 문제, 집단마다 보고한 지표 이름이 서로 다르면 "지표" 문제를 추가합니다.
2. \`fixed\`: \`draft\`를 고쳐 점검기를 통과하는 모델카드를 만듭니다.
3. \`tier_of(use_case)\`: \`(등급, 근거 키워드)\`. 여러 등급의 키워드가 함께 들어 있으면 **더 엄격한** 등급을 고르고(금지 > 고위험 > 제한적 위험), 어디에도 해당하지 않으면 \`("최소 위험", None)\`입니다.
`,
      starter: MODEL_CARD + py`

def check_model_card(card):
    problems = []
    # TODO: 필수 항목 누락·비어 있음 / 집단 2개 미만 / 집단마다 지표 이름이 다름
    return problems

fixed = dict(draft)  # TODO: 점검기를 통과하도록 고칩니다.

def tier_of(use_case):
    return "최소 위험", None  # TODO: 엄격한 등급부터 키워드를 찾습니다.

print(check_model_card(draft))
print(check_model_card(fixed))
for uc in ["이력서 자동 채용 선별", "고객 상담 챗봇", "채용 면접 챗봇", "스팸 메일 필터"]:
    print(uc, "→", tier_of(uc))
`,
      tests: MODEL_CARD + py`

@test("초안의 세 가지 문제를 찾는다")
def _():
    probs = check_model_card(draft)
    text = " ".join(probs)
    assert len(probs) == 3, probs
    assert "out_of_scope_use" in text and "ethical_considerations" in text and "performance_by_group" in text, probs

@test("집단마다 지표 이름이 다르면 '지표' 문제")
def _():
    card = dict(draft, out_of_scope_use=["의료 상담"], ethical_considerations=["개인정보 입력 금지 안내"],
                performance_by_group={"신입": {"accuracy": 0.8}, "기존": {"f1": 0.9}})
    probs = check_model_card(card)
    assert len(probs) == 1 and "지표" in probs[0], probs

@test("고친 모델카드는 점검기를 통과한다")
def _():
    assert check_model_card(fixed) == [], check_model_card(fixed)
    assert fixed["model_name"] == draft["model_name"], "모델 이름은 그대로 둡니다."

@test("위험 등급: 엄격한 등급 우선, 근거 키워드 함께")
def _():
    assert tier_of("이력서 자동 채용 선별") == ("고위험", "채용")
    assert tier_of("고객 상담 챗봇") == ("제한적 위험(투명성 의무)", "챗봇")
    assert tier_of("채용 면접 챗봇") == ("고위험", "채용"), tier_of("채용 면접 챗봇")
    assert tier_of("시민 행동 기반 사회적 점수 챗봇")[0] == "금지"
    assert tier_of("스팸 메일 필터") == ("최소 위험", None)
`,
      hints: [
        "`problems = [f\"{k}: 없음 또는 비어 있음\" for k in REQUIRED if not card.get(k)]`. 빈 리스트·빈 문자열·None은 모두 거짓입니다.",
        "`groups = card.get(\"performance_by_group\") or {}`; 집단이 2개 미만이면 문제를 추가하고, `len({tuple(sorted(m)) for m in groups.values()}) > 1`이면 지표 이름이 다른 것입니다.",
        "`for tier, keys in TIERS.items():`는 딕셔너리에 넣은 순서(금지 → 고위험 → 제한적)대로 돌므로, 처음 걸린 키워드에서 바로 `return tier, k`하면 엄격한 등급이 우선합니다.",
      ],
      solution: MODEL_CARD + py`

def check_model_card(card):
    problems = [f"{k}: 없음 또는 비어 있음" for k in REQUIRED if not card.get(k)]
    groups = card.get("performance_by_group") or {}
    if len(groups) < 2:
        problems.append("performance_by_group: 집단이 2개 이상이어야 격차를 볼 수 있음")
    elif len({tuple(sorted(m)) for m in groups.values()}) > 1:
        problems.append("performance_by_group: 집단마다 보고한 지표 이름이 다름")
    return problems

fixed = dict(
    draft,
    out_of_scope_use=["개인 상담·의료·법률 조언", "회원 평가나 징계 결정"],
    performance_by_group={"신입 회원 질문": {"accuracy": 0.81}, "기존 회원 질문": {"accuracy": 0.88}},
    ethical_considerations=["개인정보를 입력하지 않도록 안내", "공지에 없는 답은 '자료에 없음'으로 거절"],
)

def tier_of(use_case):
    for tier, keys in TIERS.items():
        for k in keys:
            if k in use_case:
                return tier, k
    return "최소 위험", None

print(check_model_card(draft))
print(check_model_card(fixed))
for uc in ["이력서 자동 채용 선별", "고객 상담 챗봇", "채용 면접 챗봇", "스팸 메일 필터"]:
    print(uc, "→", tier_of(uc))
`,
    },
    {
      id: "w8-lab-psi",
      sectionId: "mlops",
      title: "PSI로 드리프트 경보를 만들고 카나리 배포 판정하기",
      tier: "supplement",
      prompt: `
「MLOps」 실습의 드리프트 감지와 카나리 배포를 직접 구현합니다.

1. \`psi(train, prod, bins=10)\`: 학습 데이터의 분위수로 구간을 나누고(양 끝은 $\\pm\\infty$), 구간별 비율 $p_i$(학습), $q_i$(운영)로 $\\text{PSI} = \\sum_i (p_i - q_i)\\ln(p_i / q_i)$. 비어 있는 구간 때문에 $\\ln 0$이 나오지 않도록 비율을 $10^{-6}$ 이상으로 자릅니다.
2. \`drift_flag(v)\`: 0.1 미만 \`"안정"\`, 0.2 미만 \`"관찰 필요"\`, 그 이상 \`"재학습 검토"\`.
3. \`canary_decision(err_new, n_new, err_old, n_old, tolerance=0.005)\`: 오류 건수와 요청 수로 두 오류율을 구해, 새 모델 오류율이 기존 + \`tolerance\` 이하면 \`"확대"\`, 아니면 \`"롤백"\`.
`,
      starter: PSI_DATA + py`

def psi(train, prod, bins=10):
    return 0.0  # TODO

def drift_flag(v):
    return "안정"  # TODO

def canary_decision(err_new, n_new, err_old, n_old, tolerance=0.005):
    return "확대"  # TODO

for name, prod in prods.items():
    v = psi(train, prod)
    print(f"{name:8s} PSI = {v:.3f} → {drift_flag(v)}")
print(canary_decision(80, 1000, 380, 19000), canary_decision(18, 1000, 380, 19000))
`,
      tests: PSI_DATA + py`

@test("같은 분포는 거의 0, 평균이 멀어질수록 커진다(+2세 ≈ 0.064, +6세 ≈ 0.48)")
def _():
    vals = [psi(train, prods[k]) for k in ["같은 분포", "평균 +2세", "평균 +3세", "평균 +6세"]]
    assert vals[0] < 0.01 and vals == sorted(vals), np.round(vals, 4)
    assert approx(vals[1], 0.0641, 2e-3) and approx(vals[3], 0.484, 5e-3), np.round(vals, 4)

@test("빈 구간이 있어도 무한대가 되지 않는다")
def _():
    v = psi(train, np.full(500, 90.0))
    assert np.isfinite(v) and v > 5, v

@test("경보 등급: 0.05 안정, 0.15 관찰 필요, 0.48 재학습 검토")
def _():
    assert [drift_flag(v) for v in (0.05, 0.1, 0.15, 0.2, 0.48)] == ["안정", "관찰 필요", "관찰 필요", "재학습 검토", "재학습 검토"]

@test("카나리: 오류율 8%인 새 모델은 롤백, 1.8%면 확대")
def _():
    assert canary_decision(80, 1000, 380, 19000) == "롤백" and canary_decision(18, 1000, 380, 19000) == "확대"
    assert canary_decision(25, 1000, 380, 19000) == "확대" and canary_decision(26, 1000, 380, 19000) == "롤백", "경계값(0.02 + 0.005)을 확인하십시오."
`,
      hints: [
        "`edges = np.quantile(train, np.linspace(0, 1, bins + 1))` 다음 `edges[0], edges[-1] = -np.inf, np.inf`. 비율은 `np.histogram(train, edges)[0] / len(train)`",
        "`p, q = np.clip(p, 1e-6, None), np.clip(q, 1e-6, None)` 다음 `np.sum((p - q) * np.log(p / q))`",
        "카나리는 `err_new / n_new <= err_old / n_old + tolerance`이면 확대입니다. 26/1000 = 0.026은 0.02 + 0.005를 넘습니다. 부동소수점 비교라 경계에서는 작은 여유(`+ 1e-12`)를 두면 안전합니다.",
      ],
      solution: PSI_DATA + py`

def psi(train, prod, bins=10):
    edges = np.quantile(train, np.linspace(0, 1, bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    p = np.histogram(train, edges)[0] / len(train)
    q = np.histogram(prod, edges)[0] / len(prod)
    p, q = np.clip(p, 1e-6, None), np.clip(q, 1e-6, None)
    return float(np.sum((p - q) * np.log(p / q)))

def drift_flag(v):
    return "안정" if v < 0.1 else ("관찰 필요" if v < 0.2 else "재학습 검토")

def canary_decision(err_new, n_new, err_old, n_old, tolerance=0.005):
    return "확대" if err_new / n_new <= err_old / n_old + tolerance + 1e-12 else "롤백"

for name, prod in prods.items():
    v = psi(train, prod)
    print(f"{name:8s} PSI = {v:.3f} → {drift_flag(v)}")
print(canary_decision(80, 1000, 380, 19000), canary_decision(18, 1000, 380, 19000))
`,
    },
    {
      id: "w8-lab-llmops",
      sectionId: "llmops",
      title: "RAG 토큰 비용, 토큰 버킷 속도 제한, 개인정보 가드레일",
      tier: "supplement",
      prompt: `
「LLMOps」 실습의 세 가지 운영 장치를 직접 만듭니다.

1. \`rag_daily_cost(k, calls=10000, system=400, question=50, chunk=500, answer=300)\`: 입력 토큰 = 시스템 프롬프트 + 질문 + 조각 $k$개, 출력 토큰 = 답변일 때 하루 비용(달러). 1회 비용은 $n_{\\text{in}} p_{\\text{in}} + n_{\\text{out}} p_{\\text{out}}$입니다.
2. \`TokenBucket(rate, capacity)\`: 허용량이 1초에 \`rate\`개씩 \`capacity\`까지 채워지고, \`allow(now)\`는 허용량이 1 이상이면 1을 쓰고 \`True\`, 아니면 \`False\`. 처음에는 가득 차 있고 시각 0에서 시작합니다.
3. \`output_guardrail(text)\`: 응답 속 휴대전화 번호, 이메일, **주민등록번호**(\`######-#######\`)를 각각 \`[전화번호]\`, \`[이메일]\`, \`[주민등록번호]\`로 가리고 \`(가린 텍스트, 가린 건수)\`를 돌려줍니다.
`,
      starter: LLMOPS + py`

def rag_daily_cost(k, calls=10000, system=400, question=50, chunk=500, answer=300):
    return 0.0  # TODO

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity, self.tokens, self.last = rate, capacity, capacity, 0.0
    def allow(self, now):
        return True  # TODO: 지난 시각 이후 채워진 만큼 더하고(최대 capacity), 1 이상이면 1을 씁니다.

PII = [
    (re.compile(r"01[016789]-?\d{3,4}-?\d{4}"), "[전화번호]"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[이메일]"),
    # TODO: 주민등록번호 규칙을 추가합니다.
]
def output_guardrail(text):
    hits = 0
    # TODO: 규칙마다 pattern.subn(label, text)로 가리고 건수를 셉니다.
    return text, hits

print([round(rag_daily_cost(k), 2) for k in (0, 3, 10)])
bucket = TokenBucket(rate=2, capacity=5)
print("".join("O" if bucket.allow(t) else "X" for t in [0.0] * 8 + [1.0, 1.1, 1.2, 3.0]))
print(output_guardrail("연락처 010-1234-5678, 메일 lead@club.example.com, 주민번호 900101-1234567"))
`,
      tests: LLMOPS + py`

@test("하루 1만 회 비용: 조각 0개 58.5달러, 3개 103.5달러, 10개 208.5달러")
def _():
    vals = [rag_daily_cost(k) for k in (0, 3, 10)]
    assert approx(vals, [58.5, 103.5, 208.5], 1e-6), vals
    assert approx(rag_daily_cost(3, calls=1, answer=0), 1950 * 3e-6), "입력 토큰은 400 + 50 + 3 × 500 = 1,950개입니다."

@test("토큰 버킷: 0초에 몰린 8건 중 5건만, 이후 채워진 만큼 허용")
def _():
    bucket = TokenBucket(rate=2, capacity=5)
    got = "".join("O" if bucket.allow(t) else "X" for t in [0.0] * 8 + [1.0, 1.1, 1.2, 3.0])
    assert got == "OOOOOXXXOOXO", got

@test("허용량은 capacity를 넘지 않는다")
def _():
    bucket = TokenBucket(rate=10, capacity=3)
    got = "".join("O" if bucket.allow(t) else "X" for t in [100.0] * 5)
    assert got == "OOOXX", got

@test("가드레일: 전화번호·이메일·주민등록번호 3건을 가린다")
def _():
    safe, n = output_guardrail("회장 010-1234-5678, 메일 lead@club.example.com, 주민번호 900101-1234567 입니다.")
    assert n == 3 and "[주민등록번호]" in safe and "[전화번호]" in safe and "[이메일]" in safe, (safe, n)
    assert "1234567" not in safe and "5678" not in safe, safe
    assert output_guardrail("세션은 토요일 오후 2시") == ("세션은 토요일 오후 2시", 0)
`,
      hints: [
        "`n_in = system + question + k * chunk`, `return calls * (n_in * PRICE_IN + answer * PRICE_OUT)`",
        "`self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)`, `self.last = now` 다음, `self.tokens >= 1`이면 1을 빼고 `True`",
        "주민등록번호는 `re.compile(r\"\\d{6}-[1-4]\\d{6}\")`처럼 쓸 수 있습니다. 규칙을 차례로 `text, n = pattern.subn(label, text)`로 적용하고 `hits += n`. 정규식은 '공일공…'처럼 바꿔 쓴 개인정보는 못 잡으므로 분류 모델 등 다른 겹이 필요합니다.",
      ],
      solution: LLMOPS + py`

def rag_daily_cost(k, calls=10000, system=400, question=50, chunk=500, answer=300):
    n_in = system + question + k * chunk
    return calls * (n_in * PRICE_IN + answer * PRICE_OUT)

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity, self.tokens, self.last = rate, capacity, capacity, 0.0
    def allow(self, now):
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

PII = [
    (re.compile(r"\d{6}-[1-4]\d{6}"), "[주민등록번호]"),
    (re.compile(r"01[016789]-?\d{3,4}-?\d{4}"), "[전화번호]"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[이메일]"),
]
def output_guardrail(text):
    hits = 0
    for pattern, label in PII:
        text, n = pattern.subn(label, text)
        hits += n
    return text, hits

print([round(rag_daily_cost(k), 2) for k in (0, 3, 10)])
bucket = TokenBucket(rate=2, capacity=5)
print("".join("O" if bucket.allow(t) else "X" for t in [0.0] * 8 + [1.0, 1.1, 1.2, 3.0]))
print(output_guardrail("연락처 010-1234-5678, 메일 lead@club.example.com, 주민번호 900101-1234567"))
`,
    },
    {
      id: "w8-lab-permutation",
      sectionId: "research-methods",
      title: "시드 5개의 평균·표준편차, 정확 순열 검정, 두 비율 z-검정",
      tier: "supplement",
      prompt: `
「AI 연구 방법론」 실습의 통계 도구를 직접 구현합니다. \`a\`, \`b\`는 두 방법을 같은 시드(같은 데이터 분할) 5개로 평가한 정확도입니다.

1. \`mean_std(x)\`: 평균과 **표본** 표준편차(\`ddof=1\`).
2. \`paired_permutation_p(a, b)\`: 짝지은 차이 $d = b - a$의 부호를 바꿀 수 있는 $2^n$가지 경우를 **모두** 따져, $|\\overline{d'}| \\ge |\\bar{d}|$인 비율(양측 정확 p값)을 돌려줍니다.
3. \`two_proportion_z(sa, na, sb, nb)\`: 합동 비율 $\\hat{p}$로 $z = \\dfrac{\\hat{p}_b - \\hat{p}_a}{\\sqrt{\\hat{p}(1-\\hat{p})(1/n_a + 1/n_b)}}$와 양측 p값 $2\\,(1 - \\Phi(|z|))$를 \`(z, p)\`로. $\\Phi(z) = \\frac{1}{2}\\left(1 + \\mathrm{erf}(z/\\sqrt{2})\\right)$입니다.

시드 5개로는 모든 시드에서 이겨도 p값이 0.05 아래로 내려가지 않는 이유를 생각해 보십시오.
`,
      starter: SEED_SCORES + py`
import itertools

def mean_std(x):
    return 0.0, 0.0  # TODO

def paired_permutation_p(a, b):
    return 0.0  # TODO: itertools.product([-1, 1], repeat=n)으로 모든 부호 조합

def two_proportion_z(sa, na, sb, nb):
    return 0.0, 1.0  # TODO

print("A", mean_std(a), "B", mean_std(b))
print("순열 검정 p =", paired_permutation_p(a, b))
for n in (500, 5000):
    print(n, two_proportion_z(int(0.10 * n), n, int(0.12 * n), n))
`,
      tests: SEED_SCORES + py`

@test("평균과 표본 표준편차(ddof = 1)")
def _():
    m, s = mean_std(a)
    assert approx(m, 0.9402) and approx(s, np.std(a, ddof=1)), (m, s)

@test("정확 순열 검정: a, b는 p = 0.5625")
def _():
    assert approx(paired_permutation_p(a, b), 0.5625), paired_permutation_p(a, b)

@test("시드 5개에서 모두 이겨도 양측 p = 2/32 = 0.0625, 시드 6개면 0.03125")
def _():
    base = np.array([0.90, 0.91, 0.92, 0.93, 0.94, 0.95])
    assert approx(paired_permutation_p(base[:5], base[:5] + 0.01), 0.0625)
    assert approx(paired_permutation_p(base, base + np.array([0.01, 0.02, 0.01, 0.03, 0.02, 0.01])), 0.03125)

@test("같은 2%p 차이: 그룹당 500명이면 p ≈ 0.31, 5,000명이면 p ≈ 0.0014")
def _():
    z1, p1 = two_proportion_z(50, 500, 60, 500)
    z2, p2 = two_proportion_z(500, 5000, 600, 5000)
    assert approx(z1, 1.0107, 1e-3) and approx(p1, 0.3122, 1e-3), (z1, p1)
    assert approx(z2, 3.196, 1e-3) and approx(p2, 0.00139, 1e-4), (z2, p2)
`,
      hints: [
        "`np.mean(x)`, `np.std(x, ddof=1)`. 시드가 5개뿐이면 n−1로 나누는 표본 표준편차를 보고합니다.",
        "`d = np.asarray(b) - np.asarray(a)`, `obs = abs(d.mean())`, `null = [abs((np.array(s) * d).mean()) for s in itertools.product([-1, 1], repeat=len(d))]`, p = `np.mean([v >= obs - 1e-12 for v in null])`",
        "부호 조합 32가지 중 관측값만큼 극단적인 것은 '모두 +'와 '모두 −' 두 가지뿐일 수 있으므로 최소 p값은 2/32입니다. 시드를 늘리지 않으면 이 벽을 넘을 수 없습니다. z-검정의 p는 `2 * (1 - 0.5 * (1 + erf(abs(z) / sqrt(2))))`",
      ],
      solution: SEED_SCORES + py`
import itertools

def mean_std(x):
    return float(np.mean(x)), float(np.std(x, ddof=1))

def paired_permutation_p(a, b):
    d = np.asarray(b) - np.asarray(a)
    obs = abs(d.mean())
    null = [abs((np.array(s) * d).mean()) for s in itertools.product([-1, 1], repeat=len(d))]
    return float(np.mean([v >= obs - 1e-12 for v in null]))

def two_proportion_z(sa, na, sb, nb):
    pa, pb = sa / na, sb / nb
    pooled = (sa + sb) / (na + nb)
    z = (pb - pa) / sqrt(pooled * (1 - pooled) * (1 / na + 1 / nb))
    return z, 2 * (1 - 0.5 * (1 + erf(abs(z) / sqrt(2))))

print("A", mean_std(a), "B", mean_std(b))
print("순열 검정 p =", paired_permutation_p(a, b))
for n in (500, 5000):
    print(n, two_proportion_z(int(0.10 * n), n, int(0.12 * n), n))
`,
    },
    {
      id: "w8-lab-repro",
      sectionId: "capstone",
      title: "캡스톤용 재현 가능한 실험 뼈대: 시드 분할과 다중 시드 요약",
      tier: "core",
      prompt: `
캡스톤 「구현과 실험」에 그대로 가져다 쓸 수 있는 실험 뼈대를 만듭니다.

1. \`seeded_split(n, test_ratio, seed)\`: \`np.random.default_rng(seed).permutation(n)\`으로 섞은 인덱스에서 앞의 \`round(n × test_ratio)\`개를 테스트, 나머지를 학습으로 해 \`(train_idx, test_idx)\`를 돌려줍니다. 같은 시드면 항상 같은 분할입니다.
2. \`run_seeds(fn, seeds)\`: 시드마다 \`fn(seed)\`를 실행해 \`{"scores", "mean", "std"}\`(표준편차는 \`ddof=1\`)를 돌려줍니다.
3. \`report_line(name, summary)\`: \`"baseline: 0.812 ± 0.013 (시드 5개)"\` 형식의 한 줄(소수 셋째 자리).
`,
      starter: py`
import numpy as np

def seeded_split(n, test_ratio, seed):
    idx = np.arange(n)
    return idx, idx[:0]  # TODO

def run_seeds(fn, seeds):
    return {"scores": [], "mean": 0.0, "std": 0.0}  # TODO

def report_line(name, summary):
    return name  # TODO

noisy_baseline = lambda seed: 0.80 + 0.02 * np.random.default_rng(seed).standard_normal()
print(seeded_split(10, 0.3, seed=0))
print(report_line("baseline", run_seeds(noisy_baseline, range(5))))
`,
      tests: py`
import numpy as np

@test("같은 시드는 같은 분할, 다른 시드는 다른 분할")
def _():
    tr1, te1 = seeded_split(100, 0.2, seed=7)
    tr2, te2 = seeded_split(100, 0.2, seed=7)
    tr3, te3 = seeded_split(100, 0.2, seed=8)
    assert list(te1) == list(te2) and list(tr1) == list(tr2) and list(te1) != list(te3)

@test("학습·테스트가 겹치지 않고 전체를 덮으며 크기가 맞다")
def _():
    tr, te = seeded_split(10, 0.3, seed=0)
    assert len(te) == 3 and len(tr) == 7 and set(tr) | set(te) == set(range(10)) and not set(tr) & set(te), (tr, te)
    assert list(te) == list(np.random.default_rng(0).permutation(10)[:3])

@test("다중 시드 요약: 평균과 표본 표준편차")
def _():
    s = run_seeds(lambda seed: [0.8, 0.82, 0.84][seed], range(3))
    assert list(s["scores"]) == [0.8, 0.82, 0.84] and approx(s["mean"], 0.82) and approx(s["std"], 0.02), s

@test("보고 형식: 'baseline: 0.820 ± 0.020 (시드 3개)'")
def _():
    s = run_seeds(lambda seed: [0.8, 0.82, 0.84][seed], range(3))
    assert report_line("baseline", s) == "baseline: 0.820 ± 0.020 (시드 3개)", report_line("baseline", s)
`,
      hints: [
        "`perm = np.random.default_rng(seed).permutation(n)`, `k = int(round(n * test_ratio))`, `return perm[k:], perm[:k]`",
        "`scores = [fn(s) for s in seeds]` 다음 `np.mean(scores)`, `np.std(scores, ddof=1)`",
        "`f\"{name}: {summary['mean']:.3f} ± {summary['std']:.3f} (시드 {len(summary['scores'])}개)\"`. 시드 값과 설정을 이렇게 코드 밖으로 남겨 두면 리포트의 '재현성·문서화' 근거가 됩니다.",
      ],
      solution: py`
import numpy as np

def seeded_split(n, test_ratio, seed):
    perm = np.random.default_rng(seed).permutation(n)
    k = int(round(n * test_ratio))
    return perm[k:], perm[:k]

def run_seeds(fn, seeds):
    scores = [fn(s) for s in seeds]
    return {"scores": scores, "mean": float(np.mean(scores)), "std": float(np.std(scores, ddof=1))}

def report_line(name, summary):
    return f"{name}: {summary['mean']:.3f} ± {summary['std']:.3f} (시드 {len(summary['scores'])}개)"

noisy_baseline = lambda seed: 0.80 + 0.02 * np.random.default_rng(seed).standard_normal()
print(seeded_split(10, 0.3, seed=0))
print(report_line("baseline", run_seeds(noisy_baseline, range(5))))
`,
    },
  ],

  quiz: [
    {
      kind: "choice",
      id: "w8-drill-adv-vs-bias",
      tier: "core",
      sectionId: "risk-map",
      question: "편향 완화책인 \"데이터를 더 많이, 더 고르게 모은다\"가 적대적 공격(FGSM)에는 잘 통하지 않는 이유는?",
      choices: [
        "적대적 공격은 데이터 분포가 균형 잡혀 있어도 고차원 입력 공간에서 결정 경계가 국소적으로 불안정해서 생기기 때문이다",
        "적대적 공격은 학습 데이터에만 영향을 주기 때문이다",
        "데이터를 더 모으면 모델이 반드시 과적합되기 때문이다",
        "FGSM은 이미지가 아닌 텍스트에만 쓰이기 때문이다",
      ],
      answer: 0,
      explanation: "편향은 학습 데이터의 집단 불균형이 원인이지만, 적대적 공격은 손실이 가장 가파르게 커지는 방향으로 입력을 조금씩 미는 것만으로 결정 경계를 넘깁니다. 그래서 적대적 학습, 입력 전처리, 레드팀 같은 별도 완화책이 필요합니다.",
    },
    {
      kind: "choice",
      id: "w8-drill-automation-bias",
      tier: "core",
      sectionId: "risk-map",
      question: "\"최종 결정은 사람이 한다\"는 채용 시스템에서 자동화 편향을 줄이는 데 가장 효과적인 설계는?",
      choices: [
        "AI 판정을 더 크게, 빨간색으로 표시한다",
        "검토자가 하루에 처리해야 할 건수를 늘려 효율을 높인다",
        "검토자에게 판단할 시간과 판정 근거(왜 그런 판정인지)를 함께 주고, 일부 건은 AI 판정을 숨긴 채 독립적으로 검토하게 한다",
        "AI 판정을 그대로 따른 검토자에게 보상을 준다",
      ],
      answer: 2,
      explanation: "하루 수백 건을 클릭 한 번으로 승인하는 구조라면 사람의 검토는 형식에 그칩니다. 실제로 판단할 시간과 근거를 주고, 판정을 가린 독립 검토로 사람이 AI를 그대로 따르는지 점검해야 검토가 실질적인 안전장치가 됩니다.",
    },
    {
      kind: "choice",
      id: "w8-drill-eu-tier",
      tier: "core",
      sectionId: "governance",
      question: "EU AI Act식 위험 등급에서 \"대학 입학 서류를 자동으로 평가해 순위를 매기는 AI\"는 어디에 속하는가?",
      choices: ["최소 위험", "제한적 위험(투명성 의무)", "고위험", "금지"],
      answer: 2,
      explanation: "입학·시험 평가는 사람의 교육 기회에 큰 영향을 주므로 고위험으로 분류되어 위험관리, 데이터 품질, 기술 문서화, 사람의 감독 같은 엄격한 의무가 따릅니다. (개념 연습용 요약이며 실제 판단은 최신 조문과 맥락을 확인해야 합니다.)",
    },
    {
      kind: "choice",
      id: "w8-drill-concept-drift",
      tier: "core",
      sectionId: "mlops",
      question: "사기 탐지 모델의 입력 특징 PSI는 몇 달째 0.02 안팎으로 조용한데, 늦게 들어온 정답 라벨로 보니 재현율이 크게 떨어졌다. 가장 그럴듯한 원인과 대응은?",
      choices: [
        "데이터 드리프트이므로 PSI 경보 임계값을 0.01로 낮춘다",
        "개념 드리프트($P(y \\mid x)$ 변화)이므로 라벨 기반 성능 지표를 계속 추적하고, 원인을 확인한 뒤 새 라벨로 재학습한다",
        "PSI가 낮으므로 모델에는 문제가 없고 라벨이 틀렸다",
        "카나리 배포 비율을 늘린다",
      ],
      answer: 1,
      explanation: "PSI는 입력 분포 $P(x)$의 변화만 봅니다. 사기범이 수법을 바꾸면 입력은 비슷해도 같은 입력의 정답이 달라지는 개념 드리프트가 생기고, 이는 입력만 봐서는 감지할 수 없습니다. 늦게라도 정답 라벨을 모아 성능을 직접 추적해야 합니다.",
    },
    {
      kind: "choice",
      id: "w8-drill-shadow",
      tier: "core",
      sectionId: "mlops",
      question: "새 모델을 실제 트래픽으로 검증하고 싶지만, 검증 기간 동안 사용자는 어떤 영향도 받지 않아야 한다. 알맞은 배포 전략은?",
      choices: ["카나리 배포", "블루-그린 배포", "섀도 배포", "한 번에 전체 교체"],
      answer: 2,
      explanation: "섀도 배포는 실제 요청을 새 모델에도 복제해 보내되 그 응답은 사용자에게 보여 주지 않고 기록만 합니다. 카나리는 일부 사용자가 실제로 새 모델의 응답을 받고, 블루-그린은 트래픽을 한 번에 전환합니다.",
    },
    {
      kind: "choice",
      id: "w8-drill-local-llm",
      tier: "core",
      sectionId: "llmops",
      question: "환자 진료 기록을 요약하는 병원 내부 도구를 만든다. 트래픽은 많지 않지만 데이터는 기관 밖으로 나가면 안 된다. 우선 고려할 방식은?",
      choices: [
        "토큰 단가가 가장 싼 외부 LLM API",
        "조직 인프라 안에서 돌리는 로컬(자체 호스팅) LLM",
        "프롬프트에 '개인정보를 저장하지 마시오'를 넣은 외부 API",
        "캐싱만 추가한 외부 API",
      ],
      answer: 1,
      explanation: "API 방식은 입력이 외부 서버로 전송됩니다. 민감 정보가 기관 밖으로 나가면 안 된다는 요구가 비용·편의보다 우선하므로 자체 호스팅을 먼저 검토합니다. 프롬프트 속 부탁은 데이터 전송 자체를 막지 못합니다.",
    },
    {
      kind: "predict",
      id: "w8-drill-selection",
      tier: "core",
      sectionId: "fairness",
      code: py`
tpr, fpr, base = 0.8, 0.2, 0.2
sel = tpr * base + fpr * (1 - base)
ppv = tpr * base / sel
print(round(sel, 2), round(ppv, 2))
`,
      expected: "0.32 0.5",
      explanation: "기저율 20%인 B 집단에 A와 같은 TPR 0.8, FPR 0.2를 적용하면 선택률은 $0.16 + 0.16 = 0.32$, 합격 추천자 중 실제 우수 인재 비율(PPV)은 $0.16 / 0.32 = 0.5$입니다. 기저율 50%인 A의 선택률 0.5·PPV 0.8과 달라, 균등화된 오즈를 맞춰도 인구통계 동등성과 예측 동등성은 깨집니다.",
    },
    {
      kind: "predict",
      id: "w8-drill-psi",
      tier: "core",
      sectionId: "mlops",
      code: py`
import numpy as np
p = np.array([0.5, 0.5])     # 학습 때 구간별 비율
q = np.array([0.4, 0.6])     # 운영 중 구간별 비율
print(round(float(np.sum((p - q) * np.log(p / q))), 3))
`,
      expected: "0.041",
      explanation: "$(0.1)\\ln(1.25) + (-0.1)\\ln(0.8\\overline{3}) = 0.0223 + 0.0182 \\approx 0.041$입니다. 두 항이 모두 양수인 것에 주목하십시오. 비율이 늘든 줄든 차이와 로그비의 부호가 같아 PSI는 항상 0 이상입니다.",
    },
    {
      kind: "predict",
      id: "w8-drill-bucket",
      tier: "core",
      sectionId: "llmops",
      code: py`
tokens, last, rate, cap = 2.0, 0.0, 1.0, 2.0
out = []
for now in [0, 0, 0, 0.5, 1.5]:
    tokens = min(cap, tokens + (now - last) * rate)
    last = now
    if tokens >= 1:
        tokens -= 1
        out.append("O")
    else:
        out.append("X")
print("".join(out))
`,
      expected: "OOXXO",
      explanation: "처음 허용량 2개로 0초의 두 요청을 받고 세 번째는 거부합니다. 0.5초에는 0.5개만 채워져 거부, 1.5초에는 1.5개가 되어 허용합니다. 몰아치는 요청은 capacity만큼만 받고, 이후에는 rate 속도로만 받아 주는 것이 토큰 버킷입니다.",
    },
    {
      kind: "predict",
      id: "w8-drill-ablation",
      tier: "core",
      sectionId: "research-methods",
      code: py`
full = 91.2
removed = {"A": 88.5, "B": 90.9, "C": 85.1}     # 각 구성요소를 뺐을 때 정확도
drops = {k: round(full - v, 1) for k, v in removed.items()}
print(drops, max(drops, key=drops.get))
`,
      expected: "{'A': 2.7, 'B': 0.3, 'C': 6.1} C",
      explanation: "절제 연구는 구성요소를 하나씩 뺐을 때 얼마나 떨어지는지로 기여도를 분리합니다. C를 뺐을 때 6.1%p로 가장 크게 떨어지므로 C의 기여가 가장 큽니다. B는 0.3%p뿐이라 시드에 따른 변동보다 작을 수 있으니, 여러 시드의 평균·표준편차와 함께 봐야 합니다.",
    },
    {
      kind: "descriptive",
      id: "w8-drill-policy-choice",
      tier: "core",
      sectionId: "fairness",
      question: "보정된 점수 모델을 기저율이 다른 두 집단에 쓸 때, 대출 심사와 암 선별 검사에서 각각 어떤 임계값 정책(같은 임계값 / 선택률 맞춤 / TPR 맞춤)을 택하겠습니까? 각 정책에서 누가 피해를 보는지를 근거로 설명하십시오.",
      modelAnswer:
        "암 선별 검사에서는 실제 환자를 놓치는 것(위음성)이 가장 큰 피해이므로, 집단과 무관하게 환자를 같은 비율로 찾아내는 TPR 맞춤(기회의 평등)을 우선합니다. 대신 기저율이 낮은 집단은 FPR이 올라가 정밀 검사를 받는 비환자가 늘어나는데, 추가 검사의 부담은 놓친 암보다 작다고 판단합니다. 대출 심사에서는 같은 점수가 같은 상환 확률을 뜻해야(보정·PPV) 대출 기관이 점수를 해석할 수 있으므로 같은 임계값을 쓰면, 기저율이 낮은 집단은 선택률과 TPR이 크게 낮아져 상환할 수 있는 사람도 대출을 못 받는 피해가 생깁니다. 이를 줄이려 선택률을 맞추면 그 집단의 PPV가 떨어져 상환 못 할 사람에게 빌려주는 위험(그리고 그 사람의 채무 부담)이 늘어납니다. 어느 쪽이든 피해자가 생기므로, 택한 기준과 피해를 보는 집단, 그 근거를 명시하고 정답 라벨 자체의 편향도 함께 점검해야 합니다.",
      keyPoints: ["암 선별: 위음성이 가장 큰 피해 → TPR 맞춤", "TPR 맞춤의 대가: 낮은 기저율 집단의 FPR 증가", "대출: 같은 임계값은 점수 의미(PPV)를 유지하지만 낮은 기저율 집단이 거의 선택되지 않음", "어떤 정책이든 피해 집단이 생기므로 선택과 근거를 명시"],
    },
    {
      kind: "descriptive",
      id: "w8-drill-out-of-scope",
      tier: "core",
      sectionId: "governance",
      question: "모델카드의 '의도하지 않은 용도(out_of_scope_use)' 항목이 비어 있으면 어떤 일이 생길 수 있는지, 이력서 스크리닝 모델을 예로 들어 설명하십시오.",
      modelAnswer:
        "의도하지 않은 용도는 모델을 쓰면 안 되는 상황을 문서로 못 박는 항목입니다. 이력서 스크리닝 모델은 담당자의 1차 검토를 돕는 참고 자료로 만들어졌는데, 이 항목이 비어 있으면 다른 팀이 이를 최종 합격·불합격 자동 결정이나 승진 평가, 성별·출신 추정에 그대로 가져다 쓸 수 있습니다. 모델은 그런 용도로 검증된 적이 없고, 과거 채용 데이터의 편향까지 학습했으므로 피해가 커집니다. 또 문제가 생겼을 때 '그렇게 쓰지 말라고 했는가'를 확인할 근거가 없어 책임 소재도 흐려집니다. 그래서 금지 용도를 구체적으로 적고, 그 용도에서는 성능이 보장되지 않는다는 점과 이유를 함께 밝혀야 합니다.",
      keyPoints: ["쓰면 안 되는 상황을 문서로 명시하는 항목", "비어 있으면 검증되지 않은 용도(자동 합격 결정 등)로 전용될 수 있다", "학습 데이터의 편향이 새 용도에서 더 큰 피해로 이어진다", "책임 소재와 사용 제한의 근거가 된다"],
    },
    {
      kind: "descriptive",
      id: "w8-drill-one-seed",
      tier: "core",
      sectionId: "research-methods",
      question: "캡스톤에서 \"제안 방법이 baseline보다 정확도가 0.4%p 높았다\"를 시드 하나의 결과로 보고했다. 이 주장의 문제와, 재현성·통계적 유의성 관점에서 무엇을 보완해야 하는지 적으십시오.",
      modelAnswer:
        "딥러닝 실험은 초기화와 데이터 분할·셔플 때문에 같은 방법도 시드마다 성능이 달라지므로, 0.4%p 차이는 시드 변동만으로도 충분히 생길 수 있습니다. 실습에서도 두 방법의 시드별 승자가 뒤섞였고 순열 검정 p값이 컸습니다. 재현성을 위해 시드와 설정을 고정·기록해 같은 결과를 다시 얻을 수 있게 하고, 유의성을 위해 같은 시드(같은 분할)로 두 방법을 여러 번 돌려 평균 ± 표준편차를 보고하며, 짝지은 검정(순열 검정 등)으로 차이가 우연으로 설명되는지 확인해야 합니다. 시드 5개만으로는 양측 정확 순열 검정의 p가 0.0625 아래로 내려갈 수 없으므로, 결론이 필요하면 시드를 더 늘리거나 차이가 작다는 사실 자체를 한계로 적습니다.",
      keyPoints: ["시드마다 성능이 달라 한 번의 결과는 우연일 수 있다", "재현성: 시드·설정을 고정하고 기록한다", "여러 시드의 평균 ± 표준편차와 짝지은 검정으로 유의성을 확인한다", "시드 수가 적으면 검정력에 한계가 있음을 밝힌다"],
    },
  ],

  assignment: {
    requirements: [
      "유형(A~D), 문제, 검증할 가설, 성공 기준(지표와 목표값), 데이터, 비교 기준(baseline)을 설계에 적는다.",
      "첫 코드 셀에서 시드를 고정해 출력하고, baseline과 제안 방법을 같은 조건(같은 시드·같은 분할)에서 비교한다. 방법별 시드 점수를 `results = {\"baseline\": [...], \"제안 방법\": [...]}`처럼 모아 평균 ± 표준편차를 보고한다.",
      "리포트(문제 정의 · 방법 · 실험 설정 · 결과 · 한계와 실패 사례 · 책임 있는 AI · 참고문헌)를 작성하고, 실패 사례는 실제 출력이나 그래프를 근거로 든다.",
      "모델카드 여섯 항목(의도된 용도, 의도하지 않은 용도, 데이터 출처, 집단별 또는 유형별 성능, 한계, 윤리적 고려)을 빠짐없이 채운다.",
      "10분 발표 개요와 예상 질문 세 가지에 대한 답을 준비하고, 성찰문과 AI 전체 지도를 정리한다.",
      "제출 전 실행 환경 초기화 후 전체 실행으로 모든 셀이 오류 없이 재현되는지 확인한다.",
    ],
    autoTests: [
      {
        id: "w8-at-seed",
        taskId: "code",
        title: "첫 셀에서 정수 SEED와 그 시드로 만든 난수 생성기 rng를 정의했다",
        code: py`
import numpy as np
assert isinstance(SEED, int), "첫 셀에서 SEED를 정수로 정하십시오."
assert isinstance(rng, np.random.Generator), "rng = np.random.default_rng(SEED)를 만드십시오."
`,
        hint: "「설정과 데이터 준비」 셀의 SEED·rng 줄을 지우지 말고 먼저 실행하십시오.",
      },
      {
        id: "w8-at-results",
        taskId: "code",
        title: "results: baseline 포함 2개 이상의 방법, 방법마다 같은 개수(3개 이상)의 시드 점수",
        code: py`
import math
assert isinstance(results, dict) and len(results) >= 2, "results = {'baseline': [...], '제안 방법': [...]}처럼 방법별 시드 점수 리스트를 모으십시오."
assert any("baseline" in str(k).lower() or "기준" in str(k) for k in results), "baseline(또는 '기준')이 들어간 키가 필요합니다."
lens = {k: len(v) for k, v in results.items()}
assert min(lens.values()) >= 3, f"방법마다 시드 3개 이상의 점수가 필요합니다: {lens}"
assert len(set(lens.values())) == 1, f"모든 방법을 같은 시드들로 비교하십시오: {lens}"
assert all(math.isfinite(float(x)) for v in results.values() for x in v), "점수에 숫자가 아닌 값이나 nan이 있습니다."
`,
        hint: "실험 셀 끝에서 `results = {\"baseline\": baseline_scores, \"제안 방법\": proposed_scores}`처럼 시드별 점수 리스트를 모읍니다. 이름은 자유지만 baseline 키는 하나 있어야 합니다.",
      },
    ],
    challenges: [
      {
        id: "w8-ch-adversarial-training",
        title: "적대적 학습으로 FGSM에 강한 분류기 만들기",
        tier: "advanced",
        prompt: `
숫자 3과 8을 구별하는 로지스틱 회귀를 NumPy 경사하강으로 직접 학습시키고, FGSM에 대한 강건성을 높입니다.

1. \`fgsm(w, b, X, y, eps)\`: 모델 $(w, b)$에 대한 FGSM 예제. $p = \\sigma(Xw + b)$, $x' = \\mathrm{clip}(x + \\varepsilon\\,\\mathrm{sign}((p - y)\\,w), 0, 1)$
2. \`train(X, y, adv_eps=0.0, epochs=300, lr=0.5, l2=1e-3)\`: 0에서 시작해 교차 엔트로피 + L2로 \`epochs\`번 경사하강하고 \`(w, b)\`를 돌려줍니다. \`adv_eps > 0\`이면 매 epoch마다 **현재 모델**로 만든 FGSM 예제를 원본과 함께 학습합니다(적대적 학습).
3. \`logit_shift(w, eps)\`: 클리핑이 없을 때 FGSM이 logit을 최대 얼마나 움직이는지. 선형 모델에서는 $\\varepsilon\\,\\lVert w \\rVert_1$입니다.

적대적 학습이 강건 정확도를 높이는 방식이 $\\lVert w \\rVert_1$과 어떤 관계인지 확인하십시오.
`,
        starter: ADV_DATA + py`

def fgsm(w, b, X, y, eps):
    return X  # TODO

def train(X, y, adv_eps=0.0, epochs=300, lr=0.5, l2=1e-3):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(epochs):
        Xb, yb = X, y
        # TODO: adv_eps > 0이면 현재 (w, b)로 만든 FGSM 예제를 원본에 이어 붙입니다.
        p = sig(Xb @ w + b)
        # TODO: w, b를 교차 엔트로피 + L2 기울기로 갱신합니다.
    return w, b

def logit_shift(w, eps):
    return 0.0  # TODO

for name, ae in [("일반 학습", 0.0), ("적대적 학습", 0.1)]:
    w, b = train(Xtr, ytr, adv_eps=ae)
    print(f"{name}: 깨끗한 정확도 {acc(w, b, Xte, yte):.3f}, ε=0.1 FGSM 정확도 {acc(w, b, fgsm(w, b, Xte, yte, 0.1), yte):.3f}, ‖w‖₁ = {np.abs(w).sum():.1f}")
`,
        tests: ADV_DATA + py`

@test("일반 학습: 깨끗한 정확도 0.97 이상, ε = 0.1 FGSM에서는 0.8 미만")
def _():
    w, b = train(Xtr, ytr)
    clean, robust = acc(w, b, Xte, yte), acc(w, b, fgsm(w, b, Xte, yte, 0.1), yte)
    assert clean >= 0.97 and robust < 0.8, (clean, robust)

@test("적대적 학습: 강건 정확도가 0.1 이상 오르고 깨끗한 정확도는 0.95 이상 유지")
def _():
    w0, b0 = train(Xtr, ytr)
    w1, b1 = train(Xtr, ytr, adv_eps=0.1)
    r0, r1 = acc(w0, b0, fgsm(w0, b0, Xte, yte, 0.1), yte), acc(w1, b1, fgsm(w1, b1, Xte, yte, 0.1), yte)
    assert r1 >= r0 + 0.1 and acc(w1, b1, Xte, yte) >= 0.95, (r0, r1)

@test("FGSM의 logit 변화 = ε‖w‖₁(클리핑 없을 때), 적대적 학습은 ‖w‖₁을 줄인다")
def _():
    rng = np.random.default_rng(3)
    w, b = rng.normal(size=64), 0.1
    x = np.full((1, 64), 0.5)
    xa = np.clip(x + 0.01 * np.sign((sig(x @ w + b) - 1.0)[:, None] * w), 0, 1)
    assert approx(abs((xa @ w - x @ w)[0]), logit_shift(w, 0.01)), (abs((xa @ w - x @ w)[0]), logit_shift(w, 0.01))
    w0, _ = train(Xtr, ytr)
    w1, _ = train(Xtr, ytr, adv_eps=0.1)
    assert np.abs(w1).sum() < np.abs(w0).sum(), (np.abs(w0).sum(), np.abs(w1).sum())
`,
        hints: [
          "`p = sig(X @ w + b)`, `return np.clip(X + eps * np.sign((p - y)[:, None] * w[None, :]), 0, 1)`",
          "적대적 학습은 `Xb = np.vstack([X, fgsm(w, b, X, y, adv_eps)])`, `yb = np.concatenate([y, y])`. 갱신은 `w -= lr * (Xb.T @ (p - yb) / len(yb) + l2 * w)`, `b -= lr * np.mean(p - yb)`",
          "FGSM은 모든 픽셀을 $\\varepsilon$씩 $w$의 부호 방향으로 밀므로 logit 변화는 $\\sum_j \\varepsilon |w_j| = \\varepsilon\\,\\lVert w \\rVert_1$입니다. 적대적 학습은 이 최악의 변화를 견디도록 $\\lVert w \\rVert_1$을 줄이는 쪽으로 학습됩니다.",
        ],
        solution: ADV_DATA + py`

def fgsm(w, b, X, y, eps):
    p = sig(X @ w + b)
    return np.clip(X + eps * np.sign((p - y)[:, None] * w[None, :]), 0, 1)

def train(X, y, adv_eps=0.0, epochs=300, lr=0.5, l2=1e-3):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(epochs):
        Xb, yb = X, y
        if adv_eps > 0:
            Xb = np.vstack([X, fgsm(w, b, X, y, adv_eps)])
            yb = np.concatenate([y, y])
        p = sig(Xb @ w + b)
        w = w - lr * (Xb.T @ (p - yb) / len(yb) + l2 * w)
        b = b - lr * np.mean(p - yb)
    return w, b

def logit_shift(w, eps):
    return eps * float(np.abs(w).sum())

for name, ae in [("일반 학습", 0.0), ("적대적 학습", 0.1)]:
    w, b = train(Xtr, ytr, adv_eps=ae)
    print(f"{name}: 깨끗한 정확도 {acc(w, b, Xte, yte):.3f}, ε=0.1 FGSM 정확도 {acc(w, b, fgsm(w, b, Xte, yte, 0.1), yte):.3f}, ‖w‖₁ = {np.abs(w).sum():.1f}")
`,
      },
      {
        id: "w8-ch-bootstrap",
        title: "부트스트랩 신뢰구간으로 캡스톤 결과의 불확실성 보고하기",
        tier: "advanced",
        prompt: `
캡스톤 리포트의 "정확도 0.75"에는 얼마만큼의 불확실성이 있을까요? 문항별 정답 여부(0/1)를 복원추출로 다시 뽑는 **부트스트랩**으로 신뢰구간을 구합니다.

1. \`bootstrap_ci(correct, n_boot=2000, alpha=0.05, seed=0)\`: 문항 인덱스를 \`len(correct)\`개 복원추출해 평균을 \`n_boot\`번 구하고, 백분위수 $100\\cdot\\alpha/2$, $100\\cdot(1-\\alpha/2)$로 \`(lo, hi)\`를 돌려줍니다.
2. \`paired_bootstrap_diff(v1, v2, n_boot=2000, alpha=0.05, seed=0)\`: 두 시스템이 같은 문항을 풀었으므로 **같은 인덱스**로 함께 복원추출해 정확도 차이(v2 − v1)의 \`(관측 차이, lo, hi)\`를 돌려줍니다.

7주차 회귀 테스트의 0.75 → 0.85가 20문항으로는 확신할 수 없는 차이라는 것을 신뢰구간으로 확인합니다.
`,
        starter: BOOT_DATA + py`

def bootstrap_ci(correct, n_boot=2000, alpha=0.05, seed=0):
    m = float(np.mean(correct))
    return m, m  # TODO

def paired_bootstrap_diff(v1, v2, n_boot=2000, alpha=0.05, seed=0):
    d = float(np.mean(v2) - np.mean(v1))
    return d, d, d  # TODO: 같은 인덱스로 v1, v2를 함께 뽑습니다.

print("v1 정확도 95% CI:", np.round(bootstrap_ci(v1), 3))
print("v2 - v1 차이와 95% CI:", np.round(paired_bootstrap_diff(v1, v2), 3))
`,
        tests: BOOT_DATA + py`

@test("20문항 정확도 0.75의 95% CI는 0.75를 포함하고 폭이 0.25 이상")
def _():
    lo, hi = bootstrap_ci(v1)
    assert lo < 0.75 < hi and hi - lo > 0.25, (lo, hi)

@test("문항이 2,000개면 같은 정확도라도 CI 폭이 0.06 미만")
def _():
    big = np.tile(v1, 100)
    lo, hi = bootstrap_ci(big)
    assert lo < 0.75 < hi and hi - lo < 0.06, (lo, hi)

@test("같은 시드면 같은 구간(재현성)")
def _():
    assert tuple(bootstrap_ci(v1, seed=5)) == tuple(bootstrap_ci(v1, seed=5))

@test("v1 → v2 차이 0.10의 95% CI는 0을 포함하고, 200문항에서 30개 개선·2개 회귀면 0을 넘는다")
def _():
    d, lo, hi = paired_bootstrap_diff(v1, v2)
    assert approx(d, 0.10) and lo < 0 < hi, (d, lo, hi)
    a = np.array([0] * 30 + [1] * 2 + [1] * 150 + [0] * 18)
    b = np.array([1] * 30 + [0] * 2 + [1] * 150 + [0] * 18)
    d2, lo2, hi2 = paired_bootstrap_diff(a, b)
    assert approx(d2, 0.14) and lo2 > 0, (d2, lo2, hi2)
`,
        hints: [
          "`rng = np.random.default_rng(seed)`, `idx = rng.integers(0, n, size=(n_boot, n))`, `means = np.asarray(correct)[idx].mean(axis=1)`",
          "`lo, hi = np.percentile(means, [100 * alpha / 2, 100 * (1 - alpha / 2)])`",
          "짝지은 부트스트랩은 같은 `idx`로 `np.asarray(v2)[idx].mean(axis=1) - np.asarray(v1)[idx].mean(axis=1)`을 구합니다. 문항 난이도를 공유하므로 두 시스템을 따로 뽑을 때보다 구간이 좁아집니다.",
        ],
        solution: BOOT_DATA + py`

def bootstrap_ci(correct, n_boot=2000, alpha=0.05, seed=0):
    correct = np.asarray(correct)
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(correct), size=(n_boot, len(correct)))
    means = correct[idx].mean(axis=1)
    lo, hi = np.percentile(means, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(lo), float(hi)

def paired_bootstrap_diff(v1, v2, n_boot=2000, alpha=0.05, seed=0):
    v1, v2 = np.asarray(v1), np.asarray(v2)
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(v1), size=(n_boot, len(v1)))
    diffs = v2[idx].mean(axis=1) - v1[idx].mean(axis=1)
    lo, hi = np.percentile(diffs, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(v2.mean() - v1.mean()), float(lo), float(hi)

print("v1 정확도 95% CI:", np.round(bootstrap_ci(v1), 3))
print("v2 - v1 차이와 95% CI:", np.round(paired_bootstrap_diff(v1, v2), 3))
`,
      },
    ],
  },
};

export default week8;
