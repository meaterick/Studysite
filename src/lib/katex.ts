import "server-only";
import katex from "katex";

// 콘텐츠는 전부 이 저장소 안의 우리가 직접 쓴 정적 문자열이라 XSS 위험이 없고,
// 렌더링은 항상 서버에서(빌드/요청 시) 끝나 클라이언트에는 KaTeX JS가 전혀
// 전달되지 않는다 — 결과 HTML 문자열만 그대로 내려보낸다.
// KaTeX 파싱은 같은 입력에 매번 같은 결과를 내는데다 비용이 작지 않으므로,
// 동적 렌더링되는 페이지에서 매 요청마다 반복하지 않도록 캐시해둔다.
const mathCache = new Map<string, string>();

export function renderMath(tex: string, displayMode: boolean): string {
  const cacheKey = `${displayMode ? "1" : "0"}\u0000${tex}`;
  const cached = mathCache.get(cacheKey);
  if (cached !== undefined) return cached;
  let html: string;
  try {
    html = katex.renderToString(tex, {
      throwOnError: false,
      displayMode,
      strict: "ignore",
    });
  } catch {
    html = tex;
  }
  mathCache.set(cacheKey, html);
  return html;
}
