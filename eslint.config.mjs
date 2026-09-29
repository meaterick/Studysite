import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plain Node/CommonJS script run directly (PM2 config), not app source.
    "ecosystem.config.js",
    // Monaco editor files copied from node_modules at build time (scripts/copy-monaco.mjs).
    "public/vendor/**",
  ]),
]);

export default eslintConfig;
