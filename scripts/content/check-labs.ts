/**
 * 코딩 실습·출력 예측·과제 자동 테스트를 로컬 CPython으로 실제 실행해 검증한다(브라우저 Pyodide와 같은 채점 프로그램 사용).
 *   0. 레슨 본문의 실행 가능한 코드 셀(\`\`\`python)을 레슨마다 새 이름공간에서 위에서부터 차례로 실행해 오류가 없어야 한다.
 *      브라우저에서 학습자가 셀을 순서대로 실행하는 것과 같다. Colab 전용 셀(\`\`\`python-colab)은 건너뛴다.
 *   1. 레슨 실습·과제 심화 문제: 모범 답안은 모든 채점 항목을 통과하고, 시작 코드는 통과하지 못해야 한다.
 *   2. 출력 예측 문제: 코드를 실행한 출력이 정답(expected)과 같아야 한다.
 *   3. 과제 자동 테스트: 시작 코드의 TODO를 채운 참조 노트북(scripts/content/fixtures.ts)은 통과하고,
 *      채우지 않은 시작 코드는 하나 이상 실패해야 한다.
 *
 * 사용법: npm run check:labs [-- <모듈 slug>]
 *   Python과 numpy·pandas·scikit-learn·matplotlib가 필요하다(scripts/content/requirements.txt). PYTHON으로 실행 파일을 지정할 수 있다.
 * 빌드에는 필요하지 않은 개발용 검사다. 콘텐츠 구조 검사는 npm run validate:content가 한다.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { MODULES, courseDocuments, itemId } from "../../src/content/course";
import type { Block, Exercise, Lesson } from "../../src/content/types";
import { buildAutoTestProgram, buildGradeProgram, normalizeOutput, parseAutoTestResults, parseGradeReport } from "../../src/lib/labHarness";
import { ASSIGNMENT_FIXTURES } from "./fixtures";

const only = process.argv[2];
if (only && !MODULES.some((m) => m.slug === only)) {
  console.error(`모듈 "${only}"이(가) 없습니다. 모듈 slug: ${MODULES.map((m) => m.slug).join(", ")}`);
  process.exit(2);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-labs-"));
const courseDir = path.join(tmp, "course");
fs.mkdirSync(courseDir);
for (const doc of courseDocuments()) fs.writeFileSync(path.join(courseDir, path.basename(doc.path)), doc.content);

let failures = 0;
let checks = 0;
function fail(msg: string) {
  failures++;
  console.error(`✗ ${msg}`);
}

/** CPython 기준 채점 1회의 허용 시간(초). 브라우저(Pyodide)는 몇 배 느리고 채점은 30초가 지나면 강제 중단된다. */
const SLOW_SECS = 4;

function runPython(source: string, timeoutMs = 300_000): { stdout: string; stderr: string; status: number | null } {
  const file = path.join(tmp, `run-${checks++}.py`);
  fs.writeFileSync(file, source.replaceAll("/course/", `${courseDir.replace(/\\/g, "/")}/`));
  // 코드가 만드는 파일(CSV·JSON 등)이 저장소에 남지 않도록 임시 폴더에서 실행한다.
  const res = spawnSync(process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3"), [file], {
    encoding: "utf8",
    cwd: tmp,
    timeout: timeoutMs,
    env: { ...process.env, MPLBACKEND: "agg", PYTHONWARNINGS: "ignore", PYTHONIOENCODING: "utf-8" },
  });
  return { stdout: res.stdout ?? "", stderr: res.stderr ?? "", status: res.status };
}

/** 마지막 줄(채점 함수 호출)의 반환값을 출력하도록 바꾼다. Pyodide에서는 마지막 식의 값이 그대로 반환된다. */
function printLastExpression(program: string): string {
  const lines = program.trimEnd().split("\n");
  lines[lines.length - 1] = `print(${lines[lines.length - 1]})`;
  return lines.join("\n") + "\n";
}

const lastLine = (text: string) => text.trimEnd().split("\n").pop() ?? "";

/** 본문(콜아웃 안 포함)의 실행 가능한 코드 셀, 화면에 나오는 순서대로 */
function runnableCells(blocks: Block[]): string[] {
  return blocks.flatMap((b) =>
    b.type === "code" && (b.lang === "python" || b.lang === "py") ? [b.code] : b.type === "callout" ? runnableCells(b.blocks) : []
  );
}

