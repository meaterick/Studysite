import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "LSTM 셀 한 스텝 구현하기",
    prompt: md`
\`lstm_step(x, h, c, P)\`를 구현합니다. \`P\`는 게이트마다 \`(W, U, b)\`를 담은 딕셔너리이고 키는 \`"f"\`(forget), \`"i"\`(input), \`"g"\`(후보), \`"o"\`(output)입니다.

$$f = \sigma(W_f x + U_f h + b_f),\ i = \sigma(\cdots),\ \tilde c = \tanh(W_g x + U_g h + b_g),\ o = \sigma(\cdots)$$
$$c' = f \odot c + i \odot \tilde c,\qquad h' = o \odot \tanh(c')$$

\`(h', c')\`를 돌려줍니다. forget gate가 1, input gate가 0이면 셀 상태가 **그대로** 유지되는지 확인합니다. 이 경로가 셀 상태가 값을 오래 유지하는 이유입니다.
`,
    starter: py`
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def lstm_step(x, h, c, P):
    gate = lambda k: P[k][0] @ x + P[k][1] @ h + P[k][2]
    f = i = o = np.zeros_like(c)   # TODO: sigmoid 게이트 세 개
    g = np.zeros_like(c)           # TODO: tanh 후보
    c_new = c                      # TODO
    h_new = h                      # TODO
    return h_new, c_new

def init(d_in, d_h, rng, bias=0.0):
    return (rng.normal(0, 0.3, (d_h, d_in)), rng.normal(0, 0.3, (d_h, d_h)), np.full(d_h, bias))

rng = np.random.default_rng(0)
P = {k: init(4, 8, rng) for k in "figo"}
h, c = np.zeros(8), np.zeros(8)
for x in rng.normal(size=(5, 4)):
    h, c = lstm_step(x, h, c, P)
print(np.round(h, 3))
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(2)
P = {k: (rng.normal(0, 0.3, (6, 3)), rng.normal(0, 0.3, (6, 6)), rng.normal(0, 0.1, 6)) for k in "figo"}
sig = lambda z: 1 / (1 + np.exp(-z))

@test("식과 일치하는 한 스텝")
def _():
    x, h, c = rng.normal(size=3), rng.normal(size=6), rng.normal(size=6)
    pre = {k: P[k][0] @ x + P[k][1] @ h + P[k][2] for k in "figo"}
    c2 = sig(pre["f"]) * c + sig(pre["i"]) * np.tanh(pre["g"])
    h2 = sig(pre["o"]) * np.tanh(c2)
    hn, cn = lstm_step(x, h, c, P)
    assert approx(cn, c2) and approx(hn, h2)

@test("f = 1, i = 0이면 셀 상태가 그대로 보존된다")
def _():
    Z = lambda: (np.zeros((6, 3)), np.zeros((6, 6)))
    P2 = {"f": (*Z(), np.full(6, 50.0)), "i": (*Z(), np.full(6, -50.0)), "g": (*Z(), np.zeros(6)), "o": (*Z(), np.zeros(6))}
    c = rng.normal(size=6)
    h, c_out = np.zeros(6), c.copy()
    for _ in range(20):
        h, c_out = lstm_step(rng.normal(size=3), h, c_out, P2)
    assert approx(c_out, c, 1e-6)

@test("출력 h의 각 성분은 (-1, 1) 범위")
def _():
    h, c = np.zeros(6), np.zeros(6)
    for x in rng.normal(size=(10, 3)) * 5:
        h, c = lstm_step(x, h, c, P)
    assert np.all(np.abs(h) < 1)
`,
    hints: ["`f, i, o = sigmoid(gate(\"f\")), sigmoid(gate(\"i\")), sigmoid(gate(\"o\"))`, `g = np.tanh(gate(\"g\"))`", "`c_new = f * c + i * g`(원소별 곱), `h_new = o * np.tanh(c_new)`", "c 경로에는 행렬곱이 없고 f를 곱한 뒤 더하기만 합니다. f가 1에 가까우면 기울기의 크기도 거의 유지됩니다."],
    solution: py`
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def lstm_step(x, h, c, P):
    gate = lambda k: P[k][0] @ x + P[k][1] @ h + P[k][2]
    f, i, o = sigmoid(gate("f")), sigmoid(gate("i")), sigmoid(gate("o"))
    g = np.tanh(gate("g"))
    c_new = f * c + i * g
    h_new = o * np.tanh(c_new)
    return h_new, c_new

def init(d_in, d_h, rng, bias=0.0):
    return (rng.normal(0, 0.3, (d_h, d_in)), rng.normal(0, 0.3, (d_h, d_h)), np.full(d_h, bias))

rng = np.random.default_rng(0)
P = {k: init(4, 8, rng) for k in "figo"}
h, c = np.zeros(8), np.zeros(8)
for x in rng.normal(size=(5, 4)):
    h, c = lstm_step(x, h, c, P)
print(np.round(h, 3))
`,
  },
]);
