import { defineLesson, md } from "../../kit";
import exercises from "./labs/normalization-layers";

export default defineLesson({
  id: "normalization-layers",
  title: "정규화 층: BatchNorm과 LayerNorm",
  tier: "core",
  concepts: ["initialization-normalization"],
  goal: "BatchNorm과 LayerNorm이 평균과 분산을 계산하는 축의 차이를 작은 예제로 계산하고, Transformer가 LayerNorm을 쓰는 이유를 설명한다.",
  why: "BatchNorm과 LayerNorm은 대부분의 깊은 신경망에 들어가는 층이다. CNN은 주로 BatchNorm을, Transformer는 LayerNorm을 쓰며, 두 층은 평균과 분산을 계산하는 축만 다르다. 이 차이를 알아야 배치 크기를 바꿨을 때 성능이 달라지는 이유, 추론 전에 `model.eval()`을 호출해야 하는 이유, Transformer 블록의 구조를 설명할 수 있다.",
  body: md`
### 정규화 층이 하는 일

깊은 신경망에서는 앞쪽 층의 파라미터가 갱신될 때마다 뒤쪽 층에 들어가는 활성화 값의 평균과 분산이 달라진다. **정규화 층**(normalization layer)은 활성화 값 $z$를 평균 0, 분산 1로 표준화한 값 $\hat{z}$에 학습 가능한 스케일 $\gamma$와 이동 $\beta$를 적용해 $\gamma \hat{z} + \beta$를 출력한다. 정규화 층을 넣으면 큰 학습률에서도 학습이 안정적으로 진행되고 초기화에 덜 민감해진다. BatchNorm 원 논문은 그 이유를 층 입력 분포의 변화(internal covariate shift)를 줄이기 때문이라고 설명했지만, 이후 연구(Santurkar 외, 2018)는 손실 함수와 기울기가 파라미터에 따라 완만하게 변하도록(립시츠 상수가 작아지도록) 만드는 효과가 더 중요하다고 보고했다. 효과는 실험으로 분명히 확인되지만, 원인에 대한 설명은 아직 하나로 정리되지 않았다.

정규화 기법은 평균과 분산을 어느 축을 따라 계산하느냐로 구분된다.

### BatchNorm: 배치 축을 따라 정규화한다

**Batch Normalization**(BN)은 미니배치 축을 따라 정규화한다. 미니배치에 $m$개 샘플이 있고 특성(뉴런) $j$의 값이 $z_j^{(1)}, \dots, z_j^{(m)}$이면, BN은 같은 특성의 이 $m$개 값으로 평균과 분산을 계산한다.

\`\`\`math
\mu_j = \dfrac{1}{m}\sum_{i=1}^m z_j^{(i)}, \qquad \sigma_j^2 = \dfrac{1}{m}\sum_{i=1}^m (z_j^{(i)}-\mu_j)^2, \qquad \hat{z}_j^{(i)} = \dfrac{z_j^{(i)}-\mu_j}{\sqrt{\sigma_j^2+\epsilon}}
\`\`\`

$\epsilon$은 분산이 0일 때 0으로 나누지 않도록 더하는 작은 값이다(보통 $10^{-5}$). BN의 통계는 배치 구성에 따라 달라진다. 배치가 작으면 $\mu_j$와 $\sigma_j^2$의 추정 오차가 커지고, 추론할 때는 샘플이 하나씩 들어올 수 있으므로 학습 중에 계산해 둔 이동평균(running mean, running variance)을 대신 쓴다. PyTorch에서는 \`model.train()\`과 \`model.eval()\`이 이 두 동작을 전환한다([[lesson:pytorch]]).

\`\`\`image
src: /images/week3/bn-vs-gn-batch-size.png
alt: 가로축은 GPU 하나당 배치 크기(32, 16, 8, 4, 2), 세로축은 ImageNet 검증 오류율(%)인 꺾은선 그래프. Batch Norm(파랑)은 배치 32와 16에서 약 23.6%로 가장 낮지만 배치가 작아질수록 빠르게 올라 배치 2에서 약 34.7%가 된다. Group Norm(빨강)은 모든 배치 크기에서 약 24%로 거의 일정하다.
caption: ResNet-50을 ImageNet으로 학습하면서 GPU 하나당 배치 크기만 바꾼 실험이다. BatchNorm은 배치가 32, 16일 때 오류율 23.6~23.7%로 가장 낮지만, 샘플 2개로 평균과 분산을 추정해야 하는 배치 2에서는 34.7%까지 높아진다. 배치 통계를 쓰지 않는 Group Norm(채널을 여러 묶음으로 나눠 샘플마다 정규화)은 배치 크기와 관계없이 약 24%를 유지한다.
credit: Wu & He, "Group Normalization" (ECCV 2018), Figure 1, arXiv:1803.08494
width: 900
height: 600
maxWidth: 460
\`\`\`

### LayerNorm: 특성 축을 따라 정규화한다

**Layer Normalization**(LN)은 한 샘플이 가진 모든 특성을 따라 평균과 분산을 계산한다. 샘플 $i$의 특성이 $z_1^{(i)}, \dots, z_d^{(i)}$이면 다음과 같다.

\`\`\`math
\mu_i = \dfrac{1}{d}\sum_{k=1}^d z_k^{(i)}, \qquad \sigma_i^2 = \dfrac{1}{d}\sum_{k=1}^d (z_k^{(i)}-\mu_i)^2, \qquad \hat{z}_k^{(i)} = \dfrac{z_k^{(i)}-\mu_i}{\sqrt{\sigma_i^2+\epsilon}}
\`\`\`

식의 모양은 BN과 같고, 합을 구하는 축만 샘플($m$개)에서 특성($d$개)으로 바뀌었다. LN은 그 샘플 자신의 값만 쓰므로 배치에 다른 샘플이 몇 개 있는지와 무관하고, 배치 크기가 1이어도 계산할 수 있다. 학습과 추론의 계산도 같다.

### 작은 예제로 비교하기

샘플 2개, 특성 2개인 미니배치 $z=\begin{pmatrix}2 & 4\\ 6 & 8\end{pmatrix}$(행은 샘플, 열은 특성)에서 두 방식을 계산한다. BN은 열 방향으로 계산한다. 특성 1의 값 (2, 6)은 평균 4, 분산 4이고, 특성 2의 값 (4, 8)은 평균 6, 분산 4다. LN은 행 방향으로 계산한다. 샘플 1의 값 (2, 4)는 평균 3, 분산 1이고, 샘플 2의 값 (6, 8)은 평균 7, 분산 1이다. 같은 네 값에서 축만 바꿔도 통계가 달라진다.

NumPy로 옮기면 BN은 \`axis=0\`(샘플들에 걸쳐), LN은 \`axis=1\`(특성들에 걸쳐)이다.

\`\`\`python
import numpy as np

z = np.array([[2.0, 4.0],      # 샘플 1
              [6.0, 8.0]])     # 샘플 2  (열 = 특성)
bn_mean, bn_var = z.mean(axis=0), z.var(axis=0)                      # BatchNorm: 특성마다, 샘플들에 걸쳐
ln_mean, ln_var = z.mean(axis=1, keepdims=True), z.var(axis=1, keepdims=True)   # LayerNorm: 샘플마다, 특성들에 걸쳐
print("BN 평균", bn_mean, "분산", bn_var)
print("LN 평균", ln_mean.ravel(), "분산", ln_var.ravel())
eps = 1e-5
print("BN 결과:\n", np.round((z - bn_mean) / np.sqrt(bn_var + eps), 3))
print("LN 결과:\n", np.round((z - ln_mean) / np.sqrt(ln_var + eps), 3))
\`\`\`

BN에서는 각 특성 안에서 샘플 1이 작고 샘플 2가 크므로 결과가 $[-1, -1], [1, 1]$이고, LN에서는 각 샘플 안에서 특성 1이 작고 특성 2가 크므로 결과가 $[-1, 1], [-1, 1]$이다.

[[diagram:bn-ln-example]]

### Transformer가 LayerNorm을 쓰는 이유

Transformer([[lesson:transformer-block]])에서는 샘플 하나가 토큰 하나에 해당한다. 은닉 상태 텐서의 모양이 (배치 $B$, 길이 $T$, 은닉 차원 $d_{model}$)이면, LayerNorm은 토큰 벡터 하나($d_{model}$개 값)마다 평균과 분산을 따로 계산한다. $B \times T$개 토큰이 각자의 통계로 정규화되고, 같은 문장의 다른 토큰이나 다른 문장은 계산에 쓰이지 않는다. 문장 안의 토큰들을 모아 평균을 내면 한 토큰의 출력이 같은 문장의 다른 토큰에 의존하게 되고, 생성 과정에서는 아직 만들어지지 않은 뒤쪽 토큰에도 의존하게 된다. LayerNorm은 토큰마다 독립적으로 계산하므로 문장 길이가 다르거나 패딩 토큰이 섞여 있어도, 생성 중에 토큰이 하나씩 추가되어도 기존 토큰의 정규화 결과가 바뀌지 않는다. BatchNorm을 쓰면 통계가 배치 크기, 문장 구성, 패딩 비율에 따라 달라지고, 학습과 추론에서 쓰는 통계도 달라진다.

| | 정규화 축 | 배치 크기 의존성 | 주로 쓰는 곳 |
| --- | --- | --- | --- |
| BatchNorm | 배치 축(같은 특성, 다른 샘플). CNN에서는 채널마다 배치·높이·너비 전체 | 있음: 배치가 작으면 추정 오차가 크고, 추론에는 이동평균을 쓴다 | CNN |
| LayerNorm | 특성 축(같은 샘플, 다른 특성). Transformer에서는 토큰마다 $d_{model}$ 축 | 없음: 샘플(토큰) 하나로 계산한다 | Transformer, RNN |

\`\`\`image
src: /images/week3/normalization-axes.png
alt: 정육면체 네 개로 그린 특성 맵 텐서. 각 정육면체의 세 축은 배치 N, 채널 C, 공간 위치 H·W다. Batch Norm은 채널 하나에 해당하는 N·H·W 면 전체가, Layer Norm은 샘플 하나에 해당하는 C·H·W 면 전체가, Instance Norm은 샘플 하나·채널 하나의 H·W 기둥이, Group Norm은 샘플 하나·채널 몇 개 묶음의 H·W 영역이 파랗게 칠해져 있다.
caption: CNN의 특성 맵(배치 N × 채널 C × 높이·너비 H, W)에서 파랗게 칠한 칸들이 같은 평균과 분산으로 정규화된다. BatchNorm은 채널마다 배치·높이·너비 전체의 값으로, LayerNorm은 샘플 하나의 모든 채널·위치의 값으로 통계를 계산한다. Instance Norm(샘플 하나·채널 하나)과 Group Norm(샘플 하나·채널 묶음)은 그 중간에 해당한다. 배치 축(N)을 쓰는 것은 BatchNorm뿐이므로, 나머지는 배치 크기와 관계없이 학습과 추론에서 같은 계산을 한다.
credit: Wu & He, "Group Normalization" (ECCV 2018), Figure 2, arXiv:1803.08494
width: 1200
height: 315
\`\`\`

두 기법 모두 표준화한 뒤 학습 가능한 $\gamma$, $\beta$를 적용한다. $\gamma = \sqrt{\sigma^2 + \epsilon}$, $\beta = \mu$로 학습되면 표준화 전의 값이 그대로 복원되므로, 정규화 층을 넣어도 신경망이 표현할 수 있는 함수의 범위가 줄지 않는다.
`,
  checks: [
    {
      key: "c1",
      question: "미니배치 $z = \\begin{pmatrix}1 & 3\\\\ 5 & 7\\end{pmatrix}$(행은 샘플, 열은 특성)에서 LayerNorm이 샘플 1에 대해 계산하는 평균은?",
      choices: ["$2$", "$3$", "$4$", "$6$"],
      answer: 0,
      explanation: "LayerNorm은 한 샘플 안의 특성들로 평균을 낸다: $(1 + 3)/2 = 2$. BatchNorm이라면 특성 1에 대해 $(1 + 5)/2 = 3$이다.",
    },
    {
      key: "c2",
      question: "배치 크기가 1일 때 학습 모드의 BatchNorm에서 일어나는 일은?",
      choices: [
        "평균이 무한대가 된다",
        "각 특성의 배치 평균이 그 값 자신이고 분산이 0이어서, 출력이 입력과 관계없이 모두 $\\beta$가 된다",
        "아무 문제 없다",
        "LayerNorm으로 자동 전환된다",
      ],
      answer: 1,
      explanation: "샘플이 하나면 $\\mu_j = z_j$, $\\sigma_j^2 = 0$이므로 표준화한 값이 모두 0이고 출력은 $\\beta$뿐이다. 입력의 정보가 다음 층으로 전달되지 않는다(PyTorch는 이 경우 학습 모드에서 오류를 낸다). 그래서 추론에서는 학습 중에 계산해 둔 이동평균을 쓰고, 배치 구성이 일정하지 않은 Transformer는 LayerNorm을 쓴다.",
    },
    {
      key: "c3",
      question: "정규화 뒤에 학습 가능한 $\\gamma$, $\\beta$를 다시 곱하고 더하는 이유는?",
      choices: [
        "계산을 빠르게 하려고",
        "필요하면 표준화 전의 스케일과 위치로 되돌릴 수 있게 해 표현력을 유지하려고",
        "분산을 0으로 만들려고",
        "기울기를 끊으려고",
      ],
      answer: 1,
      explanation: "$\\gamma = \\sqrt{\\sigma^2 + \\epsilon}$, $\\beta = \\mu$로 학습되면 표준화 전의 값이 복원된다. 표준화 때문에 신경망이 표현할 수 있는 함수의 범위가 줄지 않게 한다.",
    },
    {
      key: "c4",
      question: "Transformer의 은닉 상태 텐서 모양이 (배치 $B$, 길이 $T$, $d_{model}$)일 때, LayerNorm은 평균과 분산을 어떻게 계산하는가?",
      choices: [
        "문장 하나의 모든 토큰($T$개)을 모아 특성마다 계산한다",
        "배치 전체($B \\times T$개 토큰)를 모아 특성마다 계산한다",
        "토큰마다 따로, 그 토큰 벡터의 $d_{model}$개 값으로 계산한다",
        "배치의 첫 토큰으로 계산한 통계를 모든 토큰에 쓴다",
      ],
      answer: 2,
      explanation: "LayerNorm은 마지막 축($d_{model}$)만 쓴다. 같은 문장의 다른 토큰도 계산에 쓰지 않으므로 문장 길이, 패딩, 배치 구성이 바뀌거나 생성 중에 토큰이 추가되어도 기존 토큰의 결과가 바뀌지 않는다. 둘째 선택지는 BatchNorm을 시퀀스에 적용한 방식이다.",
    },
    {
      key: "c5",
      question: "$z = \\begin{pmatrix}2 & 4\\\\ 6 & 8\\end{pmatrix}$(행은 샘플)에서 BatchNorm이 특성 2(둘째 열)에 대해 계산하는 평균과 분산은?",
      choices: ["평균 6, 분산 4", "평균 7, 분산 1", "평균 5, 분산 5", "평균 3, 분산 1"],
      answer: 0,
      explanation: "BN은 같은 특성의 샘플 값(4와 8)으로 계산한다: 평균 6, 분산 $\\frac{(4-6)^2 + (8-6)^2}{2} = 4$. 평균 7, 분산 1은 LN이 샘플 2에 대해 계산한 값이다.",
    },
    {
      key: "c6",
      question: "NumPy에서 모양이 `(B, d)`인 배열에 LayerNorm의 평균을 구하는 코드는?",
      choices: ["`z.mean(axis=1, keepdims=True)`", "`z.mean(axis=0)`", "`z.mean()`", "`z.mean(axis=0, keepdims=True)`"],
      answer: 0,
      explanation: "LN은 샘플(행)마다 특성 축으로 평균을 낸다. `axis=1`이고, 각 행에서 빼려면 `keepdims=True`로 `(B, 1)` 모양을 유지한다. `axis=0`은 BatchNorm의 계산이다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "BatchNorm과 LayerNorm이 평균과 분산을 계산하는 축을 각각 쓰고, Transformer가 BatchNorm 대신 LayerNorm을 쓰는 이유를 배치 크기와 시퀀스 길이의 관점에서 쓰라.",
      answer: md`
BatchNorm은 같은 특성에 대해 배치 안의 여러 샘플 값으로(배치 축) 평균과 분산을 계산하고, LayerNorm은 한 샘플의 모든 특성 값으로(특성 축) 계산한다. Transformer에서 LayerNorm은 (배치, 길이, $d_{model}$) 텐서의 마지막 축, 즉 토큰 하나의 $d_{model}$개 값으로 토큰마다 따로 정규화한다. 문장 안의 여러 토큰을 모아 평균을 내지 않는다.

그래서 LayerNorm의 결과는 배치 크기, 시퀀스 길이, 패딩과 무관하고, 학습과 추론의 계산이 같으며, 생성 중에 토큰이 추가되어도 기존 토큰의 결과가 바뀌지 않는다. 길이가 서로 다른 시퀀스를 다루는 Transformer에 이 성질이 필요하다. BatchNorm은 배치 통계를 쓰므로 배치가 작거나 패딩이 많으면 추정 오차가 커지고, 추론할 때는 학습 중에 계산한 이동평균을 써야 한다.
`,
      keyPoints: [
        "BatchNorm은 같은 특성의 여러 샘플 값(배치 축)으로 평균과 분산을 계산한다",
        "LayerNorm은 한 샘플(토큰)의 모든 특성 값($d_{model}$ 축)으로 계산한다",
        "LayerNorm은 배치 크기·시퀀스 길이·패딩과 무관하고 학습과 추론의 계산이 같다",
        "BatchNorm은 작은 배치에서 추정 오차가 크고 추론에 이동평균이 필요하다",
      ],
    },
  ],
  references: [
    { title: "Ioffe & Szegedy (2015) — Batch Normalization", url: "https://arxiv.org/abs/1502.03167", note: "BatchNorm 원 논문 (영문)" },
    { title: "Ba, Kiros & Hinton (2016) — Layer Normalization", url: "https://arxiv.org/abs/1607.06450", note: "LayerNorm 원 논문: 배치 통계를 쓰지 않는 정규화 (영문)" },
    { title: "Santurkar et al. (2018) — How Does Batch Normalization Help Optimization?", url: "https://arxiv.org/abs/1805.11604", note: "BatchNorm의 효과에 대한 다른 설명 (영문)" },
  ],
});
