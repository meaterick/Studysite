/**
 * 콘텐츠 정합성 검증(npm run validate:content). 실패하면 0이 아닌 코드로 끝나 CI의 빌드 전 단계를 막는다.
 *
 *   1. 구조: 트랙·모듈·레슨 id 형식과 고유성, 트랙 안 모듈 순서, 모듈마다 목표 문제·학습 목표·백지 복습,
 *      핵심 레슨 수, 16주 일정표와 예전 주소 대응표가 실제 모듈·레슨·과제를 가리키는가
 *   2. 개념: 80개 개념이 각각 핵심 레슨 하나 이상에 연결되어 있는가, 선수 그래프에 순환이 없는가,
 *      기본 경로에서 선수 개념(과 requires로 적은 레슨)이 먼저 나오는가
 *   3. 레슨: 목표·쓰이는 곳·본문이 채워져 있는가, 확인 문제 수(핵심 4개 이상, 그 밖 2개 이상)와 선택지·정답·해설,
 *      코딩 실습(TODO·@test·모범 답안·힌트 2개 이상), 출력 예측, 서술형(모범답안·핵심 요소 2개 이상), 참고 자료 https
 *   4. 본문: 수식(LaTeX)이 유효한가, $...$ 밖의 날것 수식, 이미지 파일·종횡비, 다이어그램 id,
 *      [[lesson:id]] 참조 대상, "N주차" 같은 예전 일정 번호, 비유·구어체 표현(경고)
 *   5. 과제: 키·과제 단계·셀 id, 핵심 → 보충 → 심화 순서, 채점 기준 배점 합 = 만점, 자동 테스트·심화 문제
 *
 * 코드가 실제로 채점을 통과하는지는 npm run check:labs가 Python으로 실행해 확인한다.
 */
import fs from "fs";
import path from "path";
import katex from "katex";
import { CONCEPTS, CORE_PATH, MODULES, TRACKS, getConcept, getLesson, getModule, moduleOfAssignment } from "../../src/content/course";
import { SCHEDULE } from "../../src/content/curriculum/schedule";
import { LEGACY_STAGE_LESSON, LEGACY_WEEK_ASSIGNMENT_MODULE } from "../../src/content/curriculum/legacy";
import { parseMarkdown } from "../../src/content/markdown";
import { TIER_ORDER } from "../../src/content/tiers";
import { DIAGRAMS } from "../../src/components/diagrams";
import type { AssignmentSource, Block, Exercise, Lesson, Module } from "../../src/content/types";

const ROOT = path.join(__dirname, "../..");
let errorCount = 0;
let warnCount = 0;
const fail = (msg: string) => {
  errorCount++;
  console.error(`✗ ${msg}`);
};
const warn = (msg: string) => {
  warnCount++;
  console.warn(`⚠ ${msg}`);
};

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KEY = /^[A-Za-z0-9_-]{1,64}$/;
const PLACEHOLDER = /\(작성 중\)/;
/** 핵심 레슨 예상 시간 상한(분) */
const MAX_CORE_MINUTES = 45;

// ─── 글 검사 ────────────────────────────────────────────────────────────────

function checkTex(tex: string, context: string) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: "ignore" });
  } catch (e) {
    fail(`${context}: 유효하지 않은 LaTeX "${tex.slice(0, 60)}" — ${(e as Error).message}`);
  }
}

// $...$ 밖에 남은 흔한 수식 기호. 완벽한 판별은 불가능해 경고만 한다.
const RAW_MATH_HINT = /[∂∇√∑×÷≈≥≤∈∩∪²³αβγδεηθλμπσφωΣ]|\b[a-zA-Z]\([a-zA-Z]\|[a-zA-Z]\)|dL\/d[a-zA-Z]|[a-zA-Z]_[0-9]|[a-zA-Z][₀-₉]/u;

