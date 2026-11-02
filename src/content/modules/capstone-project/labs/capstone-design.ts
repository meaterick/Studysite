import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "캡스톤용 재현 가능한 실험 뼈대: 시드 분할과 다중 시드 요약",
    prompt: md`

캡스톤 「구현과 실험」에 그대로 가져다 쓸 수 있는 실험 뼈대를 만듭니다.

1. \`seeded_split(n, test_ratio, seed)\`: \`np.random.default_rng(seed).permutation(n)\`으로 섞은 인덱스에서 앞의 \`round(n × test_ratio)\`개를 테스트, 나머지를 학습으로 해 \`(train_idx, test_idx)\`를 돌려줍니다. 같은 시드면 항상 같은 분할입니다.
2. \`run_seeds(fn, seeds)\`: 시드마다 \`fn(seed)\`를 실행해 \`{"scores", "mean", "std"}\`(표준편차는 \`ddof=1\`)를 돌려줍니다.
3. \`report_line(name, summary)\`: \`"baseline: 0.812 ± 0.013 (시드 5개)"\` 형식의 한 줄(소수 셋째 자리).
`,
    starter: py`
import numpy as np

def seeded_split(n, test_ratio, seed):
    idx = np.arange(n)
    return idx, idx[:0]  # TODO

def run_seeds(fn, seeds):
    return {"scores": [], "mean": 0.0, "std": 0.0}  # TODO

def report_line(name, summary):
    return name  # TODO

noisy_baseline = lambda seed: 0.80 + 0.02 * np.random.default_rng(seed).standard_normal()
print(seeded_split(10, 0.3, seed=0))
print(report_line("baseline", run_seeds(noisy_baseline, range(5))))
`,
    tests: py`
import numpy as np

@test("같은 시드는 같은 분할, 다른 시드는 다른 분할")
def _():
    tr1, te1 = seeded_split(100, 0.2, seed=7)
    tr2, te2 = seeded_split(100, 0.2, seed=7)
    tr3, te3 = seeded_split(100, 0.2, seed=8)
    assert list(te1) == list(te2) and list(tr1) == list(tr2) and list(te1) != list(te3)

@test("학습·테스트가 겹치지 않고 전체를 덮으며 크기가 맞다")
def _():
    tr, te = seeded_split(10, 0.3, seed=0)
    assert len(te) == 3 and len(tr) == 7 and set(tr) | set(te) == set(range(10)) and not set(tr) & set(te), (tr, te)
    assert list(te) == list(np.random.default_rng(0).permutation(10)[:3])

@test("다중 시드 요약: 평균과 표본 표준편차")
def _():
    s = run_seeds(lambda seed: [0.8, 0.82, 0.84][seed], range(3))
    assert list(s["scores"]) == [0.8, 0.82, 0.84] and approx(s["mean"], 0.82) and approx(s["std"], 0.02), s

@test("보고 형식: 'baseline: 0.820 ± 0.020 (시드 3개)'")
def _():
    s = run_seeds(lambda seed: [0.8, 0.82, 0.84][seed], range(3))
    assert report_line("baseline", s) == "baseline: 0.820 ± 0.020 (시드 3개)", report_line("baseline", s)
`,
    hints: ["`perm = np.random.default_rng(seed).permutation(n)`, `k = int(round(n * test_ratio))`, `return perm[k:], perm[:k]`", "`scores = [fn(s) for s in seeds]` 다음 `np.mean(scores)`, `np.std(scores, ddof=1)`", "`f\"{name}: {summary['mean']:.3f} ± {summary['std']:.3f} (시드 {len(summary['scores'])}개)\"`. 시드 값과 설정을 이렇게 코드 밖으로 남겨 두면 리포트의 '재현성·문서화' 근거가 됩니다."],
    solution: py`
import numpy as np

def seeded_split(n, test_ratio, seed):
    perm = np.random.default_rng(seed).permutation(n)
    k = int(round(n * test_ratio))
    return perm[k:], perm[:k]

def run_seeds(fn, seeds):
    scores = [fn(s) for s in seeds]
    return {"scores": scores, "mean": float(np.mean(scores)), "std": float(np.std(scores, ddof=1))}

def report_line(name, summary):
    return f"{name}: {summary['mean']:.3f} ± {summary['std']:.3f} (시드 {len(summary['scores'])}개)"

noisy_baseline = lambda seed: 0.80 + 0.02 * np.random.default_rng(seed).standard_normal()
print(seeded_split(10, 0.3, seed=0))
print(report_line("baseline", run_seeds(noisy_baseline, range(5))))
`,
  },
]);
