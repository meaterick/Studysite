# 학습 콘텐츠 편집 안내

[문서 홈](../README.md) · [커리큘럼 목차](../curriculum/README.md)

경로와 명령은 저장소 루트 기준입니다. 콘텐츠 원본을 고친 뒤 `npm run docs:generate`로 커리큘럼 문서를 다시 만들고 `npm run docs:check`로 확인합니다. `docs/curriculum/`의 문서는 직접 고치지 않습니다.

## 파일 구성

모듈 하나가 폴더 하나입니다(`src/content/modules/<slug>/`). 새 모듈은 `src/content/modules/index.ts`의 `MODULE_SOURCES`에 등록합니다.

| 파일 | 작성 도우미 | 내용 |
| --- | --- | --- |
| `index.ts` | `defineModule` | `slug`, `track`, 트랙 안의 `order`, `title`, `summary`, `anchor`(목표 문제), `objectives`(학습 목표), `lessons`(핵심 → 보충 → 심화 순서), `recall`(백지 복습 3~5개), `assignment` |
| `<레슨 id>.ts` | `defineLesson` | 레슨 하나: `id`, `title`, `tier`, `concepts`(핵심 레슨), `goal`, `why`, `body`, `checks`, `exercises`, `predicts`, `descriptive`, `references` |
| `labs/<레슨 id>.ts` | `defineExercises` | 레슨의 코딩 실습 |
| `assignment.ts` | `defineAssignment` | 과제: `key`, `kind`, `summary`, `requirements`, `tasks`(셀 포함), `rubric`, `maxScore`, `autoTests`, `challenges`, `gradingNotes` |

트랙, 80개 개념과 선수관계, 16주 기본 일정, 예전 주소 대응표는 `src/content/curriculum/`에 있습니다. 개념을 다루는 레슨은 레슨의 `concepts`에 개념 id를 적어 연결합니다.

**바꾸면 안 되는 값:** 레슨 `id`, 모듈 `slug`, 문항과 실습의 `key`, 과제 `key`, 과제 셀 `id`는 저장된 학습 기록·초안·제출본과 연결됩니다. 한 번 정하면 바꾸지 않습니다.

## 레슨 작성

- **`goal`**: 레슨을 마치면 할 수 있는 것을 측정 가능한 한 문장으로 씁니다.
- **`why`**: 이 개념이 AI 시스템의 어디에 쓰이는지 한두 문장으로 씁니다. 레슨 맨 위에 표시됩니다.
- **`body`**: 이 프로젝트 전용의 가벼운 마크다운(`src/content/markdown.ts`)을 `md` 태그로 씁니다. `###` 소제목, 목록, 표, ` ```python `(브라우저에서 실행되는 코드 셀), ` ```python-colab `(실행 버튼 없는 참고 코드, 예상 시간에 넣지 않음), ` ```math `(KaTeX), `$...$` 인라인 수식, ` ```image ` 이미지, `:::info|warn|example|quote|tip|task` 콜아웃, `[[diagram:id]]` 그림, `[[lesson:id]]` 다른 레슨 참조를 지원합니다.
- **`checks`**: 객관식 확인 문제입니다. 핵심 레슨은 4개 이상, 보충·심화는 2개 이상 둡니다. `answer`는 0부터 시작하는 선택지 번호이고, `explanation`은 정답을 맞혔거나 두 번 틀린 뒤 보입니다.
- **`exercises`**: 시작 코드(`starter`)에 `TODO`를 두고, 채점 코드(`tests`)는 `@test("항목 이름")`을 붙인 함수로 씁니다. 채점 코드에서는 `approx(a, b, tol)`(배열 가능)과 `output`(학습자 코드의 출력)을 쓸 수 있고, 학습자 코드의 전역 변수를 그대로 읽습니다. 힌트는 2개 이상이며 앞에서부터 하나씩 공개됩니다. 파이썬 코드는 `py` 태그로 써서 백슬래시를 그대로 둡니다.
- **`predicts`**: 코드와 기대 출력입니다. 공백 차이는 무시하고, `alternatives`로 표기만 다른 정답을 둡니다.
- **`descriptive`**: 모범답안(`answer`, 마크다운)과 핵심 요소(`keyPoints`, 2개 이상)를 둡니다.
- **예상 학습 시간**은 본문 분량(450자/분), 코드 셀(3분), 그림(1.5분), 확인 문제(1분), 실습(8분), 출력 예측(2분), 서술형(4분)으로 계산합니다. 핵심 레슨은 45분 이하가 되도록 나눕니다.

