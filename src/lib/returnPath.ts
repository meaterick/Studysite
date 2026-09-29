/** 로그인 페이지 주소. 로그인하면 path로 돌아온다. */
export function loginHref(path: string): string {
  return `/login?from=${encodeURIComponent(path)}`;
}

/** 로그인한 사용자에게는 path를, 아니면 로그인 후 path로 돌아오는 로그인 페이지 주소를 준다. */
export function gatedHref(loggedIn: boolean, path: string): string {
  return loggedIn ? path : loginHref(path);
}

/**
 * 로그인 뒤 돌아갈 주소로는 이 사이트 안의 경로만 허용한다.
 * 브라우저·URL 파서는 탭·줄바꿈을 지우므로 "/\t/evil.example"이 "//evil.example"(다른 사이트)로
 * 바뀐다. 그래서 제어 문자·공백이 섞인 값은 거부하고, 실제로 풀어 본 주소가 같은 출처인지도 확인한다.
 */
export function safeReturnPath(value: string, fallback = "/account"): string {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f\s]/.test(path)) return fallback;
  try {
    const base = "https://return-path.invalid";
    const url = new URL(path, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
