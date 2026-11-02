import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
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
