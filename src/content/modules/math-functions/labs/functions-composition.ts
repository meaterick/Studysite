import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "합성함수와 정의역 검사",
    prompt: md`

세 함수를 완성합니다.

1. \`compose(g, f)\`: $g \circ f$, 즉 \`x\`를 받아 \`g(f(x))\`를 돌려주는 함수를 돌려줍니다.
2. \`pipeline(funcs)\`: 함수 리스트를 받아, 입력에 **리스트의 앞에서부터** 차례로 적용하는 함수를 돌려줍니다. \`pipeline([f1, f2, f3])(x)\`는 \`f3(f2(f1(x)))\`입니다. 빈 리스트면 입력을 그대로 돌려줍니다.
3. \`safe_log(x)\`: 정의역($x > 0$) 밖이면 \`ValueError\`를 일으키고, 안이면 \`math.log(x)\`를 돌려줍니다.
`,
    starter: py`
import math

def compose(g, f):
    """g ∘ f"""
    return None   # TODO: lambda x: ... 를 돌려줍니다.

def pipeline(funcs):
    """앞에서부터 차례로 적용하는 함수"""
    def run(x):
        # TODO: funcs의 함수를 차례로 x에 적용합니다.
        return x
    return run

def safe_log(x):
    """x > 0에서만 정의되는 로그"""
    return math.log(x)   # TODO: x가 0 이하이면 ValueError를 일으킵니다.

double = lambda x: 2 * x
inc = lambda x: x + 1
print(compose(double, inc)(3), pipeline([inc, double])(3), pipeline([double, inc])(3))
`,
    tests: py`
import math

@test("compose(g, f)는 f를 먼저 적용한다")
def _():
    double = lambda x: 2 * x
    inc = lambda x: x + 1
    assert compose(double, inc)(3) == 8 and compose(inc, double)(3) == 7

@test("pipeline은 리스트 순서대로 적용한다")
def _():
    inc = lambda x: x + 1
    square = lambda x: x * x
    assert pipeline([inc, square])(2) == 9, f"결과: {pipeline([inc, square])(2)}"
    assert pipeline([square, inc])(2) == 5

@test("빈 pipeline은 입력을 그대로 돌려준다")
def _():
    assert pipeline([])(42) == 42

@test("pipeline으로 만든 모델: relu(2x - 1) * 3 + 0.5")
def _():
    model = pipeline([lambda x: 2 * x - 1, lambda z: max(0.0, z), lambda h: 3 * h + 0.5])
    assert approx(model(0.25), 0.5) and approx(model(1.0), 3.5)

@test("safe_log: 정의역 밖이면 ValueError")
def _():
    assert approx(safe_log(math.e), 1.0)
    for bad in (0, -1):
        try:
            safe_log(bad)
            raised = False
        except ValueError:
            raised = True
        assert raised, f"safe_log({bad})에서 ValueError가 나지 않았습니다."
`,
    hints: [
      "`return lambda x: g(f(x))`가 합성함수입니다.",
      "`run` 안에서 `for fn in funcs: x = fn(x)`로 차례로 적용한 뒤 `x`를 돌려줍니다.",
      "`if x <= 0: raise ValueError(f\"로그의 정의역 밖: {x}\")`를 먼저 둡니다. `math.log(0)`도 ValueError를 내지만, 메시지를 직접 정하는 편이 원인을 알기 쉽습니다.",
    ],
    solution: py`
import math

def compose(g, f):
    return lambda x: g(f(x))

def pipeline(funcs):
    def run(x):
        for fn in funcs:
            x = fn(x)
        return x
    return run

def safe_log(x):
    if x <= 0:
        raise ValueError(f"로그의 정의역 밖: {x}")
    return math.log(x)

double = lambda x: 2 * x
inc = lambda x: x + 1
print(compose(double, inc)(3), pipeline([inc, double])(3), pipeline([double, inc])(3))
`,
  },
]);
