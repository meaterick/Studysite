import type { Metadata } from "next";
import { Noto_Sans_KR, JetBrains_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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
    "Aegis 동아리 「AI 기초부터 활용까지」 8주 스터디 — 세계 최상위 대학 강의 구조를 참고한 커리큘럼, 주차별 학습자료, 실습, 퀴즈, 백지공부 시트, 과제.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
            __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-page text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
