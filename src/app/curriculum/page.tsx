import type { Metadata } from "next";
import { syllabus } from "@/content/syllabus";
import { WEEKS } from "@/content/weeks";
import { TIER_INFO, type Tier } from "@/content/tiers";
import Markdown from "@/components/MarkdownBlocks";
import Link from "next/link";

export const metadata: Metadata = { title: "커리큘럼" };

// 커리큘럼은 처음 온 사람이 과정 전체의 구조(목표·4부 구성·주차 페이지·한 주 순서·단계 구분)를 파악하는 곳이다.
// 주차별 세부 내용은 주차별 자료에서 본다.

const PHASE_INFO: Record<string, { color: string; focus: string }> = {
  "1부 · 기초": { color: "var(--series-blue)", focus: "벡터·확률·미분과 Python에서 출발해 고전 머신러닝까지" },
  "2부 · 딥러닝": { color: "var(--series-aqua)", focus: "신경망을 직접 만들고 역전파로 학습시킨 뒤 CNN으로 실전 학습" },
  "3부 · 현대 AI": { color: "var(--series-violet)", focus: "Attention과 Transformer, LLM이 만들어지는 과정" },
  "4부 · 활용·책임": { color: "var(--series-orange)", focus: "프롬프트·RAG·에이전트 활용, 책임 있는 AI와 캡스톤" },
};

const TABS = [
  { title: "개요", desc: "이번 주 목표, 단계 목록, 지금 할 일" },
  { title: "학습 자료", desc: "단계별 설명 글과 확인 문제" },
  { title: "적용과 복습", desc: "백지공부, 과제, 선택 활동, 복습 노트" },
];

const FLOW = [
  { title: "핵심 단계 학습", place: "학습 자료", desc: "단계별 글을 순서대로 읽습니다." },
  { title: "확인 문제", place: "학습 자료", desc: "단계 끝의 문제로 이해를 확인합니다." },
  { title: "백지공부", place: "적용과 복습", desc: "자료를 덮고 핵심 개념을 설명합니다." },
  { title: "과제", place: "적용과 복습", desc: "배운 내용을 코드와 답안으로 풀어 제출합니다." },
];

const OPTIONAL = ["보충·심화 단계", "서술형", "코딩 실습", "추가 퀴즈", "복습 노트"];

const TIER_DESC: Record<Tier, string> = {
  core: "그 주의 기본 개념",
  supplement: "실무 도구와 다른 방법으로 넓히는 내용",
  advanced: "수식 유도, 최신 기법, 연구 수준의 내용",
};

const START = [
  { title: "로그인", desc: "스터디원 계정으로 로그인" },
  { title: "1주차 열기", desc: "주차별 자료에서 1주차 선택" },
  { title: "지금 할 일", desc: "개요의 「시작하기」부터 진행" },
  { title: "내 진도", desc: "주차별 상태 확인, 이어서 학습" },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-4 scroll-mt-24 text-xl font-black text-ink">
      {children}
    </h2>
  );
}

