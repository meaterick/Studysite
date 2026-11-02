import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "디코더가 필요할 때마다 다시 보는 attention",
    prompt: md`

Seq2Seq의 병목을 푼 attention의 핵심 세 줄을 구현합니다.

- \`attention_weights(H, s)\`: 인코더 은닉 상태 \`H\`(T, d) 각각과 디코더 상태 \`s\`(d,)의 내적을 점수로 삼아 softmax한 가중치(합 1)
- \`context(H, s)\`: 가중치로 \`H\`의 행을 섞은 문맥 벡터(d,)

softmax는 최댓값을 빼서 계산합니다. 디코더 상태가 어떤 인코더 상태와 비슷하면 그 시점에 가중치가 몰려야 합니다.
`,
    starter: py`
import numpy as np

def attention_weights(H, s):
    scores = H @ s
    return np.ones(len(H)) / len(H)  # TODO: softmax(scores)

def context(H, s):
    return np.zeros(H.shape[1])  # TODO: 가중합

rng = np.random.default_rng(0)
H = rng.normal(size=(6, 16))
s = H[4] + 0.1 * rng.normal(size=16)
print(np.round(attention_weights(H, s), 2))
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(3)
H = rng.normal(size=(6, 16))

@test("가중치 합 = 1, 모두 양수")
def _():
    w = attention_weights(H, rng.normal(size=16))
    assert approx(np.sum(w), 1.0) and np.all(w > 0)

@test("H[2]와 비슷한 디코더 상태 → 2번 시점에 가중치가 몰린다")
def _():
    w = attention_weights(H, H[2] + 0.05 * rng.normal(size=16))
    assert int(np.argmax(w)) == 2 and w[2] > 0.9, f"가중치: {np.round(w, 3)}"

@test("큰 점수에도 overflow 없음")
def _():
    w = attention_weights(np.array([[1000.0], [999.0]]), np.array([1.0]))
    assert approx(w, [1 / (1 + np.exp(-1)), 1 - 1 / (1 + np.exp(-1))])

@test("문맥 벡터 = 가중치로 섞은 H")
def _():
    s = rng.normal(size=16)
    assert approx(context(H, s), attention_weights(H, s) @ H)
`,
    hints: ["`e = np.exp(scores - scores.max())`, `e / e.sum()`", "`attention_weights(H, s) @ H`는 (T,) @ (T, d) = (d,)입니다."],
    solution: py`
import numpy as np

def attention_weights(H, s):
    scores = H @ s
    e = np.exp(scores - scores.max())
    return e / e.sum()

def context(H, s):
    return attention_weights(H, s) @ H

rng = np.random.default_rng(0)
H = rng.normal(size=(6, 16))
s = H[4] + 0.1 * rng.normal(size=16)
print(np.round(attention_weights(H, s), 2))
`,
  },
]);
