import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { findUserById } from "@/lib/userStore";
import { listUserSubmissions } from "@/lib/submissionStore";
import { conversationView } from "@/lib/chatView";
import { MODULES, moduleOfAssignment } from "@/content/course";
import ChatPanel from "@/components/chat/ChatPanel";
import ClearChatButton from "@/components/chat/ClearChatButton";
import Icon from "@/components/Icon";

export const metadata = { title: "채팅" };

export default async function OperatorChatPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin("/operator/chat");
  const { userId } = await params;
  const student = findUserById(userId);
  if (!student) notFound();
  // 새 과정의 과제 제출물만, 모듈 순서대로
  const submissions = listUserSubmissions(userId)
    .flatMap((s) => {
      const mod = moduleOfAssignment(s.assignmentKey);
      return mod ? [{ id: s.id, code: mod.code, order: MODULES.indexOf(mod) }] : [];
    })
    .sort((a, b) => a.order - b.order);

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
              {s.code} 과제
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
