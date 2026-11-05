import { defineExercises, md, py } from "../../../kit";

export default defineExercises([
  {
    key: "ex1",
    title: "실수를 관찰로 되돌려 주는 에이전트 루프",
    prompt: md`
:::info 가상 예제 데이터
이 레슨의 동아리 공지·마감·점수·출석 규칙은 검색과 도구 호출을 설명하기 위한 가상 데이터이며, 이 사이트의 운영 규칙이 아니다. 실제 학습은 자기 점검과 추천 일정에 따른다.
:::

본문의 에이전트 루프는 모델이 JSON을 깨뜨리거나, 없는 도구를 부르거나, 도구가 예외를 던지면 그대로 멈춥니다. 오류를 **관찰로 되돌려 주는** \`robust_agent(goal, llm, max_steps=5)\`를 완성합니다. 반환값은 \`(최종 답 또는 "중단: 최대 스텝 초과", hist)\`입니다.

- JSON이 아니면 \`"오류: JSON 형식이 아님 …"\`
- \`final\`이 \`null\`이 아니면 그 값을 돌려주고 끝냅니다(\`0\`이나 \`""\`도 답입니다).
- 없는 도구면 \`"오류: '<도구>'라는 도구는 없음 …"\`
- 직전과 같은 \`(tool, args)\`를 또 부르면 도구를 실행하지 않고 \`"경고: 같은 호출 반복 …"\`
- 도구가 예외를 던지면 \`"오류: <도구> 실행 실패 (<예외 이름>)"\`
- 그 밖에는 \`"<도구>(<인자>) → <결과>"\`

관찰은 모두 \`hist\`에 쌓여 다음 \`llm\` 호출의 입력이 됩니다.
`,
    starter: py`
import json

NOTES = {"세션": "정기 세션은 토요일 오후 2시", "과제": "과제 마감은 일요일 23:59", "수료": "수료 기준은 70점 이상"}
TOOLS = {
    "calc": lambda expr: str(eval(expr, {"__builtins__": {}})),      # 교육용: 실서비스에서 eval 금지!
    "search": lambda q: next((v for k, v in NOTES.items() if k in q), "검색 결과 없음"),
}

def robust_agent(goal, llm, max_steps=5):
    hist = [f"목표: {goal}"]
    last_call = None
    for step in range(max_steps):
        reply = llm("\n".join(hist))
        r = json.loads(reply)                  # TODO ①: JSON이 아니면 오류를 관찰로 남기고 다음 스텝으로
        if r["final"]:                         # TODO ②: 0이나 ""도 답으로 받도록 고칩니다.
            return r["final"], hist
        tool, args = r.get("tool"), r.get("args")
        # TODO ③: 없는 도구 / 직전과 같은 호출 / 도구 예외를 관찰로 바꿉니다.
        obs = f"{tool}({args}) → {TOOLS[tool](args)}"
        hist.append(obs)
    return "중단: 최대 스텝 초과", hist

def scripted(*replies):
    queue = list(replies)
    return lambda prompt: queue.pop(0)

answer, hist = robust_agent("과제 마감 확인", scripted(
    '찾아보겠습니다',
    '{"tool": "browse", "args": "과제", "final": null}',
    '{"tool": "search", "args": "과제 마감", "final": null}',
    '{"tool": null, "args": null, "final": "일요일 23:59까지입니다."}'))
print("\n".join(hist), "\n→", answer)
`,
    tests: py`
import json

NOTES = {"세션": "정기 세션은 토요일 오후 2시", "과제": "과제 마감은 일요일 23:59", "수료": "수료 기준은 70점 이상"}
TOOLS = {
    "calc": lambda expr: str(eval(expr, {"__builtins__": {}})),      # 교육용: 실서비스에서 eval 금지!
    "search": lambda q: next((v for k, v in NOTES.items() if k in q), "검색 결과 없음"),
}

def scripted(*replies):
    queue = list(replies)
    calls = []
    def llm(prompt):
        calls.append(prompt)
        return queue.pop(0)
    llm.calls = calls
    return llm

@test("JSON 깨짐 → 없는 도구 → 검색 → 최종 답(4단계)")
def _():
    ans, hist = robust_agent("과제 마감 확인", scripted(
        '찾아보겠습니다',
        '{"tool": "browse", "args": "과제", "final": null}',
        '{"tool": "search", "args": "과제 마감", "final": null}',
        '{"tool": null, "args": null, "final": "일요일 23:59까지입니다."}'))
    assert ans == "일요일 23:59까지입니다.", ans
    assert len(hist) == 4 and hist[1].startswith("오류: JSON") and "browse" in hist[2] and "23:59" in hist[3], hist

@test("도구 예외는 '실행 실패 (ZeroDivisionError)' 관찰이 되고, final = 0도 답으로 받는다")
def _():
    ans, hist = robust_agent("계산", scripted(
        '{"tool": "calc", "args": "10 / 0", "final": null}',
        '{"tool": null, "args": null, "final": 0}'))
    assert "실행 실패 (ZeroDivisionError)" in hist[1], hist
    assert ans == 0 and ans is not None and not isinstance(ans, str), f"final = 0을 답으로 받지 못했습니다: {ans!r}"

@test("같은 호출을 연속으로 반복하면 실행 대신 경고")
def _():
    ans, hist = robust_agent("검색", scripted(
        '{"tool": "search", "args": "세션", "final": null}',
        '{"tool": "search", "args": "세션", "final": null}',
        '{"tool": null, "args": null, "final": "토요일"}'))
    assert "토요일 오후 2시" in hist[1] and "같은 호출 반복" in hist[2] and ans == "토요일", hist

@test("final을 내지 않으면 max_steps번만 호출하고 중단")
def _():
    llm = scripted(*['{"tool": "calc", "args": "%d+1", "final": null}' % i for i in range(10)])
    ans, hist = robust_agent("끝나지 않는 목표", llm, max_steps=3)
    assert ans == "중단: 최대 스텝 초과" and len(llm.calls) == 3 and len(hist) == 4, (ans, len(llm.calls), hist)
`,
    hints: ["`try: r = json.loads(reply)` / `except json.JSONDecodeError: hist.append(\"오류: JSON 형식이 아님: JSON으로만 다시 답하라\"); continue`", "종료 조건은 `if r.get(\"final\") is not None:`입니다. `if r[\"final\"]:`은 답이 `0`이나 `\"\"`일 때 종료하지 못합니다.", "`if tool not in TOOLS: …` → `elif (tool, args) == last_call: …` → `else: try: obs = f\"{tool}({args}) → {TOOLS[tool](args)}\" except Exception as e: obs = f\"오류: {tool} 실행 실패 ({type(e).__name__})\"`. 마지막에 `last_call = (tool, args)`."],
    solution: py`
import json

NOTES = {"세션": "정기 세션은 토요일 오후 2시", "과제": "과제 마감은 일요일 23:59", "수료": "수료 기준은 70점 이상"}
TOOLS = {
    "calc": lambda expr: str(eval(expr, {"__builtins__": {}})),      # 교육용: 실서비스에서 eval 금지!
    "search": lambda q: next((v for k, v in NOTES.items() if k in q), "검색 결과 없음"),
}

def robust_agent(goal, llm, max_steps=5):
    hist = [f"목표: {goal}"]
    last_call = None
    for step in range(max_steps):
        reply = llm("\n".join(hist))
        try:
            r = json.loads(reply)
        except json.JSONDecodeError:
            hist.append("오류: JSON 형식이 아님: JSON으로만 다시 답하라")
            continue
        if not isinstance(r, dict):
            hist.append("오류: JSON 객체가 아님")
            continue
        if r.get("final") is not None:
            return r["final"], hist
        tool, args = r.get("tool"), r.get("args")
        if tool not in TOOLS:
            obs = f"오류: '{tool}'라는 도구는 없음. 사용 가능: {list(TOOLS)}"
        elif (tool, args) == last_call:
            obs = f"경고: 같은 호출 반복 {tool}({args}): 다른 행동을 하거나 final로 답하라"
        else:
            try:
                obs = f"{tool}({args}) → {TOOLS[tool](args)}"
            except Exception as e:
                obs = f"오류: {tool} 실행 실패 ({type(e).__name__})"
        last_call = (tool, args)
        hist.append(obs)
    return "중단: 최대 스텝 초과", hist

def scripted(*replies):
    queue = list(replies)
    return lambda prompt: queue.pop(0)

answer, hist = robust_agent("과제 마감 확인", scripted(
    '찾아보겠습니다',
    '{"tool": "browse", "args": "과제", "final": null}',
    '{"tool": "search", "args": "과제 마감", "final": null}',
    '{"tool": null, "args": null, "final": "일요일 23:59까지입니다."}'))
print("\n".join(hist), "\n→", answer)
`,
  },
]);
