import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { findUserById } from "@/lib/userStore";
import { listUserSubmissions } from "@/lib/submissionStore";
import { conversationView } from "@/lib/chatView";
import { getWeek } from "@/content/weeks";
import ChatPanel from "@/components/chat/ChatPanel";

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
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-black text-ink">
          <Link href="/operator/chat" className="mr-2 text-[var(--series-orange)] lg:hidden">
            ←
          </Link>
          {student.name}
          <span className="ml-2 text-xs font-medium text-ink-muted">{student.email}</span>
        </p>
        <p className="flex flex-wrap gap-2 text-xs">
          <Link href={`/operator/members/${student.id}`} className="font-bold text-[var(--series-orange)] hover:underline">
            학습 현황
          </Link>
          {submissions.map((s) => (
            <Link key={s.id} href={`/operator/submissions/${s.id}`} className="font-bold text-[var(--series-orange)] hover:underline">
              {s.week}주차 과제
            </Link>
          ))}
        </p>
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
