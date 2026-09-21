export const CHECKLIST_ITEMS = [
  { id: "learn", label: "학습 순서 완료 (영상·읽기)" },
  { id: "practice", label: "실습 코드 실행" },
  { id: "quiz", label: "퀴즈 자기 점검" },
  { id: "worksheet", label: "백지공부 시트 작성" },
  { id: "assignment", label: "과제 제출" },
] as const;

export type ChecklistId = (typeof CHECKLIST_ITEMS)[number]["id"];
type WeekProgress = Partial<Record<ChecklistId, boolean>>;
type ProgressStore = Record<string, WeekProgress>;
type WorksheetStore = Record<string, Record<string, string>>;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * A minimal external store bound to one localStorage key, exposing a stable
 * cached snapshot so it can be read with useSyncExternalStore (which requires
 * getSnapshot to return the same reference until the data actually changes).
 */
function createLocalStore<T extends object>(key: string, empty: T) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();

  const load = (): T => {
    if (cache) return cache;
    cache = typeof window === "undefined" ? empty : safeParse(localStorage.getItem(key), empty);
    return cache;
  };

  const emit = () => listeners.forEach((l) => l());

  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot: () => load(),
    getServerSnapshot: () => empty,
    write(next: T) {
      cache = next;
      if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(next));
      emit();
    },
  };
}

const EMPTY_PROGRESS: ProgressStore = {};
export const progressStore = createLocalStore<ProgressStore>("aegis-progress:v1", EMPTY_PROGRESS);

export function getWeekProgress(store: ProgressStore, slug: string): WeekProgress {
  return store[slug] ?? {};
}

export function setChecklistItem(slug: string, id: ChecklistId, done: boolean) {
  const current = progressStore.getSnapshot();
  progressStore.write({ ...current, [slug]: { ...current[slug], [id]: done } });
}

export function weekCompletionRatio(progress: WeekProgress): number {
  const done = CHECKLIST_ITEMS.filter((it) => progress[it.id]).length;
  return done / CHECKLIST_ITEMS.length;
}

const EMPTY_WORKSHEETS: WorksheetStore = {};
export const worksheetStore = createLocalStore<WorksheetStore>("aegis-worksheet:v1", EMPTY_WORKSHEETS);

export function readWorksheet(store: WorksheetStore, slug: string): Record<string, string> {
  return store[slug] ?? {};
}

export function writeWorksheetField(slug: string, label: string, value: string) {
  const current = worksheetStore.getSnapshot();
  worksheetStore.write({ ...current, [slug]: { ...current[slug], [label]: value } });
}

export function clearWorksheet(slug: string) {
  const current = worksheetStore.getSnapshot();
  const next = { ...current };
  delete next[slug];
  worksheetStore.write(next);
}

// 퀴즈: 한 번에 한 문항씩 진행하며(진도 저장) 스스로 답을 적어보는 자기 점검용.
// 정답은 이 스토어에 없다 — quizAnswers.ts는 운영자 전용으로 계속 비공개.
interface QuizWeekState {
  index: number;
  drafts: Record<string, string>;
}
type QuizStore = Record<string, QuizWeekState>;

const EMPTY_QUIZ: QuizStore = {};
export const quizStore = createLocalStore<QuizStore>("aegis-quiz:v1", EMPTY_QUIZ);

export function readQuizState(store: QuizStore, slug: string): QuizWeekState {
  return store[slug] ?? { index: 0, drafts: {} };
}

export function writeQuizDraft(slug: string, questionId: string, value: string) {
  const current = quizStore.getSnapshot();
  const week = readQuizState(current, slug);
  quizStore.write({ ...current, [slug]: { ...week, drafts: { ...week.drafts, [questionId]: value } } });
}

export function writeQuizIndex(slug: string, index: number) {
  const current = quizStore.getSnapshot();
  const week = readQuizState(current, slug);
  quizStore.write({ ...current, [slug]: { ...week, index } });
}

export function resetQuiz(slug: string) {
  const current = quizStore.getSnapshot();
  const next = { ...current };
  delete next[slug];
  quizStore.write(next);
}

// 과제: 코드 실습을 한 번에 하나씩만 공개하기 위한 "여기까지 열림" 카운트.
type AssignmentGateStore = Record<string, number>;
const EMPTY_GATES: AssignmentGateStore = {};
export const assignmentGateStore = createLocalStore<AssignmentGateStore>("aegis-assignment-gate:v1", EMPTY_GATES);

export function readUnlockedCodeCount(store: AssignmentGateStore, slug: string): number {
  return store[slug] ?? 0;
}

export function unlockNextCode(slug: string, completedIndex: number) {
  const current = assignmentGateStore.getSnapshot();
  const unlocked = readUnlockedCodeCount(current, slug);
  if (completedIndex >= unlocked) {
    assignmentGateStore.write({ ...current, [slug]: completedIndex + 1 });
  }
}
