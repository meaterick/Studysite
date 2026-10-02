import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listSubmissions } from "@/lib/submissionStore";
import { adminUnreadTotal } from "@/lib/chatView";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "운영자 대시보드" };

const LINKS = [
  { href: "/operator/submissions", title: "과제 채점", desc: "제출된 주차별 과제를 채점 기준별로 채점하고, 피드백을 남기거나 재제출을 요청합니다." },
  { href: "/operator/chat", title: "채팅", desc: "스터디원과 과제·학습에 관한 메시지를 실시간으로 주고받습니다." },
  { href: "/operator/settings", title: "운영 설정", desc: "단계 진행 방식(미완료 경고 / 잠금)과 주차별 과제 마감일" },
  { href: "/operator/guide", title: "운영 가이드", desc: "운영 원칙, 준비 체크리스트, 세션 시나리오, 채점 루브릭, 위기 대응 매뉴얼" },
  { href: "/operator/quiz-answers", title: "과제 모범 방향", desc: "W1~W8 과제 채점 시 참고할 모범 방향과 서술형 문항 모범답안 전체 (채점 화면에도 함께 표시됩니다)" },
  { href: "/operator/quality-log", title: "품질 검토·개선 로그", desc: "자체 검토 결과, 알려진 한계, 매주 개선 절차, 변경 기록" },
  { href: "/operator/members", title: "스터디원 현황", desc: "가입 계정, 단계별 진도·확인 문제 오답·서술형 답·백지공부·과제 상태를 확인하고 계정을 삭제" },
];

export default async function OperatorHome() {
  const admin = await requireAdmin("/operator");
  const pending = listSubmissions().filter((s) => s.status === "submitted").length;
  const questions = adminUnreadTotal().conversations;
  const stats = [
    { label: "채점 대기", value: pending, href: "/operator/submissions?status=submitted", tone: "var(--series-orange)" },
    { label: "새 메시지", value: questions, href: "/operator/chat", tone: "var(--series-blue)" },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        tone="operator"
        eyebrow={`${admin.name}님`}
        title="운영자 대시보드"
        actions={
          <form action="/logout" method="post">
            <button className="btn btn-secondary btn-sm">로그아웃</button>
          </form>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3">
        {stats.map((st) => (
          <Link key={st.label} href={st.href} className="surface surface-link p-4 sm:p-5">
            <p className="text-xs font-bold text-ink-muted">{st.label}</p>
            <p className="mt-1 text-3xl font-black tabular-nums" style={{ color: st.value > 0 ? st.tone : "var(--text-muted)" }}>
              {st.value}
            </p>
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="surface surface-link group flex flex-col p-5">
            <h2 className="flex items-center justify-between gap-2 text-base font-black text-ink">
              {l.title}
              <span aria-hidden="true" className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-[var(--series-orange)]">
                →
              </span>
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
