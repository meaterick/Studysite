import { defineModule, md } from "../../kit";
import linearRegression from "./linear-regression";
import logisticRegression from "./logistic-regression";
import classificationMetrics from "./classification-metrics";
import rocPr from "./roc-pr";
import costThreshold from "./cost-threshold";
import lossLikelihood from "./loss-likelihood";

export default defineModule({
  slug: "linear-models",
  track: "ml",
  order: 2,
  title: "선형 모델과 평가 지표",
  summary: "선형회귀와 잔차, 로지스틱 회귀와 임계값, 분류 지표, ROC·PR 곡선과 불균형",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [linearRegression, logisticRegression, classificationMetrics, rocPr, costThreshold, lossLikelihood],
  recall: [
    { prompt: "② 정확도 99%인데도 쓸모없는 모델이 될 수 있는 경우를 숫자 예로 설명하고, Precision과 Recall이 각각 무엇을 재는지 설명하십시오.", hint: "100명 중 1명만 양성인 데이터를 예로 들어 보십시오." },
    { prompt: "④ 로지스틱 회귀가 확률을 출력하는 방식과 손실함수(교차 엔트로피)를 설명하고, 기울기 (p − y)x가 뜻하는 바를 설명하십시오.", hint: "−[y log p + (1 − y) log(1 − p)]에서 출발해 보십시오." },
  ],
});
