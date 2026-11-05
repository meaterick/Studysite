import type { Block, Lesson, LessonSource, Module, ModuleSource, TrackId } from "./types";
import { TIER_ORDER } from "./tiers";
import { parseMarkdown } from "./markdown";
import { TRACKS, getTrack } from "./curriculum/tracks";
import { CONCEPTS, getConcept } from "./curriculum/concepts";
import { MODULE_SOURCES } from "./modules";
import { lessonHref } from "../lib/routes";

// 콘텐츠 원본(src/content/modules)을 화면과 서버 로직이 쓰는 구조로 바꾸고 조회 함수를 제공한다.
// 콘텐츠는 빌드에 포함된 상수라 결과를 프로세스 수명 동안 한 번만 계산한다.

export const COURSE = {
  title: "AI 기초부터 활용까지",
  /** 수료하면 할 수 있는 것(맨 윗단위 목표). 각 목표가 어느 트랙에서 다뤄지는지 함께 둔다. */
  goals: [
    { text: "파이썬으로 데이터를 읽고 정리하고 분석하는 코드를 재현 가능하게 작성한다.", tracks: ["programming", "data"] as TrackId[] },
    { text: "모델·손실·학습을 함수·벡터·미분·확률·통계의 언어로 설명하고 손으로 계산한다.", tracks: ["math"] as TrackId[] },
    { text: "머신러닝 문제를 데이터 누수 없이 설계하고, 기준 모델과 알맞은 지표로 결과를 판단한다.", tracks: ["ml"] as TrackId[] },
    { text: "신경망·역전파·셀프 어텐션을 직접 구현하고, 학습이 실패하는 원인을 진단한다.", tracks: ["dl", "genai"] as TrackId[] },
    { text: "LLM의 학습·생성 과정과 한계를 설명하고, RAG·도구·에이전트 시스템을 만들어 평가·운영 지표로 검증한다.", tracks: ["genai"] as TrackId[] },
    { text: "자신의 프로젝트에서 위험을 점검하고 결과를 모델카드와 보고서로 정리한다.", tracks: ["capstone"] as TrackId[] },
  ],
};

const READ_CHARS_PER_MINUTE = 450;

function blockTextLength(block: Block): number {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "callout":
      return block.text.length;
    case "list":
      return block.items.join(" ").length;
    case "table":
      return [...block.headers, ...block.rows.flat()].join(" ").length;
    case "math":
      return block.tex.length / 2;
    case "formula":
      return block.code.length / 2;
    default:
      return 0;
  }
}

/** 본문 분량·코드 셀·그림·문항 수로 예상 학습 시간을 계산한다(5분 단위, 최소 10분). */
function estimateMinutes(blocks: Block[], lesson: LessonSource): number {
  const chars = blocks.reduce((sum, b) => sum + blockTextLength(b), 0);
  const codeCells = blocks.filter((b) => b.type === "code" && (b.lang === "python" || b.lang === "py")).length;
  const figures = blocks.filter((b) => b.type === "diagram" || b.type === "image").length;
  const raw =
    chars / READ_CHARS_PER_MINUTE +
    codeCells * 3 +
    figures * 1.5 +
    lesson.checks.length +
    (lesson.exercises?.length ?? 0) * 8 +
    (lesson.predicts?.length ?? 0) * 2 +
    (lesson.descriptive?.length ?? 0) * 4;
  return Math.max(10, Math.round(raw / 5) * 5);
}

// ─── 레슨 참조 ────────────────────────────────────────────────────────────
// 본문에는 다른 레슨을 [[lesson:<id>]] 또는 [[lesson:<id>|표시할 글]]로 가리킨다. 빌드할 때 "모듈 번호 + 레슨 제목"
// 링크로 바꾸므로, 레슨이 다른 모듈로 옮겨 가도 본문을 고칠 필요가 없다. 없는 id는 그대로 두고 검증 스크립트가 잡는다.
export const LESSON_REF = /\[\[lesson:([a-z0-9-]+)(?:\|([^\]\n]+))?\]\]/g;

type RefTable = Map<string, { href: string; label: string }>;

function refTable(sources: ModuleSource[]): RefTable {
  const table: RefTable = new Map();
  for (const m of sources) {
    const code = `${getTrack(m.track).code}-${m.order}`;
    for (const l of m.lessons) table.set(l.id, { href: lessonHref(m.slug, l.id), label: `${code} ${l.title}` });
  }
  return table;
}

function resolveRefs(text: string, table: RefTable): string {
  return text.replace(LESSON_REF, (whole, id: string, custom?: string) => {
    const ref = table.get(id);
    return ref ? `[${custom ?? ref.label}](${ref.href})` : whole;
  });
}

