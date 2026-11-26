import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "응답 시간 계산과 블록 단위 양자화",
    prompt: md`
본문의 지연시간 계산과 양자화를 함수로 구현합니다.

1. \`response_time(ttft, n_tokens, tokens_per_sec)\`: 첫 토큰까지의 시간 \`ttft\`(초) 뒤에 초당 \`tokens_per_sec\`개씩 생성할 때, \`n_tokens\`개짜리 응답을 모두 받는 데 걸리는 시간(초)을 돌려줍니다.
2. \`quantize(W, bits)\`: 대칭 양자화입니다. $q_{max} = 2^{bits-1} - 1$, $\text{scale} = \max|W| / q_{max}$로 정하고, 정수 $\mathrm{clip}(\mathrm{round}(W/\text{scale}), -q_{max}, q_{max})$에 다시 scale을 곱한 **복원값**을 돌려줍니다.
3. \`quantize_blocks(W, bits, block)\`: 1차원 배열 \`W\`를 \`block\`개씩 나눠 블록마다 따로 \`quantize\`한 결과를 이어 붙여 돌려줍니다.
`,
    starter: py`
import numpy as np

def response_time(ttft, n_tokens, tokens_per_sec):
    return 0.0  # TODO

def quantize(W, bits):
    return W  # TODO

def quantize_blocks(W, bits, block=64):
    return W  # TODO: 블록마다 quantize를 적용해 np.concatenate로 잇습니다.

rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(0)
W = rng.normal(0, 0.02, 10000)
print("400토큰 응답:", response_time(0.5, 400, 40), "초")
print("INT8 오차:", rel(W, quantize(W, 8)), " INT4 오차:", rel(W, quantize(W, 4)), " INT4 블록 오차:", rel(W, quantize_blocks(W, 4)))
`,
    tests: py`
import numpy as np
rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(1)

@test("TTFT 0.5초, 초당 40토큰, 400토큰 → 10.5초")
def _():
    assert abs(response_time(0.5, 400, 40) - 10.5) < 1e-9 and abs(response_time(1.0, 0, 50) - 1.0) < 1e-9

@test("INT8 복원 오차는 2% 미만이고, INT2는 훨씬 크다")
def _():
    W = rng.normal(0, 0.02, 5000)
    assert rel(W, quantize(W, 8)) < 0.02 and rel(W, quantize(W, 2)) > 0.3

@test("INT4 복원값의 종류는 최대 15개(정수 −7~7)")
def _():
    W = rng.normal(0, 1, 5000)
    assert len(np.unique(np.round(quantize(W, 4) / (np.abs(W).max() / 7)))) <= 15

@test("블록 단위 양자화가 INT4 오차를 줄이고, 길이를 그대로 유지한다")
def _():
    W = rng.normal(0, 0.02, 10000)
    Q = quantize_blocks(W, 4, 64)
    assert np.shape(Q) == np.shape(W), f"모양: {np.shape(Q)}"
    assert rel(W, Q) < 0.8 * rel(W, quantize(W, 4))
`,
    hints: [
      "응답 시간은 `ttft + n_tokens / tokens_per_sec`입니다.",
      "`qmax = 2 ** (bits - 1) - 1`, `scale = np.abs(W).max() / qmax`, `np.clip(np.round(W / scale), -qmax, qmax) * scale`입니다.",
      "`np.concatenate([quantize(W[i:i + block], bits) for i in range(0, len(W), block)])`입니다. 블록의 최대 절댓값이 작으면 scale도 작아져 값을 더 촘촘한 간격으로 표현합니다.",
    ],
    solution: py`
import numpy as np

def response_time(ttft, n_tokens, tokens_per_sec):
    return ttft + n_tokens / tokens_per_sec

def quantize(W, bits):
    qmax = 2 ** (bits - 1) - 1
    scale = np.abs(W).max() / qmax
    return np.clip(np.round(W / scale), -qmax, qmax) * scale

def quantize_blocks(W, bits, block=64):
    return np.concatenate([quantize(W[i:i + block], bits) for i in range(0, len(W), block)])

rel = lambda a, b: np.linalg.norm(a - b) / np.linalg.norm(a)
rng = np.random.default_rng(0)
W = rng.normal(0, 0.02, 10000)
print("400토큰 응답:", response_time(0.5, 400, 40), "초")
print("INT8 오차:", rel(W, quantize(W, 8)), " INT4 오차:", rel(W, quantize(W, 4)), " INT4 블록 오차:", rel(W, quantize_blocks(W, 4)))
`,
  },
]);
