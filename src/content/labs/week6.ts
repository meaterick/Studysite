import type { WeekLab } from "../types";
import { py } from "./util";

// 6주차: 공짜 라벨·perplexity, CLM/MLM 마스크, 스케일링 법칙, LoRA·양자화, 탐색·Q-learning, DPO·KL 최적 정책, 디코딩 필터, 보정(ECE)
const TEXT = py`
text = ("나는 오늘 학교 에 갔다 . 나는 오늘 도서관 에 갔다 . 친구 는 오늘 학교 에 갔다 . "
        "나는 내일 도서관 에 간다 . 친구 는 내일 학교 에 간다 .").split()
`;

const TINY_LM = py`
lm = {
    "<s>":   {"나는": 0.6, "오늘": 0.4},
    "나는":   {"그냥": 0.55, "밥을": 0.45},
    "오늘":   {"밥을": 0.95, "그냥": 0.05},
    "그냥":   {"그냥": 0.5, "<eos>": 0.5},
    "밥을":   {"먹었다": 0.9, "<eos>": 0.1},
    "먹었다": {"<eos>": 1.0},
}
`;

const week6: WeekLab = {
  exercises: [
    {
      id: "w6-lab-perplexity",
      sectionId: "pretraining",
      title: "공짜 라벨 만들기와 bigram 모델의 perplexity",
      level: 2,
      prompt: `
1. \`make_pairs(tokens, k)\`: 원문을 한 칸 밀어 \`(직전 최대 k개 토큰 리스트, 다음 토큰)\` 쌍을 위치 1부터 끝까지 만듭니다. 사람이 붙인 라벨이 필요 없습니다.
2. \`bigram_prob(tokens, alpha)\`: 바로 앞 토큰을 보고 다음 토큰 확률을 주는 함수 \`prob(prev, nxt)\`를 돌려줍니다. 가산 스무딩: $\\dfrac{\\text{count}(prev, nxt) + \\alpha}{\\text{count}(prev) + \\alpha|V|}$
3. \`perplexity(tokens, prob)\`: $L = -\\frac{1}{T-1}\\sum_{t \\ge 1} \\ln P(x_t \\mid x_{t-1})$일 때 $e^L$

균등 모델의 perplexity는 어휘 크기와 같아야 합니다.
`,
      starter: TEXT + py`
import numpy as np
from collections import Counter, defaultdict

def make_pairs(tokens, k=3):
    return []  # TODO

def bigram_prob(tokens, alpha=0.1):
    V = len(set(tokens))
    counts = defaultdict(Counter)
    # TODO: 인접한 (앞, 뒤) 쌍을 셉니다.
    def prob(prev, nxt):
        c = counts[prev]
        return 1 / V  # TODO: 스무딩한 조건부 확률
    return prob

def perplexity(tokens, prob):
    return 0.0  # TODO

V = len(set(text))
print(len(make_pairs(text)), "개의 학습 예제")
print("균등:", perplexity(text, lambda a, b: 1 / V), " bigram:", perplexity(text, bigram_prob(text)))
`,
      tests: TEXT + py`
import numpy as np

@test("32토큰 원문 → 학습 예제 31개, 문맥은 최대 k개")
def _():
    pairs = make_pairs(text, 3)
    assert len(pairs) == 31, f"개수 {len(pairs)}"
    assert pairs[0] == (["나는"], "오늘") and pairs[3] == (["오늘", "학교", "에"], "갔다"), f"예: {pairs[0]}, {pairs[3]}"

@test("균등 모델의 perplexity = 어휘 크기(11)")
def _():
    V = len(set(text))
    assert approx(perplexity(text, lambda a, b: 1 / V), V)

@test("bigram(α=0.1) perplexity ≈ 1.98")
def _():
    assert approx(perplexity(text, bigram_prob(text, 0.1)), 1.98, tol=0.01), f"결과: {perplexity(text, bigram_prob(text, 0.1))}"

@test("스무딩 덕분에 본 적 없는 쌍도 확률이 0이 아니다")
def _():
    p = bigram_prob(text, 0.1)
    assert p("갔다", "친구") > 0 and p("친구", "갔다") > 0

@test("조건부 확률의 합 = 1")
def _():
    p = bigram_prob(text, 0.5)
    assert approx(sum(p("나는", w) for w in set(text)), 1.0)
`,
      hints: [
        "`[(tokens[max(0, t - k):t], tokens[t]) for t in range(1, len(tokens))]`",
        "`for a, b in zip(tokens, tokens[1:]): counts[a][b] += 1`, 확률은 `(c[nxt] + alpha) / (sum(c.values()) + alpha * V)`",
        "`logps = [np.log(prob(tokens[t - 1], tokens[t])) for t in range(1, len(tokens))]`, `np.exp(-np.mean(logps))`",
      ],
      solution: TEXT + py`
import numpy as np
from collections import Counter, defaultdict

def make_pairs(tokens, k=3):
    return [(tokens[max(0, t - k):t], tokens[t]) for t in range(1, len(tokens))]

def bigram_prob(tokens, alpha=0.1):
    V = len(set(tokens))
    counts = defaultdict(Counter)
    for a, b in zip(tokens, tokens[1:]):
        counts[a][b] += 1
    def prob(prev, nxt):
        c = counts[prev]
        return (c[nxt] + alpha) / (sum(c.values()) + alpha * V)
    return prob

def perplexity(tokens, prob):
    logps = [np.log(prob(tokens[t - 1], tokens[t])) for t in range(1, len(tokens))]
    return float(np.exp(-np.mean(logps)))

V = len(set(text))
print(len(make_pairs(text)), "개의 학습 예제")
print("균등:", perplexity(text, lambda a, b: 1 / V), " bigram:", perplexity(text, bigram_prob(text)))
`,
    },
    {
      id: "w6-lab-masks",
      sectionId: "architectures",
      title: "GPT(CLM)와 BERT(MLM)의 학습 문제와 attention 마스크",
      level: 1,
      prompt: `
같은 문장에서 두 목적함수가 만드는 학습 문제를 비교합니다.

1. \`clm_examples(tokens)\`: 위치 1부터 \`(" ".join(앞 토큰들), 다음 토큰)\` 리스트
2. \`mlm_input(tokens, positions)\`: 주어진 위치를 \`"[MASK]"\`로 바꾼 입력 리스트와, 그 위치의 정답 리스트
3. \`attention_mask(n, kind)\`: \`"encoder"\`면 모두 1(양방향), \`"decoder"\`면 자기 자신과 과거만 1인 정수 행렬
`,
      starter: py`
import numpy as np

def clm_examples(tokens):
    return []  # TODO

def mlm_input(tokens, positions):
    masked = list(tokens)  # TODO
    answers = []           # TODO
    return masked, answers

def attention_mask(n, kind):
    return np.zeros((n, n), dtype=int)  # TODO

tokens = "나는 어제 친구 와 맛있는 저녁 을 먹었다".split()
print(len(clm_examples(tokens)), mlm_input(tokens, [5]))
print(attention_mask(3, "decoder"))
`,
      tests: py`
import numpy as np
tokens = "나는 어제 친구 와 맛있는 저녁 을 먹었다".split()

@test("CLM: 8토큰 문장 → 예제 7개")
def _():
    ex = clm_examples(tokens)
    assert len(ex) == 7 and ex[2] == ("나는 어제 친구", "와"), f"예: {ex[2] if len(ex) > 2 else ex}"

@test("MLM: 가린 자리만 정답으로 쓴다")
def _():
    masked, answers = mlm_input(tokens, [1, 5])
    assert masked[1] == masked[5] == "[MASK]" and masked[0] == "나는" and answers == ["어제", "저녁"]
    assert tokens[1] == "어제", "원본 리스트를 바꾸면 안 됩니다."

@test("encoder 마스크: 64칸 모두 1, decoder: 하삼각 36칸")
def _():
    assert attention_mask(8, "encoder").sum() == 64 and attention_mask(8, "decoder").sum() == 36

@test("decoder의 3번째 토큰은 앞 세 토큰만 본다")
def _():
    m = attention_mask(8, "decoder")
    assert [tokens[j] for j in range(8) if m[2, j]] == ["나는", "어제", "친구"]
`,
      hints: [
        "`[(\" \".join(tokens[:t]), tokens[t]) for t in range(1, len(tokens))]`",
        "`masked = list(tokens)`로 복사한 뒤 `for i in positions: masked[i] = \"[MASK]\"`, 정답은 `[tokens[i] for i in positions]`",
        "`np.ones((n, n), dtype=int)`와 `np.tril(np.ones((n, n), dtype=int))`",
      ],
      solution: py`
import numpy as np

def clm_examples(tokens):
    return [(" ".join(tokens[:t]), tokens[t]) for t in range(1, len(tokens))]

def mlm_input(tokens, positions):
    masked = list(tokens)
    for i in positions:
        masked[i] = "[MASK]"
    answers = [tokens[i] for i in positions]
    return masked, answers

def attention_mask(n, kind):
    if kind == "encoder":
        return np.ones((n, n), dtype=int)
    return np.tril(np.ones((n, n), dtype=int))

tokens = "나는 어제 친구 와 맛있는 저녁 을 먹었다".split()
print(len(clm_examples(tokens)), mlm_input(tokens, [5]))
print(attention_mask(3, "decoder"))
`,
    },
    {
      id: "w6-lab-scaling",
      sectionId: "scaling-laws",
      title: "스케일링 법칙으로 컴퓨트 최적 모델 크기 찾기",
      level: 2,
      prompt: `
재추정한 Chinchilla 상수 $E = 1.82$, $A = 482.01$, $B = 2085.43$, $\\alpha = 0.3478$, $\\beta = 0.3658$으로 계산합니다.

1. \`loss(N, D)\` $= E + A/N^\\alpha + B/D^\\beta$ (배열에도 동작)
2. \`compute(N, D)\` $= 6ND$
3. \`best_N(C)\`: 컴퓨트 $C$를 고정하면 $D = C/(6N)$입니다. $N$을 $10^9$~$10^{12}$에서 로그 간격 3,000개로 바꿔 가며 손실이 가장 작은 $N$을 찾습니다.
4. \`rule_of_thumb(C, ratio=20)\`: $D = 20N$을 대입해 푼 $(N, D)$

$C = 10^{23}$에서 두 방법이 모두 약 29B 근처를 가리키는지 확인합니다.
`,
      starter: py`
import numpy as np

E, A, B, alpha, beta = 1.82, 482.01, 2085.43, 0.3478, 0.3658

def loss(N, D):
    return 0.0  # TODO

def compute(N, D):
    return 0.0  # TODO

def best_N(C):
    Ns = np.logspace(9, 12, 3000)
    return 0.0  # TODO: 손실이 가장 작은 N

def rule_of_thumb(C, ratio=20):
    N = 0.0  # TODO: C = 6 · N · ratio · N
    return N, ratio * N

print("Gopher", loss(280e9, 300e9), " Chinchilla", loss(70e9, 1.4e12))
print(f"best N ≈ {best_N(1e23) / 1e9:.1f}B, 규칙 N ≈ {rule_of_thumb(1e23)[0] / 1e9:.1f}B")
`,
      tests: py`
import numpy as np

@test("Chinchilla(70B, 1.4T) 손실 ≈ 1.977 < Gopher(280B, 300B) ≈ 2.002")
def _():
    g, c = loss(280e9, 300e9), loss(70e9, 1.4e12)
    assert approx(c, 1.977, tol=2e-3) and approx(g, 2.002, tol=2e-3) and c < g, f"Gopher {g:.4f}, Chinchilla {c:.4f}"

@test("7B × 1.4조 토큰 학습 컴퓨트 = 5.88e22")
def _():
    assert approx(compute(7e9, 1.4e12), 5.88e22, tol=1e-9 * 5.88e22)

@test("C = 1e23의 손실 최소 N ≈ 29B (25~33B)")
def _():
    n = best_N(1e23)
    assert 25e9 < n < 33e9, f"결과: {n / 1e9:.1f}B"

@test("규칙 D = 20N: C = 1e23 → N ≈ 28.9B, D = 20N")
def _():
    N, D = rule_of_thumb(1e23)
    assert approx(N, np.sqrt(1e23 / 120), tol=1e3) and approx(D, 20 * N)

@test("컴퓨트가 100배면 최적 N은 약 10배")
def _():
    assert approx(rule_of_thumb(1e25)[0] / rule_of_thumb(1e23)[0], 10.0)
`,
      hints: [
        "`E + A / N ** alpha + B / D ** beta`. N, D가 배열이어도 그대로 동작합니다.",
        "`best_N`은 `Ns[np.argmin(loss(Ns, C / (6 * Ns)))]`입니다.",
        "$C = 6 \\cdot N \\cdot 20N = 120N^2$이므로 `N = np.sqrt(C / (6 * ratio))`",
      ],
      solution: py`
import numpy as np

E, A, B, alpha, beta = 1.82, 482.01, 2085.43, 0.3478, 0.3658

def loss(N, D):
    return E + A / N ** alpha + B / D ** beta

def compute(N, D):
    return 6 * N * D

def best_N(C):
    Ns = np.logspace(9, 12, 3000)
    return float(Ns[np.argmin(loss(Ns, C / (6 * Ns)))])

def rule_of_thumb(C, ratio=20):
    N = np.sqrt(C / (6 * ratio))
    return N, ratio * N

print("Gopher", loss(280e9, 300e9), " Chinchilla", loss(70e9, 1.4e12))
print(f"best N ≈ {best_N(1e23) / 1e9:.1f}B, 규칙 N ≈ {rule_of_thumb(1e23)[0] / 1e9:.1f}B")
`,
    },
    {
      id: "w6-lab-lora-quant",
      sectionId: "finetuning-efficiency",
      title: "LoRA 저랭크 근사와 블록 단위 양자화",
      level: 2,
      prompt: `
1. \`lora_params(d, k, r)\`: $\\Delta W = BA$($B$: $d \\times r$, $A$: $r \\times k$)의 학습 파라미터 수
2. \`low_rank(dW, r)\`: SVD로 얻은 가장 좋은 랭크-$r$ 근사 $B A$를 돌려줍니다.
3. \`quantize(W, bits)\`: 대칭 양자화. $q_{max} = 2^{bits-1} - 1$, $\\text{scale} = \\max|W| / q_{max}$, 정수 $\\mathrm{clip}(\\mathrm{round}(W/\\text{scale}), -q_{max}, q_{max})$에 다시 scale을 곱한 **복원값**을 돌려줍니다.
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
      hints: [
        "LoRA는 `d * r + r * k`, 저랭크 근사는 `U, S, Vt = np.linalg.svd(dW)` 다음 `(U[:, :r] * S[:r]) @ Vt[:r]`",
        "`qmax = 2 ** (bits - 1) - 1`, `scale = np.abs(W).max() / qmax`, `np.clip(np.round(W / scale), -qmax, qmax) * scale`",
        "`np.concatenate([quantize(W[i:i + block], bits) for i in range(0, len(W), block)])`. 블록마다 최댓값이 작으면 scale도 작아져 더 촘촘히 표현됩니다.",
      ],
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
    {
      id: "w6-lab-qlearning",
      sectionId: "rl-basics",
      title: "점진적 평균과 벨만 방정식으로 Q값 배우기",
      level: 2,
      prompt: `
1. \`update_mean(est, n, r)\`: 지금까지 \`n\`번의 평균 \`est\`에 새 보상 \`r\`을 반영한 평균. 모든 보상을 저장하지 않고 $est + (r - est)/(n+1)$로 갱신합니다.
2. \`q_learning(n_states, gamma, lr, episodes, eps, seed)\`: 칸 0~(n−1) 복도에서 행동 0=왼쪽, 1=오른쪽. 오른쪽 끝에 닿으면 보상 1로 에피소드가 끝납니다. $\\varepsilon$-탐욕으로 행동을 고르고(두 Q값이 같으면 무작위) $Q(s,a) \\leftarrow Q(s,a) + \\eta\\,[r + \\gamma \\max_{a'} Q(s', a') - Q(s,a)]$로 갱신합니다(끝 상태의 미래 가치는 0). Q 테이블 (n_states, 2)를 돌려줍니다.

학습이 끝나면 오른쪽을 고를 때의 Q값이 $\\gamma^{\\text{남은 거리}-1}$과 같아야 합니다.
`,
      starter: py`
import numpy as np

def update_mean(est, n, r):
    return est  # TODO

def q_learning(n_states=5, gamma=0.9, lr=0.5, episodes=200, eps=0.3, seed=0):
    rng = np.random.default_rng(seed)
    Q = np.zeros((n_states, 2))
    for _ in range(episodes):
        s = 0
        while s != n_states - 1:
            explore = rng.random() < eps or Q[s, 0] == Q[s, 1]   # 동점이면 무작위로 고릅니다.
            a = int(rng.integers(2)) if explore else int(np.argmax(Q[s]))
            s2 = min(max(s + (1 if a == 1 else -1), 0), n_states - 1)
            r = 1.0 if s2 == n_states - 1 else 0.0
            # TODO: 벨만 목표값으로 Q[s, a]를 갱신합니다.
            s = s2
    return Q

print(update_mean(0.5, 2, 1.0))
print(np.round(q_learning()[:-1], 3))
`,
      tests: py`
import numpy as np

@test("점진적 평균 = 전체 평균")
def _():
    rs, est = [1, 0, 1, 1, 0, 1], 0.0
    for n, r in enumerate(rs):
        est = update_mean(est, n, r)
    assert approx(est, np.mean(rs)), f"결과: {est}"

@test("복도 5칸: 오른쪽 Q값 = [0.729, 0.81, 0.9, 1.0]")
def _():
    Q = q_learning()
    assert approx(Q[:-1, 1], [0.729, 0.81, 0.9, 1.0], 1e-3), f"결과: {np.round(Q[:-1, 1], 4)}"

@test("모든 칸에서 오른쪽(→)을 고른다")
def _():
    Q = q_learning(n_states=6, episodes=300)
    assert all(q[1] > q[0] for q in Q[:-1])

@test("γ = 0.5면 칸 0의 값이 0.125로 크게 할인된다")
def _():
    Q = q_learning(gamma=0.5, episodes=300)
    assert approx(Q[0, 1], 0.125, 1e-3), f"결과: {Q[0, 1]:.4f}"
`,
      hints: [
        "`est + (r - est) / (n + 1)`",
        "목표값은 `target = r + (0 if s2 == n_states - 1 else gamma * Q[s2].max())`",
        "`Q[s, a] += lr * (target - Q[s, a])`. 끝에서 받은 보상이 한 칸씩 $\\gamma$배로 할인되며 거꾸로 전파됩니다.",
      ],
      solution: py`
import numpy as np

def update_mean(est, n, r):
    return est + (r - est) / (n + 1)

def q_learning(n_states=5, gamma=0.9, lr=0.5, episodes=200, eps=0.3, seed=0):
    rng = np.random.default_rng(seed)
    Q = np.zeros((n_states, 2))
    for _ in range(episodes):
        s = 0
        while s != n_states - 1:
            explore = rng.random() < eps or Q[s, 0] == Q[s, 1]   # 동점이면 무작위로 고릅니다.
            a = int(rng.integers(2)) if explore else int(np.argmax(Q[s]))
            s2 = min(max(s + (1 if a == 1 else -1), 0), n_states - 1)
            r = 1.0 if s2 == n_states - 1 else 0.0
            target = r + (0 if s2 == n_states - 1 else gamma * Q[s2].max())
            Q[s, a] += lr * (target - Q[s, a])
            s = s2
    return Q

print(update_mean(0.5, 2, 1.0))
print(np.round(q_learning()[:-1], 3))
`,
    },
    {
      id: "w6-lab-dpo",
      sectionId: "rlhf-dpo",
      title: "DPO 손실과 KL 페널티 아래의 최적 정책",
      level: 2,
      prompt: `
1. \`dpo_loss(lw, lw_ref, ll, ll_ref, beta)\` $= -\\log\\sigma\\big(\\beta[(\\log\\pi_\\theta(y_w) - \\log\\pi_{ref}(y_w)) - (\\log\\pi_\\theta(y_l) - \\log\\pi_{ref}(y_l))]\\big)$
2. \`optimal_policy(pi_ref, r, beta)\`: $E[r] - \\beta\\,\\mathrm{KL}(\\pi \\parallel \\pi_{ref})$를 최대화하는 정책 $\\pi^*(y) \\propto \\pi_{ref}(y)\\,e^{r(y)/\\beta}$ (합이 1이 되도록 정규화)
3. \`kl(p, q)\` $= \\sum p \\log(p/q)$

본문 예제($\\beta = 0.1$, 로그확률 비율 차이 1.5)의 손실은 약 0.62입니다. $\\beta$가 작을수록 정책이 보상 1등 응답에 몰리고, 클수록 기준 모델 근처에 머무는지 확인합니다.
`,
      starter: py`
import numpy as np

def dpo_loss(lw, lw_ref, ll, ll_ref, beta=0.1):
    return 0.0  # TODO

def optimal_policy(pi_ref, r, beta):
    return pi_ref  # TODO

def kl(p, q):
    return 0.0  # TODO

print(dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1))
pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
r = np.array([1.75, 0.75, -0.25, -2.25])
for b in (0.1, 1.0, 5.0):
    p = optimal_policy(pi_ref, r, b)
    print(b, np.round(p, 3), round(float(kl(p, pi_ref)), 3))
`,
      tests: py`
import numpy as np
pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
r = np.array([1.75, 0.75, -0.25, -2.25])

@test("본문 예제: DPO 손실 ≈ 0.620")
def _():
    assert approx(dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1), -np.log(1 / (1 + np.exp(-0.15)))), f"결과: {dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1)}"

@test("비율 차이가 커질수록 손실이 줄고, 0이면 ln 2")
def _():
    assert approx(dpo_loss(0, 0, 0, 0, 0.1), np.log(2)) and dpo_loss(-1, -3, -3, -1, 0.1) < dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1)

@test("최적 정책은 확률분포이고, 보상 순서대로 확률이 커진다(β=1)")
def _():
    p = optimal_policy(pi_ref, r, 1.0)
    assert approx(p.sum(), 1.0) and p[0] > p[1] > p[2] > p[3]

@test("β가 작을수록 KL이 크고(1등에 몰림), 클수록 기준 모델에 가깝다")
def _():
    p_small, p_big = optimal_policy(pi_ref, r, 0.1), optimal_policy(pi_ref, r, 5.0)
    assert p_small[0] > 0.99 and kl(p_small, pi_ref) > 1.0 and kl(p_big, pi_ref) < 0.05, f"{np.round(p_small, 3)}, KL {kl(p_small, pi_ref):.3f} / {kl(p_big, pi_ref):.3f}"

@test("같은 분포의 KL = 0")
def _():
    assert approx(kl(pi_ref, pi_ref), 0.0)
`,
      hints: [
        "`z = beta * ((lw - lw_ref) - (ll - ll_ref))`, 손실은 `-np.log(1 / (1 + np.exp(-z)))`",
        "`p = pi_ref * np.exp(r / beta)`, `p / p.sum()`. $\\beta$가 작으면 지수가 커져 보상 차이가 극단적으로 증폭됩니다.",
        "`np.sum(p * np.log(p / q))`",
      ],
      solution: py`
import numpy as np

def dpo_loss(lw, lw_ref, ll, ll_ref, beta=0.1):
    z = beta * ((lw - lw_ref) - (ll - ll_ref))
    return float(-np.log(1 / (1 + np.exp(-z))))

def optimal_policy(pi_ref, r, beta):
    p = pi_ref * np.exp(r / beta)
    return p / p.sum()

def kl(p, q):
    return float(np.sum(p * np.log(p / q)))

print(dpo_loss(-2.0, -3.0, -2.5, -2.0, 0.1))
pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
r = np.array([1.75, 0.75, -0.25, -2.25])
for b in (0.1, 1.0, 5.0):
    p = optimal_policy(pi_ref, r, b)
    print(b, np.round(p, 3), round(float(kl(p, pi_ref)), 3))
`,
    },
    {
      id: "w6-lab-sampling",
      sectionId: "decoding",
      title: "temperature·top-k·top-p·반복 페널티 구현",
      level: 2,
      prompt: `
1. \`softmax_T(logits, T)\`: $\\mathrm{softmax}(z/T)$ (최댓값을 빼서 안정화)
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
      hints: [
        "`z = (logits - logits.max()) / T`, `np.exp(z) / np.exp(z).sum()`",
        "top-k: `idx = np.argsort(-p)[:k]`, 새 배열에 그 자리만 복사해 정규화. top-p: `cut = np.searchsorted(np.cumsum(p[order]), top_p) + 1`로 남길 개수를 구합니다.",
        "반복 페널티는 `for t in set(generated): out[t] = out[t] / penalty if out[t] > 0 else out[t] * penalty`",
      ],
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
    {
      id: "w6-lab-ece",
      sectionId: "hallucination",
      title: "말투의 확신과 실제 정답률: ECE 계산",
      level: 2,
      prompt: `
\`ece(conf, correct, n_bins, lo, hi)\`를 구현합니다. 확신도 구간 $[lo, hi)$을 \`n_bins\`개로 똑같이 나눈 뒤, 구간마다 $|\\text{평균 확신도} - \\text{실제 정답률}|$에 그 구간의 표본 비율을 곱해 더합니다(비어 있는 구간은 건너뜀). 마지막 구간은 $hi$를 포함합니다.

\`novel_rate(samples, facts)\`: 생성한 문장 중 학습 문장(\`facts\`)에 없는 문장의 비율

확신도대로 정답이 나오는 모델은 ECE가 0에 가깝고, 늘 실제보다 자신만만한 모델은 ECE가 커야 합니다.
`,
      starter: py`
import numpy as np

def ece(conf, correct, n_bins=5, lo=0.5, hi=1.0):
    conf, correct = np.asarray(conf, dtype=float), np.asarray(correct, dtype=float)
    edges = np.linspace(lo, hi, n_bins + 1)
    total = 0.0
    for i, (a, b) in enumerate(zip(edges, edges[1:])):
        pass  # TODO: 구간 마스크(마지막 구간은 b 포함), 비어 있으면 건너뛰기
    return total

def novel_rate(samples, facts):
    return 0.0  # TODO

rng = np.random.default_rng(0)
conf = rng.uniform(0.5, 1.0, 5000)
print("보정된 모델:", ece(conf, rng.random(5000) < conf))
print("과신하는 모델:", ece(conf, rng.random(5000) < (conf - 0.5) * 0.8 + 0.4))
`,
      tests: py`
import numpy as np

@test("손으로 계산한 예: 구간 2개")
def _():
    conf = [0.6, 0.6, 0.9, 0.9]
    correct = [1, 0, 1, 1]
    assert approx(ece(conf, correct, n_bins=2), 0.5 * abs(0.6 - 0.5) + 0.5 * abs(0.9 - 1.0))

@test("확신도 1.0도 마지막 구간에 들어간다")
def _():
    assert approx(ece([1.0, 1.0], [1, 0], n_bins=5), 0.5)

@test("보정된 모델은 ECE < 0.03, 과신하는 모델은 > 0.1")
def _():
    rng = np.random.default_rng(1)
    conf = rng.uniform(0.5, 1.0, 20000)
    good = ece(conf, rng.random(20000) < conf)
    bad = ece(conf, rng.random(20000) < (conf - 0.5) * 0.8 + 0.4)
    assert good < 0.03 and bad > 0.1, f"보정 {good:.3f}, 과신 {bad:.3f}"

@test("novel_rate: 학습 문장에 없는 생성의 비율")
def _():
    facts = {"서울 은 한국 의 수도 이다", "도쿄 는 일본 의 수도 이다"}
    samples = ["서울 은 한국 의 수도 이다", "서울 은 일본 의 수도 이다", "도쿄 는 일본 의 수도 이다", "도쿄 는 한국 의 수도 이다"]
    assert approx(novel_rate(samples, facts), 0.5)
`,
      hints: [
        "`m = (conf >= a) & ((conf < b) if i < n_bins - 1 else (conf <= b))`",
        "`if m.any(): total += m.mean() * abs(conf[m].mean() - correct[m].mean())`",
        "`sum(s not in facts for s in samples) / len(samples)`",
      ],
      solution: py`
import numpy as np

def ece(conf, correct, n_bins=5, lo=0.5, hi=1.0):
    conf, correct = np.asarray(conf, dtype=float), np.asarray(correct, dtype=float)
    edges = np.linspace(lo, hi, n_bins + 1)
    total = 0.0
    for i, (a, b) in enumerate(zip(edges, edges[1:])):
        m = (conf >= a) & ((conf < b) if i < n_bins - 1 else (conf <= b))
        if m.any():
            total += m.mean() * abs(conf[m].mean() - correct[m].mean())
    return float(total)

def novel_rate(samples, facts):
    return sum(s not in facts for s in samples) / len(samples)

rng = np.random.default_rng(0)
conf = rng.uniform(0.5, 1.0, 5000)
print("보정된 모델:", ece(conf, rng.random(5000) < conf))
print("과신하는 모델:", ece(conf, rng.random(5000) < (conf - 0.5) * 0.8 + 0.4))
`,
    },
  ],

  quiz: [
    {
      kind: "choice",
      id: "w6-drill-ppl-one",
      sectionId: "pretraining",
      question: "언어모델의 **검증** perplexity가 1.02로 나왔다. 가장 먼저 의심할 것은?",
      choices: [
        "매우 잘 일반화된 모델이다",
        "검증 문장이 학습 데이터에 섞여 있어 모델이 외운 것이다(데이터 오염)",
        "어휘가 너무 크다",
        "학습률이 너무 작다",
      ],
      answer: 1,
      explanation: "perplexity 1은 다음 토큰을 매번 100% 확신으로 맞힌다는 뜻이라 실제 언어에서는 거의 불가능합니다. 본문 실습에서도 학습에 쓴 문장으로 평가하면 숫자가 낙관적으로 나왔습니다. 검증·테스트 데이터가 학습 데이터에 섞였는지(오염)부터 확인해야 합니다.",
    },
    {
      kind: "choice",
      id: "w6-drill-fixed-compute",
      sectionId: "scaling-laws",
      question: "학습 컴퓨트 $C \\approx 6ND$를 고정한 채 모델 크기 $N$을 4배로 키우면 학습 토큰 수 $D$는?",
      choices: ["4배", "그대로", "1/4배", "2배"],
      answer: 2,
      explanation: "$ND$가 일정해야 하므로 $N$이 4배면 $D$는 1/4배입니다. 같은 예산을 큰 모델에 쓸지, 많은 데이터에 쓸지의 배분 문제가 스케일링 법칙의 핵심이고, Chinchilla는 $D \\approx 20N$ 근처가 손실을 가장 낮춘다고 보고했습니다.",
    },
    {
      kind: "choice",
      id: "w6-drill-lora-pct",
      sectionId: "finetuning-efficiency",
      question: "$d = k = 1024$인 가중치 행렬에 랭크 $r = 8$ LoRA를 붙이면 학습 파라미터는 원래 $\\Delta W$의 몇 %인가?",
      choices: ["약 1.56%", "약 0.78%", "약 12.5%", "약 50%"],
      answer: 0,
      explanation: "$B$는 $1024 \\times 8$, $A$는 $8 \\times 1024$로 합 16,384개이고, $\\Delta W$는 $1024^2 = 1{,}048{,}576$개입니다. 비율은 $16384 / 1048576 = 1/64 \\approx 1.56\\%$입니다.",
    },
    {
      kind: "choice",
      id: "w6-drill-dpo-data",
      sectionId: "rlhf-dpo",
      question: "DPO로 정렬 학습을 하려면 무엇이 필요한가?",
      choices: [
        "프롬프트와 모범 답안 쌍만",
        "프롬프트별 (선호 응답, 비선호 응답) 쌍과, 그 응답들에 대한 기준(SFT) 모델의 확률",
        "보상모델과 PPO 환경",
        "레이블 없는 원문 텍스트",
      ],
      answer: 1,
      explanation: "DPO는 별도의 보상모델과 강화학습 없이, 선호 쌍에서 학습 모델의 로그확률 비율을 기준 모델 대비 벌리는 손실을 직접 최소화합니다. 그래서 선호 데이터와 기준 모델의 로그확률이 필요합니다.",
    },
    {
      kind: "predict",
      id: "w6-drill-pairs",
      sectionId: "pretraining",
      code: py`
text = "나는 오늘 학교 에 갔다 .".split()
pairs = [(text[max(0, t - 2):t], text[t]) for t in range(1, len(text))]
print(len(pairs), pairs[2])
`,
      expected: "5 (['오늘', '학교'], '에')",
      explanation: "토큰 6개짜리 원문에서 위치 1~5마다 예제가 하나씩, 모두 5개가 라벨 없이 만들어집니다. `pairs[2]`는 위치 3의 예제로, 직전 두 토큰 `['오늘', '학교']`가 문맥이고 '에'가 정답입니다.",
    },
    {
      kind: "predict",
      id: "w6-drill-chinchilla",
      sectionId: "scaling-laws",
      code: py`
import math
C = 1e23
N = math.sqrt(C / (6 * 20))
print(f"{N:.2e} {20 * N:.2e}")
`,
      expected: "2.89e+10 5.77e+11",
      explanation: "$C = 6N \\cdot 20N = 120N^2$이므로 $N = \\sqrt{10^{23}/120} \\approx 2.89 \\times 10^{10}$(약 29B), $D = 20N \\approx 5.77 \\times 10^{11}$(약 5,800억 토큰)입니다.",
    },
    {
      kind: "predict",
      id: "w6-drill-temperature",
      sectionId: "decoding",
      code: py`
import numpy as np
logits = np.array([3.0, 2.0, 1.0, 0.0, -1.0])
for T in (0.5, 1.0, 2.0):
    p = np.exp(logits / T)
    p /= p.sum()
    print(T, round(float(p[0]), 3))
`,
      expected: "0.5 0.865\n1.0 0.636\n2.0 0.429",
      explanation: "logit 자체는 그대로이고 $T$로 나눈 뒤 softmax합니다. $T$가 작으면 격차가 커져 1등이 86.5%를 가져가고, $T = 2$면 격차가 줄어 42.9%로 분포가 평평해집니다.",
    },
    {
      kind: "predict",
      id: "w6-drill-incremental",
      sectionId: "rl-basics",
      code: py`
est, n = 0.0, 0
for r in [1, 0, 1, 1]:
    n += 1
    est += (r - est) / n
    print(round(est, 3))
`,
      expected: "1.0\n0.5\n0.667\n0.75",
      explanation: "점진적 평균 갱신은 보상을 모두 저장하지 않고도 지금까지의 평균과 정확히 같습니다: 1, (1+0)/2, 2/3, 3/4. 슬롯머신 실습의 `est[a] += (r - est[a]) / cnt[a]`가 이 식입니다.",
    },
    {
      kind: "descriptive",
      id: "w6-drill-bidirectional",
      sectionId: "architectures",
      question: "\"이 리뷰가 긍정인가?\" 같은 분류에는 BERT식 양방향 마스크가 유리하지만, 대화 생성에는 쓸 수 없는 이유를 attention 마스크와 학습 목적함수로 설명하십시오.",
      modelAnswer:
        "분류는 문장 전체가 이미 주어진 상태에서 판단하므로, 각 토큰이 앞뒤 문맥을 모두 보는 양방향 마스크가 정보를 가장 많이 씁니다(\"재미없지 않았다\"처럼 뒤를 봐야 뜻이 정해지는 경우). 생성은 왼쪽부터 한 토큰씩 만들어 가는 과정이라, 다음 토큰을 만들 시점에는 오른쪽 토큰이 아직 존재하지 않습니다. 학습할 때 미래를 보게 하면(양방향) 정답을 베끼는 법만 배우고 실제 생성 상황과 맞지 않습니다. 그래서 생성 모델은 자기와 과거만 보는 causal 마스크와 다음 토큰 예측(CLM)으로 학습하며, MLM은 가린 자리만 맞히는 목적이라 문장을 이어서 만드는 능력을 직접 학습하지 않습니다.",
      keyPoints: ["분류는 전체 문장이 주어져 양방향 문맥이 유리", "생성 시점에는 오른쪽 토큰이 존재하지 않는다", "학습 때 미래를 보면 베끼기만 배운다", "생성은 causal 마스크 + 다음 토큰 예측으로 학습"],
    },
    {
      kind: "descriptive",
      id: "w6-drill-reward-hacking",
      sectionId: "rlhf-dpo",
      question: "보상모델이 실수로 \"무례하고 틀림\" 응답에 가장 높은 점수를 줬다고 합시다. KL 페널티 계수(DPO의 $\\beta$)가 작을 때와 클 때 중 어느 쪽이 더 크게 피해를 보는지, 최적 정책 식 $\\pi^*(y) \\propto \\pi_{ref}(y) e^{r(y)/\\beta}$로 설명하십시오.",
      modelAnswer:
        "$\\beta$가 작으면 $e^{r/\\beta}$가 보상 차이를 극단적으로 증폭해, 정책이 보상 1등 응답에 거의 100% 몰립니다. 보상모델이 틀려 \"무례하고 틀림\"이 1등이 되면, 정책은 기준 모델이 겨우 10%만 주던 그 응답을 거의 항상 고르게 됩니다. 이것이 보상의 허점을 파고드는 보상 해킹입니다. $\\beta$가 크면 지수가 완만해 정책이 기준 모델 $\\pi_{ref}$ 근처에 머물러, 보상모델의 오류가 있어도 피해가 제한됩니다. KL 페널티는 보상모델을 완전히 믿지 않고 원래 모델에서 너무 멀어지지 않게 묶어 두는 안전장치이고, 대신 $\\beta$가 너무 크면 정렬 효과도 약해지는 트레이드오프가 있습니다.",
      keyPoints: ["작은 $\\beta$는 보상 차이를 지수적으로 증폭한다", "보상 1등(틀린 응답)에 정책이 몰린다 = 보상 해킹", "큰 $\\beta$는 기준 모델 근처에 머문다", "KL 페널티는 보상모델 오류에 대한 안전장치, 대신 정렬 효과가 약해진다"],
    },
    {
      kind: "descriptive",
      id: "w6-drill-bigram-hallucination",
      sectionId: "hallucination",
      question: "사실 문장만으로 학습한 bigram 모델이 \"파리 는 일본 의 수도 이다\"를 만든 이유를 설명하고, 반대로 학습 문장 전체를 통째로 외우는 모델을 쓰면 환각은 사라지지만 무엇을 잃는지 적으십시오.",
      modelAnswer:
        "bigram은 바로 앞 단어 하나만 보고 다음 단어를 고릅니다. '는' 다음에 '일본'이 올 확률, '의' 다음에 '수도'가 올 확률을 각각 배울 뿐, '파리'와 '프랑스'가 함께 나와야 한다는 긴 거리의 관계는 담을 수 없습니다. 그래서 학습 문장의 조각들을 그럴듯하게 이어 붙이면 문법적으로 완벽한 거짓이 만들어집니다. 문장 전체를 외우면 학습한 문장만 그대로 재생하므로 거짓은 사라지지만, 본 적 없는 새 문장을 만들거나 새로운 질문에 답하는 일반화 능력을 잃습니다. 실제 LLM은 그 사이에서 긴 문맥을 보며 패턴을 일반화하기 때문에 드물게 본 사실에서 비슷한 조합 오류가 생깁니다.",
      keyPoints: ["bigram은 바로 앞 단어 하나만 본다", "조각을 이어 붙여 문법적으로 완벽한 거짓을 만든다", "통째로 외우면 거짓은 없지만 새 문장을 못 만든다(일반화 상실)", "LLM은 일반화의 대가로 드문 사실에서 조합 오류가 생긴다"],
    },
  ],

  assignment: {
    requirements: [
      "temperature 3가지와 필터 5가지를 조합한 분포 표의 TODO(필터 적용)를 채우고, 행마다 확률 합이 1이며 남는 후보 수가 맞는지 확인한다.",
      "작은 언어모델로 설정별(Greedy · T=0.7 · T=1.5 + top-p 0.9) 생성을 반복해 distinct-2와 품질, 반복 사례를 기록한다.",
      "$C = 10^{22}$, $10^{24}$에서 Chinchilla 최적 $N$, $D$를 풀이와 함께 계산하고, 공개 모델 하나의 $D/N$을 근거로 과잉학습 여부를 논평한다.",
      "환각 사례 다섯 개를 유형별로 분류하고 유형에 맞는 완화책을 제안한다.",
      "InstructGPT 세 단계(SFT · 보상모델 · PPO)의 데이터 · 모델 · 목적함수를 정리한다.",
    ],
    autoTests: [
      {
        id: "w6-at-filter",
        taskId: "decoding",
        title: "필터를 실제로 적용했다(마지막 행: T=2.0, top-p 0.9)",
        code: py`
import numpy as np
assert abs(q.sum() - 1) < 1e-9, f"확률 합 {q.sum()}"
assert np.count_nonzero(q) < len(words), "마지막 행(top-p 0.9)에서 후보가 줄지 않았습니다. 필터를 적용했는지 확인하십시오."
p2 = softmax(logits, 2.0)
assert np.allclose(q, top_p_filter(p2, 0.9)), "마지막 행이 top_p_filter(softmax(logits, 2.0), 0.9)와 다릅니다."
`,
        hint: "반복문 안의 `q = p`를 `q = flt(p)`로 바꿉니다.",
      },
      {
        id: "w6-at-lm",
        taskId: "generate",
        title: "4-gram 언어모델의 출력이 확률분포(로그)이고 Greedy 생성이 결정적이다",
        code: py`
import numpy as np
lg = next_logits("신경망")
assert len(lg) == len(vocab) and abs(np.log(np.exp(lg).sum())) < 1e-6, "next_logits가 정규화된 로그 확률이 아닙니다."
a, b = generate("신경망은", length=10, greedy=True), generate("신경망은", length=10, greedy=True)
assert len(a) == 10 and a == b, "Greedy 생성이 같은 결과를 내지 않습니다."
`,
        hint: "첫 셀이 학습 자료(/course/*.md)를 읽었는지(말뭉치 크기 출력) 확인하십시오.",
      },
      {
        id: "w6-at-chinchilla",
        taskId: "scaling",
        title: "chinchilla_optimal: N = √(C/120), D = 20N",
        code: py`
import math
for C in (1e22, 1e24, 3.7e21):
    N, D = chinchilla_optimal(C)
    assert abs(N - math.sqrt(C / 120)) / math.sqrt(C / 120) < 1e-9 and abs(D - 20 * N) < 1e-6 * D, f"C={C:.1e}: N={N:.3e}, D={D:.3e}"
`,
      },
      {
        id: "w6-at-public",
        taskId: "scaling",
        title: "공개 모델의 N, D를 정했다",
        code: py`
assert N_pub > 0 and D_pub > 0 and isinstance(name, str) and name, "name, N_pub, D_pub을 정의하십시오."
`,
      },
    ],
    challenges: [
      {
        id: "w6-ch-beam",
        title: "빔 서치와 길이 정규화",
        level: 3,
        prompt: `
「디코딩 전략과 서빙」의 작은 언어모델 \`lm\`으로 디코딩을 구현합니다.

1. \`greedy(lm)\`: 매번 확률이 가장 큰 토큰을 고릅니다(최대 6토큰).
2. \`beam_search(lm, width, max_len=6, alpha=0.0)\`: 누적 로그확률 상위 \`width\`개 후보를 유지하며 확장하고, \`<eos>\`로 끝난 후보는 그대로 둡니다. 최종 선택 점수는 $\\dfrac{\\log P}{(\\text{생성 토큰 수})^{\\alpha}}$입니다(\`alpha=0\`이면 길이 정규화 없음).

두 함수 모두 \`(토큰 리스트(<s> 제외), 누적 로그확률)\`을 돌려줍니다. 그리디는 "나는 그냥 그냥…"에 갇히지만 빔(2)은 "오늘 밥을 먹었다"를 찾아야 합니다.
`,
        starter: TINY_LM + py`
import numpy as np

def greedy(lm, max_len=6):
    seq, logp = ["<s>"], 0.0
    for _ in range(max_len):
        if seq[-1] == "<eos>":
            break
        pass  # TODO: 확률이 가장 큰 다음 토큰을 붙이고 로그확률을 더합니다.
    return seq[1:], logp

def beam_search(lm, width=2, max_len=6, alpha=0.0):
    beams = [(["<s>"], 0.0)]
    for _ in range(max_len):
        cand = []
        for seq, lp in beams:
            pass  # TODO: <eos>로 끝났으면 그대로, 아니면 모든 다음 토큰으로 확장
        beams = sorted(cand, key=lambda x: -x[1])[:width]
    score = lambda b: b[1] / max(1, len(b[0]) - 1) ** alpha
    best = max(beams, key=score)
    return best[0][1:], best[1]

for name, (seq, lp) in [("greedy", greedy(lm)), ("beam(2)", beam_search(lm, 2))]:
    print(f"{name:8s} {' '.join(seq):22s} 전체 확률 = {np.exp(lp):.3f}")
`,
        tests: TINY_LM + py`
import numpy as np

@test("그리디는 '나는 그냥 그냥…'에 갇힌다(확률 ≈ 0.021)")
def _():
    seq, lp = greedy(lm)
    assert seq[:3] == ["나는", "그냥", "그냥"] and approx(np.exp(lp), 0.6 * 0.55 * 0.5 ** 4 if seq[-1] != "<eos>" else np.exp(lp), 1e-3), f"결과: {seq}, {np.exp(lp):.4f}"

@test("빔(2)은 '오늘 밥을 먹었다 <eos>'(확률 0.342)를 찾는다")
def _():
    seq, lp = beam_search(lm, 2)
    assert seq == ["오늘", "밥을", "먹었다", "<eos>"] and approx(np.exp(lp), 0.342), f"결과: {seq}, {np.exp(lp):.4f}"

@test("빔 너비 1은 그리디와 같은 첫 토큰들을 고른다")
def _():
    assert beam_search(lm, 1)[0][:3] == greedy(lm)[0][:3]

@test("<eos>로 끝난 후보는 더 확장하지 않는다")
def _():
    seq, _ = beam_search(lm, 3, max_len=10)
    assert seq.count("<eos>") == 1 and seq[-1] == "<eos>"
`,
        hints: [
          "그리디: `tok, p = max(lm[seq[-1]].items(), key=lambda kv: kv[1])` 다음 `seq.append(tok); logp += np.log(p)`",
          "빔 확장: `if seq[-1] == \"<eos>\": cand.append((seq, lp)); continue` 다음 `for tok, p in lm[seq[-1]].items(): cand.append((seq + [tok], lp + np.log(p)))`",
          "빔 서치는 매 단계 상위 width개를 남기므로, 첫 단계에서 덜 유망했던 '오늘'(0.4) 경로를 살려 둘 수 있습니다.",
        ],
        solution: TINY_LM + py`
import numpy as np

def greedy(lm, max_len=6):
    seq, logp = ["<s>"], 0.0
    for _ in range(max_len):
        if seq[-1] == "<eos>":
            break
        tok, p = max(lm[seq[-1]].items(), key=lambda kv: kv[1])
        seq.append(tok)
        logp += np.log(p)
    return seq[1:], logp

def beam_search(lm, width=2, max_len=6, alpha=0.0):
    beams = [(["<s>"], 0.0)]
    for _ in range(max_len):
        cand = []
        for seq, lp in beams:
            if seq[-1] == "<eos>":
                cand.append((seq, lp))
                continue
            for tok, p in lm[seq[-1]].items():
                cand.append((seq + [tok], lp + np.log(p)))
        beams = sorted(cand, key=lambda x: -x[1])[:width]
    score = lambda b: b[1] / max(1, len(b[0]) - 1) ** alpha
    best = max(beams, key=score)
    return best[0][1:], best[1]

for name, (seq, lp) in [("greedy", greedy(lm)), ("beam(2)", beam_search(lm, 2))]:
    print(f"{name:8s} {' '.join(seq):22s} 전체 확률 = {np.exp(lp):.3f}")
`,
      },
      {
        id: "w6-ch-dpo-train",
        title: "DPO 기울기를 유도하고 작은 정책을 직접 학습시키기",
        level: 3,
        prompt: `
응답 4개에 대한 정책을 logit $\\theta$로 두고($\\pi = \\mathrm{softmax}(\\theta)$) DPO로 학습합니다.

1. \`dpo_grad(z, beta)\`: $z$를 로그확률 비율의 차이라 할 때 손실 $-\\log\\sigma(\\beta z)$를 $\\log\\pi(y_w)$와 $\\log\\pi(y_l)$로 미분한 값 \`(g_w, g_l)\`. $g_w = -\\beta\\,\\sigma(-\\beta z)$, $g_l = -g_w$입니다.
2. \`train_dpo(pi_ref, pairs, beta, lr, steps)\`: 선호 쌍 \`(w, l)\`들의 평균 DPO 손실로 $\\theta$를 경사하강합니다. $\\partial \\log\\pi_i / \\partial\\theta = e_i - \\pi$(원핫 − 정책)를 쓰고, $\\theta$는 $\\log \\pi_{ref}$에서 시작합니다. 학습된 정책 $\\pi$를 돌려줍니다.

선호 데이터에는 사람 평가처럼 노이즈(25%는 반대 표시)가 섞여 있어 최적점이 유한합니다. 1등 응답의 확률이 커지고, $\\beta$가 클수록 기준 모델에서 덜 멀어지는지(KL이 작은지) 확인합니다.
`,
        starter: py`
import numpy as np

def softmax(t):
    e = np.exp(t - t.max())
    return e / e.sum()

def dpo_grad(z, beta):
    return 0.0, 0.0  # TODO

def train_dpo(pi_ref, pairs, beta=0.1, lr=1.0, steps=500):
    log_ref = np.log(pi_ref)
    theta = log_ref.copy()
    for _ in range(steps):
        pi = softmax(theta)
        logpi = np.log(pi)
        grad = np.zeros_like(theta)
        for w, l in pairs:
            z = (logpi[w] - log_ref[w]) - (logpi[l] - log_ref[l])
            g_w, g_l = dpo_grad(z, beta)
            # TODO: grad에 g_w * (e_w - pi) + g_l * (e_l - pi)를 더합니다.
        theta -= lr * grad / len(pairs)
    return softmax(theta)

pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
pairs = []
for i in range(4):
    for j in range(i + 1, 4):
        pairs += [(i, j)] * 3 + [(j, i)]   # 평가의 25%는 반대로 표시된 노이즈
print(np.round(train_dpo(pi_ref, pairs, beta=0.5), 3), np.round(train_dpo(pi_ref, pairs, beta=2.0), 3))
`,
        tests: py`
import numpy as np
pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
pairs = []
for i in range(4):
    for j in range(i + 1, 4):
        pairs += [(i, j)] * 3 + [(j, i)]   # 평가의 25%는 반대로 표시된 노이즈
kl = lambda p, q: float(np.sum(p * np.log(p / q)))

@test("dpo_grad가 수치미분과 일치한다")
def _():
    f = lambda z: -np.log(1 / (1 + np.exp(-0.5 * z)))
    g_w, g_l = dpo_grad(0.7, 0.5)
    num = (f(0.7 + 1e-6) - f(0.7 - 1e-6)) / 2e-6
    assert approx(g_w, num, 1e-6) and approx(g_l, -g_w)

@test("학습 후 확률 순서가 선호 순서(0 > 1 > 2 > 3)를 따른다")
def _():
    p = train_dpo(pi_ref, pairs, beta=0.5)
    assert approx(p.sum(), 1.0) and p[0] > p[1] > p[2] > p[3], f"결과: {np.round(p, 3)}"

@test("1등 응답 확률이 기준 모델(0.3)보다 커진다(β = 0.5에서 약 0.70)")
def _():
    p0 = train_dpo(pi_ref, pairs, beta=0.5)[0]
    assert approx(p0, 0.704, 0.01), f"결과: {p0:.3f}"

@test("β가 크면 기준 모델에서 덜 멀어진다(KL이 작다)")
def _():
    small = kl(train_dpo(pi_ref, pairs, beta=0.5), pi_ref)
    big = kl(train_dpo(pi_ref, pairs, beta=2.0), pi_ref)
    assert big < small / 5, f"KL: β=0.5 {small:.3f}, β=2.0 {big:.3f}"
`,
        hints: [
          "$\\frac{d}{dz}[-\\log\\sigma(\\beta z)] = -\\beta(1 - \\sigma(\\beta z)) = -\\beta\\sigma(-\\beta z)$. 코드로는 `g_w = -beta / (1 + np.exp(beta * z))`",
          "`e = np.eye(len(theta))`일 때 `grad += g_w * (e[w] - pi) + g_l * (e[l] - pi)`",
          "최적점에서는 암묵적 보상 $\\beta \\log(\\pi/\\pi_{ref})$이 선호 데이터에 맞춰지므로, $\\beta$가 클수록 같은 보상을 더 작은 $\\log(\\pi/\\pi_{ref})$로 표현해 기준 모델 근처에 머뭅니다.",
        ],
        solution: py`
import numpy as np

def softmax(t):
    e = np.exp(t - t.max())
    return e / e.sum()

def dpo_grad(z, beta):
    g_w = -beta / (1 + np.exp(beta * z))
    return g_w, -g_w

def train_dpo(pi_ref, pairs, beta=0.1, lr=1.0, steps=500):
    log_ref = np.log(pi_ref)
    theta = log_ref.copy()
    e = np.eye(len(theta))
    for _ in range(steps):
        pi = softmax(theta)
        logpi = np.log(pi)
        grad = np.zeros_like(theta)
        for w, l in pairs:
            z = (logpi[w] - log_ref[w]) - (logpi[l] - log_ref[l])
            g_w, g_l = dpo_grad(z, beta)
            grad += g_w * (e[w] - pi) + g_l * (e[l] - pi)
        theta -= lr * grad / len(pairs)
    return softmax(theta)

pi_ref = np.array([0.3, 0.3, 0.3, 0.1])
pairs = []
for i in range(4):
    for j in range(i + 1, 4):
        pairs += [(i, j)] * 3 + [(j, i)]   # 평가의 25%는 반대로 표시된 노이즈
print(np.round(train_dpo(pi_ref, pairs, beta=0.5), 3), np.round(train_dpo(pi_ref, pairs, beta=2.0), 3))
`,
      },
    ],
  },
};

export default week6;
