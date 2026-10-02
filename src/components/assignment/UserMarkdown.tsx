"use client";

import { useMemo } from "react";
import katex from "katex";
import type { Block } from "@/content/types";
import { parseMarkdownUncached, renderInline } from "@/content/markdown";
import CodeBlock from "@/components/CodeBlock";

// 학습자가 작성한 답안(마크다운)을 렌더링한다. 콘텐츠 렌더러(MarkdownBlocks)와 같은 문법을 쓰되,
// 사용자 입력이므로 이미지·다이어그램·실행 가능한 코드 셀은 만들지 않고, 모든 텍스트는
// React가 이스케이프한다. 수식은 KaTeX로 렌더링한다(기본값 trust:false라 \href 등은 무시된다).

function mathHtml(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode, strict: "ignore", maxExpand: 200 });
  } catch {
    return "";
  }
}

function UserInline({ text }: { text: string }) {
  return (
    <>
      {renderInline(text).map((p, i) => {
        if (typeof p === "string") return <span key={i}>{p}</span>;
        if ("bold" in p) return <strong key={i} className="font-semibold text-ink"><UserInline text={p.bold} /></strong>;
        if ("italic" in p) return <em key={i}>{p.italic}</em>;
        if ("link" in p)
          return (
            <a key={i} href={p.href} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--accent)] underline">
              {p.link}
            </a>
          );
        if ("math" in p) return <span key={i} dangerouslySetInnerHTML={{ __html: mathHtml(p.math, false) }} />;
        return (
          <code key={i} className="rounded-md bg-[var(--surface-card-2)] px-1.5 py-0.5 font-mono text-[0.86em] text-ink">
            {p.code}
          </code>
        );
      })}
    </>
  );
}

function renderBlock(b: Block, i: number) {
  switch (b.type) {
    case "heading":
      return b.level === 2 ? (
        <h4 key={i} className="pt-2 text-base font-semibold text-ink">
          <UserInline text={b.text} />
        </h4>
      ) : (
        <h5 key={i} className="pt-1 text-sm font-semibold text-ink">
          <UserInline text={b.text} />
        </h5>
      );
    case "paragraph":
      return (
        <p key={i}>
          <UserInline text={b.text} />
        </p>
      );
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag key={i} className={`${b.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
          {b.items.map((it, j) => (
            <li key={j}>
              <UserInline text={it} />
            </li>
          ))}
        </Tag>
      );
    }
    case "table":
      return (
        <div key={i} className="overflow-x-auto rounded-xl border border-[var(--border-hairline)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--surface-card-2)]">
                {b.headers.map((h, j) => (
                  <th key={j} className="border-b border-[var(--border-hairline)] px-2 py-1.5 text-left font-semibold text-ink">
                    <UserInline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="border-b border-[var(--border-hairline)] px-2 py-1.5 align-top">
                      <UserInline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "code":
      return <CodeBlock key={i} lang={b.lang} code={b.code} />;
    case "formula":
      return (
        <pre key={i} className="overflow-x-auto rounded-xl bg-[var(--code-bg)] px-4 py-3 font-mono text-[13px]">
          {b.code}
        </pre>
      );
    case "math":
      return <div key={i} className="overflow-x-auto py-2 text-center" dangerouslySetInnerHTML={{ __html: mathHtml(b.tex, true) }} />;
    case "callout":
      return (
        <div key={i} className="border-l-2 border-[var(--border-strong)] py-1 pl-4">
          <UserInline text={b.text} />
        </div>
      );
    default:
      // 이미지·다이어그램 등 콘텐츠 전용 블록은 사용자 입력에서 렌더링하지 않는다.
      return null;
  }
}

export default function UserMarkdown({ source, className = "" }: { source: string; className?: string }) {
  const blocks = useMemo(() => parseMarkdownUncached(source), [source]);
  if (!source.trim()) return <p className="text-sm text-ink-muted">(작성한 내용이 없습니다)</p>;
  return <div className={`space-y-2.5 text-sm leading-relaxed text-ink-secondary ${className}`}>{blocks.map(renderBlock)}</div>;
}
