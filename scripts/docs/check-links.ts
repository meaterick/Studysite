/** Check repository-local Markdown links and anchors; no external requests. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
function markdownFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? markdownFiles(p) : e.name.endsWith(".md") ? [p] : [];
  });
}

function withoutFences(text: string): string {
  let fence = "";
  return text.split(/\r?\n/).map(line => {
    const marker = line.trim().match(/^(`{3,}|~{3,})/);
    if (marker && (!fence || marker[1][0] === fence[0])) {
      fence = fence ? "" : marker[1];
      return "";
    }
    return fence ? "" : line;
  }).join("\n");
}

function anchors(text: string): Set<string> {
  const result = new Set<string>();
  const duplicates = new Map<string, number>();
  for (const line of withoutFences(text).split("\n")) {
    for (const m of line.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) result.add(m[1]);
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
    if (!match) continue;
    const heading = match[1].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/<[^>]*>/g, "");
    const slug = heading.toLowerCase().replace(/[^\p{L}\p{M}\p{N}_\-\s]/gu, "").replace(/\s/g, "-");
    const count = duplicates.get(slug) ?? 0;
    duplicates.set(slug, count + 1);
    result.add(count ? `${slug}-${count}` : slug);
  }
  return result;
}

const files = [path.join(root, "README.md"), ...markdownFiles(path.join(root, "docs"))];
const cache = new Map<string, Set<string>>();
let checked = 0;
const errors: string[] = [];
for (const file of files) {
  const text = withoutFences(fs.readFileSync(file, "utf8")).replace(/(`+)[^`]*?\1/g, "");
  for (const match of text.matchAll(/!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const url = match[1].replace(/^<|>$/g, "");
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) continue;
    checked++;
    const [location, fragment] = url.split("#");
    const target = location ? path.resolve(path.dirname(file), decodeURIComponent(location.split("?")[0])) : file;
    const context = `${path.relative(root, file).replace(/\\/g, "/")}: ${url}`;
    if (path.relative(root, target).startsWith("..") || !fs.existsSync(target)) {
      errors.push(`Missing local target: ${context}`);
      continue;
    }
    if (!fragment || fs.statSync(target).isDirectory()) continue;
    if (/^L\d+(?:-L\d+)?$/.test(fragment)) {
      const lineCount = fs.readFileSync(target, "utf8").split(/\r?\n/).length;
      if (Number(fragment.match(/\d+$/)?.[0]) > lineCount) errors.push(`Invalid source line: ${context}`);
    } else if (target.endsWith(".md")) {
      let ids = cache.get(target);
      if (!ids) { ids = anchors(fs.readFileSync(target, "utf8")); cache.set(target, ids); }
      if (!ids.has(decodeURIComponent(fragment))) errors.push(`Missing anchor: ${context}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log(`Checked ${checked} local links in ${files.length} Markdown files.`);