/** 레슨의 글 필드 전부에 같은 변환을 적용한다. */
function mapLessonText(l: LessonSource, f: (text: string) => string): LessonSource {
  return {
    ...l,
    goal: f(l.goal),
    why: f(l.why),
    body: f(l.body),
    checks: l.checks.map((c) => ({ ...c, question: f(c.question), choices: c.choices.map(f), explanation: f(c.explanation) })),
    exercises: l.exercises?.map((e) => ({ ...e, prompt: f(e.prompt), hints: e.hints.map(f) })),
    predicts: l.predicts?.map((p) => ({ ...p, question: p.question && f(p.question), explanation: f(p.explanation) })),
    descriptive: l.descriptive?.map((d) => ({ ...d, question: f(d.question), answer: f(d.answer), keyPoints: d.keyPoints.map(f) })),
  };
}

function mapModuleText(m: ModuleSource, f: (text: string) => string): ModuleSource {
  return {
    ...m,
    anchor: f(m.anchor),
    recall: m.recall.map((r) => ({ prompt: f(r.prompt), hint: r.hint && f(r.hint) })),
    lessons: m.lessons.map((l) => mapLessonText(l, f)),
    assignment: m.assignment && {
      ...m.assignment,
      summary: f(m.assignment.summary),
      tasks: m.assignment.tasks.map((t) => ({ ...t, instructions: f(t.instructions) })),
      challenges: m.assignment.challenges.map((e) => ({ ...e, prompt: f(e.prompt), hints: e.hints.map(f) })),
    },
  };
}

function buildModules(sources: ModuleSource[]): Module[] {
  const trackIndex = new Map(TRACKS.map((t, i) => [t.id, i]));
  const table = refTable(sources);
  const sorted = [...sources]
    .sort((a, b) => trackIndex.get(a.track)! - trackIndex.get(b.track)! || a.order - b.order)
    .map((m) => mapModuleText(m, (text) => resolveRefs(text, table)));
  return sorted.map((source) => {
    const trackInfo = getTrack(source.track);
    const ordered = TIER_ORDER.flatMap((tier) => source.lessons.filter((l) => l.tier === tier));
    const tierCount: Record<string, number> = {};
    const lessons: Lesson[] = ordered.map((l, i) => {
      tierCount[l.tier] = (tierCount[l.tier] ?? 0) + 1;
      const learn = parseMarkdown(l.body);
      return { ...l, module: source.slug, number: tierCount[l.tier], order: i + 1, learn, minutes: estimateMinutes(learn, l) };
    });
    return { ...source, code: `${trackInfo.code}-${source.order}`, trackInfo, lessons };
  });
}

export const MODULES: Module[] = buildModules(MODULE_SOURCES);

const MODULE_BY_SLUG = new Map(MODULES.map((m) => [m.slug, m]));
const LESSON_BY_ID = new Map(MODULES.flatMap((m) => m.lessons.map((l) => [l.id, l] as const)));

export function getModule(slug: string): Module | undefined {
  return MODULE_BY_SLUG.get(slug);
}

export function getLesson(id: string): Lesson | undefined {
  return LESSON_BY_ID.get(id);
}

/** 모듈 안의 레슨(없으면 undefined): URL의 모듈과 레슨이 맞지 않는 주소를 막는다. */
export function getModuleLesson(moduleSlug: string, lessonId: string): { module: Module; lesson: Lesson } | undefined {
  const mod = getModule(moduleSlug);
  const lesson = getLesson(lessonId);
  return mod && lesson && lesson.module === mod.slug ? { module: mod, lesson } : undefined;
}

export function modulesOfTrack(track: TrackId): Module[] {
  return MODULES.filter((m) => m.track === track);
}

/** 필수 경로: 확장 모듈을 뺀 모든 모듈의 핵심 레슨을 기본 순서대로 */
export const CORE_PATH: Lesson[] = MODULES.filter((m) => m.track !== "extension").flatMap((m) => m.lessons.filter((l) => l.tier === "core"));
const PATH_INDEX = new Map(CORE_PATH.map((l, i) => [l.id, i]));

export function pathIndex(lessonId: string): number | undefined {
  return PATH_INDEX.get(lessonId);
}

/** 개념을 다루는 핵심 레슨(기본 순서) */
export function lessonsOfConcept(conceptId: string): Lesson[] {
  return CORE_PATH.filter((l) => l.concepts?.includes(conceptId));
}

/**
 * 레슨을 시작하기 전에 마쳐 두어야 하는 레슨: 레슨이 다루는 개념의 필수 선수 개념을 다루는 핵심 레슨과,
 * requires로 적은 레슨. 같은 개념을 여러 레슨으로 나눈 경우 앞 레슨도 포함한다.
 */
