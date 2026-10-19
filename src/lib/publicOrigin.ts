import "server-only";
import { configuredOrigin } from "./securityConfig";

/** Production redirects are pinned; never trust client-supplied Host/Forwarded headers. */
export function publicOrigin(req: Request): string {
  const origin = configuredOrigin();
  return origin ?? new URL(req.url).origin;
}
