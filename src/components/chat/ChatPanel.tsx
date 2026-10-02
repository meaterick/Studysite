"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { markChatConversationRead, sendChatMessage } from "@/lib/chatActions";
import { formatDate, formatTime } from "@/lib/datetime";
import type { ChatMessageView, ConversationView } from "./types";

type Connection = "connecting" | "live" | "offline";

const MAX_LENGTH = 4000;
/** 이 거리(px) 안에서 스크롤이 맨 아래 근처에 있으면 새 메시지가 올 때 따라 내려간다. */
const STICK_THRESHOLD = 80;

/**
 * 스터디원 ↔ 운영자 채팅 창. 메시지 목록은 창 안에서만 스크롤되므로 대화가 길어져도 페이지가
 * 늘어나지 않는다. 서버가 보내는 이벤트 스트림(SSE)으로 새 메시지를 곧바로 받는다.
 * Enter로 보내고, Shift+Enter로 줄을 바꾼다(한글 조합 중인 Enter는 무시).
 */
export default function ChatPanel({
  viewer,
  targetUserId,
  initial,
  placeholder,
  emptyText,
  className = "h-[min(72dvh,720px)] min-h-[420px]",
}: {
  viewer: "member" | "admin";
  /** 운영자가 볼 때 대화 상대 스터디원 id */
  targetUserId?: string;
  initial: ConversationView;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}) {
  const [conv, setConv] = useState(initial);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickRef = useRef(true);
  const markingRef = useRef(false);
  const lastCountRef = useRef(0);

  // ─── 실시간 수신 ─────────────────────────────────────────────────────
  useEffect(() => {
    const url = targetUserId ? `/api/chat/stream?user=${encodeURIComponent(targetUserId)}` : "/api/chat/stream";
    const source = new EventSource(url);
    source.onopen = () => setConnection("live");
    source.onerror = () => setConnection(source.readyState === EventSource.CLOSED ? "offline" : "connecting");
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type: string; conversation?: ConversationView };
        if (data.type === "conversation" && data.conversation) {
          setConv(data.conversation);
          setConnection("live");
        }
      } catch {
        // 형식이 맞지 않는 이벤트는 무시한다.
      }
    };
    return () => source.close();
  }, [targetUserId]);

  // ─── 읽음 처리: 화면을 보고 있을 때 상대방의 새 메시지가 있으면 읽음으로 기록 ───
  const markRead = useCallback(() => {
    if (markingRef.current || document.visibilityState !== "visible") return;
    markingRef.current = true;
    markChatConversationRead(targetUserId)
      .catch(() => undefined)
      .finally(() => {
        markingRef.current = false;
      });
  }, [targetUserId]);

  useEffect(() => {
    if (conv.unread > 0) markRead();
  }, [conv.unread, conv.messages.length, markRead]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && conv.unread > 0) markRead();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [conv.unread, markRead]);

  // ─── 스크롤: 처음엔 맨 아래, 이후엔 맨 아래 근처에 있을 때나 내가 보냈을 때만 따라 내려감 ───
  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    stickRef.current = true;
    setShowJump(false);
  }, []);

  useLayoutEffect(() => {
    const count = conv.messages.length;
    const prev = lastCountRef.current;
    lastCountRef.current = count;
    if (count === prev) return;
    const last = conv.messages[count - 1];
    // 자동으로 따라갈 때는 즉시 스크롤한다(부드러운 스크롤 도중 새 메시지가 오면 "맨 아래가 아님"으로 오판한다).
    if (prev === 0 || stickRef.current || last?.role === viewer) scrollToBottom();
    else setShowJump(true);
  }, [conv.messages, viewer, scrollToBottom]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
    stickRef.current = near;
    if (near) setShowJump(false);
  };

  // ─── 입력창 높이: 내용에 맞춰 최대 약 6줄까지 늘어남 ───
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  // ─── 보내기 ───────────────────────────────────────────────────────────
  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setError(null);
    setSending(true);
    setText("");
    try {
      const result = await sendChatMessage(body, targetUserId);
      if (!result.ok) {
        setError(result.error);
        setText(body);
      } else {
        const message: ChatMessageView = result.message;
        setConv((c) => (c.messages.some((m) => m.id === message.id) ? c : { ...c, messages: [...c.messages, message] }));
      }
    } catch {
      setError("메시지를 보내지 못했습니다. 잠시 후 다시 시도해 주십시오.");
      setText(body);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 등 IME 조합 중의 Enter는 글자 확정용이므로 보내지 않는다.
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    void send();
  };

  // 내 메시지 중 상대방이 읽은 마지막 것
  const lastReadMineId = (() => {
    if (!conv.otherReadAt) return undefined;
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      const m = conv.messages[i];
      if (m.role === viewer && m.createdAt <= conv.otherReadAt) return m.id;
    }
    return undefined;
  })();

  const inputId = `chat-input-${targetUserId ?? "me"}`;

  return (
    <div className={`relative flex flex-col overflow-hidden surface ${className}`}>
      <div className="absolute right-4 top-3 z-10 flex items-center gap-1.5 text-[11px] text-ink-muted" title={connection === "live" ? "실시간 연결됨" : undefined}>
        <span
          aria-hidden
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            connection === "live" ? "bg-[var(--status-good)]" : connection === "connecting" ? "bg-[var(--status-warning)]" : "bg-[var(--status-critical)]"
          }`}
        />
        {connection === "live" ? <span className="sr-only">실시간 연결됨</span> : connection === "connecting" ? "연결 중…" : "연결이 끊겼습니다. 새로고침해 주십시오."}
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label="채팅 메시지"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
      >
        {conv.messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink-muted">{emptyText ?? "아직 주고받은 메시지가 없습니다."}</p>
        ) : (
          <ol className="space-y-2">
            {conv.messages.map((m, i) => {
              const prev = conv.messages[i - 1];
              const mine = m.role === viewer;
              const newDay = !prev || formatDate(prev.createdAt) !== formatDate(m.createdAt);
              const grouped = !newDay && prev && prev.role === m.role && prev.authorName === m.authorName;
              return (
                <li key={m.id}>
                  {newDay && (
                    <p className="my-4 text-center text-[11px] tabular-nums text-ink-muted">{formatDate(m.createdAt)}</p>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "" : "mt-3"}`}>
                    <div className={`flex max-w-[85%] flex-col ${mine ? "items-end" : "items-start"}`}>
                      {!grouped && !mine && (
                        <p className="mb-1 px-1 text-[11px] text-ink-muted">
                          {m.role === "admin" ? `운영자 ${m.authorName}` : m.authorName}
                        </p>
                      )}
                      <div className={`flex min-w-0 max-w-full items-end gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`min-w-0 rounded-[1.125rem] px-3.5 py-2.5 text-[14.5px] leading-relaxed ${
                            mine
                              ? "bg-[var(--inverse-bg)] text-[var(--inverse-fg)]"
                              : m.role === "admin"
                                ? "bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-card))] text-ink"
                                : "bg-[var(--surface-card-2)] text-ink"
                          }`}
                        >
                          {m.topic && (
                            <span className={`mb-0.5 block text-[10px] font-medium ${mine ? "opacity-70" : "text-ink-muted"}`}>
                              {m.topic}
                            </span>
                          )}
                          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{m.text}</p>
                        </div>
                        <span className="shrink-0 pb-0.5 text-[10px] text-ink-muted">
                          {m.id === lastReadMineId && <span className="mr-1 text-ink-secondary">읽음</span>}
                          {formatTime(m.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="btn btn-primary btn-sm absolute bottom-24 left-1/2 -translate-x-1/2 shadow-[var(--shadow-raised)]"
        >
          새 메시지
        </button>
      )}

      <div className="border-t border-[var(--border-hairline)] p-3 sm:p-4">
        <label htmlFor={inputId} className="sr-only">
          메시지
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder={placeholder ?? "메시지"}
            className="max-h-40 min-h-[42px] flex-1 resize-none rounded-[1.25rem] border border-[var(--border-strong)] bg-card px-4 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-muted"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !text.trim()}
            className="btn btn-primary h-[42px] shrink-0"
          >
            보내기
          </button>
        </div>
        {error ? (
          <p className="mt-2 px-1 text-[11px] text-[var(--status-critical)]">{error}</p>
        ) : (
          <p className="mt-2 hidden px-1 text-[11px] text-ink-muted sm:block">Enter 보내기 · Shift+Enter 줄바꿈</p>
        )}
      </div>
    </div>
  );
}
