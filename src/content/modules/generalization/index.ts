import { defineModule, md } from "../../kit";
import biasVariance from "./bias-variance";
import regularization from "./regularization";
import crossValidation from "./cross-validation";
import biasVarianceTheory from "./bias-variance-theory";
import modelEvaluationStats from "./model-evaluation-stats";

export default defineModule({
  slug: "generalization",
  track: "ml",
  order: 3,
  title: "일반화와 검증",
  summary: "편향과 분산, 규제와 학습 곡선, 교차검증과 하이퍼파라미터 탐색",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [biasVariance, regularization, crossValidation, biasVarianceTheory, modelEvaluationStats],
  recall: [
    { prompt: "① 편향과 분산이 각각 무엇인지 설명하고, 모델이 복잡해질수록 학습 오차와 검증 오차가 어떻게 변하는지 과소적합·과적합과 연결해 설명하십시오.", hint: "정규화가 둘 중 무엇을 줄이는지도 적어 보십시오." },
  ],
});
