"use client";

import { useEffect } from "react";

const HIGHLIGHT = ["ring-2", "ring-[var(--accent)]", "ring-offset-2", "ring-offset-[var(--surface-page)]", "rounded-xl"];

/** 주소의 #id 위치로 이동한다. 대상이 접힌 <details> 안에 있으면 펼친 뒤 스크롤하고 잠깐 강조한다. */
export default function HashTarget() {
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      for (let d = el.closest("details"); d; d = d.parentElement?.closest("details") ?? null) d.open = true;
      if (el instanceof HTMLDetailsElement) el.open = true;
      // 위쪽 코드 편집기 등이 늦게 그려지면서 위치가 밀릴 수 있어, 사용자가 직접 스크롤하기 전까지 몇 번 다시 맞춘다.
      let userMoved = false;
      const stop = () => (userMoved = true);
      const opts = { once: true, passive: true } as const;
      window.addEventListener("wheel", stop, opts);
      window.addEventListener("touchstart", stop, opts);
      window.addEventListener("keydown", stop, opts);
      const align = () => !userMoved && el.scrollIntoView({ block: "start" });
      requestAnimationFrame(align);
      const timers = [250, 700, 1500].map((ms) => window.setTimeout(align, ms));
      el.classList.add(...HIGHLIGHT);
      window.setTimeout(() => {
        el.classList.remove(...HIGHLIGHT);
        timers.forEach(clearTimeout);
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("keydown", stop);
      }, 1800);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  return null;
}
