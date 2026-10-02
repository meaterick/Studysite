import type { SVGProps } from "react";

// 화면 곳곳의 이모지(🔒 ▶ ✓ ⚠)를 같은 굵기의 선 아이콘으로 바꿔 통일감을 준다.
// 글자 색(currentColor)을 따르므로 색은 부모에서 정한다.

const PATHS = {
  check: <path d="M4.5 10.5l3.5 3.5 7.5-8" />,
  lock: (
    <>
      <rect x="4.5" y="9" width="11" height="8" rx="2" />
      <path d="M7 9V6.5a3 3 0 016 0V9" />
    </>
  ),
  arrowRight: <path d="M4 10h12m-4.5-4.5L16 10l-4.5 4.5" />,
  arrowLeft: <path d="M16 10H4m4.5-4.5L4 10l4.5 4.5" />,
  arrowUpRight: <path d="M6.5 13.5l7-7m-5.5 0h5.5V12" />,
  chevronRight: <path d="M8 5l5 5-5 5" />,
  chevronDown: <path d="M5 8l5 5 5-5" />,
  play: <path d="M7 5.5v9l7.5-4.5L7 5.5z" fill="currentColor" stroke="none" />,
  alert: (
    <>
      <path d="M10 3.5l7 12.5H3L10 3.5z" />
      <path d="M10 8.5v3.5m0 2.2v.1" />
    </>
  ),
  sun: (
    <>
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.5v1.6m0 11.8v1.6M2.5 10h1.6m11.8 0h1.6M4.7 4.7l1.1 1.1m8.4 8.4l1.1 1.1M4.7 15.3l1.1-1.1m8.4-8.4l1.1-1.1" />
    </>
  ),
  moon: <path d="M15.5 12.3A6.2 6.2 0 017.7 4.5a6.2 6.2 0 107.8 7.8z" />,
  menu: <path d="M3.5 6.5h13m-13 7h13" />,
  close: <path d="M5 5l10 10M15 5L5 15" />,
  message: <path d="M4 5.5h12v8H8.5L5 16.5v-3H4v-8z" />,
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 16, strokeWidth = 1.6, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
