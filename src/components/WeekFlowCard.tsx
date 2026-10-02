import Link from "next/link";
import type { FlowNode, WeekFlow } from "@/lib/weekFlow";
import NextStep from "./NextStep";

/** 지금 할 일 + 이번 주 흐름(4단계). 주차 개요와 적용과 복습 · 한눈에 보기에서 함께 쓴다. */
export default function WeekFlowCard({ flow }: { flow: WeekFlow }) {
  return (
    <NextStep
      eyebrow={flow.allDone ? "이번 주 완료" : "지금 할 일"}
      title={flow.next.label}
      detail={flow.next.detail}
      href={flow.next.href}
      cta={flow.allDone ? "다시 보기" : "시작하기"}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-bold text-white/80">이번 주 흐름</h3>
        <span className={`text-xs font-bold ${flow.allDone ? "text-[#7ee2b0]" : "spotlight-muted"}`}>{flow.allDone ? "✓ 모두 완료" : flow.summary}</span>
      </div>
      <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {flow.nodes.map((n) => (
          <FlowStep key={n.step} node={n} />
        ))}
      </ol>
    </NextStep>
  );
}

function FlowStep({ node }: { node: FlowNode }) {
  const { step, title, state, done, current, locked, href } = node;
  const body = (
    <>
      <span
        aria-hidden="true"
        className={`mb-2 block h-1 rounded-full ${done ? "bg-[#7ee2b0]" : current ? "bg-[#8ab8ff]" : "bg-white/15"}`}
      />
      <span className={`block text-[13px] font-bold ${done || current ? "text-white" : "text-white/60"}`}>
        {done ? "✓ " : locked ? "🔒 " : `${step}. `}
        {title}
      </span>
      <span className="spotlight-muted block text-[11px]">{state}</span>
    </>
  );
  return (
    <li aria-current={current ? "step" : undefined} className="min-w-0">
      {locked ? (
        <div className="opacity-70">{body}</div>
      ) : (
        <Link href={href} className="block rounded-md transition hover:opacity-80">
          {body}
        </Link>
      )}
    </li>
  );
}
