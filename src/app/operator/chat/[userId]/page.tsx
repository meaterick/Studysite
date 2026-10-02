import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { findUserById } from "@/lib/userStore";
import { listUserSubmissions } from "@/lib/submissionStore";
import { conversationView } from "@/lib/chatView";
import { getWeek } from "@/content/weeks";
import ChatPanel from "@/components/chat/ChatPanel";
import ClearChatButton from "@/components/chat/ClearChatButton";
import Icon from "@/components/Icon";

export const metadata = { title: "채팅" };

export default async function OperatorChatPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin("/operator/chat");
  const { userId } = await params;
  const student = findUserById(userId);
  if (!student) notFound();
  const submissions = listUserSubmissions(userId)
    .map((s) => ({ id: s.id, week: getWeek(s.weekSlug)?.number }))
    .sort((a, b) => (a.week ?? 0) - (b.week ?? 0));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-[15px] font-medium text-ink">
          <Link href="/operator/chat" aria-label="대화 목록" className="icon-btn h-8 w-8 lg:hidden">
            <Icon name="arrowLeft" size={15} />
          </Link>
          <span className="truncate">{student.name}</span>
          <span className="truncate text-xs font-normal text-ink-muted">{student.email}</span>
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <Link href={`/operator/members/${student.id}`} className="btn btn-ghost btn-sm">
            학습 현황
          </Link>
          {submissions.map((s) => (
            <Link key={s.id} href={`/operator/submissions/${s.id}`} className="btn btn-ghost btn-sm">
              {s.week}주차 과제
            </Link>
          ))}
          <ClearChatButton targetUserId={student.id} targetName={student.name} />
        </div>
      </div>
      <ChatPanel
        key={student.id}
        viewer="admin"
        targetUserId={student.id}
        initial={conversationView(student.id, "admin")}
        placeholder={`${student.name}님에게 보낼 메시지`}
      />
    </div>
  );
}
