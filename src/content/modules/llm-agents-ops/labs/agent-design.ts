import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "단기 기억 자르기와 장기 기억 검색으로 컨텍스트 조립하기",
    prompt: md`
「에이전트 설계와 안전」의 단기 기억(컨텍스트에 담아 두는 최근 이력)과 장기 기억(세션 밖 저장소에서 검색해 불러오는 기억)을 직접 만듭니다.

1. \`trim_history(hist, max_obs)\`: \`hist[0]\`(목표)은 항상 남기고, 나머지 관찰 중 **최근** \`max_obs\`개만 남긴 새 리스트를 돌려줍니다. \`max_obs\`가 0이면 목표만 남습니다. 원래 \`hist\`는 바꾸지 않습니다.
2. \`recall(memories, query, k=1)\`: 질문과 기억을 각각 공백으로 나눈 **단어 집합**의 교집합 크기(겹치는 단어 수)가 큰 순서로 기억을 최대 \`k\`개 돌려줍니다. 겹치는 단어 수가 같으면 **최근 기억**(리스트의 뒤쪽)을 먼저, 하나도 겹치지 않는 기억은 돌려주지 않습니다.
3. \`build_context(hist, memories, query, k=1, max_obs=2)\`: 다음 줄들을 줄바꿈으로 이은 문자열을 돌려줍니다. 목표 → \`[기억] …\` 줄들(\`recall\` 결과 순서) → 최근 관찰 \`max_obs\`개 → \`질문: …\`
`,
    starter: py`
def trim_history(hist, max_obs):
    return hist  # TODO: 목표는 남기고 최근 관찰 max_obs개만 (max_obs = 0이면 목표만)

def recall(memories, query, k=1):
    return []  # TODO: 겹치는 단어 수 내림차순, 같으면 최근 기억 먼저, 하나도 안 겹치면 제외

def build_context(hist, memories, query, k=1, max_obs=2):
    return ""  # TODO: 목표 → [기억] 줄들 → 최근 관찰 → 질문

memories = [
    "사용자는 답을 표로 정리해 주는 것을 좋아한다",
    "사용자는 RAG 과제에서 청크 크기 500을 골랐다",
    "사용자의 발표 순서는 세 번째다",
]
hist = ["목표: 과제 리포트 정리", "관찰 1", "관찰 2", "관찰 3", "관찰 4", "관찰 5"]
print(trim_history(hist, 2))
print(recall(memories, "과제에서 청크 크기 몇으로 했지?"))
print(build_context(hist, memories, "과제에서 청크 크기 몇으로 했지?"))
`,
    tests: py`
hist = ["목표: 과제 리포트 정리", "관찰 1", "관찰 2", "관찰 3", "관찰 4", "관찰 5"]
memories = [
    "사용자는 답을 표로 정리해 주는 것을 좋아한다",
    "사용자는 RAG 과제에서 청크 크기 500을 골랐다",
    "사용자의 발표 순서는 세 번째다",
    "사용자는 과제에서 청크 크기 200도 시험했다",
]

@test("단기 기억: 목표 + 최근 관찰 max_obs개, 원본은 그대로")
def _():
    before = list(hist)
    assert trim_history(hist, 2) == ["목표: 과제 리포트 정리", "관찰 4", "관찰 5"], trim_history(hist, 2)
    assert trim_history(hist, 10) == hist, "관찰이 max_obs보다 적으면 모두 남깁니다."
    assert hist == before, "원래 hist를 바꾸면 안 됩니다."

@test("max_obs = 0이면 목표만 남는다(-0 슬라이싱 함정)")
def _():
    assert trim_history(hist, 0) == ["목표: 과제 리포트 정리"], f"결과: {trim_history(hist, 0)}  ← hist[1:][-0:]는 리스트 전체입니다."

@test("장기 기억: 겹치는 단어 수 순, 같으면 최근 기억 먼저, 안 겹치면 제외")
def _():
    q = "과제에서 청크 크기 몇으로 했지?"
    assert recall(memories, q, k=2) == [memories[3], memories[1]], recall(memories, q, k=2)
    assert recall(memories, "답을 표로 줘") == [memories[0]], recall(memories, "답을 표로 줘")
    assert recall(memories, "오늘 날씨 어때?", k=3) == [], "하나도 겹치지 않는 기억은 꺼내지 않습니다."

@test("컨텍스트: 목표 → [기억] → 최근 관찰 → 질문")
def _():
    out = build_context(hist, memories[:3], "과제에서 청크 크기 몇으로 했지?")
    want = "\n".join(["목표: 과제 리포트 정리", "[기억] 사용자는 RAG 과제에서 청크 크기 500을 골랐다",
                      "관찰 4", "관찰 5", "질문: 과제에서 청크 크기 몇으로 했지?"])
    assert out == want, out
    assert build_context(hist, memories, "날씨는?", max_obs=1) == "목표: 과제 리포트 정리\n관찰 5\n질문: 날씨는?"
`,
    hints: ["`hist[1:][-max_obs:]`는 `max_obs = 0`일 때 `-0`이 `0`과 같아 리스트 전체가 됩니다. `hist[:1] + (hist[1:][-max_obs:] if max_obs > 0 else [])`처럼 0을 따로 처리합니다.", "`q = set(query.split())`로 질문 단어 집합을 만들고, 기억마다 `(len(q & set(m.split())), i)`를 모읍니다. 점수 0은 버리고 `sorted(..., key=lambda x: (-x[0], -x[1]))`로 정렬하면 점수가 큰 순, 같으면 번호가 큰(최근) 순입니다.", "`lines = trim_history(hist, max_obs)` 다음 `lines[1:1] = [f\"[기억] {m}\" for m in recall(memories, query, k)]`로 목표 바로 뒤에 기억을 끼워 넣고, 마지막에 `f\"질문: {query}\"`를 붙여 `\"\\n\".join`합니다."],
    solution: py`
def trim_history(hist, max_obs):
    return hist[:1] + (hist[1:][-max_obs:] if max_obs > 0 else [])

def recall(memories, query, k=1):
    q = set(query.split())
    scored = [(len(q & set(m.split())), i) for i, m in enumerate(memories)]
    scored = sorted([(s, i) for s, i in scored if s > 0], key=lambda x: (-x[0], -x[1]))
    return [memories[i] for _, i in scored[:k]]

def build_context(hist, memories, query, k=1, max_obs=2):
    lines = trim_history(hist, max_obs)
    lines[1:1] = [f"[기억] {m}" for m in recall(memories, query, k)]
    return "\n".join(lines + [f"질문: {query}"])

memories = [
    "사용자는 답을 표로 정리해 주는 것을 좋아한다",
    "사용자는 RAG 과제에서 청크 크기 500을 골랐다",
    "사용자의 발표 순서는 세 번째다",
]
hist = ["목표: 과제 리포트 정리", "관찰 1", "관찰 2", "관찰 3", "관찰 4", "관찰 5"]
print(trim_history(hist, 2))
print(recall(memories, "과제에서 청크 크기 몇으로 했지?"))
print(build_context(hist, memories, "과제에서 청크 크기 몇으로 했지?"))
`,
  },
]);
