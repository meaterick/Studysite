import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "깊이에 따른 기울기 노름, 잔차 연결, 노름 기준 클리핑",
    prompt: md`
본문의 노름 기준 클리핑과, 깊이에 따른 입력 쪽 기울기의 노름을 계산하는 실험을 구현합니다.

1. \`clip_by_norm(grads, c)\`: 배열 리스트의 전체 노름 $\sqrt{\sum \lVert g_i\rVert^2}$가 \`c\`를 넘으면 모두에 $c/\lVert g\rVert$를 곱한 새 리스트를, 아니면 그대로를 돌려줍니다. \`(새 리스트, 원래 노름)\` 튜플입니다.
2. \`input_grad_norm(scale, residual, depth, width=64, seed=0)\`: \`rng.normal(0, scale / sqrt(width), (width, width))\` 가중치를 \`depth\`개 만들고, 무작위 입력으로 순전파(\`residual\`이면 $h \leftarrow h + \tanh(Wh)$, 아니면 $h \leftarrow \tanh(Wh)$)한 뒤, 출력 쪽 기울기 \`np.ones(width) / sqrt(width)\`를 입력 쪽까지 역전파해 그 노름을 돌려줍니다. 난수는 가중치 \`depth\`개, 입력 순서로 뽑습니다.
`,
    starter: py`
import numpy as np

def clip_by_norm(grads, c):
    total = 0.0  # TODO: 전체 노름
    return grads, total

def input_grad_norm(scale, residual, depth, width=64, seed=0):
    rng = np.random.default_rng(seed)
    Ws = [rng.normal(0, scale / np.sqrt(width), (width, width)) for _ in range(depth)]
    h = rng.normal(size=width)
    pre = []
    for W in Ws:
        z = W @ h
        pre.append(z)
        h = h + np.tanh(z) if residual else np.tanh(z)
    g = np.ones(width) / np.sqrt(width)
    # TODO: 마지막 층부터 순회하며 g ← Wᵀ((1 - tanh² z) * g), residual이면 원래 g를 더한다
    return float(np.linalg.norm(g))

for res in (False, True):
    print(res, [f"{input_grad_norm(0.5, res, d):.2e}" for d in (10, 30, 50)])
`,
    tests: py`
import numpy as np

@test("클리핑: 노름 130을 5로 줄이고 방향은 유지한다")
def _():
    out, total = clip_by_norm([np.array([30.0, -40.0]), np.array([120.0])], 5.0)
    new = np.sqrt(sum(np.sum(g ** 2) for g in out))
    assert approx(total, 130.0) and approx(new, 5.0), f"{total} → {new}"
    assert approx(out[0] / np.linalg.norm(out[0]), [0.6, -0.8])

@test("노름이 임계값보다 작으면 그대로 돌려준다")
def _():
    g = [np.array([0.3, 0.4])]
    out, total = clip_by_norm(g, 5.0)
    assert approx(total, 0.5) and approx(out[0], g[0])

@test("얕은 잔차 망에서 기울기가 수치미분과 일치한다")
def _():
    rng = np.random.default_rng(0)
    width, depth = 4, 3
    Ws = [rng.normal(0, 1 / np.sqrt(width), (width, width)) for _ in range(depth)]
    h0 = rng.normal(size=width)
    def out(h):
        for W in Ws:
            h = h + np.tanh(W @ h)
        return np.ones(width) @ h / np.sqrt(width)
    num = np.array([(out(h0 + 1e-6 * e) - out(h0 - 1e-6 * e)) / 2e-6 for e in np.eye(width)])
    assert approx(input_grad_norm(1.0, True, depth, width=width, seed=0), np.linalg.norm(num), 1e-5)

@test("작은 초기화의 일반 망은 50층에서 기울기 노름이 1e-12보다 작다")
def _():
    assert input_grad_norm(0.5, False, 50) < 1e-12

@test("같은 초기화에 잔차 연결을 더하면 50층에서도 0.1 이상")
def _():
    assert input_grad_norm(0.5, True, 50) > 0.1
`,
    hints: ["`total = np.sqrt(sum(np.sum(g ** 2) for g in grads))`, `factor = min(1.0, c / (total + 1e-12))`입니다.", "`for W, z in zip(reversed(Ws), reversed(pre)):` 안에서 `back = W.T @ ((1 - np.tanh(z) ** 2) * g)`를 구합니다.", "`g = g + back if residual else back`입니다. 잔차 연결이 있으면 원래 기울기가 그대로 전달되는 경로가 생깁니다."],
    solution: py`
import numpy as np

def clip_by_norm(grads, c):
    total = float(np.sqrt(sum(np.sum(g ** 2) for g in grads)))
    factor = min(1.0, c / (total + 1e-12))
    return [g * factor for g in grads], total

def input_grad_norm(scale, residual, depth, width=64, seed=0):
    rng = np.random.default_rng(seed)
    Ws = [rng.normal(0, scale / np.sqrt(width), (width, width)) for _ in range(depth)]
    h = rng.normal(size=width)
    pre = []
    for W in Ws:
        z = W @ h
        pre.append(z)
        h = h + np.tanh(z) if residual else np.tanh(z)
    g = np.ones(width) / np.sqrt(width)
    for W, z in zip(reversed(Ws), reversed(pre)):
        back = W.T @ ((1 - np.tanh(z) ** 2) * g)
        g = g + back if residual else back
    return float(np.linalg.norm(g))

for res in (False, True):
    print(res, [f"{input_grad_norm(0.5, res, d):.2e}" for d in (10, 30, 50)])
`,
  },
]);
