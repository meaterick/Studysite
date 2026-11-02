import { defineModule, md } from "../../kit";
import fileIo from "./file-io";
import errorsDebugging from "./errors-debugging";
import modulesEnvironments from "./modules-environments";

export default defineModule({
  slug: "python-files-errors",
  track: "programming",
  order: 3,
  title: "파일·오류·모듈",
  summary: "텍스트·CSV·JSON 파일 입출력, 오류 메시지와 예외 처리, 모듈·패키지·가상환경",
  anchor: md`
(작성 중)
`,
  objectives: [],
  lessons: [fileIo, errorsDebugging, modulesEnvironments],
  recall: [
  ],
});
