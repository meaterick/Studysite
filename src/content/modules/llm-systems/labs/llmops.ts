import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "RAG 토큰 비용, 토큰 버킷 속도 제한, 개인정보 가드레일",
    prompt: md`
본문의 세 가지 운영 장치를 구현합니다.

1. \`rag_daily_cost(k, calls=10000, system=400, question=50, chunk=500, answer=300)\`: 입력 토큰 = 시스템 프롬프트 + 질문 + 조각 $k$개, 출력 토큰 = 답변일 때 하루 비용(달러). 1회 비용은 $n_{\text{in}} p_{\text{in}} + n_{\text{out}} p_{\text{out}}$입니다.
2. \`TokenBucket(rate, capacity)\`: 허용량이 1초에 \`rate\`개씩 \`capacity\`까지 채워지고, \`allow(now)\`는 허용량이 1 이상이면 1을 쓰고 \`True\`, 아니면 \`False\`. 처음에는 가득 차 있고 시각 0에서 시작합니다.
3. \`output_guardrail(text)\`: 응답 속 휴대전화 번호, 이메일, **주민등록번호**(\`######-#######\`)를 각각 \`[전화번호]\`, \`[이메일]\`, \`[주민등록번호]\`로 가리고 \`(가린 텍스트, 가린 건수)\`를 돌려줍니다.
`,
    starter: py`
import re
PRICE_IN, PRICE_OUT = 3.0 / 1e6, 15.0 / 1e6      # 달러/토큰(예시 값): 출력이 입력보다 비싸다

def rag_daily_cost(k, calls=10000, system=400, question=50, chunk=500, answer=300):
    return 0.0  # TODO

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity, self.tokens, self.last = rate, capacity, capacity, 0.0
    def allow(self, now):
        return True  # TODO: 지난 시각 이후 채워진 만큼 더하고(최대 capacity), 1 이상이면 1을 씁니다.

PII = [
    (re.compile(r"01[016789]-?\d{3,4}-?\d{4}"), "[전화번호]"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[이메일]"),
    # TODO: 주민등록번호 규칙을 추가합니다.
]
def output_guardrail(text):
    hits = 0
    # TODO: 규칙마다 pattern.subn(label, text)로 가리고 건수를 셉니다.
    return text, hits

print([round(rag_daily_cost(k), 2) for k in (0, 3, 10)])
bucket = TokenBucket(rate=2, capacity=5)
print("".join("O" if bucket.allow(t) else "X" for t in [0.0] * 8 + [1.0, 1.1, 1.2, 3.0]))
print(output_guardrail("연락처 010-1234-5678, 메일 lead@club.example.com, 주민번호 900101-1234567"))
`,
    tests: py`
import re
PRICE_IN, PRICE_OUT = 3.0 / 1e6, 15.0 / 1e6      # 달러/토큰(예시 값): 출력이 입력보다 비싸다

@test("하루 1만 회 비용: 조각 0개 58.5달러, 3개 103.5달러, 10개 208.5달러")
def _():
    vals = [rag_daily_cost(k) for k in (0, 3, 10)]
    assert approx(vals, [58.5, 103.5, 208.5], 1e-6), vals
    assert approx(rag_daily_cost(3, calls=1, answer=0), 1950 * 3e-6), "입력 토큰은 400 + 50 + 3 × 500 = 1,950개입니다."

@test("토큰 버킷: 0초에 몰린 8건 중 5건만, 이후 채워진 만큼 허용")
def _():
    bucket = TokenBucket(rate=2, capacity=5)
    got = "".join("O" if bucket.allow(t) else "X" for t in [0.0] * 8 + [1.0, 1.1, 1.2, 3.0])
    assert got == "OOOOOXXXOOXO", got

@test("허용량은 capacity를 넘지 않는다")
def _():
    bucket = TokenBucket(rate=10, capacity=3)
    got = "".join("O" if bucket.allow(t) else "X" for t in [100.0] * 5)
    assert got == "OOOXX", got

@test("가드레일: 전화번호·이메일·주민등록번호 3건을 가린다")
def _():
    safe, n = output_guardrail("회장 010-1234-5678, 메일 lead@club.example.com, 주민번호 900101-1234567 입니다.")
    assert n == 3 and "[주민등록번호]" in safe and "[전화번호]" in safe and "[이메일]" in safe, (safe, n)
    assert "1234567" not in safe and "5678" not in safe, safe
    assert output_guardrail("세션은 토요일 오후 2시") == ("세션은 토요일 오후 2시", 0)
`,
    hints: ["`n_in = system + question + k * chunk`, `return calls * (n_in * PRICE_IN + answer * PRICE_OUT)`", "`self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)`, `self.last = now` 다음, `self.tokens >= 1`이면 1을 빼고 `True`", "주민등록번호는 `re.compile(r\"\\d{6}-[1-4]\\d{6}\")`처럼 쓸 수 있습니다. 규칙을 차례로 `text, n = pattern.subn(label, text)`로 적용하고 `hits += n`. 정규식은 '공일공…'처럼 바꿔 쓴 개인정보는 못 잡으므로 분류 모델 등 다른 겹이 필요합니다."],
    solution: py`
import re
PRICE_IN, PRICE_OUT = 3.0 / 1e6, 15.0 / 1e6      # 달러/토큰(예시 값): 출력이 입력보다 비싸다

def rag_daily_cost(k, calls=10000, system=400, question=50, chunk=500, answer=300):
    n_in = system + question + k * chunk
    return calls * (n_in * PRICE_IN + answer * PRICE_OUT)

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity, self.tokens, self.last = rate, capacity, capacity, 0.0
    def allow(self, now):
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

PII = [
    (re.compile(r"\d{6}-[1-4]\d{6}"), "[주민등록번호]"),
    (re.compile(r"01[016789]-?\d{3,4}-?\d{4}"), "[전화번호]"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[이메일]"),
]
def output_guardrail(text):
    hits = 0
    for pattern, label in PII:
        text, n = pattern.subn(label, text)
        hits += n
    return text, hits

print([round(rag_daily_cost(k), 2) for k in (0, 3, 10)])
bucket = TokenBucket(rate=2, capacity=5)
print("".join("O" if bucket.allow(t) else "X" for t in [0.0] * 8 + [1.0, 1.1, 1.2, 3.0]))
print(output_guardrail("연락처 010-1234-5678, 메일 lead@club.example.com, 주민번호 900101-1234567"))
`,
  },
]);
