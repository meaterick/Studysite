// 브라우저 Web Worker에서 Python 코드를 실행하는 스크립트.
// 메인 스레드를 막지 않기 위해 실행은 전부 이 워커 안에서 일어나고,
// Pyodide(wasm으로 컴파일된 CPython)는 첫 실행 요청이 들어올 때만
// CDN에서 지연 로드된다. 서버는 전혀 관여하지 않는다.
//
// 학습 자료의 코드 셀은 전역 이름공간 하나를 함께 쓰고, 과제 작업 공간(노트북)은
// 과제마다 별도 이름공간(ns)을 써서 셀 사이에 변수를 이어 쓰되 다른 페이지와는 섞이지 않게 한다.
const PYODIDE_VERSION = "v0.29.5";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

// ─── 네트워크 차단 ─────────────────────────────────────────────────────
// 이 워커는 사이트와 같은 출처에서 돌기 때문에, 막지 않으면 Python 코드가 `from js import fetch`
// 등으로 로그인 쿠키가 실린 요청을 사이트에 보낼 수 있다. 운영자가 스터디원의 제출본을 다시 실행할 때
// 그 코드가 운영자 권한으로 서버 액션(채점 등)을 호출하거나 운영자 화면을 읽어 가지 못하도록,
// Pyodide CDN 말고는 어떤 네트워크 요청도, 다른 워커 생성도 할 수 없게 한다.
// (응답 헤더의 Content-Security-Policy(next.config.ts)가 브라우저 수준에서 같은 제한을 한 번 더 건다.)
(function lockDownNetwork() {
  const nativeFetch = self.fetch.bind(self);
  const nativeImportScripts = self.importScripts.bind(self);
  const allowed = (url) => {
    try {
      return new URL(String(url), PYODIDE_CDN).href.startsWith(PYODIDE_CDN);
    } catch {
      return false;
    }
  };
  const blocked = (name) =>
    function () {
      throw new Error(`${name} is disabled in this sandbox`);
    };
  const guards = {
    fetch(input, init) {
      const url = typeof input === "string" || input instanceof URL ? input : input && input.url;
      if (!allowed(url)) return Promise.reject(new TypeError("Network access is disabled in this sandbox"));
      // 인증 정보(쿠키)는 절대 싣지 않는다.
      return nativeFetch(input, { ...(init || {}), credentials: "omit" });
    },
    importScripts(...urls) {
      if (!urls.every(allowed)) throw new Error("importScripts is disabled in this sandbox");
      return nativeImportScripts(...urls);
    },
    XMLHttpRequest: blocked("XMLHttpRequest"),
    WebSocket: blocked("WebSocket"),
    EventSource: blocked("EventSource"),
    Worker: blocked("Worker"),
    SharedWorker: blocked("SharedWorker"),
    BroadcastChannel: blocked("BroadcastChannel"),
    WebTransport: blocked("WebTransport"),
    fetchLater: blocked("fetchLater"),
    caches: undefined,
    indexedDB: undefined,
  };
  for (const [name, value] of Object.entries(guards)) {
    // 프로토타입 체인에 원본이 남아 있으면 Object.getPrototypeOf(self).fetch로 되찾을 수 있으므로 모두 덮는다.
    for (let obj = self; obj; obj = Object.getPrototypeOf(obj)) {
      if (obj === self || Object.prototype.hasOwnProperty.call(obj, name)) {
        try {
          Object.defineProperty(obj, name, { value, writable: false, configurable: false, enumerable: false });
        } catch {
          // 이미 설정할 수 없는 속성이면 건너뛴다.
        }
      }
    }
  }
})();

let pyodideReadyPromise = null;
const namespaces = new Map();

