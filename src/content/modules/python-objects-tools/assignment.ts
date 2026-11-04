import { defineAssignment, md, py } from "../../kit";

export default defineAssignment({
  key: "python-records-report",
  kind: "track",
  title: "학생 기록 정리 리포트",
  summary: md`

과목별 점수 기록이 담긴 CSV 파일을 **표준 라이브러리만으로** 읽어, 잘못된 줄을 종류별로 기록하고, 과목별·학생별 요약을 계산해 JSON 파일로 저장합니다. 트랙 1의 파일 입출력, 컬렉션과 함수, 예외 처리, 클래스, 시간복잡도, 재현 가능한 실행을 한 작업 공간에서 함께 씁니다. 모든 코드는 브라우저에서 실행됩니다.

**핵심** 단계 네 개(기록 읽기·요약 계산·기록부 클래스·리포트 저장)만 채점합니다. **보충**(빠진 과목 찾기)과 **심화**(큰 데이터에서 조회 시간 비교) 단계는 선택이며 피드백만 받습니다. 제출하기 전에 "실행 환경 초기화" 후 "전체 실행"으로 처음부터 같은 결과가 나오는지 확인합니다.
`,
  requirements: [
    "`load_records`가 정상 기록 17건을 정수 점수로 읽고, 문제가 있는 다섯 줄을 줄 번호와 사유로 기록한다.",
    "`subject_summary`, `student_means`, `top_students`가 과목별 개수·평균·최고점과 학생별 평균, 상위 학생을 계산한다(평균이 같으면 이름순).",
    "`RecordBook`이 잘못된 점수에 `ValueError`를 일으키고, 이름별·과목별 조회를 딕셔너리로 바로 처리한다.",
    "리포트를 `report.json`에 한국어 그대로(UTF-8) 저장하고, 다시 읽은 내용이 저장 전과 같다. 시드 42로 고른 학생 표본이 매번 같다.",
    "실행 환경을 초기화한 뒤 처음부터 실행해도 같은 결과가 나온다.",
  ],
  tasks: [
    {
      id: "load",
      title: "기록 읽기와 잘못된 줄 처리",
      tier: "core",
      instructions: md`

첫 코드 셀은 과제 데이터 \`records.csv\`를 만듭니다. 고치지 말고 그대로 실행합니다. 데이터에는 숫자가 아닌 점수, 0~100 밖의 점수, 쉼표가 빠진 줄이 섞여 있습니다.

두 번째 셀의 \`load_records(path)\`를 완성합니다. 줄마다 **열 개수 → 정수 변환 → 점수 범위(0~100)** 순서로 검사하고, 문제가 있으면 \`(줄 번호, 사유)\`를 \`problems\`에 추가한 뒤 다음 줄로 넘어갑니다. 사유는 \`"열 개수 오류"\`, \`"점수가 정수가 아님"\`, \`"점수 범위 밖"\` 중 하나로 씁니다. 줄 번호는 머리글을 1번으로 세므로 첫 데이터 줄이 2번입니다. 정상 줄은 앞뒤 공백을 없애고 \`{"name": ..., "subject": ..., "score": 정수}\`로 \`records\`에 추가합니다([[lesson:file-io]], [[lesson:errors-debugging]]).
`,
      cells: [
        { kind: "code", id: "load-data", label: "과제 데이터 만들기(고치지 않습니다)", starter: py`
DATA = """name,subject,score
김민준,수학,88
김민준,영어,92
김민준,과학,79
이서연,수학,95
이서연,영어,결석
이서연,과학,91
박도윤,수학,72
박도윤,영어,68
박도윤,과학,105
최지우,수학,81
최지우,영어,77
최지우,과학,84
정하은,수학,-3
정하은,영어,90
정하은,과학,93
강시우,수학,64
강시우,영어,
강시우,과학,70
윤서아 수학 89
조예준,수학,90
조예준,영어,85
조예준,과학,88
"""
with open("records.csv", "w", encoding="utf-8") as f:
    f.write(DATA)
print("records.csv를 만들었습니다:", DATA.count("\n") - 1, "줄")
` },
        { kind: "code", id: "load-code", label: "기록 읽기", starter: py`
import csv

def load_records(path):
    """CSV → (정상 기록 리스트, [(줄 번호, 사유), ...])"""
    records, problems = [], []
    with open(path, encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        next(reader)                                   # 머리글 줄을 건너뛴다
        for line_no, row in enumerate(reader, start=2):
            pass  # TODO: 열 개수 → 정수 변환 → 점수 범위 순서로 검사하고, 문제가 있으면 (line_no, 사유)를 problems에 추가합니다.
    return records, problems

records, problems = load_records("records.csv")
print(f"정상 기록 {len(records)}건, 문제 {len(problems)}건")
for line_no, reason in problems:
    print(line_no, reason)
` },
        { kind: "text", id: "load-answer", prompt: "건너뛴 줄을 종류별로 정리하고, 문제가 있는 점수를 0점으로 바꾸지 않고 건너뛴 이유를 설명해 주십시오.", minChars: 80 },
      ],
    },
    {
      id: "summary",
      title: "과목별·학생별 요약",
      tier: "core",
      instructions: md`

세 함수를 완성합니다. 평균은 소수점 둘째 자리로 반올림합니다(\`round(값, 2)\`). 과목·학생별로 점수를 모을 때는 \`groups.setdefault(키, []).append(점수)\`처럼 딕셔너리에 리스트를 모으고, 요약은 딕셔너리 컴프리헨션으로 만듭니다([[lesson:collections]], [[lesson:comprehensions-iterators]]).

- \`subject_summary(records)\`: \`{과목: {"count": 개수, "mean": 평균, "max": 최고점}}\`
- \`student_means(records)\`: \`{이름: 평균}\`
- \`top_students(means, n)\`: 평균이 높은 순으로 이름 \`n\`개. 평균이 같으면 이름순입니다. \`sorted\`의 \`key\`로 \`(-평균, 이름)\`을 씁니다.
`,
      cells: [
        { kind: "code", id: "summary-code", label: "요약 계산", starter: py`
def subject_summary(records):
    """{과목: {"count": 개수, "mean": 평균(소수점 둘째 자리), "max": 최고점}}"""
    groups = {}
    # TODO: 과목별 점수 리스트를 groups에 모읍니다.
    return {}  # TODO: groups로 과목별 요약 딕셔너리를 만듭니다.

def student_means(records):
    """{이름: 평균(소수점 둘째 자리)}"""
    return {}  # TODO: 학생별 평균을 계산합니다.

def top_students(means, n):
    """평균이 높은 순으로 이름 n개(평균이 같으면 이름순)"""
    return []  # TODO: sorted(means.items(), key=...)로 정렬해 이름만 고릅니다.

summary = subject_summary(records)
means = student_means(records)
print(summary)
print(means)
print(top_students(means, 3))
` },
        { kind: "text", id: "summary-answer", prompt: "과목별 평균과 상위 3명을 정리하고, 학생별 평균만으로 학생을 비교할 때의 한계(응시한 과목 수가 다른 경우 등)를 설명해 주십시오.", minChars: 200, template: "| 과목 | 개수 | 평균 | 최고점 |\n| --- | --- | --- | --- |\n| 수학 |  |  |  |\n| 영어 |  |  |  |\n| 과학 |  |  |  |\n\n상위 3명:\n\n평균 비교의 한계:" },
      ],
    },
    {
      id: "class",
      title: "기록부 클래스",
      tier: "core",
      instructions: md`

\`RecordBook\` 클래스를 완성합니다([[lesson:classes-objects]]).

- \`add(record)\`: 점수가 \`int\`가 아니거나 0~100 밖이면 **아무것도 바꾸지 않고** \`ValueError\`를 일으킵니다. 정상이면 이름별·과목별 딕셔너리에 점수를 추가하고 개수를 1 늘립니다.
- \`scores_of(name)\`: 그 학생의 점수 리스트를 **복사해서** 돌려줍니다. 없는 학생이면 빈 리스트입니다. 내부 리스트를 그대로 돌려주면 바깥에서 고칠 수 있습니다([[lesson:mutability-copy]]).
- \`mean_of(subject)\`: 과목의 평균입니다. 기록이 없는 과목이면 \`KeyError\`를 일으킵니다.
`,
      cells: [
        { kind: "code", id: "class-code", label: "RecordBook", starter: py`
class RecordBook:
    """학생 기록을 이름별·과목별로 모아 두고 조회한다."""
    def __init__(self):
        self.by_name = {}       # 이름 → [점수, ...]
        self.by_subject = {}    # 과목 → [점수, ...]
        self.count = 0

    def add(self, record):
        score = record["score"]
        # TODO: 점수가 int가 아니거나 0~100 밖이면 ValueError를 일으킵니다.
        # TODO: by_name과 by_subject에 점수를 추가하고 count를 1 늘립니다.

    def scores_of(self, name):
        """학생의 점수 리스트(복사본). 없는 학생이면 빈 리스트"""
        return []  # TODO: 복사본을 돌려줍니다.

    def mean_of(self, subject):
        """과목 평균. 기록이 없는 과목이면 KeyError"""
        return 0.0  # TODO: by_subject에서 평균을 계산합니다.

    def __len__(self):
        return self.count

book = RecordBook()
for r in records:
    book.add(r)
print(len(book), book.scores_of("김민준"), round(book.mean_of("영어"), 2))
` },
        { kind: "text", id: "class-answer", prompt: "RecordBook이 기록 리스트 하나 대신 이름별·과목별 딕셔너리를 따로 두는 이유를 시간복잡도로 설명해 주십시오.", minChars: 60 },
      ],
    },
    {
      id: "report",
      title: "리포트 저장과 재현 확인",
      tier: "core",
      instructions: md`

\`build_report\`의 표본 학생 3명을 \`random.Random(seed).sample(sorted(means), 3)\`으로 고르고, \`save_report\`로 리포트를 \`report.json\`에 저장합니다. 한국어가 그대로 보이도록 \`ensure_ascii=False\`, 읽기 좋게 \`indent=2\`를 주고 파일은 \`encoding="utf-8"\`로 엽니다. 셀 마지막 줄이 \`True\`를 출력하면 저장 전후가 같습니다([[lesson:notebooks-reproducibility]]).

이름을 정렬한 뒤 고르는 이유는 딕셔너리에 들어간 순서와 관계없이 같은 학생이 뽑히게 하기 위해서입니다.
`,
      cells: [
        { kind: "code", id: "report-code", label: "리포트 저장", starter: py`
import json
import random

def build_report(records, problems, seed=42):
    means = student_means(records)
    return {
        "subjects": subject_summary(records),
        "top3": top_students(means, 3),
        "skipped_lines": [line_no for line_no, _ in problems],
        "seed": seed,
        "sample": [],  # TODO: random.Random(seed).sample(sorted(means), 3)으로 학생 3명을 고릅니다.
    }

def save_report(path, report):
    pass  # TODO: report를 JSON 파일로 저장합니다.

report = build_report(records, problems)
save_report("report.json", report)
with open("report.json", encoding="utf-8") as f:
    reloaded = json.load(f)
print(json.dumps(reloaded, ensure_ascii=False, indent=2))
print(reloaded == report)
` },
        { kind: "text", id: "report-answer", prompt: "실행 환경을 초기화한 뒤 전체 실행해 같은 report.json이 나오는지 확인한 방법과, 같은 코드라도 결과가 달라질 수 있는 요인 두 가지를 적어 주십시오.", minChars: 60 },
      ],
    },
    {
      id: "missing",
      title: "보충: 빠진 과목 찾기",
      tier: "supplement",
      instructions: md`

\`missing_subjects(records, subjects)\`를 완성해, 정상 기록 기준으로 빠진 과목이 있는 학생과 그 과목을 찾습니다. 학생마다 응시한 과목의 집합을 만들고, 전체 과목과의 차집합을 구합니다. 빠진 과목은 \`subjects\`에 적힌 순서대로 나열합니다. 쉼표가 빠진 줄의 학생(윤서아)은 정상 기록이 없으므로 결과에 나오지 않는다는 점도 확인합니다.
`,
      cells: [
        { kind: "code", id: "missing-code", label: "빠진 과목", starter: py`
def missing_subjects(records, subjects=("수학", "영어", "과학")):
    """{이름: [빠진 과목, ...]}: 빠진 과목이 있는 학생만"""
    taken = {}
    for r in records:
        taken.setdefault(r["name"], set()).add(r["subject"])
    return {}  # TODO: 학생마다 subjects 중 taken에 없는 과목을 순서대로 모읍니다(빠진 것이 있는 학생만).

print(missing_subjects(records))
` },
        { kind: "text", id: "missing-answer", prompt: "(선택) 빠진 과목이 있는 학생의 평균을 다른 학생과 같은 기준으로 비교해도 되는지 의견을 적어 주십시오." },
      ],
    },
    {
      id: "scale",
      title: "심화: 큰 데이터에서 조회 시간 비교",
      tier: "advanced",
      instructions: md`

기록 3만 건을 만들어, 학생 300명의 점수를 조회하는 시간을 두 방법으로 잽니다. ① 조회할 때마다 전체 기록을 훑는 \`scores_by_scan\`, ② \`RecordBook\`에 한 번 넣은 뒤 \`scores_of\`로 조회하는 방법입니다. \`time.perf_counter()\`로 각각의 시간을 재서 출력하고, ②는 넣는 시간까지 포함해 비교합니다([[lesson:complexity]]).
`,
      cells: [
        { kind: "code", id: "scale-code", label: "시간 비교", starter: py`
import random
import time

def make_records(n, seed=0):
    rng = random.Random(seed)
    names = [f"학생{i}" for i in range(n // 3)]
    return [{"name": rng.choice(names), "subject": rng.choice(["수학", "영어", "과학"]), "score": rng.randint(0, 100)} for _ in range(n)]

def scores_by_scan(records, name):       # 조회할 때마다 O(n)
    return [r["score"] for r in records if r["name"] == name]

big = make_records(30_000)
targets = [r["name"] for r in big[:300]]
# TODO: 두 방법의 시간을 재서 출력합니다.
` },
        { kind: "text", id: "scale-answer", prompt: "(선택) 측정한 시간을 적고, 조회 횟수가 늘어나면 두 방법의 차이가 어떻게 변할지 시간복잡도로 설명해 주십시오." },
      ],
    },
  ],
  rubric: [
    { id: "load", label: "데이터 읽기와 오류 처리", points: 3, guide: "문제가 있는 줄을 종류별로 구분해 줄 번호와 함께 기록하고, 정상 줄은 빠짐없이 정수 점수로 읽었습니다. 잘못된 값을 0점으로 바꾸지 않은 이유를 설명했습니다." },
    { id: "aggregate", label: "집계의 정확성", points: 3, guide: "과목별 개수·평균·최고점, 학생별 평균, 상위 학생(동점 처리 포함)이 정확하고, 평균 비교의 한계를 설명했습니다." },
    { id: "design", label: "클래스 설계와 자료구조 선택", points: 2, guide: "RecordBook이 잘못된 점수를 거부하고 복사본을 돌려주며, 딕셔너리를 고른 이유를 시간복잡도로 설명했습니다." },
    { id: "repro", label: "재현성과 코드 품질", points: 2, guide: "초기화 후 전체 실행으로 같은 결과가 나오고, 저장한 JSON을 다시 읽은 내용이 같으며, 함수가 입력을 바꾸지 않습니다." },
  ],
  gradingNotes: md`
- **기록 읽기**: 정상 기록 17건, 문제 줄은 6번(점수가 정수가 아님: "결석"), 10번(점수 범위 밖: 105), 14번(점수 범위 밖: -3), 18번(점수가 정수가 아님: 빈 칸), 20번(열 개수 오류: 쉼표 없음)이다. 0점으로 바꾸면 평균이 낮아지고 실제 0점과 구분되지 않는다는 설명이 핵심이다.
- **요약**: 수학 6건·평균 81.67·최고 95, 영어 5건·평균 82.4·최고 92, 과학 6건·평균 84.17·최고 93이다. 상위 3명은 이서연(93.0), 정하은(91.5), 조예준(87.67)이다. 응시 과목 수가 2개인 학생(이서연, 정하은 등)과 3개인 학생의 평균을 같은 기준으로 비교하는 한계를 짚으면 우수하다.
- **기록부 클래스**: 리스트 하나에서 이름으로 찾으면 조회마다 $O(n)$, 딕셔너리는 평균 $O(1)$이라는 설명이 필요하다. 추가할 때 두 딕셔너리를 함께 갱신하는 대가(메모리, 일관성 유지)를 언급하면 우수하다.
- **리포트**: 시드 42의 표본은 조예준, 강시우, 최지우다. 결과가 달라지는 요인으로 시드를 고정하지 않은 난수, 셀 실행 순서·숨은 상태, 데이터 파일 차이, 라이브러리·파이썬 버전 등을 들면 된다.
- (채점 외) 심화 단계에서 3만 건·300회 조회 기준으로 전체 훑기가 딕셔너리 조회보다 수십~수백 배 느리고, 조회 횟수가 늘수록 차이가 커진다고 설명했다면 피드백에서 언급한다.
`,
  maxScore: 10,
  autoTests: [
    { id: "r1-at-load", taskId: "load", title: "정상 기록 17건과 문제 줄 다섯 개를 정확히 구분한다", hint: "열 개수 → 정수 변환 → 범위 순서로 검사하고, 사유 문자열을 과제 설명과 똑같이 씁니다.", code: py`
assert len(records) == 17, f"정상 기록 {len(records)}건(기대 17건)"
expected = [(6, "점수가 정수가 아님"), (10, "점수 범위 밖"), (14, "점수 범위 밖"), (18, "점수가 정수가 아님"), (20, "열 개수 오류")]
assert problems == expected, f"problems = {problems}"
assert all(type(r["score"]) is int for r in records), "점수가 정수가 아닌 기록이 있습니다."
assert records[0] == {"name": "김민준", "subject": "수학", "score": 88}, f"첫 기록: {records[0]}"
` },
    { id: "r1-at-summary", taskId: "summary", title: "과목별 요약과 상위 학생이 정확하다", hint: "평균은 `round(합 / 개수, 2)`입니다. 동점은 이름순으로 정렬합니다.", code: py`
s = subject_summary(records)
assert s.get("수학") == {"count": 6, "mean": 81.67, "max": 95}, f"수학: {s.get('수학')}"
assert s.get("영어") == {"count": 5, "mean": 82.4, "max": 92}, f"영어: {s.get('영어')}"
assert s.get("과학") == {"count": 6, "mean": 84.17, "max": 93}, f"과학: {s.get('과학')}"
m = student_means(records)
assert m.get("이서연") == 93.0 and m.get("김민준") == 86.33, f"학생별 평균: {m}"
assert top_students(m, 3) == ["이서연", "정하은", "조예준"], f"상위 3명: {top_students(m, 3)}"
assert top_students({"b": 90, "a": 90, "c": 80}, 2) == ["a", "b"], "평균이 같으면 이름순입니다."
` },
    { id: "r1-at-class", taskId: "class", title: "RecordBook이 잘못된 점수를 거부하고 복사본을 돌려준다", hint: "`isinstance(score, int)`와 `0 <= score <= 100`을 먼저 검사한 뒤에 추가합니다.", code: py`
b = RecordBook()
b.add({"name": "가", "subject": "수학", "score": 80})
b.add({"name": "가", "subject": "영어", "score": 90})
assert len(b) == 2 and b.scores_of("가") == [80, 90] and b.scores_of("없음") == [], "추가·조회 결과가 다릅니다."
assert b.mean_of("수학") == 80, f"mean_of('수학') = {b.mean_of('수학')}"
for bad in (101, -1, "90"):
    try:
        b.add({"name": "나", "subject": "수학", "score": bad})
        raised = False
    except ValueError:
        raised = True
    assert raised, f"점수 {bad!r}에 ValueError가 나지 않았습니다."
assert len(b) == 2 and b.scores_of("나") == [], "잘못된 기록이 추가되었습니다."
try:
    b.mean_of("과학")
    missing_raised = False
except KeyError:
    missing_raised = True
assert missing_raised, "기록이 없는 과목에 KeyError가 나지 않았습니다."
copy = b.scores_of("가")
copy.append(0)
assert b.scores_of("가") == [80, 90], "scores_of가 내부 리스트를 그대로 돌려줍니다."
` },
    { id: "r1-at-report", taskId: "report", title: "표본이 재현되고 JSON 저장 전후가 같다", hint: "`with open(path, \"w\", encoding=\"utf-8\") as f: json.dump(report, f, ensure_ascii=False, indent=2)`", code: py`
import json
r = build_report(records, problems)
assert r["sample"] == ["조예준", "강시우", "최지우"], f"sample = {r['sample']}"
assert build_report(records, problems) == r, "같은 시드인데 결과가 다릅니다."
save_report("check_report.json", r)
with open("check_report.json", encoding="utf-8") as f:
    text = f.read()
assert json.loads(text) == r, "저장한 파일을 다시 읽은 내용이 다릅니다."
assert "조예준" in text, "ensure_ascii=False로 한국어를 그대로 저장합니다."
` },
    { id: "r1-at-missing", taskId: "missing", title: "빠진 과목이 있는 학생을 찾는다", code: py`
got = missing_subjects(records)
assert got == {"이서연": ["영어"], "박도윤": ["과학"], "정하은": ["수학"], "강시우": ["영어"]}, f"결과: {got}"
` },
  ],
  challenges: [
    {
      key: "ch1",
      title: "중앙값과 최빈값",
      prompt: md`

평균은 극단적인 값의 영향을 크게 받습니다. 정렬을 이용해 \`median(values)\`(중앙값)과 \`mode(values)\`(최빈값)를 직접 구현합니다. 표준 라이브러리 \`statistics\`는 쓰지 않습니다.

- \`median\`: 정렬한 뒤 개수가 홀수면 가운데 값, 짝수면 가운데 두 값의 평균입니다. 빈 리스트면 \`ValueError\`입니다.
- \`mode\`: 가장 많이 나온 값입니다. 횟수가 같은 값이 여러 개면 그중 가장 작은 값을 돌려줍니다. 빈 리스트면 \`ValueError\`입니다.
- 두 함수 모두 입력 리스트를 바꾸지 않습니다.
`,
      starter: py`
def median(values):
    # TODO: 빈 리스트면 ValueError, 아니면 정렬한 복사본으로 중앙값을 구합니다.
    return 0.0

def mode(values):
    # TODO: 딕셔너리로 횟수를 센 뒤, (횟수가 크고 값이 작은) 원소를 고릅니다.
    return None

print(median([88, 95, 72]), median([88, 95, 72, 81]), mode([3, 1, 3, 1, 2]))
`,
      tests: py`
@test("홀수 개의 중앙값")
def _():
    assert median([88, 95, 72]) == 88

@test("짝수 개의 중앙값은 가운데 두 값의 평균")
def _():
    assert median([88, 95, 72, 81]) == 84.5

@test("입력을 바꾸지 않는다")
def _():
    xs = [3, 1, 2]
    median(xs)
    mode(xs)
    assert xs == [3, 1, 2], f"입력이 바뀌었습니다: {xs}"

@test("최빈값: 횟수가 같으면 가장 작은 값")
def _():
    assert mode([3, 1, 3, 1, 2]) == 1
    assert mode([5, 5, 4]) == 5

@test("빈 리스트면 ValueError")
def _():
    for fn in (median, mode):
        try:
            fn([])
            raised = False
        except ValueError:
            raised = True
        assert raised, f"{fn.__name__}([])에서 ValueError가 나지 않았습니다."
`,
      hints: [
        "`s = sorted(values)`는 정렬한 새 리스트입니다. 개수가 `n`이면 가운데 인덱스는 `n // 2`입니다.",
        "짝수 개일 때는 `(s[n // 2 - 1] + s[n // 2]) / 2`입니다.",
        "`mode`는 `counts`를 만든 뒤 `min(counts, key=lambda v: (-counts[v], v))`로 횟수가 크고 값이 작은 원소를 고를 수 있습니다.",
      ],
      solution: py`
def median(values):
    if not values:
        raise ValueError("빈 리스트의 중앙값은 정의되지 않는다")
    s = sorted(values)
    n = len(s)
    if n % 2 == 1:
        return s[n // 2]
    return (s[n // 2 - 1] + s[n // 2]) / 2

def mode(values):
    if not values:
        raise ValueError("빈 리스트의 최빈값은 정의되지 않는다")
    counts = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    return min(counts, key=lambda v: (-counts[v], v))

print(median([88, 95, 72]), median([88, 95, 72, 81]), mode([3, 1, 3, 1, 2]))
`,
    },
  ],
});
