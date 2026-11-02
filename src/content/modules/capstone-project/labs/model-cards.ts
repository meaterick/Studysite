import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "모델카드 점검기와 위험 등급 분류(엄격한 등급 우선)",
    prompt: md`

「거버넌스」 단계를 바탕으로 모델카드 점검기와 EU AI Act식 위험 등급 연습을 직접 만듭니다(법적 판단이 아닌 개념 연습입니다).

1. \`check_model_card(card)\`: 문제 목록(문자열 리스트)을 돌려줍니다. \`REQUIRED\`의 항목이 없거나 비어 있으면 그 항목 이름을 담은 문제, \`performance_by_group\`의 집단이 2개 미만이면 "집단" 문제, 집단마다 보고한 지표 이름이 서로 다르면 "지표" 문제를 추가합니다.
2. \`fixed\`: \`draft\`를 고쳐 점검기를 통과하는 모델카드를 만듭니다.
3. \`tier_of(use_case)\`: \`(등급, 근거 키워드)\`. 여러 등급의 키워드가 함께 들어 있으면 **더 엄격한** 등급을 고르고(금지 > 고위험 > 제한적 위험), 어디에도 해당하지 않으면 \`("최소 위험", None)\`입니다.
`,
    starter: py`
REQUIRED = ["model_name", "intended_use", "out_of_scope_use", "training_data",
            "performance_by_group", "limitations", "ethical_considerations"]
draft = {
    "model_name": "동아리 QA 봇 v0.3",
    "intended_use": "동아리 규정·일정에 대한 질문에 근거와 함께 답한다",
    "out_of_scope_use": [],                       # 비어 있음!
    "training_data": {"source": "동아리 공지 42건(2024~2025)", "pii_removed": True},
    "performance_by_group": {"전체": {"accuracy": 0.86}},
    "limitations": ["공지에 없는 질문에 추측으로 답할 수 있음"],
}
TIERS = {
    "금지": ["사회적 점수", "취약성 악용 조작"],
    "고위험": ["채용", "신용평가", "입학·시험 평가", "의료기기"],
    "제한적 위험(투명성 의무)": ["챗봇", "딥페이크"],
}

def check_model_card(card):
    problems = []
    # TODO: 필수 항목 누락·비어 있음 / 집단 2개 미만 / 집단마다 지표 이름이 다름
    return problems

fixed = dict(draft)  # TODO: 점검기를 통과하도록 고칩니다.

def tier_of(use_case):
    return "최소 위험", None  # TODO: 엄격한 등급부터 키워드를 찾습니다.

print(check_model_card(draft))
print(check_model_card(fixed))
for uc in ["이력서 자동 채용 선별", "고객 상담 챗봇", "채용 면접 챗봇", "스팸 메일 필터"]:
    print(uc, "→", tier_of(uc))
`,
    tests: py`
REQUIRED = ["model_name", "intended_use", "out_of_scope_use", "training_data",
            "performance_by_group", "limitations", "ethical_considerations"]
draft = {
    "model_name": "동아리 QA 봇 v0.3",
    "intended_use": "동아리 규정·일정에 대한 질문에 근거와 함께 답한다",
    "out_of_scope_use": [],                       # 비어 있음!
    "training_data": {"source": "동아리 공지 42건(2024~2025)", "pii_removed": True},
    "performance_by_group": {"전체": {"accuracy": 0.86}},
    "limitations": ["공지에 없는 질문에 추측으로 답할 수 있음"],
}
TIERS = {
    "금지": ["사회적 점수", "취약성 악용 조작"],
    "고위험": ["채용", "신용평가", "입학·시험 평가", "의료기기"],
    "제한적 위험(투명성 의무)": ["챗봇", "딥페이크"],
}

@test("초안의 세 가지 문제를 찾는다")
def _():
    probs = check_model_card(draft)
    text = " ".join(probs)
    assert len(probs) == 3, probs
    assert "out_of_scope_use" in text and "ethical_considerations" in text and "performance_by_group" in text, probs

@test("집단마다 지표 이름이 다르면 '지표' 문제")
def _():
    card = dict(draft, out_of_scope_use=["의료 상담"], ethical_considerations=["개인정보 입력 금지 안내"],
                performance_by_group={"신입": {"accuracy": 0.8}, "기존": {"f1": 0.9}})
    probs = check_model_card(card)
    assert len(probs) == 1 and "지표" in probs[0], probs

@test("고친 모델카드는 점검기를 통과한다")
def _():
    assert check_model_card(fixed) == [], check_model_card(fixed)
    assert fixed["model_name"] == draft["model_name"], "모델 이름은 그대로 둡니다."

@test("위험 등급: 엄격한 등급 우선, 근거 키워드 함께")
def _():
    assert tier_of("이력서 자동 채용 선별") == ("고위험", "채용")
    assert tier_of("고객 상담 챗봇") == ("제한적 위험(투명성 의무)", "챗봇")
    assert tier_of("채용 면접 챗봇") == ("고위험", "채용"), tier_of("채용 면접 챗봇")
    assert tier_of("시민 행동 기반 사회적 점수 챗봇")[0] == "금지"
    assert tier_of("스팸 메일 필터") == ("최소 위험", None)
`,
    hints: ["`problems = [f\"{k}: 없음 또는 비어 있음\" for k in REQUIRED if not card.get(k)]`. 빈 리스트·빈 문자열·None은 모두 거짓입니다.", "`groups = card.get(\"performance_by_group\") or {}`; 집단이 2개 미만이면 문제를 추가하고, `len({tuple(sorted(m)) for m in groups.values()}) > 1`이면 지표 이름이 다른 것입니다.", "`for tier, keys in TIERS.items():`는 딕셔너리에 넣은 순서(금지 → 고위험 → 제한적)대로 돌므로, 처음 걸린 키워드에서 바로 `return tier, k`하면 엄격한 등급이 우선합니다."],
    solution: py`
REQUIRED = ["model_name", "intended_use", "out_of_scope_use", "training_data",
            "performance_by_group", "limitations", "ethical_considerations"]
draft = {
    "model_name": "동아리 QA 봇 v0.3",
    "intended_use": "동아리 규정·일정에 대한 질문에 근거와 함께 답한다",
    "out_of_scope_use": [],                       # 비어 있음!
    "training_data": {"source": "동아리 공지 42건(2024~2025)", "pii_removed": True},
    "performance_by_group": {"전체": {"accuracy": 0.86}},
    "limitations": ["공지에 없는 질문에 추측으로 답할 수 있음"],
}
TIERS = {
    "금지": ["사회적 점수", "취약성 악용 조작"],
    "고위험": ["채용", "신용평가", "입학·시험 평가", "의료기기"],
    "제한적 위험(투명성 의무)": ["챗봇", "딥페이크"],
}

def check_model_card(card):
    problems = [f"{k}: 없음 또는 비어 있음" for k in REQUIRED if not card.get(k)]
    groups = card.get("performance_by_group") or {}
    if len(groups) < 2:
        problems.append("performance_by_group: 집단이 2개 이상이어야 격차를 볼 수 있음")
    elif len({tuple(sorted(m)) for m in groups.values()}) > 1:
        problems.append("performance_by_group: 집단마다 보고한 지표 이름이 다름")
    return problems

fixed = dict(
    draft,
    out_of_scope_use=["개인 상담·의료·법률 조언", "회원 평가나 징계 결정"],
    performance_by_group={"신입 회원 질문": {"accuracy": 0.81}, "기존 회원 질문": {"accuracy": 0.88}},
    ethical_considerations=["개인정보를 입력하지 않도록 안내", "공지에 없는 답은 '자료에 없음'으로 거절"],
)

def tier_of(use_case):
    for tier, keys in TIERS.items():
        for k in keys:
            if k in use_case:
                return tier, k
    return "최소 위험", None

print(check_model_card(draft))
print(check_model_card(fixed))
for uc in ["이력서 자동 채용 선별", "고객 상담 챗봇", "채용 면접 챗봇", "스팸 메일 필터"]:
    print(uc, "→", tier_of(uc))
`,
  },
]);
