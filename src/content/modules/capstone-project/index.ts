import { defineModule, md } from "../../kit";
import researchMethods from "./research-methods";
import modelCards from "./model-cards";
import capstoneDesign from "./capstone-design";
import assignment from "./assignment";

export default defineModule({
  slug: "capstone-project",
  track: "capstone",
  order: 1,
  title: "캡스톤 프로젝트",
  summary: "신뢰할 수 있는 실험 절차, 모델카드와 위험 점검, 캡스톤 설계",
  anchor: md`
이 모듈은 스스로 고른 문제를 문제 정의, 데이터, 모델, 평가, 모델카드, 발표까지 수행하는 캡스톤 프로젝트로 과정을 마무리한다. 결과를 믿을 수 있게 만드는 실험 절차(기준 모델, 절제 연구, 여러 시드, 통계적 검정)를 정리하고, NIST AI RMF와 위험 점검표로 프로젝트의 위험을 점검해 모델카드로 보고하며, 핵심 논문을 출발점으로 유형과 성공 기준을 갖춘 계획을 세운다. 캡스톤은 트랙 4를 마칠 때부터 단계별로 준비하므로, [[lesson:capstone-design]]의 일정 표는 이 모듈에 도달하기 전에 먼저 읽는다.
`,
  objectives: [
    "검증할 수 있는 연구 질문과 가설을 세우고, 기준 모델과 같은 조건에서 비교하는 실험을 설계한다.",
    "절제 연구로 구성 요소의 기여를 분리하고, 여러 시드의 평균과 표준편차, 짝지은 비교로 결과의 불확실성을 보고한다.",
    "NIST AI RMF의 네 기능과 위험 점검표로 프로젝트의 위험을 점검하고, EU AI Act의 위험 등급을 용도에 따라 판단한다.",
    "의도된 용도, 의도하지 않은 용도, 데이터 출처, 집단별 성능, 한계, 윤리적 고려 사항을 갖춘 모델카드를 작성한다.",
    "숫자로 확인할 수 있는 성공 기준과 단계별 일정을 갖춘 캡스톤 계획을 세우고, 재현 가능한 코드와 리포트로 결과를 제출한다.",
  ],
  lessons: [researchMethods, modelCards, capstoneDesign],
  recall: [
    { prompt: "검증할 수 있는 연구 질문의 세 가지 조건을 쓰고, 기준 모델 없이 제안 방법의 성능만 보고하면 무엇을 알 수 없는지 쓰라." },
    { prompt: "절제 연구가 무엇인지 쓰고, 시드 하나의 결과로 두 방법을 비교하면 안 되는 이유와 같은 시드끼리 짝지어 비교하는 방법을 쓰라." },
    { prompt: "NIST AI RMF의 네 기능을 쓰고, EU AI Act의 네 위험 등급을 예와 함께 쓰라. 같은 기술이라도 용도에 따라 등급이 달라지는 예도 쓰라." },
    { prompt: "모델카드의 여섯 항목을 쓰고, 집단별 성능을 보고할 때 표본 수를 함께 적어야 하는 이유를 쓰라." },
    { prompt: "캡스톤의 네 준비 단계를 순서대로 쓰고, 성공 기준에 들어가야 하는 세 가지를 쓰라." },
  ],
  assignment,
});
