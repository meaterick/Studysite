import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { findUserById } from "@/lib/userStore";
import { openBackup } from "@/lib/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DB 백업 내려받기(관리자 전용). 서버 디스크가 고장 나도 데이터가 남도록 운영자가 서버 밖에 보관하는 용도다.
// 파일 이름은 정해진 형식만 받아, 백업 폴더 밖의 파일을 읽을 수 없다.
export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  const user = session ? findUserById(session.uid) : undefined;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { name } = await params;
  const backup = openBackup(name);
  if (!backup) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = Readable.toWeb(backup.stream) as ReadableStream<Uint8Array>;
  return new NextResponse(body, {
    headers: {
      "content-type": name.endsWith(".gz") ? "application/gzip" : "application/vnd.sqlite3",
      "content-length": String(backup.size),
      "content-disposition": `attachment; filename="${name}"`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
}
