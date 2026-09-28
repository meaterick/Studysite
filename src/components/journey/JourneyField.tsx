"use client";

import { useEffect, useRef, type RefObject } from "react";

// 장면 뒤의 배경: 깊이 방향으로 흩어진 작은 점들과 가까운 점을 잇는 아주 옅은 선.
// 카메라는 Journey가 계산한 진행도(progressRef, 장면 단위)를 따라가므로 스크롤하면 점들이 옆으로 스쳐 지나간다.
// 색은 흰색 한 가지만 쓰고, 스크롤할 때만 짧게 늘어나 움직임을 암시한다.

const DEPTH = 1200;
const COUNT = 240;
const FOCAL = 560;

export default function JourneyField({ progressRef, enabled }: { progressRef: RefObject<number>; enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const span = 6 * DEPTH;
    const pts = Array.from({ length: COUNT }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = 320 + Math.random() * 1400;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.65, z: Math.random() * span, s: 0.5 + Math.random() };
    });

    let width = 0;
    let height = 0;
    let raf = 0;
    let camZ = (progressRef.current ?? 0) * DEPTH;
    let running = true;
    let onScreen = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!running) return;
      const target = (progressRef.current ?? 0) * DEPTH;
      const prev = camZ;
      camZ += (target - camZ) * 0.1;
      const speed = camZ - prev;
      const drift = now * 0.012;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);
      const near: { x: number; y: number }[] = [];
      for (const pt of pts) {
        let dz = pt.z - camZ - drift;
        dz = ((dz % span) + span) % span;
        if (dz < 30) continue;
        const k = FOCAL / dz;
        const x = cx + pt.x * k;
        const y = cy + pt.y * k;
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
        const closeness = Math.max(0, 1 - dz / (DEPTH * 4));
        const alpha = 0.06 + closeness * 0.45;
        const size = Math.max(0.6, pt.s * k * 1.6);
        const tail = Math.min(24, Math.abs(speed) * k * 0.9);
        if (tail > 1) {
          const len = Math.hypot(x - cx, y - cy) || 1;
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - ((x - cx) / len) * tail, y - ((y - cy) / len) * tail);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
        if (closeness > 0.6 && near.length < 28) near.push({ x, y });
      }
      ctx.lineWidth = 0.5;
      for (let a = 0; a < near.length; a++) {
        for (let b = a + 1; b < near.length; b++) {
          const d = Math.hypot(near[a].x - near[b].x, near[a].y - near[b].y);
          if (d < 140) {
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 140) * 0.08})`;
            ctx.beginPath();
            ctx.moveTo(near[a].x, near[a].y);
            ctx.lineTo(near[b].x, near[b].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const update = () => {
      running = !document.hidden && onScreen;
      if (running && !raf) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    const ro = new ResizeObserver(resize);
    resize();
    ro.observe(canvas);
    io.observe(canvas);
    document.addEventListener("visibilitychange", update);
    raf = requestAnimationFrame(frame);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled, progressRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className="journey-field" />;
}
