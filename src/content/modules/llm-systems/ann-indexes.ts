import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/ann-indexes";

export default defineLesson({
  id: "ann-indexes",
  title: "근사 최근접 이웃 인덱스와 재순위화",
  tier: "supplement",
  goal: "IVF의 칸 수와 $n_\\text{probe}$, HNSW의 $M$·efSearch, PQ 압축이 속도·재현율·메모리를 어떻게 맞바꾸는지 설명하고, 사후·사전 메타데이터 필터의 차이와 bi-encoder·cross-encoder 2단계 검색을 Recall@k′·nDCG로 나눠 평가할 수 있다.",
  why: "",
  body: md`
핵심 과정의 「임베딩과 벡터 검색」 단계에서는 "전수 비교는 느리니 근사 최근접 이웃(ANN) 인덱스를 쓴다"까지만 말하고 넘어갔다. 실제로 검색 시스템을 운영하는 엔지니어는 그다음 질문에 답해야 한다. 어떤 인덱스를 쓸까, 속도와 정확도를 어디서 맞바꿀까, "2024년 문서만" 같은 조건은 어떻게 걸까, 1차 검색 결과를 어떻게 더 정확하게 다듬을까. 이 단계는 이 네 질문을 차례로 다루고, IVF 인덱스를 NumPy로 직접 만들어 재현율과 비용을 잰다.

### 전수 비교는 계산과 메모리 모두에서 막힌다

벡터 $n$개(차원 $d$)를 전수 비교하면 질의 하나에 $nd$번의 곱셈-덧셈이 든다. 768차원 벡터 1억 개라면 질의당 약 $7.7 \times 10^{10}$번이고, 벡터를 float32로 저장하는 것만으로 $10^8 \times 768 \times 4$바이트, 약 307GB의 메모리가 필요하다. 반대로 벡터가 수십만~백만 개 수준이면 전수 비교도 질의당 수십 밀리초 안팎이라, ANN 없이 시작해도 되는 경우가 많다. 인덱스는 문제가 생긴 뒤에 고르는 편이 낫다. 인덱스마다 정확도를 조금씩 내주기 때문이다.

### IVF: 칸으로 나누고 가까운 칸 몇 개만 연다

**IVF(Inverted File Index)**는 색인할 때 k-means로 벡터들을 $n_\text{list}$개의 칸(클러스터)으로 나누고, 칸마다 그 칸에 속한 벡터 번호 목록(역색인)을 저장해 둔다. 질의가 오면 먼저 칸의 중심 $n_\text{list}$개와 비교해 가장 가까운 칸 $n_\text{probe}$개를 고르고, 그 칸들 안의 벡터만 비교한다. 칸에 벡터가 고르게 나뉘었다면 질의당 곱셈 수는 다음과 같다.

\`\`\`math
d \cdot \left(n_\text{list} + n_\text{probe} \cdot \dfrac{n}{n_\text{list}}\right)
\`\`\`

첫째 항은 중심과의 비교, 둘째 항은 열어 본 칸 속 벡터와의 비교다. 칸을 늘리면 둘째 항은 줄지만 첫째 항이 늘어나므로, 두 항이 같아지는 $n_\text{list} = \sqrt{n_\text{probe} \cdot n}$ 근처가 가장 싸다. 그래서 칸 수는 보통 $\sqrt{n}$의 몇 배로 잡는다(FAISS 가이드는 $4\sqrt{n}$~$16\sqrt{n}$을 권한다).

IVF가 놓치는 경우는 분명하다. 질의가 칸의 경계 근처에 있으면 실제 최근접 이웃이 옆 칸에 들어 있을 수 있는데, 그 칸을 열지 않으면 영영 찾지 못한다. $n_\text{probe}$를 늘리면 재현율이 오르고 비용도 그만큼 오른다. 칸 수를 정해 둔 뒤에는 이 값 하나로 속도와 정확도 사이의 균형을 맞추는 것이 IVF 운영의 핵심이다.

[[diagram:ivf-cells]]

:::example 비교 횟수 계산
벡터 100만 개를 $n_\text{list} = 1{,}000$칸으로 나누면 칸마다 평균 1,000개다. $n_\text{probe} = 10$이면 질의 하나에 중심 1,000개 + 열어 본 칸의 벡터 $10 \times 1{,}000$개, 모두 11,000개와 비교한다. 전수 비교(100만 개)의 약 1.1%다.
:::

IVF를 NumPy로 직접 만들어 $n_\text{probe}$를 바꿔 가며 재현율과 비용을 재 보자. 실제 임베딩처럼 주제별로 뭉쳐 있는 벡터 2만 개를 64칸으로 나눈다.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
n, d, n_list = 20000, 32, 64
topics = rng.normal(size=(200, d))                       # 실제 임베딩처럼 주제별로 뭉쳐 있는 데이터
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
    near = np.argsort(-(C @ q))[:n_probe]               # 가까운 칸 n_probe개만 연다
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

칸 하나만 열면 전수 비교의 2%만 비교하지만 실제 상위 10개 중 61%만 찾는다. 4칸이면 84%, 16칸이면 97%다. 비교 횟수가 4배씩 늘 때마다 재현율이 오르다가 점점 포화한다. 서비스에서는 목표 재현율(예: 0.95)을 정하고 그것을 만족하는 가장 작은 $n_\text{probe}$를 고른다.

[[diagram:ivf-recall-cost]]

### HNSW: 그래프를 타고 내려간다

**HNSW(Hierarchical Navigable Small World)**는 벡터마다 가까운 이웃 몇 개와 연결선을 이어 그래프를 만들고, 이 그래프를 여러 층으로 쌓는다. 위층일수록 노드가 적고 연결이 멀리 뻗어 있어 대략적인 위치로 빠르게 이동할 수 있고, 아래층으로 내려갈수록 노드가 촘촘해져 정밀하게 좁혀 간다. 검색은 맨 위층의 진입점에서 출발해 "지금보다 질의에 더 가까운 이웃이 있으면 그쪽으로 이동"을 반복하다가, 더 가까워지지 않으면 한 층 내려간다.

\`\`\`image
src: /images/week7/hnsw-index-structure.png
alt: HNSW(계층적 탐색 가능한 소규모 세계) 그래프의 3개 층 구조와 질의 벡터로부터 최근접 이웃을 좁혀가는 과정
caption: 상위 층(Layer 2)일수록 노드가 적고 연결이 성겨 대략적인 위치를 빠르게 찾고, 하위 층(Layer 0)으로 내려갈수록 노드가 촘촘해져 최근접 이웃을 정밀하게 좁혀간다.
credit: Rose electric, CC BY 4.0, Wikimedia Commons
width: 960
height: 404
\`\`\`


주요 하이퍼파라미터는 노드당 연결 수 $M$(클수록 정확하고 메모리가 더 든다)과 검색할 때 유지하는 후보 수 efSearch(클수록 정확하고 느리다)다. HNSW는 칸을 미리 학습할 필요가 없고 재현율-속도 곡선이 좋아 가장 널리 쓰이지만, 벡터마다 이웃 연결을 저장하므로 메모리가 더 들고(FAISS 기준 벡터당 약 $8M$바이트) 벡터를 지우거나 바꾸기가 까다롭다.

### 메모리를 줄이는 PQ

벡터 1억 개를 float32로 307GB나 들고 있기 어렵다면 벡터 자체를 압축한다. **PQ(Product Quantization)**는 768차원 벡터를 8차원짜리 조각 96개로 나누고, 조각마다 미리 학습한 대표 벡터 256개 중 가장 가까운 것의 번호(1바이트)만 저장한다. 벡터 하나가 3,072바이트에서 96바이트로 32분의 1이 되고(1억 개면 약 9.6GB), 거리는 조각별 거리 표를 더해 근사한다. 수십억 개 규모에서는 IVF와 PQ를 함께 쓰는 IVF-PQ가 표준이다. 압축할수록 거리가 부정확해지므로, PQ로 넉넉히 후보를 뽑은 뒤 원래 벡터로 다시 정렬하는 경우가 많다.

[[diagram:pq-compression]]

### 인덱스와 데이터베이스

이런 ANN 인덱스를 실제 서비스에 올리려면 벡터를 영속적으로 저장하고 인덱스를 구축·갱신하고 질의를 처리하는 인프라가 필요한데, 이 역할을 하는 것이 **벡터 데이터베이스(Vector Database)**다(Pinecone, Weaviate, Milvus, pgvector 등). **FAISS**(Facebook AI Similarity Search)는 이 중에서도 IVF·HNSW 같은 ANN 인덱스 구현 자체를 제공하는 오픈소스 라이브러리로, 완결된 데이터베이스라기보다는 벡터 데이터베이스들이 내부 엔진으로 가져다 쓰거나 소규모 프로토타입에서 벡터 DB 없이 인메모리로 직접 불러 쓰는 용도로 널리 쓰인다.

| 규모 | 출발점으로 삼을 만한 선택 |
| --- | --- |
| 벡터 수십만~백만 개 | 전수 비교(FAISS의 Flat 인덱스, pgvector의 정확 검색). 재현율 100% |
| 수백만~수억 개 | HNSW 또는 IVF. 재현율 목표(예: 0.95)를 정하고 efSearch·$n_\text{probe}$를 맞춘다 |
| 수억 개 이상, 메모리가 병목 | IVF-PQ. 압축된 거리로 후보를 넉넉히 뽑고 원래 벡터로 다시 정렬 |

### 메타데이터 필터: 거르는 순서가 결과를 바꾼다

실무 검색은 "이 질문과 가장 가까우면서 2024년에 작성되었고 이 사용자가 볼 권한이 있는 문서"처럼 유사도에 정형 조건을 함께 건다. 이것을 **메타데이터 필터링(Metadata Filtering)**이라 하는데, 언제 거르느냐에 따라 결과가 크게 달라진다.

- **사후 필터(post-filter):** ANN으로 상위 $k'$개를 먼저 뽑은 뒤 조건에 맞지 않는 것을 버린다. 조건을 통과하는 문서의 비율(선택도)이 $s$이면 평균 $k' s$개만 남는다. 상위 100개를 뽑아도 $s = 0.02$면 평균 2개이고, 하나도 남지 않는 질의도 생긴다.
- **사전 필터(pre-filter):** 조건을 통과하는 문서 안에서만 검색한다. 결과 개수는 보장되지만, 통과한 문서만 남긴 그래프는 연결이 끊겨 HNSW 탐색이 길을 잃을 수 있다. 그래서 벡터 DB들은 필터를 탐색 중에 함께 적용하는 전용 알고리즘을 두거나, 통과 문서가 적으면 그 안에서 전수 비교로 바꾼다.

[[diagram:filter-order]]

권한 필터는 특히 조심해야 한다. "이 사용자가 볼 수 없는 문서는 무시하라"고 LLM에게 부탁하는 것은 필터가 아니다. 권한이 없는 문서는 검색 단계에서 아예 빠져서 프롬프트에 들어가지 않아야 한다.

### 재순위화: 빠른 1차 검색과 정확한 2차 검색

임베딩 검색은 질문과 문서를 **따로** 벡터로 만든 뒤(bi-encoder) 내적 한 번으로 비교한다. 문서 벡터는 미리 계산해 둘 수 있어 빠르지만, 질문의 단어와 문서의 단어가 서로를 직접 "보는" 일은 없다. **재순위화(Reranking)** 모델(cross-encoder)은 질문과 문서를 하나의 입력으로 이어 붙여 Transformer에 통과시키므로, 5주차의 어텐션이 질문 토큰과 문서 토큰 사이에서 바로 작동해 훨씬 정확하다. 대신 문서 벡터를 미리 계산해 둘 수 없어서, 후보 100개를 재정렬하면 질의 하나마다 Transformer 순전파가 100번 필요하다. 그래서 두 단계로 나눈다.

1. **1차 검색(재현율 담당):** ANN·하이브리드 검색으로 후보 50~200개를 빠르게 뽑는다. 평가는 Recall@$k'$로 한다. 정답이 여기 들지 못하면 2단계가 아무리 좋아도 되살릴 수 없다.
2. **2차 정렬(정밀도 담당):** 재순위화 모델로 후보만 다시 정렬해 상위 3~5개를 프롬프트에 넣는다. 평가는 MRR이나 nDCG처럼 **순위**를 보는 지표로 한다.

[[diagram:rerank-two-stage]]

핵심 과정 「검색 품질 지표」에서 이름만 소개한 **nDCG**가 여기서 쓰인다. 관련도가 "완벽히 답함(3)"부터 "무관(0)"까지 등급으로 매겨져 있을 때, $i$위 문서의 관련도 $\text{rel}_i$를 순위가 낮을수록 할인해 더한다.

\`\`\`math
\text{DCG@}k = \sum_{i=1}^{k} \dfrac{\text{rel}_i}{\log_2(i + 1)}, \qquad \text{nDCG@}k = \dfrac{\text{DCG@}k}{\text{IDCG@}k}
\`\`\`

IDCG는 같은 문서들을 관련도 순으로 완벽하게 정렬했을 때의 DCG라서, nDCG는 0에서 1 사이 값이 된다. MRR이 "첫 정답의 순위"만 본다면, nDCG는 상위 $k$개 전체의 순서와 관련도 등급을 함께 본다. 실전에서는 LLM에게 후보 목록을 통째로 주고 순서를 매기게 하는 LLM 재순위화도 쓰는데, 정확하지만 비용이 더 크다.

:::example nDCG를 손으로
재순위화 모델이 낸 상위 4개의 관련도가 순서대로 [3, 2, 0, 1]이라 하자.

- DCG@4 $= \frac{3}{\log_2 2} + \frac{2}{\log_2 3} + \frac{0}{\log_2 4} + \frac{1}{\log_2 5} \approx 3 + 1.262 + 0 + 0.431 = 4.693$
- 이상적인 순서 [3, 2, 1, 0]의 IDCG@4 $\approx 3 + 1.262 + 0.5 + 0 = 4.762$
- nDCG@4 $\approx 4.693 / 4.762 \approx 0.985$

3위와 4위만 뒤바뀐 정도라 점수가 거의 1이다. 순위가 낮은 자리일수록 할인이 커서, 아래쪽 실수는 위쪽 실수보다 덜 깎인다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "IVF에서 칸 64개 중 가까운 4개만 열어 검색할 때 일어나는 일로 옳은 것은?",
      choices: ["항상 전수 비교와 같은 결과를 낸다", "비교하는 문서는 약 6%로 줄지만, 경계 근처의 실제 이웃이 열지 않은 칸에 있으면 놓친다", "칸을 적게 열수록 재현율이 오른다", "질의와 가장 먼 칸부터 연다"],
      answer: 1,
      explanation: "한 실험에서 $n_\\text{probe} = 4$는 문서의 약 6.3%만 비교하고 Recall@10 0.838을 얻었다. $n_\\text{probe}$를 늘리면 재현율과 비용이 함께 오른다.",
    },
    {
      key: "c2",
      question: "조건을 통과하는 문서가 2%일 때, ANN으로 상위 100개를 먼저 뽑은 뒤 조건으로 거르면(사후 필터) 평균 몇 개가 남는가?",
      choices: ["100개", "약 50개", "약 2개", "항상 10개"],
      answer: 2,
      explanation: "평균 $k' s = 100 \\times 0.02 = 2$개다. 하나도 남지 않는 질의도 생긴다(대략 $e^{-2} \\approx 14\\%$). 결과 개수를 보장하려면 사전 필터나 필터를 함께 적용하는 검색을 쓴다.",
    },
    {
      key: "c3",
      question: "Hybrid Search와 Reranking을 함께 쓸 때의 올바른 순서는?",
      choices: ["Reranking으로 전체 문서를 정렬한 뒤 Hybrid Search", "Hybrid Search로 후보를 넓게 뽑은 뒤, 소수 후보에만 무거운 Reranking", "둘은 같은 기법이다", "순서는 상관없다"],
      answer: 1,
      explanation: "cross-encoder 재순위화는 질문과 문서를 한 쌍으로 Transformer에 넣으므로 후보마다 순전파가 필요해 비싸다. 1차 검색(재현율 담당)으로 좁힌 수십~수백 개에만 적용한다(정밀도 담당).",
    },
    {
      key: "c4",
      question: "벡터 100만 개를 IVF로 1,000칸에 나누고 $n_\\text{probe} = 10$으로 검색하면 질의당 비교하는 벡터(중심 포함)는 약 몇 개인가?",
      choices: ["약 11,000개", "약 1,000개", "약 10,000개", "1,000,000개"],
      answer: 0,
      explanation: "중심 1,000개와 비교하고, 열어 본 칸 10개 속 벡터(칸당 평균 1,000개) 10,000개와 비교해 모두 약 11,000개다. 전수 비교의 약 1.1%다.",
    },
    {
      key: "c5",
      question: "재순위화 결과의 관련도가 [3, 2, 1, 0] 순서(가장 관련 있는 것부터 완벽하게 정렬)라면 nDCG@4는?",
      choices: ["1", "0.5", "0", "0.985"],
      answer: 0,
      explanation: "이미 이상적인 순서라 DCG와 IDCG가 같아 nDCG = 1이다. nDCG는 0에서 1 사이 값이며 1이 완벽한 정렬이다.",
    },
    {
      key: "c6",
      question: "권한 필터를 통과하는 문서가 전체의 1%다. ANN으로 상위 $k'$개를 먼저 뽑은 뒤 필터로 거르는 사후 필터로 결과 10개를 **평균적으로** 채우려면 $k'$는 대략 얼마여야 하는가?",
      choices: ["10개", "100개", "약 1,000개", "약 100만 개"],
      answer: 2,
      explanation: "사후 필터 뒤에 남는 개수의 평균은 $k' s$이므로 $k' = 10 / 0.01 = 1{,}000$입니다. 평균이 10이라는 것은 절반 가까운 질의에서 10개가 안 된다는 뜻이라, 실제로는 더 넉넉히 뽑거나 사전 필터(필터를 통과한 문서 안에서 검색)를 씁니다. 권한 필터는 LLM에게 '무시하라'고 부탁하는 것이 아니라 검색 단계에서 반드시 적용해야 합니다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
n, d, nlist, nprobe = 1_000_000, 768, 1000, 10
brute = n * d                                   # 전수 비교의 곱셈 수
ivf = d * (nlist + nprobe * n // nlist)         # 중심과의 비교 + 열어 본 칸의 문서
print(ivf // d, round(brute / ivf))
`,
      expected: "11000 91",
      explanation: "중심 1,000개와 비교하고, 칸 1,000개 중 10개(칸당 평균 1,000개)를 열어 문서 10,000개를 비교하므로 질의당 벡터 11,000개와만 비교합니다. 전수 비교(100만 개)보다 약 91배 적습니다. 대가는 열지 않은 칸에 있던 실제 이웃을 놓칠 수 있다는 것입니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "FAISS와 벡터 데이터베이스(Vector Database)는 정확히 어떤 관계인가?",
      answer: md`
FAISS는 ANN 인덱스 알고리즘 자체를 구현한 라이브러리이고, Vector Database는 그런 인덱스에 더해 데이터 저장·영속성·메타데이터 필터링 같은 인프라 기능까지 포함한 서비스다(내부적으로 FAISS 같은 라이브러리를 엔진으로 쓰기도 한다).
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "Hybrid Search와 Reranking은 각각 무엇을 결합/재정렬하는 기법인가? 두 기법을 함께 쓴다면 파이프라인상 어떤 순서로 적용해야 하며 그 이유는?",
      answer: md`
먼저 Hybrid Search(Dense+Sparse)로 비용이 적게 드는 방식으로 후보 문서를 넓게 확보한 뒤, 더 정밀하지만 계산 비용이 큰 Reranking 모델로 그 소수의 후보만 정밀하게 재정렬한다. 처음부터 모든 문서에 비싼 재정렬 모델을 적용하면 비용이 감당할 수 없이 커지기 때문에 이런 2단계 구조를 쓴다.
`,
      keyPoints: [],
    },
    {
      key: "d3",
      question: "IVF 인덱스에서 $n_\\text{probe}$를 늘리면 재현율과 비용이 각각 어떻게 변하는가? 필터를 통과하는 문서가 2%뿐일 때 상위 100개를 뽑은 뒤 거르는(사후 필터) 방식의 문제를 숫자로 설명하라.",
      answer: md`
IVF는 벡터를 k-means로 $n_\text{list}$개의 칸에 나눠 두고, 질의와 가까운 칸 $n_\text{probe}$개만 열어 그 안의 벡터만 비교한다. $n_\text{probe}$를 늘리면 진짜 최근접 이웃이 열지 않은 옆 칸에 있어서 놓치는 경우가 줄어 재현율이 오르지만, 비교하는 벡터 수(질의당 약 $d(n_\text{list} + n_\text{probe} \cdot n/n_\text{list})$번의 곱셈)도 비례해 늘어난다. 예를 들어 칸 64개 중 1개를 열면 Recall@10 0.564(곱셈 2.2%), 4개면 0.838(6.6%), 16개면 0.977(25.3%)였다. 사후 필터는 ANN으로 상위 $k'$개를 뽑은 뒤 조건으로 거르므로 평균 $k' s$개만 남는다. 통과율 $s = 0.02$, $k' = 100$이면 평균 2개이고, 하나도 남지 않는 질의도 대략 $e^{-2} \approx 14\%$ 생긴다. 사전 필터(조건을 통과한 문서 안에서 검색)나 필터를 탐색 중에 함께 적용하는 검색을 써야 결과 개수가 보장된다.
`,
      keyPoints: [],
    },
    {
      key: "d4",
      question: "1차 검색과 재순위화로 나눈 2단계 검색을 설계하십시오. bi-encoder와 cross-encoder의 차이와 비용, 각 단계를 어떤 지표로 평가하는지, 1차 후보 수를 너무 작게 잡으면 생기는 문제를 적으십시오.",
      answer: md`
bi-encoder(임베딩 검색)는 질문과 문서를 따로 벡터로 만들어 내적으로 비교하므로 문서 벡터를 미리 계산하고 ANN으로 수백만 개에서 빠르게 후보를 뽑을 수 있지만, 질문과 문서의 단어가 서로를 직접 보지 못해 정밀도가 떨어집니다. cross-encoder는 질문과 문서를 하나의 입력으로 Transformer에 넣어 어텐션이 둘 사이에서 직접 작동하므로 정확하지만, 후보마다 순전파가 필요해 수백 개 이상에 쓰기 어렵습니다. 그래서 1차로 ANN·하이브리드 검색이 후보 50~200개를 뽑고(재현율 담당, Recall@k′로 평가), 2차로 재순위화 모델이 후보만 다시 정렬해 상위 몇 개를 프롬프트에 넣습니다(정밀도 담당, MRR·nDCG로 평가). 1차 후보 수가 너무 작으면 정답이 후보에 들지 못하고, 재순위화는 후보에 없는 문서를 되살릴 수 없으므로 2단계가 아무리 좋아도 전체 성능이 1차 재현율에 묶입니다.
`,
      keyPoints: ["bi-encoder: 따로 인코딩, 미리 계산·빠름, 상호작용 없음", "cross-encoder: 함께 인코딩, 정확하지만 후보마다 순전파", "1차는 Recall@k′, 2차는 MRR·nDCG로 평가", "1차에서 놓친 정답은 재순위화로 되살릴 수 없다"],
    },
  ],
  references: [
    { title: "FAISS — Guidelines to choose an index", url: "https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index", note: "규모·메모리별 인덱스 선택과 IVF 칸 수($4\\sqrt{n}$~$16\\sqrt{n}$)의 근거" },
    { title: "Malkov & Yashunin (2016) — HNSW", url: "https://arxiv.org/abs/1603.09320", note: "층을 쌓은 근접 그래프 탐색의 원 논문" },
    { title: "Pinecone — Hierarchical Navigable Small Worlds (HNSW)", url: "https://www.pinecone.io/learn/series/faiss/hnsw/", note: "HNSW의 층 구조를 그림으로 (영문)" },
    { title: "Nogueira & Cho (2019) — Passage Re-ranking with BERT", url: "https://arxiv.org/abs/1901.04085", note: "cross-encoder 재순위화를 처음 크게 보인 논문" },
  ],
});
