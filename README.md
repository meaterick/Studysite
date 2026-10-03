# Aegis AI 스터디 「AI 기초부터 활용까지」

Aegis 동아리의 8주 AI 스터디를 위한 학습 사이트입니다. 세계 최상위 대학 강의(Stanford
CS229/CS231n/CS224n/CS336, MIT 6.S191, Berkeley CS188 등)의 구조를 참고해 설계한
커리큘럼과, 단계 단위로 나뉜 학습 자료·실습·확인 문제, 직접 코드를 채우고 자동 채점받는 TODO 코딩 실습,
객관식·코드 출력 예측·서술형 퀴즈, 백지공부, 사이트 안에서 작성·실행·제출하고 운영자가 채점하는 과제를 제공합니다.

Next.js(App Router, TypeScript) + Tailwind CSS로 만들어졌고, 콘텐츠는 마크다운
문자열 + 커스텀 SVG 다이어그램으로 구성되어 있어 코드를 조금만 알아도 내용을
고치고 늘릴 수 있습니다.

## 로컬에서 실행하기

```bash
npm install
npm run dev       # http://localhost:3000
```

프로덕션 빌드 확인:

```bash
npm run build
npm run start
```

## 사이트 구조

| 경로 | 내용 |
| --- | --- |
| `/` | 소개, 4부 로드맵, 주차별 진행률 |
| `/curriculum` | 8주 커리큘럼 총괄(시러버스) |
| `/weeks/[slug]` | 주차 개요: 학습 목표, 함께 보면 좋은 자료, 핵심·보충·심화 과정별 단계 목록과 잠금 상태, 보충·심화 기록(심화 달성), 백지공부·과제 카드 |
| `/weeks/[slug]/sections/[sectionId]` | 단계 학습: **학습 → 실습 → 확인 문제(객관식 서버 채점, 서술형 자기평가는 선택) → 완료** |
| `/weeks/[slug]/continue` | 지금 할 차례인 핵심 단계(또는 백지공부·과제)로 이동 |
| `/weeks/[slug]/worksheet` | 백지공부: 핵심 단계를 마치면 열림, 제출 후 비교 자료 공개 |
| `/weeks/[slug]/lab` | 코딩 실습: 핵심·보충·심화별 TODO 실습(문제 설명·시작 코드·실행·자동 채점·단계별 힌트·초기화·조건부 모범 답안). 같은 실습이 해당 단계 페이지의 "TODO 실습"에도 표시됩니다 |
| `/weeks/[slug]/drill` | 퀴즈(핵심·보충·심화별): 객관식(서버 채점·해설), 코드 출력 예측(공백 차이 무시, 정답 공개 후 직접 실행), 서술형(모범답안·핵심 요소 자기 점검) |
| `/weeks/[slug]/assignment` | 과제: 핵심 단계를 마치면 열림. 과제 항목은 핵심(필수)·보충·심화(선택)로 나뉨. 요구사항 요약, 작업 공간(코드 셀 실행·답안 작성·자동 저장), 자동 테스트(브라우저 실행, 채점과 무관한 자기 점검), 채점 기준(루브릭), 심화 문제(자동 채점), 제출·채점 결과·제출 기록 |
| `/weeks/[slug]/quiz` | 복습 노트: 틀린 확인 문제와 "보완이 필요합니다"로 표시한 서술형 답 |
| `/progress` | 진도 대시보드: 오늘 할 일·예상 소요시간·가장 가까운 마감·새 피드백·복습할 개념·이어서 학습을 먼저 보여 주고, 핵심 학습 진행률·실습 완료율·과제 상태·피드백 확인과 보충·심화 기록(주차별 심화 달성)을 따로 표시 |
| `/feedback` | 피드백함: 채점 결과·과제별 코멘트·재제출 요청·운영자 채팅·틀린 확인 문제·보완 필요 서술형/백지공부를 한곳에 모음(마지막 확인 이후 새 항목 표시, 헤더 배지) |
| `/login`, `/account` | Google 로그인·내 계정(탈퇴) |
| `/operator/submissions` | 관리자: 과제 제출 목록(필터·정렬), 답변을 기다리는 질문, 제출본 재실행·채점 기준별 채점·과제별 코멘트·재제출 요청 |
| `/chat` | 운영자 채팅: 과제와 상관없이 운영자와 실시간으로 메시지를 주고받음(Enter로 보내기, Shift+Enter 줄바꿈) |
| `/operator/chat`, `/operator/chat/[userId]` | 관리자: 스터디원별 채팅 목록과 대화(실시간). 채점 화면에도 같은 대화가 함께 표시됩니다. 확인 창을 거쳐 스터디원 한 명과의 대화 전체(“대화 전체 삭제”) 또는 모든 채팅(“모든 채팅 삭제”)을 지울 수 있습니다(되돌릴 수 없음) |
| `/operator/settings` | 관리자: 단계 진행 방식(미완료 경고(기본) / 잠금)과 주차별 과제 마감일 |
| `/operator/*` | 관리자: 운영 가이드, 문항별 정답·해설, 품질 로그, 스터디원 관리(주차별 진도·백지공부·약한 서술형 답) |

