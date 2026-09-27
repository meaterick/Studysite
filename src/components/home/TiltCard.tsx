"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * 포인터를 따라 3D로 살짝 기울고, 포인터 위치에 빛 반사가 생기는 카드 틀.
 * 마우스처럼 정밀한 포인터에서만 동작하고, "동작 줄이기" 설정이면 기울지 않는다.
 * 안의 내용(링크·글자)은 그대로 두고 겉모습만 바꾼다.
 */
export default function TiltCard({
  children,
  className = "",
  max = 8,
  glow = "var(--series-blue)",
}: {
  children: ReactNode;
  className?: string;
  /** 최대 기울기(도) */
  max?: number;
  /** 가장자리 빛 색 */
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const enabled = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !enabled()) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.dataset.active = "true";
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.dataset.active = "false";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`tilt-card ${className}`}
      style={{ "--glow": glow } as CSSProperties}
    >
      <div className="tilt-card__inner h-full">{children}</div>
      <span aria-hidden="true" className="tilt-card__glare" />
    </div>
  );
}
