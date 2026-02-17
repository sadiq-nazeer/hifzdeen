import "server-only";
import { createHmac, createCipheriv, createDecipheriv, randomBytes } from "crypto";

const COOKIE_NAME = "qf_session";
const MAX_AGE_SECONDS = 86400 * 7; // 7 days for session cookie presence; actual expiry from token

export type SessionTokens = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number;
  scope?: string;
};

function getSecret(): string {
  const secret = process.env.QF_OAUTH_COOKIE_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Missing QF_OAUTH_COOKIE_SECRET. Set it in .env.local for user OAuth.",
    );
  }
  return secret;
}

function deriveKey(secret: string): Buffer {
  return createHmac("sha256", secret).update("qf-session-v1").digest();
}

function encrypt(payload: SessionTokens, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const json = JSON.stringify(payload);
  const enc = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, enc]);
  return combined.toString("base64url");
}

function decrypt(value: string, key: Buffer): SessionTokens | null {
  try {
    const combined = Buffer.from(value, "base64url");
    if (combined.length < 12 + 16 + 1) return null;
    const iv = combined.subarray(0, 12);
    const tag = combined.subarray(12, 28);
    const enc = combined.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    const json = decipher.update(enc).toString("utf8") + decipher.final("utf8");
    const payload = JSON.parse(json) as SessionTokens;
    if (typeof payload.accessToken !== "string" || typeof payload.expiresAt !== "number") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function buildSessionCookieHeader(tokens: SessionTokens): string {
  const key = deriveKey(getSecret());
  const value = encrypt(tokens, key);
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (isProd) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function getSessionFromCookie(cookieHeader: string | null): SessionTokens | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const raw = match?.[1]?.trim();
  if (!raw) return null;
  try {
    const key = deriveKey(getSecret());
    return decrypt(raw, key);
  } catch {
    return null;
  }
}

/** Returns session from cookie or null if missing/invalid/not configured. Safe when user OAuth env is unset. */
export function safeGetSession(cookieHeader: string | null): SessionTokens | null {
  try {
    return getSessionFromCookie(cookieHeader);
  } catch {
    return null;
  }
}

export type IdTokenClaims = { name?: string; email?: string };

export function decodeIdTokenClaims(idToken: string | null): IdTokenClaims | null {
  if (!idToken) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    const claims = JSON.parse(payload) as Record<string, unknown>;
    const name = typeof claims.name === "string" ? claims.name : undefined;
    const email = typeof claims.email === "string" ? claims.email : undefined;
    return name !== undefined || email !== undefined ? { name, email } : null;
  } catch {
    return null;
  }
}

export function isSessionExpired(session: SessionTokens, bufferSeconds = 60): boolean {
  return session.expiresAt - bufferSeconds <= Math.floor(Date.now() / 1000);
}

export function buildClearSessionCookieHeader(): string {
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  return parts.join("; ");
}
