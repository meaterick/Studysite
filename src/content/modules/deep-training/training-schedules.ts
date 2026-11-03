import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/training-schedules";

export default defineLesson({
  id: "training-schedules",
  title: "가중치 감쇠와 학습률 스케줄",
  tier: "supplement",
  goal: "가중치 감쇠를 갱신식으로 설명하고, 조기 종료와 선형 워밍업·코사인 감쇠 학습률 스케줄을 구현하며, 신경망의 과적합이 검증 손실에서 먼저 드러나는 이유를 설명한다.",
  why: "신경망은 파라미터가 수백만 개인데 라벨이 있는 데이터는 수천 개인 경우가 흔해 선형 모델보다 과적합이 쉽게 일어난다. 가중치 감쇠, 조기 종료, 학습률 스케줄은 대부분의 학습 코드에 들어가는 설정이며, PyTorch의 옵티마이저 인자 `weight_decay`와 학습률 스케줄러([[lesson:pytorch]])가 이 내용을 구현한다.",
  body: md`
### 가중치 감쇠: L2 규제를 갱신식으로 보기

L2 규제의 벌점 $\frac{\lambda}{2}\lVert w\rVert^2$을 손실에 더하면 기울기에 $\lambda w$가 더해지고([[lesson:regularization]]), 경사하강법의 갱신식은 다음과 같다.

$$w \leftarrow w - \eta(g + \lambda w) = (1 - \eta\lambda)\,w - \eta g$$

스텝마다 가중치를 $(1 - \eta\lambda)$배로 줄인 뒤 기울기만큼 갱신하므로, 신경망에서는 이를 **가중치 감쇠**(weight decay)라 한다. 여러 스텝에 걸쳐 기울기가 같은 방향으로 키우는 가중치는 크기가 유지되고, 그렇지 않은 가중치는 스텝마다 $(1 - \eta\lambda)$배씩 줄어 0에 가까워진다. SGD에서는 L2 벌점과 가중치 감쇠가 같지만 Adam에서는 다르다. 그 차이와 AdamW는 [[lesson:adam-theory]]에서 다룬다.

기울기가 0인 가중치와, 손실을 줄이려면 커져야 하는 가중치(기울기 $-0.005$)에 $\eta = 0.1$, $\lambda = 0.01$로 가중치 감쇠를 적용한다.

\`\`\`python
import numpy as np

eta, lam = 0.1, 0.01
w = np.array([1.0, 1.0])
g = np.array([0.0, -0.005])           # 첫째: 기울기 0, 둘째: 커질수록 손실이 줄어드는 가중치
for step in range(5000):
    w = (1 - eta * lam) * w - eta * g
print(np.round(w, 3))                 # [0.007 0.503]
\`\`\`

기울기가 0인 가중치는 $0.999^{5000} \approx 0.007$배로 줄고, 기울기가 계속 같은 방향인 가중치는 $\lambda w = -g$가 되는 $w = 0.5$로 수렴한다. 가중치의 크기는 기울기와 감쇠가 균형을 이루는 값에서 정해진다.

### 조기 종료

학습을 오래 할수록 학습 손실은 계속 줄지만, 검증 손실은 어느 시점부터 다시 오른다. **조기 종료**(early stopping)는 에폭마다 검증 손실을 기록하다가 정해진 횟수(patience) 동안 최솟값이 갱신되지 않으면 학습을 멈추고, 검증 손실이 가장 낮았던 시점의 체크포인트를 최종 모델로 쓴다. 학습 시간을 제한하는 것도 규제의 한 방법이다. 손실을 이차함수로 근사하면, 학습률 $\eta$로 $t$스텝 학습하고 멈추는 것은 $\lambda \approx 1/(\eta t)$인 L2 규제와 비슷한 효과를 낸다.

신경망의 과적합은 정확도보다 손실에서 먼저 드러난다. 모델이 학습 데이터에 지나치게 맞춰지면 틀리는 검증 샘플에서 오답 클래스에 점점 높은 확률을 주고, 교차 엔트로피는 높은 확률로 틀린 예측에 큰 손실을 준다([[lesson:loss-functions]]). 검증 정확도는 그대로인데 검증 손실만 오른다면 모델이 과신하기 시작했다는 뜻이다.

[[diagram:early-stopping]]

### 학습률 스케줄: 선형 워밍업과 코사인 감쇠

학습률은 학습 내내 고정할 필요가 없다. 가장 많이 쓰는 조합은 **선형 워밍업**(linear warmup)과 **코사인 감쇠**(cosine decay)다. 처음 $t_{\text{warmup}}$ 스텝 동안 학습률을 0 근처에서 최댓값 $\eta_{\max}$까지 선형으로 올린다. 학습 초기에는 파라미터와 Adam의 이동평균 추정이 불안정하므로 큰 갱신을 피하기 위해서다. 그 뒤에는 다음 식으로 학습률을 $\eta_{\min}$까지 줄인다.

$$\eta_t = \eta_{\min} + \tfrac{1}{2}(\eta_{\max} - \eta_{\min})\left(1 + \cos\frac{\pi\,(t - t_{\text{warmup}})}{T - t_{\text{warmup}}}\right)$$

학습률이 큰 초반에는 파라미터가 크게 바뀌며 손실이 빠르게 줄고, 학습률이 작은 후반에는 최솟값 근처에서 진동하지 않고 수렴한다. LLM 사전학습([[lesson:pretraining]])도 대부분 이 스케줄을 쓴다.

[[diagram:warmup-cosine]]
`,
  checks: [
    {
      key: "c1",
      question: "학습 정확도는 계속 오르고 검증 정확도는 그대로인데, 검증 손실(교차 엔트로피)만 크게 오르고 있다. 가장 알맞은 해석은?",
      choices: [
        "모델이 틀리는 검증 샘플에서 오답 클래스에 점점 높은 확률을 주고 있다(과신, 과적합의 신호)",
        "모델의 성능이 좋아지고 있다",
        "학습률이 너무 작다",
        "검증 데이터에 오류가 있다",
      ],
      answer: 0,
      explanation: "교차 엔트로피는 높은 확률로 틀린 예측에 큰 손실을 준다. 정확도가 0.87로 같아도 검증 손실은 0.32에서 0.95로 오를 수 있다. 조기 종료, 가중치 감쇠, 드롭아웃으로 줄인다.",
    },
    {
      key: "c2",
      question: "SGD에서 학습률 $\\eta = 0.1$, 가중치 감쇠 $\\lambda = 0.01$이면 기울기 항과 별도로 스텝마다 가중치에 곱해지는 값은?",
      choices: ["$0.999$", "$0.99$", "$0.9$", "$1.001$"],
      answer: 0,
      explanation: "$w \\leftarrow (1 - \\eta\\lambda)w - \\eta g$이므로 $1 - 0.1 \\times 0.01 = 0.999$배다.",
    },
    {
      key: "c3",
      question: "조기 종료(patience = 3)를 쓰는 학습에서 에폭별 검증 손실이 $0.50, 0.42, 0.40, 0.41, 0.43, 0.44$였다. 최종 모델로 쓰는 것은 어느 에폭의 체크포인트인가?",
      choices: ["3번째 에폭(검증 손실 0.40)", "6번째 에폭(마지막)", "1번째 에폭", "4번째 에폭"],
      answer: 0,
      explanation: "0.40 이후 세 번(0.41, 0.43, 0.44) 연속으로 최솟값이 갱신되지 않아 6번째 에폭 뒤에 멈추고, 검증 손실이 가장 낮았던 3번째 에폭의 체크포인트를 쓴다.",
    },
    {
      key: "c4",
      question: "선형 워밍업으로 학습 초기에 학습률을 작게 시작하는 이유는?",
      choices: [
        "학습 초기에는 파라미터와 Adam의 이동평균 추정이 불안정해, 큰 갱신이 손실을 크게 늘릴 수 있어서",
        "학습 데이터가 부족해서",
        "코사인 함수가 0에서 시작해서",
        "검증 손실을 계산하지 않으려고",
      ],
      answer: 0,
      explanation: "초기 파라미터는 무작위이고 Adam의 1차·2차 모멘트 추정도 몇 스텝 동안은 표본이 적어 부정확하다. 이때 큰 학습률로 갱신하면 손실이 발산할 수 있으므로 학습률을 선형으로 올린다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import math
lr_max, warmup, total = 1e-3, 10, 110
def lr(step):
    if step < warmup:
        return lr_max * (step + 1) / warmup
    return 0.5 * lr_max * (1 + math.cos(math.pi * (step - warmup) / (total - warmup)))
print(round(lr(4) * 1e4, 2), round(lr(10) * 1e4, 2), round(lr(60) * 1e4, 2), round(lr(110) * 1e4, 2))
`,
      expected: "5.0 10.0 5.0 0.0",
      explanation: "4스텝은 워밍업 구간이라 $10^{-3}\\times 5/10 = 5\\times10^{-4}$, 10스텝은 코사인 구간의 시작이라 $10^{-3}$, 60스텝은 코사인 구간의 가운데라 절반인 $5\\times10^{-4}$, 110스텝은 끝이라 0이다(출력은 $10^4$배 한 값).",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "가중치 감쇠의 갱신식을 쓰고 가중치 감쇠가 과적합을 줄이는 이유를 쓰라. 검증 정확도는 그대로인데 검증 손실만 오르는 현상이 뜻하는 것과, 조기 종료가 최종 모델을 고르는 방법도 쓰라.",
      answer: md`
L2 벌점 $\frac{\lambda}{2}\lVert w \rVert^2$을 더한 경사하강법의 갱신식은 $w \leftarrow (1 - \eta\lambda)w - \eta g$다. 스텝마다 가중치가 $(1 - \eta\lambda)$배로 줄어들므로, 기울기가 같은 방향으로 계속 키우는 가중치만 크기가 유지되고 나머지는 0에 가까워진다. 가중치가 작으면 입력이 조금 바뀔 때 출력도 조금만 바뀌므로, 학습 데이터의 잡음에 맞춘 복잡한 함수가 만들어지기 어렵다.

검증 정확도는 그대로인데 검증 손실만 오르는 것은 모델이 틀리는 검증 샘플에서 오답 클래스에 점점 높은 확률을 준다는 뜻이다. 교차 엔트로피는 높은 확률로 틀린 예측에 큰 손실을 주므로 과적합이 정확도보다 손실에서 먼저 드러난다. 조기 종료는 에폭마다 검증 손실을 기록하다가 patience 동안 최솟값이 갱신되지 않으면 멈추고, 검증 손실이 가장 낮았던 시점의 체크포인트를 최종 모델로 쓴다.
`,
      keyPoints: [
        "갱신식 $w \\leftarrow (1 - \\eta\\lambda)w - \\eta g$로 스텝마다 가중치를 줄인다",
        "기울기가 계속 키우는 가중치만 크기가 유지된다",
        "검증 손실만 오르는 것은 틀린 예측에 높은 확률을 주는 과신의 신호다",
        "조기 종료는 검증 손실이 가장 낮았던 체크포인트를 고른다",
      ],
    },
  ],
  references: [
    { title: "Loshchilov & Hutter (2019) — Decoupled Weight Decay Regularization", url: "https://arxiv.org/abs/1711.05101", note: "L2 벌점과 가중치 감쇠의 차이, AdamW (영문)" },
    { title: "Goodfellow, Bengio & Courville — Deep Learning, 7.8 Early Stopping", url: "https://www.deeplearningbook.org/contents/regularization.html", note: "조기 종료와 L2 규제의 관계 (영문)" },
    { title: "Dive into Deep Learning — 12.11 Learning Rate Scheduling", url: "https://d2l.ai/chapter_optimization/lr-scheduler.html", note: "워밍업과 코사인 스케줄을 코드와 함께 (영문)" },
  ],
});
