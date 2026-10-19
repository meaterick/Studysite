import "server-only";

const DEV_SECRET = "aegis-dev-session-secret-change-me";

export function signingKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32 || secret === DEV_SECRET || /^(change-me|your[-_ ])/i.test(secret))) {
    throw new Error("SESSION_SECRET must be a random secret of at least 32 characters in production");
  }
  return new TextEncoder().encode(secret || DEV_SECRET);
}

export function configuredOrigin(): string | null {
  const raw = process.env.PUBLIC_ORIGIN?.trim();
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash) return url.origin;
      if (process.env.NODE_ENV !== "production" && url.protocol === "http:" && !url.username && !url.password) return url.origin;
    } catch { /* Fail closed below in production. */ }
  }
  if (process.env.NODE_ENV === "production") throw new Error("PUBLIC_ORIGIN must be an HTTPS origin in production");
  return null;
}

export function validateSecurityConfig(): void {
  signingKey();
  configuredOrigin();
}
