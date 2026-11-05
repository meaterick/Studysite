import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { modulesOfTrack } from "@/content/course";
import { LEARNING_FIELDS } from "@/content/fields";
import { getCurrentUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { isLessonComplete } from "@/lib/study";
import { trackHref } from "@/lib/routes";

export const metadata: Metadata = { title: "커리큘럼" };

export default async function CurriculumPage() {
  const user = await getCurrentUser();
  const record = user ? getLearningRecord(user.id) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        eyebrow="Aegis 스터디"
        title="커리큘럼"
        description="배우고 싶은 분야를 선택하세요. 분야별 모듈에서 다루는 주제와 레슨을 살펴본 뒤 원하는 곳에서 시작할 수 있습니다."
        actions={user ? <Link href="/progress" className="btn btn-secondary">내 학습 진도</Link> : undefined}
      />

      <section aria-labelledby="structure">
        <h2 id="structure" className="section-title mb-5 scroll-mt-24">분야별 과정 구성</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEARNING_FIELDS.map((field) => {
            const modules = modulesOfTrack(field.id);
            const lessons = modules.flatMap((module) => module.lessons);
            const done = record ? lessons.filter((lesson) => isLessonComplete(record, lesson.id)).length : 0;
            return (
              <li key={field.id}>
                <Link
                  href={trackHref(field.id)}
                  className="group flex h-full flex-col rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card-2)] p-6 transition hover:border-[var(--border-strong)]"
                >
                  <span className="mb-3 flex items-center justify-between gap-3">
                    <span aria-hidden="true" className="h-1 w-8 rounded-full" style={{ background: field.color }} />
                    <Icon name="arrowRight" size={16} className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </span>
                  <h3 className="text-lg font-semibold text-ink">{field.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{field.description}</p>
                  <p className="mt-3 flex-1 text-xs leading-relaxed text-ink-muted">{field.topics.join(" · ")}</p>
                  <p className="mt-5 border-t border-[var(--border-hairline)] pt-3 text-xs tabular-nums text-ink-muted">
                    모듈 {modules.length}개 · {record ? `레슨 ${done}/${lessons.length} 완료` : `레슨 ${lessons.length}개`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="guides-heading" className="mt-14 border-t border-[var(--border-hairline)] pt-8">
        <h2 id="guides-heading" className="section-title">학습을 계획할 때</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          처음 방문했다면 학습 안내를, 여러 분야를 차례로 공부하고 싶다면 추천 일정을 살펴보세요.
        </p>
        <nav aria-label="학습 안내" className="mt-5 flex flex-wrap gap-3">
          <Link href={trackHref("intro")} className="btn btn-secondary">학습 안내</Link>
          <Link href="/curriculum/details#structure" className="btn btn-secondary">전체 모듈·레슨 목록</Link>
          <Link id="goals" href="/curriculum/details#goals" className="btn btn-secondary scroll-mt-24">분야별 학습 목표</Link>
          <Link id="method" href="/curriculum/details#method" className="btn btn-secondary scroll-mt-24">학습 방법</Link>
          <Link id="concepts" href="/curriculum/details#concepts" className="btn btn-secondary scroll-mt-24">개념과 선수관계</Link>
          <Link id="schedule" href="/curriculum/details#schedule" className="btn btn-secondary scroll-mt-24">추천 일정</Link>
        </nav>
      </section>
    </div>
  );
}
