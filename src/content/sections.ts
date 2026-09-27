import type { Block, WeekMeta, WeekSection } from "./types";
import { parseMarkdown } from "./markdown";

// 한 주차의 학습 자료(conceptsMd)를 "단계" 단위로 나눈다.
//   - `## 제목 {#id}` 하나가 단계 하나다. id는 진도 저장 키이므로 한 번 정하면 바꾸지 않는다.
//   - 첫 `##` 앞의 블록은 주차 도입부(intro)로 개요 화면에 보여준다.
//   - 단계 안의 `[[practice]]` 뒤 블록은 "실습" 단계, 앞은 "학습" 단계다.
// 콘텐츠는 빌드에 포함된 상수라 결과를 프로세스 수명 동안 캐시한다.

export interface WeekOutline {
  intro: Block[];
  sections: WeekSection[];
}

const cache = new Map<string, WeekOutline>();

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

function estimateMinutes(blocks: Block[], checks: number, quizzes: number): number {
  const chars = blocks.reduce((sum, b) => sum + blockTextLength(b), 0);
  const codeCells = blocks.filter((b) => b.type === "code" && (b.lang === "python" || b.lang === "py")).length;
  const figures = blocks.filter((b) => b.type === "diagram" || b.type === "image").length;
  const raw = chars / READ_CHARS_PER_MINUTE + codeCells * 4 + figures * 1.5 + checks * 1 + quizzes * 4;
  return Math.max(10, Math.round(raw / 5) * 5);
}

export function getWeekOutline(week: WeekMeta): WeekOutline {
  const cached = cache.get(week.slug);
  if (cached) return cached;

  const blocks = parseMarkdown(week.conceptsMd);
  const intro: Block[] = [];
  const raw: { id: string; title: string; blocks: Block[] }[] = [];

  for (const block of blocks) {
    if (block.type === "heading" && block.level === 2) {
      raw.push({ id: block.id ?? `section-${raw.length + 1}`, title: block.text, blocks: [] });
      continue;
    }
    if (raw.length === 0) intro.push(block);
    else raw[raw.length - 1].blocks.push(block);
  }

  const sections: WeekSection[] = raw.map((section, index) => {
    const marker = section.blocks.findIndex((b) => b.type === "practice");
    const learn = marker === -1 ? section.blocks : section.blocks.slice(0, marker);
    const practice = marker === -1 ? [] : section.blocks.slice(marker + 1);
    const meta = week.sections[section.id] ?? { goal: "", checks: [], quizIds: [] };
    return {
      id: section.id,
      number: index + 1,
      title: section.title,
      learn,
      practice,
      meta,
      minutes: estimateMinutes(section.blocks, meta.checks.length, meta.quizIds.length),
    };
  });

  const outline = { intro, sections };
  cache.set(week.slug, outline);
  return outline;
}

export function getSection(week: WeekMeta, sectionId: string): WeekSection | undefined {
  return getWeekOutline(week).sections.find((s) => s.id === sectionId);
}
