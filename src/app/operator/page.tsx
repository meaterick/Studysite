import Link from "next/link";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "운영자 대시보드" };

const LINKS = [
  { href: "/operator/guide", title: "운영 가이드", desc: "운영 원칙, 준비 체크리스트, 세션 시나리오, 채점 루브릭, 위기 대응 매뉴얼" },
  { href: "/operator/quiz-answers", title: "퀴즈 정답·해설", desc: "W1~W8 퀴즈 정답과 과제 모범 방향 — 절대 스터디원과 공유하지 마세요" },
  { href: "/operator/quality-log", title: "품질 검토·개선 로그", desc: "자체 검토 결과, 알려진 한계, 매주 개선 절차, 변경 기록" },
  { href: "/operator/members", title: "스터디원 관리", desc: "가입한 계정 목록 확인, 관리자 권한 부여/회수, 계정 삭제" },
];

export default async function OperatorHome() {
  const admin = await requireAdmin("/operator");
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
        이 구역의 내용(퀴즈 정답, 채점 기준 원본, 운영 노하우)은 스터디원에게 공개하지 않는 것을 원칙으로 합니다.
      </div>
      <div className="grid gap-4 sm:grid-cols-1">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-[var(--border-hairline)] bg-card p-5 transition hover:border-[var(--series-orange)]"
          >
            <h2 className="text-lg font-black text-ink">{l.title}</h2>
            <p className="mt-1 text-sm text-ink-secondary">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
