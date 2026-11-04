# 기술 구조와 저장소 지도

[문서 홈](../README.md) · [사이트 동작](site-guide.md)

## 스택

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, Tailwind CSS 4
- 데이터는 서버의 `DATA_DIR`(기본 `data/`)에 둡니다. 계정·학습 기록·과제 제출과 채점·채팅·운영 설정은 SQLite DB
  `aegis.db`에, 과제 작업 공간 초안은 `drafts/<사용자 id>/<주차 slug>.json`에, 제출본(`notebook-v<N>.json`)과 첨부 파일은
  `uploads/<제출 id>/`에 저장합니다. 자세한 내용은 [데이터 저장소와 백업](../operations/data-and-backups.md)을 참고하세요.
  계정을 삭제하면 해당 사용자의 학습 기록, 초안, 대화, 제출물이 함께 삭제됩니다.
  첨부 파일은 최대 3개·각 5MB·합계 9MB이며, 제출자 본인과 관리자만 내려받을 수 있습니다.
- 브라우저 실행 코드는 Pyodide(웹 워커)로 실행됩니다. 학습 자료의 코드 셀은 하나의 이름공간을, 과제 작업 공간은 과제마다 별도의 이름공간을 씁니다.
  코드 편집기(Monaco)는 외부 CDN이 아니라 빌드 때 `node_modules`에서 복사한 `/vendor/monaco`에서 불러옵니다(`scripts/copy-monaco.mjs`).
- 남용 방지: 계정별 요청 빈도 제한(채팅·작업 공간 저장·제출·확인 문제, `src/lib/rateLimit.ts`), 채팅 실시간 연결 수 제한
  (계정당 6·전체 300), 과제당 제출 30회·계정당 첨부 합계 100MB, 디스크 여유 512MB 미만이면 큰 쓰기 거절(`src/lib/diskGuard.ts`),
  사이트 전체 Content-Security-Policy(`next.config.ts`). 제출 기록(과제 화면·채점 화면)은 최신 제출본의 작업 공간만 바로 그리고,
  이전 제출본의 작업 공간은 펼칠 때 그 버전 하나만 받아 온다(`/api/submissions/[id]/notebooks/[version]`). 제출이 쌓여도 화면 하나의 비용이 늘지 않는다.
  운영자가 스터디원의 제출본을 다시 실행해도 그 코드가 운영자 권한으로 사이트에 요청하지 못하도록, 워커는 Pyodide CDN 외의 네트워크 요청·스크립트 로드·하위 워커 생성이 막혀 있습니다(`public/pyodide-worker.js`, `next.config.ts`의 워커 CSP).
  서술형 답안의 작성 중 초안 같은 개인 편의 상태만 브라우저 localStorage에 남고, 진도·과제 초안·제출은 서버에 저장됩니다.
  코딩 실습에서 작성한 코드는 학습 자료 코드 셀처럼 브라우저 IndexedDB에만 저장되고, 서버에는 채점 결과(통과 항목 수)와 힌트 사용 기록만 남습니다.



## 파일의 역할과 배치 기준

| 위치 | 역할 | 편집 기준 |
| --- | --- | --- |
| `src/app/` | App Router 페이지·레이아웃·API·아이콘 | Next.js 파일 규약에 따라 유지 |
| `src/components/` | 공통 UI와 assignment/chat/diagrams/lab/security 등 기능별 UI | 재사용 UI는 공통, 기능 전용 UI는 해당 하위 폴더 |
| `src/content/weeks/` | 주차 메타·학습 본문·서술형 문항·백지공부 | 학습 목차의 원본 |
| `src/content/sections/` | 단계 구분·목표·확인 문제·참고 자료 | 본문 단계 ID와 1:1 대응 |
| `src/content/labs/` | TODO 실습·추가 퀴즈·과제 자동 테스트·심화 문제 | 주차와 단계 ID로 연결 |
| `src/content/assignments/` | 제출 과제 항목·코드/답안 셀·루브릭 | 저장된 셀 ID 보존 |
| `src/content/operator/` | 운영 가이드·품질 기록 | 관리자 화면에서 사용 |
| `src/lib/` | 인증·DB·학습·과제·보안 등 서버/공용 로직 | 기존 import와 서버/클라이언트 경계를 지킴 |
| `src/instrumentation.ts`, `src/proxy.ts` | 시작 시 계측과 요청 경계 | 프레임워크 진입점 |
| `public/images/` | 브랜드·OAuth 로고·주차별 교육 이미지 | URL을 사용하는 외부 설정도 고려 |
| `public/pyodide-worker.js` | 격리된 브라우저 Python 실행 | 실행 시간·네트워크 제한 유지 |
| `scripts/content/` | 콘텐츠 검증·실습 검증·참조 과제 | npm 명령으로 실행 |
| `scripts/docs/` | 커리큘럼 목차 생성·문서 링크 검사 | 원본과 문서의 동기화 보장 |
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
