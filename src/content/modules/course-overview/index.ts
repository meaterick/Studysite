import { defineModule, md } from "../../kit";
import aiLandscape from "./ai-landscape";
import endToEndDemo from "./end-to-end-demo";

export default defineModule({
  slug: "course-overview",
  track: "intro",
  order: 1,
  title: "AI 시스템 개요",
  summary: "AI·머신러닝·딥러닝·생성형 AI의 관계와, 데이터에서 예측·생성까지의 전체 처리 과정",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [aiLandscape, endToEndDemo],
  recall: [
  ],
});
