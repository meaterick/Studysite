"use client";

import { useActionState, useId, useRef } from "react";
import { deleteMyAccount } from "@/lib/accountActions";

/**
 * 회원 탈퇴 버튼. 누르면 삭제되는 내용을 보여 주는 확인 창을 띄우고, 창에서 "탈퇴하기"를 누르면
 * 바로 탈퇴한다(되돌릴 수 없음).
 */
export default function DeleteAccountButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(deleteMyAccount, null);
  const titleId = useId();

  const close = () => {
    if (!pending) dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        // 되돌릴 수 없는 동작의 시작 버튼은 눈에 덜 띄는 외곽선 모양으로 두고, 확인 창에서만 빨간 버튼을 쓴다.
        className="btn border-[color-mix(in_srgb,var(--status-critical)_40%,transparent)] text-[var(--status-critical)] hover:bg-[color-mix(in_srgb,var(--status-critical)_7%,transparent)]"
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
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="surface m-auto w-[calc(100%-2rem)] max-w-sm p-0 text-ink shadow-[var(--shadow-raised)] backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <form action={formAction}>
          <div className="p-5">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              정말 탈퇴하시겠습니까?
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">탈퇴하면 아래 내용이 즉시 삭제되며 되돌릴 수 없습니다.</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-secondary">
              <li>계정 정보(이름·이메일)</li>
              <li>단계별 진도, 확인 문제·서술형 답, 백지공부</li>
              <li>과제 작업 공간, 제출한 과제와 첨부 파일, 채점 결과</li>
              <li>운영자와 주고받은 채팅</li>
            </ul>
            {state?.error && <p className="mt-3 text-sm font-semibold text-[var(--status-critical)]">{state.error}</p>}
          </div>
          <div className="flex gap-2 border-t border-[var(--border-hairline)] p-4">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              autoFocus
              className="btn btn-secondary flex-1"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn btn-danger flex-1"
            >
              {pending ? "탈퇴하는 중…" : "탈퇴하기"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
