import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "점수 등급과 확률 임계값",
    prompt: md`

두 함수의 TODO를 채웁니다. 함수(\`def\`)를 만드는 방법은 [[lesson:functions-scope]]에서 자세히 다룹니다. 여기서는 함수 안의 조건문만 완성합니다.

1. \`grade(score)\`: 90 이상 \`"A"\`, 80 이상 \`"B"\`, 70 이상 \`"C"\`, 그 밖은 \`"F"\`를 돌려줍니다. 0보다 작거나 100보다 큰 점수는 \`"invalid"\`입니다.
2. \`classify(prob, threshold)\`: 확률 \`prob\`이 \`threshold\` 이상이면 \`"양성"\`, 아니면 \`"음성"\`을 돌려줍니다. 조건 표현식으로 한 줄에 씁니다.
`,
    starter: py`
def grade(score):
    """0~100 점수 → 등급. 범위를 벗어나면 "invalid" """
    if score < 0 or score > 100:
        return "invalid"
    # TODO: 좁은 조건(90 이상)부터 차례로 검사해 등급을 돌려줍니다.
    return "F"

def classify(prob, threshold=0.5):
    """확률이 임계값 이상이면 "양성", 아니면 "음성" """
    return ""   # TODO: 조건 표현식 A if 조건 else B

for s in (95, 90, 89.5, 70, 69, -3):
    print(s, grade(s))
print(classify(0.73), classify(0.5), classify(0.2), classify(0.6, threshold=0.7))
`,
    tests: py`
@test("등급 경계: 90 → A, 89.5 → B, 80 → B, 70 → C, 69 → F")
def _():
    got = [grade(s) for s in (90, 89.5, 80, 70, 69)]
    assert got == ["A", "B", "B", "C", "F"], f"결과: {got}"

@test("100점과 0점은 유효하다")
def _():
    assert grade(100) == "A" and grade(0) == "F", f"100점: {grade(100)}, 0점: {grade(0)}"

@test("범위를 벗어난 점수는 invalid")
def _():
    assert grade(-1) == "invalid" and grade(101) == "invalid"

@test("임계값과 같으면 양성")
def _():
    assert classify(0.5) == "양성", f"classify(0.5) = {classify(0.5)!r}"

@test("임계값을 바꾸면 결과가 바뀐다")
def _():
    assert classify(0.6) == "양성" and classify(0.6, threshold=0.7) == "음성"
    assert classify(0.2) == "음성"
`,
    hints: [
      "`if score >= 90: return \"A\"` 다음에 `if score >= 80: return \"B\"`처럼 쓰면, 앞에서 돌려준 경우는 뒤 조건까지 가지 않습니다.",
      "넓은 조건(70 이상)을 먼저 쓰면 95점도 C가 됩니다. 90 → 80 → 70 순서로 씁니다.",
      "`return \"양성\" if prob >= threshold else \"음성\"`입니다. 같을 때 양성이므로 `>=`를 씁니다.",
    ],
    solution: py`
def grade(score):
    if score < 0 or score > 100:
        return "invalid"
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "F"

def classify(prob, threshold=0.5):
    return "양성" if prob >= threshold else "음성"

for s in (95, 90, 89.5, 70, 69, -3):
    print(s, grade(s))
print(classify(0.73), classify(0.5), classify(0.2), classify(0.6, threshold=0.7))
`,
  },
]);
