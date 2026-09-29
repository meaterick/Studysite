import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// 사이트 전체의 Content-Security-Policy(보안 검토 P1-5). 스크립트·연결·폰트·이미지를 이 사이트 출처로만
// 제한해, 만에 하나 스크립트 주입이 생겨도 외부 스크립트를 불러오거나 외부로 데이터를 보내지 못하게 한다.
// - script-src 'unsafe-inline': Next.js가 페이지마다 넣는 인라인 스크립트(RSC 데이터)와 테마 초기화 스크립트 때문에
//   필요하다(nonce 방식은 모든 페이지를 요청마다 렌더링해야 해서 1GB 서버에 부담).
// - worker-src blob:: 코드 편집기(Monaco)가 blob URL로 워커를 만든다.
// - 개발 서버(next dev)는 eval과 웹소켓(HMR)을 쓰므로 그때만 허용한다.
const SITE_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Build runs on GitHub-hosted runners (the OCI box only has 1GB RAM — not
  // enough headroom for `next build`). "standalone" bundles a minimal
  // server + pruned node_modules into .next/standalone so the OCI box only
  // ever has to run `node server.js`, never `npm install`/`next build`.
  output: "standalone",
  experimental: {
    // 과제 제출(서버 액션)에 첨부 파일이 실린다: 파일 합계 9MB + 본문 여유분.
    // nginx의 client_max_body_size(.github/workflows/deploy.yml)와 함께 맞춰야 한다.
    serverActions: { bodySizeLimit: "10mb" },
    proxyClientMaxBodySize: "10mb",
  },
  async headers() {
    return [
      {
        // 모든 응답에 기본 보안 헤더: 위의 CSP, 다른 사이트가 이 사이트를 iframe에 넣지 못하게 하고(클릭재킹),
        // MIME 추측을 끄고, 외부로 나가는 Referer에 경로를 싣지 않는다. (HSTS는 HTTPS를 끝내는 nginx가 붙인다.)
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: SITE_CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // (아래 규칙이 위 규칙보다 뒤에 있어야 워커 응답의 CSP를 덮어쓴다.)
        // Python 실행 워커는 사용자(스터디원)가 쓴 코드를 돌린다. 워커 자신의 CSP로 Pyodide CDN 외의
        // 모든 연결·스크립트 로드를 막아, 코드가 로그인 쿠키로 이 사이트에 요청하지 못하게 한다.
        source: "/pyodide-worker.js",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src https://cdn.jsdelivr.net/pyodide/ 'unsafe-eval' 'wasm-unsafe-eval'; " +
              "connect-src https://cdn.jsdelivr.net/pyodide/; worker-src 'none'; frame-ancestors 'none'",
          },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
  images: {
    // 콘텐츠 이미지는 전부 이 저장소 안의 로컬 파일이고 반입 전에 이미 적당한
    // 크기로 줄여둔다. Next의 실시간 이미지 최적화(sharp)는 CPU/메모리를
    // 꽤 쓰는데, OCI 박스가 1GB RAM뿐이라 그 비용을 감수할 이유가 없다 —
    // <Image>는 그대로 두어 레이아웃 시프트 방지·지연 로딩 이점만 취한다.
    unoptimized: true,
  },
};

export default nextConfig;
