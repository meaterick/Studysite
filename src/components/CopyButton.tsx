"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 API를 못 쓰는 환경(권한 없음 등)에서는 조용히 무시합니다.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md px-2 py-1 text-[11px] font-bold text-ink-muted transition hover:bg-[var(--surface-card)] hover:text-ink"
      aria-label="코드 복사"
    >
      {copied ? "복사됨 ✓" : "복사"}
    </button>
  );
}
