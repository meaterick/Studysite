import { defineModule, md } from "../../kit";
import gitBasics from "./git-basics";
import notebooksReproducibility from "./notebooks-reproducibility";

export default defineModule({
  slug: "git-jupyter",
  track: "devtools",
  order: 1,
  title: "Git과 Jupyter Notebook",
  summary: "Git으로 코드 변경 이력 관리하기, 노트북의 실행 순서와 숨은 상태, 시드·환경·데이터 기록으로 결과 재현하기",
  anchor: md`
작은 실험 코드를 Git 저장소로 관리한다. 관련된 변경만 골라 무엇을 왜 바꿨는지 적은 커밋으로 남기고, 비밀값과 큰 데이터는 \`.gitignore\`로 저장소 밖에 둔다. 실험은 노트북에서 실행하되, 실행 환경을 초기화한 뒤 처음부터 실행해도 같은 숫자가 나오도록 시드를 고정하고, 결과와 함께 코드 버전(커밋 해시)·패키지 버전·데이터 해시·설정을 기록한다. Python 문법과 별개인 선택 분야라서 완료 조건은 없다. Python 분야의 과제 「학생 기록 정리 리포트」의 재현 확인 단계와 캡스톤의 실험 기록([[lesson:research-methods]])이 이 방법을 쓴다.
`,
  objectives: [
    "작업 폴더·스테이징 영역·저장소의 관계를 설명하고, 커밋 메시지와 .gitignore로 변경 이력을 관리한다.",
    "노트북의 숨은 상태를 피하고, 시드·환경·데이터 해시를 기록해 같은 결과를 다시 얻는다.",
  ],
  lessons: [gitBasics, notebooksReproducibility],
  recall: [
    { prompt: "`git add`, `git commit`, `git push`의 역할과 스테이징 영역이 필요한 이유를 설명하라." },
    { prompt: "노트북에서 셀 실행 순서 때문에 생기는 문제를 하나 들고, 제출 전에 확인할 방법을 쓰라." },
    { prompt: "같은 결과를 다시 얻기 위해 실험 결과와 함께 기록할 것 네 가지를 쓰라.", hint: "코드, 패키지, 데이터, 설정" },
  ],
});
