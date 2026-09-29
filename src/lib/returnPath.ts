/** 로그인 페이지 주소. 로그인하면 path로 돌아온다. */
export function loginHref(path: string): string {
  return `/login?from=${encodeURIComponent(path)}`;
}

/** 로그인한 사용자에게는 path를, 아니면 로그인 후 path로 돌아오는 로그인 페이지 주소를 준다. */
export function gatedHref(loggedIn: boolean, path: string): string {
  return loggedIn ? path : loginHref(path);
}

/** Only permit an application-relative return path after authentication. */
export function safeReturnPath(value: string, fallback = "/account"): string {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  return path;
}
