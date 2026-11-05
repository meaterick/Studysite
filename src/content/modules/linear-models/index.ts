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
면적과 역까지 거리로 집값을 예측하는 선형회귀를 최소제곱으로 학습하고, 가중치를 "거리가 같을 때 면적 1m²당 가격"으로 읽는다. 잔차 그래프에서 곡선 모양이 보이면 다항 특성을 추가하고, MAE·RMSE·$R^2$로 평균 기준 모델과 비교한다. 스팸 분류는 로지스틱 회귀로 스팸일 확률을 내고, 혼동행렬에서 정밀도와 재현율을 계산한다. 임계값을 바꿔 가며 두 지표가 반대로 움직이는 것을 확인하고, 스팸이 드문 메일함에서는 ROC-AUC와 함께 PR 곡선과 평균 정밀도로 모델을 비교한다.
`,
  objectives: [
    "다중 선형회귀의 가중치를 해석하고 최소제곱 해를 계산하며, 잔차 그래프로 모델을 진단해 다항 특성을 추가한다.",
    "MAE·MSE·RMSE·$R^2$를 계산해 평균 기준 모델과 비교하고, 평가 데이터에서 $R^2$가 음수가 되는 경우를 해석한다.",
    "로지스틱 회귀의 확률·로그 오즈·결정 경계를 설명하고, 기울기 $(p - y)x$로 학습하며, 소프트맥스 회귀로 다중 분류를 한다.",
    "혼동행렬에서 정확도·정밀도·재현율·F1·특이도를 계산하고, 오류 비용에 따라 우선할 지표와 임계값을 움직일 방향을 정한다.",
    "ROC 곡선·AUC와 PR 곡선·평균 정밀도를 계산·해석하고, 양성이 드문 데이터에서 두 지표의 차이와 불균형 데이터를 다루는 방법을 설명한다.",
  ],
  lessons: [linearRegression, logisticRegression, classificationMetrics, rocPr, costThreshold, lossLikelihood],
  recall: [
    { prompt: "선형회귀의 가중치를 해석하는 방법과 최소제곱 해의 식을 쓰고, 잔차 그래프의 곡선·깔때기 모양이 각각 무엇을 뜻하는지 쓰라. $R^2$를 기준 모델로 설명하라." },
    { prompt: "로지스틱 회귀가 확률을 내는 방식과 결정 경계를 쓰고, 이진 교차 엔트로피의 기울기 $(p - y)x$를 유도하라. 소프트맥스 회귀에서는 기울기가 어떻게 되는지도 쓰라." },
    { prompt: "정확도·정밀도·재현율·F1의 정의를 쓰고, 양성이 1%인 데이터에서 정확도만 보면 안 되는 이유와 임계값을 낮출 때 정밀도·재현율이 어떻게 바뀌는지 쓰라." },
    { prompt: "AUC를 순위 확률로 설명하고, 양성이 드문 데이터에서 ROC-AUC와 평균 정밀도가 다르게 반응하는 이유를 TPR·FPR·정밀도의 분모로 설명하라." },
  ],
});
