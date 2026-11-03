import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "He·Xavier 초기화와 층별 활성화 분산 추적",
    prompt: md`
$\mathrm{Var}(z) \approx \text{fan\_in} \cdot \mathrm{Var}(w) \cdot \mathrm{Var}(x)$에서 나온 초기화 규칙을 구현하고 실험합니다.

1. \`he_std(fan_in)\` $= \sqrt{2/\text{fan\_in}}$ (ReLU용), \`xavier_std(fan_in, fan_out)\` $= \sqrt{2/(\text{fan\_in} + \text{fan\_out})}$
2. \`activation_stds(std, n_layers, width, seed)\`: 표준정규 입력(샘플 1000개, 특성 width개)을 \`n_layers\`개의 "선형(가중치 표준편차 std) → ReLU" 층에 통과시키며, **입력과 각 층 출력**의 표준편차를 리스트로 돌려줍니다(길이 n_layers + 1).

He 초기화를 쓰면 층을 지나도 표준편차가 거의 일정하고, 1.5배로 키우면 층마다 약 1.5배씩 커져야 합니다.
`,
    starter: py`
import numpy as np

def he_std(fan_in):
    return 0.0  # TODO

def xavier_std(fan_in, fan_out):
    return 0.0  # TODO

def activation_stds(std, n_layers=10, width=256, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal((1000, width))
    stds = [x.std()]
    for _ in range(n_layers):
        pass  # TODO: W = rng.standard_normal((width, width)) * std, x = ReLU(x @ W), 표준편차 기록
    return stds

he = he_std(256)
for name, s in [("He", he), ("1.5배", he * 1.5), ("0.8배", he * 0.8)]:
    print(name, [round(float(v), 3) for v in activation_stds(s)])
`,
    tests: py`
import numpy as np

@test("he_std(50) = 0.2, xavier_std(100, 100) = 0.1")
def _():
    assert approx(he_std(50), 0.2) and approx(xavier_std(100, 100), 0.1)

@test("길이 = 층 수 + 1, 첫 값은 입력의 표준편차(≈1)")
def _():
    s = activation_stds(he_std(64), n_layers=5, width=64)
    assert len(s) == 6 and abs(s[0] - 1) < 0.05, f"결과: {s}"

@test("He 초기화: 10층을 지나도 표준편차가 0.5~1.5 사이로 유지된다")
def _():
    s = activation_stds(he_std(256))
    assert all(0.5 < v < 1.5 for v in s[1:]), f"결과: {[round(float(v), 3) for v in s]}"

@test("1.5배 초기화: 10층 뒤 He보다 30배 이상 크다(≈ 1.5¹⁰ = 57.7배)")
def _():
    he = activation_stds(he_std(256))[-1]
    big = activation_stds(he_std(256) * 1.5)[-1]
    assert big / he > 30, f"비율 {big / he:.1f}"

@test("0.8배 초기화: 10층 뒤 He의 0.2배 미만(≈ 0.8¹⁰ = 0.107배)")
def _():
    he = activation_stds(he_std(256))[-1]
    small = activation_stds(he_std(256) * 0.8)[-1]
    assert small / he < 0.2, f"비율 {small / he:.3f}"
`,
    hints: ["`np.sqrt(2 / fan_in)`, `np.sqrt(2 / (fan_in + fan_out))`", "반복문 안에서 `W = rng.standard_normal((width, width)) * std` → `x = np.maximum(0, x @ W)` → `stds.append(x.std())`", "He에서 표준편차가 1이 아니라 약 0.8 근처인 이유는 ReLU가 음수 절반을 0으로 만들기 때문입니다. 핵심은 층을 지나도 일정하다는 점입니다."],
    solution: py`
import numpy as np

def he_std(fan_in):
    return np.sqrt(2 / fan_in)

def xavier_std(fan_in, fan_out):
    return np.sqrt(2 / (fan_in + fan_out))

def activation_stds(std, n_layers=10, width=256, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal((1000, width))
    stds = [x.std()]
    for _ in range(n_layers):
        W = rng.standard_normal((width, width)) * std
        x = np.maximum(0, x @ W)
        stds.append(x.std())
    return stds

he = he_std(256)
for name, s in [("He", he), ("1.5배", he * 1.5), ("0.8배", he * 0.8)]:
    print(name, [round(float(v), 3) for v in activation_stds(s)])
`,
  },
]);
