import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "시드로 재현되는 데이터 분할",
    prompt: md`

\`seeded_split(items, ratio, seed)\`를 완성합니다. 같은 인자로 부르면 언제나 같은 결과가 나와야 합니다.

- \`items\`를 복사한 뒤 \`random.Random(seed)\`로 만든 생성기의 \`shuffle\`로 섞습니다. 원본 \`items\`는 바꾸지 않습니다.
- 섞은 리스트의 앞쪽 \`int(len(items) * ratio)\`개를 학습용, 나머지를 평가용으로 \`(학습용, 평가용)\`을 돌려줍니다.
- 프로그램 전체가 함께 쓰는 \`random.shuffle\`이나 \`random.seed\`는 쓰지 않습니다. 다른 코드가 난수를 쓰면 결과가 달라지기 때문입니다.
`,
    starter: py`
import random

def seeded_split(items, ratio, seed):
    """시드로 섞은 뒤 (앞쪽 ratio 비율, 나머지)로 나눈다. 원본은 바꾸지 않는다."""
    shuffled = items                      # TODO: 원본을 바꾸지 않도록 복사합니다.
    random.shuffle(shuffled)              # TODO: random.Random(seed)로 만든 생성기의 shuffle을 씁니다.
    k = int(len(shuffled) * ratio)
    return shuffled[:k], shuffled[k:]

data = list(range(10))
print(seeded_split(data, 0.8, seed=0))
print(seeded_split(data, 0.8, seed=0))
print(data)
`,
    tests: py`
import random

@test("같은 시드면 같은 분할")
def _():
    a = seeded_split(list(range(20)), 0.75, seed=7)
    random.random()                       # 그 사이에 다른 코드가 전역 난수를 써도
    b = seeded_split(list(range(20)), 0.75, seed=7)
    assert a == b, "같은 시드인데 결과가 다릅니다."

@test("다른 시드면 (대개) 다른 분할")
def _():
    assert seeded_split(list(range(20)), 0.75, seed=1) != seeded_split(list(range(20)), 0.75, seed=2)

@test("원본 리스트를 바꾸지 않는다")
def _():
    data = list(range(10))
    seeded_split(data, 0.8, seed=0)
    assert data == list(range(10)), f"원본이 바뀌었습니다: {data}"

@test("빠지거나 겹치는 원소가 없고 개수가 맞다")
def _():
    train, test = seeded_split(list(range(10)), 0.8, seed=3)
    assert len(train) == 8 and len(test) == 2
    assert sorted(train + test) == list(range(10))

@test("시드 0의 결과가 정해진 값이다")
def _():
    train, test = seeded_split(list(range(10)), 0.8, seed=0)
    assert test == [9, 6], f"평가용: {test}"
`,
    hints: [
      "`shuffled = list(items)`로 복사합니다. `shuffled = items`는 같은 리스트를 가리킬 뿐입니다.",
      "`random.Random(seed).shuffle(shuffled)`는 그 시드의 생성기로만 섞어, 다른 코드의 난수 사용에 영향을 받지 않습니다.",
    ],
    solution: py`
import random

def seeded_split(items, ratio, seed):
    shuffled = list(items)
    random.Random(seed).shuffle(shuffled)
    k = int(len(shuffled) * ratio)
    return shuffled[:k], shuffled[k:]

data = list(range(10))
print(seeded_split(data, 0.8, seed=0))
print(seeded_split(data, 0.8, seed=0))
print(data)
`,
  },
]);
