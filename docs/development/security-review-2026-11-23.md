# 보안 점검 — 2026-11-23

[문서 홈](../README.md) · [보안 운영 개요](../operations/security.md) · [배포](../operations/deployment.md)

`npm run build` 중 Next.js가 설치된 16.4.3이 보안 권고 대상이라고 알렸다. 이 권고를 해결하고, 의존성·서버 코드·GitHub Actions·nginx 설정과 운영 사이트의 응답 헤더를 점검했다. 기존 보안 테스트(`test:security`, `test:security:http`, Python 수집기 테스트)는 업그레이드 전후 모두 통과했다.

## 의존성

| 패키지 | 이전 | 이후 | 권고 |
| --- | --- | --- | --- |
| `next` | 16.4.3 | 16.4.6 | moderate 7건(16.0.0~16.4.4 영향) |
| `eslint-config-next`(개발) | 16.4.3 | 16.4.6 | `next`와 버전을 맞춤 |
| `zod`(개발, `eslint-plugin-react-hooks` 경유) | 4.6.5 | 4.6.7 | high 1건 GHSA-mrhx-c7xc-m3w5 |
| `typescript-eslint`(개발) | 8.70.0 | 8.73.0 | `minimatch` 10.2.6 → 11.0.9, moderate GHSA-g3hv-75wg-m249 |

업그레이드 후 `npm audit`는 전체 의존성과 운영 의존성(`--omit=dev`) 모두 0건이다. 메이저 버전은 바꾸지 않았다.

Next.js 권고 7건(GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8, GHSA-7qx7-33qx-rqx2, GHSA-f3mh-rxg3-f5g2, GHSA-pc58-hwjq-p385, GHSA-rhh4-g77r-r9qj, GHSA-vvgp-ww4w-46vf)이 이 앱에 미치는 영향은 작았다.

- `'use cache'`·`unstable_cache`·Cache Components 관련 4건: 이 기능을 쓰지 않는다.
- 이미지 최적화의 SVG 거부 우회: `images.unoptimized: true`로 이미지 최적화를 쓰지 않는다.
- Edge 런타임 경로의 HttpOnly 쿠키 노출: Edge 런타임 경로가 없다. 로그인 경로는 `runtime = "nodejs"`이고, Next.js 16의 Proxy는 Node.js 런타임으로만 실행된다.
- 가져온 응답을 그대로 전달하는 자체 호스팅 앱의 응답 주입: `fetch` 응답을 그대로 돌려주는 경로가 없다.

## 확인한 항목

