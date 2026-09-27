import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { findThread, unreadCount } from "@/lib/threadStore";
import { findUserById } from "@/lib/userStore";
import { getWeek } from "@/content/weeks";
import AssignmentThread from "@/components/assignment/AssignmentThread";

export const metadata = { title: "과제 질문" };

/** 아직 과제를 제출하지 않은 스터디원의 질문에 답하는 화면 (제출 후에는 채점 화면에서 대화한다) */
export default async function ThreadPage({ params }: { params: Promise<{ userId: string; slug: string }> }) {
  await requireAdmin("/operator/submissions");
  const { userId, slug } = await params;
  const week = getWeek(slug);
  const student = findUserById(userId);
  if (!week || !student) notFound();
  const thread = findThread(userId, slug);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/operator/submissions" className="text-sm font-bold text-[var(--series-orange)] hover:underline">
        ← 과제 채점 목록
      </Link>
      <p className="mt-5 text-sm font-bold text-[var(--series-orange)]">운영자 전용 · {week.number}주차 과제 질문</p>
      <h1 className="mt-1 mb-6 text-2xl font-black text-ink">{student.name}님과의 대화</h1>
      <AssignmentThread
        slug={slug}
        viewer="admin"
        targetUserId={userId}
        unread={unreadCount(thread, "admin")}
        messages={(thread?.messages ?? []).map((m) => ({ id: m.id, authorName: m.authorName, role: m.role, text: m.text, createdAt: m.createdAt }))}
      />
    </div>
  );
}
