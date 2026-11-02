import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "혼동행렬·F1·AUC를 손으로 구현하기",
    prompt: md`

「분류 평가지표」의 스팸 필터 예제와 ROC 예제를 함수로 만듭니다.

1. \`confusion(y_true, y_pred)\`: \`(tp, fp, fn, tn)\`
2. \`prf1(y_true, y_pred)\`: \`(precision, recall, f1)\`. 분모가 0이면 그 지표는 0으로 둡니다.
3. \`auc_by_pairs(y_true, scores)\`: (양성, 음성) 쌍 중 양성의 점수가 더 높은 쌍의 비율. 점수가 같으면 0.5로 셉니다. AUC의 확률적 해석 "무작위로 고른 양성이 무작위로 고른 음성보다 높은 점수를 받을 확률"을 그대로 구현한 것입니다.
`,
    starter: py`
def confusion(y_true, y_pred):
    tp = fp = fn = tn = 0
    for t, p in zip(y_true, y_pred):
        pass  # TODO: 네 칸 중 하나를 1 늘립니다.
    return tp, fp, fn, tn

def prf1(y_true, y_pred):
    tp, fp, fn, tn = confusion(y_true, y_pred)
    precision = 0.0  # TODO (분모가 0이면 0)
    recall = 0.0     # TODO
    f1 = 0.0         # TODO: 조화평균
    return precision, recall, f1

def auc_by_pairs(y_true, scores):
    pos = [s for s, t in zip(scores, y_true) if t == 1]
    neg = [s for s, t in zip(scores, y_true) if t == 0]
    wins = 0.0
    # TODO: 모든 (양성, 음성) 쌍을 비교합니다. 양성이 크면 1, 같으면 0.5
    return wins / (len(pos) * len(neg))

# 스팸 필터: TP 20, FP 5, FN 10, TN 65
y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65
print(confusion(y_true, y_pred), prf1(y_true, y_pred))
print("AUC =", auc_by_pairs([1, 0, 1, 0, 0], [0.9, 0.8, 0.6, 0.5, 0.2]))
`,
    tests: py`
y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65

@test("스팸 필터 혼동행렬 = (20, 5, 10, 65)")
def _():
    assert tuple(confusion(y_true, y_pred)) == (20, 5, 10, 65), f"결과: {confusion(y_true, y_pred)}"

@test("Precision 0.8, Recall ≈ 0.667, F1 ≈ 0.727")
def _():
    p, r, f = prf1(y_true, y_pred)
    assert approx(p, 0.8) and approx(r, 2 / 3) and approx(f, 0.72727, tol=1e-4), f"결과: {(p, r, f)}"

@test("양성을 하나도 예측하지 않으면 Precision = 0 (오류 없이)")
def _():
    p, r, f = prf1([1, 0, 1], [0, 0, 0])
    assert (p, r, f) == (0.0, 0.0, 0.0), f"결과: {(p, r, f)}"

@test("본문 ROC 예제의 AUC = 5/6")
def _():
    assert approx(auc_by_pairs([1, 0, 1, 0, 0], [0.9, 0.8, 0.6, 0.5, 0.2]), 5 / 6)

@test("점수가 같은 쌍은 0.5로 센다, 완벽한 순서면 1")
def _():
    assert approx(auc_by_pairs([1, 0], [0.5, 0.5]), 0.5)
    assert approx(auc_by_pairs([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]), 1.0)
`,
    hints: ["`if t == 1 and p == 1: tp += 1`처럼 네 경우를 나눕니다.", "`precision = tp / (tp + fp) if tp + fp else 0.0`, F1은 `2 * precision * recall / (precision + recall)`(분모가 0이면 0)입니다.", "이중 반복문 `for a in pos: for b in neg:`에서 `a > b`면 1, `a == b`면 0.5를 더합니다."],
    solution: py`
def confusion(y_true, y_pred):
    tp = fp = fn = tn = 0
    for t, p in zip(y_true, y_pred):
        if t == 1 and p == 1:
            tp += 1
        elif t == 0 and p == 1:
            fp += 1
        elif t == 1 and p == 0:
            fn += 1
        else:
            tn += 1
    return tp, fp, fn, tn

def prf1(y_true, y_pred):
    tp, fp, fn, tn = confusion(y_true, y_pred)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1

def auc_by_pairs(y_true, scores):
    pos = [s for s, t in zip(scores, y_true) if t == 1]
    neg = [s for s, t in zip(scores, y_true) if t == 0]
    wins = 0.0
    for a in pos:
        for b in neg:
            wins += 1.0 if a > b else 0.5 if a == b else 0.0
    return wins / (len(pos) * len(neg))

y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65
print(confusion(y_true, y_pred), prf1(y_true, y_pred))
print("AUC =", auc_by_pairs([1, 0, 1, 0, 0], [0.9, 0.8, 0.6, 0.5, 0.2]))
`,
  },
]);
