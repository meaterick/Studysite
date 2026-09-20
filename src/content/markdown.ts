import type { Block } from "./types";

// A small, purpose-built markdown parser for this site's content files.
// It supports exactly the subset the content authors use: headings (## and ###),
// paragraphs with bold and inline-code spans, unordered/ordered lists,
// GFM-style tables, fenced code blocks, "formula" fences for math/derivation
// display, tone-labelled callout containers, and a diagram marker line that
// maps to a React diagram component.
export function parseMarkdown(source: string): Block[] {
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
      blocks.push({
        type: "heading",
        level: headingMatch[1].length === 2 ? 2 : 3,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Fenced blocks: ```lang, ```formula
    const fenceMatch = trimmed.match(/^```(\w*)$/);
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
      } else {
        blocks.push({ type: "code", lang: lang || undefined, code });
      }
      continue;
    }

    // Callout containers: :::tone Title
    const calloutMatch = trimmed.match(/^:::(info|warn|example|quote)\s*(.*)$/);
    if (calloutMatch) {
      flushParagraph();
      const tone = calloutMatch[1] as "info" | "warn" | "example" | "quote";
      const title = calloutMatch[2].trim() || undefined;
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        bodyLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      blocks.push({ type: "callout", tone, title, text: bodyLines.join(" ").trim() });
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

/** Render simple inline markdown (**bold**, `code`) into React nodes. */
export function renderInline(text: string): (string | { bold: string } | { code: string })[] {
  const parts: (string | { bold: string } | { code: string })[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("**")) parts.push({ bold: token.slice(2, -2) });
    else parts.push({ code: token.slice(1, -1) });
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
