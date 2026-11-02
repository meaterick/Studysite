import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "편향 보정 Adam과 분리된 가중치 감쇠(AdamW)",
    prompt: md`

「Adam의 이론」 단계의 결론을 최적화기로 구현해 확인합니다.

1. \`adam_step(w, g, state, lr, lam, decoupled, b1=0.9, b2=0.999, eps=1e-8)\`: \`state\`는 \`{"t": 0, "m": 0, "v": 0}\` 딕셔너리(배열도 가능)입니다. \`t\`를 1 늘리고,
   - \`decoupled=False\`(Adam + L2)면 기울기를 \`g + lam * w\`로 바꿔 $m, v$를 갱신하고 편향 보정한 $\hat m/(\sqrt{\hat v}+\epsilon)$로 갱신합니다.
   - \`decoupled=True\`(AdamW)면 $m, v$에는 \`g\`만 쓰고, 갱신 뒤에 \`w -= lr * lam * w\`를 따로 적용합니다.

   새 \`w\`를 돌려줍니다(\`state\`는 제자리에서 갱신).
2. \`bias_corrected_m(gs, b1)\`: 기울기 리스트 \`gs\`를 차례로 넣었을 때의 보정 전 $m_t$와 보정 후 $\hat m_t$의 마지막 값 \`(m, m_hat)\`
`,
    starter: py`
import numpy as np

def adam_step(w, g, state, lr=1e-3, lam=0.0, decoupled=False, b1=0.9, b2=0.999, eps=1e-8):
    state["t"] += 1
    t = state["t"]
    # TODO: decoupled 여부에 따라 기울기를 정하고 m, v를 갱신한 뒤 편향 보정해 w를 갱신합니다.
    return w

def bias_corrected_m(gs, b1=0.9):
    m = 0.0
    # TODO
    return m, m

def run(lam, decoupled, steps=1000):
    w, state = 1.0, {"t": 0, "m": 0.0, "v": 0.0}
    for _ in range(steps):
        w = adam_step(w, 0.0, state, lr=1e-3, lam=lam, decoupled=decoupled)   # 데이터 기울기 0
    return w

for lam in (1e-4, 1e-2, 1.0):
    print(lam, round(run(lam, False), 4), round(run(lam, True), 4))
print(bias_corrected_m([2.0, 2.0, 2.0]))
`,
    tests: py`
import numpy as np

def run(lam, decoupled, steps=1000):
    w, state = 1.0, {"t": 0, "m": 0.0, "v": 0.0}
    for _ in range(steps):
        w = adam_step(w, 0.0, state, lr=1e-3, lam=lam, decoupled=decoupled)
    return w

@test("첫 스텝은 기울기 크기와 무관하게 약 lr만큼 움직인다")
def _():
    for g in (5.0, 0.01):
        w = adam_step(0.0, g, {"t": 0, "m": 0.0, "v": 0.0}, lr=0.1)
        assert approx(w, -0.1, 1e-6), f"g={g}: w={w}"

@test("Adam + L2: 데이터 기울기 0인 파라미터가 λ와 무관하게 똑같이 줄어든다")
def _():
    vals = [run(lam, False) for lam in (1e-4, 1e-2, 1.0)]
    assert max(vals) - min(vals) < 1e-3 and vals[0] < 0.5, f"결과: {vals}"

@test("AdamW: (1 - ηλ)^1000 ≈ e^(-λ)")
def _():
    for lam in (1e-4, 1e-2, 1.0):
        assert approx(run(lam, True), (1 - 1e-3 * lam) ** 1000, 1e-6), f"λ={lam}: {run(lam, True)}"

@test("배열 파라미터에도 동작한다")
def _():
    w = np.array([1.0, -2.0])
    st = {"t": 0, "m": np.zeros(2), "v": np.zeros(2)}
    w2 = adam_step(w, np.array([0.5, -3.0]), st, lr=0.01)
    assert approx(w2, [0.99, -1.99], 1e-6) and st["t"] == 1

@test("편향 보정: 기울기가 계속 2면 m̂ = 2, m = 2(1 - 0.9^t)")
def _():
    m, m_hat = bias_corrected_m([2.0, 2.0, 2.0])
    assert approx(m, 2 * (1 - 0.9 ** 3)) and approx(m_hat, 2.0), f"{(m, m_hat)}"
`,
    hints: ["`grad = g if decoupled else g + lam * w`로 정한 뒤 `state[\"m\"] = b1 * state[\"m\"] + (1 - b1) * grad`, `v`도 같은 꼴(제곱)입니다.", "`m_hat = state[\"m\"] / (1 - b1 ** t)`, `v_hat = state[\"v\"] / (1 - b2 ** t)`, `w = w - lr * m_hat / (np.sqrt(v_hat) + eps)`.", "`decoupled`이면 마지막에 `w = w - lr * lam * w`를 한 번 더 합니다. 편향 보정 함수는 반복문 뒤 `t = len(gs)`로 `m / (1 - b1 ** t)`입니다."],
    solution: py`
import numpy as np

def adam_step(w, g, state, lr=1e-3, lam=0.0, decoupled=False, b1=0.9, b2=0.999, eps=1e-8):
    state["t"] += 1
    t = state["t"]
    grad = g if decoupled else g + lam * w
    state["m"] = b1 * state["m"] + (1 - b1) * grad
    state["v"] = b2 * state["v"] + (1 - b2) * grad ** 2
    m_hat = state["m"] / (1 - b1 ** t)
    v_hat = state["v"] / (1 - b2 ** t)
    w = w - lr * m_hat / (np.sqrt(v_hat) + eps)
    if decoupled:
        w = w - lr * lam * w
    return w

def bias_corrected_m(gs, b1=0.9):
    m = 0.0
    for g in gs:
        m = b1 * m + (1 - b1) * g
    return m, m / (1 - b1 ** len(gs))

def run(lam, decoupled, steps=1000):
    w, state = 1.0, {"t": 0, "m": 0.0, "v": 0.0}
    for _ in range(steps):
        w = adam_step(w, 0.0, state, lr=1e-3, lam=lam, decoupled=decoupled)
    return w

for lam in (1e-4, 1e-2, 1.0):
    print(lam, round(run(lam, False), 4), round(run(lam, True), 4))
print(bias_corrected_m([2.0, 2.0, 2.0]))
`,
  },
]);