- **서버 액션 20개**: 모두 `requireUser` 또는 `requireAdmin`으로 로그인과 권한을 확인한다. 학습 기록 액션은 레슨·과제 잠금을 서버에서 다시 검사한다.
- **권한**: 역할은 요청마다 DB에서 다시 읽는다(`src/lib/dal.ts`, `src/lib/apiAuth.ts`). Proxy의 JWT 역할 검사는 1차 차단이며, 권한을 낮추거나 계정을 지우면 바로 반영된다.
- **로그인**: 서명된 state 쿠키(상수 시간 비교), 1회용 nonce, Google의 `email_verified` 확인, Google subject로 사용자 식별, 같은 사이트 경로만 허용하는 돌아갈 주소(`safeReturnPath`)를 쓴다.
- **세션 쿠키**: HttpOnly, 운영에서 Secure, SameSite=Lax, HS256 서명, 30일 만료다.
- **SQL**: 사용자 값은 모두 `?` 매개변수로 전달한다. 문자열로 끼워 넣는 부분은 상수 조각과 허용 목록에서 고른 열 이름뿐이다.
- **XSS**: `dangerouslySetInnerHTML`은 KaTeX 출력과 nonce가 붙은 테마 초기화 스크립트에만 쓴다. 학습자 답안의 수식은 KaTeX 기본값(`trust: false`)과 `maxExpand: 200`으로 렌더링하고, 링크는 `https://`나 사이트 경로만 허용한다. 과제 출력은 텍스트와 형식을 검사한 PNG(base64)만 저장하고, 채팅은 일반 텍스트로 표시한다.
- **CSP**: HTML 응답마다 새 nonce와 `'strict-dynamic'`을 쓰고 운영에서는 `'unsafe-eval'`이 없다. Python 실행 워커는 Pyodide CDN 외의 연결과 스크립트 로드를 막는 별도 CSP를 받고, Pyodide 버전을 고정한다.
- **비밀값**: 작업 트리와 전체 Git 이력에서 개인 키, AWS·GitHub·Google API 키, Google OAuth 클라이언트 비밀값, Slack 토큰 형식을 찾지 못했다. `.env*`는 `.gitignore`에 있고 `.env.example`에는 자리표시자만 있다.
- **배포 워크플로**: 비밀값은 `env`로 전달하고, 환경 파일은 `umask 077`·`chmod 600`으로 쓴다. `SESSION_SECRET`의 길이와 기본값을 검사하고 `PUBLIC_ORIGIN`을 고정한다. self-hosted 러너는 main 푸시와 수동 실행에서만 쓰며, PR 검사는 GitHub 호스팅 러너에서 실행한다.
- **nginx**: `server_tokens off`, HTTP → HTTPS 301, HSTS 1년, certbot의 TLS 설정, IP별 요청·연결 제한을 쓴다. `X-Real-IP`·`X-Forwarded-For`는 nginx가 덮어쓰고, 앱은 `TRUST_PROXY=1`일 때만 이 값을 믿는다.
- **운영 사이트 응답 헤더**: CSP(nonce), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`를 확인했다. `X-Powered-By: Next.js`가 노출되어 아래에서 수정했다.

## 수정한 내용

- 위 표의 의존성 업그레이드(`4bf6b3f`).
- `next.config.ts`에 `poweredByHeader: false`를 두어 `X-Powered-By` 헤더를 보내지 않는다. `test:security:http`가 이 헤더가 없는지 확인한다.
- `deploy.yml` 최상위에 `permissions: contents: read`를 두었다. build 잡은 저장소의 기본 토큰 권한 대신 읽기 권한만 받는다. deploy 잡은 기존대로 캐시 삭제 권한(`actions: write`)을 더 받는다.
- `security.yml`이 PR 외에 main 푸시와 매주 월요일 03:17(KST)에도 실행된다. main에 직접 푸시한 변경은 PR 검사를 거치지 않아 HTTP 보안 점검과 의존성 감사가 실행되지 않았다. 주간 실행은 새로 공개된 권고를 확인한다. 배포 워크플로와 별개라 배포를 막지 않는다.

## 권장 사항

반영하지 않았으며, 위험도와 작업량을 보고 정할 사항이다.

- **GitHub Actions 고정**: deploy 잡은 운영 비밀값이 있는 self-hosted 러너에서 `actions/checkout`, `actions/cache/restore`, `actions/github-script`를 태그(`@v5`, `@v8`)로 실행한다. 커밋 SHA로 고정하고 Dependabot(github-actions·npm)으로 갱신하면 태그가 바뀌는 공급망 공격을 막는다.
- **세션 무효화**: 세션은 서버에 저장하지 않는 30일 JWT라, 로그아웃해도 이미 탈취된 토큰은 만료까지 유효하다. 사용자별 세션 세대 값을 JWT에 넣고 로그아웃할 때 올리면 모든 기기의 세션을 끊을 수 있다. 쿠키가 HttpOnly이고 CSP가 스크립트 주입을 막아 탈취 가능성은 낮다.
- **OAuth PKCE**: 현재 state·nonce·클라이언트 비밀값으로 보호한다. RFC 9700은 기밀 클라이언트에도 PKCE(S256)를 권장한다.
- **ESLint 9 지원 종료**: 개발 도구만 해당한다. `eslint-config-next`가 ESLint 10을 지원하면 함께 올린다.
- **Pyodide 공급**: jsDelivr에서 버전을 고정해 받는다. `importScripts`에는 SRI를 쓸 수 없으므로 공급망 위험을 더 줄이려면 Monaco처럼 직접 제공하는 방안을 검토한다. 파일 크기와 서버 자원을 함께 고려한다.
- **TLS 버전**: 점검 환경의 외부 연결이 프록시를 거쳐 서버의 TLS 버전 협상은 직접 확인하지 못했다. 서버에서 `sudo nginx -T`로 `options-ssl-nginx.conf`가 포함됐는지 확인한다.

## 검증

로컬(Node 22, CI는 Node 24)에서 `security.yml`과 같은 순서로 실행했다.

- `npm ci`, `npm run test:security`, `tests/security/security-inventory.test.py`, `tests/security/security-collector.test.py`
- `npm run lint`, `npm run typecheck`, `npm run test:curriculum`, `npm run validate:content`, `npm run docs:check`
- `npm run build`, standalone 조립 뒤 `npm run test:security:http`
- `npm audit`, `npm audit --omit=dev --audit-level=low`: 0건
- 두 워크플로 파일을 YAML로 읽어 트리거·권한·러너를 확인했다.