function computePrerequisites(lesson: Lesson): Lesson[] {
  const ids = new Set<string>(lesson.requires ?? []);
  for (const c of lesson.concepts ?? []) {
    for (const req of getConcept(c)?.requires ?? []) for (const l of lessonsOfConcept(req)) ids.add(l.id);
    for (const l of lessonsOfConcept(c)) if ((PATH_INDEX.get(l.id) ?? 0) < (PATH_INDEX.get(lesson.id) ?? 0)) ids.add(l.id);
  }
  ids.delete(lesson.id);
  return [...ids].map((id) => LESSON_BY_ID.get(id)).filter((l): l is Lesson => !!l).sort((a, b) => (PATH_INDEX.get(a.id) ?? 0) - (PATH_INDEX.get(b.id) ?? 0));
}

const PREREQS = new Map(MODULES.flatMap((m) => m.lessons.map((l) => [l.id, computePrerequisites(l)] as const)));

/** 선수 레슨(기본 순서). 보충·심화 레슨은 같은 모듈의 핵심 레슨을 선수로 갖는다. */
export function prerequisitesOf(lesson: Lesson): Lesson[] {
  if (lesson.tier !== "core" && !lesson.concepts?.length) {
    return getModule(lesson.module)!.lessons.filter((l) => l.tier === "core");
  }
  return PREREQS.get(lesson.id) ?? [];
}

/** 직접 선수 레슨만(선수의 선수는 빼고): 화면에 "먼저 볼 레슨"으로 보여 준다. */
export function directPrerequisitesOf(lesson: Lesson): Lesson[] {
  const all = prerequisitesOf(lesson);
  const indirect = new Set(all.flatMap((p) => prerequisitesOf(p).map((x) => x.id)));
  return all.filter((p) => !indirect.has(p.id));
}

const DEPENDENTS = (() => {
  const map = new Map<string, Lesson[]>();
  for (const l of CORE_PATH) for (const p of directPrerequisitesOf(l)) {
    const list = map.get(p.id) ?? [];
    list.push(l);
    map.set(p.id, list);
  }
  return map;
})();

/** 이 레슨을 직접 선수로 쓰는 뒤쪽 핵심 레슨("다시 만나는 곳") */
export function dependentsOf(lesson: Lesson): Lesson[] {
  return DEPENDENTS.get(lesson.id) ?? [];
}

/** 이 레슨이 다루는 개념(표시 번호 순) */
export function conceptsOf(lesson: Lesson) {
  return (lesson.concepts ?? []).map((c) => getConcept(c)).filter((c) => !!c).sort((a, b) => a!.order - b!.order);
}

export { CONCEPTS, TRACKS, getConcept, getTrack };

// ─── 문항·실습의 전역 id ─────────────────────────────────────────────────

export const itemId = (lessonId: string, key: string) => `${lessonId}/${key}`;

/** 전역 실습 id("레슨id/키" 또는 "과제키/키") → 레슨 실습 또는 과제 심화 문제 */
export function findExercise(id: string) {
  const [owner, key] = id.split("/");
  const lesson = LESSON_BY_ID.get(owner);
  if (lesson) {
    const exercise = lesson.exercises?.find((e) => e.key === key);
    return exercise ? { exercise, lesson, module: getModule(lesson.module)!, challenge: false as const } : undefined;
  }
  const mod = MODULES.find((m) => m.assignment?.key === owner);
  const exercise = mod?.assignment?.challenges.find((e) => e.key === key);
  return mod && exercise ? { exercise, module: mod, challenge: true as const } : undefined;
}

/** 과제 저장 키 → 모듈 */
export function moduleOfAssignment(key: string): Module | undefined {
  return MODULES.find((m) => m.assignment?.key === key);
}

/**
 * RAG 과제에서 코드가 읽는 학습 자료 파일: 모듈마다 /course/<모듈 slug>.md 하나(확장 모듈 제외).
 * 파일 안에는 모듈 제목과 레슨별 제목·본문이 들어 있다. 과제 작업 공간과 실습 검사 스크립트가 같이 쓴다.
 */
export function courseDocuments(): { path: string; content: string }[] {
  return MODULES.filter((m) => m.track !== "extension").map((m) => ({
    path: `/course/${m.slug}.md`,
    content: [`# ${m.code} ${m.title}`, "", ...m.lessons.flatMap((l) => [`## ${l.title}`, "", l.body.trim(), ""])].join("\n"),
  }));
}

/** 이 과정의 과제 저장 키 전부(모듈 순서). 이전 과정의 제출물을 집계에서 빼는 데 쓴다. */
export const ASSIGNMENT_KEYS: string[] = MODULES.flatMap((m) => (m.assignment ? [m.assignment.key] : []));
