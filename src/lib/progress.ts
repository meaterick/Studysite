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
