import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { findUserById } from "@/lib/userStore";
import { readDraft } from "@/lib/assignmentDraftStore";
import { mergeDraft } from "@/lib/notebook";
import { courseDocFiles, notebookViewTasks } from "@/lib/assignmentView";
import { autoTestViews } from "@/lib/labView";
import { findUserSubmission } from "@/lib/submissionStore";
import { formatDateTime } from "@/lib/datetime";
import { moduleOfAssignment } from "@/content/course";
import NotebookView from "@/components/assignment/NotebookView";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "과제 초안" };

/** 스터디원이 과제 작업 공간에 자동 저장한 초안(제출 전 작업)을 읽기 전용으로 본다. */
export default async function MemberAssignmentDraftPage({ params }: PageProps<"/operator/members/[id]/assignment/[key]">) {
  await requireAdmin("/operator/members");
  const { id, key } = await params;
  const member = findUserById(id);
  const mod = moduleOfAssignment(key);
  const spec = mod?.assignment;
  if (!member || !mod || !spec) notFound();
  let draft;
  try {
    draft = readDraft(id, key);
  } catch {
    draft = undefined;
  }
  const submission = findUserSubmission(id, key);
  const back = { href: `/operator/members/${id}?module=${mod.slug}#rec-assignment`, label: `${member.name}님의 학습 기록` };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        back={back}
        eyebrow={`${mod.code} ${mod.title} · ${spec.title}`}
        title={`${member.name}님의 과제 초안`}
        description={
          draft
            ? `작업 공간에 자동 저장된 내용입니다${draft.updatedAt ? ` · 마지막 저장 ${formatDateTime(draft.updatedAt)}` : ""}. 스터디원이 계속 고치는 중일 수 있습니다.`
            : "저장된 초안이 없습니다."
        }
        actions={
          submission && (
            <Link href={`/operator/submissions/${submission.id}`} className="btn btn-secondary btn-sm">
              제출본 보기
            </Link>
          )
        }
      />
      {draft ? (
        <NotebookView
          tasks={notebookViewTasks(spec, true)}
          notebook={mergeDraft(spec, draft)}
          runKey={`draft:${id}:${key}`}
          courseDocs={courseDocFiles(spec)}
          autoTests={autoTestViews(spec)}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border-strong)] px-5 py-10 text-center text-sm text-ink-muted">
          이 과제의 작업 공간에 저장된 내용이 없습니다.
        </p>
      )}
    </div>
  );
}
