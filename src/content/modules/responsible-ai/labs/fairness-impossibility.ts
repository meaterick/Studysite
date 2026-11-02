import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "Chouldechova 항등식, 보정이 강제하는 균형, 균등화된 오즈를 맞추는 무작위 혼합",
    prompt: md`

「공정성 불가능성 정리」의 세 결과를 함수로 만들고, 보정된 점수 모델(\`sA, yA\`: 기저율 약 0.5, \`sB, yB\`: 약 0.2)에서 확인합니다.

1. \`fpr_from(p, ppv, fnr)\`: Chouldechova 항등식 $\text{FPR} = \frac{p}{1-p}\cdot\frac{1-\text{PPV}}{\text{PPV}}\cdot(1-\text{FNR})$.
2. \`balance_z(p, x)\`: 점수가 보정되어 있을 때, 기저율 $p$와 양성의 평균 점수 $x$가 강제하는 음성의 평균 점수 $z = \frac{p}{1-p}(1-x)$.
3. \`mix_lambda(t_hi, t_lo, f)\`: 같은 FPR $f$에서 TPR이 $t_\text{hi}$인 규칙과 "확률 $f$로 무작위 합격"을 섞어 TPR을 $t_\text{lo}$로 만드는 확률 $\lambda = (t_\text{lo} - f)/(t_\text{hi} - f)$.
4. \`equalize(s, y, f, t_lo, rng)\`: 실제 음성 중 비율 $f$가 임계값 이상이 되도록 정한 임계값 \`t = np.quantile(s[y == 0], 1 - f)\`의 TPR을 $t_\text{hi}$로 두고, 표본마다 확률 $\lambda$로는 \`s >= t\`, 나머지는 \`rng.random() < f\`로 판정한 불리언 배열을 돌려줍니다.
`,
    starter: py`
import numpy as np
rng = np.random.default_rng(0)
def make_group(n, a, b):
    s = rng.beta(a, b, n)
    return s, (rng.random(n) < s).astype(int)      # 보정된 점수: 점수 = 실제로 양성일 확률
sA, yA = make_group(20000, 5, 5)
sB, yB = make_group(20000, 2, 8)

def fpr_from(p, ppv, fnr):
    return 0.0  # TODO

def balance_z(p, x):
    return 0.0  # TODO

def mix_lambda(t_hi, t_lo, f):
    return 1.0  # TODO

def equalize(s, y, f, t_lo, rng):
    t = np.quantile(s[y == 0], 1 - f)
    return s >= t  # TODO: 확률 λ로만 이 규칙, 나머지는 확률 f로 무작위 합격

print(fpr_from(0.2, 0.8, 0.2))
print(yB.mean(), sB[yB == 1].mean(), sB[yB == 0].mean(), balance_z(yB.mean(), sB[yB == 1].mean()))
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(0)
def make_group(n, a, b):
    s = rng.beta(a, b, n)
    return s, (rng.random(n) < s).astype(int)
sA, yA = make_group(20000, 5, 5)
sB, yB = make_group(20000, 2, 8)

@test("항등식: PPV 0.8·FNR 0.2면 기저율 0.5는 FPR 0.2, 기저율 0.2는 0.05")
def _():
    assert approx(fpr_from(0.5, 0.8, 0.2), 0.2) and approx(fpr_from(0.2, 0.8, 0.2), 0.05), (fpr_from(0.5, 0.8, 0.2), fpr_from(0.2, 0.8, 0.2))
    pred = sA >= 0.4
    tp, fp, fn = np.sum(pred & (yA == 1)), np.sum(pred & (yA == 0)), np.sum(~pred & (yA == 1))
    assert approx(fpr_from(yA.mean(), tp / (tp + fp), fn / (tp + fn)), fp / np.sum(yA == 0)), "실제 분류 결과에서도 항등식이 성립해야 합니다."

@test("보정된 점수에서 음성의 평균 점수 z = p(1-x)/(1-p)")
def _():
    for s, y in [(sA, yA), (sB, yB)]:
        p, x, z = y.mean(), s[y == 1].mean(), s[y == 0].mean()
        assert abs(balance_z(p, x) - z) < 0.01, (balance_z(p, x), z)
    assert approx(balance_z(0.5, 0.6), 0.4) and approx(balance_z(0.2, 0.6), 0.1), "x가 같아도 기저율이 다르면 z가 달라져야 합니다."

@test("섞는 확률 λ = (t_lo - f)/(t_hi - f)")
def _():
    assert approx(mix_lambda(0.471, 0.410, 0.2), (0.410 - 0.2) / (0.471 - 0.2)) and approx(mix_lambda(0.5, 0.5, 0.2), 1.0)

@test("무작위 혼합으로 B의 (FPR, TPR)이 A와 같아진다")
def _():
    f = 0.2
    tA = np.mean(sA[yA == 1] >= np.quantile(sA[yA == 0], 1 - f))
    pred = equalize(sB, yB, f, tA, np.random.default_rng(1))
    assert pred.dtype == bool and len(pred) == len(sB)
    assert abs(np.mean(pred[yB == 0]) - f) < 0.01 and abs(np.mean(pred[yB == 1]) - tA) < 0.025, (np.mean(pred[yB == 0]), np.mean(pred[yB == 1]), tA)
`,
    hints: ["`fpr_from`은 `p / (1 - p) * (1 - ppv) / ppv * (1 - fnr)`, `balance_z`는 `p * (1 - x) / (1 - p)`, `mix_lambda`는 `(t_lo - f) / (t_hi - f)`. 보정은 $E[Y(1-s)] = E[s(1-Y)] = E[s(1-s)]$에서 나온 등식입니다.", "`equalize`에서는 먼저 `t_hi = np.mean(s[y == 1] >= t)`로 그 규칙의 TPR을 구하고 `lam = mix_lambda(t_hi, t_lo, f)`를 계산합니다.", "`use_rule = rng.random(len(s)) < lam`, `return np.where(use_rule, s >= t, rng.random(len(s)) < f)`. 섞은 규칙의 FPR은 $\\lambda f + (1-\\lambda) f = f$로 그대로이고, TPR만 $\\lambda t_\\text{hi} + (1-\\lambda) f$로 내려갑니다."],
    solution: py`
import numpy as np
rng = np.random.default_rng(0)
def make_group(n, a, b):
    s = rng.beta(a, b, n)
    return s, (rng.random(n) < s).astype(int)
sA, yA = make_group(20000, 5, 5)
sB, yB = make_group(20000, 2, 8)

def fpr_from(p, ppv, fnr):
    return p / (1 - p) * (1 - ppv) / ppv * (1 - fnr)

def balance_z(p, x):
    return p * (1 - x) / (1 - p)

def mix_lambda(t_hi, t_lo, f):
    return (t_lo - f) / (t_hi - f)

def equalize(s, y, f, t_lo, rng):
    t = np.quantile(s[y == 0], 1 - f)
    t_hi = np.mean(s[y == 1] >= t)
    lam = mix_lambda(t_hi, t_lo, f)
    use_rule = rng.random(len(s)) < lam
    return np.where(use_rule, s >= t, rng.random(len(s)) < f)

print(fpr_from(0.2, 0.8, 0.2))
print(yB.mean(), sB[yB == 1].mean(), sB[yB == 0].mean(), balance_z(yB.mean(), sB[yB == 1].mean()))
`,
  },
]);
