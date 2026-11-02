import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/scaling-laws";

export default defineLesson({
  id: "scaling-laws",
  title: "스케일링 법칙",
  tier: "supplement",
  goal: "$L(N, D) \\approx E + A/N^\\alpha + B/D^\\beta$, $C \\approx 6ND$, $D \\approx 20N$을 이용해 컴퓨트 예산에서 최적 모델 크기와 데이터 양을 계산하고, 실무의 과잉학습(overtraining)과 스케일링 법칙이 경험적 적합이라는 한계를 설명할 수 있다.",
  why: "",
  body: md`
모델 크기(파라미터 수 $N$)와 학습 데이터 양(토큰 수 $D$), 그리고 이 둘을 학습시키는 데 드는 컴퓨트($C$, FLOPs)를 늘렸을 때 검증 손실이 얼마나 줄어드는지는 무작위가 아니라, 실험한 범위 안에서 로그-로그 그래프에 거의 직선을 그리는 멱법칙(power law)으로 잘 맞는다는 것이 Kaplan et al.(2020)과 Hoffmann et al.(2022, Chinchilla)의 대규모 실험에서 관찰되었다. 이 관계식이 중요한 이유는 "모델을 더 키우면 손실이 얼마나 줄어들까"라는 질문에, 작은 실험들로 추정한 지수($\alpha$, $\beta$)와 상수($A$, $B$, $E$)를 대입해 정량적인 **예측**을 내놓을 수 있게 해주기 때문이다. 큰 모델을 학습시키기 전에 작은 모델 여러 개로 곡선을 맞춘 뒤 외삽해서 예산 배분을 정하는 것이 실무의 쓰임새다.

:::warn 스케일링 법칙은 "법칙"이 아니라 경험적 적합이다
① 물리 법칙처럼 보장되는 것이 아니라, 특정 모델 구조·데이터 분포·학습 설정(학습률 스케줄, 토크나이저 등)에서 관찰한 결과에 곡선을 맞춘 것이다. 조건이 바뀌면 지수와 상수도 바뀐다. 실제로 Kaplan과 Chinchilla가 서로 다른 최적 비율을 내놓은 것도 학습률 스케줄과 파라미터 세는 방식 같은 실험 설정 차이 때문이라는 분석이 있다. ② 실험 범위 밖으로 멀리 외삽할수록 틀릴 위험이 커진다. ③ 이 식이 예측하는 것은 **사전학습 데이터 분포에서의 손실**이다. 특정 과제의 정확도나 "어떤 능력이 생기는가"는 손실만으로 직접 예측되지 않는다. ④ 계산값은 "도달 가능한 최저 손실"(하한)이 아니라 곡선 위의 추정치이며, 더 좋은 데이터나 구조를 쓰면 같은 컴퓨트로 더 낮은 손실을 얻을 수 있다.
:::

[[diagram:scaling-law-plot]]

:::info 왜 로그-로그 그래프에서 직선이 되는가
멱법칙 $y = a\,x^{-\alpha}$의 양변에 로그를 취하면 $\log y = \log a - \alpha \log x$다. 가로축을 $\log x$, 세로축을 $\log y$로 그리면 기울기가 $-\alpha$인 직선이 된다. 그래서 "직선이 계속 이어진다"는 것은 "$x$가 10배 될 때마다 $y$가 같은 비율($10^{-\alpha}$배)로 준다"는 뜻이다. 예컨대 $\alpha = 0.34$면 $x$가 10배 될 때마다 해당 항이 $10^{-0.34} \approx 0.46$배가 된다.
:::

\`\`\`image
src: /images/week6/kaplan-power-laws.png
alt: 로그-로그 축의 그래프 세 개. 컴퓨트, 데이터셋 크기(토큰), 파라미터 수가 늘수록 테스트 손실이 직선을 따라 줄어들며, 각각 L = (C/2.3·10⁸)^−0.050, L = (D/5.4·10¹³)^−0.095, L = (N/8.8·10¹³)^−0.076 직선이 맞춰져 있다.
caption: Kaplan 등(2020)이 실제로 잰 결과다. 세 그래프 모두 가로·세로가 로그 눈금이고, 컴퓨트(왼쪽), 데이터 토큰 수(가운데), 파라미터 수(오른쪽)를 늘릴 때 테스트 손실이 직선, 즉 멱법칙을 따라 줄어든다. 직선의 기울기가 지수다. 예컨대 파라미터의 지수는 0.076이라 파라미터가 10배가 될 때마다 손실이 10^−0.076 ≈ 0.84배가 된다. 왼쪽의 옅은 파란 선들은 크기가 다른 모델 각각의 학습 곡선이고, 검은 선은 주어진 컴퓨트에서 가장 낮은 손실을 이은 경계다. 각 직선은 나머지 두 요인이 병목이 되지 않을 때의 관계다.
credit: Kaplan et al., "Scaling Laws for Neural Language Models" (2020), Figure 1, arXiv:2001.08361
width: 1200
height: 365
\`\`\`


\`\`\`math
L(N, D) \approx E + \dfrac{A}{N^{\alpha}} + \dfrac{B}{D^{\beta}}
\`\`\`

첫 항 $E$는 $N$과 $D$를 한없이 키울 때 곡선이 다가가는 값으로, 텍스트 자체의 불확실성(줄일 수 없는 손실)으로 해석한다. 다만 이 값도 측정값이 아니라 곡선을 맞춰 얻은 추정치다. 둘째 항은 모델이 작아서, 셋째 항은 데이터가 적어서 생기는 손실이다. $N$이나 $D$를 늘리면 해당 항이 멱법칙으로 줄어든다.

컴퓨트와 데이터, 그리고 그 둘의 최적 비율은 다음 두 관계식으로 요약된다.

\`\`\`math
C \approx 6ND
\`\`\`

\`\`\`math
D \approx 20N
\`\`\`

여기서 $C$는 학습에 드는 컴퓨트(FLOPs), $N$은 파라미터 수, $D$는 학습 토큰 수다. 이 두 식을 말로 읽으면 각각 "학습에 드는 전체 연산량은 대략 파라미터 수와 데이터 토큰 수를 곱한 값의 6배"(토큰 하나당 순전파 약 $2N$, 역전파 약 $4N$ FLOPs로 어림한 것으로, attention 연산 등은 무시한 근사다)라는 뜻과 "주어진 컴퓨트에서 손실을 가장 낮추려면 데이터 토큰 수를 파라미터 수의 20배 정도로 맞추는 것이 좋다"는 뜻이다. Chinchilla 논문은 자신들의 실험 설정에서 컴퓨트 예산이 정해졌을 때 손실을 가장 낮추는 지점이 대략 $D \approx 20N$ 근방이라는 결과를 얻었다. 예를 들어 70B 모델이라면 약 1.4T 토큰으로 학습하는 것이 컴퓨트 최적이라는 뜻이다. 20이라는 숫자는 데이터 품질·구조가 달라지면 바뀔 수 있는 경험적 비율이다.

이 식이 알려주는 실전 교훈은 명확하다. 모델만 키우고 데이터를 그만큼 늘리지 않으면(혹은 그 반대라면) 주어진 컴퓨트를 낭비하게 된다는 것이다. Chinchilla 논문은 "정해진 컴퓨트 예산 안에서 손실을 가장 낮추려면 $N$과 $D$를 어떤 비율로 나눠야 하는가"라는 질문에 $D \approx 20N$이라는 비교적 간단한 답을 내놓았다.

\`\`\`image
src: /images/week6/chinchilla-isoflop.png
alt: 왼쪽은 컴퓨트 예산별 U자 모양 손실 곡선(가로축 파라미터 수, 세로축 학습 손실), 가운데와 오른쪽은 FLOPs에 따른 최적 파라미터 수와 최적 토큰 수가 로그-로그 직선을 이루는 그래프로, Gopher의 컴퓨트에서 63B와 1.4T가 표시되어 있다.
caption: Chinchilla 논문의 실험이다. 왼쪽: 컴퓨트 예산(색깔별 6×10¹⁸~3×10²¹ FLOPs)을 고정하고 모델 크기만 바꿔 학습하면(작은 모델일수록 토큰을 더 많이 본다) 손실이 U자 골짜기를 그린다. 골짜기의 바닥이 그 예산에서 가장 좋은 모델 크기다. 가운데·오른쪽: 바닥의 위치를 컴퓨트에 대해 그리면 최적 파라미터 수와 토큰 수가 둘 다 컴퓨트의 약 0.5제곱으로 함께 늘고, Gopher의 컴퓨트(초록 선)에서는 약 63B 파라미터와 1.4조 토큰이 최적으로 나온다. 이 비율이 D ≈ 20N의 근거다.
credit: Hoffmann et al., "Training Compute-Optimal Large Language Models" (NeurIPS 2022), Figure 3, arXiv:2203.15556
width: 1200
height: 346
\`\`\`

:::example 예제: 컴퓨트 예산에서 모델 크기 역산하기
$C = 10^{23}$ FLOPs 예산이 주어졌다고 하자. $C \approx 6ND$이므로 $N \cdot D \approx C/6 \approx 1.67 \times 10^{22}$. 여기에 Chinchilla의 최적 비율 $D = 20N$을 대입하면 $N \cdot (20N) = 20N^2 \approx 1.67 \times 10^{22}$, 따라서 $N^2 \approx 8.35 \times 10^{20}$, $N \approx 2.9 \times 10^{10}$(약 29B), $D \approx 20 \times 2.9 \times 10^{10} \approx 5.8 \times 10^{11}$토큰(약 5,800억 토큰)이 나온다. 예산이 100배 커져 $10^{25}$ FLOPs가 되면 $N^2$도 100배 커지므로 $N$은 $\sqrt{100} = 10$배, 즉 약 290B로 늘어난다. 비율 $D \approx 20N$을 그대로 받아들이면, 컴퓨트가 100배 늘 때 최적 모델 크기는 10배만 늘고 데이터도 10배만 늘어난다는 것이 이 이차식이 말해주는 구조다.
:::

Chinchilla 논문이 실제로 맞춘 상수($E = 1.69$, $A = 406.4$, $B = 410.7$, $\alpha = 0.34$, $\beta = 0.28$)를 넣어 위 계산을 코드로 해 보자. 비슷한 컴퓨트를 쓴 두 모델, 모델을 크게 키운 Gopher(280B, 3,000억 토큰)와 데이터를 늘린 Chinchilla(70B, 1.4조 토큰)도 비교한다.

\`\`\`python
import numpy as np

# Chinchilla 논문(Hoffmann et al., 2022)이 맞춘 상수
E, A, B, alpha, beta = 1.69, 406.4, 410.7, 0.34, 0.28

def loss(N, D):
    return E + A / N ** alpha + B / D ** beta

def optimal(C):
    N = np.sqrt(C / (6 * 20))          # C = 6ND, D = 20N  →  C = 120 N²
    return N, 20 * N

for C in [1e21, 1e23, 1e25]:
    N, D = optimal(C)
    print(f"C = {C:.0e}: N ≈ {N / 1e9:6.1f}B, D ≈ {D / 1e9:8.0f}B 토큰, 예측 손실 {loss(N, D):.3f}")

# 비슷한 컴퓨트에서 모델을 키운 쪽 vs 데이터를 늘린 쪽
for name, N, D in [("Gopher 280B, 3,000억 토큰", 280e9, 300e9), ("Chinchilla 70B, 1.4조 토큰", 70e9, 1.4e12)]:
    print(f"{name}: C = {6 * N * D:.1e}, 예측 손실 {loss(N, D):.3f}")
\`\`\`

컴퓨트가 100배씩 늘 때 최적 $N$은 10배씩 는다. 그리고 비슷한 컴퓨트에서 4배 작은 Chinchilla의 예측 손실이 Gopher보다 낮다. 실제로도 Chinchilla는 대부분의 벤치마크에서 Gopher를 앞섰다. "모델만 키우는 것은 컴퓨트 낭비"라는 결론이 숫자로 드러난다.

다만 실무에서는 이 "최적" 비율을 그대로 따르지 않는 경우가 많다. 학습은 단 한 번만 하고 끝나지만, 서비스로 배포된 모델은 하루에도 수백만 번씩 추론을 실행해야 하니 추론 비용이 학습 비용보다 훨씬 크게 누적된다. 그래서 최적점보다 모델은 작게, 데이터는 그보다 훨씬 많이 먹여서(과잉학습) 추론이 싸면서도 성능은 비슷하게 나오도록 타협하는 경우가 흔하다. 공개된 Llama 계열 모델들이 그 대표적인 예다.

[[diagram:compute-allocation]]

스케일링 법칙은 **학습** 컴퓨트에 대한 이야기다. 학습이 끝난 모델이 답을 낼 때 컴퓨트를 더 써서(여러 번 풀어 고르거나 길게 생각해서) 정답률을 올리는 두 번째 축은 보충 과정의 「추론 시간 계산」 단계에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "7B 파라미터 모델을 1.4조($1.4 \\times 10^{12}$) 토큰으로 학습할 때 컴퓨트 $C \\approx 6ND$는?",
      choices: ["약 $5.9 \\times 10^{22}$ FLOPs", "약 $9.8 \\times 10^{21}$ FLOPs", "약 $5.9 \\times 10^{21}$ FLOPs", "약 $4.2 \\times 10^{13}$ FLOPs"],
      answer: 0,
      explanation: "$6 \\times 7 \\times 10^{9} \\times 1.4 \\times 10^{12} = 5.88 \\times 10^{22}$. $D/N = 200$이니 Chinchilla 최적(20)보다 10배 과잉학습이다.",
    },
    {
      key: "c2",
      question: "컴퓨트 예산이 100배가 되면 Chinchilla 최적 모델 크기 $N$은 약 몇 배가 되는가? ($C \\approx 6ND$, $D \\approx 20N$)",
      choices: ["100배", "50배", "10배", "변하지 않는다"],
      answer: 2,
      explanation: "$C \\approx 120N^2$이므로 $N \\propto \\sqrt{C}$, $\\sqrt{100} = 10$배. 데이터도 10배 늘린다.",
    },
    {
      key: "c3",
      question: "Llama 계열처럼 컴퓨트 최적보다 작은 모델에 훨씬 많은 토큰을 학습시키는 주된 이유는?",
      choices: ["학습 비용을 줄이려고", "배포 후 수없이 반복되는 추론 비용을 줄이려고", "스케일링 법칙이 틀렸기 때문에", "데이터가 부족해서"],
      answer: 1,
      explanation: "학습은 한 번이지만 추론은 계속된다. Chinchilla 식으로 계산하면 같은 컴퓨트에서 8B 모델은 최적점보다 손실이 약 0.02 높을 뿐이다.",
    },
    {
      key: "c4",
      question: "스케일링 법칙 $L(N, D) \\approx E + A/N^\\alpha + B/D^\\beta$에 대한 설명으로 가장 정확한 것은?",
      choices: ["어떤 모델·데이터에서도 성립하는 물리 법칙이라, 계산값이 도달 가능한 최저 손실이다", "특정 구조·데이터·학습 설정에서 관찰한 결과에 맞춘 경험식이라, 실험 범위 밖 외삽이나 설정 변화에서는 틀릴 수 있다", "특정 과제의 정확도를 정확히 예측해 준다", "$E$는 실험으로 직접 측정한 값이다"],
      answer: 1,
      explanation: "스케일링 법칙은 사전학습 손실에 대한 경험적 적합이다. 지수·상수는 구조·데이터 분포·학습률 스케줄에 따라 달라지고(Kaplan과 Chinchilla의 최적 비율이 다른 이유 중 하나), 다운스트림 능력은 손실만으로 직접 예측되지 않는다. $E$도 곡선을 맞춰 얻은 추정치다.",
    },
    {
      key: "c5",
      question: "컴퓨트 예산 $C = 1.2 \\times 10^{22}$ FLOPs에서 $C \\approx 6ND$, $D \\approx 20N$을 따르면 최적 모델 크기 $N$은?",
      choices: ["약 100억(10B)", "약 10억(1B)", "약 1,000억(100B)", "약 2,000억(200B)"],
      answer: 0,
      explanation: "$C = 6N \\cdot 20N = 120N^2$이므로 $N^2 = 10^{20}$, $N = 10^{10}$이다. 이때 $D = 20N = 2{,}000$억 토큰이다.",
    },
    {
      key: "c6",
      question: "손실의 모델 크기 항 $A/N^{\\alpha}$에서 $\\alpha = 0.34$일 때 $N$을 10배로 키우면 이 항은 약 몇 배가 되는가?",
      choices: ["약 0.46배", "약 0.1배", "약 0.34배", "약 0.9배"],
      answer: 0,
      explanation: "$10^{-0.34} \\approx 0.46$이다. 멱법칙이라 10배 키울 때마다 같은 비율로 줄며, 로그-로그 그래프에서 직선이 되는 이유다.",
    },
    {
      key: "c7",
      question: "학습 컴퓨트 $C \\approx 6ND$를 고정한 채 모델 크기 $N$을 4배로 키우면 학습 토큰 수 $D$는?",
      choices: ["4배", "그대로", "1/4배", "2배"],
      answer: 2,
      explanation: "$ND$가 일정해야 하므로 $N$이 4배면 $D$는 1/4배입니다. 같은 예산을 큰 모델에 쓸지, 많은 데이터에 쓸지의 배분 문제가 스케일링 법칙의 핵심이고, Chinchilla는 $D \\approx 20N$ 근처가 손실을 가장 낮춘다고 보고했습니다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import math
C = 1e23
N = math.sqrt(C / (6 * 20))
print(f"{N:.2e} {20 * N:.2e}")
`,
      expected: "2.89e+10 5.77e+11",
      explanation: "$C = 6N \\cdot 20N = 120N^2$이므로 $N = \\sqrt{10^{23}/120} \\approx 2.89 \\times 10^{10}$(약 29B), $D = 20N \\approx 5.77 \\times 10^{11}$(약 5,800억 토큰)입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "7B 모델의 Chinchilla 최적 토큰 수와 필요한 컴퓨트(6ND)는?",
      answer: md`
$D = 20 \times 7\times10^{9} = 1.4\times10^{11}$ 토큰(1,400억), $C = 6 \times 7\times10^{9} \times 1.4\times10^{11} \approx 5.88\times10^{21}$ FLOPs.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Hoffmann et al. (2022) — Training Compute-Optimal Large Language Models (Chinchilla)", url: "https://arxiv.org/abs/2203.15556", note: "그림 1과 표 3: D≈20N의 근거" },
    { title: "Kaplan et al. (2020) — Scaling Laws for Neural Language Models", url: "https://arxiv.org/abs/2001.08361", note: "스케일링 법칙의 출발점: 그림 1만 봐도 된다" },
    { title: "Besiroglu et al. (2024) — Chinchilla Scaling: A replication attempt", url: "https://arxiv.org/abs/2404.10102", note: "Chinchilla 식의 수정 상수 출처 (심화)" },
  ],
});
