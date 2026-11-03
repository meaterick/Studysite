import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "ViT처럼 이미지를 패치 토큰으로 나누기",
    prompt: md`
ViT의 패치 나누기와 VGG의 파라미터 비교를 함수로 구현합니다.

1. \`patchify(img, P)\`: (H, W) 이미지를 $P \times P$ 패치로 나눠, 패치를 **왼쪽 위부터 행 순서대로** 한 줄씩 편 (패치 수, P·P) 행렬을 돌려줍니다. 반복문 없이 \`reshape\`와 \`transpose\`로 씁니다.
2. \`n_tokens(img_size, patch)\`: 정사각 이미지에서 나오는 패치 토큰 수
3. \`vgg_compare(C)\`: 채널 C일 때 ($3 \times 3$ conv 세 층의 가중치 수, $7 \times 7$ conv 한 층의 가중치 수)

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
    hints: ["`img.reshape(H // P, P, W // P, P)`의 축은 (패치 행, 패치 안 행, 패치 열, 패치 안 열)입니다.", "`.transpose(0, 2, 1, 3)`으로 (패치 행, 패치 열, 패치 안 행, 패치 안 열)로 바꾼 뒤 `.reshape(-1, P * P)`", "토큰 수는 `(img_size // patch) ** 2`, 파라미터는 `3 * (9 * C * C)`와 `49 * C * C`입니다."],
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
]);
