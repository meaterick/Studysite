import { defineLesson, md } from "../../kit";
import exercises from "./labs/normalization-layers";

export default defineLesson({
  id: "normalization-layers",
  title: "정규화 층: BatchNorm과 LayerNorm",
  tier: "core",
  concepts: ["initialization-normalization"],
  goal: "BatchNorm과 LayerNorm이 평균·분산을 계산하는 축의 차이를 작은 예제로 계산하고, Transformer가 LayerNorm을 쓰는 이유를 설명할 수 있다.",
  why: "",
  body: md`
깊은 네트워크를 학습시킬 때 층을 통과할 때마다 활성화 값의 분포(평균과 분산)가 스텝마다 계속 흔들리면, 뒤쪽 층은 매번 달라지는 입력 분포에 다시 적응해야 해서 학습이 느려지고 불안정해진다. 정규화(normalization) 층은 이 문제를 완화하려고, 활성화 값 $z$를 평균 0·분산 1로 표준화한 뒤 학습 가능한 스케일 $\gamma$와 이동 $\beta$를 다시 곱하고 더해 $\hat{z}=\gamma\cdot\text{표준화}(z)+\beta$ 형태로 되돌려준다. (이 "분포 흔들림"은 BatchNorm 원 논문이 내세운 설명이고, 이후 연구에서는 정규화가 손실 지형을 매끄럽게 만들어 더 큰 학습률로도 안정적으로 학습하게 해 주는 효과가 더 중요하다는 반론도 나왔다. 정규화 층이 학습을 돕는다는 사실은 분명하지만 "왜" 돕는지는 아직 완전히 합의되지 않았다.) 그런데 "평균과 분산을 어떤 축을 따라 계산하느냐"에 따라 전혀 다른 정규화 기법이 만들어진다.

Batch Normalization(BN)은 미니배치 축을 따라 정규화한다. 미니배치에 m개의 샘플이 있고 어떤 특징(뉴런) j의 pre-activation을 $z_j^{(1)}, \dots, z_j^{(m)}$이라 하면, BN은 이 m개 값(같은 특징, 서로 다른 샘플들)에 대해 평균과 분산을 계산한다.

\`\`\`math
\mu_j = \dfrac{1}{m}\sum_{i=1}^m z_j^{(i)}, \qquad \sigma_j^2 = \dfrac{1}{m}\sum_{i=1}^m (z_j^{(i)}-\mu_j)^2, \qquad \hat{z}_j^{(i)} = \dfrac{z_j^{(i)}-\mu_j}{\sqrt{\sigma_j^2+\epsilon}}
\`\`\`

말로 읽으면 "특징 j의 평균 $\mu_j$는 배치 안의 m개 샘플이 갖는 그 특징 값을 전부 더해 m으로 나눈 것, 분산 $\sigma_j^2$은 각 값이 평균에서 얼마나 떨어져 있는지를 제곱해 평균 낸 것, 정규화된 값 $\hat z$는 원래 값에서 평균을 빼고 표준편차(+작은 값 $\epsilon$)로 나눈 것"이라는 뜻이다. 즉 "이 뉴런의 값이 배치 전체에서 평균적으로 어느 정도인가"를 기준으로 정규화한다. 문제는 이 통계치가 배치 구성에 따라 달라진다는 점이다. 배치 크기가 작으면 $\mu_j, \sigma_j^2$의 추정이 불안정해지고, 추론(inference) 시점에는 배치가 하나(m=1)일 수도 있으므로 학습 중 관찰해 둔 이동평균(running mean/var)을 대신 써야 하는 번거로움도 있다(핵심 과정 「PyTorch가 대신해주는 것들」 단계의 \`model.eval()\`이 정확히 이 전환을 담당한다).

\`\`\`image
src: /images/week3/bn-vs-gn-batch-size.png
alt: 가로축은 GPU 하나당 배치 크기(32, 16, 8, 4, 2), 세로축은 ImageNet 검증 오류율(%)인 꺾은선 그래프. Batch Norm(파랑)은 배치 32·16에서 약 23.6%로 가장 낮지만 배치가 작아질수록 가파르게 올라 배치 2에서 약 34.7%가 된다. Group Norm(빨강)은 모든 배치 크기에서 약 24%로 거의 평평하다.
caption: ResNet-50을 ImageNet으로 학습할 때 GPU 하나당 배치 크기만 바꾼 실험이다. BatchNorm은 배치가 넉넉하면(32, 16) 오류율 23.6~23.7%로 가장 좋지만, 배치 안의 샘플 몇 개로 평균·분산을 추정해야 하는 배치 2에서는 34.7%까지 나빠진다. 배치 통계에 기대지 않는 Group Norm(채널을 몇 묶음으로 나눠 샘플마다 정규화)은 배치 크기와 무관하게 약 24%를 유지한다. 본문에서 말한 "배치가 작으면 통계 추정이 불안정해진다"는 약점이 수치로 확인된다.
credit: Wu & He, "Group Normalization" (ECCV 2018), Figure 1, arXiv:1803.08494
width: 900
height: 600
maxWidth: 460
\`\`\`

Layer Normalization(LN)은 정규화 축을 완전히 바꾼다. 배치가 아니라 한 샘플이 가진 모든 특징(feature) 축을 따라 평균과 분산을 계산한다. 샘플 i 하나가 d개의 특징 $z_1^{(i)}, \dots, z_d^{(i)}$을 가진다면,

\`\`\`math
\mu_i = \dfrac{1}{d}\sum_{k=1}^d z_k^{(i)}, \qquad \sigma_i^2 = \dfrac{1}{d}\sum_{k=1}^d (z_k^{(i)}-\mu_i)^2, \qquad \hat{z}_k^{(i)} = \dfrac{z_k^{(i)}-\mu_i}{\sqrt{\sigma_i^2+\epsilon}}
\`\`\`

말로 읽으면 방금 BN 공식과 똑같은 모양인데, 다만 "m개 샘플에 대해 평균 낸다"가 "d개 특징에 대해 평균 낸다"로 바뀌었을 뿐이다. 공식에서 보이는 차이는 합을 구하는 축이 배치 쪽에서 특징 쪽으로 옮겨간 것 하나다. 다만 이 차이 때문에 동작도 달라진다. BN은 배치 통계에 의존하므로 학습과 추론 때 쓰는 통계가 다르고(추론 때는 이동평균), LN은 학습 때와 추론 때 계산이 완전히 같다.

두 공식이 헷갈릴 때는 아주 작은 숫자로 직접 확인하는 것이 가장 빠르다. 샘플이 2개, 특징이 2개인 미니배치 $z=\begin{pmatrix}2 & 4\\ 6 & 8\end{pmatrix}$(행 하나가 샘플 하나, 열 하나가 특징 하나)를 생각해보자. BN은 열(같은 특징, 다른 샘플) 방향으로 평균을 낸다. 특징1의 값은 (2, 6)이므로 평균 4·분산 4, 특징2의 값은 (4, 8)이므로 평균 6·분산 4다. 반면 LN은 행(같은 샘플, 다른 특징) 방향으로 평균을 낸다. 샘플1의 값은 (2, 4)이므로 평균 3·분산 1, 샘플2의 값은 (6, 8)이므로 평균 7·분산 1이다. 완전히 같은 숫자 4개를 놓고도 "어느 축을 따라 평균 내는가"만 바꾸면 전혀 다른 평균·분산이 나온다는 것을 이 작은 예제로 분명히 확인할 수 있다.

NumPy의 \`axis\`로 그대로 옮기면 BatchNorm은 \`axis=0\`(샘플들에 걸쳐), LayerNorm은 \`axis=1\`(특징들에 걸쳐)이다.

\`\`\`python
import numpy as np

z = np.array([[2.0, 4.0],      # 샘플 1
              [6.0, 8.0]])     # 샘플 2  (열 = 특징)
bn_mean, bn_var = z.mean(axis=0), z.var(axis=0)                      # BatchNorm: 특징마다, 샘플들에 걸쳐
ln_mean, ln_var = z.mean(axis=1, keepdims=True), z.var(axis=1, keepdims=True)   # LayerNorm: 샘플마다, 특징들에 걸쳐
print("BN 평균", bn_mean, "분산", bn_var)
print("LN 평균", ln_mean.ravel(), "분산", ln_var.ravel())
eps = 1e-5
print("BN 결과:\n", np.round((z - bn_mean) / np.sqrt(bn_var + eps), 3))
print("LN 결과:\n", np.round((z - ln_mean) / np.sqrt(ln_var + eps), 3))
\`\`\`

같은 숫자가 BN에서는 "각 특징 안에서 샘플1이 작고 샘플2가 크다"($[-1, -1], [1, 1]$)로, LN에서는 "각 샘플 안에서 특징1이 작고 특징2가 크다"($[-1, 1], [-1, 1]$)로 정규화된다.

[[diagram:bn-ln-example]]

이 계산은 오직 샘플 i 자기 자신의 특징들만 사용하므로, 배치 안에 다른 샘플이 몇 개나 같이 들어 있는지와 완전히 무관하다. 배치 크기가 1이어도 그대로 적용된다.

Transformer(5주차)에서는 이 "샘플 하나"가 **토큰 하나**다. 입력 텐서의 모양이 (배치 $B$, 길이 $T$, 은닉 차원 $d_{model}$)일 때, LayerNorm은 각 토큰 벡터 하나($d_{model}$개 값)마다 따로 평균과 분산을 계산한다. 즉 $B \times T$개의 토큰이 각자 자기 통계로 정규화되고, 같은 문장 안의 다른 토큰이나 다른 문장은 전혀 참고하지 않는다. "문장 안의 토큰들을 모아 평균을 낸다"로 오해하기 쉬운데, 그렇게 하면 한 토큰의 값이 같은 문장의 다른 토큰(심지어 아직 생성되지 않은 미래 토큰)에 따라 달라져 버린다. 토큰마다 독립적으로 계산하기 때문에 문장 길이가 제각각이어도, 패딩 토큰이 섞여 있어도, 생성할 때 토큰을 하나씩 추가해도 다른 토큰의 정규화 결과가 바뀌지 않는다. 이것이 Transformer가 BatchNorm 대신 LayerNorm을 쓰는 주된 이유다. BN이었다면 배치 크기와 문장 구성, 패딩 비율에 따라 통계가 흔들리고, 학습 때와 추론 때의 통계도 달라진다.

| | 정규화 축 | 배치 크기 의존성 | 대표 사용처 |
| --- | --- | --- | --- |
| BatchNorm | 배치 축(같은 특징, 다른 샘플들). CNN에서는 채널마다 배치·높이·너비 전체 | 큼: 배치가 작으면 불안정, 추론 시 이동평균 필요 | CNN(4주차) |
| LayerNorm | 특징 축(같은 샘플, 다른 특징들). Transformer에서는 토큰마다 $d_{model}$ 축 | 없음: 샘플(토큰) 하나만으로도 계산 가능 | Transformer(5~7주차) |

\`\`\`image
src: /images/week3/normalization-axes.png
alt: 정육면체 네 개로 그린 특징 맵 텐서. 각 정육면체의 세 축은 배치 N, 채널 C, 공간 위치 H·W다. Batch Norm은 채널 하나에 해당하는 N·H·W 면 전체가, Layer Norm은 샘플 하나에 해당하는 C·H·W 면 전체가, Instance Norm은 샘플 하나·채널 하나의 H·W 기둥이, Group Norm은 샘플 하나·채널 몇 개 묶음의 H·W 덩어리가 파랗게 칠해져 있다.
caption: CNN의 특징 맵(배치 N × 채널 C × 높이·너비 H, W)에서 파랗게 칠한 칸들이 같은 평균·분산으로 정규화된다. BatchNorm은 채널마다 배치·높이·너비 전체를 모으고(표의 "CNN에서는 채널마다"), LayerNorm은 샘플 하나의 모든 채널·위치를 모은다. Instance Norm(샘플 하나·채널 하나)과 Group Norm(샘플 하나·채널 묶음)은 그 사이의 선택지다. 배치 축(N)을 쓰는 것은 BatchNorm뿐이라, 나머지는 배치 크기와 무관하게 학습과 추론에서 같은 계산을 한다.
credit: Wu & He, "Group Normalization" (ECCV 2018), Figure 2, arXiv:1803.08494
width: 1200
height: 315
\`\`\`

두 기법 모두 학습 가능한 파라미터 $\gamma, \beta$는 그대로 유지한다. 정규화가 표현력을 해치지 않도록, 표준화한 뒤 다시 원하는 스케일과 위치로 되돌릴 여지를 남겨두는 것이다.
`,
  checks: [
    {
      key: "c1",
      question: "미니배치 $z = \\begin{pmatrix}1 & 3\\\\ 5 & 7\\end{pmatrix}$(행=샘플, 열=특징)에서 LayerNorm이 샘플 1에 대해 계산하는 평균은?",
      choices: ["$2$", "$3$", "$4$", "$6$"],
      answer: 0,
      explanation: "LayerNorm은 한 샘플 안의 특징들로 평균을 낸다: $(1 + 3)/2 = 2$. BatchNorm이라면 특징 1에 대해 $(1 + 5)/2 = 3$이다.",
    },
    {
      key: "c2",
      question: "배치 크기가 1일 때 BatchNorm의 문제는?",
      choices: ["평균이 무한대가 된다", "배치 축의 분산이 0이라 모든 값이 0(평균)으로 뭉개진다", "아무 문제 없다", "LayerNorm으로 자동 전환된다"],
      answer: 1,
      explanation: "샘플 하나로는 배치 통계를 낼 수 없다. 그래서 추론 때는 학습 중 모아둔 이동평균을 쓰고, 문장 길이·배치가 들쭉날쭉한 Transformer는 LayerNorm을 쓴다.",
    },
    {
      key: "c3",
      question: "정규화 뒤에 학습 가능한 $\\gamma$, $\\beta$를 다시 곱하고 더하는 이유는?",
      choices: ["계산을 빠르게 하려고", "표준화로 잃을 수 있는 표현력을 되살려, 필요하면 원래 스케일·위치로 되돌릴 수 있게 하려고", "분산을 0으로 만들려고", "기울기를 끊으려고"],
      answer: 1,
      explanation: "$\\gamma = \\sigma$, $\\beta = \\mu$가 되면 원래 값이 복원된다. 정규화가 \"표현을 강제로 제한\"하지 않도록 여지를 남긴다.",
    },
    {
      key: "c4",
      question: "Transformer의 은닉 상태 텐서 모양이 (배치 $B$, 길이 $T$, $d_{model}$)일 때, LayerNorm은 평균·분산을 어떻게 계산하는가?",
      choices: ["문장 하나의 모든 토큰($T$개)을 모아 특징마다 계산한다", "배치 전체($B \\times T$개 토큰)를 모아 특징마다 계산한다", "토큰마다 따로, 그 토큰 벡터의 $d_{model}$개 값으로 계산한다", "배치의 첫 토큰으로 계산한 통계를 모든 토큰에 쓴다"],
      answer: 2,
      explanation: "LayerNorm은 마지막 축($d_{model}$)만 본다. 같은 문장의 다른 토큰도 참고하지 않으므로, 문장 길이·패딩·배치 구성이 바뀌어도, 생성 중에 토큰이 추가되어도 기존 토큰의 결과가 변하지 않는다. 두 번째 선택지는 BatchNorm을 시퀀스에 적용한 방식에 가깝다.",
    },
    {
      key: "c5",
      question: "$z = \\begin{pmatrix}2 & 4\\\\ 6 & 8\\end{pmatrix}$(행 = 샘플)에서 BatchNorm이 특징 2(둘째 열)에 대해 계산하는 평균과 분산은?",
      choices: ["평균 6, 분산 4", "평균 7, 분산 1", "평균 5, 분산 5", "평균 3, 분산 1"],
      answer: 0,
      explanation: "BN은 같은 특징의 샘플들(4와 8)로 계산한다: 평균 6, 분산 $\\frac{(4-6)^2 + (8-6)^2}{2} = 4$. 평균 7·분산 1은 LN의 샘플 2 통계다.",
    },
    {
      key: "c6",
      question: "NumPy에서 shape `(B, d)`인 배열에 LayerNorm의 평균을 구하는 코드는?",
      choices: ["`z.mean(axis=1, keepdims=True)`", "`z.mean(axis=0)`", "`z.mean()`", "`z.mean(axis=0, keepdims=True)`"],
      answer: 0,
      explanation: "LN은 샘플(행)마다 특징 축으로 평균을 낸다. `axis=1`이고, 각 행에서 빼려면 `keepdims=True`로 `(B, 1)` 모양을 남긴다. `axis=0`은 BatchNorm 쪽이다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "Batch Normalization과 Layer Normalization은 각각 어떤 축(배치 축 vs 특징 축)을 따라 평균·분산을 계산하는가? Transformer 계열 모델이 BatchNorm 대신 LayerNorm을 쓰는 이유를 배치 크기·시퀀스 길이 관점에서 설명하라.",
      answer: md`
BatchNorm은 같은 배치 안의 여러 샘플에 걸쳐(배치 축) 평균/분산을 계산해 정규화하고, LayerNorm은 한 샘플 안의 여러 특징에 걸쳐(특징 축) 정규화한다. Transformer에서 LayerNorm은 (배치, 길이, $d_{model}$) 텐서의 마지막 축, 즉 토큰 하나의 $d_{model}$개 값으로 토큰마다 따로 정규화한다(문장 안의 여러 토큰을 모아 평균 내는 것이 아니다). 그래서 배치 크기·시퀀스 길이·패딩에 영향을 받지 않고, 학습과 추론의 계산이 같으며, 생성 중 토큰이 추가되어도 기존 토큰의 결과가 바뀌지 않아 가변 길이 시퀀스를 다루는 구조에 적합하다. BatchNorm은 배치 통계에 의존해 작은 배치나 패딩에서 불안정하고 추론 때 이동평균이 필요하다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Ioffe & Szegedy (2015) — Batch Normalization", url: "https://arxiv.org/abs/1502.03167", note: "BatchNorm 원 논문" },
    { title: "Ba, Kiros & Hinton (2016) — Layer Normalization", url: "https://arxiv.org/abs/1607.06450", note: "LayerNorm 원 논문: 순환망·Transformer에서 배치 의존성을 없앤 이유" },
  ],
});
