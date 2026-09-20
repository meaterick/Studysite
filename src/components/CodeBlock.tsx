import { highlightCode, type TokenKind } from "@/lib/highlight";
import CopyButton from "./CopyButton";

const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "font-semibold text-[var(--series-violet)]",
  string: "text-[var(--series-aqua)]",
  comment: "italic text-ink-muted",
  number: "text-[var(--series-orange)]",
  call: "text-[var(--series-blue)]",
  decorator: "text-[var(--series-magenta)]",
  builtin: "text-[var(--series-magenta)]",
  plain: "",
};

const LANG_LABEL: Record<string, string> = {
  python: "Python",
  py: "Python",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  text: "Text",
};

export default function CodeBlock({ lang, code }: { lang?: string; code: string }) {
  const lines = highlightCode(code, lang);
  const showLineNumbers = lines.length > 3;

  return (
    <div className="not-prose overflow-hidden rounded-lg border border-[var(--border-hairline)]">
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-3 py-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
          {lang ? LANG_LABEL[lang.toLowerCase()] ?? lang : "Code"}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto bg-[var(--surface-card)] py-3 text-[12.5px] leading-relaxed">
        <code className="font-mono text-ink">
          {lines.map((tokens, i) => (
            <div key={i} className="flex px-4">
              {showLineNumbers && (
                <span className="mr-4 shrink-0 select-none text-right text-ink-muted/60" style={{ minWidth: "1.6em" }}>
                  {i + 1}
                </span>
              )}
              <span className="whitespace-pre">
                {tokens.length === 0
                  ? "​"
                  : tokens.map((t, j) => (
                      <span key={j} className={TOKEN_CLASS[t.kind] || undefined}>
                        {t.text}
                      </span>
                    ))}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
