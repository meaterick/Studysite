import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "im2col 합성곱과 합성곱의 역전파",
    prompt: md`
본문의 im2col, 합성곱의 역전파, depthwise separable 합성곱의 파라미터 비율을 구현합니다. 모든 합성곱은 stride 1, padding 0(교차상관)입니다.

1. \`im2col(x, kh, kw)\`: 모든 $k_h\times k_w$ 창을 행 우선 순서로 한 줄씩 편 \`(창 개수, kh*kw)\` 행렬. 역전파에서 \`G\`를 커널처럼 쓰므로 커널이 정사각형이 아닐 수 있습니다.
2. \`conv_matmul(x, k)\`: \`im2col\`과 행렬 곱 한 번으로 합성곱 출력 \`(H-kh+1, W-kw+1)\`
3. \`conv_backward(x, k, G)\`: 출력 기울기 \`G\`로부터 \`(dx, dk)\`. \`dk\`는 \`x\`와 \`G\`의 합성곱, \`dx\`는 \`G\`의 위아래에 \`kh-1\`칸, 좌우에 \`kw-1\`칸씩 0을 채운 뒤 180° 뒤집은 커널로 합성곱한 것입니다. 2번의 \`conv_matmul\`을 재사용하십시오.
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
    hints: ["`np.array([x[i:i + kh, j:j + kw].ravel() for i in range(H - kh + 1) for j in range(W - kw + 1)])`처럼 행을 먼저, 열을 나중에 돕니다.", "`conv_matmul`은 `(im2col(x, kh, kw) @ k.ravel()).reshape(H - kh + 1, W - kw + 1)`입니다.", "`dk = conv_matmul(x, G)`, `dx = conv_matmul(np.pad(G, ((kh - 1, kh - 1), (kw - 1, kw - 1))), k[::-1, ::-1])`. 비율은 `(K*K*c_in + c_in*c_out) / (K*K*c_in*c_out)`입니다."],
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
]);
