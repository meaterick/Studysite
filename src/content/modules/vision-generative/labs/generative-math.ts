import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "가우시안 KL·재매개변수화·확산의 닫힌 형태",
    prompt: md`
본문의 식을 구현합니다.

1. \`kl_gauss(mu, log_var)\`: 차원마다 독립인 $\mathcal{N}(\mu, \sigma^2)$와 $\mathcal{N}(0, I)$의 KL을 **모든 차원에 대해 합한** 값. $\log\sigma^2$(\`log_var\`)을 입력으로 받습니다(VAE 구현의 관례).
2. \`reparam(mu, log_var, eps)\` $= \mu + \sigma\,\varepsilon$, $\sigma = e^{\log\sigma^2/2}$
3. \`alpha_bar(betas)\`: $\bar\alpha_t = \prod_{s\le t}(1-\beta_s)$ 배열
4. \`q_sample(x0, t, betas, eps)\` $= \sqrt{\bar\alpha_t}\,x_0 + \sqrt{1-\bar\alpha_t}\,\varepsilon$ (\`t\`는 0부터)
5. \`predict_x0(xt, t, betas, eps_hat)\`: 예측한 노이즈로 $x_0$를 되찾는 식
`,
    starter: py`
import numpy as np

def kl_gauss(mu, log_var):
    return 0.0  # TODO

def reparam(mu, log_var, eps):
    return mu  # TODO

def alpha_bar(betas):
    return np.ones_like(betas)  # TODO

def q_sample(x0, t, betas, eps):
    return x0  # TODO

def predict_x0(xt, t, betas, eps_hat):
    return xt  # TODO

print(kl_gauss(np.array([1.5]), np.log(np.array([0.25]))))
`,
    tests: py`
import numpy as np

@test("표준정규면 KL = 0, 본문 예제(μ=1.5, σ=0.5) ≈ 1.4431")
def _():
    assert approx(kl_gauss(np.zeros(3), np.zeros(3)), 0.0)
    assert approx(kl_gauss(np.array([1.5]), np.log(np.array([0.25]))), 0.5 * (2.25 + 0.25 - 1 - np.log(0.25)))

@test("여러 차원은 합한다")
def _():
    mu, lv = np.array([1.0, -2.0]), np.array([0.0, np.log(4.0)])
    expect = 0.5 * (1 + 1 - 1 - 0) + 0.5 * (4 + 4 - 1 - np.log(4))
    assert approx(kl_gauss(mu, lv), expect)

@test("재매개변수화 샘플의 평균·표준편차가 μ, σ와 맞다")
def _():
    eps = np.random.default_rng(0).normal(size=200_000)
    z = reparam(2.0, np.log(9.0), eps)
    assert abs(np.mean(z) - 2.0) < 0.03 and abs(np.std(z) - 3.0) < 0.03, f"평균 {np.mean(z):.3f}, 표준편차 {np.std(z):.3f}"

@test("ᾱ_t는 (1-β)의 누적곱")
def _():
    b = np.array([0.1, 0.2, 0.5])
    assert approx(alpha_bar(b), [0.9, 0.72, 0.36])

@test("q_sample의 분포가 한 스텝씩 노이즈를 더한 것과 같다")
def _():
    rng = np.random.default_rng(1)
    betas = np.linspace(1e-4, 0.02, 200)
    xs = np.full(40_000, 0.8)
    for s in range(200):
        xs = np.sqrt(1 - betas[s]) * xs + np.sqrt(betas[s]) * rng.normal(size=xs.shape)
    direct = q_sample(np.full(40_000, 0.8), 199, betas, rng.normal(size=40_000))
    assert abs(xs.mean() - direct.mean()) < 0.02 and abs(xs.var() - direct.var()) < 0.02

@test("노이즈를 정확히 알면 x0를 정확히 되찾는다")
def _():
    rng = np.random.default_rng(2)
    betas = np.linspace(1e-4, 0.02, 100)
    x0, eps = rng.normal(size=6), rng.normal(size=6)
    xt = q_sample(x0, 70, betas, eps)
    assert approx(predict_x0(xt, 70, betas, eps), x0, 1e-9)
`,
    hints: ["`0.5 * np.sum(mu ** 2 + np.exp(log_var) - 1 - log_var)`가 차원별 KL의 합입니다.", "`reparam`은 `mu + np.exp(0.5 * log_var) * eps`, `alpha_bar`는 `np.cumprod(1 - betas)`입니다.", "`ab = alpha_bar(betas)[t]`로 두면 `q_sample`은 `np.sqrt(ab) * x0 + np.sqrt(1 - ab) * eps`, `predict_x0`는 그 식을 $x_0$에 대해 푼 `(xt - np.sqrt(1 - ab) * eps_hat) / np.sqrt(ab)`입니다."],
    solution: py`
import numpy as np

def kl_gauss(mu, log_var):
    mu, log_var = np.asarray(mu, dtype=float), np.asarray(log_var, dtype=float)
    return float(0.5 * np.sum(mu ** 2 + np.exp(log_var) - 1 - log_var))

def reparam(mu, log_var, eps):
    return mu + np.exp(0.5 * np.asarray(log_var, dtype=float)) * eps

def alpha_bar(betas):
    return np.cumprod(1 - np.asarray(betas, dtype=float))

def q_sample(x0, t, betas, eps):
    ab = alpha_bar(betas)[t]
    return np.sqrt(ab) * x0 + np.sqrt(1 - ab) * eps

def predict_x0(xt, t, betas, eps_hat):
    ab = alpha_bar(betas)[t]
    return (xt - np.sqrt(1 - ab) * eps_hat) / np.sqrt(ab)

print(kl_gauss(np.array([1.5]), np.log(np.array([0.25]))))
`,
  },
]);
