import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "다항식의 도함수와 중심차분 검산",
    prompt: md`

다항식 $a_0 + a_1 x + a_2 x^2 + \cdots + a_n x^n$을 계수 리스트 \`[a0, a1, ..., an]\`으로 나타냅니다. 예를 들어 $L(w) = 9 - 6w + w^2$은 \`[9, -6, 1]\`입니다. 다항식의 값을 구하는 \`poly_eval\`은 미리 주어집니다.

1. \`poly_derivative(coeffs)\`: 도함수의 계수 리스트를 돌려줍니다. 거듭제곱 규칙 $(a_k x^k)' = k\,a_k x^{k-1}$에 따라 \`[a1, 2*a2, 3*a3, ...]\`입니다. 상수 다항식(길이 1)의 도함수는 \`[0]\`입니다.
2. \`central_diff(f, x, h=1e-5)\`: 함수 \`f\`의 $x$에서의 도함수를 중심차분 $\frac{f(x + h) - f(x - h)}{2h}$로 근사합니다.

두 함수의 결과가 같은지 확인하면 손으로 구한 도함수를 검산할 수 있습니다.
`,
    starter: py`
def poly_eval(coeffs, x):
    """계수 리스트 [a0, a1, ...]로 나타낸 다항식의 x에서의 값"""
    return sum(a * x ** k for k, a in enumerate(coeffs))

def poly_derivative(coeffs):
    """[a0, a1, a2, ...]의 도함수 계수 [a1, 2*a2, 3*a3, ...]. 상수면 [0]"""
    # TODO: 길이가 1 이하이면 [0]을, 아니면 k * coeffs[k] (k = 1, 2, ...)를 담은 리스트를 돌려줍니다.
    return []

def central_diff(f, x, h=1e-5):
    """중심차분으로 구한 f'(x)의 근삿값"""
    # TODO: (f(x + h) - f(x - h)) / (2 * h)
    return 0.0

L = [9, -6, 1]                                  # L(w) = 9 - 6w + w²
print(poly_derivative(L))                       # 기대: [-6, 2]  →  L'(w) = -6 + 2w
print(round(central_diff(lambda w: poly_eval(L, w), 1.0), 6))   # 기대: -4.0
`,
    tests: py`
import math

@test("(w − 3)² = 9 − 6w + w²의 도함수 계수 = [-6, 2]")
def _():
    got = poly_derivative([9, -6, 1])
    assert got == [-6, 2], f"결과: {got}"

@test("상수 다항식의 도함수는 [0]")
def _():
    assert poly_derivative([5]) == [0], f"결과: {poly_derivative([5])}"

@test("1 + 4x³의 도함수 = 12x² → [0, 0, 12]")
def _():
    got = poly_derivative([1, 0, 0, 4])
    assert got == [0, 0, 12], f"결과: {got}"

@test("중심차분: x³의 x = 2에서 12, eˣ의 x = 0에서 1")
def _():
    assert approx(central_diff(lambda x: x ** 3, 2.0), 12, 1e-6), f"결과: {central_diff(lambda x: x ** 3, 2.0)}"
    assert approx(central_diff(math.exp, 0.0), 1, 1e-6), f"결과: {central_diff(math.exp, 0.0)}"

@test("임의의 다항식에서 poly_derivative와 central_diff가 일치")
def _():
    for coeffs in ([2, -3, 0.5, 1], [0, 1], [-1, 4, -2, 0, 0.25]):
        for x in (-1.5, 0.0, 2.0):
            exact = poly_eval(poly_derivative(coeffs), x)
            approx_ = central_diff(lambda t: poly_eval(coeffs, t), x)
            assert approx(exact, approx_, 1e-5), f"{coeffs}, x={x}: {exact} vs {approx_}"
`,
    hints: [
      "`[k * coeffs[k] for k in range(1, len(coeffs))]`처럼 1번 계수부터 차례로 지수를 곱합니다.",
      "길이 1인 리스트에 위 컴프리헨션을 적용하면 빈 리스트가 되므로, 그 경우를 먼저 처리해 `[0]`을 돌려줍니다.",
      "`central_diff`는 `return (f(x + h) - f(x - h)) / (2 * h)` 한 줄입니다.",
    ],
    solution: py`
def poly_eval(coeffs, x):
    return sum(a * x ** k for k, a in enumerate(coeffs))

def poly_derivative(coeffs):
    if len(coeffs) <= 1:
        return [0]
    return [k * coeffs[k] for k in range(1, len(coeffs))]

def central_diff(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)

L = [9, -6, 1]
print(poly_derivative(L))
print(round(central_diff(lambda w: poly_eval(L, w), 1.0), 6))
`,
  },
]);
