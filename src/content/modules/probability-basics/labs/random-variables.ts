import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "확률질량함수로 기댓값·분산 계산하고 합의 분포 만들기",
    prompt: md`

이산확률분포를 딕셔너리 \`{값: 확률}\`로 나타냅니다. 예를 들어 공정한 주사위는 \`{1: 1/6, 2: 1/6, ..., 6: 1/6}\`입니다.

1. \`expectation(pmf)\`: $E[X] = \sum_x x\,p(x)$
2. \`variance(pmf)\`: $\mathrm{Var}(X) = E[X^2] - (E[X])^2$
3. \`sum_pmf(pmf_x, pmf_y)\`: **독립**인 두 확률변수의 합 $X + Y$의 분포. 가능한 모든 $(x, y)$ 쌍에 대해 확률 $p(x)\,p(y)$를 값 $x + y$에 더해 나갑니다.

주사위 두 개의 합으로 $E[X + Y] = E[X] + E[Y]$와, 독립일 때의 $\mathrm{Var}(X + Y) = \mathrm{Var}(X) + \mathrm{Var}(Y)$를 확인합니다.
`,
    starter: py`
def expectation(pmf):
    """E[X] = Σ x p(x)"""
    # TODO
    return 0.0

def variance(pmf):
    """Var(X) = E[X²] - (E[X])²"""
    # TODO
    return 0.0

def sum_pmf(pmf_x, pmf_y):
    """독립인 X, Y의 합 X + Y의 분포 {값: 확률}"""
    result = {}
    for x, px in pmf_x.items():
        for y, py_ in pmf_y.items():
            pass  # TODO: result[x + y]에 px * py_를 더합니다(처음 나오는 값이면 0에서 시작).
    return result

die = {k: 1 / 6 for k in range(1, 7)}
print(expectation(die), round(variance(die), 4))          # 기대: 3.5 2.9167
two = sum_pmf(die, die)
print(round(two.get(7, 0), 4), round(expectation(two), 4), round(variance(two), 4))   # 기대: 0.1667 7.0 5.8333
`,
    tests: py`
die = {k: 1 / 6 for k in range(1, 7)}
coin = {0: 0.5, 1: 0.5}

@test("주사위: E = 3.5, Var = 35/12")
def _():
    assert approx(expectation(die), 3.5) and approx(variance(die), 35 / 12), f"{expectation(die)}, {variance(die)}"

@test("치우친 분포 {0: 0.2, 1: 0.5, 2: 0.3}: E = 1.1, Var = 0.49")
def _():
    pmf = {0: 0.2, 1: 0.5, 2: 0.3}
    assert approx(expectation(pmf), 1.1) and approx(variance(pmf), 0.49), f"{expectation(pmf)}, {variance(pmf)}"

@test("주사위 두 개의 합: P(7) = 6/36, 값은 2~12, 확률의 합 = 1")
def _():
    two = sum_pmf(die, die)
    assert sorted(two) == list(range(2, 13)), f"값: {sorted(two)}"
    assert approx(two[7], 6 / 36) and approx(two[2], 1 / 36)
    assert approx(sum(two.values()), 1.0)

@test("기댓값의 선형성과 독립일 때 분산의 합")
def _():
    two = sum_pmf(die, coin)
    assert approx(expectation(two), expectation(die) + expectation(coin))
    assert approx(variance(two), variance(die) + variance(coin))

@test("동전 세 개의 합(앞면 개수) = {0: 1/8, 1: 3/8, 2: 3/8, 3: 1/8}")
def _():
    three = sum_pmf(sum_pmf(coin, coin), coin)
    assert approx([three[k] for k in range(4)], [1 / 8, 3 / 8, 3 / 8, 1 / 8]), f"결과: {three}"
`,
    hints: [
      "`sum(x * p for x, p in pmf.items())`가 기댓값입니다.",
      "`variance`는 `sum(x ** 2 * p for x, p in pmf.items()) - expectation(pmf) ** 2`입니다.",
      "`result[x + y] = result.get(x + y, 0) + px * py_`처럼 `dict.get`의 기본값 0을 씁니다.",
    ],
    solution: py`
def expectation(pmf):
    return sum(x * p for x, p in pmf.items())

def variance(pmf):
    return sum(x ** 2 * p for x, p in pmf.items()) - expectation(pmf) ** 2

def sum_pmf(pmf_x, pmf_y):
    result = {}
    for x, px in pmf_x.items():
        for y, py_ in pmf_y.items():
            result[x + y] = result.get(x + y, 0) + px * py_
    return result

die = {k: 1 / 6 for k in range(1, 7)}
print(expectation(die), round(variance(die), 4))
two = sum_pmf(die, die)
print(round(two.get(7, 0), 4), round(expectation(two), 4), round(variance(two), 4))
`,
  },
]);
