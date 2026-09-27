import type { Metadata } from "next";
import { Noto_Sans_KR, JetBrains_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { UserScopeProvider } from "@/components/UserScope";
import { getCurrentUser } from "@/lib/dal";

const sansKr = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const monoCode = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AI 기초부터 활용까지 | Aegis 스터디",
    template: "%s | Aegis AI 스터디",
  },
  description:
    "Aegis 동아리의 8주 AI 스터디. 수학 기초부터 LLM 에이전트까지 주차별 학습 자료, 실습, 확인 문제, 과제로 학습합니다.",
  icons: {
    icon: "/images/aegis-logo-orbit.png",
    apple: "/images/aegis-logo-orbit.png",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html
      lang="ko"
      className={`${sansKr.variable} ${monoCode.variable} h-full antialiased`}
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
