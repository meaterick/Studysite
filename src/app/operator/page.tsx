import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listSubmissions } from "@/lib/submissionStore";
import { adminUnreadTotal } from "@/lib/chatView";

export const metadata = { title: "운영자 대시보드" };

const LINKS = [
  { href: "/operator/submissions", title: "과제 채점", desc: "제출된 주차별 과제를 채점 기준별로 채점하고, 피드백을 남기거나 재제출을 요청합니다." },
  { href: "/operator/chat", title: "채팅", desc: "스터디원과 과제·학습에 관한 메시지를 실시간으로 주고받습니다." },
  { href: "/operator/guide", title: "운영 가이드", desc: "운영 원칙, 준비 체크리스트, 세션 시나리오, 채점 루브릭, 위기 대응 매뉴얼" },
  { href: "/operator/quiz-answers", title: "과제 모범 방향", desc: "W1~W8 과제 채점 시 참고할 모범 방향과 서술형 문항 모범답안 전체 (채점 화면에도 함께 표시됩니다)" },
  { href: "/operator/quality-log", title: "품질 검토·개선 로그", desc: "자체 검토 결과, 알려진 한계, 매주 개선 절차, 변경 기록" },
  { href: "/operator/members", title: "스터디원 현황", desc: "가입 계정, 단계별 진도·확인 문제 오답·서술형 답·백지공부·과제 상태를 확인하고 계정을 삭제" },
];

export default async function OperatorHome() {
  const admin = await requireAdmin("/operator");
  const pending = listSubmissions().filter((s) => s.status === "submitted").length;
  const questions = adminUnreadTotal().conversations;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-bold text-[var(--series-orange)]">{admin.name}님</p>
          <h1 className="text-3xl font-black text-ink">운영자 대시보드</h1>
        </div>
        <form action="/logout" method="post">
          <button className="rounded-md border border-[var(--border-hairline)] px-3 py-2 text-xs font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]">
            로그아웃
          </button>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-1">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-[var(--border-hairline)] bg-card p-5 transition hover:border-[var(--series-orange)]"
          >
            <h2 className="text-lg font-black text-ink">
              {l.title}
              {l.href === "/operator/submissions" && pending > 0 && (
                <span className="ml-2 rounded-full bg-[var(--series-orange)] px-2 py-0.5 align-middle text-xs font-bold text-white">
                  채점 대기 {pending}
                </span>
              )}
              {l.href === "/operator/chat" && questions > 0 && (
                <span className="ml-2 rounded-full bg-[var(--series-blue)] px-2 py-0.5 align-middle text-xs font-bold text-white">
                  새 메시지 {questions}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
