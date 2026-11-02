import { defineLesson, md, py } from "../../kit";

export default defineLesson({
  id: "pytorch-practice",
  title: "혼합 정밀도와 PyTorch 실습",
  tier: "supplement",
  goal: "GPU·CUDA가 행렬 연산을 가속하는 원리와 혼합 정밀도의 underflow·loss scaling을 설명하고, 같은 모델을 NumPy와 PyTorch로 풀어 비교할 수 있다.",
  why: "",
  body: md`
**CPU / GPU / CUDA.** 신경망 학습의 대부분은 행렬 곱과 원소별 연산으로 이뤄지는데, 이 연산들은 수십만 개의 독립적인 곱셈-덧셈으로 쪼갤 수 있어 병렬화에 매우 유리하다. CPU는 코어 수가 적은 대신 코어 하나하나의 성능이 강력해 복잡한 분기와 순차 로직에 강하고, GPU(그래픽 처리 장치)는 코어 하나하나는 단순하지만 수천 개를 동시에 돌릴 수 있어 "똑같은 연산을 아주 많은 데이터에 동시에 적용하는" 행렬 연산에 압도적으로 유리하다. CUDA는 NVIDIA GPU에서 이런 범용 병렬 연산을 수행할 수 있게 해주는 프로그래밍 인터페이스로, PyTorch는 텐서를 \`.to("cuda")\`로 옮기기만 하면 이후의 모든 연산을 내부적으로 CUDA 커널 호출로 바꿔 GPU에서 병렬 실행해준다.

**Mixed Precision.** 기본적으로 텐서의 숫자는 32비트 부동소수점(FP32)으로 저장되는데, 딥러닝 연산 대부분은 그렇게까지 높은 정밀도가 필요하지 않다는 점에 착안해 일부 연산을 16비트(FP16 또는 BF16)로 대신 계산하는 기법이 혼합 정밀도(mixed precision) 학습이다. 숫자를 절반 크기로 저장하므로 GPU 메모리를 적게 쓰고, 한 번에 메모리에 실을 수 있는 데이터가 늘어나는 데다 최신 GPU는 16비트 연산 전용 회로를 따로 갖추고 있어 속도도 훨씬 빨라진다. 다만 표현 범위가 좁아진 만큼 작은 기울기 값이 0으로 반올림돼버리는 문제가 생길 수 있어, PyTorch의 \`torch.cuda.amp\`는 손실 값을 일부러 키워뒀다가(loss scaling) 나중에 다시 축소하는 방식으로 이 문제를 보완한다.

숫자 형식마다 표현할 수 있는 범위가 다르다. FP16은 지수 비트가 적어 아주 작거나 큰 수를 못 담고, BF16은 FP32와 같은 지수 비트를 써서 범위는 넓은 대신 유효숫자가 적다.

[[diagram:float-formats]]

| 형식 | 비트 | 대략의 최댓값 | 가장 작은 정규수 | 특징 |
| --- | --- | --- | --- | --- |
| FP32 | 32 | $3.4 \times 10^{38}$ | $1.2 \times 10^{-38}$ | 기본값, 넉넉하다 |
| FP16 | 16 | 65,504 | $6.1 \times 10^{-5}$ | 범위가 좁아 loss scaling이 필요 |
| BF16 | 16 | $3.4 \times 10^{38}$ | $1.2 \times 10^{-38}$ | 범위는 FP32와 같고 정밀도만 낮다 |

NumPy의 \`float16\`으로 underflow와 loss scaling을 직접 확인해 보자.

\`\`\`python
import numpy as np

print(np.finfo(np.float16).max, np.finfo(np.float16).tiny)   # 표현할 수 있는 최댓값, 가장 작은 정규수
grad = 1e-8
print(np.float16(grad))                  # 0.0: FP16으로는 이 작은 기울기가 사라진다(underflow)
scale = 1024.0
scaled = np.float16(grad * scale)        # 손실(따라서 기울기)을 1024배 키운 뒤 FP16으로
print(scaled, float(scaled) / scale)     # 살아남은 값을 다시 1024로 나누면 원래 크기 근처로 복원
with np.errstate(over="ignore"):        # 넘침 경고를 숨기고
    print(np.float16(70000.0))           # inf: 너무 크면 넘친다(overflow)
\`\`\`

$10^{-8}$ 크기의 기울기는 FP16에서 0이 되어 버리지만, 손실을 1024배 키우면 기울기도 1024배가 되어 FP16 범위 안에 들어오고, 갱신 직전에 다시 1024로 나누면 원래 크기가 복원된다. 너무 크게 키우면 반대로 65,504를 넘어 inf가 되므로, 실제 구현(\`GradScaler\`)은 inf가 나오면 배율을 줄이고 한동안 괜찮으면 늘리는 식으로 배율을 자동 조절한다. BF16은 범위가 넓어 이런 장치 없이 쓸 수 있어서 최근 대형 모델 학습의 기본 형식이 되었다.

[[diagram:fp16-range]]

**Hugging Face.** \`transformers\` 라이브러리는 BERT, GPT 계열처럼 이미 대규모 데이터로 사전학습(pretrained)된 모델의 가중치와 구조를 단 몇 줄로 불러와 바로 쓸 수 있게 해준다. 지금까지 배운 nn.Module, optimizer, training loop는 이런 사전학습 모델을 가져와 우리 데이터에 맞게 미세조정(fine-tuning)할 때도 그대로 재사용된다. 5~7주차에서 Transformer, LLM, RAG를 다룰 때는 모델을 처음부터 새로 학습시키는 대신 Hugging Face 생태계에서 이미 학습된 모델을 가져와 그 위에 쌓아 올리는 방식을 계속 쓰게 될 것이므로, 핵심 과정 「PyTorch가 대신해주는 것들」 단계에서 짝지어본 대응 관계를 기억해두면 그때 훨씬 수월하게 이해할 수 있다.

### PyTorch로 make_moons 분류해보기

PyTorch로 넘어가면 겉모습은 크게 달라지지만 원리는 앞서 만든 Value 클래스와 한 치도 다르지 않다. 텐서 하나하나가 Value처럼 자신이 어떻게 만들어졌는지를 grad_fn이라는 이름으로 기억하고 있고, loss.backward()를 호출하면 우리가 직접 짠 backward()와 똑같이 계산 그래프를 위상정렬 순서로 거슬러 올라가며 기울기를 채워 넣는다. 다른 점은 숫자 하나(스칼라)가 아니라 수천~수백만 개의 숫자를 담은 텐서 단위로, 그것도 GPU에서 대량으로 병렬 처리한다는 점이다. 이 코드는 torch를 사용하므로 이 사이트 브라우저에서는 실행되지 않는다. Google Colab에 붙여넣어 실행해보라.

\`\`\`python-colab
import torch, torch.nn as nn
from sklearn.datasets import make_moons
X, y = make_moons(1000, noise=0.2, random_state=0)
X, y = torch.tensor(X, dtype=torch.float32), torch.tensor(y)
# nn.Sequential: 층을 순서대로 이어 붙이기만 하면 되는 간단한 모델은 nn.Module을 직접 상속하지 않고 이렇게 한 줄로 쓸 수 있다
net = nn.Sequential(nn.Linear(2,16), nn.ReLU(), nn.Linear(16,16), nn.ReLU(), nn.Linear(16,2))
opt = torch.optim.Adam(net.parameters(), lr=1e-2)
for ep in range(300):
    loss = nn.functional.cross_entropy(net(X), y)   # 다중분류용 손실함수(2주차)
    opt.zero_grad(); loss.backward(); opt.step()      # 기울기 초기화 → 역전파 → 파라미터 갱신
    if ep % 50 == 0: print(ep, loss.item())
\`\`\`

opt.zero_grad()를 빼먹으면 어떤 일이 벌어질지 예측해보자. 앞서 Value의 _backward가 grad에 값을 대입(=)하지 않고 누적(+=)한다고 했던 것을 그대로 떠올리면 된다. PyTorch의 텐서도 정확히 같은 규칙을 따른다. zero_grad()로 이전 스텝의 기울기를 0으로 리셋해주지 않으면, 새로 계산된 기울기가 이전 스텝의 기울기 위에 계속 쌓여서 실제보다 훨씬 크고 스텝을 반복할수록 계속 불어나는 기울기로 파라미터를 갱신하게 되고, 결국 학습이 발산하거나 불안정해진다. 은닉 유닛 수를 1, 2, 4, 64로 바꿔가며 실행해보면, 표현력이 부족한(유닛이 1~2개인) 네트워크는 make_moons의 초승달 모양 경계를 직선에 가까운 경계로 뭉개 버리는 반면, 유닛이 충분히 많아지면(64개) 결정경계가 실제 데이터의 곡선 모양을 정교하게 따라가는 것을 눈으로 확인할 수 있을 것이다.

[[diagram:moons-capacity]]

### 같은 선형회귀를 두 번 풀어보기: NumPy 수동 구현 vs PyTorch

1주차의 선형회귀를 다시 가져와, 완전히 같은 데이터에 완전히 같은 경사하강법 스텝 수·학습률을 적용해서 두 가지 방식으로 풀어보자. 하나는 지금까지처럼 미분 공식을 손으로 유도해 코드로 옮긴 NumPy 버전이고, 다른 하나는 앞서 배운 PyTorch의 autograd와 optimizer에 그 계산을 통째로 맡기는 버전이다. 같은 X, y로 학습하므로 두 버전의 최종 w, b는 (참값 w=3, b=2 근처로) 거의 같은 값에 수렴해야 한다. 이것이 "PyTorch가 우리가 손으로 한 것과 수학적으로 동일한 일을 하고 있다"는 가장 직접적인 증거다.

\`\`\`python
# NumPy 수동 구현: dL/dw, dL/db를 직접 유도해서 코드로 옮긴다
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

아래 PyTorch 버전은 브라우저에서는 실행되지 않는다. Colab에서 위 NumPy 코드를 먼저 실행해 \`X\`, \`y_true\`를 만든 뒤, 이어서 붙여 실행하자.

\`\`\`python-colab
# 완전히 같은 X, y_true를 PyTorch로: 미분 공식은 단 한 줄도 등장하지 않는다
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

두 print 문을 나란히 실행해보면 w, b, loss가 소수점 셋째 자리 안팎에서 거의 일치한다(둘 다 참값 w=3, b=2에 수렴하고, np.isclose(w, w_t, atol=1e-2)가 참이 될 것이다). 그런데 정작 눈여겨봐야 할 것은 최종 숫자의 일치보다 "학습 루프 안에 무엇이 남아 있고 무엇이 사라졌는가"다. NumPy 버전의 루프 7줄 중 두 줄(grad_w, grad_b)은 이 문제(선형회귀 + MSE)에 대해서만 유효한, 손으로 유도한 미분 공식이다. 모델을 2층 MLP로 바꾸면 이 두 줄은 완전히 새로 유도해서 다시 써야 한다. 반면 PyTorch 버전의 루프 5줄 중에는 w나 b를 직접 언급하는 코드가 단 한 줄도 없다. \`loss.backward()\`가 미분 공식이 있던 자리를 대신하고, \`opt.step()\`이 파라미터 갱신 두 줄을 대신한다. 그래서 \`model = torch.nn.Linear(1, 1)\`을 앞서 만든 \`nn.Sequential(nn.Linear(2,16), nn.ReLU(), ...)\`처럼 훨씬 복잡한 네트워크로 바꿔도, 학습 루프의 나머지 5줄은 단 한 글자도 손댈 필요가 없다. 이것이 "코드 줄 수가 줄었다"는 것보다 훨씬 중요한, autograd와 optimizer가 만들어주는 실질적인 자동화다.

[[diagram:numpy-vs-torch-loop]]
`,
  checks: [
    {
      key: "c1",
      question: "GPU가 행렬 곱을 CPU보다 훨씬 빠르게 처리하는 이유는?",
      choices: ["코어 하나가 CPU보다 강력해서", "서로 독립인 수많은 곱셈-덧셈을 수천 개의 단순한 코어로 동시에 처리해서", "메모리를 쓰지 않아서", "정밀도가 항상 더 높아서"],
      answer: 1,
      explanation: "행렬 곱의 각 원소 계산은 서로 독립이라 병렬화에 최적이다. 벡터화만으로도 파이썬 반복문보다 수백 배 빨라질 수 있다.",
    },
    {
      key: "c2",
      question: "FP16으로 학습할 때 loss scaling이 필요한 이유는?",
      choices: ["FP16은 큰 수를 표현할 수 없어서", "아주 작은 기울기가 0으로 반올림(underflow)되는 것을 막으려고", "손실을 줄이려고", "GPU 메모리를 늘리려고"],
      answer: 1,
      explanation: "손실(→기울기)을 크게 키워 FP16의 표현 범위 안에서 계산한 뒤, 갱신 직전에 다시 나눈다.",
    },
    {
      key: "c3",
      question: "NumPy 수동 구현 대신 PyTorch를 쓸 때 가장 큰 이점은?",
      choices: ["결과가 수학적으로 달라진다", "모델 구조를 바꿔도 미분 공식을 다시 유도할 필요 없이 학습 루프를 그대로 쓸 수 있다", "학습률이 필요 없다", "항상 정확도가 높아진다"],
      answer: 1,
      explanation: "두 방법의 수학은 같다. autograd가 미분 공식 자리를, optimizer가 갱신 코드를 대신하므로 모델이 복잡해져도 루프는 그대로다.",
    },
    {
      key: "c4",
      question: "BF16이 FP16보다 대형 모델 학습에서 선호되는 주된 이유는?",
      choices: ["FP32와 같은 지수 범위를 가져 loss scaling 없이도 underflow·overflow가 드물기 때문", "FP16보다 유효숫자가 많아 더 정밀하기 때문", "메모리를 FP16의 절반만 쓰기 때문", "CPU에서만 동작하기 때문"],
      answer: 0,
      explanation: "BF16은 지수 8비트(FP32와 같음), 가수 7비트로 범위가 넓고 정밀도가 낮다. FP16은 정밀도는 더 높지만 범위가 좁아 작은 기울기가 사라지기 쉽다. 둘 다 16비트라 메모리는 같다.",
    },
    {
      key: "c5",
      question: "FP16에서 기울기 $10^{-8}$은 0이 된다. loss scaling으로 손실을 1024배 키우면 이 기울기는?",
      choices: ["약 $10^{-5}$가 되어 FP16에서 살아남고, 갱신 전에 1024로 다시 나눈다", "여전히 0이다", "inf가 된다", "1024가 된다"],
      answer: 0,
      explanation: "기울기도 손실과 같은 배율로 커져 약 $1.02 \\times 10^{-5}$가 되고, 이는 FP16이 (비정규수로) 표현할 수 있다. 갱신 직전에 배율을 되돌린다.",
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
      explanation: "FP16이 표현하는 가장 작은 양수는 약 $6 \\times 10^{-8}$이라 `2e-8`, `1e-9`는 0으로 사라집니다(underflow). 1024배 키운 뒤 변환하면 각각 약 $2 \\times 10^{-5}$, $10^{-6}$이 되어 살아남습니다. 이것이 혼합 정밀도 학습의 loss scaling입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "똑같은 행렬 곱 연산이 CPU보다 GPU에서 훨씬 빠르게 수행되는 이유를, 두 장치의 코어 수와 코어당 성능의 차이 관점에서 설명하라.",
      answer: md`
CPU는 코어 수는 적지만 코어 하나하나의 성능이 강력해 복잡한 순차 작업에 유리하고, GPU는 단순한 연산을 하는 코어를 수천 개 가지고 있어 행렬곱처럼 같은 연산을 대량으로 동시에(병렬로) 수행하는 데 훨씬 빠르다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "혼합 정밀도(mixed precision) 학습이 메모리 사용량과 학습 속도 면에서 유리한 이유는 무엇인가? FP16을 그대로 쓸 때 생길 수 있는 문제와, PyTorch가 이를 보완하는 방법(loss scaling)을 함께 설명하라.",
      answer: md`
Mixed Precision은 FP32 대신 FP16을 섞어 써서 메모리 사용량을 절반으로 줄이고 전용 연산 회로 덕분에 속도도 높인다. 다만 FP16은 표현 범위가 좁아 작은 기울기 값이 0으로 반올림(underflow)될 수 있는데, 이는 loss scaling(손실값을 키워 계산한 뒤 다시 나누는 기법)으로 보완한다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "PyTorch — Automatic Mixed Precision recipe", url: "https://pytorch.org/tutorials/recipes/recipes/amp_recipe.html", note: "autocast와 GradScaler(loss scaling) 사용법" },
    { title: "Google Colab", url: "https://colab.research.google.com/", note: "무료 GPU로 본문의 PyTorch 코드를 실행: 런타임 유형을 GPU로 바꾸고 `torch.cuda.is_available()` 확인" },
  ],
});
