import week1 from "./week1";
import week2 from "./week2";
import week3 from "./week3";
import week4 from "./week4";
import week5 from "./week5";
import week6 from "./week6";
import week7 from "./week7";
import week8 from "./week8";
import type { WeekMeta } from "../types";

export const WEEKS: WeekMeta[] = [week1, week2, week3, week4, week5, week6, week7, week8];

export function getWeek(slug: string): WeekMeta | undefined {
  return WEEKS.find((w) => w.slug === slug);
}

export function getAdjacentWeeks(number: number) {
  return {
    prev: WEEKS.find((w) => w.number === number - 1),
    next: WEEKS.find((w) => w.number === number + 1),
  };
}
