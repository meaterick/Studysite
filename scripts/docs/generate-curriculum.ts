/**
 * 콘텐츠 원본(src/content)에서 커리큘럼 문서(docs/curriculum)를 만든다.
 * 생성한 문서는 직접 고치지 않는다. CI는 --check로 원본과 문서가 일치하는지 확인한다.
 *
 *   npm run docs:generate   문서를 다시 만든다(원본에 없는 옛 문서는 지운다)
 *   npm run docs:check      문서가 원본과 같은지 확인하고 문서 안의 저장소 링크를 검사한다
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONCEPTS, COURSE, LESSON_REF, MODULES, TRACKS, lessonsOfConcept, modulesOfTrack } from "../../src/content/course";
import { MODULE_SOURCES } from "../../src/content/modules";
import { SCHEDULE } from "../../src/content/curriculum/schedule";
import { TIER_INFO, TIER_ORDER } from "../../src/content/tiers";
import type { Block, Lesson, Module, ModuleSource } from "../../src/content/types";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/curriculum");
const CHECK = process.argv.includes("--check");
const BANNER = "<!-- npm run docs:generate가 만든 문서입니다. 이 파일 대신 src/content를 고치십시오. -->";

const generated = new Map<string, string>();
const emit = (name: string, lines: string[]) => generated.set(name, lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");

// ─── 조회 표 ───────────────────────────────────────────────────────────────

const sourceOf = new Map<string, ModuleSource>(MODULE_SOURCES.map((m) => [m.slug, m]));
const docFile = (m: Module) => `${m.code}-${m.slug}.md`;
const lessonAnchor = (id: string) => `lesson-${id}`;
const lessonHome = new Map<string, { module: Module; lesson: Lesson }>();
for (const m of MODULES) for (const l of m.lessons) lessonHome.set(l.id, { module: m, lesson: l });

/** 저장소 루트 기준 경로를 docs/curriculum에서 보는 상대 경로로 바꾼다. */
const repoLink = (rel: string) => `../../${rel}`;
const lessonSource = (m: Module, id: string) => `src/content/modules/${m.slug}/${id}.ts`;
const labSource = (m: Module, id: string) => {
  const rel = `src/content/modules/${m.slug}/labs/${id}.ts`;
  return fs.existsSync(path.join(ROOT, rel)) ? rel : undefined;
};

// ─── 글 다듬기 ─────────────────────────────────────────────────────────────

const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();
const cell = (s: string) => oneLine(s).replace(/\|/g, "&#124;");

/** 원본 글의 [[lesson:id]]를 문서 안의 링크로, [[diagram:key]]를 그림 이름으로 바꾼다. */
function docText(raw: string, from?: Module): string {
  return raw
    .replace(LESSON_REF, (whole, id: string, custom?: string) => {
      const home = lessonHome.get(id);
      if (!home) return whole;
      const label = custom ?? `${home.module.code} ${home.lesson.title}`;
      const target = from && home.module.slug === from.slug ? "" : docFile(home.module);
      return `[${label}](${target}#${lessonAnchor(id)})`;
    })
    .replace(/\[\[diagram:([a-z0-9-]+)\]\]/g, "(그림 `$1`)")
    .trim();
}

const flatten = (blocks: Block[]): Block[] => blocks.flatMap((b) => (b.type === "callout" ? [b, ...flatten(b.blocks)] : [b]));

function lessonCounts(l: Lesson) {
  const blocks = flatten(l.learn);
  return {
    checks: l.checks.length,
    predicts: l.predicts?.length ?? 0,
    descriptive: l.descriptive?.length ?? 0,
    exercises: l.exercises?.length ?? 0,
    code: blocks.filter((b) => b.type === "code" && (b.lang === "python" || b.lang === "py")).length,
    colab: blocks.filter((b) => b.type === "code" && b.lang === "python-colab").length,
    diagrams: blocks.filter((b) => b.type === "diagram").length,
    images: blocks.filter((b) => b.type === "image").length,
  };
}

const conceptLabel = (id: string) => {
  const c = CONCEPTS.find((v) => v.id === id);
  return c ? `#${c.order} ${c.title}` : id;
};

// ─── 모듈 문서 ─────────────────────────────────────────────────────────────

