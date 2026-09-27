import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { listSubmissions } from "@/lib/submissionStore";

export const metadata = { title: "운영자 대시보드" };

const LINKS = [
  { href: "/operator/submissions", title: "과제 채점", desc: "스터디원이 제출한 주차별 과제를 확인하고 점수·피드백을 남기거나 재제출을 요청" },
  { href: "/operator/guide", title: "운영 가이드", desc: "운영 원칙, 준비 체크리스트, 세션 시나리오, 채점 루브릭, 위기 대응 매뉴얼" },
  { href: "/operator/quiz-answers", title: "과제 모범 방향", desc: "W1~W8 과제 채점 시 참고할 모범 방향과 서술형 문항 모범답안 전체 (채점 화면에도 함께 표시됩니다)" },
  { href: "/operator/quality-log", title: "품질 검토·개선 로그", desc: "자체 검토 결과, 알려진 한계, 매주 개선 절차, 변경 기록" },
  { href: "/operator/members", title: "스터디원 현황", desc: "가입 계정, 단계별 진도·확인 문제 오답·서술형 답·백지공부·과제 상태를 확인하고 계정을 삭제" },
];

export default async function OperatorHome() {
  const admin = await requireAdmin("/operator");
  const pending = listSubmissions().filter((s) => s.status === "submitted").length;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-bold text-[var(--series-orange)]">운영자 전용 · {admin.name}님</p>
          <h1 className="text-3xl font-black text-ink">운영자 대시보드</h1>
        </div>
        <form action="/logout" method="post">
          <button className="rounded-md border border-[var(--border-hairline)] px-3 py-2 text-xs font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]">
            로그아웃
          </button>
        </form>
      </div>
      <div className="mb-8 rounded-lg border-l-4 px-4 py-3 text-sm" style={{ borderColor: "var(--status-serious)", background: "color-mix(in srgb, var(--status-serious) 12%, transparent)" }}>
        이 구역의 내용(채점 기준 원본, 운영 노하우)은 스터디원에게 공개하지 않는 것을 원칙으로 합니다. (서술형 모범답안은 스터디원이 자기 답을 먼저 쓴 뒤에만 공개됩니다.)
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
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
