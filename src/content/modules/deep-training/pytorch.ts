import { defineLesson, md } from "../../kit";
import exercises from "./labs/pytorch";

export default defineLesson({
  id: "pytorch",
  title: "PyTorch 텐서, 데이터 로더, 학습 루프, GPU",
  tier: "core",
  concepts: ["pytorch"],
  goal: "Tensor·Autograd·nn.Module·Optimizer·Dataset·학습 루프가 손으로 구현한 역전파·경사하강법의 어느 부분을 대신하는지 대응시키고, NumPy로 2층 신경망을 끝까지 학습시킬 수 있다.",
  why: "",
  body: md`
앞서 우리는 Value라는 아주 작은 자동미분 엔진을 직접 만들어, 계산 그래프를 만들고 그 그래프를 거슬러 올라가며 기울기를 계산하는 과정을 한 줄씩 눈으로 확인했다. PyTorch 같은 딥러닝 프레임워크가 실전에서 하는 일은 정확히 이것과 같다. 다만 숫자 하나(스칼라)가 아니라 수백만 개의 숫자를 담은 텐서(tensor) 단위로, 그것도 CPU가 아닌 GPU에서 대량 병렬로 처리한다는 점이 다를 뿐이다. 이 단계에서는 우리가 직접 작성한 코드의 각 부분이 PyTorch의 어떤 개념에 대응하는지 하나씩 짝지어본다.

- **Tensor**: PyTorch의 \`torch.Tensor\`는 NumPy의 \`ndarray\`와 데이터 구조 자체는 동일하다. 둘 다 같은 타입의 숫자를 다차원 배열로 담고, 인덱싱·브로드캐스팅·행렬 곱 같은 연산도 거의 그대로 대응된다(실제로 \`torch.from_numpy()\`로 메모리 복사 없이 서로 변환할 수 있다). 다른 점은 두 가지다. 첫째, 텐서는 \`.to("cuda")\`로 GPU 메모리로 옮겨 대량 병렬 연산을 시킬 수 있지만 NumPy 배열은 CPU에서만 동작한다. 둘째, 텐서는 \`requires_grad=True\`를 켜면 자신이 어떤 연산을 거쳐 만들어졌는지 계산 그래프를 계속 기록해 나중에 역전파에 쓸 수 있지만, NumPy 배열에는 이런 기록 기능이 아예 없다.

- **Autograd**: \`requires_grad=True\`인 텐서에 연산을 적용할 때마다, PyTorch는 앞서 만든 Value가 \`_prev\`와 \`_backward\`를 저장했던 것과 똑같이 결과 텐서에 \`grad_fn\`이라는 이름으로 "이 텐서가 어떤 연산과 어떤 입력들로부터 만들어졌는지"를 기록한다. \`loss.backward()\`를 호출하면 이 grad_fn들을 따라 위상정렬의 역순으로 그래프를 순회하며 연쇄법칙을 적용하는데, 이것이 정확히 우리가 만든 \`Value.backward()\`가 topo 리스트를 뒤집어 순회하며 \`_backward()\`를 실행하던 것과 동일한 알고리즘이다. 계산이 끝나면 각 리프(leaf) 텐서, 즉 \`requires_grad=True\`로 직접 만든 파라미터 텐서의 \`.grad\` 속성에 $\partial L/\partial\theta$가 채워진다(앞서 살펴본 Value의 \`.grad\` 필드와 완전히 같은 역할). \`optimizer.step()\`은 이렇게 채워진 \`.grad\`를 읽어 「최적화기」 단계의 갱신식(SGD, Adam)대로 파라미터를 갱신하고, \`optimizer.zero_grad()\`는 \`+=\`로 누적되는 성질(앞서 :::info 참고) 때문에 다음 스텝을 위해 \`.grad\`를 0으로 되돌리는 역할을 한다.

\`\`\`image
src: /images/week3/reverse-mode-autodiff.png
alt: 함수 f(x1,x2)=x1*x2+sin(x1)의 계산 그래프를 손실 쪽에서 입력 쪽으로 거슬러 올라가며 각 노드의 국소 미분을 곱해 전달하는 역방향 자동미분 과정을 보여주는 다이어그램
caption: 역방향 자동미분(reverse-mode automatic differentiation): f(x1,x2)=x1x2+sin(x1)의 계산 그래프를 출력(오른쪽)에서 입력(왼쪽) 방향으로 한 번만 훑으면서 연쇄법칙으로 모든 편미분을 동시에 얻는다. PyTorch의 loss.backward()가 grad_fn을 따라 수행하는 것이 바로 이 알고리즘이다.
credit: Berland (en.wikipedia), Public Domain, Wikimedia Commons
width: 960
height: 560
\`\`\`

- **nn.Module**: 파라미터를 가진 레이어(예: Wx+b를 계산하는 완전연결층)를 재사용 가능한 단위로 묶는 클래스다. \`__init__\`에서 그 층이 가질 파라미터(가중치, 편향)를 \`nn.Linear\`, \`nn.Conv2d\` 같은 하위 모듈로 선언하고, \`forward\`에서는 입력이 그 파라미터들을 거쳐 출력으로 바뀌는 순전파 계산만 정의한다. 신기하게도 backward는 따로 작성하지 않는다. forward 안에서 사용한 텐서 연산 하나하나가 이미 autograd에 기록되므로, \`loss.backward()\`를 부르는 순간 이 모듈 내부의 모든 파라미터에 대한 기울기가 자동으로 계산된다. 아래 코드부터는 실제 \`torch\` 라이브러리를 사용하는데, 이 사이트의 실행 환경(Pyodide)에는 torch가 없어 브라우저에서는 실행되지 않는다. 코드를 눈으로 따라 읽으며 구조를 이해하고, 직접 돌려보고 싶다면 [Google Colab](https://colab.research.google.com/)에 새 노트북을 만들어 붙여넣어 실행하자.

\`\`\`python-colab
import torch, torch.nn as nn

class TwoLayerMLP(nn.Module):
    def __init__(self, d_in, d_hidden, d_out):
        super().__init__()                          # nn.Module의 초기화를 먼저 실행(필수)
        self.fc1 = nn.Linear(d_in, d_hidden)         # 층 하나 = 학습 가능한 W1, b1을 가진 객체
        self.fc2 = nn.Linear(d_hidden, d_out)        # 층 둘 = 학습 가능한 W2, b2를 가진 객체

    def forward(self, x):                            # 순전파만 정의. backward는 autograd가 알아서 함
        h = torch.relu(self.fc1(x))
        return self.fc2(h)

model = TwoLayerMLP(3, 4, 1)   # 「뉴런과 MLP」 단계의 h=φ(W1x+b1), ŷ=W2h+b2 를 그대로 객체로 만든 것
\`\`\`

- **Optimizer (torch.optim)**: 「최적화기」 단계에서 손으로 유도한 Adam의 갱신식($m_t, v_t$의 지수이동평균과 편향 보정, $\theta \leftarrow \theta - \eta\,\hat m_t/(\sqrt{\hat v_t}+\epsilon)$까지 전부)을 한 줄로 대신해주는 것이 \`torch.optim.Adam\`이다(이 블록도 위 \`model\`이 이미 만들어져 있다고 가정한 이어지는 코드이며, 마찬가지로 브라우저에서는 실행되지 않는다. Colab에서는 위 블록 뒤에 이어 붙이면 된다).

\`\`\`python-colab
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, betas=(0.9, 0.999), eps=1e-8)
\`\`\`

\`model.parameters()\`가 \`__init__\`에서 선언한 모든 층의 파라미터를 하나로 모아 넘겨주고, 옵티마이저는 매 \`step()\`마다 각 파라미터의 \`.grad\`를 읽어 자신이 관리하는 $m, v$ 버퍼를 갱신한 뒤 파라미터 값을 직접 수정한다.

- **Dataset / DataLoader**: 학습 데이터를 미니배치 단위로 잘라 순전파에 넣어주는 역할을 담당한다. \`Dataset\`은 \`__len__\`(전체 샘플 개수)과 \`__getitem__\`(인덱스로 샘플 하나를 꺼내는 방법)이라는 두 메서드만 정의하면 되는 간단한 인터페이스이고, \`DataLoader\`가 그 위에서 셔플·배치 묶기·병렬 로딩을 대신해준다. 이 코드 역시 브라우저에서는 실행되지 않는 참고용 코드다(Colab에서 X, y를 직접 정의한 뒤 실행해보라).

\`\`\`python-colab
from torch.utils.data import Dataset, DataLoader

class MoonsDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y)
    def __len__(self):                    # DataLoader가 "전체 샘플이 몇 개인지" 물어볼 때 답하는 메서드
        return len(self.X)
    def __getitem__(self, idx):           # DataLoader가 "idx번째 샘플을 달라"고 할 때 답하는 메서드
        return self.X[idx], self.y[idx]

loader = DataLoader(MoonsDataset(X, y), batch_size=32, shuffle=True)
\`\`\`

- **Training / Validation Loop**: 표준적인 학습 루프는 "에폭을 반복 $\to$ 그 안에서 배치를 반복 $\to$ 순전파(forward) $\to$ 손실 계산(loss) $\to$ 역전파(backward) $\to$ 파라미터 갱신(step) $\to$ 기울기 초기화(zero_grad)"라는 여섯 단계를 그대로 되풀이하는 구조다. 아래도 같은 이유로 브라우저에서는 실행되지 않는다.

\`\`\`python-colab
for epoch in range(num_epochs):
    model.train()                          # 학습 모드: BatchNorm이 이번 배치 통계를 사용
    for xb, yb in train_loader:
        pred = model(xb)                   # 순전파
        loss = loss_fn(pred, yb)           # 손실 계산
        optimizer.zero_grad()              # 이전 스텝의 .grad를 0으로 리셋(안 하면 +=로 누적됨)
        loss.backward()                    # 역전파: 모든 파라미터의 .grad를 채움
        optimizer.step()                   # .grad를 읽어 파라미터를 실제로 갱신

    model.eval()                           # 평가 모드: BatchNorm이 누적해둔 이동평균을 사용
    with torch.no_grad():                  # 이 블록 안에서는 계산 그래프를 기록하지 않음(메모리 절약)
        val_loss = sum(loss_fn(model(xb), yb).item() for xb, yb in val_loader)
    print(epoch, val_loss)
\`\`\`

[[diagram:training-loop]]

검증(validation) 루프에서는 두 가지가 달라진다. \`model.eval()\`은 드롭아웃을 끄고 BatchNorm이 미니배치 통계 대신 학습 중 누적해온 이동평균을 쓰도록 모드를 바꾸고(드롭아웃과 BatchNorm은 보충 과정에서 다룬다), \`torch.no_grad()\`는 이 블록 안에서는 계산 그래프를 아예 기록하지 않도록 지시한다. 검증 시점에는 backward를 부를 일이 없으므로 그래프를 기록해봐야 메모리와 연산만 낭비되기 때문이다.

- **Checkpoint**: \`torch.save(model.state_dict(), "ckpt.pt")\`로 그 시점의 모든 파라미터 값을 파일로 저장하고, \`model.load_state_dict(torch.load("ckpt.pt"))\`로 복원한다. 학습이 길게는 며칠씩 걸리는 큰 모델에서는 중간에 서버가 죽거나 재시작해야 할 때를 대비해 정기적으로 체크포인트를 저장해두고, 검증 손실이 가장 낮았던 시점의 체크포인트를 따로 보관해두면 마지막 에폭이 아니라 "가장 성능이 좋았던 순간"의 모델을 최종 결과물로 쓸 수 있다.

이 대응 관계를 표로 한 번에 정리하면 다음과 같다.

| 우리가 앞서 손으로 짠 것 | PyTorch가 대신 해주는 것 |
| --- | --- |
| Value.data | tensor의 값 |
| Value.grad | tensor.grad |
| Value._prev, _op | tensor.grad_fn (계산 그래프 기록) |
| Value.backward()의 topo 정렬 + 역순회 | loss.backward() |
| 「최적화기」 단계에서 손으로 쓴 Adam 갱신식 | torch.optim.Adam.step() |
| 갱신 후 grad를 0으로 되돌리는 코드 | optimizer.zero_grad() |

### 초보자가 가장 자주 만나는 버그 다섯 가지

PyTorch 코드는 오류 없이 실행되는데 학습이 이상한 경우가 많다. 그런 "조용한 버그"의 대부분은 다음 다섯 가지다.

| 증상 | 원인 | 고치는 법 |
| --- | --- | --- |
| 손실이 점점 커지거나 요동친다 | \`optimizer.zero_grad()\`를 빠뜨려 기울기가 누적됨 | 매 반복 \`backward()\` 전에 \`zero_grad()\` |
| 검증 점수가 실행할 때마다 다르고 낮다 | 검증 때 \`model.eval()\`을 안 해 드롭아웃이 켜져 있음 | 검증 전 \`model.eval()\`, 학습 재개 전 \`model.train()\` |
| 회귀 손실이 이상하게 크고 줄지 않는다 | 예측 \`(N, 1)\`과 정답 \`(N,)\`의 브로드캐스팅으로 \`(N, N)\` 차이가 계산됨 | 둘의 shape을 \`pred.squeeze(1)\` 등으로 맞춘다 |
| \`cross_entropy\`에서 dtype 오류 | 분류 레이블이 실수형 | 레이블을 정수형(\`torch.long\`)으로 |
| 메모리가 계속 늘어난다 | 손실 텐서를 그대로 리스트에 모아 그래프가 계속 살아 있음 | 기록할 때 \`loss.item()\`으로 숫자만 꺼낸다 |

세 번째가 특히 고약하다. 1주차 브로드캐스팅 규칙대로 $(N, 1) - (N,)$은 $(N, N)$이 되어, 모든 예측과 모든 정답의 차이를 평균 낸다. 오류가 나지 않으니 모르고 지나치기 쉽다. **학습이 이상하면 텐서의 shape부터 출력해 보는 습관**이 가장 효과적인 디버깅이다.

[[diagram:broadcast-bug]]
`,
  checks: [
    {
      key: "c1",
      question: "PyTorch 학습 루프의 올바른 순서는?",
      choices: ["step → backward → zero_grad → forward", "forward → loss → zero_grad → backward → step", "backward → forward → step", "zero_grad → step → forward → backward"],
      answer: 1,
      explanation: "기울기를 초기화한 뒤 backward로 새로 채우고 step으로 갱신한다(zero_grad는 backward 전이면 된다).",
    },
    {
      key: "c2",
      question: "`nn.Module`을 상속한 클래스에서 `backward` 메서드를 직접 작성하지 않아도 되는 이유는?",
      choices: ["PyTorch가 수치미분을 쓰기 때문에", "`forward` 안의 텐서 연산이 autograd에 기록되어 `loss.backward()`가 자동으로 역전파하기 때문에", "backward가 필요 없는 모델만 만들 수 있어서", "GPU가 대신 계산해서"],
      answer: 1,
      explanation: "각 연산이 `grad_fn`으로 그래프를 기록한다. 우리가 만든 Value의 `_prev`, `_backward`와 같은 원리다.",
    },
    {
      key: "c3",
      question: "검증 루프에서 `model.eval()`과 `torch.no_grad()`의 역할을 올바르게 짝지은 것은?",
      choices: ["eval: 계산 그래프 기록 중지 / no_grad: 드롭아웃 끄기", "eval: BatchNorm·Dropout을 평가 모드로 / no_grad: 계산 그래프를 기록하지 않아 메모리 절약", "둘 다 학습률을 0으로", "둘 다 같은 기능"],
      answer: 1,
      explanation: "eval은 층의 동작 모드를, no_grad는 autograd 기록 여부를 바꾼다. 둘은 서로 다른 스위치다.",
    },
    {
      key: "c4",
      question: "예측 `pred`의 shape이 `(64, 1)`이고 정답 `y`의 shape이 `(64,)`일 때 `((pred - y) ** 2).mean()`의 문제는?",
      choices: ["브로드캐스팅으로 `(64, 64)` 차이 행렬이 만들어져 엉뚱한 값을 평균 낸다", "오류가 나서 실행이 멈춘다", "정확히 원하는 MSE가 계산된다", "기울기가 계산되지 않는다"],
      answer: 0,
      explanation: "오른쪽부터 비교하면 1과 64(1이 복제), 64와 없음이라 `(64, 64)`가 된다. 오류 없이 틀린 손실이 계산되는 조용한 버그라 shape을 맞춰야 한다.",
    },
    {
      key: "c5",
      question: "학습 중 손실을 기록할 때 `losses.append(loss)` 대신 `losses.append(loss.item())`을 쓰는 이유는?",
      choices: ["텐서를 그대로 모으면 계산 그래프가 해제되지 않아 메모리가 계속 늘어나기 때문", "`.item()`이 손실을 더 정확하게 만들기 때문", "`.item()`이 역전파를 실행하기 때문", "리스트에는 텐서를 넣을 수 없기 때문"],
      answer: 0,
      explanation: "손실 텐서는 자신을 만든 계산 그래프를 참조한다. `.item()`은 파이썬 숫자만 꺼내 그래프와의 연결을 끊는다.",
    },
    {
      key: "c6",
      question: "PyTorch 학습 루프를 `loss.backward()` → `optimizer.zero_grad()` → `optimizer.step()` 순서로 쓰면?",
      choices: ["정상이다. 순서는 상관없다", "방금 계산한 기울기를 지운 뒤 갱신하므로 (weight decay 같은 별도 항을 빼면) 파라미터가 기울기로는 전혀 갱신되지 않는다", "기울기가 두 배로 누적된다", "다음 스텝에서 오류가 난다"],
      answer: 1,
      explanation: "`zero_grad()`는 `.grad`를 0(또는 None)으로 만듭니다. 역전파 직후에 지우면 `step()`이 읽을 기울기가 없습니다. 올바른 순서는 `zero_grad()` → `backward()` → `step()`이고, 그래야 이전 스텝의 기울기가 `+=`로 누적되지도 않습니다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "PyTorch에서 requires_grad=True로 만든 텐서 w에 대해 loss.backward()를 호출하면 w.grad에 어떤 값이 채워지는가? 이것이 앞서 직접 만든 Value 클래스의 grad 필드와 정확히 같은 역할을 하는 이유를 설명하라.",
      answer: md`
w.grad는 손실 $L$을 $w$로 편미분한 값 $\partial L/\partial w$를 담고 있으며, 이는 직접 구현한 Value 클래스에서 각 노드의 grad 필드에 누적되는 값과 정확히 같은 역할이다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "학습 루프에서 optimizer.zero_grad()를 빼먹으면 어떤 문제가 생기는가? .grad가 '=' 대신 '+='로 누적된다는 사실과 연결해 설명하라.",
      answer: md`
PyTorch는 backward() 호출 시 grad를 덮어쓰지 않고 기존 값에 더한다(누적). zero_grad()를 생략하면 이전 스텝의 기울기가 계속 쌓여 실제보다 훨씬 큰 값으로 파라미터가 갱신되고, 결국 학습이 발산할 수 있다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "nn.Module 서브클래스를 정의할 때 __init__과 forward는 각각 어떤 역할을 맡는가? backward 메서드를 직접 작성하지 않아도 기울기가 자동으로 계산되는 이유는 무엇인가?",
      answer: md`
__init__에서는 이 레이어가 어떤 학습 가능한 파라미터(nn.Linear 등)를 가질지 선언하고, forward에서는 입력이 그 레이어들을 거쳐 출력이 되기까지의 순전파 계산만 정의한다. forward 안의 텐서 연산들이 이미 autograd에 의해 자동으로 기록되므로, backward는 별도로 구현할 필요 없이 자동으로 만들어진다.
`,
      keyPoints: [],
    },
    {
      key: "d4",
      question: "PyTorch의 Dataset 클래스가 반드시 정의해야 하는 두 메서드는 무엇이며, DataLoader는 그 위에서 각각 어떤 일을 대신 해주는가?",
      answer: md`
Dataset의 __len__은 전체 샘플 수를, __getitem__은 인덱스를 받아 그에 해당하는 샘플 하나를 반환하도록 정의한다. DataLoader는 이 Dataset을 감싸서 셔플, 배치로 묶기, 병렬 로딩을 대신 처리해준다.
`,
      keyPoints: [],
    },
    {
      key: "d5",
      question: "2층 신경망의 `backward`에서 `dz1 = (dz2 @ W2.T) * (z1 > 0)`의 `* (z1 > 0)`을 지우면 gradient check와 학습이 어떻게 됩니까? 이유를 ReLU의 국소 미분으로 설명하십시오.",
      answer: md`
ReLU의 국소 미분은 입력이 양수면 1, 음수면 0입니다. 마스크를 지우면 순전파에서 0을 출력한(손실에 전혀 영향을 주지 않은) 뉴런에도 기울기가 흘러가, $W_1$, $b_1$의 기울기가 실제 기울기와 달라집니다. 그래서 수치미분과 비교하는 gradient check에서 W1·b1 항목의 상대오차가 크게 나와 버그가 드러납니다. W2·b2는 마스크와 무관해 여전히 통과합니다. 틀린 기울기로 학습하면 손실이 덜 줄거나 불안정해집니다.
`,
      keyPoints: ["ReLU의 국소 미분은 양수 1, 음수 0", "0을 낸 뉴런에도 기울기가 흘러가 틀린 값이 된다", "W1·b1의 gradient check가 실패한다", "W2·b2는 영향을 받지 않는다"],
    },
  ],
  references: [
    { title: "PyTorch Tutorials — Learn the Basics", url: "https://pytorch.org/tutorials/beginner/basics/intro.html", note: "Tensor → Dataset → Model → Autograd → Optimization 순서의 공식 튜토리얼" },
    { title: "Dive into Deep Learning (한국어) — 다층 퍼셉트론", url: "https://ko.d2l.ai/chapter_deep-learning-basics/mlp.html", note: "MLP를 처음부터 구현하고 프레임워크로 옮기는 과정" },
  ],
});
