import { defineLesson, md } from "../../kit";
import exercises from "./labs/cnn-training";

export default defineLesson({
  id: "cnn-training",
  title: "CNN 학습과 이미지 증강",
  tier: "core",
  concepts: ["cnn"],
  goal: "BatchNorm·Dropout·Weight Decay·데이터 증강·Early Stopping의 원리와 train/eval 모드 차이를 설명하고, Colab에서 CIFAR-10 CNN을 학습시킬 수 있다.",
  why: "",
  body: md`
지금까지 만든 CNN이 학습 데이터를 잘 맞히는 것까지는 어렵지 않다. 정말 어려운 것은 처음 보는 데이터에도 잘 통하게 만드는 것, 즉 일반화(generalization)다. 이번 단계에서 소개하는 다섯 가지 기법은 전부 "모델이 학습 데이터를 통째로 외워버리지 못하게 방해한다"는 공통점을 가지고 있다.

배치 정규화(BatchNorm)는 한 층에 들어오는 활성화 값을 채널(특징)별로 정규화하는 연산이다. 학습 도중 한 층에 들어오는 값들의 분포가 배치마다 요동치면(이를 internal covariate shift라 부르기도 한다) 뒤쪽 층은 계속 달라지는 입력 분포에 맞춰 적응해야 해서 학습이 불안정해진다는 것이 원 논문의 설명이다. 다만 이후 연구(Santurkar et al., 2018)는 BatchNorm이 이 분포 변화를 크게 줄이지 않고도 손실 지형을 매끄럽게 만들어 큰 학습률을 허용한다는 점이 더 중요하다고 반론했다. 효과는 분명하지만 원인 설명은 아직 논쟁 중이다. BatchNorm(3주차 보충 과정 「정규화 층」 단계에서 자세히 다뤘다)은 매 배치마다 그 배치 안에서 채널별 평균 $\mu$와 표준편차 $\sigma$를 구해 $\hat x = (x-\mu)/\sigma$로 정규화한 다음, $\gamma$(스케일)와 $\beta$(이동)라는 학습 가능한 파라미터로 $\gamma\hat x+\beta$ 형태로 다시 스케일과 위치를 조정한다. 정규화만 하고 끝내지 않고 $\gamma, \beta$를 학습시키는 이유는, 평균 0·표준편차 1인 분포가 모든 층에 항상 최적은 아니기 때문에 최종적으로 어떤 분포를 사용할지를 역전파를 통해 모델이 직접 결정하게 하기 위함이다.

Dropout은 학습 단계에서 각 뉴런의 출력을 확률 $p$로 무작위로 0으로 만들고(끄고), 꺼지지 않은 나머지 뉴런의 출력은 $1/(1-p)$만큼 키워 보정하는 연산이다(inverted dropout). 이렇게 학습 때 미리 보정해두면 각 뉴런 출력의 기댓값이 끄기 전과 같아지므로, 평가 때는 아무 보정 없이 모든 뉴런을 그대로 쓰면 된다. 특정 뉴런이 다음 순전파에서도 계속 켜져 있으리라는 보장이 없으므로, 다른 특정 뉴런의 출력에만 강하게 의존하는 가중치 조합(co-adaptation)은 학습 과정에서 살아남기 어렵고, 그 결과 각 뉴런이 비교적 독립적으로도 유의미한 패턴을 검출하도록 가중치가 여러 뉴런에 걸쳐 중복 학습된다. 매 순전파마다 서로 다른 뉴런 부분집합만 활성화된 부분망(sub-network)이 학습되는 셈이므로, 평가 시 전체 뉴런을 켜고 사용하는 것은 학습 중 만들어진 이 다수의 부분망들의 예측을 근사적으로 평균 낸 것과 같은 효과를 낸다(모델 앙상블 근사).

말로 설명한 두 공식(BatchNorm의 $\hat x = (x-\mu)/\sigma$, $\gamma\hat x+\beta$와 Dropout의 "끄고 $1/(1-p)$로 보정")을 아주 작은 숫자 배열에 직접 적용해서 눈으로 확인해보자. 먼저 BatchNorm이다. 배치 크기 4, 채널 3개짜리 활성화 값이 있다고 하자(행이 배치, 열이 채널).

\`\`\`python
import numpy as np

x = np.array([
    [10.0, 1.0, 100.0],
    [12.0, 3.0, 120.0],
    [ 8.0, -1.0, 90.0],
    [14.0, 5.0, 130.0],
])
print("입력 x의 shape:", x.shape, "-> (배치=4, 채널=3)")

mu = x.mean(axis=0)     # axis=0: 배치 방향(세로)으로 평균 -> 채널별 평균 하나씩
sigma = x.std(axis=0)   # axis=0: 배치 방향으로 표준편차 -> 채널별 표준편차
print("채널별 평균 mu:", mu)
print("채널별 표준편차 sigma:", sigma)

x_hat = (x - mu) / sigma   # 각 채널을 자기 평균·표준편차로 정규화
print("\n정규화 결과 x_hat:\n", x_hat)
print("정규화 후 채널별 평균:", x_hat.mean(axis=0).round(6))     # -> 0에 가까워야 한다
print("정규화 후 채널별 표준편차:", x_hat.std(axis=0).round(6))  # -> 1에 가까워야 한다

gamma = np.array([1.0, 2.0, 0.5])   # 채널마다 다른 스케일
beta = np.array([0.0, 1.0, -1.0])   # 채널마다 다른 이동
y = gamma * x_hat + beta
print("\ngamma*x_hat+beta 결과:\n", y)
\`\`\`

세 번째 채널(100, 120, 90, 130)은 원래 값 자체가 크고 퍼져 있었지만, \`x_hat\`으로 정규화하고 나면 세 채널 모두 평균 0, 표준편차 1인 같은 눈금 위에 놓인다. 그 뒤에 \`gamma\`, \`beta\`를 곱하고 더해 다시 채널마다 다른 스케일·위치로 되돌리는데, 이 \`gamma\`, \`beta\`가 바로 역전파로 학습되는 값이다. 이제 Dropout도 직접 만들어보자.

\`\`\`python
import numpy as np

np.random.seed(0)   # 항상 같은 난수가 나오도록 씨앗값 고정(재현성)
p = 0.5              # 뉴런을 끌 확률
h = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])  # 어떤 층의 출력(뉴런 6개)

mask = (np.random.rand(*h.shape) > p).astype(float)  # p보다 크면 1(생존), 작으면 0(제거)
print("dropout mask:", mask)

h_dropped = h * mask / (1 - p)   # 꺼진 자리는 0, 살아남은 자리는 1/(1-p)배로 보정
print("dropout 적용 후:", h_dropped)
\`\`\`

\`np.random.rand(*h.shape)\`는 0~1 사이의 난수를 \`h\`와 같은 shape으로 만들어내고, \`> p\` 비교를 거치면 참(1)·거짓(0)으로 이루어진 \`mask\`가 된다. \`h * mask\`로 꺼질 자리를 0으로 만든 다음 \`/ (1-p)\`로 살아남은 값들을 키워서 평균적인 크기를 학습 전과 비슷하게 맞춰주는 것이 inverted dropout의 핵심이다. \`p=0.5\`이므로 대략 절반의 뉴런이 꺼지고, 살아남은 뉴런은 2배로 보정된다.

[[diagram:batchnorm-dropout]]

| 기법 | 원리 | 주의 |
| --- | --- | --- |
| BatchNorm | 배치 통계로 정규화 후 $\gamma, \beta$ 학습 → 학습 안정·속도 향상 | train/eval 모드 차이(running mean) |
| Dropout | 학습 시 뉴런 무작위 제거 $\to$ 앙상블 효과 | eval에서 끄기 |
| Weight Decay | L2 페널티 | AdamW에서는 분리형 사용 |
| 데이터 증강 | 뒤집기·크롭·컬러지터로 데이터 다양화 | 라벨 보존 변환만 |
| Early Stopping | 검증 손실 상승 시 중단 | 검증셋 필요 |

표에서 특히 주의할 항목은 BatchNorm과 Dropout의 "주의" 칸이다. 두 기법 모두 학습(train) 때와 평가(eval) 때 서로 다르게 동작하도록 설계되어 있다. BatchNorm은 학습 중에는 그때그때의 배치 통계를 쓰지만, 평가할 때는 배치 하나(심지어 이미지 한 장)에 대해서도 안정적인 결과를 내야 하므로 학습 내내 누적해온 이동평균(running mean, running variance)을 사용한다. Dropout은 평가 때 뉴런을 끄지 않고 전부 사용한다(inverted dropout은 학습 때 이미 $1/(1-p)$로 보정했으므로 평가 때는 추가 보정이 없다). 파이토치에서는 이 전환이 \`net.train()\`과 \`net.eval()\` 호출 하나로 자동 처리되는데, 이것을 깜빡하면 어떤 일이 벌어지는지는 적용과 복습의 코딩 실습에서 직접 확인할 수 있다.

먼저 데이터를 준비하는 부분이다. 학습용 변환(tf_tr)에는 RandomCrop과 RandomHorizontalFlip이라는 데이터 증강이 들어가 있는 반면, 평가용 변환(tf_te)에는 이런 무작위 변형이 전혀 없다는 점을 눈여겨보자. 증강은 모델이 "같은 물체를 여러 각도·위치에서 봐도 같은 답을 내야 한다"는 것을 배우게 하려는 장치이므로 학습 데이터에만 적용하고, 실력을 재는 평가 데이터는 있는 그대로 정직하게 채점해야 한다. 만약 평가 데이터에도 크롭이나 뒤집기를 적용한다면 매번 답이 흔들려서 모델의 실제 성능을 잴 수 없게 된다.

어떤 증강이 "라벨 보존 변환"인지는 데이터마다 다르다. 증강을 고를 때는 "이 변환을 해도 사람이 같은 라벨을 붙이는가?"를 물으면 된다.

| 데이터 | 안전한 증강 | 위험한 증강과 이유 |
| --- | --- | --- |
| 일반 사진(고양이·개) | 좌우 반전, 크롭, 밝기·색 조정 | 상하 반전(현실에 거의 없는 장면) |
| 손글씨 숫자 | 약간의 회전·이동 | 반전(6과 9, 2와 5가 섞인다) |
| 교통 표지판 | 크롭, 밝기 조정 | 좌우 반전("좌회전" 표지가 "우회전"이 된다) |
| 흉부 X선 | 작은 회전, 대비 조정 | 좌우 반전(심장은 왼쪽에 있다) |

[[diagram:augmentation-label]]

코드의 \`T.Normalize((0.49, 0.48, 0.45), (0.25, 0.24, 0.26))\`는 채널별로 평균을 빼고 표준편차로 나누는 2주차의 Z-score 표준화다. 괄호 안의 숫자는 훈련 이미지 전체에서 미리 계산한 R·G·B 채널의 평균과 표준편차이고, 같은 값을 훈련·평가 데이터 모두에 쓴다(평가 데이터로 다시 계산하면 누수다).

아래 데이터 준비·모델 정의·학습 루프 세 코드는 실제 CIFAR-10 데이터셋을 인터넷에서 내려받고 \`torch\`·\`torchvision\`으로 실제 CNN을 학습시키는 코드다. 이 사이트의 브라우저 실행 환경에는 \`torch\`·\`torchvision\`이 없어 여기서는 실행되지 않는다. [Google Colab](https://colab.research.google.com/)에서 런타임 유형을 GPU로 바꾼 뒤 붙여넣어 실행하자.

\`\`\`python-colab
import torch, torch.nn as nn, torchvision as tv, torchvision.transforms as T
dev = "cuda" if torch.cuda.is_available() else "cpu"
tf_tr = T.Compose([T.RandomCrop(32, padding=4), T.RandomHorizontalFlip(), T.ToTensor(),
                   T.Normalize((0.49,0.48,0.45),(0.25,0.24,0.26))])
tf_te = T.Compose([T.ToTensor(), T.Normalize((0.49,0.48,0.45),(0.25,0.24,0.26))])
tr = tv.datasets.CIFAR10("data", True,  tf_tr, download=True)
te = tv.datasets.CIFAR10("data", False, tf_te, download=True)
trl = torch.utils.data.DataLoader(tr, 128, shuffle=True, num_workers=2)
tel = torch.utils.data.DataLoader(te, 256)
\`\`\`

다음은 모델 구조다. \`block\` 함수 하나가 $\text{conv} \to \text{BatchNorm} \to \text{ReLU} \to \text{MaxPool}$ 순서로 쌓여 있는데, 이 순서 자체가 의미를 담고 있다. BatchNorm은 합성곱이 막 내놓은, 아직 활성화를 통과하기 전의 "날것" 값들의 분포를 정규화해서 평균 0, 분산 1 근처로 맞춰주는 역할을 한다. 이 정규화를 ReLU보다 먼저 적용하는 이유는, ReLU가 0보다 작은 값을 전부 0으로 뭉개버리는 함수이기 때문이다. 만약 정규화되지 않은 값 분포가 한쪽으로 심하게 치우쳐 있다면(예컨대 대부분 음수라면) ReLU를 통과하는 순간 뉴런 대부분이 비활성화될 위험이 있다. BatchNorm이 먼저 분포를 가지런히 정리해준 다음 ReLU에 넘겨야, ReLU가 "살아 있는 값"과 "죽이는 값"을 균형 있게 골라낼 수 있다. 그리고 맨 마지막 Flatten 이후에 Dropout(0.3)을 넣어, 완전연결층으로 넘어가기 직전에 과적합을 한 번 더 억제한다. (이 코드도 바로 위 셀에서 정의한 \`dev\`를 그대로 쓰는 이어지는 코드이므로 위 셀과 마찬가지로 Colab에서만 실행된다.)

\`\`\`python-colab
def block(i, o): return nn.Sequential(nn.Conv2d(i,o,3,padding=1), nn.BatchNorm2d(o), nn.ReLU(), nn.MaxPool2d(2))
net = nn.Sequential(block(3,32), block(32,64), block(64,128), nn.Flatten(),
                    nn.Dropout(0.3), nn.Linear(128*4*4, 10)).to(dev)
opt = torch.optim.AdamW(net.parameters(), 1e-3, weight_decay=5e-4)
\`\`\`

학습 루프에서 가장 먼저 나오는 \`net.train()\`과, 평가 직전의 \`net.eval()\`을 놓치지 말자. 이 두 줄이 하는 일은 위에서 설명한 BatchNorm·Dropout의 학습/평가 모드 전환 그 자체다. \`train()\` 모드에서는 BatchNorm이 지금 들어온 배치의 평균·분산을 쓰면서 동시에 그 값을 누적 이동평균(running mean/var)에 계속 반영하고, Dropout은 실제로 일부 뉴런을 꺼버린다. \`eval()\` 모드로 바뀌면 BatchNorm은 학습 내내 누적해온 이동평균을 그대로 사용하고, Dropout은 아무것도 끄지 않는다. 이 학습 루프 역시 위 두 셀의 \`trl\`, \`tel\`, \`net\`, \`opt\`를 이어받아 실행되는 Colab 전용 코드다.

\`\`\`python-colab
for ep in range(10):
    net.train()
    for x, y in trl:
        x, y = x.to(dev), y.to(dev)
        loss = nn.functional.cross_entropy(net(x), y)
        opt.zero_grad(); loss.backward(); opt.step()
    net.eval(); ok = n = 0
    with torch.no_grad():
        for x, y in tel:
            ok += (net(x.to(dev)).argmax(1).cpu() == y).sum().item(); n += len(y)
    print(ep, loss.item(), ok / n)
\`\`\`

:::warn eval()을 빼먹으면 생기는 일
\`net.eval()\`을 부르지 않고 그대로 평가하면 두 가지 문제가 동시에 생긴다. 첫째, BatchNorm이 테스트 배치(심지어 이미지 한 장짜리 배치)의 통계로 정규화를 시도하면서 배치 크기가 작을수록 평균·분산 추정이 불안정해지고, 같은 이미지를 넣어도 배치 구성에 따라 다른 예측이 나올 수 있다. 둘째, Dropout이 여전히 뉴런을 무작위로 꺼버리므로 같은 입력을 두 번 넣어도 답이 달라지는, 재현 불가능한 모델이 된다. 정확도가 이상하게 들쭉날쭉하거나 학습 때보다 뚜렷이 낮게 나온다면, 가장 먼저 \`net.eval()\`을 잊지 않았는지 확인하는 습관을 들이자.
:::
`,
  checks: [
    {
      key: "c1",
      question: "inverted dropout($p = 0.5$)에 대한 설명으로 옳은 것은?",
      choices: ["평가 때 출력에 0.5를 곱한다", "학습 때 살아남은 뉴런을 2배로 키워, 평가 때는 보정 없이 모든 뉴런을 쓴다", "평가 때도 뉴런의 절반을 끈다", "학습 때 모든 뉴런을 켠다"],
      answer: 1,
      explanation: "학습 때 $1/(1-p)$로 미리 보정해 기댓값을 맞춰두므로, 평가 때는 아무것도 하지 않아도 된다.",
    },
    {
      key: "c2",
      question: "숫자 손글씨 데이터에 \"위아래 뒤집기\" 증강을 쓰면 안 되는 이유는?",
      choices: ["계산이 너무 느려서", "6이 9처럼 보이는 등 라벨을 바꿔버릴 수 있어서", "이미지 크기가 바뀌어서", "평가 데이터에도 적용해야 해서"],
      answer: 1,
      explanation: "증강은 라벨이 보존되는 변환만 써야 한다. 무엇이 라벨 보존인지는 데이터의 성질에 따라 다르다.",
    },
    {
      key: "c3",
      question: "BatchNorm 모델을 `eval()`로 바꾸지 않고 한 장씩 평가하면 생기는 문제는?",
      choices: ["평가가 더 정확해진다", "배치 통계가 불안정해 같은 이미지라도 배치 구성에 따라 예측이 흔들린다", "파라미터가 초기화된다", "아무 차이 없다"],
      answer: 1,
      explanation: "평가 때는 학습 중 모아둔 이동평균(running mean/var)을 써야 한다.",
    },
    {
      key: "c4",
      question: "\"좌회전\", \"우회전\" 표지판을 구분하는 모델에 좌우 반전 증강을 쓰면 안 되는 이유는?",
      choices: ["반전하면 좌회전 표지가 우회전처럼 보여 라벨이 바뀌기 때문", "반전은 계산이 너무 오래 걸려서", "표지판 데이터에는 증강이 필요 없어서", "반전이 이미지 크기를 바꿔서"],
      answer: 0,
      explanation: "증강은 라벨을 보존하는 변환만 써야 한다. 방향 자체가 의미인 데이터에서 반전은 다른 클래스의 이미지를 같은 라벨로 학습시키는 셈이다.",
    },
    {
      key: "c5",
      question: "`T.Normalize(mean, std)`의 `mean`, `std`는 어떤 데이터로 계산해 어디에 쓰는가?",
      choices: ["훈련 데이터로 계산한 채널별 평균·표준편차를 훈련·평가 데이터 모두에 쓴다", "평가 데이터로 따로 계산해 평가에만 쓴다", "이미지마다 새로 계산한다", "항상 0과 1이다"],
      answer: 0,
      explanation: "2주차의 \"훈련 데이터로만 fit\" 원칙과 같다. 평가 데이터의 통계를 쓰면 정보가 새고, 이미지마다 다르게 정규화하면 같은 픽셀 값의 의미가 달라진다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "BatchNorm을 사용하는 모델을 eval()로 바꾸지 않으면 생기는 일은?",
      answer: md`
평가 때도 저장된 running 통계 대신 현재 배치의 통계로 정규화하므로, 같은 입력이라도 함께 들어온 배치에 따라 예측이 달라지고 불안정해진다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "Dropout이 학습 때만 뉴런을 끄고 평가 때는 전부 켜는 이유를 앙상블 관점에서 설명하라.",
      answer: md`
학습 때 매번 다른 부분망을 학습시키는 것은 사실상 매우 많은 작은 모델을 동시에 학습시키는 것과 같다. 평가 때 전체 뉴런을 다 켜서 쓰면, 그 수많은 부분망들의 예측을 평균 낸 앙상블처럼 동작하므로 평가 때는 모두 켜는 것이 유리하다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "손글씨 숫자에 '위아래 뒤집기' 증강이 잘못된 이유, CIFAR-10에서 '좌우 뒤집기'는 괜찮지만 '위아래 뒤집기'는 잘 쓰지 않는 이유, 그리고 증강을 훈련 데이터에만 적용해야 하는 이유를 함께 설명하십시오.",
      answer: md`
증강은 정답 레이블이 바뀌지 않는 변환이어야 합니다. 숫자 6을 위아래로 뒤집으면 9처럼 보여 레이블이 바뀌므로, 모델에게 틀린 정답을 가르치게 됩니다. CIFAR-10의 비행기·자동차·고양이는 좌우가 바뀌어도 같은 물체이지만, 위아래가 뒤집힌 사진은 현실에서 거의 나오지 않아 실제 분포와 동떨어진 데이터를 만들게 됩니다. 증강은 훈련 데이터의 다양성을 늘려 일반화를 돕는 장치이고, 평가 데이터는 실제로 들어올 입력을 대표해야 하므로 변형하지 않고 그대로 써야 성능을 정직하게 잴 수 있습니다.
`,
      keyPoints: ["증강은 레이블을 보존하는 변환이어야 한다", "6 ↔ 9처럼 뒤집기가 레이블을 바꾼다", "위아래 뒤집힌 사진은 실제 분포에 없다", "평가 데이터는 실제 입력을 대표해야 하므로 증강하지 않는다"],
    },
  ],
  references: [
    { title: "Srivastava et al. (2014) — Dropout", url: "https://jmlr.org/papers/v15/srivastava14a.html", note: "Dropout 원 논문: 부분망 앙상블 해석" },
    { title: "PyTorch — Training a Classifier (CIFAR-10)", url: "https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html", note: "본문 CIFAR-10 코드와 같은 흐름의 공식 튜토리얼" },
  ],
});
