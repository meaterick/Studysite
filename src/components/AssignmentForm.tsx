"use client";

import { useRef, useState, useTransition } from "react";
import { submitAssignment } from "@/lib/studyActions";

const ACCEPT = ".pdf,.ipynb,.py,.md,.txt,.zip,.png,.jpg,.jpeg,.csv,.json";

export default function AssignmentForm({
  slug,
  initialText,
  initialLinks,
  resubmit,
}: {
  slug: string;
  initialText: string;
  initialLinks: string[];
  resubmit: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = data.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (files.length > 3 || files.some((f) => f.size > 5 * 1024 * 1024) || total > 9 * 1024 * 1024) {
      setMessage({ tone: "error", text: "파일은 최대 3개, 개당 5MB, 합계 9MB까지 첨부할 수 있습니다. 큰 파일은 링크로 제출해주세요." });
      return;
    }
    if (resubmit && !confirm("새 버전으로 다시 제출할까요? 이전 제출물과 채점 기록은 그대로 남습니다.")) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await submitAssignment(slug, data);
        if (result.ok) {
          setMessage({ tone: "ok", text: "제출했습니다. 운영자가 채점하면 이 페이지에 점수와 피드백이 표시됩니다." });
          const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
          if (fileInput) fileInput.value = "";
        } else {
          setMessage({ tone: "error", text: result.error });
        }
      } catch {
        setMessage({ tone: "error", text: "제출에 실패했습니다. 파일 용량을 줄이거나 잠시 뒤 다시 시도해주세요." });
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[var(--border-hairline)] bg-card p-5">
      <div>
        <label htmlFor="assignment-text" className="block text-sm font-bold text-ink">
          리포트 본문
        </label>
        <p className="mb-2 text-xs text-ink-muted">
          과제에서 요구한 결과·해석·실험 기록을 적어주세요. 마크다운처럼 줄바꿈과 목록을 써도 그대로 운영자에게 보입니다.
        </p>
        <textarea
          id="assignment-text"
          name="text"
          defaultValue={initialText}
          rows={12}
          maxLength={20000}
          className="w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-[var(--series-blue)]"
        />
      </div>
      <div>
        <label htmlFor="assignment-links" className="block text-sm font-bold text-ink">
          링크 (Colab · GitHub · 드라이브 등, 한 줄에 하나)
        </label>
        <p className="mb-2 text-xs text-ink-muted">Colab은 &lsquo;링크가 있는 모든 사용자 보기 가능&rsquo;으로 공유 설정을 바꿔주세요. 최대 5개.</p>
        <textarea
          id="assignment-links"
          name="links"
          defaultValue={initialLinks.join("\n")}
          rows={3}
          placeholder="https://colab.research.google.com/drive/..."
          className="w-full rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-2 text-sm text-ink outline-none focus:border-[var(--series-blue)]"
        />
      </div>
      <div>
        <label htmlFor="assignment-files" className="block text-sm font-bold text-ink">
          파일 첨부 (선택)
        </label>
        <p className="mb-2 text-xs text-ink-muted">
          pdf, ipynb, py, md, txt, zip, png, jpg, csv, json · 최대 3개, 개당 5MB, 합계 9MB
          {resubmit && " · 다시 제출할 때는 필요한 파일을 다시 첨부해주세요(이전 버전 파일은 기록에 남습니다)"}
        </p>
        <input
          id="assignment-files"
          type="file"
          name="files"
          multiple
          accept={ACCEPT}
          className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-md file:border-0 file:bg-[var(--surface-card-2)] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-ink-secondary"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "제출 중…" : resubmit ? "새 버전으로 다시 제출" : "과제 제출"}
        </button>
        {message && (
          <p className={`text-sm ${message.tone === "ok" ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"}`} aria-live="polite">
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
