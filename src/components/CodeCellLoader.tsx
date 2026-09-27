"use client";

import dynamic from "next/dynamic";

// Monaco Editor(수 MB)와 Pyodide 연동 로직은 이 파일을 통해서만 불러온다.
// next/dynamic(ssr:false)로 감싸 해당 코드 셀이 실제로 렌더링되는 페이지의
// 클라이언트 번들에만, 그것도 별도 청크로 분리되어 포함되게 한다 —
// 퀴즈/백지공부 페이지처럼 코드 실행이 필요 없는 페이지는 이 무게를
// 전혀 지지 않는다.
const CodeCell = dynamic(() => import("./CodeCell"), {
  ssr: false,
  loading: () => (
    <div className="not-prose flex items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-card)] py-8 text-xs text-ink-muted">
      코드 편집기를 불러오고 있습니다…
    </div>
  ),
});

export default CodeCell;
