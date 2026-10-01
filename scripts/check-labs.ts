/**
 * 코딩 실습·퀴즈·과제 자동 테스트를 로컬 CPython으로 실제 실행해 검증한다(브라우저 Pyodide와 같은 채점 프로그램 사용).
 *   1. 실습·심화 문제: 모범 답안은 모든 채점 항목을 통과하고, 시작 코드는 통과하지 못해야 한다.
 *   2. 출력 예측 문제: 코드를 실행한 출력이 정답(expected)과 같아야 한다.
 *   3. 과제 자동 테스트: 시작 코드의 TODO를 채운 참조 노트북(scripts/lab-fixtures.ts)은 통과하고,
 *      채우지 않은 시작 코드는 하나 이상 실패해야 한다.
 *
 * 사용법: npm run check:labs [-- week-3]   (python3와 numpy·pandas·scikit-learn·matplotlib가 필요하다)
 * 빌드에는 필요하지 않은 개발용 검사다. 콘텐츠 구조 검사는 npm run validate:content가 한다.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { WEEKS } from "../src/content/weeks";
import { LABS } from "../src/content/labs";
import {
  buildAutoTestProgram,
  buildGradeProgram,
  normalizeOutput,
  parseAutoTestResults,
  parseGradeReport,
} from "../src/lib/labHarness";
import { ASSIGNMENT_FIXTURES } from "./lab-fixtures";

const only = process.argv[2];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-labs-"));
const courseDir = path.join(tmp, "course");
fs.mkdirSync(courseDir);
for (const w of WEEKS) fs.writeFileSync(path.join(courseDir, `week${w.number}.md`), `# ${w.number}주차 · ${w.title}\n\n${w.conceptsMd}`);

let failures = 0;
let checks = 0;
function fail(msg: string) {
  failures++;
  console.error(`✗ ${msg}`);
}

function runPython(source: string, timeoutMs = 300_000): { stdout: string; stderr: string; status: number | null } {
  const file = path.join(tmp, `run-${checks++}.py`);
  fs.writeFileSync(file, source.replaceAll("/course/", `${courseDir}/`));
  const res = spawnSync("python3", [file], {
    encoding: "utf8",
    timeout: timeoutMs,
    env: { ...process.env, MPLBACKEND: "agg", PYTHONWARNINGS: "ignore" },
  });
  return { stdout: res.stdout ?? "", stderr: res.stderr ?? "", status: res.status };
}

/** 마지막 줄(채점 함수 호출)의 반환값을 출력하도록 바꾼다. Pyodide에서는 마지막 식의 값이 그대로 반환된다. */
function printLastExpression(program: string): string {
  const lines = program.trimEnd().split("\n");
  lines[lines.length - 1] = `print(${lines[lines.length - 1]})`;
  return lines.join("\n") + "\n";
}

function lastLine(text: string): string {
  return text.trimEnd().split("\n").pop() ?? "";
}

for (const [slug, lab] of Object.entries(LABS)) {
  if (only && slug !== only) continue;
  console.log(`\n── ${slug}`);

  for (const ex of [...lab.exercises, ...lab.assignment.challenges]) {
    const t0 = Date.now();
    const good = runPython(printLastExpression(buildGradeProgram(ex.solution, ex.tests)));
    const report = parseGradeReport(lastLine(good.stdout));
    if (!report) fail(`${ex.id}: 모범 답안 채점 결과를 읽지 못함\n${good.stderr.slice(-800)}`);
    else if (report.error) fail(`${ex.id}: 모범 답안 실행 오류 — ${report.error}`);
    else if (report.tests.length === 0) fail(`${ex.id}: 채점 항목이 없음`);
    else {
      const bad = report.tests.filter((t) => !t.ok);
      if (bad.length) fail(`${ex.id}: 모범 답안이 통과하지 못한 항목 — ${bad.map((t) => `${t.name}: ${t.message}`).join(" / ")}`);
    }
    const starter = runPython(printLastExpression(buildGradeProgram(ex.starter, ex.tests)));
    const sReport = parseGradeReport(lastLine(starter.stdout));
    if (!sReport) fail(`${ex.id}: 시작 코드 채점 결과를 읽지 못함\n${starter.stderr.slice(-800)}`);
    else if (!sReport.error && sReport.tests.every((t) => t.ok)) fail(`${ex.id}: 시작 코드가 모든 채점 항목을 통과함(TODO 없이도 통과)`);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  ${report && !report.error && report.tests.every((t) => t.ok) ? "✓" : "✗"} ${ex.id} (${report?.tests.length ?? 0}항목, ${secs}s)`);
  }

  for (const item of lab.quiz) {
    if (item.kind !== "predict") continue;
    const res = runPython(item.code);
    const got = normalizeOutput(res.stdout);
    const accepted = [item.expected, ...(item.alternatives ?? [])].map(normalizeOutput);
    if (res.status !== 0) fail(`${item.id}: 코드 실행 오류\n${res.stderr.slice(-500)}`);
    else if (!accepted.includes(got)) fail(`${item.id}: 출력이 정답과 다름\n  실제: ${JSON.stringify(got)}\n  정답: ${JSON.stringify(accepted[0])}`);
    else console.log(`  ✓ ${item.id}`);
  }

  const week = WEEKS.find((w) => w.slug === slug);
  if (!week || lab.assignment.autoTests.length === 0) continue;
  const fixture = ASSIGNMENT_FIXTURES[slug] ?? {};
  const cells = week.assignment.tasks.flatMap((t) => t.cells).filter((c) => c.kind === "code");
  const notebook = (patched: boolean) =>
    cells.map((c) => {
      let src = c.kind === "code" ? c.starter : "";
      if (patched) {
        for (const [find, replace] of fixture[c.id] ?? []) {
          if (!src.includes(find)) fail(`${slug} 참조 노트북: ${c.id}에서 "${find.slice(0, 40)}"를 찾지 못함`);
          src = src.replace(find, replace);
        }
      }
      return src;
    });
  const program = printLastExpression(buildAutoTestProgram(lab.assignment.autoTests));
  const script = (sources: string[]) => `
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
  const t0 = Date.now();
  const good = runPython(script(notebook(true)), 900_000);
  const results = parseAutoTestResults(lastLine(good.stdout));
  const cellErrors = good.stdout.split("\n").filter((l) => l.startsWith("[셀 "));
  if (cellErrors.length) fail(`${slug} 참조 노트북 셀 오류: ${cellErrors.join(" / ")}`);
  if (!results) fail(`${slug}: 참조 노트북 자동 테스트 결과를 읽지 못함\n${good.stderr.slice(-800)}`);
  else {
    const bad = results.filter((r) => !r.ok);
    if (bad.length) fail(`${slug}: 참조 노트북이 통과하지 못한 자동 테스트 — ${bad.map((r) => `${r.id}: ${r.message}`).join(" / ")}`);
    else console.log(`  ✓ 과제 자동 테스트 ${results.length}개 통과 (참조 노트북, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  const starter = runPython(script(notebook(false)), 900_000);
  const sResults = parseAutoTestResults(lastLine(starter.stdout));
  if (!sResults) fail(`${slug}: 시작 코드 자동 테스트 결과를 읽지 못함\n${starter.stderr.slice(-800)}`);
  else if (sResults.every((r) => r.ok)) fail(`${slug}: 시작 코드가 자동 테스트를 모두 통과함`);
  else console.log(`  ✓ 시작 코드는 자동 테스트 ${sResults.filter((r) => !r.ok).length}/${sResults.length}개 미통과`);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n검사 완료: 실패 ${failures}건`);
if (failures > 0) process.exit(1);
