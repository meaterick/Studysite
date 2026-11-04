import "server-only";
import type { WeekMeta } from "@/content/types";
import type { Tier } from "@/content/tiers";
import { getWeekLab } from "@/content/labs";
import { readLabState, type LearningRecord } from "./learningStore";
import { quizItemDone } from "./labView";
import type { TierCount, WeekStatus } from "./study";

// 보충·심화 과정의 기록. 주차 완료(핵심)와 섞지 않고 따로 보여 준다.
// - 단계: 확인 문제를 모두 맞혀 완료한 보충·심화 단계
// - 코딩 실습: 해당 구분의 실습 중 모든 채점 항목을 통과한 것
// - 퀴즈: 해당 구분의 문항 중 끝낸 것(객관식·출력 예측은 정답 또는 정답 공개, 서술형은 자기평가)
// - 과제 심화 문제(심화만): 자동 채점을 모두 통과한 것
// 심화의 단계·실습·심화 문제를 모두 마치면 그 주차의 "심화 달성"으로 표시한다(퀴즈는 기록만 한다).

export interface TierRecord {
  tier: Tier;
  sections: TierCount;
  labs: TierCount;
  quiz: TierCount;
  /** 과제 심화 문제(심화 기록에만 있음) */
  challenges: TierCount;
  /** 단계 + 실습 + 심화 문제 기준 */
  earned: number;
  total: number;
  /** 단계·실습·심화 문제를 모두 마쳤는가 */
  complete: boolean;
}

export function tierRecord(week: WeekMeta, record: LearningRecord, status: WeekStatus, tier: Exclude<Tier, "core">): TierRecord {
  const lab = getWeekLab(week.slug);
  const state = readLabState(record, week.slug);
  const exercises = lab?.exercises.filter((e) => e.tier === tier) ?? [];
  const quizItems = lab?.quiz.filter((q) => q.tier === tier) ?? [];
  const challenges = tier === "advanced" ? (lab?.assignment.challenges ?? []) : [];
  const count = (items: { id: string }[], done: (id: string) => boolean): TierCount => ({
    done: items.filter((i) => done(i.id)).length,
    total: items.length,
  });
  const passed = (id: string) => !!state.exercises[id]?.passedAt;
  const sections = status.tiers[tier];
  const labs = count(exercises, passed);
  const ch = count(challenges, passed);
  const quiz: TierCount = { done: quizItems.filter((q) => quizItemDone(q, state.quiz[q.id])).length, total: quizItems.length };
  const earned = sections.done + labs.done + ch.done;
  const total = sections.total + labs.total + ch.total;
  return { tier, sections, labs, quiz, challenges: ch, earned, total, complete: total > 0 && earned === total };
}
