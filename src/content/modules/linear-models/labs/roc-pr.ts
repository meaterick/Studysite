import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "ROC 곡선, AUC, 평균 정밀도를 직접 계산하기",
    prompt: md`

라이브러리 없이 NumPy로 곡선과 넓이를 계산하고, 결과를 scikit-learn과 비교합니다. \`y_true\`는 0·1 배열, \`scores\`는 점수 배열입니다.

1. \`roc_points(y_true, scores)\`: 임계값을 \`np.inf\`와, 서로 다른 점수를 큰 순서로 늘어놓은 값으로 정하고, 임계값마다 \`score >= t\`를 양성으로 판정했을 때의 \`(FPR, TPR)\` 리스트를 돌려줍니다. 첫 점은 \`(0.0, 0.0)\`, 마지막 점은 \`(1.0, 1.0)\`입니다.
2. \`auc_trapezoid(points)\`: 이웃한 두 점 사이를 사다리꼴로 보고 넓이를 더합니다.
3. \`auc_by_pairs(y_true, scores)\`: (양성, 음성) 쌍 가운데 양성의 점수가 더 높은 쌍의 비율. 점수가 같으면 0.5로 셉니다.
4. \`average_precision(y_true, scores)\`: 서로 다른 점수를 큰 순서로 임계값 삼아 $\sum_n (R_n - R_{n-1}) P_n$을 계산합니다($R_0 = 0$).
`,
    starter: py`
import numpy as np

def roc_points(y_true, scores):
    y, s = np.asarray(y_true), np.asarray(scores, dtype=float)
    points = []
    # TODO: 임계값 [np.inf] + 큰 순서의 서로 다른 점수마다 (FPR, TPR)을 추가합니다.
    return points

def auc_trapezoid(points):
    area = 0.0
    # TODO: 이웃한 두 점 (x1, y1), (x2, y2)마다 (x2 - x1) * (y1 + y2) / 2를 더합니다.
    return area

def auc_by_pairs(y_true, scores):
    y, s = np.asarray(y_true), np.asarray(scores, dtype=float)
    pos, neg = s[y == 1], s[y == 0]
    return 0.0  # TODO: 양성이 크면 1, 같으면 0.5로 센 값의 평균

def average_precision(y_true, scores):
    y, s = np.asarray(y_true), np.asarray(scores, dtype=float)
    ap, prev_recall = 0.0, 0.0
    # TODO: 큰 순서의 서로 다른 점수 t마다 정밀도와 재현율을 계산해 더합니다.
    return ap

y_true = [1, 0, 1, 0, 0]
scores = [0.9, 0.8, 0.6, 0.5, 0.2]
pts = roc_points(y_true, scores)
print([(round(f, 2), round(t, 2)) for f, t in pts])
print(round(auc_trapezoid(pts), 3), round(auc_by_pairs(y_true, scores), 3), round(average_precision(y_true, scores), 3))   # 기대: 0.833 0.833 0.833
`,
    tests: py`
import numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score

Y = [1, 0, 1, 0, 0]
S = [0.9, 0.8, 0.6, 0.5, 0.2]

@test("본문 예제의 ROC 점")
def _():
    pts = [(round(f, 4), round(t, 4)) for f, t in roc_points(Y, S)]
    assert pts == [(0.0, 0.0), (0.0, 0.5), (0.3333, 0.5), (0.3333, 1.0), (0.6667, 1.0), (1.0, 1.0)], f"결과: {pts}"

@test("사다리꼴 넓이와 쌍 비율이 모두 5/6")
def _():
    assert approx(auc_trapezoid(roc_points(Y, S)), 5 / 6)
    assert approx(auc_by_pairs(Y, S), 5 / 6)

@test("점수가 같은 쌍은 0.5, 완벽한 순서는 1")
def _():
    assert approx(auc_by_pairs([1, 0], [0.5, 0.5]), 0.5)
    assert approx(auc_by_pairs([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]), 1.0)

@test("무작위 데이터에서 scikit-learn과 같은 AUC와 AP")
def _():
    rng = np.random.default_rng(0)
    y = rng.integers(0, 2, 200)
    s = np.round(rng.normal(size=200) + y, 1)        # 반올림해서 같은 점수도 만든다
    assert approx(auc_trapezoid(roc_points(y, s)), roc_auc_score(y, s)), "사다리꼴 AUC가 다릅니다."
    assert approx(auc_by_pairs(y, s), roc_auc_score(y, s)), "쌍 비율 AUC가 다릅니다."
    assert approx(average_precision(y, s), average_precision_score(y, s)), f"AP: {average_precision(y, s)} / {average_precision_score(y, s)}"
`,
    hints: [
      "`thresholds = [np.inf] + sorted(set(s.tolist()), reverse=True)`로 임계값을 만들고, `pred = s >= t`일 때 `tpr = (pred & (y == 1)).sum() / (y == 1).sum()`, `fpr = (pred & (y == 0)).sum() / (y == 0).sum()`입니다.",
      "`auc_by_pairs`는 `diff = pos[:, None] - neg[None, :]`로 모든 쌍의 차를 한 번에 만든 뒤 `((diff > 0) + 0.5 * (diff == 0)).mean()`입니다.",
      "`average_precision`은 임계값마다 `tp = (pred & (y == 1)).sum()`으로 `precision = tp / pred.sum()`, `recall = tp / (y == 1).sum()`을 구하고 `ap += (recall - prev_recall) * precision`, `prev_recall = recall`입니다.",
    ],
    solution: py`
import numpy as np

def roc_points(y_true, scores):
    y, s = np.asarray(y_true), np.asarray(scores, dtype=float)
    n_pos, n_neg = (y == 1).sum(), (y == 0).sum()
    points = []
    for t in [np.inf] + sorted(set(s.tolist()), reverse=True):
        pred = s >= t
        tpr = float((pred & (y == 1)).sum() / n_pos)
        fpr = float((pred & (y == 0)).sum() / n_neg)
        points.append((fpr, tpr))
    return points

def auc_trapezoid(points):
    area = 0.0
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        area += (x2 - x1) * (y1 + y2) / 2
    return area

def auc_by_pairs(y_true, scores):
    y, s = np.asarray(y_true), np.asarray(scores, dtype=float)
    pos, neg = s[y == 1], s[y == 0]
    diff = pos[:, None] - neg[None, :]
    return float(((diff > 0) + 0.5 * (diff == 0)).mean())

def average_precision(y_true, scores):
    y, s = np.asarray(y_true), np.asarray(scores, dtype=float)
    ap, prev_recall = 0.0, 0.0
    for t in sorted(set(s.tolist()), reverse=True):
        pred = s >= t
        tp = (pred & (y == 1)).sum()
        precision = tp / pred.sum()
        recall = tp / (y == 1).sum()
        ap += (recall - prev_recall) * precision
        prev_recall = recall
    return float(ap)

y_true = [1, 0, 1, 0, 0]
scores = [0.9, 0.8, 0.6, 0.5, 0.2]
pts = roc_points(y_true, scores)
print([(round(f, 2), round(t, 2)) for f, t in pts])
print(round(auc_trapezoid(pts), 3), round(auc_by_pairs(y_true, scores), 3), round(average_precision(y_true, scores), 3))
`,
  },
]);
