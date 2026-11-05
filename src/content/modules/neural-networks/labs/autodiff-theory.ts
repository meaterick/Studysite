import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "이원수 순방향 모드와 JVP·VJP",
    prompt: md`

본문의 두 도구를 구현합니다.

1. \`Dual\` 클래스: 값 \`val\`과 미분 \`dot\`을 함께 저장하며 \`+\`, \`*\`(숫자와의 연산 포함)를 지원합니다. 곱은 $(a + b\varepsilon)(c + d\varepsilon) = ac + (ad + bc)\varepsilon$입니다. \`dsin\`, \`dexp\`는 연쇄법칙으로 \`dot\`에 $\cos$, $\exp$를 곱합니다.
2. \`derivative(f, x)\`: \`f(Dual(x, 1.0)).dot\`
3. 연속 행렬곱 $y = W_3 W_2 W_1 x$(선형, 출력 벡터)에 대해 \`jvp(Ws, v)\` $= W_3 W_2 W_1 v$와 \`vjp(Ws, u)\` $= u^\top W_3 W_2 W_1$(결과는 입력 차원의 1차원 배열)을 **행렬을 미리 곱하지 않고** 벡터를 한 층씩 통과시켜 계산합니다.
`,
    starter: py`
import math
import numpy as np

class Dual:
    def __init__(self, val, dot=0.0):
        self.val, self.dot = val, dot
    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(0.0, 0.0)  # TODO
    __radd__ = __add__
    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(0.0, 0.0)  # TODO
    __rmul__ = __mul__

def dsin(d): return Dual(0.0, 0.0)  # TODO
def dexp(d): return Dual(0.0, 0.0)  # TODO

def derivative(f, x):
    return 0.0  # TODO

def jvp(Ws, v):
    return v  # TODO: W1부터 차례로 곱한다

def vjp(Ws, u):
    return u  # TODO: 마지막 층부터 거꾸로 W.T를 곱한다

print(derivative(lambda x: x * dsin(x) + dexp(x), 1.0))
`,
    tests: py`
import math
import numpy as np

@test("다항식의 미분: f(x) = 3x² + 2x + 1, f'(2) = 14")
def _():
    assert approx(derivative(lambda x: 3 * x * x + 2 * x + 1, 2.0), 14.0)

@test("x·sin x + eˣ의 미분이 해석적 값과 1e-12 이내")
def _():
    got = derivative(lambda x: x * dsin(x) + dexp(x), 1.0)
    exact = math.sin(1) + math.cos(1) + math.exp(1)
    assert abs(got - exact) < 1e-12, f"{got} vs {exact}"

@test("값(val)도 함께 정확히 계산한다")
def _():
    d = (lambda x: x * dsin(x) + dexp(x))(Dual(1.0, 1.0))
    assert approx(d.val, math.sin(1) + math.e)

@test("JVP·VJP가 미리 곱한 야코비안과 같다")
def _():
    rng = np.random.default_rng(0)
    Ws = [rng.normal(size=(5, 4)), rng.normal(size=(3, 5)), rng.normal(size=(2, 3))]
    J = Ws[2] @ Ws[1] @ Ws[0]
    v, u = rng.normal(size=4), rng.normal(size=2)
    assert approx(jvp(Ws, v), J @ v) and approx(vjp(Ws, u), u @ J)

@test("출력이 1개면 VJP 한 번 = JVP를 입력 차원만큼 반복한 결과")
def _():
    rng = np.random.default_rng(1)
    Ws = [rng.normal(size=(6, 8)), rng.normal(size=(1, 6))]
    by_jvp = np.array([jvp(Ws, e)[0] for e in np.eye(8)])
    assert approx(vjp(Ws, np.array([1.0])), by_jvp)
`,
    hints: ["덧셈은 `Dual(self.val + o.val, self.dot + o.dot)`, 곱셈은 `Dual(self.val * o.val, self.dot * o.val + self.val * o.dot)`입니다.", "`dsin(d)`는 `Dual(math.sin(d.val), math.cos(d.val) * d.dot)`. `derivative`는 씨앗 `dot=1.0`을 넣고 결과의 `.dot`을 읽습니다.", "`jvp`는 `for W in Ws: v = W @ v`, `vjp`는 `for W in reversed(Ws): u = W.T @ u`입니다."],
    solution: py`
import math
import numpy as np

class Dual:
    def __init__(self, val, dot=0.0):
        self.val, self.dot = val, dot
    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val + o.val, self.dot + o.dot)
    __radd__ = __add__
    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val * o.val, self.dot * o.val + self.val * o.dot)
    __rmul__ = __mul__

def dsin(d): return Dual(math.sin(d.val), math.cos(d.val) * d.dot)
def dexp(d): return Dual(math.exp(d.val), math.exp(d.val) * d.dot)

def derivative(f, x):
    return f(Dual(x, 1.0)).dot

def jvp(Ws, v):
    for W in Ws:
        v = W @ v
    return v

def vjp(Ws, u):
    for W in reversed(Ws):
        u = W.T @ u
    return u

print(derivative(lambda x: x * dsin(x) + dexp(x), 1.0))
`,
  },
]);
