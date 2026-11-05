import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { memberFeedback, type FeedbackKind } from "@/lib/feedback";
import { formatDateTime } from "@/lib/datetime";
import MarkFeedbackSeen from "@/components/feedback/MarkFeedbackSeen";
import PageHeader from "@/components/PageHeader";
import NextStep from "@/components/NextStep";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "피드백함" };

const KIND: Record<FeedbackKind, { label: string; color: string }> = {
  grade: { label: "채점 결과", color: "var(--status-good)" },
  revision: { label: "재제출 요청", color: "var(--status-serious)" },
  chat: { label: "운영자 채팅", color: "var(--accent)" },
};

/** 피드백함: 운영자가 남긴 채점·재제출 요청·채팅과, 모듈별로 다시 볼 문항을 한곳에서 보여 준다. */
export default async function FeedbackPage() {
  const user = await requireUser("/feedback");
  if (user.role === "admin") redirect("/operator");
  const record = getLearningRecord(user.id);
  const fb = memberFeedback(user.id, record);
  const openRevisions = fb.items.filter((i) => i.kind === "revision");
  const reviewTotal = fb.review.reduce((sum, r) => sum + r.open, 0);
  const firstWeak = fb.review.find((r) => r.open > 0);

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
          eyebrow="복습할 문항"
          title={`${firstWeak.moduleCode} ${firstWeak.moduleTitle}`}
          detail={`다시 볼 문항 ${firstWeak.open}개`}
          href={firstWeak.href}
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
        <p className="mb-5 text-sm leading-relaxed text-ink-muted">
          틀린 적 있는 확인 문제, 보완 필요로 표시한 서술형과 백지 복습 문항, 정답을 먼저 확인한 출력 예측을 모듈별로 모았습니다.
        </p>
        {fb.review.length === 0 ? (
          <p className="border-y border-[var(--border-hairline)] py-10 text-center text-sm text-ink-muted">다시 볼 문항이 없습니다.</p>
        ) : (
          <ul className="rows border-y border-[var(--border-hairline)]">
            {fb.review.map((r) => (
              <li key={r.moduleSlug}>
                <Link href={r.href} className="group row-hover -mx-3 block rounded-xl px-3 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[15px] font-medium text-ink">
                      <span className="mr-2 font-mono text-xs text-ink-muted">{r.moduleCode}</span>
                      {r.moduleTitle}
                    </p>
                    <span className={`flex shrink-0 items-center gap-2 text-xs tabular-nums ${r.open > 0 ? "text-[var(--status-critical)]" : "text-ink-muted"}`}>
                      {r.open > 0 ? `남은 문항 ${r.open}` : "모두 해결"}
                      <Icon name="chevronRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[13px] text-ink-muted">
                    {r.lessons.map((l) => (
                      <li key={l.lessonId} className="flex flex-wrap justify-between gap-x-3">
                        <span className="min-w-0">
                          {l.label} · {l.title}
                        </span>
                        <span className="tabular-nums">
                          {[
                            l.wrongChecks > 0 && `확인 문제 ${l.wrongChecks}${l.recovered > 0 ? `(정답 ${l.recovered})` : ""}`,
                            l.weakAnswers > 0 && `서술형 ${l.weakAnswers}`,
                            l.revealedPredicts > 0 && `출력 예측 ${l.revealedPredicts}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                    {r.weakRecall > 0 && (
                      <li className="flex justify-between gap-x-3">
                        <span>백지 복습</span>
                        <span className="tabular-nums">보완 필요 {r.weakRecall}문항</span>
                      </li>
                    )}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
