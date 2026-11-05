import { defineModule, md } from "../../kit";
import variablesTypes from "./variables-types";
import operators from "./operators";
import conditionals from "./conditionals";
import loops from "./loops";

export default defineModule({
  slug: "python-flow",
  track: "programming",
  order: 1,
  title: "값과 제어 흐름",
  summary: "변수와 자료형, 기본 연산, 조건문과 반복문",
  anchor: md`
주어진 문자열 점수 목록을 숫자로 바꾸고, 잘못된 값을 걸러 낸 뒤 평균·최고점·등급별 인원을 계산해 정해진 서식으로 출력하는 프로그램을 작성한다. 값과 자료형, 연산, 조건문, 반복문만으로 작성할 수 있는 프로그램이며, 이후 트랙에서 데이터를 읽고 정리하고 학습 루프를 도는 모든 코드가 이 형태를 확장한 것이다.
`,
  objectives: [
    "대입문이 이름과 객체를 연결하는 방식을 설명하고, 문자열로 들어온 값을 int·float·bool로 올바르게 변환한다.",
    "산술·문자열 연산과 연산자 우선순위를 적용해 식의 값을 계산하고, f-string으로 결과를 서식에 맞게 출력한다.",
    "비교·논리 연산과 if/elif/else로 조건 분기를 작성하고, 진릿값 규칙과 단락 평가를 설명한다.",
    "for·while 반복문과 break·continue로 누적, 탐색, 조건부 종료를 구현한다.",
  ],
  lessons: [variablesTypes, operators, conditionals, loops],
  recall: [
    { prompt: "`x = 10` 다음에 `x = x + 1`을 실행할 때 무슨 일이 일어나는지 이름과 객체라는 말을 써서 설명하라." },
    { prompt: "주어진 문자열 `\" 175.5 \"`와 `\"no\"`를 각각 계산에 쓸 실수와 불리언으로 바꾸는 방법을 쓰고, `bool(\"no\")`를 쓰면 안 되는 이유를 설명하라." },
    { prompt: "`-7 / 2`, `-7 // 2`, `-7 % 2`의 값을 쓰고, 데이터를 일정한 크기로 나눌 때 `//`와 `%`를 어디에 쓰는지 예를 들어라." },
    { prompt: "if/elif/else에서 조건의 순서가 결과를 바꾸는 예를 하나 들고, `x == 1 or 2`가 항상 참이 되는 이유를 설명하라." },
    { prompt: "최대 반복 횟수와 조기 종료 조건을 모두 갖춘 반복문의 형태를 코드로 쓰고, `break`와 `continue`의 차이를 설명하라." },
  ],
});
