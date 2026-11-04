# 배포 안내

[문서 홈](../README.md) · [데이터와 백업](data-and-backups.md)

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
| `ADMIN_EMAILS` | 신규 관리자 이메일을 쉼표로 구분. 운영 환경에서 비워두면 신규 가입자는 모두 스터디원 |
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth 웹 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 위 OAuth 클라이언트의 보안 비밀 |

`SESSION_SECRET`은 충분히 무작위인 32자 이상의 값이어야 합니다. 누락·짧은 값·개발용 기본값은
배포와 운영 서버 시작을 거부합니다. 블루·그린 배포가 실패하면 이전 앱이 계속 서비스합니다.
키를 바꾸면 기존 로그인 쿠키는 무효화되어 사용자가 다시 로그인해야 합니다.

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
