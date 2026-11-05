import { headers } from "next/headers";
import type { Metadata } from "next";
// 글꼴은 npm 패키지(pretendard, @fontsource)에서 자체 호스팅한다. next/font/google은 빌드할 때마다 Google Fonts에서
// CSS·글꼴 파일을 내려받는데, 그 응답 형식에 따라 빌드가 실패한 적이 있어(Turbopack "queries have exactly one entry")
// 빌드가 외부 서비스에 의존하지 않게 했다. 글꼴 파일과 유니코드 구간 분할은 Google Fonts와 같다.
// 화면 글꼴: Pretendard(가변 글꼴, 유니코드 구간별로 나뉘어 필요한 글자 파일만 내려받는다).
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/800.css";
import "@fontsource/noto-sans-kr/900.css";
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
    default: "Aegis 스터디 | 분야별 학습",
    template: "%s | Aegis 스터디",
  },
  description:
    "Python, 수학과 통계, 데이터 처리, 머신러닝, 딥러닝, 생성형 AI를 분야별로 학습하고 브라우저에서 실습하는 Aegis 스터디입니다.",
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
