"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// 메인 화면의 이어지는 장면 구성.
//
// 화면 전체를 덮는 무대(stage)를 스크롤하는 동안 고정하고, 스크롤이 카메라를 3D 공간 안쪽으로 전진시킨다.
// 장면은 깊이 방향으로 한 줄로 놓여, 다음 장면이 멀리서 조용히 다가오고 지나간 장면은 카메라 쪽으로 흐려지며 사라진다.
// 배경의 은은한 빛도 진행도에 따라 자리를 옮겨 장면 사이가 끊기지 않는다.
//
// - 장면마다 스크롤 한 화면 분량을 배정한다. 다만 한 화면을 다 내리지 않아도 된다: 조금만 스크롤하고 멈추면
//   움직이던 방향의 다음(이전) 장면까지 부드럽게 마저 넘어간다(settle). 장면이 멈춘 자리에서는 변환이 0이라 글자가 선명하다.
// - 장면이 화면보다 크면 자동으로 줄여 맞춘다.
// - html[data-motion="full"](JavaScript 켜짐 + 동작 줄이기 아님)일 때만 3D 모드가 되고, 그 밖에는 세로 배치로 보인다.

export interface JourneyScene {
  id: string;
  /** 진행 표시에 쓰는 짧은 이름 */
  label: string;
  content: ReactNode;
}

const DEPTH = 1200; // 장면 사이 깊이(px)
// 장면 자리에서 아주 조금(화면 높이의 1%) 움직인 것은 장면을 그대로 둔다(손이 살짝 닿은 정도의 흔들림 방지).
// 크게 두면 스크롤해도 한동안 아무 변화가 없어 "많이 내려야 넘어가는" 느낌이 된다.
const HOLD = 0.01;
// 멈춘 뒤 이어서 넘길지 정하는 기준(px). 움직이던 방향으로 이만큼만 움직였어도 그쪽 장면으로 넘긴다.
const NUDGE_PX = 8;
// 스크롤이 멈췄다고 보고 장면 자리로 옮기기 시작할 때까지의 대기(ms). 휠 한 칸의 스크롤 이벤트 간격보다는 길어야 한다.
const SETTLE_DELAY = 70;
// 장면 자리를 지나쳐 이 비율(화면 높이 대비)보다 덜 간 채 멈추면 지나친 장면으로 돌아간다.
const CROSS_BACK = 0.25;

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep

