# Aegis AI 스터디 「AI 기초부터 활용까지」

Aegis 동아리의 8주 AI 스터디를 위한 학습 사이트입니다. 세계 최상위 대학 강의(Stanford
CS229/CS231n/CS224n/CS336, MIT 6.S191, Berkeley CS188 등)의 구조를 참고해 설계한
커리큘럼과, 단계 단위로 나뉜 학습 자료·실습·확인 문제, 백지공부, 사이트 안에서 작성·실행·제출하고
운영자가 채점하는 과제를 제공합니다.

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
| `/weeks/[slug]` | 주차 개요: 학습 목표, 함께 보면 좋은 자료, 단계 목록과 잠금 상태, 백지공부·과제 카드 |
| `/weeks/[slug]/sections/[sectionId]` | 단계 학습: **학습 → 실습 → 확인 문제(객관식 서버 채점 + 서술형 자기평가) → 완료** |
| `/weeks/[slug]/continue` | 지금 할 차례인 단계(또는 백지공부·과제)로 이동 |
| `/weeks/[slug]/worksheet` | 백지공부: 모든 단계를 마치면 열림, 제출 후 비교 자료 공개 |
| `/weeks/[slug]/assignment` | 과제: 모든 단계를 마치면 열림. 작업 공간(코드 셀 실행·답안 작성·자동 저장)에서 작업해 제출, 채점 결과와 제출 기록 확인 |
| `/weeks/[slug]/quiz` | 복습 노트: 틀린 확인 문제와 "보완이 필요합니다"로 표시한 서술형 답 |
| `/progress` | 개인 진도 대시보드 |
| `/login`, `/account` | Google 로그인·내 계정(탈퇴) |
| `/operator/submissions` | 관리자: 과제 제출 목록(필터·정렬), 답변을 기다리는 질문, 제출본 재실행·채점 기준별 채점·과제별 코멘트·재제출 요청 |
| `/chat` | 운영자 채팅: 과제와 상관없이 운영자와 실시간으로 메시지를 주고받음(Enter로 보내기, Shift+Enter 줄바꿈) |
| `/operator/chat`, `/operator/chat/[userId]` | 관리자: 스터디원별 채팅 목록과 대화(실시간). 채점 화면에도 같은 대화가 함께 표시됩니다 |
| `/operator/*` | 관리자: 운영 가이드, 문항별 정답·해설, 품질 로그, 스터디원 관리(주차별 진도·백지공부·약한 서술형 답) |

### 학습 흐름

1. 주차는 7~12개의 단계로 나뉩니다. 단계는 순서대로만 열리고, 한 단계를 끝내야 다음 단계가 열립니다.
2. 단계 완료 조건: 객관식 확인 문제 전부 정답 + 배정된 서술형 문항을 모두 쓰고 모범답안과 비교해 자기평가. 실습은 권장 활동이며 완료 조건에 들어가지 않습니다.
3. 모든 단계를 마치면 백지공부와 과제가 열립니다.
4. 과제는 과제 탭의 작업 공간에서 진행합니다. 코드 셀은 과제마다 하나의 Python 이름공간을 공유하며(Pyodide, 브라우저 실행),
   matplotlib 그림은 출력에 PNG로 저장됩니다. 작성 내용은 서버에 자동 저장되고(1.5초 지연, Ctrl+S 즉시 저장),
   제출하면 그 시점의 작업 공간이 제출본(`notebook-v<N>.json`)으로 보관됩니다. 메모·링크·첨부 파일은 선택입니다.
5. 운영자는 제출본을 빈 실행 환경에서 처음부터 다시 실행해 재현성을 확인하고, 채점 기준별 점수(0.5점 단위)의 합으로 채점하며,
   과제별 코멘트와 전체 피드백을 남기거나 재제출을 요청합니다. 스터디원과의 메시지는 채팅(`/chat`, `/operator/chat`)으로 주고받으며, 새 메시지는 서버 이벤트 스트림(SSE, `/api/chat/stream`)으로 곧바로 전달됩니다.
