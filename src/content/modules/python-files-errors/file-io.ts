import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/file-io";

export default defineLesson({
  id: "file-io",
  title: "파일 입출력: 텍스트, CSV, JSON",
  tier: "core",
  concepts: ["file-io"],
  goal: "open과 with로 텍스트 파일을 읽고 쓰며, csv·json 모듈로 표 형식과 중첩 구조의 데이터를 저장한 뒤 같은 내용으로 다시 읽어 들인다.",
  why: "학습 데이터는 대부분 CSV나 JSON 파일로 주어지고, 실험 설정과 결과도 파일로 남겨야 나중에 비교하고 재현할 수 있다. [[lesson:dataframes]]의 `read_csv`는 이 레슨의 CSV 읽기와 자료형 변환을 한 번에 해 주는 도구다.",
  body: md`
### 파일과 경로

파일은 이름과 위치(경로)로 찾는다. \`"scores.csv"\`처럼 폴더 없이 쓴 경로는 **현재 작업 폴더**를 기준으로 한 상대 경로다. 경로는 문자열로 써도 되지만, 표준 라이브러리 \`pathlib\`의 \`Path\`를 쓰면 폴더와 파일 이름을 \`/\`로 이어 붙이고 확장자·존재 여부를 편하게 다룰 수 있다.

이 사이트의 코드 셀에도 파일 시스템이 있다. 셀에서 만든 파일은 브라우저 안의 가상 폴더에 저장되어 페이지를 새로 고치기 전까지 다른 셀에서 읽을 수 있다. 내 컴퓨터의 파일에는 접근하지 않는다.

\`\`\`python
from pathlib import Path

data_dir = Path("data")
data_dir.mkdir(exist_ok=True)          # 폴더 만들기(이미 있으면 그대로)
path = data_dir / "log.txt"            # 경로 이어 붙이기
print(path, path.suffix, path.exists())   # data/log.txt .txt False
\`\`\`

### 텍스트 파일 쓰고 읽기

\`open(경로, 모드, encoding="utf-8")\`로 파일을 열고, 다 쓰면 닫아야 한다. \`with\` 문으로 열면 블록이 끝날 때(오류가 나도) 파일이 자동으로 닫힌다. 파일은 항상 \`with\`로 연다.

| 모드 | 뜻 |
| --- | --- |
| \`"r"\` | 읽기(기본값). 파일이 없으면 \`FileNotFoundError\` |
| \`"w"\` | 쓰기. 파일이 있으면 **내용을 지우고** 새로 쓴다 |
| \`"a"\` | 이어 쓰기. 기존 내용 뒤에 덧붙인다 |
| \`"x"\` | 새 파일 쓰기. 파일이 이미 있으면 \`FileExistsError\` |

한국어가 들어간 파일은 \`encoding="utf-8"\`을 명시한다. 생략하면 운영체제마다 다른 기본 인코딩을 써서, 다른 컴퓨터에서 읽을 때 글자가 깨지거나 \`UnicodeDecodeError\`가 난다.

\`write()\`는 줄바꿈을 자동으로 붙이지 않는다. 줄마다 \`"\n"\`을 직접 쓴다. 읽을 때 \`for line in f\`로 한 줄씩 꺼내면 각 줄 끝에 \`"\n"\`이 붙어 있으므로 \`strip()\`으로 없앤다.

\`\`\`python
with open(path, "w", encoding="utf-8") as f:
    f.write("epoch 1 loss 0.92\n")
    f.write("epoch 2 loss 0.71\n")

with open(path, "a", encoding="utf-8") as f:     # 이어 쓰기
    f.write("epoch 3 loss 0.55\n")

with open(path, encoding="utf-8") as f:
    for line in f:
        epoch, loss = line.split()[1], float(line.split()[3])
        print(epoch, loss)

print(path.read_text(encoding="utf-8").count("\n"))   # 줄 수: 3
\`\`\`

### CSV: 표 형식의 데이터

CSV(comma-separated values)는 한 줄이 한 행이고 값을 쉼표로 구분하는 텍스트 형식이다. 첫 줄에는 보통 열 이름(머리글)을 쓴다. 값 안에 쉼표가 있으면 큰따옴표로 감싸야 하므로, \`split(",")\`으로 직접 나누지 말고 표준 라이브러리 \`csv\`를 쓴다.

- 쓰기: \`csv.DictWriter(f, fieldnames=[...])\`로 딕셔너리를 한 행씩 쓴다. 파일은 \`newline=""\`으로 연다(Windows에서 빈 줄이 끼어드는 것을 막는다).
- 읽기: \`csv.DictReader(f)\`는 머리글을 키로 하는 딕셔너리를 한 행씩 내준다.

CSV에는 자료형 정보가 없다. 읽어 들인 값은 **모두 문자열**이므로 계산 전에 변환한다([[lesson:variables-types]]).

\`\`\`python
import csv

records = [
    {"name": "민수", "score": 88, "comment": "복습 필요, 2회차"},
    {"name": "지현", "score": 95, "comment": ""},
]
with open("scores.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "score", "comment"])
    writer.writeheader()
    writer.writerows(records)

print(open("scores.csv", encoding="utf-8").read())   # 쉼표가 든 값은 따옴표로 감싸 저장된다

with open("scores.csv", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
print(rows[0]["score"], type(rows[0]["score"]))       # 88 <class 'str'>
print(sum(int(r["score"]) for r in rows) / len(rows)) # 91.5
\`\`\`

### JSON: 중첩된 데이터

JSON은 딕셔너리와 리스트를 겹친 구조를 그대로 저장하는 텍스트 형식이다. 실험 설정, 결과 요약, 웹 API 응답에 쓴다. \`json.dump(객체, 파일)\`로 저장하고 \`json.load(파일)\`로 읽는다. 문자열과 바꿀 때는 \`json.dumps\`·\`json.loads\`를 쓴다. \`ensure_ascii=False\`를 주면 한국어가 그대로 저장되고, \`indent=2\`를 주면 사람이 읽기 좋게 줄을 맞춘다.

| 파이썬 | JSON | 주의 |
| --- | --- | --- |
| \`dict\` | 객체 \`{}\` | 키는 문자열로 바뀐다 |
| \`list\`, \`tuple\` | 배열 \`[]\` | 튜플은 읽으면 리스트가 된다 |
| \`str\`, \`int\`, \`float\` | 문자열, 수 | |
| \`True\`, \`False\`, \`None\` | \`true\`, \`false\`, \`null\` | |

\`\`\`python
import json

experiment = {
    "model": "logistic",
    "params": {"lr": 0.01, "epochs": 20},
    "scores": {1: 0.81, 2: 0.84},      # 정수 키
    "shape": (28, 28),                 # 튜플
}
with open("experiment.json", "w", encoding="utf-8") as f:
    json.dump(experiment, f, ensure_ascii=False, indent=2)

with open("experiment.json", encoding="utf-8") as f:
    loaded = json.load(f)
print(loaded["params"]["lr"], loaded["shape"])   # 0.01 [28, 28]
print(list(loaded["scores"]))                    # ['1', '2']: 정수 키가 문자열이 되었다
print(loaded == experiment)                      # False
\`\`\`

마지막 줄이 \`False\`인 이유는 정수 키가 문자열이 되고 튜플이 리스트가 되었기 때문이다. JSON으로 저장할 데이터는 처음부터 문자열 키와 리스트로 만들면 저장 전후가 같아진다.

### 어떤 형식을 쓰는가

| 형식 | 맞는 데이터 | 한계 |
| --- | --- | --- |
| 텍스트 | 학습 로그, 한 줄에 하나씩인 문장 | 구조가 없어 직접 나눠 읽어야 한다 |
| CSV | 행과 열로 된 표(행은 샘플, 열은 특성) | 자료형 정보가 없고 중첩 구조를 담지 못한다 |
| JSON | 설정, 결과 요약, 중첩 구조 | 큰 수치 데이터에는 느리고 크다 |

큰 수치 배열은 NumPy의 \`.npy\`, 큰 표는 Parquet 같은 이진 형식을 쓴다. 이 형식들은 자료형을 함께 저장하고 읽기가 빠르다.

:::warn 흔한 실수
- **\`"w"\` 모드로 기존 파일을 연다.** 내용이 바로 지워진다. 덧붙이려면 \`"a"\`를 쓴다.
- **\`encoding="utf-8"\`을 빠뜨린다.** 다른 운영체제에서 한국어가 깨진다.
- **CSV에서 읽은 숫자를 그대로 계산한다.** 문자열이라 \`"88" + "95"\`는 \`"8895"\`다.
- **줄 끝의 \`"\n"\`을 지우지 않는다.** 비교(\`line == "done"\`)가 항상 거짓이 된다.
- **JSON의 정수 키를 그대로 쓴다.** 읽고 나면 문자열 키다.
:::
`,
  checks: [
    {
      key: "c1",
      question: "이미 내용이 있는 `results.txt`를 `open(\"results.txt\", \"w\")`로 열고 한 줄을 쓰면 파일은 어떻게 되는가?",
      choices: ["기존 내용 뒤에 한 줄이 추가된다", "기존 내용이 지워지고 새 한 줄만 남는다", "`FileExistsError`가 난다", "파일이 읽기 전용으로 열려 쓸 수 없다"],
      answer: 1,
      explanation: "`\"w\"` 모드는 파일을 비우고 새로 쓴다. 기존 내용 뒤에 덧붙이려면 `\"a\"` 모드를 쓴다.",
    },
    {
      key: "c2",
      question: "파일을 `with open(...) as f:`로 여는 가장 중요한 이유는?",
      choices: ["파일을 더 빨리 읽기 때문이다", "블록이 끝나면 오류가 나도 파일이 자동으로 닫히기 때문이다", "인코딩을 자동으로 맞춰 주기 때문이다", "파일이 없으면 새로 만들어 주기 때문이다"],
      answer: 1,
      explanation: "`with`는 블록을 벗어날 때 예외가 발생했더라도 파일을 닫는다. 닫지 않은 파일은 내용이 디스크에 다 쓰이지 않거나 다른 프로그램이 열지 못하는 문제를 일으킨다.",
    },
    {
      key: "c3",
      question: "`csv.DictReader`로 읽은 행에서 `row[\"score\"]`의 자료형은?",
      choices: ["`int`", "`float`", "`str`", "머리글에 따라 자동으로 정해진다"],
      answer: 2,
      explanation: "CSV는 자료형 정보 없이 글자만 저장하므로 읽은 값은 모두 문자열이다. 계산 전에 `int()`나 `float()`로 바꾼다.",
    },
    {
      key: "c4",
      question: "`json.loads(json.dumps({1: \"a\"}))`의 결과는?",
      choices: ["`{1: 'a'}`", "`{'1': 'a'}`", "`['a']`", "`TypeError`"],
      answer: 1,
      explanation: "JSON 객체의 키는 항상 문자열이다. 저장할 때 정수 키 1이 문자열 \"1\"로 바뀌고, 다시 읽으면 문자열 키로 남는다.",
    },
    {
      key: "c5",
      question: "`for line in f:`로 읽은 줄과 `\"done\"`을 비교했더니 마지막 줄이 \"done\"인데도 `line == \"done\"`이 거짓이다. 원인과 해결은?",
      choices: [
        "줄 끝에 줄바꿈 `\"\\n\"`이 붙어 있으므로 `line.strip() == \"done\"`으로 비교한다",
        "파일을 `\"w\"` 모드로 열었기 때문이다",
        "문자열은 `==`로 비교할 수 없으므로 `is`를 쓴다",
        "인코딩이 달라서이므로 `encoding=\"ascii\"`로 연다",
      ],
      answer: 0,
      explanation: "파일에서 한 줄씩 읽으면 줄 끝의 `\"\\n\"`까지 함께 읽는다. `strip()`으로 앞뒤 공백과 줄바꿈을 없앤 뒤 비교한다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import json
data = {"lr": 0.1, "layers": (64, 32), "tags": None}
text = json.dumps(data)
back = json.loads(text)
print(text)
print(back["layers"], back == data)
`,
      expected: "{\"lr\": 0.1, \"layers\": [64, 32], \"tags\": null}\n[64, 32] False",
      explanation: "JSON에는 튜플이 없어 배열 `[64, 32]`로 저장되고, `None`은 `null`이 된다. 다시 읽으면 튜플 대신 리스트가 나오므로 원래 딕셔너리와 같지 않다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "학생 점수 기록을 CSV와 JSON 중 어느 형식으로 저장할지 정하려고 한다. 두 형식의 차이를 자료형과 구조의 관점에서 설명하고, 각각이 더 알맞은 경우를 예로 들어라.",
      answer: md`
CSV는 행과 열로 된 표를 저장하고 값의 자료형 정보가 없어, 읽은 값은 모두 문자열이므로 다시 변환해야 한다. 중첩 구조(한 학생의 과목별 점수 목록 등)는 담지 못한다. 대신 표 계산 프로그램과 pandas에서 바로 열 수 있어, 학생 한 명이 한 행인 점수표처럼 평평한 표에 알맞다. JSON은 딕셔너리와 리스트를 겹친 구조와 수·문자열·불리언·null을 구분해 저장하므로, 학생마다 과목별 점수 목록과 메모가 있는 기록이나 실험 설정처럼 중첩된 데이터에 알맞다. 다만 JSON은 키가 문자열로 바뀌고 튜플이 리스트로 바뀐다.
`,
      keyPoints: ["CSV는 평평한 표, 자료형 정보 없음(모두 문자열로 읽힘)", "JSON은 중첩 구조와 기본 자료형을 구분해 저장", "용도에 맞는 예(점수표 → CSV, 중첩 기록·설정 → JSON)"],
    },
  ],
  references: [
    { title: "Python 자습서 7.2 — 파일을 읽고 쓰기 (한국어)", url: "https://docs.python.org/ko/3/tutorial/inputoutput.html#reading-and-writing-files", note: "open, with, json 저장" },
    { title: "Python 표준 라이브러리 — csv (한국어)", url: "https://docs.python.org/ko/3/library/csv.html", note: "DictReader, DictWriter, newline=''" },
    { title: "Python 표준 라이브러리 — pathlib (한국어)", url: "https://docs.python.org/ko/3/library/pathlib.html", note: "Path로 경로 다루기" },
  ],
});
