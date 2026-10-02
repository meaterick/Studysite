import Link from "next/link";
import type { FlowNode, WeekFlow } from "@/lib/weekFlow";

/** 지금 할 일 + 이번 주 흐름(4단계). 주차 개요와 적용과 복습 · 한눈에 보기에서 함께 쓴다. */
export default function WeekFlowCard({ flow }: { flow: WeekFlow }) {
  return (
    <section aria-labelledby="flow-heading" className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--series-blue)_40%,transparent)] bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] p-5 sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-black text-[var(--series-blue)]">지금 할 일</p>
          <p className="mt-1 text-lg font-black text-ink">{flow.next.label}</p>
          <p className="mt-0.5 text-sm text-ink-secondary">{flow.next.detail}</p>
        </div>
        <Link href={flow.next.href} className="btn btn-primary w-full shrink-0 sm:w-auto">
          시작하기 →
        </Link>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="flow-heading" className="text-sm font-black text-ink">
            이번 주 흐름
          </h3>
          <span className={`text-xs font-bold ${flow.allDone ? "text-[var(--status-good)]" : "text-ink-muted"}`}>
            {flow.allDone ? "✓ 모두 완료" : flow.summary}
          </span>
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {flow.nodes.map((n) => (
            <FlowStep key={n.step} node={n} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function FlowStep({ node }: { node: FlowNode }) {
  const { step, title, place, state, done, current, locked, href } = node;
  const body = (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${
          done
            ? "bg-[var(--status-good)] text-white"
            : current
              ? "bg-[var(--series-blue)] text-white"
              : "border-2 border-[var(--series-blue)] text-[var(--series-blue)]"
        }`}
      >
        {done ? "✓" : locked ? "🔒" : step}
      </span>
      <div className="min-w-0">
        <p className="font-black text-ink">{title}</p>
        <p className={`text-xs font-bold ${done ? "text-[var(--status-good)]" : "text-ink-muted"}`}>
          {place} · {state}
        </p>
      </div>
    </div>
  );
  const cls = `block h-full rounded-xl border p-3 transition ${
    current ? "border-[var(--series-blue)] bg-[color-mix(in_srgb,var(--series-blue)_6%,transparent)]" : "border-[var(--border-hairline)]"
  }`;
  return (
    <li aria-current={current ? "step" : undefined}>
      {locked ? (
        <div className={`${cls} opacity-70`}>{body}</div>
      ) : (
        <Link href={href} className={`${cls} hover:border-[var(--series-blue)]`}>
          {body}
        </Link>
      )}
    </li>
  );
}
