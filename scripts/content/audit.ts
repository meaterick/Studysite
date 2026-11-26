/**
 * 학습자료 평가 신호(npm run audit:content). concept-auditor 스킬(.claude/skills/concept-auditor)이 레슨을 채점할 때
 * 근거로 쓰는 수치와 검토 후보를 만든다. 점수는 매기지 않는다. 신호는 휴리스틱이므로 본문을 읽고 판단한다.
 *
 *   정확성      과잉 일반화 표현(항상·반드시·모든 경우 …)의 위치
 *   스캐폴딩    예상 시간과 상한, 소제목 수, 앞·뒤 레슨 참조, 준비 실습(ex0), 힌트 수
 *   예시        실행 코드 셀·실행 결과 블록·단계표(표)·그림·예시/직접 해 보기 콜아웃
 *   오개념 방지  주의 콜아웃, 오개념 표지 문구, 확인 문제 해설이 오답 선택지를 다루는지
 *   블룸·가독성  목표 동사의 수준, 평가 문항의 수준 분포, 정답 위치·길이 편중, 부정형 질문,
 *               문장 길이, 번역투, 높임체 문장, 영어 용어 밀도
 *
 * 코드 출력이 맞는지는 npm run check:labs, 구조와 형식은 npm run validate:content가 확인한다.
 *
 * 사용법: npm run audit:content [-- <모듈 slug | 레슨 id> ...] [--detail] [--json <파일>]
 *   --detail  레슨마다 긴 문장, 과잉 일반화 표현, 문항별 신호를 함께 출력한다.
 *   --json    전체 신호를 JSON 파일로 저장한다(스킬이 점수표를 만들 때 읽는다).
 */
import fs from "fs";
import { MODULES } from "../../src/content/course";
import type { Block, Check, Lesson, Module, TrackId } from "../../src/content/types";

// ─── 설정 ──────────────────────────────────────────────────────────────────

/** 핵심 레슨 예상 시간 상한(분). scripts/content/validate.ts와 같은 값이다. */
const MAX_CORE_MINUTES = 45;
const MAX_CORE_MINUTES_BY_TRACK: Partial<Record<TrackId, number>> = { programming: 75, math: 60, data: 60, ml: 60, dl: 60 };

/** 긴 문장 기준(공백 포함 글자 수). 2026-11-24 전체 본문에서 상위 약 5%에 해당한다. */
const LONG_SENTENCE = 120;
/** 긴 문단 기준(글자 수) */
const LONG_PARAGRAPH = 450;

export const BLOOM_LABELS = ["", "기억", "이해", "적용", "분석", "평가", "창조"] as const;

/**
 * 목표·서술형 문항의 동사로 개정 블룸 분류(Anderson & Krathwohl, 2001)의 인지 과정 수준을 추정한다.
 * 비교·해석·분류·요약·추론·설명은 "이해", 실행·구현은 "적용", 구별·조직·원인 귀속은 "분석",
 * 점검·비판은 "평가", 생성·계획·생산은 "창조"에 둔다. 위에서부터 먼저 맞는 규칙을 쓴다.
 */
const VERB_RULES: [RegExp, number][] = [
  [/(설계|고안|제안|기획|계획|창안)(하|한|할|해)/, 6],
  [/(평가|판단|검증|정당화|비판|결정|점검|권고)(하|한|할|해)|고른다|고르고|골라|선택(하|한|할|해)/, 5],
  [/(분석|진단|판별|구별|분해|귀속)(하|한|할|해)|원인을 (찾|밝|설명)|찾아낸|찾아내/, 4],
  [/(계산|적용|구현|작성|사용|실행|변환|처리|측정|추정|학습|훈련|조정|수정|코딩|구성|재현|시각화|정규화|추출|저장|불러|읽어 들)(하|한|할|해)|구하|고치|쓴다|쓰고|써서|나눈다|나누고|바꾼다|바꾸고|맞춘다|맞추고|만든다|만들고|그린다|그리고|다룬다|다루고|따라간|따라가|세운다|세우고|붙인다|붙이고|채운다|채우고|돌린다|돌리고|센다|세고|더한다|더하고/, 3],
  [/(설명|요약|해석|분류|예시|구분|서술|파악|연결|대응|비교|대조|추론|예측)(하|한|할|해)|읽는다|읽고|말한다|말하고|예를 든/, 2],
  [/(나열|열거|암기|정의|기억|인식|확인|이해)(하|한|할|해)|안다|알고|알 수 있/, 1],
];

