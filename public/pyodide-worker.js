// 브라우저 Web Worker에서 Python 코드를 실행하는 스크립트.
// 메인 스레드를 막지 않기 위해 실행은 전부 이 워커 안에서 일어나고,
// Pyodide(wasm으로 컴파일된 CPython)는 첫 실행 요청이 들어올 때만
// CDN에서 지연 로드된다 — 서버는 전혀 관여하지 않으므로 1GB RAM
// OCI 박스에는 어떤 부담도 주지 않는다.
const PYODIDE_VERSION = "v0.29.5";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

let pyodideReadyPromise = null;

function loadPyodideOnce() {
  if (!pyodideReadyPromise) {
    importScripts(`${PYODIDE_CDN}pyodide.js`);
    pyodideReadyPromise = loadPyodide({ indexURL: PYODIDE_CDN }).then((pyodide) => {
      pyodide.setStdout({
        batched: (text) => postMessage({ type: "stream", stream: "stdout", text }),
      });
      pyodide.setStderr({
        batched: (text) => postMessage({ type: "stream", stream: "stderr", text }),
      });
      return pyodide;
    });
  }
  return pyodideReadyPromise;
}

self.onmessage = async (event) => {
  const { id, type } = event.data;

  if (type === "init") {
    // 실제 사용 전에 미리 준비만 시켜두고 싶을 때(프리로드) 쓰는 경로.
    try {
      await loadPyodideOnce();
      postMessage({ id, type: "ready" });
    } catch (err) {
      postMessage({ id, type: "error", message: String(err) });
    }
    return;
  }

  if (type === "run") {
    const { code } = event.data;
    try {
      postMessage({ id, type: "status", status: "loading-runtime" });
      const pyodide = await loadPyodideOnce();
      postMessage({ id, type: "status", status: "loading-packages" });
      try {
        await pyodide.loadPackagesFromImports(code);
      } catch {
        // 알 수 없는/미지원 패키지 import는 무시하고 실행을 시도한다 —
        // 실제 오류는 실행 시 ImportError로 정상적으로 사용자에게 보인다.
      }
      postMessage({ id, type: "status", status: "running" });
      const result = await pyodide.runPythonAsync(code);
      const repr = result === undefined || result === null ? undefined : String(result);
      postMessage({ id, type: "result", result: repr });
    } catch (err) {
      postMessage({ id, type: "error", message: err && err.message ? err.message : String(err) });
    }
    return;
  }

  if (type === "interrupt") {
    // Pyodide는 진짜 중단(kill)이 불가능하므로(단일 wasm 스레드),
    // 실행 중 무한루프는 워커 자체를 종료하고 재생성하는 방식으로 처리한다
    // (클라이언트 쪽 pyRunner.ts가 이 재생성을 담당).
    postMessage({ id, type: "interrupted" });
  }
};
