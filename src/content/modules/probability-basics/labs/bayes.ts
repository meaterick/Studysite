import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex0",
    title: "베이즈 정리를 단계별로 계산하기",
    prompt: md`

본문의 다섯 단계 표를 함수로 옮깁니다. \`bayes_steps(prior, sensitivity, false_pos)\`는 다음 세 값을 튜플로 돌려줍니다.

1. \`joint\`: 환자이면서 양성일 확률 $P(B \mid A)\,P(A)$
2. \`evidence\`: 양성 전체의 확률 $P(B) = P(B \mid A)\,P(A) + P(B \mid A^c)\,P(A^c)$
3. \`post\`: 사후확률 $P(A \mid B) = \frac{\text{joint}}{\text{evidence}}$

본문의 예 \`bayes_steps(0.01, 0.99, 0.05)\`는 \`(0.0099, 0.0594, 약 0.1667)\`입니다.
`,
    starter: py`
def bayes_steps(prior, sensitivity, false_pos):
    joint = 0.0      # TODO: 환자이면서 양성
    evidence = 0.0   # TODO: 양성 전체
    post = 0.0       # TODO: 사후확률
    return joint, evidence, post

print(bayes_steps(0.01, 0.99, 0.05))
`,
    tests: py`
@test("본문의 예: 0.0099, 0.0594, 0.1667")
def _():
    got = bayes_steps(0.01, 0.99, 0.05)
    assert approx(list(got), [0.0099, 0.0594, 0.0099 / 0.0594], tol=1e-9), f"결과: {got}"

@test("기저율 10%: 사후확률 0.6875")
def _():
    assert approx(bayes_steps(0.10, 0.99, 0.05)[2], 0.6875, tol=1e-9), f"결과: {bayes_steps(0.10, 0.99, 0.05)}"

@test("사후확률을 다음 사전확률로: 두 번째 양성 뒤 약 0.80")
def _():
    p1 = bayes_steps(0.01, 0.99, 0.05)[2]
    p2 = bayes_steps(p1, 0.99, 0.05)[2]
    assert approx(p2, 0.7984, tol=1e-3), f"결과: {p2}"
`,
    hints: [
      "`joint = sensitivity * prior`입니다. 건강한 사람의 비율은 `1 - prior`입니다.",
      "`evidence = joint + false_pos * (1 - prior)`, `post = joint / evidence`입니다.",
    ],
    solution: py`
def bayes_steps(prior, sensitivity, false_pos):
    joint = sensitivity * prior
    evidence = joint + false_pos * (1 - prior)
    post = joint / evidence
    return joint, evidence, post

print(bayes_steps(0.01, 0.99, 0.05))
`,
  },
  {
    key: "ex1",
    title: "베이즈 정리를 사람 수(자연 빈도)로 계산하기",
    prompt: md`

확률 공식 대신 "1만 명이 검사를 받는다면 몇 명이 어디에 들어가는가"로 베이즈 정리를 계산합니다(자연 빈도). 확률로 생각할 때보다 기저율의 효과가 훨씬 잘 보입니다.

1. \`frequency_table(N, prevalence, sensitivity, false_pos)\`: 실제 환자 수, 건강한 사람 수, 환자 중 양성(TP), 건강한 사람 중 양성(FP)을 셉니다.
2. \`posterior_from_table(table)\`: 양성 판정을 받은 사람 중 실제 환자의 비율 $P(\text{병} \mid \text{양성})$
`,
    starter: py`
def frequency_table(N, prevalence, sensitivity, false_pos):
    sick = N * prevalence          # 실제 환자 수
    healthy = 0  # TODO: 건강한 사람 수
    tp = 0       # TODO: 환자 중 양성으로 나오는 사람 수 (민감도)
    fp = 0       # TODO: 건강한 사람 중 양성으로 나오는 사람 수 (위양성률)
    return {"sick": sick, "healthy": healthy, "tp": tp, "fp": fp, "positive": tp + fp}

def posterior_from_table(table):
    # TODO: 양성 판정을 받은 사람 중 실제 환자의 비율
    return 0.0

for prev in (0.01, 0.10):
    t = frequency_table(10_000, prev, 0.99, 0.05)
    print(f"유병률 {prev:.0%}: 양성 {t['positive']:.0f}명 중 환자 {t['tp']:.0f}명 → P(병|양성) = {posterior_from_table(t):.1%}")
`,
    tests: py`
@test("1만 명, 유병률 1% → 환자 100명, TP 99명, FP 495명")
def _():
    t = frequency_table(10_000, 0.01, 0.99, 0.05)
    assert approx(t["sick"], 100) and approx(t["healthy"], 9900), f"표: {t}"
    assert approx(t["tp"], 99) and approx(t["fp"], 495), f"표: {t}"

@test("P(병|양성) = 99/594 ≈ 0.1667")
def _():
    got = posterior_from_table(frequency_table(10_000, 0.01, 0.99, 0.05))
    assert approx(got, 99 / 594), f"결과: {got}"

@test("유병률 10%면 0.6875")
def _():
    got = posterior_from_table(frequency_table(10_000, 0.10, 0.99, 0.05))
    assert approx(got, 0.6875), f"결과: {got}"

@test("사람 수 N이 바뀌어도 사후확률은 같다")
def _():
    a = posterior_from_table(frequency_table(1_000, 0.02, 0.9, 0.1))
    b = posterior_from_table(frequency_table(1_000_000, 0.02, 0.9, 0.1))
    assert approx(a, b) and approx(a, 0.018 / (0.018 + 0.098)), f"{a} vs {b}"
`,
    hints: ["건강한 사람 수는 `N - sick`입니다.", "TP는 `sick * sensitivity`, FP는 `healthy * false_pos`입니다.", "사후확률은 `table[\"tp\"] / table[\"positive\"]`입니다. 분모에 FP가 들어간다는 것이 기저율 효과의 핵심입니다."],
    solution: py`
def frequency_table(N, prevalence, sensitivity, false_pos):
    sick = N * prevalence
    healthy = N - sick
    tp = sick * sensitivity
    fp = healthy * false_pos
    return {"sick": sick, "healthy": healthy, "tp": tp, "fp": fp, "positive": tp + fp}

def posterior_from_table(table):
    return table["tp"] / table["positive"]

for prev in (0.01, 0.10):
    t = frequency_table(10_000, prev, 0.99, 0.05)
    print(f"유병률 {prev:.0%}: 양성 {t['positive']:.0f}명 중 환자 {t['tp']:.0f}명 → P(병|양성) = {posterior_from_table(t):.1%}")
`,
  },
]);
