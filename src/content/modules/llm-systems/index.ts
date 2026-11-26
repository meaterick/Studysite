import { defineModule, md } from "../../kit";
import retrieval from "./retrieval";
import rag from "./rag";
import retrievalMetrics from "./retrieval-metrics";
import hallucination from "./hallucination";
import llmEvaluation from "./llm-evaluation";
import annIndexes from "./ann-indexes";
import contrastiveLearning from "./contrastive-learning";
import evalStatistics from "./eval-statistics";
import assignment from "./assignment";

export default defineModule({
  slug: "llm-systems",
  track: "genai",
  order: 3,
  title: "검색·RAG와 평가",
  summary: "벡터 검색과 RAG, 검색 품질 지표, 환각과 LLM 평가",
  anchor: md`
LLM은 학습 데이터에 없는 문서의 내용을 알지 못하고, 사실과 다른 내용을 자연스러운 문장으로 생성할 수 있다. 이 모듈은 문서를 근거로 답하는 시스템을 만들고, 그 시스템이 얼마나 믿을 만한지 평가한다. 문서를 조각으로 나눠 벡터로 색인하고, 질문과 관련된 조각을 검색해 프롬프트에 넣는 RAG 파이프라인을 구현한다. 검색 품질을 Recall@k와 MRR로 측정하고, 환각의 원인을 분석하며, 골든셋과 LLM 채점관으로 시스템을 평가한다. 과제에서는 이 과정의 학습 자료로 QA 봇을 만들고, 골든셋으로 평가한 리포트를 작성한다. 도구를 호출하는 에이전트와 서빙·운영 모니터링은 다음 모듈([[lesson:agents]])에서 다룬다.
`,
  objectives: [
    "문서를 청킹하고 벡터로 색인해 RAG 파이프라인을 구현하며, Dense 검색과 Sparse 검색의 결과를 RRF로 합친다.",
    "Recall@k와 MRR로 검색 품질을 측정하고, RAG의 오답을 검색 실패와 생성 실패로 구분해 진단한다.",
    "환각의 원인을 학습 과정과 평가 방식으로 설명하고, 완화책의 효과와 한계를 설명한다.",
    "골든셋과 LLM 채점관으로 시스템을 평가하고, Cohen's κ, 회귀 테스트, 안전성 테스트셋으로 평가 결과를 점검한다.",
  ],
  lessons: [retrieval, rag, retrievalMetrics, hallucination, llmEvaluation, annIndexes, contrastiveLearning, evalStatistics],
  // 저장 키(key)는 모듈을 나누기 전의 순서 번호다. 이미 저장된 답안과의 연결을 지키므로 바꾸지 않는다.
  recall: [
    { prompt: "RAG를 색인 단계와 질의 단계로 나눠 쓰고, 답이 틀렸을 때 검색 실패와 생성 실패를 구분하는 순서를 쓰라." },
    { prompt: "Dense 검색과 Sparse 검색(BM25)의 매칭 기준 차이를 쓰고, RRF가 점수 대신 순위로 결과를 합치는 이유를 쓰라. 질문 4개의 정답 순위가 $[1, 2, 4, \\text{없음}]$일 때 MRR도 계산하라." },
    { key: "3", prompt: "LLM이 사실이 아닌 내용을 생성하는 이유를 사전학습의 목적함수와 평가 방식으로 쓰고, LLM 채점관을 검증할 때 일치율 대신 Cohen's κ를 보는 이유를 쓰라." },
  ],
  assignment,
});
