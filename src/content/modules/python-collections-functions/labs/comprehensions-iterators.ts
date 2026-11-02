import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "성적 요약 함수: 빈 리스트까지 안전하게",
    prompt: md`

리스트 컴프리헨션과 딕셔너리 컴프리헨션으로 성적 요약 함수 두 개를 완성합니다.

1. \`summarize(scores)\`: \`(평균, 최고점, 70점 이상 인원)\` 튜플을 돌려줍니다. **빈 리스트면 \`None\`**을 돌려줍니다(\`if\` 또는 \`try\`/\`except ZeroDivisionError\`).
2. \`label_students(students)\`: \`{이름: 점수}\`를 받아 \`{이름: "통과" 또는 "보충"}\`을 돌려줍니다. 70점 이상이 통과이며, 딕셔너리 컴프리헨션으로 한 줄에 써 봅니다.

시작 코드를 그대로 실행하면 \`summarize([])\`에서 오류가 납니다. 오류 메시지와 줄 번호를 먼저 읽어 보십시오.
`,
    starter: py`
def summarize(scores):
    """점수 리스트 -> (평균, 최고점, 70점 이상 인원). 빈 리스트면 None"""
    # TODO: 빈 리스트일 때 None을 돌려주도록 처리합니다.
    avg = sum(scores) / len(scores)
    best = max(scores)
    passed = 0  # TODO: 리스트 컴프리헨션으로 70점 이상인 점수의 개수를 셉니다.
    return avg, best, passed

def label_students(students):
    """{이름: 점수} -> {이름: "통과" 또는 "보충"} (70점 이상이면 통과)"""
    # TODO: {이름: (조건부 표현식) for 이름, 점수 in students.items()}
    return {}

print(summarize([90, 85, 77, 60]))
print(summarize([]))
print(label_students({"민수": 88, "지현": 95, "도윤": 67}))
`,
    tests: py`
@test("summarize([90, 85, 77, 60]) == (78.0, 90, 3)")
def _():
    got = summarize([90, 85, 77, 60])
    assert got == (78.0, 90, 3), f"결과: {got}"

@test("빈 리스트면 None")
def _():
    assert summarize([]) is None

@test("한 명뿐일 때: summarize([69]) == (69.0, 69, 0)")
def _():
    assert summarize([69]) == (69.0, 69, 0), f"결과: {summarize([69])}"

@test("label_students가 70점(포함) 기준으로 나눈다")
def _():
    got = label_students({"민수": 88, "지현": 95, "도윤": 67, "서연": 70})
    assert got == {"민수": "통과", "지현": "통과", "도윤": "보충", "서연": "통과"}, f"결과: {got}"
`,
    hints: ["함수 맨 앞에 `if not scores: return None`을 두면 빈 리스트를 먼저 걸러 낼 수 있습니다.", "`len([s for s in scores if s >= 70])`로 70점 이상인 개수를 셉니다.", "조건부 표현식은 `\"통과\" if score >= 70 else \"보충\"` 형태입니다. 이것을 딕셔너리 컴프리헨션의 값 자리에 넣습니다."],
    solution: py`
def summarize(scores):
    if not scores:
        return None
    avg = sum(scores) / len(scores)
    best = max(scores)
    passed = len([s for s in scores if s >= 70])
    return avg, best, passed

def label_students(students):
    return {name: ("통과" if score >= 70 else "보충") for name, score in students.items()}

print(summarize([90, 85, 77, 60]))
print(summarize([]))
print(label_students({"민수": 88, "지현": 95, "도윤": 67}))
`,
  },
]);
