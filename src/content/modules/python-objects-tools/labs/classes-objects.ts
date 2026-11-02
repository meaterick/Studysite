import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "평균과 분산을 함께 유지하는 기록기 클래스",
    prompt: md`

「Python 한 걸음 더: 클래스와 예외 처리」 단계의 클래스 문법으로, 평균만 유지하는 \`RunningMean\`을 넓혀 값을 저장하지 않고 **평균과 분산**을 함께 유지하는 \`RunningStats\` 클래스를 만듭니다. 학습 중 손실이나 배치 통계(4주차 배치 정규화)를 기록할 때 실제로 쓰는 방법입니다.

분산을 "제곱의 평균 − 평균의 제곱"으로 구하면 값이 클 때 큰 수끼리 빼면서 자릿수가 사라져 **음수 분산**까지 나옵니다. 그래서 웰퍼드(Welford) 방법으로 갱신합니다. 새 값 $x$가 들어오면

$$n \leftarrow n + 1,\quad \delta = x - \bar x_{\text{이전}},\quad \bar x \leftarrow \bar x + \frac{\delta}{n},\quad M_2 \leftarrow M_2 + \delta\,(x - \bar x_{\text{새}})$$

이고, 분산(모분산)은 $M_2 / n$입니다.

1. \`update(x)\`: \`x\`가 숫자(\`int\`, \`float\`)가 아니면 **상태를 바꾸지 않고** \`TypeError\`를 일으킵니다. 숫자면 위 식으로 갱신하고 새 평균을 돌려줍니다.
2. \`variance()\`: 값이 하나도 없으면 \`ValueError\`, 있으면 $M_2 / n$
3. \`reset()\`: 처음 상태로 되돌립니다.
`,
    starter: py`
class RunningStats:
    """값을 하나씩 받아 평균과 분산을 유지한다(값을 모두 저장하지 않는다)."""
    def __init__(self):
        self.n = 0
        self.mean = 0.0
        self.m2 = 0.0          # 평균과의 차이 제곱의 합 (= 분산 × n)

    def update(self, x):
        # TODO 1: x가 int나 float가 아니면 TypeError를 일으킵니다. (isinstance 활용)
        # TODO 2: 웰퍼드 방법으로 n, mean, m2를 갱신합니다.
        return self.mean

    def variance(self):
        # TODO 3: 값이 하나도 없으면 ValueError, 아니면 m2 / n
        return 0.0

    def reset(self):
        # TODO 4: 처음 상태로 되돌립니다.
        pass

s = RunningStats()
for v in [2, 4, 4, 4, 5, 5, 7, 9]:
    s.update(v)
print("평균", s.mean, "분산", s.variance())          # 기대: 5.0, 4.0

big = RunningStats()
for v in [1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16]:
    big.update(v)
print("큰 값의 분산", big.variance())                 # 기대: 22.5 (단순 공식은 -128.0)
try:
    s.update("0.3")
except TypeError as e:
    print("TypeError:", e)
`,
    tests: py`
@test("update가 매번 새 평균을 돌려준다: 0.9 → 0.8 → 0.6667 → 0.55")
def _():
    s = RunningStats()
    got = [s.update(v) for v in [0.9, 0.7, 0.4, 0.2]]
    assert approx(got, [0.9, 0.8, 2.0 / 3, 0.55], 1e-4), f"결과: {got}"

@test("[2, 4, 4, 4, 5, 5, 7, 9]의 평균 5, 분산 4")
def _():
    s = RunningStats()
    for v in [2, 4, 4, 4, 5, 5, 7, 9]:
        s.update(v)
    assert approx(s.mean, 5.0) and approx(s.variance(), 4.0), f"평균 {s.mean}, 분산 {s.variance()}"

@test("10억 근처의 값에서도 분산이 정확하다(22.5)")
def _():
    s = RunningStats()
    for v in [1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16]:
        s.update(v)
    assert approx(s.variance(), 22.5, 1e-6), f"분산: {s.variance()}"

@test("값이 없으면 variance()가 ValueError")
def _():
    try:
        RunningStats().variance()
    except ValueError:
        return
    raise AssertionError("ValueError가 발생하지 않았습니다.")

@test("숫자가 아니면 TypeError, 상태는 그대로")
def _():
    s = RunningStats()
    s.update(1.0)
    try:
        s.update("0.3")
    except TypeError:
        assert s.n == 1 and approx(s.mean, 1.0), f"n={s.n}, mean={s.mean}: 상태가 바뀌었습니다."
        return
    raise AssertionError("TypeError가 발생하지 않았습니다.")

@test("reset 뒤에는 처음부터 다시 센다")
def _():
    s = RunningStats()
    for v in [10, 20]:
        s.update(v)
    s.reset()
    s.update(3)
    assert s.n == 1 and approx(s.mean, 3) and approx(s.variance(), 0.0), f"n={s.n}, mean={s.mean}"

@test("두 객체는 상태를 공유하지 않는다")
def _():
    a, b = RunningStats(), RunningStats()
    a.update(5)
    assert a.n == 1 and b.n == 0
`,
    hints: ["`if not isinstance(x, (int, float)): raise TypeError(\"숫자만 기록할 수 있습니다\")`를 `update` 맨 앞에 두면, 예외가 나도 아래의 갱신 코드가 실행되지 않아 상태가 그대로입니다.", "순서가 중요합니다. `self.n += 1` → `delta = x - self.mean` → `self.mean += delta / self.n` → `self.m2 += delta * (x - self.mean)`. 마지막 줄의 `self.mean`은 이미 갱신된 새 평균입니다.", "`variance`는 `if self.n == 0: raise ValueError(...)` 뒤에 `return self.m2 / self.n`입니다. `reset`은 `self.__init__()`을 다시 불러도 됩니다."],
    solution: py`
class RunningStats:
    def __init__(self):
        self.n = 0
        self.mean = 0.0
        self.m2 = 0.0

    def update(self, x):
        if not isinstance(x, (int, float)):
            raise TypeError(f"숫자만 기록할 수 있습니다: {x!r}")
        self.n += 1
        delta = x - self.mean
        self.mean += delta / self.n
        self.m2 += delta * (x - self.mean)
        return self.mean

    def variance(self):
        if self.n == 0:
            raise ValueError("아직 값이 하나도 없습니다")
        return self.m2 / self.n

    def reset(self):
        self.__init__()

s = RunningStats()
for v in [2, 4, 4, 4, 5, 5, 7, 9]:
    s.update(v)
print("평균", s.mean, "분산", s.variance())

big = RunningStats()
for v in [1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16]:
    big.update(v)
print("큰 값의 분산", big.variance())
try:
    s.update("0.3")
except TypeError as e:
    print("TypeError:", e)
`,
  },
]);
