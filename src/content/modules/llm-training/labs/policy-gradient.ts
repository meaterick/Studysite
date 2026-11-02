import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "정책 경사의 기준선과 PPO 클리핑",
    prompt: md`

「정책 경사와 PPO」 단계의 식을 소프트맥스 정책(로짓 \`theta\`)에서 정확히 계산합니다. 샘플링 없이 기댓값과 분산을 모든 행동에 대한 합으로 구합니다.

1. \`grad_log_softmax(theta, a)\`: $\nabla_\theta\log\pi_\theta(a) = \text{onehot}(a) - \pi_\theta$
2. \`exact_policy_gradient(theta, rewards)\`: $\nabla_\theta\sum_a\pi_\theta(a)r(a) = \pi \odot (r - \pi\cdot r)$
3. \`expected_estimator(theta, rewards, b)\`: REINFORCE 추정 $(R - b)\nabla\log\pi(a)$의 기댓값 $\sum_a \pi(a)(r(a) - b)\nabla\log\pi(a)$
4. \`estimator_variance(theta, rewards, b, noise_var=1.0)\`: 보상 $R = r(a) + \text{잡음}$(분산 \`noise_var\`)일 때 추정의 성분별 분산. $\mathbb{E}[(R-b)^2 \mid a] = (r(a) - b)^2 + \sigma^2$을 이용해 $\mathbb{E}[g^2] - (\mathbb{E}[g])^2$로 계산합니다.
5. \`ppo_clip(rho, adv, eps=0.2)\`: $\min(\rho A, \text{clip}(\rho, 1-\varepsilon, 1+\varepsilon)A)$ (배열도 처리)
`,
    starter: py`
import numpy as np

def softmax(theta):
    e = np.exp(theta - np.max(theta))
    return e / e.sum()

def grad_log_softmax(theta, a):
    return np.zeros(len(theta))  # TODO

def exact_policy_gradient(theta, rewards):
    return np.zeros(len(theta))  # TODO

def expected_estimator(theta, rewards, b):
    return np.zeros(len(theta))  # TODO

def estimator_variance(theta, rewards, b, noise_var=1.0):
    return np.zeros(len(theta))  # TODO

def ppo_clip(rho, adv, eps=0.2):
    return rho * adv  # TODO: 클리핑과 min

r = np.array([1.0, 1.5, 2.0])
print(exact_policy_gradient(np.zeros(3), r).round(3))
`,
    tests: py`
import numpy as np
r = np.array([1.0, 1.5, 2.0])
th0 = np.zeros(3)

@test("∇log π(a) = onehot(a) - π, 성분의 합은 0")
def _():
    th = np.array([0.5, -1.0, 2.0])
    g = grad_log_softmax(th, 1)
    pi = np.exp(th) / np.exp(th).sum()
    assert approx(g, np.eye(3)[1] - pi) and approx(np.sum(g), 0.0), f"결과: {g}"

@test("정확한 정책 경사: 균등 정책에서 [-1/6, 0, 1/6], 수치 미분과 일치")
def _():
    assert approx(exact_policy_gradient(th0, r), [-1 / 6, 0, 1 / 6]), f"결과: {exact_policy_gradient(th0, r)}"
    th = np.array([0.3, -0.7, 1.1])
    J = lambda t: (np.exp(t) / np.exp(t).sum()) @ r
    num = np.array([(J(th + 1e-6 * e) - J(th - 1e-6 * e)) / 2e-6 for e in np.eye(3)])
    assert approx(exact_policy_gradient(th, r), num, 1e-6)

@test("기준선 b를 바꿔도 추정의 기댓값은 정확한 기울기 그대로")
def _():
    th = np.array([0.3, -0.7, 1.1])
    for b in (0.0, 1.5, 10.0, -3.0):
        assert approx(expected_estimator(th, r, b), exact_policy_gradient(th, r)), f"b={b}"

@test("분산: 기준선 0이면 [0.574, 0.741, 0.907], 평균 보상이면 0.241씩, 10이면 훨씬 크다")
def _():
    assert approx(estimator_variance(th0, r, 0.0), [0.5741, 0.7407, 0.9074], 1e-3), f"결과: {estimator_variance(th0, r, 0.0)}"
    assert approx(estimator_variance(th0, r, 1.5), [0.2407] * 3, 1e-3)
    assert np.all(estimator_variance(th0, r, 10.0) > 15)

@test("PPO 클리핑 표 (ε=0.2)")
def _():
    rho = np.array([0.5, 0.8, 1.0, 1.2, 1.5, 3.0])
    assert approx(ppo_clip(rho, 1.0), [0.5, 0.8, 1.0, 1.2, 1.2, 1.2]), f"A=+1: {ppo_clip(rho, 1.0)}"
    assert approx(ppo_clip(rho, -1.0), [-0.8, -0.8, -1.0, -1.2, -1.5, -3.0]), f"A=-1: {ppo_clip(rho, -1.0)}"
    assert approx(ppo_clip(1.5, 2.0, eps=0.1), 2.2)
`,
    hints: ["`grad_log_softmax`는 `np.eye(len(theta))[a] - softmax(theta)`, `exact_policy_gradient`는 `pi * (rewards - pi @ rewards)`입니다.", "행렬 `G = np.eye(n) - pi`의 a번째 행이 $\\nabla\\log\\pi(a)$입니다. 기댓값은 `(pi * (rewards - b)) @ G`, 제곱의 기댓값은 `(pi * ((rewards - b) ** 2 + noise_var)) @ G ** 2`입니다.", "`ppo_clip`은 `np.minimum(rho * adv, np.clip(rho, 1 - eps, 1 + eps) * adv)`입니다."],
    solution: py`
import numpy as np

def softmax(theta):
    e = np.exp(theta - np.max(theta))
    return e / e.sum()

def grad_log_softmax(theta, a):
    return np.eye(len(theta))[a] - softmax(theta)

def exact_policy_gradient(theta, rewards):
    pi = softmax(theta)
    return pi * (rewards - pi @ rewards)

def expected_estimator(theta, rewards, b):
    pi = softmax(theta)
    G = np.eye(len(theta)) - pi
    return (pi * (rewards - b)) @ G

def estimator_variance(theta, rewards, b, noise_var=1.0):
    pi = softmax(theta)
    G = np.eye(len(theta)) - pi
    mean = (pi * (rewards - b)) @ G
    second = (pi * ((rewards - b) ** 2 + noise_var)) @ G ** 2
    return second - mean ** 2

def ppo_clip(rho, adv, eps=0.2):
    rho = np.asarray(rho, dtype=float)
    return np.minimum(rho * adv, np.clip(rho, 1 - eps, 1 + eps) * adv)

r = np.array([1.0, 1.5, 2.0])
print(exact_policy_gradient(np.zeros(3), r).round(3))
`,
  },
]);
