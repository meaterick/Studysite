import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "문자열 기록을 자료형에 맞게 변환하기",
    prompt: md`
:::info 실습 뼈대 안내
함수(def·return)는 [[lesson:functions-scope]]에서 배웁니다. 지금은 함수 뼈대를 유지하고 TODO 안에 이 레슨의 문법을 적용합니다. split·strip·lower 같은 문자열 메서드는 [[lesson:operators]]의 문자열 부분을 참고합니다.
:::


주어진 문자열 한 줄 \`"김민준,23,175.5,yes"\`를 \`("김민준", 23, 175.5, True)\`로 바꾸는 \`parse_record(line)\`을 완성합니다.

- 이름은 앞뒤 공백을 없앤 문자열, 나이는 정수, 키는 실수로 바꿉니다.
- 회원 여부는 \`"yes"\`면 \`True\`, \`"no"\`면 \`False\`입니다. 대소문자와 앞뒤 공백은 구분하지 않습니다. \`bool()\`로 변환하면 \`"no"\`도 \`True\`가 되므로 쓰지 않습니다.
`,
    starter: py`
def parse_record(line):
    """'이름,나이,키,회원여부' 형식의 문자열 → (이름, 나이(int), 키(float), 회원여부(bool))"""
    name, age, height, member = line.split(",")   # 쉼표를 기준으로 네 조각으로 나눈다
    # TODO: name은 앞뒤 공백을 없애고, age는 정수, height는 실수로 바꿉니다.
    # TODO: member는 공백을 없애고 소문자로 바꾼 값이 "yes"인지 비교한 결과(True/False)로 바꿉니다.
    return name, age, height, member

print(parse_record("김민준,23,175.5,yes"))
print(parse_record(" 이서연 , 31 , 162.0 , NO "))
`,
    tests: py`
@test("기본 형식: ('김민준', 23, 175.5, True)")
def _():
    got = parse_record("김민준,23,175.5,yes")
    assert got == ("김민준", 23, 175.5, True), f"결과: {got!r}"

@test("나이는 int, 키는 float, 회원 여부는 bool")
def _():
    name, age, height, member = parse_record("박도윤,40,180,yes")
    assert type(age) is int, f"나이의 자료형: {type(age).__name__}"
    assert type(height) is float, f"키의 자료형: {type(height).__name__}"
    assert type(member) is bool, f"회원 여부의 자료형: {type(member).__name__}"

@test('"no"는 False(bool("no")는 True이므로 쓰면 안 된다)')
def _():
    got = parse_record("최지우,27,158.3,no")
    assert got[3] is False, f"회원 여부: {got[3]!r}"

@test("앞뒤 공백과 대소문자를 정리한다")
def _():
    got = parse_record(" 이서연 , 31 , 162.0 , NO ")
    assert got == ("이서연", 31, 162.0, False), f"결과: {got!r}"
`,
    hints: [
      "`name.strip()`은 앞뒤 공백을 없앤 문자열을 돌려줍니다. `int(\" 31 \")`처럼 숫자 변환은 앞뒤 공백이 있어도 동작합니다.",
      "`age = int(age)`, `height = float(height)`처럼 같은 이름에 변환한 값을 다시 대입하면 됩니다.",
      "`member = member.strip().lower() == \"yes\"`는 비교 결과인 `True`나 `False`를 대입합니다.",
    ],
    solution: py`
def parse_record(line):
    name, age, height, member = line.split(",")
    name = name.strip()
    age = int(age)
    height = float(height)
    member = member.strip().lower() == "yes"
    return name, age, height, member

print(parse_record("김민준,23,175.5,yes"))
print(parse_record(" 이서연 , 31 , 162.0 , NO "))
`,
  },
]);
