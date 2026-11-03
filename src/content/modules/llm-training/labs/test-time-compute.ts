import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "다수결과 best-of-n의 정답률 계산기",
    prompt: md`
본문의 식을 함수로 만듭니다. 표본은 모두 독립이라고 가정합니다.

1. \`majority_correct(p, n)\`: 정답·오답 두 갈래인 문제를 \`n\`번(홀수) 풀어 다수결할 때 정답일 확률 $\sum_{k > n/2}\binom{n}{k}p^k(1-p)^{n-k}$ (\`math.comb\` 사용)
2. \`perfect_best_of_n(p, n)\`: 완벽한 검증기로 고를 때의 정답률 $1 - (1-p)^n$
3. \`best_of_n_exact(p, n, tpr, fpr)\`: 검증기가 정답을 \`tpr\`, 오답을 \`fpr\` 확률로 통과시키고, 통과한 후보 중 하나를 무작위로 고르며, 아무도 통과하지 못하면 첫 후보를 낼 때의 정답률. $a = p\cdot\text{TPR}$, $b = (1-p)\cdot\text{FPR}$, $u = 1 - a - b$라 하면 $(1 - u^n)\frac{a}{a+b} + u^n\frac{p(1-\text{TPR})}{u}$입니다.
4. \`verifier_limit(p, tpr, fpr)\`: $n \to \infty$ 한계 $\frac{a}{a+b}$
`,
    starter: py`
from math import comb

def majority_correct(p, n):
    return 0.0  # TODO: k가 n//2 + 1부터 n까지인 이항확률의 합

def perfect_best_of_n(p, n):
    return 0.0  # TODO

def best_of_n_exact(p, n, tpr, fpr):
    a, b = p * tpr, (1 - p) * fpr
    u = 1 - a - b
    return 0.0  # TODO

def verifier_limit(p, tpr, fpr):
    return 0.0  # TODO

for n in (1, 5, 21, 101):
    print(n, round(majority_correct(0.6, n), 3), round(majority_correct(0.4, n), 3))
`,
    tests: py`
@test("다수결: p=0.6이면 n=5에서 0.68256, n=101에서 약 0.979")
def _():
    assert approx(majority_correct(0.6, 1), 0.6)
    assert approx(majority_correct(0.6, 5), 0.68256), f"결과: {majority_correct(0.6, 5)}"
    assert approx(majority_correct(0.6, 101), 0.979, 1e-3)

@test("다수결: p>0.5면 n과 함께 오르고 p<0.5면 떨어진다")
def _():
    ns = list(range(1, 52, 2))
    up = [majority_correct(0.6, n) for n in ns]
    down = [majority_correct(0.4, n) for n in ns]
    assert all(x < y for x, y in zip(up, up[1:])), "p=0.6인데 단조 증가가 아닙니다"
    assert all(x > y for x, y in zip(down, down[1:])), "p=0.4인데 단조 감소가 아닙니다"
    assert approx(majority_correct(0.4, 101), 0.021, 1e-3)

@test("완벽한 검증기: 1 - 0.7^4 = 0.7599")
def _():
    assert approx(perfect_best_of_n(0.3, 4), 0.7599), f"결과: {perfect_best_of_n(0.3, 4)}"

@test("best-of-n: n=1이면 p 그대로, 좋은 검증기 n=4에서 약 0.652")
def _():
    for tpr, fpr in [(0.9, 0.1), (0.9, 0.5), (0.6, 0.3)]:
        assert approx(best_of_n_exact(0.3, 1, tpr, fpr), 0.3), f"n=1, tpr={tpr}, fpr={fpr}"
    assert approx(best_of_n_exact(0.3, 4, 0.9, 0.1), 0.6521, 1e-3)
    assert approx(best_of_n_exact(0.3, 4, 0.9, 0.5), 0.4280, 1e-3)

@test("TPR 1, FPR 0이면 완벽한 검증기와 같다")
def _():
    for n in (2, 4, 16):
        assert approx(best_of_n_exact(0.3, n, 1.0, 0.0), perfect_best_of_n(0.3, n)), f"n={n}"

@test("n이 커지면 검증기의 정밀도 a/(a+b)에 수렴한다")
def _():
    assert approx(verifier_limit(0.3, 0.9, 0.1), 0.794, 1e-3)
    assert approx(verifier_limit(0.3, 0.9, 0.5), 0.4355, 1e-3)
    assert approx(best_of_n_exact(0.3, 500, 0.9, 0.5), verifier_limit(0.3, 0.9, 0.5))
`,
    hints: ["`majority_correct`는 `sum(comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n // 2 + 1, n + 1))`입니다.", "`best_of_n_exact`는 `(1 - u ** n) * a / (a + b) + u ** n * p * (1 - tpr) / u`입니다. 통과한 후보가 하나라도 있으면 고른 후보가 정답일 확률은 몇 개가 통과했든 `a / (a + b)`입니다.", "`verifier_limit`는 `a / (a + b)`, 즉 정밀도와 같은 식입니다([[lesson:classification-metrics]])."],
    solution: py`
from math import comb

def majority_correct(p, n):
    return sum(comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n // 2 + 1, n + 1))

def perfect_best_of_n(p, n):
    return 1 - (1 - p) ** n

def best_of_n_exact(p, n, tpr, fpr):
    a, b = p * tpr, (1 - p) * fpr
    u = 1 - a - b
    return (1 - u ** n) * a / (a + b) + u ** n * p * (1 - tpr) / u

def verifier_limit(p, tpr, fpr):
    a, b = p * tpr, (1 - p) * fpr
    return a / (a + b)

for n in (1, 5, 21, 101):
    print(n, round(majority_correct(0.6, n), 3), round(majority_correct(0.4, n), 3))
`,
  },
]);
