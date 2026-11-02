import { defineModule, md } from "../../kit";
import sampling from "./sampling";
import summaryStatistics from "./summary-statistics";
import correlation from "./correlation";

export default defineModule({
  slug: "descriptive-statistics",
  track: "math",
  order: 5,
  title: "기술통계와 표본",
  summary: "표본과 표본편향, 요약 통계량, 공분산·상관과 인과",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [sampling, summaryStatistics, correlation],
  recall: [
  ],
});
