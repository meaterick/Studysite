import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "CSV 저장·복원과 JSON 설정 읽기",
    prompt: md`

세 함수를 완성합니다.

1. \`save_records(path, records)\`: \`[{"name": ..., "score": ...}, ...]\`를 머리글이 \`name,score\`인 CSV 파일로 저장합니다.
2. \`load_records(path)\`: 그 CSV 파일을 읽어 같은 리스트를 돌려줍니다. CSV에서 읽은 점수는 문자열이므로 정수로 바꿉니다.
3. \`load_config(path, defaults)\`: JSON 설정 파일의 값으로 \`defaults\`를 덮어쓴 **새 딕셔너리**를 돌려줍니다. 파일이 없으면 \`defaults\`의 복사본을 돌려줍니다. \`defaults\`는 바꾸지 않습니다.
`,
    starter: py`
import csv
import json
from pathlib import Path

def save_records(path, records):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "score"])
        # TODO: 머리글을 쓰고(writeheader) 기록을 모두 씁니다(writerows).

def load_records(path):
    records = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pass   # TODO: {"name": 이름, "score": 정수 점수}를 records에 추가합니다.
    return records

def load_config(path, defaults):
    config = dict(defaults)      # 복사본에서 시작한다
    # TODO: Path(path).exists()이면 json.load로 읽은 값으로 config를 덮어씁니다(update).
    return config

save_records("scores.csv", [{"name": "민수", "score": 88}, {"name": "지현", "score": 95}])
print(load_records("scores.csv"))
with open("config.json", "w", encoding="utf-8") as f:
    json.dump({"lr": 0.01}, f)
print(load_config("config.json", {"lr": 0.1, "epochs": 10}))
`,
    tests: py`
import json

@test("CSV로 저장한 뒤 다시 읽으면 같은 기록이다")
def _():
    records = [{"name": "민수", "score": 88}, {"name": "지현", "score": 95}]
    save_records("t_scores.csv", records)
    got = load_records("t_scores.csv")
    assert got == records, f"결과: {got}"

@test("파일의 첫 줄은 머리글 name,score")
def _():
    save_records("t_header.csv", [{"name": "a", "score": 1}])
    first = open("t_header.csv", encoding="utf-8").readline().strip()
    assert first == "name,score", f"첫 줄: {first!r}"

@test("읽은 점수는 정수다")
def _():
    save_records("t_type.csv", [{"name": "도윤", "score": 70}])
    got = load_records("t_type.csv")
    assert got and type(got[0]["score"]) is int, f"결과: {got}"

@test("load_config: 파일의 값으로 덮어쓰고 나머지는 기본값")
def _():
    with open("t_config.json", "w", encoding="utf-8") as f:
        json.dump({"lr": 0.01, "seed": 7}, f)
    defaults = {"lr": 0.1, "epochs": 10}
    got = load_config("t_config.json", defaults)
    assert got == {"lr": 0.01, "epochs": 10, "seed": 7}, f"결과: {got}"
    assert defaults == {"lr": 0.1, "epochs": 10}, "defaults가 바뀌었습니다."

@test("load_config: 파일이 없으면 기본값의 복사본")
def _():
    defaults = {"lr": 0.1}
    got = load_config("없는_파일.json", defaults)
    assert got == defaults and got is not defaults
`,
    hints: [
      "`writer.writeheader()` 다음 `writer.writerows(records)`로 씁니다.",
      "`records.append({\"name\": row[\"name\"], \"score\": int(row[\"score\"])})`처럼 점수만 정수로 바꿉니다.",
      "`if Path(path).exists():` 안에서 `with open(path, encoding=\"utf-8\") as f: config.update(json.load(f))`를 씁니다.",
    ],
    solution: py`
import csv
import json
from pathlib import Path

def save_records(path, records):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "score"])
        writer.writeheader()
        writer.writerows(records)

def load_records(path):
    records = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            records.append({"name": row["name"], "score": int(row["score"])})
    return records

def load_config(path, defaults):
    config = dict(defaults)
    if Path(path).exists():
        with open(path, encoding="utf-8") as f:
            config.update(json.load(f))
    return config

save_records("scores.csv", [{"name": "민수", "score": 88}, {"name": "지현", "score": 95}])
print(load_records("scores.csv"))
with open("config.json", "w", encoding="utf-8") as f:
    json.dump({"lr": 0.01}, f)
print(load_config("config.json", {"lr": 0.1, "epochs": 10}))
`,
  },
]);
