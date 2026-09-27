"use client";

import { useEffect, useState, useTransition } from "react";
import { markAssignmentThreadRead, sendAssignmentMessage } from "@/lib/assignmentActions";

export interface ThreadMessageView {
  id: string;
  authorName: string;
  role: "member" | "admin";
  text: string;
  createdAt: string;
}

/** 과제 질문·피드백 대화. 스터디원 화면과 운영자 채점 화면에서 같은 대화를 본다. */
export default function AssignmentThread({
  slug,
  messages,
  viewer,
  targetUserId,
  unread,
}: {
  slug: string;
  messages: ThreadMessageView[];
  viewer: "member" | "admin";
  /** 운영자가 볼 때 대상 스터디원 id */
  targetUserId?: string;
  unread: number;
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 화면에 대화를 띄웠으면 읽은 것으로 기록한다.
  useEffect(() => {
    if (unread > 0) void markAssignmentThreadRead(slug, targetUserId);
  }, [slug, targetUserId, unread]);

  const send = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await sendAssignmentMessage(slug, text, targetUserId);
        if (!result.ok) setError(result.error);
        else setText("");
      } catch {
        setError("메시지를 보내지 못했습니다. 잠시 후 다시 시도해 주십시오.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-4 sm:p-5">
      {messages.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {viewer === "member"
            ? "과제를 하다 막히는 부분이 있으면 운영자에게 질문을 남겨 주십시오. 답변이 오면 이곳에 표시됩니다."
            : "아직 주고받은 메시지가 없습니다."}
        </p>
      ) : (
        <ol className="space-y-3">
          {messages.map((m) => {
            const mine = m.role === viewer;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === "admin"
                      ? "bg-[color-mix(in_srgb,var(--series-orange)_10%,transparent)]"
                      : "bg-[color-mix(in_srgb,var(--series-blue)_8%,transparent)]"
                  }`}
                >
                  <p className="mb-0.5 text-[11px] font-bold text-ink-muted">
                    {m.role === "admin" ? `운영자 ${m.authorName}` : m.authorName} · {new Date(m.createdAt).toLocaleString("ko-KR")}
                  </p>
                  <p className="whitespace-pre-wrap text-ink">{m.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-4">
        <label htmlFor={`thread-${targetUserId ?? "me"}`} className="sr-only">
          메시지
        </label>
        <textarea
          id={`thread-${targetUserId ?? "me"}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder={viewer === "member" ? "질문을 입력해 주십시오. 어느 과제의 어떤 부분인지 함께 적어 주시면 답변이 빨라집니다." : "스터디원에게 보낼 메시지를 입력합니다."}
          className="w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-2 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={send}
            disabled={pending || !text.trim()}
            className="rounded-md bg-[var(--series-blue)] px-4 py-1.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "보내는 중…" : "보내기"}
          </button>
          {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