// matplotlib은 화면이 없는 워커에서 동작하도록 Agg 백엔드를 쓰고, 실행이 끝나면 열린 그림을
// PNG(base64)로 모아 돌려준다. plt.show()가 내는 "non-interactive" 경고는 숨긴다.
const SETUP_CODE = `
import os, warnings
os.environ["MPLBACKEND"] = "agg"
warnings.filterwarnings("ignore", message=".*non-interactive.*")
warnings.filterwarnings("ignore", message=".*FigureCanvasAgg.*")

def __aegis_collect_figures():
    import sys
    if "matplotlib.pyplot" not in sys.modules:
        return []
    import io, base64
    import matplotlib.pyplot as plt
    images = []
    for num in plt.get_fignums()[:6]:
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=96, bbox_inches="tight")
        images.append(base64.b64encode(buf.getvalue()).decode("ascii"))
    plt.close("all")
    return images
`;

function loadPyodideOnce() {
  if (!pyodideReadyPromise) {
    importScripts(`${PYODIDE_CDN}pyodide.js`);
    pyodideReadyPromise = loadPyodide({ indexURL: PYODIDE_CDN }).then(async (pyodide) => {
      pyodide.setStdout({
        batched: (text) => postMessage({ type: "stream", stream: "stdout", text }),
      });
      pyodide.setStderr({
        batched: (text) => postMessage({ type: "stream", stream: "stderr", text }),
      });
      await pyodide.runPythonAsync(SETUP_CODE);
      return pyodide;
    });
  }
  return pyodideReadyPromise;
}

function getNamespace(pyodide, ns) {
  if (!ns) return undefined;
  let dict = namespaces.get(ns);
  if (!dict) {
    dict = pyodide.runPython("dict()");
    dict.set("__name__", "__main__");
    namespaces.set(ns, dict);
  }
  return dict;
}

function collectFigures(pyodide) {
  try {
    const proxy = pyodide.globals.get("__aegis_collect_figures")();
    const images = proxy.toJs();
    proxy.destroy();
    return Array.from(images);
  } catch {
    return [];
  }
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

  if (type === "reset") {
    // 노트북의 "실행 환경 초기화": 이름공간을 버려 변수를 모두 지운다.
    const dict = namespaces.get(event.data.ns);
    if (dict) {
      dict.destroy();
      namespaces.delete(event.data.ns);
    }
    postMessage({ id, type: "result" });
    return;
  }

  if (type === "files") {
    // 코드에서 읽을 수 있도록 텍스트 파일을 가상 파일 시스템에 써 둔다(예: /course/week1.md).
    try {
      const pyodide = await loadPyodideOnce();
      for (const f of event.data.files) {
        const dir = f.path.slice(0, f.path.lastIndexOf("/"));
        if (dir) pyodide.FS.mkdirTree(dir);
        pyodide.FS.writeFile(f.path, f.content, { encoding: "utf8" });
      }
      postMessage({ id, type: "result" });
    } catch (err) {
      postMessage({ id, type: "error", message: String(err) });
    }
    return;
  }

  if (type === "run") {
    const { code, ns } = event.data;
    let pyodide = null;
    try {
      postMessage({ id, type: "status", status: "loading-runtime" });
      pyodide = await loadPyodideOnce();
      postMessage({ id, type: "status", status: "loading-packages" });
      try {
        // "Loading numpy" 같은 패키지 로딩 메시지는 셀 출력에 섞이지 않게 버린다(진행 상황은 status로 알린다).
        await pyodide.loadPackagesFromImports(code, { messageCallback: () => {}, errorCallback: () => {} });
      } catch {
        // 알 수 없는/미지원 패키지 import는 무시하고 실행을 시도한다.
        // 실제 오류는 실행 시 ImportError로 사용자에게 그대로 보인다.
      }
      postMessage({ id, type: "status", status: "running" });
      const globals = getNamespace(pyodide, ns);
      const result = await pyodide.runPythonAsync(code, globals ? { globals } : undefined);
      let repr;
      if (result !== undefined && result !== null) {
        repr = String(result);
        if (result && typeof result.destroy === "function") result.destroy();
      }
      postMessage({ id, type: "result", result: repr, images: collectFigures(pyodide) });
    } catch (err) {
      const images = pyodide ? collectFigures(pyodide) : [];
      postMessage({ id, type: "error", message: err && err.message ? err.message : String(err), images });
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