`md`·`py`는 `String.raw`처럼 동작하므로 본문의 LaTeX는 `\frac`처럼 백슬래시 하나로 쓰고, 일반 문자열(문항, 선택지, 해설, 힌트, 핵심 요소)에서는 `\\frac`처럼 두 번 씁니다. 템플릿 안의 백틱은 `` \` ``로 씁니다.

## 문체와 용어

- **문체**: 본문, 해설, 출력 예측 해설, 서술형 모범답안은 한다체로 씁니다. 실습 문제와 힌트, 과제 안내, 채점 메시지는 합니다체로 씁니다. 서술형 질문은 "~쓰라", "~설명하라"로 끝냅니다.
- **비유와 은유를 쓰지 않습니다.** 개념은 정의, 수식, 계산 예, 실제 사례로 설명합니다. 의인화("모델이 속는다", "데이터가 산다")와 감각 표현("흐릿하다", "뭉개진다")도 정확한 동작으로 바꿉니다. 검증 스크립트가 흔한 비유·구어체(마치 ~처럼, ~해 보자, 떠올려 보자)를 경고합니다.
- **다른 레슨은 `[[lesson:id]]`로 가리킵니다.** "N주차", "「…」 단계", "핵심 과정"처럼 예전 일정과 구분을 가리키는 표현은 쓰지 않습니다. 레슨이 다른 모듈로 옮겨 가도 참조는 그대로 맞게 표시됩니다.
- **수치는 코드로 확인합니다.** 본문이나 해설에 적는 실행 결과는 그 레슨의 코드 셀이나 실습에서 실제로 나오는 값이어야 합니다. 사례와 연구 결과의 수치는 원 논문·보도와 대조합니다.
- **인용**은 "Kaplan et al. (2020)", 두 저자는 "Buolamwini와 Gebru (2018)"처럼 씁니다. 참고 자료의 `note`가 영어 자료를 가리키면 끝에 "(영문)"을 붙입니다.
- **용어**: 학습 데이터(훈련 데이터 아님), 특성(feature, 특징 아님), 특성 맵, 규제(regularization), 정규화(normalization), 기준 모델(ML baseline), 기준값(강화학습의 baseline $b$), 기울기 폭주, dead ReLU, 보상 모델, 언어 모델, 미세조정(전체 미세조정)을 씁니다. 본문에서는 attention, self-attention을 영어로 쓰고, 레슨 제목에서만 "어텐션"으로 씁니다.

## 과제

과제 항목(`tasks`)마다 설명(`instructions`, 마크다운)과 셀(`cells`: 시작 코드가 있는 `code` 셀, 안내 문구·최소 글자 수·답안 틀을 가진 `text` 셀), 구분(`tier`: 핵심은 필수이며 채점 대상, 보충·심화는 선택이며 피드백 대상)을 둡니다. 채점 기준(`rubric`)은 0.5점 단위로 배점하며 합계가 `maxScore`와 같아야 합니다. `autoTests`는 과제 작업 공간의 이름공간에서 실행하는 자기 점검이고, `challenges`는 자동 채점되는 선택 심화 문제입니다. `gradingNotes`는 운영자 채점 화면에만 보입니다.

`provideCourseDocs: true`인 과제는 작업 공간에서 학습 자료를 `/course/<모듈 slug>.md`(확장 모듈 제외)로 읽을 수 있습니다. 파일마다 모듈 제목과 레슨 제목·본문이 들어 있습니다.

## 그림

그림은 `src/components/diagrams/*.tsx`에 React 컴포넌트로 만들고 `index.tsx`의 `DIAGRAMS`에 id로 등록한 뒤, 본문에서 `[[diagram:id]]` 한 줄로 넣습니다. 캡션에도 본문과 같은 문체·용어 규칙을 적용하고, 본문 코드의 수치를 그린 그림은 코드의 실제 출력과 맞춥니다. 이미지 파일은 `public/images/`에 두고 출처(`credit`)를 적습니다.

## 검증

```bash
npm run validate:content
```

구조(id 형식·고유성, 모듈 순서, 일정표와 예전 주소 대응표), 개념(80개 개념의 연결, 선수 그래프의 순환, 기본 경로에서의 선수 순서), 레슨(목표·쓰이는 곳·본문, 문항 수와 형식, 실습·출력 예측·서술형의 형식, 참고 자료), 본문(수식, `$...$` 밖의 수식 기호, 이미지, 그림 id, 레슨 참조, 예전 일정 표현, 비유·구어체), 과제(키, 셀 id, 구분 순서, 배점 합)를 검사합니다. 오류가 있으면 빌드 전 단계에서 CI가 멈춥니다.

```bash
npm run check:labs
```

로컬 Python으로 모범 답안이 모든 채점 항목을 통과하는지, 시작 코드는 통과하지 못하는지, 채점이 너무 느리지 않은지(브라우저 시간 제한 대비), 출력 예측의 기대 출력이 실제와 같은지, 본문 코드 셀이 오류 없이 실행되는지, 과제 자동 테스트가 TODO를 채운 참조 노트북(`scripts/content/fixtures.ts`)에서는 통과하고 시작 코드에서는 실패하는지 확인합니다. 한 모듈만 검사하려면 `npx tsx scripts/content/check-labs.ts <모듈 slug>`를 씁니다.

필요한 Python 패키지는 `python -m pip install -r scripts/content/requirements.txt`로 설치합니다. 버전은 학습자의 Pyodide 환경과 맞춰 고정되어 있으므로 가상환경을 따로 만들어 쓰는 것이 좋습니다. `check:labs`는 Windows에서 `python`, 그 밖의 환경에서 `python3`을 쓰며, 환경 변수 `PYTHON`으로 가상환경의 실행 파일을 지정할 수 있습니다(예: `PYTHON=.venv/bin/python npm run check:labs`).
