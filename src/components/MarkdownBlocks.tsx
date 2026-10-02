import Image from "next/image";
import type { Block } from "@/content/types";
import { parseMarkdown, renderInline } from "@/content/markdown";
import { DIAGRAMS } from "@/components/diagrams";
import CodeBlock from "@/components/CodeBlock";
import LazyCodeCell from "@/components/LazyCodeCell";
import { renderMath } from "@/lib/katex";

const RUNNABLE_LANGS = new Set(["python", "py"]);

export function Inline({ text }: { text: string }) {
  const parts = renderInline(text);
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === "string") return <span key={i}>{p}</span>;
        if ("bold" in p) return <strong key={i} className="font-semibold text-ink"><Inline text={p.bold} /></strong>;
        if ("italic" in p) return <em key={i}>{p.italic}</em>;
        if ("link" in p)
          return (
            <a
              key={i}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--accent)] underline decoration-[color-mix(in_srgb,var(--accent)_35%,transparent)] underline-offset-4 transition hover:decoration-[var(--accent)]"
            >
              {p.link}
            </a>
          );
        if ("math" in p) return <span key={i} dangerouslySetInnerHTML={{ __html: renderMath(p.math, false) }} />;
        return (
          <code
            key={i}
            className="rounded-md bg-[var(--surface-card-2)] px-1.5 py-0.5 font-mono text-[0.86em] text-ink"
          >
            {p.code}
          </code>
        );
      })}
    </>
  );
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// 본문 상자: 색은 제목 글자와 아주 옅은 바탕에만 쓴다. 인용(quote)은 왼쪽 가는 선만 둔다.
const CALLOUT_STYLE: Record<string, { tone: string; icon: string }> = {
  info: { tone: "var(--accent)", icon: "정보" },
  warn: { tone: "var(--status-serious)", icon: "주의" },
  example: { tone: "var(--tier-supplement)", icon: "예제" },
  quote: { tone: "var(--border-strong)", icon: "" },
  tip: { tone: "var(--status-good)", icon: "팁" },
  task: { tone: "var(--tier-advanced)", icon: "직접 해보기" },
};

export function BlocksRenderer({
  blocks,
  docKey,
  interactiveCode = false,
}: {
  blocks: Block[];
  /** 코드 셀 저장 키(IndexedDB)를 만드는 데 쓰이는 이 문서의 고유 식별자 */
  docKey?: string;
  /** true면 python 코드 블록을 정적 텍스트가 아니라 실행 가능한 셀로 렌더링 */
  interactiveCode?: boolean;
}) {
  let codeOrdinal = -1;
  return (
    <div className="prose-week max-w-none space-y-5 text-ink-body">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading": {
            const id = b.id ?? slugify(b.text);
            const Tag = b.level === 2 ? "h2" : "h3";
            return (
              <Tag
                key={i}
                id={id}
                className={
                  b.level === 2
                    ? "scroll-mt-24 pt-8 text-[1.375rem] font-bold leading-snug tracking-[-0.03em] text-ink first:pt-0"
                    : "scroll-mt-24 pt-3 text-[1.0625rem] font-semibold leading-snug tracking-[-0.02em] text-ink"
                }
              >
                <Inline text={b.text} />
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={i} className="text-base leading-[1.85]">
                <Inline text={b.text} />
              </p>
            );
          case "list":
            return b.ordered ? (
              <ol key={i} className="list-decimal space-y-2 pl-5 text-base leading-[1.8] marker:text-ink-muted">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={i} className="list-disc space-y-2 pl-5 text-base leading-[1.8] marker:text-ink-muted">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={i} className="not-prose overflow-x-auto rounded-xl border border-[var(--border-hairline)]">
                <table className="w-full border-collapse text-sm leading-relaxed">
                  <thead>
                    <tr className="bg-[var(--surface-card-2)]">
                      {b.headers.map((h, j) => (
                        <th key={j} className="px-4 py-2.5 text-left text-[13px] font-semibold text-ink">
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className="border-t border-[var(--border-hairline)] px-4 py-3 align-top">
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "code": {
            const runnable = interactiveCode && b.lang && RUNNABLE_LANGS.has(b.lang.toLowerCase());
            if (!runnable) return <CodeBlock key={i} lang={b.lang} code={b.code} />;

            codeOrdinal++;
            const cellId = `${docKey ?? "doc"}:${codeOrdinal}`;
            return <LazyCodeCell key={i} cellId={cellId} starterCode={b.code} />;
          }
          case "formula":
            return (
              <div
                key={i}
                className="not-prose overflow-x-auto rounded-xl bg-[var(--surface-card-2)] px-5 py-4 text-center"
              >
                <pre className="inline-block whitespace-pre text-left font-mono text-[13px] leading-relaxed text-ink">
                  {b.code}
                </pre>
              </div>
            );
          case "math":
            return (
              <div
                key={i}
                className="not-prose overflow-x-auto rounded-xl border border-[var(--border-hairline)] px-4 py-6 text-center"
                dangerouslySetInnerHTML={{ __html: renderMath(b.tex, true) }}
              />
            );
          case "image":
            return (
              <figure key={i} className="not-prose my-8 overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-card">
                <Image
                  src={b.src}
                  alt={b.alt}
                  width={b.width}
                  height={b.height}
                  className="w-full"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
                {(b.caption || b.credit) && (
                  <figcaption className="border-t border-[var(--border-hairline)] px-4 py-3 text-[13px] text-ink-secondary">
                    {b.caption}
                    {b.credit && <span className="ml-2 text-ink-muted">— {b.credit}</span>}
                  </figcaption>
                )}
              </figure>
            );
          case "callout": {
            const style = CALLOUT_STYLE[b.tone];
            const quote = b.tone === "quote";
            return (
              <div
                key={i}
                className={quote ? "not-prose border-l-2 border-[var(--border-strong)] py-1 pl-5 text-[15px]" : "not-prose rounded-xl px-5 py-4 text-[15px]"}
                style={
                  quote
                    ? undefined
                    : {
                        background: `color-mix(in srgb, ${style.tone} 6%, var(--surface-card))`,
                        border: `1px solid color-mix(in srgb, ${style.tone} 18%, transparent)`,
                      }
                }
              >
                {(b.title || style.icon) && (
                  <p className="mb-1.5 text-xs font-semibold" style={{ color: quote ? "var(--text-muted)" : style.tone }}>
                    {b.title || style.icon}
                  </p>
                )}
                {b.blocks.length === 1 && b.blocks[0].type === "paragraph" ? (
                  <p className="leading-[1.8] text-ink-body">
                    <Inline text={b.text} />
                  </p>
                ) : (
                  // 표·목록·여러 문단이 든 상자: 본문 블록을 그대로 그린다(상자 안의 코드는 실행 셀이 아닌 정적 블록).
                  <BlocksRenderer blocks={b.blocks} docKey={docKey ? `${docKey}:box${i}` : undefined} />
                )}
              </div>
            );
          }
          case "diagram": {
            const Diagram = DIAGRAMS[b.id];
            if (!Diagram) return null;
            return <Diagram key={i} />;
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

export default function Markdown({
  source,
  docKey,
  interactiveCode,
}: {
  source: string;
  docKey?: string;
  interactiveCode?: boolean;
}) {
  const blocks = parseMarkdown(source);
  return <BlocksRenderer blocks={blocks} docKey={docKey} interactiveCode={interactiveCode} />;
}
