"use client";

import { useId, useRef, useState, useTransition } from "react";
import { clearAllChatConversations, clearChatConversation } from "@/lib/chatActions";

/**
 * 운영자용 채팅 삭제 버튼. 누르면 확인 창을 띄우고, 창에서 "삭제하기"를 눌러야 지운다(되돌릴 수 없음).
 * targetUserId가 있으면 그 스터디원과의 대화만, 없으면 모든 스터디원과의 대화를 지운다.
 * 지운 결과는 열려 있는 채팅 창(운영자·스터디원 모두)에 실시간 스트림으로 곧바로 반영된다.
 */
export default function ClearChatButton({ targetUserId, targetName }: { targetUserId?: string; targetName?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const all = targetUserId === undefined;

  const open = () => {
    setError(null);
    dialogRef.current?.showModal();
  };
  const close = () => {
    if (!pending) dialogRef.current?.close();
  };
  const confirm = () =>
    startTransition(async () => {
      try {
        const result = all ? await clearAllChatConversations() : await clearChatConversation(targetUserId);
        if (result.ok) dialogRef.current?.close();
        else setError(result.error);
      } catch {
        setError("삭제하지 못했습니다. 잠시 후 다시 시도해 주십시오.");
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-lg border border-[color-mix(in_srgb,var(--status-critical)_45%,transparent)] px-2.5 py-1 text-xs font-bold text-[var(--status-critical)] transition hover:bg-[color-mix(in_srgb,var(--status-critical)_10%,transparent)]"
      >
        {all ? "모든 채팅 삭제" : "대화 전체 삭제"}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // 바깥(배경)을 누르면 닫는다.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm surface p-0 text-ink shadow-xl backdrop:bg-black/50"
      >
        <div className="p-5">
          <h2 id={titleId} className="text-lg font-black text-ink">
            {all ? "모든 채팅을 삭제하시겠습니까?" : `${targetName ?? "이 스터디원"}님과의 대화를 삭제하시겠습니까?`}
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            {all
              ? "지금까지 모든 스터디원과 주고받은 메시지가 즉시 삭제되며 되돌릴 수 없습니다."
              : "지금까지 주고받은 메시지가 모두 즉시 삭제되며 되돌릴 수 없습니다."}{" "}
            스터디원의 채팅 화면과 피드백함에서도 사라집니다.
          </p>
          {error && <p className="mt-3 text-sm font-bold text-[var(--status-critical)]">{error}</p>}
        </div>
        <div className="flex gap-2 border-t border-[var(--border-hairline)] p-4">
          <button
            type="button"
            onClick={close}
            disabled={pending}
            autoFocus
            className="flex-1 rounded-lg border border-[var(--border-hairline)] px-4 py-2.5 text-sm font-bold text-ink-secondary hover:bg-[var(--surface-card-2)] disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--status-critical)" }}
          >
            {pending ? "삭제하는 중…" : "삭제하기"}
          </button>
        </div>
      </dialog>
    </>
  );
}
