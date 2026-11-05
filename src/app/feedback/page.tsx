import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { reviewModules } from "@/lib/feedback";
import PageHeader from "@/components/PageHeader";
import NextStep from "@/components/NextStep";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "내 복습" };

export default async function FeedbackPage() {
  const user = await requireUser("/feedback");
  if (user.role === "admin") redirect("/operator");
  const record = getLearningRecord(user.id);
  const review = reviewModules(record);
  const reviewTotal = review.reduce((sum, r) => sum + r.open, 0);
  const firstWeak = review.find((r) => r.open > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        title="내 복습"
        actions={
          <Link href="/chat" className="btn btn-secondary">
            <Icon name="message" size={15} />
            운영자에게 질문
          </Link>
        }
      />

      {firstWeak ? (
        <NextStep
          eyebrow="복습할 문항"
          title={`${firstWeak.moduleCode} ${firstWeak.moduleTitle}`}
          detail={`다시 볼 문항 ${firstWeak.open}개`}
          href={firstWeak.href}
          cta="복습 노트 열기"
        />
      ) : null}

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
        {review.length === 0 ? (
          <p className="border-y border-[var(--border-hairline)] py-10 text-center text-sm text-ink-muted">다시 볼 문항이 없습니다.</p>
        ) : (
          <ul className="rows border-y border-[var(--border-hairline)]">
            {review.map((r) => (
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
