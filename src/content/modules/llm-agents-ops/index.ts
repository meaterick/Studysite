import { defineModule, md } from "../../kit";
import agents from "./agents";
import agentDesign from "./agent-design";
import servingCost from "./serving-cost";
import monitoring from "./monitoring";
import toolUse from "./tool-use";
import llmops from "./llmops";
import transformerParams from "./transformer-params";
import injectionDefense from "./injection-defense";
import speculativeDecoding from "./speculative-decoding";
import driftStatistics from "./drift-statistics";

export default defineModule({
  slug: "llm-agents-ops",
  track: "genai",
  order: 4,
  title: "에이전트와 운영",
  summary: "도구 호출과 에이전트 루프, 에이전트 설계와 안전, 서빙 비용, 운영 모니터링",
  anchor: md`
LLM이 답을 쓰는 데서 그치지 않고 도구를 호출해 작업을 수행하면, 잘못된 호출 하나가 메일 발송이나 데이터 삭제 같은 실제 결과로 이어진다. 서비스로 운영하면 응답 시간과 GPU 메모리가 비용을 정하고, 입력이 바뀌면 성능이 조용히 떨어진다. 이 모듈은 도구를 호출하는 에이전트를 만들고 안전하게 운영하는 방법을 다룬다. ReAct 루프로 에이전트를 구현해 최대 스텝 수, 최소 권한, 사람 승인을 적용하고, 메모리와 다중 에이전트, 간접 프롬프트 인젝션에 대한 다층 방어를 설계한다. 지연시간과 메모리로 서빙 비용을 계산하고, 배포 전략과 드리프트를 감지하는 운영 지표를 설계한다. 앞 모듈의 검색([[lesson:retrieval]])과 평가([[lesson:llm-evaluation]])를 바탕으로 한다.
`,
  objectives: [
    "ReAct 루프로 도구를 호출하는 에이전트를 구현하고, 최대 스텝 수, 오류의 관찰 기록, 최소 권한, 사람 승인을 적용한다.",
    "단기·장기 메모리와 다중 에이전트의 역할을 설명하고, 간접 프롬프트 인젝션에 데이터와 지시의 분리, 최소 권한, 사람 승인을 겹쳐 적용한다.",
    "지연시간, 처리량, 추론 메모리를 계산하고, 배포 전략과 드리프트 지표로 운영 모니터링을 설계한다.",
  ],
  lessons: [agents, agentDesign, servingCost, monitoring, toolUse, llmops, transformerParams, injectionDefense, speculativeDecoding, driftStatistics],
  // 키 "2"·"4"는 6-3에 있던 시절의 순서 번호로, db.ts의 마이그레이션이 옮겨 온 예전 답안과 연결된다. 새 문항은 겹치지 않는 키를 쓴다.
  recall: [
    { key: "2", prompt: "ReAct 루프의 관찰, 추론, 행동을 쓰고, max_steps, 최소 권한, 사람 승인이 각각 막는 문제를 쓰라." },
    { key: "5", prompt: "에이전트의 단기 메모리와 장기 메모리가 각각 무엇을 담고 어떻게 불러오는지 쓰고, 검색한 문서에 숨은 지시가 도구 호출로 이어지는 간접 프롬프트 인젝션을 데이터와 지시의 분리로 막는 방법을 쓰라." },
    { key: "4", prompt: "TTFT 0.5초, 초당 40토큰일 때 400토큰 응답을 받는 시간을 계산하고, 배치를 키울 때 처리량과 지연시간이 어떻게 변하는지 쓰라. 데이터 드리프트와 개념 드리프트의 차이도 쓰라." },
  ],
});
