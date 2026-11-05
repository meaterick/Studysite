import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "git status 읽기와 .gitignore 규칙",
    prompt: md`

Git 명령은 이 사이트에서 실행되지 않으므로, Git이 보여 주는 결과와 규칙을 파이썬으로 다룹니다.

1. \`classify_status(lines)\`: \`git status --short\`의 출력 줄(앞 두 글자가 상태, 세 번째 글자부터 파일 이름)을 받아 \`{"staged": [...], "unstaged": [...], "untracked": [...]}\`를 돌려줍니다.
   - 상태가 \`??\`이면 \`untracked\`입니다.
   - 그 밖에는 왼쪽 글자가 공백이 아니면 \`staged\`, 오른쪽 글자가 공백이 아니면 \`unstaged\`입니다. \`MM\`처럼 둘 다면 두 목록에 모두 넣습니다.
2. \`should_ignore(path, patterns)\`: 경로가 \`.gitignore\` 규칙 중 하나에 해당하면 \`True\`를 돌려줍니다. \`/\`로 끝나는 규칙은 폴더 이름이 경로의 한 부분과 같을 때, 그 밖의 규칙은 파일 이름(경로의 마지막 부분)이 \`fnmatch\`로 일치할 때 해당합니다.
`,
    starter: py`
import fnmatch

def classify_status(lines):
    result = {"staged": [], "unstaged": [], "untracked": []}
    for line in lines:
        code, name = line[:2], line[3:]
        # TODO: "??"이면 untracked에 넣고 다음 줄로 넘어갑니다.
        # TODO: code[0]이 공백이 아니면 staged, code[1]이 공백이 아니면 unstaged에 넣습니다.
    return result

def should_ignore(path, patterns):
    parts = path.split("/")              # "data/raw/a.csv" → ["data", "raw", "a.csv"]
    for p in patterns:
        if p.endswith("/"):
            pass   # TODO: p[:-1]이 parts 중 폴더 부분(parts[:-1])에 있으면 True
        else:
            pass   # TODO: 파일 이름 parts[-1]이 fnmatch.fnmatch(이름, p)로 일치하면 True
    return False

status = ["M  model.py", " M train.py", "MM utils.py", "A  new.py", "?? notes.txt"]
print(classify_status(status))
rules = ["*.csv", ".env", "data/", "__pycache__/"]
print([p for p in ["train.py", "data/raw/a.csv", ".env", "src/__pycache__/x.pyc", "docs/readme.md"] if should_ignore(p, rules)])
`,
    tests: py`
STATUS = ["M  model.py", " M train.py", "MM utils.py", "A  new.py", "?? notes.txt"]

@test("staged: 왼쪽 글자가 있는 파일")
def _():
    got = classify_status(STATUS)["staged"]
    assert got == ["model.py", "utils.py", "new.py"], f"결과: {got}"

@test("unstaged: 오른쪽 글자가 있는 파일(MM은 양쪽 모두)")
def _():
    got = classify_status(STATUS)["unstaged"]
    assert got == ["train.py", "utils.py"], f"결과: {got}"

@test("untracked: ??인 파일")
def _():
    got = classify_status(STATUS)["untracked"]
    assert got == ["notes.txt"], f"결과: {got}"

@test("should_ignore: 파일 이름 규칙(*.csv, .env)")
def _():
    rules = ["*.csv", ".env"]
    assert should_ignore("train.csv", rules) and should_ignore("config/.env", rules)
    assert not should_ignore("train.py", rules)

@test("should_ignore: 폴더 규칙(data/)은 폴더 부분에만 적용된다")
def _():
    rules = ["data/"]
    assert should_ignore("data/raw/a.txt", rules)
    assert should_ignore("project/data/x.json", rules)
    assert not should_ignore("docs/data", rules), "data라는 이름의 파일은 폴더 규칙에 해당하지 않습니다."
`,
    hints: [
      "`if code == \"??\": result[\"untracked\"].append(name); continue`로 새 파일을 먼저 처리합니다.",
      "`if code[0] != \" \": ...`와 `if code[1] != \" \": ...`를 `elif` 없이 따로 써야 `MM`이 두 목록에 모두 들어갑니다.",
      "폴더 규칙은 `if p[:-1] in parts[:-1]: return True`, 파일 규칙은 `if fnmatch.fnmatch(parts[-1], p): return True`입니다.",
    ],
    solution: py`
import fnmatch

def classify_status(lines):
    result = {"staged": [], "unstaged": [], "untracked": []}
    for line in lines:
        code, name = line[:2], line[3:]
        if code == "??":
            result["untracked"].append(name)
            continue
        if code[0] != " ":
            result["staged"].append(name)
        if code[1] != " ":
            result["unstaged"].append(name)
    return result

def should_ignore(path, patterns):
    parts = path.split("/")
    for p in patterns:
        if p.endswith("/"):
            if p[:-1] in parts[:-1]:
                return True
        elif fnmatch.fnmatch(parts[-1], p):
            return True
    return False

status = ["M  model.py", " M train.py", "MM utils.py", "A  new.py", "?? notes.txt"]
print(classify_status(status))
rules = ["*.csv", ".env", "data/", "__pycache__/"]
print([p for p in ["train.py", "data/raw/a.csv", ".env", "src/__pycache__/x.pyc", "docs/readme.md"] if should_ignore(p, rules)])
`,
  },
]);
