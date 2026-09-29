import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";

/** 예전 과제별 대화 주소. 대화는 이제 스터디원별 채팅 하나로 합쳐졌다. */
export default async function LegacyThreadPage({ params }: { params: Promise<{ userId: string; slug: string }> }) {
  await requireAdmin("/operator/chat");
  const { userId } = await params;
  redirect(`/operator/chat/${encodeURIComponent(userId)}`);
}
