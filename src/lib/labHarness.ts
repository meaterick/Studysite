// 코딩 실습 자동 채점과 과제 자동 테스트에 쓰는 Python 프로그램을 만든다.
// 만든 프로그램은 기존 Pyodide 워커(public/pyodide-worker.js)에서 runPython으로 실행하므로
// 학습자 코드는 브라우저 밖으로 나가지 않는다. 이 파일은 React·Node 의존성이 없어
// 화면 컴포넌트와 로컬 검증 스크립트(scripts/check-labs.ts)가 함께 쓴다.

export interface LabTestResult {
  name: string;
  ok: boolean;
  message?: string;
}

export interface LabGradeReport {
  /** 학습자 코드가 출력한 내용 */
  stdout: string;
  /** 학습자 코드 실행 중 오류(문법 오류 포함). 있으면 채점 항목을 실행하지 않는다. */
  error: string | null;
  tests: LabTestResult[];
}

export interface AutoTestResult {
  id: string;
  ok: boolean;
  message?: string;
}

/** Python 문자열 리터럴. JSON 문자열 이스케이프는 Python에서도 그대로 유효하다. */
function pyString(text: string): string {
  return JSON.stringify(text);
}

/**
 * 코드를 문자열로 넘기면 워커의 loadPackagesFromImports가 import를 찾지 못한다.
 * 실행되지 않는 `if False:` 블록에 import 문만 따로 적어, numpy·sklearn 같은 패키지를 미리 불러오게 한다.
 */
export function importHints(...sources: string[]): string {
  const modules = new Set<string>();
  for (const source of sources) {
    for (const line of source.split("\n")) {
      const from = line.match(/^\s*from\s+([A-Za-z_][\w.]*)\s+import\b/);
      if (from) modules.add(from[1].split(".")[0]);
      const imp = line.match(/^\s*import\s+(.+)$/);
      if (imp) {
        for (const part of imp[1].split(",")) {
          const name = part.trim().split(/\s+/)[0]?.split(".")[0];
          if (name && /^[A-Za-z_]\w*$/.test(name)) modules.add(name);
        }
      }
    }
  }
  if (modules.size === 0) return "";
  return `if False:\n${[...modules].map((m) => `    import ${m}`).join("\n")}\n`;
}

const GRADE_HARNESS = `
def __aegis_lab_grade(src, tests):
    import io, json, contextlib, traceback, math
    report = {"stdout": "", "error": None, "tests": []}
    ns = {"__name__": "__main__"}
    out = io.StringIO()
    try:
        code = compile(src, "<내 코드>", "exec")
    except SyntaxError as e:
        report["error"] = f"SyntaxError: {e.msg} ({e.lineno}번째 줄)"
        return json.dumps(report, ensure_ascii=False)
    try:
        with contextlib.redirect_stdout(out):
            exec(code, ns)
    except BaseException as e:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == "<내 코드>"]
        where = f" ({frames[-1].lineno}번째 줄)" if frames else ""
        report["error"] = f"{type(e).__name__}: {e}{where}"
    report["stdout"] = out.getvalue()[-6000:]
    if report["error"]:
        return json.dumps(report, ensure_ascii=False)

    results = report["tests"]

    def test(name):
        def run(fn):
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    fn()
                results.append({"name": name, "ok": True})
            except AssertionError as e:
                results.append({"name": name, "ok": False, "message": str(e) or "기대한 결과와 다릅니다."})
            except Exception as e:
                results.append({"name": name, "ok": False, "message": f"{type(e).__name__}: {e}"})
            return fn
        return run

    def approx(a, b, tol=1e-6):
        try:
            import numpy as np
            return bool(np.allclose(np.asarray(a, dtype=float), np.asarray(b, dtype=float), atol=tol, rtol=tol))
        except ImportError:
            return math.isclose(float(a), float(b), rel_tol=tol, abs_tol=tol)

    scope = dict(ns)
    scope.update(test=test, approx=approx, output=report["stdout"])
    try:
        exec(compile(tests, "<채점 코드>", "exec"), scope)
    except Exception as e:
        results.append({"name": "채점 코드 실행", "ok": False, "message": f"{type(e).__name__}: {e}"})
    return json.dumps(report, ensure_ascii=False)
`;

/** 학습자 코드를 빈 이름공간에서 실행한 뒤 채점 코드를 이어서 실행하고, 결과를 JSON 문자열로 돌려주는 프로그램 */
export function buildGradeProgram(userCode: string, tests: string): string {
  return `${importHints(userCode, tests)}${GRADE_HARNESS}
__aegis_lab_grade(${pyString(userCode)}, ${pyString(tests)})
`;
}

export function parseGradeReport(raw: string | undefined): LabGradeReport | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as LabGradeReport;
    if (!data || !Array.isArray(data.tests)) return null;
    return { stdout: String(data.stdout ?? ""), error: data.error ? String(data.error) : null, tests: data.tests };
  } catch {
    return null;
  }
}

const AUTOTEST_HARNESS = `
def __aegis_assignment_tests(payload):
    import io, json, contextlib
    tests = json.loads(payload)
    g = globals()
    g.pop("__aegis_assignment_tests", None)
    results = []
    for t in tests:
        scope = dict(g)
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                exec(compile(t["code"], "<자동 테스트>", "exec"), scope)
            results.append({"id": t["id"], "ok": True})
        except AssertionError as e:
            results.append({"id": t["id"], "ok": False, "message": str(e) or "조건을 만족하지 않습니다."})
        except NameError as e:
            results.append({"id": t["id"], "ok": False, "message": f"{e}: 관련 코드 셀을 먼저 실행했는지 확인하십시오."})
        except Exception as e:
            results.append({"id": t["id"], "ok": False, "message": f"{type(e).__name__}: {e}"})
    return json.dumps(results, ensure_ascii=False)
`;

/**
 * 과제 이름공간에서 자동 테스트를 실행하는 프로그램. 테스트마다 이름공간의 얕은 복사본에서 실행해,
 * 테스트가 만든 변수가 학습자의 작업 공간에 남지 않게 한다.
 */
export function buildAutoTestProgram(tests: { id: string; code: string }[]): string {
  const payload = JSON.stringify(tests.map((t) => ({ id: t.id, code: t.code })));
  return `${importHints(...tests.map((t) => t.code))}${AUTOTEST_HARNESS}
__aegis_assignment_tests(${pyString(payload)})
`;
}

export function parseAutoTestResults(raw: string | undefined): AutoTestResult[] | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as AutoTestResult[]) : null;
  } catch {
    return null;
  }
}

/**
 * 출력 예측 문제의 비교 규칙: 줄 끝 공백·앞뒤 빈 줄·연속 공백 차이, NumPy가 자리를 맞추려고 넣는
 * 괄호 안쪽 공백(`[ 6 15]`)은 무시한다.
 */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]+/g, " ")
        .replace(/([[(]) /g, "$1")
        .replace(/ ([\])])/g, "$1")
        .trim()
    )
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

/** 코드에 남은 `TODO` 표시 수 */
export function countTodos(code: string): number {
  return (code.match(/TODO/g) ?? []).length;
}
