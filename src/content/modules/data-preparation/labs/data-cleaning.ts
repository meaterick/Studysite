import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "IQR과 Z-score로 이상치 찾기",
    prompt: md`

「데이터 수집·정제와 결측값·이상치」 예제를 함수로 만듭니다. 사분위수는 본문처럼 **정렬한 데이터를 반으로 나눠 각 절반의 중앙값**으로 구합니다.

1. \`quartiles(data)\`: $(Q_1, Q_3)$
2. \`iqr_outliers(data)\`: $Q_1 - 1.5\,\text{IQR}$보다 작거나 $Q_3 + 1.5\,\text{IQR}$보다 큰 값의 리스트
3. \`zscore_outliers(data, threshold=3)\`: $|z| > \text{threshold}$인 값의 리스트 (표준편차는 \`np.std\`, 모집단 기준)

\`[12, 13, 13, 14, 14, 15, 16, 95]\`에서 두 방법의 결론이 왜 다른지 출력으로 확인해 보십시오.
`,
    starter: py`
import numpy as np

def quartiles(data):
    d = np.sort(np.asarray(data, dtype=float))
    n = len(d)
    # TODO: 앞쪽 절반 d[:n // 2]의 중앙값이 Q1, 뒤쪽 절반 d[n // 2:]의 중앙값이 Q3
    return 0.0, 0.0

def iqr_outliers(data):
    q1, q3 = quartiles(data)
    iqr = q3 - q1
    # TODO: 울타리(fence) 바깥의 값만 골라 리스트로 돌려줍니다.
    return []

def zscore_outliers(data, threshold=3):
    d = np.asarray(data, dtype=float)
    # TODO: z = (값 - 평균) / 표준편차, |z| > threshold인 값의 리스트
    return []

data = [12, 13, 13, 14, 14, 15, 16, 95]
print("Q1, Q3 =", quartiles(data))
print("IQR 이상치:", iqr_outliers(data))
print("Z-score 이상치(|z|>3):", zscore_outliers(data))
`,
    tests: py`
data = [12, 13, 13, 14, 14, 15, 16, 95]

@test("Q1 = 13, Q3 = 15.5")
def _():
    q1, q3 = quartiles(data)
    assert approx(q1, 13) and approx(q3, 15.5), f"결과: {(q1, q3)}"

@test("IQR 방법은 95를 이상치로 판정한다")
def _():
    got = [float(v) for v in iqr_outliers(data)]
    assert got == [95.0], f"결과: {got}"

@test("Z-score(|z|>3)는 95를 놓친다(z ≈ 2.64)")
def _():
    assert list(zscore_outliers(data)) == [], f"결과: {list(zscore_outliers(data))}"

@test("기준을 2로 낮추면 Z-score도 95를 잡는다")
def _():
    got = [float(v) for v in zscore_outliers(data, threshold=2)]
    assert got == [95.0], f"결과: {got}"

@test("아래쪽 이상치도 잡는다")
def _():
    got = [float(v) for v in iqr_outliers([-40, 10, 11, 12, 12, 13, 14, 15])]
    assert got == [-40.0], f"결과: {got}"
`,
    hints: ["`np.median(d[:n // 2])`와 `np.median(d[n // 2:])`가 각각 Q1과 Q3입니다.", "울타리는 `low = q1 - 1.5 * iqr`, `high = q3 + 1.5 * iqr`입니다. `[v for v in data if v < low or v > high]`", "Z-score는 `(d - d.mean()) / d.std()`로 한 번에 계산하고, `d[np.abs(z) > threshold].tolist()`처럼 불리언 인덱싱으로 고릅니다."],
    solution: py`
import numpy as np

def quartiles(data):
    d = np.sort(np.asarray(data, dtype=float))
    n = len(d)
    return float(np.median(d[: n // 2])), float(np.median(d[n // 2 :]))

def iqr_outliers(data):
    q1, q3 = quartiles(data)
    iqr = q3 - q1
    low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return [v for v in data if v < low or v > high]

def zscore_outliers(data, threshold=3):
    d = np.asarray(data, dtype=float)
    z = (d - d.mean()) / d.std()
    return d[np.abs(z) > threshold].tolist()

data = [12, 13, 13, 14, 14, 15, 16, 95]
print("Q1, Q3 =", quartiles(data))
print("IQR 이상치:", iqr_outliers(data))
print("Z-score 이상치(|z|>3):", zscore_outliers(data))
`,
  },
]);
