import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "BM25를 직접 구현하고 RRF로 Dense와 합치기",
    prompt: md`

「임베딩과 벡터 검색」 단계의 Sparse 검색(BM25)과 하이브리드(RRF)를 직접 구현합니다. Dense 검색 \`dense(q)\`는 간단한 개념 벡터로 이미 주어져 있습니다.

1. \`idf(w)\`: $\log\left(\dfrac{N - df(w) + 0.5}{df(w) + 0.5} + 1\right)$. $df(w)$는 단어 $w$가 들어 있는 문서 수, $N$은 문서 수입니다.
2. \`bm25(query, k1=1.5, b=0.75)\`: 문서마다 질의 단어 $w$에 대해 $\text{idf}(w) \cdot \dfrac{tf\,(k_1 + 1)}{tf + k_1\,(1 - b + b\,|d| / \text{avgdl})}$를 더한 점수 배열. $tf$는 문서 속 $w$의 등장 횟수, $|d|$는 문서 길이(토큰 수), avgdl은 평균 문서 길이입니다.
3. \`rrf(*scores, k=60)\`: 각 검색기의 점수를 순위(1부터)로 바꿔 $\sum 1/(k + \text{rank})$를 더합니다. 점수가 0인(그 검색기가 찾지 못한) 문서는 더하지 않습니다.
`,
    starter: py`
import numpy as np
from collections import Counter

docs = [
    "노트북 모델 XK-2031 배터리 12시간 지속",
    "노트북 모델 XK-2030 단종 수리 부품 판매",
    "휴대용 컴퓨터 전원 오래 유지 화면 밝기 조절",
    "자동차 배터리 겨울 방전 주의",
    "승용차 연비 향상 타이어 공기압 점검",
]
toks = [d.split() for d in docs]

# Dense(간단한 예시): 차원 [컴퓨터, 자동차, 전력, 효율, 판매]
concept = {
    "노트북": [1, 0, 0, 0, 0], "휴대용": [.6, 0, 0, 0, 0], "컴퓨터": [1, 0, 0, 0, 0],
    "자동차": [0, 1, 0, 0, 0], "승용차": [0, 1, 0, 0, 0], "차": [0, 1, 0, 0, 0],
    "배터리": [0, 0, 1, 0, 0], "전원": [0, 0, 1, 0, 0], "방전": [0, 0, .8, 0, 0], "충전": [0, 0, .8, 0, 0],
    "오래": [0, 0, 0, 1, 0], "지속": [0, 0, 0, 1, 0], "연비": [0, 0, 0, 1, 0], "유지": [0, 0, 0, .6, 0],
    "판매": [0, 0, 0, 0, 1], "단종": [0, 0, 0, 0, .6],
}
def embed(text):
    vs = [concept[w] for w in text.split() if w in concept]
    v = np.sum(vs, axis=0) if vs else np.zeros(5)
    return v / (np.linalg.norm(v) + 1e-9)
D = np.stack([embed(d) for d in docs])
dense = lambda q: D @ embed(q)

def idf(w):
    return 0.0  # TODO: df(w)를 세어 BM25의 IDF를 계산합니다.

def bm25(query, k1=1.5, b=0.75):
    avgdl = np.mean([len(t) for t in toks])
    s = np.zeros(len(toks))
    # TODO: 질의 단어마다, 문서마다 tf와 길이 정규화를 반영한 점수를 더합니다.
    return s

def rrf(*scores, k=60):
    fused = np.zeros(len(docs))
    # TODO: 점수 → 순위(1부터), 점수 > 0인 문서에만 1 / (k + rank)를 더합니다.
    return fused

for q in ["XK-2030 수리", "차 충전 금방 닳음"]:
    sp, de = bm25(q), dense(q)
    print(q, "| BM25", np.round(sp, 3), "| Dense", np.round(de, 3), "| Hybrid 1위:", docs[int(np.argmax(rrf(sp, de)))])
`,
    tests: py`
import numpy as np
from collections import Counter

docs = [
    "노트북 모델 XK-2031 배터리 12시간 지속",
    "노트북 모델 XK-2030 단종 수리 부품 판매",
    "휴대용 컴퓨터 전원 오래 유지 화면 밝기 조절",
    "자동차 배터리 겨울 방전 주의",
    "승용차 연비 향상 타이어 공기압 점검",
]
toks = [d.split() for d in docs]

# Dense(간단한 예시): 차원 [컴퓨터, 자동차, 전력, 효율, 판매]
concept = {
    "노트북": [1, 0, 0, 0, 0], "휴대용": [.6, 0, 0, 0, 0], "컴퓨터": [1, 0, 0, 0, 0],
    "자동차": [0, 1, 0, 0, 0], "승용차": [0, 1, 0, 0, 0], "차": [0, 1, 0, 0, 0],
    "배터리": [0, 0, 1, 0, 0], "전원": [0, 0, 1, 0, 0], "방전": [0, 0, .8, 0, 0], "충전": [0, 0, .8, 0, 0],
    "오래": [0, 0, 0, 1, 0], "지속": [0, 0, 0, 1, 0], "연비": [0, 0, 0, 1, 0], "유지": [0, 0, 0, .6, 0],
    "판매": [0, 0, 0, 0, 1], "단종": [0, 0, 0, 0, .6],
}
def embed(text):
    vs = [concept[w] for w in text.split() if w in concept]
    v = np.sum(vs, axis=0) if vs else np.zeros(5)
    return v / (np.linalg.norm(v) + 1e-9)
D = np.stack([embed(d) for d in docs])
dense = lambda q: D @ embed(q)

@test("희귀한 단어일수록 IDF가 크다")
def _():
    assert approx(idf("노트북"), np.log(2.4)) and approx(idf("닳음"), np.log(12)), f"{idf('노트북'):.4f}, {idf('닳음'):.4f}"

@test("제품 코드 질의는 BM25가 정확히 찾는다(문서 1, 점수 ≈ 2.660)")
def _():
    s = bm25("XK-2030 수리")
    assert approx(s, [0, 2.6604, 0, 0, 0], 1e-3), f"결과: {np.round(s, 4)}"

@test("b = 0.75면 같은 단어 수에서 짧은 문서가 높고, b = 0이면 같다")
def _():
    s, s0 = bm25("노트북 배터리"), bm25("노트북 배터리", b=0)
    assert s[3] > s[1] and approx(s0[3], s0[1]), f"b=0.75: {np.round(s, 3)}, b=0: {np.round(s0, 3)}"
    assert approx(s[0], 1.8016, 1e-3), f"문서 0 점수 {s[0]:.4f}"

@test("하이브리드(RRF)는 두 질의 모두 정답 문서를 1위로 올린다")
def _():
    for q, want in [("XK-2030 수리", 1), ("차 충전 금방 닳음", 3)]:
        f = rrf(bm25(q), dense(q))
        assert int(np.argmax(f)) == want, f"{q}: {np.round(f, 4)}"
    f = rrf(bm25("차 충전 금방 닳음"), dense("차 충전 금방 닳음"))
    assert f[1] == 0 and approx(f[3], 1 / 61), f"두 검색기 모두 못 찾은 문서는 0, 결과: {np.round(f, 5)}"
`,
    hints: ["`df = Counter(w for t in toks for w in set(t))`로 문서 빈도를 세면 `idf(w) = np.log((N - df[w] + 0.5) / (df[w] + 0.5) + 1)`입니다. Counter는 없는 단어에 0을 줍니다.", "`for w in query.split():` 안에서 `for i, t in enumerate(toks): tf = t.count(w)` 다음 `s[i] += idf(w) * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(t) / avgdl))`", "순위는 `rank = np.argsort(np.argsort(-s)) + 1`, 더하는 값은 `np.where(s > 0, 1 / (k + rank), 0)`. 점수의 척도가 달라도 순위는 비교할 수 있다는 것이 RRF의 핵심입니다."],
    solution: py`
import numpy as np
from collections import Counter

docs = [
    "노트북 모델 XK-2031 배터리 12시간 지속",
    "노트북 모델 XK-2030 단종 수리 부품 판매",
    "휴대용 컴퓨터 전원 오래 유지 화면 밝기 조절",
    "자동차 배터리 겨울 방전 주의",
    "승용차 연비 향상 타이어 공기압 점검",
]
toks = [d.split() for d in docs]

# Dense(간단한 예시): 차원 [컴퓨터, 자동차, 전력, 효율, 판매]
concept = {
    "노트북": [1, 0, 0, 0, 0], "휴대용": [.6, 0, 0, 0, 0], "컴퓨터": [1, 0, 0, 0, 0],
    "자동차": [0, 1, 0, 0, 0], "승용차": [0, 1, 0, 0, 0], "차": [0, 1, 0, 0, 0],
    "배터리": [0, 0, 1, 0, 0], "전원": [0, 0, 1, 0, 0], "방전": [0, 0, .8, 0, 0], "충전": [0, 0, .8, 0, 0],
    "오래": [0, 0, 0, 1, 0], "지속": [0, 0, 0, 1, 0], "연비": [0, 0, 0, 1, 0], "유지": [0, 0, 0, .6, 0],
    "판매": [0, 0, 0, 0, 1], "단종": [0, 0, 0, 0, .6],
}
def embed(text):
    vs = [concept[w] for w in text.split() if w in concept]
    v = np.sum(vs, axis=0) if vs else np.zeros(5)
    return v / (np.linalg.norm(v) + 1e-9)
D = np.stack([embed(d) for d in docs])
dense = lambda q: D @ embed(q)

df = Counter(w for t in toks for w in set(t))

def idf(w):
    N = len(toks)
    return np.log((N - df[w] + 0.5) / (df[w] + 0.5) + 1)

def bm25(query, k1=1.5, b=0.75):
    avgdl = np.mean([len(t) for t in toks])
    s = np.zeros(len(toks))
    for w in query.split():
        for i, t in enumerate(toks):
            tf = t.count(w)
            s[i] += idf(w) * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(t) / avgdl))
    return s

def rrf(*scores, k=60):
    fused = np.zeros(len(docs))
    for s in scores:
        rank = np.argsort(np.argsort(-s)) + 1
        fused += np.where(s > 0, 1 / (k + rank), 0)
    return fused

for q in ["XK-2030 수리", "차 충전 금방 닳음"]:
    sp, de = bm25(q), dense(q)
    print(q, "| BM25", np.round(sp, 3), "| Dense", np.round(de, 3), "| Hybrid 1위:", docs[int(np.argmax(rrf(sp, de)))])
`,
  },
]);
