import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "잘못된 값 건너뛰기와 입력 검사",
    prompt: md`

두 함수를 완성합니다.

1. \`parse_scores(lines)\`: \`"이름,점수"\` 형식의 문자열 리스트에서 점수를 정수로 읽어 \`(점수 리스트, 건너뛴 줄 수)\`를 돌려줍니다. 점수가 정수가 아니거나 쉼표가 없는 줄은 건너뜁니다. 정수로 바꿀 수 없는 경우만 \`except ValueError\`로 처리하고, 모든 예외를 잡지 않습니다.
2. \`safe_mean(values)\`: 평균을 돌려줍니다. 빈 리스트면 \`ValueError\`를 일으킵니다. 0이나 \`None\`을 돌려주지 않습니다.
`,
    starter: py`
def parse_scores(lines):
    """("이름,점수" 줄들) → (정수 점수 리스트, 건너뛴 줄 수)"""
    scores, skipped = [], 0
    for line in lines:
        # TODO: try 안에서 line.split(",")로 나눈 두 번째 값을 int로 바꿔 scores에 추가합니다.
        # TODO: ValueError가 나면 skipped를 1 늘립니다(쉼표가 없으면 언패킹에서 ValueError가 납니다).
        pass
    return scores, skipped

def safe_mean(values):
    """평균. 빈 리스트면 ValueError"""
    # TODO: values가 비어 있으면 raise ValueError("...")
    return sum(values) / len(values)

print(parse_scores(["민수,88", "지현,95", "도윤,결석", "잘못된줄", "서연, 70 "]))
try:
    safe_mean([])
except ValueError as e:
    print("ValueError:", e)
`,
    tests: py`
@test("올바른 줄만 정수로 읽는다")
def _():
    scores, skipped = parse_scores(["민수,88", "지현,95"])
    assert scores == [88, 95] and skipped == 0, f"결과: {scores}, {skipped}"

@test("숫자가 아닌 값과 쉼표가 없는 줄은 건너뛰고 센다")
def _():
    scores, skipped = parse_scores(["민수,88", "도윤,결석", "잘못된줄", "서연, 70 "])
    assert scores == [88, 70] and skipped == 2, f"결과: {scores}, {skipped}"

@test("ValueError가 아닌 오류는 숨기지 않는다(None이 들어오면 오류가 그대로 난다)")
def _():
    try:
        parse_scores([None])
    except AttributeError:
        return
    raise AssertionError("None을 넣었는데 예외가 나지 않았습니다. except가 너무 넓게 잡고 있습니다.")

@test("safe_mean: 평균")
def _():
    assert approx(safe_mean([80, 90, 100]), 90.0)

@test("safe_mean: 빈 리스트면 ValueError")
def _():
    try:
        safe_mean([])
    except ValueError:
        return
    except ZeroDivisionError:
        raise AssertionError("ZeroDivisionError가 났습니다. 비어 있는지 먼저 검사해 ValueError를 일으킵니다.")
    raise AssertionError("예외가 나지 않았습니다.")
`,
    hints: [
      "`name, value = line.split(\",\")`는 쉼표가 없으면 값이 하나뿐이라 `ValueError: not enough values to unpack`을 일으킵니다. `int(value)`도 실패하면 `ValueError`입니다.",
      "`try:` 블록 안에 나누기와 `int()` 변환을 두고, `except ValueError: skipped += 1`로 처리합니다. `int(\" 70 \")`은 앞뒤 공백이 있어도 70입니다.",
      "`if not values: raise ValueError(\"빈 리스트의 평균은 정의되지 않는다\")`를 함수 맨 앞에 둡니다.",
    ],
    solution: py`
def parse_scores(lines):
    scores, skipped = [], 0
    for line in lines:
        try:
            name, value = line.split(",")
            scores.append(int(value))
        except ValueError:
            skipped += 1
    return scores, skipped

def safe_mean(values):
    if not values:
        raise ValueError("빈 리스트의 평균은 정의되지 않는다")
    return sum(values) / len(values)

print(parse_scores(["민수,88", "지현,95", "도윤,결석", "잘못된줄", "서연, 70 "]))
try:
    safe_mean([])
except ValueError as e:
    print("ValueError:", e)
`,
  },
]);
