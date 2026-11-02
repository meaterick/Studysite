import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "LoRA 저랭크 근사와 블록 단위 양자화",
    prompt: md`

1. \`lora_params(d, k, r)\`: $\Delta W = BA$($B$: $d \times r$, $A$: $r \times k$)의 학습 파라미터 수
2. \`low_rank(dW, r)\`: SVD로 얻은 가장 좋은 랭크-$r$ 근사 $B A$를 돌려줍니다.
3. \`quantize(W, bits)\`: 대칭 양자화. $q_{max} = 2^{bits-1} - 1$, $\text{scale} = \max|W| / q_{max}$, 정수 $\mathrm{clip}(\mathrm{round}(W/\text{scale}), -q_{max}, q_{max})$에 다시 scale을 곱한 **복원값**을 돌려줍니다.
4. \`quantize_blocks(W, bits, block)\`: 1차원 \`W\`를 \`block\`개씩 나눠 블록마다 따로 \`quantize\`합니다(QLoRA 방식의 핵심 아이디어).
`,
    starter: py`
import numpy as np

def lora_params(d, k, r):
    return 0  # TODO

def low_rank(dW, r):
    return np.zeros_like(dW)  # TODO

def quantize(W, bits):
    return W  # TODO

def quantize_blocks(W, bits, block=64):
    return W  # TODO

rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(0)
W = rng.normal(0, 0.02, 10000)
print("LoRA(4096, 4096, 16):", lora_params(4096, 4096, 16))
print("INT4 전체:", rel(W, quantize(W, 4)), " INT4 블록:", rel(W, quantize_blocks(W, 4)))
`,
    tests: py`
import numpy as np
rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(1)

@test("LoRA d=k=4096, r=16 → 131,072개 (원래의 1/128)")
def _():
    assert lora_params(4096, 4096, 16) == 131072 and 4096 * 4096 // lora_params(4096, 4096, 16) == 128

@test("랭크 4인 변화량은 r=4 근사로 거의 완벽히 복원된다")
def _():
    dW = rng.normal(size=(64, 4)) @ rng.normal(size=(4, 48))
    assert rel(dW, low_rank(dW, 4)) < 1e-8 and rel(dW, low_rank(dW, 2)) > 0.1

@test("INT8 복원 오차 2% 미만, INT2는 훨씬 크다")
def _():
    W = rng.normal(0, 0.02, 5000)
    assert rel(W, quantize(W, 8)) < 0.02 and rel(W, quantize(W, 2)) > 0.3

@test("양자화 값의 종류는 최대 2·q_max + 1개")
def _():
    W = rng.normal(0, 1, 5000)
    assert len(np.unique(np.round(quantize(W, 4) / (np.abs(W).max() / 7)))) <= 15

@test("블록 단위 양자화가 INT4 오차를 줄인다")
def _():
    W = rng.normal(0, 0.02, 10000)
    assert rel(W, quantize_blocks(W, 4, 64)) < 0.8 * rel(W, quantize(W, 4))
`,
    hints: ["LoRA는 `d * r + r * k`, 저랭크 근사는 `U, S, Vt = np.linalg.svd(dW)` 다음 `(U[:, :r] * S[:r]) @ Vt[:r]`", "`qmax = 2 ** (bits - 1) - 1`, `scale = np.abs(W).max() / qmax`, `np.clip(np.round(W / scale), -qmax, qmax) * scale`", "`np.concatenate([quantize(W[i:i + block], bits) for i in range(0, len(W), block)])`. 블록마다 최댓값이 작으면 scale도 작아져 더 촘촘히 표현됩니다."],
    solution: py`
import numpy as np

def lora_params(d, k, r):
    return d * r + r * k

def low_rank(dW, r):
    U, S, Vt = np.linalg.svd(dW, full_matrices=False)
    return (U[:, :r] * S[:r]) @ Vt[:r]

def quantize(W, bits):
    qmax = 2 ** (bits - 1) - 1
    scale = np.abs(W).max() / qmax
    return np.clip(np.round(W / scale), -qmax, qmax) * scale

def quantize_blocks(W, bits, block=64):
    return np.concatenate([quantize(W[i:i + block], bits) for i in range(0, len(W), block)])

rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(0)
W = rng.normal(0, 0.02, 10000)
print("LoRA(4096, 4096, 16):", lora_params(4096, 4096, 16))
print("INT4 전체:", rel(W, quantize(W, 4)), " INT4 블록:", rel(W, quantize_blocks(W, 4)))
`,
  },
]);
