import type { WeekMeta } from "../types";

const week3: WeekMeta = {
  slug: "week-3",
  number: 3,
  phase: "Phase 2 · 딥러닝",
  title: "신경망과 역전파 (Backpropagation)",
  subtitle: "MLP, 활성화, 연쇄법칙, 계산 그래프, SGD/Adam",
  selfHours: "개인 8h",
  sessionHours: "세션 2h",
  difficulty: 4,
  keywords: ["MLP", "활성화", "연쇄법칙", "계산 그래프", "SGD/Adam"],
  objectives: [
    "MLP의 순전파를 행렬식으로 쓰고 차원을 추적한다.",
    "연쇄법칙으로 역전파를 유도하고 계산 그래프로 설명한다.",
    "자동미분 엔진(micrograd)을 직접 구현한다.",
    "SGD, Momentum, Adam의 차이를 설명한다.",
  ],
  learningOrder: [
    '필수 — Karpathy "The spelled-out intro to neural networks and backpropagation: building micrograd" (약 2.5h, 따라 코딩)',
    "CS231n Notes: Backpropagation, Intuitions (cs231n.github.io/optimization-2)",
    "3Blue1Brown Neural Networks 3~4편(역전파)",
    "Michael Nielsen, Neural Networks and Deep Learning 2장",
  ],
  conceptsMd: `
### 2.1 뉴런과 MLP

[[diagram:mlp-diagram]]

\`\`\`formula
h = φ(W1 x + b1),  W1: 4×3        ŷ = W2 h + b2,  W2: 1×4
φ: ReLU(z)=max(0,z), tanh, GELU …  (비선형이 없으면 여러 층 = 한 층)
\`\`\`

:::info 보편 근사 정리
충분히 넓은 1개 은닉층 MLP는 임의의 연속함수를 근사할 수 있다(단, 학습 가능성을 보장하진 않는다).
:::

### 2.2 역전파 = 연쇄법칙의 효율적 적용

[[diagram:computational-graph]]

**핵심 규칙** 덧셈 노드는 기울기를 그대로 분배하고, 곱셈 노드는 상대편 값을 곱해 전달하며, max 노드는 선택된 쪽으로만 전달한다. 각 노드는 자기 국소 미분만 알면 된다 — 이것이 모듈화(PyTorch autograd)의 핵심이다.

행렬 형태(한 층): \`z = Wx+b\`, \`δ=dL/dz\` 이면 \`dL/dW = δxᵀ\`, \`dL/db = δ\`, \`dL/dx = Wᵀδ\`. 형태(shape)가 항상 일치하는지 확인하는 것이 최고의 디버깅 습관이다.

### 2.3 최적화기

| 이름 | 갱신식 | 직관 |
| --- | --- | --- |
| SGD | \`θ ← θ − η g\` | 미니배치로 근사한 기울기 |
| Momentum | \`v ← βv + g ; θ ← θ − ηv\` | 공이 굴러가는 관성, 진동 감소 |
| Adam | \`m=β₁m+(1−β₁)g, v=β₂v+(1−β₂)g², θ ← θ − η m̂/(√v̂+ε)\` | 파라미터별 적응 학습률 |

### 2.4 실전 이슈

- **기울기 소실/폭발**: sigmoid·tanh 깊은 망에서 소실 → ReLU, 좋은 초기화(He/Xavier), 잔차연결(W4)로 해결.
- **초기화**: 분산 ≈ 2/fan_in (He). 모두 0으로 초기화하면 대칭성이 깨지지 않는다.
- **Gradient check**: \`(f(θ+ε) − f(θ−ε))/2ε\` 와 해석적 기울기를 비교(상대오차 < 1e-5).
`,
  practiceMd: `
### 3.1 미니 자동미분 엔진 (핵심 구조)

\`\`\`python
class Value:
    def __init__(self, data, _children=(), _op=""):
        self.data, self.grad = data, 0.0
        self._prev, self._backward = set(_children), lambda: None
    def __add__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data + o.data, (self, o), "+")
        def _backward():
            self.grad += out.grad
            o.grad    += out.grad
        out._backward = _backward
        return out
    def __mul__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data * o.data, (self, o), "*")
        def _backward():
            self.grad += o.data * out.grad
            o.grad    += self.data * out.grad
        out._backward = _backward
        return out
    def relu(self):
        out = Value(max(0, self.data), (self,), "relu")
        def _backward(): self.grad += (out.data > 0) * out.grad
        out._backward = _backward
        return out
    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for c in v._prev: build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo): v._backward()

a, b = Value(2.0), Value(-3.0)
L = (a*b + 10).relu()
L.backward(); print(a.grad, b.grad)   # 기대값: -3.0, 2.0
\`\`\`

:::info 주의
\`+=\` 로 기울기를 누적하는 이유 — 한 변수가 여러 경로에 쓰이면 기울기가 합산된다(다변수 연쇄법칙). 이를 \`=\`로 쓰면 어떤 버그가 생기는지 직접 실험해보라.
:::

### 3.2 PyTorch로 make_moons 분류

\`\`\`python
import torch, torch.nn as nn
from sklearn.datasets import make_moons
X, y = make_moons(1000, noise=0.2, random_state=0)
X, y = torch.tensor(X, dtype=torch.float32), torch.tensor(y)
net = nn.Sequential(nn.Linear(2,16), nn.ReLU(), nn.Linear(16,16), nn.ReLU(), nn.Linear(16,2))
opt = torch.optim.Adam(net.parameters(), lr=1e-2)
for ep in range(300):
    loss = nn.functional.cross_entropy(net(X), y)
    opt.zero_grad(); loss.backward(); opt.step()
    if ep % 50 == 0: print(ep, loss.item())
\`\`\`

관찰: \`opt.zero_grad()\`를 빼면 어떻게 되는가? 은닉 유닛 수가 1, 2, 4, 64일 때 결정경계는 어떻게 달라지는가?
`,
  quiz: [
    "L = (wx − y)², x=2, w=1, y=5 일 때 dL/dw는?",
    "곱셈 노드 z=a·b에서 dL/da를 z의 상류 기울기 g로 표현하라.",
    "활성화 함수가 없는 3층 MLP는 왜 1층과 표현력이 같은가?",
    "Adam이 SGD보다 초기 학습이 빠른 경향을 보이는 이유는?",
    "가중치를 전부 0으로 초기화하면 생기는 문제는?",
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "신경망은 실수로부터 어떻게 배우는가?"' },
    { label: "② 키워드 6개" },
    { label: "③ 그림 — L=(w·x+c−y)² 의 계산 그래프를 그리고 각 엣지에 기울기 적기" },
    { label: "④ 수식 — 한 층의 dL/dW, dL/dx 유도. shape 표기" },
    { label: '⑤ 설명하기 — "역전파는 그냥 연쇄법칙인데 왜 혁신이었나?" (계산 재사용, 효율 O(순전파))' },
    { label: "⑥ 막힌 곳 / 보완" },
  ],
  assignmentMd: `
### 필수

1. 3.1의 Value 클래스에 \`__pow__\`, \`tanh\`, \`__neg__\`, \`__sub__\`, \`__truediv__\` 를 추가하고, 각 연산의 국소 미분을 손으로 유도해 주석으로 남길 것.
2. Value로 2층 MLP(뉴런/층/MLP 클래스)를 만들어 make_moons에서 정확도 90% 이상 달성. 손실 곡선 제출.
3. **Gradient check**: 임의의 그래프에서 수치미분과 역전파 값의 상대오차를 출력.
4. 동일 문제를 PyTorch(nn.Module)로 구현해 결과와 학습 속도를 비교. Value 구현이 느린 이유 3가지 서술.

### 심화

- SGD/Momentum/Adam을 직접 구현해 수렴 속도 비교 그래프.
- ReLU vs tanh, 20층 깊이에서 기울기 크기를 층별로 plot (소실/폭발 관찰).

### 채점 (10점)

| 항목 | 점수 |
| --- | --- |
| 미분 유도 정확성 | 3 |
| 구현 정확성(gradient check 통과) | 4 |
| 실험·해석 | 2 |
| 코드 품질 | 1 |
`,
  dueNote: "제출: 일요일 23:59",
  furtherReading: [
    'Rumelhart, Hinton, Williams (1986) "Learning representations by back-propagating errors"',
    'Karpathy "Yes you should understand backprop" (Medium)',
    "Goodfellow et al., Deep Learning 6장, 8장",
  ],
};

export default week3;
