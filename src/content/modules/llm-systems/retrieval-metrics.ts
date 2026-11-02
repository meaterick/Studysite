import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/retrieval-metrics";

export default defineLesson({
  id: "retrieval-metrics",
  title: "검색 품질 지표: Recall@k와 MRR",
  tier: "core",
  concepts: ["retrieval-rag-agents"],
  goal: "Recall@k와 MRR을 정의대로 계산하고, 두 지표가 각각 무엇(도달 여부 vs 순위의 질)을 재는지, 검색이 맞았는데도 답이 틀릴 때 무엇을 의심할지 설명할 수 있다.",
  why: "",
  body: md`
앞 단계에서 잠깐 언급한 Recall@k부터 다시 정의하고 시작하자. 정답으로 인정할 수 있는 "관련 문서" 집합이 있고, 검색 시스템이 내놓은 "상위 k개 결과" 집합이 있을 때, 이 둘의 교집합이 관련 문서 전체 중 몇 퍼센트를 커버하는지가 Recall@k다.

\`\`\`math
\text{Recall@}k = \dfrac{|\{\text{관련 문서}\} \cap \{\text{상위 } k\text{개 검색 결과}\}|}{|\{\text{관련 문서}\}|}
\`\`\`

이 지표의 특징은 "상위 k개 안에 들어왔는가 아닌가"만 이분법적으로 따진다는 점이다. 즉 정답 문서가 상위 k개 중 1위로 반환되었든 k위로 간신히 포함되었든, Recall@k 계산식의 분자인 교집합에는 두 경우 모두 동일하게 1건으로 카운트되어 순위 차이가 전혀 반영되지 않는다.

그런데 RAG 파이프라인의 실제 사정을 떠올려보면 이 가정이 항상 맞지는 않는다. 실전에서는 검색된 문서를 모두 프롬프트에 넣지 않는다. 프롬프트 길이 제한도 있고, 모델이 앞쪽에 놓인 근거를 더 잘 챙겨 읽는 경향도 있어서, 보통 상위 몇 개, 심지어 단 하나만 골라 프롬프트 맨 위쪽에 배치한다. 이런 상황에서는 "정답이 상위 k개 안에 있었는가"보다 "정답이 그 안에서도 얼마나 위쪽 순위에 있었는가"가 훨씬 중요해진다. 이 순위 정보를 담아내는 지표가 MRR(Mean Reciprocal Rank, 평균 역순위)이다. 질문 하나마다 정답 문서가 검색 결과에서 몇 번째 순위(rank)로 나왔는지를 확인하고, 그 순위의 역수(1/순위)를 구한 뒤, 전체 질문에 대해 평균을 낸다.

\`\`\`math
\text{MRR} = \dfrac{1}{|Q|}\sum_{i=1}^{|Q|}\dfrac{1}{\text{rank}_i}
\`\`\`

여기서 $|Q|$는 전체 질문(쿼리)의 개수이고, $\text{rank}_i$는 $i$번째 질문에서 정답 문서가 나온 순위다. 정답이 항상 1등으로 나오는 질문은 $1/1=1$을 기여하고, 2등으로 나오면 $1/2=0.5$, 순위가 뒤로 밀릴수록 기여도는 빠르게 줄어든다.

:::example 예제: 질문 3개의 MRR 손으로 계산하기
골든셋 질문이 3개 있고, 각 질문에서 정답 문서가 검색 결과의 몇 번째 순위에 나왔는지가 다음과 같다고 하자.

| 질문 | 정답 문서의 순위 | 역순위(1/rank) |
| --- | --- | --- |
| Q1 | 1등 | 1/1 = 1.000 |
| Q2 | 2등 | 1/2 = 0.500 |
| Q3 | 4등 | 1/4 = 0.250 |

MRR은 이 세 역순위의 평균이다.

\`\`\`math
\text{MRR} = \dfrac{1.000 + 0.500 + 0.250}{3} = \dfrac{1.750}{3} \approx 0.583
\`\`\`

만약 세 질문 모두 정답이 1등으로 나왔다면 $\text{MRR} = (1+1+1)/3 = 1$로 만점이 나왔을 것이다. 반대로 세 질문 모두 정답이 3등으로만 나왔다면 $\text{MRR} = (1/3+1/3+1/3)/3 = 1/3 \approx 0.333$에 그친다. Q3처럼 정답이 4등까지 밀려나면 그 질문 하나가 전체 평균을 끌어내리는 정도가, 2등으로 밀렸을 때보다 훨씬 크다는 것도 위 표에서 확인할 수 있다.
:::

Recall@k와 MRR을 나란히 놓고 보면 둘의 역할 분담이 뚜렷해진다. Recall@k는 "관련 문서를 상위 k개 안에 데려오기는 했는가"라는 도달 여부를 재는 지표이고, MRR은 "데려온 문서가 얼마나 위쪽 순위에 있었는가"라는 순위의 질을 재는 지표다. 청킹이나 임베딩 모델을 바꿔가며 실험할 때, Recall@k만 보고 있으면 "정답이 5등에서 2등으로 올라온" 개선을 전혀 감지하지 못한다. 두 경우 모두 k=5 기준으로는 똑같이 "포함됨"이기 때문이다. 반면 MRR은 이 변화를 곧바로 숫자로 드러내준다. 그래서 실무에서는 두 지표를 함께 보고하는 것이 일반적이다: Recall@k로 "애초에 검색이 안 되는 질문이 얼마나 있는가"를 걸러내고, MRR로 "검색은 되는데 순위가 애매한 질문이 얼마나 있는가"를 따로 잡아낸다.

[[diagram:recall-mrr-ranks]]

한 가지만 더 짚고 넘어가자. Recall@k와 MRR은 문서를 "관련 있음/없음"의 둘 중 하나로만 나누는데, 실제로는 "이 문서는 질문에 조금 관련 있음", "이 문서는 질문에 완벽하게 들어맞음"처럼 관련도에도 여러 등급이 있을 수 있다. 이렇게 등급이 있는 관련도까지 반영해 순위의 품질을 매기는 더 정교한 지표가 nDCG(normalized Discounted Cumulative Gain)다. 핵심 과정에서는 이름과 쓰임새만 알아 두면 충분하고, 재순위화 단계를 평가할 때 nDCG를 어떻게 쓰는지는 보충 과정의 「실전 벡터 검색」 단계에서 계산해 본다.

### 코드로 계산하기

정답 순위 목록만 있으면 Recall@k와 MRR은 몇 줄로 계산된다. 정답이 검색 결과에 아예 없는 질문(None)은 Recall에도 MRR에도 0으로 들어간다. nDCG는 관련도 등급 목록으로 계산한다.

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

같은 순위 목록 [1, 2, 4, 없음]이라도 $k$를 1, 3, 5로 바꾸면 Recall@k가 0.25, 0.50, 0.75로 달라진다. 그래서 Recall@k는 항상 $k$와 함께 보고한다. 아래 두 줄은 관련도 [3, 2, 0, 1]인 같은 문서 네 개를 어떤 순서로 보여 줬느냐에 따라 nDCG가 0.985와 0.614로 갈리는 모습이다. 가장 관련 있는 문서를 위로 올릴수록 점수가 높다.

[[diagram:ndcg-order]]
`,
  checks: [
    {
      key: "c1",
      question: "질문 4개의 정답 순위가 [1, 2, 4, 없음]일 때 MRR은?",
      choices: ["$0.4375$", "$0.583$", "$0.75$", "$1.75$"],
      answer: 0,
      explanation: "$(1 + 1/2 + 1/4 + 0)/4 = 1.75/4 = 0.4375$.",
    },
    {
      key: "c2",
      question: "정답 순위가 5등에서 2등으로 올라왔을 때 Recall@5와 MRR의 변화는?",
      choices: ["둘 다 오른다", "Recall@5는 그대로, MRR은 오른다", "Recall@5만 오른다", "둘 다 그대로다"],
      answer: 1,
      explanation: "Recall@k는 k 안에 들었는지만 본다. 순위 개선은 MRR이 잡아낸다.",
    },
    {
      key: "c3",
      question: "Recall@k가 높은데도 최종 답이 틀린다면 다음으로 의심할 곳은?",
      choices: ["청크 크기", "생성 단계: 프롬프트 구성·조각 순서·모델이 근거를 무시하거나 오독했는지", "임베딩 모델", "골든셋의 크기"],
      answer: 1,
      explanation: "검색은 정답 조각을 가져왔으니 문제는 그 뒤에 있다.",
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
      explanation: "MRR은 $(1 + 1 + 1/3 + 0) / 4 \\approx 0.583$입니다. 정답을 찾지 못한 질문도 분모 4에 포함되어 0을 기여합니다. Recall@3은 순위 3 이하인 질문 3개 / 4 = 0.75입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "Recall@k가 높은데 최종 답이 틀리는 경우, 다음에 의심할 곳은?",
      answer: md`
생성 단계를 의심한다. 프롬프트 구성(청크 순서·지시), 너무 많거나 잡음이 섞인 컨텍스트, 생성 모델이 근거를 충실히 따르는지, 정답 형식이나 채점 방식의 문제를 차례로 확인한다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "Recall@k와 MRR은 각각 무엇을 재는 지표인가? 두 시스템의 Recall@5가 똑같이 0.8인데 MRR은 서로 다를 수 있는 이유를 예를 들어 설명하라.",
      answer: md`
Recall@k는 '정답이 상위 k개 안에 들어왔는가'만 보는 이진 지표라 순위를 무시하지만, MRR은 '얼마나 상위에 있었는가'까지 반영한다. 두 시스템 모두 Recall@5=0.8이어도, 한쪽은 정답이 항상 1등, 다른 쪽은 매번 5등으로 겨우 들어온다면 MRR은 전자가 훨씬 높다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "질문 4개의 정답 순위가 [1, 1, 3, None](None은 top_n 안에 정답 없음)일 때 MRR을 손으로 계산하라.",
      answer: md`
역수는 $1, 1, 1/3, 0$(정답 없음)이다. $\text{MRR} = (1+1+1/3+0)/4 = 2.333/4 \approx 0.583$.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Weaviate — Evaluation Metrics for Search and Recommendation Systems", url: "https://weaviate.io/blog/retrieval-evaluation-metrics", note: "Recall·MRR·nDCG를 예제로 비교 (영문)" },
    { title: "Es et al. (2023) — RAGAS: Automated Evaluation of Retrieval Augmented Generation", url: "https://arxiv.org/abs/2309.15217", note: "검색·생성을 나눠 평가하는 지표 모음 (과제 3번 심화)" },
  ],
});
