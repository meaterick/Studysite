import { defineModule, md } from "../../kit";
import initialization from "./initialization";
import normalizationLayers from "./normalization-layers";
import dropoutResidual from "./dropout-residual";
import transferLearning from "./transfer-learning";
import pytorch from "./pytorch";
import pytorchPractice from "./pytorch-practice";
import trainingSchedules from "./training-schedules";
import gradientFlow from "./gradient-flow";

export default defineModule({
  slug: "deep-training",
  track: "dl",
  order: 2,
  title: "깊은 신경망 학습 기법",
  summary: "가중치 초기화와 정규화 층, 드롭아웃과 잔차 연결, 전이학습, PyTorch 학습 루프",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [initialization, normalizationLayers, dropoutResidual, transferLearning, pytorch, pytorchPractice, trainingSchedules, gradientFlow],
  recall: [
    { prompt: "⑤ 층이 깊어질수록 기울기가 사라지거나 폭발하는 이유를 설명하고, 가중치 초기화(Xavier·He)가 이를 어떻게 막는지 설명하십시오.", hint: "층마다 곱해지는 배율이 1보다 작거나 클 때를 비교해 보십시오." },
    { prompt: "④ ResNet의 잔차 연결 y = F(x) + x가 깊은 신경망의 학습을 돕는 이유를 기울기로 설명하십시오.", hint: "dy/dx = F′(x) + 1에서 +1의 의미를 적어 보십시오." },
    { prompt: "⑤ BatchNorm, Dropout, 데이터 증강이 각각 어떤 문제를 해결하는지 설명하고, 학습 때와 평가 때 동작이 어떻게 다른지 설명하십시오.", hint: "model.eval()을 호출하지 않으면 생기는 일을 적어 보십시오." },
  ],
});
