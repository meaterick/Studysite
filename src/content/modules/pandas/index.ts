import { defineModule, md } from "../../kit";
import dataframes from "./dataframes";
import pandasSelection from "./pandas-selection";
import pandasAggregation from "./pandas-aggregation";
import dataTypes from "./data-types";

export default defineModule({
  slug: "pandas",
  track: "data",
  order: 2,
  title: "pandas 표 데이터",
  summary: "Series와 DataFrame, 조회·필터링·정렬, 그룹 집계와 결합, 자료 유형",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [dataframes, pandasSelection, pandasAggregation, dataTypes],
  recall: [
  ],
});
