"use client";

import { useEffect, useRef } from "react";

// 메인 화면 첫 화면의 3D 신경망. 외부 라이브러리 없이 캔버스 2D에 원근 투영으로 그린다.
// - 층(4 · 8 · 8 · 3)마다 노드를 원 위에 배치해 입체 MLP를 만들고, 주변에 점 구름(구)을 둔다.
// - 천천히 자동 회전하며, 마우스를 움직이거나 끌면 그 방향으로 기울어진다.
// - 입력층에서 출력층으로 신호(빛 점)가 흘러가고, 도착한 노드가 잠깐 밝아진다.
// - 화면 밖에 있거나 탭이 숨겨지면 멈추고, "동작 줄이기" 설정이면 정지된 한 장면만 그린다.

type Vec3 = { x: number; y: number; z: number };
type Node = Vec3 & { layer: number; glow: number };
type Pulse = { from: number; to: number; t: number; speed: number; hue: string };

const LAYERS = [4, 8, 8, 3];
const LAYER_GAP = 1.15;
const COLORS = ["#3987e5", "#1baf7a", "#9085e9", "#eb6834"];
const PULSE_COLORS = ["#7cc4ff", "#5ff0bd", "#c0b8ff", "#ffb088"];

function buildNodes(): Node[] {
  const nodes: Node[] = [];
  const x0 = (-(LAYERS.length - 1) * LAYER_GAP) / 2;
  LAYERS.forEach((count, layer) => {
    const radius = count === 1 ? 0 : 0.35 + count * 0.07;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + layer * 0.4;
      nodes.push({ x: x0 + layer * LAYER_GAP, y: Math.cos(a) * radius, z: Math.sin(a) * radius, layer, glow: 0 });
    }
  });
  return nodes;
}

function buildCloud(n: number): Vec3[] {
  // 피보나치 구: 점을 구면에 고르게 흩뿌린다.
  const pts: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pts.push({ x: Math.cos(th) * r * 2.9, y: y * 2.9, z: Math.sin(th) * r * 2.9 });
  }
  return pts;
}

export default function NeuralScene({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = buildNodes();
    const cloud = buildCloud(150);
    const edges: [number, number][] = [];
    nodes.forEach((a, i) =>
      nodes.forEach((b, j) => {
        if (b.layer === a.layer + 1) edges.push([i, j]);
      })
    );
    const outgoing = nodes.map((_, i) => edges.filter(([a]) => a === i).map(([, b]) => b));
    const pulses: Pulse[] = [];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rotY = 0.6;
    let rotX = -0.25;
    let targetTiltX = -0.25;
    let targetTiltY = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragVel = 0;
    let running = false;
    let visible = true;
    let raf = 0;
    let lastTime = performance.now();
    let spawnTimer = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) draw(0);
    };

    const project = (p: Vec3) => {
      // Y축 회전 → X축 회전 → 원근 투영
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      const y2 = p.y * cx - z1 * sx;
      const z2 = p.y * sx + z1 * cx;
      const camera = 6.2;
      const scale = (Math.min(width, height) * 0.42 * camera) / (camera + z2) / 2.4;
      return { x: width / 2 + x1 * scale, y: height / 2 + y2 * scale, z: z2, s: scale };
    };

    const spawnPulse = () => {
      const starts = nodes.map((n, i) => (n.layer === 0 ? i : -1)).filter((i) => i >= 0);
      const from = starts[Math.floor(Math.random() * starts.length)];
      const nexts = outgoing[from];
      pulses.push({
        from,
        to: nexts[Math.floor(Math.random() * nexts.length)],
        t: 0,
        speed: 0.9 + Math.random() * 0.6,
        hue: PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)],
      });
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, width, height);
      const proj = nodes.map(project);

      // 점 구름
      for (const p of cloud) {
        const q = project(p);
        const depth = (q.z + 3) / 6; // 0(앞) ~ 1(뒤)
        ctx.fillStyle = `rgba(148, 190, 255, ${0.08 + (1 - depth) * 0.35})`;
        const r = Math.max(0.6, q.s * 0.012);
        ctx.fillRect(q.x - r / 2, q.y - r / 2, r, r);
      }

      // 연결선
      ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        const pa = proj[a];
        const pb = proj[b];
        const depth = ((pa.z + pb.z) / 2 + 2) / 4;
        ctx.strokeStyle = `rgba(120, 170, 255, ${0.05 + (1 - depth) * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // 신호
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.t += dt * pulse.speed;
        if (pulse.t >= 1) {
          nodes[pulse.to].glow = 1;
          const nexts = outgoing[pulse.to];
          if (nexts.length) {
            pulse.from = pulse.to;
            pulse.to = nexts[Math.floor(Math.random() * nexts.length)];
            pulse.t = 0;
          } else {
            pulses.splice(i, 1);
            continue;
          }
        }
        const pa = proj[pulse.from];
        const pb = proj[pulse.to];
        const x = pa.x + (pb.x - pa.x) * pulse.t;
        const y = pa.y + (pb.y - pa.y) * pulse.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, pulse.hue);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // 노드 (뒤에서 앞 순서로)
      const order = proj.map((p, i) => i).sort((a, b) => proj[b].z - proj[a].z);
      for (const i of order) {
        const p = proj[i];
        const n = nodes[i];
        const r = Math.max(2.5, p.s * 0.075) * (1 + n.glow * 0.5);
        const color = COLORS[n.layer % COLORS.length];
        if (n.glow > 0.02) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
          halo.addColorStop(0, `${color}aa`);
          halo.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3.2 * n.glow + r, 0, Math.PI * 2);
          ctx.fill();
        }
        const body = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
        body.addColorStop(0, "#ffffff");
        body.addColorStop(0.35, color);
        body.addColorStop(1, `${color}55`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        n.glow = Math.max(0, n.glow - dt * 1.6);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      if (!dragging) {
        rotY += dt * 0.22 + dragVel;
        dragVel *= 0.94;
        rotX += (targetTiltX - rotX) * 0.05;
        rotY += (targetTiltY - 0) * 0.002;
      }
      spawnTimer -= dt;
      if (spawnTimer <= 0 && pulses.length < 14) {
        spawnPulse();
        spawnTimer = 0.18 + Math.random() * 0.25;
      }
      draw(dt);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        rotY += dx * 0.008;
        rotX = Math.max(-1.1, Math.min(1.1, rotX + dy * 0.006));
        targetTiltX = rotX;
        dragVel = dx * 0.0006;
        lastX = e.clientX;
        lastY = e.clientY;
        if (!running) draw(0);
        return;
      }
      // 끌지 않을 때는 포인터 위치에 따라 살짝 기울인다(화면 전체 기준).
      const nx = (e.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
      const ny = (e.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
      targetTiltX = -0.25 + ny * 0.6;
      targetTiltY = nx * 2;
    };
    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerUp = () => {
      dragging = false;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    const onVisibility = () => (document.hidden ? stop() : start());
    const ro = new ResizeObserver(resize);

    resize();
    ro.observe(canvas);
    io.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    if (reduced) {
      // 동작 줄이기: 몇 개 노드만 밝힌 정지 장면
      nodes.forEach((n, i) => (n.glow = i % 3 === 0 ? 0.8 : 0));
      draw(0);
    } else start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full cursor-grab touch-pan-y active:cursor-grabbing ${className}`}
    />
  );
}
