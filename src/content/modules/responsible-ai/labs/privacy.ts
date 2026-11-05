import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "k-익명성 재기, 무작위 응답으로 비율 추정하기, 라플라스 잡음 더하기",
    prompt: md`
본문의 세 도구(재식별 위험, 무작위 응답, 라플라스 메커니즘)를 직접 만듭니다. \`rows\`는 준식별자 튜플(예: \`(나이, 성별, 동네)\`)의 리스트입니다.

1. \`k_anonymity(rows)\`: 같은 준식별자 조합을 가진 사람 수 중 가장 작은 값(이 데이터가 만족하는 $k$).
2. \`unique_fraction(rows)\`: 자기 조합을 가진 사람이 자기 혼자뿐인 사람의 비율.
3. \`rr_estimate(answers, p_truth=0.5)\`: 확률 \`p_truth\`로 사실대로, 나머지는 동전을 한 번 더 던져(앞면 "예") 답하는 무작위 응답에서, 응답(1 = 예)으로 실제 비율 $\pi$를 추정합니다. $P(\text{예}) = p\,\pi + (1-p)/2$를 $\pi$에 대해 풉니다.
4. \`rr_epsilon(p_truth=0.5)\`: 사실이 "예"인 사람이 "예"라고 답할 확률과 사실이 "아니오"인 사람이 "예"라고 답할 확률의 비에 로그를 취한 값 $\varepsilon$.
5. \`laplace_count(count, eps, rng)\`: 개수 질의(민감도 1)의 답에 척도 $1/\varepsilon$의 라플라스 잡음을 더한 값. 잡음은 \`rng.laplace(0, 1 / eps)\`로 뽑습니다.
`,
    starter: py`
import numpy as np
from math import log

def k_anonymity(rows):
    return len(rows)  # TODO: 조합별 인원 수의 최솟값

def unique_fraction(rows):
    return 0.0  # TODO

def rr_estimate(answers, p_truth=0.5):
    return float(np.mean(answers))  # TODO: P(예) = p·π + (1 - p)/2 를 π에 대해 풀기

def rr_epsilon(p_truth=0.5):
    return 0.0  # TODO: log(P(예 | 사실 예) / P(예 | 사실 아니오))

def laplace_count(count, eps, rng):
    return count  # TODO: 척도 1/eps의 라플라스 잡음

rows = [(25, "F", "강남"), (25, "F", "강남"), (31, "M", "마포"), (31, "M", "마포"), (31, "M", "마포"), (47, "F", "서초")]
print(k_anonymity(rows), unique_fraction(rows))
print(rr_estimate([1, 0, 0, 1, 0, 0, 0, 1]), round(rr_epsilon(0.5), 3))
print(laplace_count(120, 1.0, np.random.default_rng(0)))
`,
    tests: py`
import numpy as np
rows = [(25, "F", "강남"), (25, "F", "강남"), (31, "M", "마포"), (31, "M", "마포"), (31, "M", "마포"), (47, "F", "서초")]

@test("k-익명성과 혼자인 사람의 비율")
def _():
    assert k_anonymity(rows) == 1 and approx(unique_fraction(rows), 1 / 6), (k_anonymity(rows), unique_fraction(rows))
    assert k_anonymity(rows[:5]) == 2 and unique_fraction(rows[:5]) == 0.0, "서초 한 명을 빼면 k = 2, 혼자인 사람 0이어야 합니다."

@test("무작위 응답 추정: '예' 3/8이면 π = 0.25, 대규모 표본에서는 참값에 가깝다")
def _():
    assert approx(rr_estimate([1, 0, 0, 1, 0, 0, 0, 1]), 0.25), rr_estimate([1, 0, 0, 1, 0, 0, 0, 1])
    rng = np.random.default_rng(1)
    truth = rng.random(200_000) < 0.3
    for p in (0.5, 0.8):
        ans = np.where(rng.random(len(truth)) < p, truth, rng.random(len(truth)) < 0.5)
        assert abs(rr_estimate(ans, p) - 0.3) < 0.01, (p, rr_estimate(ans, p))

@test("ε: 동전 0.5면 ln 3, 0.8이면 ln 9")
def _():
    assert approx(rr_epsilon(0.5), np.log(3)) and approx(rr_epsilon(0.8), np.log(9)), (rr_epsilon(0.5), rr_epsilon(0.8))

@test("라플라스 잡음의 평균 절대 오차는 1/ε")
def _():
    rng = np.random.default_rng(0)
    for eps in (0.5, 2.0):
        errs = [abs(laplace_count(100, eps, rng) - 100) for _ in range(20000)]
        assert abs(np.mean(errs) - 1 / eps) < 0.05 / eps, (eps, np.mean(errs))
`,
    hints: ["조합별 인원은 `counts = {}` 다음 `for r in rows: counts[r] = counts.get(r, 0) + 1`로 셉니다. `k_anonymity`는 `min(counts.values())`, `unique_fraction`은 `sum(counts[r] == 1 for r in rows) / len(rows)`.", "`yes = np.mean(answers)`이고 $P(\\text{예}) = p\\pi + (1-p)/2$이므로 `(yes - (1 - p_truth) / 2) / p_truth`. $\\varepsilon$은 사실이 예일 때 `p_truth + (1 - p_truth) / 2`, 아니오일 때 `(1 - p_truth) / 2`의 비에 `log`를 취합니다.", "`count + rng.laplace(0, 1 / eps)`. 한 사람이 바꿀 수 있는 개수는 최대 1(민감도 1)이라 척도 $1/\\varepsilon$의 잡음이면 $\\varepsilon$-차등 프라이버시가 됩니다. 잡음의 평균 절댓값이 척도와 같다는 것도 확인해 보십시오."],
    solution: py`
import numpy as np
from math import log

def _counts(rows):
    counts = {}
    for r in rows:
        counts[r] = counts.get(r, 0) + 1
    return counts

def k_anonymity(rows):
    return min(_counts(rows).values())

def unique_fraction(rows):
    counts = _counts(rows)
    return sum(counts[r] == 1 for r in rows) / len(rows)

def rr_estimate(answers, p_truth=0.5):
    yes = float(np.mean(answers))
    return (yes - (1 - p_truth) / 2) / p_truth

def rr_epsilon(p_truth=0.5):
    return log((p_truth + (1 - p_truth) / 2) / ((1 - p_truth) / 2))

def laplace_count(count, eps, rng):
    return count + rng.laplace(0, 1 / eps)

rows = [(25, "F", "강남"), (25, "F", "강남"), (31, "M", "마포"), (31, "M", "마포"), (31, "M", "마포"), (47, "F", "서초")]
print(k_anonymity(rows), unique_fraction(rows))
print(rr_estimate([1, 0, 0, 1, 0, 0, 0, 1]), round(rr_epsilon(0.5), 3))
print(laplace_count(120, 1.0, np.random.default_rng(0)))
`,
  },
]);
