import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "단어 빈도와 공통 어휘",
    prompt: md`

세 함수를 완성합니다.

1. \`word_counts(text)\`: 글을 소문자로 바꾸고 공백으로 나눈 단어별 등장 횟수를 딕셔너리로 돌려줍니다.
2. \`top_word(counts)\`: 횟수가 가장 큰 단어를 돌려줍니다. 횟수가 같으면 먼저 들어 있는 단어를 고릅니다. 빈 딕셔너리면 \`None\`입니다.
3. \`shared_vocab(text_a, text_b)\`: 두 글(소문자로 바꾼 뒤)에 모두 나오는 단어를 정렬한 리스트로 돌려줍니다.
`,
    starter: py`
def word_counts(text):
    """소문자 단어별 등장 횟수"""
    counts = {}
    for word in text.lower().split():
        pass   # TODO: counts.get(word, 0)에 1을 더해 counts[word]에 대입합니다.
    return counts

def top_word(counts):
    """가장 많이 나온 단어(횟수가 같으면 먼저 들어 있는 단어). 비어 있으면 None"""
    best, best_count = None, 0
    for word, n in counts.items():
        pass   # TODO: n이 best_count보다 크면 best와 best_count를 바꿉니다.
    return best

def shared_vocab(text_a, text_b):
    """두 글에 모두 나오는 단어의 정렬된 리스트"""
    return []  # TODO: 두 글의 단어 집합을 만들고 교집합(&)을 sorted()로 정렬합니다.

counts = word_counts("The model learns the data and the model improves")
print(counts)
print(top_word(counts))
print(shared_vocab("AI is fun", "ML is fun too"))
`,
    tests: py`
@test("word_counts: 대소문자를 구분하지 않고 센다")
def _():
    got = word_counts("The model the data")
    assert got == {"the": 2, "model": 1, "data": 1}, f"결과: {got}"

@test("word_counts: 빈 글이면 빈 딕셔너리")
def _():
    assert word_counts("") == {}

@test("top_word: 가장 많이 나온 단어")
def _():
    assert top_word({"a": 1, "b": 3, "c": 2}) == "b"

@test("top_word: 횟수가 같으면 먼저 들어 있는 단어, 비어 있으면 None")
def _():
    assert top_word({"x": 2, "y": 2}) == "x", f"결과: {top_word({'x': 2, 'y': 2})}"
    assert top_word({}) is None

@test("shared_vocab: 교집합을 정렬해 돌려준다")
def _():
    got = shared_vocab("AI is fun", "ML is fun too")
    assert got == ["fun", "is"], f"결과: {got}"
`,
    hints: [
      "`counts[word] = counts.get(word, 0) + 1`은 처음 보는 단어면 1, 이미 있으면 기존 횟수 + 1을 넣습니다.",
      "횟수가 같을 때 먼저 들어 있는 단어를 남기려면 `>=`가 아니라 `>`로 비교합니다.",
      "`set(text_a.lower().split()) & set(text_b.lower().split())`가 공통 단어의 집합입니다. `sorted()`로 정렬된 리스트를 만듭니다.",
    ],
    solution: py`
def word_counts(text):
    counts = {}
    for word in text.lower().split():
        counts[word] = counts.get(word, 0) + 1
    return counts

def top_word(counts):
    best, best_count = None, 0
    for word, n in counts.items():
        if n > best_count:
            best, best_count = word, n
    return best

def shared_vocab(text_a, text_b):
    return sorted(set(text_a.lower().split()) & set(text_b.lower().split()))

counts = word_counts("The model learns the data and the model improves")
print(counts)
print(top_word(counts))
print(shared_vocab("AI is fun", "ML is fun too"))
`,
  },
]);
