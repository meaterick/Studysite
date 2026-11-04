"use client";

import { useEffect, useRef, useState } from "react";

/** 화면에 들어오면 0부터 목표 숫자까지 올라가는 숫자. 서버 렌더링과 "동작 줄이기"에서는 최종 값을 보여 준다. */
export default function CountUp({
  value,
  duration = 1200,
  scene,
}: {
  value: number;
  duration?: number;
  /** 메인 화면 여정 모드에서 이 장면이 보일 때 올라간다 */
  scene?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (scene !== undefined && document.documentElement.dataset.motion === "full") {
      // 여정 모드: 모든 장면이 한 화면에 겹쳐 있으므로 화면 교차 대신 장면 전환 이벤트를 기다린다.
      const onActive = (e: Event) => {
        if ((e as CustomEvent<number>).detail === scene) run();
      };
      window.addEventListener("journey:active", onActive);
      return () => {
        window.removeEventListener("journey:active", onActive);
        cancelAnimationFrame(raf);
      };
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      run();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, scene]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString("ko-KR")}
    </span>
  );
}