// 학습 자료 문체 규칙: 비유·은유, 권유·감탄형 구어체를 쓰지 않는다(경고). 코드와 수식은 검사하지 않는다.
const STYLE_HINTS: [RegExp, string][] = [
  [/비유(하면|하자면|하면은|해 보면|적으로)|에 비유/, "비유 표현"],
  [/마치 [^.。\n]{1,30}(처럼|같이|듯)/, "비유 표현(마치 ~처럼)"],
  [/상상해 ?(보|봅)|떠올려 ?(보|봅)/, "상상·연상 유도"],
  // "x = 3이라고 하자", "다음 함수를 생각하자" 같은 수학의 가정·고찰 표현은 허용한다.
  [/(?<!(라고|다고|이라|라) ?)(?<!생각)(해|봐|보|알아보|살펴보|정리해 보|시작해 보|확인해 보|따라가 보|구현해 보)자[.!,]?(\s|$)/, "권유형 구어체(~해 보자)"],
  [/(봅|합|갑|살펴봅|알아봅)시다/, "권유형 구어체(~합시다)"],
  [/여러분/, "청자 호칭(여러분)"],
  [/[가-힣]!(\s|$)/, "느낌표"],
  [/(정말|무척|굉장히|엄청) /, "감정적 강조 표현"],
];

/** 예전 8주 구성의 일정 번호(레슨은 [[lesson:id]] 참조를 쓴다) */
const WEEK_REF = /\d+\s*주\s*차|\bW[1-8]\b/;
const STAGE_REF = /」\s*단계/;

function checkProse(text: string, context: string) {
  if (/\[\[lesson:[^\]]*\]\]/.test(text)) fail(`${context}: 대상이 없는 레슨 참조 ${text.match(/\[\[lesson:[^\]]*\]\]/)![0]}`);
  if (PLACEHOLDER.test(text)) fail(`${context}: 작성 중 표시가 남아 있음`);
  const prose = text.replace(/\$[^$\n]+\$/g, "").replace(/`[^`]+`/g, "").replace(/\]\([^)]*\)/g, "]");
  if (WEEK_REF.test(prose)) fail(`${context}: 예전 일정 번호 "${prose.match(WEEK_REF)![0]}" — 다른 레슨은 [[lesson:id]]로 가리킵니다`);
  if (STAGE_REF.test(prose)) warn(`${context}: 예전 "「…」 단계" 표현 — [[lesson:id]] 참조로 바꾸십시오`);
  for (const [re, label] of STYLE_HINTS) {
    const m = prose.match(re);
    if (m) warn(`${context}: ${label} "${prose.slice(Math.max(0, m.index! - 12), m.index! + m[0].length + 12).replace(/\s+/g, " ")}"`);
  }
}

function checkInline(text: string, context: string) {
  const mathRe = /\$([^$\n]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = mathRe.exec(text))) checkTex(m[1], context);
  // 넓이·부피 단위(m², cm³ 등)는 수식이 아니다.
  const stripped = text.replace(/\$[^$\n]+\$/g, "").replace(/`[^`]+`/g, "").replace(/(?:k|c|m)?m[²³]/g, "");
  const raw = stripped.match(RAW_MATH_HINT);
  if (raw) warn(`${context}: $...$ 밖에 수식으로 보이는 표현 "${raw[0]}" — KaTeX로 렌더링되지 않습니다`);
  checkProse(text, context);
}

