"use client";

import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { markWorksheetField, saveWorksheet } from "@/lib/studyActions";
import { useUserScope } from "./UserScope";
import { formatDateTime } from "@/lib/datetime";

type Mark = "ok" | "weak";

/**
 * 백지공부 시트: 자료를 보지 않고 기억나는 대로 채운 뒤(인출 연습) 제출하면,
 * 이번 주 단계 목표·키워드가 열리고 칸마다 "잘 떠올림 / 부족함"을 스스로 표시한다.
 * 작성 중인 내용은 브라우저에 임시 보관되어 새로고침해도 사라지지 않는다.
 */
export default function Worksheet({
  slug,
  fields,
  saved,
  savedAt,
  submittedAt,
  marks,
  review,
}: {
  slug: string;
  fields: { label: string; hint?: string }[];
  saved: Record<string, string>;
  savedAt?: string;
  submittedAt?: string;
  marks: Record<string, Mark>;
  /** 제출 후에만 서버가 내려주는 비교 자료 */
  review?: ReactNode;
}) {
  const uid = useUserScope();
  const draftKey = `aegis-worksheet-draft:${uid}:${slug}`;
  const [values, setValues] = useState<Record<string, string>>(saved);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  // 서버에 저장하지 않은 작성 내용이 브라우저에 남아 있으면 "불러오기"를 제안한다.
  // (렌더링 중에 localStorage를 읽으면 서버 렌더링 결과와 어긋나므로 외부 저장소로 구독한다.)
  const draftRaw = useSyncExternalStore(
    subscribeStorage,
    () => readDraft(draftKey),
    () => null
  );
  const draft = parseDraft(draftRaw);
  const draftIsNewer =
    !!draft && draft.at > (savedAt ?? "") && JSON.stringify(draft.values) !== JSON.stringify(values);

  const update = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    try {
      localStorage.setItem(draftKey, JSON.stringify({ values: next, at: new Date().toISOString() }));
    } catch {
      // 저장 공간이 막혀 있어도 작성은 계속할 수 있다
    }
  };

  const persist = (submit: boolean) => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveWorksheet(slug, values, submit);
        if (!result.ok) {
          setMessage({ tone: "error", text: result.error });
          return;
        }
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        setMessage({ tone: "ok", text: submit ? "제출했습니다. 아래 비교 자료로 스스로 점검해 보십시오." : "임시 저장했습니다." });
      } catch {
        setMessage({ tone: "error", text: "저장에 실패했습니다. 잠시 후 다시 시도해 주십시오." });
      }
    });
  };

  const mark = (key: string, value: Mark) => {
    startTransition(async () => {
      await markWorksheetField(slug, key, value);
    });
  };

  const filled = fields.filter((_, i) => (values[String(i)] ?? "").trim()).length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border-hairline)] bg-card p-5">
        {draftIsNewer && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--surface-card-2)] px-3 py-2 text-sm print:hidden">
            <span className="text-ink-secondary">저장하지 않은 작성 내용이 이 브라우저에 남아 있습니다.</span>
            <button
              type="button"
              onClick={() => setValues(draft!.values)}
              className="rounded-md border border-[var(--border-hairline)] px-3 py-1 text-xs font-bold text-ink-secondary hover:bg-[var(--surface-card)]"
            >
              불러오기
            </button>
          </div>
        )}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-ink">백지공부 시트</h3>
            <p className="text-xs text-ink-muted">
              학습 자료를 닫고 답하십시오. ({fields.length}문항 중 {filled}문항 작성)
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-[var(--surface-card-2)]"
          >
            인쇄·PDF 저장
          </button>
        </div>
        <div className="space-y-4">
          {fields.map((f, i) => {
            const key = String(i);
            return (
              <div key={f.label} className="rounded-lg border border-[var(--border-hairline)] bg-page px-3 py-3">
                <label htmlFor={`ws-${key}`} className="mb-1 block text-sm font-bold text-ink">
                  {f.label}
                </label>
                {f.hint && <p className="mb-2 text-xs text-ink-muted">{f.hint}</p>}
                <textarea
                  id={`ws-${key}`}
                  value={values[key] ?? ""}
                  onChange={(e) => update(key, e.target.value)}
                  rows={4}
                  maxLength={4000}
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-card px-3 py-2 text-sm text-ink outline-none focus:border-[var(--series-blue)] print:border-dashed"
                />
                {submittedAt && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 print:hidden">
                    <span className="text-xs text-ink-muted">비교 결과:</span>
                    {(["ok", "weak"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        disabled={pending}
                        aria-pressed={marks[key] === m}
                        onClick={() => mark(key, m)}
                        className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                          marks[key] === m
                            ? m === "ok"
                              ? "bg-[var(--status-good)] text-white"
                              : "bg-[var(--status-critical)] text-white"
                            : "border border-[var(--border-hairline)] text-ink-secondary hover:bg-[var(--surface-card-2)]"
                        }`}
                      >
                        {m === "ok" ? "충분히 떠올림" : "보완 필요"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => persist(true)}
            disabled={pending}
            className="rounded-lg bg-[var(--series-blue)] px-5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "저장 중…" : submittedAt ? "수정 내용 저장" : "제출 후 비교 자료 보기"}
          </button>
          {!submittedAt && (
            <button
              type="button"
              onClick={() => persist(false)}
              disabled={pending}
              className="rounded-lg border border-[var(--border-hairline)] px-4 py-2 text-sm font-bold text-ink-secondary hover:bg-[var(--surface-card-2)]"
            >
              임시 저장
            </button>
          )}
          {submittedAt && (
            <span className="text-xs text-[var(--status-good)]">제출 완료 · {formatDateTime(submittedAt)}</span>
          )}
          {message && (
            <p className={`text-sm ${message.tone === "ok" ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"}`} aria-live="polite">
              {message.text}
            </p>
          )}
        </div>
      </div>
      {review}
    </div>
  );
}

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readDraft(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseDraft(raw: string | null): { values: Record<string, string>; at: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.at === "string" && parsed.values ? parsed : null;
  } catch {
    return null;
  }
}
