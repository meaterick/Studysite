import type { NextConfig } from "next";

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
        // 모든 응답에 기본 보안 헤더: 다른 사이트가 이 사이트를 iframe에 넣지 못하게 하고(클릭재킹),
        // MIME 추측을 끄고, 외부로 나가는 Referer에 경로를 싣지 않는다.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
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
