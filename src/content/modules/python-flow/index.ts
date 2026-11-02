import { defineModule, md } from "../../kit";
import variablesTypes from "./variables-types";
import operators from "./operators";
import conditionals from "./conditionals";
import loops from "./loops";

export default defineModule({
  slug: "python-flow",
  track: "programming",
  order: 1,
  title: "값과 제어 흐름",
  summary: "변수와 자료형, 기본 연산, 조건문과 반복문",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [variablesTypes, operators, conditionals, loops],
  recall: [
  ],
});
