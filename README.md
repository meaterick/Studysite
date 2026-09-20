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

`/operator` 패스코드를 저장소 비밀로 등록하세요 — **Settings → Secrets and
variables → Actions → New repository secret**:

| Name | Value |
| --- | --- |
| `OPERATOR_PASSCODE` | 원하는 패스코드 (예: 운영진끼리만 공유할 문구) |

등록하지 않으면 `src/lib/auth.ts`의 개발용 기본값(`aegis-operator-2026`)이
그대로 쓰이고, 배포 로그에 경고가 남습니다 — 동작은 하지만 누구나 아는
값이니 꼭 등록해 주세요. 나중에 값을 바꾸고 싶으면 이 화면에서 값만
바꾸고 다시 푸시(또는 Actions 탭에서 워크플로우 재실행)하면 됩니다.

도메인을 나중에 바꾸게 되면 `.github/workflows/deploy.yml` 맨 위의
`env.DOMAIN` 한 줄만 고치면 됩니다.

### 처음 배포될 때 확인할 것

- DNS가 아직 전파 중이거나 OCI 보안 목록(Security List)에서 80/443 포트가
  안 열려 있으면 certbot 인증서 발급이 실패합니다 — 이 경우 사이트는 아직
  HTTPS 없이도 뜨지 않습니다(443이 아예 안 열리므로). Actions 로그에서
  `Obtain/renew the HTTPS certificate` 단계의 경고 메시지를 확인하세요.
  오라클 클라우드는 **보안 목록/NSG에서 80·443 인바운드를 따로 열어줘야**
  하는 경우가 많습니다 — 콘솔에서 VCN → Security Lists 확인해 주세요.
- `curl -I http://meaterickedu.kro.kr`로 301이 뜨는지, `curl -Ik
  https://meaterickedu.kro.kr`로 200이 뜨는지로 빠르게 확인할 수 있습니다.

## 스택

- Next.js 16 (App Router, Server Actions, Turbopack)
- TypeScript, Tailwind CSS 4
- 데이터 저장 없음 — 개인 진도/백지공부는 각자 브라우저의 localStorage에만 저장
