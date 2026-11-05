import Link from "next/link";
import { Suspense } from "react";
import { CONCEPTS, CORE_PATH, COURSE, MODULES, TRACKS, getModule, modulesOfTrack } from "@/content/course";
import { SCHEDULE } from "@/content/curriculum/schedule";
import HomeCta from "@/components/HomeCta";
import NextStep from "@/components/NextStep";
import Icon from "@/components/Icon";
import { getCurrentUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { courseProgress } from "@/lib/study";
import { lessonHref, trackHref } from "@/lib/routes";

// 메인 화면: 과정 전체를 위에서 아래로 보여 준다(수료 목표 → 트랙 → 레슨의 학습 방식).
// 로그인한 사용자에게는 필수 경로에서 다음에 할 레슨을 가장 먼저 보여 준다.

export default async function Home() {
  const user = await getCurrentUser();
  const progress = user ? courseProgress(getLearningRecord(user.id)) : undefined;
  const coreHours = Math.round(CORE_PATH.reduce((sum, l) => sum + l.minutes, 0) / 60);
  const next = progress?.next;
  const nextModule = next ? getModule(next.module) : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <section aria-labelledby="hero-heading" className="max-w-3xl">
        <p className="kicker">Aegis AI 스터디</p>
        <h1 id="hero-heading" className="mt-4 text-[2.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-ink sm:text-6xl">
          {COURSE.title}
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-ink-secondary">
          파이썬과 수학 기초에서 시작해 데이터 처리, 머신러닝, 딥러닝, 대규모 언어 모델과 RAG·에이전트까지 하나의 경로로 학습합니다. 모든 실습은 설치 없이 브라우저에서 실행합니다.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-11 w-64 rounded-full bg-[var(--surface-card-2)]" />}>
            <HomeCta />
          </Suspense>
        </div>
        <dl className="mt-12 grid grid-cols-2 gap-y-6 border-t border-[var(--border-hairline)] pt-6 sm:grid-cols-4">
          {[
            { v: `${CONCEPTS.length}개`, l: "개념" },
            { v: `${CORE_PATH.length}개`, l: "핵심 레슨" },
            { v: `약 ${coreHours}시간`, l: "핵심 학습 시간" },
            { v: `${SCHEDULE.length}주`, l: "기본 일정" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col-reverse gap-1">
              <dt className="text-xs text-ink-muted">{s.l}</dt>
              <dd className="text-2xl font-semibold tabular-nums tracking-[-0.03em] text-ink">{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {user && progress && (
        <div className="mt-16">
          {next && nextModule ? (
            <NextStep
              eyebrow={progress.coreDone === 0 ? "첫 레슨" : "이어서 학습"}
              title={next.title}
              detail={`${nextModule.code} ${nextModule.title}`}
              href={lessonHref(next.module, next.id)}
              cta={progress.coreDone === 0 ? "시작하기" : "이어서 학습"}
              meta={`필수 경로 ${progress.coreDone}/${progress.coreTotal} 레슨 완료`}
            />
          ) : (
            <NextStep eyebrow="필수 경로 완료" title="핵심 레슨을 모두 마쳤습니다" detail="확장 모듈과 선택 레슨을 이어서 볼 수 있습니다." href="/curriculum" cta="커리큘럼" />
          )}
        </div>
      )}

      <section aria-labelledby="tracks-heading" className="mt-20">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="tracks-heading" className="section-title">
            과정 구성
          </h2>
          <Link href="/curriculum" className="text-[13px] font-medium text-ink-muted transition hover:text-ink">
            전체 커리큘럼 보기
          </Link>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--border-hairline)] sm:grid-cols-3">
          {TRACKS.map((t) => {
            const modules = modulesOfTrack(t.id);
            const done = progress ? modules.reduce((n, m) => n + (progress.byModule.get(m.slug)?.done ?? 0), 0) : 0;
            const total = modules.reduce((n, m) => n + m.lessons.filter((l) => l.tier === "core").length, 0);
            return (
              <li key={t.id} className="bg-page">
                <Link href={trackHref(t.id)} className="group flex h-full flex-col p-5 transition hover:bg-[var(--surface-card-2)] sm:p-6">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                    <span className="kicker">Track {t.code}</span>
                  </span>
                  <span className="mt-3 text-lg font-semibold tracking-[-0.02em] text-ink">{t.title}</span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{t.summary}</span>
                  <span className="mt-4 flex items-center justify-between text-xs tabular-nums text-ink-muted">
                    <span>
                      모듈 {modules.length}개{total > 0 && ` · 핵심 레슨 ${progress ? `${done}/` : ""}${total}`}
                    </span>
                    <Icon name="arrowRight" size={14} className="transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="goals-heading" className="mt-20">
        <h2 id="goals-heading" className="section-title mb-6">
          수료하면 할 수 있는 것
        </h2>
        <ol className="grid gap-x-10 gap-y-5 border-t border-[var(--border-hairline)] pt-6 sm:grid-cols-2">
          {COURSE.goals.map((g, i) => (
            <li key={i} className="flex gap-4 text-[15px] leading-relaxed text-ink-body">
              <span aria-hidden="true" className="w-6 shrink-0 pt-0.5 font-mono text-xs text-ink-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{g.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="method-heading" className="mt-20">
        <h2 id="method-heading" className="section-title mb-6">
          학습 방식
        </h2>
        <ol className="grid gap-x-6 gap-y-8 border-t border-[var(--border-hairline)] pt-6 sm:grid-cols-4">
          {[
            { t: "쓰이는 곳 확인", d: "레슨마다 그 개념이 AI 시스템의 어디에 쓰이는지 먼저 봅니다." },
            { t: "개념 학습과 실습", d: "설명, 손계산, 브라우저에서 실행하는 코드와 자동 채점 실습으로 익힙니다." },
            { t: "확인 문제", d: "확인 문제를 모두 맞히면 레슨을 완료합니다. 아는 내용은 진단 평가로 인정받습니다." },
            { t: "백지 복습과 과제", d: "모듈을 마치면 자료 없이 핵심을 적어 보고, 과제를 제출해 채점을 받습니다." },
          ].map((s, i) => (
            <li key={s.t}>
              <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--border-strong)] text-xs font-semibold text-ink">{i + 1}</span>
              <p className="mt-3 text-[15px] font-semibold text-ink">{s.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-xs text-ink-muted">
          모듈 {MODULES.length}개 중 {MODULES.filter((m) => m.track === "extension").length}개는 완료 조건이 없는 확장 모듈입니다.
        </p>
      </section>
    </div>
  );
}
