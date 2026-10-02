import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { memberFeedback, type FeedbackKind } from "@/lib/feedback";
import { formatDateTime } from "@/lib/datetime";
import MarkFeedbackSeen from "@/components/feedback/MarkFeedbackSeen";
import { WEEKS } from "@/content/weeks";
import { weekStatus } from "@/lib/study";
import { applySummary } from "@/lib/applyView";

export const metadata: Metadata = { title: "피드백함" };

const KIND: Record<FeedbackKind, { label: string; color: string }> = {
  grade: { label: "채점 결과", color: "var(--status-good)" },
  revision: { label: "재제출 요청", color: "var(--status-serious)" },
  chat: { label: "운영자 채팅", color: "var(--series-orange)" },
};

export default async function FeedbackPage() {
  const user = await requireUser("/feedback");
  if (user.role === "admin") redirect("/operator");
  const record = getLearningRecord(user.id);
  const fb = memberFeedback(user.id, record);
  const openRevisions = fb.items.filter((i) => i.kind === "revision");
  // 복습: 주차별 복습 노트(다시 볼 문항 수)와 그 주의 단계·백지공부 목록
  const reviewWeeks = WEEKS.map((week) => ({
    week,
    weak: applySummary(week, record, weekStatus(week, record)).reviewWeak,
    sections: fb.review.filter((r) => r.weekSlug === week.slug),
    sheet: fb.weakWorksheet.find((w) => w.weekSlug === week.slug)?.count ?? 0,
  }));
  const reviewTotal = reviewWeeks.reduce((sum, w) => sum + w.weak, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <MarkFeedbackSeen hasNew={fb.newCount > 0} />
      <h1 className="text-3xl font-black text-ink">피드백함</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        운영자 피드백 · 복습 노트
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="새 피드백" value={fb.newCount} tone={fb.newCount > 0 ? "var(--series-orange)" : undefined} />
        <Stat label="재제출 요청" value={openRevisions.length} tone={openRevisions.length > 0 ? "var(--status-serious)" : undefined} />
        <Stat label="읽지 않은 채팅" value={fb.chatUnread} tone={fb.chatUnread > 0 ? "var(--series-orange)" : undefined} />
        <Stat label="다시 볼 문항" value={reviewTotal} tone={reviewTotal > 0 ? "var(--status-critical)" : undefined} />
      </div>

      <section aria-labelledby="operator-heading" className="mt-10">
        <h2 id="operator-heading" className="mb-3 text-xl font-black text-ink">
          운영자 피드백
        </h2>
        {fb.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border-hairline)] p-5 text-sm text-ink-muted">
            아직 받은 피드백이 없습니다. 과제를 제출하면 채점 결과와 코멘트가 이곳에 표시됩니다.
          </p>
        ) : (
          <ul className="space-y-3">
            {fb.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`block rounded-xl border bg-card p-4 transition hover:border-[var(--series-blue)] ${
                    item.isNew ? "border-[var(--series-orange)]" : "border-[var(--border-hairline)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ color: KIND[item.kind].color, background: `color-mix(in srgb, ${KIND[item.kind].color} 12%, transparent)` }}
                    >
                      {KIND[item.kind].label}
                    </span>
                    {item.isNew && (
                      <span className="rounded-full bg-[var(--series-orange)] px-2 py-0.5 text-[11px] font-bold text-white">새 알림</span>
                    )}
                    <span className="ml-auto text-xs text-ink-muted">{formatDateTime(item.at)}</span>
                  </div>
                  <p className="mt-2 font-bold text-ink">{item.title}</p>
                  {item.detail && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-ink-secondary">{item.detail}</p>}
                  {item.comments && (
                    <p className="mt-1 text-xs font-bold text-[var(--series-blue)]">과제별 코멘트 {item.comments}개 · 과제 탭의 제출 기록에서 확인</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="review" aria-labelledby="review-heading" className="mt-10 scroll-mt-24">
        <h2 id="review-heading" className="mb-3 text-xl font-black text-ink">
          복습
        </h2>
        <nav aria-label="주차별 복습 노트" className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm font-black text-ink">복습 노트</span>
          {reviewWeeks.map(({ week, weak }) => (
            <Link
              key={week.slug}
              href={`/feedback/review/${week.slug}`}
              className={`rounded-full border px-2.5 py-1 text-xs font-bold transition hover:border-[var(--series-blue)] ${
                weak > 0
                  ? "border-[color-mix(in_srgb,var(--status-critical)_45%,transparent)] text-[var(--status-critical)]"
                  : "border-[var(--border-hairline)] text-ink-secondary"
              }`}
            >
              {week.number}주차{weak > 0 && ` · ${weak}`}
            </Link>
          ))}
        </nav>
        {reviewTotal === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border-hairline)] p-5 text-sm text-ink-muted">다시 볼 문항이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {reviewWeeks
              .filter((w) => w.weak > 0)
              .map(({ week, weak, sections, sheet }) => (
                <li key={week.slug}>
                  <Link
                    href={`/feedback/review/${week.slug}`}
                    className="block rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 font-black text-ink">
                        {week.number}주차 <span className="font-bold text-ink-secondary">{week.title}</span>
                      </p>
                      <span className="text-xs font-bold">
                        <span className="text-[var(--status-critical)]">다시 볼 문항 {weak}</span>
                        <span className="ml-2 text-[var(--series-blue)]">복습 노트 →</span>
                      </span>
                    </div>
                    {(sections.length > 0 || sheet > 0) && (
                      <ul className="mt-3 space-y-1.5 border-t border-[var(--border-hairline)] pt-3 text-sm">
                        {sections.map((r) => (
                          <li key={r.sectionId} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                            <span className="min-w-0">
                              <strong className="text-ink">{r.sectionLabel}단계</strong> <span className="text-ink-secondary">{r.sectionTitle}</span>
                            </span>
                            <span className="flex flex-wrap gap-2 text-xs font-bold">
                              {r.wrongChecks > 0 && (
                                <span className="text-[var(--status-critical)]">
                                  틀린 확인 문제 {r.wrongChecks}
                                  {r.recovered > 0 && <span className="font-medium text-ink-muted"> (다시 맞힘 {r.recovered})</span>}
                                </span>
                              )}
                              {r.weakAnswers > 0 && <span className="text-[var(--status-serious)]">보완 필요 서술형 {r.weakAnswers}</span>}
                            </span>
                          </li>
                        ))}
                        {sheet > 0 && (
                          <li className="flex flex-wrap items-center justify-between gap-x-3">
                            <strong className="text-ink">백지공부</strong>
                            <span className="text-xs font-bold text-[var(--status-serious)]">보완 필요 {sheet}칸</span>
                          </li>
                        )}
                      </ul>
                    )}
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-sm text-ink-muted">
        궁금한 점은{" "}
        <Link href="/chat" className="font-bold text-[var(--series-blue)] hover:underline">
          운영자 채팅
        </Link>
        으로 물어볼 수 있습니다.
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: tone ?? "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
