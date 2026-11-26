import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "PSI = 양방향 KL, 드리프트 없을 때의 PSI, 다중 검사, BBSE",
    prompt: md`
「드리프트 감지의 통계」의 계산을 직접 구현합니다.

1. \`psi_parts(p, q)\`: 구간 비율 배열 \`p\`(학습), \`q\`(운영)로 \`(PSI, KL(p‖q), KL(q‖p))\`를 돌려줍니다. 비율은 모두 0보다 크다고 가정합니다.
2. \`null_psi(bins, n, m)\`: 드리프트가 없을 때 PSI의 근사 기댓값 $(B - 1)(1/n + 1/m)$.
3. \`familywise(alpha, k)\`: 서로 독립인 검사 $k$개를 각각 유의수준 $\alpha$로 할 때, 변화가 없어도 경보가 하나 이상 울릴 확률 $1 - (1-\alpha)^k$.
4. \`bbse_binary(mu, tpr, fpr)\`: 운영 데이터의 예측 양성 비율 $\mu$와 검증 데이터에서 잰 TPR·FPR로 새 양성 비율 $q = (\mu - \text{FPR})/(\text{TPR} - \text{FPR})$를 추정하고, 표본 오차로 범위를 벗어나면 $[0, 1]$로 자릅니다.
`,
    starter: py`
import numpy as np

def psi_parts(p, q):
    return 0.0, 0.0, 0.0  # TODO

def null_psi(bins, n, m):
    return 0.0  # TODO

def familywise(alpha, k):
    return alpha  # TODO

def bbse_binary(mu, tpr, fpr):
    return mu  # TODO: (μ - FPR)/(TPR - FPR)를 [0, 1]로

print(psi_parts([0.5, 0.3, 0.2], [0.3, 0.3, 0.4]))
print(null_psi(10, 10000, 100), familywise(0.05, 50))
print(bbse_binary(0.246, 0.85, 0.10))
`,
    tests: py`
import numpy as np

@test("PSI는 두 방향 KL의 합")
def _():
    psi, kpq, kqp = psi_parts([0.5, 0.3, 0.2], [0.3, 0.3, 0.4])
    assert approx([psi, kpq, kqp], [0.240795, 0.116783, 0.124011], 1e-5), (psi, kpq, kqp)
    rng = np.random.default_rng(0)
    p, q = rng.dirichlet(np.ones(8)), rng.dirichlet(np.ones(8))
    a, b, c = psi_parts(p, q)
    assert approx(a, b + c) and approx(psi_parts(q, p)[0], a), "PSI는 대칭이고 두 KL의 합이어야 합니다."

@test("드리프트 없을 때의 PSI 근사와 다중 검사의 경보 확률")
def _():
    assert approx(null_psi(10, 10000, 100), 0.0909) and approx(null_psi(10, 10000, 3000), 0.0039, 1e-4)
    assert approx(familywise(0.05, 50), 0.923055, 1e-5) and approx(familywise(0.05 / 50, 50), 0.04881, 1e-4)

@test("BBSE: 예측 양성 비율 0.246 → 실제 양성 비율 약 0.195, 범위 밖은 자르기")
def _():
    assert approx(bbse_binary(0.246, 0.85, 0.10), 0.194667, 1e-5), bbse_binary(0.246, 0.85, 0.10)
    assert bbse_binary(0.05, 0.85, 0.10) == 0.0 and bbse_binary(0.95, 0.85, 0.10) == 1.0

@test("시뮬레이션: 양성 비율이 0.5에서 0.2로 바뀐 운영 데이터")
def _():
    rng = np.random.default_rng(3)
    y = rng.random(20000) < 0.2
    pred = np.where(y, rng.random(20000) < 0.85, rng.random(20000) < 0.10)
    est = bbse_binary(pred.mean(), 0.85, 0.10)
    assert abs(est - y.mean()) < 0.01 and abs(pred.mean() - y.mean()) > 0.03, (est, y.mean(), pred.mean())
`,
    hints: ["`p, q = np.asarray(p, float), np.asarray(q, float)` 다음 `np.sum((p - q) * np.log(p / q))`, `np.sum(p * np.log(p / q))`, `np.sum(q * np.log(q / p))`. 첫째가 나머지 둘의 합이 되는지 확인하십시오.", "`null_psi`는 `(bins - 1) * (1 / n + 1 / m)`, `familywise`는 `1 - (1 - alpha) ** k`. 본페로니 보정(`alpha / k`)을 넣으면 경보 확률이 원래의 `alpha` 근처로 돌아옵니다.", "`min(1.0, max(0.0, (mu - fpr) / (tpr - fpr)))`. $\\mu = \\text{TPR}\\,q + \\text{FPR}(1-q)$를 $q$에 대해 푼 것으로, [[lesson:eval-statistics]]의 채점관 보정과 같은 식입니다."],
    solution: py`
import numpy as np

def psi_parts(p, q):
    p, q = np.asarray(p, float), np.asarray(q, float)
    return (float(np.sum((p - q) * np.log(p / q))), float(np.sum(p * np.log(p / q))), float(np.sum(q * np.log(q / p))))

def null_psi(bins, n, m):
    return (bins - 1) * (1 / n + 1 / m)

def familywise(alpha, k):
    return 1 - (1 - alpha) ** k

def bbse_binary(mu, tpr, fpr):
    return min(1.0, max(0.0, (mu - fpr) / (tpr - fpr)))

print(psi_parts([0.5, 0.3, 0.2], [0.3, 0.3, 0.4]))
print(null_psi(10, 10000, 100), familywise(0.05, 50))
print(bbse_binary(0.246, 0.85, 0.10))
`,
  },
]);
