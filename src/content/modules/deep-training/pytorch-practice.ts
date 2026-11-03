import { defineLesson, md, py } from "../../kit";

export default defineLesson({
  id: "pytorch-practice",
  title: "GPU, 혼합 정밀도와 PyTorch 실습",
  tier: "supplement",
  goal: "GPU가 행렬 연산을 빠르게 처리하는 이유와 혼합 정밀도 학습의 underflow·loss scaling을 설명하고, 같은 모델을 NumPy와 PyTorch로 학습해 결과와 코드 구조를 비교한다.",
  why: "모델과 데이터가 커지면 학습 시간과 GPU 메모리가 먼저 한계에 도달한다. 혼합 정밀도는 대형 모델 학습의 기본 설정이고, Hugging Face의 사전학습 모델([[lesson:pretraining]])을 불러와 파인튜닝할 때도 이 레슨의 학습 루프를 그대로 쓴다.",
  body: md`
### CPU와 GPU

신경망 학습의 계산은 대부분 행렬 곱과 원소별 연산이다. 행렬 곱 $C = AB$의 각 원소 $c_{ij} = \sum_k a_{ik} b_{kj}$는 다른 원소와 독립적으로 계산할 수 있으므로, 많은 코어가 나눠서 동시에 계산할 수 있다. CPU는 코어가 수~수십 개로 적은 대신 코어마다 복잡한 분기와 순차 처리를 빠르게 실행한다. GPU는 단순한 연산을 하는 코어를 수천 개 갖고 있어, 같은 연산을 많은 데이터에 동시에 적용하는 행렬 곱에서 CPU보다 훨씬 빠르다. **CUDA**는 NVIDIA GPU에서 범용 병렬 연산을 실행하는 프로그래밍 플랫폼이다. PyTorch에서 텐서를 \`.to("cuda")\`로 GPU에 옮기면, 그 텐서에 대한 연산은 CUDA로 구현된 GPU 함수(커널)로 실행된다.

### 혼합 정밀도

텐서의 숫자는 기본적으로 32비트 부동소수점(FP32)으로 저장된다. **혼합 정밀도**(mixed precision) 학습은 행렬 곱처럼 정밀도의 영향이 작은 연산을 16비트 형식(FP16 또는 BF16)으로 계산하고, 파라미터 갱신처럼 정밀도가 중요한 계산은 FP32로 유지한다. 16비트 값은 메모리를 절반만 쓰므로 같은 GPU에 더 큰 배치나 모델을 올릴 수 있고, 최신 GPU는 16비트 행렬 곱 전용 연산 장치를 갖고 있어 계산도 빨라진다.

숫자 형식마다 표현할 수 있는 범위가 다르다. 지수 비트 수가 범위를, 가수 비트 수가 정밀도를 정한다. FP16은 지수 비트가 5개라 아주 작거나 큰 수를 표현하지 못하고, BF16은 FP32와 같은 8비트 지수를 써서 범위가 넓은 대신 유효숫자가 적다.

[[diagram:float-formats]]

| 형식 | 비트(부호·지수·가수) | 대략의 최댓값 | 가장 작은 정규수 | 특징 |
| --- | --- | --- | --- | --- |
| FP32 | 32 (1·8·23) | $3.4 \times 10^{38}$ | $1.2 \times 10^{-38}$ | 기본 형식 |
| FP16 | 16 (1·5·10) | 65,504 | $6.1 \times 10^{-5}$ | 범위가 좁아 loss scaling이 필요하다 |
| BF16 | 16 (1·8·7) | $3.4 \times 10^{38}$ | $1.2 \times 10^{-38}$ | 범위는 FP32와 같고 정밀도가 낮다 |

FP16을 그대로 쓰면 아주 작은 기울기가 0으로 반올림된다(**underflow**). NumPy의 \`float16\`으로 underflow와 loss scaling을 확인한다.

\`\`\`python
import numpy as np

print(np.finfo(np.float16).max, np.finfo(np.float16).tiny)   # 최댓값, 가장 작은 정규수
grad = 1e-8
print(np.float16(grad))                  # 0.0: FP16에서는 이 기울기가 0이 된다(underflow)
scale = 1024.0
scaled = np.float16(grad * scale)        # 손실(따라서 기울기)에 1024를 곱한 뒤 FP16으로 변환
print(scaled, float(scaled) / scale)     # 다시 1024로 나누면 원래 크기에 가까운 값이 복원된다
with np.errstate(over="ignore"):         # 넘침 경고를 표시하지 않는다
    print(np.float16(70000.0))           # inf: 최댓값보다 크면 넘친다(overflow)
# 65500.0 6.104e-05
# 0.0
# 1.025e-05 1.0011717677116394e-08
# inf
\`\`\`

$10^{-8}$ 크기의 기울기는 FP16에서 0이 된다. 손실에 1024를 곱하면 연쇄법칙에 따라 기울기도 1024배가 되어 FP16으로 표현할 수 있는 범위에 들어오고, 파라미터를 갱신하기 직전에 1024로 나누면 원래 크기가 복원된다. 이 방법을 **loss scaling**이라 한다. 배율이 너무 크면 65,504를 넘어 inf가 되므로, PyTorch의 \`GradScaler\`는 inf가 나오면 그 스텝의 갱신을 건너뛰고 배율을 줄이며, 일정 스텝 동안 inf가 없으면 배율을 늘린다. BF16은 범위가 넓어 loss scaling 없이 쓸 수 있으므로 최근 대형 모델 학습에서 많이 쓴다.

[[diagram:fp16-range]]

PyTorch에서는 \`torch.autocast\`가 연산마다 16비트로 계산할지 정하고, \`GradScaler\`가 loss scaling을 처리한다. [[lesson:pytorch]]의 학습 루프에 다음과 같이 적용한다.

\`\`\`python-colab
scaler = torch.amp.GradScaler("cuda")
for xb, yb in train_loader:
    xb, yb = xb.to("cuda"), yb.to("cuda")
    optimizer.zero_grad()
    with torch.autocast(device_type="cuda", dtype=torch.float16):
        loss = loss_fn(model(xb), yb)    # 순전파와 손실을 16비트로 계산
    scaler.scale(loss).backward()        # 손실에 배율을 곱한 뒤 역전파
    scaler.step(optimizer)               # 기울기를 배율로 나누고, inf가 없으면 갱신
    scaler.update()                      # 다음 스텝의 배율을 조절
\`\`\`

### PyTorch로 make_moons 분류하기

층을 순서대로 연결하기만 하는 모델은 \`nn.Module\`을 상속하지 않고 \`nn.Sequential\`로 만들 수 있다. 아래 코드는 은닉층이 두 개인 신경망으로 make_moons를 분류한다. 데이터 1,000개를 한 번에 넣어 기울기를 계산하는 전체 배치 경사하강법이다. Colab에서 실행한다.

\`\`\`python-colab
import torch
import torch.nn as nn
from sklearn.datasets import make_moons

X, y = make_moons(1000, noise=0.2, random_state=0)
X, y = torch.tensor(X, dtype=torch.float32), torch.tensor(y)
net = nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 16), nn.ReLU(), nn.Linear(16, 2))
opt = torch.optim.Adam(net.parameters(), lr=1e-2)
for ep in range(300):
    loss = nn.functional.cross_entropy(net(X), y)    # 다중 분류의 교차 엔트로피
    opt.zero_grad(); loss.backward(); opt.step()      # 기울기 초기화 → 역전파 → 갱신
    if ep % 50 == 0:
        print(ep, round(loss.item(), 4))
\`\`\`

은닉 유닛 수를 1, 2, 4, 64로 바꿔 실행하면, 유닛이 1~2개인 신경망은 초승달 모양의 경계를 직선에 가까운 경계로 근사하고, 유닛이 64개이면 경계가 데이터의 곡선 모양을 따라간다.

[[diagram:moons-capacity]]

### 같은 선형회귀를 NumPy와 PyTorch로 학습하기

같은 데이터에 같은 학습률과 스텝 수로 경사하강법을 적용해 선형회귀를 두 방식으로 학습한다. NumPy 버전은 미분 공식을 손으로 유도해 코드로 옮기고, PyTorch 버전은 미분을 autograd에, 갱신을 옵티마이저에 맡긴다. 두 버전의 최종 $w$, $b$는 참값 $w = 3$, $b = 2$ 근처의 거의 같은 값이 되어야 한다.

\`\`\`python
# NumPy: dL/dw, dL/db를 직접 유도해 코드로 옮긴다
import numpy as np

rng = np.random.default_rng(0)
X = rng.uniform(-3, 3, size=200)
y_true = 3.0 * X + 2.0 + rng.normal(0, 0.5, size=200)

w, b, lr = 0.0, 0.0, 0.05
for step in range(500):
    y_pred = w * X + b
    error = y_pred - y_true
    loss = (error ** 2).mean()
    grad_w = (2 * error * X).mean()     # dL/dw = (2/n) Σ(wx + b − y)x
    grad_b = (2 * error).mean()         # dL/db = (2/n) Σ(wx + b − y)
    w -= lr * grad_w
    b -= lr * grad_b

print(f"NumPy  : w={w:.4f}, b={b:.4f}, loss={loss:.4f}")   # NumPy  : w=2.9789, b=1.9603, loss=0.2605
\`\`\`

PyTorch 버전은 Colab에서 위 NumPy 코드를 먼저 실행해 \`X\`, \`y_true\`를 만든 뒤 이어서 실행한다.

\`\`\`python-colab
# PyTorch: 같은 X, y_true를 쓰고, 미분 공식은 작성하지 않는다
import torch

Xt = torch.tensor(X, dtype=torch.float32).unsqueeze(1)
yt = torch.tensor(y_true, dtype=torch.float32).unsqueeze(1)

model = torch.nn.Linear(1, 1)                          # w, b를 파라미터로 갖는 선형층
opt = torch.optim.SGD(model.parameters(), lr=0.05)

for step in range(500):
    pred = model(Xt)
    loss = torch.nn.functional.mse_loss(pred, yt)
    opt.zero_grad()
    loss.backward()                                    # dL/dw, dL/db를 autograd가 계산한다
    opt.step()                                         # w, b를 옵티마이저가 갱신한다

print(f"PyTorch: w={model.weight.item():.4f}, b={model.bias.item():.4f}, loss={loss.item():.4f}")
\`\`\`

두 버전의 $w$, $b$, 손실은 소수점 셋째 자리 근처까지 같다. 더 중요한 차이는 학습 루프의 구성이다. NumPy 버전의 \`grad_w\`, \`grad_b\` 두 줄은 선형회귀와 MSE에만 맞는 미분 공식이라, 모델을 2층 신경망으로 바꾸면 다시 유도해야 한다. PyTorch 버전의 루프에는 $w$나 $b$를 직접 다루는 줄이 없다. \`loss.backward()\`가 미분 공식을, \`opt.step()\`이 갱신 두 줄을 대신하므로, \`model\`을 \`nn.Sequential\`로 만든 신경망으로 바꿔도 루프의 나머지 줄은 그대로 쓴다.

[[diagram:numpy-vs-torch-loop]]

### Hugging Face

Hugging Face의 \`transformers\` 라이브러리는 BERT, GPT 계열처럼 큰 데이터로 사전학습한 모델의 구조와 가중치를 몇 줄의 코드로 불러온다. 불러온 모델도 \`nn.Module\`이므로 [[lesson:pytorch]]의 옵티마이저와 학습 루프로 파인튜닝할 수 있다. Transformer와 LLM 모듈([[lesson:transformer-block]], [[lesson:pretraining]])에서 이 방식을 쓴다.
`,
  checks: [
    {
      key: "c1",
      question: "GPU가 행렬 곱을 CPU보다 훨씬 빠르게 계산하는 이유는?",
      choices: [
        "코어 하나의 성능이 CPU보다 높아서",
        "서로 독립인 많은 곱셈·덧셈을 수천 개의 단순한 코어가 동시에 계산해서",
        "메모리를 쓰지 않아서",
        "정밀도가 항상 더 높아서",
      ],
      answer: 1,
      explanation: "행렬 곱의 각 원소는 다른 원소와 독립적으로 계산할 수 있으므로 많은 코어가 나눠서 동시에 계산할 수 있다.",
    },
    {
      key: "c2",
      question: "FP16으로 학습할 때 loss scaling이 필요한 이유는?",
      choices: [
        "FP16은 큰 수를 표현할 수 없어서",
        "아주 작은 기울기가 0으로 반올림(underflow)되는 것을 막으려고",
        "손실 값을 줄이려고",
        "GPU 메모리를 늘리려고",
      ],
      answer: 1,
      explanation: "손실에 큰 배율을 곱하면 기울기도 같은 배율로 커져 FP16의 표현 범위에 들어온다. 갱신 직전에 배율로 다시 나눈다.",
    },
    {
      key: "c3",
      question: "NumPy로 미분 공식을 직접 구현하는 대신 PyTorch를 쓸 때 가장 큰 이점은?",
      choices: [
        "결과가 수학적으로 달라진다",
        "모델 구조를 바꿔도 미분 공식을 다시 유도하지 않고 같은 학습 루프를 쓸 수 있다",
        "학습률이 필요 없다",
        "항상 정확도가 높아진다",
      ],
      answer: 1,
      explanation: "두 방법의 수학은 같다. autograd가 미분 공식을, 옵티마이저가 갱신 코드를 대신하므로 모델이 복잡해져도 루프는 그대로다.",
    },
    {
      key: "c4",
      question: "대형 모델 학습에서 BF16을 FP16보다 많이 쓰는 주된 이유는?",
      choices: [
        "FP32와 같은 지수 범위를 가져 loss scaling 없이도 underflow와 overflow가 드물기 때문",
        "FP16보다 유효숫자가 많아 더 정밀하기 때문",
        "메모리를 FP16의 절반만 쓰기 때문",
        "CPU에서만 동작하기 때문",
      ],
      answer: 0,
      explanation: "BF16은 지수 8비트(FP32와 같음), 가수 7비트로 범위가 넓고 정밀도가 낮다. FP16은 정밀도가 더 높지만 범위가 좁아 작은 기울기가 0이 되기 쉽다. 둘 다 16비트라 메모리 사용량은 같다.",
    },
    {
      key: "c5",
      question: "FP16에서 기울기 $10^{-8}$은 0이 된다. loss scaling으로 손실에 1024를 곱하면 이 기울기는 어떻게 되는가?",
      choices: [
        "약 $10^{-5}$가 되어 FP16에서 0이 아닌 값으로 표현되고, 갱신 전에 1024로 다시 나눈다",
        "여전히 0이다",
        "inf가 된다",
        "1024가 된다",
      ],
      answer: 0,
      explanation: "기울기도 손실과 같은 배율로 커져 약 $1.02 \\times 10^{-5}$가 되고, FP16은 이 값을 비정규수로 표현할 수 있다. 갱신 직전에 배율로 나눈다.",
    },
  ],
  predicts: [
    {
      key: "p1",
      code: py`
import numpy as np
g = np.array([3e-4, 5e-6, 2e-8, 1e-9], dtype=np.float32)
print((g.astype(np.float16) == 0).tolist())
print(((g * 1024).astype(np.float16) == 0).tolist())
`,
      expected: "[False, False, True, True]\n[False, False, False, False]",
      explanation: "FP16이 표현하는 가장 작은 양수는 약 $6 \\times 10^{-8}$이므로 `2e-8`과 `1e-9`는 0이 된다(underflow). 1024를 곱한 뒤 변환하면 각각 약 $2 \\times 10^{-5}$, $10^{-6}$이 되어 0이 되지 않는다. 혼합 정밀도 학습의 loss scaling이 이 원리를 쓴다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "같은 행렬 곱이 CPU보다 GPU에서 훨씬 빠르게 계산되는 이유를 행렬 곱의 구조와 두 장치의 코어 구성으로 쓰라.",
      answer: md`
행렬 곱 $C = AB$의 각 원소 $c_{ij} = \sum_k a_{ik}b_{kj}$는 다른 원소와 독립적으로 계산할 수 있으므로, 많은 코어가 원소를 나눠 동시에 계산할 수 있다. CPU는 코어가 수~수십 개로 적고, 코어마다 복잡한 분기와 순차 처리를 빠르게 실행하도록 설계되어 있다. GPU는 단순한 곱셈과 덧셈을 하는 코어를 수천 개 갖고 있어 같은 연산을 많은 데이터에 동시에 적용할 수 있다. 그래서 독립적인 계산이 많은 행렬 곱에서는 GPU가 CPU보다 훨씬 빠르다.
`,
      keyPoints: [
        "행렬 곱의 원소들은 서로 독립적으로 계산할 수 있다",
        "CPU는 코어가 적고 순차 처리에 맞춰져 있다",
        "GPU는 단순한 코어 수천 개로 같은 연산을 동시에 실행한다",
      ],
    },
    {
      key: "d2",
      question: "혼합 정밀도 학습이 메모리와 속도 면에서 유리한 이유를 쓰고, FP16을 그대로 쓸 때 생기는 문제와 loss scaling이 이를 해결하는 방법을 쓰라.",
      answer: md`
혼합 정밀도 학습은 행렬 곱처럼 정밀도의 영향이 작은 연산을 16비트로 계산한다. 16비트 값은 FP32의 절반 메모리를 쓰므로 더 큰 배치나 모델을 올릴 수 있고, 최신 GPU의 16비트 전용 연산 장치로 계산도 빨라진다.

FP16은 지수 비트가 5개라 약 $6 \times 10^{-8}$보다 작은 값을 0으로 만든다. 작은 기울기가 0이 되면(underflow) 그 파라미터는 갱신되지 않는다. loss scaling은 손실에 큰 배율(예: 1024)을 곱해 역전파하므로 기울기도 같은 배율로 커져 FP16의 표현 범위에 들어오고, 갱신 직전에 기울기를 배율로 나눠 원래 크기로 되돌린다. 배율이 너무 커서 inf가 나오면 그 스텝의 갱신을 건너뛰고 배율을 줄인다.
`,
      keyPoints: [
        "16비트 값은 메모리가 절반이고 전용 연산 장치로 계산이 빠르다",
        "FP16은 범위가 좁아 작은 기울기가 0이 된다(underflow)",
        "손실에 배율을 곱하면 기울기도 커져 표현 범위에 들어온다",
        "갱신 직전에 배율로 나누고, inf가 나오면 배율을 줄인다",
      ],
    },
  ],
  references: [
    { title: "PyTorch — Automatic Mixed Precision recipe", url: "https://pytorch.org/tutorials/recipes/recipes/amp_recipe.html", note: "autocast와 GradScaler 사용법 (영문)" },
    { title: "Micikevicius et al. (2018) — Mixed Precision Training", url: "https://arxiv.org/abs/1710.03740", note: "FP16 학습과 loss scaling을 제안한 논문 (영문)" },
    { title: "Google Colab", url: "https://colab.research.google.com/", note: "무료 GPU로 본문의 PyTorch 코드를 실행한다. 런타임 유형을 GPU로 바꾸고 `torch.cuda.is_available()`로 확인한다." },
  ],
});
