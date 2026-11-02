import { defineModule, md } from "../../kit";
import classesObjects from "./classes-objects";
import complexity from "./complexity";
import gitBasics from "./git-basics";
import notebooksReproducibility from "./notebooks-reproducibility";
import assignment from "./assignment";

export default defineModule({
  slug: "python-objects-tools",
  track: "programming",
  order: 4,
  title: "객체·효율·개발 도구",
  summary: "클래스와 객체, 자료구조와 시간복잡도, Git, 노트북과 재현 가능한 실행",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [classesObjects, complexity, gitBasics, notebooksReproducibility],
  recall: [
  ],
  assignment,
});
