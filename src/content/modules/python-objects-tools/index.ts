import { defineModule, md } from "../../kit";
import classesObjects from "./classes-objects";
import complexity from "./complexity";
import assignment from "./assignment";

export default defineModule({
  slug: "python-objects-tools",
  track: "programming",
  order: 4,
  title: "클래스와 시간복잡도",
  summary: "클래스와 객체, 자료구조와 시간복잡도",
  anchor: md`
학생 기록을 이름별·과목별로 바로 조회하는 기록부 클래스를 만들고, 데이터가 수만 건으로 늘어나도 조회가 느려지지 않도록 자료구조를 고른다. 이 모듈을 마치면 트랙 프로젝트 「학생 기록 정리 리포트」를 제출할 수 있으며, 이후 모델 클래스([[lesson:linear-regression]])와 자동미분 엔진([[lesson:micrograd]])이 같은 방식을 따른다. 과제의 마지막 단계에서 쓰는 시드 고정과 재현 확인은 선택 분야 레슨 [[lesson:notebooks-reproducibility]]에서 더 자세히 다룬다.
`,
  objectives: [
    "클래스로 상태와 동작을 묶고, fit·predict 형태의 모델 클래스를 작성한다.",
    "연산 비용을 빅오 표기로 나타내고, 리스트·딕셔너리·집합·덱 중 알맞은 자료구조를 골라 이차 시간 코드를 선형 시간으로 바꾼다.",
  ],
  lessons: [classesObjects, complexity],
  recall: [
    { prompt: "클래스, 인스턴스, 속성, 메서드, `self`의 관계를 예제 클래스 하나로 설명하라." },
    { prompt: "리스트와 집합에서 `x in ...`의 시간복잡도를 비교하고, 반복문 안의 포함 여부 검사를 빠르게 바꾸는 방법을 쓰라." },
    { prompt: "`fit`과 `predict` 메서드를 가진 모델 클래스의 형태를 코드로 쓰고, 학습한 값을 지역 변수가 아니라 `self`의 속성에 저장해야 하는 이유를 설명하라.", hint: "fit이 끝난 뒤에도 predict가 그 값을 읽어야 한다." },
  ],
  assignment,
});
