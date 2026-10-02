import type { ReactNode } from "react";
import { highlightCode, type TokenKind } from "@/lib/highlight";
import CopyButton from "./CopyButton";

const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "text-[var(--syn-keyword)]",
  string: "text-[var(--syn-string)]",
  comment: "italic text-[var(--syn-comment)]",
  number: "text-[var(--syn-number)]",
  call: "text-[var(--syn-call)]",
  decorator: "text-[var(--syn-builtin)]",
  builtin: "text-[var(--syn-builtin)]",
  plain: "",
};

const LANG_LABEL: Record<string, string> = {
  python: "Python",
  py: "Python",
  "python-colab": "Python · 참고 코드 (Colab 등 외부 환경에서 실행)",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  text: "Text",
};

export default function CodeBlock({
  lang,
  code,
  action,
  label,
  bare = false,
}: {
  lang?: string;
  code: string;
  action?: ReactNode;
  /** 머리글의 언어 표시 대신 쓸 문구 */
  label?: string;
  /** 테두리·머리글 없이 코드만(다른 코드 상자 안에 넣을 때) */
  bare?: boolean;
}) {
  const lines = highlightCode(code, lang);
  const showLineNumbers = lines.length > 3;
  const body = (
    <pre className="overflow-x-auto py-4 text-[13px] leading-[1.7]">
      <code className="block font-mono text-ink">
        {lines.map((tokens, i) => (
          <div key={i} className="flex px-4">
            {showLineNumbers && (
              <span className="mr-5 shrink-0 select-none text-right text-ink-muted opacity-60" style={{ minWidth: "1.6em" }}>
                {i + 1}
              </span>
            )}
            <span className="whitespace-pre">
              {tokens.length === 0
                ? "\u200b"
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
  );
  if (bare) return body;

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--code-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-4 py-1.5">
        <span className="font-mono text-[11px] text-ink-muted">{label ?? (lang ? LANG_LABEL[lang.toLowerCase()] ?? lang : "Code")}</span>
        <div className="flex items-center gap-1.5">
          <CopyButton text={code} />
          {action}
        </div>
      </div>
      {body}
    </div>
  );
}
