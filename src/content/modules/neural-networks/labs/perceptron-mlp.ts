import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "뉴런·층 계산과 \"비선형이 없으면 한 층\" 증명",
    prompt: md`

1. \`neuron(x, w, b)\`: ReLU 뉴런 $\max(0, w \cdot x + b)$
2. \`layer(x, W, b)\`: 선형 층 $Wx + b$ (W의 shape은 (출력, 입력))
3. \`collapse(W1, b1, W2, b2)\`: 비선형 없이 쌓은 두 층 $W_2(W_1 x + b_1) + b_2$와 **같은 결과**를 내는 한 층의 $(W, b)$

본문의 결론("활성화 함수가 없으면 여러 층을 쌓아도 한 층과 같다")을 식으로 확인합니다. 사이에 ReLU를 끼우면 더 이상 한 층으로 합쳐지지 않는 것도 확인합니다.
`,
    starter: py`
import numpy as np

def neuron(x, w, b):
    return 0.0  # TODO: ReLU(w·x + b)

def layer(x, W, b):
    return x  # TODO: Wx + b

def collapse(W1, b1, W2, b2):
    W = None  # TODO
    b = None  # TODO
    return W, b

print("뉴런 출력:", neuron(np.array([2.0, 1.0]), np.array([0.5, -1.0]), -0.5))
rng = np.random.default_rng(0)
x = rng.normal(size=3)
W1, b1, W2, b2 = rng.normal(size=(4, 3)), rng.normal(size=4), rng.normal(size=(1, 4)), rng.normal(size=1)
W, b = collapse(W1, b1, W2, b2)
print("두 층:", layer(layer(x, W1, b1), W2, b2), " 합친 한 층:", None if W is None else layer(x, W, b))
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(1)

@test("ReLU 뉴런: w=(0.5, -1), b=-0.5, x=(2, 1) → 0")
def _():
    assert approx(neuron(np.array([2.0, 1.0]), np.array([0.5, -1.0]), -0.5), 0.0)

@test("양수 입력은 그대로 통과: w=(1, 1), b=0.5, x=(1, 2) → 3.5")
def _():
    assert approx(neuron(np.array([1.0, 2.0]), np.array([1.0, 1.0]), 0.5), 3.5)

@test("layer의 출력 shape = (출력 차원,)")
def _():
    out = layer(rng.normal(size=3), rng.normal(size=(4, 3)), rng.normal(size=4))
    assert np.shape(out) == (4,), f"shape: {np.shape(out)}"

@test("collapse한 한 층이 두 선형 층과 같은 값을 낸다")
def _():
    W1, b1, W2, b2 = rng.normal(size=(5, 3)), rng.normal(size=5), rng.normal(size=(2, 5)), rng.normal(size=2)
    W, b = collapse(W1, b1, W2, b2)
    assert W is not None and np.shape(W) == (2, 3), f"W shape: {np.shape(W)}"
    for _ in range(3):
        x = rng.normal(size=3)
        assert approx(W2 @ (W1 @ x + b1) + b2, W @ x + b)

@test("사이에 ReLU를 넣으면 한 층으로 합쳐지지 않는다")
def _():
    W1, b1, W2, b2 = rng.normal(size=(6, 3)), rng.normal(size=6), rng.normal(size=(1, 6)), rng.normal(size=1)
    W, b = collapse(W1, b1, W2, b2)
    xs = rng.normal(size=(20, 3))
    diffs = [abs((W2 @ np.maximum(0, W1 @ x + b1) + b2)[0] - (W @ x + b)[0]) for x in xs]
    assert max(diffs) > 1e-3
`,
    hints: ["`neuron`은 `max(0.0, float(np.dot(w, x) + b))`입니다.", "`layer`는 `W @ x + b`입니다. (출력, 입력) 행렬에 입력 벡터를 곱하면 출력 벡터가 됩니다.", "$W_2(W_1 x + b_1) + b_2 = (W_2 W_1)x + (W_2 b_1 + b_2)$이므로 `W = W2 @ W1`, `b = W2 @ b1 + b2`입니다."],
    solution: py`
import numpy as np

def neuron(x, w, b):
    return max(0.0, float(np.dot(w, x) + b))

def layer(x, W, b):
    return W @ x + b

def collapse(W1, b1, W2, b2):
    W = W2 @ W1
    b = W2 @ b1 + b2
    return W, b

print("뉴런 출력:", neuron(np.array([2.0, 1.0]), np.array([0.5, -1.0]), -0.5))
rng = np.random.default_rng(0)
x = rng.normal(size=3)
W1, b1, W2, b2 = rng.normal(size=(4, 3)), rng.normal(size=4), rng.normal(size=(1, 4)), rng.normal(size=1)
W, b = collapse(W1, b1, W2, b2)
print("두 층:", layer(layer(x, W1, b1), W2, b2), " 합친 한 층:", None if W is None else layer(x, W, b))
`,
  },
]);