/** 코드 셀 하나가 이 시간(초)을 넘기면 경고한다. 브라우저(Pyodide)는 CPython보다 몇 배 느리다. */
const SLOW_CELL_SECS = 5;

function checkLessonCells(lesson: Lesson) {
  const cells = runnableCells(lesson.learn);
  if (cells.length === 0) return;
  const script = `
import time, json
import matplotlib
matplotlib.use("agg")
import matplotlib.pyplot as plt
plt.show = lambda *a, **k: None
__ns = {"__name__": "__main__"}
__report = []
for __i, __src in enumerate(${JSON.stringify(cells)}):
    __t = time.time()
    try:
        exec(compile(__src, f"<셀 {__i + 1}>", "exec"), __ns)
        __err = None
    except Exception as e:
        __err = f"{type(e).__name__}: {e}"
    plt.close("all")
    __report.append({"cell": __i + 1, "secs": round(time.time() - __t, 2), "error": __err})
print("@@REPORT@@" + json.dumps(__report, ensure_ascii=False))
`;
  const res = runPython(script, 600_000);
  const line = res.stdout.split("\n").find((l) => l.startsWith("@@REPORT@@"));
  if (!line) {
    fail(`${lesson.id}: 본문 코드 셀 실행 결과를 읽지 못함\n${res.stderr.slice(-800)}`);
    return;
  }
  const report = JSON.parse(line.slice("@@REPORT@@".length)) as { cell: number; secs: number; error: string | null }[];
  for (const r of report) {
    if (r.error) fail(`${lesson.id}: 본문 코드 셀 ${r.cell} 실행 오류 — ${r.error}`);
    else if (r.secs > SLOW_CELL_SECS) fail(`${lesson.id}: 본문 코드 셀 ${r.cell}이(가) ${r.secs}s 걸림(기준 ${SLOW_CELL_SECS}s) — 브라우저에서 오래 걸립니다`);
  }
  const ok = report.every((r) => !r.error);
  console.log(`  ${ok ? "✓" : "✗"} ${lesson.id} 본문 코드 셀 ${cells.length}개`);
}

