import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "역드롭아웃과 잔차 블록 구현하기",
    prompt: md`
드롭아웃과 잔차 블록을 NumPy로 구현합니다.

1. \`dropout(h, p, rng, training)\`: \`training=True\`이면 각 원소를 확률 \`p\`로 0으로 만들고 남은 값은 $\frac{1}{1-p}$배(역드롭아웃) 합니다. \`training=False\`이면 \`h\`를 그대로 돌려줍니다. 마스크는 \`rng.random(h.shape) >= p\`로 만듭니다.
2. \`res_block(x, W1, W2)\`: $x + W_2\,\mathrm{ReLU}(W_1 x)$
3. \`plain_grad(local)\`, \`residual_grad(f_primes)\`: 블록마다의 국소 미분 배열을 받아 입력까지 전달되는 기울기의 배율을 돌려줍니다. 잔차 연결이 없으면 국소 미분의 곱 $\prod_i F_i'$, 있으면 $\prod_i (F_i' + 1)$입니다.

$W_1$, $W_2$가 0이면 잔차 블록이 항등함수가 되는지, 50블록에서 두 배율이 얼마나 다른지 확인합니다.
`,
    starter: py`
import numpy as np

def dropout(h, p, rng, training=True):
    # TODO: training이면 마스크를 곱하고 1/(1-p)배, 아니면 그대로
    return h

def res_block(x, W1, W2):
    return x  # TODO

def plain_grad(local):
    return 1.0  # TODO: 국소 미분의 곱

def residual_grad(f_primes):
    return 1.0  # TODO: (F' + 1)의 곱

print(dropout(np.ones((2, 5)), 0.5, np.random.default_rng(1)))
rng = np.random.default_rng(0)
local = rng.uniform(0.25, 1.0, 50)
small = rng.uniform(-0.05, 0.05, 50)
print(f"50블록 plain: {plain_grad(local):.2e}, residual: {residual_grad(small):.3f}")
`,
    tests: py`
import numpy as np

@test("드롭아웃(학습): 0이 된 칸은 0, 남은 칸은 1/(1-p)배")
def _():
    out = dropout(np.ones((200, 50)), 0.2, np.random.default_rng(1), training=True)
    vals = set(np.round(np.unique(out), 6).tolist())
    assert vals <= {0.0, 1.25}, f"값의 종류: {sorted(vals)[:5]}"
    assert abs((out == 0).mean() - 0.2) < 0.02, f"0이 된 비율 {(out == 0).mean():.3f}"

@test("역드롭아웃은 평균을 유지한다")
def _():
    h = np.random.default_rng(2).random((5000, 40))
    out = dropout(h, 0.5, np.random.default_rng(3), training=True)
    assert abs(out.mean() - h.mean()) < 0.01, f"{h.mean():.4f} → {out.mean():.4f}"

@test("드롭아웃(평가): 입력을 그대로 돌려준다")
def _():
    h = np.arange(6.0).reshape(2, 3)
    assert np.array_equal(dropout(h, 0.5, np.random.default_rng(0), training=False), h)

@test("가중치가 0이면 잔차 블록은 항등함수")
def _():
    x = np.random.default_rng(4).normal(size=4)
    assert approx(res_block(x, np.zeros((6, 4)), np.zeros((4, 6))), x)

@test("res_block = x + W2·ReLU(W1·x)")
def _():
    r = np.random.default_rng(5)
    x, W1, W2 = r.normal(size=3), r.normal(size=(5, 3)), r.normal(size=(3, 5))
    assert approx(res_block(x, W1, W2), x + W2 @ np.maximum(0, W1 @ x))

@test("plain: 0.5를 10번 곱하면 약 0.000977")
def _():
    assert approx(plain_grad(np.full(10, 0.5)), 0.5 ** 10)

@test("residual: F'가 모두 0이면 배율 1, 모두 0.1이면 1.1의 10제곱")
def _():
    assert approx(residual_grad(np.zeros(30)), 1.0) and approx(residual_grad(np.full(10, 0.1)), 1.1 ** 10)

@test("50블록: plain은 1e-9보다 작고, residual은 0.5~2 사이")
def _():
    r = np.random.default_rng(0)
    local, small = r.uniform(0.25, 1.0, 50), r.uniform(-0.05, 0.05, 50)
    assert plain_grad(local) < 1e-9 and 0.5 < residual_grad(small) < 2, f"{plain_grad(local):.2e}, {residual_grad(small):.3f}"
`,
    hints: [
      "`mask = rng.random(h.shape) >= p`를 만든 뒤 `h * mask / (1 - p)`를 돌려줍니다.",
      "`res_block`은 `x + W2 @ np.maximum(0, W1 @ x)`입니다.",
      "곱은 `np.prod(local)`, 잔차 연결은 `np.prod(1 + np.asarray(f_primes))`입니다. $F'$가 작아도 $F' + 1$은 1에 가까우므로 50번 곱해도 0에 가까워지지 않습니다.",
    ],
    solution: py`
import numpy as np

def dropout(h, p, rng, training=True):
    if not training:
        return h
    mask = rng.random(h.shape) >= p
    return h * mask / (1 - p)

def res_block(x, W1, W2):
    return x + W2 @ np.maximum(0, W1 @ x)

def plain_grad(local):
    return float(np.prod(local))

def residual_grad(f_primes):
    return float(np.prod(1 + np.asarray(f_primes)))

print(dropout(np.ones((2, 5)), 0.5, np.random.default_rng(1)))
rng = np.random.default_rng(0)
local = rng.uniform(0.25, 1.0, 50)
small = rng.uniform(-0.05, 0.05, 50)
print(f"50블록 plain: {plain_grad(local):.2e}, residual: {residual_grad(small):.3f}")
`,
  },
]);
