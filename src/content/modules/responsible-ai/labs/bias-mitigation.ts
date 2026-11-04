import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "재가중으로 집단과 정답의 연관 끊기, 대리 변수 찾기",
    prompt: md`
본문의 전처리(재가중)와 대리 변수 점검을 직접 구현합니다. \`g\`는 표본마다의 집단(\`"A"\`/\`"B"\`), \`y\`는 정답(0/1)입니다.

1. \`kc_weights(g, y)\`: Kamiran–Calders 재가중. 집단 $g$, 정답 $y$인 표본의 가중치는 $P(G=g)P(Y=y)/P(G=g, Y=y)$입니다. 표본마다 가중치를 담은 배열을 돌려줍니다.
2. \`weighted_rate(y, w, mask)\`: \`mask\`에 해당하는 표본들의 가중 양성 비율 $\sum w_i y_i / \sum w_i$.
3. \`proxy_strength(feature, g)\`: 특성 하나로 집단을 얼마나 잘 알아낼 수 있는지. 특성과 "A 집단 여부"(1/0) 사이의 상관계수의 절댓값을 돌려줍니다. 1에 가까울수록 강한 대리 변수입니다.
`,
    starter: py`
import numpy as np

def kc_weights(g, y):
    return np.ones(len(y))  # TODO: P(g)·P(y) / P(g, y)

def weighted_rate(y, w, mask):
    return 0.0  # TODO

def proxy_strength(feature, g):
    return 0.0  # TODO: |corr(feature, g == "A")|

g = np.array(["A"] * 10 + ["B"] * 10)
y = np.array([1] * 7 + [0] * 3 + [1] * 3 + [0] * 7)
w = kc_weights(g, y)
print(np.round(w, 3))
print(weighted_rate(y, w, g == "A"), weighted_rate(y, w, g == "B"))
`,
    tests: py`
import numpy as np
g = np.array(["A"] * 10 + ["B"] * 10)
y = np.array([1] * 7 + [0] * 3 + [1] * 3 + [0] * 7)

@test("가중치: A의 합격·B의 불합격은 5/7, A의 불합격·B의 합격은 5/3")
def _():
    w = kc_weights(g, y)
    assert approx(w[0], 5 / 7) and approx(w[7], 5 / 3) and approx(w[10], 5 / 3) and approx(w[13], 5 / 7), np.round(w, 4)
    assert approx(w.sum(), len(y)), "가중치의 합은 표본 수와 같아야 합니다."

@test("가중 후에는 두 집단의 양성 비율이 같다(집단과 정답이 독립)")
def _():
    w = kc_weights(g, y)
    assert approx(weighted_rate(y, w, g == "A"), 0.5) and approx(weighted_rate(y, w, g == "B"), 0.5)
    assert approx(weighted_rate(y, np.ones(len(y)), g == "A"), 0.7), "가중치가 모두 1이면 원래 비율이어야 합니다."

@test("집단이 셋 이상이어도 가중 양성 비율이 전체 비율과 같아진다")
def _():
    rng = np.random.default_rng(0)
    g3 = rng.choice(["A", "B", "C"], size=600, p=[0.5, 0.3, 0.2])
    y3 = (rng.random(600) < np.where(g3 == "A", 0.7, np.where(g3 == "B", 0.4, 0.2))).astype(int)
    w3 = kc_weights(g3, y3)
    for k in "ABC":
        assert approx(weighted_rate(y3, w3, g3 == k), y3.mean(), 1e-9), (k, weighted_rate(y3, w3, g3 == k), y3.mean())

@test("대리 변수 찾기: 집단과 강하게 상관된 특성은 크게, 무관한 특성은 작게")
def _():
    rng = np.random.default_rng(0)
    grp = rng.choice(["A", "B"], size=2000)
    zipcode = (grp == "A") + 0.3 * rng.normal(size=2000)
    noise = rng.normal(size=2000)
    assert proxy_strength(zipcode, grp) > 0.8 and proxy_strength(noise, grp) < 0.1, (proxy_strength(zipcode, grp), proxy_strength(noise, grp))
`,
    hints: ["집단 값 `gv`와 정답 값 `yv`의 모든 조합에 대해 `m = (g == gv) & (y == yv)`를 만들고 `w[m] = np.mean(g == gv) * np.mean(y == yv) / np.mean(m)`. 조합이 하나도 없으면 건너뜁니다.", "`weighted_rate`는 `np.sum(w[mask] * y[mask]) / np.sum(w[mask])`. 가중치를 적용한 데이터에서는 $P_w(Y=1 \\mid G=g) = P(Y=1)$이 되어 집단과 정답이 독립이 됩니다.", "`abs(np.corrcoef(feature, (g == \"A\").astype(float))[0, 1])`. 보호 속성 열을 지워도 이 값이 큰 특성이 남아 있으면 모델이 집단을 다시 알아낼 수 있습니다."],
    solution: py`
import numpy as np

def kc_weights(g, y):
    g, y = np.asarray(g), np.asarray(y)
    w = np.empty(len(y))
    for gv in np.unique(g):
        for yv in np.unique(y):
            m = (g == gv) & (y == yv)
            if m.any():
                w[m] = np.mean(g == gv) * np.mean(y == yv) / np.mean(m)
    return w

def weighted_rate(y, w, mask):
    y, w, mask = np.asarray(y), np.asarray(w), np.asarray(mask)
    return float(np.sum(w[mask] * y[mask]) / np.sum(w[mask]))

def proxy_strength(feature, g):
    return float(abs(np.corrcoef(feature, (np.asarray(g) == "A").astype(float))[0, 1]))

g = np.array(["A"] * 10 + ["B"] * 10)
y = np.array([1] * 7 + [0] * 3 + [1] * 3 + [0] * 7)
w = kc_weights(g, y)
print(np.round(w, 3))
print(weighted_rate(y, w, g == "A"), weighted_rate(y, w, g == "B"))
`,
  },
  {
    key: "ex2",
    title: "보정된 점수에서 세 가지 임계값 정책 비교하기",
    prompt: md`
본문의 후처리(집단별 임계값)를 직접 적용합니다. [[lesson:fairness]]에서처럼, 점수 $s$를 받은 사람이 정확히 확률 $s$로 우수 인재인 **보정된** 모델을 기저율이 다른 두 집단(약 50% vs 20%)에 적용합니다.

1. \`rates(s, y, t)\`: 임계값 \`t\` 이상을 합격 추천했을 때의 \`{"sel", "tpr", "fpr", "ppv"}\`.
2. \`threshold_for_rate(s, rate)\`: 점수가 임계값 이상인 비율이 \`rate\`가 되는 임계값(분위수).
3. \`threshold_for_tpr(s, y, tpr)\`: 실제 양성(\`y == 1\`) 중 \`tpr\` 비율이 임계값 이상이 되는 임계값.

세 정책(① 같은 임계값 0.5, ② B의 선택률을 A와 같게, ③ B의 TPR을 A와 같게) 중 어느 것도 네 지표를 모두 같게 만들지 못하는 것을 확인합니다.
`,
    starter: py`
import numpy as np
rng = np.random.default_rng(0)

# 보정된 점수 모델: 점수 s를 받은 사람은 정확히 확률 s로 실제 우수(Y=1)
def make_group(n, a, b):
    s = rng.beta(a, b, n)
    y = (rng.random(n) < s).astype(int)
    return s, y
sA, yA = make_group(20000, 5, 5)    # 기저율 약 50%
sB, yB = make_group(20000, 2, 8)    # 기저율 약 20%

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
    tests: py`
import numpy as np
rng = np.random.default_rng(0)

# 보정된 점수 모델: 점수 s를 받은 사람은 정확히 확률 s로 실제 우수(Y=1)
def make_group(n, a, b):
    s = rng.beta(a, b, n)
    y = (rng.random(n) < s).astype(int)
    return s, y
sA, yA = make_group(20000, 5, 5)    # 기저율 약 50%
sB, yB = make_group(20000, 2, 8)    # 기저율 약 20%

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
    hints: ["`pred = s >= t`일 때 `sel = pred.mean()`, `tpr = pred[y == 1].mean()`, `fpr = pred[y == 0].mean()`, `ppv = y[pred].mean()`", "점수 상위 `rate` 비율을 고르려면 아래에서 `1 - rate` 분위수가 임계값입니다: `np.quantile(s, 1 - rate)`. TPR 맞춤은 같은 계산을 실제 양성의 점수 `s[y == 1]`에만 합니다.", "보정된 모델에 같은 임계값을 쓰면 '같은 점수 = 같은 의미'(PPV가 비슷)가 유지되지만, 기저율이 낮은 B는 점수 자체가 낮아 거의 선택되지 않습니다. 선택률이나 TPR을 맞추려고 B의 임계값을 낮추면 B의 합격 추천에 비우수자가 많이 섞여 PPV가 떨어집니다."],
    solution: py`
import numpy as np
rng = np.random.default_rng(0)

# 보정된 점수 모델: 점수 s를 받은 사람은 정확히 확률 s로 실제 우수(Y=1)
def make_group(n, a, b):
    s = rng.beta(a, b, n)
    y = (rng.random(n) < s).astype(int)
    return s, y
sA, yA = make_group(20000, 5, 5)    # 기저율 약 50%
sB, yB = make_group(20000, 2, 8)    # 기저율 약 20%

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
]);