### 학습 흐름

1. 주차는 여러 단계로 나뉘고, 단계마다 구분이 있습니다(`src/content/tiers.ts`).
   - **핵심(초심자)**: 이번 주를 끝내는 데 꼭 필요한 개념. **핵심 단계만 마치면 주차 학습이 완료**되고 백지공부·과제가 열립니다.
   - **보충(중급자)**: 핵심을 실무 도구·다른 방법으로 넓히는 선택 과정. 보충 기록만 남습니다.
   - **심화(전문가)**: 수식 유도·최신 기법·연구 수준의 선택 과정. 심화 단계·심화 실습·과제 심화 문제를 모두 마치면 그 주의 **심화 달성**이 별도로 표시됩니다(`src/lib/achievement.ts`).
   본문은 핵심 → 보충 → 심화 순서로 배치하고, 단계 번호는 구분 안에서 매깁니다("핵심 3", "심화 1"). 기본 진행 방식은 **미완료 경고**라 순서를 안내만 하고, 앞 단계를 끝내지 않아도 다음 단계·백지공부·과제로 넘어갈 수 있으며 끝내지 않은 단계가 있다는 경고를 보여 줍니다. 운영 설정에서 **잠금**으로 바꾸면 핵심 단계를 하나 끝내야 다음 핵심 단계가 열리고, 보충·심화 단계는 핵심 단계를 모두 마치면 열립니다(`src/lib/settingsStore.ts`).
2. 단계 완료 조건: 객관식 확인 문제 전부 정답. 서술형 문항(직접 쓰고 모범답안과 비교해 자기평가)과 실습은 권장 활동이며 완료 조건에 들어가지 않습니다.
3. 핵심 단계를 마친 뒤 백지공부와 과제로 마무리합니다(잠금 모드에서는 핵심 단계를 모두 마쳐야 열림). 실습 끝의 "실습을 마쳤습니다" 표시는 완료 조건이 아니고 실습 완료율에만 쓰입니다.
4. 과제는 과제 탭의 작업 공간에서 진행합니다. 코드 셀은 과제마다 하나의 Python 이름공간을 공유하며(Pyodide, 브라우저 실행),
   matplotlib 그림은 출력에 PNG로 저장됩니다. 작성 내용은 서버에 자동 저장되고(1.5초 지연, Ctrl+S 즉시 저장),
   제출하면 그 시점의 작업 공간이 제출본(`notebook-v<N>.json`)으로 보관됩니다. 메모·링크·첨부 파일은 선택입니다.
5. 운영자는 제출본을 빈 실행 환경에서 처음부터 다시 실행해 재현성을 확인하고, 채점 기준별 점수(0.5점 단위)의 합으로 채점하며,
   과제별 코멘트와 전체 피드백을 남기거나 재제출을 요청합니다. 스터디원과의 메시지는 채팅(`/chat`, `/operator/chat`)으로 주고받으며, 새 메시지는 서버 이벤트 스트림(SSE, `/api/chat/stream`)으로 곧바로 전달됩니다.
