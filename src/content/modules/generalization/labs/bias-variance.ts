import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "편향²과 분산을 시뮬레이션으로 계산하기",
    prompt: md`

참 함수를 아는 시뮬레이션에서 편향과 분산을 직접 계산합니다.

1. \`bias_variance(preds, truth)\`: 모양 \`(R, m)\`인 \`preds\`는 학습 데이터 \`R\`세트로 학습한 모델이 지점 \`m\`개에서 낸 예측이고, \`truth\`는 그 지점의 참값입니다. 지점마다 $(\text{예측 평균} - \text{참값})^2$과 예측의 분산(\`ddof=0\`)을 구해, 지점에 대해 평균한 \`(bias2, variance)\`를 돌려줍니다.
2. \`simulate_preds(degree, grid, n_sets=200, n=30, noise=0.2, seed=0)\`: \`np.random.default_rng(seed)\` 하나로 \`n_sets\`번 반복해, 매번 \`x\`를 $[0, 1]$ 균등분포에서 \`n\`개 뽑고 $y = \sin(2\pi x) + \varepsilon$($\varepsilon \sim N(0, \text{noise}^2)$)을 만든 뒤 \`np.polyfit\`으로 \`degree\`차 다항식을 학습해 \`grid\`에서 예측합니다. 결과는 모양 \`(n_sets, len(grid))\`인 배열입니다.
`,
    starter: py`
import numpy as np

def bias_variance(preds, truth):
    P, f = np.asarray(preds, dtype=float), np.asarray(truth, dtype=float)
    bias2 = 0.0     # TODO: 지점마다 (열 평균 - 참값)² 의 평균
    variance = 0.0  # TODO: 지점마다 열 분산의 평균
    return bias2, variance

def simulate_preds(degree, grid, n_sets=200, n=30, noise=0.2, seed=0):
    rng = np.random.default_rng(seed)
    preds = []
    for _ in range(n_sets):
        pass  # TODO: x, y를 뽑고 np.polyfit, np.polyval로 grid에서 예측합니다.
    return np.array(preds)

print(bias_variance([[9.8], [10.3], [9.9], [10.1], [9.9]], [10.0]))   # 기대: 편향² 0, 분산 약 0.032
grid = np.linspace(0.05, 0.95, 50)
for d in [1, 3, 9]:
    P = simulate_preds(d, grid)
    print(d, np.round(bias_variance(P, np.sin(2 * np.pi * grid)), 4) if P.size else "TODO")
`,
    tests: py`
import numpy as np

@test("본문 표의 모델 B: 편향² 0, 분산 14")
def _():
    b2, v = bias_variance(np.array([[6.0], [14.0], [8.0], [15.0], [7.0]]), np.array([10.0]))
    assert approx([b2, v], [0.0, 14.0]), f"결과: {b2}, {v}"

@test("지점 여러 개는 평균한다")
def _():
    P = np.array([[1.0, 2.0], [3.0, 2.0]])
    b2, v = bias_variance(P, np.array([0.0, 2.0]))
    assert approx([b2, v], [2.0, 0.5]), f"결과: {b2}, {v}"

@test("simulate_preds: 모양 (n_sets, 지점 수)")
def _():
    P = simulate_preds(3, np.linspace(0, 1, 7), n_sets=20)
    assert np.shape(P) == (20, 7), f"모양: {np.shape(P)}"

@test("차수 1은 편향이, 차수 9는 분산이 차수 3보다 크다")
def _():
    grid = np.linspace(0.05, 0.95, 50)
    f = np.sin(2 * np.pi * grid)
    r = {d: bias_variance(simulate_preds(d, grid), f) for d in (1, 3, 9)}
    assert r[1][0] > 10 * r[3][0], f"편향²: 차수 1 {r[1][0]:.4f}, 차수 3 {r[3][0]:.4f}"
    assert r[9][1] > 10 * r[3][1], f"분산: 차수 9 {r[9][1]:.4f}, 차수 3 {r[3][1]:.4f}"
`,
    hints: [
      "`bias2 = np.mean((P.mean(axis=0) - f) ** 2)`, `variance = np.mean(P.var(axis=0))`입니다. `axis=0`은 학습 데이터 세트 방향입니다.",
      "반복 안에서 `x = rng.uniform(0, 1, n)`, `y = np.sin(2 * np.pi * x) + rng.normal(0, noise, n)`을 만듭니다.",
      "`preds.append(np.polyval(np.polyfit(x, y, degree), grid))`로 예측을 모읍니다.",
    ],
    solution: py`
import numpy as np

def bias_variance(preds, truth):
    P, f = np.asarray(preds, dtype=float), np.asarray(truth, dtype=float)
    bias2 = float(np.mean((P.mean(axis=0) - f) ** 2))
    variance = float(np.mean(P.var(axis=0)))
    return bias2, variance

def simulate_preds(degree, grid, n_sets=200, n=30, noise=0.2, seed=0):
    rng = np.random.default_rng(seed)
    preds = []
    for _ in range(n_sets):
        x = rng.uniform(0, 1, n)
        y = np.sin(2 * np.pi * x) + rng.normal(0, noise, n)
        preds.append(np.polyval(np.polyfit(x, y, degree), grid))
    return np.array(preds)

print(bias_variance([[9.8], [10.3], [9.9], [10.1], [9.9]], [10.0]))
grid = np.linspace(0.05, 0.95, 50)
for d in [1, 3, 9]:
    P = simulate_preds(d, grid)
    print(d, np.round(bias_variance(P, np.sin(2 * np.pi * grid)), 4))
`,
  },
]);
