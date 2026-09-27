"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import JourneyField from "./JourneyField";

// 메인 화면 "8주 여정".
//
// 화면 전체를 덮는 무대(stage)가 스크롤하는 동안 고정되어 있고, 스크롤이 카메라를 3D 공간 안쪽으로 전진시킨다.
// 장면(scene)들은 깊이 방향으로 한 줄로 놓여 있어서, 다음 장면이 멀리서 다가오고 지나간 장면은 카메라 뒤로
// 스쳐 지나간다. 배경의 입자 공간(JourneyField)도 같은 카메라로 움직여 모든 화면이 하나로 이어진다.
//
// - 장면마다 스크롤 한 화면 분량이 배정되고, 그중 앞부분(HOLD)은 장면이 멈춰 있어 읽을 수 있다.
// - 현재 장면은 변환이 0이라 글자가 선명하다. 장면이 화면보다 크면 자동으로 줄여 맞춘다.
// - html[data-motion="full"](JavaScript 켜짐 + 동작 줄이기 아님)일 때만 3D 모드가 되고,
//   그 밖에는 같은 장면이 일반 세로 배치로 보인다.

export interface JourneyScene {
  id: string;
  /** 진행 표시에 쓰는 짧은 이름 */
  label: string;
  /** 진행 표시에서 묶는 이름(예: 주차) */
  group: string;
  /** 장면의 대표 색(배경 입자·진행 표시) */
  tint: string;
  content: ReactNode;
}

const DEPTH = 1500; // 장면 사이 깊이(px)
const HOLD = 0.32; // 장면마다 멈춰 있는 스크롤 비율

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

// 장면이 놓이는 곡선 경로: 다음 장면이 정면이 아니라 조금씩 옆·위에서 다가오도록
const pathX = (i: number) => Math.sin(i * 1.7) * 340;
const pathY = (i: number) => Math.cos(i * 1.1) * 120;
const pathTurn = (i: number) => Math.sin(i * 1.7) * 14;

export default function Journey({ scenes }: { scenes: JourneyScene[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);
  const [active, setActive] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const n = scenes.length;
  const tints = useMemo(() => scenes.map((s) => s.tint), [scenes]);

  // 장면 i가 멈춰 있는 구간의 스크롤 위치
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
      // 장면이 무대보다 크면 줄여서 한 화면에 들어오게 한다.
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
        inner.style.setProperty("--fit", String(Math.max(0.55, k)));
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
        const r = k - s; // 양수: 앞으로 다가올 장면, 음수: 지나간 장면
        let transform = "";
        let opacity = 1;
        if (r > 0.001) {
          const x = pathX(k) * Math.min(r, 2);
          const yy = pathY(k) * Math.min(r, 2);
          transform = `translate3d(${x}px, ${yy}px, ${-r * DEPTH}px) rotateY(${-pathTurn(k) * Math.min(r, 1.5)}deg)`;
          // 멈춰 있는 동안(r = 1)에는 다음 장면이 겹쳐 보이지 않고, 넘어가기 시작하면 멀리서 떠오른다.
          opacity = Math.pow(clamp(1 - r), 1.4);
        } else if (r < -0.001) {
          const p = -r;
          transform = `translate3d(${-pathX(k + 1) * p * 0.6}px, ${-pathY(k + 1) * p * 0.4}px, ${p * 900}px) rotateX(${p * 8}deg)`;
          opacity = clamp(1 - p * 2.4);
        }
        el.style.transform = transform;
        el.style.opacity = String(opacity);
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

    // 키보드로 링크에 초점을 옮기면 그 장면으로 이동한다.
    const onFocusIn = (e: FocusEvent) => {
      const idx = sceneRefs.current.findIndex((el) => el?.contains(e.target as Node));
      if (idx >= 0 && idx !== Math.round(progressRef.current)) {
        window.scrollTo({ top: sceneScrollTop(idx) + 2 });
      }
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

  // 진행 표시: 같은 group은 하나로 묶는다.
  const groups: { group: string; first: number; last: number; tint: string }[] = [];
  scenes.forEach((sc, i) => {
    const g = groups[groups.length - 1];
    if (g && g.group === sc.group) g.last = i;
    else groups.push({ group: sc.group, first: i, last: i, tint: sc.tint });
  });

  const current = scenes[active] ?? scenes[0];

  return (
    <div ref={rootRef} className="journey" style={{ "--scene-count": n } as CSSProperties}>
      <div className="journey-stage">
        <JourneyField progressRef={progressRef} tints={tints} enabled={enabled} />
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

        {/* 넓은 화면: 오른쪽 진행 표시 */}
        <nav aria-label="메인 화면 장면 이동" className="journey-rail">
          <ol>
            {groups.map((g) => {
              const on = active >= g.first && active <= g.last;
              const count = g.last - g.first + 1;
              return (
                <li key={g.group}>
                  <button
                    type="button"
                    onClick={() => goTo(on && count > 1 ? Math.min(g.last, active + 1) : g.first)}
                    aria-current={on ? "step" : undefined}
                    className="journey-rail__item"
                    style={{ "--tint": g.tint } as CSSProperties}
                  >
                    <span className="journey-rail__label">
                      {g.group}
                      {on && count > 1 && ` ${active - g.first + 1}/${count}`}
                    </span>
                    <span className="journey-rail__dots" aria-hidden="true">
                      {Array.from({ length: count }, (_, k) => (
                        <span key={k} data-on={g.first + k === active ? "true" : undefined} />
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* 좁은 화면: 아래쪽 진행 막대 */}
        <div className="journey-bar">
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="이전 장면">
            ↑
          </button>
          <p aria-live="polite">
            <span className="font-mono text-[11px] text-[#7cc4ff]">
              {String(active + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}
            </span>{" "}
            {current.label}
          </p>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active === n - 1} aria-label="다음 장면">
            ↓
          </button>
        </div>
        <div className="journey-progress" aria-hidden="true" />
      </div>
    </div>
  );
}
