import { redirect } from "next/navigation";
import { loadWeekPage } from "@/lib/weekPage";
import { continueHref } from "@/lib/study";

/** "단계 학습" 탭: 지금 학습할 차례인 핵심 단계로 보낸다. 핵심을 모두 끝냈으면 적용과 복습으로 간다. */
export default async function ContinuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { status } = await loadWeekPage(slug, `/weeks/${slug}`);
  redirect(continueHref(slug, status));
}
