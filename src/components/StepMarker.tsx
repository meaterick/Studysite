import Icon from "./Icon";

export type StepState = "done" | "current" | "todo" | "locked";

/**
 * 단계 목록 왼쪽의 작은 원. 완료는 초록 체크, 지금 할 차례는 강조색으로 채운 번호,
 * 남은 단계는 얇은 테두리 번호, 잠긴 단계는 자물쇠. 목록에서 색이 있는 것은 "지금"과 "완료"뿐이다.
 */
export default function StepMarker({ state, label, size = 28 }: { state: StepState; label?: string | number; size?: number }) {
  const box = "grid shrink-0 place-items-center rounded-full text-xs tabular-nums";
  const dim = { width: size, height: size };
  if (state === "done")
    return (
      <span aria-hidden="true" style={dim} className={`${box} bg-[color-mix(in_srgb,var(--status-good)_14%,transparent)] text-[var(--status-good)]`}>
        <Icon name="check" size={size * 0.5} strokeWidth={2} />
      </span>
    );
  if (state === "locked")
    return (
      <span aria-hidden="true" style={dim} className={`${box} border border-[var(--border-hairline)] text-ink-muted`}>
        <Icon name="lock" size={size * 0.46} />
      </span>
    );
  if (state === "current")
    return (
      <span aria-hidden="true" style={dim} className={`${box} bg-[var(--accent)] font-semibold text-[var(--on-accent)]`}>
        {label}
      </span>
    );
  return (
    <span aria-hidden="true" style={dim} className={`${box} border border-[var(--border-strong)] font-medium text-ink-muted`}>
      {label}
    </span>
  );
}
