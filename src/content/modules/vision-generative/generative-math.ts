import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/generative-math";

export default defineLesson({
  id: "generative-math",
  title: "생성 모델의 수학: ELBO, 재매개변수화, 확산",
  tier: "advanced",
  requires: ["generative-models", "entropy-kl"],
  goal: "옌센 부등식으로 ELBO를 유도하고 가우시안 KL의 닫힌 형태를 쓰며, 재매개변수화 트릭의 필요성과 확산 모델의 순방향 닫힌 형태·노이즈 예측 손실을 설명할 수 있다.",
  why: "VAE와 확산 모델의 손실 함수는 직접 계산할 수 없는 로그가능도의 하한에서 나온다. 손실의 각 항이 어디서 나오는지 알아야 KL 항의 가중치나 노이즈 일정 같은 설정을 바꿀 때 결과를 예측하고, 생성 모델 논문의 수식을 읽을 수 있다.",
  body: md`
[[lesson:generative-models]]는 VAE의 KL 항, GAN의 minimax, Diffusion의 노이즈 예측을 개념으로 설명했다. 이 레슨은 그중 VAE와 Diffusion의 학습 목표를 유도한다. 두 모델은 모두 "직접 계산할 수 없는 로그가능도 $\log p(x)$ 대신, 계산할 수 있는 하한을 최대화한다"는 같은 아이디어 위에 서 있다.

### ELBO: 로그가능도의 하한

잠재변수 모델 $p_\theta(x) = \int p_\theta(x \mid z)\,p(z)\,dz$는 적분 때문에 직접 최대화할 수 없다. 인코더가 주는 근사 분포 $q_\phi(z \mid x)$를 도입해 $\log p_\theta(x) = \log \mathbb{E}_{q}\!\left[\frac{p_\theta(x,z)}{q_\phi(z\mid x)}\right]$로 쓰고 옌센 부등식($\log$는 오목하므로 $\log\mathbb{E} \ge \mathbb{E}\log$)을 적용하면

$$\log p_\theta(x) \ge \underbrace{\mathbb{E}_{q_\phi(z\mid x)}\big[\log p_\theta(x \mid z)\big]}_{\text{복원 항}} - \underbrace{D_{\mathrm{KL}}\big(q_\phi(z\mid x)\,\|\,p(z)\big)}_{\text{사전분포와의 거리}} = \text{ELBO}$$

를 얻는다(Evidence Lower BOund). 첫 항은 "$z$로부터 $x$를 잘 복원하라"(디코더가 가우시안이면 MSE, [[lesson:loss-likelihood]]), 둘째 항은 "인코더의 분포를 사전분포 $\mathcal{N}(0, I)$ 가까이 두라"는 [[lesson:generative-models]]의 KL 페널티다. 하한과 실제 값의 차이는 정확히 $D_{\mathrm{KL}}(q_\phi(z\mid x)\,\|\,p_\theta(z\mid x))$이므로, ELBO를 키우는 것은 로그가능도를 키우면서 동시에 인코더를 실제 사후분포에 가깝게 만드는 일이다.

[[diagram:elbo-gap]]

인코더가 $q = \mathcal{N}(\mu, \sigma^2)$(차원마다 독립)를 내놓으면 KL 항은 적분 없이 닫힌 형태로 계산된다.

$$D_{\mathrm{KL}}\big(\mathcal{N}(\mu, \sigma^2)\,\|\,\mathcal{N}(0, 1)\big) = \tfrac{1}{2}\left(\mu^2 + \sigma^2 - 1 - \log\sigma^2\right)$$

$\mu = 0$, $\sigma = 1$이면 0이고, 평균이 원점에서 멀어지거나 분산이 1에서 벗어날수록 커진다.

| $\mu$ | $\sigma$ | $\frac12(\mu^2 + \sigma^2 - 1 - \log\sigma^2)$ |
| --- | --- | --- |
| 0 | 1 | 0 |
| 1 | 1 | 0.5 |
| 2 | 1 | 2.0 |
| 0 | 0.5 | $\frac12(0.25 - 1 + 1.386) \approx 0.318$ |
| 0 | 2 | $\frac12(4 - 1 - 1.386) \approx 0.807$ |

평균이 멀어지는 것은 제곱으로 벌점을 받고, 분산이 너무 작아지거나(점 하나로 모이려 함) 너무 커지는 것도 벌점을 받는다. 분산이 작아지는 쪽의 벌점이 특히 중요하다. KL 항이 없다면 인코더는 분산을 0으로 줄여 VAE를 일반 오토인코더로 되돌려 버린다.

[[diagram:vae-kl-curves]]

### 재매개변수화 트릭

복원 항은 $z \sim q_\phi$에 대한 기댓값이라, 샘플링 단계를 지나 $\phi$(인코더)로 기울기를 보낼 방법이 없어 보인다. **재매개변수화(reparameterization)**는 무작위성을 파라미터 밖으로 옮긴다. $z = \mu_\phi(x) + \sigma_\phi(x)\,\varepsilon$, $\varepsilon \sim \mathcal{N}(0, I)$로 쓰면 $z$는 $\mu, \sigma$의 미분 가능한 함수가 되고, 무작위성은 학습과 무관한 $\varepsilon$에만 남는다. 그러면 역전파가 그대로 통한다. 대안인 점수 함수 추정(REINFORCE, $\nabla_\phi\mathbb{E}_q[f] = \mathbb{E}_q[f\,\nabla_\phi\log q]$)도 편향은 없지만 분산이 훨씬 커서 같은 샘플 수로 훨씬 덜 정확하다. 강화학습의 정책 경사([[lesson:policy-gradient]])가 바로 이 점수 함수 추정이고, 그래서 분산을 줄이는 것이 정책 경사의 핵심 과제다.

[[diagram:reparameterization]]

### 확산 모델의 학습 목표

DDPM(Ho et al., 2020)의 순방향 과정은 $q(x_t \mid x_{t-1}) = \mathcal{N}(\sqrt{1-\beta_t}\,x_{t-1}, \beta_t I)$를 반복한다. 가우시안끼리의 합성은 가우시안이므로 이를 풀면 임의의 $t$로 한 번에 건너뛰는 닫힌 형태가 나온다.

$$q(x_t \mid x_0) = \mathcal{N}\!\left(\sqrt{\bar\alpha_t}\,x_0,\ (1-\bar\alpha_t)\,I\right), \qquad \bar\alpha_t = \prod_{s=1}^{t}(1-\beta_s)$$

즉 $x_t = \sqrt{\bar\alpha_t}\,x_0 + \sqrt{1-\bar\alpha_t}\,\varepsilon$이다. 확산 모델도 ELBO를 최대화하도록 유도되는데, 그 ELBO를 시점별 KL 항으로 펼치고 정리하면 매우 단순한 손실로 줄어든다.

$$\mathcal{L}_{\text{simple}} = \mathbb{E}_{t,\,x_0,\,\varepsilon}\big\lVert \varepsilon - \varepsilon_\theta(\sqrt{\bar\alpha_t}\,x_0 + \sqrt{1-\bar\alpha_t}\,\varepsilon,\ t)\big\rVert^2$$

무작위 시점 $t$를 고르고, 위 식으로 노이즈를 섞은 뒤, 신경망이 섞인 노이즈 $\varepsilon$을 맞히게 하는 MSE다. 노이즈를 정확히 맞히면 $x_0 = (x_t - \sqrt{1-\bar\alpha_t}\,\varepsilon)/\sqrt{\bar\alpha_t}$로 원본을 되찾을 수 있다. 이 노이즈 예측은 데이터 분포의 로그밀도 기울기(score) $\nabla_x \log p(x_t)$를 추정하는 것과 같다는 것이 알려져 있어(Song et al., 2021), 확산 모델은 "점수 기반 생성 모델"이라고도 불린다.

[[diagram:ddpm-training-step]]
`,
  checks: [
    {
      key: "c1",
      question: "$D_{\\mathrm{KL}}(\\mathcal{N}(\\mu, \\sigma^2)\\,\\|\\,\\mathcal{N}(0,1))$에서 $\\mu = 0$, $\\sigma = 1$이면 값은?",
      choices: ["0", "1", "$\\log 2$", "$\\infty$"],
      answer: 0,
      explanation: "$\\frac{1}{2}(\\mu^2 + \\sigma^2 - 1 - \\log\\sigma^2) = \\frac{1}{2}(0 + 1 - 1 - 0) = 0$. 두 분포가 같으면 KL은 0이다.",
    },
    {
      key: "c2",
      question: "재매개변수화 $z = \\mu + \\sigma\\varepsilon$, $\\varepsilon \\sim \\mathcal{N}(0,1)$이 하는 일은?",
      choices: ["무작위성을 학습과 무관한 $\\varepsilon$으로 옮겨 $\\mu, \\sigma$로 역전파가 가능하게 한다", "샘플링을 없앤다", "KL 항을 없앤다", "분산을 0으로 만든다"],
      answer: 0,
      explanation: "$z$가 $\\mu, \\sigma$의 미분 가능한 함수가 되어 복원 항의 기울기를 인코더 파라미터에 대해서도 계산할 수 있다. 점수 함수 추정보다 분산도 훨씬 작다(예: 같은 문제에서 표준편차 약 0.20 대 0.54).",
    },
    {
      key: "c3",
      question: "DDPM 순방향 과정에서 $x_t$를 $x_0$로부터 한 번에 만드는 식은? ($\\bar\\alpha_t = \\prod_s (1-\\beta_s)$)",
      choices: ["$\\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon$", "$\\bar\\alpha_t x_0 + (1-\\bar\\alpha_t)\\varepsilon$", "$x_0 + \\beta_t\\varepsilon$", "$\\sqrt{\\beta_t}x_0$"],
      answer: 0,
      explanation: "가우시안을 반복 합성한 결과도 가우시안이라 $q(x_t\\mid x_0) = \\mathcal{N}(\\sqrt{\\bar\\alpha_t}x_0, (1-\\bar\\alpha_t)I)$다. 덕분에 학습 중 임의의 $t$를 한 번에 만들 수 있다.",
    },
    {
      key: "c4",
      question: "$D_{\\mathrm{KL}}(\\mathcal{N}(\\mu, \\sigma^2)\\,\\|\\,\\mathcal{N}(0, 1))$에서 $\\mu = 1$, $\\sigma = 1$이면 값은?",
      choices: ["0.5", "1", "0", "2"],
      answer: 0,
      explanation: "$\\frac12(1 + 1 - 1 - \\log 1) = \\frac12$이다. 분산은 맞고 평균만 1 벗어나 $\\frac12\\mu^2$만큼 벌점을 받는다.",
    },
    {
      key: "c5",
      question: "VAE의 손실에서 KL 항을 빼면 인코더의 분산 $\\sigma^2$은 학습 중 대체로 어떻게 되는가?",
      choices: ["0으로 줄어들어 일반 오토인코더처럼 점 하나로 매핑된다", "1로 고정된다", "무한히 커진다", "변하지 않는다"],
      answer: 0,
      explanation: "복원만 잘하려면 샘플링 잡음이 없는 편이 유리해 분산을 0으로 줄인다. KL 항이 분산이 1에서 벗어나는 것에 벌점을 줘 잠재공간을 매끄럽게 유지한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import math
def kl(mu, sigma):
    return 0.5 * (mu ** 2 + sigma ** 2 - 1 - math.log(sigma ** 2))
print(kl(0, 1), kl(2, 1), round(kl(0, math.e ** 0.5), 4))
`,
      expected: "0.0 2.0 0.3591",
      explanation: "$\\mu = 0, \\sigma = 1$이면 사전분포와 같아 0이다. 평균만 2로 옮기면 $\\frac{1}{2}\\mu^2 = 2$다. $\\sigma^2 = e$이면 $\\frac{1}{2}(e - 1 - 1) = \\frac{e}{2} - 1 \\approx 0.3591$로, 분산이 1보다 커져도 벌점이 붙는다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "옌센 부등식으로 VAE의 ELBO를 유도하고 두 항의 의미를 설명하라. 재매개변수화 트릭이 필요한 이유와, 확산 모델의 학습 손실이 '노이즈 예측 MSE'로 단순해지는 데 쓰이는 순방향 과정의 닫힌 형태를 쓰라.",
      answer: md`
$\log p(x) = \log\mathbb{E}_{q(z|x)}[p(x,z)/q(z|x)] \ge \mathbb{E}_q[\log p(x,z) - \log q(z|x)] = \mathbb{E}_q[\log p(x|z)] - D_{\mathrm{KL}}(q(z|x)\|p(z))$로, 옌센 부등식을 쓰면 ELBO가 나온다. 첫 항은 잠재변수로부터 입력을 잘 복원하라는 복원 항, 둘째 항은 인코더의 분포를 사전분포 $\mathcal{N}(0,I)$ 가까이 두어 잠재공간을 매끄럽게 만드는 항이다. 복원 항은 $z\sim q$에 대한 기댓값이라 샘플링을 지나 인코더로 기울기를 보낼 수 없으므로, $z=\mu+\sigma\varepsilon$, $\varepsilon\sim\mathcal{N}(0,1)$로 무작위성을 파라미터 밖으로 옮기는 재매개변수화가 필요하다. 확산 모델은 순방향 과정이 $q(x_t|x_0)=\mathcal{N}(\sqrt{\bar\alpha_t}x_0,(1-\bar\alpha_t)I)$의 닫힌 형태를 가져 임의의 $t$에서 $x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\varepsilon$을 한 번에 만들 수 있고, ELBO를 정리하면 섞인 노이즈 $\varepsilon$을 맞히는 MSE로 단순해진다.
`,
      keyPoints: ["옌센 부등식으로 로그가능도의 하한(ELBO)을 얻는다", "ELBO는 복원 항에서 사전분포와의 KL을 뺀 값이다", "재매개변수화 $z = \\mu + \\sigma\\varepsilon$로 샘플링을 지나 인코더까지 기울기를 보낸다", "순방향 과정의 닫힌 형태로 임의의 $t$에서 $x_t$를 한 번에 만든다", "확산 모델의 손실은 섞인 노이즈를 맞히는 MSE로 단순해진다"],
    },
  ],
  references: [
    { title: "Kingma & Welling (2013) — Auto-Encoding Variational Bayes", url: "https://arxiv.org/abs/1312.6114", note: "ELBO와 재매개변수화 트릭 (영문)" },
    { title: "Ho et al. (2020) — Denoising Diffusion Probabilistic Models", url: "https://arxiv.org/abs/2006.11239", note: "노이즈 예측 손실의 유도 (영문)" },
    { title: "Lilian Weng — What are Diffusion Models?", url: "https://lilianweng.github.io/posts/2021-07-11-diffusion-models/", note: "확산 모델 수식을 단계별로 정리한 해설 (영문)" },
  ],
});
