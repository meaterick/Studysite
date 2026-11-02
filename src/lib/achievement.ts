import "server-only";
import type { Tier } from "@/content/tiers";
import { itemId } from "@/content/course";
import type { LearningRecord } from "./learningStore";
import type { ModuleStatus, TierCount } from "./study";

// 보충·심화 레슨의 기록. 모듈 완료(핵심)와 섞지 않고 따로 보여 준다.
// - 레슨: 확인 문제를 모두 맞혀 완료한 보충·심화 레슨
// - 코딩 실습: 해당 구분 레슨의 실습 중 모든 채점 항목을 통과한 것
// - 과제 심화 문제(심화만): 자동 채점을 모두 통과한 것
// 심화의 레슨·실습·과제 심화 문제를 모두 마치면 그 모듈의 "심화 달성"으로 표시한다.

export interface TierRecord {
  tier: Tier;
  lessons: TierCount;
  exercises: TierCount;
  /** 과제 심화 문제(심화 기록에만 있음) */
  challenges: TierCount;
  earned: number;
  total: number;
  /** 레슨·실습·심화 문제를 모두 마쳤는가 */
  complete: boolean;
}

export function tierRecord(status: ModuleStatus, record: LearningRecord, tier: Exclude<Tier, "core">): TierRecord {
  const lessons = status.module.lessons.filter((l) => l.tier === tier);
  const exerciseIds = lessons.flatMap((l) => (l.exercises ?? []).map((e) => itemId(l.id, e.key)));
  const challengeIds = tier === "advanced" && status.module.assignment ? status.module.assignment.challenges.map((c) => itemId(status.module.assignment!.key, c.key)) : [];
  const passed = (id: string) => !!record.exercises[id]?.passedAt;
  const lessonCount = status.tiers[tier];
  const exercises = { done: exerciseIds.filter(passed).length, total: exerciseIds.length };
  const challenges = { done: challengeIds.filter(passed).length, total: challengeIds.length };
  const earned = lessonCount.done + exercises.done + challenges.done;
  const total = lessonCount.total + exercises.total + challenges.total;
  return { tier, lessons: lessonCount, exercises, challenges, earned, total, complete: total > 0 && earned === total };
}
