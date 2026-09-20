import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build runs on GitHub-hosted runners (the OCI box only has 1GB RAM — not
  // enough headroom for `next build`). "standalone" bundles a minimal
  // server + pruned node_modules into .next/standalone so the OCI box only
  // ever has to run `node server.js`, never `npm install`/`next build`.
  output: "standalone",
  images: {
    // 콘텐츠 이미지는 전부 이 저장소 안의 로컬 파일이고 반입 전에 이미 적당한
    // 크기로 줄여둔다. Next의 실시간 이미지 최적화(sharp)는 CPU/메모리를
    // 꽤 쓰는데, OCI 박스가 1GB RAM뿐이라 그 비용을 감수할 이유가 없다 —
    // <Image>는 그대로 두어 레이아웃 시프트 방지·지연 로딩 이점만 취한다.
    unoptimized: true,
  },
};

export default nextConfig;
