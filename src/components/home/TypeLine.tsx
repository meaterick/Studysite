"use client";

import { useEffect, useState } from "react";

/**
 * 터미널에 명령을 입력하는 것처럼 한 줄씩 타이핑했다 지우기를 반복한다.
 * "동작 줄이기" 설정이면 첫 줄을 그대로 보여 준다.
 */
export default function TypeLine({ lines }: { lines: string[] }) {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(lines[0]?.length ?? 0);
  const [deleting, setDeleting] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || lines.length === 0) return;
    const id = setTimeout(() => {
      setAnimate(true);
      setLength(0);
    }, 1200);
    return () => clearTimeout(id);
  }, [lines.length]);

  useEffect(() => {
    if (!animate) return;
    const line = lines[index];
    let delay = deleting ? 22 : 55;
    if (!deleting && length === line.length) delay = 1700;
    if (deleting && length === 0) delay = 300;
    const id = setTimeout(() => {
      if (!deleting && length === line.length) setDeleting(true);
      else if (deleting && length === 0) {
        setDeleting(false);
        setIndex((i) => (i + 1) % lines.length);
      } else setLength((n) => n + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(id);
  }, [animate, deleting, index, length, lines]);

  const text = (lines[index] ?? "").slice(0, length);
  return (
    <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-mono [overflow-wrap:normal] [word-break:normal]">
      <span className="text-[#5ff0bd]">&gt;&gt;&gt;</span> <span>{text}</span>
      <span aria-hidden="true" className="type-caret ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[0.18em] bg-[#7cc4ff]" />
    </span>
  );
}
