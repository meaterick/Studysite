import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "선택률·TPR·FPR·PPV로 세 공정성 기준 점검하기",
    prompt: md`
본문의 채용 AI 숫자 예제를 함수로 확인합니다.

1. \`group_rates(y_true, y_pred)\`: \`{"selection", "tpr", "fpr", "ppv"}\`. 선택률은 $P(\hat{Y}=1)$, TPR은 $P(\hat{Y}=1 \mid Y=1)$, FPR은 $P(\hat{Y}=1 \mid Y=0)$, PPV는 $P(Y=1 \mid \hat{Y}=1)$입니다.
2. \`fairness_gaps(ra, rb)\`: 두 집단 지표 딕셔너리에서 \`{"dp", "tpr", "fpr", "ppv"}\` 격차(절댓값). \`dp\`는 선택률 격차입니다.
3. \`selection_from(tpr, fpr, base_rate)\`: $\text{선택률} = \text{TPR} \times \text{기저율} + \text{FPR} \times (1 - \text{기저율})$. TPR·FPR이 같아도 기저율이 다르면 선택률이 달라지는 이유입니다.
`,
    starter: py`
# 본문 숫자 예제: A 집단 TP=40, FP=10 / B 집단 TP=16, FP=16 (균등화된 오즈는 맞고 선택률은 다르다)
yA_true = [1] * 50 + [0] * 50
yA_pred = [1] * 40 + [0] * 10 + [1] * 10 + [0] * 40
yB_true = [1] * 20 + [0] * 80
yB_pred = [1] * 16 + [0] * 4 + [1] * 16 + [0] * 64
yB_pred_dp = [1] * 18 + [0] * 2 + [1] * 32 + [0] * 48    # 선택률을 50%로 맞춘 뒤: TP=18, FP=32

def group_rates(y_true, y_pred):
    return {"selection": 0.0, "tpr": 0.0, "fpr": 0.0, "ppv": 0.0}  # TODO

def fairness_gaps(ra, rb):
    return {"dp": 0.0, "tpr": 0.0, "fpr": 0.0, "ppv": 0.0}  # TODO

def selection_from(tpr, fpr, base_rate):
    return 0.0  # TODO

ra, rb, rb_dp = group_rates(yA_true, yA_pred), group_rates(yB_true, yB_pred), group_rates(yB_true, yB_pred_dp)
print("조정 전 격차:", fairness_gaps(ra, rb))
print("선택률을 맞춘 뒤 격차:", fairness_gaps(ra, rb_dp))
`,
    tests: py`
# 본문 숫자 예제: A 집단 TP=40, FP=10 / B 집단 TP=16, FP=16 (균등화된 오즈는 맞고 선택률은 다르다)
yA_true = [1] * 50 + [0] * 50
yA_pred = [1] * 40 + [0] * 10 + [1] * 10 + [0] * 40
yB_true = [1] * 20 + [0] * 80
yB_pred = [1] * 16 + [0] * 4 + [1] * 16 + [0] * 64
yB_pred_dp = [1] * 18 + [0] * 2 + [1] * 32 + [0] * 48    # 선택률을 50%로 맞춘 뒤: TP=18, FP=32

@test("A 집단: 선택률 0.5, TPR 0.8, FPR 0.2, PPV 0.8")
def _():
    r = group_rates(yA_true, yA_pred)
    assert approx([r["selection"], r["tpr"], r["fpr"], r["ppv"]], [0.5, 0.8, 0.2, 0.8]), r

@test("조정 전: 균등화된 오즈는 성립(TPR·FPR 격차 0)하지만 선택률 격차 0.18, PPV 격차 0.3")
def _():
    gaps = fairness_gaps(group_rates(yA_true, yA_pred), group_rates(yB_true, yB_pred))
    assert approx([gaps["dp"], gaps["tpr"], gaps["fpr"], gaps["ppv"]], [0.18, 0.0, 0.0, 0.3]), gaps

@test("선택률을 맞추면 dp 격차 0, 대신 FPR 격차가 0.2로 벌어진다")
def _():
    gaps = fairness_gaps(group_rates(yA_true, yA_pred), group_rates(yB_true, yB_pred_dp))
    assert approx(gaps["dp"], 0.0) and approx(gaps["fpr"], 0.2) and approx(gaps["tpr"], 0.1), gaps

@test("selection_from: 같은 TPR·FPR이라도 기저율 0.5 → 0.5, 0.2 → 0.32")
def _():
    assert approx(selection_from(0.8, 0.2, 0.5), 0.5) and approx(selection_from(0.8, 0.2, 0.2), 0.32)
    assert approx(selection_from(0.3, 0.3, 0.9), 0.3), "TPR = FPR(무작위로 찍는 수준)이면 기저율과 무관해야 합니다."
`,
    hints: ["`t, p = np.asarray(y_true), np.asarray(y_pred)`일 때 선택률은 `p.mean()`, TPR은 `p[t == 1].mean()`, FPR은 `p[t == 0].mean()`, PPV는 `t[p == 1].mean()`", "`{k: abs(ra[src] - rb[src]) for k, src in [(\"dp\", \"selection\"), (\"tpr\", \"tpr\"), (\"fpr\", \"fpr\"), (\"ppv\", \"ppv\")]}`", "`tpr * base_rate + fpr * (1 - base_rate)`. TPR과 FPR이 같다는 조건(균등화된 오즈) 아래에서 선택률 차이는 정확히 `(tpr - fpr) × 기저율 차이`입니다."],
    solution: py`
# 본문 숫자 예제: A 집단 TP=40, FP=10 / B 집단 TP=16, FP=16 (균등화된 오즈는 맞고 선택률은 다르다)
yA_true = [1] * 50 + [0] * 50
yA_pred = [1] * 40 + [0] * 10 + [1] * 10 + [0] * 40
yB_true = [1] * 20 + [0] * 80
yB_pred = [1] * 16 + [0] * 4 + [1] * 16 + [0] * 64
yB_pred_dp = [1] * 18 + [0] * 2 + [1] * 32 + [0] * 48    # 선택률을 50%로 맞춘 뒤: TP=18, FP=32
import numpy as np

def group_rates(y_true, y_pred):
    t, p = np.asarray(y_true), np.asarray(y_pred)
    return {
        "selection": float(p.mean()),
        "tpr": float(p[t == 1].mean()),
        "fpr": float(p[t == 0].mean()),
        "ppv": float(t[p == 1].mean()),
    }

def fairness_gaps(ra, rb):
    return {k: abs(ra[src] - rb[src]) for k, src in [("dp", "selection"), ("tpr", "tpr"), ("fpr", "fpr"), ("ppv", "ppv")]}

def selection_from(tpr, fpr, base_rate):
    return tpr * base_rate + fpr * (1 - base_rate)

ra, rb, rb_dp = group_rates(yA_true, yA_pred), group_rates(yB_true, yB_pred), group_rates(yB_true, yB_pred_dp)
print("조정 전 격차:", fairness_gaps(ra, rb))
print("선택률을 맞춘 뒤 격차:", fairness_gaps(ra, rb_dp))
`,
  },
]);
