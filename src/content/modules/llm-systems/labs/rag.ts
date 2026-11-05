import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "청킹, 검색, 근거 인용 프롬프트 조립",
    prompt: md`
:::info 가상 예제 데이터
이 레슨의 동아리 공지·마감·점수·출석 규칙은 검색과 도구 호출을 설명하기 위한 가상 데이터이며, 이 사이트의 운영 규칙이 아니다. 실제 학습은 자기 점검과 추천 일정에 따른다.
:::

본문의 청킹, 검색, 프롬프트 조립을 구현합니다. 색인(\`vectorizer\`, \`X\`)은 시작 코드에서 만듭니다.

1. \`chunk(text, size, overlap)\`: \`size\`글자씩 자르되 다음 조각은 \`size - overlap\`글자 뒤에서 시작합니다(슬라이딩 윈도우). 시작 위치는 \`len(text) - overlap\`보다 작아야 하고, 텍스트가 짧아도 조각 하나는 만듭니다.
2. \`retrieve(q, k=2)\`: 질문을 같은 TF-IDF 공간으로 바꿔(\`vectorizer.transform\`) 코사인 유사도 상위 \`k\`개를 \`[(조각, 유사도), ...]\`로, 유사도 내림차순으로 돌려줍니다.
3. \`build_prompt(q, k=2, threshold=0.25)\`: 최고 유사도가 \`threshold\`보다 낮으면 LLM을 부르지 않도록 \`(None, hits)\`. 아니면 지시문 → \`<자료>\` … \`</자료>\`(조각마다 \`[1] …\`처럼 번호) → \`질문: …\` 순서의 프롬프트와 \`hits\`를 돌려줍니다. 지시문에는 "자료에 없음" 허용과 근거 번호 인용을 넣습니다.
`,
    starter: py`
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def chunk(text, size=200, overlap=40):
    return [text]  # TODO: range(start, stop, step)와 슬라이싱으로 겹치는 조각을 만듭니다.

docs = [
    "Aegis 동아리는 매주 토요일 오후 2시에 정기 세션을 진행한다.",
    "스터디 과제는 일요일 23시 59분까지 Colab 링크로 제출한다.",
    "백지공부 시트는 금요일까지 제출하며 자기 채점 항목이 포함된다.",
    "수료 기준은 70점 이상이며 캡스톤 제출이 필수이다.",
    "세션에 세 번 이상 무단 결석하면 수료 대상에서 제외된다.",
]
chunks = [c for d in docs for c in chunk(d)]   # 모두 200자보다 짧아 문서 하나가 조각 하나다
vectorizer = TfidfVectorizer(analyzer="char", ngram_range=(2, 3))
X = vectorizer.fit_transform(chunks)

def retrieve(q, k=2):
    return []  # TODO: 코사인 유사도 상위 k개 (조각, 유사도)

def build_prompt(q, k=2, threshold=0.25):
    hits = retrieve(q, k)
    # TODO: 최고 유사도가 threshold보다 낮으면 (None, hits)를 돌려줍니다.
    ctx = ""  # TODO: "[1] 조각" 형식으로 번호를 붙여 줄바꿈으로 잇습니다.
    prompt = f"""아래 자료만 근거로 답하라.
질문: {q}"""  # TODO: <자료> 구분자와 '자료에 없음'·근거 번호 인용 지시를 넣습니다.
    return prompt, hits

print(chunk("abcdefghij", 4, 1))
for q in ["과제는 언제까지 내야 해?", "동아리방 와이파이 비밀번호는?"]:
    prompt, hits = build_prompt(q)
    print("=" * 40)
    print(prompt if prompt else f"→ '{q}': 관련 자료가 없어 '자료에 없음'으로 바로 답한다")
`,
    tests: py`
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

docs = [
    "Aegis 동아리는 매주 토요일 오후 2시에 정기 세션을 진행한다.",
    "스터디 과제는 일요일 23시 59분까지 Colab 링크로 제출한다.",
    "백지공부 시트는 금요일까지 제출하며 자기 채점 항목이 포함된다.",
    "수료 기준은 70점 이상이며 캡스톤 제출이 필수이다.",
    "세션에 세 번 이상 무단 결석하면 수료 대상에서 제외된다.",
]
chunks = docs                                   # 모두 200자보다 짧아 문서 하나가 조각 하나
vectorizer = TfidfVectorizer(analyzer="char", ngram_range=(2, 3))
X = vectorizer.fit_transform(chunks)

@test("chunk('abcdefghij', 4, 1) = ['abcd', 'defg', 'ghij'], 짧은 글도 조각 하나")
def _():
    assert chunk("abcdefghij", 4, 1) == ["abcd", "defg", "ghij"], chunk("abcdefghij", 4, 1)
    assert chunk("짧은 글", 200, 40) == ["짧은 글"]

@test("이웃 조각은 정확히 overlap글자 겹치고, 겹침을 빼고 이으면 원문이 복원된다")
def _():
    text = "동아리 활동 규정은 매주 갱신되며 신입 회원은 첫 세션 전에 반드시 읽어야 한다. 규정을 어기면 경고가 누적된다."
    cs = chunk(text, 30, 10)
    assert len(cs) >= 3, f"조각 수 {len(cs)}"
    assert all(a[-10:] == b[:10] for a, b in zip(cs, cs[1:]) if len(a) == 30), "겹침이 10글자가 아닙니다."
    assert cs[0] + "".join(c[10:] for c in cs[1:]) == text, "원문이 복원되지 않습니다."

@test("과제 질문의 1위 조각은 과제 문서(유사도 ≈ 0.315)")
def _():
    hits = retrieve("과제는 언제까지 내야 해?", 3)
    assert len(hits) == 3 and hits[0][0].startswith("스터디 과제"), hits
    assert [s for _, s in hits] == sorted([s for _, s in hits], reverse=True), "유사도 내림차순이 아닙니다."
    assert approx(hits[0][1], 0.315, 1e-2), f"최고 유사도 {hits[0][1]:.3f}"

@test("자료에 없는 질문은 프롬프트를 만들지 않는다(최고 유사도 ≈ 0.19 < 0.25)")
def _():
    prompt, hits = build_prompt("동아리방 와이파이 비밀번호는?")
    assert prompt is None and hits and hits[0][1] < 0.25, f"prompt={prompt!r}"

@test("프롬프트: 지시문의 '자료에 없음' → <자료> 속 번호 붙은 근거 → 질문")
def _():
    prompt, hits = build_prompt("결석하면 어떻게 돼?")
    assert prompt is not None and "<자료>" in prompt and "</자료>" in prompt, prompt
    head, rest = prompt.split("<자료>", 1)
    body, tail = rest.split("</자료>", 1)
    assert "자료에 없음" in head, "지시문에 '자료에 없음' 허용이 없습니다."
    assert "[1] 세션에 세 번" in body, f"<자료> 안에 [1] 결석 조각이 없습니다:\n{body}"
    assert tail.strip() == "질문: 결석하면 어떻게 돼?", tail

@test("문턱값을 0.15로 낮추면 관련 없는 자료가 붙는다")
def _():
    prompt, _ = build_prompt("동아리방 와이파이 비밀번호는?", threshold=0.15)
    assert prompt is not None and "[1] Aegis" in prompt, prompt
`,
    hints: ["시작 위치는 `range(0, max(1, len(text) - overlap), size - overlap)`이고 조각은 `text[i:i + size]`입니다. `max(1, …)`가 짧은 글에서도 시작 위치 0 하나를 보장합니다.", "`sims = cosine_similarity(vectorizer.transform([q]), X)[0]`, `idx = np.argsort(-sims)[:k]`, `[(chunks[i], float(sims[i])) for i in idx]`", "`if hits[0][1] < threshold: return None, hits`. 번호는 `\"\\n\".join(f\"[{i+1}] {c}\" for i, (c, _) in enumerate(hits))`", "프롬프트 예: `아래 자료만 근거로 답하라. 자료에 없으면 '자료에 없음'이라고 답하고, 근거 번호를 [1]처럼 인용하라.` 다음 줄에 `<자료>`, ctx, `</자료>`, `질문: {q}`"],
    solution: py`
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def chunk(text, size=200, overlap=40):
    return [text[i:i + size] for i in range(0, max(1, len(text) - overlap), size - overlap)]

docs = [
    "Aegis 동아리는 매주 토요일 오후 2시에 정기 세션을 진행한다.",
    "스터디 과제는 일요일 23시 59분까지 Colab 링크로 제출한다.",
    "백지공부 시트는 금요일까지 제출하며 자기 채점 항목이 포함된다.",
    "수료 기준은 70점 이상이며 캡스톤 제출이 필수이다.",
    "세션에 세 번 이상 무단 결석하면 수료 대상에서 제외된다.",
]
chunks = [c for d in docs for c in chunk(d)]   # 모두 200자보다 짧아 문서 하나가 조각 하나다
vectorizer = TfidfVectorizer(analyzer="char", ngram_range=(2, 3))
X = vectorizer.fit_transform(chunks)

def retrieve(q, k=2):
    sims = cosine_similarity(vectorizer.transform([q]), X)[0]
    idx = np.argsort(-sims)[:k]
    return [(chunks[i], float(sims[i])) for i in idx]

def build_prompt(q, k=2, threshold=0.25):
    hits = retrieve(q, k)
    if hits[0][1] < threshold:
        return None, hits
    ctx = "\n".join(f"[{i+1}] {c}" for i, (c, _) in enumerate(hits))
    prompt = f"""아래 자료만 근거로 답하라. 자료에 없으면 '자료에 없음'이라고 답하고, 근거 번호를 [1]처럼 인용하라.
<자료>
{ctx}
</자료>
질문: {q}"""
    return prompt, hits

print(chunk("abcdefghij", 4, 1))
for q in ["과제는 언제까지 내야 해?", "동아리방 와이파이 비밀번호는?"]:
    prompt, hits = build_prompt(q)
    print("=" * 40)
    print(prompt if prompt else f"→ '{q}': 관련 자료가 없어 '자료에 없음'으로 바로 답한다")
`,
  },
]);
