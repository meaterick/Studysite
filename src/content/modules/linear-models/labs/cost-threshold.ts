import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "비용 기반 임계값과 신뢰도 표",
    prompt: md`

「불균형 데이터와 임계값 결정」 단계의 계산을 함수로 만듭니다.

1. \`optimal_threshold(c_fp, c_fn)\` $= \dfrac{C_{FP}}{C_{FP} + C_{FN}}$
2. \`expected_cost(y, p, t, c_fp, c_fn)\`: \`p >= t\`이면 양성으로 예측할 때의 **샘플당 평균 비용** $(C_{FP}\cdot FP + C_{FN}\cdot FN)/n$
3. \`brier(y, p)\` $= \dfrac{1}{n}\sum (p_i - y_i)^2$
4. \`reliability_table(y, p, edges)\`: 구간 $[e_k, e_{k+1})$마다 \`(개수, 평균 예측 확률, 실제 양성 비율)\` 튜플의 리스트. 마지막 구간만 오른쪽 끝(1.0)을 포함합니다. 비어 있는 구간은 \`(0, None, None)\`입니다.
`,
    starter: py`
import numpy as np

def optimal_threshold(c_fp, c_fn):
    return 0.5  # TODO

def expected_cost(y, p, t, c_fp, c_fn):
    y, p = np.asarray(y), np.asarray(p)
    return 0.0  # TODO: FP·FN 개수를 세어 비용을 샘플 수로 나눕니다.

def brier(y, p):
    return 0.0  # TODO

def reliability_table(y, p, edges):
    y, p = np.asarray(y), np.asarray(p, dtype=float)
    rows = []
    for k in range(len(edges) - 1):
        lo, hi = edges[k], edges[k + 1]
        # TODO: 구간에 든 샘플을 고르고(마지막 구간은 hi 포함) (개수, 평균 예측, 실제 양성 비율)을 추가합니다.
    return rows

y = [0, 0, 1, 1, 0]
p = [0.1, 0.4, 0.35, 0.8, 0.05]
print("t* =", optimal_threshold(1, 10))
print("비용(t=0.5) =", expected_cost(y, p, 0.5, 1, 10), " 비용(t=t*) =", expected_cost(y, p, optimal_threshold(1, 10), 1, 10))
print("Brier =", brier(y, p))
print(reliability_table(y, p, [0, 0.3, 1.0]))
`,
    tests: py`
import numpy as np
from sklearn.linear_model import LogisticRegression

y = [0, 0, 1, 1, 0]
p = [0.1, 0.4, 0.35, 0.8, 0.05]

@test("t*(1, 10) = 1/11, t*(1, 1) = 0.5")
def _():
    assert approx(optimal_threshold(1, 10), 1 / 11) and approx(optimal_threshold(1, 1), 0.5)

@test("작은 예제의 평균 비용: t=0.5 → 2.0, t=1/11 → 0.4")
def _():
    assert approx(expected_cost(y, p, 0.5, 1, 10), 2.0), f"t=0.5: {expected_cost(y, p, 0.5, 1, 10)}"
    assert approx(expected_cost(y, p, 1 / 11, 1, 10), 0.4), f"t=1/11: {expected_cost(y, p, 1 / 11, 1, 10)}"

@test("Brier 점수 = 0.127")
def _():
    assert approx(brier(y, p), 0.127), f"결과: {brier(y, p)}"

@test("신뢰도 표: 구간 경계와 빈 구간 처리")
def _():
    rows = reliability_table(y, p, [0, 0.3, 0.5, 0.9, 1.0])
    assert rows[0][0] == 2 and approx(rows[0][1], 0.075) and approx(rows[0][2], 0.0), f"첫 구간: {rows[0]}"
    assert rows[1][0] == 2 and approx(rows[1][2], 0.5), f"둘째 구간: {rows[1]}"
    assert rows[3] == (0, None, None), f"빈 구간: {rows[3]}"
    assert reliability_table([1], [1.0], [0, 0.5, 1.0])[1][0] == 1, "마지막 구간은 1.0을 포함해야 합니다."

@test("보정된 모델에서 t*가 0.5보다 비용이 작고, 신뢰도 표가 대각선에 가깝다")
def _():
    rng = np.random.default_rng(0)
    X = rng.normal(size=(6000, 5))
    yy = (rng.random(6000) < 1 / (1 + np.exp(-(-3.6 + X @ np.array([1.2, -1.0, 0.8, 0, 0]))))).astype(int)
    pp = LogisticRegression().fit(X[:3000], yy[:3000]).predict_proba(X[3000:])[:, 1]
    yt = yy[3000:]
    assert expected_cost(yt, pp, optimal_threshold(1, 10), 1, 10) < expected_cost(yt, pp, 0.5, 1, 10)
    for count, mean_p, frac in reliability_table(yt, pp, [0, 0.05, 0.1, 0.2, 0.4, 1.0]):
        if count >= 100:
            assert abs(mean_p - frac) < 0.05, f"구간 평균 예측 {mean_p:.3f} vs 실제 {frac:.3f}"
`,
    hints: ["`pred = p >= t`, `fp = np.sum(pred & (y == 0))`, `fn = np.sum(~pred & (y == 1))`입니다.", "`brier`는 `np.mean((np.asarray(p) - np.asarray(y)) ** 2)`입니다.", "구간 마스크는 `(p >= lo) & (p < hi)`이고, 마지막 구간(`k == len(edges) - 2`)만 `p <= hi`로 바꿉니다. 개수가 0이면 `(0, None, None)`을 넣습니다."],
    solution: py`
import numpy as np

def optimal_threshold(c_fp, c_fn):
    return c_fp / (c_fp + c_fn)

def expected_cost(y, p, t, c_fp, c_fn):
    y, p = np.asarray(y), np.asarray(p)
    pred = p >= t
    fp = np.sum(pred & (y == 0))
    fn = np.sum(~pred & (y == 1))
    return (c_fp * fp + c_fn * fn) / len(y)

def brier(y, p):
    return float(np.mean((np.asarray(p, dtype=float) - np.asarray(y)) ** 2))

def reliability_table(y, p, edges):
    y, p = np.asarray(y), np.asarray(p, dtype=float)
    rows = []
    for k in range(len(edges) - 1):
        lo, hi = edges[k], edges[k + 1]
        last = k == len(edges) - 2
        mask = (p >= lo) & ((p <= hi) if last else (p < hi))
        n = int(mask.sum())
        rows.append((n, float(p[mask].mean()), float(y[mask].mean())) if n else (0, None, None))
    return rows

y = [0, 0, 1, 1, 0]
p = [0.1, 0.4, 0.35, 0.8, 0.05]
print("t* =", optimal_threshold(1, 10))
print("비용(t=0.5) =", expected_cost(y, p, 0.5, 1, 10), " 비용(t=t*) =", expected_cost(y, p, optimal_threshold(1, 10), 1, 10))
print("Brier =", brier(y, p))
print(reliability_table(y, p, [0, 0.3, 1.0]))
`,
  },
]);
