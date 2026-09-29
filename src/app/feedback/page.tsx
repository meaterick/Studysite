import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { memberFeedback, type FeedbackKind } from "@/lib/feedback";
import { formatDateTime } from "@/lib/datetime";
import MarkFeedbackSeen from "@/components/feedback/MarkFeedbackSeen";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <MarkFeedbackSeen hasNew={fb.newCount > 0} />
      <h1 className="text-3xl font-black text-ink">피드백함</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        채점 결과, 운영자 코멘트, 재제출 요청, 채팅, 복습이 필요한 문제를 한곳에 모았습니다.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="새 피드백" value={fb.newCount} tone={fb.newCount > 0 ? "var(--series-orange)" : undefined} />
        <Stat label="재제출 요청" value={openRevisions.length} tone={openRevisions.length > 0 ? "var(--status-serious)" : undefined} />
        <Stat label="읽지 않은 채팅" value={fb.chatUnread} tone={fb.chatUnread > 0 ? "var(--series-orange)" : undefined} />
        <Stat label="복습할 단계" value={fb.review.length} />
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

      <section aria-labelledby="review-heading" className="mt-10">
        <h2 id="review-heading" className="mb-1 text-xl font-black text-ink">
          복습이 필요한 곳
        </h2>
        <p className="mb-3 text-sm text-ink-muted">한 번이라도 틀린 확인 문제와 &lsquo;보완이 필요합니다&rsquo;로 표시한 서술형·백지공부입니다.</p>
        {fb.review.length === 0 && fb.weakWorksheet.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border-hairline)] p-5 text-sm text-ink-muted">복습할 문제가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {fb.review.map((r) => (
              <li key={`${r.weekSlug}:${r.sectionNumber}`}>
                <Link
                  href={r.href}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-hairline)] bg-card px-4 py-3 transition hover:border-[var(--series-blue)]"
                >
                  <span className="min-w-0 text-sm">
                    <strong className="text-ink">
                      {r.weekNumber}주차 {r.sectionNumber}단계
                    </strong>{" "}
                    <span className="text-ink-secondary">{r.sectionTitle}</span>
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
                </Link>
              </li>
            ))}
            {fb.weakWorksheet.map((w) => (
              <li key={`ws:${w.weekSlug}`}>
                <Link
                  href={`/weeks/${w.weekSlug}/worksheet`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-hairline)] bg-card px-4 py-3 transition hover:border-[var(--series-blue)]"
                >
                  <span className="text-sm">
                    <strong className="text-ink">{w.weekNumber}주차 백지공부</strong>
                  </span>
                  <span className="text-xs font-bold text-[var(--status-serious)]">보완 필요 {w.count}칸</span>
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
