"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

// 문제를 풀거나 답을 저장해도 서버가 화면 전체를 다시 그리지 않는다. 서버 액션은 바뀐 문항의 결과만 돌려주고,
// 같은 화면의 진행 숫자(맞힌 문제 수, 다시 볼 문항, 단계 완료 버튼 등)는 이 저장소로 맞춘다.
// 이 탭에서 저장한 결과는 모듈 변수(saved)에도 남긴다. 뒤로/앞으로 가기는 예전에 받아 둔 화면을 그대로 다시 보여 주므로,
// 그때도 방금 푼 문항이 풀지 않은 것처럼 보이지 않도록 서버가 준 값보다 이 기록을 먼저 쓴다.

export interface ProgressStatus {
  /** 끝낸 문항(맞힘·정답 공개·자기평가 완료) */
  done: boolean;
  /** 다시 볼 문항 */
  weak: boolean;
}

export interface ProgressEntry<V> extends ProgressStatus {
  /** 문항 화면이 그리는 데 쓰는 상태(답, 공개된 해설 등) */
  view: V;
}

const saved = new Map<string, ProgressEntry<unknown>>();

interface Store {
  statuses: Record<string, ProgressStatus>;
  update: (id: string, status: ProgressStatus) => void;
}

const ProgressContext = createContext<Store | null>(null);

/** 화면에 있는 문항들의 처음 상태(서버 값)를 받는다. 문항 id는 화면 사이에서 겹치지 않게 종류를 앞에 붙인다(check:…, desc:…, drill:…). */
export function ProgressProvider({ items, children }: { items: Record<string, ProgressStatus>; children: ReactNode }) {
  const [statuses, setStatuses] = useState(() => {
    const out: Record<string, ProgressStatus> = {};
    for (const [id, status] of Object.entries(items)) {
      const local = saved.get(id);
      out[id] = local ? { done: local.done, weak: local.weak } : status;
    }
    return out;
  });
  const update = useCallback((id: string, status: ProgressStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: { done: status.done, weak: status.weak } }));
  }, []);
  const value = useMemo(() => ({ statuses, update }), [statuses, update]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/** 문항 하나의 상태. 서버 액션 결과로 update하면 같은 화면의 진행 숫자도 함께 바뀐다. */
export function useProgressItem<V>(id: string, initial: ProgressEntry<V>) {
  const store = useContext(ProgressContext);
  const [entry, setEntry] = useState<ProgressEntry<V>>(() => (saved.get(id) as ProgressEntry<V> | undefined) ?? initial);
  const update = useCallback(
    (next: ProgressEntry<V>) => {
      saved.set(id, next);
      setEntry(next);
      store?.update(id, next);
    },
    [id, store]
  );
  return [entry, update] as const;
}

/** 저장소에 있는 문항 상태. 저장소 밖이면 null */
export function useProgressStatuses(): Record<string, ProgressStatus> | null {
  return useContext(ProgressContext)?.statuses ?? null;
}

function countOf(statuses: Record<string, ProgressStatus> | null, ids: string[], field: keyof ProgressStatus): number {
  return statuses ? ids.filter((id) => statuses[id]?.[field]).length : 0;
}

/** ids 가운데 끝낸(또는 다시 볼) 문항 수 */
export function ProgressCount({ ids, field = "done" }: { ids: string[]; field?: keyof ProgressStatus }) {
  return <>{countOf(useProgressStatuses(), ids, field)}</>;
}

/** 조건을 만족할 때만 children을 보여 준다: allDone(모두 끝냄) / anyWeak(다시 볼 문항이 있음) */
export function ProgressShow({ ids, when, children }: { ids: string[]; when: "allDone" | "anyWeak"; children: ReactNode }) {
  const statuses = useProgressStatuses();
  const show = when === "allDone" ? ids.length > 0 && countOf(statuses, ids, "done") === ids.length : countOf(statuses, ids, "weak") > 0;
  return show ? <>{children}</> : null;
}
