import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "학습용 정답 자동 생성과 바이그램 모델의 퍼플렉시티",
    prompt: md`
1. \`make_pairs(tokens, k)\`: 원문을 한 칸 밀어 \`(직전 최대 k개 토큰 리스트, 다음 토큰)\` 쌍을 위치 1부터 끝까지 만듭니다. 사람이 붙인 라벨이 필요 없습니다.
2. \`bigram_prob(tokens, alpha)\`: 바로 앞 토큰을 보고 다음 토큰 확률을 주는 함수 \`prob(prev, nxt)\`를 돌려줍니다. 가산 스무딩: $\dfrac{\text{count}(prev, nxt) + \alpha}{\text{count}(prev) + \alpha|V|}$
3. \`perplexity(tokens, prob)\`: $L = -\frac{1}{T-1}\sum_{t \ge 1} \ln P(x_t \mid x_{t-1})$일 때 $e^L$

균등 모델의 perplexity는 어휘 크기와 같아야 합니다.
`,
    starter: py`
text = ("나는 오늘 학교 에 갔다 . 나는 오늘 도서관 에 갔다 . 친구 는 오늘 학교 에 갔다 . "
        "나는 내일 도서관 에 간다 . 친구 는 내일 학교 에 간다 .").split()
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
    tests: py`
text = ("나는 오늘 학교 에 갔다 . 나는 오늘 도서관 에 갔다 . 친구 는 오늘 학교 에 갔다 . "
        "나는 내일 도서관 에 간다 . 친구 는 내일 학교 에 간다 .").split()
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
    hints: ["`[(tokens[max(0, t - k):t], tokens[t]) for t in range(1, len(tokens))]`", "`for a, b in zip(tokens, tokens[1:]): counts[a][b] += 1`, 확률은 `(c[nxt] + alpha) / (sum(c.values()) + alpha * V)`", "`logps = [np.log(prob(tokens[t - 1], tokens[t])) for t in range(1, len(tokens))]`, `np.exp(-np.mean(logps))`"],
    solution: py`
text = ("나는 오늘 학교 에 갔다 . 나는 오늘 도서관 에 갔다 . 친구 는 오늘 학교 에 갔다 . "
        "나는 내일 도서관 에 간다 . 친구 는 내일 학교 에 간다 .").split()
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
]);
