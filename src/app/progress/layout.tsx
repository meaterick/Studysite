import { requireUser } from "@/lib/dal";

// 진도 페이지 자체는 클라이언트 컴포넌트라 서버에서 로그인 여부를 확인할 수 없어,
// 이 레이아웃에서 한 번 더 확인합니다(Proxy는 1차 방어선일 뿐입니다).
export default async function ProgressLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/progress");
  return children;
}
