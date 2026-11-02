import { defineModule, md } from "../../kit";
import generativeModels from "./generative-models";
import detectionSegmentation from "./detection-segmentation";
import multimodal from "./multimodal";
import generativeMath from "./generative-math";

export default defineModule({
  slug: "vision-generative",
  track: "extension",
  order: 2,
  title: "비전과 생성 모델",
  summary: "생성 모델, 탐지·분할 평가, 멀티모달 모델",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [generativeModels, detectionSegmentation, multimodal, generativeMath],
  recall: [
  ],
});
