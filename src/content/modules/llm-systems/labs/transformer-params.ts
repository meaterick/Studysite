import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "GPT형 모델의 파라미터·연산량·메모리 계산기",
    prompt: md`

「Transformer의 크기 계산」 단계의 셈을 함수로 만듭니다. 모든 층에 편향이 있고, MLP는 $d \to 4d \to d$, LayerNorm은 블록당 두 개($\gamma, \beta$), 마지막 LayerNorm 하나, 출력층은 토큰 임베딩과 공유(weight tying)합니다.

1. \`block_params(d)\`: 블록 하나의 파라미터 수 (attention: $Q,K,V$ 투영 + $W^O$, 편향 포함 / MLP 편향 포함 / LayerNorm 두 개)
2. \`gpt_params(vocab, n_ctx, d, n_layers)\`: 토큰 임베딩 + 학습형 위치 임베딩 + 블록들 + 마지막 LayerNorm
3. \`train_flops(n_params, n_tokens)\` $\approx 6ND$
4. \`kv_cache_bytes(n_layers, d, n_ctx, batch=1, bytes_per=2)\` $= 2 \times L \times d \times n_{ctx} \times \text{batch} \times \text{bytes}$

GPT-2 small(\`50257, 1024, 768, 12\`)은 124,439,808개가 나와야 합니다.
`,
    starter: py`
def block_params(d):
    attn = 0  # TODO: d×3d + 3d + d×d + d
    mlp = 0   # TODO: d×4d + 4d + 4d×d + d
    ln = 0    # TODO: LayerNorm 두 개
    return attn + mlp + ln

def gpt_params(vocab, n_ctx, d, n_layers):
    return 0  # TODO

def train_flops(n_params, n_tokens):
    return 0  # TODO

def kv_cache_bytes(n_layers, d, n_ctx, batch=1, bytes_per=2):
    return 0  # TODO

print(f"{gpt_params(50257, 1024, 768, 12):,}")
`,
    tests: py`
@test("블록 하나: d=768 → 7,087,872개 (≈ 12d²)")
def _():
    assert block_params(768) == 7_087_872, f"결과: {block_params(768):,}"

@test("GPT-2 small = 124,439,808개")
def _():
    assert gpt_params(50257, 1024, 768, 12) == 124_439_808, f"결과: {gpt_params(50257, 1024, 768, 12):,}"

@test("큰 d에서는 블록 파라미터가 12d²에 수렴한다")
def _():
    d = 8192
    assert abs(block_params(d) / (12 * d * d) - 1) < 1e-3

@test("7B 모델, 1조 토큰 학습 ≈ 4.2e22 FLOPs")
def _():
    assert abs(train_flops(7e9, 1e12) - 4.2e22) < 1e19

@test("KV 캐시: 32층, d=4096, 문맥 4096, fp16 → 2 GiB")
def _():
    assert kv_cache_bytes(32, 4096, 4096) == 2 * 2**30, f"결과: {kv_cache_bytes(32, 4096, 4096):,}"
    assert kv_cache_bytes(32, 4096, 4096, batch=8) == 16 * 2**30
`,
    hints: ["attention은 `d * 3 * d + 3 * d + d * d + d`, MLP는 `d * 4 * d + 4 * d + 4 * d * d + d`, LayerNorm 두 개는 `2 * (2 * d)`입니다.", "`gpt_params`는 `vocab * d + n_ctx * d + n_layers * block_params(d) + 2 * d`입니다(마지막 LayerNorm의 두 파라미터 벡터).", "`train_flops`는 `6 * n_params * n_tokens`, KV 캐시는 `2 * n_layers * d * n_ctx * batch * bytes_per`입니다."],
    solution: py`
def block_params(d):
    attn = d * 3 * d + 3 * d + d * d + d
    mlp = d * 4 * d + 4 * d + 4 * d * d + d
    ln = 2 * (2 * d)
    return attn + mlp + ln

def gpt_params(vocab, n_ctx, d, n_layers):
    return vocab * d + n_ctx * d + n_layers * block_params(d) + 2 * d

def train_flops(n_params, n_tokens):
    return 6 * n_params * n_tokens

def kv_cache_bytes(n_layers, d, n_ctx, batch=1, bytes_per=2):
    return 2 * n_layers * d * n_ctx * batch * bytes_per

print(f"{gpt_params(50257, 1024, 768, 12):,}")
`,
  },
]);
