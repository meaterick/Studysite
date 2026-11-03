import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "함께 나온 횟수로 단어 임베딩 만들기",
    prompt: md`
비슷한 문맥에 나오는 단어는 의미도 비슷하다는 분포 가설을 코드로 확인합니다.

1. \`build_vocab(sents)\`: 모든 문장의 단어를 **정렬한** 리스트와 \`{단어: 번호}\` 딕셔너리
2. \`cooccurrence(sents, idx)\`: 같은 문장 안의 서로 다른 위치에 함께 나온 횟수를 센 $|V| \times |V|$ 행렬
3. \`embed(C, d)\`: SVD $C = U S V^\top$에서 \`U[:, :d] * S[:d]\`로 $d$차원 밀집 벡터를 만듭니다.

단어가 비슷하다는 정보를 따로 주지 않아도 고양이·강아지, 자동차·버스의 벡터가 가까워지는지 확인합니다.
`,
    starter: py`
corpus = [
    "고양이 생선 먹는다", "강아지 고기 먹는다", "고양이 우유 마신다", "강아지 물 마신다",
    "고양이 소파 잔다", "강아지 마당 잔다", "고양이 강아지 동물", "강아지 귀엽다", "고양이 귀엽다",
    "자동차 도로 달린다", "버스 도로 달린다", "자동차 기름 넣는다", "버스 기름 넣는다",
    "자동차 버스 탈것", "버스 정류장 선다", "자동차 주차장 선다",
    "고양이 자동차 위 잔다",
]
sents = [s.split() for s in corpus]
import numpy as np

def build_vocab(sents):
    vocab = []   # TODO: 정렬된 고유 단어 리스트
    idx = {}     # TODO: {단어: 번호}
    return vocab, idx

def cooccurrence(sents, idx):
    C = np.zeros((len(idx), len(idx)))
    # TODO: 문장마다 서로 다른 위치 i != j의 단어 쌍 (w_i, w_j)를 셉니다.
    return C

def embed(C, d):
    return np.zeros((C.shape[0], d))  # TODO

vocab, idx = build_vocab(sents)
E = embed(cooccurrence(sents, idx), 3)
def cos(a, b):
    va, vb = E[idx[a]], E[idx[b]]
    return va @ vb / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-12)
for a, b in [("고양이", "강아지"), ("자동차", "버스"), ("고양이", "자동차")]:
    print(a, b, round(float(cos(a, b)), 2))
`,
    tests: py`
import numpy as np

@test("어휘 사전: 정렬된 고유 단어, 번호가 위치와 일치")
def _():
    vocab, idx = build_vocab([["b", "a"], ["a", "c"]])
    assert vocab == ["a", "b", "c"] and idx == {"a": 0, "b": 1, "c": 2}, f"{vocab}, {idx}"

@test("공기행렬: 대칭, 자기 자신은 0, 개수 정확")
def _():
    s = [["a", "b", "c"], ["a", "b"]]
    vocab, idx = build_vocab(s)
    C = cooccurrence(s, idx)
    assert approx(C, C.T) and approx(np.diag(C), [0, 0, 0])
    assert C[idx["a"], idx["b"]] == 2 and C[idx["a"], idx["c"]] == 1, f"C:\n{C}"

@test("embed: shape (|V|, d), U·S의 앞 d열")
def _():
    C = np.array([[0, 2, 1], [2, 0, 1], [1, 1, 0]], dtype=float)
    E = embed(C, 2)
    U, S, _ = np.linalg.svd(C)
    assert np.shape(E) == (3, 2) and approx(np.abs(E), np.abs(U[:, :2] * S[:2]))

@test("고양이·강아지가 고양이·자동차보다 가깝다")
def _():
    vocab, idx = build_vocab(sents)
    E = embed(cooccurrence(sents, idx), 3)
    c = lambda a, b: E[idx[a]] @ E[idx[b]] / (np.linalg.norm(E[idx[a]]) * np.linalg.norm(E[idx[b]]))
    assert c("고양이", "강아지") > 0.8 and c("자동차", "버스") > 0.8 and c("고양이", "자동차") < c("고양이", "강아지") - 0.3
`,
    hints: ["`vocab = sorted({w for s in sents for w in s})`, `idx = {w: i for i, w in enumerate(vocab)}`", "이중 반복문 `for i, w in enumerate(s): for j, c in enumerate(s): if i != j: C[idx[w], idx[c]] += 1`", "`U, S, Vt = np.linalg.svd(C)` 다음 `U[:, :d] * S[:d]`(브로드캐스팅으로 열마다 특잇값을 곱함)"],
    solution: py`
corpus = [
    "고양이 생선 먹는다", "강아지 고기 먹는다", "고양이 우유 마신다", "강아지 물 마신다",
    "고양이 소파 잔다", "강아지 마당 잔다", "고양이 강아지 동물", "강아지 귀엽다", "고양이 귀엽다",
    "자동차 도로 달린다", "버스 도로 달린다", "자동차 기름 넣는다", "버스 기름 넣는다",
    "자동차 버스 탈것", "버스 정류장 선다", "자동차 주차장 선다",
    "고양이 자동차 위 잔다",
]
sents = [s.split() for s in corpus]
import numpy as np

def build_vocab(sents):
    vocab = sorted({w for s in sents for w in s})
    idx = {w: i for i, w in enumerate(vocab)}
    return vocab, idx

def cooccurrence(sents, idx):
    C = np.zeros((len(idx), len(idx)))
    for s in sents:
        for i, w in enumerate(s):
            for j, c in enumerate(s):
                if i != j:
                    C[idx[w], idx[c]] += 1
    return C

def embed(C, d):
    U, S, Vt = np.linalg.svd(C)
    return U[:, :d] * S[:d]

vocab, idx = build_vocab(sents)
E = embed(cooccurrence(sents, idx), 3)
def cos(a, b):
    va, vb = E[idx[a]], E[idx[b]]
    return va @ vb / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-12)
for a, b in [("고양이", "강아지"), ("자동차", "버스"), ("고양이", "자동차")]:
    print(a, b, round(float(cos(a, b)), 2))
`,
  },
]);
