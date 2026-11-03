import { defineLesson, md } from "../../kit";
import exercises from "./labs/instruction-tuning";

export default defineLesson({
  id: "instruction-tuning",
  title: "지시 미세조정과 LoRA",
  tier: "core",
  concepts: ["finetuning-alignment-prompting"],
  goal: "SFT의 역할과 전체 미세조정의 메모리 비용을 계산하고, LoRA($\\Delta W = BA$)와 QLoRA가 각각 학습 파라미터 수와 메모리를 얼마나 줄이는지 계산한다.",
  why: "사전학습한 모델이 지시를 따르는 대화형 모델이 되려면 SFT를 거쳐야 한다([[lesson:pretraining]]). 대부분의 조직은 모델 전체를 다시 학습할 GPU 메모리가 없으므로 LoRA 같은 파라미터 효율적 미세조정으로 자기 데이터에 맞춘 모델을 만든다.",
  body: md`
### SFT: 지시를 따르도록 학습하기

사전학습만 마친 모델(base model)은 다음 토큰 예측만 학습했으므로, 질문을 입력하면 답 대신 학습 데이터에 자주 나온 형식대로 비슷한 질문을 이어서 생성하는 경우가 많다. **SFT**(Supervised Fine-Tuning, 지시 미세조정)는 (지시, 응답) 형식의 데이터로 모델을 추가로 학습하는 단계다. 문법, 어휘, 세계 지식의 많은 부분은 사전학습으로 이미 학습되어 있으므로, 수만~수십만 개의 (지시, 모범 응답) 쌍만으로도 모델의 출력을 지시에 답하는 형식으로 바꿀 수 있다.

대화형 모델의 SFT 데이터는 보통 역할 표시가 붙은 대화 형식이다.

\`\`\`text
[USER] 파이썬에서 리스트를 뒤집는 방법은?
[ASSISTANT] 두 가지가 있습니다. lst.reverse()는 원본을 뒤집고, lst[::-1]은 뒤집힌 복사본을 만듭니다.
\`\`\`

학습 방식은 사전학습과 같은 다음 토큰 예측이지만, 손실은 보통 **응답 부분의 토큰에만** 계산한다. 질문을 그대로 생성하는 것이 아니라 질문에 답하는 것을 학습하게 하려는 것이다. 실제 역할 표시는 모델마다 다른 특수 토큰이며, 이 형식을 채팅 템플릿(chat template)이라 한다.

[[diagram:sft-loss-mask]]

### 전체 미세조정의 메모리 비용

모델의 모든 파라미터를 다시 학습하는 **전체 미세조정**은 가중치뿐 아니라 기울기와 옵티마이저 상태도 GPU 메모리에 올려야 한다. Adam을 쓰면 파라미터 하나당 약 16바이트(bf16 가중치 2 + 기울기 2 + Adam의 fp32 가중치 사본·1차 모멘트·2차 모멘트 12)가 필요하다([[lesson:optimizers]]). 70B 모델이면 활성값을 빼고도 1TB가 넘는 메모리가 필요하다. 이 비용을 줄이려고, 원래 파라미터는 고정하고 아주 적은 수의 파라미터만 추가하거나 골라서 학습하는 방법들을 **PEFT**(Parameter-Efficient Fine-Tuning)라 한다.

### LoRA

PEFT 중 가장 널리 쓰이는 **LoRA**(Low-Rank Adaptation)는 미세조정으로 가중치 행렬에 생기는 변화량이 낮은 랭크(low-rank) 구조를 가진다는 관찰에 기반한다. 원래 가중치 행렬 $W_0$($d \times k$)에 변화량 $\Delta W$를 더해 $W = W_0 + \Delta W$로 만드는 대신, $\Delta W$를 두 작은 행렬의 곱으로 나타낸다.

\`\`\`math
\Delta W = BA
\`\`\`

$B$는 $d \times r$, $A$는 $r \times k$이고, 랭크 $r$은 $d$나 $k$보다 훨씬 작은 수(보통 4~64)로 정한다([[lesson:rank-eigen]]). $\Delta W$를 직접 학습하면 파라미터가 $d \times k$개 필요하지만, $B$와 $A$는 $d \times r + r \times k$개만 필요하다. $d = k = 4096$, $r = 8$이면 $\Delta W$는 약 1,678만 개인데 $B$와 $A$는 $4096 \times 8 \times 2 \approx 6.5$만 개로 약 256분의 1이다. 학습 중에는 $W_0$를 고정하고 $B$와 $A$만 갱신하며, 추론할 때는 $W_0 + BA$를 미리 계산해 두면 되므로 추론 속도가 거의 느려지지 않는다.

[[diagram:lora-diagram]]

보통 $A$는 작은 무작위 값으로, $B$는 **0**으로 초기화한다. 그러면 학습을 시작할 때 $\Delta W = BA = 0$이라 모델이 원래 모델과 같은 출력을 내고, 학습하면서 필요한 만큼만 원래 가중치에서 벗어난다. $A$까지 0이면 두 행렬의 기울기가 모두 0이 되어 학습이 시작되지 않는다. 아래 코드로 이 성질과 파라미터 수, 학습 후 가중치를 합쳐도 결과가 같다는 것을 확인한다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
d, k, r = 512, 512, 8
W0 = rng.normal(size=(d, k)) * 0.02      # 사전학습된 가중치: 학습 중 고정
A = rng.normal(size=(r, k)) * 0.01       # 작은 무작위 값으로 시작
B = np.zeros((d, r))                     # 0으로 시작 → 처음에는 ΔW = BA = 0

x = rng.normal(size=k)
y = W0 @ x + B @ (A @ x)                 # LoRA 순전파: 원래 출력 + 낮은 랭크의 변화량
print("시작 시점 출력이 원래 모델과 같은가?", np.allclose(y, W0 @ x))
print(f"ΔW 직접 학습: {d * k:,}개, LoRA(B, A): {d * r + r * k:,}개 → {d * k / (d * r + r * k):.0f}분의 1")

B = rng.normal(size=(d, r)) * 0.01       # 학습이 끝나 B가 바뀌었다고 하자
W_merged = W0 + B @ A                    # 배포 전에 한 번 합친다
print("합친 가중치로 계산해도 같은가?", np.allclose(W_merged @ x, W0 @ x + B @ (A @ x)))
print("ΔW의 랭크:", np.linalg.matrix_rank(B @ A))
\`\`\`

$512 \times 512$ 행렬 하나에서 학습 파라미터가 32분의 1이 되었다. 마지막 줄의 랭크 8은 $BA$가 원래 가중치를 8개 방향의 조합으로만 바꿀 수 있다는 뜻이다. LoRA는 미세조정에 필요한 변화가 이 정도의 낮은 랭크로 충분하다는 가정에 기반한다.

### QLoRA

**QLoRA**는 LoRA에 **양자화**(가중치를 4비트 같은 적은 비트 수로 저장하는 방법)를 결합한다. 고정해 두는 원본 가중치 $W_0$를 4비트로 양자화해 GPU 메모리에 올리고, 그 위에서 LoRA의 $B$와 $A$만 원래 정밀도로 학습한다. 원본 가중치가 차지하는 메모리가 크게 줄어, 소비자용 GPU 한 장으로도 수십 B 파라미터 모델을 미세조정할 수 있다. 양자화의 계산 방법과, 학습을 마친 모델을 작게 만드는 지식 증류는 [[lesson:serving-cost]]에서 다룬다.

[[diagram:finetune-memory]]
`,
  checks: [
    {
      key: "c1",
      question: "$d = k = 4096$, $r = 16$인 LoRA의 학습 파라미터 수는 원래 $\\Delta W$의 몇 분의 1인가?",
      choices: ["16분의 1", "128분의 1", "256분의 1", "4096분의 1"],
      answer: 1,
      explanation: "$2 \\times 4096 \\times 16 = 131{,}072$개이고 원래는 $4096^2 \\approx 1{,}678$만 개이므로 $4096 / (2 \\times 16) = 128$분의 1이다.",
    },
    {
      key: "c2",
      question: "QLoRA가 LoRA에 더한 것은?",
      choices: ["더 큰 랭크 $r$", "고정된 원본 가중치를 4비트로 양자화해 메모리를 줄인 것", "강화학습", "학생 모델"],
      answer: 1,
      explanation: "학습하는 $B$, $A$는 그대로 두고, 고정해 둔 원본 $W_0$를 적은 비트 수로 저장한다.",
    },
    {
      key: "c3",
      question: "LoRA에서 $B$를 0으로 초기화하는 이유는?",
      choices: ["학습을 시작할 때 $\\Delta W = BA = 0$이라 모델이 원래 모델과 같은 출력에서 시작하게 하려고", "$B$는 학습하지 않는 고정 행렬이라서", "메모리를 아끼려고", "$A$와 $B$가 같아지지 않게 하려고"],
      answer: 0,
      explanation: "$B = 0$이면 $BA = 0$이라 처음에는 사전학습 모델과 같다. 학습하면서 필요한 만큼만 원래 가중치에서 벗어난다. $A$까지 0이면 기울기가 0이 되어 학습이 시작되지 않으므로 $A$는 무작위 값으로 둔다.",
    },
    {
      key: "c4",
      question: "SFT에서 손실을 보통 어느 토큰에 계산하는가?",
      choices: ["응답(assistant) 부분 토큰", "질문(user) 부분 토큰", "특수 토큰만", "문서의 첫 토큰만"],
      answer: 0,
      explanation: "질문을 그대로 생성하는 것이 아니라 질문에 답하는 것을 학습하게 하려고 응답 부분에만 손실을 계산하는 것이 일반적이다.",
    },
    {
      key: "c5",
      question: "$d = k = 1024$인 가중치 행렬에 랭크 $r = 8$ LoRA를 붙이면 학습 파라미터는 원래 $\\Delta W$의 몇 %인가?",
      choices: ["약 1.56%", "약 0.78%", "약 12.5%", "약 50%"],
      answer: 0,
      explanation: "$B$는 $1024 \\times 8$, $A$는 $8 \\times 1024$로 합 16,384개이고, $\\Delta W$는 $1024^2 = 1{,}048{,}576$개다. 비율은 $16384 / 1048576 = 1/64 \\approx 1.56\\%$다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "LoRA에서 $\\Delta W = BA$($B$는 $d \\times r$, $A$는 $r \\times k$)로 나타내면 학습 파라미터 수가 $\\Delta W$를 직접 학습할 때보다 얼마나 줄어드는지 $d = k = 4096$, $r = 8$로 계산하고, $B$를 0으로 초기화하는 이유를 쓰라.",
      answer: md`
$\Delta W$를 직접 학습하면 파라미터가 $4096 \times 4096 \approx 1{,}678$만 개다. LoRA는 $B$($4096 \times 8$)와 $A$($8 \times 4096$)만 학습하므로 $2 \times 4096 \times 8 = 65{,}536$개로 약 256분의 1이다. 일반적으로 비율은 $dk / (r(d + k))$다.

$B$를 0으로 초기화하면 학습을 시작할 때 $\Delta W = BA = 0$이므로 모델의 출력이 사전학습 모델과 같고, 학습하면서 필요한 만큼만 원래 가중치에서 벗어난다. $A$는 무작위 값으로 두어야 기울기가 0이 되지 않아 학습이 시작된다.
`,
      keyPoints: [
        "직접 학습은 $dk \\approx 1{,}678$만 개, LoRA는 $r(d + k) = 65{,}536$개",
        "약 256분의 1로 줄어든다",
        "$B = 0$이면 학습을 시작할 때 $\\Delta W = 0$이다",
        "$A$는 무작위로 두어야 기울기가 0이 되지 않는다",
      ],
    },
    {
      key: "d2",
      question: "전체 미세조정에서 파라미터 하나당 약 16바이트가 필요한 이유를 쓰고, QLoRA가 LoRA에 더해 메모리를 줄이는 방법을 쓰라.",
      answer: md`
Adam으로 전체 미세조정을 하면 bf16 가중치(2바이트)와 기울기(2바이트)에 더해, Adam이 쓰는 fp32 가중치 사본과 1차·2차 모멘트(각 4바이트, 합 12바이트)를 저장해야 하므로 파라미터 하나당 약 16바이트가 든다. 70B 모델이면 1TB가 넘는다.

LoRA는 학습 파라미터를 줄여 기울기와 옵티마이저 상태의 메모리를 줄이지만, 고정한 원본 가중치는 여전히 메모리에 올려야 한다. QLoRA는 이 원본 가중치를 4비트로 양자화해 저장하고 LoRA의 $B$, $A$만 원래 정밀도로 학습하므로, 원본 가중치의 메모리가 bf16의 약 4분의 1로 줄어든다.
`,
      keyPoints: [
        "가중치 2 + 기울기 2 + Adam의 fp32 사본과 두 모멘트 12바이트",
        "LoRA는 학습 파라미터와 옵티마이저 상태를 줄인다",
        "QLoRA는 고정한 원본 가중치를 4비트로 양자화한다",
        "원본 가중치의 메모리가 약 4분의 1이 된다",
      ],
    },
  ],
  references: [
    { title: "Hu et al. (2021) — LoRA: Low-Rank Adaptation of Large Language Models", url: "https://arxiv.org/abs/2106.09685", note: "LoRA 원 논문: 그림 1에 구조가 있다 (영문)" },
    { title: "Dettmers et al. (2023) — QLoRA: Efficient Finetuning of Quantized LLMs", url: "https://arxiv.org/abs/2305.14314", note: "NF4, 이중 양자화, 페이지드 옵티마이저 (영문)" },
    { title: "Hugging Face PEFT 문서", url: "https://huggingface.co/docs/peft/index", note: "LoRA를 실제 모델에 적용하는 라이브러리 (영문)" },
  ],
});
