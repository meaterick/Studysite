import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build runs on GitHub-hosted runners (the OCI box only has 1GB RAM — not
  // enough headroom for `next build`). "standalone" bundles a minimal
  // server + pruned node_modules into .next/standalone so the OCI box only
  // ever has to run `node server.js`, never `npm install`/`next build`.
  output: "standalone",
};

export default nextConfig;
