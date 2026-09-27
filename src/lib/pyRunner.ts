"use client";

// Pyodide Web Worker를 감싸는 싱글턴 클라이언트.
// 페이지 안의 모든 CodeCell이 이 하나의 워커(=하나의 Pyodide 런타임)를
// 공유한다 — 코드 셀마다 워커를 새로 만들면 Pyodide(수 MB의 wasm)를
// 그만큼 여러 번 내려받고 초기화하게 되어 매우 느려진다.
export type RunStatus = "loading-runtime" | "loading-packages" | "running";

export interface RunHandlers {
  onStatus?: (status: RunStatus) => void;
  onStream?: (stream: "stdout" | "stderr", text: string) => void;
}

export interface RunResult {
  ok: boolean;
  result?: string;
  error?: string;
  /** 실행 중에 그린 matplotlib 그림(PNG, base64) */
  images?: string[];
}

export interface RunOptions {
  /** 이름공간 id. 같은 id로 실행한 코드끼리 변수를 공유한다(과제 노트북). 생략하면 전역 이름공간. */
  ns?: string;
}

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<
  number,
  { resolve: (r: RunResult) => void; handlers?: RunHandlers }
>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker("/pyodide-worker.js");
  worker.onmessage = (event: MessageEvent) => {
    const data = event.data as
      | { id: number; type: "status"; status: RunStatus }
      | { id: number; type: "stream"; stream: "stdout" | "stderr"; text: string }
      | { id: number; type: "result"; result?: string; images?: string[] }
      | { id: number; type: "error"; message: string; images?: string[] }
      | { id: number; type: "ready" }
      | { id: number; type: "interrupted" };

    if (data.type === "stream") {
      // stdout/stderr 스트림은 현재 실행 중인(가장 최근) 요청으로 라우팅한다.
      const entry = [...pending.values()].pop();
      entry?.handlers?.onStream?.(data.stream, data.text);
      return;
    }

    const entry = pending.get(data.id);
    if (!entry) return;

    if (data.type === "status") {
      entry.handlers?.onStatus?.(data.status);
      return;
    }
    if (data.type === "result") {
      pending.delete(data.id);
      entry.resolve({ ok: true, result: data.result, images: data.images });
      return;
    }
    if (data.type === "error") {
      pending.delete(data.id);
      entry.resolve({ ok: false, error: data.message, images: data.images });
      return;
    }
  };
  return worker;
}

/** Pyodide 로딩을 미리 시작해두고 싶을 때(예: 코드 셀이 화면에 보이는 시점) 호출. */
export function preloadPyodide() {
  if (typeof window === "undefined") return;
  getWorker().postMessage({ id: -1, type: "init" });
}

export function runPython(code: string, handlers?: RunHandlers, options?: RunOptions): Promise<RunResult> {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, { resolve, handlers });
    getWorker().postMessage({ id, type: "run", code, ns: options?.ns });
  });
}

function request(message: Record<string, unknown>): Promise<RunResult> {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, { resolve });
    getWorker().postMessage({ id, ...message });
  });
}

/** 노트북 이름공간을 비운다(변수를 모두 지움). */
export function resetNamespace(ns: string): Promise<RunResult> {
  return request({ type: "reset", ns });
}

/** 코드에서 읽을 수 있도록 텍스트 파일을 실행 환경의 가상 파일 시스템에 쓴다. */
export function writeRuntimeFiles(files: { path: string; content: string }[]): Promise<RunResult> {
  return request({ type: "files", files });
}

const resetListeners = new Set<() => void>();

/** 강제 중단 등으로 실행 환경이 새로 만들어질 때 알림을 받는다(이름공간·파일이 모두 사라진다). */
export function onRuntimeReset(listener: () => void): () => void {
  resetListeners.add(listener);
  return () => resetListeners.delete(listener);
}

/**
 * 무한루프 등으로 응답이 없는 실행을 강제 종료한다. Pyodide는 wasm 위의
 * 단일 스레드 인터프리터라 진짜 인터럽트가 불가능하므로, 유일한 방법은
 * 워커 자체를 종료하고 다음 실행을 위해 새 워커(=새 Pyodide 인스턴스)를
 * 준비하는 것이다. 그만큼 다음 실행 때 초기화 시간이 다시 든다.
 */
export function forceStop() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  for (const [, entry] of pending) {
    entry.resolve({ ok: false, error: "실행을 중단했습니다." });
  }
  pending.clear();
  resetListeners.forEach((l) => l());
}
