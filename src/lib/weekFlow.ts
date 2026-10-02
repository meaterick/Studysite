import "server-only";
import type { WeekMeta } from "@/content/types";
import type { LearningRecord } from "./learningStore";
import { continueHref, type WeekStatus } from "./study";
import { applySummary, type ApplySummary } from "./applyView";

// 한 주의 기본 흐름(핵심 단계 학습 → 확인 문제 → 백지공부 → 과제)의 상태와 "지금 할 일"을 계산한다.
// 주차 개요와 적용과 복습 · 한눈에 보기가 같은 카드를 쓴다.

export interface FlowNode {
  step: number;
  title: string;
  place: string;
  state: string;
  done: boolean;
  current: boolean;
  locked?: boolean;
  href: string;
}

export interface WeekFlow {
  nodes: FlowNode[];
  next: { label: string; detail: string; href: string };
  /** 오른쪽 위 요약(예: "핵심 4/7 · 제출 0/2") */
  summary: string;
  allDone: boolean;
}

export function weekFlow(week: WeekMeta, record: LearningRecord, status: WeekStatus, apply?: ApplySummary): WeekFlow {
  const slug = week.slug;
  const s = apply ?? applySummary(week, record, status);
  const core = status.sections.filter((r) => r.section.tier === "core");
  const checks = core.reduce(
    (acc, r) => ({ done: acc.done + r.progress.checksDone, total: acc.total + r.progress.checksTotal }),
    { done: 0, total: 0 }
  );
  const learnHref = continueHref(slug, status);
  const path = s.items.filter((i) => i.onPath);
  const allPath = s.pathDone === s.pathTotal;
  const coreLeft = status.tiers.core.total - status.tiers.core.done;

  const nodes: FlowNode[] = [
    {
      step: 1,
      title: "핵심 단계 학습",
      place: "학습 자료",
      state: status.coreDone ? "완료" : `${status.tiers.core.done}/${status.tiers.core.total}단계`,
      done: status.coreDone,
      current: !status.coreDone,
      href: learnHref,
    },
    {
      step: 2,
      title: "확인 문제",
      place: "학습 자료",
      state: `${checks.done}/${checks.total}문항`,
      done: checks.total > 0 && checks.done >= checks.total,
      current: false,
      href: learnHref,
    },
    ...path.map((item, i) => ({
      step: i + 3,
      title: item.label,
      place: "적용과 복습",
      state: item.locked ? "핵심 단계를 마치면 열림" : item.state,
      done: item.complete,
      current: status.coreDone && s.nextPath?.key === item.key,
      locked: item.locked,
      href: item.href,
    })),
  ];

  const nextExtra = s.items.find((i) => !i.onPath && i.key !== "notes" && i.total > 0 && !i.complete);
  const next = !status.coreDone
    ? { label: status.tiers.core.done === 0 ? "핵심 1단계부터 시작하기" : "핵심 단계 이어서 학습하기", detail: `핵심 단계 ${coreLeft}개 남음`, href: learnHref }
    : s.nextPath
      ? {
          label: `${s.nextPath.label} ${s.nextPath.key === "assignment" ? "작성·제출하기" : "작성하기"}`,
          detail: s.nextPath.desc,
          href: s.nextPath.href,
        }
      : nextExtra
        ? { label: `${nextExtra.label} 이어서 하기`, detail: "백지공부·과제 제출 완료", href: nextExtra.href }
        : { label: "복습 노트 보기", detail: "모든 활동 완료", href: `/weeks/${slug}/quiz` };

  return {
    nodes,
    next,
    summary: `핵심 ${status.tiers.core.done}/${status.tiers.core.total} · 제출 ${s.pathDone}/${s.pathTotal}`,
    allDone: status.coreDone && allPath,
  };
}
