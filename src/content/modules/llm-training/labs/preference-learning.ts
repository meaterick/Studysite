import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "DPO 손실과 KL 페널티 아래의 최적 정책",
    prompt: md`

1. \`dpo_loss(lw, lw_ref, ll, ll_ref, beta)\` $= -\log\sigma\big(\beta[(\log\pi_\theta(y_w) - \log\pi_{ref}(y_w)) - (\log\pi_\theta(y_l) - \log\pi_{ref}(y_l))]\big)$
2. \`optimal_policy(pi_ref, r, beta)\`: $E[r] - \beta\,\mathrm{KL}(\pi \parallel \pi_{ref})$를 최대화하는 정책 $\pi^*(y) \propto \pi_{ref}(y)\,e^{r(y)/\beta}$ (합이 1이 되도록 정규화)
3. \`kl(p, q)\` $= \sum p \log(p/q)$

본문 예제($\beta = 0.1$, 로그확률 비율 차이 1.5)의 손실은 약 0.62입니다. $\beta$가 작을수록 정책이 보상 1등 응답에 몰리고, 클수록 기준 모델 근처에 머무는지 확인합니다.
`,
    starter: py`
import numpy as np

def dpo_loss(lw, lw_ref, ll, ll_ref, beta=0.1):
    return 0.0  # TODO

def optimal_policy(pi_ref, r, beta):
    return pi_ref  # TODO

def kl(p, q):
    return 0.0  # TODO

print(dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1))
pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
r = np.array([1.75, 0.75, -0.25, -2.25])
for b in (0.1, 1.0, 5.0):
    p = optimal_policy(pi_ref, r, b)
    print(b, np.round(p, 3), round(float(kl(p, pi_ref)), 3))
`,
    tests: py`
import numpy as np
pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
r = np.array([1.75, 0.75, -0.25, -2.25])

@test("본문 예제: DPO 손실 ≈ 0.620")
def _():
    assert approx(dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1), -np.log(1 / (1 + np.exp(-0.15)))), f"결과: {dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1)}"

@test("비율 차이가 커질수록 손실이 줄고, 0이면 ln 2")
def _():
    assert approx(dpo_loss(0, 0, 0, 0, 0.1), np.log(2)) and dpo_loss(-1, -3, -3, -1, 0.1) < dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1)

@test("최적 정책은 확률분포이고, 보상 순서대로 확률이 커진다(β=1)")
def _():
    p = optimal_policy(pi_ref, r, 1.0)
    assert approx(p.sum(), 1.0) and p[0] > p[1] > p[2] > p[3]

@test("β가 작을수록 KL이 크고(1등에 몰림), 클수록 기준 모델에 가깝다")
def _():
    p_small, p_big = optimal_policy(pi_ref, r, 0.1), optimal_policy(pi_ref, r, 5.0)
    assert p_small[0] > 0.99 and kl(p_small, pi_ref) > 1.0 and kl(p_big, pi_ref) < 0.05, f"{np.round(p_small, 3)}, KL {kl(p_small, pi_ref):.3f} / {kl(p_big, pi_ref):.3f}"

@test("같은 분포의 KL = 0")
def _():
    assert approx(kl(pi_ref, pi_ref), 0.0)
`,
    hints: ["`z = beta * ((lw - lw_ref) - (ll - ll_ref))`, 손실은 `-np.log(1 / (1 + np.exp(-z)))`", "`p = pi_ref * np.exp(r / beta)`, `p / p.sum()`. $\\beta$가 작으면 지수가 커져 보상 차이가 극단적으로 증폭됩니다.", "`np.sum(p * np.log(p / q))`"],
    solution: py`
import numpy as np

def dpo_loss(lw, lw_ref, ll, ll_ref, beta=0.1):
    z = beta * ((lw - lw_ref) - (ll - ll_ref))
    return float(-np.log(1 / (1 + np.exp(-z))))

def optimal_policy(pi_ref, r, beta):
    p = pi_ref * np.exp(r / beta)
    return p / p.sum()

def kl(p, q):
    return float(np.sum(p * np.log(p / q)))

print(dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1))
pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
r = np.array([1.75, 0.75, -0.25, -2.25])
for b in (0.1, 1.0, 5.0):
    p = optimal_policy(pi_ref, r, b)
    print(b, np.round(p, 3), round(float(kl(p, pi_ref)), 3))
`,
  },
]);
