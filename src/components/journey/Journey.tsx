"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

// 메인 화면: 장면을 한 장씩 넘기는 덱(deck).
//
// 덱은 화면 한 장 크기로 고정되어 스크롤되지 않는다. 휠·스와이프·키보드·진행 표시는 "다음/이전 장면"이라는 신호만 보내고,
// 장면 전환은 정해진 길이의 CSS 전환(transform·opacity, globals.css)이라 어떤 입력이든 같은 모습으로 매끄럽게 움직인다.
// (예전에는 문서를 스크롤해 장면을 움직였는데, 장면 위치가 스크롤 위치·화면 높이에 묶여 있어서 휴대폰 브라우저의
// 주소창·도구 막대가 움직일 때마다 화면이 튀고, 애매한 위치에서 멈추면 자리를 다시 잡아야 했다.)
//
// - 휠: 한 번 굴리거나 트랙패드로 살짝 밀면(WHEEL_THRESHOLD) 한 장면. 관성으로 이어지는 휠 이벤트는 무시한다.
// - 터치: 끄는 동안 장면이 손가락을 조금 따라오고, 놓을 때 SWIPE_THRESHOLD 이상 밀었거나 빠르게 튕겼으면 넘긴다.
// - 키보드: ↓·PageDown·Space 다음, ↑·PageUp·Shift+Space 이전, Home·End 처음·끝.
// - 마지막 장면에서 더 내리면 평소처럼 문서가 스크롤되어 바닥글이 나온다.
// - 장면이 화면보다 크면 자동으로 줄여 맞춘다.
// - html[data-motion="full"](JavaScript 켜짐 + 동작 줄이기 아님)일 때만 덱이 되고, 그 밖에는 장면이 세로로 이어진다.

export interface JourneyScene {
  id: string;
  /** 진행 표시에 쓰는 짧은 이름 */
  label: string;
  content: ReactNode;
}

// 장면을 넘긴 뒤 다음 넘기기를 받기까지(ms). 전환이 대부분 끝나 다음 장면이 자리를 잡은 시점이다.
const BUSY_MS = 550;
// 트랙패드로 이만큼(px) 밀면 넘긴다. 마우스 휠 한 칸(보통 100px)은 바로 넘어간다.
const WHEEL_THRESHOLD = 24;
// 휠 이벤트 사이가 이보다 길면(ms) 새로 굴린 것으로 본다. 짧으면 같은 동작(관성 포함)이다.
const WHEEL_GAP = 150;
// 손가락을 이만큼(px) 밀었거나, 짧게라도(SWIPE_MIN px 이상) 빠르게(SWIPE_VELOCITY px/ms) 튕기면 넘긴다.
const SWIPE_THRESHOLD = 24;
const SWIPE_MIN = 10;
const SWIPE_VELOCITY = 0.25;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// 덱 모드인지(html[data-motion="full"]). 이 값은 첫 화면을 그리기 전에 정해지고(layout.tsx) 바뀌지 않는다.
const subscribeNever = () => () => {};
const readMotionFull = () => document.documentElement.dataset.motion === "full";
const readMotionServer = () => false;

