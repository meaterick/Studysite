import { defineLesson, md } from "../../kit";
import exercises from "./labs/gradient-flow";

export default defineLesson({
  id: "gradient-flow",
  title: "기울기 흐름의 수학과 기울기 클리핑",
  tier: "advanced",
  goal: "역전파되는 기울기를 야코비안 전치의 곱으로 쓰고 소실·폭발을 특이값으로 설명하며, 잔차 연결이 기울기 경로를 보존하는 이유와 노름 기준 기울기 클리핑을 구현할 수 있다.",
  why: "",
  body: md`
핵심 과정 「기울기 소실·폭발과 가중치 초기화」 단계에서는 활성화의 표준편차가 층마다 1.5배, 0.8배가 되면 10층 뒤 57배, 0.1배가 된다는 것을 봤다. 이 단계는 같은 현상을 **역전파되는 기울기**의 관점에서 정확히 쓰고, 현대 신경망이 수백 층을 학습시키는 두 열쇠인 잔차 연결과 기울기 클리핑이 왜 작동하는지 보인다.

### 기울기는 야코비안 전치의 곱을 지나간다

층 $h_{l} = \phi(W_l h_{l-1})$에서 $h_{l-1}$에 대한 야코비안은 $J_l = \operatorname{diag}(\phi'(z_l))\,W_l$이다. 출력 쪽 기울기 $g_L = \partial L/\partial h_L$은 역전파로

$$\frac{\partial L}{\partial h_0} = J_1^\top J_2^\top \cdots J_L^\top\, g_L$$

을 지나 입력 쪽에 도착한다. 행렬 $L$개를 곱한 결과의 크기는 대략 각 행렬이 벡터를 늘리거나 줄이는 비율(특이값)의 곱이다. 층마다 평균적으로 0.8배씩 줄이면 50층 뒤 $0.8^{50} \approx 10^{-5}$, 1.2배씩 늘리면 $1.2^{50} \approx 9000$배다. tanh의 $\phi'(z) = 1 - \tanh^2 z \le 1$은 포화 구간에서 0에 가까워 줄이는 쪽으로 작용하고, 가중치의 스케일은 늘이는 쪽으로 작용한다. 둘이 정확히 균형을 이루도록 초기화하면 기울기 노름이 오래 유지되는데, 이 조건을 엄밀하게 추구한 것이 직교 초기화와 "동역학적 등거리성(dynamical isometry)" 연구다(Saxe et al., 2014; Pennington et al., 2017). 하지만 이 균형은 칼날 위에 서 있어서, 학습이 진행되며 가중치가 바뀌면 쉽게 무너진다.

### 잔차 연결: 기울기를 위한 고속도로

4주차의 ResNet이 도입한 **잔차 연결(residual connection)** $h_l = h_{l-1} + F(h_{l-1})$은 야코비안을 $J_l = I + \partial F/\partial h$로 바꾼다. 역전파되는 기울기는

$$g_{l-1} = g_l + \left(\frac{\partial F}{\partial h}\right)^{\!\top} g_l$$

로, 층을 거칠 때마다 **원래 기울기가 그대로 더해지는 경로**가 생긴다. 곱의 사슬이 "1 + 작은 값"들의 곱이 되므로 $F$의 야코비안이 작아도 기울기가 0으로 사라지지 않는다. 반대로 "1 + 작은 값"을 수백 번 곱하면 조금씩 커질 수 있으므로, 실제 모델은 잔차 가지의 출력을 작게 초기화하거나 $1/\sqrt{L}$로 줄이고, 정규화 층(LayerNorm)과 함께 쓴다. Transformer의 블록 하나하나도 잔차 연결로 감싸여 있다(5주차).

[[diagram:grad-norm-depth]]

### 기울기 클리핑: 폭발에 대한 안전장치

초기화와 구조를 잘 골라도 학습 도중 손실 지형의 가파른 절벽을 만나면 기울기가 순간적으로 폭발할 수 있다(특히 RNN과 큰 Transformer). **노름 기준 기울기 클리핑**은 모든 파라미터 기울기를 이어 붙인 벡터의 노름 $\lVert g\rVert$가 임계값 $c$를 넘으면

$$g \leftarrow g \cdot \frac{c}{\lVert g \rVert}$$

로 길이만 $c$로 줄이고 **방향은 그대로** 둔다(Pascanu et al., 2013). 원소마다 따로 자르는 방식과 달리 기울기의 방향을 왜곡하지 않는다. PyTorch에서는 \`torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\`을 \`loss.backward()\`와 \`optimizer.step()\` 사이에 넣는다. 대형 언어 모델 학습은 거의 항상 1.0 근처의 클리핑을 쓴다.

\`\`\`image
src: /images/week3/gradient-cliff.png
alt: 은닉 유닛 하나짜리 순환 신경망의 오차 곡면을 가중치 w와 편향 b에 대해 그린 3차원 그림. 완만한 바닥 옆에 오차가 수직으로 치솟는 벽이 있고, 실선 화살표는 벽에 부딪힌 경사하강법이 멀리 튕겨 나가는 경로, 점선 화살표는 기울기를 일정 크기로 잘랐을 때 벽 근처에 머무는 경로다.
caption: 순환 신경망의 오차 곡면에 있는 '절벽'(곡률이 매우 큰 벽). 실선: 벽에 닿는 순간 기울기가 폭발해 한 스텝에 멀리 튕겨 나가며 그동안 학습한 성과를 잃는다. 점선: 기울기 노름이 임계값을 넘을 때 길이만 줄이면(방향은 그대로) 벽 근처에서도 작은 보폭으로 계속 내려간다.
credit: Pascanu, Mikolov & Bengio (2013), On the difficulty of training recurrent neural networks, Figure 6 (arXiv:1211.5063)
width: 477
height: 339
maxWidth: 477
\`\`\`

노름 기준 클리핑을 NumPy로 그대로 구현해 보면 몇 줄이다. 여러 파라미터의 기울기를 하나의 긴 벡터로 보고 전체 노름을 구한 뒤, 임계값을 넘을 때만 같은 비율로 줄인다.

\`\`\`python
import numpy as np

def clip_by_norm(grads, max_norm):
    total = np.sqrt(sum(np.sum(g ** 2) for g in grads))   # 모든 파라미터 기울기를 이어 붙인 벡터의 노름
    if total <= max_norm:
        return grads, total                               # 임계값 이하면 그대로
    return [g * (max_norm / total) for g in grads], total

grads = [np.array([30.0, 40.0]), np.array([120.0])]       # 노름 = sqrt(900 + 1600 + 14400) = 130
clipped, total = clip_by_norm(grads, 5.0)
print("원래 노름:", total)
print("클리핑 후:", [np.round(g, 3) for g in clipped])
print("클리핑 후 노름:", round(float(np.sqrt(sum(np.sum(g ** 2) for g in clipped))), 3))
\`\`\`

세 성분의 비율 $30 : 40 : 120$이 그대로 유지된 채 전체 노름만 130에서 5가 되었다. 원소마다 $[-5, 5]$로 자르는 방식이었다면 $[5, 5, 5]$가 되어 방향이 완전히 달라졌을 것이다.

[[diagram:clip-norm-vs-value]]
`,
  checks: [
    {
      key: "c1",
      question: "층마다 기울기 노름을 평균 0.8배로 줄이는 망에서 50층을 거슬러 내려가면 기울기는 대략?",
      choices: ["$10^{-5}$배", "$0.4$배", "$10^{-2}$배", "그대로"],
      answer: 0,
      explanation: "$0.8^{50} \\approx 1.4 \\times 10^{-5}$. 행렬 곱의 사슬에서는 작은 비율 차이가 지수적으로 누적된다.",
    },
    {
      key: "c2",
      question: "잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$에서 $h_{l-1}$에 대한 야코비안은?",
      choices: ["$I + \\partial F/\\partial h$", "$\\partial F/\\partial h$", "$I$", "$2I$"],
      answer: 0,
      explanation: "항등 경로의 야코비안 $I$가 더해지므로, 기울기는 층마다 원래 값이 그대로 전달되는 길을 가진다. 같은 작은 초기화라도 잔차 망은 50층에서 기울기가 사라지지 않는다.",
    },
    {
      key: "c3",
      question: "전체 기울기 노름이 130이고 클리핑 임계값이 5일 때 노름 기준 클리핑의 결과로 옳은 것은?",
      choices: ["모든 기울기에 $5/130$을 곱해 방향은 유지하고 노름만 5로 만든다", "각 원소를 $[-5, 5]$로 자른다", "기울기를 0으로 만든다", "학습률을 5로 바꾼다"],
      answer: 0,
      explanation: "$g \\leftarrow g \\cdot c/\\lVert g\\rVert$. 원소별 자르기와 달리 방향이 왜곡되지 않는다.",
    },
    {
      key: "c4",
      question: "클리핑 임계값이 5인데 전체 기울기 노름이 3이라면 노름 기준 클리핑의 결과는?",
      choices: ["아무것도 바꾸지 않는다", "노름을 5로 키운다", "모든 기울기에 $5/3$을 곱한다", "기울기를 0으로 만든다"],
      answer: 0,
      explanation: "클리핑은 노름이 임계값을 **넘을 때만** 줄이는 안전장치다. 임계값 이하의 기울기는 그대로 둔다.",
    },
    {
      key: "c5",
      question: "기울기 $[30, 40]$(노름 50)을 원소마다 $[-5, 5]$로 자르는 방식과 노름 5로 클리핑하는 방식의 결과를 바르게 짝지은 것은?",
      choices: ["원소별: $[5, 5]$(방향이 바뀜) / 노름: $[3, 4]$(방향 유지)", "원소별: $[3, 4]$ / 노름: $[5, 5]$", "둘 다 $[3, 4]$", "둘 다 $[5, 5]$"],
      answer: 0,
      explanation: "원소별 자르기는 각 성분을 5로 잘라 $[5, 5]$가 되어 방향이 45도로 바뀐다. 노름 클리핑은 $50 \\to 5$, 즉 0.1배를 곱해 $[3, 4]$로 방향을 유지한다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "깊은 망에서 기울기가 사라지거나 폭발하는 이유를 '야코비안 전치의 곱'으로 설명하라. 잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$이 기울기 소실을 막는 이유와, 노름 기준 기울기 클리핑이 방향을 바꾸지 않는 이유도 설명하라.",
      answer: md`
층 $h_l = \phi(W_l h_{l-1})$의 야코비안은 $J_l = \mathrm{diag}(\phi'(z_l))W_l$이고, 입력 쪽 기울기는 $J_1^\top \cdots J_L^\top g_L$이다. 행렬 $L$개를 곱하면 크기가 각 행렬의 늘이고 줄이는 비율의 곱이 되므로, 층마다 1보다 조금만 작아도 지수적으로 사라지고(0.8배씩 50층이면 약 $10^{-5}$), 조금만 커도 지수적으로 폭발한다. 잔차 연결에서는 야코비안이 $I + \partial F/\partial h$가 되어 역전파가 $g_{l-1} = g_l + (\partial F/\partial h)^\top g_l$이 되므로, 층마다 원래 기울기가 그대로 더해지는 경로가 생겨 $F$의 야코비안이 작아도 기울기가 사라지지 않는다. 노름 기준 클리핑은 모든 기울기를 이어 붙인 벡터의 노름이 $c$를 넘을 때 전체에 같은 스칼라 $c/\lVert g\rVert$를 곱하므로 길이만 줄고 방향은 그대로 유지된다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "50층짜리 tanh 망을 작은 초기화로 학습시켰더니 앞쪽 층의 가중치가 전혀 바뀌지 않았습니다. 원인을 야코비안의 곱으로 진단하고, 잔차 연결이 이를 어떻게 바꾸는지 식으로 보이십시오. 잔차 연결만으로 충분하지 않을 수 있는 이유와 보완책도 적으십시오.",
      answer: md`
입력 쪽 기울기는 $J_1^\top\cdots J_{50}^\top g$이고 각 $J_l = \mathrm{diag}(1-\tanh^2 z_l)W_l$이 벡터를 평균적으로 줄이면(작은 초기화, tanh 미분이 1 이하) 그 비율이 50번 곱해져 기울기가 지수적으로 사라집니다(예: 50층에서 약 $10^{-16}$). 앞쪽 층의 가중치 기울기는 이 사라진 신호에 비례하므로 갱신되지 않습니다. 잔차 연결 $h_l = h_{l-1} + F(h_{l-1})$은 야코비안을 $I + \partial F/\partial h$로 바꾸어 역전파가 $g_{l-1} = g_l + (\partial F/\partial h)^\top g_l$이 되므로, 원래 기울기가 그대로 전달되는 경로가 층마다 생깁니다. 다만 '1 + 작은 값'을 수백 번 곱하면 기울기와 활성화가 서서히 커질 수 있으므로(예: 50층에서 약 7.8), 잔차 가지를 0 근처로 초기화하거나 $1/\sqrt{L}$로 줄이고, LayerNorm 같은 정규화 층과 기울기 클리핑을 함께 씁니다.
`,
      keyPoints: ["기울기 = 야코비안 전치의 곱, 비율이 지수적으로 누적", "tanh 미분이 1 이하이고 작은 초기화가 줄이는 쪽으로 작용", "잔차 연결의 야코비안 $I + \\partial F/\\partial h$: 기울기의 직접 경로", "보완: 잔차 가지 축소·정규화 층·클리핑"],
    },
  ],
  references: [
    { title: "Pascanu, Mikolov & Bengio (2013) — On the difficulty of training recurrent neural networks", url: "https://arxiv.org/abs/1211.5063", note: "기울기 소실·폭발의 분석과 노름 클리핑 (영문)" },
    { title: "He et al. (2016) — Identity Mappings in Deep Residual Networks", url: "https://arxiv.org/abs/1603.05027", note: "잔차 연결이 기울기를 직접 전달하는 이유 (영문)" },
  ],
});
