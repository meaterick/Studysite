import { NextRequest, NextResponse } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { findUserById } from "@/lib/userStore";
import { findSubmission, readSubmissionFile } from "@/lib/submissionStore";

export const runtime = "nodejs";

// 과제 첨부 파일 다운로드 — 제출한 본인과 관리자만 받을 수 있다.
// 업로드된 파일이 HTML/SVG여도 이 사이트 출처에서 실행되지 않도록 항상 첨부(download)로 내려준다.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  const user = session ? findUserById(session.uid) : undefined;
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const { id, fileId } = await params;
  const submission = findSubmission(id);
  if (!submission || (submission.userId !== user.id && user.role !== "admin")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const found = readSubmissionFile(submission, fileId);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const asciiName = found.file.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new NextResponse(new Uint8Array(found.bytes), {
    headers: {
      "content-type": "application/octet-stream",
      "content-length": String(found.bytes.length),
      "content-disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(found.file.name)}`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
}
