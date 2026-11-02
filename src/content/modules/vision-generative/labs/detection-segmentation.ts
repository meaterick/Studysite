import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "IoU·NMS·Dice·AP 구현",
    prompt: md`

「탐지·분할의 핵심 계산」 단계의 네 도구를 함수로 만듭니다. 상자는 \`(x1, y1, x2, y2)\`(왼쪽 위, 오른쪽 아래)입니다.

1. \`iou(a, b)\`: 겹친 넓이 / 합친 넓이. 겹치지 않으면 0
2. \`nms(boxes, scores, thr)\`: 점수 높은 순으로 상자를 확정하고, 확정한 상자와 IoU가 \`thr\`를 **초과**하는 상자를 지웁니다. 남긴 상자의 인덱스 리스트(확정한 순서)를 돌려줍니다.
3. \`dice(pred, true)\`: 0/1 마스크 두 개의 $2|A\cap B|/(|A|+|B|)$
4. \`average_precision(is_tp, n_gt)\`: 점수순으로 정렬된 탐지 결과의 TP 여부(0/1 리스트)와 정답 개수로, TP가 나온 지점의 Precision을 더해 \`n_gt\`로 나눈 값
`,
    starter: py`
import numpy as np

def iou(a, b):
    return 0.0  # TODO

def nms(boxes, scores, thr=0.5):
    order = list(np.argsort(scores)[::-1])
    keep = []
    # TODO: order에서 하나씩 꺼내 keep에 넣고, 그 상자와 IoU > thr인 상자를 order에서 지웁니다.
    return keep

def dice(pred, true):
    return 0.0  # TODO

def average_precision(is_tp, n_gt):
    return 0.0  # TODO

print(iou((0, 0, 4, 4), (2, 2, 6, 6)))
boxes = [(10, 10, 50, 50), (12, 12, 52, 52), (100, 100, 140, 140), (11, 9, 49, 51), (98, 102, 139, 141)]
print(nms(boxes, np.array([0.9, 0.8, 0.75, 0.6, 0.7])))
print(average_precision([1, 1, 0, 1, 0], 4))
`,
    tests: py`
import numpy as np

@test("IoU: 본문 예제 4/28, 같은 상자 1, 안 겹치면 0")
def _():
    assert approx(iou((0, 0, 4, 4), (2, 2, 6, 6)), 4 / 28)
    assert approx(iou((1, 1, 3, 5), (1, 1, 3, 5)), 1.0) and approx(iou((0, 0, 1, 1), (2, 2, 3, 3)), 0.0)

@test("모서리만 닿는 상자는 IoU 0")
def _():
    assert approx(iou((0, 0, 2, 2), (2, 0, 4, 2)), 0.0)

@test("NMS: 두 물체에 상자 하나씩 [0, 2]")
def _():
    boxes = [(10, 10, 50, 50), (12, 12, 52, 52), (100, 100, 140, 140), (11, 9, 49, 51), (98, 102, 139, 141)]
    got = nms(boxes, np.array([0.9, 0.8, 0.75, 0.6, 0.7]), 0.5)
    assert [int(i) for i in got] == [0, 2], f"결과: {got}"

@test("NMS 임계값을 0.95로 올리면 더 많이 남는다")
def _():
    boxes = [(10, 10, 50, 50), (12, 12, 52, 52), (100, 100, 140, 140), (11, 9, 49, 51), (98, 102, 139, 141)]
    got = [int(i) for i in nms(boxes, np.array([0.9, 0.8, 0.75, 0.6, 0.7]), 0.95)]
    assert got == [0, 1, 2, 4, 3], f"결과: {got}"

@test("Dice: 한 칸씩 어긋난 3×3 마스크 = 8/18")
def _():
    a = np.zeros((6, 6), int); a[1:4, 1:4] = 1
    b = np.zeros((6, 6), int); b[2:5, 2:5] = 1
    assert approx(dice(a, b), 8 / 18) and approx(dice(a, a), 1.0)

@test("AP = (1 + 1 + 0.75) / 4 = 0.6875")
def _():
    assert approx(average_precision([1, 1, 0, 1, 0], 4), 0.6875)
    assert approx(average_precision([0, 1], 1), 0.5)
`,
    hints: ["겹친 영역은 `max(x1)`, `max(y1)`, `min(x2)`, `min(y2)`이고, 넓이는 `max(0, ix2 - ix1) * max(0, iy2 - iy1)`입니다.", "`while order: i = order.pop(0); keep.append(i); order = [j for j in order if iou(boxes[i], boxes[j]) <= thr]`", "AP는 `tp_cum = np.cumsum(is_tp)`, `precision = tp_cum / np.arange(1, len(is_tp) + 1)` 다음 `precision[np.array(is_tp) == 1].sum() / n_gt`입니다."],
    solution: py`
import numpy as np

def iou(a, b):
    ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
    ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])
    return inter / (area(a) + area(b) - inter)

def nms(boxes, scores, thr=0.5):
    order = list(np.argsort(scores)[::-1])
    keep = []
    while order:
        i = order.pop(0)
        keep.append(int(i))
        order = [j for j in order if iou(boxes[i], boxes[j]) <= thr]
    return keep

def dice(pred, true):
    pred, true = np.asarray(pred), np.asarray(true)
    return 2 * np.sum(pred & true) / (pred.sum() + true.sum())

def average_precision(is_tp, n_gt):
    is_tp = np.asarray(is_tp)
    precision = np.cumsum(is_tp) / np.arange(1, len(is_tp) + 1)
    return float(precision[is_tp == 1].sum() / n_gt)

print(iou((0, 0, 4, 4), (2, 2, 6, 6)))
boxes = [(10, 10, 50, 50), (12, 12, 52, 52), (100, 100, 140, 140), (11, 9, 49, 51), (98, 102, 139, 141)]
print(nms(boxes, np.array([0.9, 0.8, 0.75, 0.6, 0.7])))
print(average_precision([1, 1, 0, 1, 0], 4))
`,
  },
]);
