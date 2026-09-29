"use client";

import { useId, useRef, useState } from "react";

const DELETE_HREF = "/api/auth/google?intent=delete_account";

/**
 * 회원 탈퇴 버튼. 누르면 바로 탈퇴 절차(Google 재인증 → 즉시 삭제)로 가지 않고, 무엇이 삭제되는지
 * 보여 주는 확인 창을 띄운다. "되돌릴 수 없음"에 동의해야 탈퇴를 계속할 수 있다.
 */
export default function DeleteAccountButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [agreed, setAgreed] = useState(false);
  const titleId = useId();
  const checkId = useId();

  const open = () => {
    setAgreed(false);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="block w-full rounded-lg px-4 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
        style={{ background: "var(--status-critical)" }}
      >
        회원 탈퇴
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // 바깥(배경)을 누르면 닫는다.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-[var(--border-hairline)] bg-card p-0 text-ink shadow-xl backdrop:bg-black/50"
      >
        <div className="p-5">
          <h2 id={titleId} className="text-lg font-black text-ink">
            정말 탈퇴하시겠습니까?
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">탈퇴하면 아래 내용이 즉시 삭제되며 되돌릴 수 없습니다.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-secondary">
            <li>계정 정보(이름·이메일)</li>
            <li>단계별 진도, 확인 문제·서술형 답, 백지공부</li>
            <li>과제 작업 공간, 제출한 과제와 첨부 파일, 채점 결과</li>
            <li>운영자와 주고받은 채팅</li>
          </ul>
          <label htmlFor={checkId} className="mt-4 flex items-start gap-2 text-sm font-bold text-ink">
            <input
              id={checkId}
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--status-critical)]"
            />
            삭제된 정보는 복구할 수 없다는 것을 이해했습니다.
          </label>
          <p className="mt-3 text-xs text-ink-muted">계속하면 Google 계정으로 본인 확인을 한 번 더 거친 뒤 탈퇴가 완료됩니다.</p>
        </div>
        <div className="flex gap-2 border-t border-[var(--border-hairline)] p-4">
          <button
            type="button"
            onClick={close}
            autoFocus
            className="flex-1 rounded-lg border border-[var(--border-hairline)] px-4 py-2.5 text-sm font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]"
          >
            취소
          </button>
          {agreed ? (
            <a
              href={DELETE_HREF}
              className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-bold text-white hover:opacity-90"
              style={{ background: "var(--status-critical)" }}
            >
              탈퇴하기
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-lg px-4 py-2.5 text-sm font-bold text-white opacity-40"
              style={{ background: "var(--status-critical)" }}
            >
              탈퇴하기
            </button>
          )}
        </div>
      </dialog>
    </>
  );
}