6. 관리자는 잠금과 관계없이 모든 단계와 과제를 열람할 수 있습니다. 주차 난이도는 별점 대신 쉬움·보통·어려움으로 표시합니다(`src/lib/difficulty.ts`).
7. 학습 자료 속 코드 셀은 **완성 예제**(그대로 실행해 보는 코드)이고, 코딩 실습은 시작 코드의 `TODO`를 직접 채우는 **TODO 실습**입니다.
   실습의 **실행**은 자기 코드만 돌리고, **채점**은 빈 이름공간에서 자기 코드를 실행한 뒤 채점 코드(`@test` 항목들)를 이어서 실행해 항목별 통과 여부를 보여 줍니다.
   모든 코드는 브라우저의 Pyodide 워커에서만 실행되며 서버로 보내지지 않습니다. 30초가 넘으면 실행을 멈추고 워커를 다시 시작합니다.
   힌트는 한 단계씩 열리고, 모범 답안은 모든 항목을 통과했거나 힌트를 모두 본 뒤 한 번 이상 채점했을 때만 서버에서 받아 옵니다.
   코딩 실습과 퀴즈도 핵심·보충·심화로 나뉘며, 권장 활동이라 단계 완료 조건에 들어가지 않습니다. 진행 상황은 주차 개요의 "직접 풀어 보기" 카드와 보충·심화 기록에 표시됩니다.

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
- 코딩 실습을 고쳤다면 `npm run check:labs`(한 주차만: `npx tsx scripts/check-labs.ts week-3`)도 실행하십시오. 로컬 `python3`
  (numpy, pandas, scikit-learn, matplotlib 필요)로 모범 답안이 모든 항목을 통과하는지, 시작 코드는 통과하지 못하는지,
  채점이 너무 느리지 않은지(브라우저 시간 제한 대비), 출력 예측 문항의 기대 출력이 실제와 같은지, 과제 자동 테스트가
  TODO를 채운 참조 노트북(`scripts/lab-fixtures.ts`)에서는 통과하고 시작 코드에서는 실패하는지 확인합니다.

## 로그인·관리자 구역

별도 회원가입 화면은 없습니다. Google 로그인 시 Google이 확인한 이메일과 사용자 식별자를
서버 DB(`DATA_DIR/aegis.db`, 아래 "데이터 저장소" 참고)에 저장하며, 처음 로그인한
사용자의 스터디원 계정을 자동 생성합니다. 이메일·비밀번호 로그인은 제공하지 않습니다.
세션은 서명된(JWT, `SESSION_SECRET`) httpOnly 쿠키로 관리합니다
(`src/lib/session.ts`, `src/lib/dal.ts`).

- 누구나 `/login`에서 Google 계정으로 로그인할 수 있고, **가장 먼저 로그인하는 계정이 자동으로
  관리자**가 됩니다 — 배포 직후 운영자 본인이 제일 먼저 로그인하면 됩니다.
  (`ADMIN_EMAILS` 환경변수로 운영자 이메일을 지정할 수도 있습니다.)
- 로그인하지 않은 방문자는 메인 화면, `/curriculum`, `/weeks`(주차 목록)까지만 볼 수 있습니다. 주차 페이지·단계·과제·
  진도·채팅과 주차별 이미지는 로그인이 필요하며, 목록에서 이런 자료를 누르면 로그인 후 그 페이지로 돌아오도록
  로그인 화면으로 보냅니다(`src/proxy.ts`, `src/lib/returnPath.ts`의 `gatedHref`).
- `/operator/*`(운영 가이드, 퀴즈 정답, 품질 로그, 스터디원 관리)는 관리자
  역할(role)로만 접근할 수 있습니다(`src/proxy.ts`에서 1차 확인, 각 페이지에서
  `requireAdmin()`으로 재확인). 이 폴더의 내용(퀴즈 정답, 채점 기준 원본,
  운영 노하우)은 스터디원에게 공개하지 않는 것이 원칙입니다.
- `/account`에서 본인 정보를 확인하고 확인 창을 거쳐 회원 탈퇴(계정 삭제)를 할 수
  있습니다. 마지막 남은 관리자 계정은 탈퇴/강등할 수 없습니다.
- `/operator/members`에서 관리자가 가입자 목록을 보고 권한을 부여/회수하거나
  계정을 삭제할 수 있습니다.
- `/operator/system`에서 DB·디스크·메모리 상태, 백업 목록(내려받기·지금 백업), 최근 서버 오류를 볼 수 있습니다.

## 배포 (OCI + self-hosted GitHub Actions runner) — 서버에서 할 일 없음

`main`에 푸시하면 전부 자동입니다. 도메인 **meaterickedu.kro.kr**이 이미 이
서버 IP를 가리키고 있다는 전제로, nginx + Let's Encrypt로 HTTPS까지 이
워크플로우가 끝까지 처리합니다:

1. GitHub이 제공하는 `ubuntu-latest` 러너가 `npm ci && npm run build`를
   실행합니다 — OCI는 RAM이 1GB뿐이라 빌드는 항상 여기서만 합니다.
