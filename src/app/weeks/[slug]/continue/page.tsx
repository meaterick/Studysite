import { redirect } from "next/navigation";
import { loadWeekPage } from "@/lib/weekPage";

/** "단계 학습" 탭: 지금 학습할 차례인 핵심 단계(핵심을 모두 끝냈으면 백지공부·과제)로 보낸다. */
export default async function ContinuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { status } = await loadWeekPage(slug, `/weeks/${slug}`);
  if (status.currentSection) redirect(`/weeks/${slug}/sections/${status.currentSection.id}`);
  if (!status.worksheetSubmitted) redirect(`/weeks/${slug}/worksheet`);
  redirect(`/weeks/${slug}/assignment`);
}
