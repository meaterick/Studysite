import type { Metadata } from "next";
// 글꼴은 npm 패키지(@fontsource)에서 자체 호스팅한다. next/font/google은 빌드할 때마다 Google Fonts에서
// CSS·글꼴 파일을 내려받는데, 그 응답 형식에 따라 빌드가 실패한 적이 있어(Turbopack "queries have exactly one entry")
// 빌드가 외부 서비스에 의존하지 않게 했다. 글꼴 파일과 유니코드 구간 분할은 Google Fonts와 같다.
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/900.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "katex/dist/katex.min.css";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { UserScopeProvider } from "@/components/UserScope";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: {
    default: "AI 기초부터 활용까지 | Aegis 스터디",
    template: "%s | Aegis AI 스터디",
  },
  description:
    "Aegis 동아리의 8주 AI 스터디. 수학 기초부터 LLM 에이전트까지 주차별 학습 자료, 실습, 확인 문제, 과제로 학습합니다.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html
      lang="ko"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          // Avoid a flash of the wrong theme: read the stored preference before paint.
          dangerouslySetInnerHTML={{
            // data-motion="full": JavaScript가 켜져 있고 "동작 줄이기"가 아닐 때만 메인 화면의 3D 여정 모드를 쓴다(그리기 전에 정해 깜빡임 방지).
            __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-motion','full');}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-page text-ink">
        <UserScopeProvider uid={user?.id ?? "guest"}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </UserScopeProvider>
      </body>
    </html>
  );
}
