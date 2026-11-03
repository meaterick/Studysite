import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "BatchNorm과 LayerNorm: 평균과 분산을 구하는 축의 차이",
    prompt: md`
두 정규화 층을 \`gamma\`, \`beta\`까지 포함해 구현합니다(\`eps=1e-5\`).

- \`batch_norm(z, gamma, beta)\`: 배치 축(axis=0)으로 특성마다 평균과 분산을 구해 정규화
- \`layer_norm(z, gamma, beta)\`: **마지막 축**으로 샘플(토큰)마다 평균과 분산을 구해 정규화. (B, T, d) 모양의 Transformer 텐서에도 그대로 동작해야 합니다.

정규화한 뒤 \`gamma * 정규화값 + beta\`를 돌려줍니다.
`,
    starter: py`
import numpy as np

def batch_norm(z, gamma=1.0, beta=0.0, eps=1e-5):
    z = np.asarray(z, dtype=float)
    # TODO: axis=0 평균과 분산
    return z

def layer_norm(z, gamma=1.0, beta=0.0, eps=1e-5):
    z = np.asarray(z, dtype=float)
    # TODO: 마지막 축 평균과 분산 (keepdims=True)
    return z

z = np.array([[2.0, 4.0], [6.0, 8.0]])
print("BN:\n", np.round(batch_norm(z), 3))
print("LN:\n", np.round(layer_norm(z), 3))
`,
    tests: py`
import numpy as np
z = np.array([[2.0, 4.0], [6.0, 8.0]])

@test("BN: 특성(열)마다 평균 0 → [[-1, -1], [1, 1]]")
def _():
    assert approx(batch_norm(z), [[-1, -1], [1, 1]], 1e-4), f"결과: {batch_norm(z)}"

@test("LN: 샘플(행)마다 평균 0 → [[-1, 1], [-1, 1]]")
def _():
    assert approx(layer_norm(z), [[-1, 1], [-1, 1]], 1e-4), f"결과: {layer_norm(z)}"

@test("배치 크기가 1이면 BN의 출력은 모두 0이고, LN은 0이 아닌 값을 낸다")
def _():
    one = np.array([[3.0, 7.0, 1.0]])
    assert approx(batch_norm(one), [[0, 0, 0]]) and np.abs(layer_norm(one)).max() > 0.5

@test("gamma·beta로 원래 값을 되돌릴 수 있다")
def _():
    x = np.array([[1.0, 5.0, 9.0], [2.0, 2.0, 8.0]])
    mu, sd = x.mean(axis=1, keepdims=True), np.sqrt(x.var(axis=1, keepdims=True) + 1e-5)
    assert approx(layer_norm(x, gamma=sd, beta=mu), x, 1e-6)

@test("(B, T, d) 텐서: 토큰마다 평균 0, 표준편차 1")
def _():
    h = np.random.default_rng(0).normal(5, 3, size=(2, 3, 4))
    out = layer_norm(h)
    assert np.shape(out) == (2, 3, 4) and approx(out.mean(axis=-1), np.zeros((2, 3))) and approx(out.std(axis=-1), np.ones((2, 3)), 1e-3)
`,
    hints: ["BN: `mu, var = z.mean(axis=0), z.var(axis=0)`, LN: `z.mean(axis=-1, keepdims=True)`, `z.var(axis=-1, keepdims=True)`", "정규화는 `(z - mu) / np.sqrt(var + eps)`입니다.", "마지막에 `gamma * z_hat + beta`를 돌려줍니다. LN에서 keepdims를 빼면 (B, T) 모양 평균을 (B, T, d)에서 뺄 때 브로드캐스팅이 어긋납니다."],
    solution: py`
import numpy as np

def batch_norm(z, gamma=1.0, beta=0.0, eps=1e-5):
    z = np.asarray(z, dtype=float)
    mu, var = z.mean(axis=0), z.var(axis=0)
    return gamma * (z - mu) / np.sqrt(var + eps) + beta

def layer_norm(z, gamma=1.0, beta=0.0, eps=1e-5):
    z = np.asarray(z, dtype=float)
    mu, var = z.mean(axis=-1, keepdims=True), z.var(axis=-1, keepdims=True)
    return gamma * (z - mu) / np.sqrt(var + eps) + beta

z = np.array([[2.0, 4.0], [6.0, 8.0]])
print("BN:\n", np.round(batch_norm(z), 3))
print("LN:\n", np.round(layer_norm(z), 3))
`,
  },
]);
