/**
 * 콘텐츠 정합성 검증 스크립트.
 *
 * 매주 새 콘텐츠가 추가될 때마다 사람이 손으로 확인해오던 것들을 자동화한다:
 *   1. quiz[].id ↔ quizAnswers[].answers 키가 1:1로 대응하는가 (누락/유령 항목 없음)
 *   2. 본문에 등장하는 모든 $...$ 인라인 수식과 ```math 블록이 실제로 유효한 LaTeX인가
 *   3. 본문 안에 $...$로 감싸이지 않은 "날것" 수학 표현이 남아있지 않은가 (KaTeX 렌더링 누락 방지)
 *   4. image 블록이 가리키는 파일이 실제로 존재하고, 선언된 width/height가 실제 픽셀 크기와 맞는가
 *   5. 섹션 구조: 모든 `##` 섹션에 고유한 {#id}가 있고, sections/weekN.ts의 메타(목표·확인 문제·서술형
 *      배정)와 1:1로 대응하는가. 확인 문제의 정답 번호가 유효한가, 서술형 퀴즈가 정확히 한 섹션에만
 *      배정되었는가, 외부 자료 링크가 https인가
 *
 * 사용법: npm run validate:content
 * 실패 시 0이 아닌 코드로 종료하므로 CI(build 이전 단계)에 그대로 연결할 수 있다.
 */
import fs from "fs";
import path from "path";
import katex from "katex";
import { WEEKS } from "../src/content/weeks";
import { quizAnswers } from "../src/content/quizAnswers";
import { parseMarkdown } from "../src/content/markdown";
import { getWeekOutline } from "../src/content/sections";
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
  checkBlocks(parseMarkdown(week.assignmentMd), `${label} assignmentMd`);
}

function checkSections(week: (typeof WEEKS)[number], label: string) {
  if (!(week.assignmentMaxScore > 0)) fail(`${label}: assignmentMaxScore가 0보다 커야 함`);
  const headings = parseMarkdown(week.conceptsMd).filter(
    (b): b is Extract<Block, { type: "heading" }> => b.type === "heading" && b.level === 2
  );
  if (headings.length === 0) fail(`${label}: \`## 제목 {#id}\` 섹션이 하나도 없음`);
  const ids = new Set<string>();
  for (const h of headings) {
    if (!h.id) fail(`${label}: 섹션 "${h.text}"에 {#id}가 없음 — 진도 저장 키로 쓰이므로 반드시 지정`);
    else if (ids.has(h.id)) fail(`${label}: 섹션 id "${h.id}" 중복`);
    else ids.add(h.id);
  }
  for (const key of Object.keys(week.sections)) {
    if (!ids.has(key)) fail(`${label}: sections/week${week.number}.ts의 "${key}"에 대응하는 ## 섹션이 없음 (유령 항목)`);
  }
  const quizIds = new Set(week.quiz.map((q) => q.id));
  const assigned = new Map<string, string>();
  const checkIds = new Set<string>();
  for (const section of getWeekOutline(week).sections) {
    const ctx = `${label} 섹션 ${section.id}`;
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
      if (assigned.has(q)) fail(`${ctx}: 서술형 "${q}"가 "${assigned.get(q)}" 섹션에도 배정됨`);
      assigned.set(q, section.id);
    }
    for (const r of meta.references ?? []) {
      if (!/^https:\/\//.test(r.url)) fail(`${ctx}: 외부 자료 링크가 https가 아님 — ${r.url}`);
    }
    if (section.practice.length === 0) warn(`${ctx}: [[practice]] 실습 단계가 없음`);
    if (section.learn.filter((b) => b.type === "practice").length > 0) fail(`${ctx}: [[practice]]가 두 번 이상 있음`);
  }
  for (const q of quizIds) if (!assigned.has(q)) fail(`${label}: 서술형 "${q}"가 어떤 섹션에도 배정되지 않음`);
}

console.log(`\n검증 완료: 오류 ${errorCount}건, 경고 ${warnCount}건`);
if (errorCount > 0) {
  console.error("\n콘텐츠 검증 실패 — 위 오류를 수정한 뒤 다시 실행하세요.");
  process.exit(1);
} else {
  console.log("모든 필수 검증 통과.");
  if (warnCount > 0) console.log("경고 항목은 빌드를 막지 않지만, 검토를 권장합니다.");
}
