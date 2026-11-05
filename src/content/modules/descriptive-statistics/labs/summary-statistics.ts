import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
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
