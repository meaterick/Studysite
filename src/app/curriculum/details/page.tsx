import type { Metadata } from "next";
import Link from "next/link";
import { CONCEPTS, CORE_PATH, COURSE, MODULES, TRACKS, getConcept, getModule, lessonsOfConcept, modulesOfTrack } from "@/content/course";
import { LEARNING_FIELDS, learningField } from "@/content/fields";
import { CAPSTONE_PLAN } from "@/content/curriculum/capstone-plan";
import { SCHEDULE } from "@/content/curriculum/schedule";
import { TIER_INFO, TIER_ORDER } from "@/content/tiers";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { getCurrentUser } from "@/lib/dal";
import { emptyRecord, getLearningRecord } from "@/lib/learningStore";
import { isLessonComplete } from "@/lib/study";
import { gatedHref, loginHref } from "@/lib/returnPath";
import { lessonHref, moduleHref, trackHref } from "@/lib/routes";

export const metadata: Metadata = { title: "커리큘럼 상세" };

// 분야별 레슨 목록과 선수관계, 추천 일정은 누구나 볼 수 있다. 레슨을 열려면 로그인한다.

function Section({ id, title, children, ruled = true }: { id: string; title: string; children: React.ReactNode; ruled?: boolean }) {
  return (
    <section aria-labelledby={id} className={ruled ? "border-t border-[var(--border-hairline)] pt-10" : ""}>
      <h2 id={id} className="section-title mb-8 scroll-mt-24">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function CurriculumDetailsPage() {
  const user = await getCurrentUser();
  const record = user ? getLearningRecord(user.id) : emptyRecord();
  const href = (path: string) => gatedHref(!!user, path);
  const coreMinutes = CORE_PATH.reduce((sum, l) => sum + l.minutes, 0);
  const mainTracks = TRACKS.filter((t) => t.id !== "extension");
  const extension = TRACKS.find((t) => t.id === "extension")!;
  const moduleTitle = (slug: string) => {
    const m = getModule(slug);
    return m ? `${m.code} ${m.title}` : slug;
  };
  const assignmentTitle = (key: string) => MODULES.find((m) => m.assignment?.key === key)?.assignment?.title ?? key;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        back={{ href: "/curriculum", label: "커리큘럼" }}
        eyebrow="Aegis 스터디"
        title="커리큘럼 상세"
        description="분야별 학습 목표와 전체 모듈·레슨 목록을 확인하십시오. 개념별 선수관계와 추천 일정도 확인할 수 있습니다."
        actions={
          user ? (
            <Link href="/progress" className="btn btn-primary">
              내 진도
            </Link>
          ) : (
            <Link href={loginHref("/curriculum/details")} className="btn btn-primary">
              로그인하고 시작하기
            </Link>
          )
        }
      />

      <dl className="mb-16 grid grid-cols-2 divide-[var(--border-hairline)] border-y border-[var(--border-hairline)] sm:grid-cols-4 sm:divide-x">
        {[
          { k: "구성", v: `분야 ${LEARNING_FIELDS.length}개 · 모듈 ${MODULES.length}개` },
          { k: "핵심 레슨", v: `${CORE_PATH.length}개 · 개념 ${CONCEPTS.length}개` },
          { k: "핵심 학습 시간", v: `약 ${Math.round(coreMinutes / 60)}시간` },
          { k: "추천 일정", v: `${SCHEDULE.length}주` },
        ].map((f) => (
          <div key={f.k} className="px-4 py-5 first:pl-0 sm:px-6">
            <dt className="text-xs text-ink-muted">{f.k}</dt>
            <dd className="mt-1.5 text-[15px] font-semibold tracking-[-0.02em] text-ink">{f.v}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-16">
        <Section id="structure" title="분야별 모듈과 레슨" ruled={false}>
          <ol className="space-y-12">
            {mainTracks.map((track) => (
              <li key={track.id}>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                  <Link href={trackHref(track.id)} className="group flex items-baseline gap-3">
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 translate-y-[-2px] rounded-full" style={{ background: track.color }} />
                    <span className="kicker">분야 {track.code}</span>
                    <span className="text-lg font-semibold tracking-[-0.02em] text-ink group-hover:underline group-hover:underline-offset-4">{learningField(track.id).title}</span>
                  </Link>
                  <span className="text-[13px] text-ink-muted">{learningField(track.id).description}</span>
                </div>
                <div className="rows border-y border-[var(--border-hairline)]">
                  {modulesOfTrack(track.id).map((m) => {
                    const core = m.lessons.filter((l) => l.tier === "core");
                    const done = core.filter((l) => isLessonComplete(record, l.id)).length;
                    return (
                      <details key={m.slug} className="group">
                        <summary className="row-hover -mx-3 flex cursor-pointer list-none items-center gap-4 rounded-xl px-3 py-3.5 [&::-webkit-details-marker]:hidden">
                          <span className="w-9 shrink-0 font-mono text-xs text-ink-muted">{m.code}</span>
                          <span className="min-w-0 flex-1">
                            <span className="text-[15px] font-medium text-ink">{m.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-ink-muted">{m.summary}</span>
                          </span>
                          <span className="shrink-0 text-[13px] tabular-nums text-ink-muted">
                            {user ? `${done}/${core.length}` : `레슨 ${core.length}`}
                            {m.assignment && " · 과제"}
                          </span>
                          <Icon name="chevronDown" size={16} className="shrink-0 text-ink-muted transition group-open:rotate-180" />
                        </summary>
                        <div className="pb-4 pl-[3.25rem]">
                          <ol className="space-y-1.5">
                            {m.lessons.map((l) => {
                              const concepts = (l.concepts ?? []).map((c) => getConcept(c)!.order);
                              return (
                                <li key={l.id} className="flex items-baseline gap-2 text-sm">
                                  {isLessonComplete(record, l.id) ? (
                                    <Icon name="check" size={13} className="shrink-0 translate-y-[2px] text-[var(--status-good)]" />
                                  ) : (
                                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full" style={{ background: TIER_INFO[l.tier].color }} />
                                  )}
                                  <Link href={href(lessonHref(m.slug, l.id))} prefetch={user ? undefined : false} className="min-w-0 text-ink-secondary transition hover:text-ink">
                                    {l.title}
                                  </Link>
                                  {concepts.length > 0 && <span className="shrink-0 text-xs text-ink-muted">{concepts.map((n) => `#${n}`).join(" ")}</span>}
                                  {l.tier !== "core" && <span className="shrink-0 text-xs text-ink-muted">{TIER_INFO[l.tier].label} · 선택</span>}
                                </li>
                              );
                            })}
                          </ol>
                          <Link href={href(moduleHref(m.slug))} prefetch={user ? undefined : false} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-ink">
                            모듈 개요
                            <Icon name="arrowRight" size={13} />
                          </Link>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </li>
            ))}
            <li>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <Link href={trackHref(extension.id)} className="group flex items-baseline gap-3">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 translate-y-[-2px] rounded-full" style={{ background: extension.color }} />
                  <span className="kicker">분야 {extension.code}</span>
                  <span className="text-lg font-semibold tracking-[-0.02em] text-ink group-hover:underline group-hover:underline-offset-4">{learningField(extension.id).title}</span>
                </Link>
                <span className="text-[13px] text-ink-muted">{learningField(extension.id).description}</span>
              </div>
              <ul className="rows border-y border-[var(--border-hairline)]">
                {modulesOfTrack("extension").map((m) => (
                  <li key={m.slug}>
                    <Link href={href(moduleHref(m.slug))} prefetch={user ? undefined : false} className="group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5">
                      <span className="w-9 shrink-0 font-mono text-xs text-ink-muted">{m.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[15px] font-medium text-ink">{m.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink-muted">{m.summary}</span>
                      </span>
                      <span className="shrink-0 text-[13px] text-ink-muted">선택 레슨 {m.lessons.length}개</span>
                      <Icon name="chevronRight" size={16} className="shrink-0 text-ink-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ol>
        </Section>

        <Section id="goals" title="분야별 학습 목표">
          <ol className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {COURSE.goals.map((g, i) => (
              <li key={i} className="flex gap-4">
                <span aria-hidden="true" className="w-6 shrink-0 pt-0.5 font-mono text-xs text-ink-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] leading-relaxed text-ink-body">{g.text}</span>
                  <span className="mt-1 block text-xs text-ink-muted">{g.tracks.map((t) => learningField(t).title).join(" · ")}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="method" title="학습 방식">
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">레슨 학습 절차</h3>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-secondary marker:text-ink-muted">
                <li>이 개념이 실제 문제나 다음 레슨에서 어떻게 쓰이는지 확인합니다.</li>
                <li>본문의 설명·손계산·실행 코드로 개념을 익힙니다.</li>
                <li>TODO 코딩 실습과 출력 예측으로 직접 확인합니다.</li>
                <li>확인 문제를 모두 맞히면 레슨을 완료합니다.</li>
                <li>서술형 답안으로 개념을 설명하고 모범 답안과 비교합니다(선택).</li>
              </ol>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">모듈 학습 절차</h3>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-secondary marker:text-ink-muted">
                <li>목표 문제를 읽고 이 모듈에서 무엇을 할 수 있게 되는지 확인합니다.</li>
                <li>핵심 레슨을 순서대로 마칩니다. 이미 아는 내용은 진단 평가로 인정받습니다.</li>
                <li>학습 자료를 보지 않고 백지 복습 답안을 작성한 뒤 학습 자료와 비교합니다.</li>
                <li>과제가 있는 모듈은 작업을 마친 뒤 자동 테스트와 자기 점검 기준으로 결과를 확인합니다.</li>
              </ol>
            </div>
          </div>
          <ul className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-3">
            {TIER_ORDER.map((tier) => {
              const info = TIER_INFO[tier];
              return (
                <li key={tier}>
                  <p className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: info.color }} />
                    <span className="text-[15px] font-semibold text-ink">{info.course}</span>
                    {!info.required && <span className="ml-auto text-xs text-ink-muted">선택</span>}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">{info.summary}</p>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section id="concepts" title="80개 개념과 선수관계">
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-ink-muted">
            개념을 다루는 핵심 레슨에는 개념 번호가 붙으며, 하나의 개념이 여러 레슨으로 나뉠 수 있습니다. 선수 개념은 그 개념을 배우기 전에 알아야 하는 개념이며, 기본 학습 순서는 선수 개념을 먼저 학습하도록 구성되어 있습니다.
          </p>
          {mainTracks
            .filter((t) => CONCEPTS.some((c) => c.track === t.id))
            .map((track) => (
              <details key={track.id} className="group border-t border-[var(--border-hairline)]">
                <summary className="row-hover -mx-3 flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-3.5 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: track.color }} />
                  <span className="flex-1 text-[15px] font-medium text-ink">
                    {track.code}. {learningField(track.id).title}
                  </span>
                  <span className="text-[13px] text-ink-muted">{CONCEPTS.filter((c) => c.track === track.id).length}개</span>
                  <Icon name="chevronDown" size={16} className="text-ink-muted transition group-open:rotate-180" />
                </summary>
                <ol className="rows pb-4">
                  {CONCEPTS.filter((c) => c.track === track.id).map((c) => (
                    <li key={c.id} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[3rem_1fr_auto] sm:gap-4">
                      <span className="font-mono text-xs text-ink-muted">#{c.order}</span>
                      <span className="min-w-0">
                        <span className="font-medium text-ink">{c.title}</span>
                        <span className="ml-2 inline-flex flex-wrap gap-x-2 text-[13px]">
                          {lessonsOfConcept(c.id).map((l) => (
                            <Link key={l.id} href={href(lessonHref(l.module, l.id))} prefetch={user ? undefined : false} className="text-ink-muted transition hover:text-ink">
                              {l.title}
                            </Link>
                          ))}
                        </span>
                      </span>
                      <span className="text-xs text-ink-muted">{c.requires.length > 0 ? `선수 ${c.requires.map((r) => `#${getConcept(r)!.order}`).join(" ")}` : "선수 없음"}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
        </Section>

        <Section id="capstone-plan" title="캡스톤 단계별 준비">
          <p className="mb-5 text-sm text-ink-muted">추천 일정의 단계에 따라 준비하십시오. 레슨의 잠금 여부와 관계없이 이 안내를 볼 수 있습니다.</p>
          <ol className="rows border-y border-[var(--border-hairline)]">
            {CAPSTONE_PLAN.map((step) => (
              <li key={step.week} className="grid gap-2 py-4 text-sm sm:grid-cols-[12rem_1fr] sm:gap-4">
                <span><strong className="block text-ink">{step.title}</strong><span className="text-xs text-ink-muted">{step.timing}</span></span>
                <span className="text-ink-secondary">{step.task}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="schedule" title={`추천 일정 (${SCHEDULE.length}주)`}>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-ink-muted">
            여러 분야를 순서대로 공부할 때 참고할 수 있는 주당 4~7시간 일정입니다. 기수 시작일을 정하면 진도 화면에서 이번 주 학습 범위를 확인할 수 있습니다.
          </p>
          <ol className="rows border-y border-[var(--border-hairline)]">
            {SCHEDULE.map((w) => (
              <li key={w.week} className="grid gap-1 py-3 text-sm sm:grid-cols-[4rem_1fr_16rem] sm:gap-4">
                <span className="font-mono text-xs text-ink-muted">{w.week}주</span>
                <span className="text-ink-secondary">{w.modules.map(moduleTitle).join(" · ")}</span>
                <span className="text-xs text-ink-muted">{[...w.due.map(assignmentTitle), ...(w.milestone ? [`캡스톤 준비: ${w.milestone}`] : [])].join(" · ")}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}
