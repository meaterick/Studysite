import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "혼동행렬과 임계값별 정밀도·재현율",
    prompt: md`

본문의 스팸 필터 예제와 임계값 표를 함수로 만듭니다. 라이브러리 없이 파이썬 리스트로 씁니다.

1. \`confusion(y_true, y_pred)\`: \`(tp, fp, fn, tn)\`
2. \`prf1(y_true, y_pred)\`: \`(precision, recall, f1)\`. 분모가 0이면 그 지표는 0으로 둡니다.
3. \`threshold_table(y_true, scores, thresholds)\`: 임계값마다 \`score >= t\`를 양성으로 판정했을 때의 \`(t, precision, recall)\` 리스트
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

def threshold_table(y_true, scores, thresholds):
    rows = []
    # TODO: 임계값마다 판정 리스트를 만들고 prf1로 정밀도와 재현율을 계산합니다.
    return rows

# 스팸 필터: TP 20, FP 5, FN 10, TN 65
y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65
print(confusion(y_true, y_pred), prf1(y_true, y_pred))
print(threshold_table([1, 1, 0, 0, 0], [0.9, 0.6, 0.8, 0.5, 0.2], [0.85, 0.55, 0.3]))
`,
    tests: py`
y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65

@test("스팸 필터 혼동행렬 = (20, 5, 10, 65)")
def _():
    assert tuple(confusion(y_true, y_pred)) == (20, 5, 10, 65), f"결과: {confusion(y_true, y_pred)}"

@test("정밀도 0.8, 재현율 ≈ 0.667, F1 ≈ 0.727")
def _():
    p, r, f = prf1(y_true, y_pred)
    assert approx(p, 0.8) and approx(r, 2 / 3) and approx(f, 0.72727, tol=1e-4), f"결과: {(p, r, f)}"

@test("양성을 하나도 판정하지 않으면 정밀도 = 0 (오류 없이)")
def _():
    p, r, f = prf1([1, 0, 1], [0, 0, 0])
    assert (p, r, f) == (0.0, 0.0, 0.0), f"결과: {(p, r, f)}"

@test("threshold_table: 임계값을 낮추면 재현율이 오른다")
def _():
    rows = threshold_table([1, 1, 0, 0, 0], [0.9, 0.6, 0.8, 0.5, 0.2], [0.85, 0.55, 0.3])
    assert [r[0] for r in rows] == [0.85, 0.55, 0.3], f"결과: {rows}"
    assert approx([r[1] for r in rows], [1.0, 2 / 3, 0.5]), f"정밀도: {[r[1] for r in rows]}"
    assert approx([r[2] for r in rows], [0.5, 1.0, 1.0]), f"재현율: {[r[2] for r in rows]}"
`,
    hints: [
      "`if t == 1 and p == 1: tp += 1`처럼 네 경우를 나눕니다.",
      "`precision = tp / (tp + fp) if tp + fp else 0.0`, F1은 `2 * precision * recall / (precision + recall)`(분모가 0이면 0)입니다.",
      "`pred = [1 if s >= t else 0 for s in scores]`로 판정한 뒤 `precision, recall, _ = prf1(y_true, pred)`를 계산해 `rows.append((t, precision, recall))`합니다.",
    ],
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

def threshold_table(y_true, scores, thresholds):
    rows = []
    for t in thresholds:
        pred = [1 if s >= t else 0 for s in scores]
        precision, recall, _ = prf1(y_true, pred)
        rows.append((t, precision, recall))
    return rows

y_true = [1] * 20 + [0] * 5 + [1] * 10 + [0] * 65
y_pred = [1] * 20 + [1] * 5 + [0] * 10 + [0] * 65
print(confusion(y_true, y_pred), prf1(y_true, y_pred))
print(threshold_table([1, 1, 0, 0, 0], [0.9, 0.6, 0.8, 0.5, 0.2], [0.85, 0.55, 0.3]))
`,
  },
]);