export default function Journey({ scenes }: { scenes: JourneyScene[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);
  const [active, setActive] = useState(0);
  const n = scenes.length;

  // 장면 i가 멈춰 있는 스크롤 위치. 첫 장면은 문서 맨 위(처음 열었을 때와 같은 모습)다.
  const sceneScrollTop = useCallback((i: number) => {
    const root = rootRef.current;
    if (!root || i <= 0) return 0;
    return root.getBoundingClientRect().top + window.scrollY + i * window.innerHeight;
  }, []);

  // 장면 자리로 옮기는 스크롤. 브라우저 기본 smooth 스크롤은 거리가 길수록 느리게 오래 움직이고 길이를 정할 수 없어,
  // 처음에 빠르게 움직이다 부드럽게 멈추는(ease-out) 짧은 애니메이션으로 직접 옮긴다.
  // 가까운 자리는 약 0.25초, 장면 하나는 약 0.4초, 멀리 건너뛰어도 0.6초를 넘지 않는다.
  const glideRef = useRef(0);
  const stopGlide = useCallback(() => {
    if (!glideRef.current) return;
    cancelAnimationFrame(glideRef.current);
    glideRef.current = 0;
    document.documentElement.style.scrollBehavior = "";
  }, []);
  const glideTo = useCallback(
    (top: number) => {
      stopGlide();
      const from = window.scrollY;
      const dist = top - from;
      if (Math.abs(dist) < 1) return;
      const duration = Math.min(600, 220 + Math.abs(dist) * 0.22);
      const t0 = performance.now();
      // 프레임마다 정확한 위치로 옮겨야 하므로, 옮기는 동안만 html의 scroll-behavior: smooth를 끈다.
      document.documentElement.style.scrollBehavior = "auto";
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        window.scrollTo(0, from + dist * eased);
        if (t < 1) glideRef.current = requestAnimationFrame(step);
        else {
          glideRef.current = 0;
          document.documentElement.style.scrollBehavior = "";
        }
      };
      glideRef.current = requestAnimationFrame(step);
    },
    [stopGlide]
  );

  const goTo = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(n - 1, i));
      glideTo(sceneScrollTop(target));
    },
    [n, sceneScrollTop, glideTo]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || document.documentElement.dataset.motion !== "full") return;

    let raf = 0;
    let lastActive = -1;

    const fit = () => {
      const stage = root.querySelector<HTMLElement>(".journey-stage");
      if (!stage) return;
      // 모바일 주소창 때문에 100vh와 실제 보이는 높이가 다를 수 있어 창 높이로 맞춘다.
      root.style.height = `${n * window.innerHeight}px`;
      stage.style.height = `${window.innerHeight}px`;
      // 장면 안쪽 여백(머리글·진행 표시 자리)은 CSS가 화면 크기마다 정한다.
      const cs = sceneRefs.current[0] ? getComputedStyle(sceneRefs.current[0]) : null;
      const padY = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 150;
      const padX = cs ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) : 40;
      const availH = stage.clientHeight - padY;
      const availW = stage.clientWidth - padX;
      innerRefs.current.forEach((inner) => {
        if (!inner) return;
        inner.style.setProperty("--fit", "1");
        const k = Math.min(1, availH / Math.max(1, inner.scrollHeight), availW / Math.max(1, inner.scrollWidth));
        inner.style.setProperty("--fit", String(Math.max(0.6, k)));
      });
    };

    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY - (root.getBoundingClientRect().top + window.scrollY);
      const raw = clamp(y / vh, 0, n - 1);
      const i = Math.floor(raw);
      const u = raw - i;
      const s = Math.min(n - 1, i + smooth(clamp((u - HOLD) / (1 - HOLD))));
      progressRef.current = s;
      root.style.setProperty("--journey-progress", String(s / Math.max(1, n - 1)));

      sceneRefs.current.forEach((el, k) => {
        if (!el) return;
        const r = k - s; // 양수: 다가올 장면, 음수: 지나간 장면
        let transform = "";
        let opacity = 1;
        if (r > 0.001) {
          // 멀리서 조금 아래쪽에서 떠오르듯 다가온다.
          transform = `translate3d(0, ${Math.min(r, 1.5) * 90}px, ${-r * DEPTH}px) rotateX(${Math.min(r, 1.5) * -6}deg)`;
          opacity = Math.pow(clamp(1 - r), 1.6);
        } else if (r < -0.001) {
          // 카메라 쪽으로 다가오며 위로 흩어지듯 사라진다.
          const p = -r;
          transform = `translate3d(0, ${-p * 60}px, ${p * 700}px)`;
          opacity = clamp(1 - p * 2.2);
        }
        el.style.transform = transform;
        el.style.opacity = String(opacity);
        el.style.filter = r < -0.001 ? `blur(${Math.min(8, -r * 14)}px)` : "";
        const live = Math.abs(r) < 0.35;
        el.style.pointerEvents = live ? "auto" : "none";
        el.style.visibility = opacity <= 0.01 ? "hidden" : "visible";
        el.setAttribute("aria-hidden", live ? "false" : "true");
      });

      const current = Math.round(s);
      if (current !== lastActive) {
        lastActive = current;
        setActive(current);
        window.dispatchEvent(new CustomEvent("journey:active", { detail: current }));
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // 스크롤이 장면 자리가 아닌 곳에서 멈추면, 곧바로(SETTLE_DELAY) 움직이던 방향으로 장면 하나를 마저 넘긴다.
    // 조금만 내려도(NUDGE_PX) 다음 장면으로, 조금만 올려도 이전 장면으로 간다. 방향을 모르면 가까운 쪽으로 간다.
    // 다만 장면 자리 하나를 지나쳐 조금만(CROSS_BACK) 더 간 채 멈췄으면 그 장면으로 돌아간다: 관성으로 살짝 넘친 것이지
    // 장면을 하나 더 넘기려던 것이 아니다(바닥글에서 올라오다 마지막 장면을 지나친 경우도 같다).
    let settleTimer = 0;
    let touching = false;
    let lastY = window.scrollY;
    let dir = 0;
    let idle = true; // 스크롤이 멈춰 있는 상태(다음 스크롤이 새 동작의 시작)
    let gestureFrom = window.scrollY; // 이번 스크롤 동작을 시작한 위치
    const settle = () => {
      if (touching || glideRef.current) return; // 아직 동작 중(손가락이 닿아 있거나 장면 자리로 옮기는 중)
      idle = true;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const top = root.getBoundingClientRect().top + y;
      const rest = sceneScrollTop;
      if (y <= 0 || y >= rest(n - 1)) return; // 맨 위, 또는 마지막 장면 뒤(바닥글)는 그대로 둔다
      const i = Math.max(0, Math.min(n - 2, Math.floor((y - top) / vh)));
      const from = y - rest(i); // 장면 i 자리에서 내려온 거리
      const to = rest(i + 1) - y; // 장면 i+1 자리까지 남은 거리
      if (from < 2 || to < 2) return; // 이미 장면 자리
      const crossBack = vh * CROSS_BACK;
      let target: number;
      if (dir > 0 && gestureFrom < rest(i) - 2 && from < crossBack) target = i; // 장면 i를 지나쳐 조금 내려감
      else if (dir < 0 && gestureFrom > rest(i + 1) + 2 && to < crossBack) target = i + 1; // 장면 i+1을 지나쳐 조금 올라감
      else target = (dir > 0 ? from >= NUDGE_PX : dir < 0 ? to < NUDGE_PX : from >= to) ? i + 1 : i;
      glideTo(rest(target));
    };
    const queueSettle = () => {
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, SETTLE_DELAY);
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (idle) {
        idle = false;
        gestureFrom = lastY;
      }
      if (y !== lastY) dir = Math.sign(y - lastY);
      lastY = y;
      schedule();
      queueSettle();
    };
    const onTouchStart = () => {
      touching = true;
      clearTimeout(settleTimer);
      stopGlide();
    };
    const onTouchEnd = () => {
      touching = false;
      queueSettle();
    };

    const onResize = () => {
      fit();
      schedule();
    };
    const onFocusIn = (e: FocusEvent) => {
      const idx = sceneRefs.current.findIndex((el) => el?.contains(e.target as Node));
      if (idx >= 0 && idx !== Math.round(progressRef.current)) window.scrollTo({ top: sceneScrollTop(idx) });
    };

    fit();
    frame();
    if (window.location.hash) {
      const idx = scenes.findIndex((sc) => `#${sc.id}` === window.location.hash);
      if (idx > 0) window.scrollTo({ top: sceneScrollTop(idx) });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    // 장면 자리로 옮기는 중에 사용자가 다시 스크롤하면 바로 손을 뗀다(사용자 입력이 우선).
    window.addEventListener("wheel", stopGlide, { passive: true });
    window.addEventListener("keydown", stopGlide);
    window.addEventListener("pointerdown", stopGlide);
    window.addEventListener("resize", onResize);
    root.addEventListener("focusin", onFocusIn);
    const ro = new ResizeObserver(onResize);
    innerRefs.current.forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(onResize).catch(() => undefined);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settleTimer);
      stopGlide();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("wheel", stopGlide);
      window.removeEventListener("keydown", stopGlide);
      window.removeEventListener("pointerdown", stopGlide);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("focusin", onFocusIn);
      ro.disconnect();
    };
  }, [n, scenes, sceneScrollTop, glideTo, stopGlide]);

  return (
    <div ref={rootRef} className="journey" style={{ "--scene-count": n } as CSSProperties}>
      <div className="journey-stage">
        {/* 배경: 장면이 넘어갈 때마다 천천히 자리를 옮기는 부드러운 빛(점·입자 없이) */}
        <div className="journey-glow" aria-hidden="true" />
        <div className="journey-world">
          {scenes.map((sc, i) => (
            <section
              key={sc.id}
              id={sc.id}
              ref={(el) => {
                sceneRefs.current[i] = el;
              }}
              aria-label={sc.label}
              className="journey-scene"
            >
              <div
                ref={(el) => {
                  innerRefs.current[i] = el;
                }}
                className="journey-scene__inner"
              >
                {sc.content}
              </div>
            </section>
          ))}
        </div>

        {/* 진행 표시: 번호와 이름, 누르면 해당 장면으로 이동 */}
        <nav aria-label="메인 화면 장면 이동" className="journey-rail">
          <ol>
            {scenes.map((sc, i) => (
              <li key={sc.id}>
                <button type="button" onClick={() => goTo(i)} aria-current={active === i ? "step" : undefined} className="journey-rail__item">
                  <span className="journey-rail__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="journey-rail__label">{sc.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {active < n - 1 && (
          <button type="button" onClick={() => goTo(active + 1)} className="journey-next" aria-label="다음 장면으로">
            <span className="journey-next__line" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-[0.3em]">SCROLL</span>
          </button>
        )}
        <div className="journey-progress" aria-hidden="true" />
      </div>
    </div>
  );
}
