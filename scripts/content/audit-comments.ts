/**
 * 본문 코드 셀의 print 줄 끝 주석이 실제 출력과 같은지 확인한다(npm run audit:comments).
 * check:labs는 셀 아래 실행 결과 블록(```output)만 비교하므로, `print(W @ x)  # [ 3  7 -1]`처럼 주석에 적은 값은
 * 아무도 확인하지 않는다. 편집 안내는 이 주석에 그 줄의 실제 출력만 적도록 한다.
 *
 * 레슨마다 check:labs와 같은 방식으로 셀을 위에서부터 한 이름공간에서 실행하고, print가 호출된 줄 번호와 출력을
 * 기록한다. 한 번만 실행된 print 줄의 주석을 출력과 비교해 다음처럼 나눈다.
 *   일치      주석이 출력과 같거나 출력으로 시작한다(뒤에 ":"·"—"·"(" 등으로 설명이 붙어도 된다)
 *   반올림    주석의 수치가 출력의 수치를 주석의 자릿수로 반올림한 값과 같다
 *   불일치    주석에 수치·괄호가 있는데 출력과 다르다 → 정확성 검토 대상
 *   설명      주석이 출력이 아니라 설명이다 → 편집 안내의 주석 규칙 검토 대상(오류는 아님)
 * 반복문 안에서 여러 번 실행된 print 줄은 건너뛴다.
 *
 * 사용법: npm run audit:comments [-- <모듈 slug | 레슨 id> ...] [--all]
 *   기본은 불일치만 출력한다. --all은 설명 주석도 함께 출력한다.
 *   Python 패키지는 check:labs와 같다(scripts/content/requirements.txt). PYTHON으로 실행 파일을 지정한다.
 *   불일치가 있으면 종료 코드 1로 끝난다.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { MODULES } from "../../src/content/course";
import type { Block, Lesson } from "../../src/content/types";

const argv = process.argv.slice(2);
const showAll = argv.includes("--all");
const targets = argv.filter((a) => !a.startsWith("--"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-comments-"));

function runnableCells(blocks: Block[]): string[] {
  return blocks.flatMap((b): string[] => {
    if (b.type === "code" && (b.lang === "python" || b.lang === "py")) return [b.code];
    return b.type === "callout" ? runnableCells(b.blocks) : [];
  });
}

const PROGRAM = String.raw`
import builtins, contextlib, io, json, re, sys, tokenize
import matplotlib
matplotlib.use("agg")
import matplotlib.pyplot as plt
plt.show = lambda *a, **k: None

CELLS = json.loads(sys.stdin.read())
NUM = re.compile(r"-?\d+(?:\.\d+)?(?:e[-+]?\d+)?", re.I)
HANGUL = re.compile(r"[가-힣]")
SEP = (":", " —", " -", " (", ",", " ←", " →", ";", " ·", " =")

def norm(s):
    return " ".join(s.split())

def print_comments(src):
    """print로 시작하는 한 줄 문장 가운데 줄 끝 주석이 있는 줄: {줄 번호: 주석}"""
    found = {}
    try:
        tokens = list(tokenize.generate_tokens(io.StringIO(src).readline))
    except (tokenize.TokenError, IndentationError, SyntaxError):
        return found
    lines = src.split("\n")
    for t in tokens:
        if t.type == tokenize.COMMENT:
            row = t.start[0]
            code = lines[row - 1][: t.start[1]].strip()
            if code.startswith("print(") and code.endswith(")"):
                found[row] = t.string[1:].strip()
    return found

def approx(actual, comment):
    a, c = NUM.findall(actual), NUM.findall(comment)
    if not c or len(a) != len(c):
        return False
    return all(abs(float(x) - float(y)) <= tol(y) for x, y in zip(a, c))

def tol(y):
    digits = len(y.split(".")[1]) if "." in y and "e" not in y.lower() else 0
    return 0.5 * 10 ** (-digits) + 1e-12

def in_order(actual, comment):
    """주석의 수치가 출력의 수치에 같은 순서로(반올림 허용) 모두 나타나는가. 이름표나 여러 줄 출력에 쓴다."""
    a, c = NUM.findall(actual), NUM.findall(comment)
    if not c:
        return False
    j = 0
    for y in c:
        while j < len(a) and abs(float(a[j]) - float(y)) > tol(y):
            j += 1
        if j == len(a):
            return False
        j += 1
    return True

def strip_label(s):
    """print("파라미터 수:", n)처럼 앞에 붙은 이름표를 뗀다."""
    m = re.match(r"^[^\n:?=]{1,40}[:?=]\s+(.*)$", s, re.S)
    return m.group(1) if m else s

def classify(actual, comment):
    full, c = norm(actual), norm(comment)
    if not full:
        return "설명"
    for a in (full, norm(strip_label(actual))):
        if c == a or any(c.startswith(a + s) for s in SEP) or c.startswith(a + " ") or a in c:
            return "일치"
    a = norm(strip_label(actual))
    head = re.split(r":| — | ← | → ", c)[0].strip()
    value = head.split("=")[-1].strip() if "=" in head else head
    if any(approx(x, y) for x in (full, a) for y in (head, value, c)) or in_order(full, value):
        return "반올림"
    # 출력에 없는 한글 설명으로 시작하는 주석은 값이 아니라 설명이다(예: "# 원소 12개를 15개로 바꿀 수 없다").
    if HANGUL.search(head) and not HANGUL.search(a):
        return "설명"
    if NUM.search(head) or re.search(r"\b(True|False|None)\b|Error", head):
        return "불일치"
    return "설명"

ns = {"__name__": "__main__"}
real_print = builtins.print
results = []
for i, src in enumerate(CELLS):
    name = f"<셀 {i + 1}>"
    calls = {}
    def traced_print(*args, sep=" ", end="\n", file=None, flush=False, _name=name, _calls=calls):
        if file not in (None, sys.stdout):
            return real_print(*args, sep=sep, end=end, file=file, flush=flush)
        buf = io.StringIO()
        real_print(*args, sep=sep, end=end, file=buf)
        frame = sys._getframe(1)
        if frame.f_code.co_filename == _name:
            _calls.setdefault(frame.f_lineno, []).append(buf.getvalue())
        sys.stdout.write(buf.getvalue())
    ns["print"] = traced_print
    out = io.StringIO()
    err = None
    try:
        with contextlib.redirect_stdout(out):
            exec(compile(src, name, "exec"), ns)
    except Exception as e:
        err = f"{type(e).__name__}: {e}"
    plt.close("all")
    lines = src.split("\n")
    for row, comment in print_comments(src).items():
        printed = calls.get(row, [])
        if len(printed) != 1:
            continue
        actual = printed[0].rstrip("\n")
        results.append({"cell": i + 1, "line": lines[row - 1].strip(), "comment": comment, "actual": actual, "kind": classify(actual, comment)})
    if err:
        results.append({"cell": i + 1, "line": "", "comment": "", "actual": err, "kind": "실행 오류"})
ns.pop("print", None)
real_print("@@REPORT@@" + json.dumps(results, ensure_ascii=False))
`;

function audit(lesson: Lesson) {
  const cells = runnableCells(lesson.learn);
  if (cells.length === 0) return [];
  const file = path.join(tmp, "audit-comments.py");
  fs.writeFileSync(file, PROGRAM);
  const res = spawnSync(process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3"), [file], {
    input: JSON.stringify(cells),
    encoding: "utf8",
    cwd: tmp,
    timeout: 600_000,
    env: { ...process.env, MPLBACKEND: "agg", PYTHONWARNINGS: "ignore", PYTHONIOENCODING: "utf-8" },
  });
  const line = (res.stdout ?? "").split("\n").find((l) => l.startsWith("@@REPORT@@"));
  if (!line) {
    console.error(`✗ ${lesson.id}: 실행 결과를 읽지 못함\n${(res.stderr ?? "").slice(-600)}`);
    return [{ cell: 0, line: "", comment: "", actual: "실행 실패", kind: "실행 오류" }];
  }
  return JSON.parse(line.slice("@@REPORT@@".length)) as { cell: number; line: string; comment: string; actual: string; kind: string }[];
}

const tally: Record<string, number> = {};
let problems = 0;
for (const mod of MODULES) {
  for (const lesson of mod.lessons) {
    if (targets.length && !targets.includes(mod.slug) && !targets.includes(lesson.id)) continue;
    const rows = audit(lesson);
    for (const r of rows) tally[r.kind] = (tally[r.kind] ?? 0) + 1;
    const shown = rows.filter((r) => r.kind === "불일치" || r.kind === "실행 오류" || (showAll && r.kind === "설명"));
    for (const r of shown) {
      if (r.kind !== "설명") problems++;
      console.log(`${r.kind === "설명" ? "·" : "✗"} ${mod.code} ${lesson.id} 셀 ${r.cell} [${r.kind}] ${r.line}\n    주석: ${r.comment}\n    출력: ${r.actual.replace(/\n/g, "⏎")}`);
    }
  }
}
console.log(`\n주석 비교: ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(", ") || "대상 없음"}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(problems > 0 ? 1 : 0);
