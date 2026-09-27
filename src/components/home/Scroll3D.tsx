"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// 스크롤에 따라 요소를 3D로 움직이는 틀.
// - 화면 아래에서 들어올 때: 기울어진 채 뒤쪽(깊이)에서 앞으로 나오며 제자리에 선다.
// - 화면 위로 빠져나갈 때: 반대쪽으로 살짝 젖혀지며 작아지고 흐려진다.
// - 제자리(화면 가운데 부근)에서는 변환이 없어 글자가 선명하게 읽힌다.
// 모든 요소가 스크롤 리스너 하나와 requestAnimationFrame 하나를 함께 쓰고, React 렌더링 없이 style만 바꾼다.
// "동작 줄이기" 설정이거나 JavaScript가 없으면 아무 변환 없이 그대로 보인다.

export type Scroll3DVariant = "rise" | "left" | "right" | "flip" | "zoom" | "hero";

type Entry = { el: HTMLElement; variant: Scroll3DVariant; offset: number; depth: number };

const entries = new Set<Entry>();
let rafId = 0;
let listening = false;
let reduced = false;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

function apply(entry: Entry, vh: number) {
  const { el, variant, offset, depth } = entry;
  const rect = el.getBoundingClientRect();
  if (variant === "hero") {
    // 첫 화면 글자: 스크롤할수록 느리게 올라가며(패럴랙스) 뒤로 젖혀지고 흐려진다.
    const p = clamp(-rect.top / Math.max(1, rect.height));
    el.style.transform = p > 0 ? `perspective(1200px) translate3d(0, ${p * 90}px, ${-p * 160}px) rotateX(${p * 18}deg)` : "";
    el.style.opacity = p > 0 ? String(1 - p * 0.9) : "";
    return;
  }
  // 들어오는 진행도: 요소 윗변이 화면 맨 아래(0)에서 화면 높이의 62% 지점(1)에 올 때까지
  const enter = ease(clamp((vh - rect.top) / (vh * 0.38) - offset));
  // 나가는 진행도: 요소 아랫변이 화면 높이의 30% 지점에서 맨 위(0)로 갈 때까지
  const exit = clamp((vh * 0.3 - rect.bottom) / (vh * 0.3));
  const k = 1 - enter; // 남은 이동량
  let t = "";
  switch (variant) {
    case "rise":
      t = `translate3d(0, ${k * 110}px, ${-k * 220 * depth}px) rotateX(${k * 38}deg)`;
      break;
    case "left":
      t = `translate3d(${-k * 140}px, ${k * 30}px, ${-k * 200 * depth}px) rotateY(${-k * 42}deg)`;
      break;
    case "right":
      t = `translate3d(${k * 140}px, ${k * 30}px, ${-k * 200 * depth}px) rotateY(${k * 42}deg)`;
      break;
    case "flip":
      t = `translate3d(0, ${k * 60}px, ${-k * 120 * depth}px) rotateX(${-k * 80}deg)`;
      break;
    case "zoom":
      t = `translate3d(0, ${k * 50}px, ${-k * 420 * depth}px)`;
      break;
  }
  if (exit > 0) t += ` translate3d(0, ${-exit * 30}px, ${-exit * 140}px) rotateX(${-exit * 24}deg)`;
  el.style.transform = enter >= 0.999 && exit <= 0 ? "" : `perspective(1100px) ${t}`;
  el.style.opacity = String(Math.min(0.15 + enter * 0.85, 1 - exit * 0.7));
}

function frame() {
  rafId = 0;
  const vh = window.innerHeight;
  for (const entry of entries) apply(entry, vh);
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(frame);
}

function register(entry: Entry) {
  entries.add(entry);
  if (!listening) {
    listening = true;
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  if (!reduced) apply(entry, window.innerHeight);
  return () => {
    entries.delete(entry);
    entry.el.style.transform = "";
    entry.el.style.opacity = "";
    if (entries.size === 0 && listening) {
      listening = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }
  };
}

export default function Scroll3D({
  children,
  variant = "rise",
  offset = 0,
  depth = 1,
  className = "",
  style,
}: {
  children: ReactNode;
  variant?: Scroll3DVariant;
  /** 0~0.5: 같은 줄의 카드가 차례로 들어오도록 진행도를 늦춘다 */
  offset?: number;
  /** 깊이(앞뒤 이동) 배율 */
  depth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return register({ el, variant, offset, depth });
  }, [variant, offset, depth]);
  return (
    <div ref={ref} className={`scroll3d ${className}`} style={style}>
      {children}
    </div>
  );
}
