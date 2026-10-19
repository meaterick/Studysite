import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { apiUser } from "@/lib/apiAuth";
import { recordSecurityEvent, securityRequest } from "@/lib/securityEvents";
import { findSubmission, openNotebook } from "@/lib/submissionStore";
import { consumeRate, RATE_RULES } from "@/lib/rateLimit";

export const runtime = "nodejs";

// 제출 버전 하나의 작업 공간(노트북) — 제출한 본인과 관리자만 받을 수 있다.
// 제출 기록 화면은 최신 제출본만 서버에서 그리고, 이전 제출본은 펼칠 때 이 경로로 그 버전 하나만 받아 온다.
// (모든 버전을 한 페이지에 그리면 제출이 쌓일수록 요청 하나가 서버 메모리를 크게 쓴다.) 파일은 해석하지 않고 그대로 흘려보낸다.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; version: string }> }) {
  const user = await apiUser(request);
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  if (!consumeRate(`notebook:${user.id}`, RATE_RULES.notebookRead)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { id, version } = await params;
  const submission = findSubmission(id);
  if (!submission || (submission.userId !== user.id && user.role !== "admin")) {
    recordSecurityEvent("forbidden", { ...securityRequest(request, user.id), status: 404 });
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const found = /^\d{1,4}$/.test(version) ? submission.versions.find((v) => v.version === Number(version)) : undefined;
  const notebook = found ? openNotebook(submission, found) : null;
  if (!notebook) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(Readable.toWeb(notebook.stream) as ReadableStream<Uint8Array>, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-length": String(notebook.size),
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
}
