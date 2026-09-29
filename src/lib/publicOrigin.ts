import "server-only";

/**
 * 리다이렉트용 절대 URL을 만들 때 쓸, 실제로 접속한 공개 도메인을 계산한다.
 *
 * standalone 서버(`node server.js`)는 nginx 리버스 프록시 뒤에서
 * `127.0.0.1:포트`로만 열려있는데, Next.js는 자체적으로 요청의 절대 URL을
 * 만들 때(`req.url`/`initURL`) Host 헤더가 아니라 서버가 바인딩된
 * hostname:port(예: localhost:3000)를 쓴다 — 그래서
 * `NextResponse.redirect(new URL("/", req.url))` 같은 코드가 실제 도메인이
 * 아니라 `http://localhost:3000/`으로 리다이렉트되는 문제가 있었다.
 *
 * nginx가 원본 Host를 그대로 넘겨주므로(`proxy_set_header Host $host;`,
 * deploy.yml 참고) 여기서는 Next.js의 계산을 거치지 않고 요청 헤더에서
 * 직접 origin을 뽑아 쓴다.
 *
 * 운영 환경에서는 배포가 PUBLIC_ORIGIN(예: https://meaterickedu.kro.kr)을 넣어 주므로 요청 헤더를 아예
 * 믿지 않는다. 클라이언트가 보낸 Host/X-Forwarded-Host로 리다이렉트 주소를 바꾸지 못하게 하기 위함이다.
 * (nginx도 X-Forwarded-Host를 실제 $host로 덮어쓴다.) 설정이 없는 로컬 개발에서만 헤더를 쓴다.
 */
const CONFIGURED_ORIGIN = (() => {
  const raw = process.env.PUBLIC_ORIGIN?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

export function publicOrigin(req: Request): string {
  if (CONFIGURED_ORIGIN) return CONFIGURED_ORIGIN;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return new URL(req.url).origin;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  return `${proto}://${host}`;
}
