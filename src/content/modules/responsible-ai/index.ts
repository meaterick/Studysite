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
(작성 중)
`,
  objectives: [],
  lessons: [riskMap, fairness, privacy, biasMitigation, fairnessImpossibility, privacyMath, adversarialExamples],
  recall: [
    { prompt: "① 적대적 공격 FGSM이 같은 크기의 무작위 잡음보다 훨씬 효과적인 이유를 설명하십시오.", hint: "x′ = x + ε·sign(∇ₓJ)에서 모든 성분이 어느 방향으로 움직이는지 적어 보십시오." },
    { prompt: "② 인구통계 동등성, 균등화된 오즈, 보정을 각각 정의하고, 기저율이 다른 두 집단에서 이들을 동시에 만족시키기 어려운 이유를 설명하십시오.", hint: "기저율 50%와 20%인 채용 예제의 숫자를 이용해 보십시오." },
    { prompt: "④ 데이터 드리프트와 개념 드리프트의 차이를 설명하고, PSI가 감지할 수 있는 것과 없는 것을 설명하십시오.", hint: "사기 탐지 모델을 예로 들어 보십시오." },
  ],
});
