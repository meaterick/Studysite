import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/ann-indexes";

export default defineLesson({
  id: "ann-indexes",
  title: "근사 최근접 이웃 인덱스와 재순위화",
  tier: "supplement",
  goal: "IVF의 칸 수와 $n_\\text{probe}$, HNSW의 $M$·efSearch, PQ 압축이 속도·재현율·메모리를 어떻게 맞바꾸는지 설명하고, 사후·사전 메타데이터 필터의 차이와 bi-encoder·cross-encoder 2단계 검색을 Recall@k′·nDCG로 나눠 평가할 수 있다.",
  why: "벡터가 수백만 개를 넘는 검색 시스템에서는 인덱스의 종류와 설정이 응답 속도, 재현율, 메모리 비용을 함께 정한다. 날짜나 권한 같은 조건으로 거르는 순서와 재순위화를 어떻게 구성하는지에 따라 RAG가 프롬프트에 넣는 근거의 품질이 달라진다.",
  body: md`
[[lesson:retrieval]]에서는 전수 비교가 느리므로 근사 최근접 이웃(ANN) 인덱스를 쓴다는 데까지 다뤘다. 검색 시스템을 운영하려면 어떤 인덱스를 쓸지, 속도와 정확도를 어느 수준에서 절충할지, "2024년 문서만" 같은 조건을 어떻게 적용할지, 1차 검색 결과를 어떻게 더 정확하게 정렬할지를 정해야 한다. 이 레슨은 이 네 가지를 차례로 다루고, IVF 인덱스를 NumPy로 구현해 재현율과 비용을 측정한다.

### 전수 비교의 계산량과 메모리

벡터 $n$개(차원 $d$)를 전수 비교하면 질의 하나에 $nd$번의 곱셈-덧셈이 든다. 768차원 벡터 1억 개라면 질의당 약 $7.7 \times 10^{10}$번이고, 벡터를 float32로 저장하는 것만으로 $10^8 \times 768 \times 4$바이트, 약 307GB의 메모리가 필요하다. 반대로 벡터가 수십만~백만 개 수준이면 전수 비교도 질의당 수십 밀리초 안팎이라, ANN 없이 시작해도 되는 경우가 많다. 인덱스는 전수 비교로 응답 시간을 맞출 수 없을 때 도입한다. ANN 인덱스는 정확도를 조금씩 낮추기 때문이다.

### IVF: 칸으로 나누고 가까운 칸만 탐색한다

**IVF(Inverted File Index)**는 색인할 때 k-means로 벡터들을 $n_\text{list}$개의 칸(클러스터)으로 나누고, 칸마다 그 칸에 속한 벡터 번호 목록(역색인)을 저장해 둔다. 질의가 오면 먼저 칸의 중심 $n_\text{list}$개와 비교해 가장 가까운 칸 $n_\text{probe}$개를 고르고, 그 칸들 안의 벡터만 비교한다. 칸에 벡터가 고르게 나뉘었다면 질의당 곱셈 수는 다음과 같다.

\`\`\`math
d \cdot \left(n_\text{list} + n_\text{probe} \cdot \dfrac{n}{n_\text{list}}\right)
\`\`\`

첫째 항은 중심과의 비교, 둘째 항은 탐색한 칸의 벡터와의 비교다. 칸을 늘리면 둘째 항은 줄지만 첫째 항이 늘어나므로, 두 항이 같아지는 $n_\text{list} = \sqrt{n_\text{probe} \cdot n}$ 근처에서 비용이 가장 작다. 그래서 칸 수는 보통 $\sqrt{n}$의 몇 배로 정한다(FAISS 가이드는 $4\sqrt{n}$~$16\sqrt{n}$을 권한다).

질의가 칸의 경계 근처에 있으면 실제 최근접 이웃이 옆 칸에 들어 있을 수 있고, 그 칸을 탐색하지 않으면 찾지 못한다. $n_\text{probe}$를 늘리면 재현율이 오르고 비용도 함께 오른다. 칸 수를 정한 뒤에는 이 값으로 속도와 정확도를 조절한다.

[[diagram:ivf-cells]]

:::example 비교 횟수 계산
벡터 100만 개를 $n_\text{list} = 1{,}000$칸으로 나누면 칸마다 평균 1,000개다. $n_\text{probe} = 10$이면 질의 하나에 중심 1,000개와 탐색한 칸의 벡터 $10 \times 1{,}000$개, 모두 11,000개와 비교한다. 전수 비교(100만 개)의 약 1.1%다.
:::

아래 코드는 IVF를 NumPy로 구현해 $n_\text{probe}$에 따른 재현율과 비용을 측정한다. 실제 임베딩처럼 주제별로 모여 있는 벡터 2만 개를 64칸으로 나눈다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
n, d, n_list = 20000, 32, 64
topics = rng.normal(size=(200, d))                       # 실제 임베딩처럼 주제별로 모여 있는 데이터
X = (topics[rng.integers(200, size=n)] + 1.0 * rng.normal(size=(n, d))).astype(np.float32)
X /= np.linalg.norm(X, axis=1, keepdims=True)          # 단위벡터: 내적 = 코사인 유사도

# 색인: k-means 몇 번으로 칸(클러스터) 중심을 정하고, 벡터마다 가장 가까운 칸을 기록
C = X[rng.choice(n, n_list, replace=False)]
for _ in range(10):
    assign = np.argmax(X @ C.T, axis=1)
    C = np.stack([X[assign == c].mean(0) if np.any(assign == c) else C[c] for c in range(n_list)])
    C /= np.linalg.norm(C, axis=1, keepdims=True)
cells = [np.where(assign == c)[0] for c in range(n_list)]

def ivf_search(q, k, n_probe):
    near = np.argsort(-(C @ q))[:n_probe]               # 가까운 칸 n_probe개만 탐색한다
    cand = np.concatenate([cells[c] for c in near])
    top = cand[np.argsort(-(X[cand] @ q))[:k]]
    return top, n_list + len(cand)                      # 결과와 비교한 벡터 수

Q = (topics[rng.integers(200, size=200)] + 1.0 * rng.normal(size=(200, d))).astype(np.float32)
Q /= np.linalg.norm(Q, axis=1, keepdims=True)
truth = np.argsort(-(Q @ X.T), axis=1)[:, :10]          # 전수 비교로 구한 실제 상위 10개
for n_probe in [1, 4, 16]:
    rec, cost = [], []
    for q, t in zip(Q, truth):
        top, c = ivf_search(q, 10, n_probe)
        rec.append(len(set(top) & set(t)) / 10); cost.append(c)
    print(f"n_probe={n_probe:2d}: Recall@10 {np.mean(rec):.2f}, 비교 횟수 {np.mean(cost):7.0f} (전수 비교 {n})")
\`\`\`

칸 하나만 탐색하면 전수 비교의 2%만 비교하지만 실제 상위 10개 중 61%만 찾는다. 4칸이면 84%, 16칸이면 97%다. 비교 횟수를 4배씩 늘릴 때 재현율이 오르는 폭은 점점 줄어든다. 서비스에서는 목표 재현율(예: 0.95)을 정하고 그 목표를 만족하는 가장 작은 $n_\text{probe}$를 고른다.

[[diagram:ivf-recall-cost]]

### HNSW: 여러 층의 그래프 탐색

**HNSW**(Hierarchical Navigable Small World)는 벡터마다 가까운 이웃 몇 개와 간선으로 연결해 그래프를 만들고, 이 그래프를 여러 층으로 쌓는다. 위층일수록 노드가 적고 간선이 먼 노드와 연결되어 있어 대략적인 위치로 빠르게 이동할 수 있고, 아래층일수록 노드가 많아 범위를 정밀하게 좁힌다. 검색은 맨 위층의 진입점에서 시작해, 현재 노드보다 질의에 더 가까운 이웃이 있으면 그 이웃으로 이동하는 것을 반복하고, 더 가까운 이웃이 없으면 한 층 내려간다.

\`\`\`image
src: /images/week7/hnsw-index-structure.png
alt: HNSW(계층적 탐색 가능한 소규모 세계) 그래프의 3개 층 구조와 질의 벡터로부터 최근접 이웃을 좁혀가는 과정
caption: 상위 층(Layer 2)일수록 노드가 적고 연결이 성겨 대략적인 위치를 빠르게 찾고, 하위 층(Layer 0)으로 내려갈수록 노드가 촘촘해져 최근접 이웃을 정밀하게 좁혀간다.
credit: Rose electric, CC BY 4.0, Wikimedia Commons
width: 960
height: 404
\`\`\`


주요 하이퍼파라미터는 노드당 연결 수 $M$(클수록 정확하고 메모리가 더 든다)과 검색할 때 유지하는 후보 수 efSearch(클수록 정확하고 느리다)다. HNSW는 칸을 미리 학습할 필요가 없고 같은 속도에서 재현율이 높아 널리 쓰이지만, 벡터마다 이웃 연결을 저장하므로 메모리가 더 들고(FAISS 기준 벡터당 약 $8M$바이트) 벡터를 삭제하거나 수정하기 어렵다.

### 메모리를 줄이는 PQ

벡터 1억 개를 float32로 저장하는 307GB의 메모리를 확보하기 어렵다면 벡터 자체를 압축한다. **PQ(Product Quantization)**는 768차원 벡터를 8차원짜리 조각 96개로 나누고, 조각마다 미리 학습한 대표 벡터 256개 중 가장 가까운 것의 번호(1바이트)만 저장한다. 벡터 하나가 3,072바이트에서 96바이트로 32분의 1이 되고(1억 개면 약 9.6GB), 거리는 조각별 거리 표를 더해 근사한다. 수십억 개 규모에서는 IVF와 PQ를 함께 쓰는 IVF-PQ가 표준이다. 압축할수록 거리가 부정확해지므로, PQ로 넉넉히 후보를 뽑은 뒤 원래 벡터로 다시 정렬하는 경우가 많다.

[[diagram:pq-compression]]

### 인덱스와 데이터베이스

ANN 인덱스를 서비스에 쓰려면 벡터를 영속적으로 저장하고, 인덱스를 구축하고 갱신하며, 질의를 처리하는 시스템이 필요하다. 이 역할을 하는 것이 **벡터 데이터베이스**(Pinecone, Weaviate, Milvus, pgvector 등)다. **FAISS**(Facebook AI Similarity Search)는 IVF, HNSW 같은 ANN 인덱스의 구현을 제공하는 오픈소스 라이브러리로, 벡터 데이터베이스가 내부 엔진으로 쓰거나 소규모 프로토타입에서 메모리에 직접 불러 쓰는 용도로 널리 쓰인다.

| 규모 | 출발점으로 삼을 만한 선택 |
| --- | --- |
| 벡터 수십만~백만 개 | 전수 비교(FAISS의 Flat 인덱스, pgvector의 정확 검색). 재현율 100% |
| 수백만~수억 개 | HNSW 또는 IVF. 재현율 목표(예: 0.95)를 정하고 efSearch·$n_\text{probe}$를 맞춘다 |
| 수억 개 이상, 메모리가 부족한 경우 | IVF-PQ. 압축된 거리로 후보를 넉넉히 뽑고 원래 벡터로 다시 정렬 |

### 메타데이터 필터: 거르는 순서가 결과를 바꾼다

실무 검색은 "이 질문과 가장 가까우면서 2024년에 작성되었고 이 사용자가 볼 권한이 있는 문서"처럼 유사도에 정형 조건을 함께 건다. 이것을 **메타데이터 필터링(Metadata Filtering)**이라 하는데, 언제 거르느냐에 따라 결과가 크게 달라진다.

- **사후 필터(post-filter):** ANN으로 상위 $k'$개를 먼저 뽑은 뒤 조건에 맞지 않는 것을 버린다. 조건을 통과하는 문서의 비율(선택도)이 $s$이면 평균 $k' s$개만 남는다. 상위 100개를 뽑아도 $s = 0.02$면 평균 2개이고, 하나도 남지 않는 질의도 생긴다.
- **사전 필터(pre-filter):** 조건을 통과하는 문서 안에서만 검색한다. 결과 개수는 보장되지만, 통과한 문서만 남긴 그래프는 연결이 끊어져 HNSW 탐색이 가까운 노드에 도달하지 못할 수 있다. 그래서 벡터 데이터베이스는 탐색 중에 필터를 함께 적용하는 알고리즘을 쓰거나, 통과한 문서가 적으면 그 안에서 전수 비교로 바꾼다.

[[diagram:filter-order]]

권한 필터는 특히 주의해야 한다. "이 사용자가 볼 수 없는 문서는 무시하라"고 LLM에 지시하는 것은 필터가 아니다. 권한이 없는 문서는 검색 단계에서 제외되어 프롬프트에 들어가지 않아야 한다.

### 재순위화: 빠른 1차 검색과 정확한 2차 정렬

임베딩 검색은 질문과 문서를 **따로** 벡터로 만든 뒤(bi-encoder) 내적 한 번으로 비교한다. 문서 벡터를 미리 계산해 둘 수 있어 빠르지만, 질문의 토큰과 문서의 토큰이 서로를 직접 참조하지 않는다. **재순위화**(reranking) 모델(cross-encoder)은 질문과 문서를 하나의 입력으로 이어 붙여 Transformer에 넣으므로, attention([[lesson:self-attention]])이 질문 토큰과 문서 토큰 사이에서 직접 계산되어 훨씬 정확하다. 대신 문서 벡터를 미리 계산해 둘 수 없어, 후보 100개를 다시 정렬하려면 질의마다 Transformer 순전파가 100번 필요하다. 그래서 검색을 두 단계로 나눈다.

1. **1차 검색(재현율 담당):** ANN이나 하이브리드 검색으로 후보 50~200개를 빠르게 뽑는다. Recall@$k'$로 평가한다. 정답이 후보에 들지 못하면 2단계에서 찾을 수 없다.
2. **2차 정렬(정밀도 담당):** 재순위화 모델로 후보만 다시 정렬해 상위 3~5개를 프롬프트에 넣는다. 평가는 MRR이나 nDCG처럼 **순위**를 보는 지표로 한다.

[[diagram:rerank-two-stage]]

[[lesson:retrieval-metrics]]에서 소개한 **nDCG**가 여기서 쓰인다. 관련도가 "완벽히 답함(3)"부터 "무관(0)"까지 등급으로 매겨져 있을 때, $i$위 문서의 관련도 $\text{rel}_i$를 순위가 낮을수록 할인해 더한다.

\`\`\`math
\text{DCG@}k = \sum_{i=1}^{k} \dfrac{\text{rel}_i}{\log_2(i + 1)}, \qquad \text{nDCG@}k = \dfrac{\text{DCG@}k}{\text{IDCG@}k}
\`\`\`

IDCG는 같은 문서들을 관련도 순으로 완벽하게 정렬했을 때의 DCG라서, nDCG는 0에서 1 사이 값이 된다. MRR이 첫 정답의 순위만 본다면, nDCG는 상위 $k$개 전체의 순서와 관련도 등급을 함께 본다. 실무에서는 LLM에 후보 목록 전체를 주고 순서를 정하게 하는 LLM 재순위화도 쓰는데, 정확하지만 비용이 더 크다.

:::example nDCG 손 계산
재순위화 모델이 낸 상위 4개의 관련도가 순서대로 [3, 2, 0, 1]이라 하자.

- DCG@4 $= \frac{3}{\log_2 2} + \frac{2}{\log_2 3} + \frac{0}{\log_2 4} + \frac{1}{\log_2 5} \approx 3 + 1.262 + 0 + 0.431 = 4.693$
- 이상적인 순서 [3, 2, 1, 0]의 IDCG@4 $\approx 3 + 1.262 + 0.5 + 0 = 4.762$
- nDCG@4 $\approx 4.693 / 4.762 \approx 0.985$

3위와 4위만 바뀌었으므로 점수가 거의 1이다. 순위가 낮을수록 할인이 커서, 아래쪽 순위의 오류는 위쪽 순위의 오류보다 점수를 적게 낮춘다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "IVF에서 칸 64개 중 가까운 4개만 탐색할 때 일어나는 일로 옳은 것은?",
      choices: ["항상 전수 비교와 같은 결과를 낸다", "비교하는 문서는 약 6%로 줄지만, 경계 근처의 실제 이웃이 탐색하지 않은 칸에 있으면 놓친다", "칸을 적게 열수록 재현율이 오른다", "질의와 가장 먼 칸부터 탐색한다"],
      answer: 1,
      explanation: "본문 실험에서 $n_\\text{probe} = 4$는 문서의 약 6.3%만 비교하고 Recall@10 0.838을 얻었다. $n_\\text{probe}$를 늘리면 재현율과 비용이 함께 오른다.",
    },
    {
      key: "c2",
      question: "조건을 통과하는 문서가 2%일 때, ANN으로 상위 100개를 먼저 뽑은 뒤 조건으로 거르면(사후 필터) 평균 몇 개가 남는가?",
      choices: ["100개", "약 50개", "약 2개", "항상 10개"],
      answer: 2,
      explanation: "평균 $k' s = 100 \\times 0.02 = 2$개다. 하나도 남지 않는 질의도 약 $e^{-2} \\approx 14\\%$ 생긴다. 결과 개수를 보장하려면 사전 필터나 탐색 중에 필터를 함께 적용하는 검색을 쓴다.",
    },
    {
      key: "c3",
      question: "Hybrid Search와 Reranking을 함께 쓸 때의 올바른 순서는?",
      choices: ["Reranking으로 전체 문서를 정렬한 뒤 Hybrid Search", "Hybrid Search로 후보를 넓게 뽑은 뒤, 소수 후보에만 무거운 Reranking", "둘은 같은 기법이다", "순서는 상관없다"],
      answer: 1,
      explanation: "cross-encoder 재순위화는 질문과 문서를 한 쌍으로 Transformer에 넣으므로 후보마다 순전파가 필요해 비용이 크다. 그래서 1차 검색(재현율 담당)으로 좁힌 수십~수백 개에만 적용한다(정밀도 담당).",
    },
    {
      key: "c4",
      question: "벡터 100만 개를 IVF로 1,000칸에 나누고 $n_\\text{probe} = 10$으로 검색하면 질의당 비교하는 벡터(중심 포함)는 약 몇 개인가?",
      choices: ["약 11,000개", "약 1,000개", "약 10,000개", "1,000,000개"],
      answer: 0,
      explanation: "중심 1,000개와 비교하고, 탐색한 칸 10개의 벡터(칸당 평균 1,000개) 10,000개와 비교해 모두 약 11,000개다. 전수 비교의 약 1.1%다.",
    },
    {
      key: "c5",
      question: "재순위화 결과의 관련도가 [3, 2, 1, 0] 순서(가장 관련 있는 것부터 완벽하게 정렬)라면 nDCG@4는?",
      choices: ["1", "0.5", "0", "0.985"],
      answer: 0,
      explanation: "이미 이상적인 순서이므로 DCG와 IDCG가 같아 nDCG = 1이다. nDCG는 0에서 1 사이의 값이며 1이 가장 이상적인 정렬이다.",
    },
    {
      key: "c6",
      question: "권한 필터를 통과하는 문서가 전체의 1%다. ANN으로 상위 $k'$개를 먼저 뽑은 뒤 필터로 거르는 사후 필터로 결과 10개를 **평균적으로** 채우려면 $k'$는 대략 얼마여야 하는가?",
      choices: ["10개", "100개", "약 1,000개", "약 100만 개"],
      answer: 2,
      explanation: "사후 필터 뒤에 남는 개수의 평균은 $k' s$이므로 $k' = 10 / 0.01 = 1{,}000$이다. 평균이 10이면 절반 가까운 질의에서 10개가 채워지지 않으므로, 실제로는 더 많이 뽑거나 사전 필터(필터를 통과한 문서 안에서 검색)를 쓴다. 권한 필터는 LLM에 무시하라고 지시하는 방식이 아니라 검색 단계에서 적용해야 한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
n, d, nlist, nprobe = 1_000_000, 768, 1000, 10
brute = n * d                                   # 전수 비교의 곱셈 수
ivf = d * (nlist + nprobe * n // nlist)         # 중심과의 비교 + 탐색한 칸의 문서
print(ivf // d, round(brute / ivf))
`,
      expected: "11000 91",
      explanation: "중심 1,000개와 비교하고, 칸 1,000개 중 10개(칸당 평균 1,000개)를 탐색해 문서 10,000개를 비교하므로 질의당 벡터 11,000개와만 비교한다. 전수 비교(100만 개)보다 약 91배 적다. 대신 탐색하지 않은 칸에 있던 실제 이웃을 놓칠 수 있다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "IVF 인덱스에서 $n_\\text{probe}$를 늘리면 재현율과 비용이 각각 어떻게 변하는지 쓰라. 필터를 통과하는 문서가 2%일 때 상위 100개를 뽑은 뒤 거르는 사후 필터의 문제를 숫자로 설명하고, 대안을 쓰라.",
      answer: md`
IVF는 벡터를 k-means로 $n_\text{list}$개의 칸에 나눠 두고, 질의와 가까운 칸 $n_\text{probe}$개만 탐색해 그 안의 벡터만 비교한다. $n_\text{probe}$를 늘리면 실제 최근접 이웃이 탐색하지 않은 칸에 있어 놓치는 경우가 줄어 재현율이 오르지만, 비교하는 벡터 수(질의당 약 $d(n_\text{list} + n_\text{probe} \cdot n/n_\text{list})$번의 곱셈)도 함께 늘어난다. 본문 실험에서 칸 64개 중 1개를 탐색하면 Recall@10이 약 0.61, 4개면 약 0.84, 16개면 약 0.97이었다.

사후 필터는 ANN으로 상위 $k'$개를 뽑은 뒤 조건으로 거르므로 평균 $k' s$개만 남는다. 통과율 $s = 0.02$, $k' = 100$이면 평균 2개이고, 하나도 남지 않는 질의도 약 $e^{-2} \approx 14\%$ 생긴다. 결과 개수를 보장하려면 조건을 통과한 문서 안에서만 검색하는 사전 필터나, 탐색 중에 필터를 함께 적용하는 검색을 쓴다.
`,
      keyPoints: [
        "$n_\\text{probe}$를 늘리면 재현율과 비교 횟수가 함께 늘어난다",
        "사후 필터 뒤에는 평균 $k' s$개만 남는다",
        "통과율 2%, 상위 100개면 평균 2개이고 결과가 없는 질의도 생긴다",
        "사전 필터나 탐색 중 필터 적용으로 결과 개수를 보장한다",
      ],
    },
    {
      key: "d2",
      question: "1차 검색과 재순위화로 나눈 2단계 검색을 설계하라. bi-encoder와 cross-encoder의 차이와 비용, 각 단계를 평가하는 지표, 1차 후보 수를 너무 작게 정하면 생기는 문제를 쓰라.",
      answer: md`
bi-encoder(임베딩 검색)는 질문과 문서를 따로 벡터로 만들어 내적으로 비교하므로, 문서 벡터를 미리 계산하고 ANN으로 수백만 개에서 빠르게 후보를 뽑을 수 있다. 그러나 질문과 문서의 토큰이 서로를 직접 참조하지 않아 정확도가 낮다. cross-encoder는 질문과 문서를 하나의 입력으로 Transformer에 넣어 attention이 둘 사이에서 직접 계산되므로 정확하지만, 후보마다 순전파가 필요해 수백 개 이상에 쓰기 어렵다.

그래서 1차로 ANN이나 하이브리드 검색이 후보 50~200개를 뽑고(재현율 담당, Recall@k′로 평가), 2차로 재순위화 모델이 후보만 다시 정렬해 상위 몇 개를 프롬프트에 넣는다(정밀도 담당, MRR이나 nDCG로 평가). 1차 후보 수가 너무 작으면 정답이 후보에 들지 못하고, 재순위화는 후보에 없는 문서를 찾을 수 없으므로 전체 성능이 1차 검색의 재현율로 제한된다.
`,
      keyPoints: [
        "bi-encoder는 따로 인코딩해 미리 계산할 수 있어 빠르지만 토큰 간 상호작용이 없다",
        "cross-encoder는 함께 인코딩해 정확하지만 후보마다 순전파가 필요하다",
        "1차는 Recall@k′, 2차는 MRR이나 nDCG로 평가한다",
        "1차에서 놓친 정답은 재순위화로 찾을 수 없다",
      ],
    },
  ],
  references: [
    { title: "FAISS — Guidelines to choose an index", url: "https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index", note: "규모와 메모리에 따른 인덱스 선택, IVF 칸 수의 근거(영문)" },
    { title: "Malkov & Yashunin (2016) — HNSW", url: "https://arxiv.org/abs/1603.09320", note: "HNSW를 제안한 논문(영문)" },
    { title: "Pinecone — Hierarchical Navigable Small Worlds (HNSW)", url: "https://www.pinecone.io/learn/series/faiss/hnsw/", note: "HNSW의 층 구조를 그림으로 설명한 글(영문)" },
    { title: "Nogueira & Cho (2019) — Passage Re-ranking with BERT", url: "https://arxiv.org/abs/1901.04085", note: "BERT cross-encoder로 재순위화 성능을 크게 높인 논문(영문)" },
  ],
});
