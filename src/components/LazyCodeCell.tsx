"use client";

import { useEffect, useRef, useState } from "react";
import CodeBlock from "@/components/CodeBlock";
import CodeCell from "@/components/CodeCellLoader";

/**
 * 코드 셀이 뷰포트 근처에 오거나 클릭되기 전까지는 Monaco 청크 자체를
 * 불러오지 않는다. 학습자료 한 페이지에 코드 블록이 여러 개(주차에 따라
 * 10개 안팎) 있을 수 있어서, 전부 즉시 마운트하면 방문하자마자 Monaco를
 * 그만큼 준비하게 되어 초기 로딩이 느려진다 — 실제로 스크롤해서 보게 될
 * 때에만 무거운 에디터를 활성화한다. 활성화 전에는 기존 정적 코드
 * 블록(문법 강조만, 실행 불가)을 그대로 보여준다.
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
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  const [autoRun, setAutoRun] = useState(false);

  if (active) {
    return <CodeCell cellId={cellId} starterCode={starterCode} onComplete={onComplete} autoRun={autoRun} />;
  }

  return (
    <div ref={ref}>
      <CodeBlock
        lang="python"
        code={starterCode}
        action={
          <button
            type="button"
            onClick={() => {
              setAutoRun(true);
              setActive(true);
            }}
            className="rounded-md bg-[var(--series-blue)] px-3 py-1 text-xs font-bold text-white hover:opacity-90"
          >
            ▶ 실행
          </button>
        }
      />
    </div>
  );
}
