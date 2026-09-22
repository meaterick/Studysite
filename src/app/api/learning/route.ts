import { NextRequest, NextResponse } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { findUserById } from "@/lib/userStore";
import { normalizeProgress, normalizeReviews, saveLearningProgress, saveQuizReviews } from "@/lib/learningStore";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session || !findUserById(session.uid)) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  if (payload.type === "progress") {
    const progress = normalizeProgress(payload.progress);
    if (!progress) return NextResponse.json({ error: "invalid_progress" }, { status: 400 });
    await saveLearningProgress(session.uid, progress);
    return NextResponse.json({ ok: true });
  }

  if (payload.type === "quiz_reviews" && typeof payload.slug === "string" && /^[a-z0-9-]{1,48}$/i.test(payload.slug)) {
    const reviews = normalizeReviews(payload.reviews);
    if (!reviews) return NextResponse.json({ error: "invalid_reviews" }, { status: 400 });
    await saveQuizReviews(session.uid, payload.slug, reviews);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
}
