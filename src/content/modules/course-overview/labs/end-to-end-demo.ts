import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "평균절대오차와 다음 글자 확률",
    prompt: md`

레슨의 두 시스템에서 쓴 계산 두 가지를 직접 완성합니다.

1. \`mae(y_true, y_pred)\`: 정답과 예측의 차이를 절댓값으로 평균한 값(평균절대오차)을 돌려줍니다.
2. \`to_probs(counts)\`: \`{"다음 글자": 횟수}\` 사전을 받아 \`{"다음 글자": 확률}\` 사전을 돌려줍니다. 확률은 횟수를 전체 횟수로 나눈 값입니다.
`,
    starter: py`
def mae(y_true, y_pred):
    """정답 y_true와 예측 y_pred의 평균절대오차"""
    total = 0.0
    for t, p in zip(y_true, y_pred):
        total += 0.0  # TODO: 오차의 절댓값 abs(p - t)를 더합니다.
    return total / len(y_true)

def to_probs(counts):
    """{"글자": 횟수} → {"글자": 확률}"""
    total = sum(counts.values())
    return {ch: 0.0 for ch, n in counts.items()}  # TODO: 횟수 n을 전체 횟수 total로 나눈 값을 넣습니다.

print(mae([3.0, 5.0, 2.0], [2.5, 5.5, 3.0]))
print(to_probs({" ": 3, "데": 1}))
`,
    tests: py`
@test("평균절대오차: (0.5 + 0.5 + 1.0) / 3")
def _():
    got = mae([3.0, 5.0, 2.0], [2.5, 5.5, 3.0])
    assert approx(got, 2 / 3), f"mae = {got}"

@test("예측이 정답과 같으면 평균절대오차는 0")
def _():
    assert approx(mae([1, 2, 3], [1, 2, 3]), 0.0)

@test("오차의 부호와 관계없이 절댓값을 더한다")
def _():
    got = mae([0, 0], [-2, 2])
    assert approx(got, 2.0), f"mae = {got} (절댓값을 쓰지 않으면 0이 됩니다)"

@test("횟수 3, 1 → 확률 0.75, 0.25")
def _():
    got = to_probs({" ": 3, "데": 1})
    assert approx(got[" "], 0.75) and approx(got["데"], 0.25), f"결과: {got}"

@test("확률을 모두 더하면 1")
def _():
    got = to_probs({"a": 2, "b": 5, "c": 3})
    assert approx(sum(got.values()), 1.0), f"합: {sum(got.values())}"
`,
    hints: [
      "`abs(x)`는 x의 절댓값입니다. `total += abs(p - t)`로 오차의 절댓값을 더합니다.",
      "사전 컴프리헨션 `{ch: n / total for ch, n in counts.items()}`는 각 글자의 횟수를 전체 횟수로 나눈 사전을 만듭니다.",
    ],
    solution: py`
def mae(y_true, y_pred):
    total = 0.0
    for t, p in zip(y_true, y_pred):
        total += abs(p - t)
    return total / len(y_true)

def to_probs(counts):
    total = sum(counts.values())
    return {ch: n / total for ch, n in counts.items()}

print(mae([3.0, 5.0, 2.0], [2.5, 5.5, 3.0]))
print(to_probs({" ": 3, "데": 1}))
`,
  },
]);
