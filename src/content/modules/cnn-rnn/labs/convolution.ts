import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "합성곱 직접 구현과 파라미터 수 계산",
    prompt: md`

1. \`conv2d(x, k, stride=1, padding=0)\`: 흑백 이미지 \`x\`(H, W)에 정사각 커널 \`k\`를 미끄러뜨리며 **원소별 곱의 합**을 구합니다. 패딩은 0으로 채웁니다(\`np.pad\`). 출력 크기는 $\lfloor (N + 2P - K)/S \rfloor + 1$입니다.
2. \`conv_params(k, c_in, c_out)\`: $k \times k$ 커널, 입력 채널 \`c_in\`, 출력 채널 \`c_out\`인 합성곱층의 파라미터 수(편향 포함)
3. \`fc_params(n_in, n_out)\`: 완전연결층의 파라미터 수(편향 포함)

본문 예제처럼 $3 \times 3$ conv(3→64)는 1,792개, 같은 출력 수의 FC층($224 \times 224 \times 3 \to 64$)은 9,633,856개여야 합니다.
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
    hints: ["창은 `x[i*stride : i*stride + K, j*stride : j*stride + K]`입니다.", "`out[i, j] = np.sum(window * k)`. 같은 `k`를 모든 위치에서 쓰는 것이 파라미터 공유입니다.", "합성곱: `k * k * c_in * c_out + c_out`, 완전연결: `n_in * n_out + n_out`"],
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
]);
