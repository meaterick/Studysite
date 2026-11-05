import { defineLesson, md, py } from "../../kit";
import exercises from "./labs/agents";

export default defineLesson({
  id: "agents",
  title: "도구 호출과 에이전트 루프",
  tier: "core",
  concepts: ["retrieval-rag-agents"],
  goal: "ReAct의 관찰→추론→행동 루프를 코드로 구현하고, 종료 판단 실패, 도구 오선택, 출력 형식 오류 같은 실패 유형과 max_steps, 오류를 관찰로 되돌려 주기, Reflection의 역할을 설명한다.",
  why: "LLM이 검색, 계산, 코드 실행, 외부 API 호출 같은 도구를 쓰는 응용은 모두 이 레슨의 루프 구조로 동작한다. 루프가 끝나지 않거나 잘못된 도구를 호출하는 문제는 실제 서비스에서 비용과 장애로 이어지므로, 루프를 구현할 때 종료 조건과 오류 처리를 함께 설계해야 한다.",
  body: md`
### ReAct 루프

RAG는 한 번 검색한 결과를 프롬프트에 넣고 한 번 생성한다. **에이전트**(agent)는 검색과 판단을 여러 스텝에 걸쳐 반복하며, 다음 행동을 모델이 정하는 시스템이다. Yao et al. (2022)은 이 반복 구조를 **ReAct**(Reasoning + Acting)로 정리했다. 모델은 스텝마다 지금까지 쌓인 관찰(observation)을 바탕으로 추론(reasoning)을 텍스트로 생성하고, 그 결과에 따라 계산기, 검색 함수, 코드 실행기처럼 미리 정의한 도구 중 무엇을 어떤 인자로 호출할지, 또는 최종 답을 출력하고 끝낼지를 행동(action)으로 정한다. 도구가 돌려준 결과는 새 관찰로 기록되어 다음 스텝의 입력에 들어가며, 이 과정은 모델이 종료를 선택하거나 정해진 최대 스텝 수에 도달할 때까지 반복된다.

[[diagram:agent-loop]]

이 루프에는 고유한 실패 유형이 있다. 모델이 도구를 잘못 고르거나, 도구의 결과를 잘못 읽거나, 답을 이미 찾았는데도 종료하지 않고 다른 도구를 계속 호출할 수 있다. 그래서 루프에는 최대 스텝 수를 정해 두고, 도구 호출과 그 결과를 검사하도록 설계한다.

**Reflection**(자기 반성)은 이 루프에 평가 단계를 더하는 방법이다(Shinn et al., 2023). ReAct 루프가 스텝마다 다음 행동을 정한다면, Reflection은 에이전트가 방금 낸 행동이나 결과물을 목표에 비추어 평가하고, 부족한 점을 텍스트로 정리해 다음 시도에 반영하게 한다.

### 에이전트 루프의 구조

아래 \`agent\` 함수는 모델(\`llm\`)을 인자로 받아, 스텝마다 모델이 JSON으로 호출할 도구나 최종 답을 정하게 하는 루프다. 도구는 이름(문자열)을 키로, 그 도구를 실행하는 함수를 값으로 하는 딕셔너리 \`TOOLS\`에 등록한다. 모델이 출력한 도구 이름으로 \`TOOLS[r["tool"]](r["args"])\`처럼 함수를 찾아 호출하므로, 도구를 추가할 때는 딕셔너리에 항목만 더하면 된다. 실제 LLM 대신 미리 정한 응답을 순서대로 돌려주는 \`fake_llm\`으로 루프의 동작을 확인한다. 첫 스텝에서 계산 도구를 호출하고, 그 결과를 관찰한 다음 스텝에서 최종 답을 내는 시나리오다.

\`\`\`python
import json

# 도구 이름 → 그 도구를 실행하는 함수
NOTES = {"세션": "정기 세션은 토요일 오후 2시", "과제": "과제 마감은 일요일 23:59"}
TOOLS = {"calc": lambda expr: str(eval(expr, {"__builtins__": {}})),   # 설명용이다. 실제 서비스에서는 eval을 쓰지 않는다
         "search": lambda q: next((v for k, v in NOTES.items() if k in q), "검색 결과 없음")}

def agent(goal, llm, max_steps=5):
    hist = [f"목표: {goal}"]
    for _ in range(max_steps):
        reply = llm("\n".join(hist) + '\nJSON으로만 답하라: {"tool":이름|null,"args":인자,"final":최종답|null}')
        r = json.loads(reply)                    # 모델이 출력한 JSON 텍스트를 dict로 바꾼다
        if r["final"]:
            return r["final"]                     # 모델이 종료를 선택하면 최종 답을 돌려준다
        hist.append(f"호출 {r['tool']}({r['args']}) → {TOOLS[r['tool']](r['args'])}")  # 관찰을 기록한다
    return "중단: 최대 스텝 초과"

# 실제 LLM 대신 미리 정한 시나리오대로 응답하는 함수
scripted = [
    '{"tool": "calc", "args": "12 * 7 + 3", "final": null}',
    '{"tool": null, "args": null, "final": "정답은 87입니다."}',
]
def fake_llm(prompt):
    return scripted.pop(0)          # 호출될 때마다 첫 응답을 하나씩 꺼낸다

print(agent("12 곱하기 7 더하기 3은?", fake_llm))

# 종료(final)를 출력하지 않는 모델
def stuck_llm(prompt):
    return '{"tool": "calc", "args": "1+1", "final": null}'

print(agent("아무 계산", stuck_llm))   # max_steps=5를 모두 쓰고 "중단: 최대 스텝 초과"로 끝난다
\`\`\`

첫 번째 호출에서 \`agent\`는 \`fake_llm\`의 응답대로 \`TOOLS["calc"]("12 * 7 + 3")\`을 실행해 \`87\`을 관찰로 기록하고, 다음 스텝에서 \`final\`이 나오자 그 값을 돌려준다. 두 번째 호출의 \`stuck_llm\`은 같은 도구 호출만 반복하고 \`final\`을 출력하지 않으므로, \`max_steps=5\`를 모두 쓴 뒤 "중단: 최대 스텝 초과"로 끝난다. 최대 스텝 수가 없다면 이 루프는 끝나지 않고 호출 비용이 계속 늘어난다.

:::info 실제 LLM API의 도구 호출
여기서는 모델이 \`{"tool", "args", "final"}\` 형식의 JSON을 텍스트로 출력하게 했다. 실제 LLM API의 도구 호출(function calling, tool use)에서는 개발자가 도구마다 이름, 설명, 입력 스키마를 등록하고, 모델은 구조화된 도구 호출을 출력하며, 응용 프로그램이 도구를 실행한 결과를 다시 모델에 보낸다. 원리는 위 루프와 같다. API의 형식, 모델이 만든 인자를 검증하는 방법, \`eval\` 없이 도구를 안전하게 구현하는 방법은 [[lesson:tool-use]]에서 다룬다.
:::

### 실패를 관찰로 되돌려 주기

위 루프는 모델이 JSON이 아닌 답을 하거나 없는 도구 이름을 출력하면 \`json.loads\`나 \`TOOLS[...]\`에서 오류가 나 프로그램이 멈춘다. 실무의 루프는 이런 실패를 **관찰로 기록**해 다음 호출에서 모델이 고칠 수 있게 한다. LLM은 호출 사이에 아무것도 기억하지 못하므로, 무엇이 잘못되었는지는 \`hist\`를 통해서만 전달된다.

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
            hist.append(f"오류: JSON이 아님 ({reply[:20]}...). JSON으로만 답하라.")   # 실패를 관찰로 기록한다
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
    "찾아보겠습니다.",                                                # ① 형식 오류
    '{"tool": "web_search", "args": "과제 마감", "final": null}',       # ② 없는 도구
    '{"tool": "search", "args": "과제 마감", "final": null}',           # ③ 올바른 호출
    '{"tool": null, "args": null, "final": "일요일 23:59까지입니다."}',  # ④ 종료
]
log = []
def fake_llm(prompt):
    log.append(prompt.split("\n")[-1])         # 모델이 받은 프롬프트의 마지막 줄을 기록한다
    return scripted.pop(0)

print(agent("과제 마감이 언제야?", fake_llm))
for line in log:
    print("  모델이 본 마지막 줄:", line)
\`\`\`

모델이 처음에는 자연어로, 다음에는 없는 도구 \`web_search\`로 답했지만, 무엇이 틀렸는지가 \`hist\`에 기록되어 다음 호출의 마지막 줄로 전달된다. 모델은 세 번째 스텝에서 올바른 도구를 호출하고 네 번째 스텝에서 종료한다. 이런 재시도도 \`max_steps\` 안에서만 일어나므로 비용이 제한된다.

[[diagram:agent-recovery-trace]]
`,
  checks: [
    {
      key: "c1",
      question: "에이전트 루프에 `max_steps` 상한을 두는 가장 직접적인 이유는?",
      choices: ["정확도를 높이기 위해", "모델이 종료를 선택하지 못할 때 루프가 끝나지 않고 비용이 계속 늘어나는 것을 막기 위해", "도구를 더 많이 쓰기 위해", "JSON 파싱을 빠르게 하기 위해"],
      answer: 1,
      explanation: "같은 도구 호출만 반복하는 모델이라도 정해진 스텝 수에서 루프가 끝나므로, 호출 횟수와 비용에 상한이 생긴다.",
    },
    {
      key: "c2",
      question: "모델이 JSON 대신 자연어로 답했을 때 실전 루프가 하는 일로 가장 적절한 것은?",
      choices: ["프로그램을 즉시 종료한다", "오류 메시지를 관찰로 기록해 다음 호출에서 모델이 고칠 수 있게 한다", "응답을 무시하고 같은 프롬프트를 계속 보낸다", "임의의 도구를 호출한다"],
      answer: 1,
      explanation: "모델은 호출 사이에 상태를 기억하지 못하므로, 무엇이 틀렸는지를 관찰로 기록해야 다음 호출에서 형식을 고칠 수 있다.",
    },
    {
      key: "c3",
      question: "ReAct와 Reflection의 관계로 옳은 것은?",
      choices: ["같은 것이다", "ReAct는 다음 행동을 정하는 루프이고, Reflection은 방금 한 행동과 결과를 평가하는 단계다", "Reflection은 도구를 호출하는 방법이다", "ReAct는 학습 방법이다"],
      answer: 1,
      explanation: "Reflection은 ReAct 루프에 더하는 자기 평가 단계로, 평가 결과를 텍스트로 정리해 다음 시도에 반영한다.",
    },
    {
      key: "c4",
      question: "모델이 등록되지 않은 도구 이름(예: `web_search`)으로 호출했을 때 실전 루프의 처리로 가장 적절한 것은?",
      choices: ["실행하지 않고 \"없는 도구, 쓸 수 있는 도구는 …\"이라는 오류를 관찰로 기록한다", "가장 비슷한 이름의 도구를 대신 실행한다", "프로그램을 즉시 종료한다", "오류를 무시하고 같은 프롬프트로 다시 묻는다"],
      answer: 0,
      explanation: "무엇이 틀렸고 어떤 도구를 쓸 수 있는지를 관찰로 기록해야 모델이 다음 스텝에서 고칠 수 있다. 오류 정보 없이 같은 프롬프트로 다시 물으면 같은 실수를 반복하기 쉽다.",
    },
    {
      key: "c5",
      question: "에이전트 루프가 매 호출마다 지금까지의 관찰 이력(`hist`) 전체를 프롬프트에 다시 넣는 이유는?",
      choices: ["LLM은 호출 사이에 상태를 기억하지 못해, 이전 결과를 프롬프트로만 알 수 있기 때문에", "프롬프트가 길수록 정확해지기 때문에", "API 규칙상 같은 프롬프트를 보내야 하기 때문에", "도구가 이력을 읽어야 하기 때문에"],
      answer: 0,
      explanation: "LLM API 호출은 서로 독립이므로, 앞에서 무엇을 했고 어떤 결과를 얻었는지는 프롬프트에 다시 넣어야 모델이 참조할 수 있다. 이 이력이 단기 기억이며, 길어지면 잘라 내야 한다([[lesson:agent-design]]).",
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
      explanation: "본문 루프의 `if r[\"final\"]:`은 값의 참과 거짓을 본다. 빈 문자열과 숫자 0은 거짓이므로, 모델이 답 0을 숫자로 출력하면 루프가 끝나지 않는다. JSON의 `null`은 파이썬의 `None`이 되므로, 종료 조건은 `r.get(\"final\") is not None`으로 쓰는 것이 안전하다.",
    },
  ],
  descriptive: [
    {
      key: "d1",
      question: "에이전트 루프에 max_steps 같은 상한을 두지 않으면 생기는 문제를 쓰고, 모델의 형식 오류나 없는 도구 호출을 프로그램 오류로 멈추지 않고 관찰로 기록하는 이유를 쓰라.",
      answer: md`
모델이 종료를 선택하지 못하고 같은 도구 호출을 반복하면, 상한이 없는 루프는 끝나지 않고 호출 비용과 지연시간이 계속 늘어난다. max_steps를 두면 루프가 정해진 스텝 수에서 끝나므로 비용에 상한이 생긴다.

LLM은 호출 사이에 상태를 기억하지 못하고, 이전 스텝의 결과는 프롬프트에 들어간 이력으로만 알 수 있다. 형식 오류나 없는 도구 호출에서 프로그램을 멈추면 모델이 고칠 기회가 없다. 무엇이 틀렸고 어떤 도구를 쓸 수 있는지를 관찰로 기록하면, 다음 호출에서 모델이 그 내용을 참조해 응답을 고칠 수 있다.
`,
      keyPoints: [
        "상한이 없으면 종료하지 못하는 루프가 비용과 지연시간을 계속 늘린다",
        "max_steps는 호출 횟수와 비용에 상한을 둔다",
        "LLM은 호출 사이에 상태가 없어 이력으로만 이전 결과를 안다",
        "오류를 관찰로 기록하면 다음 호출에서 모델이 고칠 수 있다",
      ],
    },
    {
      key: "d2",
      question: "ReAct 루프의 관찰, 추론, 행동이 각각 무엇인지 쓰고, Reflection이 이 루프에 더하는 것을 쓰라.",
      answer: md`
관찰은 도구 호출의 결과처럼 지금까지 쌓인 정보이고, 추론은 모델이 관찰을 바탕으로 다음에 할 일을 텍스트로 생성하는 과정이며, 행동은 도구를 어떤 인자로 호출할지 또는 최종 답을 내고 끝낼지를 정하는 것이다. 행동의 결과는 새 관찰이 되어 다음 스텝의 입력에 들어간다.

ReAct 루프가 스텝마다 다음 행동을 정한다면, Reflection은 방금 낸 행동이나 결과물을 목표에 비추어 평가하고 부족한 점을 텍스트로 정리해 다음 시도에 반영하는 단계를 더한다.
`,
      keyPoints: [
        "관찰은 지금까지 쌓인 도구 결과이고 추론은 다음 할 일을 텍스트로 생성하는 것이다",
        "행동은 도구 호출이나 최종 답을 정하는 것이며 결과가 새 관찰이 된다",
        "Reflection은 결과를 목표에 비추어 평가하고 다음 시도에 반영한다",
      ],
    },
  ],
  references: [
    { title: "Yao et al. (2022) — ReAct: Synergizing Reasoning and Acting in Language Models", url: "https://arxiv.org/abs/2210.03629", note: "ReAct를 제안한 논문. 그림 1에 추론·행동·관찰의 흐름이 있다 (영문)" },
    { title: "Shinn et al. (2023) — Reflexion: Language Agents with Verbal Reinforcement Learning", url: "https://arxiv.org/abs/2303.11366", note: "결과를 텍스트로 평가해 다음 시도에 반영하는 방법 (영문)" },
    { title: "Anthropic — Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "워크플로와 에이전트의 차이와 설계 원칙 (영문)" },
  ],
});