2. `next.config.ts`의 `output: "standalone"`으로 만들어진 최소 실행 번들
   (pruned `node_modules` 포함, 약 50MB)을 아티팩트로 올립니다.
3. OCI에 등록된 self-hosted 러너가 번들을 러너 작업 폴더가 아니라
   `/home/ubuntu/aegis-ai-study`(`DEPLOY_DIR`)의 `releases/<실행 id>`에 풀고,
   `.env.production.local`(권한 600)을 GitHub Secret에서 새로 만듭니다. (러너는 job이
   끝나면 자기 작업 폴더 안에 있는 프로세스를 전부 죽이기 때문에, 계속 떠 있어야 하는
   서버 프로세스는 반드시 러너 작업 폴더 밖에서, systemd가 관리하는 PM2 데몬
   (`pm2-ubuntu.service`) 아래에서 돌립니다. 이 서비스는 처음 한 번만 등록·재시작합니다.)
4. **무중단(블루·그린) 전환** — `scripts/deploy/deploy.sh`가 새 버전을 쉬고 있는 포트
   (3000 ↔ 3001)에 띄우고 `/api/health`가 응답하면 nginx를 새 포트로 돌린 뒤(reload라 기존
   연결이 끊기지 않음) 옛 버전을 끕니다. 새 버전이 60초 안에 응답하지 않거나 nginx 설정 검사가
   실패하면 새 버전만 지우고 배포가 실패하며, 사이트는 옛 버전으로 계속 동작합니다.
   release 폴더는 최근 3개만 남깁니다. 전환하는 약 10초 동안은 두 버전이 함께 떠 있습니다.
5. nginx 설정은 `scripts/deploy/nginx-site.sh`가 매번 통째로 만듭니다. 인증서가 있으면 HTTPS
   서버까지 직접 쓰므로 배포 중 HTTPS가 끊기지 않고, IP별 요청 빈도(초당 30, POST 초당 5)·
   동시 연결 수 제한, 느린 요청 타임아웃, HSTS, `X-Forwarded-Host` 덮어쓰기가 들어 있습니다.
   인증서가 없을 때(첫 배포)만 `certbot --nginx`로 발급하고, 갱신은 certbot의 systemd 타이머가
   처리합니다.
6. 앱 로그는 `DEPLOY_DIR/logs/app-out.log`·`app-error.log`에 모이고, `scripts/deploy/logrotate.sh`가
   등록한 systemd 타이머(`aegis-logrotate.timer`)가 매시간 20MB 초과 또는 하루 지난 로그를
   잘라 압축하고 14개까지만 남깁니다(PM2 로그 포함).

즉 `git clone`도, `.env` 파일을 직접 만드는 것도, `npm install`도, 최초
`pm2 start`도, **nginx 설치/설정도, `certbot` 실행도** 전부 워크플로우가
처리합니다. 서버에는 Node.js·PM2·git·`sudo` 가능한 self-hosted runner
서비스만 떠 있으면 됩니다(nginx·certbot이 없으면 `apt-get install`로 자동
설치를 시도합니다 — 실패하면 배포 로그에 경고만 남고 나머지는 계속
진행됩니다).

### 딱 하나, GitHub에서 할 일 (서버 아님)

로그인 세션 서명 키를 저장소 비밀로 등록하세요 — **Settings → Secrets and
variables → Actions → New repository secret**:

| Name | Value |
| --- | --- |
| `SESSION_SECRET` | `openssl rand -base64 32`로 생성한 임의의 문자열 |
| `ADMIN_EMAILS` | (선택) 항상 관리자로 지정할 이메일, 쉼표로 구분. 비워두면 최초 가입자가 자동으로 관리자가 됩니다 |
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth 웹 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 위 OAuth 클라이언트의 보안 비밀 |

`SESSION_SECRET`을 등록하지 않으면 `src/lib/session.ts`의 개발용 기본값이
그대로 쓰이고, 배포 로그에 경고가 남습니다 — 동작은 하지만 누구나 아는
값이라 로그인 쿠키를 위조당할 수 있으니 꼭 등록해 주세요. 나중에 값을
바꾸면 기존에 로그인해 있던 모든 사람이 로그아웃됩니다(피해 없음, 다시
로그인하면 됩니다).

