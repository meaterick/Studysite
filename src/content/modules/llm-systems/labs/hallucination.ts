import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "말투의 확신과 실제 정답률: ECE 계산",
    prompt: md`

\`ece(conf, correct, n_bins, lo, hi)\`를 구현합니다. 확신도 구간 $[lo, hi)$을 \`n_bins\`개로 똑같이 나눈 뒤, 구간마다 $|\text{평균 확신도} - \text{실제 정답률}|$에 그 구간의 표본 비율을 곱해 더합니다(비어 있는 구간은 건너뜀). 마지막 구간은 $hi$를 포함합니다.

\`novel_rate(samples, facts)\`: 생성한 문장 중 학습 문장(\`facts\`)에 없는 문장의 비율

확신도대로 정답이 나오는 모델은 ECE가 0에 가깝고, 늘 실제보다 자신만만한 모델은 ECE가 커야 합니다.
`,
    starter: py`
import numpy as np

def ece(conf, correct, n_bins=5, lo=0.5, hi=1.0):
    conf, correct = np.asarray(conf, dtype=float), np.asarray(correct, dtype=float)
    edges = np.linspace(lo, hi, n_bins + 1)
    total = 0.0
    for i, (a, b) in enumerate(zip(edges, edges[1:])):
        pass  # TODO: 구간 마스크(마지막 구간은 b 포함), 비어 있으면 건너뛰기
    return total

def novel_rate(samples, facts):
    return 0.0  # TODO

rng = np.random.default_rng(0)
conf = rng.uniform(0.5, 1.0, 5000)
print("보정된 모델:", ece(conf, rng.random(5000) < conf))
print("과신하는 모델:", ece(conf, rng.random(5000) < (conf - 0.5) * 0.8 + 0.4))
`,
    tests: py`
import numpy as np

@test("손으로 계산한 예: 구간 2개")
def _():
    conf = [0.6, 0.6, 0.9, 0.9]
    correct = [1, 0, 1, 1]
    assert approx(ece(conf, correct, n_bins=2), 0.5 * abs(0.6 - 0.5) + 0.5 * abs(0.9 - 1.0))

@test("확신도 1.0도 마지막 구간에 들어간다")
def _():
    assert approx(ece([1.0, 1.0], [1, 0], n_bins=5), 0.5)

@test("보정된 모델은 ECE < 0.03, 과신하는 모델은 > 0.1")
def _():
    rng = np.random.default_rng(1)
    conf = rng.uniform(0.5, 1.0, 20000)
    good = ece(conf, rng.random(20000) < conf)
    bad = ece(conf, rng.random(20000) < (conf - 0.5) * 0.8 + 0.4)
    assert good < 0.03 and bad > 0.1, f"보정 {good:.3f}, 과신 {bad:.3f}"

@test("novel_rate: 학습 문장에 없는 생성의 비율")
def _():
    facts = {"서울 은 한국 의 수도 이다", "도쿄 는 일본 의 수도 이다"}
    samples = ["서울 은 한국 의 수도 이다", "서울 은 일본 의 수도 이다", "도쿄 는 일본 의 수도 이다", "도쿄 는 한국 의 수도 이다"]
    assert approx(novel_rate(samples, facts), 0.5)
`,
    hints: ["`m = (conf >= a) & ((conf < b) if i < n_bins - 1 else (conf <= b))`", "`if m.any(): total += m.mean() * abs(conf[m].mean() - correct[m].mean())`", "`sum(s not in facts for s in samples) / len(samples)`"],
    solution: py`
import numpy as np

def ece(conf, correct, n_bins=5, lo=0.5, hi=1.0):
    conf, correct = np.asarray(conf, dtype=float), np.asarray(correct, dtype=float)
    edges = np.linspace(lo, hi, n_bins + 1)
    total = 0.0
    for i, (a, b) in enumerate(zip(edges, edges[1:])):
        m = (conf >= a) & ((conf < b) if i < n_bins - 1 else (conf <= b))
        if m.any():
            total += m.mean() * abs(conf[m].mean() - correct[m].mean())
    return float(total)

def novel_rate(samples, facts):
    return sum(s not in facts for s in samples) / len(samples)

rng = np.random.default_rng(0)
conf = rng.uniform(0.5, 1.0, 5000)
print("보정된 모델:", ece(conf, rng.random(5000) < conf))
print("과신하는 모델:", ece(conf, rng.random(5000) < (conf - 0.5) * 0.8 + 0.4))
`,
  },
]);
