import { defineModule, md } from "../../kit";
import dataCleaning from "./data-cleaning";
import visualization from "./visualization";
import eda from "./eda";
import encodingScaling from "./encoding-scaling";
import featureEngineering from "./feature-engineering";
import assignment from "./assignment";

export default defineModule({
  slug: "data-preparation",
  track: "data",
  order: 3,
  title: "정제·탐색·특성",
  summary: "결측치·이상치 처리, 시각화, 탐색적 데이터 분석, 인코딩과 스케일링, 특성 공학",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [dataCleaning, visualization, eda, encodingScaling, featureEngineering],
  recall: [
  ],
  assignment,
});
