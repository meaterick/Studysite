import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "BPE 병합 규칙 학습과 새 단어 토큰화",
    prompt: md`

「토크나이저: BPE」의 알고리즘을 처음부터 구현합니다.

1. \`merge_pair(tokens, pair)\`: 토큰 리스트에서 연속한 \`pair\`를 왼쪽부터 겹치지 않게 하나로 합칩니다.
2. \`train_bpe(words, n_merges)\`: 각 단어를 "글자 + \`</w>\`"로 쪼갠 상태에서, 매번 **가장 자주 나온 인접 쌍**(\`Counter.most_common(1)\`)을 병합 규칙으로 추가하고 말뭉치 전체에 적용합니다. 병합 규칙 리스트를 돌려줍니다.
3. \`bpe_encode(word, merges)\`: 새 단어에 학습된 규칙을 **학습한 순서대로** 적용합니다.

학습에 없던 "slow"가 \`['s', 'low</w>']\`로 잘려야 합니다(OOV 완화).
`,
    starter: py`
from collections import Counter

def merge_pair(tokens, pair):
    merged, i = [], 0
    while i < len(tokens):
        # TODO: tokens[i], tokens[i+1]이 pair면 합쳐서 추가하고 두 칸 전진, 아니면 한 칸
        merged.append(tokens[i])
        i += 1
    return merged

def train_bpe(words, n_merges):
    corpus = [list(w) + ["</w>"] for w in words]
    merges = []
    for _ in range(n_merges):
        pass  # TODO: 인접 쌍 빈도 → 최빈 쌍 → merges에 추가 → corpus의 모든 단어에 merge_pair
    return merges

def bpe_encode(word, merges):
    tokens = list(word) + ["</w>"]
    # TODO
    return tokens

words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]
merges = train_bpe(words, 8)
print(merges)
for w in ["slow", "lowering", "banana"]:
    print(w, bpe_encode(w, merges))
`,
    tests: py`
words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]

@test("merge_pair: 왼쪽부터 겹치지 않게 합친다")
def _():
    assert merge_pair(["a", "a", "a"], ("a", "a")) == ["aa", "a"]
    assert merge_pair(["l", "o", "w", "l", "o"], ("l", "o")) == ["lo", "w", "lo"]

@test("첫 병합 세 개 = (w,e), (l,o), (we,r)")
def _():
    m = train_bpe(words, 8)
    assert len(m) == 8 and m[:3] == [("w", "e"), ("l", "o"), ("we", "r")], f"결과: {m}"

@test("학습에 없던 slow → ['s', 'low</w>']")
def _():
    assert bpe_encode("slow", train_bpe(words, 8)) == ["s", "low</w>"]

@test("lowering은 앞부분만, banana는 글자 단위로")
def _():
    m = train_bpe(words, 8)
    assert bpe_encode("lowering", m) == ["lo", "wer", "i", "n", "g", "</w>"], f"lowering: {bpe_encode('lowering', m)}"
    assert bpe_encode("banana", m) == list("banana") + ["</w>"]

@test("병합할 쌍이 없으면 일찍 멈춘다")
def _():
    assert len(train_bpe(["a"], 5)) == 1
`,
    hints: ["`if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == pair:` 이면 `merged.append(tokens[i] + tokens[i + 1]); i += 2`", "`pairs = Counter((t[i], t[i + 1]) for t in corpus for i in range(len(t) - 1))`, 비어 있으면 `break`, 아니면 `best = pairs.most_common(1)[0][0]`", "`bpe_encode`는 `for pair in merges: tokens = merge_pair(tokens, pair)`. 순서가 바뀌면 다른 토큰이 나옵니다."],
    solution: py`
from collections import Counter

def merge_pair(tokens, pair):
    merged, i = [], 0
    while i < len(tokens):
        if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == pair:
            merged.append(tokens[i] + tokens[i + 1])
            i += 2
        else:
            merged.append(tokens[i])
            i += 1
    return merged

def train_bpe(words, n_merges):
    corpus = [list(w) + ["</w>"] for w in words]
    merges = []
    for _ in range(n_merges):
        pairs = Counter((t[i], t[i + 1]) for t in corpus for i in range(len(t) - 1))
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]
        merges.append(best)
        corpus = [merge_pair(t, best) for t in corpus]
    return merges

def bpe_encode(word, merges):
    tokens = list(word) + ["</w>"]
    for pair in merges:
        tokens = merge_pair(tokens, pair)
    return tokens

words = ["low", "low", "lower", "lowest", "newer", "newer", "newest"]
merges = train_bpe(words, 8)
print(merges)
for w in ["slow", "lowering", "banana"]:
    print(w, bpe_encode(w, merges))
`,
  },
]);