function getPngSize(filePath: string): { width: number; height: number } | null {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function checkImage(block: Extract<Block, { type: "image" }>, context: string) {
  if (block.maxWidth !== undefined && !(block.maxWidth > 0)) fail(`${context}: 이미지 maxWidth는 양수(px)여야 합니다 — ${block.src}`);
  const filePath = path.join(ROOT, "public", block.src.replace(/^\//, ""));
  if (!fs.existsSync(filePath)) {
    fail(`${context}: 이미지 파일 없음 — ${block.src}`);
    return;
  }
  if (!block.alt.trim()) fail(`${context}: 이미지 대체 텍스트(alt)가 비어 있음 — ${block.src}`);
  if (filePath.endsWith(".png")) {
    const size = getPngSize(filePath);
    if (size) {
      const declared = block.width / block.height;
      const actual = size.width / size.height;
      if (Math.abs(declared - actual) / actual > 0.02) {
        fail(`${context}: 이미지 종횡비 불일치 — 선언 ${block.width}x${block.height}, 실제 ${size.width}x${size.height} (${block.src})`);
      }
    }
  }
  const stat = fs.statSync(filePath);
  if (stat.size > 700 * 1024) warn(`${context}: 이미지 용량이 큼 (${(stat.size / 1024).toFixed(0)}KB) — ${block.src}`);
}

/** 본문에서 실제로 쓰는 그림 id와 이미지 경로(쓰이지 않는 자산을 찾는 데 쓴다) */
const usedDiagrams = new Set<string>();
const usedImages = new Set<string>();

function checkBlocks(blocks: Block[], context: string) {
  for (const b of blocks) {
    if (b.type === "diagram") usedDiagrams.add(b.id);
    if (b.type === "image") usedImages.add(b.src);
    if (b.type === "math") checkTex(b.tex, context);
    else if (b.type === "callout") {
      if (b.title) checkInline(b.title, context);
      checkBlocks(b.blocks, context);
    } else if (b.type === "heading" || b.type === "paragraph") checkInline(b.text, context);
    else if (b.type === "list") b.items.forEach((it) => checkInline(it, context));
    else if (b.type === "table") [...b.headers, ...b.rows.flat()].forEach((c) => checkInline(c, context));
    else if (b.type === "image") checkImage(b, context);
    else if (b.type === "diagram" && !DIAGRAMS[b.id]) fail(`${context}: 등록되지 않은 다이어그램 id "${b.id}" — src/components/diagrams/index.tsx에 추가하십시오`);
  }
}

const checkMarkdown = (md: string, context: string) => checkBlocks(parseMarkdown(md), context);
/** 문항·해설: 화면처럼 한 줄이면 인라인, 여러 줄이면 블록 마크다운으로 검사한다. */
const checkRich = (text: string, context: string) => (text.includes("\n") ? checkMarkdown(text, context) : checkInline(text, context));

// ─── 실습 ──────────────────────────────────────────────────────────────────

function checkExercise(e: Exercise, context: string) {
  if (!e.title.trim()) fail(`${context}: title이 비어 있음`);
  checkMarkdown(e.prompt, `${context} 문제`);
  if (!e.starter.includes("TODO")) fail(`${context}: 시작 코드에 TODO 표시가 없음`);
  if (!/@test\(/.test(e.tests)) fail(`${context}: 채점 코드에 @test 항목이 없음`);
  if (!e.solution.trim()) fail(`${context}: 모범 답안이 비어 있음`);
  if (e.hints.length < 2) fail(`${context}: 힌트가 2개 미만`);
  e.hints.forEach((h) => checkInline(h, `${context} 힌트`));
}

// ─── 레슨 ──────────────────────────────────────────────────────────────────

const lessonIds = new Set<string>();

function checkLesson(lesson: Lesson, mod: Module) {
  const ctx = `${mod.code} ${lesson.id}`;
  if (!ID.test(lesson.id)) fail(`${ctx}: 레슨 id 형식이 잘못됨(소문자·숫자·하이픈)`);
  if (lessonIds.has(lesson.id)) fail(`${ctx}: 레슨 id 중복(모든 모듈에서 유일해야 함)`);
  lessonIds.add(lesson.id);
  if (!TIER_ORDER.includes(lesson.tier)) fail(`${ctx}: tier는 core·supplement·advanced 중 하나`);
  if (!lesson.title.trim()) fail(`${ctx}: 제목이 비어 있음`);
  if (!lesson.goal.trim()) fail(`${ctx}: 학습 목표(goal)가 비어 있음`);
  else checkInline(lesson.goal, `${ctx} 목표`);
  if (!lesson.why.trim()) fail(`${ctx}: 쓰이는 곳(why)이 비어 있음`);
  else checkInline(lesson.why, `${ctx} 쓰이는 곳`);
  if (!lesson.body.trim()) fail(`${ctx}: 본문이 비어 있음`);
  checkBlocks(lesson.learn, `${ctx} 본문`);
  if (lesson.tier === "core" && lesson.minutes > MAX_CORE_MINUTES) warn(`${ctx}: 예상 학습 시간 ${lesson.minutes}분 — 핵심 레슨은 ${MAX_CORE_MINUTES}분 이하를 권장합니다`);

  for (const c of lesson.concepts ?? []) if (!getConcept(c)) fail(`${ctx}: 없는 개념 id "${c}"`);
  if (lesson.tier === "core" && !lesson.concepts?.length && mod.track !== "intro" && mod.track !== "capstone") warn(`${ctx}: 핵심 레슨인데 다루는 개념(concepts)이 없음`);
  if (lesson.tier !== "core" && lesson.concepts?.length) fail(`${ctx}: 개념(concepts)은 핵심 레슨에만 연결합니다(보충·심화는 requires로 선수 레슨을 적습니다)`);
  for (const r of lesson.requires ?? []) if (!getLesson(r)) fail(`${ctx}: requires의 레슨 "${r}"이(가) 없음`);

  const minChecks = lesson.tier === "core" ? 4 : 2;
  if (lesson.checks.length < minChecks) fail(`${ctx}: 확인 문제 ${lesson.checks.length}개 — ${lesson.tier === "core" ? "핵심" : "보충·심화"} 레슨은 ${minChecks}개 이상`);
  const keys = new Set<string>();
  const key = (k: string, kind: string) => {
    if (!KEY.test(k)) fail(`${ctx}: ${kind} 키 "${k}" 형식이 잘못됨`);
    if (keys.has(k)) fail(`${ctx}: 키 "${k}" 중복(레슨 안의 모든 문항에서 유일해야 함)`);
    keys.add(k);
  };
  for (const c of lesson.checks) {
    const cctx = `${ctx} 확인 문제 ${c.key}`;
    key(c.key, "확인 문제");
    if (c.choices.length < 3 || c.choices.length > 6) fail(`${cctx}: 선택지는 3~6개`);
    if (new Set(c.choices).size !== c.choices.length) fail(`${cctx}: 선택지 중복`);
    if (!Number.isInteger(c.answer) || c.answer < 0 || c.answer >= c.choices.length) fail(`${cctx}: 정답 번호가 범위를 벗어남`);
    if (!c.explanation.trim()) fail(`${cctx}: 해설이 비어 있음`);
    checkRich(c.question, cctx);
    checkRich(c.explanation, cctx);
    c.choices.forEach((t) => checkInline(t, cctx));
  }
  if (lesson.tier === "core" && !lesson.exercises?.length) warn(`${ctx}: 핵심 레슨에 코딩 실습이 없음`);
  for (const e of lesson.exercises ?? []) {
    key(e.key, "실습");
    checkExercise(e, `${ctx} 실습 ${e.key}`);
  }
  for (const p of lesson.predicts ?? []) {
    const pctx = `${ctx} 출력 예측 ${p.key}`;
    key(p.key, "출력 예측");
    if (!p.code.trim() || !p.expected.trim()) fail(`${pctx}: 코드 또는 정답 출력이 비어 있음`);
    if (!p.explanation.trim()) fail(`${pctx}: 해설이 비어 있음`);
    checkRich(p.explanation, pctx);
    if (p.question) checkRich(p.question, pctx);
  }
  for (const d of lesson.descriptive ?? []) {
    const dctx = `${ctx} 서술형 ${d.key}`;
    key(d.key, "서술형");
    if (!d.question.trim()) fail(`${dctx}: 문항이 비어 있음`);
    if (!d.answer.trim()) fail(`${dctx}: 모범답안이 비어 있음`);
    if (d.keyPoints.length < 2) fail(`${dctx}: 핵심 요소가 2개 미만`);
    checkRich(d.question, dctx);
    checkMarkdown(d.answer, `${dctx} 모범답안`);
    d.keyPoints.forEach((k) => checkInline(k, `${dctx} 핵심 요소`));
  }
  for (const r of lesson.references ?? []) {
    if (!/^https:\/\//.test(r.url)) fail(`${ctx}: 참고 자료 링크가 https가 아님 — ${r.url}`);
    if (!r.title.trim()) fail(`${ctx}: 참고 자료 제목이 비어 있음`);
  }
}

// ─── 과제 ──────────────────────────────────────────────────────────────────

const assignmentKeys = new Set<string>();

function checkAssignment(spec: AssignmentSource, mod: Module) {
  const ctx = `${mod.code} 과제 ${spec.key}`;
  if (!ID.test(spec.key)) fail(`${ctx}: 과제 키 형식이 잘못됨`);
  if (assignmentKeys.has(spec.key)) fail(`${ctx}: 과제 키 중복`);
  if (getLesson(spec.key)) fail(`${ctx}: 과제 키가 레슨 id와 같음(실습 전역 id가 겹칩니다)`);
  assignmentKeys.add(spec.key);
  if (!["module", "track", "capstone"].includes(spec.kind)) fail(`${ctx}: kind는 module·track·capstone 중 하나`);
  if (!spec.title.trim()) fail(`${ctx}: 제목이 비어 있음`);
  checkMarkdown(spec.summary, `${ctx} 개요`);
  if (spec.requirements.length === 0) warn(`${ctx}: 요구사항이 없음`);
  spec.requirements.forEach((r) => checkInline(r, `${ctx} 요구사항`));
  if (spec.gradingNotes) checkMarkdown(spec.gradingNotes, `${ctx} 채점 참고`);
  if (spec.tasks.length === 0) fail(`${ctx}: 과제 단계(tasks)가 없음`);
  if (!spec.tasks.some((t) => t.tier === "core")) fail(`${ctx}: 핵심 과제 단계가 없음`);
  const ranks = spec.tasks.map((t) => TIER_ORDER.indexOf(t.tier));
  if (ranks.some((r) => r < 0)) fail(`${ctx}: 과제 단계 tier는 core·supplement·advanced 중 하나`);
  if (ranks.some((r, i) => i > 0 && r < ranks[i - 1])) fail(`${ctx}: 과제 단계는 핵심 → 보충 → 심화 순서여야 함`);
  const taskIds = new Set<string>();
  const cellIds = new Set<string>();
  for (const task of spec.tasks) {
    const tctx = `${ctx} ${task.id}`;
    if (!KEY.test(task.id) || taskIds.has(task.id)) fail(`${tctx}: 과제 단계 id가 잘못되었거나 중복`);
    taskIds.add(task.id);
    if (!task.title.trim()) fail(`${tctx}: 제목이 비어 있음`);
    checkMarkdown(task.instructions, `${tctx} 안내`);
    if (task.cells.length === 0) fail(`${tctx}: 셀이 없음`);
    for (const cell of task.cells) {
      if (!KEY.test(cell.id)) fail(`${tctx}: 셀 id "${cell.id}" 형식이 잘못됨`);
      if (cellIds.has(cell.id)) fail(`${tctx}: 셀 id "${cell.id}" 중복(과제 전체에서 유일해야 함)`);
      cellIds.add(cell.id);
      if (cell.kind === "code") {
        if (!cell.starter.trim()) fail(`${tctx} ${cell.id}: 시작 코드가 비어 있음`);
      } else {
        if (!cell.prompt.trim()) fail(`${tctx} ${cell.id}: 답안 안내(prompt)가 비어 있음`);
        checkInline(cell.prompt, `${tctx} ${cell.id}`);
        if (cell.template && cell.minChars !== undefined && cell.minChars <= cell.template.trim().length) {
          fail(`${tctx} ${cell.id}: minChars(${cell.minChars})가 답안 틀 길이(${cell.template.trim().length}) 이하 — 틀만으로 조건을 채웁니다`);
        }
      }
    }
  }
  const rubricIds = new Set<string>();
  let sum = 0;
  for (const c of spec.rubric) {
    if (!KEY.test(c.id) || rubricIds.has(c.id)) fail(`${ctx}: 채점 기준 id "${c.id}"가 잘못되었거나 중복`);
    rubricIds.add(c.id);
    if (!(c.points > 0) || Math.round(c.points * 2) !== c.points * 2) fail(`${ctx}: 채점 기준 "${c.id}"의 배점은 0.5점 단위 양수여야 함`);
    checkInline(c.guide, `${ctx} 채점 기준(${c.id})`);
    sum += c.points;
  }
  if (Math.abs(sum - spec.maxScore) > 1e-9) fail(`${ctx}: 채점 기준 배점 합(${sum})이 만점(${spec.maxScore})과 다름`);
  const testIds = new Set<string>();
  for (const t of spec.autoTests) {
    if (!KEY.test(t.id) || testIds.has(t.id)) fail(`${ctx}: 자동 테스트 id "${t.id}"가 잘못되었거나 중복`);
    testIds.add(t.id);
    if (!taskIds.has(t.taskId)) fail(`${ctx} ${t.id}: taskId "${t.taskId}"에 해당하는 과제 단계가 없음`);
    if (!t.code.trim() || !t.title.trim()) fail(`${ctx} ${t.id}: 코드 또는 제목이 비어 있음`);
    if (t.hint) checkInline(t.hint, `${ctx} ${t.id}`);
  }
  const chKeys = new Set<string>();
  for (const ch of spec.challenges) {
    if (!KEY.test(ch.key) || chKeys.has(ch.key)) fail(`${ctx}: 심화 문제 키 "${ch.key}"가 잘못되었거나 중복`);
    chKeys.add(ch.key);
    checkExercise(ch, `${ctx} 심화 문제 ${ch.key}`);
  }
}

// ─── 모듈·트랙 ─────────────────────────────────────────────────────────────

const slugs = new Set<string>();
const orders = new Map<string, Set<number>>();
for (const t of TRACKS) orders.set(t.id, new Set());

for (const mod of MODULES) {
  const ctx = `${mod.code} ${mod.slug}`;
  if (!ID.test(mod.slug)) fail(`${ctx}: 모듈 slug 형식이 잘못됨`);
  if (slugs.has(mod.slug)) fail(`${ctx}: 모듈 slug 중복`);
  slugs.add(mod.slug);
  const trackOrders = orders.get(mod.track);
  if (!trackOrders) fail(`${ctx}: 없는 트랙 "${mod.track}"`);
  else {
    if (trackOrders.has(mod.order)) fail(`${ctx}: 트랙 안 모듈 순서 ${mod.order} 중복`);
    trackOrders.add(mod.order);
  }
  if (!mod.title.trim() || !mod.summary.trim()) fail(`${ctx}: 제목 또는 한 줄 소개가 비어 있음`);
  if (!mod.anchor.trim()) fail(`${ctx}: 목표 문제(anchor)가 비어 있음`);
  else checkMarkdown(mod.anchor, `${ctx} 목표 문제`);
  if (mod.objectives.length < 2) fail(`${ctx}: 학습 목표(objectives)가 2개 미만`);
  mod.objectives.forEach((o) => checkInline(o, `${ctx} 학습 목표`));
  const core = mod.lessons.filter((l) => l.tier === "core");
  if (mod.track === "extension") {
    if (core.length > 0) fail(`${ctx}: 확장 모듈에는 핵심 레슨을 두지 않음`);
  } else {
    if (core.length === 0) fail(`${ctx}: 핵심 레슨이 없음`);
    else if (core.length > 6) warn(`${ctx}: 핵심 레슨 ${core.length}개 — 모듈당 2~6개를 권장합니다`);
    if (mod.recall.length < 3 || mod.recall.length > 5) fail(`${ctx}: 백지 복습 문항 ${mod.recall.length}개 — 3~5개`);
  }
  mod.recall.forEach((r, i) => {
    checkInline(r.prompt, `${ctx} 백지 복습 ${i + 1}`);
    if (r.hint) checkInline(r.hint, `${ctx} 백지 복습 ${i + 1} 힌트`);
  });
  for (const r of mod.references ?? []) if (!/^https:\/\//.test(r.url)) fail(`${ctx}: 참고 자료 링크가 https가 아님 — ${r.url}`);
  for (const lesson of mod.lessons) checkLesson(lesson, mod);
  if (mod.assignment) checkAssignment(mod.assignment, mod);
}
for (const [track, set] of orders) {
  const sorted = [...set].sort((a, b) => a - b);
  if (sorted.some((n, i) => n !== i + 1)) warn(`트랙 ${track}: 모듈 순서가 1부터 연속이 아님 (${sorted.join(", ")})`);
}

// ─── 개념과 선수 관계 ───────────────────────────────────────────────────────

const conceptIds = new Set<string>();
for (const c of CONCEPTS) {
  if (!ID.test(c.id) || conceptIds.has(c.id)) fail(`개념 #${c.order}: id "${c.id}"가 잘못되었거나 중복`);
  conceptIds.add(c.id);
  for (const r of c.requires) {
    const prerequisite = getConcept(r);
    if (prerequisite && prerequisite.order >= c.order) fail(`개념 #${c.order} ${c.id}: 선수 개념 #${prerequisite.order} ${r}의 표시 번호가 앞서지 않음`);
  }
  for (const r of c.requires) if (!CONCEPTS.some((x) => x.id === r)) fail(`개념 ${c.id}: 없는 선수 개념 "${r}"`);
}
if (new Set(CONCEPTS.map((c) => c.order)).size !== CONCEPTS.length) fail("개념 표시 번호(order) 중복");

// 순환 검사(깊이 우선 탐색)
const state = new Map<string, "visiting" | "done">();
function visit(id: string, trail: string[]) {
  if (state.get(id) === "done") return;
  if (state.get(id) === "visiting") {
    fail(`개념 선수 관계에 순환: ${[...trail, id].join(" → ")}`);
    return;
  }
  state.set(id, "visiting");
  for (const r of getConcept(id)?.requires ?? []) visit(r, [...trail, id]);
  state.set(id, "done");
}
CONCEPTS.forEach((c) => visit(c.id, []));

// 기본 경로에서 개념이 처음 나오는 위치
const firstAt = new Map<string, number>();
CORE_PATH.forEach((l, i) => (l.concepts ?? []).forEach((c) => firstAt.has(c) || firstAt.set(c, i)));
for (const c of CONCEPTS) {
  const at = firstAt.get(c.id);
  if (at === undefined) {
    fail(`개념 #${c.order} ${c.id}: 이 개념을 다루는 핵심 레슨이 없음`);
    continue;
  }
  for (const r of c.requires) {
    const rAt = firstAt.get(r);
    if (rAt !== undefined && rAt > at) {
      fail(`개념 #${c.order} ${c.id}(${CORE_PATH[at].id}): 선수 개념 ${r}(${CORE_PATH[rAt].id})보다 먼저 나옴`);
    }
  }
}
const pathAt = new Map(CORE_PATH.map((l, i) => [l.id, i]));
for (const l of CORE_PATH) {
  for (const r of l.requires ?? []) {
    const rAt = pathAt.get(r);
    if (rAt !== undefined && rAt > pathAt.get(l.id)!) fail(`${l.id}: requires의 핵심 레슨 ${r}이(가) 기본 경로에서 뒤에 나옴`);
  }
}

// ─── 일정표·예전 주소 ───────────────────────────────────────────────────────

const scheduled = new Map<string, number>();
for (const w of SCHEDULE) {
  for (const slug of w.modules) {
    if (!getModule(slug)) fail(`일정표 ${w.week}주 차: 없는 모듈 "${slug}"`);
    if (scheduled.has(slug)) fail(`일정표: 모듈 "${slug}"이(가) ${scheduled.get(slug)}주 차와 ${w.week}주 차에 중복`);
    scheduled.set(slug, w.week);
  }
  for (const due of w.due) if (!moduleOfAssignment(due)) fail(`일정표 ${w.week}주 차: 없는 과제 키 "${due}"`);
}
for (const mod of MODULES) if (mod.track !== "extension" && !scheduled.has(mod.slug)) fail(`일정표: 모듈 "${mod.slug}"이(가) 어느 주에도 없음`);
for (const mod of MODULES) if (mod.assignment && !SCHEDULE.some((w) => w.due.includes(mod.assignment!.key))) warn(`일정표: 과제 "${mod.assignment.key}"의 권장 주가 없음`);
for (const [stage, lesson] of Object.entries(LEGACY_STAGE_LESSON)) if (!getLesson(lesson)) fail(`예전 주소 대응표: 단계 "${stage}" → 없는 레슨 "${lesson}"`);
for (const [week, slug] of Object.entries(LEGACY_WEEK_ASSIGNMENT_MODULE)) if (!getModule(slug)?.assignment) fail(`예전 주소 대응표: ${week} → 과제가 없는 모듈 "${slug}"`);

// ─── 쓰이지 않는 그림과 이미지 ──────────────────────────────────────────────

for (const id of Object.keys(DIAGRAMS)) if (!usedDiagrams.has(id)) warn(`그림 "${id}"이(가) 등록되어 있지만 어느 본문에서도 쓰지 않음 — 지우거나 본문에 넣으십시오`);
// 레슨 이미지는 public/images/week<N>/ 아래에 있다. 그 밖의 파일(브랜드·OAuth 로고)은 사이트 밖 설정에서도 쓴다.
function imageFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? imageFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const imageRoot = path.join(ROOT, "public", "images");
for (const file of imageFiles(imageRoot)) {
  const src = "/images/" + path.relative(imageRoot, file).split(path.sep).join("/");
  if (/^\/images\/week\d+\//.test(src) && !usedImages.has(src)) warn(`이미지 ${src}이(가) 어느 본문에서도 쓰이지 않음 — 지우거나 본문에 넣으십시오`);
}

// ─── 결과 ──────────────────────────────────────────────────────────────────

const lessons = MODULES.flatMap((m) => m.lessons);
console.log(
  `\n대상: 트랙 ${TRACKS.length} · 모듈 ${MODULES.length} · 레슨 ${lessons.length}(핵심 ${CORE_PATH.length}) · 개념 ${CONCEPTS.length} · ` +
    `확인 문제 ${lessons.reduce((n, l) => n + l.checks.length, 0)} · 실습 ${lessons.reduce((n, l) => n + (l.exercises?.length ?? 0), 0)} · 과제 ${assignmentKeys.size}`
);
console.log(`검증 완료: 오류 ${errorCount}건, 경고 ${warnCount}건`);
if (errorCount > 0) {
  console.error("\n콘텐츠 검증 실패 — 위 오류를 수정한 뒤 다시 실행하십시오.");
  process.exit(1);
}
console.log("모든 필수 검증 통과." + (warnCount > 0 ? " 경고 항목은 빌드를 막지 않지만 검토를 권장합니다." : ""));
