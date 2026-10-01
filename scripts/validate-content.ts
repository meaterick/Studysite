/**
 * 콘텐츠 정합성 검증 스크립트.
 *
 * 매주 새 콘텐츠가 추가될 때마다 사람이 손으로 확인해오던 것들을 자동화한다:
 *   1. quiz[].id ↔ quizAnswers[].answers 키가 1:1로 대응하는가 (누락/유령 항목 없음)
 *   2. 본문에 등장하는 모든 $...$ 인라인 수식과 ```math 블록이 실제로 유효한 LaTeX인가
 *   3. 본문 안에 $...$로 감싸이지 않은 "날것" 수학 표현이 남아있지 않은가 (KaTeX 렌더링 누락 방지)
 *   4. image 블록이 가리키는 파일이 실제로 존재하고, 선언된 width/height가 실제 픽셀 크기와 맞는가
 *   5. 단계 구조: 모든 `##` 단계에 고유한 {#id}가 있고, sections/weekN.ts의 메타(목표·확인 문제·서술형
 *      배정)와 1:1로 대응하는가. 확인 문제의 정답 번호가 유효한가, 서술형 퀴즈가 정확히 한 단계에만
 *      배정되었는가, 외부 자료 링크가 https인가
 *   6. 코딩 실습·퀴즈·과제 자동 테스트(labs/weekN.ts): id가 전체에서 유일한가, 연결한 단계·과제 항목이 있는가,
 *      시작 코드에 TODO가 있고 채점 코드에 @test 항목이 있는가, 객관식 정답 번호가 유효한가 등
 *      (모범 답안이 실제로 채점을 통과하는지는 npm run check:labs가 Python으로 실행해 확인한다)
 *
 * 사용법: npm run validate:content
 * 실패 시 0이 아닌 코드로 종료하므로 CI(build 이전 단계)에 그대로 연결할 수 있다.
 */
import fs from "fs";
import { TIER_INFO, TIER_ORDER } from "../src/content/tiers";
import path from "path";
import katex from "katex";
import { WEEKS } from "../src/content/weeks";
import { quizAnswers } from "../src/content/quizAnswers";
import { parseMarkdown } from "../src/content/markdown";
import { getWeekOutline } from "../src/content/sections";
import { LABS } from "../src/content/labs";
import type { Block } from "../src/content/types";

const ROOT = path.join(__dirname, "..");
let errorCount = 0;
let warnCount = 0;

function fail(msg: string) {
  errorCount++;
  console.error(`✗ ${msg}`);
}

function warn(msg: string) {
  warnCount++;
  console.warn(`⚠ ${msg}`);
}

function checkTex(tex: string, context: string) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: "ignore" });
  } catch (e) {
    fail(`${context}: 유효하지 않은 LaTeX "${tex.slice(0, 60)}" — ${(e as Error).message}`);
  }
}

// $...$ 안의 내용만 뽑아 KaTeX로 파싱해보고, 그 바깥에 남은 텍스트에서 흔한 "날것"
// 수학 기호(적분/편미분/그리스 문자 아래첨자 등)가 있으면 경고한다 — 100% 정확한
// 판별은 불가능하므로 오탐은 있을 수 있지만, 새 콘텐츠에서 이번에 실제로 발견됐던
// "P(A|B) = P(A∩B) / P(B)" 같은 패턴을 잡아내는 것이 목적이다.
const RAW_MATH_HINT = /[∂∇√∑×÷≈≥≤∈∩∪²³αβγδεηθλμπσφωΣ]|\b[a-zA-Z]\([a-zA-Z]\|[a-zA-Z]\)|dL\/d[a-zA-Z]|[a-zA-Z]_[0-9]|[a-zA-Z][₀-₉]/u;

