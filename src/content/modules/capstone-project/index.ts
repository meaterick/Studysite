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
(작성 중)
`,
  objectives: [],
  lessons: [researchMethods, modelCards, capstoneDesign],
  recall: [
    { prompt: "③ EU AI Act의 위험 기반 4등급을 예와 함께 설명하고, 모델카드에 들어가는 항목과 모델카드가 필요한 이유를 설명하십시오.", hint: "같은 기술이라도 용도에 따라 등급이 달라지는 예를 적어 보십시오." },
    { prompt: "⑤ 절제 연구가 무엇이며, 여러 시드로 반복해 평균과 표준편차를 보고해야 하는 이유를 설명하십시오.", hint: "구성요소를 하나씩 뺐을 때의 정확도 표를 예로 들어 보십시오." },
  ],
  assignment,
});
