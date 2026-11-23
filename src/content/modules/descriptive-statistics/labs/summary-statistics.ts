import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "평균과 중앙값을 직접 구하기",
    prompt: md`

NumPy 없이 대푯값 두 개를 구합니다.

1. \`mean(xs)\`: 산술평균
2. \`median(xs)\`: 값을 정렬한 뒤, 개수가 홀수이면 가운데 값, 짝수이면 가운데 두 값의 평균. \`sorted\`를 써서 **원래 리스트는 바꾸지 않습니다.**

본문의 연봉 데이터 \`[30, 32, 35, 38, 40, 42, 300]\`에서 평균은 약 73.9, 중앙값은 38입니다.
`,
    starter: py`
def mean(xs):
    return 0.0   # TODO

def median(xs):
    s = sorted(xs)
    n = len(s)
    # TODO: n이 홀수이면 s[n // 2], 짝수이면 가운데 두 값의 평균
    return 0.0

salary = [30, 32, 35, 38, 40, 42, 300]
print(round(mean(salary), 1), median(salary))
print(median([7, 1, 3, 9]))
`,
    tests: py`
@test("연봉 데이터: 평균 73.9, 중앙값 38")
def _():
    salary = [30, 32, 35, 38, 40, 42, 300]
    assert approx(mean(salary), 517 / 7), f"평균: {mean(salary)}"
    assert median(salary) == 38, f"중앙값: {median(salary)}"

@test("개수가 홀수·짝수인 중앙값")
def _():
    assert median([7, 1, 3, 9, 5]) == 5, f"결과: {median([7, 1, 3, 9, 5])}"
    assert approx(median([7, 1, 3, 9]), 5.0), f"결과: {median([7, 1, 3, 9])}"
    assert approx(median([4, 1]), 2.5)

@test("원래 리스트를 바꾸지 않는다")
def _():
    xs = [3, 1, 2]
    median(xs)
    assert xs == [3, 1, 2], f"리스트가 {xs}로 바뀌었습니다."
`,
    hints: [
      "평균은 `sum(xs) / len(xs)`입니다.",
      "`if n % 2 == 1: return s[n // 2]`이고, 짝수이면 `return (s[n // 2 - 1] + s[n // 2]) / 2`입니다. 4개이면 가운데 두 값의 인덱스는 1과 2입니다.",
    ],
    solution: py`
def mean(xs):
    return sum(xs) / len(xs)

def median(xs):
    s = sorted(xs)
    n = len(s)
    if n % 2 == 1:
        return s[n // 2]
    return (s[n // 2 - 1] + s[n // 2]) / 2

salary = [30, 32, 35, 38, 40, 42, 300]
print(round(mean(salary), 1), median(salary))
print(median([7, 1, 3, 9]))
`,
  },
  {
    key: "ex1",
    title: "분위수·이상치·표본분산을 정의대로 구현하기",
    prompt: md`

NumPy 없이 파이썬 리스트로 요약 통계량을 구현하고, 결과를 NumPy와 비교합니다.

1. \`quantile(xs, q)\`: 값을 정렬한 뒤 위치 $(n - 1)q$(0부터 셈)를 선형 보간합니다. 위치가 $3.5$이면 3번째와 4번째 값의 가운데입니다. \`np.quantile\`의 기본 방법과 같습니다.
2. \`iqr_outliers(xs, k=1.5)\`: $Q_1 - k \cdot \mathrm{IQR}$보다 작거나 $Q_3 + k \cdot \mathrm{IQR}$보다 큰 값을 원래 순서대로 담은 리스트
3. \`sample_variance(xs)\`: $\frac{1}{n - 1}\sum_i (x_i - \bar x)^2$
`,
    starter: py`
import math

def quantile(xs, q):
    """정렬한 값의 (n - 1) * q 위치를 선형 보간한 분위수"""
    s = sorted(xs)
    pos = (len(s) - 1) * q
    lo = math.floor(pos)
    hi = min(lo + 1, len(s) - 1)
    # TODO: s[lo]와 s[hi] 사이를 (pos - lo) 비율로 보간합니다.
    return 0.0

def iqr_outliers(xs, k=1.5):
    """1.5 IQR 규칙의 이상치 후보(원래 순서 유지)"""
    q1, q3 = quantile(xs, 0.25), quantile(xs, 0.75)
    # TODO: 기준 밖의 값을 모읍니다.
    return []

def sample_variance(xs):
    """n - 1로 나눈 표본분산"""
    # TODO
    return 0.0

scores = [52, 55, 58, 60, 61, 63, 64, 65, 67, 68, 70, 72, 75, 78, 98]
print(quantile(scores, 0.25), quantile(scores, 0.5), quantile(scores, 0.75))   # 기대: 60.5 65.0 71.0
print(iqr_outliers(scores))                                                      # 기대: [98]
print(round(sample_variance([1, 2, 3, 4]), 4))                                   # 기대: 1.6667
`,
    tests: py`
import numpy as np

scores = [52, 55, 58, 60, 61, 63, 64, 65, 67, 68, 70, 72, 75, 78, 98]

@test("본문 상자그림의 사분위수: 60.5, 65, 71")
def _():
    got = [quantile(scores, q) for q in (0.25, 0.5, 0.75)]
    assert approx(got, [60.5, 65, 71]), f"결과: {got}"

@test("정렬되지 않은 입력과 여러 q에서 np.quantile과 같다")
def _():
    xs = [9.0, -2.5, 3.0, 7.5, 0.0, 4.0, 11.0, 1.5]
    for q in (0.0, 0.1, 0.33, 0.5, 0.9, 1.0):
        assert approx(quantile(xs, q), float(np.quantile(xs, q))), f"q={q}: {quantile(xs, q)}"

@test("이상치 후보: 점수 데이터 → [98], 원래 순서 유지")
def _():
    assert iqr_outliers(scores) == [98], f"결과: {iqr_outliers(scores)}"
    assert iqr_outliers([100, 10, 11, 12, 13, -50]) == [100, -50], f"결과: {iqr_outliers([100, 10, 11, 12, 13, -50])}"

@test("이상치가 없으면 빈 리스트")
def _():
    assert iqr_outliers([1, 2, 3, 4, 5]) == []

@test("표본분산이 np.var(ddof=1)과 같다")
def _():
    xs = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
    assert approx(sample_variance(xs), float(np.var(xs, ddof=1))), f"결과: {sample_variance(xs)}"
`,
    hints: [
      "보간은 `s[lo] + (s[hi] - s[lo]) * (pos - lo)`입니다. `pos`가 정수이면 `pos - lo`가 0이라 `s[lo]`가 됩니다.",
      "`iqr = q3 - q1`, 기준은 `low = q1 - k * iqr`, `high = q3 + k * iqr`이고, `[x for x in xs if x < low or x > high]`로 순서를 유지합니다.",
      "`m = sum(xs) / len(xs)`를 구한 뒤 `sum((x - m) ** 2 for x in xs) / (len(xs) - 1)`입니다.",
    ],
    solution: py`
import math

def quantile(xs, q):
    s = sorted(xs)
    pos = (len(s) - 1) * q
    lo = math.floor(pos)
    hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (pos - lo)

def iqr_outliers(xs, k=1.5):
    q1, q3 = quantile(xs, 0.25), quantile(xs, 0.75)
    iqr = q3 - q1
    low, high = q1 - k * iqr, q3 + k * iqr
    return [x for x in xs if x < low or x > high]

def sample_variance(xs):
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / (len(xs) - 1)

scores = [52, 55, 58, 60, 61, 63, 64, 65, 67, 68, 70, 72, 75, 78, 98]
print(quantile(scores, 0.25), quantile(scores, 0.5), quantile(scores, 0.75))
print(iqr_outliers(scores))
print(round(sample_variance([1, 2, 3, 4]), 4))
`,
  },
]);
