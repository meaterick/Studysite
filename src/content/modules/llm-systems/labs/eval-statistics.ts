import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "윌슨 구간, 필요한 문항 수, 짝지은 부트스트랩, 채점관 보정",
    prompt: md`
본문의 도구 네 가지를 구현합니다. \`v1\`, \`v2\`는 두 프롬프트(v1·v2)의 20문항별 정답 여부(0/1)입니다.

1. \`wilson_ci(k, n, z=1.96)\`: $n$문항 중 $k$개를 맞혔을 때의 윌슨 구간 \`(lo, hi)\`. 부동소수 오차로 범위를 벗어나지 않게 \`[0, 1]\`로 자릅니다.
2. \`n_needed(margin, p=0.5, z=1.96)\`: 오차 범위 $\pm m$을 얻는 문항 수 $\lceil z^2 p(1-p)/m^2 \rceil$.
3. \`paired_bootstrap_ci(v1, v2, B=2000, seed=0, alpha=0.05)\`: \`rng = np.random.default_rng(seed)\`로 \`idx = rng.integers(0, n, size=(B, n))\`를 한 번 뽑고, **같은** \`idx\`로 v1과 v2를 함께 골라 정확도 차이(v2 − v1) $B$개를 만든 뒤 \`np.percentile\`로 $100\alpha/2$, $100(1-\alpha/2)$ 백분위수를 \`(lo, hi)\`로 돌려줍니다.
4. \`rogan_gladen(q, se, sp)\`: 채점관 통과율 $q$를 민감도 se, 특이도 sp로 보정한 정확도 $(q + \text{sp} - 1)/(\text{se} + \text{sp} - 1)$을 \`[0, 1]\`로 자른 값. $\text{se} + \text{sp} \le 1$이면 채점관이 우연 수준 이하라 보정할 수 없으므로 \`ValueError\`.
`,
    starter: py`
import numpy as np
from math import sqrt, ceil

v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])

def wilson_ci(k, n, z=1.96):
    p = k / n
    h = z * sqrt(p * (1 - p) / n)
    return p - h, p + h          # TODO: 정규 근사 대신 윌슨 구간, [0, 1]로 자르기

def n_needed(margin, p=0.5, z=1.96):
    return 0  # TODO

def paired_bootstrap_ci(v1, v2, B=2000, seed=0, alpha=0.05):
    return 0.0, 0.0  # TODO: 같은 idx로 v1, v2를 함께 복원 추출

def rogan_gladen(q, se, sp):
    return q  # TODO: 보정, [0, 1]로 자르기, se + sp <= 1이면 ValueError

print(wilson_ci(17, 20), wilson_ci(20, 20))
print(n_needed(0.10), n_needed(0.05))
print(paired_bootstrap_ci(v1, v2))
print(rogan_gladen(0.78, 0.9, 0.8))
`,
    tests: py`
import numpy as np
v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])

@test("윌슨 구간: 17/20 ≈ [0.640, 0.948], 20/20 ≈ [0.839, 1], 0/20은 0에서 시작")
def _():
    assert approx(wilson_ci(17, 20), [0.6396, 0.9476], 1e-3), wilson_ci(17, 20)
    assert approx(wilson_ci(20, 20), [0.8389, 1.0], 1e-3), wilson_ci(20, 20)
    lo, hi = wilson_ci(0, 20)
    assert lo == 0.0 and approx(hi, 0.1611, 1e-3), (lo, hi)
    assert approx(wilson_ci(170, 200), [0.7942, 0.8927], 1e-3), wilson_ci(170, 200)

@test("필요한 문항 수: ±0.10 → 97, ±0.05 → 385, p = 0.9면 139")
def _():
    assert (n_needed(0.10), n_needed(0.05), n_needed(0.05, p=0.9)) == (97, 385, 139), (n_needed(0.10), n_needed(0.05), n_needed(0.05, p=0.9))

@test("짝지은 부트스트랩: v1 → v2 차이의 구간 [-0.15, 0.35]는 0을 포함")
def _():
    lo, hi = paired_bootstrap_ci(v1, v2)
    assert approx([lo, hi], [-0.15, 0.35], 1e-9), (lo, hi)
    assert paired_bootstrap_ci(v1, v1) == (0.0, 0.0), "같은 시스템끼리의 차이는 항상 0이어야 합니다(짝을 지어 뽑았다면)."
    a = np.array([1] * 150 + [0] * 30 + [0] * 15 + [1] * 5)
    b = np.array([1] * 150 + [0] * 30 + [1] * 15 + [0] * 5)
    lo2, hi2 = paired_bootstrap_ci(a, b)
    assert lo2 > 0 and hi2 - lo2 < 0.1, (lo2, hi2)

@test("채점관 보정: 0.78 → 약 0.829, 범위 자르기, 우연 수준이면 ValueError")
def _():
    assert approx(rogan_gladen(0.78, 0.9, 0.8), 0.8286, 1e-3), rogan_gladen(0.78, 0.9, 0.8)
    assert rogan_gladen(0.1, 0.9, 0.8) == 0.0 and rogan_gladen(1.0, 0.7, 0.9) == 1.0
    try:
        rogan_gladen(0.5, 0.5, 0.5)
    except ValueError:
        pass
    else:
        raise AssertionError("se + sp <= 1인데 ValueError가 나지 않았습니다.")
`,
    hints: ["`d = 1 + z * z / n`, `center = (p + z * z / (2 * n)) / d`, `half = z / d * sqrt(p * (1 - p) / n + z * z / (4 * n * n))`, 그리고 `max(0.0, center - half), min(1.0, center + half)`.", "`n_needed`는 `ceil(z * z * p * (1 - p) / margin ** 2)`. 부트스트랩은 `diffs = v2[idx].mean(axis=1) - v1[idx].mean(axis=1)` 다음 `np.percentile(diffs, [100 * alpha / 2, 100 * (1 - alpha / 2)])`. v1과 v2를 같은 `idx`로 골라야 문항 난이도의 공통 변동이 빼기에서 상쇄됩니다.", "`if se + sp <= 1: raise ValueError(...)`, 그다음 `min(1.0, max(0.0, (q + sp - 1) / (se + sp - 1)))`. 관측 통과율 $q = \\text{se}\\,p + (1 - \\text{sp})(1 - p)$를 $p$에 대해 푼 식입니다."],
    solution: py`
import numpy as np
from math import sqrt, ceil

v1 = np.array([1,1,1,0,1,1,0,1,1,1, 0,1,1,1,0,1,1,0,1,1])
v2 = np.array([1,1,1,1,1,1,1,1,0,1, 1,1,1,1,1,1,0,0,1,1])

def wilson_ci(k, n, z=1.96):
    p = k / n
    d = 1 + z * z / n
    center = (p + z * z / (2 * n)) / d
    half = z / d * sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return max(0.0, center - half), min(1.0, center + half)

def n_needed(margin, p=0.5, z=1.96):
    return ceil(z * z * p * (1 - p) / margin ** 2)

def paired_bootstrap_ci(v1, v2, B=2000, seed=0, alpha=0.05):
    v1, v2 = np.asarray(v1), np.asarray(v2)
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(v1), size=(B, len(v1)))
    diffs = v2[idx].mean(axis=1) - v1[idx].mean(axis=1)
    lo, hi = np.percentile(diffs, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(lo), float(hi)

def rogan_gladen(q, se, sp):
    if se + sp <= 1:
        raise ValueError("채점관이 우연 수준 이하라 보정할 수 없음")
    return min(1.0, max(0.0, (q + sp - 1) / (se + sp - 1)))

print(wilson_ci(17, 20), wilson_ci(20, 20))
print(n_needed(0.10), n_needed(0.05))
print(paired_bootstrap_ci(v1, v2))
print(rogan_gladen(0.78, 0.9, 0.8))
`,
  },
]);
