"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import JourneyField from "./JourneyField";

// 메인 화면의 이어지는 장면 구성.
//
// 화면 전체를 덮는 무대(stage)를 스크롤하는 동안 고정하고, 스크롤이 카메라를 3D 공간 안쪽으로 전진시킨다.
// 장면은 깊이 방향으로 한 줄로 놓여, 다음 장면이 멀리서 조용히 다가오고 지나간 장면은 카메라 쪽으로 흐려지며 사라진다.
// 배경의 입자 공간(JourneyField)도 같은 카메라로 움직여 장면 사이가 끊기지 않는다.
//
// - 장면마다 스크롤 한 화면 분량을 배정하고, 앞부분(HOLD)은 장면이 멈춰 있어 읽을 수 있다(이때 변환 0 → 글자 선명).
// - 장면이 화면보다 크면 자동으로 줄여 맞춘다.
// - html[data-motion="full"](JavaScript 켜짐 + 동작 줄이기 아님)일 때만 3D 모드가 되고, 그 밖에는 세로 배치로 보인다.

export interface JourneyScene {
  id: string;
  /** 진행 표시에 쓰는 짧은 이름 */
  label: string;
  content: ReactNode;
}

const DEPTH = 1200; // 장면 사이 깊이(px)
const HOLD = 0.38; // 장면마다 멈춰 있는 스크롤 비율

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep

export default function Journey({ scenes }: { scenes: JourneyScene[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);
  const [active, setActive] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const n = scenes.length;

  const sceneScrollTop = useCallback((i: number) => {
    const root = rootRef.current;
    if (!root) return 0;
    return root.getBoundingClientRect().top + window.scrollY + i * window.innerHeight;
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(n - 1, i));
      window.scrollTo({ top: sceneScrollTop(target) + 2, behavior: "smooth" });
    },
    [n, sceneScrollTop]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || document.documentElement.dataset.motion !== "full") return;
    setEnabled(true);

    let raf = 0;
    let lastActive = -1;

    const fit = () => {
      const stage = root.querySelector<HTMLElement>(".journey-stage");
      if (!stage) return;
      // 모바일 주소창 때문에 100vh와 실제 보이는 높이가 다를 수 있어 창 높이로 맞춘다.
      root.style.height = `${n * window.innerHeight}px`;
      stage.style.height = `${window.innerHeight}px`;
      const availH = stage.clientHeight - 150;
      const availW = stage.clientWidth - 32;
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
    const onResize = () => {
      fit();
      schedule();
    };
    const onFocusIn = (e: FocusEvent) => {
      const idx = sceneRefs.current.findIndex((el) => el?.contains(e.target as Node));
      if (idx >= 0 && idx !== Math.round(progressRef.current)) window.scrollTo({ top: sceneScrollTop(idx) + 2 });
    };

    fit();
    frame();
    if (window.location.hash) {
      const idx = scenes.findIndex((sc) => `#${sc.id}` === window.location.hash);
      if (idx > 0) window.scrollTo({ top: sceneScrollTop(idx) + 2 });
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    root.addEventListener("focusin", onFocusIn);
    const ro = new ResizeObserver(onResize);
    innerRefs.current.forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(onResize).catch(() => undefined);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("focusin", onFocusIn);
      ro.disconnect();
    };
  }, [n, scenes, sceneScrollTop]);

  return (
    <div ref={rootRef} className="journey" style={{ "--scene-count": n } as CSSProperties}>
      <div className="journey-stage">
        <JourneyField progressRef={progressRef} enabled={enabled} />
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
