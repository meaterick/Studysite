"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDate, formatTime } from "@/lib/datetime";
import type { InboxItemView } from "./types";

/** 운영자 채팅 목록. 새 메시지가 오면 실시간으로 순서와 안 읽은 수가 바뀐다. */
export default function ChatInbox({ initial }: { initial: InboxItemView[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const selected = pathname.startsWith("/operator/chat/") ? decodeURIComponent(pathname.slice("/operator/chat/".length)) : null;

  useEffect(() => {
    const source = new EventSource("/api/chat/stream?inbox=1");
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type: string; items?: InboxItemView[] };
        if (data.type === "inbox" && data.items) setItems(data.items);
      } catch {
        // 무시
      }
    };
    return () => source.close();
  }, []);

  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q)) : items;
  const today = formatDate(new Date().toISOString());

  return (
    <aside
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-card ${
        selected ? "hidden lg:flex" : "flex"
      } h-[min(72dvh,720px)] min-h-[420px]`}
    >
      <div className="border-b border-[var(--border-hairline)] p-3">
        <label htmlFor="chat-inbox-search" className="sr-only">
          스터디원 검색
        </label>
        <input
          id="chat-inbox-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름·이메일 검색"
          className="w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-1.5 text-sm text-ink outline-none focus:border-[var(--series-orange)]"
        />
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {shown.length === 0 && <li className="p-4 text-sm text-ink-muted">스터디원이 없습니다.</li>}
        {shown.map((item) => {
          const active = item.userId === selected;
          return (
            <li key={item.userId}>
              <Link
                href={`/operator/chat/${encodeURIComponent(item.userId)}`}
                aria-current={active ? "page" : undefined}
                className={`block border-b border-[var(--border-hairline)] px-3 py-2.5 transition ${
                  active ? "bg-[color-mix(in_srgb,var(--series-orange)_12%,transparent)]" : "hover:bg-[var(--surface-card-2)]"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold text-ink">{item.name}</span>
                  {item.updatedAt && (
                    <span className="shrink-0 text-[10px] text-ink-muted">
                      {formatDate(item.updatedAt) === today ? formatTime(item.updatedAt) : formatDate(item.updatedAt)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-ink-muted">
                    {item.lastText ? `${item.lastRole === "admin" ? "운영자: " : ""}${item.lastText}` : item.email}
                  </span>
                  {item.unread > 0 && (
                    <span className="shrink-0 rounded-full bg-[var(--series-orange)] px-1.5 text-[10px] font-bold text-white">
                      {item.unread}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
