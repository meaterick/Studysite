import { redirect } from "next/navigation";
import { safeReturnPath } from "@/lib/returnPath";

// 기존 공유 링크를 깨지 않게 유지하되, 별도 회원가입 화면은 제공하지 않습니다.
export default async function SignupRedirect({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const returnPath = safeReturnPath(from ?? "");
  redirect(`/login${returnPath !== "/account" ? `?from=${encodeURIComponent(returnPath)}` : ""}`);
}
