import { defineLesson, md } from "../../kit";
import exercises from "./labs/pytorch";

export default defineLesson({
  id: "pytorch",
  title: "PyTorch 텐서, 데이터 로더, 학습 루프, GPU",
  tier: "core",
  concepts: ["pytorch"],
  goal: "Tensor, autograd, nn.Module, 옵티마이저, DataLoader가 직접 구현한 자동미분과 경사하강법의 어느 부분을 대신하는지 대응시키고, GPU를 쓰는 학습 루프와 검증 루프를 작성하며, autograd가 계산하는 2층 신경망의 기울기를 NumPy로 직접 구한다.",
  why: "이후의 CNN, RNN, Transformer, LLM 실습은 모두 PyTorch로 작성한다. 학습 루프의 각 줄이 무엇을 계산하는지 알아야 손실이 줄지 않거나 검증 점수가 실행할 때마다 달라질 때 원인을 찾을 수 있다.",
  body: md`
### 직접 구현한 것과 PyTorch의 대응

[[lesson:micrograd]]에서 만든 자동미분 엔진은 스칼라 값 하나마다 계산 그래프의 노드를 만들고, 그래프를 위상정렬의 역순으로 따라가며 기울기를 계산했다. PyTorch 같은 딥러닝 프레임워크도 같은 일을 한다. 차이는 값 하나가 아니라 다차원 배열인 **텐서**(tensor) 단위로 계산하고, GPU에서 병렬로 실행할 수 있다는 점이다. 직접 구현한 부분과 PyTorch의 기능은 다음과 같이 대응한다.

| 직접 구현한 것 | PyTorch |
| --- | --- |
| \`Value.data\` | 텐서의 값 |
| \`Value.grad\` | \`tensor.grad\` |
| \`Value._prev\`, \`_op\`(계산 그래프 기록) | \`tensor.grad_fn\` |
| \`Value.backward()\`의 위상정렬과 역순 실행 | \`loss.backward()\` |
| 손으로 쓴 SGD·Adam 갱신식 | \`optimizer.step()\` |
| 갱신 후 \`grad\`를 0으로 되돌리는 코드 | \`optimizer.zero_grad()\` |

이 사이트의 브라우저 실행 환경(Pyodide)에는 PyTorch가 없으므로, 이 레슨의 PyTorch 코드는 [Google Colab](https://colab.research.google.com/)에서 실행한다. 새 노트북을 만들고 코드를 위에서부터 순서대로 붙여 실행하면 된다.

### 텐서와 autograd

\`torch.Tensor\`는 NumPy의 \`ndarray\`처럼 같은 자료형의 숫자를 다차원 배열로 담으며, 인덱싱·브로드캐스팅·행렬 곱 같은 연산도 거의 같은 방법으로 쓴다. \`torch.from_numpy()\`로 메모리를 복사하지 않고 NumPy 배열을 텐서로 바꿀 수도 있다. 다른 점은 두 가지다. 텐서는 \`.to("cuda")\`로 GPU 메모리에 옮겨 계산할 수 있고, \`requires_grad=True\`로 만든 텐서는 자신에게 적용된 연산을 계산 그래프로 기록한다.

**autograd**는 PyTorch의 자동미분 기능이다. \`requires_grad=True\`인 텐서에 연산을 적용하면 결과 텐서의 \`grad_fn\`에 어떤 연산과 어떤 입력으로 만들어졌는지가 기록된다. Value 클래스의 \`_prev\`, \`_backward\`와 같은 역할이다. \`loss.backward()\`를 호출하면 \`grad_fn\`을 위상정렬의 역순으로 따라가며 연쇄법칙을 적용하고, 직접 만든 파라미터 텐서(리프 텐서)의 \`.grad\`에 $\partial L/\partial \theta$를 채운다. \`.grad\`는 Value의 \`grad\`처럼 \`+=\`로 누적되므로, 스텝마다 \`optimizer.zero_grad()\`로 0으로 되돌려야 한다.

\`\`\`python-colab
import torch

w = torch.tensor(2.0, requires_grad=True)
x = torch.tensor(3.0)
L = (w * x + 1) ** 2          # L = (wx + 1)^2 = 49
L.backward()
print(L.grad_fn)              # <PowBackward0 ...>: L을 만든 연산
print(w.grad)                 # tensor(42.): dL/dw = 2(wx + 1)·x = 2·7·3
\`\`\`

\`\`\`image
src: /images/week3/reverse-mode-autodiff.png
alt: 함수 f(x1, x2) = x1·x2 + sin(x1)의 계산 그래프에서, 출력 쪽에서 입력 쪽으로 각 노드의 국소 미분을 곱해 전달하는 역방향 자동미분 과정을 나타낸 그림
caption: 역방향 자동미분(reverse-mode automatic differentiation)은 f(x1, x2) = x1x2 + sin(x1)의 계산 그래프를 출력(오른쪽)에서 입력(왼쪽) 방향으로 한 번 계산해 연쇄법칙으로 모든 편미분을 얻는다. PyTorch의 loss.backward()가 grad_fn을 따라 수행하는 계산이 이 알고리즘이다.
credit: Berland (en.wikipedia), Public Domain, Wikimedia Commons
width: 960
height: 560
\`\`\`

### nn.Module과 옵티마이저

**nn.Module**은 파라미터를 가진 층과 모델을 정의하는 클래스다. \`__init__\`에서 모델이 가질 층(\`nn.Linear\` 등)을 선언하고, \`forward\`에서 입력이 출력으로 바뀌는 순전파 계산을 정의한다. \`backward\`는 작성하지 않는다. \`forward\` 안의 텐서 연산이 모두 autograd에 기록되므로 \`loss.backward()\`가 모델 안의 모든 파라미터에 대한 기울기를 계산한다.

\`\`\`python-colab
import torch
import torch.nn as nn

class TwoLayerMLP(nn.Module):
    def __init__(self, d_in, d_hidden, d_out):
        super().__init__()                        # nn.Module의 초기화를 먼저 실행한다
        self.fc1 = nn.Linear(d_in, d_hidden)      # 가중치 W1, 편향 b1을 가진 층
        self.fc2 = nn.Linear(d_hidden, d_out)     # 가중치 W2, 편향 b2를 가진 층

    def forward(self, x):                         # 순전파만 정의한다
        h = torch.relu(self.fc1(x))
        return self.fc2(h)

model = TwoLayerMLP(2, 16, 2)                     # h = ReLU(W1 x + b1), 출력 = W2 h + b2
print(sum(p.numel() for p in model.parameters()))   # 82 = (2×16 + 16) + (16×2 + 2)
\`\`\`

**옵티마이저**(\`torch.optim\`)는 [[lesson:optimizers]]에서 계산한 갱신식을 구현한다. \`model.parameters()\`로 모델의 모든 파라미터를 넘기면, \`step()\`을 호출할 때마다 각 파라미터의 \`.grad\`를 읽어 파라미터를 갱신한다. Adam이라면 파라미터마다 1차·2차 모멘트 $m$, $v$를 저장하고 편향 보정까지 계산한다.

\`\`\`python-colab
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, betas=(0.9, 0.999), eps=1e-8)
\`\`\`

### Dataset과 DataLoader

**Dataset**은 \`__len__\`(전체 샘플 수)과 \`__getitem__\`(인덱스에 해당하는 샘플 하나)을 정의하는 클래스이고, **DataLoader**는 Dataset에서 샘플을 가져와 섞고 미니배치로 묶는다. 여러 프로세스로 데이터를 병렬로 읽는 기능(\`num_workers\`)도 제공한다.

\`\`\`python-colab
from torch.utils.data import Dataset, DataLoader
from sklearn.datasets import make_moons

class MoonsDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.long)    # 분류 라벨은 정수형
    def __len__(self):
        return len(self.X)
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

X, y = make_moons(n_samples=1000, noise=0.2, random_state=0)
train_loader = DataLoader(MoonsDataset(X[:800], y[:800]), batch_size=32, shuffle=True)
val_loader = DataLoader(MoonsDataset(X[800:], y[800:]), batch_size=200)
\`\`\`

### 학습 루프와 GPU

학습 루프는 에폭마다 미니배치를 차례로 가져와 순전파, 손실 계산, 기울기 초기화, 역전파, 파라미터 갱신을 반복한다. GPU가 있으면 모델과 미니배치를 같은 장치로 옮긴다. 모델은 처음에 한 번 옮기고, 미니배치는 가져올 때마다 옮긴다. 모델과 입력이 서로 다른 장치에 있으면 오류가 난다.

\`\`\`python-colab
device = "cuda" if torch.cuda.is_available() else "cpu"   # GPU가 있으면 GPU를 쓴다
model = TwoLayerMLP(2, 16, 2).to(device)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-2)
loss_fn = nn.CrossEntropyLoss()

for epoch in range(20):
    model.train()                                   # 학습 모드: 드롭아웃 적용, BatchNorm은 배치 통계 사용
    for xb, yb in train_loader:
        xb, yb = xb.to(device), yb.to(device)
        pred = model(xb)                            # 순전파
        loss = loss_fn(pred, yb)                    # 손실 계산
        optimizer.zero_grad()                       # 이전 스텝의 .grad를 0으로
        loss.backward()                             # 역전파: 모든 파라미터의 .grad를 채운다
        optimizer.step()                            # .grad로 파라미터를 갱신한다

    model.eval()                                    # 평가 모드: 드롭아웃을 끄고, BatchNorm은 이동평균 사용
    with torch.no_grad():                           # 계산 그래프를 기록하지 않는다
        correct = sum((model(xb.to(device)).argmax(1) == yb.to(device)).sum().item() for xb, yb in val_loader)
    print(epoch, round(loss.item(), 4), correct / len(val_loader.dataset))
\`\`\`

[[diagram:training-loop]]

검증 루프에서는 두 가지가 달라진다. \`model.eval()\`은 드롭아웃을 끄고 BatchNorm이 학습 중에 계산한 이동평균을 쓰도록 층의 동작을 바꾼다([[lesson:dropout-residual]], [[lesson:normalization-layers]]). \`torch.no_grad()\`는 그 블록 안에서 계산 그래프를 기록하지 않게 한다. 검증에서는 역전파를 하지 않으므로 그래프를 기록하면 메모리와 계산만 더 든다.

**체크포인트**(checkpoint)는 학습 중 모델의 파라미터를 파일로 저장한 것이다. \`torch.save(model.state_dict(), "ckpt.pt")\`로 저장하고 \`model.load_state_dict(torch.load("ckpt.pt"))\`로 불러온다. 학습이 오래 걸리면 중단에 대비해 주기적으로 저장하고, 검증 성능이 가장 좋았던 시점의 체크포인트를 최종 모델로 쓴다([[lesson:training-schedules]]의 조기 종료).

### 자주 생기는 오류 다섯 가지

PyTorch 코드는 오류 없이 실행되는데 학습 결과가 이상한 경우가 많다. 그런 경우의 원인은 대부분 다음 다섯 가지 중 하나다.

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| 손실이 점점 커지거나 크게 요동친다 | \`optimizer.zero_grad()\`를 빠뜨려 기울기가 누적됨 | 반복마다 \`backward()\` 전에 \`zero_grad()\` |
| 검증 점수가 실행할 때마다 다르고 낮다 | 검증할 때 \`model.eval()\`을 호출하지 않아 드롭아웃이 적용됨 | 검증 전 \`model.eval()\`, 학습 재개 전 \`model.train()\` |
| 회귀 손실이 크고 줄지 않는다 | 예측 \`(N, 1)\`과 정답 \`(N,)\`이 브로드캐스팅되어 \`(N, N)\` 차이가 계산됨 | \`pred.squeeze(1)\` 등으로 모양을 맞춘다 |
| \`cross_entropy\`에서 자료형 오류 | 분류 라벨이 실수형 | 라벨을 정수형(\`torch.long\`)으로 바꾼다 |
| 메모리 사용량이 계속 늘어난다 | 손실 텐서를 리스트에 그대로 모아 계산 그래프가 해제되지 않음 | 기록할 때 \`loss.item()\`으로 숫자만 꺼낸다 |

세 번째 오류는 발견하기 어렵다. 브로드캐스팅 규칙([[lesson:array-indexing]])에 따라 $(N, 1) - (N,)$은 $(N, N)$이 되어, 모든 예측과 모든 정답 사이의 차이를 평균 낸다. 오류 메시지가 나오지 않으므로, 학습 결과가 이상하면 텐서의 모양(\`.shape\`)부터 출력해 확인한다.

[[diagram:broadcast-bug]]
`,
  checks: [
    {
      key: "c1",
      question: "PyTorch 학습 루프의 올바른 순서는?",
      choices: ["step → backward → zero_grad → forward", "forward → loss → zero_grad → backward → step", "backward → forward → step", "zero_grad → step → forward → backward"],
      answer: 1,
      explanation: "기울기를 0으로 초기화한 뒤 backward로 새 기울기를 채우고 step으로 갱신한다. zero_grad는 backward보다 앞이면 된다.",
    },
    {
      key: "c2",
      question: "`nn.Module`을 상속한 클래스에서 `backward` 메서드를 직접 작성하지 않아도 되는 이유는?",
      choices: [
        "PyTorch가 수치미분을 쓰기 때문에",
        "`forward` 안의 텐서 연산이 autograd에 기록되어 `loss.backward()`가 역전파를 수행하기 때문에",
        "backward가 필요 없는 모델만 만들 수 있어서",
        "GPU가 대신 계산해서",
      ],
      answer: 1,
      explanation: "각 연산의 결과 텐서가 `grad_fn`으로 계산 그래프를 기록한다. 직접 구현한 Value 클래스의 `_prev`, `_backward`와 같은 원리다.",
    },
    {
      key: "c3",
      question: "검증 루프에서 `model.eval()`과 `torch.no_grad()`의 역할을 바르게 짝지은 것은?",
      choices: [
        "eval: 계산 그래프 기록 중지 / no_grad: 드롭아웃 끄기",
        "eval: 드롭아웃·BatchNorm을 평가 모드로 / no_grad: 계산 그래프를 기록하지 않아 메모리 절약",
        "둘 다 학습률을 0으로 만든다",
        "둘 다 같은 기능이다",
      ],
      answer: 1,
      explanation: "eval은 층의 동작 방식을 바꾸고, no_grad는 autograd의 기록 여부를 바꾼다. 둘은 서로 다른 설정이므로 검증할 때 함께 쓴다.",
    },
    {
      key: "c4",
      question: "예측 `pred`의 모양이 `(64, 1)`이고 정답 `y`의 모양이 `(64,)`일 때 `((pred - y) ** 2).mean()`의 문제는?",
      choices: [
        "브로드캐스팅으로 `(64, 64)` 차이 행렬이 만들어져 서로 다른 샘플 사이의 차이까지 평균 낸다",
        "오류가 나서 실행이 멈춘다",
        "원하는 MSE가 정확히 계산된다",
        "기울기가 계산되지 않는다",
      ],
      answer: 0,
      explanation: "뒤쪽 축부터 비교하면 1과 64(1인 축이 64로 늘어남), 64와 없음(앞에 1이 붙어 늘어남)이므로 `(64, 64)`가 된다. 오류 없이 잘못된 손실이 계산되므로 모양을 맞춰야 한다.",
    },
    {
      key: "c5",
      question: "학습 중 손실을 기록할 때 `losses.append(loss)` 대신 `losses.append(loss.item())`을 쓰는 이유는?",
      choices: [
        "텐서를 그대로 모으면 계산 그래프가 해제되지 않아 메모리 사용량이 계속 늘어나기 때문",
        "`.item()`이 손실을 더 정확하게 만들기 때문",
        "`.item()`이 역전파를 실행하기 때문",
        "리스트에는 텐서를 넣을 수 없기 때문",
      ],
      answer: 0,
      explanation: "손실 텐서는 자신을 만든 계산 그래프를 참조한다. `.item()`은 파이썬 숫자만 꺼내므로 그래프에 대한 참조가 남지 않는다.",
    },
    {
      key: "c6",
      question: "PyTorch 학습 루프를 `loss.backward()` → `optimizer.zero_grad()` → `optimizer.step()` 순서로 쓰면 어떻게 되는가?",
      choices: [
        "정상이다. 순서는 상관없다",
        "방금 계산한 기울기를 지운 뒤 갱신하므로, 가중치 감쇠 같은 별도 항을 빼면 파라미터가 기울기로는 갱신되지 않는다",
        "기울기가 두 배로 누적된다",
        "다음 스텝에서 오류가 난다",
      ],
      answer: 1,
      explanation: "`zero_grad()`는 `.grad`를 0(또는 None)으로 만든다. 역전파 직후에 지우면 `step()`이 읽을 기울기가 없다. 올바른 순서는 `zero_grad()` → `backward()` → `step()`이고, 이 순서여야 이전 스텝의 기울기가 누적되지도 않는다.",
    },
    {
      key: "c7",
      question: "`model.to(\"cuda\")`로 모델을 GPU에 옮긴 뒤, CPU에 있는 미니배치 `xb`로 `model(xb)`를 호출하면 어떻게 되는가?",
      choices: [
        "모델과 입력이 서로 다른 장치에 있어 오류가 난다",
        "PyTorch가 xb를 GPU로 자동으로 옮겨 계산한다",
        "CPU에서 계산되어 결과만 느려진다",
        "모델이 CPU로 되돌아간다",
      ],
      answer: 0,
      explanation: "한 연산의 입력 텐서는 모두 같은 장치에 있어야 한다. 미니배치를 가져올 때마다 `xb.to(device)`로 모델과 같은 장치에 옮긴다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "PyTorch에서 `loss.backward()`를 호출하면 파라미터의 `.grad`에 어떤 값이 채워지는지 쓰고, `nn.Module`에서 `backward`를 작성하지 않아도 되는 이유와 `optimizer.zero_grad()`를 빠뜨리면 생기는 문제를 직접 구현한 자동미분 엔진과 비교해 쓰라.",
      answer: md`
\`loss.backward()\`는 \`grad_fn\`에 기록된 계산 그래프를 위상정렬의 역순으로 따라가며 연쇄법칙을 적용해, \`requires_grad=True\`인 파라미터 $\theta$의 \`.grad\`에 $\partial L/\partial \theta$를 채운다. 직접 구현한 Value 클래스의 \`grad\` 필드에 담기는 값과 같다. \`nn.Module\`의 \`forward\` 안에서 쓴 텐서 연산은 모두 autograd에 기록되므로, Value 클래스에서 연산마다 \`_backward\`를 정의해 둔 것처럼 역전파에 필요한 정보가 이미 있다. 그래서 \`backward\`를 따로 작성하지 않는다.

\`.grad\`는 Value의 \`grad\`처럼 \`+=\`로 누적된다. \`zero_grad()\`를 빠뜨리면 이전 스텝들의 기울기가 계속 더해져 실제보다 큰 기울기로 갱신되고, 손실이 커지거나 크게 요동친다.
`,
      keyPoints: [
        "`.grad`에는 $\\partial L/\\partial \\theta$가 채워진다(Value의 grad와 같은 값)",
        "forward의 연산이 grad_fn으로 기록되어 backward를 작성할 필요가 없다",
        "`.grad`는 += 로 누적된다",
        "zero_grad를 빠뜨리면 이전 기울기가 더해져 학습이 불안정해진다",
      ],
    },
    {
      key: "d2",
      question: "실습의 2층 신경망 `backward`에서 `dz1 = (dz2 @ W2.T) * (z1 > 0)`의 `* (z1 > 0)`을 지우면 기울기 검사와 학습이 어떻게 되는지 ReLU의 국소 미분으로 쓰라.",
      answer: md`
ReLU의 국소 미분은 입력이 양수이면 1, 음수이면 0이다. 마스크를 지우면 순전파에서 0을 출력해 손실에 영향을 주지 않은 뉴런에도 기울기가 전달되어, $W_1$, $b_1$의 기울기가 실제 기울기와 달라진다. 그래서 수치미분과 비교하는 기울기 검사에서 $W_1$, $b_1$ 항목의 상대오차가 크게 나온다. $W_2$, $b_2$의 기울기는 마스크와 관계없으므로 검사를 통과한다. 틀린 기울기로 학습하면 손실이 덜 줄거나 학습이 불안정해진다.
`,
      keyPoints: [
        "ReLU의 국소 미분은 양수에서 1, 음수에서 0이다",
        "마스크를 지우면 0을 출력한 뉴런에도 기울기가 전달된다",
        "$W_1$, $b_1$의 기울기 검사가 실패한다",
        "$W_2$, $b_2$는 영향을 받지 않는다",
      ],
    },
  ],
  references: [
    { title: "PyTorch Tutorials — Learn the Basics", url: "https://pytorch.org/tutorials/beginner/basics/intro.html", note: "Tensor, Dataset, 모델, autograd, 최적화 순서의 공식 튜토리얼 (영문)" },
    { title: "Dive into Deep Learning (한국어) — 다층 퍼셉트론", url: "https://ko.d2l.ai/chapter_deep-learning-basics/mlp.html", note: "MLP를 처음부터 구현한 뒤 프레임워크로 옮기는 과정 (한국어)" },
  ],
});
