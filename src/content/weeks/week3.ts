import type { WeekMeta } from "../types";

const week3: WeekMeta = {
  slug: "week-3",
  number: 3,
  phase: "Phase 2 · 딥러닝",
  title: "신경망과 역전파 (Backpropagation)",
  subtitle: "MLP, 활성화, 연쇄법칙, 계산 그래프, SGD/Adam, PyTorch",
  selfHours: "개인 10h",
  sessionHours: "세션 2h",
  difficulty: 4,
  keywords: ["MLP", "활성화", "연쇄법칙", "계산 그래프", "SGD/Adam", "PyTorch", "Autograd", "GPU/CUDA"],
  objectives: [
    "MLP의 순전파를 행렬식으로 쓰고 차원을 추적한다.",
    "연쇄법칙으로 역전파를 유도하고 계산 그래프로 설명한다.",
    "자동미분 엔진(micrograd)을 직접 구현한다.",
    "SGD, Momentum, Adam의 차이를 설명한다.",
    "수치미분(gradient check)으로 역전파 구현의 정확성을 검증한다.",
    "PyTorch의 Tensor/Autograd/nn.Module/optimizer가 지금까지 손으로 구현한 backprop·경사하강법의 어느 부분을 대신하는지 정확히 대응시켜 설명한다.",
    "GPU/CUDA가 신경망 학습을 병렬화로 가속하는 원리와 mixed precision의 이점을 설명한다.",
  ],
  learningOrder: [
    '필수 — Karpathy "The spelled-out intro to neural networks and backpropagation: building micrograd" (약 2.5h, 따라 코딩)',
    "CS231n Notes: Backpropagation, Intuitions (cs231n.github.io/optimization-2)",
    "3Blue1Brown Neural Networks 3~4편(역전파)",
    "Michael Nielsen, Neural Networks and Deep Learning 2장",
  ],
  conceptsMd: `
지난 두 주 동안 우리는 학습이라는 것을 "손실 L(θ)를 최소화하는 θ를 찾는 일"이라고 정의했고, 그 방향을 찾는 도구로 경사하강법 $\\theta \\leftarrow \\theta - \\eta \\nabla L$을 배웠다. 그런데 정작 가장 실무적인 질문 하나를 미뤄뒀다. 파라미터가 열 개도 아니고 수백만, 어떤 모델은 수천억 개나 되는데, 그 각각에 대한 기울기 $\\nabla L$을 대체 어떻게 계산한다는 말인가? 손으로 하나하나 미분해서 코드를 짜는 일은 상상만 해도 끔찍하고 사실상 불가능하다. 이번 주에 배울 역전파(backpropagation)가 바로 이 문제에 대한 답이다. 그리고 놀랍게도 그 답은 이미 여러분이 알고 있는 도구 하나로 완성된다 — 고등학교에서 스치듯 배운 연쇄법칙(chain rule)이다.

역전파(backpropagation)를 알고리즘으로 정의하면 다음과 같다. 신경망의 순전파는 입력 x로부터 손실 L까지 이어지는 하나의 계산 그래프(computational graph)를 구성하며, 이 그래프의 각 노드는 자신의 입력에 대한 국소 미분(local gradient)만을 계산할 수 있다. 역전파는 출력 노드(L)에서 시작해 이 계산 그래프를 위상정렬(topological sort)의 역순으로 순회하면서, 연쇄법칙(chain rule) $\\dfrac{\\partial L}{\\partial \\theta} = \\dfrac{\\partial L}{\\partial z}\\cdot\\dfrac{\\partial z}{\\partial \\theta}$에 따라 상류에서 이미 계산되어 내려온 기울기 $\\dfrac{\\partial L}{\\partial z}$와 현재 노드가 자기 혼자 책임지는 국소 미분 $\\dfrac{\\partial z}{\\partial \\theta}$를 곱해 하류(입력 쪽) 노드로 전달하는 알고리즘이다. 그래프에 속한 모든 파라미터 θ에 대해 이 곱셈을 한 번씩만 수행하면, 그래프 전체를 단 한 번 역방향으로 순회하는 것만으로 $\\dfrac{\\partial L}{\\partial \\theta}$ 전부가 계산된다.

그런데 역전파를 두고 "그냥 연쇄법칙 아니냐"는 말을 자주 듣는다. 맞는 말이다. 역전파 안에 새로운 수학은 없다. 그렇다면 왜 이 알고리즘 하나가 1986년 논문 이후 인공지능의 역사를 바꿔놓았다고까지 평가받을까? 답은 효율성에 있다. 순진하게 접근하면, 파라미터가 백만 개일 때 각각에 대한 기울기를 구하려고 그 파라미터 하나만 살짝 흔들어서 손실이 얼마나 변하는지를 백만 번 따로 계산해야 할 것 같다(이것이 실제로 뒤에서 배울 수치미분 방식이고, 이 방식은 파라미터 개수만큼 순전파를 반복해야 한다). 그러나 역전파는 다르다. 순전파를 딱 한 번 해서 최종 출력을 얻고 나면, 그 계산 그래프를 거꾸로 한 번만 훑는 것만으로 모든 파라미터에 대한 기울기가 동시에 나온다. 순전파 한 번과 거의 같은 비용으로, 역전파 한 번에 수백만 개의 기울기를 한꺼번에 얻는다는 뜻이다. 이 "계산을 재사용해서 얻는 효율성"이 없었다면, 오늘날의 거대 언어 모델은 애초에 학습 자체가 불가능했을 것이다. 연쇄법칙이라는 재료는 새롭지 않았지만, 그것을 계산 그래프 위에서 체계적이고 효율적으로 적용하는 하나의 알고리즘으로 정리해낸 것이 역전파의 진짜 기여다.

### 2.1 뉴런과 MLP

1주차에서 행렬-벡터 곱 Wx를 "입력을 새로운 좌표계로 옮기는 변환"이라고 했던 것을 기억하는가? MLP(다층 퍼셉트론)는 이 변환을 여러 번 겹쳐 쌓은 구조다. 그런데 여기 함정이 하나 있다. 두 선형 변환 $W_2(W_1x+b_1)+b_2$를 전개하면 $(W_2W_1)x + (W_2b_1+b_2)$가 되어, 결국 하나의 가중치 행렬($W_2W_1$)과 하나의 편향($W_2b_1+b_2$)으로 표현되는 단일 선형 변환과 수학적으로 동일하다. 즉 비선형 함수 없이 선형 계층을 아무리 많이 쌓아도 표현 가능한 함수 집합은 1층 선형모델과 정확히 같다. 그래서 층과 층 사이에 비선형 함수, 즉 활성화 함수(activation function) φ를 끼워 넣어야 위 항등식이 성립하지 않게 되고, 그 결과 층 수만큼 표현력이 실제로 늘어난다. ReLU처럼 음수를 0으로 사상(mapping)하는 단순한 비선형 함수 하나만 있어도, 층을 쌓을수록 구간별 선형함수(piecewise linear function)로서의 조각(구간) 수가 지수적으로 늘어나 임의로 복잡한 결정경계나 곡면을 근사할 수 있는 표현력을 얻는다.

[[diagram:mlp-diagram]]

\`\`\`formula
h = φ(W1 x + b1),  W1: 4×3        ŷ = W2 h + b2,  W2: 1×4
φ: ReLU(z)=max(0,z), tanh, GELU …  (비선형이 없으면 여러 층 = 한 층)
\`\`\`

\`\`\`image
src: /images/week3/ann.svg
alt: 입력층, 은닉층, 출력층으로 구성된 인공신경망의 구조도
caption: 원 하나하나가 뉴런, 화살표 하나하나가 가중치를 가진 연결이다. 입력층의 정보가 은닉층을 거쳐 출력층까지 앞으로만 흐르는 구조를 순전파(feedforward)라 부른다.
credit: Cburnett, CC BY-SA 3.0, Wikimedia Commons
width: 560
height: 500
\`\`\`

φ 자리에 넣을 수 있는 함수는 ReLU 하나만이 아니다. 최근 Transformer 계열 모델(5~7주차에서 BERT, GPT를 다룰 때 다시 만난다)에서 기본값으로 자주 쓰이는 활성화 함수가 GELU(Gaussian Error Linear Unit)다. GELU는 입력 x에 "표준정규분포를 따르는 확률변수가 x보다 작을 확률" $\\Phi(x)$를 곱한 값으로 정의된다.

\`\`\`math
\\text{GELU}(x) = x\\,\\Phi(x) = x\\cdot \\dfrac{1}{2}\\left[1+\\text{erf}\\!\\left(\\dfrac{x}{\\sqrt{2}}\\right)\\right]
\`\`\`

오차함수 erf를 직접 계산하기 번거로우므로 실무에서는 다음과 같은 tanh 근사식을 대신 쓰는 경우가 많다(PyTorch의 \`nn.GELU(approximate="tanh")\`가 바로 이 근사식을 계산한다).

\`\`\`math
\\text{GELU}(x) \\approx 0.5x\\left(1+\\tanh\\!\\left[\\sqrt{2/\\pi}\\,(x+0.044715x^3)\\right]\\right)
\`\`\`

ReLU $=\\max(0,x)$와 비교하면 차이가 뚜렷하다. ReLU는 x=0에서 미분이 불연속(왼쪽 미분 0, 오른쪽 미분 1)이고, 음수 구간에서는 출력과 미분이 정확히 0이라서 입력이 아주 살짝만 음수여도 그 뉴런은 통째로 죽어버린다(2.4절의 죽은 ReLU 문제). 반면 GELU는 모든 구간에서 매끄럽게(무한히 미분 가능하게) 이어지고, 입력이 음수라도 완전히 0으로 끊어버리지 않고 $\\Phi(x)$라는 확률만큼 깎아서 조금씩 흘려보낸다 — "이 뉴런의 값을 얼마나 통과시킬지"를 0 또는 1의 이진 선택이 아니라 연속적인 확률적 가중치로 결정하는 셈이다. 이 매끄러움 덕분에 아주 깊은 Transformer를 학습시킬 때 ReLU보다 기울기가 더 안정적으로 흐른다는 것이 실험적으로 널리 보고되어 있다.

:::info 보편 근사 정리
충분히 넓은 1개 은닉층 MLP는 임의의 연속함수를 근사할 수 있다(단, 학습 가능성을 보장하진 않는다). 즉 "표현할 수 있다"는 것과 "경사하강법으로 실제로 찾아낼 수 있다"는 것은 전혀 다른 문제다 — 층을 더 깊게 쌓는 이유 중 하나는, 넓지만 얕은 망보다 깊은 망이 실제로 학습이 더 잘 되는 경우가 많기 때문이다.
:::

### 2.2 역전파 = 연쇄법칙의 효율적 적용

이 아이디어를 구체적인 그림으로 만들어보자. 계산 그래프(computational graph)는 복잡한 수식을 덧셈, 곱셈, ReLU 같은 단순한 연산 노드들로 분해하고, 각 노드의 출력을 다음 노드의 입력으로 연결한 방향성 비순환 그래프(DAG, directed acyclic graph)다. 순전파는 이 그래프를 위상정렬 순서대로 순회하면서 입력 쪽 노드부터 출력 쪽 노드(손실 L)까지 각 노드의 값을 차례로 계산해 나가는 과정이다. 역전파는 이 순회 순서를 정확히 뒤집는다. 손실 노드 L에서 시작해 위상정렬의 역순으로 그래프를 순회하면서, 각 노드가 자신의 국소 미분과 상류(출력에 더 가까운 쪽)에서 전달된 기울기를 곱해 하류(입력 쪽) 노드로 넘겨주는 방식으로, 그래프에 있는 모든 노드에 대해 $\\partial$L/$\\partial$(노드 값)을 계산한다.

[[diagram:computational-graph]]

이 "책임을 거슬러 나눠주는 과정"을 수식으로 정리하면, x가 y를 거쳐 L에 영향을 준다고 할 때 다음과 같은 사슬 모양이 된다.

\`\`\`math
\\dfrac{dL}{dx} = \\dfrac{dL}{dy}\\cdot\\dfrac{dy}{dx}
\`\`\`

여기서 $\\dfrac{dL}{dy}$는 이미 상류(더 나중 단계)에서 계산되어 내려온 값이고, $\\dfrac{dy}{dx}$는 지금 이 노드가 자기 혼자서만 책임지면 되는 국소 미분(local gradient)이다. 계산 그래프의 모든 노드가 이 곱셈 한 번씩만 반복하면서 입력까지 거슬러 올라가는 것, 그것이 역전파의 전부다.

핵심 규칙은 세 가지뿐이다. 덧셈 노드(z=a+b)를 지날 때는 위에서 내려온 기울기를 아무 변형 없이 양쪽 입력에 그대로 나눠준다 — 덧셈은 서로의 크기에 영향을 주지 않기 때문이다. 곱셈 노드(z=a·b)를 지날 때는 자기 몫을 계산할 때 상대방의 값을 곱해서 전달한다. a의 기울기를 구하려면 b가 얼마나 컸는지가 곱해져야 하는데, 직관적으로 생각해보면 b가 0이었다면 애초에 a를 아무리 키워도 z는 전혀 변하지 않았을 것이다. max 노드(ReLU 등)는 승자독식이다 — 실제로 그 값을 통과시킨 쪽에만 기울기를 온전히 전달하고, 선택받지 못한 쪽에는 기울기를 0으로 끊어버린다. 이 세 규칙만 있으면 아무리 복잡한 신경망도 노드 단위로 쪼개서 기계적으로 미분할 수 있다. 그리고 각 노드는 자기 바로 옆의 국소 미분(local gradient)만 알면 된다는 점이 핵심이다 — 전체 함수가 아무리 복잡해도 개별 노드 입장에서는 "내 입력이 바뀌면 내 출력이 얼마나 바뀌는가"라는 아주 단순한 질문에만 답하면 되고, 나머지는 연쇄법칙이 자동으로 이어붙여준다. 이것이 PyTorch 같은 프레임워크의 autograd가 작동하는 원리이자, 새로운 연산 하나를 추가하고 싶을 때 그 연산의 순전파와 국소 미분(backward) 한 쌍만 정의하면 되는 이유다.

:::example 예제 — L = (w·x + c)² 을 손으로 역전파해보기
w=2, x=3, c=1이라는 작은 숫자로 시작해서 순전파와 역전파를 한 단계씩 손으로 따라가 보자. 먼저 계산 그래프를 세 개의 노드로 쪼갠다. u = w·x (곱셈), v = u + c (덧셈), L = v² (제곱). 순전파(앞으로 계산): $u = 2\\times 3 = 6$, v = 6+1 = 7, L = 7² = 49. 이제 역전파를 시작한다. $\\dfrac{dL}{dL} = 1$에서 출발해서, L=v²이므로 $\\dfrac{dL}{dv} = 2v = 2\\times 7 = 14$다. 덧셈 노드는 기울기를 그대로 나눠주므로 $\\dfrac{dL}{du} = 14$, $\\dfrac{dL}{dc} = 14$다. 곱셈 노드 u=w·x는 상대방 값을 곱해서 전달하므로 $\\dfrac{dL}{dw} = \\dfrac{dL}{du} \\times x = 14\\times 3 = 42$, $\\dfrac{dL}{dx} = \\dfrac{dL}{du} \\times w = 14\\times 2 = 28$이다. 검산해보자. w를 2에서 아주 조금(0.001) 늘리면 $u=2.001\\times 3=6.003$, v=7.003, $L=7.003^2\\approx 49.042$다. $\\Delta L\\approx 0.042$를 $\\Delta w=0.001$로 나누면 42에 가깝다 — 방금 손으로 구한 $\\dfrac{dL}{dw}=42$와 일치한다. 이렇게 "수치적으로 검산한다"는 습관이 2.4절에서 배울 gradient check의 원리 그 자체다.
:::

이 규칙을 한 층 전체에 행렬로 적용하면 다음과 같다. z = Wx+b이고 상류에서 내려온 기울기를 $\\delta=\\dfrac{dL}{dz}$라 하면,

\`\`\`math
\\dfrac{\\partial L}{\\partial W} = \\delta x^\\top, \\qquad \\dfrac{\\partial L}{\\partial b} = \\delta, \\qquad \\dfrac{\\partial L}{\\partial x} = W^\\top \\delta
\`\`\`

가 된다. 처음 보면 전치(transpose)가 왜 여기저기 붙는지 헷갈리기 쉬운데, 가장 믿을 만한 검증법은 차원(shape)이 맞는지 확인하는 것이다. W가 $4\\times 3$이면 x는 $3\\times 1$, z는 $4\\times 1$이어야 하고 δ도 $4\\times 1$이어야 하니, $\\dfrac{dL}{dW}$($4\\times 3$)를 만들려면 δ($4\\times 1$)와 $x^\\top$($1\\times 3$)를 곱해야 한다는 식으로 형태만 보고도 공식을 거꾸로 유추할 수 있다. 실제로 현업에서도 shape이 안 맞아서 나는 에러가 역전파 디버깅의 8할을 차지한다. 형태가 항상 일치하는지 확인하는 습관이 최고의 디버깅 습관이다.

이제 지금까지 배운 역전파를 실제로 동작하는 코드로 만들어볼 차례다. Andrej Karpathy가 만든 micrograd라는 아주 작은 자동미분 엔진을 그대로 따라 구현해본다. 겨우 백 줄 남짓한 이 코드 안에 PyTorch의 autograd가 하는 일의 핵심 원리가 전부 들어있다.

### 미니 자동미분 엔진 직접 구현하기

Value 클래스가 하는 일을 한 문장으로 요약하면, "숫자 하나(data)에 그 숫자가 어떻게 만들어졌는지에 대한 기억(_prev, _op)과, 자신에게 기울기가 도착했을 때 그것을 부모에게 어떻게 나눠줄지에 대한 지침서(_backward)를 함께 들고 다니는 객체"다. 여기서 눈여겨봐야 할 설계 포인트가 하나 있다. \`__add__\`나 \`__mul__\` 안에서 _backward를 지금 당장 실행하지 않고 나중에 실행할 함수로만 저장해둔다는 점이다(파이썬의 클로저 기능을 쓴 것이다). 왜 이렇게 할까? 순전파를 하는 시점에는 아직 이 노드의 출력이 최종 손실에 얼마나 기여할지(out.grad)를 알 수 없기 때문이다. 그 값은 순전파가 전부 끝나고 손실 L이 나온 뒤, 역전파가 거꾸로 이 노드까지 도달했을 때야 비로소 정해진다. 그래서 "어떻게 나눠줄지에 대한 계산 방법"만 미리 클로저로 포장해 저장해두고, 실제 계산은 그 정보(out.grad)가 준비된 나중 시점에 실행하는 것이다. 이것이 지연 계산(lazy evaluation)이고, PyTorch가 모든 텐서 연산 뒤에서 grad_fn을 저장해뒀다가 loss.backward() 호출 시점에야 순서대로 실행하는 것과 똑같은 아이디어다.

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

backward() 메서드 안에서 topo 리스트를 만드는 부분이 왜 필요한지 짚고 넘어가자. 어떤 노드의 grad를 확정하려면, 그 노드를 입력으로 사용하는 모든 하류(downstream) 노드의 _backward()가 먼저 실행되어 out.grad가 전부 채워진 뒤여야 한다. grad는 한 노드가 여러 경로에 쓰였을 때 그 기여분이 +=로 누적되는 값이므로(아래 :::info 블록 참고), 하류 노드 중 하나라도 먼저 처리되지 않은 채로 값을 읽어버리면 아직 더해지지 않은 기여분이 누락된다. 위상정렬(topological sort)은 정확히 이 조건, 즉 그래프의 모든 간선 $(u \\rightarrow v)$에 대해 u가 v보다 먼저 나오도록 노드 전체를 한 줄로 정렬하는 알고리즘이다. build() 함수가 재귀로 자식(자신을 만드는 데 쓰인 부모 노드들)을 먼저 방문하고 나서야 자기 자신을 topo 리스트에 추가하는 것이 후위순회(post-order traversal)이며, 이것이 위상정렬 순서를 만들어내는 표준적인 구현 방법이다. 그 결과를 reversed()로 뒤집어 손실 L(topo의 맨 끝, 즉 그래프에서 가장 나중에 만들어진 노드)부터 시작해 입력 쪽(topo의 맨 앞)으로 순회하며 _backward()를 실행하면, 각 노드가 자신의 grad를 확정하는 시점에는 그 노드를 사용하는 모든 하류 노드의 _backward()가 이미 실행되어 out.grad 기여분이 전부 반영되어 있음이 보장된다.

위 코드의 a, b = Value(2.0), Value(-3.0) 예제를 직접 손으로 따라가 보자. a*b = -6, 여기에 10을 더하면 4, relu(4) = 4이므로 L.data = 4다. backward()를 부르면 L.grad = 1에서 시작해서, relu 노드는 out.data(=4)가 양수이므로 기울기 1을 그대로 통과시켜 (a*b+10)의 기울기도 1이 된다. 덧셈 노드는 기울기를 그대로 나눠주므로 a*b의 기울기도 1, 10의 기울기도 1이다. 곱셈 노드에서는 a.grad += b.data $\\times$ 1 = -3, b.grad += a.data $\\times$ 1 = 2가 되어, 코드 주석에 적힌 기대값 -3.0, 2.0과 정확히 일치한다.

:::info 주의
\`+=\` 로 기울기를 누적하는 이유 — 한 변수가 여러 경로에 쓰이면 기울기가 합산된다(다변수 연쇄법칙, fan-out gradient accumulation). 이를 \`=\`로 쓰면 어떤 버그가 생기는지 직접 실험해보라. 힌트: 같은 Value를 두 번 이상 재사용하는 식, 예를 들어 y = x*x + x 같은 식을 만들어 dy/dx를 계산해보면 차이가 바로 드러난다.
:::

### 2.3 최적화기

1주차에서 정의한 SGD(확률적 경사하강법)는 매 스텝 미니배치로 추정한 기울기 g의 반대 방향으로 $\\theta \\leftarrow \\theta - \\eta g$만큼 이동하는 갱신 규칙이다. 그런데 미니배치마다 g의 추정값이 조금씩 달라지므로 스텝마다 기울기의 방향이 흔들리고, 손실 지형이 방향에 따라 곡률 차이가 큰(ill-conditioned) 좁고 긴 협곡 모양이면 SGD는 협곡의 좁은 축 방향으로는 스텝마다 부호가 바뀌며 진동하고 긴 축 방향으로는 느리게만 진행해 전체적으로 수렴이 비효율적이다. Momentum과 Adam은 이 문제를 서로 다른 방식으로 완화한다. Momentum은 현재 기울기 g뿐 아니라 이전 스텝들의 갱신 방향을 지수이동평균 v로 누적해서 사용한다($v \\leftarrow \\beta v + g,\\ \\theta \\leftarrow \\theta - \\eta v$). 그 결과 기울기의 방향이 스텝마다 일관되게 유지되는 축에서는 v가 계속 커져 이동량이 누적되고, 스텝마다 부호가 뒤바뀌는 축에서는 양(+)과 음(−) 성분이 서로 상쇄되어 v가 작게 유지되므로 진동이 줄어든다. Adam은 여기에 파라미터별 적응적 학습률(adaptive learning rate)을 추가한다. 각 파라미터마다 그동안의 기울기 제곱의 지수이동평균 v를 따로 추적해서, 기울기 제곱 평균이 큰(값이 자주 크게 변하는) 파라미터는 유효 학습률 $\\eta/\\sqrt{v}$가 작아지도록, 제곱 평균이 작은(거의 변하지 않는) 파라미터는 유효 학습률이 커지도록 파라미터마다 서로 다른 실질 보폭으로 갱신한다.

| 이름 | 갱신식 | 직관 |
| --- | --- | --- |
| SGD | \`θ ← θ − η g\` | 미니배치로 근사한 기울기 |
| Momentum | \`v ← βv + g ; θ ← θ − ηv\` | 공이 굴러가는 관성, 진동 감소 |
| Adam | \`m=β₁m+(1−β₁)g, v=β₂v+(1−β₂)g², θ ← θ − η m̂/(√v̂+ε)\` | 파라미터별 적응 학습률 |

Adam의 갱신식을 수식으로 다시 풀어보면 다음과 같다. 먼저 1차 모멘트(방향의 관성) m과 2차 모멘트(기울기 크기의 제곱 평균) v를 각각 지수이동평균으로 갱신하고,

\`\`\`math
m_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t, \\qquad v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2
\`\`\`

학습 초반에 m, v가 0에서 출발한 탓에 값이 실제보다 작게 잡히는 편향을 보정한 뒤, 그 보정된 값으로 파라미터를 갱신한다.

\`\`\`math
\\hat{m}_t = \\dfrac{m_t}{1-\\beta_1^t}, \\qquad \\hat{v}_t = \\dfrac{v_t}{1-\\beta_2^t}, \\qquad \\theta \\leftarrow \\theta - \\eta\\,\\dfrac{\\hat{m}_t}{\\sqrt{\\hat{v}_t}+\\epsilon}
\`\`\`

분모의 $\\sqrt{\\hat{v}}$가 바로 "자주 크게 흔들리는 파라미터는 걸음을 작게" 만들어주는 장치다 — 그 파라미터의 기울기 제곱 평균이 크면 클수록 분모가 커져서 실제 걸음 폭은 줄어든다.

실무에서는 특별한 이유가 없다면 Adam(또는 그 개선판인 AdamW)을 기본값으로 놓고 학습을 시작하는 경우가 많고, 시간과 자원이 충분할 때 SGD+Momentum으로 더 세밀하게 튜닝해 마지막 성능을 쥐어짜는 경우가 많다는 정도만 기억해두자.

### 2.4 실전 이슈

세 가지 실전 이슈를 짚고 넘어가자. 첫 번째는 기울기 소실과 폭발이다. sigmoid나 tanh처럼 입력이 조금만 커져도 출력이 거의 평평해지는 활성화 함수를 깊게 쌓으면, 연쇄법칙으로 기울기를 곱해나가는 과정에서 0에 가까운 국소 미분들이 계속 곱해져 맨 앞쪽 층에 도달할 때쯤에는 기울기가 사실상 0이 되어버린다(기울기 소실). 반대로 미분값이 1보다 큰 항들이 계속 곱해지면 기울기가 기하급수적으로 커져 학습이 발산해버리기도 한다(기울기 폭발). ReLU가 널리 쓰이는 이유 중 하나가 바로 이것이다 — 입력이 양수인 구간에서는 미분이 항상 1이라서, 이 구간에서는 기울기가 층을 지나도 줄어들거나 커지지 않고 그대로 전달된다. 다만 ReLU도 공짜는 아니다. 입력이 음수인 구간에서는 미분이 정확히 0이므로, 한번 음수 쪽으로 넘어가 버린 뉴런은 그 이후로 기울기를 전혀 받지 못해 영영 업데이트되지 않는 "죽은 ReLU(dead ReLU)" 현상이 생기기도 한다. 여기에 He/Xavier 초기화, 그리고 4주차에 배울 잔차 연결(residual connection)을 더하면 훨씬 깊은 네트워크도 안정적으로 학습시킬 수 있다.

\`\`\`image
src: /images/week3/activation-functions-comparison.svg
alt: sign, sigmoid, tanh, ReLU, Leaky ReLU 활성화 함수의 그래프를 나란히 비교한 그림
caption: sigmoid와 tanh는 입력의 절댓값이 커지면 곡선이 평평해져 미분값이 0에 가까워지는 구간(포화 구간)을 갖는 반면, ReLU는 입력이 양수인 구간에서 기울기가 항상 1로 일정하다. 이 차이가 위에서 설명한 기울기 소실 문제의 원인이자 ReLU가 널리 쓰이는 이유다.
credit: Andreas Maier, CC BY 4.0, Wikimedia Commons
width: 1058
height: 606
\`\`\`

두 번째는 초기화다. 가중치의 분산을 대략 $\\text{Var}(W) \\approx \\dfrac{2}{\\text{fan\\_in}}$ 정도로 맞추는 He 초기화가 ReLU 계열에서 널리 쓰인다(이 분산이 왜 하필 fan_in에 반비례해야 하는지, 그리고 이 값을 조금만 벗어나도 깊은 망에서 무슨 일이 벌어지는지는 2.5절에서 숫자로 직접 확인한다). 여기서 반드시 기억해야 할 것은, 가중치를 전부 0으로 초기화하면 절대 안 된다는 점이다. 모든 뉴런이 같은 값에서 출발하면 순전파 출력도 똑같고 역전파로 받는 기울기도 완전히 똑같아서, 학습을 아무리 반복해도 뉴런들이 서로 다른 특징을 배우지 못하고 끝까지 서로의 복사본처럼 움직인다(대칭성이 깨지지 않는 문제). 작은 무작위 값으로라도 흩뿌려서 시작해야 뉴런마다 서로 다른 방향으로 갈라져 나갈 수 있다.

세 번째는 gradient check이다. 역전파로 구현한 코드가 정말로 맞게 미분을 계산하고 있는지 확인하는 가장 확실한 방법은, 파라미터를 아주 조금(ε) 흔들어서 손실이 얼마나 변하는지 직접 재보는 수치미분 (f(θ+ε) − f(θ−ε))/2ε과, 역전파가 내놓은 해석적 기울기를 나란히 비교하는 것이다. 두 값의 상대오차가 1e-5보다 작으면 구현이 맞다고 믿을 수 있다. 바로 위 예제에서 $\\dfrac{dL}{dw}=42$를 수치적으로 검산해본 것이 이 gradient check의 축소판이다. 실습과 과제에서 이를 직접 코드로 짜볼 것이다.

### 2.5 가중치 초기화의 수학: 분산이 왜 fan_in에 반비례해야 하는가

2.4절에서 초기화를 짧게 지나쳤는데, 여기엔 사실 1주차 2.4절에서 이미 배운 원리 하나가 고스란히 숨어 있다. 한 뉴런의 출력(정확히는 활성화 함수를 통과하기 전의 값, pre-activation) z는 fan_in개의 "입력$\\times$가중치" 곱을 몽땅 더한 것이다. $z = w_1x_1 + w_2x_2 + \\cdots + w_{\\text{fan\\_in}}x_{\\text{fan\\_in}}$. 그런데 1주차에서 분산을 다루며 언급했듯, 서로 독립인 확률변수를 더하면 분산은 상쇄되지 않고 그냥 더해진다. w_i와 x_i가 평균 0이고 서로 독립이라고 가정하면 곱 하나의 분산은 대략 Var(w)·Var(x)이고, 이런 항을 fan_in개 더한 z의 분산은 다음과 같다.

\`\`\`math
\\text{Var}(z) \\approx \\text{fan\\_in} \\cdot \\text{Var}(w) \\cdot \\text{Var}(x)
\`\`\`

즉 층 하나를 통과할 때마다 입력이 fan_in개씩 모여 더해지는 구조 그 자체가 분산을 fan_in배로 불려놓는 장치인 셈이다. 가중치 하나하나의 분산을 아무렇게나(예컨대 표준정규분포 그대로) 고정해두면, fan_in이 클수록 z의 분산은 계속 커지고, 그 z가 다음 층의 입력이 되어 또다시 fan_in배로 불어나기를 반복한다. 그래서 층이 바뀌어도 Var(z)를 대략 일정하게 유지하려면, 가중치 하나의 분산을 미리 $\\text{Var}(w) \\approx 1/\\text{fan\\_in}$ 정도로 줄여둬야 한다 — fan_in배로 커지는 몫을 가중치 쪽에서 fan_in분의 1만큼 미리 깎아 상쇄하는 것이다.

:::example 예제 — 표준편차가 층마다 조금만 달라져도 10층을 지나면 무슨 일이 벌어지는가
초기화가 아주 조금만 어긋나도 그 효과가 층을 거듭할수록 기하급수적으로 누적된다는 것을 직접 계산해보자. 어떤 네트워크에서 각 층을 통과할 때마다 활성화의 표준편차가 정확히 1.5배씩 커진다고 하면(가중치 분산을 필요 이상으로 크게 잡은 경우), 10개 층을 통과한 뒤 표준편차는 처음의 1.5^10배가 된다. 계산해보면 1.5^10 = 59049/1024 $\\approx$ **57.7배**다. 층 하나당 겨우 50% 커진 것뿐인데 10층을 지나면 원래 값의 거의 58배로 부풀어 있다는 뜻이고, 이것이 기울기 폭발(exploding gradient)이 실제로 벌어지는 방식이다. 반대로 표준편차가 층마다 0.8배씩(20%) 작아지는 경우는, 10층 뒤에 0.8^10 = 1048576/9765625 $\\approx$ **0.107배**, 즉 원래 값의 10.7% 수준까지 쪼그라든다. 이것이 기울기 소실(vanishing gradient)이다.

층 깊이에 따라 이 효과가 얼마나 급격히 벌어지는지 비교해보면 왜 이 문제가 유독 "깊은" 망에서 심각한지 감이 온다.

| 층 수 | 1.5배씩 커질 때 | 0.8배씩 작아질 때 |
| --- | --- | --- |
| 3층 | 1.5³ $\\approx$ 3.4배 | 0.8³ $\\approx$ 0.51배 |
| 10층 | 1.5¹⁰ $\\approx$ 57.7배 | 0.8¹⁰ $\\approx$ 0.107배 |
| 20층 | 1.5²⁰ $\\approx$ 3325배 | 0.8²⁰ $\\approx$ 0.0115배 |

3층 정도까지는 그럭저럭 버틸 만하지만(3~5배 차이), 10층을 넘어가면 이미 통제 불능 수준이고 20층에서는 3325배라는 사실상 학습이 불가능한 숫자가 나온다. 얕은 네트워크라면 초기화가 다소 부정확해도 그럭저럭 굴러가지만, 층이 깊어질수록 초기화의 아주 작은 오차조차 지수적으로 증폭되어 치명적인 문제가 된다 — 이것이 "왜 깊은 네트워크일수록 초기화에 훨씬 예민한가"에 대한 정량적인 답이다.
:::

이 문제를 다루는 두 대표적 처방이 Xavier(Glorot) 초기화와 He 초기화다. Xavier 초기화는 원래 tanh나 sigmoid처럼 순전파와 역전파 양쪽 모두에서 분산이 안정적으로 유지되어야 한다는 요구를 동시에 만족시키려고 나왔다 — 순전파 쪽만 보면 분산은 fan_in에 반비례해야 하고 역전파 쪽만 보면 fan_out(다음 층으로 나가는 연결 수)에 반비례해야 하므로, 그 사이 타협점으로 fan_in과 fan_out의 평균(또는 조화평균)을 써서 대략 $\\text{Var}(W) \\approx 2/(\\text{fan\\_in}+\\text{fan\\_out})$ 정도로 잡는다. 반면 He 초기화는 ReLU 계열을 염두에 두고 나온 처방이다. ReLU는 입력의 절반(음수 구간)을 통째로 0으로 만들어버리므로 활성화를 통과하고 나면 분산이 대략 절반으로 깎이는데, 이 손실을 미리 보정하려고 He 초기화는 fan_out은 신경 쓰지 않고 fan_in만 사용하되 그 대신 분산을 Xavier의 두 배로 잡는다.

\`\`\`math
\\text{Var}(W) \\approx \\dfrac{2}{\\text{fan\\_in}}
\`\`\`

결국 두 초기화가 서로 다른 공식을 쓰는 건 경쟁하는 두 유파가 있어서가 아니라, "어떤 활성화 함수 뒤에 어떤 분산 보정이 필요한가"라는 질문의 답이 다르기 때문이다. 실무에서는 ReLU 계열이면 He, tanh/sigmoid 계열이면 Xavier를 기본값으로 쓰면 된다.

### 초기화 스케일과 분산 폭발/소실을 눈으로 확인하기

위에서 손으로 계산했던 1.5^10 $\\approx$ 57.7배, 0.8^10 $\\approx$ 0.107배가 실제 코드에서도 그대로 재현되는지 직접 확인해보자. 10층짜리 네트워크를 흉내내면서, 매 층 출력의 표준편차가 초기화 스케일에 따라 어떻게 변하는지만 순수하게 관찰한다(학습은 전혀 하지 않고 순전파만 반복한다).

\`\`\`python
import numpy as np

def forward_stds(scale, n_layers=10, width=256, n_samples=1000):
    x = np.random.randn(n_samples, width)     # 표준편차 1로 시작
    stds = [x.std()]
    for _ in range(n_layers):
        W = np.random.randn(width, width) * scale
        x = np.maximum(0, x @ W)                # ReLU
        stds.append(x.std())
    return stds

he_scale  = np.sqrt(2 / 256)     # He 초기화: Var(W) = 2/fan_in
too_big   = he_scale * 1.5       # 표준편차를 일부러 1.5배 키운 경우
too_small = he_scale * 0.8       # 표준편차를 일부러 0.8배로 줄인 경우

for name, scale in [("He(적정)", he_scale), ("과도(x1.5)", too_big), ("과소(x0.8)", too_small)]:
    stds = forward_stds(scale)
    print(name, [f"{s:.4f}" for s in stds])
\`\`\`

He 스케일을 그대로 쓰면 층을 지나도 표준편차가 거의 일정하게 유지되는 반면, 과도(x1.5)/과소(x0.8) 버전은 층을 지날수록 출력의 표준편차가 본문에서 계산한 것과 거의 같은 비율로(대략 1.5배씩, 0.8배씩) 커지거나 작아지는 것을 출력에서 직접 확인할 수 있다. \`n_layers\`를 20으로 늘려서 다시 돌려보면, 위 표에서 계산했던 3325배·0.0115배에 근접한 극단적인 숫자가 실제 코드에서도 똑같이 재현된다.

### 2.6 정규화: Batch Normalization과 Layer Normalization

깊은 네트워크를 학습시킬 때 층을 통과할 때마다 활성화 값의 분포(평균과 분산)가 스텝마다 계속 흔들리면, 뒤쪽 층은 매번 달라지는 입력 분포에 다시 적응해야 해서 학습이 느려지고 불안정해진다. 정규화(normalization) 층은 이 문제를 완화하려고, 활성화 값 z를 평균 0·분산 1로 표준화한 뒤 학습 가능한 스케일 γ와 이동 β를 다시 곱하고 더해 $\\hat{z}=\\gamma\\cdot\\text{표준화}(z)+\\beta$ 형태로 되돌려준다. 그런데 "평균과 분산을 어떤 축을 따라 계산하느냐"에 따라 전혀 다른 정규화 기법이 만들어진다.

Batch Normalization(BN)은 미니배치 축을 따라 정규화한다. 미니배치에 m개의 샘플이 있고 어떤 특징(뉴런) j의 pre-activation을 $z_j^{(1)}, \\dots, z_j^{(m)}$이라 하면, BN은 이 m개 값(같은 특징, 서로 다른 샘플들)에 대해 평균과 분산을 계산한다.

\`\`\`math
\\mu_j = \\dfrac{1}{m}\\sum_{i=1}^m z_j^{(i)}, \\qquad \\sigma_j^2 = \\dfrac{1}{m}\\sum_{i=1}^m (z_j^{(i)}-\\mu_j)^2, \\qquad \\hat{z}_j^{(i)} = \\dfrac{z_j^{(i)}-\\mu_j}{\\sqrt{\\sigma_j^2+\\epsilon}}
\`\`\`

즉 "이 뉴런의 값이 배치 전체에서 평균적으로 어느 정도인가"를 기준으로 정규화한다. 문제는 이 통계치가 배치 구성에 따라 달라진다는 점이다. 배치 크기가 작으면 $\\mu_j, \\sigma_j^2$의 추정이 불안정해지고, 추론(inference) 시점에는 배치가 하나(m=1)일 수도 있으므로 학습 중 관찰해 둔 이동평균(running mean/var)을 대신 써야 하는 번거로움도 있다(뒤에서 다룰 \`model.eval()\`이 정확히 이 전환을 담당한다).

Layer Normalization(LN)은 정규화 축을 완전히 바꾼다. 배치가 아니라 한 샘플이 가진 모든 특징(feature) 축을 따라 평균과 분산을 계산한다. 샘플 i 하나가 d개의 특징 $z_1^{(i)}, \\dots, z_d^{(i)}$을 가진다면,

\`\`\`math
\\mu_i = \\dfrac{1}{d}\\sum_{k=1}^d z_k^{(i)}, \\qquad \\sigma_i^2 = \\dfrac{1}{d}\\sum_{k=1}^d (z_k^{(i)}-\\mu_i)^2, \\qquad \\hat{z}_k^{(i)} = \\dfrac{z_k^{(i)}-\\mu_i}{\\sqrt{\\sigma_i^2+\\epsilon}}
\`\`\`

이 계산은 오직 샘플 i 자기 자신의 특징들만 사용하므로, 배치 안에 다른 샘플이 몇 개나 같이 들어있는지와 완전히 무관하다 — 배치 크기가 1이어도, 길이가 서로 다른 시퀀스가 섞여 있어도 그대로 적용된다. 이것이 정확히 5주차에서 배울 Transformer가 BatchNorm 대신 LayerNorm을 쓰는 이유다. 자연어 문장은 배치마다 길이도 다르고 문장 수(배치 크기)도 학습 상황에 따라 들쭉날쭉하므로, "같은 배치 안의 서로 다른 문장들"을 기준으로 통계를 내는 BN보다 "같은 문장 안의 서로 다른 토큰들"을 기준으로 통계를 내는 LN이 훨씬 안정적이다.

| | 정규화 축 | 배치 크기 의존성 | 대표 사용처 |
| --- | --- | --- | --- |
| BatchNorm | 배치 축(같은 특징, 다른 샘플들) | 큼 — 배치가 작으면 불안정, 추론 시 이동평균 필요 | CNN(4주차) |
| LayerNorm | 특징 축(같은 샘플, 다른 특징들) | 없음 — 샘플 하나만으로도 계산 가능 | Transformer(5~7주차) |

두 기법 모두 학습 가능한 파라미터 γ, β는 그대로 유지한다 — 정규화가 표현력을 해치지 않도록, 표준화한 뒤 다시 원하는 스케일과 위치로 되돌릴 여지를 남겨두는 것이다.

### 2.7 이제 실전에서는: PyTorch가 대신 해주는 것들

앞서 우리는 Value라는 아주 작은 자동미분 엔진을 직접 만들어, 계산 그래프를 만들고 그 그래프를 거슬러 올라가며 기울기를 계산하는 과정을 한 줄씩 눈으로 확인했다. PyTorch 같은 딥러닝 프레임워크가 실전에서 하는 일은 정확히 이것과 같다 — 다만 숫자 하나(스칼라)가 아니라 수백만 개의 숫자를 담은 텐서(tensor) 단위로, 그것도 CPU가 아닌 GPU에서 대량 병렬로 처리한다는 점이 다를 뿐이다. 이 절에서는 우리가 손으로 짠 코드의 각 부분이 PyTorch의 어떤 개념에 대응하는지 하나씩 짝지어본다.

- **Tensor**: PyTorch의 \`torch.Tensor\`는 NumPy의 \`ndarray\`와 데이터 구조 자체는 동일하다 — 둘 다 같은 타입의 숫자를 다차원 배열로 담고, 인덱싱·브로드캐스팅·행렬 곱 같은 연산도 거의 그대로 대응된다(실제로 \`torch.from_numpy()\`로 메모리 복사 없이 서로 변환할 수 있다). 다른 점은 두 가지다. 첫째, 텐서는 \`.to("cuda")\`로 GPU 메모리로 옮겨 대량 병렬 연산을 시킬 수 있지만 NumPy 배열은 CPU에서만 동작한다. 둘째, 텐서는 \`requires_grad=True\`를 켜면 자신이 어떤 연산을 거쳐 만들어졌는지 계산 그래프를 계속 기록해 나중에 역전파에 쓸 수 있지만, NumPy 배열에는 이런 기록 기능이 아예 없다.

- **Autograd**: \`requires_grad=True\`인 텐서에 연산을 적용할 때마다, PyTorch는 앞서 만든 Value가 \`_prev\`와 \`_backward\`를 저장했던 것과 똑같이 결과 텐서에 \`grad_fn\`이라는 이름으로 "이 텐서가 어떤 연산과 어떤 입력들로부터 만들어졌는지"를 기록한다. \`loss.backward()\`를 호출하면 이 grad_fn들을 따라 위상정렬의 역순으로 그래프를 순회하며 연쇄법칙을 적용하는데, 이것이 정확히 우리가 만든 \`Value.backward()\`가 topo 리스트를 뒤집어 순회하며 \`_backward()\`를 실행하던 것과 동일한 알고리즘이다. 계산이 끝나면 각 리프(leaf) 텐서, 즉 \`requires_grad=True\`로 직접 만든 파라미터 텐서의 \`.grad\` 속성에 $\\partial L/\\partial\\theta$가 채워진다(앞서 살펴본 Value의 \`.grad\` 필드와 완전히 같은 역할). \`optimizer.step()\`은 이렇게 채워진 \`.grad\`를 읽어 2.3절의 갱신식(SGD, Adam)대로 파라미터를 갱신하고, \`optimizer.zero_grad()\`는 \`+=\`로 누적되는 성질(앞서 :::info 참고) 때문에 다음 스텝을 위해 \`.grad\`를 0으로 되돌리는 역할을 한다.

\`\`\`image
src: /images/week3/reverse-mode-autodiff.png
alt: 함수 f(x1,x2)=x1*x2+sin(x1)의 계산 그래프를 손실 쪽에서 입력 쪽으로 거슬러 올라가며 각 노드의 국소 미분을 곱해 전달하는 역방향 자동미분 과정을 보여주는 다이어그램
caption: 역방향 자동미분(reverse-mode automatic differentiation) — f(x1,x2)=x1x2+sin(x1)의 계산 그래프를 출력(오른쪽)에서 입력(왼쪽) 방향으로 한 번만 훑으면서 연쇄법칙으로 모든 편미분을 동시에 얻는다. PyTorch의 loss.backward()가 grad_fn을 따라 수행하는 것이 바로 이 알고리즘이다.
credit: Berland (en.wikipedia), Public Domain, Wikimedia Commons
width: 960
height: 560
\`\`\`

- **nn.Module**: 파라미터를 가진 레이어(예: Wx+b를 계산하는 완전연결층)를 재사용 가능한 단위로 묶는 클래스다. \`__init__\`에서 그 층이 가질 파라미터(가중치, 편향)를 \`nn.Linear\`, \`nn.Conv2d\` 같은 하위 모듈로 선언하고, \`forward\`에서는 입력이 그 파라미터들을 거쳐 출력으로 바뀌는 순전파 계산만 정의한다. 신기하게도 backward는 따로 작성하지 않는다 — forward 안에서 사용한 텐서 연산 하나하나가 이미 autograd에 기록되므로, \`loss.backward()\`를 부르는 순간 이 모듈 내부의 모든 파라미터에 대한 기울기가 자동으로 계산된다.

\`\`\`python
import torch, torch.nn as nn

class TwoLayerMLP(nn.Module):
    def __init__(self, d_in, d_hidden, d_out):
        super().__init__()
        self.fc1 = nn.Linear(d_in, d_hidden)
        self.fc2 = nn.Linear(d_hidden, d_out)

    def forward(self, x):
        h = torch.relu(self.fc1(x))
        return self.fc2(h)

model = TwoLayerMLP(3, 4, 1)
\`\`\`

- **Optimizer (torch.optim)**: 2.3절에서 손으로 유도한 Adam의 갱신식(m_t, v_t의 지수이동평균과 편향 보정, $\\theta \\leftarrow \\theta - \\eta\\,\\hat m_t/(\\sqrt{\\hat v_t}+\\epsilon)$까지 전부)을 한 줄로 대신해주는 것이 \`torch.optim.Adam\`이다.

\`\`\`python
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, betas=(0.9, 0.999), eps=1e-8)
\`\`\`

\`model.parameters()\`가 \`__init__\`에서 선언한 모든 층의 파라미터를 하나로 모아 넘겨주고, 옵티마이저는 매 \`step()\`마다 각 파라미터의 \`.grad\`를 읽어 자신이 관리하는 $m, v$ 버퍼를 갱신한 뒤 파라미터 값을 직접 수정한다.

- **Dataset / DataLoader**: 학습 데이터를 미니배치 단위로 잘라 순전파에 넣어주는 역할을 담당한다. \`Dataset\`은 \`__len__\`(전체 샘플 개수)과 \`__getitem__\`(인덱스로 샘플 하나를 꺼내는 방법)이라는 두 메서드만 정의하면 되는 간단한 인터페이스이고, \`DataLoader\`가 그 위에서 셔플·배치 묶기·병렬 로딩을 대신해준다.

\`\`\`python
from torch.utils.data import Dataset, DataLoader

class MoonsDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y)
    def __len__(self):
        return len(self.X)
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

loader = DataLoader(MoonsDataset(X, y), batch_size=32, shuffle=True)
\`\`\`

- **Training / Validation Loop**: 표준적인 학습 루프는 "에폭을 반복 → 그 안에서 배치를 반복 → 순전파(forward) → 손실 계산(loss) → 역전파(backward) → 파라미터 갱신(step) → 기울기 초기화(zero_grad)"라는 여섯 단계를 그대로 되풀이하는 구조다.

\`\`\`python
for epoch in range(num_epochs):
    model.train()
    for xb, yb in train_loader:
        pred = model(xb)
        loss = loss_fn(pred, yb)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    model.eval()
    with torch.no_grad():
        val_loss = sum(loss_fn(model(xb), yb).item() for xb, yb in val_loader)
    print(epoch, val_loss)
\`\`\`

검증(validation) 루프에서는 두 가지가 달라진다. \`model.eval()\`은 2.6절에서 배운 BatchNorm이 미니배치 통계 대신 학습 중 누적해온 이동평균을 쓰도록 모드를 바꾸고, \`torch.no_grad()\`는 이 블록 안에서는 계산 그래프를 아예 기록하지 않도록 지시한다. 검증 시점에는 backward를 부를 일이 없으므로 그래프를 기록해봐야 메모리와 연산만 낭비되기 때문이다.

- **Checkpoint**: \`torch.save(model.state_dict(), "ckpt.pt")\`로 그 시점의 모든 파라미터 값을 파일로 저장하고, \`model.load_state_dict(torch.load("ckpt.pt"))\`로 복원한다. 학습이 길게는 며칠씩 걸리는 큰 모델에서는 중간에 서버가 죽거나 재시작해야 할 때를 대비해 정기적으로 체크포인트를 저장해두고, 검증 손실이 가장 낮았던 시점의 체크포인트를 따로 보관해두면 마지막 에폭이 아니라 "가장 성능이 좋았던 순간"의 모델을 최종 결과물로 쓸 수 있다.

- **CPU / GPU / CUDA**: 신경망 학습의 대부분은 행렬 곱과 원소별 연산으로 이뤄지는데, 이 연산들은 수십만 개의 독립적인 곱셈-덧셈으로 쪼갤 수 있어 병렬화에 매우 유리하다. CPU는 코어 수가 적은 대신 코어 하나하나의 성능이 강력해 복잡한 분기와 순차 로직에 강하고, GPU(그래픽 처리 장치)는 코어 하나하나는 단순하지만 수천 개를 동시에 돌릴 수 있어 "똑같은 연산을 아주 많은 데이터에 동시에 적용하는" 행렬 연산에 압도적으로 유리하다. CUDA는 NVIDIA GPU에서 이런 범용 병렬 연산을 수행할 수 있게 해주는 프로그래밍 인터페이스로, PyTorch는 텐서를 \`.to("cuda")\`로 옮기기만 하면 이후의 모든 연산을 내부적으로 CUDA 커널 호출로 바꿔 GPU에서 병렬 실행해준다.

- **Mixed Precision**: 기본적으로 텐서의 숫자는 32비트 부동소수점(FP32)으로 저장되는데, 딥러닝 연산 대부분은 그렇게까지 높은 정밀도가 필요하지 않다는 점에 착안해 일부 연산을 16비트(FP16 또는 BF16)로 대신 계산하는 기법이 혼합 정밀도(mixed precision) 학습이다. 숫자를 절반 크기로 저장하므로 GPU 메모리를 적게 쓰고, 한 번에 메모리에 실을 수 있는 데이터가 늘어나는 데다 최신 GPU는 16비트 연산 전용 회로를 따로 갖추고 있어 속도도 훨씬 빨라진다. 다만 표현 범위가 좁아진 만큼 작은 기울기 값이 0으로 반올림돼버리는 문제가 생길 수 있어, PyTorch의 \`torch.cuda.amp\`는 손실 값을 일부러 키워뒀다가(loss scaling) 나중에 다시 축소하는 방식으로 이 문제를 보완한다.

- **Hugging Face**: \`transformers\` 라이브러리는 BERT, GPT 계열처럼 이미 대규모 데이터로 사전학습(pretrained)된 모델의 가중치와 구조를 단 몇 줄로 불러와 바로 쓸 수 있게 해준다. 지금까지 배운 nn.Module, optimizer, training loop는 이런 사전학습 모델을 가져와 우리 데이터에 맞게 미세조정(fine-tuning)할 때도 그대로 재사용된다 — 5~7주차에서 Transformer, LLM, RAG를 다룰 때는 모델을 처음부터 새로 학습시키는 대신 Hugging Face 생태계에서 이미 학습된 모델을 가져와 그 위에 쌓아 올리는 방식을 계속 쓰게 될 것이므로, 지금 이 절에서 짝지어본 대응 관계를 기억해두면 그때 훨씬 수월하게 이해할 수 있다.

이 대응 관계를 표로 한 번에 정리하면 다음과 같다.

| 우리가 앞서 손으로 짠 것 | PyTorch가 대신 해주는 것 |
| --- | --- |
| Value.data | tensor의 값 |
| Value.grad | tensor.grad |
| Value._prev, _op | tensor.grad_fn (계산 그래프 기록) |
| Value.backward()의 topo 정렬 + 역순회 | loss.backward() |
| 2.3절에서 손으로 쓴 Adam 갱신식 | torch.optim.Adam.step() |
| 갱신 후 grad를 0으로 되돌리는 코드 | optimizer.zero_grad() |

### PyTorch로 make_moons 분류해보기

PyTorch로 넘어가면 겉모습은 확 달라지지만 원리는 앞서 만든 Value 클래스와 한 치도 다르지 않다. 텐서 하나하나가 Value처럼 자신이 어떻게 만들어졌는지를 grad_fn이라는 이름으로 기억하고 있고, loss.backward()를 호출하면 우리가 직접 짠 backward()와 똑같이 계산 그래프를 위상정렬 순서로 거슬러 올라가며 기울기를 채워 넣는다. 다를 뿐인 것은 숫자 하나(스칼라)가 아니라 수천~수백만 개의 숫자를 담은 텐서 단위로, 그것도 GPU에서 대량으로 병렬 처리한다는 점이다.

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

opt.zero_grad()를 빼먹으면 어떤 일이 벌어질지 예측해보자. 앞서 Value의 _backward가 grad에 값을 대입(=)하지 않고 누적(+=)한다고 했던 것을 그대로 떠올리면 된다. PyTorch의 텐서도 정확히 같은 규칙을 따른다. zero_grad()로 이전 스텝의 기울기를 0으로 리셋해주지 않으면, 새로 계산된 기울기가 이전 스텝의 기울기 위에 계속 쌓여서 실제보다 훨씬 크고 스텝을 반복할수록 계속 불어나는 기울기로 파라미터를 갱신하게 되고, 결국 학습이 이상하게 발산하거나 망가진다. 은닉 유닛 수를 1, 2, 4, 64로 바꿔가며 실행해보면, 표현력이 부족한(유닛이 1~2개인) 네트워크는 make_moons의 초승달 모양 경계를 곧게 하나의 직선으로 뭉개버리는 반면, 유닛이 충분히 많아지면(64개) 결정경계가 실제 데이터의 곡선 모양을 정교하게 따라가는 것을 눈으로 확인할 수 있을 것이다.

### 같은 선형회귀를 두 번 풀어보기 — NumPy 수동 구현 vs PyTorch

1주차의 선형회귀를 다시 가져와, 완전히 같은 데이터에 완전히 같은 경사하강법 스텝 수·학습률을 적용해서 두 가지 방식으로 풀어보자. 하나는 지금까지처럼 미분 공식을 손으로 유도해 코드로 옮긴 NumPy 버전이고, 다른 하나는 앞서 배운 PyTorch의 autograd와 optimizer에 그 계산을 통째로 맡기는 버전이다. 같은 X, y로 학습하므로 두 버전의 최종 w, b는 (참값 w=3, b=2 근처로) 거의 같은 값에 수렴해야 한다 — 이것이 "PyTorch가 우리가 손으로 한 것과 수학적으로 동일한 일을 하고 있다"는 가장 직접적인 증거다.

\`\`\`python
# (1) NumPy 수동 구현 — dL/dw, dL/db를 직접 유도해서 코드로 옮긴다
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

\`\`\`python
# (2) 완전히 같은 X, y_true를 PyTorch로 — 미분 공식은 단 한 줄도 등장하지 않는다
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

두 print 문을 나란히 실행해보면 w, b, loss가 소수점 셋째 자리 안팎에서 거의 일치한다(둘 다 참값 w=3, b=2에 수렴하고, np.isclose(w, w_t, atol=1e-2)가 참이 될 것이다). 그런데 정작 눈여겨봐야 할 것은 최종 숫자의 일치보다 "학습 루프 안에 무엇이 남아있고 무엇이 사라졌는가"다. NumPy 버전의 루프 7줄 중 두 줄(grad_w, grad_b)은 이 문제(선형회귀 + MSE)에 대해서만 유효한, 손으로 유도한 미분 공식이다 — 모델을 2층 MLP로 바꾸면 이 두 줄은 완전히 새로 유도해서 다시 써야 한다. 반면 PyTorch 버전의 루프 5줄 중에는 w나 b를 직접 언급하는 코드가 단 한 줄도 없다. \`loss.backward()\`가 미분 공식이 있던 자리를 대신하고, \`opt.step()\`이 파라미터 갱신 두 줄을 대신한다. 그래서 \`model = torch.nn.Linear(1, 1)\`을 앞서 만든 \`nn.Sequential(nn.Linear(2,16), nn.ReLU(), ...)\`처럼 훨씬 복잡한 네트워크로 바꿔도, 학습 루프의 나머지 5줄은 단 한 글자도 손댈 필요가 없다 — 이것이 "코드 줄 수가 줄었다"는 것보다 훨씬 중요한, autograd와 optimizer가 만들어주는 진짜 자동화다.
`,
  quiz: [
    { id: "w3-q1", question: "L = (wx − y)², x=2, w=1, y=5 일 때 $\\dfrac{dL}{dw}$는? 계산 과정을 노드별로 나눠서 보여라." },
    { id: "w3-q2", question: "곱셈 노드 z=a·b에서 상류 기울기가 g로 내려왔을 때 $\\dfrac{dL}{da}$를 구하는 식은? 이 식이 왜 'b가 클수록 a의 책임도 커진다'는 직관과 맞아떨어지는지 설명하라." },
    { id: "w3-q3", question: "활성화 함수가 없는 3층 MLP는 왜 표현력 관점에서 1층 선형모델과 동일한가?" },
    { id: "w3-q4", question: "본문 예제 L=(w·x+c)² 에서 w=2, x=3, c=1을 w=−1, x=4, c=2로 바꿔서 순전파 값과 $\\dfrac{dL}{dw}$, $\\dfrac{dL}{dx}$를 직접 손으로 계산하라." },
    { id: "w3-q5", question: "Adam이 SGD보다 학습 초반에 더 빠르게 손실을 줄이는 경향을 보이는 이유를 파라미터별 적응 학습률 관점에서 설명하라." },
    { id: "w3-q6", question: "가중치를 전부 0으로 초기화하면 왜 학습이 되지 않는가? '대칭성'이라는 단어를 사용해 설명하라." },
    { id: "w3-q7", question: "micrograd의 Value 클래스에서 backward()가 _backward()를 실행하기 전에 위상정렬(topo)을 먼저 하는 이유는 무엇인가?" },
    { id: "w3-q8", question: "ReLU 노드에서 순전파 입력이 음수였을 때 역전파로 전달되는 기울기 값은 얼마인가? 이 사실이 '죽은 ReLU(dead ReLU)' 문제와 어떻게 연결되는가?" },
    { id: "w3-q9", question: "한 뉴런의 출력 z가 fan_in개의 항을 더한 것이라는 사실과 1주차의 '분산은 더할수록 커진다'는 원리를 연결해, 왜 가중치의 분산을 fan_in에 반비례하게 잡아야 하는지 설명하라." },
    { id: "w3-q10", question: "어떤 네트워크에서 층마다 활성화의 표준편차가 1.2배씩 커진다면, 15개 층을 통과했을 때 표준편차는 원래의 약 몇 배가 되는가? (1.2^15을 직접 계산하고, 그 결과가 왜 '깊은 네트워크일수록 초기화에 민감하다'는 주장의 근거가 되는지도 함께 설명하라.)" },
    { id: "w3-q11", question: "PyTorch에서 requires_grad=True로 만든 텐서 w에 대해 loss.backward()를 호출하면 w.grad에 어떤 값이 채워지는가? 이것이 3.1절 Value 클래스의 grad 필드와 정확히 같은 역할을 하는 이유를 설명하라." },
    { id: "w3-q12", question: "학습 루프에서 optimizer.zero_grad()를 빼먹으면 어떤 문제가 생기는가? .grad가 '=' 대신 '+='로 누적된다는 사실과 연결해 설명하라." },
    { id: "w3-q13", question: "nn.Module 서브클래스를 정의할 때 __init__과 forward는 각각 어떤 역할을 맡는가? backward 메서드를 직접 작성하지 않아도 그레디언트가 자동으로 계산되는 이유는 무엇인가?" },
    { id: "w3-q14", question: "똑같은 행렬 곱 연산이 CPU보다 GPU에서 훨씬 빠르게 수행되는 이유를, 두 장치의 코어 수와 코어당 성능의 차이 관점에서 설명하라." },
    { id: "w3-q15", question: "혼합 정밀도(mixed precision) 학습이 메모리 사용량과 학습 속도 면에서 유리한 이유는 무엇인가? FP16을 그대로 쓸 때 생길 수 있는 문제와, PyTorch가 이를 보완하는 방법(loss scaling)을 함께 설명하라." },
    { id: "w3-q16", question: "PyTorch의 Dataset 클래스가 반드시 정의해야 하는 두 메서드는 무엇이며, DataLoader는 그 위에서 각각 어떤 일을 대신 해주는가?" },
    { id: "w3-q17", question: "GELU와 ReLU를 입력이 음수인 구간에서의 동작을 중심으로 비교하라. GELU가 ReLU에 비해 '죽은 뉴런' 문제를 완화하는 이유는 무엇인가?" },
    { id: "w3-q18", question: "Batch Normalization과 Layer Normalization은 각각 어떤 축(배치 축 vs 특징 축)을 따라 평균·분산을 계산하는가? Transformer 계열 모델이 BatchNorm 대신 LayerNorm을 쓰는 이유를 배치 크기·시퀀스 길이 관점에서 설명하라." },
  ],
  worksheet: [
    { label: '① 오늘의 질문 — "신경망은 실수로부터 어떻게 배우는가?"', hint: "오늘 배운 내용을 한 문장 질문으로 바꿔 적어보세요. 예: '역전파는 왜 순전파 한 번 값으로 모든 기울기를 구할 수 있을까?'" },
    { label: "② 키워드 6개", hint: "쉼표로 구분해 6개를 적어보세요. 예: 연쇄법칙, 계산 그래프, 국소 미분, 위상정렬, 기울기 소실, 적응 학습률." },
    { label: "③ 그림 — L=(w·x+c−y)² 의 계산 그래프를 그리고 각 엣지에 기울기 적기", hint: "노드를 곱셈·덧셈·제곱으로 쪼갠 뒤, 본문 예제처럼 임의의 숫자를 대입해 각 엣지 위에 순전파 값과 역전파 기울기를 함께 적어보세요." },
    { label: "④ 수식 — 한 층의 dL/dW, dL/dx 유도. shape 표기", hint: "책을 보지 말고 z=Wx+b에서 δ=dL/dz로부터 dL/dW, dL/db, dL/dx를 유도하고, 각 결과의 shape이 W, b, x와 맞는지 직접 확인해보세요." },
    { label: '⑤ 설명하기 — "역전파는 그냥 연쇄법칙인데 왜 혁신이었나?" (계산 재사용, 효율 O(순전파))', hint: "'계산 재사용'이라는 단어를 반드시 넣어서, 왜 순전파 한 번 비용으로 파라미터 전부의 기울기를 구할 수 있는지 초등학생도 알아들을 수준으로 설명해보세요." },
    { label: "⑥ 막힌 곳 / 보완", hint: "책이나 본문을 펴서 확인한 뒤, 다른 색 펜으로 보완한 내용을 적어보세요." },
  ],
  assignmentMd: `
### 필수

1. 3.1의 Value 클래스에 \`__pow__\`, \`tanh\`, \`__neg__\`, \`__sub__\`, \`__truediv__\` 를 추가하고, 각 연산의 국소 미분을 손으로 유도해 주석으로 남길 것.
2. Value로 2층 MLP(뉴런/층/MLP 클래스)를 만들어 make_moons에서 정확도 90% 이상 달성. 손실 곡선과, 학습이 끝난 뒤의 결정경계 시각화 그림을 함께 제출할 것.
3. **Gradient check**: 임의의 그래프에서 수치미분과 역전파 값의 상대오차를 출력하고, 상대오차가 1e-5를 넘는 연산이 있다면 어느 부분의 역전파 구현이 잘못됐는지 찾아 고칠 것.
4. 동일 문제를 PyTorch(nn.Module)로 구현해 결과와 학습 속도를 비교. Value 구현이 느린 이유 3가지 서술.
5. 본문 2.2절의 계산 그래프 예제(L=(w·x+c)²)를 참고하여, 여러분만의 작은 계산 그래프(노드 4~6개, 곱셈·덧셈·거듭제곱 중 최소 두 종류 이상 섞어서)를 손으로 설계하고 순전파 값과 모든 노드의 역전파 기울기를 표로 정리한 뒤, Value 클래스로 동일한 계산을 코드로 재현해 손으로 구한 값과 일치하는지 확인할 것.

### 심화

- SGD/Momentum/Adam을 직접 구현해 수렴 속도 비교 그래프.
- ReLU vs tanh, 20층 깊이에서 기울기 크기를 층별로 plot (소실/폭발 관찰).

### 채점 (10점)

| 항목 | 점수 |
| --- | --- |
| 미분 유도 정확성 | 2 |
| 구현 정확성(gradient check 통과) | 3 |
| 계산 그래프 설계·검증(5번) | 2 |
| 실험·해석 | 2 |
| 코드 품질 | 1 |
`,
  dueNote: "제출: 일요일 23:59",
};

export default week3;
