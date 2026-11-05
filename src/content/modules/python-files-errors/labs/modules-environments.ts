import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "requirements.txt 읽고 설치 상태 확인하기",
    prompt: md`

두 함수를 완성합니다.

1. \`parse_requirements(text)\`: \`requirements.txt\`의 내용을 받아 \`{패키지 이름: 버전}\` 딕셔너리를 돌려줍니다. 빈 줄과 \`#\`으로 시작하는 주석 줄은 건너뛰고, 줄 끝의 \`# 설명\`도 지웁니다. 패키지 이름은 소문자로 바꿉니다. 형식은 \`이름==버전\`만 다룹니다.
2. \`check_environment(required, installed)\`: 필요한 패키지마다 설치 상태를 확인해, 설치되지 않은 이름의 리스트와 버전이 다른 이름의 리스트를 \`(missing, mismatched)\`로 돌려줍니다. 두 리스트는 이름순으로 정렬합니다.
`,
    starter: py`
def parse_requirements(text):
    """'이름==버전' 줄들 → {소문자 이름: 버전}"""
    pins = {}
    for line in text.splitlines():
        line = line.split("#")[0].strip()      # 주석을 지우고 앞뒤 공백을 없앤다
        # TODO: 빈 줄이면 건너뜁니다(continue).
        # TODO: "=="로 나눠 이름(소문자, 공백 제거)과 버전(공백 제거)을 pins에 넣습니다.
    return pins

def check_environment(required, installed):
    """(설치되지 않은 이름들, 버전이 다른 이름들), 각각 이름순"""
    missing, mismatched = [], []
    # TODO: required의 (이름, 버전)마다 installed에 없으면 missing, 버전이 다르면 mismatched에 추가합니다.
    return sorted(missing), sorted(mismatched)

text = """
# 데이터 처리
numpy==1.26.4
pandas==2.2.2   # 표 데이터
Scikit-Learn==1.5.0
"""
required = parse_requirements(text)
print(required)
print(check_environment(required, {"numpy": "1.26.4", "pandas": "2.1.0"}))
`,
    tests: py`
TEXT = """
# 데이터 처리
numpy==1.26.4
pandas==2.2.2   # 표 데이터

Scikit-Learn == 1.5.0
"""

@test("이름과 버전을 읽는다(주석·빈 줄 제외, 이름은 소문자)")
def _():
    got = parse_requirements(TEXT)
    assert got == {"numpy": "1.26.4", "pandas": "2.2.2", "scikit-learn": "1.5.0"}, f"결과: {got}"

@test("주석만 있는 내용이면 빈 딕셔너리")
def _():
    assert parse_requirements("# 없음\n\n") == {}

@test("설치되지 않은 패키지와 버전이 다른 패키지를 구분한다")
def _():
    required = {"numpy": "1.26.4", "pandas": "2.2.2", "scikit-learn": "1.5.0"}
    installed = {"numpy": "1.26.4", "pandas": "2.1.0"}
    assert check_environment(required, installed) == (["scikit-learn"], ["pandas"])

@test("모두 맞으면 두 리스트 모두 비어 있다")
def _():
    assert check_environment({"numpy": "2.0.0"}, {"numpy": "2.0.0", "extra": "1.0"}) == ([], [])

@test("결과는 이름순으로 정렬한다")
def _():
    missing, _ = check_environment({"zeta": "1", "alpha": "1"}, {})
    assert missing == ["alpha", "zeta"], f"결과: {missing}"
`,
    hints: [
      "`if not line: continue`로 빈 줄을 건너뜁니다. 주석만 있던 줄도 `split(\"#\")[0]` 뒤에는 빈 문자열이 됩니다.",
      "`name, version = line.split(\"==\")` 다음 `pins[name.strip().lower()] = version.strip()`으로 넣습니다.",
      "`for name, version in required.items():` 안에서 `if name not in installed:`이면 missing, `elif installed[name] != version:`이면 mismatched에 추가합니다.",
    ],
    solution: py`
def parse_requirements(text):
    pins = {}
    for line in text.splitlines():
        line = line.split("#")[0].strip()
        if not line:
            continue
        name, version = line.split("==")
        pins[name.strip().lower()] = version.strip()
    return pins

def check_environment(required, installed):
    missing, mismatched = [], []
    for name, version in required.items():
        if name not in installed:
            missing.append(name)
        elif installed[name] != version:
            mismatched.append(name)
    return sorted(missing), sorted(mismatched)

text = """
# 데이터 처리
numpy==1.26.4
pandas==2.2.2   # 표 데이터
Scikit-Learn==1.5.0
"""
required = parse_requirements(text)
print(required)
print(check_environment(required, {"numpy": "1.26.4", "pandas": "2.1.0"}))
`,
  },
]);
