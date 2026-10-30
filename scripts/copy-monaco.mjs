// 코드 편집기(Monaco)를 외부 CDN이 아니라 이 사이트에서 직접 제공하기 위해
// node_modules/monaco-editor/min/vs를 public/vendor/monaco/vs로 복사한다.
// (CDN이 오염되면 사이트 출처에서 임의 스크립트가 실행되므로 — 보안 검토 P1-5)
// `npm run dev`/`npm run build` 직전에 자동으로 실행된다(package.json의 predev/prebuild).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "node_modules", "monaco-editor", "min", "vs");
const dest = path.join(root, "public", "vendor", "monaco", "vs");
const version = JSON.parse(fs.readFileSync(path.join(root, "node_modules", "monaco-editor", "package.json"), "utf8")).version;
const stamp = path.join(dest, ".version");

if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === version) {
  console.log(`monaco-editor ${version} already copied`);
} else {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  fs.writeFileSync(stamp, version);
  console.log(`copied monaco-editor ${version} -> public/vendor/monaco/vs`);
}
