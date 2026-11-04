import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "순확산 과정과 잡음 예측으로 원본 되찾기",
    prompt: md`
Diffusion 모델의 순방향 과정을 식 그대로 구현합니다.

1. \`alpha_bar(betas)\`: $\bar\alpha_t = \prod_{s \le t} (1 - \beta_s)$ (원본 신호가 남아 있는 비율)
2. \`q_sample(x0, t, ab, eps)\`: $x_t = \sqrt{\bar\alpha_t}\,x_0 + \sqrt{1 - \bar\alpha_t}\,\epsilon$
3. \`predict_x0(xt, t, ab, eps_hat)\`: 신경망이 예측한 잡음 $\hat\epsilon$으로 $x_0$를 거꾸로 계산합니다. 역방향 학습이 "잡음을 맞히는 것"이면 충분한 이유가 이 식에 있습니다.
`,
    starter: py`
import numpy as np

def alpha_bar(betas):
    return np.ones_like(betas)  # TODO

def q_sample(x0, t, ab, eps):
    return x0  # TODO

def predict_x0(xt, t, ab, eps_hat):
    return xt  # TODO: q_sample 식을 x0에 대해 풉니다.

rng = np.random.default_rng(0)
betas = np.linspace(1e-4, 0.35, 10)
ab = alpha_bar(betas)
x0 = rng.uniform(-1, 1, 64)
eps = rng.normal(size=64)
xt = q_sample(x0, 9, ab, eps)
print("ᾱ:", ab.round(3))
print("복원 오차:", np.abs(predict_x0(xt, 9, ab, eps) - x0).max())
`,
    tests: py`
import numpy as np
betas = np.linspace(1e-4, 0.35, 10)

@test("ᾱ는 1에서 시작해 단조 감소, 마지막 ≈ 0.13")
def _():
    ab = alpha_bar(betas)
    assert approx(ab[0], 1 - 1e-4) and np.all(np.diff(ab) < 0) and approx(ab[-1], np.prod(1 - betas)), f"ᾱ: {ab}"

@test("q_sample 식")
def _():
    ab = alpha_bar(betas)
    x0, e = np.array([1.0, -1.0]), np.array([0.5, 2.0])
    assert approx(q_sample(x0, 4, ab, e), np.sqrt(ab[4]) * x0 + np.sqrt(1 - ab[4]) * e)

@test("정확한 잡음을 알면 원본을 완벽히 되찾는다")
def _():
    ab = alpha_bar(betas)
    rng = np.random.default_rng(1)
    x0, e = rng.uniform(-1, 1, 50), rng.normal(size=50)
    for t in (0, 5, 9):
        assert approx(predict_x0(q_sample(x0, t, ab, e), t, ab, e), x0)

@test("t가 커질수록 원본과의 상관이 줄어든다")
def _():
    ab = alpha_bar(betas)
    rng = np.random.default_rng(2)
    x0 = rng.uniform(-1, 1, 5000)
    c = [np.corrcoef(x0, q_sample(x0, t, ab, rng.normal(size=5000)))[0, 1] for t in (0, 5, 9)]
    assert c[0] > c[1] > c[2], f"상관: {np.round(c, 3)}"
`,
    hints: ["`np.cumprod(1 - betas)`", "`np.sqrt(ab[t]) * x0 + np.sqrt(1 - ab[t]) * eps`", "$x_0 = (x_t - \\sqrt{1 - \\bar\\alpha_t}\\,\\hat\\epsilon) / \\sqrt{\\bar\\alpha_t}$"],
    solution: py`
import numpy as np

def alpha_bar(betas):
    return np.cumprod(1 - betas)

def q_sample(x0, t, ab, eps):
    return np.sqrt(ab[t]) * x0 + np.sqrt(1 - ab[t]) * eps

def predict_x0(xt, t, ab, eps_hat):
    return (xt - np.sqrt(1 - ab[t]) * eps_hat) / np.sqrt(ab[t])

rng = np.random.default_rng(0)
betas = np.linspace(1e-4, 0.35, 10)
ab = alpha_bar(betas)
x0 = rng.uniform(-1, 1, 64)
eps = rng.normal(size=64)
xt = q_sample(x0, 9, ab, eps)
print("ᾱ:", ab.round(3))
print("복원 오차:", np.abs(predict_x0(xt, 9, ab, eps) - x0).max())
`,
  },
]);
