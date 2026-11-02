import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "반복문 없는 풀링과 수용영역 계산기",
    prompt: md`

1. \`max_pool(a)\`, \`avg_pool(a)\`: $2 \times 2$ 영역, stride 2 풀링을 **반복문 없이** \`reshape\`와 \`axis\`로 구현합니다. (H, W)를 (H/2, 2, W/2, 2)로 바꾸면 블록 내부가 1번·3번 축이 됩니다.
2. \`receptive_field(layers)\`: \`(커널, 보폭)\` 리스트를 받아 마지막 층 한 칸이 입력에서 보는 범위를 돌려줍니다. 층마다 $r \leftarrow r + (k-1)\,j$, $j \leftarrow j \cdot s$로 갱신합니다($r = j = 1$에서 시작).
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
    hints: ["`a.reshape(H // 2, 2, W // 2, 2)`의 축은 (세로 블록, 블록 안 세로, 가로 블록, 블록 안 가로)입니다.", "`.max(axis=(1, 3))`, `.mean(axis=(1, 3))`로 블록 안쪽 두 축을 줄입니다.", "`r, j = r + (k - 1) * j, j * s`처럼 한 줄에 쓰면 오른쪽이 모두 이전 값으로 계산됩니다."],
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
]);
