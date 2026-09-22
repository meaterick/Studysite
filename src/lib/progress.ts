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
export type QuizReviewStatus = "correct" | "incorrect";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface LocalStore<T> {
  subscribe(cb: () => void): () => void;
  getSnapshot(): T;
  getServerSnapshot(): T;
  write(next: T): void;
}

/**
 * A minimal external store bound to one localStorage key, exposing a stable
 * cached snapshot so it can be read with useSyncExternalStore (which requires
 * getSnapshot to return the same reference until the data actually changes).
 */
function createLocalStore<T extends object>(key: string, empty: T): LocalStore<T> {
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

// 공용 브라우저에서 계정끼리 기록이 섞이지 않도록 저장 키를 계정별로 나눈다.
// 같은 (종류, 계정) 조합에는 항상 같은 스토어 인스턴스를 돌려줘야
// useSyncExternalStore의 스냅샷 참조가 안정적으로 유지된다.
const storeRegistry = new Map<string, unknown>();

function scopedStore<T extends object>(kind: string, uid: string, empty: T): LocalStore<T> {
  const key = `${kind}:${uid}`;
  let store = storeRegistry.get(key) as LocalStore<T> | undefined;
  if (!store) {
    store = createLocalStore<T>(key, empty);
    storeRegistry.set(key, store);
  }
  return store;
}

const EMPTY_PROGRESS: ProgressStore = {};
export const getProgressStore = (uid: string) => scopedStore("aegis-progress:v1", uid, EMPTY_PROGRESS);

export function getWeekProgress(store: ProgressStore, slug: string): WeekProgress {
  return store[slug] ?? {};
}

export function setChecklistItem(uid: string, slug: string, id: ChecklistId, done: boolean) {
  const store = getProgressStore(uid);
  const current = store.getSnapshot();
  const next = { ...current, [slug]: { ...current[slug], [id]: done } };
  store.write(next);
  syncLearning(uid, { type: "progress", progress: next });
}

export function weekCompletionRatio(progress: WeekProgress): number {
  const done = CHECKLIST_ITEMS.filter((it) => progress[it.id]).length;
  return done / CHECKLIST_ITEMS.length;
}

// 퀴즈: 한 번에 한 문항씩 진행하며(진도 저장) 스스로 답을 적어보는 자기 점검용.
// 정답 텍스트 자체는 서버에서 내려주고, 여기엔 진행 상태와 초안만 저장한다.
interface QuizWeekState {
  index: number;
  drafts: Record<string, string>;
  reviews: Record<string, QuizReviewStatus>;
}
type QuizStore = Record<string, QuizWeekState>;

const EMPTY_QUIZ: QuizStore = {};
export const getQuizStore = (uid: string) => scopedStore("aegis-quiz:v1", uid, EMPTY_QUIZ);

export function readQuizState(store: QuizStore, slug: string): QuizWeekState {
  const saved = store[slug];
  return { index: saved?.index ?? 0, drafts: saved?.drafts ?? {}, reviews: saved?.reviews ?? {} };
}

export function writeQuizDraft(uid: string, slug: string, questionId: string, value: string) {
  const store = getQuizStore(uid);
  const current = store.getSnapshot();
  const week = readQuizState(current, slug);
  store.write({ ...current, [slug]: { ...week, drafts: { ...week.drafts, [questionId]: value } } });
}

export function writeQuizIndex(uid: string, slug: string, index: number) {
  const store = getQuizStore(uid);
  const current = store.getSnapshot();
  const week = readQuizState(current, slug);
  store.write({ ...current, [slug]: { ...week, index } });
}

export function resetQuiz(uid: string, slug: string) {
  const store = getQuizStore(uid);
  const next = { ...store.getSnapshot() };
  delete next[slug];
  store.write(next);
  syncLearning(uid, { type: "quiz_reviews", slug, reviews: {} });
}

export function writeQuizReview(uid: string, slug: string, questionId: string, status: QuizReviewStatus) {
  const store = getQuizStore(uid);
  const current = store.getSnapshot();
  const week = readQuizState(current, slug);
  const reviews = { ...week.reviews, [questionId]: status };
  store.write({ ...current, [slug]: { ...week, reviews } });
  syncLearning(uid, { type: "quiz_reviews", slug, reviews });
}

function syncLearning(uid: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined" || uid === "guest") return;
  void fetch("/api/learning", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  }).catch(() => {
    // Keep local progress usable when the network is temporarily unavailable.
  });
}

// 과제: 코드 실습을 한 번에 하나씩만 공개하기 위한 "여기까지 열림" 카운트.
type AssignmentGateStore = Record<string, number>;
const EMPTY_GATES: AssignmentGateStore = {};
export const getAssignmentGateStore = (uid: string) =>
  scopedStore("aegis-assignment-gate:v1", uid, EMPTY_GATES);

export function readUnlockedCodeCount(store: AssignmentGateStore, slug: string): number {
  return store[slug] ?? 0;
}

export function unlockNextCode(uid: string, slug: string, completedIndex: number) {
  const store = getAssignmentGateStore(uid);
  const current = store.getSnapshot();
  if (completedIndex >= readUnlockedCodeCount(current, slug)) {
    store.write({ ...current, [slug]: completedIndex + 1 });
  }
}