function checkExercise(id: string, ex: Exercise) {
  const t0 = Date.now();
  const good = runPython(printLastExpression(buildGradeProgram(ex.solution, ex.tests)), 60_000);
  const report = parseGradeReport(lastLine(good.stdout));
  if (!report) fail(`${id}: 모범 답안 채점 결과를 읽지 못함\n${good.stderr.slice(-800)}`);
  else if (report.error) fail(`${id}: 모범 답안 실행 오류 — ${report.error}`);
  else if (report.tests.length === 0) fail(`${id}: 채점 항목이 없음`);
  else {
    const bad = report.tests.filter((t) => !t.ok);
    if (bad.length) fail(`${id}: 모범 답안이 통과하지 못한 항목 — ${bad.map((t) => `${t.name}: ${t.message}`).join(" / ")}`);
  }
  const goodSecs = (Date.now() - t0) / 1000;
  const t1 = Date.now();
  const starter = runPython(printLastExpression(buildGradeProgram(ex.starter, ex.tests)), 60_000);
  const starterSecs = (Date.now() - t1) / 1000;
  for (const [label, secs] of [["모범 답안", goodSecs], ["시작 코드", starterSecs]] as const) {
    if (secs > SLOW_SECS) fail(`${id}: ${label} 채점이 ${secs.toFixed(1)}s 걸림(기준 ${SLOW_SECS}s) — 브라우저에서 시간 초과될 수 있음`);
  }
  const sReport = parseGradeReport(lastLine(starter.stdout));
  if (!sReport) fail(`${id}: 시작 코드 채점 결과를 읽지 못함\n${starter.stderr.slice(-800)}`);
  else if (!sReport.error && sReport.tests.every((t) => t.ok)) fail(`${id}: 시작 코드가 모든 채점 항목을 통과함(TODO 없이도 통과)`);
  const ok = report && !report.error && report.tests.every((t) => t.ok);
  console.log(`  ${ok ? "✓" : "✗"} ${id} (${report?.tests.length ?? 0}항목, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

const notebookScript = (sources: string[], program: string) => `
import matplotlib
matplotlib.use("agg")
import matplotlib.pyplot as plt
plt.show = lambda *a, **k: None
__ns = {"__name__": "__main__"}
for __i, __src in enumerate(${JSON.stringify(sources)}):
    try:
        exec(compile(__src, f"<셀 {__i}>", "exec"), __ns)
    except Exception as e:
        print(f"[셀 {__i} 오류] {type(e).__name__}: {e}")
exec(compile(${JSON.stringify(program)}, "<자동 테스트>", "exec"), __ns)
`;

for (const mod of MODULES) {
  if (only && mod.slug !== only) continue;
  console.log(`\n── ${mod.code} ${mod.slug}`);

  for (const lesson of mod.lessons) {
    checkLessonCells(lesson);
    for (const ex of lesson.exercises ?? []) checkExercise(itemId(lesson.id, ex.key), ex);
    for (const item of lesson.predicts ?? []) {
      const id = itemId(lesson.id, item.key);
      const res = runPython(item.code);
      const got = normalizeOutput(res.stdout);
      const accepted = [item.expected, ...(item.alternatives ?? [])].map(normalizeOutput);
      if (res.status !== 0) fail(`${id}: 코드 실행 오류\n${res.stderr.slice(-500)}`);
      else if (!accepted.includes(got)) fail(`${id}: 출력이 정답과 다름\n  실제: ${JSON.stringify(got)}\n  정답: ${JSON.stringify(accepted[0])}`);
      else console.log(`  ✓ ${id}`);
    }
  }

  const spec = mod.assignment;
  if (!spec) continue;
  for (const ch of spec.challenges) checkExercise(itemId(spec.key, ch.key), ch);
  if (spec.autoTests.length === 0) continue;
  const fixture = ASSIGNMENT_FIXTURES[spec.key] ?? {};
  for (const cellId of Object.keys(fixture)) {
    if (!spec.tasks.some((t) => t.cells.some((c) => c.id === cellId))) fail(`${spec.key} 참조 노트북: 과제에 없는 셀 "${cellId}"`);
  }
  const cells = spec.tasks.flatMap((t) => t.cells).filter((c) => c.kind === "code");
  const notebook = (patched: boolean) =>
    cells.map((c) => {
      let src = c.kind === "code" ? c.starter : "";
      if (patched) {
        for (const [find, replace] of fixture[c.id] ?? []) {
          if (!src.includes(find)) fail(`${spec.key} 참조 노트북: ${c.id}에서 "${find.slice(0, 40)}"를 찾지 못함`);
          src = src.replace(find, replace);
        }
      }
      return src;
    });
  const program = printLastExpression(buildAutoTestProgram(spec.autoTests));
  const t0 = Date.now();
  const good = runPython(notebookScript(notebook(true), program), 900_000);
  const results = parseAutoTestResults(lastLine(good.stdout));
  const cellErrors = good.stdout.split("\n").filter((l) => l.startsWith("[셀 "));
  if (cellErrors.length) fail(`${spec.key} 참조 노트북 셀 오류: ${cellErrors.join(" / ")}`);
  if (!results) fail(`${spec.key}: 참조 노트북 자동 테스트 결과를 읽지 못함\n${good.stderr.slice(-800)}`);
  else {
    const bad = results.filter((r) => !r.ok);
    if (bad.length) fail(`${spec.key}: 참조 노트북이 통과하지 못한 자동 테스트 — ${bad.map((r) => `${r.id}: ${r.message}`).join(" / ")}`);
    else console.log(`  ✓ 과제 자동 테스트 ${results.length}개 통과 (참조 노트북, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  const starter = runPython(notebookScript(notebook(false), program), 900_000);
  const sResults = parseAutoTestResults(lastLine(starter.stdout));
  if (!sResults) fail(`${spec.key}: 시작 코드 자동 테스트 결과를 읽지 못함\n${starter.stderr.slice(-800)}`);
  else if (sResults.every((r) => r.ok)) fail(`${spec.key}: 시작 코드가 자동 테스트를 모두 통과함`);
  else console.log(`  ✓ 시작 코드는 자동 테스트 ${sResults.filter((r) => !r.ok).length}/${sResults.length}개 미통과`);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n검사 완료: 실패 ${failures}건`);
if (failures > 0) process.exit(1);
