import { operatorGuide } from "@/content/operator/guide";
import { SCHEDULE } from "@/content/curriculum/schedule";
import { getModule, moduleOfAssignment } from "@/content/course";
import PageHeader from "@/components/PageHeader";
import Markdown from "@/components/MarkdownBlocks";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "운영 가이드" };

export default async function OperatorGuidePage() {
  await requireAdmin("/operator/guide");
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader title={operatorGuide.title} description={operatorGuide.subtitle} />
      <Markdown source={operatorGuide.intro} />

      {/* 기본 일정표는 콘텐츠의 일정 정의(SCHEDULE)에서 만든다. 일정이 바뀌면 이 표도 같이 바뀐다. */}
      <section aria-labelledby="schedule-heading" className="my-10">
        <h2 id="schedule-heading" className="text-[1.35rem] font-bold tracking-[-0.03em] text-ink">
          6. 기본 일정 (16주)
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-body">
          주당 학습 시간은 4~7시간을 기준으로 잡았다. 운영 설정에서 기수 시작일을 정하면 이 표에 따라 이번 주 범위가 표시된다.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
          <table className="data-table text-sm">
            <thead>
              <tr>
                <th>주 차</th>
                <th>학습 모듈</th>
                <th>제출</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((w) => (
                <tr key={w.week}>
                  <td className="whitespace-nowrap tabular-nums text-ink">{w.week}</td>
                  <td className="min-w-[14rem] text-ink-secondary">
                    {w.modules
                      .map((slug) => getModule(slug))
                      .filter((m) => !!m)
                      .map((m) => `${m.code} ${m.title}`)
                      .join(", ")}
                  </td>
                  <td className="min-w-[10rem] text-ink-secondary">
                    {w.due.length === 0 && !w.milestone
                      ? "—"
                      : [
                          ...w.due.map((key) => {
                            const m = moduleOfAssignment(key)!;
                            return `${m.code} ${m.assignment!.title}`;
                          }),
                          ...(w.milestone ? [`캡스톤 준비: ${w.milestone}`] : []),
                        ].join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Markdown source={operatorGuide.body} />
    </div>
  );
}