/** 측정할 수 없는 목표 동사(Mager의 행동 목표 기준) */
const VAGUE_GOAL = /(이해|인식|숙지|체득)(한다|할 수 있다)|(안다|알게 된다|익숙해진다)[.]?$/;

function verbLevels(text: string): number[] {
  // 동사가 여러 개인 문장을 쉼표·연결 어미 기준으로 나눠 각각 수준을 매긴다.
  const parts = text.split(/,|·|하고 |하며 |고 |며 |한 뒤 |해서 /);
  const levels: number[] = [];
  for (const part of parts) {
    for (const [re, level] of VERB_RULES) {
      if (re.test(part)) {
        levels.push(level);
        break;
      }
    }
  }
  return levels;
}

/** 객관식 질문의 인지 수준(휴리스틱). 정답과 해설을 읽고 최종 판단한다. */
function checkLevel(c: Check): number {
  const q = c.question;
  if (/(설계|구성)하려면|만들려면/.test(q)) return 6;
  // 상황을 주고 행동·설정을 고르게 하는 질문은 평가. "이유로 가장 알맞은 것"은 이해다.
  const decision = /(적절|알맞|타당|좋|나|효과적)[은는인]? (방법|선택|조치|대응|설정|모델|지표|전략|도구|순서|다음 단계|도구 호출|구성|기준)|어느 [가-힣]+(을|를)? (써야|택해야|골라야|선택해야)|판단(하|은|으로)|평가하(라|면|는)|바람직한|우선해야/;
  if (decision.test(q) && !/이유로|까닭으로|설명으로|해석으로/.test(q)) return 5;
  if (/원인|진단|문제(점|는|가)|잘못(된|은|이)|어디(에서|가|를)|무엇 때문|버그|실패하는 이유|의심/.test(q)) return 4;
  if (/```|출력(은|이|되는|결과)|결과(는|가)|값(은|이|을|과)|계산|몇 |몇개|몇 개|얼마|구하|모양(은|이)|크기(는|가)/.test(q)) return 3;
  if (/\d/.test(q) && /\$|`/.test(q)) return 3;
  if (/무엇이라 (하|부르)|이름(은|이)|용어(는|가)|정의(는|로)|약자/.test(q)) return 1;
  return 2;
}

