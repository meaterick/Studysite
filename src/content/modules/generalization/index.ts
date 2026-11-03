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
  summary: "편향과 분산, 규제·조기 종료·학습 곡선, 교차검증과 하이퍼파라미터 탐색",
  anchor: md`
샘플 30개로 사인 곡선을 학습한 12차 다항식이 학습 오차는 0.009인데 검증 오차는 45를 넘는다. 학습 오차와 검증 오차를 비교해 과적합으로 진단하고, 학습 데이터를 바꿔 반복 학습한 시뮬레이션으로 오차의 대부분이 분산이라는 것을 확인한다. Ridge 규제의 세기와 경사하강법의 반복 횟수를 검증 오차로 고르고, 학습 곡선으로 데이터를 더 모으면 나아지는지 판단한다. 마지막으로 전처리를 넣은 파이프라인을 K-Fold로 교차검증하며 하이퍼파라미터를 탐색하고, 고른 모델은 떼어 둔 테스트 데이터로 한 번 평가한다.
`,
  objectives: [
    "학습 오차와 검증 오차로 과적합과 과소적합을 진단하고, 반복 학습한 예측에서 편향의 제곱과 분산을 계산한다.",
    "L1·L2 규제가 가중치를 줄이는 방식의 차이를 설명하고, 규제 세기와 조기 종료 시점을 검증 오차로 고른다.",
    "학습 곡선으로 데이터를 더 모을지 모델을 바꿀지 판단한다.",
    "K-Fold·층화·그룹·시계열 교차검증을 데이터 구조에 맞게 고르고, 파이프라인을 교차검증한다.",
    "GridSearchCV·RandomizedSearchCV로 하이퍼파라미터를 고르고, best_score_가 낙관적인 이유와 최종 성능을 재는 방법을 설명한다.",
  ],
  lessons: [biasVariance, regularization, crossValidation, biasVarianceTheory, modelEvaluationStats],
  recall: [
    { prompt: "편향과 분산을 학습 데이터를 바꿔 반복 학습한 예측으로 정의하고, 복잡도를 높일 때 학습 오차와 검증 오차가 어떻게 바뀌는지 과소적합·과적합과 연결해 쓰라." },
    { prompt: "L1 규제와 L2 규제가 가중치를 줄이는 방식의 차이를 규제항의 기울기로 쓰고, 조기 종료가 무엇을 기준으로 어느 시점의 파라미터를 남기는지 쓰라." },
    { prompt: "학습 곡선에서 분산이 큰 모델과 편향이 큰 모델이 어떻게 다르게 보이는지 쓰고, 각각 데이터를 더 모으는 것이 도움이 되는지 쓰라." },
    { prompt: "K-Fold 교차검증의 절차와 fold 점수의 표준편차를 신뢰구간으로 보면 안 되는 이유를 쓰고, GroupKFold와 TimeSeriesSplit이 필요한 경우를 하나씩 쓰라." },
    { prompt: "GridSearchCV가 하는 일과 best_score_가 실제 성능보다 낙관적인 이유를 쓰고, 고른 모델의 성능을 보고하는 방법 두 가지를 쓰라." },
  ],
});
