import { defineModule, md } from "../../kit";
import retrieval from "./retrieval";
import rag from "./rag";
import retrievalMetrics from "./retrieval-metrics";
import agents from "./agents";
import agentDesign from "./agent-design";
import hallucination from "./hallucination";
import llmEvaluation from "./llm-evaluation";
import servingCost from "./serving-cost";
import monitoring from "./monitoring";
import annIndexes from "./ann-indexes";
import toolUse from "./tool-use";
import llmops from "./llmops";
import transformerParams from "./transformer-params";
import contrastiveLearning from "./contrastive-learning";
import evalStatistics from "./eval-statistics";
import injectionDefense from "./injection-defense";
import speculativeDecoding from "./speculative-decoding";
import driftStatistics from "./drift-statistics";
import assignment from "./assignment";

export default defineModule({
  slug: "llm-systems",
  track: "genai",
  order: 3,
  title: "LLM 시스템과 운영",
  summary: "벡터 검색과 RAG, 검색 품질 지표, 도구 호출과 에이전트, 환각과 평가, 서빙 비용과 모니터링",
  anchor: md`
LLM은 학습 데이터에 없는 문서의 내용을 알지 못하고, 사실과 다른 내용을 자연스러운 문장으로 생성할 수 있다. 이 모듈은 LLM을 실제 응용에 쓰기 위한 시스템을 만든다. 문서를 조각으로 나눠 벡터로 색인하고, 질문과 관련된 조각을 검색해 프롬프트에 넣는 RAG 파이프라인을 구현한다. 검색 품질을 Recall@k와 MRR로 측정하고, 도구를 호출하는 에이전트 루프에 최대 스텝 수, 최소 권한, 사람 승인을 적용한다. 환각의 원인을 분석하고, 골든셋과 LLM 채점관으로 시스템을 평가하며, 지연시간과 메모리로 서빙 비용을 계산하고 드리프트를 감지하는 운영 지표를 설계한다. 과제에서는 이 과정의 학습 자료로 QA 봇을 만들고, 골든셋으로 평가한 리포트를 작성한다.
`,
  objectives: [
    "문서를 청킹하고 벡터로 색인해 RAG 파이프라인을 구현하며, Dense 검색과 Sparse 검색의 결과를 RRF로 합친다.",
    "Recall@k와 MRR로 검색 품질을 측정하고, RAG의 오답을 검색 실패와 생성 실패로 구분해 진단한다.",
    "ReAct 루프로 도구를 호출하는 에이전트를 구현하고, 최대 스텝 수, 오류의 관찰 기록, 최소 권한, 사람 승인을 적용한다.",
    "환각의 원인을 학습 과정과 평가 방식으로 설명하고, 완화책의 효과와 한계를 설명한다.",
    "골든셋과 LLM 채점관으로 시스템을 평가하고, Cohen's κ, 회귀 테스트, 안전성 테스트셋으로 평가 결과를 점검한다.",
    "지연시간, 처리량, 추론 메모리를 계산하고, 배포 전략과 드리프트 지표로 운영 모니터링을 설계한다.",
  ],
  lessons: [retrieval, rag, retrievalMetrics, agents, agentDesign, hallucination, llmEvaluation, servingCost, monitoring, annIndexes, toolUse, llmops, transformerParams, contrastiveLearning, evalStatistics, injectionDefense, speculativeDecoding, driftStatistics],
  recall: [
    { prompt: "RAG를 색인 단계와 질의 단계로 나눠 쓰고, 답이 틀렸을 때 검색 실패와 생성 실패를 구분하는 순서를 쓰라." },
    { prompt: "Dense 검색과 Sparse 검색(BM25)의 매칭 기준 차이를 쓰고, RRF가 점수 대신 순위로 결과를 합치는 이유를 쓰라. 질문 4개의 정답 순위가 $[1, 2, 4, \\text{없음}]$일 때 MRR도 계산하라." },
    { prompt: "ReAct 루프의 관찰, 추론, 행동을 쓰고, max_steps, 최소 권한, 사람 승인이 각각 막는 문제를 쓰라." },
    { prompt: "LLM이 사실이 아닌 내용을 생성하는 이유를 사전학습의 목적함수와 평가 방식으로 쓰고, LLM 채점관을 검증할 때 일치율 대신 Cohen's κ를 보는 이유를 쓰라." },
    { prompt: "TTFT 0.5초, 초당 40토큰일 때 400토큰 응답을 받는 시간을 계산하고, 배치를 키울 때 처리량과 지연시간이 어떻게 변하는지 쓰라. 데이터 드리프트와 개념 드리프트의 차이도 쓰라." },
  ],
  assignment,
});
