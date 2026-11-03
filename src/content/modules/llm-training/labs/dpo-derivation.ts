import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "KL 규제 최적 정책과 DPO의 암묵적 보상",
    prompt: md`
본문의 유도 과정 세 부분을 코드로 확인합니다. 정책은 응답별 확률 배열입니다.

1. \`optimal_policy(pi_ref, r, beta)\`: $\pi^*(y) \propto \pi_{ref}(y)\,e^{r(y)/\beta}$ (정규화까지)
2. \`kl_objective(pi, pi_ref, r, beta)\`: $\sum_y \pi(y)r(y) - \beta\sum_y \pi(y)\log\frac{\pi(y)}{\pi_{ref}(y)}$
3. \`implied_reward(pi, pi_ref, beta)\`: 암묵적 보상 $\beta\log\frac{\pi(y)}{\pi_{ref}(y)}$ (배열)
4. \`preference_prob(pi, pi_ref, beta, w, l)\`: 암묵적 보상으로 계산한 Bradley–Terry 선호 확률 $\sigma(\hat r(w) - \hat r(l))$

$\pi^*$에서는 목적함수가 $\beta\log Z$이고, 암묵적 보상과 참 보상의 차이가 모든 응답에서 같으며, 선호 확률이 참 보상으로 계산한 것과 같아야 합니다.
`,
    starter: py`
import numpy as np

def optimal_policy(pi_ref, r, beta):
    return np.array(pi_ref, dtype=float)  # TODO: π_ref·exp(r/β)를 정규화

def kl_objective(pi, pi_ref, r, beta):
    return 0.0  # TODO

def implied_reward(pi, pi_ref, beta):
    return np.zeros(len(pi))  # TODO

def preference_prob(pi, pi_ref, beta, w, l):
    return 0.5  # TODO

pi_ref = np.array([0.4, 0.3, 0.2, 0.1])
r = np.array([0.0, 1.0, 2.0, 0.5])
print(optimal_policy(pi_ref, r, 0.5).round(4))
`,
    tests: py`
import numpy as np
pi_ref = np.array([0.4, 0.3, 0.2, 0.1])
r = np.array([0.0, 1.0, 2.0, 0.5])
beta = 0.5

@test("닫힌 해: π* ≈ [0.029, 0.1605, 0.7908, 0.0197]")
def _():
    p = optimal_policy(pi_ref, r, beta)
    assert approx(p, [0.0290, 0.1605, 0.7908, 0.0197], 1e-3), f"결과: {np.round(p, 4)}"
    assert approx(np.sum(p), 1.0)

@test("최적 목적함수 값 = β·log Z ≈ 1.3126")
def _():
    Z = np.sum(pi_ref * np.exp(r / beta))
    val = kl_objective(optimal_policy(pi_ref, r, beta), pi_ref, r, beta)
    assert approx(val, beta * np.log(Z)) and approx(val, 1.3126, 1e-3), f"결과: {val}"

@test("π*는 무작위 정책 300개보다 목적함수가 크다")
def _():
    rng = np.random.default_rng(0)
    best = kl_objective(optimal_policy(pi_ref, r, beta), pi_ref, r, beta)
    for _ in range(300):
        pi = rng.dirichlet(np.ones(4))
        assert kl_objective(pi, pi_ref, r, beta) <= best + 1e-12

@test("암묵적 보상 - 참 보상 = 모든 응답에서 같은 상수 -β·log Z")
def _():
    diff = implied_reward(optimal_policy(pi_ref, r, beta), pi_ref, beta) - r
    assert approx(diff, np.full(4, diff[0])), f"결과: {np.round(diff, 4)}"
    assert approx(diff[0], -1.3126, 1e-3)

@test("π*의 암묵적 보상으로 계산한 선호 확률 = 참 보상의 σ(r_w - r_l)")
def _():
    p = optimal_policy(pi_ref, r, beta)
    for w in range(4):
        for l in range(4):
            if w != l:
                assert approx(preference_prob(p, pi_ref, beta, w, l), 1 / (1 + np.exp(-(r[w] - r[l])))), (w, l)

@test("β가 크면 π_ref에, 작으면 보상 최댓값에 몰린다")
def _():
    assert approx(optimal_policy(pi_ref, r, 100.0), pi_ref, 1e-2)
    assert optimal_policy(pi_ref, r, 0.01)[2] > 0.999
`,
    hints: ["`optimal_policy`는 `p = pi_ref * np.exp(r / beta)`를 `p / p.sum()`으로 정규화합니다. $\\beta$가 아주 작을 때 넘치지 않게 하려면 `r / beta`에서 최댓값을 빼고 지수를 취합니다.", "`kl_objective`는 `pi @ r - beta * np.sum(pi * np.log(pi / pi_ref))`, `implied_reward`는 `beta * np.log(pi / pi_ref)`입니다.", "`preference_prob`는 `h = implied_reward(...)`로 `1 / (1 + np.exp(-(h[w] - h[l])))`입니다. $\\pi^*$에서는 $\\beta\\log Z$가 빼기에서 사라져 참 보상의 차이와 같아집니다."],
    solution: py`
import numpy as np

def optimal_policy(pi_ref, r, beta):
    z = np.asarray(r, dtype=float) / beta
    p = np.asarray(pi_ref, dtype=float) * np.exp(z - z.max())
    return p / p.sum()

def kl_objective(pi, pi_ref, r, beta):
    return pi @ r - beta * np.sum(pi * np.log(pi / pi_ref))

def implied_reward(pi, pi_ref, beta):
    return beta * np.log(np.asarray(pi) / np.asarray(pi_ref))

def preference_prob(pi, pi_ref, beta, w, l):
    h = implied_reward(pi, pi_ref, beta)
    return 1 / (1 + np.exp(-(h[w] - h[l])))

pi_ref = np.array([0.4, 0.3, 0.2, 0.1])
r = np.array([0.0, 1.0, 2.0, 0.5])
print(optimal_policy(pi_ref, r, 0.5).round(4))
`,
  },
]);
