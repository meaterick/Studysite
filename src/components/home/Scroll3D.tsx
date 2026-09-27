"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

// 메인 화면의 모든 요소를 스크롤 위치에 따라 계속 3D로 움직이는 틀.
//
// 요소마다 "화면 가운데에서 얼마나 떨어져 있는가"(d: 화면 아래 끝 +1 … 가운데 0 … 위 끝 -1)를 구하고,
// d에 비례해 기울기·회전·깊이·위치·투명도를 바꾼다. 스크롤하는 동안 모든 요소가 멈추지 않고 움직이며,
// 화면 가운데 띠(|d| < 0.18)에서는 변환이 0이 되어 글자가 선명하게 읽힌다.
//
// - 위치는 변환의 영향을 받지 않는 레이아웃 좌표(offsetTop 체인)로 계산해, 변환이 측정값을 바꾸는 되먹임이 없다.
// - 스크롤 리스너 하나, requestAnimationFrame 하나를 모든 요소가 함께 쓰고 React 렌더링 없이 style만 바꾼다.
// - "동작 줄이기" 설정이거나 JavaScript가 없으면 아무 변환 없이 그대로 보인다.

export type Scroll3DVariant =
  | "barrel" // 원통 위를 지나가듯 앞뒤로 기울며 깊이가 바뀜
  | "left" // 왼쪽에서 회전하며 들어와 왼쪽으로 돌아 나감
  | "right"
  | "flip" // 크게 뒤집힘(제목)
  | "zoom" // 깊이 방향으로 멀어졌다 가까워짐
  | "orbit" // 비스듬히 궤도를 돌듯 회전
  | "parallax" // 회전 없이 깊이에 따라 다른 속도로 미끄러짐(카드 안 요소 등)
  | "hero"; // 첫 화면: 스크롤을 시작하면 뒤로 젖혀지며 멀어짐

type Entry = {
  el: HTMLElement;
  variant: Scroll3DVariant;
  depth: number;
  offset: number;
  top: number;
  height: number;
};

const entries = new Set<Entry>();
let rafId = 0;
let listening = false;
let resizeObserver: ResizeObserver | null = null;

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));
// 가운데 띠에서는 0, 바깥으로 갈수록 부드럽게 커지는 값
const shaped = (d: number) => {
  const a = Math.max(0, Math.abs(d) - 0.18) / 0.82;
  return Math.sign(d) * a * a * (3 - 2 * a);
};

function layoutTop(el: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

function measure(entry: Entry) {
  entry.top = layoutTop(entry.el);
  entry.height = entry.el.offsetHeight;
}

function apply(entry: Entry, scrollY: number, vh: number, amp: number) {
  const { el, variant, depth } = entry;
  if (variant === "hero") {
    const p = clamp(scrollY / (vh * 0.85), 0, 1);
    if (p <= 0) {
      el.style.transform = "";
      el.style.opacity = "";
      return;
    }
    el.style.transform = `perspective(1200px) translate3d(0, ${p * 110 * depth}px, ${-p * 260 * depth}px) rotateX(${p * 22 * depth}deg)`;
    el.style.opacity = String(Math.max(0, 1 - p * (0.6 + 0.4 * depth)));
    return;
  }
  const center = entry.top + entry.height / 2 - scrollY;
  const d0 = clamp((center - vh / 2) / (vh / 2 + entry.height / 2) + entry.offset);
  const d = shaped(d0) * amp;
  const a = Math.abs(d);
  if (a < 0.001) {
    el.style.transform = "";
    el.style.opacity = "";
    return;
  }
  let t = "";
  switch (variant) {
    case "barrel":
      t = `translate3d(0, ${d * 70 * depth}px, ${-a * 260 * depth}px) rotateX(${d * 42}deg)`;
      break;
    case "left":
      t = `translate3d(${-a * 150 * depth}px, ${d * 40}px, ${-a * 240 * depth}px) rotateY(${-d * 48}deg) rotateZ(${d * 3}deg)`;
      break;
    case "right":
      t = `translate3d(${a * 150 * depth}px, ${d * 40}px, ${-a * 240 * depth}px) rotateY(${d * 48}deg) rotateZ(${-d * 3}deg)`;
      break;
    case "flip":
      t = `translate3d(0, ${d * 40}px, ${-a * 160 * depth}px) rotateX(${d * 75}deg)`;
      break;
    case "zoom":
      t = `translate3d(0, ${d * 50}px, ${-a * 480 * depth}px)`;
      break;
    case "orbit":
      t = `translate3d(${d * 60 * depth}px, ${d * 30}px, ${-a * 300 * depth}px) rotateY(${d * 40}deg) rotateX(${d * 20}deg)`;
      break;
    case "parallax":
      t = `translate3d(0, ${d * 46 * depth}px, ${-a * 60 * depth}px)`;
      break;
  }
  el.style.transform = `perspective(1100px) ${t}`;
  el.style.opacity = variant === "parallax" ? String(1 - a * 0.35) : String(Math.max(0.12, 1 - a * a * 0.95));
}

function frame() {
  rafId = 0;
  const vh = window.innerHeight;
  const amp = window.innerWidth < 640 ? 0.7 : 1;
  const y = window.scrollY;
  for (const entry of entries) apply(entry, y, vh, amp);
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(frame);
}

function remeasure() {
  for (const entry of entries) measure(entry);
  schedule();
}

function register(entry: Entry) {
  measure(entry);
  entries.add(entry);
  if (!listening) {
    listening = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    // 글꼴·이미지 로딩이나 내용 변화로 레이아웃이 바뀌면 위치를 다시 잰다.
    resizeObserver = new ResizeObserver(remeasure);
    resizeObserver.observe(document.body);
    document.fonts?.ready.then(remeasure).catch(() => undefined);
  }
  schedule();
  return () => {
    entries.delete(entry);
    entry.el.style.transform = "";
    entry.el.style.opacity = "";
    if (entries.size === 0 && listening) {
      listening = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      resizeObserver?.disconnect();
      resizeObserver = null;
    }
  };
}

export default function Scroll3D({
  children,
  variant = "barrel",
  depth = 1,
  offset = 0,
  as: Tag = "div",
  className = "",
  style,
}: {
  children?: ReactNode;
  variant?: Scroll3DVariant;
  /** 움직임 크기 배율 */
  depth?: number;
  /** -0.3~0.3: 같은 줄의 요소가 서로 조금씩 다르게 움직이도록 위치 기준을 비튼다 */
  offset?: number;
  /** 감쌀 태그(목록 항목이면 "li" 등) */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return register({ el, variant, depth, offset, top: 0, height: 0 });
  }, [variant, depth, offset]);
  return (
    <Tag ref={ref} className={`scroll3d ${className}`} style={style}>
      {children}
    </Tag>
  );
}
