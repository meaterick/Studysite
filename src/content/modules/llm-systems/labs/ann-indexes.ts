import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "IVF 인덱스로 검색하고 nprobe에 따른 재현율·비용 재기",
    prompt: md`

「실전 벡터 검색」의 IVF 인덱스를 직접 완성합니다. 문서 벡터 \`X\`(4,000개, 단위벡터), k-means로 만든 칸의 중심 \`C\`(32개), 문서마다 속한 칸 번호 \`assign\`, 질의 \`Q\`(50개)와 정답 \`exact\`(질의마다 전수 비교 상위 10개의 문서 번호)는 이미 주어져 있습니다.

1. \`build_lists(assign, nlist)\`: 칸마다 그 칸에 속한 문서 번호 배열을 담은 리스트(역색인). \`lists[c]\`는 \`assign == c\`인 문서 번호들입니다.
2. \`ivf_search(q, k, nprobe)\`: 질의와 내적이 큰 순서로 칸 \`nprobe\`개를 고르고, 그 칸들의 문서만 비교해 내적 상위 \`k\`개의 문서 번호(내적 내림차순)와 **비교한 문서 수**를 \`(ids, n_scanned)\`로 돌려줍니다.
3. \`recall_at_k(found, exact)\`: 정답 \`exact\` 중 \`found\`에 들어 있는 비율.

다 풀었다면 \`nprobe\`를 1, 2, 4, 8, 32로 바꾸며 평균 재현율과 비교한 문서 비율을 표로 출력해 보십시오.
`,
    starter: py`
import numpy as np
rng = np.random.default_rng(0)
n, d, nlist = 4000, 16, 32
centers = rng.normal(size=(20, d))
X = centers[rng.integers(20, size=n)] + 1.5 * rng.normal(size=(n, d))
X /= np.linalg.norm(X, axis=1, keepdims=True)
Q = centers[rng.integers(20, size=50)] + 1.5 * rng.normal(size=(50, d))
Q /= np.linalg.norm(Q, axis=1, keepdims=True)
C = X[rng.choice(n, nlist, replace=False)].copy()        # k-means로 만든 칸의 중심(단위벡터)
for _ in range(8):
    assign = np.argmax(X @ C.T, axis=1)
    for c in range(nlist):
        m = X[assign == c].mean(0)
        C[c] = m / np.linalg.norm(m)
assign = np.argmax(X @ C.T, axis=1)                      # 문서마다 속한 칸 번호
exact = np.argsort(-(Q @ X.T), axis=1)[:, :10]           # 정답: 전수 비교 상위 10개

def build_lists(assign, nlist):
    return [np.array([], dtype=int) for _ in range(nlist)]  # TODO: 칸마다 assign == c인 문서 번호

def ivf_search(q, k, nprobe):
    # TODO: 질의와 가까운 칸 nprobe개 → 그 칸들의 문서만 비교 → 상위 k개와 비교한 문서 수
    return np.arange(k), 0

def recall_at_k(found, exact):
    return 0.0  # TODO

lists = build_lists(assign, nlist)
for nprobe in (1, 2, 4, 8, 32):
    rec = np.mean([recall_at_k(ivf_search(q, 10, nprobe)[0], ex) for q, ex in zip(Q, exact)])
    scanned = np.mean([ivf_search(q, 10, nprobe)[1] for q in Q]) / n
    print(f"nprobe {nprobe:2d}: Recall@10 {rec:.3f}, 비교한 문서 {scanned:.1%}")
`,
    tests: py`
import numpy as np
rng = np.random.default_rng(0)
n, d, nlist = 4000, 16, 32
centers = rng.normal(size=(20, d))
X = centers[rng.integers(20, size=n)] + 1.5 * rng.normal(size=(n, d))
X /= np.linalg.norm(X, axis=1, keepdims=True)
Q = centers[rng.integers(20, size=50)] + 1.5 * rng.normal(size=(50, d))
Q /= np.linalg.norm(Q, axis=1, keepdims=True)
C = X[rng.choice(n, nlist, replace=False)].copy()        # k-means로 만든 칸의 중심(단위벡터)
for _ in range(8):
    assign = np.argmax(X @ C.T, axis=1)
    for c in range(nlist):
        m = X[assign == c].mean(0)
        C[c] = m / np.linalg.norm(m)
assign = np.argmax(X @ C.T, axis=1)                      # 문서마다 속한 칸 번호
exact = np.argsort(-(Q @ X.T), axis=1)[:, :10]           # 정답: 전수 비교 상위 10개
lists = build_lists(assign, nlist)

@test("역색인: 모든 문서가 정확히 한 칸에 들어 있다")
def _():
    assert len(lists) == nlist, f"칸 수 {len(lists)}"
    allids = np.sort(np.concatenate(lists))
    assert len(allids) == n and (allids == np.arange(n)).all(), "어떤 문서가 빠졌거나 두 번 들어갔습니다."
    assert all((assign[l] == c).all() for c, l in enumerate(lists))

@test("칸을 모두 열면 전수 비교와 같다")
def _():
    for q, ex in zip(Q[:10], exact[:10]):
        ids, m = ivf_search(q, 10, nlist)
        assert m == n and list(ids) == list(ex), f"비교한 문서 {m}, 결과 {list(ids)} / 정답 {list(ex)}"

@test("비교한 문서 수 = 가장 가까운 칸 nprobe개의 크기 합")
def _():
    q = Q[0]
    near = np.argsort(-(C @ q))[:3]
    ids, m = ivf_search(q, 10, 3)
    assert m == sum(len(lists[c]) for c in near), f"비교한 문서 {m}"
    assert set(assign[ids]) <= set(near.tolist()), "열지 않은 칸의 문서가 결과에 들어 있습니다."
    s = X[ids] @ q
    assert (np.diff(s) <= 1e-12).all(), "결과가 내적 내림차순이 아닙니다."

@test("nprobe를 늘리면 재현율이 줄지 않는다(1개 ≈ 0.50, 8개 ≈ 0.96)")
def _():
    rec = [np.mean([recall_at_k(ivf_search(q, 10, p)[0], ex) for q, ex in zip(Q, exact)]) for p in (1, 2, 4, 8, 32)]
    assert all(a <= b + 1e-12 for a, b in zip(rec, rec[1:])), np.round(rec, 3)
    assert approx(rec[0], 0.496, 0.03) and approx(rec[3], 0.958, 0.03) and approx(rec[4], 1.0), np.round(rec, 3)
    assert approx(recall_at_k(np.array([1, 2, 3]), np.array([3, 4, 5])), 1 / 3)
`,
    hints: ["`[np.where(assign == c)[0] for c in range(nlist)]`. 한 번만 만들어 두면 질의마다 칸 안의 문서 번호를 바로 꺼낼 수 있습니다(역색인).", "`probe = np.argsort(-(C @ q))[:nprobe]`, `cand = np.concatenate([lists[c] for c in probe])`, `order = np.argsort(-(X[cand] @ q))[:k]` 다음 `return cand[order], len(cand)`. `order`는 `cand` 안에서의 위치이므로 `cand[order]`로 원래 문서 번호로 바꿉니다.", "`len(set(found.tolist()) & set(exact.tolist())) / len(exact)`. 실제 상위 10개가 나머지 모든 문서보다 내적이 크므로, 더 많은 칸을 열어 비교 대상이 늘면 이미 찾은 정답은 결과에서 밀려나지 않습니다. 그래서 재현율은 nprobe에 대해 줄지 않습니다."],
    solution: py`
import numpy as np
rng = np.random.default_rng(0)
n, d, nlist = 4000, 16, 32
centers = rng.normal(size=(20, d))
X = centers[rng.integers(20, size=n)] + 1.5 * rng.normal(size=(n, d))
X /= np.linalg.norm(X, axis=1, keepdims=True)
Q = centers[rng.integers(20, size=50)] + 1.5 * rng.normal(size=(50, d))
Q /= np.linalg.norm(Q, axis=1, keepdims=True)
C = X[rng.choice(n, nlist, replace=False)].copy()        # k-means로 만든 칸의 중심(단위벡터)
for _ in range(8):
    assign = np.argmax(X @ C.T, axis=1)
    for c in range(nlist):
        m = X[assign == c].mean(0)
        C[c] = m / np.linalg.norm(m)
assign = np.argmax(X @ C.T, axis=1)                      # 문서마다 속한 칸 번호
exact = np.argsort(-(Q @ X.T), axis=1)[:, :10]           # 정답: 전수 비교 상위 10개

def build_lists(assign, nlist):
    return [np.where(assign == c)[0] for c in range(nlist)]

def ivf_search(q, k, nprobe):
    probe = np.argsort(-(C @ q))[:nprobe]
    cand = np.concatenate([lists[c] for c in probe])
    order = np.argsort(-(X[cand] @ q))[:k]
    return cand[order], len(cand)

def recall_at_k(found, exact):
    return len(set(found.tolist()) & set(exact.tolist())) / len(exact)

lists = build_lists(assign, nlist)
for nprobe in (1, 2, 4, 8, 32):
    rec = np.mean([recall_at_k(ivf_search(q, 10, nprobe)[0], ex) for q, ex in zip(Q, exact)])
    scanned = np.mean([ivf_search(q, 10, nprobe)[1] for q in Q]) / n
    print(f"nprobe {nprobe:2d}: Recall@10 {rec:.3f}, 비교한 문서 {scanned:.1%}")
`,
  },
]);
