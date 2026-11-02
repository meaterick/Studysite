import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "잔차 블록: 항등함수와 기울기 고속도로",
    prompt: md`

1. \`res_block(x, W1, W2)\` $= x + W_2\,\mathrm{ReLU}(W_1 x)$
2. \`plain_grad(local)\`, \`residual_grad(f_primes)\`: 층마다의 국소 기울기 배열을 받아 입력까지 전달되는 기울기 배율을 돌려줍니다. 잔차 없는 망은 국소 기울기의 곱 $\prod F_i'$, 잔차 연결이 있으면 $y = F(x) + x$이므로 $\prod (F_i' + 1)$입니다.

$W_1, W_2$가 0이면 블록이 그대로 항등함수가 되는지, 50층에서 두 배율이 얼마나 다른지 확인합니다.
`,
    starter: py`
import numpy as np

def res_block(x, W1, W2):
    return x  # TODO

def plain_grad(local):
    return 1.0  # TODO: 국소 기울기의 곱

def residual_grad(f_primes):
    return 1.0  # TODO: (F' + 1)의 곱

rng = np.random.default_rng(0)
local = rng.uniform(0.25, 1.0, 50)
small = rng.uniform(-0.05, 0.05, 50)
print(f"50층 plain: {plain_grad(local):.2e}, residual: {residual_grad(small):.3f}")
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(1)

@test("가중치가 0이면 잔차 블록 = 항등함수")
def _():
    x = rng.normal(size=4)
    assert approx(res_block(x, np.zeros((6, 4)), np.zeros((4, 6))), x)

@test("res_block = x + W2·ReLU(W1·x)")
def _():
    x, W1, W2 = rng.normal(size=3), rng.normal(size=(5, 3)), rng.normal(size=(3, 5))
    assert approx(res_block(x, W1, W2), x + W2 @ np.maximum(0, W1 @ x))

@test("plain: 0.5를 10번 곱하면 ≈ 0.000977")
def _():
    assert approx(plain_grad(np.full(10, 0.5)), 0.5 ** 10)

@test("residual: F'가 모두 0이면 배율 1, 0.1이면 1.1¹⁰")
def _():
    assert approx(residual_grad(np.zeros(30)), 1.0) and approx(residual_grad(np.full(10, 0.1)), 1.1 ** 10)

@test("본문 실험: 50층 plain < 1e-9, residual은 0.5~2 사이")
def _():
    r = np.random.default_rng(0)
    local, small = r.uniform(0.25, 1.0, 50), r.uniform(-0.05, 0.05, 50)
    assert plain_grad(local) < 1e-9 and 0.5 < residual_grad(small) < 2, f"{plain_grad(local):.2e}, {residual_grad(small):.3f}"
`,
    hints: ["`x + W2 @ np.maximum(0, W1 @ x)`", "곱은 `np.prod(local)`, 잔차는 `np.prod(1 + f_primes)`입니다.", "잔차 연결의 국소 기울기 $F'(x) + 1$은 $F'$가 작아도 1 근처라, 아무리 많이 곱해도 0으로 사라지지 않습니다."],
    solution: py`
import numpy as np

def res_block(x, W1, W2):
    return x + W2 @ np.maximum(0, W1 @ x)

def plain_grad(local):
    return float(np.prod(local))

def residual_grad(f_primes):
    return float(np.prod(1 + np.asarray(f_primes)))

rng = np.random.default_rng(0)
local = rng.uniform(0.25, 1.0, 50)
small = rng.uniform(-0.05, 0.05, 50)
print(f"50층 plain: {plain_grad(local):.2e}, residual: {residual_grad(small):.3f}")
`,
  },
]);
