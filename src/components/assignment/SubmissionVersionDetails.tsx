"use client";

import { useRef, useState, type ReactNode } from "react";
import type { AssignmentDraft } from "@/lib/notebook";
import NotebookView, { type NotebookViewTask } from "./NotebookView";

type LoadState =
  | { status: "idle" | "loading" | "missing" }
  | { status: "ready"; notebook: AssignmentDraft }
  | { status: "failed"; message: string };

const FAILED = "작업 공간을 불러오지 못했습니다.";
const RETRY_LATER = "요청이 너무 잦습니다. 잠시 후 다시 시도해 주십시오.";
const SIGNED_OUT = "로그인이 만료되었습니다. 다시 로그인한 뒤 시도해 주십시오.";

/**
 * 제출 기록의 이전 제출본 한 줄. 접혀 있을 때는 서버가 그린 요약(버전·제출 시각·점수)만 있고, 펼칠 때 그 버전의
 * 작업 공간(노트북) 하나만 받아 온다. 페이지가 모든 버전의 노트북을 한꺼번에 읽어 그리면 제출이 쌓일수록 요청 하나가
 * 서버 메모리를 크게 쓰기 때문이다. 채점 결과·제출 메모(children)는 가벼워서 서버에서 그린 그대로 둔다.
 */
export default function SubmissionVersionDetails({
  summary,
  children,
  className,
  bodyClassName,
  submissionId,
  version,
  hasNotebook,
  tasks,
  taskComments,
}: {
  /** 접혀 있을 때 보이는 <summary> 요소 */
  summary: ReactNode;
  /** 펼쳤을 때 작업 공간 위에 보일 내용(채점 결과·제출 메모 등) */
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  submissionId: string;
  version: number;
  /** 이 버전에 작업 공간 기록이 있는지(예전 방식으로 제출한 과제에는 없다) */
  hasNotebook: boolean;
  tasks: NotebookViewTask[];
  taskComments?: Record<string, string>;
}) {
  const [load, setLoad] = useState<LoadState>({ status: "idle" });
  const inFlight = useRef(false);

  const fetchNotebook = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoad({ status: "loading" });
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(submissionId)}/notebooks/${version}`, { cache: "no-store" });
      if (res.ok) setLoad({ status: "ready", notebook: (await res.json()) as AssignmentDraft });
      else if (res.status === 404) setLoad({ status: "missing" });
      else setLoad({ status: "failed", message: res.status === 429 ? RETRY_LATER : res.status === 401 ? SIGNED_OUT : FAILED });
    } catch {
      setLoad({ status: "failed", message: FAILED });
    } finally {
      inFlight.current = false;
    }
  };

  const notebookArea = () => {
    switch (load.status) {
      case "ready":
        return <NotebookView tasks={tasks} notebook={load.notebook} taskComments={taskComments} runKey={`${submissionId}:${version}`} />;
      case "loading":
        return (
          <p role="status" className="text-sm text-ink-muted">
            제출한 작업 공간을 불러오는 중…
          </p>
        );
      case "missing":
        return <p className="text-sm text-ink-muted">이 제출본의 작업 공간 기록을 찾을 수 없습니다.</p>;
      case "failed":
        return (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-[var(--status-critical)]">
              {load.message}
            </p>
            <button type="button" onClick={() => void fetchNotebook()} className="btn btn-secondary btn-sm">
              다시 시도
            </button>
          </div>
        );
      default:
        // 펼치는 순간 불러오므로 보통은 보이지 않는다. 화면이 준비되기 전에 펼쳐 toggle 이벤트를 놓친 경우를 위한 버튼이다.
        return (
          <button type="button" onClick={() => void fetchNotebook()} className="btn btn-secondary btn-sm">
            작업 공간 불러오기
          </button>
        );
    }
  };

  return (
    <details
      className={className}
      onToggle={(e) => {
        if (e.currentTarget.open && hasNotebook && load.status === "idle") void fetchNotebook();
      }}
    >
      {summary}
      <div className={bodyClassName}>
        {children}
        {hasNotebook && notebookArea()}
      </div>
    </details>
  );
}