const NEGATIVE_STEM = /(아닌|틀린|옳지 않은|잘못된|적절하지 않은|알맞지 않은|거리가 먼|해당하지 않는) (것|설명|선택지|예|경우)/;
const ALL_OR_NONE = /^(모두|위의 (모두|모든)|전부|해당 없음|없음|모두 (옳|맞|틀))/;
const OVERCLAIM = /항상|반드시|절대로|절대 |결코|언제나|무조건|모든 경우|예외 없이|어떤 경우에도/g;
const MISCONCEPTION_CUE = /흔한 (실수|오해)|오해(하|를|가|이|다|한)|혼동|착각|헷갈|틀리기 쉽|잘못 (이해|생각|읽|해석)|주의(한다|할|해야)|반례|함정/g;
const CONTRAST = /[가-힣A-Za-z0-9)\]]+(이|가) 아니라 /g;
const TRANSLATIONESE = /에 있어서|에 있어 |에 대해서|을 통해서|를 통해서|로 인해서|하는 것이 가능하|할 필요가 있|을 가지고 있|를 가지고 있|되어지|되어진|에 의해 [가-힣]+되/g;
const NOMINAL_CHAIN = /[가-힣]+의 [가-힣]+의 [가-힣]+의 /g;
const POLITE_ENDING = /(습니다|입니다|해요|세요|까요)[.?!]?$/;
const GLOSS = /[가-힣]+\s?\([A-Za-z][A-Za-z .,'/-]{1,40}\)/g;
const ENGLISH_WORD = /\b[A-Za-z][A-Za-z-]{2,}\b/g;

// ─── 본문 추출 ─────────────────────────────────────────────────────────────

function plainInline(text: string): string {
  return text
    .replace(/\[\[lesson:[a-z0-9-]+(?:\|([^\]\n]+))?\]\]/g, (_, label: string | undefined) => label ?? "레슨")
    .replace(/\$[^$\n]+\$/g, "X")
    .replace(/`[^`]+`/g, "C")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface Prose {
  paragraphs: string[];
  items: string[];
}

function collectProse(blocks: Block[], out: Prose = { paragraphs: [], items: [] }): Prose {
  for (const b of blocks) {
    if (b.type === "paragraph") out.paragraphs.push(plainInline(b.text));
    else if (b.type === "list") out.items.push(...b.items.map(plainInline));
    else if (b.type === "callout") collectProse(b.blocks, out);
  }
  return out;
}

function splitSentences(text: string): string[] {
  const guarded = text.replace(/\b(et al|e\.g|i\.e|vs|cf|Fig|Eq|No)\./g, (m) => m.replace(".", "⁣"));
  return guarded
    .split(/(?<=[.?!])\s+(?=\S)/)
    .map((s) => s.replace(/⁣/g, ".").trim())
    .filter((s) => s.length > 1);
}

function countBlocks(blocks: Block[], pred: (b: Block) => boolean): number {
  let n = 0;
  for (const b of blocks) {
    if (pred(b)) n++;
    if (b.type === "callout") n += countBlocks(b.blocks, pred);
  }
  return n;
}

function contexts(text: string, re: RegExp, radius = 28): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    found.push(text.slice(Math.max(0, i - radius), i + m[0].length + radius).trim());
  }
  return found;
}

const percentile = (xs: number[], p: number) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

// ─── 레슨 신호 ─────────────────────────────────────────────────────────────

interface CheckSignal {
  key: string;
  level: number;
  answer: number;
  negativeStem: boolean;
  allOrNone: boolean;
  correctLongest: boolean;
  explanationChars: number;
  /** 해설이 오답 선택지를 직접 언급하거나 왜 틀렸는지 다루는가 */
  addressesDistractors: boolean;
}

export interface LessonSignals {
  module: string;
  moduleTitle: string;
  id: string;
  title: string;
  tier: string;
  minutes: number;
  maxMinutes: number | null;
  proseChars: number;
  sentences: number;
  avgSentence: number;
  p90Sentence: number;
  longSentenceRate: number;
  longSentences: string[];
  longParagraphs: number;
  headings: number;
  pythonCells: number;
  outputBlocks: number;
  tables: number;
  mathBlocks: number;
  figures: number;
  callouts: Record<string, number>;
  exampleCues: number;
  backwardRefs: number;
  forwardRefs: number;
  warnCallouts: number;
  misconceptionCues: number;
  contrasts: number;
  overclaims: string[];
  translationese: string[];
  nominalChains: number;
  politeSentences: string[];
  englishPer1k: number;
  glosses: number;
  goalLevels: number[];
  goalVague: boolean;
  itemLevels: number[];
  checks: CheckSignal[];
  exercises: number;
  warmup: boolean;
  minHints: number;
  predicts: number;
  descriptive: number;
  flags: string[];
}

function lessonOrder(): Map<string, number> {
  const order = new Map<string, number>();
  MODULES.forEach((m, mi) => m.lessons.forEach((l) => order.set(l.id, mi * 1000 + l.order)));
  return order;
}
const ORDER = lessonOrder();

function analyseCheck(c: Check): CheckSignal {
  const lengths = c.choices.map((x) => x.length);
  const correct = lengths[c.answer] ?? 0;
  const correctLongest = lengths.every((len, i) => i === c.answer || len < correct);
  const exp = c.explanation;
  const wrong = c.choices.filter((_, i) => i !== c.answer);
  // 오답 선택지의 6글자 이상 조각이 해설에 나오거나, 해설이 오답을 직접 다루는 표현을 쓰는지 본다.
  const mentionsWrong = wrong.some((w) => {
    const plain = plainInline(w).replace(/[.。]$/, "");
    if (plain.length < 6) return exp.includes(plain) && plain.length >= 2;
    for (let i = 0; i + 6 <= plain.length; i += 2) if (exp.includes(plain.slice(i, i + 6))) return true;
    return false;
  });
  // 오답에만 나오는 3글자 이상 낱말(질문·정답에 없는 것)이 해설에 나오면 그 오답을 다룬 것으로 본다.
  const words = (s: string) => new Set(plainInline(s).match(/[가-힣A-Za-z0-9_]{3,}/g) ?? []);
  const shared = new Set([...words(c.question), ...words(c.choices[c.answer] ?? "")]);
  const wrongOnly = wrong.flatMap((w) => [...words(w)]).filter((w) => !shared.has(w));
  const mentionsWrongWord = wrongOnly.some((w) => exp.includes(w));
  const addresses = mentionsWrong || mentionsWrongWord || /오답|다른 선택지|나머지 선택지|틀린 이유|아니다|아니라|않는다|않다|다르다/.test(exp);
  return {
    key: c.key,
    level: checkLevel(c),
    answer: c.answer,
    negativeStem: NEGATIVE_STEM.test(c.question),
    allOrNone: c.choices.some((x) => ALL_OR_NONE.test(x.trim())),
    correctLongest,
    explanationChars: exp.length,
    addressesDistractors: addresses,
  };
}

function analyseLesson(lesson: Lesson, mod: Module): LessonSignals {
  const prose = collectProse(lesson.learn);
  const proseText = [...prose.paragraphs, ...prose.items].join(" ");
  const sentenceList = prose.paragraphs.flatMap(splitSentences);
  const lengths = sentenceList.map((s) => s.length);
  const long = sentenceList.filter((s) => s.length > LONG_SENTENCE).sort((a, b) => b.length - a.length);

  const callouts: Record<string, number> = {};
  for (const b of lesson.learn) if (b.type === "callout") callouts[b.tone] = (callouts[b.tone] ?? 0) + 1;

  const self = ORDER.get(lesson.id) ?? 0;
  let backwardRefs = 0;
  let forwardRefs = 0;
  const allText = [lesson.why, lesson.body].join("\n");
  for (const m of allText.matchAll(/\[\[lesson:([a-z0-9-]+)/g)) {
    const target = ORDER.get(m[1]);
    if (target === undefined || m[1] === lesson.id) continue;
    if (target < self) backwardRefs++;
    else forwardRefs++;
  }

  const checks = lesson.checks.map(analyseCheck);
  const itemLevels = [
    ...checks.map((c) => c.level),
    ...(lesson.predicts ?? []).map(() => 3),
    ...(lesson.exercises ?? []).map((e) => (/(설계|직접 정해|스스로 정해)/.test(e.prompt) ? 6 : 3)),
    ...(lesson.descriptive ?? []).map((d) => Math.max(2, ...verbLevels(d.question))),
  ];
  const goalLevels = verbLevels(lesson.goal);
  const maxMinutes = lesson.tier === "core" ? (MAX_CORE_MINUTES_BY_TRACK[mod.track] ?? MAX_CORE_MINUTES) : null;
  const englishWords = proseText.match(ENGLISH_WORD)?.length ?? 0;

  const s: LessonSignals = {
    module: mod.slug,
    moduleTitle: `${mod.code} ${mod.title}`,
    id: lesson.id,
    title: lesson.title,
    tier: lesson.tier,
    minutes: lesson.minutes,
    maxMinutes,
    proseChars: proseText.length,
    sentences: sentenceList.length,
    avgSentence: lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0,
    p90Sentence: percentile(lengths, 90),
    longSentenceRate: lengths.length ? long.length / lengths.length : 0,
    longSentences: long.slice(0, 5),
    longParagraphs: prose.paragraphs.filter((p) => p.length > LONG_PARAGRAPH).length,
    headings: countBlocks(lesson.learn, (b) => b.type === "heading"),
    pythonCells: countBlocks(lesson.learn, (b) => b.type === "code" && (b.lang === "python" || b.lang === "py")),
    outputBlocks: countBlocks(lesson.learn, (b) => b.type === "code" && b.lang === "output"),
    tables: countBlocks(lesson.learn, (b) => b.type === "table"),
    mathBlocks: countBlocks(lesson.learn, (b) => b.type === "math" || b.type === "formula"),
    figures: countBlocks(lesson.learn, (b) => b.type === "diagram" || b.type === "image"),
    callouts,
    exampleCues: proseText.match(/예를 들어|예컨대|예를 들면|예:/g)?.length ?? 0,
    backwardRefs,
    forwardRefs,
    warnCallouts: callouts.warn ?? 0,
    misconceptionCues: proseText.match(MISCONCEPTION_CUE)?.length ?? 0,
    contrasts: proseText.match(CONTRAST)?.length ?? 0,
    overclaims: contexts(proseText, OVERCLAIM),
    translationese: contexts(proseText, TRANSLATIONESE, 20),
    nominalChains: proseText.match(NOMINAL_CHAIN)?.length ?? 0,
    politeSentences: sentenceList.filter((x) => POLITE_ENDING.test(x)),
    englishPer1k: proseText.length ? Math.round((englishWords / proseText.length) * 1000 * 10) / 10 : 0,
    glosses: proseText.match(GLOSS)?.length ?? 0,
    goalLevels,
    goalVague: VAGUE_GOAL.test(lesson.goal.trim()),
    itemLevels,
    checks,
    exercises: lesson.exercises?.length ?? 0,
    warmup: (lesson.exercises ?? []).some((e) => e.key === "ex0"),
    minHints: Math.min(...(lesson.exercises ?? []).map((e) => e.hints.length), Infinity),
    predicts: lesson.predicts?.length ?? 0,
    descriptive: lesson.descriptive?.length ?? 0,
    flags: [],
  };
  if (!Number.isFinite(s.minHints)) s.minHints = 0;
  s.flags = flagsOf(s);
  return s;
}

function flagsOf(s: LessonSignals): string[] {
  const f: string[] = [];
  const goalMax = Math.max(0, ...s.goalLevels);
  const itemMax = Math.max(0, ...s.itemLevels);
  if (s.goalLevels.length === 0) f.push("목표 동사 미검출");
  if (s.goalVague) f.push("측정 불가 목표 동사");
  if (goalMax >= 4 && itemMax < goalMax) f.push(`평가<목표(${BLOOM_LABELS[itemMax]}<${BLOOM_LABELS[goalMax]})`);
  if (s.tier === "core" && !s.itemLevels.some((l) => l >= 3)) f.push("적용 이상 문항 없음");
  if (s.maxMinutes && s.minutes > s.maxMinutes) f.push(`시간 초과 ${s.minutes}/${s.maxMinutes}분`);
  if (s.maxMinutes && s.minutes > s.maxMinutes - 5) f.push("시간 여유 5분 미만");
  if (s.longSentenceRate > 0.12) f.push(`긴 문장 ${Math.round(s.longSentenceRate * 100)}%`);
  if (s.longParagraphs > 0) f.push(`긴 문단 ${s.longParagraphs}`);
  if (s.overclaims.length >= 3) f.push(`과잉 일반화 후보 ${s.overclaims.length}`);
  if (s.warnCallouts === 0 && s.misconceptionCues + s.contrasts < 2) f.push("오개념 대응 신호 약함");
  if (s.pythonCells + s.tables + s.mathBlocks + s.figures === 0) f.push("예시 블록 없음");
  if (s.politeSentences.length > 0) f.push(`높임체 ${s.politeSentences.length}`);
  if (s.translationese.length >= 3) f.push(`번역투 ${s.translationese.length}`);
  const longest = s.checks.filter((c) => c.correctLongest).length;
  if (s.checks.length >= 3 && longest / s.checks.length >= 0.6) f.push(`정답이 가장 긴 선택지 ${longest}/${s.checks.length}`);
  const neg = s.checks.filter((c) => c.negativeStem).length;
  if (neg > 0) f.push(`부정형 질문 ${neg}`);
  if (s.checks.some((c) => c.allOrNone)) f.push("모두/해당 없음 선택지");
  const shallow = s.checks.filter((c) => !c.addressesDistractors).length;
  if (s.checks.length > 0 && shallow / s.checks.length > 0.5) f.push(`오답 미해설 ${shallow}/${s.checks.length}`);
  return f;
}

// ─── 출력 ──────────────────────────────────────────────────────────────────

function args() {
  const argv = process.argv.slice(2);
  const detail = argv.includes("--detail");
  const jsonAt = argv.indexOf("--json");
  const jsonPath = jsonAt >= 0 ? argv[jsonAt + 1] : undefined;
  const targets = argv.filter((a, i) => !a.startsWith("--") && !(jsonAt >= 0 && i === jsonAt + 1));
  return { detail, jsonPath, targets };
}

function bloomSummary(levels: number[]): string {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const l of levels) counts[l]++;
  return counts.slice(1).join("/");
}

function main() {
  const { detail, jsonPath, targets } = args();
  const lessonIds = new Set(MODULES.flatMap((m) => m.lessons.map((l) => l.id)));
  for (const t of targets) {
    if (!lessonIds.has(t) && !MODULES.some((m) => m.slug === t)) {
      console.error(`"${t}"은(는) 모듈 slug도 레슨 id도 아닙니다.`);
      process.exit(2);
    }
  }
  const selected = MODULES.flatMap((m) =>
    m.lessons.filter((l) => targets.length === 0 || targets.includes(m.slug) || targets.includes(l.id)).map((l) => analyseLesson(l, m)),
  );

  const out: string[] = [];
  out.push("# 학습자료 평가 신호", "");
  out.push(`레슨 ${selected.length}개. 블룸 분포는 기억/이해/적용/분석/평가/창조 순서의 문항 수(확인 문제·출력 예측·실습·서술형)다. 신호는 휴리스틱이므로 본문을 읽고 판단한다.`, "");

  const byModule = new Map<string, LessonSignals[]>();
  for (const s of selected) byModule.set(s.moduleTitle, [...(byModule.get(s.moduleTitle) ?? []), s]);
  for (const [title, rows] of byModule) {
    const mod = MODULES.find((m) => m.slug === rows[0].module)!;
    const allChecks = mod.lessons.flatMap((l) => l.checks);
    const pos = [0, 0, 0, 0, 0];
    for (const c of allChecks) pos[Math.min(4, c.answer)]++;
    const longest = allChecks.filter((c) => analyseCheck(c).correctLongest).length;
    out.push(`## ${title}`, "");
    out.push(`확인 문제 ${allChecks.length}개 · 정답 위치(1~5번) ${pos.join("/")} · 정답이 가장 긴 선택지 ${longest}개(${allChecks.length ? Math.round((longest / allChecks.length) * 100) : 0}%)`, "");
    out.push("| 레슨 | 구분 | 시간 | 본문 | 문장 평균/p90 | 코드·출력·표·그림 | 주의·표지·대조 | 목표 블룸 | 문항 블룸 | 신호 |");
    out.push("| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |");
    for (const s of rows) {
      const goal = s.goalLevels.length ? BLOOM_LABELS[Math.max(...s.goalLevels)] : "-";
      out.push(
        `| ${s.id} | ${s.tier} | ${s.minutes}${s.maxMinutes ? `/${s.maxMinutes}` : ""} | ${s.proseChars} | ${s.avgSentence}/${s.p90Sentence} | ${s.pythonCells}·${s.outputBlocks}·${s.tables}·${s.figures} | ${s.warnCallouts}·${s.misconceptionCues}·${s.contrasts} | ${goal} | ${bloomSummary(s.itemLevels)} | ${s.flags.join(", ") || "-"} |`,
      );
    }
    out.push("");
    if (detail) {
      for (const s of rows) {
        out.push(`### ${s.id} — ${s.title}`, "");
        out.push(`- 목표 동사 수준: ${s.goalLevels.map((l) => BLOOM_LABELS[l]).join(", ") || "미검출"}${s.goalVague ? " (측정 불가 동사 포함)" : ""}`);
        out.push(`- 레슨 참조: 앞 ${s.backwardRefs} · 뒤 ${s.forwardRefs}, 실습 ${s.exercises}(준비 실습 ${s.warmup ? "있음" : "없음"}, 최소 힌트 ${s.minHints}), 출력 예측 ${s.predicts}, 서술형 ${s.descriptive}`);
        out.push(`- 콜아웃: ${Object.entries(s.callouts).map(([k, v]) => `${k} ${v}`).join(", ") || "없음"} · 영어 단어 ${s.englishPer1k}/1000자 · 병기 ${s.glosses}`);
        if (s.overclaims.length) out.push(`- 과잉 일반화 후보: ${s.overclaims.map((x) => `「${x}」`).join(" ")}`);
        if (s.translationese.length) out.push(`- 번역투 후보: ${s.translationese.map((x) => `「${x}」`).join(" ")}`);
        if (s.politeSentences.length) out.push(`- 높임체 문장: ${s.politeSentences.map((x) => `「${x}」`).join(" ")}`);
        for (const x of s.longSentences) out.push(`- 긴 문장(${x.length}자): ${x}`);
        for (const c of s.checks) {
          const marks = [
            BLOOM_LABELS[c.level],
            `정답 ${c.answer + 1}번`,
            c.correctLongest ? "정답 최장" : "",
            c.negativeStem ? "부정형" : "",
            c.allOrNone ? "모두/없음" : "",
            c.addressesDistractors ? "" : "오답 미해설",
            `해설 ${c.explanationChars}자`,
          ].filter(Boolean);
          out.push(`- 문항 ${c.key}: ${marks.join(" · ")}`);
        }
        out.push("");
      }
    }
  }

  const all = selected;
  const sentenceAvg = Math.round(all.reduce((a, s) => a + s.avgSentence, 0) / Math.max(1, all.length));
  out.push("## 전체", "");
  out.push(`- 레슨 ${all.length}개, 평균 문장 길이 ${sentenceAvg}자, 긴 문장(>${LONG_SENTENCE}자) 비율 평균 ${Math.round((all.reduce((a, s) => a + s.longSentenceRate, 0) / Math.max(1, all.length)) * 100)}%`);
  out.push(`- 주의 콜아웃이 없는 레슨 ${all.filter((s) => s.warnCallouts === 0).length}개, 오개념 대응 신호가 약한 레슨 ${all.filter((s) => s.flags.includes("오개념 대응 신호 약함")).length}개`);
  out.push(`- 문항 블룸 분포 합계(기억/이해/적용/분석/평가/창조): ${bloomSummary(all.flatMap((s) => s.itemLevels))}`);
  console.log(out.join("\n"));

  if (jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify(selected, null, 2));
    console.error(`JSON 저장: ${jsonPath}`);
  }
}

main();
