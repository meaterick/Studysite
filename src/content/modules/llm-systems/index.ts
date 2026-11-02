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
(작성 중)
`,
  objectives: [],
  lessons: [retrieval, rag, retrievalMetrics, agents, agentDesign, hallucination, llmEvaluation, servingCost, monitoring, annIndexes, toolUse, llmops, transformerParams, contrastiveLearning, evalStatistics, injectionDefense, speculativeDecoding, driftStatistics],
  recall: [
    { prompt: "① RAG 파이프라인을 색인 단계와 질의 단계로 나눠 설명하고, 답이 틀렸을 때 검색 실패와 생성 실패를 구분하는 방법을 설명하십시오.", hint: "청킹 → 임베딩 → 검색 → 프롬프트 조립 → 생성 순서로 적어 보십시오." },
    { prompt: "② Dense 검색(임베딩)과 Sparse 검색(BM25)의 매칭 기준 차이를 설명하고, 하이브리드 검색(RRF)이 순위를 합치는 방법을 설명하십시오.", hint: "제품 코드처럼 정확한 단어가 중요한 질의를 예로 들어 보십시오." },
    { prompt: "③ Recall@k와 MRR이 각각 무엇을 재는지 설명하고, 질문 4개의 정답 순위가 [1, 2, 4, 없음]일 때 MRR을 계산하십시오.", hint: "정답을 찾지 못한 질문이 MRR에 어떻게 반영되는지 적어 보십시오." },
    { prompt: "④ ReAct 에이전트 루프(관찰 → 추론 → 행동)를 설명하고, max_steps 같은 상한이 필요한 이유를 설명하십시오.", hint: "도구 호출 결과가 다음 스텝에 어떻게 전달되는지 적어 보십시오." },
    { prompt: "⑤ LLM이 사실이 아닌 내용을 그럴듯하게 생성하는(환각) 이유를 학습 목표의 관점에서 설명하고, RAG 같은 완화책이 환각을 완전히 없애지 못하는 이유를 설명하십시오.", hint: "모델이 배우는 것이 사실 여부인지 토큰 확률인지 생각해 보십시오." },
  ],
  assignment,
});
