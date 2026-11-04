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
import PageHeader from "@/components/PageHeader";
import NextStep from "@/components/NextStep";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "피드백함" };

const KIND: Record<FeedbackKind, { label: string; color: string }> = {
  grade: { label: "채점 결과", color: "var(--status-good)" },
  revision: { label: "재제출 요청", color: "var(--status-serious)" },
  chat: { label: "운영자 채팅", color: "var(--accent)" },
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
  const firstWeak = reviewWeeks.find((w) => w.weak > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <MarkFeedbackSeen hasNew={fb.newCount > 0} />
      <PageHeader
        title="피드백함"
        actions={
          <Link href="/chat" className="btn btn-secondary">
            <Icon name="message" size={15} />
            운영자에게 질문
          </Link>
        }
      />

      {openRevisions.length > 0 ? (
        <NextStep
          eyebrow="재제출 요청"
          title={openRevisions[0].title}
          detail={openRevisions.length > 1 ? `재제출을 기다리는 과제 ${openRevisions.length}개` : undefined}
          href={openRevisions[0].href}
          cta="확인하고 다시 제출"
        />
      ) : firstWeak ? (
        <NextStep
          eyebrow="복습할 차례"
          title={`${firstWeak.week.number}주차 다시 볼 문항 ${firstWeak.weak}개`}
          href={`/feedback/review/${firstWeak.week.slug}`}
          cta="복습 노트 열기"
        />
      ) : null}

      <section aria-labelledby="operator-heading" className="mt-16">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="operator-heading" className="section-title">
            운영자 피드백
          </h2>
          {(fb.newCount > 0 || fb.chatUnread > 0) && (
            <p className="text-[13px] text-ink-muted">
              {fb.newCount > 0 && <span className="text-[var(--accent)]">새 피드백 {fb.newCount}</span>}
              {fb.newCount > 0 && fb.chatUnread > 0 && " · "}
              {fb.chatUnread > 0 && `읽지 않은 채팅 ${fb.chatUnread}`}
            </p>
          )}
        </div>
        {fb.items.length === 0 ? (
          <p className="border-y border-[var(--border-hairline)] py-10 text-center text-sm text-ink-muted">아직 받은 피드백이 없습니다.</p>
        ) : (
          <ul className="rows border-y border-[var(--border-hairline)]">
            {fb.items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="group row-hover -mx-3 block rounded-xl px-3 py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="flex items-center gap-1.5 text-ink-secondary">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: KIND[item.kind].color }} />
                      {KIND[item.kind].label}
                    </span>
                    {item.isNew && <span className="pill [--pill:var(--accent)]">새 알림</span>}
                    <span className="ml-auto tabular-nums text-ink-muted">{formatDateTime(item.at)}</span>
                  </div>
                  <p className="mt-2 text-[15px] font-medium text-ink">{item.title}</p>
                  {item.detail && <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">{item.detail}</p>}
                  {item.comments && <p className="mt-1.5 text-xs text-ink-muted">과제별 코멘트 {item.comments}개</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="review" aria-labelledby="review-heading" className="mt-16 scroll-mt-24">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="review-heading" className="section-title">
            복습 노트
          </h2>
          {reviewTotal > 0 && <p className="text-[13px] tabular-nums text-[var(--status-critical)]">다시 볼 문항 {reviewTotal}</p>}
        </div>
        <nav aria-label="주차별 복습 노트" className="mb-6 flex flex-wrap gap-1">
          {reviewWeeks.map(({ week, weak }) => (
            <Link key={week.slug} href={`/feedback/review/${week.slug}`} className="chip border border-[var(--border-hairline)]">
              {week.number}주차
              {weak > 0 && <span className="tabular-nums text-[var(--status-critical)]">{weak}</span>}
            </Link>
          ))}
        </nav>
        {reviewTotal === 0 ? (
          <p className="border-y border-[var(--border-hairline)] py-10 text-center text-sm text-ink-muted">다시 볼 문항이 없습니다.</p>
        ) : (
          <ul className="rows border-y border-[var(--border-hairline)]">
            {reviewWeeks
              .filter((w) => w.weak > 0)
              .map(({ week, weak, sections, sheet }) => (
                <li key={week.slug}>
                  <Link href={`/feedback/review/${week.slug}`} className="group row-hover -mx-3 block rounded-xl px-3 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-[15px] font-medium text-ink">
                        {week.number}주차 · {week.title}
                      </p>
                      <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-[var(--status-critical)]">
                        {weak}
                        <Icon name="chevronRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                      </span>
                    </div>
                    {(sections.length > 0 || sheet > 0) && (
                      <ul className="mt-2 space-y-1 text-[13px] text-ink-muted">
                        {sections.map((r) => (
                          <li key={r.sectionId} className="flex flex-wrap justify-between gap-x-3">
                            <span className="min-w-0">
                              {r.sectionLabel}. {r.sectionTitle}
                            </span>
                            <span className="tabular-nums">
                              {[r.wrongChecks > 0 && `확인 문제 ${r.wrongChecks}`, r.weakAnswers > 0 && `서술형 ${r.weakAnswers}`].filter(Boolean).join(" · ")}
                            </span>
                          </li>
                        ))}
                        {sheet > 0 && (
                          <li className="flex justify-between gap-x-3">
                            <span>백지공부</span>
                            <span className="tabular-nums">보완 필요 {sheet}칸</span>
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
    </div>
  );
}
