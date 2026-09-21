"use client";

import { useSyncExternalStore } from "react";
import CodeCell from "@/components/CodeCellLoader";
import { assignmentGateStore, readUnlockedCodeCount, unlockNextCode } from "@/lib/progress";

// 이 파일은 의도적으로 MarkdownBlocks/katex를 import하지 않는다 — 이 파일은
// "use client"라서, 만약 server-only인 katex 렌더러를 끌고 들어오면 빌드가
// 깨진다. 잠금 여부 판단에 필요한 최소한(코드 셀 로더 + 진행 상태)만 가진다.
export default function GatedCodeSlot({
  slug,
  index,
  cellId,
  starterCode,
}: {
  slug: string;
  index: number;
  cellId: string;
  starterCode: string;
}) {
  const store = useSyncExternalStore(
    assignmentGateStore.subscribe,
    assignmentGateStore.getSnapshot,
    assignmentGateStore.getServerSnapshot
  );
  const unlocked = readUnlockedCodeCount(store, slug);

  if (index > unlocked) {
    return (
      <div className="not-prose flex items-center gap-2 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--surface-card-2)] px-4 py-5 text-sm text-ink-muted">
        🔒 이전 실습 코드를 먼저 실행하면 다음 실습이 열립니다.
      </div>
    );
  }

  return <CodeCell cellId={cellId} starterCode={starterCode} onComplete={() => unlockNextCode(slug, index)} />;
}
