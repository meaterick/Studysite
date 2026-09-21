"use client";

import { openDB, type IDBPDatabase } from "idb";

// 실습/과제 코드 셀의 내용을 저장하는 IndexedDB 래퍼.
// localStorage(progress.ts)는 작은 문자열(백지공부, 체크리스트)에 쓰고,
// 코드처럼 더 커질 수 있고 빈번히 갱신되는 데이터는 IndexedDB에 둔다.
const DB_NAME = "aegis-code-store";
const STORE = "cells";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

/** cellId는 보통 `${slug}:${docKey}:${index}` 형태의 안정적인 키다. */
export async function loadCellCode(cellId: string): Promise<string | undefined> {
  if (typeof indexedDB === "undefined") return undefined;
  try {
    const db = await getDb();
    return await db.get(STORE, cellId);
  } catch {
    return undefined;
  }
}

export async function saveCellCode(cellId: string, code: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await getDb();
    await db.put(STORE, code, cellId);
  } catch {
    // IndexedDB를 못 쓰는 환경(사생활 보호 모드 등)에서는 조용히 무시 —
    // 에디터 자체는 계속 동작해야 하므로 저장 실패가 사용을 막으면 안 된다.
  }
}

export async function resetCellCode(cellId: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await getDb();
    await db.delete(STORE, cellId);
  } catch {
    // no-op
  }
}
