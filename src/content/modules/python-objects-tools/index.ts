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
학생 기록을 이름별·과목별로 바로 조회하는 기록부 클래스를 만들고, 데이터가 수만 건으로 늘어나도 조회가 느려지지 않도록 자료구조를 고른다. 작업은 Git 커밋으로 남기고, 시드와 환경을 기록해 누가 언제 실행해도 같은 결과가 나오게 한다. 이 모듈을 마치면 트랙 프로젝트 「학생 기록 정리 리포트」를 제출할 수 있으며, 이후 모델 클래스([[lesson:linear-regression]])와 실험 기록([[lesson:research-methods]])이 같은 방식을 따른다.
`,
  objectives: [
    "클래스로 상태와 동작을 묶고, fit·predict 형태의 모델 클래스를 작성한다.",
    "연산 비용을 빅오 표기로 나타내고, 리스트·딕셔너리·집합·덱 중 알맞은 자료구조를 골라 이차 시간 코드를 선형 시간으로 바꾼다.",
    "작업 폴더·스테이징 영역·저장소의 관계를 설명하고, 커밋 메시지와 .gitignore로 변경 이력을 관리한다.",
    "노트북의 숨은 상태를 피하고, 시드·환경·데이터 해시를 기록해 같은 결과를 다시 얻는다.",
  ],
  lessons: [classesObjects, complexity, gitBasics, notebooksReproducibility],
  recall: [
    { prompt: "클래스, 인스턴스, 속성, 메서드, `self`의 관계를 예제 클래스 하나로 설명하라." },
    { prompt: "리스트와 집합에서 `x in ...`의 시간복잡도를 비교하고, 반복문 안의 포함 여부 검사를 빠르게 바꾸는 방법을 쓰라." },
    { prompt: "`git add`, `git commit`, `git push`의 역할과 스테이징 영역이 필요한 이유를 설명하라." },
    { prompt: "노트북에서 셀 실행 순서 때문에 생기는 문제를 하나 들고, 제출 전에 확인할 방법을 쓰라." },
    { prompt: "같은 결과를 다시 얻기 위해 실험 결과와 함께 기록할 것 네 가지를 쓰라.", hint: "코드, 패키지, 데이터, 설정" },
  ],
  assignment,
});
