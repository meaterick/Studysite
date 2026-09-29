export const dynamic = "force-dynamic";

// 배포(무중단 전환)가 새 서버가 요청을 받을 준비가 됐는지 확인하는 용도. 데이터·로그인과 무관하게 가볍게 응답한다.
export function GET() {
  return new Response("ok", { headers: { "cache-control": "no-store" } });
}
