"use client";

import { useEffect, useRef, type RefObject } from "react";

// 여정의 배경: 깊이 방향으로 길게 흩어진 입자와 그 사이를 잇는 선.
// 카메라 위치는 Journey가 계산한 진행도(progressRef, 장면 단위)를 그대로 따라가므로
// 스크롤하면 입자가 카메라 옆으로 스쳐 지나가며 장면과 장면 사이를 이어 준다.
// 현재 장면의 대표 색으로 입자 색이 서서히 바뀌고, 스크롤이 빠를수록 입자가 길게 늘어진다.

const DEPTH = 1500;
const COUNT = 360;
const FOCAL = 520;

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export default function JourneyField({
  progressRef,
  tints,
  enabled,
}: {
  progressRef: RefObject<number>;
  tints: string[];
  enabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const span = (tints.length + 2) * DEPTH;
    // 입자: 카메라 경로 둘레의 원통 안에 흩뿌린다.
    const pts = Array.from({ length: COUNT }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = 260 + Math.random() * 1300;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.7, z: Math.random() * span - DEPTH, s: 0.6 + Math.random() * 1.6 };
    });
    const rgb = tints.map(hexToRgb);

    let width = 0;
    let height = 0;
    let raf = 0;
    let camZ = (progressRef.current ?? 0) * DEPTH;
    let running = true;

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
      camZ += (target - camZ) * 0.12;
      const speed = camZ - prev;
      const drift = now * 0.02; // 멈춰 있어도 천천히 흐른다

      // 현재 위치의 색(두 장면 사이는 섞는다)
      const p = camZ / DEPTH;
      const i0 = Math.max(0, Math.min(rgb.length - 1, Math.floor(p)));
      const i1 = Math.min(rgb.length - 1, i0 + 1);
      const f = Math.max(0, Math.min(1, p - i0));
      const col = rgb[i0].map((c, k) => Math.round(c + (rgb[i1][k] - c) * f));

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const sway = Math.sin(p * 1.7) * 60;

      const projected: { x: number; y: number; d: number }[] = [];
      for (const pt of pts) {
        let dz = pt.z - camZ - drift;
        dz = ((dz % span) + span) % span; // 카메라 앞쪽으로 순환
        if (dz < 20) continue;
        const k = FOCAL / dz;
        const x = cx + (pt.x - sway) * k;
        const y = cy + pt.y * k;
        if (x < -50 || x > width + 50 || y < -50 || y > height + 50) continue;
        const near = Math.max(0, 1 - dz / (DEPTH * 3));
        const alpha = 0.12 + near * 0.75;
        ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${alpha})`;
        ctx.lineWidth = Math.max(0.6, pt.s * k * 2.2);
        // 스크롤 속도만큼 꼬리를 그린다(빛의 흐름)
        const tail = Math.min(60, Math.abs(speed) * k * 1.4 + 0.8);
        const dx = (x - cx) / Math.max(1, Math.hypot(x - cx, y - cy));
        const dy = (y - cy) / Math.max(1, Math.hypot(x - cx, y - cy));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - dx * tail * Math.sign(speed || 1), y - dy * tail * Math.sign(speed || 1));
        ctx.stroke();
        if (near > 0.55 && projected.length < 40) projected.push({ x, y, d: near });
      }
      // 가까운 입자끼리 잇는 선(신경망 느낌)
      ctx.lineWidth = 0.6;
      for (let a = 0; a < projected.length; a++) {
        for (let b = a + 1; b < projected.length; b++) {
          const pa = projected[a];
          const pb = projected[b];
          const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${(1 - dist / 130) * 0.25})`;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };

    let onScreen = true;
    const update = () => {
      running = !document.hidden && onScreen;
      if (running && !raf) raf = requestAnimationFrame(frame);
    };
    const onVisibility = update;
    // 여정 구간을 지나 무대가 화면 밖으로 나가면 멈춘다.
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    resize();
    ro.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, progressRef, tints]);

  return <canvas ref={canvasRef} aria-hidden="true" className="journey-field" />;
}
