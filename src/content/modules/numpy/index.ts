import { defineModule, md } from "../../kit";
import numpyArrays from "./numpy-arrays";
import arrayIndexing from "./array-indexing";
import vectorization from "./vectorization";

export default defineModule({
  slug: "numpy",
  track: "data",
  order: 1,
  title: "NumPy 배열",
  summary: "배열의 축·형태·자료형, 인덱싱과 브로드캐스팅, 벡터화와 난수 시드",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [numpyArrays, arrayIndexing, vectorization],
  recall: [
  ],
});
