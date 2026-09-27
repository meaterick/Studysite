import { redirect } from "next/navigation";
import { loadWeekPage } from "@/lib/weekPage";

/** "섹션 학습" 탭 — 지금 학습할 차례인 섹션(모두 끝났으면 다음 마무리 단계)으로 보낸다. */
export default async function ContinuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { status } = await loadWeekPage(slug, `/weeks/${slug}`);
  if (status.currentSection) redirect(`/weeks/${slug}/sections/${status.currentSection.id}`);
  if (!status.worksheetSubmitted) redirect(`/weeks/${slug}/worksheet`);
  redirect(`/weeks/${slug}/assignment`);
}
