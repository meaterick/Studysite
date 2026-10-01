"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import CodeBlock from "@/components/CodeBlock";
import { loadCellCode } from "@/lib/codeStore";
import { useUserScope } from "./UserScope";

// Monaco Editor(수 MB)와 Pyodide 연동 로직은 별도 청크로 분리해, 학습자가 편집·실행을
// 누른 셀에서만 불러온다.
const loadCodeCell = () => import("./CodeCell");
const CodeCell = lazy(loadCodeCell);

/**
 * 학습 자료의 실행 가능한 코드 블록.
 *
 * 처음에는 서버에서 렌더링한 정적 코드 블록(문법 강조)을 그대로 보여 주고, 학습자가
 * "편집"이나 "실행"을 눌렀을 때에만 편집기로 바꾼다. 스크롤만으로 편집기를 붙이면
 * 단계를 옮길 때마다 정적 블록 → 로딩 문구 → 편집기로 바뀌며 높이가 출렁여 화면이
 * 깜빡이기 때문이다. 화면 근처에 오면 편집기 청크만 미리 받아 두어 전환을 빠르게 하고,
 * 전환하는 동안에도 같은 정적 블록을 대체 화면으로 써서 모양이 바뀌지 않게 한다.
 */
export default function LazyCodeCell({
  cellId,
  starterCode,
  onComplete,
}: {
  cellId: string;
  starterCode: string;
  onComplete?: () => void;
}) {
  const uid = useUserScope();
  const [active, setActive] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  // 이전에 수정해 둔 코드가 있으면 정적 블록에도 그 코드를 보여 준다.
  const [saved, setSaved] = useState<string | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadCellCode(`${uid}::${cellId}`).then((code) => {
      if (!cancelled && code !== undefined && code !== starterCode) setSaved(code);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, cellId, starterCode]);

  useEffect(() => {
    const el = ref.current;
    if (!el || active) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadCodeCell();
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  const open = (run: boolean) => {
    setAutoRun(run);
    setActive(true);
  };

  const staticBlock = (
    <CodeBlock
      lang="python"
      label={saved ? "Python · 내가 수정한 코드" : "Python · 완성 예제"}
      code={saved ?? starterCode}
      action={
        <>
          <button
            type="button"
            onClick={() => open(false)}
            disabled={active}
            className="rounded-md px-2 py-1 text-xs font-bold text-ink-secondary hover:bg-[var(--surface-card)] hover:text-ink disabled:opacity-50"
          >
            ✎ 편집
          </button>
          <button
            type="button"
            onClick={() => open(true)}
            disabled={active}
            className="rounded-md bg-[var(--series-blue)] px-3 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            ▶ 실행
          </button>
        </>
      }
    />
  );

  if (active) {
    return (
      <Suspense fallback={staticBlock}>
        <CodeCell cellId={cellId} starterCode={starterCode} onComplete={onComplete} autoRun={autoRun} />
      </Suspense>
    );
  }
  return <div ref={ref}>{staticBlock}</div>;
}
