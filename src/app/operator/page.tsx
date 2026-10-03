import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { countSubmissionsByStatus } from "@/lib/submissionStore";
import { adminUnreadTotal } from "@/lib/chatView";
import { countUsersByRole } from "@/lib/userStore";
import PageHeader from "@/components/PageHeader";
import NextStep from "@/components/NextStep";

export const metadata = { title: "운영자 대시보드" };

// 운영자 화면 사이 이동은 위의 운영자 메뉴가 맡는다. 대시보드는 지금 할 일과 숫자 네 개만 보여 준다.
export default async function OperatorHome() {
  await requireAdmin("/operator");
  const byStatus = countSubmissionsByStatus();
  const pending = byStatus.submitted;
  const totalSubmissions = byStatus.submitted + byStatus.graded + byStatus.revision;
  const questions = adminUnreadTotal().conversations;
  const members = countUsersByRole().member;
  const stats = [
    { label: "채점 대기", value: pending, href: "/operator/submissions?status=submitted", hot: pending > 0 },
    { label: "새 메시지", value: questions, href: "/operator/chat", hot: questions > 0 },
    { label: "전체 제출", value: totalSubmissions, href: "/operator/submissions", hot: false },
    { label: "스터디원", value: members, href: "/operator/members", hot: false },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        title="운영자 대시보드"
        actions={
          <form action="/logout" method="post">
            <button className="btn btn-ghost btn-sm">로그아웃</button>
          </form>
        }
      />
      {pending > 0 ? (
        <NextStep
          title={`채점을 기다리는 과제 ${pending}건`}
          detail={questions > 0 ? `답변을 기다리는 채팅 ${questions}건` : "오래 기다린 제출물부터 채점합니다"}
          href="/operator/submissions?status=submitted"
          cta="채점하기"
        />
      ) : questions > 0 ? (
        <NextStep title={`답변을 기다리는 채팅 ${questions}건`} href="/operator/chat" cta="답변하기" />
      ) : null}

      <dl className="mt-12 grid grid-cols-2 border-y border-[var(--border-hairline)] lg:grid-cols-4">
        {stats.map((st, i) => (
          <Link
            key={st.label}
            href={st.href}
            className={`group py-6 pr-4 transition ${i % 2 === 1 ? "border-l border-[var(--border-hairline)] pl-5" : ""} ${i >= 2 ? "border-t border-[var(--border-hairline)] lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-5" : ""}`}
          >
            <dt className="text-xs text-ink-muted transition group-hover:text-ink">{st.label}</dt>
            <dd className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.04em] tabular-nums ${st.hot ? "text-[var(--accent)]" : "text-ink"}`}>{st.value}</dd>
          </Link>
        ))}
      </dl>
    </div>
  );
}
