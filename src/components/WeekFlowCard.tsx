import Link from "next/link";
import type { FlowNode, WeekFlow } from "@/lib/weekFlow";
import NextStep from "./NextStep";
import Icon from "./Icon";

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
      <ol className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4" aria-label="이번 주 흐름">
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
      <span aria-hidden="true" className={`mb-2.5 block h-[3px] rounded-full ${done ? "bg-[#86efac]" : current ? "bg-[#a9c1ff]" : "bg-white/12"}`} />
      <span className={`flex items-center gap-1.5 text-[13px] font-medium ${done || current ? "text-white" : "text-white/55"}`}>
        {done ? (
          <Icon name="check" size={14} className="text-[#86efac]" />
        ) : locked ? (
          <Icon name="lock" size={13} />
        ) : (
          <span className="font-mono text-[11px] text-white/45">{String(step).padStart(2, "0")}</span>
        )}
        {title}
      </span>
      <span className="spotlight-muted mt-0.5 block text-xs">{state}</span>
      {done && <span className="sr-only">(완료)</span>}
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
