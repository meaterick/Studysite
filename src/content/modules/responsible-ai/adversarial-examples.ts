import { defineLesson, md } from "../../kit";
import exercises from "./labs/adversarial-examples";

export default defineLesson({
  id: "adversarial-examples",
  title: "적대적 예제와 FGSM",
  tier: "advanced",
  requires: ["backprop", "optimizers"],
  goal: "선형성 가설로 고차원에서 적대적 예제가 생기는 이유를 $\\varepsilon\\lVert w\\rVert_1$로 설명하고, FGSM을 구현해 무작위 노이즈와 비교하며, PGD·적대적 학습의 역할을 설명할 수 있다.",
  why: "테스트 정확도가 높은 모델도 손실을 키우는 방향으로 조작한 입력에는 쉽게 틀릴 수 있다. 자율주행, 의료, 보안처럼 입력을 조작하려는 사람이 있는 환경에 모델을 배포하려면, 이 취약성이 생기는 이유와 공격을 기준으로 강건성을 평가하는 방법을 알아야 한다.",
  body: md`
정확도 96%인 분류기에 사람 눈에는 거의 보이지 않는 작은 노이즈를 더하면 정확도가 0%까지 떨어질 수 있다. Szegedy et al. (2014)이 처음 보고한 이 **적대적 예제(adversarial example)**는 신경망의 판단 근거가 사람의 지각과 크게 다르다는 것을 보여 주었고, 자율주행·의료·보안 분야에서 모델을 배포할 때 반드시 점검해야 할 위험이 되었다. 이 레슨은 이런 일이 생기는 이유에 대한 대표적인 설명인 선형성 가설과, 가장 기본적인 공격인 FGSM을 다룬다.

### 선형성 가설

선형 모델의 로짓 $w^\top x$에 입력 변화 $\eta$를 더하면 로짓은 $w^\top\eta$만큼 바뀐다. 각 픽셀을 최대 $\varepsilon$만큼만 바꿀 수 있다면($\lVert\eta\rVert_\infty \le \varepsilon$), 로짓을 가장 크게 바꾸는 선택은 $\eta = \varepsilon\,\operatorname{sign}(w)$이고 그때 변화량은

$$w^\top\eta = \varepsilon\sum_i |w_i| = \varepsilon\,\lVert w\rVert_1$$

이다. 픽셀 하나당 변화는 $\varepsilon$으로 작아도, 입력 차원 $n$이 크면 $\lVert w\rVert_1$은 $n$에 비례해 커지므로 로짓이 크게 움직인다. Goodfellow et al. (2015)은 신경망이 ReLU처럼 구간별로 거의 **선형**으로 동작하는 구성 요소로 이루어져 있기 때문에 고차원에서 이런 취약성이 생긴다고 설명했다. 무작위 노이즈는 부호가 무작위라 $w^\top\eta$의 항들이 서로 상쇄되어(표준편차가 $\sqrt{n}$에 비례) 같은 크기라도 효과가 훨씬 작다.

다음 코드는 입력 차원을 늘려 가며 같은 크기($\varepsilon = 0.01$)의 "맞춘 노이즈"와 "무작위 노이즈"가 선형 로짓을 얼마나 바꾸는지 잰다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
eps = 0.01
for n in (10, 1_000, 150_528):                       # 150,528 = 224 × 224 × 3
    w = rng.normal(size=n)                            # 선형 모델의 가중치
    attack = eps * np.sign(w)                         # 픽셀마다 ±0.01, 방향을 w에 맞춘다
    noise = eps * rng.choice([-1.0, 1.0], size=n)     # 같은 크기, 무작위 부호
    print(f"n={n:>7}: 맞춘 노이즈의 로짓 변화 {w @ attack:8.2f} | 무작위 노이즈 {abs(w @ noise):6.2f}")
\`\`\`

맞춘 노이즈의 효과는 차원에 비례해 커지고(약 $\varepsilon \cdot 0.8n$), 무작위 노이즈는 $\sqrt{n}$에 비례해서만 커진다. $224 \times 224 \times 3$ 이미지 크기에서는 픽셀당 0.01(256단계 중 약 2.5단계)이라는 눈에 안 보이는 변화가 로짓을 1,200이나 움직인다.

[[diagram:linearity-hypothesis]]

### FGSM: 기울기 부호 한 번

**FGSM(Fast Gradient Sign Method)**은 위 관찰을 신경망에 그대로 적용한다.

$$x_{\text{adv}} = \operatorname{clip}_{[0,1]}\big(x + \varepsilon\,\operatorname{sign}(\nabla_x L(\theta, x, y))\big)$$

학습 때는 파라미터 $\theta$에 대한 기울기로 손실을 **줄였지만**, 공격자는 입력 $x$에 대한 기울기로 손실을 **키운다**. 역전파 한 번이면 계산되므로 매우 빠르다. 같은 방향으로 작은 걸음을 여러 번 반복하며 허용 범위로 되돌리는 PGD(Madry et al., 2018)는 훨씬 강한 공격이고, 학습 데이터에 PGD 예제를 섞어 학습하는 **적대적 학습(adversarial training)**이 현재까지 가장 믿을 만한 방어로 꼽힌다. 다만 깨끗한 데이터의 정확도가 조금 떨어지고 학습 비용이 몇 배로 늘어나는 대가가 있다.

\`\`\`image
src: /images/week4/fgsm-panda.jpg
alt: 판다 사진(GoogLeNet이 57.7% 확신으로 판다라고 분류)에 손실 기울기의 부호로 만든 알록달록한 노이즈를 0.007배 더하면, 사람 눈에는 똑같은 판다 사진인데 모델은 99.3% 확신으로 긴팔원숭이라고 분류한다.
caption: FGSM의 대표적인 예다. 원본(왼쪽, 판다 57.7%)에 입력에 대한 손실 기울기의 부호(가운데)를 ε = 0.007배 더하면, 사람 눈에는 차이가 보이지 않는 이미지(오른쪽)를 GoogLeNet이 99.3% 확신으로 긴팔원숭이라고 분류한다. ε = 0.007은 GoogLeNet이 입력을 실수로 변환했을 때 8비트 이미지의 최소 단위 한 칸에 해당하는 크기다.
credit: Goodfellow, Shlens & Szegedy (2015), Explaining and Harnessing Adversarial Examples, Figure 1 (arXiv:1412.6572)
width: 1760
height: 636
\`\`\`

### 왜 중요한가

적대적 예제는 정확도라는 숫자가 "평균적인 입력"에 대한 성적일 뿐, 최악의 입력에 대한 보장이 아니라는 것을 보여 준다. 정지 표지판에 작은 스티커를 붙여 자율주행 인식기가 표지판을 잘못 분류하게 만드는 물리적 공격(Eykholt et al., 2018)도 보고되었다. 같은 문제는 LLM에서도 나타난다. 프롬프트 인젝션과 탈옥(jailbreak)은 언어 모델에 대한 적대적 입력이다([[lesson:injection-defense]]).
`,
  checks: [
    {
      key: "c1",
      question: "픽셀마다 최대 $\\varepsilon$만 바꿀 수 있을 때 선형 로짓 $w^\\top x$를 가장 크게 바꾸는 변화량 $\\eta$와 그 효과는?",
      choices: ["$\\eta = \\varepsilon\\,\\mathrm{sign}(w)$, 로짓이 $\\varepsilon\\lVert w\\rVert_1$만큼 바뀐다", "$\\eta = \\varepsilon w$, 로짓이 $\\varepsilon$만큼 바뀐다", "무작위 노이즈가 가장 크게 바꾼다", "로짓은 바뀌지 않는다"],
      answer: 0,
      explanation: "각 항 $w_i\\eta_i$를 최대로 하려면 $\\eta_i$의 부호를 $w_i$에 맞춘다. 합 $\\varepsilon\\sum|w_i|$는 차원에 비례해 커진다.",
    },
    {
      key: "c2",
      question: "FGSM이 학습의 경사하강법과 다른 점은?",
      choices: ["파라미터가 아니라 입력에 대한 기울기를 써서 손실을 키우는 방향으로 움직인다", "기울기를 쓰지 않는다", "파라미터를 갱신한다", "손실을 줄인다"],
      answer: 0,
      explanation: "$x_{adv} = x + \\varepsilon\\,\\mathrm{sign}(\\nabla_x L)$. 같은 역전파로 입력 기울기를 얻어 손실을 키운다.",
    },
    {
      key: "c3",
      question: "실습의 softmax 회귀에서 $\\varepsilon = 0.1$의 FGSM은 정확도를 0.965에서 0.646으로 떨어뜨렸지만, 같은 크기의 무작위 부호 노이즈를 더한 정확도는 0.965 그대로였다. 가장 알맞은 해석은?",
      choices: ["노이즈의 크기보다 방향(기울기와 맞춘 부호)이 결정적이다", "무작위 노이즈가 더 작았다", "모델이 무작위 노이즈로 학습되었다", "테스트셋이 달랐다"],
      answer: 0,
      explanation: "무작위 부호는 $w^\\top\\eta$의 항들이 상쇄되어 효과가 $\\sqrt{n}$ 정도로 작지만, FGSM은 모든 항이 같은 방향으로 더해져 $n$에 비례한다.",
    },
    {
      key: "c4",
      question: "입력 차원이 100배가 되면, 같은 $\\varepsilon$에서 맞춘 노이즈와 무작위 노이즈의 로짓 변화는 각각 대략 몇 배가 되는가?",
      choices: ["맞춘 노이즈 약 100배, 무작위 노이즈 약 10배", "둘 다 약 100배", "둘 다 약 10배", "맞춘 노이즈 약 10배, 무작위 노이즈 약 100배"],
      answer: 0,
      explanation: "맞춘 노이즈의 효과 $\\varepsilon\\lVert w\\rVert_1$은 차원에 비례하고, 무작위 부호의 합은 서로 상쇄되어 표준편차가 $\\sqrt{n}$에 비례한다. $\\sqrt{100} = 10$이다.",
    },
    {
      key: "c5",
      question: "\"우리 모델은 가우시안 노이즈를 섞어도 정확도가 그대로라 강건하다\"는 주장의 허점은?",
      choices: ["무작위 노이즈에 대한 성능은 기울기 방향으로 맞춘 최악의 노이즈에 대한 보장이 아니다", "가우시안 노이즈는 너무 강하다", "정확도는 강건성과 무관하다", "노이즈를 섞으면 항상 정확도가 오른다"],
      answer: 0,
      explanation: "무작위 노이즈는 효과가 상쇄되어 약하다. 강건성은 FGSM·PGD처럼 손실을 키우는 방향의 공격으로, 허용 교란 크기를 명시해 측정해야 한다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "선형성 가설로 적대적 예제가 고차원에서 생기는 이유를 설명하라. FGSM의 식을 쓰고, 같은 크기의 무작위 노이즈보다 FGSM 노이즈가 훨씬 해로운 이유와 대표적인 방어법을 쓰라.",
      answer: md`
선형 로짓 $w^\top x$에 픽셀마다 최대 $\varepsilon$인 변화 $\eta$를 더할 때, $\eta=\varepsilon\,\mathrm{sign}(w)$로 고르면 로짓이 $\varepsilon\lVert w\rVert_1$만큼 바뀐다. $\lVert w\rVert_1$은 입력 차원에 비례해 커지므로, 픽셀 하나하나의 변화는 작아도 고차원에서는 결과가 크게 움직인다. 신경망은 ReLU 등으로 구간별로 거의 선형이라 같은 취약성을 갖는다(선형성 가설). FGSM은 $x_{adv}=\mathrm{clip}(x+\varepsilon\,\mathrm{sign}(\nabla_x L))$로, 입력을 손실의 기울기 부호 방향으로 움직여 손실을 키운다. 무작위 부호 노이즈는 항들이 서로 상쇄되어 효과가 $\sqrt{n}$ 정도에 그치지만 FGSM은 모든 항이 같은 방향으로 더해져 $n$에 비례하므로 훨씬 해롭다. 대표적인 방어는 PGD로 만든 적대적 예제를 학습 데이터에 섞는 적대적 학습이다.
`,
      keyPoints: ["$\\eta = \\varepsilon\\,\\mathrm{sign}(w)$일 때 로짓 변화 $\\varepsilon\\lVert w\\rVert_1$이 차원에 비례한다", "신경망은 구간별로 거의 선형이라 같은 취약성을 갖는다", "FGSM은 입력 기울기의 부호 방향으로 입력을 움직여 손실을 키운다", "무작위 노이즈는 항들이 상쇄되어 효과가 $\\sqrt{n}$ 정도에 그친다", "대표적인 방어는 PGD 적대적 예제로 학습하는 적대적 학습이다"],
    },
    {
      key: "d2",
      question: "어떤 팀이 \"우리 이미지 분류기는 테스트 정확도 98%이고, 가우시안 노이즈를 섞어도 95%를 유지하니 강건하다\"고 주장한다. 적대적 예제의 관점에서 이 주장의 허점을 설명하고, 강건성을 제대로 평가하고 높이는 방법을 제안하라.",
      answer: md`
무작위 노이즈에 대한 성능은 평균적인 교란에 대한 성적일 뿐, 최악의 교란에 대한 보장이 아니다. 무작위 노이즈는 방향이 무작위라 로짓에 주는 효과가 서로 상쇄되지만, FGSM처럼 입력 기울기의 부호로 맞춘 노이즈는 같은 크기에서도 모든 항이 같은 방향으로 더해져 $\varepsilon\lVert w\rVert_1$만큼 로짓을 움직이고, 고차원 이미지에서는 이 값이 매우 크다(실습의 모델에서도 같은 크기의 교란에서 무작위 노이즈는 정확도 0.965를 유지했지만 FGSM은 0.646까지 떨어뜨렸다). 따라서 강건성은 허용 교란 크기 $\varepsilon$를 정하고 FGSM보다 강한 PGD 같은 반복 공격으로 측정한 정확도로 보고해야 한다. 강건성을 높이는 방법으로는 학습 중 PGD 적대적 예제를 섞는 적대적 학습이 가장 믿을 만하며, 깨끗한 데이터의 정확도가 조금 떨어지는 것과 학습 비용이 늘어나는 것을 함께 보고한다.
`,
      keyPoints: ["무작위 노이즈에 대한 강건성은 최악의 경우 강건성이 아니다", "기울기 부호로 맞춘 노이즈의 효과가 차원에 비례", "PGD 등 강한 공격으로 허용 교란 크기를 명시해 평가", "적대적 학습과 그 대가"],
    },
  ],
  references: [
    { title: "Goodfellow, Shlens & Szegedy (2015) — Explaining and Harnessing Adversarial Examples", url: "https://arxiv.org/abs/1412.6572", note: "선형성 가설과 FGSM (영문)" },
    { title: "Madry et al. (2018) — Towards Deep Learning Models Resistant to Adversarial Attacks", url: "https://arxiv.org/abs/1706.06083", note: "PGD와 적대적 학습 (영문)" },
  ],
});