6. 관리자는 잠금과 관계없이 모든 단계와 과제를 열람할 수 있습니다.

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
- 단계 메타데이터: `src/content/sections/week{1..8}.ts`: 단계 id마다 학습 목표(`goal`),
  객관식 확인 문제(`checks`, `answer`는 0부터 시작하는 선택지 번호), 이 단계에 배정할 서술형 문항 id
  (`quizIds`, 주차의 `quiz` 배열에서 각 문항은 정확히 한 단계에만), 참고 자료(`references`, https)를 둡니다.
- 서술형 모범답안과 과제 채점 모범 방향: `src/content/quizAnswers.ts` (모범답안은 단계에서 답을 저장한 뒤에 공개됩니다)
- 과제 명세: `src/content/assignments/week{1..8}.ts`의 `AssignmentSpec`. 과제 항목(`tasks`)마다 설명(`instructions`, 마크다운)과
  셀 목록(`cells`: 시작 코드가 있는 `code` 셀, 안내 문구·최소 글자 수·답안 틀을 가진 `text` 셀), 선택 여부(`optional`)를 두고,
  채점 기준(`rubric`, 0.5점 단위 배점)을 정의합니다. 배점 합계는 주차의 `assignmentMaxScore`와 같아야 합니다.
  `provideCourseDocs: true`이면 작업 공간의 가상 파일 시스템에 학습 자료가 `/course/week1.md` … `/course/week8.md`로 제공됩니다.
  셀 id는 저장된 초안·제출본과 연결되므로 한 번 정하면 바꾸지 마십시오. 시작 코드는 앞 셀에서 만든 변수를 이어서 쓸 수 있습니다.
- 커리큘럼 총괄: `src/content/syllabus.ts`, 운영자 전용 문서: `src/content/operator/*.ts`
- 다이어그램: `src/components/diagrams/*.tsx` (주차별 파일 + `index.tsx`의
  `DIAGRAMS` 레지스트리에 id로 등록). 새 다이어그램을 추가하면 콘텐츠에서
  `[[diagram:my-id]]` 한 줄로 삽입할 수 있습니다.
- 수정한 뒤에는 `npm run validate:content`를 실행하십시오. 단계 id와 메타데이터의 1:1 대응,
  확인 문제의 정답 범위, 서술형 배정 누락·중복, 과제 명세(id 중복, 배점 합계, 답안 틀과 최소 글자 수), 수식 문법, 날것 유니코드 수식 등을 검사합니다.

## 로그인·관리자 구역

별도 회원가입 화면은 없습니다. Google 로그인 시 Google이 확인한 이메일과 사용자 식별자를
서버의 `data/users.json`(배포 시에는 `DATA_DIR`, 아래 참고)에 저장하며, 처음 로그인한
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

## 배포 (OCI + self-hosted GitHub Actions runner) — 서버에서 할 일 없음

`main`에 푸시하면 전부 자동입니다. 도메인 **meaterickedu.kro.kr**이 이미 이
서버 IP를 가리키고 있다는 전제로, nginx + Let's Encrypt로 HTTPS까지 이
워크플로우가 끝까지 처리합니다:

1. GitHub이 제공하는 `ubuntu-latest` 러너가 `npm ci && npm run build`를
   실행합니다 — OCI는 RAM이 1GB뿐이라 빌드는 항상 여기서만 합니다.
2. `next.config.ts`의 `output: "standalone"`으로 만들어진 최소 실행 번들
   (pruned `node_modules` 포함, 약 50MB)을 아티팩트로 올립니다.