for (const m of MODULES) {
  const src = sourceOf.get(m.slug)!;
  const srcLessons = new Map(src.lessons.map((l) => [l.id, l]));
  const lines: string[] = [
    BANNER,
    `# ${m.code} ${m.title}`,
    "",
    `[전체 목차](README.md) · 트랙 ${m.trackInfo.code} ${m.trackInfo.title} · [모듈 원본](${repoLink(`src/content/modules/${m.slug}/index.ts`)})`,
    "",
    m.summary,
    "",
    "## 목표 문제",
    "",
    docText(src.anchor, m),
    "",
    "## 학습 목표",
    "",
    ...src.objectives.map((v) => `- ${docText(v, m)}`),
    "",
    "## 레슨",
    "",
    "| 순서 | 레슨 | 구분 | 예상 시간 | 개념 |",
    "| ---: | --- | --- | ---: | --- |",
    ...m.lessons.map((l) => `| ${l.order} | [${cell(l.title)}](#${lessonAnchor(l.id)}) | ${TIER_INFO[l.tier].label} | ${l.minutes}분 | ${cell((l.concepts ?? []).map(conceptLabel).join(", ") || "—")} |`),
    "",
  ];

  for (const tier of TIER_ORDER) {
    const group = m.lessons.filter((l) => l.tier === tier);
    if (!group.length) continue;
    lines.push(`## ${TIER_INFO[tier].label} 레슨`, "");
    for (const l of group) {
      const raw = srcLessons.get(l.id)!;
      const n = lessonCounts(l);
      const lab = labSource(m, l.id);
      const headings = l.learn.filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading").map((b) => b.text);
      lines.push(
        `<a id="${lessonAnchor(l.id)}"></a>`,
        "",
        `### ${l.order}. ${l.title}`,
        "",
        `${TIER_INFO[l.tier].label} · ${l.minutes}분 · [본문 원본](${repoLink(lessonSource(m, l.id))})${lab ? ` · [실습 원본](${repoLink(lab)})` : ""}`,
        "",
        `**학습 목표:** ${docText(raw.goal, m)}`,
        "",
        `**쓰이는 곳:** ${docText(raw.why, m)}`,
        "",
      );
      if (headings.length) lines.push(`**본문 절:** ${headings.map(oneLine).join(" · ")}`, "");
      const parts = [
        `확인 문제 ${n.checks}`,
        n.predicts && `출력 예측 ${n.predicts}`,
        n.descriptive && `서술형 ${n.descriptive}`,
        n.exercises && `실습 ${n.exercises}`,
        n.code && `코드 셀 ${n.code}`,
        n.colab && `Colab 코드 ${n.colab}`,
        n.diagrams && `그림 ${n.diagrams}`,
        n.images && `이미지 ${n.images}`,
      ].filter(Boolean);
      lines.push(`**구성:** ${parts.join(" · ")}`, "");
      if (raw.exercises?.length) lines.push("**실습**", "", ...raw.exercises.map((e) => `- \`${e.key}\` ${oneLine(e.title)}`), "");
      if (raw.descriptive?.length) lines.push("**서술형**", "", ...raw.descriptive.map((d) => `- \`${d.key}\` ${oneLine(docText(d.question, m))}`), "");
      if (raw.references?.length) lines.push("**참고 자료**", "", ...raw.references.map((r) => `- [${oneLine(r.title).replace(/[[\]]/g, "")}](${r.url})${r.note ? ` — ${oneLine(r.note)}` : ""}`), "");
    }
  }

  if (src.recall.length) lines.push("## 백지 복습", "", ...src.recall.map((r, i) => `${i + 1}. ${oneLine(docText(r.prompt, m))}`), "");

  const a = src.assignment;
  if (a) {
    lines.push(`## 과제: ${a.title}`, "", `저장 키 \`${a.key}\` · 자기 점검 · [과제 원본](${repoLink(`src/content/modules/${m.slug}/assignment.ts`)})`, "", docText(a.summary, m), "");
    lines.push("### 요구사항", "", ...a.requirements.map((v) => `- ${oneLine(docText(v, m))}`), "");
    lines.push("### 항목", "", "| 항목 | 구분 | 셀 |", "| --- | --- | --- |");
    for (const t of a.tasks) {
      const cells = t.cells.map((c) => (c.kind === "code" ? `코드 \`${c.id}\`` : `답안 \`${c.id}\`${c.minChars ? `(최소 ${c.minChars}자)` : ""}`)).join(", ");
      lines.push(`| ${cell(t.title)} | ${TIER_INFO[t.tier].label} | ${cells} |`);
    }
    lines.push("", "### 채점 기준", "", "| 기준 | 배점 | 확인 내용 |", "| --- | ---: | --- |", ...a.rubric.map((r) => `| ${cell(r.label)} | ${r.points} | ${cell(r.guide)} |`), "");
    if (a.autoTests.length) lines.push("### 자동 테스트", "", ...a.autoTests.map((t) => `- \`${t.taskId}\`: ${oneLine(t.title)}`), "");
    if (a.challenges.length) lines.push("### 선택 심화 문제", "", ...a.challenges.map((e) => `- \`${e.key}\` ${oneLine(e.title)}`), "");
  }
  emit(docFile(m), lines);
}

