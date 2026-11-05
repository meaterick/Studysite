import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { MODULES, TRACKS, modulesOfTrack } from "@/content/course";
import { TIER_INFO } from "@/content/tiers";
import { descriptiveCountsByLesson, lessonCompletionCounts } from "@/lib/learningStore";
import { checkStatMap, LOW_FIRST_TRY, MIN_ANSWERS } from "@/lib/operatorStats";
import { countUsersByRole } from "@/lib/userStore";
import PageHeader from "@/components/PageHeader";

export const metadata = { title: "콘텐츠 · 정답과 통계" };

// 운영자용 콘텐츠 개요: 모듈마다 레슨 수, 문항 수, 스터디원의 완료 수와 정답률이 낮은 확인 문제 수를 보여 준다.
// 모듈을 누르면 레슨별 정답·해설·모범답안과 문항별 통계를 본다.
export default async function OperatorContentPage() {
  await requireAdmin("/operator/content");
  const stats = checkStatMap();
  const completions = lessonCompletionCounts();
  const answers = descriptiveCountsByLesson();
  const members = countUsersByRole().member;
  const lessons = MODULES.flatMap((m) => m.lessons);
  const totals = {
    lessons: lessons.length,
    checks: lessons.reduce((n, l) => n + l.checks.length, 0),
    exercises: lessons.reduce((n, l) => n + (l.exercises?.length ?? 0), 0),
    descriptive: lessons.reduce((n, l) => n + (l.descriptive?.length ?? 0), 0),
    predicts: lessons.reduce((n, l) => n + (l.predicts?.length ?? 0), 0),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <PageHeader
        title="콘텐츠 · 정답과 통계"
        description={`레슨 ${totals.lessons}개 · 확인 문제 ${totals.checks} · 코딩 실습 ${totals.exercises} · 서술형 ${totals.descriptive} · 출력 예측 ${totals.predicts}. 통계는 스터디원 ${members}명의 기록만 셉니다(운영자 계정 제외).`}
      />
      <p className="mb-8 text-sm leading-relaxed text-ink-secondary">
        응답이 {MIN_ANSWERS}명 이상이고 첫 시도 정답률이 {Math.round(LOW_FIRST_TRY * 100)}% 미만인 확인 문제를 ‘점검’ 대상으로 표시합니다. 문항이 모호하거나, 오답 선택지가
        정답으로도 읽히거나, 앞 레슨에서 다루지 않은 내용을 묻는 경우가 많습니다.
      </p>

      <div className="space-y-12">
        {TRACKS.map((track) => {
          const modules = modulesOfTrack(track.id);
          if (modules.length === 0) return null;
          return (
            <section key={track.id} aria-labelledby={`track-${track.id}`}>
              <h2 id={`track-${track.id}`} className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: track.color }} />
                트랙 {track.code} · {track.title}
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-[var(--border-hairline)]">
                <table className="data-table">
                  <thead>
                    <tr>
                      {["모듈", "레슨", "확인 문제", "점검", "완료(핵심 평균)", "서술형 답안", ""].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => {
                      const tierCounts = (["core", "supplement", "advanced"] as const)
                        .map((t) => [t, m.lessons.filter((l) => l.tier === t).length] as const)
                        .filter(([, n]) => n > 0);
                      const checks = m.lessons.reduce((n, l) => n + l.checks.length, 0);
                      const low = m.lessons.reduce((n, l) => n + l.checks.filter((c) => stats.get(`${l.id}/${c.key}`)?.low).length, 0);
                      const core = m.lessons.filter((l) => l.tier === "core");
                      const avg = core.length ? core.reduce((n, l) => n + (completions.get(l.id) ?? 0), 0) / core.length : undefined;
                      const written = m.lessons.reduce((n, l) => n + (answers.get(l.id)?.total ?? 0), 0);
                      return (
                        <tr key={m.slug}>
                          <td className="min-w-[14rem]">
                            <Link href={`/operator/content/${m.slug}`} className="font-medium text-ink underline-offset-2 hover:underline">
                              <span className="mr-2 font-mono text-xs text-ink-muted">{m.code}</span>
                              {m.title}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap text-xs text-ink-secondary">
                            {tierCounts.map(([t, n]) => `${TIER_INFO[t].label} ${n}`).join(" · ")}
                          </td>
                          <td className="tabular-nums text-ink-secondary">{checks}</td>
                          <td className={`tabular-nums ${low > 0 ? "font-medium text-[var(--status-critical)]" : "text-ink-muted"}`}>{low}</td>
                          <td className="tabular-nums text-ink-secondary">{avg === undefined ? "—" : `${avg.toFixed(1)}명`}</td>
                          <td className="tabular-nums text-ink-secondary">{written}</td>
                          <td className="text-right">
                            <Link href={`/operator/content/${m.slug}`} className="btn btn-ghost btn-sm">
                              정답·통계
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
