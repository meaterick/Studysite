import { notFound } from "next/navigation";
import { WEEKS, getWeek } from "@/content/weeks";
import { quizAnswers } from "@/content/quizAnswers";
import { Inline } from "@/components/MarkdownBlocks";
import QuizRunner from "@/components/QuizRunner";

export function generateStaticParams() {
  return WEEKS.map((w) => ({ slug: w.slug }));
}

export default async function WeekQuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();
  const answerSet = quizAnswers.find((a) => a.week === week.number);

  // 수식(KaTeX) 렌더러가 server-only이므로, 문항·정답 텍스트는 여기(서버
  // 컴포넌트)에서 미리 렌더링해 클라이언트 컴포넌트인 QuizRunner에는
  // 결과 노드만 전달한다.
  const renderedQuestions = Object.fromEntries(
    week.quiz.map((q) => [q.id, <Inline key={q.id} text={q.question} />])
  );
  const renderedAnswers = Object.fromEntries(
    week.quiz.map((q) => [
      q.id,
      <Inline key={q.id} text={answerSet?.answers[q.id] ?? "(정답이 아직 등록되지 않았습니다)"} />,
    ])
  );

  return (
    <section id="quiz" className="scroll-mt-24">
      <h2 className="mb-1 text-xl font-black text-ink">퀴즈 (자기 점검)</h2>
      <p className="mb-4 text-sm text-ink-muted">
        한 문항씩 직접 답을 적어본 뒤 정답을 확인하고, 다음 문항으로 넘어가세요.
      </p>
      <QuizRunner
        slug={slug}
        quiz={week.quiz}
        renderedQuestions={renderedQuestions}
        renderedAnswers={renderedAnswers}
      />
    </section>
  );
}
