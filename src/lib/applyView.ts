import "server-only";
import type { WeekMeta } from "@/content/types";
import { TIER_ORDER, type Tier } from "@/content/tiers";
import { getWeekLab } from "@/content/labs";
import { readLabState, readSectionState, readWorksheetState, type LearningRecord } from "./learningStore";
import { quizItemDone, quizItemWeak } from "./labView";
import { ASSIGNMENT_STATUS_LABEL, type TierCount, type WeekStatus } from "./study";

// "적용과 복습" 페이지 묶음의 요약. 상단 탭, 하위 메뉴, 한눈에 보기 화면이 모두 이 함수 하나로 상태를 계산한다.
//
// 주차 학습 흐름은 세 페이지로 나뉜다.
//   개요 → 학습 자료(단계별 설명 + 단계마다 빠르게 푸는 객관식 확인 문제) → 적용과 복습
// 적용과 복습에는 아래 여섯 활동을 권장 순서대로 둔다. 필수는 백지공부·과제 두 가지뿐이고(진행률에는 넣지 않고 따로 표시한다),
// 나머지는 실력을 다지는 추가 활동이다.

export type ApplyKey = "descriptive" | "lab" | "drill" | "worksheet" | "assignment" | "notes";

export interface ApplyItem {
  key: ApplyKey;
  label: string;
  /** 한 줄 설명(한눈에 보기 화면) */
  desc: string;
  href: string;
  /** 주차 진행률에 들어가는 필수 활동인가 */
  required: boolean;
  done: number;
  total: number;
  /** 핵심·보충·심화별 진행(해당하는 활동만) */
  tiers?: Record<Tier, TierCount>;
  /** 상태 문구(예: "통과 3/9", "제출 완료") */
  state: string;
  complete: boolean;
  /** lock 모드에서 핵심 단계를 마치기 전 */
  locked: boolean;
  /** 다시 볼 문항 수(퀴즈·서술형·복습 노트) */
  weak: number;
}

export interface ApplySummary {
  items: ApplyItem[];
  requiredDone: number;
  requiredTotal: number;
  /** 다음에 할 필수 활동(모두 끝냈으면 undefined) */
  nextRequired?: ApplyItem;
}

const emptyTiers = (): Record<Tier, TierCount> =>
  Object.fromEntries(TIER_ORDER.map((t) => [t, { done: 0, total: 0 }])) as Record<Tier, TierCount>;

function add(tiers: Record<Tier, TierCount>, tier: Tier, done: boolean) {
  tiers[tier].total++;
  if (done) tiers[tier].done++;
}

const sum = (tiers: Record<Tier, TierCount>) =>
  TIER_ORDER.reduce((acc, t) => ({ done: acc.done + tiers[t].done, total: acc.total + tiers[t].total }), { done: 0, total: 0 });

