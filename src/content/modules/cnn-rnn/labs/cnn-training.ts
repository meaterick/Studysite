import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "inverted dropout과 라벨을 보존하는 이동 증강",
    prompt: md`

1. \`dropout(h, p, rng, train=True)\`: 학습 중에는 확률 \`p\`로 뉴런을 끄고 살아남은 값을 $1/(1-p)$배 키웁니다(inverted dropout). \`train=False\`(평가)면 \`h\`를 그대로 돌려줍니다.
2. \`shift(img, dy, dx)\`: 이미지를 아래로 \`dy\`, 오른쪽으로 \`dx\`칸 옮기고 빈칸은 0으로 채웁니다(음수면 반대 방향). \`np.roll\`은 반대편으로 넘어간 값이 다시 들어오므로 쓰지 않습니다.

1만 번 적용한 dropout의 평균이 원래 값과 같아지는지 확인합니다. 그래서 평가 때는 보정이 필요 없습니다.
`,
    starter: py`
import numpy as np

def dropout(h, p, rng, train=True):
    if not train:
        return h
    return h  # TODO: 마스크(rng.random(h.shape) > p)를 곱하고 1 - p로 나눕니다.

def shift(img, dy, dx):
    H, W = img.shape
    out = np.zeros_like(img)
    # TODO: 겹치는 영역만 복사합니다.
    return out

rng = np.random.default_rng(0)
h = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
print(np.mean([dropout(h, 0.5, rng) for _ in range(10000)], axis=0).round(2))
print(shift(np.arange(9).reshape(3, 3), 1, 1))
`,
    tests: py`
import numpy as np

@test("평가 모드는 그대로 통과")
def _():
    h = np.array([1.0, 2.0, 3.0])
    assert approx(dropout(h, 0.5, np.random.default_rng(0), train=False), h)

@test("살아남은 값은 1/(1-p)배, 꺼진 값은 0")
def _():
    out = dropout(np.full(1000, 3.0), 0.25, np.random.default_rng(1))
    vals = set(np.round(out, 6).tolist())
    assert vals <= {0.0, 4.0} and 0.18 < np.mean(out == 0) < 0.32, f"값 종류 {vals}, 0의 비율 {np.mean(out == 0):.2f}"

@test("1만 번 평균 = 원래 값(기댓값 보존)")
def _():
    rng = np.random.default_rng(0)
    h = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
    m = np.mean([dropout(h, 0.5, rng) for _ in range(10000)], axis=0)
    assert approx(m, h, 0.1), f"평균 {m.round(2)}"

@test("shift: 오른쪽 아래로 한 칸, 빈칸은 0")
def _():
    a = np.arange(1, 10).reshape(3, 3)
    assert shift(a, 1, 1).tolist() == [[0, 0, 0], [0, 1, 2], [0, 4, 5]], f"결과: {shift(a, 1, 1).tolist()}"

@test("shift: 음수는 왼쪽 위로, (0, 0)은 그대로")
def _():
    a = np.arange(1, 10).reshape(3, 3)
    assert shift(a, -1, 0).tolist() == [[4, 5, 6], [7, 8, 9], [0, 0, 0]] and shift(a, 0, 0).tolist() == a.tolist()
`,
    hints: ["`mask = rng.random(h.shape) > p`이면 True(1)가 살아남는 자리입니다. `h * mask / (1 - p)`", "옮긴 결과의 [y, x] 칸에는 원본의 [y - dy, x - dx] 칸이 들어갑니다. 범위를 벗어나는 칸은 0으로 둡니다.", "슬라이싱으로 쓰면 `out[max(dy,0):H+min(dy,0), max(dx,0):W+min(dx,0)] = img[max(-dy,0):H-max(dy,0), max(-dx,0):W-max(dx,0)]`입니다."],
    solution: py`
import numpy as np

def dropout(h, p, rng, train=True):
    if not train:
        return h
    return h * (rng.random(h.shape) > p) / (1 - p)

def shift(img, dy, dx):
    H, W = img.shape
    out = np.zeros_like(img)
    out[max(dy, 0):H + min(dy, 0), max(dx, 0):W + min(dx, 0)] = img[max(-dy, 0):H - max(dy, 0), max(-dx, 0):W - max(dx, 0)]
    return out

rng = np.random.default_rng(0)
h = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
print(np.mean([dropout(h, 0.5, rng) for _ in range(10000)], axis=0).round(2))
print(shift(np.arange(9).reshape(3, 3), 1, 1))
`,
  },
]);
