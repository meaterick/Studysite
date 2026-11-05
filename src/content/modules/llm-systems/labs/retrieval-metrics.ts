import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "정답 순위로 Recall@k와 MRR 계산하기",
    prompt: md`
「검색 품질 지표」의 두 지표를 정답 순위 리스트 하나로 계산합니다.

1. \`rank_of(ranked, gold, top_n=None)\`: 검색 결과 순서 \`ranked\`(문서 번호 리스트)에서 정답 \`gold\`의 순위(1부터). 상위 \`top_n\`개 안에 없거나 아예 없으면 \`None\`.
2. \`recall_at_k(ranks, k)\`: 순위가 \`k\` 이하인 질문의 비율(\`None\`은 실패로 셉니다).
3. \`mrr(ranks)\`: $\text{MRR} = \dfrac{1}{|Q|}\sum_i \dfrac{1}{\text{rank}_i}$. \`None\`은 0으로 기여하지만 분모 $|Q|$에는 포함됩니다.
`,
    starter: py`
def rank_of(ranked, gold, top_n=None):
    return None  # TODO

def recall_at_k(ranks, k):
    return 0.0  # TODO

def mrr(ranks):
    return 0.0  # TODO

ranks = [1, 1, 3, None]
print(recall_at_k(ranks, 1), recall_at_k(ranks, 3), round(mrr(ranks), 3))
`,
    tests: py`
@test("rank_of: 순위와 top_n 밖의 None")
def _():
    assert rank_of([2, 0, 1], 1) == 3 and rank_of([2, 0, 1], 2) == 1, (rank_of([2, 0, 1], 1), rank_of([2, 0, 1], 2))
    assert rank_of([2, 0, 1], 1, top_n=2) is None and rank_of([2, 0], 5) is None

@test("[1, 1, 3, None]: R@1 = 0.5, R@3 = 0.75, MRR ≈ 0.583")
def _():
    r = [1, 1, 3, None]
    assert approx(recall_at_k(r, 1), 0.5) and approx(recall_at_k(r, 3), 0.75), (recall_at_k(r, 1), recall_at_k(r, 3))
    assert approx(mrr(r), (1 + 1 + 1 / 3) / 4), mrr(r)

@test("Recall@5가 같아도 MRR은 크게 다를 수 있다")
def _():
    a, b = [1, 1, 1, 5, None], [5, 5, 5, 1, None]
    assert approx(recall_at_k(a, 5), 0.8) and approx(recall_at_k(b, 5), 0.8), (recall_at_k(a, 5), recall_at_k(b, 5))
    assert approx(mrr(a), 0.64) and approx(mrr(b), 0.32), (mrr(a), mrr(b))

@test("k가 커지면 Recall@k는 줄지 않는다")
def _():
    r = [2, None, 1, 4, 3, 7]
    vals = [recall_at_k(r, k) for k in range(1, 8)]
    assert vals == sorted(vals) and approx(vals[-1], 5 / 6), vals
`,
    hints: ["`if gold not in ranked: return None`, `r = ranked.index(gold) + 1`, 그리고 `top_n`이 있고 `r > top_n`이면 `None`.", "`sum(1 for r in ranks if r is not None and r <= k) / len(ranks)`", "`sum(1 / r for r in ranks if r is not None) / len(ranks)`. 1등은 1, 2등은 0.5, 4등은 0.25로 순위가 밀릴수록 기여가 빠르게 줄어듭니다."],
    solution: py`
def rank_of(ranked, gold, top_n=None):
    if gold not in ranked:
        return None
    r = list(ranked).index(gold) + 1
    return None if top_n is not None and r > top_n else r

def recall_at_k(ranks, k):
    return sum(1 for r in ranks if r is not None and r <= k) / len(ranks)

def mrr(ranks):
    return sum(1 / r for r in ranks if r is not None) / len(ranks)

ranks = [1, 1, 3, None]
print(recall_at_k(ranks, 1), recall_at_k(ranks, 3), round(mrr(ranks), 3))
`,
  },
]);
