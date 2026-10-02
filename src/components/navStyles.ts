// 머리글 링크 모양. bar: 넓은 화면의 가로 메뉴, menu: 좁은 화면의 펼침 메뉴.
// 지금 보고 있는 화면은 옅은 바탕과 진한 글자로만 표시한다.
export const NAV_STYLES = {
  bar: {
    base: "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition",
    active: "bg-[var(--surface-card-2)] text-ink",
    idle: "text-ink-muted hover:text-ink",
  },
  menu: {
    base: "flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[15px] font-medium transition",
    active: "bg-[var(--surface-card-2)] text-ink",
    idle: "text-ink-secondary hover:bg-[var(--surface-card-2)] hover:text-ink",
  },
} as const;

export type NavVariant = keyof typeof NAV_STYLES;

/** 새 소식 개수 */
export const NAV_BADGE =
  "grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold leading-none text-[var(--on-accent)]";
