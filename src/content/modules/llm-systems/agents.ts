import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/agents";

export default defineLesson({
  id: "agents",
  title: "도구 호출과 에이전트 루프",
  tier: "core",
  concepts: ["retrieval-rag-agents"],
  goal: "ReAct의 관찰→추론→행동 루프를 코드로 구현하고, 종료 판단 실패·도구 오선택·출력 형식 오류 같은 실패 유형과 max_steps·오류 관찰 되돌리기·Reflection의 역할을 설명할 수 있다.",
  why: "",
  body: md`
RAG가 한 번의 검색으로 얻은 컨텍스트를 프롬프트에 삽입해 단일 생성을 수행하는 구조라면, 에이전트는 이 검색·판단 과정을 여러 스텝에 걸쳐 반복하면서 모델 스스로 다음 행동을 결정하는 시스템이다. 이 반복 구조를 Yao et al. (2022)은 ReAct(Reasoning + Acting)라는 이름으로 정식화했다. 매 스텝마다 모델은 그때까지 누적된 관찰(Observation)을 바탕으로 추론(Reasoning) 과정을 텍스트로 생성하고, 그 추론 결과에 따라 계산기·검색 함수·코드 실행기처럼 미리 정의된 도구 중 무엇을 어떤 인자로 호출할지, 아니면 이미 충분한 정보를 모았으므로 최종 답을 출력하고 종료할지를 행동(Action)으로 결정한다. 그 행동이 반환한 새 관찰은 다음 스텝의 입력에 다시 누적되고, 이 관찰$\to$추론$\to$행동 사이클은 모델이 종료를 결정하거나 정해진 상한 스텝 수에 도달할 때까지 반복된다.

[[diagram:agent-loop]]

이 루프는 종료 시점을 스스로 잘 판단하지 못하는 경우가 많다. 도구를 잘못 고르거나, 도구가 돌려준 결과를 오독하거나, 답을 이미 찾았는데도 종료(final) 행동 대신 계속 다른 도구를 호출하는 것 모두가 에이전트 특유의 실패 유형이다. 그래서 실전 구현에서는 반드시 최대 스텝 수를 정해두고, 도구 호출 결과를 무조건 신뢰하지 않도록 설계해야 한다. 이 문제는 적용과 복습의 코딩 실습에서 직접 코드로 확인할 수 있다.

ReAct 루프의 관찰$\to$추론$\to$행동 사이클이 매 스텝 "다음에 무엇을 할까"만 판단한다면, **자기반성(Reflection)**은 한 걸음 더 나아가 에이전트가 자신이 방금 내놓은 행동이나 결과물을 별도로 되짚어보고 목표에 비추어 부족한 점을 스스로 지적한 뒤 이를 반영해 다시 시도하게 만드는 메커니즘이다. 즉 ReAct가 "다음 행동을 정하는 루프"라면, Reflection은 그 루프 위에 얹는 "방금 한 행동을 평가하는 루프"다.

### 에이전트 루프 스켈레톤 (개념 구현)

이제 검색 한 번으로 끝내지 않고, 방금 정식화한 ReAct 루프처럼 "관찰 $\to$ 추론 $\to$ 행동"을 여러 번 반복하며 스스로 도구를 골라 쓰는 아주 작은 에이전트를 구현해보자. 이 코드의 핵심은 **"도구 이름"이라는 문자열을 "그 도구를 실행하는 함수"에 연결해두고, 모델이 텍스트로 내놓은 이름만 보고 알맞은 함수를 찾아 호출하는 패턴**이다. 이 패턴부터 먼저 살펴보자.

:::info 파이썬 문법: 함수를 값으로 딕셔너리에 담아 이름으로 불러 쓰기
지금까지 딕셔너리의 값 자리에는 숫자나 문자열만 넣었지만, 파이썬에서는 함수도 다른 값과 똑같이 변수에 담거나 딕셔너리 값 자리에 넣을 수 있다. \`TOOLS = {"calc": f1, "search": f2}\`처럼 써두면 \`TOOLS["calc"]\`는 함수 \`f1\` 그 자체(아직 호출 전)를 돌려주고, 그 뒤에 괄호를 하나 더 붙인 \`TOOLS["calc"](인자)\`가 되어서야 비로소 그 함수가 실행된다. 이렇게 해두면 "어떤 도구를 쓸지"가 \`if tool == "calc": ... elif tool == "search": ...\`처럼 조건문을 도구 개수만큼 나열할 필요 없이, 모델이 돌려준 문자열 하나(\`r['tool']\`)를 그대로 딕셔너리의 키로 써서 \`TOOLS[r['tool']](r['args'])\` 한 줄로 알맞은 함수를 찾아 호출하는 것으로 끝난다. 도구를 새로 추가하고 싶으면 이 딕셔너리에 항목 하나만 더 넣으면 되므로, 실전 에이전트 프레임워크들도 대부분 이 "이름 $\to$ 함수" 등록 방식을 그대로 쓴다. \`lambda expr: str(eval(expr, {"__builtins__": {}}))\`처럼 딕셔너리 값 자리에 곧바로 람다(「RAG 파이프라인」 단계에서 배운 이름 없는 함수)를 적어 넣으면, 굳이 \`def\`로 함수를 따로 만들고 이름 붙이는 절차 없이 "이 도구가 하는 일" 한 줄을 바로 그 자리에 적어둘 수 있다.
:::

아래 코드의 \`agent\` 함수는 실제 LLM 호출(\`llm\`)을 인자로 받아, 매 스텝마다 모델이 JSON으로 "어떤 도구를 부를지, 아니면 최종 답을 낼지"를 결정하게 만든 뼈대다. \`llm\`이 함수 자체를 인자로 받는 것도 위 정보 박스와 같은 원리다. "실제 LLM을 호출하는 코드"를 통째로 바꿔 끼울 수 있도록, 함수를 값으로 넘긴다.

실제 LLM API 없이도 이 루프가 정말로 도는지 눈으로 확인할 수 있도록, 실제 모델 대신 미리 정해둔 대답을 순서대로 돌려주는 가짜 \`llm\` 함수를 만들어 \`agent\`에 넘긴다. 첫 스텝에서는 계산 도구를 부르고, 그 결과를 관찰한 다음 스텝에서 최종 답을 내놓는 시나리오다.

\`\`\`python
import json

# "이름" → "그 이름의 도구를 실행하는 함수"를 딕셔너리에 등록해둔다
NOTES = {"세션": "정기 세션은 토요일 오후 2시", "과제": "과제 마감은 일요일 23:59"}
TOOLS = {"calc": lambda expr: str(eval(expr, {"__builtins__": {}})),   # 교육용: 실서비스에서 eval 금지!
         "search": lambda q: next((v for k, v in NOTES.items() if k in q), "검색 결과 없음")}

def agent(goal, llm, max_steps=5):
    hist = [f"목표: {goal}"]
    for _ in range(max_steps):
        reply = llm("\n".join(hist) + '\nJSON으로만 답하라: {"tool":이름|null,"args":인자,"final":최종답|null}')
        r = json.loads(reply)                    # 모델이 내놓은 JSON 텍스트를 파이썬 dict로 변환
        if r["final"]:
            return r["final"]                     # 모델이 종료를 선택: 최종 답을 돌려주고 끝
        hist.append(f"호출 {r['tool']}({r['args']}) → {TOOLS[r['tool']](r['args'])}")  # 관찰을 기록
    return "중단: 최대 스텝 초과"

# 실제 LLM 대신, 미리 짜둔 시나리오대로 응답하는 가짜 llm 함수
scripted = [
    '{"tool": "calc", "args": "12 * 7 + 3", "final": null}',
    '{"tool": null, "args": null, "final": "정답은 87입니다."}',
]
def fake_llm(prompt):
    return scripted.pop(0)          # 호출될 때마다 리스트의 첫 응답을 하나씩 꺼내 쓴다

print(agent("12 곱하기 7 더하기 3은?", fake_llm))

# 종료(final)를 절대 내놓지 않는 llm이라면 어떻게 될까?
def stuck_llm(prompt):
    return '{"tool": "calc", "args": "1+1", "final": null}'

print(agent("아무 계산", stuck_llm))   # max_steps=5를 다 채우고 "중단: 최대 스텝 초과"로 끝난다
\`\`\`

\`max_steps\`를 굳이 5로 고정해 둔 이유가 바로 위에서 언급한 "종료 시점을 스스로 잘 판단하지 못하는" 실패 유형에 대한 방어다. 이 안전장치가 없다면, 모델이 답을 이미 찾고도 \`final\`을 내놓지 않고 같은 도구를 계속 호출하는 무한 루프에 빠졌을 때 프로그램이 영원히 끝나지 않는다.

첫 번째 호출은 \`agent\`가 \`fake_llm\`이 시킨 대로 \`TOOLS["calc"]("12 * 7 + 3")\`을 실행해 \`87\`이라는 관찰을 \`hist\`에 쌓고, 다음 스텝에서 \`fake_llm\`이 \`final\`을 내놓자마자 그 값을 그대로 돌려준다. 두 번째 호출은 \`stuck_llm\`이 매번 같은 도구 호출만 반복해 절대 \`final\`을 내놓지 않으므로, \`max_steps=5\`를 다 채우고 나서야 "중단: 최대 스텝 초과"로 강제 종료된다. 위에서 설명한 "종료를 스스로 판단하지 못하는" 실패가 바로 이 코드로 재현된 것이다.

:::info 실제 LLM API의 도구 호출
여기서는 모델에게 \`{"tool", "args", "final"}\` 형식의 JSON을 텍스트로 쓰게 했다. 실제 LLM API(함수 호출, tool use)는 개발자가 도구마다 이름·설명·입력 스키마를 따로 등록하고, 모델은 구조화된 도구 호출을 돌려주며, 앱이 실행한 결과를 다시 넘겨주는 방식으로 이 루프를 표준화했다. 원리는 위 스켈레톤과 같다. 그 형식, 모델이 만든 인자를 검증하는 법, \`eval\` 없이 도구를 안전하게 구현하는 법은 보충 과정의 「도구 호출 실전」 단계에서 다룬다.
:::

### 실패를 관찰로 되돌려 주기

위 스켈레톤은 모델이 JSON이 아닌 답을 하거나 없는 도구 이름을 대면 \`json.loads\`나 \`TOOLS[...]\`에서 그대로 오류가 나 프로그램이 멈춘다. 실전 루프는 이런 실패를 **관찰로 기록**해 다음 호출에서 모델이 고칠 기회를 준다. LLM은 호출 사이에 아무것도 기억하지 못하므로(상태가 없다), 무엇이 잘못됐는지는 오직 \`hist\`를 통해서만 전달된다.

\`\`\`python
import json

TOOLS = {"search": lambda q: "과제 마감은 일요일 23:59" if "과제" in q else "검색 결과 없음"}

def agent(goal, llm, max_steps=5):
    hist = [f"목표: {goal}"]
    for step in range(1, max_steps + 1):
        reply = llm("\n".join(hist))
        try:
            r = json.loads(reply)
        except json.JSONDecodeError:
            hist.append(f"오류: JSON이 아님 ({reply[:20]}...). JSON으로만 답하라.")   # 실패를 관찰로 되돌린다
            continue
        if r.get("final"):
            print(f"[{step}스텝 만에 종료]")
            return r["final"]
        if r.get("tool") not in TOOLS:
            hist.append(f"오류: 없는 도구 {r.get('tool')!r}. 쓸 수 있는 도구: {list(TOOLS)}")
            continue
        hist.append(f"호출 {r['tool']}({r['args']}) → {TOOLS[r['tool']](r['args'])}")
    return "중단: 최대 스텝 초과"

scripted = [
    "과제 마감을 찾아볼게요!",                                        # ① 형식 오류
    '{"tool": "web_search", "args": "과제 마감", "final": null}',       # ② 없는 도구
    '{"tool": "search", "args": "과제 마감", "final": null}',           # ③ 올바른 호출
    '{"tool": null, "args": null, "final": "일요일 23:59까지입니다."}',  # ④ 종료
]
log = []
def fake_llm(prompt):
    log.append(prompt.split("\n")[-1])         # 모델이 매번 마지막으로 본 줄을 기록
    return scripted.pop(0)

print(agent("과제 마감이 언제야?", fake_llm))
for line in log:
    print("  모델이 본 마지막 줄:", line)
\`\`\`

모델이 처음에는 자연어로, 다음에는 없는 도구 \`web_search\`로 답했지만, 매번 무엇이 틀렸는지가 \`hist\`에 남아 다음 호출의 마지막 줄로 보인다. 세 번째에 올바른 도구를 부르고 네 번째에 종료한다. 이런 재시도도 \`max_steps\` 안에서만 일어나므로 비용이 무한히 늘지 않는다.

[[diagram:agent-recovery-trace]]
`,
  checks: [
    {
      key: "c1",
      question: "에이전트 루프에 `max_steps` 상한을 두는 가장 직접적인 이유는?",
      choices: ["정확도를 높이려고", "모델이 종료를 선택하지 못할 때 무한 루프와 비용 폭주를 막으려고", "도구를 더 많이 쓰려고", "JSON 파싱을 빠르게 하려고"],
      answer: 1,
      explanation: "같은 도구 호출만 반복하는 모델이라도 정해진 스텝에서 멈춘다.",
    },
    {
      key: "c2",
      question: "모델이 JSON 대신 자연어로 답했을 때 실전 루프가 하는 일로 가장 적절한 것은?",
      choices: ["프로그램을 즉시 종료한다", "오류 메시지를 관찰로 기록해 다음 호출에서 모델이 고칠 기회를 준다", "응답을 무시하고 같은 프롬프트를 무한 반복한다", "임의의 도구를 호출한다"],
      answer: 1,
      explanation: "오류를 관찰로 되돌려 주면 모델이 스스로 형식을 바로잡을 수 있다.",
    },
    {
      key: "c3",
      question: "ReAct와 Reflection의 관계로 옳은 것은?",
      choices: ["같은 것이다", "ReAct는 다음 행동을 정하는 루프, Reflection은 방금 한 행동·결과를 평가하는 루프다", "Reflection은 도구를 호출하는 방법이다", "ReAct는 학습 방법이다"],
      answer: 1,
      explanation: "Reflection은 ReAct 루프 위에 얹는 자기 평가 단계다.",
    },
    {
      key: "c4",
      question: "모델이 등록되지 않은 도구 이름(예: `web_search`)으로 호출했을 때 실전 루프의 처리로 가장 적절한 것은?",
      choices: ["실행하지 않고 \"없는 도구, 쓸 수 있는 도구는 …\"이라는 오류를 관찰로 기록한다", "가장 비슷한 이름의 도구를 몰래 대신 실행한다", "프로그램을 즉시 종료한다", "오류를 무시하고 같은 프롬프트로 다시 묻는다"],
      answer: 0,
      explanation: "무엇이 틀렸고 무엇을 쓸 수 있는지를 관찰로 돌려줘야 모델이 다음 스텝에서 고칠 수 있다. 오류 정보 없이 같은 프롬프트로 다시 물으면 같은 실수를 반복하기 쉽다.",
    },
    {
      key: "c5",
      question: "에이전트 루프가 매 호출마다 지금까지의 관찰 이력(`hist`) 전체를 프롬프트에 다시 넣는 이유는?",
      choices: ["LLM은 호출 사이에 상태를 기억하지 못해, 이전 결과를 컨텍스트로만 알 수 있기 때문에", "프롬프트가 길수록 정확해지기 때문에", "API 규칙상 반드시 같은 프롬프트를 보내야 해서", "도구가 이력을 읽어야 해서"],
      answer: 0,
      explanation: "LLM API 호출은 서로 독립이다. 앞에서 무엇을 했고 어떤 결과를 얻었는지는 프롬프트에 다시 넣어 줘야만 모델이 안다. 이것이 단기 기억이고, 길어지면 잘라 내야 하는 이유다.",
    },
  ],
  exercises,
  predicts: [
    {
      key: "p1",
      code: py`
import json
for reply in ['{"final": ""}', '{"final": "0"}', '{"final": 0}', '{"final": null}']:
    r = json.loads(reply)
    print(repr(r["final"]), "종료" if r["final"] else "계속")
`,
      expected: "'' 계속\n'0' 종료\n0 계속\nNone 계속",
      explanation: "에이전트 스켈레톤의 `if r[\"final\"]:`은 값의 참/거짓을 봅니다. 빈 문자열과 숫자 0은 거짓이라, 모델이 \"정답은 0\"을 숫자로 내면 루프가 끝나지 않습니다. JSON의 `null`이 파이썬 `None`이 되므로, 종료 조건은 `r.get(\"final\") is not None`으로 쓰는 편이 안전합니다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "에이전트 루프에 max_steps 같은 상한을 두지 않으면 어떤 문제가 생길 수 있는가?",
      answer: md`
상한이 없으면 에이전트가 같은 행동을 반복하거나 도구를 무한히 호출하며 멈추지 못할 수 있고(무한 루프), 비용과 지연시간이 통제 불가능하게 커진다.
`,
      keyPoints: [],
    },
    {
      key: "d2",
      question: "Reflection은 ReAct의 관찰$\\to$추론$\\to$행동 루프와 어떻게 다른가?",
      answer: md`
ReAct는 매 스텝 '다음에 어떤 행동을 할지'를 결정하는 루프이고, Reflection은 그 위에 얹혀 '방금 한 행동·출력이 잘되었는지'를 스스로 평가하고 개선점을 찾는 메타 루프다.
`,
      keyPoints: [],
    },
  ],
  references: [
    { title: "Yao et al. (2022) — ReAct: Synergizing Reasoning and Acting in Language Models", url: "https://arxiv.org/abs/2210.03629", note: "그림 1의 Thought/Action/Observation 흐름" },
    { title: "Anthropic — Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "워크플로와 에이전트의 차이, 단순한 패턴부터 시작하라는 실전 조언" },
  ],
});
