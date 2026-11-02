import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/retrieval";

export default defineLesson({
  id: "retrieval",
  title: "임베딩과 벡터 검색",
  tier: "core",
  concepts: ["retrieval-rag-agents"],
  goal: "임베딩 기반 Dense 검색과 BM25 Sparse 검색의 매칭 기준·강약점을 비교하고, 전수 비교가 대규모에서 막히는 이유와 ANN·벡터 DB의 역할, RRF가 점수 대신 순위로 두 검색기를 합치는 원리를 설명할 수 있다.",
  why: "",
  body: md`
1주차에서 벡터의 내적과 코사인 유사도를 계산법으로만 배웠다면, 이번 주에는 그 계산이 실전에서 무엇을 위해 쓰이는지를 볼 차례다. 임베딩 모델은 문장이나 문서 하나를 고정된 차원(보통 수백~수천 차원)의 실수 벡터로 사상(mapping)하는데, 이 모델은 대조 학습(contrastive learning) 등을 통해 의미적으로 유사한 텍스트일수록 벡터 공간에서 서로 가까운 방향(코사인 유사도가 높은 방향)을 갖도록 미리 학습되어 있다. 예를 들어 "경사하강법"을 설명하는 문장의 임베딩 벡터는 "최적화 이론"을 설명하는 문장의 벡터와 방향이 비슷하고, 의미상 전혀 무관한 "조선왕조실록"을 설명하는 문장의 벡터와는 방향이 크게 벌어진다. 그 결과 "이 질문과 의미가 가장 가까운 문서를 찾아라"라는 자연어 검색 문제는, 결국 "이 벡터와 코사인 유사도가 가장 큰 벡터를 찾아라"라는 순수한 최근접 이웃 탐색 문제로 환원된다.

[[diagram:embedding-space]]

질문 벡터 $q$와 문서 벡터 $d$ 사이의 코사인 유사도를 수식으로 다시 적으면 다음과 같다. 1주차에서 계산기로만 다뤘던 그 공식이 그대로 돌아온 것뿐이다.

\`\`\`math
\cos(\theta) = \dfrac{q \cdot d}{|q||d|}
\`\`\`

문제는 문서의 개수가 수백만~수십억 개로 늘어날 때다. 질문 벡터 하나를 저장된 모든 문서 벡터와 하나하나 대조하는 전수 비교(brute-force search)는 벡터가 $n$개, 차원이 $d$일 때 질의 한 번에 $O(nd)$번의 곱셈이 든다. 768차원 벡터 1억 개라면 질의 하나에 약 $7.7 \times 10^{10}$번이다. 그래서 실전에서는 **근사 최근접 이웃 탐색(ANN: Approximate Nearest Neighbor)**을 쓴다. 벡터들을 미리 비슷한 것끼리 묶어 두거나(IVF) 여러 층의 그래프로 엮어 두고(HNSW), 질의와 가까울 법한 일부만 비교하는 것이다. 실제 최근접 이웃 중 일부를 놓칠 수 있다는 것(재현율을 100%보다 조금 낮추는 것)을 대가로 속도를 크게 끌어올리므로 대규모 벡터 검색에서는 사실상 표준이다. 이런 인덱스에 벡터를 저장·갱신하고 질의를 처리하는 인프라가 **벡터 데이터베이스(Vector Database)**(Pinecone, Weaviate, Milvus, pgvector 등)다. 인덱스가 속도와 재현율을 실제로 어떻게 맞바꾸는지, 날짜·권한 같은 조건을 함께 거는 메타데이터 필터에 어떤 함정이 있는지는 보충 과정의 「실전 벡터 검색」 단계에서 직접 구현해 본다.

ANN 인덱스는 어디까지나 벡터 사이의 유사도를 빠르게 찾는 기법일 뿐이고, 애초에 "유사도"를 무엇으로 정의할지는 별개의 선택이다. 임베딩이 등장하기 훨씬 전부터 정보 검색(IR) 분야의 표준이었던 **BM25(Best Matching 25)**는 질의에 등장한 단어가 문서에 얼마나 자주 나타나는지(term frequency), 그 단어가 전체 문서 집합에서 얼마나 희귀한지(inverse document frequency: 흔한 단어일수록 가중치를 낮춘다), 문서 길이 대비 정규화까지 결합해 점수를 매기는 순수 통계적 키워드 매칭 알고리즘이다. 이런 방식을 **Sparse Retrieval**이라 부르는데, 문서와 질의를 어휘 집합 크기만큼의 매우 고차원 벡터로 표현하되 실제 등장한 단어의 자리만 0이 아닌 값을 갖고 나머지는 전부 0이기 때문이다. 이와 대비해 이 단계 첫머리에서 다룬 임베딩 기반 검색은 모든 차원이 학습을 통해 얻어진 실수값으로 채워진 저차원 벡터를 쓰므로 **Dense Retrieval**이라 부른다. 정확히 같은 단어가 쓰였는지를 보는 Sparse Retrieval과 의미가 비슷한지를 보는 Dense Retrieval은 강점이 정반대로 갈린다.

| 구분 | Dense Retrieval (임베딩) | Sparse Retrieval (BM25) |
| --- | --- | --- |
| 표현 방식 | 저차원(수백~수천) 실수 벡터, 모든 차원이 의미를 압축해 학습됨 | 어휘 크기만큼의 초고차원 벡터, 등장한 단어 자리만 0이 아님 |
| 매칭 기준 | 코사인 유사도: 의미가 비슷하면 어휘가 달라도 매칭 | 정확한 토큰 일치 여부: 어휘가 같아야 매칭 |
| 강점 | 동의어·의역·문맥적 의미 파악("자동차"$\leftrightarrow$"승용차") | 정확한 고유명사·제품 코드·전문용어·숫자의 정밀 매칭 |
| 약점 | 임베딩 모델이 학습하지 못한 낯선 고유명사·전문용어에 약함 | 동의어·의역을 전혀 이해하지 못함, 어휘가 다르면 관련 문서도 놓침 |

[[diagram:sparse-vs-dense]]

Dense와 Sparse 중 하나만 선택할 필요는 없다. **Hybrid Search**는 같은 질의를 Dense Retrieval과 Sparse Retrieval 양쪽으로 각각 검색한 뒤 두 결과를 점수 결합(가중합이나, 순위 자체를 합치는 Reciprocal Rank Fusion 등)으로 합쳐 의미 기반 검색의 재현율과 키워드 기반 검색의 정확한 매칭을 동시에 취하는 전략이다. 제품 모델명을 정확히 입력했을 때는 Sparse가, 같은 대상을 의역해 표현했을 때는 Dense가 강점을 보이므로 두 경로를 같이 열어두면 어느 쪽이 이겨도 결과를 잡아낼 수 있다.

두 검색기의 점수를 그대로 더하기는 어렵다. BM25 점수는 0에서 수십까지 커질 수 있고 코사인 유사도는 −1에서 1 사이라 척도가 전혀 다르기 때문이다. 그래서 가장 널리 쓰이는 **RRF(Reciprocal Rank Fusion)**는 점수를 버리고 **순위**만 쓴다. 문서 $d$가 검색기 $r$에서 받은 순위를 $\text{rank}_r(d)$라 하면 다음 점수로 다시 정렬한다.

\`\`\`math
\text{RRF}(d) = \sum_{r} \dfrac{1}{k + \text{rank}_r(d)}
\`\`\`

$k$는 상위 몇 개의 순위 차이가 점수를 지나치게 좌우하지 않게 하는 완충 상수로, 원 논문(Cormack et al., 2009)의 값 60을 흔히 그대로 쓴다. 두 검색기 모두에서 상위에 오른 문서가 가장 높은 점수를 받고, 한쪽에서만 찾은 문서도 완전히 버려지지 않는다.

:::example RRF를 손으로
문서 A는 BM25에서 1위, 임베딩 검색에서 2위다. 문서 B는 BM25에서 3위, 임베딩 검색에서 1위다. $k = 60$이면

- A: $\frac{1}{60 + 1} + \frac{1}{60 + 2} \approx 0.01639 + 0.01613 = 0.03252$
- B: $\frac{1}{60 + 3} + \frac{1}{60 + 1} \approx 0.01587 + 0.01639 = 0.03226$

두 검색기에서 고르게 상위였던 A가 근소하게 앞선다. BM25 점수가 1.8이든 18이든 RRF 점수는 변하지 않는다. 순위만 쓰기 때문이다.
:::

BM25와 RRF를 직접 구현해 보자. 정확한 제품 코드("XK-2030")가 들어간 질의에서 BM25가 어떻게 동작하는지, 그리고 두 순위를 RRF로 합치면 어떻게 되는지 본다.

\`\`\`python
import math

docs = ["XK-2030 프린터 수리 접수 방법",
        "프린터 용지 걸림 해결 방법",
        "노트북 배터리 교체 안내",
        "XK-2030 토너 교체 방법"]
tokens = [d.split() for d in docs]
N, avgdl = len(docs), sum(len(t) for t in tokens) / len(docs)

def idf(term):                                   # 여러 문서에 나올수록 작아진다
    n = sum(term in t for t in tokens)
    return math.log((N - n + 0.5) / (n + 0.5) + 1)

def bm25(query, doc, k1=1.5, b=0.75):
    s = 0.0
    for term in query.split():
        tf = doc.count(term)
        s += idf(term) * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(doc) / avgdl))
    return s

for term in ["XK-2030", "방법"]:
    print(f"IDF({term}) = {idf(term):.3f}")
scores = [bm25("XK-2030 수리", t) for t in tokens]
sparse_rank = sorted(range(N), key=lambda i: -scores[i])
print("BM25 점수:", [round(s, 2) for s in scores], "→ 순위", sparse_rank)

dense_rank = [1, 0, 3, 2]                        # 임베딩 검색이 낸 순위라고 하자 (문서 번호)
def rrf(rankings, k=60):
    score = {}
    for ranking in rankings:
        for r, doc in enumerate(ranking, start=1):
            score[doc] = score.get(doc, 0) + 1 / (k + r)
    return sorted(score.items(), key=lambda kv: -kv[1])
for doc, s in rrf([sparse_rank, dense_rank]):
    print(f"문서 {doc}: RRF {s:.4f}  {docs[doc]}")
\`\`\`

"방법"은 4개 문서 중 3개에 나와 IDF가 작고, "XK-2030"은 2개에만 나와 IDF가 크다. 흔한 단어보다 드문 단어가 일치할 때 점수를 더 주는 것이 IDF의 역할이다. BM25는 "수리"와 "XK-2030"이 모두 들어간 문서 0을 확실히 1위로 올린다. 임베딩 검색이 문서 1을 1위로 냈더라도, RRF로 합치면 양쪽에서 고르게 상위였던 문서 0이 최종 1위가 된다.

[[diagram:hybrid-rrf]]

이렇게 1차로 뽑아 온 후보는 빠르지만 다소 거친 점수로 정렬되어 있어서, 실무에서는 질문과 문서를 한 쌍으로 함께 읽는 더 무겁고 정확한 모델로 소수의 후보만 다시 정렬하는 **재순위화(Reranking)**를 덧붙이기도 한다. 왜 무거운 모델을 처음부터 쓰지 않는지, 두 단계를 어떻게 나눠 평가하는지는 「실전 벡터 검색」 단계에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "질의 \"XK-2030 수리\"처럼 정확한 제품 코드가 핵심인 검색에 더 유리한 것은?",
      choices: ["Dense 검색(임베딩)", "Sparse 검색(BM25)", "둘 다 전혀 못 찾는다", "재순위화만 쓰면 된다"],
      answer: 1,
      explanation: "BM25는 정확히 같은 토큰을, 그리고 희귀한 토큰일수록 크게 반영한다. 임베딩은 낯선 고유명사·코드에 약하다.",
    },
    {
      key: "c2",
      question: "벡터 $n$개(차원 $d$)에서 정확한 최근접 이웃을 찾는 비용과 ANN의 전략으로 옳은 것은?",
      choices: ["$O(1)$, 모든 벡터를 비교한다", "$O(nd)$, 정확도를 조금 내주고 탐색 범위를 줄인다", "$O(d)$, 정확도를 100% 보장한다", "$O(n^2)$, 모든 쌍을 미리 저장한다"],
      answer: 1,
      explanation: "HNSW는 층을 내려가며, IVF는 가까운 클러스터만 탐색해 범위를 좁힌다.",
    },
    {
      key: "c3",
      question: "BM25 점수와 코사인 유사도를 합칠 때 RRF(Reciprocal Rank Fusion)가 점수 대신 순위를 쓰는 이유는?",
      choices: ["순위가 점수보다 계산이 빨라서", "BM25 점수(0~수십)와 코사인 유사도(−1~1)처럼 척도가 다른 점수는 그대로 더할 수 없지만, 순위는 어느 검색기에서나 같은 척도라서", "순위를 쓰면 검색 결과가 항상 정답이 되어서", "임베딩 모델이 순위만 출력해서"],
      answer: 1,
      explanation: "RRF는 각 검색기에서의 순위로 $1/(k + \\text{rank})$를 더한다. 두 검색기 모두에서 상위에 오른 문서가 가장 높은 점수를 받고, 한쪽에서만 찾은 문서도 버려지지 않는다.",
    },
    {
      key: "c4",
      question: "문서가 BM25에서 1위, 임베딩 검색에서 3위일 때 RRF 점수는? ($k = 60$)",
      choices: ["$\\frac{1}{61} + \\frac{1}{63} \\approx 0.0323$", "$1 + 3 = 4$", "$\\frac{1}{1} + \\frac{1}{3} \\approx 1.33$", "$\\frac{1}{60} \\approx 0.0167$"],
      answer: 0,
      explanation: "RRF는 검색기마다 $1/(k + \\text{순위})$를 더한다. $1/61 + 1/63 \\approx 0.01639 + 0.01587 = 0.0323$이다.",
    },
    {
      key: "c5",
      question: "BM25에서 거의 모든 문서에 등장하는 단어(예: \"방법\")의 영향이 작은 이유는?",
      choices: ["IDF(역문서 빈도)가 작아 그 단어의 일치에 주는 가중치가 낮기 때문에", "불용어라서 자동으로 지워지기 때문에", "문서 길이 정규화 때문에", "임베딩 유사도가 낮기 때문에"],
      answer: 0,
      explanation: "IDF는 단어가 적은 문서에만 나올수록 커진다. 모든 문서에 나오는 단어는 어떤 문서를 골라내는 데 도움이 안 되므로 가중치가 작다.",
    },
    {
      key: "c6",
      question: "사용자가 오류 코드 \"E-4012\"로 검색했는데 임베딩(Dense) 검색이 엉뚱한 문서를 돌려준다. 가장 적절한 개선은?",
      choices: ["임베딩 차원을 두 배로 늘린다", "BM25 같은 Sparse 검색을 함께 쓰는 하이브리드 검색(예: RRF)으로 정확한 토큰 일치도 잡는다", "청크 크기를 1000자로 키운다", "LLM의 temperature를 낮춘다"],
      answer: 1,
      explanation: "Dense 검색은 임베딩 모델이 학습하지 못한 고유명사·제품 코드·숫자에 약하고, BM25는 정확한 토큰 일치에 강합니다. 예를 들어 \"XK-2030 수리\" 같은 질의는 BM25만 찾고, 두 순위를 합친 하이브리드는 두 유형의 질문을 모두 상위로 올립니다.",
    },
    {
      key: "c7",
      question: "768차원 벡터 1억 개에서 질의마다 정확한 최근접 이웃(Exact NN)을 찾으면 곱셈은 대략 몇 번이고, 실전에서는 무엇을 쓰는가?",
      choices: ["약 $7.7 \\times 10^{10}$번 → HNSW·IVF 같은 ANN 인덱스로 탐색 범위를 줄인다", "약 $7.7 \\times 10^{4}$번 → 전수 비교로 충분하다", "약 $10^{8}$번 → 벡터 차원을 늘려 해결한다", "곱셈이 필요 없다 → 코사인 유사도는 덧셈만 쓴다"],
      answer: 0,
      explanation: "Exact NN은 질의당 $O(nd)$이므로 $10^8 \\times 768 \\approx 7.7 \\times 10^{10}$번의 곱셈이 듭니다. ANN은 실제 최근접 이웃을 놓칠 수 있다는 대가(재현율을 100%보다 조금 낮춤)로 그래프(HNSW)나 클러스터(IVF) 구조로 탐색 범위를 줄여 밀리초 단위 응답을 얻습니다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
bm25 = ["d1", "d2", "d3"]        # BM25 순위
dense = ["d3", "d1", "d4"]       # Dense 순위
score = {}
for ranking in (bm25, dense):
    for r, d in enumerate(ranking, 1):
        score[d] = score.get(d, 0) + 1 / (60 + r)
print(sorted(score, key=score.get, reverse=True))
`,
      expected: "['d1', 'd3', 'd2', 'd4']",
      explanation: "d1은 $1/61 + 1/62$, d3은 $1/63 + 1/61$로 두 검색기 모두에서 찾은 문서가 위로 올라옵니다. d1이 d3보다 근소하게 높은 것은 Dense의 2위(1/62)가 BM25의 3위(1/63)보다 높기 때문입니다. 한 검색기에서만 나온 d2·d4는 그 아래입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "BM25(Sparse Retrieval)와 임베딩 기반 Dense Retrieval의 매칭 기준 차이는 무엇인가? 각각이 유리한 질의 상황을 하나씩 예로 들어라.",
      answer: md`
BM25는 질의와 문서 사이의 정확한 키워드 일치를 기반으로 점수를 매기는 Sparse Retrieval이라, 고유명사나 특정 코드처럼 정확한 용어 매칭이 중요한 검색에 강하다. Dense Retrieval은 임베딩의 의미적 유사도를 사용하므로 동의어나 다른 표현으로 바꿔 쓴 질문에도 강하다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "정확한 최근접 이웃 탐색(Exact NN)이 대규모 벡터 집합에서 왜 비현실적인지 연산량($n$, $d$) 관점에서 설명하고, ANN이 이를 어떻게 우회하는지 설명하라.",
      answer: md`
전수 비교 방식은 질의 하나당 저장된 모든 문서와 일일이 유사도를 계산해야 해서 연산량이 문서 수 $n$에 비례해 늘어나 대규모에서는 너무 느리다. ANN은 인덱스 구조를 이용해 탐색 범위를 크게 좁혀, 정확도를 아주 조금 희생하는 대신 속도를 극적으로 높인다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Reimers & Gurevych (2019) — Sentence-BERT", url: "https://arxiv.org/abs/1908.10084", note: "문장 하나를 벡터 하나로 바꿔 코사인 유사도로 비교하는 문장 임베딩의 출발점" },
    { title: "Robertson & Zaragoza (2009) — The Probabilistic Relevance Framework: BM25 and Beyond", url: "https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf", note: "BM25 공식의 유래 (심화)" },
  ],
});