Google Cloud Console에서 OAuth 동의 화면과 **웹 애플리케이션** 클라이언트를 만든 뒤,
승인된 리디렉션 URI에 `https://meaterickedu.kro.kr/api/auth/google/callback`을 등록하세요.
로컬 테스트에는 `http://localhost:3000/api/auth/google/callback`도 추가합니다. 위 두
Google 자격 증명을 GitHub Actions Secrets로 등록하면 다음 `main` 배포부터 적용됩니다.

도메인을 나중에 바꾸게 되면 `.github/workflows/deploy.yml` 맨 위의
`env.DOMAIN` 한 줄만 고치면 됩니다.

### 처음 배포될 때 확인할 것

- DNS가 아직 전파 중이거나 OCI 보안 목록(Security List)에서 80/443 포트가
  안 열려 있으면 certbot 인증서 발급이 실패합니다 — 이 경우에도 nginx는
  계속 `:80`으로 평문 HTTP는 서빙합니다(리다이렉트만 아직 안 붙은 상태),
  완전히 접속 불가가 되지는 않습니다. Actions 로그에서 `Obtain the
  HTTPS certificate` 단계의 경고 메시지를 확인하세요. 오라클 클라우드는
  **보안 목록/NSG에서 80·443 인바운드를 따로 열어줘야** 하는 경우가
  많습니다 — 콘솔에서 VCN → Security Lists 확인해 주세요.
- `curl -I http://meaterickedu.kro.kr`로 301이 뜨는지, `curl -Ik
  https://meaterickedu.kro.kr`로 200이 뜨는지로 빠르게 확인할 수 있습니다.

## 데이터 저장소와 백업

계정·학습 기록·과제 제출·채팅·운영 설정은 `DATA_DIR/aegis.db`(SQLite) 하나에 저장합니다(`src/lib/db.ts`).
Node.js에 들어 있는 `node:sqlite`를 쓰므로 따로 설치할 것이 없고, 빌드 서버와 운영 서버의 Node 버전이 달라도 됩니다.

- **쓰기 비용이 사용자 수와 무관합니다.** 예전에는 확인 문제 하나를 풀어도 전체 학습 기록 파일(사용자 수에 비례해 커짐)을
  통째로 다시 썼지만, 지금은 바뀐 단계·문항의 행만 씁니다. 1,000명 분량(약 120MB)에서 확인 문제 저장은 1~2ms,
  스터디원 관리·제출함 화면은 전체 기록을 읽지 않고 필요한 숫자만 DB에서 모읍니다.
- **WAL 모드**라 읽기와 쓰기가 서로 막지 않고, 무중단 배포 중 두 버전이 함께 떠 있어도 같은 DB를 안전하게 씁니다.
  가입처럼 "확인 후 생성"하는 작업은 트랜잭션 하나로 처리해 동시에 일어나도 겹치지 않습니다.
- **구조 변경(마이그레이션)** 은 서버가 시작할 때 `src/lib/db.ts`의 `MIGRATIONS` 순서대로 자동 적용되고, 적용 전 DB 스냅숏을
  `backups/…-pre-migration-v<N>.db`로 남깁니다. 무중단 배포 중에는 이전 버전이 아직 돌고 있으므로 열·표를 **추가만** 하고,
  지우거나 이름을 바꾸는 변경은 그 열을 더 이상 쓰지 않는 버전을 먼저 배포한 다음에 합니다.
- **예전 JSON 저장소에서 옮기기** — 서버가 시작할 때 `DATA_DIR`에 `users.json`·`learning.json`·`submissions.json`·
  `chats.json`(또는 `threads.json`)·`settings.json`이 있으면 DB로 옮깁니다(`src/lib/legacyImport.ts`). 무중단 배포 중
  이전 버전이 그 사이 JSON에 쓴 내용도 3분 동안 따라잡은 뒤 원본을 `legacy-json/<시각>/`으로 옮겨 6주 동안 보관합니다.
  JSON을 읽지 못하면 서버가 상태 확인에 실패해 배포가 취소되고, 사이트는 이전 버전으로 계속 동작합니다.
  옮긴 결과는 `/operator/system`에 표시됩니다.
