# Aegis AI 스터디 — 「AI 기초부터 활용까지」

Aegis 동아리의 8주 AI 스터디를 위한 학습 사이트입니다. 세계 최상위 대학 강의(Stanford
CS229/CS231n/CS224n/CS336, MIT 6.S191, Berkeley CS188 등)의 구조를 참고해 설계한
커리큘럼과, 주차별 학습자료·실습·퀴즈·백지공부 시트·과제를 제공합니다.

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
| `/` | 소개, 4-Phase 로드맵, 수료 목표 |
| `/curriculum` | 8주 커리큘럼 총괄(시러버스) |
| `/weeks`, `/weeks/[slug]` | 주차별 학습목표·핵심개념·실습·퀴즈·백지공부·과제 |
| `/progress` | 개인 학습 진도 대시보드 (브라우저 localStorage) |
| `/operator/*` | 운영자 전용 — 운영 가이드, 퀴즈 정답, 품질 로그 (패스코드 보호) |

## 콘텐츠 수정하기

- 주차별 자료: `src/content/weeks/week{1..8}.ts` — 각 파일이 `WeekMeta` 객체
  하나를 export합니다. `conceptsMd`, `practiceMd`, `assignmentMd`는 이 프로젝트
  전용의 가벼운 마크다운(`##`/`###` 제목, 목록, 표, ` ```lang ` 코드블록,
  ` ```formula ` 수식블록, `:::info|warn|example` 콜아웃, `[[diagram:id]]`
  다이어그램 삽입)을 지원합니다 — 파서는 `src/content/markdown.ts`.
- 커리큘럼 총괄: `src/content/syllabus.ts`
- 운영자 전용 문서: `src/content/operator/*.ts`
- 다이어그램: `src/components/diagrams/*.tsx` (주차별 파일 + `index.tsx`의
  `DIAGRAMS` 레지스트리에 id로 등록). 새 다이어그램을 추가하면 콘텐츠에서
  `[[diagram:my-id]]` 한 줄로 삽입할 수 있습니다.

## 운영자 전용 구역

`/operator/*`는 패스코드로 보호됩니다(`src/proxy.ts`). 로컬 기본값은
`aegis-operator-2026`이며, 배포 시에는 반드시 `.env.production.local`에
직접 설정하세요 (`.env.example` 참고). 이 폴더의 내용(퀴즈 정답, 채점
기준 원본, 운영 노하우)은 스터디원에게 공개하지 않는 것이 원칙입니다.

## 배포 (OCI + self-hosted GitHub Actions runner)

이 저장소는 OCI 서버에 이미 설치된 Node.js / PM2 / nginx / git과, 그 서버에
등록된 self-hosted runner를 사용해 `main` 브랜치에 푸시할 때마다 자동
배포되도록 구성되어 있습니다 (`.github/workflows/deploy.yml`).

### 서버 최초 설정 (1회)

```bash
git clone <repo-url> /path/to/Studysite
cd /path/to/Studysite
cp .env.example .env.production.local
vi .env.production.local          # OPERATOR_PASSCODE를 실제 값으로 변경
npm ci
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup                        # 서버 재부팅 시 PM2 자동 시작 (안내되는 명령 1회 실행)
```

nginx는 `deploy/nginx.conf.sample`을 참고해 `127.0.0.1:3000`(또는
`.env.production.local`의 `PORT`)으로 리버스 프록시하도록 설정하세요.
HTTPS는 `certbot --nginx`로 붙이는 것을 권장합니다.

### 이후 배포

`main` 브랜치에 머지/푸시되면 워크플로우가 self-hosted runner에서
`npm ci && npm run build`를 실행하고 `pm2 startOrReload`로 무중단에
가깝게 재기동합니다. `.env.production.local`은 저장소에 커밋되지 않으므로
서버에 이미 있는 값을 그대로 사용합니다.

## 스택

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, Tailwind CSS 4
- 데이터 저장 없음 — 개인 진도/백지공부는 각자 브라우저의 localStorage에만 저장
