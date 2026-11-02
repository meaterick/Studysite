import { headers } from "next/headers";
import type { Metadata } from "next";
// 글꼴은 npm 패키지(pretendard, @fontsource)에서 자체 호스팅한다. next/font/google은 빌드할 때마다 Google Fonts에서
// CSS·글꼴 파일을 내려받는데, 그 응답 형식에 따라 빌드가 실패한 적이 있어(Turbopack "queries have exactly one entry")
// 빌드가 외부 서비스에 의존하지 않게 했다. 글꼴 파일과 유니코드 구간 분할은 Google Fonts와 같다.
// 화면 글꼴: Pretendard(가변 글꼴, 유니코드 구간별로 나뉘어 필요한 글자 파일만 내려받는다).
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
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
    "Aegis 동아리의 AI 스터디. 파이썬과 수학 기초에서 시작해 데이터 처리, 머신러닝, 딥러닝, 대규모 언어 모델과 RAG·에이전트까지 레슨, 실습, 확인 문제, 과제로 학습합니다.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="ko"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          nonce={nonce}
          // Avoid a flash of the wrong theme: read the stored preference before paint.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`,
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
