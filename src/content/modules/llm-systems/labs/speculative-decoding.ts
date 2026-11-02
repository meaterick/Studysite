import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "투기적 디코딩의 출력 분포와 최적 초안 길이",
    prompt: md`

「투기적 디코딩」 단계의 증명과 속도 계산을 코드로 확인합니다.

1. \`acceptance_rate(p, q)\`: $\alpha = \sum_y \min(p(y), q(y))$
2. \`output_distribution(p, q)\`: 투기적 샘플링 한 스텝의 **정확한** 출력 분포 $q(x)\min(1, p(x)/q(x)) + (1 - \alpha)\cdot\text{잔여 분포}(x)$. 잔여 분포는 $(p - q)_+$를 정규화한 것이고, $\alpha = 1$이면(잔여가 모두 0) 둘째 항이 없습니다. $q$는 모든 토큰에 양수라고 가정합니다.
3. \`expected_tokens(alpha, k)\`: 큰 모델 호출당 기대 토큰 수 $\frac{1 - \alpha^{k+1}}{1 - \alpha}$ ($\alpha = 1$이면 $k + 1$)
4. \`speedup(alpha, k, c)\`: 초안 한 스텝 비용이 큰 모델의 \`c\`배일 때 $\frac{\text{expected\_tokens}}{kc + 1}$
5. \`best_k(alpha, c, k_max=20)\`: \`1..k_max\` 중 속도 향상이 가장 큰 \`(k, speedup)\`
`,
    starter: py`
import numpy as np

def acceptance_rate(p, q):
    return 0.0  # TODO

def output_distribution(p, q):
    return np.array(q, dtype=float)  # TODO: 수락 항 + 잔여 항

def expected_tokens(alpha, k):
    return 1.0  # TODO

def speedup(alpha, k, c):
    return 1.0  # TODO

def best_k(alpha, c, k_max=20):
    return 1, 1.0  # TODO

p = np.array([0.50, 0.20, 0.15, 0.10, 0.05])
q = np.array([0.30, 0.30, 0.20, 0.10, 0.10])
print(acceptance_rate(p, q), output_distribution(p, q))
`,
    tests: py`
import numpy as np
p = np.array([0.50, 0.20, 0.15, 0.10, 0.05])
q = np.array([0.30, 0.30, 0.20, 0.10, 0.10])

@test("수락률 = Σmin(p, q) = 0.8")
def _():
    assert approx(acceptance_rate(p, q), 0.8), f"결과: {acceptance_rate(p, q)}"

@test("출력 분포가 정확히 목표 분포 p다")
def _():
    out = output_distribution(p, q)
    assert approx(out, p), f"결과: {np.round(out, 4)}"

@test("무작위 p, q 50쌍에서도 출력 분포 = p, q = p이면 수락률 1")
def _():
    rng = np.random.default_rng(0)
    for _ in range(50):
        pp, qq = rng.dirichlet(np.ones(6)), rng.dirichlet(np.ones(6))
        assert approx(output_distribution(pp, qq), pp)
    assert approx(acceptance_rate(p, p), 1.0) and approx(output_distribution(p, p), p)

@test("기대 토큰 수: α=0.8, k=4 → 3.3616, α=1이면 k+1")
def _():
    assert approx(expected_tokens(0.8, 4), 3.3616), f"결과: {expected_tokens(0.8, 4)}"
    assert approx(expected_tokens(0.6, 1), 1.6)
    assert approx(expected_tokens(1.0, 4), 5.0)

@test("c=0.1, α=0.8에서 최적 k=6, 약 2.47배")
def _():
    assert approx(speedup(0.8, 4, 0.1), 3.3616 / 1.4)
    k, s = best_k(0.8, 0.1)
    assert k == 6 and approx(s, 2.4703, 1e-3), f"결과: k={k}, 속도 {s}"
`,
    hints: ["`acceptance_rate`는 `np.minimum(p, q).sum()`입니다.", "`output_distribution`: 수락 항은 `q * np.minimum(1, p / q)`(= `np.minimum(p, q)`), 잔여는 `res = np.maximum(p - q, 0)`입니다. `res.sum() > 0`일 때만 `(1 - alpha) * res / res.sum()`을 더합니다.", "`expected_tokens`는 `alpha == 1`이면 `k + 1`, 아니면 `(1 - alpha ** (k + 1)) / (1 - alpha)`입니다. `best_k`는 `max(((k, speedup(alpha, k, c)) for k in range(1, k_max + 1)), key=lambda t: t[1])`입니다."],
    solution: py`
import numpy as np

def acceptance_rate(p, q):
    return float(np.minimum(p, q).sum())

def output_distribution(p, q):
    p, q = np.asarray(p, dtype=float), np.asarray(q, dtype=float)
    out = q * np.minimum(1, p / q)
    res = np.maximum(p - q, 0)
    if res.sum() > 0:
        out = out + (1 - acceptance_rate(p, q)) * res / res.sum()
    return out

def expected_tokens(alpha, k):
    if alpha == 1:
        return k + 1
    return (1 - alpha ** (k + 1)) / (1 - alpha)

def speedup(alpha, k, c):
    return expected_tokens(alpha, k) / (k * c + 1)

def best_k(alpha, c, k_max=20):
    return max(((k, speedup(alpha, k, c)) for k in range(1, k_max + 1)), key=lambda t: t[1])

p = np.array([0.50, 0.20, 0.15, 0.10, 0.05])
q = np.array([0.30, 0.30, 0.20, 0.10, 0.10])
print(acceptance_rate(p, q), output_distribution(p, q))
`,
  },
]);