export function applySummary(week: WeekMeta, record: LearningRecord, status: WeekStatus): ApplySummary {
  const slug = week.slug;
  const base = `/weeks/${slug}`;
  const lab = getWeekLab(slug);
  const labState = readLabState(record, slug);
  const sheet = readWorksheetState(record, slug);
  const finaleLocked = !status.finaleOpen;

  // 서술형: 단계별 서술형 문항 + 퀴즈의 서술형 문항
  const descTiers = emptyTiers();
  let descWeak = 0;
  let checkWeak = 0;
  for (const { section } of status.sections) {
    const st = readSectionState(record, slug, section.id);
    for (const id of section.meta.quizIds) {
      const a = st.answers[id];
      add(descTiers, section.tier, !!a?.review);
      if (a?.review === "incorrect") descWeak++;
    }
    checkWeak += section.meta.checks.filter((c) => (st.checks[c.id]?.wrong.length ?? 0) > 0).length;
  }
  const quizTiers = emptyTiers();
  let quizWeak = 0;
  for (const q of lab?.quiz ?? []) {
    const s = labState.quiz[q.id];
    if (q.kind === "descriptive") {
      add(descTiers, q.tier, quizItemDone(q, s));
      if (quizItemWeak(q, s)) descWeak++;
    } else {
      add(quizTiers, q.tier, quizItemDone(q, s));
      if (quizItemWeak(q, s)) quizWeak++;
    }
  }
  const labTiers = emptyTiers();
  for (const e of lab?.exercises ?? []) add(labTiers, e.tier, !!labState.exercises[e.id]?.passedAt);

  const desc = sum(descTiers);
  const quiz = sum(quizTiers);
  const labs = sum(labTiers);
  const sheetWeak = Object.values(sheet.marks ?? {}).filter((m) => m === "weak").length;
  const notesWeak = checkWeak + descWeak + quizWeak + sheetWeak;
  const assignmentDone = status.assignment.status !== "none";

  const items: ApplyItem[] = [
    {
      key: "descriptive",
      label: "서술형",
      desc: "배운 개념을 자신의 말로 설명해 보고, 모범답안과 비교해 스스로 평가합니다.",
      href: `${base}/descriptive`,
      required: false,
      ...desc,
      tiers: descTiers,
      state: `${desc.done}/${desc.total}`,
      complete: desc.total > 0 && desc.done === desc.total,
      locked: false,
      weak: descWeak,
    },
    {
      key: "lab",
      label: "코딩 실습",
      desc: "TODO가 비어 있는 코드를 직접 채우고 브라우저에서 바로 자동 채점을 받습니다.",
      href: `${base}/lab`,
      required: false,
      ...labs,
      tiers: labTiers,
      state: `${labs.done}/${labs.total}`,
      complete: labs.total > 0 && labs.done === labs.total,
      locked: false,
      weak: 0,
    },
    {
      key: "drill",
      label: "추가 퀴즈",
      desc: "단계 확인 문제보다 한 걸음 더 나아간 객관식·코드 출력 예측 문제를 풉니다.",
      href: `${base}/drill`,
      required: false,
      ...quiz,
      tiers: quizTiers,
      state: `${quiz.done}/${quiz.total}`,
      complete: quiz.total > 0 && quiz.done === quiz.total,
      locked: false,
      weak: quizWeak,
    },
    {
      key: "worksheet",
      label: "백지공부",
      desc: "자료를 덮고 이번 주 내용을 떠올려 적은 뒤, 제출하고 학습 자료와 비교합니다.",
      href: `${base}/worksheet`,
      required: true,
      done: sheet.submittedAt ? 1 : 0,
      total: 1,
      state: sheet.submittedAt ? "제출 완료" : sheet.savedAt ? "작성 중" : "미작성",
      complete: !!sheet.submittedAt,
      locked: finaleLocked,
      weak: sheetWeak,
    },
    {
      key: "assignment",
      label: "과제",
      desc: `코드 실행부터 보고서 작성, 제출까지 이 사이트에서 진행합니다. ${week.dueNote}.`,
      href: `${base}/assignment`,
      required: true,
      done: assignmentDone ? 1 : 0,
      total: 1,
      state:
        status.assignment.status === "graded"
          ? `채점 완료 · ${status.assignment.score ?? "-"}/${status.assignment.maxScore}점`
          : ASSIGNMENT_STATUS_LABEL[status.assignment.status],
      complete: assignmentDone,
      locked: finaleLocked,
      weak: 0,
    },
    {
      key: "notes",
      label: "복습 노트",
      desc: "틀렸던 문제와 '보완 필요'로 표시한 답을 한곳에 모아 다시 봅니다.",
      href: `${base}/quiz`,
      required: false,
      done: 0,
      total: 0,
      state: notesWeak > 0 ? `다시 볼 문항 ${notesWeak}` : "다시 볼 문항 없음",
      complete: false,
      locked: false,
      weak: notesWeak,
    },
  ];
  const required = items.filter((i) => i.required);
  return {
    items,
    requiredDone: required.filter((i) => i.complete).length,
    requiredTotal: required.length,
    nextRequired: required.find((i) => !i.complete),
  };
}
