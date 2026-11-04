import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/retrieval";

export default defineLesson({
  id: "retrieval",
  title: "임베딩과 벡터 검색",
  tier: "core",
  concepts: ["retrieval-rag-agents"],
  goal: "임베딩 기반 Dense 검색과 BM25 Sparse 검색의 매칭 기준과 강약점을 비교하고, 전수 비교가 대규모에서 쓰기 어려운 이유와 ANN·벡터 DB의 역할, RRF가 점수 대신 순위로 두 검색기의 결과를 합치는 원리를 설명한다.",
  why: "LLM은 학습 데이터에 없는 문서(사내 문서, 최신 자료)의 내용을 알지 못하므로, 질문과 관련된 문서를 찾아 프롬프트에 넣는 검색이 RAG([[lesson:rag]])의 첫 단계다. 검색 방식에 따라 찾을 수 있는 문서가 달라지므로, 질의의 특성에 맞는 검색 방식을 골라야 한다.",
  body: md`
### 임베딩과 코사인 유사도

**임베딩 모델**은 문장이나 문서 하나를 고정된 차원(보통 수백~수천)의 실수 벡터로 바꾼다. 이 모델은 의미가 비슷한 텍스트일수록 벡터의 방향이 비슷해지도록, 즉 코사인 유사도가 커지도록 학습되어 있다([[lesson:contrastive-learning]]). 경사하강법을 설명하는 문장의 벡터는 최적화 이론을 설명하는 문장의 벡터와 방향이 비슷하고, 조선왕조실록을 설명하는 문장의 벡터와는 방향이 크게 다르다. 따라서 질문과 의미가 가장 가까운 문서를 찾는 문제는, 질문 벡터와 코사인 유사도가 가장 큰 문서 벡터를 찾는 최근접 이웃 탐색 문제가 된다.

[[diagram:embedding-space]]

질문 벡터 $q$와 문서 벡터 $d$의 코사인 유사도는 다음과 같다([[lesson:dot-product]]).

\`\`\`math
\cos(\theta) = \dfrac{q \cdot d}{|q||d|}
\`\`\`

### 전수 비교와 ANN

질문 벡터를 저장된 모든 문서 벡터와 비교하는 **전수 비교**(brute-force search)는 벡터가 $n$개, 차원이 $d$일 때 질의 하나에 $O(nd)$번의 곱셈이 든다. 768차원 벡터 1억 개라면 질의 하나에 약 $7.7 \times 10^{10}$번이다. 그래서 대규모 검색에서는 **근사 최근접 이웃 탐색**(ANN, approximate nearest neighbor)을 쓴다. 벡터를 미리 비슷한 것끼리 묶어 두거나(IVF) 여러 층의 그래프로 연결해 두고(HNSW), 질의와 가까울 가능성이 높은 일부 벡터만 비교한다. 실제 최근접 이웃 중 일부를 놓칠 수 있는 대신(재현율이 100%보다 조금 낮아지는 대신) 속도가 크게 빨라진다. 이런 인덱스에 벡터를 저장하고 갱신하며 질의를 처리하는 시스템이 **벡터 데이터베이스**(Pinecone, Weaviate, Milvus, pgvector 등)다. 인덱스의 속도와 재현율의 관계, 날짜나 권한 같은 조건으로 거르는 메타데이터 필터의 문제는 [[lesson:ann-indexes]]에서 다룬다.

### Sparse 검색: BM25

ANN은 유사도가 큰 벡터를 빠르게 찾는 방법이고, 유사도를 무엇으로 정의할지는 별개의 선택이다. 임베딩 이전부터 정보 검색의 표준이었던 **BM25**(Best Matching 25)는 질의의 단어가 문서에 얼마나 자주 나오는지(term frequency), 그 단어가 전체 문서 집합에서 얼마나 드문지(inverse document frequency, IDF), 문서 길이를 결합해 점수를 계산하는 키워드 매칭 방법이다. 여러 문서에 흔히 나오는 단어일수록 IDF가 작아 점수에 적게 반영된다.

BM25 같은 방식을 **Sparse 검색**이라 한다. 문서와 질의를 어휘 크기만큼의 고차원 벡터로 표현하되, 실제로 나온 단어의 자리만 0이 아니고 나머지는 모두 0이기 때문이다. 임베딩 기반 검색은 모든 차원이 학습된 실수값인 저차원 벡터를 쓰므로 **Dense 검색**이라 한다. 같은 단어가 쓰였는지를 보는 Sparse 검색과 의미가 비슷한지를 보는 Dense 검색은 강점이 서로 다르다.

| 구분 | Dense 검색(임베딩) | Sparse 검색(BM25) |
| --- | --- | --- |
| 표현 방식 | 수백~수천 차원의 실수 벡터, 모든 차원이 학습된 값 | 어휘 크기만큼의 고차원 벡터, 나온 단어의 자리만 0이 아님 |
| 매칭 기준 | 코사인 유사도. 의미가 비슷하면 어휘가 달라도 찾는다 | 토큰 일치. 어휘가 같아야 찾는다 |
| 강점 | 동의어, 다른 표현으로 바꿔 쓴 질문("자동차"$\leftrightarrow$"승용차") | 고유명사, 제품 코드, 전문용어, 숫자 |
| 약점 | 임베딩 모델이 학습 중에 거의 보지 못한 고유명사와 코드 | 동의어와 다른 표현으로 바꿔 쓴 질문 |

[[diagram:sparse-vs-dense]]

### 하이브리드 검색과 RRF

**하이브리드 검색**(hybrid search)은 같은 질의를 Dense 검색과 Sparse 검색으로 각각 검색한 뒤 두 결과를 합친다. 제품 모델명을 정확히 입력한 질의는 Sparse 검색이, 같은 대상을 다른 표현으로 쓴 질의는 Dense 검색이 잘 찾으므로, 두 결과를 합치면 한쪽이 놓친 문서를 다른 쪽이 찾을 수 있다.

두 검색기의 점수는 그대로 더하기 어렵다. BM25 점수는 0에서 수십까지 커질 수 있고 코사인 유사도는 −1에서 1 사이라 척도가 다르기 때문이다. 그래서 널리 쓰이는 **RRF**(Reciprocal Rank Fusion)는 점수 대신 **순위**를 쓴다. 문서 $d$가 검색기 $r$에서 받은 순위를 $\text{rank}_r(d)$라 하면 다음 점수로 다시 정렬한다.

\`\`\`math
\text{RRF}(d) = \sum_{r} \dfrac{1}{k + \text{rank}_r(d)}
\`\`\`

$k$는 최상위 몇 개의 순위 차이가 점수를 지나치게 좌우하지 않게 하는 상수로, 원 논문(Cormack et al., 2009)의 값 60을 흔히 쓴다. 두 검색기에서 모두 상위에 오른 문서가 가장 높은 점수를 받고, 한쪽에서만 찾은 문서도 결과에 남는다.

:::example RRF 손 계산
문서 A는 BM25에서 1위, 임베딩 검색에서 2위다. 문서 B는 BM25에서 3위, 임베딩 검색에서 1위다. $k = 60$이면

- A: $\frac{1}{60 + 1} + \frac{1}{60 + 2} \approx 0.01639 + 0.01613 = 0.03252$
- B: $\frac{1}{60 + 3} + \frac{1}{60 + 1} \approx 0.01587 + 0.01639 = 0.03226$

두 검색기에서 고르게 상위였던 A가 근소하게 앞선다. 순위만 쓰므로 BM25 점수가 1.8이든 18이든 RRF 점수는 같다.
:::

아래 코드는 BM25와 RRF를 구현해, 정확한 제품 코드("XK-2030")가 들어간 질의에서 BM25의 순위와 RRF로 합친 순위를 계산한다.

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

"방법"은 문서 4개 중 3개에 나와 IDF가 작고, "XK-2030"은 2개에만 나와 IDF가 크다. 드문 단어가 일치할 때 점수를 더 주는 것이 IDF의 역할이다. BM25는 "수리"와 "XK-2030"이 모두 들어간 문서 0을 1위로 올린다. 임베딩 검색이 문서 1을 1위로 냈더라도, RRF로 합치면 두 검색기에서 고르게 상위였던 문서 0이 최종 1위가 된다.

[[diagram:hybrid-rrf]]

### 재순위화

1차 검색으로 뽑은 후보는 빠르지만 정확도가 낮은 점수로 정렬되어 있다. 그래서 실무에서는 질문과 문서를 한 쌍으로 함께 읽는 더 크고 정확한 모델로 소수의 후보만 다시 정렬하는 **재순위화**(reranking)를 더하기도 한다. 이 모델을 처음부터 모든 문서에 쓰지 않는 이유와 두 단계를 나눠 평가하는 방법은 [[lesson:ann-indexes]]에서 다룬다.
`,
  checks: [
    {
      key: "c1",
      question: "질의 \"XK-2030 수리\"처럼 정확한 제품 코드가 핵심인 검색에 더 유리한 것은?",
      choices: ["Dense 검색(임베딩)", "Sparse 검색(BM25)", "둘 다 전혀 못 찾는다", "재순위화만 쓰면 된다"],
      answer: 1,
      explanation: "BM25는 정확히 같은 토큰의 일치를 반영하고, 드문 토큰일수록 크게 반영한다. 임베딩은 학습 중에 거의 보지 못한 고유명사와 코드에 약하다.",
    },
    {
      key: "c2",
      question: "벡터 $n$개(차원 $d$)에서 정확한 최근접 이웃을 찾는 비용과 ANN의 전략으로 옳은 것은?",
      choices: ["$O(1)$, 모든 벡터를 비교한다", "$O(nd)$, 재현율을 조금 낮추는 대신 탐색 범위를 줄인다", "$O(d)$, 정확도를 100% 보장한다", "$O(n^2)$, 모든 쌍을 미리 저장한다"],
      answer: 1,
      explanation: "전수 비교는 질의마다 $n$개 벡터와 $d$차원 내적을 계산하므로 $O(nd)$다. ANN 중 HNSW는 그래프의 층을 내려가며, IVF는 질의와 가까운 클러스터만 탐색해 비교할 벡터를 줄인다.",
    },
    {
      key: "c3",
      question: "BM25 점수와 코사인 유사도를 합칠 때 RRF(Reciprocal Rank Fusion)가 점수 대신 순위를 쓰는 이유는?",
      choices: ["순위가 점수보다 계산이 빠르기 때문에", "BM25 점수(0~수십)와 코사인 유사도(−1~1)처럼 척도가 다른 점수는 그대로 더할 수 없지만, 순위는 어느 검색기에서나 같은 척도이기 때문에", "순위를 쓰면 검색 결과가 항상 정답이 되기 때문에", "임베딩 모델이 순위만 출력하기 때문에"],
      answer: 1,
      explanation: "RRF는 각 검색기에서의 순위로 $1/(k + \\text{rank})$를 더한다. 두 검색기에서 모두 상위에 오른 문서가 가장 높은 점수를 받고, 한쪽에서만 찾은 문서도 결과에 남는다.",
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
      explanation: "IDF는 단어가 적은 문서에만 나올수록 커진다. 대부분의 문서에 나오는 단어는 관련 문서를 구별하는 데 도움이 되지 않으므로 가중치가 작다.",
    },
    {
      key: "c6",
      question: "사용자가 오류 코드 \"E-4012\"로 검색했는데 임베딩(Dense) 검색이 엉뚱한 문서를 돌려준다. 가장 적절한 개선은?",
      choices: ["임베딩 차원을 두 배로 늘린다", "BM25 같은 Sparse 검색을 함께 쓰는 하이브리드 검색(예: RRF)으로 정확한 토큰 일치도 잡는다", "청크 크기를 1000자로 키운다", "LLM의 temperature를 낮춘다"],
      answer: 1,
      explanation: "Dense 검색은 임베딩 모델이 학습 중에 거의 보지 못한 고유명사, 제품 코드, 숫자에 약하고, BM25는 정확한 토큰 일치에 강하다. 두 순위를 합친 하이브리드 검색은 코드가 들어간 질의와 다른 표현으로 바꿔 쓴 질의를 모두 상위에 올릴 수 있다.",
    },
    {
      key: "c7",
      question: "768차원 벡터 1억 개에서 질의마다 정확한 최근접 이웃(Exact NN)을 찾으면 곱셈은 대략 몇 번이고, 실전에서는 무엇을 쓰는가?",
      choices: ["약 $7.7 \\times 10^{10}$번 → HNSW·IVF 같은 ANN 인덱스로 탐색 범위를 줄인다", "약 $7.7 \\times 10^{4}$번 → 전수 비교로 충분하다", "약 $10^{8}$번 → 벡터 차원을 늘려 해결한다", "곱셈이 필요 없다 → 코사인 유사도는 덧셈만 쓴다"],
      answer: 0,
      explanation: "정확한 최근접 이웃 탐색은 질의당 $O(nd)$이므로 $10^8 \\times 768 \\approx 7.7 \\times 10^{10}$번의 곱셈이 든다. ANN은 실제 최근접 이웃을 놓칠 수 있는 대신(재현율이 조금 낮아지는 대신) 그래프(HNSW)나 클러스터(IVF) 구조로 탐색 범위를 줄여 밀리초 단위로 응답한다.",
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
      explanation: "d1은 $1/61 + 1/62$, d3은 $1/63 + 1/61$로, 두 검색기에서 모두 찾은 문서가 위에 온다. d1이 d3보다 근소하게 높은 것은 Dense 검색의 2위(1/62)가 BM25의 3위(1/63)보다 점수가 크기 때문이다. 한 검색기에서만 나온 d2와 d4는 그 아래다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "BM25(Sparse 검색)와 임베딩 기반 Dense 검색의 매칭 기준 차이를 쓰고, 각각이 유리한 질의를 하나씩 예로 들어라. 두 결과를 RRF로 합칠 때 점수 대신 순위를 쓰는 이유도 쓰라.",
      answer: md`
BM25는 질의와 문서의 토큰 일치를 기준으로, 단어의 빈도와 IDF(드문 단어일수록 큼)와 문서 길이로 점수를 계산한다. 그래서 "XK-2030 수리"처럼 제품 코드나 고유명사가 핵심인 질의에 유리하다. Dense 검색은 임베딩 벡터의 코사인 유사도로 의미가 비슷한 문서를 찾으므로, "승용차 정비"로 "자동차 수리" 문서를 찾는 것처럼 다른 표현으로 바꿔 쓴 질의에 유리하다.

BM25 점수는 0에서 수십까지, 코사인 유사도는 −1에서 1까지로 척도가 달라 그대로 더할 수 없다. RRF는 검색기마다 순위로 $1/(k + \text{rank})$를 더하므로 척도와 관계없이 두 결과를 합칠 수 있고, 두 검색기에서 모두 상위인 문서가 가장 높은 점수를 받는다.
`,
      keyPoints: [
        "BM25는 토큰 일치와 IDF로 점수를 계산해 코드와 고유명사에 강하다",
        "Dense 검색은 코사인 유사도로 의미가 비슷한 문서를 찾아 다른 표현에 강하다",
        "두 점수는 척도가 달라 그대로 더할 수 없다",
        "RRF는 순위만 써서 두 결과를 합치고 양쪽에서 상위인 문서를 올린다",
      ],
    },
    {
      key: "d2",
      question: "정확한 최근접 이웃 탐색이 대규모 벡터 집합에서 쓰기 어려운 이유를 연산량($n$, $d$)으로 설명하고, ANN이 이 문제를 어떻게 줄이며 무엇을 대가로 치르는지 쓰라.",
      answer: md`
정확한 최근접 이웃 탐색은 질의마다 저장된 벡터 $n$개 모두와 $d$차원 내적을 계산하므로 질의 하나에 $O(nd)$의 계산이 든다. 768차원 벡터 1억 개라면 질의마다 약 $7.7 \times 10^{10}$번의 곱셈이 필요해 실시간 응답이 어렵다.

ANN은 벡터를 미리 클러스터로 묶거나(IVF) 그래프로 연결해 두고(HNSW), 질의와 가까울 가능성이 높은 일부 벡터만 비교해 계산량을 크게 줄인다. 대신 실제 최근접 이웃이 탐색 범위 밖에 있으면 놓칠 수 있어 재현율이 100%보다 낮아진다.
`,
      keyPoints: [
        "정확한 탐색은 질의마다 $O(nd)$의 계산이 든다",
        "ANN은 클러스터나 그래프 구조로 일부 벡터만 비교한다",
        "ANN은 실제 최근접 이웃을 놓칠 수 있어 재현율이 낮아진다",
      ],
    },
  ],
  references: [
    { title: "Reimers & Gurevych (2019) — Sentence-BERT", url: "https://arxiv.org/abs/1908.10084", note: "문장 하나를 벡터 하나로 바꿔 코사인 유사도로 비교하는 문장 임베딩 모델 (영문)" },
    { title: "Cormack et al. (2009) — Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods", url: "https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf", note: "RRF를 제안한 논문 (영문)" },
    { title: "Robertson & Zaragoza (2009) — The Probabilistic Relevance Framework: BM25 and Beyond", url: "https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf", note: "BM25 공식의 유도와 변형 (영문)" },
  ],
});
