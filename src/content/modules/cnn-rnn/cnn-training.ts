import { defineLesson, md } from "../../kit";
import exercises from "./labs/cnn-training";

export default defineLesson({
  id: "cnn-training",
  title: "CNN 학습과 이미지 증강",
  tier: "core",
  concepts: ["cnn"],
  goal: "합성곱층 뒤의 BatchNorm2d와 드롭아웃, 가중치 감쇠를 CNN에 적용하고, 라벨을 보존하는 데이터 증강을 데이터의 성질에 맞게 고르며, Colab에서 CIFAR-10 CNN을 학습하고 평가한다.",
  why: "이미지 분류 모델은 파라미터가 많아 학습 데이터에 쉽게 과적합된다. 데이터 증강과 규제를 알맞게 설정해야 처음 보는 이미지에서도 성능이 유지되며, 이 설정은 전이학습([[lesson:transfer-learning]])을 포함한 이미지 모델의 학습 코드에 공통으로 들어간다.",
  body: md`
### CNN에 쓰는 정규화와 규제

CNN은 학습 데이터의 오차를 줄이는 것보다 처음 보는 이미지에서 성능을 유지하는 것(일반화)이 어렵다. 정규화 층과 규제 방법을 CNN에 적용하면 다음과 같다.

| 기법 | CNN에서의 적용 | 주의할 점 |
| --- | --- | --- |
| BatchNorm([[lesson:normalization-layers]]) | \`nn.BatchNorm2d(C)\`: 채널마다 배치·높이·너비의 모든 값으로 평균과 분산을 계산한다 | 평가할 때는 이동평균을 쓴다(\`net.eval()\`) |
| 드롭아웃([[lesson:dropout-residual]]) | 주로 마지막 완전연결층 앞에 둔다 | 평가할 때는 적용하지 않는다(\`net.eval()\`) |
| 가중치 감쇠([[lesson:training-schedules]]) | \`AdamW(..., weight_decay=5e-4)\` | Adam에는 감쇠를 분리한 AdamW를 쓴다 |
| 데이터 증강 | 반전, 크롭, 색 변환으로 학습 이미지를 변형한다 | 라벨이 바뀌지 않는 변환만 쓴다 |
| 조기 종료 | 검증 손실이 가장 낮았던 체크포인트를 쓴다 | 검증 데이터가 필요하다 |

합성곱층의 출력은 (배치, 채널, 높이, 너비) 모양이다. 같은 채널의 값은 모든 위치에서 같은 커널로 계산되므로, \`BatchNorm2d\`는 채널마다 배치·높이·너비의 모든 값으로 평균과 분산을 계산하고 채널마다 $\gamma$, $\beta$를 하나씩 학습한다. 채널마다 평균과 크기가 다른 특성 맵에 적용하면 다음과 같다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
loc = np.array([5.0, -2.0, 100.0]).reshape(1, 3, 1, 1)       # 채널마다 다른 평균
scale = np.array([1.0, 3.0, 10.0]).reshape(1, 3, 1, 1)       # 채널마다 다른 표준편차
x = loc + scale * rng.standard_normal((8, 3, 4, 4))          # (배치 8, 채널 3, 높이 4, 너비 4)

mu = x.mean(axis=(0, 2, 3), keepdims=True)                   # 채널 축을 뺀 나머지 축의 평균, 모양 (1, 3, 1, 1)
var = x.var(axis=(0, 2, 3), keepdims=True)
x_hat = (x - mu) / np.sqrt(var + 1e-5)
print(mu.ravel().round(2), np.sqrt(var).ravel().round(2))    # [ 4.87 -1.64 99.1 ] [ 1.03  2.88 10.04]
print(x_hat.mean(axis=(0, 2, 3)).round(6), x_hat.std(axis=(0, 2, 3)).round(3))   # 채널마다 평균 0, 표준편차 1
\`\`\`

### 데이터 증강

**데이터 증강**(data augmentation)은 학습 이미지에 무작위 변환을 적용해 학습 데이터의 다양성을 늘리는 방법이다. 같은 물체가 조금 다른 위치, 방향, 밝기로 찍혀도 같은 답을 내도록 학습되므로 과적합이 줄어든다. 증강에는 변환한 뒤에도 사람이 같은 라벨을 붙이는 변환만 써야 하며, 어떤 변환이 라벨을 보존하는지는 데이터의 성질에 따라 다르다.

| 데이터 | 라벨을 보존하는 증강 | 라벨을 바꾸거나 분포를 벗어나는 증강 |
| --- | --- | --- |
| 일반 사진(고양이·개) | 좌우 반전, 크롭, 밝기·색 조정 | 상하 반전(실제 사진에 거의 없는 장면) |
| 손글씨 숫자 | 작은 회전과 이동 | 반전(6과 9, 2와 5가 서로 비슷해진다) |
| 교통 표지판 | 크롭, 밝기 조정 | 좌우 반전(좌회전 표지가 우회전 표지가 된다) |
| 흉부 X선 | 작은 회전, 대비 조정 | 좌우 반전(심장의 위치가 바뀐다) |

[[diagram:augmentation-label]]

증강은 학습 데이터에만 적용한다. 평가 데이터는 실제로 들어올 입력을 대표해야 하므로 변형하지 않는다. 평가 데이터에 무작위 크롭이나 반전을 적용하면 같은 이미지의 예측이 실행할 때마다 달라져 성능을 일관되게 측정할 수 없다.

### CIFAR-10 CNN 학습하기

CIFAR-10은 10개 클래스의 $32 \times 32$ 컬러 이미지 6만 장(학습용 5만, 평가용 1만)으로 이루어진 데이터셋이다. 아래 세 코드는 데이터 준비, 모델 정의, 학습 루프이며, \`torch\`와 \`torchvision\`이 필요하므로 [Google Colab](https://colab.research.google.com/)에서 런타임 유형을 GPU로 바꾼 뒤 순서대로 실행한다.

학습용 변환 \`tf_tr\`에는 무작위 크롭(\`RandomCrop\`: 가장자리에 4픽셀씩 0을 채운 뒤 $32 \times 32$ 영역을 무작위 위치에서 잘라낸다)과 좌우 반전(\`RandomHorizontalFlip\`)이 있고, 평가용 변환 \`tf_te\`에는 무작위 변환이 없다. \`T.Normalize(mean, std)\`는 채널마다 평균을 빼고 표준편차로 나누는 표준화다([[lesson:encoding-scaling]]). 평균과 표준편차는 학습 이미지 전체에서 미리 계산한 R, G, B 채널의 값이고, 같은 값을 학습 데이터와 평가 데이터에 모두 쓴다. 평가 데이터로 다시 계산하면 평가 데이터의 정보가 학습 과정에 들어간다(데이터 누수).

\`\`\`python-colab
import torch, torch.nn as nn, torchvision as tv, torchvision.transforms as T

dev = "cuda" if torch.cuda.is_available() else "cpu"
mean, std = (0.49, 0.48, 0.45), (0.25, 0.24, 0.26)          # 학습 이미지로 계산한 채널별 평균과 표준편차
tf_tr = T.Compose([T.RandomCrop(32, padding=4), T.RandomHorizontalFlip(), T.ToTensor(), T.Normalize(mean, std)])
tf_te = T.Compose([T.ToTensor(), T.Normalize(mean, std)])
tr = tv.datasets.CIFAR10("data", train=True, transform=tf_tr, download=True)
te = tv.datasets.CIFAR10("data", train=False, transform=tf_te, download=True)
trl = torch.utils.data.DataLoader(tr, batch_size=128, shuffle=True, num_workers=2)
tel = torch.utils.data.DataLoader(te, batch_size=256)
\`\`\`

모델은 합성곱, BatchNorm, ReLU, Max Pooling으로 이루어진 블록 세 개와 완전연결층으로 구성된다. BatchNorm을 ReLU 앞에 두면 ReLU에 들어가는 값의 평균이 채널마다 0 근처로 맞춰지므로, 입력이 대부분 음수여서 출력이 거의 0인 채널이 생기는 것을 줄인다. 합성곱은 padding 1로 크기를 유지하고 Max Pooling이 블록마다 해상도를 절반으로 줄이므로($32 \to 16 \to 8 \to 4$), 채널이 $32 \to 64 \to 128$로 늘어난 마지막 특성 맵은 $128 \times 4 \times 4$다. 완전연결층 앞에 드롭아웃(0.3)을 두고, 옵티마이저는 가중치 감쇠를 분리한 AdamW를 쓴다.

\`\`\`python-colab
def block(c_in, c_out):
    return nn.Sequential(nn.Conv2d(c_in, c_out, 3, padding=1), nn.BatchNorm2d(c_out), nn.ReLU(), nn.MaxPool2d(2))

net = nn.Sequential(block(3, 32), block(32, 64), block(64, 128), nn.Flatten(),
                    nn.Dropout(0.3), nn.Linear(128 * 4 * 4, 10)).to(dev)
opt = torch.optim.AdamW(net.parameters(), lr=1e-3, weight_decay=5e-4)
\`\`\`

학습 루프는 에폭마다 \`net.train()\`으로 학습 모드를, 평가 전에 \`net.eval()\`로 평가 모드를 설정한다. 학습 모드에서 BatchNorm은 현재 배치의 평균과 분산을 쓰면서 이동평균을 갱신하고, 드롭아웃은 뉴런의 출력을 무작위로 0으로 만든다. 평가 모드에서 BatchNorm은 이동평균을 쓰고 드롭아웃은 적용되지 않는다.

\`\`\`python-colab
for ep in range(10):
    net.train()
    for x, y in trl:
        x, y = x.to(dev), y.to(dev)
        loss = nn.functional.cross_entropy(net(x), y)
        opt.zero_grad(); loss.backward(); opt.step()
    net.eval(); correct = n = 0
    with torch.no_grad():
        for x, y in tel:
            correct += (net(x.to(dev)).argmax(1).cpu() == y).sum().item(); n += len(y)
    print(ep, round(loss.item(), 3), correct / n)
\`\`\`

:::warn eval()을 호출하지 않으면
\`net.eval()\`을 호출하지 않고 평가하면 두 가지 문제가 생긴다. BatchNorm이 평가 배치의 통계로 정규화하므로 배치가 작을수록 통계의 추정 오차가 커지고, 같은 이미지라도 함께 들어온 이미지에 따라 예측이 달라진다. 드롭아웃도 계속 적용되어 같은 입력의 예측이 실행할 때마다 달라진다. 평가 정확도가 실행할 때마다 다르거나 학습 중보다 크게 낮으면 \`net.eval()\` 호출을 먼저 확인한다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "`nn.BatchNorm2d(64)`가 학습하는 파라미터 수와 평균·분산을 계산하는 축으로 옳은 것은?",
      choices: [
        "$\\gamma$, $\\beta$ 각 64개(모두 128개), 채널마다 배치·높이·너비의 모든 값으로 계산한다",
        "$\\gamma$, $\\beta$ 각 1개, 전체 값으로 계산한다",
        "위치마다 64개씩, 배치 축으로만 계산한다",
        "학습하는 파라미터가 없다",
      ],
      answer: 0,
      explanation: "채널마다 $\\gamma$, $\\beta$를 하나씩 학습하므로 128개다. 평균과 분산은 채널마다 (배치, 높이, 너비) 축의 모든 값으로 계산하며, 이동평균과 이동분산은 학습하지 않는 값으로 따로 저장한다.",
    },
    {
      key: "c2",
      question: "손글씨 숫자 데이터에 위아래 뒤집기 증강을 쓰면 안 되는 이유는?",
      choices: ["계산이 너무 느려서", "6이 9처럼 보이는 등 라벨이 바뀔 수 있어서", "이미지 크기가 바뀌어서", "평가 데이터에도 적용해야 해서"],
      answer: 1,
      explanation: "증강에는 라벨을 보존하는 변환만 써야 한다. 어떤 변환이 라벨을 보존하는지는 데이터의 성질에 따라 다르다.",
    },
    {
      key: "c3",
      question: "BatchNorm을 쓰는 모델을 `eval()`로 바꾸지 않고 이미지 몇 장씩 평가하면 생기는 문제는?",
      choices: [
        "평가가 더 정확해진다",
        "작은 배치의 통계로 정규화해, 같은 이미지라도 배치 구성에 따라 예측이 달라진다",
        "파라미터가 초기화된다",
        "아무 차이 없다",
      ],
      answer: 1,
      explanation: "평가할 때는 학습 중에 계산한 이동평균과 이동분산을 써야 한다. `eval()`이 이 전환을 한다.",
    },
    {
      key: "c4",
      question: "좌회전 표지판과 우회전 표지판을 구분하는 모델에 좌우 반전 증강을 쓰면 안 되는 이유는?",
      choices: [
        "반전하면 좌회전 표지가 우회전 표지처럼 보여 라벨이 바뀌기 때문",
        "반전은 계산이 너무 오래 걸려서",
        "표지판 데이터에는 증강이 필요 없어서",
        "반전이 이미지 크기를 바꿔서",
      ],
      answer: 0,
      explanation: "방향 자체가 클래스를 정하는 데이터에서 반전은 다른 클래스의 이미지에 원래 라벨을 붙여 학습하는 것과 같다.",
    },
    {
      key: "c5",
      question: "`T.Normalize(mean, std)`의 `mean`, `std`는 어떤 데이터로 계산해 어디에 쓰는가?",
      choices: [
        "학습 데이터로 계산한 채널별 평균과 표준편차를 학습 데이터와 평가 데이터에 모두 쓴다",
        "평가 데이터로 따로 계산해 평가에만 쓴다",
        "이미지마다 새로 계산한다",
        "항상 0과 1이다",
      ],
      answer: 0,
      explanation: "전처리의 통계는 학습 데이터로만 계산한다는 원칙과 같다([[lesson:encoding-scaling]]). 평가 데이터의 통계를 쓰면 정보가 새고, 이미지마다 다르게 표준화하면 같은 픽셀 값의 의미가 이미지마다 달라진다.",
    },
    {
      key: "c6",
      question: "본문 모델에 $3 \\times 32 \\times 32$ 이미지를 넣으면 세 블록을 지난 특성 맵의 모양(채널, 높이, 너비)은?",
      choices: ["$128 \\times 4 \\times 4$", "$128 \\times 8 \\times 8$", "$32 \\times 4 \\times 4$", "$128 \\times 32 \\times 32$"],
      answer: 0,
      explanation: "합성곱은 padding 1로 크기를 유지하고 Max Pooling이 블록마다 해상도를 절반으로 줄이므로 $32 \\to 16 \\to 8 \\to 4$이고, 마지막 블록의 채널 수는 128이다. 그래서 완전연결층의 입력 크기는 $128 \\times 4 \\times 4 = 2048$이다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "BatchNorm과 드롭아웃을 쓰는 CNN을 평가할 때 `net.eval()`을 호출하지 않으면 생기는 문제를 두 층의 동작으로 쓰라.",
      answer: md`
학습 모드의 BatchNorm은 현재 배치의 평균과 분산으로 정규화한다. 평가할 때도 이 모드를 유지하면 학습 중에 계산한 이동평균 대신 평가 배치의 통계를 쓰므로, 배치가 작을수록 추정 오차가 커지고 같은 이미지라도 함께 들어온 이미지에 따라 예측이 달라진다.

학습 모드의 드롭아웃은 뉴런의 출력을 무작위로 0으로 만든다. 평가할 때도 적용되면 같은 입력의 예측이 실행할 때마다 달라지고, 부분망 하나의 성능만 측정되어 정확도가 낮게 나온다. \`net.eval()\`은 BatchNorm이 이동평균을 쓰고 드롭아웃이 적용되지 않도록 두 층의 동작을 바꾼다.
`,
      keyPoints: [
        "BatchNorm이 이동평균 대신 평가 배치의 통계를 쓴다",
        "같은 이미지라도 배치 구성에 따라 예측이 달라진다",
        "드롭아웃이 계속 적용되어 예측이 실행마다 달라진다",
        "`net.eval()`이 두 층을 평가 모드로 바꾼다",
      ],
    },
    {
      key: "d2",
      question: "손글씨 숫자에 위아래 뒤집기 증강이 잘못된 이유, CIFAR-10에서 좌우 뒤집기는 쓰지만 위아래 뒤집기는 잘 쓰지 않는 이유, 증강을 학습 데이터에만 적용하는 이유를 쓰라.",
      answer: md`
증강은 정답 라벨이 바뀌지 않는 변환이어야 한다. 숫자 6을 위아래로 뒤집으면 9처럼 보여 라벨이 바뀌므로, 잘못된 라벨로 학습하게 된다. CIFAR-10의 비행기, 자동차, 고양이는 좌우가 바뀌어도 같은 물체이지만, 위아래가 뒤집힌 사진은 실제로 거의 나오지 않아 실제 입력의 분포에서 벗어난 데이터를 만든다.

증강은 학습 데이터의 다양성을 늘려 일반화를 돕는 방법이다. 평가 데이터는 실제로 들어올 입력을 대표해야 하므로 변형하지 않고 그대로 써야 성능을 일관되게 측정할 수 있다.
`,
      keyPoints: [
        "증강은 라벨을 보존하는 변환이어야 한다",
        "6과 9처럼 뒤집기가 라벨을 바꿀 수 있다",
        "위아래가 뒤집힌 사진은 실제 입력의 분포에 거의 없다",
        "평가 데이터는 실제 입력을 대표해야 하므로 증강하지 않는다",
      ],
    },
  ],
  references: [
    { title: "PyTorch — Training a Classifier (CIFAR-10)", url: "https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html", note: "본문 CIFAR-10 코드와 같은 흐름의 공식 튜토리얼 (영문)" },
    { title: "Shorten & Khoshgoftaar (2019) — A survey on Image Data Augmentation for Deep Learning", url: "https://journalofbigdata.springeropen.com/articles/10.1186/s40537-019-0197-0", note: "이미지 증강 기법의 정리 (영문)" },
  ],
});
