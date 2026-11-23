import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "표본공간을 만들고 사건의 결과 세기",
    prompt: md`

주사위 두 개를 던지는 실험을 코드로 나열하고 확률을 셉니다.

1. \`omega\`: 두 눈의 순서쌍 \`(첫째 눈, 둘째 눈)\` 36개를 담은 리스트. 리스트 컴프리헨션으로 만듭니다.
2. \`high\`: \`omega\` 중 두 눈의 합이 10 이상인 결과의 리스트
3. \`p_high\`: 합이 10 이상일 확률. \`Fraction(결과 수, 전체 결과 수)\`로 정확한 분수를 씁니다.

먼저 본문의 표에서 합이 10 이상인 칸이 몇 개인지 세어 두면 결과를 확인할 수 있습니다.
`,
    starter: py`
from fractions import Fraction

omega = []      # TODO: (a, b) 순서쌍 36개
high = []       # TODO: 합이 10 이상인 결과
p_high = None   # TODO: Fraction으로 확률

print(len(omega), high, p_high)
`,
    tests: py`
from fractions import Fraction

@test("표본공간: 순서쌍 36개")
def _():
    assert len(omega) == 36, f"결과 수: {len(omega)}"
    assert set(omega) == {(a, b) for a in range(1, 7) for b in range(1, 7)}, "1~6의 모든 순서쌍이어야 합니다."

@test("합이 10 이상인 결과 6개")
def _():
    assert sorted(high) == [(4, 6), (5, 5), (5, 6), (6, 4), (6, 5), (6, 6)], f"결과: {sorted(high)}"

@test("확률 1/6")
def _():
    assert p_high == Fraction(1, 6), f"결과: {p_high}"
`,
    hints: [
      "`omega = [(a, b) for a in range(1, 7) for b in range(1, 7)]`처럼 반복을 두 번 씁니다. `range(1, 7)`은 1부터 6까지입니다.",
      "`high = [o for o in omega if o[0] + o[1] >= 10]`이고, 확률은 `Fraction(len(high), len(omega))`입니다.",
    ],
    solution: py`
from fractions import Fraction

omega = [(a, b) for a in range(1, 7) for b in range(1, 7)]
high = [o for o in omega if o[0] + o[1] >= 10]
p_high = Fraction(len(high), len(omega))

print(len(omega), high, p_high)
`,
  },
  {
    key: "ex1",
    title: "사건의 확률을 세어서 계산하고 독립성 판정하기",
    prompt: md`

주사위 두 개를 던지는 실험의 표본공간 \`omega\`(36개의 순서쌍)가 주어집니다. 사건은 결과 하나를 받아 \`True\`/\`False\`를 돌려주는 함수로 나타냅니다. 예를 들어 "합이 7"은 \`lambda o: o[0] + o[1] == 7\`입니다.

1. \`prob(event, omega)\`: 모든 결과가 같은 가능성으로 나올 때 사건의 확률(사건에 속한 결과 수 / 전체 결과 수)
2. \`prob_union(a, b, omega)\`: 덧셈 법칙 $P(A \cup B) = P(A) + P(B) - P(A \cap B)$
3. \`independent(a, b, omega)\`: $P(A \cap B)$와 $P(A)P(B)$가 같으면(차이가 \`1e-12\`보다 작으면) \`True\`
4. \`at_least_once(p, n)\`: 확률이 \`p\`인 사건을 독립으로 \`n\`번 시도할 때 적어도 한 번 일어날 확률 $1 - (1 - p)^n$
`,
    starter: py`
from itertools import product

omega = list(product(range(1, 7), repeat=2))   # (첫째 눈, 둘째 눈) 36가지

def prob(event, omega):
    """사건 event(결과 → bool)의 확률"""
    # TODO: event가 True인 결과의 개수를 전체 개수로 나눕니다.
    return 0.0

def prob_union(a, b, omega):
    """P(A ∪ B) = P(A) + P(B) - P(A ∩ B)"""
    both = lambda o: a(o) and b(o)
    # TODO
    return 0.0

def independent(a, b, omega):
    """P(A ∩ B) == P(A) P(B) 이면 True"""
    # TODO
    return False

def at_least_once(p, n):
    """독립으로 n번 시도할 때 적어도 한 번 일어날 확률"""
    # TODO: 여사건 "n번 모두 일어나지 않음"을 이용합니다.
    return 0.0

sum7 = lambda o: o[0] + o[1] == 7
first6 = lambda o: o[0] == 6
print(prob(sum7, omega))                    # 기대: 0.1666...
print(prob_union(first6, lambda o: o[1] == 6, omega))   # 기대: 11/36 = 0.3055...
print(independent(sum7, first6, omega))     # 기대: True
print(round(at_least_once(1 / 6, 4), 4))    # 기대: 0.5177
`,
    tests: py`
from itertools import product
omega = list(product(range(1, 7), repeat=2))

@test("P(합 = 7) = 1/6, P(합 = 12) = 1/36")
def _():
    assert approx(prob(lambda o: o[0] + o[1] == 7, omega), 1 / 6)
    assert approx(prob(lambda o: o[0] + o[1] == 12, omega), 1 / 36)

@test("P(첫째가 6 또는 둘째가 6) = 11/36")
def _():
    got = prob_union(lambda o: o[0] == 6, lambda o: o[1] == 6, omega)
    assert approx(got, 11 / 36), f"결과: {got}"

@test("배반사건이면 확률을 그대로 더한 값과 같다: 합 2 또는 합 12 → 2/36")
def _():
    got = prob_union(lambda o: sum(o) == 2, lambda o: sum(o) == 12, omega)
    assert approx(got, 2 / 36), f"결과: {got}"

@test("독립: 첫째가 짝수와 둘째가 짝수, 합이 7과 첫째가 6")
def _():
    assert independent(lambda o: o[0] % 2 == 0, lambda o: o[1] % 2 == 0, omega)
    assert independent(lambda o: sum(o) == 7, lambda o: o[0] == 6, omega)

@test("독립이 아님: 합이 10 이상과 첫째가 6, 배반인 합 2와 합 12")
def _():
    assert not independent(lambda o: sum(o) >= 10, lambda o: o[0] == 6, omega)
    assert not independent(lambda o: sum(o) == 2, lambda o: sum(o) == 12, omega)

@test("적어도 한 번: 주사위 4번 중 6 → 1 - (5/6)^4, 동전 3번 중 앞면 → 7/8")
def _():
    assert approx(at_least_once(1 / 6, 4), 1 - (5 / 6) ** 4)
    assert approx(at_least_once(0.5, 3), 7 / 8)
`,
    hints: [
      "`sum(1 for o in omega if event(o)) / len(omega)`처럼 True인 결과의 개수를 셉니다.",
      "`prob_union`은 `prob(a, omega) + prob(b, omega) - prob(both, omega)`입니다.",
      "`independent`는 `abs(prob(both, omega) - prob(a, omega) * prob(b, omega)) < 1e-12`, `at_least_once`는 `1 - (1 - p) ** n`입니다.",
    ],
    solution: py`
from itertools import product

omega = list(product(range(1, 7), repeat=2))

def prob(event, omega):
    return sum(1 for o in omega if event(o)) / len(omega)

def prob_union(a, b, omega):
    both = lambda o: a(o) and b(o)
    return prob(a, omega) + prob(b, omega) - prob(both, omega)

def independent(a, b, omega):
    both = lambda o: a(o) and b(o)
    return abs(prob(both, omega) - prob(a, omega) * prob(b, omega)) < 1e-12

def at_least_once(p, n):
    return 1 - (1 - p) ** n

sum7 = lambda o: o[0] + o[1] == 7
first6 = lambda o: o[0] == 6
print(prob(sum7, omega))
print(prob_union(first6, lambda o: o[1] == 6, omega))
print(independent(sum7, first6, omega))
print(round(at_least_once(1 / 6, 4), 4))
`,
  },
]);
