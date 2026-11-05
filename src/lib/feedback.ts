import "server-only";
import { MODULES } from "@/content/course";
import { lessonLabel } from "@/content/tiers";
import { readLessonState, readRecallState, type LearningRecord } from "./learningStore";
import { reviewHref } from "./routes";

/** 모듈 하나의 복습 거리 */
export interface ModuleReview {
  moduleSlug: string;
  moduleCode: string;
  moduleTitle: string;
  /** 다시 볼 레슨들 */
  lessons: { lessonId: string; label: string; title: string; wrongChecks: number; recovered: number; weakAnswers: number; revealedPredicts: number }[];
  weakRecall: number;
  /** 아직 해결하지 않은 것의 수(정렬용) */
  open: number;
  href: string;
}

export function moduleReview(slug: string, record: LearningRecord): ModuleReview | undefined {
  const mod = MODULES.find((m) => m.slug === slug);
  if (!mod) return undefined;
  const lessons: ModuleReview["lessons"] = [];
  for (const lesson of mod.lessons) {
    const state = readLessonState(record, lesson.id);
    let wrongChecks = 0;
    let recovered = 0;
    for (const c of lesson.checks) {
      const s = state.checks[c.key];
      if (s && s.wrong.length > 0) {
        wrongChecks++;
        if (s.correct) recovered++;
      }
    }
    const weakAnswers = (lesson.descriptive ?? []).filter((d) => state.answers[d.key]?.review === "incorrect").length;
    const revealedPredicts = (lesson.predicts ?? []).filter((p) => state.predicts[p.key]?.revealed && !state.predicts[p.key]?.correct).length;
    if (wrongChecks + weakAnswers + revealedPredicts > 0) {
      lessons.push({ lessonId: lesson.id, label: lessonLabel(lesson), title: lesson.title, wrongChecks, recovered, weakAnswers, revealedPredicts });
    }
  }
  const weakRecall = Object.values(readRecallState(record, slug).marks).filter((m) => m === "weak").length;
  const open = lessons.reduce((n, l) => n + l.wrongChecks - l.recovered + l.weakAnswers + l.revealedPredicts, 0) + weakRecall;
  if (lessons.length === 0 && weakRecall === 0) return undefined;
  return { moduleSlug: slug, moduleCode: mod.code, moduleTitle: mod.title, lessons, weakRecall, open, href: reviewHref(slug) };
}

export function reviewModules(record: LearningRecord): ModuleReview[] {
  return MODULES.map((m) => moduleReview(m.slug, record))
    .filter((r): r is ModuleReview => !!r)
    .sort((a, b) => b.open - a.open);
}
