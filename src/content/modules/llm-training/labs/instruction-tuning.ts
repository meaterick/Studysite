import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "LoRA의 파라미터 수와 낮은 랭크 근사",
    prompt: md`
LoRA와 전체 미세조정의 비용을 계산하는 함수를 구현합니다.

1. \`lora_params(d, k, r)\`: $\Delta W = BA$($B$: $d \times r$, $A$: $r \times k$)의 학습 파라미터 수
2. \`low_rank(dW, r)\`: SVD $\Delta W = U S V^\top$로 얻은 가장 좋은 랭크-$r$ 근사 $U_r S_r V_r^\top$를 돌려줍니다.
3. \`full_finetune_gb(n_params, bytes_per_param=16)\`: Adam으로 전체 미세조정할 때 가중치·기울기·옵티마이저 상태에 필요한 메모리(GB, $10^9$바이트)
`,
    starter: py`
import numpy as np

def lora_params(d, k, r):
    return 0  # TODO

def low_rank(dW, r):
    return np.zeros_like(dW)  # TODO: U, S, Vt = np.linalg.svd(dW, full_matrices=False)

def full_finetune_gb(n_params, bytes_per_param=16):
    return 0.0  # TODO

rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(0)
dW = rng.normal(size=(64, 4)) @ rng.normal(size=(4, 48))     # 랭크 4인 변화량
print("LoRA(4096, 4096, 16):", lora_params(4096, 4096, 16))
print("r=2 오차:", rel(dW, low_rank(dW, 2)), " r=4 오차:", rel(dW, low_rank(dW, 4)))
print("70B 전체 미세조정:", full_finetune_gb(70e9), "GB")
`,
    tests: py`
import numpy as np
rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(1)

@test("LoRA d=k=4096, r=16 → 131,072개 (원래의 1/128)")
def _():
    assert lora_params(4096, 4096, 16) == 131072 and 4096 * 4096 // lora_params(4096, 4096, 16) == 128

@test("랭크 4인 변화량은 r=4 근사로 거의 완전히 복원되고, r=2로는 복원되지 않는다")
def _():
    dW = rng.normal(size=(64, 4)) @ rng.normal(size=(4, 48))
    assert rel(dW, low_rank(dW, 4)) < 1e-8 and rel(dW, low_rank(dW, 2)) > 0.1

@test("근사의 랭크는 r 이하이고, r이 클수록 오차가 줄어든다")
def _():
    M = rng.normal(size=(40, 30))
    assert np.linalg.matrix_rank(low_rank(M, 3)) <= 3
    assert rel(M, low_rank(M, 10)) < rel(M, low_rank(M, 3)) < rel(M, low_rank(M, 1))

@test("70B 모델의 전체 미세조정 메모리는 약 1,120GB")
def _():
    assert abs(full_finetune_gb(70e9) - 1120) < 1e-6 and abs(full_finetune_gb(7e9, 2) - 14) < 1e-6
`,
    hints: [
      "LoRA의 파라미터 수는 `d * r + r * k`입니다.",
      "`U, S, Vt = np.linalg.svd(dW, full_matrices=False)` 다음 `(U[:, :r] * S[:r]) @ Vt[:r]`가 랭크-r 근사입니다.",
      "메모리는 `n_params * bytes_per_param / 1e9`입니다.",
    ],
    solution: py`
import numpy as np

def lora_params(d, k, r):
    return d * r + r * k

def low_rank(dW, r):
    U, S, Vt = np.linalg.svd(dW, full_matrices=False)
    return (U[:, :r] * S[:r]) @ Vt[:r]

def full_finetune_gb(n_params, bytes_per_param=16):
    return n_params * bytes_per_param / 1e9

rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(0)
dW = rng.normal(size=(64, 4)) @ rng.normal(size=(4, 48))
print("LoRA(4096, 4096, 16):", lora_params(4096, 4096, 16))
print("r=2 오차:", rel(dW, low_rank(dW, 2)), " r=4 오차:", rel(dW, low_rank(dW, 4)))
print("70B 전체 미세조정:", full_finetune_gb(70e9), "GB")
`,
  },
]);