- **백업** — 매일 새벽 4시 무렵(한국 시간) DB 전체를 `backups/aegis-<시각>-daily.db.gz`로 백업하고, 최근 7일치는 모두,
  그 이전 5주는 주마다 하나를 남깁니다(수동·업그레이드 전 백업은 종류별 최근 5개). 어떤 백업도 6주를 넘겨 보관하지 않습니다 —
  탈퇴한 사용자의 기록이 백업에 남는 기간의 상한으로, 개인정보처리방침에 적혀 있습니다. 서버가 그 시간에 꺼져 있었으면 다시 켜질 때 만듭니다. `/operator/system`에서
  바로 백업하거나 내려받을 수 있습니다. 같은 디스크의 백업은 실수를 되돌리는 용도이므로, 디스크 고장에 대비하려면
  가끔 내려받아 두거나 `BACKUP_MIRROR_DIR`(다른 볼륨)을 지정하세요. 첨부 파일(`uploads/`)은 백업에 들어가지 않습니다.
- **오류 기록** — 요청 처리 중 난 서버 오류는 최근 300건까지 DB에 남아 `/operator/system`에서 볼 수 있습니다(경로만 기록하고
  쿼리 문자열은 남기지 않습니다). 전체 로그는 `DEPLOY_DIR/logs/`에 있습니다.

백업에서 되돌리기(서버에서):

```bash
cd /home/ubuntu/aegis-ai-study
APP="$(cat active-name)"
pm2 stop "$APP"
for f in aegis.db aegis.db-wal aegis.db-shm; do [ -f "data/$f" ] && mv "data/$f" "data/$f.before-restore"; done
gunzip -c data/backups/aegis-<시각>-daily.db.gz > data/aegis.db   # 업그레이드 전 스냅숏(.db)은 cp로 복사
pm2 start "$APP"
```

이 저장 방식 이전 버전(JSON 파일)으로 되돌려 배포하면 그 버전은 DB를 읽지 못합니다. 그럴 일이 있으면 먼저
`legacy-json/<시각>/`의 파일(6주 동안 보관)을 `data/`로 되돌려야 하며, 옮긴 뒤에 생긴 기록은 그 버전에서 보이지 않습니다.

## 스택

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, Tailwind CSS 4
- 데이터는 서버의 `DATA_DIR`(기본 `data/`)에 둡니다. 계정·학습 기록·과제 제출과 채점·채팅·운영 설정은 SQLite DB
  `aegis.db`에, 과제 작업 공간 초안은 `drafts/<사용자 id>/<주차 slug>.json`에, 제출본(`notebook-v<N>.json`)과 첨부 파일은
  `uploads/<제출 id>/`에 저장합니다. 자세한 내용은 위 "데이터 저장소와 백업"을 참고하세요.
  계정을 삭제하면 해당 사용자의 학습 기록, 초안, 대화, 제출물이 함께 삭제됩니다.
  첨부 파일은 최대 3개·각 5MB·합계 9MB이며, 제출자 본인과 관리자만 내려받을 수 있습니다.
- 브라우저 실행 코드는 Pyodide(웹 워커)로 실행됩니다. 학습 자료의 코드 셀은 하나의 이름공간을, 과제 작업 공간은 과제마다 별도의 이름공간을 씁니다.
  코드 편집기(Monaco)는 외부 CDN이 아니라 빌드 때 `node_modules`에서 복사한 `/vendor/monaco`에서 불러옵니다(`scripts/copy-monaco.mjs`).
- 남용 방지: 계정별 요청 빈도 제한(채팅·작업 공간 저장·제출·확인 문제, `src/lib/rateLimit.ts`), 채팅 실시간 연결 수 제한
  (계정당 6·전체 300), 과제당 제출 30회·계정당 첨부 합계 100MB, 디스크 여유 512MB 미만이면 큰 쓰기 거절(`src/lib/diskGuard.ts`),
  사이트 전체 Content-Security-Policy(`next.config.ts`).
  운영자가 스터디원의 제출본을 다시 실행해도 그 코드가 운영자 권한으로 사이트에 요청하지 못하도록, 워커는 Pyodide CDN 외의 네트워크 요청·스크립트 로드·하위 워커 생성이 막혀 있습니다(`public/pyodide-worker.js`, `next.config.ts`의 워커 CSP).
  서술형 답안의 작성 중 초안 같은 개인 편의 상태만 브라우저 localStorage에 남고, 진도·과제 초안·제출은 서버에 저장됩니다.
  코딩 실습에서 작성한 코드는 학습 자료 코드 셀처럼 브라우저 IndexedDB에만 저장되고, 서버에는 채점 결과(통과 항목 수)와 힌트 사용 기록만 남습니다.
