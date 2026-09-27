import { WEEKS } from "@/content/weeks";
import { PHASES } from "@/components/diagrams/shared";

// 메인 화면용 로드맵. 가로로 긴 SVG 도식은 휴대폰에서 글씨만 작게 보이고
// 오른쪽이 잘려 한눈에 들어오지 않아서, 좁은 화면에서는 위→아래 세로 흐름으로,
// 넓은 화면에서만 4칸 가로로 보여준다. 각 부에 속한 주차 제목까지 함께 적어
// 무엇을 배우는지 바로 알 수 있게 한다.
export default function HomeRoadmap() {
  return (
    <ol className="grid gap-3 lg:grid-cols-4">
      {PHASES.map((phase, i) => {
        const weeks = phase.weeks.map((w) => WEEKS.find((week) => `W${week.number}` === w)).filter((w) => w !== undefined);
        return (
          <li key={phase.name} className="relative">
            <div
              className="flex h-full flex-col gap-2 rounded-xl border-l-4 bg-card p-4 shadow-sm"
              style={{ borderColor: phase.color }}
            >
              <p className="text-xs font-bold" style={{ color: phase.color }}>
                {i + 1}부
              </p>
              <p className="text-base font-black text-ink">{phase.name}</p>
              <ul className="flex flex-col gap-1 text-sm text-ink-secondary">
                {weeks.map((w) => (
                  <li key={w.slug}>
                    <span className="font-bold text-ink">{w.number}주차</span> · {w.title}
                  </li>
                ))}
              </ul>
            </div>
            {i < PHASES.length - 1 && (
              <span aria-hidden className="flex justify-center py-1 text-ink-muted lg:hidden">
                ↓
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