export default function Journey({ scenes }: { scenes: JourneyScene[] }) {
  const n = scenes.length;
  const deck = useSyncExternalStore(subscribeNever, readMotionFull, readMotionServer);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const busyUntilRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);

  /** 장면 i로 넘긴다. 넘겼으면 true */
  const go = useCallback(
    (i: number) => {
      const target = clamp(i, 0, n - 1);
      if (target === indexRef.current) return false;
      indexRef.current = target;
      busyUntilRef.current = performance.now() + BUSY_MS;
      setIndex(target);
      return true;
    },
    [n]
  );

  // 진행 표시·다음 버튼: 바닥글을 보고 있었다면 덱으로 올라온 뒤 넘긴다.
  const goFromControl = useCallback(
    (i: number) => {
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
      go(i);
    },
    [go]
  );

  // 숫자가 올라가는 통계 등 장면마다 시작하는 효과(CountUp)에 지금 장면을 알린다.
  useEffect(() => {
    if (deck) window.dispatchEvent(new CustomEvent("journey:active", { detail: index }));
  }, [deck, index]);

  // 주소에 장면 id(#cycle 등)가 있으면 그 장면에서 시작한다(전환 없이).
  // 브라우저는 주소의 #id로 문서를 스크롤하는데, 덱에서는 장면이 모두 화면 맨 위에 겹쳐 있으므로 맨 위로 되돌린다.
  useEffect(() => {
    if (!deck) return;
    const fromHash = () => scenes.findIndex((sc) => `#${sc.id}` === window.location.hash);
    const toTop = () => {
      if (window.scrollY <= 0) return;
      const html = document.documentElement;
      html.style.scrollBehavior = "auto"; // html의 scroll-behavior: smooth 없이 바로
      window.scrollTo(0, 0);
      html.style.scrollBehavior = "";
    };
    const initial = fromHash();
    if (initial >= 0) {
      // 브라우저는 문서를 다 받을 때까지 주소의 #id로 다시 스크롤하므로, 다 받은 뒤에도 한 번 더 되돌린다.
      toTop();
      requestAnimationFrame(toTop);
      if (document.readyState !== "complete") window.addEventListener("load", () => requestAnimationFrame(toTop), { once: true });
    }
    if (initial > 0) {
      const world = worldRef.current;
      world?.setAttribute("data-instant", "");
      indexRef.current = initial;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 한 번, 브라우저 주소(외부 상태)에서 시작 장면을 읽는다
      setIndex(initial);
      requestAnimationFrame(() => requestAnimationFrame(() => world?.removeAttribute("data-instant")));
    }
    const onHash = () => {
      const i = fromHash();
      if (i < 0) return;
      requestAnimationFrame(toTop);
      go(i);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [deck, scenes, go]);

  // 장면이 화면보다 크면 줄여 맞춘다(덱 크기는 CSS가 정하고 여기서는 읽기만 한다).
  useEffect(() => {
    const stage = stageRef.current;
    if (!deck || !stage) return;
    const fit = () => {
      const first = sceneRefs.current[0];
      const cs = first ? getComputedStyle(first) : null;
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
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    innerRefs.current.forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(fit).catch(() => undefined);
    return () => ro.disconnect();
  }, [deck]);

  // 입력 → 장면 넘기기
  useEffect(() => {
    const root = rootRef.current;
    const world = worldRef.current;
    if (!deck || !root || !world) return;

    const atTop = () => window.scrollY <= 1; // 덱이 화면을 다 덮고 있다(바닥글을 보는 중이 아니다)
    const isLast = () => indexRef.current >= n - 1;
    const ready = () => performance.now() >= busyUntilRef.current;

    // ── 휠 ──
    let lastWheel = 0;
    let lastAbs = 0;
    let accum = 0;
    let spent = false; // 이번 동작으로 이미 넘겼다(관성으로 이어지는 이벤트는 무시)
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // 핀치 확대
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (Math.abs(dy) <= Math.abs(e.deltaX)) return; // 가로 스크롤
      const now = performance.now();
      const abs = Math.abs(dy);
      const gap = now - lastWheel;
      lastWheel = now;
      // 새 동작: 잠시 멈췄다 다시 굴렸거나, 관성으로 줄어들던 값이 다시 크게 늘었다(트랙패드로 한 번 더 밂).
      if (gap > WHEEL_GAP || (spent && abs > lastAbs * 1.5 + 8)) {
        accum = 0;
        spent = false;
      }
      lastAbs = abs;
      // 바닥글을 보는 중이거나 마지막 장면에서 아래로: 평소처럼 스크롤한다. 이 동작(관성 포함)이 이어져 덱에 닿아도 넘기지 않는다.
      if (!atTop() || (dy > 0 && isLast())) {
        spent = true;
        return;
      }
      e.preventDefault();
      if (spent || !ready()) return;
      accum += dy;
      if (Math.abs(accum) >= WHEEL_THRESHOLD) {
        spent = true;
        go(indexRef.current + Math.sign(accum));
        accum = 0;
      }
    };

    // ── 터치 ──
    let startX = 0;
    let startY = 0;
    // 손을 떼기 직전의 속도를 재려고 최근 위치(약 0.1초)를 남긴다(천천히 끌다가 마지막에 튕겨도 튕긴 것으로 본다).
    let recent: { t: number; y: number }[] = [];
    let mode: "undecided" | "deck" | "native" = "native";
    const endDrag = () => {
      world.removeAttribute("data-dragging");
      world.style.removeProperty("--drag");
      world.style.removeProperty("--drag-abs");
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        if (mode === "deck") endDrag();
        mode = "native";
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      recent = [{ t: performance.now(), y: startY }];
      mode = "undecided";
    };
    const onTouchMove = (e: TouchEvent) => {
      if (mode === "native") return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      const now = performance.now();
      recent.push({ t: now, y: e.touches[0].clientY });
      while (recent.length > 2 && now - recent[0].t > 100) recent.shift();
      if (mode === "undecided") {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return; // 아직 방향을 모른다
        // 가로로 끌거나, 바닥글을 보는 중이거나, 마지막 장면에서 위로 밀면(아래로 스크롤) 평소처럼 스크롤한다.
        if (Math.abs(dx) > Math.abs(dy) || !atTop() || (dy < 0 && isLast())) {
          mode = "native";
          return;
        }
        mode = "deck";
        world.setAttribute("data-dragging", "");
      }
      e.preventDefault();
      // 끝 장면에서 더 갈 곳이 없는 쪽으로 끌면 무겁게 따라온다.
      const edge = (dy > 0 && indexRef.current === 0) || (dy < 0 && isLast());
      const drag = clamp(dy * (edge ? 0.12 : 0.35), -90, 90);
      world.style.setProperty("--drag", drag.toFixed(1));
      world.style.setProperty("--drag-abs", Math.abs(drag).toFixed(1));
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (mode !== "deck") {
        mode = "native";
        return;
      }
      mode = "native";
      endDrag();
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dy = touch.clientY - startY;
      const from = recent[0];
      const velocity = from ? Math.abs(touch.clientY - from.y) / Math.max(1, performance.now() - from.t) : 0;
      if (ready() && (Math.abs(dy) >= SWIPE_THRESHOLD || (velocity >= SWIPE_VELOCITY && Math.abs(dy) >= SWIPE_MIN))) {
        go(indexRef.current + (dy < 0 ? 1 : -1));
      }
    };

    // ── 키보드 ──
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !atTop()) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const onControl = !!target?.closest("button, a, summary");
      let next: number;
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          next = indexRef.current + 1;
          break;
        case " ":
          if (onControl) return; // 버튼·링크에서의 Space는 누르기
          next = indexRef.current + (e.shiftKey ? -1 : 1);
          break;
        case "ArrowUp":
        case "PageUp":
          next = indexRef.current - 1;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = n - 1;
          break;
        default:
          return;
      }
      if (next > n - 1) return; // 마지막 장면에서 아래로: 바닥글로(평소 스크롤)
      e.preventDefault();
      if (ready()) go(next);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      endDrag();
    };
  }, [deck, n, go]);

  const progress = n > 1 ? index / (n - 1) : 0;
  const stateOf = (i: number) => (i === index ? "current" : i < index ? "past" : "future");

  return (
    <div ref={rootRef} className="journey">
      <div ref={stageRef} className="journey-stage" style={{ "--p": progress } as CSSProperties}>
        {/* 배경: 장면을 넘길 때마다 천천히 자리를 옮기는 부드러운 빛(점·입자 없이) */}
        <div className="journey-glow" aria-hidden="true">
          <span className="journey-glow__blob journey-glow__blob--a" />
          <span className="journey-glow__blob journey-glow__blob--b" />
        </div>
        <div ref={worldRef} className="journey-world" data-deck={deck ? "" : undefined}>
          {scenes.map((sc, i) => (
            <section
              key={sc.id}
              id={sc.id}
              ref={(el) => {
                sceneRefs.current[i] = el;
              }}
              aria-label={sc.label}
              className="journey-scene"
              data-state={deck ? stateOf(i) : undefined}
              // 덱에서는 보이지 않는 장면을 키보드 이동·화면 읽기에서 뺀다.
              inert={deck && i !== index ? true : undefined}
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
                <button type="button" onClick={() => goFromControl(i)} aria-current={index === i ? "step" : undefined} className="journey-rail__item">
                  <span className="journey-rail__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="journey-rail__label">{sc.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {index < n - 1 && (
          <button type="button" onClick={() => goFromControl(index + 1)} className="journey-next" aria-label="다음 장면으로">
            <span className="journey-next__line" aria-hidden="true" />
            <span className="font-mono text-[10px] tracking-[0.3em]">SCROLL</span>
          </button>
        )}
        <div className="journey-progress" aria-hidden="true" />
      </div>
    </div>
  );
}