export default function CurriculumPage() {
  const phases = [...new Set(WEEKS.map((w) => w.phase))];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* ── 머리말 ─────────────────────────────────────────── */}
      <p className="mb-2 text-sm font-bold text-[var(--series-blue)]">8주 커리큘럼</p>
      <h1 className="mb-3 text-2xl font-black leading-tight text-ink sm:text-3xl">{syllabus.title}</h1>
      <p className="max-w-3xl text-sm text-ink-secondary">{syllabus.designNote}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "기간", v: "8주" },
          { k: "구성", v: `${phases.length}부 · ${WEEKS.length}주차` },
          { k: "주차 페이지", v: "개요 · 학습 자료 · 적용과 복습" },
          { k: "단계", v: "핵심 · 보충 · 심화" },
        ].map((f) => (
          <div key={f.k} className="rounded-xl border border-[var(--border-hairline)] bg-card px-4 py-3">
            <dt className="text-xs font-bold text-ink-muted">{f.k}</dt>
            <dd className="mt-0.5 text-sm font-black text-ink">{f.v}</dd>
          </div>
        ))}
      </dl>

      {/* ── 스터디 목표 ────────────────────────────────────── */}
      <div className="mt-10">
        <Markdown source={syllabus.goalsMd} />
      </div>

      {/* ── 4부 구성 ──────────────────────────────────────── */}
      <section className="mt-12">
        <SectionHeading id="phases">8주 · 4부 구성</SectionHeading>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase) => {
            const info = PHASE_INFO[phase] ?? { color: "var(--series-blue)", focus: "" };
            const weeks = WEEKS.filter((w) => w.phase === phase);
            return (
              <li key={phase} className="flex flex-col overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-card">
                <div className="px-4 py-3 text-white" style={{ background: info.color }}>
                  <p className="text-xs font-bold opacity-90">
                    W{weeks[0].number}–W{weeks[weeks.length - 1].number}
                  </p>
                  <p className="font-black">{phase}</p>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="text-sm text-ink-secondary">{info.focus}</p>
                  <ul className="mt-auto space-y-1.5 border-t border-[var(--border-hairline)] pt-3">
                    {weeks.map((w) => (
                      <li key={w.slug} className="text-xs text-ink">
                        <span className="font-black" style={{ color: info.color }}>
                          {w.number}주차
                        </span>{" "}
                        {w.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── 주차 페이지 구성 ───────────────────────────────── */}
      <section className="mt-12">
        <SectionHeading id="week-page">주차 페이지 구성</SectionHeading>
        <ol className="grid gap-3 sm:grid-cols-3">
          {TABS.map((t, i) => (
            <li key={t.title} className="flex items-start gap-3 rounded-xl border border-[var(--border-hairline)] bg-card p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-[var(--series-blue)] text-xs font-black text-[var(--series-blue)]">
                {i + 1}
              </span>
              <div>
                <p className="font-black text-ink">{t.title}</p>
                <p className="mt-0.5 text-sm text-ink-secondary">{t.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 한 주 학습 순서 ────────────────────────────────── */}
      <section className="mt-12">
        <SectionHeading id="flow">한 주 학습 순서</SectionHeading>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.title} className="relative rounded-xl border border-[var(--border-hairline)] bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--series-blue)] text-xs font-black text-white">
                  {i + 1}
                </span>
                <p className="font-black text-ink">{f.title}</p>
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{f.desc}</p>
              <p className="mt-2 inline-block rounded-md bg-[var(--surface-card-2)] px-2 py-0.5 text-xs font-bold text-ink-muted">{f.place}</p>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-3">
          <span className="text-sm font-black text-ink">선택 과정</span>
          {OPTIONAL.map((o) => (
            <span key={o} className="rounded-full bg-[var(--surface-card-2)] px-2.5 py-0.5 text-xs font-bold text-ink-secondary">
              {o}
            </span>
          ))}
        </div>
      </section>

      {/* ── 단계 구분 ──────────────────────────────────────── */}
      <section className="mt-12">
        <SectionHeading id="tiers">단계 구분</SectionHeading>
        <ul className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(TIER_INFO) as Tier[]).map((tier) => {
            const info = TIER_INFO[tier];
            return (
              <li key={tier} className="rounded-xl border border-[var(--border-hairline)] bg-card p-4" style={{ borderTop: `4px solid ${info.color}` }}>
                <p className="flex items-baseline gap-2">
                  <span className="text-lg font-black" style={{ color: info.color }}>
                    {info.label}
                  </span>
                  <span className="text-xs font-bold text-ink-muted">{info.audience}</span>
                  {!info.required && (
                    <span className="ml-auto rounded-md border border-dashed border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">선택</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-ink-secondary">{TIER_DESC[tier]}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── 처음이라면 ─────────────────────────────────────── */}
      <section className="mt-12 rounded-2xl border border-[color-mix(in_srgb,var(--series-blue)_40%,transparent)] bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="start" className="text-xl font-black text-ink">
            처음이라면
          </h2>
          <Link href="/weeks" className="w-full rounded-lg bg-[var(--series-blue)] px-5 py-2.5 text-center text-sm font-bold text-white hover:opacity-90 sm:w-auto">
            주차별 자료 →
          </Link>
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {START.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--series-blue)_12%,transparent)] text-xs font-black text-[var(--series-blue)]">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-black text-ink">{s.title}</p>
                <p className="text-xs text-ink-muted">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 참고자료(펼쳐 보기) ─────────────────────────────── */}
      <details id="resources" className="group mt-10 scroll-mt-24 rounded-xl border border-[var(--border-hairline)] bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="text-lg font-black text-ink">핵심 참고자료</span>
          <span aria-hidden="true" className="text-xs text-ink-muted transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-[var(--border-hairline)] p-4 sm:p-5 [&_h2:first-child]:hidden">
          <Markdown source={syllabus.resourcesMd} />
        </div>
      </details>
    </div>
  );
}
