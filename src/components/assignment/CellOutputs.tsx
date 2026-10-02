import type { NotebookOutput } from "@/lib/notebook";

/** 코드 셀 실행 결과(표준 출력·오류·그림)를 보여 준다. 작업 공간과 운영자 화면이 함께 쓴다. */
export default function CellOutputs({ outputs, status }: { outputs?: NotebookOutput[]; status?: string | null }) {
  if (!status && (!outputs || outputs.length === 0)) return null;
  return (
    <div className="border-t border-[var(--border-hairline)] bg-[var(--surface-card)] px-4 py-3 font-mono text-[12.5px] leading-relaxed">
      {status && <p className="text-ink-muted">{status}</p>}
      {outputs?.map((o, i) => {
        if (o.type === "image")
          return (
            // eslint-disable-next-line @next/next/no-img-element -- 실행 결과로 만든 data URL 그림이라 next/image 최적화 대상이 아니다
            <img
              key={i}
              src={`data:image/png;base64,${o.data}`}
              alt={`실행 결과 그림 ${i + 1}`}
              className="my-2 max-w-full rounded-lg bg-white"
            />
          );
        const color =
          o.type === "error" || (o.type === "stream" && o.name === "stderr") ? "text-[var(--status-critical)]" : "text-ink-body";
        return (
          <pre key={i} className={`whitespace-pre-wrap break-words ${color}`}>
            {o.text}
          </pre>
        );
      })}
    </div>
  );
}
