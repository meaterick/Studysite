import { defineModule, md } from "../../kit";
import functionsComposition from "./functions-composition";
import elementaryFunctions from "./elementary-functions";
import sigmaSequences from "./sigma-sequences";

export default defineModule({
  slug: "math-functions",
  track: "math",
  order: 1,
  title: "함수와 수식 표기",
  summary: "함수와 합성, 일차·이차·지수·로그 함수, 시그마 표기와 수열",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [functionsComposition, elementaryFunctions, sigmaSequences],
  recall: [
  ],
});
