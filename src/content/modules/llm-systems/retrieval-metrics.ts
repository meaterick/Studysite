import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/retrieval-metrics";

export default defineLesson({
  id: "retrieval-metrics",
  title: "검색 품질 지표: Recall@k와 MRR",
  tier: "core",
  concepts: ["retrieval-rag-agents"],
  goal: "Recall@k와 MRR을 정의대로 계산하고, 두 지표가 각각 무엇(상위 k개에 포함되었는지, 순위가 얼마나 높은지)을 재는지와 검색이 맞았는데도 답이 틀릴 때 점검할 곳을 설명한다.",
  why: "RAG의 답이 틀렸을 때 검색의 문제인지 생성의 문제인지 구분하려면 검색 품질을 수치로 측정해야 한다. 청크 크기나 임베딩 모델을 바꿀 때 어느 설정이 나은지도 이 지표로 비교하며, 이 모듈의 과제에서 작성하는 평가 리포트에도 이 지표를 보고한다.",
  body: md`
### Recall@k

[[lesson:rag]]에서 검색 실패를 확인하는 지표로 쓴 **Recall@k**는 관련 문서 중 검색 결과의 상위 $k$개 안에 들어온 문서의 비율이다.

\`\`\`math
\text{Recall@}k = \dfrac{|\{\text{관련 문서}\} \cap \{\text{상위 } k\text{개 검색 결과}\}|}{|\{\text{관련 문서}\}|}
\`\`\`

Recall@k는 관련 문서가 상위 $k$개 안에 들어왔는지만 본다. 정답 문서가 1위로 나왔든 $k$위로 나왔든 분자에는 똑같이 1건으로 세므로 순위의 차이는 반영되지 않는다.

### MRR

RAG에서는 검색한 문서를 모두 프롬프트에 넣지 않는다. 프롬프트 길이에 제한이 있고 모델이 앞쪽에 놓인 근거를 더 잘 활용하므로, 보통 상위 몇 개만 골라 프롬프트 앞쪽에 배치한다. 그래서 정답이 상위 $k$개 안에 있었는지와 함께 그 안에서 몇 번째 순위였는지도 중요하다. 이 순위를 반영하는 지표가 **MRR**(Mean Reciprocal Rank, 평균 역순위)이다. 질문마다 정답 문서가 검색 결과에서 나온 순위의 역수(1/순위)를 구하고, 전체 질문에 대해 평균을 낸다. 정답이 검색 결과에 없는 질문은 0으로 센다.

\`\`\`math
\text{MRR} = \dfrac{1}{|Q|}\sum_{i=1}^{|Q|}\dfrac{1}{\text{rank}_i}
\`\`\`

여기서 $|Q|$는 질문의 개수이고, $\text{rank}_i$는 $i$번째 질문에서 정답 문서가 나온 순위다. 정답이 1위인 질문은 $1/1 = 1$을, 2위인 질문은 $1/2 = 0.5$를 더하며, 순위가 낮아질수록 더하는 값이 빠르게 줄어든다.

:::example 질문 3개의 MRR 손 계산
골든셋 질문 3개에서 정답 문서가 검색 결과의 다음 순위에 나왔다고 하자.

| 질문 | 정답 문서의 순위 | 역순위(1/rank) |
| --- | --- | --- |
| Q1 | 1위 | 1/1 = 1.000 |
| Q2 | 2위 | 1/2 = 0.500 |
| Q3 | 4위 | 1/4 = 0.250 |

MRR은 이 세 역순위의 평균이다.

\`\`\`math
\text{MRR} = \dfrac{1.000 + 0.500 + 0.250}{3} = \dfrac{1.750}{3} \approx 0.583
\`\`\`

세 질문 모두 정답이 1위였다면 $\text{MRR} = 1$이고, 모두 3위였다면 $\text{MRR} = 1/3 \approx 0.333$이다. 정답이 4위인 Q3은 1위일 때보다 0.75를 덜 더하므로, 순위가 낮은 질문 하나가 평균을 크게 낮춘다.
:::

### 두 지표를 함께 보는 이유

Recall@k는 관련 문서가 상위 $k$개 안에 포함되었는지를, MRR은 정답 문서의 순위가 얼마나 높은지를 잰다. 청킹이나 임베딩 모델을 바꿔 가며 실험할 때 Recall@5만 보면 정답이 5위에서 2위로 올라온 개선을 확인할 수 없다. 두 경우 모두 상위 5개 안에 포함되기 때문이다. MRR은 이 변화를 수치로 보여 준다. 그래서 실무에서는 두 지표를 함께 보고한다. Recall@k로 정답이 아예 검색되지 않는 질문의 비율을 확인하고, MRR로 정답이 검색되지만 순위가 낮은 질문이 얼마나 되는지 확인한다.

[[diagram:recall-mrr-ranks]]

Recall@k와 MRR은 문서를 관련 있음과 없음의 두 가지로만 나눈다. 실제로는 질문과 일부만 관련된 문서와 완전히 들어맞는 문서처럼 관련도에 등급이 있을 수 있다. 등급이 있는 관련도까지 반영해 순위를 평가하는 지표가 **nDCG**(normalized Discounted Cumulative Gain)다. 순위 $i$의 문서는 관련도에 $1/\log_2(i + 1)$을 곱해 더하고(DCG), 그 합을 가장 이상적인 순서로 정렬했을 때의 합으로 나눈다. 재순위화를 평가할 때 nDCG를 쓰는 방법은 [[lesson:ann-indexes]]에서 다룬다.

### 코드로 계산하기

아래 코드는 정답 순위 목록으로 Recall@k와 MRR을, 관련도 등급 목록으로 nDCG를 계산한다. 정답이 검색 결과에 없는 질문(None)은 Recall@k와 MRR에 모두 0으로 들어간다.

\`\`\`python
import math

ranks = [1, 2, 4, None]          # 질문 4개에서 정답 문서가 나온 순위 (None = 검색 결과에 없음)

def recall_at_k(ranks, k):
    return sum(r is not None and r <= k for r in ranks) / len(ranks)

def mrr(ranks):
    return sum(1 / r for r in ranks if r is not None) / len(ranks)

for k in [1, 3, 5]:
    print(f"Recall@{k} = {recall_at_k(ranks, k):.2f}")
print(f"MRR = {mrr(ranks):.4f}")

def ndcg(rels):                  # 검색 결과 순서대로 매긴 관련도 등급 (3 = 완벽, 0 = 무관)
    dcg = sum(r / math.log2(i + 2) for i, r in enumerate(rels))
    ideal = sum(r / math.log2(i + 2) for i, r in enumerate(sorted(rels, reverse=True)))
    return dcg / ideal

print(f"nDCG [3, 2, 0, 1] = {ndcg([3, 2, 0, 1]):.3f}")
print(f"nDCG [0, 1, 2, 3] = {ndcg([0, 1, 2, 3]):.3f}  (같은 문서, 거꾸로 정렬)")
\`\`\`

같은 순위 목록 [1, 2, 4, 없음]이라도 $k$를 1, 3, 5로 바꾸면 Recall@k가 0.25, 0.50, 0.75로 달라지므로, Recall@k는 항상 $k$와 함께 보고한다. 마지막 두 줄은 관련도가 [3, 2, 0, 1]인 같은 문서 네 개도 보여 주는 순서에 따라 nDCG가 0.985와 0.614로 달라지는 것을 보여 준다. 관련도가 높은 문서를 위에 둘수록 점수가 높다.

[[diagram:ndcg-order]]
`,
  checks: [
    {
      key: "c1",
      question: "질문 4개의 정답 순위가 [1, 2, 4, 없음]일 때 MRR은?",
      choices: ["$0.4375$", "$0.583$", "$0.75$", "$1.75$"],
      answer: 0,
      explanation: "$(1 + 1/2 + 1/4 + 0)/4 = 1.75/4 = 0.4375$다. 정답이 없는 질문도 분모에 포함되어 0을 더한다.",
    },
    {
      key: "c2",
      question: "정답 순위가 5등에서 2등으로 올라왔을 때 Recall@5와 MRR의 변화는?",
      choices: ["둘 다 오른다", "Recall@5는 그대로, MRR은 오른다", "Recall@5만 오른다", "둘 다 그대로다"],
      answer: 1,
      explanation: "Recall@k는 상위 $k$개 안에 들었는지만 보므로 그대로이고, MRR은 $1/5$에서 $1/2$로 오른다.",
    },
    {
      key: "c3",
      question: "Recall@k가 높은데도 최종 답이 틀린다면 다음으로 의심할 곳은?",
      choices: ["청크 크기", "생성 단계: 프롬프트 구성, 조각의 순서, 모델이 근거를 무시하거나 잘못 읽었는지", "임베딩 모델", "골든셋의 크기"],
      answer: 1,
      explanation: "검색은 정답 조각을 가져왔으므로 문제는 그 뒤의 생성 단계에 있다. 청크 크기와 임베딩 모델은 Recall@k가 낮을 때 먼저 바꾼다.",
    },
    {
      key: "c4",
      question: "질문 4개의 정답 순위가 [1, 2, 4, 없음]일 때 Recall@3은?",
      choices: ["0.50", "0.75", "0.25", "0.4375"],
      answer: 0,
      explanation: "3위 안에 정답이 든 질문은 순위 1과 2인 두 개뿐이라 $2/4 = 0.50$이다. 4위인 질문은 Recall@5에서야 포함된다.",
    },
    {
      key: "c5",
      question: "관련도가 [3, 2, 0, 1]인 문서 네 개를 이 순서로 보여 줄 때와 [0, 1, 2, 3] 순서로 보여 줄 때의 nDCG@4 비교로 옳은 것은?",
      choices: ["앞의 순서가 더 높다(약 0.985 대 0.614)", "두 순서가 같다", "뒤의 순서가 더 높다", "둘 다 1이다"],
      answer: 0,
      explanation: "nDCG는 상위 순위의 관련도에 더 큰 가중치를 준다. 가장 관련 있는 문서(3)를 1위에 둔 앞의 순서가 이상적인 정렬 [3, 2, 1, 0]에 훨씬 가깝다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
ranks = [1, 1, 3, None]          # None: 상위 결과 안에 정답 없음
mrr = sum(1 / r for r in ranks if r) / len(ranks)
recall3 = sum(1 for r in ranks if r and r <= 3) / len(ranks)
print(round(mrr, 3), recall3)
`,
      expected: "0.583 0.75",
      explanation: "MRR은 $(1 + 1 + 1/3 + 0) / 4 \\approx 0.583$이다. 정답을 찾지 못한 질문도 분모 4에 포함되어 0을 더한다. Recall@3은 순위가 3 이하인 질문 3개를 4로 나눈 0.75다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "Recall@k와 MRR이 각각 무엇을 재는지 쓰고, 두 시스템의 Recall@5가 똑같이 0.8인데 MRR이 다를 수 있는 예를 들어라. 실무에서 두 지표를 함께 보고하는 이유도 쓰라.",
      answer: md`
Recall@k는 관련 문서가 검색 결과의 상위 $k$개 안에 포함되었는지만 보는 지표로, 순위의 차이를 반영하지 않는다. MRR은 질문마다 정답 문서의 순위의 역수를 평균한 지표로, 정답이 얼마나 높은 순위에 있는지를 반영한다.

질문 10개 중 8개에서 정답이 상위 5개 안에 들어온 두 시스템은 Recall@5가 모두 0.8이다. 한 시스템은 그 8개에서 정답이 모두 1위이고 다른 시스템은 모두 5위라면, MRR은 각각 $8/10 = 0.8$과 $8 \times 0.2/10 = 0.16$으로 다르다. Recall@k로는 정답이 아예 검색되지 않는 질문의 비율을, MRR로는 정답이 검색되지만 순위가 낮은 질문을 확인할 수 있으므로 두 지표를 함께 보고한다.
`,
      keyPoints: [
        "Recall@k는 상위 k개 안에 포함되었는지만 보고 순위를 반영하지 않는다",
        "MRR은 정답 순위의 역수를 평균해 순위의 높고 낮음을 반영한다",
        "같은 Recall@5라도 정답이 1위인 시스템과 5위인 시스템의 MRR은 다르다",
        "Recall@k는 검색되지 않는 질문을, MRR은 순위가 낮은 질문을 확인한다",
      ],
    },
    {
      key: "d2",
      question: "질문 4개의 정답 순위가 [1, 1, 3, 없음]일 때 MRR과 Recall@3을 계산하라. Recall@k가 높은데도 최종 답이 틀린다면 무엇을 점검해야 하는지도 쓰라.",
      answer: md`
역순위는 $1, 1, 1/3, 0$이므로 $\text{MRR} = (1 + 1 + 1/3 + 0)/4 \approx 0.583$이다. 순위가 3 이하인 질문이 3개이므로 $\text{Recall@3} = 3/4 = 0.75$다.

Recall@k가 높다면 검색은 정답 조각을 가져온 것이므로 생성 단계를 점검한다. 프롬프트의 지시와 조각의 순서, 조각이 너무 많거나 관련 없는 조각이 섞여 있는지, 모델이 근거를 무시하거나 잘못 읽는지, 정답 형식이나 채점 방식에 문제가 없는지를 확인한다.
`,
      keyPoints: [
        "MRR은 정답이 없는 질문을 0으로 포함해 약 0.583이다",
        "Recall@3은 0.75다",
        "Recall@k가 높으면 검색이 아닌 생성 단계를 점검한다",
        "프롬프트 지시, 조각의 순서와 개수, 근거의 활용, 채점 방식을 확인한다",
      ],
    },
  ],
  references: [
    { title: "Weaviate — Evaluation Metrics for Search and Recommendation Systems", url: "https://weaviate.io/blog/retrieval-evaluation-metrics", note: "Recall, MRR, nDCG를 예제로 비교한 글(영문)" },
    { title: "Es et al. (2023) — RAGAS: Automated Evaluation of Retrieval Augmented Generation", url: "https://arxiv.org/abs/2309.15217", note: "검색과 생성을 나눠 평가하는 RAG 평가 지표(영문)" },
  ],
});
