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
설문 응답 CSV 파일을 읽어 잘못된 줄은 건너뛰고 몇 줄을 건너뛰었는지 기록한 뒤, 문항별 요약 통계를 JSON 파일로 저장하는 스크립트를 작성한다. 자주 쓰는 함수는 모듈 파일로 나누고, 같은 패키지 버전으로 다른 컴퓨터에서도 실행할 수 있도록 의존성을 기록한다. 데이터 파일을 다루는 이후의 모든 코드([[lesson:dataframes]], [[lesson:data-cleaning]])가 이 흐름을 따른다.
`,
  objectives: [
    "with와 open으로 텍스트 파일을 읽고 쓰며, csv·json 모듈로 표와 중첩 데이터를 저장하고 다시 읽는다.",
    "트레이스백에서 예외의 종류와 위치를 읽고, 예상한 예외만 try/except로 처리하며, 잘못된 입력에는 예외를 일으킨다.",
    "최소 재현과 중간 값 확인으로 버그의 원인을 좁힌다.",
    "import 규칙과 모듈 검색 순서를 설명하고, 가상환경과 requirements.txt로 의존성을 격리·기록·재설치한다.",
  ],
  lessons: [fileIo, errorsDebugging, modulesEnvironments],
  recall: [
    { prompt: "파일 열기 모드 `r`, `w`, `a`의 차이를 쓰고, 파일을 `with`로 여는 이유를 설명하라." },
    { prompt: "CSV와 JSON에 같은 데이터를 저장했다가 다시 읽을 때 각각 무엇이 달라지는지(자료형, 키, 튜플) 설명하라." },
    { prompt: "트레이스백을 읽는 순서를 쓰고, 오류가 난 줄과 원인이 생긴 곳이 다를 수 있는 예를 들어라." },
    { prompt: "`except:`로 모든 예외를 잡으면 안 되는 이유와, `assert`와 `raise`를 각각 어디에 쓰는지 설명하라." },
    { prompt: "가상환경을 만들고 패키지를 설치한 뒤 다른 사람이 같은 환경을 만들 수 있게 하기까지의 명령을 순서대로 쓰라.", hint: "만들기, 켜기, 설치, 기록, 다시 설치" },
  ],
});
