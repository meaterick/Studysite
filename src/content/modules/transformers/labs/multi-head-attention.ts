import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "헤드 나누기·합치기와 causal mask",
    prompt: md`
멀티헤드 attention에서 가장 실수가 잦은 텐서 조작 세 가지를 따로 구현합니다.

1. \`split_heads(M, h)\`: (T, d) → (h, T, d/h). 헤드 $i$는 원래 열 \`[i*dk : (i+1)*dk]\`를 담당합니다.
2. \`merge_heads(Mh)\`: (h, T, dk) → (T, h·dk). \`split_heads\`의 역연산입니다.
3. \`causal_mask(T)\`: 자기보다 **뒤**(미래) 토큰 자리만 \`True\`인 (T, T) 불리언 행렬

\`reshape\`만으로 (h, T, dk)를 만들면 토큰과 헤드가 뒤섞입니다. 왜 \`transpose\`가 필요한지 테스트로 확인합니다.
`,
    starter: py`
import numpy as np

def split_heads(M, h):
    T, d = M.shape
    return M  # TODO: (T, h, dk)로 reshape한 뒤 (h, T, dk)로 축 순서를 바꿉니다.

def merge_heads(Mh):
    h, T, dk = Mh.shape
    return Mh  # TODO

def causal_mask(T):
    return np.zeros((T, T), dtype=bool)  # TODO: np.triu(..., k=1)

M = np.arange(12).reshape(3, 4)
print(split_heads(M, 2))
print(causal_mask(3).astype(int))
`,
    tests: py`
import numpy as np
M = np.arange(24).reshape(4, 6)

@test("split_heads: shape (h, T, dk), 헤드 i = 열 블록 i")
def _():
    S = split_heads(M, 3)
    assert np.shape(S) == (3, 4, 2), f"shape: {np.shape(S)}"
    assert approx(S[1], M[:, 2:4]) and approx(S[2], M[:, 4:6])

@test("merge_heads(split_heads(M)) == M")
def _():
    assert approx(merge_heads(split_heads(M, 2)), M) and approx(merge_heads(split_heads(M, 3)), M)

@test("causal_mask: 대각선 위만 True")
def _():
    assert causal_mask(3).tolist() == [[False, True, True], [False, False, True], [False, False, False]]

@test("마스크를 적용한 softmax: 첫 토큰은 자기 자신에만, 미래 가중치 0")
def _():
    S = np.random.default_rng(0).normal(size=(4, 4))
    S = np.where(causal_mask(4), -1e9, S)
    W = np.exp(S - S.max(axis=1, keepdims=True)); W /= W.sum(axis=1, keepdims=True)
    assert approx(W[0], [1, 0, 0, 0]) and approx(np.triu(W, 1), np.zeros((4, 4)))
`,
    hints: ["`M.reshape(T, h, d // h).transpose(1, 0, 2)`. reshape만 하면 (h, T, dk) 모양이어도 행이 토큰이 아니게 됩니다.", "합치기는 반대 순서: `Mh.transpose(1, 0, 2).reshape(T, h * dk)`", "`np.triu(np.ones((T, T), dtype=bool), k=1)`"],
    solution: py`
import numpy as np

def split_heads(M, h):
    T, d = M.shape
    return M.reshape(T, h, d // h).transpose(1, 0, 2)

def merge_heads(Mh):
    h, T, dk = Mh.shape
    return Mh.transpose(1, 0, 2).reshape(T, h * dk)

def causal_mask(T):
    return np.triu(np.ones((T, T), dtype=bool), k=1)

M = np.arange(12).reshape(3, 4)
print(split_heads(M, 2))
print(causal_mask(3).astype(int))
`,
  },
]);
