import { defineModule, md } from "../../kit";
import probabilityRules from "./probability-rules";
import bayes from "./bayes";
import randomVariables from "./random-variables";
import distributions from "./distributions";

export default defineModule({
  slug: "probability-basics",
  track: "math",
  order: 4,
  title: "확률",
  summary: "사건과 독립성, 조건부확률과 베이즈 정리, 확률변수, 정규·이항분포",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [probabilityRules, bayes, randomVariables, distributions],
  recall: [
    { prompt: "③ 유병률 1%, 민감도 99%, 위양성률 5%인 검사에서 양성 판정을 받은 사람이 실제 환자일 확률을 베이즈 정리로 구하고, 그 값이 생각보다 낮은 이유를 설명하십시오.", hint: "1만 명 중 몇 명이 양성이 나오는지 사람 수로 세어 보십시오." },
  ],
});
