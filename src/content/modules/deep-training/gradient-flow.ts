import { defineLesson, md } from "../../kit";
import exercises from "./labs/gradient-flow";

export default defineLesson({
  id: "gradient-flow",
  title: "기울기 전달의 수학과 기울기 클리핑",
  tier: "advanced",
  goal: "역전파되는 기울기를 야코비안 전치의 곱으로 쓰고 기울기 소실과 폭주를 그 곱의 크기로 설명하며, 잔차 연결이 기울기의 직접 경로를 만드는 이유와 노름 기준 기울기 클리핑을 구현한다.",
  why: "수백 층의 망과 긴 시퀀스를 다루는 RNN, Transformer는 기울기의 크기가 층과 시간 단계를 지나며 어떻게 바뀌는지에 따라 학습 가능 여부가 갈린다. 대형 언어 모델 학습에서는 기울기 클리핑을 거의 항상 쓰며, 잔차 가지를 작게 초기화하는 설정도 이 분석에서 나왔다.",
  body: md`
[[lesson:initialization]]에서는 활성화의 표준편차가 층마다 1.5배나 0.8배가 되면 10층 뒤 각각 약 57.7배, 0.107배가 되는 것을 확인했다. 이 레슨은 같은 현상을 역전파되는 기울기의 관점에서 식으로 쓰고, 잔차 연결과 기울기 클리핑이 기울기의 크기를 어떻게 바꾸는지 계산한다.

### 기울기는 야코비안 전치의 곱으로 전달된다

층 $h_{l} = \phi(W_l h_{l-1})$에서 $h_{l-1}$에 대한 야코비안은 $J_l = \operatorname{diag}(\phi'(z_l))\,W_l$이다. 출력 쪽 기울기 $g_L = \partial L/\partial h_L$은 역전파를 거쳐 다음과 같이 입력 쪽에 전달된다.

$$\frac{\partial L}{\partial h_0} = J_1^\top J_2^\top \cdots J_L^\top\, g_L$$

행렬 $L$개를 곱한 결과의 크기는 대략 각 행렬이 벡터의 길이를 바꾸는 비율(특이값)의 곱이다. 층마다 평균 0.8배로 줄이면 50층 뒤 $0.8^{50} \approx 1.4 \times 10^{-5}$배, 1.2배로 늘리면 $1.2^{50} \approx 9100$배가 된다. tanh의 미분 $\phi'(z) = 1 - \tanh^2 z \le 1$은 $|z|$가 크면 0에 가까워 기울기를 줄이는 쪽으로 작용하고, 가중치의 스케일은 늘리는 쪽으로 작용한다. 두 효과가 균형을 이루도록 초기화하면 기울기의 노름이 깊은 층까지 유지된다. 이 조건을 엄밀하게 다룬 연구가 직교 초기화와 동역학적 등거리성(dynamical isometry)이다(Saxe 외, 2014; Pennington 외, 2017). 다만 이 균형은 조건이 까다로워, 학습 중 가중치가 바뀌면 유지되지 않는 경우가 많다.

### 잔차 연결의 야코비안

잔차 연결([[lesson:dropout-residual]]) $h_l = h_{l-1} + F(h_{l-1})$은 야코비안을 $J_l = I + \partial F/\partial h$로 바꾼다. 역전파되는 기울기는 다음과 같다.

$$g_{l-1} = g_l + \left(\frac{\partial F}{\partial h}\right)^{\!\top} g_l$$

층을 지날 때마다 원래 기울기 $g_l$이 그대로 더해지는 경로가 생긴다. 곱해지는 행렬이 $I$에 작은 행렬을 더한 형태이므로, $F$의 야코비안이 작아도 기울기가 0에 가까워지지 않는다. 반대로 $I$에 작은 행렬을 더한 것을 수백 번 곱하면 크기가 조금씩 커질 수 있다. 그래서 실제 모델은 잔차 가지의 출력을 작게 초기화하거나 $1/\sqrt{L}$로 줄이고, LayerNorm 같은 정규화 층과 함께 쓴다. Transformer의 블록도 모두 잔차 연결을 쓴다([[lesson:transformer-block]]).

[[diagram:grad-norm-depth]]

### 기울기 클리핑

초기화와 구조를 잘 골라도, 학습 중 손실 함수의 곡률이 매우 큰 영역에 도달하면 기울기가 갑자기 커질 수 있다. RNN과 큰 Transformer에서 자주 일어난다. **노름 기준 기울기 클리핑**(gradient clipping by norm)은 모든 파라미터의 기울기를 이어 붙인 벡터의 노름 $\lVert g\rVert$가 임계값 $c$를 넘으면 다음과 같이 길이만 $c$로 줄이고 방향은 유지한다(Pascanu 외, 2013).

$$g \leftarrow g \cdot \frac{c}{\lVert g \rVert}$$

원소마다 따로 자르는 방식과 달리 기울기의 방향이 바뀌지 않는다. PyTorch에서는 \`torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\`을 \`loss.backward()\`와 \`optimizer.step()\` 사이에 넣는다. 대형 언어 모델 학습은 대부분 1.0 근처의 임계값을 쓴다.

\`\`\`image
src: /images/week3/gradient-cliff.png
alt: 은닉 유닛이 하나인 순환 신경망의 오차 곡면을 가중치 w와 편향 b에 대해 그린 3차원 그림. 완만한 영역 옆에 오차가 수직에 가깝게 증가하는 영역이 있고, 실선 화살표는 그 영역에서 경사하강법의 갱신이 멀리 이동하는 경로, 점선 화살표는 기울기의 노름을 제한했을 때 가까이 이동하는 경로다.
caption: 순환 신경망의 오차 곡면에서 곡률이 매우 큰 영역(논문에서는 cliff라 부른다). 실선: 이 영역에서 기울기가 매우 커져 한 번의 갱신으로 파라미터가 멀리 이동하고 손실이 크게 늘어난다. 점선: 기울기 노름이 임계값을 넘을 때 길이만 줄이면(방향은 유지) 이 영역 근처에서도 작은 갱신량으로 손실이 계속 줄어든다.
credit: Pascanu, Mikolov & Bengio (2013), On the difficulty of training recurrent neural networks, Figure 6 (arXiv:1211.5063)
width: 477
height: 339
maxWidth: 477
\`\`\`

노름 기준 클리핑은 NumPy로 몇 줄이면 구현된다. 여러 파라미터의 기울기를 하나의 긴 벡터로 보고 전체 노름을 구한 뒤, 임계값을 넘을 때만 같은 비율로 줄인다.

\`\`\`python
import numpy as np

def clip_by_norm(grads, max_norm):
    total = np.sqrt(sum(np.sum(g ** 2) for g in grads))   # 모든 기울기를 이어 붙인 벡터의 노름
    if total <= max_norm:
        return grads, total                               # 임계값 이하이면 그대로
    return [g * (max_norm / total) for g in grads], total

grads = [np.array([30.0, 40.0]), np.array([120.0])]       # 노름 = sqrt(900 + 1600 + 14400) = 130
clipped, total = clip_by_norm(grads, 5.0)
print("원래 노름:", total)
print("클리핑 후:", [np.round(g, 3) for g in clipped])
print("클리핑 후 노름:", round(float(np.sqrt(sum(np.sum(g ** 2) for g in clipped))), 3))
\`\`\`

세 성분의 비율 $30 : 40 : 120$은 유지되고 전체 노름만 130에서 5가 되었다. 원소마다 $[-5, 5]$로 자르면 $[5, 5, 5]$가 되어 방향이 바뀐다.

[[diagram:clip-norm-vs-value]]
`,
  checks: [
    {
      key: "c1",
      question: "층마다 기울기의 노름을 평균 0.8배로 줄이는 망에서 역전파로 50층을 지나면 기울기의 크기는 대략 몇 배가 되는가?",
      choices: ["$10^{-5}$배", "$0.4$배", "$10^{-2}$배", "그대로"],
      answer: 0,
      explanation: "$0.8^{50} \\approx 1.4 \\times 10^{-5}$이다. 행렬을 여러 번 곱하면 층마다의 작은 비율 차이가 지수적으로 누적된다.",
    },
    {
      key: "c2",
      question: "잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$에서 $h_{l-1}$에 대한 야코비안은?",
      choices: ["$I + \\partial F/\\partial h$", "$\\partial F/\\partial h$", "$I$", "$2I$"],
      answer: 0,
      explanation: "항등 경로의 야코비안 $I$가 더해지므로 층마다 원래 기울기가 그대로 전달되는 경로가 생긴다. 같은 작은 초기화를 써도 잔차 연결이 있는 망은 50층에서 기울기가 0에 가까워지지 않는다.",
    },
    {
      key: "c3",
      question: "전체 기울기 노름이 130이고 클리핑 임계값이 5일 때 노름 기준 클리핑의 결과로 옳은 것은?",
      choices: ["모든 기울기에 $5/130$을 곱해 방향은 유지하고 노름만 5로 만든다", "각 원소를 $[-5, 5]$로 자른다", "기울기를 0으로 만든다", "학습률을 5로 바꾼다"],
      answer: 0,
      explanation: "$g \\leftarrow g \\cdot c/\\lVert g\\rVert$이다. 원소별로 자르는 방식과 달리 방향이 바뀌지 않는다.",
    },
    {
      key: "c4",
      question: "클리핑 임계값이 5인데 전체 기울기 노름이 3이라면 노름 기준 클리핑의 결과는?",
      choices: ["아무것도 바꾸지 않는다", "노름을 5로 키운다", "모든 기울기에 $5/3$을 곱한다", "기울기를 0으로 만든다"],
      answer: 0,
      explanation: "노름 기준 클리핑은 노름이 임계값을 넘을 때만 기울기를 줄인다. 임계값 이하의 기울기는 그대로 둔다.",
    },
    {
      key: "c5",
      question: "기울기 $[30, 40]$(노름 50)을 원소마다 $[-5, 5]$로 자르는 방식과 노름 5로 클리핑하는 방식의 결과를 바르게 짝지은 것은?",
      choices: ["원소별: $[5, 5]$(방향이 바뀜) / 노름: $[3, 4]$(방향 유지)", "원소별: $[3, 4]$ / 노름: $[5, 5]$", "둘 다 $[3, 4]$", "둘 다 $[5, 5]$"],
      answer: 0,
      explanation: "원소별로 자르면 각 성분이 5로 잘려 $[5, 5]$가 되고 방향이 45도로 바뀐다. 노름 기준 클리핑은 노름을 50에서 5로, 즉 0.1배를 곱해 $[3, 4]$가 되고 방향이 유지된다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "깊은 망에서 기울기가 소실되거나 폭주하는 이유를 야코비안 전치의 곱으로 쓰라. 잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$이 기울기 소실을 막는 이유와, 노름 기준 기울기 클리핑이 방향을 바꾸지 않는 이유도 쓰라.",
      answer: md`
층 $h_l = \phi(W_l h_{l-1})$의 야코비안은 $J_l = \mathrm{diag}(\phi'(z_l))W_l$이고, 입력 쪽 기울기는 $J_1^\top \cdots J_L^\top g_L$이다. 행렬 $L$개를 곱한 결과의 크기는 각 행렬이 벡터의 길이를 바꾸는 비율의 곱이므로, 층마다 1보다 조금만 작아도 지수적으로 0에 가까워지고(0.8배씩 50층이면 약 $10^{-5}$배), 조금만 커도 지수적으로 커진다.

잔차 연결에서는 야코비안이 $I + \partial F/\partial h$가 되어 역전파가 $g_{l-1} = g_l + (\partial F/\partial h)^\top g_l$이 된다. 층마다 원래 기울기가 그대로 더해지는 경로가 생기므로 $F$의 야코비안이 작아도 기울기가 0에 가까워지지 않는다. 노름 기준 클리핑은 모든 기울기를 이어 붙인 벡터의 노름이 $c$를 넘을 때 전체에 같은 스칼라 $c/\lVert g\rVert$를 곱하므로, 길이만 줄고 방향은 유지된다.
`,
      keyPoints: [
        "입력 쪽 기울기는 야코비안 전치 $L$개의 곱이다",
        "층마다의 비율이 1보다 작거나 크면 지수적으로 소실되거나 폭주한다",
        "잔차 연결의 야코비안 $I + \\partial F/\\partial h$는 기울기의 직접 경로를 만든다",
        "노름 클리핑은 모든 성분에 같은 스칼라를 곱해 방향을 유지한다",
      ],
    },
    {
      key: "d2",
      question: "50층 tanh 망을 작은 초기화로 학습했더니 앞쪽 층의 가중치가 거의 바뀌지 않았다. 원인을 야코비안의 곱으로 진단하고, 잔차 연결이 이를 어떻게 바꾸는지 식으로 쓰라. 잔차 연결만으로 충분하지 않을 수 있는 이유와 보완 방법도 쓰라.",
      answer: md`
입력 쪽 기울기는 $J_1^\top\cdots J_{50}^\top g$이고, 각 $J_l = \mathrm{diag}(1-\tanh^2 z_l)W_l$은 작은 초기화와 1 이하인 tanh의 미분 때문에 벡터의 길이를 평균적으로 줄인다. 그 비율이 50번 곱해져 기울기가 지수적으로 작아진다(실습의 설정에서 50층 뒤 약 $3 \times 10^{-16}$). 앞쪽 층 가중치의 기울기는 이 작은 기울기에 비례하므로 가중치가 거의 갱신되지 않는다.

잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$은 야코비안을 $I + \partial F/\partial h$로 바꾸어 역전파가 $g_{l-1} = g_l + (\partial F/\partial h)^\top g_l$이 되므로, 원래 기울기가 그대로 전달되는 경로가 층마다 생긴다. 다만 $I$에 작은 행렬을 더한 것을 수백 번 곱하면 기울기와 활성화가 점점 커질 수 있다(실습의 설정에서 50층 뒤 약 7.8). 그래서 잔차 가지를 0 근처로 초기화하거나 $1/\sqrt{L}$로 줄이고, LayerNorm 같은 정규화 층과 기울기 클리핑을 함께 쓴다.
`,
      keyPoints: [
        "기울기는 야코비안 전치의 곱이고 비율이 지수적으로 누적된다",
        "작은 초기화와 1 이하인 tanh 미분이 기울기를 줄인다",
        "잔차 연결의 야코비안 $I + \\partial F/\\partial h$가 기울기의 직접 경로를 만든다",
        "보완: 잔차 가지 축소, 정규화 층, 기울기 클리핑",
      ],
    },
  ],
  references: [
    { title: "Pascanu, Mikolov & Bengio (2013) — On the difficulty of training recurrent neural networks", url: "https://arxiv.org/abs/1211.5063", note: "기울기 소실·폭주의 분석과 노름 기준 클리핑 (영문)" },
    { title: "He et al. (2016) — Identity Mappings in Deep Residual Networks", url: "https://arxiv.org/abs/1603.05027", note: "잔차 연결이 기울기를 직접 전달하는 이유 (영문)" },
  ],
});
