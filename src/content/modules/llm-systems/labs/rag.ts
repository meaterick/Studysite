import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "단어 세기 벡터와 슬라이딩 윈도우 청킹",
    prompt: md`

「RAG 파이프라인」의 몸풀기(단어 세기 + 코사인 유사도)와 청킹을 직접 씁니다.

1. \`to_vector(words, vocab)\`: 어휘 사전의 각 단어가 \`words\`에 몇 번 나오는지 센 정수 배열.
2. \`cos_sim(a, b)\`: 코사인 유사도. 영벡터가 하나라도 있으면 0.0을 돌려줍니다.
3. \`chunk(text, size, overlap)\`: \`size\`글자씩 자르되 다음 조각은 \`size - overlap\`글자 뒤에서 시작합니다(슬라이딩 윈도우). 시작 위치는 \`len(text) - overlap\`보다 작아야 하고, 텍스트가 아무리 짧아도 조각 하나는 만듭니다.
`,
    starter: py`
import numpy as np

def to_vector(words, vocab):
    return np.zeros(len(vocab), dtype=int)  # TODO

def cos_sim(a, b):
    return 0.0  # TODO: 영벡터면 0.0

def chunk(text, size=200, overlap=40):
    return [text]  # TODO: range(start, stop, step)와 슬라이싱으로 겹치는 조각을 만듭니다.

vocab = ["세션", "과제", "제출", "시트", "점수"]
q, d2 = to_vector(["과제", "제출"], vocab), to_vector(["과제", "제출", "점수"], vocab)
print(q, d2, round(cos_sim(q, d2), 3))
for i, c in enumerate(chunk("동아리 활동 규정은 매주 갱신되며 신입 회원은 첫 세션 전에 반드시 읽어야 한다.", 30, 10)):
    print(f"조각 {i}: {c}")
`,
    tests: py`
import numpy as np
vocab = ["세션", "과제", "제출", "시트", "점수"]

@test("단어 세기 벡터와 코사인 유사도(≈ 0.816)")
def _():
    q, d1, d2 = to_vector(["과제", "제출"], vocab), to_vector(["세션", "세션"], vocab), to_vector(["과제", "제출", "점수"], vocab)
    assert list(d1) == [2, 0, 0, 0, 0], f"d1 = {d1}"
    assert approx(cos_sim(q, d1), 0.0) and approx(cos_sim(q, d2), 2 / np.sqrt(6)), f"{cos_sim(q, d2):.4f}"
    assert cos_sim(q, to_vector(["없는말"], vocab)) == 0.0, "영벡터와의 유사도는 0.0이어야 합니다."

@test("chunk('abcdefghij', 4, 1) = ['abcd', 'defg', 'ghij']")
def _():
    assert chunk("abcdefghij", 4, 1) == ["abcd", "defg", "ghij"], chunk("abcdefghij", 4, 1)

@test("이웃 조각은 정확히 overlap글자 겹치고, 겹침을 빼고 이으면 원문이 복원된다")
def _():
    text = "동아리 활동 규정은 매주 갱신되며 신입 회원은 첫 세션 전에 반드시 읽어야 한다. 규정을 어기면 경고가 누적된다."
    cs = chunk(text, 30, 10)
    assert len(cs) >= 3, f"조각 수 {len(cs)}"
    assert all(a[-10:] == b[:10] for a, b in zip(cs, cs[1:]) if len(a) == 30), "겹침이 10글자가 아닙니다."
    assert cs[0] + "".join(c[10:] for c in cs[1:]) == text, "원문이 복원되지 않습니다."

@test("짧은 글도 조각 하나")
def _():
    assert chunk("짧은 글", 200, 40) == ["짧은 글"]
`,
    hints: ["`np.array([words.count(w) for w in vocab])`. 코사인은 `a @ b / (np.linalg.norm(a) * np.linalg.norm(b))`이고, 분모가 0이면 먼저 0.0을 돌려줍니다.", "시작 위치는 `range(0, max(1, len(text) - overlap), size - overlap)`입니다. `max(1, …)`가 짧은 글에서도 시작 위치 0 하나를 보장합니다.", "`[text[i:i + size] for i in range(...)]`. 겹치게 자르면 조각 경계가 문장 한가운데를 갈라도 적어도 한쪽 조각에는 그 정보가 통째로 남습니다."],
    solution: py`
import numpy as np

def to_vector(words, vocab):
    return np.array([words.count(w) for w in vocab])

def cos_sim(a, b):
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(a @ b / (na * nb))

def chunk(text, size=200, overlap=40):
    return [text[i:i + size] for i in range(0, max(1, len(text) - overlap), size - overlap)]

vocab = ["세션", "과제", "제출", "시트", "점수"]
q, d2 = to_vector(["과제", "제출"], vocab), to_vector(["과제", "제출", "점수"], vocab)
print(q, d2, round(cos_sim(q, d2), 3))
for i, c in enumerate(chunk("동아리 활동 규정은 매주 갱신되며 신입 회원은 첫 세션 전에 반드시 읽어야 한다.", 30, 10)):
    print(f"조각 {i}: {c}")
`,
  },
  {
    key: "ex2",
    title: "검색 결과로 근거 인용 프롬프트를 조립하고 '자료에 없음' 거절하기",
    prompt: md`

「RAG 파이프라인」 단계의 검색과 프롬프트 조립을 직접 구현합니다. 색인(\`vectorizer\`, \`X\`)은 이미 만들어져 있습니다.

1. \`retrieve(q, k=2)\`: 질문을 같은 TF-IDF 공간으로 바꿔(\`vectorizer.transform\`) 코사인 유사도 상위 \`k\`개를 \`[(조각, 유사도), ...]\`로, 유사도 내림차순으로 돌려줍니다.
2. \`build_prompt(q, k=2, threshold=0.25)\`: 최고 유사도가 \`threshold\`보다 낮으면 LLM을 부르지 않도록 \`(None, hits)\`. 아니면 지시문 → \`<자료>\` … \`</자료>\`(조각마다 \`[1] …\`처럼 번호) → \`질문: …\` 순서의 프롬프트와 \`hits\`를 돌려줍니다. 지시문에는 "자료에 없음" 허용과 근거 번호 인용을 넣습니다.
`,
    starter: py`
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

def retrieve(q, k=2):
    return []  # TODO: 코사인 유사도 상위 k개 (조각, 유사도)

def build_prompt(q, k=2, threshold=0.25):
    hits = retrieve(q, k)
    # TODO: 최고 유사도가 threshold보다 낮으면 (None, hits)를 돌려줍니다.
    ctx = ""  # TODO: "[1] 조각" 형식으로 번호를 붙여 줄바꿈으로 잇습니다.
    prompt = f"""아래 자료만 근거로 답하라.
질문: {q}"""  # TODO: <자료> 구분자와 '자료에 없음'·근거 번호 인용 지시를 넣습니다.
    return prompt, hits

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
    hints: ["`sims = cosine_similarity(vectorizer.transform([q]), X)[0]`, `idx = np.argsort(-sims)[:k]`, `[(chunks[i], float(sims[i])) for i in idx]`", "`if hits[0][1] < threshold: return None, hits`. 번호는 `\"\\n\".join(f\"[{i+1}] {c}\" for i, (c, _) in enumerate(hits))`", "프롬프트 예: `아래 자료만 근거로 답하라. 자료에 없으면 '자료에 없음'이라고 답하고, 근거 번호를 [1]처럼 인용하라.` 다음 줄에 `<자료>`, ctx, `</자료>`, `질문: {q}`"],
    solution: py`
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

for q in ["과제는 언제까지 내야 해?", "동아리방 와이파이 비밀번호는?"]:
    prompt, hits = build_prompt(q)
    print("=" * 40)
    print(prompt if prompt else f"→ '{q}': 관련 자료가 없어 '자료에 없음'으로 바로 답한다")
`,
  },
]);
