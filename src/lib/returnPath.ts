/** Only permit an application-relative return path after authentication. */
export function safeReturnPath(value: string, fallback = "/account"): string {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  return path;
}
