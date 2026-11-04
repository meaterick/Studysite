import type { Block, CalloutTone } from "./types";

// A small, purpose-built markdown parser for this site's content files.
// It supports exactly the subset the content authors use: headings (## and ###),
// paragraphs with bold and inline-code spans, unordered/ordered lists,
// GFM-style tables, fenced code blocks, "formula" fences for math/derivation
// display, tone-labelled callout containers, and a diagram marker line that
// maps to a React diagram component.
// 콘텐츠는 빌드에 포함된 상수 문자열이라 같은 입력은 항상 같은 결과를 낸다.
// 페이지가 동적 렌더링되더라도(로그인 상태 확인 때문에) 매 요청마다 정규식
// 파싱을 반복하지 않도록, 서버 프로세스가 떠 있는 동안 결과를 재사용한다.
const parseCache = new Map<string, Block[]>();

export function parseMarkdown(source: string): Block[] {
  const cached = parseCache.get(source);
  if (cached) return cached;
  const blocks = parseMarkdownUncached(source);
  parseCache.set(source, blocks);
  return blocks;
}

export function parseMarkdownUncached(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let i = 0;
  let paragraphBuf: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuf.length > 0) {
      const text = paragraphBuf.join(" ").trim();
      if (text) blocks.push({ type: "paragraph", text });
      paragraphBuf = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      i++;
      continue;
    }


    // Diagram marker
    const diagramMatch = trimmed.match(/^\[\[diagram:([a-z0-9-]+)\]\]$/i);
    if (diagramMatch) {
      flushParagraph();
      blocks.push({ type: "diagram", id: diagramMatch[1] });
      i++;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(##|###)\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      // `## 제목 {#section-id}` — 명시적 id(단계 식별자)를 붙일 수 있다
      const idMatch = headingMatch[2].match(/^(.*?)\s*\{#([a-z0-9-]+)\}\s*$/i);
      blocks.push({
        type: "heading",
        level: headingMatch[1].length === 2 ? 2 : 3,
        text: (idMatch ? idMatch[1] : headingMatch[2]).trim(),
        ...(idMatch ? { id: idMatch[2] } : {}),
      });
      i++;
      continue;
    }

    // Fenced blocks: ```lang, ```formula
    const fenceMatch = trimmed.match(/^```([\w-]*)$/);
    if (fenceMatch) {
      flushParagraph();
      const lang = fenceMatch[1];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "```") {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const code = codeLines.join("\n");
      if (lang === "formula") {
        blocks.push({ type: "formula", code });
      } else if (lang === "math") {
        blocks.push({ type: "math", tex: code });
      } else if (lang === "image") {
        const fields: Record<string, string> = {};
        for (const l of codeLines) {
          const idx = l.indexOf(":");
          if (idx === -1) continue;
          fields[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
        }
        if (fields.src && fields.alt && fields.width && fields.height) {
          blocks.push({
            type: "image",
            src: fields.src,
            alt: fields.alt,
            caption: fields.caption,
            credit: fields.credit,
            width: Number(fields.width),
            height: Number(fields.height),
            // 선택: 표시 최대 폭(px). 세로로 긴 그래프처럼 본문 폭 전체로 늘리면 지나치게 커지는 그림에 쓴다.
            ...(fields.maxWidth ? { maxWidth: Number(fields.maxWidth) } : {}),
          });
        }
      } else {
        blocks.push({ type: "code", lang: lang || undefined, code });
      }
      continue;
    }

    // Display math: $$ ... $$ (한 줄 또는 여러 줄). ```math 펜스와 같은 블록이 된다.
    if (trimmed.startsWith("$$")) {
      flushParagraph();
      const texLines: string[] = [];
      let rest = trimmed.slice(2);
      while (!rest.trimEnd().endsWith("$$") && i + 1 < lines.length) {
        texLines.push(rest);
        i++;
        rest = lines[i].trim();
      }
      texLines.push(rest.trimEnd().replace(/\$\$$/, ""));
      i++;
      blocks.push({ type: "math", tex: texLines.join("\n").trim() });
      continue;
    }

    // Callout containers: :::tone Title
    const calloutMatch = trimmed.match(/^:::(info|warn|example|quote|tip|task)\s*(.*)$/);
    if (calloutMatch) {
      flushParagraph();
      const tone = calloutMatch[1] as CalloutTone;
      const title = calloutMatch[2].trim() || undefined;
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        bodyLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      blocks.push({
        type: "callout",
        tone,
        title,
        text: bodyLines.join(" ").trim(),
        // 상자 안에서도 표·목록·코드·수식·여러 문단을 쓸 수 있게 본문을 다시 블록으로 해석한다.
        blocks: parseMarkdownUncached(bodyLines.join("\n")),
      });
      continue;
    }

    // Tables: consecutive lines starting with |
    if (trimmed.startsWith("|")) {
      flushParagraph();
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines.map((l) =>
        l
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim())
      );
      const headers = rows[0] ?? [];
      // rows[1] is the separator (---|---), skip it
      const body = rows.slice(2);
      blocks.push({ type: "table", headers, rows: body });
      continue;
    }

    // Lists: unordered "- " or ordered "1. "
    const isUnordered = /^-\s+/.test(trimmed);
    const isOrdered = /^\d+\.\s+/.test(trimmed);
    if (isUnordered || isOrdered) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (isUnordered && /^-\s+/.test(t)) {
          items.push(t.replace(/^-\s+/, ""));
          i++;
        } else if (isOrdered && /^\d+\.\s+/.test(t)) {
          items.push(t.replace(/^\d+\.\s+/, ""));
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: "list", ordered: isOrdered, items });
      continue;
    }

    // Default: accumulate paragraph text
    paragraphBuf.push(trimmed);
    i++;
  }

  flushParagraph();
  return blocks;
}

export type InlineToken =
  | string
  | { bold: string }
  | { italic: string }
  | { code: string }
  | { math: string }
  | { link: string; href: string };

/** Render simple inline markdown (**bold**, *italic*, `code`, $math$, [text](https://…)) into tokens. */
export function renderInline(text: string): InlineToken[] {
  const parts: InlineToken[] = [];
  const regex =
    /(\*\*[^*]+\*\*|`[^`]+`|\$[^$\n]+\$|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|\*(?=\S)[^*$\n]+?(?<=\S)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("**")) parts.push({ bold: token.slice(2, -2) });
    else if (token.startsWith("*")) parts.push({ italic: token.slice(1, -1) });
    else if (token.startsWith("$")) parts.push({ math: token.slice(1, -1) });
    else if (token.startsWith("[")) {
      const close = token.indexOf("](");
      parts.push({ link: token.slice(1, close), href: token.slice(close + 2, -1) });
    } else parts.push({ code: token.slice(1, -1) });
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
