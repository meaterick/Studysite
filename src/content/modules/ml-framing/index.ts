import { defineModule, md } from "../../kit";
import mlTerms from "./ml-terms";
import learningParadigms from "./learning-paradigms";
import taskTypes from "./task-types";
import dataSplits from "./data-splits";
import baselines from "./baselines";
import lossFunctions from "./loss-functions";

export default defineModule({
  slug: "ml-framing",
  track: "ml",
  order: 1,
  title: "문제 설정과 실험 설계",
  summary: "머신러닝 용어, 학습 패러다임, 문제 유형, 데이터 분할과 누수, 기준 모델, 손실함수",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [mlTerms, learningParadigms, taskTypes, dataSplits, baselines, lossFunctions],
  recall: [
    { prompt: "① 머신러닝을 \"함수를 찾는 게임\"이라고 부르는 이유를 데이터·모델(파라미터)·손실의 관계로 설명하십시오.", hint: "규칙을 사람이 직접 적는 전통적 프로그래밍과 비교해 보십시오." },
    { prompt: "③ 데이터 누수가 무엇인지 설명하고, 스케일링 같은 전처리를 교차검증의 각 fold 안에서 해야 하는 이유를 설명하십시오.", hint: "Pipeline이 어떤 실수를 막아 주는지 적어 보십시오." },
  ],
});
