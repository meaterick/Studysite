import Link from "next/link";
import { WEEKS } from "@/content/weeks";
import { getWeekOutline } from "@/content/sections";
import { BlocksRenderer, Inline } from "@/components/MarkdownBlocks";
import WeekFrame from "@/components/WeekFrame";
import { loadWeekPage } from "@/lib/weekPage";
import { ASSIGNMENT_STATUS_LABEL, type WeekStatus } from "@/lib/study";
import { readLabState } from "@/lib/learningStore";
import { labProgress } from "@/lib/labView";
import { tierRecord, type TierRecord } from "@/lib/achievement";
import TierBadge from "@/components/TierBadge";
import { TIER_INFO, TIER_ORDER, sectionLabel, splitTierPrefix } from "@/content/tiers";

type WeekStatusRow = WeekStatus["sections"][number];

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

const ACCESS_STYLE = {
  completed: { icon: "✓", label: "완료", ring: "var(--status-good)" },
  current: { icon: "▶", label: "진행할 차례", ring: "var(--series-blue)" },
  upcoming: { icon: "○", label: "미완료", ring: "var(--border-strong)" },
  locked: { icon: "🔒", label: "잠김", ring: "var(--border-strong)" },
} as const;

export default async function WeekOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ finished?: string; locked?: string }>;
}) {
  const { slug } = await params;
  const { finished, locked } = await searchParams;
  const { week, record, status, isAdmin } = await loadWeekPage(slug, `/weeks/${slug}`);
  const lab = labProgress(slug, readLabState(record, slug));
  const { intro } = getWeekOutline(week);
  const minutesOf = (rows: typeof status.sections) => rows.reduce((sum, r) => sum + r.section.minutes, 0);
  const coreMinutes = minutesOf(status.sections.filter((r) => r.section.tier === "core"));
  const current = status.currentSection;
  const supplementRecord = tierRecord(week, record, status, "supplement");
  const advancedRecord = tierRecord(week, record, status, "advanced");
  // 핵심을 마친 뒤 이어서 볼 만한 선택 단계(보충 먼저, 그다음 심화)
  const nextOptional = status.sections.find((r) => r.section.tier !== "core" && r.access === "upcoming")?.section;

  return (
    <WeekFrame week={week} status={status} record={record}>
      <div className="space-y-10">
        {finished && status.coreDone && (
          <div className="rounded-xl border-l-4 border-[var(--status-good)] bg-[color-mix(in_srgb,var(--status-good)_10%,transparent)] px-5 py-4">
            <p className="font-black text-ink">이번 주 핵심 단계를 모두 마쳤습니다.</p>
            <p className="mt-1 text-sm text-ink-secondary">
              <strong>적용과 복습</strong>에서 백지공부로 배운 내용을 떠올려 본 뒤, 과제를 작성해 제출하십시오. 제출한 과제는 운영자가 채점하고 피드백을 남깁니다.
              여유가 있다면 <strong>보충 과정</strong>으로 폭을 넓히고 <strong>심화 과정</strong>에 도전해 심화 달성 기록을 남겨 보십시오.
            </p>
          </div>
        )}
        {locked && (
          <div className="rounded-xl border-l-4 border-[var(--status-serious)] bg-[color-mix(in_srgb,var(--status-serious)_12%,transparent)] px-5 py-3 text-sm text-ink-secondary">
            {locked === "finale"
              ? "백지공부와 과제는 이번 주의 핵심 단계를 모두 마친 뒤에 열립니다."
              : "아직 열리지 않은 단계입니다. 앞의 핵심 단계를 먼저 마쳐 주십시오. 보충·심화 단계는 핵심 단계를 모두 마치면 열립니다."}
          </div>
        )}

        <section aria-labelledby="continue-heading" className="rounded-xl border border-[var(--border-hairline)] bg-card p-5 sm:p-6">
          <h2 id="continue-heading" className="text-sm font-bold text-ink-muted">
            {current ? "이어서 학습하기" : "핵심 과정 완료 · 적용과 복습"}
          </h2>
          {current ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-black text-ink">
                  {sectionLabel(current)}단계 · {current.title}
                </p>
                <p className="mt-1 text-sm text-ink-secondary">
                  <Inline text={current.meta.goal} /> · 약 {current.minutes}분
                </p>
              </div>
              <Link
                href={`/weeks/${slug}/sections/${current.id}`}
                className="shrink-0 rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                {status.tiers.core.done === 0 ? "핵심 1단계부터 시작" : "이어서 학습"} →
              </Link>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-ink-secondary">
                  다음: 백지공부 → 과제
                </p>
                <Link href={`/weeks/${slug}/apply`} className="shrink-0 rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                  적용과 복습으로 →
                </Link>
              </div>
              {nextOptional && (
                <p className="text-sm text-ink-secondary">
                  더 나아가기:{" "}
                  <Link href={`/weeks/${slug}/sections/${nextOptional.id}`} className="font-bold text-[var(--series-blue)] hover:underline">
                    {sectionLabel(nextOptional)}단계 · {nextOptional.title} →
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>

        <section id="goals" aria-labelledby="goals-heading">
          <h2 id="goals-heading" className="mb-3 text-xl font-black text-ink">학습 목표</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-ink-secondary">
            {week.objectives.map((o, i) => {
              const { tier, text } = splitTierPrefix(o);
              return (
                <li key={i}>
                  {tier && (
                    <span className="mr-1.5 align-middle">
                      <TierBadge tier={tier} compact />
                    </span>
                  )}
                  <Inline text={text} />
                </li>
              );
            })}
          </ul>
        </section>

        {intro.length > 0 && (
          <section aria-labelledby="intro-heading">
            <h2 id="intro-heading" className="mb-3 text-xl font-black text-ink">들어가며</h2>
            <BlocksRenderer blocks={intro} docKey={`${slug}:intro`} />
          </section>
        )}

        <section aria-labelledby="prep-heading">
          <h2 id="prep-heading" className="mb-3 text-xl font-black text-ink">함께 보면 좋은 자료</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-ink-secondary">
            {week.learningOrder.map((o, i) => (
              <li key={i}>
                <Inline text={o} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="roadmap-heading">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="roadmap-heading" className="text-xl font-black text-ink">학습 단계</h2>
            <p className="text-sm text-ink-muted">
              핵심 {status.tiers.core.total}단계 · 약 {Math.round((coreMinutes / 60) * 10) / 10}시간
              {status.tiers.supplement.total + status.tiers.advanced.total > 0 &&
                ` · 선택 ${status.tiers.supplement.total + status.tiers.advanced.total}단계`}
            </p>
          </div>
          <p className="mb-5 text-sm text-ink-muted">
            <strong className="text-ink-secondary">핵심 단계 학습 → 확인 문제 → 백지공부 → 과제</strong> · 보충·심화는 선택
            {status.mode === "lock" && " · 앞 단계를 마치면 다음 단계가 열립니다"}
          </p>
          <div className="space-y-8">
            {TIER_ORDER.map((tier) => {
              const rows = status.sections.filter((r) => r.section.tier === tier);
              if (rows.length === 0) return null;
              const info = TIER_INFO[tier];
              const count = status.tiers[tier];
              return (
                <div key={tier} aria-labelledby={`track-${tier}`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 id={`track-${tier}`} className="text-lg font-black text-ink">
                      {info.course}
                    </h3>
                    <TierBadge tier={tier} />
                    <span className="text-xs font-bold text-ink-muted">
                      {count.done}/{count.total}단계 완료 · 약 {Math.round((minutesOf(rows) / 60) * 10) / 10}시간
                      {info.required ? " · 주차 완료 조건" : " · 선택"}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-ink-muted">{info.summary}</p>
                  <ol className="space-y-2">
                    {rows.map(({ section, access, progress }) => (
                      <SectionRow key={section.id} slug={slug} section={section} access={access} progress={progress} isAdmin={isAdmin} />
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>

        {(supplementRecord.total > 0 || advancedRecord.total > 0) && (
          <section aria-labelledby="record-heading">
            <h2 id="record-heading" className="mb-1 text-xl font-black text-ink">보충 · 심화 기록</h2>
            <p className="mb-4 text-sm text-ink-muted">주차 완료와 별개로 쌓이는 선택 과정의 기록입니다. 심화 단계·심화 실습·과제 심화 문제를 모두 마치면 이번 주 <strong>심화 달성</strong>이 표시됩니다.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {supplementRecord.total > 0 && <RecordCard record={supplementRecord} />}
              {advancedRecord.total > 0 && <RecordCard record={advancedRecord} />}
            </div>
          </section>
        )}

        <section aria-labelledby="apply-heading">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="apply-heading" className="text-xl font-black text-ink">적용과 복습</h2>
            <Link href={`/weeks/${slug}/apply`} className="text-sm font-bold text-[var(--series-blue)] hover:underline">
              한눈에 보기 →
            </Link>
          </div>
          <p className="mb-4 text-sm text-ink-muted">
            {status.coreDone
              ? "다음: 백지공부 → 과제"
              : `핵심 단계 ${status.tiers.core.total - status.tiers.core.done}개 남음`}
          </p>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-ink">
            백지공부 → 과제
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <FinaleCard
              href={`/weeks/${slug}/worksheet`}
              locked={!status.finaleOpen && !isAdmin}
              title="백지공부"
              desc="자료를 보지 않고 핵심 내용을 떠올려 적은 뒤, 학습 자료와 비교해 부족한 부분을 찾습니다."
              state={status.worksheetSubmitted ? "제출 완료" : "미작성"}
              done={status.worksheetSubmitted}
            />
            <FinaleCard
              href={`/weeks/${slug}/assignment`}
              locked={!status.finaleOpen && !isAdmin}
              title="과제"
              desc={`${week.dueNote}. 코드 실행부터 보고서 작성, 제출까지 이 사이트에서 모두 진행하며, 운영자가 채점하고 피드백을 남깁니다.`}
              state={
                status.assignment.status === "graded"
                  ? `채점 완료 · ${status.assignment.score ?? "-"}/${status.assignment.maxScore}점`
                  : ASSIGNMENT_STATUS_LABEL[status.assignment.status]
              }
              done={status.assignment.status !== "none"}
            />
          </div>
          {lab && (lab.exercisesTotal > 0 || lab.quizTotal > 0) && (
            <>
              <h3 className="mb-2 mt-5 flex items-center gap-2 text-sm font-black text-ink">
                <span className="rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span> 선택 과정
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <FinaleCard
                  href={`/weeks/${slug}/lab`}
                  locked={false}
                  title="코딩 실습"
                  desc="TODO가 비어 있는 시작 코드를 직접 채우고 자동 채점을 받습니다. 단계별 힌트와 초기화, 통과 후 모범 답안 비교를 제공합니다."
                  state={`통과 ${lab.exercisesPassed}/${lab.exercisesTotal}`}
                  done={lab.exercisesTotal > 0 && lab.exercisesPassed === lab.exercisesTotal}
                />
                <FinaleCard
                  href={`/weeks/${slug}/descriptive`}
                  locked={false}
                  title="서술형 · 추가 퀴즈"
                  desc="개념을 자신의 말로 설명하고, 객관식·코드 출력 예측 문제로 한 번 더 점검합니다."
                  state={`퀴즈 완료 ${lab.quizDone}/${lab.quizTotal}${lab.quizWeak > 0 ? ` · 다시 볼 문항 ${lab.quizWeak}` : ""}`}
                  done={lab.quizTotal > 0 && lab.quizDone === lab.quizTotal}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </WeekFrame>
  );
}

function FinaleCard({
  href,
  locked,
  title,
  desc,
  state,
  done,
}: {
  href: string;
  locked: boolean;
  title: string;
  desc: string;
  state: string;
  done: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-black text-ink">
          {locked && <span aria-hidden="true">🔒 </span>}
          {title}
        </p>
        <span className={`text-xs font-bold ${done ? "text-[var(--status-good)]" : "text-ink-muted"}`}>{state}</span>
      </div>
      <p className="mt-1 text-sm text-ink-secondary">{desc}</p>
    </>
  );
  return locked ? (
    <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-4 opacity-70">{inner}</div>
  ) : (
    <Link href={href} className="block rounded-xl border border-[var(--border-hairline)] bg-card p-4 transition hover:border-[var(--series-blue)]">
      {inner}
    </Link>
  );
}

function SectionRow({
  slug,
  section,
  access,
  progress,
  isAdmin,
}: {
  slug: string;
  section: WeekStatusRow["section"];
  access: WeekStatusRow["access"];
  progress: WeekStatusRow["progress"];
  isAdmin: boolean;
}) {
  const style = ACCESS_STYLE[access];
  const openable = access !== "locked" || isAdmin;
  const color = TIER_INFO[section.tier].color;
  const body = (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-black"
        style={{ borderColor: access === "completed" ? style.ring : color, color: access === "locked" ? "var(--text-muted)" : access === "completed" ? style.ring : color }}
      >
        {access === "completed" ? "✓" : section.number}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-bold ${access === "locked" ? "text-ink-muted" : "text-ink"}`}>
          {sectionLabel(section)}. {section.title}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">
          <Inline text={section.meta.goal} />
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          <span className="sr-only">{style.label} · </span>약 {section.minutes}분
          · 확인 문제 {progress.checksDone}/{progress.checksTotal}
        </p>
      </div>
      <span className="shrink-0 text-xs font-bold" style={{ color: access === "locked" ? "var(--text-muted)" : style.ring }}>
        {style.icon} {access === "upcoming" && section.tier !== "core" ? "선택" : style.label}
      </span>
    </div>
  );
  return (
    <li>
      {openable ? (
        <Link
          href={`/weeks/${slug}/sections/${section.id}`}
          className={`block rounded-xl border bg-card p-4 transition hover:border-[var(--series-blue)] ${
            access === "current" ? "border-[var(--series-blue)]" : "border-[var(--border-hairline)]"
          }`}
        >
          {body}
        </Link>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-4 opacity-80">{body}</div>
      )}
    </li>
  );
}

function RecordCard({ record }: { record: TierRecord }) {
  const info = TIER_INFO[record.tier];
  const rows = [
    { label: "단계", c: record.sections },
    { label: "코딩 실습", c: record.labs },
    ...(record.tier === "advanced" ? [{ label: "과제 심화 문제", c: record.challenges }] : []),
    { label: "퀴즈", c: record.quiz },
  ].filter((r) => r.c.total > 0);
  return (
    <div
      className="rounded-xl border bg-card p-4"
      style={{ borderColor: record.complete ? info.color : "var(--border-hairline)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-black text-ink">
          {info.course} <TierBadge tier={record.tier} compact />
        </p>
        <span className="text-xs font-bold" style={{ color: record.complete ? info.color : "var(--text-muted)" }}>
          {record.complete ? (record.tier === "advanced" ? "✦ 심화 달성" : "✓ 보충 완료") : `${record.earned}/${record.total}`}
        </span>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-ink-secondary">
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between gap-2">
            <span>{r.label}</span>
            <span className={r.c.done === r.c.total ? "font-bold text-[var(--status-good)]" : "text-ink-muted"}>
              {r.c.done}/{r.c.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