// ─── 전체 목차 ─────────────────────────────────────────────────────────────

const allLessons = MODULES.flatMap((m) => m.lessons);
const tierCount = (t: string, lessons = allLessons) => lessons.filter((l) => l.tier === t).length;
const requiredModules = MODULES.filter((m) => m.track !== "extension");
const coreMinutes = (m: Module) => m.lessons.filter((l) => l.tier === "core").reduce((s, l) => s + l.minutes, 0);
const hours = (min: number) => `${Math.round(min / 6) / 10}시간`;

const readme: string[] = [
  BANNER,
  `# ${COURSE.title} — 커리큘럼 목차`,
  "",
  "[문서 홈](../README.md) · [개념 색인](concept-index.md) · [집계표](coverage.md)",
  "",
  `이 과정은 트랙 ${TRACKS.length}개, 모듈 ${MODULES.length}개, 레슨 ${allLessons.length}개(핵심 ${tierCount("core")}개, 보충 ${tierCount("supplement")}개, 심화 ${tierCount("advanced")}개)로 이루어진다. 필수 경로는 확장 모듈을 뺀 ${requiredModules.length}개 모듈의 핵심 레슨이며, 예상 학습 시간은 ${hours(requiredModules.reduce((s, m) => s + coreMinutes(m), 0))}이다. 개념 ${CONCEPTS.length}개는 모두 핵심 레슨에서 다룬다.`,
  "",
  "## 수료 목표",
  "",
  ...COURSE.goals.map((g, i) => `${i + 1}. ${g.text}`),
  "",
  "## 트랙과 모듈",
  "",
];
for (const t of TRACKS) {
  const mods = modulesOfTrack(t.id);
  if (!mods.length) continue;
  readme.push(`### 트랙 ${t.code}. ${t.title}`, "", t.why, "", "| 모듈 | 핵심 | 보충 | 심화 | 핵심 레슨 시간 | 과제 |", "| --- | ---: | ---: | ---: | ---: | --- |");
  for (const m of mods) {
    readme.push(`| [${m.code} ${cell(m.title)}](${docFile(m)}) | ${tierCount("core", m.lessons)} | ${tierCount("supplement", m.lessons)} | ${tierCount("advanced", m.lessons)} | ${coreMinutes(m)}분 | ${m.assignment ? cell(m.assignment.title) : "—"} |`);
  }
  readme.push("");
}
readme.push(
  `## 기본 일정 (${SCHEDULE.length}주)`,
  "",
  "기수 일정은 운영 설정에서 정하며, 아래는 주당 4~7시간을 기준으로 한 기본값이다.",
  "",
  "| 주 | 모듈 | 권장 과제 | 캡스톤 준비 |",
  "| ---: | --- | --- | --- |",
  ...SCHEDULE.map((w) => {
    const mods = w.modules.map((slug) => MODULES.find((m) => m.slug === slug)!).map((m) => `[${m.code}](${docFile(m)})`).join(", ");
    const due = w.due.map((key) => MODULES.find((m) => m.assignment?.key === key)!.assignment!.title).map(cell).join(", ") || "—";
    return `| ${w.week} | ${mods} | ${due} | ${w.milestone ?? "—"} |`;
  }),
  "",
  "## 원본과 갱신",
  "",
  "원본은 `src/content/modules/`(모듈·레슨·실습·과제)와 `src/content/curriculum/`(트랙·개념·일정)이다. 원본을 고친 뒤 `npm run docs:generate`로 이 문서들을 다시 만들고, `npm run docs:check`로 원본과의 일치와 저장소 링크를 확인한다.",
);
emit("README.md", readme);

// ─── 개념 색인 ─────────────────────────────────────────────────────────────

