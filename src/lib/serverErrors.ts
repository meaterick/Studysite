import "server-only";
import { all, get, run } from "./db";

// 요청을 처리하다 난 서버 오류를 최근 것만 DB에 남겨, 운영자가 서버에 접속하지 않고도 시스템 화면에서 볼 수 있게 한다.
// (같은 내용은 PM2 로그에도 남는다.)

const KEEP = 300;

export interface ServerErrorEntry {
  id: number;
  at: string;
  method: string | null;
  path: string | null;
  route: string | null;
  kind: string | null;
  message: string;
  digest: string | null;
}

export function recordServerError(
  err: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string }
): void {
  try {
    const message = (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).slice(0, 2000);
    const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : null;
    // 쿼리 문자열에는 개인 정보가 실릴 수 있어 경로만 남긴다.
    const pathOnly = request.path.split("?")[0].slice(0, 300);
    run(
      "INSERT INTO server_errors (at, method, path, route, kind, message, digest) VALUES (?, ?, ?, ?, ?, ?, ?)",
      new Date().toISOString(),
      request.method,
      pathOnly,
      context.routePath,
      context.routeType,
      message,
      digest
    );
    run("DELETE FROM server_errors WHERE id <= (SELECT MAX(id) FROM server_errors) - ?", KEEP);
  } catch {
    // 오류 기록이 실패해도 요청 처리에는 영향을 주지 않는다.
  }
}

export function recentServerErrors(limit = 30): ServerErrorEntry[] {
  return all<ServerErrorEntry>("SELECT * FROM server_errors ORDER BY id DESC LIMIT ?", limit);
}

/** 최근 24시간 동안의 서버 오류 수 */
export function countServerErrorsLastDay(): number {
  const since = new Date(Date.now() - 86_400_000).toISOString();
  return get<{ n: number }>("SELECT COUNT(*) AS n FROM server_errors WHERE at >= ?", since)?.n ?? 0;
}