3. OCI에 등록된 self-hosted 러너가 그 아티팩트를 러너 자신의 작업 폴더가
   아니라 `/home/ubuntu/aegis-ai-study`(`DEPLOY_DIR`)에 풀고,
   `.env.production.local`을 GitHub Secret에서 새로 만들고, PM2로 Next.js 앱
   (`aegis-ai-study`, `127.0.0.1:3000`에서만 대기)을 올립니다. (러너는 job이
   끝나면 자기 작업 폴더 안에 있는 프로세스를 전부 죽이기 때문에, 실제로
   계속 떠 있어야 하는 서버 프로세스는 반드시 러너 작업 폴더 밖에서
   돌려야 합니다.)
4. nginx를 설치(없으면)하고 `meaterickedu.kro.kr`을 `127.0.0.1:3000`으로
   리버스 프록시하는 사이트 설정을 등록합니다.
5. `certbot`의 공식 nginx 플러그인(`certbot --nginx`)으로 인증서를
   발급/갱신하고, nginx 설정에 TLS와 http→https 리다이렉트까지 자동으로
   추가합니다(이미 유효하면 조용히 스킵 — 매 배포마다 실행해도 안전).
   갱신은 certbot 패키지가 설치하는 자체 systemd 타이머가 처리합니다 —
   따로 등록할 deploy-hook이 없습니다.
6. 마지막으로 PM2를 systemd 서비스(`pm2-ubuntu.service`)로 완전히 넘깁니다
   — `pm2 kill`로 러너 job에 붙어있던 데몬을 끄고 systemd가 저장된 프로세스
   목록을 다시 띄우게 합니다. 이렇게 해야 이 배포 job 자체가 끝나도, 재부팅이
   되어도 계속 살아있습니다. (nginx는 처음부터 systemd 서비스라 이 문제와
   무관합니다.)

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
  완전히 접속 불가가 되지는 않습니다. Actions 로그에서 `Obtain/renew the
  HTTPS certificate` 단계의 경고 메시지를 확인하세요. 오라클 클라우드는
  **보안 목록/NSG에서 80·443 인바운드를 따로 열어줘야** 하는 경우가
  많습니다 — 콘솔에서 VCN → Security Lists 확인해 주세요.
- `curl -I http://meaterickedu.kro.kr`로 301이 뜨는지, `curl -Ik
  https://meaterickedu.kro.kr`로 200이 뜨는지로 빠르게 확인할 수 있습니다.

## 스택

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, Tailwind CSS 4
- 데이터는 서버의 `DATA_DIR`(기본 `data/`)에 JSON 파일로 저장합니다:
  `users.json`(계정), `learning.json`(단계별 확인 문제·서술형 답·완료 상태, 백지공부),
  `drafts/<사용자 id>/<주차 slug>.json`(과제 작업 공간 초안), `chats.json`(스터디원↔운영자 채팅. 예전 `threads.json`이 있으면 처음 실행할 때 자동으로 옮긴 뒤 지웁니다),
  `submissions.json`(과제 제출 버전·채점 기록), `uploads/<제출 id>/`(제출본 `notebook-v<N>.json`과 첨부 파일).
  계정을 삭제하면 해당 사용자의 학습 기록, 초안, 대화, 제출물이 함께 삭제됩니다.
  첨부 파일은 최대 3개·각 5MB·합계 9MB이며, 제출자 본인과 관리자만 내려받을 수 있습니다.
- 브라우저 실행 코드는 Pyodide(웹 워커)로 실행됩니다. 학습 자료의 코드 셀은 하나의 이름공간을, 과제 작업 공간은 과제마다 별도의 이름공간을 씁니다.
  운영자가 스터디원의 제출본을 다시 실행해도 그 코드가 운영자 권한으로 사이트에 요청하지 못하도록, 워커는 Pyodide CDN 외의 네트워크 요청·스크립트 로드·하위 워커 생성이 막혀 있습니다(`public/pyodide-worker.js`, `next.config.ts`의 워커 CSP).
  서술형 답안의 작성 중 초안 같은 개인 편의 상태만 브라우저 localStorage에 남고, 진도·과제 초안·제출은 서버에 저장됩니다.
