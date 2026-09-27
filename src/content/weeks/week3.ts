import type { WeekMeta } from "../types";
import sections from "../sections/week3";

const week3: WeekMeta = {
  slug: "week-3",
  number: 3,
  phase: "2부 · 딥러닝",
  title: "신경망과 역전파 (Backpropagation)",
  subtitle: "MLP, 활성화, 연쇄법칙, 계산 그래프, SGD/Adam, PyTorch",
  difficulty: 4,
  keywords: ["MLP", "활성화", "연쇄법칙", "계산 그래프", "SGD/Adam", "PyTorch", "Autograd", "GPU/CUDA"],
  objectives: [
    "MLP의 순전파를 행렬식으로 쓰고 차원을 추적한다.",
    "연쇄법칙으로 역전파를 유도하고 계산 그래프로 설명한다.",
    "자동미분 엔진(micrograd)을 직접 구현한다.",
    "SGD, Momentum, Adam의 차이를 설명한다.",
    "수치미분(gradient check)으로 역전파 구현의 정확성을 검증한다.",
    "PyTorch의 Tensor/Autograd/nn.Module/optimizer가 지금까지 손으로 구현한 backprop·경사하강법의 어느 부분을 대신하는지 정확히 대응시켜 설명한다.",
    "GPU/CUDA가 신경망 학습을 병렬화로 가속하는 원리와 mixed precision의 이점을 설명한다.",
  ],
  learningOrder: [
    "필수 — [Karpathy: The spelled-out intro to neural networks and backpropagation (micrograd)](https://karpathy.ai/zero-to-hero.html) — 반드시 손으로 따라 코딩하며 볼 것",
    "[CS231n Notes: Backpropagation, Intuitions](https://cs231n.github.io/optimization-2/)",
    "[3Blue1Brown Neural Networks](https://www.3blue1brown.com/topics/neural-networks) 3~4편(역전파)",
    "[Michael Nielsen, Neural Networks and Deep Learning](http://neuralnetworksanddeeplearning.com/chap2.html) 2장",
  ],
  conceptsMd: `
지난 두 주 동안 우리는 학습이라는 것을 "손실 $L(\\theta)$를 최소화하는 $\\theta$를 찾는 일"이라고 정의했고, 그 방향을 찾는 도구로 경사하강법 $\\theta \\leftarrow \\theta - \\eta \\nabla L$을 배웠다(말로 읽으면 "새 파라미터 $\\theta$는, 기존 파라미터에서 학습률 $\\eta$만큼 기울기 $\\nabla L$ 방향으로 뺀 값이다"). 그런데 정작 가장 실무적인 질문 하나를 미뤄뒀다. 파라미터가 열 개도 아니고 수백만, 어떤 모델은 수천억 개나 되는데, 그 각각에 대한 기울기 $\\nabla L$을 대체 어떻게 계산한다는 말인가? 손으로 하나하나 미분해서 코드를 짜는 일은 상상만 해도 끔찍하고 사실상 불가능하다. 이번 주에 배울 역전파(backpropagation, 손실이 발생한 뒤 그 원인을 거꾸로 되짚어가며 "각 파라미터가 손실에 얼마나 책임이 있는지"를 계산해내는 절차라는 뜻)가 바로 이 문제에 대한 답이다. 그리고 놀랍게도 그 답은 이미 여러분이 알고 있는 도구 하나로 완성된다 — 고등학교에서 스치듯 배운 연쇄법칙(chain rule, "y가 z에 의해 정해지고 z가 다시 x에 의해 정해질 때, x가 바뀌면 y가 얼마나 바뀌는지는 중간 단계 z를 거쳐 곱셈으로 이어붙일 수 있다"는 미분의 규칙)이다.

:::info 이번 주의 흐름
1~2단계에서 신경망과 역전파를 수식과 손계산으로 이해하고, 3~4단계에서 그것을 백 줄짜리 자동미분 엔진으로 직접 구현한다. 5~7단계는 실제로 깊은 망을 학습시킬 때 부딪히는 문제(최적화기, 초기화, 정규화)를, 8~9단계는 지금까지 손으로 한 일을 PyTorch가 어떻게 대신하는지를 다룬다. 이 사이트의 브라우저 실행 환경에는 PyTorch가 없으므로, PyTorch 코드는 "Colab에서 실행" 표시가 붙은 읽기용 코드로 제공하고, 같은 원리를 NumPy로 브라우저에서 직접 돌려보는 실습을 함께 둔다.
:::

## 뉴런과 MLP, 활성화 함수 {#neurons-mlp}

1주차에서 행렬-벡터 곱 $Wx$를 "입력을 새로운 좌표계로 옮기는 변환"이라고 했던 것을 기억하는가? MLP(다층 퍼셉트론)는 이 변환을 여러 번 겹쳐 쌓은 구조다. 그런데 여기 함정이 하나 있다. 두 선형 변환 $W_2(W_1x+b_1)+b_2$를 전개하면 $(W_2W_1)x + (W_2b_1+b_2)$가 되어, 결국 하나의 가중치 행렬($W_2W_1$)과 하나의 편향($W_2b_1+b_2$)으로 표현되는 단일 선형 변환과 수학적으로 동일하다. 즉 비선형 함수 없이 선형 계층을 아무리 많이 쌓아도 표현 가능한 함수 집합은 1층 선형모델과 정확히 같다. 그래서 층과 층 사이에 비선형 함수, 즉 활성화 함수(activation function) $\\phi$를 끼워 넣어야 위 항등식이 성립하지 않게 되고, 그 결과 층 수만큼 표현력이 실제로 늘어난다. ReLU처럼 음수를 0으로 사상(mapping)하는 단순한 비선형 함수 하나만 있어도, 층을 쌓을수록 구간별 선형함수(piecewise linear function)로서의 조각(구간) 수가 지수적으로 늘어나 임의로 복잡한 결정경계나 곡면을 근사할 수 있는 표현력을 얻는다.

[[diagram:mlp-diagram]]

\`\`\`math
h = \\phi(W_1 x + b_1),\\;\\; W_1 \\in \\mathbb{R}^{4\\times 3} \\qquad \\hat y = W_2 h + b_2,\\;\\; W_2 \\in \\mathbb{R}^{1\\times 4} \\qquad \\phi \\in \\{\\mathrm{ReLU}(z) = \\max(0, z),\\ \\tanh,\\ \\mathrm{GELU}, \\dots\\}
\`\`\`

말로 읽으면 "은닉층 $h$는, 입력 $x$를 행렬 $W_1$으로 변환하고 편향 $b_1$을 더한 값에 비선형 함수 $\\phi$를 적용한 것이다. 출력 $\\hat y$는 그 $h$를 다시 $W_2$로 변환하고 $b_2$를 더한 것이다"라는 뜻이다. 입력이 3차원, 은닉층이 4차원이므로 $W_1$은 $4\\times 3$이다 — 행렬의 모양만 봐도 층의 입출력 크기를 읽어낼 수 있다. 기호만 보면 막막하니, 입력이 딱 2개인 아주 작은 뉴런 하나로 숫자를 직접 넣어보자. 가중치 $w_1=0.5, w_2=-1$, 편향 $b=0.1$, 입력 $x_1=2, x_2=1$이라 하면, 이 뉴런의 pre-activation(활성화 함수를 통과하기 전 값) z는 각 입력에 자신의 가중치를 곱해 전부 더하고 편향을 더한 것이다.

\`\`\`math
z = w_1x_1 + w_2x_2 + b = (0.5\\times 2) + (-1\\times 1) + 0.1 = 1 - 1 + 0.1 = 0.1
\`\`\`

여기에 활성화 함수로 ReLU를 적용하면 $\\phi(z)=\\max(0, 0.1)=0.1$이 그대로 이 뉴런의 출력이 된다. 만약 $b=-0.5$였다면 $z=1-1-0.5=-0.5$가 되어 ReLU를 통과한 뒤 출력은 $\\max(0,-0.5)=0$, 즉 이 뉴런은 "꺼진다". MLP는 이런 뉴런을 가로로 여러 개(예: 4개) 늘어놓아 한 층을 만들고, 그 층을 세로로 여러 번 쌓은 구조일 뿐이다 — 뉴런 하나의 계산이 무엇인지만 정확히 알면, 층이 아무리 많아져도 같은 계산이 반복될 뿐이다.

\`\`\`image
src: /images/week3/ann.svg
alt: 입력층, 은닉층, 출력층으로 구성된 인공신경망의 구조도
caption: 원 하나하나가 뉴런, 화살표 하나하나가 가중치를 가진 연결이다. 입력층의 정보가 은닉층을 거쳐 출력층까지 앞으로만 흐르는 구조를 순전파(feedforward)라 부른다.
credit: Cburnett, CC BY-SA 3.0, Wikimedia Commons
width: 560
height: 500
\`\`\`

$\\phi$ 자리에 넣을 수 있는 함수는 ReLU 하나만이 아니다. 최근 Transformer 계열 모델(5~7주차에서 BERT, GPT를 다룰 때 다시 만난다)에서 기본값으로 자주 쓰이는 활성화 함수가 GELU(Gaussian Error Linear Unit)다. GELU는 입력 x에 "표준정규분포를 따르는 확률변수가 x보다 작을 확률" $\\Phi(x)$를 곱한 값으로 정의된다.

\`\`\`math
\\text{GELU}(x) = x\\,\\Phi(x) = x\\cdot \\dfrac{1}{2}\\left[1+\\text{erf}\\!\\left(\\dfrac{x}{\\sqrt{2}}\\right)\\right]
\`\`\`

말로 읽으면 "GELU(x)는 입력 x에, x가 표준정규분포에서 뽑은 값보다 클 확률(0~1 사이의 숫자)을 곱한 것이다"라는 뜻이다. 예를 들어 x가 아주 큰 양수면 $\\Phi(x)\\approx 1$이라서 GELU(x) $\\approx$ x(거의 그대로 통과), x가 아주 작은 음수면 $\\Phi(x)\\approx 0$이라서 GELU(x) $\\approx$ 0(거의 차단)에 가까워진다 — ReLU와 큰 방향은 같지만 경계가 뚝 끊기지 않고 확률만큼 부드럽게 깎인다는 점이 다르다. erf(에러 함수, error function)는 확률·통계에서 표준정규분포의 누적 확률을 구할 때 쓰는 특수 함수라는 정도만 알아두면 된다.

오차함수 erf를 직접 계산하기 번거로우므로 실무에서는 다음과 같은 tanh 근사식을 대신 쓰는 경우가 많다(PyTorch의 \`nn.GELU(approximate="tanh")\`가 바로 이 근사식을 계산한다).

\`\`\`math
\\text{GELU}(x) \\approx 0.5x\\left(1+\\tanh\\!\\left[\\sqrt{2/\\pi}\\,(x+0.044715x^3)\\right]\\right)
\`\`\`

말로 읽으면 "GELU(x)는 대략, x의 절반에 (1 + tanh에 어떤 식을 넣은 값)을 곱한 것과 같다"는 뜻이다. erf를 직접 계산하는 대신 tanh라는 계산하기 쉬운 함수로 거의 같은 모양의 곡선을 흉내 낸 것뿐이므로, 정확한 유도 과정을 외울 필요는 없다.

ReLU $=\\max(0,x)$와 비교하면 차이가 뚜렷하다. ReLU는 x=0에서 미분이 불연속(왼쪽 미분 0, 오른쪽 미분 1)이고, 음수 구간에서는 출력과 미분이 정확히 0이라서 입력이 아주 살짝만 음수여도 그 뉴런은 통째로 죽어버린다(6단계에서 다룰 죽은 ReLU 문제). 반면 GELU는 모든 구간에서 매끄럽게(무한히 미분 가능하게) 이어지고, 입력이 음수라도 완전히 0으로 끊어버리지 않고 $\\Phi(x)$라는 확률만큼 깎아서 조금씩 흘려보낸다 — "이 뉴런의 값을 얼마나 통과시킬지"를 0 또는 1의 이진 선택이 아니라 연속적인 확률적 가중치로 결정하는 셈이다. 이 매끄러움 덕분에 아주 깊은 Transformer를 학습시킬 때 ReLU보다 기울기가 더 안정적으로 흐른다는 것이 실험적으로 널리 보고되어 있다.

:::info 보편 근사 정리
충분히 넓은 1개 은닉층 MLP는 임의의 연속함수를 근사할 수 있다(단, 학습 가능성을 보장하진 않는다). 즉 "표현할 수 있다"는 것과 "경사하강법으로 실제로 찾아낼 수 있다"는 것은 전혀 다른 문제다 — 층을 더 깊게 쌓는 이유 중 하나는, 넓지만 얕은 망보다 깊은 망이 실제로 학습이 더 잘 되는 경우가 많기 때문이다.
:::

[[practice]]

### 실습 — "비선형이 없으면 여러 층 = 한 층"을 숫자로 확인하기

활성화 함수 없이 두 층을 쌓은 결과가 정말로 행렬 하나($W_2W_1$)와 편향 하나로 똑같이 재현되는지, 그리고 ReLU를 넣으면 그 등식이 깨지는지 확인해보자. 마지막으로 ReLU와 GELU의 값을 몇 점에서 비교한다.

\`\`\`python
import numpy as np
from math import erf, sqrt

rng = np.random.default_rng(0)
x = rng.normal(size=3)                                   # 입력 3차원
W1, b1 = rng.normal(size=(4, 3)), rng.normal(size=4)      # 은닉 4차원
W2, b2 = rng.normal(size=(1, 4)), rng.normal(size=1)      # 출력 1차원

two_linear = W2 @ (W1 @ x + b1) + b2                     # 비선형 없이 두 층
W, b = W2 @ W1, W2 @ b1 + b2                             # 하나의 행렬 W와 편향 b로 합친 것
one_linear = W @ x + b
print("두 선형층:", two_linear, " 합친 한 층:", one_linear, " 같은가?", np.allclose(two_linear, one_linear))

with_relu = W2 @ np.maximum(0, W1 @ x + b1) + b2           # 사이에 ReLU를 끼우면?
print("ReLU를 넣은 결과:", with_relu, " 한 층과 같은가?", np.allclose(with_relu, one_linear))

def gelu(v):
    return v * 0.5 * (1 + erf(v / sqrt(2)))
for v in [-3, -1, -0.5, 0, 0.5, 1, 3]:
    print(f"x={v:>4}: ReLU={max(0, v):5.2f}, GELU={gelu(v):6.3f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 비선형이 없으면 두 결과가 \`True\`로 같고, ReLU를 넣으면(대부분의 난수에서) \`False\`가 된다. GELU는 $x=-1$에서 약 $-0.159$, $x=-0.5$에서 약 $-0.154$로 음수 구간에서도 0이 아닌 작은 값을 흘려보내고, 큰 양수에서는 $x$와 거의 같다. **해볼 것:** \`W1\`, \`W2\`의 모양을 바꿔(예: 은닉 10차원) 같은 실험을 해보자. 은닉층이 아무리 넓어도 비선형이 없으면 결과가 한 층과 같다는 사실이 유지되는가?
:::

## 역전파 = 연쇄법칙의 효율적 적용 {#backprop}

본격적인 정의에 들어가기 전에, 아주 작은 숫자로 감을 먼저 잡아보자. $u=w\\times x$ 라는 계산 하나만 놓고 보면, $w$가 아주 조금(0.001) 커질 때 $u$는 $x$배만큼 커진다 — 이것이 미분 $du/dw=x$의 의미다. 그런데 이 u가 다시 다음 계산의 재료로 쓰여 최종적으로 손실 L을 만든다면, "w가 조금 커졌을 때 L이 얼마나 변하는가"는 두 단계를 거쳐야 한다. 먼저 "w가 커지면 u가 얼마나 커지는가"($du/dw$), 그다음 "u가 커지면 L이 얼마나 커지는가"($dL/du$). 연쇄법칙은 이 두 변화율을 그냥 곱하면 된다고 말해준다: $dL/dw = (dL/du)\\times(du/dw)$. 역전파는 이 곱셈을, 신경망 전체의 수백만 개 파라미터에 대해 딱 한 번의 계산으로 몽땅 끝내버리는 방법이다. 아래에서 이것을 정확한 알고리즘으로 정의한다.

역전파(backpropagation)를 알고리즘으로 정의하면 다음과 같다. 신경망의 순전파는 입력 x로부터 손실 L까지 이어지는 하나의 계산 그래프(computational graph, 쉬운 말로: 복잡한 수식을 덧셈·곱셈 같은 작은 계산 단위 하나하나로 쪼개서, 어떤 계산 결과가 다음 계산의 재료로 쓰이는지를 화살표로 이어 그린 그림)를 구성하며, 이 그래프의 각 노드는 자신의 입력에 대한 국소 미분(local gradient, 쉬운 말로: 전체 그림은 몰라도 되고 "내 바로 앞 입력이 살짝 바뀌면 내 출력이 얼마나 바뀌는가"라는, 그 노드 하나만의 좁은 범위의 미분값)만을 계산할 수 있다. 역전파는 출력 노드(L)에서 시작해 이 계산 그래프를 위상정렬(topological sort, 쉬운 말로: 그래프의 모든 노드를 한 줄로 세우되 "화살표가 나가는 노드가 화살표를 받는 노드보다 항상 앞에 오도록" 순서를 매기는 방법 — 여기서는 그 줄을 거꾸로 세워 손실 쪽에서 입력 쪽 순서로 방문한다)의 역순으로 순회하면서, 연쇄법칙(chain rule) $\\dfrac{\\partial L}{\\partial \\theta} = \\dfrac{\\partial L}{\\partial z}\\cdot\\dfrac{\\partial z}{\\partial \\theta}$에 따라 상류에서 이미 계산되어 내려온 기울기 $\\dfrac{\\partial L}{\\partial z}$와 현재 노드가 자기 혼자 책임지는 국소 미분 $\\dfrac{\\partial z}{\\partial \\theta}$를 곱해 하류(입력 쪽) 노드로 전달하는 알고리즘이다. 말로 읽으면 "$\\theta$가 손실 $L$에 미치는 영향은, $\\theta$가 $z$에 미치는 영향과 $z$가 $L$에 미치는 영향을 곱한 것과 같다"는 뜻이다. 그래프에 속한 모든 파라미터 $\\theta$에 대해 이 곱셈을 한 번씩만 수행하면, 그래프 전체를 단 한 번 역방향으로 순회하는 것만으로 $\\dfrac{\\partial L}{\\partial \\theta}$ 전부가 계산된다.

그런데 역전파를 두고 "그냥 연쇄법칙 아니냐"는 말을 자주 듣는다. 맞는 말이다. 역전파 안에 새로운 수학은 없다. 그렇다면 왜 이 알고리즘 하나가 1986년 논문 이후 인공지능의 역사를 바꿔놓았다고까지 평가받을까? 답은 효율성에 있다. 순진하게 접근하면, 파라미터가 백만 개일 때 각각에 대한 기울기를 구하려고 그 파라미터 하나만 살짝 흔들어서 손실이 얼마나 변하는지를 백만 번 따로 계산해야 할 것 같다(이것이 실제로 뒤에서 배울 수치미분 방식이고, 이 방식은 파라미터 개수만큼 순전파를 반복해야 한다). 그러나 역전파는 다르다. 순전파를 딱 한 번 해서 최종 출력을 얻고 나면, 그 계산 그래프를 거꾸로 한 번만 훑는 것만으로 모든 파라미터에 대한 기울기가 동시에 나온다. 순전파 한 번과 거의 같은 비용으로, 역전파 한 번에 수백만 개의 기울기를 한꺼번에 얻는다는 뜻이다. 이 "계산을 재사용해서 얻는 효율성"이 없었다면, 오늘날의 거대 언어 모델은 애초에 학습 자체가 불가능했을 것이다. 연쇄법칙이라는 재료는 새롭지 않았지만, 그것을 계산 그래프 위에서 체계적이고 효율적으로 적용하는 하나의 알고리즘으로 정리해낸 것이 역전파의 진짜 기여다.

이 아이디어를 구체적인 그림으로 만들어보자. 계산 그래프(computational graph)는 복잡한 수식을 덧셈, 곱셈, ReLU 같은 단순한 연산 노드들로 분해하고, 각 노드의 출력을 다음 노드의 입력으로 연결한 방향성 비순환 그래프(DAG, directed acyclic graph)다. 순전파는 이 그래프를 위상정렬 순서대로 순회하면서 입력 쪽 노드부터 출력 쪽 노드(손실 L)까지 각 노드의 값을 차례로 계산해 나가는 과정이다. 역전파는 이 순회 순서를 정확히 뒤집는다. 손실 노드 L에서 시작해 위상정렬의 역순으로 그래프를 순회하면서, 각 노드가 자신의 국소 미분과 상류(출력에 더 가까운 쪽)에서 전달된 기울기를 곱해 하류(입력 쪽) 노드로 넘겨주는 방식으로, 그래프에 있는 모든 노드에 대해 $\\partial L/\\partial(\\text{노드 값})$을 계산한다.

[[diagram:computational-graph]]

이 "책임을 거슬러 나눠주는 과정"을 수식으로 정리하면, x가 y를 거쳐 L에 영향을 준다고 할 때 다음과 같은 사슬 모양이 된다.

\`\`\`math
\\dfrac{dL}{dx} = \\dfrac{dL}{dy}\\cdot\\dfrac{dy}{dx}
\`\`\`

말로 읽으면 "x가 L에 미치는 영향은, x가 y에 미치는 영향과 y가 L에 미치는 영향을 곱한 것과 같다"는 뜻이다. 여기서 $\\dfrac{dL}{dy}$는 이미 상류(더 나중 단계)에서 계산되어 내려온 값이고, $\\dfrac{dy}{dx}$는 지금 이 노드가 자기 혼자서만 책임지면 되는 국소 미분(local gradient)이다. 계산 그래프의 모든 노드가 이 곱셈 한 번씩만 반복하면서 입력까지 거슬러 올라가는 것, 그것이 역전파의 전부다.

핵심 규칙은 세 가지뿐이다. 덧셈 노드(z=a+b)를 지날 때는 위에서 내려온 기울기를 아무 변형 없이 양쪽 입력에 그대로 나눠준다 — 덧셈은 서로의 크기에 영향을 주지 않기 때문이다. 곱셈 노드(z=a·b)를 지날 때는 자기 몫을 계산할 때 상대방의 값을 곱해서 전달한다. a의 기울기를 구하려면 b가 얼마나 컸는지가 곱해져야 하는데, 직관적으로 생각해보면 b가 0이었다면 애초에 a를 아무리 키워도 z는 전혀 변하지 않았을 것이다. max 노드(ReLU 등)는 승자독식이다 — 실제로 그 값을 통과시킨 쪽에만 기울기를 온전히 전달하고, 선택받지 못한 쪽에는 기울기를 0으로 끊어버린다. 이 세 규칙만 있으면 아무리 복잡한 신경망도 노드 단위로 쪼개서 기계적으로 미분할 수 있다. 그리고 각 노드는 자기 바로 옆의 국소 미분(local gradient)만 알면 된다는 점이 핵심이다 — 전체 함수가 아무리 복잡해도 개별 노드 입장에서는 "내 입력이 바뀌면 내 출력이 얼마나 바뀌는가"라는 아주 단순한 질문에만 답하면 되고, 나머지는 연쇄법칙이 자동으로 이어붙여준다. 이것이 PyTorch 같은 프레임워크의 autograd가 작동하는 원리이자, 새로운 연산 하나를 추가하고 싶을 때 그 연산의 순전파와 국소 미분(backward) 한 쌍만 정의하면 되는 이유다.

:::example 예제 — $L = (w\\cdot x + c)^2$ 을 손으로 역전파해보기
w=2, x=3, c=1이라는 작은 숫자로 시작해서 순전파와 역전파를 한 단계씩 손으로 따라가 보자. 먼저 계산 그래프를 세 개의 노드로 쪼갠다. $u = w\\cdot x$ (곱셈), $v = u + c$ (덧셈), $L = v^2$ (제곱). 순전파(앞으로 계산): $u = 2\\times 3 = 6$, $v = 6+1 = 7$, $L = 7^2 = 49$. 이제 역전파를 시작한다. $\\dfrac{dL}{dL} = 1$에서 출발해서, $L=v^2$이므로 $\\dfrac{dL}{dv} = 2v = 2\\times 7 = 14$다. 덧셈 노드는 기울기를 그대로 나눠주므로 $\\dfrac{dL}{du} = 14$, $\\dfrac{dL}{dc} = 14$다. 곱셈 노드 u=w·x는 상대방 값을 곱해서 전달하므로 $\\dfrac{dL}{dw} = \\dfrac{dL}{du} \\times x = 14\\times 3 = 42$, $\\dfrac{dL}{dx} = \\dfrac{dL}{du} \\times w = 14\\times 2 = 28$이다. 검산해보자. w를 2에서 아주 조금(0.001) 늘리면 $u=2.001\\times 3=6.003$, v=7.003, $L=7.003^2\\approx 49.042$다. $\\Delta L\\approx 0.042$를 $\\Delta w=0.001$로 나누면 42에 가깝다 — 방금 손으로 구한 $\\dfrac{dL}{dw}=42$와 일치한다. 이렇게 "수치적으로 검산한다"는 습관이 6단계에서 배울 gradient check의 원리 그 자체다.
:::

이 규칙을 한 층 전체에 행렬로 적용하면 다음과 같다. z = Wx+b이고 상류에서 내려온 기울기를 $\\delta=\\dfrac{dL}{dz}$라 하면,

\`\`\`math
\\dfrac{\\partial L}{\\partial W} = \\delta x^\\top, \\qquad \\dfrac{\\partial L}{\\partial b} = \\delta, \\qquad \\dfrac{\\partial L}{\\partial x} = W^\\top \\delta
\`\`\`

가 된다. 말로 읽으면 "가중치 $W$가 받는 기울기는 상류 기울기 $\\delta$와 입력 $x$를 곱한 것, 편향 $b$가 받는 기울기는 $\\delta$ 그 자체, 입력 $x$가 받는 기울기(다음 층으로 더 내려보낼 몫)는 가중치를 뒤집어(전치) $\\delta$에 곱한 것"이라는 뜻이다. 1주차 「행렬 곱셈」 단계에서 예고했던 "$(AB)^\\top = B^\\top A^\\top$, 기울기는 전치된 형태로 거슬러 올라간다"가 바로 이 $W^\\top\\delta$다. 처음 보면 전치(transpose)가 왜 여기저기 붙는지 헷갈리기 쉬운데, 가장 믿을 만한 검증법은 차원(shape)이 맞는지 확인하는 것이다. $W$가 $4\\times 3$이면 x는 $3\\times 1$, z는 $4\\times 1$이어야 하고 $\\delta$도 $4\\times 1$이어야 하니, $\\dfrac{dL}{dW}$($4\\times 3$)를 만들려면 $\\delta$($4\\times 1$)와 $x^\\top$($1\\times 3$)를 곱해야 한다는 식으로 형태만 보고도 공식을 거꾸로 유추할 수 있다. 실제로 현업에서도 shape이 안 맞아서 나는 에러가 역전파 디버깅의 8할을 차지한다. 형태가 항상 일치하는지 확인하는 습관이 최고의 디버깅 습관이다.

다음 두 단계에서는 지금까지 배운 역전파를 실제로 동작하는 코드로 만든다. Andrej Karpathy가 만든 micrograd라는 아주 작은 자동미분 엔진을 그대로 따라 구현하는데, 겨우 백 줄 남짓한 이 코드 안에 PyTorch의 autograd가 하는 일의 핵심 원리가 전부 들어있다.

[[practice]]

### 실습 — 손 역전파를 수치미분으로 검산하기

본문 예제 $L = (w\\cdot x + c)^2$의 기울기를 역전파 규칙으로 계산하는 함수와, "살짝 흔들어서 재는" 수치미분 함수를 각각 만들어 비교해보자. 이어서 한 층 전체의 공식 $\\partial L/\\partial W = \\delta x^\\top$도 같은 방법으로 검산한다.

\`\`\`python
import numpy as np

def forward(w, x, c):
    return (w * x + c) ** 2

def backprop(w, x, c):
    u = w * x; v = u + c                   # 순전파 중간값
    dL_dv = 2 * v                          # 제곱 노드
    dL_du = dL_dv; dL_dc = dL_dv           # 덧셈 노드: 그대로 나눠줌
    dL_dw = dL_du * x; dL_dx = dL_du * w   # 곱셈 노드: 상대방 값을 곱함
    return dL_dw, dL_dx, dL_dc

def numerical(f, args, i, eps=1e-6):
    """i번째 인자만 ±eps 흔들어 중앙 차분으로 미분을 근사한다."""
    plus, minus = list(args), list(args)
    plus[i] += eps; minus[i] -= eps
    return (f(*plus) - f(*minus)) / (2 * eps)

args = (2.0, 3.0, 1.0)
print("역전파  :", backprop(*args))
print("수치미분:", tuple(round(numerical(forward, args, i), 4) for i in range(3)))

# 한 층 전체: z = W x, L = sum(z^2) 일 때 dL/dW = δ x^T (δ = dL/dz = 2z)
rng = np.random.default_rng(0)
W, x = rng.normal(size=(4, 3)), rng.normal(size=3)
z = W @ x
delta = 2 * z
grad_formula = np.outer(delta, x)           # (4,1) × (1,3) = (4,3)
grad_numeric = np.zeros_like(W)
for i in range(4):
    for j in range(3):
        Wp, Wm = W.copy(), W.copy()
        Wp[i, j] += 1e-6; Wm[i, j] -= 1e-6
        grad_numeric[i, j] = (np.sum((Wp @ x) ** 2) - np.sum((Wm @ x) ** 2)) / 2e-6
print("dL/dW 공식과 수치미분의 최대 차이:", np.abs(grad_formula - grad_numeric).max())
print("shape:", grad_formula.shape, "== W.shape", W.shape)
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 역전파 \`(42.0, 28.0, 14.0)\`과 수치미분 \`(42.0, 28.0, 14.0)\`이 일치하고, 한 층 공식과 수치미분의 최대 차이는 $10^{-6}$ 이하, shape은 \`(4, 3)\`. **해볼 것:** 본문 퀴즈처럼 $w=-1, x=4, c=2$로 바꿔 손으로 먼저 계산한 뒤 코드로 확인하자. \`backprop\`의 곱셈 노드에서 \`* x\`와 \`* w\`를 실수로 바꿔 쓰면 수치미분 비교가 어떻게 버그를 잡아내는가?
:::

## 자동미분 엔진을 읽기 위한 파이썬 문법 {#python-for-autograd}

다음 단계의 자동미분 엔진(백 줄 남짓)은 지금까지 이 스터디에서 쓴 파이썬보다 훨씬 진한 문법을 한꺼번에 쓴다는 점이다. AI 개념(역전파)과 파이썬 문법(클래스, 클로저, 재귀)이 뒤엉켜 있으면 어느 쪽도 제대로 안 보이니, 둘을 완전히 분리해서 문법만 먼저 짧게 익히고 넘어가자. 아래 다섯 개는 모두 독립적으로 실행되는 미니 예제이니, 하나씩 직접 실행 버튼을 눌러 결과를 확인하고 다음으로 넘어가라.

**① 클래스(class)와 \`__init__\`.** 클래스는 "같은 모양의 데이터와 동작을 여러 개 찍어내는 설계도"다. \`class Dog:\`로 설계도를 선언하고, \`__init__\`은 그 설계도로 실제 객체(인스턴스)를 만들 때 가장 먼저 자동으로 실행되는 특별한 메서드(생성자)다. \`self\`는 "지금 만들어지고 있는 바로 그 객체 자신"을 가리키는 이름이고, \`self.name = name\`은 "이 객체 안에 name이라는 이름표를 붙여서 값을 저장해둔다"는 뜻이다. 이렇게 저장해두면 나중에 \`d.name\`처럼 점(.)을 찍어 언제든 꺼내 쓸 수 있다.

\`\`\`python
class Dog:
    def __init__(self, name):   # 객체가 만들어질 때 자동 실행
        self.name = name        # self에 name 값을 저장
    def bark(self):
        return f"{self.name}: 멍멍!"

d = Dog("바둑이")   # __init__(self=d, name="바둑이")가 자동 호출됨
print(d.name)
print(d.bark())
\`\`\`

**② 연산자 오버로딩 — \`__add__\`, \`__mul__\`.** 파이썬은 \`a + b\`라는 코드를 만나면 실제로는 \`a.__add__(b)\`를 호출한다. 그래서 내가 만든 클래스 안에 \`__add__\`라는 메서드를 정의해두면, 내 객체끼리도 \`+\` 기호로 더할 수 있게 된다(이런 이름이 앞뒤로 밑줄 두 개씩 붙은 메서드를 "매직 메서드"라 부른다). \`__mul__\`은 똑같은 원리로 \`*\` 기호를 담당한다. 아래에서 \`p1 + p2\`는 사실 \`p1.__add__(p2)\`가 실행된 것이다.

\`\`\`python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __add__(self, other):              # a + b  ⟶  a.__add__(b)
        return Point(self.x + other.x, self.y + other.y)
    def __repr__(self):                    # print()가 객체를 예쁘게 보여줄 때 사용
        return f"Point({self.x}, {self.y})"

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1 + p2)   # Point(4, 6)
\`\`\`

**③ 클로저(closure) — 함수 안에 함수, 그리고 기억.** 파이썬에서는 함수 안에 또 다른 함수(중첩 함수)를 정의할 수 있고, 그 안쪽 함수는 자신을 둘러싼 바깥 함수의 변수를 계속 "기억"한다. 아래 \`add\`는 \`make_adder\`가 이미 끝난 뒤에도 \`n\`이라는 값을 계속 기억하고 있다 — 이렇게 바깥 변수를 기억하는 함수를 클로저라 부른다. Value 클래스의 \`_backward\`가 바로 이 패턴이다. \`__add__\`가 실행되는 시점에는 최종 결과(out.grad)가 아직 없으니, "나중에 out.grad가 준비되면 이렇게 계산해라"는 방법만 클로저로 포장해서 저장해두고, 실제 실행은 뒤로 미룬다.

\`\`\`python
def make_adder(n):
    def add(x):      # 바깥 함수의 변수 n을 그대로 기억하는 안쪽 함수
        return x + n
    return add        # add 함수 자체를 반환(아직 실행하지 않음)

add5 = make_adder(5)  # n=5를 기억하는 클로저가 만들어짐
print(add5(10))        # 나중에서야 실제로 실행: 10 + 5 = 15
\`\`\`

**④ 재귀 함수(recursion) — 자기 자신을 부르는 함수.** 함수가 자기 자신을 다시 호출하는 것을 재귀라 한다. 반드시 "더 이상 자기 자신을 부르지 않고 멈추는 조건"(base case)이 있어야 무한 반복에 빠지지 않는다. 아래 \`countdown\`은 n이 0이 되면 멈추고, 그 전까지는 n을 1씩 줄여가며 자기 자신을 계속 호출한다. Value.backward() 안의 \`build()\` 함수도 "이 노드를 만든 부모 노드들을 향해 자기 자신을 다시 호출"하는 재귀 함수다.

\`\`\`python
def countdown(n):
    if n == 0:          # 멈추는 조건(base case) — 이게 없으면 무한 재귀
        print("발사!")
        return
    print(n)
    countdown(n - 1)     # 자기 자신을 더 작은 문제로 다시 호출

countdown(3)   # 3, 2, 1, 발사! 순서로 출력
\`\`\`

**⑤ \`set\`, \`in\`, \`reversed()\`.** \`set\`(집합)은 리스트와 비슷하게 여러 값을 담지만 같은 값을 중복해서 넣어도 딱 한 번만 저장되고, \`in\`으로 "이 값이 이미 들어있는지"를 빠르게 확인할 수 있다. Value.backward()에서 \`seen\`이라는 set으로 "이미 방문한 노드"를 추적하는 것이 바로 이 용도다(같은 노드를 여러 번 방문해 중복 계산하는 것을 막는다). \`reversed()\`는 리스트의 순서를 거꾸로 뒤집어서 순회하게 해준다.

\`\`\`python
seen = set()
seen.add(1)
seen.add(1)   # 이미 있는 값이라 무시됨
seen.add(2)
print(seen, 1 in seen, 3 in seen)   # {1, 2} True False

nums = [1, 2, 3]
print(list(reversed(nums)))          # [3, 2, 1]
\`\`\`

이 다섯 가지 — 클래스/\`__init__\`, 연산자 오버로딩, 클로저, 재귀, set/reversed — 를 머릿속에 담아두고 다음 단계에서 진짜 Value 클래스를 읽는다. 코드 자체는 여전히 짧지만, 문법을 미리 알고 보면 훨씬 편하게 읽힐 것이다.

[[practice]]

### 실습 — 다섯 문법을 한 클래스에 모아보기

아래 \`Money\` 클래스는 \`+\`와 \`*\`를 지원하고, 연산 기록을 남기며, 기록을 재귀로 거꾸로 출력한다 — 다음 단계 Value 클래스의 축소판이다. 빈칸 없이 완성된 코드이니, 먼저 **실행 결과를 예측**한 뒤 실행해 비교하자.

\`\`\`python
class Money:
    def __init__(self, amount, parents=(), op=""):
        self.amount = amount
        self.parents = set(parents)        # ⑤ set: 나를 만든 객체들
        self.op = op

    def __add__(self, other):              # ② 연산자 오버로딩: a + b
        return Money(self.amount + other.amount, (self, other), "+")

    def __mul__(self, k):                  # ② a * 숫자
        return Money(self.amount * k, (self,), f"*{k}")

    def __repr__(self):
        return f"Money({self.amount})"

def make_tax(rate):                        # ③ 클로저: rate를 기억하는 함수를 돌려준다
    def tax(m):
        return m * rate
    return tax

def history(m, depth=0):                   # ④ 재귀: 부모를 따라 거슬러 올라간다
    print("  " * depth + f"{m} {m.op}")
    for p in m.parents:
        history(p, depth + 1)

a, b = Money(1000), Money(500)
vat = make_tax(1.1)
total = vat(a + b)
print(total)                               # 예상: Money(1650.0...) (부동소수점 오차가 조금 붙을 수 있다)
history(total)
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** \`Money(1650.0000000000002)\`처럼 1650에 가까운 값이 나오고(부동소수점 오차), \`history\`가 \`*1.1\` → \`+\` → 두 원래 금액 순서로 들여쓰기하며 출력된다. **해볼 것:** \`__sub__\`를 추가해 \`a - b\`가 되게 하고, \`history\`가 이미 출력한 객체는 다시 출력하지 않도록 \`seen\` 집합을 인자로 넘겨보자 — 다음 단계 \`backward()\`의 \`seen\`과 같은 역할이다.
:::

## 미니 자동미분 엔진(micrograd) 직접 구현하기 {#micrograd}

Value 클래스가 하는 일을 한 문장으로 요약하면, "숫자 하나(data)에 그 숫자가 어떻게 만들어졌는지에 대한 기억(_prev, _op)과, 자신에게 기울기가 도착했을 때 그것을 부모에게 어떻게 나눠줄지에 대한 지침서(_backward)를 함께 들고 다니는 객체"다. 여기서 눈여겨봐야 할 설계 포인트가 하나 있다. \`__add__\`나 \`__mul__\` 안에서 _backward를 지금 당장 실행하지 않고 나중에 실행할 함수로만 저장해둔다는 점이다(파이썬의 클로저 기능을 쓴 것이다). 왜 이렇게 할까? 순전파를 하는 시점에는 아직 이 노드의 출력이 최종 손실에 얼마나 기여할지(out.grad)를 알 수 없기 때문이다. 그 값은 순전파가 전부 끝나고 손실 L이 나온 뒤, 역전파가 거꾸로 이 노드까지 도달했을 때야 비로소 정해진다. 그래서 "어떻게 나눠줄지에 대한 계산 방법"만 미리 클로저로 포장해 저장해두고, 실제 계산은 그 정보(out.grad)가 준비된 나중 시점에 실행하는 것이다. 이것이 지연 계산(lazy evaluation)이고, PyTorch가 모든 텐서 연산 뒤에서 grad_fn을 저장해뒀다가 loss.backward() 호출 시점에야 순서대로 실행하는 것과 똑같은 아이디어다.

\`\`\`python
class Value:
    def __init__(self, data, _children=(), _op=""):
        self.data, self.grad = data, 0.0       # data: 이 노드의 실제 숫자값 / grad: dL/d(이 노드), 처음엔 0
        # _prev: 나를 만드는 데 쓰인 부모 Value들(set으로 저장 — 앞 단계 문법 ⑤)
        # _backward: "기울기가 도착하면 부모에게 어떻게 나눠줄지"를 담은 함수. 지금은 일단 아무것도 안 하는 함수(lambda: None)로 채워둔다
        self._prev, self._backward = set(_children), lambda: None

    def __add__(self, o):                       # self + o 를 실행하면 자동 호출됨(앞 단계 문법 ②)
        o = o if isinstance(o, Value) else Value(o)   # o가 그냥 숫자(5 등)면 Value로 감싸준다
        out = Value(self.data + o.data, (self, o), "+")   # 실제 덧셈. (self, o)를 _children으로 넘겨 부모 기록
        def _backward():                         # 클로저(앞 단계 문법 ③) — 지금은 정의만, 실행은 나중에 backward()가 함
            self.grad += out.grad                # 덧셈은 상류 기울기를 그대로 나눠준다(역전파 단계의 규칙)
            o.grad    += out.grad                # 양쪽 다 += 로 누적(아래 :::info 참고)
        out._backward = _backward                # 방금 만든 클로저를 out에 매달아둔다
        return out

    def __mul__(self, o):                        # self * o 를 실행하면 자동 호출됨
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data * o.data, (self, o), "*")
        def _backward():
            self.grad += o.data * out.grad       # 곱셈은 "상대방의 값"을 곱해서 전달(역전파 단계의 규칙)
            o.grad    += self.data * out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0, self.data), (self,), "relu")
        def _backward(): self.grad += (out.data > 0) * out.grad   # 승자독식: 양수만 기울기 통과, 음수는 0
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()          # topo: 위상정렬 결과를 쌓을 리스트 / seen: 이미 방문한 노드(중복 방지)
        def build(v):                    # 재귀 함수(앞 단계 문법 ④) — 후위순회로 위상정렬을 만든다
            if v not in seen:
                seen.add(v)
                for c in v._prev: build(c)   # 부모(자신을 만든 노드들)를 먼저 방문
                topo.append(v)                # 부모를 다 처리한 뒤에야 자기 자신을 추가
        build(self)                      # self(=최종 손실 L)부터 시작해 그래프 전체를 훑는다
        self.grad = 1.0                  # dL/dL = 1 에서 역전파 시작
        for v in reversed(topo):         # topo를 뒤집어 L → 입력 방향으로 순회(앞 단계 문법 ⑤ reversed())
            v._backward()                # 이제서야 각 노드의 클로저가 실제로 실행된다

a, b = Value(2.0), Value(-3.0)
L = (a*b + 10).relu()
L.backward(); print(a.grad, b.grad)   # 기대값: -3.0, 2.0
\`\`\`

backward() 메서드 안에서 topo 리스트를 만드는 부분이 왜 필요한지 짚고 넘어가자. 어떤 노드의 grad를 확정하려면, 그 노드를 입력으로 사용하는 모든 하류(downstream) 노드의 _backward()가 먼저 실행되어 out.grad가 전부 채워진 뒤여야 한다. grad는 한 노드가 여러 경로에 쓰였을 때 그 기여분이 +=로 누적되는 값이므로(아래 :::info 블록 참고), 하류 노드 중 하나라도 먼저 처리되지 않은 채로 값을 읽어버리면 아직 더해지지 않은 기여분이 누락된다. 위상정렬(topological sort)은 정확히 이 조건, 즉 그래프의 모든 간선 $(u \\rightarrow v)$에 대해 u가 v보다 먼저 나오도록 노드 전체를 한 줄로 정렬하는 알고리즘이다. build() 함수가 재귀로 자식(자신을 만드는 데 쓰인 부모 노드들)을 먼저 방문하고 나서야 자기 자신을 topo 리스트에 추가하는 것이 후위순회(post-order traversal)이며, 이것이 위상정렬 순서를 만들어내는 표준적인 구현 방법이다. 그 결과를 reversed()로 뒤집어 손실 L(topo의 맨 끝, 즉 그래프에서 가장 나중에 만들어진 노드)부터 시작해 입력 쪽(topo의 맨 앞)으로 순회하며 _backward()를 실행하면, 각 노드가 자신의 grad를 확정하는 시점에는 그 노드를 사용하는 모든 하류 노드의 _backward()가 이미 실행되어 out.grad 기여분이 전부 반영되어 있음이 보장된다.

위 코드의 a, b = Value(2.0), Value(-3.0) 예제를 직접 손으로 따라가 보자. a*b = -6, 여기에 10을 더하면 4, relu(4) = 4이므로 L.data = 4다. backward()를 부르면 L.grad = 1에서 시작해서, relu 노드는 out.data(=4)가 양수이므로 기울기 1을 그대로 통과시켜 (a*b+10)의 기울기도 1이 된다. 덧셈 노드는 기울기를 그대로 나눠주므로 a*b의 기울기도 1, 10의 기울기도 1이다. 곱셈 노드에서는 a.grad += b.data $\\times$ 1 = -3, b.grad += a.data $\\times$ 1 = 2가 되어, 코드 주석에 적힌 기대값 -3.0, 2.0과 정확히 일치한다.

:::info 주의
\`+=\` 로 기울기를 누적하는 이유 — 한 변수가 여러 경로에 쓰이면 기울기가 합산된다(다변수 연쇄법칙, fan-out gradient accumulation). 이를 \`=\`로 쓰면 어떤 버그가 생기는지는 실습에서 $y = x\\cdot x + x$로 직접 확인한다.
:::

[[practice]]

### 실습 — Value를 확장하고 gradient check로 검증하기

아래 셀은 본문의 Value에 \`__pow__\`(거듭제곱), \`__neg__\`/\`__sub__\`(뺄셈), \`tanh\`를 더한 버전이다. \`tanh\`의 \`_backward\`만 비어 있다(\`...\`). 국소 미분 $\\frac{d}{dz}\\tanh z = 1 - \\tanh^2 z$를 이용해 채운 뒤 실행하자. 아래쪽 검증 코드가 자동으로 수치미분과 비교해준다.

\`\`\`python
import math

class Value:
    def __init__(self, data, _children=(), _op=""):
        self.data, self.grad = data, 0.0
        self._prev, self._backward = set(_children), lambda: None

    def __add__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data + o.data, (self, o), "+")
        def _backward():
            self.grad += out.grad
            o.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data * o.data, (self, o), "*")
        def _backward():
            self.grad += o.data * out.grad
            o.grad += self.data * out.grad
        out._backward = _backward
        return out

    def __pow__(self, k):                       # k는 그냥 숫자(상수 지수)
        out = Value(self.data ** k, (self,), f"**{k}")
        def _backward():
            self.grad += k * self.data ** (k - 1) * out.grad    # d(x^k)/dx = k x^(k-1)
        out._backward = _backward
        return out

    def __neg__(self):  return self * -1
    def __sub__(self, o): return self + (-o if isinstance(o, Value) else Value(-o))
    def __radd__(self, o): return self + o      # 숫자 + Value 도 되도록
    def __rmul__(self, o): return self * o      # 숫자 * Value 도 되도록

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")
        def _backward():
            self.grad += (1 - t ** 2) * out.grad   # ← 이 줄이 d tanh/dz = 1 - tanh² 이다 (직접 지워보고 다시 써보자)
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for c in v._prev: build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()

# ── 검증 1: 뉴런 하나 tanh(w1*x1 + w2*x2 + b) 의 기울기를 수치미분과 비교 ──
def f(w1, w2, b, x1=2.0, x2=-1.0):
    return math.tanh(w1 * x1 + w2 * x2 + b)

vals = {"w1": 0.5, "w2": -0.3, "b": 0.1}
w1, w2, b = Value(vals["w1"]), Value(vals["w2"]), Value(vals["b"])
out = (w1 * 2.0 + w2 * -1.0 + b).tanh()
out.backward()
for name, v in [("w1", w1), ("w2", w2), ("b", b)]:
    plus, minus = dict(vals), dict(vals)
    plus[name] += 1e-6; minus[name] -= 1e-6
    num = (f(**plus) - f(**minus)) / 2e-6
    rel = abs(v.grad - num) / max(1e-12, abs(v.grad) + abs(num))
    print(f"{name}: 역전파 {v.grad:.6f}, 수치미분 {num:.6f}, 상대오차 {rel:.1e}", "✓" if rel < 1e-5 else "✗")

# ── 검증 2: 같은 변수를 여러 번 쓰는 식 y = x*x + x 에서 dy/dx = 2x + 1 ──
x = Value(3.0)
y = x * x + x
y.backward()
print("y = x*x + x, x=3 → dy/dx =", x.grad, "(기대값 7)")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 세 파라미터 모두 상대오차가 $10^{-9}$ 수준으로 ✓가 붙고, $y = x\\cdot x + x$의 기울기는 7이다. **해볼 것:** ① \`tanh\`의 \`_backward\` 줄을 \`self.grad += out.grad\`처럼 틀리게 바꾸면 검증 1이 어떻게 ✗를 띄우는지 확인하자. ② \`__add__\`와 \`__mul__\`의 \`+=\`를 \`=\`로 바꾸면 검증 2의 결과가 7이 아니라 얼마가 되는가? 왜 그 값이 나오는지 계산 그래프로 설명해보자.
:::

## 최적화기: SGD·Momentum·Adam {#optimizers}

1주차에서 배운 경사하강법을 미니배치 단위로 하는 것이 SGD(확률적 경사하강법)다. 매 스텝 미니배치로 추정한 기울기 $g$의 반대 방향으로 $\\theta \\leftarrow \\theta - \\eta g$만큼 이동하는 갱신 규칙이다. 그런데 미니배치마다 $g$의 추정값이 조금씩 달라지므로 스텝마다 기울기의 방향이 흔들리고, 손실 지형이 방향에 따라 곡률 차이가 큰(ill-conditioned) 좁고 긴 협곡 모양이면 SGD는 협곡의 좁은 축 방향으로는 스텝마다 부호가 바뀌며 진동하고 긴 축 방향으로는 느리게만 진행해 전체적으로 수렴이 비효율적이다. Momentum과 Adam은 이 문제를 서로 다른 방식으로 완화한다. Momentum은 현재 기울기 $g$뿐 아니라 이전 스텝들의 갱신 방향을 지수이동평균 $v$로 누적해서 사용한다($v \\leftarrow \\beta v + g,\\ \\theta \\leftarrow \\theta - \\eta v$). 그 결과 기울기의 방향이 스텝마다 일관되게 유지되는 축에서는 $v$가 계속 커져 이동량이 누적되고, 스텝마다 부호가 뒤바뀌는 축에서는 양(+)과 음(−) 성분이 서로 상쇄되어 $v$가 작게 유지되므로 진동이 줄어든다. Adam은 여기에 파라미터별 적응적 학습률(adaptive learning rate)을 추가한다. 각 파라미터마다 그동안의 기울기 제곱의 지수이동평균 $v$를 따로 추적해서, 기울기 제곱 평균이 큰(값이 자주 크게 변하는) 파라미터는 유효 학습률 $\\eta/\\sqrt{v}$가 작아지도록, 제곱 평균이 작은(거의 변하지 않는) 파라미터는 유효 학습률이 커지도록 파라미터마다 서로 다른 실질 보폭으로 갱신한다.

| 이름 | 갱신식 | 직관 |
| --- | --- | --- |
| SGD | $\\theta \\leftarrow \\theta - \\eta g$ | 미니배치로 근사한 기울기 방향으로 한 걸음 |
| Momentum | $v \\leftarrow \\beta v + g,\\ \\theta \\leftarrow \\theta - \\eta v$ | 지나온 방향을 누적해 일관된 방향은 가속, 진동은 상쇄 |
| Adam | $m \\leftarrow \\beta_1 m + (1-\\beta_1)g,\\ v \\leftarrow \\beta_2 v + (1-\\beta_2)g^2,\\ \\theta \\leftarrow \\theta - \\eta\\,\\hat m/(\\sqrt{\\hat v}+\\epsilon)$ | 파라미터별 적응 학습률 |

Adam의 갱신식을 수식으로 다시 풀어보면 다음과 같다. 먼저 1차 모멘트(방향의 관성) $m$과 2차 모멘트(기울기 크기의 제곱 평균) $v$를 각각 지수이동평균으로 갱신하고,

\`\`\`math
m_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t, \\qquad v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2
\`\`\`

말로 읽으면 "이번 스텝의 1차 모멘트 $m$은 이전 $m$의 대부분($\\beta_1$만큼)과 이번 기울기의 일부($1-\\beta_1$만큼)를 섞은 것이고, 2차 모멘트 $v$는 이전 $v$의 대부분($\\beta_2$만큼)과 이번 기울기 제곱의 일부($1-\\beta_2$만큼)를 섞은 것"이라는 뜻이다. 학습 초반에 $m, v$가 0에서 출발한 탓에 값이 실제보다 작게 잡히는 편향을 보정한 뒤, 그 보정된 값으로 파라미터를 갱신한다.

\`\`\`math
\\hat{m}_t = \\dfrac{m_t}{1-\\beta_1^t}, \\qquad \\hat{v}_t = \\dfrac{v_t}{1-\\beta_2^t}, \\qquad \\theta \\leftarrow \\theta - \\eta\\,\\dfrac{\\hat{m}_t}{\\sqrt{\\hat{v}_t}+\\epsilon}
\`\`\`

말로 읽으면 "보정된 $m$과 $v$($m_t, v_t$를 각각 $1-\\beta^t$로 나눈 값)를 구한 뒤, $\\theta$에서 "학습률 $\\eta$ 곱하기 보정된 $m$"을 "보정된 $v$의 제곱근 더하기 작은 값 $\\epsilon$"으로 나눈 만큼 뺀다"는 뜻이다. 분모의 $\\sqrt{\\hat{v}}$가 바로 "자주 크게 흔들리는 파라미터는 걸음을 작게" 만들어주는 장치다 — 그 파라미터의 기울기 제곱 평균이 크면 클수록 분모가 커져서 실제 걸음 폭은 줄어든다.

숫자를 넣어 첫 스텝(t=1)만 손으로 계산해보면 이 공식의 의도가 더 뚜렷하게 보인다. $m_0=v_0=0$에서 시작하고 $\\beta_1=0.9, \\beta_2=0.999, \\eta=0.1$이라 하자. 기울기 $g_1=5$가 들어왔다면, $m_1=(1-0.9)\\times 5=0.5$, $v_1=(1-0.999)\\times 5^2=0.025$다. 편향 보정을 하면 $\\hat m_1 = 0.5/(1-0.9^1) = 0.5/0.1 = 5$, $\\hat v_1 = 0.025/(1-0.999^1) = 0.025/0.001 = 25$가 되어, 놀랍게도 $\\hat m_1$과 $\\hat v_1$이 정확히 $g_1$과 $g_1^2$로 되돌아온다(이것이 편향 보정이 하는 일이다 — 첫 스텝에서 $m,v$가 0에서 출발한 티를 완전히 지워준다). 갱신량은 $\\eta\\,\\hat m_1/(\\sqrt{\\hat v_1}+\\epsilon) = 0.1\\times 5/(\\sqrt{25}+\\epsilon) = 0.1\\times5/5 = 0.1$이다. 이번엔 기울기가 $g_1=0.01$로 훨씬 작았다면 어떻게 될까? 같은 방식으로 계산하면 $\\hat m_1=0.01$, $\\hat v_1=0.0001$, 갱신량은 $0.1\\times 0.01/\\sqrt{0.0001} = 0.1\\times0.01/0.01=0.1$로 **똑같다.** 기울기가 5든 0.01이든 첫 스텝의 실제 이동 거리는 거의 $\\eta$ 하나로 결정된다는 뜻이다 — 이것이 "파라미터별 적응 학습률"의 핵심으로, 기울기의 절대 크기가 아니라 방향(부호)에 훨씬 더 의존해서 걸음을 내딛는다는 Adam의 성질을 숫자로 직접 보여준다.

실무에서는 특별한 이유가 없다면 Adam(또는 그 개선판인 AdamW)을 기본값으로 놓고 학습을 시작하는 경우가 많고, 자원이 충분할 때 SGD+Momentum으로 더 세밀하게 튜닝해 마지막 성능을 쥐어짜는 경우가 많다는 정도만 기억해두자.

[[practice]]

### 실습 — 좁고 긴 협곡에서 SGD·Momentum·Adam 경주시키기

1주차 마지막 실습의 $L(w_1, w_2) = (w_1 - 1)^2 + 10(w_2 + 2)^2$을 다시 가져오자. 두 방향의 가파름이 10배 달라서, 하나의 학습률로는 한쪽이 느리거나 다른 쪽이 발산했다. 세 최적화기를 같은 출발점에서 100스텝씩 돌려 비교한다.

\`\`\`python
import numpy as np

def loss(w):  return (w[0] - 1) ** 2 + 10 * (w[1] + 2) ** 2
def grad(w):  return np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])

def run(opt, lr, steps=100):
    w = np.array([5.0, 5.0])
    v = np.zeros(2); m = np.zeros(2); s = np.zeros(2)
    b1, b2, eps = 0.9, 0.999, 1e-8
    for t in range(1, steps + 1):
        g = grad(w)
        if opt == "SGD":
            w = w - lr * g
        elif opt == "Momentum":
            v = 0.9 * v + g
            w = w - lr * v
        elif opt == "Adam":
            m = b1 * m + (1 - b1) * g
            s = b2 * s + (1 - b2) * g ** 2
            m_hat, s_hat = m / (1 - b1 ** t), s / (1 - b2 ** t)
            w = w - lr * m_hat / (np.sqrt(s_hat) + eps)
    return w, loss(w)

for opt, lr in [("SGD", 0.01), ("Momentum", 0.01), ("SGD", 0.04), ("Adam", 0.1), ("Adam", 0.3)]:
    w, l = run(opt, lr)
    print(f"{opt:8s} lr={lr:<5}: 100스텝 후 w = {np.round(w, 3)}, loss = {l:.2e}")

# Adam 첫 스텝이 기울기 크기와 무관하게 약 lr만큼 움직이는지 확인 (본문 손계산)
for g1 in [5.0, 0.01]:
    m1, v1 = 0.1 * g1, 0.001 * g1 ** 2
    step = 0.1 * (m1 / 0.1) / (np.sqrt(v1 / 0.001) + 1e-8)
    print(f"g1={g1}: Adam 첫 스텝 이동량 = {step:.4f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** ① 같은 학습률 0.01에서 SGD는 완만한 $w_1$ 방향이 1.53까지밖에 못 가지만(loss 약 0.28), Momentum은 누적된 속도 덕분에 1.02 근처까지 간다(loss 약 0.004) — 같은 보폭이라면 관성이 큰 차이를 만든다. ② 그런데 학습률을 0.04로 잘 고른 SGD가 오히려 가장 정확하다(loss $10^{-6}$ 수준). 이렇게 단순한 2차 함수에서는 잘 튜닝된 SGD가 이긴다. ③ Adam은 두 방향을 기울기 크기로 나눠 비슷한 보폭으로 움직이지만, lr=0.3은 정답 근처에서 진동하고 lr=0.1은 100스텝으로 부족하다. Adam의 장점은 "기울기 스케일에 둔감해서 학습률을 덜 신경 써도 된다"이지 "항상 가장 빠르다"가 아니다 — 실무에서 Adam을 기본값으로 쓰고, 여유가 있으면 SGD+Momentum을 튜닝해 마지막 성능을 짜내는 이유다. Adam 첫 스텝 이동량은 두 경우 모두 0.1이다. **해볼 것:** Momentum의 계수 0.9를 0.99로 바꾸면 어떻게 되는가? 너무 큰 관성은 최솟값을 지나쳐 오래 진동하게 만든다는 것을 확인해보자.
:::

## 실전 이슈: 기울기 소실·폭발과 가중치 초기화 {#init-stability}

세 가지 실전 이슈를 짚고 넘어가자. 첫 번째는 기울기 소실과 폭발이다. sigmoid나 tanh처럼 입력이 조금만 커져도 출력이 거의 평평해지는 활성화 함수를 깊게 쌓으면, 연쇄법칙으로 기울기를 곱해나가는 과정에서 0에 가까운 국소 미분들이 계속 곱해져 맨 앞쪽 층에 도달할 때쯤에는 기울기가 사실상 0이 되어버린다(기울기 소실). 반대로 미분값이 1보다 큰 항들이 계속 곱해지면 기울기가 기하급수적으로 커져 학습이 발산해버리기도 한다(기울기 폭발). ReLU가 널리 쓰이는 이유 중 하나가 바로 이것이다 — 입력이 양수인 구간에서는 미분이 항상 1이라서, 이 구간에서는 기울기가 층을 지나도 줄어들거나 커지지 않고 그대로 전달된다. 다만 ReLU도 공짜는 아니다. 입력이 음수인 구간에서는 미분이 정확히 0이므로, 한번 음수 쪽으로 넘어가 버린 뉴런은 그 이후로 기울기를 전혀 받지 못해 영영 업데이트되지 않는 "죽은 ReLU(dead ReLU)" 현상이 생기기도 한다. 여기에 He/Xavier 초기화, 그리고 4주차에 배울 잔차 연결(residual connection)을 더하면 훨씬 깊은 네트워크도 안정적으로 학습시킬 수 있다.

\`\`\`image
src: /images/week3/activation-functions-comparison.svg
alt: sign, sigmoid, tanh, ReLU, Leaky ReLU 활성화 함수의 그래프를 나란히 비교한 그림
caption: sigmoid와 tanh는 입력의 절댓값이 커지면 곡선이 평평해져 미분값이 0에 가까워지는 구간(포화 구간)을 갖는 반면, ReLU는 입력이 양수인 구간에서 기울기가 항상 1로 일정하다. 이 차이가 위에서 설명한 기울기 소실 문제의 원인이자 ReLU가 널리 쓰이는 이유다.
credit: Andreas Maier, CC BY 4.0, Wikimedia Commons
width: 1058
height: 606
\`\`\`

두 번째는 초기화다. 가중치의 분산을 대략 $\\text{Var}(W) \\approx \\dfrac{2}{\\text{fan\\_in}}$ 정도로 맞추는 He 초기화가 ReLU 계열에서 널리 쓰인다(이 분산이 왜 하필 fan_in에 반비례해야 하는지, 그리고 이 값을 조금만 벗어나도 깊은 망에서 무슨 일이 벌어지는지는 아래에서 숫자로 직접 확인한다). 여기서 반드시 기억해야 할 것은, 가중치를 전부 0으로 초기화하면 절대 안 된다는 점이다. 모든 뉴런이 같은 값에서 출발하면 순전파 출력도 똑같고 역전파로 받는 기울기도 완전히 똑같아서, 학습을 아무리 반복해도 뉴런들이 서로 다른 특징을 배우지 못하고 끝까지 서로의 복사본처럼 움직인다(대칭성이 깨지지 않는 문제). 작은 무작위 값으로라도 흩뿌려서 시작해야 뉴런마다 서로 다른 방향으로 갈라져 나갈 수 있다.

세 번째는 gradient check이다. 역전파로 구현한 코드가 정말로 맞게 미분을 계산하고 있는지 확인하는 가장 확실한 방법은, 파라미터를 아주 조금($\\epsilon$) 흔들어서 손실이 얼마나 변하는지 직접 재보는 중앙 차분 수치미분과, 역전파가 내놓은 해석적 기울기를 나란히 비교하는 것이다.

\`\`\`math
\\frac{\\partial f}{\\partial \\theta} \\approx \\frac{f(\\theta + \\epsilon) - f(\\theta - \\epsilon)}{2\\epsilon}, \\qquad \\text{상대오차} = \\frac{|g_{\\text{역전파}} - g_{\\text{수치}}|}{|g_{\\text{역전파}}| + |g_{\\text{수치}}|}
\`\`\`

상대오차가 $10^{-5}$보다 작으면 구현이 맞다고 믿을 수 있다. 2단계와 4의 실습에서 이미 이 방법으로 손 역전파와 Value 클래스를 검증했다.

### 가중치 초기화의 수학: 분산이 왜 fan_in에 반비례해야 하는가

위에서 초기화를 짧게 지나쳤는데, 여기엔 사실 1주차에서 이미 확인한 원리 하나가 고스란히 숨어 있다. 한 뉴런의 출력(정확히는 활성화 함수를 통과하기 전의 값, pre-activation) z는 fan_in개의 "입력$\\times$가중치" 곱을 몽땅 더한 것이다. $z = w_1x_1 + w_2x_2 + \\cdots + w_{\\text{fan\\_in}}x_{\\text{fan\\_in}}$. 그런데 1주차 「연속 확률분포」 단계의 실습(균등분포 12개를 더하면 분산이 $12 \\times \\tfrac{1}{12} = 1$)에서 확인했듯, 서로 독립인 확률변수를 더하면 분산은 상쇄되지 않고 그냥 더해진다. $w_i$와 $x_i$가 평균 0이고 서로 독립이라고 가정하면 곱 하나의 분산은 $\\text{Var}(w)\\,\\text{Var}(x)$이고, 이런 항을 fan_in개 더한 z의 분산은 다음과 같다.

\`\`\`math
\\text{Var}(z) \\approx \\text{fan\\_in} \\cdot \\text{Var}(w) \\cdot \\text{Var}(x)
\`\`\`

말로 읽으면 "z의 분산은 대략, 입력 개수(fan_in) 곱하기 가중치 하나의 분산 곱하기 입력 하나의 분산과 같다"는 뜻이다. 예를 들어 fan_in=100, $\\text{Var}(w)=\\text{Var}(x)=1$이라면 $\\text{Var}(z) \\approx 100$이 되어 z의 표준편차는 $\\sqrt{100}=10$까지 불어난다 — 입력이 겨우 1의 표준편차였는데 층 하나만 지나도 10배로 커진다는 뜻이다. 즉 층 하나를 통과할 때마다 입력이 fan_in개씩 모여 더해지는 구조 그 자체가 분산을 fan_in배로 불려놓는 장치인 셈이다. 가중치 하나하나의 분산을 아무렇게나(예컨대 표준정규분포 그대로) 고정해두면, fan_in이 클수록 z의 분산은 계속 커지고, 그 z가 다음 층의 입력이 되어 또다시 fan_in배로 불어나기를 반복한다. 그래서 층이 바뀌어도 $\\text{Var}(z)$를 대략 일정하게 유지하려면, 가중치 하나의 분산을 미리 $\\text{Var}(w) \\approx 1/\\text{fan\\_in}$ 정도로 줄여둬야 한다 — fan_in배로 커지는 몫을 가중치 쪽에서 fan_in분의 1만큼 미리 깎아 상쇄하는 것이다.

:::example 예제 — 표준편차가 층마다 조금만 달라져도 10층을 지나면 무슨 일이 벌어지는가
초기화가 아주 조금만 어긋나도 그 효과가 층을 거듭할수록 기하급수적으로 누적된다는 것을 직접 계산해보자. 어떤 네트워크에서 각 층을 통과할 때마다 활성화의 표준편차가 정확히 1.5배씩 커진다고 하면(가중치 분산을 필요 이상으로 크게 잡은 경우), 10개 층을 통과한 뒤 표준편차는 처음의 $1.5^{10}$배가 된다. 계산해보면 $1.5^{10} = 59049/1024 \\approx$ **57.7배**다. 층 하나당 겨우 50% 커진 것뿐인데 10층을 지나면 원래 값의 거의 58배로 부풀어 있다는 뜻이고, 이것이 기울기 폭발(exploding gradient)이 실제로 벌어지는 방식이다. 반대로 표준편차가 층마다 0.8배씩(20%) 작아지는 경우는, 10층 뒤에 $0.8^{10} = 1048576/9765625 \\approx$ **0.107배**, 즉 원래 값의 10.7% 수준까지 쪼그라든다. 이것이 기울기 소실(vanishing gradient)이다.

층 깊이에 따라 이 효과가 얼마나 급격히 벌어지는지 비교해보면 왜 이 문제가 유독 "깊은" 망에서 심각한지 감이 온다.

| 층 수 | 1.5배씩 커질 때 | 0.8배씩 작아질 때 |
| --- | --- | --- |
| 3층 | $1.5^{3} \\approx 3.4$배 | $0.8^{3} \\approx 0.51$배 |
| 10층 | $1.5^{10} \\approx 57.7$배 | $0.8^{10} \\approx 0.107$배 |
| 20층 | $1.5^{20} \\approx 3325$배 | $0.8^{20} \\approx 0.0115$배 |

3층 정도까지는 그럭저럭 버틸 만하지만(3~5배 차이), 10층을 넘어가면 이미 통제 불능 수준이고 20층에서는 3325배라는 사실상 학습이 불가능한 숫자가 나온다. 얕은 네트워크라면 초기화가 다소 부정확해도 그럭저럭 굴러가지만, 층이 깊어질수록 초기화의 아주 작은 오차조차 지수적으로 증폭되어 치명적인 문제가 된다 — 이것이 "왜 깊은 네트워크일수록 초기화에 훨씬 예민한가"에 대한 정량적인 답이다.
:::

이 문제를 다루는 두 대표적 처방이 Xavier(Glorot) 초기화와 He 초기화다. Xavier 초기화는 원래 tanh나 sigmoid처럼 순전파와 역전파 양쪽 모두에서 분산이 안정적으로 유지되어야 한다는 요구를 동시에 만족시키려고 나왔다 — 순전파 쪽만 보면 분산은 fan_in에 반비례해야 하고 역전파 쪽만 보면 fan_out(다음 층으로 나가는 연결 수)에 반비례해야 하므로, 그 사이 타협점으로 fan_in과 fan_out의 평균(또는 조화평균)을 써서 대략 $\\text{Var}(W) \\approx 2/(\\text{fan\\_in}+\\text{fan\\_out})$ 정도로 잡는다. 반면 He 초기화는 ReLU 계열을 염두에 두고 나온 처방이다. ReLU는 입력의 절반(음수 구간)을 통째로 0으로 만들어버리므로 활성화를 통과하고 나면 분산이 대략 절반으로 깎이는데, 이 손실을 미리 보정하려고 He 초기화는 fan_out은 신경 쓰지 않고 fan_in만 사용하되 그 대신 분산을 Xavier의 두 배로 잡는다.

\`\`\`math
\\text{Var}(W) \\approx \\dfrac{2}{\\text{fan\\_in}}
\`\`\`

말로 읽으면 "가중치 하나의 분산을, 2를 입력 개수(fan_in)로 나눈 값 정도로 잡아라"는 뜻이다. 예를 들어 fan_in=100인 층이라면 $\\text{Var}(W)\\approx 2/100=0.02$, 즉 표준편차는 $\\sqrt{0.02}\\approx 0.141$ 정도의 아주 작은 값으로 가중치를 초기화해야 한다는 뜻이다. 결국 두 초기화가 서로 다른 공식을 쓰는 건 경쟁하는 두 유파가 있어서가 아니라, "어떤 활성화 함수 뒤에 어떤 분산 보정이 필요한가"라는 질문의 답이 다르기 때문이다. 실무에서는 ReLU 계열이면 He, tanh/sigmoid 계열이면 Xavier를 기본값으로 쓰면 된다.

[[practice]]

### 실습 1 — 초기화 스케일과 분산 폭발/소실을 눈으로 확인하기

위에서 손으로 계산했던 $1.5^{10} \\approx 57.7$배, $0.8^{10} \\approx 0.107$배가 실제 코드에서도 재현되는지 확인해보자. 10층짜리 ReLU 네트워크를 흉내내면서, 매 층 출력의 표준편차가 초기화 스케일에 따라 어떻게 변하는지만 관찰한다(학습은 하지 않고 순전파만 반복한다).

\`\`\`python
import numpy as np

def forward_stds(scale, n_layers=10, width=256, n_samples=1000):
    rng = np.random.default_rng(0)             # 결과를 재현할 수 있도록 시드 고정
    x = rng.standard_normal((n_samples, width))   # 표준편차 1로 시작
    stds = [x.std()]
    for _ in range(n_layers):
        W = rng.standard_normal((width, width)) * scale
        x = np.maximum(0, x @ W)                # ReLU
        stds.append(x.std())
    return stds

he_scale  = np.sqrt(2 / 256)     # He 초기화: Var(W) = 2/fan_in
too_big   = he_scale * 1.5       # 표준편차를 일부러 1.5배 키운 경우
too_small = he_scale * 0.8       # 표준편차를 일부러 0.8배로 줄인 경우

for name, scale in [("He(적정)", he_scale), ("과도(x1.5)", too_big), ("과소(x0.8)", too_small)]:
    stds = forward_stds(scale)
    print(name, [f"{s:.4f}" for s in stds])
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** He 스케일은 층을 지나도 표준편차가 거의 일정하고(ReLU 출력이라 약 0.8 근처), 과도(1.5배) 버전은 층마다 약 1.5배, 과소(0.8배) 버전은 약 0.8배씩 변해 10층 뒤 대략 57배, 0.1배 수준이 된다. **해볼 것:** \`n_layers\`를 20으로 늘려 표의 3325배·0.0115배에 가까워지는지 확인하자.
:::

### 실습 2 — 가중치를 전부 0(또는 같은 값)으로 시작하면?

\`\`\`python
import numpy as np

X = np.array([[0.5, -1.0], [1.5, 2.0], [-1.0, 0.3]])     # 샘플 3개, 특징 2개
y = np.array([[1.0], [0.0], [1.0]])

W1 = np.full((2, 3), 0.5)      # 은닉 뉴런 3개의 가중치를 전부 같은 값으로
W2 = np.full((3, 1), 0.5)
for step in range(200):
    h = np.tanh(X @ W1)
    pred = h @ W2
    d_pred = 2 * (pred - y) / len(X)
    dW2 = h.T @ d_pred
    dW1 = X.T @ ((d_pred @ W2.T) * (1 - h ** 2))
    W1 -= 0.1 * dW1
    W2 -= 0.1 * dW2
print("200스텝 뒤 W1의 세 열(= 은닉 뉴런 3개):\\n", np.round(W1, 4))
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 200스텝을 학습해도 \`W1\`의 세 열이 **완전히 같다** — 세 뉴런이 같은 값에서 출발해 같은 기울기를 받으므로 영원히 서로의 복사본으로 남는다(대칭성). **해볼 것:** \`W1\`을 \`np.random.default_rng(0).normal(0, 0.5, (2, 3))\`처럼 작은 무작위 값으로 바꾸면 세 열이 서로 달라지는지 확인하자.
:::

## 정규화 층: BatchNorm과 LayerNorm {#normalization}

깊은 네트워크를 학습시킬 때 층을 통과할 때마다 활성화 값의 분포(평균과 분산)가 스텝마다 계속 흔들리면, 뒤쪽 층은 매번 달라지는 입력 분포에 다시 적응해야 해서 학습이 느려지고 불안정해진다. 정규화(normalization) 층은 이 문제를 완화하려고, 활성화 값 $z$를 평균 0·분산 1로 표준화한 뒤 학습 가능한 스케일 $\\gamma$와 이동 $\\beta$를 다시 곱하고 더해 $\\hat{z}=\\gamma\\cdot\\text{표준화}(z)+\\beta$ 형태로 되돌려준다. 그런데 "평균과 분산을 어떤 축을 따라 계산하느냐"에 따라 전혀 다른 정규화 기법이 만들어진다.

Batch Normalization(BN)은 미니배치 축을 따라 정규화한다. 미니배치에 m개의 샘플이 있고 어떤 특징(뉴런) j의 pre-activation을 $z_j^{(1)}, \\dots, z_j^{(m)}$이라 하면, BN은 이 m개 값(같은 특징, 서로 다른 샘플들)에 대해 평균과 분산을 계산한다.

\`\`\`math
\\mu_j = \\dfrac{1}{m}\\sum_{i=1}^m z_j^{(i)}, \\qquad \\sigma_j^2 = \\dfrac{1}{m}\\sum_{i=1}^m (z_j^{(i)}-\\mu_j)^2, \\qquad \\hat{z}_j^{(i)} = \\dfrac{z_j^{(i)}-\\mu_j}{\\sqrt{\\sigma_j^2+\\epsilon}}
\`\`\`

말로 읽으면 "특징 j의 평균 $\\mu_j$는 배치 안의 m개 샘플이 갖는 그 특징 값을 전부 더해 m으로 나눈 것, 분산 $\\sigma_j^2$은 각 값이 평균에서 얼마나 떨어져 있는지를 제곱해 평균 낸 것, 정규화된 값 $\\hat z$는 원래 값에서 평균을 빼고 표준편차(+작은 값 $\\epsilon$)로 나눈 것"이라는 뜻이다. 즉 "이 뉴런의 값이 배치 전체에서 평균적으로 어느 정도인가"를 기준으로 정규화한다. 문제는 이 통계치가 배치 구성에 따라 달라진다는 점이다. 배치 크기가 작으면 $\\mu_j, \\sigma_j^2$의 추정이 불안정해지고, 추론(inference) 시점에는 배치가 하나(m=1)일 수도 있으므로 학습 중 관찰해 둔 이동평균(running mean/var)을 대신 써야 하는 번거로움도 있다(8단계에서 다룰 \`model.eval()\`이 정확히 이 전환을 담당한다).

Layer Normalization(LN)은 정규화 축을 완전히 바꾼다. 배치가 아니라 한 샘플이 가진 모든 특징(feature) 축을 따라 평균과 분산을 계산한다. 샘플 i 하나가 d개의 특징 $z_1^{(i)}, \\dots, z_d^{(i)}$을 가진다면,

\`\`\`math
\\mu_i = \\dfrac{1}{d}\\sum_{k=1}^d z_k^{(i)}, \\qquad \\sigma_i^2 = \\dfrac{1}{d}\\sum_{k=1}^d (z_k^{(i)}-\\mu_i)^2, \\qquad \\hat{z}_k^{(i)} = \\dfrac{z_k^{(i)}-\\mu_i}{\\sqrt{\\sigma_i^2+\\epsilon}}
\`\`\`

말로 읽으면 방금 BN 공식과 똑같은 모양인데, 다만 "m개 샘플에 대해 평균 낸다"가 "d개 특징에 대해 평균 낸다"로 바뀌었을 뿐이다 — 합을 구하는 축이 배치 쪽에서 특징 쪽으로 옮겨간 것이 BN과 LN의 유일한 차이다.

두 공식이 헷갈릴 때는 아주 작은 숫자로 직접 확인하는 것이 가장 빠르다. 샘플이 2개, 특징이 2개인 미니배치 $z=\\begin{pmatrix}2 & 4\\\\ 6 & 8\\end{pmatrix}$(행 하나가 샘플 하나, 열 하나가 특징 하나)를 생각해보자. BN은 열(같은 특징, 다른 샘플) 방향으로 평균을 낸다. 특징1의 값은 (2, 6)이므로 평균 4·분산 4, 특징2의 값은 (4, 8)이므로 평균 6·분산 4다. 반면 LN은 행(같은 샘플, 다른 특징) 방향으로 평균을 낸다. 샘플1의 값은 (2, 4)이므로 평균 3·분산 1, 샘플2의 값은 (6, 8)이므로 평균 7·분산 1이다. 완전히 같은 숫자 4개를 놓고도 "어느 축을 따라 평균 내는가"만 바꾸면 전혀 다른 평균·분산이 나온다는 것을 이 작은 예제로 분명히 확인할 수 있다.

이 계산은 오직 샘플 i 자기 자신의 특징들만 사용하므로, 배치 안에 다른 샘플이 몇 개나 같이 들어있는지와 완전히 무관하다 — 배치 크기가 1이어도, 길이가 서로 다른 시퀀스가 섞여 있어도 그대로 적용된다. 이것이 정확히 5주차에서 배울 Transformer가 BatchNorm 대신 LayerNorm을 쓰는 이유다. 자연어 문장은 배치마다 길이도 다르고 문장 수(배치 크기)도 학습 상황에 따라 들쭉날쭉하므로, "같은 배치 안의 서로 다른 문장들"을 기준으로 통계를 내는 BN보다 "같은 문장 안의 서로 다른 토큰들"을 기준으로 통계를 내는 LN이 훨씬 안정적이다.

| | 정규화 축 | 배치 크기 의존성 | 대표 사용처 |
| --- | --- | --- | --- |
| BatchNorm | 배치 축(같은 특징, 다른 샘플들) | 큼 — 배치가 작으면 불안정, 추론 시 이동평균 필요 | CNN(4주차) |
| LayerNorm | 특징 축(같은 샘플, 다른 특징들) | 없음 — 샘플 하나만으로도 계산 가능 | Transformer(5~7주차) |

두 기법 모두 학습 가능한 파라미터 $\\gamma, \\beta$는 그대로 유지한다 — 정규화가 표현력을 해치지 않도록, 표준화한 뒤 다시 원하는 스케일과 위치로 되돌릴 여지를 남겨두는 것이다.

[[practice]]

### 실습 — 같은 숫자, 다른 축: BatchNorm vs LayerNorm

\`\`\`python
import numpy as np

def batch_norm(z, eps=1e-5):
    mu, var = z.mean(axis=0), z.var(axis=0)            # 열(같은 특징, 다른 샘플) 방향
    return (z - mu) / np.sqrt(var + eps), mu, var

def layer_norm(z, eps=1e-5):
    mu, var = z.mean(axis=1, keepdims=True), z.var(axis=1, keepdims=True)   # 행(같은 샘플, 다른 특징) 방향
    return (z - mu) / np.sqrt(var + eps), mu.ravel(), var.ravel()

z = np.array([[2.0, 4.0],
              [6.0, 8.0]])                              # 본문 예제: 행=샘플, 열=특징
bn, bn_mu, bn_var = batch_norm(z)
ln, ln_mu, ln_var = layer_norm(z)
print("BN 평균/분산:", bn_mu, bn_var, "\\nBN 결과:\\n", np.round(bn, 3))
print("LN 평균/분산:", ln_mu, ln_var, "\\nLN 결과:\\n", np.round(ln, 3))

# 배치 크기가 1이면? BN은 분산이 0이 되어 모든 값이 0으로 뭉개진다
one = np.array([[3.0, 7.0, 1.0]])
print("\\n배치 1개에 BN:", np.round(batch_norm(one)[0], 3), " / LN:", np.round(layer_norm(one)[0], 3))
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** BN은 특징별 평균 \`[4, 6]\`, 분산 \`[4, 4]\`, LN은 샘플별 평균 \`[3, 7]\`, 분산 \`[1, 1]\`로 본문과 같고, 정규화 결과는 둘 다 $\\pm 1$로 나오지만 부호가 놓이는 위치가 다르다. 샘플 하나짜리 배치에서 BN은 전부 0이 되지만 LN은 여전히 의미 있는 값을 낸다 — Transformer가 LN을 쓰는 이유 중 하나다. **해볼 것:** 두 함수에 학습 가능한 \`gamma\`, \`beta\`를 추가해 \`gamma * norm + beta\`를 돌려주게 바꿔보자. \`gamma=표준편차\`, \`beta=평균\`으로 두면 원래 값이 복원되는가?
:::

## PyTorch가 대신해주는 것들 {#pytorch-core}

앞서 우리는 Value라는 아주 작은 자동미분 엔진을 직접 만들어, 계산 그래프를 만들고 그 그래프를 거슬러 올라가며 기울기를 계산하는 과정을 한 줄씩 눈으로 확인했다. PyTorch 같은 딥러닝 프레임워크가 실전에서 하는 일은 정확히 이것과 같다 — 다만 숫자 하나(스칼라)가 아니라 수백만 개의 숫자를 담은 텐서(tensor) 단위로, 그것도 CPU가 아닌 GPU에서 대량 병렬로 처리한다는 점이 다를 뿐이다. 이 단계에서는 우리가 손으로 짠 코드의 각 부분이 PyTorch의 어떤 개념에 대응하는지 하나씩 짝지어본다.

- **Tensor**: PyTorch의 \`torch.Tensor\`는 NumPy의 \`ndarray\`와 데이터 구조 자체는 동일하다 — 둘 다 같은 타입의 숫자를 다차원 배열로 담고, 인덱싱·브로드캐스팅·행렬 곱 같은 연산도 거의 그대로 대응된다(실제로 \`torch.from_numpy()\`로 메모리 복사 없이 서로 변환할 수 있다). 다른 점은 두 가지다. 첫째, 텐서는 \`.to("cuda")\`로 GPU 메모리로 옮겨 대량 병렬 연산을 시킬 수 있지만 NumPy 배열은 CPU에서만 동작한다. 둘째, 텐서는 \`requires_grad=True\`를 켜면 자신이 어떤 연산을 거쳐 만들어졌는지 계산 그래프를 계속 기록해 나중에 역전파에 쓸 수 있지만, NumPy 배열에는 이런 기록 기능이 아예 없다.

- **Autograd**: \`requires_grad=True\`인 텐서에 연산을 적용할 때마다, PyTorch는 앞서 만든 Value가 \`_prev\`와 \`_backward\`를 저장했던 것과 똑같이 결과 텐서에 \`grad_fn\`이라는 이름으로 "이 텐서가 어떤 연산과 어떤 입력들로부터 만들어졌는지"를 기록한다. \`loss.backward()\`를 호출하면 이 grad_fn들을 따라 위상정렬의 역순으로 그래프를 순회하며 연쇄법칙을 적용하는데, 이것이 정확히 우리가 만든 \`Value.backward()\`가 topo 리스트를 뒤집어 순회하며 \`_backward()\`를 실행하던 것과 동일한 알고리즘이다. 계산이 끝나면 각 리프(leaf) 텐서, 즉 \`requires_grad=True\`로 직접 만든 파라미터 텐서의 \`.grad\` 속성에 $\\partial L/\\partial\\theta$가 채워진다(앞서 살펴본 Value의 \`.grad\` 필드와 완전히 같은 역할). \`optimizer.step()\`은 이렇게 채워진 \`.grad\`를 읽어 5단계의 갱신식(SGD, Adam)대로 파라미터를 갱신하고, \`optimizer.zero_grad()\`는 \`+=\`로 누적되는 성질(앞서 :::info 참고) 때문에 다음 스텝을 위해 \`.grad\`를 0으로 되돌리는 역할을 한다.

\`\`\`image
src: /images/week3/reverse-mode-autodiff.png
alt: 함수 f(x1,x2)=x1*x2+sin(x1)의 계산 그래프를 손실 쪽에서 입력 쪽으로 거슬러 올라가며 각 노드의 국소 미분을 곱해 전달하는 역방향 자동미분 과정을 보여주는 다이어그램
caption: 역방향 자동미분(reverse-mode automatic differentiation) — f(x1,x2)=x1x2+sin(x1)의 계산 그래프를 출력(오른쪽)에서 입력(왼쪽) 방향으로 한 번만 훑으면서 연쇄법칙으로 모든 편미분을 동시에 얻는다. PyTorch의 loss.backward()가 grad_fn을 따라 수행하는 것이 바로 이 알고리즘이다.
credit: Berland (en.wikipedia), Public Domain, Wikimedia Commons
width: 960
height: 560
\`\`\`

- **nn.Module**: 파라미터를 가진 레이어(예: Wx+b를 계산하는 완전연결층)를 재사용 가능한 단위로 묶는 클래스다. \`__init__\`에서 그 층이 가질 파라미터(가중치, 편향)를 \`nn.Linear\`, \`nn.Conv2d\` 같은 하위 모듈로 선언하고, \`forward\`에서는 입력이 그 파라미터들을 거쳐 출력으로 바뀌는 순전파 계산만 정의한다. 신기하게도 backward는 따로 작성하지 않는다 — forward 안에서 사용한 텐서 연산 하나하나가 이미 autograd에 기록되므로, \`loss.backward()\`를 부르는 순간 이 모듈 내부의 모든 파라미터에 대한 기울기가 자동으로 계산된다. 아래 코드부터는 실제 \`torch\` 라이브러리를 사용하는데, 이 사이트의 실행 환경(Pyodide)에는 torch가 없어 브라우저에서는 실행되지 않는다 — 코드를 눈으로 따라 읽으며 구조를 이해하고, 직접 돌려보고 싶다면 [Google Colab](https://colab.research.google.com/)에 새 노트북을 만들어 붙여넣어 실행하자.

\`\`\`python-colab
import torch, torch.nn as nn

class TwoLayerMLP(nn.Module):
    def __init__(self, d_in, d_hidden, d_out):
        super().__init__()                          # nn.Module의 초기화를 먼저 실행(필수)
        self.fc1 = nn.Linear(d_in, d_hidden)         # 층 하나 = 학습 가능한 W1, b1을 가진 객체
        self.fc2 = nn.Linear(d_hidden, d_out)        # 층 둘 = 학습 가능한 W2, b2를 가진 객체

    def forward(self, x):                            # 순전파만 정의. backward는 autograd가 알아서 함
        h = torch.relu(self.fc1(x))
        return self.fc2(h)

model = TwoLayerMLP(3, 4, 1)   # 1단계의 h=φ(W1x+b1), ŷ=W2h+b2 를 그대로 객체로 만든 것
\`\`\`

- **Optimizer (torch.optim)**: 5단계에서 손으로 유도한 Adam의 갱신식($m_t, v_t$의 지수이동평균과 편향 보정, $\\theta \\leftarrow \\theta - \\eta\\,\\hat m_t/(\\sqrt{\\hat v_t}+\\epsilon)$까지 전부)을 한 줄로 대신해주는 것이 \`torch.optim.Adam\`이다(이 블록도 위 \`model\`이 이미 만들어져 있다고 가정한 이어지는 코드이며, 마찬가지로 브라우저에서는 실행되지 않는다. Colab에서는 위 블록 뒤에 이어 붙이면 된다).

\`\`\`python-colab
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, betas=(0.9, 0.999), eps=1e-8)
\`\`\`

\`model.parameters()\`가 \`__init__\`에서 선언한 모든 층의 파라미터를 하나로 모아 넘겨주고, 옵티마이저는 매 \`step()\`마다 각 파라미터의 \`.grad\`를 읽어 자신이 관리하는 $m, v$ 버퍼를 갱신한 뒤 파라미터 값을 직접 수정한다.

- **Dataset / DataLoader**: 학습 데이터를 미니배치 단위로 잘라 순전파에 넣어주는 역할을 담당한다. \`Dataset\`은 \`__len__\`(전체 샘플 개수)과 \`__getitem__\`(인덱스로 샘플 하나를 꺼내는 방법)이라는 두 메서드만 정의하면 되는 간단한 인터페이스이고, \`DataLoader\`가 그 위에서 셔플·배치 묶기·병렬 로딩을 대신해준다. 이 코드 역시 브라우저에서는 실행되지 않는 참고용 코드다(Colab에서 X, y를 직접 정의한 뒤 실행해보라).

\`\`\`python-colab
from torch.utils.data import Dataset, DataLoader

class MoonsDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y)
    def __len__(self):                    # DataLoader가 "전체 샘플이 몇 개인지" 물어볼 때 답하는 메서드
        return len(self.X)
    def __getitem__(self, idx):           # DataLoader가 "idx번째 샘플을 달라"고 할 때 답하는 메서드
        return self.X[idx], self.y[idx]

loader = DataLoader(MoonsDataset(X, y), batch_size=32, shuffle=True)
\`\`\`

- **Training / Validation Loop**: 표준적인 학습 루프는 "에폭을 반복 $\\to$ 그 안에서 배치를 반복 $\\to$ 순전파(forward) $\\to$ 손실 계산(loss) $\\to$ 역전파(backward) $\\to$ 파라미터 갱신(step) $\\to$ 기울기 초기화(zero_grad)"라는 여섯 단계를 그대로 되풀이하는 구조다. 아래도 같은 이유로 브라우저에서는 실행되지 않는다.

\`\`\`python-colab
for epoch in range(num_epochs):
    model.train()                          # 학습 모드: BatchNorm이 이번 배치 통계를 사용
    for xb, yb in train_loader:
        pred = model(xb)                   # 순전파
        loss = loss_fn(pred, yb)           # 손실 계산
        optimizer.zero_grad()              # 이전 스텝의 .grad를 0으로 리셋(안 하면 +=로 누적됨)
        loss.backward()                    # 역전파: 모든 파라미터의 .grad를 채움
        optimizer.step()                   # .grad를 읽어 파라미터를 실제로 갱신

    model.eval()                           # 평가 모드: BatchNorm이 누적해둔 이동평균을 사용
    with torch.no_grad():                  # 이 블록 안에서는 계산 그래프를 기록하지 않음(메모리 절약)
        val_loss = sum(loss_fn(model(xb), yb).item() for xb, yb in val_loader)
    print(epoch, val_loss)
\`\`\`

검증(validation) 루프에서는 두 가지가 달라진다. \`model.eval()\`은 7단계에서 배운 BatchNorm이 미니배치 통계 대신 학습 중 누적해온 이동평균을 쓰도록 모드를 바꾸고, \`torch.no_grad()\`는 이 블록 안에서는 계산 그래프를 아예 기록하지 않도록 지시한다. 검증 시점에는 backward를 부를 일이 없으므로 그래프를 기록해봐야 메모리와 연산만 낭비되기 때문이다.

- **Checkpoint**: \`torch.save(model.state_dict(), "ckpt.pt")\`로 그 시점의 모든 파라미터 값을 파일로 저장하고, \`model.load_state_dict(torch.load("ckpt.pt"))\`로 복원한다. 학습이 길게는 며칠씩 걸리는 큰 모델에서는 중간에 서버가 죽거나 재시작해야 할 때를 대비해 정기적으로 체크포인트를 저장해두고, 검증 손실이 가장 낮았던 시점의 체크포인트를 따로 보관해두면 마지막 에폭이 아니라 "가장 성능이 좋았던 순간"의 모델을 최종 결과물로 쓸 수 있다.

이 대응 관계를 표로 한 번에 정리하면 다음과 같다.

| 우리가 앞서 손으로 짠 것 | PyTorch가 대신 해주는 것 |
| --- | --- |
| Value.data | tensor의 값 |
| Value.grad | tensor.grad |
| Value._prev, _op | tensor.grad_fn (계산 그래프 기록) |
| Value.backward()의 topo 정렬 + 역순회 | loss.backward() |
| 5단계에서 손으로 쓴 Adam 갱신식 | torch.optim.Adam.step() |
| 갱신 후 grad를 0으로 되돌리는 코드 | optimizer.zero_grad() |

[[practice]]

### 실습 — autograd 없이 2층 신경망을 끝까지 학습시키기 (브라우저에서 실행)

PyTorch가 대신해주는 일을 정확히 이해하는 가장 좋은 방법은, 한 번은 그 일을 전부 손으로 해보는 것이다. 아래 코드는 NumPy만으로 2층 MLP(은닉 16, ReLU)를 만들어 make_moons를 분류한다. \`backward\` 함수의 네 줄이 바로 \`loss.backward()\`가 자동으로 해주는 일이고, 학습 전에 gradient check로 그 네 줄이 맞는지부터 확인한다.

\`\`\`python
import numpy as np
from sklearn.datasets import make_moons

X, y = make_moons(n_samples=400, noise=0.15, random_state=0)
Y = y.reshape(-1, 1).astype(float)                       # (400, 1)
rng = np.random.default_rng(0)
H = 16
W1 = rng.normal(0, np.sqrt(2 / 2), (2, H)); b1 = np.zeros(H)   # He 초기화: Var = 2/fan_in
W2 = rng.normal(0, np.sqrt(1 / H), (H, 1)); b2 = np.zeros(1)

def forward(X, W1, b1, W2, b2):
    z1 = X @ W1 + b1                   # (400, 16)
    h = np.maximum(0, z1)              # ReLU
    z2 = h @ W2 + b2                   # (400, 1)
    p = 1 / (1 + np.exp(-z2))          # 시그모이드 → 양성 확률
    return z1, h, p

def loss_fn(p, Y):
    return -np.mean(Y * np.log(p + 1e-12) + (1 - Y) * np.log(1 - p + 1e-12))

def backward(X, Y, z1, h, p, W2):
    dz2 = (p - Y) / len(X)             # 2주차: 시그모이드+교차엔트로피의 기울기 = p - y
    dW2, db2 = h.T @ dz2, dz2.sum(axis=0)       # dL/dW = (입력)^T δ
    dz1 = (dz2 @ W2.T) * (z1 > 0)      # W^T δ 로 내려보내고 ReLU에서 음수 자리는 차단
    dW1, db1 = X.T @ dz1, dz1.sum(axis=0)
    return dW1, db1, dW2, db2

# 1) gradient check: W1[0, 0] 하나의 기울기를 수치미분과 비교
z1, h, p = forward(X, W1, b1, W2, b2)
dW1 = backward(X, Y, z1, h, p, W2)[0]
Wp, Wm = W1.copy(), W1.copy()
Wp[0, 0] += 1e-5; Wm[0, 0] -= 1e-5
num = (loss_fn(forward(X, Wp, b1, W2, b2)[2], Y) - loss_fn(forward(X, Wm, b1, W2, b2)[2], Y)) / 2e-5
print(f"gradient check: 역전파 {dW1[0, 0]:.8f}, 수치미분 {num:.8f}")

# 2) 학습 루프: 순전파 → 손실 → 역전파 → 갱신 (PyTorch의 네 줄과 같은 구조)
lr = 0.5
for epoch in range(2001):
    z1, h, p = forward(X, W1, b1, W2, b2)
    dW1, db1, dW2, db2 = backward(X, Y, z1, h, p, W2)
    W1 -= lr * dW1; b1 -= lr * db1; W2 -= lr * dW2; b2 -= lr * db2
    if epoch % 500 == 0:
        print(f"epoch {epoch:4d}: loss = {loss_fn(p, Y):.4f}, 정확도 = {np.mean((p >= 0.5) == Y):.3f}")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** gradient check의 두 값이 소수점 여덟째 자리까지 거의 같고, 손실이 약 0.69에서 0.04 근처로 줄며 정확도가 0.97 이상이 된다. **해볼 것:** ① \`H\`를 1, 2로 줄이면 정확도가 어디서 멈추는가(표현력 부족)? ② \`backward\`에서 \`* (z1 > 0)\`을 지우면 gradient check가 어떻게 되는가? ③ 본문의 PyTorch make_moons 코드를 Colab에서 실행해, 손으로 쓴 \`backward\` 네 줄이 \`loss.backward()\` 한 줄로 바뀌었다는 것을 직접 확인하자.
:::

## GPU·혼합 정밀도와 PyTorch 실전 {#pytorch-practice}

**CPU / GPU / CUDA.** 신경망 학습의 대부분은 행렬 곱과 원소별 연산으로 이뤄지는데, 이 연산들은 수십만 개의 독립적인 곱셈-덧셈으로 쪼갤 수 있어 병렬화에 매우 유리하다. CPU는 코어 수가 적은 대신 코어 하나하나의 성능이 강력해 복잡한 분기와 순차 로직에 강하고, GPU(그래픽 처리 장치)는 코어 하나하나는 단순하지만 수천 개를 동시에 돌릴 수 있어 "똑같은 연산을 아주 많은 데이터에 동시에 적용하는" 행렬 연산에 압도적으로 유리하다. CUDA는 NVIDIA GPU에서 이런 범용 병렬 연산을 수행할 수 있게 해주는 프로그래밍 인터페이스로, PyTorch는 텐서를 \`.to("cuda")\`로 옮기기만 하면 이후의 모든 연산을 내부적으로 CUDA 커널 호출로 바꿔 GPU에서 병렬 실행해준다.

**Mixed Precision.** 기본적으로 텐서의 숫자는 32비트 부동소수점(FP32)으로 저장되는데, 딥러닝 연산 대부분은 그렇게까지 높은 정밀도가 필요하지 않다는 점에 착안해 일부 연산을 16비트(FP16 또는 BF16)로 대신 계산하는 기법이 혼합 정밀도(mixed precision) 학습이다. 숫자를 절반 크기로 저장하므로 GPU 메모리를 적게 쓰고, 한 번에 메모리에 실을 수 있는 데이터가 늘어나는 데다 최신 GPU는 16비트 연산 전용 회로를 따로 갖추고 있어 속도도 훨씬 빨라진다. 다만 표현 범위가 좁아진 만큼 작은 기울기 값이 0으로 반올림돼버리는 문제가 생길 수 있어, PyTorch의 \`torch.cuda.amp\`는 손실 값을 일부러 키워뒀다가(loss scaling) 나중에 다시 축소하는 방식으로 이 문제를 보완한다.

**Hugging Face.** \`transformers\` 라이브러리는 BERT, GPT 계열처럼 이미 대규모 데이터로 사전학습(pretrained)된 모델의 가중치와 구조를 단 몇 줄로 불러와 바로 쓸 수 있게 해준다. 지금까지 배운 nn.Module, optimizer, training loop는 이런 사전학습 모델을 가져와 우리 데이터에 맞게 미세조정(fine-tuning)할 때도 그대로 재사용된다 — 5~7주차에서 Transformer, LLM, RAG를 다룰 때는 모델을 처음부터 새로 학습시키는 대신 Hugging Face 생태계에서 이미 학습된 모델을 가져와 그 위에 쌓아 올리는 방식을 계속 쓰게 될 것이므로, 앞 단계에서 짝지어본 대응 관계를 기억해두면 그때 훨씬 수월하게 이해할 수 있다.

### PyTorch로 make_moons 분류해보기

PyTorch로 넘어가면 겉모습은 확 달라지지만 원리는 앞서 만든 Value 클래스와 한 치도 다르지 않다. 텐서 하나하나가 Value처럼 자신이 어떻게 만들어졌는지를 grad_fn이라는 이름으로 기억하고 있고, loss.backward()를 호출하면 우리가 직접 짠 backward()와 똑같이 계산 그래프를 위상정렬 순서로 거슬러 올라가며 기울기를 채워 넣는다. 다를 뿐인 것은 숫자 하나(스칼라)가 아니라 수천~수백만 개의 숫자를 담은 텐서 단위로, 그것도 GPU에서 대량으로 병렬 처리한다는 점이다. 이 코드는 torch를 사용하므로 이 사이트 브라우저에서는 실행되지 않는다 — Google Colab에 붙여넣어 실행해보라.

\`\`\`python-colab
import torch, torch.nn as nn
from sklearn.datasets import make_moons
X, y = make_moons(1000, noise=0.2, random_state=0)
X, y = torch.tensor(X, dtype=torch.float32), torch.tensor(y)
# nn.Sequential: 층을 순서대로 이어붙이기만 하면 되는 간단한 모델은 nn.Module을 직접 상속하지 않고 이렇게 한 줄로 쓸 수 있다
net = nn.Sequential(nn.Linear(2,16), nn.ReLU(), nn.Linear(16,16), nn.ReLU(), nn.Linear(16,2))
opt = torch.optim.Adam(net.parameters(), lr=1e-2)
for ep in range(300):
    loss = nn.functional.cross_entropy(net(X), y)   # 다중분류용 손실함수(2주차)
    opt.zero_grad(); loss.backward(); opt.step()      # 기울기 초기화 → 역전파 → 파라미터 갱신
    if ep % 50 == 0: print(ep, loss.item())
\`\`\`

opt.zero_grad()를 빼먹으면 어떤 일이 벌어질지 예측해보자. 앞서 Value의 _backward가 grad에 값을 대입(=)하지 않고 누적(+=)한다고 했던 것을 그대로 떠올리면 된다. PyTorch의 텐서도 정확히 같은 규칙을 따른다. zero_grad()로 이전 스텝의 기울기를 0으로 리셋해주지 않으면, 새로 계산된 기울기가 이전 스텝의 기울기 위에 계속 쌓여서 실제보다 훨씬 크고 스텝을 반복할수록 계속 불어나는 기울기로 파라미터를 갱신하게 되고, 결국 학습이 이상하게 발산하거나 망가진다. 은닉 유닛 수를 1, 2, 4, 64로 바꿔가며 실행해보면, 표현력이 부족한(유닛이 1~2개인) 네트워크는 make_moons의 초승달 모양 경계를 곧게 하나의 직선으로 뭉개버리는 반면, 유닛이 충분히 많아지면(64개) 결정경계가 실제 데이터의 곡선 모양을 정교하게 따라가는 것을 눈으로 확인할 수 있을 것이다.

### 같은 선형회귀를 두 번 풀어보기 — NumPy 수동 구현 vs PyTorch

1주차의 선형회귀를 다시 가져와, 완전히 같은 데이터에 완전히 같은 경사하강법 스텝 수·학습률을 적용해서 두 가지 방식으로 풀어보자. 하나는 지금까지처럼 미분 공식을 손으로 유도해 코드로 옮긴 NumPy 버전이고, 다른 하나는 앞서 배운 PyTorch의 autograd와 optimizer에 그 계산을 통째로 맡기는 버전이다. 같은 X, y로 학습하므로 두 버전의 최종 w, b는 (참값 w=3, b=2 근처로) 거의 같은 값에 수렴해야 한다 — 이것이 "PyTorch가 우리가 손으로 한 것과 수학적으로 동일한 일을 하고 있다"는 가장 직접적인 증거다.

\`\`\`python
# NumPy 수동 구현 — dL/dw, dL/db를 직접 유도해서 코드로 옮긴다
import numpy as np

rng = np.random.default_rng(0)
X = rng.uniform(-3, 3, size=200)
y_true = 3.0 * X + 2.0 + rng.normal(0, 0.5, size=200)

w, b, lr = 0.0, 0.0, 0.05
for step in range(500):
    y_pred = w * X + b
    error = y_pred - y_true
    loss = (error ** 2).mean()
    grad_w = (2 * error * X).mean()     # dL/dw = (2/n) Σ(wx+b−y)x  ← 손으로 유도
    grad_b = (2 * error).mean()         # dL/db = (2/n) Σ(wx+b−y)  ← 손으로 유도
    w -= lr * grad_w                    # 파라미터 갱신도 직접 작성
    b -= lr * grad_b

print(f"NumPy 수동  : w={w:.4f}, b={b:.4f}, loss={loss:.4f}")
\`\`\`

아래 PyTorch 버전은 브라우저에서는 실행되지 않는다 — Colab에서 위 NumPy 코드를 먼저 실행해 \`X\`, \`y_true\`를 만든 뒤, 이어서 붙여 실행하자.

\`\`\`python-colab
# 완전히 같은 X, y_true를 PyTorch로 — 미분 공식은 단 한 줄도 등장하지 않는다
import torch

Xt = torch.tensor(X, dtype=torch.float32).unsqueeze(1)
yt = torch.tensor(y_true, dtype=torch.float32).unsqueeze(1)

model = torch.nn.Linear(1, 1)                          # w, b를 파라미터로 갖는 선형층 하나
opt = torch.optim.SGD(model.parameters(), lr=0.05)

for step in range(500):
    pred = model(Xt)
    loss = torch.nn.functional.mse_loss(pred, yt)
    opt.zero_grad()
    loss.backward()                                     # dL/dw, dL/db를 autograd가 자동 계산
    opt.step()                                           # w, b 갱신도 optimizer가 자동 수행

w_t, b_t = model.weight.item(), model.bias.item()
print(f"PyTorch     : w={w_t:.4f}, b={b_t:.4f}, loss={loss.item():.4f}")
\`\`\`

두 print 문을 나란히 실행해보면 w, b, loss가 소수점 셋째 자리 안팎에서 거의 일치한다(둘 다 참값 w=3, b=2에 수렴하고, np.isclose(w, w_t, atol=1e-2)가 참이 될 것이다). 그런데 정작 눈여겨봐야 할 것은 최종 숫자의 일치보다 "학습 루프 안에 무엇이 남아있고 무엇이 사라졌는가"다. NumPy 버전의 루프 7줄 중 두 줄(grad_w, grad_b)은 이 문제(선형회귀 + MSE)에 대해서만 유효한, 손으로 유도한 미분 공식이다 — 모델을 2층 MLP로 바꾸면 이 두 줄은 완전히 새로 유도해서 다시 써야 한다. 반면 PyTorch 버전의 루프 5줄 중에는 w나 b를 직접 언급하는 코드가 단 한 줄도 없다. \`loss.backward()\`가 미분 공식이 있던 자리를 대신하고, \`opt.step()\`이 파라미터 갱신 두 줄을 대신한다. 그래서 \`model = torch.nn.Linear(1, 1)\`을 앞서 만든 \`nn.Sequential(nn.Linear(2,16), nn.ReLU(), ...)\`처럼 훨씬 복잡한 네트워크로 바꿔도, 학습 루프의 나머지 5줄은 단 한 글자도 손댈 필요가 없다 — 이것이 "코드 줄 수가 줄었다"는 것보다 훨씬 중요한, autograd와 optimizer가 만들어주는 진짜 자동화다.

[[practice]]

### 실습 1 — 16비트에서 기울기가 사라지는 현상과 loss scaling

혼합 정밀도의 위험(작은 기울기가 0으로 반올림되는 underflow)과 그 처방(loss scaling)을 NumPy의 \`float16\`으로 직접 재현해보자.

\`\`\`python
import numpy as np

grads = np.array([3e-4, 5e-6, 2e-8, 1e-9], dtype=np.float32)     # 층마다 다른 크기의 기울기
print("FP32 그대로       :", grads)
print("FP16으로 변환      :", grads.astype(np.float16))           # 너무 작은 값은 0이 된다

scale = 1024.0                                                    # loss scaling: 손실(→기울기)을 키운 뒤 계산
scaled_fp16 = (grads * scale).astype(np.float16)
recovered = scaled_fp16.astype(np.float32) / scale                # 갱신 직전에 FP32로 되돌려 다시 나눈다
print("스케일 후 FP16→복원:", recovered)
print("FP16이 표현하는 가장 작은 양수:", np.finfo(np.float16).tiny, "(subnormal 포함 최소값은 약 6e-8)")
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** FP16으로 바로 바꾸면 \`2e-8\`, \`1e-9\`가 0이 되지만, 1024배 키운 뒤 FP16으로 계산하고 되돌리면 두 값 모두 근사값으로 살아남는다(\`1e-9\`는 약 \`9.9e-10\`처럼 오차가 조금 붙는다). 스케일이 부족하면 여전히 사라질 수 있어서, 실제 구현(\`torch.cuda.amp.GradScaler\`)은 오버플로가 나지 않는 한도에서 스케일을 동적으로 키웠다 줄였다 한다. **생각해볼 것:** 스케일을 너무 크게(예: \`1e8\`) 잡으면 반대로 어떤 문제가 생길까? \`(grads * 1e8).astype(np.float16)\`을 실행해 \`inf\`(오버플로)를 확인하자.
:::

### 실습 2 — 반복문 vs 한 번의 행렬 연산: 병렬화가 왜 빠른가

GPU가 빠른 이유는 "같은 연산을 수많은 데이터에 동시에 적용"하는 데 특화되어 있기 때문이다. CPU 위의 NumPy에서도 파이썬 반복문(한 번에 하나씩)과 벡터화된 행렬 곱(한 번에 통째로)의 차이로 같은 원리를 체감할 수 있다.

\`\`\`python
import time
import numpy as np

rng = np.random.default_rng(0)
A, B = rng.normal(size=(120, 120)), rng.normal(size=(120, 120))

t0 = time.perf_counter()
C_loop = [[sum(A[i, k] * B[k, j] for k in range(120)) for j in range(120)] for i in range(120)]
t_loop = time.perf_counter() - t0

t0 = time.perf_counter()
C_vec = A @ B
t_vec = time.perf_counter() - t0

print(f"파이썬 3중 반복문: {t_loop:.3f}초, 행렬 곱 @: {t_vec:.5f}초, 약 {t_loop / t_vec:,.0f}배 차이")
print("결과가 같은가?", np.allclose(C_loop, C_vec))
\`\`\`

:::task 통과 조건과 한 걸음 더
**예상 결과:** 결과는 같지만 속도는 수백~수천 배 차이 난다(실행 환경마다 다르다). 행렬 곱의 곱셈-덧셈 약 170만 개는 서로 독립이라 한꺼번에 처리할 수 있고, GPU는 이런 독립 연산을 수천 개의 코어로 동시에 처리해 그 차이를 더 벌린다. **해볼 것:** 행렬 크기를 60, 240으로 바꿔보자. 반복문의 시간은 크기의 몇 제곱에 비례해 늘어나는가?
:::
`,
  sections,
  quiz: [
    { id: "w3-q1", question: "$L = (wx - y)^2$, $x=2$, $w=1$, $y=5$ 일 때 $\\dfrac{dL}{dw}$는? 계산 과정을 노드별로 나눠서 보여라." },
    { id: "w3-q2", question: "곱셈 노드 z=a·b에서 상류 기울기가 g로 내려왔을 때 $\\dfrac{dL}{da}$를 구하는 식은? 이 식이 왜 'b가 클수록 a의 책임도 커진다'는 직관과 맞아떨어지는지 설명하라." },
    { id: "w3-q3", question: "활성화 함수가 없는 3층 MLP는 왜 표현력 관점에서 1층 선형모델과 동일한가?" },
    { id: "w3-q4", question: "본문 예제 $L=(w\\cdot x+c)^2$ 에서 $w=2, x=3, c=1$을 $w=-1, x=4, c=2$로 바꿔서 순전파 값과 $\\dfrac{dL}{dw}$, $\\dfrac{dL}{dx}$를 직접 손으로 계산하라." },
    { id: "w3-q5", question: "Adam이 SGD보다 학습 초반에 더 빠르게 손실을 줄이는 경향을 보이는 이유를 파라미터별 적응 학습률 관점에서 설명하라." },
    { id: "w3-q6", question: "가중치를 전부 0으로 초기화하면 왜 학습이 되지 않는가? '대칭성'이라는 단어를 사용해 설명하라." },
    { id: "w3-q7", question: "micrograd의 Value 클래스에서 backward()가 _backward()를 실행하기 전에 위상정렬(topo)을 먼저 하는 이유는 무엇인가?" },
    { id: "w3-q8", question: "ReLU 노드에서 순전파 입력이 음수였을 때 역전파로 전달되는 기울기 값은 얼마인가? 이 사실이 '죽은 ReLU(dead ReLU)' 문제와 어떻게 연결되는가?" },
    { id: "w3-q9", question: "한 뉴런의 출력 z가 fan_in개의 항을 더한 것이라는 사실과 1주차의 '분산은 더할수록 커진다'는 원리를 연결해, 왜 가중치의 분산을 fan_in에 반비례하게 잡아야 하는지 설명하라." },
    { id: "w3-q10", question: "어떤 네트워크에서 층마다 활성화의 표준편차가 1.2배씩 커진다면, 15개 층을 통과했을 때 표준편차는 원래의 약 몇 배가 되는가? (1.2^15을 직접 계산하고, 그 결과가 왜 '깊은 네트워크일수록 초기화에 민감하다'는 주장의 근거가 되는지도 함께 설명하라.)" },
    { id: "w3-q11", question: "PyTorch에서 requires_grad=True로 만든 텐서 w에 대해 loss.backward()를 호출하면 w.grad에 어떤 값이 채워지는가? 이것이 앞서 직접 만든 Value 클래스의 grad 필드와 정확히 같은 역할을 하는 이유를 설명하라." },
    { id: "w3-q12", question: "학습 루프에서 optimizer.zero_grad()를 빼먹으면 어떤 문제가 생기는가? .grad가 '=' 대신 '+='로 누적된다는 사실과 연결해 설명하라." },
    { id: "w3-q13", question: "nn.Module 서브클래스를 정의할 때 __init__과 forward는 각각 어떤 역할을 맡는가? backward 메서드를 직접 작성하지 않아도 그레디언트가 자동으로 계산되는 이유는 무엇인가?" },
    { id: "w3-q14", question: "똑같은 행렬 곱 연산이 CPU보다 GPU에서 훨씬 빠르게 수행되는 이유를, 두 장치의 코어 수와 코어당 성능의 차이 관점에서 설명하라." },
    { id: "w3-q15", question: "혼합 정밀도(mixed precision) 학습이 메모리 사용량과 학습 속도 면에서 유리한 이유는 무엇인가? FP16을 그대로 쓸 때 생길 수 있는 문제와, PyTorch가 이를 보완하는 방법(loss scaling)을 함께 설명하라." },
    { id: "w3-q16", question: "PyTorch의 Dataset 클래스가 반드시 정의해야 하는 두 메서드는 무엇이며, DataLoader는 그 위에서 각각 어떤 일을 대신 해주는가?" },
    { id: "w3-q17", question: "GELU와 ReLU를 입력이 음수인 구간에서의 동작을 중심으로 비교하라. GELU가 ReLU에 비해 '죽은 뉴런' 문제를 완화하는 이유는 무엇인가?" },
    { id: "w3-q18", question: "Batch Normalization과 Layer Normalization은 각각 어떤 축(배치 축 vs 특징 축)을 따라 평균·분산을 계산하는가? Transformer 계열 모델이 BatchNorm 대신 LayerNorm을 쓰는 이유를 배치 크기·시퀀스 길이 관점에서 설명하라." },
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "신경망은 실수로부터 어떻게 배우는가?"', hint: "오늘 배운 내용을 한 문장 질문으로 바꿔 적어보세요. 예: '역전파는 왜 순전파 한 번 값으로 모든 기울기를 구할 수 있을까?'" },
    { label: "② 키워드 6개", hint: "쉼표로 구분해 6개를 적어보세요. 예: 연쇄법칙, 계산 그래프, 국소 미분, 위상정렬, 기울기 소실, 적응 학습률." },
    { label: "③ 그림 — L=(w·x+c−y)² 의 계산 그래프를 그리고 각 엣지에 기울기 적기", hint: "노드를 곱셈·덧셈·제곱으로 쪼갠 뒤, 본문 예제처럼 임의의 숫자를 대입해 각 엣지 위에 순전파 값과 역전파 기울기를 함께 적어보세요." },
    { label: "④ 수식 — 한 층의 dL/dW, dL/dx 유도. shape 표기", hint: "책을 보지 말고 z=Wx+b에서 δ=dL/dz로부터 dL/dW, dL/db, dL/dx를 유도하고, 각 결과의 shape이 W, b, x와 맞는지 직접 확인해보세요." },
    { label: '⑤ 설명하기 — "역전파는 그냥 연쇄법칙인데 왜 혁신이었나?" (계산 재사용, 효율 O(순전파))', hint: "'계산 재사용'이라는 단어를 반드시 넣어서, 왜 순전파 한 번 비용으로 파라미터 전부의 기울기를 구할 수 있는지 초등학생도 알아들을 수준으로 설명해보세요." },
    { label: "⑥ 막힌 곳 / 보완", hint: "책이나 본문을 펴서 확인한 뒤, 다른 색 펜으로 보완한 내용을 적어보세요." },
  ],
  assignmentMd: `
### 필수

1. 「미니 자동미분 엔진」 단계 실습의 Value 클래스에 \`__truediv__\`(나눗셈)와 \`exp\`를 추가하고, 각 연산의 국소 미분을 손으로 유도해 주석으로 남길 것. (힌트: $a/b = a \\cdot b^{-1}$, $\\frac{d}{dx}e^x = e^x$)
2. Value로 뉴런·층·MLP 클래스를 만들어 make_moons를 분류하라. **권장 설정**(\`make_moons(n_samples=200, noise=0.1, random_state=0)\`, 은닉층 16개 2층, tanh 또는 ReLU, 학습률 0.05, 100 에폭, 전체 배치)에서 훈련 정확도 90% 이상이면 통과다. 90%에 못 미치면 ① 학습률(너무 크거나 작지 않은가) ② 매 스텝 \`grad\`를 0으로 초기화했는가 ③ 가중치를 무작위로 초기화했는가 ④ 손실이 실제로 줄고 있는가를 순서대로 확인하고, 무엇을 고쳤는지 리포트에 적는다. 손실 곡선과 결정경계 그림을 함께 제출할 것.
3. **Gradient check**: 2번 MLP에서 임의로 고른 파라미터 5개에 대해 수치미분과 역전파 값의 상대오차를 표로 출력하라. $10^{-5}$를 넘는 것이 있다면 원인을 찾아 고치고 과정을 적는다.
4. 여러분만의 작은 계산 그래프(노드 4~6개, 곱셈·덧셈·거듭제곱 중 두 종류 이상)를 손으로 설계해 순전파 값과 모든 노드의 역전파 기울기를 표로 정리한 뒤, Value 클래스로 같은 계산을 재현해 일치하는지 확인하라.
5. 같은 문제를 PyTorch(\`nn.Module\`)로 Colab에서 구현해 정확도와 학습 시간을 비교하고, Value 구현이 느린 이유 3가지를 서술하라.

### 심화 (가산점)

- SGD·Momentum·Adam을 직접 구현해 2번 MLP의 손실 곡선을 한 그래프로 비교하라. 학습률을 최적화기마다 따로 튜닝했는지도 밝힐 것.
- ReLU vs tanh, 20층 깊이에서 층별 기울기 크기를 그려 소실/폭발을 관찰하라.

### 채점 기준 (10점)

| 항목 | 점수 |
| --- | --- |
| 국소 미분 유도의 정확성(1·4번) | 2 |
| 구현 정확성(gradient check 통과, 3번) | 3 |
| MLP 학습과 문제 해결 과정(2번) | 2 |
| PyTorch 비교와 해석(5번) | 2 |
| 코드 품질·가독성 | 1 |
`,
  assignmentMaxScore: 10,
  dueNote: "제출: 일요일 23:59 · Colab 링크 + 리포트",
};

export default week3;
