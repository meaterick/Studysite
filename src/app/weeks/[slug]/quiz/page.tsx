import { redirect } from "next/navigation";

// 복습 노트는 피드백함으로 옮겼다. 예전 주소로 들어오면 새 주소로 보낸다.
export default async function WeekReviewRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const { view } = await searchParams;
  redirect(`/feedback/review/${slug}${view ? `?view=${encodeURIComponent(view)}` : ""}`);
}
