import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
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
