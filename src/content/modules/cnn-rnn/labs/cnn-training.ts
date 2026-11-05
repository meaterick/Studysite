import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "BatchNorm2d와 라벨을 보존하는 이동 증강 구현하기",
    prompt: md`
CNN 학습에 쓰는 두 연산을 NumPy로 구현합니다.

1. \`batchnorm2d(x, gamma, beta, eps=1e-5)\`: 모양이 (N, C, H, W)인 \`x\`를 채널마다 배치·높이·너비의 모든 값으로 평균과 분산을 구해 표준화한 뒤, 채널마다 \`gamma\`를 곱하고 \`beta\`를 더합니다. \`gamma\`와 \`beta\`는 길이 C인 배열입니다.
2. \`shift(img, dy, dx)\`: 이미지를 아래로 \`dy\`, 오른쪽으로 \`dx\`칸 옮기고 빈칸은 0으로 채웁니다(음수이면 반대 방향). \`np.roll\`은 반대편으로 넘어간 값이 다시 들어오므로 쓰지 않습니다.
`,
    starter: py`
import numpy as np

def batchnorm2d(x, gamma, beta, eps=1e-5):
    x = np.asarray(x, dtype=float)
    return x  # TODO: 채널 축(1)을 뺀 축으로 평균·분산, gamma·beta는 (1, C, 1, 1)로

def shift(img, dy, dx):
    H, W = img.shape
    out = np.zeros_like(img)
    # TODO: 겹치는 영역만 복사합니다.
    return out

rng = np.random.default_rng(0)
x = rng.normal(5, 3, size=(4, 2, 3, 3))
y = batchnorm2d(x, np.array([1.0, 2.0]), np.array([0.0, 1.0]))
print(y.mean(axis=(0, 2, 3)).round(3), y.std(axis=(0, 2, 3)).round(3))
print(shift(np.arange(9).reshape(3, 3), 1, 1))
`,
    tests: py`
import numpy as np

@test("batchnorm2d: gamma=1, beta=0이면 채널마다 평균 0, 표준편차 1")
def _():
    rng = np.random.default_rng(1)
    x = np.concatenate([rng.normal(10, 2, (6, 1, 4, 4)), rng.normal(-3, 0.5, (6, 1, 4, 4))], axis=1)
    y = np.asarray(batchnorm2d(x, np.ones(2), np.zeros(2)))
    assert y.shape == x.shape, f"모양: {y.shape}"
    assert approx(y.mean(axis=(0, 2, 3)), [0, 0], 1e-6) and approx(y.std(axis=(0, 2, 3)), [1, 1], 1e-3), f"평균 {y.mean(axis=(0, 2, 3))}, 표준편차 {y.std(axis=(0, 2, 3))}"

@test("batchnorm2d: gamma와 beta가 채널마다 적용된다")
def _():
    x = np.random.default_rng(2).normal(0, 1, (5, 3, 2, 2))
    y = np.asarray(batchnorm2d(x, np.array([1.0, 2.0, 3.0]), np.array([0.0, 1.0, -1.0])))
    assert approx(y.mean(axis=(0, 2, 3)), [0, 1, -1], 1e-6) and approx(y.std(axis=(0, 2, 3)), [1, 2, 3], 1e-3)

@test("batchnorm2d: 한 채널의 값은 다른 채널의 결과에 영향을 주지 않는다")
def _():
    x = np.random.default_rng(3).normal(0, 1, (4, 2, 3, 3))
    x2 = x.copy()
    x2[:, 1] *= 100
    a = np.asarray(batchnorm2d(x, np.ones(2), np.zeros(2)))
    b = np.asarray(batchnorm2d(x2, np.ones(2), np.zeros(2)))
    assert approx(a[:, 0], b[:, 0]), "채널 1의 값을 바꿨더니 채널 0의 결과가 달라졌습니다."

@test("shift: 오른쪽 아래로 한 칸, 빈칸은 0")
def _():
    a = np.arange(1, 10).reshape(3, 3)
    assert shift(a, 1, 1).tolist() == [[0, 0, 0], [0, 1, 2], [0, 4, 5]], f"결과: {shift(a, 1, 1).tolist()}"

@test("shift: 음수는 위쪽·왼쪽으로, (0, 0)은 그대로")
def _():
    a = np.arange(1, 10).reshape(3, 3)
    assert shift(a, -1, 0).tolist() == [[4, 5, 6], [7, 8, 9], [0, 0, 0]] and shift(a, 0, 0).tolist() == a.tolist()
`,
    hints: [
      "`mu = x.mean(axis=(0, 2, 3), keepdims=True)`, `var = x.var(axis=(0, 2, 3), keepdims=True)`처럼 채널 축(1)을 뺀 축으로 계산합니다.",
      "`gamma`와 `beta`는 `np.asarray(gamma).reshape(1, -1, 1, 1)`로 모양을 바꿔야 (N, C, H, W)와 브로드캐스팅됩니다.",
      "옮긴 결과의 [y, x] 칸에는 원본의 [y - dy, x - dx] 칸이 들어갑니다. 슬라이싱으로 쓰면 `out[max(dy,0):H+min(dy,0), max(dx,0):W+min(dx,0)] = img[max(-dy,0):H-max(dy,0), max(-dx,0):W-max(dx,0)]`입니다.",
    ],
    solution: py`
import numpy as np

def batchnorm2d(x, gamma, beta, eps=1e-5):
    x = np.asarray(x, dtype=float)
    mu = x.mean(axis=(0, 2, 3), keepdims=True)
    var = x.var(axis=(0, 2, 3), keepdims=True)
    x_hat = (x - mu) / np.sqrt(var + eps)
    return np.asarray(gamma).reshape(1, -1, 1, 1) * x_hat + np.asarray(beta).reshape(1, -1, 1, 1)

def shift(img, dy, dx):
    H, W = img.shape
    out = np.zeros_like(img)
    out[max(dy, 0):H + min(dy, 0), max(dx, 0):W + min(dx, 0)] = img[max(-dy, 0):H - max(dy, 0), max(-dx, 0):W - max(dx, 0)]
    return out

rng = np.random.default_rng(0)
x = rng.normal(5, 3, size=(4, 2, 3, 3))
y = batchnorm2d(x, np.array([1.0, 2.0]), np.array([0.0, 1.0]))
print(y.mean(axis=(0, 2, 3)).round(3), y.std(axis=(0, 2, 3)).round(3))
print(shift(np.arange(9).reshape(3, 3), 1, 1))
`,
  },
]);
