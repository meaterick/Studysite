import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "temperature·top-k·top-p·반복 페널티 구현",
    prompt: md`
1. \`softmax_T(logits, T)\`: $\mathrm{softmax}(z/T)$ (최댓값을 빼서 안정화)
2. \`top_k(p, k)\`: 확률이 큰 순서로 $k$개만 남기고 다시 정규화(동점은 고려하지 않아도 됨)
3. \`top_p(p, top_p)\`: 큰 순서로 누적합이 \`top_p\` 이상이 되는 **최소 개수**만 남기고 다시 정규화
4. \`repetition_penalty(logits, generated, penalty)\`: 이미 나온 토큰의 logit을 양수면 나누고 음수면 곱합니다.
`,
    starter: py`
import numpy as np

def softmax_T(logits, T=1.0):
    return np.ones_like(logits) / len(logits)  # TODO

def top_k(p, k):
    return p  # TODO

def top_p(p, top_p):
    return p  # TODO

def repetition_penalty(logits, generated, penalty=1.5):
    out = np.array(logits, dtype=float)
    # TODO
    return out

logits = np.array([3.0, 2.0, 1.0, 0.0, -1.0])
for T in (0.5, 1.0, 2.0):
    print(T, np.round(softmax_T(logits, T), 3))
print(top_p(np.array([0.9, 0.05, 0.03, 0.02]), 0.9))
`,
    tests: py`
import numpy as np
logits = np.array([3.0, 2.0, 1.0, 0.0, -1.0])

@test("T = 0.5 / 1 / 2에서 1등 확률 0.865 / 0.636 / 0.429")
def _():
    got = [softmax_T(logits, T)[0] for T in (0.5, 1.0, 2.0)]
    assert approx(got, [0.8647, 0.6364, 0.4287], 1e-3), f"결과: {np.round(got, 4)}"

@test("top-k: 상위 k개만 남기고 합 1")
def _():
    q = top_k(softmax_T(logits), 2)
    assert np.count_nonzero(q) == 2 and approx(q.sum(), 1.0) and q[0] > q[1] > 0

@test("top-p: [0.9, 0.05, 0.03, 0.02], p=0.9 → 1개 / p=0.97 → 3개")
def _():
    p = np.array([0.9, 0.05, 0.03, 0.02])
    assert np.count_nonzero(top_p(p, 0.9)) == 1 and np.count_nonzero(top_p(p, 0.97)) == 3
    assert approx(top_p(p, 0.97).sum(), 1.0)

@test("top-p는 원래 위치를 유지한다")
def _():
    q = top_p(np.array([0.1, 0.6, 0.3]), 0.85)
    assert approx(q, [0, 2 / 3, 1 / 3])

@test("반복 페널티: 양수 logit은 나누고 음수는 곱한다")
def _():
    out = repetition_penalty(np.array([2.0, -1.0, 0.5]), [0, 1, 1], 2.0)
    assert approx(out, [1.0, -2.0, 0.5]), f"결과: {out}"
`,
    hints: ["`z = (logits - logits.max()) / T`, `np.exp(z) / np.exp(z).sum()`", "top-k: `idx = np.argsort(-p)[:k]`, 새 배열에 그 자리만 복사해 정규화. top-p: `cut = np.searchsorted(np.cumsum(p[order]), top_p) + 1`로 남길 개수를 구합니다.", "반복 페널티는 `for t in set(generated): out[t] = out[t] / penalty if out[t] > 0 else out[t] * penalty`"],
    solution: py`
import numpy as np

def softmax_T(logits, T=1.0):
    z = (np.asarray(logits, dtype=float) - np.max(logits)) / T
    e = np.exp(z)
    return e / e.sum()

def top_k(p, k):
    q = np.zeros_like(p)
    idx = np.argsort(-p)[:k]
    q[idx] = p[idx]
    return q / q.sum()

def top_p(p, top_p):
    order = np.argsort(-p)
    cut = np.searchsorted(np.cumsum(p[order]), top_p) + 1
    q = np.zeros_like(p)
    q[order[:cut]] = p[order[:cut]]
    return q / q.sum()

def repetition_penalty(logits, generated, penalty=1.5):
    out = np.array(logits, dtype=float)
    for t in set(generated):
        out[t] = out[t] / penalty if out[t] > 0 else out[t] * penalty
    return out

logits = np.array([3.0, 2.0, 1.0, 0.0, -1.0])
for T in (0.5, 1.0, 2.0):
    print(T, np.round(softmax_T(logits, T), 3))
print(top_p(np.array([0.9, 0.05, 0.03, 0.02]), 0.9))
`,
  },
]);
