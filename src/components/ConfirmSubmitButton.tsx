"use client";

import type { ReactNode } from "react";

/** 되돌릴 수 없는 폼 제출(계정 삭제 등) 전에 한 번 더 묻는 버튼. 취소하면 제출하지 않는다. */
export default function ConfirmSubmitButton({ message, className, children }: { message: string; className?: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
