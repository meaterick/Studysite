import { defineModule, md } from "../../kit";
import collections from "./collections";
import indexingSlicing from "./indexing-slicing";
import mutabilityCopy from "./mutability-copy";
import functionsScope from "./functions-scope";
import comprehensionsIterators from "./comprehensions-iterators";

export default defineModule({
  slug: "python-collections-functions",
  track: "programming",
  order: 2,
  title: "컬렉션과 함수",
  summary: "리스트·튜플·딕셔너리·집합, 인덱싱과 슬라이싱, 참조와 복사, 함수, 컴프리헨션과 반복자",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [collections, indexingSlicing, mutabilityCopy, functionsScope, comprehensionsIterators],
  recall: [
  ],
});
