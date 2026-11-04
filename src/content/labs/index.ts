import type { CodingExercise, LabQuizItem, WeekLab } from "../types";
import week1 from "./week1";
import week2 from "./week2";
import week3 from "./week3";
import week4 from "./week4";
import week5 from "./week5";
import week6 from "./week6";
import week7 from "./week7";
import week8 from "./week8";

// 주차 slug → 코딩 실습·퀴즈·과제 자동 테스트. 기존 주차 콘텐츠(weeks/, sections/, assignments/)는 건드리지 않고
// 이 폴더에만 추가한다. 실습·퀴즈 id는 진도 저장 키이므로 한 번 정하면 바꾸지 않는다.
export const LABS: Record<string, WeekLab> = {
  "week-1": week1,
  "week-2": week2,
  "week-3": week3,
  "week-4": week4,
  "week-5": week5,
  "week-6": week6,
  "week-7": week7,
  "week-8": week8,
};

export function getWeekLab(slug: string): WeekLab | undefined {
  return LABS[slug];
}

/** 단계 실습과 과제 심화 문제를 함께 찾는다. */
export function findLabExercise(slug: string, id: string): { exercise: CodingExercise; challenge: boolean } | undefined {
  const lab = LABS[slug];
  if (!lab) return undefined;
  const exercise = lab.exercises.find((e) => e.id === id);
  if (exercise) return { exercise, challenge: false };
  const challenge = lab.assignment.challenges.find((e) => e.id === id);
  return challenge ? { exercise: challenge, challenge: true } : undefined;
}

export function findLabQuizItem(slug: string, id: string): LabQuizItem | undefined {
  return LABS[slug]?.quiz.find((q) => q.id === id);
}

