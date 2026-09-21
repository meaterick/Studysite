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
      | { id: number; type: "result"; result?: string }
      | { id: number; type: "error"; message: string }
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
      entry.resolve({ ok: true, result: data.result });
      return;
    }
    if (data.type === "error") {
      pending.delete(data.id);
      entry.resolve({ ok: false, error: data.message });
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

export function runPython(code: string, handlers?: RunHandlers): Promise<RunResult> {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, { resolve, handlers });
    getWorker().postMessage({ id, type: "run", code });
  });
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
    entry.resolve({ ok: false, error: "실행이 중단되었습니다." });
  }
  pending.clear();
}
