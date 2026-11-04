import { defineModule, md } from "../../kit";
import riskMap from "./risk-map";
import fairness from "./fairness";
import privacy from "./privacy";
import biasMitigation from "./bias-mitigation";
import fairnessImpossibility from "./fairness-impossibility";
import privacyMath from "./privacy-math";
import adversarialExamples from "./adversarial-examples";

export default defineModule({
  slug: "responsible-ai",
  track: "extension",
  order: 1,
  title: "책임 있는 AI",
  summary: "AI 위험, 공정성 기준, 프라이버시 공학, 편향 완화, 적대적 예제",
  anchor: md`
캡스톤의 위험 점검표는 영역마다 확인할 질문만 정리한다. 이 모듈은 그 영역의 원리와 측정 방법을 다룬다. 평균 손실을 최소화한 모델이 소수 집단에서 더 많이 틀리는 이유를 실험으로 확인하고, 인구통계 동등성, 균등화된 오즈, 보정을 계산해 기저율이 다른 집단에서 기준끼리 충돌하는 것을 보인다. 재가중, 공정성 벌점, 집단별 임계값으로 격차를 줄이고 그 대가를 측정하며, 이름을 지운 데이터가 다시 특정되는 원리와 k-익명성, 차등 프라이버시의 보장을 비교한다. 심화 레슨에서는 공정성 불가능성 정리와 라플라스 메커니즘을 증명하고, DP-SGD와 적대적 예제(FGSM)를 구현한다. 확장 모듈이므로 완료 조건은 없으며, 캡스톤 과제의 보충·심화 항목이 이 모듈의 레슨을 바탕으로 한다.
`,
  objectives: [
    "AI 위험의 일곱 영역을 사례와 연결하고, 서브그룹 불균형이 평균 손실 최소화를 거쳐 집단별 성능 격차로 나타나는 과정을 설명한다.",
    "인구통계 동등성, 균등화된 오즈, 보정을 계산하고, 기저율이 다를 때 어떤 기준끼리 충돌하는지 보인다.",
    "재가중, 공정성 벌점, 집단별 임계값을 적용해 격차와 정확도의 변화를 측정하고, 대리 변수와 법적 제약을 고려해 방법을 고른다.",
    "준식별자로 재식별 위험을 재고, k-익명성과 차등 프라이버시가 보장하는 것과 그 대가를 비교한다.",
    "Chouldechova 항등식과 보정·균형의 충돌, 라플라스 메커니즘의 보장과 멤버십 추론 이득의 상한을 증명한다.",
    "FGSM과 적대적 학습을 구현하고, 선형성 가설로 고차원 입력의 취약성을 설명한다.",
  ],
  lessons: [riskMap, fairness, privacy, biasMitigation, fairnessImpossibility, privacyMath, adversarialExamples],
  recall: [
    { prompt: "평균 손실을 최소화한 모델이 소수 집단에서 더 많이 틀리는 이유를 쓰고, FGSM이 같은 크기의 무작위 잡음보다 예측을 훨씬 크게 바꾸는 이유를 쓰라." },
    { prompt: "인구통계 동등성, 균등화된 오즈, 보정을 정의하고, 기저율이 50%와 20%인 두 집단에서 TPR 80%, FPR 20%를 맞추면 선택률과 PPV가 각각 얼마인지 계산하라." },
    { prompt: "보호 속성을 입력에서 빼는 것만으로 편향이 사라지지 않는 이유를 쓰고, 재가중, 공정성 벌점, 집단별 임계값의 대가를 하나씩 쓰라." },
    { prompt: "이름을 지운 데이터가 다시 특정되는 이유를 준식별자로 쓰고, k-익명성과 $\\varepsilon$-차등 프라이버시가 각각 무엇을 보장하는지 쓰라." },
  ],
});
