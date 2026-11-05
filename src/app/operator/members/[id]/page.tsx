import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/dal";
import { getLearningRecord, learningActivityByItem, learningUpdatedAt } from "@/lib/learningStore";
import { findUserById } from "@/lib/userStore";
import { listUserSubmissions } from "@/lib/submissionStore";
import { readDraft } from "@/lib/assignmentDraftStore";
import { ASSIGNMENT_STATUS_LABEL, courseProgress, moduleStatus } from "@/lib/study";
import { ASSIGNMENT_KEYS, MODULES, findExercise } from "@/content/course";
import type { Tier } from "@/content/tiers";
import { tierRecord } from "@/lib/achievement";
import ProgressRing from "@/components/ProgressRing";
import Icon from "@/components/Icon";
import { formatDateTime, formatDate } from "@/lib/datetime";
import MemberModuleRecord from "./MemberModuleRecord";

export const metadata = { title: "스터디원 학습 기록" };

// 스터디원 한 명의 학습 기록 전체. 위에는 모듈별 요약, 아래에는 고른 모듈의 기록을 모두 펼쳐 보여 준다
// (레슨 진행·확인 문제 오답·서술형·출력 예측·코딩 실습·백지 복습·과제 제출본과 작성 중인 초안).
export default async function MemberLearningPage({ params, searchParams }: PageProps<"/operator/members/[id]">) {
  await requireAdmin("/operator/members");
  const { id } = await params;
  const { module: moduleParam } = await searchParams;
  const member = findUserById(id);
  if (!member) notFound();
  const learning = getLearningRecord(id);
  const submissions = listUserSubmissions(id).filter((s) => ASSIGNMENT_KEYS.includes(s.assignmentKey));
  const lastActivity = learningUpdatedAt(id);
  const course = courseProgress(learning);
  const rows = MODULES.map((module) => {
    const submission = module.assignment ? submissions.find((s) => s.assignmentKey === module.assignment!.key) : undefined;
    return { module, submission, status: moduleStatus(module, learning, submission) };
  });
  const sum = (tier: Tier, key: "done" | "total") => rows.reduce((acc, r) => acc + r.status.tiers[tier][key], 0);
  const advancedModules = rows.filter((r) => r.status.tiers.advanced.total > 0 && tierRecord(r.status, learning, "advanced").complete).length;

  // 모듈별 마지막 기록 시각: 레슨·실습·백지 복습 중 가장 최근 것
  const activity = learningActivityByItem(id);
  const moduleActivity = new Map<string, string>();
  const touch = (slug: string, at: string) => {
    if ((moduleActivity.get(slug) ?? "") < at) moduleActivity.set(slug, at);
  };
  for (const m of MODULES) for (const l of m.lessons) if (activity.lessons.has(l.id)) touch(m.slug, activity.lessons.get(l.id)!);
  for (const [exerciseId, at] of activity.exercises) {
    const found = findExercise(exerciseId);
    if (found) touch(found.module.slug, at);
  }
  for (const [slug, at] of activity.recalls) touch(slug, at);

  // 모듈을 고르지 않았으면 가장 최근에 학습한 모듈을 펼친다.
  const recent = [...moduleActivity].sort((a, b) => b[1].localeCompare(a[1]))[0]?.[0];
  const selected = rows.find((r) => r.module.slug === moduleParam) ?? rows.find((r) => r.module.slug === recent) ?? rows[0];
  const draft = selected.module.assignment ? readDraftSafe(id, selected.module.assignment.key) : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        back={{ href: "/operator/members", label: "스터디원 관리" }}
        title={`${member.name}님의 학습 기록`}
        description={`${member.email} · 가입일 ${formatDate(member.createdAt)}`}
        actions={
          <Link href={`/operator/chat/${member.id}`} className="btn btn-secondary btn-sm">
            채팅
          </Link>
        }
      />

      <div className="mb-14 grid grid-cols-1 border-y border-[var(--border-hairline)] sm:grid-cols-2">
        <Stat label="필수 경로(핵심 레슨)" value={`${course.coreDone} / ${course.coreTotal}`} />
        <Stat
          label="보충 · 심화 레슨"
          value={`보충 ${sum("supplement", "done")}/${sum("supplement", "total")} · 심화 ${sum("advanced", "done")}/${sum("advanced", "total")}${advancedModules > 0 ? ` · 심화 달성 ${advancedModules}개 모듈` : ""}`}
        />
        <Stat label="과제 제출" value={`${submissions.length} / ${ASSIGNMENT_KEYS.length}`} />
        <Stat label="마지막 학습 기록" value={lastActivity ? formatDateTime(lastActivity) : "아직 없음"} />
      </div>

      <h2 className="section-title mb-2">모듈별 진행</h2>
      <ul className="rows border-y border-[var(--border-hairline)]">
        {rows.map(({ module, status }) => {
          const current = module.slug === selected.module.slug;
          const at = moduleActivity.get(module.slug);
          const t = status.tiers;
          const parts = [
            t.core.total > 0 && `핵심 ${t.core.done}/${t.core.total}`,
            t.supplement.total > 0 && `보충 ${t.supplement.done}/${t.supplement.total}`,
            t.advanced.total > 0 && `심화 ${t.advanced.done}/${t.advanced.total}`,
            module.recall.length > 0 && `백지 복습 ${status.recallSubmitted ? "제출" : "미제출"}`,
            status.assignment &&
              `과제 ${ASSIGNMENT_STATUS_LABEL[status.assignment.status]}${status.assignment.status === "graded" ? ` ${status.assignment.score}/${status.assignment.maxScore}점` : ""}`,
          ].filter(Boolean);
          return (
            <li key={module.slug}>
              <Link
                href={`/operator/members/${member.id}?module=${module.slug}#module-record`}
                aria-current={current ? "true" : undefined}
                className={`group row-hover -mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5 ${current ? "bg-[var(--surface-card-2)]" : ""}`}
              >
                <ProgressRing ratio={t.core.total > 0 ? status.ratio : t.supplement.total + t.advanced.total > 0 ? (t.supplement.done + t.advanced.done) / (t.supplement.total + t.advanced.total) : 0} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-ink">
                    <span className="mr-2 font-mono text-xs text-ink-muted">{module.code}</span>
                    {module.title}
                  </span>
                  <span className="mt-1 block text-xs tabular-nums text-ink-muted">{parts.join(" · ")}</span>
                </span>
                <span className="hidden shrink-0 text-xs tabular-nums text-ink-muted sm:block">{at ? formatDateTime(at) : "기록 없음"}</span>
                <Icon name={current ? "chevronDown" : "chevronRight"} size={16} className="shrink-0 text-ink-muted" />
              </Link>
            </li>
          );
        })}
      </ul>

      <section id="module-record" aria-labelledby="module-record-heading" className="mt-16 scroll-mt-20">
        <p className="eyebrow">{member.name}님의 기록</p>
        <h2 id="module-record-heading" className="mt-1 text-[1.5rem] font-bold tracking-[-0.03em] text-ink">
          {selected.module.code} · {selected.module.title}
        </h2>
        <div className="mt-5">
          <MemberModuleRecord
            memberId={member.id}
            status={selected.status}
            learning={learning}
            submission={selected.submission}
            draftSavedAt={draft ? (draft.updatedAt ?? "") : undefined}
          />
        </div>
      </section>
    </div>
  );
}

/** 초안 파일을 읽지 못해도(손상·권한) 화면은 그대로 보여 준다. */
function readDraftSafe(userId: string, key: string) {
  try {
    return readDraft(userId, key);
  } catch {
    return undefined;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-[var(--border-hairline)] py-4 pr-4 sm:even:border-l sm:even:pl-5 [&:nth-child(n+2)]:border-t sm:[&:nth-child(2)]:border-t-0">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1.5 text-[15px] font-medium tabular-nums text-ink">{value}</p>
    </div>
  );
}
