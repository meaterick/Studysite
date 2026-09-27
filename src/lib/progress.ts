// 브라우저(localStorage)에만 두는 가벼운 상태. 학습 진도·퀴즈·백지공부·과제는 이제
// 서버(learningStore/submissionStore)에 저장되고, 여기에는 과제 코드 실습의
// "한 번에 하나씩 공개" 진행 상태만 남아 있다.

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
