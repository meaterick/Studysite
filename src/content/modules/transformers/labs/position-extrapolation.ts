import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "RoPE의 파장·상대 위치와 위치 보간",
    prompt: md`
본문의 계산을 구현합니다. 성분 쌍 $i = 0, \dots, d/2 - 1$의 회전 속도는 $\theta_i = \text{base}^{-2i/d}$입니다.

1. \`rope_freqs(d, base=10000)\`: 길이 $d/2$인 $\theta$ 배열
2. \`rope(v, pos, freqs)\`: 벡터 \`v\`(길이 $d$)의 성분 쌍 \`(v[2i], v[2i+1])\`을 각도 \`pos * freqs[i]\`만큼 회전한 새 벡터
3. \`n_unrotated(d, L, base=10000)\`: 파장 $2\pi/\theta_i$가 학습 길이 \`L\`보다 긴(학습 중 한 바퀴도 못 돈) 성분 쌍의 개수
4. \`interpolate(pos, L_train, L_new)\`: 위치 보간 $\text{pos}\cdot\frac{L_{\text{train}} - 1}{L_{\text{new}} - 1}$
`,
    starter: py`
import numpy as np

def rope_freqs(d, base=10000.0):
    return np.ones(d // 2)  # TODO

def rope(v, pos, freqs):
    return np.array(v, dtype=float)  # TODO

def n_unrotated(d, L, base=10000.0):
    return 0  # TODO

def interpolate(pos, L_train, L_new):
    return pos  # TODO

f = rope_freqs(64)
print(n_unrotated(64, 2048), interpolate(8191, 2048, 8192))
`,
    tests: py`
import numpy as np

@test("θ_0 = 1, θ_i = base^(-2i/d)")
def _():
    f = rope_freqs(8)
    assert approx(f, [1.0, 10000 ** -0.25, 10000 ** -0.5, 10000 ** -0.75])

@test("회전은 벡터 길이를 바꾸지 않는다")
def _():
    v = np.random.default_rng(0).normal(size=16)
    assert approx(np.linalg.norm(rope(v, 37, rope_freqs(16))), np.linalg.norm(v))

@test("내적은 상대 거리에만 의존한다")
def _():
    rng = np.random.default_rng(1)
    q, k, f = rng.normal(size=16), rng.normal(size=16), rope_freqs(16)
    a = rope(q, 5, f) @ rope(k, 3, f)
    b = rope(q, 105, f) @ rope(k, 103, f)
    c = rope(q, 3, f) @ rope(k, 5, f)
    assert approx(a, b) and not approx(a, c)

@test("d=64, 학습 길이 2048에서 한 바퀴도 못 도는 성분 11개")
def _():
    assert n_unrotated(64, 2048) == 11, f"결과: {n_unrotated(64, 2048)}"
    assert n_unrotated(64, 100_000) == 0

@test("위치 보간: 8191 → 2047, 0 → 0")
def _():
    assert approx(interpolate(8191, 2048, 8192), 2047.0) and approx(interpolate(0, 2048, 8192), 0.0)
`,
    hints: ["`base ** (-np.arange(0, d, 2) / d)`가 $\\theta$ 배열입니다.", "`out = v.copy()` 뒤 성분 쌍마다 `c, s = np.cos(pos * freqs[i]), np.sin(pos * freqs[i])`, `out[2i], out[2i+1] = c*v[2i] - s*v[2i+1], s*v[2i] + c*v[2i+1]`입니다.", "`n_unrotated`는 `int(np.sum(2 * np.pi / rope_freqs(d, base) > L))`입니다."],
    solution: py`
import numpy as np

def rope_freqs(d, base=10000.0):
    return base ** (-np.arange(0, d, 2) / d)

def rope(v, pos, freqs):
    v = np.asarray(v, dtype=float)
    out = v.copy()
    for i, th in enumerate(freqs):
        c, s = np.cos(pos * th), np.sin(pos * th)
        out[2 * i], out[2 * i + 1] = c * v[2 * i] - s * v[2 * i + 1], s * v[2 * i] + c * v[2 * i + 1]
    return out

def n_unrotated(d, L, base=10000.0):
    return int(np.sum(2 * np.pi / rope_freqs(d, base) > L))

def interpolate(pos, L_train, L_new):
    return pos * (L_train - 1) / (L_new - 1)

f = rope_freqs(64)
print(n_unrotated(64, 2048), interpolate(8191, 2048, 8192))
`,
  },
]);
