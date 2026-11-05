import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "PSI로 드리프트 경보를 만들고 카나리 배포 판정하기",
    prompt: md`
본문의 드리프트 감지와 카나리 배포를 구현합니다.

1. \`psi(train, prod, bins=10)\`: 학습 데이터의 분위수로 구간을 나누고(양 끝은 $\pm\infty$), 구간별 비율 $p_i$(학습), $q_i$(운영)로 $\text{PSI} = \sum_i (p_i - q_i)\ln(p_i / q_i)$. 비어 있는 구간 때문에 $\ln 0$이 나오지 않도록 비율을 $10^{-6}$ 이상으로 자릅니다.
2. \`drift_flag(v)\`: 0.1 미만 \`"안정"\`, 0.2 미만 \`"관찰 필요"\`, 그 이상 \`"재학습 검토"\`.
3. \`canary_decision(err_new, n_new, err_old, n_old, tolerance=0.005)\`: 오류 건수와 요청 수로 두 오류율을 구해, 새 모델 오류율이 기존 + \`tolerance\` 이하면 \`"확대"\`, 아니면 \`"롤백"\`.
`,
    starter: py`
import numpy as np
rng = np.random.default_rng(0)
train = rng.normal(35, 8, 10000)                 # 학습 당시 사용자 나이 분포
prods = {
    "같은 분포": rng.normal(35, 8, 3000),
    "평균 +2세": rng.normal(37, 8, 3000),
    "평균 +3세": rng.normal(38, 8, 3000),
    "평균 +6세": rng.normal(41, 8, 3000),
}

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
    tests: py`
import numpy as np
rng = np.random.default_rng(0)
train = rng.normal(35, 8, 10000)                 # 학습 당시 사용자 나이 분포
prods = {
    "같은 분포": rng.normal(35, 8, 3000),
    "평균 +2세": rng.normal(37, 8, 3000),
    "평균 +3세": rng.normal(38, 8, 3000),
    "평균 +6세": rng.normal(41, 8, 3000),
}

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
    hints: ["`edges = np.quantile(train, np.linspace(0, 1, bins + 1))` 다음 `edges[0], edges[-1] = -np.inf, np.inf`. 비율은 `np.histogram(train, edges)[0] / len(train)`", "`p, q = np.clip(p, 1e-6, None), np.clip(q, 1e-6, None)` 다음 `np.sum((p - q) * np.log(p / q))`", "카나리는 `err_new / n_new <= err_old / n_old + tolerance`이면 확대입니다. 26/1000 = 0.026은 0.02 + 0.005를 넘습니다. 부동소수점 비교라 경계에서는 작은 여유(`+ 1e-12`)를 두면 안전합니다."],
    solution: py`
import numpy as np
rng = np.random.default_rng(0)
train = rng.normal(35, 8, 10000)                 # 학습 당시 사용자 나이 분포
prods = {
    "같은 분포": rng.normal(35, 8, 3000),
    "평균 +2세": rng.normal(37, 8, 3000),
    "평균 +3세": rng.normal(38, 8, 3000),
    "평균 +6세": rng.normal(41, 8, 3000),
}

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
]);
