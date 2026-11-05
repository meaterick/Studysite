# 기술 구조와 저장소 지도

[문서 홈](../README.md) · [사이트 동작](site-guide.md)

## 스택

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, Tailwind CSS 4
- 데이터는 서버의 `DATA_DIR`(기본 `data/`)에 둡니다. 계정·학습 기록·이전 과제 제출 기록·채팅·운영 설정은 SQLite DB
  `aegis.db`에, 과제 작업 공간 초안은 `drafts/<사용자 id>/<과제 키>.json`에, 제출본(`notebook-v<N>.json`)과 첨부 파일은
  `uploads/<제출 id>/`에 저장합니다. 자세한 내용은 [데이터 저장소](../operations/data.md)를 참고하세요.
  계정을 삭제하면 해당 사용자의 학습 기록, 초안, 대화, 제출물이 함께 삭제됩니다.
- 브라우저 실행 코드는 Pyodide(웹 워커)로 실행됩니다. 학습 자료의 코드 셀은 하나의 이름공간을, 과제 작업 공간은 과제마다 별도의 이름공간을 씁니다.
  코드 편집기(Monaco)는 외부 CDN이 아니라 빌드 때 `node_modules`에서 복사한 `/vendor/monaco`에서 불러옵니다(`scripts/copy-monaco.mjs`).
- 남용 방지: 계정별 요청 빈도 제한(채팅·작업 공간 저장·확인 문제, `src/lib/rateLimit.ts`), 채팅 실시간 연결 수 제한
  (계정당 6·전체 300), 디스크 여유 512MB 미만이면 큰 쓰기 거절(`src/lib/diskGuard.ts`),
  사이트 전체 Content-Security-Policy(`next.config.ts`).
  학습 코드의 실행 환경을 제한하기 위해, 워커는 Pyodide CDN 외의 네트워크 요청·스크립트 로드·하위 워커 생성이 막혀 있습니다(`public/pyodide-worker.js`, `next.config.ts`의 워커 CSP).
  서술형 답안과 백지 복습의 작성 중 초안 같은 개인 편의 상태만 브라우저 localStorage에 남고, 진도와 과제 작업은 서버에 저장됩니다.
  코딩 실습에서 작성한 코드는 학습 자료 코드 셀처럼 브라우저 IndexedDB에만 저장되고, 서버에는 채점 결과(통과 항목 수)와 힌트 사용 기록만 남습니다.

## 콘텐츠가 화면이 되는 과정

1. 모듈 원본(`src/content/modules/<slug>/`)은 `defineModule`·`defineLesson`·`defineExercises`·`defineAssignment`(`src/content/kit.ts`)로 작성한 상수입니다. 본문은 `md` 태그, 파이썬 코드는 `py` 태그로 써서 백슬래시를 그대로 둡니다.
2. `src/content/course.ts`가 빌드 때 원본을 화면용 구조로 바꿉니다. 모듈 번호("2-3", "X-1")를 붙이고, 본문을 블록으로 파싱하며(`src/content/markdown.ts`), `[[lesson:id]]` 참조를 "모듈 번호 + 레슨 제목" 링크로 바꾸고, 본문 분량과 문항 수로 예상 학습 시간을 계산합니다. 레슨 사이의 선수관계는 개념의 선수관계(`src/content/curriculum/concepts.ts`)에서 계산합니다.
3. 진행 규칙(레슨 완료, 모듈 완료, 진행 방식)은 `src/lib/study.ts` 한곳에 있어 학습자 화면, 서버 액션, 운영자 통계가 같은 함수를 씁니다.
4. 정답·해설·모범답안·모범 코드·채점 참고는 서버에만 있고, 학습자가 공개 조건을 만족했을 때만 내려보냅니다.

## 파일의 역할과 배치 기준

| 위치 | 역할 | 편집 기준 |
| --- | --- | --- |
| `src/app/` | App Router 페이지·레이아웃·API·아이콘 | Next.js 파일 규약에 따라 유지 |
| `src/components/` | 공통 UI와 assignment/chat/diagrams/lab/lesson/module/progress/security 등 기능별 UI | 재사용 UI는 공통, 기능 전용 UI는 해당 하위 폴더 |
| `src/content/modules/<slug>/` | 모듈 하나: `index.ts`(목표 문제·학습 목표·레슨 순서·백지 복습), 레슨 파일(본문·확인 문제·출력 예측·서술형·참고 자료), `labs/`(코딩 실습), `assignment.ts`(과제) | 레슨 id·문항 key·과제 키·셀 id는 저장된 기록과 연결되므로 바꾸지 않음 |
| `src/content/curriculum/` | 트랙, 80개 개념과 선수관계, 기본 일정, 예전 주소 대응표 | 개념 id는 안정 키 |
| `src/content/course.ts`, `markdown.ts`, `kit.ts`, `tiers.ts`, `types.ts` | 화면용 구조 생성·조회, 본문 파서, 작성 도우미, 레슨 구분, 타입 | 콘텐츠 원본과 화면 사이의 경계 |
| `src/lib/` | 인증·DB·학습·과제·보안 등 서버/공용 로직 | 기존 import와 서버/클라이언트 경계를 지킴 |
| `src/instrumentation.ts`, `src/proxy.ts` | 시작 시 계측과 요청 경계 | 프레임워크 진입점 |
| `public/images/` | 브랜드·OAuth 로고와 레슨에 쓰는 교육 이미지(로그인한 사용자만 열람) | URL을 사용하는 외부 설정도 고려 |
| `public/pyodide-worker.js` | 격리된 브라우저 Python 실행 | 실행 시간·네트워크 제한 유지 |
| `scripts/content/` | 콘텐츠 검증·실습 검증·참조 과제 | npm 명령으로 실행 |
| `scripts/docs/` | 커리큘럼 문서(`docs/curriculum/`) 생성·문서 링크 검사 | 원본과 문서의 동기화 보장 |
| `scripts/security/` | 격리 벤치마크·HTTP 스모크 검사 | 운영 데이터와 분리 |
| `scripts/deploy/` | 배포·nginx·로그 회전·호스트 수집기 | 배포 워크플로와 연결 |
| `tests/security/` | TypeScript·Python 보안 회귀 검사 | 테스트 코드는 실행 스크립트와 분리 |
| `docs/` | 학습 목차·개발·기여·운영·과거 검토 | [문서 홈](../README.md)에서 탐색 |
| `.github/workflows/` | PR 검증과 main 배포 | 새 명령·경로를 함께 갱신 |
| 루트 설정 파일 | 의존성·Next·TS·ESLint·PM2·환경 예제·에이전트 규칙 | 도구가 읽는 규약 위치 유지 |

## 생성물과 영속 데이터

`node_modules/`, `.next/`, `public/vendor/`, 로컬 `data/`, `.env.local`, `*.tsbuildinfo`는 생성물 또는 개인 데이터로 Git에서 제외합니다. `public/vendor/monaco`는 `predev`/`prebuild`가 복사합니다. `package-lock.json`은 재현 가능한 설치에 필요하므로 추적합니다.

## 변경 시 확인

- 문서·커리큘럼: `npm run docs:check`, `npm run validate:content`.
- TypeScript·UI: `npm run lint`, `npm run typecheck`, `npm run build` (`typecheck`는 Next.js 경로 타입을 먼저 생성).
- 실습·과제 코드: `npm run check:labs`.
- 인증·운영·보안: `npm run test:security`, `npm run test:security:python`, 필요시 standalone 빌드 후 `npm run test:security:http`.
