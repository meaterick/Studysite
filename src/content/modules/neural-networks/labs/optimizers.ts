import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "반복 수 계산과 SGD 한 걸음",
    prompt: md`

1. \`iterations_per_epoch(n, batch)\`: 학습 데이터 \`n\`개를 배치 크기 \`batch\`로 나눌 때 한 에포크의 반복 수. 나누어떨어지지 않으면 마지막 배치도 한 번으로 셉니다(\`math.ceil\`).
2. \`sgd_step(w, g, lr)\`: SGD 갱신 $w - \eta g$. \`w\`와 \`g\`는 같은 길이의 리스트입니다.
3. \`total_steps(n, batch, epochs)\`: \`epochs\` 에포크 동안의 전체 반복 수
`,
    starter: py`
import math

def iterations_per_epoch(n, batch):
    return 0      # TODO

def sgd_step(w, g, lr):
    return w      # TODO

def total_steps(n, batch, epochs):
    return 0      # TODO

print(iterations_per_epoch(1000, 32), sgd_step([1.0, -2.0], [0.5, -1.0], 0.1), total_steps(1000, 100, 3))
`,
    tests: py`
@test("에포크당 반복 수: 10, 32, 1")
def _():
    assert iterations_per_epoch(1000, 100) == 10, f"결과: {iterations_per_epoch(1000, 100)}"
    assert iterations_per_epoch(1000, 32) == 32, f"결과: {iterations_per_epoch(1000, 32)}"
    assert iterations_per_epoch(1000, 1000) == 1

@test("SGD 한 걸음")
def _():
    assert approx(sgd_step([1.0, -2.0], [0.5, -1.0], 0.1), [0.95, -1.9]), f"결과: {sgd_step([1.0, -2.0], [0.5, -1.0], 0.1)}"

@test("전체 반복 수")
def _():
    assert total_steps(1000, 100, 3) == 30 and total_steps(1000, 32, 3) == 96, f"결과: {total_steps(1000, 32, 3)}"
`,
    hints: [
      "`math.ceil(n / batch)`입니다. 1000 / 32 = 31.25라 32번입니다.",
      "`[wi - lr * gi for wi, gi in zip(w, g)]`가 SGD 한 걸음이고, 전체 반복 수는 `iterations_per_epoch(n, batch) * epochs`입니다.",
    ],
    solution: py`
import math

def iterations_per_epoch(n, batch):
    return math.ceil(n / batch)

def sgd_step(w, g, lr):
    return [wi - lr * gi for wi, gi in zip(w, g)]

def total_steps(n, batch, epochs):
    return iterations_per_epoch(n, batch) * epochs

print(iterations_per_epoch(1000, 32), sgd_step([1.0, -2.0], [0.5, -1.0], 0.1), total_steps(1000, 100, 3))
`,
  },
  {
    key: "ex1",
    title: "Momentum과 Adam 한 스텝 구현하기",
    prompt: md`

최적화기를 "상태를 받아 새 상태를 돌려주는 함수"로 구현합니다.

- \`momentum_step(w, v, g, lr, beta=0.9)\`: $v \leftarrow \beta v + g$, $w \leftarrow w - \eta v$ → \`(w, v)\`
- \`adam_step(w, m, s, g, t, lr, b1=0.9, b2=0.999, eps=1e-8)\`: $m \leftarrow \beta_1 m + (1-\beta_1) g$, $s \leftarrow \beta_2 s + (1-\beta_2) g^2$, 편향 보정 $\hat m = m/(1-\beta_1^t)$, $\hat s = s/(1-\beta_2^t)$, $w \leftarrow w - \eta \hat m / (\sqrt{\hat s} + \epsilon)$ → \`(w, m, s)\`

Adam의 첫 스텝은 기울기 크기와 상관없이 약 $\eta$만큼 움직여야 합니다.
`,
    starter: py`
import numpy as np

def momentum_step(w, v, g, lr, beta=0.9):
    # TODO
    return w, v

def adam_step(w, m, s, g, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    # TODO: t는 1부터 시작하는 스텝 번호입니다.
    return w, m, s

def grad(w):
    return np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])

w, v = np.array([5.0, 5.0]), np.zeros(2)
for _ in range(100):
    w, v = momentum_step(w, v, grad(w), 0.01)
print("Momentum 100스텝:", np.round(w, 3))
`,
    tests: py`
import numpy as np

def grad(w):
    return np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])

@test("Momentum 첫 두 스텝(1차원)")
def _():
    w, v = momentum_step(np.array([0.0]), np.zeros(1), np.array([1.0]), 0.1)
    w, v = momentum_step(w, v, np.array([1.0]), 0.1)
    assert approx(v, [1.9]) and approx(w, [-0.29]), f"w = {w}, v = {v}"

@test("협곡 함수: Momentum(lr 0.01) 100스텝 뒤 w₁ ≈ 1.02")
def _():
    w, v = np.array([5.0, 5.0]), np.zeros(2)
    for _ in range(100):
        w, v = momentum_step(w, v, grad(w), 0.01)
    assert abs(w[0] - 1) < 0.05 and abs(w[1] + 2) < 0.05, f"w = {w}"

@test("Adam 첫 스텝 이동량 ≈ lr (기울기 5든 0.01이든)")
def _():
    for g in (5.0, 0.01):
        w, m, s = adam_step(np.array([0.0]), np.zeros(1), np.zeros(1), np.array([g]), 1, 0.1)
        assert approx(abs(w[0]), 0.1, 1e-4), f"g={g}: 이동량 {abs(w[0])}"

@test("Adam 상태 갱신: m, s가 지수이동평균")
def _():
    w, m, s = adam_step(np.zeros(2), np.zeros(2), np.zeros(2), np.array([2.0, -4.0]), 1, 0.1)
    assert approx(m, [0.2, -0.4]) and approx(s, [0.004, 0.016]), f"m = {m}, s = {s}"

@test("Adam(lr 0.1)로 협곡 함수를 300스텝 최적화하면 최솟값 근처에 간다")
def _():
    w, m, s = np.array([5.0, 5.0]), np.zeros(2), np.zeros(2)
    for t in range(1, 301):
        w, m, s = adam_step(w, m, s, grad(w), t, 0.1)
    assert abs(w[0] - 1) < 0.1 and abs(w[1] + 2) < 0.1, f"w = {w}"
`,
    hints: ["Momentum: `v = beta * v + g`를 먼저 구하고 `w = w - lr * v`를 돌려줍니다.", "Adam: `m = b1 * m + (1 - b1) * g`, `s = b2 * s + (1 - b2) * g ** 2`를 먼저 갱신합니다.", "`m_hat = m / (1 - b1 ** t)`, `s_hat = s / (1 - b2 ** t)`, `w = w - lr * m_hat / (np.sqrt(s_hat) + eps)`. 첫 스텝에서 $\\hat m = g$, $\\sqrt{\\hat s} = |g|$라 이동량이 lr이 됩니다."],
    solution: py`
import numpy as np

def momentum_step(w, v, g, lr, beta=0.9):
    v = beta * v + g
    return w - lr * v, v

def adam_step(w, m, s, g, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    m = b1 * m + (1 - b1) * g
    s = b2 * s + (1 - b2) * g ** 2
    m_hat, s_hat = m / (1 - b1 ** t), s / (1 - b2 ** t)
    return w - lr * m_hat / (np.sqrt(s_hat) + eps), m, s

def grad(w):
    return np.array([2 * (w[0] - 1), 20 * (w[1] + 2)])

w, v = np.array([5.0, 5.0]), np.zeros(2)
for _ in range(100):
    w, v = momentum_step(w, v, grad(w), 0.01)
print("Momentum 100스텝:", np.round(w, 3))
`,
  },
]);
