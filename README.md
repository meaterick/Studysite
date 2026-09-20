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

**OCI 인스턴스가 RAM 1GB라서 서버에서는 절대 빌드하지 않습니다.** `npm ci` /
`next build`는 GitHub이 제공하는 `ubuntu-latest` 러너에서 실행되고,
`next.config.ts`의 `output: "standalone"`으로 만들어진 최소 실행 번들
(`.next/standalone/` — pruned된 `node_modules` 포함, 약 50MB)을 아티팩트로
올립니다. self-hosted 러너(OCI)는 그 번들을 내려받아 `node server.js`를
PM2로 띄우기만 합니다 — `npm install`도, 빌드도 서버에서는 전혀 일어나지
않습니다.

### 서버 최초 설정 (1회)

```bash
git clone <repo-url> /path/to/Studysite
cd /path/to/Studysite
cp .env.example .env.production.local
vi .env.production.local          # OPERATOR_PASSCODE를 실제 값으로 변경

# 최초 1회는 GitHub Actions가 아직 아무것도 배포하지 않았으므로 로컬에서 한 번
# 빌드해 .next/standalone을 채워 넣습니다 (RAM이 빠듯하면 --max-old-space-size로
# 메모리를 제한하거나, GitHub Actions를 한 번 수동 실행(workflow_dispatch)해서
# 얻은 결과를 기다려도 됩니다).
npm ci && npm run build

pm2 start ecosystem.config.js
pm2 save
pm2 startup                        # 서버 재부팅 시 PM2 자동 시작 (안내되는 명령 1회 실행)
```

nginx는 `deploy/nginx.conf.sample`을 참고해 `127.0.0.1:3000`(또는
`.env.production.local`의 `PORT`)으로 리버스 프록시하도록 설정하세요.
HTTPS는 `certbot --nginx`로 붙이는 것을 권장합니다.

### 이후 배포

`main`에 머지/푸시되면 ① GitHub의 `ubuntu-latest` 러너가 빌드해
`.next/standalone` 아티팩트를 만들고, ② OCI의 self-hosted 러너가 그
아티팩트를 내려받아 `.next/standalone`을 통째로 교체한 뒤
`pm2 startOrReload`로 재기동합니다. `.env.production.local`은 저장소
루트(= `.next/standalone` 바깥)에 두므로 매 배포마다 덮어써지지 않고
그대로 유지됩니다. `ecosystem.config.js`가 이 파일을 직접 읽어 PM2 프로세스의
환경변수로 주입합니다.

## 스택

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, Tailwind CSS 4
- 데이터 저장 없음 — 개인 진도/백지공부는 각자 브라우저의 localStorage에만 저장
