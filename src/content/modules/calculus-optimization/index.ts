import { defineModule, md } from "../../kit";
import derivatives from "./derivatives";
import gradient from "./gradient";
import chainRule from "./chain-rule";
import gradientDescent from "./gradient-descent";
import gdConvergence from "./gd-convergence";

export default defineModule({
  slug: "calculus-optimization",
  track: "math",
  order: 3,
  title: "미분과 최적화",
  summary: "도함수, 편미분과 기울기, 연쇄법칙, 경사하강법",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [derivatives, gradient, chainRule, gradientDescent, gdConvergence],
  recall: [
    { prompt: "④ 경사하강법의 갱신식을 적고, 기울기의 부호와 학습률 η가 각각 무엇을 정하는지 설명하십시오.", hint: "L(w) = (w − 3)²에서 η가 너무 크면 어떤 일이 생기는지도 적어 보십시오." },
  ],
});
