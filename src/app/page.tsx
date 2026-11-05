import Link from "next/link";
import Icon from "@/components/Icon";
import { TRACKS, modulesOfTrack } from "@/content/course";
import { getCurrentUser } from "@/lib/dal";
import { getLearningRecord } from "@/lib/learningStore";
import { courseProgress } from "@/lib/study";
import { trackHref } from "@/lib/routes";

const fields = TRACKS.filter((track) => track.id !== "intro");
const fieldTitles: Partial<Record<(typeof TRACKS)[number]["id"], string>> = {
  programming: "Python",
  math: "수학과 통계",
  data: "데이터 처리",
  ml: "머신러닝",
  dl: "딥러닝",
  genai: "생성형 AI와 언어 모델",
  capstone: "프로젝트",
  extension: "확장 주제",
};

const studySteps = [
  { title: "개념 읽기", description: "글, 그림, 예제로 핵심 원리를 살펴봅니다." },
  { title: "코드 실행하기", description: "설치 없이 브라우저에서 코드를 바꾸고 결과를 확인합니다." },
  { title: "이해 확인하기", description: "확인 문제와 코딩 실습을 풀고, 모듈별 복습과 과제로 적용해 봅니다." },
];

export default async function Home() {
  const user = await getCurrentUser();
  const progress = user ? courseProgress(getLearningRecord(user.id)) : undefined;

  return (
    <>
      <section
        aria-labelledby="home-heading"
        className="border-b border-slate-800 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_#263a60,_transparent_72%)] px-4 py-20 text-center text-white sm:px-6 sm:py-28"
      >
        <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-sky-200">Aegis 스터디</p>
        <h1 id="home-heading" className="mx-auto mt-5 max-w-4xl text-4xl font-extrabold leading-tight tracking-[-0.04em] sm:text-6xl">
          관심 있는 분야부터
          <br />
          <span className="text-sky-200">직접 실습하며 배워요</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
          Python, 데이터 처리, 머신러닝, 딥러닝 등 원하는 분야를 골라 학습하세요. 실습 코드는 브라우저에서 바로 실행할 수 있습니다.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="#fields" className="rounded-full bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-100">
            학습 분야 둘러보기
          </Link>
          <Link href={user ? "/progress" : "/curriculum"} className="rounded-full border border-slate-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            {user ? "내 진도 보기" : "추천 학습 순서 보기"}
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <section aria-labelledby="fields-heading" className="scroll-mt-24" id="fields">
          <p className="kicker">분야별 학습</p>
          <h2 id="fields-heading" className="section-title mt-2">무엇을 배우고 싶나요?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
            분야를 선택하면 해당 모듈과 레슨을 볼 수 있습니다. 처음 시작한다면 각 분야의 첫 모듈부터 살펴보세요.
          </p>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((track) => {
              const modules = modulesOfTrack(track.id);
              const total = modules.reduce((sum, module) => sum + module.lessons.filter((lesson) => lesson.tier === "core").length, 0);
              const done = progress ? modules.reduce((sum, module) => sum + (progress.byModule.get(module.slug)?.done ?? 0), 0) : 0;
              return (
                <li key={track.id}>
                  <Link
                    href={trackHref(track.id)}
                    className="group flex h-full flex-col rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card-2)] p-6 transition hover:border-[var(--border-strong)]"
                  >
                    <span aria-hidden="true" className="mb-4 h-1 w-9 rounded-full" style={{ background: track.color }} />
                    <span className="text-xl font-semibold tracking-tight text-ink">{fieldTitles[track.id] ?? track.title}</span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{track.summary}</span>
                    <span className="mt-5 flex items-center justify-between gap-3 text-xs font-medium text-ink-secondary">
                      <span>
                        모듈 {modules.length}개
                        {total > 0 && (progress ? ` · 핵심 레슨 ${done}/${total} 완료` : ` · 핵심 레슨 ${total}개`)}
                      </span>
                      <Icon name="arrowRight" size={16} className="shrink-0 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="study-heading" className="mt-16 border-t border-[var(--border-hairline)] pt-10">
          <h2 id="study-heading" className="section-title">학습 방법</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {studySteps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span aria-hidden="true" className="font-mono text-sm text-ink-muted">0{index + 1}</span>
                <div>
                  <h3 className="font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/curriculum" className="btn btn-secondary mt-8">커리큘럼 보기</Link>
        </section>
      </div>
    </>
  );
}
