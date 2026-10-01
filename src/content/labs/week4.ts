import type { WeekLab } from "../types";
import { py } from "./util";

// 4주차 코딩 실습
//   핵심: 합성곱·파라미터 수, 풀링·수용영역, 잔차 연결, Dropout·증강, Karpathy 레시피
//   보충: ViT 패치, 순확산, IoU·NMS·Dice·AP
//   심화: im2col과 합성곱의 역전파, 가우시안 KL·재매개변수화·확산의 닫힌 형태, FGSM
const week4: WeekLab = {
  exercises: [
    {
      id: "w4-lab-conv2d",
      sectionId: "convolution",
      title: "합성곱 직접 구현과 파라미터 수 계산",
      tier: "core",
      prompt: `
1. \`conv2d(x, k, stride=1, padding=0)\`: 흑백 이미지 \`x\`(H, W)에 정사각 커널 \`k\`를 미끄러뜨리며 **원소별 곱의 합**을 구합니다. 패딩은 0으로 채웁니다(\`np.pad\`). 출력 크기는 $\\lfloor (N + 2P - K)/S \\rfloor + 1$입니다.
2. \`conv_params(k, c_in, c_out)\`: $k \\times k$ 커널, 입력 채널 \`c_in\`, 출력 채널 \`c_out\`인 합성곱층의 파라미터 수(편향 포함)
3. \`fc_params(n_in, n_out)\`: 완전연결층의 파라미터 수(편향 포함)

본문 예제처럼 $3 \\times 3$ conv(3→64)는 1,792개, 같은 출력 수의 FC층($224 \\times 224 \\times 3 \\to 64$)은 9,633,856개여야 합니다.
`,
      starter: py`
import numpy as np

def conv2d(x, k, stride=1, padding=0):
    x = np.pad(np.asarray(x, dtype=float), padding)
    K = k.shape[0]
    out_h = (x.shape[0] - K) // stride + 1
    out_w = (x.shape[1] - K) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            pass  # TODO: (i*stride, j*stride)에서 시작하는 K×K 창과 k의 원소별 곱의 합
    return out

def conv_params(k, c_in, c_out):
    return 0  # TODO

def fc_params(n_in, n_out):
    return 0  # TODO

x = np.array([[1, 1, 1, 0, 0],
              [0, 1, 1, 1, 0],
              [0, 0, 1, 1, 1],
              [0, 0, 1, 1, 0],
              [0, 1, 1, 0, 0]], dtype=float)
k = np.array([[1, 0, -1]] * 3, dtype=float)
print(conv2d(x, k))
print(conv_params(3, 3, 64), fc_params(224 * 224 * 3, 64))
`,
      tests: py`
import numpy as np
x = np.array([[1, 1, 1, 0, 0], [0, 1, 1, 1, 0], [0, 0, 1, 1, 1], [0, 0, 1, 1, 0], [0, 1, 1, 0, 0]], dtype=float)
k = np.array([[1, 0, -1]] * 3, dtype=float)

@test("출력 크기: p0 s1 → 3×3, p1 → 5×5, s2 → 2×2")
def _():
    assert conv2d(x, k).shape == (3, 3) and conv2d(x, k, padding=1).shape == (5, 5) and conv2d(x, k, stride=2).shape == (2, 2)

@test("세로 경계 검출 결과가 정의와 일치")
def _():
    expect = np.array([[sum((x[i:i+3, j:j+3] * k).ravel()) for j in range(3)] for i in range(3)])
    assert approx(conv2d(x, k), expect), f"결과:\n{conv2d(x, k)}"

@test("stride 2는 stride 1 결과를 한 칸씩 건너뛴 것과 같다")
def _():
    full = conv2d(x, k, padding=1)
    assert approx(conv2d(x, k, stride=2, padding=1), full[::2, ::2])

@test("파라미터 수: 3×3 conv(3→64) = 1,792, (3→16) = 448")
def _():
    assert conv_params(3, 3, 64) == 1792 and conv_params(3, 3, 16) == 448, f"{conv_params(3, 3, 64)}, {conv_params(3, 3, 16)}"

@test("FC(224×224×3 → 64) = 9,633,856")
def _():
    assert fc_params(224 * 224 * 3, 64) == 9633856, f"결과: {fc_params(224 * 224 * 3, 64)}"
`,
      hints: [
        "창은 `x[i*stride : i*stride + K, j*stride : j*stride + K]`입니다.",
        "`out[i, j] = np.sum(window * k)`. 같은 `k`를 모든 위치에서 쓰는 것이 파라미터 공유입니다.",
        "합성곱: `k * k * c_in * c_out + c_out`, 완전연결: `n_in * n_out + n_out`",
      ],
      solution: py`
import numpy as np

def conv2d(x, k, stride=1, padding=0):
    x = np.pad(np.asarray(x, dtype=float), padding)
    K = k.shape[0]
    out_h = (x.shape[0] - K) // stride + 1
    out_w = (x.shape[1] - K) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            window = x[i * stride : i * stride + K, j * stride : j * stride + K]
            out[i, j] = np.sum(window * k)
    return out

def conv_params(k, c_in, c_out):
    return k * k * c_in * c_out + c_out

def fc_params(n_in, n_out):
    return n_in * n_out + n_out

x = np.array([[1, 1, 1, 0, 0],
              [0, 1, 1, 1, 0],
              [0, 0, 1, 1, 1],
              [0, 0, 1, 1, 0],
              [0, 1, 1, 0, 0]], dtype=float)
k = np.array([[1, 0, -1]] * 3, dtype=float)
print(conv2d(x, k))
print(conv_params(3, 3, 64), fc_params(224 * 224 * 3, 64))
`,
    },
    {
      id: "w4-lab-pool-rf",
      sectionId: "pooling-receptive-field",
      title: "반복문 없는 풀링과 수용영역 계산기",
      tier: "core",
      prompt: `
1. \`max_pool(a)\`, \`avg_pool(a)\`: $2 \\times 2$ 영역, stride 2 풀링을 **반복문 없이** \`reshape\`와 \`axis\`로 구현합니다. (H, W)를 (H/2, 2, W/2, 2)로 바꾸면 블록 내부가 1번·3번 축이 됩니다.
2. \`receptive_field(layers)\`: \`(커널, 보폭)\` 리스트를 받아 마지막 층 한 칸이 입력에서 보는 범위를 돌려줍니다. 층마다 $r \\leftarrow r + (k-1)\\,j$, $j \\leftarrow j \\cdot s$로 갱신합니다($r = j = 1$에서 시작).
`,
      starter: py`
import numpy as np

def max_pool(a):
    H, W = a.shape
    return a  # TODO

def avg_pool(a):
    H, W = a.shape
    return a  # TODO

def receptive_field(layers):
    r, j = 1, 1
    for k, s in layers:
        pass  # TODO: r과 j를 갱신합니다. (r을 먼저, 이전 j를 써서)
    return r

y = np.array([[1., 1., 2., 1.],
              [1., 9., 1., 1.],
              [1., 1., 1., 2.],
              [1., 1., 1., 1.]])
print(max_pool(y))
print(avg_pool(y))
print(receptive_field([(3, 1), (3, 1), (2, 2), (3, 1), (3, 1), (2, 2), (3, 1)]))
`,
      tests: py`
import numpy as np
y = np.array([[1., 1., 2., 1.], [1., 9., 1., 1.], [1., 1., 1., 2.], [1., 1., 1., 1.]])

@test("2×2 영역 [[1,3],[2,4]]: max 4, avg 2.5")
def _():
    a = np.array([[1.0, 3.0], [2.0, 4.0]])
    assert approx(max_pool(a), [[4.0]]) and approx(avg_pool(a), [[2.5]])

@test("4×4 특징 지도: max [[9,2],[1,2]], avg [[3,1.25],[1,1.25]]")
def _():
    assert approx(max_pool(y), [[9, 2], [1, 2]]), f"max:\n{max_pool(y)}"
    assert approx(avg_pool(y), [[3, 1.25], [1, 1.25]]), f"avg:\n{avg_pool(y)}"

@test("직사각형(4×6)도 (2×3)으로 줄인다")
def _():
    a = np.arange(24, dtype=float).reshape(4, 6)
    assert max_pool(a).shape == (2, 3) and approx(max_pool(a), [[7, 9, 11], [19, 21, 23]])

@test("수용영역: conv3 두 층 = 5, conv3 → pool2 → conv3 = 8")
def _():
    assert receptive_field([(3, 1), (3, 1)]) == 5 and receptive_field([(3, 1), (2, 2), (3, 1)]) == 8

@test("본문의 7층 구성 = 24")
def _():
    assert receptive_field([(3, 1), (3, 1), (2, 2), (3, 1), (3, 1), (2, 2), (3, 1)]) == 24
`,
      hints: [
        "`a.reshape(H // 2, 2, W // 2, 2)`의 축은 (세로 블록, 블록 안 세로, 가로 블록, 블록 안 가로)입니다.",
        "`.max(axis=(1, 3))`, `.mean(axis=(1, 3))`로 블록 안쪽 두 축을 줄입니다.",
        "`r, j = r + (k - 1) * j, j * s`처럼 한 줄에 쓰면 오른쪽이 모두 이전 값으로 계산됩니다.",
      ],
      solution: py`
import numpy as np

def max_pool(a):
    H, W = a.shape
    return a.reshape(H // 2, 2, W // 2, 2).max(axis=(1, 3))

def avg_pool(a):
    H, W = a.shape
    return a.reshape(H // 2, 2, W // 2, 2).mean(axis=(1, 3))

def receptive_field(layers):
    r, j = 1, 1
    for k, s in layers:
        r, j = r + (k - 1) * j, j * s
    return r

y = np.array([[1., 1., 2., 1.],
              [1., 9., 1., 1.],
              [1., 1., 1., 2.],
              [1., 1., 1., 1.]])
print(max_pool(y))
print(avg_pool(y))
print(receptive_field([(3, 1), (3, 1), (2, 2), (3, 1), (3, 1), (2, 2), (3, 1)]))
`,
    },
    {
      id: "w4-lab-residual",
      sectionId: "resnet",
      title: "잔차 블록: 항등함수와 기울기 고속도로",
      tier: "core",
      prompt: `
1. \`res_block(x, W1, W2)\` $= x + W_2\\,\\mathrm{ReLU}(W_1 x)$
2. \`plain_grad(local)\`, \`residual_grad(f_primes)\`: 층마다의 국소 기울기 배열을 받아 입력까지 전달되는 기울기 배율을 돌려줍니다. 잔차 없는 망은 국소 기울기의 곱 $\\prod F_i'$, 잔차 연결이 있으면 $y = F(x) + x$이므로 $\\prod (F_i' + 1)$입니다.

$W_1, W_2$가 0이면 블록이 그대로 항등함수가 되는지, 50층에서 두 배율이 얼마나 다른지 확인합니다.
`,
      starter: py`
import numpy as np

def res_block(x, W1, W2):
    return x  # TODO

def plain_grad(local):
    return 1.0  # TODO: 국소 기울기의 곱

def residual_grad(f_primes):
    return 1.0  # TODO: (F' + 1)의 곱

rng = np.random.default_rng(0)
local = rng.uniform(0.25, 1.0, 50)
small = rng.uniform(-0.05, 0.05, 50)
print(f"50층 plain: {plain_grad(local):.2e}, residual: {residual_grad(small):.3f}")
`,
      tests: py`
import numpy as np
rng = np.random.default_rng(1)

@test("가중치가 0이면 잔차 블록 = 항등함수")
def _():
    x = rng.normal(size=4)
    assert approx(res_block(x, np.zeros((6, 4)), np.zeros((4, 6))), x)

@test("res_block = x + W2·ReLU(W1·x)")
def _():
    x, W1, W2 = rng.normal(size=3), rng.normal(size=(5, 3)), rng.normal(size=(3, 5))
    assert approx(res_block(x, W1, W2), x + W2 @ np.maximum(0, W1 @ x))

@test("plain: 0.5를 10번 곱하면 ≈ 0.000977")
def _():
    assert approx(plain_grad(np.full(10, 0.5)), 0.5 ** 10)

@test("residual: F'가 모두 0이면 배율 1, 0.1이면 1.1¹⁰")
def _():
    assert approx(residual_grad(np.zeros(30)), 1.0) and approx(residual_grad(np.full(10, 0.1)), 1.1 ** 10)

@test("본문 실험: 50층 plain < 1e-9, residual은 0.5~2 사이")
def _():
    r = np.random.default_rng(0)
    local, small = r.uniform(0.25, 1.0, 50), r.uniform(-0.05, 0.05, 50)
    assert plain_grad(local) < 1e-9 and 0.5 < residual_grad(small) < 2, f"{plain_grad(local):.2e}, {residual_grad(small):.3f}"
`,
      hints: [
        "`x + W2 @ np.maximum(0, W1 @ x)`",
        "곱은 `np.prod(local)`, 잔차는 `np.prod(1 + f_primes)`입니다.",
        "잔차 연결의 국소 기울기 $F'(x) + 1$은 $F'$가 작아도 1 근처라, 아무리 많이 곱해도 0으로 사라지지 않습니다.",
      ],
      solution: py`
import numpy as np

def res_block(x, W1, W2):
    return x + W2 @ np.maximum(0, W1 @ x)

def plain_grad(local):
    return float(np.prod(local))

def residual_grad(f_primes):
    return float(np.prod(1 + np.asarray(f_primes)))

rng = np.random.default_rng(0)
local = rng.uniform(0.25, 1.0, 50)
small = rng.uniform(-0.05, 0.05, 50)
print(f"50층 plain: {plain_grad(local):.2e}, residual: {residual_grad(small):.3f}")
`,
    },
    {
      id: "w4-lab-dropout",
      sectionId: "regularization",
      title: "inverted dropout과 라벨을 보존하는 이동 증강",
      tier: "core",
      prompt: `
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

@test("1만 번 평균 = 원래 값(기대값 보존)")
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
      hints: [
        "`mask = rng.random(h.shape) > p`이면 True(1)가 살아남는 자리입니다. `h * mask / (1 - p)`",
        "옮긴 결과의 [y, x] 칸에는 원본의 [y - dy, x - dx] 칸이 들어갑니다. 범위를 벗어나는 칸은 0으로 둡니다.",
        "슬라이싱으로 쓰면 `out[max(dy,0):H+min(dy,0), max(dx,0):W+min(dx,0)] = img[max(-dy,0):H-max(dy,0), max(-dx,0):W-max(dx,0)]`입니다.",
      ],
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
    {
      id: "w4-lab-recipe",
      sectionId: "transfer-diagnostics",
      title: "Karpathy 레시피: 초기 손실 점검과 배치 하나 외우기",
      tier: "core",
      prompt: `
학습이 이상할 때 가장 먼저 하는 두 가지 검사를 구현합니다.

1. \`softmax(Z)\`(행마다, 최댓값을 빼서 안정화)와 \`cross_entropy(P, y)\`(정답 클래스 확률의 $-\\log$ 평균)
2. \`overfit_batch(X, y, n_classes, steps, lr)\`: 선형 분류기 $XW + b$를 작은 초기화로 시작해 소프트맥스 교차 엔트로피로 학습하고 \`(정확도, 손실)\`을 돌려줍니다. 기울기는 $\\partial L/\\partial Z = (P - \\text{원핫})/n$입니다.

클래스 10개를 균등하게 예측하면 손실은 $\\ln 10 \\approx 2.303$이고, 샘플 10개짜리 배치는 정확도 1.0까지 외울 수 있어야 합니다.
`,
      starter: py`
import numpy as np
from sklearn.datasets import load_digits

def softmax(Z):
    return Z  # TODO: 행마다 최댓값을 빼고 exp → 정규화

def cross_entropy(P, y):
    return 0.0  # TODO: -log P[i, y_i]의 평균 (1e-12를 더해 log 0 방지)

def overfit_batch(X, y, n_classes=10, steps=300, lr=1.0, seed=0):
    rng = np.random.default_rng(seed)
    W, b = rng.normal(0, 0.01, (X.shape[1], n_classes)), np.zeros(n_classes)
    for _ in range(steps):
        P = softmax(X @ W + b)
        G = P.copy()
        # TODO: 정답 자리에서 1을 빼고 샘플 수로 나눈 뒤 W, b를 갱신합니다.
    P = softmax(X @ W + b)
    return float(np.mean(P.argmax(axis=1) == y)), cross_entropy(P, y)

digits = load_digits()
X, y = digits.data / 16.0, digits.target
W0 = np.random.default_rng(0).normal(0, 0.01, (64, 10))
print("초기 손실:", cross_entropy(softmax(X @ W0), y), " ln10 =", np.log(10))
print("배치 10개 과적합:", overfit_batch(X[:10], y[:10]))
`,
      tests: py`
import numpy as np
from sklearn.datasets import load_digits
digits = load_digits()
X, y = digits.data / 16.0, digits.target

@test("softmax: 행 합 1, 큰 값에도 overflow 없음")
def _():
    P = softmax(np.array([[1.0, 2.0, 3.0], [1000.0, 1000.0, 1000.0]]))
    assert approx(P.sum(axis=1), [1, 1]) and approx(P[1], [1 / 3] * 3) and not np.isnan(P).any()

@test("균등 예측의 교차 엔트로피 = ln(클래스 수)")
def _():
    assert approx(cross_entropy(np.full((5, 10), 0.1), np.arange(5)), np.log(10))

@test("작은 초기화의 초기 손실 ≈ ln 10 (±0.05)")
def _():
    W0 = np.random.default_rng(0).normal(0, 0.01, (64, 10))
    assert abs(cross_entropy(softmax(X @ W0), y) - np.log(10)) < 0.05

@test("샘플 10개 배치를 정확도 1.0으로 외운다")
def _():
    acc, loss = overfit_batch(X[:10], y[:10])
    assert acc == 1.0 and loss < 0.1, f"정확도 {acc}, 손실 {loss:.4f}"
`,
      hints: [
        "`Z = Z - Z.max(axis=1, keepdims=True)`, `E = np.exp(Z)`, `E / E.sum(axis=1, keepdims=True)`",
        "`-np.mean(np.log(P[np.arange(len(y)), y] + 1e-12))`",
        "`G[np.arange(len(y)), y] -= 1`, `G /= len(y)`, `W -= lr * X.T @ G`, `b -= lr * G.sum(axis=0)`",
      ],
      solution: py`
import numpy as np
from sklearn.datasets import load_digits

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

def cross_entropy(P, y):
    return float(-np.mean(np.log(P[np.arange(len(y)), y] + 1e-12)))

def overfit_batch(X, y, n_classes=10, steps=300, lr=1.0, seed=0):
    rng = np.random.default_rng(seed)
    W, b = rng.normal(0, 0.01, (X.shape[1], n_classes)), np.zeros(n_classes)
    for _ in range(steps):
        P = softmax(X @ W + b)
        G = P.copy()
        G[np.arange(len(y)), y] -= 1
        G /= len(y)
        W -= lr * X.T @ G
        b -= lr * G.sum(axis=0)
    P = softmax(X @ W + b)
    return float(np.mean(P.argmax(axis=1) == y)), cross_entropy(P, y)

digits = load_digits()
X, y = digits.data / 16.0, digits.target
W0 = np.random.default_rng(0).normal(0, 0.01, (64, 10))
print("초기 손실:", cross_entropy(softmax(X @ W0), y), " ln10 =", np.log(10))
print("배치 10개 과적합:", overfit_batch(X[:10], y[:10]))
`,
    },
    {
      id: "w4-lab-patchify",
      sectionId: "cnn-history-applications",
      title: "ViT처럼 이미지를 패치 토큰으로 자르기",
      tier: "supplement",
      prompt: `
1. \`patchify(img, P)\`: (H, W) 이미지를 $P \\times P$ 패치로 잘라, 패치를 **왼쪽 위부터 행 순서대로** 한 줄씩 편 (패치 수, P·P) 행렬을 돌려줍니다. 반복문 없이 \`reshape\`와 \`transpose\`로 씁니다.
2. \`n_tokens(img_size, patch)\`: 정사각 이미지에서 나오는 패치 토큰 수
3. \`vgg_compare(C)\`: 채널 C일 때 ($3 \\times 3$ conv 세 층의 가중치 수, $7 \\times 7$ conv 한 층의 가중치 수)

첫 번째 패치 토큰은 \`img[:P, :P]\`를 편 것과 같아야 합니다.
`,
      starter: py`
import numpy as np

def patchify(img, P):
    H, W = img.shape
    # TODO: (H/P, P, W/P, P)로 reshape → 축 순서를 (H/P, W/P, P, P)로 transpose → (패치 수, P*P)
    return img

def n_tokens(img_size, patch):
    return 0  # TODO

def vgg_compare(C):
    return 0, 0  # TODO

img = np.arange(64).reshape(8, 8)
print(patchify(img, 4))
print(n_tokens(224, 16), vgg_compare(64))
`,
      tests: py`
import numpy as np
img = np.arange(64).reshape(8, 8)

@test("8×8을 4×4 패치로: shape (4, 16)")
def _():
    assert np.shape(patchify(img, 4)) == (4, 16), f"shape: {np.shape(patchify(img, 4))}"

@test("패치 순서: 왼쪽 위, 오른쪽 위, 왼쪽 아래, 오른쪽 아래")
def _():
    p = patchify(img, 4)
    assert approx(p[0], img[:4, :4].ravel()) and approx(p[1], img[:4, 4:].ravel()) and approx(p[2], img[4:, :4].ravel())

@test("직사각형 이미지(4×6)도 2×2 패치 6개")
def _():
    a = np.arange(24).reshape(4, 6)
    p = patchify(a, 2)
    assert np.shape(p) == (6, 4) and approx(p[2], a[:2, 4:].ravel())

@test("224×224, 16×16 패치 → 196개 토큰")
def _():
    assert n_tokens(224, 16) == 196 and n_tokens(32, 4) == 64

@test("C=64: 3×3 세 층 110,592 vs 7×7 한 층 200,704")
def _():
    assert tuple(vgg_compare(64)) == (110592, 200704), f"결과: {vgg_compare(64)}"
`,
      hints: [
        "`img.reshape(H // P, P, W // P, P)`의 축은 (패치 행, 패치 안 행, 패치 열, 패치 안 열)입니다.",
        "`.transpose(0, 2, 1, 3)`으로 (패치 행, 패치 열, 패치 안 행, 패치 안 열)로 바꾼 뒤 `.reshape(-1, P * P)`",
        "토큰 수는 `(img_size // patch) ** 2`, 파라미터는 `3 * (9 * C * C)`와 `49 * C * C`입니다.",
      ],
      solution: py`
import numpy as np

def patchify(img, P):
    H, W = img.shape
    return img.reshape(H // P, P, W // P, P).transpose(0, 2, 1, 3).reshape(-1, P * P)

def n_tokens(img_size, patch):
    return (img_size // patch) ** 2

def vgg_compare(C):
    return 3 * (9 * C * C), 49 * C * C

img = np.arange(64).reshape(8, 8)
print(patchify(img, 4))
print(n_tokens(224, 16), vgg_compare(64))
`,
    },
    {
      id: "w4-lab-diffusion",
      sectionId: "generative-models",
      title: "순확산 과정과 잡음 예측으로 원본 되찾기",
      tier: "supplement",
      prompt: `
Diffusion 모델의 순방향 과정을 식 그대로 구현합니다.

1. \`alpha_bar(betas)\`: $\\bar\\alpha_t = \\prod_{s \\le t} (1 - \\beta_s)$ (원본 신호가 남아 있는 비율)
2. \`q_sample(x0, t, ab, eps)\`: $x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1 - \\bar\\alpha_t}\\,\\epsilon$
3. \`predict_x0(xt, t, ab, eps_hat)\`: 신경망이 예측한 잡음 $\\hat\\epsilon$으로 $x_0$를 거꾸로 계산합니다. 역방향 학습이 "잡음을 맞히는 것"이면 충분한 이유가 이 식에 있습니다.
`,
      starter: py`
import numpy as np

def alpha_bar(betas):
    return np.ones_like(betas)  # TODO

def q_sample(x0, t, ab, eps):
    return x0  # TODO

def predict_x0(xt, t, ab, eps_hat):
    return xt  # TODO: q_sample 식을 x0에 대해 풉니다.

rng = np.random.default_rng(0)
betas = np.linspace(1e-4, 0.35, 10)
ab = alpha_bar(betas)
x0 = rng.uniform(-1, 1, 64)
eps = rng.normal(size=64)
xt = q_sample(x0, 9, ab, eps)
print("ᾱ:", ab.round(3))
print("복원 오차:", np.abs(predict_x0(xt, 9, ab, eps) - x0).max())
`,
      tests: py`
import numpy as np
betas = np.linspace(1e-4, 0.35, 10)

@test("ᾱ는 1에서 시작해 단조 감소, 마지막 ≈ 0.13")
def _():
    ab = alpha_bar(betas)
    assert approx(ab[0], 1 - 1e-4) and np.all(np.diff(ab) < 0) and approx(ab[-1], np.prod(1 - betas)), f"ᾱ: {ab}"

@test("q_sample 식")
def _():
    ab = alpha_bar(betas)
    x0, e = np.array([1.0, -1.0]), np.array([0.5, 2.0])
    assert approx(q_sample(x0, 4, ab, e), np.sqrt(ab[4]) * x0 + np.sqrt(1 - ab[4]) * e)

@test("정확한 잡음을 알면 원본을 완벽히 되찾는다")
def _():
    ab = alpha_bar(betas)
    rng = np.random.default_rng(1)
    x0, e = rng.uniform(-1, 1, 50), rng.normal(size=50)
    for t in (0, 5, 9):
        assert approx(predict_x0(q_sample(x0, t, ab, e), t, ab, e), x0)

@test("t가 커질수록 원본과의 상관이 줄어든다")
def _():
    ab = alpha_bar(betas)
    rng = np.random.default_rng(2)
    x0 = rng.uniform(-1, 1, 5000)
    c = [np.corrcoef(x0, q_sample(x0, t, ab, rng.normal(size=5000)))[0, 1] for t in (0, 5, 9)]
    assert c[0] > c[1] > c[2], f"상관: {np.round(c, 3)}"
`,
      hints: [
        "`np.cumprod(1 - betas)`",
        "`np.sqrt(ab[t]) * x0 + np.sqrt(1 - ab[t]) * eps`",
        "$x_0 = (x_t - \\sqrt{1 - \\bar\\alpha_t}\\,\\hat\\epsilon) / \\sqrt{\\bar\\alpha_t}$",
      ],
      solution: py`
import numpy as np

def alpha_bar(betas):
    return np.cumprod(1 - betas)

def q_sample(x0, t, ab, eps):
    return np.sqrt(ab[t]) * x0 + np.sqrt(1 - ab[t]) * eps

def predict_x0(xt, t, ab, eps_hat):
    return (xt - np.sqrt(1 - ab[t]) * eps_hat) / np.sqrt(ab[t])

rng = np.random.default_rng(0)
betas = np.linspace(1e-4, 0.35, 10)
ab = alpha_bar(betas)
x0 = rng.uniform(-1, 1, 64)
eps = rng.normal(size=64)
xt = q_sample(x0, 9, ab, eps)
print("ᾱ:", ab.round(3))
print("복원 오차:", np.abs(predict_x0(xt, 9, ab, eps) - x0).max())
`,
    },
    {
      id: "w4-lab-iou-nms",
      sectionId: "detection-segmentation",
      title: "IoU·NMS·Dice·AP 구현",
      tier: "supplement",
      prompt: `
「탐지·분할의 핵심 계산」 단계의 네 도구를 함수로 만듭니다. 상자는 \`(x1, y1, x2, y2)\`(왼쪽 위, 오른쪽 아래)입니다.

1. \`iou(a, b)\`: 겹친 넓이 / 합친 넓이. 겹치지 않으면 0
2. \`nms(boxes, scores, thr)\`: 점수 높은 순으로 상자를 확정하고, 확정한 상자와 IoU가 \`thr\`를 **초과**하는 상자를 지웁니다. 남긴 상자의 인덱스 리스트(확정한 순서)를 돌려줍니다.
3. \`dice(pred, true)\`: 0/1 마스크 두 개의 $2|A\\cap B|/(|A|+|B|)$
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
      hints: [
        "겹친 영역은 `max(x1)`, `max(y1)`, `min(x2)`, `min(y2)`이고, 넓이는 `max(0, ix2 - ix1) * max(0, iy2 - iy1)`입니다.",
        "`while order: i = order.pop(0); keep.append(i); order = [j for j in order if iou(boxes[i], boxes[j]) <= thr]`",
        "AP는 `tp_cum = np.cumsum(is_tp)`, `precision = tp_cum / np.arange(1, len(is_tp) + 1)` 다음 `precision[np.array(is_tp) == 1].sum() / n_gt`입니다.",
      ],
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
    {
      id: "w4-lab-im2col",
      sectionId: "conv-as-matmul",
      title: "im2col 합성곱과 합성곱의 역전파",
      tier: "advanced",
      prompt: `
「합성곱의 계산」 단계의 결론을 구현합니다. 모든 합성곱은 stride 1, padding 0(교차상관)입니다.

1. \`im2col(x, kh, kw)\`: 모든 $k_h\\times k_w$ 창을 행 우선 순서로 꺼내 한 줄씩 편 \`(창 개수, kh*kw)\` 행렬. 역전파에서 \`G\`를 커널처럼 쓰므로 커널이 정사각형이 아닐 수 있습니다.
2. \`conv_matmul(x, k)\`: \`im2col\`과 행렬 곱 한 번으로 합성곱 출력 \`(H-kh+1, W-kw+1)\`
3. \`conv_backward(x, k, G)\`: 출력 기울기 \`G\`로부터 \`(dx, dk)\`. \`dk\`는 \`x\`와 \`G\`의 합성곱, \`dx\`는 \`G\`를 위아래로 \`kh-1\`칸, 좌우로 \`kw-1\`칸씩 0으로 감싼 뒤 180° 뒤집은 커널로 합성곱한 것입니다. 2번의 \`conv_matmul\`을 재사용하십시오.
4. \`separable_ratio(K, c_in, c_out)\`: depthwise separable 파라미터 / 표준 합성곱 파라미터
`,
      starter: py`
import numpy as np

def im2col(x, kh, kw):
    return np.zeros((1, kh * kw))  # TODO

def conv_matmul(x, k):
    kh, kw = k.shape
    return np.zeros((x.shape[0] - kh + 1, x.shape[1] - kw + 1))  # TODO

def conv_backward(x, k, G):
    dx, dk = np.zeros_like(x), np.zeros_like(k)  # TODO
    return dx, dk

def separable_ratio(K, c_in, c_out):
    return 1.0  # TODO

rng = np.random.default_rng(0)
x, k = rng.normal(size=(6, 6)), rng.normal(size=(3, 3))
print(conv_matmul(x, k).shape, round(separable_ratio(3, 128, 128), 4))
`,
      tests: py`
import numpy as np

def loop_conv(x, k):
    K = k.shape[0]
    return np.array([[np.sum(x[i:i + K, j:j + K] * k) for j in range(x.shape[1] - K + 1)] for i in range(x.shape[0] - K + 1)])

rng = np.random.default_rng(0)
x, k = rng.normal(size=(6, 7)), rng.normal(size=(3, 3))

@test("im2col 모양과 첫 행")
def _():
    cols = im2col(x, 3, 3)
    assert cols.shape == (4 * 5, 9), f"shape: {cols.shape}"
    assert approx(cols[0], x[0:3, 0:3].ravel()) and approx(cols[1], x[0:3, 1:4].ravel())

@test("conv_matmul = 반복문 합성곱 (정사각이 아닌 입력)")
def _():
    assert approx(conv_matmul(x, k), loop_conv(x, k))

@test("정사각이 아닌 커널도 처리한다")
def _():
    k2 = rng.normal(size=(2, 3))
    ref = np.array([[np.sum(x[i:i + 2, j:j + 3] * k2) for j in range(5)] for i in range(5)])
    assert approx(conv_matmul(x, k2), ref)

@test("dk = 수치미분")
def _():
    G = rng.normal(size=(4, 5))
    _, dk = conv_backward(x, k, G)
    num = np.zeros_like(k)
    for i in range(3):
        for j in range(3):
            e = np.zeros_like(k); e[i, j] = 1e-6
            num[i, j] = (np.sum(loop_conv(x, k + e) * G) - np.sum(loop_conv(x, k - e) * G)) / 2e-6
    assert approx(dk, num, 1e-5)

@test("dx = 수치미분 (모양은 입력과 같다)")
def _():
    G = rng.normal(size=(4, 5))
    dx, _ = conv_backward(x, k, G)
    assert np.shape(dx) == x.shape, f"shape: {np.shape(dx)}"
    num = np.zeros_like(x)
    for i in range(6):
        for j in range(7):
            e = np.zeros_like(x); e[i, j] = 1e-6
            num[i, j] = (np.sum(loop_conv(x + e, k) * G) - np.sum(loop_conv(x - e, k) * G)) / 2e-6
    assert approx(dx, num, 1e-5)

@test("depthwise separable 비율: 3×3, 128→128 ≈ 0.1189")
def _():
    assert approx(separable_ratio(3, 128, 128), (9 * 128 + 128 * 128) / (9 * 128 * 128))
`,
      hints: [
        "`np.array([x[i:i + kh, j:j + kw].ravel() for i in range(H - kh + 1) for j in range(W - kw + 1)])`처럼 행을 먼저, 열을 나중에 돕니다.",
        "`conv_matmul`은 `(im2col(x, kh, kw) @ k.ravel()).reshape(H - kh + 1, W - kw + 1)`입니다.",
        "`dk = conv_matmul(x, G)`, `dx = conv_matmul(np.pad(G, ((kh - 1, kh - 1), (kw - 1, kw - 1))), k[::-1, ::-1])`. 비율은 `(K*K*c_in + c_in*c_out) / (K*K*c_in*c_out)`입니다.",
      ],
      solution: py`
import numpy as np

def im2col(x, kh, kw):
    H, W = x.shape
    return np.array([x[i:i + kh, j:j + kw].ravel() for i in range(H - kh + 1) for j in range(W - kw + 1)])

def conv_matmul(x, k):
    kh, kw = k.shape
    H, W = x.shape
    return (im2col(x, kh, kw) @ k.ravel()).reshape(H - kh + 1, W - kw + 1)

def conv_backward(x, k, G):
    kh, kw = k.shape
    dk = conv_matmul(x, G)
    dx = conv_matmul(np.pad(G, ((kh - 1, kh - 1), (kw - 1, kw - 1))), k[::-1, ::-1])
    return dx, dk

def separable_ratio(K, c_in, c_out):
    return (K * K * c_in + c_in * c_out) / (K * K * c_in * c_out)

rng = np.random.default_rng(0)
x, k = rng.normal(size=(6, 6)), rng.normal(size=(3, 3))
print(conv_matmul(x, k).shape, round(separable_ratio(3, 128, 128), 4))
`,
    },
    {
      id: "w4-lab-elbo",
      sectionId: "generative-math",
      title: "가우시안 KL·재매개변수화·확산의 닫힌 형태",
      tier: "advanced",
      prompt: `
「생성 모델의 수학」 단계의 식들을 구현합니다.

1. \`kl_gauss(mu, log_var)\`: 차원마다 독립인 $\\mathcal{N}(\\mu, \\sigma^2)$와 $\\mathcal{N}(0, I)$의 KL을 **모든 차원에 대해 합한** 값. $\\log\\sigma^2$(\`log_var\`)을 입력으로 받습니다(VAE 구현의 관례).
2. \`reparam(mu, log_var, eps)\` $= \\mu + \\sigma\\,\\varepsilon$, $\\sigma = e^{\\log\\sigma^2/2}$
3. \`alpha_bar(betas)\`: $\\bar\\alpha_t = \\prod_{s\\le t}(1-\\beta_s)$ 배열
4. \`q_sample(x0, t, betas, eps)\` $= \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon$ (\`t\`는 0부터)
5. \`predict_x0(xt, t, betas, eps_hat)\`: 예측한 노이즈로 $x_0$를 되찾는 식
`,
      starter: py`
import numpy as np

def kl_gauss(mu, log_var):
    return 0.0  # TODO

def reparam(mu, log_var, eps):
    return mu  # TODO

def alpha_bar(betas):
    return np.ones_like(betas)  # TODO

def q_sample(x0, t, betas, eps):
    return x0  # TODO

def predict_x0(xt, t, betas, eps_hat):
    return xt  # TODO

print(kl_gauss(np.array([1.5]), np.log(np.array([0.25]))))
`,
      tests: py`
import numpy as np

@test("표준정규면 KL = 0, 본문 예제(μ=1.5, σ=0.5) ≈ 1.4431")
def _():
    assert approx(kl_gauss(np.zeros(3), np.zeros(3)), 0.0)
    assert approx(kl_gauss(np.array([1.5]), np.log(np.array([0.25]))), 0.5 * (2.25 + 0.25 - 1 - np.log(0.25)))

@test("여러 차원은 합한다")
def _():
    mu, lv = np.array([1.0, -2.0]), np.array([0.0, np.log(4.0)])
    expect = 0.5 * (1 + 1 - 1 - 0) + 0.5 * (4 + 4 - 1 - np.log(4))
    assert approx(kl_gauss(mu, lv), expect)

@test("재매개변수화 샘플의 평균·표준편차가 μ, σ와 맞다")
def _():
    eps = np.random.default_rng(0).normal(size=200_000)
    z = reparam(2.0, np.log(9.0), eps)
    assert abs(np.mean(z) - 2.0) < 0.03 and abs(np.std(z) - 3.0) < 0.03, f"평균 {np.mean(z):.3f}, 표준편차 {np.std(z):.3f}"

@test("ᾱ_t는 (1-β)의 누적곱")
def _():
    b = np.array([0.1, 0.2, 0.5])
    assert approx(alpha_bar(b), [0.9, 0.72, 0.36])

@test("q_sample의 분포가 한 스텝씩 노이즈를 더한 것과 같다")
def _():
    rng = np.random.default_rng(1)
    betas = np.linspace(1e-4, 0.02, 200)
    xs = np.full(40_000, 0.8)
    for s in range(200):
        xs = np.sqrt(1 - betas[s]) * xs + np.sqrt(betas[s]) * rng.normal(size=xs.shape)
    direct = q_sample(np.full(40_000, 0.8), 199, betas, rng.normal(size=40_000))
    assert abs(xs.mean() - direct.mean()) < 0.02 and abs(xs.var() - direct.var()) < 0.02

@test("노이즈를 정확히 알면 x0를 정확히 되찾는다")
def _():
    rng = np.random.default_rng(2)
    betas = np.linspace(1e-4, 0.02, 100)
    x0, eps = rng.normal(size=6), rng.normal(size=6)
    xt = q_sample(x0, 70, betas, eps)
    assert approx(predict_x0(xt, 70, betas, eps), x0, 1e-9)
`,
      hints: [
        "`0.5 * np.sum(mu ** 2 + np.exp(log_var) - 1 - log_var)`가 차원별 KL의 합입니다.",
        "`reparam`은 `mu + np.exp(0.5 * log_var) * eps`, `alpha_bar`는 `np.cumprod(1 - betas)`입니다.",
        "`ab = alpha_bar(betas)[t]`로 두면 `q_sample`은 `np.sqrt(ab) * x0 + np.sqrt(1 - ab) * eps`, `predict_x0`는 그 식을 $x_0$에 대해 푼 `(xt - np.sqrt(1 - ab) * eps_hat) / np.sqrt(ab)`입니다.",
      ],
      solution: py`
import numpy as np

def kl_gauss(mu, log_var):
    mu, log_var = np.asarray(mu, dtype=float), np.asarray(log_var, dtype=float)
    return float(0.5 * np.sum(mu ** 2 + np.exp(log_var) - 1 - log_var))

def reparam(mu, log_var, eps):
    return mu + np.exp(0.5 * np.asarray(log_var, dtype=float)) * eps

def alpha_bar(betas):
    return np.cumprod(1 - np.asarray(betas, dtype=float))

def q_sample(x0, t, betas, eps):
    ab = alpha_bar(betas)[t]
    return np.sqrt(ab) * x0 + np.sqrt(1 - ab) * eps

def predict_x0(xt, t, betas, eps_hat):
    ab = alpha_bar(betas)[t]
    return (xt - np.sqrt(1 - ab) * eps_hat) / np.sqrt(ab)

print(kl_gauss(np.array([1.5]), np.log(np.array([0.25]))))
`,
    },
    {
      id: "w4-lab-fgsm",
      sectionId: "adversarial-examples",
      title: "softmax 회귀를 FGSM으로 공격하기",
      tier: "advanced",
      prompt: `
「적대적 예제」 단계의 공격을 구현합니다. 모델은 이미 학습된 softmax 회귀 $p = \\mathrm{softmax}(XW + b)$입니다.

1. \`input_grad(X, y, W, b)\`: 샘플별 교차 엔트로피의 입력 기울기 $\\nabla_X L = (P - Y)W^\\top$ (\`Y\`는 원-핫, 결과는 \`X\`와 같은 모양)
2. \`fgsm(X, y, W, b, eps)\`: $\\mathrm{clip}_{[0,1]}(X + \\varepsilon\\,\\mathrm{sign}(\\nabla_X L))$
3. \`linear_logit_shift(w, eps)\`: 픽셀마다 최대 \`eps\`만 바꿀 때 로짓 $w^\\top x$의 최대 변화 $\\varepsilon\\lVert w\\rVert_1$
`,
      starter: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def input_grad(X, y, W, b):
    return np.zeros_like(X)  # TODO

def fgsm(X, y, W, b, eps):
    return X  # TODO

def linear_logit_shift(w, eps):
    return 0.0  # TODO

X, y = load_digits(return_X_y=True)
X = X / 16.0
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
W, b = np.zeros((64, 10)), np.zeros(10)
for _ in range(500):
    G = (softmax(Xtr @ W + b) - np.eye(10)[ytr]) / len(Xtr)
    W -= Xtr.T @ G
    b -= G.sum(axis=0)
acc = lambda Xs: np.mean((Xs @ W + b).argmax(1) == yte)
print("깨끗한 정확도", round(acc(Xte), 3), " FGSM(0.1)", round(acc(fgsm(Xte, yte, W, b, 0.1)), 3))
`,
      tests: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

X, y = load_digits(return_X_y=True)
X = X / 16.0
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
W, b = np.zeros((64, 10)), np.zeros(10)
for _ in range(500):
    G = (softmax(Xtr @ W + b) - np.eye(10)[ytr]) / len(Xtr)
    W -= Xtr.T @ G
    b -= G.sum(axis=0)
acc = lambda Xs: np.mean((Xs @ W + b).argmax(1) == yte)

@test("입력 기울기가 수치미분과 일치한다")
def _():
    i = 5
    g = input_grad(Xte[i:i + 1], yte[i:i + 1], W, b)[0]
    L = lambda x: -np.log(softmax((x @ W + b)[None, :])[0, yte[i]])
    num = np.array([(L(Xte[i] + 1e-6 * e) - L(Xte[i] - 1e-6 * e)) / 2e-6 for e in np.eye(64)])
    assert approx(g, num, 1e-5)

@test("FGSM은 픽셀을 [0, 1] 안에서 최대 ε만 바꾼다")
def _():
    adv = fgsm(Xte, yte, W, b, 0.1)
    assert adv.min() >= 0 and adv.max() <= 1 and np.abs(adv - Xte).max() <= 0.1 + 1e-12

@test("ε=0.1 FGSM이 정확도를 0.75 아래로 떨어뜨린다(깨끗: 0.96 이상)")
def _():
    assert acc(Xte) > 0.96 and acc(fgsm(Xte, yte, W, b, 0.1)) < 0.75, f"{acc(Xte):.3f}, {acc(fgsm(Xte, yte, W, b, 0.1)):.3f}"

@test("같은 크기의 무작위 부호 노이즈는 거의 영향이 없다")
def _():
    rand = np.clip(Xte + 0.1 * np.random.default_rng(0).choice([-1.0, 1.0], size=Xte.shape), 0, 1)
    assert acc(rand) > acc(fgsm(Xte, yte, W, b, 0.1)) + 0.2

@test("선형 로짓의 최대 변화 = ε‖w‖₁")
def _():
    assert approx(linear_logit_shift(np.array([0.5, -2.0, 1.5]), 0.1), 0.4)
`,
      hints: [
        "`P = softmax(X @ W + b)`, `Y = np.eye(W.shape[1])[y]`로 두면 기울기는 `(P - Y) @ W.T`입니다(평균이 아니라 샘플별).",
        "`np.clip(X + eps * np.sign(input_grad(X, y, W, b)), 0, 1)`",
        "`eps * np.abs(w).sum()`",
      ],
      solution: py`
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def input_grad(X, y, W, b):
    P = softmax(X @ W + b)
    Y = np.eye(W.shape[1])[y]
    return (P - Y) @ W.T

def fgsm(X, y, W, b, eps):
    return np.clip(X + eps * np.sign(input_grad(X, y, W, b)), 0, 1)

def linear_logit_shift(w, eps):
    return float(eps * np.abs(w).sum())

X, y = load_digits(return_X_y=True)
X = X / 16.0
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
W, b = np.zeros((64, 10)), np.zeros(10)
for _ in range(500):
    G = (softmax(Xtr @ W + b) - np.eye(10)[ytr]) / len(Xtr)
    W -= Xtr.T @ G
    b -= G.sum(axis=0)
acc = lambda Xs: np.mean((Xs @ W + b).argmax(1) == yte)
print("깨끗한 정확도", round(acc(Xte), 3), " FGSM(0.1)", round(acc(fgsm(Xte, yte, W, b, 0.1)), 3))
`,
    },
  ],

  quiz: [
    {
      kind: "choice",
      id: "w4-drill-params",
      tier: "core",
      sectionId: "convolution",
      question: "RGB 입력(3채널)에 $5\\times5$ 커널 32개를 쓰는 합성곱층의 파라미터 수(편향 포함)는?",
      choices: ["2,432", "2,400", "832", "800"],
      answer: 0,
      explanation: "커널 하나는 $5 \\times 5 \\times 3 = 75$개의 가중치를 가지고, 32개이므로 2,400개, 출력 채널마다 편향 1개씩 32개를 더해 2,432개입니다. 입력 이미지의 가로·세로 크기와는 무관합니다(파라미터 공유).",
    },
    {
      kind: "choice",
      id: "w4-drill-plain50",
      tier: "core",
      sectionId: "resnet",
      question: "잔차 연결 없는 50층에서 층마다 기울기가 평균 0.6배씩 곱해진다면, 입력 쪽에 도착하는 기울기는 대략 원래의 몇 배인가?",
      choices: ["약 $10^{-11}$배", "약 0.03배", "약 0.6배", "약 30배"],
      answer: 0,
      explanation: "$0.6^{50} = e^{50 \\ln 0.6} \\approx e^{-25.5} \\approx 8 \\times 10^{-12}$입니다. 잔차 연결이 있으면 국소 기울기가 $F' + 1$이라 1 근처에 머물러 50층을 지나도 같은 자릿수가 유지됩니다.",
    },
    {
      kind: "choice",
      id: "w4-drill-initloss",
      tier: "core",
      sectionId: "transfer-diagnostics",
      question: "10클래스 분류 모델의 학습 첫 스텝 손실(교차 엔트로피)이 23.0으로 나왔다. 가장 먼저 의심할 것은?",
      choices: [
        "학습 데이터가 부족하다",
        "출력층 초기화가 너무 커서 처음부터 몇 클래스에 확신에 찬 예측을 한다(정상은 약 $\\ln 10 \\approx 2.3$)",
        "학습률이 너무 작다",
        "정상이다. 학습이 진행되면 줄어든다",
      ],
      answer: 1,
      explanation: "아무것도 배우지 않은 모델은 10개 클래스에 약 1/10씩 줘야 하므로 손실이 $\\ln 10$ 근처여야 합니다. 그보다 훨씬 크면 로짓이 너무 크게 시작해 틀린 클래스에 높은 확률을 주고 있다는 뜻입니다. Karpathy 레시피는 학습 전에 이 값을 먼저 확인합니다.",
    },
    {
      kind: "predict",
      id: "w4-drill-outsize",
      tier: "core",
      sectionId: "convolution",
      code: py`
def out_size(n, k, s=1, p=0):
    return (n + 2 * p - k) // s + 1

print(out_size(5, 3), out_size(5, 3, p=1), out_size(5, 3, s=2), out_size(28, 5))
`,
      expected: "3 5 2 24",
      explanation: "$\\lfloor (5-3)/1 \\rfloor + 1 = 3$, 패딩 1이면 $\\lfloor (5+2-3)/1 \\rfloor + 1 = 5$(same padding), 보폭 2면 $\\lfloor 2/2 \\rfloor + 1 = 2$, $28 \\times 28$에 $5 \\times 5$면 24입니다.",
    },
    {
      kind: "predict",
      id: "w4-drill-pool",
      tier: "core",
      sectionId: "pooling-receptive-field",
      code: py`
import numpy as np
y = np.array([[1., 1., 2., 1.],
              [1., 9., 1., 1.],
              [1., 1., 1., 2.],
              [1., 1., 1., 1.]])
blocks = y.reshape(2, 2, 2, 2)
print(blocks.max(axis=(1, 3)).tolist())
print(blocks.mean(axis=(1, 3)).tolist())
`,
      expected: "[[9.0, 2.0], [1.0, 2.0]]\n[[3.0, 1.25], [1.0, 1.25]]",
      explanation: "왼쪽 위 블록 `[[1, 1], [1, 9]]`의 최댓값은 9, 평균은 3입니다. Max는 강한 반응 하나를 그대로 남기고, Average는 그 반응을 주변 값과 섞어 3으로 희석합니다.",
    },
    {
      kind: "predict",
      id: "w4-drill-rf",
      tier: "core",
      sectionId: "pooling-receptive-field",
      code: py`
r, j = 1, 1
for k, s in [(3, 1), (3, 1), (2, 2), (3, 1)]:
    r, j = r + (k - 1) * j, j * s
    print(r, j)
`,
      expected: "3 1\n5 1\n6 2\n10 2",
      explanation: "$3 \\times 3$ conv 두 층으로 수용영역이 3, 5가 되고, $2 \\times 2$ 풀링(보폭 2)이 6으로 늘리면서 점프를 2로 만듭니다. 그 뒤의 $3 \\times 3$ conv는 $(3-1) \\times 2 = 4$만큼 넓혀 10이 됩니다. 같은 conv라도 뒤쪽 층일수록 수용영역을 더 크게 넓힙니다.",
    },
    {
      kind: "descriptive",
      id: "w4-drill-augment",
      tier: "core",
      sectionId: "regularization",
      question:
        "손글씨 숫자에 '위아래 뒤집기' 증강이 잘못된 이유, CIFAR-10에서 '좌우 뒤집기'는 괜찮지만 '위아래 뒤집기'는 잘 쓰지 않는 이유, 그리고 증강을 훈련 데이터에만 적용해야 하는 이유를 함께 설명하십시오.",
      modelAnswer:
        "증강은 정답 레이블이 바뀌지 않는 변환이어야 합니다. 숫자 6을 위아래로 뒤집으면 9처럼 보여 레이블이 바뀌므로, 모델에게 틀린 정답을 가르치게 됩니다. CIFAR-10의 비행기·자동차·고양이는 좌우가 바뀌어도 같은 물체이지만, 위아래가 뒤집힌 사진은 현실에서 거의 나오지 않아 실제 분포와 동떨어진 데이터를 만들게 됩니다. 증강은 훈련 데이터의 다양성을 늘려 일반화를 돕는 장치이고, 평가 데이터는 실제로 들어올 입력을 대표해야 하므로 변형하지 않고 그대로 써야 성능을 정직하게 잴 수 있습니다.",
      keyPoints: ["증강은 레이블을 보존하는 변환이어야 한다", "6 ↔ 9처럼 뒤집기가 레이블을 바꾼다", "위아래 뒤집힌 사진은 실제 분포에 없다", "평가 데이터는 실제 입력을 대표해야 하므로 증강하지 않는다"],
    },
    {
      kind: "descriptive",
      id: "w4-drill-overfit-bug",
      tier: "core",
      sectionId: "transfer-diagnostics",
      question:
        "배치 10개 과적합 실험에서 기울기 줄 `G[np.arange(10), ys] -= 1`을 실수로 지우면 무슨 일이 생기는지, 그리고 \"배치 하나도 외우지 못하면 파이프라인 버그\"라는 레시피가 왜 이런 버그를 잘 잡아내는지 설명하십시오.",
      modelAnswer:
        "그 줄은 소프트맥스+교차 엔트로피의 기울기 $P - \\text{원핫}$에서 원핫을 빼는 부분입니다. 지우면 기울기가 $P$만 남아 정답 클래스를 포함한 **모든** 클래스의 점수를 낮추는 방향으로만 움직이므로, 정답 확률을 올리지 못해 정확도가 오르지 않고 손실도 줄지 않습니다. 샘플 10개는 충분한 용량의 모델이라면 무조건 외울 수 있는 쉬운 과제라, 이것조차 실패하면 데이터·모델 크기 문제가 아니라 손실·기울기·갱신 같은 코드 버그라고 바로 좁힐 수 있습니다. 큰 데이터로 오래 학습한 뒤에야 발견하는 것보다 훨씬 빠르고 확실한 진단입니다.",
      keyPoints: ["그 줄은 P − 원핫에서 원핫을 빼는 부분", "지우면 정답 클래스 점수를 올리지 못한다", "10개는 반드시 외울 수 있는 쉬운 과제", "실패하면 데이터가 아니라 코드 버그로 좁혀진다"],
    },
    {
      kind: "choice",
      id: "w4-drill-diffusion-noise",
      tier: "supplement",
      sectionId: "generative-models",
      question: "순확산 $x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\epsilon$에서 $\\bar\\alpha_t$가 0에 가까워지면 $x_t$는?",
      choices: ["원본 $x_0$와 거의 같다", "원본 정보가 거의 없는 표준 가우시안 잡음에 가깝다", "모든 값이 0이 된다", "원본의 두 배가 된다"],
      answer: 1,
      explanation: "$\\sqrt{\\bar\\alpha_t} \\to 0$이라 원본의 몫이 사라지고 $\\sqrt{1-\\bar\\alpha_t} \\to 1$이라 $x_t \\approx \\epsilon$입니다. 그래서 생성은 순수 잡음에서 시작해 역방향으로 잡음을 한 단계씩 걷어내는 과정이 됩니다.",
    },
    {
      kind: "predict",
      id: "w4-drill-vit",
      tier: "supplement",
      sectionId: "cnn-history-applications",
      code: py`
print((224 // 16) ** 2, (224 // 32) ** 2)
print(3 * (9 * 64 * 64), 49 * 64 * 64)
`,
      expected: "196 49\n110592 200704",
      explanation: "$224 \\times 224$ 이미지를 $16 \\times 16$ 패치로 자르면 $14 \\times 14 = 196$개, $32 \\times 32$ 패치면 $7 \\times 7 = 49$개 토큰입니다. $3 \\times 3$ conv 세 층은 $7 \\times 7$ conv 한 층과 수용영역이 같지만 파라미터는 약 55%만 씁니다.",
    },
    {
      kind: "descriptive",
      id: "w4-drill-ae-generate",
      tier: "supplement",
      sectionId: "generative-models",
      question:
        "PCA(선형 오토인코더)로 2차원까지 줄인 잠재공간에서 아무 점이나 골라 복원하면 그럴듯한 숫자가 잘 나오지 않는 이유와, VAE의 KL 항이 이 문제를 어떻게 완화하는지 설명하십시오.",
      modelAnswer:
        "일반 오토인코더나 PCA는 복원 오차만 줄이도록 학습하므로, 학습 데이터가 놓이는 잠재 좌표는 공간 곳곳에 듬성듬성 흩어지고 그 사이 빈 영역이 무엇을 뜻하는지는 전혀 학습되지 않습니다. 그래서 임의의 점을 골라 디코딩하면 데이터가 없던 영역이라 숫자 같지 않은 결과가 나오기 쉽습니다. VAE는 인코더가 점 하나가 아니라 분포(평균·분산)를 내게 하고, 그 분포를 표준정규분포에 가깝게 만드는 KL 항을 손실에 더합니다. 그러면 잠재 코드가 원점 근처에 빈틈없이 연속적으로 퍼지게 되어, 표준정규분포에서 뽑은 점을 디코딩해도 그럴듯한 데이터가 나옵니다.",
      keyPoints: ["복원 오차만 학습하면 잠재공간에 빈 영역이 생긴다", "빈 영역의 점은 의미 있는 출력으로 디코딩되지 않는다", "VAE는 분포를 출력하고 KL 항으로 표준정규분포에 맞춘다", "잠재공간이 연속적으로 채워져 샘플링이 가능해진다"],
    },
    {
      kind: "predict",
      id: "w4-drill-iou",
      tier: "supplement",
      sectionId: "detection-segmentation",
      code: py`
def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])
    return inter / (area(a) + area(b) - inter)
print(iou((0, 0, 10, 10), (5, 0, 15, 10)), iou((0, 0, 2, 2), (0, 0, 4, 4)))
`,
      expected: "0.3333333333333333 0.25",
      explanation:
        "첫 쌍은 가로로 절반 겹쳐 겹친 넓이 50, 합친 넓이 $100 + 100 - 50 = 150$이라 1/3입니다. 둘째 쌍은 작은 상자가 큰 상자 안에 완전히 들어 있어 겹친 넓이 4, 합친 넓이 16이라 0.25입니다. 완전히 포함되어도 크기가 다르면 IoU가 낮습니다.",
    },
    {
      kind: "choice",
      id: "w4-drill-pixel-acc",
      tier: "supplement",
      sectionId: "detection-segmentation",
      question: "종양이 영상 픽셀의 1%를 차지하는 의료 영상 분할에서, 모든 픽셀을 '배경'으로 예측하는 모델의 픽셀 정확도와 종양 클래스의 Dice는?",
      choices: ["픽셀 정확도 99%, Dice 0", "픽셀 정확도 1%, Dice 0", "둘 다 99%", "픽셀 정확도 50%, Dice 0.5"],
      answer: 0,
      explanation:
        "배경 99%를 모두 맞혀 정확도는 99%지만, 종양 픽셀을 하나도 예측하지 않아 $|A\\cap B| = 0$이므로 Dice는 0입니다. 2주차 정확도의 함정이 픽셀 단위로 그대로 나타나는 경우라서 분할에서는 Dice·IoU를 봅니다.",
    },
    {
      kind: "choice",
      id: "w4-drill-depthwise",
      tier: "advanced",
      sectionId: "conv-as-matmul",
      question: "입력 해상도를 가로·세로 두 배로 키우면 같은 합성곱층의 파라미터 수와 FLOPs는 각각 어떻게 되는가?",
      choices: ["파라미터는 그대로, FLOPs는 4배", "둘 다 4배", "파라미터 4배, FLOPs 그대로", "둘 다 2배"],
      answer: 0,
      explanation:
        "파라미터 $K^2C_{in}C_{out}$은 해상도와 무관합니다. FLOPs $2HWK^2C_{in}C_{out}$은 출력 위치 수 $HW$에 비례하므로 4배가 됩니다. 고해상도 앞쪽 층이 파라미터는 적어도 연산의 대부분을 차지하는 이유입니다.",
    },
    {
      kind: "predict",
      id: "w4-drill-kl",
      tier: "advanced",
      sectionId: "generative-math",
      code: py`
import math
def kl(mu, sigma):
    return 0.5 * (mu ** 2 + sigma ** 2 - 1 - math.log(sigma ** 2))
print(kl(0, 1), kl(2, 1), round(kl(0, math.e ** 0.5), 4))
`,
      expected: "0.0 2.0 0.3591",
      explanation:
        "$\\mu = 0, \\sigma = 1$이면 사전분포와 같아 0입니다. 평균만 2로 옮기면 $\\frac{1}{2}\\mu^2 = 2$입니다. $\\sigma^2 = e$이면 $\\frac{1}{2}(e - 1 - 1) = \\frac{e}{2} - 1 \\approx 0.3591$로, 분산이 1보다 커져도 벌점이 붙습니다.",
    },
    {
      kind: "descriptive",
      id: "w4-drill-fgsm",
      tier: "advanced",
      sectionId: "adversarial-examples",
      question:
        "어떤 팀이 \"우리 이미지 분류기는 테스트 정확도 98%이고, 가우시안 노이즈를 섞어도 95%를 유지하니 강건하다\"고 주장합니다. 적대적 예제의 관점에서 이 주장의 허점을 설명하고, 강건성을 제대로 평가하고 높이는 방법을 제안하십시오.",
      modelAnswer:
        "무작위 노이즈에 대한 성능은 평균적인 교란에 대한 성적일 뿐, 최악의 교란에 대한 보장이 아닙니다. 무작위 노이즈는 방향이 제멋대로라 로짓에 주는 효과가 서로 상쇄되지만, FGSM처럼 입력 기울기의 부호로 맞춘 노이즈는 같은 크기에서도 모든 항이 같은 방향으로 더해져 $\\varepsilon\\lVert w\\rVert_1$만큼 로짓을 움직이고, 고차원 이미지에서는 이 값이 매우 큽니다(실습: 무작위 노이즈 0.965 유지, FGSM 0.646). 따라서 강건성은 허용 교란 크기 $\\varepsilon$를 정하고 FGSM보다 강한 PGD 같은 반복 공격으로 측정한 정확도로 보고해야 합니다. 높이는 방법으로는 학습 중 PGD 적대적 예제를 섞는 적대적 학습이 가장 믿을 만하며, 깨끗한 정확도의 소폭 하락과 학습 비용 증가를 함께 보고합니다.",
      keyPoints: ["무작위 노이즈에 대한 강건성은 최악의 경우 강건성이 아니다", "기울기 부호로 맞춘 노이즈의 효과가 차원에 비례", "PGD 등 강한 공격으로 허용 교란 크기를 명시해 평가", "적대적 학습과 그 대가"],
    },
  ],

  assignment: {
    requirements: [
      "실험 엔진 셀은 수정하지 않고, 설정은 `train(...)`의 인자로만 바꾼다.",
      "학습 전 초기 손실이 $\\ln 10 \\approx 2.303$ 근처인지 먼저 확인하고, 기준선의 train/val 곡선을 그린다.",
      "후보 중 ablation 두 가지를 골라 실행 **전에** 가설을 적고, 결과 표와 비교해 맞고 틀린 이유를 설명한다.",
      "틀린 테스트 이미지에서 공통 패턴을 두 가지 이상 찾아 개선 아이디어를 낸다.",
      "`out_size`의 TODO를 출력 크기 공식으로 채워 다섯 설정이 모두 '일치'가 되게 하고, 파라미터 수·특징 지도·평행이동 등변성을 해석한다.",
    ],
    autoTests: [
      {
        id: "w4-at-initloss",
        taskId: "baseline",
        title: "초기 손실이 ln 10 근처(±0.1)",
        code: py`
import numpy as np
assert abs(loss0 - np.log(10)) < 0.1, f"loss0 = {loss0:.3f}"
`,
      },
      {
        id: "w4-at-baseline",
        taskId: "baseline",
        title: "기준선 val 정확도 0.85 이상",
        code: py`
acc = base["hist"]["val_acc"][-1]
assert acc >= 0.85, f"기준선 val 정확도 {acc:.3f}"
`,
        hint: "엔진 셀을 수정하지 않았는지, 기준선 셀을 끝까지 실행했는지 확인하십시오.",
      },
      {
        id: "w4-at-ablation",
        taskId: "ablation",
        title: "ablation 두 가지를 각각 설정 하나만 바꿔 실행했다",
        code: py`
assert len(ABLATIONS) == 2, f"고른 ablation이 {len(ABLATIONS)}개입니다(2개여야 함)."
assert all(len(change) == 1 for change in ABLATIONS.values()), "한 번에 설정 하나만 바꿔야 합니다."
assert all(name in results for name in ABLATIONS), "ABLATIONS의 실험 결과가 results에 없습니다. 셀을 다시 실행하십시오."
`,
      },
      {
        id: "w4-at-outsize",
        taskId: "conv",
        title: "out_size가 출력 크기 공식과 일치한다(본문에 없는 설정 포함)",
        code: py`
for n, k, s, p, expect in [(8, 3, 2, 1, 4), (32, 5, 1, 2, 32), (32, 5, 2, 2, 16), (7, 3, 2, 0, 3), (28, 5, 1, 0, 24)]:
    got = out_size(n, k, s, p)
    assert got == expect, f"out_size({n}, {k}, {s}, {p}) = {got}, 기대 {expect}"
`,
      },
    ],
    challenges: [
      {
        id: "w4-ch-conv-multi",
        title: "다채널 합성곱을 반복문 두 개로 벡터화하기",
        tier: "advanced",
        prompt: `
실제 CNN의 합성곱은 입력이 여러 채널입니다. \`conv2d_multi(x, w, b, stride, pad)\`를 구현합니다.

- \`x\`: (C_in, H, W), \`w\`: (C_out, C_in, K, K), \`b\`: (C_out,) → 출력 (C_out, H_out, W_out)
- 출력의 한 칸은 **모든 입력 채널**에 걸친 $K \\times K$ 창과 필터의 원소별 곱의 합 + 편향입니다.

출력 위치(i, j)에 대한 반복문 두 개만 쓰고, 채널과 필터 축은 \`np.tensordot\`(또는 \`np.einsum\`)으로 한 번에 계산합니다. 채점은 네 겹 반복문 참조 구현과 비교합니다.
`,
        starter: py`
import numpy as np

def conv2d_multi(x, w, b, stride=1, pad=0):
    x = np.pad(x, ((0, 0), (pad, pad), (pad, pad)))
    C_out, C_in, K, _ = w.shape
    H_out = (x.shape[1] - K) // stride + 1
    W_out = (x.shape[2] - K) // stride + 1
    out = np.zeros((C_out, H_out, W_out))
    for i in range(H_out):
        for j in range(W_out):
            window = x[:, i * stride:i * stride + K, j * stride:j * stride + K]   # (C_in, K, K)
            # TODO: 모든 필터에 대해 window와의 원소별 곱의 합을 한 번에 구해 out[:, i, j]에 넣고 b를 더합니다.
    return out

rng = np.random.default_rng(0)
x = rng.normal(size=(3, 8, 8))
w = rng.normal(size=(4, 3, 3, 3))
print(conv2d_multi(x, w, np.zeros(4), pad=1).shape)
`,
        tests: py`
import numpy as np
rng = np.random.default_rng(1)

def reference(x, w, b, stride=1, pad=0):
    x = np.pad(x, ((0, 0), (pad, pad), (pad, pad)))
    C_out, C_in, K, _ = w.shape
    H_out, W_out = (x.shape[1] - K) // stride + 1, (x.shape[2] - K) // stride + 1
    out = np.zeros((C_out, H_out, W_out))
    for f in range(C_out):
        for i in range(H_out):
            for j in range(W_out):
                out[f, i, j] = np.sum(x[:, i * stride:i * stride + K, j * stride:j * stride + K] * w[f]) + b[f]
    return out

@test("출력 shape (C_out, H_out, W_out)")
def _():
    out = conv2d_multi(rng.normal(size=(3, 8, 8)), rng.normal(size=(5, 3, 3, 3)), np.zeros(5), stride=2, pad=1)
    assert out.shape == (5, 4, 4), f"shape: {out.shape}"

@test("참조 구현과 일치 (stride 1, pad 1)")
def _():
    x, w, b = rng.normal(size=(3, 6, 6)), rng.normal(size=(4, 3, 3, 3)), rng.normal(size=4)
    assert approx(conv2d_multi(x, w, b, pad=1), reference(x, w, b, pad=1))

@test("참조 구현과 일치 (5×5 커널, stride 2)")
def _():
    x, w, b = rng.normal(size=(2, 9, 9)), rng.normal(size=(3, 2, 5, 5)), rng.normal(size=3)
    assert approx(conv2d_multi(x, w, b, stride=2), reference(x, w, b, stride=2))

@test("입력 채널이 1개면 흑백 합성곱과 같다")
def _():
    x, k = rng.normal(size=(1, 5, 5)), rng.normal(size=(1, 1, 3, 3))
    single = np.array([[np.sum(x[0, i:i+3, j:j+3] * k[0, 0]) for j in range(3)] for i in range(3)])
    assert approx(conv2d_multi(x, k, np.zeros(1))[0], single)
`,
        hints: [
          "`w`는 (C_out, C_in, K, K), `window`는 (C_in, K, K)입니다. 뒤쪽 세 축끼리 곱해 더하면 (C_out,)이 남습니다.",
          "`np.tensordot(w, window, axes=([1, 2, 3], [0, 1, 2]))` 또는 `np.einsum(\"fckl,ckl->f\", w, window)`",
          "`out[:, i, j] = ... + b`",
        ],
        solution: py`
import numpy as np

def conv2d_multi(x, w, b, stride=1, pad=0):
    x = np.pad(x, ((0, 0), (pad, pad), (pad, pad)))
    C_out, C_in, K, _ = w.shape
    H_out = (x.shape[1] - K) // stride + 1
    W_out = (x.shape[2] - K) // stride + 1
    out = np.zeros((C_out, H_out, W_out))
    for i in range(H_out):
        for j in range(W_out):
            window = x[:, i * stride:i * stride + K, j * stride:j * stride + K]
            out[:, i, j] = np.tensordot(w, window, axes=([1, 2, 3], [0, 1, 2])) + b
    return out

rng = np.random.default_rng(0)
x = rng.normal(size=(3, 8, 8))
w = rng.normal(size=(4, 3, 3, 3))
print(conv2d_multi(x, w, np.zeros(4), pad=1).shape)
`,
      },
      {
        id: "w4-ch-maxpool-backward",
        title: "Max Pooling의 역전파: 승자에게만 기울기를",
        tier: "advanced",
        prompt: `
Max Pooling은 파라미터가 없지만 역전파는 해야 합니다. $2 \\times 2$(stride 2) 풀링의 순전파·역전파를 구현합니다.

1. \`maxpool_forward(a)\`: 풀링 결과와, 역전파에 쓸 **각 블록 최댓값의 위치**(마스크)를 돌려줍니다.
2. \`maxpool_backward(dout, mask)\`: 상류 기울기 \`dout\`(풀링 출력 크기)을 블록 안에서 최댓값이었던 자리에만 전달하고 나머지는 0으로 둡니다(ReLU처럼 승자독식).

블록 안에 최댓값이 여러 개면 첫 번째 위치(행 우선) 하나에만 전달합니다. 채점은 수치미분과 비교합니다.
`,
        starter: py`
import numpy as np

def maxpool_forward(a):
    H, W = a.shape
    blocks = a.reshape(H // 2, 2, W // 2, 2).transpose(0, 2, 1, 3).reshape(H // 2, W // 2, 4)
    out = blocks.max(axis=2)
    mask = np.zeros_like(a)
    # TODO: 블록마다 argmax 위치(0~3)를 원래 좌표 (2*bi + r, 2*bj + c)로 바꿔 mask에 1을 표시합니다.
    return out, mask

def maxpool_backward(dout, mask):
    # TODO: dout을 각 블록 크기(2×2)로 늘린 뒤 mask를 곱합니다.
    return np.zeros_like(mask)

a = np.array([[1., 3., 2., 1.], [4., 2., 0., 5.], [1., 1., 7., 2.], [0., 2., 3., 3.]])
out, mask = maxpool_forward(a)
print(out)
print(maxpool_backward(np.ones_like(out), mask))
`,
        tests: py`
import numpy as np
a = np.array([[1., 3., 2., 1.], [4., 2., 0., 5.], [1., 1., 7., 2.], [0., 2., 3., 3.]])

@test("순전파 결과 = [[4, 5], [2, 7]]")
def _():
    out, _ = maxpool_forward(a)
    assert approx(out, [[4, 5], [2, 7]])

@test("마스크는 블록마다 최댓값 자리 하나")
def _():
    _, mask = maxpool_forward(a)
    assert mask.sum() == 4 and mask[1, 0] == 1 and mask[1, 3] == 1 and mask[2, 2] == 1 and mask[3, 1] == 1, f"mask:\n{mask}"

@test("동점이면 첫 번째 위치 하나에만")
def _():
    _, mask = maxpool_forward(np.ones((2, 2)))
    assert mask.tolist() == [[1, 0], [0, 0]], f"mask: {mask.tolist()}"

@test("역전파가 수치미분과 일치")
def _():
    rng = np.random.default_rng(0)
    x = rng.normal(size=(4, 6))
    dout = rng.normal(size=(2, 3))
    out, mask = maxpool_forward(x)
    dx = maxpool_backward(dout, mask)
    num = np.zeros_like(x)
    for i in range(4):
        for j in range(6):
            xp, xm = x.copy(), x.copy()
            xp[i, j] += 1e-6; xm[i, j] -= 1e-6
            num[i, j] = (np.sum(maxpool_forward(xp)[0] * dout) - np.sum(maxpool_forward(xm)[0] * dout)) / 2e-6
    assert approx(dx, num, 1e-5)
`,
        hints: [
          "`idx = blocks.argmax(axis=2)`는 (H/2, W/2) 배열이고, 값 0~3은 블록 안 (행, 열) = `divmod(idx, 2)`입니다.",
          "`r, c = np.divmod(idx, 2)`, `bi, bj = np.indices(idx.shape)`를 만든 뒤 `mask[2 * bi + r, 2 * bj + c] = 1`",
          "`np.repeat(np.repeat(dout, 2, axis=0), 2, axis=1) * mask`. `np.kron(dout, np.ones((2, 2)))`도 같습니다.",
        ],
        solution: py`
import numpy as np

def maxpool_forward(a):
    H, W = a.shape
    blocks = a.reshape(H // 2, 2, W // 2, 2).transpose(0, 2, 1, 3).reshape(H // 2, W // 2, 4)
    out = blocks.max(axis=2)
    mask = np.zeros_like(a)
    idx = blocks.argmax(axis=2)
    r, c = np.divmod(idx, 2)
    bi, bj = np.indices(idx.shape)
    mask[2 * bi + r, 2 * bj + c] = 1
    return out, mask

def maxpool_backward(dout, mask):
    return np.repeat(np.repeat(dout, 2, axis=0), 2, axis=1) * mask

a = np.array([[1., 3., 2., 1.], [4., 2., 0., 5.], [1., 1., 7., 2.], [0., 2., 3., 3.]])
out, mask = maxpool_forward(a)
print(out)
print(maxpool_backward(np.ones_like(out), mask))
`,
      },
    ],
  },
};

export default week4;