emit("concept-index.md", [
  BANNER,
  "# 개념 색인",
  "",
  "[전체 목차](README.md) · [문서 홈](../README.md)",
  "",
  `개념 ${CONCEPTS.length}개와 그 개념을 다루는 레슨이다. 선수 개념은 기본 경로에서 항상 먼저 나온다(\`npm run validate:content\`가 확인한다).`,
  "",
  "| 번호 | 개념 | 트랙 | 레슨 | 선수 개념 |",
  "| ---: | --- | --- | --- | --- |",
  ...[...CONCEPTS]
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const lessons = lessonsOfConcept(c.id).map((l) => {
        const home = lessonHome.get(l.id)!;
        return `[${home.module.code} ${cell(l.title)}](${docFile(home.module)}#${lessonAnchor(l.id)})`;
      });
      const requires = c.requires.map((id) => `#${CONCEPTS.find((v) => v.id === id)!.order}`).join(", ") || "—";
      return `| ${c.order} | ${cell(c.title)} | ${TRACKS.find((t) => t.id === c.track)!.title} | ${lessons.join(" · ")} | ${requires} |`;
    }),
]);

// ─── 집계표 ────────────────────────────────────────────────────────────────

type CountKey = keyof ReturnType<typeof lessonCounts>;
const metrics: [CountKey, string][] = [
  ["checks", "확인 문제"],
  ["predicts", "출력 예측"],
  ["descriptive", "서술형"],
  ["exercises", "실습"],
  ["code", "코드 셀"],
  ["diagrams", "그림"],
  ["images", "이미지"],
];
const sum = (lessons: Lesson[], key: CountKey) => lessons.reduce((s, l) => s + lessonCounts(l)[key], 0);
emit("coverage.md", [
  BANNER,
  "# 집계표",
  "",
  "[전체 목차](README.md) · [문서 홈](../README.md)",
  "",
  "모듈별 레슨 수와 문항·실습·그림 수다. 예상 시간은 핵심 레슨의 합계다.",
  "",
  `| 모듈 | 핵심 | 보충 | 심화 | ${metrics.map(([, t]) => t).join(" | ")} | 백지 복습 | 과제 항목 | 핵심 시간 |`,
  `| --- | ${["---:", "---:", "---:", ...metrics.map(() => "---:"), "---:", "---:", "---:"].join(" | ")} |`,
  ...MODULES.map((m) => {
    const src = sourceOf.get(m.slug)!;
    return `| [${m.code}](${docFile(m)}) | ${tierCount("core", m.lessons)} | ${tierCount("supplement", m.lessons)} | ${tierCount("advanced", m.lessons)} | ${metrics.map(([k]) => sum(m.lessons, k)).join(" | ")} | ${src.recall.length} | ${src.assignment?.tasks.length ?? 0} | ${coreMinutes(m)}분 |`;
  }),
  `| 합계 | ${tierCount("core")} | ${tierCount("supplement")} | ${tierCount("advanced")} | ${metrics.map(([k]) => sum(allLessons, k)).join(" | ")} | ${MODULE_SOURCES.reduce((s, m) => s + m.recall.length, 0)} | ${MODULE_SOURCES.reduce((s, m) => s + (m.assignment?.tasks.length ?? 0), 0)} | ${MODULES.reduce((s, m) => s + coreMinutes(m), 0)}분 |`,
]);

// ─── 쓰기 또는 확인 ────────────────────────────────────────────────────────

fs.mkdirSync(OUT, { recursive: true });
let failures = 0;
for (const [name, content] of generated) {
  const target = path.join(OUT, name);
  if (CHECK) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n") !== content) {
      console.error(`원본과 다름: docs/curriculum/${name} — npm run docs:generate를 실행하십시오.`);
      failures++;
    }
  } else fs.writeFileSync(target, content);
}
for (const name of fs.readdirSync(OUT).filter((v) => v.endsWith(".md") && !generated.has(v))) {
  if (CHECK) {
    console.error(`원본에 없는 문서: docs/curriculum/${name} — npm run docs:generate를 실행하십시오.`);
    failures++;
  } else fs.unlinkSync(path.join(OUT, name));
}
if (failures) process.exitCode = 1;
else console.log(`${CHECK ? "확인" : "생성"} 완료: 문서 ${generated.size}개(모듈 ${MODULES.length}개, 레슨 ${allLessons.length}개, 개념 ${CONCEPTS.length}개)`);
