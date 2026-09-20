import type { Block } from "@/content/types";
import { parseMarkdown, renderInline } from "@/content/markdown";
import { DIAGRAMS } from "@/components/diagrams";

function Inline({ text }: { text: string }) {
  const parts = renderInline(text);
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === "string") return <span key={i}>{p}</span>;
        if ("bold" in p) return <strong key={i} className="font-bold text-ink">{p.bold}</strong>;
        return (
          <code
            key={i}
            className="rounded border border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-1.5 py-0.5 font-mono text-[0.88em]"
          >
            {p.code}
          </code>
        );
      })}
    </>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const CALLOUT_STYLE: Record<string, { border: string; bg: string; icon: string }> = {
  info: { border: "var(--series-blue)", bg: "color-mix(in srgb, var(--series-blue) 10%, transparent)", icon: "정보" },
  warn: { border: "var(--status-serious)", bg: "color-mix(in srgb, var(--status-serious) 12%, transparent)", icon: "주의" },
  example: { border: "var(--series-aqua)", bg: "color-mix(in srgb, var(--series-aqua) 10%, transparent)", icon: "예제" },
  quote: { border: "var(--border-strong)", bg: "var(--surface-card-2)", icon: "" },
};

export function BlocksRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-week max-w-none space-y-4 leading-relaxed text-ink-secondary">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading": {
            const id = slugify(b.text);
            const Tag = b.level === 2 ? "h2" : "h3";
            return (
              <Tag
                key={i}
                id={id}
                className={
                  b.level === 2
                    ? "scroll-mt-24 pt-4 text-xl font-black text-ink"
                    : "scroll-mt-24 pt-2 text-base font-bold text-ink"
                }
              >
                {b.text}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={i} className="text-[15px]">
                <Inline text={b.text} />
              </p>
            );
          case "list":
            return b.ordered ? (
              <ol key={i} className="list-decimal space-y-1.5 pl-5 text-[15px]">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={i} className="list-disc space-y-1.5 pl-5 text-[15px]">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={i} className="not-prose overflow-x-auto rounded-lg border border-[var(--border-hairline)]">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-card-2)]">
                      {b.headers.map((h, j) => (
                        <th key={j} className="border-b border-[var(--border-hairline)] px-3 py-2 text-left font-bold text-ink">
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r} className="odd:bg-transparent even:bg-[var(--surface-card-2)]/40">
                        {row.map((cell, c) => (
                          <td key={c} className="border-b border-[var(--border-hairline)] px-3 py-2 align-top">
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "code":
            return (
              <div key={i} className="not-prose overflow-hidden rounded-lg border border-[var(--border-hairline)]">
                {b.lang && (
                  <div className="border-b border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                    {b.lang}
                  </div>
                )}
                <pre className="overflow-x-auto bg-[var(--surface-card)] p-4 text-[12.5px] leading-relaxed">
                  <code className="font-mono text-ink">{b.code}</code>
                </pre>
              </div>
            );
          case "formula":
            return (
              <div
                key={i}
                className="not-prose overflow-x-auto rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-card-2)] px-4 py-3 text-center"
              >
                <pre className="inline-block whitespace-pre text-left font-mono text-[13px] leading-relaxed text-ink">
                  {b.code}
                </pre>
              </div>
            );
          case "callout": {
            const style = CALLOUT_STYLE[b.tone];
            return (
              <div
                key={i}
                className="not-prose rounded-lg border-l-4 px-4 py-3 text-[14px]"
                style={{ borderColor: style.border, background: style.bg }}
              >
                {(b.title || style.icon) && (
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: style.border }}>
                    {b.title || style.icon}
                  </p>
                )}
                <p className="text-ink-secondary">
                  <Inline text={b.text} />
                </p>
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

export default function Markdown({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return <BlocksRenderer blocks={blocks} />;
}