function checkInlineMath(text: string, context: string) {
  const mathRe = /\$([^$\n]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = mathRe.exec(text))) checkTex(m[1], context);

  const stripped = text.replace(/\$[^$\n]+\$/g, "").replace(/`[^`]+`/g, "");
  if (RAW_MATH_HINT.test(stripped)) {
    const snippet = stripped.match(RAW_MATH_HINT);
    warn(`${context}: $...$ 밖에 날것 수식으로 보이는 표현이 있을 수 있음 (예: "${snippet?.[0]}") — KaTeX가 렌더링하지 않습니다.`);
  }
}

function getPngSize(filePath: string): { width: number; height: number } | null {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function checkImage(block: Extract<Block, { type: "image" }>, context: string) {
  const filePath = path.join(ROOT, "public", block.src.replace(/^\//, ""));
  if (!fs.existsSync(filePath)) {
    fail(`${context}: 이미지 파일 없음 — ${block.src}`);
    return;
  }
  if (filePath.endsWith(".png")) {
    const size = getPngSize(filePath);
    // width/height는 실제 픽셀 크기가 아니라 표시 비율(aspect ratio)만 맞으면 된다 —
    // 원본 고해상도 이미지를 더 작은 표시 크기로 선언해두는 것은 정상적인 패턴이다.
    if (size) {
      const declaredRatio = block.width / block.height;
      const actualRatio = size.width / size.height;
      const ratioDiff = Math.abs(declaredRatio - actualRatio) / actualRatio;
      if (ratioDiff > 0.02) {
        fail(
          `${context}: 이미지 종횡비 불일치 — 선언 ${block.width}x${block.height} (비율 ${declaredRatio.toFixed(3)}), ` +
            `실제 ${size.width}x${size.height} (비율 ${actualRatio.toFixed(3)}) — 레이아웃이 찌그러집니다 (${block.src})`
        );
      }
    }
  }
  const stat = fs.statSync(filePath);
  if (stat.size > 700 * 1024) {
    warn(`${context}: 이미지 용량이 큼 (${(stat.size / 1024).toFixed(0)}KB) — ${block.src}. 1GB RAM 서버 배포를 고려해 압축을 검토하세요.`);
  }
}

function checkBlocks(blocks: Block[], context: string) {
  for (const b of blocks) {
    if (b.type === "math") checkTex(b.tex, context);
    else if (b.type === "heading" || b.type === "paragraph" || (b.type === "callout" && b.text))
      checkInlineMath(b.text, context);
    else if (b.type === "list") b.items.forEach((it) => checkInlineMath(it, context));
    else if (b.type === "table") b.rows.flat().forEach((c) => checkInlineMath(c, context));
    else if (b.type === "image") checkImage(b, context);
  }
}

const labIds = new Set<string>();

for (const week of WEEKS) {
  const label = `week${week.number}`;
  const ans = quizAnswers.find((a) => a.week === week.number);

  if (!ans) {
    fail(`${label}: quizAnswers.ts에 해당 주차 항목이 없음`);
  } else {
    const quizIds = new Set(week.quiz.map((q) => q.id));
    const answerIds = new Set(Object.keys(ans.answers));
    for (const id of quizIds) {
      if (!answerIds.has(id)) fail(`${label}: quiz "${id}"에 대응하는 답이 quizAnswers.ts에 없음`);
      else if (!ans.answers[id]?.trim()) fail(`${label}: quiz "${id}"의 답이 빈 문자열`);
    }
    for (const id of answerIds) {
      if (!quizIds.has(id)) fail(`${label}: quizAnswers.ts의 "${id}"에 대응하는 quiz 문항이 없음 (유령 항목)`);
    }
    Object.entries(ans.answers).forEach(([id, text]) => checkInlineMath(text, `${label} 정답(${id})`));
    checkInlineMath(ans.sampleDirection, `${label} sampleDirection`);
  }

  week.quiz.forEach((q) => checkInlineMath(q.question, `${label} quiz(${q.id})`));
  checkBlocks(parseMarkdown(week.conceptsMd), `${label} conceptsMd`);
  checkSections(week, label);
  checkAssignment(week, label);
  checkLab(week, label);
}

function checkLab(week: (typeof WEEKS)[number], label: string) {
  const lab = LABS[week.slug];
  const ctx = `${label} 실습`;
  if (!lab) {
    fail(`${ctx}: labs/week${week.number}.ts가 LABS에 등록되지 않음`);
    return;
  }
  const sectionIds = new Set(getWeekOutline(week).sections.map((s) => s.id));
  const taskIds = new Set(week.assignment.tasks.map((t) => t.id));
  const ID = /^w\d+-[a-z0-9-]+$/;
  const checkId = (id: string, where: string) => {
    if (!ID.test(id)) fail(`${ctx} ${where}: id "${id}" 형식이 잘못됨 (예: w1-lab-name)`);
    if (labIds.has(id)) fail(`${ctx} ${where}: id "${id}" 중복 (모든 주차에서 유일해야 함)`);
    labIds.add(id);
  };
  const exercises = [...lab.exercises.map((e) => ({ e, challenge: false })), ...lab.assignment.challenges.map((e) => ({ e, challenge: true }))];
  if (lab.exercises.length === 0) warn(`${ctx}: 코딩 실습 문제가 없음`);
  for (const { e, challenge } of exercises) {
    const ectx = `${ctx} ${e.id}`;
    checkId(e.id, challenge ? "심화 문제" : "실습");
    if (challenge && e.sectionId) fail(`${ectx}: 과제 심화 문제에는 sectionId를 두지 않음`);
    if (!challenge && (!e.sectionId || !sectionIds.has(e.sectionId))) fail(`${ectx}: sectionId "${e.sectionId}"에 해당하는 단계가 없음`);
    if (!e.title.trim()) fail(`${ectx}: title이 비어 있음`);
    if (!TIER_ORDER.includes(e.tier)) fail(`${ectx}: tier는 core·supplement·advanced 중 하나`);
    if (challenge && e.tier !== "advanced") fail(`${ectx}: 과제 심화 문제의 tier는 advanced`);
    checkBlocks(parseMarkdown(e.prompt), `${ectx} prompt`);
    if (!e.starter.includes("TODO")) fail(`${ectx}: 시작 코드에 TODO 표시가 없음`);
    if (!/@test\(/.test(e.tests)) fail(`${ectx}: 채점 코드에 @test 항목이 없음`);
    if (!e.solution.trim()) fail(`${ectx}: 모범 답안이 비어 있음`);
    if (e.hints.length < 2) fail(`${ectx}: 힌트가 2개 미만`);
    e.hints.forEach((h) => checkInlineMath(h, `${ectx} 힌트`));
  }
  // 세 구분 모두에 실습과 퀴즈가 있어야 초심자·중급자·전문가가 각자 풀 문제가 생긴다(해당 구분의 단계가 있을 때).
  const outlineTiers = new Set(getWeekOutline(week).sections.map((s) => s.tier));
  for (const tier of TIER_ORDER) {
    if (!outlineTiers.has(tier)) continue;
    if (!lab.exercises.some((e) => e.tier === tier)) warn(`${ctx}: ${TIER_INFO[tier].label} 실습이 없음`);
    if (!lab.quiz.some((q) => q.tier === tier)) warn(`${ctx}: ${TIER_INFO[tier].label} 퀴즈가 없음`);
  }
  const kinds = new Set(lab.quiz.map((q) => q.kind));
  for (const kind of ["choice", "predict", "descriptive"] as const) if (!kinds.has(kind)) warn(`${ctx}: 퀴즈에 ${kind} 문항이 없음`);
  for (const q of lab.quiz) {
    const qctx = `${ctx} ${q.id}`;
    checkId(q.id, "퀴즈");
    if (!sectionIds.has(q.sectionId)) fail(`${qctx}: sectionId "${q.sectionId}"에 해당하는 단계가 없음`);
    if (!TIER_ORDER.includes(q.tier)) fail(`${qctx}: tier는 core·supplement·advanced 중 하나`);
    if (q.kind === "choice") {
      if (q.choices.length < 3) fail(`${qctx}: 선택지가 3개 미만`);
      if (new Set(q.choices).size !== q.choices.length) fail(`${qctx}: 선택지 중복`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) fail(`${qctx}: 정답 번호가 범위를 벗어남`);
      [q.question, q.explanation, ...q.choices].forEach((t) => checkInlineMath(t, qctx));
      if (!q.explanation.trim()) fail(`${qctx}: 해설이 비어 있음`);
    } else if (q.kind === "predict") {
      if (!q.code.trim() || !q.expected.trim()) fail(`${qctx}: 코드 또는 정답 출력이 비어 있음`);
      if (!q.explanation.trim()) fail(`${qctx}: 해설이 비어 있음`);
      checkInlineMath(q.explanation, qctx);
      if (q.question) checkInlineMath(q.question, qctx);
    } else {
      if (!q.modelAnswer.trim()) fail(`${qctx}: 모범답안이 비어 있음`);
      if (q.keyPoints.length < 2) fail(`${qctx}: 핵심 요소가 2개 미만`);
      [q.question, q.modelAnswer, ...q.keyPoints].forEach((t) => checkInlineMath(t, qctx));
    }
  }
  if (lab.assignment.requirements.length === 0) warn(`${ctx}: 과제 요구사항이 없음`);
  lab.assignment.requirements.forEach((r) => checkInlineMath(r, `${ctx} 요구사항`));
  for (const t of lab.assignment.autoTests) {
    checkId(t.id, "자동 테스트");
    if (!taskIds.has(t.taskId)) fail(`${ctx} ${t.id}: taskId "${t.taskId}"에 해당하는 과제 항목이 없음`);
    if (!t.code.trim() || !t.title.trim()) fail(`${ctx} ${t.id}: 코드 또는 제목이 비어 있음`);
    if (t.hint) checkInlineMath(t.hint, `${ctx} ${t.id}`);
  }
}

function checkAssignment(week: (typeof WEEKS)[number], label: string) {
  const spec = week.assignment;
  const ctx = `${label} 과제`;
  if (!spec.title.trim()) fail(`${ctx}: title이 비어 있음`);
  checkBlocks(parseMarkdown(spec.summary), `${ctx} summary`);
  if (spec.tasks.length === 0) fail(`${ctx}: 과제 항목(tasks)이 없음`);
  if (!spec.tasks.some((t) => t.tier === "core")) fail(`${ctx}: 핵심(필수) 과제 항목이 하나도 없음`);
  // 핵심 과제 → 보충 → 심화 순서로 둔다(화면 순서 = 권장 순서).
  const taskTierRank = spec.tasks.map((t) => TIER_ORDER.indexOf(t.tier));
  if (taskTierRank.some((r) => r < 0)) fail(`${ctx}: 과제 항목 tier는 core·supplement·advanced 중 하나`);
  if (taskTierRank.some((r, i) => i > 0 && r < taskTierRank[i - 1])) fail(`${ctx}: 과제 항목은 핵심 → 보충 → 심화 순서여야 함`);
  const ID = /^[A-Za-z0-9_-]{1,64}$/;
  const taskIds = new Set<string>();
  const cellIds = new Set<string>();
  for (const task of spec.tasks) {
    const tctx = `${ctx} ${task.id}`;
    if (!ID.test(task.id)) fail(`${tctx}: task id 형식이 잘못됨`);
    if (taskIds.has(task.id)) fail(`${tctx}: task id 중복`);
    taskIds.add(task.id);
    if (!task.title.trim()) fail(`${tctx}: title이 비어 있음`);
    checkBlocks(parseMarkdown(task.instructions), `${tctx} instructions`);
    if (task.cells.length === 0) fail(`${tctx}: 셀이 없음`);
    for (const cell of task.cells) {
      if (!ID.test(cell.id)) fail(`${tctx}: 셀 id "${cell.id}" 형식이 잘못됨`);
      if (cellIds.has(cell.id)) fail(`${tctx}: 셀 id "${cell.id}" 중복 (과제 전체에서 유일해야 함)`);
      cellIds.add(cell.id);
      if (cell.kind === "code") {
        if (!cell.starter.trim()) fail(`${tctx} ${cell.id}: 시작 코드가 비어 있음`);
      } else {
        if (!cell.prompt.trim()) fail(`${tctx} ${cell.id}: 답안 안내(prompt)가 비어 있음`);
        checkInlineMath(cell.prompt, `${tctx} ${cell.id}`);
        if (cell.template && cell.minChars !== undefined && cell.minChars <= cell.template.trim().length)
          fail(`${tctx} ${cell.id}: minChars(${cell.minChars})가 답안 틀 길이(${cell.template.trim().length}) 이하 — 틀만으로 조건을 채웁니다.`);
      }
    }
  }
  const rubricIds = new Set<string>();
  let sum = 0;
  for (const c of spec.rubric) {
    if (!ID.test(c.id) || rubricIds.has(c.id)) fail(`${ctx}: 채점 기준 id "${c.id}"가 잘못되었거나 중복`);
    rubricIds.add(c.id);
    if (!(c.points > 0) || Math.round(c.points * 2) !== c.points * 2) fail(`${ctx}: 채점 기준 "${c.id}"의 배점은 0.5점 단위 양수여야 함`);
    checkInlineMath(c.guide, `${ctx} 채점 기준(${c.id})`);
    sum += c.points;
  }
  if (Math.abs(sum - week.assignmentMaxScore) > 1e-9) fail(`${ctx}: 채점 기준 배점 합(${sum})이 assignmentMaxScore(${week.assignmentMaxScore})와 다름`);
}

function checkSections(week: (typeof WEEKS)[number], label: string) {
  if (!(week.assignmentMaxScore > 0)) fail(`${label}: assignmentMaxScore가 0보다 커야 함`);
  const headings = parseMarkdown(week.conceptsMd).filter(
    (b): b is Extract<Block, { type: "heading" }> => b.type === "heading" && b.level === 2
  );
  if (headings.length === 0) fail(`${label}: \`## 제목 {#id}\` 단계가 하나도 없음`);
  const ids = new Set<string>();
  for (const h of headings) {
    if (!h.id) fail(`${label}: 단계 "${h.text}"에 {#id}가 없음 — 진도 저장 키로 쓰이므로 반드시 지정`);
    else if (ids.has(h.id)) fail(`${label}: 단계 id "${h.id}" 중복`);
    else ids.add(h.id);
  }
  for (const key of Object.keys(week.sections)) {
    if (!ids.has(key)) fail(`${label}: sections/week${week.number}.ts의 "${key}"에 대응하는 ## 단계가 없음 (유령 항목)`);
  }
  // 단계 구분: 모든 단계에 tier가 있고, 본문은 핵심 → 보충 → 심화 순서로 쓴다. 핵심 단계가 하나 이상 있어야 주차를 완료할 수 있다.
  const outline = getWeekOutline(week).sections;
  const ranks = outline.map((s) => TIER_ORDER.indexOf(week.sections[s.id]?.tier));
  if (ranks.some((r) => r < 0)) fail(`${label}: tier가 없거나 잘못된 단계가 있음 (core·supplement·advanced)`);
  if (ranks.some((r, i) => i > 0 && r < ranks[i - 1])) fail(`${label}: 본문 단계 순서가 핵심 → 보충 → 심화가 아님`);
  if (!outline.some((s) => s.tier === "core")) fail(`${label}: 핵심 단계가 하나도 없음`);
  const quizIds = new Set(week.quiz.map((q) => q.id));
  const assigned = new Map<string, string>();
  const checkIds = new Set<string>();
  for (const section of getWeekOutline(week).sections) {
    const ctx = `${label} 단계 ${section.id}`;
    const meta = week.sections[section.id];
    if (!meta) {
      fail(`${ctx}: sections/week${week.number}.ts에 메타(목표·확인 문제)가 없음`);
      continue;
    }
    if (!meta.goal.trim()) fail(`${ctx}: goal이 비어 있음`);
    checkInlineMath(meta.goal, `${ctx} goal`);
    if (meta.checks.length < 2) fail(`${ctx}: 확인 문제가 2개 미만`);
    for (const c of meta.checks) {
      if (checkIds.has(c.id)) fail(`${ctx}: 확인 문제 id "${c.id}" 중복`);
      checkIds.add(c.id);
      if (c.choices.length < 3) fail(`${ctx} ${c.id}: 선택지가 3개 미만`);
      if (!Number.isInteger(c.answer) || c.answer < 0 || c.answer >= c.choices.length) fail(`${ctx} ${c.id}: 정답 번호가 범위를 벗어남`);
      if (new Set(c.choices).size !== c.choices.length) fail(`${ctx} ${c.id}: 선택지 중복`);
      if (!c.explanation.trim()) fail(`${ctx} ${c.id}: 해설이 비어 있음`);
      [c.question, c.explanation, ...c.choices].forEach((t) => checkInlineMath(t, `${ctx} ${c.id}`));
    }
    for (const q of meta.quizIds) {
      if (!quizIds.has(q)) fail(`${ctx}: 서술형 "${q}"가 week.quiz에 없음`);
      if (assigned.has(q)) fail(`${ctx}: 서술형 "${q}"가 "${assigned.get(q)}" 단계에도 배정됨`);
      assigned.set(q, section.id);
    }
    for (const r of meta.references ?? []) {
      if (!/^https:\/\//.test(r.url)) fail(`${ctx}: 외부 자료 링크가 https가 아님 — ${r.url}`);
    }
    if (section.practice.length === 0) warn(`${ctx}: [[practice]] 실습 단계가 없음`);
    if (section.learn.filter((b) => b.type === "practice").length > 0) fail(`${ctx}: [[practice]]가 두 번 이상 있음`);
  }
  for (const q of quizIds) if (!assigned.has(q)) fail(`${label}: 서술형 "${q}"가 어떤 단계에도 배정되지 않음`);
}

console.log(`\n검증 완료: 오류 ${errorCount}건, 경고 ${warnCount}건`);
if (errorCount > 0) {
  console.error("\n콘텐츠 검증 실패 — 위 오류를 수정한 뒤 다시 실행하세요.");
  process.exit(1);
} else {
  console.log("모든 필수 검증 통과.");
  if (warnCount > 0) console.log("경고 항목은 빌드를 막지 않지만, 검토를 권장합니다.");
}
