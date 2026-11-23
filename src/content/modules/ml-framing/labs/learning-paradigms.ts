import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "학습 신호로 패러다임 구분하기",
    prompt: md`

상황마다 모델이 무엇을 신호로 학습하는지 보고 패러다임을 고릅니다. 값은 \`"지도학습"\`, \`"비지도학습"\`, \`"자기지도학습"\`, \`"강화학습"\` 중 하나입니다.

- \`"photos"\`: 사람이 사진마다 붙인 고양이·개 레이블로 분류기를 학습한다.
- \`"customers"\`: 레이블 없는 구매 기록으로 비슷한 고객끼리 묶는다.
- \`"next_word"\`: 웹 문서에서 다음 단어를 맞히도록 학습한다.
- \`"game"\`: 게임을 끝까지 둔 뒤의 승패 점수로 수를 두는 규칙을 고친다.

\`n_samples(n_tokens)\`는 토큰이 \`n_tokens\`개인 문장에서 "앞부분 → 다음 토큰" 샘플이 몇 개 나오는지 돌려줍니다.
`,
    starter: py`
paradigm = {"photos": None, "customers": None, "next_word": None, "game": None}   # TODO

def n_samples(n_tokens):
    return 0   # TODO

print(paradigm, n_samples(4))
`,
    tests: py`
@test("상황별 패러다임")
def _():
    want = {"photos": "지도학습", "customers": "비지도학습", "next_word": "자기지도학습", "game": "강화학습"}
    wrong = [k for k in want if paradigm.get(k) != want[k]]
    assert not wrong, f"다시 생각할 상황: {wrong}"

@test("문장 하나에서 나오는 샘플 수")
def _():
    assert n_samples(4) == 3 and n_samples(2) == 1 and n_samples(10) == 9, f"n_samples(4) = {n_samples(4)}"
`,
    hints: [
      "사람이 붙인 정답이 있으면 지도학습, 정답 없이 구조만 찾으면 비지도학습, 데이터 자체에서 정답을 만들면 자기지도학습, 행동의 결과로 받는 점수로 배우면 강화학습입니다.",
      "토큰이 $n$개이면 첫 토큰부터 $i$개를 입력으로 쓰는 경우가 $i = 1, \\ldots, n - 1$이라 `n_tokens - 1`개입니다.",
    ],
    solution: py`
paradigm = {"photos": "지도학습", "customers": "비지도학습", "next_word": "자기지도학습", "game": "강화학습"}

def n_samples(n_tokens):
    return n_tokens - 1

print(paradigm, n_samples(4))
`,
  },
  {
    key: "ex1",
    title: "텍스트에서 자기지도학습 샘플 만들기",
    prompt: md`

사람이 정답을 붙이지 않은 토큰 목록에서 학습 샘플을 만듭니다.

1. \`next_token_pairs(tokens, context)\`: 위치 $i = 1, 2, \ldots$마다 바로 앞의 토큰 **최대 \`context\`개**를 입력으로, \`tokens[i]\`를 정답으로 하는 \`(입력 리스트, 정답)\` 쌍의 리스트. 언어 모델이 한 번에 볼 수 있는 길이가 정해져 있다는 것을 나타냅니다.
2. \`masked_sample(tokens, positions, mask="[MASK]")\`: \`positions\`의 토큰을 \`mask\`로 바꾼 입력 리스트와, 가린 위치의 원래 토큰을 담은 딕셔너리 \`{위치: 토큰}\`을 돌려줍니다. 원래 리스트는 바꾸지 않습니다.
`,
    starter: py`
def next_token_pairs(tokens, context):
    pairs = []
    for i in range(1, len(tokens)):
        pass  # TODO: 앞쪽 최대 context개를 입력으로, tokens[i]를 정답으로 추가합니다.
    return pairs

def masked_sample(tokens, positions, mask="[MASK]"):
    masked = list(tokens)
    targets = {}
    # TODO: positions의 토큰을 targets에 기록하고 masked에서 mask로 바꿉니다.
    return masked, targets

tokens = ["고양이가", "소파", "위에서", "잔다", "."]
for x, y in next_token_pairs(tokens, context=2):
    print(x, "→", y)
print(masked_sample(tokens, [1, 3]))      # 기대: (['고양이가', '[MASK]', '위에서', '[MASK]', '.'], {1: '소파', 3: '잔다'})
`,
    tests: py`
T = ["고양이가", "소파", "위에서", "잔다", "."]

@test("context가 충분히 크면 앞부분 전체가 입력")
def _():
    got = next_token_pairs(T, context=10)
    assert got[0] == (["고양이가"], "소파") and got[-1] == (["고양이가", "소파", "위에서", "잔다"], "."), f"결과: {got}"
    assert len(got) == 4

@test("context=2이면 바로 앞 두 토큰만 입력")
def _():
    got = next_token_pairs(T, context=2)
    assert got[1] == (["고양이가", "소파"], "위에서") and got[3] == (["위에서", "잔다"], "."), f"결과: {got}"

@test("masked_sample: 가린 입력과 정답 위치")
def _():
    masked, targets = masked_sample(T, [1, 3])
    assert masked == ["고양이가", "[MASK]", "위에서", "[MASK]", "."], f"입력: {masked}"
    assert targets == {1: "소파", 3: "잔다"}, f"정답: {targets}"

@test("masked_sample: 원래 리스트는 그대로")
def _():
    masked_sample(T, [0])
    assert T[0] == "고양이가"
`,
    hints: [
      "`pairs.append((tokens[max(0, i - context):i], tokens[i]))`처럼 슬라이스의 시작을 0보다 작아지지 않게 합니다.",
      "`for p in positions:` 안에서 `targets[p] = tokens[p]` 다음 `masked[p] = mask`입니다.",
      "`list(tokens)`로 복사했으므로 `masked`를 바꿔도 원래 리스트는 그대로입니다.",
    ],
    solution: py`
def next_token_pairs(tokens, context):
    pairs = []
    for i in range(1, len(tokens)):
        pairs.append((tokens[max(0, i - context):i], tokens[i]))
    return pairs

def masked_sample(tokens, positions, mask="[MASK]"):
    masked = list(tokens)
    targets = {}
    for p in positions:
        targets[p] = tokens[p]
        masked[p] = mask
    return masked, targets

tokens = ["고양이가", "소파", "위에서", "잔다", "."]
for x, y in next_token_pairs(tokens, context=2):
    print(x, "→", y)
print(masked_sample(tokens, [1, 3]))
`,
  },
]);
