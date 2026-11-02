import { defineLesson, md } from "../../kit";
import exercises from "./labs/micrograd";

export default defineLesson({
  id: "micrograd",
  title: "자동미분 엔진 구현",
  tier: "core",
  concepts: ["backprop-autodiff"],
  goal: "Value 클래스가 계산 그래프를 기록하고 위상정렬 역순으로 `_backward`를 실행하는 원리를 설명하고, 새 연산을 추가해 gradient check로 검증할 수 있다.",
  why: "",
  body: md`
Value 클래스가 하는 일을 한 문장으로 요약하면, "숫자 하나(data)에 그 숫자가 어떻게 만들어졌는지에 대한 기억(_prev, _op)과, 자신에게 기울기가 도착했을 때 그것을 부모에게 어떻게 나눠줄지에 대한 지침서(_backward)를 함께 가지고 있는 객체"다. 여기서 눈여겨봐야 할 설계 포인트가 하나 있다. \`__add__\`나 \`__mul__\` 안에서 _backward를 지금 당장 실행하지 않고 나중에 실행할 함수로만 저장해둔다는 점이다(파이썬의 클로저 기능을 쓴 것이다). 왜 이렇게 할까? 순전파를 하는 시점에는 아직 이 노드의 출력이 최종 손실에 얼마나 기여할지(out.grad)를 알 수 없기 때문이다. 그 값은 순전파가 전부 끝나고 손실 L이 나온 뒤, 역전파가 거꾸로 이 노드까지 도달했을 때야 비로소 정해진다. 그래서 "어떻게 나눠줄지에 대한 계산 방법"만 미리 클로저로 포장해 저장해두고, 실제 계산은 그 정보(out.grad)가 준비된 나중 시점에 실행하는 것이다. 이것이 지연 계산(lazy evaluation)이고, PyTorch가 모든 텐서 연산 뒤에서 grad_fn을 저장해뒀다가 loss.backward() 호출 시점에야 순서대로 실행하는 것과 똑같은 아이디어다.

\`\`\`python
class Value:
    def __init__(self, data, _children=(), _op=""):
        self.data, self.grad = data, 0.0       # data: 이 노드의 실제 숫자값 / grad: dL/d(이 노드), 처음엔 0
        # _prev: 나를 만드는 데 쓰인 부모 Value들(set으로 저장: 앞 단계 문법 ⑤)
        # _backward: "기울기가 도착하면 부모에게 어떻게 나눠줄지"를 담은 함수. 지금은 일단 아무것도 안 하는 함수(lambda: None)로 채워둔다
        self._prev, self._backward = set(_children), lambda: None

    def __add__(self, o):                       # self + o 를 실행하면 자동 호출됨(앞 단계 문법 ②)
        o = o if isinstance(o, Value) else Value(o)   # o가 일반 숫자(5 등)면 Value로 감싸준다
        out = Value(self.data + o.data, (self, o), "+")   # 실제 덧셈. (self, o)를 _children으로 넘겨 부모 기록
        def _backward():                         # 클로저(앞 단계 문법 ③): 지금은 정의만, 실행은 나중에 backward()가 함
            self.grad += out.grad                # 덧셈은 상류 기울기를 그대로 나눠준다(역전파 단계의 규칙)
            o.grad    += out.grad                # 양쪽 다 += 로 누적(아래 :::info 참고)
        out._backward = _backward                # 방금 만든 클로저를 out에 매달아둔다
        return out

    def __mul__(self, o):                        # self * o 를 실행하면 자동 호출됨
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data * o.data, (self, o), "*")
        def _backward():
            self.grad += o.data * out.grad       # 곱셈은 "상대방의 값"을 곱해서 전달(역전파 단계의 규칙)
            o.grad    += self.data * out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0, self.data), (self,), "relu")
        def _backward(): self.grad += (out.data > 0) * out.grad   # 승자독식: 양수만 기울기 통과, 음수는 0
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()          # topo: 위상정렬 결과를 쌓을 리스트 / seen: 이미 방문한 노드(중복 방지)
        def build(v):                    # 재귀 함수(앞 단계 문법 ④): 후위순회로 위상정렬을 만든다
            if v not in seen:
                seen.add(v)
                for c in v._prev: build(c)   # 부모(자신을 만든 노드들)를 먼저 방문
                topo.append(v)                # 부모를 다 처리한 뒤에야 자기 자신을 추가
        build(self)                      # self(=최종 손실 L)부터 시작해 그래프 전체를 훑는다
        self.grad = 1.0                  # dL/dL = 1 에서 역전파 시작
        for v in reversed(topo):         # topo를 뒤집어 L → 입력 방향으로 순회(앞 단계 문법 ⑤ reversed())
            v._backward()                # 이제서야 각 노드의 클로저가 실제로 실행된다

a, b = Value(2.0), Value(-3.0)
L = (a*b + 10).relu()
L.backward(); print(a.grad, b.grad)   # 기댓값: -3.0, 2.0
\`\`\`

backward() 메서드 안에서 topo 리스트를 만드는 부분이 왜 필요한지 짚고 넘어가자. 어떤 노드의 grad를 확정하려면, 그 노드를 입력으로 사용하는 모든 하류(downstream) 노드의 _backward()가 먼저 실행되어 out.grad가 전부 채워진 뒤여야 한다. grad는 한 노드가 여러 경로에 쓰였을 때 그 기여분이 +=로 누적되는 값이므로(아래 :::info 블록 참고), 하류 노드 중 하나라도 먼저 처리되지 않은 채로 값을 읽으면 아직 더해지지 않은 기여분이 누락된다. 위상정렬(topological sort)은 정확히 이 조건, 즉 그래프의 모든 간선 $(u \rightarrow v)$에 대해 u가 v보다 먼저 나오도록 노드 전체를 한 줄로 정렬하는 알고리즘이다. build() 함수가 재귀로 자식(자신을 만드는 데 쓰인 부모 노드들)을 먼저 방문하고 나서야 자기 자신을 topo 리스트에 추가하는 것이 후위순회(post-order traversal)이며, 이것이 위상정렬 순서를 만들어내는 표준적인 구현 방법이다. 그 결과를 reversed()로 뒤집어 손실 L(topo의 맨 끝, 즉 그래프에서 가장 나중에 만들어진 노드)부터 시작해 입력 쪽(topo의 맨 앞)으로 순회하며 _backward()를 실행하면, 각 노드가 자신의 grad를 확정하는 시점에는 그 노드를 사용하는 모든 하류 노드의 _backward()가 이미 실행되어 out.grad 기여분이 전부 반영되어 있음이 보장된다.

위 코드의 a, b = Value(2.0), Value(-3.0) 예제를 직접 손으로 따라가 보자. a*b = -6, 여기에 10을 더하면 4, relu(4) = 4이므로 L.data = 4다. backward()를 부르면 L.grad = 1에서 시작해서, relu 노드는 out.data(=4)가 양수이므로 기울기 1을 그대로 통과시켜 (a*b+10)의 기울기도 1이 된다. 덧셈 노드는 기울기를 그대로 나눠주므로 a*b의 기울기도 1, 10의 기울기도 1이다. 곱셈 노드에서는 a.grad += b.data $\times$ 1 = -3, b.grad += a.data $\times$ 1 = 2가 되어, 코드 주석에 적힌 기댓값 -3.0, 2.0과 정확히 일치한다.

[[diagram:micrograd-topo]]

micrograd와 PyTorch의 autograd는 손실(출력)에서 입력 쪽으로 거슬러 가는 **역방향 모드** 자동미분이다. 입력 쪽에서 출발하는 순방향 모드와의 차이, 중간값을 모두 저장해야 하는 메모리 문제는 심화 과정의 「자동미분의 두 모드」 단계에서 다룬다.

:::info 주의
\`+=\`로 기울기를 누적하는 이유: 한 변수가 여러 경로에 쓰이면 기울기가 합산된다(다변수 연쇄법칙, fan-out gradient accumulation). 이를 \`=\`로 쓰면 버그가 생긴다. 예를 들어 $y = x\cdot x + x$에서 $x$는 세 경로로 쓰이므로 $x = 3$일 때 기울기는 $2x + 1 = 7$이어야 하는데, \`=\`로 덮어쓰면 마지막에 계산된 경로의 값만 남아 7이 아닌 값이 나온다.
:::

[[diagram:grad-accumulate]]

### 엔진으로 실제로 학습시켜 보기

이 엔진이 정말 "학습"을 할 수 있는지 확인해 보자. 아래 셀은 위 Value에 뺄셈만 더한 축약판으로, 데이터 $y = 2x + 1$에서 $w$, $b$를 경사하강법으로 찾는다. 1주차에 손으로 유도했던 미분 공식이 코드 어디에도 없다는 점에 주목하자. 손실을 Value 연산으로 계산하고 \`loss.backward()\`를 부르면 \`w.grad\`, \`b.grad\`가 저절로 채워진다.

\`\`\`python
import math

class Value:
    def __init__(self, data, _children=()):
        self.data, self.grad = data, 0.0
        self._prev, self._backward = set(_children), lambda: None
    def __add__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data + o.data, (self, o))
        def _backward():
            self.grad += out.grad; o.grad += out.grad
        out._backward = _backward
        return out
    def __mul__(self, o):
        o = o if isinstance(o, Value) else Value(o)
        out = Value(self.data * o.data, (self, o))
        def _backward():
            self.grad += o.data * out.grad; o.grad += self.data * out.grad
        out._backward = _backward
        return out
    def __sub__(self, o):
        return self + (o * -1 if isinstance(o, Value) else Value(-o))
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

# 데이터: y = 2x + 1. 파라미터 w, b를 Value로 두고 경사하강법으로 찾는다
data = [(0.0, 1.0), (1.0, 3.0), (2.0, 5.0), (3.0, 7.0)]
w, b = Value(0.0), Value(0.0)
for step in range(200):
    loss = Value(0.0)
    for x, y in data:
        err = w * x + b - y
        loss = loss + err * err
    loss = loss * (1 / len(data))           # 평균제곱오차
    w.grad, b.grad = 0.0, 0.0               # += 로 누적되므로 매 스텝 0으로 되돌린다
    loss.backward()                          # 계산 그래프를 거슬러 w.grad, b.grad를 채운다
    w.data -= 0.05 * w.grad                  # 경사하강법 갱신
    b.data -= 0.05 * b.grad
    if step in (0, 1, 199):
        print(f"step {step:3d}: loss={loss.data:.4f}, w={w.data:.3f}, b={b.data:.3f}")
\`\`\`

첫 스텝의 손실 21에서 시작해 200스텝 뒤에는 $w = 2$, $b = 1$을 정확히 찾는다. 루프 안의 \`w.grad, b.grad = 0.0, 0.0\`이 빠지면 어떻게 될까? 기울기가 \`+=\`로 누적되므로 매 스텝 이전 기울기가 쌓여 걸음이 점점 커지고 학습이 망가진다. PyTorch의 \`optimizer.zero_grad()\`가 바로 이 줄이다.
`,
  checks: [
    {
      key: "c1",
      question: "Value의 `_backward`를 연산 시점에 바로 실행하지 않고 클로저로 저장해두는 이유는?",
      choices: ["메모리를 아끼려고", "순전파 시점에는 아직 `out.grad`(상류 기울기)를 모르기 때문에", "파이썬 문법상 어쩔 수 없어서", "속도를 높이려고"],
      answer: 1,
      explanation: "상류 기울기는 손실이 계산된 뒤 역전파가 그 노드에 도착해야 정해진다. 그래서 \"나중에 이렇게 계산하라\"는 방법만 저장해둔다(지연 계산).",
    },
    {
      key: "c2",
      question: "$y = x \\cdot x + x$에서 $x = 3$일 때, `_backward`가 `+=` 대신 `=`로 기울기를 덮어쓰면 생기는 문제는?",
      choices: ["아무 문제 없다", "$x$가 여러 경로로 쓰였는데 마지막 경로의 기울기만 남아 7이 아닌 틀린 값이 나온다", "프로그램이 멈춘다", "기울기가 항상 0이 된다"],
      answer: 1,
      explanation: "한 변수가 여러 경로에 쓰이면 각 경로의 기울기를 더해야 한다(다변수 연쇄법칙). 덮어쓰면 일부 경로의 기여가 사라진다.",
    },
    {
      key: "c3",
      question: "$\\tanh$ 노드의 국소 미분은? ($t = \\tanh z$)",
      choices: ["$t$", "$1 - t^2$", "$1 + t^2$", "$\\cosh z$"],
      answer: 1,
      explanation: "$\\frac{d}{dz}\\tanh z = 1 - \\tanh^2 z$. 이 식으로 채운 역전파는 수치미분과 $10^{-11}$ 수준까지 일치한다.",
    },
    {
      key: "c4",
      question: "Value로 만든 학습 루프에서 매 스텝 `w.grad = 0.0`으로 되돌리지 않으면 어떻게 되는가?",
      choices: ["기울기가 `+=`로 이전 스텝 값 위에 쌓여 갈수록 커지고 학습이 불안정해진다", "기울기가 항상 0이 된다", "아무 차이가 없다", "순전파가 계산되지 않는다"],
      answer: 0,
      explanation: "`_backward`는 기울기를 누적한다(여러 경로를 합치기 위해). 스텝이 바뀌면 지난 기울기는 버려야 하므로 0으로 초기화한다. PyTorch의 `zero_grad()`와 같은 역할이다.",
    },
    {
      key: "c5",
      question: "`loss.backward()`를 호출한 직후 채워지는 것은?",
      choices: ["그래프에 있는 모든 Value의 `.grad`(손실에 대한 기울기)", "모든 Value의 `.data`", "갱신된 파라미터 값", "새 계산 그래프"],
      answer: 0,
      explanation: "`backward()`는 기울기만 계산한다. 파라미터를 바꾸는 것은 그 뒤의 갱신 코드(`w.data -= lr * w.grad`)이고, PyTorch에서는 `optimizer.step()`이 맡는다.",
    },
    {
      key: "c6",
      question: "`Value.__mul__`에서 `out._backward = _backward` 줄을 빠뜨린 채 `L = (a * b + c).relu()`에 `L.backward()`를 실행하면?",
      choices: ["오류가 나서 실행이 멈춘다", "`c.grad`는 정상이지만 `a.grad`, `b.grad`는 0으로 남는다. 곱셈 노드의 기본 `_backward`가 아무것도 하지 않기 때문이다", "모든 grad가 0이 된다", "결과는 정상이다. `backward()`가 알아서 곱셈 규칙을 적용한다"],
      answer: 1,
      explanation: "`Value`는 생성될 때 `_backward = lambda: None`으로 시작합니다. 곱셈 결과 노드에 클로저를 매달지 않으면, 역전파가 그 노드에 도착해도 부모(a, b)에게 기울기를 나눠 주지 않습니다. 덧셈 노드를 거친 `c`까지는 정상입니다. 오류 없이 조용히 틀리므로 gradient check가 필요합니다.",
    },
  ],
  exercises,
  descriptive: [
    {
      key: "d1",
      question: "micrograd의 Value 클래스에서 backward()가 _backward()를 실행하기 전에 위상정렬(topo)을 먼저 하는 이유는 무엇인가?",
      answer: md`
어떤 노드의 grad를 확정하려면 그 노드의 출력을 사용한 모든 하위 노드들의 backward가 먼저 끝나 있어야 하기 때문이다. 위상정렬 없이 임의 순서로 실행하면 아직 일부 경로의 기울기가 도착하기 전에 grad를 완성된 값처럼 써버리는 오류가 생긴다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "`x = Value(3.0); y = x * x + x; y.backward()`에서 `x.grad`가 7이 되는 과정을, 계산 그래프의 노드와 `_backward` 호출 순서로 설명하십시오. `+=` 대신 `=`를 쓰면 몇이 되는지도 적습니다.",
      answer: md`
그래프는 $m = x \cdot x$(곱셈), $y = m + x$(덧셈) 두 노드입니다. 위상정렬 역순으로 먼저 $y$의 grad를 1로 두고 덧셈 노드의 \`_backward\`가 $m$과 $x$에 각각 1을 더합니다(x.grad = 1). 다음으로 곱셈 노드의 \`_backward\`가 실행되는데, 두 피연산자가 모두 $x$라서 \`self.grad += o.data * out.grad\`(3)와 \`o.grad += self.data * out.grad\`(3)가 같은 $x$에 두 번 더해져 1 + 3 + 3 = 7이 됩니다. \`=\`를 쓰면 마지막 대입만 남아 덧셈 경로의 1이 지워지고 3이 됩니다. 같은 변수가 여러 경로로 쓰일 때 기울기는 모든 경로의 합이라는 연쇄법칙을 \`+=\`가 구현합니다.
`,
      keyPoints: ["그래프: m = x·x, y = m + x", "덧셈 노드가 x에 1을 전달", "곱셈 노드가 x에 3을 두 번 전달", "합 7 (경로별 기울기의 합)", "=를 쓰면 마지막 값 3만 남는다"],
    },
  ],
  references: [
    { title: "Andrej Karpathy — micrograd (GitHub)", url: "https://github.com/karpathy/micrograd", note: "본문 Value 클래스의 원본 저장소: engine.py가 100줄 남짓" },
    { title: "Karpathy — Neural Networks: Zero to Hero, 1강", url: "https://karpathy.ai/zero-to-hero.html", note: "micrograd를 처음부터 직접 만드는 2시간 영상(필수 권장)" },
  ],
});
