# 학습 콘텐츠 편집 안내

[문서 홈](../README.md) · [전체 커리큘럼](../curriculum/README.md)

경로와 명령은 저장소 루트 기준입니다. 콘텐츠 원본을 고친 뒤 `npm run docs:generate`로 목차를 갱신하고 `npm run docs:check`로 확인합니다. 생성된 목차는 직접 수정하지 않습니다.

로컬 실습 검증에 필요한 Python 패키지는 `python -m pip install -r scripts/content/requirements.txt`로 준비합니다. `check:labs`는 Windows에서 `python`, 그 외 환경에서 `python3`를 사용하며, 환경 변수 `PYTHON`으로 가상환경의 실행 파일을 지정할 수 있습니다.

## 콘텐츠 수정하기

- 주차별 자료: `src/content/weeks/week{1..8}.ts`: 각 파일이 `WeekMeta` 객체
  하나를 export합니다. `conceptsMd`(학습 자료)는 이 프로젝트 전용의 가벼운 마크다운으로 씁니다.
  파서는 `src/content/markdown.ts`입니다.
  - `## 제목 {#section-id}` 하나가 **단계 하나**입니다. 첫 `##` 앞의 글은 주차 소개(개요 페이지)로 쓰입니다.
    단계 id는 진도 저장 키이므로 한 번 정하면 바꾸지 마십시오.
  - 단계 안의 `[[practice]]` 한 줄이 학습과 실습의 경계입니다. 그 아래가 "실습"으로 표시됩니다.
  - 그 밖에 `###` 소제목, 목록, 표, ` ```python `(브라우저에서 실행되는 코드 셀, Pyodide),
    ` ```python-colab `(실행 버튼 없는 참고 코드, Colab 등 외부 환경용), ` ```math `(KaTeX), `$...$` 인라인 수식,
    `:::info|warn|example|quote|tip|task` 콜아웃, `[[diagram:id]]` 다이어그램, ` ```image ` 이미지,
    `**굵게**`, `*기울임*`, `` `코드` ``, `[링크](https://...)`를 지원합니다. `####` 제목과 콜아웃 안의 코드블록은 지원하지 않습니다.
- 단계 메타데이터: `src/content/sections/week{1..8}.ts`: 단계 id마다 구분(`tier`: `core`·`supplement`·`advanced`), 학습 목표(`goal`),
  객관식 확인 문제(`checks`, `answer`는 0부터 시작하는 선택지 번호), 이 단계에 배정할 서술형 문항 id
  (`quizIds`, 주차의 `quiz` 배열에서 각 문항은 정확히 한 단계에만), 참고 자료(`references`, https)를 둡니다.
- 서술형 모범답안과 과제 채점 모범 방향: `src/content/quizAnswers.ts` (모범답안은 단계에서 답을 저장한 뒤에 공개됩니다)
- 과제 명세: `src/content/assignments/week{1..8}.ts`의 `AssignmentSpec`. 과제 항목(`tasks`)마다 설명(`instructions`, 마크다운)과
  셀 목록(`cells`: 시작 코드가 있는 `code` 셀, 안내 문구·최소 글자 수·답안 틀을 가진 `text` 셀), 구분(`tier`: `core`는 필수,
  `supplement`·`advanced`는 선택, 핵심 → 보충 → 심화 순서)을 두고, 채점 기준(`rubric`, 0.5점 단위 배점, 핵심 항목을 기준으로 작성)을 정의합니다. 배점 합계는 주차의 `assignmentMaxScore`와 같아야 합니다.
  `provideCourseDocs: true`이면 작업 공간의 가상 파일 시스템에 학습 자료가 `/course/week1.md` … `/course/week8.md`로 제공됩니다.
  셀 id는 저장된 초안·제출본과 연결되므로 한 번 정하면 바꾸지 마십시오. 시작 코드는 앞 셀에서 만든 변수를 이어서 쓸 수 있습니다.
- 코딩 실습·퀴즈·과제 보조 자료: `src/content/labs/week{1..8}.ts`의 `WeekLab`(타입은 `src/content/types.ts`).
  - `exercises`: TODO 실습. `id`(`w<주차>-` 접두사, 진도 저장 키라 바꾸지 마십시오), `sectionId`(표시할 단계), `tier`(핵심·보충·심화),
    `prompt`(마크다운), `starter`(`TODO`가 들어 있어야 함), `tests`(채점 코드), `hints`(2개 이상, 순서대로 공개), `solution`.
    채점 코드는 `@test("항목 이름")`을 붙인 함수를 정의하면 바로 실행되고, `assert` 실패 메시지가 화면에 표시됩니다.
    `approx(a, b, tol)`(배열 가능)과 `output`(학습자 코드의 출력)을 쓸 수 있고, 학습자 코드의 전역 변수를 그대로 읽습니다.
    Python 코드는 `py` 태그(`src/content/labs/util.ts`)로 써서 백슬래시를 그대로 둡니다.
  - `quiz`: 문항마다 `tier`. `choice`(객관식), `predict`(코드와 기대 출력, 공백 차이는 `normalizeOutput`으로 무시, `alternatives`로 복수 정답), `descriptive`(모범답안·핵심 요소).
  - `assignment`: `requirements`(과제 페이지 상단 요약), `autoTests`(과제 작업 공간의 이름공간에서 실행하는 자동 테스트, `taskId`로 과제 항목에 연결),
    `challenges`(과제 페이지의 심화 문제, 실습과 같은 형식, `tier: "advanced"`).
  - 채점 프로그램 생성은 `src/lib/labHarness.ts`, 기록은 `src/lib/labActions.ts`(서버 액션, 학습 기록의 `labs`)에 있습니다.
- 커리큘럼 총괄: `src/content/syllabus.ts`, 운영자 전용 문서: `src/content/operator/*.ts`
- 다이어그램: `src/components/diagrams/*.tsx` (주차별 파일 + `index.tsx`의
  `DIAGRAMS` 레지스트리에 id로 등록). 새 다이어그램을 추가하면 콘텐츠에서
  `[[diagram:my-id]]` 한 줄로 삽입할 수 있습니다.
- 수정한 뒤에는 `npm run validate:content`를 실행하십시오. 단계 id와 메타데이터의 1:1 대응,
  확인 문제의 정답 범위, 서술형 배정 누락·중복, 과제 명세(id 중복, 배점 합계, 답안 틀과 최소 글자 수), 수식 문법, 날것 유니코드 수식,
  코딩 실습의 형식(id 형식·중복, 단계·과제 항목 연결, 시작 코드의 `TODO`, 채점 항목, 힌트 수), 단계 구분(모든 단계의 `tier`, 본문의
  핵심 → 보충 → 심화 순서, 구분별 실습·퀴즈 유무, 과제 항목 순서) 등을 검사합니다.
- 코딩 실습을 고쳤다면 `npm run check:labs`(한 주차만: `npx tsx scripts/content/check-labs.ts week-3`)도 실행하십시오. 로컬 `python3`
  (numpy, pandas, scikit-learn, matplotlib 필요)로 모범 답안이 모든 항목을 통과하는지, 시작 코드는 통과하지 못하는지,
  채점이 너무 느리지 않은지(브라우저 시간 제한 대비), 출력 예측 문항의 기대 출력이 실제와 같은지, 과제 자동 테스트가
  TODO를 채운 참조 노트북(`scripts/content/fixtures.ts`)에서는 통과하고 시작 코드에서는 실패하는지 확인합니다.
