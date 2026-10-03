import { get } from "@/lib/db";

export const dynamic = "force-dynamic";

// 배포(무중단 전환)가 새 서버가 요청을 받을 준비가 됐는지 확인하는 용도. 로그인과 무관하게 가볍게 응답하되,
// DB를 열고 읽을 수 없으면 503을 돌려줘 그 버전으로는 트래픽이 넘어가지 않게 한다.
export function GET() {
  try {
    get("SELECT 1 FROM schema_migrations LIMIT 1");
  } catch {
    return new Response("database unavailable", { status: 503, headers: { "cache-control": "no-store" } });
  }
  return new Response("ok", { headers: { "cache-control": "no-store" } });
}
