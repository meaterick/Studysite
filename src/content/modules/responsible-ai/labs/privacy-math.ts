import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "멤버십 추론 공격의 이득, ε이 허용하는 상한, DP-SGD의 표본별 자르기",
    prompt: md`
본문의 계산을 직접 구현합니다.

1. \`max_advantage(eps, delta=0.0)\`: $(\varepsilon, \delta)$-차등 프라이버시 아래에서 멤버십 추론 이득(TPR − FPR)의 최댓값 $\frac{(e^\varepsilon - 1)(1-\delta)}{e^\varepsilon + 1} + \delta$.
2. \`best_advantage(conf_members, conf_nonmembers)\`: "확신도가 문턱값 이상이면 구성원"이라고 추측하는 공격에서, 모든 관측값을 문턱값 후보로 시도했을 때 가장 큰 TPR − FPR.
3. \`clip_rows(G, C)\`: 표본별 기울기(행)마다 길이가 $C$를 넘으면 $C$로 줄인 배열. 길이가 $C$ 이하인 행은 그대로 둡니다.
4. \`dp_step(G, C, sigma, rng)\`: DP-SGD 한 걸음의 기울기. \`clip_rows\`로 자른 뒤 행을 모두 더하고, 표준편차 $\sigma C$의 가우스 잡음(\`rng.normal(0, sigma * C, size=열 수)\`)을 더해 행 수로 나눕니다.
`,
    starter: py`
import numpy as np
from math import exp

def max_advantage(eps, delta=0.0):
    return 1.0  # TODO

def best_advantage(conf_members, conf_nonmembers):
    return 0.0  # TODO

def clip_rows(G, C):
    return np.asarray(G, dtype=float)  # TODO: 행 길이가 C를 넘으면 C로

def dp_step(G, C, sigma, rng):
    return np.asarray(G, dtype=float).mean(axis=0)  # TODO: 자르기 → 합 → 잡음 → 행 수로 나누기

for eps in (0.1, 1.0, 8.0):
    print(eps, round(max_advantage(eps), 3))
print(best_advantage([0.9, 0.8, 0.7, 0.6], [0.65, 0.5, 0.4, 0.3]))
print(clip_rows([[3, 4], [0.3, 0.4]], 1.0))
`,
    tests: py`
import numpy as np

@test("ε별 공격 이득의 상한: 0.1 → 0.050, 1 → 0.462, 8 → 0.999")
def _():
    assert approx([max_advantage(e) for e in (0.1, 1.0, 8.0)], [0.04996, 0.46212, 0.99933], 1e-4), [max_advantage(e) for e in (0.1, 1.0, 8.0)]
    assert approx(max_advantage(0.0), 0.0) and approx(max_advantage(1.0, 1e-5), 0.462123, 1e-5) and approx(max_advantage(0.0, 0.1), 0.1)

@test("공격 이득: 가장 좋은 문턱값에서 TPR - FPR")
def _():
    assert approx(best_advantage([0.9, 0.8, 0.7, 0.6], [0.65, 0.5, 0.4, 0.3]), 0.75)
    assert approx(best_advantage([0.5, 0.5], [0.5, 0.5]), 0.0) and approx(best_advantage([1.0, 0.99], [0.1, 0.2]), 1.0)

@test("자르기: 긴 행은 길이 C로, 짧은 행은 그대로")
def _():
    out = clip_rows([[3, 4], [0.3, 0.4]], 1.0)
    assert approx(out, [[0.6, 0.8], [0.3, 0.4]]), out
    G = np.random.default_rng(0).normal(size=(50, 7)) * 3
    assert np.linalg.norm(clip_rows(G, 2.0), axis=1).max() <= 2.0 + 1e-9

@test("DP-SGD 한 걸음: σ = 0이면 자른 기울기의 평균, 잡음은 배치가 클수록 작다")
def _():
    rng = np.random.default_rng(0)
    G = rng.normal(size=(200, 5)) * 3
    assert approx(dp_step(G, 1.0, 0.0, rng), clip_rows(G, 1.0).mean(axis=0)), "σ = 0이면 잡음이 없어야 합니다."
    noise10 = np.std([dp_step(G[:10], 1.0, 1.0, rng) - clip_rows(G[:10], 1.0).mean(axis=0) for _ in range(2000)])
    noise200 = np.std([dp_step(G, 1.0, 1.0, rng) - clip_rows(G, 1.0).mean(axis=0) for _ in range(2000)])
    assert approx(noise10, 1 / 10, 0.01) and approx(noise200, 1 / 200, 0.001), (noise10, noise200)
`,
    hints: ["`(exp(eps) - 1) * (1 - delta) / (exp(eps) + 1) + delta`. $\\text{TPR} = e^\\varepsilon\\text{FPR} + \\delta$와 $1 - \\text{FPR} = e^\\varepsilon(1 - \\text{TPR}) + \\delta$를 함께 풀면 이 값이 나옵니다.", "`cm, cn = np.asarray(...)` 다음 `max(np.mean(cm >= t) - np.mean(cn >= t) for t in np.concatenate([cm, cn]))`. 관측값 사이의 문턱값은 결과가 같으므로 관측값만 시도하면 충분합니다.", "자르기는 `n = np.linalg.norm(G, axis=1, keepdims=True)`, `G / np.maximum(1, n / C)`. 한 걸음은 `(clip_rows(G, C).sum(axis=0) + rng.normal(0, sigma * C, size=G.shape[1])) / len(G)`."],
    solution: py`
import numpy as np
from math import exp

def max_advantage(eps, delta=0.0):
    return (exp(eps) - 1) * (1 - delta) / (exp(eps) + 1) + delta

def best_advantage(conf_members, conf_nonmembers):
    cm, cn = np.asarray(conf_members, float), np.asarray(conf_nonmembers, float)
    return float(max(np.mean(cm >= t) - np.mean(cn >= t) for t in np.concatenate([cm, cn])))

def clip_rows(G, C):
    G = np.asarray(G, dtype=float)
    n = np.linalg.norm(G, axis=1, keepdims=True)
    return G / np.maximum(1, n / C)

def dp_step(G, C, sigma, rng):
    G = np.asarray(G, dtype=float)
    return (clip_rows(G, C).sum(axis=0) + rng.normal(0, sigma * C, size=G.shape[1])) / len(G)

for eps in (0.1, 1.0, 8.0):
    print(eps, round(max_advantage(eps), 3))
print(best_advantage([0.9, 0.8, 0.7, 0.6], [0.65, 0.5, 0.4, 0.3]))
print(clip_rows([[3, 4], [0.3, 0.4]], 1.0))
`,
  },
]);
